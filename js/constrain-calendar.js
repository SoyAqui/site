// Принудительное ограничение размеров календаря pravoslavie.ru
function constrainCalendar() {
    var wrapper = document.querySelector('.calendar-wrapper');
    if (!wrapper) return;
    
    var elements = wrapper.querySelectorAll('*');
    elements.forEach(function(el) {
        el.style.maxWidth = '100%';
        el.style.width = 'auto';
        el.style.float = 'none';
        el.style.position = 'relative';
        el.style.overflow = 'hidden';
    });
    
    // Обрезаем overflowing контент
    wrapper.style.overflow = 'hidden';
}

// Применяем после загрузки скрипта календаря
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', constrainCalendar);
} else {
    setTimeout(constrainCalendar, 1000);
}

// Наблюдаем за изменениями DOM
var observer = new MutationObserver(function() {
    setTimeout(constrainCalendar, 100);
});
observer.observe(document.body, { childList: true, subtree: true });
