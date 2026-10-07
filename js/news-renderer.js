/**
 * Рендеринг новостей и галереи
 */

// Конфигурация пагинации
var PAGINATION_ENABLED = true;
var ITEMS_PER_PAGE = 10;
var currentPage = 1;

// Экранирование HTML для безопасности при вставке пользовательского контента
function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    // Если массив данных не загружен, выходим
    if (!window.newsData || window.newsData.length === 0) return;

    // Рендеринг на Главной (первые 6 новостей)
    var mainGrid = document.getElementById('news-grid');
    if (mainGrid && !mainGrid.dataset.rendered) {
        renderNewsCards(mainGrid, window.newsData.slice(0, 6));
        mainGrid.dataset.rendered = 'true';
    }

    // Рендеринг в Архиве (пагинация)
    var archiveList = document.getElementById('archive-list');
    if (archiveList && !archiveList.dataset.rendered) {
        renderNewsArchivePaginated(archiveList, window.newsData);
        archiveList.dataset.rendered = 'true';
    }

    // Автоматическая генерация галереи на странице новости
    generateAutoGallery();

    // Инициализация lightbox (один раз на всю страницу)
    initGalleryLightbox();
});

// Автоматическая генерация галереи на странице новости
function generateAutoGallery() {
    // Определяем текущую новость по URL
    var path = window.location.pathname;
    var match = path.match(/news-(\d+)\.html/);
    var currentId = match ? 'news-' + match[1] : null;

    if (!currentId) return;

    // Находим новость в newsData
    var newsItem = window.newsData.find(function(item) {
        return item.id === currentId;
    });

    if (!newsItem || !newsItem.photos || !Array.isArray(newsItem.photos) || newsItem.photos.length === 0) {
        return;
    }

    // Генерируем галерею
    var folder = 'assets/images/news/' + currentId.replace('news-', 'news_') + '/';
    var html = '';

    newsItem.photos.forEach(function(filename, index) {
        var name = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        var safeTitle = escapeHtml(newsItem.title || '');
        var alt = safeTitle ? safeTitle + ' \u2014 \u0424\u043e\u0442\u043e ' + (index + 1) : '\u0424\u043e\u0442\u043e ' + (index + 1);

        html += '<a href="../' + folder + filename + '" class="lightbox-link">\n';
        html += '    <picture>\n';
        html += '        <source media="(min-width: 768px)" srcset="../' + folder + 'thumbs/' + name + '-800.jpg 800w,\n';
        html += '                ../' + folder + filename + ' 1200w" type="image/jpeg">\n';
        html += '        <source media="(min-width: 768px)" srcset="../' + folder + 'thumbs/' + name + '-800.webp 800w,\n';
        html += '                ../' + folder + filename + ' 1200w" type="image/webp">\n';
        html += '        <source srcset="../' + folder + 'thumbs/' + name + '-400.webp 1x,\n';
        html += '                ../' + folder + 'thumbs/' + name + '-800.webp 2x" type="image/webp">\n';
        html += '        <source srcset="../' + folder + 'thumbs/' + name + '-400.jpg 1x,\n';
        html += '                ../' + folder + 'thumbs/' + name + '-800.jpg 2x" type="image/jpeg">\n';
        html += '        <img src="../' + folder + 'thumbs/' + name + '-800.jpg" alt="' + alt + '" loading="lazy" decoding="async">\n';
        html += '    </picture>\n';
        html += '</a>\n';
    });

    // Если div#auto-gallery есть на странице — вставляем в него
    var galleryContainer = document.getElementById('auto-gallery');
    if (galleryContainer) {
        galleryContainer.innerHTML = html;
    }
    // Если div#auto-gallery нет, но есть photos — создаём его автоматически
    else if (newsItem.photos.length > 0) {
        var article = document.querySelector('article');
        if (article) {
            var newGalleryDiv = document.createElement('div');
            newGalleryDiv.className = 'news-gallery';
            newGalleryDiv.id = 'auto-gallery';
            newGalleryDiv.innerHTML = html;
            article.appendChild(newGalleryDiv);
        }
    }
}

// Инициализация lightbox для галереи
function initGalleryLightbox() {
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = lightbox ? lightbox.querySelector('img') : null;

    if (!lightbox || !lightboxImg) return;

    var isOpen = false;

    // Обработчик клика на ссылку в галерее
    lightbox.addEventListener('click', function() {
        lightbox.style.display = 'none';
        isOpen = false;
    });

    document.addEventListener('click', function(e) {
        var link = e.target.closest('.lightbox-link');
        if (!link) return;

        e.preventDefault();
        e.stopPropagation();

        lightboxImg.src = link.href;
        lightbox.style.display = 'flex';
        isOpen = true;
    });

    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
            lightbox.style.display = 'none';
            isOpen = false;
        }
    });
}

