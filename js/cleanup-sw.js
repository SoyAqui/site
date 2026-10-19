// Удаляет <script src="sw-register.js..."> из всех HTML
const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', '.git', '.github'].includes(entry.name)) continue;
            results.push(...walkDir(fullPath));
        } else if (entry.name.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

// Убираем и ../sw-register.js и sw-register.js
const re = /<script\s+src="(?:\.\.\/)?sw-register\.js[^"]*"[^>]*><\/script>\s*\n?/gi;

for (const file of walkDir('.')) {
    let html = fs.readFileSync(file, 'utf8');
    const before = html;
    html = html.replace(re, '');
    if (html !== before) {
        fs.writeFileSync(file, html, 'utf8');
        console.log('Cleaned: ' + file);
    }
}
