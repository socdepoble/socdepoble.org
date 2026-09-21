---
type: informe
status: esborrany
description: Red Team de GlobalSaveManager, verificador-scc, arrel.mjs, eslint i preparació del Bloc de Notes per a Supabase. Cada troballa duu reproducció.
tags:
  - auditoria
  - red-team
  - supabase
  - persistencia
---

# Auditoria extrema pre-Supabase (Claude)

21 de setembre de 2026 · Claude · arbre local de treball, branca `backup-notes-publish`, HEAD `c5deb0e7` amb canvis sense confirmar.
Resposta a [[260921_0100_PROMPT_Auditoria_Extrema_Pre_Supabase]]. Cap fitxer del repositori s'ha modificat; les sondes viuen al scratchpad de la sessió.

## 0. Veredicte en tres línies

1. **El Gestor d'esborranys no protegeix res.** L'esborrany s'escriu a IndexedDB, però mai no es recupera: la clau conté `::` (de l'`actorKey`) i el lector la trosseja per `:`. La xarxa de seguretat que motiva tota la peça és inert.
2. **La Porta SCC no s'executa.** `npm run porta:scc` mor amb un `TypeError` perquè `CAMINS.arrelSegura` no existix. A més, la comprovació d'ancoratge de l'Escriptori mai no mira cap fitxer (majúscules a la ruta).
3. **La cadena de portes està tallada al pas 3.** El linter té 23 errors (`eol-last`); `run-portes` avorta ahí i el hook de pre-commit no pot passar. Els tres commits d'avui han entrat per força.

El que aguanta: `backendPort` (contracte i segellat), `request()` (timeout, refresc 401, abort), el trigger de `revision` a Postgres, les RLS de `notes`, la normalització d'IDs de `WorkspaceContext`, `dins()` i la detecció d'arrel. Vitest: 61/61 en verd, però cap prova toca IndexedDB, `arrel.mjs` ni el verificador SCC.

## 1. Mètode i tall de l'arbre

- Lectura íntegra dels quatre fitxers del deure més els seus consumidors: `NotesDataContext.jsx`, `NotesContext.jsx`, `NotesEditor.jsx`, `DocumentEditor.jsx`, `UniversalWorkspace.jsx`, `WorkspaceContext.jsx`, `src/data/supabase/{notes,runtime}.js`, `backendPort.js`, `contracte.js`, `run-portes.mjs`, `.husky/pre-commit`, migració `260914_0000_schema_notes.sql`.
- Execució local, sense xarxa: `node tooling/gates/verificador-scc.mjs` (amb i sense argument), `node tooling/lib/arrel.mjs`, `npx eslint src tooling scripts tests`, `npx vitest run`, i dues sondes Node que importen els mòduls reals.
- **Arbre concurrent:** mentre auditava ha aparegut `260921_0110_informe_auditoria_pre_supabase.md` (Codex) i `git status` mostra nou fitxers del 260920 **esborrats** de l'Escriptori que l'índex encara enllaça. No he llegit l'informe de Codex per no contaminar la cacera; la refutació creuada és fase següent.

Severitats: **CRÍTIC** (la funció que promet no existix), **ALT** (pèrdua de dades o porta cega en un camí real), **MITJÀ** (latent, es dispararà amb Supabase o amb Linux/CI), **BAIX** (higiene).

## 2. `src/sections/notes/GlobalSaveManager.js`

### A1 · CRÍTIC · La recuperació d'esborranys és inert

- `IdentitatContext.jsx:36` construïx `actorKey = \`${actorType}::${actorId}\``.
- `NotesDataContext.jsx:27` fa `scopeKey = \`${backendId}_${actorKey}_${tenantId}\``.
- `GlobalSaveManager.js:91` desa amb clau `${scopeKey}:${noteId}`; `GlobalSaveManager.js:61` recupera el `noteId` amb `k.split(':')[1]`.

Reproducció (sonda):

```
clau = supabase_user::abc-123_global:note-uuid-1
noteId extret per split(":")[1] = ""
```

