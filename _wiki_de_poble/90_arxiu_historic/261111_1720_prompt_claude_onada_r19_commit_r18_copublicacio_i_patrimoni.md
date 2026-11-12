---
type: prompt
status: esborrany
description: 'Carril 0 i 1 d''Onada R19 per a Claude Opus 5.5 / Fable 5.2: arbitratge i consolidació del COMMIT R18 amb totes les portes en verd, reanomenat zonaHerbari i integració de co-publicació.'
tags:
  - govern
visibility: private
reflex: sdp:torn_c9496ba8-7054-4950-af29-31b28476df6c:36bef4ce-16a3-4f62-8772-82ce9894d855
---
# Prompt d'Execució i Auditoria Local — Claude: Arbitratge COMMIT R18 i Co-Publicació

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `porta-olivera.mjs` `exit 0`; 5 documents consumits de `R18` arxivats a `90_arxiu_historic/` i les 3 auditories finals conservades per a `COMMIT R18`.
- [x] **Llibre Mestre consultat i referenciat**: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu i verificat.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 0+1 assignat en exclusiva a `Claude Opus 5.5 / Fable 5.2 · Ultracode` (arbre viu + còpia d'assaig de `HEAD`), sense col·lisió amb `Codex` (`/tmp/sdp_codex_r19`) ni `Gemini Carbon` (`/tmp/sdp_carbon_r19`).
- [x] **Pla d'Implementació** generat, validat i vinculat al torn (`261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva**: nascut de `document.mjs context` + `create` amb spans normatius intactes.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)** i **Enginyeria Inversa (`REA`)** verificats.
- [x] **Rebut obtingut**: `sdp:torn_c9496ba8-7054-4950-af29-31b28476df6c:36bef4ce-16a3-4f62-8772-82ce9894d855`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c9496ba8-7054-4950-af29-31b28476df6c:36bef4ce-16a3-4f62-8772-82ce9894d855 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (`socdepoble.org/`) |
| Creació | 2026-11-11T16:22:00.886Z |
| Modificació | 2026-11-11T16:23:00.000Z |
| Propietari | Claude Opus 5.5 / Fable 5.2 · Ultracode (Carril 0 + 1) |
| Aprovació humana | vigent (Acta Marmota 261111_1608 i despertar Jarvis 261111_1715) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Carbon (High) (Orquestradora MarIA) → Destinatari: Claude Opus 5.5 / Fable 5.2 · Ultracode |
| Tokens consumits | Telemetria de sessió Antigravity `e6d089f5-0068-49fe-b103-1de942b3ac21` |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- `2026-11-11T16:22:00.886Z`: esborrany creat amb `document.mjs create` sota `torn_c9496ba8-7054-4950-af29-31b28476df6c`.
- `2026-11-11T16:23:00.000Z`: incorporat l'encàrrec del Carril 0 (`COMMIT R18` arbitrat amb totes les portes en verd i reanomenat `zonaHerbari`) i del Carril 1 (assimilació kit a kit amb `Build + Deploy` d'`Onada R19`).

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

Ets l'àrbitre integrador principal (**Carril 0 + Carril 1**, arrencat obligatòriament des de `socdepoble.org/`). Abans de tocar cap fitxer, **llig sencers**:
1. El Pla d'Implementació viu d'`Onada R19`: `_wiki_de_poble/04_escriptori/261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni.md`.
2. L'Acta Marmota vigent: `_wiki_de_poble/10_actes/261111_1608_acta_marmota_tancament_marato_r18_patrimoni_plugins_genealogia_i_relleu_r19.md`.
3. Les 3 auditories finals de `R18` a l'Escriptori (`261111_0206_auditoria_claude.md`, `261111_0205_auditoria_codex.md`, `261111_0612_auditoria_gemini_carbon_extrema_i_futur.md`) i el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`).
4. El Dossier de Pre-Mastegat del Node 0 quan estiga actualitzat (`../_investigacio_ia_de_poble/DOSSIER_NODE0_PREMASTEGAT_R19.md`).

