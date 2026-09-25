# MEMORY.MD — Gestor de Finanzas Personales (v1.0 TS + PWA)

> **Ruta:** `C:\Users\Jpasapera\Downloads\proyectos\Gestor-finanzas-personales`
> **Actualizado:** 2026-09-25 — migración completa JS→TS, PWA instalable, UI herramienta single-page, temas claro/oscuro.
> **Tests:** `npm test` = `typecheck` + `lint` + `test:smoke` (15 checks) + `build` → todo verde.

---

## 1. Visión general

PWA **React 18 + TypeScript estricto + Vite 6 + Tailwind 3**, instalable y offline, 100% local-first. Sin backend, sin router, sin login.

**Idea:** el usuario elige modo (`daily` / `biweekly` / `monthly`), registra días con ingresos/gastos (nombre + monto + tipo de pago), ve balance global (modos con salario) y por día, exporta a **TXT o Excel**.

**Estado:** `useFinance` (días, modo, salario, acordeón) + `useTheme` (claro/oscuro). Persistencia `localStorage` claves `gfp:*` (v2, limpias, sin migración legacy por decisión explícita).

### Stack (`package.json` → `gestor-finanzas-personales@1.0.0`)- `react@18`, `react-dom@18`, `lucide-react`, `xlsx` (**en uso**: export Excel real, 2 hojas)
- dev: `vite@6`, `typescript`, `vite-plugin-pwa` (Workbox generateSW), `tailwindcss@3`, `eslint@9`
- Scripts: `dev` / `build` (`tsc --noEmit && vite build`) / `typecheck` / `lint` / `preview` / `test:smoke` (esbuild+node, 15 asserts) / `test` (todo lo anterior en cadena)

---

## 2. Árbol actual (sin legacy)

```
├── index.html                  # SEO es, theme-color light/dark, apple-touch, script anti-flash tema, /src/main.tsx
├── vite.config.ts              # react() + VitePWA (manifest, generateSW, caché Google Fonts)
├── tsconfig.json               # strict, jsx react-jsx, noEmit, bundler
├── eslint.config.js            # flat, solo js/jsx de configs (ts lo cubre tsc)
├── package.json / smoke.test.ts# suite de 15 checks (calculations, dates, normalize)
├── public/icons/               # icon-192.png, icon-512.png, maskable-512.png (generados, "$" verde)
└── src/
    ├── main.tsx                # StrictMode + createRoot + registro SW (/sw.js)
    ├── App.tsx                 # shell herramienta: topbar, toolbar, acordeón días, modales, toasts
    ├── index.css               # tokens :root[data-theme=light|dark] + UI tool (sin hero marketing)
    ├── vite-env.d.ts
    ├── types/finance.ts        # AppMode, PaymentType, MoneyRow, DayEntry{dateISO}, Theme, DayTotals, uid, normalizePaymentType
    ├── utils/dates.ts          # todayISO, isValidISO, isFutureISO, formatLong/Short (comparación lexicográfica, sin parche +1 día)
    ├── utils/calculations.ts   # parseAmount, calculateTotals (única fuente), sumAll, fmtMoney
    ├── utils/storage.ts        # load/save days/mode/salary/theme, sanitize, sort por fecha
    ├── utils/constants.ts      # MODE_CONFIG, PAYMENT_OPTIONS, paymentLabel
    ├── utils/exportUtils.ts    # exportToTextFile + exportToExcel (2 hojas), revokeObjectURL
    ├── hooks/useTheme.ts       # default light, <html data-theme>, persiste gfp:theme
    ├── hooks/usePwaInstall.ts  # beforeinstallprompt/appinstalled/standalone/iOS → visible + install()
    ├── hooks/useFinance.ts     # confirmMode, createDay, addToday, removeDay, toggleExpand, updateItem, addRow, removeRow, clearAll
    └── components/
        ├── ModeSelector.tsx    # wizard modal 2 pasos (diaria directa / salario validado >0)
        ├── BalanceOverview.tsx # solo salary-modes: remaining, % usado, barra ok/warn/danger
        ├── DaySummary.tsx      # 3 cifras + detalle colapsable (usa calculateTotals)
        ├── IncomeExpenseRow.tsx# select tipo + nombre + monto (keys por id)
        └── dialogs.tsx         # Toasts, ConfirmDialog, DateModal (cero alert/confirm nativos)
```

