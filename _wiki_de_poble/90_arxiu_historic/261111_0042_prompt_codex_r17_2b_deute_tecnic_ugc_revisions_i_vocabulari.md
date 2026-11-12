---
type: prompt
status: esborrany
description: 'Segon encàrrec aïllat per a Codex (/tmp/sdp_codex_r17_2b) mentre Claude i Carbon acaben R17.1 i R17.3: purga Storage UGC (P0-20), seed_revisions (P1-75) i vocabulari.'
tags:
  - govern
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:cbe8ecd3-5e7d-4222-8701-38e2a4638700
---
# Prompt d'Execució Local — Codex GPT-6.1 Sol Ultra · Kit R17.2B: Purga UGC P0-20, Revisions P1-75, Capa Enrere P0-24b i Vocabulari

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` verificat amb `porta-olivera.mjs` i àncores declarades a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actualitzat fins a `P0-99 / IDEA-230`.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 2B exclusiu per a `GPT-6.1 Sol Ultra` operant en clon aïllat `/tmp/sdp_codex_r17_2b` i lliurant Kit CAS segellat a `../_investigacio_ia_de_poble/261111_kit_codex_r17_2b_ugc_revisions_i_fediversity/`.
- [x] **Pla d'Implementació** generat i vinculat al torn (`261111_0042_pla_implementacio_r17_2b_deute_tecnic_i_node0.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Creat amb `document.mjs context` + `create` preservant íntegres els blocs fixos.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)**: Coacció estricta de paràmetres, RLS per columna i funcions `SECURITY DEFINER` amb `SET search_path = public, pg_temp` i revocació explícita a `PUBLIC`.
- [x] **Enginyeria Inversa i Paritat amb REA**: Aplicat al contracte de purga de Storage i revisions longitudinals.
- [x] **Cron de vigilància**: Actiu cada 10 minuts (`task-208`).
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:cbe8ecd3-5e7d-4222-8701-38e2a4638700 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-10T23:46:24.278Z |
| Modificació | 2026-11-10T23:48:30.000Z |
| Propietari | maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | GPT-6.1 Sol Ultra |
| Tokens consumits | [a completar per Codex en tancar l'auditoria] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-10T23:46:24.278Z:** Esborrany creat amb `document.mjs create`.
- **2026-11-10T23:48:30.000Z:** Encàrrec autònom `Kit R17.2B` per a `Codex (GPT-6.1 Sol Ultra)` un cop segellat amb èxit el `Kit R17.2`, incorporant les solucions pre-mastegades pel Node 0 (`DOSSIER_NODE0_PREMASTEGAT_DEUTE_TECNIC_R17_PER_FRONTERA.md`) i la reorientació realista post-NLnet (`P0-98`, `P0-99`).

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

Enhorabona pel segellat impecable del `Kit R17.2` (`261111_0012_auditoria_codex.md`, `719` Vitest + `35` Postgres WASM verds, entrada `242.381 B gzip`). Mentre `Claude Opus 5.5` culmina `Kit R17.1A/B` al repositori viu i `Gemini 4 Carbon` culmina `Kit R17.3` a `/private/tmp/sdp_r17_carbon`, tens encàrrec autònom en un clon net `/tmp/sdp_codex_r17_2b` creat des d'`HEAD` actual de `socdepoble.org` (sense trepitjar cap dels 28 fitxers d'Android/Auth/Notes de Claude ni els fitxers de Workspaces/Arbres/ReceptaDetail de Carbon).

