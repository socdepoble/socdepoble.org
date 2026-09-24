---
type: informe
status: esborrany
description: Auditoria del codi actual de sessions, Mur, Notes i Frontissa Sollutia amb reproduccions locals i proposta de blindatge.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c1630ab1-a567-4435-b42d-4ebc4db3a853:e9c94ec5-2f58-4efe-81a4-2561b4ff8e79
---
# Auditoria estructural, estat i enxufabilitat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c1630ab1-a567-4435-b42d-4ebc4db3a853:e9c94ec5-2f58-4efe-81a4-2561b4ff8e79 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T22:55:44.991Z |
| Modificació | 2026-09-23T22:55:44.991Z |
| Propietari | Codex |
| Tall d’evidència | a555b1edade94ec69dc9156ddc6a5c5aeb359a1a; 24-09-2026, 00:53–01:10 Europe/Madrid; sense canvis de producte observats |
| requires_human_decision | true per API/auth/autoritat i retenció; implementació pendent |
| Aprovació humana | Auditoria autoritzada pel prompt; implementació pendent de consens i aprovació. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6; variant no exposada |
| Tokens consumits | Mesurats reals: no disponibles en esta sessió. Estimats: no calculats; cap xifra presentada com a telemetria real. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23T23:04:33.983923+00:00: auditoria documental i proposta completades; cap codi de producte modificat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

**L’enxufabilitat és parcial: hi ha un port útil, però encara no hi ha un contracte de dades que blinde el frontend.** El Model B actual denega `configura({ backend })`, i això és correcte segons l’ADR vigent. El problema principal està en la Frontissa: accepta rutes arbitràries, no usa el catàleg i retorna el JSON del proveïdor sense traduir. Canviar un backend sense tocar components és assolible si SdP controla els DTO, els errors i la composició interna; no significa que qualsevol canvi incompatible de l’API es puga absorbir automàticament.

La primera prioritat és la coherència de sessió i d’àmbit de dades, seguida de la frontera de xarxa i de les càrregues limitades. No he demostrat un bypass de RLS, execució remota ni exfiltració de JWT per `llig()`. No assigne P0 per intuïció. Les troballes P1 indiquen correcció prèvia a activar la integració real o ampliar càrrega; P2 indica robustesa i manteniment.

### Evidència i superfície

Tall inicial: `a555b1edade94ec69dc9156ddc6a5c5aeb359a1a`; només `.agents/ON_ESTIC.md` apareixia modificat. S’audita el codi del disc, no el text d’auditories històriques. Lectures: `host.js`, `PedraSecaEmbed.jsx`, `backendPort.js`, `contracte.js`, `runtimePolicy.js`, `identitat.js`, `sessionService.js`, contextos Core/Identitat/Sessió/Mur/Multimèdia/Notes, gestor de desat, adaptadors Sollutia, transport/auth/content/notes/realtime/config Supabase, migracions relacionades i portes/testos. Les rutes i línies següents són relatives a `socdepoble.org`.

Pla compartit llegit íntegre: [[260924_0035_pla_implementacio_disseny_claude]]. En el tall inicial no hi havia una auditoria nova de Claude a l’escriptori. No s’han consultat arxius històrics, secrets ni serveis de producció. Les sondes viuen temporalment a `/private/tmp/sdp-audit-260924`; totes les peticions de les reproduccions són simulades.

### F1 · P1 · El Mur conserva dades de l’àmbit anterior; Multimèdia no seguix la generació de sessió

**Evidència:** `src/sections/mur/MurContext.jsx:15-44,46-65` i `src/sections/multimedia/MultimediaContext.jsx:15-38,40-60`. Els efectes cancel·len peticions antigues, però el payload que ja estava en `ready` no està associat a actor, tenant ni generació. Quan canvia l’actor, el Mur inicia una lectura sense posar les dades anteriors fora de circulació. Multimèdia ni tan sols depén de `generacio`. `IdentitatContext.jsx:22-30` permet que una entitat preferida conserve el mateix `actorKey` quan canvia l’usuari.

**Reproducció real amb React:** carregar A, deixar pendent la petició de B i canviar actor/generació. `useMur()` continua tornant `status:'ready'` i l’element `A-only`. En Multimèdia, canviar només generació amb actor d’entitat estable no provoca una segona lectura. Sondes F1: 2 proves positives de l’error.

