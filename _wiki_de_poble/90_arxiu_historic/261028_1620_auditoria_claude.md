---
type: informe
status: esborrany
description: 'Execució de Claude Code dels Blocs A-G del Pla 261028_1526: estat real de cada fita al codi, canvis, proves i decisions pendents del Mestre.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4:daf92361-ebe8-4327-84ff-8e64ac6bc684
---
# Implementació i auditoria de Claude: deute tècnic d'OpenGraph, edició i xat (261028_1526)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4:daf92361-ebe8-4327-84ff-8e64ac6bc684 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-28T15:14:30.560Z |
| Modificació | 2026-10-28T19:05:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (orquestrador, Claude Code) i 61 subagents amb el mateix model en 11 workflows |
| Tokens consumits | 16,35 M de subagents, mesurats pels workflows; l'orquestrador no té comptador i no s'estima |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-28T15:14:30.560Z: esborrany creat; contingut i verificació pendents.
- 2026-10-28 16:20 i 17:35: dos relleus de progrés (canal viu) per a Codex i Gemini.
- 2026-10-28 19:05: reescriptura sencera amb l'execució dels Blocs A-G, la governança aplicada i la verificació.
- 2026-10-28 20:00: el Mestre aprova l'empremta de `legal` i mana el commit; commit `cd3b5b56c` i relleu d'ESTAT i LEDGER al dia.
- 2026-10-28 20:10: per ordre del Mestre, push a `fork/backup-notes-publish`; ESTAT i LEDGER al dia (executor `cbf1dba3`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**El pla tenia fites ja fetes i camins equivocats.** Un reconeixement de només lectura (11 agents) va contrastar cada fita amb el codi viu abans de picar res. Ja estaven fetes **P1-07** (`aprovatVetat` i l'escàner lineal, commits `5502c4669` i `d7aa77350`), **P1-32**, **P1-34**, la reforma del **Llibre d'Or** i el **`wikiManifest.js`**, que regenerat dona els mateixos bytes. Cinc camins del pla no existixen: la fitxa viva és a `src/sections/xat/components/`, el PageFrame a `src/components/universal/`, el tractor a `tooling/brain/`, el preflight de botigues a `scripts/botigues/` i la prova del Lector és `src/app/App.appsLocals.test.jsx`. Les **«3 assercions de vendor/ v1.2.1»** no tenen cap correspondència al codi: el paquet de WordPress és 1.1.9 i la seua suite passa 39 de 39.

**Mètode Gauntlet.** Cada bloc ha passat per una línia de cinc agents: **implementació**, **dues revisions adversarials** amb mirades diferents (privacitat, concurrència, proves per mutació, paritat, accessibilitat), **correcció** de les troballes confirmades i **verificació independent**. Les nou línies han acabat en PASS. Els fitxers de camins de governança es van preparar fora de l'arbre i han entrat en **una sola transacció de l'executor** amb lease Reflex.

### Decisions del Mestre preses en xat (261028)

1. **Leaflet 1.9.4** exacte, escrit amb l'executor.
2. OpenGraph dels documents de la Wiki per la **ruta de camí `/wikidepoble/<id>`** prerenderitzada; l'app la redirigix a `?item=` i el botó de compartir ja genera eixa forma.
3. **Lupa i píndoles** en una sola fila: queda derogada l'ordre del desplegable de filtres.
4. **P1-57**: el logotip de l'entitat pilot continua **amagat**; l'enquadrament no destructiu queda per a un torn amb migració.
5. Aprovades les **4 empremtes** noves del copy (projecte, disseny, anima i descarregues).
6. Versió canònica **`v1.0.0`** amb el build com a data de compilació.
7. **Purga del GPS** de les 8 fotos d'identitat del Mestre i de l'avatar de l'Ajuntament; les 8 fotos de patrimoni de la Torre **conserven** el GPS en llista blanca.
8. Precisió **exacta** per defecte per a la ubicació de les fotos de publicació.
9. Les tessel·les del mapa **apagades** fins a prémer «Vore mapa», el §21 de l'avís legal al dia i el botó amagat a l'app nativa.

### Estat de cada fita

| Fita | Abans del torn | Ara |
| --- | --- | --- |
| OG-7 | 10 fotos d'identitat amb GPS al repositori | **Purgades** sense tocar els píxels; guarda nova en precommit |
| P1-64 (política GPS) | Avatar i capçalera personal conservaven el GPS de sèrie | **Identitat neta** i amb avís; publicacions amb casella, precisió i índex |
| P1-61 Fase 2 | Cap head per ruta per a bots sense JS | **Prerender** de 111 rutes al build; Wiki per camí |
| P1-60 / P1-63 | 4 de 54 paràgrafs conformes | **62 de 62**; botó cap a la Wiki; empremtes aprovades |
| P1-55 | La `key` ja era al lloc bo, però el carregador fallit no es tornava a demanar | **Reintent** del carregador per comunitat |
| P1-58 | Calaix dins del cos | **Entre la barra taronja i l'H1**, ordre Capçalera, Avatar, Logotip |
| P1-57 | Ranura del pilot amagada | **Sense canvis**, per decisió del Mestre |
| P1-31 | Una lectura nativa en vol arribava a la persona següent | **Època de sessió** a JS i a Android |
| P1-32 / P1-34 | Fetes el 261026 | Verificades, sense canvis |
| P1-33 | Sense pressupost total de bytes | **60 MiB per compartició**; cap lectura sense termini |
| P1-36 | Files de 96 px ja fetes; filtres en desplegable | **Lupa i píndoles** |
| P1-37 | Marges amb l'escala crua | **Tokens** de botó, sense canviar cap píxel |
| P1-16 | Capçalera de taula indistingible (ΔE 1,00) | **ΔE2000 ≥ 5** en clar i fosc; taules de la Wiki amb regió, nom i focus |
| P1-35 | Cap versió a la Consola | **`v1.0.0 (build aammdd)`** i panell d'empaquetats |
| P1-07 | Ja feta | Verificada |
| P1-18 | Cos llegit sencer abans del límit | **Lector fitat** per bytes i termini fins al final del cos |
| P1-13 | C11-03 i C11-05 oberts | **Migració nova sense aplicar** |
| P1-22 | 24 claus absents; natiu i WordPress sense idioma | **Claus**, idioma del dispositiu, filtre de WordPress i DetallPrivacitat |
| P1-09 | Catàleg de reserva congelat a l'inici | **Seguix** `switch_to_locale` en totes dues direccions |
| P1-08 | El tractor no coneixia l'entrada nativa | **ENTRADES** al dia; sentinella de Facebook |
| P1-26 | censImatges ×2 i App.appsLocals rojos | **Verds** i hermètics |
| CL-06 / CL-07 | Preparats, sense aplicar | Guions del Mestre amb constants al dia |
| CL-08 | Cens de portes impossible (run-portes s'atura) | **Mode `--cens`** |
| P1-64 (mapa) | Iframe d'OSM d'un sol punt | **Mapa fotogràfic** amb Leaflet |
| P1-65 | Mandat de recerca | Secció d'I+D, més avall |

### Bloc A · OG-7, política GPS (P1-64) i OpenGraph Fase 2 (P1-61)

**Les fotos d'identitat ja no porten GPS.** Un escàner propi i el lector de les sentinelles coincidixen: de 386 imatges públiques, **18 portaven GPS**. Se n'han purgat **10**: les 8 del Mestre, incloses les dues de la samarreta (`08-javi-llinares-perfil-1024px`), i les 2 de l'avatar de l'Ajuntament. La purga **no torna a codificar**: el flux entròpic del JPEG i el tros VP8 del WebP són idèntics byte a byte, i l'ICC es conserva. Un fitxer nou, `src/config/fotosPubliques.senseGps.seguretat.test.js`, entra al precommit pel sufix i falla en 6 de 11 proves amb els bytes de HEAD. Les **8 de patrimoni** de la Torre conserven el GPS en la llista blanca `FOTOS_DE_PATRIMONI_AMB_GPS` («Mestre 261028»).

**Una pujada d'identitat sempre ix neta.** L'avatar de totes les menes i la **capçalera personal** ja no oferixen la casella i lleven el GPS. L'avís «🔒 Per la teua privacitat, s'han eliminat les dades GPS de la foto de perfil» només ix quan la foto **en portava de veres**: dir que s'ha eliminat el que no hi era seria una afirmació falsa. Les capçaleres d'organització i d'agent conserven la casella. Sense la prop nova, el diàleg pinta el mateix DOM que abans (Llei del Píxel).

**Les fotos de publicació guarden la ubicació amb consentiment.** Al **Hero**, amb la casella marcada i GPS, ixen les píndoles de precisió (exacta, 100 m, poble; **exacta per defecte**) i el fitxer arrodonix el GPS en el lloc, sense moure cap desplaçament del TIFF. Les **fotos del cos** pregunten el mateix amb un diàleg menut i desen la ubicació en atributs `data-*` del node, que no canvien el que es pinta. Les enganxades continuen netes. En publicar, `payload.fotos_geo` (24 com a màxim) i `payload.geolocalitzacio` alimenten el mapa, **sense cap migració**, amb sanejadors d'escriptura i de lectura. La revisió va trobar i tancar un **ReDoS** en la lectura de fonts del contingut i dues escriptures que podien solapar directoris del TIFF.

**Un bot sense JavaScript ja rep el head de cada pàgina.** `npm run build` acaba ara amb `build:social`, que prerenderitza **`dist/<ruta>/index.html`** per a 111 rutes i 8 àlies, amb `trailingSlash: false` a `firebase.json`. Prova de punta a punta en una còpia, amb un servidor que imita Firebase i l'agent de WhatsApp: la **samarreta** porta la foto de la xica, el **Llibre d'Or** la seua targeta (`og-llibre-d-or-1200x630.png`) i `/projecte` respon 200 sense redirecció (21 de 21 comprovacions). Un sol renderitzador serveix l'estàtic i l'adaptador d'Edge de Codex, que queda **adormit**. Al client, la clau de ruta (`src/config/rutaSocial.js`) inclou l'`item`: un head servit per al document A ja no congela el B, i cada document públic de la Wiki registra el seu SEO.

**Una desviació conscient, per a revisar.** Als fitxers de la forma de camí, `og:url` és **la pròpia adreça de camí**, no el `?item=`. Facebook seguix `og:url` i al `?item=` Firebase servix el head genèric de la llista; el canonical continua sent `?item=`. També s'ha afegit el guarda que Codex va trobar (C28-05 §6): cap imatge amb consulta o fragment passa al nucli d'Edge.

### Bloc B · Reforma editorial (P1-60 i P1-63)

**Els quatre textos complixen la regla de les negretes.** S'han aplicat els tres pegats de Codex (`copy-editorial`, `copy-anima`, `copy-tests`), i `node tooling/seo/check-editorial-copy.mjs` dona `valid: true`, **62 de 62** paràgrafs llargs amb 6–8 paraules destacades. `/projecte` acaba amb el botó primari cap a `/wikidepoble?item=el_projecte`. Els pegats trencaven **tres suites que Codex no havia passat** (`indexCerca.fundacionals`, `pageContent.roadmap` i `PublicacioDetall.sistema`); s'han adaptat sense afluixar-ne la intenció. Les **4 empremtes** de la frontissa són les aprovades pel Mestre: projecte `678e52f2…`, disseny `885021d3…`, anima `8bde895c…` i descarregues `5e3c1024…`. La de **legal** no s'ha aprovat (Límits).

**El nom del document de la Wiki és cosa de MarIA.** Fita 24 demana «El Projecte (Nucli i Arquitectura)» o «(Manifest Tècnic)» a `el_projecte.md`; el fitxer no és de Claude i la tria és del Mestre. La resta de la reforma de Gemini al Llibre d'Or ja era íntegra.

### Bloc C · Edició avançada (P1-58), pàgina viva (P1-55) i logotip del pilot (P1-57)

**La pàgina viva d'una comunitat es recupera.** La `key` ja era al lloc bo des de `e4c4e076c`: el que faltava era el carregador. React guarda el rebuig d'un `lazy()`, de manera que la comunitat B tornava a vore l'error de la A. El nou `lazyRouteRenovable` crea un `lazy` fresc en canviar de comunitat i **no fa bucle** en tornar a la mateixa. La prova antiga era un **verd fals**: llançava l'error dins del render d'un mòdul ja carregat. Ara falla el carregador de veres, i cinc mutants ho comproven.

**El calaix d'edició és on va manar el Mestre.** Una prop nova `despresAutoria` de PageFrame el pinta entre la barra taronja i l'H1, fora de l'índex del document, amb l'ordre Capçalera, Avatar i Logotip. Només el Perfil l'activa; Notes el conserva al lloc de sempre. Un comptador demostra que l'editor **no es remunta**. Queda per a Gemini la comprovació visual a 375, 820 i 1280 px: la barra taronja enganxosa pot tapar el calaix obert en fer scroll.

**P1-57 continua amagat.** Obrir la ranura del pilot amb el retallador actual hauria canviat el logotip de la marca al selector d'identitat, a la cerca i a les targetes del poble, contra l'ordre E 261007. L'enquadrament no destructiu necessita un **DTO versionat** i columnes noves: torn propi amb migració.

### Bloc D · Compartició nativa (P1-31 a P1-34)

**Una lectura en vol ja no canvia de persona.** El Llibre donava per fet P1-31, però una foto que encara s'estava llegint quan A tancava la sessió arribava sense propietari i B la podia prendre (ho van reproduir Codex i el reconeixement). Ara hi ha una **època de sessió**, separada de la `generacio` que també mou el «Descarta» del diàleg. JS la comprova després de cada espera. Android la desa amb `commit()`, posa la sessió al nom de cada còpia i no torna a anunciar les d'una sessió vella. P1-33 suma un **pressupost de 60 MiB** per compartició i cap lectura sense termini. El pas de `javac -Xlint:all` és net i els 25 mutants moren.

**P1-32 i P1-34 no s'han tocat.** Els noms del pla (reserva, confirma, allibera) invertirien el sentit dels del codi: `prenFitxerCompartit`, `alliberaFitxerCompartit` (confirma i esborra la còpia) i `tornaFitxerCompartit` (allibera i restituïx).

### Bloc E · Xat, botons, taules i versió (P1-36, P1-37, P1-16 i P1-35)

**La llista de converses té lupa i píndoles.** La lupa obri la cerca en la mateixa fila que ocupen les píndoles (Tot, No llegits, Preferits, Grups), amb el focus dins del camp i de tornada a la lupa en tancar. Amb la cerca oberta, **cap filtre amagat** retalla la llista. Les píndoles fan 50 px, igual que el camp, perquè la fila no salte. **Detall:** a 375 px les quatre no caben i la fila es desplaça horitzontalment. L'espècimen del catàleg s'ha alineat i la versió del catàleg està al dia.

**Botons i taules.** Tres tokens nous (`--sdp-boto-marge-inline`, `--sdp-boto-marge-block` i `--sdp-boto-separacio`) substituïxen l'escala crua **sense canviar cap valor**. La capçalera de `.sdp-taula-prosa` usa `pedra-300` en clar i `pedra-650` en fosc: **ΔE2000 de 5,19 i 8,69** contra la fila més pròxima, amb una prova de CIEDE2000 validada amb els parells de Sharma. Les taules Markdown de la Wiki són regions amb nom i focus. Un ganxo estret de DOMPurify **només** conserva `role` i `tabindex` en les caixes que fa el mateix `parseMarkdown`.

**La Consola diu la versió.** `src/config/versio.js` llig `package.json`, i el build afig la data (`aammdd`, Europe/Madrid): `v1.0.0 (build 261028)`. Una prova lliga la versió amb la d'Android i iOS. El panell «Empaquetats i llançament» (`/consola/empaquetats`) mostra cada plataforma, els noms dels artefactes de `_builds_de_poble` i l'**ordre exacta** per a publicar, sense cap botó que puge res. L'endpoint és de desenvolupament, només en localhost.

### Bloc F · Edge, dades, idiomes, WordPress i portes

**Serveis Edge.** `compte-apple` llig el cos **per bytes** (413 si passa de 4.096), manté el termini fins al final de la resposta de Supabase i dona 408 a un cos que no acaba mai. La revisió va trobar el mateix defecte a `purga-fitxers`, i s'hi ha aplicat el mateix remei. **P1-13**: la migració `2610281730_membres_concurrents_i_correu_public.sql` serialitza l'alta concurrent (C11-03) i publica el correu de contacte només amb opt-in, per una columna generada (C11-05). Ha passat a PGlite, però **només en una sessió**. Continua **NO aplicada**: l'aplica el Mestre.

**Idiomes i WordPress.** Les 24 claus que faltaven ja són als cinc diccionaris, amb el valencià idèntic al d'abans, i una prova nova falla si `t()` demana una clau absent. L'app nativa pren l'**idioma del dispositiu**, sempre per darrere de la tria explícita. WordPress té el filtre opcional `socdepoble_enxufe_idioma`, sense tocar el contracte. `DetallPrivacitat` passa per `t()` amb 49 claus. A WordPress 5.8–6.4, el catàleg de reserva **seguix `switch_to_locale`** en totes dues direccions. Els textos RGPD en castellà, anglés, basc i gallec necessiten **validació legal**.

**Portes.** El tractor Pedra Seca coneix l'entrada nativa i la de l'embed (LLEI_08 baixa de 53 a 45). La sentinella del **SDK de Facebook** vigila el projecte d'iOS i el connector social, també al preflight de botigues. `run-portes.mjs --cens` passa totes les portes sense aturar-se a la primera. `censImatges` i `App.appsLocals` són verds, i el segon ja no depén del `.env.local` de la màquina. CL-06 i CL-07 continuen sent del Mestre: s'han refrescat les constants caducades de `mestre_skill.sh` i `prepara_pla_executor.mjs`.

### Bloc G · Mapa Fotogràfic EXIF (P1-64)

**El Mur té un mapa de fotos de veres.** El nucli pur `src/sections/mur/mapaFotografic.js` fa la **distància Haversine**, l'agrupament **complete-link** calculat una sola vegada i tallat per llindar (`[Infinity, 100, 60, 30, 15, 6, 2, 0.8, 0.2, 0]` km), els tres nivells (grups, parades i **foto a foto des del zoom 16**) i l'estimació per la foto **més pròxima en el temps**, sense interpolar mai. Un oracle de força bruta coincidix en 400 casos. Una foto de França i les fonts de la Torre conviuen en el mateix mapa.

**El renderitzador és Leaflet, carregat a demanda.** El **verd** marca el GPS real de la foto i l'**ocre** la ubicació estimada, del poble o indicada per l'autor; els colors van per tokens. Les targetes s'arrosseguen sense moure el mapa, amb una línia discontínua (`4 5`) al seu punt i «Recol·locar grups». El fons de tessel·les **no demana res** fins que es prem «Vore mapa» (comprovat en Chrome sense xarxa), i l'atribució d'OSM sempre es veu. Si Leaflet falla, torna l'iframe de sempre. **Correcció de l'orquestrador:** les fotos pujades pels veïns (`sdp-media://`) es quedaven sense miniatura; ara les resol el port, com fa la portada, i mai es pinta la referència crua. El codi de la plantilla d'Emowe **no porta llicència**: s'han reimplementat les idees, sense copiar-ne res.

### I+D d'Emowe (P1-64 i P1-65)

Llegenda: **[E]** ve de fonts d'Emowe; **[I]** és inferència pròpia; **[V]** s'ha verificat al codi del Mas.

**[V] La Consola ja replica el «Mapa de mis agentes».** Té les **sis pestanyes** (`consolaPagines.js:39`), la **caixa opaca**, la **confiança** declarat, derivat o inferit, el **mode privacitat** i les quatre peces. Algunes propostes de Gemini 1614 (semàfor i caixes opaques) **ja estan fetes**. El que falta és el que Emowe ha publicat després de setembre: `.agents/cervells/` només té un `placeholder.md`, i hi ha **torns oberts caducats** de fins a 84 h.

**[E] Què fa Emowe.** Marcos fa d'un vault d'Obsidian un **sistema operatiu d'agents**: obrers efímers agafen **targetes** d'un kanban de carpetes, un **llançador determinista** reparteix la faena, els **candaus** actuen abans de cada acció i els informes es fan **sense xarxa**. Articles llegits del seu RSS:

- [Un sistema de agentes se juzga por lo que se rompe cuando no estás](https://emowe.com/inteligencia-artificial/sistema-de-agentes-se-juzga-por-lo-que-se-rompe/) (04-10): el vigilant no pot penjar del mateix planificador.
- [Un segundo cerebro no se mide en tokens](https://emowe.com/inteligencia-artificial/un-segundo-cerebro-no-se-mide-en-tokens/) (18-10): cada fallada, una prova o una regla.
- [De la demo que sale bien al agente que aguanta encendido](https://emowe.com/inteligencia-artificial/de-la-demo-que-sale-bien-al-agente-que-aguanta-encendido/) (20-08): tota degradació s'avisa.
- [Después de aprender Obsidian: meterle agentes que trabajen solos](https://emowe.com/inteligencia-artificial/despues-de-aprender-obsidian-meterle-agentes-que-trabajen-solos/) (20-09): perfil, skill, targeta i candau.
- [Agentes atómicos](https://emowe.com/inteligencia-artificial/agentes-atomicos/) (27-08): la targeta demana, el perfil decidix.
- [Lo que no le delego a mis agentes](https://emowe.com/inteligencia-artificial/lo-que-no-le-delego-a-mis-agentes/) (14-08): l'irreversible de judici és humà.
- [Las fotos de tu viaje ya saben dónde estuviste](https://emowe.com/inteligencia-artificial/las-fotos-de-tu-viaje-ya-saben-donde-estuviste/) (14-10): verd per al GPS, ocre per a l'estimada.
- Estàndard [Atomic Agents v1.0](https://gist.github.com/emowe/b3563cbebaf060c998af829ab814dc30): perfil amb `handles`, `refuses`, `guarantees` i `harness`.

**Propostes concretes** (Gov = camí de govern amb lease):

| # | Proposta | On | Esforç · Gov |
| --- | --- | --- | --- |
| C1 | Avís de **torn tancat sense rebut** (18 de 387) | `construeixMapa.js` i prova | S · no |
| C2 | **Vigilant fora de launchd**: el SessionStart avisa «launchd mut des de X h» | `context-local.mjs` | S · sí |
| C3 | **Batec només en èxit**, que el Mapa llig com a declarat | `.agents/runtime/batec/` | M · sí |
| C4 | Mètrica de **torns sense candau** (hooks apagats des de la carpeta mare) | `fonts-vigilancia.mjs` | M · sí |
| C5 | `attempts` i `blocked{motiu}` al torn: separar el bloquejat de l'abandonat | esquema de torn | M · sí |
| S1 | **Perfil declarat** per actor (`accepta`, `refusa`, `escriu`, `arnes`) i comprovació `ownedPaths ⊆ escriu` | `consell.json`, tancament | M · sí, **decisió del Mestre** |
| S2 | Detectors d'Emowe: horari en prosa sense llançador, skill duplicada, sense tocar >90 dies | Mapa de la Consola | S · parcial |
| S3 | Avís de **lliçó sense prova** a «Lliçons del Mestre» | Mapa de la Consola | S · parcial |
| M1 | **Origen i inferència** separats (exif, manual, estimada, poble, i incertesa alta) | `geolocalitzacio.js` | S · no |
| M2 | **Privacitat invertida**: agrupar sobre coordenades ja arrodonides | nucli del mapa | S · no |

**[E] Què no copiar.** Cap instal·lador desatès (`instalar.sh` porta `uv` d'internet). Cap recorregut de `~/.claude` ni `~/.codex`: el Mas llig **només fonts declarades**. Cap crida inferida de **verbs en prosa**. El `json.dumps` dins de `<script>` i l'`innerHTML` amb noms de lloc: Codex hi va provar una **injecció** (C28-11). L'entelat amb CSS deixa les dades al DOM; la nostra substitució és més segura.

**Altres referents verificats** (28-10): [Anthropic · Building effective agents](https://www.anthropic.com/research/building-effective-agents) (fluxos de codi davant d'agents, la nostra **separació determinista i cognitiva**), [Simon Willison · llm](https://github.com/simonw/llm) (eines CLI menudes amb **registre local**), [Hamel Husain · Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) (avaluacions de domini, base de S3), [Steph Ango · File over app](https://stephango.com/file-over-app) (estat en **fitxers durables**), [Immich](https://github.com/immich-app/immich) (fotos autoallotjades amb **mapa global**) i [mapbox/supercluster](https://github.com/mapbox/supercluster) (**índex** precalculat per zoom). [I] L'Engram que cita Emowe quadra amb Gentleman-Programming/engram, però no s'ha confirmat que siga el mateix projecte.

### Contrast amb Codex i Gemini

**Codex** (`261028_1611`, tall de 16:41) va reauditar els candidats a mesura que aterraven i coincidix en P1-55, P1-58 i el sostre d'Android. Els seus residus estan atesos així: C28-01 (GPS), purgat; C28-02 (fuga en vol), tancat amb l'època de sessió, encara sense `AbortSignal` a `llegix(url)`; C28-03 (Apple), tancat; C28-05 (OpenGraph), integrat amb la marca `data-sdp-ssr`, la clau amb `item` i el guarda de `?token=`; C28-07 (Android), parcial, perquè `getType` i la consulta del nom continuen fora del termini (canvi de disseny); i C28-10, mapa fet. **Gemini** (`261028_1614`, tall de 16:18) va auditar abans que aterrara el codi. Proposava una carpeta nova `src/components/universal/mapa/`, que **no s'ha creat**: el mapa viu a `src/sections/mur/`. Les seues propostes E2 i E3 ja existien a la Consola.

### Retroalimentació per a la plantilla prompt_local

**Un prompt rector hauria de nàixer d'un reconeixement.** Este pla portava fites fetes, cinc camins inexistents i una prova inexistent; caldria un pas que verifique cada fitxer i cada estat abans d'emetre'l. A més, el SHA del pla citat al prompt (`35119bec…`) ja no és el del fitxer (`ac9d4f71…`), perquè el Bloc G es va afegir després, i el Llibre Mestre usa **P1-64** per a dues fites diferents (Fita 28 i el mapa) i **P1-60 / P1-63** per a una tercera.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| Línia base, abans del torn | `test:precommit` 0: 3.365 Vitest i 262 Node, 42,5 s amb càrrega |
| Bloc D (compartició) | 12 fitxers, 223 proves; 25 de 25 mutants; `javac -Xlint:all` net |
| Edició (P1-55 i P1-58) | 22 fitxers, 412 proves, i 36 fitxers veïns, 606; 9 mutants |
| Copy (P1-60) | 50 fitxers, 705 proves; verificador editorial `valid: true`, 62 de 62 |
| Xat (P1-36) | 136 fitxers, 1.845 proves |
| Tokens, taules i versió | 102 fitxers, 1.736 proves; 41 mutants |
| Edge i P1-13 | 128 fitxers, 2.511 proves; 162 de migració; 28 mutants; PGlite 24 de 24, una sola sessió |
| Idiomes i WordPress | 68 fitxers, 1.410 proves; WordPress 22, 39 i 22 amb PHP 8.4.25 real |
| Portes | precommit 26,9 s i 28,3 s; Node 22 de 24 en còpia (2 roges de la còpia) |
| OpenGraph | 62 fitxers, 998 proves; Node 57 de 57; build real i prerender en còpia, 21 de 21 peticions HTTP |
| Mapa | 76 fitxers, 1.011 proves; 400 casos contra força bruta; Chrome sense xarxa |
| EXIF | 242 fitxers, 3.819 proves, i 349 fitxers veïns, 5.375; guarda 11 de 11, i 6 de 11 roges amb HEAD |
| Transacció de governança | executor `3c28d6a4`, 22 fitxers, segell de skills igual (`4ee3e545`), lease `ca9ffc98` consumida |
| Node després de l'executor | tooling/seo 57, pedra-debt 7, run-portes-cens 5, node-suite-policy 9, convertir-a-webp 6, migracions 162, WordPress 22, 39 i 22: tot verd |
| Botigues | 11 de 12: la roja és heretada (camí de laboratori desaparegut el 261026) |
| ESLint de tot el repositori | 0 problemes (`src`, `tooling`, `scripts` i `tests`) |
| Frontissa de contingut | 15 de 15, amb `legal` aprovada pel Mestre (executor `a685ef91`) |
| Olivera | 0 |
| design_guard | 10 troballes noves, totes en fitxers que este torn no ha tocat o que ja les portaven a HEAD; la del torn (una prova de la Wiki) s'ha corregit |
| Tractor Pedra Seca | Roig per deute heretat amb els mateixos comptes que HEAD; LLEI_08 baixa de 53 a 45 |
| Vitest sencer, després de l'executor | 1.356 fitxers i 23.379 proves verdes, 101 omeses, 513 s; **1 roja heretada**: `laParroquia.test.js` llig un fitxer de laboratori que es va traslladar al satèl·lit el 261026 |
| test:precommit final | **exit 0**: 181 fitxers, 3.508 Vitest i 262 Node, **24,3 s**, cap error d'ESLint |
| Relleu a ESTAT i LEDGER | executor `b9b06dd6`, lease `069a50f4` consumida; la firma del LEDGER val per al cos nou |
| `tancament.mjs --check` del torn | **vàlid**: olivera, plantilles, autoritat, ledger, segell, skills, wiki, documental-tests i scc a 0; 226 camins propis declarats. El torn queda obert (`planned`) per a les decisions del Mestre |

Les bateries de cada línia se solapen i no se sumen. Els últims retocs (miniatures del mapa, `index` del detall, espècimen i prova de la Wiki) van aterrar mentre corria la suite sencera; s'han verificat amb les suites dirigides (Mur 29 fitxers i 345 proves; detall i hooks 40 i 559; disseny 30 i 443) i amb el precommit final.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

**El codi està en commit i pujat a `fork/backup-notes-publish` (`3dbdecb16..cd3b5b56c`), però no desplegat.** Per ordre del Mestre en xat, l'empremta de `legal` (`e3c33ae6…`, 45.155 caràcters d'HTML) està aprovada amb l'executor (`a685ef91`), i la frontissa dona 15 de 15. El commit **`cd3b5b56c`** porta 223 fitxers de codi, fet per índex temporal i amb `--no-verify` per la seua ordre. Abans es va assajar l'arbre exacte `2cc3812b` en una còpia: precommit i ESLint verds, i la prova d'iOS 24 de 24 dins d'un repositori. Queden fora, per al commit documental, els documents de l'Escriptori, ESTAT, LEDGER i les evidències de `.agents/`. **La migració P1-13 no està aplicada.** El build social només s'ha provat en una còpia.

**Decisions pendents del Mestre:**

1. ~~Empremta de `legal`~~: **aprovada** (261028).
2. ~~Commit i push del torn~~: **fets**, `cd3b5b56c` a `fork/backup-notes-publish`.
3. **Desplegament de Firebase** amb `trailingSlash: false`: abans, un canal de previsualització o l'emulador (la CLI de Firebase no està instal·lada). Comprovar també el *Sharing Debugger* de Facebook.
4. **`og:url` de camí** en els documents de la Wiki (desviació explicada al Bloc A).
5. **7 imatges socials de més de 600 KB**: derivades JPEG de 1200 × 630 sense EXIF o deixar-les.
6. **OG7-G**: refer `dist`, natiu i WordPress, i escanejar Storage amb el rol de servei (avatars pujats des del 261016 amb la casella marcada de sèrie). L'historial de git conserva els originals; reescriure'l no es recomana.
7. **Migració P1-13**: la prova de dues sessions en PostgreSQL de veres i l'aplicació.
8. **P1-31**: una compartició sense enviar que sobreviu a una sessió morta fora de l'app, i l'A → ningú → A, que descarta una compartició en vol. Les dues toquen la regla del Gauntlet 261026.
9. **P1-33**: confirmar els 60 MiB i si cal un arnés Robolectric (canvi de `build.gradle`).
10. **P1-57** sencer: DTO d'enquadrament, avatar d'entitat i migració.
11. **Idiomes**: validació legal dels textos RGPD, i si el filtre de WordPress mereix un camp als ajustos.
12. **CL-06 i CL-07**: `mestre_higiene.sh --aplica` i `mestre_skill.sh --aplica`, ja amb les constants al dia. **CL-08**: el *rebaseline* de `.pedra-seca-deute.json` i deixar de seguir `supabase/.temp/.../docker.env`.
13. **Mapa**: l'etiqueta del commutador, les fotos del cos amb només data i l'ordre amb zones horàries barrejades.
14. **P1-37**: els buits de 8 px dels diàlegs, que passarien a 12 px. **P1-26**: 4 parelles de fotos idèntiques al cens.
15. **Llibre Mestre**: renumerar una de les dues fites P1-64 i el P1-60 / P1-63 de la Consola (MarIA).

**Deute residual conegut:** `llegix(url)` sense `AbortSignal` al receptor natiu; a Android, `getType` i la consulta del nom fora del termini (Binder); el comptador de sessió d'iOS; el missatge del diàleg de compartir; el GPS dins del MakerNote d'algunes càmeres; i, a la Consola, la detecció de canvis de zona horària del mapa. Cap d'ells bloqueja.

**Recursos.** No queda cap cron, monitor ni servidor engegat per Claude. El dev server compartit de :3340 no s'ha tocat. La carpeta `~` que va deixar un Chrome de prova a l'arrel s'ha mogut al scratch de la sessió.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261028_1526_pla_implementacio_deute_tecnic_opengraph_edicio_i_xat]]
- [[261028_1526_prompt_deute_tecnic_opengraph_edicio_i_xat]]
- [[261028_1611_auditoria_codex]]
- [[261028_1614_auditoria_gemini]]
- [[261027_0730_solucio_opengraph_i_copy_codex]]
- [[261027_0730_reforma_editorial_gemini]]
