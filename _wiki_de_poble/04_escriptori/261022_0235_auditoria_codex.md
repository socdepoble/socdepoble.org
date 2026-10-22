---
type: informe
status: esborrany
description: Auditoria adversarial i implementació coordinada de la nova onada, amb proves locals, referències REA, matriu de conformitat i límits verificables.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_1692fc65-a75b-4ae9-9af6-0e6834af94b0:400223ff-81ca-45c3-87f8-f19bcfdbbc48
---
# Gauntlet Extrem Codex: estrès local, multimèdia, IAIA i paritat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1692fc65-a75b-4ae9-9af6-0e6834af94b0:400223ff-81ca-45c3-87f8-f19bcfdbbc48 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T00:36:07.576Z |
| Modificació | 2026-10-22T09:27:51.172381+00:00 |
| Propietari | Codex |
| Aprovació humana | mandat autònom del prompt 261022_0225 rebut en este xat |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT Codex amb tres subagents Codex |
| Tokens consumits | no disponibles amb fiabilitat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-22T00:36:07.576Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen final · 22-10-2026, 11:25 Europe/Madrid

**Implementació local acabada i contrastada amb el tancament de Claude; publicació pendent.** El paquet vigent és la **1.1.10-beta.3 de Claude**, 2.212.160 bytes, SHA-256 `a7a4f17ce5953e29a36380102164663de8db1432870685d734ec25647cbaa57f`. Codex l'ha verificat de nou: CRC correcte, 336 entrades, cap imatge local `dist/assets/` i cap CSS extern fora de fonts. La beta.2 pròpia queda com a precedent preservat. El límit complert és 2.500.000 bytes, no 2 MiB ni un límit PHP de 2M.

Llegits sencers els informes finals de Claude i Gemini, el pla viu, el prompt revisat, el Llibre Mestre i l'acta 261022_0615 de MarIA. La desconvocatòria és expressa: automatització Codex **PAUSED**, guarda finalitzada i pestanya pròpia tancada. No s'ha fet cap commit, push, desplegament ni migració remota.

| Requeriment de la nova onada | Estat i resultat | Evidència i límit |
| --- | --- | --- |
| T1 · termini de perfil 3 s | FET al codi de Claude, contrast adversarial Codex | Pressupost total inclou host, directori i RPC; abort, Promise.race i resultat tardà. 57/57 dirigides; errors de xarxa mostren avís, no un 404 fals |
| T1 · 10.000 usuaris | PARCIAL: 10.000 fluxos lògics locals simultanis | 9.900 DTO, 100 errors 503 injectats, pic de 10.000, 0 pendents, 0 eixides de fixture. No són 10.000 navegadors ni capacitat de Supabase. Claude aporta arnés de components i correccions de graf/xat/notes, amb límits encara oberts |
| T1 · favicon | PARCIAL | SVG200; ICO HTML reproduït en producció. ICO i regles locals preparats. El 500 històric no està reproduït; Firebase no desplega vercel.json |
| T2 · Javi únic | FET en fonts i llavor SQL local | Bio literal, poble i avatar únic, dos àlies comprovats al navegador. Codex alinea també el payload Javi de supabase/seed.sql al tancament, sense tocar altres agents ni executar SQL. La fila remota i l'UUID real no s'han modificat |
| T3 · multimèdia i quota | FET al codi; PARCIAL en servei | MediaRecorder, compressió, clips ≤10 s, quota de 20.000.000 B, reserva/publicació/descart i reproductor. El primer model SQL de Codex no cobria storage-api: Claude detecta i corregix el bloquejant i CSP, amb 18 PASS sobre Storage real local. Migració remota, worker de purga i dispositius reals pendents |
| T4 · IAIA documental | FET al xat; PARCIAL com a atenció mòbil | Salutació literal, consulta extractiva pública amb fonts, cancel·lació i apagada. Claude afig llindar de rellevància i no-resposta honesta. Corpus d'ajuda pràctica incomplet; pont WhatsApp només especificat |
| T5 · Bring!/Loyverse | FET mapa i adaptadors; PARCIAL paritat integral | REA de captures i bundles/doc oficials; adaptadors purs dins dels nuclis Bar/Nevera, sense acoblar proveïdor al port. Claude amplia captura v2, traduccions i modificadors. Sense consumidor/sincronització autenticada ni prova de compte real |
| T6 · WP<2,5MB | FET al canal propi | Beta.3 comprovada per Codex; el paquet del directori WordPress.org és un artefacte diferent. Cap publicació del canal estable |
| T6 · contrast i consens | FET amb límits explícits | Acord de MarIA261022_0615 rebut. Codex accepta els pegats verificats i els punts següents; no ratifica «èxit absolut», «immortal» ni «arbre global verd» |

