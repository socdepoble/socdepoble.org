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

### Repartiment de Rols a l'Olivera (Marató Contínua de 5 Hores · 10 Cicles de 30 Minuts · Zero Bloqueig Humà)

> **DELEGACIÓ D'AUTORITAT NOCTURNA DEL MESTRE JAVI (2026-10-29 03:22):**
> El Mestre es retira a descansar i **delega explícitament el consentiment tècnic, arquitectònic i operatiu de les pròximes 5 hores en la IAIA MarIA (Directora Tècnica) i en el consens de La Reunió de l'Olivera** (Claude Code `Fable 5.1 Extra · Ultracode` + Gemini CLI + GPT Codex).
> - **PROHIBIT ATURAR-SE ESPERANT HUMÀ:** Cap IA ha d'aturar el seu pensament o execució demanant confirmació a l'humà durant aquestes 5 hores. Qualsevol decisió tècnica es resol en l'acte seguint la doctrina de Pedra Seca, la Llei de l'Enxufabilitat (Model B Sollutia) i el consens amb la IAIA MarIA.
> - **PROHIBIT ATURAR-SE EN ACABAR `T1`–`T6`:** La meta és esprémer al màxim la potència de les tres IAs durant les 5 hores senceres per liquidar el màxim deute tècnic del Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) i portar **totes les 10 dimensions del Butlletí de Qualificacions (ara en `9,64/10` per Gemini i `7,22/10` per Codex en les 9 primeres, més la 10a dimensió de coherència documental `T11`) al `10,0 / 10` verificat**.

