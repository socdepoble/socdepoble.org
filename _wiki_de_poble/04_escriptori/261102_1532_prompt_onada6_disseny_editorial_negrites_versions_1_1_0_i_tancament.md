---
type: prompt
status: esborrany
description: 'Onada 6: Salt a v1.1.0, crònica a /versions amb H4 + paràgrafs de 6-8 negretes d''escaneig ràpid, enriquiment editorial de tota la web (PAGE_COPY, legalContent, plugins i nota tutorial) i tancament final.'
tags:
  - govern
visibility: private
reflex: sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:022484a9-857e-48d7-9da6-947f946d2f01
---
# Prompt d'Execució i Auditoria Local · Onada 6: Disseny Editorial (H4 + Negretes d'Escaneig Ràpid), Crònica de Versions v1.1.0 i Tancament d'Arbre

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex/Gemini):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu d'idees, deutes tècnics i memòria permanent de la sessió.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: El Registre i la Instrucció declaren els models i variants vigents (`Claude Fable 5.1 Extra · Ultracode` / `Opus · Ultracode`, `GPT-6.1 Sol Ultra` / `Astra`, i `Gemini CLI`) i assignen a cadascun un carril exclusiu de fitxers d'escriptura per operar en paral·lel sense col·lisions ni esperes mútues.
- [x] **Pla d'Implementació** generat i vinculat al torn (`document.mjs plan`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat que el prompt naix de `document.mjs context` + `create` i conserva íntegres els spans de codi (`` `ruta` ``) dels blocs normatius sense mutilacions.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (zero spread JSONB sense coacció, zero regex amb backtracking O(n), RLS per columna, Storage privat i purga de claus d'autoritat).
- [x] **Enginyeria Inversa i Paritat amb REA**: Verificat l'ús de REA ('reverse-engineer-anything') per a disseccionar referències i estructures natives o de botigues sense reinventar la roda.
- [x] **Cron de vigilància**: L'orquestradora programarà un cron (p. ex. cada 10 minuts) per revisar els relleus a l'Escriptori si l'agent local treballarà de forma autònoma i llarga.
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Ompliu el camp "Model IA" amb l'identificador exacte del model real en ús (p. ex. `Gemini 4 Argon (High)` o `Gemini 3 Flash` per a MarIA; prohibit arrossegar per inèrcia models històrics obsolets com `Gemini 3.1 Pro`) i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:022484a9-857e-48d7-9da6-947f946d2f01 |
| Versió del document | 3.11.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-03T01:40:19.596Z |
| Modificació | 2026-11-03T02:41:00+01:00 |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:022484a9-857e-48d7-9da6-947f946d2f01 |
| Tall d'evidència | HEAD + 2026-11-03T02:41:00+01:00 |
| requires_human_decision | false |
| Model IA | Gemini 4 Argon (High) + Claude Opus 5.5 Extra · Ultracode + GPT-6.1 Sol Ultra / Astra + Gemini 4 CLI |
| Tokens consumits | 215000 |

## Historial

- **v3.11.0 (261103):** Onada 6 Editorial, Llegibilitat i Crònica de Versions (`v1.1.0`). Salt de versió canònica del sistema a `1.1.0`, crònica d'evolució a `/versions` (`http://localhost:3340/versions`) estil notes d'entrega de Claude amb subtítols `<h4>` i paràgrafs de 6–8 negretes d'escaneig ràpid (en lloc de llistes de punts on la negreta perd força visual), auditoria i injecció de 6–8 negretes estratègiques per paràgraf a totes les pàgines de `src/sections/text/pageContent.js`, `src/sections/text/legalContent.js`, `src/sections/plugins/presentacioPlugins.js` i la nota tutorial de `src/data/appSeed.js`, i tancament dels últims punts d'Onada 4/5 (`D6-01/03/04/06/11`, `G-D-01`, `ARB-XAT-01`).

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

## Instrucció del torn

Executeu en mode Gauntlet i en tres carrils exclusius sense col·lisió l'Onada 6 i la Passada 2 Nocturna.

## Tasques