**Eliminado (legacy):** `App.jsx`, `main.jsx`, los 5 `.jsx` + 3 `.js`, `vite.config.js`, `FeatureCard` (marketing), hero `Domina tus finanzas…` + triple `HEADER_FEATURES` (compactados a subtítulo), botón export por día (ahora global), `alert/confirm` nativos, parche timezone `+1 día`, keys por índice, `dist/` del build viejo (regenerado, ignorado en git).

---

## 3. Modelo de datos (v2)

```ts
MoneyRow { id: string; name: string; amount: string; paymentType: '’|'efectivo'|'debito'|'credito'|'transferencia' }
DayEntry { id: string; dateISO: 'YYYY-MM-DD'; incomes: MoneyRow[]; expenses: MoneyRow[] }
```

- `amount` string (input controlado) → `parseAmount` (`parseFloat || 0`, NaN→0).
- `dateISO` local, orden lexicográfico = cronológico. Sin `Date` con hora.
- IDs `crypto.randomUUID()` → keys estables; acordeón `expandedId` (un día abierto).
- `localStorage`: `gfp:days-v2` (JSON ordenado), `gfp:mode`, `gfp:salary`, `gfp:theme`.

---

## 4. Flujos (todos cubiertos, sin huérfanos)

| # | Flujo | Entrada → validación → efecto |
|---|---|---|
| F0 | Onboarding | `appMode null` → modal `ModeSelector` paso 1 → `daily` = fin directo (salario 0) / `biweekly\|monthly` → paso 2 salario `>0` → `confirmMode` guarda + toast |
| F1 | Cambiar modo/salario | Icono ⚙ / `Editar salario` → mismo wizard (`isChanging`, con Cancelar) → conserva `days` |
| F2 | Crear día | Toolbar `Hoy` (abre existente si duplicado, toast info) / `Fecha` → `DateModal` (`max=hoy`) → `createDay`: ISO válida, no futura, no duplicada → auto-expande + toast |
| F3 | Editar filas | `+` agrega fila vacía (`addRow`); inputs controlados (`updateItem`); 🗑 elimina (`removeRow`, admite 0 filas); recálculo instantáneo + `saveDays` |
| F4 | Balance global | Solo `biweekly\|monthly`: `remaining = salario + extras − gastos`; `% = gastos/(salario+extras)`; barra verde <70 / ámbar 70–90 / roja >90 |
| F5 | Balance día | `DaySummary`: 3 cifras + `Ver detalle` colapsable + nota ahorro/déficit |
| F6 | Export | Toolbar `TXT` (mismo formato legacy, `revokeObjectURL` corregido) / `Excel` (hojas `Movimientos` + `Resumen por día`) — siempre dataset completo |
| F7 | Borrar | `Borrar` → `ConfirmDialog` (Esc/Cancelar) → vacía días, conserva modo/salario/tema |
| F8 | Tema | Toggle sol/luna en topbar → `data-theme` + `colorScheme` + `gfp:theme`; **claro por defecto**, script inline anti-flash |
| F9 | Instalación PWA | Botón `Instalar` en topbar (pill esmeralda, entrada + glow pulsante): visible solo si no instalada (`beforeinstallprompt` capturado; en iOS muestra ayuda Compartir→Añadir). Al aceptar/`appinstalled`/standalone → se oculta solo |

Reglas: no futuro, no duplicados, `paymentType` opcional, salario >0 en salary-modes, locale `es-ES`, moneda `$`.

---

## 5. PWA instalable

