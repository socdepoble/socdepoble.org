---
type: informe
status: esborrany
description: Auditoria de cues de desat, conflictes, RLS i efectes React amb reproduccions locals sense modificar la solucio.
tags:
  - seguretat
  - sollutia
---

# Auditoria — Fortificació de dades i Sollutia

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-B |
| Encàrrec | SDP-PROMPT-260918-B, versió 1.0.0 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; còpia temporal amb backend simulat |
| Creació | 26-09-18 12:36 CEST |
| Modificació | 26-09-18 12:36 CEST |
| Agent redactor | Codex |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260918_1223_prompt_codex_fortificacio]]
- [Constitució del repositori](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/AGENTS.md>)

## Dictamen

**La cadena de desat encara no permet garantir la conservació dels canvis.** Hi ha **12 defectes: 6 P1 i 6 P2**. Els més urgents són la concurrència durant el desmuntatge, la revisió encallada després d'un 409, les respostes antigues que substitueixen estat nou i la falta de recuperació executable dels desats fallits.

El backend disposa d'optimistic locking: el PATCH filtra per `revision` i el trigger l'incrementa. El frontend no completa la reconciliació. `mergeById` és una selecció de registres per data; **no és un CRDT ni una fusió de canvis concurrents**.

Auditoria sobre el **working tree**, inclosos els canvis locals previs; HEAD `e7f3e8ae2510334c30ae751d0b3a0cb651a20179`. No s'ha modificat codi de l'aplicació, CSS, migracions ni proves del repositori. La captura temporal conté 231 fitxers de `src/` i migracions: és el conjunt capturat, no una afirmació que s'hagen revisat tots. Les comprovacions s'han concentrat en Notes, editor, workspace, transport, identitat i les polítiques SQL relacionades.

## Defectes prioritaris

### F01 · P1 · El desmuntatge envia escriptures paral·leles amb la mateixa revisió

**Evidència:** [NotesContext.jsx:58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:58>), línies 55–63, 130–142 i 166–174.

El camí ordinari encadena `doSave` a `noteLocks`; el cleanup crida directament `q.flush()`. Si A està en xarxa i B espera el debounce, el desmuntatge envia B sense esperar A. La prova registra dos PATCH amb revisió `[1, 1]`. A més, la promesa de B es resol `false` abans que el servidor conteste. Si A confirma primer, B rep conflicte i el canvi més recent no queda al servidor; si B confirma primer, falla A. El comentari «de forma síncrona» no converteix `doSave` en una operació síncrona.

És un camí accessible: [App.jsx:433](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.jsx:433>) remunta el provider quan canvia `actorKey`. Els continuadors de Notes i NotesData també executen setters sense guarda de desmuntatge; això no prova per si sol una fuita de memòria, però la cua continua operant sense propietari de UI.

**Proposta:** un únic gestor de desats independent del muntatge de l'editor, amb serialització per nota en tots els camins. El cleanup ha de transferir o drenar la cua pel mateix mecanisme, sense confirmar-ne el resultat abans del servidor. Guardar la intenció pendent i separar la continuïtat de l'escriptura de la possibilitat d'actualitzar una vista ja desmuntada.

### F02 · P1 · Un 409 pot encallar tots els desats posteriors de la nota

**Evidència:** [NotesContext.jsx:134](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:134>), línies 134–158; [NotesDataContext.jsx:76](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:76>), línies 76–79.

Després d'un desat satisfactori, `knownRevisions` preval sempre sobre la nota recarregada. El 409 provoca un GET, però ningú actualitza ni invalida aquest mapa. Reproducció: desat amb revisió 1 → confirmació 2 → canvi extern a 3 → conflicte → GET retorna 3 → el següent desat continua enviant 2. La seqüència observada és `[1, 2, 2]`.

**Proposta:** conservar base confirmada, modificacions locals i versió remota. En conflicte, llegir la fila autoritzada actual, actualitzar la revisió de base i reconciliar per camps; demanar resolució només si el mateix camp ha canviat als dos costats. Tornar a provar amb un límit. No substituir simplement la revisió i reenviar a cegues tot el text local, perquè es podria trepitjar l'edició remota.

