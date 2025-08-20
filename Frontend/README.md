# Frontend Demo

Stack: React + Vite + TypeScript + Bun (monorepo workspace).

Scripts:
- `bun run dev` arranca entorno local (Vite + React Refresh).
- `bun run build` genera producción.
- `bun run preview` sirve build.

Siguientes pasos sugeridos:
1. Instalar SDK Supabase (ya agregado): `bun install`.
2. Crear cliente y contexto de sesión.
3. Implementar flujo de login/signup.
4. Consumir RPC `crear_pedido` (cuando backend listo).

Estructura:
```
Frontend/
  index.html
  src/
    main.tsx
    modules/
      App.tsx
      Landing.tsx
```
