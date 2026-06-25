const xlsx = require('xlsx');

const workbook = xlsx.readFile('/home/ubuntu/Descargas/EXCEL LICORERA A.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(data.slice(0, 5));
