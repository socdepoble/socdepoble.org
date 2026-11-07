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
Encapçala la pàgina i actua com a **Imatge SEO** en compartir l'enllaç per WhatsApp o xarxes socials.
- **Amplària Completa (Full Width):** La imatge Hero (o multimèdia equivalent) **ha d'ocupar el 100% de l'ample del contenidor**, sense marge ni padding.
- **Adaptabilitat del Format:** El contenidor s'adapta proporcionalment a les dimensions de l'arxiu (quadrat, A4 o rectangular), ajustant l'altura automàticament.
- **Interfície de Creació / Edició:** Es gestiona des de la mateixa pàgina:
  - **Estat Buit:** Mostra un únic botó: **"Inserir Imatge o Multimèdia"**.
  - **Estat d'Edició:** En fer clic damunt de la imatge, es mostren tres accions: **"Inserir Imatge o Multimèdia"** (reemplaçar), **"Tornar enrere"** (cancel·lar) i **"Esborrar contingut"** (tornar a l'estat buit).

### C. La Barra Taronja (`bar-orange`)
- Conté l'autoria de l'usuari, el seu poble i la data/hora de la publicació.
- **Distribució Visual:** Es divideix estrictament en dues meitats:
  - **A l'esquerra (Identitat):** Avatar, Nom de l'autor/entitat i Poble.
  - **A la dreta (Metadades i Opcions):** Botó estandarditzat d'hora i data (fons fosc/negre amb text blanc i vora taronja) seguit de la icona d'opcions (tres punts o menú desplegable). **No** s'ha de posar una simple icona `(i)`.
- **Ample complet:** S'adapta al 100% del contenidor sense padding lateral.
- **API `topBarData`:** És responsabilitat interna de `UniversalPage` (`chrome="full"` o `"context"`). **Mai** es recrea manualment com a `children`. Per sobreescriure accions de la dreta, usa `topBarData={{ barActions: <ElTeuComponent /> }}`.

### D. La Decoració de l'H1 (El Títol i l'Escut)
- **El Bloc Compacte (`.page-title`):** Agrupa la imatge/logotip superior, l'`H1`, les etiquetes, categories i el copyright inferior amb fons `var(--sdp-fons-targeta)` enganxat a la barra taronja superior, cantons inferiors arrodonits i ombra `var(--sdp-ombra-1)` (`header.page-title` a `src/css/layout.css`).
- **Funció de Separació:** Separa l'`H1` del subtítol (`H2`) i de l'entradilla, que queden **fora** d'aquest contenidor blanc sobre el fons general de lectura.
- **Imatge de Capçalera (Escut/Logo):** Dins del bloc blanc abans de l'`H1`, limitada a un màxim de **600 × 600 px**, centrada horitzontalment i amb padding vertical.
- **Amplària Contenida:** A diferència del Hero i la Barra Taronja, aquest bloc manté una amplària màxima centrada (`max-width: 800px`) enganxat per dalt a la barra taronja.

### E. El Contenidor de Text i la Jerarquia Semàntica (La Lectura)
- S'usa el color **`var(--sdp-fons-lectura)`** (`#f7f6f3`) per afavorir la lectura.
- **Jerarquia Semàntica Estricta (`H1 -> H2 -> Entradilla -> H3+`):**
  1. **H1 (Títol Principal):** Sempre dins del bloc blanc compacte, mai repetit.
  2. **H2 (Subtítol):** Primer encapçalament sota l'`H1`, sobre el fons de lectura.
  3. **L'Entradilla:** Paràgraf de resum just a sota de l'`H2`.
  4. **El Cos del Document (`H3` en avant):** Totes les seccions internes comencen sempre amb **`H3`**.
## 2. Comportament d'Incrustació (Embed Mode) i Scroll

Quan `UniversalPage` s'incrusta dins d'un editor (com `NotesEditor`):
- **Amplària adaptativa:** La barra blava ocupa només l'amplada del seu propi contenidor (columna de detall), sense xafar les columnes laterals.
- **Zero Doble Scroll i Barres no fixes:** En mode incrustat, la barra blava i la barra taronja pugen i s'amaguen amb l'scroll natural del document per deixar tot l'espai vertical a l'edició.

## 3. L'Entorn d'Edició (Foraster vs. Connectat)
L'anatomia de lectura i edició es comparteix, però l'accés a Notes el governen `NotesSection` i la sessió o el mode pilot del node. Comprova el camí real amb `NotesSection.ambit.test.jsx` i conserva la porta d'entrada autoritzada.

