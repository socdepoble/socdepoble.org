---
type: acta
status: esborrany
description: "Onades7–21: kits CAS, Llibre literal, servidor Node0, IAIA/RAG local i proves rurals; procedència i portes externes per a Claude i MarIA."
tags:
  - acta
visibility: private
reflex: sdp:torn_5d5a6b5d-3473-409d-9fc6-221d10f16b66:aacdcb34-0f7d-4ca6-90f3-e7afa7e2b216
---
# Onades7–21 de Codex: kits CAS, Llibre literal, Node0 i memòria rural local

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5d5a6b5d-3473-409d-9fc6-221d10f16b66:aacdcb34-0f7d-4ca6-90f3-e7afa7e2b216 |
| Versió del document | 1.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-03T05:32:03.761Z |
| Modificació | 2026-11-03T12:22:40Z |
| Propietari | Codex |
| Aprovació humana | Ordres directes del Mestre Onades7–21 i Node0 físic/IAIA cultural, sense confirmacions intermèdies. |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | GPT Codex, agent basat en GPT-6; backend exacte no exposat per les eines. |
| Tokens consumits | No disponibles en la telemetria del torn. |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 4d4b9d269e40c3084dead7c3f14cf63dd58fd4a7e7f4d075d2d09ef90f8a6d48. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-11-03: ampliació explícita O7→O8–9, construcció aïllada, revisió adversarial, kits CAS i relleu documentat. Procedència i límits conservats.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### Construcció, còpies i límits d’escriptura

Inici del torn a les 05:22 CET, sobre HEAD `1620efcc0c0919a557130d785f39a2358f335639` v1.1.0. L’ordre inicial O7 es va ampliar explícitament a O7–O9 amb el prompt de les 05:22. El pla físic s’ha ampliat i relligat. S’han llegit BIOS, sdp-workflow, Acta Marmota anterior, ESTAT, prompt i Llibre Mestre íntegres. Candidats `/private/tmp/sdp-codex-o7/candidate` i `/private/tmp/sdp-codex-o89/candidate`, base immutable a `/private/tmp/sdp-codex-o7/base`. La base no conté `.env` real i no s’han llegit secrets. Dependències existents reutilitzades, sense instal·lació nova.

Tres carrils paral·lels Codex han construït Llibre/Cua, Consola/Nix i Wiki/Persistència; l’arrel ha integrat l’enxufe i ha coordinat revisions creuades. Cap agent no és Gemini ni Claude: no s’ha presentat la revisió interna com el consens final del Consell. Claude conserva el rol d’àrbitre i materialitzador. MarIA ha canviat fonts de Consola, skills, índex, LEDGER i torns al viu mentre treballàvem; eixos canvis s’han preservat. Les preimatges dels kits continuen apuntant al baseline, sense forçar ni absorbir autoria aliena.

### Llibre Mestre, Consola, Wiki i Versions

Les 154 files del Llibre (64 idees,25 P0,48 P1,17 P2) conserven IDs, ordre i cites exactes. La preimatge de241.976 B es conserva literal al satèl·lit d’arxiu, SHA `c180c707658f7a3940b040de40f93a1b821bcc80573eef8da73534274d8cfe02`. Les359 cites s’han contrastat amb fitxer/línia/hash de1620efcc0. L2 b, D-T3-1 i L2-A1/A2 ja estaven resolts al baseline:106 proves dirigides ho acrediten, i no s’ha introduït un segon pegat. S’han rectificat atribucions inicials errònies de diverses Idees i s’han mantingut pendents humans/remots i propostes.

La primera destil·lació va canviar indegudament noms de capçalera i columnes de la matriu. La revisió de l’API real `fonts-govern.mjs` ha detectat la regressió: un test contra la fixture sintètica no la veia. S’ha afegit una regressió contra el **Llibre real**, restaurat el contracte de matrius i mantingut el criteri tancat de FET+commit comprovat. Els literals qualificats no es promocionen a un verd global. Les versions provisionals dels kits es conserven marcades com a no aplicables.

