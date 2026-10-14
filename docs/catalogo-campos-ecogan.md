# Catálogo de campos ECOGAN (campaña 2026)

Fuente principal: manuales oficiales del MAPA (porcino v. feb-2026, aves de carne feb-2026, aves de puesta feb-2026, pavos v1 ene-2026), sus capturas de pantalla, y el Anexo I del RD 988/2022.
Los textos entre comillas son las etiquetas tal como aparecen en la aplicación. `(*)` = obligatorio en ECOGAN.

> Regla de oro: las categorías y opciones de ECOGAN son **cerradas**. El agente adapta la realidad de la granja a ellas, nunca al revés.
>
> Formato de entrada en ECOGAN: coma decimal, sin separador de miles, sin unidades en los campos numéricos.

Leyenda de verificación:
- ✅ visto en captura de pantalla del manual (etiqueta exacta)
- 📄 descrito en el texto del manual o en el RD (etiqueta probablemente exacta)
- ❓ opciones del desplegable no visibles en los manuales → **verificar en ECOGAN/simulador antes de cerrar el modelo**

---

## Qué es obligatorio

| Granja | Pasos obligatorios |
|---|---|
| Sin AAI (la mayoría) | Pasos 1 a 5, campos con `(*)`. Paso 6 voluntario. |
| Con AAI (IPPC) | Pasos 1 a 6 completos. |

Los datos de SGA, planes de ruido/olores/emergencia/formación/mantenimiento/cadáveres y AAI son voluntarios para granjas sin AAI (marcados con (*) en el Anexo I del RD 988/2022). Si la granja los tiene, conviene declararlos.

---

## PASO 1 — Datos granja

### 1.1 Actividad (porcino; previsto en el RD modificado para todas)
| Campo | Tipo | Opciones |
|---|---|---|
| "¿Su granja ha presentado actividad en el año objeto de declaración?" (*) ✅ | select | "SÍ, mi granja ha presentado actividad, aunque sea un solo día dentro del año objeto de declaración" / "NO, mi granja no ha presentado actividad ningún día dentro del año objeto de declaración" |

Si NO → se comunica como "Sin actividad" con declaración responsable, sin rellenar nada más.

### 1.2 Granja ✅
| Campo | Tipo | Notas |
|---|---|---|
| "¿En qué año se ha construido?" (*) | año | Visto en porcino |
| "¿En qué año se inició la actividad?" (*) | año | |
| "Provincia" (*) / "Municipio" (*) | select | Se rellena solo desde REGA en "Mis granjas" |
| "¿En qué año se ha hecho la última reforma a nivel medio ambiental?" | año | En blanco = sin reforma |
| ¿Granja IPPC? 📄 | check | Aves (carne/puesta) |

### 1.3 Plazas
| Campo | Tipo | Notas |
|---|---|---|
| "Plazas ocupadas en la granja" (*) | entero | **Media de plazas ocupadas en el año**, NO capacidad, NO censo a 31-dic, NO animales producidos. Debe ser igual a la suma de plazas de los alojamientos del paso 2. |

### 1.4 Sistema de Gestión Ambiental (SGA) ✅ (voluntario sin AAI)
Checks: "Dispone de un Sistema de Gestión Ambiental (SGA)" → "Por la ubicación o por el tipo de la granja, debe disponer de un Plan de Gestión del Ruido" · "El SGA contempla un Plan de Gestión del Ruido" · "Por la ubicación o por el tipo de la granja, debe disponer de un Plan de Gestión de Olores" · "El SGA contempla un Plan de Gestión de Olores" → "Supervisa periódicamente las emisiones de olores al aire" · "Dispone de un Plan de emergencia para hacer frente a emisiones e incidentes imprevistos".
Adjuntos opcionales: PDF de ≤ 5 MB.