Tots els esborranys tornen sota la clau `""`; `persistentDrafts[n.id]` (`NotesDataContext.jsx:74`) no encerta mai. La prova `NotesDataContext.test.jsx` passa perquè el mock fixa `actorKey: 'user'` sense `::`. **Efecte:** si cau la pestanya amb un desat pendent, l'edició es perd exactament igual que abans de la F01. Remei: usar `lastIndexOf(':')` o, millor, desar `{ scopeKey, noteId, payload }` com a valor i indexar-ho; i afegir una prova amb un `actorKey` real.

### A2 · ALT · El desat correcte esborra l'esborrany més nou

`enqueue` escriu l'esborrany a cada tecla (`:116`) sobre la **mateixa clau** que el desat en curs esborra en acabar (`:141`). Seqüència: l'usuari escriu → venç el debounce → PATCH en vol (1-3 s amb Supabase remot) → l'usuari continua escrivint → nova cua i nou `put` de l'esborrany → el PATCH acaba → `removeDraftFromIDB(key)` elimina l'esborrany **del text que encara no s'ha enviat**. Si la pestanya cau abans del segon debounce, el text es perd sense rastre. Remei: versionar la clau (`${key}#${seq}`) o comprovar dins de la mateixa transacció que el `_draftTimestamp` desat és el que s'ha enviat.

### A3 · ALT · No hi ha cap reintent

En error no-409 el codi mostra «El canvi no ha arribat al servidor. Reintenta-ho.» (`:152`) i desa l'esborrany (`:154`). Ningú el reintenta: no hi ha escolta d'`online`, ni backoff, ni cua de sortida; l'única via de recuperació és recarregar la pàgina (i A1 la té tancada). El document [[contingencia_offline]] §3 exigix «identificador idempotent, estat, comptador d'intents i error diagnosticable»; ací no hi ha cap dels quatre. Amb Supabase, un 5xx puntual o un tall de 4G al bancal es converteix en pèrdua silenciosa d'una frase.

### A4 · MITJÀ · Connexions IndexedDB obertes a cada tecla i sense pla de versió

