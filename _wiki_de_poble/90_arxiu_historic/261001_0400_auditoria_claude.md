---
type: informe
status: esborrany
description: Error fatal del plugin, metadades i plantilla FSE, rutes d'assets, aria-hidden, franja amfitrió i Fedivers, nodes del perfil i esquelet del calendari, amb evidència al codi.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_abb973ce-0976-4614-9b4d-e06dbc07dd43:d013d13f-80af-45cf-8dcd-e777de8c6ad0
---
# Auditoria Claude: enxufe de WordPress, franja amfitrió, Fedivers i calendari

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_abb973ce-0976-4614-9b4d-e06dbc07dd43:d013d13f-80af-45cf-8dcd-e777de8c6ad0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T02:07:01.911Z |
| Modificació | 2026-10-01T04:25:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | claude-opus-5-5 (Claude Code, Ultracode: orquestradora i subagents del mateix model) |
| Tokens consumits | Subagents: diagnosi 2,78 M + implementació i revisió 5,60 M = 8,38 M per a este prompt. El fil principal no es mesura des d'ací. La fase visual del calendari consta a 261001_0445_auditoria_claude. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-01T02:07:01.911Z: esborrany creat com a 261001_1000_auditoria_claude.md; contingut i verificació pendents.
2026-10-01T02:47:00.000Z: un torn alié reanomena el fitxer a 261001_0400_auditoria_claude.md (i el prompt i el pla a 0400). El rebut 36203cb7 queda vinculat al nom vell.
2026-10-01T02:57:00.000Z: nou rebut d013d13f per a la plantilla lliurada amb el nom vigent; el document s'hi torna a vincular.
2026-10-01T04:25:00.000Z: troballes, verificació i límits escrits després de tres workflows: diagnosi (11 agents), implementació amb revisió adversarial i correcció (21 agents) i correccions de l'orquestradora.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

Procediment: un workflow de diagnosi de només lectura, amb set lents i el contrast adversarial de les hipòtesis de l'error fatal. Després, un workflow d'implementació en cinc fronts, cada un amb propietat de fitxers disjunta. Cada front ha tingut dos revisors adversarials amb lents diferents i un corrector que ha verificat cada troballa abans d'aplicar-la. Les proves PHP s'executen amb el PHP 8.4.25 de WordPress Studio a través de `node --test`. Només he fet servir eines permeses pel hook: cap build, cap npm install i cap escriptura a `.agents/` ni a `tooling/`.

### F1 · Error fatal en activar el plugin (T2) · severitat crítica · confiança: probable

- **Evidència.** El zip lliurat, `01_produccio/builds/socdepoble-enxufe-v1.0.0-261001_0320.zip` (108 MB), no ix de `wordpress-plugin/eines/empaqueta.mjs`. Està fet a mà amb Info-ZIP i no té carpeta arrel: cap entrada comença per `socdepoble-enxufe/`. A més, porta `eines/` i `dist/.vite/`, i el build és de desenvolupament (`1.0.0-dev`, `localhost:54321`, mode `seed`). Ho he llegit al directori central sense descomprimir res.
- **Mecanisme.** Verificat al nucli de WordPress 7.1.2 de Studio (`class-wp-upgrader.php:378, 576-588, 641-643`). Un zip pla s'instal·la en una carpeta que porta el nom del zip. Si al lloc ja hi ha una altra còpia activa, el fitxer principal declarava `socdepoble_enxufe_carrega_traduccions()` al nivell superior (línia 84). PHP vincula eixes funcions en compilar el fitxer, de manera que peta amb «Cannot redeclare» dins de `plugin_sandbox_scrape`, abans d'executar cap guarda.
- **Descartat** amb execució real i anàlisi estàtica: errors de sintaxi, sintaxi posterior a PHP 7.4, requisits mínims i excepcions no capturades.
- **No verificat:** que a Gent de la Torre hi haja una còpia activa. Ho diria el text del requadre `error_scrape` que ix davall de l'avís d'error.
- **Correcció aplicada:**
  - `includes/idioma.php` (nou) rep la funció. El fitxer principal ja no declara cap funció ni classe al nivell superior.
  - Hi ha una guarda abans de cap `const`. Si ja hi ha una altra còpia carregada, al sandbox d'activació fa `wp_die` amb les dues carpetes (WordPress refusa activar-la), i fora del sandbox mostra un avís d'administració.
  - `includes/copies.php` també refusa l'activació a tota la xarxa si hi ha una còpia vella activa en un lloc secundari.
  - `uninstall.php` no esborra les opcions compartides si una altra còpia està activa.
  - `getenv` va protegit amb `function_exists`.
