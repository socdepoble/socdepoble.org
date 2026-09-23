---
type: informe
status: esborrany
description: Auditoria de contractes, concurrència, persistència i estats UI del Bloc de Notes amb pla de reparació verificable.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3fec2a96-18b7-4cd0-a07e-9c33089a4621:21a2619c-3f2c-4d40-a825-b25aa3cab949
---
# Auditoria de Sollutia i del Bloc de Notes

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3fec2a96-18b7-4cd0-a07e-9c33089a4621:21a2619c-3f2c-4d40-a825-b25aa3cab949 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T11:05:08.669Z |
| Modificació | 2026-09-23T11:05:08.669Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23: auditoria local AFK; lectura del codi, proves existents, reproduccions aïllades i inspecció de Notes al port 3340. No s’ha implementat cap reparació.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen i abast

**No es pot donar llum verda a la persistència del Bloc de Notes ni certificar l’enxufabilitat completa.** El port existeix i les portes estàtiques passen, però la cadena UI → context → cua → adaptador → SQL té contractes interromputs i camins que poden perdre canvis. No he demostrat una vulneració de la RLS desplegada ni una fuga remota entre tenants: he demostrat defectes locals i llegit les migracions, sense executar-les en cap servidor.

Tall: HEAD `6423590ed5cdb5408794f88acb157fc6d215c1c0`, **arbre de treball amb canvis previs**, no sols HEAD. Les línies citades corresponen al disc revisat. Abast: `UniversalWorkspace`, `WorkspaceContext`, NotesSection/Editor/Context/DataContext, GlobalSaveManager, editor ric, backendPort, host/configuració, adaptador Supabase de notes i mitjans, publicació al Mur, migracions i tractors relacionats. No s’ha llegit l’arxiu històric ni cap `.env`.

P1 = integritat/persistència o funció essencial trencada; P2 = comportament, diagnòstic o cobertura insuficient. Les reparacions tècniques següents tenen `requires_human_decision: false`; són una proposta, no una ordre d’executar codi en este torn AFK.

### N01 · P1 · El contracte de Notes es perd en el context intermedi

**Evidència:** `src/sections/notes/NotesContext.jsx:52,253` no recull ni exposa `notesComplete`, `resolveNote` o `workspaceKey`; `NotesSection.jsx:58` els demana i els passa al model. `NotesDataContext.jsx:428` sí que els proporciona. `UniversalWorkspace.jsx:77` necessita la clau per reiniciar el proveïdor. `WorkspaceContext.jsx:204` genera un error si falta el resolutor en una llista parcial.

**Reproducció:** obrir un ID que no estiga en els primers 50 resultats. L’ID queda pendent sense consulta individual; a més, el canvi de sessió no reinicia l’estat de selecció del Workspace amb la clau dissenyada per a això. Al navegador sense sessió, `/notes?nota=11111111-1111-4111-8111-111111111111` conserva la URL i mostra la benvinguda, sense explicar l’absència.

**Reparació:** transmetre explícitament el contracte complet, inclosos refresc i resolució, o consumir el contracte de dades directament en l’adaptador de Notes. Prova integrada amb els dos providers reals, no únicament mocks del port. Font: llei d’enxufabilitat i contracte existent de Workspace.

### N02 · P1 · La pujada d’imatges de Notes omet la configuració del tenant

**Evidència:** `NotesEditor.jsx:27` crida `uploadToStorage(fitxer, { carpeta: 'notes' })`; `backendPort.js` delega els arguments sense afegir configuració. `supabase/storage.js:103` exigix un tenant UUID en les opcions o en el tercer argument. Sense ell llança «Poble o usuari invàlid», fins i tot amb sessió vàlida. El client Supabase fixat no resol esta validació prèvia.

**Prova:** la prova existent `storage: poble explícit...` comprova expressament que esta mateixa crida sense tenant falla; la versió amb tercer argument passa. La UI usa la forma fallida.

**Reparació:** adapter de mitjans vinculat a la configuració immutable del Workspace, transportada explícitament a totes les operacions. Provar upload des de NotesEditor amb tenant A i B. No ometre la validació ni substituir el tenant per un valor global. Font: contracte Storage i RLS de mitjans.

