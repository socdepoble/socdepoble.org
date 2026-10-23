---
type: document
status: esborrany
description: Pla per a l'empaquetat, secrets d'entorn i prevol de Capacitor 8 per a Google Play i App Store
tags:
  - implementacio
visibility: private
reflex: sdp:torn_b68ea50d-7d14-4717-a320-9c8c517e0da0:94e77a2b-386c-4616-98e6-8446effc4ea8
---
# Pla d'Implementació — Botigues Mòbils Google Play i Apple App Store

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b68ea50d-7d14-4717-a320-9c8c517e0da0:94e77a2b-386c-4616-98e6-8446effc4ea8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T11:43:58.444Z |
| Modificació | 2026-10-23T11:46:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) + Colmena (Claude + Gemini + Codex Sol Ultra) |
| Tokens consumits | ~ |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-23T11:43:58.444Z: Creació del pla d'implementació arran de la decisió d'assolir la publicació de Sóc de Poble a Google Play i Apple App Store.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes Forenses (Research)
- **Diagnosi de Prevol:** L'execució de `node scripts/botigues/preflight.mjs --plataforma totes` confirma que les eines natives de desenvolupament estan plenament operatives al Mac:
  * `✓ git`
  * `✓ xcodebuild`, `✓ xcrun`, `✓ codesign`, `✓ plutil` (Xcode instal·lat i llest)
  * `✓ keytool`
  * `✓ JDK 21 per a Gradle` a `/Applications/Android Studio.app/Contents/jbr/Contents/Home`
- **Bloquejants actuals detectats:**
  1. Falta el fitxer d'entorn segur `.env.botigues.local` (amb chmod 600) que defineix les rutes del Keystore de signatura d'Android i els identificadors d'App Store Connect d'Apple.
  2. A `ios/App/App/Info.plist:46` roman la cadena de prova `com.googleusercontent.apps.pendent` per a OAuth de Google.
  3. L'arbre de Capacitor necessita verificar la paritat d'icones i pantalles de llançament a `ios/App/App/Assets.xcassets/`.

### 2. Tasques Concretes de Desenvolupament

#### T1 · Plantilla i Configuració de Secrets (`.env.botigues.local`)
- Crear l'arxiu `.env.botigues.local` basat en `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/nous/botigues/botigues.env.exemple.txt`.
- Aplicar permisos restrictius (`chmod 600 .env.botigues.local`).
- Blindar que mai no es cometa ni s'exposi a l'arbre Git.

#### T2 · Sanejament de Metadades d'Apple i Android
- `ios/App/App/Info.plist`: Netejar la referència temporal d'OAuth i ajustar els esquemes d'obertura URL i descripcions de permisos.
- `android/app/src/main/AndroidManifest.xml`: Verificar el blindatge de seguretat de tokens i còpies de seguretat (`allowBackup="false"`).

#### T3 · Harmonització d'Actius Gràfics Natius (Icones / Splash)
- Comprovar que els actius gràfics a `ios/App/App/Assets.xcassets/AppIcon.appiconset` i `Splash.imageset` disposen de les mides oficials i respecten la paleta Pedra Seca.

#### T4 · Cicle de Compilació Nativa i Preflight Verd
- Executar `npm run build:natiu` per generar el bundle optimitzat de producció a `dist-natiu/`.
- Executar `npx cap sync` per sincronitzar codi i actius a `ios/` i `android/`.
- Executar `node scripts/botigues/preflight.mjs --plataforma totes` per validar que totes les comprovacions passen a verd (Codi 0).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `node scripts/botigues/preflight.mjs --plataforma totes`: Sortida amb codi 0.
2. `npm run build:natiu`: Compilació sense cap error ni avís crític.
3. `node tooling/gates/porta-olivera.mjs`: Escriptori net i mantingut en codi 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Exposició de claus de signatura:** Les rutes i contrasenyes del Keystore o claus `.p8` d'Apple mai s'han d'afegir a fitxers versionats. Mitigació: Ús exclusiu de `.env.botigues.local` amb `chmod 600` i vigilat per `preflight.mjs`.
- **Inconsistència entre el build web i el natiu:** Mitigació: `preflight.mjs` compara byte a byte l'`index.html` de `dist-natiu/` amb la còpia interna d'iOS i Android abans de permetre qualsevol pujada.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261023_1345_prompt_claude_gemini_botigues_mobil]]
- [[03_llibre_mestre_tasques_i_idees]]
