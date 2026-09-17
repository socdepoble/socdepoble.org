---
tipus: informe
estat: esborrany
description: Auditoria de refactorització del Bloc de Notes i UniversalWorkspace amb poda i alineació visual
tags:
  - disseny
  - arquitectura
---

# Informe — Auditoria de millora del Bloc de Notes i UniversalWorkspace

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-20260917-2053 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 20:53 CEST |
| Agent auditor | ChatGPT Codex |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Branca observada | `backup-notes-publish` |
| Commit base | `0728da015036734315eb0f49148015499cb0d3d9` |
| Estat de l'arbre | brut abans de l'auditoria; preservat |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]

## Dictamen executiu

No s'han identificat incidències P0 ni P1 dins de l'abast demanat. Sí que hi ha sis defectes P2 que convé resoldre abans de donar per consolidada la migració del Bloc de Notes a `UniversalWorkspace`, i deu deutes P3 aptes per a una poda posterior.

El desajust principal amb la captura no és cosmètic: el model actual només representa les carpetes com a navegació de la columna esquerra, omet les categories de la projecció de Notes i col·loca les etiquetes damunt de la llista central. La referència visual, en canvi, reserva la columna esquerra a tres blocs diferents: CARPETES, CATEGORIES i ETIQUETES.

També hi ha un risc funcional en el desat: títol, subtítol, entradeta i cos tenen temporitzadors independents, però tots poden enviar la mateixa revisió optimista si es desen alhora. El backend rebutja precisament eixa situació com a conflicte.

## Abast, font i contenció

- Fitxers centrals: `src/sections/notes/NotesContext.jsx`, `src/sections/notes/NotesSection.jsx`, `src/sections/notes/NotesEditor.jsx`, `src/components/universal/workspace/UniversalWorkspace.jsx`, `src/components/universal/workspace/WorkspaceContext.jsx`, `src/components/universal/workspace/workspaceState.js`, `src/components/layout/AppGridShell.jsx`, `src/components/layout/AppGridColumn.jsx`, `src/components/layout/AppGridShell.css` i `src/css/modules.css`.
- Contractes adjacents comprovats: persistència efímera, adaptador Supabase de Notes, router, editor universal i portes de qualitat.
- Referència visual: `/Users/javillinares/Desktop/Captura de pantalla 2026-09-04 a las 2.58.11.png`.
- «Pedra Seca» s'ha interpretat exclusivament com el Sistema de Disseny / UI Kit.
- No s'ha modificat, afegit ni esborrat codi. L'única escriptura d'esta auditoria és este informe.
- Les modificacions prèvies no confirmades de l'arbre s'han auditat tal com estaven i no s'han alterat.

## Contrast amb la captura de referència

La captura mostra una jerarquia estable que val la pena conservar:

| Zona | Patró visible en la referència | Estat del codi actual | Veredicte |
| --- | --- | --- | --- |
| Columna esquerra | CARPETES, CATEGORIES i ETIQUETES com a blocs diferents | `NotesSection` només projecta `noteFolders` com a `categories`; `UniversalWorkspace` pinta una sola llista plana: `src/sections/notes/NotesSection.jsx:28-38`; `src/components/universal/workspace/UniversalWorkspace.jsx:151-175` | P2: el model no pot reproduir la jerarquia |
| Etiquetes | Dins de la columna esquerra | Es deriven globalment i es pinten damunt de la llista central: `src/components/universal/workspace/UniversalWorkspace.jsx:204-208,294-316` | P2: ubicació i semàntica divergents |
| Configuració | Engranatge visible en el crom de navegació | L'acció només existeix si arriba `onManageCategories`: `src/components/universal/workspace/UniversalWorkspace.jsx:120-126`; Notes no la proporciona realment: `src/sections/notes/NotesContext.jsx:155-166` | P2: el botó desapareix |
| Creació | «CREAR NOTA» a l'extrem dret de la barra de la llista | Cerca, crear i replegar comparteixen el mateix grup final: `src/components/universal/workspace/UniversalWorkspace.jsx:257-273`; `src/components/layout/AppGridColumn.jsx:88-101` | P3: falta un contracte explícit d'accions inicials/finals |
| Capçaleres | Títol al principi i control de replegar a l'extrem oposat | Este patró sí que està expressat per `AppGridColumn`: `src/components/layout/AppGridColumn.jsx:65-103` | Conforme, amb marge per separar la subbarra |