> **QUÀDRUPLE TÈCNICA COGNITIVA I MÈTODE GAUNTLET (Obligatori):** Aplica en cada decisió el **Mètode MIT d'Acumulació de Context i Memòria Semàntica en Xarxa** (5 fases: Acumulació multidireccional → 5 Nuclis Semàntics → Filtre Feynman → Test Socràtic de casos límit → Correcció Dura 4 punts), combinat amb **Google EGM** (Elefant + 8 Peixos Daurats), **REA** i verificació geomètrica real. **Zero retallades d'hores ni de subagents d'`Ultracode`**, i dosificació d'entregues **Kit a Kit (`Build + Deploy` per Kit)** perquè la producció isca sempre d'un commit net.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 · Assaig en còpia de `HEAD` (`c07f78b83`) i Arbitratge Reconciliat del `COMMIT R18` (Carril 0):**
  - Preserva íntegrament les correccions finals de l'arbre viu del `11/11 16:08`: import nominat `{ SquareBadge }` a `src/sections/patrimoni/FitxaArbreMonumental.jsx`, **Llei Innegociable de la Barra Taronja** (només comptes registrats com `Sóc de Poble` o `Associació El Rentonar`; zero entitats no registrades a `BarraTaronja`, i zero mencions externes a `/page/herbari`), càrrega diferida de `NotFoundPage` a `src/app/App.jsx` (`216,4 KB` gzip web i `1.661.886 B` arrencada WordPress), les 67 làmines botàniques de `src/data/patrimoni/laminesBotaniquesNode0.js` i els mapes propis geolocalitzats (sense tornar a copiar les captures de mapa evacuades).
  - Absorbeix de forma selectiva i segura les millores verificades del Kit CAS de Carbon (`../_investigacio_ia_de_poble/261111_kit_carbon_r18_extreme_gauntlet_i_futur/`: `T1-01` `isSafeUrl`, `T1-02` zero *lookbehind* WebKit 16, `T1-03` `tallaSessio` iOS, `T1-04` `tractor-rls.mjs`, `T1-05` `censImatges.js`, `T1-08` `--sdp-font-amplada-estreta`, `T1-09` `revisionsEditorialsWp`) i del Kit CAS `R18.2` + `SUPLEMENT_T4_GENEALOGIA` de Codex (`../_investigacio_ia_de_poble/261111_kit_codex_r18_workspace_importacio_arbres_i_dades/`).
- **T2 · Reanomenat Intern d'Identificadors d'Herbari (`zonaCanaleta` → `zonaHerbari`):**
  - Substitueix `zonaCanaleta` → `zonaHerbari`, `zonesCanaleta` → `zonesHerbari` i `localitzacionsCanaleta` → `localitzacionsHerbari` a `src/data/patrimoni/herbariLaTorre117.js`, `src/data/patrimoni/herbariLaTorre117.test.js`, `src/sections/patrimoni/FitxaHerbari.jsx`, `src/sections/patrimoni/modelHerbariWorkspace.js` i `src/sections/text/pageContent.r9.test.js` (conservant intacte el topònim geogràfic real «Camí Volaor-Parades-Canaleta» a `arbresMonumentals2020.js`).
- **T3 · Totes les Portes Constitucionals a `0` Errors, Obertura dels 10 Plugins del Panell de Control i Commit + Deploy de `COMMIT R18`:**
  - Elimina els 4 crítics de `design_guard.mjs` (`#619` en `AutoriaDosNivellsArbres.test.jsx` i `pageContent.patrimoniR9.js`, i `h1-multiple` en `Columna2Canonica.test.jsx`).
  - Resol les mencions documentals de `tractor-cens.mjs` (`C4`) a `.agents/ESTAT.md`, `_wiki_de_poble/01_ser/agents_equip_ia.md` i `_wiki_de_poble/10_actes/261110_0618_...md` (sense tocar `01_produccio/`).
  - En incorporar `SUPLEMENT_T4_GENEALOGIA` de Codex, encén també l'**Arbre Genealògic (`/app/genealogia`)** a `src/sections/plugins/registrePlugins.js` (`obrir: rutaDeApp('genealogia')`, `estat: ESTAT_PROVES`) i sincronitza `src/sections/profile/aplicacions.js` perquè **totes les idees i eines del Panell de Control (`/control`: Mapa, Vehicle Compartit, Animalets, Gestoria, TPV del Bar, Rebost Domèstic, Salut, Arbre Genealògic, L'Avisador, Lector RSS i La IAIA Sabuda)** estiguen obertes i funcionals de cap a peus sense cap enllaç inert ni comentari obsolet.
  - Revisa adversarialment el text de les 9 claus de `frontissa-contingut.mjs` (`anima`, `arbres-monumentals`, `dispositius`, `disseny`, `fedivers`, `fediversity`, `node-zero`, `receptes`, `versions`), regenera `voresImatges.json`, `wikiManifest.js` i `rag-index.json`, executa el commit unificat amb hook sencer (sense `--no-verify`), puja a `fork/backup-notes-publish` i desplega des del commit verificat.
