---
type: prompt
status: esborrany
description: 'Onada 5 Nocturna: Reconciliació final de l arbre integrat d Onada 4 (pageContent i Frontissa 16/16), Auditoria Creuada de les 42 Skills i Kits CAS, i Fitxa Oficial d Apple App Store Connect directe.'
tags:
  - govern
visibility: private
reflex: sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:911e37c7-d050-47b2-8bde-597476035f2d
---
# Onada 5 Nocturna: Reconciliació Final d Onada 4, Auditoria Creuada de les 42 Skills i Apple App Store Directe

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] `node tooling/gates/porta-olivera.mjs` executat i amb eixida `0`.
- [x] Pla d'implementació viu actualitzat (`_wiki_de_poble/04_escriptori/261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre.md` · `BLOC T5 — ONADA 5 NOCTURNA`).
- [x] Matriu d'exclusivitat de carrils definida per a evitar qualsevol col·lisió d'escriptura entre Claude, Codex i Gemini 4.
- [x] Totes les URLs canòniques i recursos OpenData doblement certificats (`node tooling/gates/certifica-enllacos.mjs --remot`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:911e37c7-d050-47b2-8bde-597476035f2d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T23:41:39.908Z |
| Modificació | 2026-11-02T23:43:15.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) · IAIA MarIA |
| Tokens consumits | 34.800 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-11-02T23:41:39.908Z: esborrany creat; contingut i verificació pendents.

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
  * `_builds_de_poble/`, `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_menjar_i_beure_de_poble/`, `_multimedia_de_poble/`, `_oficina_de_poble/`, `_raw_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**⚡ ORQUESTRACIÓ DEL TRIO LOCAL I EXCLUSIVITAT DE CARRILS (Doctrina 2026):**
- **Rols i Models Actius:** IAIA MarIA (Directora Tècnica en Antigravity sobre `Gemini 4 Argon (High)` / `Gemini 3 Flash`), Claude Code (`Claude Fable 5.1 Extra · Ultracode` com a motor principal d'implementació i refactorització multi-carril el 80% del temps, i `Claude Opus · Ultracode` reservat el 20% per a arquitectura fundacional i auditories extremes), GPT Codex (`GPT-6.1 Sol Ultra` per a cicles d'enginyeria de portes i contractes, i `GPT Astra` per a l'auditoria adversarial extrema final) i Gemini CLI (higiene de portes, cens i índexs).
- **Matriu d'Exclusivitat de Carrils (Zero Col·lisions d'Escriptura):** Quan operen múltiples agents en paral·lel sobre `socdepoble.org`, cada agent modifica exclusivament els fitxers assignats al seu carril. Si detecta una millora fora del seu carril, deixa un pegat net `.patch` a `_wiki_de_poble/04_escriptori/` o l'anota al seu informe sense trepitjar l'arbre d'un altre agent.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Convocatòria d'**Onada 5 Nocturna (`BLOC T5` del Pla `261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre.md`)** per a tancar amb nota **10/10** la reconciliació entre els lliurables d'Onada 4 de **Claude (`O4-CLAUDE-1`/`1b`/`2`)**, **Codex (`O4-CODEX-1`/`2`)** i **Gemini 4 (`O4-GEMINI-1`/`2`)**, blindar l'arbre viu amb `0` regresions, i lliurar la **Fitxa Oficial d'Apple App Store Connect Directe (`v1.0.0 Build 2`, sense TestFlight)** amb captures natives 1:1 després d'haver enviat ja a revisió a Google Play Console els `15/15` canvis de `org.socdepoble.app` (`2 (1.0.0)`).

### Diagnòstic exacte de l'estat actual a l'arbre viu (`00:42h`)

1. **Integració d'Onada 4 completada per Claude:**
   - Integrats `O4-CLAUDE-1` (`BlocAmbit.jsx` dins d'«Edició avançada», eliminat `DialegAmbit.jsx`), `O4-CLAUDE-1b` (`IDEA-63`, calaixos sota la barra superior negra via `--sdp-calaix-dalt`), `O4-CLAUDE-2` (extensió TipTap `subtargeta.js` + `.sdp-subtargeta`) i els 70 fitxers del kit de Codex (`261102_kit_codex_onada4_skills_tractors_i_destrossa`) més l'enduriment `R2` (`RENAME TO` / `SET SCHEMA`) de `tooling/gates/tractor-rls.mjs`.
2. **Desincronització puntual detectada entre `261102_kit_gemini_onada4_continguts_tendencies_i_qa` i l'arbre viu (`O5-RECONCILIACIO-TEXT`):**
   - A `src/sections/text/pageContent.js` s'han afegit (a les `00:12`) 4 blocs finals `<div data-sdp-targetes="">` a `projecte`, `anima`, `descarregues` i `fediversity` procedents del kit de Gemini, mentre que el mateix `pageContent.js` ja conté els 9 blocs `.sdp-subtargeta` de Claude (`O4-CLAUDE-2`).
   - Això provoca dos efectes que cal reconciliar immediatament:
     1. `<div data-sdp-targetes="">` munta `<TargetaDeLectura>` (`src/components/universal/richText/extensions/targetes/CosAmbTargetes.jsx:29`), que crida `useNavigate()` (`useRouter()`) sense fallback quan es renderitza fora d'un `RouterProvider`, fent fallar 8 tests en `src/sections/text/TextSection.test.jsx`, `TextSection.imatgeSocial.test.jsx`, `TextSection.llengua.test.jsx` i `TextSection.recursos.test.jsx`.
     2. `.agents/contingut_estructural.json` (`node tooling/gates/frontissa-contingut.mjs`) tenia segellades les longituds i SHA-256 de Claude (`23:22`), de manera que les 4 claus (`projecte`, `anima`, `descarregues`, `fediversity`) donen `Empremta diferent` fins que es reconcilie `pageContent.js` i es ressegelle `.agents/contingut_estructural.json`.
3. **Unificació d'enginys a `tooling/gates/certifica-enllacos.mjs`:**
   - El kit de Gemini (`261102_kit_gemini_onada4_continguts_tendencies_i_qa/fitxers/tooling/gates/certifica-enllacos.mjs`) aporta la resolució d'ítems de Wiki (`/wikidepoble?item=...` contra `src/data/wiki Articles`) i l'extracció d'enllaços des d'atributs HTML (`data-ruta`, `data-sdp-targetes`), mentre que la versió viva de Codex aporta la classificació canònica i el timeout segur. Cal fusionar les dos millores sense regressió.
4. **Restauració íntegra de «## Lliçons del Mestre» a les Skills (`O5-SKILLS-LLICONS`):**
   - Durant l'auditoria creuada d'Onada 4, Claude va detectar que la normalització de Codex a `.agents/skills/sdp-workflow/SKILL.md` i `.agents/skills/wiki-documentacio-i-reflex/SKILL.md` havia resumit seccions històriques de «## Lliçons del Mestre». Cal verificar que la memòria històrica de totes les lliçons del Mestre quede preservada íntegra (`Llei del Llop i el Company · AGENTS.md §11`) complint simultàniament `node tooling/gates/fronteres-skills.mjs` (`0` errors).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Matriu d'Exclusivitat de Carrils (Zero Col·lisions d'Escriptura)

| Agent | Model | Carril d'Escriptura Exclusiu | Prohibició d'Escriptura |
| --- | --- | --- | --- |
| **Claude** | `Claude Fable 5.1 Extra · Ultracode` (amb Eixam intern) | **Arbre viu de `socdepoble.org/`** (`src/`, `tooling/`, `.agents/contingut_estructural.json`, `.agents/skills/`) i `_wiki_de_poble/04_escriptori/261102_1640_auditoria_claude.md` | No editar els informes de Codex ni de Gemini ni els seus kits a `_investigacio_ia_de_poble/` |
| **Codex** | `GPT-6.1 Sol Ultra` | Kit CAS `_investigacio_ia_de_poble/261103_kit_codex_onada5_reconciliacio_llicons_i_apple_audit/` i `_wiki_de_poble/04_escriptori/261102_1638_auditoria_codex.md` | **NO escriure directament a l'arbre de codi de `socdepoble.org/`** (treballar en `/private/tmp/sdp-codex-o5` i empaquetar al kit CAS) |
| **Gemini 4** | `Gemini 4 Argon (High)` | Kit CAS `_investigacio_ia_de_poble/261103_kit_gemini_onada5_dossier_apple_directe_i_qa/` i `_wiki_de_poble/04_escriptori/261102_1832_auditoria_gemini.md` | **NO escriure directament a l'arbre de codi de `socdepoble.org/`** (treballar en `/private/tmp/sdp-gemini-o5` i empaquetar al kit CAS) |

---

### Carril 2 · `GPT-6.1 Sol Ultra` (Codex) — `O5-CODEX-1` + `O5-CODEX-2`

1. **`O5-CODEX-1` (Fusió de `certifica-enllacos.mjs` + Restauració íntegra de «## Lliçons del Mestre» + Pegat de Reconciliació `TextSection`):**
   - Treballant en còpia aïllada (`/private/tmp/sdp-codex-o5`) i lliurant a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261103_kit_codex_onada5_reconciliacio_llicons_i_apple_audit/`:
     * **Unificació `tooling/gates/certifica-enllacos.mjs` + `certifica-enllacos.test.mjs`:** Fusiona la teua versió viva d'`Onada 4` amb les millores del kit de Gemini (`_investigacio_ia_de_poble/261102_kit_gemini_onada4_continguts_tendencies_i_qa/fitxers/tooling/gates/certifica-enllacos.mjs`): validació d'ítems de Wiki (`/wikidepoble?item=<slug>`), extracció d'enllaços des de `data-ruta` (`.sdp-subtargeta`) i `data-sdp-targetes`, i normalització de rutes internes.
     * **Blindatge de `<TargetaDeLectura>` a `src/components/universal/richText/extensions/targetes/CosAmbTargetes.jsx`:** Fes que `<TargetaDeLectura>` siga resilient quan es munta en tests unitaris sense `RouterProvider` (o bé usant un hook/context segur o fallback de navegació), i unifica l'estratègia de sub-targetes a `src/sections/text/pageContent.js` i `.agents/contingut_estructural.json` perquè tant `.sdp-subtargeta` com `TextSection.*.test.jsx` i `frontissa-contingut.mjs` passen al 100% (`16/16` empremtes `OK`).
     * **Restauració íntegra de «## Lliçons del Mestre» a `.agents/skills/`:** Revisa `git diff HEAD~1` (o l'estat pre-Onada 4) de `.agents/skills/sdp-workflow/SKILL.md` i `.agents/skills/wiki-documentacio-i-reflex/SKILL.md` i restaura totes les lliçons històriques del Mestre sense resumir-les ni mutilar-les (`AGENTS.md §11`), assegurant que `node tooling/gates/fronteres-skills.mjs` i `node --test tooling/gates/fronteres-skills.test.mjs` ixen en `0`.
