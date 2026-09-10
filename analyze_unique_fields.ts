import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';

async function analyze() {
  try {
    const html = await fs.readFile('/dump.html', 'utf-8');
    const $ = cheerio.load(html);
    const rows = $('table tr').get();
    
    const groups = new Set<string>();
    const parameters = new Set<string>();
    const jenisData = new Set<string>();
    
    // We'll also collect some rows that mention "defect", "kalibrasi", "umur", "hand class"
    const progressRows: any[] = [];
    const defectRows: any[] = [];
    
    rows.forEach((row, rowIndex) => {
      const cells = $(row).find('td, th').map((colIndex, cell) => $(cell).text().trim()).get();
      if (cells.length < 5) return;
      
      // Look for group in cols 1-3
      let group = cells[2] || '';
      let param = cells[4] || cells[3] || '';
      let type = cells[6] || cells[5] || '';
      
      if (group) groups.add(group);
      if (param) parameters.add(param);
      if (type) jenisData.add(type);
      
      const rowText = cells.join(' | ');
      
      if (rowText.toLowerCase().includes('kalibrasi') || rowText.toLowerCase().includes('umur') || rowText.toLowerCase().includes('hand class')) {
        progressRows.push({ rowIndex, text: rowText.substring(0, 300) });
      }
      
      if (rowText.toLowerCase().includes('defect') || rowText.toLowerCase().includes('deffect') || rowText.toLowerCase().includes('plantation') || rowText.toLowerCase().includes('harvest')) {
        defectRows.push({ rowIndex, text: rowText.substring(0, 300) });
      }
    });
    
    console.log("Groups found:", Array.from(groups));
    console.log("Parameters found (all):", Array.from(parameters));
    console.log("Jenis Data found:", Array.from(jenisData));
    
    console.log("\nProgress Rows count:", progressRows.length);
    progressRows.slice(0, 15).forEach(r => console.log(`Row ${r.rowIndex}: ${r.text}`));
    
    console.log("\nDefect Rows count:", defectRows.length);
    defectRows.slice(0, 15).forEach(r => console.log(`Row ${r.rowIndex}: ${r.text}`));
    
  } catch (err: any) {
    console.error("Error analyzing:", err.message);
  }
}

analyze();
