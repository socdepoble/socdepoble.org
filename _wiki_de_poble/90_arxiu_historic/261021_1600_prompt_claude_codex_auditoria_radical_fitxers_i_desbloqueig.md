---
type: prompt
status: esborrany
description: 'Prompt canonic per a Claude i Codex: auditoria radical fitxer per fitxer de socdepoble.org, checklist AyudaWP i desbloqueig P0 botigues'
tags:
  - govern
visibility: private
reflex: sdp:torn_a2bdc047-5728-48aa-b5cc-769832a46e10:a5c11bd8-1461-4bc5-9e30-79c8bdb74192
---
# Auditoria Radical Fitxers, Desbloqueig Botigues i Assimilacio AyudaWP

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. **Estat de l'Escriptori:** Net i verificat amb `porta-olivera.mjs` (0 documents solts de torns passats).
2. **Llibre Mestre:** Consulteu obligatòriament `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
3. **Pla Vigent:** Lligat al pla aprovat `261021_1600_pla_implementacio_auditoria_radical_fitxers_i_desbloqueig.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a2bdc047-5728-48aa-b5cc-769832a46e10:a5c11bd8-1461-4bc5-9e30-79c8bdb74192 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T13:53:30.852Z |
| Modificació | 2026-10-21T13:53:30.852Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | claude-3-7-sonnet / codex |
| Tokens consumits | ~12.000 tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-21T13:53:30.852Z: esborrany creat per la IAIA MarIA amb autorització directa del Mestre per a l'auditoria radical autònoma de vesprada.

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

> **Destinataris del torn actiu:** **Claude Code** i **Gemini** (Gemini 4 / Argon) com a parella d'execució immediata en equip; Codex s'incorporarà de vesprada en una segona passada.

Heu d'assumir la missió en solitari o en equip (mode automàtic, sense bloquejar el Mestre) dividint la feina en tres eixos prioritaris establerts al Llibre Mestre:

1. **Eix A (Salfumant Radical Fitxer per Fitxer · `P0-14`):**
   - Recórrer de dalt a baix l'estructura de `socdepoble.org` (`src/`, `public/`, `tooling/`, `supabase/`, `android/`, `ios/`).
   - Identificar components obsolets, fixtures duplicades, fitxers de proves morts o logs ignorats.
   - Per a cada arxiu qüestionable: emetre justificació tècnica; si no és imprescindible, proposar l'eliminació o moure'l a quarantena.
   
2. **Eix B (Assimilació AyudaWP / Tellado · `P0-13`):**
   - Estudiar `01_produccio/article-ayudawp.md` i els checklist d'AyudaWP.
   - Netejar `wordpress-plugin/` perquè complisca 100% les directrius oficials de WordPress.org (zero trucades remotes no auditades, text-domain únic, sanejament d'entrades).
   - Analitzar els plugins gratuïts de Fernando Tellado (en especial el plugin *Vigilante*) i proposar com transformar les seues proteccions en un tractor cognitiu natiu (`sdp-vigilant-tellado`).

3. **Eix C (Bloquejants Botigues Producció):**
   - `P0-06`: Desplegar `socdepoble.org` a Firebase Hosting (`firebase deploy --only hosting --project soc-de-poble`).
   - `P0-01`: Revocació de `select (contact_email)` per a anònims a `public.organizations`.
   - `P0-08`: Canviar les 11 ocurrències de «conta» per «compte» a `legalContent.js`.
   - `P0-09`: Llevar l'iframe recursiu a `pageContent.js:115`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] **Tasca 1 (Auditoria Salfumant `P0-14`):** Generar informe exhaustiu amb l'inventari raonat de fitxers de `socdepoble.org`.
- [ ] **Tasca 2 (Checklist WordPress.org `P0-13`):** Refactoritzar `wordpress-plugin/` segons la guia de Fernando Tellado.
- [ ] **Tasca 3 (Tractor Vigilant Tellado):** Esbossar el nou tractor cognitiu de seguretat i higiene inspirat en AyudaWP.
- [ ] **Tasca 4 (Desbloqueig Firebase, Botigues `P0-06` i Higiene Xat):** Desplegament web, revisió de textos legals (`P0-08`), i condicionar la crida `xat_fils_meus` a l'existència d'usuari connectat per evitar el 401 a la consola de visitants anònims.
- [ ] **Tasca 5 (Verificació i Proves):** Assegurar que `npm test` es manté 100% verd (>20.300 proves).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- No esborreu fitxers de forma destructiva sense registrar-ne la traça al vostre document d'informe.
- Qualsevol arxiu mogut ha de passar per `.sdp-paperera/` o respectar les carpetes satèl·lit externes (`_builds_de_poble/`, `_menjar_i_beure_de_poble/`).
- Mantingueu el contracte del Web Component intacte (`tests/enxufe-empaqueta.test.mjs`).

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 33bf809f3e982c6466f238664086d7b48b527bb30bb5a07843541902a279b315. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
