---
type: document
status: esborrany
description: Pla d'implementació ortogonal d'Onada R17 (AH-R17-01..17 / P0-78..P0-94) dosificat kit a kit per a Claude, Codex, Gemini Carbon i Node 0.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:8ce0a97f-95ca-4024-bc54-b5ca6a961efd
---
# Pla d'Implementació — Onada R17: Pentacanal, Android, Workspaces Multi-Llibre i Drets

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:8ce0a97f-95ca-4024-bc54-b5ca6a961efd |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-10T22:36:41.202Z |
| Modificació | 2026-11-10T22:37:30.000Z |
| Propietari | maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | ~28.000 tokens (Quota Google AI Ultra: 53% setmanal restant / 3d 1h) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-11-10T22:36:41.202Z:** Esborrany creat sobre tall d'evidència `COMMIT R16b · 0027b698d` (`v1.1.12`, `.org` i `.cat` verds, `243.811 B gzip`, `36.322` Vitest verds).
- **2026-11-10T22:37:30.000Z:** Pla consolidat d'Onada R17 (`AH-R17-01..17` / `P0-78..P0-94`) amb dosificació Kit a Kit (zero saturació de 100 fitxers d'un colp), línia base de quotes registrada a `_wiki_de_poble/10_metriques/consum_ia.csv` i Matriu d'Exclusivitat de Carrils a 4 bandes.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context, Línia Base de Tokens i Lliçons d'R16b

Partim del `COMMIT R16b · 0027b698d` ja desplegat en viu a `socdepoble.org` i `socdepoble.cat`. En R16b es van descartar 100 rutes brutes a `../_investigacio_ia_de_poble/261110_1440_r16b_arbitratge_claude/` per simulacions prohibides (`/page/avisador` amb botó fals *"Estic bé"* i al·lèrgens inventats). Per tant, R17 es construeix de manera quirúrgica i dosificada **Kit a Kit (`build + test + deploy`)** directament des d'`HEAD 0027b698d`, mai re-aplicant fitxers descartats a cegues.

