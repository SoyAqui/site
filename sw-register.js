/**
 * sw-register.js — регистрирует Service Worker
 * 
 * Подключение: добавить в <head> каждой HTML-страницы:
 *   <script src="sw-register.js"></script>
 * 
 * Работает так:
 * 1. Проверяет, поддерживает ли браузер Service Worker
 * 2. Регистрирует sw.js
 * 3. При обновлении кэша показывает уведомление
 * 4. При клике на уведомление перезагружает страницу
 */

if ('serviceWorker' in navigator) {
    // Регистрируем Service Worker
    navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker зарегистрирован');

        // Проверяем обновления каждую минуту
        setInterval(() => {
            registration.update();
        }, 60 * 1000);

        // Слушаем обновление
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Новая версия доступна!
                    if (confirm('Доступна новая версия сайта. Обновить?')) {
                        newWorker.postMessage('SKIP_WAITING');
                    }
                }
            });
        });
    }).catch(error => {
        console.log('Ошибка регистрации Service Worker:', error);
    });
}
