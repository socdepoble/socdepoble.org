---
type: prompt
status: esborrany
description: 'Prompt 261029_0216 per al nou compte de Claude Code, Gemini i GPT Codex: tancament 10/10 del Bloc H (QA-H01/H02/H04, APP-D1, R-01/02/07, M-01, socdepoble.zip) i Fase 1/2 d''E2EE (P1-12 + IDEA-48)'
tags:
  - govern
visibility: private
reflex: sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:f0a3a9b4-c326-4f9f-a94e-f5b58dde483e
---
# Prompt d'Execució i Auditoria Local — Excel·lència 10/10, Tancament del Bloc H i Fase 1/2 d'E2EE (261029_0216)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex/Gemini):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només conté els arxius de la sessió actual (`261029_0216_pla_implementacio_*`, `261029_0216_prompt_*` i `03_llibre_mestre_tasques_i_idees.md`). Tots els arxius de l'onada anterior estan a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu i actualitzat amb la secció `## 🎯 Prioritat 1 Actual · Deute Tècnic cap al 10/10 (Onada 261029_0216)`.
- [x] **Repartiment asíncron d'actors locals a disc**: Claude Code (nou compte Max 20x, executor principal de codi), Gemini CLI (auditoria visual, de proves i d'arquitectura) i GPT Codex (verificació de qualitat i conformitat de contractes, amb lèxic defensiu QA segons `IDEA-47`).
- [x] **Pla d'Implementació** generat i vinculat: `_wiki_de_poble/04_escriptori/261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md`.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (zero spread JSONB sense coacció, zero regex amb backtracking $O(n)$, RLS per columna, Storage privat i purga de claus d'autoritat).
- [x] **Enginyeria Inversa i Paritat amb REA**: Verificat l'ús de REA (`reverse-engineer-anything`) per a disseccionar referències i estructures natives o de botigues sense reinventar la roda.
- [x] **Cron de vigilància**: L'orquestradora programarà un cron per revisar els relleus a l'Escriptori durant l'execució autònoma.
- [x] **Rebut obtingut** per a l'arxiu generat (`sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:f0a3a9b4-c326-4f9f-a94e-f5b58dde483e`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:f0a3a9b4-c326-4f9f-a94e-f5b58dde483e |
| Versió del document | 3.10.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T01:25:04.721Z |
| Modificació | 2026-10-29T01:25:30.000Z |
| Propietari | Agents Locals (Claude Code + Gemini CLI + GPT Codex) |
| Aprovació humana | aprovada pel Mestre en xat (2026-10-29 02:15) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | IAIA MarIA (Orquestradora) |
| Tokens consumits | ~25k |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **v3.10.0 (261029_0216):** Convocatòria de la Reunió de l'Olivera per al nou compte de Claude Code, Gemini CLI i GPT Codex després del relleu del compte anterior de Claude (`w0479j1zp`, aturat al 99% de quota setmanal) i l'arxiu net de l'onada `261028_1526`.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

**🌍 Ecosistema Físic i Distribució de Carpetes (`Som de Poble` vs `socdepoble.org`):**
- **Directori Mare (`Som de Poble`):** És l'entorn contenidor global de tot el projecte (`/Users/javillinares/Documents/Antigravity/Som de Poble/`). No conté `package.json` ni és un repositori git (està protegit per un `.gitignore` de seguretat).
- **Nucli Operatiu i Git (`socdepoble.org`):** És l'aplicació web, la Wiki oficial (`_wiki_de_poble/`), el motor de regles i el repositori Git. Tota comanda de consola (`npm test`, `npm run dev`, `git status`, `node tooling/...`) **s'ha d'executar obligatòriament a `socdepoble.org`** (p. ex. `cd socdepoble.org && npm test`). Si s'editen fitxers des de l'arrel de `Som de Poble`, cal prefixar les rutes amb `socdepoble.org/`.
- **Carpetes Satèl·lit Exteriors de `Som de Poble` (Ja Creades i Canòniques):**
  * `_arxiu_wiki_de_poble/`: Únic destí oficial per a l'arxiu fred i la memòria històrica pesada que s'evacua d'Obsidian.
  * `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_multimedia_de_poble/`, `_raw_de_poble/`, `_rebost_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Benvingudes a **La Reunió de l'Olivera** (`261029_0216`). Acabem de fer el relleu net del compte anterior de **Claude Code** (aturat ordenadament al 99% de quota setmanal a meitat del workflow `w0479j1zp`) i hem deixat l'Escriptori (`_wiki_de_poble/04_escriptori/`) net i preparat amb aquest Prompt, el Pla d'Implementació (`261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md`) i el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`).

