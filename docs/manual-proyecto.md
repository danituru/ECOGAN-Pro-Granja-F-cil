# MANUAL DEL PROYECTO — GranjaFácil (nombre provisional)
### Gestión de la comunicación ECOGAN para granjas porcinas y avícolas

> **Para Claude Code:** este documento es la fuente de verdad del proyecto. Léelo entero antes de escribir código.
> - Sigue las fases en orden y no construyas nada de una fase posterior hasta que la actual cumpla su criterio de "hecho".
> - Si algo de este manual choca con la normativa o la documentación oficial que encuentres, avisa antes de seguir. No inventes campos ni requisitos legales.
> - Sustituye por completo al archivo `ecogan-spec.md`.
>
> Resultados de la fase 0 y conflictos detectados con este manual: ver [investigacion.md](investigacion.md) §7.

---

## 1. Visión

Ser **el servicio de referencia con el que los ganaderos cumplen sus obligaciones ambientales**, empezando por ECOGAN. El ganadero responde unas preguntas sencillas desde el móvil, y nosotros nos encargamos del resto y le entregamos el justificante.

**Mensaje de venta:** *"Tú contestas 10 minutos desde el móvil y nosotros hacemos tu ECOGAN. Presentado en plazo o te devolvemos el dinero."*

### Qué es ECOGAN (contexto)
- Aplicación del Ministerio de Agricultura (MAPA) en la que las granjas calculan sus emisiones y comunican al **Registro General de MTD** las Mejores Técnicas Disponibles que aplican.
- **Obligados:** granjas de porcino en sistema intensivo (RD 306/2020) y granjas de pollos, gallinas ponedoras y pavos (RD 637/2021).
- **Exentas,** entre otras: granjas reducidas, de autoconsumo, especiales y cinegéticas, y en porcino las extensivas.
- **Plazo:** cada año, del **1 de enero a antes del 1 de marzo**, con los datos del año anterior.

## 2. Usuarios

| Usuario | Qué necesita | Cómo usa la app |
|---|---|---|
| **Titular de la granja** (el que paga) | Cumplir sin perder tiempo y sin sanciones | Formulario guiado en el móvil; agente por WhatsApp a partir de la fase 2 |
| **Asesor, veterinario o técnico de cooperativa** (canal de venta clave) | Gestionar muchas granjas a la vez | Panel multigranja (fase 3) |
| **Operador** (Daniel o un equipo) | Revisar los datos y presentarlos en ECOGAN rápido | Panel de administración y ficha de presentación |

**Perfil real del usuario:** ganadero de zona rural, con poco tiempo y poca paciencia para la burocracia. Usa el móvil y WhatsApp a diario. Todo el diseño parte de esto.

## 3. Modelo de negocio

1. **Cuota anual por granja:** entre 90 y 200 € según especie y tamaño, a validar con los primeros clientes.
2. **Recargo por urgencia** para quien contrata en febrero, cerca del final del plazo.
3. **Descuento por volumen** para titulares con varias granjas y para cooperativas.
4. **Fase 4 en adelante:** otras obligaciones del mismo ganadero y recomendación de MTD (comisión de instaladores y proveedores).

**Tamaño del mercado:** en la fase 0 hay que averiguar el número real de granjas obligadas en España (porcino intensivo y avícola) a partir del REGA y de las estadísticas del MAPA.

## 4. Lo que nos hace difíciles de desbancar (diseñar para ello desde el día 1)

1. **Reutilización año a año:** los datos de un año se arrastran al siguiente. La renovación consiste en "¿qué ha cambiado?" y se hace en 2 minutos. Cambiarse a otro proveedor obliga a empezar de cero.
2. **Ventanilla única del ganadero:** ECOGAN es la puerta de entrada. El modelo de datos (granja, censo, naves, gestión de estiércol, alimentación) sirve también para otras obligaciones de la granja que se añadan en la fase 4. El ganadero acaba teniendo toda su granja en nuestra app.
3. **Canal de asesores:** veterinarios, técnicos de cooperativa e ingenierías ambientales llevan muchas granjas. Su panel multigranja convierte a cada asesor en una fuente de decenas de clientes.
4. **Calendario de cumplimiento:** la app avisa de todos los plazos de la granja, no solo de ECOGAN, y se convierte en lo que el ganadero mira para no tener problemas.

## 5. Stack y arquitectura

- **Next.js** (app web y paneles) como **PWA**, sin aplicación de escritorio ni apps nativas.
- **Supabase:** Postgres, autenticación, almacenamiento de archivos y **Row Level Security** para aislar los datos de cada cliente.
- **Autenticación sin contraseñas:** enlace mágico o código por SMS o email.
- **Stripe** para los cobros.
- **Generación de PDF** en el servidor.
- **Claude API:** extracción de datos de fotos de documentos (fase 1, opcional) y agente conversacional (fase 2).
- **Meta WhatsApp Cloud API** a partir de la fase 2.
- Todo en **español**.

