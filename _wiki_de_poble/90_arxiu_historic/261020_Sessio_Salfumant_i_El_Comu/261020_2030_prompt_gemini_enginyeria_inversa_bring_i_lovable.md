---
type: prompt
status: canonic
description: Prompt d'enginyeria inversa REA per a Gemini 4 Argon per desmuntar Bring! i Lovable i unificar la llista reactiva del Rebost, TPV i Cens de Colles
tags:
  - govern
visibility: private
reflex: sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:c0208939-812f-499e-8dfd-3ae76d0e68be
---
# Prompt d'Execució i Auditoria Local

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] L'Escriptori està net segons la definició de l'Olivera (`node tooling/gates/porta-olivera.mjs` torna 0).
- [x] Pla d'Implementació vinculat: `_wiki_de_poble/04_escriptori/261020_1300_pla_implementacio_botigues_i_auth_mobil.md` (aprovat pel Mestre).
- [x] Frontmatter hereta tots els camps obligatoris (`type`, `status`, `description`, `tags`, `visibility`, `reflex`).
- [x] Estat de Git a l'HEAD: `6d50d01d` (branca `backup-notes-publish`), Fase D tancada per Claude Code amb 20.174 proves en verd.
- [x] Objectiu del torn: Enginyeria Inversa REA de Bring! (`web.getbring.com`) i Cens de Vila Gal·la (`gali-costume-hub.lovable.app`) per a la trilogia del Rebost, TPV i Cens de Colles.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:c0208939-812f-499e-8dfd-3ae76d0e68be |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T17:30:32.985Z |
| Modificació | 2026-10-20T19:30:00.000Z |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.9.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:c0208939-812f-499e-8dfd-3ae76d0e68be |
| Tall d'evidència | 6d50d01d 19:30 |
| Aprovació humana | Mestre Javi Llinares |
| requires_human_decision | false |
| Model IA | Gemini 4 Argon |
| Tokens consumits | ~15k / 2M |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-20T17:30:32.985Z: esborrany creat sota el torn `torn_1be1a18c-b5b1-45c7-9492-a8f481f25682`.
- 2026-10-20T19:30:00.000Z: prompt completat per a Gemini 4 Argon. El Mestre ha donat instrucció expressa per àudio per desmuntar l'arquitectura de Bring! i del Cens de Vila Gal·la de Lovable, unint el Rebost, el Bar/TPV i les Colles en una sola targeta reactiva viva al xat de grup de WhatsApp (`sdp-clon-whatsapp`).

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

Executar una anàlisi d'enginyeria inversa (REA) quàdruple sobre:
1. **Bring!** (`https://web.getbring.com/`): ergonomia de compra tàctil i cistella col·laborativa.
2. **Loyverse POS & Back Office** (`https://loyverse.com/es` i captures a `01_produccio/loyverse_clon/`): TPV de venda ràpida mòbil/tauleta, Back Office web per a costos de proveïdor vs preus de venda, variants, modificadors i gestió d'estocs.
3. **Cens de la Vila Gal·la / Lovable** (`https://gali-costume-hub.lovable.app`): assignació de rols, quotes i reserva comunitària.
4. **Pedra Seca de Sóc de Poble**: unificació en un sol model de dades nuclear desintegrable (Mode Rebost, Mode TPV, Mode Colla/Disfresses, Mode Banda) encastable com a `UniversalListCard` reactiva viva al xat de WhatsApp de grup (`sdp-clon-whatsapp`).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1 · Objectiu Estratègic: La Quàdruple Aliança de la Llista Reactiva Viva
Al Mas Virtual "Sóc de Poble", hem identificat que diverses funcionalitats clau del món rural són, en el fons de la seua estructura de dades, **la mateixa entitat matemàtica reactiva**:
1. **El Rebost Comunitari (La compra del Mas):** Llista de queviures compartida entre els membres d'una llar o mas, on cadascú marca què falta i què ja s'ha comprat. Inspiració referent: **Bring!** (`https://web.getbring.com/`).
2. **El Bar / TPV del Poble (Mode Bar i Mode Rebost):** Gestió de tapes, begudes, comandes de barra, tiquets oberts i cobraments ràpids per a la cantina de festes o el bar social (amb experiència prèvia real del bar La Parroquia a La Torre). Inspiració referent: **Loyverse TPV i Back Office** (`https://loyverse.com/es`, `sdp-clon-loiverse` i captures a `01_produccio/loyverse_clon/`).
3. **El Cens de Colles i Festes (Disfresses, rols i aportacions):** Gestió de rols comunitaris per a una comparsa o dinar popular (ex. qui va d'Astèrix, qui d'Obèlix, qui porta la paella, qui la carn). Inspiració referent: **Cens de la Vila Gal·la a Lovable** (`https://gali-costume-hub.lovable.app`).
4. **La Banda de Música i Actuacions (Gestió de Músics i Caixets):** Gestió de músics convocats per a cada cercavila o concert, diferenciant músics contractats d'aprenents, assistències i pagaments.