> **Llei de Prioritat del Mestre Javi:** Abans d'abordar noves idees del Llibre Mestre, la prioritat número 1 és portar el deute tècnic de l'onada anterior (avaluada en **`9,64/10`** per Gemini i **`7,22/10`** per GPT Codex · mitjana **`8,43/10`**) al **`10/10` verificable**, tancar el commit de clausura del Bloc H, reconstruir `socdepoble.zip` per a WordPress.org i completar la Fase 1/2 d'E2EE (`P1-12` + `IDEA-48`).

### Repartiment de Rols a l'Olivera (Co-working a 3 Bandes)
1. **Claude Code (Compte Nou · Executor Principal de Codi i Arquitectura):**
   - Reprendre el torn de codi obert **`torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4`** (o obrir-ne un de nou si ha caducat).
   - **Nota sobre el rescat post-reinici del Mac:** Tots els carrils i scripts que el compte anterior de Claude tenia a `/private/tmp/claude-501/` han sigut copiats íntegrament a disc persistent a **`../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/`** (`scratchpad_7ebf4042/` i `scratchpad_21a81070/`) perquè el reinici de macOS no en perdés ni un byte.
   - Executar en ordre estricte les **Tasques `T1` a `T6`** detallades avall i emetre l'informe a `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_claude.md`.
