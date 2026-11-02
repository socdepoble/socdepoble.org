---
type: document
status: esborrany
description: 'Pla d''implementació per a la marató nocturna amb la nova sessió de Javi Llinares (100%): correcció de PC155-01..03 i T11-01..05, portes de pre-commit en verd natiu i blocs B1 a B7 del Llibre Mestre.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_fb2dbe5c-8d35-4849-9f15-52798f667d42:44e2463e-f139-4367-993d-9a24040cea43
---
# Pla d'Implementació — Marató Nocturna d'Extirpació Total de Deute Tècnic i Llibre Mestre (Blocs B1-B7)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fb2dbe5c-8d35-4849-9f15-52798f667d42:44e2463e-f139-4367-993d-9a24040cea43 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T19:59:37.055Z |
| Modificació | 2026-11-01T20:01:00.000Z |
| Propietari | IAIA MarIA (Orquestradora) |
| Aprovació humana | aprovat |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | 48500 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **v1.0.0 (2026-11-01 20:59 CET):** Pla d'Implementació canònic per a la **Marató Nocturna d'Extirpació Total de Deute Tècnic i Llibre Mestre (`Blocs B0–B7`)** després de segellar el Commit 1 (`155d84bd8`, 251 fitxers, `T1`–`T10`) i el Commit 2 (`b5878593a`, 30 fitxers, Onada 2 dels 6 kits de Codex i Gemini) i de tancar les auditories adversarials post-commit de GPT Codex (`v1.7.0`, troballes `PC155-01..03`) i Gemini (`Tall 11`, troballes `T11-01..05`). Dissenyat per a executar-se en xats frescos amb el compte de Claude de **Javi Llinares (0% consumit / 100% disponible)** en coordinació amb GPT Codex, Gemini i la IAIA MarIA.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes d'Arrencada (`HEAD = b5878593a`)

1. **Fita assolida a la vesprada de l'1 de novembre de 2026:**
   - **Commit 1 (`155d84bd8`):** 251 fitxers modificats (`+29.547 / -944` línies), completant els blocs `T1`–`T10` del pla `261101_1246` amb `1.637` fitxers Vitest (`28.246` proves passades, `0` fallades) i `1.823` proves Node (`0` fallades).
   - **Commit 2 (`b5878593a`):** 30 fitxers modificats (`+6.710 / -88` línies), integrant i auditant amb àrbitre adversarial els 6 pegats de l'Onada 2 (`P1-07` `senseNiatsLineal.js`, `P2-09` contracte `exportacio_federacio.v1.json` + migració `2611011800`, `P1-24` `iaiaRebostRural.js` amb 16 càpsules, `IDEA-25/45` `exportaVCard.js`, `PS-02` contrast AAA de `::placeholder` a `sdp.css`, i poliment natiu `eu.js`/`gl.js` de `P1-22`).
