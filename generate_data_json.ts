import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

function parseNumericValue(val: string): number | null {
  const clean = (val || '').trim();
  if (!clean || clean === '-' || clean === '.' || clean === ',' || clean === '0' || clean === '') return null;
  
  let str = clean;
  if (str.includes(',')) {
    // Localized decimal comma
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
      // Single dot, e.g. "10.5" or "1.5". Check if other daily values or context suggest thousands
      // If the integer part is small, e.g. 1.832 (thousands), let's parse as thousands if it has 3 digits after the dot.
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

async function generate() {
  try {
    console.log("Starting full parse of Google Sheets html...");
    const html = await fs.readFile('/dump.html', 'utf-8');
    const $ = cheerio.load(html);
    const rows = $('table tr').get();
    console.log(`Loaded ${rows.length} rows.`);

    let currentGroup = '';
    let currentParam = '';
    let currentUnit = '';
    let currentCategory = '';

    const comparisonData: any[] = [];
    const progressParameters: any[] = [];
    const defects: any[] = [];

    // Let's parse month headers from row index 3
    const headerCols = $(rows[3]).find('td, th').map((i, el) => $(el).text().trim()).get();
    
    // Monthly (Cut Date) months: Col 8 (Jan-26) to Col 19 (Des-26)
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

      // 1. Core Comparison Data Rows (Row 6 to Row 1123)
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

          // Weekly: Weeks 1 to 53 (Cols 36 to 88)
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
      // Look for defect rows: Col 2: PG (e.g. PG1), Col 3: Loc (e.g. Plantation), Col 4: Rank, Col 5: Defect
      const pg = tds[2] || '';
      const loc = tds[3] || '';
      const rank = tds[4] || '';
      const name = tds[5] || '';

      if (rank && ['1','2','3','4','5'].includes(rank) && name) {
        // Monthly values from Col 8 to Col 19
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

        if (ggp) {
          arrayFields.forEach(field => {
            if (!ggp[field] || !Array.isArray(ggp[field])) return;
            for (let i = 0; i < ggp[field].length; i++) {
              if (ggp[field][i] === null) {
                const v1 = pg1?.[field]?.[i] ?? null;
                const v2 = pg2?.[field]?.[i] ?? null;
                const v3 = pg3?.[field]?.[i] ?? null;
                const v4 = pg4?.[field]?.[i] ?? null;
                const repaired = sumValues(v1, v2, v3, v4);
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
              const repaired = sumValues(v1, v2, v3, v4);
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
                const repaired = sumValues(vGGP, vNSA);
                if (repaired !== null) ggf[field][i] = repaired;
              }
            }
          });

          totalFields.forEach(field => {
            if (ggf[field] === null || ggf[field] === undefined) {
              const vGGP = ggp?.[field] ?? null;
              const vNSA = nsa?.[field] ?? null;
              const repaired = sumValues(vGGP, vNSA);
              if (repaired !== null) ggf[field] = repaired;
            }
          });
        }
      });
    };

    repairDataRows(comparisonData);
    repairDataRows(progressParameters);

    const finalJSON = {
      generatedAt: new Date().toISOString(),
      months: monthsCutDate,
      comparisonData,
      progressParameters,
      defects,
      lossesBanana
    };

    // Ensure src directory exists
    await fs.mkdir('src', { recursive: true });
    await fs.writeFile('src/data.json.tmp', JSON.stringify(finalJSON), 'utf-8');
    await fs.rename('src/data.json.tmp', 'src/data.json');
    
    console.log("SUCCESS!");
    console.log(`- Comparison rows parsed: ${comparisonData.length}`);
    console.log(`- Progress parameter rows parsed: ${progressParameters.length}`);
    console.log(`- Defect rows parsed: ${defects.length}`);
    console.log(`- Losses Banana rows parsed: ${lossesBanana.length}`);
    console.log("Wrote compiled data to src/data.json");

  } catch (err: any) {
    console.error("Error generating static data:", err.message);
  }
}

generate();