### Distribució recomanada

1. Capçalera esquerra: desplegable + títol del bloc al principi; replegar columna al final.
2. Subbarra de navegació: «Tot» al principi; cerca i configuració al final.
3. Cos esquerre: tres grups semàntics independents i plegables: carpetes, categories i etiquetes.
4. Capçalera central: «NOTES» al principi; replegar columna al final.
5. Subbarra central: resum de filtres al principi i «CREAR NOTA» al final.
6. Eliminar les píndoles d'etiquetes de damunt de la llista central quan ja estiguen disponibles al grup ETIQUETES.

Per fer-ho sense condicions específiques de Notes dins del component universal, `AppGridColumn` hauria de formalitzar ranures `startActions` i `endActions` (o equivalents) i `UniversalWorkspace` hauria de rebre grups de navegació, no una única llista plana disfressada de categories.

## Troballes P2

### P2-01 — El model del workspace no pot expressar carpetes, categories i etiquetes separades

`toWorkspaceNote` projecta `folderId` a `categoryIds` i conserva `tags`, però no projecta la categoria de la nota: `src/sections/notes/NotesSection.jsx:8-19`. El model només construeix la navegació a partir de `noteFolders`: `src/sections/notes/NotesSection.jsx:28-38`. El component universal, al seu torn, té un únic bloc de categories i envia les etiquetes a la columna central: `src/components/universal/workspace/UniversalWorkspace.jsx:151-175,294-316`.

**Impacte:** la disposició de la captura no es pot assolir només amb CSS; falta estructura de dades i semàntica de filtratge.

**Instrucció per a IAIA MarIA:** ampliar el contracte amb grups de navegació tipats, per exemple `navigationGroups`, on cada grup declare `id`, `label`, `options`, `selectedIds`, `selectionMode` i `onToggle`. Mantindre `categoryIds` com a filtre intern si convé, però no usar el nom genèric «category» per representar alhora una carpeta i qualsevol faceta. Afegir proves de combinació carpeta + categoria + etiqueta abans de canviar el DOM.

### P2-02 — Notes demana dos callbacks que el seu context no exposa

`NotesSection` desestructura `obriConfiguracioNotes` i `informaError`: `src/sections/notes/NotesSection.jsx:21-25`. Cap dels dos forma part del valor de `NotesContext`: `src/sections/notes/NotesContext.jsx:155-166`. Com a resultat, l'engranatge no es crea, ja que `settingsActions` depén de la veritat de `onManageCategories`: `src/components/universal/workspace/UniversalWorkspace.jsx:120-126`; els errors de creació cauen al `console.error` genèric: `src/components/universal/workspace/UniversalWorkspace.jsx:210-225`.

**Impacte:** divergència visual directa respecte de la captura i gestió d'errors degradada.

**Instrucció per a IAIA MarIA:** decidir el propietari real de les dos accions. Si la configuració de carpetes encara no existeix, no inventar-la: crear un callback explícit que mostre un estat «encara no disponible» o retirar temporalment la prop. Per a errors, cablejar `informaError` al sistema de notificacions existent. Afegir una prova que exigisca la presència de l'engranatge quan hi ha gestor i una prova del camí de rebuig de `creaNota`.

### P2-03 — Els desats independents poden competir amb la mateixa revisió

