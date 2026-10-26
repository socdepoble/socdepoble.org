---
type: prompt
status: esborrany
description: 'Prompt mestre unificat v3.10 per a la sessió nocturna autònoma de Claude, Codex i Gemini: execució del sanejament de Consola, poda de 944 errors d''enllaços a l''escriptori, cens d''imatges i poda d''skills.'
tags:
  - govern
visibility: private
reflex: sdp:torn_781fa9aa-db61-4c55-9124-baacd8c21800:67c303ef-d4f9-4efe-89f5-0a2b027ed793
---
# Sanejament total de la Consola, Llei del Tauler Net, Mòdul 8 cens d'imatges, Mòdul 9 poda d'skills i deutes tècnics del Llibre Mestre

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` conté únicament els documents actius d'aquesta sessió, indexats a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` resident a l'Escriptori.
- [x] **Repartiment asíncron d'actors locals a disc**: Claude Opus 5.5, Codex Sol Ultra i Gemini 4 Argon / MarIA operant en paral·lel sobre l'arbre natiu.
- [x] **Pla d'Implementació generat**: `_wiki_de_poble/04_escriptori/261026_0210_pla_implementacio_sanejament_consola_tauler_net_i_llibre_mestre.md`.
- [x] **Sentinella de Seguretat**: Checklist verificat (zero ReDoS, RLS fortificada, Storage privat).
- [x] **Rebut obtingut**: `sdp:torn_781fa9aa-db61-4c55-9124-baacd8c21800:67c303ef-d4f9-4efe-89f5-0a2b027ed793`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-261026-0210 |
| Versió del document | 3.10.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T01:05:53.897Z |
| Modificació | 2026-10-26T01:10:00.000Z |
| Propietari | IAIA MarIA |
| Plantilla | prompt_local.md (v3.10.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_781fa9aa-db61-4c55-9124-baacd8c21800:67c303ef-d4f9-4efe-89f5-0a2b027ed793 |
| Tall d'evidència | HEAD cd1bb28a4 (2026-10-26 02:10 CET) |
| Aprovació humana | Mestre Javi Llinares |
| requires_human_decision | false |
| Model IA | Antigravity 2.0 (IAIA MarIA) |
| Tokens consumits | ~12.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-26T01:05:53.897Z: esborrany canònic creat sota torn `torn_781fa9aa-db61-4c55-9124-baacd8c21800`.
- 2026-10-26T01:10:00.000Z: prompt mestre d'execució nocturna autònoma redactat seguint el consens absolut de Claude, Codex i Gemini.

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

Aquest és l'encàrrec nocturn per al Consell d'IAs Locals (Claude Opus 5.5, Codex Sol Ultra i Gemini 4 Argon). El Mestre Javi Llinares se'n va a descansar i deixa el Mas en mans de la Colmena per assolir el **Tauler Net absolut**, la **Consola en verd**, el **cens d'imatges** i la **poda de les 40 skills**:

1. **Execució del Sanejament de la Consola:**
   - Incorporar les 4 esmenes C0145/G0145 de Codex i Gemini al paquet de Claude (`sanejament_consola.sh`):
     - `turns.mjs:201` eximeix `03_llibre_mestre_tasques_i_idees.md` per ruta canònica completa.
     - Sanejar el frontmatter del Llibre Mestre (tags vàlids `[govern, arquitectura, pla]` i secció final `## Vincles`).
     - Resegellar `SKILLS_SEAL.json` amb Compare-And-Swap al hash `7df7a6fc4c997a35f0f89542233eacd79266d2d080e7724b4fbb561538afa97a`.
     - Tancar els torns caducats separant expiració de verificació de fitxers.
     - Deixar el pols actiu a `.agents/ESTAT.md`.
2. **Poda massiva del sediment fòssil de l'Escriptori:**
   - Suprimir les línies 51–1063 de `00_index_escriptori.md` per fulminar d'un colp 944 errors d'enllaços a `VerificadorSCC`.
   - Evacuar els fitxers residuals de `04_escriptori/02_investigacio_ia/` cap a `../_investigacio_ia_de_poble/`.
3. **Mòdul 8: Cens d'Imatges i Llei d'Imatge Única:**
   - Implementar `tooling/media/cens_imatges.mjs` i inventariar les 149 orfes.
   - Planificar la substitució de les 4 imatges esborrany de la Consola (`Actors`, `Salut`, `Fluxos`, `Calendari`) per vinyetes Bruguera/Berlanga autèntiques.
4. **Mòdul 9: Harmonització de les 40 Skills:**
   - Corregir les referències trencades (`schema.js` per `schema.json`, `publicarNota.js`).
   - Poda i fusió dels 4 clústers de solapament cognitiu.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] `[T1]` **Sanejament Consola:** Executar la seqüència segura de sanejament validada per Codex i Gemini.
- [ ] `[T2]` **Portes de Govern:** Comprovar `node tooling/gates/run-portes.mjs --diagnostic` amb 5/5 portes verdes (0 fallades).
- [ ] `[T3]` **Poda de 00_index_escriptori:** Reduir les línies de 1064 a < 100, deixant exclusivament els arxius vius.
- [ ] `[T4]` **Verificador SCC:** Executar `node tooling/gates/verificador-scc.mjs` i verificar la reducció dràstica d'errors.
- [ ] `[T5]` **Cens d'Imatges:** Generar l'informe de traçabilitat de `public/assets/`.
- [ ] `[T6]` **Precommit:** Revalidar `npm run test:precommit` (3.410 proves verdes).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

| Risc | Severitat | Mitigació |
| :--- | :---: | :--- |
| **Fallada transaccional a mitjan sanejament** | Mitjana | Fer assaig en còpia o comprovació prèvia de tots els fitxers abans d'escriure l'arbre viu. |
| **Ruptura de regles en podar skills** | Alta | No esborrar procediments que tinguen eines reals a `tooling/` o tests a `src/`. |
| **Pèrdua de context històric** | Baixa | Tota la memòria està preservada a `90_arxiu_historic/` i a les actes marmota. |

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
- [[261026_0145_auditoria_gemini]]
- [[261026_0145_auditoria_codex]]
- [[261026_0200_acta_marmota_triomf_gauntlet_360_sanejament_consola_i_relleu_nocturn]]
- [[261026_0210_pla_implementacio_sanejament_consola_tauler_net_i_llibre_mestre]]
