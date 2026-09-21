---
type: informe
status: esborrany
description: Validació creuada de Claude i revisió del Workspace: integritat, capçaleres, radis, desacoblament i UX de notes.
tags:
  - arquitectura
  - seguretat
---

# Verificació creuada Codex → Claude

**Veredicte: mantinc NO-GO per a dades reals amb les garanties actuals. A1 i C2 són aportacions de Claude que cal incorporar immediatament. B1 i A4 contenen defectes reals, però part de les seues cadenes causals és incorrecta.** El pla de xoc ha de conservar els defectes demostrats i retirar les conseqüències no provades; repetir-les entre dos informes no les convertix en evidència.

He llegit íntegrament l'informe de Claude i l'`implementation_plan.md` disponible. Este document ja existia en començar esta ampliació; només he modificat este informe, preservant la verificació anterior. No he modificat el pla, el codi, els índexs, ESTAT ni els informes anteriors; no he fet xarxa ni executat la cadena de portes o builds. El nom 0120 és el sol·licitat, no una afirmació sobre l'hora exacta d'execució.

## 1. Tall i mètode

HEAD observat: `c5deb0e7`, amb canvis locals. Els fitxers font crítics s'han rellegit; els informes previs no s'han usat com a substitut del codi. Les sondes són Node/VM en memòria i processos locals de lectura, sense crear tests ni tocar IndexedDB real. No s'ha repetit Vitest: els 61/61 són el resultat declarat per Claude, no una certificació nova meua.

Empremtes SHA-256 del tall llegit:

| Fitxer | SHA-256 |
| --- | --- |
| `src/sections/notes/GlobalSaveManager.js` | `6a9e5fd0805c2141a359e41c252b090815892d6f32922a84339a1a156d9b9d34` |
| `src/sections/notes/NotesDataContext.jsx` | `d52fd403dcc27c786ee73e12ce4889dad39426f7fc8ae8c63003b6811ad20b40` |
| `src/sections/notes/NotesContext.jsx` | `c469d96c1117d2580caa67c09b41c6f6d071a62d5b53c4e88bd82c2cbce5f85f` |
| `src/components/universal/richText/useUniversalRichText.js` | `24f47938b55055d49e2c86eeafd34c3898535e289c2c10934552c900f9e6ed41` |
| `tooling/gates/verificador-scc.mjs` | `6918987cc347f3ec21ad766e3ec60136b9b523712f5c75e6c64140fd74e6dbf4` |
| `tooling/lib/arrel.mjs` | `fa5f6597ee861434d866f36a0093cfcc1618e27580e266a9e0cbdf17033627f1` |
| `_wiki_de_poble/04_escriptori/implementation_plan.md` | `fc15f577713a6c11b56852672d5b1dec4c8b099847534b2b74777ce748cfdeb4` |

El recompte local d'esta ronda és 113 Markdown, 18 dins de l'escriptori. Claude comptava 111 i jo 119 en l'altra ronda: hi ha documents concurrents i eliminacions al working tree. Cap d'estes xifres és una invariant del producte. Un arbre amb canvis es pot auditar; cal identificar el tall. No és obligatori fer commit o netejar-lo per obtindre conclusions de codi vàlides.

## 2. A1: aprovat, bloquejant i omissió del meu primer informe

**Fonts:** `src/app/contexts/IdentitatContext.jsx:36`; `NotesDataContext.jsx:27,73-80`; `GlobalSaveManager.js:55-64`; `NotesDataContext.test.jsx:22-23`.

actorKey real és `persona::id` o `entitat::id`. scopeKey l'incorpora literalment. El lector pren `split(':')[1]`: el segment entre els dos punts consecutius és buit.

He executat el lector real de GlobalSaveManager en una VM amb un magatzem simulat que contenia dos registres diferents:

```text
supabase_persona::abc-123_global:note-1 → content=u
supabase_persona::abc-123_global:note-2 → content=dos
getDraftsForScope(...) → { "": { "content": "dos" } }
```

No sols no recupera les notes per ID: diversos resultats col·lisionen en la mateixa propietat buida. El mock `actorKey: 'user'` del test no reproduïx el contracte real. És una aportació nova i important de Claude que jo no vaig detectar en F03.

**Precisió necessària:** els registres físics poden continuar en IndexedDB. A1 inutilitza la recuperació per la UI; no prova que els bytes s'hagen esborrat. «El gestor no protegeix res» és massa absolut: pot desar al servidor i encara pot existir una còpia rescatable. El que falla sistemàticament amb les claus normals és la lectura útil dels drafts.

**Incorporació al pla:** recuperar registres antics sense destruir-los; amb el format actual, llevar el prefix exacte `${scopeKey}:` és més robust que lastIndexOf si un adaptador futur permet IDs amb dos punts. Un format estructurat amb scope i noteId és preferible per al contracte durador, però requerix compatibilitat/migració. No afegir `#seq` al final de la clau sense adaptar el lector: es recuperaria un ID diferent del de la nota.