### Entidades principales (punto de partida, ajustar tras la fase 0)
- `Titular`: persona física o empresa, NIF, contacto, autorización de representación.
- `Granja`: código REGA, comunidad autónoma, municipio, especie, sistema productivo, capacidad, si es una granja integrada y con qué integradora.
- `Campana`: granja + año de datos, con su estado.
- `DatosECOGAN`: los campos exactos que pide ECOGAN para esa especie y fase productiva (censo, alimentación, alojamiento, gestión de estiércol, MTD…). **Se definen a partir de la fase 0.**
- `Documento`: fotos y archivos aportados, ficha de presentación y justificante de ECOGAN.
- `Asesor` (fase 3): usuario que gestiona N granjas de distintos titulares.

### Estados de una campaña
`sin empezar → recogiendo datos → pendiente de revisión → lista para ECOGAN → comunicada → justificante enviado`

## 6. Fases (seguir en orden)

> **Calendario crítico:** la campaña de ECOGAN va del 1 de enero al 1 de marzo. **La fase 1 debe estar terminada y vendiéndose antes del 1 de diciembre.** Si una funcionalidad pone en riesgo esa fecha, se mueve a una fase posterior.

### FASE 0 — Investigación (antes de programar)
1. **Campos oficiales:** revisar en mapa.gob.es las páginas de ECOGAN por sector (porcino, aves de puesta, aves de carne y pavos), los documentos de preguntas frecuentes y las guías de usuario. Sacar **la lista exacta de campos, opciones y validaciones** por especie y fase productiva.
2. **Exenciones:** sacar las reglas exactas de quién está obligado y quién está exento (RD 306/2020 y RD 637/2021).
3. **Representación:** verificar si ECOGAN permite que un tercero autorizado presente en nombre del titular y cómo se acredita esa representación en cada comunidad autónoma. **Esto condiciona todo el modelo operativo.**
4. **Granjas integradas:** averiguar quién presenta ECOGAN cuando la granja trabaja para una integradora. Si lo hace la integradora, nuestro mercado principal son las granjas independientes y las integradoras pasan a ser clientes potenciales.
5. **Competencia:** buscar gestorías, ingenierías, cooperativas o software que ya ofrezcan este servicio, con precios y puntos débiles.
6. **Tamaño del mercado:** número de granjas obligadas por especie y comunidad autónoma.
7. Escribir todo en `docs/investigacion.md` y ajustar el modelo de datos.

**Hecho cuando:** existen la lista de campos por especie, las reglas de exención, la respuesta sobre la representación, el informe de competencia y el tamaño del mercado.

### FASE 1 — MVP web (antes del 1 de diciembre)
1. **Landing page** con el mensaje de venta, el precio, la garantía y un formulario de contratación.
2. **Alta del cliente:** datos del titular y de sus granjas.
3. **Comprobador de obligación:** según la especie, el tipo de granja y su tamaño, indica si está obligada o exenta. Funciona también como gancho gratuito en la landing.
4. **Autorización de representación y consentimiento RGPD,** con un PDF firmado o aceptado.
5. **Pago** con Stripe.
6. **Formulario guiado en el móvil:** una pregunta por pantalla, en lenguaje llano, siguiendo los campos de ECOGAN. Se puede guardar a medias y seguir más tarde. El enlace se envía por SMS o WhatsApp (sin API).
7. **Subida de fotos** de documentos (facturas de pienso, libro de registro, licencia ambiental). Opcional: extracción automática de datos con Claude.
8. **Validaciones:** campos obligatorios, coherencia del censo con la capacidad y valores dentro de rangos razonables.
9. **Recordatorios** automáticos a quien deje el formulario a medias.
10. **Ficha de presentación:** pantalla o PDF con los datos **en el mismo orden y con los mismos nombres que ECOGAN**, para que el operador los introduzca en menos de 10 minutos.
11. **Subida del justificante** y envío automático al cliente por email o SMS.
12. **Panel de administración:**
    - Lista de granjas por estado y cuenta atrás hasta el 1 de marzo.
    - Aviso de las granjas en riesgo de no llegar al plazo.
    - Edición manual de los datos y exportación a CSV.

**Hecho cuando:** un ganadero completa sus datos desde el móvil en menos de 20 minutos, el operador presenta una granja en menos de 10 minutos y el flujo de pago a justificante funciona de principio a fin.

### FASE 2 — Agente de WhatsApp y renovación automática
1. **Agente por WhatsApp** (Claude API): hace las mismas preguntas que el formulario de forma conversacional, entiende notas de voz y fotos, y **siempre confirma** lo que ha entendido antes de guardarlo.
2. **Campaña de renovación:** en noviembre, aviso a los clientes del año anterior, con los datos precargados y la pregunta de qué ha cambiado.

