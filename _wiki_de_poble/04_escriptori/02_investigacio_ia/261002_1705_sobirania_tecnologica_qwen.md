# Informe Técnico: Evaluativa de Qwen 3.8 Local vs. Modelos Cloud y su Aplicación para la Soberanía Tecnológica Rural en "Sóc de Poble"

## 1. Introducción y Marco Estratégico: Soberanía Tecnológica Rural en "Sóc de Poble"

### 1.1 Visión del Proyecto y Contexto Operativo en La Torre de les Maçanes

El ecosistema digital Sóc de Poble, desplegado en el nodo municipal de Gent de La Torre (La Torre de les Maçanes), responde a la necesidad imperativa de dotar al entorno rural de una infraestructura de computación autónoma, resiliente y libre de dependencias corporativas. En áreas de baja densidad poblacional o con vulnerabilidad estructural en las redes de telecomunicaciones, la capacidad de procesar información localmente no es un mero lujo técnico, sino la piedra angular de la resiliencia comunitaria. La soberanía tecnológica rural exige que las operaciones informáticas, el análisis documental municipal y las interacciones digitales de los ciudadanos continúen ejecutándose sin interrupciones, incluso si los grandes proveedores de la nube sufren caídas de red o interumpen unilateralmente el acceso a sus servicios.

La arquitectura de "Sóc de Poble" se concibe como un nodo municipal descentralizado que articula la gobernanza, la memoria colectiva y la gestión de recursos comunitarios. Esta visión holística está cimentada sobre una estructura formal representada por sus componentes normativos e identitarios clave extraídos directamente del ecosistema:

* El projecte: Definición estratégica y marco conceptual de la plataforma comunitaria descentralizada.
* Constitució: Marco normativo y reglas institucionales de gobernanza algorítmica y social del nodo municipal.
* L'ànima de la iaia: Principios éticos, identidad cultural e inteligencia comunitaria adaptada a la idiosincrasia local.
* Full de ruta: Plan de desarrollo técnico e implementación proyectada de capacidades tecnológicas continuas.
* Versions: Trazabilidad, auditoría y control de cambios del software desplegado en la infraestructura del municipio.
* Legal i privacitat: Salvaguarda estricta de la protección de datos personales y soberanía absoluta de la información de los habitantes.

Esta robusta arquitectura organizativa y técnica requiere una evaluación exhaustiva de los modelos de inteligencia artificial locales para determinar si pueden reemplazar con garantías operativas a los proveedores propietarios en la nube.

### 1.2 El Imperativo del Procesamiento 100% Offline y Desconexión Cloud

El modelo tradicional de Inteligencia Artificial como Servicio (SaaS) basado en la nube presenta riesgos significativos para las infraestructuras municipales rurales: vulnerabilidad ante cortes de conexión a Internet, costes recurrentes por licencias y API, y la inevitable fuga de datos privados hacia servidores externos gestionados por corporaciones multinacionales. Frente a este paradigma, el procesamiento local garantiza la absoluta confidencialidad de la información administrativa y comunitaria, eliminando la factura recurrente de suscripciones.

Resulta redundante asumir costes continuados en plataformas como OpenAI, Google o Anthropic cuando el hardware de consumo actual es capaz de ejecutar modelos locales optimizados de alta complejidad. La premisa operativa y económica para la soberanía de La Torre de les Maçanes es pragmática: ante tareas administrativas y agénticas directas, "¿para qué pagar un cohete si necesitas un utilitario?". No es necesario financiar la infraestructura masiva de un centro de datos en la nube cuando un servidor municipal propio resuelve la tarea con idéntica o superior eficacia técnica y coste cero por token.

| Criterio de Evaluación | Procesamiento Cloud (OpenAI / Google / Anthropic) | Procesamiento Local (Qwen 3.8 / Servidor Propio) |
| --- | --- | --- |
| Privacidad de Datos | Riesgo de filtración y procesado en servidores externos corporativos. | 100% Privado; los datos no salen del servidor del municipio. |
| Costes Operativos (API) | Cuotas recurrentes, pago por token generado y costes de suscripción. | Coste $0 en licencias o consumo de API tras la adquisición del hardware. |
| Latencia y Rendimiento | Dependiente de la saturación de red y servidores distantes (1,74 t/s en OpenAI Cloud). | Alta velocidad de procesamiento (hasta 70–100 t/s en hardware optimizado). |
| Dependencia de Internet | Inoperativo ante caídas de fibra o cortes de conectividad rural. | Funcionamiento continuo 100% offline y resiliencia en red local/malla. |
| Requerimientos de Hardware | Mínimos en el cliente (procesamiento diferido a la nube). | GPU dedicada en servidor local (mínimo 8 GB VRAM; óptimo RTX 4090/5090). |