**Impacte:** barreja visible d’àmbits i contingut desactualitzat; exposició local condicionada a si el payload conté contingut restringit. El feed públic no es convertix per això en una fuita privada. Una resposta antiga pendent ja està protegida per `active`/`loadGen`; la fallada és el payload ja acceptat. Core buida l’exposició quan entra en loading, però també convé associar-hi el token durant el render inicial del canvi.

**Correcció:** aplicar el patró tokenitzat ja existent a `NotesDataContext`: identitat inclou backend, tenant, usuari, actor i generació; render només del token actual; avortament també a `quanLlest({signal})`. No requerix redisseny ni cap biblioteca nova. `requires_human_decision: false`.

### F2 · P1 · Cursa en la consulta del rol i sessió global sense àmbit de configuració

**Evidència:** `src/data/sessionService.js:30-34,46-79`. `generacio` canvia amb l’ID de l’usuari, però dues consultes `elMeuRol()` del mateix usuari comparteixen generació. La més antiga pot acabar l’última i tornar a posar `superadmin` després que la més recent haja tornat `usuari`. Canviar `config` no invalida una resposta anterior ni reinicia el rol.

**Reproducció:** dues crides consecutives a `sincronitza()`, resolució de la segona amb `usuari`, després la primera amb `superadmin`: `getSessionState().rol === 'superadmin'`. No és una simulació d’un algorisme alternatiu: s’executa el servei vigent amb el port simulat.

**Impacte:** controls administratius desactualitzats; no acredita escalada al servidor perquè els permisos remots continuen sent necessaris. `currentConfig` i els listeners són singletons de document; dos Web Components amb configuracions diferents es disputen la configuració encara que tinguen providers diferents.

**Correcció:** número de consulta monotònic del rol, invalidació en canvi d’àmbit i estat `desconegut` mentre es resol. Una instància de sessió per app o una restricció explícita i validada d’una única configuració de dades per document. Afegir retry amb espera limitada quan falla la renovació: `renovaAra():106-109` només avisa i no rearma el temporitzador després de la fallada. `requires_human_decision: false` per corregir la cursa; `true` si es vol suportar diversos backends simultanis.

### F3 · P1 · Frontissa sense frontera efectiva de destí ni de DTO

**Evidència:** `src/data/adaptadors/sollutia/client.js:10-25,41` valida `issuer` però després fa `new URL(recurs, issuer)`. Una URL absoluta o `//host/ruta` substituïx l’origen. `llig()` no importa `RECURSOS`, no exigix fixture ni traductor, no rep `signal`, no imposa timeout ni límit de resposta. `recursos.js:3-11` escampa `...payload`, de manera que els camps del proveïdor travessen la frontera. `auth.issuer` tampoc és necessàriament la base de l’API.

**Reproducció:** amb issuer `https://sollutia.cat`, `llig('https://example.invalid/collect',{q:'synthetic'})` crida el fetch simulat d’eixe altre origen i torna `{secret_extra:'no filtrat'}` íntegre. No hi ha Authorization al codi actual; `credentials:'omit'` i `redirect:'error'` sí que estan ben posats. Per això descric eixida de xarxa fora del catàleg i filtració potencial dels paràmetres, no robatori de JWT demostrat. No he trobat cridants de producció de `llig()` en `src` durant el tall: és un defecte latent d’integració.

**Correcció:** catàleg SdP intern i tancat, identificadors de recurs en lloc d’URLs, `apiOrigin` separat de `auth.issuer`, params permesos, timeout/abort, límit de bytes i traductor explícit de l’eixida. Recurs sense captura real i traductor validat: desactivat. La fixture actual és un «Usuari de Prova» amb UUID nul, sense procedència; no prova compatibilitat amb una API real. Codi exacte al pla. `requires_human_decision: true` només per fixar el domini i contracte reals.

### F4 · P2 · Retenció creixent en el gestor de desat i en la cua del host

**Evidència:** `GlobalSaveManager.js:66-69,80-85`: `writes` guarda la promesa per clau i mai l’elimina, a diferència de `locks`. Les promeses resoltes retenen el seu valor, que pot incloure camps d’esborrany. `knownRevisions` creix amb cada nota sense política d’expulsió. `host.js:211-230`, dins de `SocDePobleCua.push`, executa l’acció i després la torna a afegir amb `Array.prototype.push.apply`; no hi ha un segon buidatge automàtic. Una ordre `sessio` pot quedar retinguda amb l’objecte de tokens.