- **T4 · Marató Autònoma Multi-Loop de Migdiada (`17:30 – 20:30 CET`, 2–3 hores sense el Mestre) + Consens Multi-IA + Auditoria Botànica:**
  - **PROHIBIT ATURAR-SE AL PRIMER PASS:** El Mestre fa la migdiada durant 2–3 hores i t'ordena operar en **mode 100% automàtic continu** sense preguntar-li res fins assolir l'excel·lència consensuada entre totes les IAs (auto-compactant si arribes al `75%` de context i parant netament a les `20:30 CET` o quan no quede cap objecció oberta).
  - Després de segellar `COMMIT R18`, entra en bucle (`Loop 1` → `Loop 2` → `Loop 3`) sobre la **Mesa de Consens Compartida** (`../_investigacio_ia_de_poble/261111_1720_mesa_consens_migdiada_r19/TAULER_CONVERSA_I_CONSENS_R19.md`):
    1. Audita i fortifica una per una totes les aplicacions del Panell de Control (`gestoria`, `bar`, `nevera`, `salut`, `lector`, `genealogia`, `avisador`) eliminant deute tècnic real (`P0/P1/P2` del Llibre Mestre).
    2. Audita amb l'**Elefant i els Peixets de Google EGM** + **Gauntlet Loop** tots els Kits CAS `R19` que dipositen **Codex**, **Gemini Carbon** i les **escoles del Node 0** (especialment `laminesBotaniquesNode0.js` i les imatges hiperrealistes noves de plantes/llavors: zero al·lucinacions morfològiques com *Olea europaea* alterna/serrada o *Ceratonia siliqua* bipinnada, i correspondència 100% exacta entre nom científic/popular i imatge!).
    3. Escriu les teues objeccions i respostes al `TAULER_CONVERSA_I_CONSENS_R19.md`, integra els kits consensuats en un segon commit net `COMMIT R19` si totes les portes i totes les IAs estan d'acord al 100%, i emet `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_auditoria_claude.md` amb MCR i puntuació `D01`–`D15`.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (i verificació de rutes amb `node tooling/gates/certifica-enllacos.mjs`).
- **Criteris d'Acceptació:** `git status` net de producte després de `COMMIT R18`, `0` dades familiars o PII a Git/`dist/`, `npm run lint` = `0/0`, `design_guard.mjs` = `0/0`, `tractor-enxufe.mjs` = `0`, `tractor-pedra-seca.mjs` = `0`, `frontissa-contingut.mjs` = `0`, Nucli Verge `<= 250.000 B` gzip-9 i WordPress `<= 1.737.422 B`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Regressió de la Llei de la Barra Taronja:** No permetre que cap pegat de `R18.2` o `R18-EXTREME` torne a posar una entitat no registrada a `topBarData` de `/page/receptes` o `/page/herbari`.
- **Bloquejos del hook de sessió:** Si el hook d'entorn impedeix executar un pas concret sobre `tooling/` o binaris, deixa l'arbre assajat exacte i la llista d'1 línia d'ordres verificades per a MarIA/Mestre sense fer cap drecera insegura.

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
- [[03_llibre_mestre_tasques_i_idees]]
- [[261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni]]
- [[261111_0206_auditoria_claude]]
- [[261111_0205_auditoria_codex]]
- [[261111_0612_auditoria_gemini_carbon_extrema_i_futur]]
- [[taxonomia_documental]]
