---
type: informe
status: generat
description: Auditoria extrema post-migració del catàleg Pedra Seca, UniversalWorkspace, router, App i frontera Sollutia. Només lectura.
tags:
  - arquitectura
  - disseny
  - sollutia
---

# Informe — Auditoria Extrema Global (Post-Migració) · Claude

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-20260918-EXTREMA-02 (el 01 l'ocupa l'informe paral·lel de Codex, [[260918_0243_informe_auditoria_extrema_postmigracio]]) |
| Respon a | [[20260918_0233_PROMPT_Auditoria_Extrema_Global]] (SDP-PROMPT-20260918-EXTREMA) |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 03:00 |
| Modificació | 2026-09-18 03:00 |
| Agent redactor | Claude Code (Fable 5.1), com a auditor del [[Consell de la Petorreta]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Branca / commit auditat | `backup-notes-publish` · HEAD `5341002d` amb l'arbre de treball sense commitar (35 fitxers modificats o esborrats, 36 sense seguiment) |
| Abast | només lectura. Cap fitxer de `src/`, `tooling/` ni `package.json` modificat, afegit ni esborrat. Escriptures: este informe i la seua línia d'ancoratge a [[00_index_escriptori]]. |

## Vincles

- [[00_index_escriptori]]
- [[20260918_0233_PROMPT_Auditoria_Extrema_Global]]
- [[260918_0243_informe_auditoria_extrema_postmigracio]] (Codex, mateixa missió)
- [[260918_0131_INFORME_Auditoria_Global]] (Claude, auditoria anterior)
- [[UniversalWorkspace]]
- [[Sollutia_Backend]]
- [[pedra_seca]]

## Dictamen executiu

El sistema **no** està en un estat net: està en un estat que *compila a l'editor però no al navegador*. La migració ha deixat el catàleg de Pedra Seca (el Sistema de Disseny) sencer inoperatiu, ha trencat la cadena de build i ha deixat dues portes en roig. A banda, hi ha una fragilitat de contracte amb Sollutia que ningú havia citat fins ara i que deixa `/admin` i `/realitat` girant per sempre quan el backend no és Supabase.

Quatre aturadors, per ordre:

1. **El catàleg `/disseny` és mort.** 26 dels 28 espècimens importen amb sis nivells de `../`, que resolen fora del repositori. Cada `lazy()` rebutja i el panell de detall pinta «☠️ El detall s'ha esfondrat». `porta:importacions` en roig amb 31 falles. Tres espècimens, a més, usen estat o components que no existixen (`visible`, `modal`, `FormulariAlta`).
2. **`npm run build` i `npm run porta` no poden acabar.** `tooling/gates/build-seo-manifest.mjs` s'ha esborrat de l'arbre de treball, però `package.json` l'encadena a `build` i `run-portes.mjs` el llista com a porta. La primera ordre de CI mor abans que Vite arranque.
3. **Amb un backend Sollutia sense la capacitat `sessio`, el rol mai es resol i el client expulsa la sessió pel seu compte.** `SessionProvider` ix de l'efecte de rol si no hi ha capacitat i `RequireAuth` espera un rol que no arribarà. I quan el JWT s'acosta a la caducitat, `renovaAra()` crida `logout()` sense capacitat de renovació: la sessió injectada per l'amfitrió mor a mans del propi component.
4. **Les portes que havien de vigilar el catàleg vigilen fitxers esborrats.** `tractor-cataleg.mjs` llig `Pagina*.jsx` (ja no existixen) i `DesignSectionContent.jsx` (1.494 línies que cap mòdul importa), i falla per una entrada de `registre.js` fora del seu propi vocabulari.

Sobre la pregunta central de la missió: **no hi ha cap bucle infinit** entre `UniversalWorkspace`, `WorkspaceContext` i `useSearchParams`. Sí que hi ha una reconciliació que s'executa a **cada render** per culpa d'un `|| []` i un reductor que sempre torna objecte nou; és cost, no cicle. La secció «Anàlisi de cicles» explica les condicions exactes que el convertirien en bucle.

## Contracte de realitat i mètode

- **Pedra Seca** s'interpreta en tot l'informe com el Sistema de Disseny (`src/components/PedraSeca/` i el seu catàleg a `src/sections/disseny/`).
- Cap eina de xarxa. Tot el que no s'ha executat es marca [SUPÒSIT]. Les lectures estàtiques es citen `ruta:línies`.
- L'app corre sobre **Preact via `preact/compat`** (`vite.config.js:34-41`). Diverses conclusions depenen d'això i es diuen explícitament (StrictMode, `lazy`).
- He llegit l'informe paral·lel de Codex abans de redactar el meu. On coincidim ho dic i cite el seu identificador; les troballes marcades **[NOU]** no hi apareixen.

## Bateria mecànica executada

| Comprovació | Resultat | Lectura |
| --- | --- | --- |
| `node tooling/gates/tractor-importacions.mjs` | **FALLA · 31** | 26 fitxers de `cataleg/detalls/` importen `../../../../../../components/…`. Resolt amb `path.resolve`: `…/Som de Poble/components/PedraSeca/index.js`, fora del repositori. |
| `node tooling/gates/tractor-cataleg.mjs` | **FALLA · 1** | C3 «UniversalWorkspace» és al registre però `universal/workspace/index.js` no és a l'abast de la porta. |
| `npx eslint src --quiet` | **9 errors** | `no-undef` a `EspecimenAlerta.jsx:17-22` i `EspecimenDialeg.jsx:18-21`; `eol-last` a `EspecimenMolla.jsx:1`. |
| `npx eslint` nucli (App, contexts, workspace, DesignSection) | 0 errors · 8 avisos | residus de variables no usades. |
| `npx vitest run` | 10 fitxers · 44/44 | verd, però cap test toca els 28 chunks nous ni la resolució dels seus imports. |
| `ls tooling/gates/build-seo-manifest.mjs` | **no existix** | esborrat al working tree (`git status`: `D`), referenciat 4 vegades. |
| `git status --short` | 35 canviats/esborrats · 36 sense seguiment | els 28 espècimens nous no estan ni afegits a l'índex de Git. |

## Relació amb l'informe de Codex

Confirme per lectura independent: C-01 (imports), C-02 (estat no declarat; jo n'afegisc un tercer cas), C-04 (`basename` duplicat a `useSearchParams`), C-06 (`refresh()` penjat), A-03 (`lazy` no recuperable), A-04/A-05 (focus), A-06 (historial `replace`), A-07 (context repinta a cada tecla), M-01 (monòlit i espècimens orfes).

Aporte com a **[NOU]**: la cadena de build trencada (C-3 ací), el contracte de rol/renovació amb Sollutia (C-4), la reconciliació a cada render pel `|| []` (A-1), el reductor sense bail-out (A-2), l'esdeveniment `sdp:refresh-data` sense cap escoltador (A-9), la porta de catàleg que llig fitxers esborrats (A-6), les dues fonts de veritat del catàleg i els títols sense accents (A-7), l'`aria-expanded` absent a la barra lateral i el focus perdut en tancar la cerca (A-5), i que `StrictMode` és un `Fragment` sota Preact (M-1).

---

## 1 · Rendiment i re-renderitzats

### A-1 · [NOU] · Advertència — La reconciliació del workspace corre a cada render per un `|| []`

`UniversalWorkspace.jsx:43-46`:

```jsx
navigationGroups={model.navigationGroups || []}
categories={model.categories || []}
items={model.items || []}
```

`DesignSection` no passa `navigationGroups` (`DesignSection.jsx:31-35`), així que **cada render** de `UniversalWorkspace` crea un `[]` nou. A `WorkspaceContext.jsx:30-44` `normalizedCategories` depén de `[categories, navigationGroups]` → es recalcula; `categoryById` (`:53-56`) també; i l'efecte de reconciliació (`:117-162`) té `categoryById`, `normalizedCategories` i `normalizedItems` a les dependències → **s'executa a cada render del pare**. El `value` del context (`:164-182`) també canvia d'identitat a cada render, així que les tres columnes repinten sempre.

Quan repinta el pare? `DesignSection` consumix `useSearchParams` (`DesignSection.jsx:28`), i el `contextValue` del router canvia en **qualsevol** `navigate` de l'app (`RouterContext.jsx:41-75`): cada canvi d'URL, encara que siga aliè, fa passar el workspace per l'efecte de reconciliació complet.

No és bucle: després de la primera reconciliació `needsInitialSelection` és `false`, `pendingItemId` és `null` i la selecció no canvia, així que no es fa `dispatch`. Però és treball O(n) inútil a cada render, i és una mina si algú afegix un `dispatch` incondicional.

Esmena (a `UniversalWorkspace.jsx`, capçalera i línies 43-46):

```jsx
const CAP = Object.freeze([]);
// …
navigationGroups={model.navigationGroups ?? CAP}
categories={model.categories ?? CAP}
items={model.items ?? CAP}
```

I a `DesignSection.jsx:62-63`, pujar `labels` i `renderDetail` fora del render (constant de mòdul i `useCallback` sense dependències).

### A-2 · [NOU] · Advertència — El reductor no fa bail-out i el filtre depén de tot l'estat

`workspaceState.js:99-116` (`selection/sync`) i `:118-125` (`column/toggle`) tornen sempre un objecte nou, encara que cap camp canvie. Com que `DesignSection` passa `selection={{ categoryId, itemId }}` (`DesignSection.jsx:60`) i l'efecte de sincronització (`WorkspaceContext.jsx:107-114`) despatxa a cada canvi d'URL, cada navegació produïx un `state` nou → `filteredItems` (`:61-64`, depén de `state` sencer) es recalcula i el `value` es reconstruïx. Plegar una columna també refiltra la llista, perquè `collapsed` viu al mateix `state`.

A més `selectCategory` (`:79-91`) depén de `state` sencer: cada tecla a la cerca crea un `selectCategory` nou, i amb ell un `value` nou.

Esmena mínima al reductor:

```js
case 'selection/sync': {
  // … càlcul de nextCategoryId / nextItemId igual …
  if (nextCategoryId === state.activeCategoryId
      && nextItemId === state.activeItemId
      && nextNeeds === state.needsInitialSelection
      && nextPending === state.pendingItemId) return state;
  return { ...state, /* … */ };
}
```

I al context, memoritzar el filtre sobre les tres claus que l'afecten:

```js
const filteredItems = useMemo(
  () => filterWorkspaceItems(normalizedItems, state),
  [normalizedItems, state.activeCategoryId, state.query, state.activeTagIds]
);
```

### A-3 · Advertència — `/disseny` esborra l'historial en accions d'usuari (confirma Codex A-06)

`DesignSection.jsx:37-54` rep `meta` i **no el llig**; sempre crida `setParams(next)` i `useSearchParams` posa `replace: true` per defecte (`RouterContext.jsx:105`). El comentari de `DesignSection.jsx:52-53` diu que el router ha de distingir «push d'usuari i replace de reconciliació»: el codi fa el contrari del comentari. `NotesSection.jsx:76-78` ho fa bé. Conseqüència: el botó «Arrere» del navegador ix de `/disseny` en compte de tornar a l'espècimen anterior.

```jsx
const handleSelectionChange = useCallback((selection, meta) => {
  // … guarda d'igualtat igual …
  setParams(next, { replace: meta?.reason !== 'user' });
}, [params, setParams]);
```

### A-4 · Advertència — Un chunk `lazy` que falla no es recupera mai (confirma Codex A-03, amb el detall del host)

`preact/compat/src/suspense.js:252-273`: `lazy()` guarda `prom` i `error` en clausura i no els reinicia mai. Sota Preact (`vite.config.js:36-40`) tots els `lazy()` d'`App.jsx:14-36` i de `detailRegistry.jsx:4-31` tenen este comportament. Els dos botons de recuperació, «Intentar de nou» (`App.jsx:487`) i «Reintenta» (`SlotErrorBoundary.jsx:42,62`), només reinicien l'estat del límit: el component `Lazy` torna a llançar el mateix `error`. `host.js:72-78` escolta `vite:preloadError` i **només fa `console.error`**. Escenari real: desplegament amb hashes nous mentre un usuari té l'HTML vell → tota navegació a una secció no carregada queda en error permanent fins a recarregar a mà.

Esmena a `host.js:73-78`:

```js
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  showToast('Hi ha una versió nova. Recarregant…', 'info');
  window.location.reload();
});
```

I un embolcall de reintent per als loaders del catàleg (`detailRegistry.jsx`):

```js
const ambReintent = (carrega) => lazy(() => carrega().catch(async () => {
  await new Promise((r) => setTimeout(r, 800));
  return carrega();
}));
```

### Anàlisi de cicles: per què no hi ha bucle i quan n'hi hauria

Cadena a `/disseny` en muntar sense paràmetres: `createWorkspaceState` amb `itemId: undefined` → `needsInitialSelection: true` (`workspaceState.js:15`) → reconciliació tria el primer ítem de `fonaments` i emet `reconcile` (`WorkspaceContext.jsx:131-158`) → `handleSelectionChange` veu `params.get('categoria') === null !== 'fonaments'` i escriu la URL amb `replace` (`DesignSection.jsx:38-51`) → el router canvia → `selection` nou → `selection/sync` amb els mateixos valors → l'efecte de reconciliació torna a córrer (per A-1) però `selectionChanged` és `false` → **s'atura**. Amb `?categoria=inexistent&item=x` i amb `?categoria=fonaments&item=inventari-global` (ítem d'una altra categoria) el mateix: una reescriptura i para.

Es convertiria en bucle si: (a) `handleSelectionChange` deixara de comparar amb `params` abans d'escriure; (b) algun consumidor passara `selection` amb un `categoryId` que la reconciliació rebutja **i** un `onSelectionChange` que no l'accepte (ping-pong entre URL i reconciliació); o (c) el reductor de `selection/sync` normalitzara diferent del de `selection/reconcile` (hui els dos fan `String()`, `workspaceState.js:91-92` i `:103-110`). Cap d'estes condicions es dona hui. Recomane un test de la cadena completa (Vitest ja té `NotesDataContext.test.jsx` i `UniversalCard.test.jsx` com a model) perquè deixe de ser una afirmació d'auditor.

---

## 2 · Deute tècnic restant (App, punts d'entrada, catàleg)

### C-1 · Crític — 26 espècimens importen fora del repositori (confirma Codex C-01)

`src/sections/disseny/cataleg/detalls/` està a quatre nivells de `src/`. 26 fitxers usen sis (`EspecimenAlerta.jsx:4-5`, `EspecimenDialeg.jsx:3-8`, `EspecimenToast.jsx:3-8`, `EspecimenCamp.jsx:4`, `EspecimenPestanyes.jsx:4-6`, …). Els dos que funcionen usen quatre: `EspecimenUniversalCard.jsx:1` i `EspecimenInventariGlobal.jsx:2-3`. La resolució real (`node -e "path.resolve(...)"`) és `…/Som de Poble/components/PedraSeca/index.js`. Al navegador, `lazy(() => import('./detalls/EspecimenX.jsx'))` (`detailRegistry.jsx:4-31`) rebutja, `SlotErrorBoundary` (`UniversalWorkspace.jsx:94`) pinta el fallback, i per A-4 el «Reintenta» no serveix. La captura de pantalla adjunta al prompt mostra Notes, no Disseny: [SUPÒSIT] ningú ha obert `/jo/disseny` al navegador després de la migració.

Esmena mecànica (un únic codemod, després `porta:importacions` en verd):

```bash
sed -i '' 's#\.\./\.\./\.\./\.\./\.\./\.\./components/#../../../../components/#g' src/sections/disseny/cataleg/detalls/Especimen*.jsx
```

### C-2 · Crític — Tres espècimens referencien identificadors inexistents (amplia Codex C-02)

- `EspecimenAlerta.jsx:17-22`: `visible` i `setVisible` sense `useState` (la línia 2 importa `useState` i no l'usa).
- `EspecimenDialeg.jsx:18-21`: `modal` i `setModal`, mateix cas.
- **[NOU]** `EspecimenFormulariComplex.jsx:10`: `<FormulariAlta />`. Cap fitxer de `src/` la definix ni l'importa. ESLint no ho detecta perquè `eslint.config.js:28-30` no activa `react/jsx-no-undef`: és un `ReferenceError` que només es veu en muntar.

Esmena (i afegir `'react/jsx-no-undef': 'error'` a `eslint.config.js`):

```jsx
// EspecimenAlerta.jsx, dins del component
const [visible, setVisible] = useState(true);
// EspecimenDialeg.jsx
const [modal, setModal] = useState(false);
// EspecimenFormulariComplex.jsx: recuperar FormulariAlta de
// DesignSectionContent.jsx (o retirar l'espècimen del manifest fins que existisca).
```

### C-3 · [NOU] · Crític — La cadena de build i la porta global depenen d'un fitxer esborrat

`tooling/gates/build-seo-manifest.mjs` és `D` a `git status` i no existix al disc. Referències vives:

- `package.json:55` → `"porta:seo": "node tooling/gates/build-seo-manifest.mjs --verifica"`
- `package.json:69-70` → `"build": "npm run build:tokens && npm run build:seo && …"` i `"build:seo": "node tooling/gates/build-seo-manifest.mjs --escriu"`
- `tooling/gates/run-portes.mjs:46` → entrada «SEO Manifest» de `npm run porta`
- `tooling/gates/tractor-rutes-web.mjs:135` i `tooling/gates/tractor-sollutia.mjs:32` el citen com a ajuda.

`npm run build` mor al segon pas, abans de `vite build`; `npm run porta` falla a la porta «SEO Manifest». El substitut aparent, `_wiki_de_poble/04_escriptori/generador_sitemap.mjs`, viu a la Wiki i sense seguiment: un script executable a l'Escriptori contradiu `AGENTS.md:24`. L'auditoria anterior ([[260918_0131_INFORME_Auditoria_Global]], punt 4) ja deia que la porta SEO validava un artefacte orfe; esborrar-la sense desconnectar-la ha convertit un avís en un aturador.

Esmena: o bé restaurar el fitxer (`git checkout -- tooling/gates/build-seo-manifest.mjs`), o bé llevar les tres referències de `package.json` i la línia 46 de `run-portes.mjs` en el mateix commit que l'esborra, i moure `generador_sitemap.mjs` a `tooling/scripts/`.

### A-6 · [NOU] · Advertència — La porta del catàleg vigila fitxers que ja no existixen

`tractor-cataleg.mjs:48-51` llig `cataleg/Pagina*.jsx` (els sis esborrats) i `src/sections/disseny/DesignSectionContent.jsx`. Este últim té 1.494 línies i **cap mòdul de `src/` l'importa** (l'única referència és la pròpia porta, `:50`): és el monòlit que la desconstrucció havia de retirar, mantingut viu només perquè una porta el llig. La regla C2 (`:66`) hui es complix gràcies al text dels `detalls/*.jsx`, no gràcies a cap pàgina.

La falla actual: `registre.js:74` declara `UniversalWorkspace` amb `fitxer: 'universal/workspace/index.js'` i `estat: 'estable'`. `'estable'` no és a l'enumeració documentada a `registre.js:7-10` (viu · maqueta · extern · obsolet) i l'entrada no porta `fora: true`, així que la regla C3 (`:65`) la busca a `PedraSeca/` i no la troba.

Esmena a `registre.js:74`:

```js
{ nom: 'UniversalWorkspace', fitxer: 'universal/workspace/index.js', pagina: 'estructura', estat: 'viu', fora: true },
```

I a `tractor-cataleg.mjs:48-51`, substituir la lectura de `Pagina*.jsx` + `DesignSectionContent.jsx` per la de `manifest.js` (comprovar que cada `detailKey` té loader a `detailRegistry.jsx` i que cada entrada `viu` del registre apareix en algun `detalls/*.jsx`). Després, esborrar `DesignSectionContent.jsx` una vegada rescatat `FormulariAlta` (C-2).

### A-7 · [NOU] · Advertència — Dues fonts de veritat i un manifest generat a mitges

- `registre.js:1-2` es declara «ÚNICA FONT DE VERITAT», però la interfície llig `manifest.js` (`DesignSection.jsx:8,33-34`). Les etiquetes ja divergixen: `registre.js:16-17` diu «Diàlegs i calaixos» i «Estats i avisos»; `manifest.js:6-7` diu «Superposicions» i «Retroalimentació».
- Títols visibles sense accent a `manifest.js`: `Boto` (:83), `Pindola` (:116), `Paginacio` (:171), `Acordio` (:184), `Dialeg` (:259), `Confirmacio` (:272), `Progres` (:249), `Menu` (:303). Es pinten tal qual a la llista (`UniversalWorkspace.jsx:345`) i a la capçalera del detall (`DesignSection.jsx:17`).
- 26 de 28 ítems tenen `subtitle: ''` i `tags: []`. El filtre d'etiquetes (`UniversalWorkspace.jsx:217-220, 308-330`) no té res per a pintar i el `searchText` és una còpia del títol.
- Origen: `generate_catalog.py` i `extract.py` a l'arrel del repositori, sense seguiment, contra `AGENTS.md:24`. Junt amb `tmp.73080.json`, `report.json` i `test-*.mjs`, l'arrel torna a tindre residus.

Esmena: generar `CATALOG_CATEGORIES` des de `PAGINES` i `CATALOG_ITEMS` des de `REGISTRE` (o a l'inrevés) en un sol mòdul, amb accents, i esborrar els dos scripts Python.

### A-8 · Advertència — Espècimens orfes, duplicats i bruts (amplia Codex M-01)

- `EspecimenAppGrid.jsx:1` és un stub (`<div>AppGrid</div>`) que cap loader referencia.
- `EspecimenUniversalShell.jsx` duplica `EspecimenShell.jsx` línia per línia i **tots dos** usen `id="shell"` (`EspecimenShell.jsx:6`, `EspecimenUniversalShell.jsx:5`); cap dels dos té entrada a `detailRegistry.jsx` per `estructura/universal-shell`.
- `EspecimenMolla.jsx` és una sola línia d'1,1 kB sense salt final (`eol-last`).
- Importacions massives sense ús: `EspecimenToast.jsx:2-7` importa `useState`, `Dialeg`, `DialegConfirmacio`, `Camp`, `CampText`, `Pista`, `Dropdown`, `DropdownItem` i només usa `Boto` i `showToast`. Mateix patró a Pista, Menu, Calaix, Confirmació, Carrega, Progres, Buit, Insignia. Vite ho eliminarà en producció, però és el senyal que els fitxers s'han tallat d'un bloc amb un script, no escrit.
- Els 28 fitxers de `detalls/` són `??` a Git: la migració no està ni indexada.

### M-1 · Millora — Residus i falsos amics a `App.jsx` i `main.jsx`

- `App.jsx:73` `buildPath(basePath, isGestoriaLink)`: segon paràmetre mai usat; la funció està duplicada a `:600-606`. `activeNavSections` (`:81`), `activeMobileLeading/Trailing` (`:608-609`) són àlies sense funció.
- **[NOU]** `App.jsx:413` envolta l'app en `<StrictMode>`. Sota `preact/compat`, `StrictMode` és `Fragment` (`node_modules/preact/compat/src/index.js:190,238`): no hi ha doble invocació d'efectes ni cap protecció. Les guardes com `tornadaFeta` (`App.jsx:99-102`) protegixen contra un comportament que no existix; el que sí que cal és protegir-les de re-muntatges reals (canvi d'`actorKey`, `App.jsx:425-430`).
- `App.jsx:410` serialitza `config` amb `JSON.stringify` a cada render d'`App` (confirma Codex M-03).
- `IdentitatContext.jsx:25` declara `memberships` amb un `setMemberships` que ningú crida: estat mort que arrossega una dependència del `useMemo` (`:35`).
- `main.jsx` està net; el sol canvi de la migració és `manageDocumentHead: true` (`:44`), coherent amb l'esmena a `useSEO`.
- `RouterContext.jsx:97-100` `useLocation()` torna un objecte nou a cada crida i llig `window.history.state` fora del cicle de React (no reactiu).

---

## 3 · Consistència del contracte Sollutia i resiliència de xarxa

### C-4 · [NOU] · Crític — Sense la capacitat `sessio`, el rol no arriba mai i el client tanca la sessió pel seu compte

`contracte.js:43-46` declara `refrescaSessio` i `elMeuRol` com a **capacitat opcional**, no nucli. Un backend Sollutia complet (Model B) pot no implementar-les. Aleshores:

- `SessionContext.jsx:84-89`: `if (estat !== ESTAT.DINS || !teCapacitat('sessio')) return;` → `rol` es queda a `null` per sempre. `RequireAuth.jsx:43-44`: `if (rolActual === null) return <Comprovant />;` → `/admin/*` (`App.jsx:521`) i `/realitat` (`App.jsx:542`) mostren «Comprovant la sessió…» indefinidament, sense error i sense eixida.
- `SessionContext.jsx:39-43`: `renovaAra` fa `if (!teCapacitat('sessio')) { await logout(); return; }`. El temporitzador de `:45-63` la crida quan queden 60 s de JWT (`MARGE_RENOVACIO_MS`, `identitat.js:196`), i `:66-81` en tornar a la pestanya. Una sessió que l'amfitrió ha injectat amb `injectaSessio` (`host.js:274-276`) i que **només l'amfitrió pot renovar** és expulsada pel component un minut abans de caducar, sense avisar l'amfitrió.

Esmena:

```jsx
// SessionContext.jsx:84-89
useEffect(() => {
  if (estat !== ESTAT.DINS) return;
  if (!teCapacitat('sessio')) { setRol('usuari'); return; }   // fail-closed, però resolt
  // … igual …
}, [estat, usuari?.id, config]);

// SessionContext.jsx:39-43
const renovaAra = useCallback(async () => {
  if (!teCapacitat('sessio')) {
    window.dispatchEvent(new CustomEvent('sdp:sessio-caduca', { detail: { exp: caducitatJwt() } }));
    return;                       // l'amfitrió decidix: renova o expulsa
  }
  const ok = await refrescaSessio(config).catch(() => false);
  if (!ok) await logout();
}, [config]);
```

I documentar `sdp:sessio-caduca` a la fitxa de Sollutia perquè l'amfitrió el reemeta (`PedraSecaEmbed.jsx:279-281` només reemet tres esdeveniments).

### A-9 · [NOU] · Advertència — `sdp:refresh-data` es dispara i ningú l'escolta

`App.jsx:113` fa `window.dispatchEvent(new CustomEvent('sdp:refresh-data'))` després de reclamar contingut de convidat, i `PedraSecaEmbed.jsx:437-441` exposa `refreshData()` a Sollutia que el dispara sobre `_punt`. Cap `addEventListener('sdp:refresh-data')` existix a `src/` (grep exhaustiu). Els cinc proveïdors de dades només recarreguen quan canvia `actorKey` o `config` (`CoreContentContext.jsx:30`, `MurContext.jsx:31`, `NotesDataContext.jsx:40`, `MultimediaContext.jsx:29`; `XatContext.jsx:223-226` per `joId`). L'API pública que Sollutia té per a dir «hi ha dades noves» és decorativa (Codex C-06 ho diu de `refresh()`; l'esdeveniment és la mateixa ferida vista des del host).

Esmena, un hook compartit:

```js
export function useRecarregaExterna(recarrega) {
  useEffect(() => {
    const f = () => recarrega();
    window.addEventListener('sdp:refresh-data', f);
    return () => window.removeEventListener('sdp:refresh-data', f);
  }, [recarrega]);
}
```

i a cada proveïdor, un `tick` d'estat a les dependències de l'efecte de càrrega.

### A-10 · Advertència — La xarxa que cau es queda caiguda

- `runtime.js:43-66`: `request()` té un únic timeout de 12 s i cap reintent llevat del 401. `CoreContentProvider` (`CoreContentContext.jsx:13-30`) passa a `status: 'error'` a la primera excepció i `AppDataLoader` (`App.jsx:449-457`) pinta «Error Intern» amb l'*stack trace* del backend visible a producció (`:454`), sense botó de reintent. Al bancal, una pèrdua de cobertura de 12 s tomba tot el portal fins a recarregar.
- `XatContext.jsx:297-317` sí que fa retrocés (×10 en llista, ×6 en fil) i pausa amb la pestanya amagada: és el model a copiar.
- `XatContext.jsx:147` crida `getCurrentUser()` **durant el render** (llig `sessionStorage`), no des d'estat: el `joId` només canvia si algun pare repinta després de `sdp:auth-change` [SUPÒSIT: hui `SessionProvider` ho fa, però és un acoblament implícit].
- `PedraSecaEmbed.jsx:611-628` engolix `unhandledrejection` si el text de l'error conté `sdp` o `soc-de-poble`, i només fa `console.warn`: a producció, una promesa rebutjada del backend Sollutia amb eixe text desapareix.
- `host.js:308-381` registra un `message` listener per cada crida a `exposaGlobal()` sense retirar-lo mai; `exposaGlobal` es protegix amb el descriptor de `window.SocDePoble` (`:292-296`), així que en un sol document és una vegada. Correcte, però `processarCua()` (`:197-227`) sobreescriu `window.SocDePobleCua.push` de forma irreversible.

Esmena mínima a `AppDataLoader`:

```jsx
if (hasError) return (
  <div className="sdp-app-error" role="alert">
    <h1>No s'ha pogut carregar el poble</h1>
    <p>{core.error?.message}</p>
    <button type="button" className="sdp-boto sdp-boto--primari" onClick={core.refresh}>Torna-ho a provar</button>
  </div>
);
```

amb `refresh` connectat de veritat (`CoreContentContext.jsx:44` hui només canvia `status`; l'efecte de `:13-30` no depén de res que canvie).

### Confirmació — `basename` duplicat (Codex C-04)

`RouterContext.jsx:106-118` construïx `currentUrl.pathname` (ja porta el `basename`) i `navigate` (`:53-55`) el torna a prefixar. `PedraSecaEmbed.jsx:387-389` deriva `basename` de `basePath`, així que qualsevol incrustació sota un subdirectori activa el defecte a `/disseny`, Notes i Mur (`useSearchParams` s'usa a `DesignSection.jsx:28`, `NotesSection.jsx:26`, `MurSection.jsx:20`).

---

## 4 · Resiliència d'accessibilitat (focus i navegació asíncrona)

### A-5 · Advertència — El focus es perd en quatre transicions (amplia Codex A-04/A-05)

1. **Detall asíncron sense anunci ni focus en escriptori.** `App.jsx:88-92` mou el focus a `<main>` només quan canvia `location.pathname`; a `/disseny` la navegació és per `?item=` i no dispara res. `UniversalWorkspace.jsx:241-245` només enfoca el detall si `mida === 'estret'`. En escriptori, un usuari de teclat tria un espècimen, el `Suspense` de `DesignSection.jsx:20-22` pinta «Carregant l'espècimen…» i després el contingut, i el lector de pantalla no en sap res: el focus continua al botó de la llista i `DetailColumn` (`UniversalWorkspace.jsx:399-408`) no té `aria-live`.
2. **[NOU] Tancar la cerca deixa el focus al `body`.** `UniversalWorkspace.jsx:289-306`: el botó «Tancar» (`:302-304`) desmunta la fila sencera on ell mateix viu. El focus cau a `document.body`; la següent tabulació comença des del principi de la pàgina.
3. **Plegar una columna desmunta el control enfocat.** `UniversalWorkspace.jsx:138-149` i `:257-268` substituïxen tota la capçalera per la variant `collapsed`; el botó `onPlega` (`AppGridColumn.jsx:78-88`) desapareix amb el focus a sobre.
4. **[NOU] La barra lateral es plega mutant classes sense estat ARIA.** `App.jsx:238-244` i `:335-341` fan `classList.toggle('sidebar-open')` i `host.classList.toggle('sidebar-closed')` sobre `document.body` des de dins del *shadow root*: cap `aria-expanded`, cap `aria-controls`, i l'estat no és de React (el propi espècimen `EspecimenShell.jsx:9-10` ho prohibix: «Estat de la barra lateral en React, no en classList»). El botó del gestor sí que ho fa bé (`AppGridShell.jsx:161-169`).

A més: `App.jsx:88-92` s'executa també en muntar, així que a la primera càrrega el focus salta a `<main>` abans que l'usuari haja fet res [SUPÒSIT sobre l'impacte: depén del lector de pantalla]. I `CategoryColumn` posa el mateix `aria-label` a l'`<aside>` i al `<nav>` interior (`UniversalWorkspace.jsx:152,169`): dos punts de referència amb el mateix nom.

Esmena (2 i 3): enfocar el successor **abans** de desmuntar:

```jsx
// UniversalWorkspace.jsx · ItemListColumn
const closeAndFocus = () => { closeSearch(); focusAfterLayout(rootRef); };
const collapseAndFocus = () => { toggleColumn('middle'); focusAfterLayout(rootRef); };
```

Esmena (1): a `DetailColumn`, un `role="status"` que anuncie el títol quan arriba, i a `chooseItem` enfocar el detall també en `ample` quan la selecció és d'usuari:

```jsx
const chooseItem = (itemId) => {
  selectItem(itemId);
  tancaPanells();
  focusAfterLayout(detailFocusRef);   // en totes les mides
};
```

Esmena (4): estat `sidebarObert` a `AppShell`, `aria-expanded={sidebarObert}` i `aria-controls="app-sidebar"` als dos botons, i la classe al `host` via `useEffect`.

---

## Controls que sí que aguanten

- El pany del port (`backendPort.js:8-36`) i l'arrencada en dues fases (`host.js:154-191`) continuen correctes; `configura()` rebutja injeccions parcials i membres no funció.
- Els cinc proveïdors de dades usen generació + `active` (`CoreContentContext.jsx:11-30` i germans): cap `setState` després de desmuntar.
- `XatContext.jsx:343-352` neteja temporitzadors, subscripció Realtime i `visibilitychange`; `SessionContext.jsx:45-81` neteja temporitzador i escoltadors; `AppGridShell.jsx:57-80` desconnecta el `ResizeObserver`. No he trobat cap fuita de memòria per escoltador orfe a la zona migrada.
- `AppGridShell.jsx:185-228` usa `inert` + `aria-hidden` per a les columnes tancades: correcte, i Preact el passa com a atribut.
- `SlotErrorBoundary` aïlla el detall: l'error d'un espècimen no tomba la llista (`UniversalWorkspace.jsx:83-101`).
- El reductor i el filtre del workspace són purs i testables (`workspaceState.js`); és la peça millor escrita de la migració.

## Incògnites

- Rendiment real sota estrès de xarxa: no s'ha mesurat. L'anàlisi estàtica indica que el cost dominant no és el catàleg sinó el `contextValue` del router que repinta tots els consumidors a cada `navigate`.
- Si `DesignSectionContent.jsx` conté espècimens que encara no s'han migrat (p. ex. `FormulariAlta`, Avatar, Botonera, Taula que `registre.js:83-86` marca com a maqueta), cal un inventari abans d'esborrar-lo.
- [SUPÒSIT] Ningú ha obert `/jo/disseny` al navegador després de la migració: cap traça al `.immunitari/cron.out` ni a la captura del prompt.
- Comportament de `inert` en Safari < 15.5 dins d'un *shadow root* tancat: no verificat.

## Pla d'esmena proposat (per a la IAIA MarIA)

1. **Aturadors de build (mateix commit):** codemod dels sis `../` (C-1); `useState` a Alerta i Diàleg, resoldre `FormulariAlta` (C-2); restaurar o desconnectar `build-seo-manifest.mjs` (C-3); `registre.js:74` (A-6). Verificació: `porta:importacions`, `porta:cataleg`, `eslint --quiet`, `vite build` a un directori temporal.
2. **Contracte Sollutia:** rol per defecte i `sdp:sessio-caduca` (C-4); escoltador de `sdp:refresh-data` i `refresh()` real (A-9); pantalla d'error del Core amb reintent (A-10).
3. **Accessibilitat:** successor de focus en tancar cerca i plegar (A-5.2, A-5.3); anunci i focus del detall (A-5.1); estat ARIA de la barra lateral (A-5.4); `push` en accions d'usuari a `/disseny` (A-3).
4. **Rendiment i neteja:** `CAP` congelat i bail-out del reductor (A-1, A-2); reintent de `lazy` i `vite:preloadError` (A-4); una sola font de veritat del catàleg amb accents (A-7); esborrar `DesignSectionContent.jsx`, `EspecimenAppGrid.jsx`, `EspecimenUniversalShell.jsx`, scripts Python i residus de l'arrel (A-8, M-1); `porta:cataleg` reescrita sobre `manifest.js` (A-6).
5. **Xarxa de seguretat:** test Vitest de la cadena URL → sync → reconcile → URL a `/disseny`; test que cada `detailKey` resol un mòdul importable (evitaria C-1 per sempre); `react/jsx-no-undef` a ESLint.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura? Sí: 40 fitxers de `src/`, 3 portes, `vite.config.js`, `package.json`, `preact/compat`, i 4 portes executades.
- [x] He citat correctament la ruta i les línies del codi original? Sí, a cada troballa.
- [x] Cap nom de fitxer, funció o variable inventat? Cap. Els noms proposats a les esmenes (`CAP`, `useRecarregaExterna`, `sdp:sessio-caduca`, `ambReintent`) es presenten com a codi suggerit, no com a codi existent.
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites? Sí.
- [x] El document passa `tractor-frontmatter.mjs --estricte`? Comprovat després d'escriure'l (vegeu el missatge de lliurament).
- [x] Cap línia de codi tocada? Cap. Només este fitxer i l'ancoratge a l'índex de l'Escriptori.