### 1.5 Distancias, reducción ruido, plan de mantenimiento y gestión de cadáveres ✅
Checks: "La ubicación de la granja cumple con las distancias establecidas por la legislación" · "Utiliza alguna técnica (ver botón i) para evitar o reducir las emisiones de ruido" · "El personal de la granja está adecuadamente formado" · "Comprueba periódicamente (al menos una vez al año), repara y lleva un mantenimiento de los equipos y estructuras" · "Se almacenan los animales muertos de forma que se eviten o reduzcan las emisiones".
(El Anexo I añade para porcino la integridad estructural y estanqueidad de los depósitos de purín.)

### 1.6 Autorización Ambiental Integrada ✅
"Dispone de Autorización Ambiental Integrada" (*) [NO/SÍ] + año de la última revisión + documento PDF opcional.

---

## PASO 2 — Alojamientos (uno por cada combinación categoría + instalación + manejo)

"Alojamiento" ≠ "nave". Tres naves idénticas con la misma categoría y manejo = 1 alojamiento. Una nave con dos categorías = 2 alojamientos. En pavos, machos y hembras siempre van en alojamientos separados.

### 2.1 Alojamiento
| Campo | Especie | Opciones |
|---|---|---|
| "Identificador" (*) ✅ | todas | texto libre |
| "¿Cuál es el sistema productivo en el alojamiento?" (*) ✅ | porcino | Porcino blanco intensivo · Porcino blanco extensivo · Porcino ibérico intensivo · Porcino ibérico extensivo de cebo · Porcino ibérico extensivo tradicional |
| "Se trata de una nave nueva" ✅ | todas | check (autorizada después del 15-feb-2017) |
| "¿Tipo de consistencia de la deyección gestionada en el alojamiento?" (*) ✅ | porcino | Líquida · Sólida |

Porcino extensivo: solo pide categoría y plazas. En el paso 4 solo se pide el 4.1.

### 2.2 Animales
**Porcino** ✅
- "¿Cuál es la categoría del animal?" (*): Lechones en transición · Cerdos de engorde · Verracos jóvenes (<1año) · Verracos adultos (>1año) · Cerdas de reposición · Cerdas en 1ª gestación · Cerdas no primerizas en gestación · Cerdas primerizas criando · Cerdas no primerizas criando · Cerdas primerizas reposo · Cerdas no primerizas reposo
  - Recría de reproductoras → "Cerdos de engorde" (18-20 → 100-130 kg)
  - Wean to finish → todo como "Cerdos de engorde", 6 → 110 kg
- "¿Cómo están distribuidos estos animales?" (*): Casetas o jaulas individuales · Corrales colectivos
- "Dispone de un patio con salida exterior" → "horas diarias medias en el patio exterior" (*)
- "Mantiene los animales y las superficies secos y limpios"
- Pastoreo (columna de la tabla; aparece en sistemas que lo permiten)

**Aves de carne** ✅
- "¿Cuál es el tipo de animal?" (*): Pollos de carne · (Pollitas de recría carne · Gallinas reproductoras carne ❓ etiquetas exactas)
- "¿Cómo están distribuidos estos animales?" (*): Cría en suelo con salida exterior · Cría en suelo sin salida exterior · Jaulas convencionales o no acondicionadas · Jaulas enriquecidas o acondicionadas (para pollos solo se habilitan las dos de suelo)
- Con salida exterior: "Porcentaje tiempo en patio exterior" (*) + "En producción ecológica"
- "Mantiene los animales y las superficies secos y limpios"

**Aves de puesta** ✅
- "¿Cuál es el tipo de animal?" (*): Pollitas de ponedoras · Pollitas de reproductores de ponedoras · Reproductoras/es para puesta · Gallinas ponedoras
- Solo gallinas ponedoras: "En gallinas ponedoras, ¿se trata de producción con muda en el año de declaración?"
- "Estirpe" (*): Blancas · Rubias (❓ confirmar la lista completa)
- "Tipo de Producción según la categoría" (*): Cría en suelo (parque/aviario) sin salida exterior · Camperas (cría en suelo con salida al exterior) · Ecológicas (cría en suelo con salida al exterior) · Jaulas convencionales o no acondicionadas · Jaulas enriquecidas o acondicionadas
- Camperas/Ecológicas: "Porcentaje tiempo en patio exterior" (*)
- "Mantiene los animales y las superficies secos y limpios"