`saveNoteField` llig `expectedRevision` abans de fer la petició i no actualitza `knownRevisions` fins que la resposta arriba: `src/sections/notes/NotesContext.jsx:87-109`. Els camps de capçalera tenen temporitzadors independents per camp: `src/components/universal/UniversalEditorShell.jsx:73-108`; el cos ric té un altre debounce propi: `src/components/universal/DocumentEditor.jsx:66-73`. El backend filtra per la revisió rebuda i converteix una resposta buida en conflicte 409: `src/data/supabase/notes.js:46-59`.

**Impacte:** editar dos camps dins de la mateixa finestra de 800 ms pot enviar dos PATCH amb la mateixa revisió. El primer avança la revisió i el segon pot fallar encara que siga una edició legítima del mateix usuari.

**Instrucció per a IAIA MarIA:** implantar una cua serial per `noteId` o coalescer els camps pendents en un sol PATCH. La revisió confirmada ha d'alimentar el següent enviament. Provar almenys: dos camps simultanis, cos + títol, error 409, reintent i canvi de nota amb desat pendent.

### P2-04 — Contracte inconsistent entre `category` i `categories`

L'adaptador Supabase retorna `categories` en plural: `src/data/supabase/notes.js:5-9`. El generador de badges només llig `note.category` en singular: `src/sections/notes/NotesContext.jsx:21-35`. A més, `netejaCamp` només conserva HTML, imatges i booleans; qualsevol array acaba en `netejaText`: `src/sections/notes/NotesContext.jsx:12-19`, que converteix qualsevol valor a cadena: `src/utils/sanitize.js:97-103`.

**Impacte:** les categories persistides pel backend no apareixen com a badges; una futura edició de `categories` o `tags` a través de `saveNoteField` podria convertir arrays en cadenes.

**Instrucció per a IAIA MarIA:** normalitzar el domini a la frontera de dades amb una sola forma canònica. Si el domini és multivalor, usar sempre arrays `categories` i `tags`; si és univalor, migrar backend i llavor a `category`. Afegir sanejament tipat per camp i proves amb zero, una i diverses categories.

### P2-05 — La semàntica d'historial està escrita al comentari però no implementada

`WorkspaceContext` diferencia els motius `user`, `create` i `reconcile`: `src/components/universal/workspace/WorkspaceContext.jsx:63-91,139-146`. `NotesSection` rep `meta`, no l'usa i deixa un comentari que demana `push` per a l'usuari i `replace` per a reconciliació/creació: `src/sections/notes/NotesSection.jsx:40-50`. `useSearchParams` força `replace: true` en tots els casos: `src/app/contexts/RouterContext.jsx:102-119`.

**Impacte:** seleccionar notes no crea entrades d'historial; arrere/endavant no pot recórrer la selecció tal com promet el contracte intern. ESLint confirma, a més, que `meta` és una variable sense ús.

**Instrucció per a IAIA MarIA:** fer que `setParams` accepte `{ replace }` i decidir-ho a partir de `meta.reason`. Cobrir navegació d'usuari, reconciliació inicial i creació amb proves del router.

### P2-06 — La porta de la fitxa canònica apunta a una arquitectura eliminada

La porta exigeix `src/components/universal/manager/ManagerItemCard.jsx` i `ManagerList.jsx`: `tooling/gates/tractor-fitxa-gestor.mjs:11-19,67-70`. Eixos fitxers no existeixen en l'arbre actual. `UniversalWorkspace` pinta directament el botó de fitxa i la media: `src/components/universal/workspace/UniversalWorkspace.jsx:318-363`. L'execució de `node tooling/gates/tractor-fitxa-gestor.mjs` acaba amb error d'execució 2 abans de certificar la forma.

**Impacte:** la llei declarada de la fitxa Pedra Seca ha deixat de protegir el component que realment la pinta.