**Reproducció:** 1.000 claus completades amb `GlobalSaveManager.write()` deixen `writes.size=1000` i `knownRevisions.size=1000` quan `queues.size=0`. Açò prova retenció per clau, no MB exactes de heap. La retenció de la cua del host es deduïx de la branca final que afegix les accions ja executades.

**Correcció:** eliminar la promesa de `writes` al final només si continua sent l’actual; revisions amb expulsió quan no hi haja cues/locks/escriptures actives, o en canvi d’àmbit després de drenar. El `push` de la cua ha d’executar i retornar la longitud sense tornar a emmagatzemar l’acció. Eliminar listeners globals requerix un cicle de vida explícit: una única subscripció que viu tant com el document no és, per si mateixa, una fuita. `requires_human_decision: false`.

### F5 · P1 · Notes carrega tot el corpus i confon una pàgina curta amb una llista completa

**Evidència:** `src/data/supabase/notes.js:85-100` recorre seqüencialment `select=*`, 50 files i offset fins que en rep menys de 50; retorna `notesComplete:true`. `runtime.js` descarta `Content-Range`. `NotesContext.jsx:108-142` calcula text complet, cerca i format de data de totes les notes; cada edició recorre tota la llista encara que la memòria cau estalvie tornar a parsejar notes inalterades.

**Reproducció:** un servidor amb topall de 20 files, tot i tindre’n més, provoca una sola lectura de 20 i `notesComplete:true`. Dos pàgines amb una inserció/desplaçament entre lectures poden retornar l’ID 49 dos voltes; la sonda del codi actual torna 52 objectes per 51 IDs i els declara complets. Una eliminació pot fer saltar una fila. Un servidor que repetix pàgines plenes no acaba mai fins que s’avorta o falla.

**Impacte:** notes invisibles, duplicades, desaparicions de memòria local quan `complete` elimina les que no s’han retornat, i inici lent amb corpus grans. El timeout de 12 s és per petició, no per tota l’operació.

**Correcció:** `loadNotesPage` amb cursor estable, llistat de metadades i detall sota demanda; mantindre `resolveNote`, `updateNote` i el DTO que usa l’editor. Cursor sobre una clau immutable per al llistat o snapshot/versionat al servidor si és imprescindible ordenar per `updated_at`. Un cursor sobre `updated_at` mutable, a soles, tampoc promet una instantània consistent. `notesComplete:false` fins que el backend confirme final; deduplicació per ID i revisió, pressupost global de bytes/pàgines i cancel·lació. La cerca global requerix cerca al servidor o índex específic, no descarregar tots els cossos. `requires_human_decision: false` per límits/coherència; l’experiència de càrrega incremental s’ha de validar amb Claude.

### F6 · P1 · Mur i Multimèdia dupliquen treball i silencien errors parcials

**Evidència:** `content.js:19-24,78-86`: els dos mètodes criden `loadAppData()`, que llig tots els `app_content`, les últimes 50 submissions de totes les seccions i les últimes 50 notes privades. `App.jsx:483-495` munta estos providers i Notes des de l’arrel, siga quina siga la ruta. `opcional():15-18` transforma qualsevol error —incloent 401, 403 o timeout— en `[]`. Després el Mur torna `ready`. El límit 50 és global, no per secció, així que activitat de Multimèdia pot fer desaparèixer posts del Mur d’esta finestra.

**Impacte:** sobrecàrrega innecessària, notes privades transitant per codi que no les usa, seccions aparentment buides quan hi ha un error i absència de mecanisme per veure contingut anterior. No és prova de publicació pública de les notes: les respostes es descarreguen amb la sessió del propietari i els wrappers les descarten.

**Correcció:** consultes específiques per slice i secció, columnes explícites, paginació per recurs; habilitar càrregues quan s’usa la secció, mantenint les accions de publicar disponibles. Error de dades requerides visible; si es permet resultat parcial, un estat `degraded` declarat i recuperable, mai un `ready` buit indistinguible. Conservar el tipus `AbortError` en lloc d’embolcallar-lo a `loadMur`. `requires_human_decision: false`.

### F7 · P1 · La política barreja papers i la sessió externa encara no té compatibilitat acreditada