### F03 · P1 · Un GET anterior pot esborrar de la vista un desat confirmat

**Evidència:** [NotesDataContext.jsx:35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:35>), línies 35–37, 63–73 i 98–107.

`loadGen` ordena lectures entre elles, però les mutacions no hi participen. Una recàrrega captura revisió 1; el PATCH confirma revisió 2 i la incorpora; després arriba el GET amb revisió 1 i `setData` substitueix el payload complet. La prova acaba amb el títol antic i revisió 1 malgrat la confirmació del PATCH. També pot desaparèixer una nota acabada de crear si el GET no la incloïa.

**Impacte precís:** el servidor conserva l'escriptura confirmada; la vista retrocedeix i pot alimentar posteriors edicions amb dades antigues.

**Proposta:** versionar també les mutacions respecte de cada lectura. Reconciliar una resposta de càrrega amb les confirmacions posteriors al seu inici, comparant revisions per ID i retenint les creacions confirmades. Invalidar i repetir la lectura quan no es puga fer aquesta reconciliació amb garanties.

### F04 · P1 · Una creació tardana del tenant A entra en la vista del tenant B

**Evidència:** [NotesDataContext.jsx:98](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:98>), línies 98–107; [App.jsx:433](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.jsx:433>); [PedraSecaEmbed.jsx:237](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/PedraSecaEmbed.jsx:237>), línies 237–240.

El host pot canviar `config`, inclòs `tenantId`, sense canviar l'actor. La lectura es protegeix amb generació, però la creació pendent captura la configuració antiga i, en resoldre, insereix el resultat en qualsevol payload actual. Reproducció: iniciar creació a A, carregar B, confirmar A; la llista de B acaba amb `['A-note', 'B-note']`.

**Proposta:** associar cada operació i cada estat a backend, tenant, usuari i generació de sessió. Acceptar una resposta en el context només si conserva aquest àmbit; les confirmacions d'un àmbit anterior han de quedar registrades en el seu gestor, sense contaminar el nou. El mateix criteri s'ha d'aplicar a `updateNote`. No s'ha demostrat cap evasió de RLS: el defecte confirmat és la barreja d'estats al client.

### F05 · P1 · El fallback guarda text però no conserva una cua recuperable

**Evidència:** [NotesContext.jsx:66](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:66>), línies 66–82, 130–132 i 155–174; [storage.js:60](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/storage.js:60>), línies 60–74.

La tasca desapareix de `saveQueue` abans del PATCH. Davant 500, només queden overrides en memòria/sessionStorage: no hi ha reencuament, estat de pendent exportat ni reconstrucció de la cua. La prova força un 500, remunta el provider i avança 30 segons: el text reapareix, però no es fa cap segon intent. Tornar a editar un altre camp només envia aquell camp, no tot l'esborrany pendent.

La protecció d'eixida també queda incompleta: [useUniversalRichText.js:90](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/useUniversalRichText.js:90>), línies 36–47 i 90–103, i [UniversalEditorShell.jsx:114](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:114>), línies 80–86 i 114–128, buiden el debounce de l'editor cap a `saveNoteField`, que programa **altres 600 ms**. Això no garanteix cap enviament abans de tancar la pàgina. El magatzem és efímer, els errors de quota s'ignoren i la clau `sdp_notes_drafts` no separa tenant/usuari. `esborraSessio` tampoc elimina eixa clau (`src/data/identitat.js:165–174`).

**Proposta:** registre de canvis pendents recuperable, amb ID d'operació, àmbit, revisió base, payload i estat d'ACK; persistir-lo durant l'edició, recuperar-lo en arrencar i confirmar-ne l'eliminació només després del servidor. Distingir «pendent», «desant», «confirmat» i «requereix acció». La durabilitat local i la retenció en eixir de sessió han de tindre un contracte explícit; no confiar en un fetch iniciat al tancament.

### F06 · P1 · El timeout acaba quan arriben les capçaleres, abans del cos JSON

**Evidència:** [runtime.js:65](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:65>), línies 49–75.

