---
type: informe
status: esborrany
description: Auditoria extrema passiva del UniversalWorkspace i la graella AppGridShell abans de connectar dades reals.
tags:
  - arquitectura
  - disseny
---

# Informe — Auditoria Extrema del Workspace (Claude Fable)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260921-A |
| Respon a | SDP-PROMPT-260921 |
| Entorn | entorn-dev-local (branca `backup-notes-publish`) |
| Creació | 26-09-21 02:40 |
| Agent auditor | Claude Fable (potència baixa) |
| Edició de codi | cap (auditoria passiva) |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[UniversalWorkspace]]
- [[260921_0155_pla_implementacio_mestre.md]]
- [[260921_0215_PROMPT_auditoria_extrema_workspace.md]]

## Mètode

Lectura íntegra de `src/components/universal/workspace/UniversalWorkspace.jsx`, `WorkspaceContext.jsx`, `workspaceState.js`, `SlotErrorBoundary.jsx`, `src/components/layout/AppGridShell.jsx`, `AppGridShell.css`, `AppGridColumn.jsx`, `src/css/modules.css` (blocs 1–315 i 3215–3384), `src/sections/notes/NotesSection.jsx`, `NotaFitxa.jsx`, `src/sections/disseny/DesignSection.jsx` i `src/hooks/useResolvedAsset.js`. Comprovació en viu al dev server del port 3340 (pestanya de fons): `/disseny` pinta 15 targetes amb `.sdp-gestor-fitxa__media` de 96×96 i inicial; `/notes` sense sessió torna «No hi ha notes.» i no s'ha pogut inspeccionar la targeta rica en viu.

---

## CRÍTIC

### C1. Closure obsolet a `selectCategory`: la primera selecció d'una categoria pot triar un ítem d'una llista desfasada

`src/components/universal/workspace/WorkspaceContext.jsx:81-93` reconstrueix `filterWorkspaceItems(normalizedItems, {...state, activeCategoryId: id})` amb l'`state` sencer com a dependència. Cada canvi d'`state` (cada tecla al cercador, cada toggle de columna) regenera `selectCategory`, i per tant regenera `value` (`:176-194`), i per tant re-renderitza tots els consumidors del context, incloent-hi les 1000+ targetes. No és una fuita, però és una cascada de re-render innecessària en cada pulsació.

**Per què és un risc amb dades reals:** amb Supabase els ítems arriben en tandes. `selectCategory` calcula `candidates[0]` amb la llista del render actual; si la llista canvia en el mateix tick (subscripció en temps real), l'`itemId` emès a `onSelectionChange` (`:92`) pot apuntar a un ítem que la reconciliació (`:125-174`) immediatament substituirà, produint dos `setParams` consecutius (un `push` i un `replace`) i una entrada d'historial fantasma.

**Pedra Seca:** que el reductor faça la tria. `category/select` (`workspaceState.js:22-39`) ja rep `itemId`; el càlcul de candidats hauria de viure en una funció pura `pickItemForCategory(items, state, id)` cridada dins del reductor o en un `useCallback` amb dependències mínimes (`normalizedItems`, `state.lastItemByCategory`, `state.query`, `state.activeTagIds`), no amb `state` complet.

### C2. Doble efecte de sincronització amb `syncPending` mutable: la reconciliació es pot saltar un cicle

`WorkspaceContext.jsx:111-122` posa `syncPending.current = selection.itemId !== undefined` i despatxa `selection/sync`. L'efecte de reconciliació (`:125-174`) consumeix la bandera i **retorna sense reconciliar** una vegada. Però l'efecte de reconciliació també es dispara per `status`, `itemById`, `normalizedItems`… Si el primer render després del `sync` és amb `status !== 'ready'` (`:127`), l'efecte ix abans de consumir la bandera; quan `status` passe a `ready`, es consumirà la bandera i **no es reconciliarà**, deixant un `activeItemId` que potser no existeix a les dades acabades d'arribar. El detall queda buit fins a la següent acció d'usuari.

**Reproducció [SUPÒSIT, no executat]:** entrar a `/notes?nota=n-esborrada` amb el backend lent: `status: 'loading'` → `sync` → `ready` amb ítems reals. L'ID no existeix, però la bandera l'exempta.

**Pedra Seca:** substituir la bandera per estat del reductor (`state.syncSource: 'url' | null`) que la reconciliació consumeix només quan `status === 'ready'`, o fer la reconciliació dins del mateix reductor amb una acció `data/arrived` que porte els ítems normalitzats.

