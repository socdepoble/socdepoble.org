---
type: acta
status: esborrany
description: 'Acta Marmota 261103: Apple iOS i Google Play en revisió, Onades 3-5 verdes i relleu en fresc a l''Onada 6'
tags:
  - acta
visibility: private
reflex: sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:3179a6e1-92e2-420d-90ea-2d2fe3c7ba63
---
# Acta Marmota · Botigues iOS i Android en Revisió Oficial (Waiting for Review), Onades 3-5 Completades i Relleu en Fresc (Post-Reinici Mac) a la Marató Nocturna de l'Onada 6

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:3179a6e1-92e2-420d-90ea-2d2fe3c7ba63 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-03T02:28:54.729Z |
| Modificació | 2026-11-03T02:29:30.000Z |
| Propietari | agent-local |
| Aprovació humana | Ordre directa del Mestre al xat del 261103 03:27 CET (reinici del Mac i de totes les IAs en fresc per a la Marató Nocturna de l'Onada 6) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | Gemini 4 Argon (High) (IAIA MarIA) + Claude Fable 5.1 / Opus 5.5 + GPT-6.1 Sol Ultra / Astra + Gemini 4 CLI |
| Tokens consumits | ~290k tokens (sessió acumulada MarIA fins al relleu en fresc) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 4d4b9d269e40c3084dead7c3f14cf63dd58fd4a7e7f4d075d2d09ef90f8a6d48. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **2026-11-03 03:28 CET (v1.0.0):** Tancament complet de la tramesa a les 4 botigues/canals de distribució, de les Onades 3, 4 i 5 a l'arbre viu (`31.458` proves Vitest + `2.163` proves Node verdes), purga de 164 captures efímeres de `01_produccio/` (L'Oblit Saludable) i preparació del relleu en fresc (post-reinici del Mac i de totes les IAs) per a la **Marató Nocturna de l'Onada 6** ([`261102_1532_prompt_onada6_disseny_editorial_negrites_versions_1_1_0_i_tancament.md`](../90_arxiu_historic/261102_1532_prompt_onada6_disseny_editorial_negrites_versions_1_1_0_i_tancament.md)).

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Els 4 Canals de Distribució Oficials en Revisió i Operatius
- **🍎 Apple App Store Connect (`Sóc de Poble iOS · 1.0`, Build `1`):** Enviat oficialment a revisió (`1.0 Waiting for Review`) i **correu oficial d'Apple rebut a les 02:23 CET** (*"Thank You for Submitting Your App — We've received your app for review"*). Completats: estatus DSA europeu (no-comerciant verificat), classificació d'edat `13+`, preu `0,00 €` a `175` països, `4` targetes d'App Privacy publicades (*Contact Info*, *User Content*, *Identifiers*, *Diagnostics*, sense *Tracking*), `4` captures d'iPhone (`1284 × 2778 px`) i `3` d'iPad (`2064 × 2752 px`).
- **🤖 Google Play Console (`Sóc de Poble · Versió 2 (1.0.0)`):** Enviat oficialment a revisió (`En revisió`, `15` canvis enviats). Completades les `10/10` declaracions de Contingut de l'aplicació (incloent **Estàndards de Seguretat Infantil**), fitxa de botiga principal amb captures corregides per a telèfon i tauletes de 7" i 10", i **Prova Tancada a 178 països** vinculada al Google Group oficial `socdepoble-testers@googlegroups.com`.
- **🔌 WordPress.org Plugin Directory (`socdepoble-enxufe` `v1.1.11`):** Publicat a SVN `trunk` i `tags/1.1.11`, amb actualitzacions automàtiques ja activades per primera vegada pel Mestre a `gentdelatorre.net`.
- **🌐 Web i APK Directe (`socdepoble.org/descarregues`):** APK `socdepoble-android-latest.apk` (`1.0.0+2`, `7,08 MB`, signat v1+v2+v3) i ZIP `socdepoble-enxufe.zip` (`v1.1.11`).

