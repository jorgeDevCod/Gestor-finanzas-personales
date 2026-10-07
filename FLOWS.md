# Flujos de la aplicación PWA — Gestor de Finanzas Personales (v1.1)

Documento funcional completo: qué puede hacer el usuario, paso a paso,
qué funciones intervienen y cómo se recalcula todo en tiempo real.
La app es de **una sola página** (sin rutas): todo ocurre en `App.tsx`
con estado central en `hooks/useFinance.ts` y persistencia en `localStorage`.

---

## 1. Mapa rápido

| Pieza | Archivo | Rol |
|---|---|---|
| Shell / páginas (una sola) | `src/App.tsx` | Topbar, toolbar, acordeón de días, modales, toasts |
| Estado + reglas | `src/hooks/useFinance.ts` | Días, modo, salario, saldo inicial, período, CRUD |
| Tema | `src/hooks/useTheme.ts` | Claro/oscuro en `<html data-theme>`, persiste `gfp:theme` |
| Instalación PWA | `src/hooks/usePwaInstall.ts` | Botón Instalar dinámico |
| Onboarding / cambio de modo | `src/components/ModeSelector.tsx` | Wizard Hoy/Quincena/Mes + salario |
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

### F0 — Primer arranque (onboarding)

1. `appMode === null` → se muestra `ModeSelector` (paso 1) a pantalla completa.
2. El usuario elige **Hoy** → `onConfirm('daily', 0)` → entra directo, sin pedir montos.
3. Elige **Quincena** o **Mes** → paso 2: escribe su salario (`> 0`, Enter confirma) → entra al modo.
4. `confirmMode` guarda `gfp:mode` (+ salario por modo) y muestra toast de bienvenida.
5. Si no hay días, aparece el estado vacío que guía a `Hoy` / `Fecha`.

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
2. `RegisterModal`: segmentado Gasto/Entrada (solo al crear), descripción (opcional), **monto $ > 0** (obligatorio, Enter guarda), método de pago (opcional).
3. `saveMovement` valida (`validateMovement`), crea la fila con id único (`buildMovement`) y la inserta (`upsertMovement`).
4. Toast `Gasto registrado.` / `Entrada registrada.` y **recálculo instantáneo** de: lista del día, chip del acordeón, `DaySummary` y `BalanceOverview` (+ barra de período si aplica).

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

### F9 — Exportar (TXT / Excel)

- Toolbar → **TXT**: texto plano con todos los días, movimientos y totales por día (`finanzas_AAAA-MM-DD.txt`).
- Toolbar → **Excel**: libro real con hojas `Movimientos` y `Resumen por día` (`finanzas_AAAA-MM-DD.xlsx`).
- Botones deshabilitados si no hay días. Descarga + toast de confirmación.

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
| `saveMovement` | `(dayId, kind, input, rowId?) => boolean` | Crea/edita validado + toast. |
| `removeRow` | `(dayId, kind, rowId) => void` | Elimina + toast. |
| `clearAll` | `() => void` | Vacía días, conserva modo/montos. |

Derivados (memoizados): `totals`, `period`, `periodDays`, `periodTotals`, `todayTotals`, `isSalaryMode`.

### `utils/periods.ts` (puro)

`getCurrentPeriod(mode, todayISO) → Period` · `getDaysInPeriod(days, period)` ·
`parseISODate`, `toISODate`, `daysInMonth` · `Period { startISO, endISO, label, range, totalDays, elapsedDays, daysRemaining }`.

### `utils/calculations.ts` (puro)

`parseAmount`, `calculateTotals(day)`, `sumAll(days)`, `periodBalance(base, totals, daysRemaining)`, `cashBalance(initial, totals)`, `fmtMoney`.

### `utils/movements.ts` (puro)

`validateMovement` (monto > 0), `buildMovement` (id + normaliza), `upsertMovement` (inserta/actualiza), `removeMovement`, `kindToRows`.

### `utils/storage.ts`

Lectura/escritura segura (`try/catch`) de `gfp:days-v2`, `gfp:mode`, `gfp:salary-biweekly`, `gfp:salary-monthly`, `gfp:theme`, `gfp:initial`; `gfp:salary` legacy solo como semilla de migración única (`gfp:salaries-ready`); `saveSalaryForMode` (no borra en Daily), `resetSalaryForMode`, `resetInitialBalance`, `clearDays`; sanea filas/días corruptos.

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
| `gfp:theme` | `light`/`dark` | Nunca |

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
