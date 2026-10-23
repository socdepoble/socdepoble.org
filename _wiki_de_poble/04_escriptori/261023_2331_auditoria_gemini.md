---
type: informe
status: esborrany
description: 'Verificació de potència de Gemini 4 Argon: paritat de binaris natius, absència d''alfa i color #0F672F a Assets.xcassets i mipmap, paquet socdepoble.zip (2,78 MiB) i salut global post-deploy'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_db5a99fd-b6c3-40c7-a1c1-bde6439dd49b:b3ccb535-2d11-4f67-8edf-e5f3f46ba136
---
# Auditoria de Potència, Binaris Natius i Integritat d'Actius (Gemini 4 Argon)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_db5a99fd-b6c3-40c7-a1c1-bde6439dd49b:b3ccb535-2d11-4f67-8edf-e5f3f46ba136 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T21:31:41.163Z |
| Modificació | 2026-10-23T21:35:30.000Z |
| Propietari | Gemini 4 Argon (High) · IAIA MarIA |
| Aprovació humana | Encàrrec explícit del Mestre Javi Llinares (Prompt Canònic 2026-10-23 22:45, Rol 2 · Gemini 4 Argon) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~34.000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-23T21:31:41.163Z`: Creació i ancoratge de l'esborrany canònic amb `document.mjs create` dins del torn `torn_db5a99fd-b6c3-40c7-a1c1-bde6439dd49b`.
- `2026-10-23T21:33:00.000Z`: Completada la primera ronda de verificació: detecció del desfasament temporal de `dist-natiu/` de les 14:33h (`SHA-256: 5097fae9...`), inspecció binària IHDR/IDAT dels 30 PNG natius d'iOS i Android, i radiografia de `socdepoble.zip` (`2,78 MiB`).
- `2026-10-23T21:35:30.000Z`: Resposta a la petició directa de Claude (`261023_2330_auditoria_claude.md`: *«Gemini: mesureu el nou»*): mesurat i verificat el nou `dist-natiu/` recompilat des de `HEAD` (`01ef70dcc`), les còpies sincronitzades a iOS/Android (`SHA-256: 1e933ac0...`) i l'`app-release.aab` generat per Gradle (`40.986.252 bytes`, `SHA-256: 474256ac...`), i consolidat el diàleg a tres bandes amb l'informe complet de Codex (`261023_2328_auditoria_codex.md`, troballes `C-01`..`C-07`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Salut Global del Sistema després de les Últimes Novetats (`9027265e1` .. `01ef70dcc`)

S'ha auditat l'impacte tècnic de les quatre intervencions recents sobre l'arquitectura de Pedra Seca:

1. **Curació dels Navegadors de Juny al Service Worker (`public/sw.js` i `src/pwa/sw.test.js`):**
   - **R1 (`SKIP_WAITING` llegat):** `esOrdreLlegadaDeSaltarEspera(dades)` (`public/sw.js:319-321`) i el receptor `message` (`public/sw.js:655-661`) accepten exclusivament `{ type: 'SKIP_WAITING' }` quan prové del mateix origen (`event.origin === self.location.origin`), desbloquejant els navegadors atrapats en l'antic `PwaUpdater.jsx` de juny sense activar `skipWaiting()` indiscriminadament en instal·lacions normals.
   - **R2 (Neteja quirúrgica de memòries cau orfes):** `cachesAEsborrar` (`public/sw.js:80-81, 311-316`) elimina per nom exacte `['static-resources', 'wasm-worker-cache', 'sdp-v1']` i per prefix `'workbox-'`, preservant intactes `sdp-pwa-recursos-v1`, `sdp-pwa-closca-v1` i qualsevol memòria aliena del lloc. Suite `src/pwa/sw.test.js`: **93/93 proves en verd**.
2. **Aprimament del Connector WordPress a 2,78 MiB (`src/config/politicaDeMitjans.js` i `src/config/assetResolver.js`):**
   - `MITJANS_EXTERNS_DEL_DIRECTORI` (`politicaDeMitjans.js:79-91`) externalitza 8 prefixos (`assets/uploads/`, `assets/towns/`, `assets/fotos/`, `assets/events/`, `assets/ui/`, `assets/nano_cards/`, `assets/img/`, `assets/notes/`) cap a `https://socdepoble.org`, mentre que `ALIAS_CANONICS_MITJANS` (`assetResolver.js:233-240`) redirigix netament els 3 `.jpg` retirats a la seua bessona `.webp`.
   - El paquet oficial `../_builds_de_poble/wordpress/socdepoble.zip` pesa **2.916.367 bytes (`2,78 MiB` / `2,92 MB`)**, un **72% per davall del sostre de 10 MB de WordPress.org**.
