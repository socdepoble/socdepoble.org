---
type: informe
status: esborrany
description: 'Auditoria creuada del pla 261023_1345 sobre la feina de Gemini: guarda de signatura Android, textos de permisos d''iOS, versió 1.0.0, splash verd a Android 12 i llista del Mestre per a les botigues.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_61d14ca6-2bec-4c49-9e31-0827ac2aea68:eed43cc1-08f8-4d92-999b-76645e1d4ed9
---
# Auditoria de Claude — Botigues mòbils: segon pas sobre T1-T4

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_61d14ca6-2bec-4c49-9e31-0827ac2aea68:eed43cc1-08f8-4d92-999b-76645e1d4ed9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T12:48:59.074Z |
| Modificació | 2026-10-23T13:05:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) amb dos workflows d'11 subagents |
| Tokens consumits | ~1,9 M als subagents, més el context principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-23T12:13Z · Arribada: el pla 261023_1345 ja l'executava una altra mà. `.env.botigues.local` i `.env.natiu.local` són de les 14:11 i `android/app/build.gradle` de les 14:12. Torn obert: `torn_61d14ca6-2bec-4c49-9e31-0827ac2aea68`.
- 2026-10-23T12:20Z → 12:47Z · Workflow d'auditoria de només lectura: cinc auditors (T1, T2-iOS, T2-Android, T3, T4) i un crític de completesa. Tots els experiments s'han fet en còpies fora del repositori. Gradle ha compilat en una còpia d'`android/` i Xcode en una d'`ios/`.
- 2026-10-23T12:20Z · Gemini deixa `261023_1418_auditoria_gemini.md`, que cobrix T1, T3 i T4 executats. Este informe s'hi suma; no el repetix.
- 2026-10-23T12:46Z · Aplicats els canvis E1-E4 (§A). Cap fitxer ha entrat a l'índex de git.
- 2026-10-23T12:48Z · Relleu de progrés en este mateix document (versió 0.1.0).
- 2026-10-23T12:50Z → 13:00Z · Workflow de verificació, en verd (§Verificació):
  - compilació Android i iOS en còpies;
  - proves de `src/natiu`, `natiu-build` i `botigues`;
  - preflight i porta Olivera;
  - revisió adversarial;
  - pegats P1 i P2.
- 2026-10-23T13:00Z · Retoc de la frase anglesa de la càmera, que es podia llegir malament. Les proves s'han tornat a passar.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### A. Canvis aplicats per Claude a l'arbre de treball (sense indexar)

Les còpies prèvies dels fitxers són a l'scratchpad de la sessió, fora del repositori. Cap fitxer ha entrat a l'índex.

**E1 · `android/app/build.gradle`: el `signingConfig` de release només s'aplica si hi ha clau.** Severitat alta. Corregix el bloc que Gemini va afegir a les 14:12.
- Evidència reproduïda dues vegades en còpia, amb totes les `SDP_ANDROID_*` buides:
  - `:app:bundleRelease` falla a `:app:signReleaseBundle` amb `java.lang.NullPointerException` (`FinalizeBundleTask.kt:168`);
  - `:app:assembleRelease` falla amb `SigningConfig "release" is missing required property "storeFile"`.
- El disseny del laboratori (`nous/botigues/LLEGIU.txt:98-99`) diu el contrari: sense eixes variables, el bundle ix sense signar i `puja-android` para amb l'eixida 8.
- Canvi: `if (System.getenv('SDP_ANDROID_KEYSTORE_PATH')) { signingConfig signingConfigs.release }`.
- Es conserva el `versionName "1.0.0"` de Gemini. És necessari: `entorn.mjs:239` exigix X.Y.Z.
- **Índex.** L'índex que va preparar una altra mà portava la versió anterior de `build.gradle`, sense la guarda. A les 15:15 del 261023, per ordre del Mestre al xat, s'han indexat els deu fitxers d'E1-E4. L'índex ja porta la guarda.

**E2 · Textos dels permisos d'iOS (guideline 5.1.1).** Severitat mitjana.
- Micròfon: el botó «Grava àudio» del xat (`ControlsAdjunt.jsx:187,208` → `getUserMedia({audio:true})`, `adjuntLocal.js:186-191`) és el que fa saltar l'avís. El text deia que el micròfon era només per al so dels vídeos.
- Càmera: el text només parlava del mercat i del perfil, però el xat i l'editor accepten fotos i vídeos (`ControlsAdjunt.jsx:204`, `UniversalEditorShell.jsx:744`).
- Text nou en valencià:
  - càmera: «…per a fer les fotos i els vídeos que compartixes amb el poble i la foto del teu perfil»;
  - micròfon: «…per a gravar els àudios del xat i el so dels vídeos que compartixes amb el poble».