**Evidència:** `runtimePolicy.js:61-94` usa una sola funció d’origen per als missatges iframe i per a la Frontissa. Les entrades fixes per hostname s’accepten encara que `parentOrigins` s’haja configurat més restrictiu, i accepten altres ports HTTPS. `PedraSecaEmbed.jsx:165-205` usa la mateixa llista per backend, bot, relé i issuer. `runtime.js:42-44` envia el JWT al `supabaseUrl` resolt. `auth.js:11-24` tracta tot refresh token com si fóra de GoTrue i el POST de renovació no declara `redirect:'error'`, a diferència del transport general.

**Impacte:** confusió entre amfitrió autoritzat a allotjar, receptor autoritzat de credencials, API externa i emissor de tokens. Redireccions 307/308 del servei de renovació poden conservar el cos; no s’ha assajat cap redirecció real ni acreditat un domini compromés. Una sessió d’un issuer extern no serà acceptada automàticament per Supabase només perquè el frontend valide `iss`, `aud` i forma d’UUID.

**Correcció:** polítiques separades `dataOrigins`, `parentOrigins`, `sollutiaApiOrigins`, `relayOrigins`; comparació d’origen exacte, sense permisos implícits per hostname. Fixar l’origen de dades abans del muntatge i no deixar que atributs posteriors el substituïsquen. Autenticació federada o intercanvi de sessió al servidor de SdP verificat amb el proveïdor; refresh segons procedència. Afegir `redirect:'error'` al POST de renovació. El servidor continua validant firma, emissor, audiència i RLS; no convertir claims locals en autorització. `requires_human_decision: true` per dominis i acord d’autenticació real.

### F8 · P2 · Port de funcions, encara no port de semàntica

**Evidència:** `backendPort.js:19-46` valida existència, tipus de mètode i capacitats completes, i conserva `this`; és una bona base. No valida les respostes, errors, paginació, cancel·lació ni versió. `CONTRACTE_NUCLI` inclou mètodes d’implementació com `getRuntimeDataMode`, i els providers encara passen `config.supabaseUrl`/clau encara que no els interpreten. `NotesDataContext.jsx:96-100` deriva scope de `backendId` que `sanejaConfig()` no admet entre les claus del Web Component: canviar URL mantenint actor/tenant pot reutilitzar l’espai d’esborranys.

**Correcció:** composició interna de SdP, DTO propis versionats i errors de domini (`UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT`, `TIMEOUT`, `UNAVAILABLE`, `INVALID_PAYLOAD`, `CANCELLED`). Credencials encapsulades en l’adaptador; UI rep un identificador opac de backend i l’àmbit, mai decideix quin transport usar. Migració compatible i progressiva, no un segon port paral·lel. `requires_human_decision: false`.

### F9 · P2 · Les portes certifiquen menys del que prometen

`tractor-enxufe` dona verd E1–E4; `configura({backend})` ja llança al codi actual, però no hi ha prova E5 que impedisca llevar eixa denegació. Els comentaris llargs de `host.js:1-74` encara instruïxen Sollutia a injectar backend: contradicció amb l’executable. `tractor-adaptadors` valida una fixture directament amb el traductor, però no prova que `llig()` l’use; dona verd davant F3. La cerca F1 de la porta usa regex de `from` i no cobreix tot el graf (imports dinàmics, paquets SDK o reexports indirectes). `tractor-rls` és estàtic sobre SQL local: el seu missatge «zero forats» no acredita les polítiques desplegades.

Correcció: prova de contracte end-to-end de port a adaptador amb transport simulat i prova negativa de cada garantia; gate d’imports amb AST/resolució existent; CI amb els mateixos tests i fixtures versionades amb procedència. No afegir dependències: `@babel/parser` ja està instal·lat. `requires_human_decision: false`.

### F10 · P2 · Retenció i recuperació d’esborranys: límits que falten

`GlobalSaveManager.js:37-55` obri un cursor de tot el magatzem per recuperar un scope. IndexedDB es tanca en `finally`, que és correcte, però el cost és sobre tots els comptes acumulats. Notes fa `Promise.all([loadNotes,getDraftsForScope])`: si el magatzem està bloquejat o falla, les notes remotes tampoc arriben a `ready`. Els esborranys persisteixen en el navegador després de logout; no he trobat una política de retenció/expulsió en estes funcions. Les claus per usuari eviten col·lisions lògiques, però no aïllen dades d’altres scripts del mateix origen.

Proposta: lectura per rang de claus/index de scope, conservar esborranys pendents davant errors, degradació explícita de l’edició quan falla la persistència, avís i bloqueig del desat no fiable. Fixar retenció amb l’usuari; no purgar dades no sincronitzades a cegues. `requires_human_decision: true` per retenció en dispositius compartits, no per la lectura eficient.

