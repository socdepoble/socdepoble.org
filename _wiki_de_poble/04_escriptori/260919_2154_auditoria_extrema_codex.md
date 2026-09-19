---
type: informe
status: esborrany
description: Auditoria del nucli, privacitat, desat i càrrega teòrica de 10.000 usuaris, amb evidències locals i pla de resiliència.
tags:
  - arquitectura
  - seguretat
---

# Auditoria extrema — arquitectura, resiliència i 10.000 usuaris

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-260919-EXTREMA-CODEX |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 21:54 |
| Agent redactor | Codex |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |
| Entrada | 260919_2136_PROMPT_auditoria_extrema.md i arbre local del projecte |
| Revisió Git de referència | 214f5c7c65bdc011c2d7e2f93f73d50438f9fa21, amb canvis locals previs |
| Arrel de totes les cites | /Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org |

Vincles: [[00_index_escriptori]] · [[260919_2136_PROMPT_auditoria_extrema]].

## 1. Resposta al Mestre

**La base és aprofitable, però encara no és una base que jo declararia preparada per a una obertura massiva. La nota global és 4,5/10.** És una valoració professional de la resiliència observada, no una mesura de rendiment ni un percentatge de probabilitat d'èxit.

Sí que convé canviar fonaments ara: la propietat de l'estat per usuari i poble, el protocol de desat i publicació, i el contracte entre mòduls. Hi ha defectes que afecten la privacitat i la integritat amb dos usuaris o dues sessions; no cal arribar als 10.000 per patir-los. Les troballes F01–F09 en donen les evidències.

No recomane esborrar el projecte ni migrar de framework per intuïció. Ja hi ha peces valuoses: port de backend, separació d'adaptadors, components compartits del Sistema de Disseny Pedra Seca, revisions de notes i polítiques d'accés a la base de dades. El problema és que algunes garanties només existixen en un tros del recorregut: una resposta pot estar ben filtrada al servidor i acabar mesclada amb dades antigues al client. Fonts: `src/data/backendPort.js:8–55`, `src/data/contracte.js:2–64`, `src/components/universal/DocumentEditor.jsx:13–77`, `src/sections/notes/NotesDataContext.jsx:37–70`, `supabase/migrations/260914_0000_schema_notes.sql:25–86`.

Una base literalment immutable, que mai necessite canviar i mai es trenque, no és una garantia realista. L'objectiu útil és un **nucli menut amb contractes estables, versions, migracions i proves de compatibilitat**. La implementació ha de poder corregir-se sense obligar a reescriure tots els mòduls. Congelar un objecte JavaScript no acredita eixa propietat; el pany actual evita reinjeccions del backend, però no valida el significat de les operacions ni les seues respostes (`src/data/backendPort.js:8–55`).

**Veredicte:** no certificaria hui ni privacitat completa entre contextos, ni absència de pèrdues de desat, ni capacitat per a 10.000 usuaris simultanis. Tampoc afirme que el servidor haja de caure: no se n'han mesurat capacitat, quotes, plans SQL o infraestructura.

## 2. Mètode, límits i significat de les evidències

- **[REPRODUÏT LOCALMENT]**: execució del codi real importat, amb serveis substituïts per dobles controlats i dades fictícies. No és una prova contra Supabase desplegat.
- **[LECTURA DE CODI]**: recorregut concret sustentat per les línies citades. Quan depén d'una migració, només acredita el SQL disponible, no que estiga aplicat.
- **[SUPÒSIT]**: condició d'un escenari de càrrega o d'una conseqüència no mesurada.
- **[PROPOSTA]**: arquitectura o criteri d'acceptació futur; no és codi existent ni una implementació aplicada.

S'han examinat els camins de muntatge, estat global, identitat i sessió, Notes/editor/desat, Mur, Xat, transport REST/SDK, mitjans, contractes, migracions i portes locals. La cerca de CRDTs i persistència s'ha fet sobre fonts executables, distingint-les de comentaris i textos de producte. No és una lectura exhaustiva de totes les línies del repositori ni una certificació de seguretat.

No s'ha usat cerca web, navegador, cap servei extern, dades reals d'usuaris ni credencials privades. Els diagnòstics de contextos han utilitzat Preact i jsdom en memòria; jsdom ha simulat el DOM, sense obrir un navegador. No s'han fet peticions de càrrega reals, migracions, builds, commits o desplegaments.

No s'ha modificat codi ni s'han generat pegats aplicables. L'única eixida nova dins del projecte és aquest Markdown. Les normes locals de tancament no s'han usat per ampliar l'encàrrec: `tancament.mjs` executa una sincronització que escriu documentació (`tooling/gates/tancament.mjs:18–23`); tampoc s'han reescrit ESTAT, índexs o espills. L'ancoratge d'entrada des de l'índex queda per a IAIA MarIA.

## 3. Quina arquitectura hi ha realment

La cadena principal és: amfitrió/configuració → sessió i identitat → contextos de contingut → seccions i editor → port → adaptador Supabase → REST, RPC i Storage. L'aplicació usa imports de React resolts a Preact/compat (`vite.config.js:32–40`); les vistes es carreguen amb `lazy`, però els proveïdors de Core, Mur, Notes, Xat i Multimèdia es munten junts (`src/app/App.jsx:17–47,485–501`; proveïdors de sessió/identitat a `src/PedraSecaEmbed.jsx:61–65`).

### CRDTs: no confondre aspiració amb implementació

**No he trobat un motor CRDT actiu en el recorregut auditat.** Les dependències declarades no inclouen Yjs o Automerge (`package.json:85–114`); l'editor usa StarterKit i les extensions d'imatge/menú (`src/components/universal/richText/useUniversalRichText.js:1–3,29–31`; `src/components/universal/richText/extensions/index.js:141–149`). El desat envia camps HTML mitjançant PATCH amb una revisió esperada, incrementada al servidor (`src/data/supabase/notes.js:47–67`; `supabase/migrations/260914_0100_auditoria_rls_fixes.sql:111–121`). Això és control optimista de concurrència; no és fusió CRDT.

La cerca local de `crdt|yjs|automerge|indexeddb|outbox|broadcastchannel` sobre JS/JSX ha retornat sobretot prosa/comentaris i el pont de dispositius. Eixe pont crea un `BroadcastChannel` i missatges de presència; no implementa sincronització distribuïda de documents (`src/sections/dispositius/devicesRuntime.js:106–117,178–205`). Aquesta cerca no prova l'absència universal de qualsevol algoritme equivalent, però el camí real de Notes sí que està identificat.

El requisit vigent diu que el backend és la font de veritat (`requirements/online-first.json:2–5`), coherent amb el camí remot de Notes. Introduir CRDTs ara no arreglaria per si mateix els errors d'identitat, permisos, desat o publicació descrits ací. **[PROPOSTA]** Mantindre el model remot, corregir primer les seues garanties, i estudiar CRDTs només si es decidix oferir edició simultània real d'un mateix document.