La CLI nova de mapa tanca administrativament leases>24 h i expirades amb lock/CAS,56 en el candidat inicial, sense fabricar verificacions ni rebuts. Import/HTTP continuen read-only. Els arnesos usen traces datades; el dispatch real del client Codex requerix procedència i no es prova només amb tres línies `status=ok`. El mapa viu observat a 06:30, després dels canvis de MarIA, retorna0 avisos; es conserva com a observació datada, separada del nostre assaig anterior amb alarmes reals. El LaunchAgent d’higiene tenia exit78 per TCC sobre el log de Documents; el canvi de stdout/stderr cap a Library/Logs queda en CAS extern, sense recarregar serveis ni crear cap cron.

Wiki:54 Markdown editats,217 paràgrafs llargs amb 6–8 strong i 687 curts sense farciment. Text base i codi preservats; les carpetes vigents són01_ser/02_saber/03_actuar/05_social i no s’amplia la publicació de contingut privat. El consumidor Markdown reparat manté llistes numerades entre blocs, OLstart, anidament, enllaços al començament de paràgraf i èmfasi entre línies. Metadata ISO passa a H3 mantenint l’aparença. Compilador estricte82 documents/9 categories/0 enllaços trencats. Certificador de ruta local1/1; no certificació HTTP remota. Navegador mòbil real:1–10 numerat,69 paràgrafs llargs ambstrong6–8, cos16,1512 px/25,8419 px sense desbordament.

Versions passa aWP 1.1.12 amb la publicació SVN declarada pel Mestre, preservant història i altres claus PAGE_COPY;54 proves dirigides. El fuzz global ha exposat un defecte O6 de regex en l’extracte de cerca: escàner lineal substitut, control roig al baseline i 230 proves dirigides verdes. Huit Finder residuals tenen retirada reversible amb preimatge, inclosa exclusivament la metadata Finder de producció autoritzada.

### NixOS, persistència, cua i enxufe

Façana NixOS amb domini, municipi string o objecte amb nom complet i interruptors independents ActivityPub/OpenData. Reutilitza flake/mkWeb arrel, package-lock, generador de federació, Nginx i política de seguretat. WebFinger/NodeInfo/actor són estàtics i de lectura; POST405 abans de rewrite, rutes desactivades404, CORS públic sense credencials. Nixpkgs fixat a revisió immutable; paquet OpenData verificat i d’un sol municipi, amb autoria/procedència/bytes preservats. Nix no instal·lat: lock/eval/build/rebuild/VMHTTP estan preparats però no executats. Dos builds Node equivalents, en paths/TZ diferents, donen1.053 fitxers idèntics; no es presenten com a certificació Nix.

Persistència rural per a bans, notes, directori, calendari i catàleg: IndexedDB atòmica, adaptador de memòria injectable, quatre dimensions d’abast, quotes, timeout i cancel·lació. Snapshot versionat SHA-256, primitius estrictes i objectes plans sense getters/prototips/camps secrets. Confirmació en oncomplete, digest fora de transacció i CAS després del digest abans de restaurar. Cap fallback silenciós a memòria.

Cua create/update/delete amb prevHash, HLC monòton, context causal, ancoratge ACK durable després de podar i lease entre instàncies. Reintents conserven opId i exigixen replay remot idempotent amb ACK exacte; una RPC ordinària no es repeteix. Errors auth/validació/protocol bloquegen fins a reanudació explícita. LWW per camp i conflictCopy de text concurrent preserven memòria; HLC no acredita causalitat desconeguda i SHA no autentica l’autor.

Enxufe opt-in sense tocar backendPort ni activar res per defecte. Lectures seleccionades amb selector complet, epoch durable entre pestanyes, invalidació de cau després de mutació directa i sense fallback401. Notes offline només amb descriptors i replay injectats. E01–E06 corregits: selectors, contaminació de detall, lectura antiga, passthrough sense invalidació,401 i descriptor auth. La llista de lectures és tancada: loadNotes/loadMur/loadCoreContent. Auth, Xat i NetworkOnly no poden convertir-se en cau per configuració. Desconnexió: destroy i port original; sense polling ni timers recurrents. Els terminis acotats es cancel·len.

### Proves i honestedat del tall