### N03 · P1 · Notes no valida tenant/IDs abans d’enviar peticions

**Evidència:** `supabase/runtime.js:30` normalitza un tenant absent a `null`; `supabase/notes.js:67,131,146` no el rebutja. La lectura/PATCH construïx `tenant_id=eq.null` i la creació envia `tenant_id: null`. La taula `260914_0000_schema_notes.sql:7` exigix UUID no nul i referència a `towns`. Altres loaders, com `content.js:11`, sí que rebutgen l’absència abans de la xarxa. `createNote` accepta qualsevol `input.id` i `updateNote` no valida la forma ni el valor de revisió.

**Impacte:** configuració incompleta es presenta com a error remot, no com a contracte invàlid; no hi ha garantia que «configurat» signifique que Notes pot operar. La RLS pot denegar una petició, però no arregla el cablejat.

**Reparació:** validar configuració de Notes una vegada a l’entrada i abans de qualsevol mutació; UUID per a l’adaptador Supabase, revisió entera vàlida, usuari de sessió i disponibilitat del tenant. No imposar UUID al Workspace genèric. Provar absència, format invàlid, tenant sense pertinença i tenant existent. Font: esquema SQL i AGENTS §8.

### N04 · P1 · Es barregen notes persistents, contingut antic i targetes informatives

**Evidència:** `supabase/notes.js:77` consulta tres fonts: `app_content`, `section_submissions` i `notes`; després les fusiona. `supabase/runtime.js:117` injecta `APP_SEED.notes` fins i tot quan `app_content` retorna buit i força les notes de llavor a `f-mur`. `NotesSection.jsx:126` autoobri `n1`; `NotesEditor.jsx` canvia l’autoria de l’exemple, però no desactiva l’edició. La taula de notes té ID UUID: `n1` no és actualitzable allí. Les notes de submissions tampoc no es convertixen automàticament en files de `notes`.

La migració `260920_0300_blindatge_storage_i_contingut.sql:72` exclou `notes` i `noteFolders` de la lectura editorial ordinària. El loader conserva, per tant, una dependència d’un canal que la política vigent ha restringit. Un error en qualsevol de les tres consultes fa fallar tot `Promise.all`.

**Reparació:** `public.notes` com a única font de notes editables; carpetes segons contracte explícit; importació del llegat separada i idempotent. La benvinguda és contingut de presentació de només lectura i no participa en actualització, revisió, cerca de notes privades o publicació. No retirar-la visualment sense referència. Font: ADR online i separació editorial/privada de la migració.

### N05 · P1 · El desat fallit antic pot substituir l’esborrany nou

**Evidència:** `GlobalSaveManager.js:136` posa a IDB només el payload de la cua actual; en expirar el debounce elimina eixa cua de memòria (`:140`). Si A està en xarxa i B es posa en cua, B substituïx el registre. Si A falla, el catch escriu el payload d’A amb un timestamp nou (`:173`), damunt de B.

**Reproducció aïllada executada:** A = títol «antic», petició pendent; B = títol «nou», encara en debounce; rebutjar A amb error de xarxa. El registre simulat passa de «nou» a «antic». Mateix algoritme del fitxer, transport i persistència substituïts per dobles en memòria. No és una prova del motor IndexedDB.

També falla la fusió de camps: un payload B de contingut pot substituir un títol A encara no confirmat. Si es tanca la pestanya, només queda l’últim registre.

**Reparació:** esborrany acumulat per nota, versió monotònica de l’operació i transaccions de comparar/actualitzar. Un resultat antic només reconcilia els camps i la versió que ha confirmat; un error no escriu sobre una versió posterior. Proves d’ordre A/B amb èxit, error i tancament. Font: integritat del text de l’usuari.

### N06 · P1 · Publicar evita la cua, no és atòmic i pot eliminar canvis pendents

**Evidència:** `NotesContext.jsx:235` crea una submission i després fa PATCH directe amb `isPublished: true` (`:238`), fora del lock de GlobalSaveManager. No desa `publishedSubmissionId`, no conserva una clau d’idempotència i no comprova els booleans de `saveNoteField`. `content.js:57` genera un UUID nou cada vegada si la submission no du ID. Si el POST funciona i el PATCH falla, la UI diu error però el Mur ja ha rebut la publicació; reintentar pot duplicar-la.

