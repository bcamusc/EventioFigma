# Capa de Datos (Data Layer) - EventioFigma

Este documento describe la arquitectura de la base de datos de la **Plataforma Central** (la cual alimenta a múltiples agentes como URLito y scrapers). 

**Nota Crítica de Arquitectura**: Este proyecto (`EventioFigma`) es exclusivamente la **Interfaz de Usuario (UI)**. La base de datos NO pertenece a este proyecto frontend; el frontend actúa como un *consumidor* de esta base de datos.

**🚨 ¡REGLA DE ORO (CRÍTICA)! 🚨**
1. **SIN BBDD PROPIA (SOLO FRONTEND)**: Este proyecto es puramente la capa visual (React/Vite). **No tiene base de datos propia ni memoria**. Toda la información reside en el proyecto Supabase `qrginlyoyceragjgsepb` ("eventio"), que es gestionado y alimentado por el backend (alojado externamente, ej. Railway).
2. **LECTURA ESTRICTA DEL CATÁLOGO**: Para todas las tablas principales (`events`, `venues`, `shows`, `performers`, etc.), el frontend es un consumidor de **SOLO LECTURA**. ¡NUNCA debes alterar sus esquemas ni insertar datos de prueba mediante este proyecto!
3. **ESCRITURA LIMITADA**: El frontend *únicamente* escribe en tablas destinadas a la interacción del usuario en la app (ej. `user_favorites`, `user_activity`, o `app_settings` para admins).
4. **USO DE MCP Y ASESORÍA PROACTIVA**: En cada sesión, usa MCP en `qrginlyoyceragjgsepb` para leer la estructura real. Usa esto para proponer proactivamente cómo diseñar y mostrar la UI adaptada a esos datos.

## 1. Motor y ORM
- **Motor de Base de Datos**: PostgreSQL (Gestionado a través de Supabase).
- **Cliente / ORM**: `@supabase/supabase-js` (Consultas directas estilo Query Builder).
- **Patrón de Consultas**: Las consultas se realizan directamente desde los componentes React (en `useEffect`) o mediante funciones utilitarias en `src/lib/auth.ts`. Se utiliza destructuración `{ data, error }` nativa de Supabase.

## 2. Esquema de Base de Datos (Vía MCP)

> **🤖 INSTRUCCIÓN OBLIGATORIA PARA LA IA (AL INICIO DE SESIÓN):**
> El esquema real y completo de la base de datos (como las tablas `events`, `venues`, `shows`, `performers` y más de 90 otras tablas) ya no se documenta estáticamente aquí porque cambia y evoluciona.
> **Tu primera tarea obligatoria en la sesión** es ejecutar la herramienta `mcp_supabase_list_tables` apuntando al proyecto `qrginlyoyceragjgsepb` (esquema `public`) para cargar en tu memoria la estructura actualizada.
> Usa `mcp_supabase_list_tables` con el parámetro `verbose: true` para obtener detalles precisos de las columnas, tipos de datos y claves foráneas.

*(La estructura exacta debe ser obtenida y procesada dinámicamente por la IA en tiempo de ejecución al leer este documento)*.

## 3. Relaciones y Foreign Keys
- **`events` → `venues`**: Existe una relación explícita. El frontend consulta `.select('*, venues(name, comuna)')`, lo que indica una clave foránea desde `events` hacia `venues`.
- **`user_favorites` → `events` & `auth.users`**: Relación de vinculación (Join table).
- **`user_activity` → `events` & `auth.users`**: Relación opcional con eventos.

## 4. Reglas de Negocio en Base de Datos (Inferencia RLS)
Dado que es una aplicación que interactúa directamente desde el cliente web:
- **Lecturas Públicas**: `events`, `venues` y `app_settings` probablemente tienen RLS (Row Level Security) permitiendo `SELECT` público (anon), ya que la app muestra eventos antes del login.
- **Escrituras Restringidas**: La tabla `app_settings` debe tener políticas que restrinjan el `UPSERT` únicamente a roles de administrador (o filtrado en el cliente vía el email de admin).
- **Aislamiento de Usuarios**: Las tablas `user_favorites` y `user_activity` asumen que un usuario solo puede insertar o borrar filas donde `user_id === auth.uid()`, aunque la capa de la aplicación explícitamente pasa el `userId` en las llamadas.

## 5. Patrones Críticos de Consulta
- **Filtrado Dinámico de Arrays**: En `App.tsx`, las consultas hacen uso intensivo del operador `.in('category', [...])` apoyándose fuertemente en las configuraciones cargadas desde `app_settings`.
- **Upserting**: En `Admin.tsx`, se usa la función `.upsert()` en lote para actualizar las listas blancas de comunas y categorías en un solo request a la DB.
