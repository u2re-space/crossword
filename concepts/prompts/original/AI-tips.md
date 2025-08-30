Отлично, давайте соберём практичную стратегию промптинга под Cursor IDE, чтобы он помогал быстро и предсказуемо. Ниже — процесс, правила, и готовые шаблоны промптов/файлов, которые можно сразу использовать.

Цель
- Быстро выводить рабочие экраны и фичи с минимальными правками.
- Стабильное поведение ИИ за счёт явных правил (.cursorrules) и маленьких диффов.
- Минимум «магии»: шаги «спланируй → измени локально → проверь критерии».

Что важно знать про Cursor
- Он сильнее работает, когда:
  - В корне есть .cursorrules с правилами по стеку/код‑стайлу.
  - В Chat закреплены (pin) релевантные файлы: package.json, tsconfig, глобальные стили, ключевые компоненты.
  - Вы используете Edit (выделение кода) для локальных правок, а не просите «переписать проект».
  - Вы даёте критерии приёмки и список файлов для правки.

Файл .cursorrules (положите в корень репозитория)
Содержимое пример под ваш стек (правьте по себе):
```txt
# Stack and conventions
Use: Next.js (App Router) + React + TypeScript (strict), TailwindCSS + shadcn/ui (Radix), Zustand, TanStack Query, Zod, date-fns-tz, Dexie (IndexedDB) + OPFS for blobs, MapLibre GL, Umami analytics.
Do not add other UI libs or state managers.
CSS only via Tailwind + CSS variables (HSL). Keep design tokens in styles/globals.css.

# Architecture
Follow ports/adapters:
- lib/store/entityStore.ts: getById, query, upsert, batch
- lib/timeline/buildTimeline.ts: buildTimeline(entities, opts)
- components/entity/EntityCard.tsx — universal entity card
- components/timeline/TimelineView.tsx — day/week
- app/(routes)/timeline, /search, /tasks, /settings

# Quality gates
- TypeScript strict, no any unless justified with comment.
- Accessibility: focus states, aria labels, keyboard nav.
- Performance: no heavy deps; virtualize long lists.
- Tests minimal: unit (Zod schemas), smoke tests for utils.
- Commits: Conventional Commits.

# UI/UX rules
- One Add flow (Drawer). Universal EntityCard layout.
- 12 components max in MVP. 4 screens: Timeline, Search, Entity, Add.
- States: loading/skeleton, empty, error in each view.
- Animations 100–150ms, reduce-motion respected.

# Data and schemas
- All entities validated by Zod. Time in ISO 8601 with TZ.
- IDs: ULID. LWW conflict resolution.
- Do not couple UI to storage details.

# What to ask user
If requirements unclear: ask for missing props, acceptance criteria, file paths. Never invent APIs.
```

Базовый рабочий цикл в Cursor
1) Инициализация контекста в Chat (одним сообщением, закрепите его)
- Прикрепите package.json, tsconfig.json, .cursorrules, структуру app/, ключевые компоненты.
- Вставьте «карту проекта» (ниже шаблон) и закрепите.

2) Планирование (Architect pass)
- Попросите составить план изменений по шагам с перечислением файлов и критериев приёмки.

3) Реализация малыми диффами
- Используйте Edit для конкретных файлов/фрагментов.
- Один промпт — один модуль/файл, дифф < 150 строк.
- После каждого шага — локальный запуск и быстрый тест.

4) Ревью и доработка
- Просите Cursor сделать self‑review против .cursorrules и критериев.

Шаблон «Карта проекта» для первого сообщения в Chat (закрепите)
```txt
Контекст: MVP приложения Timeline (Next.js App Router).
Экраны: /timeline (день/неделя + погода + офферы), /search, /tasks, /settings.
Ключевые сущности: event, task, place, specialist, offer, weather.
Хранилище: Local-first — IndexedDB (Dexie) + OPFS для blob; порт EntityStore скрывает детали.
Требования: доступность, быстрая навигация, один Add Drawer.
Из этого чата: 
- Предпочитай shadcn/ui + Tailwind и соблюдай .cursorrules.
- Предлагай план (список файлов и критерии), затем правь указанные файлы.
- Если чего-то не хватает — задай уточняющие вопросы.
```

Шаблон промпта «Планирование фичи» (Architect)
```txt
Задача: Добавить экран Timeline (день/неделя) с полосой погоды и фильтрами.
Сделай план из шагов с файлами к правке и критериями приёмки. Не пиши код пока.
Ограничения: 
- Стек и правила в .cursorrules. 
- Используй components/timeline/TimelineView.tsx, lib/timeline/buildTimeline.ts, components/entity/EntityCard.tsx. 
- Не добавляй зависимости без разрешения.
Критерии приёмки:
- На /timeline вижу события/задачи в порядке времени; переключатель день/неделя.
- Погода по часам сверху; фильтры по типу и радиусу.
- Карточка по клику открывает Drawer с подробностями.
Вывод: перечисли шаги, файлы, новые типы/пропсы и краткую архитектуру рендера.
```