- Fitxers: `Info.plist`, els cinc `InfoPlist.strings` (ca, es, en, eu, gl) i les dues línies `TEXTOS_CA` de `src/natiu/projecteIos.test.js`. Este últim fitxer el té indexat Gemini; el meu tros (línies 34-35) no se solapa amb els seus (17 i 193-221).
- **Han d'anar junts.** Si algú indexa `projecteIos.test.js` sense els sis fitxers d'iOS, el commit tindrà dues proves en roig.
- Els textos en basc i en gallec necessiten la revisió d'un parlant nadiu, que ja estava pendent de la Fase D.

**E3 · `MARKETING_VERSION = 1.0.0`** a les dues configuracions de `ios/App/App.xcodeproj/project.pbxproj`.
- Android i `package.json` ja diuen 1.0.0. `puja-ios.mjs:73` sobreescriu la versió, però un arxiu fet des d'Xcode eixia com a 1.0.

**E4 · Splash d'Android 12+ en verd.** A `res/values/styles.xml`, `AppTheme.NoActionBarLaunch` rep dos atributs:
- `windowSplashScreenBackground=@color/ic_launcher_background` (#0F672F);
- `windowSplashScreenAnimatedIcon=@mipmap/ic_launcher_foreground`.

Sense ells, l'splash del sistema mostrava la icona genèrica sobre blanc (`?android:colorBackground` i `sym_def_app_icon` de core-splashscreen 1.2.0), mentre iOS ja és verd sencer.
- Per davall de l'API 31, visualment no canvia res: Capacitor no crida mai `installSplashScreen`. La capa de fons de la finestra sí que canvia: abans era el robot genèric i ara és el verd amb la brúixola. Queda tapada per `@drawable/splash`, que és opac.
- El glif fa un radi de 27 dp sobre 108 dp, dins de la zona segura: no es retalla. Com que és un bitmap de 108 dp escalat, es pot veure lleugerament tou. Un vector seria més nítid; no és cap regressió.

### B. Lectura creuada de l'informe de Gemini (261023_1418)

- **T1.** L'entorn és correcte:
  - `.env.botigues.local` calca la plantilla línia a línia (36 línies, 12 noms, permisos 600, ignorat per `.gitignore:16`);
  - els valors de `.env.natiu.local` coincidixen per hash amb `.env.production.local`, inclòs el tenant 1111…;
  - `VITE_SOLLUTIA_ISSUER` buida neutralitza la de `.env.local`.

  Nota: la plantilla diu que el fitxer l'ompli el Mestre i mai un agent. Gemini només hi ha posat `SDP_APP_ID` i `SDP_BUILDS_DIR`, que no són secrets.
- **«`signingConfigs.release` condicional».** El bloc és condicional, però la seua aplicació no ho era. D'ací ve el NPE d'E1.
- **T3.** Els actius de Gemini són vàlids:
  - RGB sense alfa, 1024 i 2732;
  - `LaunchScreen.storyboard` verd;
  - un build d'Xcode Release els empaqueta a `Assets.car`.

  Les proporcions són diferents de les d'Android:

  | | Gemini | Android |
  | --- | --- | --- |
  | Icona (fracció del costat) | 0,78 | 0,72 |
  | Splash (fracció del costat) | 0,154 | 0,214 |

  Hi ha candidats amb la proporció d'Android, verificats, a l'scratchpad, per si el Mestre vol paritat exacta.
- **Prova nova de `projecteIos.test.js:214`.** Llig el primer píxel només si el filtre PNG de la fila 0 és 0. Un PNG correcte desat per CoreGraphics (Xcode, Previsualització, sips) usa el filtre 1 i la faria fallar sense motiu. Proposta, per a qui porta eixe tros: `filtre <= 4`. Per al píxel 0 de la fila 0, tots els filtres donen el byte cru.
- **T2 (Google a iOS).** Gemini manté `com.googleusercontent.apps.pendent`. És una decisió defensable, però el pla aprovat demana netejar-lo. Llevar tota la clau `CFBundleURLTypes` no té cap efecte en temps d'execució:
  - sense client d'iOS, `proveidorsDe('ios')` només ofereix Apple;
  - capgo no inicialitza GoogleSignIn;
  - la guarda de `vite.natiu.config.js` continua exigint l'esquema si algun dia es posa el client.

  Pegat P1 (§C).
- **«Porta Olivera en codi 0».** Confirmat: `--informe` ix amb 0. Hi ha l'avís CONV-07: l'índex fa 1.000 línies sobre un llindar de 300 i té 12 seccions buides. És deute de l'índex, no d'este torn.

### C. Pegats preparats, no aplicats

Els dos són a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/`, al costat dels de la Fase C. `git apply --check` passa contra l'arbre viu.

**P1 · `PEGAT_261023_P1_TREU_ESQUEMA_GOOGLE_RESERVA.patch`** (sha256 3b55dbc0…51ad2). `requires_human_decision: true`, perquè contradiu la decisió de Gemini.
- Canvis:
  - `Info.plist`: fora tota la clau `CFBundleURLTypes`;
  - `projecteIos.test.js`: accepta zero esquemes o un de client real; si `.env.natiu.local` porta el client d'iOS, l'esquema continua sent obligatori;
  - `vite.natiu.config.js`: només el comentari.
- Verificació en còpia:
  - les mutacions «torna `pendent`» i «dos esquemes» fan fallar la prova;
  - `natiu-build` dona el mateix resultat abans i després;
  - ESLint, net.
- Aplicació: s'aplica amb `git apply` a l'arbre de treball. Amb `--index` no s'aplica mentre E2 no estiga indexat.

**P2 · `PEGAT_261023_P2_DEVELOPMENT_TEAM_ARXIU_IOS.patch`** (sha256 cbfb8419…6c91a).
- Canvi: `puja-ios.mjs` passa `DEVELOPMENT_TEAM=<SDP_APPLE_TEAM_ID>` a l'`xcodebuild archive`, amb una asserció a `tests/botigues.test.mjs`. `mostraOrdre` emmascara el valor.
- Motiu: sense el pegat, un arxiu d'una còpia d'`ios/` falla amb `Signing for "App" requires a development team`. Cap fitxer del repositori porta el Team ID.
- Verificació:
  - en còpia, mateix resultat amb el pegat que sense;
  - la mutació sense `DEVELOPMENT_TEAM` fa fallar la prova nova.
- Límit: no s'ha fet cap arxiu sencer amb Xcode.
- Via: toca `scripts/`, que és camí de governança. Va per Reflex i l'executor, o per decisió del Mestre.

**P3 · Proposta per a `.gitignore`, sense fitxer.** Afegir `*.aab`, `*.ipa`, `*.xcarchive/`, `*service-account*.json`, `*service_account*.json` i `*compte-servei*.json`.
- Avui no se n'escapa cap: `entorn.mjs:469-471` ja prohibix claus dins del repositori. És defensa en profunditat.
- No l'he aplicada: el classificador de l'entorn m'ha denegat la lectura del fitxer.

**Propostes menors, sense pegat:**
- `res/xml/file_paths.xml:3`: canviar `external-path path="."` per `external-files-path path="Pictures/"`. Ara obri tot l'emmagatzematge extern, i Capacitor només escriu a `getExternalFilesDir(Pictures)`.
- `NSPhotoLibraryUsageDescription` encara diu només «fotografies», tot i que el selector també deixa triar vídeos. Impacte baix: el selector de WKWebView en iOS 14+ no sol demanar este permís.

### D. El que encara para la publicació (del Mestre)

1. **Preflight.** Ara ix amb codi 5.
   - Omplir les sis variables buides de `.env.botigues.local`: `SDP_APPLE_TEAM_ID`, `SDP_ASC_KEY_ID`, `SDP_ASC_ISSUER_ID`, `SDP_ASC_KEY_PATH`, `SDP_PLAY_JSON_KEY_PATH` i `SDP_ANDROID_UPLOAD_CERT_SHA256`. Amb `--compila` en calen quatre més.
   - Pujar des d'un commit amb l'arbre net. `.immunitari/cron.out` està ignorat però continua seguit, i el cron el reescriu: cal `git rm --cached -- .immunitari/cron.out .immunitari/cron.err`.
2. **Commit.** E1-E4 ja estan indexats junts (15:15). Abans de cometre cal mirar que ningú haja tornat a indexar `build.gradle` sense la guarda. Després caldrà refer `build:natiu` i `cap sync` des d'eixe commit: els paquets natius actuals són de les 14:16 i 14:33 i es van fer sobre l'arbre brut.
3. **Comptes.**
   - Estatus de comerciant de la DSA a App Store Connect: l'app no es distribuïx a la UE sense ell, i la verificació pot tardar setmanes.
   - Tipus de compte de Play: un compte personal creat després del 13/11/2023 necessita un test tancat de 12 persones durant 14 dies abans de producció.
4. **Fitxes i recursos.**
   - Fitxes de les dues botigues, amb URL de suport i de privacitat, descripció, categoria i qüestionari d'edat.
   - Captures, gràfic de 1024×500 i icona de Play de 512 amb alfa: no n'hi ha cap enlloc.
   - Decidir si hi ha iPad. `TARGETED_DEVICE_FAMILY = "1,2"` obliga a fer captures d'iPad i a provar-lo. Posar 1 fa l'app només per a iPhone.
   - Aprovar la brúixola com a identitat de botiga.
5. **Guideline 2.1.**
   - El xat ensenya opcions «En construcció» amb controls inerts: Telefonades, Destacats, cinc pàgines d'ajustos i opcions pendents a `/control-xat`. Decidir si s'acaben o si s'amaguen només a l'app nativa amb `esAppNativa()`.
   - Compte de demostració per a la revisió, al tenant de producció, amb notes de revisió. L'app arranca sempre en valencià, sense mirar l'idioma del dispositiu.
6. **Sign in with Apple.**
   - Revocar els tokens d'Apple quan s'esborra el compte (5.1.1(v)). Cal una clau `.p8` i un pas de servidor.
   - Registrar el domini de correu per al reenviament privat d'Apple.
7. **Google.** Crear els clients d'iOS, web i Android (l'Android amb el SHA-1 de la clau de pujada i amb el de la clau de signatura de Play), o desactivar `google` a `capacitor.config.json` fins que n'hi haja.
8. **Formularis de privacitat.**
   - Quadrar App Privacy i Data safety: set tipus de dades, més els que declara l'SDK de GoogleSignIn.
   - L'enllaç d'esborrat per a Data safety és `https://socdepoble.org/legal#esborra-compte`.
   - La política diu que el text per a la IAIA va a Google, Anthropic o OpenAI, i cap formulari ho recull.
9. **Tenant.** Tancar la decisió D1 (1111… o edd2f840…) abans de la primera pujada: el tenant queda segellat dins del binari.
10. **Correus d'alta i de recuperació.** Confirmar que la llista d'URI de GoTrue no admet `https://localhost` ni `capacitor://localhost`, perquè els enllaços tornen a la web.
11. **Moderació.** Avís de denúncies noves i compromís de resposta en 24 hores, tal com prometen les normes.
12. **Botó d'arrere d'Android.** Ara ix de l'app des de qualsevol pantalla. Hi ha una proposta sense dependències noves a `MainActivity` (T2-01), pendent de provar en un dispositiu.
13. **Proves en dispositiu.** TestFlight intern i pista interna de Play abans d'enviar res. L'AVD continua trencat: cal reinstal·lar `arm64-v8a-36.1_r04` o fer servir un telèfon.

### E. Retroalimentació sobre la plantilla `prompt_local`

- **Repartiment.** El prompt convoca Claude, Gemini i Codex a les mateixes quatre tasques sense repartir-les. Gemini les va executar mentre jo arribava, i el meu torn ha hagut de ser de segona passada. Proposta: una línia «T_n → actor» o «primer executa, després audita».
- **«Codi 0».** La verificació 1 del pla, el preflight amb codi 0, no la pot assolir cap agent: depén de secrets del Mestre i d'un commit net. Proposta: separar el «verd d'agent» (proves, build, còpies idèntiques) del «verd de pujada» (preflight 0).
- **Preflight del prompt.** Diu «Arbre Git net», però l'arbre és compartit i sempre està brut. Hauria de dir què vol dir net en este context.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Arbre viu, després dels canvis:

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run src/natiu` | 55 passades, 1 omesa a propòsit (sense projecte iOS); repetit després del retoc anglés |
| `node --test tests/natiu-build.test.mjs tests/botigues.test.mjs` | 41/41 |
| `plutil -lint` (`Info.plist` i els cinc `InfoPlist.strings`) | OK |
| `node tooling/gates/porta-olivera.mjs --informe` | eixida 0, amb l'avís CONV-07 previ |
| `node scripts/botigues/preflight.mjs --plataforma totes` | eixida 5 (detall avall) |
| `git apply --check` de P1 i P2 | OK |

Detall del preflight:
- **En verd:** fitxer d'entorn, eines i JDK 21, i còpies natives idèntiques.
- **En roig:** sis variables buides (codi 5, que es mostra abans del 7 per ordre de famílies) i l'arbre amb canvis sense cometre. Cap de les dues coses ve d'E1-E4.

Còpia d'`android/` (JBR 21, `node_modules` copiats de debò):
- Sense clau, `:app:assembleDebug :app:bundleRelease` acaba en BUILD SUCCESSFUL i dona un AAB sense signar: `keytool` diu «no signat» i `jarsigner` diu «jar is unsigned».
- Amb el `build.gradle` d'abans, NPE i BUILD FAILED.
- Amb una clau d'un sol ús:
  - per entorn: AAB signat, empremta SHA-256 igual a la de la clau;
  - injectada a la manera d'Android Studio: també signat;
  - la clau s'ha esborrat després.
- `aapt2 dump resources`: `AppTheme.NoActionBarLaunch` → `windowSplashScreenBackground=@color/ic_launcher_background (#ff0f672f)` i `windowSplashScreenAnimatedIcon=@mipmap/ic_launcher_foreground`. `Theme.SplashScreen` en v31 mapeja `android:windowSplashScreen*` a eixos atributs.
- APK: `versionName 1.0.0`, `targetSdk 36`.

Còpia d'`ios/`, Xcode 27.1:
- `xcodebuild … -configuration Release -sdk iphonesimulator … CODE_SIGNING_ALLOWED=NO build` acaba en BUILD SUCCEEDED. L'objectiu App no té cap avís; els 49 avisos són de capgo.
- L'`Info.plist` construït dona `CFBundleShortVersionString 1.0.0` i els textos nous.
- Els cinc `InfoPlist.strings` construïts són iguals als de la font.
- `Assets.car` conté AppIcon (1024) i Splash (3 renditions).

Revisió adversarial (un agent que intentava refutar E1-E4):
- E1-E4 són correctes, i la traducció i el registre valencià són coherents amb els textos existents.
- Ha trobat dos problemes de coordinació, ja recollits a §A: l'índex amb el `build.gradle` d'abans i l'acoblament dels fitxers d'E2.
- Ha trobat tres detalls menors: la frase anglesa, ja corregida, el text de la galeria i la nitidesa de l'icona de l'splash.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Índex, sense commit.** Per ordre del Mestre, he indexat els deu fitxers d'E1-E4 amb `git add` i camins explícits, sense fer commit. L'índex té ara 48 fitxers: els 40 que va indexar una altra mà, entre ells els de Gemini i el plugin de WordPress, i els huit nous d'E1-E4. Els altres dos ja hi eren. Ni l'informe ni els pegats P1 i P2 estan indexats.
- **Sense dispositiu.** No hi ha cap prova en dispositiu: l'AVD d'Android no arranca (`No initial system image`) i no hi havia cap simulador d'iOS arrencat. L'splash d'Android 12+ i el de les API 24-30 estan verificats en recursos, no a la vista.
- **`.agents/`.** No he escrit `.agents/ESTAT.md` ni el LEDGER: són camins de governança i van per Reflex o per MarIA.
- **Tancament.** El pla 261023_1345 ja està vinculat al torn (`document.mjs plan`, hash e006c762…). `tancament.mjs --check` (lectura) ix `valid: false`:
  - falta el relleu d'ESTAT i del LEDGER d'este torn;
  - la signatura del LEDGER està trencada (esperat cc4057c8…, trobat c1042d8d…);
  - hi ha enllaços morts a `00_index_escriptori.md` i a `03_llibre_d_or_memoria_episodica`.

  Les dues últimes coses ja hi eren abans del torn. No s'ha segellat res.
- **Builds de Gemini.** No he refet `build:natiu` ni `cap sync` a l'arbre viu: Gemini ja ho havia fet, i fer-ho en paral·lel amb ella era una carrera. Tampoc he tocat el que Gemini ha produït fora del repositori (`../_builds_de_poble/android/socdepoble-beta.apk`).
- **Fora d'abast.** Docs que encara esmenten l'esquema `apps.pendent` (ESTAT, pla, prompt, informe de Gemini, Llibre Mestre); només cal tocar-los si s'aplica P1.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261023_1345_pla_implementacio_botigues_mobil]]
- [[261023_1345_prompt_claude_gemini_botigues_mobil]]
- [[261023_1418_auditoria_gemini]]
