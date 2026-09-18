---
type: informe
status: esborrany
description: Auditoria extrema post-reparacions amb verificació executable, veredicte de producció i nota final
tags:
  - arquitectura
  - sollutia
---

# INFORME — Auditoria extrema post-reparacions amb nota

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-0538 |
| Versió | 1.0.0 |
| Entorn | `entorn-dev-local` |
| Creació | 26-09-18 05:38 CEST |
| Modificació | 26-09-18 05:45 CEST |
| Tall auditat | working tree local sobre `backup-notes-publish` |
| Agent auditor | ChatGPT Codex |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260918_0528_PROMPT_auditoria_extrema_v2]]
- [[260918_0509_informe_auditoria_extrema_postimplementacio]]

## Entrades i límits

- Codi i migracions del working tree local.
- Captura històrica `Captura de pantalla 2026-09-04 a las 2.58.11.png`,
  modificada el 04-09-2026 a les 02:58 CEST.
- Sense bundle: l'auditoria s'ha fet directament sobre l'entorn local.

No s'ha usat web, navegador ni cap font externa. L'agent auditor no ha modificat
codi: l'única escriptura pròpia és aquest informe. Durant l'auditoria s'ha detectat
una modificació concurrent a `src/app/App.jsx`; s'ha repetit la validació sobre
l'estat posterior i és aquest últim tall el que dicta el veredicte. «Pedra Seca»
significa exclusivament el sistema de disseny / UI Kit.

La captura és anterior al tall auditat i mostra `/notes`; el codi actual situa
Notes dins de les rutes d'actor `/jo/*` i `/e/:slug/*`
(`src/app/App.jsx:514-528`, `src/app/App.jsx:565-580`). Per tant, s'ha usat com a
referència d'intenció visual, no com a prova que el render actual siga correcte.

## Veredicte executiu

**NO-GO. Segell de producció denegat en aquest tall.**

La intervenció és una millora real: tests i builds passen; el router, les fonts,
la cancel·lació de Mur i el desacoblament del detall han avançat de manera
coherent. Però l'estat no és segellable per quatre motius:

1. la reparació de `aria-busy` només representa part de les càrregues i el
   fallback visible usa classes sense estil associat;
2. el contracte canònic de Sollutia encara promet configuració global que
   `configura()` no accepta;
3. Core ja no bloqueja totes les rutes, però la degradació és silenciosa, no ofereix
   reintent visible i trenca `/page/:slug` mentre les dades no estan preparades;
4. la cadena de qualitat pròpia està roja: fallen la porta de graella, la de
   frontmatter i diverses portes dures del sistema de disseny; a més,
   `git diff --check` detecta sis línies amb espais finals en les reparacions.

No és un fracàs estructural: és una arquitectura recuperada però encara sense
tancament de contracte, cobertura de regressió ni coherència entre codi, CSS,
documentació i portes.

## LA NOTA FINAL

# **6,2 / 10**

| Àrea | Puntuació | Lectura |
| --- | ---: | --- |
| Compilació i execució mecànica | 1,8 / 2,0 | 47/47 tests i dos builds verds |
| Arquitectura i cicles de vida | 1,6 / 2,0 | fonts, router, abort i renders ben encaminats |
| Accessibilitat i resiliència | 1,0 / 2,0 | estat global incomplet i càrrega visual sense estil |
| Contracte Sollutia | 0,8 / 1,5 | parcial + `deferArrenca` sí; configuració global encara falsa |
| Cobertura i portes | 0,7 / 1,5 | fluxos crítics sense prova i cadena de segellat roja |
| Neteja i mantenibilitat | 0,3 / 1,0 | 323 avisos, tokens i espais finals |
| **Total** | **6,2 / 10** | **apta per continuar reparant, no per producció** |

## Resultats executables

| Verificació | Resultat |
| --- | --- |
| Vitest | **PASSA** · 12 fitxers, 47/47 proves |
| ESLint | **PASSA amb deute** · 0 errors, 323 avisos |
| Build web a `/private/tmp` | **PASSA** · 2.097 mòduls |
| Build standalone a `/private/tmp` | **PASSA** · 1.777,09 kB; gzip 518,61 kB |
| `porta:cataleg` | **PASSA** · 52 components registrats |
| `porta:importacions` | **PASSA** |
| `porta:enxufe` | **PASSA** |
| `porta:manifest` | **PASSA** · 18 declarats / 18 al disc |
| `porta:graella` | **FALLA** · 2 props reals no documentades |
| `porta:frontmatter` | **FALLA** · F2 puja de 94 a 95; l'informe nou no apareix entre els errors |
| `porta:pedra-seca` | **FALLA** · deute nou de classes, estil i subarbres |
| `porta:design-guard` | **FALLA** |
| `porta:tokens` | **FALLA** · 14 infraccions |
| `porta:cromatic` | **FALLA** · 3 comentaris de contrast desactualitzats |
| `porta:crom` | **FALLA** · 3 divergències de la SideBar |
| `porta:inlinestyles` | **FALLA** · 3 estils en línia prohibits |
| `porta:rls` | **FALLA**, però amb 2 alarmes històriques analitzades més avall |
| `git diff --check` | **FALLA** · 6 espais finals |

