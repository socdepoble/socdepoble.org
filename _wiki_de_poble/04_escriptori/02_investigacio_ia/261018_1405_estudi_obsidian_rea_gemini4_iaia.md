---
type: informe
status: esborrany
description: Dissecció forense amb REA d'Obsidian 1.14.4 (Drag & Drop jeràrquic dO/jC sense llibreries i substitució de modals flotants per panells integrats Setting/WorkspaceLeaf) per a UniversalWorkspace.jsx.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5466c8bd-cf33-4317-b4e8-13e4ed571db9:5da8055c-74c3-4034-85ca-20525fc17681
---
# Estudi a Duo d'Arquitectura Obsidian (REA · Gemini 4 Argon + IAIA MarIA)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5466c8bd-cf33-4317-b4e8-13e4ed571db9:5da8055c-74c3-4034-85ca-20525fc17681 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T12:08:55.013Z |
| Modificació | 2026-10-18T12:10:00.000Z |
| Propietari | gemini |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (Antigravity) + IAIA MarIA (Duo Research) |
| Tokens consumits | ~28.500 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-18T12:08:55.013Z`: esborrany creat per a l'encàrrec a duo de dissecció d'Obsidian amb REA (`reverse-engineer-anything`).
- `2026-10-18T12:10:00.000Z`: completada l'extracció i enginyeria inversa estatica d'`obsidian-1.14.4.asar` (`app.js`, `app.css`, `enhance.js`), documentat el llibre major d'evidències REA i redactat el blueprint d'implementació per a `UniversalWorkspace.jsx`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Bloc I — Llibre Major d'Evidència REA (`reverse-engineer-anything` · Obsidian 1.14.4)

Per tal que cap agent haja d'especular sobre com funciona realment Obsidian per dins, s'ha inspeccionat i extret l'artefacte de producció instal·lat al sistema amfitrió mitjançant el servidor MCP **REA**:

| Artefacte / Operació REA | Identificador d'Evidència / Hash SHA-256 | Detall Tècnic Verificat |
| --- | --- | --- |
| **Binari principal analitzat** | `/Users/javillinares/Library/Application Support/obsidian/obsidian-1.14.4.asar` · SHA-256 `146ef8470d8cbb4a6db209bdc19bf2bad13350444186c0fd93c31087b142b92f` | Contenidor Electron ASAR d'Obsidian v1.14.4 amb **397 fitxers** interns. |
| **`analyze_javascript_application` (ASAR)** | `ev_b3ee1ef6a0a9c532d7a88c4e7c538f74a685583a23873c3ef790ca6f293b0d18` (pare: `ev_70b90edb5761dc7352830b4864f5dc74cc9cdf89367902d6ee7b027c4197db8a`) | El `package.json` intern declara únicament 2 dependències natives (`btime`, `get-fonts`). **Zero llibreries externes de Drag & Drop** (`@dnd-kit`, `react-beautiful-dnd`, `sortablejs` no existeixen). |
| **Inventari de mòduls ASAR** | `ev_f4307aae5f5a93d9bf36d374b603c936a9a87b3fb8e3b82e79be6b32739e1292` | Cens de tots els bundles JS/CSS empaquetats (`main.js`, `app.js`, `enhance.js`, `app.css`, `sim.js`). |
| **`analyze_javascript_application` (`enhance.js`)** | `ev_2c8253d315bae996a5bbf7938ebc0234c7a5cbe177972eebdc6d1a424d28723b` (pare: `ev_f038a22dff0670c73c3ca90e5b590338003a3433fd08a4fada64e9cf7357dc0d`) | Helpers de baix nivell al DOM (`findSelfOrParent`, `draggable`, `is-grabbing`, gestió de coordenades i finestres). |
| **`extract_artifact` (Extracció íntegra)** | `ev_8d04274837d46c4404b5ff918ba31faef081f29d7bbc139b4841073f6c14d6c8` · Manifest `agm_3d65731ebf232070d80f930f144d0d22d429b491f96ac68ebedb81b722ae71f7` · Extracció `aex_0d80ada056faba6e65ccc7435e3e50c01f9dcaa154f8887501d5c83aaa57a11e` | Extracció verificada de:<ul><li>`app.js`: `art_fd9d39d562a822fcf6c1dd94c67dec008fcdec40b34d170727df8bb01353dc13` (3.942.126 B · SHA-256 `958ce57fe22f87fdf121546e46dfccd9c8ee971ce3fd8f801d60d4ece39a2df9`)</li><li>`app.css`: `art_df8b22e7d53105f2236efd4de44df9d494b750b69f42fb8bd3bd4842aed0f9bb` (668.223 B · SHA-256 `866e50ac84dd8ad2775e0047ebd3ec5bd03e5af722aff259e6c4ea3cec42d7ba`)</li><li>`enhance.js`: `art_c5c067c90b50a0b63fc47b77677b79c01b169ae2edefc6912c5a9a5883fad075` (13.229 B · SHA-256 `dae6559565e737174c7063a16f7214a2795330e0262577d3ecc59a1b53caebd8`)</li></ul> |

---

### Bloc II — Eix 1: Com Resol Obsidian el Drag & Drop i la Reordenació d'Arbres sense Llibreries

L'anàlisi d'`app.js` demostra que Obsidian utilitza **dos motors propis, lleugers i deterministes** escrits directament contra el DOM i les mètriques `getBoundingClientRect()`, separant la **reordenació lineal de seccions/llistes** de la **reordenació i anidament jeràrquic a l'arbre de navegació**.

#### 1. Motor A — Reordenació Lineal en Lloc (`jC`, `UC`, `_C`, `GC`, `KC` · `app.js` offsets `854800..860500`)
Usat per a reordenar pestanyes, seccions d'ajustos, propietats i llistes d'1 nivell:
- **Esdeveniments de Punter + Long-Press Tàctil (`250ms`):** Escolta `mousedown` (botó primari `0 === e.button`) i `touchstart` (`1 === e.touches.length`). En pantalles tàctils no bloqueja l'scroll vertical: arma un temporitzador de **`250ms`** (`h = c.setTimeout(..., 250)`). Si el dit es desplaça abans dels `250ms`, cancel·la el drag i deixa fer scroll natiu; si compleix els `250ms`, executa `navigator.vibrate && navigator.vibrate(200)` i inicia el drag.
- **Histèresi Euclidiana al Quadrat (`p*p + w*w >= i*i`):** Amb el ratolí, no inicia l'arrossegament al primer píxel de tremolor; calcula `p = e.clientX - u`, `w = e.clientY - d` i només arrenca quan la distància al quadrat supera el llindar `i*i`.
- **Fantasma Flotant i Permutació en Lloc:**
  - Clona el node arrossegat dins d'un contenidor `div.drag-reorder-ghost > .mod-dragged-item` (`app.css:116499`, `position: fixed; pointer-events: none; z-index: var(--layer-dragged-item)`).
  - Amaga visualment el node original afegint-li `.drag-ghost-hidden` i posa `document.body.classList.add("is-grabbing")`.
  - Mentre el punter es mou, compara `v` (`clientY`) amb el centre `T.top + T.height / 2` dels germans adjacents (`previousElementSibling` / `nextElementSibling`) i mou el node real amb `n.insertBefore(t, s)` o calcula l'índex destí `N(k, C)` sense recrear l'arbre.
- **Auto-Scroll de Vora a 60 FPS amb Suavitzat Exponencial (`setInterval(T, 1000/60)`):**
  - Busca l'ancestre scrollable més proper via `UC(n)` (`scrollHeight > clientHeight`).
  - Defineix una zona sensible superior i inferior de **`M = Math.min(50, S.height / 3)`** (`50px` o un terç de l'alçària del contenidor).
  - Calcula la velocitat normalitzada `k = 10 * Math.clamp((v - (S.bottom - M)) / M, -1, 1)` i aplica un filtre exponencial `C = Zb(C, k)` a cada tick de `16,6ms` (`1000 / 60`).

#### 2. Motor B — Arbre Jeràrquic, Carpetes i Reordenació (`dO`, `fO`, `vO`, `yO` · `app.js` offsets `1496500..1500500` + `DragManager` a `1736935`)
Aquest és el secret principal de l'arbre lateral d'Obsidian (`TreeView` / `FileExplorer`): com permet **reordenar entre germans** i alhora **ficar elements dins de carpetes** sense que la UI tremole ni es trenquen les jerarquies.

1. **Hit-Testing d'Una Sola Passada amb Poda del Subarbre Arrossegat (`dO(e, t)` a `app.js:1496548`):**
   - Recorre en pre-ordre els nodes visibles de l'arbre (`tO(i, ...)`).
   - **Regla d'or anti-cicles en temps de recorregut:** `if (t.selectedDoms.has(r)) return !0;` — si el node visitat és un dels nodes que s'estan arrossegant, retorna `true` per indicar al visitador que **no entre als seus fills**. Així és matemàticament impossible detectar com a destí cap descendent del propi node arrossegat!
2. **La Geometria Exacta `5% / 90% / 5%` sobre Carpetes (`p / u < 0.9` · `app.js:1496920..1497410`):**
   - Per a la fila `.tree-item-self` sota el cursor amb rectangle `s = r.selfEl.getBoundingClientRect()`:
     - Semialçària: $u = \frac{s.\text{height}}{2}$
     - Centre vertical de la fila: $h = s.\text{top} + u$
     - Distància vertical del punter al centre: $p = |e.\text{clientY} - h|$
     - Direcció: $d = (e.\text{clientY} > h) \text{ ? } \texttt{"after"} : \texttt{"before"}$
   - **Cas 1 — El node sota el punter és una Carpeta/Branca plegable (`JL(r) && r.collapsible`):**
     - **Zona Central del 90% ($\frac{p}{u} < 0.9$, és a dir, del 5% al 95% de l'alçària de la fila):**
       - Marca `overlapsNode = true` (`v = !0`).
       - Il·lumina la fila sencera de la carpeta amb `.tree-item-self.is-being-dragged-over` (`app.css:327259`: `background: color-mix(in oklch, var(--interactive-accent) 10%, transparent)`).
       - Amaga la línia horitzontal `.drop-indicator` (`a = !1`).
       - **Auto-expansió per hover a `750ms` (`app.js:1498660`):** Si la carpeta està plegada (`o.collapsed && !gO`), inicia `this.openNodeTimeout = r.setTimeout(() => { o.setCollapsed(false, true); }, 750)`. Si el cursor ix de la carpeta abans dels `750ms`, cancel·la el timeout netament (`clearTimeout`).
     - **Franja Superior del 5% ($e.\text{clientY} < h$ i $\frac{p}{u} \ge 0.9$):**
       - Marca `overlapsNode = false, placement = "before"`.
       - Insereix l'element com a **germà anterior** de la carpeta (`parentNode = r.parent, idx = indexOf(r)`) i mostra la línia `.drop-indicator.is-active` al caire superior (`s.top`).
     - **Franja Inferior del 5% ($e.\text{clientY} > h$ i $\frac{p}{u} \ge 0.9$):**
       - **Subcas genial d'Obsidian (`!r.collapsed`):** Si la carpeta està **oberta/desplegada**, apuntar al 5% inferior de la capçalera de la carpeta **NO** envia l'element al final de tot el subarbre de la carpeta (que podria estar 50 línies més avall), sinó que l'insereix com a **primer fill de la carpeta oberta** (`parentNode = r, idx = 0`) i **sagna horitzontalment la línia `.drop-indicator`** fins a la columna dels fills (`x = f.info.childLeft + f.info.childLeftPadding`)!
       - Si la carpeta està **plegada** (`r.collapsed`), l'insereix com a **germà immediatament posterior** (`parentNode = r.parent, idx = indexOf(r) + 1`).
   - **Cas 2 — El node sota el punter és una Fulla (`!r.collapsible`):**
     - Tota la meitat superior ($e.\text{clientY} \le h$) és `placement = "before"` (`idx = indexOf(r)`).
     - Tota la meitat inferior ($e.\text{clientY} > h$) és `placement = "after"` (`idx = indexOf(r) + 1`).
3. **Supressió de No-Ops Visuals (`yO` · `app.js:1498087..1498450`):**
   - Si només s'arrossega 1 element (`1 === t.selectedDoms.size`) i el destí calculat és:
     - `"before"` o `"after"` del mateix element (`o === c`), o
     - `"after"` del seu germà immediatament anterior (`o === oO(c)`), o
     - `"before"` del seu germà immediatament posterior (`o === iO(c)`),
     aleshores Obsidian desactiva la línia `.drop-indicator` (`a = !1`) perquè l'usuari perceba amb honestedat que deixar-lo anar allà és una operació nul·la (no-op).
4. **Geometria CSS del `.drop-indicator` (`app.css:331470`):**
   ```css
   .drop-indicator {
     position: absolute;
     left: 0;
     width: 100%;
     height: 0;
     border: 2px solid var(--interactive-accent);
     pointer-events: none;
   }
   .drop-indicator:not(.is-active) {
     display: none;
   }
   ```
   El posicionament es fa amb una sola escriptura d'estil en línia sobre l'únic node `.drop-indicator` del contenidor: `top: ${y}px; left: ${x}px; width: ${containerWidth - x}px;`, on `x` reflecteix la profunditat jeràrquica del `parentNode` destí!

---

### Bloc III — Eix 2: Com Resol Obsidian els Panells d'Ajustos Integrats i l'Eliminació de Modals Petits

#### 1. Diagnòstic del Problema Actual a `UniversalWorkspace.jsx` (`WorkspaceSettingsDialog`, línies 319–403)
Actualment, `UniversalWorkspace.jsx` invoca `<Dialeg mida="s">` per a renderitzar `WorkspaceSettingsDialog`:
- Constricció espacial severa (`mida="s"`), que obliga a encabir 4 sliders d'amplada de columna en un `grid-cols-2` estreta on les etiquetes i els valors (`156px–360px`) competeixen per l'espai.
- La secció «Carpetes a la vista» queda tancada dins d'un micro-scroll `max-h-56 overflow-y-auto` (`224px` d'alçària màxima), tallant la visió del conjunt i impedint reordenar còmodament les carpetes.
- Trenca la llei d'escriptori continu de Pedra Seca superposant un backdrop fosc sobre el llenç de treball quan l'usuari precisament vol ajustar l'amplada de les columnes **mentre veu com respiren**.

#### 2. Anatomia Exacta d'Obsidian 1.14.4 (`Setting` class `rT` a `app.js:1263641` i `app.css:84881, 161363..175200`)
Obsidian estructura els ajustos i vistes d'configuració sobre tres pilars arquitectònics verificats a `app.js` i `app.css`:

1. **Contenidor Centrat d'Ample Respirable (`--setting-group-max-width: 700px` · `app.css:84881, 162573, 163540`):**
   - El panell de contingut (`.vertical-tab-content` o `.workspace-leaf-content`) ocupa el 100% de l'alçària del panell de treball (`height: 100%; overflow-y: auto`) i aplica un marge lateral elàstic calculat per CSS:
     ```css
     --setting-group-max-width: 700px;
     --setting-group-center-offset: calc((100% - var(--setting-group-max-width)) / 2);
     padding-inline: max(var(--size-4-8), var(--setting-group-center-offset));
     ```
   - Dins seu, cada bloc temàtic és un `.setting-group` (`width: 100%; max-width: 700px; margin-inline: auto`) que agrupa les files dins d'una targeta contínua `.setting-items` (`background-color: var(--background-primary-alt); border-radius: var(--radius-l)`), separant cada fila amb un divisor subtil `::before` d'`1px` (`left: var(--setting-items-padding-x); right: var(--setting-items-padding-x)`).
2. **Fila Horitzontal `Setting` (`rT` · `app.js:1263641` i `.setting-item` · `app.css:166102, 173950..174600`):**
   - Cada opció d'ajust és un node `.setting-item` construït amb aquesta estructura exacta:
     ```html
     <div class="setting-item [mod-toggle]">
       <div class="setting-item-info">
         <div class="setting-item-name">Títol de l'ajust</div>
         <div class="setting-item-description">Explicació clara i concisa en text esmorteït.</div>
       </div>
       <div class="setting-item-control">
         <!-- Sliders, toggles, selects o botons alineats a la dreta -->
       </div>
     </div>
     ```
   - `.setting-item-info` té `flex: 1 1 auto; min-width: 0; margin-inline-end: var(--size-4-4)`.
   - `.setting-item-control` té `flex: 1 1 auto; display: flex; justify-content: flex-end; align-items: center; gap: var(--size-4-2); text-align: end`.
3. **Container Query Responsiva Intel·ligent (`@container (max-width: 400px)` · `app.css:167890`):**
   - Si el panell s'estreny per sota de `400px`, Obsidian utilitza `@container (max-width: 400px)` per passar a `flex-direction: column` **únicament** les files amb controls amples (`input`, `select`, `button` de text), però exclou explícitament `:not(:is(.mod-toggle, .mod-navigable, .mod-action, .setting-item-heading, .mod-list *))`, mantenint sempre els interruptors (`mod-toggle`) i llistes reordenables (`mod-list`) en una sola línia horitzontal neta!

---

### Bloc IV — Blueprint d'Implementació per a Pedra Seca (`UniversalWorkspace.jsx`)

A continuació es detalla l'especificació exacta i llesta per a implementar per part de Claude Code a `src/components/universal/workspace/` sense afegir cap dependència a `package.json`.

#### Pas 1 — Crear el Hook Ultraluger `useTreeDragReorder.js` (Eix 1)
- **Fitxer proposat:** `src/components/universal/workspace/useTreeDragReorder.js` (~110 línies, 0 llibreries).
- **Contracte d'entrada:**
  - `items` / `categories` visibles a `CategoryBranch` (`UniversalWorkspace.jsx:900-1080`).
  - `collapsedCategories`: `Set` d'IDs plegats.
  - `onToggleCategory(id, forceOpen)` per a l'auto-expansió a `750ms`.
  - `onMoveNode({ sourceId, targetParentId, targetIndex, placement })`.
- **Comportament exacte (model `dO` + `jC` d'Obsidian):**
  1. **Inici per Pointer Events (`onPointerDown`):** Registra `(startX, startY)`. En `pointerType === 'touch'`, exigeix `250ms` de *long-press* abans d'activar el drag; en `mouse`, exigeix superar la distància euclidiana al quadrat $\Delta x^2 + \Delta y^2 \ge 25$ (`5px`).
  2. **Hit-Testing `5% / 90% / 5%` sobre `[data-sdp-tree-node-id]`:**
     - Obté `rect = nodeEl.getBoundingClientRect()`, `u = rect.height / 2`, `h = rect.top + u`, `p = Math.abs(clientY - h)`.
     - Si el node sota el punter és el mateix `sourceId` o un descendent seu (`isDescendantOf(nodeId, sourceId)`), l'ignora.
     - Si el node és una carpeta/categoria (`data-sdp-collapsible="true"`):
       - Si `p / u < 0.9` (**90% central**): activa `dragOverFolderId = nodeId`, amaga la línia `.sdp-drop-indicator` i, si la carpeta està plegada, programa `setTimeout(() => expandCategory(nodeId), 750)`.
       - Si `clientY < h && p / u >= 0.9` (**5% superior**): mostra `.sdp-drop-indicator` a `top = rect.top` amb el sagnat `left = depth * 16 + 12` (`placement = 'before'`).
       - Si `clientY > h && p / u >= 0.9` (**5% inferior**): si la carpeta està **desplegada**, apunta com a **primer fill** (`targetParentId = nodeId, targetIndex = 0`) i sagna la línia `.sdp-drop-indicator` un nivell més endins (`left = (depth + 1) * 16 + 12`); si està **plegada**, apunta com a germà posterior (`placement = 'after'`).
  3. **Auto-Scroll a 60 FPS:** Dins del contenidor `nav-scroll-body` de `NavigationColumn`, quan el punter entra als `48px` superiors o inferiors, desplaça `scrollTop` suaument a cada `requestAnimationFrame`.

#### Pas 2 — Substituir `WorkspaceSettingsDialog` per `WorkspaceSettingsPanel` Integrat (Eix 2)
- **Fitxer a modificar:** `src/components/universal/workspace/UniversalWorkspace.jsx` (línies 319–403 i punt de muntatge a `DetailColumn` / `UniversalWorkspaceInner`).
- **Eliminació del Modal Flotant:**
  - Suprimir l'ús de `<Dialeg mida="s">` a `WorkspaceSettingsDialog`.
  - Quan `state.settingsOpen === true`, el panell central de contingut (`DetailColumn`, o en vista compacta el panell actiu) renderitza directament `<WorkspaceSettingsPanel />` a tota alçària (`h-full flex flex-col bg-[var(--theme-bg-main)]`), conservant intacte en memòria l'`selectedItemId` perquè en tancar els ajustos (o prémer `Esc` / clicar qualsevol document a l'arbre lateral) l'usuari torne a l'instant al document on estava.
  - **Avantatge immediat de UX:** Com que `<WorkspaceSettingsPanel />` viu dins de l'espai de treball continu al costat de `NavigationColumn`, `ListColumn` i `InspectorColumn`, quan l'usuari mou els sliders d'«Amplada de les columnes» **veu en temps real i sense cap teló modal al damunt com s'eixamplen o s'estrenyen les columnes del seu espai de treball!**
- **Estructura Visual de `<WorkspaceSettingsPanel />` (inspirada en `.setting-group` i `.setting-item` d'Obsidian):**
  1. **Capçalera Integrada de 44px (`h-[44px] border-b border-[var(--theme-border)] px-4 flex items-center justify-between`):**
     - Esquerra: Icona `Settings` + títol `Ajustos de l'espai de treball` + subtítol contextual de la secció (`model.title`).
     - Dreta: Botó secundari `Restaura valors de fàbrica` + botó primari `Tornar al document (Esc)`.
  2. **Cos Centrat Respirable (`flex-1 overflow-y-auto px-6 py-8` amb contenidor intern `max-w-[700px] mx-auto space-y-8`):**
     - **Secció 1 (`setting-group`): Amplada i Geometria de les Columnes**
       - Targeta contínua amb 4 files horitzontals `.sdp-setting-item` (`flex items-center justify-between gap-6 py-4 px-5 border-b last:border-b-0`):
         - Esquerra (`.sdp-setting-info`): Nom de la columna (`Navegació`, `Llista`, `Detall (mínim)`, `Inspector`) + descripció amb el rang permès (`156 px – 520 px`).
         - Dreta (`.sdp-setting-control`): Slider horitzontal ample (`w-44 accent-[var(--theme-accent-primary)]`), indicador numèric `tabular-nums font-mono text-[13px] w-14 text-right` i botó d'1 clic per a restaurar el valor per defecte de la columna.
     - **Secció 2 (`setting-group`): Visibilitat i Reordenació de Carpetes (`Carpetes a la vista`)**
       - Targeta contínua a tota alçària (sense el `max-h-56` que tallava la llista!) on cada carpeta d'arrel és una fila `.sdp-setting-item` reordenable amb nansa de Drag & Drop (`GripVertical`) a l'esquerra, icona + nom + comptador d'elements al centre, i interruptor d'estat (`Visible` / `Oculta`) a la dreta, més el botó global `Mostra totes les carpetes` a la capçalera del grup.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Evidència REA verificada i reproduïble:**
  - `ev_b3ee1ef6a0a9c532d7a88c4e7c538f74a685583a23873c3ef790ca6f293b0d18` (`analyze_javascript_application` sobre `obsidian-1.14.4.asar`).
  - `ev_8d04274837d46c4404b5ff918ba31faef081f29d7bbc139b4841073f6c14d6c8` (`extract_artifact` d'`app.js`, `app.css`, `enhance.js`).
  - Sessió binària de REA tancada netament amb `close_binary` (`{"result": null}`).
- **Portes Canòniques del Repositori:**
  - `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261018_1405_estudi_obsidian_rea_gemini4_iaia.md`: **PASS**.
  - `node tooling/gates/porta-autoritat.mjs --torn torn_5466c8bd-cf33-4317-b4e8-13e4ed571db9`: **PASS**.
  - `node tooling/gates/porta-olivera.mjs`: **PASS**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Distinció entre fets observats i disseny:** Els mecanismes d'Obsidian (`jC` a `app.js:854800`, `dO` i la geometria `p / u < 0.9` + timer `750ms` a `app.js:1496548`, i `Setting` `rT` a `app.js:1263641` + `.setting-group` a `app.css:163540`) són fets empírics extrets de l'artefacte `obsidian-1.14.4.asar`. L'adaptació en React (`useTreeDragReorder.js` i `WorkspaceSettingsPanel` a `UniversalWorkspace.jsx`) és la traducció arquitectònica dissenyada per a Pedra Seca.
- **Frontera d'escriptura (`scope: documents`):** Aquest estudi es lliura a l'Escriptori sense tocar `src/` en aquest torn perquè Claude Code el puga executar en la seua fase de codi sense cap conflicte d'autoritat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_d_or_memoria_episodica]]
- [[261018_1220_pla_implementacio_sessio_usuari_i_poda]]
- [[261018_1220_prompt_claude_codex_sessio_i_poda]]
- [[261018_1241_auditoria_gemini4]]
- [[261018_1251_auditoria_claude]]