**Prova d'acceptació:** dos usuaris, dos tenants, diversos noteId i actorKey real; cada registre es recupera una sola vegada al seu àmbit i amb la seua revisió base.

## 3. B1: desmuntatge confirmat; bucle infinit de 409 no demostrat

**Fonts:** `NotesDataContext.jsx:14-21,128-140,189-200`; `NotesContext.jsx:61-81,170-183`; `UniversalWorkspace.jsx:545-548`; `useUniversalRichText.js:21-24,36-47,98-108`.

Aprove la primera meitat: en loading, el provider retorna BUIT, notes és una llista buida i UniversalWorkspace substituïx l'editor per un paràgraf. El desmuntatge elimina la instància de l'editor i no hi ha restauració explícita de cursor/selecció. Cal conservar la vista durant una revalidació del mateix scope.

**No aprove la seqüència «escriure durant loading → PATCH revision=0 → 409 → recàrrega infinita» com a reproducció del camí actual:**

1. Quan el render de loading s'ha aplicat, l'editor ja no està disponible per a escriure-hi.
2. El fill desmuntat no rep necessàriament les props del render de loading: el cleanup pot executar el callback del darrer render muntat, amb rawNotes i l'adaptador anteriors.
3. Si s'invocara el callback nou derivat de BUIT, també canviaria updateNoteContext: és `async () => {}`, no l'adaptador HTTP. Retorna undefined; GlobalSaveManager falla en llegir savedNote.revision i entra en error ordinari. Açò no produïx el PATCH=0 narrat.
4. El timeout real tampoc dispara actualment eixa recàrrega: B2 explica precisament que la detecció per missatge no l'encerta.

Un PATCH amb revisió zero és possible en altres camins sense revisió base vàlida. Això no prova ni un bucle ni una escriptura interactiva sobre un editor desmuntat. Cal una prova d'integració React amb esdeveniments ordenats abans d'atribuir-li eixa conseqüència.

**Implicació addicional:** BUIT omet scopeKey. NotesContext passa temporalment a `sdp_notes_drafts`, i el seu efecte recarrega overrides d'eixa clau. La recàrrega no sols amaga dades: altera el namespace dels overrides, i content no es guarda en sessionStorage. És una altra raó per a conservar scope i estat local durant refrescos del mateix usuari. S'ha identificat per lectura; no s'ha reproduït el conjunt de l'efecte en navegador.

**Condició de seguretat del remei:** mantindre payload durant refresh només si identitat, backend i tenant continuen sent els mateixos. Fer-ho indiscriminadament en logout/canvi de tenant pot mostrar dades de l'usuari anterior. Un nou estat revalidating no basta si el provider continua retornant BUIT per a tot status diferent de ready.

## 4. A4: recurs mal gestionat, però mecanisme descrit incorrectament

**Font:** `GlobalSaveManager.js:8-27,47-75`; `NotesDataContext.jsx:60-63`.

Aprove connexió compartida o tancament controlat, onversionchange, tractament d'abort/error i visibilitat de fallades. No hi ha prova de consum de heap creixent mesurat: «memory leak» no ha de substituir el defecte concret de gestió de connexions.

**Correcció:** una obertura bloquejada per connexions antigues no té per què rebutjar la promesa ni passar pel catch. Sense onblocked pot quedar pendent. Un mock d'open que no emet success/error deixa getDB pendent. Si li passa a getDraftsForScope, el Promise.all de càrrega també queda pendent encara que la lectura de xarxa haja acabat correctament. Si la branca de xarxa rebutja, Promise.all sí que rebutja; el bloqueig no és inevitable en totes les combinacions. No és «fallar tancat en silenci»; és possible bloqueig de progrés.

**Segon defecte latent:** onupgradeneeded executa createObjectStore('drafts') incondicionalment. Quan una v1 existent passe a v2, tornar a crear el mateix store provoca un error i avorta l'upgrade. Tancar connexions no resol açò. La migració ha de mirar oldVersion/esquema i preservar els registres. És lectura del codi i del flux d'upgrade; no una migració real executada.

**Correcció de freqüència:** no totes les tecles arriben immediatament a IndexedDB. DocumentEditor i UniversalEditorShell tenen un debounce de 800 ms abans de cridar el gestor. La connexió s'obri per operació del gestor, no necessàriament per tecla.

## 5. Matriu de la resta de Claude

