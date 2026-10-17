/**
 * sw.js — Service Worker для кэширования и автообновления сайта
 * 
 * Работает так:
 * 1. При первом заходе сохраняет CSS, JS, изображения в кэш браузера
 * 2. При каждом заходе проверяет сервер: "а не обновились файлы?"
 * 3. Если да — обновляет кэш и просит перезагрузить страницу
 * 4. Новые страницы кэшируются автоматически при первом посещении
 * 
 * Подключение: добавьте в <head> каждой HTML-страницы:
 *   <script src="sw-register.js"></script>
 */

const CACHE_NAME = 'site-cache-v1';

// Начальный кэш — статические файлы
const INITIAL_ASSETS = [
    '/',
    '/index.html',
    '/about.html',
    '/benefactors.html',
    '/sacraments.html',
    '/school.html',
    '/css/style.min.css',
    '/js/news-renderer.js',
    '/js/news-config.js',
    '/js/burger-menu.js',
    '/assets/images/header.png',
    '/assets/images/footer/vkontakte.png',
    '/assets/images/base.jpg',
];

// Установка Service Worker — сохраняем начальные файлы
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: кэширую начальные файлы');
            return cache.addAll(INITIAL_ASSETS);
        })
    );
    self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Запрос — кэшируем всё, что видим
self.addEventListener('fetch', event => {
    // Пропускаем внешние запросы
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        fetch(event.request).then(response => {
            // Если ответ успешный, сохраняем в кэш
            if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
            }
            return response;
        }).catch(() => {
            // Если сети нет, пробуем из кэша
            return caches.match(event.request);
        })
    );
});

// Уведомление об обновлении
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
