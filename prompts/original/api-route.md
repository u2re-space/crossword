Добавь API-роут /api/timeline (Next.js route handler):
Вход: GET ?date=ISO&lat=..&lon=..&types=task,event,offer
Выход: { items: Entity[] } по единой Zod-схеме.
Сделай:
- lib/schemas/entity.ts — Zod схемы (Entity, Place, Offer, etc.)
- app/api/timeline/route.ts — handler, валидация query, mock-данные
- lib/timeline/buildTimeline.ts — сортировка и фильтры
Критерии: корректная валидация, типобезопасность, без сторонних libs.
Правь только эти файлы.