`return response.json()` deixa pendent el cos, però el `finally` ja elimina el temporitzador i el listener d'avortament. Si arriba HTTP 200 i després el cos s'atura, la promesa del PATCH pot quedar pendent indefinidament. La prova deixa `json()` pendent, avança molt més que el timeout i comprova que el senyal no s'ha avortat. El lock d'aquella nota queda retingut i acumula feina.

**Proposta:** consumir el cos amb `await` dins del `try` i mantindre termini i avortament fins al final de la resposta. Tractar una interrupció després d'enviar una mutació com a resultat incert i reconciliar abans de repetir-la. Comprovació addicional: un senyal que ja arriba avortat tampoc es respecta, perquè només s'hi afegeix un listener (`runtime.js:53–56`); cal comprovar `signal.aborted` abans d'iniciar fetch.

## Altres defectes confirmats

### F07 · P2 · La mateixa tasca es pot inserir diverses vegades darrere del lock

**Evidència:** [NotesContext.jsx:119](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:119>), línies 119–132 i 168–174.

Quan venç el debounce, el treball s'encadena a `prevLock`, però continua en `saveQueue` fins que realment comença. Si A tarda, B venç i després C torna a editar aquella mateixa tasca, es programa de nou un `doSave` sobre el mateix payload. Prova: els PATCH enviats són `A, C, C`. Amb més pauses d'escriptura, es repeteix el problema i s'acumulen continuadors.

**Proposta:** separar el lot editable del lot ja segellat i encuat; retirar-lo de la cua editable en programar-lo, copiar-ne payload/resolutors i permetre només una entrada executora per lot. Els canvis posteriors han d'entrar en el lot següent.

### F08 · P2 · La recuperació de timeout comprova un text que el transport no emet

**Evidència:** [NotesDataContext.jsx:76](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:76>) i [runtime.js:68](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:68>).

El context busca `message.includes('timeout')`; el transport emet `name = 'TimeoutError'` i «La petició ha trigat massa temps.». La prova amb aquest error exacte no dispara la recàrrega prevista. Un PATCH que s'haja confirmat al servidor abans del tall queda sense reconciliar.

**Proposta:** codis estructurats, independents de la traducció, i reconciliació explícita dels resultats incerts.

### F09 · P2 · Un error normal de xarxa pot deixar Notes carregant indefinidament

**Evidència:** [NotesDataContext.jsx:39](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:39>), línies 38–45.

Es rellancen tots els `TypeError` assumint que són errors de programació. `loadNotes` també pot rebutjar amb un `TypeError` de fetch. Com que `load()` es crida sense capturar la promesa, no es publica `status: 'error'` i el rebuig queda sense gestionar. S'ha executat el cos real de la funció amb `TypeError('Failed to fetch')`: rellança l'error i no crida `setData`.

**Proposta:** normalitzar els errors de transport a la frontera i donar eixida explícita a tota promesa iniciada des de l'efecte. Classificar errors pel contracte, no només per `instanceof TypeError`.

### F10 · P2 · Zero files afectades es presenta sempre com un conflicte de versió

**Evidència:** [notes.js:57](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/notes.js:57>), línies 57–59; `supabase/migrations/260914_0000_schema_notes.sql:54–79`; `runtime.js:58–64`.

Un PATCH amb representació buida es transforma en 409 encara que la fila haja desaparegut o no siga visible per la política de permisos. La prova amb HTTP 200 i `[]` confirma la classificació. Un 403 explícit sí que es propaga amb el seu status, però Notes l'agrupa amb la resta d'errors i suggereix tornar-ho a provar. El cos PostgREST queda incrustat en un text: `code`, `details` i `hint` no s'exposen com a camps.

**Proposta:** distingir transport, autenticació, permisos, resultat incert i conflicte comprovable. Després de zero files, comprovar de manera autoritzada si hi ha una versió visible; si no, comunicar «no accessible o eliminada», sense revelar-ne l'existència. Preferir una RPC amb contracte atòmic quan calga més precisió. No reintentar automàticament denegacions permanents.

### F11 · P2 · `mergeById` pot descartar la versió autoritzada més recent

