/**
 * generate-sitemap.js
 * -------------------
 * Генерирует sitemap.xml на основе news-config.js.
 * Статические страницы (главная, about, school и т.д.) остаются неизменными.
 * Все новости из window.newsData добавляются автоматически.
 *
 * Использование:
 *   npm run sitemap
 *   или:
 *   node js/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://apostolandrey.ru';
const CONFIG_PATH = path.join(__dirname, 'news-config.js');
const SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml');
const NEWS_DIR = path.join(__dirname, '..', 'news');

// Static pages from the existing sitemap
const STATIC_PAGES = [
    { loc: '/',              lastmod: '2026-10-12', changefreq: 'daily',  priority: '1.0' },
    { loc: '/about.html',    lastmod: '2026-10-12', changefreq: 'monthly', priority: '0.8' },
    { loc: '/school.html',   lastmod: '2026-10-12', changefreq: 'monthly', priority: '0.6' },
    { loc: '/sacraments.html',lastmod: '2026-10-12', changefreq: 'monthly', priority: '0.6' },
    { loc: '/benefactors.html',lastmod: '2026-10-12', changefreq: 'monthly', priority: '0.5' },
];

function today() {
    const d = new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

/**
 * Extract news data from the browser-side news-config.js
 * by reading the file and parsing the newsData array.
 */
function readNewsData() {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');

    // Find the newsData array: between "window.newsData = [" and "]"
    const startIdx = content.indexOf('window.newsData = [');
    if (startIdx === -1) throw new Error('window.newsData not found in news-config.js');

    const arrayStart = content.indexOf('[', startIdx) + 1;
    let depth = 1;
    let i = arrayStart;
    while (i < content.length && depth > 0) {
        if (content[i] === '[') depth++;
        if (content[i] === ']') depth--;
        i++;
    }
    const arrayContent = content.substring(arrayStart, i - 1);

    // Extract each news object by matching id, title, thumbnail, photos
    const news = [];
    const idRegex = /id\s*:\s*'([^']+)'/g;
    const titleRegex = /title\s*:\s*'((?:[^'\\]|\\.)*)'/g;
    const thumbRegex = /thumbnail\s*:\s*'([^']+)'/g;

    let idMatch;
    while ((idMatch = idRegex.exec(arrayContent)) !== null) {
        const id = idMatch[1];
        const pos = idMatch.index;

        // Find title (within ~200 chars after id)
        const titleSlice = arrayContent.substring(pos, pos + 200);
        const titleM = titleSlice.match(/title\s*:\s*'((?:[^'\\]|\\.)*)'/);
        const title = titleM ? titleM[1].replace(/\\'/g, "'") : '';

        // Find thumbnail
        const thumbM = titleSlice.match(/thumbnail\s*:\s*'([^']+)'/);
        const thumbnail = thumbM ? thumbM[1] : '';

        // Find photos array
        const photos = [];
        const photosRegex = /photos\s*:\s*\[([\s\S]*?)\]/g;
        const photosSlice = arrayContent.substring(pos, pos + 500);
        const photosM = photosRegex.exec(photosSlice);
        if (photosM) {
            const fileRegex = /'([^']+)'/g;
            let fm;
            while ((fm = fileRegex.exec(photosM[1])) !== null) {
                photos.push(fm[1]);
            }
        }

        news.push({ id, title, thumbnail, photos });
    }

    return news;
}

function generateSitemap() {
    const now = today();

    // Build static pages
    const staticXml = STATIC_PAGES.map(p =>
        `    <url>\n        <loc>${DOMAIN}${p.loc}</loc>\n        <lastmod>${p.lastmod}</lastmod>\n        <changefreq>${p.changefreq}</changefreq>\n        <priority>${p.priority}</priority>\n    </url>`
    ).join('\n');

    // Build news entries
    const news = readNewsData();
    const newsXml = news.map(n =>
        `    <url>\n        <loc>${DOMAIN}/news/${n.id}.html</loc>\n        <lastmod>${now}</lastmod>\n        <changefreq>yearly</changefreq>\n        <priority>0.4</priority>\n    </url>`
    ).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${newsXml}
</urlset>
`;

    fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');
    console.log(`Sitemap generated: ${STATIC_PAGES.length} static pages + ${news.length} news entries`);
}

generateSitemap();
