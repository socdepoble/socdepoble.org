---
type: skill
status: canonic
description: Estàndard d'arquitectura, anatomia i configuració de la UniversalPage de Sóc de Poble. Defineix l'estructura visual, el comportament del scroll i els blocs que la formen.
tags:
  - core
name: sdp-universal-page
triggers_on:
  - UniversalPage
  - chrome
  - bar-blue
  - page-header
contracte.llig:
  - src/sections/detail/PageDetailSection.test.jsx
  - src/components/PedraSeca/organismes/Dialeg.test.jsx
  - src/components/universal/identitat/CalaixIdentitats.test.jsx
  - src/components/universal/UniversalPage.jsx
  - src/components/layout/AppGridShell.jsx
  - src/components/universal/PageFrame.jsx
  - src/sections/disseny/DesignSection.jsx
  - src/sections/text/TextSection.jsx
  - src/sections/text/TextSection.targetes.test.jsx
  - src/config/systemPages.js
  - src/components/universal/workspace/UniversalWorkspace.jsx
  - src/sections/pobles/PoblesSection.jsx
contracte.escriu:
  - src/components/universal/UniversalPage.jsx
---

# SKILL: UniversalPage — Anatomia i Comportament

Aquest manual defineix l'arquitectura i les regles inviolables de la `UniversalPage`, el component base per construir pàgines i vistes de lectura/edició dins de Sóc de Poble.

> [!IMPORTANT]
> **FONT DE VERITAT ÚNICA (Single Source of Truth):**
> La font del contracte és `src/components/universal/UniversalPage.jsx` i el seu `PageFrame`; `src/sections/disseny/DesignSection.jsx` mostra espècimens. Per a pàgines de text i targetes internes, contrasta també `src/sections/text/TextSection.jsx` i les seues proves. Copia el mecanisme vigent de la superfície que estàs ampliant, sense crear una segona pàgina o closca.


## 1. Anatomia Estàndard (Els Blocs)

Una `UniversalPage` completa està formada pels següents blocs estratificats, que han d'aparèixer en aquest ordre i respectar aquestes regles de maquetació:

