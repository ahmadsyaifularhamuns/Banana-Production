import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import webpush from 'web-push';
import 'dotenv/config';

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up VAPID Keys for Web Push
let vapidKeys: { publicKey: string; privateKey: string };
async function initVapid() {
  const vapidPath = path.join(process.cwd(), 'vapid_keys.json');
  try {
    const raw = await fs.readFile(vapidPath, 'utf-8');
    vapidKeys = JSON.parse(raw);
  } catch (e) {
    console.log("Generating new VAPID keys...");
    vapidKeys = webpush.generateVAPIDKeys();
    await fs.writeFile(vapidPath, JSON.stringify(vapidKeys), 'utf-8');
  }
  
  webpush.setVapidDetails(
    'mailto:ahmadsyaifularhamUNS@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log("VAPID Keys configured successfully.");
}

// Subscription storage
const subsPath = path.join(process.cwd(), 'push_subscriptions.json');

async function getSubscriptions(): Promise<any[]> {
  try {
    const raw = await fs.readFile(subsPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

async function saveSubscriptions(subs: any[]) {
  await fs.writeFile(subsPath, JSON.stringify(subs), 'utf-8');
}

async function sendWebPushNotification(title: string, body: string) {
  const subs = await getSubscriptions();
  console.log(`Sending Web Push notification to ${subs.length} subscribers...`);
  
  const payload = JSON.stringify({ title, body });
  const badSubs: string[] = [];
  
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, payload);
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        badSubs.push(sub.endpoint);
      } else {
        console.error("Error sending push to endpoint:", sub.endpoint, err.message);
      }
    }
  }));
  
  if (badSubs.length > 0) {
    console.log(`Cleaning up ${badSubs.length} expired subscriptions...`);
    const remaining = subs.filter(s => !badSubs.includes(s.endpoint));
    await saveSubscriptions(remaining);
  }
}

// Memory cache for Google Sheets data to ensure high-performance and rate-limit compliance
let memoryCache: any = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Memory cache for Evaluasi Plan spreadsheet
let evalMemoryCache: any = null;
let lastEvalCacheUpdate = 0;
const EVAL_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function fetchAndParseEvaluasiPlanData() {
  const urls = [
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS00_h5jW14QSGPcexbWsgKXRNjJNt0BdSrKaF0sxgpp7s2ZMxw7_x6HsbqrCigw/pub?output=csv&gid=1124326817",
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS00_h5jW14QSGPcexbWsgKXRNjJNt0BdSrKaF0sxgpp7s2ZMxw7_x6HsbqrCigw/pub?gid=1124326817&single=true&output=csv"
  ];

  let csvText = "";
  let lastErr: any = null;

  for (const url of urls) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          redirect: 'follow'
        });
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 100) {
            csvText = text;
            lastErr = null;
            break;
          }
        }
        lastErr = new Error(`Google Sheets responded with status ${res.status}`);
      } catch (err: any) {
        lastErr = err;
      }
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (csvText) break;
  }

  if (!csvText) {
    throw lastErr || new Error("Failed to fetch evaluasi plan spreadsheet data");
  }

  const rawLines = csvText.split(/\r?\n/);
  const rows = rawLines.map(parseCSVLine);

  const l13 = rows[13] || [];
  const l14 = rows[14] || [];

  const weekCols: { weekNum: number; monthLabel: string; colIdx: number }[] = [];
  for (let c = 40; c <= 92; c++) {
    const wStr = (l14[c] || "").trim();
    if (/^\d+$/.test(wStr)) {
      const wNum = parseInt(wStr, 10);
      let mLabel = (l13[c] || "").trim();
      if (!mLabel) {
        for (let k = c - 1; k >= 40; k--) {
          if ((l13[k] || "").trim()) {
            mLabel = (l13[k] || "").trim();
            break;
          }
        }
      }
      weekCols.push({ weekNum: wNum, monthLabel: mLabel, colIdx: c });
    }
  }

  const groupsMap: Record<string, {
    name: string;
    productsMap: Record<string, {
      name: string;
      unit: string;
      values: Record<string, Record<number, string>>;
    }>;
    productsList: {
      name: string;
      unit: string;
      values: Record<string, Record<number, string>>;
    }[];
  }> = {};

  const groupsOrder: string[] = [];

  for (let i = 15; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length <= 10) continue;
    let groupName = (r[8] || "").trim();
    if (groupName.toUpperCase() === "GGF TOTAL") {
      groupName = "GGF Total";
    }
    const jenisData = (r[9] || "").trim();
    const prodName = (r[10] || "").trim();
    const unit = (r[11] || "").trim();

    if (!groupName || !jenisData || !prodName || prodName === "0") continue;

    if (!groupsMap[groupName]) {
      groupsMap[groupName] = { name: groupName, productsMap: {}, productsList: [] };
      groupsOrder.push(groupName);
    }

    const g = groupsMap[groupName];
    if (!g.productsMap[prodName]) {
      const prodObj = { name: prodName, unit: unit, values: {} };
      g.productsMap[prodName] = prodObj;
      g.productsList.push(prodObj);
    }

    const prodObj = g.productsMap[prodName];
    if (!prodObj.values[jenisData]) {
      prodObj.values[jenisData] = {};
    }

    for (const wc of weekCols) {
      const rawVal = (r[wc.colIdx] || "").trim();
      prodObj.values[jenisData][wc.weekNum] = rawVal;
    }
  }

  const formattedGroups: Record<string, any> = {};
  for (const gName of groupsOrder) {
    formattedGroups[gName] = {
      name: gName,
      products: groupsMap[gName].productsList
    };
  }

  return {
    lastUpdated: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    weeks: weekCols.map(w => ({ weekNum: w.weekNum, monthLabel: w.monthLabel })),
    groups: groupsOrder,
    dataByGroup: formattedGroups
  };
}

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});