### Allò que convé conservar

| Peça observada | Valor i límit |
| --- | --- |
| Port i capacitats | Permeten substituir operacions de backend sense importar l'SDK en cada secció. Falta un contracte semàntic/versionat i un cicle de vida complet. `src/data/backendPort.js:8–55`; `src/data/contracte.js:2–64`. |
| CAS de Notes | El PATCH filtra per revisió i la BD la incrementa. Protegix d'algunes sobreescriptures, però F03 demostra que la recuperació client falla. `src/data/supabase/notes.js:47–67`; `supabase/migrations/260914_0100_auditoria_rls_fixes.sql:111–121`. |
| Cancel·lació de lectures | Core i Notes usen AbortController, generació i comprovació d'activitat. És una base útil, encara que F01/F02 mostren que no cobrix totes les transicions. `src/app/contexts/CoreContentContext.jsx:19–46`; `src/sections/notes/NotesDataContext.jsx:32–85`. |
| Errors de secció | Core degradat ja no bloqueja per si mateix tota la navegació; Xat exposa un avís propi. `src/app/App.jsx:504–520`; `src/sections/xat/XatContext.jsx:177–184`. |
| Proteccions SQL | Notes té índex i RLS per propietari/membre; el Xat té comprovació de participant i limitació de missatges. No s'ha verificat el seu desplegament. `supabase/migrations/260914_0000_schema_notes.sql:25–86`; `supabase/migrations/260908_xat_v2_correccions.sql:288–310,382–416`. |
| Automatització | CI executa `npm ci` i la porta agregada; aquesta inclou proves. No s'ha comprovat el resultat remot ni protecció de branques. `.github/workflows/sdp_lock_ci.yml:13–22`; `tooling/gates/run-portes.mjs:29–79`. |

## 4. Troballes prioritzades

P1 vol dir corregir abans d'obrir l'àmbit afectat a usuaris reals; P2, risc important de funcionament, creixement o manteniment. No es declara cap incident real d'exfiltració ni cap P0 demostrat.

### F01 · P1 · Notes d'un altre context s'incorporen al context nou

**[REPRODUÏT LOCALMENT]** En començar una càrrega amb un nou `scopeKey`, es conserva `prev.payload` i se li posa l'àmbit nou. Després, la reconciliació conserva totes les notes locals que no han vingut en la resposta, sense comprovar que siguen del mateix usuari/poble. Fonts: `src/sections/notes/NotesDataContext.jsx:24–28,37–40,50–70`; els proveïdors no es remunten amb una clau d'actor a `src/app/App.jsx:485–501`.

Diagnòstic: carregar A amb `private-A`, canviar el tenant a B i respondre només `private-B`. Resultat real del context: `scope=supabase_persona::A_B`, notes `[private-B, private-A]`. Un usuari que canvia de compte també pot travessar el mateix mecanisme si la càrrega nova arriba a l'estat conservat. Açò és una barreja en el client; no demostra que la RLS haja permés llegir files alienes.

**[PROPOSTA]** Canviar d'àmbit ha d'invalidar de manera atòmica dades, resultats pendents i selecció. Conservar una creació local només si té procedència del mateix àmbit i una mutació confirmada identificable. Acceptació: després del canvi A→B, cap nota d'A apareix ni durant la càrrega ni després de resposta buida de B.

### F02 · P1 · Les mutacions pendents no comproven l'àmbit actual

**[REPRODUÏT LOCALMENT per a creació; LECTURA DE CODI per a actualització]** `creaNota` guarda `myConfig=config` i `myActor=actorKey`, però els compara després amb els mateixos valors capturats en la funció antiga, no amb l'àmbit actual. `updateNote` escriu la resposta en `prev.payload` sense comprovar àmbit, generació o revisió de la resposta. Fonts: `src/sections/notes/NotesDataContext.jsx:97–109,134–146`.

Diagnòstic: iniciar creació en B, passar a C, resoldre la càrrega de C i després la creació antiga. `created-in-B` apareix en les notes de C. La comprovació que sembla protegir el canvi de tenant no el protegix.

**[PROPOSTA]** Cada mutació ha de capturar un identificador d'àmbit i generació, i comprovar-lo contra l'estat vigent en confirmar. El resultat remot d'una mutació d'A pot quedar registrat com a completat en A, però no modificar B. Acceptació: repetir amb resposta tardana d'èxit i d'error, tant en creació com en actualització.

### F03 · P1 · Després d'un conflicte, el desat pot quedar atrapat en la revisió antiga

**[REPRODUÏT LOCALMENT]** `knownRevisions` preval sempre sobre la revisió de la nota base i només s'actualitza amb un desat propi correcte. Un 409 desencadena recàrrega, però aquesta no actualitza el mapa del gestor. Fonts: `src/sections/notes/GlobalSaveManager.js:10–21,46–68`; `src/sections/notes/NotesDataContext.jsx:111–115`; crida amb nota base a `src/sections/notes/NotesContext.jsx:151–164`.

Diagnòstic: guardar revisió 2→3; una altra sessió porta el servidor a 4; refrescar la nota local a 4. Els intents següents envien 3 i 3: seqüència observada `[2,3,3]`. Tots dos retornen conflicte encara que la base local ja siga 4.

**[PROPOSTA]** Definir una reconciliació explícita entre base, esborrany i servidor. No basta substituir el número pel màxim i tornar a enviar: això podria sobreescriure canvis de l'altra sessió. Cal preservar l'esborrany, mostrar el conflicte i fusionar camps independents o demanar resolució quan s'ha editat el mateix contingut. Acceptació: dos editors, edició del mateix camp, cap pèrdua silenciosa i eixida comprovada del conflicte.

### F04 · P1 · La memòria de l'esborrany no equival a desat durable

**[LECTURA DE CODI]** Cada canvi serialitza el conjunt d'overrides en `sessionStorage`; errors de quota s'ignoren. El flush del rich text passa a una funció que torna a posar el desat en una cua de 600 ms, inclús quan ve de `pagehide`. Fonts: `src/sections/notes/NotesContext.jsx:61–93,95–115`; `src/config/storage.js:60–70`; `src/components/universal/richText/useUniversalRichText.js:36–47,89–108`; `src/components/universal/DocumentEditor.jsx:53–77`; `src/sections/notes/GlobalSaveManager.js:24–77`.

Un desmuntatge de component dins d'una pàgina viva pot deixar treballar el gestor global; tancar o matar la pàgina no oferix eixa garantia. **[SUPÒSIT]** Si es tanca abans de confirmar l'escriptura, o el navegador deixa de programar treball, es poden perdre canvis no confirmats. El codi tampoc informa de fallada de quota. No he simulat un procés mòbil mort ni mesurat el límit d'emmagatzematge.