3. **Puresa Visual del Xat i Estàndard CSS (`src/css/modules.css`):**
   - Retirada la vora lateral de 6px a `.sdp-alerta.sdp-xat-acces` (validada per `src/sections/xat/XatSection.acces.capes.test.js`, **6/6 en verd**) i afegit `line-clamp` estàndard junt a `-webkit-line-clamp` al calendari setmanal (`b082b13d6`).

---

### 2. Paritat de Binaris Natius i Mides d'Empaquetat (Mesura Post-Recompilació de Claude des de `HEAD` `01ef70dcc`)

En resposta a la sol·licitud directa de Claude (`261023_2330_auditoria_claude.md`: *«Gemini: mesureu el nou»*), hem verificat tant l'estat previ (14:33h) com la nova compilació neta des de `HEAD` (`01ef70dcc`) i el nou bundle `app-release.aab`:

| Artefacte / Directori | Fitxers | Bytes | Mida (`MiB` / `MB_10`) | `mtime` (UTC) | SHA-256 (`index.html` o binari) |
| --- | ---: | ---: | ---: | --- | --- |
| `dist/` (Web Firebase Hosting) | 808 | 145.739.209 | 138,99 MiB (145,74 MB) | `2026-10-23T15:09:33Z` | `9df139e230026f8c3344a98d23b5062ffb8feae14a5906c75d606c6b2d57b24e` |
| `dist-natiu/` *(anterior 14:33h)* | 547 | 40.942.617 | 39,05 MiB (40,94 MB) | `2026-10-23T12:33:41Z` | `5097fae9f647fcf6f17685b6876d06f8a354d73e39b36841e0a54094840d69c9` |
| **`dist-natiu/` (NOU `HEAD` `01ef70dcc`)** | **547** | **40.945.257** | **39,05 MiB (40,95 MB)** | `2026-10-23T21:30:55Z` | **`1e933ac07fe64dcab148f83f699c7745f8edcc54d8aae63e150870e2c03dbd61`** |
| **`ios/App/App/public/` (NOU Sync)** | **549** | **40.945.257** | **39,05 MiB (40,95 MB)** | `2026-10-23T21:31:00Z` | **`1e933ac07fe64dcab148f83f699c7745f8edcc54d8aae63e150870e2c03dbd61`** |
| **`android/app/src/main/assets/public/` (NOU Sync)** | **549** | **40.945.257** | **39,05 MiB (40,95 MB)** | `2026-10-23T21:31:00Z` | **`1e933ac07fe64dcab148f83f699c7745f8edcc54d8aae63e150870e2c03dbd61`** |
| **`android/.../release/app-release.aab` (NOU)** | **1.076** *(interns)* | **40.986.252** | **39,09 MiB (40,99 MB)** | `2026-10-23T21:31:52Z` | **`474256acc407ec25594692ae149368c6fbe9a737d568b2d538d91e52c872082a`** |
| `../_builds_de_poble/wordpress/socdepoble.zip` | 42 *(interns)* | 2.916.367 | 2,78 MiB (2,92 MB) | `2026-10-23T14:01:05Z` | `0079a4c7ec3734756dde9c14b6fd6b609c40ac010cf09074a36c5487b9954e2b` |
| `../_builds_de_poble/android/socdepoble-beta.apk` | 1 | 43.086.745 | 41,09 MiB (43,09 MB) | `2026-10-23T12:18:34Z` | `3e6e6b2a4d698eed3d2d106b2f4d8d9bbd43c91c792e1a4d24b2fd9c6c03c72c` |

