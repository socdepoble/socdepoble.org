---
type: informe
status: esborrany
description: Prevol de botigues, recompilació natiu des de HEAD, AAB de release i arxiu iOS sense signar; claus pendents del Mestre
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0169a33b-29f4-4bcc-91d1-9724ad79ab0f:47b94860-7c9b-4682-8e5f-f0ed18b5fece
---
# Auditoria Claude: prevol de botigues i compilació de release

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0169a33b-29f4-4bcc-91d1-9724ad79ab0f:47b94860-7c9b-4682-8e5f-f0ed18b5fece |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T21:29:11.223Z |
| Modificació | 2026-10-23T21:58:07Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), Claude Code a l'app d'escriptori |
| Tokens consumits | Workflow de verificació: 1.479.493 (8 subagents). El fil principal no s'ha mesurat. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-23T21:29:11.223Z: esborrany creat amb el torn `torn_0169a33b`.
- 21:33Z: primer relleu (artefactes i decisions); 21:37Z i 21:42Z, dos relleus més (resposta a Gemini, tipus de compte d'Apple).
- 21:58Z: esta versió els substituïx. Integra la verificació adversarial i els informes finals de Codex i Gemini.
- 2026-10-24, al xat: **el Mestre decidix D-1: es manté `org.socdepoble.app` a iOS.** També farà ell la comprovació d'App Store Connect i, si existix el registre vell `com.*`, li canviarà el nom o el retirarà. Comprovat que `SDP_APP_ID`, `PRODUCT_BUNDLE_IDENTIFIER` (`project.pbxproj:343,365`), `applicationId` i `capacitor.config.json` ja diuen `org.socdepoble.app`, i que cap fitxer de `ios/`, `android/`, `src/` ni `scripts/` diu `com.socdepoble.app`. Cap canvi de codi.
- 2026-10-24, al xat: **el Mestre decidix D-2: publica l'equip Individual `9KNUA4JR8P`.** Per ordre seua, Claude ha posat `SDP_APPLE_TEAM_ID=9KNUA4JR8P` a `.env.botigues.local`: només eixa línia, el fitxer continua amb permisos 600 i no s'ha imprés cap altre valor. Ara el prevol d'iOS només demana les claus de l'API d'ASC (no calen per a la ruta manual d'Xcode) i un arbre net (PIPE-02). Queda en marxa la investigació de DSA i del text legal per a un publicador individual.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

**Les pistes internes estan a l'abast esta nit, però no amb els binaris tal com estan.** Els dos s'han compilat bé des de `01ef70dcc` i estan **sense signar**. Abans de pujar-los cal:
- signar l'AAB amb una clau de pujada que encara no existix;
- tornar a fer l'arxiu d'iOS des d'Xcode, signat amb l'equip;
- prendre tres decisions del Mestre, que s'han de fer **abans** de la primera pujada perquè ja no es poden desfer (D-1, D-2, D-3).

**La publicació continua en NO-GO** (Codex, C-01 a C-07). Hi coincidim les tres. TestFlight intern i la prova interna de Play no passen revisió, però les persones provadores trobaran els defectes del §4.

### 1. Què he fet (T1 i T4)

| Peça | Resultat |
| --- | --- |
| Prevol `--plataforma totes` | **Eixida 5.** Falten `SDP_APPLE_TEAM_ID`, `SDP_ASC_KEY_ID`, `SDP_ASC_ISSUER_ID`, `SDP_ASC_KEY_PATH`, `SDP_PLAY_JSON_KEY_PATH` i `SDP_ANDROID_UPLOAD_CERT_SHA256`. Amb `--signa` falten també les quatre de la keystore. Eines, JDK 21 i còpies natives: bé. Cap valor imprés. |
| `dist-natiu/` | **Era vell:** el de les 14:33 no portava `f1977e4d0` ni `b082b13d6`, encara que el prevol diguera que les còpies casaven. L'he recompilat en una còpia neta de HEAD (`git archive` + índex = HEAD). Després l'he posat a l'arbre i he fet `cap sync`; cap fitxer seguit ha canviat. **Resultat:** 547 fitxers, 40.945.257 B, `index.html` `1e933ac07fe64dca…`, idèntic a les còpies d'iOS, d'Android i de dins de l'AAB. El vell és apartat al scratchpad de Claude, no esborrat. |
| AAB | `android/app/build/outputs/bundle/release/app-release.aab`: 40.986.252 B, SHA-256 `474256acc407ec25594692ae149368c6fbe9a737d568b2d538d91e52c872082a`. `org.socdepoble.app` 1.0.0 (1), minSdk 24, targetSdk 36. `BUILD SUCCESSFUL` en 39 s, `--no-daemon`. **Sense signar** (`jarsigner -verify` diu «jar is unsigned»), com toca sense keystore (guarda E1). |
| Arxiu iOS | Release, `generic/platform=iOS`, `CODE_SIGNING_ALLOWED=NO`, al scratchpad: `ARCHIVE SUCCEEDED`. Xcode 27.1, SDK iphoneos27.1, iOS 16.0, iPhone i iPad. Avisos només del connector capgo; cap error. **Servix per a verificar, no per a pujar:** no porta signatura ni entitlements. |
| Signatura disponible | Al disc no hi ha cap keystore de release, cap `AuthKey_*.p8` ni cap JSON de Play. |
| Equip d'Apple | Només un: `9KNUA4JR8P`, **Individual** i de pagament (`teamType = Individual`). El seu únic perfil App Store és per a **`com.socdepoble.app`** (Xcode, 2026-02-03, sense Sign in with Apple). |