- **Proves.** Controls negatius amb PHP real: sense la guarda, la segona còpia peta; amb una funció al principal, ix «Cannot redeclare».
- **Fonts de veritat:** AGENTS §8 (enxufabilitat) i `empaqueta.mjs:465` (arrel `socdepoble-enxufe/`).
- **Proposta conservadora:** fer el paquet només amb `empaqueta.mjs`. `requires_human_decision: true`. La skill `core-empaquetat-wp` prescriu el zip a mà amb hora al nom, i no la puc tocar.

### F2 · Metadades buides (T4) · severitat alta · confiança: verificada

- **Evidència.** WordPress no llig mai el `readme.txt` local (`plugin-install.php:145-216` del nucli). La finestra «Mostra els detalls» la servix `socdepoble_enxufe_plugins_api`. Abans donava una frase fixa i «No release notes published.», perquè sense clau de signatura el canal és null.
- **Correcció:**
  - Analitzador frugal del readme a `actualitzador.php`. Primer escapa i després transforma; els enllaços només poden ser https i al final hi ha `wp_kses_post`. Així la finestra mostra Description, Installation, FAQ i Changelog reals, i els requisits ixen de les capçaleres.
  - `readme.txt` reescrit segons l'estàndard de WordPress.org: model desacoblat amfitrió/interfície, Features, Installation, FAQ, Changelog 1.0.0 amb funcionalitats presents al codi, Upgrade Notice de 218 caràcters i 5 etiquetes. El bloc External services…Source code es conserva literal.
  - Versió alineada amb el dist: `1.0.0-dev`. L'empaquetador estampa `1.0.0` en una release.

### F3 · Plantilla de pantalla completa amb temes de blocs (T3) · severitat alta · confiança: verificada

- **Evidència.** Amb un tema de blocs, el selector de l'editor només llista plantilles de blocs (REST `/wp/v2/templates`). El filtre `theme_page_templates` només arriba al panell clàssic i a l'Edició ràpida (JS i PHP del nucli 7.1.2).
- **Correcció:**
  - `register_block_template()` (WordPress 6.7+, protegit amb `function_exists`), amb el mateix slug i `post_types ['page']`.
  - `template_include` respecta `template-canvas.php` quan la plantilla resolta és la nostra.
  - El CSS de pantalla completa està factoritzat. La via clàssica emet la mateixa cadena caràcter a caràcter, i una prova ho fixa.
  - Es manté Requires at least 6.5: en 6.5-6.6 la plantilla es tria a l'Edició ràpida.
- `requires_human_decision: true`: en 6.7+, la pantalla completa es pinta per template-canvas en lloc de la plantilla PHP.

### F4 · 404 d'imatges a l'amfitrió (T5) · severitat alta · confiança: verificada

- **Evidència.**
  - L'àtom `Avatar` pintava `/assets/…` sense passar pel resolutor. És l'avatar de la IAIA (`agentsSeed.js:46`) i el logo `logo-socdepoble-cuadrat-verd.svg`, que arriben al xat.
  - Al bundle, la funció minificada de l'Avatar no crida el resolutor.
  - Altres sumidors crus: UniversalCard, ResultatCerca, Multimèdia, els detalls i el primer render de l'editor.
- **Correcció:** `resolRecursPropi()` (idempotent; sense base torna el valor idèntic) allà on es pinta, als sis sumidors, amb proves.
- **Regressió corregida per l'orquestradora:** el mock total de `RealitatSection.test.jsx:11` no exportava `resolRecursPropi` (7 roges). Ara l'exporta.
- **Pendent:** recursos que no existixen a `public/` i que també fan 404 a socdepoble.org: `/assets/img/hero_*.png`, `que-es-socdepoble-{1..4}.jpg` i `08-mestre-obres-perfil-1024px.jpg`. Arreglar-los canvia píxels. `requires_human_decision: true`.