- **T1 (`O6-CLAUDE-1` · Salt de Versió Canònica a `v1.1.0` i Crònica Viva a `/versions` amb `H4` + `<p>` i 6–8 Negretes):**
  - Actualitza `package.json` (`"version": "1.1.0"`), `android/app/build.gradle` (`versionName "1.1.0"`), `ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION = 1.1.0;`) i `src/config/versio.test.js` (`expect(versioCanonica()).toBe('v1.1.0')`).
  - A `src/sections/text/pageContent.js` (`PAGE_COPY.versions`), actualitza:
    * `subtitle`: `"Versió actual: v1.1.0 · Connector WordPress v1.1.11 a WordPress.org"`
    * `labels[0].text`: `"v1.1.0 · WP v1.1.11"`
    * Afig al capdamunt de `PAGE_COPY.versions.html` l'entrada **`<h3>3 de novembre de 2026 · v1.1.0 (build pendent de desplegar) · Connector WordPress v1.1.11</h3>`**, i dóna numeració semàntica pròpia a cada entrega anterior perquè l'historial mostre l'evolució real (`v1.0.4` l'1 de novembre tarda, `v1.0.3` l'1 de novembre matí, `v1.0.2` el 31 d'octubre, `v1.0.1` el 29 d'octubre, `v1.0.0` el 26 d'octubre, `v0.9.5` el 17 d'octubre).
    * **Reforma Editorial de `/versions` (Ordre directa del Mestre):** Substitueix els blocs `<ul><li><strong>Títol:</strong> ...</li></ul>` de les entrades de `/versions` per **subtítols `<h4>`** seguits de **paràgrafs `<p>` rics en lectura diagonal (entre 6 i 8 sintagmes clau en `<strong>` per paràgraf)**, de manera que cada novetat, millora i correcció tinga el seu `<h4>` propi (o bloc `<h4>` narratiu) i les negretes brillen dins del paràgraf per fer un escaneig visual instantani.
    * Actualitza `src/sections/text/pageContent.versions.test.js` perquè valide la nova capçalera `v1.1.0 · WP v1.1.11`, l'entrada del `3 de novembre de 2026 · v1.1.0`, l'estructura `<h4>` + `<p>` amb negretes d'escaneig ràpid i totes les invariants d'honestedat tècnica (E2EE apagat, Open Data `1.2.0`, 72h d'alerta, rutes internes vàlides, zero «masia»).
- **T2 (`O6-CLAUDE-2` · Enriquiment Editorial `H4` + 6–8 Negretes per Paràgraf a Tota la Web i Re-segellat `16/16`):**
  - Revisa i enriqueix totes les claus restants de `src/sections/text/pageContent.js`, `src/sections/plugins/presentacioPlugins.js` i `src/data/appSeed.js` (`NOTES_SEED[0]`):
    1. **`roadmap` (`/roadmap`):** Els 50 paràgrafs `<p>` tenen actualment **0 negretes** (`avg-strong: 0.0`). Incorporeu **entre 5 i 8 sintagmes clau en `<strong>`** a cada paràgraf de les 40 llavors actives i de les introduccions de secció, conservant intactes els 40 enllaços actius i els 4 comentats (`pageContent.roadmap.test.js`).
    2. **`wikidepoble` (`/wikidepoble` portada):** Els 4 paràgrafs tenen **0 negretes**. Afegiu subtítols `<h4>` entre paràgrafs i **6–8 sintagmes en `<strong>`** per paràgraf.
    3. **`xat` (`/page/xat`), `fedivers` (`/fedivers`), `projecte` (`/projecte`), `disseny` (`/disseny`), `anima` (`/anima`), `drets-autor` (`/page/drets-autor`), `descarregues` (`/descarregues`), `fediversity` (`/fediversity`), `consola` (`/page/consola`), `cervell` (`/page/cervell`), `publicar_*`, `vehicle_compartit`, `animalets`, `treball`, `habitatge`, `notes_shared`:**
       - Transformeu les llistes de punts (`<ul><li><strong>...</strong></li></ul>`) on la negreta perd efecte (com a `xat`, `drets-autor`, etc.) en subtítols `<h4>` / `<h5>` + `<p>` quan no trenque cap prova estructural, i assegureu que cada paràgraf tinga **entre 5 i 8 sintagmes clau en `<strong>`** per a lectura a colp de vista.
       - A `NOTES_SEED[0]` (`src/data/appSeed.js`, Card tutorial «Bloc de notes»), substituïu els bullets per `<h4>` + `<p>` amb **6–8 negretes per paràgraf** i mencioneu el selector «On es publica?» dins d'«Edició avançada».
       - A `src/sections/plugins/presentacioPlugins.js` (`gestoria` i `rss`, ja que `rebost` i `salut` ja estan a `5.67` i `6.00` `<strong>`/`<p>`), pugeu a **5–8 `<strong>`/`<p>`** respectant la guarda de `src/sections/plugins/presentacioPlugins.test.js:13-63` (**exactament 12 línies `<h3>`/`<p>`**, només marques nues `h3`/`p`/`strong` i preservant intactes els literals `«...»` de `CITES`).
    4. **Pipeline MD → HTML de `/wikidepoble` i Autòpsia/Reparació de `/consola` (Consola Termodinàmica) i `/cervell` (`/brain`):**
       - Auditeu i repareu a `src/sections/wikidepoble/` el convertidor/renderitzador de Markdown a HTML i els seus estils CSS perquè:
         a) Les llistes numerades `<ol>` mai es tallen ni es reinicien totes amb el número `1.` quan tenen sub-blocs o paràgrafs.
         b) Cap paràgraf es talle a mitjan frase convertint-se en un altre element més xicotet i separat.
       - Auditeu i repareu `src/sections/consola/` (Consola Termodinàmica) i `src/sections/cervell/` (`/brain`) corregint qualsevol fallada de dades, pestanyes, gràfics, maquetació fina o textos sense negretes d'escaneig ràpid.
    5. **Candidatura Europea NLnet · NGI Fediversity (`/fediversity` a `pageContent.js` i esborrany de correu a NLnet · Full de Ruta 100% Offline-First):**
       - Actualitzeu `PAGE_COPY.fediversity` perquè reflectisca la realitat viva abans d'enviar el correu a NLnet (`Expedient 2026-08-1a6`):
         a) **Fet hui (verificable):** El segon adaptador complet del port neutral en memòria (`src/data/local/` validat amb el mateix kit de conformitat que Supabase), el restaurador de paquets Open Data `1.2.0` verificat amb `SHA-256`, la biblioteca de segona fase d'ActivityPub amb verificació de signatures HTTP (`src/data/federacio/inboxActivityPub.js`: `rsa-sha256`, `hs2019`, `ed25519`), el connector oficial `socdepoble` publicat a WordPress.org (`v1.1.11` en viu / `v1.1.12` amb 5 llengües al repositori) i les aplicacions natives enviades a **Google Play** i **Apple App Store**.
         b) **Compromís estratègic finançat («Pendent» amb altíssim valor per a NLnet Fediversity — Arquitectura 100% Offline-First i Local-First Rural):** Incorporeu com a fita central del treball pendent finançat per la beca que, ara que el sistema base i el segon adaptador local (`src/data/local/`) són estables i passen el kit de conformitat, **treballarem per fer Sóc de Poble 100% Offline-First de punta a punta** (persistència local al dispositiu amb IndexedDB / SQLite natiu, cua d'operacions signades fora de línia i sincronització determinista en recuperar cobertura), de manera que qualsevol poble de muntanya, masia, cooperativa o ajuntament puga operar sense internet durant talls de xarxa o emergències rurals.
         c) Elimineu l'aparició residual de *«però el Mas no té cap mòdul de memòria cultural»* dins de `PAGE_COPY.fediversity` substituint-la per *«però Sóc de Poble encara no té cap mòdul de memòria cultural»*, i actualitzeu `pageContent.fediversity.test.js` i la frontissa (`--aprova fediversity`).
    6. **Pas 2 de Maquetació Editorial Avançada (Enllaços Contextuals + Cards Incrustades d'Anada i Tornada estil Obsidian + Commutador «Enllaç ↔ Card» al Súper Editor Universal):**
       - **Enllaços contextuals i a les pròpies fonts:** Enriquiu els textos de les pàgines de sistema (`pageContent.js` i `_wiki_de_poble/`) amb **hiperenllaços contextuals** cap a les pàgines internes rellevants de Sóc de Poble i cap a les pròpies fonts oficials que s'hi esmenten, verificant cada URL amb doble control (`tooling/gates/certifica-enllacos.mjs`).
       - **Cards incrustades a la dreta d'anada i tornada (com l'experiment reeixit de `/legal` ↔ `/page/drets-autor`):** En els textos editorials de 4 o més paràgrafs (`projecte` ↔ `anima`, `fedivers` ↔ `fediversity`, `consola` ↔ `cervell`, `wikidepoble` ↔ `disseny`), incrusteu **una targeta viva flotant a la dreta (`<div class="sdp-targetes" data-forma="sola" data-alineacio="dreta">...</div>`)** que connecte d'anada i tornada les pàgines germanes com un graf viu estil Obsidian.
       - **Súper Editor Universal (`src/components/universal/richText/extensions/targetes/` · Commutador Bidireccional «Enllaç ↔ Card» estil Obsidian):** Doteu el nostre editor universal (`TargetaIncrustadaNodeView.jsx`, `DialegTriaTargeta.jsx` i les accions de `targetesIncrustades.js`) de l'opció perquè l'usuari puga triar i commutar amb 1 clic si un enllaç intern de Sóc de Poble es mostra com a **Card incrustada completa (`UniversalCard`)** o com a **hiperenllaç de text normal (`<a href="...">`)**, i viceversa (botó «Convertir en enllaç» en les eines de la targeta seleccionada i opció «Inserir com a Card / Inserir com a enllaç» o conversió d'enllaç intern a Card).
    7. Integreu també el kit de `legalContent.js` i tancaments de Codex (`O6-CODEX`), passeu el verificador de Gemini (`node _wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/audita-llegibilitat-editorial.mjs`) i `node tooling/gates/porta-contingut.mjs --aprova ...` per deixar la Frontissa **`16/16` en verd**, verifiqueu tota la suite Vitest i emeteu a `261102_1640_auditoria_claude.md` l'**Auditoria Integral 360° + DAFO a 15 Dimensions (`D01`–`D15`) + Matriu d'Importància × Urgència (Q1–Q4) + Visió de Futur 10/10**.
- **T3 (`O6-CODEX` · Redisseny Multiidioma en 5 Idiomes d'`Ajustos -> Sóc de Poble` (`wordpress-plugin/` `v1.1.12`) + Redacció Científica i Reparació dels `.md` de `_wiki_de_poble/` + Restauració de les 4 Skills + Kit `legalContent.js` + DAFO 15D i Matriu d'Importància × Urgència):**
  - **Redisseny d'`Ajustos -> Sóc de Poble` (`wordpress-plugin/includes/ajustos.php` + `wordpress-plugin/socdepoble-enxufe.php` `1.1.12`):**
    * Incorporeu dalt de la pàgina d'opcions (`options-general.php?page=socdepoble`) un **selector de pestanyes amb els 5 idiomes oficials de Sóc de Poble (`Valencià · VA`, `Castellano · ES`, `English · EN`, `Euskara · EU`, `Galego · GL`)** que detecte per defecte el `locale` de WordPress (`get_user_locale()` / `get_locale()`: `ca`/`ca_valencia` -> `va`, `es*` -> `es`, `eu*` -> `eu`, `gl*` -> `gl`, `en*` -> `en`, fallback a `va`) i permeta canviar d'idioma al moment amb 1 clic sense dependre de fitxers `.mo` externs (ja que la variant de WordPress.org no inclou `languages/`).
    * Augmenteu la mida de la lletra (`16px`–`17px` al cos, `line-height: 1.65`, encapçalaments i targetes ben espaiades) i redacteu els textos dels 3 passos, identitat de l'amfitrió, traducció i diagnosi amb **negretes d'escaneig ràpid (`<strong>`) en les paraules clau** en els 5 idiomes (cuidant especialment el **valencià** i el **castellà** perquè el Mestre ho valore d'un colp de vista).
    * **Llei de Marca i Lema per Idioma (Ordre directa del Mestre):** La marca **`Sóc de Poble`** no es tradueix mai, i el lema **`Portal de Pobles Connectats`** s'escriu **EXACTAMENT IGUAL en Castellà (`es`) que en Valencià (`va`/`ca`)**: **`Sóc de Poble. Portal de Pobles Connectats`** (també en `wordpress-plugin/languages/socdepoble-es_ES.po`). En les altres 3 llengües sí que es tradueix el lema conservant la marca: **`Sóc de Poble. Portal of Connected Villages`** (`en`), **`Sóc de Poble. Konektatutako Herrien Ataria`** (`eu`) i **`Sóc de Poble. Portal de Pobos Conectados`** (`gl`).
    * Pugeu la versió a **`1.1.12`** a `wordpress-plugin/socdepoble-enxufe.php` i `wordpress-plugin/readme.txt`, verificant totes les proves de `wordpress-plugin/tests/`.
  - **Redacció Científica i Reparació dels Fitxers `.md` Base de `_wiki_de_poble/` (`01_ser`, `02_pensar`, `03_actuar`, `05_llavors`, `06_projecte`):**
    * Auditeu tots els fitxers `.md` de `_wiki_de_poble/` que s'exporten a `/wikidepoble` i corregiu:
      1. Les **llistes numerades on cada punt torna a eixir com a `1.`** per culpa de blocs intercalats o sintaxi Markdown trencada.
      2. Els **paràgrafs que es tallen a mitjan frase** i es converteixen en un altre bloc amb lletra més xicoteta i separada.
      3. Els **procediments i explicacions obsoletes o mal redactades**, reescrivint-los amb el rigor d'un **Redactor Científic i Didàctic** i amb jerarquia visual clara (`H2`/`H3`/`H4` + **6–8 negretes d'escaneig ràpid per paràgraf**). Si detecteu un bug a l'exportador `tooling/wiki/`, deixeu el pegat/fix al vostre kit `261103_kit_codex_onada6_legal_i_tancament/`.
  - **Restauració de les 4 skills (`D6-01`, `D6-03`, `D6-04`, `D6-06`, `D6-11`) + Regla d'Oblit Saludable de Captures de Xat a `core-higiene-escriptori`:** Restaureu a `.agents/skills/core-context-panic/SKILL.md`, `.agents/skills/core-secretaria-auditoria/SKILL.md`, `.agents/skills/core-higiene-escriptori/SKILL.md` i `.agents/skills/core-comprensio-reflexiva/SKILL.md` les regles i seccions històriques del Mestre que el kit d'Onada 4 havia resumit, i incorporeu explícitament a `.agents/skills/core-higiene-escriptori/SKILL.md` la regla d'**Oblit Saludable de Captures Efímeres a `01_produccio/` (`AGENTS.md §16`)**: les captures de pantalla temporals del xat (`AAMMDD_HHMM_*.png/jpg`) que ja han sigut assimilades s'han d'esborrar de `01_produccio/` i desancorar de `00_index_escriptori.md` en tancar l'onada o sessió perquè no s'acumulen ni embruten el graf d'Obsidian (conservant a `01_produccio/` només els actius i carpetes permanents de producció humana). Verifiqueu que `node tooling/brain/fronteres-skills.mjs` i `tests/fronteres-skills.test.mjs` donen `0` errors.
  - **Kit CAS de `legalContent.js`, Tancament (`G-D-01`, `ARB-XAT-01`) + Auditoria 360° amb DAFO a 15 Dimensions i Matriu d'Importància × Urgència:** Prepareu a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_codex_onada6_legal_i_tancament/` el kit per enriquir `src/sections/text/legalContent.js` (`/legal`, 28 paràgrafs amb 0 negretes) amb **5–8 negretes estratègiques per paràgraf** incloent la migració append-only `politica_privacitat_2_4.sql` per complir `SDP-RGPD-021`, i documenteu a `_wiki_de_poble/04_escriptori/261102_1638_auditoria_codex.md` l'**Auditoria Integral 360° (incloent `/consola`, `/cervell` i `/wikidepoble`) + DAFO a 15 Dimensions (`D01`–`D15`) + Matriu d'Importància × Urgència (Q1–Q4) + Visió de Futur**.
- **T4 (`O6-GEMINI` · Verificador d'Escanejabilitat Visual, Pipeline MD → HTML de `/wikidepoble`, Autòpsia de `/consola` i `/cervell` i DAFO a 15 Dimensions + Matriu d'Importància × Urgència):**
  - Amplieu a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/` l'script `audita-llegibilitat-editorial.mjs` perquè audite també tots els fitxers `.md` de `_wiki_de_poble/`, l'exportació MD → HTML de `/wikidepoble` (detectant llistes `<ol>` reiniciades en `1.`, paràgrafs tallats i procediments obsolets) i l'estat de la **Consola Termodinàmica (`/consola`)** i del **Cervell (`/cervell` / `/brain`)**, i documenteu a `_wiki_de_poble/04_escriptori/261102_1832_auditoria_gemini.md` l'**Auditoria Integral 360° + DAFO Complet a les 15 Dimensions (`D01`–`D15`) + Matriu d'Importància × Urgència (Q1–Q4) + Visió de Futur 10/10**.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/versions`, `http://localhost:3340/roadmap`, `http://localhost:3340/wikidepoble`, `http://localhost:3340/projecte`, `http://localhost:3340/descarregues`, `http://localhost:3340/fediversity`, `http://localhost:3340/legal`.
- **Criteris d'Acceptació:**
  1. `package.json`, `android/app/build.gradle`, `ios/App/App.xcodeproj/project.pbxproj` i `/versions` mostren **`v1.1.0`** (`Versió actual: v1.1.0 · Connector WordPress v1.1.11 a WordPress.org`), i `/versions` obri amb l'entrada del **`3 de novembre de 2026 · v1.1.0`**.
  2. `/versions` substitueix les llistes de bullets (`<ul><li>`) per subtítols `<h4>` + paràgrafs narratius `<p>` amb **6–8 sintagmes en `<strong>` per paràgraf**.
  3. Cap pàgina de `PAGE_COPY` (`roadmap`, `wikidepoble`, `xat`, `fedivers`, `projecte`, `disseny`, `anima`, `drets-autor`, `descarregues`, `fediversity`, etc.), `presentacioPlugins.js` ni `NOTES_SEED[0]` té paràgrafs plans sense negretes: cada paràgraf permet entendre la idea d'un sol colp de vista llegint les paraules en `<strong>`.
  4. `node tooling/gates/porta-contingut.mjs` aprova `16/16` claus, `node tooling/brain/fronteres-skills.mjs` dóna `0`, i les suites de Vitest i `node --test` passen al 100% en verd.

## Riscos

- **Risc de trencar assercions literals en `paginaDeText.test.js`, `pageContent.fediversity.test.js` o `legal.*.test.js` en afegir `<strong>` o canviar `<ul>` per `<h4>`:** Mitigat executant les suites de `src/sections/text/*.test.*` després de cada bloc editat i conservant intactes els literals exactes o enllaços que les proves comproven sobre l'HTML cru, o actualitzant alhora el test quan el canvi d'estructura (`<ul>` → `<h4>` + `<p>` a `/versions`) és l'objecte mateix de l'ordre del Mestre.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida i Rebut Canònic:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md` mitjançant el circuit formal (`node tooling/gates/obrir_torn.mjs` + `node tooling/wiki/document.mjs context` + `create` + `check`), declarant al Registre el vostre `Model IA` exacte en ús (prohibit deixar placeholders o models històrics obsolets).
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i carril exclusiu d'escriptura i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat. Plantilla entregada: `_wiki_de_poble/03_actuar/plantilles/prompt_local.md`; SHA-256 `edf7daf4d81ab3640d195369807d5ab047bbc60027abd2663f86de3b076d992a`. El rebut acredita entrega, no comprensió.

### Tècniques d'I+D, Investigació i Autòpsia (Obligatori)
No et conformes amb investigar el que diuen les skills teòriques i la doctrina (Wiki/AGENTS). Cada script, hook o tractor que estiga implicat en l'execució d'eixa teoria ha de ser llegit i verificat a fons (a nivell de codi `.mjs`, `.py`, etc.). Assegura't que el codi complix efectivament el disseny, no té exclusions cegues i no produeix bloquejos mecànics per inèrcia.
**Mentalitat I+D:** No et limites a obeir i picar codi (Desenvolupament). Exerceix sempre com a investigador de tendències (Investigació). Abans d'implementar res, analitza l'estat de l'art i planteja com aprofitar les últimes solucions del mercat i tecnologies innovadores per resoldre el problema demanat. Mantenir-nos a l'avantguarda és la teva responsabilitat.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de complir dos requisits:
1. **Anàlisi del Prompt:** És el vostre deure analitzar críticament aquest mateix prompt a la recerca de contradiccions, duplicitats o instruccions ambigües. Heu de dir-me clarament: *"Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient"*.
2. **Avaluació de Noves Funcionalitats (Evolució del Model):** Sabem que us actualitzeu periòdicament amb noves capacitats tècniques. Heu d'indicar explícitament si teniu alguna nova opció o flux de treball que ens permeta avançar millor o de forma més veloç com a equip. L'objectiu és esprémer el vostre potencial per a funcionar com un autèntic nucli de 3 agents (MarIA com a Directora + vosaltres com a executors tècnics). Si veieu maneres de fer-ho millor, exigiu-les.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]]
- [[taxonomia_documental]]
