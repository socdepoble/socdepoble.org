---
type: informe
status: esborrany
description: Auditoria independent del Share Target Android i iOS, la cua de comparticions, els avisos natius i les proves, amb troballes i límits reproduïbles
tags:
  - auditoria
visibility: private
reflex: sdp:torn_b65d699d-9390-455d-9904-1d80121da006:a59bec4d-2be2-4ccb-abee-3b7d04c5d045
---
# Auditoria adversarial de Codex: Compartir natiu i avisos del xat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b65d699d-9390-455d-9904-1d80121da006:a59bec4d-2be2-4ccb-abee-3b7d04c5d045 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T18:42:39.037Z |
| Modificació | 2026-10-26T18:54:10.587Z |
| Propietari | Codex, auditor independent amb tres revisors de lectura |
| Aprovació humana | auditoria ordenada pel Mestre en el prompt 261026_1615; correccions de producte pendents d’implementació i verificació |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex (GPT-6), entorn local |
| Tokens consumits | No disponibles amb precisió en este entorn; no s’inventa cap recompte |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-26T18:42:39.037Z: esborrany creat; contingut i verificació pendents.
2026-10-26T18:49:00.000Z: revisió de fonts, suites i cinc reproduccions web completada; dictamen independent emés. Les hores ISO són UTC; la sessió és del 2026-10-26 a Europe/Madrid.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Dictamen: hi ha quatre bloquejants oberts. No recomane publicar esta implementació nativa fins a corregir-los i verificar els casos d’acceptació.** El precommit verd és reproduïble, però no detecta estes fallades. Esta auditoria preserva el codi: cap pegat de producte, commit, push, desplegament ni migració.

Tall: branca `backup-notes-publish`, HEAD `8ac78f9aa0712544bc7c58c36c02d43cf66919a0`, amb els canvis de Claude sense commit. Manifest temporal de 57 fitxers de producte/proves/configuració tocats, ordenats per ruta i SHA-256: digest `9347d325219585389db70a5a7dfd342ebfc9b74612cd2a2e189737ab420719d9`. El projecte instal·lat és **React 18.3.1**, no React 19.

### C1615-01 · [BLOQUEJANT] Un lot assignat a una persona pot mostrar-se a una altra

**Fonts:** `src/config/compartirNatiu.js:15,39,55-58,72-79`; `src/sections/xat/XatContext.jsx:1990-1998`; `XatSection.jsx:280-294,1579`; `components/ControlsAdjunt.jsx:182-185`.

El registre és global i només guarda `desti=filId`: no té propietari, backend ni àmbit. En canviar de persona, XatContext buida esborranys i emoticones, però no este lot. La clau `ambitEstable` remunta la interfície; això elimina la foto ja preparada, però conserva les altres en el registre global. Amb destí assignat, «Envia a…» tampoc torna a preguntar.

**Reproducció executada:** A compartix dues fotos i tria el directe A–B. La primera es prepara i la segona espera. Es desmunta A, s’executa la neteja real d’esborranys i es munten els controls de B sobre el mateix fil: `readByB=true`, `contentsReadByB="A-private-photo-2"`, `previewForB=true`. Una segona revisió independent ha buscat i no ha trobat cap purga compensatòria.

**Abast precís:** cal logout/login dins del mateix runtime JS i que B òbriga un fil amb el mateix ID al qual tinga accés. No s’envia res automàticament; sí que s’exposen els bytes privats i se’n permet l’enviament com B. La reproducció simula la transició en la frontera dels components, sense autenticar contra un servidor.

**Contracte vulnerat:** aïllament entre persones, ja aplicat als esborranys del mateix XatContext. **Correcció conservadora:** vincular el lot a l’àmbit en assignar-ne el destí; invalidar-lo en logout/canvi de persona o backend, incloses lectures natives en vol. Mantindre explícitament el cas legítim de compartir abans d’entrar. **Acceptació:** A→convidat→B, A→B i canvi de backend, amb fil coincident i amb recepció nativa diferida. `requires_human_decision: false` per a l’aïllament.

### C1615-02 · [BLOQUEJANT] El compositor retira la foto abans que la preparació siga acceptada

**Fonts:** `src/config/compartirNatiu.js:72-79`; `components/ControlsAdjunt.jsx:64-83,181-196`.

