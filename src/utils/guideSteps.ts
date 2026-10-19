/** Metadatos puros de la guía de uso (sin UI: testeable en el smoke test). */

export type GuideSection = 'resumen' | 'movimientos' | 'ajustes';

export interface GuideStepMeta {
  id: string;
  section: GuideSection;
  title: string;
  text: string;
}

export const GUIDE_SECTIONS: Record<GuideSection, string> = {
  resumen: 'Resumen',
  movimientos: 'Movimientos',
  ajustes: 'Ajustes',
};

/** 13 pasos: cubren todas las vistas y cada opción principal. */
export const GUIDE_STEPS: GuideStepMeta[] = [
  {
    id: 'resumen-saldo',
    section: 'resumen',
    title: 'Tu saldo, al instante',
    text: 'Este número es tu dinero disponible ahora: los ingresos suman y los gastos restan solos.',
  },
  {
    id: 'resumen-modo',
    section: 'resumen',
    title: 'Elige cómo gestionar tu dinero',
    text: 'Hoy, Quincena o Mes. Cada modo calcula tu disponible a su manera y puedes cambiar cuando quieras.',
  },
  {
    id: 'resumen-metricas',
    section: 'resumen',
    title: 'Anticipa cómo vas a cerrar',
    text: 'Promedio diario, proyección al cierre y tu racha de días: datos para decidir, no solo para mirar.',
  },
  {
    id: 'resumen-registrar',
    section: 'resumen',
    title: 'Registra en 1 toque',
    text: 'El botón + está siempre disponible. Escribe el monto y listo: descripción, pago y categoría son opcionales.',
  },
  {
    id: 'mov-hoy',
    section: 'movimientos',
    title: 'Abre el día de hoy',
    text: 'El botón Hoy crea o abre el registro del día actual para que sigas anotando sin fricción.',
  },
  {
    id: 'mov-fecha',
    section: 'movimientos',
    title: '¿Registro de otro día?',
    text: 'Usa Fecha para elegir cualquier día pasado. No se permiten fechas futuras.',
  },
  {
    id: 'mov-dia',
    section: 'movimientos',
    title: 'Cada día es una tarjeta',
    text: 'Toca el día para abrirlo y ver sus movimientos. Solo un día queda abierto a la vez.',
  },
  {
    id: 'mov-gasto',
    section: 'movimientos',
    title: 'Gastos y entradas',
    text: 'Rojo suave para gastar, verde para ingresar. Edita o borra cualquier movimiento con un toque.',
  },
  {
    id: 'ajustes-apariencia',
    section: 'ajustes',
    title: 'Claro u oscuro',
    text: 'Cambia el tema en un toque. La app recuerda tu preferencia y respeta el movimiento reducido.',
  },
  {
    id: 'ajustes-categorias',
    section: 'ajustes',
    title: 'Organiza por categorías',
    text: 'Crea, renombra o elimina tus categorías. Si borras una, sus movimientos quedan sin categoría.',
  },
  {
    id: 'ajustes-exportar',
    section: 'ajustes',
    title: 'Lleva tus datos contigo',
    text: 'Exporta todo en TXT o Excel, con categorías incluidas. Sin servidor: los datos viven en tu dispositivo.',
  },
  {
    id: 'ajustes-instalar',
    section: 'ajustes',
    title: 'Instálala en tu móvil',
    text: 'Añádela a la pantalla de inicio para abrirla como app y usarla sin conexión.',
  },
  {
    id: 'ajustes-borrar',
    section: 'ajustes',
    title: 'Reiniciar sin perder el modo',
    text: 'Borrar registros o reiniciar el saldo no borra tu modo ni tus montos configurados.',
  },
];