**Instrucció per a IAIA MarIA:** triar una sola arquitectura. Recomanació: extraure de nou una fitxa canònica menuda, consumida per `UniversalWorkspace`, i reorientar la porta al camí viu. Alternativament, adaptar l'AST de la porta al component actual. No deixar la porta en verd per omissió ni eliminar-la.

## Troballes P3

### P3-01 — Dos camins per actualitzar una nota

`NotesDataContext` exposa un `updateNote` ja vinculat a `config`: `src/sections/notes/NotesDataContext.jsx:42-53`. `NotesContext` no el consumeix; importa `updateNote` directament del port i li passa `externalConfig`: `src/sections/notes/NotesContext.jsx:1-8,41-45,87-100`.

**Instrucció:** fer que tota operació CRUD de Notes passe per `NotesDataContext`, o eliminar el mètode mort del proveïdor. La primera opció manté la configuració i la mutació de dades dins d'una sola frontera.

### P3-02 — Els esborranys confirmats deixen residus per nota

En un desat reeixit s'elimina el camp concret, però es conserva l'objecte de la nota i se li afig `revision`: `src/sections/notes/NotesContext.jsx:101-109`. La capa efímera declara que no s'hi ha de guardar res que puga créixer: `src/config/storage.js:44-57`.

**Instrucció:** mantindre revisions confirmades només a `knownRevisions`; després d'eliminar el camp, eliminar també `next[noteId]` si no queden camps d'esborrany. Passar l'objecte a `setEfimer` sense serialitzar-lo manualment, ja que la funció ja sap serialitzar: `src/config/storage.js:60-70`.

### P3-03 — Sanejament repetit en el camí calent

`setLocalNoteField` saneja cada canvi: `src/sections/notes/NotesContext.jsx:60-68`. `saveNoteField` torna a sanejar i després crida `setLocalNoteField`, que el saneja una tercera vegada en eixe camí: `src/sections/notes/NotesContext.jsx:87-92`. Els camps editables ja sanejen també `onInput` i `onBlur`: `src/components/universal/UniversalEditorShell.jsx:36-47`.

**Instrucció:** conservar una frontera pública segura, però crear un actualitzador intern que reba un valor ja normalitzat. Mesurar abans de retirar cap sanejament de seguretat del camí remot.

### P3-04 — Locale duplicat i incomplet

`UIContext` ja calcula i exposa `locale` per a ca, es, en, eu i gl: `src/app/contexts/UIContext.jsx:9-15,44-45,75-83`. `NotesContext` torna a calcular-lo com ca o es i usa `Date.now()`/`new Date()` dos vegades per nota: `src/sections/notes/NotesContext.jsx:41-49,70-83`.

**Instrucció:** consumir `locale` des de `useUIState`, construir una sola data per nota i definir explícitament el comportament quan `updatedAt` falta.

### P3-05 — Filtratge recalculat per canvis d'estat que no afecten els filtres

`filteredItems` depén de l'objecte `state` complet: `src/components/universal/workspace/WorkspaceContext.jsx:49-52`. La funció només llig `query`, `activeCategoryId` i `activeTagIds`: `src/components/universal/workspace/workspaceState.js:135-151`. Obrir la cerca, replegar una columna o canviar una selecció torna a filtrar tota la llista.

**Instrucció:** restringir les dependències del memo als tres camps reals o separar `filterState` de l'estat de presentació.

### P3-06 — Un `useEffect` evitable només sincronitza una ref

`onSelectionChangeRef` s'actualitza mitjançant un efecte: `src/components/universal/workspace/WorkspaceContext.jsx:57-65`. No hi ha subscripció ni recurs extern a netejar.

**Instrucció:** assignar `onSelectionChangeRef.current = onSelectionChange` durant el render, com ja fa l'editor amb les seues refs: `src/components/universal/UniversalEditorShell.jsx:73-79`. Mantindre estable `emitSelection`.

### P3-07 — IDs globals en un component reutilitzable

