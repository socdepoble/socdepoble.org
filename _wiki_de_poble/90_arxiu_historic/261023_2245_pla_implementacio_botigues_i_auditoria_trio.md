---
type: document
status: esborrany
description: Pla de llançament a Google Play i App Store Connect, resolució de prevol i auditoria adversarial del sistema per Claude, Gemini i Codex
tags:
  - implementacio
visibility: private
reflex: sdp:torn_db5a99fd-b6c3-40c7-a1c1-bde6439dd49b:c459d5d0-e261-4111-b0cc-e783a96370c9
---
# Pla d'Implementació — Llançament a Botigues Mòbils i Auditoria Adversarial a Tres Bandes

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_db5a99fd-b6c3-40c7-a1c1-bde6439dd49b:c459d5d0-e261-4111-b0cc-e783a96370c9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T20:40:39.828Z |
| Modificació | 2026-10-23T20:43:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 + Gemini 4 Argon + Codex Sol Ultra + IAIA MarIA |
| Tokens consumits | ~ |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-23T20:40:39.828Z: Convocatòria ordenada pel Mestre per a enllestir el llançament de Sóc de Poble a Google Play i Apple App Store Connect, combinant l'auditoria adversarial de Codex, la potència de verificació de Gemini i l'execució d'empaquetat natiu de Claude.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes Forenses (Research)
- **Estat del Codi Natiu (Capacitor 8):**
  * Consolidat al commit `9027265e1`: versió `1.0.0`, guarda de signatura a `build.gradle`, splash screen `#0F672F` verd sense canal alfa a Android i iOS, i textos de permisos de càmera i micròfon harmonitzats.
  * Eines natives locals verificades per `preflight.mjs`: Git, Xcode, xcrun, codesign, plutil, keytool i JDK 21 de Gradle estan 100% operatives.
  * Còpies natives (`dist-natiu/index.html`, `ios/.../index.html`, `android/.../index.html`) són exactament idèntiques byte a byte.
- **Objectius de la Sessió Nocturna:**
  1. **Configuració de Credencials administratives:** Omplir les claus del Mestre a `.env.botigues.local` (Keystore per a Android i Team ID / clau API per a iOS).
  2. **Auditoria Adversarial per Codex (El Tercer Ull):** Radiografia crítica del sistema post-deploy de Firebase i aprimament de WordPress, cercant racons ocults, risc de rebuig a botigues (App Store Guideline 2.1, 5.1.1) i inconsistències de dades.
  3. **Verificació de Potència per Gemini:** Contrast d'integritat del paquet i rendiment dels actius natius.
  4. **Compilació i Pujada Nativa per Claude:** Generació de l'AAB signat per a Google Play i arxiu d'Xcode per a TestFlight/App Store.

### 2. Tasques Concretes de Desenvolupament

#### T1 · Resolució del Prevol i Secrets Administratius (`.env.botigues.local`)
- Configurar a `.env.botigues.local` (amb permisos `chmod 600`):
  * `SDP_APPLE_TEAM_ID`: Team ID d'Apple Developer (10 caràcters).
  * `SDP_ASC_KEY_ID`, `SDP_ASC_ISSUER_ID`, `SDP_ASC_KEY_PATH`: Claus d'App Store Connect API (o via Xcode directe).
  * `SDP_ANDROID_UPLOAD_CERT_SHA256`: Empremta SHA-256 de la clau de signatura d'Android.
  * Variables de keystore per a `--compila`: `SDP_ANDROID_KEYSTORE_PATH`, `SDP_ANDROID_KEY_ALIAS`, `SDP_ANDROID_KEYSTORE_PASSWORD`, `SDP_ANDROID_KEY_PASSWORD`.

#### T2 · Gran Auditoria Adversarial del Sistema (Codex Sol Ultra)
- Examen complet del repositori actualitzat:
  * Integritat de les polítiques de mitjans externs i seguretat de Supabase (RLS i anon key).
  * Detecció de controls inerts o vistes incompletes que puguen provocar rebuig a l'App Store (Guideline 2.1).
  * Emissió d'informe canònic a `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_auditoria_codex.md`.

#### T3 · Verificació i Mesura de Paquet (Gemini 4 Argon)
- Contrast de paritat d'actius natius (`Assets.xcassets` vs `res/mipmap`).
- Comprovació de la mida final dels binaris (APK/AAB i IPA).
- Emissió d'informe canònic a `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_auditoria_gemini.md`.

#### T4 · Cicle de Compilació Nativa de Release (Claude Opus 5.5)
- Generació del bundle Android Release (`./gradlew bundleRelease` -> `app-release.aab`).
- Verificació de l'arxiu d'iOS (`xcodebuild archive` o llançament via `npx cap open ios`).
- Validació de `node scripts/botigues/preflight.mjs --plataforma totes`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `node scripts/botigues/preflight.mjs --plataforma totes`: Sortida amb codi 0 en omplir les claus.
2. `npx vitest run src/natiu`: 55 de 55 proves en verd.
3. `node --test tests/botigues.test.mjs`: 41 de 41 proves en verd.
4. Generació exitosa de l'AAB d'Android a `android/app/build/outputs/bundle/release/app-release.aab`.
5. Tres informes d'auditoria dipositats a `_wiki_de_poble/04_escriptori/`.
6. Porta Olivera en Codi 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Rebuig per controls inerts a l'App Store:** Si alguna pantalla mostra botons inerts, l'App Store Reviewer ho pot rebutjar sota Guideline 2.1. Mitigació: L'auditoria de Codex identificarà qualsevol control inert per ocultar-lo amb `esAppNativa()` si cal.
- **Filtració de claus de signatura:** Les rutes i claus estan blindades a `.env.botigues.local` amb `chmod 600` i ignorades per Git.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
