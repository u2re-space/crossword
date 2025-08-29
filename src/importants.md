# Import Modules Rules

You should follow these rules to import modules:

- `/frontend/` - frontend code, **can't** import modules from `/views/` or `/core/`, but **can** import modules from `/shared/`
- `/views/` - views code, **can** import modules from `/frontend/` and `/core/`, but **can** import modules from `/shared/`
- `/core/` - core code, **can't** import modules from `/frontend/` or `/views/`, but **can** import some modules from `/shared/`, may be used not only in frontend, but also in backend to create some shared logic
- `/shared/` - shared code, **can't** import modules from `/src/`, `/frontend/` and `/views/`, and may be used in frontend and backend
- `/test/` - test code, **can't** import modules from `/src/`, `/frontend/` or `/views/`
- `/pwa/` - pwa code, **can't** import modules from `/frontend/` or `/views/`
- `/src/` - main code, **can't** import modules from `/test/`
- `/main.mjs` - main entry point, can be imported only by `/index.html`
- `/index.html` - application entry point, can be imported only by `/main.mjs`
- `/vite.config.js` - vite config, **can't** import modules from `/src/`
- `/tsconfig.json` - tsconfig, **can't** import modules from `/src/`
- `/package.json` - package.json, **can't** import modules from `/src/`
