/**
 * Ficha de presentación: los datos de la campaña en el orden y con los nombres de ECOGAN,
 * ya en formato ECOGAN (coma decimal, sin puntos de miles), para copiarlos en menos de 10 minutos.
 */
import type { Especie } from "./especies";
import { recorrer, valorEfectivo, esObligatorio, tituloItem } from "./cuestionario";
import { formatoEcogan } from "./formato";
import { NOMBRE_PASO, type Campo, type Ctx, type Datos, type Item, type PasoEcogan, type Valor } from "./catalogo/tipos";
import type { ListasOpciones } from "./catalogo/opciones";

export interface FilaFicha {
  etiqueta: string;
  valor: string;
  obligatorio: boolean;
  /** false si la etiqueta u opción no se ha verificado en ECOGAN. */
  verificado: boolean;
}

export interface SeccionFicha {
  /** "Paso 2: Alojamientos › Nave 1 cebo › Suelo" */
  titulo: string;
  migas: string[];
  seccion: string;
  filas: FilaFicha[];
}

export interface PasoFicha {
  paso: PasoEcogan;
  titulo: string;
  secciones: SeccionFicha[];
}

export interface Ficha {
  sinActividad: boolean;
  pasos: PasoFicha[];
}

function textoValor(c: Campo, v: Valor, ctx: Ctx, listas: ListasOpciones, datos: Datos): string {
  if (v === undefined || v === null || v === "") return "";
  switch (c.tipo) {
    case "check":
      return v === true ? "☑ Marcar" : "☐ No marcar";
    case "si_no":
      return v === true ? "SÍ" : v === false ? "NO" : "";
    case "opcion": {
      const id = typeof c.lista === "function" ? c.lista(ctx) : c.lista;
      const op = id ? listas[id]?.opciones.find((o) => o.valor === v) : undefined;
      return op ? op.etiqueta : String(v);
    }
    case "referencia": {
      const items = (datos[c.referencia ?? ""] as Item[] | undefined) ?? [];
      return String(items.find((x) => x._id === v)?.identificador ?? v);
    }
    case "cantidades": {
      const id = typeof c.lista === "function" ? c.lista(ctx) : c.lista;
      const lista = id ? listas[id] : undefined;
      return Object.entries(v as Record<string, number>)
        .filter(([, n]) => n)
        .map(([k, n]) => `${lista?.opciones.find((o) => o.valor === k)?.etiqueta ?? k}: ${formatoEcogan(n, c.decimales ?? 0)}`)
        .join(" · ");
    }
    case "numero":
    case "entero":
    case "anio":
    case "calculado":
      return typeof v === "number" ? formatoEcogan(v, c.tipo === "numero" ? (c.decimales ?? 2) : 0) : String(v);
    default:
      return String(v);
  }
}

export function generarFicha(datos: Datos, especie: Especie, listas: ListasOpciones): Ficha {
  const pasos = new Map<PasoEcogan, PasoFicha>();
  const sinActividad = datos.actividad === false;

  recorrer(datos, especie, {
    campo: ({ campo, ctx, migas }) => {
      if (campo.soloFormulario || campo.tipo === "lotes") return;
      const valor = textoValor(campo, valorEfectivo(campo, ctx), ctx, listas, datos);
      const obligatorio = esObligatorio(campo, ctx);
      // Los checks sin marcar y los vacíos opcionales no aportan nada al operador.
      if (!valor && !obligatorio) return;
      if (campo.tipo === "check" && valor.startsWith("☐")) return;
      const lista = typeof campo.lista === "function" ? campo.lista(ctx) : campo.lista;
      const verificado = campo.verificado !== false && (!lista || listas[lista]?.verificada !== false);

      const p = pasos.get(campo.paso) ?? { paso: campo.paso, titulo: NOMBRE_PASO[campo.paso], secciones: [] };
      pasos.set(campo.paso, p);
      const titulo = [...migas, campo.seccion].join(" › ");
      let s = p.secciones.find((x) => x.titulo === titulo);
      if (!s) {
        s = { titulo, migas, seccion: campo.seccion, filas: [] };
        p.secciones.push(s);
      }
      s.filas.push({ etiqueta: campo.etiqueta + (unidad(campo, ctx) ? ` (${unidad(campo, ctx)})` : ""), valor: valor || "⚠ FALTA", obligatorio, verificado });
    },
  });

  return {
    sinActividad,
    pasos: [...pasos.values()].sort((a, b) => a.paso - b.paso),
  };
}

function unidad(c: Campo, ctx: Ctx): string | undefined {
  const u = typeof c.unidad === "function" ? c.unidad(ctx) : c.unidad;
  // Si la etiqueta oficial ya lleva la unidad, no se repite.
  return u && !c.etiqueta.includes("(") ? u : undefined;
}

/** Exporta la ficha como filas planas (para CSV y para el PDF). */
export function filasPlanas(f: Ficha): { paso: string; seccion: string; etiqueta: string; valor: string }[] {
  return f.pasos.flatMap((p) => p.secciones.flatMap((s) => s.filas.map((r) => ({ paso: p.titulo, seccion: s.titulo, etiqueta: r.etiqueta, valor: r.valor }))));
}

export { tituloItem };
