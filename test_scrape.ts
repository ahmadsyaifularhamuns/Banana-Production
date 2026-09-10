import * as cheerio from 'cheerio';

async function test() {
  try {
    console.log("Fetching Google Sheet pubhtml...");
    const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vT35SLpw1g-zC-_PIzhOyM5m6kYajcbBEA8rOGdQs1_j6pCQl4DTDDnPtDMqSJYHg/pubhtml/sheet?headers=false&gid=1586056977", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    console.log("Response URL:", res.url);
    console.log("Response Status:", res.status);
    console.log("Response Headers:", Object.fromEntries(res.headers.entries()));
    const html = await res.text();
    console.log("Fetched. Length:", html.length);
    console.log("Fetched. Length:", html.length);
    const fs = await import('fs/promises');
    await fs.writeFile('/dump.html', html, 'utf-8');
    console.log("Wrote raw HTML to /dump.html");
    const $ = cheerio.load(html);
    
    console.log("Iframes:", $('iframe').map((i, el) => $(el).attr('src')).get());
    console.log("Scripts with src:", $('script[src]').map((i, el) => $(el).attr('src')).get());
    
    // Find script tags containing text
    $('script').each((i, el) => {
      const text = $(el).html() || '';
      console.log(`Script ${i} length: ${text.length}`);
      const keywords = ["Actual", "PG1", "GGP", "Box Packable", "Kalibrasi", "Hand Class", "Defect"];
      keywords.forEach(kw => {
        if (text.toLowerCase().includes(kw.toLowerCase())) {
          console.log(`  -> Found keyword "${kw}" in Script ${i}!`);
        }
      });
    });
    
    console.log("Page title:", $('title').text());
    console.log("Body Text Content (trimmed):", $('body').text().replace(/\s+/g, ' ').substring(0, 2000));
    console.log("Number of tables:", $('table').length);
    console.log("HTML classes on tables:", $('table').map((i, el) => $(el).attr('class')).get());
    console.log("Some headings:", $('h1, h2, h3').map((i, el) => $(el).text()).get());
    
    // Google Sheets pubhtml contains tabs (sheets). Let's see if there are multiple sheets or tables.
    const tabs = $('#sheet-menu li').map((i, el) => $(el).text().trim()).get();
    console.log("Tabs/Sheets found:", tabs);
    
    // Let's print out the tables and some row content.
    $('table').each((tableIndex, table) => {
      const sheetName = tabs[tableIndex] || `Sheet ${tableIndex + 1}`;
      console.log(`\n--- Sheet Table: ${sheetName} ---`);
      const rows = $(table).find('tr').get();
      console.log(`Total rows: ${rows.length}`);
      
      // Let's print the first 30 rows to see the column structure
      rows.slice(0, 45).forEach((row, rowIndex) => {
        const cells = $(row).find('td, th').map((colIndex, cell) => {
          return $(cell).text().trim();
        }).get();
        // Remove empty cells from the end for cleaner log
        while (cells.length > 0 && cells[cells.length - 1] === '') {
          cells.pop();
        }
        if (cells.length > 0) {
          console.log(`Row ${rowIndex}:`, cells.join(' | '));
        }
      });
    });
  } catch (err: any) {
    console.error("Error scraping:", err.message);
  }
}

test();
