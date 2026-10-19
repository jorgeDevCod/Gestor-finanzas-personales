/**
 * Catálogo único de la app: fuente de verdad de "qué hace cada opción".
 * De aquí salen el recorrido guiado, el índice y las pistas al enfocar.
 * Puro y testeable (sin React ni DOM).
 */

export type GuideView = 'global' | 'resumen' | 'movimientos' | 'ajustes';

export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface FeatureDoc {
  /** Debe coincidir con el atributo data-guide del elemento en el DOM. */
  id: string;
  view: GuideView;
  /** Nombre corto (chip). */
  label: string;
  /** Título del paso del recorrido. */
  title: string;
  /** Explicación concreta: qué es y para qué sirve. */
  text: string;
  placement: Placement;
  /** Si el elemento no existe en el estado actual, el paso se omite. */
  optional?: boolean;
  /** Entra en el recorrido guiado (además de estar en el índice). */
  highlight?: boolean;
}

export const GUIDE_VIEW_LABEL: Record<GuideView, string> = {
  global: 'Siempre visible',
  resumen: 'Resumen',
  movimientos: 'Movimientos',
  ajustes: 'Ajustes',
};

export const GUIDE_VIEW_ORDER: GuideView[] = ['global', 'resumen', 'movimientos', 'ajustes'];