Passada O8/9 final:113 passades,0 fallades,1 omissióNix; lint net. Replay CAS del payload real:104 passades+1 omissió en les quatre suites pròpies. CLI9/9 amb controls negatius. Navegador Chrome156:7/7 amb IndexedDB nativa, reobertura,30 transaccions concurrents, snapshot alterat, identitat, reinici/ACK/idempotència, event online i descriptors auth/NetworkOnly rebutjats abans de cridar selectors o cau. Transport remot simulat; dades UUID de prova. Les dues fixtures públiques temporals s’han retirat després de comparar hashes; no s’ha tocat el servidor viu que ja estava escoltant.

La passada Vitest O7 completa inicial té31.282 casos:31.157 passats,13 fallats,112 pendents/omits. Errors de React per symlink reexecutats amb NODE_PATH:408 passats+1 omés/0 fallats. Correccions ISO/Consola/cerca reexecutades:114/114 als cinc fitxers afectats. Telemetria no pot obrir socket: listen EPERM127.0.0.1, quatre casos no executats. No hi ha una passada global final tota verda. Build web seed sintètic complet:235.780 B gzip d’entrada<250.000. Frontissa16/16 i portes documentals amb límits al rebut de tancament.

### Termodinàmica, decisions i automillora

El Mestre ha declarat que dormia. No s’han fet preguntes, permisos interactius ni automatitzacions noves. S’han resolt autònomament les decisions reversibles i s’han deixat les execucions externes a MarIA amb preimatge i motiu concret. No s’inventa una duració d’«una nit» ni un estalvi humà quantificat: el temps del torn consta als rebuts i les mètriques de tokens no estan exposades.

Lliçó principal: una auditoria fila per fila necessita provar també els consumidors mecànics del document real; preservar IDs no garantix que una API entenga capçaleres o vocabulari nous. Segona lliçó: un rellotge només en memòria no protegix dues pestanyes; l’epoch ha d’estar en la mateixa transacció que la cau. Tercera: un descriptor de desenvolupador no ha d’ampliar la frontera de privacitat que el README promet. Les regressions negatives passen a les suites permanents del kit.

La plantilla d’Acta és útil per a procedència i continuïtat. Es proposa a MarIA afegir camps estructurats de manifest final, preimatge, activació, omissions i autoria de canvis concurrents per reduir repetició narrativa. No s’ha modificat la plantilla ni cap skill en este carril. La taula DAFO D01–D15 conserva el mapa de dimensions canònic i porta pendent a cada dimensió; cap 10/10 global amb omissions externes.

### Ampliació O10–O21 · tall de resistència de les12:17CET

La marató de sis hores comença realment a05:53:32UTC i no acaba abans d'11:53:32UTC. Deu fases construïdes i auditades; fase11 de regressió/resistència activa en este tall. Arqueologia només en lectura dels dos projectes antics: informes separen codi funcional, esborranys, simulacions i vulnerabilitats. Les fonts antigues no s'han executat ni han passat a una ingesta privada automàtica. L'host de laboratori és arm64/32GiB amb Node24.13; el Mac mini M4 de24GB/512GB declarat pel Mestre encara no té instal·lació física atestada.

El Llibre preferit ara és la variant literal de276.861B, SHA `792bd163937053faf974f0722a632e7c86a5c319baec2ba564454eb84feff4fa`:154IDs, visions,284ocurrències de commits i Protocol d'Herència preservats; estats antics i359cites en annex. Reconstruir les154cel·les recupera exactament la preimatge. Els sis avisos eren àlies wiki mal interpretats pel lector, reparat amb21proves.90files de matriu,17FET/64PARCIAL/9PENDENT i0avisos. Els suplements3paths/272pins són alternatives segons preimatge original/postO7, abans d'O10; no imposen la destil·lació93KB que l'àrbitre rebutjà.

O89 final és E07, manifest `5a52341c814b17d8a18e8ded7effb60515dd6227ffa3f1060384a6b94688404d`: tanca el bypass de clau `__proto__` normalitzada,114proves passades/1omissióNix i navegador IndexedDB natiu8/8. E06 queda conservat com a provisional no aplicable. El paquet O10 posterior reemplaça només l'enxufe explícit que corregix i manté les altres precondicions de la base composta O7→E07→Llibre literal.

