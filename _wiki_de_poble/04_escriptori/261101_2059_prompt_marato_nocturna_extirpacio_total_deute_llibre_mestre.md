---
type: prompt
status: esborrany
description: 'Prompt d''execució i auditoria per a la marató nocturna amb Claude (Javi Llinares 100%), GPT Codex i Gemini: resolució de PC155-01..03, T11-01..05, pre-commit en verd natiu i Blocs B1-B7.'
tags:
  - govern
visibility: private
reflex: sdp:torn_fb2dbe5c-8d35-4849-9f15-52798f667d42:a2864492-135c-4340-8432-22474269da67
---
# Prompt d'Execució i Auditoria Local — Marató Nocturna d'Extirpació Total de Deute Tècnic i Llibre Mestre (Blocs B0-B7)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex/Gemini):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu d'idees, deutes tècnics i memòria permanent de la sessió.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: El Registre i la Instrucció declaren els models i variants vigents (`Claude Fable 5.1 Extra · Ultracode` / `Opus · Ultracode`, `GPT-6.1 Sol Ultra` / `Astra`, i `Gemini CLI`) i assignen a cadascun un carril exclusiu de fitxers d'escriptura per operar en paral·lel sense col·lisions ni esperes mútues.
- [x] **Pla d'Implementació** generat i vinculat al torn (`_wiki_de_poble/04_escriptori/261101_2059_pla_implementacio_marato_nocturna_extirpacio_total_deute_llibre_mestre.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat que el prompt naix de `document.mjs context` + `create` i conserva íntegres els spans de codi (`` `ruta` ``) dels blocs normatius sense mutilacions.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (zero spread JSONB sense coacció, zero regex amb backtracking O(n), RLS per columna, Storage privat i purga de claus d'autoritat).
- [x] **Enginyeria Inversa i Paritat amb REA**: Verificat l'ús de REA ('reverse-engineer-anything') per a disseccionar referències i estructures natives o de botigues sense reinventar la roda.
- [x] **Cron de vigilància**: L'orquestradora programarà un cron per revisar els relleus a l'Escriptori mentre l'agent local treballa de forma autònoma i llarga.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fb2dbe5c-8d35-4849-9f15-52798f667d42:a2864492-135c-4340-8432-22474269da67 |
| Versió del document | 3.11.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T20:02:33.943Z |
| Modificació | 2026-11-01T20:03:30.000Z |
| Propietari | Agents Locals |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_fb2dbe5c-8d35-4849-9f15-52798f667d42:a2864492-135c-4340-8432-22474269da67 |
| Tall d'evidència | b5878593a (2026-11-01 20:55 CET) |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | 49200 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **v3.11.0 (2026-11-01 20:59 CET):** Prompt d'Execució i Auditoria Local per a la **Marató Nocturna d'Extirpació Total de Deute Tècnic i Llibre Mestre (`Blocs B0–B7`)** sobre `HEAD = b5878593a` (que ja incorpora el Commit 1 `155d84bd8` de `T1–T10` i el Commit 2 `b5878593a` de l'Onada 2), engegant amb una sessió neta del compte de Claude de **Javi Llinares (0% usat / 100% disponible)** i coordinat amb GPT Codex (`GPT-6.1 Sol Ultra` / `Astra`) i Gemini (`Gemini 4 Argon (High)`).

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