`getDB()` (`:8`) obri una connexió nova per cada `put`, `get` o `delete` i mai no la tanca. No es gestiona `request.onblocked` ni `db.onversionchange`. El dia que `DB_VERSION` passe a 2 (canvi d'esquema per a Supabase, per exemple guardar `tenant_id`), qualsevol pestanya antiga oberta bloqueja l'actualització indefinidament; totes les crides cauen al `catch` amb un `console.warn` i l'app continua com si res. Falla tancada en silenci, que és el patró que [[portes-que-ixen-verd-sense-comprovar]] ja va senyalar en altres peces. Remei: una única connexió memoritzada, `onversionchange → db.close()`, i tractar el `warn` com a error visible.

### A5 · MITJÀ · Privadesa: notes privades en clar, per sempre, a l'origen amfitrió

L'esborrany conté l'HTML sanejat de notes privades. Viu a IndexedDB de l'**origen**, que en mode incrustat és el de Sollutia o WordPress. Cap purga en `logout` (no hi ha cap `deleteDatabase` ni neteja per `scopeKey` al codi), cap caducitat malgrat `_draftTimestamp`. `storage.js:47-51` explica per què el verificador PKCE no va a `localStorage` («a l'abast de qualsevol script de la pàgina amfitriona»); el mateix argument s'aplica ací amb contingut molt més sensible. En un ordinador compartit, l'usuari següent no els veu per la UI (l'`scopeKey` els aïlla) però estan al disc. Remei: purgar l'àmbit en `logout`, TTL, i decidir explícitament si en mode incrustat es desactiva.

### A6 · MITJÀ · Tres magatzems d'esborranys amb tres formes

1. Cua en memòria (`queues`), 2. `sessionStorage` via `NotesContext.localNoteOverrides` (sense `content`, `NotesContext.jsx:88-93`), 3. IndexedDB (amb `content`). Claus i formats diferents, sense un sol punt de veritat. Quan A1 es corregisca, apareixerà el següent forat: l'esborrany recuperat es fusiona dins de `payload.notes` (`NotesDataContext.jsx:80`) i **sembla desat** (sense marca, sense reenviament); només s'enviarà si l'usuari torna a tocar aquell camp. I la comparació `_draftTimestamp < updatedAt` (`:76`) confronta rellotge del client amb rellotge de Postgres: amb un rellotge avançat 2 minuts, un esborrany més nou que la versió del servidor es descarta sense avís.

### A7 · BAIX · Higiene

`setEfimer`/`getEfimer` importats i no usats (`:1`); `knownRevisions` creix sense límit; `console.log("Desat ajornat")` en producció; cap prova pròpia (els dos fitxers de test el mockegen sencer).

## 3. Consumidors: `NotesDataContext.jsx` i `NotesContext.jsx`

### B1 · ALT · Cada recàrrega buida el Bloc i fabrica un 409

`useNotesData` retorna `BUIT` (amb `notes: []`) sempre que `status !== 'ready'` (`NotesDataContext.jsx:129-130`), encara que el `payload` continue en memòria. `refresh()` i `useRecarregaExterna` posen `status: 'loading'` (`:189-199`). Conseqüències encadenades:

1. `UniversalWorkspace` pinta «Carregant…» a la llista i **desmunta l'editor** (`UniversalWorkspace.jsx:545-546`): cursor i selecció perduts.
2. `saveNoteField` captura `getBaseNote = (id) => rawNotes.find(...)` amb `rawNotes = []` (`NotesContext.jsx:178`). Si l'usuari escriu durant la recàrrega i no hi ha `knownRevision`, `expectedRevision` val `0` (`GlobalSaveManager.js:95`) → PATCH amb `revision=eq.0` → 0 files → «Conflicte» (`notes.js:65`) → s'esborra l'esborrany → `setTick` → **una altra recàrrega**.

Disparadors reals: qualsevol 409, `sdp:refresh-data` (Sollutia i la migració a `App.jsx:200`), i un `timeout`. Amb latència de Supabase remot (300 ms-2 s per recàrrega de tres peticions) això és visible i repetible. Remei: mantindre `payload` visible mentre es recarrega (estat `revalidating`), i que `getBaseNote` llija el darrer `payload` conegut, no la vista filtrada.

### B2 · MITJÀ · Classificació d'errors invertida

`NotesDataContext.jsx:109` silencia com a «error de xarxa» qualsevol `TypeError` o missatge que continga `fetch`/`network`. Però `request()` (`runtime.js:83-84`) ja converteix els `TypeError` de `fetch` en `ErrorSupabase` amb missatge «Error de xarxa: No es pot connectar…», que **no** conté ni `fetch` ni `network`. Resultat: els errors de xarxa reals van a `status: 'error'` (honest), i els `TypeError` de programació (`undefined.map`) es silencien com a xarxa i deixen l'estat anterior. Mateix patró a `:153`: `includes('timeout')` no encerta «La petició ha trigat massa temps.» (`runtime.js:79`), així que un timeout no provoca la recàrrega prevista. Remei: discriminar per `error.name`/`error.status`, mai per text.

### B3 · BAIX · Notes sense `revision`

Les notes que només existixen al seed o a `app_content` (n1 inclosa; `appSeed.js` no té cap `revision`) arriben sense `revision` → `expectedRevision = 0` → PATCH sense files → GET de verificació → 404 «No accessible o eliminada» → esborrany a IDB per sempre (i A1). Convé decidir si són editables o de només lectura, i que l'editor ho sàpiga.

## 4. `tooling/gates/verificador-scc.mjs`

### C1 · CRÍTIC · La porta no arranca

`verificador-scc.mjs:282` fa `process.argv[2] || CAMINS.arrelSegura`. `CAMINS` és un objecte congelat de cadenes (`arrel.mjs:72-97`) i no té cap propietat `arrelSegura` (la funció `arrelSegura()` és una exportació a part). Reproducció:

```
$ node tooling/gates/verificador-scc.mjs
TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
    at new VerificadorSCC (verificador-scc.mjs:9:21)
```

`run-portes.mjs:69` i `package.json` la criden **sense argument**. La porta és roja per crash, no per orfes. La xifra «13 orfes reals» només s'obté passant `.` a mà. Remei: `import { arrelSegura }` i cridar-la; una prova de fum que execute la porta sense arguments.

### C2 · ALT · L'ancoratge de l'Escriptori no mira cap fitxer

`ESCRIPTORI_DIR = '_wiki_de_poble/04_ESCRIPTORI'` (`:14`) i la carpeta real és `04_escriptori`. `path.relative` és lèxic: `relative('/x/04_ESCRIPTORI', '/x/04_escriptori/a.md')` → `../04_escriptori/a.md`, que comença per `..` i queda exclòs (`:140`). Sonda sobre l'arbre real: **0 fitxers entren a `verifyEscriptoriAnchoring`, 0 errors**. La porta ha eixit «verda» en ancoratge des que existix, també a macOS. Mateix problema latent a `INBOX_DIR` i a `00_INDEX_ESCRIPTORI.md` (`:125`): a Linux/CI la lectura falla i el `catch` retorna en silenci (`:130-131`). En canvi `canonicalIndices` (`:181`) està en minúscules. Remei: minúscules pertot (o `CAMINS.indexEscriptori`, que ja és correcte), i que «no puc llegir l'índex» siga error, com ja fa `INDEX_NOT_FOUND`.

### C3 · MITJÀ · Sense arbre net no hi ha veredicte fiable

Amb `.` hui dóna «✅ SCC OK» (0 orfes de 111 fitxers) però només perquè l'índex de l'Escriptori té 11 línies noves sense confirmar i, alhora, 9 dels fitxers enllaçats **ja no existixen** al disc. L'SCC no detecta enllaços trencats (només orfes), així que un índex que apunta a fantasmes passa. És la mateixa lliçó de [[auditoria-arbre-concurrent]]: fixar el tall abans de citar xifres.

### C4 · BAIX · Detalls

- `:241` `split('\\n')` (barra literal): el número de línia de `PEDRA_SECA_INLINE_STYLE` és sempre 1.
- `resolveLink` resol per `basename` (`:92`): hui 0 col·lisions de nom entre 111 fitxers, però el dia que n'hi haja, l'últim guanya sense avís i el graf menteix.
- `'90_arxiu_historic'` duplicat a la llista d'exclusions (`:30`) i a `:217`.
- La guarda CLI d'este fitxer (`fileURLToPath(import.meta.url) === path.resolve(argv[1])`) és la forma correcta; és la que hauria d'usar `arrel.mjs` (D2).

## 5. `tooling/lib/arrel.mjs`

### D1 · ALT (latent) · `ARREL`, l'API principal de la capçalera, no es pot usar

`ARREL` és un `Proxy` sobre `{}` que fa `Reflect.get(_arrel, prop, _arrel)` amb `_arrel` una **cadena** (`:275-280`). Qualsevol ús llança:

```
path.join(ARREL, 'x')  → Reflect.get called on non-object
String(ARREL)          → Reflect.get called on non-object
`${ARREL}`             → Reflect.get called on non-object
```

Cap fitxer del `tooling` l'importa (per això no ha petat), però és el primer nom de l'exemple d'ús (`:30`). El pròxim agent que seguisca la documentació es trobarà l'error més críptic del repositori. Remei: eliminar-lo o fer-lo un getter (`get ARREL() { return arrelSegura(); }`) sobre un objecte exportat.

### D2 · MITJÀ · L'autodiagnòstic no s'executa mai

`:362` compara `import.meta.url` amb `` `file://${process.argv[1]}` ``. L'arrel del projecte conté espais (`Som de Poble`) i `import.meta.url` els codifica (`%20`). Reproducció: `node tooling/lib/arrel.mjs` no imprimix res i ix amb 0. Ja documentat a [[guarda-cli-file-url-espais]]; ací continua igual.

### D3 · MITJÀ · El flag `--arrel` es llig de l'`argv` global en importar

`arrel()` s'executa en carregar el mòdul (`:272`) amb `process.argv.slice(2)` de **qualsevol** programa que l'importe. `porta:design-guard` passa `--arrel=src`; sonda: `arrel({argv:['--arrel=src']})` llança «Arrel imposada sense marcador». Hui `design_guard.mjs` no importa `arrel.mjs` i no passa res; el dia que algú seguisca la REGLA de la capçalera («cap eina torna a calcular l'arrel pel seu compte») en eixa porta, la porta morirà a l'import. El significat de `--arrel` no és el mateix a totes les eines i este mòdul assumix que sí.

### D4 · BAIX · `CAMINS.escriptori` en majúscules

`'_wiki_de_poble/04_ESCRIPTORI'` (`:85`) contra `indexEscriptori` en minúscules (`:86`) i la carpeta real en minúscules. A macOS `hi()` diu que existix; a Linux, no. És l'origen de C2.

Positiu: `dins()` resol symlinks i l'ancestre existent; el marcador rebutja symlinks; `diagnostic()` troba tots els corroboradors; la precedència d'orígens està ben pensada.

## 6. `eslint.config.js`

### E1 · ALT · El linter talla la cadena i el pre-commit no pot passar

`npx eslint src tooling scripts tests` → **23 errors** (tots `eol-last`) i 357 avisos. `run-portes.mjs:32` fa del Linter el pas 3 de 48 i avorta al primer fracàs (`:100-103`); `.husky/pre-commit` crida `npm run gate` primer de tot. Per tant cap porta posterior (Arrel, Enxufe, SCC, Persistència, RLS, Proves…) s'executa al hook, i els tres commits d'avui han entrat amb `--no-verify` o equivalent. La regla `eol-last` és correcta; el que és insostenible és que 23 salts de línia bloquegen 45 portes. Remei: `eslint --fix` una vegada (o traure `eol-last` d'error a avís) i, sobretot, que `run-portes` execute totes les portes i resumisca al final en compte d'aturar-se a la primera.

### E2 · MITJÀ · La «Llei de l'Enxufabilitat» d'ESLint vigila el paquet, no l'acoblament

`no-restricted-imports` només bloqueja `@supabase/supabase-js` (`:51`), que a `src` només importa `config.js`. L'acoblament real és `fetch` contra `/rest/v1/...` dins de `src/data/supabase/*`; hui no n'hi ha cap fora (comprovat), però ESLint no ho veuria. Qui ho vigila és `tractor-enxufe.mjs`, que no s'executa (E1). Els errors del lint mostren que l'`ignores` afegit al diff funciona (ja no processa `.wwebjs_*` ni `dist`).

### E3 · BAIX

- `globals.browser` i `globals.node` fusionats per a tots els fitxers: un `process.env` dins de `src/` passa el lint i peta al navegador (`backendPort.js:10` s'ho guarda amb `typeof`, però el lint no obligaria a fer-ho).
- 357 avisos (`exhaustive-deps`, `no-unused-vars`) fan invisible qualsevol avís nou; entre ells `GlobalSaveManager.js:1` i `NotesDataContext.jsx:79`.
- `ts`/`tsx` al glob sense parser TypeScript: hui no hi ha cap fitxer, inofensiu.

## 7. Aguantarà el pes de Supabase? (`UniversalWorkspace`, latència)

**Sí en l'esquelet, no en el flux de dades del Bloc.** El que s'ensordirà quan la latència passe de 5 ms (local) a 200-2000 ms (remot i 4G):

| # | Patró | On | Què passarà amb latència |
|---|---|---|---|
| F1 | `loading` buida la vista (B1) | `NotesDataContext.jsx:129` + `UniversalWorkspace.jsx:545` | Cada 409, `sdp:refresh-data` o migració: llista buida i editor desmuntat durant 0,3-2 s; escriure en eixa finestra genera un 409 fals i una altra recàrrega. |
| F2 | Creació sense optimisme | `UniversalWorkspace.jsx:348-372`, `creaNota` | «CREANT…» fins que el servidor respon; timeout a 12 s (`runtime.js:48`). Acceptable, però sense cancel·lació ni missatge intermedi. |
| F3 | Càrrega = 3 peticions paral·leles amb `limit=50` | `notes.js:19-23` | Sense paginació: la nota 51 no existix per a l'usuari, i el seu esborrany es descarta. `section_submissions` es limita a 50 **de totes les seccions** i es filtra al client: pot no dur cap nota. |
| F4 | Fusió de tres fonts (`app_content`, `section_submissions`, `notes`) | `notes.js:24-27`, `mergeById` | Regles de guanyador diferents (revision o `updatedAt`); una `submission` antiga pot reviure camps sobre la fila de `notes`. Amb una sola font de veritat (la taula) el problema desapareix. |
| F5 | Recàlcul de tota la llista a cada tecla | `NotesContext.jsx:137-168` → `NotesSection.jsx:94` → `WorkspaceContext.jsx:47-66` | O(n) per tecla, amb `extractPlainText` del títol de cada nota. Bé amb 50 notes; sensible a 500. |
| F6 | Conflicte 409 = recàrrega completa | `NotesDataContext.jsx:153` | Tres peticions i desmuntatge de l'editor per a resoldre un sol camp; sense fusió per camp ni presentació del conflicte. |
| F7 | Cap subscripció realtime a `notes` | `realtime.js` només xat | Quan s'afegisca, cada esdeveniment passarà per F1. |

El que està ben preparat: el contracte de 32 mètodes i les capacitats de `backendPort` (canviar d'enxufe no toca cap secció); `request()` amb `AbortController`, timeout i refresc de sessió en 401; `AbortController` per càrrega i generació (`loadGen`) per descartar respostes velles; el trigger `touch_notes_updated_at` que incrementa `revision` al servidor; RLS de `notes` per propietari i pertinença (el `grant select … to anon` de la migració és innecessari però innocu amb RLS activa); `WorkspaceContext` normalitza IDs a la frontera i `SlotErrorBoundary` aïlla la llista i el detall.

## 8. Ordre d'atac suggerit (sense tocar res hui)

1. **C1** (`arrelSegura`) i **E1** (`eol-last`): dues línies i `--fix`; sense això cap porta ens diu la veritat.
2. **A1** (clau `::`) amb prova real; després **A2** i **B1** junts, perquè comparteixen la causa: l'estat «recarregant» i l'estat «en vol» no estan modelats.
3. **C2/D4** (majúscules): abans de cap CI en Linux.
4. Decidir el model d'esborranys (**A3/A5/A6**): o una cua de sortida de veritat segons [[contingencia_offline]] §3, o eliminar IndexedDB i quedar-se amb online-first honest segons [[ADR-2026-08-ONLINE-FIRST]] («mostrar errors de xarxa honestos»). La meitat actual és el pitjor dels dos mons.
5. **F3/F4**: una sola font per a notes i paginació, abans de migrar dades reals.
6. **D1/D2/D3**, **B2**, **C4**, **E3**: higiene amb prova.

## 9. Refutacions (el que he intentat trencar i no s'ha trencat)

- L'encadenament de `locks` per clau (`GlobalSaveManager.js:160-164`) és correcte: els desats d'una mateixa nota van en sèrie i `getExpectedRevision` es llig en executar, no en encuar.
- `getDraftsForScope` amb prefix `${scopeKey}:` no confon `tenant` amb `tenant2`.
- `App.jsx:28` estabilitza `config` per `JSON.stringify`: l'efecte de càrrega no entra en bucle per identitat.
- `mergeById` conserva `revision` quan la font secundària no en té.
- 0 col·lisions de `basename` entre els 111 `.md` actuals; 0 orfes amb l'índex sense confirmar.
- `dins()` rebutja escapades per symlink i per `..`.
- Vitest: 14 fitxers, 61 proves, verd. Cobrix `NotesDataContext` amb mocks, no el gestor ni les portes.

**Ancoratge de Seguretat:** [[00_index_escriptori]]