**Pavos** ✅
- "¿Cuál es la categoría del animal?" (*): Pavos macho cebo · Pavos hembra cebo · Reproductores/as de carne · Pavitos/as
- "Dispone de un patio con salida exterior" (horas diarias) · "Mantiene los animales y las superficies… secos y limpios" · "Los animales de este alojamiento salen a pastoreo" (horas/día)

### 2.3 Suelo
**Porcino** ✅ — "¿Cuál es el tipo de suelo?" (*): Totalmente enrejillado · Parcialmente enrejillado · Suelo de hormigón con cama caliente (solo con deyección sólida) · Suelo convexo y canales de agua y purín separados con suelo parcialmente enrejillado · Combinación de canales de agua y de purín con suelo totalmente enrejillado · Otro (→ ¿cuál?)
- Deyección sólida: "No uso ningún material de cama" · "Se utiliza la técnica de cama profunda" · material de cama con **kg/plaza/día** (*): Paja picada · Paja larga · Viruta de madera · Serrín · Papel · Otros · "La cama se administra de forma manual" · "Mantiene la cama seca y aireada"

**Aves carne / puesta** ✅
- "Dispone de sistema de aviarios" → "¿Cuál es el tipo de aviario?" (*) (p. ej. "Al mismo nivel" ❓ lista completa)
- "¿Cuál es el tipo de suelo?" (*): Suelo continuo · Suelo totalmente enrejillado · Suelo parcialmente enrejillado · Sistema Combideck (suelos con yacija, calentados o refrigerados) (la lista varía según el tipo de animal y la distribución ❓)
- "Dispone de un sistema de bebederos sin pérdidas de agua"
- "Se utiliza yacija" → material con **kg/plaza/ciclo** (*): Viruta de madera · Serrín · Cascarilla de cereales (arroz) o de frutos secos · Paja de cereal · Zuro de maíz · Papel picado · Otros
- "La cama se administra de forma manual" · "Mantiene la yacija seca y aireada"

**Pavos** ✅ — tipo de suelo (*): Suelo continuo · Totalmente enrejillado · Parcialmente enrejillado · Suelo perforado · Sistema Combideck (suelos con yacija, calentados y refrigerados)
- "Dispone de un sistema de bebederos sin pérdidas de agua" · "No uso ningún material de cama" · cama en kg/plaza/ciclo: Paja picada · Paja larga · Viruta de madera · Serrín · Cascarilla de arroz · Estiércol seco/compostado · Otros materiales no nitrogenados (arena, carbonato…) · forma manual · seca y aireada

### 2.4 Sistema de almacenamiento en el alojamiento / Foso
**Porcino, deyección líquida** ✅
- "¿Dispone de foso bajo el suelo?" → "¿Cuál es el tipo de foso?" (*): Foso en V · Foso profundo · Foso reducido (anchura aproximada 60 cm) · Colector de estiércol (solo cerdas criando) · Otro
- "Realiza algún tratamiento en el foso" → "¿De qué tipo?" (*): Acidificación · Bolas flotantes · Enfriamiento · Otro 📄
- "Tiempo de permanencia del purín/estiércol en el alojamiento (en días)" (*)
- "¿Cómo realiza la retirada de las deyecciones?" (*): Arrobadera · Cintas de estiércol en forma de V · Flushing · Vacío · Otro (→ ¿Cuál?)
- Frecuencia de vaciado del foso (columna de la tabla): "2 o más veces por semana" · "Menos de 2 veces por semana" · (menos de 1 vez al mes 📄) ❓ campo exacto

**Porcino, deyección sólida** 📄/✅
- "¿Cómo almacenan/gestionan los estiércoles (deyecciones sólidas) en el alojamiento?" (*): Cama/Apilado en alojamiento · Cama/Apilado en alojamiento (con adición de agente espesante) · Cama/Apilado en alojamiento (aditivos)
- Tiempo de permanencia (días) (*) · retirada de las deyecciones (*)

