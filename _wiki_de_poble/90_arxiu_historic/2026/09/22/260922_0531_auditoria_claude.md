---
type: informe
status: esborrany
description: 'Segona lectura a l''olivera: verificacio al navegador del graf de Codex, tokens inexistents, CSS fora de capa i cadena de portes morta al pas 1.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_a944bc6b-f20b-4266-8727-a86e62983ea2:7744f82b-b3e7-41be-92ba-f3e2f0594230
---
# Auditoria del BrainGraph i de les portes que no el jutgen

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a944bc6b-f20b-4266-8727-a86e62983ea2:7744f82b-b3e7-41be-92ba-f3e2f0594230 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T03:31:59.050Z |
| Modificació | 2026-09-22T03:35:00.000Z |
| Propietari | Claude Opus 5 (agent local) |
| Aprovació humana | pendent |

## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 b2f519c4eb08bd94fea8fb554476b04d931ce54131b021efc16217caaa4881f7. El rebut acredita entrega, no comprensió.

## Historial

2026-09-22T03:31:59.050Z: esborrany creat amb rebut.
2026-09-22T03:35:00.000Z: troballes verificades al navegador i amb les portes del propi projecte.
2026-09-22T03:52:00.000Z: segona mesura. Codex ha reescrit el component mentre es publicava l'informe: set troballes resoltes, cinc regressions noves, bateria de proves en roig.

## Troballes

### Tall de l'auditoria (imprescindible: hi havia dos mans al mateix codi)

Codex estava escrivint mentre jo llegia. He fixat el tall amb hash:

| Fitxer | SHA-256 (16) | Estat |
| --- | --- | --- |
| `src/components/universal/graph/BrainGraph.jsx` | `150b6f6ca5b7fa8f` | no versionat (`??`) |
| `src/components/universal/graph/useForceLayout.js` | `e4b736b82f522031` | no versionat (`??`) |
| `src/css/modules.css` | `fafdaf11aee0e755` | modificat |

La primera versió que vaig llegir (`7441b1ac…`) ja era vella quan la vaig acabar de llegir. Tot el que segueix és contra els hash de dalt.

### El que Codex ha fet bé, i que confirme amb proves pròpies

No repetisc feina feta. He comprovat, no cregut:

- **La roda ja no crida `preventDefault` des d'un oient passiu.** Roda damunt del canvas al navegador: el graf fa zoom, la pàgina no es mou i la consola queda neta. `BrainGraph.jsx:211-225` (oient natiu amb `{ passive: false }`).
- **El `var()` dins de `fillStyle` era el motiu real que el graf semblava mort.** Un `canvas` no resol variables CSS. La sonda de `BrainGraph.jsx:114-122` és tècnica correcta.
- **La CSP.** La cadena de retrocés de CSP3 per a workers passa per `script-src` (`'self'`, sense `blob:`) abans d'arribar a `default-src` (que sí el tenia). Per això es rebutjava. `worker-src 'self' blob:` a `index.html:8` i `vercel.json:8` és la correcció mínima i correcta.
- **Els tres tests passen.** `npx vitest run src/components/universal/graph/BrainGraph.test.jsx` → 3 passed. ESLint sobre els dos mòduls del graf: net.
- **L'origen del worker, resolt.** Codex va deixar-ho obert honestament. Ho tanque jo: el crea el client de desenvolupament de Vite, `node_modules/vite/dist/client/client.mjs`, que fabrica un Blob i el llança com a `new SharedWorker(objURL)` dins de `waitForSuccessfulPing()` quan cau la connexió del dev server. **L'error és exclusivament de dev i no és del graf.** La correcció és bona igualment, però convé saber que el graf no en tenia la culpa.

### P1 · `--sdp-blau` i `--sdp-verd` no existixen enlloc — i la porta del projecte ja ho crida

