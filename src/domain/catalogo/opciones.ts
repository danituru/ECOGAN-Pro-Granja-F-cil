/**
 * Listas de opciones de los desplegables de ECOGAN.
 *
 * Son los valores por defecto. En producción se guardan en la tabla `opciones_listas`
 * y el operador las edita desde /admin/configuracion, para cerrar las listas marcadas como
 * no verificadas sin tocar código (decisión del 13-oct-2026).
 *
 * `verificada: true`  → etiqueta copiada de una captura de pantalla del manual oficial (feb-2026).
 * `verificada: false` → lista incompleta o deducida del Anexo I del RD 988/2022.
 *                        TODO: verificar normativa / cerrar en ECOGAN con la granja piloto.
 */
export interface Opcion {
  /** Valor estable que se guarda en los datos. No cambiarlo nunca una vez en producción. */
  valor: string;
  /** Texto exacto de ECOGAN (es lo que aparece en la ficha de presentación). */
  etiqueta: string;
  /** Texto en lenguaje llano para el ganadero, si difiere de la etiqueta oficial. */
  ayuda?: string;
}

export interface ListaOpciones {
  id: string;
  descripcion: string;
  verificada: boolean;
  fuente: string;
  opciones: Opcion[];
}

const o = (valor: string, etiqueta: string, ayuda?: string): Opcion => ({ valor, etiqueta, ayuda });

