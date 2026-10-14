import type { Datos } from "./catalogo/tipos";
import type { Especie } from "./especies";

/** Datos de ejemplo para la demostración comercial (granja ficticia). */
export const EJEMPLOS: Partial<Record<Especie, Datos>> = {
  porcino: {
    actividad: true,
    aai_dispone: false,
    anio_construccion: 2010,
    anio_inicio: 2011,
    almacenamientos_purin: [
      {
        _id: "b1",
        identificador: "Balsa grande",
        tipo: "balsa",
        superficie: 800,
        capacidad: 2400,
        dias_permanencia: 120,
        impermeable: true,
        capacidad_suficiente: true,
        destino_campo_pct: 100,
        destino_gestor_pct: 0,
        destino_otros_pct: 0,
        aplicacion_programa_abonado: true,
        aplicacion_tecnicas: [{ _id: "t1", tecnica: "bandas_tubos", tiempo_enterrado: "antes_4h", apero: "grada", pct: 100 }],
      },
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
        lotes: [
          { _id: "l1", animalesEntran: 1500, animalesSalen: 1440, pesoEntrada: 20, pesoSalida: 110, diasOcupacion: 120, diasVacio: 20 },
          { _id: "l2", animalesEntran: 1800, animalesSalen: 1710, pesoEntrada: 18, pesoSalida: 105, diasOcupacion: 130, diasVacio: 12 },
          { _id: "l3", animalesEntran: 1200, animalesSalen: 1164, pesoEntrada: 19, pesoSalida: 107, diasOcupacion: 135, diasVacio: 19 },
        ],
        plazas: 1469,
        produccion_estiercol: 2500,
        peso_inicio: 19,
        peso_fin: 107.3,
        periodo_productivo: 128,
        periodo_no_ocupacion: 17,
        porcentaje_muertes: 4,
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
  },
};