**Aves** — "Foso": solo si hay foso bajo el suelo (tipo, frecuencia, cinta, tratamiento) ❓
**Pavos** ✅ — "Tiempo de permanencia de las deyecciones en el alojamiento (en días)" (*) (si se retiran a diario, poner 1) · "¿Cómo realiza la retirada de las deyecciones?" (*): Retirada con pala o pala frontal · Cinta de estiércol · Otro

### 2.5 Depuradores de aire y control de emisiones ✅
- "Dispone de sistemas depuradores de aire" → "¿De qué tipo?" (*) ❓ (Anexo I: depurador húmedo con ácido, de 2-3 fases, biolavador, biofiltro, filtro seco [aves], colector de agua, depurador de agua, otro)
- "Dispone de sistemas de control de emisiones de polvo" → "¿De qué tipo?" (*) ❓ (Anexo I: nebulizadores de agua, ionización, pulverización de aceite [aves], otro)
- "Supervisa las emisiones de polvo al menos una vez al año"
- "En alojamientos con sistemas de depuración de aire, supervisa las emisiones de amoniaco, polvo y/u olores."
- Aves: "Dispone de sistemas de secado de yacija" → tipo ❓
- Puesta: "Dispone de sistemas de ventilación forzada en el foso"
- Pavos: sistema de ventilación (seis opciones + Otros) ❓

### 2.6 Plazas ✅
- "Número de plazas ocupadas del alojamiento" (*) = media de los lotes, donde cada lote = (animales que entran + animales que salen) / 2.
- Producción anual de estiércol: m³/año si es líquido y t/año si es sólido (*). Total del alojamiento, **dato real**, no tabla teórica.
- Pavos "Pavitos/as": % de machos en el alojamiento.

---

## PASO 3 — Sistemas de almacenamiento exterior

### 3.1 Purín / fracción líquida (porcino; aves solo si separan sólido-líquido) ✅
- "Dispone de instalación para el almacenamiento exterior del purín" + "N° sistemas de almacenamiento exterior"
- Por sistema:
  - "¿Identificador del sistema de almacenamiento exterior del purín?" (*)
  - "¿Dónde almacena/gestiona los purines/fracción líquida?" (*): Balsa de purines · Depósito de purines (balsa con paredes de construcción) · Tanque de purines (depósito hermético) · Bolsa de purines (tanque flexible) · Laguna anaeróbico (descubierta) · Sistema de tratamiento aeróbico · Digestor anaeróbico de alta calidad y baja fuga · Digestor anaeróbico con muchas fugas · Otros
  - "¿Cuál es la superficie del almacenamiento? (m²)" (*) · "¿Cuál es la capacidad del mismo? (m³)" (*)
  - Depósito/tanque: "¿Cuál es la altura o profundidad del sistema de almacenamiento?(m)" (*) · "¿Cuál es la forma del sistema de almacenamiento?" (*) (rectangular/circular 📄) · "Espera a que el depósito se llene por completo antes del vaciado"
  - "Tiempo de permanencia del purín en el sistema de almacenamiento (en días)" (*)
  - "Utiliza algún tipo de cubierta" → tipo ❓ (Anexo I: costra natural, materiales flotantes no sintéticos, cubierta rígida, cubierta flexible, piezas sintéticas flotantes, lámina de plástico flexible, cubierta neumática, otros)
  - "Reduce al mínimo la agitación del purín durante el almacenamiento" · "¿El gas producido se aprovecha como fuente de energía en la propia granja o para el exterior?" · "Se ubica en un lugar protegido de los vientos dominantes…" · "Dispone de capacidad suficiente para los periodos de no aplicación a campo" · "Dispone de base y paredes impermeables"
  - "Se realiza tratamiento de purines" → "¿Cuál es el método?" (*) ❓ (Anexo I: acidificación, refrigeración en superficie, digestión anaerobia con/sin quemador/biogás, digestión aerobia, nitrificación-desnitrificación, otros)
  - Destino tras almacenamiento (los porcentajes suman 100, con 1 decimal): "Directamente a campo o a terreno agrícola" · "Entrega a gestor externo" · "Otros usos no agrarios"