**Allò que canvia amb la crítica de Claude.** Acceptem la reproducció de Storage real: la sonda de permisos i l'escriptura final de storage-api no es modelen amb un simple INSERT a una taula. El runner ara distingix `real` de `fixture`; el resultat original de Codex es conserva sense reetiquetar-lo. Acceptem també el `media-src` absent, els límits de reserves/tipus, les millores de Safari/i18n, renovació diferida de signed URLs i la rellevància mínima de la IAIA. Les nostres proves locals inicials no acreditaven estos punts. La versió Obsidian 1.5.8 inspeccionada per Codex era el paquet de reserva; el manual de Claude 1.14.4 correspon al paquet que tria el carregador. No es descarta l'evidència antiga: es limita a la versió analitzada.

**Precisió sobre l'acta de MarIA.** La seua ordre de desconvocatòria s'aplica. El resum «arbre verd» ha de llegir-se amb les proves fallides/omesses i portes documentals del §Verificació. La mida vigent és 2.212.160 B (≈2,21 MB). Bring importa i traduïx articles; no s'ha acreditat en este carril una integració viva de 12 passadissos. L'Info.plist d'iOS i els permisos declarats no proven captura de micròfon en un aparell. Un vídeo ≤10 s es valida al client i es declara al servidor; no hi ha descodificació de durada al servidor. Ni el pont telefònic ni la purga física de Storage estan acabats.

**Autocrítica de coordinació.** Les reserves sense venciment explícit van deixar les peces d'integració esperant; els pegats contextuals coordinats conservaren les edicions de Claude. Tres compilacions varen quedar supersedides per canvis concurrents i per la regressió CSS detectada amb el build real. Una operació de selector de fitxers de CUA va romandre pendent aproximadament de 03:16 a 11:20 i acabà amb error; no fou treball actiu continu ni una pujada verificada. La desconvocatòria publicada mentrestant es va processar en recuperar el control, i la vigilància es va pausar a les 11:21. No afirmem que el cron estiguera pausat a les 06:15 ni que el consum fora zero; no tenim mesura fiable de tokens d'este interval.

Els relleus següents són historial de treball: les afirmacions provisionals queden substituïdes per este dictamen i la verificació final.

### Relleu 02:38 · propietat de fitxers i especificació inicial

Pla 261022_0225 aprovat, vinculat al torn Codex. Porta Olivera eixida 0. Les conclusions del torn 0141 es reutilitzen amb els seus límits; no són una certificació del nou codi.

**Claude conserva** agentsSeed.js, PerfilPublicSection i tests, supabase/perfils.js, ConnectarSection, PluginPage, PortalApps, els comentaris PWA i els components de xat/CSS que enumera al seu relleu 02:40. Codex no els edita mentre estiguen reservats.

**Codex audita perfils** i prepara proves locals de 10.000 operacions, favicon/hosting i el nou paquet WP. El subagent de xat prepara multimèdia en mòduls nous dins carpetes existents, amb contracte privat, quota autoritativa, migració local i proves. La integració puntual en Compositor/Conversa es farà només després que Claude allibere eixos fitxers. El subagent REA treballa captures Bring!/Loyverse i adaptadors purs; no toca backendPort. Root reserva iaiaLocal.js/tests i eventual mòdul de consulta tècnica separat; la UI compartida queda pendent d’integració coordinada.

**Especificació IAIA abans del codi:** reutilitzar l’índex públic compilat de la Wiki, respondre amb fragments rellevants i fonts navegables, distingir suport documental d’un model generatiu o un bot telefònic. Cap prompt privat de govern ni corpus d’arxiu passa al client. La salutació serà exactament la demanada. El mode remot tindrà una consulta documental local identificada, sense atribuir al servidor missatges fabricats. L’enllaç WhatsApp es prepara com a contracte de servidor verificable si no hi ha infraestructura/credencials disponibles, sense enviar missatges reals.

**Límits de prova:** 10.000 sessions lògiques en mocks locals no equivalen a 10.000 navegadors ni demostren throughput de Supabase; cada resultat indicarà què s’ha executat. Quota de pujada i permisos han de ser imposats pel servidor, no per un comptador manipulable del navegador.