### Allò que funciona i que convé conservar

- Notes disposa de `operationRef`, token i comprovacions després dels awaits, i verifica la resolució per ID. Les respostes d’escriptura d’una generació vella es rebutgen.
- `updateNote` filtra camps, usa revisió esperada i detecta conflicte; les migracions incrementen `revision` al servidor. No s’ha verificat l’aplicació remota de les migracions.
- `GlobalSaveManager` serialitza per clau, conserva esborranys en error i compara versions de camp dins d’una transacció. La retenció F4 no invalida estes garanties.
- El port rebutja getters i implementacions parcials, fa reemplaçament complet i es congela abans del muntatge.
- El transport Supabase neteja timeout i listener, espera el cos dins del timeout i denega redireccions. La renovació té comprovació `versioSessio` abans de desar per evitar restaurar una sessió substituïda.
- Els listeners de `useRecarregaExterna` es lleven en cleanup. No s’han confós resubscripcions amb fuites.

### Estrès teòric: magnituds calculades, no un benchmark de producció

Hipòtesis: N notes; pàgines completes de 50; latència L per pàgina; 10 KiB de contingut mitjà per nota, sense compressió. Per N múltiple de 50, `loadNotes` fa **N/50 + 1** peticions (l’última és buida). Per altres N, `ceil(N/50)`; N=0 també fa una petició.

| Escenari | Treball actual | Conseqüència prevista |
| --- | --- | --- |
| 1.000 notes, L=150 ms | 21 peticions seqüencials, 9,77 MiB de contingut | ≥3,15 s només en latència; parseig/render a banda |
| 10.000 notes, L=150 ms | 201 peticions, 97,66 MiB | ≥30,15 s; HTML, text de cerca i estructures afegixen memòria |
| 10.000 notes, L=1 s | 201 peticions | ≥201 s; cap pressupost global de càrrega |
| Inici amb sessió, N=1.000 | 1 Core + 3 Mur + 3 Multimèdia + 21 Notes | 28 peticions de dades, sense comptar rol, perfil ni xat |
| Canvi de ruta sense usar Notes | Providers de dades ja muntats a l’arrel | el corpus de Notes es carrega igualment |
| Canvi ràpid d’actor | abort de transport, però `quanLlest()` sense signal en Core/Mur/Multimèdia | esperes retingudes fins a arrencada; payload anterior visible en F1 |
| 50 submissions recents d’una sola secció | topall global 50 | altres seccions poden quedar fora de la finestra |
| 1.000 notes editades durant una sessió llarga | 1.000 entrades de writes i revisions | retenció reproduïda, sense mesura de heap |
| Error IndexedDB o pàgina repetida | Promise.all falla o bucle continua | Notes bloquejat o càrrega sense final |

Objectius proposats per validar, no rendiment ja assolit: pàgina inicial ≤50 metadades, una petició activa per recurs/àmbit, cap lectura de notes des del Mur, cos de nota sota demanda, zero dades d’un àmbit antic en el primer render del nou, límit explícit de pàgines/bytes i pantalla d’error recuperable.

### Model B i canvi de proveïdor: proposta d’arquitectura

`UI Pedra Seca → casos d’ús/port SdP → DTO i errors SdP → adaptador seleccionat per SdP → infraestructura`.

Separadament: `amfitrió Sollutia → API host (arrencada/config visual/sessió verificada)` i `lectures externes → Frontissa de catàleg → DTO`. El host no injecta una implementació executable. El backend autoritatiu actual continua sent Supabase de SdP. Si el Mestre vol que Sollutia el substituïsca, això canvia l’ADR; es tria un adaptador intern després d’aprovar la migració, sense reescriure components.

1. **Contracte SdP explícit:** versions semàntiques, tipus de dades i valors nuls, errors de domini, cancel·lació, revisions, paginació i capabilities; no spread del JSON extern.
2. **Composició única:** selecció interna al build o bootstrap de confiança, freeze del port i configuració de dades immutable; la superfície pública continua denegant `backend`.
3. **Traducció amb validació runtime:** fallar amb `INVALID_PAYLOAD` en un canvi incompatible; UI conserva últimes dades del mateix àmbit i oferix reintentar. Camps extra s’ignoren, camps requerits es validen. Un error controlat preserva l’aplicació, però no substituïx dades inexistents.
4. **Proves reutilitzables per proveïdor:** executar la mateixa bateria sobre adaptador Supabase i adaptador de prova neutral. Un canvi de proveïdor ha de superar-la sense editar JSX/CSS.
5. **Desplegament gradual:** fixtures anonimitzades amb procedència, captura canària, contractes al CI i rollback d’adaptador. Res d’escriptures creuades sense ADR.

