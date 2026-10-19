---
type: prompt
status: esborrany
description: Prompt d'auditoria de gran context per a Gemini per revisar les skills, detectar contradiccions i contrastar el pla WebP
tags:
  - govern
visibility: private
reflex: sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:e0f896de-cd52-42af-8849-16084f24bf6c
---
# Auditoria Integral de Skills i Contrast WebP

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Aquest prompt hereta la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT (Gemini):** Aquesta plantilla és **DOGMA**. S'exigeix rigor extrem en l'auditoria, aprofitant la finestra de context massiva per a revisar totes les skills i tractors sense oblidar cap fitxer.

Abans d'actuar:
- [x] **Escriptori net i indexat**: `04_escriptori/` verificat amb `porta-olivera.mjs` en 0.
- [x] **Pla d'Implementació**: `261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp.md` aprovat.
- [x] **Trinitat i Rebuts**: Rebuts actius del torn `torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e`.
- [x] **Servidor actiu**: Vite escoltant a `http://localhost:3340`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:e0f896de-cd52-42af-8849-16084f24bf6c |
| Versió del document | 3.9.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T14:25:00+02:00 |
| Modificació | 2026-10-19T14:38:00+02:00 |
| Propietari | Colmena (Gemini / IAIA MarIA / Claude Code / Codex) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:e0f896de-cd52-42af-8849-16084f24bf6c |
| Tall d'evidència | HEAD 2026-10-19 14:25 |
| Aprovació humana | aprovat pel Mestre Javi Llinares |
| requires_human_decision | false |
| Model IA | Gemini (Gran Finestra de Context) / Antigravity MarIA |
| Tokens consumits | [en curs] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-10-19T14:25:** Obertura de la sessió de vesprada pel Mestre Javi Llinares («Sóc de Poble! Obri localhost!»).
- **2026-10-19T14:36:** Encàrrec específic del Mestre abans d'anar a dinar: posar a Gemini a treballar a fons amb la seua enorme capacitat de tokens en una **Auditoria Integral de Skills (`.agents/skills/`)** a la recerca d'anacronismes, contradiccions i fonts de veritat mortes, combinat amb el contrast adversarial del pla WebP.

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

Ordre directa del Mestre Javi Llinares a la represa de la vesprada: **aprofitar la capacitat de context massiu de Gemini per a executar una Auditoria Integral de Skills (`.agents/skills/`), la destil·lació dels 47 ítems del laboratori (`02_investigacio_ia/`) per alliberar-lo de "taranyes", i el contrast adversarial del pla de conversió a WebP**.

> **MÈTODE GAUNTLET I ANÀLISI FORENSE (Obligatori):** Com a model amb milions de tokens de context, la teua missió és ingerir la totalitat del coneixement procedimental i de laboratori sense oblidar ni un sol racó. S'ha de buscar qualsevol contradicció, anacronisme o font de veritat obsoleta, contrastar-ho amb el codi viu del projecte i redactar un informe clar i accionable perquè Claude Code i la resta de la Colmena puguen executar la neteja sense dubtes.

### Directrius Fonamentals del Mestre
1. **Auditoria i Poda de Skills (`.agents/skills/`):**
   - Fa temps que no es revisen a fons les skills. Moltes han quedat desfasades o contenen anacronismes com *"la font de veritat és aquesta, no com aquesta que era abans"*.
   - Si una font anterior ja no existeix o va ser superada, cal esborrar eixes mencions obsoletes per evitar confusions cognitives (BIOS §1: *Un sol cervell: la Wiki és la Bíblia, les skills són exclusivament tractors procedimentals mecànics*).
   - Detectar si hi ha skills amagades, redundants o que dupliquen procediments de tractors existents a `tooling/`.
