document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('announcement-container');
    var img = document.getElementById('announcement-img');
    var dotsContainer = document.getElementById('announcement-dots');
    var prevBtn = document.querySelector('.announcement-prev');
    var nextBtn = document.querySelector('.announcement-next');

    if (!window.announcements || window.announcements.length === 0) {
        // Нет объявлений – скрываем контейнер полностью
        if (container) container.style.display = 'none';
        return;
    }

    var index = 0;
    var total = window.announcements.length;
    var autoPlayTimer = null;

    function showCurrent() {
        img.src = window.announcements[index];
        updateDots();
        resetAutoPlay();
    }

    function updateDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (var i = 0; i < total; i++) {
            var dot = document.createElement('button');
            dot.className = 'announcement-dot' + (i === index ? ' active' : '');
            dot.setAttribute('aria-label', 'Перейти к объявлению ' + (i + 1));
            dot.addEventListener('click', function(idx) {
                return function() {
                    index = idx;
                    showCurrent();
                };
            }(i));
            dotsContainer.appendChild(dot);
        }
    }

    function nextAnnouncement() {
        index = (index + 1) % total;
        showCurrent();
    }

    function prevAnnouncement() {
        index = (index - 1 + total) % total;
        showCurrent();
    }

    // Показать первое объявление
    showCurrent();

    // Кнопки навигации
    if (prevBtn) {
        prevBtn.addEventListener('click', prevAnnouncement);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', nextAnnouncement);
    }

    // Если изображение не загрузилось – скрываем весь блок
    img.onerror = function() {
        if (container) container.style.display = 'none';
    };
    // Если загрузилось – убеждаемся, что контейнер видим
    img.onload = function() {
        if (container) container.style.display = 'block';
    };

    // Автоматическое переключение каждые 7 секунд
    function resetAutoPlay() {
        if (autoPlayTimer) {
            clearTimeout(autoPlayTimer);
        }
        if (total > 1) {
            autoPlayTimer = setTimeout(function() {
                nextAnnouncement();
            }, 7000);
        }
    }

    // Запуск автоплея
    resetAutoPlay();

    // Пауза при наведении мыши
    if (container) {
        container.addEventListener('mouseenter', function() {
            if (autoPlayTimer) {
                clearTimeout(autoPlayTimer);
                autoPlayTimer = null;
            }
        });
        container.addEventListener('mouseleave', function() {
            resetAutoPlay();
        });
    }
});