Esta diferenciación en la infraestructura sienta las bases para auditar las métricas de rendimiento reales que ofrecen los modelos locales de última generación frente a las alternativas en la nube.

## 2. Evaluación de Rendimiento y Arquitectura del Modelo Qwen 3.8

### 2.1 Análisis Comparativo de Benchmarks e Inteligencia Agéntica

El panorama de la inteligencia artificial ha experimentado un cambio de paradigma histórico. Modelos de tamaño contenido, con una huella en disco y peso de parámetros de solo 17 GB, están alcanzando niveles de capacidad agéntica que hasta hace pocos meses requerían infraestructuras masivas en centros de datos. El modelo Qwen 3.8 representa un hito técnico al poder ejecutarse directamente en GPUs de gama de consumo, ofreciendo un rendimiento de vanguardia local (vanguardia local).

De acuerdo con los datos recopilados por Georgi Gerganov (creador del marco llama.cpp) y los análisis independientes de Artificial Analysis, Qwen 3.8 ha experimentado un salto cualitativo al pasar de 38 a 52 puntos en los índices de evaluación comparativa. Esta subida de 14 puntos lo sitúa por encima de modelos comerciales consolidados como Claude Opus 4.8, QV4 Pro y GPT 5.6 Luna. Este avance técnico ha sido respaldado por figuras referentes de la industria como Klein, quien afirmó taxativamente: "primera vez que un modelo que se puede ejecutar en local alcanza uno de vanguardia... no lo esperaba nadie ni de lejos".

Es crítico precisar la arquitectura de hardware para evitar confusiones técnicas: mientras el archivo del modelo ocupa un espacio de 17 GB en disco, los requerimientos mínimos de memoria de video para la inferencia arrancan a partir de 8 GB de VRAM, alcanzando su rendimiento óptimo (throughput) en tarjetas gráficas de consumo superior como las RTX 4090 o RTX 5090.

Al analizar la estructura de rendimiento del modelo, es vital diferenciar dos dominios operativos:

1. **Inteligencia General**: Los modelos propietarios de gran escala alojados en la nube como DeepSeek GLM, Opus 4.7 y Gemini 3.7 Flash se mantienen por delante en razonamiento puramente abstracto o teórico. Del mismo modo, los modelos de máxima gama como Claude Opus 5 y Fabel 5 lideran la clasificación absoluta.
2. **Utilidad Agéntica y Uso de Herramientas**: En la capacidad práctica para interactuar con comandos, ejecutar llamadas a herramientas externas (MCPs) y completar proyectos de forma autónoma, Qwen 3.8 supera a competidores directos de la nube como Gemini 3.7 Flash. El modelo local destaca por su utilidad práctica en flujos de trabajo cerrados.

Comprendida la potencia del modelo y sus requisitos de memoria, es imprescindible analizar la configuración operativa necesaria para extraer su máximo rendimiento sin penalizaciones de latencia.

### 2.2 Configuración, Tareas de Razonamiento y Optimización de Throughput

El hardware por sí solo no garantiza el éxito de la implantación; la correcta configuración del software de inferencia constituye el factor decisivo para evitar cuellos de botella operativos. Qwen 3.8 requiere un ajuste preciso de sus parámetros de fábrica para no incurrir en sobrecostes temporales o bucles de cálculo innecesarios.

El modelo incorpora de serie un parámetro de razonamiento extendido elevado al máximo (default reasoning). Si se mantiene activo de forma predeterminada, las pruebas documentadas por Simon Willison demuestran que, ante la petición de un dibujo simple, el modelo empleó 21 minutos y generó 22.000 tokens de pensamiento interno para producir únicamente 3.000 tokens de salida final. Asimismo, ante la orden de dibujar un círculo, el sistema derivó en la elaboración no solicitada de un complejo estudio geométrico animado con anillos concéntricos. Con el modo de razonamiento desactivado o configurado en nivel bajo, esa misma tarea se completó en solo 2 minutos.

**Configuración Técnica Recomendada para Qwen 3.8 en Servidor Municipal (LM Studio + Hermes)**