`clearDraft` (`GlobalSaveManager.js:188`) esborra tota la cua i el registre sense comprovar què s’ha publicat ni resoldre les promeses de la cua eliminada. **Reproducció executada:** enqueue → clearDraft abans de 600 ms; zero timers i promesa encara pendent. No cancel·la un lock ja en vol.

**Reparació:** serialitzar autosave i publicació per nota; capturar una versió concreta del document; esperar la confirmació del desat; publicació amb ID estable i resultat recuperable. Preferible transacció/RPC idempotent per submission + vinculació a nota; si es fa en dos passos, protocol de recuperació explícit. Netejar només els canvis confirmats. Bloquejar doble clic mentre publica. Font: consistència entre Notes i Mur.

### N07 · P1 · Les proteccions de sessió de les lectures no cobrixen tots els callbacks

**Evidència:** NotesDataProvider usa token i generació per descartar respostes antigues; és una protecció real. Però `updateNote` (`:336`) i `creaNota` (`:382`) retornen el resultat antic encara que la generació haja canviat, encara que ja no el posen en dades. El gestor global interpreta el retorn com a èxit i invoca `clearLocalNoteFields`, que modifica l’estat actual sense comprovar scope ni generació (`NotesContext.jsx:112`). El callback conserva també l’antiga clau de sessionStorage. Pot netejar o reescriure l’esborrany d’una sessió posterior quan coincidix ID/camp, per exemple en tornar al mateix compte o amb dues vistes del mateix usuari.

`useUniversalRichText.js:23,46` actualitza `onSaveRef` abans que la neteja de l’ID anterior faça flush: un esborrany antic pot cridar el callback nou. `scopeKey` tampoc inclou l’usuari autenticat independentment d’`actorKey`; amb actor entitat, `IdentitatContext.jsx:24` accepta una preferència persistent sense validar membership i la clau pot repetir-se entre comptes. El transport llig el JWT global en cada petició (`runtime.js:44`), inclosos reintents.

**Reparació:** identitat d’operació immutable `{ backend, tenant, authUserId, actor, generation }`, comprovada abans d’enviar i abans de reconciliar. Neteja de draft per scope i versió, mai només per ID. El pendingSave ha de conservar també el callback/scope d’origen. No cancel·lar ni perdre el text silenciosament: conservar-lo segregat i marcar el resultat com a cancel·lat o pendent. Provar A→B→A, logout durant request, actor entitat i dues instàncies. **No es presenta com a bypass provat de RLS.**

### N08 · P1 · Esborrany, revisió remota i revisió coneguda no tenen una reconciliació comuna

**Evidència:** `NotesDataContext.jsx:62` descarta un esborrany quan el seu rellotge local és anterior a `updatedAt` remot: un conflicte o un desfasament de rellotge pot fer desaparèixer el treball de la vista sense resolució explícita. IDB encara pot conservar-lo; no és necessàriament esborrat físic. `NotesContext.jsx:144` sobreposa tots els overrides, inclosa `revision`, a la fila remota. `GlobalSaveManager.js:110` preferix sempre `knownRevisions`, encara que el refresc haja portat una revisió posterior. Reproducció: revisió coneguda 2 + base 5 retorna 2.

L’error 409 neteja la revisió coneguda, però no hi ha un flux de conflicte que preserve i compare base/local/remot ni un botó de reintent de desat. `getDraftsForScope` només carrega, no confirma ni reenvia.

**Reparació:** separar revisió de servidor i versió local; esborrany amb revisió base, camps pendents i estat d’error/conflicte. No usar rellotges de dispositiu per declarar guanyador. La política online no obliga a reenviar automàticament: oferir reintent explícit i reconfirmar scope/revisió. Provar conflicte amb canvi remot d’un altre camp i rellotge desfasat.

### N09 · P2 · Refrescar acumula files i la llista no té continuació

