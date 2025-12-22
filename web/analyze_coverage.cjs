const fs = require('fs');
const path = require('path');

const covPath = path.join(__dirname, 'coverage/coverage-final.json');
if (!fs.existsSync(covPath)) {
    console.log('No coverage file found');
    process.exit(1);
}

const cov = JSON.parse(fs.readFileSync(covPath, 'utf8'));

let files = [];

Object.keys(cov).forEach(file => {
    const fileCov = cov[file];
    const stmtMap = fileCov.statementMap;
    const s = fileCov.s;

    let total = 0;
    let covered = 0;

    Object.keys(stmtMap).forEach(key => {
        total++;
        if (s[key] > 0) covered++;
    });

    if (total > 0) {
        files.push({
            file: path.relative(__dirname, file),
            pct: (covered / total) * 100,
            covered,
            total
        });
    }
});

// Sort by percentage (ascending)
files.sort((a, b) => a.pct - b.pct);

console.log('--- Low Coverage Files ---');
files.filter(f => f.pct < 90).forEach(f => {
    console.log(`${f.pct.toFixed(2)}% - ${f.file} (${f.covered}/${f.total})`);
});

const totalCovered = files.reduce((acc, f) => acc + f.covered, 0);
const totalStatements = files.reduce((acc, f) => acc + f.total, 0);
const totalPct = (totalCovered / totalStatements) * 100;

console.log('\n--- Total Coverage ---');
console.log(`${totalPct.toFixed(2)}% (${totalCovered}/${totalStatements})`);
