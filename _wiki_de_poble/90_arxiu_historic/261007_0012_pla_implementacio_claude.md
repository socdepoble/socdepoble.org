---
type: document
status: esborrany
description: Pla general d'implementació per tancar les incidències actuals i preparar la gestoria offline
tags:
  - implementacio
visibility: private
reflex: sdp:torn_c9d16d29-50a7-4d5a-a2d3-1fc44192a7b3:d8395088-27ab-4e44-903b-a73c61bd2939
---
# Pla per al Relleu de Claude (Gestoria i Reparacions)

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c9d16d29-50a7-4d5a-a2d3-1fc44192a7b3:d8395088-27ab-4e44-903b-a73c61bd2939 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T22:11:34.969Z |
| Modificació | 2026-10-07T09:00:00.000Z |
| Propietari | agent-local (Claude) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) |
| Tokens consumits | No mesurat: el client no l'exposa |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-06T22:11:34.969Z: esborrany creat; contingut i verificació pendents.
2026-10-07T03:55 (local): Claude l'omple amb el pla del pròxim sprint. Hi recull les ordres de futur que el Mestre va donar durant la marató 261007. La feina feta i verificada d'esta nit és a [[261007_0030_auditoria_claude]].
2026-10-07T05:15 (local): Claude afig el §0, Compartir i Traduir (ordre de MarIA i el Mestre), i ho deduplica amb la nota del §4.
2026-10-07T11:00 (local): Claude marca fets els apartats §0.5, §0.6 i §0.7, amb la pregunta R1 oberta. Deixa l'autorització explícita perquè MarIA empaquete per a WordPress (`core-empaquetat-wp`), amb els passos al capdamunt de «Canvis proposats».

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Tancament de la marató 261007 i autorització d'empaquetat (per a MarIA)

**Estat:** fetes, revisades i provades al disc, sense commit:
- la segona onada;
- les ordres de la represa (§0.5, §0.6 i §0.7).

Evidència a [[261007_0030_auditoria_claude]] (F11, F13 i Verificació). La suite de `src` és verda i el `node --test` del connector i de la cadena de seguretat no té cap roja. Els commits són a F14 i els fa el Mestre. El relleu d'ESTAT i del LEDGER és a F15.

**Autorització explícita.** Claude, per encàrrec del Mestre transmés per MarIA (261007), autoritza MarIA a empaquetar l'aplicació per a WordPress des del disc amb la seua skill `core-empaquetat-wp`. No cal cap altra confirmació de Claude. Passos:

1. **Les portes que Claude no ha pogut executar**, perquè el hook les bloqueja. Totes dues han d'eixir amb 0; si una falla, MarIA para i ho anota:
   - `node tooling/gates/frontissa-contingut.mjs`;
   - `npm run porta`.
2. **La versió: `1.0.5`**, la que ja porta la capçalera de `wordpress-plugin/socdepoble-enxufe.php`.
   - Hui `builds/stable.json` apunta a la 1.0.3. Es va construir el 06-10 a les 23:57, després de la 1.0.4.
   - Un lloc amb la 1.0.4 instal·lada no la veu com a actualització. La 1.0.5 ho arregla.
3. **El build de les dues variants.** Les `VITE_*` de producció són a `.env.production.local`, i no es lligen ni s'imprimixen.
   - Ordres: `SDP_RELEASE=1 SDP_VERSIO=1.0.5 npm run build:wp` i, després, `SDP_RELEASE=1 SDP_VERSIO=1.0.5 npm run build:wp:directori`.
   - Si la skill fa el `npm run build` sencer, el `prebuild` recompila la Wiki (`compile-wiki-to-app.mjs`) i pot canviar fitxers de `src/data`. En eixe cas, cal tornar a passar la suite.