**Evidència:** `mergeNotes` (`NotesDataContext.jsx:78`) sempre conserva els IDs que falten en la resposta. Reproducció aïllada: estat amb una nota + resposta buida conserva eixa nota. Una eliminació externa no es reconcilia, i una resposta antiga de revisió inferior es rebutja, però una mutació individual posterior (`:364`) substituïx sense comparar revisions.

`loadNotes` limita notes i submissions a 50, marca `notesComplete: false`, però no retorna cursor ni mecanisme de pàgina següent. La cerca i les categories només veuen els elements carregats. El resolutor per ID és un bon mecanisme per enllaços directes, però no substituïx paginació.

**Reparació:** diferenciar snapshot complet, pàgina i detall; reemplaçar només quan hi ha prova de completitud, reconciliar tombstones o absència verificada, i implementar cursor/càrrega addicional. No solucionar-ho posant `notesComplete: true` amb 50 resultats. Provar 51+ notes i eliminació en un altre client.

### N10 · P2 · La targeta buida amaga errors de resolució i no existix el slot declarat

**Evidència:** `WorkspaceContext` exposa `itemResolution` i `retryItemResolution`; `UniversalWorkspace.jsx:604` només considera `status` global i passa `item: null` al detall. No transmet la resolució ni oferix reintent. NotesEditor interpreta qualsevol null com a benvinguda. Això barreja «cap selecció», «carregant ID», «no accessible» i «error».

L’ESTAT anterior afirma haver incorporat `renderIntroCard`, però **el component actual no declara ni consumix esta propietat**. Wiki i Disseny injecten `__intro` dins d’items (`WikiDePobleSection.jsx:260`, `DesignSection.jsx:64`), mentre Notes usa l’exemple `n1` i `emptyDocument`. El model de presentació no és coherent. En la visita anònima s’ha observat «Foraster», «Identitat Lliure» i l’hora actual en la benvinguda; és evidència d’allò que pinta hui, no aprovació del disseny.

**Reparació:** contracte explícit per intro/empty/loading/error/not-found i detall, amb callbacks tipats o validats i límits d’error. Reutilitzar l’aparença aprovada; les targetes no són notes ni tenen revisió. Passar l’estat de resolució a la UI i un reintent. No inferir salut del text de l’ESTAT.

### N11 · P2 · Crear no està condicionat per disponibilitat i no és idempotent

**Evidència:** `UniversalWorkspace.jsx:484` només desactiva crear quan no hi ha callback o ja s’està creant; no considera càrrega, error, sessió o capacitat. Al navegador anònim el botó està disponible. `NotesDataProvider.creaNota` comprova token, però no `status`; `requestItem` ignora la selecció si el Workspace no està ready (`WorkspaceContext.jsx:131`). Un POST resolt durant una revalidació pot deixar una nota creada sense obrir-la.

El client genera un UUID nou per cada crida a createNote si no s’ha donat `input.id`. Un timeout després d’un commit remot deixa un resultat incert i un segon intent pot crear una altra nota.

**Reparació:** model de capacitat/disponibilitat de crear sense acoblar UniversalWorkspace a auth; estat de creació independent de revalidació; ID estable per intenció i recuperació del resultat pel mateix ID. Provar timeout després de persistir i canvi de categoria durant POST.

### N12 · P2 · Timeout i persistència local tenen diagnòstics incomplets

`runtime.js:83` emet `name: TimeoutError`, missatge «La petició ha trigat massa temps.»; `NotesDataContext.jsx:376` busca la subcadena `timeout`, que no hi és. No s’activa el refresc previst per eixe error.

`GlobalSaveManager.js:6` obri una connexió IDB per operació i no la tanca; no tracta `blocked`, `versionchange` ni `tx.onabort`. `removeDraftIfMatch` resol abans de `tx.oncomplete`. Els errors d’obertura es convertixen en avisos sense estat de persistència visible. `NotesContext` manté una segona còpia a sessionStorage de tots els camps excepte content; títols/entradetes poden créixer i el debounce no elimina el cost síncron ni la regla de mida. El cos només arriba al gestor després del debounce de 800 ms de l’editor; «persistim immediatament» no vol dir a cada tecla.