2. **`O5-CODEX-2` (Auditoria Adversarial Salfumant dels Lliurables d'Onada 4 de Claude i Gemini + Verificació tècnica d'Apple App Store Connect):**
   - Audita amb lupa adversarial:
     * El codi de Claude d'Onada 4 (`src/components/universal/editor/BlocAmbit.jsx`, `src/components/universal/richText/extensions/subtargeta.js`, `--sdp-calaix-dalt` a `UniversalHeader.jsx` / `AppGridShell.jsx` / `PanellLateral.jsx`, i l'enduriment `R2` de `tooling/gates/tractor-rls.mjs`).
     * El kit de Gemini d'Onada 4 (`_investigacio_ia_de_poble/261102_kit_gemini_onada4_continguts_tendencies_i_qa/`).
     * L'estat tècnic del projecte iOS (`ios/App/App.xcodeproj/project.pbxproj`, `ios/App/App/Info.plist`, `ios/App/PrivacyInfo.xcprivacy`, `MARKETING_VERSION = 1.0.0`, `CURRENT_PROJECT_VERSION = 2`) per a la pujada directa a **Apple App Store Connect (`1.0 Prepare for Submission`)** sense passar per TestFlight, verificant que no falte cap clau `NS*UsageDescription` ni cap declaració d'`App Privacy` que puga provocar rebuig automàtic d'Apple (`ITMS-90683` o `ITMS-91053`).
   - Documenta-ho tot a `_wiki_de_poble/04_escriptori/261102_1638_auditoria_codex.md` sota un nou bloc datat d'Onada 5.