### 2. Decisions del Mestre abans de la primera pujada

Cap agent pot prendre-les; totes porten `requires_human_decision: true`.

- **D-1 · DECIDIT (2026-10-24, Mestre): `org.socdepoble.app`.** El Mestre revisa App Store Connect i allibera el nom si cal. El text d'abans de la decisió es conserva a continuació. **Identificador d'iOS: `org.socdepoble.app` o `com.socdepoble.app`.** L'identificador queda fix amb la primera pujada (Apple, «App information»: «You can't change this property after you upload a build»). El projecte, Android, `capacitor.config.json`, les proves i la decisió D1 del laboratori 261003 diuen `org.*`. El perfil de febrer prova que `com.*` ja està registrat a l'equip, i potser hi ha un registre a App Store Connect que ja ocupa el nom «Sóc de Poble». **Proposta:** mantindre `org.socdepoble.app` i, si existix el registre vell, canviar-li el nom o retirar-lo (IOS-02, PIPE-07).
- **D-2 · DECIDIT (2026-10-24, Mestre): equip Individual `9KNUA4JR8P`.** `SDP_APPLE_TEAM_ID` està omplert. El text d'abans de la decisió es conserva a continuació. **Equip que publica: l'Individual `9KNUA4JR8P` o una organització.** Les notes 261003 (D2, D3, O3) donaven per fet un compte d'organització. Amb l'Individual, la botiga mostra el nom de la persona com a venedora i la declaració DSA de comerciant és a títol personal (IOS-05, PIPE-08, PIPE-12).
  - Si el destí final és una organització, cal decidir-ho abans de pujar. Un identificador pujat queda lligat a l'equip, i després només es mou amb una transferència d'app. Amb Sign in with Apple, la transferència demana migrar els identificadors de les persones usuàries [NO VERIFICAT el procediment exacte].
  - TestFlight intern funciona amb qualsevol dels dos.
- **D-3 · Tipus del compte de Play.** Desconegut [NO VERIFICAT]. Si és personal i posterior al 13-11-2023, abans de producció cal una prova tancada amb 12 persones durant 14 dies seguits i verificar un dispositiu (Google, answer/14151465 i 14316361). A la prova interna d'esta nit no li afecta (PIPE-10).
- **D-4 · iPad (D15 del laboratori: «a la v1, només iPhone»).** L'app ix universal (`TARGETED_DEVICE_FAMILY = "1,2"`). No bloqueja TestFlight. Per a la revisió pública caldrien captures d'iPad i una prova en horitzontal i Split View. Segons informes de fòrums, el suport d'iPad no es pot retirar després de publicar-lo [NO VERIFICAT en pàgina oficial] (IOS-04).

### 3. Guia per al Mestre per a esta nit

Les contrasenyes les escriu el Mestre i cap agent les veu (RUNBOOK A4, opció A). Esta nit el camí és el manual: `puja-android.mjs --compila` i `puja-ios.mjs` s'aturen al prevol, perquè demanen la clau JSON de Play i la `.p8` d'ASC (PIPE-01, PIPE-04).

