---
type: informe
status: esborrany
description: Auditoria extrema postmigració de rendiment, contracte Sollutia, deute tècnic i accessibilitat
tags:
  - sollutia
---

# INFORME — Auditoria Extrema Global Post-Migració

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-20260918-EXTREMA |
| Versió | 1.0.0 |
| Entorn | `entorn-dev-local` |
| Tall auditat | working tree local de 2026-09-18 02:43 CEST |
| Agent auditor | Codex |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[UniversalWorkspace]]
- [[Sollutia_Backend]]

## Abast i mètode

Auditoria estàtica i executable de l'estat real del working tree, sense consultar
Internet i sense modificar codi. S'han inspeccionat el router, l'arrencada del Web
Component, `App`, els contexts de dades, `UniversalWorkspace`, `AppGridShell`, el
catàleg modular del sistema de disseny Pedra Seca i els adaptadors Supabase.

S'han executat:

- `vite build` amb eixida a `/tmp`, perquè cap artefacte de build toque el repositori;
- la bateria Vitest completa;
- ESLint sobre el nucli i sobre tots els espècimens modularitzats;
- les portes `porta:cataleg`, `porta:importacions`, `porta:enxufe`,
  `porta:manifest` i `porta:graella`;
- comprovacions mecàniques d'unicitat i cobertura entre `manifest.js` i
  `detailRegistry.jsx`.

## Veredicte executiu

**REBUTJAT per continuar la migració.** L'estat no és net ni desplegable.

El catàleg modular conté 31 importacions relatives que apunten al no-res, repartides
entre 26 espècimens. El build de producció cau en el primer d'aquests imports. Quan
s'arreglen les rutes, almenys dos chunks continuaran fallant en render per estat no
declarat. A més, la integració incrustada té dos trencaments de router, el contracte
de refresc és inert, una publicació pot donar un fals positiu, una caiguda del Core
tomba tot el portal i els estats de càrrega globals no s'anuncien a tecnologies
d'assistència.

No s'ha trobat un cicle de render infinit en el flux actual de `/disseny`.
Sí que hi ha un render redundant per cada sincronització URL → workspace i una
cascada de renders del detall a cada canvi de filtre.

### Recompte

| Gravetat | Quantitat | Criteri |
| --- | ---: | --- |
| Crític | 10 | build trencat, excepció executable, dada falsament confirmada, contracte d'integració o a11y principal inoperant |
| Advertència | 9 | fuga, recuperació incompleta, render evitable, focus fràgil o porta roja |
| Millora | 3 | deute sense fallada immediata, però amb cost de manteniment o diagnòstic |

## Matriu de prioritat

| Ordre | ID | Acció mínima abans de continuar |
| ---: | --- | --- |
| 1 | C-01, C-02 | Fer que tots els chunks del catàleg resolguen i renderitzen |
| 2 | C-05, C-06 | Eliminar falsos positius d'escriptura i restaurar un refresc real |
| 3 | C-03, C-04, C-10 | Segellar el contracte de router i d'arrencada amb Sollutia |
| 4 | C-07, C-09 | Mantindre el shell viu davant xarxa lenta i anunciar la càrrega |
| 5 | A-01, A-02, A-03 | Tancar fugues i recuperar errors de chunks |
| 6 | A-04, A-05, A-06 | Corregir focus, historial i cascades de render |
| 7 | A-07, A-08, A-09 | Avortar peticions, retirar residus i tornar les portes a verd |

---

## Troballes crítiques

### C-01 — El catàleg modular no compila

**Àrea:** migració / càrrega asíncrona  
**Impacte:** build de producció impossible; `/disseny` no es pot desplegar.

`detailRegistry.jsx` declara 28 imports diferits reals
(`src/sections/disseny/cataleg/detailRegistry.jsx:3-32`). Vint-i-sis fitxers nous
usen `../../../../../../components/...`, que puja dos nivells per damunt de `src`.
Per exemple:

- `src/sections/disseny/cataleg/detalls/EspecimenAcordio.jsx:4-6`
- `src/sections/disseny/cataleg/detalls/EspecimenCalaix.jsx:3-8`
- `src/sections/disseny/cataleg/detalls/EspecimenNavMobil.jsx:4-6`
- `src/sections/disseny/cataleg/detalls/EspecimenToast.jsx:3-8`

La porta d'importacions detecta **31** especificadors trencats i Vite s'atura en
`EspecimenNavMobil.jsx`. Des de `cataleg/detalls/`, `src/components/` està a quatre
ascensos, no a sis.

