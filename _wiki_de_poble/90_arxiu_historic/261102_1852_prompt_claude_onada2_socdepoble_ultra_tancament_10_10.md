---
type: prompt
status: esborrany
description: 'Relleu d''Onada 2 al compte Sóc de Poble Ultra (Opus 5.5 Extra Ultracode, 0% usat): L2b (?ambit= a NotesSection), L2-A1/A2 (claus DialegAmbit), S2.B (HMR Notes), paginació per àmbit i certificació 10/10.'
tags:
  - govern
visibility: private
reflex: sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:e16df184-4345-49c2-b561-6a0915ee8a60
---
# Prompt d'Onada 2 i Certificació 10/10 per a Claude Opus 5.5 Extra Ultracode (Compte Sóc de Poble Ultra · 0% usat)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex/Gemini):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu d'idees, deutes tècnics i memòria permanent de la sessió.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: El Registre i la Instrucció declaren els models i variants vigents (`Claude Opus 5.5 Extra · Ultracode` al compte `Sóc de Poble · Ultra` 0% usat, `GPT-6.1 Astra Ultra` i `Gemini CLI`) i assignen a cadascun un carril exclusiu de fitxers d'escriptura per operar en paral·lel sense col·lisions ni esperes mútues.
- [x] **Pla d'Implementació** generat i vinculat a `_wiki_de_poble/04_escriptori/261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:e16df184-4345-49c2-b561-6a0915ee8a60 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T17:52:53.742Z |
| Modificació | 2026-11-02T17:54:00.000Z |
| Propietari | IAIA MarIA (Antigravity) |
| Aprovació humana | Ordre directa del Mestre Javi al xat (261102, requires_human_decision: false) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Claude Opus 5.5 Extra · Ultracode (Compte Sóc de Poble Ultra · 0% usat) |
| Tokens consumits | 18500 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-02T17:52:53.742Z:** Esborrany creat via `document.mjs context` + `create`.
- **2026-11-02T17:54:00.000Z:** Relleu d'Onada 2 al compte `Sóc de Poble · Ultra` (`Opus 5.5 Extra · Ultracode`, `0% usat`) després del tancament ordenat del compte `Javi Llinares · Ultra` (`94% usat`) i l'aplicació per MarIA de tot el dipòsit de governança (`00_LLEGIM.txt §1`), els kits de Codex i Gemini 4 i la rotació de `.agents/ESTAT.md` (`P2-15`, reduint l'arrencada de 190.023 a 50.929 tokens).

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

Benvolguts **GPT Codex (`GPT-6.1 Astra Ultra`)** i **Gemini 4 (`Gemini CLI`)** (i en reserva **Claude `Sóc de Poble · Ultra`** al 0% per estalviar quota fins divendres):

**AVÍS D'ORQUESTRACIÓ (18:54 CET):**
1. **Claude Code (`torn_d19293b9`, compte `Javi Llinares · Ultra`) HA ACABAT I S'HA ATURAT ORDENADAMENT AL 94% DE QUOTA.** Ja no té cap subagent, Gauntlet ni escriptura activa sobre `socdepoble.org`. Tot el seu lliurament està documentat a `_wiki_de_poble/04_escriptori/261102_1640_auditoria_claude.md` (v1.3.0) i `_wiki_de_poble/04_escriptori/02_investigacio_ia/261102_1640_claude/governanca/00_LLEGIM.txt`.
2. **Protecció de Quota fins Divendres:** El Mestre ha activat el segon compte `Sóc de Poble · Ultra` (`0% usat`, es restablix divendres a les 23:00), però per no consumir la seua quota setmanal amb eixams pesats, **l'Onada 2 (`O2-T1`..`O2-T6`) l'executareu íntegrament GPT Codex i Gemini 4**, i la Directora Tècnica (**IAIA MarIA**) integrarà i verificarà els vostres canvis a l'arbre viu!
3. **Estat de l'arbre viu després de la integració de MarIA (`18:50 CET`):**
   - **Corredor Jarvis (`T1a` + `T8`):** Aplicats `tooling/vite/consola-iaia.mjs`, `scripts/botigues/publica-tot.mjs` i `package.json` (**13/13** Node + **66/66** Vitest).
   - **Frontissa de contingut i `politicaPrivacitat23.migracio.test.js` §18:** Restaurats els dos paràgrafs de l'apartat 14 de `src/sections/text/legalContent.js` al text segellat de la versió `2.3` (`frontissa-contingut.mjs` **16/16**, `politicaPrivacitat23.migracio.test.js` **6/6**, `legal.iaia.test.js` **7/7**), de manera que les **493 suites de `T0` estan ara mateix al 493/493 (9.248 proves verdes, 0 roges)**.
   - **Kits ja aplicats a l'arbre viu per MarIA:**
     * `261102_kit_gemini_xat_iaia_ux` (14/14 fitxers) + recepta `L3-A5` de `00_LLEGIM.txt §6` sobre `src/data/iaiaLocal.js`, `src/sections/xat/enllacos.js` i `src/data/iaiaLocal.atles.test.js` (**172/172** proves verdes).
     * `261102_kit_codex_xat_menus` (4/4 fitxers sobre `Bombolla.jsx` i `CapcaleraConversa.jsx`, tancant `ARB-T2C-01/02`; `qualitat.fantasmes.test.js` **4/4** i `i18n` **635/635**).
     * `261102_kit_gemini_higiene_idea62` (`tests/inventari-directoris.test.mjs` + `.gitignore` unificat amb `._*`).
   - **Rotació de `.agents/ESTAT.md` (`P2-15`):** Executada amb `capitol-estat.mjs --escriu`, reduint l'arrencada de **190.023 tokens** a **50.929 tokens**.

**REPARTIMENT DE CARRILS PER A CODEX I GEMINI 4 (SENSE COL·LISIÓ):**
- **Carril GPT Codex (`GPT-6.1 Astra Ultra`):**
  * **O2-T1 (`L2b` · `T-06`):** Conservar `?ambit=` a `src/sections/notes/NotesSection.jsx` + `NotesSection.ambit.test.jsx`.
  * **O2-T3 (`S2.B` de `P1-71`):** Blindatge d'HMR per a `NotesContext.jsx` / `SessionProvider` separant la identitat del context en un mòdul estable sense components (com `workspaceContextIntern.js`), amb prova d'HMR dedicada.
  * **O2-T5 (`D-T3-1` de `P1-73`):** Paritat total «tria automàtica = primera fila pintada» a `NotesSection.jsx` (`canAutoSelect` refusant la nota preparada quan hi ha una altra nota elegible) i tancament de `[DEFECTE ARB-T3-01]`.
- **Carril Gemini 4 (`Gemini CLI`):**
  * **O2-T2 (`L2-A1 / L2-A2` de `T0`):** Afegir als cinc diccionaris (`src/config/idiomes/{ca,es,en,eu,gl}.js`) `editor.ambit.triat` (`«Triat»`) i `editor.ambit.error.format|rang|enum|llargaria`, i a `src/components/universal/ambits/DialegAmbit.jsx` substituir `TEXT_TRIAT` i `TEXT_PER_CODI` per `t(clau, reserva)`.
  * **O2-T4 (Risc del verificador de `T0`):** Paginació i filtratge per àmbit a `src/sections/verticals/SeccioVertical.jsx` perquè «Mostra més» no mostre pàgines buides quan hi ha molts posts al Mur general.
  * **O2-T6:** Respondre al dissens de Claude (`261102_1640_auditoria_claude.md` Relleu 5) a `261102_1832_auditoria_gemini.md` i comprovar el conjunt complet.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **O2-T1 (`L2b` · `T-06`, P2): Conservar `?ambit=` a l'URL del Bloc de Notes fins que una nota el consumisca:**
  - A `src/sections/notes/NotesSection.jsx`, conservar `?ambit=` a cada reescriptura de la selecció mentre `ambitPendent` siga viu i cap nota l'haja consumit (i preservar-lo en el retorn de Connectar), amb prova de regressió a `src/sections/notes/NotesSection.ambit.test.jsx`.
- **O2-T2 (`L2-A1 / L2-A2` de `T0`): Claus d'i18n pendents de `DialegAmbit.jsx`:**
  - Afegir als cinc diccionaris (`src/config/idiomes/{ca,es,en,eu,gl}.js`) `editor.ambit.triat` (`«Triat»`) i `editor.ambit.error.format|rang|enum|llargaria`, i a `src/components/universal/ambits/DialegAmbit.jsx` substituir `TEXT_TRIAT` i `TEXT_PER_CODI` per `t(clau, reserva)`. Verificar les 6 suites d'`i18n.*.test.js`.
- **O2-T3 (`S2.B` de `P1-71`): Blindatge d'HMR per a `NotesContext` / `SessionProvider`:**
  - Aplicar el mateix patró que a `workspaceContextIntern.js` (`T-05`) separant la identitat del context de Notes/Sessió en un mòdul estable sense components perquè Fast Refresh no deixe el Bloc en «Comprovant la sessió…», amb prova d'HMR dedicada.
- **O2-T4 (Risc del verificador de `T0`): Paginació i filtratge per àmbit a les verticals (`/vehicle`, `/treball`, `/habitatge`):**
  - Assegurar que el «Mostra més» i la càrrega de `SeccioVertical.jsx` / port de contingut no mostren pàgines buides quan al Mur general hi ha molts posts que no són de l'àmbit consultat.
- **O2-T5 (`D-T3-1` de `P1-73`): Paritat total «tria automàtica = primera fila pintada» al Bloc de Notes:**
  - Resoldre `ARB-T3-01` a `src/sections/notes/NotesSection.jsx` (`canAutoSelect` refusant la nota preparada quan la carpeta té una altra nota elegible) i convertir la prova `[DEFECTE ARB-T3-01]` en prova verda de comportament corregit.
- **O2-T6: Auditoria dels kits de continuació de Codex (`higiene_residus` i lot F7 d'`IDEA-48`) i actualització de `261102_1640_auditoria_claude.md` + `03_llibre_mestre_tasques_i_idees.md`:**
  - Auditar l'estat dels kits de Codex i dels dos kits ja aplicats de Gemini 4, i actualitzar la matriu `D01`–`D15` i el Llibre Mestre.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`.
- **Criteris d'Acceptació:**
  1. `npx vitest run` de totes les suites tocades (`NotesSection.ambit.test.jsx`, `DialegAmbit.test.jsx`, `SeccioVertical.test.jsx`, `i18n.*.test.js`, `qualitat.fantasmes.test.js`) 100% en verd (0 roges).
  2. `node tooling/gates/design_guard.mjs --arrel=src` amb `0` crítics i `0` avisos.
  3. Verificació al navegador integrat (`:3340`) de `/notes?ambit=vehicle`, `/vehicle`, `/treball`, `/habitatge` i `/xat` amb `0` errors nous de consola.
  4. Informe `261102_1640_auditoria_claude.md` i dipòsit `00_LLEGIM.txt` actualitzats amb els resultats d'Onada 2.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Escriptura concurrent a diccionaris (`src/config/idiomes/*.js`):** Els kits d'i18n de Codex i de Gemini 4 ja estan aplicats a l'arbre viu; fes sempre `Edit` ancorat, mai `Write` sencer.
- **Frontissa de contingut (`legalContent.js`):** No modifiques `src/sections/text/legalContent.js` perquè la versió `2.3` continue passant `frontissa-contingut.mjs` i `politicaPrivacitat23.migracio.test.js` §18.

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

Tota línia de codi ha de complir el principi d'independència i modularitat.

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 edf7daf4d81ab3640d195369807d5ab047bbc60027abd2663f86de3b076d992a. El rebut acredita entrega, no comprensió.

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
- [[261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]]
- [[261102_1640_auditoria_claude]]
- [[261102_1638_auditoria_codex]]
- [[261102_1832_auditoria_gemini]]
- [[261102_1836_auditoria_maria]]
