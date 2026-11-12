---
type: prompt
status: esborrany
description: 'Ordre executiva per a Codex (ChatGPT Pro 200) en Carril 2 aïllat: Kit R17.2 Avisador Batec de Vida real, drets CC flexibles i matriu 14 al·lèrgens UE per a 149 receptes.'
tags:
  - govern
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:775de2a3-e058-4995-af7f-4a9d5ad8e6f2
---
# Prompt d'Execució Local — Codex · Onada R17: Avisador Configurable, Drets CC i Motor d'Al·lèrgens 149

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` verificat amb `porta-olivera.mjs` i totes les captures ancorades a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actualitzat fins a `P0-95 / IDEA-226`.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 2 exclusiu per a Codex (`ChatGPT Pro 200`) treballant sobre clon net `/tmp/sdp_codex_r17` i lliurant Kit CAS verificat a `../_investigacio_ia_de_poble/261110_kit_codex_r17_avisador_drets_alergens/`.
- [x] **Pla d'Implementació** generat i vinculat al torn (`261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Creat amb `document.mjs context` + `create` preservant al 100% els blocs fixos.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)**: Zero falses promeses mèdiques/seguretat en `/page/avisador`, zero dades d'al·lèrgens inventades sense traçabilitat culinària i validació estricta de longitud (`<= 256` caràcters) en autories.
- [x] **Enginyeria Inversa i Paritat amb REA**: Activat per a contrast de contractes i validació determinista.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:775de2a3-e058-4995-af7f-4a9d5ad8e6f2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-10T22:41:01.792Z |
| Modificació | 2026-11-10T22:43:45.000Z |
| Propietari | maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | ~32.000 tokens (Quota Google AI Ultra: 53% setmanal restant) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-10T22:41:01.792Z:** Esborrany creat sobre tall d'evidència `COMMIT R16b · 0027b698d` (`v1.1.12`).
- **2026-11-10T22:43:45.000Z:** Ordre executiva completa per a Codex (`Carril 2 · Kit R17.2`) cobrint l'Avisador configurable real (`P0-79`), el tractor d'autoria i Creative Commons fins a 256 caràcters (`P0-85`) i la matriu determinista dels 14 al·lèrgens UE per a les 149 receptes (`AH-R17-07`).

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

