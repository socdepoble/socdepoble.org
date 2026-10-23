---
type: informe
status: esborrany
description: 'Execució de T1-T4: .env.botigues.local i .env.natiu.local (chmod 600), paritat gràfica iOS/Android (#0F672F sense alfa), signingConfigs.release a build.gradle, build:natiu + cap sync i verificació 41/41 + 55/55 en verd.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_b68ea50d-7d14-4717-a320-9c8c517e0da0:efb7e1a9-b7f7-49a0-80c2-377860d73829
---
# Auditoria i Execució de Posada a Punt — Botigues Mòbils Google Play i Apple App Store (Capacitor 8)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b68ea50d-7d14-4717-a320-9c8c517e0da0:efb7e1a9-b7f7-49a0-80c2-377860d73829 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T12:18:34.666Z |
| Modificació | 2026-10-23T12:20:00.000Z |
| Propietari | IAIA MarIA / Gemini 4 Argon (High) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~38.000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-10-23T12:04:00Z:** Diagnosi forense de l'estat de `scripts/botigues/preflight.mjs`, `ios/`, `android/` i fitxers d'entorn (`.env*`).
- **2026-10-23T12:11:00Z:** Creació i blindatge (`chmod 600`) de `.env.botigues.local` i `.env.natiu.local`, més la carpeta satèl·lit `../_builds_de_poble/ios`.
- **2026-10-23T12:12:00Z:** Sanejament de `android/app/build.gradle` (`versionName "1.0.0"` i `signingConfigs.release`).
- **2026-10-23T12:15:00Z:** Generació nativa (24-bit RGB sense canal alfa, `#0F672F`) de `AppIcon-512@2x.png` (1024×1024) i `splash-2732x2732*.png` (2732×2732) a `ios/App/App/Assets.xcassets/`, ajust de `LaunchScreen.storyboard` i nova prova de contracte a `src/natiu/projecteIos.test.js`.
- **2026-10-23T12:18:00Z:** Execució completa de `npm run build:natiu`, `npx cap sync`, `./gradlew assembleDebug` i `xcodebuild` (iOS Simulator), amb regeneració de `../_builds_de_poble/android/socdepoble-beta.apk` (43,1 MB).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### T1 · Configuració d'Entorn de Botigues i del Build Natiu (`.env.botigues.local` i `.env.natiu.local`)

1. **Absència de `.env.botigues.local` (`scripts/botigues/entorn.mjs:29`):**
   - **Evidència:** `node scripts/botigues/preflight.mjs --plataforma totes` eixia amb codi `3` (`EIXIDA.FITXER`).
   - **Resolució aplicada:** Creat `.env.botigues.local` a partir de la plantilla `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/nous/botigues/botigues.env.exemple.txt`, amb permisos `0600` (`-rw-------`), ignorant-lo per `.gitignore:16` (`.env.*`). S'hi han preconfigurat els dos valors no secrets d'arquitectura:
     - `SDP_APP_ID=org.socdepoble.app`
     - `SDP_BUILDS_DIR=../_builds_de_poble/ios` (creada la carpeta satèl·lit fora del repositori Git, al costat d'`android/` i `wordpress/`).
   - **Resultat al preflight:** `✓ .env.botigues.local: 12 variables, cap VITE_*, cap clau escrita, permisos 600`.

2. **Absència crítica de `.env.natiu.local` (`vite.natiu.config.js:385-399`):**
   - **Evidència:** En l'arbre només existien `.env`, `.env.local` i `.env.production.local`. En executar `npm run build:natiu`, la funció `heretadesDelLloc` de `vite.natiu.config.js` avorta el build si qualsevol variable `VITE_*` amb valor prové de `.env` o `.env.local` sense estar explícitament declarada a `.env.natiu*`.
   - **Resolució aplicada:** Creat `.env.natiu.local` (`chmod 600`, ignorat per Git) amb les quatre variables públiques de `.env.production.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DATA_MODE=remote`, `VITE_TENANT_ID`) i `VITE_SOLLUTIA_ISSUER=` buida per anul·lar l'herència de `.env.local`.

---

### T2 · Sanejament de Metadades i Contractes d'Apple i Android

