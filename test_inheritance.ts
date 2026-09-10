import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';

async function testInheritance() {
  const html = await fs.readFile('/dump.html', 'utf-8');
  const $ = cheerio.load(html);
  const rows = $('table tr').get();
  
  let currentGroup = '';
  let currentParam = '';
  let currentUnit = '';
  
  const parsed: any[] = [];
  
  rows.forEach((row, rowIndex) => {
    // get all tds and ths
    const tds = $(row).find('td, th').map((i, el) => $(el).text().trim()).get();
    if (rowIndex < 15) {
      console.log(`Row ${rowIndex} length: ${tds.length}, Col 2: "${tds[2]}", Col 4: "${tds[4]}", Col 6: "${tds[6]}"`);
    }
    if (tds.length < 7) return;
    
    // We see: Col 0: index, Col 2: Group, Col 3: empty, Col 4: Parameter, Col 5: Unit, Col 6: Jenis data
    const g = tds[2] || '';
    const p = tds[4] || '';
    const u = tds[5] || '';
    const type = tds[6] || '';
    
    if (g && g !== 'Group' && g !== 'PG' && g !== 'Jenis data') currentGroup = g;
    if (p && p !== 'Unit' && p !== 'Jenis data' && p !== 'Parameter') currentParam = p;
    if (u && u !== 'Unit') currentUnit = u;
    
    if (type === 'Aktual' || type === 'Demand' || type === 'Rolling Forcast' || type === 'Budget') {
      parsed.push({
        rowIndex,
        group: currentGroup,
        parameter: currentParam,
        unit: currentUnit,
        type,
        tds: tds.slice(0, 15) // first 15 cols
      });
    }
  });
  
  console.log(`Successfully parsed ${parsed.length} data rows.`);
  console.log("\nSample rows 0 to 15:");
  parsed.slice(0, 15).forEach(p => {
    console.log(`Row ${p.rowIndex} [Group: ${p.group}] [Param: ${p.parameter}] [Unit: ${p.unit}] [Type: ${p.type}] -> Jan-Jun: ${p.tds.slice(8, 14).join(', ')}`);
  });
  
  console.log("\nSample rows 40 to 55:");
  parsed.slice(40, 55).forEach(p => {
    console.log(`Row ${p.rowIndex} [Group: ${p.group}] [Param: ${p.parameter}] [Unit: ${p.unit}] [Type: ${p.type}] -> Jan-Jun: ${p.tds.slice(8, 14).join(', ')}`);
  });
}

testInheritance();
