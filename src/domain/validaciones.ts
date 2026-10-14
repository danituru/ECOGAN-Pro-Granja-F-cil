/**
 * Validaciones de una campaña antes de pasar a revisión.
 * - "error": impide enviar (falta un dato obligatorio de ECOGAN o algo que ECOGAN rechaza).
 * - "aviso": dato raro que el operador debe mirar, pero no bloquea.
 */
import type { Especie } from "./especies";
import { recorrer, esObligatorio, estaRespondido, valorEfectivo, type Ruta } from "./cuestionario";
import type { Datos, Item } from "./catalogo/tipos";
import { generaEstiercol, generaPurin } from "./catalogo/campos";

export interface Incidencia {
  nivel: "error" | "aviso";
  ruta: Ruta;
  donde: string;
  mensaje: string;
}

/** Datos de la granja que no forman parte de ECOGAN pero sirven para validar. */
export interface ContextoGranja {
  /** Capacidad máxima autorizada (plazas), del alta de la granja. */
  capacidadAutorizada?: number;
  /** Año de los datos (el anterior al de presentación). */
  anioDatos?: number;
}

/**
 * Producción máxima teórica de purín por plaza y año (RD 306/2020, Anexo I, m³/plaza/año).
 * Solo se usa como aviso: ECOGAN pide la producción REAL, no la teórica.
 */
const PURIN_MAXIMO_M3_PLAZA: Record<string, number> = {
  lechones_transicion: 0.41,
  cerdos_engorde: 2.3,
  cerdas_reposicion: 2.5,
  verracos_jovenes: 6.12,
  verracos_adultos: 6.12,
  cerdas_primerizas_criando: 6.12,
  cerdas_no_primerizas_criando: 6.12,
};

const TOLERANCIA_SUMA = 0.05;
const suma = (xs: unknown[]) => xs.reduce<number>((a, x) => a + (Number(x) || 0), 0);
const sumaCien = (total: number) => Math.abs(total - 100) <= TOLERANCIA_SUMA;
const donde = (migas: string[], etiqueta?: string) => [...migas, etiqueta].filter(Boolean).join(" › ");