1. **Protecció de `com.googleusercontent.apps.pendent` a `ios/App/App/Info.plist:38` (Advertència d'Arquitectura):**
   - **Fitxer i contracte afectats:** `ios/App/App/Info.plist:38`, `vite.natiu.config.js:285-303`, `src/natiu/entradaSocial.js:35-37` i `src/natiu/projecteIos.test.js:38, 127-135`.
   - **Evidència reproduïble:** `src/natiu/projecteIos.test.js:130` exigeix estrictament que `Info.plist` registre un sol esquema que complisca `/^com\.googleusercontent\.apps\.(?:pendent|[0-9]+-[a-z0-9]+)$/`. Mentrestant, `proveidorsDe('ios')` a `src/natiu/entradaSocial.js:37` només activa el botó de Google a iOS si `VITE_NATIU_GOOGLE_IOS_CLIENT_ID` està definit; sense ell, iOS ofereix únicament **Sign in with Apple** i correu electrònic, i l'SDK de Google no s'inicialitza mai.
   - **Severitat:** Alta (risc de trencament de suite si s'esborra en buit).
   - **Decisió conservadora (`requires_human_decision: true` per activar Google OAuth a iOS):** Es manté `com.googleusercontent.apps.pendent` mentre no es cree el Client ID d'iOS a Google Cloud Console. Si el Mestre crea el client OAuth d'iOS (`NUM-HASH.apps.googleusercontent.com`), caldrà posar-lo a `VITE_NATIU_GOOGLE_IOS_CLIENT_ID` dins de `.env.natiu.local` i substituir `com.googleusercontent.apps.pendent` per `com.googleusercontent.apps.NUM-HASH` a `ios/App/App/Info.plist:38`. Si es publica sense Google OAuth a iOS (només Sign in with Apple + correu), el comportament en temps d'execució ja és 100% segur.

2. **Dos bloquejants resolts a `android/app/build.gradle` (`scripts/botigues/puja-android.mjs:50, 108-111`):**
   - **Evidència:**
     1. `android/app/build.gradle:11` tenia `versionName "1.0"`, però `scripts/botigues/entorn.mjs:239` exigeix SemVer de tres nombres (`VERSIO = /^\d+\.\d+\.\d+$/`) i `puja-android.mjs:109` compara `deGradle.versio !== versio`, cosa que hauria bloquejat qualsevol execució de `puja-android.mjs` amb `EIXIDA.ARBRE` (codi 7).
     2. `android/app/build.gradle` no incloïa el bloc `signingConfigs.release` especificat a `LLEGIU.txt §4` i `puja-android.mjs:50`.
   - **Resolució aplicada:** Actualitzat `versionName "1.0.0"` i afegit el bloc `signingConfigs.release` condicional que llig `SDP_ANDROID_KEYSTORE_PATH`, `SDP_ANDROID_KEYSTORE_PASSWORD`, `SDP_ANDROID_KEY_ALIAS` i `SDP_ANDROID_KEY_PASSWORD` de l'entorn del procés fill quan s'usa `--compila`.
   - **Blindatge de `AndroidManifest.xml`:** Verificat que `android:allowBackup="false"`, `android:dataExtractionRules="@xml/data_extraction_rules"` i `android:fullBackupContent="false"` continuen actius i intactes.

---

### T3 · Harmonització d'Actius Gràfics Natius (`Assets.xcassets` d'iOS vs Android)

- **Fitxers afectats:**
  - `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
  - `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png` (i `-1.png`, `-2.png`)
  - `ios/App/App/Base.lproj/LaunchScreen.storyboard`
- **Evidència reproduïble:** Mentre que `android/app/src/main/res/` ja tenia la rosa dels vents blanca sobre el verd `#0F672F` (commit `5d9fc2bf0`), `ios/App/App/Assets.xcassets/` conservava encara la icona i els tres splash blaus de plantilla de Capacitor (causa de rebuig immediat a App Store Review per *Guideline 2.3.8 / 4.0*).
- **Resolució aplicada:**
  1. Renderitzats des del vector canònic `public/favicon.svg` sobre `#0F672F` (`rgb(15, 103, 47)`) en format PNG de 24 bits RGB **sense canal alfa** (`color_type = 2`, `hasAlpha: no`):
     - `AppIcon-512@2x.png` (`1024×1024` px, glif centrat de `540×800` px, paritat exacta 2x amb `public/icona-app-512.png`).
     - `splash-2732x2732.png`, `splash-2732x2732-1.png` i `splash-2732x2732-2.png` (`2732×2732` px, glif centrat de `284×420` px sobre `#0F672F`).
  2. Ajustat el `backgroundColor` de `ios/App/App/Base.lproj/LaunchScreen.storyboard` a `#0F672F` (`sRGB`) per eliminar qualsevol flaix blanc en arrencar.
  3. Afegida una prova de contracte a `src/natiu/projecteIos.test.js` que valida les dimensions (`1024×1024` i `2732×2732`), `tipusColor: 2` (sense canal alfa) i el píxel `[15, 103, 47]` (`#0F672F`) a l'arrel de `IDAT`.

---

### T4 · Cicle de Compilació Nativa, Sincronització i Binaris

- **`npm run build:natiu` + `npx cap sync`:** Executats amb èxit. `dist-natiu/index.html` coincideix byte a byte amb `ios/App/App/public/index.html` i `android/app/src/main/assets/public/index.html`.
- **Compilació nativa Android (`./gradlew --no-daemon assembleDebug`):** `BUILD SUCCESSFUL in 7s`. Actualitzat l'artefacte satèl·lit `../_builds_de_poble/android/socdepoble-beta.apk`:
  - **Mida nova:** `43.086.745 bytes` (`43,1 MB`, reduït en **8,35 MB** respecte dels `51,43 MB` anteriors gràcies a la substitució de les 75 bessones WebP noves).
  - **SHA-256:** `3e6e6b2a4d698eed3d2d106b2f4d8d9bbd43c91c792e1a4d24b2fd9c6c03c72c`.
- **Compilació nativa iOS (`xcodebuild ... -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`):** `** BUILD SUCCEEDED **` en Xcode 27.1, validant el catàleg `Assets.xcassets` i `LaunchScreen.storyboard` sense cap avís.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

1. **`npx vitest run src/natiu`:**
   - **5 fitxers passats (5/5), 55 proves en verd (55/55, 0 fallades)** — incloent-hi la nova prova de `Assets.xcassets` a `src/natiu/projecteIos.test.js` (12/12 proves d'iOS en verd).
2. **`node --test tests/natiu-build.test.mjs tests/botigues.test.mjs`:**
   - **41 proves executades, 41 passades, 0 fallades, 0 omeses (41/41 en verd)** — les 3 proves d'eixida real de `dist-natiu/` que abans s'ometien ara passen en verd.
3. **`node scripts/botigues/preflight.mjs --plataforma totes`:**
   - Fitxer d'entorn: `✓ .env.botigues.local: 12 variables, cap VITE_*, cap clau escrita, permisos 600`.
   - Eines: `✓ git`, `✓ xcodebuild`, `✓ xcrun`, `✓ codesign`, `✓ plutil`, `✓ keytool`, `✓ JDK 21 per a Gradle`.
   - Còpies natives: `✓ dist-natiu/index.html`, `✓ ios: la còpia de dist-natiu/ és la mateixa`, `✓ android: la còpia de dist-natiu/ és la mateixa`.
4. **`node tooling/gates/porta-olivera.mjs` i `node tooling/wiki/document.mjs check`:**
   - Validats en Codi 0 amb tots els documents vius ancorats a `00_index_escriptori.md`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Frontera de la «Pregunta Zero» (`RUNBOOK_BOTIGUES_IA.txt §0-§1`):** `preflight.mjs` ix actualment amb codi `5` (`EIXIDA.FALTA`) única i exclusivament per les 6 variables de credencials humanes que cap IA pot generar ni inventar i que el Mestre ha d'omplir a `.env.botigues.local`:
  1. `SDP_APPLE_TEAM_ID` (Team ID de 10 caràcters d'Apple Developer).
  2. `SDP_ASC_KEY_ID` (Key ID de la clau d'App Store Connect API).
  3. `SDP_ASC_ISSUER_ID` (Issuer ID d'App Store Connect API).
  4. `SDP_ASC_KEY_PATH` (Ruta fora del repositori a `~/.appstoreconnect/private_keys/AuthKey_<SDP_ASC_KEY_ID>.p8`, amb `chmod 600`).
  5. `SDP_PLAY_JSON_KEY_PATH` (Ruta fora del repositori a `~/claus-socdepoble/play-compte-servei.json`, amb `chmod 600`).
  6. `SDP_ANDROID_UPLOAD_CERT_SHA256` (Empremta SHA-256 del certificat de la clau de pujada `~/claus-socdepoble/upload-socdepoble.jks`).
- **Arbre Git (`EIXIDA.ARBRE`):** Com estableix `preflight.mjs:108`, la pujada definitiva a les botigues exigeix que l'arbre estiga comès (`git status --porcelain` buit) en el moment d'executar `puja-ios.mjs` o `puja-android.mjs`.
- **Zero processos de fons:** No s'ha activat cap cron ni procés recurrent (`0` tasques de fons).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261023_1345_pla_implementacio_botigues_mobil]]
- [[261023_1345_prompt_claude_gemini_botigues_mobil]]
- [[03_llibre_mestre_tasques_i_idees]]
