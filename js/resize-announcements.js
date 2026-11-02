/**
 * resize-announcements.js
 * -----------------------
 * Масштабирует все .jpg-изображения в assets/images/announcements
 * до размера 869x1318 (без искажения пропорций).
 *
 * Запуск:
 *   node js/resize-announcements.js
 *
 * Для точной обрезки (fill) вместо пропорциональной вставки —
 * добавить флаг --fill:
 *   node js/resize-announcements.js --fill
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const INPUT_DIR = path.resolve(__dirname, '..', 'assets', 'images', 'announcements');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'assets', 'images', 'announcements');
const TARGET_WIDTH = 869;
const TARGET_HEIGHT = 1318;
const USE_FILL = process.argv.includes('--fill');

async function resizeImage(filePath) {
    const sizeBefore = fs.statSync(filePath).size;

    const pipeline = sharp(filePath);

    if (USE_FILL) {
        // Exact crop: обрезает под 869x1318, заполняя/отрезая лишнее
        await pipeline
            .resize(TARGET_WIDTH, TARGET_HEIGHT, {
                fit: 'fill',
                position: 'centre'
            })
            .jpeg({ quality: 90 })
            .toFile(filePath);
    } else {
        // Proportional: вписывает в 869x1318, сохраняя пропорции
        await pipeline
            .resize({
                width: TARGET_WIDTH,
                height: TARGET_HEIGHT,
                fit: 'inside',
                withoutEnlargement: false
            })
            .jpeg({ quality: 90 })
            .toFile(filePath);
    }

    const sizeAfter = fs.statSync(filePath).size;
    return { sizeBefore, sizeAfter };
}

async function main() {
    console.log('Resize announcements to ' + TARGET_WIDTH + 'x' + TARGET_HEIGHT + '\n');

    const files = fs.readdirSync(INPUT_DIR)
        .filter(f => /\.(jpg|jpeg)$/i.test(f))
        .map(f => path.join(INPUT_DIR, f));

    if (files.length === 0) {
        console.log('No .jpg images found in', INPUT_DIR);
        return;
    }

    console.log('Found ' + files.length + ' image(s)\n');

    for (const file of files) {
        const name = path.basename(file);
        try {
            const { sizeBefore, sizeAfter } = await resizeImage(file);
            console.log('  ' + name +
                '  ' + sizeBefore / 1024 + ' KB -> ' + sizeAfter / 1024 + ' KB');
        } catch (err) {
            console.error('  ERROR: ' + name + ' — ' + err.message);
        }
    }

    console.log('\nDone!');
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