Consulta com a suport gratuït d'enginyeria pre-digerida pel Node 0 l'arxiu `../_investigacio_ia_de_poble/DOSSIER_NODE0_PREMASTEGAT_DEUTE_TECNIC_R17_PER_FRONTERA.md` (on les 8 escoles d'Ollama estan dipositant diagnòstics i esborranys de codi).

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (`P0-20` · Cua i Purga Real de Fitxers UGC a Storage en Baixa de Compte):** Crea la migració SQL idempotent `supabase/migrations/2611110100_cua_purga_storage_ugc.sql` (amb taula `public.cua_purga_storage_ugc` protegida amb RLS estricta, trigger/funció `SECURITY DEFINER` amb `SET search_path = public, pg_temp` i `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon`, que en eliminar el compte encua totes les rutes de `storage.objects` propietat de `auth.uid()` als buckets d'usuari) + integració neta darrere de `src/data/` (sense tocar `App.jsx` ni `useLocalSandbox.js`) + prova Postgres WASM que certifique el buidat/encuament real.
- **T2 (`P1-75` · Taula i Port Neutral de Revisions Longitudinals de Patrimoni Viu):** Crea la migració `supabase/migrations/2611110110_revisions_patrimoni_viu.sql` (`public.revisions_patrimoni` per a seguiment longitudinal anual de llavors, arbres monumentals CIEF v232 i receptes: `entitat_tipus`, `entitat_slug`, `campanya_any`, `estat_conservacio`, `mesures_jsonb` amb validació de tipus primitius sense spread cec, `observacions`, `creat_per`, RLS lectura pública / escriptura autenticada del propi autor o curador/admin) + mètodes al port neutral `src/data/` amb fallback local net i tests WASM + Vitest.
- **T3 (`P0-98` + `P0-99` · Actualització Realista i Honesta a `/dispositius` i `/page/fediversity`):**
  1. A la documentació de compatibilitat de `/dispositius` (`src/sections/text/`), afig una nota breu i clara en les 5 llengües (`ca/es/en/gl/eu`) avisant que des de novembre de 2026 les APIs HTTP han retirat 4 xifrats obsolets `TLS 1.2 CBC`, per la qual cosa telèfons amb sistemes fora de suport (`Android <= 4.4` o `iOS <= 9`) no podran negociar connexió segura HTTPS encara que tinguen cobertura.
  2. A `/page/fediversity` (`src/sections/text/`), actualitza amb **Veritat Nua** l'estat de la candidatura `NLnet NGI Fediversity (2026-08-1a6)` en les 5 llengües: explica amb naturalitat i transparència que el novembre de 2026 NLnet va comunicar definitivament que el projecte —tot i reconèixer-ne la noblesa— queda fora de l'encàrrec dels seus fons (centrats en protocols de baix nivell i no en plataformes comunitàries rurals), i que **Sóc de Poble manté intactes per convicció pròpia totes les garanties tècniques d'obertura (AGPL-3.0, port neutral `backendPort.js`, Open Data municipal, Web Component enxufable i Node 0)** mentre orienta el seu finançament cap a vies rurals, municipals i d'impacte social del territori. Zero vocabulari vetat per `tractor-vocabulari.mjs`.
- **T4 (Empaquetat CAS i Zero Col·lisió):** Lliura el Kit segellat amb manifest `SHA-256`, `.patch` net i instruccions de les comandes `frontissa-contingut.mjs --aprova` a `../_investigacio_ia_de_poble/261111_kit_codex_r17_2b_ugc_revisions_i_fediversity/`, i registra l'auditoria canònica a `_wiki_de_poble/04_escriptori/`.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (verificació en clon aïllat `/tmp/sdp_codex_r17_2b`).
- **Criteris d'Acceptació:** `npm run lint` = 0 errors, proves Vitest + Postgres WASM noves i existents 100% verdes, `node tooling/gates/tractor-vocabulari.mjs` sense cap ocurrència nova als fitxers del Kit, i entrada web `<= 249.912 B gzip`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Col·lisió d'arxius amb Carril 1 (Claude) o Carril 3 (Carbon):** Prohibit tocar `src/app/App.jsx`, `src/sections/notes/`, `android/`, `src/natiu/`, `src/sections/recepta/ReceptaDetailSection.jsx` ni els workspaces d'arbres/llavors de Carbon. Opera exclusivament sobre `/tmp/sdp_codex_r17_2b` i diposita el Kit a `_investigacio_ia_de_poble/`.
- **Segell de `frontissa-contingut.mjs`:** Indica explícitament al `LLEGEIX_ME.md` del Kit quins slugs (`dispositius`, `fediversity`) cal aprovar en integrar-lo al tronc principal.

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
