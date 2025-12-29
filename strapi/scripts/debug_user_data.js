
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const PERSONNEL_FILE = '../../web/public/files/personellistesi.xls';

function parseHtmlXls(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(content);
    const table = dom.window.document.querySelector('table');
    const rows = Array.from(table.querySelectorAll('tr'));

    // Header is row 1
    if (rows.length <= 1) return [];

    const headers = Array.from(rows[1].querySelectorAll('td')).map(td => td.textContent.trim());

    for (let i = 2; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll('td'));
        const rowObj = {};
        cells.forEach((cell, index) => {
            if (headers[index]) rowObj[headers[index]] = cell.textContent.trim();
        });

        // Check for specific user
        if (rowObj['ADI'] === 'HALİL' && rowObj['SOYADI'] === 'ÇETİNKAYA') {
            console.log('Found User:', JSON.stringify(rowObj, null, 2));
        }
    }
}

parseHtmlXls(path.join(__dirname, PERSONNEL_FILE));
