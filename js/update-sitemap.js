/**
 * update-sitemap.js
 * -----------------
 * Обновляет sitemap.xml:
 * - changefreq для новостей: weekly (свежие) / monthly (старые)
 * - lastmod: берёт дату из JSON-LD NewsArticle каждой новости
 *
 * Запуск:
 *   node js/update-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const NEWS_DIR = path.resolve(__dirname, '..', 'news');
const SITEMAP_PATH = path.resolve(__dirname, '..', 'sitemap.xml');
const CUTOFF_DAYS = 30; // Старше этого = monthly, иначе weekly

function getNewsFiles() {
    const files = [];
    const entries = fs.readdirSync(NEWS_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (/^news-\d+\.html$/.test(entry.name)) {
            files.push(path.join(NEWS_DIR, entry.name));
        }
    }
    return files.sort().reverse(); // Новые первыми
}

function extractDateFromJsonLd(html) {
    const match = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
    return match ? match[1] : new Date().toISOString().slice(0, 10);
}

function buildSitemap(newsItems) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://apostolandrey.ru/</loc>
        <lastmod>2026-11-03</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://apostolandrey.ru/about.html</loc>
        <lastmod>2026-11-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://apostolandrey.ru/school.html</loc>
        <lastmod>2026-11-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>https://apostolandrey.ru/sacraments.html</loc>
        <lastmod>2026-11-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>https://apostolandrey.ru/benefactors.html</loc>
        <lastmod>2026-11-03</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
`;

    const now = new Date();
    newsItems.forEach(item => {
        const date = new Date(item.date);
        const daysOld = (now - date) / (1000 * 60 * 60 * 24);
        const changefreq = daysOld <= CUTOFF_DAYS ? 'weekly' : 'monthly';
        
        xml += `    <url>
        <loc>https://apostolandrey.ru/news/${item.id}.html</loc>
        <lastmod>${item.date}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>0.4</priority>
    </url>
`;
    });

    xml += '</urlset>\n';
    return xml;
}

function main() {
    console.log('=== Update sitemap.xml ===\n');

    const files = getNewsFiles();
    const newsItems = [];

    for (const file of files) {
        const fileName = path.basename(file);
        const idMatch = fileName.match(/^(news-\d+)\.html$/);
        if (!idMatch) continue;

        const html = fs.readFileSync(file, 'utf8');
        const date = extractDateFromJsonLd(html);
        newsItems.push({ id: idMatch[1], date });
    }

    const sitemap = buildSitemap(newsItems);
    fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');

    console.log('Updated sitemap.xml with ' + newsItems.length + ' news items\n');
    console.log('changefreq:');
    console.log('  - weekly: последние ' + CUTOFF_DAYS + ' дней');
    console.log('  - monthly: старше ' + CUTOFF_DAYS + ' дней\n');

    const weekly = newsItems.filter(i => {
        const days = (new Date() - new Date(i.date)) / (1000 * 60 * 60 * 24);
        return days <= CUTOFF_DAYS;
    }).length;
    console.log('Results: ' + weekly + ' weekly, ' + (newsItems.length - weekly) + ' monthly');
}

main();