**Solució suggerida:** corregir mecànicament els 31 imports i fer obligatori
`porta:importacions` abans dels tests.

```jsx
// Des de src/sections/disseny/cataleg/detalls/*.jsx
import { Boto } from '../../../../components/PedraSeca/index.js';
import { showToast } from '../../../../components/universal/AvisadorEfimer.jsx';
```

**Criteri de tancament:** `npm run porta:importacions` i un build Vite net.

### C-02 — Dos espècimens tenen estat interactiu inexistent

**Àrea:** migració / chunks lazy  
**Impacte:** excepció de render després de corregir C-01.

`EspecimenAlerta` usa `visible` i `setVisible` sense declarar-los
(`src/sections/disseny/cataleg/detalls/EspecimenAlerta.jsx:7-22`).
`EspecimenDialeg` fa el mateix amb `modal` i `setModal`
(`src/sections/disseny/cataleg/detalls/EspecimenDialeg.jsx:10-23`). En ambdós casos
`useState` està importat però no invocat. ESLint retorna vuit errors `no-undef`
entre aquests dos fitxers.

**Solució suggerida:** restaurar l'estat que es va perdre en l'extracció.

```jsx
export default function EspecimenAlerta() {
  const [visible, setVisible] = useState(true);
  // …
}

export default function EspecimenDialeg() {
  const [modal, setModal] = useState(false);
  // …
}
```

**Criteri de tancament:** cada entrada de `CATALOG_DETAIL_LOADERS` s'ha d'importar
i renderitzar almenys una vegada en un test.

### C-03 — El segon Web Component cau en usar «arrere» o «endavant»

**Àrea:** RouterContext / integració Sollutia  
**Impacte:** `TypeError` en qualsevol instància secundària.

Les instàncies posteriors a la primera usen `MemoryRouter`
(`src/PedraSecaEmbed.jsx:44-47`). `UniversalPage` envia `navigate(-1)` i
`navigate(1)` (`src/components/universal/UniversalPage.jsx:16-18`). El router de
navegador tracta explícitament valors numèrics
(`src/app/contexts/RouterContext.jsx:41-50`), però `MemoryRouter` assumeix que
`to` és text i executa `to.startsWith('/')`
(`src/app/contexts/RouterContext.jsx:283-296`). Amb `-1` o `1`, això és una
excepció immediata.

**Solució suggerida:** mantindre una pila i un índex interns en `MemoryRouter` i
tractar els deltes numèrics abans de qualsevol operació de text.

```jsx
const navigate = useCallback((to, options = {}) => {
  if (typeof to === 'number') {
    setIndex((current) => clamp(current + to, 0, entries.length - 1));
    return;
  }
  // resolució de ruta, push/replace i estat de la nova entrada
}, [base, entries.length]);
```

No s'ha de delegar a `window.history` en el mode de memòria: dues instàncies
independents no poden compartir cegament l'historial del document host.

### C-04 — `useSearchParams` duplica el `basename`

**Àrea:** RouterContext / incrustació en subruta  
**Impacte:** navegació corrupta quan Sollutia munta el component davall d'un prefix.

`useSearchParams` construeix la destinació amb `window.location.pathname`
(`src/app/contexts/RouterContext.jsx:102-119`). Eixe pathname ja conté el
`basename`. Tot seguit `navigate` anteposa `base` a qualsevol ruta que comence per
`/` (`src/app/contexts/RouterContext.jsx:52-68`). Amb `basename="/portal"`, una
actualització de query sobre `/portal/jo/disseny` navega a
`/portal/portal/jo/disseny?...`.

**Solució suggerida:** `useSearchParams` ha d'usar `currentPath`, que ja és la ruta
normalitzada sense prefix.

```jsx
export function useSearchParams() {
  const { currentPath, searchParams, navigate } = useRouter();

  const setParams = useCallback((newParams, options = { replace: true }) => {
    const next = new URLSearchParams(searchParams);
    // aplicar newParams sobre next
    const query = next.toString();
    navigate(`${currentPath}${query ? `?${query}` : ''}`, options);
  }, [currentPath, navigate, searchParams]);

  return [searchParams, setParams];
}
```

Cal afegir una prova amb `basename`, canvi de query i back/forward.

### C-05 — Publicar pot informar d'èxit sense haver enviat res

**Àrea:** contracte Sollutia / consistència de dades  
**Impacte:** pèrdua de confiança i estat remot fals.

