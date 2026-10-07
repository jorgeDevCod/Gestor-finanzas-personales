# Flujos de la aplicación PWA — Gestor de Finanzas Personales (v1.1)

Documento funcional completo: qué puede hacer el usuario, paso a paso,
qué funciones intervienen y cómo se recalcula todo en tiempo real.
La app es de **una sola página** (sin rutas): todo ocurre en `App.tsx`
con estado central en `hooks/useFinance.ts` y persistencia en `localStorage`.

---

## 1. Mapa rápido

| Pieza | Archivo | Rol |
|---|---|---|
| Shell / vistas (una sola página, sin rutas) | `src/App.tsx` + `TabBar` | Topbar, Resumen / Movimientos / Ajustes, modales, toasts |
| Estado + reglas | `src/hooks/useFinance.ts` | Días, modo, salario, saldo inicial, categorías, período, CRUD |
| Lógica categorías | `src/utils/categories.ts` | `normalizeKey`, `cleanName`, `add/rename/remove`, `resolveCategory`, `summarizeByCategory`, semilla |
| Navegación por vistas | `src/components/TabBar.tsx` | Resumen / Movimientos / Ajustes, `aria-current`, vista persistida `gfp:view` |
| Vista Ajustes | `src/components/SettingsView.tsx` | Modo, apariencia, instalar, exportar TXT/Excel, categorías, guía, borrar |
| Gestión categorías | `src/components/CategoriesModal.tsx` | Renombrar/eliminar por tipo con confirmación |
| Tema | `src/hooks/useTheme.ts` | Claro/oscuro en `<html data-theme>`, persiste `gfp:theme` |
| Instalación PWA | `src/hooks/usePwaInstall.ts` | Botón Instalar dinámico |
| Onboarding / cambio de modo | `src/components/ModeSelector.tsx` | Bienvenida + Hoy/Quincena/Mes + salario |
| Balance del período / caja | `src/components/BalanceOverview.tsx` | Disponible, progreso, días restantes, por-día |
| Totales del día | `src/components/DaySummary.tsx` | 3 cifras + nota ahorro/déficit |
| Diálogos | `src/components/dialogs.tsx` | `Toasts`, `ConfirmDialog`, `DateModal`, `RegisterModal`, `AmountModal` |
| Períodos | `src/utils/periods.ts` | `getCurrentPeriod`, `getDaysInPeriod` (puro) |
| Cálculos | `src/utils/calculations.ts` | `calculateTotals`, `sumAll`, `periodBalance`, `cashBalance`, `fmtMoney` |
| Movimientos | `src/utils/movements.ts` | `validateMovement`, `buildMovement`, `upsertMovement`, `removeMovement` |
| Regla de modo | `src/utils/modeFlow.ts` | `needsSalaryStep` (solo pedir monto si falta) |
| Persistencia | `src/utils/storage.ts` | Claves `gfp:*`, migración legacy, reseteos |
| Exportación | `src/utils/exportUtils.ts` | `exportToTextFile`, `exportToExcel` |

Modelo de datos:

```text
DayEntry { id, dateISO: "YYYY-MM-DD", incomes: MoneyRow[], expenses: MoneyRow[] }
MoneyRow { id, name, amount: string, paymentType: efectivo|debito|credito|transferencia|"" }
```

---

## 2. Flujos de usuario

### F0 — Primer arranque (onboarding en 1 pantalla)

1. `appMode === null` → `ModeSelector`: cabecera de bienvenida compacta (emblema + "Tus finanzas, bajo control") + pregunta "¿Cada cuánto recibes tu dinero?" + 3 modos. **Hoy = 1 toque** hasta entrar.
2. Hoy → `onConfirm('daily', 0)` directo, sin pedir montos. Quincena/Mes sin monto → paso 2 de 2 con salario (`> 0`); con monto ya registrado entra directo.
3. `confirmMode` guarda `gfp:mode` (+ salario por modo) y muestra toast de bienvenida.
4. Si no hay días, el estado vacío guía a `Hoy` / `Fecha`.
5. Al cambiar de modo (⚙) o editar salario nunca hay bienvenida (`initialOnboardingStep`).

