/**
 * Motor del cuestionario: recorre el catálogo con los datos de una campaña y decide qué
 * campos están visibles, en qué orden se preguntan y dónde se guarda cada respuesta.
 */
import type { Especie } from "./especies";
import { CATALOGO } from "./catalogo/campos";
import { esGrupo, type Campo, type Ctx, type Datos, type Grupo, type Item, type Nodo, type Valor } from "./catalogo/tipos";

/** Ruta a un valor: claves de campo e ids de elementos alternados, p. ej. ["alojamientos", "a1", "plazas"]. */
export type Ruta = string[];

export interface VisitaCampo {
  campo: Campo;
  ruta: Ruta;
  ctx: Ctx;
  /** Títulos de los elementos de grupo que contienen el campo (para mostrar "Nave 1 › Pienso inicio"). */
  migas: string[];
}

export interface VisitaGrupo {
  grupo: Grupo;
  ruta: Ruta;
  ctx: Ctx;
  migas: string[];
  items: Item[];
}

export interface Visitante {
  campo?: (v: VisitaCampo) => void;
  /** Se llama al entrar en un grupo, antes de sus elementos. */
  grupo?: (v: VisitaGrupo) => void;
  /** Se llama al entrar en cada elemento. */
  item?: (v: VisitaGrupo & { item: Item; indice: number }) => void;
}

export function aplicaAEspecie(n: Nodo, especie: Especie): boolean {
  return !n.especies || n.especies.includes(especie);
}

export function esVisible(n: Nodo, ctx: Ctx): boolean {
  return aplicaAEspecie(n, ctx.especie) && (n.visible ? n.visible(ctx) : true);
}

export function esObligatorio(c: Campo, ctx: Ctx): boolean {
  return typeof c.obligatorio === "function" ? c.obligatorio(ctx) : c.obligatorio === true;
}

export function tituloItem(g: Grupo, item: Item, indice: number): string {
  const t = item[g.campoTitulo];
  return t !== undefined && t !== null && t !== "" ? String(t) : `${g.nombre.es} ${indice + 1}`;
}

/** Recorre los nodos visibles en orden del formulario. */
export function recorrer(datos: Datos, especie: Especie, v: Visitante, nodos: Nodo[] = CATALOGO): void {
  const raiz = datos;
  const paso = (lista: Nodo[], item: Datos, padre: Datos | undefined, ruta: Ruta, migas: string[]) => {
    const ctx: Ctx = { especie, raiz, item, padre };
    for (const n of lista) {
      if (!esVisible(n, ctx)) continue;
      if (esGrupo(n)) {
        const items = ((item[n.id] as Item[] | undefined) ?? []).filter((x) => x && typeof x === "object");
        const vg: VisitaGrupo = { grupo: n, ruta: [...ruta, n.id], ctx, migas, items };
        v.grupo?.(vg);
        items.forEach((it, i) => {
          const titulo = tituloItem(n, it, i);
          v.item?.({ ...vg, item: it, indice: i });
          paso(n.campos, it, item, [...ruta, n.id, it._id], [...migas, titulo]);
        });
      } else {
        v.campo?.({ campo: n, ruta: [...ruta, n.id], ctx, migas });
      }
    }
  };
  paso(nodos, datos, undefined, [], []);
}

// ---------- Lectura y escritura por ruta ----------

export function leer(datos: Datos, ruta: Ruta): Valor {
  let actual: Datos | undefined = datos;
  for (let i = 0; i < ruta.length; i++) {
    if (!actual) return undefined;
    const clave = ruta[i];
    if (i === ruta.length - 1) return actual[clave];
    const lista = actual[clave] as Item[] | undefined;
    const id = ruta[++i];
    if (i === ruta.length - 1) return lista?.find((x) => x._id === id) as Valor;
    actual = lista?.find((x) => x._id === id);
  }
  return undefined;
}

/** Devuelve una copia de los datos con el valor cambiado (inmutable, apto para React). */
export function escribir(datos: Datos, ruta: Ruta, valor: Valor): Datos {
  if (ruta.length === 1) return { ...datos, [ruta[0]]: valor };
  const [clave, id, ...resto] = ruta;
  const lista = ((datos[clave] as Item[] | undefined) ?? []).map((it) =>
    it._id === id ? (escribir(it, resto, valor) as Item) : it,
  );
  return { ...datos, [clave]: lista };
}

export function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function anadirItem(datos: Datos, rutaGrupo: Ruta, inicial: Partial<Item> = {}): { datos: Datos; id: string } {
  const id = nuevoId();
  const actual = (leer(datos, rutaGrupo) as Item[] | undefined) ?? [];
  return { datos: escribir(datos, rutaGrupo, [...actual, { ...inicial, _id: id } as Item]), id };
}

export function quitarItem(datos: Datos, rutaGrupo: Ruta, id: string): Datos {
  const actual = (leer(datos, rutaGrupo) as Item[] | undefined) ?? [];
  return escribir(datos, rutaGrupo, actual.filter((x) => x._id !== id));
}

// ---------- Pantallas del formulario ----------

export type Pantalla =
  | { tipo: "campo"; clave: string; campo: Campo; ruta: Ruta; ctx: Ctx; migas: string[] }
  | { tipo: "grupo"; clave: string; grupo: Grupo; ruta: Ruta; ctx: Ctx; migas: string[]; items: Item[] };

/**
 * Lista de pantallas del formulario: una por pregunta visible, más una pantalla de gestión
 * por cada grupo (añadir/quitar alojamientos, piensos…). Se recalcula tras cada respuesta,
 * porque las respuestas cambian qué preguntas aparecen.
 */
export function pantallas(datos: Datos, especie: Especie): Pantalla[] {
  const out: Pantalla[] = [];
  recorrer(datos, especie, {
    grupo: (v) => out.push({ tipo: "grupo", clave: v.ruta.join("/"), ...v }),
    campo: (v) => {
      if (v.campo.tipo === "calculado") return;
      out.push({ tipo: "campo", clave: v.ruta.join("/"), ...v });
    },
  });
  return out;
}

/** Valor efectivo: respuesta del ganadero, o el cálculo si el campo es calculado. */
export function valorEfectivo(c: Campo, ctx: Ctx): Valor {
  if (c.tipo === "calculado" && c.calcular) return c.calcular(ctx);
  return ctx.item[c.id];
}

export function estaRespondido(v: Valor): boolean {
  if (v === undefined || v === null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.values(v).some((x) => x !== undefined && x !== null && x !== 0);
  return true;
}

/** Porcentaje de preguntas obligatorias visibles ya respondidas. */
export function progreso(datos: Datos, especie: Especie): { respondidas: number; total: number } {
  let total = 0;
  let respondidas = 0;
  recorrer(datos, especie, {
    campo: ({ campo, ctx }) => {
      if (campo.tipo === "calculado" || !esObligatorio(campo, ctx)) return;
      total++;
      if (estaRespondido(valorEfectivo(campo, ctx))) respondidas++;
    },
  });
  return { respondidas, total };
}