### C3. Dependències incompletes silenciades: `useEffect` de `selection` sense `dispatch` ni objecte estable

`WorkspaceContext.jsx:122` declara `[selection?.categoryId, selection?.itemId]`. És correcte funcionalment però `DesignSection.jsx:70` i `NotesSection.jsx:137` passen un objecte literal nou a cada render; només les claus internes eviten el bucle. Qualsevol adaptador futur que passe `selection={{ ...x, extra }}` amb una clau nova no farà res, i ningú ho detectarà perquè `eslint.config.js` està modificat a l'arbre de treball (no auditat: fora del manifest). El contracte «`selection` és un objecte amb exactament dues claus» no està escrit enlloc més que en un comentari.

**Pedra Seca:** documentar el contracte al JSDoc de `UniversalWorkspace` (`:8-21`) i afegir un test que passe un objecte amb `categoryId` i `itemId` iguals però referència nova i comprove zero despatxos.

---

## IMPORTANT

### I1. Miniatures (punt 3 de la missió): l'estructura és correcta; el que falta són les dades

Constatat en viu a `/disseny`: `DefaultItemCard` (`UniversalWorkspace.jsx:501-535`) pinta `.sdp-gestor-fitxa__media` de 96×96 amb fons `--sdp-fons-subtil` i la inicial. La cadena de fallback `imatge → icona → inicial` (`:524-532`) existeix i és la correcta.

**Causa arrel per a Disseny:** `src/sections/disseny/cataleg/manifest.js:14-38` construeix els ítems amb `id, categoryIds, kind, title, subtitle, tags, searchText, detailKey, status` i **cap `image` ni `icon`**. La targeta no pot pintar el que no li arriba.

**Causa arrel per a Notes:** `NotaFitxa.jsx:34-48` només accepta `image` (no `icon`) i depén de `useResolvedAsset`. Per a `sdp-media://` sense capacitat `mitjans` (`useResolvedAsset.js:23-27`) torna cadena buida → inicial. Amb el backend apagat o sense sessió, **totes** les notes cauen a la inicial encara que tinguen `heroImage`. A la captura antiga adjunta, «Sense títol» ni tan sols mostrava el quadrat: el codi actual ja el mostra sempre (`:38`), així que aquesta part està resolta.

**Divergència de mida:** `tokens.css:168` fixa `--sdp-fitxa-mida: 96px` com a LLEI, però `modules.css:3227` sobreescriu a `--sdp-bloc-fitxa-mida: 86px` per a Notes (`:3332-3339`). Dues lleis per a la mateixa media; el pressupost vertical calculat al comentari de `modules.css:12-17` només val per a 96.

**Pedra Seca proposada (sense aplicar):**
1. Un únic component `ItemMedia` al nucli amb contracte `{ image?, icon?, title }` i cadena `image → icon → inicial`, exportat des de `workspace/index.js`, perquè `NotaFitxa` el reutilitze en lloc de duplicar la lògica (`NotaFitxa.jsx:35-48` és una còpia parcial d'`UniversalWorkspace.jsx:520-535`).
2. La resolució d'actius (`useResolvedAsset`) viu **dins** d'aquest `ItemMedia`, no a la secció; així Disseny també podrà tindre portades `/assets/...`.
3. Disseny aporta `icon` per espècimen al manifest (lucide) i, opcionalment, `image` de captura.
4. Retirar `--sdp-bloc-fitxa-mida` o elevar-la a token amb el seu propi pressupost vertical.

### I2. Cost de render sense virtualització: cada tecla recalcula i re-pinta tota la llista

- `filteredItems` (`WorkspaceContext.jsx:63-66`) és O(n) per pulsació, amb `normalitza()` (`workspaceState.js:146-147`) fent `normalize('NFD')` + regex Unicode per ítem **a cada crida**, sense memoitzar el text normalitzat per ítem.
- `availableTags` (`UniversalWorkspace.jsx:329-332`) fa `flatMap` + `Set` + `sort` sobre tots els ítems.
- `ItemListColumn` no està memoitzat; `DefaultItemCard` tampoc, i `onSelect` es crea nou per ítem a cada render (`:482`).

**Resposta a la incògnita dels 1000 ítems:** el CSS **sí** està preparat per a virtualització: `.sdp-workspace-column__body` (`modules.css:180-186`) és l'únic contenidor amb `overflow-y: auto` i `min-height: 0`, i `.sdp-gestor-llista > li` no té marges (`:34-37`). Una llista virtual (finestra fixa d'alçada `--sdp-fitxa-mida`) hi encaixa sense tocar l'esquelet. El que **no** està preparat és el JS: caldria (a) precalcular `searchText` normalitzat a la frontera de normalització (`WorkspaceContext.jsx:47-52`), (b) memoitzar `DefaultItemCard` i (c) extraure el render del `<ul>` a un component `ItemList` memoitzat que accepte un `renderItem` estable.