### Tasca 2 · El Problema Rural: El Desastre dels 700 Missatges de WhatsApp
Als pobles i colles, quan s'organitza una festa, un dinar popular o la compra per a la caseta, algú obri un grup de WhatsApp i comença el caos: una llista en un missatge de text que la gent copia i torna a pegar afegint el seu nom. Al cap de 20 minuts hi ha 15 versions en conflicte, 700 missatges no llegits, gent que compra dues vegades el mateix i ningú sap quin és l'estat real.

**La Solució Arquitectònica de Sóc de Poble (Pedra Seca):**
- Quan en un grup de xat (`sdp-clon-whatsapp`) s'activa o comparteix una d'aquestes llistes col·laboratives, **NO s'envia una allau de missatges de text morts**.
- S'incrusta una **única UniversalListCard reactiva viva** dins del flux de la conversa del grup.
- Qualsevol membre del grup toca un element directament des del xat (un sol toc per reclamar "Panoramix", afegir una canya al tiquet, o marcar "Tomaca de penjar: Comprat"), i l'estat s'actualitza en temps real per a tots els participants via subscripció reactiva (Supabase Realtime).
- A més, la creació del grup o llista desencadena una **doble escriptura automàtica**:
  a) Genera una `UniversalCard` pública o comunitària al Mur del poble (`#xat` o `#comunitat`).
  b) Registra una targeta viva al quadern personal de l'autor a `UniversalWorkspace` (`Notes` / "Els meus grups i llistes"), perquè el creador en conserve la sobirania i gestió.

### Tasca 3 · Desmuntatge Tècnic REA de Bring! (`https://web.getbring.com/`)
1. **Patró d'Interacció Tàctil:** Com resol Bring! la graella visual de productes (icones clares, 1 toc per canviar entre "Falta" i "Al cistell", pulsació llarga per a detalls/quantitats).
2. **Model d'Estat i Resolució de Conflictes:** Com gestiona la concurrència quan diversos membres de la família compren a la vegada sense bloquejos pessimistes.
3. **Adaptació a Pedra Seca:** Com traduir aquesta ergonomia tàctil als components de disseny de Sóc de Poble sense dependències pesades externes.

### Tasca 4 · Desmuntatge Tècnic REA de Loyverse POS & Back Office (`https://loyverse.com/es`)
*(Consulteu també les captures reals a `01_produccio/loyverse_clon/`, `loyverse_clon_ipad/` i `loyverse_clon_mobil/`)*
1. **Arquitectura Dual (Back Office Web vs TPV Tàctil Mòbil/Tauleta):**
   - Com divideix Loyverse la gestió de catàleg, costos de proveïdor, estoc i preus de venda (Back Office per a pantalla gran) de la interfície de venda tàctil ràpida (TPV per a tauleta/mòbil).
2. **Preus de Proveïdor vs Preus de Venda (Comparador Rural):**
   - Com estructura Loyverse el cost de compra (`cost`) enfront del preu de venda al públic (`price`), el marge i els proveïdors associats.
   - Com aprofitar aquesta estructura per permetre la comparació de la cistella: quant costa comprar a la botiga del poble vs quant costa anar a Mercadona o a una gran superfície.
3. **Variants, Modificadors i Productes Compostos:**
   - Modelatge d'opcions atòmiques: amb gel/sense gel, format (tapa / ració / entrepà / got / ampolla), ingredients afegits o retirats.
4. **Gestió de Tiquets Oberts i Comandes:**
   - Com manté les taules, barres o comandes pendents abans del tancament o cobrament.

### Tasca 5 · Desmuntatge Tècnic REA del Cens de Vila Gal·la (`https://gali-costume-hub.lovable.app`)
1. **Mecànica d'Assignació i Concurrència:** Com s'estructura el cens de 60 rols, la reclamació en temps real (`claimed_by`, `claimed_at`), i les regles per evitar que dos usuaris reclamen el mateix personatge.
2. **Dualitat de Vistes (Targeta / Taula):** Com commuta entre vista visual de personatges i vista de control tabular amb barra de progrés (`X/60 assignats`).
3. **Filtres i Cerca Instantània:** Com gestiona els segments (`Tots`, `Lliures`, `Agafats`, `Per a menuts`) amb rendiment de 60 FPS en mòbil.

### Tasca 6 · Desmuntatge del Llegat Comunitari de la Banda de Música i Associacions Rurals
*(Consulteu els arxius reals a `_wiki_de_poble/04_escriptori/01_produccio/Banda La Torre - Gestió/`)*
Tots els pobles valencians i rurals tenen com a mínim una banda de música o associació cultural vertebradora. El Mestre Javi Llinares, en la seua etapa com a president de la Societat Musical "L'Aliança" de La Torre de les Maçanes (cap al 2006-2008), va sistematitzar en fulls de càlcul tres processos fonamentals que ara hem de sublimar en Sóc de Poble perquè qualsevol veí puga gestionar-los sense dependre d'experts en Excel:

1. **Full d'Eixides i Planning de Contractes (`Full_dEixides_-_Plantilla.xls`, `Planning Contrates 2007.xls`, `full-eixides-socdepoble.xls`):**
   - Resolució de la convocatòria en un sol foli A4: acte, data, horaris, municipi de destinació (ex. festes de Xixona, El Palamó...).
   - Balanç de plantilla: quants músics demana l'organitzador ("Volen: X") vs quants músics han confirmat ("Anem: Y").
   - Desglossament per instruments (bombardino, trompa, percussió, fusta...).
   - Diferenciació econòmica de rols: músics de plantilla (de la casa / aprenents) vs músics eventuals / contractats (amb el seu caixet corresponent).
   - Logística de transport: registre de cotxes particulars i places disponibles.
2. **Control de Loteria de Nadal i Finançament d'Associacions (`Full_de_control_loteria_nadal.ots`):**
   - Gestió de dipòsits de dècims als comerços i bars col·laboradors del poble (ex. Bar l'Amber, Bar de l'Adrià...).
   - Preu de cost facial (20 €) enfront de preu de venda comunitari amb recàrrec (23 €), generant un 15% de benefici net per a l'associació.
   - Circuit de signatures: dècims entregats, devolució de dècims sobrants no venuts i liquidació final de cobraments.
3. **Escola d'Educands i Seguiment Formatiu (`Model Fitxa dAlumne 2007.xls`, `model_ficha_alumno_banda_1020.jpg`):**
   - Avaluació motivadora i qualitativa (no punitiva): gràfiques sparkline d'evolució mensual per matèria (Solfeig, Teoria, Canya, Percussió, Informàtica).
   - Diàleg de tutoria compartida: observacions creuades entre el professor i els pares/tutors.
   - Cronograma setmanal de classes i horaris de la Casa de Cultura.

### Tasca 7 · Proposta d'Unificació Arquitectònica (Tractor Pedra Seca)
1. **Model de Dades Nuclear i Desintegració Atòmica:**
   - Defineix un esquema universal en JSONB/Supabase per a un **Recurs Atòmic Rural**:
     * Un ítem pot ser una unitat atòmica (un casc de romà, una cervesa, una tomaca, un músic trompeta, un dècim de loteria) o un conjunt compost (una disfressa sencera, un menú/dinar popular, una comanda de taula, una banda completa per a cercavila, un talonari de loteria).
     * Camps nuclears comuns: `id`, `slug`, `nom`, `categoria`, `imatge_icona`, `metadades_especifiques`.
     * Capes contextuals que s'activen o amaguen segons el mode:
       - **Mode Rebost:** `estat` ('falta', 'al_cistell', 'comprat'), quantitat, unitat.
       - **Mode TPV / Bar:** `cost_proveidor`, `preu_venda`, `iva`, `modificadors`, `tiquet_id`, `estat_comanda` ('demanat', 'servit', 'cobrat').
       - **Mode Colla / Disfresses:** `personatge`, `components` (casc, túnica...), `claimed_by`, `quota_festa`.
       - **Mode Banda / Eixides:** `instrument`, `rol` ('aprenent' vs 'contractat'), `caixet`, `assistencia` ('confirmada', 'baixa'), `cotxe_assignat`.
       - **Mode Loteria / Associació:** `depositari` (bar o persona), `decims_entregats`, `decims_retornats`, `total_liquidat`.
       - **Mode Educands:** `assignatura`, `evolucio_mensual`, `observacions`.
2. **Component `UniversalListCard`:**
   - Com s'ha d'incrustar com a missatge reactiu viu dins de `src/modules/xat/` (`sdp-clon-whatsapp`), mantenint 60 FPS en pantalles petites (375px) sense desbordaments ni repintats massius.
3. **Doble Escriptura i Sobirania:**
   - Com coordinar la creació del grup de WhatsApp amb la targeta pública del Mur (`UniversalCard`) i l'entrada viva al quadern personal (`UniversalWorkspace` / Notes).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Sobrecàrrega del canal realtime:** Si cada toc envia un payload pesat, 20 persones tocant a la vegada en una festa poden saturar els missatges de Supabase. Cal optimitzar amb canvis d'estat atòmics (patches mínims o RPC).
- **Fricció en mòbil petit:** Dits de camp en pantalles de 375px (iPhone SE) necessiten botons amb una zona tàctil mínima de 44x44px i feedback hàptic immediat.
- **Drets d'imatge i contingut:** Com estipula la skill `sdp-clon-loiverse`, les imatges reals d'internet utilitzades inicialment al TPV de la Parròquia s'han de generar o substituir amb il·lustracions pròpies del Nano d'Antigravity abans de qualsevol visibilitat pública.

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
- [[261020_1300_pla_implementacio_botigues_i_auth_mobil]]
- [[261020_1518_auditoria_claude_fase_d_auth_mobil_i_moderacio]]