**Reparació:** taxonomia d’errors per codi/nom, persistència amb resultat observable i transacció completada, connexió gestionada, límits i estat dirty/saving/saved/error. Una sola font d’esborranys. Provar quota/abort, IDB no disponible i tancament de pestanya. No prometre supervivència absoluta a una caiguda abans de confirmar IDB.

### N13 · P2 · El mock oficial de Sollutia no complix el contracte executable

**Reproducció executada:** `validaBackendImplementation(mockSollutiaBackend)` llança `Capacitat parcial: mitjans`. El mock declara upload/getPublicUrl però no resolveAsset/promoteToPublic. `createNote` retorna l’input sense ID/revisió; `updateNote` retorna el primer argument, que en la crida real és un ID; loadNotes no implementa completitud/resolució. Encara que s’arreglara la capacitat, la demostració no acreditaria Notes.

**Reparació:** doble executable que simule DTO reals, estat, revisió, tenant, resolució individual i errors. Suite de conformitat compartida per adaptador i doble. Font: `contracte.js` i ús real dels consumidors.

### N14 · P2 · Les portes verdes només acrediten una part de la frontera

`tractor-sollutia.mjs` vigila variables CSS d’amfitrió, ordre de build i tokens no consumits; S2 d’instància única està retirat. No prova tenant, notes, sessions ni cues. `tractor-enxufe` valida estructura/imports i noms de mètodes, no semàntica de retorn. `tractor-adaptadors` comprova la Frontissa GET amb una fixture, no persistència de notes. `tractor-rls` és estàtic: no consulta les polítiques efectives del servidor.

Les 11 proves seleccionades de React passen, però NotesDataContext té una prova principal i mockeja backend/identitat/IDB; no travessa NotesContext→NotesSection. Les 14 proves Node passen i inclouen backend, credencials i Storage, junt amb proves documentals. Cap resultat substituïx proves adverses del flux complet.

**Reparació:** portes diferenciades d’estructura, contracte i comportament; tests negatius que demostren que cada porta falla quan injectem el defecte. No crear un altre tractor només de regex i anomenar-lo blindatge de persistència.

### N15 · P2 · El model d’integració descrit no és únic

El prompt i AGENTS parlen de backend proveït per Sollutia. L’ADR activa `ADR-2026-09-SOLLUTIA-MODEL-B.md` fixa Supabase de SdP com a font de veritat, Sollutia com a amfitrió i GET per Frontissa, sense substituir el backend. En canvi `host.js:50` documenta reemplaçar Supabase, i el mock ensenya esta injecció.

**Reparació proposada:** executar el pla assumint Model B com a contracte d’integració documentat, mantenint el port modular. Precisar quin projecte Supabase, esquema/versionat, sessió i configuració rep l’amfitrió en l’entrega tècnica. No introduir escriptures a la Frontissa. Si es vol substituir el Model B, això sí que és una decisió de govern fora d’esta reparació (`requires_human_decision: true` només per a canviar el model); no cal per completar l’auditoria.

### Pla d’acció ordenat i criteris de tancament

| Fase | Acció concreta | Prova d’acceptació |
| --- | --- | --- |
| 0 · Contracte | Fixar Model B, DTO de notes, scope i resultats de cada operació; inventariar fonts i retirar amb migració les ambigüitats de llegat | Mateixa suite sobre doble i adaptador; cap nota editorial entra en mutations |
| 1 · Cablejat | Exposar contracte complet N01, passar config a Storage N02 i validar tenant/IDs N03 | Obri una nota fora de la primera pàgina; cap petició amb tenant absent; upload autenticat usa el poble correcte |
| 2 · Persistència | Servei de desat per scope/nota amb versió d’operació, revisió base i draft acumulat; N05/N07/N08/N12 | Ordres A/B adverses no perden camps; logout i A→B→A no reconcilien callbacks antics; errors es mostren |
| 3 · Publicació | Autosave i publicar compartixen serialització; ID estable i vinculació transaccional/recuperable | POST confirmat + PATCH fallit + reintent produïx una publicació; cap draft posterior és esborrat; totes les promeses acaben |
| 4 · UI | Slots de presentació explícits i mateixes primitives visuals; estat de resolució i reintent; disponibilitat de crear; paginació | Estats empty/loading/error/not-found diferents; 51+ notes accessibles; captura abans/després sense redisseny alié |
| 5 · Frontera real | Proves de contracte i E2E en entorn de prova de Sollutia/Supabase amb dos usuaris i dos tenants | Read/insert/update/delete denegats fora de propietat/pertinença; cap contaminació entre instàncies; reinici conserva el que s’ha confirmat |

