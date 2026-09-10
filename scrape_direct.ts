import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

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
    if (rowIndex >= 1099 && rowIndex < 1123) {
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

    // 1. Core Comparison Data Rows (Row 5 to Row 1123)
    if (rowIndex >= 5 && rowIndex < 1123) {
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
    for (let i = sebaranIdx + 2; i <= sebaranIdx + 17; i++) {
      const row = rows[i];
      if (!row) continue;
      const tds = $(row).find('td, th').map((i, el) => $(el).text().trim()).get();
      if (tds.length < 8) continue;
      
      const pg = tds[2] || '';
      const calibrationClass = tds[4] || '';
      const dataType = tds[6] || '';
      
      if (pg && calibrationClass && (dataType === 'Aktual' || dataType === 'Actual')) {
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

  return {
    generatedAt: new Date().toISOString(),
    months: monthsCutDate,
    comparisonData,
    progressParameters,
    defects,
    curahDefects,
    lossesBanana,
    calibrationDistribution,
    source: "live_google_sheets"
  };
}

async function run() {
  try {
    const liveData = await getGoogleSheetData();
    
    // Save full data to data_cache.json at root (ignored by .gitignore)
    const cachePath = path.join(process.cwd(), 'data_cache.json');
    await fs.writeFile(cachePath, JSON.stringify(liveData), 'utf-8');
    
    // Create lightweight version for src/data.json by deleting daily arrays to stay under the 2MB platform sync limit
    const compactData = JSON.parse(JSON.stringify(liveData));
    if (compactData.comparisonData) {
      compactData.comparisonData.forEach((row: any) => {
        delete row.daily;
      });
    }
    if (compactData.progressParameters) {
      compactData.progressParameters.forEach((row: any) => {
        delete row.daily;
      });
    }
    
    const finalPath = path.join(process.cwd(), 'src/data.json');
    const tmpPath = path.join(process.cwd(), 'src/data.json.tmp');
    await fs.writeFile(tmpPath, JSON.stringify(compactData), 'utf-8');
    await fs.rename(tmpPath, finalPath);
    console.log("SUCCESSFULLY REGENERATED src/data.json and data_cache.json");
  } catch (err: any) {
    console.error("Scraper execution failed:", err.message);
    process.exit(1);
  }
}

run();