**Evidència:** [mapejadorSeccions.js:139](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/mapejadorSeccions.js:139>), línies 139–153; [notes.js:25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/notes.js:25>), línies 24–28.

Es comparen dates de registres procedents de `app_content`, `notes` i `section_submissions`, sense prioritat de font ni revisió. Dues reproduccions: amb dates iguals, una revisió 1 secundària substitueix la 5; amb data invàlida al registre anterior, `NaN` impedeix que guanye una fila posterior vàlida. Es reemplaça l'objecte sencer, no es reconcilien camps.

**Abast:** el defecte necessita IDs coincidents entre les fonts; no s'ha comprovat que la BD real continga aquestes col·lisions. El comportament de la funció i la ruta que barreja les fonts sí que estan confirmats.

**Proposta:** establir `notes` com a font autoritzada de les notes editables, separar contingut de catàleg/llegat i comparar revisions només dins de la mateixa entitat/versionat. Validar timestamps i dades d'entrada. Una fusió de conflictes ha de conèixer la base i les modificacions, no només l'ID.

### F12 · P2 · La memòria cau falla en totes les notes sense overrides i propaga treball a la llista

**Evidència:** [NotesContext.jsx:87](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:87>), línies 76–110; `src/utils/contentAdapter.js:13–23`; `src/sections/notes/NotesSection.jsx:28–67`; `src/components/universal/workspace/WorkspaceContext.jsx:47–65`.

`localNoteOverrides[id] || {}` crea una referència nova quan no hi ha override. Per tant, `cache.overrides === overrides` falla per a totes les notes intactes en cada tecla. La prova amb dues notes edita només una i observa quatre extraccions de text i una referència nova per a la nota intacta. Cada extracció real saneja HTML i crea un DOMParser; a continuació es tornen a construir categories, etiquetes, items, índexs i filtres.

També s'escriu síncronament tot el mapa d'esborranys a cada actualització. `parsedNotesCache` no elimina IDs desapareguts, i els overrides confirmats conserven l'entrada amb `revision`. Això permet acumulació al llarg de la vida del provider. No s'ha mesurat una congelació de UI ni una fuita permanent amb un perfilador de memòria.

**Proposta:** sentinel buit estable, cache key completa, reutilització per ID i purga d'entrades que ja no corresponen a dades vigents. Mantindre estables els elements no modificats, separar context d'accions i dades quan calga i persistir canvis sense serialitzar tot l'historial a cada tecla. Mesurar amb cossos grans abans de decidir virtualització.

## Comprovacions favorables i hipòtesis descartades

- `UniversalWorkspace.jsx:262–296` protegeix la selecció després de crear amb `mountedRef` i generació. Eixa protecció és correcta per al component; no cobreix les mutacions internes del provider.
- Les lectures de NotesData disposen de senyal d'avortament, bandera activa i generació (`NotesDataContext.jsx:27–50`). No s'ha atribuït F03 a manca d'aquestes proteccions: el problema és la concurrència entre lectura i escriptura.
- Les polítiques SQL de Notes limiten propietari i pertinença al tenant; el trigger incrementa la revisió. S'ha revisat el SQL local, no el desplegament real.
- El hook de recàrrega elimina el listener (`useRecarregaExterna.jsx:15–19`) i el ResizeObserver es desconnecta (`AppGridShell.jsx:90–94`). No s'ha trobat un listener permanentment acumulat en aquests camins.
- No s'ha reproduït cap bucle infinit de sincronització del workspace. El reducer retorna el mateix estat davant una sincronització idèntica (`workspaceState.js:113–120`) i la reconciliació està condicionada (`WorkspaceContext.jsx:160–168`).
- La prova de canvi de nota amb contingut pendent desa A i carrega B correctament. No s'inclou la hipòtesi d'atribuir el text d'A a B.
- Les correccions locals que connecten `NotesContext` amb `NotesDataContext.updateNote` i que passen categories/tags a `notes.js` estan presents. No es repeteixen com a defectes històrics encara vigents.

## Validació i reproducció

S'ha treballat en `/private/tmp/sdp-audit-260918-i3behpws`, amb còpia del codi i dependències ja instal·lades, sense credencials ni peticions al backend real.

