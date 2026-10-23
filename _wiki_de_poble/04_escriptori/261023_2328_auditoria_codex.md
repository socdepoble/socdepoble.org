---
type: informe
status: esborrany
description: Auditoria Codex del client web i natiu, controls incomplets, esborrat de compte i fronteres de seguretat abans de botigues
tags:
  - auditoria
visibility: private
reflex: sdp:torn_94df0b65-86cb-4a5d-8647-3e6e7e15dfe3:28d3447f-8a74-4570-9734-86a4ae906997
---
# Auditoria adversarial de botigues, privacitat i fronteres

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_94df0b65-86cb-4a5d-8647-3e6e7e15dfe3:28d3447f-8a74-4570-9734-86a4ae906997 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T21:28:53.319Z |
| Modificació | 2026-10-23T21:42:01+00:00 |
| Propietari | Codex |
| Aprovació humana | Encàrrec explícit del Mestre: executar el rol Codex del prompt canònic 2026-10-23 22:45 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex; revisió paral·lela de privacitat, controls i fronteres amb tres subagents |
| Tokens consumits | No disponibles en este entorn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-23 23:28 Europe/Madrid: context i esborrany entregats pel circuit documental. Primer relleu publicat durant el treball; esta versió el substituïx amb evidència contrastada. Encàrrec: rol Codex del prompt de les 22:45. Els blocs de privacitat, controls i fronteres han tingut revisió paral·lela; una segona revisió ha intentat refutar la conservació d'UGC i l'accessibilitat dels controls en el paquet natiu.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen i tall auditat

**NO-GO de publicació a botigues.** El prevol continua en roig i el codi conserva mancances que afecten l'esborrat complet del compte, la moderació i la integritat funcional. Compilar un AAB o un arxiu d'Xcode no resol estes mancances. És un dictamen tècnic per a MarIA; no és una decisió de l'equip revisor d'Apple o Google.

Tall inicial real: `01ef70dcc0cad5c7c5ffec6734871ee1d68430ba`, branca `backup-notes-publish`. El prompt nomena `b082b13d63c1521f0136d216fed6deb9ae2fffc1`. La comparació entre els dos només toca ESTAT, protocolledge, plantilla, prompt, Llibre Mestre i `src/data/wikiManifest.js`: les superfícies de producte citades ací no han canviat entre els dos talls. L'arbre estava net en la primera lectura; després hi ha escriptures documentals concurrents de Claude i Codex.

P1 significa que cal resoldre el problema abans del llançament públic corresponent; P2, deute o verificació pendent que cal planificar. No s'ha acreditat cap explotació P0 ni s'ha fet cap atac a comptes reals.

| ID | Prioritat | Superfície | Resultat |
|---|---|---|---|
| C-01 | P1 | Web i paquet natiu | Controls i pantalles incomplets accessibles al xat |
| C-02 | P1 | Baixa del compte | Publicacions personals i fotos conservades, incloses dades dins del cos |
| C-03 | P1 | Baixa i Storage | Cua de purga sense consumidor implementat en el repositori |
| C-04 | P1 | iOS / Sign in with Apple | Falta revocar el token del proveïdor en el procés d'esborrat |
| C-05 | P1 | Firebase web | La CSP desplegada bloqueja àudio i vídeo remots |
| C-06 | P1 | UGC abans de publicació | No hi ha mètode de filtratge previ implementat en el flux revisat |
| C-07 | P2 | Govern del llançament | Referència a migració inexistent i estat de release sense prova remota |
| C-08 | P1 operatiu | Candidata Android / pista interna | L’AAB present no està signat; no és pujadís encara a Play Console |

### C-01 · Controls «En construcció» dins de la candidatura nativa

**Evidència:** `src/sections/xat/components/CloscaXat.jsx:136-148` exposa Telefonades i Destacats i construïx les rutes `/xat?vista=telefonades` i `/xat?vista=destacats`. `XatSection.jsx:1349-1363` hi munta `VistaEnConstruccio`; el component (`components/VistaEnConstruccio.jsx:169-191`) associa els clics a un avís i deixa la cerca en `readOnly`. `ajustosXat.js:129-140,235-254` i `components/FullAjustos.jsx:357` conserven Historial, Temporals, Notificacions i Dades com a pantalles pendents. A Multimèdia, `components/VistaMultimedia.jsx:162-192` conserva lupa, Ordena i Selecciona inerts.