### F1 — Cambio de modo (⚙ Cambiar modo)

1. Topbar → ⚙ abre `ModeSelector` en modo `isChanging` (con botón Cancelar).
2. Al elegir un modo:
   - **Ya tiene monto registrado** → entra **directo**, sin pantallas intermedias (`needsSalaryStep` = false).
   - **Sin monto** (quincena/mes nuevos) → paso 2 vacío para escribirlo solo para ese modo.
   - Daily entra siempre directo y **nunca borra** salarios (`saveSalaryForMode` ignora daily).
3. Días, movimientos, salarios de otros modos y saldo inicial quedan **intactos**.
4. El balance se recalcula con `modo actual + período actual + movimientos del período`.

### F2 — Editar salario / saldo inicial

- **Quincena/Mes:** botón `Editar salario` en `BalanceOverview` → `ModeSelector` abre **directo en el paso de monto** (`startAtSalaryStep`), prellenado con el valor guardado.
- **Daily:** botón `Editar saldo` → `AmountModal` (`Saldo inicial`, admite 0, valida número ≥ 0).
- Al guardar: toast `Saldo inicial actualizado.` y recálculo inmediato.

### F3 — Reiniciar saldo

1. Botón `Reiniciar` (junto a Editar, estilo peligro fantasma) → `ConfirmDialog`:
   - Daily: *"El saldo inicial volverá a $0. Tus movimientos se conservan."*
   - Quincena/Mes: *"El salario de este modo volverá a quedar vacío y se pedirá de nuevo."*
2. `resetBase()` borra solo la clave del modo actual (`resetSalaryForMode` / `resetInitialBalance`).
3. Los movimientos **no se tocan**. El modo reseteado pedirá su monto al entrar.

### F4 — Crear día (Hoy / Fecha)

- Toolbar → **Hoy**: si hoy ya existe, abre ese día y avisa; si no, lo crea y lo expande.
- Toolbar → **Fecha**: `DateModal` (con `max = hoy`) → `createDay` valida:
  - fecha válida, **no futura**, **no duplicada** (avisos por toast, sin `alert`).
- El día nace con listas vacías y queda expandido y ordenado cronológicamente.
- Persistencia automática: cada cambio de `days` se guarda en `gfp:days-v2`.

### F5 — Registrar movimiento (gasto / entrada)

1. Dentro de un día expandido: **Registrar gasto $** (rojo suave) o **Registrar entrada $** (verde dinero).
2. `RegisterModal`: segmentado Gasto/Entrada (solo al crear), descripción (opcional), **monto $ > 0** (obligatorio, Enter guarda), método de pago (opcional), **categoría (opcional)**: select filtrado por tipo ("Sin categoría" por defecto) + botón + (creador en línea: Enter crea y selecciona, Escape cancela) + enlace Gestionar.
3. `saveMovement` valida (`validateMovement`), crea la fila con id único (`buildMovement`, propaga `categoryId`) y la inserta (`upsertMovement`).
4. Toast `Gasto registrado.` / `Entrada registrada.` y **recálculo instantáneo** de: lista del día (con chip de categoría si tiene válida), chip del acordeón, `DaySummary` y `BalanceOverview` (+ barra de período y bloque de categorías si aplica).

### F6 — Editar movimiento

1. Lápiz ✏️ en la fila de la lista → `RegisterModal` en modo edición (tipo fijo, campos prellenados).
2. Guardar actualiza por `id` (`upsertMovement`) → toast `Movimiento actualizado.` + recálculo instantáneo.

### F7 — Eliminaciones

| Qué | Cómo | Qué conserva |
|---|---|---|
| Movimiento | 🗑 en la fila → directo + toast | Resto del día |
| Día | 🗑 en la cabecera del acordeón → directo + toast | Demás días |
| Todo | Toolbar `Borrar` → `ConfirmDialog` → `clearAll` | Modo, salario(s) y saldo inicial |