* **Nivel de Razonamiento (Reasoning)**: Ajustar a "Bajo" o "Desactivado" para tareas administrativas, lectura de documentos y programación estándar. Incrementar a niveles superiores únicamente en problemas matemáticos o lógicos de extrema complejidad.
* **Ventana de Contexto (Context Window)**: Ampliar manualmente la ventana de contexto al cargar el modelo en LM Studio. Si se mantiene el valor predeterminado, el modelo agotará el espacio operativo únicamente procesando sus propios tokens de razonamiento.
* **Procesamiento de Visión y Contexto Largo**: Configurar el modelo para admitir hasta 100.000 tokens de contexto con soporte multimodal de visión activo.
* **Rendimiento de Generación (Throughput)**:
  * Ajuste por defecto sin optimizar: 15 a 30 tokens por segundo (t/s).
  * Ajuste optimizado (GPU RTX 4090): Escalado hasta 70 t/s (con capacidades de visión y 100k contexto) y picos de hasta 100 t/s en generación de texto continuo (frente a los 1,74 t/s observados en entornos OpenAI Cloud).

Una vez parametrizado y optimizado el motor de inferencia local, se procede a auditar la capacidad agéntica real del modelo mediante pruebas de ingeniería de software comparadas.

## 3. Auditoría Experimental de Capacidades Agénticas y Protocolos MCP

### 3.1 Caso de Uso 1: Desarrollo Web Autónomo e Integración de MCPs Multimedia (FridgeFlow)

La evaluación de desarrollo de software autónomo se ejecutó utilizando bucles agénticos cerrados (planificación, construcción, prueba, revisión, corrección y refinado) mediante prompts procesados en entornos de orquestación como Hermes, Antigravity y Claude Code. Se encomendó a los modelos el diseño y programación integral de FridgeFlow, una aplicación web orientada a la gestión de ingredientes en cocina, generación de recetas y planificación de menús semanales.

Para evaluar la capacidad de interacción con herramientas de terceros mediante el Protocolo de Contexto de Modelo (Model Context Protocol o MCP), la prueba exigía integrar conectores externos como TopView MCP —capaz de analizar métricas de e-commerce y tendencias comerciales en plataformas como Amazon, YouTube, TikTok Shop y Shopee— y el motor Sidens 2.5 para la generación automatizada de anuncios y recursos en vídeo (tomando como demostración funcional la creación de un spot publicitario para una freidora de aire con consistencia visual de personajes y locución en español).

La auditoría del código y de las aplicaciones resultantes, ejecutada bajo la supervisión y criterios del modelo de control Claude Opus 5, arrojó las siguientes conclusiones sobre la ejecución práctica de los tres contendientes:

El análisis de este caso de uso confirma un hecho técnico crucial: Qwen 3.8 en ejecución 100% local superó en ejecución agéntica real al modelo insignia de Google (Gemini 3.7 Flash). Mientras Gemini entregó una simple maqueta visual estática con botones inoperativos, Qwen 3.8 construyó una aplicación web con backend funcional e interfaz dinámica.

Superada la prueba de desarrollo web y orquestación multimedia, resulta imprescindible evaluar el comportamiento del modelo local en entornos de gestión administrativa e inteligencia documental compleja.

### 3.2 Caso de Uso 2: Procesamiento Masivo de Documentos Complejos y Lógica Financiera en Excel

El segundo caso práctico evaluó la capacidad de los modelos para procesar un corpus documental administrativo no estructurado compuesto por 42 archivos heterogéneos: métricas en hojas de cálculo, análisis de la competencia, currículums vitae, facturas para contabilización y resúmenes de reuniones.

Se solicitó a Qwen 3.8 (vía Hermes) y a Gemini 3.7 Flash (vía Spark) la entrega de dos productos finales: un Informe Ejecutivo y un Cuadro de Mando en Excel articulado en cinco pestañas (Panel, Documentos, Acciones, Dinero y Equipo). Una auditoría profunda realizada por Claude Opus 5 a través de 15 magnitudes clave evaluó los resultados en siete dimensiones técnicas fundamentales:

1. **Exactitud Numérica**: Empate técnico. Ambos modelos coincidieron con los cálculos del modelo de control en 14 de las 15 magnitudes auditadas.
2. **Cobertura del Corpus**: Victoria de Qwen 3.8. Procesó la totalidad de los 42 documentos. Gemini 3.7 Flash sufrió una omisión crítica al incluir únicamente 28 de los 42 archivos en su cuadro de mando (omitiendo 14 documentos).
3. **Elaboración del Plan de Acción**: Victoria de Gemini 3.7 Flash (por escaso margen). Cruzó de manera más estética las acciones con el calendario operativo.
4. **Detección de Contradicciones y Gestión de Contexto**: Victoria de Qwen 3.8. Detectó 12 de las 21 discrepancias internas presentes en el corpus (frente a 9 de Gemini) e identificó 7 de los 8 riesgos financieros de alto coste (frente a solo 4 de Gemini).
5. **Criterio de Negocio**: Victoria de Qwen 3.8. Demostró mejor análisis contextual de las discrepancias operativas.
6. **Calidad Estética del Entregable**: Victoria de Gemini 3.7 Flash. Presentación visual y acabado inicial más pulido.
7. **Ingeniería de Formulación en Excel**: Victoria solvente de Qwen 3.8.
  * *Fallo de lógica en Gemini*: Confundió los salarios potenciales de 2 candidatos de CVs no contratados y los sumó incorrectamente como gastos activos de la empresa.
  * *Prueba de recálculo dinámico*: Al desplazar la fecha de referencia del cuadro de mando del 17 de agosto al 25 de agosto, la lógica de fórmulas de Gemini falló en actualizar la deuda vencida (manteniendo el valor congelado en 2.904 €). En cambio, la formulación de Qwen 3.8 recalculó automáticamente el importe a 4.865 €, reflejando con precisión la factura vencida en el intervalo.

| Dimensión Evaluada | Qwen 3.8 (Local) | Gemini 3.7 Flash (Cloud) |
| --- | --- | --- |
| Cobertura de Documentos | 42 / 42 Documentos | 28 / 42 Documentos (Omisión de 14 archivos) |
| Discrepancias Detectadas | 12 / 21 Detectadas | 9 / 21 Detectadas |
| Riesgos Financieros de Alto Coste | 7 / 8 Riesgos Identificados | 4 / 8 Riesgos Identificados |
| Lógica de Recálculo en Excel | Dinámica y Correcta (4.865 €) | Estática / Error de Fórmula (2.904 €) |
| Contabilidad de Salarios (CVs) | Correcta (Ignora no contratados) | Incorrecta (Suma gastos no existentes) |
| **PUNTUACIÓN FINAL AUDITORÍA** | **7,6 / 10** | **6,7 / 10** |

Demostrada la superioridad operativa y la fiabilidad de Qwen 3.8 en entornos administrativos complejos, procede trasponer estas capacidades sobre los componentes del sistema software "Sóc de Poble".

## 4. Mapeo de Capacidades de IA sobre el Ecosistema "Sóc de Poble"

### 4.1 Auditoría de Módulos Activos y Áreas de Aplicación Inteligente

La arquitectura funcional de la plataforma municipal gentdelatorre.net abarca múltiples módulos interactivos. La integración de Qwen 3.8 en el servidor local del pueblo permite dotar a cada uno de estos módulos de capacidades de IA agéntica sin comprometer la privacidad comunitaria ni depender de conectores de pago externos.

El despliegue de estas mejoras en los módulos interactivos requiere articular un componente de interacción natural que encarne la identidad del ecosistema y vele por el cumplimiento de la normativa comunitaria.

### 4.2 Diagnóstico de la "IAIA MarIA" y Gobernanza Algorítmica Comunal

El ecosistema incorpora la entidad virtual IM IAIA MarIA, diseñada para actuar como la interfaz conversacional de lenguaje natural para los habitantes de La Torre de les Maçanes. El diagnóstico técnico para su despliegue exige alinear sus respuestas con los principios identitarios de L'ànima de la iaia y las directrices normativas de la Constitució del nodo municipal.

Puntos clave de despliegue operativo:

* **Soberanía y Privacidad de Datos**: Al ejecutar Qwen 3.8 en el servidor físico municipal, la "IAIA MarIA" puede guiar trámites administrativos, resolver dudas sobre ordenanzas y procesar expedientes vecinales con la garantía absoluta de que ningún dato personal o municipal abandona la red local del pueblo.
* **Alineamiento Cultural y Lingüístico**: La personalidad y las instrucciones de sistema (system prompts) del modelo se configuran bajo las directrices de L'ànima de la iaia, asegurando un tono cercano, adaptado a la realidad rural y respetuoso con la tradición oral y social del municipio.
* **Gobernanza Algorítmica Restrictiva**: Toda acción agéntica que intente ejecutar la "IAIA MarIA" (como publicar avisos en el Mur o modificar eventos en el Calendari) está subordinada a las reglas de la Constitució, impidiendo cualquier decisión autónoma no supervisada en materias administrativas críticas.

