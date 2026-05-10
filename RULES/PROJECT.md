# EventioFigma - Master Project Document

Este documento consolida el contexto, la arquitectura y las convenciones del proyecto para evitar duplicidad de archivos.

## 1. Producto y Ecosistema
**EventioFigma** es el frontend (UI) de una plataforma dinámica de descubrimiento de eventos. 
Este proyecto es un **consumidor** de una **Plataforma Centralizada** alimentada por agentes de IA que scrapean y curan eventos en la nube.
- **Público General**: Navega y descubre eventos apoyados en un diseño premium ("Mori Light UI").
- **Administradores**: Modifican la visibilidad de categorías/comunas y usan el "Dictado Mágico" para corregir datos vía IA (`AdminUrlito.tsx`).

## 2. Arquitectura y Stack
- **Framework**: React 18.3 + Vite 6.3
- **Estilos**: Tailwind CSS 4 (`@tailwindcss/vite`) + Framer Motion
- **Componentes UI**: Radix UI + Lucide React
- **Backend / Auth**: Supabase JS (Base de Datos PostgreSQL, Google OAuth).
- **Desarrollo Asistido por IA (MCP)**: Se utiliza el Servidor MCP de Supabase para **consultar dinámicamente** la estructura de la base de datos de producción (`eventio`) al inicio de cada sesión. **No se utiliza para administrar/modificar esquemas** desde este proyecto frontend, sino para entender los datos reales y mejorar los componentes UI.
- **Analíticas / PWA**: PostHog + Vite PWA Plugin.
- **Enrutamiento**: Se realiza de forma manual evaluando `window.location.pathname` en `main.tsx`.
- **Estado Actual / Deuda Técnica**: 🚨 Alerta Crítica de Seguridad: 93 tablas en el proyecto de Supabase actualmente tienen el RLS (Row Level Security) desactivado. Deben establecerse las políticas para prevenir vulnerabilidades desde la conexión anónima del frontend.

## 3. Convenciones de Código (Estrictas)
- **Estructura**: `src/app/` (Contenedores/Páginas), `src/app/components/` (Componentes reutilizables), `src/lib/` (Servicios como auth y supabase).
- **Nomenclatura**: `PascalCase.tsx` para componentes, `camelCase` para utilidades, `UPPER_SNAKE_CASE` para constantes estáticas globales.
- **Patrón "Top-Down"**: Los componentes de React siguen un orden predecible: Imports -> Constantes Externas -> Estado Local -> Efectos -> Handlers -> Retornos Tempranos (Guard Clauses para estados de carga/auth) -> Retorno Principal JSX.
- **Estilos y Temas**: El modo claro/oscuro se maneja con ternarios lógicos en React (ej. `isLightMode ? 'bg-white' : 'bg-black'`), no dependiendo ciegamente de la clase `dark:` nativa de Tailwind.
- **Estado Optimista**: La UI prioriza respuestas rápidas apoyadas en flags booleanas (`loading`, `saving`) en vez de pesados manejadores de errores de red.

## 4. Archivos Clave del Repositorio
Para entender el resto de las reglas, refiérete exclusivamente a:
- **`RULES/SESSIONS.md`**: Reglas de comportamiento para la Inteligencia Artificial (restricciones de dependencias y formato).
- **`RULES/DATABASE.md`**: Esquema de la base de datos consumida por la plataforma.
