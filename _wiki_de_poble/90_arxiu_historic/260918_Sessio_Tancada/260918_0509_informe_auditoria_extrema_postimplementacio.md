---
type: informe
status: esborrany
description: Segona auditoria extrema postimplementació amb verificació de router, workspace, portes, tests i desplegament
tags:
  - sollutia
---

# INFORME — Segona Auditoria Extrema Global Post-Implementació

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-AUDIT2 |
| Versió | 1.0.0 |
| Entorn | `entorn-dev-local` |
| Creació | 26-09-18 05:09 CEST |
| Modificació | 26-09-18 05:09 CEST |
| Tall auditat | commit `e0594755` sobre la branca `backup-notes-publish` |
| Agent auditor | Codex |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260918_0500_PROMPT_auditoria_extrema_post_implementacio]]
- [[260918_0243_informe_auditoria_extrema_postmigracio]]
- [[260918_0435_PROMPT_implementacio_auditoria]]

## Abast, mètode i límits

Auditoria de només lectura del codi real. No s'ha fet cap cerca web ni s'ha
modificat cap línia de codi. «Pedra Seca» s'interpreta exclusivament com el
sistema de disseny / UI Kit.

S'han inspeccionat el router propi, la selecció Browser/Memory del Web Component,
el contracte públic de Sollutia, el cicle de vida de fonts i escoltadors, els
providers de dades, `UniversalWorkspace`, el reductor i les proves incorporades.
S'han executat les dues portes demanades, Vitest, ESLint i els dos builds Vite amb
eixida a directoris temporals fora del repositori.

No s'ha obert navegador, no s'ha connectat a cap backend real i no s'ha fet perfil
de memòria. Les troballes de cicle de vida i render són deduccions directes del
flux executable, marcades com a tals quan no hi ha prova dinàmica específica.

## Veredicte executiu

**NO-GO. La branca no està 100% neta ni es pot dictaminar com a preparada per a
desplegament.**

La intervenció ha tancat correctament el bloqueig mecànic del catàleg: les
importacions resolen, els 28 espècimens es poden importar i renderitzar, les portes
demanades passen, els 47 tests passen i els builds web i standalone compilen.

Tanmateix, queden **4 incidències crítiques C** i **3 advertències A de
memòria/rendiment**. Les més immediates són:

1. una segona instància amb `basename` arranca el `MemoryRouter` en un pathname
   incorrecte;
2. una fallada del Core continua bloquejant tot el portal i el botó de reintent
   crida una funció absent en eixe mateix estat;
3. `aria-busy` continua connectat a un `status` que `UIContext` no publica;
4. el contracte canònic de Sollutia encara promet una API que `host.js` no exposa.

### Recompte postoperatori

| Gravetat | Quantitat | Veredicte |
| --- | ---: | --- |
| C · crític | 4 | bloqueja el GO |
| A · memòria/rendiment | 3 | deute executable o escalable |
| Portes/build/tests | verd | necessari, però insuficient per al GO |

## Estat exacte del working tree

Abans de crear aquest informe, `git status --short --branch` mostrava una única
modificació preexistent:

```text
## backup-notes-publish
 M _wiki_de_poble/04_escriptori/260918_0500_PROMPT_auditoria_extrema_post_implementacio.md
```

La diferència són quatre línies de context històric afegides al prompt. No s'han
tocat ni revertit. `git diff --check` no detectava espais finals ni errors de
format.

## Resultats executables

| Verificació | Resultat | Lectura |
| --- | --- | --- |
| `npm run porta:cataleg` | **PASSA** | 52 components registrats; 38 vius, 16 maqueta, 2 externs, 1 obsolet |
| `npm run porta:importacions` | **PASSA** | cap importació relativa òrfena |
| `npm test -- --run` | **PASSA** | 12 fitxers, 47/47 proves, 4,28 s |
| `npm run lint` | **PASSA amb deute** | 0 errors i **325 avisos** |
| build web a `/private/tmp` | **PASSA** | 2.097 mòduls; avís de `backendPort.js` estàtic + dinàmic |
| build standalone a `/private/tmp` | **PASSA** | 1.777,02 kB; gzip 518,43 kB |
| `git diff --check` | **PASSA** | cap defecte d'espaiat |