Quan `MurProvider` encara carrega o està en error, exposa
`sendSectionSubmission: async () => {}`
(`src/sections/mur/MurContext.jsx:33-35`). `publishNote` espera aquesta funció i,
si resol, marca la nota com publicada i pot mostrar èxit
(`src/sections/notes/NotesContext.jsx:174-179`). Per tant, el fallback buit viola
el contracte Online-First: una escriptura absent es presenta com a correcta.

**Solució suggerida:** les accions de mutació degradades han de fallar tancat.

```jsx
const noDisponible = async () => {
  throw data.error || new Error('El Mur no està disponible; no s’ha publicat res.');
};

return {
  status: data.status,
  error: data.error,
  // …
  sendSectionSubmission: noDisponible
};
```

**Criteri de tancament:** una prova ha de demostrar que, amb `MurProvider` en
`loading` i en `error`, `isPublished` no s'actualitza i es mostra error.

### C-06 — `refreshData()` és una API pública inert i `core.refresh()` es queda penjat

**Àrea:** Web Component / contexts  
**Impacte:** dades obsoletes després de canvis del host o migració de convidat.

El Web Component exposa `refreshData()` i emet `sdp:refresh-data`
(`src/PedraSecaEmbed.jsx:436-441`). `AppShell` emet el mateix esdeveniment després
de reclamar contingut del convidat (`src/app/App.jsx:108-114`). No existeix cap
`addEventListener('sdp:refresh-data', ...)` en `src/`: els dos emissors no tenen
consumidor.

Encara pitjor, `CoreContentContext` exposa `refresh` limitant-se a posar
`status: 'loading'` (`src/app/contexts/CoreContentContext.jsx:32-45`), però l'efecte
que carrega només depèn de `actorKey` i `config`
(`src/app/contexts/CoreContentContext.jsx:13-30`). Cridar `refresh()` no rellança
la petició: deixa el portal en càrrega indefinida.

**Solució suggerida:** introduir una generació de recàrrega real i connectar-hi
l'esdeveniment públic. El mateix patró s'ha d'aplicar a Mur, Notes i Multimèdia.

```jsx
const [reloadGeneration, reload] = useReducer((n) => n + 1, 0);

useEffect(() => {
  const onRefresh = () => reload();
  window.addEventListener('sdp:refresh-data', onRefresh);
  return () => window.removeEventListener('sdp:refresh-data', onRefresh);
}, []);

useEffect(() => {
  // càrrega real
}, [actorKey, config, reloadGeneration]);
```

### C-07 — Una caiguda del Core tomba tot el portal i no ofereix reintent

**Àrea:** resiliència de xarxa  
**Impacte:** indisponibilitat global per una única petició fallida.

`loadCoreContent` rebutja quan falten credencials, tenant o falla la petició
(`src/data/supabase/content.js:68-74`). `AppDataLoader` converteix qualsevol error
del Core en una pantalla terminal, mostra `message` i `stack`, i no ofereix cap
reintent (`src/app/App.jsx:441-458`). Les rutes locals i el shell funcional queden
inaccessibles encara que no necessiten les dades que han fallat.

El `RouteErrorBoundary` no resol això: viu per davall d'`AppDataLoader`
(`src/app/App.jsx:460-464`).

**Solució suggerida:** mantindre el shell, amagar la traça en producció i oferir
un reintent real basat en C-06.

```jsx
if (core.status === 'error') {
  return (
    <div role="alert" className="sdp-app-error">
      <h1>No s’ha pogut carregar el contingut</h1>
      <p>Revisa la connexió i torna-ho a provar.</p>
      <button type="button" onClick={core.refresh}>Reintentar</button>
    </div>
  );
}
```

La traça completa només ha d'anar a telemetria o consola de desenvolupament.

### C-08 — La vista «Cronologia» de Multimèdia cau sempre

**Àrea:** contracte de context  
**Impacte:** excepció en una interacció ordinària.

`MultimediaSection` llig `mediaTimelineGroups` i després executa
`timelineGroups.map(...)` (`src/sections/multimedia/MultimediaSection.jsx:11-16` i
`src/sections/multimedia/MultimediaSection.jsx:68-99`). `MultimediaContext` no
exposa mai eixa propietat, ni en càrrega/error ni en estat preparat
(`src/sections/multimedia/MultimediaContext.jsx:31-44`). En seleccionar
«Cronologia», `undefined.map` trenca la ruta.

**Solució suggerida:** definir el camp en el proveïdor i aplicar una defensa en el
consumidor fins que existisca l'agrupació real.