- `vite-plugin-pwa`: `registerType autoUpdate`, manifest (`Finanzas`, `standalone`, iconos 192/512 + maskable), `dist/sw.js` + Workbox, precache 13 entradas, `CacheFirst` Google Fonts 30 d.
- `main.tsx` registra el SW en `load` (`BASE_URL + sw.js`); sin registro activo Chrome no ofrece instalación.
- `hooks/usePwaInstall.ts`: captura `beforeinstallprompt` (preventDefault + stash), escucha `appinstalled` y cambios de `display-mode`, detecta iOS (`navigator.standalone`) para mostrar instrucciones manuales.
- `index.html`: `mobile-web-app-capable`, `apple-touch-icon` (180px), `theme-color` por esquema.
- Marca: icono billetera esmeralda + moneda ámbar (`icon-192/512`, `maskable-512`, `apple-touch-icon`, `favicon.ico` multi-tamaño); `og-image.png` 1200×630 + `summary_large_image`.
- Verificado: `npm run build` genera `manifest.webmanifest`, `sw.js`, `registerSW.js`, `icons/`.

---

## 6. Temas (paleta profesional y amigable)

- Tokens en `index.css`: `:root[data-theme='light']` (fondo `#edf1f6` azul-gris suave, superficie blanca, texto `#1e293b`) vs `[data-theme='dark']` (fondo `#0a0f1e` slate azulado, superficie `#111a30`).
- Primario esmeralda sobrio: `#047857` (claro, contraste 5.2:1 con blanco) / `#34d399` (oscuro). Ingresos teal `#0f766e`/`#2dd4bf`, gastos rojo sobrio `#b91c1c`/`#ec9a9a`, aviso ámbar, info violeta.
- Todo el UI consume `var()`; Tailwind `brand.*` sincronizado; iconos PWA y `theme-color` del manifest usan el primario.
- Transición 0.25 s, `prefers-reduced-motion` respetado.

---

## 7. Mapa archivo → responsabilidad

| Archivo | Responsabilidad | Funciones clave |
|---|---|---|
| `App.tsx` | Shell, toolbar, acordeón, modales, toasts | `handleConfirmMode, handleDateConfirm` + todo `useFinance` |
| `hooks/useFinance.ts` | Estado + reglas negocio | `confirmMode, createDay, addToday, removeDay, toggleExpand, updateItem, addRow, removeRow, clearAll` |
| `hooks/useTheme.ts` | Tema claro/oscuro persistido | `toggle, setTheme` |
| `hooks/usePwaInstall.ts` | Visibilidad y disparo de instalación | `visible, iosMode, install()` |
| `utils/calculations.ts` | Totales (fuente única) | `calculateTotals, sumAll, parseAmount, fmtMoney` |
| `utils/dates.ts` | Fechas ISO locales | `todayISO, isValidISO, isFutureISO, formatLong/Short` |
| `utils/storage.ts` | Persistencia v2 + sanitize | `load/save Days/Mode/Salary/Theme, clearDays` |
| `utils/exportUtils.ts` | TXT + Excel | `exportToTextFile, exportToExcel` |
| `utils/constants.ts` | Copy modos + pagos | `MODE_CONFIG, PAYMENT_OPTIONS, paymentLabel` |
| `types/finance.ts` | Tipos + normalización | `uid, normalizePaymentType, guards` |
| `smoke.test.ts` | 15 asserts regresión | vía `npm run test:smoke` |

---

## 8. Comandos

```bash
npm install
npm run dev        # desarrollo
npm run typecheck  # tsc --noEmit
npm run lint       # eslint configs js
npm run test:smoke # 15 checks lógica (esbuild + node)
npm test           # typecheck + lint + smoke + build
npm run build      # tsc + vite + PWA (dist/, ignorado en git)
npm run preview
```

## 9. Deploy (Netlify)

- Sitio: `https://gestor-de-finanzas.netlify.app/` (canonical + `og:url`/`twitter:url`).
- Auto-deploy desde GitHub, rama `main`, auto-publish ON.
- `netlify.toml`: `npm run build` → `dist`, `NODE_VERSION=22` (Vite 6 exige ≥20.19; el default 18 rompía el build), `no-cache` en `sw.js`/`manifest.webmanifest`, immutable en `icons/`.

## 10. Pendiente sugerido (no bloqueante)

- Screenshots PWA (`public/screenshots/`) para prompt de instalación enriquecido.
- Tests de `storage.ts` con mock `localStorage` y de `useFinance` con Testing Library (hoy cubiertos por tipos + smoke de utils).
- `typescript-eslint` si se quiere lint con reglas TS (hoy `tsc` es el guardián TS).