4. **L'empaquetat**, amb `node wordpress-plugin/eines/empaqueta.mjs` (les opcions són a `--ajuda`). L'eina:
   - posa el nom canònic, `socdepoble-enxufe-v1.0.5-aammdd_hhmm.zip`, amb l'hora del build en Europe/Madrid;
   - deixa el ZIP a `wordpress-plugin/builds/` i rebutja qualsevol altra carpeta;
   - rebutja un build que apunte a un node de desenvolupament, com el `localhost:54321` de `.env.local`;
   - rebutja un paquet amb una clau DeepL.
   - **La signatura:** cal `--clau` amb la clau Ed25519 de fora del repositori. Amb `--prova` ix sense signatura: servix per a instal·lar a mà, però cap lloc amb clau no l'accepta com a actualització.
5. **Comprovacions del ZIP:**
   - **La mida:** els anteriors fan uns 130 MB. Si el nou en fa molt més, cal parar.
   - **La variant `directori/`** no cap al límit de 10 MB de WordPress.org, i l'eina ho avisa. No s'envia al directori.
   - **WordPress Studio:** s'instal·la i s'obrin `/mur`, `/legal`, `/wikidepoble`, `/disseny` i `/xat`, amb la consola neta.
6. **La traçabilitat.** El ZIP ix d'un arbre brut sobre `67fe5f08`, i cal anotar-ho a l'acta amb el `git status --short`. Per a la release pública, Claude recomana esperar els quatre commits de F14 i construir des d'un checkout net i etiquetat (M4-02, F12).
7. **L'ancoratge.** El ZIP es registra en una acta o a l'índex de l'Escriptori, amb el nom, la mida i el sha256 que imprimix l'eina.
   - **Atenció:** la skill `core-empaquetat-wp` diu `01_produccio/builds/` a §3 i §4, i és un error.
   - La destinació és `wordpress-plugin/builds/`, com diuen el seu §2 i l'eina. `01_produccio/` és zona humana.

---

Ordres del Mestre del 261007 per al **pròxim sprint**. L'ordre és el de prioritat proposada. Els apartats §0.5, §0.6 i §0.7 ja són fets, i la resta encara no s'ha programat.

### 0. Barra blava de la UniversalPage (propera sessió, prioritat alta)

1. **Compartir, regressió:** ha d'obrir el menú natiu del sistema amb la Web Share API (`navigator.share()`: AirDrop, Telegram, WhatsApp, Android Share), i el porta-retalls només com a alternativa d'emergència.
   - **Punt de partida:** `compartix()` (`src/components/PedraSeca/hooks/useAccions.js:147-163`) ja prova `navigator.share` primer i el porta-retalls després. La regressió és en algun camí concret, i cal reproduir-la abans de tocar res:
     - un `onShare` propi que salte `compartix`;
     - l'iframe del connector de WordPress sense `allow="web-share"` (la Permissions Policy bloqueja l'API dins d'iframes);
     - un navegador d'escriptori sense l'API;
     - una crida fora del gest d'usuari (cal «transient activation»).
   - **Verificació:** prova del camí natiu, de l'AbortError (tancar el menú no és cap error) i de la caiguda al porta-retalls; prova real en un mòbil.
2. **Traduir:** el Mestre ha lliurat la clau de l'API el 261007.
   - **Implementació:** la clau NO pot anar mai al paquet del client. Cal un servei del mateix origen que complisca el contracte de `src/data/traductor.js:4-14`: el client només accepta el mateix origen, i el servidor ha de tornar 503 sense clau i 403 per a un altre origen, com fa `wordpress-plugin/includes/traduccio.php`. Pot ser una funció del hosting o del Supabase de SdP, amb la clau com a secret del servidor.
   - **Model B:** el servei és una peça nova de backend, i canviar o afegir backend demana una ADR.
   - **Verificació:**
     - el menú de llengües s'obri a socdepoble.org;
     - una pàgina es tradueix;
     - la clau no apareix al `dist/` (cerca al paquet);
     - el 403 per a un altre origen.

### 0.5. La Targeta Viva i Actualització del Catàleg de Disseny (fet el 261007, sense commit)