```jsx
const { mediaItems, mediaTimelineGroups = [] } = useMultimedia();
const timelineGroups = Array.isArray(mediaTimelineGroups)
  ? mediaTimelineGroups
  : [];
```

La solució completa és calcular `mediaTimelineGroups` en el context, perquè la
transformació siga única i compartida.

### C-09 — La càrrega global és invisible per a lectors de pantalla

**Àrea:** accessibilitat asíncrona  
**Impacte:** navegació aparentment congelada per a usuàries de tecnologia assistiva.

`AppShell` obté `status` de `useUIState` i el converteix en `aria-busy`
(`src/app/App.jsx:64-65` i `src/app/App.jsx:293-299`). Però `UIContext` no publica
cap propietat `status` (`src/app/contexts/UIContext.jsx:75-83`). El valor és sempre
`undefined` i `<main>` mai queda ocupat.

Al mateix temps, `RouteFallback` només pinta un `div` i un spinner, sense
`role="status"`, text accessible ni `aria-live` (`src/app/App.jsx:56-62`). Aquest
fallback s'usa tant en la càrrega inicial com en totes les rutes `lazy`
(`src/app/App.jsx:458-463` i `src/app/App.jsx:504-551`).

**Solució suggerida:** anunciar l'estat i alimentar `aria-busy` des d'un estat de
càrrega real, no des del context visual.

```jsx
function RouteFallback() {
  return (
    <div className="sdp-app-loading" role="status" aria-live="polite">
      <div className="sdp-spinner sdp-spinner--large" aria-hidden="true" />
      <span className="sdp-nomes-lector">Carregant la secció…</span>
    </div>
  );
}
```

### C-10 — El contracte publicat a Sollutia no correspon a l'API real

**Àrea:** integració / documentació executable  
**Impacte:** una integració que segueix la norma canònica no arrenca.

La norma diu que `window.SocDePoble.configura()` accepta backend **o configuració**
i que es pot substituir «qualsevol mètode»
(`_wiki_de_poble/02_saber/estandard_integracio_react.md:21-55`). El codi real només
desestructura `{ backend, force }` (`src/host.js:100-120`), ignora qualsevol altra
configuració i rebutja en `arrenca()` tota injecció parcial del nucli
(`src/host.js:160-170`).

La mateixa norma mostra `deferArrenca()`
(`_wiki_de_poble/02_saber/estandard_integracio_react.md:31-50`), però l'API global
congelada no exporta eixe mètode (`src/host.js:287-305`). El mecanisme real és
posar `arrencada="manual"` abans que vença el temporitzador
(`src/host.js:229-258`).

**Solució suggerida:** decidir un únic contracte i convertir-lo en prova. Amb el
codi actual, l'exemple honest és:

```html
<soc-de-poble arrencada="manual"></soc-de-poble>
<script src="/ruta/a/soc-de-poble.standalone.js"></script>
<script>
  const element = document.querySelector('soc-de-poble');
  element.config = { routerType: 'memory', tenantId: '…' };
  window.SocDePoble.configura({ backend: backendComplet });
  window.SocDePoble.arrenca();
</script>
```

No s'ha de publicar `configura()` com a canal de configuració general ni prometre
injecció parcial mentre el codi no ho implemente.

---

## Advertències

### A-01 — Reconnectar el Web Component duplica escoltadors globals

**Àrea:** memòria / cicle de vida  
**Impacte:** fugues i reemissió multiplicada d'esdeveniments.

En reconnectar-se, `connectedCallback` cancel·la el desmuntatge pendent
(`src/PedraSecaEmbed.jsx:236-241`), però sempre crea una nova funció
`_reemissorEvents` i torna a registrar tres escoltadors de `window`
(`src/PedraSecaEmbed.jsx:268-282`). Si la desconnexió i reconnexió ocorre dins del
mateix microtask, `_desmuntaAra()` no corre; la referència antiga se sobreescriu.
El desmuntatge final només elimina l'última funció registrada
(`src/PedraSecaEmbed.jsx:566-570`).

**Solució suggerida:** registrar una sola vegada per instància.

```jsx
if (!this._reemissorEvents && typeof window !== 'undefined') {
  this._reemissorEvents = (event) => { /* reemissió */ };
  for (const type of ['sdp:auth-change', 'sdp:navega', 'sdp:error']) {
    window.addEventListener(type, this._reemissorEvents);
  }
}
```

### A-02 — El recompte de fonts creix en canvis aliens i falla en reconnectar

**Àrea:** memòria / recursos globals  
**Impacte:** `<link>` que no s'allibera o font que desapareix després d'un remuntatge.