### FASE 3 — Canal de asesores
1. **Panel multigranja** para veterinarios, técnicos de cooperativa e ingenierías: dan de alta granjas de sus clientes y ven el estado de todas.
2. **Programa de afiliados:** comisión o descuento por cada granja que traigan.
3. **Facturación agrupada** para cooperativas y titulares con muchas granjas.

### FASE 4 — Ventanilla única del ganadero
1. **Calendario de cumplimiento** con todos los plazos de la granja.
2. **Otras obligaciones** de la granja que encajen con los datos que ya tenemos. Hay que investigar cuáles, por ejemplo planes de gestión de estiércoles o declaraciones de emisiones como el registro PRTR, siempre verificando la normativa vigente.
3. **Estimación previa de emisiones y recomendación de MTD** para reducirlas, con derivación a instaladores y proveedores a cambio de comisión.

## 7. Lo que NO hay que construir (al menos hasta la fase 4)
- Aplicación de escritorio o apps nativas.
- Un calculador de emisiones propio que sustituya al oficial (lo oficial es lo que vale).
- Automatización del acceso a ECOGAN con el certificado digital o Cl@ve del cliente.
- Dashboards, gráficos o estadísticas complejas para el ganadero.
- Gestión técnica de la granja (producción, sanidad, piensos): no somos un software de gestión ganadera.
- Funciones que ningún cliente haya pedido.

## 8. Reglas obligatorias
1. **No inventar campos ni requisitos legales.** Si un dato no está verificado, marcarlo como `// TODO: verificar normativa`.
2. **La presentación en ECOGAN la hace siempre una persona autorizada.** Nunca automatizar el acceso con las credenciales o el certificado del cliente.
3. **Revisión humana obligatoria** antes de presentar.
4. **Protección de datos (RGPD):**
   - Consentimiento y contrato de encargado del tratamiento con cada cliente.
   - Cifrado, Row Level Security estricta y registro de accesos.
   - Retención de datos definida.
5. **Accesibilidad:**
   - Letra grande (mínimo 16 px) y botones grandes.
   - Una pregunta por pantalla y textos cortos, sin jerga técnica.
   - Ayuda contextual con ejemplos en cada pregunta difícil (por ejemplo, fotos de tipos de suelo o de balsa).
6. **Diseño pensado primero para el móvil** en todo lo que use el ganadero.
7. **Tests** de las reglas críticas: comprobador de obligación, validaciones, generación de la ficha y aislamiento de datos entre clientes.

## 9. Riesgos y cómo mitigarlos
| Riesgo | Mitigación |
|---|---|
| ECOGAN es gratuito y el ganadero puede hacerlo él mismo | Vendemos tiempo y tranquilidad, no la herramienta; garantía de plazo; precio bajo frente al coste de una gestoría |
| Las integradoras o cooperativas ya lo hacen para muchas granjas | Investigarlo en la fase 0; centrarse en granjas independientes y ofrecer el panel a las integradoras como clientes |
| No se puede presentar como representante, o es complicado | Resolverlo en la fase 0; si no se puede, el modelo pasa a "te lo dejamos listo y te guiamos en videollamada" |
| Venta muy estacional (enero a marzo) | Vender desde octubre y noviembre; la fase 4 añade obligaciones con otros plazos para ingresar todo el año |
| Pico de trabajo en febrero | Ficha optimizada para presentar en menos de 10 minutos; limitar las altas tardías o aplicarles recargo |
| Cambios en ECOGAN o en la normativa | Campos definidos como configuración; revisión de la aplicación oficial cada noviembre |
| Error en una comunicación y sanción para el cliente | Revisión humana, confirmación de los datos por parte del cliente antes de presentar, aviso legal y límite de responsabilidad |
| Competidores (gestorías o ingenierías) | Diferenciarse por rapidez, precio y comodidad desde el móvil; captar asesores como aliados en lugar de competirles |

## 10. Métricas de éxito
- **Primera campaña:** entre 30 y 100 granjas presentadas en plazo.
- **Conversión:** más del 20% de los que usan el comprobador gratuito contratan.
- **Renovación:** más del 80% de los clientes repiten la campaña siguiente.
- **Eficiencia:** menos de 10 minutos de trabajo humano por granja.

## 11. Plan comercial (contexto para la landing y el onboarding)
- **Canal 1:** veterinarios y técnicos de cooperativa (panel multigranja y afiliación).
- **Canal 2:** contacto directo con granjas independientes en zonas con mucho porcino y avícola (la fase 0 dirá cuáles), con llamada, visita o mensaje.
- **Canal 3:** el comprobador gratuito "¿Estás obligado a presentar ECOGAN?" como gancho en la landing.
- **Oferta de lanzamiento:** precio reducido para quien contrate antes del 15 de diciembre.
- **Garantía:** presentado en plazo o devolución del dinero.