Els scripts de lint, tests, build i portes formen part del contracte declarat del
projecte (`package.json:10-82`). La cadena agregativa inclou expressament graella,
sistema de disseny, tokens, cromàtica, estils en línia, RLS i proves
(`tooling/gates/run-portes.mjs:29-79`); per això «tests + lint + build» és necessari
però no suficient per a afirmar que el segell passa.

## Matriu de les reparacions declarades

| Reparació | Estat | Veredicte |
| --- | --- | --- |
| `aria-busy` / `globalStatus` | **PARCIAL** | connectat en càrrega inicial i reintent; incomplet en altres càrregues |
| Host parcial + `deferArrenca` | **PARCIAL** | implementació present; norma encara divergent i sense prova de contracte |
| Fonts en reconnectar | **TANCADA ESTÀTICAMENT** | `_config = null` força recàrrega correcta; falta prova de cicle real |
| Detall fora del cicle de cerca | **TANCADA ESTÀTICAMENT** | detall sense subscripció directa al context; falta comptador de renders |
| `AbortController` de Mur | **TANCADA ESTÀTICAMENT** | senyal propagat i cleanup correcte; falta prova de cancel·lació |

## Troballes bloquejants

### C3-01 — L'estat global de càrrega continua incomplet i el spinner no té CSS

`UIContext` ja publica `status` i exposa `setGlobalStatus`
(`src/app/contexts/UIContext.jsx:52-96`). `AppShell` el connecta correctament a
`aria-busy` (`src/app/App.jsx:297-303`). Aquesta part és bona.

La cobertura semàntica, però, no és global:

- l'efecte de Core posa `ready` o `error` després de resoldre, però no posa
  `loading` en començar una càrrega causada per canvi d'actor o configuració
  (`src/app/contexts/CoreContentContext.jsx:17-40`);
- el provider de Core es remunta amb cada `actorKey`
  (`src/app/App.jsx:427-443`), mentre l'estat de `UIProvider` sobreviu;
- el `Suspense` de les rutes mostra `RouteFallback`, però no actualitza el
  `globalStatus` (`src/app/App.jsx:514-518`).

Conseqüència: després de la càrrega inicial, pot haver-hi un fallback o una nova
petició mentre `<main aria-busy="false">`.

Hi ha, a més, una regressió visual verificable per noms: `RouteFallback` pinta
`sdp-app-loading`, `sdp-spinner` i `sdp-spinner--large`
(`src/app/App.jsx:56-62`), però l'única regla de spinner present usa el selector
distint `.spinner` (`src/css/modules.css:903-918`). El text queda ocult amb
`.sr-only` (`src/css/base.css:229-232`). **[INFERÈNCIA ESTÀTICA]** En una càrrega
lenta, el lector de pantalla rep l'avís, però la persona vident pot veure una zona
buida en compte d'un indicador.

**Criteri de tancament:** un únic model de càrrega que cobrisca inici, canvi
d'actor/config, reintent i chunks lazy; selectors CSS reals; prova accessible de
`aria-busy` i del fallback visible.

### C3-02 — El contracte canònic de Sollutia només s'ha reparat a mitges

El codi incorpora les dues millores anunciades:

- `deferArrenca()` existeix i talla tant la programació com el callback automàtic
  (`src/host.js:96-101`, `src/host.js:239-269`);
- una injecció parcial del nucli es combina amb la implementació Supabase abans
  del segellat (`src/host.js:159-190`);
- l'API global exposa `deferArrenca`
  (`src/host.js:298-315`).

Però la norma diu que `window.SocDePoble.configura()` accepta «backend o
configuració» i enumera tres canals de configuració
(`_wiki_de_poble/02_saber/estandard_integracio_react.md:21-55`). El codi continua
desestructurant exclusivament `{ backend, force }`; qualsevol altra configuració
global queda descartada (`src/host.js:105-149`). A més, el comentari del mateix
host encara descriu el mode com a contracte sencer i estricte
(`src/host.js:105-110`), contrari a la fusió parcial implementada.

