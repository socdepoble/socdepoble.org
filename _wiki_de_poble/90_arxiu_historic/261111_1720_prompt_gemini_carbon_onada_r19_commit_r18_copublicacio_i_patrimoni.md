---
type: prompt
status: esborrany
description: 'Carril 3 d''Onada R19 per a Gemini 4 Carbon en clon efímer: avatar compost i co-publicadors registrats a BarraTaronja, UI de traspàs 1 clic i coherència 5 llengües amb 4x Gauntlet.'
tags:
  - govern
visibility: private
reflex: sdp:torn_c9496ba8-7054-4950-af29-31b28476df6c:d2cc57c7-0ac7-4f2e-aabd-81ca2b58c06c
---
# Prompt d'Execució i Auditoria Local — Gemini Carbon: Barra Taronja Composta i Coherència Editorial

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `porta-olivera.mjs` `exit 0`; documents consumits de `R18` arxivats a `90_arxiu_historic/`.
- [x] **Llibre Mestre consultat i referenciat**: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 3 assignat a `Gemini 4 Carbon (High)` en clon efímer `/tmp/sdp_carbon_r19` (zero mutació de l'arbre viu de `socdepoble.org/`, lliurament com a Kit CAS a `../_investigacio_ia_de_poble/261111_kit_carbon_r19_barra_taronja_composta_i_editorial/`).
- [x] **Pla d'Implementació** generat i vinculat al torn (`261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva**: nascut de `document.mjs context` + `create`.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)** i **Enginyeria Inversa (`REA`)** verificats.
- [x] **Rebut obtingut**: `sdp:torn_c9496ba8-7054-4950-af29-31b28476df6c:d2cc57c7-0ac7-4f2e-aabd-81ca2b58c06c`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c9496ba8-7054-4950-af29-31b28476df6c:d2cc57c7-0ac7-4f2e-aabd-81ca2b58c06c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (clon efímer `/tmp/sdp_carbon_r19`) |
| Creació | 2026-11-11T16:22:01.259Z |
| Modificació | 2026-11-11T16:24:30.000Z |
| Propietari | Gemini 4 Carbon (High) (Carril 3) |
| Aprovació humana | vigent (Acta Marmota 261111_1608 i despertar Jarvis 261111_1715) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Carbon (High) (Orquestradora MarIA) → Destinatari: Gemini 4 Carbon (High) |
| Tokens consumits | Telemetria de sessió Antigravity `e6d089f5-0068-49fe-b103-1de942b3ac21` |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- `2026-11-11T16:22:01.259Z`: esborrany creat amb `document.mjs create` sota `torn_c9496ba8-7054-4950-af29-31b28476df6c`.
- `2026-11-11T16:24:30.000Z`: incorporat l'encàrrec ortogonal del Carril 3 (UI/UX Pedra Seca d'avatar compost i co-publicadors registrats a `BarraTaronja`, traspàs d'1 clic i coherència editorial pentalingüe).

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

Operes com a **Carril 3 de Disseny Pedra Seca, Barra Taronja Composta i Coherència Editorial Viva** dins d'un clon efímer (`/tmp/sdp_carbon_r19`), **sense mutar mai `src/`, `tooling/` ni `.git/` de `socdepoble.org/`** i **sense emetre cap botó `RequestFeedback: true` ni executar ordres sobre `SECURITY_PATHS` barrejades amb `rm`/`mv`/`node -e`**. Abans d'actuar, llig sencers:
1. El Pla d'Implementació viu d'`Onada R19`: `_wiki_de_poble/04_escriptori/261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni.md`.
2. L'Acta Marmota vigent (`_wiki_de_poble/10_actes/261111_1608_acta_marmota_tancament_marato_r18_patrimoni_plugins_genealogia_i_relleu_r19.md`), el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) i les 3 auditories finals de `R18` (`0205`, `0206`, `0612`).
3. El Dossier de Pre-Mastegat del Node 0 (`../_investigacio_ia_de_poble/DOSSIER_NODE0_PREMASTEGAT_R19.md`).

> **QUÀDRUPLE TÈCNICA COGNITIVA I MÈTODE GAUNTLET 4x (Obligatori):** Executa les 5 fases del **Mètode MIT d'Acumulació de Context i Memòria Semàntica en Xarxa**, l'eixam **Google EGM** (Elefant + 8 Peixos Daurats), **REA** i verificació geomètrica **storytold/craft-anything** a `375 px`, `768 px` i `1440 px` (clar i fosc, `overflowPx === 0`). Empaqueta tot en Kit CAS verificat a `../_investigacio_ia_de_poble/261111_kit_carbon_r19_barra_taronja_composta_i_editorial/`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 · Disseny i Implementació Pedra Seca de la `BarraTaronja` Multi-Entitat i Avatar Compost (`publicadorsRegistrats[]`):**
  - Evoluciona la superfície de `BarraTaronja` / `topBarData` i documenta el patró a `/disseny` perquè admeta tant **1 publicador registrat** (vista clàssica) com **2 o més co-publicadors registrats** (p. ex. `Sóc de Poble` + `Associació El Rentonar`, o coordinadores de diversos pobles):
    - **Avatar compost d'estil grup de xat** amb geometria ortogonal Pedra Seca (mosaics quadrats nítids amb filet adaptatiu `--sdp-fons` / `--sdp-vora`, zero pics blancs ni miniatures il·legibles).
    - **Enumeració neta i responsive** dels noms dels publicadors registrats i dels seus pobles fins on càpiga en `@container` (`280 px`, `380 px`, `520 px`, `960 px`), amb accés accessible (`>= 44 px`, WCAG 2.2 AAA) a la fitxa de cadascun dels co-publicadors.
    - **Guarda d'integritat inviolable:** cap string lliure ni entitat sense compte registrat pot aparéixer mai com a publicadora a `BarraTaronja`.
- **T2 · Panell Inline de «Traspàs d'Autoria / Co-Publicació» d'1 Clic (Zero Modals de Configuració):**
  - Dissenya i construeix la interfície inline (sense modal flotant, amb botons centrats per defecte) perquè el superadmin puga seleccionar una pàgina/catàleg (com `/page/receptes`) i, quan una associació real es registre al padró, traspassar-li l'autoria de publicació o afegir-la com a co-publicadora connectant amb el contracte `traspassaPublicacio` de Codex.
- **T3 · Coherència Editorial Viva en les 5 Llengües (`ca`, `es`, `en`, `eu`, `gl`):**
  - Revisa i sincronitza `/versions` (fita `R18 → R19` honesta al 100%), `/page/node-zero` (inclosos el laboratori botànic `Z-Image-Turbo-mflux-4bit` de 67 làmines i la simbiosi Ollama + Hermes Agent), `/page/fediversity` i `/disseny` (documentant el cànon unificat de `CatalegWorkspace`, la Llei de la Barra Taronja i la Co-Publicació Multi-Entitat), respectant al 100% el parser estàtic de `build-social-manifest.mjs` i zero literals `#NNN` que disparen `design_guard.mjs`.
- **T4 · Laboratori Fotobotànic Hiperrealista Verificat (`Zero Confusió Planta-Imatge`) + Marató Autònoma Multi-Loop (`17:30 – 20:30 CET`, 2–3 hores sense el Mestre):**
  - **PROHIBIT ATURAR-SE AL PRIMER PASS:** El Mestre fa la migdiada durant 2–3 hores i ordena treball continu 100% autònom en múltiples **Gauntlet Loops** aplicant l'**Elefant (`egm-zoom-out`) i els Peixets de Google EGM** fins assolir consens total a `../_investigacio_ia_de_poble/261111_1720_mesa_consens_migdiada_r19/TAULER_CONVERSA_I_CONSENS_R19.md` (auto-compactació al `75%` i parada neta a les `20:30 CET`).
  - **Correcció Científica i Expansió Massiva d'Imatges Hiperrealistes de Plantes i Llavors (`P0-118` Onada 2 i 3):**
    1. Purga immediatament totes les al·lucinacions morfològiques detectades a `src/data/patrimoni/laminesBotaniquesNode0.js` (ex. *Olea europaea* amb fulles **oposades**, marge **enter** i flors **tetràmeres**; *Ceratonia siliqua* amb fulles **paripinnades** i marge **enter/ondulat**; *Prunus dulcis* amb flors **solitàries o geminades**; *Ocimum basilicum* morada amb `v3-llavor` i **tetranúcula / núcula**; zero termes inventats com «lanceololances» o «tàlem») contrastant amb les rondes de les escoles del Node 0 (`http://192.168.0.23:11434`).
    2. **Auditoria Visual Multimodal 1 a 1:** Inspecciona visualment les imatges `.webp` actuals de `public/assets/uploads/patrimoni/herbari/`, `banc-de-llavors/` i `arbres-2020/` contrastant-les amb la morfologia real de cada espècie/cultivar. **Cap planta ni llavor pot tindre una imatge que no corresponga al 100% al seu nom científic i popular.** Regenera qualsevol imatge dubtosa i completa massivament noves fitxes hiperrealistes per a les espècies pendents d'`herbariLaTorre117.js` i `bancLlavors.js` usant el motor local Apache-2.0 `/Users/javillinares/.local/bin/mflux-generate-z-image-turbo` (`filipstrand/Z-Image-Turbo-mflux-4bit` sobre `../_investigacio_ia_de_poble/261111_marato_nocturna_r18_sistema_nervios/laboratori_botanic_node0/`) amb validació side-by-side contra foto real de Wikimedia Commons + doble filtre (`gemma3:12b` + la teua pròpia inspecció multimodal).
    3. **Càrrega Diferida (Elefant `egm-zoom-out`):** Fes que el catàleg de `laminesBotaniquesNode0.js` es carregue de forma diferida (`import()` dinàmic dins dels Workspaces de Patrimoni) perquè ampliar-lo a desenes/centenars d'espècies reduïsca encara més el paquet inicial i mantinga WordPress ben per sota del trinquet.
  - **Auditoria Visual del Panell de Control i Consens Multi-IA:** Revisa geomètricament (`375 / 768 / 1440 px`, clar i fosc) totes les eines obertes del Panell de Control (`/control`, `/app/gestoria`, `/app/bar`, `/app/nevera/casa`, `/app/salut`, `/app/genealogia`, `/page/avisador`, `/app/lector`, `/mapa`, `/vehicle`, `/animalets`), conversa amb Claude, Codex i el Node 0 al `TAULER_CONVERSA_I_CONSENS_R19.md` fins resoldre totes les objeccions croades, i emet `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_auditoria_gemini_carbon.md` amb MCR i puntuació `D01`–`D15`.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** Servidor estàtic efímer sobre `dist/` en port lliure, tancat en bloc `finally`.
- **Criteris d'Acceptació:** `tractor-pedra-seca.mjs` `exit 0`, `design_guard.mjs` `0 critics, 0 avisos`, `01_porta_pedra_seca_58px.mjs` `PASS`, `LLEI_07_PARITAT_I18N = 0`, `build:social` verd, contrast WCAG 2.2 AAA verificat matemàticament i `overflowPx === 0` en `375 / 768 / 1440 px`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Imports no estàtics en `src/sections/text/`:** Recorda que qualsevol import dins de `src/sections/text/` ha de ser relatiu `./` dins de la mateixa carpeta perquè `build-social-manifest.mjs` no avorte el build.
- **Literals numèrics `#NNN`:** Evita escriure `#` seguit de 3-8 caràcters hexadecimals en strings o comentaris sense guarda perquè `design_guard.mjs` ho marca com a `raw-color`.

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