A més, quan Notes està carregant o en error, el context retorna `BUIT` sense `scopeKey`; el consumidor canvia a la clau genèrica d'esborranys. Això complica que un desat antic netege l'esborrany correcte (`src/sections/notes/NotesDataContext.jsx:13–20,87–90`; `src/sections/notes/NotesContext.jsx:61–81,95–116`).

**[PROPOSTA]** Declarar estats visibles «pendent», «desant», «confirmat», «conflicte» i «error»; mantindre l'àmbit també en loading/error; establir un màxim de temps sense intentar desar durant escriptura contínua. Si es vol recuperació després de tancar el navegador, aprovar explícitament un magatzem local limitat d'esborranys, separat de la font de veritat remota, amb quota, caducitat i privacitat. No convertir el projecte en un sistema de sincronització distribuïda per accident.

### F05 · P1 · Una renovació antiga pot tancar una sessió nova

**[REPRODUÏT LOCALMENT]** `renovaAra` espera la renovació i, si resulta falsa, fa logout sense comprovar que continue la mateixa generació. El servei sí que té generacions, però aquesta operació no les consulta abans de l'efecte final (`src/data/sessionService.js:35–55,86–101`).

Diagnòstic: comença renovació amb A; el servei passa a B; la renovació d'A resol `false`; el logout s'executa sobre B. És un diagnòstic del servei amb backend controlat, no una sessió real robada.

També una fallada transitòria de xarxa retorna `false` en l'adaptador i el servei l'interpreta com a raó per eixir (`src/data/supabase/auth.js:19–41`; `src/data/sessionService.js:92–100`). El bloqueig d'una sola renovació simultània ja existix i convé conservar-lo (`src/data/supabase/auth.js:44–47`).

**[PROPOSTA]** Renovació lligada a la generació/identitat que la va iniciar; distingir credencial revocada de xarxa temporalment indisponible. Una resposta antiga no pot desar tokens ni tancar la nova sessió. Acceptació: A→logout→B amb renovació d'A encara pendent, i caiguda breu de xarxa prop de caducitat.

### F06 · P1 · Els adjunts de notes privades són llegibles per membres del poble

**[LECTURA DE CODI SQL]** Les notes exigixen ser propietari i membre. La política SELECT del bucket `mitjans_privats` accepta ser propietari **o** membre del tenant de la ruta. Fonts: `supabase/migrations/260914_0000_schema_notes.sql:53–59`; `supabase/migrations/260919_1650_bucket_mitjans_privats.sql:17–26`; definició de membre a `supabase/migrations/260908_0000_initial_schema.sql:401–413`.

Si esta migració està aplicada, un membre del poble que conega la ruta d'un adjunt té una autorització SQL més ampla que la de la nota. El bucket marcat privat no significa «només propietari»: implica ús dels permisos definits. No s'ha provat una descàrrega real ni que el bucket estiga desplegat.

**[PROPOSTA]** Distingir adjunts personals i contingut compartit; els primers han d'heretar l'autorització de la nota, amb ACL explícita si hi ha compartició. Acceptació al servidor: propietari sí, segon membre del mateix poble no, membre d'un altre poble no, anònim no; repetir descàrrega i generació d'URL firmada.

### F07 · P1 · Publicar i promoure imatges són operacions parcials sense compensació

**[LECTURA DE CODI]** `promoteToPublic` descarrega, puja al bucket públic i esborra l'original privat abans que es confirme l'actualització de la nota o la publicació. `publishNote` fa estes operacions, crea la publicació i només després marca la nota com a publicada. Algunes respostes booleanes de desat d'imatge/contingut no es comproven. Fonts: `src/data/supabase/storage.js:167–190`; `src/sections/notes/NotesContext.jsx:173–218`.

**[SUPÒSIT, només quan la pujada al bucket públic ha tingut èxit]** Si falla el desat després d'esborrar l'original, una nota encara pot apuntar a una referència privada que ja no existix. Si falla la publicació després de pujar la imatge pública, la imatge ja és pública encara que l'operació global haja fallat. Si la publicació arriba però falla la marca, un reintent pot crear una altra publicació: es genera un UUID nou quan no es rep un ID, i aquesta crida no el fixa (`src/data/supabase/content.js:52–66`; `src/sections/notes/NotesContext.jsx:201–216`).

**[PROPOSTA]** Operació de publicació amb clau d'idempotència estable i estat persistent al servidor. Primer còpia controlada, després confirmació de referències i publicació; esborrat diferit només quan no hi haja referències privades. Storage i SQL necessiten un flux recuperable amb compensació; una transacció SQL sola no fa atòmics els dos sistemes. Acceptació: tall després de cada pas i reintent sense duplicats, adjunts trencats ni exposicions inesperades.

### F08 · P1 · En arribar a 201 missatges, el sondeig deixa fora els més recents

**[LECTURA DE CODI SQL]** El client demana 200 missatges. L'RPC ordena ascendentment i aplica el límit: selecciona els primers, no els últims. El context substituïx els missatges confirmats per eixa resposta. Fonts: `src/data/supabase/xat.js:72–90`; `supabase/migrations/260908_xat_v2_correccions.sql:270–304`; `src/sections/xat/XatContext.jsx:204–216`.

Amb un fil de 201 files ordenades per data, la consulta deixa fora l'última. Un missatge nou mostrat de forma optimista o rebut per Realtime pot desaparèixer en el següent sondeig si ja consta com a enviat. No significa que la BD l'haja esborrat. No s'ha executat PostgreSQL per a aquest informe; la propietat es desprén de l'ordre i del límit del SQL.

**[PROPOSTA]** Primera pàgina dels més recents, cursors estables amb data i ID, càrrega d'històric separada i sincronització incremental des de l'últim cursor. Acceptació amb 201, 1.000 i missatges amb timestamps iguals, sense omissions ni duplicats.

### F09 · P2 · Xat no invalida l'estat pel canvi de tenant i reté missatges en eixir

**[REPRODUÏT LOCALMENT]** Configuració en una ref, però efectes i callbacks depenen de `joId`, no de tenant/generació. El camí sense usuari buida els fils però no el mapa de missatges ni el fil actiu. Fonts: `src/sections/xat/XatContext.jsx:141–166,186,225–231,249–358,447–465`.

Resultats: A→B amb el mateix usuari deixa una sola càrrega inicial, d'A, i els fils d'A fins al següent sondeig. Després de logout, `getThreadMessages('fil-A')` encara retorna el missatge fictici d'A, encara que la llista de fils queda buida. **Límit:** la vista comprova que el fil existisca i pot mostrar NotFound; no s'afirma que l'historial siga sempre visible després del logout (`src/sections/xat/XatSection.jsx:66–94`).

**[PROPOSTA]** Una clau de sessió/poble completa per a dades, subscripcions i mutacions; neteja immediata de contingut privat; generacions també per a enviaments. Caducitat o límit de fils mantinguts en memòria.