- **Fitxer:** `src/components/universal/graph/BrainGraph.jsx:13-15`
- **Evidència reproduïble:** `npm run porta:tokens` → *«`--sdp-blau` no es declara enlloc»*, *«`--sdp-verd` no es declara enlloc»*, *«el fallback és una còpia privada del sistema de disseny»*, citant `BrainGraph.jsx:13`, `:14` i `:15`. `grep -rn -- "--sdp-blau:" src/css/` → cap resultat.
- **Font de veritat en conflicte:** `src/css/tokens.css` i `tooling/gates/tractor-tokens.mjs`.
- **Per què és P1 i no cosmètic:** els dos colors que pinten categories i etiquetes no venen del sistema; venen de `#2196f3` i `#4caf50` incrustats al component. No canvien amb el tema fosc i no els toca cap auditoria de contrast.
- **Proposta conservadora:** el sistema ja té el blau i el verd canònics. `category` → `var(--sdp-accio)` (que és `--sdp-secondary-500` = `--sdp-canon-blau`), `tag` → `var(--sdp-exit)` (`#027e38`). `document` ja usa `--sdp-accent` i està bé. Zero tokens nous.

### P1 · El bloc CSS del graf viu fora de tota capa i per això guanya a tot el sistema

- **Fitxer:** `src/css/modules.css:3504-3522`
- **Evidència reproduïble:** `grep -n "^@layer" src/css/modules.css` → `6:@layer components {`, `695:@layer legacy {`, `3253:} /* fi @layer legacy */`, `3261:@layer components {`. `sed -n '3499,3506p'` mostra que la clau de la línia 3502 tanca eixe `@layer components` i que `.sdp-brain-graph-wrapper { min-height: 420px; }` (3504) comença **fora de cap capa**.
- **Font de veritat en conflicte:** l'arquitectura de cascada per capes de `src/css/` (i la lliçó ja apresa a `AppGridShell.css guanya a .sdp-bloc`).
- **Per què és P1:** el CSS sense capa guanya a **totes** les capes declarades. Ara mateix, per accident, les regles del graf són les més fortes del projecte sencer. El graf està partit en dos blocs separats per 2.700 línies dins del mateix fitxer, amb dues especificitats de cascada diferents.
- **Proposta conservadora:** moure el bloc 3504-3522 dins del `@layer components` que tanca a 3502, i fusionar-lo amb el bloc de 795-821 perquè el graf tinga un sol domicili.
- `requires_human_decision: false` — és un moviment de claus, no un canvi de disseny.

### P1 · La simulació no s'atura mai: el llindar és absolut sobre 199 nodes

- **Fitxer:** `src/components/universal/graph/useForceLayout.js:137-140`
- **Evidència reproduïble (mesurada al navegador):** amb el graf visualment quiet, **400 crides a `requestAnimationFrame` en 2 segons** (dos bucles vius, ~200/s). En prémer «Pausar simulació»: **0 en 2 segons**.
- **Causa exacta:** `if (totalVelocity > 0.5)` on `totalVelocity` és la **suma** de `|vx|+|vy|` dels 199 nodes. Perquè pare, la velocitat mitjana per node i eix ha de baixar de 0,0013 px/fotograma. Amb repulsió i gravetat vives, això no passa mai. El bucle de física no dorm i el de dibuix el perseguix.
- **Quant de lluny queda el llindar (simulant el tick fora del navegador amb les dades reals):** l'equilibri real s'estabilitza entre **286 i 312** en quatre mides de contenidor diferents. El llindar del codi és 0,5: unes **590 vegades més baix**. Passats 20.000 ticks, 44 dels 199 nodes encara es mouen més d'1 px per fotograma.
- **Sobre la causa de fons, no tanque el cas.** Els dos concentradors de la Wiki — `GENOMA`, grau 217, i `00_index`, grau 167 — queden clavats al límit de `±30 px/fotograma` de `useForceLayout.js:126-127`, i la molla és lineal amb l'elongació i se suma sobre tots els enllaços del node sense normalitzar per grau (`:94-103`). **Però esta atribució està discutida:** una rèplica independent del tick sosté que llevant només les arestes duplicades ja canvia la convergència. Les dues explicacions apunten al mateix lloc — massa força acumulada damunt dels concentradors — i la neteja de duplicats s'ha de fer igualment. Vegeu la troballa de les 242 arestes duplicades a la segona mesura.
- **Font de veritat en conflicte:** el propi comentari del fitxer (*«Fricción para que pare»*) i la Llei de Pedra Seca (res que consumisca sense fer faena).
- **Per què és P1:** el portàtil del Mestre crema bateria indefinidament mentre la pestanya estiga oberta, i l'única manera d'aturar-ho és prémer pausa a mà.
- **Proposta conservadora:** llindar per node (`totalVelocity / n < 0.02`) i un `alpha` que decaiga, com fa qualsevol motor de forces seriós. Dues línies.