**Android**
1. Play Console › Create app (si no existix): nom, idioma, app, gratuïta (RUNBOOK H-G2).
2. Clau de pujada, una sola vegada i fora del repositori (RUNBOOK H-G3). `keytool` demana les contrasenyes. Còpia de la `.jks` i de les contrasenyes en dos llocs fora de l'ordinador.
```bash
mkdir -p ~/claus-socdepoble && chmod 700 ~/claus-socdepoble && "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" -genkeypair -v -keystore ~/claus-socdepoble/upload-socdepoble.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```
3. Signar una còpia de l'AAB auditat. Així la càrrega és byte a byte la que s'ha verificat; `apksigner` no signa AAB, `jarsigner` sí (Android Developers, «Build your app from the command line»).
```bash
cp "socdepoble.org/android/app/build/outputs/bundle/release/app-release.aab" "_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab"
```
```bash
"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/jarsigner" -sigalg SHA256withRSA -digestalg SHA-256 -keystore ~/claus-socdepoble/upload-socdepoble.jks "_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab" upload
```
   (Les dos ordres, des de la carpeta mare `Som de Poble`.) L'alternativa és Android Studio › Build › Generate Signed App Bundle, però recompila i cal tornar a comprovar la paritat.
4. Empremta per a `SDP_ANDROID_UPLOAD_CERT_SHA256` (no és secreta). Claude la pot verificar i anotar.
```bash
"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" -printcert -jarfile "_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab"
```
5. Play Console › Test and release › Testing › Internal testing › Create release. Acceptar Play App Signing amb clau generada per Google, pujar l'AAB signat, afegir la llista de persones provadores (fins a 100) i desplegar. La primera pujada d'una app nova només es pot fer a mà (Edits API; H-G5). El versionCode 1 queda gastat.
6. Qui tinga instal·lat `_builds_de_poble/android/socdepoble-beta.apk` l'ha de desinstal·lar abans. Està signat amb la clau de depuració i té el mateix paquet, així que l'app de Play no l'actualitzarà (A-06).

**iOS**
1. D-1 ja està decidit (`org.socdepoble.app`, no cal tocar res). Falta D-2: l'equip que es tria a Xcode és el que registra l'App ID `org.socdepoble.app`, i este App ID queda lligat a eixe equip.
2. Supabase › Auth › Providers › Apple: **activar-lo** i posar `org.socdepoble.app` a Client IDs.
   - Ara està apagat (`GET /auth/v1/settings` amb la clau pública: `apple: false`), però iOS sempre mostra «Continua amb Apple».
   - Sense este pas, el botó dona error i només funciona el correu (IOS-03).
3. developer.apple.com: acceptar els acords pendents. App Store Connect › Apps › + › New App, amb l'identificador triat i SKU `socdepoble-ios`. També es pot crear des de l'Organizer d'Xcode en distribuir.
4. Obrir el projecte:
```bash
cd socdepoble.org && npx cap open ios
```
5. A Xcode, target App › Signing & Capabilities: «Automatically manage signing», Team = el de D-2, i comprovar que hi apareix Sign in with Apple.
   - Si Xcode demana accés al clauer per a github.com mentre resol els paquets, cal permetre-ho.
   - **No** cal tornar a fer `build:natiu` ni `cap sync`: `ios/App/App/public` ja és el de HEAD.
6. Destí «Any iOS Device (arm64)» › Product › Archive › Distribute App › App Store Connect › Upload. Xcode crea el certificat de distribució i el perfil.
   - El xifratge ja està declarat exempt (`ITSAppUsesNonExemptEncryption` = false, `Info.plist:44-45`).
7. TestFlight › Internal testing: afegir persones de l'equip d'App Store Connect (fins a 100). Els grups externs passen per Beta App Review, i allí sí que pesen C-01 a C-06 (PIPE-11).
8. Abans de cada pujada nova, cal pujar `CURRENT_PROJECT_VERSION`.

### 4. Què trobaran les persones provadores

Estes troballes no bloquegen les pistes internes, però convé dir-les a qui prove. Totes estan confirmades pel refutador; cap s'ha reproduït en dispositiu.

