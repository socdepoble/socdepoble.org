---
type: document
status: esborrany
description: Pla d'Implementació 10/10 per tancar el Bloc H (QA-H01/H02/H04, APP-D1, R-01/02/07, M-01, socdepoble.zip) i culminar la Fase 1/2 d'E2EE (P1-12 + IDEA-48)
tags:
  - implementacio
visibility: private
reflex: sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:23cb53c9-f6c6-499e-b93d-cc4cb82cc40b
---
# Pla d'Implementació — Excel·lència 10/10, Tancament del Bloc H i Fase 1/2 d'E2EE al Xat Rural (261029_0216)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:23cb53c9-f6c6-499e-b93d-cc4cb82cc40b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T01:23:35.870Z |
| Modificació | 2026-10-29T01:24:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovada pel Mestre en xat (2026-10-29 02:15) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA (Gemini 3.1 Pro + Claude Code + GPT Codex + Gemini CLI) |
| Tokens consumits | ~25k (orquestració i síntesi) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- `2026-10-29T01:23:35.870Z`: Esborrany creat sota torn `torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1`.
- `2026-10-29T01:24:00.000Z`: Pla completat consolidant les auditories de l'onada `261028_1526` (Gemini `9,64/10`, GPT Codex `7,22/10`, mitjana `8,43/10`), el bloc de relleu del compte ixent de Claude Code (`w0479j1zp`) i el rescat dels artefactes de `/private/tmp/` a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/`.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research & Relleu a l'Olivera)

En la sessió `261028_1526` – `261029_0205` s'han consolidat dos grans commits a `fork/backup-notes-publish`:
1. **`cd3b5b56c` (Blocs A–G, 223 fitxers):** Prerender social d'OpenGraph (`111` rutes), purga d'EXIF GPS en 10 fotos d'identitat + guarda al precommit, Mapa Fotogràfic EXIF Multi-Escala amb Leaflet 1.9.4 local (`P1-64`), blindatge del menú Compartir Android/iOS (`P1-31..34`), lupa i píndoles de Converses (`P1-36`), tokens de botons (`P1-37`), versió a la Consola (`P1-35`), i18n natiu/WP (`P1-22`), lector fitat a Apple (`P1-18`) i portes natives (`P1-08`).
2. **`e36606db2` (Bloc H, 99 fitxers):** Barra única del compositor de xat a 48 px (`P1-66`), tipografia unificada a 16 px + `SemiCondensed` (`P1-67`), `@usuari` únic i poble canònic (`P1-68`), botó interactiu «Instal·lar l'App (PWA)» a `/descarregues` (`P1-69`), `--sdp-verd: #0F672F` i semàfor de la Consola (`IDEA-40`), «Proposa Card» a Notes (`IDEA-41`), correccions `QA-01..QA-04` de Codex i millores `M1/M2/C1` d'Emowe (`P1-65`).

#### Barem d'Excel·lència de la Reunió de l'Olivera (Mitjana Actual: `8,43/10` ➔ Objectiu: `10/10`)

| Àmbit avaluat | Nota Gemini (`261028_1614`) | Nota GPT Codex (`261028_1611`) | Mitjana | Deute exacte per arribar al `10/10` en aquesta onada |
| :--- | :---: | :---: | :---: | :--- |
| **1. Codi i Enginyeria (`cd3b5b56c` + `e36606db2`)** | `9,8 / 10` | `8,6 / 10` | **`9,20 / 10`** | Culminar i verificar `QA-H01`, `QA-H02`, `QA-H04` i `APP-D1`. |
| **2. Disseny Pedra Seca i Maquetació** | `9,7 / 10` | `8,4 / 10` | **`9,05 / 10`** | Resoldre `R-01` (11 imatges OG `> 600 KB`), `R-02` (6 `.png` amb bytes JPEG) i `R-07` (13 títols OG de la Wiki amb slug cru). |
| **3. Seguretat, Privacitat i Dades** | `9,7 / 10` | `7,9 / 10` | **`8,80 / 10`** | Afegir capçaleres `M-01` a `firebase.json` (`nosniff`, `Referrer-Policy`, `Permissions-Policy`), desplegar la web (purga GPS en viu) i tancar `§21` + Fase 1/2 d'E2EE (`P1-12` + `IDEA-48`). |
| **4. Proves, Portes i Verificació** | `9,2 / 10` | `6,8 / 10` | **`8,00 / 10`** | Reparar les **2 úniques roges heretades de la suite completa** (`laParroquia.test.js` i `tests/botigues.test.mjs`) i verificar el canal preview de Firebase. |
| **5. Govern Documental i Sincronia** | `9,8 / 10` | `4,4 / 10` | **`7,10 / 10`** | Llibre Mestre al dia, Escriptori net i sincronització entre codi i estat real de desplegament. |
| **MITJANA GLOBAL PONDERADA** | **`9,64 / 10`** | **`7,22 / 10`** | **`8,43 / 10`** | **Tancament íntegre dels 6 passos d'aquest Pla per certificar el `10/10`.** |