2. **Destil·lació de `02_investigacio_ia/` (47 ítems):**
   - El laboratori d'investigació conté 47 ítems (sessions antigues de Claude, prototips de Codex, estudis i paquets de proves) que acumulen centenars d'arxius "fent taranyes".
   - Analitzar l'estudi de destil·lació [[02_investigacio_ia/261013_1600_estudi_destil_laboratori_ia]] i l'estudi d'Obsidian [[02_investigacio_ia/261018_1405_estudi_obsidian_rea_gemini4_iaia]].
   - Identificar quins continguts ja s'han adoptat i integrat a `src/` o a `tooling/` i poden ser arxivats a la carpeta satèl·lit `_investigacio_ia_de_poble/` per alleugerir el repositori Git.
   - Resumir en 1 sol document de conclusions clares els coneixements d'avantguarda que continuen vius per a consulta de Claude, GPT i la Colmena.
3. **Contrast del Pla d'Alliberament Multimèdia i WebP:**
   - Auditar el pla [[261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp]] i validar la decisió de preservar la integritat de les imatges (zero retall, límit costat llarg 1600 px, qualitat 84) i de separar `public/assets/uploads/` del paquet de WordPress per complir el límit de 10 MB.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Cens i escaneig de les 32+ skills de `.agents/skills/`:**
  Revisar cada `SKILL.md` a `.agents/skills/` a la recerca d'anacronismes doctrinals, referències a sistemes morts, regles narratives que no són tractors procedimentals, i inconsistències amb el BIOS vigent.
- **T2: Cens i diagnosi dels 47 ítems de `02_investigacio_ia/`:**
  Revisar l'estat dels 47 elements de `_wiki_de_poble/04_escriptori/02_investigacio_ia/` basant-se en l'estudi `261013_1600_estudi_destil_laboratori_ia.md` i l'estudi d'Obsidian `261018_1405_estudi_obsidian_rea_gemini4_iaia.md`. Classificar què està 100% integrat a codi, què té valor pendent d'adoptar i quines carpetes antigues han de ser traslladades a `_investigacio_ia_de_poble/` per alliberar el repo.
- **T3: Contrast Adversarial del Pla WebP:**
  Verificar que la conversió sistemàtica a WebP plantejada al pla no provoque regressió visual en navegadors antics, que la maquinària de Python preserve l'orientació EXIF de les fotos de La Torre de les Maçanes, i que el desacoblament del contingut d'arxiu permeta el compliment del `LIMIT_DIRECTORI = 10 * 1024 * 1024` a WordPress.
- **T4: Redacció de l'Informe d'Auditoria:**
  Emetre l'informe a `_wiki_de_poble/04_escriptori/261019_1425_auditoria_gemini_skills_i_multimedia.md` seguint la plantilla d'auditoria canònica.

### Criteris d’acceptació i reproducció

- **Criteris d'Acceptació:**
  1. Llista negra exacta de frases obsoletes i anacronismes detectats a `.agents/skills/`.
  2. Dictamen clar sobre quins dels 47 ítems de `02_investigacio_ia/` estan llestos per a trasllat a `_investigacio_ia_de_poble/`.
  3. Síntesi destil·lada d'Obsidian REA i lliçons d'avantguarda per a Claude i GPT.
  4. Vistiplau i matisos al pla de conversió WebP.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Eliminació accidental de tractors en ús:** Abans de proposar la poda de qualsevol skill o referència, verificar si algun script de `tooling/` o hook de Git en depèn.
- **Pèrdua de context històric:** Tota informació que s'arxive de `02_investigacio_ia/` s'ha de traslladar exclusivament a les carpetes satèl·lit de `Som de Poble` (`_investigacio_ia_de_poble/`), mai esborrar-se de forma destructiva.

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
- [[261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp]]
- [[02_investigacio_ia/261013_1600_estudi_destil_laboratori_ia]]
- [[02_investigacio_ia/261018_1405_estudi_obsidian_rea_gemini4_iaia]]
- [[261019_1345_acta_marmota_relleu_migdia_seguretat_i_wp]]

