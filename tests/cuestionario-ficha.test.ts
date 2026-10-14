import { describe, expect, it } from "vitest";
import { pantallas, escribir, leer, anadirItem, progreso } from "@/domain/cuestionario";
import { validar, hayErrores } from "@/domain/validaciones";
import { generarFicha } from "@/domain/ficha";
import { resolverListas } from "@/domain/catalogo/opciones";
import type { Datos } from "@/domain/catalogo/tipos";

const listas = resolverListas();

/** Granja de cebo de porcino completa y coherente. */
function granjaCebo(): Datos {
  return {
    actividad: true,
    aai_dispone: false,
    anio_construccion: 2010,
    anio_inicio: 2011,
    almacenamientos_purin: [
      { _id: "b1", identificador: "Balsa", tipo: "balsa", superficie: 800, capacidad: 2400, dias_permanencia: 120, destino_campo_pct: 100, destino_gestor_pct: 0, destino_otros_pct: 0, aplicacion_programa_abonado: true, aplicacion_tecnicas: [{ _id: "t1", tecnica: "bandas_tubos", tiempo_enterrado: "antes_4h", apero: "grada", pct: 100 }] },
    ],
    almacenamientos_estiercol: [],
    alojamientos: [
      {
        _id: "a1",
        identificador: "Nave cebo",
        sistema_productivo: "blanco_intensivo",
        consistencia: "liquida",
        categoria: "cerdos_engorde",
        distribucion: "colectivos",
        tipo_suelo: "parcialmente_enrejillado",
        foso_dispone: true,
        foso_tipo: "foso_profundo",
        dias_permanencia: 60,
        retirada: "vacio",
        plazas: 1469,
        produccion_estiercol: 2500.5,
        peso_inicio: 19,
        peso_fin: 107.3,
        periodo_productivo: 128,
        periodo_no_ocupacion: 17,
        piensos: [
          { _id: "p1", nombre: "Crecimiento", humedad: 12, proteina_bruta: 16.5, kg_plaza: 1.8, dias: 60, kg_antes: 19, kg_despues: 60 },
          { _id: "p2", nombre: "Acabado", humedad: 12, proteina_bruta: 14.5, kg_plaza: 2.6, dias: 68, kg_antes: 60, kg_despues: 107.3 },
        ],
        purin_almacenamiento_pct: 100,
        purin_gestor_pct: 0,
        purin_campo_pct: 0,
        purin_otros_pct: 0,
        distribucion_purin: [{ _id: "d1", almacenamiento: "b1", pct: 100 }],
      },
    ],
  };
}

describe("cuestionario", () => {
  it("si no hubo actividad, solo pregunta eso", () => {
    const ps = pantallas({ actividad: false }, "porcino");
    expect(ps.map((p) => p.clave)).toEqual(["actividad"]);
  });

  it("los campos de purín solo aparecen en porcino con deyección líquida", () => {
    const d = granjaCebo();
    const claves = pantallas(d, "porcino").map((p) => p.clave);
    expect(claves).toContain("alojamientos/a1/foso_tipo");
    expect(claves).toContain("alojamientos/a1/purin_almacenamiento_pct");
    expect(claves).not.toContain("alojamientos/a1/estiercol_almacenamiento_pct");
    expect(claves).not.toContain("alojamientos/a1/cama_materiales");
  });

  it("el paso 6 (consumos) solo se pregunta con AAI", () => {
    const sin = pantallas(granjaCebo(), "porcino").map((p) => p.clave);
    expect(sin).not.toContain("electricidad_kwh");
    const con = pantallas({ ...granjaCebo(), aai_dispone: true }, "porcino").map((p) => p.clave);
    expect(con).toContain("electricidad_kwh");
  });

  it("porcino extensivo: solo categoría, plazas y datos productivos", () => {
    const d: Datos = { actividad: true, alojamientos: [{ _id: "x", sistema_productivo: "iberico_extensivo_tradicional" }] };
    const claves = pantallas(d, "porcino").map((p) => p.clave).filter((c) => c.startsWith("alojamientos/x/"));
    expect(claves).toContain("alojamientos/x/categoria");
    expect(claves).toContain("alojamientos/x/plazas");
    expect(claves).not.toContain("alojamientos/x/tipo_suelo");
    expect(claves).not.toContain("alojamientos/x/consistencia");
  });

  it("aves de puesta con muda piden los pesos antes y después de la muda", () => {
    const d: Datos = { actividad: true, alojamientos: [{ _id: "g", categoria: "gallinas_ponedoras", muda: true }] };
    const claves = pantallas(d, "aves_puesta").map((p) => p.clave);
    expect(claves).toContain("alojamientos/g/peso_inicio_antes_muda");
    expect(claves).not.toContain("alojamientos/g/periodo_productivo");
  });

  it("lee, escribe y añade elementos por ruta sin mutar", () => {
    const d = granjaCebo();
    const d2 = escribir(d, ["alojamientos", "a1", "plazas"], 1500);
    expect(leer(d2, ["alojamientos", "a1", "plazas"])).toBe(1500);
    expect(leer(d, ["alojamientos", "a1", "plazas"])).toBe(1469);
    const { datos: d3, id } = anadirItem(d2, ["alojamientos", "a1", "piensos"], { nombre: "Inicio" });
    expect(leer(d3, ["alojamientos", "a1", "piensos", id, "nombre"])).toBe("Inicio");
  });

  it("progreso cuenta solo obligatorios visibles", () => {
    const p = progreso(granjaCebo(), "porcino");
    expect(p.total).toBeGreaterThan(10);
    expect(p.respondidas).toBe(p.total);
  });
});