El linter confirma l'afirmació «sense errors», però no un estat net: hi ha 325
avisos, molts dels quals són importacions i variables no usades dins dels
espècimens modularitzats.

## Incidències crítiques romanents

### C2-01 — `MemoryRouter` arranca malament la segona instància amb `basename`

**Àrea:** router / integració multiinstància  
**Impacte:** una segona instància incrustada sota un prefix pot començar en la
ruta comodí en compte de la portada interna.

El Web Component força `MemoryRouter` per a tota instància que no siga la primera i
li passa també el `basename` configurat
(`src/PedraSecaEmbed.jsx:44-47`). El router de memòria inicialitza l'entrada amb
`path: base || '/'` i exposa eixe valor directament com `currentPath`
(`src/app/contexts/RouterContext.jsx:275-286`). En canvi, després de navegar sí que
lleva el prefix abans de guardar la nova entrada
(`src/app/contexts/RouterContext.jsx:297-307`).

Per tant, amb `basename="/portal"`, l'estat inicial és `/portal`, però les rutes de
l'aplicació esperen `/`, `/jo/*`, etc. La normalització només comença després de la
primera navegació.

La integració amb prefix té un segon tall: `Link` intercepta el clic ordinari però
publica `href={to}` sense anteposar el `basename`
(`src/app/contexts/RouterContext.jsx:130-149`). Obrir en pestanya nova, copiar
l'enllaç o usar el menú contextual ix del prefix del host.

**Cobertura:** no hi ha prova de comportament del router. La prova d'espècimens
només usa `MemoryRouter` com a embolcall i no navega
(`src/sections/disseny/cataleg/detalls/allLoaders.test.jsx:10-35`); la prova d'App
només comprova que existeix un contenidor
(`src/app/App.test.jsx:7-38`).

**Criteri de tancament:** prova amb dues instàncies, `basename`, entrada inicial,
`navigate(±1)`, canvi de query, clic normal i href natiu.

### C2-02 — La fallada del Core continua sent terminal i el reintent cau

**Àrea:** resiliència de dades  
**Impacte:** una caiguda de Core deixa tot el portal fora de servei; el botó
«Intentar de nou» provoca `TypeError`.

`AppContent` situa `AppDataLoader` per damunt de totes les rutes i només renderitza
`AppRoutes` quan Core està preparat
(`src/app/App.jsx:427-475`). Això continua bloquejant rutes locals que no haurien
de dependre del Core.

En estat `loading` o `error`, `CoreContentContext` retorna anticipadament un objecte
que **no conté `refresh`** (`src/app/contexts/CoreContentContext.jsx:38-40`). Però
la pantalla d'error executa `core.refresh()`
(`src/app/App.jsx:454-465`). La funció només existeix en la branca `ready`
(`src/app/contexts/CoreContentContext.jsx:40-54`), és a dir, quan no cal el botó.

**Criteri de tancament:** `refresh` estable en tots els estats, prova
error → reintent → loading → ready/error, i shell/rutes locals disponibles durant
la degradació.

### C2-03 — `aria-busy` continua alimentat per un estat inexistent

**Àrea:** accessibilitat asíncrona  
**Impacte:** el contenidor principal mai anuncia que està ocupat.

`AppShell` extrau `status` de `useUIState`
(`src/app/App.jsx:65-69`) i el transforma en `aria-busy`
(`src/app/App.jsx:297-303`). `UIContext`, però, no incorpora cap camp `status` al
valor publicat (`src/app/contexts/UIContext.jsx:75-83`). El resultat continua sent
sempre `aria-busy="false"`.

La meitat visible de l'anterior C-09 sí està corregida: el fallback té
`role="status"`, `aria-live` i text per a lector
(`src/app/App.jsx:56-62`). Això no repara el contracte fals de `<main>`.

**Criteri de tancament:** derivar `aria-busy` d'un estat real de càrrega o eliminar
l'atribut; afegir una prova accessible durant càrrega inicial i canvi de ruta lazy.

### C2-04 — El contracte canònic de Sollutia encara no correspon a l'API real

**Àrea:** host / documentació executable  
**Impacte:** una integració que segueix la norma publicada pot no configurar-se o
no arrancar.