## 4. Sistema de Classificació (Carpetes, Categories i Etiquetes)
Tota `UniversalCard` i `UniversalPage` exposa les metadades de classificació sota l'`H1` en aquest ordre:
1. **La Carpeta (`.sdp-badge-system`):** Contenidor lògic (*Mur*, *Mercat*, *Pobles*, *Esdeveniments*), clicable (`handleSelectFolder`).
2. **La Categoria Temàtica (`.sdp-badge-category`):** Àmbit transversal (*Sistema*, *Productivitat*, *Manual*), clicable (`handleSelectCategory`).
3. **Les Etiquetes (`.sdp-badge-tag`):** Paraules clau clicables (`handleSelectTag`).
*Regla:* Cap píndola s'ha de duplicar entre Carpeta i Categoria.

## 5. Jerarquia Estricta de Contenidors (L'Editor i l'Espai de Treball)
- **`UniversalWorkspace` MAI pot estar envoltat per una `UniversalPage`:** L'arrel del domini amb 3 columnes retorna directament `AppGridShell` o `UniversalWorkspace`.
- **Dins d'un `UniversalWorkspace`, la pàgina viu al detall de la columna dreta (`renderDetail`):** No hi ha prop `renderEditor`. Una secció de lectura sense workspace pot tindre `UniversalPage` com a arrel (com `PoblesSection`). Contrasta `src/components/universal/workspace/UniversalWorkspace.jsx` i `src/sections/pobles/PoblesSection.jsx`.