describe("validaciones", () => {
  it("una granja completa y coherente no tiene errores", () => {
    const inc = validar(granjaCebo(), "porcino", { capacidadAutorizada: 2000, anioDatos: 2026 });
    expect(inc.filter((i) => i.nivel === "error")).toEqual([]);
  });

  it("detecta obligatorios que faltan", () => {
    const d = escribir(granjaCebo(), ["alojamientos", "a1", "plazas"], undefined);
    expect(hayErrores(validar(d, "porcino"))).toBe(true);
  });

  it("plazas por encima de la capacidad autorizada", () => {
    const inc = validar(granjaCebo(), "porcino", { capacidadAutorizada: 1000 });
    expect(inc.some((i) => i.nivel === "error" && /capacidad autorizada/.test(i.mensaje))).toBe(true);
  });

  it("destinos que no suman 100 %", () => {
    const d = escribir(granjaCebo(), ["alojamientos", "a1", "purin_gestor_pct"], 20);
    expect(validar(d, "porcino").some((i) => /suman 120/.test(i.mensaje))).toBe(true);
  });

  it("cadena de pesos de los piensos (regla de ECOGAN)", () => {
    const d = escribir(granjaCebo(), ["alojamientos", "a1", "piensos", "p2", "kg_antes"], 55);
    expect(validar(d, "porcino").some((i) => /pienso anterior/.test(i.mensaje))).toBe(true);
  });

  it("años posteriores al año de los datos", () => {
    const d = escribir(granjaCebo(), ["anio_inicio"], 2030);
    expect(validar(d, "porcino", { anioDatos: 2026 }).some((i) => i.nivel === "error" && /posterior/.test(i.mensaje))).toBe(true);
  });

  it("avisa de producción de purín muy por encima del máximo teórico", () => {
    const d = escribir(granjaCebo(), ["alojamientos", "a1", "produccion_estiercol"], 99999);
    expect(validar(d, "porcino").some((i) => i.nivel === "aviso" && /máximo teórico/.test(i.mensaje))).toBe(true);
  });
});

describe("ficha de presentación", () => {
  it("ordena por pasos de ECOGAN y usa sus etiquetas y formato", () => {
    const f = generarFicha(granjaCebo(), "porcino", listas);
    expect(f.pasos.map((p) => p.paso)).toEqual([1, 2, 3, 4, 5]);
    const p1 = f.pasos[0].secciones.flatMap((s) => s.filas);
    expect(p1.find((r) => r.etiqueta === "Plazas ocupadas en la granja")?.valor).toBe("1469");
    expect(p1.find((r) => r.etiqueta.startsWith("¿Su granja ha presentado actividad"))?.valor).toBe("SÍ");

    const p2 = f.pasos.find((p) => p.paso === 2)!.secciones.flatMap((s) => s.filas);
    expect(p2.find((r) => r.etiqueta === "¿Cuál es el tipo de suelo?")?.valor).toBe("Parcialmente enrejillado");
    expect(p2.find((r) => r.etiqueta.startsWith("Producción anual de estiércol"))?.valor).toBe("2500,50");

    const p4 = f.pasos.find((p) => p.paso === 4)!;
    const filas4 = p4.secciones.flatMap((s) => s.filas);
    expect(filas4.find((r) => r.etiqueta.startsWith("Peso del animal al final"))?.valor).toBe("107,3");
    expect(filas4.find((r) => r.etiqueta === "Número de piensos")?.valor).toBe("2");
    expect(p4.secciones.some((s) => s.titulo === "Nave cebo › Piensos")).toBe(false);
    expect(p4.secciones.some((s) => s.titulo === "Nave cebo › Acabado › Piensos")).toBe(true);
  });

  it("marca los datos obligatorios que faltan", () => {
    const d = escribir(granjaCebo(), ["alojamientos", "a1", "periodo_productivo"], undefined);
    const filas = generarFicha(d, "porcino", listas).pasos.flatMap((p) => p.secciones.flatMap((s) => s.filas));
    expect(filas.find((r) => r.etiqueta === "Duración del periodo productivo (días)")?.valor).toBe("⚠ FALTA");
  });

  it("granja sin actividad", () => {
    const f = generarFicha({ actividad: false }, "pavos", listas);
    expect(f.sinActividad).toBe(true);
    expect(f.pasos[0].secciones[0].filas[0].valor).toBe("NO");
  });
});
