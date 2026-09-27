/**
 * generate-favicon.js
 * -------------------
 * Создаёт фавикон из assets/images/favicon.png в нескольких размерах
 * и помещает их в assets/images/icons/
 *
 * Использование:
 *   npm run favicon
 *   или:
 *   node js/generate-favicon.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const INPUT = path.join(__dirname, '..', 'assets', 'images', 'favicon.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'icons');

// Размеры: [имя_файла, width, height]
const SIZES = [
    ['icon-16.png',      16, 16],
    ['icon-32.png',      32, 32],
    ['icon-48.png',      48, 48],
    ['icon-64.png',      64, 64],
    ['icon-180.png',     180, 180], // Apple Touch Icon
    ['icon-192.png',     192, 192], // Android / Chrome
    ['icon-512.png',     512, 512], // PWA
];

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function generateSingle(iconPath, w, h) {
    try {
        await sharp(INPUT)
            .resize({ width: w, height: h, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(iconPath);
        console.log(`  ✓ ${path.basename(iconPath)} (${w}×${h})`);
        return true;
    } catch (err) {
        console.error(`  ✗ ${path.basename(iconPath)}:`, err.message);
        return false;
    }
}

async function main() {
    console.log('Generating favicon from', path.basename(INPUT), '\n');

    const meta = await sharp(INPUT).metadata();
    console.log(`Source: ${meta.width}×${meta.height}, format: ${meta.format}\n`);

    ensureDir(OUTPUT_DIR);

    let generated = 0;
    let failed = 0;

    for (const [name, w, h] of SIZES) {
        if (await generateSingle(path.join(OUTPUT_DIR, name), w, h)) {
            generated++;
        } else {
            failed++;
        }
    }

    console.log(`\nDone: ${generated} created, ${failed} failed`);
    console.log(`Output: ${OUTPUT_DIR}`);
}

main();