Node0 inclou store CAS/fsync, autorització Ed25519/anti-replay, RPC i ACK signats, cua causal/idempotent i conflictes preservats, relay autenticat, SSE amb membresia/revocació/seq i sense autoreconnexió. El Gauntlet ha reproduït ACK fals, clocks sense causalitat, bloqueig de places RPC per streams, resultats tardans després de hooks i errors de relay; els controls rojos i correccions queden conservats. Nucli26implementats/6proveïdors sense configurar; conformitat canònica30correctes/65omissions, no95casos complets. Sis morts SIGKILL amb testimonis fsync no equivalen a un tall elèctric. Les8.192parelles concurrents+256sensevectors verifiquen preservació del text, sense afirmar CRDT universal.

IAIA extractiva local funciona amb SQLite FTS5/BM25/vector lèxic128 no neuronal, corpus públic/privat físicament separats, workers acotats i citesSHA. El corpus sintètic gran ha acabat:80.000documents,2.293.760.000B de text, índex4.979.879.936B i282.507,7965ms d'importació. Un segon verificador contrasta índexs/TF/DF/FTS, integritat i cites contra el JSONL. Consultes rares43,817–49,970ms; comuna1.302,408ms. La guarda de7bytes elimina un DELETEFTS sense efecte per a IDs nous; control menut8,60×, sense extrapolar-lo. L'assaig antic lent s'ha aturat amb eixida143 i es conserva com a prefix parcial, mai PASS. Ollama/MLX són opcionals loopback; cap model ni absència d'egress extern acreditats.

El kit final O10 congelat té79paths/40pins, manifest `c6bdaf4238b15da90b6a7bd4bf051a95107ba37365819b12cfdd906aca9e8408`, inversa `f4e4d71e1262a47210ca593fd1ae2ddd9ecbc7b292377f3eb74082c485ac109c`. Replay fresc:417PASS/2SKIPNix,9controlsCLI, negatius sense mutació, arbre complet/modes restituïts; apply3,006782s i reverse2,530777s, cleanup de directoris nous buits separat. Paquet natiu31fitxers/408.895B, manifest `3e330cae8e40bcdc2bc2597e5bedfd72f7bd9deae660d1a33bcfa965315e0a87`: dos paths/fusos idèntics, init/checkcleanenv i tamper rebutjat abans d'importar. No hi ha daemon instal·lat ni claus reals al lliurament.

Build final després de la resistència passa amb79payloads/40pins estables, Frontissa16/16,92Vitest/30Node dirigides i enllaços estàtics82/82+Fed33/33. JSON públic20pins, SHA `6090aa09fb7ee42fc567b349f2fb0bb7cf41a09ac319fd90142c5dc9afbfcb60`, idèntic a dist. Quatre casos independents passen també amb HTTP TCP real efímer de loopback després d'aprovació automàtica del sandbox: notes/CAS/aïllament, restart/replay, pin/nonce i logout. El primer harness oblidava Content-Type i s'ha corregit per igualar l'original; cap font del producte ha canviat. La passada Vitest global actual encara s'executa; els rojos globals anteriors continuen visibles.

La pàgina `/fediversity` incorpora el pilot declarat, els límits d'Apple4W16/256, l'arquitectura replicable i assistència generativa. QA real390/1280px, fonts carregades, cos16,3984/20px i cap overflow sobre article/sanejador/CSS reals; no tot el PageFrame. OPFS real7/7 amb namespace sintètic retirat. La beca50.000€ no està concedida ni s'ha presentat cap nou escrit. La políticaNLnet2.0 i la transició1.1 requerixen comprovar el cas concret; zero hores generades imputades com a treball humà subvencionable. Nix real, model, dispositius, TLS i integració de Claude romanen portes externes. Cap10/10global sense estes proves; cap cron, heartbeat o timer recurrent nou.

### R2 i regressió final · sis hores superades

El manifest O10–O21 de lliurament és ara `4377883ae7658dd1c260282b49fb1d5e7f56f0bf6b6d258221c6ea81303bc5ac`, inversa `ab6b7d16aadc923357a85363621f480e2ec439fa64ea2b488e6f38fd1955f5c1`,79paths/40pins. El c6bd… anterior és històric: el rerun amb guarda nested va trobar416PASS/1FAIL/2SKIP perquè una prova nostra aplicava5ms també a l'encaixada criptogràfica real, abans de l'assert. S'han fet deterministes només tres casos del fitxer de prova existent, sense tocar runtime ni ampliar cap termini: rellotge lògic, timers curts capturats, avanç20ms contra5ms i zero callbacks de timer en els dos casos tardans; fetch inert abans del timeout, zero fetch tardà i destroy/AbortError continuen comprovats.20casos conservats,17cossos byteidèntics, assertions78→93.20/20 i revisió independent3/3; preimatge i roig conservats.

