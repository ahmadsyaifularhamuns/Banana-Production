import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';

async function testDefects() {
  const html = await fs.readFile('/dump.html', 'utf-8');
  const $ = cheerio.load(html);
  const rows = $('table tr').get();
  
  const defects: any[] = [];
  
  rows.forEach((row, rowIndex) => {
    const tds = $(row).find('td, th').map((i, el) => $(el).text().trim()).get();
    if (tds.length < 8) return;
    
    // Look for defect rows. We saw:
    // Col 2: PG (e.g. PG1), Col 3: Loc (e.g. Plantation), Col 4: Rank, Col 5: Defect
    const pg = tds[2] || '';
    const loc = tds[3] || '';
    const rank = tds[4] || '';
    const name = tds[5] || '';
    
    // If rank is 1-5 and name is filled
    if (rank && ['1','2','3','4','5'].includes(rank) && name) {
      defects.push({
        rowIndex,
        pg,
        loc,
        rank: parseInt(rank, 10),
        name,
        monthlyValues: tds.slice(8, 20) // Jan to Dec values
      });
    }
  });
  
  console.log(`Successfully parsed ${defects.length} defect rows.`);
  console.log("\nUnique defect PGs:", Array.from(new Set(defects.map(d => d.pg))));
  console.log("Unique defect Locs:", Array.from(new Set(defects.map(d => d.loc))));
  
  console.log("\nSample defect rows:");
  defects.slice(0, 15).forEach(d => {
    console.log(`Row ${d.rowIndex}: [PG: ${d.pg}] [Loc: ${d.loc}] [Rank: ${d.rank}] [Name: ${d.name}] -> Jan-Jun: ${d.monthlyValues.slice(0, 6).join(', ')}`);
  });
}

testDefects();