### P1 · El clic en un node no obri el document: `onNodeClick` no està connectat

- **Fitxer:** `src/sections/wiki-de-poble/WikiDePobleSection.jsx:115` → `<BrainGraph />`, sense cap prop.
- **Evidència reproduïble (en viu):** clicar un node del graf. La consola interna s'ompli, l'anella es dibuixa… i `location.href` continua sent `http://localhost:3340/wikidepoble?item&#61;obrir_graf`. Ni la URL ni l'element actiu de la llista de documents es mouen.
- **Font de veritat en conflicte:** el component **sí** dispara el callback (`BrainGraph.jsx:254` i `:291`). Qui no escolta és l'amfitrió.
- **Per què és P1:** és el gest que l'usuari espera d'un graf estil Obsidian. Ara el graf és un mirador: mostra el mapa però no et deixa anar a cap lloc.
- **Proposta conservadora:** `<BrainGraph onNodeClick={node => node.type === 'document' && handleSelectionChange({ itemId: node.id })} />`. La funció ja existix a `WikiDePobleSection.jsx:235-241` i ja fa el `navigate('?item&#61;…')`. El filtre per `type === 'document'` evita navegar a categories i etiquetes, que no són documents.
- `requires_human_decision: true` — cal decidir si el clic ha de **substituir** la vista del graf pel document (i per tant traure l'usuari del graf) o si val més un botó «Obrir» dins de la consola i que el clic només seleccione. Jo recomane la segona: el graf no s'ha de tancar a soles.

### P1 · El panell nou eclipsa el graf sencer quan la columna s'estreny

- **Fitxer:** `src/css/modules.css:3507-3513` i `:3521`
- **Evidència reproduïble:** obrir `/wikidepoble?item&#61;obrir_graf` amb finestra de **1200×800**. El panell (`width: 250px` fixos) tapa tota l'àrea del canvas: no es veu ni un node. Amb 1920 d'amplària es veu bé.
- **Causa exacta:** l'amplària és fixa i la regla de rescat és `@media (max-width: 640px)`, que mira el **viewport**, no el contenidor. A 1200px de viewport la columna del graf fa ~240px i la media query no dispara.
- **Font de veritat en conflicte:** `sdp-universal-page` / `sdp-app-grid-shell`: el graf viu dins d'una graella de tres columnes, no a pantalla completa.
- **Proposta conservadora:** `width: min(250px, 45%)` i, si es vol fer-ho bé, `@container` sobre el `wrapper` (que ja és `position: relative`). Baseline 2022 admet `@container` a Safari 16.
- `requires_human_decision: true` — si el Mestre prefereix el panell **al costat** del canvas i no damunt, això és una decisió de disseny, no un bug.

### P2 · Redimensionar la finestra escampa el graf i el torna al cercle inicial

- **Fitxer:** `src/components/universal/graph/useForceLayout.js:14-35`
- **Evidència reproduïble:** amb la simulació pausada, canviar el viewport de 1920×1000 a 1840×1000. El graf, que estava assentat, torna a dibuixar l'arc del cercle d'inicialització. Captures fetes.
- **Causa exacta:** `initPositions` té `width` i `height` a les dependències i reconstruix els nodes des de `nodes` (que mai porta `x`/`y`), per tant `node.x !== undefined` sempre és fals i totes les posicions es recalculen en cercle.
- **Per què és P2 i no P1:** amb la simulació activa el graf es torna a assentar sol en uns segons. Si està pausat, es queda escampat.
- **Proposta conservadora:** conservar les posicions existents a `nodesRef.current` i, en redimensionar, només reprojectar el centre.

### P2 · L'efecte de dibuix es desmunta i es torna a muntar a cada repintat

- **Fitxer:** `src/components/universal/graph/BrainGraph.jsx:185` (`revision` a les dependències)
- **Evidència reproduïble (mesurada):** instrumentant `document.createElement`, **un sol arrossegament curt crea 18 sondes `<span>` = 3 execucions completes de l'efecte**. Cada execució torna a assignar `canvas.width`/`height` (reinicialitza el búfer), resol els 6 colors i reinicia el `requestAnimationFrame`. Amb un arrossegament humà real (60 esdeveniments/s) això són 60 reconstruccions per segon.
- **Cost mesurat, i sóc honesta:** la passada de colors són 0,035 ms i la reassignació del canvas 0,002 ms. **No és car en microsegons.** El que està malament és l'estructura: `redraw()` no hauria de reconstruir res, i mentre la simulació està activa el bucle ja es reprograma tot sol, per tant `redraw()` hi és redundant.
- **Proposta conservadora:** partir l'efecte en dos — un per a mida i colors (dependència: `dimensions` i el tema) i un altre per al bucle, que llija els `ref` i no necessite estat de React. Així desapareix `revision`.

### P2 · `neighbours` es recalcula sencer a cada render

- **Fitxer:** `src/components/universal/graph/BrainGraph.jsx:94-96`
- **Evidència reproduïble (mesurada al navegador amb les xifres reals 199 nodes × 861 vincles):** **0,877 ms per render, un 5,3% del pressupost d'un fotograma de 60 fps.** Es paga a cada `redraw()` mentre hi haja un node seleccionat, és a dir, a cada moviment del ratolí arrossegant.
- **Proposta conservadora:** `useMemo` amb un mapa d'adjacència construït una vegada a partir de `links`.

### P2 · `animate-spin` no existix: la icona de simulació activa no gira

- **Fitxer:** `src/components/universal/graph/BrainGraph.jsx:314`
- **Evidència reproduïble:** `grep -rn "animate-spin" src/` retorna **només** eixa línia d'ús. No hi ha cap definició a cap dels fitxers de `src/css/`.
- **Font de veritat en conflicte:** el projecte ja té la seua classe: `.spinner { animation: spin 1s linear infinite; }` a `src/css/modules.css:878-884`, amb `@keyframes spin` a `:886`.
- **Nota sobre la porta que havia de vigilar això:** cap. `tooling/gates/tractor-antitailwind.mjs`, que la skill `wiki-cicle-de-vida` presenta com el «Salfumà» que esborra utilitats estil Tailwind, **no existix al disc** (`ls tooling/gates/ | grep -i tailwind` → buit). I `tractor-classes.mjs` només busca la direcció contrària (classes definides i no usades), per tant una classe usada i no definida no la veu ningú.
- **Proposta conservadora:** usar `spinner`, que ja existix i ja està animada.

### P2 · El panell llig un camp que no existix i ignora el que sí que hi és

- **Fitxer:** `src/components/universal/graph/BrainGraph.jsx:299`
- **Evidència reproduïble:** els items del manifest tenen **exactament 7 camps**, els 136 de 136: `id`, `title`, `subtitle`, `categoryId`, `tags`, `attributes`, `content`. **No hi ha cap `description` d'arrel**, per tant `{selected.description && …}` és codi mort. El text que es veu al panell és el `subtitle`.
- **El que s'està deixant fora:** `attributes` porta el frontmatter cru — `type` en 127 items, `status` en 127, `description` en 127, i 23 claus més. És exactament el «Quadre de Comandament ISO» que `WikiDePobleSection.jsx:144-203` ja mostra per als documents, i que la consola del graf no mostra.
- **Proposta conservadora:** llegir `selected.attributes?.description`, `attributes.type` i `attributes.status`. Les dades ja viatgen al node; no cal tocar el generador.

### P2 · Cada node document arrossega el document sencer

- **Fitxer:** `src/components/universal/graph/BrainGraph.jsx:60` (`{ ...item, … }`)
- **Evidència reproduïble (mesurada):** els 136 nodes document pesen **829 KB amb `content` i 69 KB sense**. Dotze vegades més. I `initPositions` en fa una còpia `{ ...node }` cada vegada que s'inicialitza.
- **Proposta conservadora:** desestructurar el `content` fora (`const { content, ...meta } = item`). El panell no el mostra i el graf no el necessita.

### P2 · El canvas s'empassa tota la roda i deixa l'usuari atrapat avall

- **Fitxers:** `src/components/universal/graph/BrainGraph.jsx:211-225` i `src/sections/wiki-de-poble/WikiDePobleSection.jsx:114`
- **Evidència reproduïble (mesurada en viu):** el contenidor amb scroll és `.sdp-workspace-detail` (`modules.css:322-329`). Amb la finestra de la prova: `scrollHeight` 913 contra `clientHeight` 550 → **363 px de scroll sobrant**, perquè l'amfitrió imposa `height: calc(100vh - 200px)` (un número màgic) dins d'una columna que no fa 100vh.
- **La trampa:** l'oient de roda fa `preventDefault()` **sense cap condició**. Una vegada l'usuari ha baixat eixos 363 px, si el punter queda damunt del canvas ja no pot tornar a pujar: la roda només fa zoom. Per a eixir ha de moure el ratolí fora del graf.
- **Proposta conservadora:** dues eixides possibles i cap és cara. La primera, llevar el scroll sobrant donant-li al contenidor una alçada que òmpliga la columna (`height: 100%` amb `min-height: 0` al pare flex) en compte del `calc(100vh - 200px)`. La segona, exigir una modificadora (`event.ctrlKey || event.metaKey`) per a fer zoom, que és el que fan els mapes. La primera arregla la causa; la segona és el pegat.
- `requires_human_decision: true` — és una decisió d'interacció, no un bug mecànic.

### P3 · El contenidor que allotja el graf trenca la porta d'estils en línia

- **Fitxer:** `src/sections/wiki-de-poble/WikiDePobleSection.jsx:114` (i `:100`)
- **Evidència reproduïble:** `npm run porta:inlinestyles` → **13 violacions**, dues al fitxer amfitrió del graf: *«Propietat prohibida 'height' usada en un inline style»* sobre `style={{ height: 'calc(100vh - 200px)', … }}`.
- És deute heretat, no de Codex, però és la caixa on viu el graf i es repara amb una classe.

### P0 de sistema · La cadena de portes mor al pas 1 i cap porta de disseny s'executa mai

- **Fitxer:** `tooling/gates/run-portes.mjs` (53 passos) i `tooling/gates/porta-documents.mjs`
- **Evidència reproduïble:** `node tooling/gates/porta-documents.mjs` → **exit 1**. És el pas 1 de la cadena, i `run-portes.mjs` avorta al primer fracàs.
- **Conseqüència:** `npm run porta` no arriba mai a `porta:tokens` ni a `design_guard`. Les dues troballes P1 de dalt **ja estaven en roig al disc** i cap porta les hauria cantat, perquè la cadena es mor abans d'arribar-hi. Les he trobades perquè he invocat els tractors un per un.
- **Per què és P0:** una cadena de 53 portes que mor al pas 1 dona una sensació de vigilància que no existix. És el mateix patró ja registrat de «portes que ixen verd sense comprovar res», ara en la variant «portes que no s'executen».
- `requires_human_decision: true` — reparar `porta-documents.mjs` toca el contracte documental i el deute heretat d'altres torns; no és una decisió d'esta petorreta.

## Verificació

Tot el que afirme està mesurat o executat, amb l'arbre en l'estat dels hash del tall.

**Al navegador** (`http://localhost:3340/wikidepoble?item&#61;obrir_graf`, servidor de dev ja viu al port 3340, viewport emulat):

| Prova | Resultat |
| --- | --- |
| Consola en carregar i en interactuar | neta: cap error de CSP ni de `preventDefault` |
| Roda damunt del canvas | fa zoom, la pàgina no fa scroll |
| Roda damunt del panell | fa scroll de pàgina (el panell tapa el canvas) |
| Clic en un node | selecciona, l'anella es dibuixa i la fitxa s'ompli |
| URL després de clicar un node | **no canvia** (`?item&#61;obrir_graf`): `onNodeClick` no està connectat |
| Scroll sobrant a `.sdp-workspace-detail` | 913 − 550 = **363 px** |
| Amplària del panell respecte del graf | 250 px de 627 px = **40%** |
| Mida real dels botons de control | 48 × 44 px (= `--sdp-touch`) |
| Nodes i vincles que declara la UI | 199 nodes · 861 vincles |
| `requestAnimationFrame` en 2 s, simulació activa | 400 |
| `requestAnimationFrame` en 2 s, simulació pausada | 0 |
| Sondes `<span>` creades en un arrossegament curt | 18 (= 3 reconstruccions de l'efecte) |
| Cost de `neighbours` per render | 0,877 ms |
| Cost d'una passada de resolució de colors | 0,035 ms |
| Viewport 1200×800 | el panell tapa el graf sencer |
| Viewport 1920 → 1840 | el graf torna al cercle inicial |

**Amb les dades reals del manifest** (`node --input-type=module` sobre `src/data/wikiManifest.js`): 136 items, 33 categories, 30 etiquetes úniques, 199 nodes. 861 vincles = 136 de categoria + 172 d'etiqueta + 553 referències `(?item&#61;…)` vàlides de 558 trobades. La xifra quadra exactament amb la que canta la UI.

### Premisses que he hagut de refutar (meues, de l'encàrrec i dels meus propis auditors)

Una auditoria que només confirma el que ja pensava no val res. Estes cinc han caigut:

1. **«El graf ignora els `wikilinks de doble claudàtor` i per això és pobre d'arestes»** (hipòtesi meua). **Falsa.** Hi ha **0 ocurrències** de `la sintaxi de doble claudàtor` al manifest perquè `tooling/wiki/compile-wiki-to-app.mjs` ja les converteix a `(?item&#61;…)` abans d'escriure. El graf té 553 arestes de referència. No cal tocar res.
2. **«Hi ha `.find()` dins de bucles per fotograma»** (premissa de l'encàrrec). **Ja no.** Els dos bucles construïxen un `Map`: `BrainGraph.jsx:139` i `useForceLayout.js:82`. Corregit per Codex.
3. **«El canvas es veurà borrós en pantalla Retina»** (premissa de l'encàrrec). **Falsa.** `BrainGraph.jsx:123-126` multiplica per `devicePixelRatio` i fa `setTransform`. Corregit per Codex.
4. **«Les dependències de l'efecte de física no inclouen `nodes` ni `links`»** (premissa de l'encàrrec). **Falsa.** `useForceLayout.js:149` les inclou.
5. **«Els botons de control són de 40px i queden per davall del mínim tàctil»** (afirmació d'un dels meus propis agents de reconeixement). **Falsa, i la refute amb el DOM en viu:** mesuren **48 × 44 px**. El `min-*: 40px` de `modules.css:3506` queda per davall del que li dona `.btn-icon`, i 44px és exactament `--sdp-touch` (`tokens.css:171`). No hi ha cap violació tàctil.

Sobre la porta dels 58px, cal precisar per què ix verda: `tooling/gates/01_porta_pedra_seca_58px.mjs:19-45` només llig fitxers `.css` i busca literals `56px`/`58px` en propietats d'alçada. **No imposa cap mínim a cap botó.** Ix verda perquè no mira això, no perquè ho haja comprovat.

**Amb les portes del projecte, una per una:**

| Porta | Veredicte | Relació amb el graf |
| --- | --- | --- |
| `porta:tokens` | roig | **cita `BrainGraph.jsx:13, 14, 15`** |
| `porta:inlinestyles` | roig, 13 violacions | 2 al fitxer amfitrió del graf |
| `porta:58px` | **verd** | els botons d'icona de 40px no la violen |
| `porta:cromatic` | roig | deute heretat de `tokens.css`, res del graf |
| `porta:classes` | roig | deute heretat, no veu el cas d'`animate-spin` |
| `porta:documents` (pas 1 de la cadena) | roig, exit 1 | atura tota la cadena |
| `eslint src/components/universal/graph/` | **verd** | confirma el que diu Codex |
| `vitest` del graf | **verd, 3/3** | confirma el que diu Codex |

## Límits

- **No he tocat ni una línia de codi.** Codex estava escrivint als mateixos fitxers mentre jo auditava: el hash de `BrainGraph.jsx` va canviar dos vegades en dèsset minuts. Tocar-ho ara seria destruir-li la faena. La reparació de les troballes queda **pendent d'ordre del Mestre**, i quan arribe caldrà tornar a fixar el tall.
- **El meu propi procés ha mutat l'arbre, i ho declare.** Un dels meus agents de reconeixement va executar `tooling/gates/tractor-build-previ.mjs` creient que era de només lectura. **No ho és:** per dins fa `npm run build` i va reconstruir `dist/` a les 05:23:51. Cap fitxer del graf ni de la Wiki va ser alterat per això, però l'arbre no és exactament el que era quan vaig obrir el torn.
- **Una cita de l'auditoria de Codex no quadra.** Diu *«198 nodes i 816 vincles»*; la UI viva i el recompte sobre el manifest donen **199 i 861**. Probablement va mesurar sobre un estat anterior. No invalida les seues correccions; sí recorda que les xifres s'han de tornar a prendre després de cada canvi.
- El bucle de física continua sent de fil principal. **Mesurat: 0,042 ms per tick** amb 19.701 parells. Amb 199 nodes no és cap problema i no recomane cap worker: seria complexitat sense guany. Si el graf creix a milers de nodes, això canvia.
- No he provat mòbil real ni lectors de pantalla. El `<select>` que Codex ha afegit dona accés per teclat als tres tipus de node, i això és més del que hi havia, però no és una certificació d'accessibilitat.
- No he fet cap commit, cap desplegament i no he tocat `01_produccio`.

## Reunió a l'Olivera

Codex ha fet la part difícil i l'ha feta bé. El diagnòstic del `var()` dins de `fillStyle` és el que explica per què el graf semblava apagat, i no estava al pla de MarIA. La seua honestedat també és correcta: va deixar escrit *«l'origen del worker no queda demostrat»* en compte d'inventar-ne un. Eixe punt ja està tancat: és el client de dev de Vite.

El que afegisc és el que es veu quan es mira **el sistema** i no només el component: els dos colors del graf no existixen al sistema de tokens i la porta del projecte ja ho canta; el CSS nou ha caigut fora de tota capa i per accident mana damunt de tot; la simulació no dorm mai i els dos concentradors de la Wiki vibren per sempre; el panell nou, que és una bona idea, es menja el 40% del graf en una finestra normal de portàtil; i el clic en un node encara no obri cap document, perquè l'amfitrió no li passa el callback que el component ja dispara.

Tres de les quatre premisses tècniques de l'encàrrec ja eren falses quan vaig arribar, perquè Codex les havia arreglades abans. Ho dic perquè quede escrit: **el `.find()` per fotograma, la borrositat a Retina i les dependències de la física ja no són problema.** Qui llija esta auditoria d'ací a sis mesos ha de saber què estava trencat de veres i què només ho estava al prompt.

I la troballa que no és del graf sinó de el Mas: **la cadena de 53 portes mor al pas 1**. Per això dos defectes que els tractors detecten perfectament han pogut arribar al disc sense que ningú cantara res.

Al pla de MarIA (`260922_0510_pla_implementacio_braingraph.md`) li falta un pas: després de «millora visual» cal **executar els tractors un per un**, perquè `npm run porta` avui no arriba a executar-ne cap de disseny.

## Segona mesura · 05:52 · Codex ha llegit esta auditoria i ha actuat mentre la publicava

L'olivera ha funcionat en directe. Quinze minuts després de deixar l'informe al disc, Codex havia reescrit el component. **Nou tall:** `BrainGraph.jsx` = `e5ff8a97bdb59690` (05:49:25), `useForceLayout.js` = `e8a6943591ac9fa2`, `modules.css` = `6b33b63e6dc2d1d8`. Tot el bloc «Troballes» de dalt val contra el tall anterior i el conserve perquè és el registre del que hi havia; ací està el que val ara.

### Resolt (verificat contra el fitxer viu)

| Troballa | Estat | Prova |
| --- | --- | --- |
| CSS fora de tota capa | **resolt** | el bloc ara obri amb `@layer components {` a `modules.css:3503` |
| `animate-spin` inexistent | **resolt** | `grep -c animate-spin` → 0 |
| `selected.description` codi mort | **resolt** | `grep -c` → 0 |
| `...item` arrossegant el `content` | **resolt** | `grep -c` → 0 |
| `neighbours` sense memoritzar | **resolt** | ara és `useMemo` amb eixida primerenca si no hi ha selecció |
| La roda atrapava el scroll | **resolt** | `if (!event.ctrlKey && !event.metaKey) return;` — el zoom demana Ctrl/Cmd |
| La física no s'aturava mai | **mig resolt** | llindar ara `totalVelocity / n > 2.0`. Mesurat: de 400 rAF/2 s hem passat a **200 rAF/2 s** després de 14 segons. El bucle de física dorm; **el de dibuix no** |
| Clicar un node no obria res | **mig resolt** | hi ha un enllaç «Obrir document» a la consola, que és l'opció que jo recomanava. Però vegeu R4 |

### Continua obert

- `onNodeClick` **segueix sense connectar** a `WikiDePobleSection.jsx:115`: `<BrainGraph />`, sense cap prop.
- Redimensionar continua tornant el graf al cercle: `initPositions` encara depén de `width`/`height` (`useForceLayout.js:31`).
- `revision` continua a les dependències de l'efecte de dibuix (`BrainGraph.jsx:190`).

### Troballes noves del tall d'ara

- **P2 · El radi ja escala amb el zoom però el hit test no.** `BrainGraph.jsx:155` dibuixa amb `NODE_RADIUS * clamp(√k, 0.3, 1.4)`, mentres que `:252` continua comparant contra `NODE_RADIUS[node.type] + 5` en píxels de pantalla. Només coincidixen a `k = 1`. A `k = 0.1` una etiqueta es pinta amb 1,9 px i continua sent clicable dins d'11 px: quasi sis vegades la seua mida, damunt d'una disposició comprimida. Es clicarà el node equivocat.
- **P3 · Dades: 242 parells d'arestes duplicades i 2 auto-enllaços** sobre els 861 vincles (comptat amb el mateix criteri que el component, normalitzant el parell). Cada duplicat aplica la molla dues vegades i alimenta la inestabilitat de la física.

### Regressions introduïdes en els últims quinze minuts

- **R1 · P0 · La bateria de proves està en roig.** `npx vitest run src/components/universal/graph/BrainGraph.test.jsx` → **1 fallit, 2 passen**. La prova `wheel cancel·lable i zoom mantenen la simulació pausada` llança una roda sense `ctrlKey` i espera `defaultPrevented === true`; amb el zoom lligat a Ctrl això ja no passa. **El canvi de comportament és bo; el que falta és actualitzar la prova** (llançar-la amb `ctrlKey: true`, i afegir un cas que exigisca que una roda neta **no** es cancel·le). Ara mateix el mòdul no té bateria verda.
- **R2 · P1 · Els tokens inexistents s'han substituït per hexadecimals crus.** `category: '#2196f3'` i `tag: '#4caf50'` a `BrainGraph.jsx:13-15`. `npm run porta:design-guard` canta **6 `raw-color` NOVA** al fitxer i `porta:tokens` continua citant `:13`, `:16` i `:17` pels fallbacks. L'eixida neta de les dos portes continua sent la mateixa proposta: `var(--sdp-accio)` i `var(--sdp-exit)`, sense fallback.
- **R3 · P1 · Estil en línia nou.** `BrainGraph.jsx:306` porta `style={{ display: 'block', textAlign: 'center', marginBottom: '12px' }}`. `npm run porta:inlinestyles` ha passat de **13 a 14** violacions i ara una és del graf. Va amb classe, no amb atribut.
- **R4 · P1 · L'enllaç «Obrir document» recarrega l'aplicació sencera.** És un `<a href>` cru i `RouterContext.jsx` **no intercepta clics d'ancoratge**. Provat amb sentinella: he deixat `window.__sentinella` abans de clicar i després del clic la variable ha desaparegut. La URL sí que canvia, però l'SPA es reconstruïx des de zero i es perd tot l'estat, inclosa la disposició del graf. Ha d'usar `navigate()` del router, o l'amfitrió ha de passar `onNodeClick`.
- **R5 · P2 · El bucle de dibuix continua sense dormir.** Mesurat després de 14 segons de quietud: **200 rAF en 2 segons**, i **0** en prémer pausa. La física ja para; el dibuix es reprograma mentre `isSimulationActive` siga cert, mire o no si alguna cosa s'ha mogut.

### Lectura

Codex ha corregit set troballes en quinze minuts llegint el document de l'Escriptori. Això és exactament el que el protocol de l'olivera prometia i mai havia funcionat tan de pressa. El preu ha sigut treballar sense xarxa: **cap de les cinc regressions l'hauria vista ningú**, perquè la bateria de proves està roja des del mateix canvi que la trenca i `npm run porta` mor al pas 1. La pressa sense portes és com llaurar de nit.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260922_0518_auditoria_codex]]
- [[260922_0510_pla_implementacio_braingraph]]

**Ancoratge de Seguretat:** [[00_index]] | [[00_index_escriptori]]