**Pla de referència vinculat:** `[[261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets]]` i Llibre Mestre `[[03_llibre_mestre_tasques_i_idees]]` (`P0-79`, `P0-85`, `AH-R17-07`, `P0-95`).
**Tall d'evidència i Aïllament Estricte de Carril:** Parteix exclusivament d'`HEAD 0027b698d` (`COMMIT R16b`). Clona l'arbre net a `/tmp/sdp_codex_r17` (sense mutar `src/` de l'arbre viu de `socdepoble.org/`, on opera Claude en Carril 1!) i empaqueta la teua eixida com a **Kit CAS segellat amb SHA-256 i proves verdes** a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261110_kit_codex_r17_avisador_drets_alergens/`. **PROHIBIT** reutilitzar els fitxers descartats de `261110_1440_r16b_arbitratge_claude/` que contenien simulacions rebutjades.
**Eficiència de Quota (`P0-94`):** Estàs al `40%` setmanal restant per a 4 dies (`~9,7%/dia`); executa un sol cicle quirúrgic d'alta precisió i màxima densitat lògica. Tots els mòduls nous o vistes específiques s'han de mantindre desconnectats del tros d'entrada (`lazyRoute` / càrrega diferida, zero engordament de la Closca Pura `P0-95`).

**Mètode d'Execució Obligatori (Mètode MIT de 5 Fases + Quàdruple Tècnica: MIT + Google EGM + REA + craft-anything):**
1. *Fase 1 (Mapa Semàntic):* Inspecciona en detall l'estat actual de `/page/avisador` (`pageContent*.js`, seccions i rutes), `src/sections/text/paginaDeText.js` (línia 69), `src/components/universal/drets/llicencies.js`, `src/sections/text/CopyrightPage.jsx` (o ruta actual de drets) i `src/utils/candidatsAlergens.js` + les 149 receptes de *Què dinem?*.
2. *Fase 2 (Hipòtesis i Regles de Veritat Nua):* Verifica les regles de `tractor-promesa.mjs` i `tractor-vocabulari.mjs` (prohibit usar l'adjectiu *"sobirà/sobirana"* per a IAIA o targetes; prohibit prometre teleassistència 112 o garanties mèdiques).
3. *Fase 3 (Implementació Pura i Determinista al Clon `/tmp/sdp_codex_r17`):* Construeix les tres peces sense col·lidir amb `ReceptaDetailSection.jsx` (Carril 3 Gemini Carbon: si necessites connectar dades d'al·lèrgens, fes-ho a la capa pura `src/utils/candidatsAlergens.js` i dades de receptes mantenint la signatura d'exportació neta i compatible).
4. *Fase 4 (Gauntlet Adversarial Intern + Vitest):* Executa Vitest complet sobre els fitxers nous i les portes `tractor-promesa`, `tractor-vocabulari` i `pressupost-paquet`.
5. *Fase 5 (Empaquetat CAS + Informe Canònic):* Desa el Kit amb `LLEGEIX_ME.md` + manifest `SHA-256` a `../_investigacio_ia_de_poble/261110_kit_codex_r17_avisador_drets_alergens/` i emet la teua auditoria canònica a `_wiki_de_poble/04_escriptori/`.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (`AH-R17-02` / `P0-79` · L'Avisador «Batec de Vida» Real i Configurable a `/page/avisador`):**
  1. Elimina per complet qualsevol botó simulat d'*"Estic bé"* o textos que prometen vigilància mèdica/emergències que el codi no fa (`Llei 0` i `tractor-promesa.mjs`).
  2. Implementa el configurador real d'usuari amb **3 paràmetres clars i persistits** (al perfil/emmagatzematge d'usuari via `backendPort` / preferències sincronitzables):
     - `horesImmobilitat` (p. ex. `4h`, `8h`, `12h`, `24h` sense activitat/batec registrat a l'App durant l'horari diürn actiu).
     - `horaIniciNit` i `horaFiNit` (franja de descans nocturn configurable, p. ex. `22:00` a `08:00`, durant la qual el comptador es pausa i mai genera falses alarmes mentre la persona dorm).
     - `personesConfiansa` (selecció d'1 a 3 contactes/veïns del Xat de Sóc de Poble que rebran un missatge automàtic pel Xat quan se supere `horesImmobilitat` en horari actiu).
  3. Escriu de forma honesta i cristal·lina l'avís de funcionament real: és un avís veïnal cooperatiu pel Xat basat en l'ús de l'App quan el dispositiu té connexió (mai substitueix el `112` ni la teleassistència mèdica homologada). Carrega el component amb `lazyRoute` perquè pese `0 B` a la Closca Pura d'arrencada.
- **T2 (`AH-R17-08` / `P0-85` · Tractor d'Autoria i Creative Commons Flexibles fins a 256 Caràcters):**
  1. En `src/sections/text/paginaDeText.js` (entorn de la línia 69), assegura que es respecte sempre `page.copyright || COPYRIGHT_SDP` sense xafar mai l'autoria específica d'una pàgina o catàleg.
  2. En `src/components/universal/drets/llicencies.js` i la vista de drets (`CopyrightPage`), permet indicar un autor, entitat o associació personalitzada de fins a **`256` caràcters** en qualsevol variant Creative Commons (`CC BY`, `CC BY-SA`, `CC BY-NC`, `CC BY-NC-SA`, `CC BY-ND`, `CC BY-NC-ND`, `CC0`) i en drets reservats/text lliure, amb sanejament pur sense truncar noms compostos.
  3. Fixa amb exactitud literal les dues atribucions ordenades pel Mestre:
     - *Què dinem?*: `CC BY-NC-SA 4.0 Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»`
     - *Catàleg d'Arbres de La Torre*: `CC BY-NC-SA 4.0 Pedro Ferrer Rodriguez · El Rentonar. Natura i Patrimoni.` (mai *"Associació Cultural i Ecològica El Rentonar"*).
- **T3 (`AH-R17-07` · Matriu Determinista dels 14 Al·lèrgens Reglament UE 1169/2011 per a les 149 Receptes):**
  1. Completa i depura `src/utils/candidatsAlergens.js` (i el mapa verificat per recepta) analitzant rigorosament els ingredients reals de cadascuna de les **149 receptes** de *Què dinem?* sobre els 14 al·lèrgens oficials UE (`gluten`, `crustacis`, `ous`, `peix`, `cacauets`, `soja`, `lactics`, `fruitsCrec`, `api`, `mostassa`, `sesam`, `sulfits`, `tramussos`, `moluscos`).
  2. Cada al·lergen en les 149 receptes ha de resoldre deterministament a un dels tres estats reals verificats pels ingredients de la recepta (`conté`, `traces/pot contindre` quan depén d'embovat/brou/acompanyament tradicional ambigu, o `no en porta`), eliminant els `? Sense dada` per omissió sense inventar mai ingredients inexistents, i afegint una nota legal clara que l'avaluació es deriva dels ingredients declarats a la recepta tradicional i que qui cuina ha de verificar sempre l'etiquetatge dels productes utilitzats.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (verificació de tests i portes sobre el clon `/tmp/sdp_codex_r17`).
- **Criteris d'Acceptació:**
  1. `0` ocurrències de botó *"Estic bé"* i `tractor-promesa.mjs` + `tractor-vocabulari.mjs` amb `0` infraccions.
  2. Proves unitàries verdes cobrint el càlcul d'inactivitat amb pausa nocturna (incloent franges que creuen la mitjanit `22:00`→`08:00`), la resolució de llicències fins a `256` caràcters amb les dues cadenes exactes del Mestre, i la cobertura `149/149` receptes × `14` al·lèrgens UE sense `? Sense dada` residual.
  3. Kit CAS complet amb manifest `SHA-256` desat a `../_investigacio_ia_de_poble/261110_kit_codex_r17_avisador_drets_alergens/` i informe canònic registrat a `_wiki_de_poble/04_escriptori/`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Risc sanitari/legal en al·lèrgens i Avisador (`CRÍTIC`):** Tant en al·lèrgens com en l'Avisador cal transparència radical: en cas d'ingredient compost tradicional (p. ex. llonganissa seca comercial, pa ratllat, vi ranci amb sulfits), marcar `conté` o `pot contindre` de forma conservadora i explícita mai `no en porta` per error; en l'Avisador, indicar explícitament que depén de connexió i ús de l'app.
- **Franja nocturna creuant les `00:00` (`MITJÀ`):** Una franja com `22:00`→`08:00` ha de descomptar exactament les hores nocturnes en el càlcul d'`horesImmobilitat` (incloent canvis de dia). Cobreix-ho amb tests deterministes de rellotge fix.
- **Col·lisió amb `ReceptaDetailSection.jsx` (`ALT`):** No edites `ReceptaDetailSection.jsx` (reservat a Gemini Carbon al Carril 3); exposa el resultat en `src/utils/candidatsAlergens.js`.

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
- [[261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[taxonomia_documental]]