2. **Gemini CLI (Auditor Visual, de Proves i d'Arquitectura Pedra Seca):**
   - Obrir torn de `documents`, llegir el Pla `261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md` i el Llibre Mestre, i auditar en viu les solucions de `T1`–`T6` (especialment l'optimització de les 11 imatges OpenGraph `R-01`, els títols Wiki `R-07`, `APP-D1`, la geometria de `P1-66`/`P1-67` i els mòduls de `P1-12` Fase 1/2), dipositant l'informe a `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_gemini.md`.
3. **GPT Codex (Auditor de Qualitat, Conformitat de Contractes i Regressió · `IDEA-47`):**
   - Obrir torn de `documents`, verificar amb proves unitàries i d'integració aïllades (emprant sempre terminologia defensiva de qualitat QA segons `IDEA-47`) la conformitat de `QA-H01`, `QA-H02`, `QA-H04`, `APP-D1`, les capçaleres `M-01`, les `83/83` proves de `socdepoble.zip` i els vectors i invariàncies de `xifratXat*` (`P1-12` + `IDEA-48`), dipositant l'informe a `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_codex.md`.

> **MÈTODE GAUNTLET (Obligatori):** Cada Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un revisor intern de qualitat i conformitat (buscant casos límit, omissions o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis el **10/10**.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 · Culminar i verificar `QA-H01`, `QA-H02`, `QA-H04` i la secció `§21` del disseny E2EE (Estat actual en curs a disc):**
  1. **`QA-H01` (`src/sections/profile/PerfilContext.jsx` + `src/sections/profile/PerfilContext.usuariTardana.test.jsx`):** Ja estan escrits a l'arbre viu (i rescatats a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah01_perfil/`). Revisar-los, passar Vitest + ESLint i verificar que cap `loadProfile()` antic en vol puga sobreescriure un `updateProfile()` més recent d'`@usuari` o poble.
  2. **`QA-H02` (`supabase/migrations/2610282100_usuari_i_poble_canonic.sql` + `src/data/supabase/usuariIPoble.migracio.test.js`):** Ja estan escrits a l'arbre viu (i rescatats a `scratchpad_7ebf4042/lane_qah02_migracio/`). Revisar-los i verificar amb la suite de migració que `completa_la_meua_alta` preserva `profiles.username` quan `p_username` és buit i manté l'alineació del catàleg de pobles.
  3. **`QA-H04` (8 fitxers d'OpenGraph remot amb `--snapshot`):** Hi ha una versió no verificada a `../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_7ebf4042/lane_qah04_og/governanca/` (`package.json`, `tooling/tests/node-suite-manifest.json`, `tooling/seo/{projeccio-publica,prerender-social,build-social-manifest}{.mjs,.test.mjs}`). Com que la sessió ixent va avisar que `lane_qah04_og` no estava verificada, revisa-la a fons (o usa la teua pròpia versió verificada), aplica-la a l'arbre viu a través de l'executor (`../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/scratchpad_21a81070/eines/governanca_qa01.mjs` amb lease Reflex de governança) i verifica les proves Node d'OpenGraph.
  4. **`QA-E07 / QA-S01..S06` i 7 inconsistències (`../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md`):** Completar la secció `§21` (`ambitEstable` + `actorKey` en totes les operacions asíncrones i claus d'IndexedDB, més Shamir $k=3$ i SAS) i **reconciliar les 7 inconsistències internes** pendents al document de disseny.
  5. **`T1.5` · Blindatge dels Skills de la Reunió de l'Olivera, Neteja de Plantilles Antigues i Segell `SKILLS_SEAL.json` (via Executor):**
     - Aprofitant l'execució de governança de `T1.3` (`executor-mutacio.mjs`), actualitzar `.agents/skills/wiki-cicle-de-vida/SKILL.md` (Pas 7) i `.agents/skills/core-higiene-escriptori/SKILL.md` perquè en tancar qualsevol auditoria o sessió s'execute de forma automàtica la **Transició d'Onada a l'Olivera**: (a) actualitzar `03_llibre_mestre_tasques_i_idees.md` amb `[FET · <commit>]` i prioritzar dalt el Deute Tècnic cap al `10/10` abans de noves idees; (b) arxivar a `90_arxiu_historic/` el Pla, el Prompt, les Auditories i totes les captures `_produccio_` de l'onada acabada (`porta-olivera.mjs --arxiva --nom` + `document.mjs handoff`); (c) crear i validar a `_wiki_de_poble/04_escriptori/` el nou Pla (`pla_implementacio.md`) i el nou Prompt (`prompt_local.md`); (d) deixar fixat que `_investigacio_ia_de_poble/` i `04_escriptori/02_investigacio_ia/` són exclusivament el laboratori i biblioteca d'investigació d'IA on el Mestre deixa idees, enllaços i arxius d'IA per a estudiar-los (mai per a guardar-hi prompts ni plans).
     - Retirar/arxivar la plantilla antiga duplicada `_wiki_de_poble/03_actuar/plantilles/pla.md` (de juny de 2026, substituïda per la canònica `pla_implementacio.md`) i depurar `_wiki_de_poble/03_actuar/plantilles/acta.md` + `.agents/protocolledge.json` perquè `acta` vaja exclusivament a `_wiki_de_poble/10_actes/` i no suplante mai `prompt_local.md`.
     - Reconciliar i actualitzar el segell criptogràfic `.agents/SKILLS_SEAL.json` (`node tooling/gates/segella.mjs --update --expected-hash=... --expected-previous=... --reason=...`) i verificar `porta-plantilles.mjs` (`exit 0`).

- **T2 · Tancar el deute tècnic de Previsualització i Suite Sencera per assolir el `10/10`:**
  1. **`APP-D1` (Registre tolerant abans d'executar la migració `2610282100` a Supabase Prod):** A `src/data/supabase/auth.js` / `OnboardingSteps.jsx`, assegurar que si el RPC remot `completa_la_meua_alta` encara no accepta `p_username` / `p_town_uuid` (perquè la migració `2610282100` s'aplicarà al pas a producció), el client faça fallback automàtic a la signatura anterior o actualització de perfil sense fallar l'alta de l'usuari.
  2. **`R-01` i `R-02` (Imatges OpenGraph `<= 300 KB` per a WhatsApp i MIME exacte):** Generar o vincular variants socials `1200×630` `<= 300 KB` per a les 11 rutes l'`og:image` de les quals supera `600 KB` (fins a `1,09 MB`), i corregir els 6 fitxers `.png` que contenen bytes JPEG.
  3. **`R-07` (Títols humans d'OpenGraph a la Wiki):** Corregir en el generador de manifest social els 13 documents de la Wiki que mostraven el seu identificador d'arxiu cru com a títol de targeta.
  4. **`M-01` (Capçaleres HTTP de seguretat a `firebase.json` i `vercel.json`):** Afegir `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` i `Permissions-Policy: camera=(), microphone=(self), geolocation=(self)` respectant els tests de portes.
  5. **Suite completa amb `0` roges heretades:** Reparar `src/sections/mur/laParroquia.test.js` i `tests/botigues.test.mjs` (les 2 úniques proves heretades en roig després del trasllat del laboratori el 261026).

- **T3 · Executar la bateria de verificació sobre una còpia exacta de l'arbre a commitejar:**
  - Comprovar en una còpia exacta de l'arbre del commit (sense els fitxers `xifratXat*` encara) que `npm run test:precommit`, `npx eslint`, les proves de `QA-H01`, `QA-H02`, `QA-H04`, `laParroquia.test.js`, `tests/botigues.test.mjs` i les `83/83` proves del connector WordPress passen totes en verd.

- **T4 · Commit de tancament del Bloc H + Deute 10/10 i Push:**
  - Fer el commit de tancament mitjançant un índex temporal (`GIT_INDEX_FILE`), deixant fora temporalment els fitxers de `xifratXat*` / `idbFalsEstructurat.js` (que encara no tenen consumidors) i `wikiManifest.js`, i fer push a `fork/backup-notes-publish`.

- **T5 · Reconstrucció de `socdepoble.zip` per a WordPress.org i Verificació del Canal Preview:**
  - Reconstruir `_builds_de_poble/wordpress/socdepoble.zip` i la seua còpia datada des d'un `git archive` net del nou commit, verificar `83/83` proves de l'enxufe i comprovar el canal preview de Firebase Hosting perquè el Mestre puga passar a producció i pujar `socdepoble.zip` a `https://wordpress.org/plugins/developers/add/`.

- **T6 · `P1-12` Fase 1 i Fase 2 + `IDEA-48` (Xifratge d'Extrem a Extrem al Xat Rural sense activar encara el flag):**
  - Revisar i verificar els 11 fitxers de la Fase 1 ja presents a l'arbre viu (`xifratXatCripto`, `xifratXatFormats`, `xifratXatMagatzem`, `xifratXatParaules`, els seus tests/vectors i `tests/helpers/idbFalsEstructurat.js`), assegurant que el diccionari de 2.048 paraules en valencià (`xifratXatParaules.js`) estiga llest perquè el revise el Mestre.
  - Construir i verificar amb proves unitàries i de vectors els mòduls restants de la Fase 2 (`§16` passos 5 i 7 del disseny E2EE):
    1. `src/data/xifratXatRecuperacio.js` + `src/data/xifratXatRecuperacio.seguretat.test.js` (`IDEA-48`: compartició secreta de Shamir sobre $\text{GF}(2^8)$ amb $k=3$, cercle obert de confiança d'amics/familiars i verificació de consistència en viu al xat `QA-S02`).
    2. `src/data/xifratXatProtocol.js` + `src/data/xifratXatProtocol.seguretat.test.js` (protocol d'embolcall de claus, rotació d'`epoch` en canviar membres `QA-S01`, SAS de 12 dígits amb transcript ordenat `QA-S03`, metadades d'adjunts `QA-S04`, `navigator.locks` `QA-S05` i `DOMPurify` post-desxifratge `QA-S06`).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:**
  1. `QA-H01`, `QA-H02`, `QA-H04`, `APP-D1`, `R-01`, `R-02`, `R-07`, `M-01`, `laParroquia.test.js` i `tests/botigues.test.mjs` 100% resolts, commitejats i pujats a `fork/backup-notes-publish`.
  2. `_builds_de_poble/wordpress/socdepoble.zip` reconstruït des del nou commit i verificat amb `83/83` proves en verd.
  3. Mòduls de `P1-12` Fase 1 i Fase 2 (`xifratXatCripto`, `xifratXatFormats`, `xifratXatMagatzem`, `xifratXatParaules`, `xifratXatRecuperacio`, `xifratXatProtocol`) complets, verificats amb tests i vectors en verd, i sense activar el flag fins a la revisió del Mestre.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Contaminació de l'índex git amb fitxers de Fase 1 d'E2EE abans que estiga completa la Fase 2:** S'evita usant `GIT_INDEX_FILE` temporal al Pas 4 (`T4`) per fer primer el commit net del Bloc H + deute 10/10 i construir `socdepoble.zip`, i després treballar la Fase 2 d'E2EE.
- **Compatibilitat de vocabulari en els informes (`IDEA-47`):** Totes les IAs han d'utilitzar terminologia defensiva d'enginyeria de qualitat (QA) en els seus informes i comentaris de codi perquè GPT Codex puga llegir i auditar tots els documents de l'Olivera sense falsos positius del filtre *Daybreak*.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 1186c19e82c2aa1a29514c64220e45b495e1abfb77a4c3acd27716c1affc5c4c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee]]
- [[../10_actes/261029_0205_acta_marmota_blocs_ag_h_commit_e36606db2_disseny_e2ee_i_relleu_claude]]