La norma diu que `window.SocDePoble.configura()` admet backend o configuració,
permet substituir qualsevol mètode i documenta `deferArrenca()`
(`_wiki_de_poble/02_saber/estandard_integracio_react.md:21-55`). El codi real:

- només desestructura `{ backend, force }`
  (`src/host.js:100-120`);
- rebutja en l'arrencada qualsevol injecció parcial del nucli
  (`src/host.js:160-171`);
- congela una API global que no conté `deferArrenca`
  (`src/host.js:287-299`).

Aquest és el C-10 anterior encara obert. Les referències SEO afegides a la norma no
resolen la divergència d'arrencada.

**Criteri de tancament:** una sola API documentada i una prova de contracte que
execute exactament l'exemple lliurat a Sollutia.

## Advertències A de memòria i rendiment

### A2-01 — Les fonts encara desapareixen després d'un desmuntatge real i reconnexió

**Àrea:** cicle de vida / recursos globals  
**Impacte:** una instància remuntada pot quedar sense la font configurada.

La correcció evita incrementar el recompte quan `fontsHref` no canvia
(`src/PedraSecaEmbed.jsx:415-423`), però el desmuntatge decrementa i elimina els
`<link>` sense netejar `_config` ni registrar un estat «font carregada»
(`src/PedraSecaEmbed.jsx:553-578`). En reconnectar amb la mateixa configuració,
`_recalcularConfig()` conclou que no hi ha canvi
(`src/PedraSecaEmbed.jsx:401-425`) i no torna a cridar `carregarFonts()`.

**[INFERÈNCIA ESTÀTICA]** La fuita de recompte ha quedat mitigada, però la segona
meitat de l'antic A-02 continua oberta.

### A2-02 — `UniversalWorkspace` encara repinta el detall a cada tecla

**Àrea:** renderitzat / escalabilitat  
**Impacte:** editors o detalls pesants es tornen a executar amb cada canvi del
filtre de cerca.

El bail-out de `selection/sync` és correcte i conserva la identitat si no canvia
res (`src/components/universal/workspace/workspaceState.js:99-129`), amb prova
específica (`src/components/universal/workspace/workspaceState.test.js:4-29`).

Però el context únic continua publicant `state`, `filteredItems`, selecció, dades i
accions en el mateix valor (`src/components/universal/workspace/WorkspaceContext.jsx:165-183`).
`DetailColumn` consumeix eixe context complet i invoca `renderDetail`
(`src/components/universal/workspace/UniversalWorkspace.jsx:416-448`). Un
`query/set` crea un estat nou en cada tecla
(`src/components/universal/workspace/workspaceState.js:65-66`), de manera que els
consumidors del context, inclòs el detall, tornen a renderitzar.

El `useMemo` afegit a `WorkspaceFrame`
(`src/components/universal/workspace/UniversalWorkspace.jsx:65-125`) evita part
del treball del shell, però no blinda els consumidors de context que viuen dins.

**[INFERÈNCIA ESTÀTICA]** Amb 28 ítems el filtre és barat; el risc és material quan
el workspace conté editors rics o llistes grans.

### A2-03 — Mur continua sense cancel·lar peticions obsoletes

**Àrea:** xarxa / canvi d'actor / desmuntatge  
**Impacte:** peticions i sockets continuen actius fins a resposta o timeout.

Core, Notes i Multimèdia ja creen `AbortController`, propaguen el senyal i avorten
en cleanup (`src/app/contexts/CoreContentContext.jsx:15-35`,
`src/sections/notes/NotesDataContext.jsx:27-48`,
`src/sections/multimedia/MultimediaContext.jsx:15-36`). Mur conserva només la
bandera `active` i crida `loadMur(actorId, config)` sense senyal
(`src/sections/mur/MurContext.jsx:16-33`).

La capa HTTP sí sap encadenar i netejar un senyal extern
(`src/data/supabase/runtime.js:43-65`) i `loadMur` acaba passant per `loadAppData`
(`src/data/supabase/content.js:76-77`). L'antic A-09 queda, per tant, tancat només
parcialment.

## Matriu de tancament de la primera auditoria