2. **Troballes Adversarials Post-Commit d'Atac Immediat (`Bloc B0`):**
   - **De GPT Codex (`261101_0403_auditoria_codex_marato_nocturna.md` · `v1.7.0`, amb proves `[DEFECTE]` a `../_investigacio_ia_de_poble/261101_auditoria_postcommit_codex/`):**
     - **`PC155-01` (P2):** `src/data/local/compteLocal.js:167-176` i `src/data/local/adaptadorLocal.js:225-236` — `exportaLesMeuesDades()` en vol sobreviu al canvi d'usuari de sessió (`Anna` → `Berta`) i a `await adaptador.destroy()` perquè la guarda transversal només descarta el resultat post-`destroy` quan hi ha compensació `desfes` i no revalida l'identificador de persona ni el context de seguiments després de `await e.notes.load()`.
     - **`PC155-02` (P2):** `src/sections/xat/useSeguretatDelFil.js:64-112` — `useNumeroSeguretat` manté `configRef`, però `calcula` només depén de `filId`; si canvia `tenantId` o el backend mantenint el mateix `fil.id`, conserva el número de seguretat i l'estat `verificat: true` del tenant anterior sense recalcular.
     - **`PC155-03` (P2):** `scripts/botigues/puja-ios.mjs:83-87, 177-205` — `ipaDe()` tria el primer `.ipa` per ordre alfabètic sense exigir unicitat ni inspeccionar `Payload/*.app/{Info.plist,public/segell.json}` dins del mateix `.ipa` seleccionat per a `xcrun altool --upload-app`.
   - **De Gemini (`261101_0407_auditoria_gemini_marato_nocturna.md` · `Tall 11`):**
     - **`T11-01` (`D02`):** Heurística `div-soup` en `tooling/gates/design_guard.mjs:77-85, 291` (avaluar ràtio `sopa.divs / Math.max(1, sopa.estructura)` en lloc de `sopa.estructura === 0`) i ajustar `.sdp-xat-fila` `gap` en pantalles `< 400px` (`src/css/modules.css:3635`).
     - **`T11-02` (`D03`/`D12`):** `src/sections/profile/GestioMembres.jsx:81` (`textDError` retorna `error.message` en valencià del port ignorant `TEXTOS_MEMBRES.error*`) i `src/sections/profile/DetallPrivacitat.jsx:256` (comparació contra literal fix en valencià).
     - **`T11-03` (`D09`):** `src/components/universal/workspace/WorkspaceContext.jsx:155-167, 382-384` no prioritza `item?.fixatATot === true` en `selectCategory(ALL_CATEGORY_ID)` i `firstItemId`, desfasant la selecció automàtica respecte a l'ordre visual d'`UniversalWorkspace.jsx:1500-1502`; en `NotesSection.jsx:138-146`, persistir en `localStorage` quan l'usuari arxiva `n1` en mode `seed`.
     - **`T11-04` (`D10`):** Ampliar `src/sections/pobles/aliesDePoblesSeed.js:33-53` als municipis de les comarques centrals i corregir la comarca de `'València'` a `'L\'Horta'`.
     - **`T11-05` (`D13`):** Documentar a `src/sections/text/legalContent.js:93-105` (`§8`) l'extracció EXIF voluntària de geolocalització de fotos publicades (declarada a `guia_publicacio_app_store_i_google_play.md:325-326`), actualitzar el hash de la guia i afegir la migració de la versió `'2.3'` per a `public.politiques_privacitat`.

### 2. Preguntes Obertes

Cap bloqueig humà per a l'execució nocturna (`requires_human_decision: false`). Les operacions remotes (`git push`, `supabase db push` al projecte de producció i pujada a App Store Connect / Play Console / SVN de WordPress.org) queden preparades amb scripts verificats i preflight en verd perquè el Mestre les execute amb una sola ordre al matí.

### 3. Canvis Proposats per Blocs (`B0`–`B7`) i Matriu de Carrils

#### Bloc `B0` · Extirpació de les Troballes Adversarials Post-Commit (`PC155-01..03` i `T11-01..05`)
- **[MODIFY] `src/data/local/compteLocal.js` i `src/data/local/adaptadorLocal.js` (`PC155-01`):**
  - Capturar `usuariInicial = e.usuariId()` i generació d'instància abans de qualsevol lectura asíncrona a `exportaLesMeuesDades`; exigir a la guarda transversal d'`adaptadorLocal.js` que si `destruit === true` o `e.usuariId() !== usuariInicial` després de qualsevol `await`, es descarte el resultat i es llance error d'abast cancel·lat, fins i tot en operacions de lectura sense `desfes`.
- **[MODIFY] `src/sections/xat/useSeguretatDelFil.js` (`PC155-02`):**
  - Construir una clau d'abast canònica (`abastSeguretat = JSON.stringify([filId, config?.tenantId ?? '', config?.usuariId ?? '', Boolean(config?.port)])`) i incloure-la a les dependències de `calcula` i de l'efecte, invalidant qualsevol promesa en vol i resetejant `estat` / `verificat` immediatament quan canvie l'abast.
