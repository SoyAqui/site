# Руководство по управлению новостями сайта прихода

Это руководство поможет добавить и обновлять новости на сайте без знаний программирования.

---

## Структура проекта

```
syte1.0/
├── index.html               ← Главная страница
├── about.html, school.html  ← Остальные страницы
├── faq.html                 ← Вопрос-ответ
├── news/
│   ├── shablon-novosti.html ← ШАБЛОН для новых новостей (не удалять!)
│   ├── news-1.html ... news-6.html  ← Существующие новости
│   └── news-7.html ...      ← Новые новости
├── js/
│   ├── news-config.js       ← ⭐ ГЛАВНЫЙ ФАЙЛ: список новостей
│   ├── news-renderer.js     ← Скрипт отрисовки (не трогать)
│   ├── announcements-config.js  ← Объявления
│   └── main.js              ← Общие скрипты
├── css/
│   └── style.css            ← Стили (не трогать)
├── assets/images/news/      ← Папка для фото новостей
│   ├── news_1/
│   ├── news_2/
│   └── news_7/              ← Папка для новых новостей
│       └── thumbs/          ← Миниатюры (создаются автоматически)
└── package.json             ← Зависимости
```

---

## Пошаговая инструкция: Как добавить новость

### Шаг 1. Создайте файл новости

1. Откройте `news/shablon-novosti.html`
2. Сохраните его как `news/news-7.html` (или news-8.html, news-9.html и т.д.)
   - Имя должно быть на латинице без пробелов
   - Номер должен соответствовать порядковому номеру

### Шаг 2. Заполните содержимое

Откройте новый файл и замените:

**Заголовок:**
```html
<h1>Ваш заголовок новости</h1>
```

**Текст:**
```html
<p>Первый абзац...</p>
<p>Второй абзац...</p>
```

**Meta теги:**
```html
<meta name="description" content="Краткое описание новости">
<meta property="og:title" content="Заголовок — Приход Храма">
```

### Шаг 3. Добавьте изображения

#### 3.1. Сохраните фото

1. Создайте папку `assets/images/news/news_N/` (где N — номер новости)
2. Сохраните ваши фото в эту папку с именами на латинице:
   - `photo1.jpg`
   - `photo2.jpg`
   - `photo3.jpg`

#### 3.2. Создайте миниатюры

Откройте терминал в корневой папке проекта и выполните:

```bash
npm run thumbnails
```

Скрипт создаст в папке `thumbs/`:
- `photo1-400.jpg` и `photo1-400.webp` — для мобильных
- `photo1-800.jpg` и `photo1-800.webp` — для десктопа и retina

#### 3.3. Добавьте фото в конфигурацию

Откройте `js/news-config.js` и добавьте поле `photos` в вашу новость:

```javascript
{
  id: 'news-15',
  title: 'Название новости',
  thumbnail: 'assets/images/news/news_15/photo1.jpg',
  photos: [
    'photo1.jpg',
    'photo2.jpg',
    'photo3.jpg'
  ]
}
```

**Готово!** Галерея с фото создастся **автоматически** на странице новости.

**Важно:**
- Указывайте только имена файлов (без пути и без расширения обязательно)
- Все фото из массива будут добавлены в галерею
- Порядок в массиве — порядок отображения
- **Не нужно** добавлять `<div id="auto-gallery">` в HTML — он создастся автоматически, если есть поле `photos`

**Если фото не нужны**, просто не добавляйте поле `photos` — галереи не будет.

### Шаг 4. Добавьте новость в список

Откройте `js/news-config.js` и добавьте запись в **начало** массива:

```javascript
window.newsData = [

  {
    id: 'news-7',
    title: 'Ваша новая новость',
    thumbnail: 'assets/images/news/news_7/photo1.jpg'
  },

  {
    id: 'news-6',
    title: 'Молебен в больнице...',
    thumbnail: 'assets/images/news/news_6/news-6-thumb.webp'
  },
  // ... остальные новости
];
```

