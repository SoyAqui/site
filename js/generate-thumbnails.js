/**
 * generate-thumbnails.js
 * ---------------------------------
 * Simple Node.js script that scans the directory `assets/images/news/`
 * (including any sub-folders) and creates two thumbnail versions for
 * every image it finds:
 *   • 400 px wide – suitable for normal displays
 *   • 800 px wide – for high-DPI (Retina) screens
 *
 * The script uses the `sharp` library, which is fast and works with
 * JPEG, PNG, WebP, AVIF and many other formats.
 *
 * How to use:
 *   1. Install dependencies (once):
 *        npm install sharp
 *   2. Run the script from the project root:
 *        npm run thumbnails
 *
 * Behavior:
 *   - Scans `assets/images/news/` for original images (excluding `thumbs/` folders)
 *   - For each original image, creates thumbnails in `thumbs/` folder
 *   - If thumbnails already exist, skips them (idempotent)
 *   - Prints a summary at the end
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Base directory where all news images are stored
const BASE_DIR = path.join(__dirname, '..', 'assets', 'images', 'news');

// Desired thumbnail widths (in pixels)
const SIZES = [400, 800]; // 1x and 2x for retina screens

// Image extensions to process
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

/**
 * Recursively walk a directory and return an array of absolute file paths
 * Excludes any directory named 'thumbs' to avoid processing thumbnails
 */
function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of list) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip thumbs directories to avoid processing thumbnails recursively
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

/** Ensure a directory exists (creates it if needed) */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/** Check if a single thumbnail file exists */
function hasThumb(thumbPath) {
    return fs.existsSync(thumbPath);
}

/** Check if all required thumbnails exist for an image */
function hasAllThumbnails(imgPath, thumbDir, baseName) {
    for (const size of SIZES) {
        const formats = ['.webp', '.jpg'];
        for (const ext of formats) {
            const thumbPath = path.join(thumbDir, `${baseName}-${size}${ext}`);
            if (!hasThumb(thumbPath)) {
                return false;
            }
        }
    }
    return true;
}

/** Generate a single thumbnail variant (one size + one format) */
async function generateSingleThumb(imgPath, thumbPath, size, format) {
    try {
        await sharp(imgPath)
            .rotate()
            .resize({ width: size })
            [format === 'webp' ? 'webp' : 'jpeg']({ quality: 85 })
            .toFile(thumbPath);
        return true;
    } catch (err) {
        console.error('Failed to process', imgPath, err.message);
        return false;
    }
}

/** Generate thumbnails for a single image, skipping only what already exists */
async function generateThumbnailsForImage(imgPath, thumbDir, baseName) {
    for (const size of SIZES) {
        const formats = ['webp', 'jpg'];
        for (const format of formats) {
            const thumbPath = path.join(thumbDir, `${baseName}-${size}.${format}`);
            if (!hasThumb(thumbPath)) {
                await generateSingleThumb(imgPath, thumbPath, size, format);
            }
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
    
    console.log(`Found ${images.length} images\n`);
    
    let processed = 0;
    let skipped = 0;
    
    for (const imgPath of images) {
        const dir = path.dirname(imgPath);
        const baseName = path.basename(imgPath, path.extname(imgPath));
        const thumbDir = path.join(dir, 'thumbs');
        
        // Ensure thumbs directory exists
        ensureDir(thumbDir);
        
        // Check if all thumbnails already exist
        if (hasAllThumbnails(imgPath, thumbDir, baseName)) {
            skipped++;
            continue;
        }
        
        // Generate new thumbnails
        await generateThumbnailsForImage(imgPath, thumbDir, baseName);
        processed++;
    }
    
    console.log(`\nSummary:`);
    console.log(`  Processed: ${processed} images (${processed * SIZES.length * 2} thumbnail files)`);
    console.log(`  Skipped: ${skipped} images (thumbnails already exist)`);
    console.log(`  Total: ${images.length} images`);
}

generate();