Alternatives descartades: exposar `setBackendImplementation` a Sollutia (contradiu Model B i amplia confiança); reescriure contextos amb una biblioteca de cache nova abans d’acotar el contracte (cost i dependència sense resoldre el problema d’origen). D’ací a sis mesos, un catàleg curt i tests de contracte resultaran més mantenibles que una plataforma genèrica de plugins.

### Olivera i millora del prompt

La proposta visual de Claude pot avançar en documentació. Recomane coordinar `NotesContext` i `NotesEditor` abans d’implementar càrrega de metadades/detall, perquè són superfícies compartides. No cal canviar ara targetes, CSS ni la nomenclatura visual. No declare consens de Claude ni aprovació del Mestre.

El prompt rebut té rebut pendent, acceptació sense omplir i no designa explícitament el pla compartit existent. Millores: enllaçar pla i auditories vigents; comprovar els índexs després d’arxivar, no sols moure fitxers; incloure commit i hash del working tree, proves i criteris mesurables; distingir autorització d’auditar d’autorització d’implementar; no anomenar «inviolable» una cadena sense proves negatives; aclarir si «Model B» significa Supabase SdP autoritatiu o backend substituït. La telemetria ha d’admetre `no disponible` per tokens mesurats i model no exposat, sense inventar lectures.


### Rèplica després de llegir Claude (entrega 260924_0055)

L’informe [[260924_0055_auditoria_claude]] ja estava complet abans del meu tancament i s’ha llegit íntegre. La seua observació que el meu document estava buit correspon al seu tall anterior; esta versió ja conté troballes i proves. Les propostes són compatibles si la implementació visual conserva `currentUser` de `useSession`, `workspaceKey`, les accions del context de Notes i la resolució de detall per ID. La meua fase de paginació haurà de mantindre `subtitle`, `lead`, data/hora i etiquetes explícites en el DTO de resum perquè la Live Preview no depenga del cos complet.

Dos matisos per al pla: T4 pot passar `time={item.data?.formattedTime}` a la targeta activa sense afegir l’hora a la fila inactiva ni canviar el workspace; per a coherència, el rellotge arbitrari de `NotesEditor:105-110` no hauria de substituir l’hora de la nota. No ho implemente ni decidisc el redisseny. T0 descriu un bloqueig de la sessió de Claude, que no he reproduït en esta: `document.mjs create` i les proves han funcionat ací. **Un torn documental no és una lease d’alt risc** (AGENTS §15): discrepe de donar una allowlist ampla només perquè existix un torn. El diagnòstic ha de conservar l’ordre exacta, agent i motiu de denegació i arreglar el camí documental dins del seu abast, sense obrir mutacions genèriques. No trasllade el P0 de governança de Claude com un P0 de seguretat del producte.