### F10 · P2 · L'entrada a qualsevol secció carrega i duplica altres dominis

**[LECTURA DE CODI]** Es munten tots els providers. Mur i Multimèdia invoquen cadascun `loadAppData`, que carrega tot `app_content`, publicacions i, amb sessió, notes. Notes torna a consultar notes i publicacions. Fonts: `src/app/App.jsx:485–501`; `src/data/supabase/content.js:19–24,68–80`; `src/data/supabase/notes.js:19–28`.

Això és amplificació de treball, dades privades innecessàries dins de lectures de dominis públics, i més dependències de fallada. El `limit=50` limita files, no el volum dels arrays JSON de `app_content` ni la grandària del contingut de cada nota (`supabase/migrations/260908_0000_initial_schema.sql:34–40`; `supabase/migrations/260914_0000_schema_notes.sql:10–15`).

**[PROPOSTA]** Consultes específiques per domini, càrrega quan cal, deduplicació de peticions en curs i memòria cau lligada a l'àmbit. Catàlegs públics amb versió i caché compartida quan els permisos ho permeten; mai caché compartida de respostes privades autenticades.

### F11 · P2 · Els límits de 50 són truncament, no paginació

**[LECTURA DE CODI]** Mur/Multimèdia seleccionen les últimes 50 publicacions de totes les seccions abans de separar-les al client; una secció molt activa pot expulsar del resultat les altres. Notes només carrega 50 files pròpies i no exposa cursor o càrrega següent en aquest contracte/vista. Fonts: `src/data/supabase/content.js:21,31–42,76–80`; `src/data/supabase/notes.js:19–28`; `src/sections/notes/NotesDataContext.jsx:91–153`; `src/sections/notes/NotesSection.jsx:45–65,89–110`.

El Mur filtra sobre el conjunt ja carregat, de manera que un filtre buit no prova que no existisquen publicacions coincidents al servidor (`src/sections/mur/MurSection.jsx:52–89`). L'índex de publicacions comença per tenant i secció, mentre la consulta conjunta no filtra secció; cal mesurar-ne el pla abans d'afirmar escanejos concrets (`supabase/migrations/260908_0000_initial_schema.sql:56–57`).

**[PROPOSTA]** Paginació per cursor al servidor i per secció, filtratge coherent amb la consulta, ordre total amb desempat per ID i detalls carregats separadament. Acceptació: la nota 51 continua accessible i l'activitat del Mercat no amaga tot el Mur.

### F12 · P2 · Sondeig constant, respostes completes i pics sincronitzats

**[LECTURA DE CODI; quantificació a §5]** Cada client autenticat visible consulta fils cada 25 s i el fil actiu cada 5 s. Existixen pausa per pestanya amagada, neteja i espera més llarga després d'errors: no s'han d'ignorar. Però no hi ha jitter en eixos temporitzadors, es tornen a demanar 200 missatges i la llista de fils calcula no llegits i últim missatge sense límit superior de fils. Fonts: `src/sections/xat/XatContext.jsx:45–47,302–358`; `src/data/supabase/xat.js:75–78,117`; `supabase/migrations/260908_xat_v2_correccions.sql:218–255`.

També s'intenta obrir Realtime, però el SQL disponible deixa comentada l'alta de la taula a la publicació. Açò acredita una discrepància entre codi i migració, no l'estat del panell remot (`src/sections/xat/XatContext.jsx:260–300`; `supabase/migrations/260908_xat_v2_correccions.sql:350–375`). La subscripció no substituïx el sondeig actual.

**[PROPOSTA]** Escollir un camí principal mesurat: Realtime amb recuperació incremental i sondeig de conciliació més lent, o sondeig incremental adaptatiu. En tots dos: jitter, límits per client/tenant, temps màxim, pressupost de reintents, suport a Retry-After quan existisca i tornada progressiva després d'una caiguda. Mesurar abans d'afegir comptadors precalculats als RPC.

### F13 · P2 · Els dos transports no oferixen les mateixes garanties de fallada

**[LECTURA DE CODI]** REST disposa d'un termini de 12 s, AbortController i un reintent de 401. Les operacions de Xat via SDK, en el codi d'aplicació revisat, no reben signal ni termini equivalent. El sondeig espera la promesa abans de programar la pròxima consulta. Fonts: `src/data/supabase/runtime.js:43–83`; `src/data/supabase/config.js:49–52`; `src/data/supabase/xat.js:44–105,109–130`; `src/sections/xat/XatContext.jsx:302–319`.

No he establit quin temps màxim imposa la versió instal·lada de l'SDK o la infraestructura. **[SUPÒSIT]** Una promesa que no concloga a temps pot deixar un cicle sense avançar. A Notes hi ha una incoherència demostrable de classificació: el transport produïx `name='TimeoutError'` i un missatge en valencià, però el context busca la cadena anglesa `timeout` en el missatge, així que eixe error no activa la reconciliació prevista (`src/data/supabase/runtime.js:73–77`; `src/sections/notes/NotesDataContext.jsx:111–115`).

**[PROPOSTA]** Contracte uniforme de cancel·lació, termini i errors tipats. Per a una escriptura amb resultat desconegut, consultar/reconciliar abans de repetir. Les altes de notes generen UUID nou si no se'n proporciona un i el Xat deixa generar l'ID al servidor: cal una clau estable abans del primer enviament per reintentar sense duplicats (`src/data/supabase/notes.js:37–44`; `src/data/supabase/xat.js:50–54`).

### F14 · P2 · Hi ha una lectura de backend abans de la barrera d'arrencada

**[LECTURA DE CODI]** Notes crida `getCurrentUser()` abans d'esperar `quanLlest()`. Si el port encara no té implementació, l'error es produïx abans de l'espera. L'entrada web crida `arrenca()` sense esperar-la i pinta immediatament. Fonts: `src/sections/notes/NotesDataContext.jsx:43–47,72–80`; `src/data/backendPort.js:51–55`; `src/main.jsx:19–33`.

**[SUPÒSIT]** Amb importació lenta de l'adaptador, Notes pot passar a error. Una altra actualització pot recuperar-la; no s'afirma que falle en totes les arrencades. **[PROPOSTA]** Readiness abans de tota lectura del port, i estat d'arrencada observable amb reintent verificat.

### F15 · P2 · La pujada privada de Notes no proporciona el tenant que exigix la política

**[LECTURA DE CODI]** Notes puja amb `{carpeta:'notes'}` sense tenant. Storage usa `tenantId || user.id` per al primer segment de la ruta. La política d'inserció exigix membresia del poble identificat per eixe segment. Fonts: `src/sections/notes/NotesEditor.jsx:15–18`; `src/data/supabase/storage.js:102–118`; `supabase/migrations/260919_1650_bucket_mitjans_privats.sql:28–35`.

