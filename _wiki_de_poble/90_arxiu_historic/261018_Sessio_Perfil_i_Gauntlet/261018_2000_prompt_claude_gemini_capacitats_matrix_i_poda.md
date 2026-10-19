---
type: prompt
status: esborrany
description: Prompt d'auditoria i acord entre Claude Code i Gemini per al catàleg 20_capacitats i la neteja de 10_metriques
tags:
  - govern
visibility: private
reflex: sdp:torn_0d46bb7f-8983-471c-a282-a1c5fc34ceb0:c0af1a8a-7829-4384-bc43-5f2a0e5d46b1
---
# Prompt d'Arquitectura Capacitats Matrix i Poda de 10_metriques

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` indexat a `00_index_escriptori.md`, porta Olivera en codi 0.
- [x] **Pla d'Implementació generat**: `261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki.md`.
- [x] **Rebut obtingut**: `sdp:torn_0d46bb7f-8983-471c-a282-a1c5fc34ceb0:c0af1a8a-7829-4384-bc43-5f2a0e5d46b1`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0d46bb7f-8983-471c-a282-a1c5fc34ceb0:c0af1a8a-7829-4384-bc43-5f2a0e5d46b1 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T17:56:52.109Z |
| Modificació | 2026-10-18T20:00:00.000Z |
| Propietari | Maria |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Antigravity 2.0 (MarIA) |
| Tokens consumits | 16200 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **v1.0.0 (261018_2000):** Convocatòria d'acord tècnic i d'auditoria arquitectònica: «Capacitats Matrix (`20_capacitats`) i Poda Higiènica de `10_metriques`». S'instaura el principi dels prefixos 20+ per a extensions i superpoders d'IA (deixant 1-10 per a la vida i govern del poble humà), i s'evacuen de la Wiki activa carpetes i fitxers obsolets cap a `_arxiu_wiki_de_poble/`.

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

Llegiu obligatòriament el Pla d'Implementació associat: `_wiki_de_poble/04_escriptori/261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki.md`.

El Mestre Javi Llinares ha establert una reflexió fonamental i un encàrrec estratègic (Àudios 19:54, 20:01 i 20:16):
1. **L'anomalia de `10_metriques`:** Aquesta carpeta va néixer com un invent temporal de setembre per registrar consums manuals en CSV (`consum_ia.csv`) i dues taules. Hui dia, la telemetria real està consolidada en la Consola Termodinàmica i el `.agents/.diari_sessio.jsonl`. A més, col·lisiona amb `10_actes` en el mateix prefix numèric `10_`. Cal retirar-la íntegrament a `_arxiu_wiki_de_poble/10_metriques/` i netejar els índexs perquè no queden enllaços orfes.
2. **La congestió de `02_investigacio_ia`:** Hi ha 35 subcarpetes de Claude de setembre/octubre que contenen treballs ja consumits o integrats. Cal traslladar-les a `_arxiu_wiki_de_poble/02_investigacio_ia/` per deixar el laboratori de recerca àgil i net.
3. **El Naixement de `20_capacitats` (Catàleg Matrix d'IA):** 
   - La regla dels prefixos: els números 1 a 10 es reserven per al poble humà, la seua vida, govern i memòria (`01_ser`, `02_saber`, `03_actuar`, `04_escriptori`, `05_social`, `10_actes`).
   - A partir del número 20 s'obri l'expansió d'IA: `20_capacitats` (i en el futur `21_estudis_ia_economia`, etc.).
   - Filosofia Matrix: Les IAs no han d'embossar-se el context amb manuals gegants. Cada eina potent externa (com la CLI oficial de Google Workspace `gws`, el motor REA, Google NotebookLM, etc.) té una **fitxa sintètica d'1 pàgina** dins de `_wiki_de_poble/20_capacitats/` amb disparadors (paraules clau), comandes CLI per invocar-la i casos d'ús de poble. Els repositoris i binaris pesats es guarden a les carpetes satèl·lit de `Som de Poble` (`_investigacio_ia_de_poble/`, `_recursos_de_poble/`).
4. **El pes del connector WP (135 MB), Conversió WebP i Allotjament a Supabase Storage (Àudio 20:26):**
   El ZIP del connector de WordPress v1.1.6 pesa 135 MB perquè s'empaqueten directament fotos pesades locals (`DSC00410.JPG` de 6.6MB, etc.) dins de `dist/assets/uploads/`.
   Disposem del tractor operatiu `tooling/media/optimitzar_webp.mjs` (`npm run media:webp`), que converteix a WebP (màx. 1600px, qualitat 84, conservant EXIF) reduint el pes un 96% (de 6.720 KB a 291 KB). Tota foto per a la xarxa s'optimitza en WebP abans de residir a Supabase Storage, permetent que el ZIP del connector quede en només 2-4 MB.
5. **Arquitectura de Xarxa Social Rural Tipus Obsidian (Anti-Facebook):**
   A Facebook es dupliquen posts i es crea un fangar monolític. A Sóc de Poble: **model graf tipus Obsidian**. Si es crea una targeta o pàgina, aquesta té una identitat canònica al Supabase de Sóc de Poble. Si es comparteix o es visualitza en un altre lloc, és **la mateixa pàgina**, i tots els comentaris i reaccions ocorren sobre la mateixa entitat. L'arquitectura ha de ser ultra mal·leable, modular i resilient.
6. **Multimèdia Incrustat per Actor i Protecció Relacional (Àudios 20:16 i 20:34):**
   La galeria d'arxiu multimèdia no només viu a `/multimedia` (SISTEMA), sinó que **s'incrusta directament a la pestanya «Multimèdia» del gestor de perfils** (`#el-meu-perfil` / `DetallMultimedia.jsx`) per a cada actor:
   - **Separació d'autoria per actor:**
     * Persona (Javi Llinares): fotos pujades per Javi.
     * Empresa / Grup (Sóc de Poble, Rentonar): fotos, productes i materials gràfics de l'entitat.
     * Agent IA (IAIA MarIA): il·lustracions, vinyetes i recursos visuals generats per la IAIA MarIA.
   - **Visor i accions:** Al clicar una imatge de la graella, s'obri el visor complet (`VisorDeLArxiu`) amb dades EXIF i resolució, afegint «Posa com a avatar», «Posa com a capçalera» i «Elimina».
   - **Avís relacional de seguretat:** Si una imatge està enllaçada a un post, fitxa o article: *«Atenció: si esborres aquesta imatge, es desvincularà de la publicació [Nom]. Pots substituir-la per una altra o conservar-la»*.
   - **Neteja de fòssils:** Eliminar del cens captures obsoletes (com `2-sidebar.png` v10.38.20) i reflectir la barra lateral viva al manual de disseny (`src/sections/disseny/`).
