---
type: prompt
status: esborrany
description: 'Ordre nocturna autònoma (~5h, parada neta 06:45 CET) per a Gemini 4 Carbon High: presentació multipoble d''arbres, UI d''eines en beta al panell, /versions R18 i Gauntlet creuat.'
tags:
  - govern
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:9b3c374f-a887-46c9-8a0a-cdadc55553d9
---
# Prompt Marató Nocturna R18 — Gemini Carbon: Portada Multipoble, Panell Beta i Gauntlet Creuat

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` conté exclusivament el Pla i els 3 Prompts vius de l'Onada R18 (`0148`); els 12 documents anteriors estan arxivats a `90_arxiu_historic/`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actualitzat fins a `P0-103 / IDEA-234`.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 3 (`Gemini 4 Carbon High`) en clon efímer aïllat `/private/tmp/sdp_r18_carbon` (prohibit tocar l'arbre viu ni usar `RequestFeedback: true` o ordres que disparen botons humans mentre el Mestre dorm).
- [x] **Pla d'Implementació** generat i vinculat al torn (`_wiki_de_poble/04_escriptori/261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat amb `document.mjs context` + `create`.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)**: Zero estils en línia, zero secrets exposats, paritat i18n en les 5 llengües (`ca`, `es`, `en`, `gl`, `eu`).
- [x] **Enginyeria Inversa i Paritat amb REA**: Geometria `@container` verificada a `280px / 380px / 520px / 960px`.
- [x] **Cron de vigilància finit**: Finestra acotada amb parada neta obligatòria a les `06:45 CET` (`0` dimonis zombies).
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:9b3c374f-a887-46c9-8a0a-cdadc55553d9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T00:52:00.323Z |
| Modificació | 2026-11-11T00:53:30.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovada en conversa 261111 01:38-01:46 CET (Mode Automàtic Nocturn) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | 27100 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-11T00:52:00.323Z:** Prompt canònic per a `Gemini 4 Carbon (High)` (Carril 3) vinculat al Pla `_wiki_de_poble/04_escriptori/261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres.md`.

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

Ets **`Gemini 4 Carbon (High)`**, titular del **Carril 3 (Maquetació Pedra Seca, Presentació Multipoble d'Arbres, Disseny d'Insígnies Beta al Panell de Control, Paritat 5 Llengües i `/versions` R18)** durant la **Marató Nocturna Autònoma `R18`** (~5 hores, **hora límit dura d'aturada: `2026-11-11T06:45:00+01:00`**, zero dimonis zombies i **ZERO botons humans `RequestFeedback: true` o ordres compostes que disparen `force_ask`**).

1. Treballa sobre un clon net `/private/tmp/sdp_r18_carbon` partint de `c07f78b83` + el teu propi `R17.3.patch` + `Kit R17.2 / R17.2B` de Codex.
2. Aplica la **Quàdruple Tècnica (`Mètode MIT` + `Google EGM` + `REA` + `craft-anything`)** i coordina't amb Claude, Codex i el Node 0 a través de `../_investigacio_ia_de_poble/261111_marato_nocturna_r18_sistema_nervios/ESTAT_SINAPTIC.json`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (`P0-100 / IDEA-231` · Pàgina de Presentació General Multipoble de `/page/arbres-monumentals` en 5 Llengües):**
  1. Actualitza el contingut editorial arrel d'`arbres-monumentals` (`src/sections/text/pageContent.js` + `pageContent.r10.js` en `ca`, `es`, `en`, `gl`, `eu`) retirant la llista plana dels 19 arbres de La Torre de la portada general i convertint-la en la **Pàgina de Presentació General de la Llibreria d'Arbres Emblemàtics i Monumentals dels Pobles**: explica amb didàctica clara i trellat com cada poble, ajuntament, universitat, escola o associació (com *El Rentonar* a La Torre de les Maçanes) pot afegir el seu propi llibre/catàleg d'arbres a la Llibreria i exportar/importar les fitxes amb validesa acadèmica.
  2. Respecta escrupolosament les dues lleis de vocabulari i marca del Mestre:
     - **Marca intraductible:** `Sóc de Poble` és SEMPRE `Sóc de Poble` en totes les llengües; el lema/subtítol oficial és `Portal de Pobles Connectats` tant en `ca` com en `es`, i només es tradueix el lema en `en` (`Connected Villages Portal`), `gl` (`Portal de Pobos Conectados`) i `eu` (`Herri Konektatuen Ataria`) — deixa també llest el fitxer de metadades ASO d'App Store Connect per a les 5 llengües!
     - **Vocabulari net:** Zero ocurrències de l'adjectiu vetat per a la IAIA o el xat (neteja també les 2 ocurrències residuals a `_wiki_de_poble/01_ser/agents_equip_ia.md`) i sempre «La IAIA Sabuda» (`/page/la-iaia-sabuda`).
- **T2 (`P0-101 / IDEA-232` · Maquetació Pedra Seca `@container` per a les Rajoles d'Apps «En proves · Beta oberta» + Unificació Visual Gastronomia ↔ Arbres + `/versions` i `/page/sistema-de-disseny`):**
  1. Dissenya en CSS pur Pedra Seca (`components.css` / `modules.css`, `0` inline styles, cantonada `90°` o tokens oficials, botons sempre centrats, `@container` verificat a `280px / 380px / 520px / 960px`) l'estil unificat del `UniversalWorkspace` de 4 columnes entre `/page/receptes` i `/page/arbres-monumentals` i el component/classe `.sdp-insignia-beta-oberta` per a les eines alliberades al Panell de Control.
  2. Actualitza en les 5 llengües `/versions` (`Onada R18`) i `/page/sistema-de-disseny` documentant l'arquitectura de **Nucli Verge + Plugins Desendollables** i la **Separació Continguts (`Data Packages`) vs Estructura**.
- **T3 (Kit CAS Segellat + Bucle Gauntlet Adversarial Creuat + Parada Neta):**
  1. Segella el teu kit amb `kit-carril.mjs` a `../_investigacio_ia_de_poble/261111_kit_carbon_r18_presentacio_multipoble_panell_i_versions/`.
  2. Audita adversarialment en mode Gauntlet `Kit R17.2`, `Kit R17.2B` i `Kit R18.2` de Codex (geometria, accessibilitat WCAG AAA rural, tipografia i microcòpia), escriu el teu veredicte i hashes a `ESTAT_SINAPTIC.json`, emet l'auditoria canònica a `_wiki_de_poble/04_escriptori/` i **ATURA'T NETAMENT sense deixar cap cron ni procés actiu** (com a màxim a les `06:45 CET`).

### Criteris d'acceptació i reproducció
- **URL de proves locals:** `http://localhost:3340/page/arbres-monumentals`, `/page/receptes`, `/control`, `/versions`.
- **Criteris d'Acceptació:** `porta:pedra-seca`, `porta:inlinestyles`, `porta:vocabulari`, `porta:design-guard`, `porta:promesa` i `porta:frontissa` totes amb `exit 0`; paritat 5 llengües verificada; `Nucli Verge <= 250.000 B gzip`; parada neta sense dimonis.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Disparar `force_ask` d'Antigravity mentre el Mestre dorm: prohibit encadenar rutes protegides (`tooling/`, `.agents/`, `scripts/`) amb `rm`, `mv` o `node -e` en una mateixa línia de shell.
- Desquadrament de `frontissa-contingut.mjs`: llistar a `PROVES.md` totes les claus estructurals tocades perquè Claude i MarIA les aproven.

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
