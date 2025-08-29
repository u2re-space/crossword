Контекст: MVP приложения Timeline (Next.js App Router).
Экраны: /timeline (день/неделя + погода + офферы), /search, /tasks, /settings.
Ключевые сущности: event, task, place, specialist, offer, weather.
Хранилище: Local-first — IndexedDB (Dexie) + OPFS для blob; порт EntityStore скрывает детали.
Требования: доступность, быстрая навигация, один Add Drawer.
Из этого чата:
- Предпочитай shadcn/ui + Tailwind и соблюдай .cursorrules.
- Предлагай план (список файлов и критерии), затем правь указанные файлы.
- Если чего-то не хватает — задай уточняющие вопросы.