### F5 · `aria-hidden` amb el focus dins (T6) · severitat alta · confiança: verificada en jsdom

- **Evidència.**
  - Dins del Shadow DOM tancat, `BotoObriRail` llegia `document.activeElement`, que hi és sempre l'amfitrió (`ClosCaXat.jsx:569`). Per això el focus es quedava dins de `#app-grid-sidebar`.
  - `AppGridShell` no gestionava el focus.
  - El runtime és React 18.3.1, no Preact: la premissa de l'encàrrec era falsa.
- **Correcció:**
  - Guarda en `useLayoutEffect` a `AppGridShell`. Llig el focus amb `getRootNode().activeElement` i, si queda dins d'una columna tancada, el porta al botó d'obrir marcat amb `data-obri-columna` i `aria-controls`; si no n'hi ha, fa `blur()`.
  - `BotoObriRail` porta `aria-controls` i llig el focus a la seua arrel.
  - `aria-hidden` i `inert` no canvien.
- **Proves.** Mutants comprovats, i proves en Shadow DOM tancat que eren roges abans del canvi.
- **Pendent.** El fallback de `visibility` per a la columna dreta en Chrome 100-101 i Firefox 100-111, que no tenen `inert`. Toca `AppGridShell.css` i requerix aprovació (Llei del Píxel).

### F6 · Franja del node, /fedivers i nodes al perfil (T7-T9) · confiança: verificada en proves

- **Franja.** És un enllaç a `/fedivers`, amb pilot, frase segons l'estat, «Què és un node?» per al lector i fletxa, i una X germana de 44 px. La X es recorda a sessionStorage, només via `storage.js` i per a eixe node, i en tancar porta el focus a `main`.
- **Estat del pilot.** Surt de dades reals: mode remot, status del contingut core i `navigator.onLine`. No fa cap petició nova.
- **Textos:** «Connectat al node de {nom}», «Connectant amb el node de {nom}…» i «Sense connexió amb el node de {nom}», a les cinc llengües. Zero mentides belles: mai «Connectat» amb el pilot groc.
- **`/fedivers`.** Pàgina de text honesta, amb el Fedivers com a horitzó no implementat. Queda fora de SECTION_ORDER i de SYSTEM_PAGES.
- **«Els nodes».** Últim apartat de la persona a `/el-meu-perfil`, sense botons de gestió i sense hostname del backend.
- **Catàleg.** Espècimens a DesignSection (Pedra Seca §9).
- La franja passa d'uns 40 px a 44 px, un canvi de píxels ordenat.
- **Correcció de l'orquestradora:** `tests/lint_enxufe.test.mjs` posat al contracte nou (classes de la franja i família `amfitrio.*`).
- `requires_human_decision: true`: textos per estat i traduccions eu/gl. L'empremta de `fedivers` ja consta aprovada a `.agents/contingut_estructural.json` (comprovat a les 07:40).

### F7 · Esquelet del calendari (T10) · confiança: verificada en proves

Les vistes Setmana i Mes estan muntades darrere de `?vista=`. Sense el paràmetre, `/calendari`, el Mur i la Consola no canvien: les 16 proves antigues passen sense tocar-les.
- **Lògica pura:**
  - `periodes.js`.
  - `ocurrenciesEnRang`, additiu i amb una prova de coherència dia a dia amb `ocorreElDia`.
  - `disposicioCalendari.js`: clústers, columnes voraces amb expansió, carrils i «+N».
  - `estatCalendari.js`, compatible amb totes les URL d'avui.
- **Defectes coneguts:**
  - L'aritmètica de 24 h heretada d'`ocorreElDia` pot afegir o perdre l'últim dia d'un acte repetit que creua un canvi d'hora. Arreglar-ho toca el Mur i la Consola.
- **Defecte trobat en revisió:** dins de les vistes noves, la pastilla de data de les targetes et torna al calendari vell. L'arregla la fase visual (vegeu 261001_0445).
- La capa visual i el mòbil són a l'auditoria 261001_0445_auditoria_claude.

### F8 · Recursos gràfics per a WordPress.org · severitat baixa

