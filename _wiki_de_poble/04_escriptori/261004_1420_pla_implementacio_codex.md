---
type: document
status: esborrany
description: Separar Gestoria de la Wiki, verificar els avatars redons ja aplicats i recompilar el connector 1.0.3 per a Gent de la Torre.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_3829d514-eb9a-406e-ae86-dd2647b0abfd:46105504-68bb-469d-927e-c455c3af5b4d
---
# Tancament 1.0.3: separar Gestoria i Wiki

**Estat del Pla:** aprovat per ordre executiva humana del 04/10/2026, captures 14:05–14:06

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3829d514-eb9a-406e-ae86-dd2647b0abfd:46105504-68bb-469d-927e-c455c3af5b4d |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T12:19:38.515Z |
| Modificació | 2026-10-04T13:38:29.927639+00:00 |
| Propietari | agent-local |
| Aprovació humana | Ordre directa del Mestre: reparar contaminació, acabar poliment i empaquetar 1.0.3. |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Codex, basat en GPT-6; variant exacta no exposada. |
| Tokens consumits | No mesurats: comptador exacte del torn no accessible; no equival a zero. |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-04 15:30: tancament anterior complet (informe, acta, ZIP 15:14 i Escriptori). Comprovació posterior en Claude Desktop: Verifica 0/1 i bateria final pendent. Es complix la condició humana de la nova tasca. Codex assumix només el relleu de Sidebar de Gestoria i regenerarà el paquet després; Claude conserva el seu front d’espècimen d’avatar.

2026-10-04 15:15: Claude retira la compatibilitat legacy durant el tancament. La separació estricta continua resolent l’ordre humana; Codex adopta el criteri final, revalida les proves que Claude ha actualitzat i recompila. Els resultats 59/59 anteriors es conserven com a tall històric, no com a verd de les fonts noves.

2026-10-04 14:30: detectada edició concurrent de Claude al mateix front. La ruta /app/gestoria reutilitza la plataforma i complix la separació; se substituïx el mecanisme /gestoria proposat, abans d’aplicar cap pegat de rutes de Codex. No és un front addicional. Revisió independent del pont DEV, links antics i aprovació de Tractors.

2026-10-04T12:19:38.515Z: pla estabilitzat després de tres revisions independents en lectura. L’ordre humana actual substituïx D3 (Gestoria incrustada en Wiki); la barrera de desenvolupament es conserva.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

1. **Separació crítica:** entrada pròpia `/app/gestoria/*` mitjançant la plataforma d’apps existent, fora d’UniversalWorkspace. Wiki conserva documents, Consola i Tractors; no importa, munta ni redirigix cap component financer. Criteri final de Claude a les 15:06, acceptat per Codex: les consultes antigues de Gestoria es tracten com ítems desconeguts i mostren la portada de Wiki, sense obrir l’app ni propagar dades a una altra ruta. La Gestoria només s’obri per la ruta pròpia. La barrera DEV es conserva.
2. **Navegació dependent:** BarraLateral recorda només rutes fora del namespace /app, encara que l’app no estiga disponible durant la càrrega. Es manté l’efecte diferit cancel·lable, sense ids financers a la plataforma. RutaWikiDePoble és ara un wrapper lazy neutre de Wiki. El registrePlugins obri la ruta pròpia; l’enllaç d’aprovació de Tractors és absolut cap a Wiki. Revalidar les proves actualitzades de Claude, rutes directes de l’app i retorn. No es canvien càlculs, dades, backend ni emmagatzematge.
3. **Poliment autoritzat:** verificar les peces personals/IA que Claude ja ha deixat redones (300 px al perfil); conservar logos d’entitats i comunitats. Corregir només una expectativa de foto obsoleta si bloqueja la verificació d’aquesta superfície.
4. **Paquet:** aplicar core-empaquetat-wp, recompilar els índexs i les dues variants existents amb `SDP_RELEASE=1 SDP_VERSIO=1.0.3`; empaquetador canònic per instal·lació manual a `https://gentdelatorre.net/`. Productes exclusivament a `wordpress-plugin/builds/`, nova hora; el ZIP 11:51 no es lliura. Cap publicació ni instal·lació externa.
5. **Ampliació condicionada autoritzada:** reutilitzar BarraApp com a única Sidebar de Gestoria, amb els nou mòduls actuals i Aprendre. Declarar les entrades al manifest pur existent, sense importar dades financeres. Ampliar conjuntament la llista tancada d’icones i el seu resolutor amb les sis icones locals ja utilitzades. AppGestoria passa el mòdul de la ruta i mostrarRail=false a ShellGestoria; la mateixa closca conserva useTauler entre els nou mòduls, però tanca detall i avís en canviar de mòdul. La boina i PaginaApp continuen sent les existents; el retorn blau genèric recupera Wiki/Sóc de Poble. No es modifica ContenidorGestoria ni la seua signatura, càlculs, ports o dades. Verificar rutes directes, navegació i retorn en ample/compacte, memòria de lectura i exclusió DEV en producció. Regenerar ZIP 1.0.3 després del canvi validat.
6. **Tancament:** informe i estat amb evidència, verificar Olivera i tancament. L’ordre humana d’endreçar autoritza arxivar documents consumits amb la porta canònica; conservar documents vius/ajornats i les zones protegides.