### 3.2 Estiércol sólido / fracción sólida ✅
- "Dispone de instalación para el almacenamiento exterior del estiércol" + N° sistemas
- Por sistema:
  - Identificador (*)
  - "¿Dónde almacena/gestiona los estiércoles/fracción sólida?" (*) — porcino: Apilado / Estercolero · Nave de estiércol · Apilado/Estercolero (con cubierta y compactado) · Apilado/Estercolero (con adición de agente espesante) · Apilado/Estercolero (aditivos) · Compostaje en tambor (In Vessel) · Compostaje en pilas estáticas con aireación forzada (Static Pile) · Compostaje intensivo en pilas con volteo (Intensive Windrow) · Compostaje pasivo en pilas estáticas con aireación pasiva (Passive Windrow) · Otro. Aves carne 📄: estercolero/apilado · nave de estiércol · digestor anaeróbico · otros ❓
  - "¿Cuál es la superficie total? (m²)" (*) · "¿Cuál es la altura o profundidad…?(m)" (*) · "¿Cuál es la capacidad del mismo? (m³)" (*) · "Tiempo de permanencia del estiércol en el sistema de almacenamiento (en días)" (*)
  - Checks: "Está lejos de cursos de agua" · "Tiene la base impermeabilizada" · "Recoge los lixiviados" · "Aprovecha el estiércol mediante su quemado como combustible" · "Se ubica en un lugar protegido de los vientos dominantes…" · "Compacta el estiércol en el almacenamiento" · "Utiliza algún tipo de cubierta" → "¿Cuál es la superficie cubierta? (m²)" (*) + "¿La instalación está lo suficientemente ventilada?" · "El sistema de almacenamiento exterior tiene la suficiente capacidad…" · "Reduce la relación entre la superficie y el volumen del estiércol" · "El estiércol es secado o presecado en el alojamiento…" · "El estercolero/apilado cuenta con paredes de hormigón que permiten aumentar la altura del montón de estiércol"
  - "Se realiza tratamiento posterior del estiércol" → "¿Cuál es el método?" (*) ❓
  - Destino tras almacenamiento (%): campo · gestor externo · otros usos no agrarios

---

## PASO 4 — Gestión de los alojamientos (para cada alojamiento)

### 4.1 Datos productivos ✅
"Los datos aportados en todos los apartados (salvo en valores de n° piensos, Proteína bruta y humedad) son VALORES MEDIOS ESTIMATIVOS."
- **Peso**: "Peso del animal al inicio del ciclo productivo (kg)" (*) · "Peso del animal al final del ciclo productivo (kg)" (*). Porcino en kg; **puesta en gramos**. Media de los lotes, con 1 decimal.
  - Ponedoras con muda: peso al inicio y al final del ciclo antes de la muda, y peso al inicio y al final del ciclo tras la muda (g)
- **Duración**: "Duración del periodo productivo (días)" (*) · "Periodo de no ocupación (días)". **Por ciclo, no por año** (media aritmética de los lotes).
  - Ponedoras sin muda: duración de todo el ciclo de puesta · días de puesta solo en el año de declaración · días de no ocupación solo en el año de declaración
  - Ponedoras con muda: duración del ciclo antes de la muda · días de puesta antes de la muda en el año · días de muda en el año · duración del ciclo tras la muda · días de puesta tras la muda en el año
- **Más información**: "% muertes"
  - Cerdas gestantes: peso de los lechones al nacimiento (kg) · lechones nacidos por cerda y camada · % abortos
  - Cerdas criando: peso de los lechones al nacimiento (kg) · peso al destete (kg) · lechones lactantes por cerda y camada
  - Reproductoras de carne / ponedoras: "Masa media de los huevos por animal" (g/día)
