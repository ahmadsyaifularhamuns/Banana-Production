import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';

async function main() {
  const html = await fs.readFile('/dump.html', 'utf-8');
  const $ = cheerio.load(html);
  
  const trs = $('table tr').get();
  
  const startIndex = 1012; // row with "Losses Banana"
  
  console.log("Analyzing all remaining rows in sheet:");
  for (let i = startIndex; i < trs.length; i++) {
    const tds = $(trs[i]).find('td, th').map((idx, el) => $(el).text().trim()).get();
    if (tds.length < 8) continue;
    const group = tds[2] || '';
    const jenis = tds[3] || '';
    const inisial = tds[4] || '';
    const penyebab = tds[5] || '';
    
    if (group || jenis || inisial || penyebab) {
      console.log(`Row ${i}: group=${group}, jenis=${jenis}, inisial=${inisial}, penyebab=${penyebab}`);
    }
  }
}

main();