## Lliçons del Mestre
**261004** | **Tota targeta porta boina i tota pàgina (també les de sistema) porta barra taronja**: cada UniversalCard du la seua boina taronja amb l'autor real (per a les targetes de sistema, l'entitat Sóc de Poble enllaçada a /projecte), el cos sencer (títol, subtítol i entradeta que explica què és) i el peu canònic. Tota targeta té la seua pàgina pròpia, i tota pàgina la seua targeta; la imatge de la targeta és l'hero i la imatge SEO de la pàgina, amb el seu slug compartible.
A més, **tota pàgina, també les de sistema, porta la barra taronja amb el logo i l'autor** perquè siga clicable, encara que no tinga imatge hero (ex. Consola, Pols del cervell). La boina i la barra taronja només es lleven per ordre explícita del Mestre.
**261007** | **Una pàgina de contingut naix de la maquinària existent**: una pàgina informativa o de sistema nova (p. ex. «Drets d'autor») és una entrada de `SYSTEM_PAGES` (`src/config/systemPages.js`) i de `PAGE_COPY` (`src/sections/text/pageContent.js`), amb el seu HTML, i la pinta la UniversalPage de sempre (TextSection). Així hereta la barra taronja, la targeta, el SEO, Connectar i Comentar, i l'enxufabilitat. Si un bloc ha d'aparéixer dins d'una pàgina, s'hi incrusta amb el mecanisme de targetes incrustades que ja existix (`data-sdp-targetes`).
**261010** | **Prohibit duplicar la HeroImage a l'interior o al peu de la pàgina**: Una imatge hero principal col·locada dalt ja compleix la seva funció per a la notícia/pàgina. És un error de disseny i de redundància innecessària repetir eixa mateixa imatge a la part inferior de la pàgina o en altres seccions del cos. Si la publicació ha de tenir múltiples imatges (ex: targetes incrustades), han de ser fotografies diferents. Mai es duplica la mateixa imatge dins de la mateixa notícia.
**261030** | **Zero taules de prosa**: evitar les taules amb molta informació textual en format web (als mòbils es converteixen en una trampa de menejar dits i lletra menuda). Redactar sempre en mode editorial vertical emprant la jerarquia H3/H4/H5/H6, cites `<blockquote>`, paràgrafs `<p>` i llistes `<ul>` a mida de cos normal, facilitant l'scroll vertical amb el dit i la indexació automàtica a la Taula de Continguts de la Barra Blava.
**261030** | **Hipervincles vius obligatoris**: sempre que en una pàgina o publicació es parle d'una entitat, subvenció, node, projecte o pàgina (interna o externa), cal posar-hi l'hipervincle actiu (i logotip clicable quan corresponga) perquè la gent sàpiga de què parlem i la informació no s'estanque mai.
**261030** | **H3 just després de l'entradilla**: a les pàgines de contingut (`PAGE_COPY`), després de l'entradilla (lead) SEMPRE ha d'anar un `<h3>`, i després els paràgrafs, les subseccions `<h4>`, les llistes `<ul>` i els hipervincles vius a les seccions i pàgines que s'hi mencionen.
**261106** | **Inmutabilitat de la Barra Taronja (`DEFAULT_AUTHOR` + Rellotge/Data) i Botons Centrats (`justify-content: center`)**: Si no hi ha una ordre humana explícita en contra, la Barra Taronja (`bar-orange`) de tota `UniversalPage` de sistema (inclosos els apartats d'`Administració del sistema` i `Aplicacions` en `DetallEspai.jsx`) va **sempre igual**: a l'esquerra l'avatar oficial de **Sóc de Poble** (`/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png`), el nom **«Sóc de Poble»** i el poble **«La Torre de les Maçanes»** (`DEFAULT_AUTHOR`), i a la dreta la **pastilla negra amb vora taronja de l'hora i la data** (`dataHoraDeBarra`). Prohibit passar `authorAvatar: ''` (que fa eixir una icona negra genèrica d'usuari), canviar la ubicació per «Utilitat d'este node», o deixar la barra sense rellotge/data, així com duplicar el títol `<h1>` com un segon `<h2>` just a sota. Així mateix, tots els botons, barres de pestanyes i insígnies sota un bloc de text o dins de panells van **sempre alineats al centre (`justify-content: center`)**.
**261107** | **Pàgines Complexes, Diapositives a Pantalla Completa i Zero Text Perdut entre Scrolls (`P0-37 / IDEA-156`)**: En una `UniversalPage` amb esquemes interactius, diapositives o visors 3D (com `/mur/noves-tecnologies-aplicades-a-la-cultura-rural` o `/page/anatomia-rural`), **mai s'ha de tancar text explicatiu dins d'una caixa amb `overflow-y: auto` / `overflow: hidden` i alçada fixa (`aspect-ratio`)** on el text quede tallat i es perda entre scrolls. Les diapositives han d'ocupar l'**amplària completa d'escenari (`100%`) amb opció de Pantalla Completa**, i tota l'explicació rica ha d'anar maquetada com a **text editorial lliure (`height: auto`)** a sota de l'escenari (o en columna *scrollytelling* amb `position: sticky` per a l'escenari en escriptori i 1 sola columna contínua en mòbil), sense complicar mai el CSS.

## Exemplar reutilitzable: targetes dins del text

El cas verificable és `CosDeLaPagina` de `TextSection.jsx`: saneja l'HTML, el segmenta amb `segmentsAmbTargetes` i pinta els grups `data-sdp-targetes` amb `CosAmbTargetes` i `ProveidorSincronitzacioTargetes`. Així la targeta interna és una `UniversalCard` sincronitzada, amb instantània de reserva; no és un segon `UniversalWorkspace` ni HTML cru injectat al cos.

`src/sections/text/TextSection.targetes.test.jsx` prova la targeta de drets d'autor dins de Legal, el text que l'envolta i el camí sense targetes. L'editor reutilitza `targetesIncrustades.js` i el contracte `targetes` de `DocumentEditor`, amb proves a `DocumentEditor.targetes.test.jsx` i `NotesEditor.targetes.test.jsx`. Un grup de targetes i una secció desplegable són mecanismes diferents: no inventes un node TipTap nou només perquè una pàgina use `<details>`.

`/page/privadesa` reutilitza la política i els camins de baixa de `/legal` com a àlies de `PAGE_ROUTE_MAP`/`resolvePageSlugPath`; no és una segona pàgina ni una política nova. `PageDetailSection.test.jsx` fixa la redirecció i conserva el 404 d’un slug desconegut. La ruta era absent en la instantània inicial d’Onada 4: el corrector de l’àlies ha de passar CAS i tornar-se a certificar abans de donar-lo per desplegat. La verificació d’«Edició avançada» i `PublicacioUniversal` es descriu a [[sdp-universal-editor/SKILL|sdp-universal-editor]] i [[sdp-casos-us-essencials/SKILL|sdp-casos-us-essencials]].

Certifica la destinació de cada enllaç amb `node tooling/gates/certifica-enllacos.mjs --url /page/legal --remot --json`: arbre/router i resposta HTTP són evidències distintes. Un HTTP 200 de la closca SPA, per si sol, no acredita ni la ruta ni l'autorització del contingut.

## Calaixos de capçalera compartits (IDEA-63)

En la SPA, l’Índex de continguts de `PageFrame` i «Amb qui actues?» de `CalaixIdentitats` compartixen la geometria de `src/css/tokens.css`: `--sdp-calaix-dalt` és `calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))`; `--sdp-calaix-alt` resta eixe espai de la finestra, amb alternativa `vh` i `dvh` dins de `@supports`. `.toc-overlay`, `.sdp-dialeg--calaix` i el seu vel reutilitzen eixos tokens. En l’encastat es conserva la capa modal de `layout.css`, que dimensiona el calaix al 100% de la caixa de l’App; no s’hi imposa la geometria de la finestra de la SPA. `Dialeg.test.jsx` en fixa també esta excepció. Els costats de la SPA només determinen esquerra/dreta; no tornen a definir un altre `top: 0` ni una alçada completa. El cos desplaçable i el peu conserven la zona segura inferior. Reutilitza el patró per a qualsevol calaix de capçalera, amb el mateix nom accessible, focus, tancament i comportament encastat de `Dialeg`.

`src/components/PedraSeca/organismes/Dialeg.test.jsx` i `src/components/universal/identitat/CalaixIdentitats.test.jsx` comproven classes, tokens, vel, costats i regressions de geometria CSS; `PageFrame.indexTitol.test.jsx` conserva el consumidor de l’Índex. S’han contrastat junt amb les suites d’edició avançada en la instantània complementària d’Onada 4 (140 proves verdes). Són comprovacions de DOM i regles CSS: abans de donar per feta la geometria real, revisa també el mòbil i les zones segures en navegador.

## Llei 1:1 `UniversalPage ↔ UniversalCard` i Prohibició del «M'agrada» (P0-33 / P0-34)

- **Identitat exacta Títol + Subtítol Taronja + Entradilla (`P0-33` · `IDEA-150`):** Tota `UniversalCard` que apunte a una `UniversalPage` (`/mur/:id`, `/page/:slug`, `/mercat/:id`, `/calendari`) ha de mostrar **exactament el mateix Títol (`title`), Subtítol taronja (`subtitle || post_subtitle`) i Entradilla (`entradilla || lead`)** que la seua `UniversalPage`. Està terminantment prohibit inventar un text diferent en `description` que substituïsca l'entradilla o deixe la Card sense subtítol taronja (`TargetaDelMur.jsx` llig sempre `subtitle={resum || item.subtitle || item.post_subtitle}` i `cos = item.entradilla || item.lead || ...`). Si una pàgina o publicació encara no té imatge, la Card no pinta la imatge, però conserva íntegrament el títol, subtítol i entradilla de la `UniversalPage`.
- **Zero «M'agrada / Likes» i Zero `.badge-row` redundant (`P0-34` · `IDEA-151`):** A Sóc de Poble **MAI s'utilitza el concepte «m'agrada» (`likes` / `0 m'agrada`)**; l'acció central del sistema és **«Connectar»** (present tant a la `UniversalPage` com a la `UniversalCard`). Està prohibit afegir píndoles redundants (`.badge-row` amb `[Sóc de Poble]`, `[La Torre de les Maçanes]`, `[💬 0]`, `[0 m'agrada]`) al cos de `detailSectionMeta.jsx` o dels articles, perquè l'autoria i el poble ja viuen a la Barra Taronja superior; al capdamunt del cos només hi va el botó **`🔊 Escolta la IAIA` (`BotoVeuIaia`)**.
- **Unicitat de Visors, Comandaments en Pantalla Completa i Revisió Adversarial de Publicació amb les 4 IAIAs del Node 0 (`IDEA-160` + `IDEA-161` + `IDEA-163`):**
  1. **Un sol visor canònic per tema (Zero Duplicitat):** Quan es millora o substitueix un diagrama o visor 3D (com el Pou de la Neu), està prohibit muntar l'antic i el nou un darrere de l'altre per inèrcia. S'ha d'integrar tota l'exactitud documental, les cotes històriques (`src/data/patrimoni/anatomiaRural.js`, `_cultura_de_poble/`), el text pas a pas i la locució dins d'**un sol visor definitiu** que sume la màxima qualitat 3D amb el 100% d'exactitud real.
  2. **Comandaments visibles dins de Pantalla Completa (`is-fullscreen`):** Quan un visor entra en Pantalla Completa, els seus comandaments interactius (rotació, desmuntatge 3D, estació, selecció de peces) **han de quedar sempre visibles i accionables en pantalla** (barra flotant o layout `100dvh` compensat), mai espentats fora del viewport.
  3. **Revisió Adversarial de Publicació amb les 4 IAIAs del Node 0:** Abans de donar per publicada qualsevol pàgina o article, les 4 IAIAs del Node 0 han d'auditar-ne la simplicitat, l'absència de duplicitats i la fidelitat a les fonts primàries.

## Vincles
- [[00_INDEX_SKILLS]]
