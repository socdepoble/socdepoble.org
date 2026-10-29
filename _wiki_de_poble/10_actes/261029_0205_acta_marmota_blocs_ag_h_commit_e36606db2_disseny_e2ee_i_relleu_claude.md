---
type: acta
status: canonic
description: 'Acta Marmota de la jornada 261028-261029: Blocs A-G i H completats, preview Firebase sense GPS, disseny E2EE de 14 fitxers, extracció multimodal d''Instagram i relleu de Claude al 99% amb carrils QA-H01..H04 preservats.'
tags:
  - acta
visibility: private
reflex: sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:bb204f76-c996-4d27-9ffa-b38b2f9396a4
---
# Acta Marmota: Blocs A-G i H (commits cd3b5b56c i e36606db2), Preview Firebase, Disseny E2EE P1-12 + IDEA-48 i Relleu Quirúrgic de Claude

> **Nota de la IAIA MarIA:** Aquesta Acta Marmota segella la jornada de treball 2026-10-28 / 2026-10-29 (13:45 h – 02:05 h) i deixa el punt de control exacte (Briefing de Relleu Sense Oblit) perquè, en reiniciar l'ordinador i obrir un xat nou amb la frase **«Sóc de poble»**, tant jo (IAIA MarIA) com el **nou compte de Claude Code**, **Gemini CLI** i **GPT Codex** reprenguem exactament en el segon i la línia on s'ha aturat el compte sortint de Claude al 99% de quota setmanal.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:bb204f76-c996-4d27-9ffa-b38b2f9396a4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T01:05:22.024Z |
| Modificació | 2026-10-29T01:06:00.000Z |
| Propietari | IAIA MarIA (Secretària Tècnica & Orquestradora) |
| Aprovació humana | Dictada i aprovada pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | IAIA MarIA + Claude Opus 4.7 (Max 20x) + Gemini CLI (Argon) + GPT-6.1 Codex (Sol Ultra) |
| Tokens consumits | ~4.950.000 tokens combinats a l'eixam (sessió multi-agent) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **2026-10-28T14:26Z – 20:02Z:** Planificació i execució dels **Blocs A–G** del pla `261028_1526_pla_implementacio_deute_tecnic_opengraph_edicio_i_xat.md`, culminant en el commit **`cd3b5b56c`** (223 fitxers de codi pujats a `fork/backup-notes-publish`).
- **2026-10-28T20:03Z – 2026-10-29T00:18Z:** Execució del **Bloc H** (`P1-66`, `P1-67`, `P1-68`, `P1-69`, `IDEA-40`, `IDEA-41`, `QA-01..04`, `M1`, `M2`, `C1`), culminant en el commit **`e36606db2`** (99 fitxers pujats a `fork/backup-notes-publish`), generació de `_builds_de_poble/wordpress/socdepoble.zip` (`3.244.627 B`, SHA-256 `8fb6792db33b91d79a7cffec613348e2a22cb847028706e4e4be7ef90bf29f34`) i redacció del disseny complet d'E2EE (`P1-12` + `IDEA-48`, 175 KB) a `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md`.
- **2026-10-29T00:18Z – 01:55Z:** Certificació NIST CSF 2.0 en Gauntlet Loop per **Gemini CLI** (`9,64 / 10` a `261028_1614_auditoria_gemini.md`) i **GPT Codex** (`7,22 / 10` a `261028_1611_auditoria_codex.md`, mitjana d'equip `8,43 / 10`); desplegament i verificació del canal de previsualització de Firebase (`https://soc-de-poble--bloc-h-e36606db2-ud17v8hn.web.app`, versió `66c751d46152b56e`); extracció multimodal autònoma de 2 Reels d'Instagram (`IDEA-50`, `IDEA-51`, `Lliçó 12`); i aturada preventiva del compte de Claude Code al **99% de quota setmanal** amb preservació física de tots els carrils a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/`.
- **2026-10-29T02:05Z:** Arxivament amb la Porta Olivera de les 62 captures transitòries de sessió cap a `90_arxiu_historic/` (deixant l'Escriptori `04_escriptori/` amb només 10 elements vius i `exit code 0`) i emissió d'aquesta Acta Marmota.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica (Graner Ple de Codis i Arquitectura)

#### 1.1 Commit `cd3b5b56c` · Blocs A–G (223 fitxers pujats a `fork/backup-notes-publish`)
- **Bloc A (`OG-7` i Política de Privacitat GPS):** Purga de metadades EXIF GPS en les 10 fotografies d'identitat pública (`javi-llinares-perfil-1200px.jpg/.webp` i avatars institucionals) i preservació deliberada del GPS en les 8 fotografies de patrimoni públic de La Torre de les Maçanes per al Mapa Fotogràfic (`P1-64`), amb interruptor de precisió (`Exacta` per defecte + píndoles `100 m` / `Poble`).
- **Bloc B (`P1-61` Fase 2 · Pre-render Social Estàtic):** Generador d'HTML estàtic per a 122 rutes públiques (incloent `/wikidepoble/<id>`) perquè WhatsApp i Telegram lligen `<meta property="og:image">` sense executar JavaScript.
- **Bloc C (`P1-60` i `P1-63` · Reforma Editorial Canònica):** 62/62 paràgrafs de `el_projecte.md` i textos institucionals polits sense retòrica inflada, amb les 4 empremtes legals aprovades.
- **Bloc D (`P1-55` P2, `P1-58`, `P1-57`):** Calaix de subcomunitats i fitxa viva amb protecció del logotip fix de l'entitat pilot.
- **Bloc E (`P1-31`..`P1-37`):** Una sola fila amb píndoles horitzontals i lupa col·lapsable (`P1-36`), versió canònica `v1.0.0` + data de build i panell d'empaquetats a la Consola (`P1-35`), i migració `2610281730` (`P1-13`, pendent d'aplicar a Supabase pel Mestre).
- **Bloc F (WordPress.org i Idiomes):** Ajustos de conformitat de l'enxufador i lliçó d'aïllament de Chrome headless a `sdp-workflow/SKILL.md` (`--user-data-dir`, `--disk-cache-dir`, `--use-mock-keychain`, `--password-store=basic` i `HOME` sota `mkdtemp`).
- **Bloc G (`P1-64` Mapa Fotogràfic EXIF amb Leaflet 1.9.4 i `P1-65` Radar d'I+D Emowe):** Mapa interactiu amb tesel·les d'OpenStreetMap sota demanda («Vore mapa») i secció d'I+D Emowe.

#### 1.2 Commit `e36606db2` · Bloc H (99 fitxers pujats a `fork/backup-notes-publish`)
- **`P1-66` (Barra Única del Compositor WhatsApp):** Eliminats els dos botons blaus gegants; compositor unificat amb botó `+` i popover d'adjunts («Afegeix» / «Arxiu» i «Càmera»), icona d'emoji integrada i micròfon verd (`--sdp-verd`), ocultant `+` i micròfon en mode convidat.
- **`P1-67` (Unificació Tipogràfica 16 px + Noto Sans SemiCondensed):** Escala tipogràfica unificada entre la barra lateral i la llista de converses del xat, amb barres al 87,5 %.
- **`P1-68` (`@username` Canònic i Poble amb Província/Comarca Automàtica):** Migració `supabase/migrations/2610282100_usuari_i_poble_canonic.sql` (`960` línies) + UI a `PerfilEditor.jsx` i `IdentitatAlPoble.jsx`.
- **`P1-69` (Instal·lar la PWA des de `/descarregues`):** Component `InstalaLaPwa.jsx` amb detecció nativa de `beforeinstallprompt`, guia visual en 2 passos per a iOS Safari (`Compartir` → `Afegir a la pantalla d'inici`) i detecció de WebViews interns.
- **`IDEA-40` (Token `--sdp-verd` i Semàfor de 3 Colors):** Verd canònic de marca unificat i semàfor de diagnòstic en 3 colors.
- **`IDEA-41` (Botó «Proposa Card» a l'Editor Universal TipTap):** Acció amb icona a `UniversalToolbar.jsx` en pantalla ampla i dins del menú «Aa» en compacte.

#### 1.3 Canal de Previsualització de Firebase (`bloc-h-e36606db2`) i Paquet WordPress.org (`socdepoble.zip`)
- **Firebase Preview desplegat i verificat:** `https://soc-de-poble--bloc-h-e36606db2-ud17v8hn.web.app` (versió `66c751d46152b56e`, caduca el `2026-11-05`). Les 10 fotos d'identitat no porten GPS, les 122 rutes prerenderitzades responen `200`, `0` errors de consola en `8.787` peticions i cap clau secreta (`service_role`) al `dist/`. Producció (`live`, versió `7b5999aa`) es manté intacta fins a l'ordre del Mestre.
- **WordPress.org Plugin Check operatiu:** Pujat el paquet a `https://wordpress.org/plugins/developers/add/` amb slug assignat `socdepoble`. Es va comprovar que el botó **«Check with Plugin Check»** (WordPress Playground) obri perfectament el comprovador seleccionant `Sóc de Poble, Portal de Pobles Connectats` quan es puja amb el nom canònic `socdepoble.zip`.

#### 1.4 Disseny Complet de `P1-12` (Xat E2EE) + `IDEA-48` (Recuperació Social en Cercle Obert)
- **Especificació de 14 fitxers (`175 KB`):** Desada a `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` i `decisions_mestre_p112.md`, amb totes les decisions del Mestre tancades (abast `F5` incloent xats privats d'entitat/organització i grups privats; frase de pas de 6 paraules en valencià de 2.048 termes; recuperació social Shamir `GF(256)` amb `N` lliure i llindar fix `k = 3` en xat viu sense esperes temporals).

#### 1.5 Extracció Multimodal Autònoma d'Instagram (`Lliçó 12` · `IDEA-50` i `IDEA-51`)
- Consagrada la **Lliçó 12** a `_wiki_de_poble/02_saber/memoria_aprenentatges.md` i registrades **`IDEA-50`** (7 repositoris d'agents i seguretat de `@bencorde`: `browser-use`, `agentmemory`, `claude-scientific-skills`, `Anthropic-Cybersecurity-Skills`, `OpenViking`, `awesome-harness-engineering`, `diagram-design`) i **`IDEA-51`** (4 eines de disseny UI/UX i QA de `@miguebaenaia`: `npxskillui`, `impeccable`, `ui-ux-pro-max-skill`, `Playwright CLI`) a `03_llibre_mestre_tasques_i_idees.md`.

---

### 2. Part Termodinàmica i Higiene de l'Escriptori (`04_escriptori/`)

- **Aturada preventiva al 99% de quota setmanal:** Vam detectar a temps que el compte de Claude Max (20x) arribava al 99% del límit setmanal i al 85% de la finestra d'1M de context, ordenant un stop net que ha deixat l'arbre sa i el bloc de relleu escrit a `261028_2020_auditoria_claude.md` (línies 345–354).
- **Salvaguarda física dels scratchpads de `/private/tmp`:** Com que el Mestre reiniciarà el Mac (i macOS neteja `/private/tmp` en reiniciar!), hem copiat preventivament tots els carrils i scripts dels dos scratchpads de Claude (`/private/tmp/claude-501/...`) cap al nostre laboratori persistent al disc dur:
  - `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/` (`lane_qah01_perfil`, `lane_qah02_migracio`, `lane_qah04_og/governanca`)
  - `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_21a81070/` (`eines`, `integracio`, `wp_build`)
- **Neteja total de l'Escriptori amb la Porta Olivera i Convocatòria de la Reunió de l'Olivera (`261029_0216`):**
  1. S'han arxivat les **62 captures transitòries de seguiment (`_produccio_`)** i els **9 documents consumits de l'onada anterior (`261028_1526` i `261027_0730`)** cap a `_wiki_de_poble/90_arxiu_historic/` amb `porta-olivera.mjs --arxiva`.
  2. S'ha actualitzat `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` marcant les fites assolides als commits `cd3b5b56c` i `e36606db2` (`[FET]`) i col·locant al capdamunt la secció **`## 🎯 Prioritat 1 Actual · Deute Tècnic cap al 10/10 i Relleu del Compte de Claude (Onada 261029_0216)`**.
  3. S'han creat i validat al mateix Escriptori (`_wiki_de_poble/04_escriptori/`) els dos documents bessons de la nova onada:
     - **Pla d'Implementació:** `_wiki_de_poble/04_escriptori/261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md` (`valid: true`, vinculat al torn `torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1`).
     - **Prompt per a Claude Code, Gemini CLI i GPT Codex:** `_wiki_de_poble/04_escriptori/261029_0216_prompt_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md` (`valid: true`).
  4. L'Escriptori (`04_escriptori/`) queda amb **només els 3 documents actius** (`03_llibre_mestre_tasques_i_idees.md`, `261029_0216_pla_implementacio_*` i `261029_0216_prompt_*` + `00_index_escriptori.md`) i `node tooling/gates/porta-olivera.mjs` ix amb **`exit code 0`**.

---

<!-- SDP:SECTION acta.s5 -->
## Pendents

### Briefing i Full de Ruta Immediat en Obrir el Nou Xat («Sóc de poble»)

Quan el Mestre reinicie el Mac, canvie al **nou compte de Claude Code** i òbriga el nou xat amb mi escrivint **«Sóc de poble»**, aquest és l'estat exacte del disc i els pasos immediats:

#### 1. Estat Exacte a l'Arbre Viu i al Laboratori Persistent (Res no es perd en reiniciar el Mac)
- **Torn de codi actiu de Claude Code:** `torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4` (vinculat al pla `_wiki_de_poble/04_escriptori/261028_1526_pla_implementacio_deute_tecnic_opengraph_edicio_i_xat.md`, SHA-256 `0e89ef82238fed78f58dcfe30c9257b4e086615d1279787a3cd303a9ac638d5d`).
- **Torn documental de la IAIA MarIA:** `torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1`.
- **Canvis ja escrits a l'arbre viu (`git status`):**
  1. **`QA-H01`:** `src/sections/profile/PerfilContext.jsx`, `src/sections/profile/PerfilContext.test.jsx` i `src/sections/profile/PerfilContext.usuariTardana.test.jsx` (reconciliació d'`username` i `username_confirmat_at` en memòria quan `full_name` regenera l'`@username`; carril complet guardat a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah01_perfil/`).
  2. **`QA-H02`:** `supabase/migrations/2610282100_usuari_i_poble_canonic.sql` i `src/data/supabase/usuariIPoble.migracio.test.js` (desambiguació de província i comarca per `town_uuid`; carril complet a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah02_migracio/`).
  3. **`QA-H04` (llest per aplicar amb l'executor):** Els 8 fitxers (`package.json`, `tooling/tests/node-suite-manifest.json` i els scripts/tests de `tooling/seo/`) estan guardats de forma persistent a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah04_og/governanca/` i la recepta de l'executor a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_21a81070/eines/governanca_qa01.mjs`.
  4. **`QA-E07` i `QA-S01..S06` (disseny `P1-12`):** `QA-S06` ja aplicat a `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md`; falta afegir la secció `§21` i verificar.
  5. **Fase 1 de `P1-12` (al disc, sense consumidors):** Ja estan creats `src/data/xifratXatCripto.js`, `src/data/xifratXatCripto.seguretat.test.js`, `src/data/xifratXatCripto.vectors.json`, `src/data/xifratXatFormats.js`, `src/data/xifratXatFormats.seguretat.test.js`, `src/data/xifratXatFormats.vectors.json`, `src/data/xifratXatMagatzem.js`, `src/data/xifratXatMagatzem.seguretat.test.js` i `tests/helpers/idbFalsEstructurat.js`.

#### 2. Documents Rectors Preparats a l'Escriptori (`_wiki_de_poble/04_escriptori/`) per a la Reunió de l'Olivera
- **Llibre Mestre Permanent:** `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`
- **Pla d'Implementació (`261029_0216`):** `_wiki_de_poble/04_escriptori/261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md`
- **Prompt Local per a Claude, Gemini i Codex (`261029_0216`):** `_wiki_de_poble/04_escriptori/261029_0216_prompt_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md`

Ordre ràpida per llançar a **Claude Code (compte nou)**, **Gemini CLI** i **GPT Codex** en obrir la nova sessió:

```markdown
Sóc de poble. Llig i executa el prompt de la Reunió de l'Olivera a `_wiki_de_poble/04_escriptori/261029_0216_prompt_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md` juntament amb el seu Pla d'Implementació `_wiki_de_poble/04_escriptori/261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md` i el Llibre Mestre `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
```

#### 3. Enllaços Directes per al Mestre en Reiniciar
- **Pujada i comprovació de `socdepoble.zip` a WordPress.org (amb el botó «Check with Plugin Check»):** `https://wordpress.org/plugins/developers/add/`
- **Canal de Previsualització de Firebase (`bloc-h-e36606db2`):** `https://soc-de-poble--bloc-h-e36606db2-ud17v8hn.web.app`

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261028_1310_acta_marmota_triomf_marato_25h_opengraph_botigues_i_revisio_wp]]
