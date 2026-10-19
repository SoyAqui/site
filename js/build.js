/**
 * build.js
 * --------
 * Полный билд: cache-bust CSS/JS + update image versions.
 *
 * Запуск:
 *   node js/build.js [дата-деплоя]
 *   По умолчанию: сегодня
 */

const { execSync } = require('child_process');
const path = require('path');

const DEPLOY_DATE = process.argv[2] || new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

console.log('=== Build start ===');
console.log('Deploy date: ' + DEPLOY_DATE + '\n');

try {
    console.log('1. Running cache-buster...');
    execSync('node ' + path.join(__dirname, 'cache-buster.js') + ' . ' + DEPLOY_DATE, { stdio: 'inherit' });
    
    console.log('\n2. Running image version update...');
    execSync('node ' + path.join(__dirname, 'update-images.js') + ' ' + DEPLOY_DATE, { stdio: 'inherit' });
    
    console.log('\n=== Build complete ===');
} catch (error) {
    console.error('\n=== Build failed ===');
    process.exit(1);
}