**Estat (Claude, 261007):** fet i provat al disc. Evidència a [[261007_0030_auditoria_claude]] (F11 i F13).
- **Copyright:** una sola línia a totes les targetes. És `.sp-card-copyright__enllac` amb `white-space: nowrap`, `overflow: hidden` i `text-overflow: ellipsis`, que funciona igual en Safari 16 sense `-webkit-box`. El nom accessible conserva el text sencer.
- **Targeta sincronitzada:** amb el nom canviat per ordre de MarIA, perquè no xocara amb la `TargetaViva` de les llistes.
  - **Ganxo:** `useTargetaSincronitzada` (`richText/extensions/targetes/TargetesSincronitzadesContext.js`), en lectura (`CosAmbTargetes.jsx`) i a l'editor (`TargetaIncrustadaNodeView.jsx`).
  - **Origen de les dades:** el proveïdor `src/sections/detail/SincronitzacioTargetes.jsx`. Una pàgina pren les dades del seu `PAGE_COPY` amb `propsDeTargetaDeLaPagina` (`src/components/universal/targetaDeLaPagina.js`), amb les mateixes regles d'autor que `PageFrame`; un element de secció, de `paginaDElement`. La instantània HTML només és el pla B.
  - **On es munta:** a les quatre seccions lazy que pinten cossos amb targetes (Text, Notes, Detall d'element i Perfil públic). A `App.jsx` no, perquè hauria carregat l'arbre de la UniversalCard al paquet inicial; una prova ho fixa.
- **Catàleg:** `EspecimenUniversalCard` mostra targetes de pàgina de veritat (l'acció gran, el copyright d'una línia i els drets) i els emojis XL al quadrat. `VERSIO_CATALEG` està al dia.

**Ordre del Mestre (261007_0530):** Les targetes incrustades s'estan quedant desfasades perquè només lligen la instantània HTML, i el Catàleg de Disseny (Pàgina de Disseny) té exemples antics (ex. copyright a dos línies sense l'enllaç de CC BY-NC-SA).

1. **Truncament del copyright a 1 línia:** A `src/css/components.css`, la classe `.sp-card-copyright` ha d'ocupar exclusivament una línia (`-webkit-line-clamp: 1`).
2. **Sincronització de Targetes Incrustades (Targeta Viva):** Crea un hook (p. ex. `useTargetaSincronitzada`) perquè les targetes de `tipus === 'pagina'` (tant en lectura a `CosAmbTargetes.jsx` com a l'editor a `TargetaIncrustadaNodeView.jsx`) es sincronitzen amb les dades fresques de `PAGE_COPY`. Han d'agafar la `image`, `title`, `subtitle`, `lead`, `labels`, `date`, l'avatar de Sóc de Poble i el lloc "La Torre de les Maçanes", actuant exactament com la UniversalCard autèntica del Mur. No han de ser "targetes inventades".
3. **Revisió de la Pàgina de Disseny:** L'espècimen `EspecimenUniversalCard.jsx` (i qualsevol altra pàgina del catàleg afectada) s'ha d'actualitzar. Utilitza les skills de disseny (`sdp-pedra-seca`) per posar al dia els exemples de la targeta perquè reflectisquen els canvis recents (copyright correcte, truncaments, etc.) i documentar qualsevol aspecte nou no registrat.

### 0.6. Assignació directa d'Emojis XL a les pàgines (fet el 261007, sense commit)

**Estat (Claude, 261007):** fet i provat al disc.
- **El botó:** cada targeta de l'espècimen Emojis XL (`EspecimenEmojisXL.jsx`) porta el botó blau «Assignar».
- **La pantalla:** obri una pantalla completa, no un menú flotant: `AssignacioEmoji.jsx`, a la manera de «Reenviar a…» de WhatsApp.
  - Agrupa els destins en quatre grups: Notes personals, Wiki de Poble, Disseny i Pàgines de Sóc de Poble.
  - Té cerca, i les funcions pures dels destins són a `destinsEmoji.js`.
- **Límit honest:** el `PAGE_COPY`, el manifest del catàleg i la Wiki compilada viatgen dins del paquet, i el navegador no els pot reescriure.
  - **Notes:** l'assignació és real, pel canal del Bloc (`setLocalNoteField`, camp `icon`).
  - **Pàgines de codi:** són files inertes. En prémer-les, diuen que el seu emoji es canvia amb un commit, i no fingixen cap escriptura.
  - **Decisió del Mestre:** inocular de veres al `PAGE_COPY` demana un canal d'escriptura (Supabase o un commit assistit). Està a F12 de l'auditoria.

**Ordre del Mestre:** El catàleg d'Emojis XL (secció de Disseny) no ha de ser només un aparador de copiar i enganxar, sinó una eina activa (un *picker*).
- Dins de la targeta de cada emoji, s'ha d'afegir un botó d'acció (p. ex., un botó blau primari amb l'etiqueta "Afegir" o "Assignar").
- Aquest botó obrirà un diàleg, un menú o una nova pàgina que pregunte: **"A quina pàgina vols assignar aquest emoji?"** (amb accés a la Wiki, Disseny o el bloc de notes personal).
- Aquesta funcionalitat permetrà inocular l'emoji directament com a `emoticona` en el `PAGE_COPY` de la pàgina escollida, sense obligar l'usuari a navegar, obrir la pàgina i usar la botonera d'edició.