| ID | Veredicte creuat | Precisió i acció |
| --- | --- | --- |
| A2 | Confirmat, bloquejant | Coincidix amb F01. ACK antic i error antic poden destruir/sobreescriure estat nou. Seqüència per generació i eliminació condicional transaccional; Date.now no és un identificador únic ni ordenació fiable entre pestanyes. |
| A3 | Confirmat en absència de reintent automàtic | «Només recarregar recupera» és inexacte: tornar a editar el mateix camp inicia una altra escriptura. Recarregar, fins i tot arreglat A1, només fusiona, no envia. El toast existix: no tot error és silenciós. |
| A5 | Risc de privacitat confirmat, política pendent | El Web Component usa Shadow DOM (`PedraSecaEmbed.jsx:297,340`), no un origen separat. Scripts del mateix origen poden accedir a IDB; el scope no és una frontera de seguretat. No hi ha TTL/purga pròpia. «Per sempre» significa retenció sense límit de l'app, no immunitat davant neteja/evicció. No s'ha demostrat exfiltració. |
| A6 | Confirmat, amb error de signe | Fusió visual sense reenviament i comparació entre rellotges són defectes. Però un rellotge CLIENT avançat fa menys probable descartar el draft; client endarrerit o servidor avançat provoca el descart fals descrit. |
| A7 | Confirmat en allò essencial | Imports morts i revisió retinguda són visibles. knownRevisions no és només higiene: preval sobre revisions remotes més noves i pot provocar conflictes (F07). No s'ha verificat ací la totalitat dels mocks/tests del repositori. |
| B2 | Confirmat | ErrorSupabase de xarxa no coincidix amb TypeError/fetch/network; TimeoutError tampoc amb includes('timeout'). Un TypeError de programació pot ser tractat com a xarxa, encara que l'error inicial sense payload no sempre queda ocult. |
| B3 | Risc confirmat, resposta HTTP condicionada | Notes seed sense revision no tenen un contracte d'edició vàlid. Però n1 no és UUID: sobre la columna UUID, un servidor pot rebutjar-lo per format abans del 404 de verificació. No assegurar «sempre 404». n1 amb activeNote no té un bloqueig d'edició explícit en NotesEditor. |
| C1 | Confirmat | La CLI usa una propietat inexistent. Falla en roig, no en verd. La frase «13 orfes passant punt» no queda sustentada: el propi informe després registra zero. |
| C2 | Confirmat i més ampli que el meu F10 | path.relative és lèxic també a macOS. En esta ronda hi ha 18 Markdown físics d'escriptori i zero admesos per la condició d'ancoratge. No cal esperar Linux. Rectifique el meu èmfasi anterior, centrat en Linux. |
| C3 | Parcialment aprovat | SCC no detecta tots els enllaços inexistents: ignora els no resolts (`verificador-scc.mjs:172-176`). Un índex buit amb només destins fantasma no faria passar altres fitxers orfes existents automàticament. Arbre brut no equival a informe invàlid; exigeix traçabilitat. |
| C4 | Aprovat amb matís | split('\\n') no compta salts reals; no és literalment sempre 1 si abans hi ha la seqüència barra+n. Basename i exclusions duplicades confirmats. |
| D1 | Confirmat | La causa és Reflect.get sobre string, no que el Proxy siga «no-iterable», com diu el pla. El remei més simple és el contracte de string/arrelSegura, no un altre truc de coerció. |
| D2 | Confirmat per execució | `node tooling/lib/arrel.mjs` retorna 0 sense stdout/stderr en esta ruta amb espais. La guarda no encerta l'URL codificada. «Mai» s'ha de restringir a camins on difereix la representació. |
| D3 | Risc latent confirmat, import no falla | He importat amb argv simulat `--arrel=src`: import complet; arrelSegura llança després. El mòdul captura l'error en carregar. No és una excepció inevitable durant import. Cal separar arrel de projecte i subarrel d'escaneig abans de centralitzar totes les eines. |
| D4 | Confirmat | CAMINS.escriptori manté majúscules incoherents. No és la dependència directa de C2: SCC repetix literalment la ruta en lloc d'usar eixe camp. Cal corregir tots dos punts. |
| E1 | Bloqueig actual aprovat; acusació històrica rebutjada | run-portes ix amb 1 al primer fracàs i el hook invoca gate. Però l'estat actual no demostra com van entrar tres commits anteriors: no hi ha prova de --no-verify, hook instal·lat ni arbre de treball d'aquell moment. No atribuir una evasió de controls sense evidència. |
| E2 | Aprovat | ESLint limita el paquet estàtic, no tot acoblament. Que tractor-enxufe quede després del lint en gate no significa que no es puga executar independentment. |
| E3 | Aprovat com a configuració/higiene | Globals Node+browser oculten usos d'entorn incorrecte. El recompte d'avisos no demostra per si sol que cap persona veja avisos nous. TS sense parser adequat és latent si s'introduïx TypeScript. |

Les correccions anteriors no rebaixen la gravetat de la pèrdua real de drafts. Eviten implantar remeis a partir de mecanismes inventats.