- Suite completa de la captura: **47 proves existents + 14 diagnòstiques = 61 correctes**.
- Ampliació posterior: una prova de canvi de tenant i una de `TypeError` de càrrega, **totes dues correctes**; la primera s'ha executat juntament amb les set proves de Notes ja incloses.
- Total de casos diferents verificats: **63**; 47 existents i 16 diagnòstics. Els diagnòstics passen perquè afirmen explícitament el comportament defectuós, llevat del control favorable de canvi de nota. No vol dir que els defectes estiguen corregits.
- Dos problemes del banc de proves es van corregir només a `/private/tmp`: l'espera d'efectes amb temporitzadors simulats al cas 409 i la lectura del fitxer mitjançant una URL transformada per Vite. No eren regressions del producte.

Fitxers de reproducció, conservats temporalment:

- [Cua, conflictes, recuperació, rendiment i tenant](/private/tmp/sdp-audit-260918-i3behpws/src/sections/notes/forensic.audit.test.jsx)
- [Transport, RLS simulat i merge](/private/tmp/sdp-audit-260918-i3behpws/src/data/supabase/forensic.transport.test.js)
- [Error de càrrega](/private/tmp/sdp-audit-260918-i3behpws/src/sections/notes/forensic.load.test.js)
- [Control de canvi de nota](/private/tmp/sdp-audit-260918-i3behpws/src/components/universal/richText/forensic.switch.test.jsx)
- [Manifest SHA-256 del codi capturat](/private/tmp/sdp-audit-260918-i3behpws/source-manifest.json)

SHA-256 del manifest: `620b0120903610ad77560d773cf21d89529d7753b6536222f67ee1751a7eafa6`. La comparació amb el working tree després de les proves no ha detectat diferències en els fitxers capturats.

Comanda de la suite completa executada, des del repositori:

```sh
node node_modules/vitest/vitest.mjs run \
  --config /private/tmp/sdp-audit-260918-i3behpws/vite.config.js \
  --root /private/tmp/sdp-audit-260918-i3behpws
```

## Ordre proposat per a IAIA MarIA

1. Definir el registre recuperable de desats i el seu àmbit; corregir el segellat dels lots i fer que el desmuntatge use la mateixa cua.
2. Completar la reconciliació de revisions i protegir càrregues/mutacions amb àmbit i generació. Afegir proves que exigisquen la conducta correcta per als escenaris F01–F05 i F07.
3. Corregir el termini complet de resposta i normalitzar errors de xarxa, timeout, permisos i conflicte.
4. Separar les fonts de notes i reparar la cache; mesurar cost per tecla amb moltes notes i text llarg.
5. Validar contra un Supabase de proves: dues sessions editant simultàniament, revocació de pertinença, eliminació remota, resposta interrompuda després del commit i canvi de tenant al host.

## Límits i incògnites

No s'han consultat secrets, dades privades remotes ni l'estat del desplegament de Sollutia. No es pot certificar que les migracions locals estiguen aplicades, que hi haja conflictes reals de les fonts llegades o que el host reconfigure tenants en producció. Tampoc s'ha fet un perfil de CPU/heap en navegador. L'evidència és codi actual, SQL local i execució determinista amb respostes simulades.

## Tancament documental

- `node tooling/gates/tancament.mjs --json`: executat; eixida 1 per **10 documents orfes previs**. Cap error correspon al nou informe, que està ancorat. [Resultat complet](/private/tmp/sdp-audit-260918-i3behpws/closure-results.json).
- `node tooling/wiki/tractor-frontmatter.mjs --estricte --json --arrels=_wiki_de_poble/04_escriptori`: executat; eixida 1 per incidències documentals del conjunt de l'escriptori. **Cap incidència atribuïda al frontmatter del nou informe.** [Resultat complet](/private/tmp/sdp-audit-260918-i3behpws/frontmatter-results.json).
- `.agents/ESTAT.md` i l'índex de l'escriptori actualitzats. No s'han corregit documents aliens ni s'ha aplicat cap de les solucions proposades.
