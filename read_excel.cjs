const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('./29122025_Quan_Ly_Bai_Viet.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Write to JSON file for analysis
fs.writeFileSync('excel_data.json', JSON.stringify(data, null, 2));
console.log('Data written to excel_data.json');
console.log('Total rows:', data.length);