### F8 — Balances en tiempo real (cómo se calcula cada modo)
Cadena de recálculo (derivada, **nunca persistida**):

```text
days (estado) → period = getCurrentPeriod(modo, hoy)
              → periodDays = getDaysInPeriod(days, period)
              → periodTotals = sumAll(periodDays)
              → balance = periodBalance(base, periodTotals, daysRemaining)
```

- **Daily (caja):** `Saldo actual = gfp:initial + todos los ingresos − todos los gastos`.
  Secundario debajo: movimientos de **hoy** (`todayTotals`).
- **Quincena:** `Disponible = salario quincenal + ingresos de la quincena − gastos de la quincena`.
  Muestra rango (ej. `16–30 de septiembre de 2026`), `Gastado $X de $Y`, `% utilizado` (texto + barra), días restantes y disponible por día (solo si quedan días).
- **Mes:** igual que quincena con el mes completo (1 → último día, febrero y bisiestos incluidos).
- Los movimientos **fuera del período no afectan** el balance (solo la exportación global).
- Jerarquía Daily: `Saldo actual → Ingresos/gastos → Registrar → Movimientos`.
  Jerarquía Quincena/Mes: `Período → Disponible → Ingresos/gastos → Progreso → Días restantes → Movimientos`.

### F8b — Vistas (orden sin saturar)

La app muestra **una vista a la vez** (`TabBar` inferior, `aria-current`, vista recordada en `gfp:view`):

1. **Resumen**: subtítulo del modo + `BalanceOverview` (disponible, progreso, métricas de anticipación, categorías) + CTA **Registrar** si no hay datos (crea/abre hoy y abre el registro directo). Botón `+` flotante global para registrar desde cualquier vista.
2. **Movimientos**: toolbar compacta (Hoy / Fecha) + acordeón de días con registro, listas y `DaySummary` por día.
3. **Ajustes**: modo actual (+ cambiar), apariencia, instalar app (si disponible), exportar TXT/Excel, categorías, guía "Cómo usar", borrar registros y nota de privacidad.
4. Topbar aligerada (marca + Instalar + tema); modales y toasts funcionan desde cualquier vista.

### F8c — Guía de uso

`GuideModal` (3 pasos: toca `+` y anota / elige modo / mira tu disponible): aparece **una sola vez** tras el onboarding (flag `gfp:guide-seen`) y siempre disponible en Ajustes → "Cómo usar la app". Trampa de foco, Esc la cierra, nunca bloquea.

### F9 — Exportar (TXT / Excel)

- Toolbar → **TXT**: texto plano con todos los días, movimientos (con `Categoría: X` o `Sin categoría`) y totales por día (`finanzas_AAAA-MM-DD.txt`).
- Toolbar → **Excel**: libro real con hojas `Movimientos` (columna `Categoría`) y `Resumen por día` (`finanzas_AAAA-MM-DD.xlsx`).
- Botones deshabilitados si no hay días. Descarga + toast de confirmación.

### F13 — Categorías opcionales

1. Al registrar (F5): el select muestra las categorías del tipo (semilla inicial 6 gastos + 2 ingresos, editable); "Sin categoría" es el defecto y no agrega pasos obligatorios.
2. Botón **+** junto al select → input en línea (foco automático): Enter crea y deja seleccionada (nunca guarda el movimiento), Escape cancela y devuelve el foco al select. Nombre duplicado (sin importar mayúsculas/tildes/espacios) → se reutiliza con aviso. Tope 30 por tipo.
3. Enlace **Gestionar** → `CategoriesModal`: renombrar (conflictos rechazados) y eliminar por tipo; eliminar pide confirmación indicando cuántos movimientos quedarán "Sin categoría" (los movimientos nunca se borran).
4. Lista del día: chip con el nombre solo si la categoría es válida (huérfanos no muestran chip).
5. `BalanceOverview`, bloque **En qué se va tu dinero**: gastos del período actual (Quincena/Mes) o del día abierto/hoy (Hoy) resumidos por categoría (`Nombre · NN% · $monto` + barra con texto accesible); "Sin categoría" sin tono de error; línea "Categoriza tus gastos…" si no hay nada categorizado.
6. Persistencia: `gfp:categories` + flag `gfp:categories-ready`; saneo de corruptos/duplicados/tope al cargar; movimientos viejos sin `categoryId` funcionan igual.