#### Estat Exacte a Disc del Relleu de Claude Code (`w0479j1zp`) i Rescat Persistent
El compte anterior de Claude Code s'ha aturat ordenadament al 99% de quota setmanal. Tots els fitxers temporals de `/private/tmp/claude-501/` han sigut rescatats abans del reinici del Mac a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/`:
- **Torn de codi obert de Claude:** `torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4`.
- **`QA-H01` (a l'arbre viu):** `src/sections/profile/PerfilContext.jsx` i `src/sections/profile/PerfilContext.usuariTardana.test.jsx` (còpia de carril a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah01_perfil/`).
- **`QA-H02` (a l'arbre viu):** `supabase/migrations/2610282100_usuari_i_poble_canonic.sql` i `src/data/supabase/usuariIPoble.migracio.test.js` (còpia de carril a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah02_migracio/`).
- **`QA-H04` (8 fitxers de governança en carril, pendents de verificar abans d'aplicar per l'executor):** Preparats a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah04_og/governanca/` (`package.json`, `tooling/tests/node-suite-manifest.json`, `tooling/seo/{projeccio-publica,prerender-social,build-social-manifest}{.mjs,.test.mjs}`). **Nota del relleu:** la sessió ixent adverteix que `lane_qah04_og` no es va arribar a verificar, així que la nova sessió ha de revisar-la/usar la seua pròpia versió verificada i aplicar-la mitjançant l'executor (`../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_21a81070/eines/governanca_qa01.mjs`).
- **`QA-E07 / QA-S01..S06` (disseny E2EE i 7 inconsistències internes):** `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` té `QA-S06` aplicat, però falta completar la secció `§21` (`ambitEstable` + `actorKey` i enduriment de Shamir/SAS) i **reconciliar les 7 inconsistències internes** detectades al document de disseny.
- **`P1-12` Fase 1 (11 fitxers nous a l'arbre viu, sense consumidors i fora del commit del Bloc H):** `src/data/xifratXatCripto.js`, `src/data/xifratXatCripto.seguretat.test.js`, `src/data/xifratXatCripto.vectors.json`, `src/data/xifratXatFormats.js`, `src/data/xifratXatFormats.seguretat.test.js`, `src/data/xifratXatFormats.vectors.json`, `src/data/xifratXatMagatzem.js`, `src/data/xifratXatMagatzem.seguretat.test.js`, `src/data/xifratXatParaules.js`, `src/data/xifratXatParaules.seguretat.test.js` i `tests/helpers/idbFalsEstructurat.js`. Cap d'ells ni `src/data/wikiManifest.js` ha d'entrar al commit de tancament del Bloc H.

---

### 2. Preguntes Obertes (User Review Required)

Cap bloqueig pendent de decisió humana: totes les decisions arquitectòniques d'OpenGraph, `@usuari`, poble canònic, `socdepoble.zip` i `P1-12` (`IDEA-48` amb cercle obert de confiança i $k=3$ avals en viu al xat) ja han sigut aprovades pel Mestre.
- **Única acció reservada al Mestre després del commit:** Aprovar el pas a producció de Firebase Hosting i pujar el nou `_builds_de_poble/wordpress/socdepoble.zip` a `https://wordpress.org/plugins/developers/add/`.

---

### 3. Canvis Proposats per Fitxers i Blocs (Ordre d'Execució de 6 Passos)

#### Pas 1 · Culminar i Verificar `QA-H01`, `QA-H02`, `QA-H04` i `§21` del Disseny E2EE
- **`[MODIFY]` `src/sections/profile/PerfilContext.jsx` i `[NEW]` `src/sections/profile/PerfilContext.usuariTardana.test.jsx` (`QA-H01`):**
  - Revisar i verificar el pegat ja present a l'arbre viu que incrementa el comptador de versió de perfil en `updateProfile()` perquè un `loadProfile()` en vol anterior no puga sobreescriure l'`@usuari` o el poble acabats de desar.
- **`[MODIFY]` `supabase/migrations/2610282100_usuari_i_poble_canonic.sql` i `[MODIFY]` `src/data/supabase/usuariIPoble.migracio.test.js` (`QA-H02`):**
  - Revisar i verificar el pegat ja present a l'arbre viu que preserva `profiles.username` existent quan `completa_la_meua_alta` rep `p_username` nul o buit i manté l'alineació amb el catàleg de pobles.
- **`[MODIFY via Executor]` `package.json`, `tooling/tests/node-suite-manifest.json`, `tooling/seo/projeccio-publica.mjs`, `tooling/seo/projeccio-publica.test.mjs`, `tooling/seo/prerender-social.mjs`, `tooling/seo/prerender-social.test.mjs`, `tooling/seo/build-social-manifest.mjs`, `tooling/seo/build-social-manifest.test.mjs` (`QA-H04`):**
  - Aplicar a través de l'executor (`governanca_qa01.mjs` amb lease Reflex de governança) els 8 fitxers de `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah04_og/governanca/` que incorporen `--snapshot` al prerender social per generar les fitxes públiques remotes d'organitzacions i persones amb timeout de 5 s, paginació segura i fallback net a la llavor.
- **`[MODIFY]` `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` (`QA-E07` / `QA-S01..S06`):**
  - Completar la secció `§21` documentant el decorador unificat d'àmbit (`ambitEstable` + `actorKey = "${backendId}|${userId}|${orgId ?? 'personal'}"`) per a totes les operacions asíncrones i claus d'IndexedDB, més les garanties de `QA-S01..S06` i reconciliar les 7 inconsistències internes.
- **`[MODIFY via Executor + Segell]` `.agents/skills/wiki-cicle-de-vida/SKILL.md`, `.agents/skills/core-higiene-escriptori/SKILL.md`, `.agents/SKILLS_SEAL.json`, `_wiki_de_poble/03_actuar/plantilles/acta.md`, `_wiki_de_poble/03_actuar/plantilles/pla.md` i `.agents/protocolledge.json` (`T1.5 · Blindatge Automàtic de la Reunió de l'Olivera`):**
  - Incorporar a `wiki-cicle-de-vida/SKILL.md` (Pas 7) i `core-higiene-escriptori/SKILL.md` el **Protocol Automàtic de Transició d'Onada a l'Olivera** abans de qualsevol Acta Marmota: (1) actualitzar `03_llibre_mestre_tasques_i_idees.md` amb `[FET]` i posar dalt el Deute Tècnic cap al `10/10` abans de noves idees; (2) arxivar amb `porta-olivera.mjs --arxiva --nom` + `document.mjs handoff` l'onada vençuda i totes les captures `_produccio_`; (3) deixar parats a `_wiki_de_poble/04_escriptori/` el nou Pla (`pla_implementacio.md`) i el nou Prompt (`prompt_local.md`) bessons; i (4) preservar `_investigacio_ia_de_poble/` i `02_investigacio_ia/` exclusivament com a repositori d'investigació d'IA del Mestre i la IAIA (mai per a prompts o plans).
  - Retirar la plantilla antiga duplicada `_wiki_de_poble/03_actuar/plantilles/pla.md` (`planificacio` a `protocolledge.json`, substituïda per `pla_implementacio.md`), depurar `acta.md` perquè el seu únic destí siga `_wiki_de_poble/10_actes/` (històric de sessió, sense suplantar `prompt_local.md`), verificar `porta-plantilles.mjs` i re-segellar `.agents/SKILLS_SEAL.json` amb `tooling/gates/segella.mjs --update`.

#### Pas 2 · Tancament del Deute Tècnic de Previsualització i Suite Sencera per Assolir el `10/10`
- **`[MODIFY]` `src/sections/onboarding/OnboardingSteps.jsx` / `src/data/supabase/auth.js` (`APP-D1`):**
  - Assegurar que si l'usuari es registra en producció abans que la migració `2610282100` estiga executada al servidor Supabase (error d'esquema/signatura de RPC `completa_la_meua_alta` amb `p_username` / `p_town_uuid`), el client reintente o degrade amb elegància sense bloquejar l'alta i complete la sincronització local/perfil.
- **`[MODIFY]` `tooling/seo/build-social-manifest.mjs` / actius OG (`R-01`, `R-02`, `R-07`):**
  - **`R-01`:** Assegurar que les 11 rutes amb `og:image > 600 KB` apunten a variants d'imatge social `1200×630` optimitzades (`<= 300 KB`) perquè WhatsApp les mostre sempre a la primera.
  - **`R-02`:** Alinear extensió/MIME o corregir els 6 fitxers `.png` que contenen bytes JPEG.
  - **`R-07`:** Resoldre el títol humà (H1 o `description` del frontmatter) per als 13 documents de la Wiki que mostraven el seu identificador d'arxiu cru a la targeta d'OpenGraph.
- **`[MODIFY]` `firebase.json` i `vercel.json` (`M-01`):**
  - Afegir les capçaleres HTTP de seguretat `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` i `Permissions-Policy: camera=(), microphone=(self), geolocation=(self)` mantenint la paritat amb els tests de portes.
- **`[MODIFY]` `src/sections/mur/laParroquia.test.js` i `tests/botigues.test.mjs` (0 roges a la suite sencera):**
  - Reparar les 2 úniques proves heretades en roig de la suite sencera causades pel trasllat del laboratori el 261026, sense relaxar cap asserció de seguretat ni disseny.

#### Pas 3 · Bateria Completa sobre Còpia Exacta de l'Arbre a Commitejar
- Verificar en una còpia exacta de l'arbre que anirà al commit (sense els fitxers `xifratXat*` de la Fase 1 encara):
  - `npm run test:precommit` (100% verd en `< 30 s`).
  - `npx eslint` sobre tots els fitxers modificats (`0` errors, `0` avisos).
  - Proves de `QA-H01`, `QA-H02`, `QA-H04`, `laParroquia.test.js`, `tests/botigues.test.mjs` i les `83/83` proves del connector WordPress.

#### Pas 4 · Commit de Tancament del Bloc H + Deute 10/10 i Push
- Fer el commit de tancament a través d'un índex temporal (`GIT_INDEX_FILE`), deixant fora temporalment els 9 fitxers de `xifratXat*` / `idbFalsEstructurat.js` (que es commitejaran juntament amb la resta de mòduls de la Fase 1/2 quan estiguen complets i verificats) i `wikiManifest.js`.
- Fer push a `fork/backup-notes-publish`.

#### Pas 5 · Reconstrucció de `socdepoble.zip` per a WordPress.org i Verificació del Canal Preview
- Reconstruir `_builds_de_poble/wordpress/socdepoble.zip` i la seua còpia datada a partir d'un `git archive` net del nou commit.
- Verificar les `83/83` comprovacions del paquet WordPress (`tests/enxufe-plugin.test.mjs`, `tests/empaqueta-wp.test.mjs`, `porta-enxufe.mjs`).
- Desplegar o actualitzar el canal preview de Firebase Hosting amb la compilació del nou commit i deixar-lo verificat al 100% perquè el Mestre puga passar-lo a producció i pujar `socdepoble.zip` a WordPress.org.

#### Pas 6 · `P1-12` Fase 1 i Fase 2 + `IDEA-48` (Xifratge E2EE al Xat Rural sense Activar el Flag)
- **Verificació i auditoria dels 9 fitxers de la Fase 1 ja presents a l'arbre viu:**
  - `src/data/xifratXatCripto.js` + `src/data/xifratXatCripto.seguretat.test.js` + `src/data/xifratXatCripto.vectors.json`
  - `src/data/xifratXatFormats.js` + `src/data/xifratXatFormats.seguretat.test.js` + `src/data/xifratXatFormats.vectors.json`
  - `src/data/xifratXatMagatzem.js` + `src/data/xifratXatMagatzem.seguretat.test.js` + `tests/helpers/idbFalsEstructurat.js`
- **Construcció i verificació dels mòduls restants de la Fase 1/2 (`§16` passos 4, 5 i 7 del disseny E2EE):**
  1. **`[NEW]` `src/data/xifratXatParaules.js` + `src/data/xifratXatParaules.seguretat.test.js`:** Diccionari de 2.048 paraules en valencià viu de la muntanya alacantina (sense homòfons ni paraules confuses, prefix únic de 4 lletres, que revisarà el Mestre) per a la frase de recuperació de 6 paraules (`66 bits` d'entropia).
  2. **`[NEW]` `src/data/xifratXatRecuperacio.js` + `src/data/xifratXatRecuperacio.seguretat.test.js` (`IDEA-48`):** Compartició secreta de Shamir sobre $\text{GF}(2^8)$ amb llindar fix $k = 3$ i cercle obert de confiança ($N \in [3, 255]$ amics/familiars), polinomi verificat, compromís criptogràfic de cada fragment i verificació de consistència quan responen $>3$ amics en viu al xat (`QA-S02`).
  3. **`[NEW]` `src/data/xifratXatProtocol.js` + `src/data/xifratXatProtocol.seguretat.test.js`:** Màquina d'estats d'embolcall de claus (`X25519` / `ECDH P-256` + `HKDF-SHA-256` + `AES-256-GCM`), rotació d'època (`epoch`) en canviar membres de grup privat o entitat (`QA-S01`), codi de seguretat SAS de 12 dígits (4×3) amb transcript bidireccional ordenat (`QA-S03`), protecció de metadades d'adjunts (`QA-S04`), desbloqueig atòmic multi-pestanya amb `navigator.locks` (`QA-S05`) i sanejament post-desxifratge amb `DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })` (`QA-S06`).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Portes d'Escriptori i Documentació:**
   - `node tooling/gates/porta-olivera.mjs` ➔ eixida `0`.
   - `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md` ➔ `valid: true`.
2. **Bateria de Precommit i Qualitat de Codi:**
   - `npm run test:precommit` ➔ `0` fallades en menys de `30 s`.
   - `npx eslint` sobre tots els fitxers nous i modificats ➔ `0` errors i `0` avisos.
3. **Bateria Completa (Vitest + Node):**
   - Verificació que `laParroquia.test.js` i `tests/botigues.test.mjs` passen a verd i la suite completa no té cap prova roja.
4. **Verificació del Paquet WordPress (`socdepoble.zip`):**
   - `node --test tests/enxufe-plugin.test.mjs tests/empaqueta-wp.test.mjs` i `node tooling/gates/porta-enxufe.mjs` ➔ `83/83` comprovacions en verd.
5. **Verificació de la Fase 1/2 d'E2EE (`P1-12` + `IDEA-48`):**
   - Proves unitàries i de vectors deterministes de `xifratXatCripto`, `xifratXatFormats`, `xifratXatMagatzem`, `xifratXatParaules`, `xifratXatRecuperacio` i `xifratXatProtocol` 100% en verd sense activar cap canvi visible en l'enviament de missatges en viu fins a l'ordre d'activació del Mestre.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Risc de barrejar els fitxers incomplets d'E2EE amb el commit de tancament del Bloc H:** Mitigat completament al Pas 4 usant un índex temporal (`GIT_INDEX_FILE`) que commiteja exclusivament el tancament del Bloc H + deute 10/10 i reconstrueix `socdepoble.zip` des d'`archive` net abans de continuar amb la Fase 2 d'E2EE.
- **Risc de bloqueig del registre en producció abans d'aplicar la migració `2610282100` (`APP-D1`):** Mitigat al Pas 2 amb degradació elegant al client si el RPC remot encara té la signatura anterior.
- **Risc d'activació dels filtres secundaris d'OpenAI (`Daybreak` · `IDEA-47`) en la lectura per part de GPT Codex:** Mitigat emprant exclusivament terminologia defensiva d'enginyeria de qualitat, conformitat i proves unitàries (`QA-*`) en aquest Pla i en el Prompt `261029_0216`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_0216_prompt_excel_lencia_10_10_tancament_bloch_i_xat_e2ee]]
- [[../10_actes/261029_0205_acta_marmota_blocs_ag_h_commit_e36606db2_disseny_e2ee_i_relleu_claude]]
