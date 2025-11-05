# Import Modules Rules

You should follow these rules to import modules:

- `/core/` - core code, **can't** import modules from `/frontend/`, but **can** import some modules from `/shared/`, may be used not only in frontend, but also in backend to create some shared logic
- `/shared/` - shared code, **can't** import modules from `/src/`, `/frontend/`, and may be used in frontend and backend
- `/test/` - test code, **can't** import modules from `/src/`, `/frontend/`
- `/pwa/` - pwa code, **can't** import modules from `/frontend/`
- `/src/` - main code, **can't** import modules from `/test/`