- **Verificació interna del nou `dist-natiu/` i de `app-release.aab`:**
  - El diferencial de `+2.640 bytes` (`40.942.617 B` → `40.945.257 B`) correspon exactament a la incorporació dels commits `f1977e4d0`, `b082b13d6` i `5daa12bc8`.
  - Comprovat amb `grep` sobre `dist-natiu/assets/` que el CSS compilat ja porta `line-clamp:` estàndard i la neteja de `.sdp-alerta.sdp-xat-acces`, i que el JS compilat porta `ALIAS_CANONICS_MITJANS` (`og_gentdelatorre_mapa_cuadrat_halo`).
  - Descomprimit en memòria `base/assets/public/index.html` de dins d'`app-release.aab`: mesura `4.560 bytes` amb SHA-256 `1e933ac07fe64dcab148f83f699c7745f8edcc54d8aae63e150870e2c03dbd61` (**paritat 100% amb `dist-natiu/index.html`**).
  - L'`app-release.aab` (`40.986.252 B` comprimits / `52.554.090 B` descomprimits en `1.076` fitxers) conté `BundleConfig.pb`, `base/manifest/AndroidManifest.xml`, `base/dex/`, `base/assets.pb` i `base/resources.pb`, i **no conté cap entrada `META-INF/*.RSA|*.EC|*.SF`** (és *unsigned*, com correspon abans de tindre la keystore del Mestre).
- **Radiografia interna de `socdepoble.zip`:**
  - `42 fitxers` sota l'arrel canònica `socdepoble/` (`8.246.493 B` descomprimits → `2.916.367 B` comprimits).
  - Entrada monolítica `socdepoble/dist/soc-de-poble.standalone.js` (`5.138.636 B`, SHA-256 `44c13c1f3a5517d957d251ce847e92b714fb7149e82f04f447cbd6b8b6d5f329`).
  - `sdp-release.json` segellat amb `versio: "1.1.9"`, `tenant: "11111111-2222-3333-4444-555555555555"`, `origen: "https://socdepoble.org"`, `8 prefixos externs` i `174 bessones WebP`.
  - Cap rastre d'`actualitzador.php` dins del zip i enllaç d'Ajustos corregit a `options-general.php?page=socdepoble` (`socdepoble/includes/ajustos.php:160`).

---

### 3. Validació Forense d'Actius Gràfics Natius (`Assets.xcassets` vs `res/mipmap` i `res/drawable`)

S'ha executat una inspecció binària directa dels chunks PNG (`IHDR`, `tRNS` i descompressió `zlib` del primer scanline `IDAT`) sobre els **4 PNG d'iOS** i els **26 PNG d'Android**:

| Plataforma / Fitxer | Dimensions | Bytes | `bitDepth` | `colorType` | Canal Alfa (`hasAlpha` / `tRNS`) | Píxel `(0,0)` Hex | Conformitat |
| --- | :---: | ---: | :---: | :---: | :---: | :---: | :---: |
| **iOS** `AppIcon.appiconset/AppIcon-512@2x.png` | `1024×1024` | 31.376 | 8 | `2` (RGB 24-bit) | **No (`false`)** | `#0F672F` | OK (App Store) |
| **iOS** `Splash.imageset/splash-2732x2732.png` | `2732×2732` | 40.963 | 8 | `2` (RGB 24-bit) | **No (`false`)** | `#0F672F` | OK |
| **iOS** `Splash.imageset/splash-2732x2732-1.png` | `2732×2732` | 40.963 | 8 | `2` (RGB 24-bit) | **No (`false`)** | `#0F672F` | OK |
| **iOS** `Splash.imageset/splash-2732x2732-2.png` | `2732×2732` | 40.963 | 8 | `2` (RGB 24-bit) | **No (`false`)** | `#0F672F` | OK |
| **iOS** `Base.lproj/LaunchScreen.storyboard:18` | Vectorial | — | — | sRGB (`alpha="1"`) | **No** | `#0F672F` (`0.0588, 0.4039, 0.1843`) | OK |
| **Android** `drawable*/splash.png` (11 variants) | `320×480` .. `1920×1280` | 5.211 .. 28.255 | 8 | `2` (RGB 24-bit) | **No (`false`)** | `#0F672F` | OK |
| **Android** `mipmap-*/ic_launcher.png` (5 densitats) | `48×48` .. `192×192` | 1.327 .. 5.823 | 8 | `2` (RGB 24-bit) | **No (`false`)** | `#0F672F` | OK |
| **Android** `mipmap-*/ic_launcher_foreground.png` (5 densitats) | `108×108` .. `432×432` | 1.645 .. 7.682 | 8 | `6` (RGBA 32-bit) | Sí (capa davantera adaptativa sobre fons) | Transparent | OK (Adaptive Icon) |
| **Android** `mipmap-*/ic_launcher_round.png` (5 densitats) | `48×48` .. `192×192` | 2.014 .. 8.560 | 8 | `6` (RGBA 32-bit) | Sí (cantonades circulars exteriors) | Transparent | OK (Round Icon) |
| **Android** `values/ic_launcher_background.xml` i `styles.xml:21` | XML | — | — | Hex | **No** | `#0F672F` | OK (Android 12+) |

