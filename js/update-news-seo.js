/**
 * update-news-seo.js
 * ------------------
 * Обновляет SEO-метаданные для всех новостей:
 * - title, og:title — «Заголовок — Храм святого апостола Андрея Первозванного, г. Ульяновск»
 * - og:description — берёт previewText из news-config.js
 * - meta description — первый абзац текста новости или previewText
 * - добавляет JSON-LD NewsArticle
 *
 * Запуск:
 *   node js/update-news-seo.js
 */

const fs = require('fs');
const path = require('path');

const NEWS_DIR = path.resolve(__dirname, '..', 'news');
const CONFIG_PATH = path.resolve(__dirname, '..', 'js', 'news-config.js');
const CHURCH_NAME = 'Храм святого апостола Андрея Первозванного, г. Ульяновск';
const SITE_URL = 'https://apostolandrey.ru';

// === 1. Читаем news-config.js ===
const configById = {};
let newsConfig = [];
try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    // Извлекаем id/title/date из JS-файла (не JSON, regex надежнее)
    const entries = configContent.match(/id:\s*'([^']+)',[\s\S]*?title:\s*'([^']+?)',?\s*[\s\S]*?date:\s*'([^']+?)'/g) || [];
    for (const e of entries) {
        const idMatch = e.match(/id:\s*'([^']+)'/);
        const titleMatch = e.match(/title:\s*'([^']+?)'/);
        const dateMatch = e.match(/date:\s*'([^']+?)'/);
        if (idMatch && titleMatch) {
            configById[idMatch[1]] = { 
                id: idMatch[1], 
                title: titleMatch[1],
                date: dateMatch ? dateMatch[1] : null
            };
        }
    }
    console.log('Loaded ' + Object.keys(configById).length + ' news items from config');
} catch (err) {
    console.error('Error reading config:', err.message);
    process.exit(1);
}

newsConfig.forEach(n => { configById[n.id] = n; });

// === 2. Находим все news-*.html ===
function findNewsFiles() {
    const files = [];
    const entries = fs.readdirSync(NEWS_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (/^news-\d+\.html$/.test(entry.name)) {
            files.push(path.join(NEWS_DIR, entry.name));
        }
    }
    return files.sort();
}

// === 3. Извлекаем первый абзац из HTML ===
function extractFirstParagraph(html) {
    const pMatch = html.match(/<p>([\s\S]*?)<\/p>/);
    if (!pMatch) return '';
    return pMatch[1].replace(/<[^>]+>/g, '').trim();
}

// === 4. Извлекаем publish date из JSON-LD или используем дату файла ===
function extractDate(html) {
    const jsonldMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
    if (jsonldMatch) return jsonldMatch[1];
    return new Date().toISOString().slice(0, 10);
}

// === 5. Формируем JSON-LD NewsArticle ===
function buildNewsJsonLd(title, description, date, newsId) {
    const fullUrl = SITE_URL + '/news/' + newsId + '.html';
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": description,
        "datePublished": date,
        "dateModified": date,
        "url": fullUrl,
        "publisher": {
            "@type": "ReligiousOrganization",
            "name": "Храм святого апостола Андрея Первозванного",
            "url": SITE_URL,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "проспект Сурова, 4б",
                "addressLocality": "Ульяновск",
                "addressRegion": "Ульяновская область",
                "postalCode": "432064",
                "addressCountry": "RU"
            }
        }
    }, null, 2);
}

// === 6. Обновляем одну новость ===
function updateNewsPage(filePath, newsId) {
    let html = fs.readFileSync(filePath, 'utf8');

    // Извлекаем данные
    const firstParagraph = extractFirstParagraph(html);
    const config = configById[newsId];
    
    // Дата: из конфига优先, иначе из HTML, иначе сегодня
    const publishDate = config?.date 
        ? config.date 
        : (extractDate(html) || new Date().toISOString().slice(0, 10));

    // Заголовок новости (из <h1> в <article>)
    const h1Match = html.match(/<article>[\s\S]*?<h1>([\s\S]*?)<\/h1>/);
    const rawTitle = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : (config ? config.title : newsId);

    // Убираем ведущий символ ~ (используется как маркер важности)
    const cleanTitle = rawTitle.replace(/^~\s*/, '');

    // Meta description: previewText из конфига или первый абзац
    const metaDesc = (config && config.previewText)
        ? config.previewText
        : (firstParagraph || cleanTitle);

    const fullTitle = cleanTitle + ' — ' + CHURCH_NAME;

    // --- Обновляем title ---
    html = html.replace(
        /(<title>)[^<]*(<\/title>)/gi,
        `$1${fullTitle}$2`
    );

    // --- Обновляем og:title ---
    html = html.replace(
        /(<meta property="og:title" content=")[^"]*("\/?\s*>)/gi,
        `$1${fullTitle}$2`
    );

    // --- Обновляем og:description ---
    html = html.replace(
        /(<meta property="og:description"[^>]*content=")[^"]*("\/?\s*>)/gi,
        `$1${metaDesc}$2`
    );

    // --- Обновляем meta description ---
    html = html.replace(
        /(<meta name="description"[^>]*content=")[^"]*("\/?\s*>)/gi,
        `$1${metaDesc}$2`
    );

    // --- Добавляем/обновляем JSON-LD NewsArticle ---
    const jsonld = buildNewsJsonLd(cleanTitle, metaDesc, publishDate, newsId);

    // Убираем старый JSON-LD если есть
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

    // Вставляем JSON-LD перед </head>
    html = html.replace('</head>', `<script type="application/ld+json">\n${jsonld}\n</script>\n</head>`);

    fs.writeFileSync(filePath, html, 'utf8');
    return { title: cleanTitle, updated: true };
}

// === 7. Главный процесс ===
function main() {
    console.log('\n=== Update news SEO ===\n');

    const files = findNewsFiles();
    console.log('Found ' + files.length + ' news files\n');

    let updated = 0;
    let skipped = 0;

    for (const file of files) {
        const fileName = path.basename(file);
        const newsIdMatch = fileName.match(/^(news-\d+)\.html$/);
        if (!newsIdMatch) continue;

        const newsId = newsIdMatch[1];
        const config = configById[newsId];

        try {
            const result = updateNewsPage(file, newsId);
            console.log('  ✓ ' + fileName + ' — «' + result.title + '»');
            updated++;
        } catch (err) {
            console.error('  ✗ ' + fileName + ' — ' + err.message);
            skipped++;
        }
    }

    console.log('\nUpdated: ' + updated + ' | Skipped: ' + skipped);
}

main();