## 6. Taula de latència F1–F7 de Claude

- **F1/F6:** desmuntatge i càrrega completa per 409, sí; edició sobre UI ja desmuntada, timeout com a disparador actual i bucle infinit, no demostrats. Els 300 ms–2 s són exemples, no mesures locals.
- **F2:** creació confirmada abans de seleccionar és acceptable i coherent amb online-first. No cal introduir optimisme només per evitar «CREANT…». Mantindre cancel·lació d'interés de UI separada de cancel·lació d'una operació que pot haver arribat al servidor.
- **F3:** límit de 50 i filtratge de submissions després del límit, confirmats. El draft de la nota absent no es fusiona; esta funció no l'esborra físicament. Afegir paginació sense canviar el criteri de «element desaparegut» pot trencar selecció/reconciliació.
- **F4:** risc de fusió de fonts, confirmat però condicionat. Amb timestamps correctes, una submission estrictament més antiga NO sobreescriu la fila. He executat mergeById real en VM: la fila guanya. En empat temporal, una submission sense revision sobreescriu content i conserva revision=4 heretada de la fila. Això pot produir contingut que sembla versionat però no correspon a eixa revisió. Cal separar procedència i triar una font autoritativa per a notes editables (`mapejadorSeccions.js:139-160`).
- **F5:** NotesSection remapeja títols/extractes de tota la llista quan notes canvia (`NotesSection.jsx:29-45,94`). NotesContext sí que reutilitza parsedNotesCache per a notes no alterades (`NotesContext.jsx:148-150`). O(n) de recorregut és cert; parsejar tot el contingut de totes les notes a cada tecla no ho és. No hi ha benchmark a 500 notes.
- **F7:** afegir realtime que invoque refresh amplificaria B1. És una decisió futura, no una conseqüència inevitable de qualsevol subscripció realtime. Convé reconciliació per nota i no reinicialitzar tot l'editor per cada esdeveniment.

## 7. Efectes combinats que el pla ha de resoldre

### 7.1 Arreglar el lector activa altres riscos que ara quedaven amagats

A1 impedix l'ús de la major part de drafts normals; arreglar-lo farà arribar a UI registres antics, potencialment obsolets o conflictius. Si no s'arreglen junts F02/F03/A6, semblaran confirmats i una edició d'un altre camp podrà eliminar-los. No fer purga per «netejar» abans d'haver preservat i classificat els pendents.

### 7.2 Hi ha una finestra de pèrdua abans del gestor

`useUniversalRichText.js:53-61` guarda el canvi en refs i crida onChange immediatament, però onSave espera 800 ms. DocumentEditor connecta onChange a estat local i onSave a GlobalSaveManager (`DocumentEditor.jsx:111-136`). UniversalEditorShell aplica el mateix patró als camps (`:96-104`). Només després el gestor inicia el put d'IDB i el seu debounce de xarxa de 600 ms.

Per tant, un crash abans del primer flush pot perdre el contingut encara que arreglem A1/A2. pagehide/visibilitychange/unmount intenten fer flush (`useUniversalRichText.js:89-108`), però no són una garantia davant mort abrupta ni esperen el commit d'IDB. Ni Claude ni el meu primer informe havíem delimitat prou esta finestra. Cal separar persistència local primerenca de debounce de xarxa, i declarar quan una edició és durable. No prometre zero pèrdua només perquè existeix un listener de pagehide.

### 7.3 Revalidar sense desmuntar no pot retenir dades d'una altra sessió

B1 i F04 s'han de corregir com un sol contracte: payload continu en refresc del mateix scope; neteja de visibilitat immediata en canvi d'identitat; tasques antigues suspeses/invalidades per generació. Un ref mutable que sempre retorna «la nota actual» també pot llegir el scope equivocat si no es valida la generació.

### 7.4 Reintentar no és sempre repetir un PATCH

Després d'un timeout el servidor pot haver aplicat el canvi. Un reintent amb revisió vella pot generar 409; pujar la revisió cegament pot sobreescriure una edició aliena. Cal distingir resultat incert, conflicte real i error abans d'enviament, i usar una identitat estable de l'operació quan calga idempotència. Retindre el draft sempre fins a confirmació reconciliada.

Les conclusions positives de Claude sobre locks són locals: serialitzen autosaves que resolen normalment dins d'una instància. No cobrixen dues pestanyes, publishNote fora de la cua ni les excepcions que poden deixar consumidors pendents. No eliminen F05/F07.

### 7.5 Privacitat i recuperació poden entrar en conflicte

