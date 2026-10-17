/**
 * sw.js — Service Worker для кэширования и автообновления сайта
 * 
 * Работает так:
 * 1. При первом заходе сохраняет CSS, JS в кэш браузера
 * 2. HTML-страницы и изображения — всегда проверяют сервер (свежие данные)
 * 3. При изменении файлов — показывает "Обновить?"
 * 
 * Подключение: добавьте в <head> каждой HTML-страницы:
 *   <script src="sw-register.js"></script>
 */

const CACHE_NAME = 'site-cache-v2';

// Что кэшируем (только статику)
const STATIC_ASSETS = [
    '/css/style.min.css',
    '/js/news-renderer.js',
    '/js/news-config.js',
    '/js/burger-menu.js',
    '/assets/images/header.png',
    '/assets/images/footer/vkontakte.png',
];

// Установка — кэшируем статику
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: кэширую статику');
            return cache.addAll(STATIC_ASSETS);
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

// Запрос — HTML и изображения ВСЕГДА с сервера
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // Пропускаем внешние запросы
    if (!url.startsWith(self.location.origin)) return;

    // HTML-страницы — всегда свежие
    if (url.endsWith('.html')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Изображения — всегда свежие (не кэшируем!)
    if (/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i.test(url)) {
        event.respondWith(fetch(event.request).catch(() => {
            return caches.match(event.request);
        }));
        return;
    }

    // CSS/JS — из кэша, если есть, иначе с сервера
    if (/\.(css|js)$/i.test(url)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request).then(response => {
                    // Кэшируем при первом запросе
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Всё остальное — с сервера
    event.respondWith(fetch(event.request));
});

// Уведомление об обновлении
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
