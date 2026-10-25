# Руководство по управлению сайтом прихода

## 📋 Структура проекта

```
site/
├── index.html               ← Главная страница
├── about.html               ← О жизни прихода
├── school.html              ← Воскресная школа
├── school/
│   ├── kids.html            ← Для детей
│   └── adults.html          ← Для взрослых
├── sacraments.html          ← Таинства Церкви
├── benefactors.html         ← Благотворителям
├── news/
│   ├── shablon-novosti.html ← ШАБЛОН для новых новостей
│   ├── news-1.html ...      ← Новости
│   └── ...
├── js/
│   ├── build.js             ← Оркестратор (build = cache-bust + update-images)
│   ├── cache-buster.js      ← Content hash для CSS/JS/news/announcements
│   ├── update-images.js     ← Дата деплоя для остальных изображений
│   ├── news-config.js       ← ⭐ Список новостей
│   ├── news-renderer.js     ← Рендер карточек, галерея, lightbox
│   ├── announcements-config.js ← Список объявлений
│   ├── announcements.js     ← Слайдер объявлений
│   ├── burger-menu.js       ← Мобильное меню
│   ├── constrain-calendar.js ← Календарь pravoslavie.ru
│   ├── generate-thumbnails.js ← WebP-превью для фото
│   └── generate-sitemap.js  ← Генерация sitemap.xml
├── css/
│   └── style.min.css        ← Основные стили
├── assets/
│   └── images/
│       ├── announcements/   ← Объявления (слайдер на главной)
│       ├── news/            ← Фото новостей
│       ├── icons/           ← Favicon (16, 32, 48, 64, 180, 192, 512)
│       ├── footer/          ← Иконки соцсетей
│       └── header.png       ← Логотип в шапке
├── .htaccess                ← Кэширование + gzip
├── package.json             ← npm-скрипты и зависимости
└── .github/workflows/deploy.yml ← Auto-deploy на Timeweb
```

---

## 📰 Добавление новости

### 1. Создайте файл новости

Скопируйте `news/shablon-novosti.html` в `news/news-N.html` (N — следующий номер).

Заполните:
- `<h1>` — заголовок новости
- `<p>` — текст
- `<meta name="description">` — краткое описание
- `<meta property="og:title">` — заголовок для соцсетей

### 2. Добавьте фото (если нужно)

1. Создайте папку `assets/images/news/news_N/`
2. Сохраните фото: `1.jpg`, `2.jpg`, `3.jpg`...
3. Запустите:
   ```bash
   npm run thumbnails
   ```
   Скрипт создаст WebP-превью в `thumbs/` (400px и 800px для retina).

### 3. Добавьте в news-config.js

Откройте `js/news-config.js` и добавьте объект **в начало массива**:

```javascript
{
  id: 'news-N',
  title: 'Заголовок новости',
  thumbnail: 'assets/images/news/news_N/news-N-thumb.webp',
  photos: ['1.jpg', '2.jpg', '3.jpg']
},
```

**Правила:**
- `id` должен совпадать с именем файла без `.html`
- `thumbnail` — путь к WebP-превью (создаётся `npm run thumbnails`)
- `photos` — массив имён файлов (без пути и расширения). Если фото не нужны — удалите это поле.
- Порядок в массиве — порядок отображения в галерее

### 4. Соберите и деплойте

```bash
npm run build        # Content hash + дата деплоя
npm run sitemap      # Обновить sitemap.xml
git add .
git commit -m "Добавлена новость N"
git push origin main
```

**После push** GitHub Actions автоматически деплоит на сервер.

---

## 🖼️ Замена расписания

Каждую неделю, когда меняете `assets/images/schedule/schedule.jpg`:

```bash
# Замените файл schedule.jpg новым
npm run build        # Обновит ?v= на сегодняшнюю дату
git add .
git commit -m "Обновлено расписание"
git push origin main
```

Браузер увидит новый URL и загрузит обновлённый файл.

---

## 📢 Управление объявлениями

Объявления — это слайдер на главной странице (правая колонка).

Откройте `js/announcements-config.js`:

```javascript
window.announcements = [
    'assets/images/announcements/ann1.jpg',
    'assets/images/announcements/ann2.jpg',
    'assets/images/announcements/ann3.jpg',
    'assets/images/announcements/ann4.jpg'
];
```

- Добавляйте/удаляйте элементы массива
- Файлы должны лежать в `assets/images/announcements/`
- После изменения запустите `npm run build` и деплойте

---

## 🎨 Фавикон

Чтобы обновить favicon:

1. Замените `assets/images/favicon.png` (исходное изображение)
2. Запустите:
   ```bash
   npm run favicon
   ```
   Скрипт создаст файлы в `assets/images/icons/`:
   - `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-64.png`
   - `icon-180.png` (Apple Touch Icon)
   - `icon-192.png` (Android/Chrome)
   - `icon-512.png` (PWA)

---

## ⚙️ Как работает кэширование

### Content hash (CSS, JS, news/announcements)
- Файлы кэшируются на **1 год** с `immutable`
- При изменении файла меняется MD5-хеш → новый URL → браузер подгружает
- **Не требует** очистки кеша

### Дата деплоя (остальные изображения)
- Файлы кэшируются на **1 год** с `immutable`
- При каждом `npm run build` все изображения получают текущую дату
- При замене schedule.jpg → `npm run build` → новый URL

### HTML (страницы)
- `no-cache, must-revalidate` — браузер всегда проверяет сервер
- При изменении HTML → новая страница загружается сразу

---

## 🔄 npm-скрипты

| Команда | Назначение |
|---|---|
| `npm run build` | Полный билд (cache-bust + update-images) |
| `npm run cache-bust` | Content hash для CSS/JS/news/announcements |
| `npm run update-images` | Дата деплоя для остальных изображений |
| `npm run thumbnails` | WebP-превью для фото новостей |
| `npm run sitemap` | Генерация sitemap.xml |
| `npm run favicon` | Создание favicon из исходника |

---

## 🚀 Деплой

При push в `main` GitHub Actions:
1. Запускает `npm run build`
2. Загружает файлы на Timeweb по FTP
3. Исключает: `.git`, `.github`, `README.md`, `node_modules`, `package*.json`

---

## 📝 Чек-лист перед публикацией

- [ ] Создан файл `news/news-N.html` по шаблону
- [ ] Заполнены заголовок и текст
- [ ] Добавлены фото в `assets/images/news/news_N/`
- [ ] Запущен `npm run thumbnails` (если новые фото)
- [ ] Добавлена запись в `js/news-config.js`
- [ ] Запущен `npm run build`
- [ ] Запущен `npm run sitemap`
- [ ] Проверено: новость появилась на главной?