### 0.7. Emojis a l'Índex de la Wiki (Carpetes i Arrel) (fet el 261007, sense commit, amb una pregunta oberta)

**Estat (Claude, 261007):** fet, revisat i provat al disc i al navegador.
- **Arbre:** cada carpeta i subcarpeta porta un emoji propi i distint (`ICONES_CARPETES_WIKI` i `glifDeCarpetaWiki` a `src/sections/wiki-de-poble/iconesWiki.js`).
  - SER 🌱, SABER 🦉, ACTUAR 🔨.
  - Consola termodinàmica 🌡️, Architecture 📐, Còdex humà 💓, Obsidian plugins 💎, Protocols tècnics 🔬, Plantilles 📋.
  - Maquinària de la IAIA 🎛️.
  - Una carpeta nova del manifest sense entrada porta la carpeta de Lucide, sense petar.
- **Portada:** «Wiki de Poble» porta 📖 a l'arbre i a la llista. En obrir-la, la imatge de capçalera continua igual.
- **Mides, mesurades al navegador:** a l'arbre, 20 px, com la icona germana (NavGlyph, cap XL); a la llista de fitxes, XL (66 px).
- **Revisió adversarial:** de cinc troballes, Claude n'ha corregit tres.
  - **R3:** comentaris que encara deien «Lucide».
  - **R4:** una plantilla nova sense emoji propi ja no repetix el 📋 de la seua carpeta, i una prova ho vigila.
  - **R5:** 🫀 (Unicode 13) passa a 💓 (Unicode 6), perquè Windows 10 no té la font.
- **Les altres dues troballes:**
  - **R2:** la fitxa de la portada mostra 📖 i no la miniatura. És la lectura literal de l'ordre: l'emoji «a la llista» i la imatge en obrir-la.
  - **R1:** és la pregunta oberta d'ací baix.
- **Proves:** les suites de la Wiki, del catàleg i del Workspace, 59 fitxers i 719 proves en verd.

**Pregunta oberta per al Mestre (R1), «a l'interior del document, els emojis SÍ seran XL».**
- **Què està fet:** s'ha aplicat la lectura que nomena la classe de l'ordre, `.sp-card-calendar-badge__emoji`. És el quadrat XL de les targetes que viuen dins d'un document.
- **Què no està fet:** obrir un document de la Wiki no pinta cap emoji. Cal triar entre dues opcions:
  - **(a)** la cel·la de la barra taronja (`topBarData.emoticona`): ja existix, però fa 28 px i el seu contracte vol el camp cru del document;
  - **(b)** un emoji XL nou a la capçalera del document, que és un redisseny i demana pla.

