Сгенерируй компонент EntityCard.tsx:
- Пропсы: entity (union: Task|Event|Offer|Place), onAction(action)
- Видимые поля: title, time range, place name, badges (offer/weather), действия (Add, Route, Copy promo)
- Адаптив и a11y, без внешних изображений.
- Вынеси форматирование времени в util.
Также создай: stories/EntityCard.stories.tsx с 3 кейсами и минимальный тест utils/timeRange.test.ts.
Правь только указанные файлы. Следуй .cursorrules.