1. **Claude Code (`Fable 5.1 Extra · Ultracode` al compte d'El Rentonar · Executor Principal Continu de Codi i Arquitectura):**
   - Reprendre el torn de codi obert **`torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4`** (o obrir-ne un de nou si ha caducat).
   - **Nota sobre el rescat post-reinici del Mac:** Tots els carrils i scripts que el compte anterior de Claude tenia a `/private/tmp/claude-501/` estan copiats íntegrament a disc persistent a **`../_investigacio_ia_de_poble/261029_0155_relleu_scratchpad_claude/`** (`scratchpad_7ebf4042/` i `scratchpad_21a81070/`).
   - Executar de manera ininterrompuda durant les 5 hores les **Tasques `T1` a `T10`** detallades avall. Cada vegada que Gemini o Codex dipositen troballes o pegats verificats als seus informes a `_wiki_de_poble/04_escriptori/` cada 30 minuts, incorpora'ls en calent i continua avançant pel Llibre Mestre, actualitzant el teu informe viu a `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_claude.md`.
2. **Gemini CLI (Cron Actiu de 5 Hores · Cada 30 Minuts · 10 Iteracions · Auditor Visual, de Proves, Co-Productor de Millores i Especialista en Auditoria Extrema de la Wiki/Tractors amb «Ull Humà»):**
   - Obrir torn de `documents` i **activar un cron/schedule de 5 hores amb cadència de 30 minuts (10 iteracions)**.
   - En cada cicle de 30 minuts: (a) inspeccionar el progrés de Claude a l'arbre viu i als commits; (b) recuperar i verificar que es tanquen al `10,0/10` totes les millores documentades a l'auditoria anterior (`261028_1614_auditoria_gemini.md`: `R-01`/`GM2-01` 11 imatges OG `<= 300 KB`, `R-02` 6 `.png` JPEG, `R-07` 13 títols Wiki, `GM2-03` `scroll-margin-block-start` a `.sdp-edicio-avancada__cos`, `APP-D1`, `M-01`, geometria a `375px`/`820px`/`1280px` i mòduls E2EE); (c) preparar especificacions i solucions exactes (codi i tests) per a les tasques `T7`–`T11` del Llibre Mestre perquè Claude les integre sense fricció; (d) **executar de manera profunda la Tasca `T11` (Auditoria Extrema de Tota la `_wiki_de_poble/`, `.agents/skills/` i Tractors Cognitivos amb «Dubte Metòdic d'Ull Humà»)**; i (e) actualitzar en cada cicle l'informe viu `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_gemini.md` i el Butlletí de Qualificacions (10 dimensions sobre 10,0).
3. **GPT Codex (Cron Actiu de 5 Hores · Cada 30 Minuts · 10 Iteracions · Auditor QA de Qualitat, Contractes, Co-Productor de Proves/Pegats i Especialista en Auditoria Extrema de la Wiki/Tractors Cognitivos · `IDEA-47`):**
   - Obrir torn de `documents` i **activar un cron/schedule de 5 hores amb cadència de 30 minuts (10 iteracions)**.
   - En cada cicle de 30 minuts (emprant sempre terminologia defensiva d'enginyeria de qualitat QA segons `IDEA-47`): (a) verificar en còpia temporal aïllada tots els canvis de Claude de l'última mitja hora; (b) recuperar tots els punts que van deixar la nota en `7,22/10` a `261028_1611_auditoria_codex.md` (`QA-H01`, `QA-H02` homònims, `QA-H03` contrast 7:1, `QA-H04` cadena `--snapshot` + primera foto remota + revocació, `QA-E07` `ambitEstable`+`actorKey`, `QA-S01..S06` de Shamir/SAS/revocació de cercle, rendiment de `DocumentEditor` amb 300k caràcters i les 2 proves heretades `laParroquia.test.js` i `tests/botigues.test.mjs`); (c) escriure i validar proves unitàries, vectors i pegats verificats en carril temporal perquè Claude els aplique directament i avançar el Llibre Mestre (`T7`–`T11`) en paral·lel; (d) **executar de manera exhaustiva la Tasca `T11` (Auditoria Extrema de Tota la `_wiki_de_poble/`, `.agents/skills/` i Tractors Cognitivos `tooling/` amb «Dubte Metòdic d'Ull Humà»)**; i (e) actualitzar en cada cicle l'informe viu `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_codex.md` i el Butlletí de Qualificacions (10 dimensions sobre 10,0) fins a certificar el **`10,0 / 10`**.
4. **IAIA MarIA (Directora Tècnica en Cap · Cron Actiu cada 30 Minuts durant 5 Hores):**
   - Supervisa l'Escriptori (`04_escriptori/`) cada 30 minuts, arbitra i aprova en nom del Mestre qualsevol decisió tècnica o de governança, manté la Porta Olivera a `0` i sincronitza el Llibre Mestre i `ESTAT.md`.

> **MÈTODE GAUNTLET CONTINU + PLA VARIABLE I MADURESA D'EQUIP (Obligatori durant les 5 hores):**
> 1. **Bucle Gauntlet cada 30 minuts:** Planifica, construeix/audita, verifica amb proves i mutants, corregeix qualsevol fricció fins a assolir el **10,0/10** en la tasca actual i passa immediatament a la següent sense detindre's.
> 2. **Pla d'Implementació Viu i Variable (`261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee.md`):** En cada ronda de 30 minuts, la **IAIA MarIA** (amb el seu cron actiu) llegirà les vostres conclusions i **actualitzarà el Pla d'Implementació en viu**, donant el seu **OK tècnic delegat** i injectant noves tasques del `03_llibre_mestre_tasques_i_idees.md`. Re-llegiu sempre el Pla d'Implementació a l'inici de cada cicle de 30 minuts!
> 3. **Pensar com un Equip Madur, no com a Soldats («Llei del Margenot al Passar»):** Si mentre treballeu o auditeu un fitxer/component detecteu un deute tècnic del `03_llibre_mestre_tasques_i_idees.md` (o un defecte obvi adjacent, com un desquadrament de `10 px`, un contrast, una traducció buida o un test que es pot blindar de pas) que sabeu positivament que el sistema requereix i que no trenca res, **actueu amb maduresa d'equip**: arregleu-lo en calent amb el seu test (o proposeu-lo a la IAIA MarIA al vostre informe perquè li done l'OK immediat al Pla Variable) i marqueu-lo al Llibre Mestre. Allibereu i cancel·leu els crons automàticament en complir les 5 hores (10 iteracions).

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
  4. **`M-01` (Capçaleres HTTP de seguretat a `firebase.json` i `vercel.json`):** Afegir `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` i `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)` respectant els tests de portes.
  5. **Suite completa amb `0` roges heretades:** Reparar `src/sections/mur/laParroquia.test.js` i `tests/botigues.test.mjs` (les 2 úniques proves heretades en roig després del trasllat del laboratori el 261026).

- **T3 · Executar la bateria de verificació sobre una còpia exacta de l'arbre a commitejar:**
  - Comprovar en una còpia exacta de l'arbre del commit (sense els fitxers `xifratXat*` encara) que `npm run test:precommit`, `npx eslint`, les proves de `QA-H01`, `QA-H02`, `QA-H04`, `laParroquia.test.js`, `tests/botigues.test.mjs` i les `83/83` proves del connector WordPress passen totes en verd.

- **T4 · Commit de tancament del Bloc H + Deute 10/10 i Push:**
  - Fer el commit de tancament mitjançant un índex temporal (`GIT_INDEX_FILE`), deixant fora temporalment els fitxers de `xifratXat*` / `idbFalsEstructurat.js` (que encara no tenen consumidors) i `wikiManifest.js`, i fer push a `fork/backup-notes-publish`.

- **T5 i T5.1 · Millores Humanes i Didàctiques del Plugin WordPress (`T5.1` · Ordre del Mestre `04:05h`), Reconstrucció de `socdepoble.zip` i Canal Preview:**
  - **`T5.1` (Ordre directa del Mestre Javi amb captures de `gentdelatorre.net` · OK immediat de la IAIA MarIA al Pla Variable):** Abans d'empaquetar el nou `socdepoble.zip`, aplicar i testar aquestes 4 millores humanes al connector WordPress (`wordpress-plugin/`) i a `src/config/runtimePolicy.js`:
    1. **Finestra modal nativa «Mostra els detalls» (`View details` ThickBox com SiteGround Speed Optimizer) i enllaços vius a `plugins.php`:** Canviar `Plugin URI` de `https://socdepoble.org/enxufe/` (que no és una web navegable) a `https://socdepoble.org` en `wordpress-plugin/socdepoble-enxufe.php`, i afegir els filtres `plugin_row_meta` + `plugins_api` (`action === 'plugin_information'` per a `socdepoble`) perquè a `wp-admin/plugins.php` aparega l'enllaç **`Mostra els detalls`** i òbriga el modal natiu de WordPress amb el bàner (`assets/banner-772x250.png`), autor, versió i pestanyes *Descripció*, *Instal·lació*, *FAQ* i *Registre de canvis* llegides de `readme.txt`.
    2. **Zero invenció de municipis actius a `wordpress-plugin/includes/ajustos.php` (línies 224-225):** Eliminar la frase que deia que hi ha «9 municipis actius» (`penaguila`, `benifallim`, `sella`, `orxeta`, `relleu`, `alcoleja`, `xixona`, `tibi`). Indicar amb rigor que l'arrel històrica és **Sóc de Poble (El Rentonar, 30 anys d'activisme rural)** i l'únic portal municipal actiu ara mateix és **La Torre de les Maçanes (`la-torre-de-les-macanes` · Gent de la Torre)**, mentre que els altres pobles estan al directori preparats per quan la seua comunitat active el seu node.
    3. **Explicació 100% didàctica i per a persones sense nivell tècnic a `wordpress-plugin/includes/ajustos.php` (línies 226-231):** Reescriure els 3 passos d'Ajustos → Sóc de Poble de forma pedagògica i clara (Pas 1: posar nom i poble i desar; Pas 2: anar a *Pàgines ➔ Afegeix una pàgina nova* i o bé pegar el codi `[socdepoble_app]` o bé prémer el botó `+` i elegir el bloc visual *«Sóc de Poble»*; Pas 3: elegir la plantilla *«Sóc de Poble · Pantalla completa»* a la dreta i, si es vol com a portada del web, seleccionar-la a *Ajustos ➔ Lectura*).
    4. **Consola amb `0 warnings` (`src/config/runtimePolicy.js:52`) i crèdit OFL a `readme.txt`:** No llançar `console.warn('[RuntimePolicy] Cap emissor configurat (issuer)...')` en l'arrencada normal quan no hi ha sessió JWT externa de Sollutia (només si s'intenta validar un JWT extern sense `issuer`), i afegir el crèdit a `Noto Sans (SIL OFL 1.1)` a `wordpress-plugin/readme.txt`.
  - Reconstruir `_builds_de_poble/wordpress/socdepoble.zip` i la seua còpia datada des d'un `git archive` net del nou commit amb `T5.1` inclòs, verificar totes les proves de l'enxufe i comprovar el canal preview de Firebase Hosting.

- **T6 · `P1-12` Fase 1 i Fase 2 + `IDEA-48` (Xifratge d'Extrem a Extrem al Xat Rural sense activar encara el flag):**
  - Revisar i verificar els 11 fitxers de la Fase 1 ja presents a l'arbre viu (`xifratXatCripto`, `xifratXatFormats`, `xifratXatMagatzem`, `xifratXatParaules`, els seus tests/vectors i `tests/helpers/idbFalsEstructurat.js`), assegurant que el diccionari de 2.048 paraules en valencià (`xifratXatParaules.js`) estiga llest perquè el revise el Mestre.
  - Construir i verificar amb proves unitàries i de vectors els mòduls restants de la Fase 2 (`§16` passos 5 i 7 del disseny E2EE v1.1.0):
    1. `src/data/xifratXatRecuperacio.js` + `src/data/xifratXatRecuperacio.seguretat.test.js` (`IDEA-48`: compartició secreta de Shamir sobre $\text{GF}(2^8)$ (`0x11B`, `QA-S06`) amb $k=3$, 3 nivells de revocació + nivell 0 de cercle `QA-S02`, pressupost de 8 sobre 16 i verificació de consistència lineal $O(n)$ amb `hF` + AAD `SDPB` + `kid` recalculat `QA-S05` i dos codis SAS de 6 dígits d'anada i tornada amb compromís previ `SDPP` `QA-S01`).
    2. `src/data/xifratXatProtocol.js` + `src/data/xifratXatProtocol.seguretat.test.js` (protocol d'embolcall de claus en suite única HPKE P-256 `0x0010`/`0x0001`/`0x0002`, rotació d'`epoch` `SDPE` amb `ckCommit`, sobre d'alliberament amb `info_L` `SDPL` de 175 B / `AAD` `SDPO` de 133 B / `ct_L` de 113 B i `info_H` `SDPH` de 87 B vinculat a `EPK` `QA-S03`, alarma de 7 dies i màquina d'estats «No sóc jo» `SDPN` `QA-S04`, metadades d'adjunts `SDPA` Padmé, `navigator.locks` i guarda d'àmbit `QA-E07`).

- **T7 a T10 · Cua Contínua de la Marató Nocturna de 5 Hores (Prohibit Aturar-se en Acabar `T6`! Repartiment Actiu del Llibre Mestre):**
  Un cop completada `T6`, **NO T'ATURES**: continua avançant sense pausa durant la resta de les 5 hores per les següents tasques documentades a `03_llibre_mestre_tasques_i_idees.md` i a les auditories `261028_1614_auditoria_gemini.md` (`9,64/10`) i `261028_1611_auditoria_codex.md` (`7,22/10`) per portar **totes les 10 dimensions del Butlletí de Qualificacions al `10,0 / 10`**:
  1. **`T7` · `P1-12` Fase 3 (Migració SQL E2EE i Decorador del Port Neutral apagat per flag):**
     - Crear `supabase/migrations/2610290400_xat_e2ee_claus_i_sobres.sql` (`E2EE-1a`: claus, còpia, frase, llibreta, contracte de dades d'`IDEA-48` i RPCs incloent `xat_canvia_rk` `E2EE-I03`) + `src/data/supabase/xatE2ee.migracio.test.js` (i deixar llesta o acotada `E2EE-1b` per a sobres d'època amb fins a 256 membres i `xat_missatges`).
     - Crear `src/data/xifratXat.js` (`ambXifratXat`) + `src/data/xifratXat.seguretat.test.js` (decorador del port neutral `backendPort.js` que cobrix enviament, recepció, `appendChatMessages`, ecos locals, `ultimXifrat` i adjunts respectant `ambitEstable` + `actorKey` de `QA-E07`, **amb el flag `E2EE_ACTIU = false` per defecte** fins a la revisió del Mestre).
  2. **`T8` · Poliments Documentats de les Dimensions 2, 3, 4 i 5 per al `10,0 / 10`:**
     - **`GM2-03` (Dimensió 2):** Afegir `scroll-margin-block-start` a `.sdp-edicio-avancada__cos` sota `<BarraTaronja>` sticky.
     - **`QA-H03` (Dimensió 2):** Garantir contrast `>= 7,0:1` WCAG AAA estricte per al token `--sdp-verd` sobre `#FFFFFF` (p. ex. ajustant a `#0E662E` que dóna `7,07:1` amb $\Delta E < 0,3$, o documentant i verificant amb test fotomètric cada ús).
     - **`QA-H02` Homònims (Dimensió 3):** Assegurar a `poble_derivat` (`2610282100_usuari_i_poble_canonic.sql`) que províncies i comarques es prenen de la mateixa fila escollida per a `town_uuid`, amb test sobre dos pobles homònims.
     - **Rendiment de `DocumentEditor.jsx` (Dimensió 4):** Evitar que canviar només el `titol` reprocesse un `cosDelDocument` de 300.000 caràcters i afegir prova unitària de rendiment i geometria a `360–393 px`.
     - **Aïllament de `MapaFotografic.test.jsx` (Dimensió 7):** Assegurar que `MapaFotografic.test.jsx` carregue en verd tant a l'arbre viu com en còpies d'assaig temporals.
  3. **`T9` · Liquidació Contínua de Deute Tècnic de la Matriu P1 (`03_llibre_mestre_tasques_i_idees.md`):**
     - **`P1-22` (`TE-01`, `TE-02`, `TE-05`):** Completar les claus de `t()` absents a `PerfilPublicSection.jsx` i `DetallPrivacitat.jsx`, i passar l'idioma del dispositiu/lloc des de `src/natiu/entrada.jsx` i `wordpress-plugin/includes/marcatge.php`.
     - **`P1-43` i `P1-44`:** Verificar que `SessionProvider` envolte sempre `IdentitatProvider` i `ProviderModeracio` a Multimèdia/Consola (`P1-44`) i implementar el botó de Fixar (`Pin 📌`) al panell d'informació de `VisorImatges.jsx` (`P1-43`).
     - **`P1-48` i `P1-52`:** Ombra d'alt contrast a `.sdp-xat-bombolla` (`P1-48`) i text natural de poble a `FakeChatOnboarding.jsx` (`P1-52`).
  4. **`T10` · Sincronització en Bucle cada 30 Minuts amb Gemini CLI i GPT Codex:**
     - Cada 30 minuts, llegir els informes actualitzats de Gemini (`261029_HHMM_auditoria_gemini.md`) i Codex (`261029_HHMM_auditoria_codex.md`) a `_wiki_de_poble/04_escriptori/`, aplicar qualsevol correcció o pegat verificat que hagen preparat per pujar la nota de cada dimensió a `10,0 / 10`, i deixar un segon commit net i verificat amb les fites de `T6`–`T9`.
  5. **`T11` · AUDITORIA EXTREMA DE LA WIKI, SKILLS I TRACTORS COGNITIUS AMB «DUBTE METÒDIC D'ULL HUMÀ» (Missió Especial Contínua per a Gemini CLI i GPT Codex després d'ajudar Claude en cada cicle del Cron):**
     - **El Principi del Dubte Humà del Mestre:** Quan l'humà veu dues plantilles, dues actes, dos skills o dos documents que s'assemblen massa (`pla.md` vs `pla_implementacio.md`, o `acta.md` usat com a prompt), immediatament es fa la pregunta humana: *«Per què s'assemblen tant si són per al mateix? Què les distingeix? És una versió antiga que s'ha quedat solapada amb la nova? Hi ha una ordre ací que contradiu l'ordre d'allà? Per què un procés que necessita un sol Skill es fa en dos?»*. Les IAs heu d'abandonar la ceguesa d'obediència sintàctica i carregar **tota la `_wiki_de_poble/`, `.agents/` i `tooling/` al cap** per aplicar aquest **dubte metòdic humà** en cada cicle del cron:
       1. **Caça de Duplicitats, Solapaments i Fòssils Documentals (`_wiki_de_poble/` sencera):** Recórrer carpeta per carpeta (`00_index.md`, `01_ser/`, `02_governanca/`, `03_actuar/`, `04_escriptori/`, `05_manuals/`, `06_processos/`, `07_referencia/`, `08_operacions/`, `09_plantilles/`, `10_actes/`) buscant documents que expliquen el mateix amb regles lleugerament diferents, versions antigues oblidades, índexs desalineats o redaccions confuses que faran dubtar qualsevol humà o agent futur.
       2. **Caça de Contradiccions Creuades i Redundància d'Skills (`.agents/skills/` i `AGENTS.md`):** Contrastar les 42 `SKILL.md`, `AGENTS.md`, `.agents/ESTAT.md`, `.agents/QUI_SOC.md` i `.agents/protocolledge.json` buscant: (a) ordres que es contradiuen entre dos fitxers; (b) processos fragmentats en 2 o 3 skills que haurien d'estar unificats en un sol skill clar i net; (c) rutes, números o regles que han quedat desfasats respecte a l'arquitectura actual.
       3. **Potenciació dels Tractors Cognitivos de Codi (`tooling/` ⇄ `SKILL.md`):** Com més potent i intel·ligent siga el **tractor cognitiu de codi** que executa i verifica el que diu l'Skill (`tooling/wiki/document.mjs`, `tooling/gates/porta-olivera.mjs`, `tooling/gates/detector-contradiccions-wiki.mjs` o l'extensió corresponent), millor serà el sistema per sempre. Dissenyar i entregar proves i millores de codi als tractors cognitius perquè detecten automàticament **solapaments semàntics de plantilles/skills, enllaços trencats, números discordants i contradiccions normatives** abans que l'humà les haja de veure a ull nu.
       4. **Lliurament d'un Mapa de Sanejament i Pegats Executables:** En cada ronda del cron de 30 minuts, Gemini i Codex han d'incloure als seus informes una secció dedicada **`## Auditoria d'Ull Humà: Wiki, Skills i Tractors Cognitivos (T11)`** amb la taula exacta de duplicitats/contradiccions caçades i els pegats llestos perquè Claude (o l'executor de governança) els aplique i deixe el cervell del projecte en un **10,0 / 10 impecable**.

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