7. **Unificació del Mercat i Selector de Variants (Àudio 20:22):**
   Rectificació de trellat: un producte del Mercat és un únic node canònic (amb el seu carrusel complet de fotos). **NO es fa una Card per variant** (això fragmentaria el catàleg). Cal retirar de `detailSectionMeta.jsx` el xoriço vertical de targetes repetides i maquetar un selector de variants compacte (píndoles de color/edició) amb un sol botó «Afegeix al cabàs», seguint la jerarquia de Pedra Seca.
8. **Usabilitat d'Enquadrament d'Avatar i Neteja Visual (Àudio 20:36):**
   Eliminar el «mogollón visual» de sota l'avatar a `PerfilEditor.jsx` (botons «Avatar», «Llevar l'avatar», textos de 10 MB). En fer clic damunt de l'avatar o capçalera, s'obri directament el quadre d'ajust (`DialegEnquadrament`) carregant la imatge vigent, permetent desplaçar i fer zoom (per fer la cara més gran i amagar el marc quadrat com a la IAIA MarIA) de forma reajustable, integrant dins del propi quadre els controls de canviar foto, llevar avatar i desar.
9. **Convocatòria a Tres Bandes:** Es convoca formalment a **Claude Code, Gemini i GPT Codex** per auditar i blindar aquest disseny sense solapar esforços.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### 1. Rol de GPT Codex (Backend, Supabase & Integritat de Dades)
- **Contracte de Protecció Relacional d'Imatges:** Dissenyar la consulta o mètode d'integritat (`comprovaUsImatge(id/url)`) per saber si una imatge està referenciada en `posts`, `profiles`, `events` o `mercat`, per alimentar el diàleg d'advertència d'esborrat.
- **Filtratge de Mitjans per Actor a Supabase:** Dissenya la consulta o mètode d'API per recuperar els mitjans d'un actor específic (`author_id`, `author_entity_id`, o àmbit `persona`/`entitat`/`ia`) per alimentar la pestanya Multimèdia del perfil.
- **Estandardització WebP i Desacoblament de l'Enxufe WP (de 135 MB a 2-4 MB):** Auditar el contracte de `mediaResolver.js` coordinant amb el tractor `npm run media:webp` (`tooling/media/optimitzar_webp.mjs`) per servir imatges WebP des de Supabase Storage CDN, excloent `public/assets/uploads/` del build de WP.
- **Model Graf Obsidian i Esquema del Mercat:** Validar la unicitat d'entitats (targetes, pàgines, comerços) i l'esquema de dades de les variants de producte (`variations` a `marketSeed.js` / Supabase).

