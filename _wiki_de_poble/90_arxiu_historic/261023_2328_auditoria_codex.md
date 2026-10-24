---
type: informe
status: esborrany
description: Auditoria Codex de botigues i addenda adversarial de Claude, DSA i P3, amb proves i contrast de codi i artefactes
tags:
  - auditoria
visibility: private
reflex: sdp:torn_94df0b65-86cb-4a5d-8647-3e6e7e15dfe3:28d3447f-8a74-4570-9734-86a4ae906997
---
# Auditoria adversarial de botigues, privacitat i fronteres

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

**Actualització vigent:** vegeu l’addenda del 2026-10-24, davall de les troballes inicials, per al contrast de Claude §9–§10, P3 i les pistes internes. El primer bloc conserva el tall del 2026-10-23.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_94df0b65-86cb-4a5d-8647-3e6e7e15dfe3:28d3447f-8a74-4570-9734-86a4ae906997 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T21:28:53.319Z |
| Modificació | 2026-10-23T23:40:58+00:00 |
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

### Addenda 2026-10-24 · Auditoria adversarial de Claude §9–§10 i del pegat P3

**Dictamen actual:** P3 és un esborrany útil, però **no l'aprovaria per a publicar en l'estat revisat**. La prova de regressió passa; falta completar el contacte, la política d'expulsió i l'execució real dels compromisos. **Els binaris presents tampoc estan llestos per a pujar a pistes internes: continuen sense signar.** Una prova interna preparada després de signar i configurar el compte és una fase diferent de publicar l'app oberta.

D-1 (`org.socdepoble.app`) i D-2 (equip Individual `9KNUA4JR8P`) són decisions humanes vigents i **no es tornen a demanar**. Decidir l'equip no signa automàticament el binari ni determina la condició de comerciant o l'aplicabilitat de la DSA.

**Traçabilitat.** Encàrrec `261024_0130_prompt_codex_gemini_auditoria_adversarial_claude_i_dsa`; pla vinculat al torn `torn_0b08c39b-2bf0-4275-be82-0ed0c59efc56`. `document.mjs context --route auditoria` ha entregat la plantilla viva v2.0.0 i el rebut `fc924209-00ba-4e4d-8e0c-d92c37144ffe`; l'original d'este informe conserva el seu rebut i la seua data. Tall de Git `b8fbb881a`, amb canvis documentals concurrents ja presents. Esta addenda és l'actualització del rol Codex, no una nova ordre d'implementació.

Fonts físiques principals, llegides íntegrament o per trams consecutius fins a completar-les:

- Informe Claude, 327 línies, SHA-256 `1659a2cf1a51db71f97b679b31b6cfc9fdbe6d14229fee6b0f98d9d6e65eb603`, amb §9 i §10.
- P3 `PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch`, SHA-256 `b5b539946a8365af38dc8bf814221bf8865a301a60e4d5a5cdf1daa6b9c7a939`.
- Informe Gemini, SHA-256 `b39870e0a907ae5c6a01d9ffe0b7d747318a82f9e65056c7150d3b64ea32ab8d`, pla i prompt del trio, pla i prompt actuals, Llibre Mestre i Acta Marmota de les 00:35. De l'índex s'han rellegit els canvis respecte de la lectura íntegra anterior; no s'han recorregut automàticament els seus arxius històrics.

#### A. Contrast de §9: confirmacions i afirmacions que cal delimitar

| Afirmació | Resultat de la revisió |
|---|---|
| Declaració Apple de comerciant i TestFlight | Confirmat el tractament diferent de TestFlight. Apple demana declarar l'estat quan es tramet una app nova, també fora de la UE; Apple no decidix si la persona és comerciant. L'accés al tràmit no és exclusiu del titular: **Account Holder o Admin**. |
| Contacte públic d'un comerciant Individual | Confirmats adreça, telèfon i correu, amb alternativa postal documentada. Açò no obliga a publicar el domicili particular si hi ha una alternativa admesa i acreditada. |

Font comuna: [Apple, requisits de comerciant DSA](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/). Les subvencions, la feina professional i els plans de monetització són indicis a valorar; no convertisc cap d'ells en una classificació jurídica automàtica del Mestre.