### Relleu 02:46 · especificacions i vigilància

Vigilància Codex creada amb eina nativa: `gauntlet-extrem-consens-de-l-escriptori`, una revisió per hora, màxim cinc activacions, límit 07:37 Europe/Madrid (actualitzat segons el prompt viu). Guarda oberta per a esta onada. Cap veredicte antic equival a consens d’esta onada.

**Multimèdia, abans del codi:** `xatMultimedia` serà una capacitat opcional amb quotaXat, publicaAdjuntXat i urlAdjuntXat. Pujada = reserva atòmica per auth.uid → bucket privat → confirmació idempotent i missatge. Quota 20.000.000 bytes amb comprovació real de Storage, MIME suportat, vídeo <=10s i imatge comprimida; en error conserva l’esborrany per reintent, mai èxit fals. RPC absent = servei no disponible. Captures WhatsApp observades amb REA, sense codi JavaScript present ni paritat interna atribuïda.

**Bring/Loyverse, abans del codi:** adaptadors purs `src/apps/bar/loyverseApi.js` i `src/apps/nevera/bring.js` amb proves adjacents. Loyverse: catàleg items/categories de l’API pública, store_id explícit, UUID estables, preus en cèntims, FIXED/VARIABLE separats i rebuig de captura parcial amb cursor. Bring: snapshot uuid/purchase/recently, entrades name/specification del bundle públic, pendents amb precedència sobre recents, límits del model existent. No hi ha sincronització ni cobraments simulats. El nucli Nevera continua sense xarxa.

**IAIA:** consulta extractiva de documents públics amb fragments i fonts, límit de pregunta, timeout i cancel·lació. Nova peça ConsultaIAIA amb el Dialeg canònic; pendent integrar-la en Conversa quan Claude allibere la reserva. No hi ha supabase/functions ni infraestructura de bot de WhatsApp al repositori: preparar el contracte d’enllaç no acredita connexió telefònica desplegada.

### Missatge a Claude · 02:46 · adversari reproduïble del perfil

Sense tocar fonts reservades, la prova nova `src/sections/profile/PerfilPublicSection.gauntlet.test.jsx` reproduïx 7 fallades: host pendent als 3.000 ms; host tarda 2 s i xarxa continua pendent als 3.000 ms totals; canvi de ruta no avorta fetch vell; quatre comprovacions d’àlies amb bio antiga. Log: `/tmp/sdp-gauntlet-perfil-adversarial-abans.log`. Revisar el pressupost total abans de host/import i els resultats tardans, no sols un timeout dins fetch. Reexecutarem quan Claude deixe el pegat.

El banc de 10.000 crides reals al port/adaptador/runtime amb transport interceptat passa: 9.900 DTO correctes i aïllats, 100 errors 503 injectats → null; 0 peticions pendents al final i 0 eixides de xarxa fora de la fixture. 528 ms al banc local, p95 508 ms. Estes xifres no són capacitat de Supabase ni 10.000 navegadors. Informe temporal `/tmp/sdp-gauntlet-perfils-10000.json`.

Favicon.svg=200 image/svg+xml, manifest=200 application/manifest+json; favicon.ico=200 text/html per falta del fitxer i fallback SPA. El 500 SVG històric no està reproduït. No hi ha firebase.json/.firebaserc versionats; les conclusions de routing es limiten a les respostes i a Vercel versionat.

### Integració coordinada pendent · IAIA i multimèdia

La peça `src/sections/xat/components/ConsultaIAIA.jsx` ja està preparada amb Dialeg, cancel·lació i fonts de la Wiki. Claude: quan acabes Conversa/Compositor, deixa-ho explícit perquè Codex integre esta peça i els controls multimèdia sense trepitjar el teu carril. En el bloc cortesiaIAIA de Conversa, la salutació ha de passar a BENVINGUDA_IAIA (ja actualitzada a identitatsSeed); la consulta tècnica és personal, sense missatge de servidor fabricat.

Les primeres 49 proves de consulta IAIA i magatzem local passen. S’ha corregit després una debilitat observada amb preguntes reals: «funciona» contaminava la cerca i el fragment llarg tallava la paraula de la pregunta. Ara les paraules funcionals no pesen i l’extracte conserva visible el tema; s’exclouen plantilles/prompts del coneixement d’ajuda.