Els controls responsius apunten a `app-grid-sidebar` i `app-grid-list`, i les tres columnes usen IDs fixos: `src/components/layout/AppGridShell.jsx:159-178,184-228`.

**Impacte:** dos workspaces simultanis produirien IDs duplicats i `aria-controls` ambigu.

**Instrucció:** generar un prefix amb `useId` per instància i derivar els tres IDs.

### P3-08 — Dos contenidors de scroll competeixen per columna

Les columnes externes tenen `overflow-y: auto`: `src/components/layout/AppGridShell.css:57-70`. El cos intern del workspace també és el contenidor de scroll: `src/css/modules.css:177-192`.

**Instrucció:** deixar l'embolcall de graella amb `overflow: hidden` i un sol propietari del scroll al cos de columna. Verificar capçaleres fixes, roda, tacte i focus abans/després.

### P3-09 — CSS orfe confirmat i CSS viu amb noms antics

La porta heurística informa 127 candidates, però moltes són falsos positius per classes construïdes dinàmicament. La cerca exacta fora dels CSS no ha trobat consumidors per a estos selectors definits:

- `.sdp-gestor-buit`: `src/css/modules.css:39-45`.
- `.univ-manager-inbox`: `src/css/modules.css:357-372`.
- `.univ-manager-create`: `src/css/modules.css:411-427`.
- `.univ-manager-search`: `src/css/modules.css:429-438`.
- `.search-bar` i `.search-bar input`: `src/css/modules.css:440-459`; les aparicions vives són `search-bar-basic`, una classe diferent.
- `.univ-manager-facet-tree-branch`: `src/css/modules.css:501-507`.
- `.sdp-badge-accent` i la seua variant fosca: `src/css/modules.css:1205-1214`.
- `.sdp-badge-neutral`: `src/css/modules.css:1226-1229`.
- `.univ-manager-inbox-header-btn`, `.univ-manager-header-search-trigger` i `.univ-manager-header-search`: `src/components/layout/AppGridShell.css:266-315`.

No s'han trobat classes `dv-*` ni `ue-*` dins de `src` amb cerca exacta. Això no autoritza una eliminació massiva: cal esborrar només la llista confirmada i passar captura/regressió visual.

En canvi, `.notes-column`, `.notes-column__body` i `.notes-list-header` no estan mortes, però ja no descriuen els seus consumidors: `src/css/modules.css:304-336`. Administració usa les dos primeres: `src/sections/admin/AdminSection.jsx:23-54`; Multimèdia usa `notes-list-header`: `src/sections/multimedia/MultimediaSection.jsx:24-44,69-76`.

**Instrucció:** podar la llista confirmada en un canvi separat. Després, reanomenar les classes vives `notes-*` a noms genèrics de Pedra Seca, amb migració simultània de tots els consumidors.

### P3-10 — Superfície legacy viva i sense proves de contracte

`UniversalWorkspace` encara decideix entre el model nou i `adaptLegacyContract`: `src/components/universal/workspace/UniversalWorkspace.jsx:28-30,397-475`. Perfil continua consumint l'API legacy: `src/sections/profile/PerfilShell.jsx:117-130`; Administració també: `src/sections/admin/AdminSection.jsx:89-108,129-149`. Per tant, l'adaptador no és codi mort i no s'ha d'eliminar durant la poda.

Les proves de l'abast només cobreixen el càlcul del resizer i la creació en `NotesDataContext`: `src/components/layout/AppGridResizer.test.jsx:1-16`; `src/sections/notes/NotesDataContext.test.jsx:1-20`. No hi ha una prova de contracte per a l'adaptador, la selecció/reconciliació, els grups de navegació ni el desat amb revisions concurrents.

**Instrucció:** migrar Perfil i Administració al model nou, amb proves abans de retirar l'adaptador. No barrejar esta migració amb la poda CSS.

## Importacions i redundàncies menors