Quan qualsevol propietat de configuració canvia, `_recalcularConfig()` torna a
cridar `carregarFonts()` encara que `fontsHref` siga el mateix, però només descarrega
si l'URL ha canviat (`src/PedraSecaEmbed.jsx:398-419`). Això incrementa el
`fontRefCount` sense parella. En el desmuntatge sí que es decrementa
(`src/PedraSecaEmbed.jsx:548-553`). Si després es reconnecta amb configuració
idèntica, `_recalcularConfig()` no detecta canvi i no torna a carregar la font.

**Solució suggerida:** mantindre un booleà per instància i ajustar el recompte només
quan canvia l'URL o l'estat muntat.

```jsx
if (oldFontsHref !== nextFontsHref) {
  if (this._fontsLoaded && oldFontsHref) descarregarFonts(oldFontsHref);
  if (nextFontsHref) carregarFonts(nextFontsHref);
  this._fontsLoaded = Boolean(nextFontsHref);
}
```

### A-03 — «Reintenta» no recupera una descàrrega `lazy()` fallida

**Àrea:** resiliència de xarxa  
**Impacte:** un tall transitori obliga a recarregar tota la pàgina.

Els components `lazy()` es creen una sola vegada al registre
(`src/sections/disseny/cataleg/detailRegistry.jsx:1-32`). Si el chunk rebutja, la
identitat lazy conserva el rebuig. `SlotErrorBoundary.reinicia()` només neteja el
seu estat (`src/components/universal/workspace/SlotErrorBoundary.jsx:36-63`) i el
host només registra `vite:preloadError` a consola (`src/host.js:72-77`). Per tant,
el botó pot tornar a caure immediatament sobre la mateixa promesa rebutjada.

**Solució suggerida:** fer que el registre conserve funcions importadores i que un
reintent cree una identitat lazy nova, o oferir una recàrrega explícita de pàgina
per a errors de chunk.

```jsx
export const CATALOG_DETAIL_IMPORTERS = {
  'formularis/boto': () => import('./detalls/EspecimenBoto.jsx'),
  // …
};

const Detail = useMemo(
  () => lazy(CATALOG_DETAIL_IMPORTERS[item.detailKey]),
  [item.detailKey, retryGeneration]
);
```

### A-04 — El detall nou no rep focus en escriptori ni en back/forward

**Àrea:** accessibilitat / focus  
**Impacte:** el contingut canvia fora del cursor del teclat.

`AppShell` només enfoca `<main>` quan canvia `pathname`
(`src/app/App.jsx:87-92`). Les seleccions del catàleg només canvien
`?categoria=&item=` (`src/sections/disseny/DesignSection.jsx:37-54`), així que aquest
efecte no s'activa. `UniversalWorkspace` mou el focus al detall únicament quan
`mida === 'estret'` (`src/components/universal/workspace/UniversalWorkspace.jsx:223-245`).
En escriptori i en navegació back/forward, el detall asíncron canvia però el focus
queda en l'element anterior.

**Solució suggerida:** enfocar el contenidor del detall després d'un canvi real
d'`activeItem.id`, també per selecció externa, i evitar fer-ho durant simples
canvis de filtre.

```jsx
useEffect(() => {
  if (workspace.activeItem?.id) focusAfterLayout(detailFocusRef);
}, [workspace.activeItem?.id]);
```

El contenidor ja és programàticament enfocables
(`src/components/universal/workspace/UniversalWorkspace.jsx:399-405`).

### A-05 — Plegar una columna elimina el control enfocat sense successor

**Àrea:** accessibilitat / teclat  
**Impacte:** el focus pot caure al document o al host.

El botó de plegat actualitza l'estat i substitueix tot el subtree per la variant
col·lapsada (`src/components/universal/workspace/UniversalWorkspace.jsx:138-168` i
`src/components/universal/workspace/UniversalWorkspace.jsx:257-287`). El botó
original viu a `AppGridColumn` (`src/components/layout/AppGridColumn.jsx:77-88`) i
el nou botó «Expandir» es crea en un arbre diferent
(`src/components/layout/AppGridColumn.jsx:51-66`). No hi ha transferència de focus.

**Solució suggerida:** conservar refs als botons plegar/expandir i enfocar el que
queda visible després del canvi de layout.

### A-06 — `/disseny` reemplaça l'historial fins i tot en accions d'usuari

**Àrea:** RouterContext / usabilitat  
**Impacte:** «arrere» no recorre les fitxes seleccionades.