**Ordre del Mestre:** La llista de navegació lateral de la Wiki (`FolderNavNode.jsx` o similar) resulta massa repetitiva amb la mateixa icona de carpeta de sistema (Lucide) per a tots els apartats.
- Cal dotar **cada carpeta i subcarpeta** de la Wiki (Saber, Actuar, Plantilles, Consola, etc.) d'un emoji propi i semàntic. Aquests elements, tot i ser "fixes/de sistema", guanyaran pes visual i facilitaran el reconeixement ràpid.
- La pàgina arrel de la Wiki ("Wiki de Poble") també ha de tindre el seu propi emoji a la llista (sense perdre la seua imatge hero `image` quan s'obri el document).
- **Atenció a les Mides:**
  - **A la primera columna (l'arbre lateral):** Els emojis NO són XL. Han de tindre la mateixa mida menuda que els actuals icones de carpeta de Lucide (16-20px), respectant la jerarquia de l'arbre.
  - **A la segona columna (llistes de targetes) i a l'interior del document:** Els emojis SÍ seran XL (classe `.sp-card-calendar-badge__emoji` o equivalent).

### 1. Menú de pastilles públic únic (`PublicNavPills`) i pàgina del Mapa

**Ordre:** unificar el menú de pastilles del Mur. La regla D.R.Y. és estricta: **cap menú duplicat**.

- **Hui:** `MurSection.jsx:145-166` pinta un `PillToggle` («Filtres del mur») amb les pastilles Mostrar tot, Mercat, Calendari i Mapa. La pastilla Mapa obri un iframe dins del mateix Mur (`isMapOpen`, `buildMapEmbedUrl`). Mercat i Calendari no tenen eixe menú.
- **Proposta:**
  1. Un component compartit, `PublicNavPills`, amb les pastilles **Mostrar tot, Sóc de Poble, Mercat, Calendari i Mapa**. Ha de ser una peça de Pedra Seca que embolcalle el `PillToggle` existent, no un menú nou. Les pastilles són **navegació entre pàgines**, no filtres locals: cada una porta a la seua ruta (`/mur`, el filtre «Sóc de Poble» del Mur, `/mercat`, `/calendari` i `/mapa`), i la ruta activa encén la seua pastilla.
  2. El mateix component, importat **idèntic** a `MurSection`, `MercatSection`, `CalendariSection` i `MapaSection`.
  3. **`MapaSection`**, una secció pròpia a la ruta **`/mapa`**. Rep el mapa que avui és un iframe dins del Mur (`buildMapEmbedUrl`), i el Mur el deixa d'obrir. Ha d'entrar a `SECTIONS` com les altres, amb el `kind` que toque, i caldrà decidir si va dins de «Sistema» a la barra lateral (T5).
  4. **Pastilla nova «Sóc de Poble»**: és un filtre exclusiu perquè la persona llija només la línia editorial oficial, és a dir, les publicacions i les pàgines que signa l'entitat Sóc de Poble (les de sistema, amb l'autor per defecte). Hi entren totes les col·leccions del Mur, no sols les pàgines. Cal fixar on viu el filtre: una consulta del Mur (p. ex. `/mur?autor=socdepoble`) o una ruta pròpia. El criteri ha de ser l'autoria real de la targeta (la de la boina), no una etiqueta.
- **Abans de picar codi:** decidir el `kind` de `/mapa`, la seua posició a la barra i el destí exacte de «Sóc de Poble».

### 2. Fase de poliment responsive (abans del llançament oficial)

- **Mòbil:**
  - **Barres blava i taronja de les pàgines universals:** auto-hide en fer scroll (s'amaguen en baixar i tornen en pujar), primer amb un estudi amb mesures.
  - **Barra negra:** no s'amaga mai a les pàgines universals.
  - **Xat:** el mode immersiu ja està fet (`ed761b5a`).
- **Tauleta (iPad):**
  - **Barra lateral d'opcions (CONTROL):** sempre visible al costat, com WhatsApp Desktop. Avui és un calaix fins a 1023 px (`AMPLE_MAXIM_COMPACTE` a `App.jsx` i el tall de `layout.css`). És un canvi estructural: cal mesurar abans a 768 i a 1024 px.
  - **Mur:** estudiar la viabilitat de dues publicacions per fila.

### 3. Multimèdia (T6) i l'apartat «IAIA»

- Les imatges de `_multimedia_de_poble/`, fora de git des del `26d0be9c`, han d'anar a la carpeta des d'on les llig la secció Multimèdia.
- **Visor:** en clicar una imatge, la seua finestra mostra les dades EXIF i en quin article s'ha publicat.
- **Administrador:**
  - pot esborrar imatges des d'eixa finestra, també les òrfenes;
  - l'esborrat és destructiu i porta confirmació.
- **Apartat «IAIA»:** a Multimèdia, només per a les imatges creades per IA.

### 4. Tancar els pendents de la marató 261007

Detall i evidència a [[261007_0030_auditoria_claude]]:
- **Gestoria:** cal triar la modalitat Veri*Factu (remissió o no verificable) i decidir quina app es promou a producció (la closca offline del worker només actua en producció). Hi ha preguntes obertes:
  - una sèrie per dispositiu;
  - si els tiquets del Bar passen a ser F2;
  - un tractor d'aprovació per emetre;
  - una via de correcció del perfil fiscal.
- **Service worker:** signar l'ADR-2026-10, servir `/sw.js` amb `no-cache` i fer la verificació manual de la càrrega en fred sense xarxa a Chrome, Firefox i Safari.
- **Comentar públic:** les pàgines de sistema fora de `PAGINES_AMB_XAT` (p. ex. /page/xat i /page/drets-autor) necessiten una migració de `private.xat_subjecte` per a tindre xat públic.
- **Design Guard:**
  - el pegat de les proves a `design_guard.mjs`;
  - el marcador `ALLOW_FOCUS_NONE` per al calaix de l'Índex;
  - la decisió sobre el doble H1 de `DocumentPrintPreview`.
- **Vocabulari (llei dura V3):** `alergens.css`, `tpv.css`, `pecesApps.css` i `catalegColleccio.css` encara viuen sota `src/components/PedraSeca/`. Es resolen com el carrusel: es passen a `components.css`.
- **Barra blava de la Universal Page (Traduir i Compartir):** és la prioritat alta de la propera sessió. El detall és al §0.
- **Dades personals:** `legalContent.js:75` publica el NIF i el domicili, mentre les línies 28-29 diuen «[DADES PROTEGIDES AL CODI FONT]». Cal una decisió legal del Mestre.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- **`PublicNavPills`:**
  - prova de render del mateix component a les quatre seccions (Mur, Mercat, Calendari i Mapa), amb la pastilla activa segons la ruta;
  - porta de duplicació: cap altre `PillToggle` amb eixes opcions dins de `src/sections`;
  - navegador a 375, 768 i 1280 px.
- **`/mapa`:**
  - entra a `SECTIONS` i al SEO;
  - el Mur ja no munta l'iframe;
  - les proves del Mur i de les rutes s'actualitzen.
- **Poliment:** cada canvi amb mesura abans i després al navegador, i la Llei del Píxel en tot el que no és redisseny ordenat.
- **T6:** proves de l'esborrat amb confirmació i del filtre «IAIA»; l'EXIF es llig sense dependències noves o amb una d'aprovada.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Les pastilles com a navegació** canvien el comportament del Mur: avui són filtres locals i el mapa s'obri dins. Un enllaç compartit al Mur filtrat pot deixar de funcionar si no es conserven les consultes.
- **La barra lateral fixa en tauleta** és estructural: mou el punt de tall que comparteixen `App.jsx`, `layout.css` i el calaix. Pot trencar el mode immersiu del Xat, que depén de «compacte».
- **Esborrar imatges des de Multimèdia** és irreversible: cal confirmació i saber en quins articles s'usen abans d'esborrar.
- **Treball concurrent:** el 261007 tres agents i el Mestre van editar els mateixos fitxers alhora (`pageContent.js`, `systemPages.js`, `UniversalCard.jsx`) i hi va haver una reversió creuada. Cada front ha de declarar l'abast de fitxers abans de començar.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261007_0030_auditoria_claude]]

- **L'empaquetat**: core-empaquetat-wp executat. Versió 1.0.5 empaquetada correctament.
