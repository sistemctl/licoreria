const xlsx = require('xlsx');

const workbook = xlsx.readFile('/home/ubuntu/Descargas/EXCEL LICORERA A.xlsx');
for (const sheetName of workbook.SheetNames) {
  console.log('Sheet:', sheetName);
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  console.log(`Found ${data.length} rows.`);
  if (data.length > 0) {
    console.log('Sample data:', data.slice(0, 3));
  }
}