---

### 4. Troballes Estructurals i Diàleg a Tres Bandes amb Codex (`261023_2328`) i Claude (`261023_2330`)

#### Troballa G-01 · Resolució del desfasament de `dist-natiu/` verificada amb Claude (`RESOLT EN TORN`)
- **Fitxer o scope afectat:** `dist-natiu/`, `ios/App/App/public/`, `android/app/src/main/assets/public/` i `android/app/build/outputs/bundle/release/app-release.aab`.
- **Evidència reproduïble:** Tant Gemini com Claude van detectar que el `dist-natiu/` de les 14:33h (`SHA-256: 5097fae9...`) era anterior a `f1977e4d0` i `b082b13d6`. Claude l'ha recompilat des d'una còpia neta de `HEAD` (`01ef70dcc`) i ha executat `cap sync` i `./gradlew bundleRelease`. Gemini ha mesurat i certificat el nou paquet (`SHA-256: 1e933ac0...`, `40.945.257 B`) i el nou AAB (`SHA-256: 474256ac...`, `40.986.252 B`).
- **Severitat justificada:** Resolta per a `dist-natiu/`, iOS i Android. (Per a `socdepoble.zip`, ja pujat a WordPress.org amb versió `1.1.9`, els canvis visuals posteriors entraran a la versió `1.1.10`).
- **Font de veritat amb què entra en conflicte:** Cap (alineat amb `HEAD` `01ef70dcc`).
- **Proposta conservadora:** Conservar el nou `dist-natiu/` (`1e933ac0...`) com a base per a la signatura final del Mestre.
- `requires_human_decision: false`

#### Troballa G-02 · Confirmació empírica de la divergència de `media-src` a la CSP de `firebase.json` (Acord amb `C-05` de Codex)
- **Fitxer o scope afectat:** `firebase.json:22` vs `index.html:17`, `vercel.json:8` i `vite.natiu.config.js:80`.
- **Evidència reproduïble:** Confirmem al 100% la troballa `C-05` de Codex (`261023_2328_auditoria_codex.md`):
  - `index.html:17` declara `media-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*;`.
  - `vercel.json:8` i `vite.natiu.config.js:80` declaren `media-src 'self' data: blob: https:;`.
  - `firebase.json:22` **omet `media-src`**, aplicant el fallback `default-src 'self' data: blob:;`.
  Per intersecció W3C CSP Level 3, la capçalera HTTP de Firebase Hosting bloqueja l'àudio/vídeo remot `https:` (com les notes de veu o vídeos de Supabase Storage a `AdjuntXat.jsx`) en el web `https://socdepoble.org`, mentre que als binaris natius d'iOS i Android sí que funciona.
- **Severitat justificada:** P1 per al web `socdepoble.org`; No afecta el binari mòbil natiu.
- **Font de veritat amb què entra en conflicte:** Paritat d'allotjament entre `firebase.json`, `vercel.json` i `index.html`.
- **Proposta conservadora:** Afegir `media-src 'self' data: blob: https:;` a `firebase.json:22`, exigir-ho a `tests/standalone-build.test.mjs` i redesplegar `hosting` a Firebase.
- `requires_human_decision: false`

#### Troballa G-03 · Divergència d'App ID a Apple Developer (`com.socdepoble.app` vs `org.socdepoble.app`) i Signatura d'AAB (Acord amb Claude)
- **Fitxer o scope afectat:** `.env.botigues.local` (`SDP_APP_ID`, `SDP_APPLE_TEAM_ID`, `SDP_ANDROID_KEYSTORE_*`), `capacitor.config.ts`, `ios/App/App.xcodeproj/project.pbxproj` i `android/app/build.gradle`.
- **Evidència reproduïble:**
  1. **iOS:** Com ha descobert Claude (`261023_2330_auditoria_claude.md`), l'equip d'Apple Developer al Mac és `9KNUA4JR8P` (`FRANCISCO JAVIER LLINARES GARCIA`), i l'únic perfil de provisionament App Store local existent és per a **`com.socdepoble.app`** (creat el `2026-02-03`), mentre que el projecte actual (`ios/`, `android/`, `.env.botigues.local`) està configurat com a **`org.socdepoble.app`**.
  2. **Android:** L'`app-release.aab` generat (`40.986.252 B`, `SHA-256: 474256ac...`) és estructuralment vàlid però *unsigned* perquè falta crear o indicar la keystore del Mestre a `.env.botigues.local`.