| Afirmació | Resultat de la revisió |
|---|---|
| «Google Commerce Limited és comerciant de registre de tot Google Play», basat en DDA 3.4 | **Massa àmplia.** El DDA repartix eixe paper entre Google i el desenvolupador segons territoris. [DDA vigent, §3.4](https://play.google/developer-distribution-agreement.html). |
| «Google Play no té cap declaració de comerciant DSA» | No ho donaria com a absolut universal vigent. L'auditoria oficial 2024 documenta la interpretació de Google Ireland per a la UE i el període 28-08-2023–31-05-2024; no és una decisió de la Comissió ni una inspecció de la consola actual del Mestre. [Auditoria oficial, pàgines PDF 5 i 16](https://storage.googleapis.com/transparencyreport/report-downloads/dsa-audit-google-play_2023-8-28_2024-5-31_en_v1.pdf). Formulació prudent: no s'ha identificat un tràmit separat equivalent al d'Apple en la documentació consultada; verificar els requisits efectius del compte. |
| Google personal gratuït: nom, país i correu públics | Confirmat com a regla general; falta reservar els requisits addicionals de determinades regions i el canvi si es monetitza. [Google, informació del compte](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en). |
| Personal nou: 12 persones / 14 dies | Confirmat per a comptes personals creats després del 13-11-2023, abans d'accedir a producció; no és el requisit de pista interna. [Google, accés a producció](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en). El tipus i data del compte real continuen sense comprovar-se. |
| Canvi personal → organització a Google | Confirmat, amb verificació, perfil de pagaments i requisits del procediment; no cal reobrir D-2 d'Apple per això. [Procediment de Google](https://support.google.com/googleplay/android-developer/answer/16260648?hl=en). |
| «Salut no pot anar a iOS mentre l'equip siga Individual» | Cal condicionar-ho al servei i dades efectivament distribuïts. Apple 5.1.1(ix) contempla serveis regulats o informació sensible; no prohibix una etiqueta anomenada Salut. [Apple 5.1.1](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage). `src/apps/salut/manifest.js` és DEV o `VITE_SDP_APP_SALUT=1`, desactivat per defecte. No bloquege amb esta frase una beta sense el mòdul; si s'hi inclou el diari de salut, cal validar el supòsit amb Apple. El caràcter local de les dades no elimina per si sol el risc. |

#### B. P3: buits de contacte i mesures de moderació

La qualificació concreta de Sóc de Poble com a servei intermediari/allotjament/plataforma i les possibles exempcions han de quedar documentades abans d'afirmar conformitat. El compte Individual d'Apple no resol eixa qüestió.

| ID / prioritat del text | Contrast normatiu i aplicació al pegat |
|---|---|
| P3-01 · P1 abans de publicar E6 | L'art.12.1 inclou elecció de mitjans. P3 només identifica un correu i §10 deixa un segon canal fora. Eixe estat **no acredita la tria**: cal concretar i provar una alternativa real, mantenint contacte humà. |
| P3-02 · P1 abans de publicar E7 | L'art.14.4 exigix proporcionalitat. «Retirem i expulsem» per qualsevol falta és una regla uniforme que cal revisar; no deduïsc que siguen obligatòries sancions graduades. |
| P3-02, motivació | Art.17.3 inclou abast territorial quan pertoque. Cal incorporar-lo al model de comunicació. L'art.19 pot eximir micro/petites empreses dels arts.20–21, preservant l'excepció24.3; no donar «només jutjats» per suficient sense acreditar el supòsit. |

Font normativa comuna: [DSA al BOE, arts.12,14,17,19](https://www.boe.es/buscar/doc.php?id=DOUE-L-2022-81573). Estes són observacions d'auditoria, no una determinació jurídica de l'activitat del Mestre.

**Proposta conservadora:** tornar E6/E7 a Claude amb estos punts acotats. L'expulsió uniforme ja figura a les normes de l'app; no s'ha de canviar només al text legal i conservar una promesa contrària a `ca.js:631`. La revisió de proporcionalitat i el responsable de moderació són decisions operatives que falten, no errors de sintaxi. `requires_human_decision: true` quant a l'operació i les mesures, sense reobrir D-1/D-2.

La ruta de denúncia per correu recull els elements que Claude declara haver incorporat; el formulari curt de l'app és un canal diferent. El correu manual pot ser un mecanisme vàlid si realment s'atén. El pegat no crea ni la cua humana, ni els correus de recepció/decisió/motivació. Les 24 hores són un compromís del servei, no un termini general que la norma impose a tots els casos. Claude ja deixa estes confirmacions pendents: es confirma la reserva, no es presenta com una troballa nova de codi.

#### C. P3-03 · P2: versió futura no és avís previ ni consentiment recollit

**Evidència de producte:** condició2 de Claude §10 (`261023_2330:270`) proposa versió2.2 i fila amb `vigent_des_de` futur «per avisar abans». Però `politiques_privacitat` té RLS `vigent_des_de <= now()` (`2609261500_identitat_perfil_f1.sql:382`), i `estat_consentiment()` aplica el mateix filtre (`:679-684`). La fila futura és invisible al destinatari ordinari. L'únic consumidor de l'estat és `DetallPrivacitat.jsx:130-142`, quan s'obri aquella vista; no s'ha trobat un avisador global.

`2610081543_xat_consentiment_i_metadades.sql:97` comprova el timestamp del consentiment del padró, no la versió. `cal_reconsentir` és un resultat consultable; no implica que s'haja mostrat l'avís, que s'haja acceptat ni que tot tractament quede bloquejat.

**Acceptació requerida:** definir l'instant d'avís, el text nou accessible abans de l'entrada en vigor, el canal efectiu i el rebut de la nova acceptació quan pertoque. No es declara il·legal continuar tot tractament contractual per falta d'un nou clic: el defecte és donar per executat un flux que el codi no executa. Cal segellar el text complet, la seua empremta i la versió visible; P3 encara deixa el rètol **2.1** perquè Claude el reserva com a pas separat. `requires_human_decision: true` per a calendari i canal.

#### D. P3-04 · P2: la migració no recupera acceptacions només locals

**Evidència:** `src/app/contexts/ModeracioContext.jsx:327-339` tolera `NO_DISPONIBLE` de l'RPC i desa la versió en local. En la visita següent `:280-282` la considera acceptada, `:297` evita preguntar al servidor i `:309-311` deixa continuar. Instal·lar després `2610201500` no crea la fila amb data/versió/IP que E11 promet guardar.

Les proves existents també ho acrediten: `ModeracioContext.test.jsx:254-260` exigix no preguntar al servidor si hi ha cache, i `:284-296` acredita la reserva local sense migració. Han passat en este torn. No s'ha fabricat una fila remota ni s'ha afirmat que la migració estiga o no aplicada en producció.

**Correcció conservadora:** el pla d'aplicació ha d'incloure sincronització o reacceptació verificable per a qui només té la cache; alternativament, E11 ha de distingir l'acceptació local de la prova del servidor mentre existisca eixa reserva. No traslladar retroactivament una data/IP inventada. `requires_human_decision: false` per al diagnòstic; el canvi de flux necessita el seu encàrrec.

#### E. P3-05 · P2 operatiu: Private Email Relay requerix més que un domini escrit

La condició3 de Claude és necessària però cal fer-la verificable: registrar les **fonts reals** de correu, inclosos subdominis/remitents que s'usen, autenticar SPF i/o DKIM amb l'alineació prevista i provar recepció des del servei real en una adreça relay d'un compte de prova. Registrar només el domini web no acredita eixa entrega. [Apple, configurar el relay privat](https://developer.apple.com/help/account/capabilities/configure-private-email-relay-service/).

No s'ha enviat cap correu ni s'ha vist la configuració privada del compte: no es declara que el registre falte, sinó que **no està acreditat**. L'activació d'Apple a Supabase i el relay de correu són configuracions diferents. No es poden anunciar motivacions entregades sense el camí funcional. `requires_human_decision: true` per a configuració i prova del correu.

#### F. P3-06 · P2 deute de dades: l'exportació no inclou tota la moderació

E11 declara denúncies, bloquejos i acceptacions. L'únic `exporta_les_meues_dades()` (`2609261500_identitat_perfil_f1.sql:963-1087`) no inclou `denuncies`, `bloquejos` ni `normes_acceptades` de la migració posterior. La UI (`DetallPrivacitat.jsx:98-100`) promet una còpia de «tot». Cal completar l'exportació de les dades pròpies i mantindre protegida la identitat dels denunciants aliens. Este deute és anterior al pegat; s'ha incorporat al Llibre Mestre i no s'usa com a prova que cada frase d'E11 siga falsa.

**Retenció de denúncies:** `2610201500:87-112` lleva el FK de qui denuncia amb `ON DELETE SET NULL`, però conserva objecte, autor, detall i empremta. «Es conserva desvinculada del compte» hauria de dir que es lleva **la vinculació directa com a denunciant**, sense suggerir anonimització completa. Els identificadors i el text poden continuar identificant persones. El termini indefinit «mentre facen falta» continua requerint criteri operatiu i revisió; el SQL no l'executa.

**Confirmacions sense defecte nou:** E4 clarifica el subjecte; E14 corregix l'apartat20; la clau local `sdp_embed_normes-convivencia:*` és exacta; hi ha pebre per a les empremtes; les cascades de bloquejos, acceptacions del servidor i motiu de baixa encaixen amb la descripció. L'afegit d'Apple descriu un flux que el client oferix, però el backend viu el té apagat: no es pot considerar provat en ús real. No s'han verificat contractes d'encàrrec ni dades legals personals.

#### G. Contrassenya de pistes internes: NO-GO dels artefactes presents, prova possible després de signar

| Control físic executat | Resultat |
|---|---|
| AAB satèl·lit `../_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab` | 40.986.252 bytes, SHA-256 `474256acc407ec25594692ae149368c6fbe9a737d568b2d538d91e52c872082a`; idèntic a l'AAB anterior. `jarsigner -verify`: **unsigned**. No és una signatura nova. |
| Manifest Android dins de l'AAB | `org.socdepoble.app`, 1.0.0(1), minSdk24, targetSdk36. D-1 complida. |
| Paritat completa | Els 547 fitxers de `dist-natiu/` (40.945.257 bytes) coincideixen per hash amb iOS, Android i AAB; només hi ha els dos extres Cordova de plataforma. És una comprovació més àmplia que comparar només l'index. |
| Arxiu iOS físic inspeccionat en el scratchpad de Claude | `org.socdepoble.app`, 1.0.0(1), arm64, iOS16/SDK27.1, iPhone/iPad; sense signatura, equip al rebut, `_CodeSignature` ni perfil incrustat. `codesign` diu que no està signat. No servix per a pujar com està. |
| D-2 | El prevol ja no diu Team ID absent. Però `project.pbxproj` no fixa `DEVELOPMENT_TEAM` i `puja-ios.mjs:71-73` no el passa. Cal seleccionar/configurar l'equip i generar/exportar una candidata signada amb provisionament correcte. |
| Prevol actual | Totes: eixida5 per empremta Android, claus API ASC i JSON Play; Android `--signa`: també les quatre variables de keystore. La ruta manual evita les claus d'API, **no la signatura**. |

La generació local correcta prova la compilació. No prova la verificació del compte, els acords, el registre d'app, el processament de la consola o la instal·lació física. El GO de l'Acta de les 00:35 s'ha de llegir com a **viabilitat condicionada**, perquè ella mateixa diu «per ser signat i pujat». No és una entrega ja uploadable ni una prova de producte acabada.

**Riscos de prova confirmats:**

- GET públic `/auth/v1/settings`, sense mutació ni credencial en la sortida: `apple=false`, `google=true`, `email=true`, alta habilitada. iOS oferix Apple sempre; el bescanvi fallarà mentre el proveïdor continue apagat. És un risc del recorregut de prova, no de carregar el fitxer a TestFlight.
- La sonda pura de `urlDeTornadaRecuperacio` llança amb `capacitor://localhost/registre` i retorna `https://localhost/registre?sdp_auth=recuperacio` a Android. Cal resoldre les tornades natives i provar-les en dispositiu. No és una fuga de trànsit HTTP. `mailer_autoconfirm=true` al servidor: el defecte de retorn no acredita que l'alta actual quede sempre bloquejada per confirmació; sí que queda pendent la recuperació.
- Arrere Android i descàrrega al WebView continuen requerint prova en dispositiu. La lectura d'un `BridgeActivity` buit o d'un `a.download` no és, per si sola, la reproducció física; no convertisc totes les afirmacions de comportament de Claude en «confirmades en aparell».

**CSP C-05:** correcció confirmada **al fitxer local** `firebase.json:22`. HEAD del web viu a les 01:27:39 CEST del 2026-10-24 continua sense `media-src` (200; Last-Modified 2026-10-23 15:10:02Z). Per tant, pendent desplegar i verificar. No afecta la política empaquetada nativa ni obliga a reconstruir-la per a este canvi d'allotjament.

#### H. Balanç de l'encàrrec i verificació d'esta addenda

| Tasca del prompt actual | Estat i evidència |
|---|---|
| Auditar §9 i §10 | **FET:** fonts oficials i contrast de codi/SQL, amb límits expressos. No s'aprova jurídicament el text. |
| Auditar E4/E6/E7/E11/E14 | **FET:** diff aplicable i 215 proves sobre còpia amb P3; E6/E7 i condicions d'E11 pendents abans de publicar. |
| Migració2610201500, versió2.2, relay | **PARCIAL:** condicions auditades; aplicació remota, avís i entrega de correu no acreditats ni executats. |
| Validesa de pistes internes | **FET el dictamen / NO FET el llançament:** dos artefactes sense signar; decisions D-1/D-2 acceptades; recorreguts d'auth pendents. |
| Llibre Mestre | Actualitzat amb els deutes i la correcció material de la transcripció d'equip; cap decisió humana nova inventada. |
| Informe | Esta addenda conserva l'auditoria anterior i separa els dos talls. |

Proves i comprovacions d'este torn:

1. `git apply --check` de P3 sobre l'arbre viu: **0**. Aplicat només a `/private/tmp/sdp-p3-codex-261024-7fq3td8e`, una exportació seleccionada de HEAD, sense `.env` i amb dependències existents; **cap canvi al font viu**. La còpia temporal pròpia s’ha netejat en tancar, després de conservar el resultat del test. Dos intents inicials de l'arnés temporal van fallar per marcadors/helpers no exportats; s'ha completat l'arnés abans del resultat definitiu. No s'han confós amb fallades del pegat.
2. `vitest run src/sections/text src/components/universal/editorial.test.js src/components/universal/richText/extensions/targetes/formaDelGrup.test.js --maxWorkers=2`, amb P3 en la còpia: **215/215, 14 fitxers, 7,76s, eixida0**. ESLint del fitxer legal amb P3: **0**. Estes proves no comproven conformitat jurídica ni execució del correu/servidor.
3. `vitest run src/app/contexts/ModeracioContext.test.jsx src/data/supabase/compte.test.js src/sections/profile/DetallPrivacitat.moderacio.test.jsx --maxWorkers=2`: **54/54**, eixida0. Inclouen els comportaments de cache local comentats més amunt.
4. `node --test tests/botigues.test.mjs tests/natiu-build.test.mjs`: **41/41**, eixida0.
5. Font legal viu encara SHA-256 `7503adcdba2fef9102bf2c509fc4ac80a592822f97ab6e5dd25977a1bdba83fb`; P3 no aplicat. No s'ha repetit tota la suite de21.161 perquè no s'ha canviat codi de producte; el resultat de la primera auditoria continua identificat en el seu tall.

**Condicions de publicació de P3 que ha de consumir el pla següent:** tancar P3-01/P3-02; evidència remota de la migració i de les acceptacions; calendari i canal d'avís/versió efectivament executats; fonts/autenticació/entrega relay; responsable i cobertura24h, criteri de conservació i model de motivació. Mantindre el NO-GO públic dels altres blocs de producte fins que se'n demostre la reparació. No s'executa cap d'estes mutacions en esta auditoria.

**Millora de la convocatòria:** marcar un SHA complet i hashes dels artefactes; substituir «AAB fresc» per hash+estat de signatura; diferenciar CSP local/desplegada; distingir una decisió humana del seu efecte tècnic; i completar l'estat editorial del pla, que encara mostra les quatre opcions i aprovació pendent malgrat l'encàrrec humà explícit. Este últim defecte documental no ha impedit una auditoria autoritzada.

#### I. Rèplica a l'addenda de Gemini: no s'ha de corregir un pegat diferent

La nova addenda Gemini G-05…G-09 i §6 s'ha publicat durant este torn i s'ha llegit íntegrament en contrast amb la versió anterior (SHA-256 de la versió ara revisada: `f8775a5ee1e9eae9b5e8fba2dc33bc991c7fb0a7e687122ac2091e382ec74ce3`). Algunes conclusions **no corresponen al P3 amb hash `b5b539…`**, que continua intacte. Comprovació literal independent en dos revisions:

| Afirmació de Gemini | Evidència sobre P3 i font viu |
|---|---|
| G-05 cita «Si no has iniciat sessió…» per denunciar bloqueig anònim | **0 aparicions** en P3. La línia38 diu «amb la sessió oberta». El problema de client que explica Gemini no és una contradicció d'eixa frase real. **No aplicar eixa esmena al P3 com si reparara un error present.** |
| G-08 atribuïx a E4 «…abans de continuar» i recomana llevar-ho | **0 aparicions**, també de «abans de continuar». E4 real definix «nosaltres» al §1. La mancança d'avís/reconsentiment real sí existix (P3-03), però no es resol esborrant una cita absent. |
| G-07 cita «El meu compte» i «Pots retirar el consentiment donant-te de baixa» | **0 aparicions** en el pegat i en el text legal viu. `legalContent.js:153` ja assenyala Privacitat i dades. Estes dues cites no sustenten la correcció proposada. |
| La matriu diu que E6 incorpora `Apple Inc.` i `@privaterelay.appleid.com` | **0 aparicions** de les dos cadenes en P3. E6 real és el punt de contacte DSA; les dades Apple són E11. Cal usar la numeració del diff real. |
| G-06 afirma que falta tot criteri de conservació | La línia79 sí conté «mentre facen falta per a respondre reclamacions o requeriments sobre aquella decisió». Es pot qüestionar la concreció i la seua execució; **no afirmar que falta literalment**. El màxim3anys nou proposat necessita una decisió fonamentada; no s'hereta del termini dels consentiments. |

No es pot determinar si Gemini ha llegit una versió anterior o ha reconstruït el text. Es poden refutar estes cites sobre l'artefacte identificat, sense atribuir intencions. **La seua omissió d'exportació sí és correcta**, i concorda amb P3-06; també coincidim en la necessitat de comprovar desplegament, registre de versió i relay. El consens ha de conservar eixes coincidències i retirar els falsos positius.

**Altres dos matisos de la mateixa addenda:**

- G-09 no acredita automàticament l'exempció de micro/petita empresa pel tipus de titular. La reserva de l'art.24.3 ha de continuar explícita; vegeu B. La plantilla, finances i vinculacions efectives no s'han inspeccionat.
- §6 declara irreversible el certificat d'upload de Google. **És refutable:** amb Play App Signing hi ha un procediment de reset d'upload key per pèrdua o compromís. Cal distingir clau de pujada, clau de signatura de l'app i identificador del paquet. [Google, Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en). Açò no lleva la necessitat de custodiar la clau que es trie.
- La frase «no existix cap risc d'escaneig binari ni de penalització de compte» després de signar **no està demostrada per una inspecció local**. Hi ha comprovacions favorables de manifests, però cap rebut d'ingestió, compte verificat, processament o instal·lació en consola/dispositiu. Mantinc la viabilitat condicionada i no una garantia de risc zero. Tampoc es confon la presència d'un Privacy Manifest amb haver superat un escaneig real d'Apple.

**Tancament mecànic del torn:** `document.mjs check` de l'informe passa. Olivera, plantilles, autoritat, segell i skills ixen0. `tancament --check --turn-id torn_0b08c39b…` ix1, `planned`, amb1.277 incidències:4 de metadades preexistents del Llibre Mestre (reflex absent i3etiquetes fora de l'enum),1 de LEDGER,1 de compilació Wiki,1.008 enllaços,242 àncores i21 orfes. El frontmatter del Llibre és **idèntic al de HEAD abans de les edicions**; no s'ha migrat la governança del document permanent per fer passar l'auditoria. No hi ha cap error del contracte de l'informe propi. S'han actualitzat ESTAT i el relleu de LEDGER, preservant el checksum previ ja invàlid; no s'ha executat `--close`.

Cap cron creat, cap missatge a tercers, cap correu de prova enviat, cap build nou i cap mutació remota. Els processos de proves i els subagents propis han acabat. L'Acta Marmota0035 s'ha llegit; MarIA pot consolidar-hi després les conclusions d'esta addenda sense confondre-la amb el tall anterior.


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
- [[261024_0130_prompt_codex_gemini_auditoria_adversarial_claude_i_dsa]]
- [[261024_0130_pla_implementacio_auditoria_adversarial_claude_i_dsa]]
