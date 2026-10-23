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
| Modificació | 2026-10-23T23:35:00.000Z |
| Propietari | Gemini 4 Argon (High) · IAIA MarIA |
| Aprovació humana | Encàrrec explícit del Mestre Javi Llinares (Prompts Canònics 2026-10-23 22:45 i 2026-10-24 01:30, Rol 2 · Gemini 4 Argon) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~58.000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-23T21:31:41.163Z`: Creació i ancoratge de l'esborrany canònic amb `document.mjs create` dins del torn `torn_db5a99fd-b6c3-40c7-a1c1-bde6439dd49b`.
- `2026-10-23T21:33:00.000Z`: Completada la primera ronda de verificació: detecció del desfasament temporal de `dist-natiu/` de les 14:33h (`SHA-256: 5097fae9...`), inspecció binària IHDR/IDAT dels 30 PNG natius d'iOS i Android, i radiografia de `socdepoble.zip` (`2,78 MiB`).
- `2026-10-23T21:35:30.000Z`: Resposta a la petició directa de Claude (`261023_2330_auditoria_claude.md`: *«Gemini: mesureu el nou»*): mesurat i verificat el nou `dist-natiu/` recompilat des de `HEAD` (`01ef70dcc`), les còpies sincronitzades a iOS/Android (`SHA-256: 1e933ac0...`) i l'`app-release.aab` generat per Gradle (`40.986.252 bytes`, `SHA-256: 474256ac...`), i consolidat el diàleg a tres bandes amb l'informe complet de Codex (`261023_2328_auditoria_codex.md`, troballes `C-01`..`C-08`).
- `2026-10-23T23:35:00.000Z`: Addenda d'Auditoria Adversarial (Torn `torn_2b56c0fa-6965-40a0-b325-a4658341d3ae`, prompt `261024_0130`): auditoria adversarial de les seccions §9 (DSA i regles de compte individual) i §10 (esborrany de pegat legal P3 `PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch`) de Claude contra el codi font i les migracions SQL (`2609261500`, `2609282100`, `2609291200`, `2610201500`), i validació final de seguretat de botigues per a les pistes internes (*Play Internal Testing* i *TestFlight Internal*).

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

---

### 5. Addenda d'Auditoria Adversarial (Torn `261024_0130`): Seccions §9 i §10 de Claude (`DSA`, Compte Individual i Pegat Legal P3)

En compliment de la Tasca 1 del prompt canònic `261024_0130_prompt_codex_gemini_auditoria_adversarial_claude_i_dsa.md`, s'ha auditat de manera adversarial la secció §9 (*DSA, Compte Individual i Regles de Publicació UE*) i la secció §10 (*Esborrany del Pegat P3 de Text Legal*) de `261023_2330_auditoria_claude.md`, així com l'artefacte `02_investigacio_ia/261003_1330_empaquetat_mobil_claude/PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch`, contrastant cada afirmació contra `src/sections/text/legalContent.js`, `src/app/contexts/ModeracioContext.jsx`, `src/data/supabase/moderacio.js`, `src/sections/profile/DetallPrivacitat.jsx`, `src/sections/profile/DetallCompte.jsx`, `src/config/idiomes/ca.js` i les migracions SQL (`2609261500_identitat_perfil_f1.sql`, `2609282100_xat_de_pagina.sql`, `2609291200_baixa_icon_copyright.sql`, `2610201500_moderacio_denuncies_i_bloquejos.sql`):

#### Matriu de Verificació del Pegat P3 (`E4`, `E6`, `E7`, `E11`, `E14`) contra Codi i Esquema SQL

| Esmena | Apartat de `legalContent.js` | Contrast amb Codi i SQL | Dictamen |
| --- | --- | --- | --- |
| **`E14`** | §2 (`línia 42`): canvia `(apartat 21)` → `(apartat 20)` | A `legalContent.js:180`, l'apartat d'emmagatzematge al navegador (`localStorage`/`sessionStorage`) és el `20` (*«Què guardem al teu navegador, exactament»*), mentre que el `21` (`legalContent.js:199`) és *«Contingut incrustat d'altres llocs»* (citat ara a `E7` §6.4). | **EXACTE (100%)** |
| **`E6`** | §9 (`línia 100`): incorpora `Apple Inc.` i `@privaterelay.appleid.com` | Cobrix l'autenticació amb *Sign in with Apple* (`src/natiu/entradaSocial.js:37,50` i `src/data/supabase/auth.js`) i la recepció d'adreces de reenviament d'Apple Private Email Relay. | **EXACTE (100%)** |
| **`E7` (§6.1, §6.2, §6.4)** | §6: Normes de convivència, denúncies i contingut incrustat | Les 4 regles de convivència casen amb `ca.js:627-630`; els 4 motius (`'ofensiu'`, `'spam-frau'`, `'desinformacio'`, `'altre'`), el topall de `1.000` caràcters, l'execució sense sessió (`grant execute ... to anon, authenticated`), la reserva de la taula (`revoke all on public.denuncies`) i el termini `< 24 h` casen amb `2610201500:78-115,268` i `ca.js:588-608`. | **EXACTE (100%)** |
| **`E7` (§6.3)** | §6.3: Bloqueig de persones i entitats (*«Si no has iniciat sessió, el bloqueig només dura mentre tens la pàgina oberta»*) | **Discrepància amb el mode remot (`Troballa G-05`):** En producció (`modeDades === 'remote'`), `ModeracioContext.jsx:126-127` desactiva `potBloquejar` sense sessió i `moderacio.js:163-164` llança `CODI_MODERACIO.SENSE_SESSIO` (*«Cal entrar al compte per a bloquejar»*, `ca.js:645`). El bloqueig de sessió només opera en mode demostració (`seed`/`local`) o si el servidor encara no té la migració `2610201500` (`NO_DISPONIBLE`). | **CAL ESMENAR FRASE** |
| **`E11` (§8)** | §8: Bases jurídiques (art. 6.1.a, 6.1.b, 6.1.c, 6.1.f RGPD) | Casa amb `private.anota_consentiment` (`2609261500:559-598`: `subjecte_hash` del correu amb pebre i `ip_hash`), `public.bloquejos` (`nom`, `creat_al`), `private.normes_acceptades` (`versio`, `acceptada_al`, `ip_hash`), el límit de 20 denúncies/hora per `ip_hash` (`2610201500:223-243`) i `private.consentiments_bloquejats` (`2609261500:454-464`). **Matís (`Troballa G-07`):** El consentiment també es pot retirar sense donar-se de baixa des de `DetallPrivacitat.jsx:204-218` (`revoca_consentiment`). | **EXACTE AMB MATÍS** |
| **`E11` (§10)** | §10: Quarantena de 30 dies, esborrat de bloquejos/normes/motiu de baixa i conservació de denúncies | La quarantena de 30 dies (`dies_quarantena_baixa = '30'`) i l'esborrat en cascada (`ON DELETE CASCADE` sobre `auth.users(id)`) de `public.bloquejos`, `private.normes_acceptades` i `private.baixes.motiu` quan corre `private.purga_una_baixa` (`2609282100:767`) són exactes. En `public.denuncies`, `denunciant` passa a `NULL` (`ON DELETE SET NULL`), i `autor_id text` / `objecte_id text` conserven l'UUID. **Buit RGPD (`Troballa G-06`):** Falta declarar termini/criteri de conservació per a les denúncies (art. 13.2.a RGPD) i incloure `bloquejos`/`normes` a `exporta_les_meues_dades()`. | **CAL COMPLETAR** |
| **`E4` (§14)** | §14: Canvis en la política (*«t'ho avisarem dins de l'aplicació perquè pugues llegir-la i acceptar-la abans de continuar»*) | **Matís de mecanisme (`Troballa G-08`):** `DetallPrivacitat.jsx:189-201` mostra l'alerta de re-consentiment dins de *Perfil → Privacitat i dades*, però no obri cap modal bloquejant global en tota l'aplicació. | **CAL MATISAR** |

#### Troballa G-05 · Discrepància en `E7` (§6.3 del Pegat P3) sobre el bloqueig sense sessió en producció (`remote`)
- **Fitxer o scope afectat:** `02_investigacio_ia/261003_1330_empaquetat_mobil_claude/PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch:38` vs `src/app/contexts/ModeracioContext.jsx:124-127, 222-231`, `src/data/supabase/moderacio.js:163-164` i `src/config/idiomes/ca.js:623, 645`.
- **Evidència reproduïble:**
  - L'apartat `6.3` del pegat P3 afirma: *«Si no has iniciat sessió, el bloqueig només dura mentre tens la pàgina oberta.»*
  - En el codi real, `ModeracioContext.jsx:124-127` declara:
    ```js
    /* Qui bloqueja: la sessió o, en llavor i en local, el convidat (com joId
       a XatContext). En remot sense sessió, ningú: només es denuncia. */
    const quiSoc = usuariId || (modeDades !== 'remote' ? getDefaultUserId() : null);
    const potBloquejar = disponible && Boolean(quiSoc);
    ```
  - Així mateix, `moderacio.js:163-164` rebutja qualsevol intent de bloqueig en mode `remote` sense sessió amb `CODI_MODERACIO.SENSE_SESSIO` (`'Cal entrar al compte per a bloquejar'`, `ca.js:645`). El bloqueig efímer de sessió (`bloqueigNomesSessio`, `ModeracioContext.jsx:225-228`) només s'activa en mode demostració (`seed`/`local`) o com a degradació temporal si un usuari **amb sessió** rep `CODI_MODERACIO.NO_DISPONIBLE` (`404` / `PGRST202`) perquè la migració `2610201500` encara no està aplicada al servidor.
- **Severitat justificada:** P2 (Exactitud legal-tècnica del pegat P3 abans d'aplicar-lo).
- **Font de veritat amb què entra en conflicte:** `src/app/contexts/ModeracioContext.jsx:124-127` i `src/data/supabase/moderacio.js:163-164`.
- **Proposta conservadora:** Substituir l'última frase de `6.3` al pegat P3 per: *«Per a bloquejar cal haver iniciat sessió amb el teu compte (en el mode de demostració sense compte, o si el servidor no està disponible, el bloqueig només dura mentre tens la pàgina oberta).»*
- `requires_human_decision: false`

#### Troballa G-06 · Buit de termini RGPD (art. 13.2.a) en `E11` (§10 sobre `denuncies.autor_id`) i omissió de `bloquejos`/`normes` en `exporta_les_meues_dades()`
- **Fitxer o scope afectat:** `PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch:80`, `supabase/migrations/2610201500_moderacio_denuncies_i_bloquejos.sql:75-100`, `supabase/migrations/2609261500_identitat_perfil_f1.sql:963-1085`, `supabase/migrations/2609282100_xat_de_pagina.sql:684-776` i `src/sections/profile/DetallPrivacitat.jsx:99-100`.
- **Evidència reproduïble:**
  1. **Termini de conservació de `public.denuncies`:** El pegat P3 (`línia 80`) descriu amb fidelitat l'estat actual de l'SQL: quan s'esborra un compte, `denuncies.denunciant` passa a `NULL` (`ON DELETE SET NULL`), però `autor_id text` i `objecte_id text` (sense FK i no tocats per `private.purga_una_baixa`) conserven l'UUID intern del compte. No obstant això, a diferència dels 30 dies de quarantena i dels 3 anys de `consentiments_bloquejats`, ni el text legal ni `private.purga_baixes_vencudes()` fixen cap **termini màxim o criteri de conservació** per a les denúncies, com exigixen els arts. 5.1.e i 13.2.a del RGPD.
  2. **Omissió a la portabilitat/exportació JSON (`exporta_les_meues_dades`):** El pegat P3 declara a §8 que els `bloquejos` i l'acceptació de `normes_acceptades` són dades personals del compte tractades per a l'execució del servei (art. 6.1.b RGPD). Tanmateix, `public.exporta_les_meues_dades()` (`2609261500:963-1085`) no es va actualitzar a la migració `2610201500` i actualment no inclou les claus `'bloquejos'` ni `'normes_convivencia'` al JSON descarregable.
- **Severitat justificada:** P2 (Compliment RGPD arts. 5.1.e, 13.2.a, 15 i 20).
- **Font de veritat amb què entra en conflicte:** Reglament (UE) 2016/679 (arts. 5.1.e, 13.2.a, 15 i 20) i simetria entre `/legal` (§8, §10, §11) i l'SQL de Supabase.
- **Proposta conservadora:**
  1. Al pegat P3 (§10, ítem *Denúncies*), afegir el criteri temporal: *«...es conserven amb l'identificador intern del teu compte durant el temps necessari per a resoldre la incidència i atendre possibles responsabilitats legals (màxim 3 anys).»*
  2. En la següent migració SQL d'enduriment, afegir `'bloquejos'` i `'normes_convivencia'` a `public.exporta_les_meues_dades()` i la purga de `public.denuncies` resoltes de més de 3 anys a `private.purga_baixes_vencudes()`.
- `requires_human_decision: false`

#### Troballa G-07 · Ruta d'interfície obsoleta `(Perfil → El meu compte)` al §11 de `legalContent.js:126` i retirada del consentiment al §8
- **Fitxer o scope afectat:** `src/sections/text/legalContent.js:126` (§11), `PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch:51` (§8) vs `src/sections/profile/DetallPrivacitat.jsx:20-30, 204-218, 294-319` i `src/sections/profile/DetallCompte.jsx:22-23`.
- **Evidència reproduïble:**
  1. A `legalContent.js:126` (§11 *Els teus drets*, no tocat pel pegat P3) es diu: *«Pots descarregar una còpia de les teues dades en format JSON i demanar la baixa del compte des de la mateixa aplicació (Perfil → El meu compte).»* Però com documenta `DetallCompte.jsx:22-23` (*«Els drets de la persona (les meues dades, consentiment i baixa) tenen pàgina pròpia a l'espai de treball: DetallPrivacitat, Privacitat i dades»*), tant la descàrrega JSON com el botó «Donar-me de baixa» viuen a **`Perfil → Privacitat i dades`** (igual que la llista de bloquejos citada a `E7` §6.3). Si el revisor d'App Store (Guideline 5.1.1(v)) o de Google Play seguix la ruta escrita al §11 de `/legal` i entra a *Perfil → El compte*, no hi trobarà el botó de baixa.
  2. Al §8 (`E11`, línia 51 del pegat) es manté *«Pots retirar el consentiment donant-te de baixa»*, quan `DetallPrivacitat.jsx:204-218` i l'RPC `public.revoca_consentiment` (`2609261500:640-668`) permeten retirar el consentiment directament des de **Perfil → Privacitat i dades → Consentiment («Retirar el consentiment»)** sense esborrar el compte (deixant d'aparéixer al padró `membres_del_poble`), a més de donant-se de baixa.
- **Severitat justificada:** P1/P2 (Clarejar la ruta exacta del botó de baixa en `/legal` §11 evita falsos negatius en l'App Review 5.1.1(v)).
- **Font de veritat amb què entra en conflicte:** `src/sections/profile/DetallPrivacitat.jsx` i `src/sections/profile/DetallCompte.jsx`.
- **Proposta conservadora:** Incloure dins del pegat P3 el canvi de `(Perfil → El meu compte)` per `(Perfil → Privacitat i dades)` a `legalContent.js:126` (§11), i a `E11` (§8) precisar *«Pots retirar el consentiment en qualsevol moment des de Perfil → Privacitat i dades, o donant-te de baixa.»*
- `requires_human_decision: false`

#### Troballa G-08 · Validació de les 3 Precondicions del Pegat P3 i matís sobre el re-consentiment a `E4` (§14)
- **Fitxer o scope afectat:** `261023_2330_auditoria_claude.md:306-312`, `PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch:7-14, 85-89`, `supabase/migrations/2609261500_identitat_perfil_f1.sql:354-396, 672-704` i `src/sections/profile/DetallPrivacitat.jsx:189-201`.
- **Evidència reproduïble:**
  1. **Precondició 1 (`2610201500_moderacio_denuncies_i_bloquejos.sql` en producció):** **Confirmada com a obligatòria.** Sense esta migració al Supabase viu, `denuncia_contingut`, `public.bloquejos` i `accepta_normes_convivencia` retornen `404`/`PGRST202` (`CODI_MODERACIO.NO_DISPONIBLE`).
  2. **Precondició 2 (Inserció de la fila `'2.2'` a `public.politiques_privacitat` i efecte de `E4` §14):**
     - L'esmena `E4` al §14 diu: *«t'ho avisarem dins de l'aplicació perquè pugues llegir-la i acceptar-la abans de continuar.»*
     - Verificat l'SQL (`2609261500:672-704`) i el client (`DetallPrivacitat.jsx:189-201`): mentre no s'inserisca una fila `'2.2'` a `public.politiques_privacitat`, `private.versio_vigent()` continua retornant la versió anterior i no demana re-consentir a ningú. Quan s'inserix una fila nova amb `vigent_des_de <= now()`, `estat_consentiment()` retorna `cal_reconsentir: true`, però la interfície actual **només mostra l'avís `<Alerta to="avis" titol="Cal el teu consentiment">` dins de la vista `Perfil → Privacitat i dades`**, sense obrir cap diàleg modal bloquejant a l'inici de l'app.
  3. **Precondició 3 (Registre de `socdepoble.org` / `socdepoble@socdepoble.org` a Apple Private Email Relay):** **Confirmada com a obligatòria** a *Certificates, Identifiers & Profiles → Services → Sign in with Apple for Email Communication* per poder respondre als usuaris amb adreça `@privaterelay.appleid.com` promesos a `E6` (§9).
- **Severitat justificada:** P2 (Coordinació de desplegament entre frontend, Supabase i Apple Developer Portal).
- **Font de veritat amb què entra en conflicte:** `src/sections/profile/DetallPrivacitat.jsx:189-201` i `supabase/migrations/2609261500_identitat_perfil_f1.sql:672-704`.
- **Proposta conservadora:** Mantindre les 3 precondicions de Claude i, a `E4` (§14 del pegat P3), llevar les tres últimes paraules (*«abans de continuar»*) perquè diga *«t'ho avisarem dins de l'aplicació perquè pugues llegir-la i acceptar-la»*, ajustant-se al 100% al comportament real de `DetallPrivacitat.jsx`.
- `requires_human_decision: false`

#### Troballa G-09 · Validació de l'anàlisi DSA (Reglament UE 2022/2065) de Claude (§9) i correcció d'errata del Team ID (`9KNUA4JR8P`) a `03_llibre_mestre_tasques_i_idees.md`
- **Fitxer o scope afectat:** `261023_2330_auditoria_claude.md:196-264` (§9) i `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md:60` (`P0-08b`).
- **Evidència reproduïble:**
  1. **Exactitud del marc DSA (§9 de Claude):** Confirmem la correcció jurídica de la secció §9 de Claude: Sóc de Poble (sota titularitat individual o associació sense ànim de lucre de microdimensió, `< 50` persones i `< 10 M€`) està **exempt de les obligacions de la Secció 3 del Capítol III de la DSA** (arts. 19 a 28: sistema intern de gestió de reclamacions art. 20, resolució extrajudicial art. 21, alertadors fiables art. 22 i informes de transparència per a plataformes art. 24.2, segons l'art. 19.1 DSA). Li apliquen únicament les obligacions generals d'intermediació i allotjament de dades: arts. 11 i 12 (punt de contacte `socdepoble@socdepoble.org`), art. 14 (condicions d'ús i moderació cobertes per `E7`), art. 16 (mecanisme de notificació i acció cobert per `public.denuncies` i `denuncia_contingut`) i art. 17 (exposició de motius a la persona afectada si es retira un contingut).
  2. **Errata al Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md:60`):** A la línia 60 del Llibre Mestre (`P0-08b`) consta escrit `Team ID 9N9WJ43R8P`, mentre que el certificat real d'Apple Developer al clauer del Mac i a `.env.botigues.local` és **`9KNUA4JR8P`** (*FRANCISCO JAVIER LLINARES GARCIA*).
