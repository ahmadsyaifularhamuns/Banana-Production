import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./src/data.json', 'utf8'));
const sampleRows = data.comparisonData.filter(d => 
  d.group === 'PG1' && 
  (d.parameter.includes('BRUISE') || d.parameter.includes('POINTED') || d.parameter.includes('SCAR') || d.parameter.includes('LATEX'))
);

console.log('Found', sampleRows.length, 'sample rows:');
sampleRows.forEach(r => {
  console.log(`Group: ${r.group}, Parameter: ${r.parameter}, Unit: ${r.unit}, Type: ${r.dataType}`);
});
