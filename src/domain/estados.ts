/**
 * Estados de una campaña (granja + año de datos).
 * Decisión del 13-oct-2026: se añaden "autorizacion_pendiente" y el atajo "sin_actividad".
 */
export const ESTADOS = [
  "sin_empezar",
  "autorizacion_pendiente",
  "recogiendo_datos",
  "pendiente_revision",
  "lista_para_ecogan",
  "comunicada",
  "justificante_enviado",
  "sin_actividad",
] as const;
export type EstadoCampana = (typeof ESTADOS)[number];

export const NOMBRE_ESTADO: Record<EstadoCampana, string> = {
  sin_empezar: "Sin empezar",
  autorizacion_pendiente: "Autorización pendiente",
  recogiendo_datos: "Recogiendo datos",
  pendiente_revision: "Pendiente de revisión",
  lista_para_ecogan: "Lista para ECOGAN",
  comunicada: "Comunicada",
  justificante_enviado: "Justificante enviado",
  sin_actividad: "Sin actividad (comunicada)",
};

export type Accion =
  | "pagar" // pago confirmado por Stripe
  | "marcar_autorizado" // el operador verifica en ECOGAN que aparece como autorizado
  | "enviar_datos" // el ganadero termina el formulario
  | "devolver_a_ganadero" // el operador pide correcciones
  | "aprobar_revision" // el operador revisa y aprueba (revisión humana obligatoria)
  | "marcar_comunicada" // el operador ha pulsado COMUNICAR en ECOGAN
  | "enviar_justificante" // justificante subido y enviado al cliente
  | "declarar_sin_actividad"; // el ganadero indica que la granja no tuvo actividad

const TRANSICIONES: Record<Accion, Partial<Record<EstadoCampana, EstadoCampana>>> = {
  pagar: { sin_empezar: "autorizacion_pendiente" },
  marcar_autorizado: { autorizacion_pendiente: "recogiendo_datos" },
  enviar_datos: { recogiendo_datos: "pendiente_revision" },
  devolver_a_ganadero: { pendiente_revision: "recogiendo_datos", lista_para_ecogan: "recogiendo_datos" },
  aprobar_revision: { pendiente_revision: "lista_para_ecogan" },
  marcar_comunicada: { lista_para_ecogan: "comunicada" },
  enviar_justificante: { comunicada: "justificante_enviado", sin_actividad: "sin_actividad" },
  // Sin actividad: solo se comunica cuando ya estamos autorizados; el operador lo comunica y marca.
  declarar_sin_actividad: { recogiendo_datos: "sin_actividad" },
};

export function transicion(estado: EstadoCampana, accion: Accion): EstadoCampana {
  const destino = TRANSICIONES[accion][estado];
  if (!destino) throw new Error(`Acción "${accion}" no permitida en el estado "${estado}"`);
  return destino;
}

export function accionesPosibles(estado: EstadoCampana): Accion[] {
  return (Object.keys(TRANSICIONES) as Accion[]).filter((a) => TRANSICIONES[a][estado] !== undefined);
}

/** Los recordatorios automáticos siguen mientras la campaña esté en uno de estos estados. */
export const ESTADOS_CON_RECORDATORIO: EstadoCampana[] = ["autorizacion_pendiente", "recogiendo_datos"];

/** Estados finales: la campaña ya está presentada. */
export const ESTADOS_PRESENTADOS: EstadoCampana[] = ["comunicada", "justificante_enviado", "sin_actividad"];
