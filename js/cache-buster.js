/**
 * cache-buster.js
 * ----------------
 * Добавляет к CSS и JS в HTML файлах параметр ?v=<hash>.
 * Hash вычисляется из содержимого файла — если файл не менялся,
 * хеш не меняется, кеш остаётся. Если файл изменился — хеш новый,
 * браузер загрузит обновлённую версию.
 *
 * Запуск:
 *   node js/cache-buster.js [путь_к_папке]
 *   По умолчанию: ./ (текущая папка)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TARGET_DIR = process.argv[2] || '.';
const CSS_JS_EXTENSIONS = /\.(css|js)$/;

/** Вычисляет короткое хеш-значение файла */
function fileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

/** Заменяет href/src на версию с хешем */
function addVersionToAsset(html, assetPath) {
    const fullPath = path.resolve(path.dirname(html), assetPath);
    if (!fs.existsSync(fullPath)) return html;

    const hash = fileHash(fullPath);
    const separator = assetPath.includes('?') ? '&' : '?';
    const old = assetPath;
    const newAsset = `${assetPath}${separator}v=${hash}`;

    // Обновляем все ссылки на этот файл в HTML
    const escaped = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(href|src)=["']${escaped}["']`, 'gi');
    return html.replace(regex, `$1="${newAsset}"`);
}

/** Обрабатывает один HTML-файл */
function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Ищем href="..." и src="..." для CSS и JS
    const regex = /(href|src)="([^"]*(?:\.css|\.js))"/gi;
    let match;
    const matches = [];
    while ((match = regex.exec(content)) !== null) {
        matches.push({ full: match[0], attr: match[1], path: match[2] });
    }

    for (const m of matches) {
        // Пропускаем внешние ссылки (http/https) и data:
        if (/^(https?:|data:|\/\/)/.test(m.path)) continue;

        const result = addVersionToAsset(filePath, m.path);
        if (result !== content) changed = true;
        content = result;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  Updated: ${path.relative(TARGET_DIR, filePath)}`);
    }

    return changed;
}

/** Рекурсивный обход папок */
function walkDir(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Пропускаем служебные папки
            if (['node_modules', '.git', '.github', 'node_modules'].includes(entry.name)) continue;
            results = results.concat(walkDir(fullPath));
        } else if (entry.name.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

function main() {
    console.log(`Cache buster: ${TARGET_DIR}`);
    const files = walkDir(TARGET_DIR);
    console.log(`Found ${files.length} HTML files\n`);

    let updated = 0;
    for (const file of files) {
        if (processHtmlFile(file)) updated++;
    }

    console.log(`\nUpdated: ${updated} files`);
}

main();
