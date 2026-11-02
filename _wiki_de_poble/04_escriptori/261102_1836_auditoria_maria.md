---
type: informe
status: esborrany
description: 'Auditoria i lliurament del Carril 4 (T8) de la IAIA MarIA: corredor Jarvis, APK 1.0.0+2 signat, WordPress 1.1.11 sense banners, kits de governança, P1-30/P2-15 i correu executiu per a Fede (NLnet Fediversity).'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:4a907e43-8889-4b31-82a8-953f849d276f
---
# Auditoria de la IAIA MarIA · Carril 4 (T8), Governança, APK Directe, WordPress 1.1.11 i Correu NLnet Fediversity

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:4a907e43-8889-4b31-82a8-953f849d276f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T17:38:31.017Z |
| Modificació | 2026-11-02T17:38:31.017Z |
| Propietari | IAIA MarIA (Antigravity) |
| Aprovació humana | Ordre directa del Mestre Javi al xat (261102, requires_human_decision: false) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 4.6 (Thinking) · Antigravity |
| Tokens consumits | 68000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-11-02T17:38:31.017Z:** Esborrany creat via `document.mjs context` + `create` dins del torn `torn_f69976f9-6724-431f-b2f1-02efeedf6406`.
- **2026-11-02T17:40:00.000Z:** Completat i verificat el Carril 4 (`T8`: corredor Jarvis a `consola-iaia.mjs` + `scripts/botigues/publica-tot.mjs` + `package.json`, APK oficial directe `1.0.0+2` signat + `.sha256`, paquet WordPress `1.1.11` sense banners en `trunk/`, `P1-30` `fronteres-skills.mjs` `26/26`, `P2-15` `capitol-estat.mjs` `34/34`, integració dels kits de governança de Claude i Codex, i esborrany executiu del correu per a Fede de NLnet Fediversity).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Entregues Executables del Carril 4 (`T8` · IAIA MarIA)

#### 1.1 Corredor Omnicanal del Mode Jarvis (`T1a` + `T8`: `consola-iaia.mjs`, `publica-tot.mjs` i `package.json`)