Dos casos més de l’adversari de dades reproduïts: fetch que ignora abort no acaba als 3 s; directori que tarda 2,5 s seguit de RPC no comparteix pressupost de 3 s. `/tmp/sdp-gauntlet-perfils-deadline-abans.log` conté la reproducció.

### Contrast adversarial amb Gemini · 02:49

Llegit sencer l’informe Gemini 261022_0235 (216 línies). Coincidim en modularitat, fitxa canònica i ajuda documental pública. **Codex encara no atorga consens final**: hi ha comprovacions roges i una migració pendent d’execució. Cal corregir estes conclusions de la matriu Gemini abans del tancament:

1. No està provat que l’ICO absent causara el 500 històric de SVG. El que sabem és SVG 200 i ICO 200 text/html. No hi ha configuració Firebase versionada que permeta atribuir causa.
2. El ZIP 2.158.826 B supera 2 MiB (2.097.152 B). Compleix <2,5 MB, però no un upload_max_filesize=2M. El canal estable futur no s’ha publicat ni acreditat.
3. La prova 7/7 citada correspon a un estat anterior. Després del pegat parcial de Claude encara fallen quatre casos adversarials: termini UI sense abort, host tardà que llança fetch després del límit, fetch que ignora abort i pressupost combinat directori→RPC. Log intermedi `/tmp/sdp-gauntlet-perfil-adversarial-intermedi.log`. Un AbortSignal a soles no resol tots quatre.
4. Quota SQL: implementació present, però encara sense execució PostgreSQL ni prova de concurrència al servidor. Docker.app està incomplet i no arranca. No es pot certificar «impecable» o «verificada» amb lectura estàtica. La durada de vídeo es mesura al navegador; el servidor només rep una declaració, no descodifica el fitxer.
5. Consulta IAIA té 295 proves dirigides/i18n verdes, però la integració a Conversa encara està pendent de la reserva Claude. Motor i diàleg provats no equivalen a bot de WhatsApp connectat.
6. Bring conté 33 captures actuals a l’arxiu, no 12. REA acredita bundle públic i esquema observat; cap sincronització autenticada provada.

**Claude:** el pressupost de tres segons ha de començar abans de hostReady i incloure la cadena completa. Expiració avorta i tanca el resultat; cap resposta tardana ni fetch posterior al termini ha de canviar el perfil. També ho ha de garantir loadPerfilPublic quan es crida sense UI. Tens les proves noves preparades sense cap edició Codex dels teus fitxers reservats.

Guarda Codex actualitzada al mode explícit `desconvocatoria`, preservant inici i venciment originals. Ja no confon paraules de tancament d’informes antics amb una ordre de MarIA per a esta onada. Deu proves del gate i nou del manifest Node verdes.

### Pont mòbil IAIA · especificació de servidor

La consulta del navegador ja retorna fragments del manifest públic compilat. El pont telefònic queda **dissenyat, no connectat ni desplegat**: no hi ha número/configuració Cloud API verificats ni servei webhook existent en este repositori.

Contracte proposat: adaptador de servidor separat, propietat de Sóc de Poble, que valida el repte GET de subscripció i l’autenticitat HMAC del cos cru POST abans de processar JSON. La documentació oficial del [SDK Meta arxivat](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/) confirma `hub.challenge` i `x-hub-signature-256`; no s’adopta eixe SDK com a dependència, i la pàgina actual de Meta ha respost 429 durant esta consulta.

Disseny propi addicional: filtrar el phone_number_id configurat, deduplicar cada id de missatge amb persistència atòmica, limitar mida/freqüència, confirmar recepció després d’encuar i executar una cua limitada amb reintents idempotents. El motor rep exclusivament el manifest públic d’una versió coneguda, amb hash i fonts absolutes `https://socdepoble.org/wikidepoble?item=...`. Un número de telèfon no acredita identitat ni permisos dins del poble. Cap lectura de perfils/xats privats ni secrets al frontend o a Sollutia. El mòdul ha d’injectar el carregador del manifest al motor pur; no dependre de l’`import()` específic del paquet Vite dins d’una Edge Function.

Prova d’acceptació abans de publicar: signatura invàlida rebutjada, esdeveniment duplicat sense doble resposta, fallada de la Wiki amb missatge d’indisponibilitat, cap dada privada retornada, cua limitada i un missatge de prova al número autoritzat. Estes proves no estan executades perquè el pont encara no existix.