### I3. `KIND_ICONS` i `group.icon` mai s'apliquen a categories de Notes: doble font d'icones

`UniversalWorkspace.jsx:279` fa `icon={category.icon || group.icon}` i `:298` cau a `KIND_ICONS[kind] || Folder`. `NotesSection.jsx:87` assigna `ICONA_CARPETA[folder.id] || Folder` a cada opció, de manera que el fallback `Folder` del nucli (`:298`) és inabastable per a carpetes i el nucli i la pell dupliquen la mateixa decisió. Amb carpetes reals de Supabase (IDs no seed), totes cauran a `Folder` per la pell, mai per `KIND_ICONS`. No és un bug, és una capa morta.

### I4. Variant `transparent` òrfena però amb CSS viu que encara pot guanyar

L'informe d'avanç diu que s'ha eliminat la variant. Confirmat: cap `variant="transparent"` a `src/`. Però `AppGridColumn.jsx:26,76` encara la genera si arriba, i `AppGridShell.css:258-267` i `modules.css:3234-3245` encara la pinten (i aquest darrer amb `position: sticky; z-index: 10`). Codi mort en tres fitxers que qualsevol regressió reactivaria silenciosament. **Pedra Seca:** esborrar les tres branques i afegir la prohibició al test de `UniversalWorkspace.test.jsx`.

### I5. `SlotErrorBoundary` pot ocultar errors de dades de forma permanent a la columna del mig

`WorkspaceFrame` (`UniversalWorkspace.jsx:134`) usa `resetKey={workspace.state.activeCategoryId}`. Si `renderItem` peta per un ítem mal format (p. ex. `title` no string des de Supabase), el fallback substitueix **tota la llista** i només es reinicia canviant de categoria. A «Tot» (`__all__`) amb un ítem corrupte, l'usuari mai recupera la llista sense eixir. `componentDidCatch` (`SlotErrorBoundary.jsx:28-34`) només consola en DEV; en producció, sense `onError` injectat, el silenci és total. `UniversalWorkspace` no exposa cap prop `onError` per a arribar-hi.

**Pedra Seca:** boundary per ítem (dins del `<li>`) amb `resetKey={item.revision ?? item.id}`, i prop `onSlotError` al nucli.

### I6. Accessibilitat: `role="menu"` sobre una llista de navegació estàtica

`UniversalWorkspace.jsx:273` posa `role="menu"` i `:302` `role="menuitem"` amb `aria-current="page"`. El patró ARIA `menu` exigeix navegació per fletxes i `aria-haspopup`; ací no hi ha gestió de teclat (només Tab). Un lector de pantalla anunciarà «menú» i esperarà fletxes. `aria-current` no és vàlid a `menuitem`. Els tests (`UniversalWorkspace.test.jsx:102`) consoliden el rol equivocat.

**Pedra Seca:** `<ul role="list">` amb `<button aria-current="page">` o, si es vol el patró de menú, implementar roving tabindex.

### I7. `autoFocus` al cercador i doble `requestAnimationFrame` per al focus

`UniversalWorkspace.jsx:435` usa `autoFocus`, que en `estret` amb el panell del mig tancat (inert) llança el focus a un element `inert`. `focusAfterLayout` (`:44-52`) espera dos frames per esquivar la transició de 0.3s de `AppGridShell.css:164`, però dos frames són ~33ms, no 300ms: el focus pot caure sobre una columna encara amb `visibility: hidden` (`:172-176`). Funciona per accident quan el navegador ignora la transició de `visibility`. **Pedra Seca:** escoltar `transitionend` de la columna o desactivar la transició amb `prefers-reduced-motion` i fer el focus en un sol frame.

---

## MENOR

### M1. Graella: z-index sense escala i possible solapament amb el resizer

