/**
 * generate-thumbnails.js
 * ---------------------------------
 * Генерирует WebP-превью для оригинальных JPG/PNG-фото в каталогах новостей.
 * Для каждого фото создаёт 2 варианта:
 *   • 400 px wide – для обычных экранов (1x)
 *   • 800 px wide – для Retina-экранов (2x)
 *
 * В качестве fallback для старых браузеров используются оригинальные файлы.
 *
 * Использование:
 *   npm run thumbnails
 *   или:
 *   node js/generate-thumbnails.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BASE_DIR = path.join(__dirname, '..', 'assets', 'images', 'news');

// Желаемые ширины превью (1x и 2x для retina)
const SIZES = [400, 800];

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of list) {
        const fullPath = path.join(dir, entry.name);

        if (entry.name === 'thumbs') {
            continue;
        }

        if (entry.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (IMAGE_EXTENSIONS.test(entry.name)) {
            results.push(fullPath);
        }
    }

    return results;
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function hasThumb(thumbPath) {
    return fs.existsSync(thumbPath);
}

function hasAllThumbnails(imgPath, thumbDir, baseName) {
    for (const size of SIZES) {
        const thumbPath = path.join(thumbDir, `${baseName}-${size}.webp`);
        if (!hasThumb(thumbPath)) {
            return false;
        }
    }
    return true;
}

async function generateSingleThumb(imgPath, thumbPath, size) {
    try {
        await sharp(imgPath)
            .rotate()
            .resize({ width: size })
            .webp({ quality: 80 })
            .toFile(thumbPath);
        return true;
    } catch (err) {
        console.error('Failed to process', imgPath, err.message);
        return false;
    }
}

async function generateThumbnailsForImage(imgPath, thumbDir, baseName) {
    for (const size of SIZES) {
        const thumbPath = path.join(thumbDir, `${baseName}-${size}.webp`);
        if (!hasThumb(thumbPath)) {
            await generateSingleThumb(imgPath, thumbPath, size);
        }
    }
}

async function generate() {
    console.log('Scanning for images in', BASE_DIR);
    const images = walkDir(BASE_DIR);

    if (images.length === 0) {
        console.log('No images found in', BASE_DIR);
        return;
    }

    console.log(`Found ${images.length} original images\n`);

    let processed = 0;
    let skipped = 0;

    for (const imgPath of images) {
        const dir = path.dirname(imgPath);
        const baseName = path.basename(imgPath, path.extname(imgPath));
        const thumbDir = path.join(dir, 'thumbs');

        ensureDir(thumbDir);

        if (hasAllThumbnails(imgPath, thumbDir, baseName)) {
            skipped++;
            continue;
        }

        await generateThumbnailsForImage(imgPath, thumbDir, baseName);
        processed++;
    }

    console.log(`\nSummary:`);
    console.log(`  Processed: ${processed} images (${processed * SIZES.length} WebP files)`);
    console.log(`  Skipped:   ${skipped} images (thumbnails already exist)`);
    console.log(`  Total:     ${images.length} original images`);
}

generate();