// Функция отрисовки карточек (для Главной)
function renderNewsCards(container, items) {
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Новостей пока нет</p>';
        return;
    }

    items.forEach(function(item) {
        // Автоматически вычисляем URL полной новости из id, если не задан явно
        var fullUrl = item.fullPageUrl || 'news/' + item.id + '.html';
        var safeTitle = escapeHtml(item.title || 'Новость');

        var card = document.createElement('a');
        card.href = fullUrl;
        card.className = 'news-card';

        var imgSrc = item.thumbnail
            ? item.thumbnail
            : 'https://via.placeholder.com/200x200?text=' + encodeURIComponent(safeTitle.substring(0, 10));

        var preview = item.previewText ? '<div class="news-card-preview">' + escapeHtml(item.previewText) + '</div>' : '';
        card.innerHTML =
            '<img src="' + escapeHtml(imgSrc) + '" alt="' + safeTitle + '" loading="lazy" decoding="async">' +
            '<div class="news-card-content">' +
                '<span class="news-card-title">' + safeTitle + '</span>' +
                preview +
            '</div>';
        container.appendChild(card);
    });
}

// Функция отрисовки архива с пагинацией
function renderNewsArchivePaginated(container, items) {
    if (!items || items.length === 0) {
        container.innerHTML = '<p>Новостей пока нет</p>';
        return;
    }

    var totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    currentPage = 1;

    renderCurrentPage(container, items, totalPages);

    // Создаём элементы пагинации
    var paginationDiv = document.createElement('div');
    paginationDiv.className = 'news-pagination';
    paginationDiv.id = 'news-pagination';

    // Кнопка «Назад»
    var prevBtn = document.createElement('a');
    prevBtn.href = '#';
    prevBtn.className = 'disabled';
    prevBtn.textContent = '« Назад';
    prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderCurrentPage(container, items, totalPages);
            updatePagination(paginationDiv, currentPage, totalPages);
        }
    });
    paginationDiv.appendChild(prevBtn);

    // Номерa страниц
    for (var i = 1; i <= totalPages; i++) {
        (function(page) {
            var link = document.createElement('a');
            link.href = '#';
            link.textContent = page;
            link.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage = page;
                renderCurrentPage(container, items, totalPages);
                updatePagination(paginationDiv, currentPage, totalPages);
            });
            paginationDiv.appendChild(link);
        })(i);
    }

    // Кнопка «Вперёд»
    var nextBtn = document.createElement('a');
    nextBtn.href = '#';
    nextBtn.textContent = 'Вперёд »';
    nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderCurrentPage(container, items, totalPages);
            updatePagination(paginationDiv, currentPage, totalPages);
        }
    });
    paginationDiv.appendChild(nextBtn);

    container.appendChild(paginationDiv);
}

// Рендерит текущую страницу
function renderCurrentPage(container, items, totalPages) {
    var start = (currentPage - 1) * ITEMS_PER_PAGE;
    var end = start + ITEMS_PER_PAGE;
    var pageItems = items.slice(start, end);

    // Находим существующий список или создаём новый
    var list = container.querySelector('.archive-list');
    if (!list) {
        list = document.createElement('ul');
        list.className = 'archive-list';
        container.appendChild(list);
    }

    // Обновляем содержимое списка
    list.innerHTML = '';

    pageItems.forEach(function(item) {
        var fullUrl = item.fullPageUrl || 'news/' + item.id + '.html';
        var thumbSrc = item.thumbnail || '';
        var safeTitle = escapeHtml(item.title || 'Без заголовка');
        var preview = item.previewText ? '<p class="archive-preview">' + escapeHtml(item.previewText) + '</p>' : '';
        var thumbHtml = thumbSrc ? '<img src="' + escapeHtml(thumbSrc) + '" alt="' + safeTitle + '" loading="lazy" class="archive-thumb-img">' : '';

        var li = document.createElement('li');
        li.className = 'archive-item';
        li.innerHTML =
            thumbHtml +
            '<div class="archive-item-content">' +
                '<a href="' + escapeHtml(fullUrl) + '" class="archive-item-title">' + safeTitle + '</a>' +
                preview +
                '<a href="' + escapeHtml(fullUrl) + '" class="archive-link">\u0427\u0438\u0442\u0430\u0442\u044c \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e &rarr;</a>' +
            '</div>';
        list.appendChild(li);
    });
}

// Обновляет состояние кнопок пагинации
function updatePagination(paginationDiv, current, total) {
    var links = paginationDiv.querySelectorAll('a');
    var prevBtn = links[0];
    var nextBtn = links[links.length - 1];

    // Обновляем «Назад»
    if (current > 1) {
        prevBtn.className = '';
    } else {
        prevBtn.className = 'disabled';
    }

    // Обновляем «Вперёд»
    if (current < total) {
        nextBtn.className = '';
    } else {
        nextBtn.className = 'disabled';
    }

    // Обновляем активную страницу
    for (var i = 1; i <= total; i++) {
        var link = links[i];
        if (link) {
            link.className = (i === current) ? 'current' : '';
        }
    }
}

// Устаревшая функция (оставлена для совместимости)
function renderNewsArchive(container, items) {
    renderNewsArchivePaginated(container, items);
}