| ID | Sev. | Abast i evidència | Proposta | Decisió humana |
| --- | --- | --- | --- | --- |
| A-02 | mitjana | Android, botó Arrere. No hi ha `@capacitor/app`, i `MainActivity.java` és un `BridgeActivity` buit. Arrere ix de l'app des de qualsevol pantalla. FASES_1_I_2.txt:487 ho demanava. | `@capacitor/app` (cal aprovar la instal·lació) amb el listener `backButton`, o un `OnBackPressedCallback` a `MainActivity` sense dependència nova. | sí |
| A-03 | mitjana | Alta per correu i recuperació. A Android, `redirect_to` és `https://localhost/…` (`oauthRelay.js:301-316`, `auth.js:376-379,747-750`). A iOS (`capacitor://`), la recuperació falla sempre (`SENSE_TORNADA_RECUPERACIO`). Depén de la llista de redireccions de Supabase [NO VERIFICAT]. | Les tornades natives han d'anar a `origenPublic()` (`https://socdepoble.org/…`), i cal revisar la llista de Supabase. | no |
| IOS-03 | alta | «Continua amb Apple» falla mentre Apple estiga apagat al Supabase de producció. | Pas iOS 2 del §3. | sí |
| A-04 | mitjana | «Les meues dades»: l'exportació no fa res al WebView d'Android, però diu «fet» (`DetallPrivacitat.jsx:47-57,84-90`). | Camí natiu de descàrrega, o com a mínim no mostrar «fet» quan `esAppNativa()`. | sí |
| C-01 | P1 | Controls «En construcció» al xat (Codex). | El que diga el pla. | sí |

### 5. Abans de la revisió pública (per a MarIA)

Ací van C-01 a C-08 de Codex, que no repetisc, més estes. Totes estan confirmades; la severitat és la del refutador.

| ID | Sev. | Abast i evidència | Proposta | Decisió humana |
| --- | --- | --- | --- | --- |
| PAY-01 | mitjana | `public/assets/soc_de_poble_ibanez.webp`, dins dels dos binaris: imatge generada amb una signatura «Ibáñez» falsificada i el segell «ED. BRUGUERA». Risc de propietat intel·lectual i falsa atribució (Apple 5.2.1). Només s'han mirat 4 de les 208 WebP. | Retirar-la, o regenerar-la sense signatura ni segell, i passar una revisió visual per les altres. | sí |
| PAY-02 | mitjana | `legalContent.js:108` diu que Google, Anthropic i OpenAI processen el text de la IAIA. El binari no té eixe flux: la CSP nativa només permet Supabase. | Confirmar si algun procés de servidor ho fa. Si no, reescriure el §11. Si sí, cal consentiment explícit (Apple 5.1.2(i)) i declarar-ho a les fitxes. | sí |
| PAY-03 | mitjana | El selector de nivell d'IA (`SelectorRealitat.jsx:37-43`) promet redacció, traducció i col·laboració multiagent que no estan implementades (Apple 2.1, 2.3.1). | Ajustar el text, o amagar els nivells en natiu. | sí |
| PAY-04 | mitjana | Dispositius (P2P): en natiu només pot mostrar dispositius simulats (`DevicesSection.jsx:25-29`, `BroadcastChannel`). | Excloure-ho del paquet de botiga. | sí |
| PAY-05 | baixa | `/disseny` (galeria del sistema de disseny, 91 fitxers) va dins del paquet sense guarda i carrega un iframe de YouTube. | Excloure-la de la build nativa. | sí |
| PAY-06 / A-11 | baixa | El `wikiManifest` (534 KB) porta 80 documents interns d'operació, un camí local `/Users/javillinares/…` i notes de procés. És el mateix que ja és públic al web. La publicació hi és per defecte (opt-out). | Fer-la opt-in (`visibility: public`), o que el Mestre accepte el conjunt. Traure el camí absolut de `prompt_local`. | sí |
| IOS-06 | baixa | GoogleSignIn, AppAuth i el seu esquema de reserva van dins del binari d'iOS però no s'usen. L'informe de privacitat d'Xcode llistarà dades que l'app no arreplega. | Omplir App Privacy des del comportament real; P1 o el client real de Google. | sí |
| A-07 | baixa | `USE_CREDENTIALS`, `USE_BIOMETRIC` i `USE_FINGERPRINT` vénen de les llibreries i no s'usen. | `tools:node="remove"` al manifest. | no |
| PAY-08 | info | `media_registry.json` i `components/sp-identity-components.js` viatgen sense que res els referencie. | Excloure'ls. | no |
| IOS-05, PIPE-12 | mitjana | La condició de comerciant (DSA) s'ha de declarar a les dues botigues abans de publicar a la UE. TestFlight no compta com a distribució de comerciant. | El Mestre, amb D-2. | sí |
| IOS-08 | info | A partir d'abril de 2027, les apps fetes amb l'SDK 27.1 o posterior necessitaran captures d'«iPhone Duo». | Planificar-ho. | no |

