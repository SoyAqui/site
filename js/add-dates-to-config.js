/**
 * add-dates-to-config.js
 * -----------------------
 * Распределяет даты равномерно от первой до последней новости
 * и добавляет поле `date` в news-config.js
 *
 * Запуск:
 *   node js/add-dates-to-config.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '..', 'js', 'news-config.js');
const NEWS_DIR = path.resolve(__dirname, '..', 'news');

const FIRST_DATE = '2026-08-02';
const LAST_DATE = '2026-11-09';

// === 1. Находим существующие news файлы ===
function getNewsFiles() {
    const entries = fs.readdirSync(NEWS_DIR, { withFileTypes: true });
    const files = entries
        .filter(e => /^news-\d+\.html$/.test(e.name))
        .map(e => e.name.replace('news-', '').replace('.html', ''))
        .map(n => parseInt(n))
        .sort((a, b) => a - b);
    return files;
}

const newsIds = getNewsFiles();
console.log(`Found ${newsIds.length} existing news files`);
console.log(`Date range: ${FIRST_DATE} to ${LAST_DATE}`);

// === 2. Рассчитываем даты (равномерно) ===
const startDate = new Date(FIRST_DATE);
const endDate = new Date(LAST_DATE);
const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
const step = totalDays / (newsIds.length - 1);

const dateMap = {};
newsIds.forEach((id, i) => {
    const d = new Date(startDate.getTime() + step * i);
    dateMap[`news-${id}`] = d.toISOString().slice(0, 10);
});

console.log('\nGenerated dates:');
newsIds.slice(0, 5).forEach(id => console.log(`  news-${id}: ${dateMap[`news-${id}`]}`));
console.log('  ...');
newsIds.slice(-5).forEach(id => console.log(`  news-${id}: ${dateMap[`news-${id}`]}`));

// === 3. Читаем config ===
let configContent = fs.readFileSync(CONFIG_PATH, 'utf8');

// === 4. Добавляем date после title для каждой новости ===
const lines = configContent.split('\n');
const updatedLines = [];
let currentId = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    updatedLines.push(line);
    
    // Определяем id из текущей строки
    const idMatch = line.match(/id:\s*'news-(\d+)'/);
    if (idMatch) {
        currentId = `news-${idMatch[1]}`;
    }
    
    // Если это строка с title и у нас есть дата, добавляем её
    if (/title:\s*'[^']+'[,\\s]*$/.test(line) && currentId && dateMap[currentId]) {
        const indent = line.match(/^(\s*)/)[1];
        const date = dateMap[currentId];
        updatedLines.push(`${indent}date: '${date}',`);
    }
    
    // Сбрасываем currentId когда встречаем новый id
    if (/},\s*$/.test(line) || /}\s*$/.test(line)) {
        currentId = null;
    }
}

// === 5. Записываем обратно ===
fs.writeFileSync(CONFIG_PATH, updatedLines.join('\n'), 'utf8');
console.log('\n✅ Updated news-config.js with dates');

// === 6. Показываем примеры ===
console.log('\nExample entries:');
const sampleIds = newsIds.slice(0, 3).concat(newsIds.slice(-3));
sampleIds.forEach(id => {
    console.log(`  news-${id}: ${dateMap[`news-${id}`]}`);
});
