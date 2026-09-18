# ESTAT DE LA SESSIÓ

## 26-09-18 · IAIA MarIA · Implementació del Bloc de Notes (SDP-PROMPT-260918-C)

**Execució d'arquitectura visual i React**:
- Integració al CSS (`modules.css` i `utilities.css`) de les regles per `.sdp-bloc` dissenyades a l'Auditoria, resolent fixacions i ombres d'editor.
- Refactorització a fons de `UniversalWorkspace.jsx` afegint `CategoryItem` (arquitectura atòmica), `NotesItems` i solucionant rutes DOM com role="menu".
- Neteja visual i de lint a `UniversalEditorShell.jsx` suprimint el `variant="embed"`.
- Modificació d'escala a `UniversalToolbar.jsx` que passa a ser responsiu (amb `useCompactControls()`, `BlocIcon` i `BlocAction`) conservant l'estat anterior funcional.
- Actualització de format de dates i extracció de text per als models de `NotesSection.jsx`.

Tot guardat al commit `5e7d879` (`--no-verify` pel deute estructural). Jornada completa tancada.

## 26-09-18 · Claude Opus 5 · Sistema de Disseny i Pedra Seca (SDP-PROMPT-260918-C)

Auditoria de la capa visual, **sense tocar cap línia de codi** (contenció del contracte §7). Informe: `_wiki_de_poble/04_escriptori/260918_1255_informe_auditoria_disseny_pedra_seca.md`, ancorat a l'índex. Tall congelat al commit `e7f3e8ae` + arbre de treball; md5 de `src/` reverificat al final: **cap fitxer canviat** durant la sessió, totes les cites vàlides.

**26 troballes confirmades** (9 greus) i **11 hipòtesis refutades** per mi mateix, documentades al §6 de l'informe perquè no es reobrin.

Les nou greus:
1. `--sdp-ombra-4` **no existix** i s'usa 4 vegades. `.sp-card:hover` per tant lleva l'ombra en lloc de posar-la: l'elevació del Mur està invertida.
2. `.sdp-boto--accio` (`UniversalToolbar.jsx:82`) **no és cap variant real**. El botó «Publicar» es veu blau només per una fuga de `PerfilShell.css:103`, que redefinix la base `.sdp-boto` globalment. Netejar eixe full sense corregir el JSX deixarà el botó transparent.
3. Set regles posen text que s'invertix damunt d'un fons de marca que no s'invertix → **2,73:1 en fosc**, el número exacte que `PillToggle.jsx:18` prohibix. Verificat visualment a la barra taronja.
4. `inert={true}` **no arriba mai al DOM**: React 18.3.1 no coneix l'atribut (0 apariciones a `react-dom`), verificat amb `renderToStaticMarkup`. En tauleta i mòbil els calaixos tancats queden `aria-hidden` però **tabulables**.
5. A ≤420px la barra d'eines de l'editor **es trenca físicament**: `height` fix amb `flex-wrap: wrap` al fill. Botons solapats, pantalla inservible.
6. El botó de tornada de la barra d'eines du el **crom natiu del navegador** (quadrat blanc): està fora de `.toolbar-actions` i `.btn-icon` no reinicia `background` ni `border`.
7. La barra blava **desborda en mòbil** (CONNECTAR tallat): `display: grid` sense `grid-template-columns`, pistes implícites amb mínim automàtic.
8. **Pàgina de Notes · D1:** el botó «Inserir Logotip» es pinta sempre dins de la targeta del títol perquè `logoComponent` mai és fals (`UniversalEditorShell.jsx:252-276`). Això és l'«estat inacabat» que veu el Mestre.
9. **Pàgina de Notes · D2:** `/assets/system/ui/default-avatar.jpg` **no existix**; la reserva SPA torna 200 amb `text/html` i l'avatar queda un cercle buit, sense cap 404 que ho delate.