La solució no necessita obligatòriament una dependència nova. Conservar les barreres actuals de NotesDataProvider i el port; concentrar la lògica transaccional en un servei de notes i deixar el context de presentació prim. A sis mesos, cada invariant ha de tindre un únic propietari i una prova que l’exercite.

Alternatives descartades: (a) afegir més flags i efectes als tres magatzems actuals, perquè manté propietats duplicades; (b) una reescriptura general de l’app o introduir una cua offline amb reintents silenciosos, perquè excedix l’abast i la doctrina online. Cap «reparació definitiva» pot significar absència universal de fallades: ha de significar invariants, recuperació i proves reproduïbles.

### Aportació a la Reunió a l’Olivera

He llegit el pla `260923_1245_pla_implementacio_auditoria.md` i l’auditoria visual de MarIA de les 12:35. El pla és un punt de partida, encara sense reparacions concretades. **No ratifique que afegir una targeta o reforçar un tractor visual solucione la persistència.** Incorporar N01–N15 i les fases anteriors abans de consensuar-lo. El tractor d’icones/textos proposat per MarIA pot vigilar convencions de disseny, però no detectarà estes curses; el nombre de divs tampoc no és una prova de correcció.

No he trobat una auditoria nova de Claude lliurada a l’Escriptori durant esta revisió; el seu prompt se centra en el Brain. No declare consens en nom seu. La meua aportació està materialitzada ací i referenciada al pla, conservant-ne la redacció de MarIA.

### Millores proposades per al prompt local

1. Fixar explícitament arbre de treball/HEAD i hashes dels fitxers; separar comprovat en execució, inferit del codi i pendent de servidor.
2. Substituir «100% blindat» per invariants verificables de sessió, tenant, revisió, idempotència i presentació.
3. Distingir auditoria local sense mutacions de dades de les proves d’escriptura en backend de prova; donar comptes/tenants de prova només quan toque implementar/verificar.
4. Declarar propietari d’edició del pla i protocol d’aportacions per evitar sobreescriptures concurrents. El nom esperat pel pla (1245) no ha de contradir el timestamp real d’entrega (1303).
5. Unificar versió: el títol de la plantilla diu v2.0, el Registre v2.1.0 i protocolledge v2.0.0. Mantindre una sola versió executable.
6. Afegir taula obligatòria de proves negatives i limitacions; «porta passa» no equival a «flux complet correcte». Mantindre AFK explícit i no inferir una ordre de reparar del consens.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació executada | Resultat i abast |
| --- | --- |
| Vitest: NotesDataContext, UniversalWorkspace, workspaceState, workspaceFolderForest | 4 fitxers, 11 proves passen |
| `node --test tests/backend_consolidacio.test.mjs` | 14/14 passen; inclou casos backend, transport i Storage, no E2E de Notes |
| `node tooling/gates/tractor-sollutia.mjs --json` | `ok: true`, zero infraccions estàtiques |
| `node tooling/gates/tractor-enxufe.mjs --json` | `ok: true` |
| `node tooling/gates/tractor-adaptadors.mjs` | Passa, 1 fixture |
| `node tooling/gates/tractor-rls.mjs` | Passa sobre 18 SQL; no acredita desplegament |
| `node tooling/gates/tractor-persistencia.mjs` | Falla: 3 accessos directes a storage en detailRegistry.jsx:8,16,20; deute previ fora de la reparació de Notes |
| Reproduccions aïllades Node/VM | Mock mitjans rebutjat; error antic sobreescriu draft nou; clearDraft deixa promesa pendent; revisió coneguda antiga preval; merge buit conserva nota; applyDraft descarta overlay per timestamp |
| Navegador de l’app, localhost:3340 | Sense sessió: `/notes` mostra benvinguda i botó crear; URL amb UUID absent mostra la mateixa benvinguda i conserva ID |