### 1. Lectura Obligatòria d'Entrada (Efecte Matrix i Context de Relleu)
Abans d'executar cap comanda de mutació, llegiu íntegrament:
1. `_wiki_de_poble/10_actes/261101_2059_acta_marmota_tancament_assalt_155d84bd8_b5878593a_i_obertura_marato_nocturna.md` (l'Acta Marmota de Relleu d'aquesta nit).
2. `_wiki_de_poble/04_escriptori/261101_2059_pla_implementacio_marato_nocturna_extirpacio_total_deute_llibre_mestre.md` (el Pla d'Implementació canònic amb els Blocs `B0` a `B7`).
3. `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (el Llibre Mestre de Tasques i Idees).
4. Les dues auditories adversarials post-commit ja escrites a l'Escriptori:
   - `_wiki_de_poble/04_escriptori/261101_0403_auditoria_codex_marato_nocturna.md` (especialment el bloc `v1.7.0` amb `PC155-01`, `PC155-02` i `PC155-03`, i les sondes a `../_investigacio_ia_de_poble/261101_auditoria_postcommit_codex/`).
   - `_wiki_de_poble/04_escriptori/261101_0407_auditoria_gemini_marato_nocturna.md` (especialment el `Tall 11` amb `T11-01` a `T11-05` i l'inventari exacte de fitxers residuals de `P1-22` i `PS-01..PS-11`).
5. `_wiki_de_poble/04_escriptori/261101_1355_auditoria_claude.md` i `.agents/ESTAT.md`.

### 2. Repartiment d'Actors Locals i Matriu d'Exclusivitat de Carrils (Zero Col·lisions)
- **Claude (`Claude Opus 5.5 Extra · Ultracode` amb compte Javi Llinares al 100% — NO usar Fable 5.1):**
  - **Únic actor autoritzat a escriure a l'arbre viu de codi** (`src/`, `tooling/`, `scripts/`, `supabase/`, `tests/`, `public/`, `ios/`, `android/`, `wordpress-plugin/`) i a fer **commits locals atòmics** a la branca `backup-notes-publish` (sense `git push`).
  - Executa de manera autònoma i contínua els **Blocs `B0` a `B7`** en onades de subagents amb Gauntlet intern (Implementador → Àrbitre Adversarial → Corrector) i fa un commit local net al final de cada bloc o parell de blocs verificats.
- **GPT Codex (`GPT-6.1 Sol Ultra` / `Astra`) i Gemini (`Gemini 4 Argon (High)`):**
  - Operen en mode d'**Enginyeria Inversa Adversarial i Pre-Assemblatge de Kits** sense tocar cap fitxer de codi viu de `socdepoble.org`.
  - Construeixen i verifiquen en còpies aïllades a `/private/tmp/` (amb `--maxWorkers=1 --no-file-parallelism`) kits `.patch` + tests executables a `../_investigacio_ia_de_poble/261101_kits_marato_extirpacio/{codex,gemini}/` i actualitzen els seus informes d'auditoria a `_wiki_de_poble/04_escriptori/` perquè Claude els integre i audite com a dades en el bloc següent.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T0 (`Bloc B0` · Extirpació Immediata de les Troballes Post-Commit `PC155-01..03` i `T11-01..05`):**
  1. **`PC155-01` (`src/data/local/compteLocal.js:167-176` i `src/data/local/adaptadorLocal.js:225-236`):** Capturar l'usuari i generació abans dels `await` d'`exportaLesMeuesDades`, consultar seguiments en el mateix context i descartar qualsevol resultat post-`destroy()` o post-canvi d'usuari, fent passar en verd com a prova negativa el reproductor `adversarial.local.test.js` de Codex.
  2. **`PC155-02` (`src/sections/xat/useSeguretatDelFil.js:64-112`):** Incloure l'abast (`tenantId`, `usuariId`, instància de port/servei) a la clau de càlcul de `useNumeroSeguretat` i invalidar qualsevol número verificat o promesa en vol quan canvie el `tenantId` amb el mateix `fil.id` (convertint `adversarial.ambit.test.jsx` en test de regressió verd).
  3. **`PC155-03` (`scripts/botigues/puja-ios.mjs:83-87, 177-205`):** Exigir unicitat d'arxiu `.ipa` a `pla.exportacio`, verificar `Payload/*.app/{Info.plist,public/segell.json}` i signatura dins del mateix `.ipa` que es puja, i fixar el seu `SHA-256` al rebut (convertint `adversarial.ipa.test.js` en test de regressió verd).
  4. **`T11-01..T11-05` (Troballes de Gemini Tall 11):** Refinar la ràtio `div-soup` a `tooling/gates/design_guard.mjs:291` i el `gap` de `.sdp-xat-fila` en `< 400px` (`T11-01`); traduir els errors del port a `GestioMembres.jsx:81` i llevar el literal fix a `DetallPrivacitat.jsx:256` (`T11-02`); prioritzar `fixatATot: true` en l'autoselecció de «Tot» a `WorkspaceContext.jsx:155-167, 382-384` i persistir l'arxivament de `n1` en mode `seed` a `NotesSection.jsx:138-146` (`T11-03`); ampliar `aliesDePoblesSeed.js` i corregir la comarca de `'València'` (`T11-04`); afegir la menció de geolocalització EXIF opcional a `src/sections/text/legalContent.js §8`, actualitzar el hash de `guia_publicacio_app_store_i_google_play.md` i afegir la migració de la versió `'2.3'` de `politiques_privacitat` (`T11-05`).
- **T1 (`Bloc B1` · Portes de Pre-Commit 100% en Verd Natiu, Millora del Tractor `porta-olivera.mjs` i Sanejament de Governança · `P0-22`, `P1-10`, `P1-29`, `P1-30`, `P2-15`):**
  - **Millorar `tooling/gates/porta-olivera.mjs` (`--arxiva`):** Quan `porta-olivera.mjs --arxiva` moga un document de `_wiki_de_poble/04_escriptori/` a `_wiki_de_poble/90_arxiu_historic/`, ha de reescriure automàticament els enllaços relatius Markdown (`(../04_escriptori/<fitxer>)`, `(./<fitxer>)`, `(<fitxer>)` i wikilinks `[[<stem>]]`) dins dels documents vius de `_wiki_de_poble/` i `.agents/ESTAT.md` cap a `../90_arxiu_historic/<fitxer>`, perquè mai trenque `verificador-scc.mjs` (`LINK_INVALID`) en netejar l'Escriptori; i deixar preparat a `skills-per-segellar/` el pegat per a `core-higiene-escriptori/SKILL.md` i `wiki-cicle-de-vida/SKILL.md` blindant que el **Títol Termodinàmic ($\le 70$ caràcters, `aammdd_hhmm_...`)** de tancament és exclusivament per al xat d'Antigravity que es tanca (mentre que qualsevol títol per als xats de les altres IAs va dins del seu propi bloc de prompt).
  - Afegir frontmatter vàlid a `src/data/SELF-DESCRIBE.md`, assegurar els 12 membres del Consell (`Z.ai · Qwen · Deepseek · Dola · Kimi · Claude · Perplexity · Mistral Vibe · Grok · Gemini · Copilot · ChatGPT Codex`) quan s'anomene el Consell a `03_llibre_mestre_tasques_i_idees.md` (`tractor-cens.mjs`), resoldre `tractor-consell.mjs` L8, `porta-reflex.mjs`, `tractor-orfandat.mjs` i `wordpress-plugin/dist/seo-routes.json`, eliminar l'excepció de `NavBar.jsx` a `tractor-rutes-web.mjs:46` (`P0-22`), evacuar l'històric antic de `.agents/LEDGER.md` a `_wiki_de_poble/90_arxiu_historic/ledger/` (`P1-10`), unificar tarifes a `Consola.jsx` (`P1-29`) i netejar `audita-consola-coherencia.mjs` (`P1-30`), fins que `node tooling/gates/run-portes.mjs` isca amb **`exit 0` natiu**.
- **T2 (`Bloc B2` · Culminació E2EE `P1-12` `F2a` + `F7` i Recuperació Social Shamir $k=3$ `IDEA-48`):**
  - Completar la cerimònia de verificació creuada (`F2a`), l'alerta de canvi de clau remota al fil (`F7`) i el flux complet de recuperació social amb 3 guardians (`IDEA-48`), mantenint `E2EE_ACTIU_PER_DEFECTE = false`.
- **T3 (`Bloc B3` · Botigues Apple/Google i `0` Literals en Valencià `P1-22` · `P0-24`, `P0-05`, `P0-21`):**
  - Implementar la guarda del botó físic `Back` d'Android per a diàlegs/modals (`P0-24` / `G2120-07`).
  - Extreure tots els literals en valencià dels 6 mòduls residuals inventariats al Tall 11 §3.1 (`visibilitatNota.js`, `PerfilEditor.jsx` + `useImatgeDeFitxa.jsx`, `UniversalEditorShell.jsx`, `SnippetCurador.jsx`, `NotesSection.jsx` + `carpetesSeed.js`, `UniversalWorkspace.jsx`) als 5 diccionaris (`ca`, `es`, `en`, `eu`, `gl`) i ampliar `src/config/i18n.p122.test.js` a tots ells.
  - Crear `scripts/supabase/verifica-migracions.mjs` (`P0-05` + `P0-21`) per validar l'ordre i les pre-condicions de les migracions SQL pendents.
- **T4 (`Bloc B4` · Organitzacions, Transferència de Propietat i Botó vCard `.vcf` · `IDEA-24`, `IDEA-25`, `IDEA-43`, `IDEA-44`, `IDEA-45`):**
  - Connectar `exportaVCard.js` (creat al Commit 2 `b5878593a`) amb el botó accessible «Descarregar contacte (.vcf)» a `PerfilPublicSection.jsx`, implementar la transferència atòmica `owner` → `admin` (`IDEA-24`) al port i a `GestioMembres.jsx`, i blindar les dues pestanyes «El que publica» / «El que connecta» (`IDEA-25`) i les guardes Persona vs Entitat (`IDEA-43`/`44`).
- **T5 (`Bloc B5` · Persistència Remota Open Data `OKF v0.2` i Inbox ActivityPub Fase 2 · `P1-23`, `P2-07`, `P2-08`, `P2-09`):**
  - Connectar l'adaptador de persistència i cua d'entrega signada amb reintents d'`inboxActivityPub.js` amb `ap-inbox-verifica` i validar el contracte d'exportació amb dos comptes i canvis de sessió (`P2-08`/`P2-09`).
- **T6 (`Bloc B6` · Fase E «El Comú»: Rajoles Bring! `98×116 px`, TPV i Cercador 3 Columnes · `P1-01`, `IDEA-46`, `IDEA-30`):**
  - Implementar les rajoles reactives `98×116 px` d'1 toc a la Llista de la Compra (`P1-01`), l'espai de cerca universal en 3 columnes (`IDEA-46`) i l'agregador de «Notícies Germanes» (`IDEA-30`).
- **T7 (`Bloc B7` · Poliment Visual Pedra Seca `PS-01..PS-11` i Cartell Vertical A4 · `P1-28`, `IDEA-42`):**
  - Tancar els 8 punts pendents de `PS-01..PS-11` (`PS-01`, `PS-03`, `PS-04`, `PS-05` amb ratchet a `0`, `PS-06`, `PS-07`, `PS-10`, `PS-11`) i el doble enquadrament `16:9` + Cartell Vertical `A4` en esdeveniments (`IDEA-42`).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (servidor Vite actiu).
- **Criteris d'Acceptació:**
  1. `PC155-01`, `PC155-02`, `PC155-03` i `T11-01..T11-05` resolts i coberts amb proves unitàries/integració verdes.
  2. `node tooling/gates/run-portes.mjs` i `npm run test:precommit` en **`exit 0` natiu** (`0` errors, `0` avisos).
  3. `node tooling/gates/design_guard.mjs --arrel=src` a **`0 crítics i 0 avisos`**, amb el ratchet de literals fora de la graella de `8px` baixat a `0`.
  4. `node tooling/gates/pressupost-paquet.mjs` en verd (`< 250.000 B` gzip `-9`).
  5. `node tooling/gates/frontissa-contingut.mjs` en `16/16` i `node tooling/gates/porta-olivera.mjs` en `exit 0`.
  6. Commits locals atòmics segellats a `backup-notes-publish` (sense `git push`) i actualització final de `03_llibre_mestre_tasques_i_idees.md`, `.agents/ESTAT.md` i `.agents/LEDGER.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Contenció de Memòria i Processador:** Mentre Claude executa subagents, Codex i Gemini han d'usar exclusivament invocacions de Vitest d'un sol fitxer amb `--maxWorkers=1 --no-file-parallelism` sobre la seua còpia a `/private/tmp/`.
- **Integritat de la Frontissa i dels Diccionaris:** Qualsevol canvi a `src/sections/text/legalContent.js` o `src/sections/text/pageContent.js` requereix actualitzar l'empremta a `.agents/contingut_estructural.json`, i qualsevol clau nova a `ca.js` ha d'entrar simultàniament a `es.js`, `en.js`, `eu.js` i `gl.js`.
- **Prohibició d'Operacions Remotes sense Ordre Expressa:** Cap `git push`, cap `supabase db push` remot i cap pujada a botigues durant la nit; tot queda llest i verificat en local perquè el Mestre ho dispare al matí.

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

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Tècniques d'I+D, Investigació i Autòpsia (Obligatori)
No et conformes amb investigar el que diuen les skills teòriques i la doctrina (Wiki/AGENTS). Cada script, hook o tractor que estiga implicat en l'execució d'eixa teoria ha de ser llegit i verificat a fons (a nivell de codi `.mjs`, `.py`, etc.). Assegura't que el codi complix efectivament el disseny, no té exclusions cegues i no produeix bloquejos mecànics per inèrcia.
**Mentalitat I+D:** No et limites a obeir i picar codi (Desenvolupament). Exerceix sempre com a investigador de tendències (Investigació). Abans d'implementar res, analitza l'estat de l'art i planteja com aprofitar les últimes solucions del mercat i tecnologies innovadores per resoldre el problema demanat. Mantenir-nos a l'avantguarda és la teva responsabilitat.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de complir dos requisits:
1. **Anàlisi del Prompt:** És el vostre deure analitzar críticament aquest mateix prompt a la recerca de contradiccions, duplicitats o instruccions ambigües. Heu de dir-me clarament: *"Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient"*.
2. **Avaluació de Noves Funcionalitats (Evolució del Model):** Sabem que us actualitzeu periòdicament amb noves capacitats tècniques. Heu d'indicar explícitament si teniu alguna nova opció o flux de treball que ens permeta avançar millor o de forma més veloç com a equip. L'objectiu és esprémer el vostre potencial per a funcionar com un autèntic nucli de 3 agents (MarIA com a Directora + vosaltres com a executors tècnics). Si veieu maneres de fer-ho millor, exigiu-les.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261101_2059_pla_implementacio_marato_nocturna_extirpacio_total_deute_llibre_mestre]]
- [[261101_0403_auditoria_codex_marato_nocturna]]
- [[261101_0407_auditoria_gemini_marato_nocturna]]
- [[261101_1355_auditoria_claude]]