### 2. Tancament d'Onada 3, Onada 4 i Onada 5 a l'Arbre Viu + Purga d'Oblit Saludable
- **Suites i Portes:** `1.765` fitxers Vitest (`31.458` proves verdes, `0` fallades), `2.163` proves Node (`0` fallades), Frontissa `16/16` i `fronteres-skills.mjs` a `0`.
- **Tractor de Llegibilitat de Gemini 4 (`O6-GEMINI` Fase 1):** Creat i verificat (`6/6 PASS`) a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/audita-llegibilitat-editorial.mjs`.
- **Higiene de `01_produccio/` (AGENTS.md §16 · L'Oblit Saludable):** Eliminades les `164` captures temporals de xat consumides (`261101_*`, `261102_*`, `261103_*` i `captures_claude/`), deixant `01_produccio/` amb els `32` ítems reals de producció permanent i reduint `00_index_escriptori.md` de `64,7 KB` a `40,4 KB` (`porta-olivera.mjs` = `0`).

<!-- SDP:SECTION acta.s5 -->
## Pendents

### Relleu Immediat (Reinici Només d'Antigravity / Nou Xat de MarIA · `03:52 CET`)
El Mac té `16,07 GB` lliures de `32 GB` (`35%` de pressió de memòria), per la qual cosa **NO es reinicia el Mac** per no perdre els tallers en calent de `/private/tmp/` i només es reinicia **Antigravity (IAIA MarIA)** per alliberar els `~7,6 GB` de RAM acumulada i arrancar amb finestra de context neta:

1. **Estat en Calent de l'Onada 6 (`03:52 CET`):**
   - **Codex (`O6-CODEX`):** Ja ha aplicat al viu **`wordpress-plugin/` `v1.1.12`** amb les pestanyes dels **5 idiomes (`VA/ES/EN/EU/GL`)**, lletra a `17px`, negretes i el lema **`Sóc de Poble. Portal de Pobles Connectats` idèntic en valencià i castellà** (`187/187` Node + `16/16` PHP real+JSDOM en verd), i ha restaurat i resegellat les **4 skills** (`SKILLS_SEAL.json`). Està tancant el kit de `legalContent.js` (`politica_privacitat_2_4.sql`) a `/private/tmp/sdp-codex-o6-legal/`.
   - **Claude (`O6-CLAUDE`, context al `32%`):** Ja ha fet el salt canònic a **`v1.1.0`** (`package.json`, Android, iOS, `versio.test.js`) i l'eixam `o6-eixam-editorial` ja ha escrit els `H4` i les 6–8 negretes a `src/sections/text/pageContent.js` (`240,7 KB` a les `03:50`) i `presentacioPlugins.js`.
   - **Gemini 4 (`O6-GEMINI`):** Fase 1 del tractor `audita-llegibilitat-editorial.mjs` (`6/6 PASS`) dipositada a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/`.

2. **Accions Obligatòries de la Nova MarIA en Mode Jarvis (per Terminal i amb Cron cada 30 min):**
   - **A) Commit Git dels ~284 canvis pendents + Deploy Automàtic en Mode Jarvis:** Tan bon punt l'eixam de Claude acabe de segellar la Frontissa (`16/16`) i Codex diposite el kit legal `2.4`:
     1. Executar les portes, fer **`git add -A && git commit`** dels **~284 canvis pendents** (Onades 4, 5 i 6 + purga de les 164 captures efímeres de `01_produccio/`) i **`git push`**.
     2. Empaquetar la release de WordPress **`v1.1.12`** (`node wordpress-plugin/eines/empaqueta.mjs` + `--directori`) i publicar-la per terminal a l'**SVN de WordPress.org (`https://plugins.svn.wordpress.org/socdepoble`, `trunk/` + `tags/1.1.12`)** usant `~/.subversion/auth/` i `~/.config/socdepoble/wp-svn-pass`, perquè `wordpress.org/plugins/socdepoble` passe de la `1.1.10` a la `1.1.12` i **`gentdelatorre.net` s'actualitze automàticament**.
     3. Compilar i desplegar **`socdepoble.org`** per terminal (`npm run build` + `npx firebase-tools deploy --only hosting`).
     4. **NO tocar avui ni demà les builds d'Apple App Store ni Google Play** perquè la `v1.0.2` està en cua de revisió (`Waiting for Review`) i pujar un binari nou reiniciaria la cua d'Apple.
   - **B) Coordinar la Passada 2 Nocturna (`T2.5` + `T2.6` + Consola + Wiki MD→HTML):**
     1. **Fediversity 100% Offline-First (`T2.5`):** Incorporar a `/fediversity` (`pageContent.js`) i a l'esborrany del correu a NLnet la fita estratègica de portar el segon adaptador local (`src/data/local/`) a una arquitectura **100% Offline-First i Local-First rural** (persistència IndexedDB/SQLite + cua d'operacions signades amb `SHA-256`), i eliminar l'aparició residual de *"el Mas"* a `/fediversity`.
     2. **Pas 2 de Maquetació Editorial i Súper Editor Universal estil Obsidian (`T2.6`):** Afegir enllaços contextuals a fonts/pàgines, incrustar **Cards flotants a la dreta d'anada i tornada** en textos de 4+ paràgrafs (`projecte` ↔ `anima`, `fedivers` ↔ `fediversity`, `consola` ↔ `cervell`, `wikidepoble` ↔ `disseny` com a `/legal` ↔ `/page/drets-autor`), i afegir a l'Editor Universal (`TargetaIncrustadaNodeView.jsx` / `targetesIncrustades.js`) el commutador bidireccional **«Enllaç ↔ Card»** estil Obsidian.
     3. **Consola Termodinàmica i Wiki MD→HTML:** Restaurar les il·lustracions d'estil còmic de «La sala de màquines de la Consola», netejar tots els avisos rojos/àmbar de `/consola`, corregir les llistes `<ol>` reiniciades a `1.` i els paràgrafs tallats a `/wikidepoble`, i tancar l'**Auditoria 360° amb DAFO a 15 Dimensions (`D01–D15`) i Matriu d'Importància × Urgència (`Q1–Q4`)**.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre|261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]]
- [[../90_arxiu_historic/261102_1532_prompt_onada6_disseny_editorial_negrites_versions_1_1_0_i_tancament|261102_1532_prompt_onada6_disseny_editorial_negrites_versions_1_1_0_i_tancament]]