Replay R2 fresc amb nested guards:419casos/417PASS/2SKIPNix/0FAIL,9CLI, controls negatius, arbre complet/modes/pins exactes. Apply1,557912s i reverse4,370939s; cleanup dels tres directoris nous buits8,566222s separat, total153,249534s amb còpies/proves/inventaris. No es declara restauració completa del disc en5s ni temps universal. Build R2 posterior:235.764B gzip,92Vitest/30Node, Frontissa16/16 i enllaços estàtics82/82+Fed33/33;79payloads/40pins immutables després. JSON6090… a dist idèntic i paquet natiu3e330…/31fitxers/408.895B intacte.

La global actual acaba amb31.626casos:31.515PASS/1FAIL/110SKIP i dos fitxers rojos. Telemetria registra hook10s i listenEPERM; reexecució aprovada loopback sintètica4/4PASS. Els15Node abans bloquejats pel bind passen15/15 en env net. PluginPage continua roig al global i primer aïllat: DOM Suspense sense H1. App/test/component són idèntics a1620; scratch amb espera3/3, original posterior3/3 i baseline O7original3/3. Causa exacta pendent, sense waiver ni verd global. Les3.659fonts eren exactament iguals durant la global; l'únic canvi posterior és el test Node anterior, exclòs de Vitest i cobert pels419casos nous. Els recomptes de passades diferents no se sumen.

Ara hi ha també8execucions TCP reals de les assertions originals:4RPC i4SSE, no huit casos únics nous. Cliente real, signatures Ed25519, store JSONCAS, membresia/revocació, seq i quota verificats amb localhost lògic cap a127.0.0.1 efímer. Cap DNS extern, TLS, dispositiu remot ni SQLite en estos huit casos. La carpeta OPFS sintètica i les fixtures web pròpies s'han retirat per hash; cap producte viu escrit.

El publicador nou s'ha reforçat abans de dipositar: pla explícit de manifests/inventaris, SHA i modes comprovats dels bytes realment llegits, extres rebutjats, destí exclusiu i manifest instal·lador l'últim. Paquet copiat en quarantena0700; només el FD del seu inode acreditat passa a0755 després dels31fitxers exactes. `init/check` de la còpia usa estat sintètic privat fora del kit, sense listener/model/grants. Helper51bf315a…té4negatius i3reproduccions roig→verd de FD alié/deadlines; les preimatges insegures queden marcades noaplicables. El rebut `published-native-package-check.json` documentarà la comprovació efectiva dins del dipòsit, separada de l'assaig.

L'Acta contemporània de MarIA [[261103_1228_acta_marmota_oli_de_la_torre_node0_i_relleu_fresc_taules_rebost]] informa hostingCaddy Node0 actiu. La consulta pública LAN `/v1/manifest` no connecta des d'esta superfície; això no prova que l'amfitrió estiga caigut, ni atesta desplegament d'este mòdul Node0/RAG. IDEA68 és posterior al baseline i s'ha de conservar en el rebase literal. Auditories Claude/Gemini rellegides i pinades,13P1 originals9tancades/4noaplicables; cap consens inventat ni apropiació dels casos d'un altre kit.

Sis pins d'evidència dels cicles havien evolucionat: un snapshot exacte recuperat, cinc originals no retinguts. La conciliació conserva els SHA antics i identifica successors actuals sense fingir reconstrucció. La release R2 té fonts/proves completes; no refà retroactivament eixos cinc rebuts. Sis hores efectives superades des de05:53:32UTC, sense cron, heartbeat o timer recurrent; l'hora exacta del cicle12 queda en `cicles.json`. El tancament documental continua separat del constructor: les18incidències SCC del dipòsit alié i el delta concurrent fora de documents no s'absorbixen per forçar verd.