**Reproducció:** Menú del xat → Telefonades → Nova telefonada; Destacats → Editar; Ajustos → Notificacions; Multimèdia → lupa/Ordena/Selecciona. Els controls només avisen o no permeten l'operació. Esta reproducció està acreditada per handlers i 71 proves existents de quatre components; no s'ha repetit el recorregut en un iPhone físic.

**Intent de refutació:** retirar Telefonades de la barra mòbil no lleva el rail ni la ruta directa. `src/natiu/entrada.jsx:98` munta el mateix `PedraSecaEmbed`; `capaDelPaquet.js`, `provisionalDelPaquet.js` i la config Vite nativa no filtren estes funcions. L'ús d'`aria-disabled` informa de l'estat, però la pantalla continua incompleta.

**Conflicte i correcció conservadora:** Apple 2.1 demana una versió completa, sense contingut temporal. Cal implementar estes funcions o excloure-les del paquet de botiga, tant del menú com de les rutes directes, amb un recorregut d'acceptació en dispositiu. [Apple, integritat de l'app](https://developer.apple.com/app-store/review/guidelines/#app-completeness). Google també exigix funcionalitat i una experiència estable. [Google Play, funcionalitat](https://support.google.com/googleplay/android-developer/answer/9898783?hl=en).

`requires_human_decision: true`: MarIA/Mestre han de fixar el conjunt de funcions de la primera release; l'auditoria no autoritza un redisseny del web.

### C-02 · La baixa conserva contingut personal identificable

**Evidència:** l'última definició de `private.purga_una_baixa`, a `supabase/migrations/2609282100_xat_de_pagina.sql:731-739`, esborra notes privades però conserva les publicacions personals de `section_submissions`: posa l'autoria a l'UUID zero i resta unes claus del payload. `private.claus_personals_payload`, a `2609261500_identitat_perfil_f1.sql:936-959`, lleva metadades d'autoria; no lleva cos, títol, descripció, telèfons escrits dins del text o fotos que no siguen l'avatar. `2609282100:748-755` conserva també els fitxers que encara referencia qualsevol publicació. La migració posterior `2609291200_baixa_icon_copyright.sql` declara que no altera la purga.

**Prova lògica i acceptació pendent:** una publicació personal amb «Em dic X, telèfon Y» i una foto pròpia sobreviu a la purga amb el cos intacte i autoria anònima. Es deduïx directament del SQL; executar el cicle real requerix un compte descartable en staging. El borrat d'`auth.users` no ho resol: l'autoria ja s'ha transformat abans i la fila es conserva explícitament.

`src/sections/text/legalContent.js:158` confirma la retenció per «memòria del poble» i demana un correu addicional per eliminar les publicacions. No s'ha acreditat una obligació legal de conservar-les. Apple inclou fotos, vídeos i publicacions compartides dins de les dades associades que han d'eliminar-se amb el compte, llevat de retenció legal. [Apple, esborrat de compte i UGC](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/).

**Correcció conservadora:** incorporar l'eliminació de l'UGC personal al mateix procés de baixa, incloses les referències als mitjans; separar les aportacions fetes en nom d'una entitat. Qualsevol excepció ha d'estar justificada i explicada en el mateix flux. Prova d'acceptació: després de la purga no apareix ni la publicació ni el seu fitxer personal en consultes/URL anteriors.

`requires_human_decision: true`: entra en conflicte amb la decisió històrica de conservació; cal revisar-la abans de publicar. El segon correu no equival a un esborrat complet des de l'app.

### C-03 · Els fitxers encolats no es purguen

**Evidència:** `2609282100_xat_de_pagina.sql:748-760` només inserix rutes a `private.purga_storage_pendent`. `supabase/README.md:575-583` declara expressament que falta el consumidor amb Storage API i que, mentrestant, els fitxers de qui se'n va continuen al bucket. La cerca del consumidor en `src/`, `scripts/` i `supabase/` no ha trobat implementació. El mateix límit s'explica per als adjunts del xat a `supabase/README.md:469-471` i `2610220240_xat_adjunts_i_quota.sql:69`.

Açò afecta també un fitxer privat **no referenciat**, independentment de C-02. Esborrar la fila del compte o guardar una tasca SQL no esborra l'objecte de Storage. `legalContent.js:156-157` promet eliminació definitiva després de la quarantena i inclou fotos i fitxers exclusivament personals. És incompatible amb eixa promesa sense un consumidor verificat. Google exigix un camí d'esborrat dins de l'app i un recurs web per a demanar l'eliminació del compte i les dades associades. [Google Play, esborrat de dades](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).

**Correcció conservadora:** consumidor al servidor amb credencial de servei, eliminació per Storage API, reintents idempotents i confirmació `feta_al` sols després d'èxit. Cal revisar de nou les referències abans de destruir un fitxer. Prova en staging: objecte privat conegut → baixa vençuda → purga → absència del binari i metadades, més comprovació d'un error/reintent. No s'ha provat si hi ha un consumidor extern no versionat; si existix, cal aportar-ne evidència operativa.

`requires_human_decision: false` per a diagnosticar el defecte; la implementació i operació del servidor necessiten el seu pla.

### C-04 · Logout d'Apple no és revocació d'Apple

**Evidència:** `src/natiu/entradaSocial.js:65-73` conserva id token/nonce/nom i descarta el codi d'autorització Apple; `:124-127` només fa `social.logout`. `src/data/supabase/compte.js:78-93` registra `demana_baixa` i fa logout global de Supabase. La purga (`2609282100:767`) acaba esborrant `auth.users`; no hi ha revocació Apple implementada en estes fonts.

S'ha verificat també el connector instal·lat: `node_modules/@capgo/capacitor-social-login/ios/Sources/SocialLoginPlugin/AppleProvider.swift:267-280` només lleva tokens locals i UserDefaults. No és una crida al servei de revocació. A iOS Apple s'oferix sempre (`entradaSocial.js:35-38`), encara que no es configure Google.

**Conflicte:** Apple demana revocar els tokens de Sign in with Apple en esborrar el compte. [Apple, esborrat i revocació](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/). El Llibre Mestre ja ho té pendent com a `P0-04`; és deute conegut confirmat, no una descoberta nova.

**Correcció conservadora:** completar l'intercanvi i custòdia al servidor del material necessari per a revocar, executar la revocació amb secret signat al servidor i verificar el resultat abans de donar el procés per complet. Les claus privades no han d'entrar al client. Acceptació: alta Apple real en staging, baixa, revocació acreditada i purga final. No s'ha cridat cap endpoint de revocació real.

`requires_human_decision: false` quant al requisit; la configuració d'Apple i l'operació del servidor requerixen el responsable.

### C-05 · CSP de Firebase incompatible amb l'àudio/vídeo remot

**Evidència de configuració i xarxa:** `firebase.json:22` no declara `media-src`; s'aplica `default-src 'self' data: blob:`, que exclou l'origen HTTPS de Supabase. `HEAD https://socdepoble.org/xat` ha respost 200 amb la mateixa CSP (capçalera Date `2026-10-23 21:29:35 GMT`). L'HTML viu conté la meta d'`index.html:17`, que sí permet `media-src https:`, però no pot relaxar una capçalera més restrictiva.

`src/data/supabase/xatMultimedia.js:165-176` construïx l'URL signada HTTPS. `src/sections/xat/components/AdjuntXat.jsx:79-83` l'assigna a l'àudio i `:265-267` al vídeo remot. La norma CSP aplica totes les polítiques i hereta `default-src` quan falta la directiva del recurs. [W3C, polítiques múltiples](https://www.w3.org/TR/CSP3/#multiple-policies), [fallback](https://www.w3.org/TR/CSP3/#directive-default-src).

**Reproducció pendent d'un fil real:** obrir una nota de veu/vídeo remota al web de Firebase i observar la infracció CSP i l'error de reproducció. El bloqueig està determinat per la capçalera viva i les fonts; no s'ha executat una reproducció amb navegador autenticat. La previsualització `blob:` pot funcionar i ocultar el problema durant una prova superficial.

**Abast:** afecta el web Firebase. La CSP nativa (`vite.natiu.config.js:80`) i la de Vercel sí declaren `media-src https:`; no s'extrapola esta fallada al binari mòbil.

**Correcció conservadora:** alinear `media-src` de Firebase amb els orígens de mitjans previstos, mantenint les altres restriccions, i provar reproducció després del desplegament. Cal comprovar la capçalera HTTP, no sols l'HTML. `requires_human_decision: false`; el desplegament seguix el seu procediment.

### C-06 · Filtratge d'UGC abans de publicar pendent

**Evidència:** `supabase/migrations/2610201500_moderacio_denuncies_i_bloquejos.sql:50-54` explicita que no filtra abans de publicar, no avisa de denúncies i no impedix que una persona bloquejada continue escrivint. El client sí oferix denúncies, acceptació de normes i ocultació de contingut/persones; seria fals descriure el sistema com a «sense moderació». S'ha seguit el flux real: `src/sections/notes/NotesEditor.jsx:429-437` accepta normes i publica, deixant el filtre explícitament per al futur; `NotesContext.jsx:345-395` → `MurContext.jsx:130-138` → `src/data/supabase/content.js:124-128` fan POST directe a `section_submissions`. La lectura a `content.js:168-172` no espera aprovació. El sanejament HTML i la limitació d'orígens d'imatges no són filtratge de contingut ofensiu. Una segona revisió escèptica ha confirmat este recorregut.

**Conflicte:** Apple 1.2 demana un mètode de filtratge abans de publicar, denúncies amb resposta, bloqueig i contacte. [Apple, UGC](https://developer.apple.com/app-store/review/guidelines/#user-generated-content). Google exigix moderació efectiva i sostinguda amb denúncia i bloqueig segons el tipus d'interacció. [Google Play, UGC](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en).

**Correcció conservadora:** definir un mecanisme previ efectiu i verificable adequat al contingut, la revisió de denúncies amb responsable i temps de resposta, i provar els recorreguts entre dos comptes. La falta d'un avís automàtic no prova per si sola que la cua manual no es revise; tampoc s'afirma que Google impose específicament un filtre SQL o que no existisca el botó de bloqueig. Si hi ha un procés extern de filtratge, falta acreditar com s'interposa abans de la publicació.

`requires_human_decision: true`: responsable, criteri de moderació i operació del servei.

### C-07 · Estat de release i referències documentals desalineats

**Evidència:** `03_llibre_mestre_tasques_i_idees.md:57` (`P0-05`) demana aplicar `2610201400` per a l'esborrat de compte; no existix cap migració amb eixe prefix. Les funcions que s'han pogut auditar són les migracions de setembre citades més amunt. No s'ha d'executar una recepta basada en un nom inexistent ni assumir que la presència del fitxer implica que la base de producció ja l'ha aplicat.

El mateix llibre manté pendents OAuth, revocació Apple i migracions. Per això, «només falten les claus» no és una conclusió suficient sobre preparació funcional. L'estat gràfic P0-07 també és anterior a l'ESTAT que descriu les icones d'iOS corregides; la verificació física final correspon a Gemini.

**Correcció conservadora:** MarIA ha de reconciliar el llibre amb els informes físics, identificar exactament les migracions necessàries i guardar evidència de l'estat remot i de les proves funcionals. `requires_human_decision: false` per a corregir referències; l'aplicació de SQL continua reservada al Mestre.

### C-08 · L'AAB actual tampoc està llest per a la pista interna

**Evidència independent:** s'ha obert l'`app-release.aab` creat per Claude només en lectura: 40.986.252 bytes, SHA-256 `474256acc407ec25594692ae149368c6fbe9a737d568b2d538d91e52c872082a`. El ZIP no conté cap entrada de signatura JAR `.SF`, `.RSA`, `.DSA` o `.EC` a `META-INF/`. Claude també declara que és sense signar. El seu èxit de compilació és una fita real; encara falta la signatura amb la clau de pujada.

**Precisió contrastada a tres bandes:** l'AAB compilat encara no és apte per a pujar. La revisió final G-03/G-04 de Gemini ja incorpora esta condició i la distinció de C-08. Android exigix signar l'AAB abans de pujar-lo a Play Console; canviar de pista no elimina el requisit. [Android Developers, preparar la release](https://developer.android.com/studio/publish/preparing/). El NO-GO funcional es referix a publicació pública, però este bloqueig tècnic també afecta la pujada interna.

Claude declara a més un arxiu iOS sense signar i una divergència entre el bundle ID del projecte (`org.socdepoble.app`) i el perfil local (`com.socdepoble.app`). No s'ha inspeccionat el perfil ni la fitxa de la consola en esta auditoria. Apple associa el build al registre pel bundle ID i requerix provisionament coherent; Xcode pot gestionar-lo automàticament. [Apple, provisionament de distribució](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile).

**Correcció conservadora:** signar i verificar el certificat de pujada d'Android; alinear registre, identificador i signatura d'iOS abans de distribuir. Les proves internes amb comptes descartables són una fase útil una vegada superat el prevol; no es declara que estiguen prohibides per C-01 a C-06. `requires_human_decision: true` per a identitat i credencials de signatura.

### Polítiques i verificacions pendents, sense inventar un rebuig

| Àmbit | Valoració |
|---|---|
| Apple 5.1.1 / URL legal | La ruta pública i l'àncora existixen i tenen proves locals. Això no prova que la baixa complete la purga: C-02, C-03 i C-04. El camí web per correu no es declara automàticament invàlid per a Google. |
| Apple 4.0 / 4.2 | Hi ha contingut comunitari i entrada social nativa; ser una SPA empaquetada no prova per si mateix un rebuig. Cal demostrar utilitat i experiència completa en dispositiu. No s'ha certificat este criteri. [Apple, funcionalitat mínima](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality). |
| Google Data safety / App Privacy | Cal contrastar les declaracions de la consola amb auth, perfils, contingut, mitjans, proveïdors i retenció reals. No s'han inspeccionat les consoles ni s'han marcat com a conformes. |
| Google, seguretat infantil si la categoria és Social | Cal publicar estàndards CSAE i acreditar contacte i procés operatiu. La categoria de Play Console no s'ha vist. L'edat mínima de 14 anys del text legal no substituïx estes exigències. [Google, estàndards de seguretat infantil](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en). |
| Backend i RLS desplegats | Cal prova de dos comptes/tenants, participant/no participant del xat, anon, baixa i moderació. Les proves locals i les migracions al disc no acrediten el servidor remot. |
| Token n8n històric | El Llibre Mestre `P0-02` encara en demana la rotació. No s'ha llegit el secret ni provat si continua vigent; estat desconegut, no vulnerabilitat activa demostrada. |

### Comprovacions favorables i hipòtesis descartades

- **SW R1/R2:** no s'ha trobat un defecte demostrable en la revisió focalitzada. Les proves cobreixen l'ordre llegat `SKIP_WAITING`, purga acotada de caches, excepcions auth/API i registre exclusiu del lloc propi. Açò no equival a un assaig real de tots els navegadors de juny.
- **Frontissa Model B:** `src/data/adaptadors/sollutia/creaFrontissa.js:61` força `GET`, `credentials: 'omit'` i `redirect: 'error'`; hi ha catàleg fix, origen exacte, sostre de bytes i timeout de lectura. No s'han trobat escriptures en esta frontera. Sense endpoints reals de Sollutia no es declara integració final certificada.
- **Sessió d'amfitrió:** `src/host.js:455-459,494` comprova origen i finestra pare i rebutja injecció sense emissor. La verificació autoritativa continua al backend; no s'ha demostrat un bypass de permisos.
- **Frontera de publicació:** l'inventari de `dist/rag-index.json` conté 80 documents i cap ruta d'agents, Escriptori, actes o arxiu històric. La política de publicació veta eixes fronteres. No s'afirma haver inspeccionat cada dada de cada binari.
- **WordPress lleuger:** `../_builds_de_poble/wordpress/socdepoble.zip` mesura 2.916.367 bytes (2,78 MiB), 42 entrades, SHA-256 `0079a4c7ec3734756dde9c14b6fd6b609c40ac010cf09074a36c5487b9954e2b`. El canal estable encara apunta al paquet antic de 42 MB, però `empaqueta.mjs:851` declara que l'artefacte nou és manual i deixa el canal intacte. No s'ha classificat eixa decisió com una regressió.
- **OAuth Google no configurat:** la reserva `com.googleusercontent.apps.pendent` d'Info.plist no causa per si mateixa un botó Google trencat: els proveïdors es filtren en `entradaSocial.js:35-38`. Cal prova real del proveïdor que sí s'oferix, especialment Apple.
- **Controls de dades privades:** les proteccions explícites de compartir/publicar en editors i Gestoria no s'han confós amb funcions promeses però absents.

### Diàleg amb les companyes i millora del prompt

S'ha llegit el pla aprovat íntegrament, el prompt íntegrament, el Llibre Mestre i l'índex complet de primer nivell de l'Escriptori. També s'han llegit íntegrament `261023_2330_auditoria_claude.md` (esborrany i successius relleus) i `261023_2331_auditoria_gemini.md`.

Claude declara haver reconstruït el natiu des de HEAD, sincronitzat Capacitor i generat un AAB i un arxiu iOS sense signar. S'ha confirmat físicament l'AAB de C-08. La seua observació que NO-GO públic no impedix preparar proves internes és correcta; les firmes i el provisionament continuen pendents.

Gemini confirma la divergència CSP, el pes del ZIP i la correcció dels actius d'iOS. També distingix correctament l'alfa de les capes adaptatives d'Android, que no s'ha de suprimir cegament. La seua taula inicial mesurava el natiu antic i deia AAB absent; Claude l'ha generat després. Són talls diferents, no proves que un artefacte haja desaparegut. En la revisió final, Gemini ja dona el nou hash `1e933ac0…`, mesura l'AAB, marca G-01 resolt i condiciona la pujada interna a signatura/provisionament, d'acord amb C-08. També corregix la descripció de l'omissió nativa: és la branca sense projecte iOS; no acredita ni excusa el login real. Una pista interna continua subjecta a prerequisits de compte, identificador, processament i signatura: no es garantix l'acceptació de cap consola sense haver-la comprovat.

El prevol i la identitat byte a byte d'`index.html` són verificacions útils, però no substituïxen una prova de producte ni tota la paritat d'assets. La candidata final necessita l'evidència de Claude i Gemini, més el tancament dels bloquejos d'esta auditoria. Després de la reconstrucció de Claude, les tres còpies d'`index.html` natiu tornen a coincidir: SHA-256 `1e933ac07fe64dcab148f83f699c7745f8edcc54d8aae63e150870e2c03dbd61`. Les mides/hashes anteriors de Gemini han de llegir-se com a fotografia prèvia. Les proves del binari i la compilació han estat concurrents; la release ha de repetir la verificació focalitzada sobre l'artefacte final congelat.

Propostes per a MarIA sobre la plantilla: fixar un únic SHA complet auditable en lloc de tres commits diferents al context; separar compilació, signatura, prova remota i publicació; incloure criteris de purga/Apple revoke/moderació; i registrar el hash de la candidata a cada prova. L'ordre «qualsevol document de l'Escriptori» necessita definir primer nivell i exclusions de producció/laboratori/arxiu, perquè l'índex conté molta memòria antiga. Són propostes; no s'ha modificat la plantilla.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació executada | Resultat i límit |
|---|---|
| `node scripts/botigues/preflight.mjs --plataforma totes` | **Eixida 5.** Falten `SDP_ANDROID_UPLOAD_CERT_SHA256`, `SDP_APPLE_TEAM_ID`, `SDP_ASC_ISSUER_ID`, `SDP_ASC_KEY_ID`, `SDP_ASC_KEY_PATH` i `SDP_PLAY_JSON_KEY_PATH`. Eines presents i còpies d'index natiu iguals. També arbre documental concurrent brut; no és una regressió del producte. |
| `node --test tests/botigues.test.mjs tests/natiu-build.test.mjs` | **41/41**, sense omissions. Contractes de les eines i límits d'empaquetat. |
| `vitest run src/natiu --maxWorkers=2` | **55 passen, 1 omesa**, cinc fitxers. La prova omesa és la branca «sense projecte iOS» quan el projecte sí existix. |
| Controls del xat | **71/71**, quatre fitxers: VistaEnConstruccio, VistaMultimedia, FullAjustos i CloscaXat. Inclouen controls inerts; verd no vol dir release preparada. |
| Compte/privacitat/moderació/entrada social | **92/92**, cinc fitxers: compte, legal.esborraCompte, moderacio, moderacio.migracio i entradaSocial. |
| SW/registre/host/Frontissa | **136/136**, sis fitxers: sw, registre, hostAdapter, hostIframeAdapter, creaFrontissa i recursos. |
| `npm run lint` | **Eixida 0**, zero errors i avisos en src, tooling, scripts i tests. No mesura els errors de navegador ni el backend viu. |
| Suite Vitest completa amb `--maxWorkers=2` | **Eixida 1: 21.059 passen, 2 fallen i 100 omeses; 1.237 fitxers passen, 2 fallen i 9 omesos (1.248). Durada 596,48 s.** Els dos errors són les precondicions diagnosticades davall. No es declara tota la suite verda. |
| Document, Olivera i tancament | Document propi vàlid; Olivera, plantilles, autoritat, segell i skills **0**. Tancament **1 / planned**, amb 1.271 incidències globals: ledger (1), compilació Wiki (1), 1.008 LINK_INVALID, 241 ESCRIPTORI_UNANCHORED i 20 ORPHAN_OPERATIVE. Cap incidència nomena l'informe propi. Pla i relleus del torn ja vàlids. |

El prevol està orientat a la pujada per API: les claus ASC/Play ausents no impedixen per si soles una ruta manual amb Xcode/Play Console. La signatura Android requerix també les quatre variables de keystore quan s'usa `--signa`/compilació; el prevol estàndard no les comprova. No s'ha afirmat que falten o estiguen presents. Cap secret s'ha imprés.

Els dos únics errors de la suite completa tenen diagnosi de lectura independent, confirmada pel resum final:

1. `tests/laboratori-telefonades-261006.test.js:92` compara `%h` amb huit caràcters; Git ara retorna `76947e5d7`. Amb `%H` es conserva el mateix objecte. És una precondició d'abreviatura inestable.
2. `src/sections/mercat/MercatSection.autoria.test.jsx:319-321` espera que la fila Mac Mini del seed no tinga `author_avatar`; el seed regenerat sí que en té. El parser funciona. Cal una fixture explícita sense eixe camp per recuperar eixa cobertura.

El checksum invàlid del LEDGER es reproduïx en els bytes de HEAD anteriors al relleu (SHA-256 del fitxer `bef7c5d3764d68e40d726e60b30c8413bf57a033fe17913ab20222edc2f15feb`). La resta d'incidències globals afecta rutes prèvies i zones protegides, no l'informe nou. No s'ha executat `--close` ni s'ha resegellat el cos anterior per a convertir el diagnòstic en verd.

No s'han corregit estes proves perquè el rol assignat és auditoria i no s'han atribuït els errors a una fallada de funcionalitat sense evidència.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

L'execució general ha acabat; no queda cap procés de proves d'esta auditoria actiu. El log complet és temporal a `/private/tmp/261023_2328_auditoria_codex_vitest.log`, SHA-256 `174261348b489a79cb81dddac330b38238fbf95df996891dc0d5eb16c80b9293`. Les 100 omissions i l'avís d'originals de la Parròquia absents són límits de cobertura, no proves aprovades.

Esta revisió ha cobert les superfícies de botigues, xat, privacitat, SQL de baixa/moderació, Service Worker, publicació i Frontissa indicades, amb proves focalitzades i una suite general. **No és una certificació fitxer per fitxer de tot el repositori**, ni una auditoria legal completa, ni una prova d'intrusió de producció. No s'ha llegit l'arxiu històric com a corpus, ni s'han obert valors dels `.env` en el context; el prevol autoritzat només ha mostrat noms i estats.

No s'ha executat cap baixa real, cap pujada, cap canvi SQL, cap build que substituïsca artefactes compartits, cap correcció de producte ni cap canvi de credencials. No s'ha signat ni publicat cap paquet. No s'han inspeccionat App Store Connect/Play Console, l'AAB signat final ni un dispositiu físic. Una funció externa no versionada podria mitigar algun buit de servidor; cal demostrar-la abans de canviar el dictamen.

S'han creat l'informe i el seu rebut/àncora pel circuit, s'ha vinculat el pla aprovat i s'han afegit els relleus d'ESTAT i LEDGER. El checksum del LEDGER ja era invàlid en HEAD (fitxer idèntic abans del relleu); s'ha preservat el seu cos i checksum previ, sense certificar-lo ni resegellar-lo silenciosament. Es conserven els canvis concurrents. No s'ha creat cap cron ni schedule; els processos de proves d'esta auditoria han acabat. L'Acta Marmota general de la jornada continua a càrrec de l'orquestradora.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261023_2245_prompt_claude_gemini_codex_botigues_i_auditoria_trio]]
- [[261023_2245_pla_implementacio_botigues_i_auditoria_trio]]