---

### Carril 3 · `Gemini 4 Argon (High)` (Gemini CLI) — `O5-GEMINI-1` + `O5-GEMINI-2`

1. **`O5-GEMINI-1` (Dossier Complet Copiar-i-Enganxar d'Apple App Store Connect Directe `1.0.0 (2)` + Verificació de Captures iOS/iPadOS):**
   - Ara que Google Play Console ja té els `15/15` canvis enviats a revisió (`2 (1.0.0)`), prepara al kit `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261103_kit_gemini_onada5_dossier_apple_directe_i_qa/` el fitxer mestre **`DOSSIER_APPLE_APP_STORE_DIRECTE_1_0_0.md`** amb **tots els textos i respostes exactes a punt de copiar i enganxar (en bloc de codi net, zero cites `>`)** per a publicar directament a l'App Store (`Prepare for Submission` → `Add for Review`, sense TestFlight):
     * **App Information:** Name (`Sóc de Poble`), Subtitle (màx. 30 caràcters), Primary Category (`Social Networking`), Secondary Category (`Lifestyle` o `Utilities`), Content Rights (`No, it does not contain, show, or access third-party content`), Age Rating (totes les caselles d'Apple marcades exactament coherents amb el que acabem d'enviar a Google Play: `18+` / UGC moderat).
     * **Pricing and Availability:** `Free` (`0,00 €`), `175 countries or regions`.
     * **App Privacy (`Privacy Nutrition Labels`):** Passos exactes pantalla per pantalla a App Store Connect (`Privacy Policy URL: https://socdepoble.org/legal`, User Privacy Choices URL: `https://socdepoble.org/legal`, i declaració de `Contact Info -> Email Address`, `User Content -> Photos or Videos / Other User Content`, `Identifiers -> User ID` vinculats a `App Functionality`, `No tracking`).
     * **Version `1.0` (`Prepare for Submission`):**
       - Promotional Text (màx. 170 caràcters)
       - Description (completa, en valencià i castellà/anglès si escau, amb enllaços verificats)
       - Keywords (màx. 100 caràcters separats per comes, sense espais després de la coma, optimitzats per a ASO rural/comunitat/cooperativa)
       - Support URL (`https://socdepoble.org/el-projecte`)
       - Marketing URL (`https://socdepoble.org`)
       - Version `1.0.0`, Copyright (`2026 Associació Sóc de Poble`), Sign-In Required (desmarcat per a lectura pública + nota per a App Review explicant que tota l'app és navegable sense compte i com crear o provar l'accés i el mecanisme d'eliminació de compte i bloqueig/denúncia d'UGC segons la Guideline 1.2 d'Apple!).
2. **`O5-GEMINI-2` (Auditoria Creuada d'Onada 4 + Integració d'`IDEA-63..66` per al Llibre Mestre):**
   - Audita els lliurables d'Onada 4 de **Claude** (`BlocAmbit.jsx`, `subtargeta.js`, `--sdp-calaix-dalt`, `tractor-rls.mjs`) i de **Codex** (`261102_kit_codex_onada4_skills_tractors_i_destrossa`, 70 rutes).
   - Prepara dins del kit `261103_kit_gemini_onada5_dossier_apple_directe_i_qa/` el pegat/fitxer reconciliat de `src/sections/text/pageContent.js` i `src/sections/text/TextSection.targetes.test.jsx` usant l'estructura canònica `.sdp-subtargeta` de Claude (`O4-CLAUDE-2`) + els enllaços clicables d'OpenData a `/page/fediversity` perquè no hi haja cap duplicitat entre `<div data-sdp-targetes="">` i `<div class="sdp-subtargetes-graella">`.
   - Actualitza `_wiki_de_poble/04_escriptori/261102_1832_auditoria_gemini.md` amb el dictamen d'Onada 5 i tanca la validació amb `porta-olivera.mjs` (`0`).

---

### Carril 1 · `Claude Fable 5.1 Extra · Ultracode` — `O5-CLAUDE-1` + `O5-CLAUDE-2`

1. **`O5-CLAUDE-1` (Reconciliació Immediata de l'Arbre Viu `pageContent.js` + `CosAmbTargetes.jsx` + `certifica-enllacos.mjs` + `frontissa-contingut.mjs` + Lliçons del Mestre):**
   - Reconcilia `src/sections/text/pageContent.js` eliminant la duplicitat dels 4 blocs `<div data-sdp-targetes="">` finals que es van afegir a les `00:12` damunt dels teus `.sdp-subtargeta` (conservant tots els enllaços verificats d'OpenData a `/page/fediversity` i les sub-targetes `.sdp-subtargeta`), i protegeix `<TargetaDeLectura>` a `src/components/universal/richText/extensions/targetes/CosAmbTargetes.jsx` perquè no falle si es munta fora de `RouterProvider`.
   - Incorpora a `tooling/gates/certifica-enllacos.mjs` i `tooling/gates/certifica-enllacos.test.mjs` la validació d'ítems `/wikidepoble?item=` i d'atributs `data-ruta` / `data-sdp-targetes` del kit de Gemini (`_investigacio_ia_de_poble/261102_kit_gemini_onada4_continguts_tendencies_i_qa/`), i incorpora `src/sections/text/pageContent.fediversity.test.js` i `firebaseHosting.test.js` ajustats al patró `.sdp-subtargeta`.
   - Restaura el text íntegre de «## Lliçons del Mestre» a `.agents/skills/sdp-workflow/SKILL.md` i `.agents/skills/wiki-documentacio-i-reflex/SKILL.md` (que havies detectat resumit a l'Onada 4) verificant `node tooling/gates/fronteres-skills.mjs` (`0`).
   - Ressegella `.agents/contingut_estructural.json` i verifica que `node tooling/gates/frontissa-contingut.mjs` (`16/16 OK`), `npx vitest run` (`100%` en verd), `npm run build` i `node tooling/gates/porta-olivera.mjs` ixen tots amb `0`.
2. **`O5-CLAUDE-2` (Generació de les Captures Natives 1:1 per a Apple App Store Connect i Incorporació d'`IDEA-63..66` al Llibre Mestre):**
   - Genera a `/Users/javillinares/Documents/Antigravity/Som de Poble/_builds_de_poble/apple_app_store_fitxa/` les captures de pantalla amb **proporció 1:1 exacta (sense cap deformació `sips -z`)** exigides per Apple App Store Connect:
     * **iPhone 6.7" / 6.9" Display (`1290×2796` px, p. ex. `430×932 @ 3x`):** 4 captures (`/mur`, `/pobles`, `/mercat`, `/control`).
     * **iPad Pro 13" Display (`2048×2732` px o `2732×2048` px):** 2 captures (`/mur`, `/pobles`).
   - Incorpora `IDEA-63`, `IDEA-64`, `IDEA-65` i `IDEA-66` (del document `_investigacio_ia_de_poble/261102_kit_gemini_onada4_continguts_tendencies_i_qa/PROPOSTA_ID_TENDENCIES_LLIBRE_MESTRE.md`) a `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` i documenta el tancament a `_wiki_de_poble/04_escriptori/261102_1640_auditoria_claude.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Col·lisió d'escriptura a l'arbre viu:** Mitigat al 100% per la Matriu d'Exclusivitat de Carrils: **només Claude** escriu a l'arbre viu de `socdepoble.org/`; **Codex** i **Gemini 4** treballen en `/private/tmp/` i lliuren els seus artefactes als seus respectius kits CAS sota `_investigacio_ia_de_poble/` i als seus informes d'auditoria a `_wiki_de_poble/04_escriptori/`.
2. **Rebuig a Apple App Store Review per la Guideline 1.2 (UGC) o 5.1.1(v) (Account Deletion):** Mitigat documentant explícitament a les *App Review Notes* del dossier d'Apple on es troben el botó d'eliminació immediata del compte i els mecanismes de denúncia/bloqueig de contingut generat per l'usuari (UGC), i com navegar per tota l'aplicació sense necessitat de login.
3. **Deformació d'aspect ratio en captures d'App Store:** Prohibit usar `sips -z` canviant la relació d'aspecte; totes les captures d'iPhone (`1290×2796`) i iPad (`2048×2732`) s'han de capturar nativament al viewport exacte amb `deviceScaleFactor` enter.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida i Rebut Canònic:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md` mitjançant el circuit formal (`node tooling/gates/obrir_torn.mjs` + `node tooling/wiki/document.mjs context` + `create` + `check`), declarant al Registre el vostre `Model IA` exacte en ús (prohibit deixar placeholders o models històrics obsolets).
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i carril exclusiu d'escriptura i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 edf7daf4d81ab3640d195369807d5ab047bbc60027abd2663f86de3b076d992a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