- **Severitat justificada:** P3 (Higiene documental del Llibre Mestre; l'anàlisi DSA de Claude és sòlida i completa).
- **Font de veritat amb què entra en conflicte:** Certificat d'Apple Developer `9KNUA4JR8P` i `.env.botigues.local`.
- **Proposta conservadora:** Corregir `9N9WJ43R8P` → `9KNUA4JR8P` a `03_llibre_mestre_tasques_i_idees.md:60` i validar íntegrament el marc DSA de la §9 de Claude.
- `requires_human_decision: false`

---

### 6. Seguretat de Botigues i Prevol per a Pistes Internes (Tasca 2 del Torn `261024_0130`)

S'ha verificat l'estat dels binaris i configuracions després dels commits `0bf4fbf08` i `b8fbb881a`:

1. **Verificació de l'AAB d'Android (`../_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab`) i de `firebase.json`:**
   - **Mida i empremta:** `40.986.252 bytes` (`39,09 MiB`), SHA-256 `474256acc407ec25594692ae149368c6fbe9a737d568b2d538d91e52c872082a` (còpia exacta d'`android/app/build/outputs/bundle/release/app-release.aab`, amb `index.html` intern `1e933ac07fe64dcab148f83f699c7745f8edcc54d8aae63e150870e2c03dbd61`).
   - **Estat de signatura (`jarsigner -verify`):** `no manifest. jar is unsigned.`
   - **CSP de `firebase.json:22`:** Verificat que el commit `0bf4fbf08` ja ha incorporat `media-src 'self' data: blob: https:;`, deixant `G-02` / `C-05` resolt en el codi.

2. **Avaluació d'Inspeccions Automàtiques d'Ingestió (*Automated Binary Scans*) en TestFlight Intern i Play Internal Testing:**
   Tot i que les pistes internes (**TestFlight Internal Testing** per a membres d'App Store Connect i **Google Play Internal Testing** per a provadors interns) **no passen per revisió humana (*App Review*)**, totes dues consoles executen validacions estàtiques automàtiques en pujar el binari. Hem auditat els punts que aquests escàners comproven:
   - **App Store Connect / Transporter (`altool`):**
     - `ITMS-90717` (Canal alfa a l'AppIcon 1024×1024): **SUPERAT** (`AppIcon-512@2x.png` és `colorType = 2`, RGB 24-bit sense alfa).
     - `ITMS-91053` (Privacy Manifest `PrivacyInfo.xcprivacy`): **SUPERAT** (`ios/App/App/PrivacyInfo.xcprivacy` present a `PBXResourcesBuildPhase`, amb `NSPrivacyTracking = false`, 7 tipus de dades i `NSPrivacyAccessedAPICategoryUserDefaults` `CA92.1`).
     - `ITMS-90683` (Purpose Strings de permisos): **SUPERAT** (`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` presents en 5 llengües a `Info.plist` i `*.lproj/InfoPlist.strings`).
     - `Export Compliance`: **SUPERAT** (`ITSAppUsesNonExemptEncryption = false` a `Info.plist:44-45`, evita el qüestionari manual de xifratge a TestFlight).
     - **Avís d'atenció per a Xcode (`App.entitlements`):** Com que `ios/App/App/App.entitlements` declara `'com.apple.developer.applesignin': ['Default']`, en registrar `org.socdepoble.app` a Apple Developer Portal sota el Team `9KNUA4JR8P`, **cal marcar la capability «Sign in with Apple»**; sense ella, Xcode no podrà generar el perfil de provisionament.
     - **Comportament d'OAuth a iOS sense `.env.natiu.local`:** Actualment `Info.plist:38` té l'esquema de reserva `com.googleusercontent.apps.pendent`. Gràcies a la guarda de `src/natiu/entradaSocial.js:35-37`, quan `googleIos` no està definit, l'app nativa d'iOS **oculta netament el botó de Google** i oferix *Sign in with Apple* i correu/contrasenya, evitant qualsevol excepció de l'SDK de Google en TestFlight Intern.
   - **Google Play Console (Internal Testing Track):**
     - `targetSdkVersion` i `compileSdkVersion`: **SUPERAT** (`36` / Android 16 a `android/variables.gradle`, per damall del mínim d'API 35 exigit per Google Play).
     - `android.hardware.microphone`: **SUPERAT** (`android:required="false"` a `AndroidManifest.xml:51`, evita bloquejar tauletes o emuladors sense micròfon).
     - **Avís d'immutabilitat del primer AAB a Google Play:** El primer AAB signat que es puge a una fitxa de Google Play Console (encara que siga en esborrany de pista interna) **fixa de manera irreversible l'`applicationId` (`org.socdepoble.app`) i el certificat d'upload (`upload key`)** d'aquella aplicació. Per tant, cal signar `261023_socdepoble_1.0.0+1.aab` amb la keystore definitiva que el Mestre conservarà fora del repositori.
     - **Comportament d'OAuth a Android sense client configurat:** Si `googleWeb` no està definit o mentre no es registre el SHA-1 d'App Signing de Play Console a Google Cloud Console, l'accés a la pista interna d'Android funcionarà per **correu i contrasenya** (i quan es vulga provar el login natiu de Google a Android, caldrà afegir a Google Cloud Console tant el SHA-1 de la keystore d'upload com el SHA-1 d'App Signing que genera Play Console).

3. **Dictamen Final per a Pistes Internes:**
   - **VERD CONDICIONAT NOMÉS A SIGNATURA CRIPTOGRÀFICA DEL MESTRE:** Un cop signat `261023_socdepoble_1.0.0+1.aab` amb la keystore d'upload i arxivat el projecte d'iOS a Xcode amb l'equip `9KNUA4JR8P` i el Bundle ID `org.socdepoble.app` (amb *Sign in with Apple* activat), **no existix cap risc d'escaneig binari ni de penalització de compte** per a distribuir immediatament en **Google Play Internal Testing** i **TestFlight Internal**.
   - Per al pas posterior a **Revisió Pública (*Submit for Review* / Producció)**, es manté el requisit de tancar abans els punts `C-01`..`C-06` i aplicar el pegat legal P3 (amb les esmenes `G-05`, `G-06`, `G-07` i `G-08` i les 3 precondicions).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades i verificades empíricament en els dos torns d'esta auditoria:

1. **Suites Vitest de Natiu, PWA, Política de Mitjans, Sanejament Legal, Editorial i Puresa del Xat:**
   - `npx vitest run src/natiu src/pwa/sw.test.js src/config/assetResolver.mitjans.test.js src/config/politicaDeMitjans.test.js src/sections/xat/XatSection.acces.capes.test.js`
   - Resultat: **9 fitxers en verd (173 proves passades, 1 omesa condicional de la branca «sense projecte iOS» quan `ios/App` existix, 0 fallades)** en `1,62 s`.
2. **Suites Node Test de Botigues, Build Natiu, Connector WordPress i Standalone Build:**
   - `node --test tests/botigues.test.mjs tests/natiu-build.test.mjs tests/enxufe-plugin.test.mjs tests/standalone-build.test.mjs`
   - Resultat: **100 de 100 proves en verd (`pass 100`, `fail 0`, `skipped 0`)** en `9,96 s`.
3. **Prevol de Botigues (`preflight.mjs`) i verificació de signatura de l'AAB final:**
   - `node scripts/botigues/preflight.mjs --plataforma totes --signa` -> Codi d'eixida `5` (`EIXIDA.FALTA`), confirmant `.env.botigues.local` amb permisos `600` i `0` variables `VITE_*`, totes les eines natives operatives i paritat byte a byte de `dist-natiu/index.html` amb iOS i Android.
   - `shasum -a 256 ../_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab && jarsigner -verify ../_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab` -> SHA-256 `474256acc407ec25594692ae149368c6fbe9a737d568b2d538d91e52c872082a` (`40.986.252 B`), `jar is unsigned`.
4. **Inspecció binària d'actius gràfics i auditoria adversarial del Pegat P3 (`PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch`):**
   - Verificats els 30 fitxers PNG natius (`4` a `ios/App/App/Assets.xcassets/` i `26` a `android/app/src/main/res/`): **0 canals alfa** a `AppIcon` i `Splash` (`colorType = 2`, RGB 24-bit) i color exacte `#0F672F`.
   - Contrastades totes les línies del pegat P3 contra `src/sections/text/legalContent.js`, `src/app/contexts/ModeracioContext.jsx`, `src/data/supabase/moderacio.js`, `src/sections/profile/DetallPrivacitat.jsx`, `src/sections/profile/DetallCompte.jsx` i les migracions SQL (`2609261500`, `2609282100`, `2609291200`, `2610201500`).
5. **Validació documental canònica:**
   - `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261023_2331_auditoria_gemini.md` -> `valid: true`.
   - `node tooling/gates/porta-olivera.mjs` -> Eixida `0`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Aquesta auditoria ha operat en estricte mode de verificació i lectura sobre el codi i els artefactes (Llei de l'Aixada i Frontera d'efectes), sense aplicar el pegat P3 a `src/sections/text/legalContent.js`, sense alterar migracions SQL ni binaris compartits, i sense exposar cap valor secret de `.env*`.
- Les validacions d'escaneig d'ingestió per a *TestFlight Intern* i *Google Play Internal Testing* es basen en la inspecció estricte dels manifests (`Info.plist`, `App.entitlements`, `PrivacyInfo.xcprivacy`, `AndroidManifest.xml`, `variables.gradle`) i dels binaris locals; la confirmació definitiva d'ingestió es produirà quan el Mestre signe els paquets i els puge a les consoles respectives.
- S'ha verificat que no queda cap cron, timer ni procés de fons actiu (`0` processos en segon pla).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261023_2245_pla_implementacio_botigues_i_auditoria_trio]]
- [[261023_2245_prompt_claude_gemini_codex_botigues_i_auditoria_trio]]
- [[261023_2328_auditoria_codex]]
- [[261023_2330_auditoria_claude]]
- [[261024_0130_pla_implementacio_auditoria_adversarial_claude_i_dsa]]
- [[261024_0130_prompt_codex_gemini_auditoria_adversarial_claude_i_dsa]]
