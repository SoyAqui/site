/**
 * update-images.js
 * ----------------
 * Добавляет ?v=ДАТА ко всем изображениям в HTML файлах.
 *
 * Запуск:
 *   node js/update-images.js [дата-деплоя]
 *   По умолчанию: сегодня
 *
 * Обновляет:
 * - img src="..."
 * - picture > img src="..."
 * - src в <source> тегах (для srcset)
 * - любые href/srcending на .jpg, .jpeg, .png, .webp, .gif, .svg
 *
 * Пример:
 *   node js/update-images.js 20261019
 */

const fs = require('fs');
const path = require('path');

const DEPLOY_DATE = process.argv[2] || new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|svg)$/i;

function updateImagesInHtml(html) {
    // Паттерн для img src="..."
    const imgRe = /<img\s+[^>]*src="([^"]+)"[^>]*\/?\>/gi;
    // Паттерн для src в <source> тегах
    const sourceRe = /<source\s+[^>]*src="([^"]+)"[^>]*\/?\>/gi;
    // Паттерн для любых href/src с изображениями
    const anySrcRe = /((?:href|src)=["'])([^"']+)(["'])/gi;

    // Пропускаем изображения контента — их обрабатывает cache-buster.js
    const SKIP_DIRS = /assets\/(images\/news|images\/announcements)\//;

    let changed = false;
    let match;

    // 1. Обрабатываем img src
    while ((match = imgRe.exec(html)) !== null) {
        const src = match[1];
        const cleanSrc = src.split('?')[0];
        if (IMAGE_EXTENSIONS.test(cleanSrc) && !SKIP_DIRS.test(src)) {
            const newSrc = addVersionToUrl(src);
            if (newSrc !== src) {
                html = html.replace(match[0], match[0].replace(src, newSrc));
                changed = true;
            }
        }
    }

    // 2. Обрабатываем source src
    while ((match = sourceRe.exec(html)) !== null) {
        const src = match[1];
        const cleanSrc = src.split('?')[0];
        if (IMAGE_EXTENSIONS.test(cleanSrc) && !SKIP_DIRS.test(src)) {
            const newSrc = addVersionToUrl(src);
            if (newSrc !== src) {
                html = html.replace(match[0], match[0].replace(src, newSrc));
                changed = true;
            }
        }
    }

    // 3. Обрабатываем любые другие src/href с изображениями
    while ((match = anySrcRe.exec(html)) !== null) {
        const attr = match[1];
        const url = match[2];
        const quote = match[3];

        // Пропускаем уже обработанные (CSS, JS)
        if (/\.css$|\.js$/.test(url)) continue;

        // Пропускаем изображения контента (news/announcements) — обрабатывает cache-buster.js
        const cleanUrl = url.split('?')[0];
        if (IMAGE_EXTENSIONS.test(cleanUrl) && !SKIP_DIRS.test(url)) {
            const newUrl = addVersionToUrl(url);
            if (newUrl !== url) {
                html = html.replace(attr + url + quote, attr + newUrl + quote);
                changed = true;
            }
        }
    }

    return { html, changed };
}

function addVersionToUrl(url) {
    // Если уже есть ?v=, обновляем дату
    const vMatch = url.match(/(\?v=)[^&]*/);
    if (vMatch) {
        return url.replace(vMatch[0], '?v=' + DEPLOY_DATE);
    }
    // Иначе добавляем
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + 'v=' + DEPLOY_DATE;
}

function walkDir(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.github') continue;
            results.push(...walkDir(fullPath));
        } else if (entry.name.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

function main() {
    console.log('Update images: deploy date = ' + DEPLOY_DATE);
    const files = walkDir('.');
    console.log('Found ' + files.length + ' HTML files\n');

    let updated = 0;
    for (const file of files) {
        let html = fs.readFileSync(file, 'utf8');
        const result = updateImagesInHtml(html);
        if (result.changed) {
            fs.writeFileSync(file, result.html, 'utf8');
            console.log('Updated: ' + file);
            updated++;
        }
    }

    console.log('\nUpdated: ' + updated + ' files');
}

main();