**[SUPÒSIT]** En una configuració ordinària on l'UUID d'usuari no és el del poble, la pujada serà rebutjada si la política està aplicada. El comentari sobre compatibilitat no equival a una autorització SQL. Hi ha una segona incompatibilitat: el bucket públic exigix l’usuari al primer segment, mentre que una ruta privada correcta comença pel tenant. Copiar-la sense transformar-la al bucket públic farà fallar la promoció sota les polítiques del repositori (`supabase/migrations/260913_0500_bucket_mitjans.sql:22–32`; `src/data/supabase/storage.js:171–184`). Això limita quan es pot materialitzar F07: la pèrdua posterior a promoció requerix primer una pujada pública reeixida; no es dona per executada en aquest entorn. **[PROPOSTA]** Àmbit explícit i convenció de rutes coherent entre contracte i polítiques de cada bucket; prova d’integració real amb una nota privada i un tenant conegut.

### F16 · P2 · Hi ha punts d'extensió, però no un contracte complet de plugin

**[LECTURA DE CODI]** `CONTRACTE_NUCLI` exigix conjuntament Notes, Xat, organitzacions i autenticació. Les operacions es reconeixen pel nom; `arrenca` completa una implementació parcial amb Supabase. Les seccions necessiten imports, providers i rutes centrals. Fonts: `src/data/contracte.js:2–64`; `src/data/backendPort.js:15–25,44–55`; `src/host.js:181–198`; `src/app/App.jsx:17–47,485–501,590–620`; `src/config/sections.js:10–31`.

Hi ha també un forat de cicle de vida: el port exposa `destroy()`, però el setter només copia noms del contracte i `destroy` no hi figura. La sessió, backend, client SDK i revisions de desat són singletons; el servei de sessió no té una operació de destrucció que retire els seus listeners/timer. Fonts: `src/data/backendPort.js:5–6,18–22,38–41`; `src/data/contracte.js:2–64`; `src/data/sessionService.js:5–14,129–147`; `src/data/supabase/config.js:15–23,58–60`; `src/sections/notes/GlobalSaveManager.js:3–8,82`.

Açò no prova una fuita que creix en cada render: alguns listeners són únics de mòdul. Sí que limita la independència d'instàncies i el desmuntatge controlat. `knownRevisions` no té purga; el mapa de missatges conserva fils visitats. **[SUPÒSIT]** Sessions molt llargues poden acumular memòria; no s'ha fet perfilat de heap. La memòria cau de notes parsejades sí que purga IDs absents, i els efectes del Xat sí que netegen temporitzadors/listeners (`src/sections/notes/NotesContext.jsx:118–123`; `src/sections/xat/XatContext.jsx:348–357`).

**[PROPOSTA]** Nucli amb cicle `crear/configurar/activar/desactivar/destruir`, àmbit explícit i extensions per capacitat versionada. No una reescriptura amb microserveis; sí una separació verificable dins del mateix projecte.

### F17 · P2 · La documentació d'entrada i les portes no basten per a un relleu fiable

**[LECTURA DE CODI I COMPROVACIONS LOCALS]** El README instruïx aplicar `supabase/schema.sql` i `supabase/schema_notes.sql`; aquestes dues rutes no existixen en l'arbre revisat, que conté migracions amb data. També descriu modes `auto`/`supabase`, mentre el normalitzador accepta `remote`/`seed`/`local` i retorna `remote` per a altres valors. Fonts: `README.md:36–49,112–120`; `src/data/supabase/runtime.js:25–32`; `supabase/migrations/260908_0000_initial_schema.sql:1–7`; `supabase/migrations/260914_0000_schema_notes.sql:5–23`.

La porta d'enxufe comprova superfície, noms i patrons; la RLS revisa patrons SQL, no executa una matriu d'usuaris contra el servidor (`tooling/gates/tractor-enxufe.mjs:69–118`; `tooling/gates/tractor-rls.mjs:169–182,203–221`). Les dues passen mentre F01, F03 i la política de F06 continuen existint. Un verd d'aquestes portes és útil però no certifica «zero forats».

**[PROPOSTA]** Recepta única d'instal·lació des de zero amb versions fixades, migracions verificables, exemple de configuració sense secrets i restauració de còpia de seguretat. Proves de contracte i comportament com a condició per publicar; les portes estàtiques complementen eixes proves. La CI ja inclou tests: cal ampliar-ne la cobertura de garanties, no afirmar que no existixen (`tooling/gates/run-portes.mjs:79`; `.github/workflows/sdp_lock_ci.yml:19–22`).

## 5. Estrès teòric: 10.000 usuaris

### 5.1 Què significa «simultanis»

10.000 persones llegint una pàgina, 10.000 sessions amb Xat actiu i 10.000 persones escrivint una mateixa nota són càrregues diferents. Cada navegador executa la seua instància de Preact; no són 10.000 arbres React dins d'un sol procés servidor. El servidor rep el treball resultant de REST, RPC, sockets i mitjans. L'àlies de framework està a `vite.config.js:32–40`; els camins de dades, a §3–4.

No dispose de dimensions/quotes del desplegament, connexions del pool, nombre de rèpliques, ús de CDN, grandària real de respostes, plans SQL, SLOs, latència mòbil o percentatge d'activitat. Totes les xifres següents són **[SUPÒSIT]**, calculades a partir del codi; no són benchmarks.

### 5.2 Ràfega inicial

Per una càrrega estable de cada provider, en mode remot amb configuració correcta i sense comptar reintents, noves generacions ni muntatges addicionals:

| Camí | Visitant sense sessió | Usuari amb sessió | Font |
| --- | ---: | ---: | --- |
| Core | 1 REST | 1 REST | `src/data/supabase/content.js:68–74` |
| Mur → loadAppData | 2 REST | 3 REST | `src/data/supabase/content.js:19–24,76–77` |
| Multimèdia → loadAppData | 2 REST | 3 REST | `src/data/supabase/content.js:19–24,79–80` |
| Notes | 3 REST | 3 REST | `src/data/supabase/notes.js:19–23` |
| Subtotal de contingut | **8** | **10** | Providers conjunts: `src/app/App.jsx:485–501` |

El Xat autenticat afegix una consulta inicial de fils (`src/sections/xat/XatContext.jsx:160–184,227–231`; `src/data/supabase/xat.js:109–118`). La sessió pot consultar el rol (`src/data/sessionService.js:61–79`; `src/data/supabase/auth.js:56–62`). Login, imatges, assets, obertura de fil i altres operacions van a banda. Si F14 interromp Notes, pot haver-hi menys consultes perquè una funcionalitat ha fallat; no és una optimització.

**[SUPÒSIT]** 10.000 entrades en 10 segons representen 80.000–100.000 peticions REST de contingut, és a dir 8.000–10.000/s de mitjana dins d'eixa finestra, més les altres operacions. Ni el volum instantani ni la resposta del servidor queden mesurats. Una caché interna de la BD podria abaratir lectures; no elimina les peticions que fa el client.