### F10 — Tema claro / oscuro

- Topbar → ☀/🌙 alterna `light` (defecto) ↔ `dark`: cambia `<html data-theme>`, persiste `gfp:theme` y se aplica antes del primer pintado (script anti-flash en `index.html`).
- Paleta esmeralda AA en ambos temas; respeta `prefers-reduced-motion`.

### F11 — Instalación PWA

1. `main.tsx` registra el service worker (`/sw.js`) al cargar (requisito de instalabilidad).
2. `usePwaInstall` escucha `beforeinstallprompt` (Chrome/Edge/Android) → aparece el botón **Instalar** (pill esmeralda con glow) en la topbar.
3. Al aceptar / evento `appinstalled` / `display-mode: standalone` → el botón **desaparece solo**.
4. **iOS** (sin `beforeinstallprompt`): el botón muestra la ayuda *"Compartir → Añadir a pantalla de inicio"*.
5. Instalada funciona **offline** (shell + datos locales en caché) y con icono propio (192/512 + maskable).

### F12 — Actualizaciones de la PWA

- `registerType: autoUpdate`: al publicar una versión nueva, el SW se actualiza solo (`sw.js` y `manifest.webmanifest` con `no-cache` vía `netlify.toml`).
- Los datos del usuario (`localStorage`) **sobreviven** a las actualizaciones.

---

## 3. Catálogo de funciones (referencia rápida)

### `hooks/useFinance.ts` — `useFinance(notify)`

| Función | Firma | Efecto |
|---|---|---|
| `confirmMode` | `(mode: AppMode, salary: number) => void` | Guarda modo; salario solo si el modo lo usa y es válido. Daily no borra. |
| `setInitialBalance` | `(value: number) => void` | Guarda `gfp:initial` + toast. |
| `resetBase` | `() => void` | Pone en cero el monto base del modo actual (con confirmación en UI). |
| `createDay` | `(iso: string) => boolean` | Valida y crea el día vacío, lo expande. |
| `addToday` | `() => void` | Atajo de hoy (abre el existente si ya está). |
| `removeDay` | `(id: string) => void` | Elimina el día. |
| `toggleExpand` | `(id: string) => void` | Acordeón (un día abierto a la vez). |
| `saveMovement` | `(dayId, kind, input, rowId?) => boolean` | Crea/edita validado + toast (propaga `categoryId` opcional). |
| `removeRow` | `(dayId, kind, rowId) => void` | Elimina + toast. |
| `clearAll` | `() => void` | Vacía días, conserva modo/montos. |
| `addCategory` | `(kind, rawName) => Category \| null` | Crea o reutiliza + toast (creada / ya existía / tope / vacío). |
| `renameCategory` | `(id, rawName) => boolean` | Renombra + toast (conflictos rechazados). |
| `removeCategory` | `(id) => number` | Elimina sin tocar movimientos; retorna afectados. |
| `countMovementsWithCategory` | `(id) => number` | Conteo para el ConfirmDialog previo. |

Derivados (memoizados): `totals`, `period`, `periodDays`, `periodTotals`, `todayTotals`, `isSalaryMode`.

### `utils/periods.ts` (puro)

`getCurrentPeriod(mode, todayISO) → Period` · `getDaysInPeriod(days, period)` ·
`parseISODate`, `toISODate`, `daysInMonth` · `Period { startISO, endISO, label, range, totalDays, elapsedDays, daysRemaining }`.

### `utils/calculations.ts` (puro)

`parseAmount`, `calculateTotals(day)`, `sumAll(days)`, `periodBalance(base, totals, daysRemaining)`, `cashBalance(initial, totals)`, `fmtMoney`.