Ampliació de codi limitada: manifest.js, AppGestoria.jsx i AppGestoria.test.jsx; ShellGestoria.jsx i la seua prova; iconesApp.js i NOMS_ICONES de manifestApp.js. Només corregir comentaris de CSS obsolets; la flex existent ja ocupa l’espai sense rail. No es crea cap altra graella ni component visual.

Abast de codi: `src/apps/gestoria/`, registre d’apps i proves de frontera, `src/sections/wiki-de-poble/WikiDePobleSection.jsx`, pont de consulta de Tractors, wrapper lleuger RutaWikiDePoble i import corresponent a App.jsx, BarraLateral i la prova de retorn, registrePlugins, i les seues proves dependents. Avatars: només peces existents revisades i prova de font IAIA. Calendari, accessibilitat general, arxius antics i altres deutes queden ajornats. Cap patró nou ni migració de plataforma.

Coordinació de l’ampliació: Codex arrel és l’únic escriptor de la UI indicada. route_review escriu només AppGestoria.test.jsx després de vincular este pla; gestoria_sidebar_review aporta revisió independent en lectura. El relleu queda a ESTAT.md; l’intent de missatge en Claude Desktop es va interrompre per interacció humana i no es considera enviat.

Coordinació: Claude ha aplicat en paral·lel l’entrada /app/gestoria; no s’escriu cap alternativa ni es revertix el seu canvi. Agent route_review verifica i completa només compatibilitat d’enllaços i proves assignades; Codex arrel revisa el diff, comprova navegador, compila i empaqueta quan les fonts queden estables. Els agents avatar_finish i release_103 aporten verificació sense editar.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Proves de regressió: URLs antigues de Panell/Aprendre/categoria mostren Wiki i cap Gestoria; Wiki ordinària intacta; tornada Gestoria→Wiki sense rail ni dades del mòdul anterior; aprovació de Tractors des de Gestoria; router en memòria sense tocar historial de l’amfitrió; absència de Gestoria als builds de producció. Proves focalitzades de perfil/avatar, router/plugin i privacitat. Navegador local en ruta pròpia i Wiki, a ample i compacte.

Build complet i variant WordPress; proves Node del connector/runtime/empaquetador/secrets. Verificar versió 1.0.3, entorn remote/no desenvolupament, modes de les dues variants, inventaris/SHA-256/CRC i carpeta arrel socdepoble-enxufe/ del ZIP. Només s’entrega el paquet construït després dels pegats.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Checkout compartit amb canvis de Claude: no revertir cap treball alié ni compilar durant edicions de codi. El paquet antic no té l’arrel canònica i no és vàlid per a esta entrega. El canal d’actualització no té clau pública: empaquetat manual sense inventar claus ni afirmar signatura. Les portes generals heretades poden continuar roges; es documenten, sense obrir els fronts ajornats. No llegir ni exposar .env, ni modificar les zones protegides de l’Escriptori.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
