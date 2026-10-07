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
// Ждём, пока календарь загрузится, затем применяем стили
function waitAndConstrain(maxAttempts, delay) {
    var attempts = 0;
    function check() {
        attempts++;
        var wrapper = document.querySelector('.calendar-wrapper');
        if (!wrapper) return;
        
        // Проверяем, загрузился ли календарь (есть ли внутри iframe или контент)
        var hasContent = wrapper.querySelector('iframe, .calendar, table, .event') || wrapper.innerHTML.trim() !== '';
        
        if (hasContent || attempts > maxAttempts) {
            constrainCalendar();
            return;
        }
        
        setTimeout(check, delay);
    }
    setTimeout(check, delay);
}

waitAndConstrain(50, 200); // Максимум 10 секунд

// Наблюдаем за изменениями DOM
var observer = new MutationObserver(function() {
    setTimeout(constrainCalendar, 100);
});
observer.observe(document.body, { childList: true, subtree: true });