**Поля:**
- `id: 'news-7'` — должно совпадать с именем файла без `.html`
- `title: '...'` — заголовок для карточки на главной
- `thumbnail: '...'` — путь к любому фото из этой новости

### Шаг 5. Проверьте результат

1. Откройте `index.html` в браузере
2. В блоке "Новости прихода" должна появиться ваша новость первой
3. Кликните на карточку — откроется полная новость
4. Кликните на фото — откроется lightbox с полным размером

---

## Важные правила

✅ **Порядок имеет значение**  
Первая новость в списке — самая свежая. Она отображается на главной.

✅ **На главной — только 6 новостей**  
Если новостей больше 6, самые старые автоматически попадают в список на странице «О жизни прихода» (about.html). Там можно прочитать все.

✅ **Имя файла = `id`**  
Если `id: 'news-7'`, то файл должен называться `news/news-7.html`.

✅ **Пути относительные**  
Все пути начинаются с корня проекта:
- Фото: `assets/images/news/news_7/имя.jpg`
- Новости: `news/news-7.html`

✅ **Миниатюры обязательны**  
Перед использованием фото запустите `npm run thumbnails`.

---

## Как переместить новость на главную

Чтобы новость попала на главную:
1. Откройте `js/news-config.js`
2. Найдите нужную новость
3. Переместите её **ближе к началу** массива

**Примечание:** На главной показывается только 6 самых свежих новостей. Остальные автоматически отображаются в списке на странице «О жизни прихода».

---

## Как добавить фото без редактирования HTML

Раньше нужно было вручную копировать блоки `<picture>` для каждого фото. **Теперь это не нужно!**

Просто добавьте имена файлов в массив `photos` в `news-config.js`:

```javascript
photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
```

Галерея создастся автоматически. Порядок фото в массиве — порядок отображения на странице.

---

## Чек-лист перед публикацией

- [ ] Создан файл `news/news-N.html` по шаблону
- [ ] Заполнены заголовок и текст
- [ ] Добавлены фото в `assets/images/news/news_N/`
- [ ] Запущен `npm run thumbnails`
- [ ] Вставлен код галереи в HTML
- [ ] Добавлена запись в `js/news-config.js`
- [ ] Проверено: новость появилась на главной?

---

## Пример готовой новости

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Крестный ход Симбирской Епархии">
    <meta property="og:type" content="article">
    <meta property="og:title" content="Крестный ход — Приход Храма">
    <meta property="og:locale" content="ru_RU">
    <title>Крестный ход — Приход Храма</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <main class="container">
        <article>
            <h1>Крестный ход</h1>
            <p>2 августа прихожане прошли Крестный путь около 20 километров.</p>

            <div class="news-gallery">
                <a href="../assets/images/news/news_2/photo1.jpg" class="lightbox-link">
                    <picture>
                        <source media="(min-width: 768px)" srcset="../assets/images/news/news_2/thumbs/photo1-800.jpg 800w,
                                ../assets/images/news/news_2/photo1.jpg 1200w" type="image/jpeg">
                        <source srcset="../assets/images/news/news_2/thumbs/photo1-400.webp 1x,
                                ../assets/images/news/news_2/thumbs/photo1-800.webp 2x" type="image/webp">
                        <source srcset="../assets/images/news/news_2/thumbs/photo1-400.jpg 1x,
                                ../assets/images/news/news_2/thumbs/photo1-800.jpg 2x" type="image/jpeg">
                        <img src="../assets/images/news/news_2/thumbs/photo1-800.jpg"
                             alt="Фото крестного хода" loading="lazy" decoding="async"/>
                    </picture>
                </a>
            </div>
        </article>
    </main>
    <div id="lightbox" class="lightbox" style="display:none;">
        <img src="" alt="">
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = lightbox.querySelector('img');
            document.querySelectorAll('.lightbox-link').forEach(function(a){
                a.addEventListener('click', function(e){
                    e.preventDefault();
                    lightboxImg.src = a.href;
                    lightbox.style.display = 'flex';
                });
            });
            lightbox.addEventListener('click', function(){
                lightbox.style.display = 'none';
            });
        });
    </script>
</body>
</html>
```