### A. La Barra Blava (`bar-blue`)
És el centre de control i navegació de la pàgina/document. Les accions atòmiques i la disposició es divideixen estrictament en tres grups:
- **Esquerra (Navegació):** Un trio d'icones compost per "Tornar arrere", "Tornar avant" i l'**Índex**.
  - *Regla Sagrada de l'Índex:* Aquest botó és fonamental. Evita haver d'omplir la pàgina de múltiples etiquetes `<h1>` per a separar contingut, permetent navegar per tota la jerarquia de subseccions (des d'`<h2>` fins a `<h6>`). Això garanteix que **només hi haja un únic H1 per pàgina**, mantenint la puresa SEO i l'arquitectura d'informació.
- **Centre (Interacció):** Un trio d'icones centrat compost per "Traductor", "Comentar (Xat)" i "Compartir".
  - *Regla del Botó Comentar:* reutilitza el menú de `PageFrame` i `useAccions`: «En privat» va al destinatari de l'objecte, i «En públic» al xat comú de l'objecte quan el contracte l'admet. No afegisques un fil davall de la targeta ni substituïsques el menú compartit per una via privada pròpia.
- **Dreta (Acció Principal):** El botó "Connectar".

> **Regles de disseny i densitat:** 
> S'exigeix un espaiat intern zero (`gap: 0`) entre els botons d'icona per assolir la màxima densitat. El grup central ha d'estar centrat matemàticament respecte a tota la barra. En pantalles mòbils crítiques, el botó "Connectar" de la dreta perd la paraula i es redueix a un botó circular amb el símbol `+`.

> [!IMPORTANT]
> **Equivalència Atòmica (La Targeta i la Pàgina):**
> L'equivalent directe de la Barra Blava (`bar-blue`) en la versió reduïda del component és **el peu de la Targeta Universal (`UniversalCard footer`)**. Són atòmicament els mateixos elements. Les accions que s'afigen, canvien o s'eliminen a la Barra Blava s'han de reflectir exactament igual al peu de la Targeta Universal, i viceversa. Formen part del mateix sistema d'interacció.

### B. El Frame de Capçalera (Imatge Principal / SEO)
Aquest element visual no només encapçala la pàgina, sinó que és **la Imatge SEO** que es mostrarà en compartir l'enllaç per WhatsApp o xarxes socials.
- **Amplària Completa (Full Width):** La imatge Hero (o element multimèdia equivalent) **ha d'ocupar el 100% de l'ample del contenidor**. NO té marge. NO té padding.
- **Adaptabilitat del Format:** El contenidor s'adapta proporcionalment a les dimensions de l'arxiu. Encara que a la "Universal Card" normalment s'usen imatges quadrades, el sistema suporta qualsevol format (com un foli A4 o imatge rectangular), ajustant l'altura automàticament.
- **Interfície de Creació / Edició:** A l'hora de crear o editar una `UniversalPage` o `UniversalCard`, la imatge SEO es gestiona *des de la mateixa pàgina* on es previsualitza, amb aquest comportament:
  - **Estat Buit:** Si no hi ha cap imatge, només es mostra un únic botó: **"Inserir Imatge o Multimèdia"**.
  - **Estat d'Edició:** Si ja hi ha una imatge, l'usuari fa clic al damunt per a editar-la. La imatge desapareix temporalment per mostrar el menú d'accions amb tres botons:
    1. **"Inserir Imatge o Multimèdia"**: Per pujar o triar un arxiu nou (reemplaçant l'actual).
    2. **"Tornar enrere"**: Per a cancel·lar l'edició i tornar a veure la imatge actual sense canvis.
    3. **"Esborrar contingut"**: Un botó d'alerta per a eliminar la imatge actual i tornar a l'estat buit.

### C. La Barra Taronja (`bar-orange`)
- Conté l'autoria de l'usuari, el seu poble i la data/hora de la publicació.
- **Distribució Visual:** Es divideix estrictament en dues meitats:
  - **A l'esquerra (Identitat):** Avatar, Nom de l'autor/entitat i Poble.
  - **A la dreta (Metadades i Opcions):** Ha de tindre obligatòriament el botó estandarditzat per mostrar l'hora i la data (fons fosc/negre amb text blanc i vora taronja) i, just al seu costat, l'icona d'opcions (habitualment els tres punts o un menú desplegable). **No** s'ha de posar un simple icona d'informació "(i)", l'estructura ha de ser exactament el botó de temps + icona d'opcions.
- Igual que el Hero, **ha d'adaptar-se a l'ample complet** del contenidor, llevant qualsevol _padding_ global que la constrenya lateralment.
- **Injecció i Control (API `topBarData`):** La barra taronja és responsabilitat interna de `UniversalPage` i es mostra automàticament si el paràmetre `chrome` s'estableix a `"full"` o `"context"`. **Mai** s'ha de recrear manualment com a `children` del component.
- Per sobreescriure les accions de la dreta, utilitza la propietat `topBarData={{ barActions: <ElTeuComponent /> }}` assegurant-te que `<ElTeuComponent />` implementa el botó de data/hora i l'icona d'opcions correctament.

### D. La Decoració de l'H1 (El Títol i l'Escut)
- **El Bloc Compacte (Fons Blanc i Cantons):** Tot el grup de l'H1 (la imatge/logotip superior, el propi text de l'H1, les etiquetes, categories i el copyright inferior) s'ha d'agrupar dins d'un contenidor únic (`.page-title`). Aquest contenidor té **el fons de targeta (`var(--sdp-fons-targeta)`, blanc en el tema clar)** que naix enganxat a la barra taronja superior, i acaba en la part inferior amb **els cantons inferiors arrodonits** i **l'ombra funcional `var(--sdp-ombra-1)`**, tal com els fixa `header.page-title` a `src/css/layout.css`.
- **Funció de Separació:** Aquest bloc blanc actua com un element separador fonamental per al disseny. Separa l'H1 del següent titular (`H2`) i de l'entradilla. El titular `H2` i l'entradilla ja queden **fora** d'aquest contenidor blanc, fusionant-se de forma compacta sobre el fons general de la pàgina.
- **Imatge de Capçalera (Escut/Logo o Multimèdia):** Abans de l'H1 (dins del bloc blanc), s'ubica una imatge de capçalera (com el logotip de l'autor institucional o una imatge pujada per l'usuari). Aquesta imatge està **estrictament limitada a un màxim de 600x600 píxeles**. El seu contenidor (`div`) s'ha d'adaptar proporcionalment a l'altura de la imatge i ha de tindre *padding* superior i inferior (respirar) perquè la imatge no quede xafada, centrada sempre horitzontalment.
- **Títol i Metadades:** Conté el títol principal (`H1`), les etiquetes (píndoles de categories com "Mur", "Sistema", "Manual") i el copyright.
- **Amplària Contenida:** A diferència del Hero i la Barra Taronja, tot aquest bloc decoratiu (incloent-hi la imatge de 600px i l'H1) **NO** pot ser d'ample complet. Ha de mantindre una amplària màxima centrada (per exemple, `max-width: 800px`) i estar enganxat per dalt a la barra taronja (sense padding superior extra en el contenidor principal de l'article) per garantir la llegibilitat i l'efecte decoratiu.

### E. El Contenidor de Text i la Jerarquia Semàntica (La Lectura)
- L'espai on l'usuari llig i escriu (la resta de l'article o el `xat-main`) no és el fons de targeta (`var(--sdp-fons-targeta)`), ni tampoc arriba a la intensitat del fons de l'app (`var(--sdp-fons-app)`). S'usa el color **`var(--sdp-fons-lectura)`** (`#f7f6f3`) per afavorir la lectura lliure de distraccions.
- **Sistematització de la Publicació (Flux de Treball):** Tota publicació nostra dins d'una `UniversalPage` (que recordem, es correspon directament amb una Targeta/Card) ha de seguir aquesta anatomia semàntica de forma estricta:
  1. **H1 (Títol Principal):** Sempre dins del bloc blanc compacte, mai repetit a la resta de la pàgina.
  2. **H2 (Subtítol):** És el primer encapçalament que apareix just a sota de l'H1, ja integrat sobre el color de fons de lectura.
  3. **L'Entradilla:** Un paràgraf de text (sense encapçalament) just a sota de l'H2 que resumeix o dona entrada a la publicació.
  4. **El Cos del Document (H3 en avant):** A partir d'ací, si hi ha seccions o esquemes interns (ex. "Esquema", rutes, codi), començaran sempre amb un **H3**. Els elements restants de la pàgina aniran d'H3 cap avall.
- *Nota:* Encara que un usuari foraster publique únicament un H1 i text pla curtet (i això siga perfectament vàlid per al seu ús), el nostre **flux de treball intern** i les vistes canòniques han de complir SEMPRE amb l'estructura de "Títol (H1) -> Subtítol (H2) -> Entradilla -> Cos (H3+)".
## 2. Comportament d'Incrustació (Embed Mode) i Scroll

La `UniversalPage` està dissenyada per a ser incrustada (embedded) com si fóra el document de contingut d'un editor (com ara dins del `NotesEditor`). 

- **Amplària adaptativa:** Quan s'incrusta com una columna més (ex: a la dreta de la llista de notes i de les carpetes), la barra blava NO ocupa de part a part de l'aplicació, sinó només de part a part del seu propi contenidor (l'editor de notes). Així s'evita xafar l'espai de navegació lateral.
- **Zero Doble Scroll i Barres no fixes:** A diferència de la pàgina completa (on les barres blava i taronja es queden fixes a dalt, sent *sticky*), en mode incrustat **la barra blava i la barra taronja s'han d'amagar de forma natural a través de l'scroll del propi document incrustat**. Quan l'usuari desplaça cap avall la nota, tant la barra blava com la taronja pugen i s'amaguen, alliberant tot l'espai vertical i fixant l'atenció exclusivament en l'edició del contingut. Aquesta és l'única excepció de comportament d'una UniversalPage incrustada respecte a la versió independent.

## 3. L'Entorn d'Edició (Foraster vs. Connectat)
L'anatomia de lectura i edició es comparteix, però l'accés a Notes el governen `NotesSection` i la sessió o el mode pilot del node. No deduïsques que una persona anònima pot crear una nota efímera: comprova el camí real amb `NotesSection.ambit.test.jsx` i conserva la porta d'entrada autoritzada.

## 4. Sistema de Classificació (Carpetes, Categories i Etiquetes)
Tota Targeta i Pàgina Universal (`UniversalPage`) exposa de manera prominent els seus metadades de classificació mitjançant píndoles (badges) sota el títol principal (H1). L'estructura semàntica i interactiva segueix sempre el següent patró estricte, renderitzant-se en aquest ordre:

1. **La Carpeta (Sistema):** És el contenidor lògic on s'arxiva el document (ex: *Mur*, *Mercat*, *Pobles*, *Esdeveniments*).
   - Estil: Fons blau fosc (`.sdp-badge-system`).
   - Comportament: Si l'usuari la clica (`onClick`), ha de filtrar/navegar cap al contingut d'eixa carpeta (ex: `handleSelectFolder`).
2. **La Categoria Temàtica:** Classifica el document dins d'un àmbit temàtic transversal (ex: *Sistema*, *Productivitat*, *Manual*).
   - Estil: Fons blau clar/grisenc (`.sdp-badge-category`).
   - Comportament: Al fer-hi clic, ha de filtrar i mostrar només els documents d'eixa categoria en l'àmbit actual (ex: `handleSelectCategory`).
3. **Les Etiquetes (Tags):** Definicions lliures o semàntiques del contingut (ex: *Tutorial*, *Notícia*, *Vibe*).
   - Estil: Fons taronja suau corporatiu (`.sdp-badge-tag`).
   - Comportament: Clicables. Filtren el llistat per paraules clau específiques (ex: `handleSelectTag`).

*Regla de disseny visual:* Cap píndola decorativa s'ha de duplicar (ex: si el context ja es troba a la Carpeta "Mur", no s'afegeix un badge idèntic "Mur" com a Categoria). Cada element visual compleix el seu rol estricte dins del DOM de la UniversalPage per facilitar el filtratge de dades.

## 5. Jerarquia Estricta de Contenidors (L'Editor i l'Espai de Treball)

Quan es construeix una aplicació o secció complexa que empra el sistema de graella (`AppGridShell`) i el gestor d'estat (`UniversalWorkspace`), hi ha una **REGLA INVIOLABLE DE NIDIFICACIÓ**:

- **El component `UniversalWorkspace` MAI pot estar envoltat per una `UniversalPage`.**
  - L'arrel del teu domini ha de retornar directament la graella (`AppGridShell` o `UniversalWorkspace`), la qual s'encarrega d'ocupar tota la pantalla i gestionar les 3 columnes.
- **Dins d'un `UniversalWorkspace`, la pàgina viu al detall de la columna dreta.**
  - `renderDetail` rep l'element i la selecció, i retorna el seu editor o visor. No hi ha una prop pública `renderEditor`. La barra blava ocupa el detall i no tapa les carpetes o la llista.
  - Una secció de lectura sense workspace pot tindre `UniversalPage` com a arrel, com fa `PoblesSection`. La prohibició és envoltar un workspace complet amb una pàgina, no usar una pàgina fora d'un editor.
  - Contrasta `src/components/universal/workspace/UniversalWorkspace.jsx` i `src/sections/pobles/PoblesSection.jsx` abans de triar la closca.

## Lliçons del Mestre
**261004** | **Tota targeta porta boina i tota pàgina (també les de sistema) porta barra taronja**: cada UniversalCard du la seua boina taronja amb l'autor real (per a les targetes de sistema, l'entitat Sóc de Poble enllaçada a /projecte), el cos sencer (títol, subtítol i entradeta que explica què és) i el peu canònic. Tota targeta té la seua pàgina pròpia, i tota pàgina la seua targeta; la imatge de la targeta és l'hero i la imatge SEO de la pàgina, amb el seu slug compartible.
A més, **tota pàgina, també les de sistema, porta la barra taronja amb el logo i l'autor** perquè siga clicable, encara que no tinga imatge hero (ex. Consola, Pols del cervell). La boina i la barra taronja només es lleven per ordre explícita del Mestre.
**261007** | **Una pàgina de contingut naix de la maquinària existent**: una pàgina informativa o de sistema nova (p. ex. «Drets d'autor») és una entrada de `SYSTEM_PAGES` (`src/config/systemPages.js`) i de `PAGE_COPY` (`src/sections/text/pageContent.js`), amb el seu HTML, i la pinta la UniversalPage de sempre (TextSection). Així hereta la barra taronja, la targeta, el SEO, Connectar i Comentar, i l'enxufabilitat. Si un bloc ha d'aparéixer dins d'una pàgina, s'hi incrusta amb el mecanisme de targetes incrustades que ja existix (`data-sdp-targetes`).
**261010** | **Prohibit duplicar la HeroImage a l'interior o al peu de la pàgina**: Una imatge hero principal col·locada dalt ja compleix la seva funció per a la notícia/pàgina. És un error de disseny i de redundància innecessària repetir eixa mateixa imatge a la part inferior de la pàgina o en altres seccions del cos. Si la publicació ha de tenir múltiples imatges (ex: targetes incrustades), han de ser fotografies diferents. Mai es duplica la mateixa imatge dins de la mateixa notícia.
**261030** | **Zero taules de prosa**: evitar les taules amb molta informació textual en format web (als mòbils es converteixen en una trampa de menejar dits i lletra menuda). Redactar sempre en mode editorial vertical emprant la jerarquia H3/H4/H5/H6, cites `<blockquote>`, paràgrafs `<p>` i llistes `<ul>` a mida de cos normal, facilitant l'scroll vertical amb el dit i la indexació automàtica a la Taula de Continguts de la Barra Blava.
**261030** | **Hipervincles vius obligatoris**: sempre que en una pàgina o publicació es parle d'una entitat, subvenció, node, projecte o pàgina (interna o externa), cal posar-hi l'hipervincle actiu (i logotip clicable quan corresponga) perquè la gent sàpiga de què parlem i la informació no s'estanque mai.
**261030** | **H3 just després de l'entradilla**: a les pàgines de contingut (`PAGE_COPY`), després de l'entradilla (lead) SEMPRE ha d'anar un `<h3>`, i després els paràgrafs, les subseccions `<h4>`, les llistes `<ul>` i els hipervincles vius a les seccions i pàgines que s'hi mencionen.

## Exemplar reutilitzable: targetes dins del text

El cas verificable és `CosDeLaPagina` de `TextSection.jsx`: saneja l'HTML, el segmenta amb `segmentsAmbTargetes` i pinta els grups `data-sdp-targetes` amb `CosAmbTargetes` i `ProveidorSincronitzacioTargetes`. Així la targeta interna és una `UniversalCard` sincronitzada, amb instantània de reserva; no és un segon `UniversalWorkspace` ni HTML cru injectat al cos.

`src/sections/text/TextSection.targetes.test.jsx` prova la targeta de drets d'autor dins de Legal, el text que l'envolta i el camí sense targetes. L'editor reutilitza `targetesIncrustades.js` i el contracte `targetes` de `DocumentEditor`, amb proves a `DocumentEditor.targetes.test.jsx` i `NotesEditor.targetes.test.jsx`. Un grup de targetes i una secció desplegable són mecanismes diferents: no inventes un node TipTap nou només perquè una pàgina use `<details>`.

`/page/privadesa` reutilitza la política i els camins de baixa de `/legal` com a àlies de `PAGE_ROUTE_MAP`/`resolvePageSlugPath`; no és una segona pàgina ni una política nova. `PageDetailSection.test.jsx` fixa la redirecció i conserva el 404 d’un slug desconegut. La ruta era absent en la instantània inicial d’Onada 4: el corrector de l’àlies ha de passar CAS i tornar-se a certificar abans de donar-lo per desplegat. La verificació d’«Edició avançada» i `PublicacioUniversal` es descriu a [[sdp-universal-editor/SKILL|sdp-universal-editor]] i [[sdp-casos-us-essencials/SKILL|sdp-casos-us-essencials]].

Certifica la destinació de cada enllaç amb `node tooling/gates/certifica-enllacos.mjs --url /page/legal --remot --json`: arbre/router i resposta HTTP són evidències distintes. Un HTTP 200 de la closca SPA, per si sol, no acredita ni la ruta ni l'autorització del contingut.

## Calaixos de capçalera compartits (IDEA-63)

En la SPA, l’Índex de continguts de `PageFrame` i «Amb qui actues?» de `CalaixIdentitats` compartixen la geometria de `src/css/tokens.css`: `--sdp-calaix-dalt` és `calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))`; `--sdp-calaix-alt` resta eixe espai de la finestra, amb alternativa `vh` i `dvh` dins de `@supports`. `.toc-overlay`, `.sdp-dialeg--calaix` i el seu vel reutilitzen eixos tokens. En l’encastat es conserva la capa modal de `layout.css`, que dimensiona el calaix al 100% de la caixa de l’App; no s’hi imposa la geometria de la finestra de la SPA. `Dialeg.test.jsx` en fixa també esta excepció. Els costats de la SPA només determinen esquerra/dreta; no tornen a definir un altre `top: 0` ni una alçada completa. El cos desplaçable i el peu conserven la zona segura inferior. Reutilitza el patró per a qualsevol calaix de capçalera, amb el mateix nom accessible, focus, tancament i comportament encastat de `Dialeg`.

`src/components/PedraSeca/organismes/Dialeg.test.jsx` i `src/components/universal/identitat/CalaixIdentitats.test.jsx` comproven classes, tokens, vel, costats i regressions de geometria CSS; `PageFrame.indexTitol.test.jsx` conserva el consumidor de l’Índex. S’han contrastat junt amb les suites d’edició avançada en la instantània complementària d’Onada 4 (140 proves verdes). Són comprovacions de DOM i regles CSS: abans de donar per feta la geometria real, revisa també el mòbil i les zones segures en navegador.

## Vincles
- [[00_INDEX_SKILLS]]