`prenFitxerCompartit()` elimina destructivament la foto i el peu abans d’esperar `preparaAdjunt()`. Desmuntar la conversa avorta l’operació i no restitueix l’entrada. Quan la preparació acaba, el resultat es descarta perquè el component ja no viu. El registre pot haver quedat a `null`.

**Reproduccions executades:** (1) quota desada, muntatge amb `StrictMode`: `prepareCalls=1`, `aborted=[true]`, `pending=null`, `preview=false`; (2) muntatge normal i desmuntatge durant una preparació diferida: `pending=null`, `aborted=true`. El segon cas correspon al canvi de conversa en producció. La doble execució de StrictMode és pròpia del desenvolupament i no es presenta com una fallada exclusiva de producció.

**Contracte vulnerat:** la foto ha d’esperar la revisió de la persona, sense perdre’s per una navegació que cancel·la feina local. **Correcció:** reserva per ID de lot/fitxer, confirmació quan el resultat s’incorpora a un esborrany recuperable i restitució quan es cancel·la; evitar que una promesa d’un lot antic altere el nou. **Acceptació:** preparació diferida amb canvi A→B→A, unmount/remount i StrictMode amb quota desada, sense duplicats ni canvi de peu. `requires_human_decision: false`.

### C1615-03 · [BLOQUEJANT] iOS elimina l’únic lot durable abans de confirmar-ne la recepció

**Fonts:** `ios/App/App/CompartirNatiuPlugin.swift:32-35,88-99,124-133`; `src/natiu/compartirNatiu.js:64-69`; registre web global.

El consumidor mou cada fitxer a `Caches/compartits`, elimina el lot i el manifest de l’App Group i després notifica el JS. En cada arrencada elimina tota la carpeta local. Després del fetch, l’adaptador web també ordena eliminar els originals: fins a enviar, només queda un `Blob` volàtil. Escriure el manifest amb `.atomic` protegix la publicació de l’extensió, però no fa transaccional el consum de l’App.

**Escenari acreditat pel flux de codi, pendent de prova al dispositiu:** compartir amb l’App tancada → obrir «Envia a…» → forçar tancament → reobrir. No queda cap manifest ni esborrany persistent recuperable. Si el procés mor entre dos `moveItem`, un manifest encara existent pot referir-se a fitxers que ja s’han mogut; la purga del següent inici en destruïx els altres.

**Contracte vulnerat:** risc 2 explícit del prompt, pèrdua de contingut en tancar sobtadament. **Correcció:** lot persistent amb identificador i estat recuperable; confirmar-ne el consum després de conservar l’esborrany, enviar o descartar. No esborrar tots els pendents en `load()`. La confirmació ha de ser idempotent i tolerar una interrupció a cada pas. **Acceptació nativa:** terminació abans/després de cada moviment, notificació, fetch i selecció; dues comparticions consecutives i recuperació sense pèrdua ni duplicat. `requires_human_decision: false` per a evitar la pèrdua; la política de retenció és una decisió de producte.

### C1615-04 · [BLOQUEJANT] Un proveïdor Android pot immobilitzar tota la cua d’ingesta

**Fonts:** `android/app/src/main/java/org/socdepoble/app/CompartirNatiuPlugin.java:56,91-98,154-185,217-219,245-253,275-285,292-301`.

Un únic executor atén totes les comparticions. `getType`, `query`, `openInputStream` i `read` no tenen termini ni cancel·lació. Un proveïdor legítim encallat o maliciós pot retornar un pipe sense EOF: no excedix mai el límit de bytes i impedix processar qualsevol compartició posterior. La cua de tasques tampoc té pressupost; no hi ha `handleOnDestroy` que tanque fluxos i executor.

El límit nominal de deu tampoc limita totes les entrades: `acceptats` només augmenta després de copiar una imatge. Cada URI `text/plain` pot afegir 10.000 caràcters al `StringBuilder`, sense límit agregat fins al retall final. Això permet amplificar considerablement la memòria amb un intent de moltes URIs. No s’afirma una retenció permanent de l’Activity per un fil inactiu: el risc prové de les tasques en vol o pendents que capturen el connector.

**Evidència:** lectura directa del codi i semàntica de lectura bloquejant; no s’ha executat un proveïdor hostil en Android. **Correcció:** sostres d’URIs examinades, text/bytes agregats i tasques; lectura amb termini i cancel·lació que tanque realment el descriptor; alliberament del cicle de vida. Un simple timeout de la promesa web no desfà el bloqueig natiu. **Acceptació:** provider amb pipe obert, una segona compartició bona, destrucció/recreació de l’Activity i milers de textos; la cua ha de recuperar-se amb recursos acotats. `requires_human_decision: false`.

