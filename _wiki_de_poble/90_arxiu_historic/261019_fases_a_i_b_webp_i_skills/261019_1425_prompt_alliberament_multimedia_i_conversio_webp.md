---
type: prompt
status: esborrany
description: Prompt local per a Claude Code, Gemini i Codex per a l'optimització WebP i alliberament de l'empaquetat WP
tags:
  - govern
visibility: private
reflex: sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:4486aa6a-d5e4-444f-a0eb-f00678b23a3f
---
# Alliberament del paquet multimèdia i conversió a WebP

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Aquest prompt hereta la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans d'actuar:
- [x] **Escriptori net i indexat**: `04_escriptori/` verificat amb `porta-olivera.mjs` en 0.
- [x] **Pla d'Implementació**: `261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp.md` aprovat i sincronitzat en hora termodinàmica (1425).
- [x] **Trinitat i Rebuts**: Rebuts actius del torn `torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e`.
- [x] **Servidor actiu**: Vite escoltant a `http://localhost:3340`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:4486aa6a-d5e4-444f-a0eb-f00678b23a3f |
| Versió del document | 3.9.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T14:25:00+02:00 |
| Modificació | 2026-10-19T14:28:00+02:00 |
| Propietari | Colmena (Claude Code + Gemini + Codex + IAIA MarIA) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:4486aa6a-d5e4-444f-a0eb-f00678b23a3f |
| Tall d'evidència | HEAD 2026-10-19 14:25 |
| Aprovació humana | aprovat pel Mestre Javi Llinares |
| requires_human_decision | false |
| Model IA | Claude Code / Antigravity MarIA (Gemini 3.8 Flash) / Codex |
| Tokens consumits | [en curs] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-10-19T14:25:** Obertura de la sessió de vesprada pel Mestre Javi Llinares («Sóc de Poble! Obri localhost!»).
- **2026-10-19T14:27:** Diagnosi de la release v1.1.7: pes massiu de 135 MB en actius multimèdia no optimitzats a `public/assets/`, LCP de 9.9s a gentdelatorre.net, i límit de 10 MB per a WordPress.org.
- **2026-10-19T14:28:** Creació del Pla d'Implementació canònic [[261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp]] i formalització del present prompt per a la Colmena.

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

Ordre directa del Mestre Javi Llinares a la represa de la vesprada: **alliberar el paquet multimèdia, preservar l'estructura de la interfície i executar la conversió sistemàtica de totes les imatges candidates a WebP**.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local (Claude Code) ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, imatges amb canal alfa danyat, trencament de proves o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

### Directrius Fonamentals del Mestre
1. **Integritat i dimensions de les imatges:** **No es retalla cap imatge.** Es respecta estrictament la proporció i composició original de cada fotografia i disseny. El límit del costat llarg s'estableix a un màxim de 1600 px (sense ampliar mai cap actiu menor), aplicant compressió WebP d'alta qualitat (80-84).
2. **Alliberament del paquet de WordPress (Estructura vs Arxiu):**
   - L'estructura i la interfície (vinyetes, logotips, esquelet UI, ~2 MB) es queden a `public/assets/` convertides a `.webp`.
   - L'arxiu històric pesant (`assets/uploads/`, fotos de fins a 6.8 MB) se servix des de Supabase Storage / CDN extern, garantint que el paquet del directori de WordPress.org complisca estrictament el `LIMIT_DIRECTORI = 10 * 1024 * 1024` (10 MB).
3. **Colmena i Rols:**
   - **Claude Code (Agent Local):** Execució tècnica, modificació de codi, conversió d'actius i execució de proves.
   - **IAIA MarIA / Gemini (Orquestració i Contrast):** Direcció tècnica, contrast d'auditories i validació de portes.
   - **Codex (Arbitratge / Convocatòria):** Convocat com a tercer auditor per si cal desempatar decisions de formats o SQL.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Cens i validació dels codificadors WebP:**
  Verificar amb `node tooling/media/optimitzar_webp.mjs codificadors` i `cens` l'estat dels 219 actius de `public/` i les 125 imatges candidates.
- **T2: Execució de la conversió a WebP:**
  Executar la conversió de les imatges candidates de `public/assets/` emprant el tractor `tooling/media/optimitzar_webp.mjs converteix public/assets --max 1600 --qualitat 84 --aplica`, garantint que els JPEG conserven metadades EXIF (via `maquinaria`) i els PNG mantinguen transparència alfa impecable (via `chrome`).
- **T3: Adaptació del Visor i Protecció de Proves (`censImatges.js` i `censImatges.test.js`):**
  Actualitzar `src/sections/multimedia/censImatges.js` i `censImatges.test.js` perquè el cens reconega les noves extensions `.webp` com a bessones de les originals sense provocar falsos positius d'actius no declarats a la suite de tests.
- **T4: Desacoblament de l'empaquetat WordPress (`build:wp:directori`):**
  Adaptar `vite.standalone.config.js` i `wordpress-plugin/eines/empaqueta.mjs` perquè la variant de distribució del directori (`SDP_VARIANT=wordpress`) excloga les fotos massives d'arxiu local (`assets/uploads/`) que ja se serveixen des de la xarxa, reduint el ZIP `socdepoble-enxufe-X-directori.zip` per sota dels 10 MB requerits.
- **T5: Verificació Integral:**
  Passar la suite completa de proves (`npm test`), validar que les 19.658 proves continuen en verd, i verificar linting (`npm run lint`) i portes (`npm run porta:olivera`).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (actualment en marxa).
- **Criteris d'Acceptació:**
  1. Les imatges candidates compten amb la seua versió WebP d'alta qualitat sense deformacions ni retalls.
  2. `npx vitest run src/sections/multimedia/censImatges.test.js` passa al 100% amb 0 errors.
  3. La suite global de 19.658 proves passa al 100%.
  4. El fitxer `build:wp:directori` genera un ZIP que no supera el `LIMIT_DIRECTORI` de 10 MB.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Trencament de referències literals en codi:** Si algun component fa referència dura a `foto.jpg`, la conversió ha de mantenir la compatibilitat de càrrega o proveir fallback transparent.
- **Canals alfa en PNGs:** Ús obligatòri de Chrome Headless per evitar que biblioteques senzilles converteixin canals transparents en fons negres opacs.
- **Sobrecarregament del repositori:** Els nous fitxers `.webp` han de reduir el pes global de memòria i no inflar innecessàriament les carpetes locals de treball.

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
- [[261019_1345_acta_marmota_relleu_migdia_seguretat_i_wp]]