- **Gestión nutricional** ✅: "Número de piensos" (*) · "Uso de aditivos autorizados para piensos que reduzcan el fósforo total excretado (FITASAS)" · "Utiliza algún sistema para reducir la generación de polvo"
- **Piensos** (uno por pienso) ✅: "Nombre del período de alimentación" (*) · "% Humedad" (*) (12 % por defecto) · "% PB" (*) (proteína bruta sobre materia fresca, de la etiqueta) · **porcino** "kg pienso/plaza/día" (*) / **aves** "kg pienso/plaza/ciclo" (*) · "¿Cuántos días lo suministra?" (*) · "kg animal antes de administrar el pienso" (*) · "kg animal después de administrar el pienso" (*). Hasta 3 decimales.
  - Reglas de ECOGAN: el "kg antes" del primer pienso es igual al peso de inicio; el "kg después" del último pienso es igual al peso final; el "kg antes" de cada pienso es igual al "kg después" del pienso anterior.
  - Aves: kg/plaza/ciclo = consumo anual del pienso ÷ plazas medias ÷ ciclos/año, donde ciclos/año = 365 ÷ (periodo productivo + no ocupación).

### 4.2 Destino purines (líquida, o sólida con separación S-L) ✅
- "Realiza un tratamiento de separación sólido-líquido" → "% fracción líquida tras la S-L" (*) · "% fracción sólida tras S-L" (*)
- Destinos con "¿En qué porcentaje?" (*), suma 100: "Almacenamiento en granja" · "Entrega a gestor externo sin almacenamiento en granja" · "Directamente a campo o a terreno agrícola sin almacenamiento en granja" (→ "Se realiza de forma diaria") · "Otros usos no agrarios sin almacenamiento en granja"
- "Distribución de los purines en los sistemas de Almacenamiento": "¿Cuál?" (*) (sistema del paso 3) + "Porcentaje" (*), suma 100

### 4.3 Destino estiércoles — misma estructura que el 4.2 para la fracción sólida (en aves es el 4.2).

### 4.4 Energía y agua en los alojamientos ✅ (checks)
- Energía: "Empleo mayoritario de ventilación forzada" (→ "Dispone de un sistema alta eficiencia" · "Está optimizado a las condiciones de producción" · "Está diseñado y es utilizado a baja velocidad") · "Empleo mayoritario de refrigeración" (→ alta eficiencia · optimizado) · "Empleo mayoritario de calefacción" (→ alta eficiencia · optimizado) · "Uso de intercambiadores de calor" · "Uso de bombas de calor para la recuperación de calor" · "Uso de ventilación natural" · "Empleo mayoritario de iluminación bajo consumo" · "Los muros, suelos y/o techos del alojamiento de los animales se encuentran aislados"
- Agua: "Realiza la limpieza de los alojamientos con equipos de presión" (→ "El sistema de limpieza a presión utiliza agua caliente") · "Empleo mayoritario de bebederos de cazoleta" · "Empleo mayoritario de tolva seco-húmedo"

---

## PASO 5 — Uso agrícola ✅
Aparece para cada alojamiento o sistema exterior cuyo destino incluya "a campo".
- "Desconozco el sistema de aplicación a campo que se realiza." (útil si se cede el purín a un tercero)
- "N° técnicas distintas para la aplicación a campo…" (*)
- "Dispone de un programa de abonado para la aplicación de los purines al terreno." (ver condiciones en el botón i)
- Por técnica: "Técnica empleada en la aplicación a campo del purín" (*) ❓ lista completa; vistas: Bandas-Tubos colgantes · Bandas-zapatas colgantes · Plato difusor · Dilución purines y riego a baja presión · Acidificación purines y riego
  - "Tiempo de enterrado" (*): Antes de 4 horas · Antes de 12 horas · Antes de 24 horas · … ❓
  - Si es "antes de 12 horas": "Dispone de recursos (maquinaria, mano de obra) suficientes para facilitar un enterrado rápido."
  - "Apero usado en el enterrado" (*) ❓ (vistos: Vertedera, Grada)
  - "Porcentaje de aplicación de esta técnica" (*), suma 100