Шаблон промпта «Реализуй файл/модуль» (Edit)
```txt
Цель: Реализовать TimelineView.tsx (скелет).
Правь только файл components/timeline/TimelineView.tsx.
Входные данные:
- Пропсы: { entities: Entity[], view: 'day'|'week', date: Date, onSelect(entityId) }
- Используй CSS Grid (шаг 30 мин, 32px/слот), виртуализация не нужна пока.
- Блок погоды над сеткой, скролл по вертикали.
Требования:
- Адаптив (мобайл/десктоп), доступность (role=grid, keyboard).
- Состояния: empty, loading (скелетоны).
- Без новых зависимостей.
Критерии: сборка проходит, eslint ок, визуально видны слоты и карточки.
Сгенерируй полный код файла.
```

Шаблон «Компонент с тестом и сторибуком»
```txt
Сгенерируй компонент EntityCard.tsx:
- Пропсы: entity (union: Task|Event|Offer|Place), onAction(action)
- Видимые поля: title, time range, place name, badges (offer/weather), действия (Add, Route, Copy promo)
- Адаптив и a11y, без внешних изображений.
- Вынеси форматирование времени в util.
Также создай: stories/EntityCard.stories.tsx с 3 кейсами и минимальный тест utils/timeRange.test.ts.
Правь только указанные файлы. Следуй .cursorrules.
```

Шаблон «API‑роут/схема данных»
```txt
Добавь API-роут /api/timeline (Next.js route handler):
Вход: GET ?date=ISO&lat=..&lon=..&types=task,event,offer
Выход: { items: Entity[] } по единой Zod-схеме.
Сделай:
- lib/schemas/entity.ts — Zod схемы (Entity, Place, Offer, etc.)
- app/api/timeline/route.ts — handler, валидация query, mock-данные
- lib/timeline/buildTimeline.ts — сортировка и фильтры
Критерии: корректная валидация, типобезопасность, без сторонних libs.
Правь только эти файлы.
```

Шаблон «Bugfix с воспроизведением»
```txt
Баг: При переключении на неделю карточки перекрываются.
Шаги воспроизведения: 1) /timeline 2) переключить week 3) элементы налезают.
Ожидаемо: колонки по дням, карточки не перекрываются, shift по оси X для коллизий.
Правь только components/timeline/TimelineView.tsx, не меняй API.
Добавь комментарий с объяснением решения.
```

Шаблон «Self‑review промпт»
```txt
Сделай self-review последних изменений по .cursorrules:
- Стек/зависимости не нарушены?
- Accessibility и состояния есть?
- Типы и Zod схемы корректны?
- Производительность: нет ли лишних ререндеров?
Верни список замечаний и предложи точечные правки (с файлами).
```

Шаблон «Скаффолдинг проекта» (в начале)
```txt
Нужен скелет проекта согласно .cursorrules:
- Next.js App Router, TypeScript strict, Tailwind + shadcn/ui
- Настрой тему (CSS variables HSL), шрифты, иконки
- Маршруты: /timeline, /search, /tasks, /settings
- Базовые компоненты: AppShell, Topbar, Sidebar, AddDrawer
- Установи и инициализируй: zustand, @tanstack/react-query, zod, dexie, maplibre-gl, date-fns-tz, lucide-react
- Добавь placeholder TimelineView и EntityCard
Сгенерируй план команд (pnpm/yarn) и файлы. Затем создавай файлы небольшими порциями.
```

Шаблон «Голос/интенты»
```txt
Добавь минимальную интеграцию голосовых команд:
- Используй Web Speech API (если доступно) с fallback «недоступно».
- Интенты: create_task, create_event (распознаём ключевые слова и дату/время простым парсером)
- Поток: нажал микрофон -> запись -> разбор -> превью AddDrawer -> подтверждение -> создание сущности
Правь: components/add/VoiceCapture.tsx, интеграция в AddDrawer.
Не добавляй сторонние STT/LLM на этом шаге.
```

Практические правила для промптов
- Всегда перечисляйте файлы для правки и явные критерии приёмки.
- Дробите задачи: один модуль/компонент за раз.
- Запрашивайте план перед кодом.
- Просите вопросы, если контекст неполный.
- Настаивайте на «не добавлять зависимости без разрешения».
- Периодически прогоняйте self‑review.
- Закрепляйте (pin) обновлённые ключевые файлы в чате.

Мини‑чек‑лист перед «генерацией»
- Есть .cursorrules и он актуален.
- В чате закреплены ключевые файлы/структура.
- Сформулированы Acceptance Criteria.
- Ограничен список файлов для правок.
- Понимаете, как проверите результат (локальный запуск, тест/стори).

Пример быстрой сессии в Cursor (первые 2–3 часа)
- Шаг 1: Вставьте .cursorrules и выполните скаффолдинг (по шаблону).
- Шаг 2: План по Timeline (Architect), затем реализация TimelineView скелета (Edit).
- Шаг 3: EntityCard + Drawer «Add» (Edit).
- Шаг 4: Zod схемы и mock /api/timeline (Edit).
- Шаг 5: Self‑review и полировка состояний.

Хотите — пришлю вам готовый .cursorrules и набор промптов в файлах (prompts/…) под ваш стек, плюс шаблон Entity/Zod схем. Скажите:
- Используем pnpm, yarn или npm?
- Какой цвет акцента и 2–3 референса по визуалу (для токенов темы)?
- Нужен ли сразу MapLibre и Voice в первый проход, или отложим на второй?
