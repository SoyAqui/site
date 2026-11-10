/**
 * fix-dates.js
 * -------------
 * Исправляет даты в news-config.js линейно
 *
 * Запуск:
 *   node js/fix-dates.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '..', 'js', 'news-config.js');
const NEWS_DIR = path.resolve(__dirname, '..', 'news');

const FIRST_DATE = new Date('2026-08-02');
const LAST_DATE = new Date('2026-11-09');

// === 1. Находим существующие news файлы ===
const existingFiles = fs.readdirSync(NEWS_DIR)
    .filter(f => /^news-\d+\.html$/.test(f))
    .map(f => f.replace('news-', '').replace('.html', ''))
    .map(n => parseInt(n))
    .sort((a, b) => a - b);

console.log(`Found ${existingFiles.length} news files`);

// === 2. Рассчитываем даты ===
const totalDays = (LAST_DATE - FIRST_DATE) / (1000 * 60 * 60 * 24);
const step = totalDays / (existingFiles.length - 1);

const dateMap = {};
existingFiles.forEach((id, i) => {
    const d = new Date(FIRST_DATE.getTime() + step * i);
    dateMap[`news-${id}`] = d.toISOString().slice(0, 10);
});

// === 3. Читаем config ===
const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
const lines = configContent.split('\n');

// === 4. Обрабатываем линейно ===
let currentId = null;
let changesMade = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Определяем id
    const idMatch = line.match(/id:\s*'news-(\d+)'/);
    if (idMatch) {
        currentId = `news-${idMatch[1]}`;
    }
    
    // Если это строка с date и у нас есть correct date, заменяем
    if (currentId && dateMap[currentId] && /date:\s*'[^']+'/.test(line)) {
        const correctDate = dateMap[currentId];
        const newLine = line.replace(/date:\s*'[^']+'/, `date: '${correctDate}'`);
        if (newLine !== line) {
            lines[i] = newLine;
            changesMade++;
        }
    }
    
    // Сбрасываем currentId в конце объекта
    if (/^\s*\},?\s*$/.test(line) || /^\s*\}\s*$/.test(line)) {
        currentId = null;
    }
}

// === 5. Записываем ===
fs.writeFileSync(CONFIG_PATH, lines.join('\n'), 'utf8');
console.log(`\nUpdated ${changesMade} date entries`);

// === 6. Показываем результаты ===
console.log('\nDate sample (first 5):');
existingFiles.slice(0, 5).forEach(id => {
    console.log(`  news-${id}: ${dateMap[`news-${id}`]}`);
});
console.log('  ...');
console.log('\nDate sample (last 5):');
existingFiles.slice(-5).forEach(id => {
    console.log(`  news-${id}: ${dateMap[`news-${id}`]}`);
});