export const LISTAS_POR_DEFECTO: ListaOpciones[] = [
  // ---------- Porcino · Paso 2 ----------
  {
    id: "porcino_sistema_productivo",
    descripcion: "¿Cuál es el sistema productivo en el alojamiento?",
    verificada: true,
    fuente: "Manual porcino feb-2026 §9.1",
    opciones: [
      o("blanco_intensivo", "Porcino blanco intensivo"),
      o("blanco_extensivo", "Porcino blanco extensivo"),
      o("iberico_intensivo", "Porcino ibérico intensivo"),
      o("iberico_extensivo_cebo", "Porcino ibérico extensivo de cebo"),
      o("iberico_extensivo_tradicional", "Porcino ibérico extensivo tradicional"),
    ],
  },
  {
    id: "consistencia_deyeccion",
    descripcion: "¿Tipo de consistencia de la deyección gestionada en el alojamiento?",
    verificada: true,
    fuente: "Manual porcino feb-2026 §9.1.2",
    opciones: [
      o("liquida", "Líquida", "Purín: se puede bombear"),
      o("solida", "Sólida", "Estiércol con cama: no se puede bombear"),
    ],
  },
  {
    id: "porcino_categoria",
    descripcion: "¿Cuál es la categoría del animal?",
    verificada: true,
    fuente: "Manual porcino feb-2026 §9.2 + captura",
    opciones: [
      o("lechones_transicion", "Lechones en transición", "Lechones destetados hasta unos 20 kg"),
      o("cerdos_engorde", "Cerdos de engorde", "Cebo (también recría de futuras cerdas y wean to finish)"),
      o("verracos_jovenes", "Verracos jóvenes (<1año)"),
      o("verracos_adultos", "Verracos adultos (>1año)"),
      o("cerdas_reposicion", "Cerdas de reposición"),
      o("cerdas_1a_gestacion", "Cerdas en 1ª gestación"),
      o("cerdas_no_primerizas_gestacion", "Cerdas no primerizas en gestación"),
      o("cerdas_primerizas_criando", "Cerdas primerizas criando"),
      o("cerdas_no_primerizas_criando", "Cerdas no primerizas criando"),
      o("cerdas_primerizas_reposo", "Cerdas primerizas reposo"),
      o("cerdas_no_primerizas_reposo", "Cerdas no primerizas reposo"),
    ],
  },
  {
    id: "porcino_distribucion",
    descripcion: "¿Cómo están distribuidos estos animales?",
    verificada: true,
    fuente: "Captura manual porcino p.47",
    opciones: [o("individuales", "Casetas o jaulas individuales"), o("colectivos", "Corrales colectivos")],
  },
  {
    id: "porcino_suelo",
    descripcion: "¿Cuál es el tipo de suelo?",
    verificada: true,
    fuente: "Captura manual porcino p.51",
    opciones: [
      o("totalmente_enrejillado", "Totalmente enrejillado"),
      o("parcialmente_enrejillado", "Parcialmente enrejillado"),
      o("hormigon_cama_caliente", "Suelo de hormigón con cama caliente"),
      o("convexo_canales_separados", "Suelo convexo y canales de agua y purín separados con suelo parcialmente enrejillado"),
      o("canales_agua_purin_totalmente", "Combinación de canales de agua y de purín con suelo totalmente enrejillado"),
      o("otro", "Otro"),
    ],
  },
  {
    id: "porcino_material_cama",
    descripcion: "¿Qué material usa para la cama? (kg/plaza/día)",
    verificada: true,
    fuente: "Captura manual porcino p.50",
    opciones: [
      o("paja_picada", "Paja picada"),
      o("paja_larga", "Paja larga"),
      o("viruta", "Viruta de madera"),
      o("serrin", "Serrín"),
      o("papel", "Papel"),
      o("otros", "Otros"),
    ],
  },
  {
    id: "porcino_tipo_foso",
    descripcion: "¿Cuál es el tipo de foso?",
    verificada: true,
    fuente: "Captura manual porcino p.53",
    opciones: [
      o("foso_v", "Foso en V"),
      o("foso_profundo", "Foso profundo", "Guarda el purín más de una semana"),
      o("foso_reducido", "Foso reducido (anchura aproximada 60 cm)"),
      o("colector_estiercol", "Colector de estiércol", "Solo para cerdas criando"),
      o("otro", "Otro"),
    ],
  },
  {
    id: "porcino_tratamiento_foso",
    descripcion: "Tratamiento en el foso: ¿De qué tipo?",
    verificada: false,
    fuente: "Texto manual porcino §9.4 (desplegable no visible)",
    opciones: [o("acidificacion", "Acidificación"), o("bolas_flotantes", "Bolas flotantes"), o("enfriamiento", "Enfriamiento"), o("otro", "Otro")],
  },
  {
    id: "porcino_retirada_deyecciones",
    descripcion: "¿Cómo realiza la retirada de las deyecciones?",
    verificada: true,
    fuente: "Captura manual porcino p.54",
    opciones: [
      o("arrobadera", "Arrobadera"),
      o("cintas_v", "Cintas de estiércol en forma de V"),
      o("flushing", "Flushing"),
      o("vacio", "Vacío"),
      o("otro", "Otro"),
    ],
  },
  {
    id: "porcino_frecuencia_vaciado_foso",
    descripcion: "Frecuencia de vaciado del foso",
    verificada: false,
    fuente: "Anexo I RD 988/2022 B.1.f.ii y tabla del paso 2 (campo exacto no visible)",
    opciones: [
      o("2_o_mas_semana", "2 o más veces por semana"),
      o("menos_2_semana", "Menos de 2 veces por semana"),
      o("menos_1_mes", "Menos de 1 vez al mes"),
    ],
  },
  {
    id: "porcino_gestion_solida_alojamiento",
    descripcion: "¿Cómo almacenan/gestionan los estiércoles (deyecciones sólidas) en el alojamiento?",
    verificada: false,
    fuente: "Texto manual porcino §9.4",
    opciones: [
      o("cama_apilado", "Cama/Apilado en alojamiento"),
      o("cama_apilado_espesante", "Cama/Apilado en alojamiento (con adición de agente espesante)"),
      o("cama_apilado_aditivos", "Cama/Apilado en alojamiento (aditivos)"),
    ],
  },
  // ---------- Depuradores y polvo (todas las especies) ----------
  {
    id: "tipo_depurador_aire",
    descripcion: "Depuradores de aire: ¿De qué tipo?",
    verificada: false,
    fuente: "Anexo I RD 988/2022 B.1.g (porcino) y B.1.i (aves)",
    opciones: [
      o("humedo_acido", "Depurador húmedo con ácido"),
      o("dos_tres_fases", "Depurador de 2-3 fases"),
      o("biolavador", "Biolavador"),
      o("biofiltro", "Biofiltro"),
      o("filtro_seco", "Filtro seco"),
      o("colector_agua", "Colector de agua"),
      o("depurador_agua", "Depurador de agua"),
      o("otro", "Otro"),
    ],
  },
  {
    id: "tipo_control_polvo",
    descripcion: "Control de emisiones de polvo: ¿De qué tipo?",
    verificada: false,
    fuente: "Anexo I RD 988/2022 B.1.h / B.1.k",
    opciones: [
      o("nebulizadores", "Nebulizadores de agua"),
      o("ionizacion", "Ionización"),
      o("pulverizacion_aceite", "Pulverización de aceite"),
      o("otro", "Otro"),
    ],
  },
  {
    id: "aves_tipo_secado_yacija",
    descripcion: "Sistemas de secado de yacija: ¿De qué tipo?",
    verificada: false,
    fuente: "Anexo I RD 988/2022 B.1.j",
    opciones: [
      o("ventilacion_forzada", "Ventilación forzada"),
      o("ventiladores_intercambiadores", "Ventiladores e intercambiadores de calor"),
      o("recirculacion_calefaccion", "Ventiladores con sistema para la recirculación homogénea de aire y calefacción"),
      o("otro", "Otros"),
    ],
  },
  // ---------- Aves de carne ----------
  {
    id: "aves_carne_tipo_animal",
    descripcion: "¿Cuál es el tipo de animal?",
    verificada: false,
    fuente: "Captura p.38 (solo 'Pollos de carne' visible); resto del Anexo II RD 988/2022",
    opciones: [
      o("pollos_carne", "Pollos de carne"),
      o("pollitas_recria_carne", "Pollitas de recría carne"),
      o("gallinas_reproductoras_carne", "Gallinas reproductoras carne"),
    ],
  },
  {
    id: "aves_carne_distribucion",
    descripcion: "¿Cómo están distribuidos estos animales?",
    verificada: true,
    fuente: "Captura manual aves carne p.38",
    opciones: [
      o("suelo_con_salida", "Cría en suelo con salida exterior"),
      o("suelo_sin_salida", "Cría en suelo sin salida exterior"),
      o("jaulas_convencionales", "Jaulas convencionales o no acondicionadas"),
      o("jaulas_enriquecidas", "Jaulas enriquecidas o acondicionadas"),
    ],
  },
  // ---------- Aves de puesta ----------
  {
    id: "aves_puesta_tipo_animal",
    descripcion: "¿Cuál es el tipo de animal?",
    verificada: true,
    fuente: "Manual aves puesta feb-2026 §9.2",
    opciones: [
      o("pollitas_ponedoras", "Pollitas de ponedoras"),
      o("pollitas_reproductores_ponedoras", "Pollitas de reproductores de ponedoras"),
      o("reproductoras_puesta", "Reproductoras/es para puesta"),
      o("gallinas_ponedoras", "Gallinas ponedoras"),
    ],
  },
  {
    id: "aves_puesta_estirpe",
    descripcion: "Estirpe",
    verificada: false,
    fuente: "Captura p.39 (solo 'Blancas' visible); Anexo II RD 988/2022 (blancas/rubias)",
    opciones: [o("blancas", "Blancas"), o("rubias", "Rubias")],
  },
  {
    id: "aves_puesta_tipo_produccion",
    descripcion: "Tipo de Producción según la categoría",
    verificada: true,
    fuente: "Captura manual aves puesta p.38",
    opciones: [
      o("suelo_sin_salida", "Cría en suelo (parque/aviario) sin salida exterior"),
      o("camperas", "Camperas (cría en suelo con salida al exterior)"),
      o("ecologicas", "Ecológicas (cría en suelo con salida al exterior)"),
      o("jaulas_convencionales", "Jaulas convencionales o no acondicionadas"),
      o("jaulas_enriquecidas", "Jaulas enriquecidas o acondicionadas"),
    ],
  },
  {
    id: "aves_tipo_aviario",
    descripcion: "¿Cuál es el tipo de aviario?",
    verificada: false,
    fuente: "Captura p.40 (solo 'Al mismo nivel' visible); Anexo I: suelo continuo / multiplataforma",
    opciones: [o("mismo_nivel", "Al mismo nivel"), o("varios_niveles", "Varios niveles (multiplataforma)")],
  },
  {
    id: "aves_suelo",
    descripcion: "¿Cuál es el tipo de suelo? (aves de carne y puesta)",
    verificada: false,
    fuente: "Captura manual aves puesta p.40; la lista varía según animal y distribución",
    opciones: [
      o("suelo_continuo", "Suelo continuo"),
      o("totalmente_enrejillado", "Suelo totalmente enrejillado"),
      o("parcialmente_enrejillado", "Suelo parcialmente enrejillado"),
      o("combideck", "Sistema Combideck (suelos con yacija, calentados o refrigerados)"),
    ],
  },
  {
    id: "aves_material_yacija",
    descripcion: "¿Qué material usa para la cama? (kg/plaza/ciclo)",
    verificada: true,
    fuente: "Captura manual aves carne p.40",
    opciones: [
      o("viruta", "Viruta de madera"),
      o("serrin", "Serrín"),
      o("cascarilla", "Cascarilla de cereales (arroz) o de frutos secos"),
      o("paja_cereal", "Paja de cereal"),
      o("zuro_maiz", "Zuro de maíz"),
      o("papel_picado", "Papel picado"),
      o("otros", "Otros"),
    ],
  },
  // ---------- Pavos ----------
  {
    id: "pavos_categoria",
    descripcion: "¿Cuál es la categoría del animal?",
    verificada: true,
    fuente: "Captura manual pavos p.34",
    opciones: [
      o("macho_cebo", "Pavos macho cebo"),
      o("hembra_cebo", "Pavos hembra cebo"),
      o("reproductores_carne", "Reproductores/as de carne"),
      o("pavitos", "Pavitos/as", "Primeras semanas de vida, antes de pasar a engorde"),
    ],
  },
  {
    id: "pavos_suelo",
    descripcion: "¿Cuál es el tipo de suelo?",
    verificada: true,
    fuente: "Captura manual pavos p.35",
    opciones: [
      o("suelo_continuo", "Suelo continuo"),
      o("totalmente_enrejillado", "Totalmente enrejillado"),
      o("parcialmente_enrejillado", "Parcialmente enrejillado"),
      o("suelo_perforado", "Suelo perforado"),
      o("combideck", "Sistema Combideck (suelos con yacija, calentados y refrigerados)"),
    ],
  },
  {
    id: "pavos_material_cama",
    descripcion: "¿Qué material usa para la cama? (kg/plaza/ciclo)",
    verificada: true,
    fuente: "Captura manual pavos p.35",
    opciones: [
      o("paja_picada", "Paja picada"),
      o("paja_larga", "Paja larga"),
      o("viruta", "Viruta de madera"),
      o("serrin", "Serrín"),
      o("cascarilla_arroz", "Cascarilla de arroz"),
      o("estiercol_seco", "Estiércol seco/compostado"),
      o("otros_no_nitrogenados", "Otros materiales no nitrogenados (arena, carbonato…)"),
    ],
  },
  {
    id: "pavos_retirada_deyecciones",
    descripcion: "¿Cómo realiza la retirada de las deyecciones?",
    verificada: false,
    fuente: "Captura manual pavos p.36 (ayuda visible, desplegable no)",
    opciones: [o("pala", "Retirada con pala o pala frontal"), o("cinta", "Cinta de estiércol"), o("otro", "Otro")],
  },
  {
    id: "pavos_ventilacion",
    descripcion: "Sistema de ventilación (pavos)",
    verificada: false,
    fuente: "Manual pavos §9.5: 'seis opciones + Otros' no visibles. Lista del Anexo I B.1.i (aves)",
    opciones: [
      o("natural", "Ventilación natural"),
      o("forzada", "Ventilación forzada"),
      o("centralizado", "Sistema de ventilación centralizado"),
      o("tunel", "Sistema de ventilación por túnel"),
      o("otros", "Otros"),
    ],
  },
  // ---------- Paso 3 · Almacenamiento exterior ----------
  {
    id: "almacenamiento_purin_tipo",
    descripcion: "¿Dónde almacena/gestiona los purines/fracción líquida?",
    verificada: true,
    fuente: "Captura manual porcino p.68",
    opciones: [
      o("balsa", "Balsa de purines"),
      o("deposito", "Depósito de purines (balsa con paredes de construcción)"),
      o("tanque", "Tanque de purines (depósito hermético)"),
      o("bolsa", "Bolsa de purines (tanque flexible)"),
      o("laguna_anaerobica", "Laguna anaeróbico (descubierta)"),
      o("tratamiento_aerobico", "Sistema de tratamiento aeróbico"),
      o("digestor_baja_fuga", "Digestor anaeróbico de alta calidad y baja fuga"),
      o("digestor_muchas_fugas", "Digestor anaeróbico con muchas fugas"),
      o("otros", "Otros"),
    ],
  },
  {
    id: "forma_deposito",
    descripcion: "¿Cuál es la forma del sistema de almacenamiento?",
    verificada: false,
    fuente: "Anexo I RD 988/2022 B.2.b.ii",
    opciones: [o("rectangular", "Rectangular"), o("circular", "Circular")],
  },
  {
    id: "tipo_cubierta_purin",
    descripcion: "Tipo de cubierta del almacenamiento de purín",
    verificada: false,
    fuente: "Anexo I RD 988/2022 B.2.b.vi",
    opciones: [
      o("costra_natural", "Costra natural"),
      o("flotantes_no_sinteticos", "Materiales flotantes no sintéticos"),
      o("rigida", "Cubierta rígida"),
      o("flexible", "Cubierta flexible"),
      o("piezas_sinteticas", "Piezas sintéticas flotantes"),
      o("lamina_plastico", "Lámina de plástico flexible"),
      o("neumatica", "Cubierta neumática"),
      o("otros", "Otros"),
    ],
  },
  {
    id: "tratamiento_purin",
    descripcion: "Tratamiento de purines: ¿Cuál es el método?",
    verificada: false,
    fuente: "Anexo I RD 988/2022 B.2.b.xii",
    opciones: [
      o("acidificacion", "Acidificación"),
      o("refrigeracion_superficie", "Refrigeración en superficie del purín"),
      o("digestion_anaerobia", "Digestión anaerobia"),
      o("digestion_aerobia", "Digestión aerobia"),
      o("nitrificacion", "Nitrificación-desnitrificación"),
      o("otros", "Otros"),
    ],
  },
  {
    id: "almacenamiento_estiercol_tipo",
    descripcion: "¿Dónde almacena/gestiona los estiércoles/fracción sólida?",
    verificada: true,
    fuente: "Captura manual porcino p.74 (aves pueden diferir: TODO verificar)",
    opciones: [
      o("apilado_estercolero", "Apilado / Estercolero"),
      o("nave_estiercol", "Nave de estiércol"),
      o("apilado_cubierta_compactado", "Apilado/Estercolero (con cubierta y compactado)"),
      o("apilado_espesante", "Apilado/Estercolero (con adición de agente espesante)"),
      o("apilado_aditivos", "Apilado/Estercolero (aditivos)"),
      o("compost_tambor", "Compostaje en tambor (In Vessel)"),
      o("compost_static_pile", "Compostaje en pilas estáticas con aireación forzada (Static Pile)"),
      o("compost_intensive_windrow", "Compostaje intensivo en pilas con volteo (Intensive Windrow)"),
      o("compost_passive_windrow", "Compostaje pasivo en pilas estáticas con aireación pasiva (Passive Windrow)"),
      o("digestor_anaerobico", "Digestor anaeróbico", "Aparece en aves de carne"),
      o("otro", "Otro"),
    ],
  },
  {
    id: "tratamiento_estiercol",
    descripcion: "Tratamiento posterior del estiércol: ¿Cuál es el método?",
    verificada: false,
    fuente: "Anexo I RD 988/2022 B.3.c / B.2.c (aves)",
    opciones: [
      o("compostaje", "Compostaje"),
      o("digestion_anaerobia", "Digestión anaerobia"),
      o("digestion_aerobia", "Digestión aerobia"),
      o("aditivos", "Utilización de aditivos"),
      o("nitrificacion", "Nitrificación/desnitrificación"),
      o("tunel_secado", "Desecación del estiércol mediante túnel de secado exterior"),
      o("otros", "Otros"),
    ],
  },
  // ---------- Paso 6 · Consumos ----------
  {
    id: "combustibles",
    descripcion: "Combustible (código NAPFUE, tipo y unidad)",
    verificada: true,
    fuente: "Capturas manual porcino p.115-116",
    opciones: [
      o("fija_204_gasoleo_c", "Instalación fija · 204 · Gasóleo C para instalaciones (no automoción) (litros)"),
      o("fija_204_gasoleo_b", "Instalación fija · 204 · Gasóleo B para instalaciones (no automoción) (litros)"),
      o("fija_301_gas_natural", "Instalación fija · 301 · Gas natural (kWhPCS)"),
      o("fija_203_fueloleo", "Instalación fija · 203 · Fuelóleo (litros)"),
      o("fija_303_lpg", "Instalación fija · 303 · LPG para instalaciones fijas (litros)"),
      o("fija_303_propano", "Instalación fija · 303 · Gas propano (kg)"),
      o("fija_314_butano", "Instalación fija · 314 · Gas butano (kg)"),
      o("fija_311_manufacturado", "Instalación fija · 311 · Gas manufacturado (kg)"),
      o("fija_309_biogas", "Instalación fija · 309 · Biogás (kg)"),
      o("fija_111_madera", "Instalación fija · 111 · Biomasa madera (kg)"),
      o("fija_111_pellets", "Instalación fija · 111 · Biomasa pellets (kg)"),
      o("fija_111_astillas", "Instalación fija · 111 · Biomasa astillas (kg)"),
      o("fija_111_serrines", "Instalación fija · 111 · Biomasa serrines virutas (kg)"),
      o("fija_116_cascara", "Instalación fija · 116 · Biomasa cáscara f. secos (kg)"),
      o("fija_116_hueso", "Instalación fija · 116 · Biomasa hueso aceituna (kg)"),
      o("fija_112_carbon_vegetal", "Instalación fija · 112 · Carbón vegetal (kg)"),
      o("fija_101_coque", "Instalación fija · 101 · Coque de carbón (kg)"),
      o("transp_208_e5_turismos", "Transporte en las instalaciones · 208 · Gasolina E5 para turismos (litros)"),
      o("transp_208_e5_furgonetas", "Transporte en las instalaciones · 208 · Gasolina E5 para furgonetas y furgones (litros)"),
      o("transp_208_e5_camiones", "Transporte en las instalaciones · 208 · Gasolina E5 para camiones y autobuses (litros)"),
      o("transp_208_e5_motos", "Transporte en las instalaciones · 208 · Gasolina E5 para ciclomotores y motocicletas (litros)"),
      o("transp_205_b7_turismos", "Transporte en las instalaciones · 205 · Gasóleo B7 para turismos (litros)"),
      o("transp_205_b7_furgonetas", "Transporte en las instalaciones · 205 · Gasóleo B7 para furgonetas y furgones (litros)"),
      o("transp_205_b7_camiones", "Transporte en las instalaciones · 205 · Gasóleo B7 para camiones y autobuses (litros)"),
      o("transp_303_lpg_turismos", "Transporte en las instalaciones · 303 · LPG para turismos (litros)"),
      o("transp_301_cng_turismos", "Transporte en las instalaciones · 301 · CNG para turismos (litros)"),
      o("transp_301_cng_camiones", "Transporte en las instalaciones · 301 · CNG para camiones y autobuses (litros)"),
      o("maq_205_gasoleo_b", "Funcionamiento maquinaria · 205 · Gasóleo B para maquinaria agrícola (litros)"),
      o("maq_205_gasoleo_b7", "Funcionamiento maquinaria · 205 · Gasóleo B7 para maquinaria agrícola (litros)"),
      o("maq_208_e5_forestal", "Funcionamiento maquinaria · 208 · Gasolina E5 para maquinaria forestal (litros)"),
    ],
  },
  {
    id: "fuentes_agua",
    descripcion: "Suministro hidráulico (m3/año)",
    verificada: true,
    fuente: "Captura manual porcino p.117",
    opciones: [o("pozo", "Pozo"), o("cauce", "Cauce"), o("red_publica", "Red pública"), o("cisterna", "Cisterna"), o("otros", "Otros")],
  },
  // ---------- Paso 5 · Uso agrícola ----------
  {
    id: "tecnica_aplicacion_purin",
    descripcion: "Técnica empleada en la aplicación a campo del purín",
    verificada: false,
    fuente: "Texto manual porcino §12.1 (lista completa no visible)",
    opciones: [
      o("bandas_tubos", "Bandas-Tubos colgantes"),
      o("bandas_zapatas", "Bandas-zapatas colgantes"),
      o("plato_difusor", "Plato difusor"),
      o("dilucion_riego", "Dilución purines y riego a baja presión"),
      o("acidificacion_riego", "Acidificación purines y riego"),
    ],
  },
  {
    id: "tiempo_enterrado",
    descripcion: "Tiempo de enterrado",
    verificada: false,
    fuente: "Capturas manual porcino p.105-111 (lista completa no visible)",
    opciones: [
      o("antes_4h", "Antes de 4 horas"),
      o("antes_12h", "Antes de 12 horas"),
      o("antes_24h", "Antes de 24 horas"),
    ],
  },
  {
    id: "apero_enterrado",
    descripcion: "Apero usado en el enterrado",
    verificada: false,
    fuente: "Capturas manual porcino p.105-111 (solo Vertedera y Grada visibles)",
    opciones: [o("vertedera", "Vertedera"), o("grada", "Grada")],
  },
];

export function listaPorDefecto(id: string): ListaOpciones {
  const l = LISTAS_POR_DEFECTO.find((x) => x.id === id);
  if (!l) throw new Error(`Lista de opciones desconocida: ${id}`);
  return l;
}

export type ListasOpciones = Record<string, ListaOpciones>;

/** Mezcla los valores por defecto con las listas editadas en la base de datos (si las hay). */
export function resolverListas(editadas: ListaOpciones[] = []): ListasOpciones {
  const out: ListasOpciones = {};
  for (const l of LISTAS_POR_DEFECTO) out[l.id] = l;
  for (const l of editadas) out[l.id] = l;
  return out;
}