`WorkspaceContext` ja emet `reason: 'user'`, `'create'` o `'reconcile'`
(`src/components/universal/workspace/WorkspaceContext.jsx:75-103` i
`src/components/universal/workspace/WorkspaceContext.jsx:151-158`).
`DesignSection` rep `meta` però no l'usa i crida `setParams(next)`
(`src/sections/disseny/DesignSection.jsx:37-54`). El valor per defecte és
`replace: true` (`src/app/contexts/RouterContext.jsx:102-119`). Notes sí implementa
la distinció correcta (`src/sections/notes/NotesSection.jsx:68-79`).

**Solució suggerida:** aplicar el mateix contracte que Notes.

```jsx
const isPush = meta?.reason === 'user' || meta?.reason === 'create';
setParams(next, { replace: !isPush });
```

### A-07 — El context del workspace repinta el detall a cada tecla

**Àrea:** rendiment / re-renderitzat  
**Impacte:** cost evitable en editors o espècimens pesants.

El valor únic del context inclou estat, dades i accions
(`src/components/universal/workspace/WorkspaceContext.jsx:164-182`). Canviar
`query` reconstrueix `state`, `filteredItems` i el valor complet. `DetailColumn`
consumeix tot el context (`src/components/universal/workspace/UniversalWorkspace.jsx:379-397`),
de manera que cada tecla en la cerca torna a renderitzar el detall actiu.

La sincronització controlada també fa un render redundant: l'efecte sempre envia
`selection/sync` quan canvien les props (`src/components/universal/workspace/WorkspaceContext.jsx:105-114`)
i el reducer sempre crea un estat nou, encara que IDs i flags ja coincidisquen
(`src/components/universal/workspace/workspaceState.js:99-115`).

**Solució suggerida:** separar dades/selecció/accions en contexts o selectors,
memoritzar `DetailColumn`, i fer que `selection/sync` retorne `state` si no hi ha
canvi efectiu.

```js
if (
  nextCategoryId === state.activeCategoryId &&
  nextItemId === state.activeItemId &&
  nextNeedsInitialSelection === state.needsInitialSelection
) return state;
```

**[SUPÒSIT]** Amb 28 ítems el cost brut del filtre és baix. El risc esdevé material
quan `UniversalWorkspace` s'use amb llistes grans o detalls amb editors rics.

### A-08 — `AppDataLoader` se subscriu a tot el xat i no usa el valor

**Àrea:** rendiment / codi mort  
**Impacte:** recomputació global cada 5–25 segons i amb cada missatge.

`AppDataLoader` crida `useXat()` i assigna `xat`, però no el consulta
(`src/app/App.jsx:441-447`). El valor del context canvia amb fils, missatges,
avís i fil actiu (`src/sections/xat/XatContext.jsx:447-460`); el mateix context
programa sondeig a 25 s i 5 s (`src/sections/xat/XatContext.jsx:45-47` i
`src/sections/xat/XatContext.jsx:297-317`). Això torna a renderitzar
`AppDataLoader` i `AppRoutes` sense cap decisió dependent del xat.

**Solució suggerida:** eliminar `useXat` de `AppDataLoader` i el seu import d'`App.jsx`.

### A-09 — Les càrregues cancel·lades continuen consumint xarxa

**Àrea:** xarxa / canvi d'actor  
**Impacte:** peticions inútils i sockets ocupats després de navegar o desmuntar.

Els proveïdors usen una bandera i una generació per ignorar resultats antics, però
no creen cap `AbortController`; per exemple
`src/app/contexts/CoreContentContext.jsx:13-30`,
`src/sections/notes/NotesDataContext.jsx:23-40` i
`src/sections/multimedia/MultimediaContext.jsx:12-29`. El client HTTP sí accepta
i neteja un `signal` (`src/data/supabase/runtime.js:43-65`), però els proveïdors no
l'entreguen.

**Solució suggerida:** crear un controlador per efecte, passar el senyal i avortar
en cleanup.

```jsx
useEffect(() => {
  const controller = new AbortController();
  loadCoreContent(actorId, { ...config, signal: controller.signal })
    .then(/* guarda de generació */)
    .catch((error) => {
      if (error?.name !== 'AbortError') setData(/* error */);
    });
  return () => controller.abort();
}, [actorKey, config]);
```

---

## Millores i deute tècnic

### M-01 — La desconstrucció ha deixat un monòlit i espècimens orfes