// Robust numeric parser for Indonesian localized Google Sheet formats
function parseNumericValue(val: string): number | null {
  const clean = (val || '').trim();
  if (!clean || clean === '-' || clean === '.' || clean === ',' || clean === '0' || clean === '') return null;
  
  let str = clean;
  if (str.includes(',')) {
    // Decimal comma, e.g. "15,4" -> "15.4"
    str = str.replace(/\./g, '').replace(/,/g, '.');
  } else {
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      // Thousand separator, e.g. "539.067" -> 539067
      str = str.replace(/\./g, '');
    } else if (parts.length > 2) {
      // Multiple dots, e.g. "1.965.750" -> 1965750
      str = str.replace(/\./g, '');
    } else {
      if (parts.length === 2 && parts[1].length === 3) {
        str = str.replace(/\./g, '');
      } else {
        str = str.replace(/,/g, '.');
      }
    }
  }
  
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed;
}

function toTitleCase(str: string): string {
  return str.trim().toLowerCase().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Helper function to parse Google Sheets cell B1 date
function parseUpdateDate(raw: string): string {
  if (!raw) return "16 Juni 2026";
  const clean = raw.trim();
  const match = clean.match(/^(\d+)[\s-]([a-zA-Z]+)(?:[\s-]\d+)?$/);
  if (!match) return "16 Juni 2026";
  const day = match[1];
  const monthAbbr = match[2].substring(0, 3).toLowerCase();
  const monthsMap: Record<string, string> = {
    'jan': 'Januari',
    'feb': 'Februari',
    'mar': 'Maret',
    'apr': 'April',
    'mei': 'Mei',
    'may': 'Mei',
    'jun': 'Juni',
    'jul': 'Juli',
    'agu': 'Agustus',
    'aug': 'Agustus',
    'sep': 'September',
    'okt': 'Oktober',
    'oct': 'Oktober',
    'nov': 'November',
    'des': 'Desember',
    'dec': 'Desember'
  };
  const monthName = monthsMap[monthAbbr] || match[2];
  return `${day} ${monthName} 2026`;
}

// Fallback to determine the last date based on weekly or daily data
function determineFallbackDate(comparisonData: any[]): string {
  let maxIdx = -1;
  if (comparisonData && Array.isArray(comparisonData)) {
    comparisonData.forEach(row => {
      if (row.dataType === 'Aktual' && row.daily && Array.isArray(row.daily)) {
        row.daily.forEach((val: any, idx: number) => {
          if (val !== null && val !== 0 && !isNaN(val)) {
            if (idx > maxIdx) maxIdx = idx;
          }
        });
      }
    });
  }

  if (maxIdx !== -1) {
    const startDate = new Date(2025, 11, 29, 12, 0, 0);
    const targetDate = new Date(startDate.getTime() + maxIdx * 24 * 60 * 60 * 1000);
    return formatIndonesianDate(targetDate);
  }

  // Check weekly
  let maxWeeklyIdx = -1;
  if (comparisonData && Array.isArray(comparisonData)) {
    comparisonData.forEach(row => {
      if (row.dataType === 'Aktual' && row.weekly && Array.isArray(row.weekly)) {
        row.weekly.forEach((val: any, idx: number) => {
          if (val !== null && val !== 0 && !isNaN(val)) {
            if (idx > maxWeeklyIdx) maxWeeklyIdx = idx;
          }
        });
      }
    });
  }

  if (maxWeeklyIdx !== -1) {
    const startDate = new Date(2025, 11, 29, 12, 0, 0);
    const targetDate = new Date(startDate.getTime() + (maxWeeklyIdx * 7 + 3) * 24 * 60 * 60 * 1000);
    return formatIndonesianDate(targetDate);
  }

  return "16 Juni 2026";
}

function formatIndonesianDate(date: Date): string {
  const day = date.getDate();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Function to fetch and parse Google Sheet
async function getGoogleSheetData() {
  console.log("Fetching live Google Sheet data...");
  const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vT35SLpw1g-zC-_PIzhOyM5m6kYajcbBEA8rOGdQs1_j6pCQl4DTDDnPtDMqSJYHg/pubhtml/sheet?headers=false&gid=1586056977", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  
  if (!res.ok) {
    throw new Error(`Google Sheets responded with status ${res.status}`);
  }

  const html = await res.text();
  
  // Explicitly check for Google's plain text Rate exceeded error
  if (html.toLowerCase().includes("rate exceeded") || html.toLowerCase().includes("rate_exceeded")) {
    throw new Error("Google Sheets API rate limit exceeded");
  }

  const $ = cheerio.load(html);
  const rows = $('table tr').get();
  
  if (rows.length === 0) {
    throw new Error("No table rows found in Google Sheets HTML response");
  }

  let currentGroup = '';
  let currentParam = '';
  let currentUnit = '';
  let currentCategory = '';

  const comparisonData: any[] = [];
  const progressParameters: any[] = [];
  const defects: any[] = [];
  const curahDefects: any[] = [];
  let inCurahSection = false;
  let currentDefectPg = '';
  let currentDefectCategory = '';
  
  const monthsCutDate = [
    'Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'Mei-26', 'Jun-26',
    'Jul-26', 'Agu-26', 'Sep-26', 'Okt-26', 'Nov-26', 'Des-26'
  ];

  rows.forEach((row, rowIndex) => {
    const tds = $(row).find('td, th').map((i, el) => $(el).text().trim()).get();
    if (tds.length < 8) return;

    const g = tds[2] || '';
    const p = tds[4] || '';
    const u = tds[5] || '';
    let type = tds[6] || '';

    // Check for Group / Parameter updates with special parsing logic for defects/diseases and calibration sections
    if (rowIndex >= 1099 && rowIndex < 1117) {
      // Calibration section
      if (g && g !== 'Group' && g !== 'SEBARAN KALIBRASI') {
        currentGroup = g;
      }
      if (p && p !== 'KALIBRASI') {
        currentParam = `Kalibrasi ${p}`;
      }
      currentUnit = '%';
    } else if (rowIndex >= 641 && rowIndex < 1099) {
      // Defects and diseases section
      if (g && g !== 'PG' && g !== '5 Besar Deffect') {
        currentGroup = g;
      }

      const sheetRowNum = parseInt(tds[0], 10);
      if (!isNaN(sheetRowNum) && sheetRowNum >= 650 && sheetRowNum <= 700) {
        // Top 5 Defects FB section
        const col3 = (tds[3] || '').trim();
        if (col3 && col3 !== 'Loc' && col3 !== 'KATEGORI' && col3 !== 'Jenis') {
          currentCategory = col3;
        }
        const baseParam = tds[5] || '';
        const rowDataType = tds[6] || '';

        // Override type for outer comparison block check
        type = rowDataType;

        currentParam = `${baseParam} - Deffect FB - ${currentCategory}`;
        currentUnit = '%';
      } else if (!isNaN(sheetRowNum) && sheetRowNum >= 706 && sheetRowNum <= 1015) {
        // Trend Deffect Curah section
        const col3 = tds[3] || '';
        const isRank = !isNaN(parseInt(col3, 10));
        let baseParam = '';
        let rowDataType = '';

        if (col3 && !isRank && col3 !== 'KATEGORI' && col3 !== 'Jenis') {
          currentCategory = toTitleCase(col3);
          baseParam = tds[5] || '';
          rowDataType = tds[6] || '';
        } else {
          baseParam = tds[4] || '';
          rowDataType = tds[5] || '';
        }

        // Override type for outer comparison block check
        type = rowDataType;

        currentParam = `${baseParam} - Deffect Curah - ${currentCategory}`;
        currentUnit = '%';
      } else if (!isNaN(sheetRowNum) && sheetRowNum >= 1021 && sheetRowNum <= 1100) {
        // Losses Banana row: unit is btg, parameter name appended with type and Losses
        const defectName = tds[5] || '';
        let baseParam = '';
        if (defectName && defectName !== 'Defect') {
          baseParam = defectName;
        } else if (p && p !== 'Rank') {
          baseParam = p;
        }
        const jenis = (tds[3] || '').toLowerCase();
        currentParam = `${baseParam} - ${jenis} - Losses`;
        currentUnit = 'btg';
      } else {
        // Top 5 Defects section
        const defectName = tds[5] || '';
        let baseParam = '';
        if (defectName && defectName !== 'Defect') {
          baseParam = defectName;
        } else if (p && p !== 'Rank') {
          baseParam = p;
        }
        currentParam = baseParam;
        currentUnit = '%';
      }
    } else {
      // Original core and progress ranges
      if (g && g !== 'Group' && g !== 'PG' && g !== 'Jenis data' && g !== '5 Besar Deffect') {
        currentGroup = g;
      }
      if (p && p !== 'Unit' && p !== 'Jenis data' && p !== 'Parameter') {
        currentParam = p;
      }
      if (u && u !== 'Unit') {
        currentUnit = u;
      }
    }

    // 1. Core Comparison Data Rows (Row 5 to Row 1145)
    if (rowIndex >= 5 && rowIndex < 1145) {
      if (type === 'Aktual' || type === 'Demand' || type === 'Rolling Forcast' || type === 'Budget') {
        // Monthly Cut Date
        const monthlyCutDate: (number | null)[] = [];
        for (let col = 8; col <= 19; col++) {
          monthlyCutDate.push(parseNumericValue(tds[col]));
        }
        const monthlyCutDateTotal = parseNumericValue(tds[20]);

        // Monthly Cut Week
        const monthlyCutWeek: (number | null)[] = [];
        for (let col = 22; col <= 33; col++) {
          monthlyCutWeek.push(parseNumericValue(tds[col]));
        }
        const monthlyCutWeekTotal = parseNumericValue(tds[34]);

        // Weekly
        const weekly: (number | null)[] = [];
        for (let col = 36; col <= 88; col++) {
          weekly.push(parseNumericValue(tds[col]));
        }
        const weeklyTotal = parseNumericValue(tds[89]);

        // Daily: Days 1 to 371 (Cols 91 to 461)
        const daily: (number | null)[] = [];
        for (let col = 91; col <= 461; col++) {
          daily.push(parseNumericValue(tds[col]));
        }

        comparisonData.push({
          group: currentGroup,
          parameter: currentParam,
          unit: currentUnit,
          dataType: type,
          monthlyCutDate,
          monthlyCutDateTotal,
          monthlyCutWeek,
          monthlyCutWeekTotal,
          weekly,
          weeklyTotal,
          daily
        });
      }
    }

    // 2. Progress Parameter Rows (Row 625 to Row 641)
    if (rowIndex >= 625 && rowIndex < 641) {
      if (type === 'Aktual' || type === 'Demand' || type === 'Rolling Forcast' || type === 'Budget') {
        // Monthly Cut Date
        const monthlyCutDate: (number | null)[] = [];
        for (let col = 8; col <= 19; col++) {
          monthlyCutDate.push(parseNumericValue(tds[col]));
        }
        // Weekly
        const weekly: (number | null)[] = [];
        for (let col = 36; col <= 88; col++) {
          weekly.push(parseNumericValue(tds[col]));
        }

        progressParameters.push({
          group: currentGroup,
          parameter: currentParam,
          unit: currentUnit,
          dataType: type,
          monthlyCutDate,
          weekly
        });
      }
    }

    // 3. Defects Section (Row 640 onwards)
    const firstFewJoined = tds.join(' ');
    if (firstFewJoined.toLowerCase().includes('losses banana')) {
      inCurahSection = false;
      return;
    }

    if (firstFewJoined.toLowerCase().includes('trend deffect curah')) {
      inCurahSection = true;
      return;
    }

    if (!inCurahSection) {
      const pg = tds[2] || '';
      const loc = tds[3] || '';
      const rank = tds[4] || '';
      const name = tds[5] || '';

      if (rank && ['1','2','3','4','5'].includes(rank) && name) {
        const monthlyValues: (number | null)[] = [];
        for (let col = 8; col <= 19; col++) {
          monthlyValues.push(parseNumericValue(tds[col]));
        }

        const weeklyValues: (number | null)[] = [];
        for (let col = 36; col <= 88; col++) {
          weeklyValues.push(parseNumericValue(tds[col]));
        }

        defects.push({
          pg,
          location: loc,
          rank: parseInt(rank, 10),
          defectName: name,
          monthly: monthlyValues,
          weekly: weeklyValues
        });
      }
    } else {
      // Parsing new Curah Defects
      let pg = tds[2] || '';
      let kat = tds[3] || '';
      
      if (pg && pg !== 'PG' && pg !== 'Group' && isNaN(parseInt(pg, 10))) {
        currentDefectPg = pg;
      }
      
      const katUpper = kat.toUpperCase();
      if (katUpper === 'PLANTATION' || katUpper === 'HARVEST' || katUpper === 'PACKING HOUSE') {
        currentDefectCategory = katUpper;
      }
      
      const aktualIdx = tds.findIndex(val => val === 'Aktual' || val === 'Actual');
      if (aktualIdx !== -1) {
        const name = tds[aktualIdx - 1];
        
        if (name && !name.toUpperCase().startsWith('TOTAL') && name.toUpperCase() !== 'CAUSE OF RIJECTION') {
          const startMonthlyCol = aktualIdx + 2;
          const monthlyValues: (number | null)[] = [];
          for (let col = startMonthlyCol; col < startMonthlyCol + 12; col++) {
            monthlyValues.push(parseNumericValue(tds[col]));
          }
          
          const startWeeklyCol = startMonthlyCol + 28;
          const weeklyValues: (number | null)[] = [];
          for (let col = startWeeklyCol; col < startWeeklyCol + 53; col++) {
            weeklyValues.push(parseNumericValue(tds[col]));
          }
          
          curahDefects.push({
            pg: currentDefectPg,
            category: currentDefectCategory,
            defectName: name,
            monthly: monthlyValues,
            weekly: weeklyValues
          });
        }
      }
    }
  });

  // 4. Parse Losses Banana Section
  const lossesBanana: any[] = [];
  let isParsingLosses = false;
  rows.forEach((row, rowIndex) => {
    const tds = $(row).find('td, th').map((i, el) => $(el).text().trim()).get();
    if (tds.length < 8) return;

    const group = tds[2] || '';
    const category = tds[3] || '';
    const initials = tds[4] || '';
    const cause = tds[5] || '';
    const dataType = tds[6] || '';

    if (group.includes("Losses Banana")) {
      isParsingLosses = true;
      return; // skip title row
    }

    if (isParsingLosses) {
      // If we hit an empty row or a different section, stop
      if (!group && !category && !initials && !cause) {
        isParsingLosses = false;
        return;
      }

      // Skip headers
      if (group === 'Group' && category === 'Jenis') {
        return;
      }

      if (initials && cause) {
        // Parse monthly values (Cols 8 to 19)
        const monthly: (number | null)[] = [];
        for (let col = 8; col <= 19; col++) {
          monthly.push(parseNumericValue(tds[col]));
        }

        // Parse weekly values (Cols 36 to 88)
        const weekly: (number | null)[] = [];
        for (let col = 36; col <= 88; col++) {
          weekly.push(parseNumericValue(tds[col]));
        }

        lossesBanana.push({
          group,
          category,
          initials,
          cause,
          dataType,
          monthly,
          weekly
        });
      }
    }
  });

  // 5. Parse Calibration Distribution Section
  const calibrationDistribution: any[] = [];
  let sebaranIdx = -1;
  rows.forEach((row, rowIndex) => {
    const tds = $(row).find('td, th').map((i, el) => $(el).text().trim()).get();
    if (tds.length >= 3 && tds[2] && tds[2].toUpperCase() === 'SEBARAN KALIBRASI') {
      sebaranIdx = rowIndex;
    }
  });

  if (sebaranIdx !== -1) {
    for (let i = sebaranIdx + 2; i <= sebaranIdx + 30; i++) {
      const row = rows[i];
      if (!row) continue;
      const tds = $(row).find('td, th').map((i, el) => $(el).text().trim()).get();
      if (tds.length < 8) continue;
      
      const pg = tds[2] || '';
      if (pg.toUpperCase().includes('SHOOTING') || (tds[3] && tds[3].toUpperCase().includes('SHOOTING'))) break;
      const calibrationClass = tds[4] || '';
      const dataType = tds[6] || '';
      
      if (pg && ['<42', '43-46', '>47', 'NR'].includes(calibrationClass) && (dataType === 'Aktual' || dataType === 'Actual')) {
        const monthlyValues: (number | null)[] = [];
        for (let col = 8; col <= 19; col++) {
          monthlyValues.push(parseNumericValue(tds[col]));
        }

        const weeklyValues: (number | null)[] = [];
        for (let col = 36; col <= 88; col++) {
          weeklyValues.push(parseNumericValue(tds[col]));
        }

        calibrationDistribution.push({
          pg,
          calibrationClass,
          dataType,
          monthly: monthlyValues,
          weekly: weeklyValues
        });
      }
    }
  }

  // Repair parent group data (e.g. GGP and GGF TOTAL) if masked as "###" in narrow sheet columns
  const repairDataRows = (rowsList: any[]) => {
    const sumValues = (...vals: (number | null)[]) => {
      const validVals = vals.filter(v => v !== null && !isNaN(v));
      if (validVals.length === 0) return null;
      return validVals.reduce((sum, v) => sum + v, 0);
    };

    const groups: Record<string, any[]> = {};
    rowsList.forEach((row) => {
      const key = `${row.parameter} ||| ${row.dataType}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    Object.entries(groups).forEach(([key, rows]) => {
      const firstRow = rows[0];
      if (firstRow && firstRow.unit === '%') return; // skip percent metrics

      const pg1 = rows.find(r => r.group === 'PG1');
      const pg2 = rows.find(r => r.group === 'PG2');
      const pg3 = rows.find(r => r.group === 'PG3');
      const pg4 = rows.find(r => r.group === 'PG4');
      const ggp = rows.find(r => r.group === 'GGP');
      const nsa = rows.find(r => r.group === 'NSA CG');
      const ggf = rows.find(r => r.group === 'GGF TOTAL');

      const arrayFields = ['monthlyCutDate', 'monthlyCutWeek', 'weekly', 'daily'];
      const totalFields = ['monthlyCutDateTotal', 'monthlyCutWeekTotal', 'weeklyTotal'];

      const isHanclass = firstRow && firstRow.parameter === 'Hanclass Panen';

      if (ggp) {
        arrayFields.forEach(field => {
          if (!ggp[field] || !Array.isArray(ggp[field])) return;
          for (let i = 0; i < ggp[field].length; i++) {
            if (ggp[field][i] === null) {
              const v1 = pg1?.[field]?.[i] ?? null;
              const v2 = pg2?.[field]?.[i] ?? null;
              const v3 = pg3?.[field]?.[i] ?? null;
              const v4 = pg4?.[field]?.[i] ?? null;
              
              let repaired: number | null = null;
              if (isHanclass) {
                // For Hanclass Panen, make it the average of PG1, PG2, PG3, PG4 that are above 5.0
                const vals = [v1, v2, v3, v4].filter(v => v !== null && !isNaN(v) && v > 5.0);
                repaired = vals.length > 0 ? vals.reduce((sum, v) => sum + v, 0) / vals.length : null;
              } else {
                repaired = sumValues(v1, v2, v3, v4);
              }
              if (repaired !== null) ggp[field][i] = repaired;
            }
          }
        });

        totalFields.forEach(field => {
          if (ggp[field] === null || ggp[field] === undefined) {
            const v1 = pg1?.[field] ?? null;
            const v2 = pg2?.[field] ?? null;
            const v3 = pg3?.[field] ?? null;
            const v4 = pg4?.[field] ?? null;
            
            let repaired: number | null = null;
            if (isHanclass) {
              const vals = [v1, v2, v3, v4].filter(v => v !== null && !isNaN(v) && v > 5.0);
              repaired = vals.length > 0 ? vals.reduce((sum, v) => sum + v, 0) / vals.length : null;
            } else {
              repaired = sumValues(v1, v2, v3, v4);
            }
            if (repaired !== null) ggp[field] = repaired;
          }
        });
      }

      if (ggf) {
        arrayFields.forEach(field => {
          if (!ggf[field] || !Array.isArray(ggf[field])) return;
          for (let i = 0; i < ggf[field].length; i++) {
            if (ggf[field][i] === null) {
              const vGGP = ggp?.[field]?.[i] ?? null;
              const vNSA = nsa?.[field]?.[i] ?? null;
              
              let repaired: number | null = null;
              if (isHanclass) {
                const vals = [vGGP, vNSA].filter(v => v !== null && !isNaN(v) && v > 5.0);
                repaired = vals.length > 0 ? vals.reduce((sum, v) => sum + v, 0) / vals.length : null;
              } else {
                repaired = sumValues(vGGP, vNSA);
              }
              if (repaired !== null) ggf[field][i] = repaired;
            }
          }
        });

        totalFields.forEach(field => {
          if (ggf[field] === null || ggf[field] === undefined) {
            const vGGP = ggp?.[field] ?? null;
            const vNSA = nsa?.[field] ?? null;
            
            let repaired: number | null = null;
            if (isHanclass) {
              const vals = [vGGP, vNSA].filter(v => v !== null && !isNaN(v) && v > 5.0);
              repaired = vals.length > 0 ? vals.reduce((sum, v) => sum + v, 0) / vals.length : null;
            } else {
              repaired = sumValues(vGGP, vNSA);
            }
            if (repaired !== null) ggf[field] = repaired;
          }
        });
      }
    });
  };

  repairDataRows(comparisonData);
  repairDataRows(progressParameters);

  let b1DateRaw = "";
  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const cells = $(rows[r]).find('td, th').map((i, el) => $(el).text().trim()).get();
    for (let c = 0; c < Math.min(10, cells.length); c++) {
      const val = cells[c];
      if (/^\d+-[a-zA-Z]{3}(?:-\d+)?$/.test(val) || /^\d+[\s-][a-zA-Z]{3,10}(?:[\s-]\d+)?$/.test(val)) {
        b1DateRaw = val;
        break;
      }
    }
    if (b1DateRaw) break;
  }
  const parsedB1Date = b1DateRaw ? parseUpdateDate(b1DateRaw) : null;

  return {
    generatedAt: new Date().toISOString(),
    months: monthsCutDate,
    comparisonData,
    progressParameters,
    defects,
    curahDefects,
    lossesBanana,
    calibrationDistribution,
    source: "live_google_sheets",
    lastUpdateDate: parsedB1Date || determineFallbackDate(comparisonData)
  };
}

app.use(express.json());

// Admin API to read file content
app.get("/api/admin/file", async (req, res) => {
  const relPath = req.query.path as string;
  const allowedFiles = ['server.ts', 'src/App.tsx', 'src/data.json', 'src/types.ts', 'metadata.json', 'src/index.css'];
  if (!allowedFiles.includes(relPath)) {
    return res.status(400).json({ error: "File tidak diizinkan untuk diakses" });
  }

  try {
    const fullPath = path.join(process.cwd(), relPath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return res.json({ path: relPath, content });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal membaca file: " + err.message });
  }
});

// Admin API to save file content
app.post("/api/admin/file/save", async (req, res) => {
  const { path: relPath, content } = req.body;
  const allowedFiles = ['server.ts', 'src/App.tsx', 'src/data.json', 'src/types.ts', 'metadata.json', 'src/index.css'];
  if (!allowedFiles.includes(relPath)) {
    return res.status(400).json({ error: "File tidak diizinkan untuk diakses" });
  }

  try {
    const fullPath = path.join(process.cwd(), relPath);
    await fs.writeFile(fullPath, content, 'utf-8');
    
    // If they updated data.json, update memoryCache too
    if (relPath === 'src/data.json') {
      try {
        memoryCache = JSON.parse(content);
        lastCacheUpdate = Date.now();
      } catch (parseErr) {
        console.warn("Updated data.json is not valid JSON, memoryCache not updated directly.");
      }
    }

    return res.json({ success: true, message: `File ${relPath} berhasil disimpan dan diterapkan!` });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal menyimpan file: " + err.message });
  }
});

// REST API endpoint for AI analysis of banana production problems
app.post("/api/analyze", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Pertanyaan tidak boleh kosong" });
  }

  try {
    let dataContext = "";
    try {
      const dataPath = path.join(process.cwd(), 'src/data.json');
      const rawData = await fs.readFile(dataPath, 'utf-8');
      const parsed = JSON.parse(rawData);
      
      // Let's summarize defects and main parameters to keep the context size optimal and super fast
      const mainParams = parsed.comparisonData.filter((item: any) => 
        ['Box Packable', 'Harvest', 'Bunchweight', 'Recovery'].includes(item.parameter)
      );
      
      dataContext = `
Data Ringkasan Produksi Aktual & Target (GGP/PG1/PG2/PG3/PG4/NSA CG):
${mainParams.map((item: any) => {
  const lastWeekly = item.weekly ? item.weekly.filter((v: any) => v !== null).slice(-5) : [];
  const lastMonthly = item.monthlyCutDate ? item.monthlyCutDate.filter((v: any) => v !== null).slice(-3) : [];
  return `- Group: ${item.group}, Parameter: ${item.parameter}, Unit: ${item.unit}, Tipe: ${item.dataType}
  * 5 Minggu Terakhir: ${lastWeekly.join(', ')}
  * 3 Bulan Terakhir: ${lastMonthly.join(', ')}`;
}).join('\n')}

Top 5 Defects (Masalah Kualitas/Kerusakan di Lapangan):
${parsed.defects ? parsed.defects.map((d: any) => `- PG: ${d.pg}, Lokasi: ${d.location}, Rank: ${d.rank}, Jenis Cacat: ${d.defectName}`).join('\n') : 'Tidak ada data deffect'}
`;
    } catch (err) {
      console.error("Gagal memuat data.json untuk asisten AI:", err);
      dataContext = "Data produksi tidak dapat dimuat saat ini.";
    }

    const systemInstruction = `
Anda adalah seorang **Senior PPIC Banana Production Analyst** yang bekerja untuk perkebunan pisang terkemuka (Great Giant Pineapple - GGP, PG1, PG2, PG3, PG4, NSA CG).
Tugas Anda adalah menganalisis masalah produksi pisang, menjelaskan korelasi antar parameter (misalnya hubungan Bunchweight dengan Box Packable, pengaruh defek terhadap target, dll.), memberikan rekomendasi tindakan korektif di kebun maupun pabrik pengemasan (packing house), serta menjawab pertanyaan operasional harian atau taktis dari tim lapangan.

Gunakan data ringkasan produksi berikut untuk memberikan konteks akurat bila relevan dengan pertanyaan user:
${dataContext}

Aturan Jawaban:
1. Jawablah dalam Bahasa Indonesia yang profesional, ramah, dan solutif.
2. Jelaskan dengan istilah agrikultur/PPIC yang mudah dimengerti (seperti Bunchweight, Box Packable, Recovery, Defect/cacat seperti sunburn, kerusakan mekanis, thrips, crown rot, dll.).
3. Berikan analisis berbasis data yang ada jika memungkinkan, dan sertakan langkah-langkah konkret atau rekomendasi untuk mengatasi masalah tersebut.
4. Gunakan pemformatan Markdown yang bersih (seperti bullet points, bold text) agar nyaman dibaca.
`;

    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.1-pro-preview"
    ];

    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Mencoba memproses menggunakan model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: question,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });
        if (response && response.text) {
          console.log(`Sukses memproses menggunakan model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} gagal:`, err.message || err);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Semua sistem analisis PPIC BANANA AI sedang sibuk atau tidak merespons saat ini. Silakan coba sesaat lagi.");
    }

    return res.json({ answer: response.text });
  } catch (error: any) {
    console.error("AI Assistant API Error:", error);
    return res.status(500).json({ error: "Sistem PPIC BANANA AI gagal memproses analisis karena kendala koneksi atau konfigurasi sistem. Silakan coba beberapa saat lagi." });
  }
});

// Subscription APIs for Web Push Notifications
app.get('/api/notifications/vapid-public-key', async (req, res) => {
  if (!vapidKeys) await initVapid();
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/notifications/subscribe', async (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) {
    return res.status(400).json({ error: "Invalid subscription details" });
  }
  
  const subs = await getSubscriptions();
  const filtered = subs.filter(s => s.endpoint !== sub.endpoint);
  filtered.push(sub);
  await saveSubscriptions(filtered);
  
  console.log(`New push subscription registered. Total subscribers: ${filtered.length}`);
  res.status(201).json({ status: "success" });
});

// --- System Configuration (Maintenance Mode & Force Logout) ---
const systemConfigPath = path.join(process.cwd(), 'system_config.json');

async function getSystemConfig(): Promise<{ isUnderMaintenance: boolean; forceLogoutTimestamp: number }> {
  try {
    const raw = await fs.readFile(systemConfigPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      isUnderMaintenance: false,
      forceLogoutTimestamp: 0
    };
  }
}

async function saveSystemConfig(cfg: { isUnderMaintenance: boolean; forceLogoutTimestamp: number }) {
  try {
    await fs.writeFile(systemConfigPath, JSON.stringify(cfg), 'utf-8');
  } catch (e) {
    console.error("Failed to save system config:", e);
  }
}

app.get("/api/system-status", async (req, res) => {
  const cfg = await getSystemConfig();
  res.json(cfg);
});

app.post("/api/admin/system-control", async (req, res) => {
  const { isUnderMaintenance, forceLogout } = req.body || {};
  let cfg = await getSystemConfig();
  
  if (typeof isUnderMaintenance === 'boolean') {
    cfg.isUnderMaintenance = isUnderMaintenance;
  }
  if (forceLogout) {
    cfg.forceLogoutTimestamp = Date.now();
  }
  
  await saveSystemConfig(cfg);
  res.json({ status: "success", config: cfg });
});

// REST API endpoint to retrieve processed data
app.get("/api/data", async (req, res) => {
  const now = Date.now();
  const forceRefresh = req.query.refresh === 'true';
  
  // Use memory cache if it's fresh and not a forced refresh
  if (!forceRefresh && memoryCache && (now - lastCacheUpdate < CACHE_DURATION)) {
    return res.json({ ...memoryCache, source: "memory_cache" });
  }

  try {
    const liveData = await getGoogleSheetData();
    memoryCache = liveData;
    lastCacheUpdate = now;
    
    // Asynchronously write to local disk cache using an atomic rename to prevent truncation/corruption on restarts.
    // We write to root data_cache.json which is listed in .gitignore, so it won't trigger watches or sync limits.
    (async () => {
      const tmpPath = path.join(process.cwd(), 'data_cache.json.tmp');
      const finalPath = path.join(process.cwd(), 'data_cache.json');
      await fs.writeFile(tmpPath, JSON.stringify(liveData), 'utf-8');
      await fs.rename(tmpPath, finalPath);
    })().catch(err => console.error("Disk cache write error:", err.message));

    return res.json(liveData);
  } catch (err: any) {
    console.error("Live scrape failed, trying disk cache fallback...", err.message);
    
    // Fallback to local data_cache.json or src/data.json static pre-render
    try {
      let rawStatic = '';
      let isFallback = false;
      try {
        rawStatic = await fs.readFile(path.join(process.cwd(), 'data_cache.json'), 'utf-8');
      } catch (e) {
        rawStatic = await fs.readFile(path.join(process.cwd(), 'src/data.json'), 'utf-8');
        isFallback = true;
      }
      const parsedStatic = JSON.parse(rawStatic);
      if (!parsedStatic.lastUpdateDate) {
        parsedStatic.lastUpdateDate = determineFallbackDate(parsedStatic.comparisonData);
      }
      
      // Update memory cache so we don't spam the disk on errors
      memoryCache = parsedStatic;
      lastCacheUpdate = now;

      return res.json({
        ...parsedStatic,
        source: isFallback ? "disk_cache_fallback_static" : "disk_cache_fallback",
        error: err.message
      });
    } catch (fallbackErr: any) {
      console.error("Critical: Disk cache fallback also failed!", fallbackErr.message);
      return res.status(500).json({ 
        error: "Failed to fetch live data or load cached fallback",
        details: err.message
      });
    }
  }
});

// REST API endpoint for Evaluasi Plan spreadsheet
app.get("/api/evaluasi-plan", async (req, res) => {
  const now = Date.now();
  const forceRefresh = req.query.refresh === 'true';

  if (!forceRefresh && evalMemoryCache && (now - lastEvalCacheUpdate < EVAL_CACHE_DURATION)) {
    return res.json({ ...evalMemoryCache, source: "memory_cache" });
  }

  try {
    const data = await fetchAndParseEvaluasiPlanData();
    evalMemoryCache = data;
    lastEvalCacheUpdate = now;
    try {
      await fs.writeFile(path.join(process.cwd(), 'eval_plan_cache.json'), JSON.stringify(data), 'utf-8');
    } catch (e) {}
    return res.json({ ...data, source: "live_sheet" });
  } catch (err: any) {
    console.error("Failed to fetch evaluasi-plan sheet:", err.message);
    if (evalMemoryCache) {
      return res.json({ ...evalMemoryCache, source: "memory_cache_fallback", error: err.message });
    }
    try {
      const diskRaw = await fs.readFile(path.join(process.cwd(), 'eval_plan_cache.json'), 'utf-8');
      const diskData = JSON.parse(diskRaw);
      evalMemoryCache = diskData;
      return res.json({ ...diskData, source: "disk_cache_fallback", error: err.message });
    } catch (e) {}

    return res.status(500).json({ error: "Gagal memuat data evaluasi plan: " + err.message });
  }
});

let lastKnownUpdateDate = '';

// Load the last known update date on startup
async function initLastKnownDate() {
  try {
    const datePath = path.join(process.cwd(), 'last_known_update.txt');
    lastKnownUpdateDate = await fs.readFile(datePath, 'utf-8');
    lastKnownUpdateDate = lastKnownUpdateDate.trim();
  } catch (e) {
    try {
      const cachePath = path.join(process.cwd(), 'data_cache.json');
      const cacheRaw = await fs.readFile(cachePath, 'utf-8');
      const cache = JSON.parse(cacheRaw);
      lastKnownUpdateDate = cache.lastUpdateDate || '';
    } catch (err) {
      lastKnownUpdateDate = '';
    }
  }
  console.log("Last known sheet update date initialized to:", lastKnownUpdateDate);
}

// Background poller to check Google Sheets for updates even when browser is closed
async function checkSheetForUpdates() {
  try {
    console.log("[Background Server Poller] Checking Google Sheets for background updates...");
    const liveData = await getGoogleSheetData();
    const newDate = liveData.lastUpdateDate;
    
    // Always keep memoryCache and disk cache updated with fresh scraped data
    memoryCache = liveData;
    lastCacheUpdate = Date.now();
    const finalPath = path.join(process.cwd(), 'data_cache.json');
    await fs.writeFile(finalPath, JSON.stringify(liveData), 'utf-8');

    if (newDate && lastKnownUpdateDate && newDate !== lastKnownUpdateDate) {
      console.log(`[Background Server Poller] NEW UPDATE DETECTED! Old: ${lastKnownUpdateDate}, New: ${newDate}`);
      
      // Save last known date
      await fs.writeFile(path.join(process.cwd(), 'last_known_update.txt'), newDate, 'utf-8');
      
      // Send Web Push notification to all subscribed browsers
      const notificationMessage = `Terdapat update aktual todate ${newDate}`;
      await sendWebPushNotification('Pembaruan Data PPIC BANANA', notificationMessage);
      
      lastKnownUpdateDate = newDate;
    } else if (newDate && !lastKnownUpdateDate) {
      lastKnownUpdateDate = newDate;
      await fs.writeFile(path.join(process.cwd(), 'last_known_update.txt'), newDate, 'utf-8');
    } else {
      console.log("[Background Server Poller] Live data refreshed into cache (same date or no date change).");
    }
  } catch (err: any) {
    console.error("[Background Server Poller] Background sync check failed:", err.message);
  }
}

// Mounting Vite Development Server Middleware / serving production static files
async function startServer() {
  // Initialize VAPID Keys and Last Known Date
  await initVapid();
  await initLastKnownDate();

  // Run initial background check on startup
  checkSheetForUpdates().catch(err => console.error("Initial sheet check failed:", err));

  // Run periodic Google Sheet check every 10 minutes
  setInterval(() => {
    checkSheetForUpdates().catch(err => console.error("Periodic background check failed:", err));
  }, 10 * 60 * 1000);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