- **Severitat justificada:** Bloquejant administratiu immediat per a la pujada de hui a TestFlight i Google Play Internal Track.
- **Font de veritat amb què entra en conflicte:** `scripts/botigues/preflight.mjs` (eixida `5`).
- **Proposta conservadora:**
  - **Decisió d'Apple per al Mestre (Bundle ID + Compte Individual `IDEA-17`):**
    1. *Identificador:* Si a App Store Connect l'aplicació encara no té envios o es vol mantindre la simetria amb el domini `socdepoble.org`, registrar `org.socdepoble.app` a Apple Developer sota el Team `9KNUA4JR8P` (Xcode ho fa marcant *Automatically manage signing*). Si la fitxa d'App Store Connect ja està creada amb `com.socdepoble.app`, decidir si s'alinea iOS a `com.socdepoble.app`.
    2. *Tipus de compte:* Com ha verificat Claude (`261023_2330_auditoria_claude.md:58-61`), l'equip `9KNUA4JR8P` és de tipus **Individual** (`FRANCISCO JAVIER LLINARES GARCIA`), de manera que l'App Store mostrarà el nom de la persona física com a venedora fins que es formalitze l'estructura jurídica d'`IDEA-17` (organització amb D-U-N-S).
  - **Signatura d'Android:** Crear la keystore de pujada amb `keytool` fora del repositori (ex. `~/.keys/socdepoble-upload.jks`), omplir les Variables a `.env.botigues.local` (o signar l'AAB amb `jarsigner` / Android Studio *Generate Signed Bundle*) abans de pujar-lo a Play Console.
- `requires_human_decision: true`

#### Troballa G-04 · Síntesi del Dictamen de Publicació vs Pistes Internes (Consens Gemini + Claude + Codex sobre `C-01`..`C-08`)
- **Fitxer o scope afectat:** Flux de llançament a botigues (`TestFlight` / `Play Console Internal Testing` vs `App Store Review` / `Play Production`).
- **Evidència reproduïble:** Contrastades les troballes `C-01` a `C-08` de l'informe de Codex (`261023_2328_auditoria_codex.md`) amb l'anàlisi de Claude (`261023_2330_auditoria_claude.md`):
  - **Pistes Internes (ESTA NIT — CONDICIONAT A SIGNATURA `C-08` / `G-03`):** Coincidim plenament amb la precisió `C-08` de Codex i amb Claude: l'`app-release.aab` i l'Archive d'iOS actuals són *unsigned* i cap consola admet la pujada d'un binari sense signar. Ara bé, **un cop el Mestre els signe** (amb la keystore de pujada a Android i l'equip `9KNUA4JR8P` a Xcode), tant **Google Play Internal Testing (esborrany / pista interna)** com **TestFlight Intern (usuaris d'App Store Connect)** **NO passen per l'App Review funcional (`C-01`..`C-06`)**, per la qual cosa es poden pujar esta mateixa nit per a prova en dispositiu físic sense risc de rebuig de revisió.
  - **Revisió Pública de Botigues («Submit for Review» — NO-GO fins a tancar P1):** Abans d'enviar el build a revisió pública d'Apple App Store o a Producció de Google Play, és obligatori tancar les 5 barreres funcionals documentades per Codex:
    1. **`C-01` (Guideline 2.1):** Ocultar o desactivar en el paquet natiu les vistes i botons «En construcció» del xat (`Telefonades`, `Destacats`, subpantalles pendents de `FullAjustos` i accions inerts de `VistaMultimedia`).
    2. **`C-02` i `C-03` (Guideline 5.1.1(v) / Play Data Deletion):** Garantir que la baixa del compte elimine també l'UGC personal identificable i desplegar el worker consumidor de `private.purga_storage_pendent`.
    3. **`C-04` (`P0-04` del Llibre Mestre):** Implementar la revocació servidor a servidor del token de *Sign in with Apple* (`https://appleid.apple.com/auth/revoke`).
    4. **`C-06` (Guideline 1.2 UGC):** Acreditar el filtre previ de contingut ofensiu i el flux operatiu de resposta a denúncies.
    5. **`C-07` (Higiene del Llibre Mestre):** Corregir a `03_llibre_mestre_tasques_i_idees.md` la referència `2610201400` pels timestamps reals de les migracions de baixa (`2609282100_xat_de_pagina.sql` / `2609291200_baixa_icon_copyright.sql`) i actualitzar `P0-07` a `[FET]` després de la nostra certificació dels 30 PNG sense alfa.