La comprovació documental posterior13:11CET ja té SCC vàlid i Olivera0, després de la regularització concurrent del dipòsit. Plantilles/ledger/segells/skills/Wiki passen. Persistixen dos bloquejos estrictes: codi alié fora de l'abast documental i una captura humana nova `261103_1306_captura_dondominio_socdepoble_cat_sense_ssl.png`. Ja està ancorada en l'índex viu; no s'ha editat l'original ni canviat el baseline de custòdia. Els logs previs18SCC es conserven com a observació antiga; `final-documental-r2.json` governa el tall actual.

Dipòsit efectiu O10R2 a12:16:57.916UTC, després de23.005,916segons de marató:12cicles, cicle12complet12:14:26.291UTC. Destí `../_investigacio_ia_de_poble/261103_kit_codex_onada10_node_sobira_mac_mini_i_enxufe_total/`, manifest4377883a…/inversaab6b7d16….79paths/40pins,289evidències seleccionades i paquet31fitxers;515fitxers inicials/56.538.380B més el rebut de publicació. La còpia nativa del destí executa init/check0 en entorn net amb estat privat fora del kit i zero grants/model/listener, abans del manifest autoritatiu. No s'ha aplicat el delta al producte ni instal·lat el daemon físic. LEDGER propi ampliat amb lock/CAS/checksum vàlid i història literal intacta; el rebut independent posterior i el resultat formal de tancament s'adjunten com a annexos, preservant els manifests.

Revisió independent posterior PASS:515entrades exactes i rebut addicional esperat,516fitxers en eixe tall;79payloads/preimatges/inversa,31natius/root0755 i35vincles locals vàlids, sense symlinks/hardlinks ni estat/claus/DB/JSONL d'execució. No executa res ni canvia el lliurament. L'intent formal `--close` manté `planned`, eixida1:8portes generals passen, però persistixen codi alié i quatre captures humanes noves (`1306`, dues `1310`, `1316`). Errors exactes i ordre a `strict-close-final.json`, sense forçar baseline/custòdia. L'annex postpublicació es registra separat i verifica que els515fitxers inicials continuen idèntics. No es proclama tancament estricte ni desplegament físic.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Claude:** arbitrar i materialitzar els dos manifests finals en una còpia de release, rebasejant explícitament el registre Frontissa i fonts/torns de Consola que MarIA haja canviat. No aplicar els provisionals ni forçar preimatges. Integració al viu i release no executades per Codex.
2. **MarIA:** acreditar procedència del dispatch Codex i execució correcta del LaunchAgent després del TCC. Correcció externa de logs preparada amb pre/postimatge; cap planificació nova. El mapa viu datat té0 avisos, però no substituïx estes evidències de runtime.
3. **CI/MarIA amb Nix:** generar lock real, eval/build/rebuild i VM HTTP; repetir recepció de telemetria en una superfície que permeta bind. Una omissió no és PASS.
4. **Activació posterior:** port de replay idempotent real, proves entre dispositius, quotes/retenció, revisió de privacitat local, VoiceOver/TalkBack i paquet final de botigues. Auth/Xat i tots els fluxos no es declaren offline.
5. **Govern del torn:** consultar el rebut final de tancament i el bloc ESTAT d’este ID. Els canvis de codi concurrents del viu no s’absorbixen al baseline documental de Codex ni s’oculten per tancar-lo.


### Ubicació dels kits dipositats

- Kit O7: `../_investigacio_ia_de_poble/261103_kit_codex_onada7_excel_lencia_i_llibre_mestre/LLEGEIX_ME.md` (des de l’arrel del repositori)
- Kit O8–9: `../_investigacio_ia_de_poble/261103_kit_codex_onada8_9_nixos_i_offline_first/LLEGEIX_ME.md` (des de l’arrel del repositori)
- Kit O10–21: `../_investigacio_ia_de_poble/261103_kit_codex_onada10_node_sobira_mac_mini_i_enxufe_total/LLEGEIX_ME.md` (des de l'arrel; el manifest437… i el rebut de publicació governen el lliurament)

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261102_1638_auditoria_codex|261102_1638_auditoria_codex]]
- [[../90_arxiu_historic/261103_0522_pla_implementacio_codex_onada7|261103_0522_pla_implementacio_codex_onada7]]
- [[../90_arxiu_historic/261103_0522_prompt_onades7_8_9_teler_invertit_fediversity_i_offline_first|261103_0522_prompt_onades7_8_9_teler_invertit_fediversity_i_offline_first]]