**Impacte:** Sollutia pot seguir la norma canònica i creure que ha configurat el
component quan no ho ha fet.

**Criteri de tancament:** decidir si `configura()` és només backend o també
configuració del component; alinear norma, JSDoc i codi; executar en test el mateix
snippet que es lliura a Sollutia, inclosos parcial, ajornament, segellat i rebuig
tardà.

### C3-03 — Core ja no bloqueja el portal, però la degradació no és total

El canvi concurrent elimina correctament la porta global: `AppDataLoader` sempre
renderitza les rutes i, quan Core falla, només escriu un avís a consola
(`src/app/App.jsx:447-463`). Açò recupera l'accés a Xat, Mur, Notes i altres rutes
que poden treballar amb dades pròpies o locals.

La nova frontera, però, no és segura per a totes les consumidores. Mentre Core està
en `loading` o `error`, el context retorna col·leccions buides però no defineix
`pageDetailLookup` (`src/app/contexts/CoreContentContext.jsx:42-60`). La ruta de
detall la desestructura i crida immediatament `.get()`
(`src/sections/detail/PageDetailSection.jsx:11-16`). **[INFERÈNCIA ESTÀTICA]** Una
entrada directa o un refresc de `/page/:slug` abans de `ready`, i qualsevol visita
durant un error persistent, provoca un `TypeError` i acaba en el límit genèric de
ruta (`src/app/App.jsx:466-486`).

La degradació tampoc comunica l'error ni ofereix reintent a la persona usuària:
`refresh` existeix i rellança l'efecte
(`src/app/contexts/CoreContentContext.jsx:42-68`), però `AppDataLoader` no el
projecta en cap control visible (`src/app/App.jsx:447-463`).

**Criteri de tancament:** fer total el contracte del context en tots els estats,
mostrar una alerta no bloquejant amb reintent i provar `loading/error/ready` tant
en rutes independents com en `/page/:slug`.

### C3-04 — El camí de segellat està roig i part del roig és regressió real

La reparació de focus ha afegit `collapseBtnRef` i `expandBtnRef` al component
(`src/components/layout/AppGridColumn.jsx:8-23`,
`src/components/layout/AppGridColumn.jsx:53-66`,
`src/components/layout/AppGridColumn.jsx:80-106`). La fitxa de contracte no els
declara (`_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md:23-38`).
Per això `porta:graella` falla i la cadena oficial s'atura.

El sistema de disseny també detecta classes noves sense selector. El cas funcional
més important és el fallback de càrrega de C3-01. En el workspace, el JSX introdueix
`sdp-workspace-groups`, `sdp-workspace-group` i
`sdp-workspace-group__title` (`src/components/universal/workspace/UniversalWorkspace.jsx:202-217`),
mentre el bloc CSS adjacent comença directament en columna, llista i categoria
(`src/css/modules.css:170-215`). **[INFERÈNCIA ESTÀTICA]** Els títols de grup cauen
en l'estil editorial global d'`h3`, que incorpora marge i vora inferior
(`src/css/base.css:91-101`), en compte del tractament compacte que mostra la captura
històrica.

La porta de frontmatter també falla: el límit segellat és F2 = 94
(`.agents/deute/.frontmatter-deute.json:6-14`), però el recompte actual és 95 i
assenyala la clau aliena `actualitzat` (`.agents/ESTAT.md:1-6`). La línia no forma
part del diff actual d'eixe fitxer i l'informe nou no apareix en cap categoria
d'error. **[INFERÈNCIA ESTÀTICA]** El baseline de govern està desalineat amb el
mateix `HEAD` o amb un canvi anterior al tall, no amb el frontmatter d'aquest
informe; en qualsevol cas, la porta oficial continua roja.

**Criteri de tancament:** cap baseline nou. Documentar els refs, donar estil
semàntic als selectors reals, reconciliar el frontmatter sense amagar deute,
eliminar les infraccions noves i fer passar la cadena existent.

## Advertències importants

### A3-01 — Les reparacions crítiques no tenen proves de regressió

La prova d'App només comprova que hi ha un contenidor i usa un backend parcial
(`src/app/App.test.jsx:7-38`). La prova del workspace valida el bail-out del
reductor, però no compta renders de `DetailColumn`
(`src/components/universal/workspace/workspaceState.test.js:4-29`). La prova dels
espècimens usa `MemoryRouter`, però no exercita `basename`, historial, href natiu
ni les promeses del registre real (`src/sections/disseny/cataleg/detalls/allLoaders.test.jsx:10-35`).

