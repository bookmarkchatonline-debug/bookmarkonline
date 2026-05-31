# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## BookmarkChat — Creator Features (Local / Free Firebase Projects)

This project includes a lightweight creator ecosystem built to work on Firebase free projects without requiring Cloud Functions. Key capabilities:

- Free artist plan enforcement via Firestore rules and client-side checks (3 uploads limit).
- Client-side live feed writes on uploads and likes so the homepage feels alive without functions.
- Admin UI for computing weekly winners and publishing monthly Gold Tape awards on-demand from the browser.

If you later enable Cloud Functions (recommended for production): the `functions/` folder contains optional server logic for automated stats aggregation and scheduled awards. Deploying functions is optional — the app works with client-side alternatives provided.

Local dev:
```bash
# install
npm install

# run frontend
npm run dev

# (optional) if you enable functions and firebase-tools
cd functions
npm install
npx firebase emulators:start --only functions
```

Deployment notes:
- Firestore rules are in `firestore.rules` and indexes in `firestore.indexes.json`.
- If you enable Cloud Functions, deploy them from the `functions/` folder.