### C1615-05 · [MILLORA] La captura d’extres il·legibles no cobrix el connector d’avisos

`CompartirNatiuPlugin.java:76-88` protegix SEND, però la dependència nova llig extres d’un `ACTION_MAIN` a `node_modules/@capacitor/local-notifications/android/src/main/kotlin/com/capacitorjs/plugins/localnotifications/LocalNotificationManager.kt:48`, cridat per `LocalNotificationsPlugin.kt:53-60`. `Bridge.java:1312-1315` no captura l’excepció i MainActivity és exportada. Un intent explícit amb un Parcelable desconegut pot fer fallar el desempaquetat en API 24–32.

És **un risc inferit del codi, pendent de reproducció nativa**, no un crash observat ni una prova d’exfiltració/RCE. Android documenta que un extra inesperat pot forçar el desempaquetat del Bundle sencer: [Unsafe Deserialization](https://developer.android.com/privacy-and-security/risks/unsafe-deserialization). Cal provar la frontera completa amb extres malformats i sanejar-la abans de repartir-los als connectors, preservant compartir, OAuth i tocs d’avisos legítims. `requires_human_decision: false` per a la prova i contenció.

### C1615-06 · [MILLORA] iOS limita l’eixida, però no el cost d’entrada ni el temps del proveïdor

`ShareViewController.swift:91-109,140-155,163-179` copia tota la representació al temporal abans de comprovar els 20 MB i abans de reescriure-la. Una representació enorme pot consumir disc encara que el resultat final siga menut. El recorregut és serial i la continuació no té termini ni cancel·lació pròpia. Un proveïdor que no completa reté tot el lot. Cal limitar bytes d’entrada, gestionar el Progress/cancel·lació i conservar els elements ja rebuts; provar proveïdor lent, cancel·lació i disc ple. `requires_human_decision: false` per a acotar recursos.

### C1615-07 · [MILLORA] Les còpies natives PNG/JPEG encara conserven EXIF/GPS

`ShareViewController.swift:146-149` copia sense recodificar les imatges menudes. Per tant, la recepció i l’espera a l’App Group no equivalen a sanejament de metadades. **No s’ha trobat filtració final al xat:** `src/sections/xat/adjuntLocal.js:145-156` recodifica sempre la foto amb `conservaExif:false` abans de pujar-la. Cal distingir protecció al transport d’emmagatzematge local, documentar-ne la retenció i valorar sanejar abans de persistir. `requires_human_decision: true` per a ampliar la política de sanejament local, no per a rectificar l’afirmació tècnica.

### C1615-08 · [MILLORA] L’esdeveniment d’enxufabilitat publica URL sense vida útil garantida

`src/natiu/compartirNatiu.js:65,71-73` ordena eliminar les còpies i publica les mateixes URL a `sdp:compartir_natiu`. Amb el transport simulat i l’adaptador real, `resourceExistsOnNextTurn=false`. Un consumidor asíncron rep una ruta ja eliminada. El registre intern usa els File i continua funcionant; no hi ha consumidors actuals d’eixe esdeveniment que permeten atribuir una regressió visible. Cal publicar File/Blob amb un contracte explícit o reservar la còpia fins a una confirmació. `requires_human_decision: false` per a donar vida útil al contracte existent.

### C1615-09 · [MILLORA] Un avís ja encarregat pot sonar després de tornar a primer pla

`src/natiu/avisosNatius.js:63-80` espera `createChannel`; mentrestant `XatContext.jsx:531` pot executar la neteja de primer pla. Quan acaba el canal, es fa `schedule` sense revalidar visibilitat ni sessió. Reproducció amb adaptadors reals i transport diferit: `events=["removeAllDelivered","schedule"]`, `deliveredAfterForeground=1`. Cal invalidar per generació de visibilitat/sessió i revalidar abans d’encarregar l’avís. Afegir el cas de logout mentre el canal espera. `requires_human_decision: false`.

### C1615-10 · [MILLORA] El verd de proves no cobrix les garanties de persistència i aïllament

`vitest.precommit.config.js:34-52` inclou `compartirNatiu.seguretat.test.js`, però deixa fora registres, receptor, diàleg, ControlsAdjunt.compartir, XatContext.avisosNatius, avisosNatius i projecteAndroid/projecteIos. S’han executat explícitament en esta auditoria.

Les proves React usen el registre real i són útils per al flux ordinari. Les preparacions immediates i l’absència de transicions d’identitat/desmuntatge amb feina pendent deixen passar C1615-01/02. Les proves natives comproven sobretot estructura textual: per exemple `src/natiu/projecteIos.test.js:351-387` valida una notificació fora del bucle, però no executa el consumidor Swift ni verifica reinici, confirmació o recuperació. No es qualifica de falsa una assertió que comprova correctament la seua estructura; és insuficient per a la garantia funcional que se’n vol deduir.

Cal integrar un grup crític acotat al precommit i proves natives d’acceptació per als quatre bloquejants. No sumar bateries solapades com si foren proves distintes. `requires_human_decision: false` per a les regressions; la política de durada del precommit continua vigent.

### Controls [CONFORME] i contrast amb Claude

- **K01 · Rutes i permisos Android:** només `content://`, autoritats pròpies rebutjades també amb prefix d’usuari, noms UUID i extensió fixa, nom visible separat de la ruta i `allibera()` amb ruta canònica dins de `compartits/`. No s’ha identificat traversal ni lectura privada explotable en eixos camins. El revisor ha inspeccionat amb `aapt2` l’APK debug existent: SEND/SEND_MULTIPLE i POST_NOTIFICATIONS presents; SCHEDULE_EXACT_ALARM, WAKE_LOCK i RECEIVE_BOOT_COMPLETED absents; dos FileProviders propis no exportats. És inspecció de l’artefacte existent, sense recompilar-lo ni certificar un release nou.
- **K02 · Projecte iOS:** target, producte incrustat, dependència, versions i App Group dels dos entitlements coherents; `ControladorSdp` registra el connector via SceneDelegate. Manifest publicat amb `.atomic`, noms plans, cua serial i retirada d’observadors en deinit. Açò no resol el consum destructiu C1615-03.
- **K03 · Subscripcions i frontera web:** useSyncExternalStore rep snapshot estable/congelat i unsubscribe; receptor i avisador retiren listeners React/DOM. Les escoltes natives globals tenen vida d’App i s’instal·len abans del render. Registres purs fora de `src/natiu`, sense backend nou ni escriptures Sollutia; l’adjunt continua pel port neutral. No s’ha trobat una fuita de subscripcions React en el camí ordinari.
- **K04 · Avisos:** petició contextual de permís, respecte de `prompt-with-rationale`, canal i `isExactNotification:false` coherents amb els avisos immediats Android. iOS queda deliberadament sense avisos locals de fons. Això no és paritat amb push ni garanteix avisos amb l’App morta.
- **K05 · Revisió abans d’enviar i text d’accés:** cap enviament automàtic en triar destí; peu editable i port existent. Proves dirigides de text/capes/avatars passen. No s’ha fet fotometria ni validació física de barres; es conserva el límit de contrast dels diàlegs clars que Claude ja havia declarat.

L’informe [[261026_1815_auditoria_claude]] és útil per a arquitectura i límits, i les seues xifres de precommit s’han reproduït. Les 32 troballes internes no impliquen absència de defectes: C1615-01/02/03/04 seguixen oberts. No es refuten sense prova ni el sanejament final d’EXIF ni la frontera Model B. La substitució d’un lot pendent per un altre és un contracte explícit del registre; no es presenta com una carrera nova descoberta.

### Contrast posterior amb Gemini1615

Llegit íntegrament [[261026_1615_auditoria_gemini]] en arribar durant el tancament. **No compartisc el dictamen de zero bloquejants ni la conformitat per a botigues.** La discrepància principal és comprovable:

- Gemini afirma un efecte a `XatSection.jsx:297-302` que vigila l’usuari i executa `descartaCompartit()`. Les línies reals són el comentari i l’inici de `useOrigenDeLaConversa()`, sense eixe efecte. El registre tampoc revoca URL Blob ni crida el pont en descartar. C1615-01 continua reproduït i no queda refutat per eixa afirmació.
- Gemini descriu `lot.json`, `esNomSegur`, `marcaConsumit()`, `peuInicial` i `enVol` en camins on no existixen eixos símbols. El consumidor real usa `manifest.json`, validació de nom en línia i `operacio`. Eixes descripcions no són evidència del codi auditat. Els 57 hashes de fonts continuaven iguals després del contrast, de manera que no s’explica per un pegat concurrent del lot.
- **G1615-04:** coincidim en el consum prematur. El considere bloquejant perquè hi ha pèrdua reproduïda per una navegació ordinària i amb StrictMode/quota desada; no és només un reforç teòric. **G1615-03/06:** coincidència en neteja d’executor i cobertura, però falta el bloqueig de lectura i el pressupost agregat C1615-04.
- **G1615-01 [MILLORA condicional]:** la branca d’URL de `ShareViewController.swift:98-104` no rebutja `url.isFileURL` ni restringix esquemes. És raonable provar i rebutjar representacions locals que arriben per eixa branca; no s’ha demostrat que la regla d’activació permeta el cas concret d’un PDF sol de Files. No s’hereta com una exfiltració observada ni es confon una ruta textual amb bytes d’un fitxer.
- **G1615-02:** coherent amb C1615-07 quant a metadades locals. No s’adopta sense prova la generalització que Photos sempre expose qualsevol HEIC com a JPEG; el camí ràpid JPEG ja basta per acreditar el límit local.
- **G1615-05 [MILLORA heretada, pendent de mesura]:** storyboard més finestra manual ja conviuen a HEAD. El diff només canvia CAPBridgeViewController per ControladorSdp; no acredita una regressió nova ni dos WKWebView realment carregats. Evitar deduir memòria efectiva del text del plist.
- Les dues omissions Vitest són els controls condicionals de **projecte absent**, declarats amb `test.skipIf(HI_HA_PROJECTE)` al final dels dos fitxers. No són compilacions optatives activables amb `SDP_PROVA_COMPILACIO_NATIVA`: eixa variable no apareix en estes suites. Els binaris web/WordPress obsolets sí que expliquen les altres dues omissions de Node. La conformitat de barres en tots els diàlegs tampoc s’acredita: Claude ja declarava el límit de les pantalles clares.

Es conserva el diàleg en disc, sense editar l’informe de Gemini ni proclamar consens. La correcció d’aïllament i la matriu d’acceptació són la següent acció tècnica.

### Retroalimentació de la plantilla

1. Derivar les versions del lockfile: React 18.3.1 real davant React 19 al prompt.
2. Exigir matriu fred/calent, múltiples lots, terminació a cada pas de consum, quota desada, StrictMode, canvi d’usuari/backend i proveïdor que no respon.
3. Separar verificació estàtica, simulació de transport, execució nativa i aparell físic; identificar les omissions i evitar «proves verdes garantides» en un pla.
4. Fer explícita la confirmació de recepció i la propietat de cada lot; «cua» no acredita persistència.
5. Conservar un manifest d’evidència i consumidors per a informes grans, avançant sobre P2-15 sense canviar unilateralment l’obligació de lectura íntegra. No s’ha modificat la plantilla canònica en esta auditoria.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació independent | Resultat |
| --- | --- |
| Porta Olivera inicial | codi 0, Safata buida i documents ancorats |
| `npm run test:precommit` | codi 0; 166 fitxers / 3.171 Vitest, 262 Node; zero fallades; fase Vitest 22,33 s |
| `node --test tests/lint_xat.test.mjs tests/natiu-build.test.mjs` | codi 0; 49 passen, 2 omeses; web i WordPress compilats són anteriors al lockfile i els controls de binari corresponents se salten |
| 12 suites dirigides de compartició, avisos, projectes natius, accés i avatars | codi 0; 193 passen, 2 omeses condicionals de «projecte absent»; els projectes Android/iOS sí que s’han revisat |
| Arnés React amb component i registre reals | tres defectes reproduïts: StrictMode, desmuntatge normal, herència de foto entre A i B |
| Arnés d’adaptadors web amb transport simulat | URL sense vida útil i avís posterior a la neteja reproduïts |
| APK debug existent | permisos i filtres inspeccionats amb aapt2 pel revisor Android |
| Compilació Android/iOS, autenticació real i prova física | no executades en esta auditoria; no s’hereten les de Claude com a prova pròpia |
| Validació del document, Olivera final i tancament | resultats consignats en l’addenda de tancament |

Comanda de les 12 suites:

```sh
npx vitest run src/config/compartirNatiu.test.js src/config/avisosNatius.test.js src/natiu/compartirNatiu.seguretat.test.js src/natiu/avisosNatius.test.js src/natiu/projecteAndroid.test.js src/natiu/projecteIos.test.js src/sections/xat/ReceptorCompartit.test.jsx src/sections/xat/components/DialegCompartir.test.jsx src/sections/xat/components/ControlsAdjunt.compartir.test.jsx src/sections/xat/XatContext.avisosNatius.test.jsx src/sections/xat/XatSection.acces.capes.test.js src/sections/xat/XatSection.avatars.test.jsx
```

Evidència temporal local, fora del repositori: `/tmp/sdp_codex_share_precommit.log`, `/tmp/sdp_codex_share_node.log`, `/tmp/sdp_codex_share_targeted.log`, `/tmp/sdp-react-audit.mjs`, `/tmp/sdp-native-web-audit.mjs`. Els dos arnesos s’han reexecutat pel coordinador amb `node`; SHA-256 respectius `0ed413ea32a2d71a7e7d4045ef5c4cafc796f95d7a4a5f7d0a6f03755e5cb4c6` i `a2d21fc41b2c793491ad76e7ce3a8521e3dfeb5b97644cd721fac6ca84170546`. Són sondes de reproducció, no una nova suite d’acceptació ni artefactes permanents. La lògica del component es transpila des del fitxer real; multimèdia, port i transport són dobles explícits.

### Addenda de tancament

El document passa `document.mjs check` amb `valid:true, errors:[]`; Olivera final passa amb codi 0. `tancament.mjs --turn-id torn_b65d699d-9390-455d-9904-1d80121da006` s’ha executat i retorna **codi 1, valid:false, estat planned**: 223 incidències globals (Wiki/SCC), cap referida al nou informe. Olivera, plantilles, autoritat, LEDGER, segell i catàleg de skills passen; Wiki i SCC fallen. El relleu d’ESTAT i LEDGER ja consta. No es reescriuen enllaços aliens, no es relaxen portes ni es fabrica una verificació per a tancar artificialment el torn.

El checksum anterior del LEDGER era vàlid; s’ha conservat el cos i s’ha actualitzat el hash únicament per afegir el relleu d’esta auditoria, sota pany i comprovació de concurrència. Els 57 fitxers del manifest auditat continuen sense canvis de bytes. Les suites i sondes pròpies han acabat; no hi ha cap recurrència creada per Codex. L’auditoria tècnica està emesa; el tancament global de govern continua pendent.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Lectura compartida: AGENTS, Genotip, índex mestre, taxonomia, workflow i circuit documental; pla i tres prompts; informe Claude íntegre; índex d’escriptori i Llibre Mestre íntegre dins de l’equip. El cens JSON s’ha llegit i parsejat complet, amb 390 imatges i SHA-256 `739c189d042b6715883bfc2ae40ec885e0aca8b7538d95ca4b1b75d1d166b2a0`; el seu contingut s’ha inspeccionat estructuralment, sense repetir l’auditoria visual d’imatges. No s’ha recorregut l’arxiu històric ni contingut humà de producció.

L’informe Gemini1615 ha arribat durant el tancament i s’ha llegit íntegre; el contrast i les discrepàncies són a dalt. No s’esperen altres agents de manera bloquejant ni s’atribuïx un consens que no existix. Els tres revisors de Codex han acabat; el cas d’aïllament entre comptes ha tingut una revisió addicional independent.

No es certifiquen UI física, consum real de memòria, APNs/FCM, perfils App Group, botigues, OAuth en aparell ni la suite completa. Les quatre fallades globals que Claude declara heretades no s’han reexecutat ni es declaren resoltes. Les conclusions natives C1615-03/04 són de flux de codi i requerixen la matriu d’acceptació indicada; C1615-05 és expressament una hipòtesi de crash pendent de reproducció.

S’han actualitzat Llibre Mestre, índex, estat de sessió i rebut del torn. Cap fitxer mogut, cap carpeta nova al projecte, cap font o dependència de producte canviada per Codex. No s’ha creat cap cron, monitor, servidor ni schedule; les suites i sondes pròpies han finalitzat. Els serveis i crons aliens del projecte es conserven.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261026_1615_pla_implementacio_share_target_notificacions_i_xat]]
- [[261026_1615_prompt_codex_gauntlet_share_target]]
- [[261026_1815_auditoria_claude]]
- [[261026_1615_auditoria_gemini]]