- Les importacions de `useUIState` i `useUIActions` provenen del mateix mòdul i poden unificar-se en una sola declaració: `src/sections/notes/NotesContext.jsx:6-7`.
- El paràmetre `meta` de `handleSelectionChange` està sense usar: `src/sections/notes/NotesSection.jsx:40-50`. No s'ha d'esborrar a cegues: és la dada necessària per resoldre P2-05.
- `AppGridColumn` conserva superfície sense consumidors actuals (`esquerra`, acordió, `plegable`, `onPlega` i acció de text): `src/components/layout/AppGridColumn.jsx:1-18,20-45,65-90`. Part d'esta superfície pot ser justament la base dels tres grups de la captura; cal convertir-la en contracte provat o retirar-la després, no abans.

## Ordre de resolució proposat

1. **Congelar comportament amb proves:** selecció, motius d'historial, creació, tres facetes i dos desats simultanis.
2. **Normalitzar el domini de Notes:** resoldre `category/categories`, tipar camps i centralitzar CRUD en `NotesDataContext`.
3. **Serialitzar o coalescer desats:** eliminar els 409 autoinfligits abans de tocar la presentació.
4. **Crear el model de grups de navegació:** carpetes, categories i etiquetes amb estat de filtre explícit.
5. **Alinear el crom amb la captura:** ranures inicial/final, subbarres i un sol contenidor de scroll.
6. **Migrar consumidors legacy:** Perfil i Administració cap al contracte `model`.
7. **Reparar les portes:** apuntar la porta de fitxa al component viu i afegir proves del workspace.
8. **Poda salfumà final:** eliminar només selectors confirmats, reanomenar `notes-*` genèrics i tornar a passar portes i regressió visual.

## Verificacions executades

| Comprovació | Resultat |
| --- | --- |
| ESLint sobre Notes, workspace i graella | 0 errors; 1 avís: `meta` sense usar a `NotesSection.jsx:40` |
| `vitest` sobre `AppGridResizer.test.jsx` i `NotesDataContext.test.jsx` | 2 fitxers, 3 proves, totes passen |
| `node tooling/gates/tractor-graella.mjs` | passa |
| `node tooling/gates/tractor-fitxa-gestor.mjs` | falla amb eixida 2: component canònic esperat inexistent |
| `node tooling/gates/tractor-classes.mjs` | 525 definides, 394 vives confirmades, 127 candidates; s'ha revisat manualment el subconjunt citat |
| Cerca `dv-*` / `ue-*` sota `src` | 0 coincidències |
| `tractor-frontmatter.mjs --estricte` sobre este document aïllat | passa: F1–F8 a zero |

No s'ha executat cap build perquè els scripts de build generen artefactes i índexs, incompatible amb la contenció de només informe.

## Bateria de veritat

- [x] Només s'han citat rutes reals en format `ruta:linies`.
- [x] No s'ha inventat cap fitxer, funció ni variable.
- [x] Les conclusions visuals provenen de la captura aportada; no s'ha completat cap buit amb una suposició.
- [x] Les absències CSS s'han contrastat amb cerca exacta fora dels fulls d'estil.
- [x] S'ha distingit entre classes mortes, falsos positius i classes vives amb noms antics.
- [x] No s'ha modificat codi.
- [x] El document passa `tractor-frontmatter.mjs --estricte` amb F1–F8 a zero.
- [ ] Aprovació humana pendent.

## Incògnites

- No hi ha especificació funcional local que determine si una nota pot tindre una categoria o diverses; el backend actual usa `categories`, però la llavor i la UI també contenen `category`.
- No hi ha callback viu de gestió de carpetes/categories exposat per `NotesContext`; cal decidir si s'ha de construir o si l'engranatge només era visual en la referència.
- No s'ha fet una captura de l'aplicació actual en execució; la correlació visual compara la captura aportada amb el DOM i CSS actuals.

**Ancoratge de Seguretat:** [[00_INDEX_ESCRIPTORI]]