Les reproduccions VM han executat el cos real de les funcions amb transport, timers i persistència simulats, sense escriure codi al repositori. El primer assaig d’applyDraft fallà perquè el doble Date només tenia `now`; repetit amb Date real, les dues assertions de merge/draft passen. No es compta l’error del harness com a error del producte.

Empremtes SHA-256 dels fitxers centrals al tall de redacció:

| Fitxer | SHA-256 |
| --- | --- |
| NotesContext.jsx | ca64ae477101f09df2299acda28a36e247c461c7feb4f2450f6be8ca9ece2dd6 |
| NotesDataContext.jsx | 9743216282ccd23719eb9c44043f5366bef13c33622422dba4e30163e4eddd71 |
| GlobalSaveManager.js | ebcc40a60b7776f4828c5c12c4707ab3fad565210ecae57da2da680e58ca8d2e |
| UniversalWorkspace.jsx | d4a2db8e454d5a67bb88022ca4d402402ccc4cb2168e799ea110ca029fdfce0c |
| supabase/notes.js | 1b640956da44eb88b9694f7176f2648bd632ee6beb9c0bddc5bd9a426e777a44 |

Referències primàries consultades per contrastar el pla: [React: cleanup i curses de càrrega](https://react.dev/reference/react/useEffect), [Supabase: RLS i auth.uid](https://supabase.com/docs/guides/database/postgres/row-level-security). Sustenten la separació entre cancel·lació local i autorització al servidor; les troballes concretes provenen del repositori.

**Validació documental:** `document.mjs check` retorna `valid: true`.

**Tancament executat:** `node tooling/gates/tancament.mjs --turn-id torn_3fec2a96-18b7-4cd0-a07e-9c33089a4621 --check` retorna `valid: false`, exit 1. Passen plantilles, autoritat i catàleg de skills. Fallen verificació de LEDGER (sense signatura), segell de skills (hash divergent), Wiki (enllaços que el compilador estricte no resol) i SCC (acta 260923_0035 òrfena). El missatge del compilador inclou `00_index_escriptori`, encara que el fitxer existeix: es registra el resultat de la comprovació, no s’afirma que s’haja esborrat físicament.

A més, el registre del torn queda `context_loaded`: no té pla formal vinculat ni relleu al LEDGER; el pla compartit de MarIA no té el rebut persistent que exigix la validació quan es modifica. L’aportació s’hi ha afegit amb autorització explícita del protocol de l’Olivera, però **açò no equival a una validació documental del pla**. No s’ha reescrit ni importat el pla de MarIA com si fora propi, ni resegellat el cervell per convertir el tancament en verd. No són errors de compilació del producte. Cal regularitzar estos punts en la consolidació documental; el torn no es declara segellat.

Comparació amb l’inventari del torn i amb les empremtes de redacció: zero fitxers de codi modificats en `src/`, `tooling/`, `tests/`, `scripts/` i `supabase/` entre els talls comprovats.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

No s’ha modificat codi de producte, proves, configuració d’execució ni SQL. Només entrega documental, ancoratge, aportació al pla i estat del torn. No s’ha executat build, migració, login, creació/edició/publicació real de notes ni cap petició d’escriptura a Sollutia/Supabase.

La inspecció al navegador és anònima. Les curses s’han demostrat amb dobles aïllats o deduït dels callbacks indicats, no amb comptes reals. Les polítiques SQL s’han llegit i passat pel tractor, però no s’ha inspeccionat el catàleg de la BD desplegada. Les proves amb dos tenants/usuaris, múltiples pestanyes, navegadors i fallades reals de xarxa queden especificades per a la fase de verificació del pla.

Açò és una auditoria exhaustiva de l’abast inspeccionat, no una prova matemàtica que no hi haja altres defectes. No s’emet certificat de salut global ni es dona per consensuat el pla. Acta Marmota de final de jornada pendent; este document conserva el relleu tècnic de l’auditoria.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1245_prompt_auditoria_codex]]
- [[260923_1245_pla_implementacio_auditoria]]
- [[260923_1235_auditoria_tractors_visuals]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