export const FEATURES: FeatureDoc[] = [
  // ── Global ──
  {
    id: 'topbar-install',
    view: 'global',
    label: 'Instalar',
    title: 'Instálala en tu dispositivo',
    text: 'Añade Mis Finanzas a tu pantalla de inicio. Se abre como app y funciona sin conexión.',
    placement: 'bottom',
    optional: true,
    highlight: true,
  },
  {
    id: 'topbar-help',
    view: 'global',
    label: 'Ayuda',
    title: 'Guía de uso',
    text: 'Abre el índice con todas las opciones de la app y el recorrido paso a paso.',
    placement: 'bottom',
    highlight: true,
  },
  {
    id: 'topbar-theme',
    view: 'global',
    label: 'Tema',
    title: 'Claro u oscuro',
    text: 'Cambia el aspecto de la app. Se recuerda tu preferencia la próxima vez.',
    placement: 'bottom',
    optional: true,
  },
  {
    id: 'tabbar',
    view: 'global',
    label: 'Navegación',
    title: 'Tres áreas, una app',
    text: 'Resumen para ver tu dinero, Movimientos para registrar y Ajustes para configurar. Solo una vista abierta a la vez.',
    placement: 'top',
    highlight: true,
  },

  // ── Resumen ──
  {
    id: 'balance-total',
    view: 'resumen',
    label: 'Saldo actual',
    title: 'Tu dinero disponible ahora',
    text: 'Es tu saldo: los ingresos suman y los gastos restan solos, en tiempo real.',
    placement: 'bottom',
    highlight: true,
  },
  {
    id: 'balance-actions',
    view: 'resumen',
    label: 'Modo · Editar · Reiniciar',
    title: 'Modo, edición y reinicio',
    text: 'Modo cambia entre Hoy, Quincena y Mes. Editar ajusta tu saldo o salario. Reiniciar lo vuelve a cero sin borrar tus movimientos.',
    placement: 'bottom',
    highlight: true,
  },
  {
    id: 'balance-grid',
    view: 'resumen',
    label: 'Base · Ingresos · Gastos',
    title: 'De dónde sale tu saldo',
    text: 'Tu monto base (saldo inicial o salario), lo que entró y lo que gastaste en el período.',
    placement: 'bottom',
    optional: true,
  },
  {
    id: 'balance-progress',
    view: 'resumen',
    label: 'Progreso',
    title: '¿Cuánto llevas gastado?',
    text: 'Comparado con tu presupuesto del período, en porcentaje. El color va con el texto: nunca dependas solo del color.',
    placement: 'bottom',
    optional: true,
  },
  {
    id: 'balance-metrics',
    view: 'resumen',
    label: 'Métricas',
    title: 'Anticipa cómo vas a cerrar',
    text: 'Promedio diario, proyección al cierre del período y tu racha de días registrando.',
    placement: 'bottom',
    optional: true,
    highlight: true,
  },
  {
    id: 'balance-breakdown',
    view: 'resumen',
    label: 'En qué se va',
    title: 'En qué se va tu dinero',
    text: 'Tus gastos agrupados por categoría con su porcentaje. Sin categoría, todo lo demás.',
    placement: 'top',
    optional: true,
    highlight: true,
  },
  {
    id: 'fab',
    view: 'resumen',
    label: 'Registrar',
    title: 'Registra en 1 toque',
    text: 'Desde cualquier vista. Escribe el monto y guarda: descripción, método de pago y categoría son opcionales.',
    placement: 'left',
    highlight: true,
  },

  // ── Movimientos ──
  {
    id: 'toolbar-hoy',
    view: 'movimientos',
    label: 'Hoy',
    title: 'Abre el día de hoy',
    text: 'Crea el registro de hoy si no existe, o lo abre para que sigas anotando.',
    placement: 'bottom',
    highlight: true,
  },
  {
    id: 'toolbar-fecha',
    view: 'movimientos',
    label: 'Fecha',
    title: '¿Registro de otro día?',
    text: 'Elige cualquier fecha pasada. Las fechas futuras están bloqueadas.',
    placement: 'bottom',
  },
  {
    id: 'day-card',
    view: 'movimientos',
    label: 'Día',
    title: 'Cada día es una tarjeta',
    text: 'Toca la fecha para desplegar sus movimientos. Solo un día queda abierto a la vez.',
    placement: 'bottom',
    optional: true,
    highlight: true,
  },
  {
    id: 'cta-gasto',
    view: 'movimientos',
    label: 'Registrar gasto',
    title: 'Anota un gasto',
    text: 'Rojo suave. Se descuenta de tu disponible al instante.',
    placement: 'right',
    optional: true,
    highlight: true,
  },
  {
    id: 'cta-entrada',
    view: 'movimientos',
    label: 'Registrar entrada',
    title: 'Anota una entrada',
    text: 'Verde dinero. Suma a tu disponible al instante.',
    placement: 'right',
    optional: true,
  },
  {
    id: 'mov-list',
    view: 'movimientos',
    label: 'Movimientos',
    title: 'Edita o borra cuando quieras',
    text: 'Cada movimiento tiene su categoría y se puede corregir o eliminar con un toque.',
    placement: 'top',
    optional: true,
    highlight: true,
  },
  {
    id: 'day-summary',
    view: 'movimientos',
    label: 'Balance del día',
    title: 'Cómo cerró el día',
    text: 'Ingresos, gastos y balance de ese día. Si el balance es positivo, ahorraste.',
    placement: 'top',
    optional: true,
  },

  // ── Ajustes ──
  {
    id: 'set-modo',
    view: 'ajustes',
    label: 'Modo de gestión',
    title: 'Elige cómo gestionas tu dinero',
    text: 'Hoy, Quincena o Mes. Puedes cambiarlo cuando quieras sin perder tus registros.',
    placement: 'bottom',
    highlight: true,
  },
  {
    id: 'set-apariencia',
    view: 'ajustes',
    label: 'Apariencia',
    title: 'Claro u oscuro',
    text: 'Cambia el tema de la app. Se recuerda tu preferencia.',
    placement: 'bottom',
    optional: true,
  },
  {
    id: 'set-instalar',
    view: 'ajustes',
    label: 'Instalar aplicación',
    title: 'Instálala en tu móvil',
    text: 'Añádela a tu pantalla de inicio para abrirla como app y usarla sin conexión.',
    placement: 'bottom',
    optional: true,
  },
  {
    id: 'set-categorias',
    view: 'ajustes',
    label: 'Categorías',
    title: 'Organiza por categorías',
    text: 'Crea, renombra o elimina tus categorías. Al borrar una, sus movimientos quedan sin categoría: nunca se borran datos.',
    placement: 'bottom',
    optional: true,
    highlight: true,
  },
  {
    id: 'set-guia',
    view: 'ajustes',
    label: 'Cómo usar la app',
    title: 'Vuelve a la guía cuando quieras',
    text: 'Abre el índice completo y el recorrido paso a paso de cada opción.',
    placement: 'bottom',
    optional: true,
  },
  {
    id: 'set-export-txt',
    view: 'ajustes',
    label: 'Exportar TXT',
    title: 'Descarga tus datos',
    text: 'Texto plano, ideal para un respaldo rápido o para abrirlo en cualquier editor.',
    placement: 'bottom',
    optional: true,
  },
  {
    id: 'set-export-xls',
    view: 'ajustes',
    label: 'Exportar Excel',
    title: 'Tus movimientos en una hoja',
    text: 'Un archivo Excel con el detalle de cada movimiento y un resumen por día.',
    placement: 'bottom',
    optional: true,
  },
  {
    id: 'set-borrar',
    view: 'ajustes',
    label: 'Borrar registros',
    title: 'Empezar de cero',
    text: 'Elimina todos los días registrados. Tu modo y tus montos configurados se conservan.',
    placement: 'bottom',
    optional: true,
  },
];

/** Features de una vista (para el índice). */
export const featuresByView = (view: GuideView): FeatureDoc[] => FEATURES.filter((f) => f.view === view);

/** Recorrido guiado: solo las marcadas como highlight. */
export const tourFeatures = (): FeatureDoc[] => FEATURES.filter((f) => f.highlight);

export const featureById = (id: string): FeatureDoc | undefined => FEATURES.find((f) => f.id === id);