Les icones del Mestre (`icon.svg`, `icon-128x128.png`, `icon-256x256.png`) són correctes. Els bàners (`banner-772x250.png`, `banner-1544x500.png`) tenen dos defectes:
- franges blanques o transparents dalt i baix: el verd no ocupa tot el llenç;
- el text toca la vora dreta: falten uns 6-8 % de marge.

Cal tornar-los a exportar amb fons ple. `wordpress-plugin/assets/` no entra als zips (llista blanca de l'empaquetador) i a WordPress.org va a la carpeta `/assets/` de l'SVN.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves del plugin** (`node --test`, PHP 8.4.25 de Studio): `enxufe-plugin`, `enxufe-empaqueta`, `enxufe-traduccio`, `enxufe-pantalla` i `tractor-enxufe` donen 81/81 després de la correcció. El tractor `node tooling/gates/tractor-enxufe.mjs` ix verd (E1-E4).
- **Suite completa** (`npx vitest run src`) després de la implementació: 298 de 300 fitxers i 4354 proves verdes.
  - Les 2 roges preexistents són de la barra mòbil «Telefonades» (`src/app/App.test.jsx:455` i `:488`), d'un altre torn.
  - Les 7 roges de `RealitatSection.test.jsx` les he corregides jo: ara el fitxer dona 10/10.
- **Suite completa al final del torn**, després de la fase visual: 304 de 305 fitxers i 4497 de 4499 proves. Només queden les 2 roges preexistents de «Telefonades».
- **`tests/lint_enxufe.test.mjs`:** 9 passades, 0 fallades i 2 «todo» de diagnòstic. Els todo són la llista congelada del torn del 260929 i 7 classes heretades d'App.jsx.
- **`node tooling/gates/design_guard.mjs --arrel=src`:** roig per dues infraccions en fitxers que cap front ha tocat i que són a HEAD sense canvis: `Dialeg.test.jsx:167` (inline-style en una prova) i `DocumentPrintPreview.jsx:24` (h1 dins d'una plantilla de cadena, fals positiu). `raw-color` baixa de 20 a 17.
- **Contrast del pilot**, recalculat pel revisor: verd sobre crom 3,74:1, groc sobre targeta fosca 3,78:1.
- **Pendents de verificació:**
  - WordPress real.
  - PHP 7.4: no hi ha binari; l'anàlisi és estàtica.
  - Navegadors de la base canònica.
  - Captures de la franja i de `/fedivers` (les farà l'orquestradora al tancament de la fase visual).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La causa del fatal a Gent de la Torre no està verificada al lloc. Cal el text de l'iframe `error_scrape` o el `debug.log`. Operativa recomanada:
  1. Desactivar la còpia vella abans d'activar la nova. La vella no té guarda.
  2. Si s'esborra des d'Extensions, el seu `uninstall.php` vell esborra nomPoble i poble: anotar-los abans, o esborrar la carpeta per FTP.
- El hook prohibix `npm run build:wp`, `empaqueta.mjs`, `chmod` i les escriptures a `.agents/`. Queden per al Mestre o MarIA:
  - regenerar `wordpress-plugin/dist`, que encara porta els 404 i el text vell de la franja;
  - `chmod 644 wordpress-plugin/includes/traduccio.php`;
  - reescriure la skill `core-empaquetat-wp`;
  - ESTAT, LEDGER i `tancament.mjs` del torn `torn_abb973ce`;
  - tornar a segellar les skills. El hook `segell-auto` diu «segell divergent» des de la skill nova `core-identitat-visual`, de les 04:14, aliena a este torn.
- El rebut `36203cb7` del torn ha quedat orfe pel reanomenament alié (`1000` → `0400`). Probablement impedirà tancar el torn net.
- La sonda temporal d'un revisor (`src/utils/sonda_revisio_calendari.test.js`) ja no hi és: l'ha esborrada el Mestre. A l'arrel encara queda `scratch-banner.py`, que és brossa solta contra AGENTS §3 i no ve d'este torn.
- No he pogut executar ESLint sobre els fitxers nous, fora de les llistes de `tests/lint_*`, ni les portes `tractor-*` que no són a la llista de lectures del hook.
- No he pogut actualitzar la memòria que diu que el runtime és Preact: és falsa, i el hook bloqueja escriure fora del repositori.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