Prioritat: carregar només allò necessari i separar resums de cossos complets abans d'augmentar màquines. Si `app_content` conté arrays grans, el límit de files no els fa menuts.

### 5.3 Xat estable i recuperació

**[SUPÒSIT]** Tots els clients visibles i autenticats, un fil actiu per client, latència negligible davant dels intervals:

- Llistes: 10.000 / 25 ≈ **400 RPC/s**.
- Fils: 10.000 / 5 ≈ **2.000 RPC/s**.
- Total: aproximadament **2.400 RPC/s**, abans d'escriptures, lectures marcades i altres peticions.

Els timers es programen després de completar la consulta, de manera que amb latència L les taxes es aproximen a N/(25+L) i N/(5+L). No és un límit global estricte: tornar a mostrar una pestanya també pot disparar consultes (`src/sections/xat/XatContext.jsx:302–341`). Si només un 10% obri un fil, serien aproximadament 400+200=600 RPC/s amb la mateixa hipòtesi. Una ruta diferent també conserva els providers globals; abandonar la vista de Xat no equival necessàriament a eliminar tota la seua activitat (`src/app/App.jsx:485–501`; `src/sections/xat/XatContext.jsx:249–358`).

**[SUPÒSIT de volum]** Amb 200 missatges × 500 bytes serialitzats de mitjana, cada resposta pesa aproximadament 100 kB abans de compressió i capçaleres. A 2.000 respostes/s són 200 MB/s de JSON repetit. Amb 20 missatges la xifra baixa deu vegades. Cal substituir 500 bytes per una mesura real; no és una factura estimada ni una afirmació sobre egress facturat.

Si el mateix missatge es difon a 10.000 subscriptors autoritzats, el fan-out continua sent 10.000 entregues. Realtime no elimina el cost ni les polítiques d'accés. Cal comprovar sockets, subscripcions, latència i quota del servei abans d'activar-lo com a via principal.

La limitació SQL de 15 missatges/5 s per usuari és una protecció existent per escriptures; no limita les lectures descrites ni evita que 10.000 comptes legítims actuen alhora (`supabase/migrations/260908_xat_v2_correccions.sql:382–416`).

### 5.4 Editor

El cos té debounce de 800 ms a l'editor i 600 ms al gestor: aproximadament 1,4 s des de l'última modificació fins a intentar l'escriptura en el camí normal, més xarxa. Els altres camps poden seguir un recorregut diferent. Fonts: `src/components/universal/DocumentEditor.jsx:70–77`; `src/sections/notes/GlobalSaveManager.js:24–77`.

**[SUPÒSIT]** 1.000 persones, cadascuna amb una nota pròpia i una pausa efectiva de desat cada 5 s: aproximadament 200 PATCH/s; si són 10.000, 2.000 PATCH/s. Un document HTML de 100 kB implicaria uns 20 o 200 MB/s de payload respectivament, abans de compressió. S'envia el contingut complet del camp editat, no operacions CRDT (`src/data/supabase/notes.js:51–58`).

**[SUPÒSIT]** Moltes sessions sobre una mateixa nota competixen per una fila/revisió: la majoria d'intents des d'una mateixa revisió poden entrar en conflicte. En l'estat actual F03 n'impedix la recuperació normal. Per a edició col·laborativa real cal un disseny específic; no es pot extrapolar la capacitat de moltes notes independents a una nota compartida.

### 5.5 Cost dins d'un mòbil i memòria

Cada pulsació pot serialitzar tots els overrides pendents i provocar recorregut de totes les notes per calcular el model. Hi ha caché de parseig i purga, però l'array i el valor del context es reconstruïxen quan canvien overrides (`src/sections/notes/NotesContext.jsx:83–91,118–149,226–239`). **[SUPÒSIT]** Amb documents grans o molts esborranys, el fil principal pot deixar de respondre amb fluïdesa. Cal mesurar duració d'input, render, parseig HTML i escriptura de storage; una càrrega de servidor correcta no ho detecta.

**[PROPOSTA]** Estat separat de document actiu, índex de llistat i mutacions; subscripcions amb selectors; persistència d'esborrany limitada i incremental si s'aprova; límits de contingut al servidor; pressupost de memòria i LRU per a fils/documentació consultada. No afegir memoització indiscriminada sense perfilat.

## 6. Canvis de fonament que faria ara

Tota aquesta secció és **[PROPOSTA]**. Descriu responsabilitats i criteris, no fitxers nous suposadament existents.

### A. Un àmbit obligatori per a tot treball privat

Una identitat operativa ha d'incloure almenys backend, tenant, usuari autenticat, actor representat i generació de sessió. L'actor no substituïx l'usuari: hui l'actor pot ser una entitat preferida i no incorpora validació de membresies (`src/app/contexts/IdentitatContext.jsx:19–36`). Autoritzar una acció continua sent obligació del backend.

Tota lectura, esborrany, mutació, caché i subscripció ha de declarar aquest àmbit. En canviar-lo, es cancel·la el treball cancel·lable, s'oculten immediatament les dades antigues i s'impedix aplicar resultats tardans. Un treball ja enviat al servidor pot haver-se confirmat encara que s'avorte el client; necessita reconciliació, no una promesa d'anul·lació que el servidor no ha rebut.

### B. Desat i publicació com a protocols de dades

Definir invariant: «confirmat» només significa resposta durable del servidor per a una operació identificada. La cua té límits, termini, estat consultable i política de conflictes. Un timeout és resultat desconegut, no prova que el servidor no haja escrit. Notes, publicacions i missatges necessiten reintents idempotents; publicar necessita recuperació entre BD i Storage.

Per a conflictes, conservar base, edició local i versió remota. No comparar números de revisió de notes de tenants diferents; no actualitzar el número per damunt i enviar el mateix HTML sense comprovar què s'està sobreescrivint.

### C. Monòlit modular amb capacitats opcionals

Conservar un únic projecte desplegable mentre siga suficient. Reduir el nucli a arrencada, àmbit/sessió, registre de mòduls, navegació, contractes de dades i notificació d'errors. Notes, Xat, Mur i Mitjans han de poder activar-se segons capacitats; l'absència de Xat no ha d'obligar un backend a implementar-lo per a editar notes.

Cada mòdul declara versió del contracte, capacitats requerides, permisos, punts de navegació i cicle de vida. El sistema valida entrades, resultats, errors, cancel·lació i desmuntatge. Un nom de funció coincident no és una garantia de compatibilitat. Primer plugins de confiança inclosos en el build; plugins arbitraris de tercers exigirien aïllament i un model de permisos addicional. L'informe no recomana executar-los amb accés a la sessió global.