El pla proposa purga automàtica en logout i TTL. Açò pot destruir l'única còpia que A1/A2 deixaven pendent. «Cancel·lar l'enviament» i «esborrar la còpia» són accions diferents. Cal una política explícita: què es conserva, què es pot exportar, quan es descarta amb coneixement de l'usuari i què es permet en un host compartit. Xifrar amb una clau igualment accessible als scripts de l'origen no crea una frontera contra eixos scripts.

`requires_human_decision: true` per a retenció de dades privades/logout i persistència en mode incrustat. Esta auditoria no autoritza purgues.

### 7.6 Una transacció SQL no engloba la promoció de fitxers automàticament

Publicar implica també possibles promoteToPublic previs (`NotesContext.jsx:193-220`). Una RPC pot confirmar nota+publicació de manera atòmica a Postgres, però no convertix automàticament la còpia externa de fitxers en part de la mateixa transacció. El pla ha de considerar promocions parcials, identificador estable de publicació i recuperació/neteja posterior. Després d'un timeout, l'usuari no ha de crear una segona publicació amb un UUID nou.

### 7.7 Fer totes les portes no és una operació de lectura

`tractor-build-previ.mjs:95-102` pot executar npm run build. Canviar run-portes perquè continue sempre després de qualsevol error pot activar mutacions sobre un arbre incoherent. Recomane mode de diagnòstic agregat per a comprovacions independents i segures, amb fallada final no-zero, i precondicions explícites per a passos dependents o que escriuen. No relaxar eol-last per aconseguir verd artificial: els salts de línia es poden corregir quan s'autoritze implementar.

## 8. Ajustos concrets que recomane a implementation_plan.md

No els he aplicat; esta és la revisió del pla llegit.

1. **Mantindre A1/F01/F02/F03 units:** format de clau compatible, versió base, operació/generació única, restauració pendent i eliminació condicional. No adoptar timestamp com a única protecció; una seqüència local també necessita identitat de pestanya/operació per evitar col·lisions.
2. **Retirar «bucles infinits de 409 falsos» de B1** fins que hi haja reproducció. Incorporar BUIT sense scope, callback no-op, conservació de payload i límit de sessió. Afegir prova d'un desat pendent durant refresh, no una prova que assumisca el resultat.
3. **Completar A4:** onblocked, onversionchange, onabort, transaccions que rebutgen i upgrade v1→v2 amb store existent. No descriure tot com a memory leak.
4. **Substituir purga obligatòria per política pendent:** suspendre cues en canvi de sessió sense destruir pendents. TTL no ha de ser un esborrat silenciós de contingut no confirmat.
5. **Afegir persistència abans del debounce d'editor**, o declarar clarament la finestra tolerada. El doble debounce actual no és protecció immediata.
6. **Publicació:** transacció del canvi relacional, idempotència estable, coordinació amb autosave i tractament de fitxers/promocions parcials.
7. **Dades:** paginació, filtratge remot, model de carpetes, notes seed editables o de lectura i migració dels llegats de submissions/app_content. Afegir prova d'empat de timestamps amb revision conservada incorrectament.
8. **SCC:** corregir l'ancoratge també a macOS, detectar lectura incompleta i enllaços trencats segons contracte. Un crash ja està retornant no-zero; no incloure «potser verd si capturat» sense un consumidor que ho demostre.
9. **Arrel:** corregir Reflect.get sobre primitiu, guarda CLI amb espais i semàntica de --arrel per eina. Corregir CAMINS i els literals repetits.
10. **Proves:** els mocks han de reproduir actorKey real, errors normalitzats i revisions del servidor. Afegir oracles de contingut recuperable i estat visible, no sols nombre de crides.

## 9. Abast pragmàtic: no cal convertir-ho en una plataforma offline

Claude cita contingencia_offline §3 com si fora una obligació vigent. El fitxer es declara proposta futura, «vetada actualment», i conté referències a PWA/Dexie que no acrediten l'estat actual. L'ADR online-first rebutja una garantia de reconciliació offline i exigix migrar dades locals abans de retirar-les. No hi ha base per imposar CRDT, background sync o una plataforma offline completa.

Entre «outbox total» i «eliminar IndexedDB» hi ha una opció proporcionada: buffer local de recuperació amb estat explícit, restauració segura, reintent manual o limitat dins de sessió autoritzada i conflictes conservats. És compatible amb servidor com a font de veritat. La decisió de producte és quin compromís de recuperació s'oferix; no es pot anunciar cap garantia que el codi no complisca.

## 10. Criteris de tancament del pla de xoc

