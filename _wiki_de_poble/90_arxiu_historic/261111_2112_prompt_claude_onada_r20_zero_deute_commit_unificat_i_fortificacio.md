---
type: prompt
status: esborrany
description: 'Encàrrec autònom multi-bucle per a Claude al Carril 1: reconciliar kits R19, tancar COMMIT R18+R19 net i liquidar el deute tècnic de suites i /app/* fins a esgotar tokens.'
tags:
  - govern
visibility: private
reflex: sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:b159569a-fe9c-4228-a610-cb5436d92348
---
# Prompt Carril 1 (Claude Opus 5.5 Extra · Ultracode) — Onada R20 Nocturna · Zero Deute, Commit Unificat R18+R19 i Fortificació 10/10

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex/Gemini):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu d'idees, deutes tècnics i memòria permanent de la sessió.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: El Registre i la Instrucció declaren els models i variants vigents (`Claude Opus 5.5 Extra · Ultracode`, `GPT-6.1 Sol Ultra` / `Astra`, i `Gemini 4 Carbon High`) i assignen a cadascun un carril exclusiu de fitxers d'escriptura per operar en paral·lel sense col·lisions ni esperes mútues.
- [x] **Pla d'Implementació** generat i vinculat al torn (`document.mjs plan`): `_wiki_de_poble/04_escriptori/261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio.md`.
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat que el prompt naix de `document.mjs context` + `create` i conserva íntegres els spans de codi (`` `ruta` ``) dels blocs normatius sense mutilacions.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (zero spread JSONB sense coacció, zero regex amb backtracking O(n), RLS per columna, Storage privat i purga de claus d'autoritat).
- [x] **Enginyeria Inversa i Paritat amb REA**: Verificat l'ús de REA ('reverse-engineer-anything') per a disseccionar referències i estructures natives o de botigues sense reinventar la roda.
- [x] **Cron de vigilància**: Coordinació asíncrona mitjançant `04_escriptori/` i `../_investigacio_ia_de_poble/261111_2112_mesa_consens_nocturna_r20/TAULER_CONVERSA_I_CONSENS_R20.md`.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:b159569a-fe9c-4228-a610-cb5436d92348 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T20:15:18.036Z |
| Modificació | 2026-11-11T20:18:00.000Z |
| Propietari | Claude Opus 5.5 Extra · Ultracode (Carril 1 · Arbre Viu) |
| Aprovació humana | aprovada pel Mestre Javi Llinares (2026-11-11 21:05 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) · IAIA MarIA (Orquestradora) -> Claude Opus 5.5 Extra · Ultracode |
| Tokens consumits | ~26.000 (preparació d'orquestració R20) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-11T20:15:18Z (v1.0.0):** Convocatòria canònica de l'`Onada R20` per a **Claude (`Opus 5.5 Extra · Ultracode`)** al Carril 1 (únic executor sobre l'arbre viu `socdepoble.org/`).

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

**ORDRE DIRECTA DEL MESTRE JAVI LLINARES (`Onada R20 Nocturna · Zero Deute Tècnic i Funcions 10/10`):**
Ets **Claude (`Opus 5.5 Extra · Ultracode`)**, l'únic agent amb autoritat d'escriptura i Git sobre l'arbre viu `socdepoble.org/`. Codex (`Carril 2`, en `/tmp/sdp_codex_r20`) i Gemini Carbon (`Carril 3`, en `/tmp/sdp_carbon_r20`) treballen en paral·lel sense tocar l'arbre viu. Treballaràs de forma 100% autònoma en **bucles atòmics consecutius fins a deixar el deute tècnic liquidat o esgotar la teua quota de tokens restant** (amb auto-compactació al 75% volcant progrés a l'informe sense aturar-te). **PROHIBIT inventar funcionalitats noves d'aparador**: el Mestre vol que TOT el que ja tenim funcione a la perfecció i quede netament consolidat a `HEAD`.

**Lectures obligatòries d'entrada (abans d'editar res):**
1. `_wiki_de_poble/04_escriptori/261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio.md`
2. `_wiki_de_poble/04_escriptori/261111_1741_auditoria_claude.md` (el teu propi relleu d'R19)
3. `_wiki_de_poble/04_escriptori/261111_1822_auditoria_codex.md` + `../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/README_INTEGRACIO.md`
4. `_wiki_de_poble/04_escriptori/261111_1951_auditoria_gemini_carbon.md` + `../_investigacio_ia_de_poble/261111_kit_carbon_r19_barra_taronja_composta_i_editorial/README_INTEGRACIO.md`
5. `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (últimes seccions)

**Quàdruple Tècnica Cognitiva Obligatòria en cada Bucle (`Mètode MIT 5 Fases + Google EGM Elefant i 8 Peixos + REA + craft-anything`):**
- **Fase 0 MIT:** Creua sempre doctrina, codi real, tests i cas d'ús humà real (mai un sol fitxer aïllat).
- **Fase 1 MIT:** Identifica els 5 nuclis semàntics del canvi i què trencaria o milloraria a la resta del sistema.
- **Fase 2 MIT (Feynman):** Solucions simples, zero sobreenginyeria i zero excepcions *hardcoded*.
- **Fase 3 MIT (Test Socràtic):** Comprova casos límit (mòbil `375px`, encastat WordPress/Sollutia, offline, `Foraster` sense sessió, AAL2).
- **Fase 4 MIT + Gauntlet Loop:** Auto-audita i contrasta amb el Node 0 (`http://192.168.0.23:11434`, `num_predict >= 900`, resposta neta `>= 120` caràcters) abans de cada commit.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **Bucle 1 (Prioritat P0 Absoluta — Primer tancar el `COMMIT R18 + R19` net a `HEAD` abans que s'esgoten els tokens):**
  1. **Correccions d'Honestedat i Portes (`Llei 0`):**
     - `P1-ALERGENS-02` a `src/sections/text/pageContent.patrimoniR14.js` (`ca, es, en, eu, gl`): substitueix la frase falsa *"La proposta mai diu que no n'hi haja"* per la teua redacció exacta aprovada pel Mestre i MarIA: *"Quan una fila diu «— No en porta segons el text», descriu el text del llibre, no el plat: només una persona pot declarar que un al·lergen no hi és."* (i equivalents fidels en les altres 4 llengües).
     - `DRETS_QUE_DINEM` a `src/sections/text/pageContent.dretsPatrimoni.js` + `src/sections/text/pageContent.patrimoniR14.js`: harmonitza l'atribució perquè diga exactament el que acredita la font primària verificada (permís d'ús educatiu/comunitari sense atribuir una llicència CC no documentada a l'obra font).
     - `tests/natiu-build.test.mjs` (línies `742-749`): actualitza les dues assercions desfasades post-R18 (`pageContent.patrimoniR14.js` només pot importar la fulla pura `./pageContent.dretsPatrimoni.js`, i `RECURSOS_NOMES_DEL_HEAD` comprova `assets/uploads/patrimoni/receptes-ibanez-social-1200x630.jpg`).
     - `src/data/adaptadors/noticies/README.md`: escurça `description` al frontmatter de `271` a `<= 220` caràcters perquè `npm run porta:frontmatter` done `0` avisos.
  2. **Assimilació Reconciliada dels 2 Kits CAS Segellats d'R19:**
     - Assaja primer en sec i aplica `python3 ../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/verifica_i_aplica.py --target . --apply` (`203` operacions; MarIA ja ha verificat `0` deriva CAS contra l'arbre viu).
     - Audita i reconcilia `../_investigacio_ia_de_poble/261111_kit_carbon_r19_barra_taronja_composta_i_editorial/` (l'única deriva CAS és la línia 101 de `src/sections/text/pageContent.r10.js` amb `<a href="/plugin/genealogia">`: conserva eixe enllaç teu + aplica el pegat creuat `../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/evidencia/creuada/carbon-ruta-registre-opcional.patch` + **esmena `FITA_R19` a `pageContent.r10.js` en les 5 llengües perquè NO diga que s'incorporen fotos generades, sinó la veritat exacta: quarantena reversible de les 67 làmines sintètiques, 24 estudis morfològics corregits i mòdul diferit de `0 B` a l'arrencada**).
     - Conserva intactes a l'arbre viu els canvis d'aquesta nit del Mestre i MarIA: `ios/App/App/Info.plist` (`CFBundleURLSchemes` per a Google iOS), `supabase/migrations/2611112005_mur_lectura_publica_foraster.sql` i `tests/botigues.produccio.test.js`.
  3. **Regeneració, Frontissa i Segellat `COMMIT R18 + R19`:**
     - Regenera si escau `voresImatges.json`, `wikiManifest.js` i `rag-index.json`.
     - Verifica i aprova legítimament les 9 claus de `node tooling/gates/frontissa-contingut.mjs` una vegada corregits els textos.
     - Passa `porta-olivera.mjs`, `porta:frontmatter`, `tractor-cens.mjs`, `tractor-rls.mjs`, `tractor-pedra-seca.mjs`, `eslint --max-warnings=0`, proves tocades + `natiu-build.test.mjs` + `botigues.produccio.test.js`, `build:web`, `build:wp` i `build:natiu`.
     - Fes el **commit net d'`R18 + R19` a `HEAD`** (si el diff binari supera els `16 MiB` del hook, parteix-lo en 2 commits atòmics nets; **MAI uses `--no-verify`**).
- **Bucle 2 (Liquidació de Deute d'`/app/*` i Suite Global Vitest):**
  1. Repara el doble segment `/app/nevera/casa` → `/app/nevera/casa/casa` que vas detectar en R19 i assegura que totes les vistes obertes `/app/*` (`Genealogia`, `Gestoria`, `Bar`, `Nevera`, `Salut`, `Lector`, `Avisador`) tinguen un `<h1>` semàntic real i zero errors de consola.
  2. Executa la suite global de Vitest per dominis/lots per localitzar i reparar les proves roges heretades sense bloquejar la màquina, fent commits atòmics verds a mesura que neteges cada lot.
- **Bucle 3+ (Assimilació dels Kits `R20` de Codex i Carbon fins a esgotar tokens):**
  1. Comprova `../_investigacio_ia_de_poble/261111_kit_codex_r20_*` i `../_investigacio_ia_de_poble/261111_kit_carbon_r20_*` i les auditories noves a `04_escriptori/`.
  2. Audita'ls en còpia efímera, integra les peces 10/10 verificades, executa `npx cap sync ios && npx cap sync android` i segella `COMMIT R20` net abans d'esgotar tokens.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port efímer lliure tancat en acabar).
- **Criteris d'Acceptació:**
  1. `HEAD` avança des de `c07f78b83` amb `COMMIT R18 + R19` net i totes les portes constitucionals en `EXIT 0`.
  2. `frontissa-contingut.mjs` (`0` claus pendents), `eslint --max-warnings=0` (`0` errors/avisos), `natiu-build.test.mjs` verd, `build:web` `<= 250.000 B` gzip-9, `build:wp` i `build:natiu` verds.
  3. Informe canònic `261111_HHMM_auditoria_claude.md` amb matriu `D01–D15` puntuada sobre 10, llista exacta de commits fets i el que quede pendent amb total sinceritat (`Llei 0`).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Límit de `16 MiB` de diff binari al hook pre-commit:** Divideix en commits separats si l'escenificació d'actius binaris/quarantena supera `16 MiB`; prohibit `--no-verify`.
- **Quota de tokens limitada en Ultracode:** No gastes tota la quota passant 500 suites lentes abans d'haver segellat el **Bucle 1 (`COMMIT R18 + R19`)**! Primer consolida `COMMIT R18 + R19` amb les portes i suites dels mòduls tocats en verd, i després dedica la resta dels tokens al Bucle 2 i Bucle 3.
- **Secrets locals:** No escenifiques mai `.env*` ni `.env.natiu.local`.

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
