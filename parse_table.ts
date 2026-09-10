import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';

async function parse() {
  try {
    const html = await fs.readFile('/dump.html', 'utf-8');
    const $ = cheerio.load(html);
    const rows = $('table tr').get();
    console.log(`Loaded ${rows.length} rows.`);

    // Write first 100 rows to a text file for inspection
    let output = '';
    rows.forEach((row, rowIndex) => {
      const cells = $(row).find('td, th').map((colIndex, cell) => {
        // preserve rowspan / colspan if any, or just get text
        return $(cell).text().trim();
      }).get();
      
      // Filter out entirely empty rows to save space
      const hasContent = cells.some(c => c !== '');
      if (hasContent) {
        output += `Row ${rowIndex}: ` + cells.map((c, i) => `[Col ${i}]: "${c}"`).join(' | ') + '\n';
      }
    });

    await fs.writeFile('parsed_rows_debug.txt', output, 'utf-8');
    console.log("Wrote parsed rows debug to parsed_rows_debug.txt. Total characters written:", output.length);

  } catch (err: any) {
    console.error("Error parsing:", err.message);
  }
}

parse();