| Àmbit | Evidència necessària |
| --- | --- |
| Recuperació | Claus persona::/entitat:: reals, múltiples notes i lectura compatible de registres antics. |
| Durabilitat | Crash/recàrrega abans i després del debounce; ACK antic mai elimina generació nova; errors IDB visibles. |
| Concurrència | Dues pestanyes, timeout després de commit, 409, canvis de camps diferents i revisió remota més nova. |
| Sessió | Refresh conserva editor del mateix scope; logout/canvi de tenant no envia amb credencials noves ni exposa dades antigues. |
| Upgrade | v1 poblada→v2, altra pestanya oberta, blocked, abort i recuperació sense purga. |
| Publicació | Autosave concurrent, resposta perduda i reintent generen una única publicació vinculada; promoció parcial recuperable. |
| Dades | Més de 50 notes, seed no editable o migrat, igualtat temporal entre fonts i eliminació remota. |
| Portes | CLI normal, noms amb espais, macOS/Linux, índex absent, enllaç trencat i error d'escaneig donen resultats honestos. |

**Conclusió de verificació:** Claude aporta dos descobriments prioritaris que amplien el meu diagnòstic —A1 i l'abast macOS de C2— i reforça diversos defectes ja confirmats. Retire del consens el bucle infinit de B1, el catch automàtic d'A4, el signe de rellotge d'A6 i l'acusació de commits forçats. El pla ha d'unificar identitat, durabilitat i confirmació; arreglar cada símptoma per separat pot activar el següent defecte.

## Vincles

- [[260921_0115_INFORME_claude_auditoria_extrema_pre_supabase]]
- [[260921_0110_informe_auditoria_pre_supabase]]
- [[implementation_plan]]
- [[00_index_escriptori]]

L'índex no s'ha modificat: el present informe queda disponible al camí demanat i pendent d'ancoratge per l'agent que tinga autorització sobre l'escriptori.


## 11. Ampliació sol·licitada: arquitectura i aparença del Workspace

**Registre de l’ampliació (21-09-2026):** lectura íntegra de Claude, informe inicial de dotze troballes i informe creuat preexistent; contrast directe de GlobalSaveManager, NotesDataContext, Workspace, adaptador de Notes i CSS. HEAD continua en `c5deb0e7`. Les set empremtes de §1 coincidixen exactament amb els fitxers actuals, inclòs implementation_plan. Les execucions i recomptes de les seccions anteriors són evidència conservada de la ronda anterior, no proves reexecutades en esta ampliació. No he executat navegador, Supabase, migracions, tests ni builds. La revisió visual següent és de JSX/CSS: no certifica els píxels de la sessió oberta ni descarta una versió desplegada diferent.

### W1 · Mitjà · La capçalera està reutilitzada; el contracte visual està fragmentat

**Fonts:** `src/components/universal/workspace/UniversalWorkspace.jsx:229-260,404-431`; `src/components/layout/AppGridColumn.jsx:25-27,79-111`; `src/components/layout/AppGridShell.css:239-267`; `src/css/modules.css:3220-3258`.

CARPETES i NOTES es pinten amb AppGridColumn en variant normal. La fila Tot/engranatge i la fila lupa/CREAR NOTA també són AppGridColumn, amb variant transparent. Per tant, **no hi ha dos components de capçalera independents que calga fusionar**: la reutilització JSX ja existix. El que falla és la semàntica de les variants i la cascada de colors.

La capçalera normal usa un gradient de `--sdp-crom-hover` sobre `--sdp-crom-fons`. La variant transparent declara fons transparent, però `.sdp-bloc .app-grid-col-header--transparent` el substituïx per `--sdp-bloc-capcalera-fons`, definit com `--sdp-pedra-700`. Els acordions també reben eixe color. Són receptes diferents per a superfícies que es volen coherents. El nom transparent ja no descriu el resultat. La fila Tot compartix regla amb la barra d’accions de Notes; no es pot afirmar que tinga exactament el mateix color computat que el títol NOTES sense inspecció visual.

**Solució proposada:** conservar AppGridColumn i donar-li un contracte explícit de capçalera, barra d’accions, acordió i columna plegada. Separar el rol estructural del to visual. Usar un únic token semàntic de superfície de capçalera, text i vora en les files que el Mestre vol iguals; retirar els overrides redundants de la pell Notes després de migrar-los. No introduir una NotesHeader duplicada ni una segona implementació de botons. AppGridColumn també genera un bloc de títol buit quan només rep accions: es pot ometre eixe node quan no té títol, icona ni plegat, conservant l’alineació amb la disposició d’accions.

**Acceptació:** CARPETES, Tot, NOTES i la seua barra d’accions compartixen els tokens acordats; acordions i columnes plegades mantenen contrast i focus; comparar ample, mitjà, estret i temes clar/fosc. Comprovar també Disseny perquè usa l’estructura comuna.

### W2 · Mitjà · Les pastilles tenen selectors concrets; no tots els actius són circulars

**Fonts i inventari:**