### 2. Rol de Gemini 4 Argon High (Auditor Adversarial i Enginyeria Inversa REA)
- **Auditoria Adversarial del Codi de Claude:** Revisar els canvis recents a `src/app/contexts/personaDeSessio.js`, `DetallMultimedia.jsx` i el visor de `MultimediaSection.jsx` per detectar possibles regressions de seguretat, fuites de memòria o trencaments d'estil Pedra Seca.
- **Enginyeria Inversa de Patrons de Referència (amb REA):**
  - Patró Google Photos / gestor visual per a la secció Multimèdia.
  - Patró selector de variants d'e-commerce (Gumroad/Stripe minimalista) adaptat a la maquetació editorial de Pedra Seca.
  - Patró WhatsApp / Telegram per a la transmissió d'imatges i xat rural.
  - Patró `googleworkspace/cli` (`gws` en Rust) per a la fitxa de `20_capacitats/`.

### 3. Rol de Claude Code (Constructor de Frontend i Execució Local)
- **Incrustació de Multimèdia a `DetallMultimedia.jsx`:** Incrustar la graella i visor de `VisorDeLArxiu` filtrat per l'actor seleccionat (Javi, Sóc de Poble, IAIA MarIA) en lloc de la targeta aïllada amb una sola foto.
- **Refactorització d'Usabilitat de l'Avatar a `PerfilEditor.jsx`:** Netejar els botons i textos de sota l'avatar; fer que en clicar l'avatar s'òbriga `DialegEnquadrament` amb la imatge vigent per permetre re-enquadrament i zoom interactiu continuat (per a la IAIA MarIA i altres).
- **Implementació de la Protecció Relacional a Multimèdia:** Integrar a `VisorDeLArxiu.jsx` / `MultimediaSection.jsx` el diàleg d'avís abans d'eliminar imatges en ús, i permetre a l'usuari gestionar les seues fotos.
- **Unificació de la Fitxa de Producte al Mercat:** Netejar `detailSectionMeta.jsx` eliminant les targetes duplicades de variants centrades i integrant un selector de variants compacte amb un únic botó de compra.
- **Higiene de Fòssils de Disseny:** Actualitzar el cens de mitjans (`censImatges.js`) per retirar la captura antiga de la barra lateral (`2-sidebar.png` v10.38.20) i assegurar que l'espècimen del manual de disseny utilitza la barra viva actual.
- **Execució i Verificació de Tests:** Passar la suite de proves a la consola local (`npm test`) per assegurar el 100% verd.

### 4. Tasques Comunes i Documentació
- **Poda de `10_metriques` i `02_investigacio_ia`:** Confirmar l'arxivament a `_arxiu_wiki_de_poble/` i neteja d'índexs.
- **Catàleg `20_capacitats`:** Crear `00_index_capacitats.md` i les tres fitxes canòniques (`gws`, `REA`, `NotebookLM`).
- **Acord i Informe:** Emetre l'informe de consens a `_wiki_de_poble/04_escriptori/261018_2005_auditoria_capacitats_matrix_i_poda.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Trencament d'imatges:** Si es lleva `uploads/` sense tindre el resolutor cap a Supabase Storage ben configurat, fallarà la renderització d'imatges de pobles. Cal fer-ho amb comprovacions i fixtures robustes.
- **Trencament de vincles en la Wiki:** Mitigat comprovant `00_index.md` i executant `npm run porta:orfandat` i `npm run porta:teixit`.
- **Modificació destructiva:** Prohibició total de fer servir `rm` sobre documentació històrica. Tot moviment és un trasllat conservatiu a `_arxiu_wiki_de_poble/`.

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

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 107149657693b53e379e027e3680c22b1b188807c7e90b1936e19fce1deee05c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