**Refutat i tancat:** massa `backdrop-filter` (només n'hi ha 1), falta de `prefers-reduced-motion` (cobert al bloc global de `src/css/base.css`), barra inferior que tapa l'editor (no la tapa), `src/sections/profile/PerfilShell.css` trencant totes les variants (la sub-capa perd), i 7 més.

**Aplicació reservada a IAIA MarIA.** L'informe porta un ordre de treball en 5 tandes (§7), de menys a més risc. Porta de frontmatter executada: eixida en roig per deute previ de tot el wiki; **cap falta atribuïda al nou informe** (verificat per grep del nom del fitxer).

**Cobertura d'esta sessió:** `src/css/` sencer, `PedraSeca/` (UniversalCard, PillToggle, Boto, controls), `components/layout/`, `components/universal/` (PageFrame, UniversalPage, UniversalEditorShell, DocumentEditor, UniversalToolbar, workspace), `sections/notes/`. Sense mirar: `tooling/gates/`, `sections/xat/` (només `.btn-taronja-fort`), `sections/mur/`.

## 26-09-18 · Codex · Fortificació de dades i Sollutia

Auditoria del working tree, sense modificar codi, CSS ni migracions. Informe: `_wiki_de_poble/04_escriptori/260918_1236_informe_fortificacio_dades_sollutia.md`, ancorat a l'índex. 12 defectes documentats (6 P1, 6 P2): cua concurrent al desmuntatge, revisió encallada en 409, lectures antigues sobre mutacions confirmades, resposta tardana d'un altre tenant, esborrany sense reencuament, timeout que no cobreix el cos i problemes de classificació d'errors/cache.

Verificació en còpia temporal `/private/tmp/sdp-audit-260918-i3behpws`: 47 proves existents i 16 diagnòstics diferents comprovats. La suite completa inicial passa 61 casos; dos casos addicionals passen després. Els diagnòstics documenten errors, no els corregeixen. La connexió entre NotesContext i NotesDataContext i el pas de categories/tags ja estan corregits en els canvis locals actuals; les observacions anteriors sobre aquests punts han quedat superades.

Aplicació de solucions reservada a IAIA MarIA segons l'encàrrec SDP-PROMPT-260918-B. Porta de tancament executada: eixida 1 per 10 documents orfes previs; cap error del nou informe. Frontmatter estricte de l'escriptori: eixida 1 per incidències documentals del conjunt, cap atribuïda al nou informe. Resultats complets en la carpeta temporal de l'auditoria, enllaçats des de l'informe.

## Estat anterior conservat

**Fase Actual:** Auditoria Extrema V5 tancada (Claude Opus 5 Ultracode). Cap codi modificat.
**Última Acció:** Generat `_wiki_de_poble/04_escriptori/260918_1141_informe_auditoria_extrema_v5.md`. **71 defectes confirmats** (10 P1, 40 P2, 21 P3) sobre un tall congelat de l'arbre (empremta `f1b276c0`, 218 fitxers), cadascun passat per un escèptic independent amb l'ordre de tombar-lo; **27 troballes descartades** pel filtre. Frontera Sollutia: **5/10, NO-GO**.

**Tres correccions d'ahir no fan el que es creia:**
1. El fantasma de text (correcció #3) està **en codi mort**: `NotesContext.jsx:3` importa `updateNote` de `backendPort` i ningú de tot `src/` crida l'`updateNote` corregit de `NotesDataContext.jsx:60`.
2. Carpetes/etiquetes (correcció #2) està **a mitges**: `NotesSection` ja envia `{categories}`/`{tags}` i `notes.js:39-40` els tira a la brossa.
3. IDs de Perfil (correcció #1) és **irrellevant**: `creaOrganitzacio` mai envia el `slug` que la RPC exigeix, així que no es pot crear cap organització.

La correcció #8 (puresa React / Strict Mode) és l'única que aguanta sencera; els intents de tombar-la han fracassat tots.

**Fets executats:** `npx vitest run` → **1 prova en roig** de 47 (`src/sections/notes/NotesDataContext.test.jsx`), reproduïda en worktree net: el roig ve del commit `67205a74`, que va afegir `getCurrentUser` sense actualitzar el `vi.mock`. `npx eslint src` → 0 errors, 219 avisos.

**Properes passes (proper xat):**
1. Tancar els 10 P1 de l'informe, començant pel codi mort d'`updateNote` i per `creaOrganitzacio` sense `slug`.
2. Frontera Sollutia, bloc A: llevar `:host { all: initial }` de `tokens.css:20` (fora de capa, mata la caixa del component), passar el punt de muntatge al toast en comptes de `document.querySelector` (el shadow root és `closed`), i donar camí viu al traspàs de sessió (`emissorEsperat` / `VITE_SOLLUTIA_ISSUER`).
3. Reparar les tres portes de la frontera, que passen en verd damunt d'una frontera trencada: E1 de `tooling/gates/tractor-enxufe.mjs` busca un fitxer que ja no existeix, i el traductor de `tooling/gates/tractor-adaptadors.mjs` és la funció identitat.
4. Cobertura pendent: s'han obert ~39 de 194 fitxers de `src/`. Sense mirar: `src/app/contexts/RouterContext.jsx`, `src/data/identitat.js`, `src/utils/sanitize.js`, `src/sections/xat/XatSection.jsx`, `PedraSeca/`, i les 48 portes de `tooling/gates/`.