No hi ha prova executable de reconnectar fonts, `deferArrenca`, injecció parcial,
`aria-busy`, reintent Core o avortament de Mur.

### A3-02 — L'optimització del detall és correcta, però delicada

`DetailColumn` ja no crida `useWorkspace`; rep només ítem, estat i selecció i està
embolcallat amb `memo` (`src/components/universal/workspace/UniversalWorkspace.jsx:420-454`).
`WorkspaceFrame` fixa les dependències que han de reconstruir l'arbre del detall
(`src/components/universal/workspace/UniversalWorkspace.jsx:74-129`). Açò evita el
render del detall en `query/set`, mentre la llista continua actualitzant-se per
context.

La protecció, però, depén d'una llista manual de dependències i no hi ha prova que
la mesure. Una futura prop nova o un canvi d'identitat d'ítem pot reintroduir
staleness o renders sense que Vitest ho veja.

### A3-03 — Fonts i cancel·lació: codi correcte, verificació insuficient

En desmuntatge, les fonts es decrementen i `_config` es posa a `null`
(`src/PedraSecaEmbed.jsx:553-570`). En reconnectar, `_recalcularConfig()` detecta
necessàriament canvi i torna a carregar l'URL (`src/PedraSecaEmbed.jsx:401-425`).
La causa de la pèrdua de fonts queda corregida per flux estàtic.

Mur crea un `AbortController`, passa `signal` i avorta en cleanup
(`src/sections/mur/MurContext.jsx:15-36`). `loadMur` conserva el `config` fins a
`loadAppData` (`src/data/supabase/content.js:76-77`) i el client HTTP encadena i
neteja el senyal extern (`src/data/supabase/runtime.js:43-65`). També és una
reparació correcta per flux estàtic.

Falten proves que demostren el balanç 0→1→0→1 de fonts i que una petició Mur
obsoleta rep realment `abort`.

### A3-04 — Tokens inexistents i estils en línia trenquen la disciplina del UI Kit

Hi ha usos de `--sdp-ombra-4` en diàleg i calaix
(`src/css/components.css:170-175`, `src/css/modules.css:1915-1924`), però el sistema
només defineix tres elevacions segons el seu propi contracte de tokens
(`src/css/tokens.css:150-154`). **[INFERÈNCIA ESTÀTICA]** En absència de fallback,
el navegador descarta el `box-shadow`, no el component sencer.

També queden estils estructurals en línia en l'editor
(`src/components/universal/UniversalEditorShell.jsx:150-155`) i en un espècimen
(`src/sections/disseny/cataleg/detalls/EspecimenInventariGlobal.jsx:8-16`). No
trenquen el build Vite, però sí la política mecanitzada del sistema de disseny.

### A3-05 — ESLint passa, però «net» no descriu 323 avisos

El linter retorna zero errors, però manté 323 avisos. Entre els residus del nucli
hi ha un paràmetre sense ús a `buildPath`
(`src/app/App.jsx:72-80`) i imports/estat sense ús en Identitat
(`src/app/contexts/IdentitatContext.jsx:1-35`). La major part del volum prové dels
espècimens migrats amb importacions no utilitzades.

El diff també conté espais finals a
`src/app/contexts/RouterContext.jsx:147`,
`src/app/contexts/UIContext.jsx:51`,
`src/components/universal/workspace/UniversalWorkspace.jsx:420-421` i
`src/sections/mur/MurContext.jsx:32-33`.

## Portes roges que no equivalen a una vulnerabilitat actual

### RLS — alarma històrica, no prova del resultat final

La porta acusa `private.ajustos` sense RLS i una política antiga
`profiles read own` amb `using (true)`. La primera taula revoca tot accés a
`public`, `anon` i `authenticated` (`supabase/migrations/260908_0000_initial_schema.sql:17-21`).
La política oberta apareix en una migració intermèdia
(`supabase/migrations/260911_0600_perfil_avatar_i_permisos.sql:25-28`), però les
migracions posteriors revoquen `anon` i restauren lectura pròpia
(`supabase/migrations/260912_1500_correccio_privacitat_perfils.sql:7-17`), i la
migració més recent la torna a imposar
(`supabase/migrations/260916_0600_politiques_superadmin_organitzacions.sql:74-79`).

**[INFERÈNCIA ESTÀTICA]** Amb totes les migracions aplicades en ordre, aquests dos
avisos no demostren un forat RLS final. Sí demostren que la porta analitza cada
fitxer com si fora l'estat final i genera falsos positius; cal fer-la conscient de
l'ordre o validar l'esquema resultant.