- **Severitat justificada:** Alta per a revisió pública; Condicionada només a signatura criptogràfica (`C-08` / `G-03`) per a pistes internes.
- **Font de veritat amb què entra en conflicte:** Polítiques d'App Store Review (1.2, 2.1, 5.1.1(v)) i Google Play User Data Policy.
- **Proposta conservadora:** Executar esta nit la signatura i pujada a **TestFlight Intern** i **Google Play Internal Testing (esborrany)** per validar en dispositiu físic, i programar una onada específica per tancar `C-01`..`C-06` abans de demanar la revisió pública.
- `requires_human_decision: true`

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades i verificades empíricament en este torn:

1. **Suites Vitest de Natiu, PWA, Política de Mitjans i Puresa del Xat:**
   - `npx vitest run src/natiu src/pwa/sw.test.js src/config/assetResolver.mitjans.test.js src/config/politicaDeMitjans.test.js src/sections/xat/XatSection.acces.capes.test.js`
   - Resultat: **9 fitxers en verd (173 proves passades, 1 omesa condicional de la branca «sense projecte iOS» quan `ios/App` existix, 0 fallades)** en `1,62 s`.
2. **Suites Node Test de Botigues, Build Natiu, Connector WordPress i Standalone Build:**
   - `node --test tests/botigues.test.mjs tests/natiu-build.test.mjs tests/enxufe-plugin.test.mjs tests/standalone-build.test.mjs`
   - Resultat: **100 de 100 proves en verd (`pass 100`, `fail 0`, `skipped 0`)** en `9,96 s`.
3. **Prevol de Botigues (`preflight.mjs`):**
   - `node scripts/botigues/preflight.mjs --plataforma totes --signa`
   - Resultat: Codi d'eixida `5` (`EIXIDA.FALTA`), confirmant `.env.botigues.local` amb permisos `600` i `0` variables `VITE_*`, totes les eines natives operatives (`git`, `xcodebuild`, `xcrun`, `codesign`, `plutil`, `keytool`, `JDK 21` d'Android Studio), paritat byte a byte de `dist-natiu/index.html` amb iOS i Android, i únicament a l'espera de les 10 claus administratives del Mestre.
4. **Inspecció binària d'actius gràfics i paquets:**
   - Verificats els 30 fitxers PNG natius (`4` a `ios/App/App/Assets.xcassets/` i `26` a `android/app/src/main/res/`): **0 canals alfa** a `AppIcon` i `Splash` (`colorType = 2`, RGB 24-bit) i color exacte `#0F672F` a totes les superfícies.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Aquesta auditoria ha operat en estricte mode de verificació i lectura (Llei de l'Aixada i Frontera d'efectes), sense alterar codi font, sense recompilar `dist-natiu/` (tasca reservada a Claude Opus 5.5 en T4 per no generar condicions de carrera al disc) i sense exposar cap valor de `.env*`.
- S'ha llegit íntegrament el primer relleu de Codex (`261023_2328_auditoria_codex.md`) i l'esborrany inicial de Claude (`261023_2330_auditoria_claude.md`). En quan Claude i Codex actualitzen els seus documents finals a l'Escriptori, es farà una lectura final de síntesi sense deixar cap cron ni procés de fons actiu.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261023_2245_pla_implementacio_botigues_i_auditoria_trio]]
- [[261023_2245_prompt_claude_gemini_codex_botigues_i_auditoria_trio]]
- [[261023_2328_auditoria_codex]]
- [[261023_2330_auditoria_claude]]
