# SESSIONS.md - AI Assistant Directives

This document dictates strict behavioral rules, technology constraints, and response formats that you (the AI assistant) MUST follow in every session for the EventioFigma project. 

## 1. Tech Stack & Versions
You must strictly adhere to the following stack. **Do not deviate or suggest alternatives.**
- **React**: 18.x
- **Vite**: 6.x
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), without legacy `postcss` configuration.
- **UI Components**: Radix UI (`@radix-ui/react-*`), Lucide React (icons), Motion (framer-motion).
- **Backend / Auth / Database**: Supabase (`@supabase/supabase-js`).
- **Analytics**: PostHog (`posthog-js`).
- **PWA**: `vite-plugin-pwa`.

## 2. Established Patterns & Conventions
- **Routing**: This app uses manual routing via `window.location.pathname` in `src/main.tsx` (e.g., `/admin` routes to `<Admin />`, otherwise `<App />`). Do not introduce `react-router-dom` unless explicitly commanded.
- **Component Structure (Top-Down)**: 
  1. Imports
  2. Static constants (`UPPER_SNAKE_CASE` or static objects) outside the component.
  3. Component declaration (`export default function...`).
  4. React hooks (`useState`, `useEffect`).
  5. Handler functions.
  6. Guard clauses (early returns for `!authReady`, `!user`, or `loading` states).
  7. Main JSX return using semantic HTML and Tailwind utility classes.
- **Styling Paradigm**: The app heavily uses inline ternary operators for dark/light mode instead of the native Tailwind `dark:` modifier (e.g., `${isLightMode ? 'bg-white' : 'bg-neutral-950'}`). Maintain this existing pattern.
- **Optimistic UI / State-Driven Flow**: Rely on boolean flags (`loading`, `saving`, `saved`) for immediate user feedback. Do not wrap everything in heavy `try/catch` blocks unless fetching/mutating complex database transactions. Rely on Supabase's `{ data, error }` destructuring pattern.
- **Assets**: Figma imports use a custom Vite resolver `figma:asset/`.

## 3. What You Must NEVER Do
- **NEVER introduce unauthorized dependencies**: Do not install Redux, Zustand, React Query, Axios, or legacy Tailwind configurations unless specifically asked.
- **NEVER break existing patterns**: Do not rewrite the routing logic, the `App.tsx` filtering logic, or the dark/light mode toggles to fit an "ideal" architecture. Stick to what is already there.
- **NEVER write partial code**: No placeholders like `// ... rest of the code ...` or `// ... existing code ...`. If you provide code, it must be complete or precisely targeted via your replacement tools.
- **NEVER use generic placeholder data**: For UI designs, always use realistic mock data and real Unsplash image URLs (the PWA caching is already configured for this).

## 4. How to Respond
- **Direct**: No conversational fluff, no greetings, no asking for permission. Just execute the solution.
- **Full File Content**: If outputting a file, provide the entire file content so it can be copy-pasted or written directly, or use your exact file replacement tool perfectly.
- **Exact Paths Always**: Always use full absolute paths or precise relative paths from the root (e.g., `src/app/App.tsx`). Do not say "in the main file". 
- **No Questions**: Assume you have the context. If you lack information, infer it from the codebase or do the closest approximation based on established conventions.

## 5. Project-Specific Rules
- **Category & Filtering Logic**: The application uses a predefined set of categories (`ALL_CATEGORIES`, `subCategories`) stored in Supabase `app_settings` to dynamically control what is visible. If modifying categories, you must account for both the UI mapping (in `App.tsx` / `Admin.tsx`) and the database.
- **City Whitelist**: The `comunas` array in the database dictates which cities are visible.
- **Mori Light UI**: When asked to implement or fix "theater" or "event" UI, prioritize a highly polished, clean, "Light Mode" aesthetic with smooth Framer Motion (`motion`) transitions.
- **Deployment & Git**: Estamos en la nube (Vercel para Frontend, Supabase/Railway para Backend). Todo cambio o corrección debe ser subido a GitHub (`git add`, `git commit`, `git push origin main`) para que Vercel reconstruya y los cambios se reflejen en producción.

## 6. Comandos de Flujo de Trabajo (Workflow Commands)
Debes reaccionar inmediatamente a los siguientes comandos si el usuario los escribe:

- **`/start`**: Inicia formalmente la sesión. Al recibirlo, debes confirmar que has asimilado `RULES/PROJECT.md`, `RULES/SESSIONS.md` y `RULES/DATABASE.md`, conectarte al servidor MCP (si está disponible) y declarar que estás listo para aplicar código directamente bajo las reglas de EventioFigma.
- **`/end`**: Finaliza la sesión actual. Antes de generar tu respuesta final, DEBES:
  1. Analizar si la sesión introdujo nuevos patrones, componentes mayores, cambios en el esquema de BD o modificaciones en el stack.
  2. Usar tus herramientas para EDITAR y ACTUALIZAR `RULES/PROJECT.md`, `RULES/SESSIONS.md` y/o `RULES/DATABASE.md` para reflejar el nuevo estado real del código y arquitectura.
  3. Tras actualizar la documentación, responder con:
     - Un resumen de los logros y qué se actualizó en los archivos de la carpeta `RULES/`.
     - Una lista de los archivos del proyecto que se modificaron.
     - Una sugerencia de mensaje de commit estructurado (semantic commit).
