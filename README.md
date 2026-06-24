# Momentum

Plataforma premium de **hábitos + productividad + planificación inteligente**. No es un tracker genérico: es un sistema completo para construir hábitos, cumplir objetivos, organizar tus días y medir tu progreso real — con una estética inspirada en Linear, Notion y Stripe.

![stack](https://img.shields.io/badge/Next.js-16-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![tw](https://img.shields.io/badge/Tailwind-4-38bdf8) ![supabase](https://img.shields.io/badge/Supabase-ready-3ecf8e)

---

## Características

- **Dashboard** — anillo de progreso del día, racha máxima, constancia semanal, tiempo productivo, nivel y frase del día.
- **Hábitos** — tres tipos de medición (sí/no, cantidad, tiempo), frecuencias (diaria, L-V, meta semanal, días específicos), color, objetivos diario y semanal. Registro por día con heatmap y rachas.
- **Rachas** — racha actual y mejor récord histórico, con gráficos por hábito.
- **Estadísticas** — vistas semana / mes / año, evolución del cumplimiento, comparativa con el período anterior y ranking por hábito.
- **Objetivos** — metas medibles con fecha de inicio, fecha límite, progreso y porcentaje completado.
- **Planificador Inteligente** — cargás tus actividades + horarios de despertar/dormir y un algoritmo arma un cronograma equilibrado: bloques de foco, descansos, comidas, ocio y tiempo libre, evitando la sobrecarga. Se puede volcar al calendario.
- **Calendario** — vistas día / semana / mes, crear eventos con un toque, **arrastrar para reprogramar**, y sincronización con el cumplimiento de hábitos.
- **Notas** — diario personal por fecha, con búsqueda y estado de ánimo.
- **Gamificación** — puntos y niveles elegantes (sin nada infantil).
- **Multiusuario** — cada usuario tiene sus hábitos, objetivos, estadísticas, calendario y notas totalmente independientes.
- **Mobile-first** — pensado para celular (Android / iPhone), con navegación inferior y todo responsive.

---

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** · UI propia estilo shadcn · iconos Lucide
- Gráficos SVG propios (sin dependencias pesadas)
- **Supabase** (PostgreSQL + Auth + RLS) — opcional

---

## Dos modos de funcionamiento

| | Modo local (por defecto) | Modo Supabase |
|---|---|---|
| Configuración | Cero | Variables de entorno |
| Datos | `localStorage` del navegador | PostgreSQL en la nube |
| Auth | Cuentas locales en el dispositivo | Auth real (email/contraseña) |
| Multi-dispositivo | No | Sí, sincronizado |

La app **funciona apenas la abrís**, sin backend. Cuando cargás las variables de Supabase, pasa automáticamente a modo nube.

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Podés entrar como **invitado** o crear una cuenta local.

---

## Activar Supabase (opcional)

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, pegá y ejecutá el contenido de [`supabase/schema.sql`](supabase/schema.sql). Esto crea las tablas, índices, políticas RLS y el trigger que genera el perfil al registrarse.
3. **Authentication → Providers** → activá *Email* (y *Anonymous* si querés el botón "invitado").
4. Copiá `.env.example` a `.env.local` y completá:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

5. Reiniciá `npm run dev`. La app ahora usa Supabase con auth real y RLS por usuario.

### Panel de administración (opcional)

Para habilitar un rol admin que pueda ver todas las cuentas y **activar/desactivar** usuarios:

1. En el **SQL Editor** de Supabase ejecutá [`supabase/admin.sql`](supabase/admin.sql) (agrega `is_admin`/`is_active`, las políticas RLS de admin y el helper `is_admin()`).
2. El email definido en ese archivo queda como administrador automáticamente (al registrarse o, si ya existía, en el acto).
3. Al iniciar sesión con esa cuenta aparece la sección **Administración** en el menú.

Las cuentas desactivadas no pueden iniciar sesión hasta que un admin las reactive (sus datos se conservan).

---

## Deploy en Vercel

1. Subí el repo a GitHub.
2. En Vercel: **New Project → Import**.
3. (Opcional) En **Settings → Environment Variables** agregá `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Deploy**. Sin variables → modo local; con variables → modo nube.

---

## Estructura

```
app/
  (app)/            Rutas autenticadas (shell + nav)
    dashboard/  habits/  goals/  planner/  calendar/  stats/  notes/
  login/            Pantalla de acceso
components/
  ui/               Primitivas (button, card, dialog, …)
  charts/           Gráficos SVG (ring, bars, line, heatmap)
  *-provider.tsx    Auth, datos y toasts (React Context)
  *-dialog.tsx      Formularios de hábito / objetivo / evento
lib/
  planner.ts        Algoritmo del Planificador Inteligente
  stats.ts          Rachas, cumplimiento y agregados
  gamification.ts   Puntos y niveles
  store/            Adaptadores de persistencia (local / supabase)
  supabase/         Cliente
supabase/
  schema.sql        Esquema completo (tablas + índices + RLS)
```

---

Hecho para sentirse como un producto SaaS real.