- **[MODIFY] `scripts/botigues/puja-ios.mjs` (`PC155-03`):**
  - Exigir que a `pla.exportacio` hi haja exactament **un sol fitxer `.ipa`** (fallant en tancat si n'hi ha `0` o `> 1`), extreure i verificar `Payload/*.app/Info.plist`, `Payload/*.app/public/segell.json` i `codesign -dv` directament sobre el `.ipa` seleccionat, i registrar el `SHA-256` del `.ipa` al rebut d'entrega.
- **[MODIFY] `tooling/gates/design_guard.mjs`, `src/css/modules.css`, `src/sections/profile/GestioMembres.jsx`, `src/sections/profile/DetallPrivacitat.jsx`, `src/components/universal/workspace/WorkspaceContext.jsx`, `src/sections/notes/NotesSection.jsx`, `src/sections/pobles/aliesDePoblesSeed.js`, `src/sections/text/legalContent.js` (`T11-01..T11-05`):**
  - Aplicar les cinc correccions de Gemini (`Tall 11`) i reaprovar `frontissa-contingut.mjs` si canvia `legalContent.js`.

#### Bloc `B1` · Portes de Pre-Commit 100% en Verd Natiu, Tractor Olivera Auto-Reescriptor d'Enllaços i Sanejament de Governança (`P0-22`, `P1-10`, `P1-29`, `P1-30`, `P2-15`)
- **[MODIFY] `tooling/gates/porta-olivera.mjs`, `src/data/SELF-DESCRIBE.md`, `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`, `tooling/gates/tractor-rutes-web.mjs`, `src/components/NavBar.jsx`, `.agents/LEDGER.md`, `src/sections/consola/Consola.jsx`, `scripts/audita-consola-coherencia.mjs`:**
  - **Millora estructural del tractor cognitiu `tooling/gates/porta-olivera.mjs` (`--arxiva`):** Quan `porta-olivera.mjs --arxiva` moga un document de `_wiki_de_poble/04_escriptori/` a `_wiki_de_poble/90_arxiu_historic/`, ha de reescriure automàticament tots els enllaços relatius Markdown (`(../04_escriptori/<fitxer>)`, `(./<fitxer>)`, `(<fitxer>)` i wikilinks `[[<stem>]]`) dins dels documents vius de `_wiki_de_poble/` i `.agents/ESTAT.md` cap a `../90_arxiu_historic/<fitxer>`, de manera que arxivar l'Escriptori mai trenque `verificador-scc.mjs` (`LINK_INVALID`). Preparar també a `skills-per-segellar/` el pegat per a `core-higiene-escriptori/SKILL.md` i `wiki-cicle-de-vida/SKILL.md` deixant blindat que al tancament de sessió d'Antigravity es lliura **un únic Títol Termodinàmic ($\le 70$ caràcters, format `aammdd_hhmm_...`)** per anomenar el xat d'Antigravity que es tanca, i que qualsevol títol per als xats de les altres IAs va inclòs dins del seu propi bloc de prompt.
  - Afegir frontmatter vàlid a `src/data/SELF-DESCRIBE.md`.
  - Llistar els 12 membres del Consell (`Z.ai · Qwen · Deepseek · Dola · Kimi · Claude · Perplexity · Mistral Vibe · Grok · Gemini · Copilot · ChatGPT Codex`) quan se cite el Consell al Llibre Mestre per passar `tractor-cens.mjs`.
  - Arxivar l'històric antic de `.agents/LEDGER.md` a `_wiki_de_poble/90_arxiu_historic/ledger/` (`P1-10`) conservant les entrades vives i la integritat del hash chain.
  - Eliminar l'excepció de `NavBar.jsx` a `tractor-rutes-web.mjs:46` (`P0-22`), unificar la taula de tarifes de telemetria (`P1-29`) i convertir `audita-consola-coherencia.mjs` en test verificat (`P1-30`).
  - Assegurar que `node tooling/gates/run-portes.mjs` ix amb **`exit 0` natiu** de cap a peus.

#### Bloc `B2` · Culminació E2EE (`P1-12` `F2a` + `F7`) i Recuperació Social Shamir $k=3$ (`IDEA-48`)
- **[MODIFY] `src/data/xifratXatPipeline.js`, `src/sections/xat/components/PanellSeguretatXat.jsx`, `src/sections/xat/components/CosSeguretatXat.jsx`, `src/sections/profile/BlocPersonesConfianca.jsx`:**
  - Completar la cerimònia de verificació creuada (`F2a`) i l'alerta bloquejant/visible al fil quan un interlocutor rota la seua clau pública (`F7`), més el flux de reconstrucció de clau amb 3 fragments Shamir `GF(2^8)` (`IDEA-48`), amb proves integrals Vitest.

#### Bloc `B3` · Preparació Total d'App Store / Google Play i `0` Literals en Valencià (`P0-24`, `P1-22`, `P0-05`, `P0-21`)
- **[NEW/MODIFY] `src/natiu/backButtonAndroid.js`, `src/components/universal/FinestraUniversal.jsx`, `src/components/universal/Dialeg.jsx` (`P0-24` / `G2120-07`):**
  - Coordinador de pila de modals per al botó físic `Back` d'Android en Capacitor perquè tanque el diàleg/modal superior abans de navegar arrere.
- **[MODIFY] `src/sections/notes/visibilitatNota.js`, `src/sections/profile/PerfilEditor.jsx`, `src/sections/profile/useImatgeDeFitxa.jsx`, `src/components/universal/UniversalEditorShell.jsx`, `src/sections/notes/SnippetCurador.jsx`, `src/sections/notes/NotesSection.jsx`, `src/data/carpetesSeed.js`, `src/components/universal/workspace/UniversalWorkspace.jsx` + `src/config/idiomes/{ca,es,en,eu,gl}.js` (`P1-22`):**
  - Extreure tots els literals d'UI restants (~130 claus) als 5 diccionaris oficials (`ca`, `es`, `en`, `eu`, `gl`) i afegir els 8 fitxers a l'AST guard `src/config/i18n.p122.test.js`.
- **[NEW] `scripts/supabase/verifica-migracions.mjs` (`P0-05` + `P0-21`):**
  - Verificador d'ordre cronològic, idempotència i consultes pre-check de les migracions SQL pendents d'aplicar al servidor remot.

#### Bloc `B4` · Organitzacions, Transferència de Propietat i vCard a la Fitxa Pública (`IDEA-24`, `IDEA-25`, `IDEA-43`, `IDEA-44`, `IDEA-45`)
- **[MODIFY] `src/sections/profile/PerfilPublicSection.jsx`, `src/sections/profile/GestioMembres.jsx`, `src/data/backendPort.js`, `src/data/local/adaptadorLocal.js`, `src/data/supabase/adaptadorSupabase.js`:**
  - Connectar `vcardDePerfilPublic` i `descarregaVCard` (`src/utils/exportaVCard.js`) a `PerfilPublicSection.jsx` amb un botó accessible «Descarregar contacte (.vcf)».
  - Implementar la transferència atòmica de propietat d'entitat (`owner` → `admin`, `IDEA-24`) amb confirmació explícita i prova de conformitat al kit.
  - Reforçar la separació Persona vs Entitat (`IDEA-43`/`44`) i les dues pestanyes «El que publica» / «El que connecta» (`IDEA-25`).

#### Bloc `B5` · Persistència Remota Open Data `OKF v0.2` i Inbox ActivityPub Fase 2 (`D04`, `D05`, `D07`, `D10`)
- **[MODIFY] `src/data/exportaMunicipiOpenData.js`, `src/data/importaMunicipiOpenData.js`, `src/data/federacio/inboxActivityPub.js`, `supabase/functions/ap-inbox-verifica/`:**
  - Connectar l'adaptador de persistència d'`inboxActivityPub.js` amb la taula `ap_inbox_lliuraments` i la cua d'entrega signada amb reintents exponencials (`P1-23` / `P2-07`), més verificació completa del contracte `exportacio_federacio.v1.json` (`P2-08` / `P2-09`).

#### Bloc `B6` · Fase E «El Comú» (Rajoles Bring! `98×116 px`, TPV i Cercador 3 Columnes · `P1-01`, `IDEA-46`, `IDEA-30`)
- **[MODIFY] `src/sections/mercat/`, `src/sections/cerca/`, `src/sections/lector/`:**
  - Rajoles reactives `98×116 px` d'1 toc amb estats `Falta / Al cabàs / Comprat` (`P1-01`), espai de cerca en 3 columnes amb facetes (`IDEA-46`) i pestanya de «Notícies Germanes» (`IDEA-30`).

#### Bloc `B7` · Poliment Visual Pedra Seca `PS-01..PS-11` i Cartell Vertical A4 (`P1-28`, `IDEA-42`)
- **[MODIFY] `src/utils/viewTransitions.js`, `src/context/RouterContext.jsx`, `src/css/sdp.css`, `src/css/modules.css`, `src/components/universal/barres/UniversalTopBar.jsx`, `src/sections/pobles/PoblesSection.jsx`, `src/sections/mur/MurSection.jsx`, `src/components/layout/AppGridColumn.jsx`, `tooling/gates/design_guard.mjs`:**
  - Tancar els 8 punts pendents de `PS-01..PS-11` (`PS-01`, `PS-03`, `PS-04`, `PS-05` amb ratchet a `0`, `PS-06`, `PS-07`, `PS-10`, `PS-11`) i el doble enquadrament `16:9` + Cartell Vertical `A4` per a esdeveniments (`IDEA-42`).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Proves de Regressió per Bloc i Suite Pre-Commit:**
   - Totes les proves `[DEFECTE]` de Codex (`adversarial.local.test.js`, `adversarial.ambit.test.jsx`, `adversarial.ipa.test.js`) convertides en proves de regressió negatives que passen en verd (`0` fuites).
   - `npm run test:precommit` en verd (`0` fallades).
2. **Portes d'Autoritat, Disseny i Contingut:**
   - `node tooling/gates/run-portes.mjs` → `exit 0` natiu.
   - `node tooling/gates/design_guard.mjs --arrel=src` → `0 crítics, 0 avisos` i ratchet de literals d'espaiat a `0`.
   - `node tooling/gates/pressupost-paquet.mjs` → entrada `< 250.000 B` gzip `-9`.
   - `node tooling/gates/frontissa-contingut.mjs` → `16/16` claus aprovades.
   - `node tooling/gates/porta-olivera.mjs` i `node tooling/gates/porta-autoritat.mjs` → `exit 0`.
3. **Commits Locals Segellats sense `git push`:**
   - Commits atòmics a la branca `backup-notes-publish` amb el torn de governança tancat i actualització de `03_llibre_mestre_tasques_i_idees.md`, `.agents/ESTAT.md` i `.agents/LEDGER.md`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Contenció de CPU/RAM durant la Marató Nocturna:** Claude Opus 5.5 executarà carrils paral·lels sobre l'arbre; per evitar esgotar la memòria de la màquina, Codex i Gemini operaran amb `--maxWorkers=1 --no-file-parallelism` sobre còpies lleugeres a `/private/tmp/` i crearan kits `.patch` pre-verificats a `../_investigacio_ia_de_poble/261101_kits_marato_extirpacio/`.
- **Frontera d'Escriptura:** Només Claude modifica `src/`, `tooling/`, `scripts/`, `supabase/`, `tests/` i fa commits a Git. Codex i Gemini només escriuen els seus informes a `_wiki_de_poble/04_escriptori/` i els seus kits a `../_investigacio_ia_de_poble/261101_kits_marato_extirpacio/`.
- **Crons sense Zombis:** Tota IA que programe un temporitzador o cron durant la nit li posarà `MaxIterations` acotat i el cancel·larà abans de tancar el torn.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261101_2059_prompt_marato_nocturna_extirpacio_total_deute_llibre_mestre]]
- [[261101_0403_auditoria_codex_marato_nocturna]]
- [[261101_0407_auditoria_gemini_marato_nocturna]]
- [[261101_1355_auditoria_claude]]
