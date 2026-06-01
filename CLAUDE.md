# EventioFigma — UI Pública de Eventos

## Qué es
Frontend móvil-first para descubrir eventos culturales en Chile. Consume datos de Supabase que fueron scrapeados por **eventio** y procesados por **eventio-review**.

## Ecosistema
```
eventio             → scrapea 22 fuentes → Supabase
eventio-review      → procesa con IA → Supabase
EventioFigma (este repo) → muestra al público desde Supabase
```

## Stack
- **Framework**: React 18.3 + Vite 6.3
- **Estilos**: Tailwind CSS 4 + Framer Motion (motion)
- **Componentes**: Radix UI + Lucide React
- **Auth**: Supabase Google OAuth (login obligatorio)
- **Analytics**: PostHog
- **Deploy**: Vercel (auto-deploy desde GitHub, `eventio-figma.vercel.app`)

## Arquitectura
- Componente principal: `src/app/App.tsx` (todo en un archivo)
- Supabase client: `src/lib/supabase.ts`
- Auth helpers: `src/lib/auth.ts`
- Skeletons: `src/app/components/EventSkeleton.tsx`
- Enrutamiento manual via `window.location.pathname` en `main.tsx`

## Flujo de datos
1. App carga → auth check (Google OAuth, timeout 500ms)
2. Si no hay user → LoginScreen
3. Si hay user → fetch eventos via REST directo a Supabase (NO usa el JS client para queries)
4. Filtros: categoría, subcategoría, ciudad/comuna, fecha, búsqueda
5. Favoritos guardados en Supabase por user

## Query de eventos
Usa `fetch()` directo a la REST API de Supabase (no el JS client) para evitar que el auth client bloquee las queries:
```
GET /rest/v1/events?select=id,title,category,...,venues(name,comuna)&datetime=gte.{now}&order=datetime.asc&limit=50
```
NO usa `select(*)` — las columnas raw_html, clean_text, analysis_v2, embedding pesan MB y causan timeout.

## Variables de entorno (Vercel)
```
VITE_SUPABASE_URL=https://qrginlyoyceragjgsepb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_PUBLIC_POSTHOG_TOKEN=phc_...
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Problemas conocidos y soluciones
- **Skeleton infinito**: Causado por extensiones que bloquean `navigator.locks` (Scrapfly, ad blockers). Por eso se usa fetch directo en vez del Supabase JS client para la query de eventos.
- **Categorías con "error"**: Los scrapers guardan categorías mal formateadas. Se filtran en el mapping: si contiene "error" → null, si tiene "/" → se toma la primera parte.
- **Cache del PWA**: El PWA fue eliminado completamente. Si un usuario tiene cache viejo, debe limpiar datos del sitio una vez.
- **Auth timeout**: Si Supabase auth tarda más de 500ms, se fuerza authReady=true. El login guard muestra LoginScreen si no hay user.

## Convenciones (del PROJECT.md original)
- Nomenclatura: PascalCase.tsx para componentes, camelCase para utils
- Estilos: ternarios lógicos para dark/light mode (no usar `dark:` de Tailwind)
- Patrón Top-Down en componentes: Imports → Constantes → Estado → Efectos → Handlers → Return

## Notas importantes
- NO agregar `vite-plugin-pwa` de vuelta — causa problemas de cache irrecuperables
- NO usar `select('*')` en queries a events — trae columnas pesadas (raw_html, embeddings)
- El vercel.json tiene headers no-cache para HTML, immutable para assets hasheados
- El repo en GitHub: `github.com/bcamusc/EventioFigma`