Establecida la gobernanza y el rol de la entidad virtual, es necesario identificar los vacíos técnicos existentes y definir el plan ejecutable para consolidar la infraestructura.

## 5. Arquitectura Objetivo y Hoja de Ruta: Hacia la Soberanía 100% Offline y Agéntica

### 5.1 Análisis de Brechas Tecnológicas y Funcionalidades Pendientes

A pesar del sobresaliente rendimiento de Qwen 3.8 en procesamiento documental, la implantación plenamente autónoma en La Torre de les Maçanes exige resolver deficiencias técnicas identificadas durante la fase auditora:

* **Memoria Vectorial Persistente y RAG Local**: Solucionar las limitaciones de memoria contextual a largo plazo detectadas en Qwen 3.8 (como los errores de persistencia de ingredientes observados en el test de FridgeFlow). Es imprescindible desplegar motores de base de datos vectoriales locales como ChromaDB o Qdrant integrados con los endpoints de API local en LM Studio o Ollama, garantizando que "IAIA MarIA" retenga el contexto histórico y normativo municipal de forma permanente.
* **Infraestructura MCP Local Comunal**: Desarrollar conectores agénticos abiertos basados en el marco FastMCP (servidores localizados en Python) para sustituir herramientas propietarias. Estos conectores MCP locales automatizarán la producción de material audiovisual para el municipio, la emisión de bandos en audio y la maquetación en el módulo Disseny sin enviar información a plataformas externas.
* **Parseo Administrativo Autónomo**: Implementar la canalización de auditoría documental (demostrada en la prueba de los 42 documentos) mediante pipelines locales automatizados para procesar facturas municipales, balances de tesorería y actas de plenos directamente en el servidor local de la comunidad.

La resolución de estas brechas tecnológicas se estructurado de forma secuencial en una hoja de ruta técnica de despliegue.

### 5.2 Hoja de Ruta de Implementación en Antigravity y Servidores Locales

Para lograr la transición integral hacia una infraestructura soberana sin perder capacidades operativas cuando exista acceso a la red, se establece un plan de despliegue dividido en cuatro fases ejecutivas que integran orquestación híbrida en Antigravity, utilizando Gemini Pro como mecanismo de respaldo (cloud fallback) condicional únicamente cuando la conectividad esté disponible:

1. **Fase 1: Infraestructura y Servidor Local**:
  * Adquisición y puesta en marcha del servidor físico municipal equipado con GPU dedicada (mínimo 8 GB VRAM; óptimo RTX 4090 o 5090).
  * Instalación y parametrización del motor de inferencia local en LM Studio / Ollama.
  * Integración del arnés de orquestación agéntica Hermes e implementación de la configuración con razonamiento bajo para asegurar un throughput continuo de 70–100 t/s.
2. **Fase 2: Integración de IAIA MarIA y Módulos Core**:
  * Conexión del motor Qwen 3.8 a los módulos de Xat, Wiki de Poble, Notes personals y Constitució.
  * Despliegue de la base vectorial local (ChromaDB / Qdrant) para la memoria persistente de la "IAIA MarIA".
  * Configuración de los parámetros éticos y normativos exigidos por Legal i privacitat.
3. **Fase 3: Agentes MCP Comunales y Automatización**:
  * Despliegue de conectores FastMCP locales para la extracción de eventos no estructurados hacia el Calendari.
  * Implementación del pipeline de auditoría documental para la gestión del Mercat y la contabilidad municipal.
  * Activación de conectores locales de generación visual en el módulo Disseny.
4. **Fase 4: Resiliencia y Gobernanza Offline Total**:
  * Pruebas de desconexión completa de red (air-gap testing) para validar la operatividad del nodo en situación de aislamiento de telecomunicaciones.
  * Configuración del orquestador Antigravity: en condiciones normales con conectividad, Antigravity puede derivar consultas teóricas complejas de inteligencia general a Gemini Pro como fallback en la nube; ante caídas de red o por defecto en tareas críticas con datos sensibles, la lógica conmuta al motor local Qwen 3.8.
  * Certificación de soberanía tecnológica y funcionamiento ininterrumpido sin costes de API.

La implantación de esta arquitectura técnica garantiza que, incluso en el escenario extremo en que los proveedores cloud internacionales "corten el grifo" de sus servicios, la comunidad de La Torre de les Maçanes mantendrá sus capacidades informáticas, su gestión administrativa y su inteligencia comunitaria operando de manera ininterrumpida, autosuficiente y plenamente soberana.