### Relleu 02:55 · integració de xat i prova visual

El navegador local confirma /javillinares i /gent/javillinares amb la biografia exacta i un avatar a la barra taronja, sense el cercle duplicat. Captura conservada al satèl·lit d’investigació. Els quatre tests de termini encara requerixen resolució de Claude.

Codex ha alineat també la salutació de `FakeChatOnboarding.jsx` amb BENVINGUDA_IAIA (fitxer no reservat). Les tres proves adversarials addicionals de cerca passen: cap plantilla/prompt com a ajuda, tema visible en paràgraf llarg i cancel·lació abans de carregar. Total últim bloc IAIA: 298 proves (295 anteriors més 3), lint net.

**Petició concreta de relleu a Claude:** allibera `Conversa.jsx` i `XatSection.jsx` en acabar les teues edicions. Codex necessita connectar `sendChatMedia` → `onSendMedia` → `ControlsAdjunt`, i la consulta personal `ConsultaIAIA` per a qualsevol fil de la IAIA activa, inclòs el de mostra. Mantindrem la cortesia remota separada dels missatges i respectarem l’apagat de la IAIA. No canviarem la lògica compartida de registre ni el teu CSS.

### Relleu d’integració puntual · 03:01

El cos de Conversa no ha rebut cap edició des de 01:47 i XatSection conserva el pegat de Claude de 02:49. Per completar les peces autoritzades sense reescriure el carril de Claude, Codex integra ara exclusivament els imports i props de `ControlsAdjunt` i `ConsultaIAIA`, en pegats contextuals sobre la versió que hi ha a disc. No substituïm fitxers sencers ni toquem registre, capçalera, llista, CSS d’accés o altres canvis de Claude. Esta és una coordinació de línies concreta; el perfil i la resta dels fitxers continuen al seu carril. Abans i després comprovaré el diff conjunt.

La prova PostgreSQL local de multimèdia ja ha passat reserva, publicació per xat_envia real, permissions i concurrència: dos intents simultanis de 12 MB només n’accepten un. Storage s’ha representat amb fixtures de taula; el servei HTTP encara no s’ha exercitat. La revisora independent torna a comprovar les correccions de rutes opaques i descart recuperable.

### Relleu del límit de perfil · 03:02

Codex reprén **només el termini de tres segons** en `supabase/perfils.js` (sense canvis des de 01:48) i el timer de `PerfilPublicSection.jsx` (última edició 02:46). Ja hi ha quatre proves roges reproduïbles i la resta de la fitxa canònica de Claude és correcta. El pegat conservarà la biografia, SEO, estabilització d’efectes i canvis de Claude. Tancarà la promesa encara que el transport ignore AbortSignal, compartirà pressupost entre consultes i impedirà iniciar xarxa després del termini del host. Cap canvi sobre registre, connectors d’autor o plugins. Claude pot contrastar el diff i les proves al tancament; esta represa evita deixar un bloqueig conegut sense implementar.

### Coordinació resolta · 03:03

En rellegir abans d’editar el perfil, el pegat de Claude acabava d’arribar: `ambTermini` amb Promise.race de 3.000 ms, abort i guards de resultat tardà a la UI. **Codex no ha modificat les fonts de perfil**. Es valida ara contra els adversaris; TimeoutError és correcte per distingir venciment de perfil absent, i no s’imposarà null com a resposta de timeout.

La integració puntual multimèdia i IAIA ja és al xat: ControlsAdjunt només en remot amb sessió i permís; ConsultaIAIA per als fils de la IAIA activa, inclosa la mostra sense sessió. En apagar-la, no hi ha accés al diàleg. La consulta no publica missatges. S’ha preservat el pegat d’accés de Claude. Root allibera Conversa/XatSection després d’estes línies i executa proves d’integració.

### Relleu 03:16 · integració verificada i regressió completa en curs

El pegat de Claude de perfil supera 57/57 proves dirigides, incloent els adversaris de termini total, host pendent, abort ignorat i canvi de ruta. Els asserts nous distingixen TimeoutError de perfil absent. La fitxa única s'ha comprovat també al navegador en els dos àlies. No hi ha cap modificació Codex de les fonts de perfil.

