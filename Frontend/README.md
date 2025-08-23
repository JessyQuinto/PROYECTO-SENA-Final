# Frontend Demo

Stack: React + Vite + TypeScript.

Scripts (npm):

- `npm run dev` arranca entorno local (Vite + React Refresh).
- `npm run build` genera producción.
- `npm run preview` sirve el build.

Instalación:

1. `cd Frontend`
2. `npm install`
3. Copia `.env.example` a `.env.local` y completa tus variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BACKEND_URL` (opcional)

Notas:

- Vite sólo expone variables con prefijo `VITE_`.
- Si no configuras Supabase, la app mostrará errores controlados en consola y funcionalidad limitada.

Estructura:

```
Frontend/
  index.html
  src/
    main.tsx
    modules/
      App.tsx
      Landing.tsx

Desarrollo en Windows (PowerShell):
```

cd Frontend
npm install
copy .env.example .env.local
npm run dev

```

```