### `utils/movements.ts` (puro)

`validateMovement` (monto > 0, categoría no interfiere), `buildMovement` (id + normaliza + propaga `categoryId`), `upsertMovement` (inserta/actualiza), `removeMovement`, `kindToRows`.

### `utils/categories.ts` (puro, nuevo v1.2)

`normalizeKey`, `cleanName`, `seedCategories`, `addCategory` (crea/reutiliza/rechaza), `renameCategory`, `removeCategory` (nunca toca movimientos), `resolveCategory` (huérfano → null), `countByCategory`, `summarizeByCategory` (orden desc, pcts suman 100.0), `dedupeCategories`, `MAX_PER_KIND = 30`.

### `utils/storage.ts`

Lectura/escritura segura (`try/catch`) de `gfp:days-v2`, `gfp:mode`, `gfp:salary-biweekly`, `gfp:salary-monthly`, `gfp:theme`, `gfp:initial`, `gfp:categories`; `gfp:salary` legacy solo como semilla de migración única (`gfp:salaries-ready`); semilla de categorías idempotente (`gfp:categories-ready`); `saveSalaryForMode` (no borra en Daily), `resetSalaryForMode`, `resetInitialBalance`, `clearDays`; sanea filas/días/categorías corruptos (duplicados colapsados, tope 30/tipo).

### `utils/modeFlow.ts` · `utils/dates.ts` · `utils/constants.ts` · `utils/exportUtils.ts`

`needsSalaryStep(mode, saved)` · `todayISO`, `isValidISO`, `isFutureISO`, `formatLong/Short` · `MODE_CONFIG`, `PAYMENT_OPTIONS`, `paymentLabel` · `exportToTextFile`, `exportToExcel`.

---

## 4. Persistencia (claves `localStorage`)

| Clave | Contenido | Se borra con… |
|---|---|---|
| `gfp:days-v2` | Días + movimientos (JSON ordenado) | Borrar todo |
| `gfp:mode` | `daily`/`biweekly`/`monthly` | Nunca (solo cambia) |
| `gfp:salary-biweekly` | Salario quincenal | Reiniciar (en ese modo) |
| `gfp:salary-monthly` | Salario mensual | Reiniciar (en ese modo) |
| `gfp:salary` | Legacy: semilla de migración única | Nunca se escribe ya |
| `gfp:salaries-ready` | Flag de migración | Nunca |
| `gfp:initial` | Saldo inicial Daily | Reiniciar (en Daily) |
| `gfp:categories` | Categorías (JSON saneado) | Solo al gestionar (renombrar/eliminar) |
| `gfp:categories-ready` | Flag de semilla (6+2) | Nunca |
| `gfp:theme` | `light`/`dark` | Nunca |
| `gfp:view` | `resumen`/`movimientos`/`ajustes` | Nunca (solo cambia; inválido → `resumen`) |

> Jamás se persisten: períodos, disponibles, porcentajes ni totales (todo derivado).

---

## 5. Reglas y validaciones

| Regla | Dónde | Comportamiento |
|---|---|---|
| Fecha futura | `createDay` | Bloqueada + toast error |
| Fecha duplicada | `createDay` | Bloqueada + toast error |
| Monto movimiento | `validateMovement` | Obligatorio, número > 0 |
| Salario | `ModeSelector` / `saveSalaryForMode` | Obligatorio > 0 (si el modo lo pide); inválidos se ignoran |
| Saldo inicial | `AmountModal` | Número ≥ 0 (0 permitido) |
| Disponible por día | `periodBalance` | Solo si `daysRemaining > 0`, si no `null` → "Último día del período" |
| Confirmaciones destructivas | `ConfirmDialog` | Borrar todo y Reiniciar (Esc/Cancelar disponible) |

---

## 6. Deploy

Push a `main` → Netlify compila (`netlify.toml`: Node 22, `npm run build` → `dist`) y publica en `https://gestor-de-finanzas.netlify.app/`. Verificado en cada cambio con `npm test` (typecheck + lint + smoke + build).