**Línia Base de Quotes i Previsió per als pròxims 3-4 dies (`consum_ia.csv`):**
- **Gemini 4 Carbon High (Google AI Ultra):** `53%` setmanal restant (es renova en `3d 1h`, dissabte 14/11 00:30h; ritme sostenible `~17,4%/dia`), `98%` 5h restant (`2h 28m`). Pool `Claude+GPT` intern d'Antigravity al `100%` com a reserva d'emergència.
- **Claude Opus 5.5 Extra · Ultracode (Plan Ultra):** `48%` setmanal restant (`52%` usat, renova diumenge 15/11 01:00h; ritme sostenible `~11,8%/dia`), més **2 restabliments gratuïts intactes** (`Restablecimiento de Fable` i `Restablecimiento semanal`). Es manté `Opus 5.5 Extra · Ultracode` com a motor base (reserva de `Fable 5.2` només per a colls d'ampolla extrems).
- **Codex (ChatGPT Pro 200):** `40%` setmanal restant (`4d 3h`, renova diumenge 15/11 02:30h; ritme sostenible `~9,7%/dia`) + **`749` crèdits de saldo** disponibles.
- **Node 0 (`192.168.0.23:11434` · Mac mini M4):** `0,00 €` il·limitat, executant ja `task-73` amb les 8 escoles reals sobre el cas de Sofía («La Figuera»).

### 2. Matriu d'Exclusivitat de Carrils (Zero Col·lisions d'Escriptura)

| Agent / Carril | Entorn Físic | Fitxers i Abast Exclusiu (`AH-R17-*`) |
| --- | --- | --- |
| **Carril 1: Claude (`Opus 5.5 Extra · Ultracode`)** | Repo viu `socdepoble.org/` (iniciar sempre dins de `socdepoble.org/` per `v4.23118.1`) | **Kit R17.1A (Android Sofía + Blindatge UI):** `src/utils/compartirNatiu.js`, `src/App.jsx` (deep-link auth/recovery), `android/app/src/main/AndroidManifest.xml`, `public/.well-known/assetlinks.json`, `src/components/PerfilShell.jsx` / `src/pages/AuthPage.jsx` (`👁️` contrasenya + top header safe-area), CSS safe-area inferior i zoom `400%` (`320x480px`) en calaix `CONTROL` i modals, guarda `isHydrated` en esborranys de `/notes` i `/xat` (`AH-R17-11`, `AH-R17-16`).<br>**Kit R17.1B (Pentacanal + WP Entry + `kit_r16_c`):** `vite.config.wordpress.js` / `src/wordpress-entry.jsx` (`< 1.690.000 B`), integració de `../_investigacio_ia_de_poble/261109_kit_codex_r15_workspace_i_5_punts/kit_r16_c_arrelament_i_origen/`, sincronitzador de manifest viu Capacitor (`versio-viva.json` amb fallback offline a `dist-natiu/`) i `npm run build:natiu && npx cap sync` (`AH-R17-14`). Assimilació i `deploy` Kit a Kit de R17.2 i R17.3. |
| **Carril 2: Codex (`ChatGPT Pro 200`)** | Clon aïllat `/tmp/sdp_codex_r17` → lliura Kit CAS a `../_investigacio_ia_de_poble/261110_kit_codex_r17_avisador_drets_alergens/` | **Kit R17.2 (Avisador Real + Drets CC + Al·lèrgens 149):**<br>1. `src/pages/AvisadorPage.jsx` + preferències locals/perfil (`horesImmobilitat`, `horaIniciNit`→`horaFiNit`, `personesConfiansa`) i missatge automàtic pel Xat sense cap botó *"Estic bé"* ni falses promeses (`AH-R17-02`).<br>2. `src/sections/text/paginaDeText.js` (`page.copyright \|\| COPYRIGHT_SDP`), `src/components/universal/drets/llicencies.js` i `src/pages/CopyrightPage.jsx` amb camp d'autoria flexible (256 caràcters) i atribucions canòniques `CC BY-NC-SA 4.0 Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»` i `CC BY-NC-SA 4.0 Pedro Ferrer Rodriguez · El Rentonar. Natura i Patrimoni.` (`AH-R17-08`).<br>3. `src/utils/candidatsAlergens.js` complet i determinista per a les 149 receptes UE 1169/2011 (`• Conté`, `T Pot contindre`, `— No en porta`), eliminant `? Sense dada` per omissió (`AH-R17-07`). |
| **Carril 3: MarIA (`Gemini 4 Carbon High`)** | Clon aïllat `/private/tmp/sdp_r17_carbon` → lliura Kit CAS a `../_investigacio_ia_de_poble/261110_kit_carbon_r17_workspaces_i_maquetacio/` | **Kit R17.3 (Maquetació Pedra Seca + Workspaces Multi-Llibre):**<br>1. `avisador_vinyeta.webp` full-bleed sense marc blanc (`AH-R17-01`).<br>2. Unificació CSS `.sdp-gestor-fitxa` (Notes, Mercat, Banc d'Importació, Fitxa de Recepta) + targetes crema `90°` (`border-radius: 0`, `border: none`) (`AH-R17-03`, `AH-R17-04`).<br>3. `src/sections/recepta/ReceptaDetailSection.jsx`: `heroImage` (foto del plat o fallback vinyeta `que-dinem`) + `.sdp-fitxa-emoji-xl` en les 3 pestanyes (`AH-R17-05`, `AH-R17-06`).<br>4. Enllaç admin Google Groups a `/app` + incorporació íntegra de l'Acta constitutiva d'El Rentonar (2012) a l'entitat (`AH-R17-09`, `AH-R17-10`).<br>5. Dos Workspaces Multi-Llibre (`UniversalWorkspace`): Catàleg d'Arbres Singulars amb els **19 arbres del PDF de 2020** (arbre-mestre + sub-registres de revisió longitudinal CIEF v232) + Biblioteca Agrícola i Banc de Llavors (`AH-R17-13`, `AH-R17-15`). |
| **Carril 4: Node 0 (`8 Escoles Ollama · 192.168.0.23`)** | Execució asíncrona `task-73` sobre `_investigacio_ia_de_poble/` | **Estudi Doctoral FinTech (`AH-R17-12`):** `ESTUDI_DOCTORAL_PAGAMENTS_SQUARE_MERCAT_NODE0.md` analitzant PSD2, DAC7/AEAT, UX rural Sofía («La Figuera»), Frontissa hexagonal Square/Stripe/Redsys/Bizum i TPV Loiverse (0% comissió de Sóc de Poble). |

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Circuit Documental i Higiene d'Escriptori:** `node tooling/wiki/document.mjs check` sobre el Pla i els dos Prompts (`exit 0`) + `node tooling/gates/porta-olivera.mjs` (`exit 0`).
2. **Validació per cada Kit abans d'assimilar al repo viu:**
   - `npm run lint` (`0` errors).
   - `npx vitest run` sobre els tests unitaris nous i suites afectades (`100%` verds).
   - `npm run build` (`main chunk < 250 KB gzip`) i `npm run build:wordpress` (`wordpress-entry < 1.690.000 B`).
   - `npm run build:natiu && npx cap sync` per a la paritat pentacanal (`Android` + `iOS` + `.org` + `.cat` + `WordPress`).
3. **Verificació de Seguretat (`core-seguretat-audit`):** Cap clau d'autoritat filtrada, URL d'auth interceptada exclusivament per domini estrictament verificat de Supabase/Sóc de Poble, zero regex amb backtracking exponencial i zero spread JSONB cec.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Risc de Sandbox i Subcarpeta a Claude `v4.23118.1` (`ALT`):** Si Claude s'inicia des de la carpeta mare `Som de Poble`, en `v4.23118.1` no carrega `.claude/skills` ni `.claude/settings.json` de `socdepoble.org/`. *Mitigació:* Avís prioritari al Mestre perquè pulse `Reiniciar para actualizar` i seleccione `socdepoble.org` abans d'enganxar el prompt.
- **Risc d'Esgotament de Quota Setmanal (`MITJÀ`):** `Gemini 4 Carbon High` està al `53%` per a 3 dies (`~17,4%/dia`), Claude al `48%` i Codex al `40%`. *Mitigació:* Dosificació estricta Kit a Kit en clons nets, delegació de recerca massiva al Node 0 (`0 €`), prohibició d'activar `Fable 5.2` per defecte i seguiment amb `tracker_consum.mjs` en tancar cada Kit.
- **Risc de Contaminació d'R16a (`ALT`):** Els fitxers de `261110_1440_r16b_arbitratge_claude/` contenien simulacions rebutjades. *Mitigació:* Prohibit copiar fitxers crus d'aquella carpeta; tota implementació parteix neta d'`HEAD 0027b698d`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