`DesignSection` només importa el registre lazy i el manifest
(`src/sections/disseny/DesignSection.jsx:1-8`). Tot i això,
`DesignSectionContent.jsx` conserva el catàleg monolític antic des de la seua
exportació (`src/sections/disseny/DesignSectionContent.jsx:109-180` i següents).
`EspecimenAppGrid.jsx` i `EspecimenUniversalShell.jsx` també estan definits però no
formen part de `detailRegistry.jsx`
(`src/sections/disseny/cataleg/detalls/EspecimenAppGrid.jsx:1` i
`src/sections/disseny/cataleg/detalls/EspecimenUniversalShell.jsx:1-17`).

La porta del catàleg encara concatena explícitament l'antic
`DesignSectionContent.jsx` (`tooling/gates/tractor-cataleg.mjs:44-55`) i falla
perquè tracta `UniversalWorkspace` com si haguera de ser un export de
`PedraSeca/`, tot i que el registre l'assenyala a `universal/workspace/index.js`
(`src/sections/disseny/cataleg/registre.js:70-75`).

**Acció suggerida:** decidir per cada fitxer si s'integra o s'elimina, i actualitzar
la porta perquè valide exclusivament `manifest.js` + `detailRegistry.jsx` + exports
reals. No conservar el monòlit com a dependència oculta de la porta.

### M-02 — Token inventat a la graella

`AppGridShell.css` usa `--sdp-accent-rgb` en hover/focus
(`src/components/layout/AppGridShell.css:175-187`), però el token no existeix.
La porta `porta:graella` cau. Ja existeix el token semàntic adequat
`--sdp-anell-accent` (`src/css/tokens.css:270-271`).

```css
.app-grid-resizer:hover::before,
.app-grid-resizer:focus-visible::before {
  background: var(--sdp-anell-accent);
}
```

### M-03 — Estabilització de `config` cara i fràgil

`App` calcula `JSON.stringify(config)` en cada render per decidir la dependència
del `useMemo` (`src/app/App.jsx:408-417`). El Web Component ja crea i congela un
objecte nou només quan canvia una clau
(`src/PedraSecaEmbed.jsx:398-419`), així que el stringify és redundant. A més,
ignora funcions, falla amb estructures circulars i escala amb tota la configuració.

**Solució suggerida:** passar `config` directament o estabilitzar-la a la frontera
amb una comparació explícita dels camps permesos. Eliminar també els residus que
ESLint ja assenyala: `isGestoriaLink` no usat
(`src/app/App.jsx:73-79`), `useEffect` i `setMemberships` no usats
(`src/app/contexts/IdentitatContext.jsx:1-35`) i `meta` ignorat en Disseny
(`src/sections/disseny/DesignSection.jsx:37-54`).

---

## Anàlisi específica de cicles i renders

### No hi ha bucle infinit actual en `/disseny`

El flux és:

1. `WorkspaceProvider` reconcilia selecció i només emet quan detecta canvi o selecció
   inicial (`src/components/universal/workspace/WorkspaceContext.jsx:116-162`).
2. `DesignSection` compara categoria, ítem i `pagina` abans d'escriure la URL
   (`src/sections/disseny/DesignSection.jsx:37-51`).
3. La sincronització externa `selection/sync` no torna a cridar
   `onSelectionChange` (`src/components/universal/workspace/WorkspaceContext.jsx:105-114`).

Aquesta asimetria talla el cercle. El problema és el render redundant descrit a
A-07, no una recursió infinita.

### Càrrega lazy ben situada, però sense prova ni recuperació

Les crides `lazy()` viuen a nivell de mòdul i no es recreen en cada render
(`src/sections/disseny/cataleg/detailRegistry.jsx:1-32`). Això és correcte. El
manifest i el registre contenen 28 claus, sense duplicats, sense categories
desconegudes i amb correspondència 1:1. El fracàs està en les rutes internes dels
chunks, en dos estats perduts i en l'absència d'una prova que importe tots els
loaders.

## Controls que sí funcionen

- `WorkspaceProvider` normalitza IDs una vegada per canvi de dades i usa mapes per
  resoldre selecció (`src/components/universal/workspace/WorkspaceContext.jsx:29-67`).
- La reconciliació no mou l'editor quan només canvien filtres i protegeix IDs
  pendents durant creació (`src/components/universal/workspace/WorkspaceContext.jsx:116-159`).
- Les peticions Supabase tenen timeout, `AbortController` i neteja de listeners
  (`src/data/supabase/runtime.js:43-65`). Falta propagar el senyal des dels providers.
- El detall i la llista tenen límits d'error separats
  (`src/components/universal/workspace/UniversalWorkspace.jsx:82-102`).