El Sistema de Disseny Pedra Seca ha de mantindre responsabilitats visuals i d'interacció. Els components reutilitzables poden consumir adapters com l'actual DocumentEditor; no han de convertir-se en propietaris ocults de sessió, SQL o desat (`src/components/universal/DocumentEditor.jsx:13–39`).

### D. Dades públiques, privades i de treball separades

`app_content` té política de lectura pública; no ha de ser un calaix de dades personals (`supabase/migrations/260914_0100_auditoria_rls_fixes.sql:46–52`). Inventariar què conté abans d'utilitzar-ne una caché pública. Publicacions i notes tenen consultes i permisos diferenciats; evitar que els loaders dels dominis públics carreguen notes només perquè compartixen un agregador.

Paginació, límits de bytes i filtres de servidor han de formar part del contracte. La infraestructura pot escalar millor després d'eliminar peticions redundants i respostes desproporcionades. No es recomana ocultar el problema augmentant un `limit` de 50 a 50.000.

### E. Relleu humà i durabilitat

Preparar una instal·lació reproduïble des de zero, una restauració amb dades de prova, exportació de documents i mitjans en formats documentats, i compatibilitat de versions de dades. Escriure decisions breus amb problema, alternatives i motiu; una altra persona ha de poder entendre els invariants sense haver llegit tots els xats o auditories històriques.

Definir qui manté versions i dependències, quan es revisen, com es revertix una versió i com es comprova que un backup es restaura. Objectius de recuperació i pèrdua màxima acceptable s'han d'acordar amb el responsable d'operacions. No hi ha informació suficient per afirmar que hui existisquen backups verificats, monitoratge o pla de continuïtat al servidor.

## 7. Pla de comprovació abans d'obrir

Totes les files són **[PROPOSTA]** de treball per a IAIA MarIA i l'equip de backend; no proves ja executades.

| Ordre | Treball | Condició per considerar-lo acabat |
| --- | --- | --- |
| 1 | Àmbits i privacitat: F01, F02, F06, F09, F15 | Matriu usuari A/B × poble A/B × logout × resposta tardana; cap dada aliena en estat o storage autoritzat. |
| 2 | Desat/sessió: F03–F05, F13–F14 | Conflicte resoluble, resultats desconeguts reconciliats, sessió nova immune a treball antic, estat de desat verificable. |
| 3 | Publicació: F07 | Tall en cada pas de BD/Storage; reintent sense doble publicació ni adjunts perduts. |
| 4 | Paginació i càrrega: F08, F10–F12 | 201 missatges i 51 notes accessibles; filtres correctes; càrrega només del domini necessari. |
| 5 | Contractes i relleu: F16–F17 | Backend alternatiu supera el mateix joc de proves; instal·lació i restauració fetes per algú que no haja escrit el sistema. |
| 6 | Capacitat en staging aïllat | Càrrega amb identitats i contingut representatius; pressupost acordat; dades exportades i interpretades. |

Per a la fase 6: rampa 100→1.000→5.000→10.000, prova sostinguda, arribada sobtada i recuperació després d'una fallada. Separar visitants, lectors autenticats, xats oberts, editors i pujada de mitjans. Evitar que totes les proves siguen anònimes o usen un únic compte, perquè no representarien permisos, cachés i contenció reals.

Mesurar p50/p95/p99 per operació, peticions/s, errors per classe, cues, bytes, connexions SQL, CPU/IO de BD, duració dels RPC, sockets i missatges Realtime, confirmació de desats, conflictes, memòria i resposta d'input en clients representatius. Afegir caos controlat: latència, 429/503, tall després d'escriure però abans de rebre resposta, caducitat de token, canvi de tenant i reobertura de l'aplicació.

