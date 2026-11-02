---
type: acta
status: esborrany
description: Acta de tancament del desplegament de la Marató Nocturna (70 migracions, socdepoble.org amb Avisos Push actius, skills segellades, iOS 1.0.0+2 pujat a Apple i Android 1.0.0+2 .aab signat) i obertura d'IDEA-60.
tags:
  - acta
visibility: private
reflex: sdp:torn_fad962dd-2cbf-457d-98d7-ee28c04f647f:fe8baa77-dd9b-41e9-b4b2-bd9852b56a85
---
# Acta Marmota — Producció B1-B12, Avisos Push del Xat, Botigues 1.0.0 (2) en Mode Jarvis i Disseny IDEA-60

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fad962dd-2cbf-457d-98d7-ee28c04f647f:fe8baa77-dd9b-41e9-b4b2-bd9852b56a85 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T13:57:02.066Z |
| Modificació | 2026-11-02T13:57:02.066Z |
| Propietari | IAIA MarIA (Orquestradora) |
| Aprovació humana | aprovat |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | 68200 |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 4d4b9d269e40c3084dead7c3f14cf63dd58fd4a7e7f4d075d2d09ef90f8a6d48. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **v2.1.0 (2026-11-02 14:56 CET):** Acta Marmota de tancament de la posada en producció integral de la Marató Nocturna (`Blocs B1..B12`, commit `3362f9773`), activació i verificació real dels Avisos Push del Xat (`notifica-xat` + VAPID + `private.ajustos`), resegellat de les 7 skills (`SKILLS_SEAL.json`), generació i pujada en Mode Jarvis de les versions natives **`1.0.0 (2)` (`1.0.0+2`)** d'iOS (pujada a App Store Connect / TestFlight) i Android (`.aab` signat amb `upload-socdepoble.jks`), i registre d'**`IDEA-60`** (*Panell i Orquestrador «Mode Jarvis Omnicanal d'1 Clic»*).

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica (Desplegament Integral a Producció i Botigues en Mode Jarvis)

- **Estat del Repositori i Producció (`HEAD = 3362f9773` a `backup-notes-publish` + resegellat de skills i versió `1.0.0+2`):**
  1. **Punt 1 · 6 Migracions SQL noves aplicades a Supabase Producció (`adjlvwtxhpclgmnsvwpm`):**
     - Aplicades i verificades en l'ordre canònic de `supabase/ordre_desplegament.json` (files `65` a `70`): `2611011500_autoria_ajuntament_mateix_poble.sql`, `2611011510_versio_minima_client.sql`, `2611011800_contracte_exportacio_federacio_v1.sql`, `2611012257_b2_kid_monoton_i_f2a.sql`, `2611020106_b5_dades_obertes_i_cua_federacio.sql` i `2611020417_b8_push_xat.sql`.
     - Verificació SQL i `node tooling/gates/verifica-migracions-supabase.mjs`: **`70 migracions en el manifest · 0 violacions`**.
  2. **Punt 2 i 3 · Avisos Push del Xat (`B8`) i Desplegament Web a `https://socdepoble.org`:**
     - Generat parell de claus VAPID EC P-256 i guardat a `.env.production.local` (`VITE_VAPID_PUBLIC_KEY`).
     - Pujats els 4 secrets a Supabase (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`), desplegada l'Edge Function `notifica-xat` (`ACTIVE`) i activat `push_xat_actiu = 'si'` + `notifica_xat_cron_secret` a `private.ajustos`.
     - Compilat i desplegat `dist/` a Firebase Hosting (`https://socdepoble.org`) i verificat en viu pel Mestre al seu navegador (**«Avisos en este dispositiu: Sí»** en verd).
     - Resegellades les 7 skills (`core-consell-i-colmena`, `core-higiene-escriptori`, `core-telemetria-huma`, `sdp-clon-whatsapp`, `sdp-universal-page`, `sdp-vigilant-tellado`, `wiki-cicle-de-vida`) a `.agents/SKILLS_SEAL.json` (`42 skills · 0 violacions`).
  3. **Punt 4 · Compilació i Signatura de les Botigues iOS i Android `1.0.0 (2)` (`1.0.0+2`) en Mode Jarvis:**
     - **🍏 iOS (`1.0.0 (2)`):** Incrementat `CURRENT_PROJECT_VERSION = 2`, sincronitzat Capacitor, arxivat `../_builds_de_poble/ios/261102_socdepoble_1.0.0+2.xcarchive` i **pujat automàticament a App Store Connect / TestFlight** (`Uploaded App · ** EXPORT SUCCEEDED **`).
     - **🤖 Android (`1.0.0 (2)`):** Incrementat `versionCode 2`, generat el keystore oficial `/Users/javillinares/Documents/Antigravity/Som de Poble/_oficina_de_poble/claus/upload-socdepoble.jks` (amb contrasenya custodiada a `_oficina_de_poble/claus/android-upload-keystore-info.txt` i connectada a `.env.botigues.local`), i compilat, signat i verificat `../_builds_de_poble/android/261102_socdepoble_1.0.0+2.aab` (`44 MB`, `jar verified`, `SHA-256: cd73948007d3f4a18cea8ea3cf53e9e82eb1e2eb773772c2b8d5089f27065de8`).
  4. **Disseny i Registre d'`IDEA-60` (Fase 2 de `P1-35`):**
     - Registrat al Llibre Mestre el **Panell i Orquestrador «Mode Jarvis Omnicanal d'1 Clic»** per a administradors no tècnics (botó a `/consola/empaquetats` + `scripts/botigues/publica-tot.mjs` + webhook al núvol).

### 2. Part Termodinàmica Psiquiàtrica (El Temps, Incidències i Trellat)

- **Medició del Temps:**
  - Sessió continuada des de la Marató Nocturna (`261101_2143` → `261102_1456`).
  - **Estat del Mestre:** Seré, metòdic i orientat a fer les coses ben fetes sense pressa, prioritzant tancar i assegurar el treball acumulat abans d'obrir un nou xat per preparar la resposta al correu de **Fede (NLnet Fediversity)** d'aquesta nit.
- **Decisions de Trellat:**
  - Com que el keystore del 24 d'octubre encara no s'havia estrenat a Google Play Console, s'ha regenerat netament en Mode Jarvis guardant-ne les credencials a `_oficina_de_poble/claus/` i `.env.botigues.local` (`chmod 600`), eliminant per sempre qualsevol fricció de contrasenyes per al Mestre.
  - S'ha netejat l'Escriptori amb la Porta Olivera (`6` documents de torn consumits moguts a `90_arxiu_historic/`), deixant `0` documents solts.

### 3. Part Marmota (Checkpoint Executable i Següents Passos)

- **Estat Final (On es queda la boga):**
  - Producció web (`https://socdepoble.org`), `/page/fediversity`, `/page/descarregues`, Supabase (`70` migracions) i Avisos Push del Xat estan **100% en viu**.
  - `iOS 1.0.0 (2)` ja està pujat i processat a **App Store Connect / TestFlight** (`https://appstoreconnect.apple.com`).
  - `Android 2 (1.0.0)` (`261102_socdepoble_1.0.0+2.aab`, signat amb el keystore oficial del 24 d'octubre `AC:5F:98:33...` custodiat en Mode Jarvis) ja està **PUBLICADA EN VIU a Google Play Console (`Prova interna` · `19.486 dispositius Android compatibles`)**.
  - A l'Escriptori ja queden creats, validats i ancorats el Pla d'Implementació [[../04_escriptori/261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]] i el Prompt Local [[../90_arxiu_historic/261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre|../04_escriptori/261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]] amb el **Protocol d'Estalvi Termodinàmic de Quota** (desactivar `Extra/Ultracode` i operar en fil únic sense subagents a Claude Code).

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. `[x]` **Pujar i publicar el fitxer `.aab` (`261102_socdepoble_1.0.0+2.aab`) a Google Play Console (`2 (1.0.0)` publicada per a `19.486` dispositius)** i deixar la versió `1.0.0 (2)` d'iOS processada a TestFlight.
2. `[ ]` **Al nou xat (després de reiniciar el Mac):** Executar el Pla d'Implementació [[../04_escriptori/261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]] i el Prompt Local [[../90_arxiu_historic/261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre|../04_escriptori/261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]] per a completar **`IDEA-60` (Panell Mode Jarvis Omnicanal d'1 Clic + APK Directe)**, netejar els últims punts del Llibre Mestre (`P0-24b`, `P1-73`, `P1-22`, `P1-30`, `P2-15`, `P1-71`, WordPress `1.1.11`) i enviar el correu a **Fede (NLnet Fediversity)**.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../04_escriptori/261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]]
- [[../90_arxiu_historic/261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre|../04_escriptori/261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]]
