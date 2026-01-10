const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('Tháng 12.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Ghi ra file JSON
const output = {
    header: data[0],
    row3: data[3],
    row4: data[4],
    totalRows: data.length
};

fs.writeFileSync('debug_output.json', JSON.stringify(output, null, 2), 'utf8');
console.log('Da ghi ra file debug_output.json');