`AppGridShell.css:141` (`z-index: 30` esquerra en `mitja`), `:160-167` (1/20/30 en `estret`), `:204` (resizer `50`), `:248` (capçalera `10`) i `modules.css:3237` (`10`). Cap token. En `mitja` la columna esquerra és `position: absolute` amb `z-index: 30` però el resizer no es renderitza (`AppGridShell.jsx:226`), així que avui no col·lisionen; el dia que s'afegisca un desplegable amb `z-index` propi dins de la columna del mig, quedarà darrere de l'esquerra. `isolation: isolate` a `.app-grid-page` (`:10`) protegeix cap a fora, no cap a dins.

### M2. `measure()` a `AppGridShell.jsx:77-95` llig `collapsedRef` però l'efecte no es torna a executar quan canvia `leftCollapsed`

`useLayoutEffect(..., [columnWidths])` (`:104-106`) re-mesura per amplada, però no per col·lapse. Col·lapsar una columna en «mitja» pot deixar `mida` desfasada fins al següent `ResizeObserver`. Efecte visual: un frame amb layout incorrecte. [SUPÒSIT: no reproduït].

### M3. `getVal('sdp-grid-widths')` es llig síncronament en el `useState` inicial

`AppGridShell.jsx:50-56`. Si `storage.js` tira una excepció (mode privat, quota), el component no munta. Cal un `try` a `getVal` o un valor per defecte defensiu (no auditat `storage.js`, fora de manifest).

### M4. `DetailColumn` és `memo` però rep `labels` (objecte nou cada render) i `renderDetail` (funció inline a les dues seccions)

`UniversalWorkspace.jsx:71` crea `copy` nou a cada render; `DesignSection.jsx:75` i `NotesSection.jsx:146` passen closures noves. El `memo` de `:539` no evita cap render. O es memoitzen les entrades, o es retira el `memo` per honestedat.

### M5. `useEffect` de NotesSection força `?nota=n1` en bucle potencial

`NotesSection.jsx:112-118`: depén de `params`; si `setParams` retorna un objecte nou sense canvi efectiu, l'efecte es torna a executar. Avui `params.get('nota')` ja val `n1` a la segona passada i ix. Fràgil davant d'un router que normalitze paràmetres.

### M6. `String(item.title || untitled || '?')` amb `title` no string

`UniversalWorkspace.jsx:530`: si Supabase torna `title: null` i `untitled` ve buit per etiquetes personalitzades, mostra `?`. Correcte, però `NotaFitxa.jsx:43` fa la mateixa operació sense `untitled`. Duplicació (vegeu I1).

---

## Forats i pegats temporals documentats

| On | Pegat | Risc | Aproximació sòlida |
| --- | --- | --- | --- |
| `NotesSection.jsx:74` | `NOTE_FOLDERS_SEED` quan el backend torna `[]` | Amb Supabase, un usuari real sense carpetes veurà carpetes que no existeixen a la BD; crear-hi una nota enviarà un `folderId` orfe | Estat explícit `folders: 'absent'` i crida a `onManageCategories` |
| `DesignSection.jsx:26` | `dateTime="2026-09-19T12:00:00Z"` literal | Data fossilitzada a totes les fitxes del catàleg | Prendre-la del manifest o ometre-la |
| `modules.css:3227` | `--sdp-bloc-fitxa-mida: 86px` | Trenca la LLEI DE LA FITXA de `tokens.css:168` i el pressupost vertical | Un sol token o un token derivat documentat |
| `WorkspaceContext.jsx:107,116` | `syncPending` com a `useRef` booleà | Estat fora del reductor, no testable | Moure a `workspaceState.js` |
| `AppGridShell.css:258-267` + `modules.css:3234-3245` + `AppGridColumn.jsx:26` | CSS/JSX de `transparent` sense consumidor | Reactivació accidental | Esborrar |

## Incògnites

- Comportament amb 1000+ ítems: el CSS és apte (I2); el JS necessita tres canvis abans de posar virtualització. No s'ha fet cap mesura de rendiment real.
- No s'ha pogut inspeccionar la targeta rica de Notes en viu (sense sessió no hi ha notes). L'anàlisi de I1 per a Notes és només de codi.
- [SUPÒSIT] C2 i M2 estan raonats sobre el codi, no reproduïts.

## Bateria de veritat

- [x] He citat només rutes reals del repositori, en format `ruta:linies`.
- [x] Cap nom de fitxer, funció o variable inventat.
- [x] Conjectures marcades [SUPÒSIT] o mogudes a Incògnites.
- [ ] `tractor-frontmatter.mjs --estricte`: comprovat després d'escriure (vegeu missatge de tancament).