| Element | Origen del radi actual | Correcció proposada |
| --- | --- | --- |
| Tot, actiu i inactiu | `src/css/modules.css:3284`, accio-text de sdp-bloc | `--sdp-radi-m` en tots els estats |
| CREAR NOTA i accions primàries de capçalera | `src/components/layout/AppGridShell.css:417` | token compartit de control rectangular, basat en radi-m |
| Accions de l’editor, com publicar | `src/css/modules.css:3433`, sdp-bloc-action | mateix criteri de radi-m |
| Filtres d’etiquetes genèrics | `src/css/modules.css:242` | radi-m si entren en l’estàndard rectangular; Notes els desactiva amb tagFilter=false |
| Carpetes/categories/etiquetes de navegació | `src/css/modules.css:278` | ja usen radi-s; no són pastilles |
| Targetes de notes | `src/css/modules.css:3326` | radi 0 actual; acordar radi-m per a la targeta explícita |

`src/css/tokens.css:141,144` fixa radi-m en 12px i radi-pastilla en 999px. La forma no la provoca aria-pressed: el radi ja està en la regla base. Canviar només el selector actiu deixaria un control que canvia de forma en seleccionar-lo.

**No redefinir globalment radi-pastilla:** altres components, com interruptors i indicadors, l’usen amb una funció legítima. Substituir els usos dels controls afectats o introduir un token semàntic de radi de control. Mantindre mida tàctil, focus i contrast. La petició del Mestre determina ací l’estàndard rectangular; no cal una aprovació addicional per a documentar esta proposta.

### W3 · Arquitectura · Agnòstic de Notes, però amb un contracte de llista concret

**Fonts:** `UniversalWorkspace.jsx:1-6,57-102,304-305,348-372,473-530`; `WorkspaceContext.jsx:27-66,129-176`; `workspaceState.js:168-190`; `NotesSection.jsx:29-49,124-159`.

La frontera principal és correcta: UniversalWorkspace no importa NotesContext, Supabase, NotesEditor, seed de notes ni router. Rep model, labels, icons, onCreate, renderItem i renderDetail. NotesSection adapta carpetes, categories, URL, creació i detall. `item.data` és opac per al nucli. Una Gestoria que expose categories, elements i detall pot usar-lo sense afegir cap condicional de negoci al Workspace.

**La frase «qualsevol mòdul sense tocar el Workspace» té límits reals:** el nucli imposa tres columnes, selecció única, categories planes, etiquetes i cerca local sobre items carregats. Els grups no són un arbre de carpetes recursiu. No hi ha un contracte de paginació/cerca remota, targeta de creació ni estat de revalidació amb dades conservades. La icona per defecte depén de noms de grup (`categories`, `tags`); és una convenció genèrica, però injectar icon en cada grup evita dependre d’eixos noms. La creació pressuposa que el consumidor acabarà incorporant created.id a model.items: retornar un objecte, sense actualitzar model, deixa pendingItemId esperant.

**Solució proporcionada:** documentar el model existent i les obligacions dels adaptadors; afegir punts d’extensió genèrics per a necessitats demostrades, sense imports de dominis. Per a esta petició basta un slot opcional de creació i un contracte loading/revalidating/error que conserve el detall quan toca. Si arriba paginació, distingir «no està en esta pàgina» de «ha sigut eliminat», perquè la reconciliació actual tracta l’absència del mapa com desaparició. La cerca remota requerirà mode controlat o delegació de filtres; no aplicar a cegues el filtre local sobre una pàgina incompleta.

**Prova arquitectònica proposada:** muntar un adaptador de Gestoria mínim amb factures i un de Disseny amb peces, només injectant props; comprovar creació, selecció, error, URL gestionada pel consumidor i navegació responsive. Cap nom de nota, factura, tenant o proveïdor dins del nucli. No cal construir ara estos mòduls per a completar l’auditoria.

### W4 · Mitjà · La card de creació falta; la miniatura ja existix però té cobertura limitada

**Fonts:** `NotesSection.jsx:29-49,124-159`; `src/sections/notes/NotaFitxa.jsx:8-54`; `UniversalWorkspace.jsx:348-372,473-496`; `src/data/supabase/notes.js:5-8,40`; `src/sections/notes/NotesContext.jsx:159`; `src/hooks/useResolvedAsset.js:12-48`; `src/css/modules.css:3322-3376`.

**Creació:** el llistat només recorre filteredItems. El botó CREAR NOTA està en la barra, però no hi ha una targeta de creació en el cos, i renderItem només es crida per a elements existents. Afegir-la únicament a renderNota no resol una llista buida.

Propose un slot opcional **nou**, per exemple renderCreateCard, rebut per UniversalWorkspace i propagat fins a ItemListColumn. El slot ha de rebre onCreate apuntant a createAndSelect, creating i disabled; el mateix estat i la mateixa gestió d’errors han de servir al botó i a la targeta. NotesSection injectaria una NotaCreateCard de domini. Mostrar-la també quan no hi ha notes o els filtres no donen resultats, si la creació està permesa. No inventar una nota amb id especial dins de model.items: contaminaria cerca, recompte, selecció i persistència. La targeta ha de ser un botó accessible i no contindre botons ni enllaços interactius niats.