### 6. El canal de botigues (proposta de Claude per la ruta de govern)

`scripts/` és ruta de govern. Ho propose; no ho he tocat.

| ID | Sev. | Defecte | Proposta |
| --- | --- | --- | --- |
| PIPE-01 / PIPE-16 | mitjana | El prevol demana totes les claus de l'API per a qualsevol ruta. Amb el camí manual mai ix amb 0, i el criteri 1 del pla («codi 0 en omplir les claus») no s'acompliria ni amb tot omplert, perquè l'arbre compartit està brut. | Contextos per ruta: `--ruta manual` (Team ID, empremta) i `--ruta api` (`.p8`, JSON). |
| PIPE-02 | mitjana | L'arbre net no es pot aconseguir en un Escriptori compartit (torns, informes), i tampoc prova «fet des d'un commit»: el `dist-natiu` vell de les 14:33 passava amb arbre net. | Compilar les releases en un `git worktree add --detach <sha>`, o en una exportació com la d'esta nit, i limitar la porta a les rutes d'entrada de la build. |
| PIPE-03 | mitjana | El prevol només compara `index.html` amb les seues còpies. No sap si `dist-natiu` és de HEAD. | Que `vite.natiu.config.js` emeta `dist-natiu/sdp-build.json` (SHA complet, entrades brutes, hash de l'arbre). El prevol l'ha d'exigir igual al SHA de la release i comparar els arbres sencers. |
| PIPE-04 | mitjana | `puja-ios.mjs` no passa `DEVELOPMENT_TEAM`. El pegat `PEGAT_261023_P2` existix però no està aplicat. | Aplicar P2 amb el Team ID de D-2. |
| PIPE-14 | baixa | Cap comprovació que `SDP_APP_ID`, `applicationId` i `PRODUCT_BUNDLE_IDENTIFIER` casen. Amb D-1 = `com.*` divergirien. | Comprovació al prevol, amb un valor per plataforma si cal. |
| PIPE-09 / PAY-09 | info | `build:natiu` reescriu `public/rag-index.json`, que és seguit. En HEAD està desfasat respecte a la plantilla `prompt_local` de `5daa12bc8`. | Regenerar-lo en el commit que canvia la Wiki, o no seguir-lo. |
| A-08 | baixa | L'AAB no porta procedència: `version-control-info` diu `NO_SUPPORTED_VCS_FOUND`, perquè l'arrel de Gradle és `android/`. | La mateixa marca de PIPE-03, copiada al rebut. |

### 7. Diàleg creuat

- **Codex** (`261023_2328`, final). Confirma físicament l'AAB (C-08) i accepta que NO-GO públic no és NO-GO intern. Hi afegisc que la ruta de signatura amb el script també està tancada esta nit (A-01) i que l'arxiu d'iOS s'ha de refer signat (IOS-01).
  - La seua reserva sobre «arbre brut» coincidix amb PIPE-02.
  - La seua proposta d'un únic SHA complet a la plantilla coincidix amb el §8.
  - C-04 (revocació d'Apple) s'agreuja: a més, el proveïdor està apagat al servidor (IOS-03).
- **Gemini** (`261023_2331`, final). Ja mesura el natiu nou (`1e933ac0…`) i l'AAB, i marca G-01 com a resolt.
  - El seu G-03 recomanava `puja-android.mjs --compila`. No funciona esta nit, perquè el prevol exigix el JSON de Play i un arbre net (A-01, PIPE-01). El camí és el §3.
  - El seu «100% aptes per a pujar» de la primera versió només val després de signar, i la seua versió final ja ho diu.
- **Les tres coincidim:** pistes internes sí, quan estiga signat; publicació no.

### 8. Retroalimentació de la plantilla `prompt_local`

- Fixar un sol SHA complet com a tall. Este prompt en nomenava tres: `95175575d`, `b082b13` i el `9027265e1` del pla.
- Separar compilar, signar, pujar i publicar, amb el responsable de cadascun. «Generar l'AAB signat» no és executable per una IA sense les claus del Mestre.
- Posar com a precondició el tipus de compte de cada botiga i l'identificador de l'app, perquè decidixen el camí.
- El criteri de verificació del prevol ha de dir quina ruta: «0» no és possible en la manual.
- «Llegir sencer qualsevol document de l'Escriptori»: limitar-ho al primer nivell i excloure-hi `01_produccio`, `02_investigacio_ia` i l'arxiu.
- Cadència del canal viu: el prompt diu 10-15 minuts i la lliçó 261003 de `wiki-documentacio-i-reflex` en diu 3-4. Cal triar-ne una.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| `node scripts/botigues/preflight.mjs --plataforma totes` | Eixida 5 (§1). Amb `--plataforma android --signa`: eixida 5. |
| `npm run build:natiu`, en una exportació neta de HEAD `01ef70dcc` (índex = HEAD) | Eixida 0. Únic fitxer seguit que canvia: `public/rag-index.json` (PIPE-09). |
| `npx cap sync` (CI=1), a l'arbre | Eixida 0, sense canvis seguits. capgo social-login 8.5.12 a les dues plataformes. |
| `./gradlew --no-daemon bundleRelease` (JBR 21) | `BUILD SUCCESSFUL` en 39 s. AAB sense signar (`jarsigner -verify`). |
| `xcodebuild … archive` sense signar (Xcode 27.1) | `ARCHIVE SUCCEEDED`, 0 errors. |
| Paritat `index.html` | `dist-natiu`, iOS, Android i dins de l'AAB: `1e933ac07fe64dca…` (també ho comproven Gemini i Codex). |
| `node --test tests/botigues.test.mjs tests/natiu-build.test.mjs` | 41/41. |
| `npx vitest run src/natiu --maxWorkers=2` | 55 passen, 1 omesa. |
| Verificació adversarial (workflow `wf_0801dc57-c66`) | 4 revisors de només lectura (Android, iOS, contingut del paquet, ruta de pujada) i 1 refutador per dimensió. **46 troballes, 46 confirmades.** Quatre han baixat de severitat: A-05, IOS-02, PAY-07 i PIPE-11. Les polítiques s'han contrastat amb pàgines oficials d'Apple i Google amb data d'avui; on no s'ha pogut, porten [NO VERIFICAT]. |
| `node tooling/wiki/document.mjs check` sobre este informe | `valid: true`, sense errors. Pla aprovat vinculat (`document.mjs plan`, hash `bcbac0c3…`) i informe declarat propi (`document.mjs own`). |
| `node tooling/gates/tancament.mjs --check --turn-id torn_0169a33b…` | Eixida 1, estat `planned`: 1.273 incidències globals anteriors (enllaços trencats a `00_index_escriptori.md`, `03_llibre_d_or_memoria_episodica`, `memoria_aprenentatges`…), com les que compta Codex. Cap afecta este informe. No he executat `--close`. |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Res signat ni pujat.** No he escrit cap contrasenya ni cap clau, i no he omplert `.env.botigues.local` (cap valor llegit ni imprés). No he obert Xcode ni cap consola de botiga.
- **Cap prova en dispositiu ni emulador.** L'AVD continua trencat. Les troballes de comportament (A-02, A-03, A-04, IOS-04) es basen en lectura de codi i del binari.
- **Una sola consulta remota:** un revisor va fer `GET /auth/v1/settings` al Supabase de producció amb la clau pública anon. És una lectura de configuració pública, sense cap escriptura.
- **Abast de la verificació.** Cobrix els binaris i la ruta de pujada. No és una auditoria de producte: eixa és la de Codex.
- **Canvis a l'arbre viu:**
  - `dist-natiu/` substituït; el vell és apartat a `/private/tmp/claude-501/-Users-javillinares-Documents-Antigravity-Som-de-Poble/c930133b-5e2b-4c9c-a78e-2495b7fc2eab/scratchpad/dist-natiu-anterior-261023_1433`;
  - còpies natives sincronitzades;
  - `android/app/build/` i `android/build/`, ignorats per git.

  Fora d'això, cap fitxer seguit, cap codi de producte i res de `scripts/`, `tooling/` ni `.agents/`. No he escrit ESTAT ni LEDGER: el relleu és de MarIA.
- **Processos.** Cap cron ni schedule creat. El workflow ha acabat. Gradle ha corregut amb `--no-daemon`, i en tancar no quedava cap dimoni de Gradle, Kotlin ni xcodebuild.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261023_2245_prompt_claude_gemini_codex_botigues_i_auditoria_trio]]
- [[261023_2245_pla_implementacio_botigues_i_auditoria_trio]]
- [[261023_2328_auditoria_codex]]
- [[261023_2331_auditoria_gemini]]