No s’ha rebut una resposta de Claude a esta rèplica; el consens complet continua pendent.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Proves executades al codi del tall inicial:

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run --reporter=dot` | 20 fitxers, 82/82 proves passen |
| Node: backend_consolidacio + sistema_nervios | 25 proves: 16 passen, 9 fallen per catàleg de skills (`core-edicio-segura` no activa/identitat divergent) |
| Sondes forenses temporals amb Vitest | 7/7 passen, reproduint les fallades F1–F5; cap xarxa real |
| Frontissa proposada, Node | 9 escenaris verificats amb transport simulat |
| Sintaxi de proposta | 5 blocs JS/TS parsejats amb esbuild; no equival a integració final |
| `tractor-enxufe --json` | verd, zero infraccions declarades |
| `tractor-adaptadors` | verd, 1 fixture validada |
| `tractor-rls` | verd sobre 18 SQL locals; cap prova remota |
| `tractor-orfandat` | roig: 53 enllaços trencats i 5 orfes preexistents |

La primera execució de les sondes temporals no va descobrir tests pel desajust macOS `/tmp`/`/private/tmp`; corregida la ruta del runner, 7/7 passen. No s’ha alterat codi per fer passar cap prova. Les fallades del catàleg no s’han reintentat ni reparat fora d’abast.

Fonts primàries consultades per contrastar la proposta (no substituïxen l’evidència local): [React: useEffect](https://react.dev/reference/react/useEffect), sobre neteja i ordre d’efectes; [Supabase: JWT](https://supabase.com/docs/guides/auth/jwts), sobre acceptació de tokens externs; [PostgREST: rangs i paginació](https://postgrest.org/en/v10/api.html), sobre limit/offset i rangs. Les recomanacions concretes són inferències aplicades al codi de SdP.

Reproducció de les sondes: `node node_modules/vitest/vitest.mjs run --config /private/tmp/sdp-audit-260924/vitest.config.mjs` des de l’arrel. Es conserva el codi de les sondes més avall perquè `/tmp` no és un arxiu permanent.

<details>
<summary>Sonda: vitest.config.mjs</summary>

```js
export default { root: '/private/tmp/sdp-audit-260924', test: { environment: 'jsdom', include: ['*.test.jsx'], testTimeout: 5000 }, resolve: { alias: { '@': '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src' } } };
```

</details>

<details>
<summary>Sonda: findings.test.jsx</summary>

```jsx
import React from 'react';
import {test, expect, vi, afterEach} from 'vitest';
import {renderHook, waitFor, act, cleanup} from '@testing-library/react';
import {MurProvider, useMur} from '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/mur/MurContext.jsx';
import {MultimediaProvider, useMultimedia} from '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/multimedia/MultimediaContext.jsx';
const m = vi.hoisted(()=>({actor:'A', gen:1, loadMur:vi.fn(), loadMultimedia:vi.fn(), role:vi.fn(), user:{id:'A'}}));
vi.mock('/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/IdentitatContext.jsx',()=>({useIdentitat:()=>({actorId:m.actor,actorKey:m.actor})}));
vi.mock('/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/SessionContext.jsx',()=>({useSession:()=>({generacio:m.gen})}));
vi.mock('/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js',()=>({loadMur:m.loadMur,loadMultimedia:m.loadMultimedia,appendSectionSubmissionNetworkOnly:vi.fn(),getCurrentUser:()=>m.user,teCapacitat:()=>true,elMeuRol:m.role,refrescaSessio:vi.fn(),logout:vi.fn()}));
vi.mock('/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js',()=>({quanLlest:()=>Promise.resolve()}));
afterEach(()=>{cleanup(); vi.unstubAllGlobals();});
test('F1: Mur manté payload d’A mentre B carrega',async()=>{
 m.actor='A'; m.loadMur.mockResolvedValueOnce({feedPosts:[{id:'A-only'}]});
 const config={}; const wrapper=({children})=><MurProvider config={config}>{children}</MurProvider>;
 const {result,rerender}=renderHook(useMur,{wrapper});
 await waitFor(()=>expect(result.current.status).toBe('ready'));
 m.loadMur.mockImplementation(()=>new Promise(()=>{})); m.actor='B';m.gen++;rerender();
 await waitFor(()=>expect(m.loadMur).toHaveBeenCalledTimes(2));
 expect(result.current.status).toBe('ready');expect(result.current.feedPosts[0].id).toBe('A-only');
});
test('F1: Multimèdia ignora generació amb actor entitat estable',async()=>{
 m.actor='entitat::compartida';m.loadMultimedia.mockResolvedValue({mediaItems:[{id:'anterior'}]});
 const config={}; const wrapper=({children})=><MultimediaProvider config={config}>{children}</MultimediaProvider>;
 const {result,rerender}=renderHook(useMultimedia,{wrapper});
 await waitFor(()=>expect(result.current.status).toBe('ready'));m.gen++;rerender();
 expect(m.loadMultimedia).toHaveBeenCalledTimes(1);
});
test('F2: rol vell sobreescriu el nou per al mateix usuari',async()=>{
 const service=await import('/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/sessionService.js');
 let old,newer;m.role.mockImplementationOnce(()=>new Promise(r=>old=r)).mockImplementationOnce(()=>new Promise(r=>newer=r));
 service.sincronitza();service.sincronitza();newer('usuari');await Promise.resolve();old('superadmin');await Promise.resolve();
 expect(service.getSessionState().rol).toBe('superadmin');
});
test('F3: Frontissa deixa escapar origen i retorna JSON cru',async()=>{
 const {setRuntimePolicy}=await import('/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/runtimePolicy.js');
 setRuntimePolicy({auth:{issuer:'https://sollutia.cat'}});
 const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({secret_extra:'no filtrat'})});vi.stubGlobal('fetch',fetchMock);
 const {llig}=await import('/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/adaptadors/sollutia/client.js');
 expect(await llig('https://example.invalid/collect',{q:'synthetic'})).toEqual({secret_extra:'no filtrat'});
 expect(fetchMock.mock.calls[0][0]).toBe('https://example.invalid/collect?q=synthetic');
 expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
});
test('F4: gestor reté un Map per nota després de completar',async()=>{
 const {GlobalSaveManager}=await import('/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js');
 const manager=new GlobalSaveManager({persist:async(k,f)=>f({})});
 for(let i=0;i<1000;i++){await manager.write('n'+i,x=>({...x,title:'x'}));manager.setRevision('s','n'+i,1);}
 expect(manager.writes.size).toBe(1000);expect(manager.knownRevisions.size).toBe(1000);expect(manager.queues.size).toBe(0);
});
```

</details>

<details>
<summary>Sonda: paging.test.jsx</summary>

```jsx
import {test, expect, vi} from 'vitest';
const m=vi.hoisted(()=>({request:vi.fn()}));
vi.mock('/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js',()=>({ErrorSupabase:class extends Error{}, buildSeedAppData:vi.fn(),generateUUID:vi.fn(),getCurrentUser:()=>({id:'11111111-1111-4111-8111-111111111111'}),getResolvedConfig:()=>({runtimeDataMode:'remote',hasSupabaseConfig:true,tenantId:'22222222-2222-4222-8222-222222222222'}),request:m.request}));
import {loadNotes} from '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/notes.js';
const owner='11111111-1111-4111-8111-111111111111';
test('F5: servidor amb cap inferior a 50 es declara complet prematurament',async()=>{
 m.request.mockResolvedValue(Array.from({length:20},(_,i)=>({id:String(i),revision:1})));
 const r=await loadNotes(owner);expect(r.notes.length).toBe(20);expect(r.notesComplete).toBe(true);expect(m.request).toHaveBeenCalledTimes(1);m.request.mockReset();
});
test('F5: canvi entre pàgines provoca duplicat i es declara complet',async()=>{
 m.request.mockResolvedValueOnce(Array.from({length:50},(_,i)=>({id:String(i),revision:1}))).mockResolvedValueOnce([{id:'49',revision:1},{id:'50',revision:1}]);
 const r=await loadNotes(owner);expect(r.notes.length).toBe(52);expect(new Set(r.notes.map(n=>n.id)).size).toBe(51);expect(r.notesComplete).toBe(true);m.request.mockReset();
});
```

</details>


<!-- SDP:SECTION auditoria.s6 -->
## Límits

Revisió local, estàtica i amb proves simulades; sense test de càrrega sobre servidors, heap snapshot de navegador, prova de penetració remota ni verificació de les polítiques realment desplegades. La memòria descrita en MiB és volum teòric de contingut, no consum de RAM mesurat. No s’ha executat un build que regenere fonts. No s’ha canviat producte, CSS, SQL, dependències, secrets ni configuració de desplegament.

Falten contracte real Sollutia, prova d’autenticació federada, prova multiusuari amb RLS desplegada i consens de Claude sobre superfícies compartides. La proposta es pot revisar i aprovar, però no es declara implementada ni el sistema segur al 100%.

Tancament executat amb `node tooling/gates/tancament.mjs --check --turn-id torn_c1630ab1-a567-4435-b42d-4ebc4db3a853`: `valid:false`, `state:planned`. Passen plantilles, autoritat i integritat del LEDGER; fallen segell, catàleg de skills, Wiki estricta i SCC. El pla compartit preexistent té `type:plan`, `destinatari` fora d’esquema i no té rebut: s’hi ha afegit una rèplica sense reescriure les metadades alienes. Dos documents nous sí que passen `document.mjs check`. La primera comprovació també demanava el relleu al LEDGER; ja s’ha afegit amb conservació i hash verificat. No s’ha reconciliat el segell normatiu ni s’han tocat zones humanes per ocultar deute. Acta Marmota global pendent al final de conversa.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0045_pla_implementacio_arquitectura_codex]]
- [[260924_0035_pla_implementacio_disseny_claude]]
- [[260924_0045_prompt_arquitectura_codex]]
- [[260924_0055_auditoria_claude]]