| ID anterior | Estat actual | Evidència resumida |
| --- | --- | --- |
| C-01 imports del catàleg | **tancat** | porta d'importacions + builds verds |
| C-02 estat d'Alerta/Diàleg | **tancat** | estat local present i 28 espècimens renderitzen |
| C-03 `navigate(±1)` en memòria | **codi corregit, sense prova** | tractament numèric a `RouterContext.jsx:288-295` |
| C-04 `basename` duplicat en query | **codi corregit, sense prova** | `currentPath` a `RouterContext.jsx:102-119` |
| C-05 fals positiu de publicació | **tancat** | mutació degradada llança a `MurContext.jsx:35-37` |
| C-06 refresc inert | **parcial** | esdeveniment connectat; reintent Core trencat |
| C-07 caiguda global del Core | **obert** | C2-02 |
| C-08 cronologia Multimèdia | **tancat** | contracte buit a `MultimediaContext.jsx:38-59` |
| C-09 càrrega accessible | **parcial** | fallback corregit; `aria-busy` fals |
| C-10 contracte Sollutia | **obert** | C2-04 |
| A-01 escoltadors duplicats | **tancat** | guarda i cleanup a `PedraSecaEmbed.jsx:268-284,571-576` |
| A-02 fonts | **parcial** | A2-01 |
| A-03 recuperació lazy | **implementada, cobertura insuficient** | recàrrega forçada a `detailRegistry.jsx:3-20`; la prova importa per glob |
| A-04 focus del detall | **tancat** | `UniversalWorkspace.jsx:416-421` |
| A-05 focus en plegat | **tancat** | refs i transferència a `UniversalWorkspace.jsx:65-125,159-194,286-321` |
| A-06 historial de `/disseny` | **tancat** | push/replace segons motiu a `DesignSection.jsx:37-54` |
| A-07 cascada de renders | **parcial** | bail-out sí; context monolític encara no |
| A-08 subscripció global al xat | **tancat** | `AppDataLoader` només consumeix Core a `App.jsx:447-449` |
| A-09 cancel·lació de càrregues | **parcial** | Mur encara no avorta |

## Deute de verificació

La bateria de 47 proves és verda, però continua sent massa estreta per al
veredicte de desplegament:

- no prova `RouterProvider`, `MemoryRouter`, `basename`, historial ni `Link`;
- no prova error i reintent del Core;
- no prova reconnexió real del Web Component amb fonts;
- no compta renders del detall durant `query/set`;
- la prova dels espècimens importa els fitxers via `import.meta.glob` i compara
  quantitats, però no recorre les promeses de `CATALOG_DETAIL_LOADERS`
  (`src/sections/disseny/cataleg/detalls/allLoaders.test.jsx:10-35`).

## Condicions mínimes per a un GO

1. Corregir i provar l'entrada inicial de `MemoryRouter` amb `basename`, i generar
   hrefs natius dins del prefix.
2. Exposar un `core.refresh` estable en qualsevol estat i no fer terminal el Core
   per a les rutes que poden funcionar sense ell.
3. Connectar `aria-busy` a càrrega real.
4. Fer coincidir norma i API pública de Sollutia, inclosa l'arrencada manual.
5. Tancar el cicle de vida de fonts amb estat explícit per instància.
6. Separar el context de detall del context de filtres o introduir selectors.
7. Propagar cancel·lació també a Mur.
8. Afegir les proves de regressió anteriors i repetir portes, lint, tests i builds.

## Incògnites

- **[SUPÒSIT]** No s'ha validat el comportament dins del host real de Sollutia;
  l'efecte exacte de C2-01 depén del `basename` de producció i del nombre
  d'instàncies simultànies.
- **[SUPÒSIT]** No s'ha mesurat amb profiler el cost de A2-02 ni la memòria de
  A2-01. La causalitat deriva del cicle de React i del recompte explícit del codi.
- No s'ha validat xarxa rural, CDN, cache ni recuperació de chunks en un navegador
  real.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar-ne l'estructura.
- [x] Tota afirmació material sobre codi cita ruta i línies.
- [x] No s'ha usat cerca web, navegador ni recuperació externa.
- [x] No s'ha modificat, afegit ni esborrat cap línia de codi.
- [x] «Pedra Seca» s'ha interpretat exclusivament com el sistema de disseny.
- [x] El nom usa hora termodinàmica `AAMMDD_HHMM` i el frontmatter canònic.
- [x] Les inferències no provades dinàmicament estan identificades.