**[PROPOSTA de criteris, pendents d'acord]** Cap pèrdua o duplicació d'escriptura confirmada; cap dada d'un àmbit visible en un altre; p95 de lectura <1 s i p95 de confirmació de desat <2 s sota càrrega objectiu, mesurats al transport i separats dels debounces de UI; errors de servei <1%; recuperació sense reintents sincronitzats. Les xifres de latència són objectius proposats, no prestacions actuals. El criteri de privacitat/integritat no admet un percentatge d'error «acceptable».

## 8. Verificacions fetes i límits dels verds

Sis diagnòstics han acabat amb les condicions de defecte confirmades:

| Diagnòstic | Eixida observada |
| --- | --- |
| Revisió obsoleta | intents `[2,3,3]`, base i servidor en revisió 4, dos conflictes consecutius |
| Notes entre tenants | àmbit B amb notes `[private-B, private-A]` |
| Creació tardana | àmbit C incorpora `created-in-B` |
| Renovació antiga | logout executat sobre B després d'una renovació iniciada en A |
| Canvi de tenant en Xat | només una càrrega inicial d'A; fils d'A després de passar a B |
| Logout del Xat | llista de fils buida, però `getThreadMessages` encara retorna `msg-A` |

Els dos primers grups de contextos s'han executat amb codi JSX compilat en memòria amb esbuild, Preact/compat real i serveis substituïts. No s'han escrit fitxers de proves al repositori. El primer intent de l'arnés de Notes es va interrompre perquè encara no s'havia buidat la microtasca de l'efecte; es va corregir l'espera de l'arnés i els dos escenaris van acabar amb asserts correctes. No es compta l'error de l'arnés com a defecte del producte.

| Comprovació local | Resultat |
| --- | --- |
| `node tooling/gates/tractor-enxufe.mjs` | exit 0; E1–E4 passen |
| `node tooling/gates/tractor-rls.mjs` | exit 0; 15 fitxers SQL revisats pel tractor |
| `node tooling/gates/tractor-adaptadors.mjs` | exit 0; un contracte capturat validat |
| `node tooling/gates/tractor-persistencia.mjs` | exit 1; tres accessos directes a sessionStorage en `src/sections/disseny/cataleg/detailRegistry.jsx:8,16,20` |
| Frontmatter estricte global abans de crear l'informe | exit 1; 215 documents, 20 exempts; 133 incidències: F1=16, F2=89, F3=10, F4=3, F5=1, F7=14 |

La infracció d'encapsulació de sessionStorage no demostra per si sola un bloqueig en parsejar-lo: el fitxer actual protegix lectura i escriptura amb `try/catch` (`src/sections/disseny/cataleg/detailRegistry.jsx:5–20`). No s'han traslladat conclusions d'auditories antigues com si encara estigueren vigents. Igualment, les regles de hooks sí que estan habilitades hui (`eslint.config.js:27–33`).

No s'ha executat la suite completa de Vitest ni es declara que passe. No s'ha mesurat cobertura ni s'ha fet build de producció. Les proves de la BD, navegador real, càrrega i restauració continuen pendents; els dobles locals no poden acreditar-les.

## 9. Incògnites que condicionen qualsevol garantia

1. Migracions i polítiques exactes desplegades, grants efectius, contingut real de `app_content` i estat de la publicació Realtime.
2. Grandària i distribució de tenants, nombre de fils per usuari, notes i longitud dels documents; percentatge de clients actius.
3. Capacitat del servidor, quotes del proveïdor, pool, CDN, regles de caché i pla de creixement.
4. Resultat de proves reals de canvi d'identitat, tancament de pestanya i recuperació mòbil, amb permisos i sessions del proveïdor.
5. Monitoratge, alertes, còpies de seguretat, proves de restauració i responsables operatius.
6. Si el producte vol notes estrictament personals o col·laboració; si els adjunts poden compartir-se amb tot el poble; si es vol recuperar esborranys després de tancar. La proposta conservadora és mantindre privades les notes i els seus adjunts fins que hi haja una compartició explícita.

## 10. Puntuació global i distància al somni

| Dimensió | Pes | Nota /10 | Motiu |
| --- | ---: | ---: | --- |
| Modularitat i substitució | 20% | 6 | Port i components aprofitables; nucli funcional massa ampli i singletons sense cicle complet. F16. |
| Integritat i recuperació | 25% | 3 | Conflictes bloquejats, mutacions tardanes, publicació parcial i esborranys sense garantia durable. F01–F05, F07, F13. |
| Privacitat i aïllament | 25% | 4 | RLS de notes positiva, però barreja de contexts i adjunts amb permisos més amplis. F01–F02, F06, F09. |
| Escala i eficiència | 15% | 4 | Duplicació de lectures, truncament i sondeig complet. F08, F10–F12. |
| Verificació i relleu | 15% | 6 | Portes, CI i proves existents; documentació divergent i garanties clau encara sense evidència suficient. F17 i §8. |
| **Global ponderada** | **100%** | **4,45 → 4,5** | Valoració de la resiliència actual, no de l'esforç ni de la qualitat visual. |

El somni no exigix que ningú torne a tocar la base. Exigix que una altra persona puga comprendre-la, provar-la, actualitzar-la i recuperar-ne les dades sense dependre dels autors originals. Hui hi ha una estructura amb potencial, però les garanties essencials de canvi d'àmbit, confirmació i recuperació encara no estan tancades. **La prioritat és fer eixes garanties demostrables abans d'afegir més capacitats o obrir trànsit massiu.**

## 11. Bateria de veritat

- [x] He explorat fonts reals i distingit comentaris de comportament executable.
- [x] Les afirmacions sobre implementació tenen rutes i línies dins de l'arrel indicada.
- [x] No s'han presentat fitxers o APIs proposats com si ja existiren.
- [x] Càrrega, conseqüències no executades i incerteses estan marcades o delimitades.
- [x] Pedra Seca s'ha interpretat com a Sistema de Disseny/UI Kit.
- [x] Sense cerca externa, navegador, modificacions de codi o pegats aplicables.
- [x] Els diagnòstics locals es distingixen d'una prova de producció o càrrega.
- [x] Frontmatter individual estricte correcte; integritat i concurrència documentades al registre final.

## 12. Registre final de verificació

**Frontmatter individual: PASSA en mode estricte, exit 0.** S'ha executat el tractor original del projecte contra una còpia aïllada d'aquest informe i els mateixos `schema.json`, pany i configuració d'abast, a `/private/tmp/sdp-auditoria-validacio-ecjzuc21`. Un document, zero immutables, F1–F8 a zero. No s'ha modificat el validador ni l'esquema.

Frontmatter global posterior: exit 1, 217 documents i 20 exempts, les mateixes 133 incidències prèvies. Zero incidències atribuïdes al nou informe. El nombre de documents ha crescut en dos durant la sessió; només aquest informe l'ha creat Codex en aquest encàrrec. No es declara verd el corpus.

Comprovació mecànica de cites: 134 referències en 47 fitxers, tots existents i amb números de línia dins del fitxer. Açò comprova rutes i límits; la correspondència semàntica s'ha revisat llegint les fonts.

**Concurrència detectada:** de 269 empremtes de JS/JSX/MJS, migracions SQL, configuracions i manifests preses durant l'auditoria, 268 coincidixen al control final. Ha variat `src/components/PedraSeca/molecules/PillToggle.jsx` per una operació aliena a les d'aquest encàrrec; aquest fitxer no sustenta les troballes de l'informe. No s'atribuïx la variació a una persona o agent concret, ni es declara immutable tot l'arbre compartit. No s'ha fet cap operació d'escriptura de codi en aquesta auditoria.

Empremtes SHA-256 dels punts principals de les troballes, coincidents amb el tall de control inicial:

| Font | SHA-256 |
| --- | --- |
| `src/sections/notes/NotesDataContext.jsx` | `6cb489caff6f77cad8ac72f1772e24a909d1553fb5f6b4fb2b6de95e2566e732` |
| `src/sections/notes/NotesContext.jsx` | `75458e0c3859b7a33061b679b28981e543b39b2786eb79aa6f8d31872eaec6c8` |
| `src/sections/notes/GlobalSaveManager.js` | `59f2bb9430c698b31b9d54ec56d822e7ab1ca212098fe963d7aaa67459a339e3` |
| `src/sections/xat/XatContext.jsx` | `4cf5361baa883df90fd3f7552b70a270762bcceb25c1f916e9817cdfa5a9fbd6` |
| `src/data/sessionService.js` | `8315f67b5209d11017fcbf1b4efc658313b98ed3609d3210e6f7b695922d7e9b` |
| `src/data/supabase/content.js` | `229994b1a492dfd4c8c8801b1612fe82641a8cacb6b5960e020731cfe24be7c5` |
| `src/data/supabase/notes.js` | `e61ea503316fe0f1e14dc7d0deffaadcda5917329745f04a74d10a58b344ecaf` |
| `src/data/supabase/storage.js` | `c31cef889c60a5431d2e6aa6f8835df03a97a45d6ffa86b2ab19e4a51007deeb` |
| `supabase/migrations/260919_1650_bucket_mitjans_privats.sql` | `01f946b82de866410166dacaa24db6724cf6a91241b5696bd46c061711041e8c` |
| `supabase/migrations/260908_xat_v2_correccions.sql` | `877b56c0d328963826d2d27f2070ac8b0c34a37637a95bb13d8ab625353bfaf5` |
| `src/app/App.jsx` | `0c4589c7fc2bcdd5521697574dae47d96b5245ae9cc60c4dc6cd30405720c885` |
| `src/data/backendPort.js` | `323f12e800cfbe3e07de5588002f6cea9e7c64c22329f7eed967f5288dc6d57f` |
| `src/data/contracte.js` | `10b4e7317d26856ccfedabb75d07b2bdeeb025f090a803770e1bc69407fd1c8c` |

La còpia temporal de validació conté només material documental i de l'esquema. No és una còpia desplegable del projecte ni un bundle de codi. La verificació individual s'ha repetit sobre la versió final del Markdown.