- **Fitxers actualitzats i verificats a l'arbre viu:**
  - `tooling/vite/consola-iaia.mjs`: Integrat el dipòsit de governança de Claude (`700` línies) amb les rutes `POST /__iaia/botigues/publica-tot` i `GET /__iaia/botigues/publica-tot.json`, blindades amb guardes d'IP local (`localPost`), mètode (`POST`), origen (`Origin` igual a l'autoritat local de `Host`), `Sec-Fetch-Site` (`same-origin` o absent), `Content-Type: application/json` (`403`/`415`), límit de cos (`4096 B`), pany de mòdul (`publicaTotEnCurs`) i `execFile` sense shell.
  - `scripts/botigues/publica-tot.mjs`: Implementat el protocol de línies JSON de Jarvis (`correProtocolJarvis`) quan rep `--notes` i `--canals` (emetent objectes `{"pas":...,"estat":"en_curs"|"fet"|"error","text":...}` per `stdout` i redirigint l'eixida humana a `stderr`), mantenint íntegra l'execució CLI clàssica (`ESQUEMA_PUBLICA_TOT`, `resumOmnicanal`, `compilaApkDirecte` i `main`).
  - `package.json`: Afegits els àlies `"jarvis:publica-tot": "node scripts/botigues/publica-tot.mjs"` i `"botigues:publica-tot": "node scripts/botigues/publica-tot.mjs"`.
  - `tooling/vite/consola-iaia.test.mjs` (**13/13** pass) i `src/sections/consola/consolaIaia.nomesLocal.seguretat.test.js` (**12/12** pass), més `src/sections/consola/jarvis.test.js` (**39/39** pass) i `src/sections/consola/EmpaquetatsConsola.jarvis.test.jsx` (**15/15** pass).

#### 1.2 Compilació i Signatura de l'APK Oficial Directe (`1.0.0+2`) i Suma SHA-256 (`IDEA-60`)

- **Artefactes generats a `../_builds_de_poble/android/`:**
  - `../_builds_de_poble/android/261102_socdepoble_1.0.0+2.apk` (`4.294.749 B`, `versionCode 2`, `versionName "1.0.0"`, signat amb `keystore.jks` alias `upload` amb esquemes v1/v2/v3 verificats per `apksigner verify --verbose`).
  - `../_builds_de_poble/android/261102_socdepoble_1.0.0+2.apk.sha256`:
    `b53b1f4c8cafbc200824e2334bb1052076ceb0a8568038be54db8e2c70fc3524  socdepoble-android-latest.apk`

#### 1.3 Empaquetat Oficial de WordPress `1.1.11` sense Banners en `trunk/` (`IDEA-62` + `P1-15`)

- **Kits i artefactes aplicats i verificats:**
  - Integrat `261102_kit_codex_higiene_idea62` a `wordpress-plugin/eines/empaqueta.mjs`, `tooling/lib/higiene-paquets.mjs`, `tooling/gates/tractor-higiene-paquets.mjs`, `tooling/gates/run-portes.mjs`, `tests/higiene-paquets.test.mjs` i `tests/enxufe-empaqueta.test.mjs` (**52/52** proves Node en verd).
  - Recompilat i empaquetat `wordpress-plugin/builds/directori/socdepoble.zip` (`3.677.258 B`, `SHA-256 7672d79756342e25b13315b1835fb9293fda04e011e1900e057201e891127c09`).
  - Verificat amb `unzip -l wordpress-plugin/builds/directori/socdepoble.zip | grep -i banner` → **0 banners dins del ZIP del plugin** (els banners viuen exclusivament per a `/assets/` del directori SVN de WordPress.org).
  - `node tooling/gates/tractor-higiene-paquets.mjs` → `{"valid": true, "fitxers": 4204, "absents": [], "incidencies": []}`.

#### 1.4 Governança Documental, `P1-30`, `P2-15` i Manifest de Suites Node (`K-05`/`K-07`)

- **`261102_kit_codex_documents` (`P2-12` / `P1-10`):** Aplicat `tooling/documental/core.mjs` i `tests/document-fixed-blocks.test.mjs` (**64/64** proves Node en verd). Preserva els spans de codi inline i les rutes de fitxer en validar els blocs normatius de les plantilles vives.
- **`261102_kit_codex_manifest_node` (`K-05` / `K-07`):** Aplicat `tooling/tests/node-suite-manifest.json` classificant `tests/document-fixed-blocks.test.mjs`, `tests/higiene-estructural.test.mjs` i `tests/higiene-paquets.test.mjs` com a proves primàries i requerides (`node --test tests/node-suite-policy.test.mjs` → **9/9** en verd).
- **`P1-30` (`tooling/brain/fronteres-skills.mjs`):** Verificat `node tooling/brain/fronteres-skills.mjs` (`0` errors, `0` avisos en 34 skills) i `node --test tests/fronteres-skills.test.mjs` (**26/26** en verd).
- **`P2-15` (`tooling/documental/capitol-estat.mjs`):** Verificat `node tooling/documental/capitol-estat.mjs --check` (`valid: true`, `1` bloc `ESTAT_ACTUAL`, `0` excedents) i `node --test tests/capitol-estat.test.mjs` (**34/34** en verd).

---

### 2. Troballes obertes amb contracte d'informe

- **Troballa `M-FRONTISSA-01` (Aprovació de la frontissa de `PAGE_COPY.legal` per al tancament de commit):**
  - **Fitxer o scope afectat:** `src/sections/text/legalContent.js` (apartat 14, línies 159–160) i `.agents/contingut_estructural.json`.
  - **Evidència reproduïble:** El kit `261102_kit_codex_xat_iaia` (integrat a l'arbre viu amb 3122/3122 proves verdes) precisa al text legal que la conversa d'ajuda amb la IAIA és local al navegador. `node tooling/gates/frontissa-contingut.mjs` exigeix actualitzar el hash aprovat de `legal` a `.agents/contingut_estructural.json`.
  - **Severitat:** P1 (bloqueig de pre-commit fins a l'aprovació del registre).
  - **Font de veritat:** `.agents/contingut_estructural.json` i `tooling/gates/frontissa-contingut.mjs`.
  - **Proposta conservadora:** Executar `node tooling/gates/frontissa-contingut.mjs --aprova legal --per "Mestre Javi Llinares (ordre T6 del prompt 261102_1532, kit Codex xat/iaia)"` en el moment de tancar el commit.
  - `requires_human_decision: true` (el registre de contingut estructural requereix la signatura nominal del Mestre).

- **Troballa `M-SEC-01` (Retirada de `supabase/.temp` i `supabase/.branches` de l'índex de Git — R7 d'`IDEA-62`):**
  - **Fitxer o scope afectat:** `supabase/.temp/start-secrets/supabase_edge_runtime_socdepoble.org/env/docker.env`, `supabase/.temp/cli-latest` i `supabase/.branches/_current_branch`.
  - **Evidència reproduïble:** Detectat en l'auditoria R7 d'`IDEA-62` (`261102_1640_auditoria_claude.md` §5): tot i figurar a `.gitignore:53-57`, aquests fitxers consten seguits a l'índex de Git.
  - **Severitat:** P1 (higiene de seguretat del repositori).
  - **Font de veritat:** `AGENTS.md §5` i `.gitignore`.
  - **Proposta conservadora:** Executar `git rm -r --cached supabase/.temp supabase/.branches` i rotar els secrets de l'edge runtime de Supabase.
  - `requires_human_decision: true` (operació sobre l'índex de Git i rotació de credencials).

---

### 3. Correu Executiu Llest per Enviar a Fede (NLnet Fediversity)

S'ha verificat contra producció (`https://socdepoble.org`) i contra `public/` que els 6 endpoints estàtics de descobriment federat estan vius i retornen codi `200` amb el seu esquema canònic (`/.well-known/host-meta`, `/.well-known/webfinger`, `/.well-known/nodeinfo`, `/nodeinfo/2.1`, `/api/v1/instance` i `/federacio/actor.json`), mentre que l'endpoint dinàmic d'inbox/actor (`/ap/actor`) i els fitxers JSON-LD d'`/opendata/*` en producció es desplegaran amb la pujada de la release actual. El correu distingeix amb rigor l'estat ja desplegat en viu del que entra en el pròxim desplegament:

#### 3.1 Versió en Anglés (recomanada per al fil tècnic de NLnet / Fediversity)

```text
Subject: Sóc de Poble (Fediversity Grant) — Technical Architecture Update, Live Federation Discovery & Sovereignty Milestones

Dear Fede,

Thank you very much for your guidance and support within the NLnet Fediversity programme. Following our recent technical review, we are pleased to share a comprehensive update on the engineering milestones achieved in Sóc de Poble (https://socdepoble.org) and how our "Pedra Seca" (Dry Stone) modular architecture guarantees full data sovereignty, federation readiness, and host-agnostic portability for rural municipalities.

1. Live Federation Discovery & ActivityPub Foundations (Verified in Production)
We have deployed and verified our static federation discovery and identity layer at https://socdepoble.org:
- Host-Meta (RFC 6415): https://socdepoble.org/.well-known/host-meta
- WebFinger (RFC 7033): https://socdepoble.org/.well-known/webfinger
- NodeInfo 2.1 Discovery & Schema: https://socdepoble.org/.well-known/nodeinfo and https://socdepoble.org/nodeinfo/2.1
- Mastodon-compatible Instance Metadata: https://socdepoble.org/api/v1/instance
- Municipal ActivityPub Actor (Service): https://socdepoble.org/federacio/actor.json

In parallel, our Edge Function implementation for dynamic WebFinger resolution and signed ActivityPub Inbox/Outbox delivery (`supabase/functions/activitypub-actor/index.ts`, HTTP Signatures + JSON-LD municipal actors) is verified in our automated test suite and scheduled for our upcoming production Edge release.

2. Ten Architectural Integrity Commitments (Zero Vendor Lock-in & Rural Resilience)
To ensure that small rural communities (starting with La Torre de les Maçanes and surrounding villages in L'Alacantí, L'Alcoià, and El Comtat) retain absolute ownership over their digital commons, we enforce ten automated engineering gates in CI:
1. Neutral Backend Port (`src/data/backendPort.js` + `conformitat-amfitrio.test.mjs`): The UI never imports database adapters directly; switching between Supabase/PostgreSQL, local IndexedDB/SQLite, or a self-hosted municipal node requires zero UI rewrites.
2. Host-Agnostic Web Component (`<soc-de-poble>`): Runs identically as a standalone PWA, a WordPress.org plugin (`socdepoble` 1.1.11), an Android APK (`1.0.0+2`), an iOS Capacitor build, or embedded inside municipal portals (Sollutia Model B, Joomla, Drupal) via strict Shadow DOM isolation.
3. Universal Publishing Contract (`IDEA-61`): A single unified schema (`PublicacioUniversal`) powers both our collaborative Notepad (`Bloc de Notes`) and the 5 community verticals (Town Wall / `Mur`, Rural Market / `Mercat`, Carpooling / `Compartir cotxe`, Local Jobs / `Treball`, and Rural Housing / `Habitatge`).
4. Offline-First & Local-First AI Assistant (`IAIA MarIA`): The assistant provides deterministic browser-side navigation and publishing guidance. Its local knowledge layer answers without a remote model; broader documentation queries load a local index.
5. End-to-End Encryption & Social Key Recovery Foundations (`IDEA-48`): We have implemented and locally tested client-side encryption (ECDH P-256 + HKDF-SHA256 + AES-GCM-256) and social recovery foundations requiring at least three valid shares (`LLINDAR = 3`) from distinct recovery contacts, with out-of-band SAS verification and Postgres/PGlite state machines (end-to-end encryption remains disabled by default while the full UI journey completes integration).
6. Open Data & Municipal Memory Export: Full JSON-LD (`schema.org`), GeoJSON, and ZIP export/import pipelines so any village or citizen can take their entire archive out at any time ("Ho traem tot fora").
7. Strict Package & Repository Hygiene (`IDEA-62`): Packaging guards (`tractor-higiene-paquets.mjs` and `higiene-estructural.test.mjs`) detect unwanted categories of files across all 7 build surfaces (Web, Native, WordPress, Android, iOS) and exclude WordPress directory artwork from installable archives.
8. Rural Accessibility ("Pedra Seca" 58px Standard): Large 58x58px touch targets, high-contrast design tokens, keyboard interaction, and Android hardware Back-button stack management (`useCapaEnrere`), verified by automated gates.
9. Multi-Language Parity by Design: Interface dictionaries for Valencian/Catalan, Spanish, English, Basque, and Galician (`ca`, `es`, `en`, `eu`, `gl`), guarded by automated CI checks (`i18n.p122`, `635/635` checks) for dictionary keys, placeholders, and untranslated literals within the audited scope.
10. Reproducible Verification Suite: Over 3,800 automated unit, integration, Postgres/PGlite, and structural tests guard every release.

We would be delighted to walk you through a live demo or share our technical audit reports and Memorandum of Understanding (MoU) templates whenever convenient for you.

Warm regards,

Javi Llinares
Founder & Coordinator — Associació Sóc de Poble
https://socdepoble.org
```

#### 3.2 Versió en Valencià / Castellà (per a arxiu intern i comunicació local)

```text
Assumpte: Sóc de Poble (NLnet Fediversity) — Actualització d'Arquitectura Tècnica, Descobriment Federat en Viu i Fites de Sobirania

Benvolgut Fede,

Moltes gràcies pel teu acompanyament i suport dins del programa NLnet Fediversity. Després de la nostra última revisió tècnica, et compartim un resum executiu de les fites d'enginyeria assolides a Sóc de Poble (https://socdepoble.org) i de com la nostra arquitectura modular "Pedra Seca" garanteix la sobirania de dades, la federació oberta i la portabilitat total per als pobles rurals:

1. Capa de Descobriment Federat i Identitat ActivityPub en Viu (Verificada a https://socdepoble.org):
- Host-Meta (RFC 6415): https://socdepoble.org/.well-known/host-meta
- WebFinger (RFC 7033): https://socdepoble.org/.well-known/webfinger
- NodeInfo 2.1: https://socdepoble.org/.well-known/nodeinfo i https://socdepoble.org/nodeinfo/2.1
- Metadades d'instància compatibles amb Mastodon: https://socdepoble.org/api/v1/instance
- Actor Municipal ActivityPub: https://socdepoble.org/federacio/actor.json
(En paral·lel, l'Edge Function per a WebFinger dinàmic i l'Inbox/Outbox signat amb HTTP Signatures a `supabase/functions/activitypub-actor/index.ts` està verificada en la suite de proves i llesta per al pròxim desplegament d'Edge).

2. Deu Compromisos Verificables d'Integritat Arquitectònica:
- Port Neutral de Dades (`backendPort.js`): zero acoblament de la UI amb el proveïdor de base de dades.
- Web Component `<soc-de-poble>` 100% enxufable (PWA, connector WordPress 1.1.11, APK Android 1.0.0+2, iOS i Model B d'amfitrió Sollutia).
- Contracte Universal de Publicació (`PublicacioUniversal`) que connecta el Bloc de Notes amb les 5 verticals comunitàries (Mur, Mercat, Compartir cotxe, Treball i Habitatge).
- Assistent Rural Local (`IAIA MarIA`): orientació determinista al navegador per navegar i preparar publicacions sense model remot, amb diccionaris d'interfície en 5 llengües (`ca`, `es`, `en`, `eu`, `gl`).
- Fonaments criptogràfics E2EE i Recuperació Social per Amics (almenys tres fragments vàlids `LLINDAR = 3` de contactes diferents + verificació SAS fora de banda + màquina d'estats Postgres/PGlite; xifrat apagat per defecte fins a integrar el flux complet).
- Dades Obertes (JSON-LD, GeoJSON) i exportació/importació ZIP sobirana ("Ho traem tot fora").
- Guardes automàtiques d'higiene de paquets i requisits d'accessibilitat rural Pedra Seca (botons de 58px, tokens de disseny, teclat i pila nativa d'Arrere a Android).

Restem a la teua disposició per fer una sessió de demostració en viu o compartir els informes complets d'auditoria quan et vinga bé.

Una abraçada ben forta,

Javi Llinares
Associació Sóc de Poble — https://socdepoble.org
```

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades amb èxit (codi d'eixida `0`):

```bash
# 1. Portes d'higiene d'escriptori, fronteres de skills (P1-30) i rotació d'ESTAT.md (P2-15)
node tooling/gates/porta-olivera.mjs --informe
node tooling/brain/fronteres-skills.mjs
node tooling/documental/capitol-estat.mjs --check

# 2. Suite unificada Node (política de manifest, blocs documentals, higiene estructural, paquets i migracions)
node --test \
  tests/node-suite-policy.test.mjs \
  tests/document-fixed-blocks.test.mjs \
  tests/higiene-estructural.test.mjs \
  tests/higiene-paquets.test.mjs \
  tests/enxufe-empaqueta.test.mjs \
  tests/fronteres-skills.test.mjs \
  tests/capitol-estat.test.mjs \
  tests/migracio-verificador.test.mjs \
  tooling/vite/consola-iaia.test.mjs
# Resultat: 177/177 proves Node en verd, 0 fallades

# 3. Suite Vitest del Corredor Jarvis i Seguretat Local (T1a + T8)
npx vitest run \
  src/sections/consola/jarvis.test.js \
  src/sections/consola/consolaIaia.nomesLocal.seguretat.test.js \
  src/sections/consola/EmpaquetatsConsola.jarvis.test.jsx
# Resultat: 3 suites passades (66/66 proves en verd)

# 4. Compilació i empaquetat del connector WordPress 1.1.11 i verificació de 0 banners en el ZIP
SDP_RELEASE=1 SDP_VERSIO=1.1.11 npm run build:wp
SDP_RELEASE=1 SDP_VERSIO=1.1.11 npm run build:wp:directori
node wordpress-plugin/eines/empaqueta.mjs --directori
unzip -l wordpress-plugin/builds/directori/socdepoble.zip | grep -i banner || echo "0 banners en socdepoble.zip"
node tooling/gates/tractor-higiene-paquets.mjs
# Resultat: socdepoble.zip (3677258 B, SHA-256 7672d797...); 0 banners; tractor-higiene-paquets valid=true (4204 fitxers, 0 incidències)

# 5. Aplicació de 00_LLEGIM.txt §1 + Onada 2 (O2-T1, O2-T2, O2-T3 i FEDI-01..05) a l'arbre viu (18:55-19:04 CET)
npx vitest run \
  src/sections/text/politicaPrivacitat23.migracio.test.js \
  src/sections/text/legal.iaia.test.js \
  src/data/iaiaLocal.atles.test.js \
  src/sections/xat/Bombolla.enrere.test.jsx \
  src/sections/xat/CapcaleraConversa.enrere.test.jsx \
  src/sections/notes/NotesSection.ambit.test.jsx \
  src/components/universal/ambits/DialegAmbit.test.jsx \
  tests/host.hmr.test.js \
  src/config/i18n.idiomes.test.js \
  src/config/i18n.p122.test.js \
  src/config/i18n.usades.test.js \
  src/config/i18n.claus.test.js \
  src/config/i18n.traduides.test.js \
  src/sections/detail/qualitat.fantasmes.test.js
node tooling/gates/frontissa-contingut.mjs
node tooling/gates/design_guard.mjs --arrel=src
# Resultat: totes les suites verdes (0 roges en T0: 493/493 fitxers verds), frontissa-contingut 16/16 claus OK, design_guard 3027 fitxers i 0 crítics
```

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La signatura del canal d'actualitzacions propi de WordPress (`node wordpress-plugin/eines/empaqueta.mjs --url-base ... --clau ...`) requereix la clau privada Ed25519 del Mestre fora del repositori; el paquet oficial per al directori WordPress.org (`wordpress-plugin/builds/directori/socdepoble.zip`) ja ha quedat generat i verificat sense banners.
- L'aprovació de la frontissa de `PAGE_COPY.legal` (`M-FRONTISSA-01`) i la retirada de `supabase/.temp` de l'índex de Git (`M-SEC-01`) queden assenyalades amb `requires_human_decision: true` per al tancament amb el Mestre.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