export function validar(datos: Datos, especie: Especie, granja: ContextoGranja = {}): Incidencia[] {
  const out: Incidencia[] = [];
  const err = (ruta: Ruta, d: string, mensaje: string) => out.push({ nivel: "error", ruta, donde: d, mensaje });
  const aviso = (ruta: Ruta, d: string, mensaje: string) => out.push({ nivel: "aviso", ruta, donde: d, mensaje });

  // 1. Obligatorios y rangos razonables de cada campo visible.
  recorrer(datos, especie, {
    campo: ({ campo, ctx, ruta, migas }) => {
      if (campo.soloFormulario || campo.tipo === "calculado") return;
      const v = valorEfectivo(campo, ctx);
      const d = donde(migas, campo.etiqueta);
      if (esObligatorio(campo, ctx) && !estaRespondido(v)) {
        err(ruta, d, "Falta este dato, que ECOGAN pide como obligatorio.");
        return;
      }
      if (typeof v === "number" && campo.rango) {
        if (campo.rango.min !== undefined && v < campo.rango.min) aviso(ruta, d, `El valor ${v} parece demasiado bajo.`);
        if (campo.rango.max !== undefined && v > campo.rango.max) aviso(ruta, d, `El valor ${v} parece demasiado alto.`);
      }
    },
    grupo: ({ grupo, ruta, migas, items }) => {
      if (grupo.minimo && items.length < grupo.minimo && !grupo.fijo) {
        err(ruta, donde(migas, grupo.pregunta.es), `Tiene que haber al menos ${grupo.minimo} ${grupo.nombre.es}.`);
      }
    },
  });

  if (datos.actividad === false) return out;

  // 2. Reglas entre campos.
  const alojamientos = (datos.alojamientos as Item[] | undefined) ?? [];
  const plazasTotales = suma(alojamientos.map((a) => a.plazas));
  if (granja.capacidadAutorizada && plazasTotales > granja.capacidadAutorizada) {
    err(["alojamientos"], "Plazas", `Las plazas ocupadas (${plazasTotales}) superan la capacidad autorizada de la granja (${granja.capacidadAutorizada}).`);
  }

  const anioDatos = granja.anioDatos;
  if (anioDatos) {
    for (const k of ["anio_construccion", "anio_inicio", "anio_reforma"] as const) {
      const v = Number(datos[k]);
      if (v && v > anioDatos) err([k], k, `El año ${v} es posterior al año de los datos (${anioDatos}).`);
    }
  }
  if (Number(datos.anio_inicio) && Number(datos.anio_construccion) && Number(datos.anio_inicio) < Number(datos.anio_construccion)) {
    aviso(["anio_inicio"], "Granja", "La actividad empezó antes de construir la granja: revisa los años.");
  }

  for (const grupoAlm of ["almacenamientos_purin", "almacenamientos_estiercol"] as const) {
    for (const alm of (datos[grupoAlm] as Item[] | undefined) ?? []) {
      const d = String(alm.identificador ?? grupoAlm);
      const total = suma([alm.destino_campo_pct, alm.destino_gestor_pct, alm.destino_otros_pct]);
      if (!sumaCien(total)) err([grupoAlm, alm._id], d, `Los destinos tras el almacenamiento suman ${total} % y deben sumar 100 %.`);
      validarTecnicas(alm, "aplicacion", [grupoAlm, alm._id], d, err);
      if (alm.cubierta === true && Number(alm.superficie_cubierta) > Number(alm.superficie_total)) {
        err([grupoAlm, alm._id, "superficie_cubierta"], d, "La superficie cubierta es mayor que la superficie total.");
      }
    }
  }

  for (const a of alojamientos) {
    const ruta = ["alojamientos", a._id];
    const d = String(a.identificador ?? "Alojamiento");
    const ctx = { especie, raiz: datos, item: a };

    if (a.separacion_sl === true) {
      const t = suma([a.pct_fraccion_liquida, a.pct_fraccion_solida]);
      if (!sumaCien(t)) err([...ruta, "pct_fraccion_liquida"], d, `Las fracciones líquida y sólida suman ${t} % y deben sumar 100 %.`);
    }
    for (const [tipo, visible] of [["purin", generaPurin(ctx)], ["estiercol", generaEstiercol(ctx)]] as const) {
      if (!visible) continue;
      const total = suma([a[`${tipo}_almacenamiento_pct`], a[`${tipo}_gestor_pct`], a[`${tipo}_campo_pct`], a[`${tipo}_otros_pct`]]);
      if (!sumaCien(total)) err([...ruta, `${tipo}_almacenamiento_pct`], d, `Los destinos del ${tipo === "purin" ? "purín" : "estiércol"} suman ${total} % y deben sumar 100 %.`);
      if (Number(a[`${tipo}_almacenamiento_pct`]) > 0) {
        const reparto = (a[`distribucion_${tipo}`] as Item[] | undefined) ?? [];
        const t = suma(reparto.map((r) => r.pct));
        if (!sumaCien(t)) err([...ruta, `distribucion_${tipo}`], d, `El reparto entre almacenamientos suma ${t} % y debe sumar 100 %.`);
      }
      validarTecnicas(a, `aplicacion_${tipo}`, ruta, d, err);
    }

    // Cadena de pesos de los piensos (regla de ECOGAN, manual porcino §11.1.5).
    const piensos = (a.piensos as Item[] | undefined) ?? [];
    if (piensos.length && a.peso_inicio !== undefined && a.peso_fin !== undefined && especie !== "aves_puesta") {
      const primero = piensos[0];
      const ultimo = piensos[piensos.length - 1];
      if (Number(primero.kg_antes) !== Number(a.peso_inicio)) {
        err([...ruta, "piensos", primero._id, "kg_antes"], `${d} › ${primero.nombre ?? "pienso 1"}`, `El peso al empezar el primer pienso (${primero.kg_antes}) debe ser igual al peso al inicio del ciclo (${a.peso_inicio}).`);
      }
      if (Number(ultimo.kg_despues) !== Number(a.peso_fin)) {
        err([...ruta, "piensos", ultimo._id, "kg_despues"], `${d} › ${ultimo.nombre ?? "último pienso"}`, `El peso al acabar el último pienso (${ultimo.kg_despues}) debe ser igual al peso al final del ciclo (${a.peso_fin}).`);
      }
      for (let i = 1; i < piensos.length; i++) {
        if (Number(piensos[i].kg_antes) !== Number(piensos[i - 1].kg_despues)) {
          err([...ruta, "piensos", piensos[i]._id, "kg_antes"], `${d} › ${piensos[i].nombre ?? `pienso ${i + 1}`}`, `Debe empezar con el mismo peso con el que acaba el pienso anterior (${piensos[i - 1].kg_despues}).`);
        }
      }
    }

    if (a.peso_inicio !== undefined && a.peso_fin !== undefined && Number(a.peso_fin) < Number(a.peso_inicio) && !String(a.categoria).startsWith("cerdas")) {
      aviso([...ruta, "peso_fin"], d, "El peso final es menor que el inicial.");
    }

    // Producción de purín muy por encima del máximo teórico.
    if (especie === "porcino" && a.consistencia === "liquida") {
      const max = PURIN_MAXIMO_M3_PLAZA[String(a.categoria)];
      const plazas = Number(a.plazas);
      if (max && plazas && Number(a.produccion_estiercol) > max * plazas * 1.5) {
        aviso([...ruta, "produccion_estiercol"], d, `${a.produccion_estiercol} m³/año es mucho más que el máximo teórico (${(max * plazas).toFixed(0)} m³ para ${plazas} plazas).`);
      }
    }
  }
  return out;
}

function validarTecnicas(item: Item, prefijo: string, ruta: Ruta, d: string, err: (r: Ruta, d: string, m: string) => void) {
  const tecnicas = (item[`${prefijo}_tecnicas`] as Item[] | undefined) ?? [];
  if (!tecnicas.length || item[`${prefijo}_desconoce`] === true) return;
  const t = suma(tecnicas.map((x) => x.pct));
  if (!sumaCien(t)) err([...ruta, `${prefijo}_tecnicas`], d, `Las técnicas de aplicación a campo suman ${t} % y deben sumar 100 %.`);
}

export const hayErrores = (xs: Incidencia[]) => xs.some((x) => x.nivel === "error");