### Crom — contradicció de govern visual

La porta exigeix que `.sidebar-control-btn` siga una píndola i mai ocupe el 100%
(`tooling/gates/tractor-crom.mjs:25-27`). El CSS declara explícitament que el
Mestre va demanar recuperar el bloc complet i aplica `width: 100%` i radi zero
(`src/css/layout.css:76-91`). La captura històrica també mostra aquest bloc complet.

No es pot resoldre tècnicament sense decisió de govern: o la captura/comanda humana
és canònica i s'actualitza la porta, o la porta és canònica i es canvia el disseny.
Mentre coexistisquen, qualsevol segell és contradictori.

### Cromàtica — els valors són millors que els comentaris

La porta mesura contrastos superiors als comentats per `--sdp-text-suau`,
`--sdp-accent-text` i `--sdp-accent-titol`; les declaracions i comentaris viuen a
`src/css/tokens.css:104-123`. No és una regressió de contrast: és documentació
numèrica caducada que, per política dura, bloqueja igualment la porta.

## Estat de les incidències anteriors

| Incidència anterior | Estat actual |
| --- | --- |
| `MemoryRouter` inicial amb `basename` | **tancada estàticament**: entrada `/` a `src/app/contexts/RouterContext.jsx:277-309` |
| href natiu sota `basename` | **tancada estàticament**: `src/app/contexts/RouterContext.jsx:130-152` |
| reintent Core absent | **tancada**: `src/app/contexts/CoreContentContext.jsx:42-68` |
| degradació global per Core | **millorada però incompleta**: C3-03 |
| `aria-busy` fals | **parcial**: C3-01 |
| contracte Sollutia | **parcial**: C3-02 |
| pèrdua de fonts | **tancada estàticament**: A3-03 |
| detall repintat en cerca | **tancada estàticament**: A3-02 |
| Mur sense cancel·lació | **tancada estàticament**: A3-03 |

## Condicions mínimes per a un GO

1. Completar el model de càrrega i afegir CSS real al fallback visible.
2. Fer coincidir el contracte canònic de Sollutia amb `configura()` i provar-lo.
3. Completar i provar la degradació de Core: contracte total, alerta, reintent i
   detall `/page/:slug` segur.
4. Fer passar `porta:graella` documentant els dos refs de focus.
5. Reconciliar `porta:frontmatter` amb el corpus real sense apujar el baseline.
6. Resoldre les infraccions noves del sistema de disseny sense congelar un baseline
   pitjor: classes orfes, tokens inexistents i estils en línia.
7. Resoldre la contradicció humana `sidebar-control-btn` versus `porta:crom`.
8. Corregir la porta RLS perquè avalue l'estat acumulat, i després exigir-la verda.
9. Afegir proves de router, host, Core, fonts, renders i cancel·lació.
10. Deixar `git diff --check` net i reduir el linter a un pressupost explícit.
11. Repetir tests, lint, builds i la cadena agregativa completa.

## Incògnites

- **[SUPÒSIT]** No s'ha validat el component dins del host real de Sollutia ni
  l'ordre real dels scripts PHP/IIFE.
- **[SUPÒSIT]** No s'ha executat cap navegador per prohibició expressa; les
  conclusions visuals actuals deriven del CSS i la captura només és històrica.
- **[SUPÒSIT]** No s'ha perfilat memòria ni recompte de renders; fonts i detall
  s'han validat per flux estàtic.
- No s'ha aplicat la cadena SQL sobre una base efímera per inspeccionar l'esquema
  RLS final; l'ordre de migracions indica la reparació, però falta una prova de BD.
- No s'ha mesurat xarxa rural, recuperació de chunks, cache ni temps de primera
  càrrega del standalone de 518,61 kB gzip.

## Bateria de veritat

- [x] He citat afirmacions de codi com `ruta:linies`.
- [x] No he inventat cap fitxer, funció o variable.
- [x] Les deduccions no executades estan marcades `[INFERÈNCIA ESTÀTICA]` o
  `[SUPÒSIT]`.
- [x] No he usat web, navegador ni recuperació externa.
- [x] No he modificat, afegit ni esborrat cap línia de codi.
- [x] L'únic fitxer creat és aquest informe Markdown.
- [x] La captura s'ha tractat com a evidència històrica, no com a instrucció ni
  com a prova del render actual.
- [x] «Pedra Seca» s'ha interpretat només com el sistema de disseny / UI Kit.
