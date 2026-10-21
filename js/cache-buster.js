/**
 * Тестовый запуск: применяет cache-buster ко всем HTML файлам
 * и выводит результат для проверки.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TARGET_DIR = process.argv[2] || '.';
const DEPLOY_DATE = process.argv[3] || new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

function fileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

function addVersionToHtml(html, dir, assetPath) {
    if (/^(https?:|data:|\/\/)/.test(assetPath)) return html;
    // Извлекаем path без query string для поиска файла
    const cleanPath = assetPath.split('?')[0];
    const fullPath = path.resolve(dir, cleanPath);
    if (!fs.existsSync(fullPath)) return html;
    const hash = fileHash(fullPath);
    // Убираем старый ?v=..., если есть, чтобы не накапливать несколько параметров
    const baseAsset = assetPath.replace(/[?&]v=[^&"]*/g, '');
    const separator = baseAsset.includes('?') ? '&' : '?';
    const newAsset = baseAsset + separator + 'v=' + hash;
    const escaped = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('((?:href|src)=["\x27])' + escaped + '(["\x27])', 'g');
    return html.replace(re, '$1' + newAsset + '$2');
}

function updateContentVersionMeta(html) {
    const replacement = '<meta name="content-version" content="' + DEPLOY_DATE + '" />';
    const metaRe = /<meta\s+name=["']content-version["'][^>]*\/?>/i;
    if (metaRe.test(html)) {
        return html.replace(metaRe, replacement);
    }
    const headIdx = html.indexOf('</head>');
    if (headIdx !== -1) {
        return html.slice(0, headIdx) + '\n    ' + replacement + '\n' + html.slice(headIdx);
    }
    return html;
}

function processHtmlFile(filePath) {
    let html = fs.readFileSync(filePath, 'utf8');
    let dir = path.dirname(filePath);

    // 1. Обновляем content-version
    html = updateContentVersionMeta(html);

    // 2. Добавляем ?v= к CSS и JS ссылкам
    const re = /((?:href|src)=["'])([^"']*?\.css[^"']*|[^"']*?\.js[^"']*)(["'])/gi;
    let m;
    const matches = [];
    while ((m = re.exec(html)) !== null) {
        if (/^(https?:|data:|\/\/)/.test(m[2])) continue;
        matches.push(m[2]);
    }

    for (let i = 0; i < matches.length; i++) {
        html = addVersionToHtml(html, dir, matches[i]);
    }

    // 3. Добавляем ?v= к изображениям контента (news, announcements)
    const imgRe = /((?:href|src)=["'])([^"']*?(?:assets\/images\/news|assets\/images\/announcements)[^"']*)/gi;
    let imgM;
    const imgMatches = [];
    while ((imgM = imgRe.exec(html)) !== null) {
        if (/^(https?:|data:|\/\/)/.test(imgM[2])) continue;
        imgMatches.push(imgM[2]);
    }
    for (let i = 0; i < imgMatches.length; i++) {
        html = addVersionToHtml(html, dir, imgMatches[i]);
    }

    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Updated: ' + path.relative(TARGET_DIR, filePath));
}

function walkDir(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.github') continue;
            results = results.concat(walkDir(fullPath));
        } else if (entry.name.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

function main() {
    console.log('Cache buster: ' + TARGET_DIR + ' (deploy date: ' + DEPLOY_DATE + ')');
    const files = walkDir(TARGET_DIR);
    console.log('Found ' + files.length + ' HTML files\n');

    let updated = 0;
    for (let i = 0; i < files.length; i++) {
        processHtmlFile(files[i]);
        updated++;
    }

    console.log('\nUpdated: ' + updated + ' files');
}

main();