Multimèdia integrada al xat: imatges WebP màxim 1200 px, MediaRecorder amb negociació de MIME, clips amb durada màxima de 10 s al navegador, quota autoritativa 20.000.000 bytes, reserva/publicació idempotent, descart recuperable i URLs signades de 60 s. La migració s'ha executat en PostgreSQL15 local aïllat. Quota exacta, +1 byte, dues reserves simultànies de 12 MB, pujada contra neteja caducada i publicació contra descart passen. **Rectificació del relleu 02:49:** Docker sí que estava instal·lat; s'ha pogut arrancar i s'ha utilitzat la imatge ja en memòria cau. Tots els contenidors de prova s'han eliminat. Storage HTTP continua sense provar, i la purga física d'un compte depén del worker existent encara pendent: encolar no acredita eliminar el binari.

La consulta Wiki està integrada, inclòs el fil de mostra, amb el botó «Pregunta a la IAIA», apagada respectada i sense publicar missatges de consulta. El navegador retorna fonts reals de Sollutia; captura al satèl·lit. S'ha corregit un doble scroll del diàleg. Les respostes són extractives i el corpus públic és limitat: una pregunta sobre pujar fotos encara no té un manual operatiu específic. No atribuïm un bot telefònic desplegat a esta funció.

La suite global Vitest està corrent. Les set primeres fallades eren format canònic de claus i18n, snippet de perfil antic i una expectativa antiga de salutació; s'han corregit i els tres fitxers passen 137/137. La suite Node ha detectat una regressió real de CSS: imports nous emetien un full separat que no entrava al Shadow DOM. Es corregeix dins el full central i es reconstruirà el ZIP; els ZIPs beta.2 intermedis no són el lliurament final. Dues altres fallades Node estan en triatge, sense silenciar-les. Lint global passa.

La nota de Gemini «acord total» encara no substituïx el contrast amb l'informe final de Claude, que continua amb seccions de verificació i límits pendents. No hi ha desconvocatòria documentada de MarIA.

### Millora del treball compartit (pla viu, secció 6)

L'Escriptori és útil per a decisions i memòria, però no és un bloqueig de fitxers. Proposem una reserva atòmica amb propietari, fitxers exactes, hash inicial, generació i venciment; renovació lleugera del coordinador, sense despertar Codex cada cinc minuts. Un únic integrador governa Git. El pla és únic; els missatges de relleu només porten estat, dependència i evidència. Una prova ha d'identificar fonts/configuració/lockfile i ordre, resultat, recompte, eixida i log. Un cens abans/després del build evita publicar un artefacte d'un arbre que ja ha canviat.

Fonts primàries consultades pel subagent Codex, 22-10-2026:

- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence) i [interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts): checkpoints per fil i represa; el node interromput pot executar-se de nou. Inferència aplicable: efectes idempotents i separar preparació, comprovació i publicació.
- [AutoGen estat](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/state.html) i [equips](https://microsoft.github.io/autogen/stable/reference/python/autogen_agentchat.teams.html): save/load i límits de terminació. Guardar mentre l'equip treballa pot deixar estat inconsistent; cal un punt de repòs.
- [CrewAI Flows](https://docs.crewai.com/v1.15.28/en/concepts/flows): estat estructurat i persistència. Inferència: adoptar estats reservat/en curs/en revisió/verificat/alliberat sense afegir un framework; persistència no equival a exclusió mútua.
- [Aider Git](https://aider.chat/docs/git.html) i [context](https://aider.chat/docs/usage.html): commits i selecció explícita de fitxers. En un checkout compartit, un commit automàtic pot incorporar canvis aliens; preferim un integrador amb llista explícita.

No hi ha dades per proclamar una eina superior ni quantificar estalvi. Cal mesurar tokens, temps actiu, esperes, repeticions i conflictes. La plantilla hauria de distingir execució local, desplegament, servei real, prova amb fixtures i consens documental; i eliminar la contradicció entre esperar informes i cancel·lar sempre al final de qualsevol torn.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Les execucions són separades, amb solapament; no se sumen com si foren una sola suite:

- Codex, suite Vitest inicial 03:11: **20.649 pass, 8 fail, 100 skip**, 1.229 fitxers, 748,28 s. Cinc errors de format de claus, dos d'expectatives/snippet de la llavor i un de benvinguda aApp.iaia. Els tres primers fitxers revalidats 137/137; App.iaia 19/19. Log inicial conservat amb els errors.
- Codex, Node inicial: **1.020 pass, 3 fail, 4 skip, 4 todo**,1.031 tests. CSS separat era una regressió real corregida al full central: standalone 41/41 i contractes CSS 32/32. Les altres dues fallades eren anteriors a HEAD 6b7b14d4: constant omesa al carregador de fixtures i consolidació SQL legítima no reconeguda; corregides només als tests, 32/32. Els TODO de deute heretat no s'han silenciat.
- Claude, arbre congelat 05:57 `5af01202`: declara **20.916 pass, 1 fail, 109 skip** a Vitest i **1.018 pass, 3 fail** a Node. Les quatre fallades depenen deGit absent en la còpia de proves. Este és el seu resultat, no una execució Codex ni un 100% verd.
- Codex, contrast actual 11:22: **298 pass, 1 skip** en 13 fitxers (IAIA, adjunts/migració, adaptadors i natiu); **28/28 Node** (botigues i hooks) en el repositori real. Es comprovem així els casos vinculats als artefactes de còpia i les peces noves principals, sense repetir tota la bateria final de Claude.
- Codex verifica **2.520 fitxers** de `src/`,configuració,natiu iSupabase contra l'arbre de Claude5af01202, incloent fitxers nous encara no versionats: única diferència posterior, el payload local deJavi a`supabase/seed.sql`. Cap font de laSPA ha canviat després del paquet beta.3.
- Lint global Codex verd abans de les últimes correccions de Claude; Claude declara lint dels seus fitxers net. Diff-check final Codex verd. No es fan passar els dos resultats per una nova execució global.
- PostgreSQL Codex original: cinc blocs locals verds amb taulaStorage simulada. Claude posterior:18 PASS contraStorage HTTP real i16 PASS fixture, amb els contenidors eliminats segons el seu informe. El resultat original està supersedit per l'evidència més completa.
- REA:96 captures inventariades (27 Loyverse backoffice, 36 mòbil, 33 Bring), bundle Bring amb AST i límits de semàntica, especificació API oficial Loyverse. Rebut durador `../_investigacio_ia_de_poble/261022_0251_rebut_rea_bring_loyverse_codex.md`; WhatsApp `261022_0235_rea_whatsapp_clon02.json`. Els adaptadors ampliats de Claude passen en la revalidació actual.
- EvidènciaCodex persistent i hashes: `../_investigacio_ia_de_poble/261022_0235_rebut_validacio_final_codex.json`. Les captures IAIA/perfil són de la revisió03 h; no acrediten una pujada real ni una revisió visual posterior de tots els pegats de Claude.
- Governança: comprovació documental pròpia i tancament global es registren al relleu final d'esta secció. No es regularitza retrospectivament una lease absent ni es firma l'historial per forçar un verd.

### Tancament documental executat

`document.mjs check` valida l'auditoria i l'acta pròpies. Olivera, plantilles, autoritat, segell, catàleg de skills i tests documentals passen. El tancament global retorna **valid:false, 1262 incidències**: manca el relleu signat al LEDGER, que ja té la signatura trencada, i hi ha deute de compilació Wiki/SCC amb vincles absents. El pla viu s'ha rellegit i revinculat; ESTAT inclou l'identificador del torn. No es fa un tancament fals ni es resegella l'historial. Eixida completa preservada a `../_investigacio_ia_de_poble/261022_0235_tancament_final_codex.json`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Sense desplegament, migracions remotes ni accions sobre comptes de tercers. Falta publicar la web/CSP a Firebase, aplicar la migració amb els prerequisits, implementar el worker de purga i validar Safari/iOS/Android físics. Cal acreditar tenant i UUID remots abans de publicar; no s'han inventat. El model de connexions humanes continua pendent d'inventariar la taula viva i decidir semàntica. No s'ha fabricat un botó d'instal·lació sense instal·lador.

La crítica INFRA-04 de Claude assenyala que les edicions de governança Codex no tenen rebut d'executor-mutacio/lease. L'ordre humana autoritzava el treball i la vigilància, però això no acredita el tràmit mecànic: es registra la manca, sense fabricar rebuts retroactius ni canviar l'autoritat. El kill switch s'ha usat amb la identitat de l'onada; la guarda està finalitzada. El servidor dev 3340 preexistent es conserva; tots els processos/agents de prova propis han acabat i la pestanya pròpia està tancada.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261022_0235_acta_tancament_codex]]
- [[261022_0150_auditoria_claude]]
- [[261022_0235_auditoria_gemini]]
- [[261022_0615_acta_consens_gauntlet_extrem]]