- Els 28 `detailKey` del manifest tenen loader i no hi ha loaders orfes.
- La bateria actual passa 44/44, però no carrega tots els chunks ni prova el router
  amb `basename` o `MemoryRouter`; el test d'App només comprova que existeix un
  contenidor (`src/app/App.test.jsx:7-38`).

## Resultats de verificació

| Verificació | Resultat | Lectura |
| --- | --- | --- |
| `vite build --outDir /tmp/...` | **FALLA** | primer import irresoluble en `EspecimenNavMobil.jsx:4` |
| `npm test -- --run` | 10 fitxers, 44/44 | verd, però sense cobertura dels chunks nous |
| ESLint nucli auditat | 0 errors, 7 avisos | residus a App, Identitat, Router i Disseny |
| ESLint `detalls/*.jsx` | **9 errors, 202 avisos** | estat no declarat i extracció mecànica bruta |
| `porta:importacions` | **FALLA: 31** | imports cap al no-res |
| `porta:cataleg` | **FALLA: 1** | porta/registre desalineats amb `UniversalWorkspace` |
| `porta:graella` | **FALLA: 1** | `--sdp-accent-rgb` inexistent |
| `porta:enxufe` | passa | el port és l'única frontera i el pany està al host |
| `porta:manifest` | passa | manifest global: 18 declarats i 18 al disc |
| consistència catàleg | passa | 28 ítems, 28 loaders, zero duplicats o orfes |
| `git diff --check` | **FALLA: 2** | espais finals en `SessionContext.jsx:3` i `UniversalToolbar.jsx:82` |
| `tooling/gates/tancament.mjs` | **FALLA: 2** | dos prompts preexistents de l'escriptori no estan ancorats; l'informe sí |

La bateria de tests verda no invalida el build roig: Vitest no força la resolució
dels imports dinàmics que no visita.

## Incògnites

- **[SUPÒSIT]** La latència percebuda dels 28 chunks sota 3G/4G rural dependrà del
  desplegament real, compressió, CDN i política de cache. L'auditoria estàtica no
  pot quantificar-la.
- **[SUPÒSIT]** La transferència exacta de focus entre Shadow DOM tancat i lector de
  pantalla varia entre Safari/VoiceOver, Chromium/TalkBack i Firefox/NVDA. Cal prova
  manual després de C-09, A-04 i A-05.
- No hi ha en el repositori una implementació real de l'adaptador Sollutia contra
  la qual provar timeout, cancel·lació, signatures i recuperació. Les portes només
  validen noms i frontera estàtica.
- No s'ha mesurat memòria amb un host que moga repetidament el Web Component. A-01
  i A-02 es dedueixen del cicle de vida i del recompte del codi.

## Pla de remediació proposat

### Fase 0 — Aturadors de build

1. Corregir els 31 imports.
2. Restaurar `visible` i `modal`.
3. Afegir un test que importe i renderitze cada loader.
4. Exigir `porta:importacions`, ESLint i build abans de declarar net el catàleg.

### Fase 1 — Integritat de dades i host

1. Fer fallar les mutacions degradades; cap `async () => {}` per a escriptures.
2. Implementar una recàrrega real per Core, Mur, Notes i Multimèdia.
3. Corregir `MemoryRouter`, `basename` i historial de seleccions.
4. Unificar norma i API pública de Sollutia en una prova de contracte.

### Fase 2 — Accessibilitat i xarxa

1. Anunciar tots els fallbacks asíncrons i alimentar `aria-busy` amb estat real.
2. Transferir focus en selecció, back/forward i plegat de columnes.
3. Fer recuperables els errors de chunk.
4. Avortar càrregues obsoletes.

### Fase 3 — Rendiment i neteja

1. Eliminar la subscripció global inútil al xat.
2. Separar context de selecció, filtres i detall.
3. Retirar el catàleg monolític i espècimens orfes després de confirmar-ne el destí.
4. Actualitzar les portes perquè miren l'arquitectura nova, no els fitxers eliminats.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura.
- [x] He citat les rutes i línies del codi original per a cada afirmació material.
- [x] No he inventat cap fitxer, funció o variable com a part de l'estat actual.
- [x] Tota projecció no executable està marcada `[SUPÒSIT]` o és a Incògnites.
- [x] No s'ha usat cerca web, navegador ni recuperació externa.
- [x] No s'ha modificat, afegit ni esborrat cap línia de codi.
- [x] El document passa una validació aïllada amb `tractor-frontmatter.mjs --estricte`.
