# Import Modules Rules

**You should follow these rules to import modules:**

- `/core/` - core code, **can't** import modules from `/frontend/`, but **can** import some modules from `/shared/`, may be used not only in frontend, but also in backend to create some shared logic
- `/pwa/`  - pwa  code, **can't** import modules from `/frontend/`
- `/frontend/` - frontend code, **can't** import modules from `/test/`

---

# Architecture / POV Notes

- `architecture.md` — draft “why/how” notes about the recent architectural direction (PWA + CRX + unified messaging + routing/associations).