**Títols:** toWorkspaceNote transforma el títol a text i cau a Sense títol. L’adaptador crea notes amb title buit per defecte. No he consultat dades de l’usuari, així que no puc afirmar que tots els Sense títol siguen correctes ni que siguen un problema de renderitzat. Proposta: separar title persistent de displayTitle; visualitzar títol explícit → primera línia útil del contingut → Nota nova/Sense títol amb data contextual. El títol derivat no s’ha d’enviar automàticament al servidor ni fer-se passar per una correcció de dades. Reutilitzar el text ja normalitzat i limitar la llargària.

**Miniatures:** renderItem ja és renderNota i pinta NotaFitxa, que inclou NotaMiniatura. item.image prové de coverImage/heroImage; NotesContext deriva coverImage de heroImage. No es busca una primera imatge del cos, i si no hi ha URL resolta apareix una inicial: moltes notes Sense títol acaben amb la mateixa S. Per tant, la manca és de representativitat i fallback, no d’absència del component.

Proposta: preparar a l’adaptador Notes una referència de miniatura amb prioritat portada → primera imatge vàlida del contingut estructurat → icona de document amb extracte. Resoldre-la amb useResolvedAsset, sense fer que UniversalWorkspace conega Storage o sdp-media. NotaMiniatura necessita fallback d’error de càrrega d’imatge: ara src resolt però img trencada no torna a la inicial. El hook no renova una URL signada pel mer pas del temps ni buida immediatament la URL antiga mentre resol una nova referència asíncrona; documentar i tractar estos estats en ampliar-ne l’ús. No publicar fitxers privats per fabricar miniatures ni persistir URL signades com a identitat de l’actiu.

**Aspecte de card:** hi ha una targeta funcional, però la pell la força a border-radius:0 i aparença de fila. Per fer-la explícita, usar separació entre targetes, radi-m i vora/superfície coherents, mantenint la miniatura de mida reservada, el títol llegible, la data i dos línies d’extracte. No duplicar DefaultItemCard: mantindre NotaFitxa injectada perquè el tractament de mitjans privats pertany a Notes.

## 12. Efectes papallona entre UX i integritat

1. **Títol derivat i miniatura poden fer semblar sana una nota no desada.** Incorporar a NotaFitxa un estat pendent/desant/error/conflicte procedent de la capa de dades; no deduir confirmació del simple fet que hi haja contingut visible.
2. **Dos punts de creació poden duplicar operacions.** Compartir createAndSelect i l’estat creating; provar clics ràpids entre botó i targeta. Si cal idempotència remota, correspon a l’adaptador, no a un segon handler de card.
3. **Revalidació contínua i URLs privades exigixen límit de sessió.** Conservar editor/miniatura en el mateix scope, però invalidar-los quan canvia l’actor o tenant. La millora visual de B1 no ha d’exposar dades anteriors.
4. **Paginació i miniatures multipliquen treball.** Eliminar el límit 50 sense mesurar pot afegir resolucions de mitjans per cada card: loading=lazy de img no ajorna per si mateix l’efecte del hook. Mesurar abans d’afegir virtualització; considerar resolució per visibilitat i memòria cau vinculada a sessió/caducitat.
5. **CSS compartit amplia l’abast de qualsevol correcció.** Corregir el radi de AppGridColumn afectarà altres consumidors; conservar una sola recepta i comprovar-los. Els canvis de dades han de continuar sent bloquejants encara que les captures visuals ja siguen bones.

## 13. Incorporació recomanada al pla, sense editar-lo

A les deu correccions de §8 cal afegir W1–W4 com una fase explícita de Workspace: tokens de capçalera unificats; radis rectangulars als selectors identificats; slot de creació genèric; millora de displayTitle, miniatura i estat de desat en NotaFitxa. Prioritzar primer la supervivència de drafts, identitat i conflictes; després integrar la UX sense amagar eixos estats.

Criteris visuals: notes amb títol buit però cos ple, nota completament buida, portada privada, URL expirada o trencada, llista buida i filtrada, doble creació, selecció amb teclat, focus visible, tres amplàries i dos temes. Criteris de dades: els de §10, especialment refresh amb escriptura pendent i canvi de sessió. **Són proves pendents per a la implementació; esta ampliació no declara que hagen passat.**

S’ha respectat la contenció: únicament este informe s’ha actualitzat. No s’han tocat implementation_plan, codi, índex, ESTAT ni LEDGER, ni executat tancament amb possibles escriptures. L’Escriptori és `_wiki_de_poble/04_escriptori/`, segons la regla local; no el Desktop de macOS.