- Estiércol sólido: solo tiempo de enterrado, apero y porcentaje.

---

## PASO 6 — Consumos y aguas residuales (voluntario sin AAI) ✅
- **Combustible**: tabla con códigos NAPFUE y uso (Instalación fija · Transporte en las instalaciones · Funcionamiento maquinaria), con "¿Cuál es el consumo anual?" y "¿Realiza registro de tales consumos?". Ejemplos: Gasóleo C para instalaciones (litros), Gas natural (kWhPCS), Gas propano (kg), Biomasa pellets (kg), Gasóleo B para maquinaria agrícola (litros)… (lista completa en la captura p. 115-116 del manual de porcino)
- **Electricidad**: "¿Cuál es el consumo anual de energía suministrada por una empresa comercializadora? (kWh/año)" + "Compañía comercializadora" (select) + "Existe registro del consumo" (varias comercializadoras) · "Además se produce y consume energía renovable en la granja". No incluir la energía renovable.
- **Suministro hidráulico**: m³/año de Pozo · Cauce · Red pública · Cisterna · Otros + registro por fuente · "Dispone de un sistema de detección de fugas" · "Comprueba y ajusta periódicamente (al menos una vez al año) la calibración de los equipos de suministro de agua" · "Reutiliza las aguas de lluvia no contaminadas como aguas de lavado"
- **Aguas residuales**: "Dispone de un sistema de gestión de aguas residuales" · "Reduce la generación de aguas residuales"

---

## PASO 7 — Resultados y comunicación
- Hay que revisar el informe ganadero y el informe de MTD, marcar "He revisado los datos de la Granja y confirmo que son correctos" y la DECLARACIÓN RESPONSABLE, y pulsar "COMUNICAR".
- Para corregir antes de que la CCAA notifique al MAPA: lápiz → se crea una copia en modo escritura → se vuelve a comunicar. Solo vale la última comunicación.
- Lo comunicado se guarda y sirve de base para el año siguiente (solo se cambia lo que haya variado).

---

## Pendiente de verificar en ECOGAN (❓)
Se necesita entrar con perfil autorizado o público (simulador) y copiar las opciones exactas de:
1. Tipos de animal de aves de carne (pollitas y reproductoras), estirpes de puesta y tipos de aviario.
2. Tipo de suelo de aves según animal y distribución.
3. Foso en aves (campos completos) y frecuencia de vaciado del foso en porcino.
4. Tipos de depurador de aire, de control de polvo, de secado de yacija y de ventilación (pavos).
5. Tipos de cubierta de la balsa o depósito, y forma del depósito.
6. Métodos de tratamiento de purín y de estiércol.
7. Técnicas de aplicación a campo, tiempos de enterrado y aperos.
8. Tipos de almacenamiento exterior en aves de puesta y pavos.

## Validaciones que ya impone ECOGAN (replicarlas en GranjaFácil)
- Suma de plazas de los alojamientos = plazas del paso 1.
- Los porcentajes de destino y de distribución suman 100.
- Cadena de pesos de los piensos (ver 4.1).
- Si cambia el tipo de animal en el paso 2, se borran los piensos del paso 4.
- Si cambia la consistencia de la deyección después de rellenar el paso 4, hay que rehacer el 4.2 y el 4.3.
- Coma decimal; plazas en entero; pesos con 1 decimal; piensos con 3 decimales; consumos con 2 decimales.
- Producción de purín máxima teórica por plaza (RD 306/2020, Anexo I, m³/plaza/año): engorde 20-120 kg 2,15 · lechón 6-20 kg 0,41 · cerda con lechones hasta destete 5,10 · cerda de reposición 2,50 · verraco 6,12 · wean to finish 1,67. Útil como rango de aviso, no como valor a declarar.
