---
type: prompt
status: actiu
description: 'Prompt operatiu canònic v3.11.0 per a Claude Opus 5.5 Extra Ultracode (El Rentonar): Àlbum Multimèdia Local estil Gestoria, negreta d''1 toc al Xat i liquidació del deute E2EE Pas 17 i icones PWA AAA.'
tags:
  - govern
visibility: private
reflex: sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:4dfa38d8-fbbb-4369-8147-732e87fa0cf9
---
# Prompt Operatiu 261029_1605 · Claude Opus 5.5 Ultracode · Àlbum Multimèdia Local (IDEA-54), Negreta al Xat (IDEA-53) i Deute E2EE/PWA

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `_wiki_de_poble/04_escriptori/00_index_escriptori.md` conté tots els documents actius de la sessió.
- [x] **Llibre Mestre consultat i referenciat**: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu amb les prioritats `IDEA-54` (Àlbum i Gestor Multimèdia Personal Local estil Gestoria), `IDEA-53` (Negreta intuïtiva d'1 toc al Xat), `D-C2 PWA` (icones PWA de `public/` al verd `#0e662e`) i tancament UI d'`OBLIT_FALLIT` (`D-09`).
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**:
  1. **Claude Code (`Claude Opus 5.5 · Ultracode` / final de quota `Fable 5.1` a El Rentonar)**: Execució autònoma dels Blocs A (`IDEA-54`), B (`IDEA-53`), C (`E2EE Pas 17 + D-C2 PWA + R-02 comprimit`) i D (Commits nets i verificació) mentre el Mestre dina.
  2. **Gemini CLI i GPT Codex (`GPT-6.1 Sol Ultra` / `Astra`)**: Entraran en tornar el Mestre de dinar per executar l'auditoria adversarial sobre tot el treball produït per Claude.
- [x] **Pla d'Implementació** generat i vinculat al torn (`_wiki_de_poble/04_escriptori/261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat amb la plantilla `prompt_local.md (v3.11.0)` conservant íntegres tots els spans de codi dels blocs normatius.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (`E2EE_ACTIU_PER_DEFECTE = false`, frontera privada de Gestoria intacta a `src/sections/gestoria/privacitat.test.js` i purga de claus).
- [x] **Enginyeria Inversa i Paritat amb REA**: Autoritzat l'ús de REA (`reverse-engineer-anything`).
- [x] **Cron de vigilància**: Sense crons zombis; treball en fil principal seqüencial.
- [x] **Rebut obtingut** per a l'arxiu generat (`sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:4dfa38d8-fbbb-4369-8147-732e87fa0cf9`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:4dfa38d8-fbbb-4369-8147-732e87fa0cf9 |
| Versió del document | 3.11.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T15:05:11.849Z |
| Modificació | 2026-10-29T15:10:30.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~24.000 tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- `2026-10-29T15:05:11.849Z`: Esborrany creat amb rebut canònic `sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:4dfa38d8-fbbb-4369-8147-732e87fa0cf9` i vinculat al pla `261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa.md`.
- `2026-10-29T15:10:30.000Z`: Completat seguint `prompt_local.md (v3.11.0)` per a l'execució autònoma de Claude (`Opus 5.5 · Ultracode` / `Fable 5.1 Extra`) durant el dinar del Mestre.

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

Estem en l'**Onada `261029_1605`** sobre **`Claude Opus 5.5 · Extra · Ultracode`** (compte **El Rentonar**). El Mestre Javi se'n va a dinar i et deixa com a **motor d'enginyeria a màxima potència**.

> **🔥 POTÈNCIA MÀXIMA ULTRACODE (EIXAMS D'AGENTS + GAUNTLET LOOP 3–4 PASSADES SENSE RESTRICCIÓ):**
> Tens **autorització i ordre expressa** per desplegar **tots els subagents i workflows d'Ultracode que facen falta** (exploradors en paral·lel, constructors per bloc i crítics adversarials independents) i executar **2, 3 o 4 cicles complets de Gauntlet Loop adversarial intern** fins que cada peça de codi, cada prova i la consola del navegador (`http://localhost:3340`) queden **100% netes, indestructibles i amb 0 errors i 0 avisos**. No t'atures a la primera versió que funcione: llança agents crítics que intenten trencar la teua pròpia implementació, corregeix qualsevol escletxa i torna a passar el Gauntlet tantes vegades com calga!

> **NOTA SOBRE L'ESTAT DE L'ARBRE COMPARTIT (16:10):**
> - La IAIA MarIA ja ha resolt les 3 observacions de `G3` (`src/css/components.css:254` amb `var(--sdp-space-6)`, `ALLOW_FOCUS_INVISIBLE` i `caret-color` a `src/css/modules.css` + `tooling/gates/design_guard.mjs`, el contracte `T50 (D4)` a `tooling/gates/tractor-fitxa-gestor.mjs` i el coixinet literal a `src/natiu/projecteIos.test.js:744`). Ara `node tooling/gates/design_guard.mjs --arrel=src` passa amb **`0 crítics (PASSA)`**.
> - També s'ha desacoblat `src/sections/multimedia/motorMultimediaLocal.js` de `src/sections/gestoria/font/fontNavegador.js`, de manera que `src/sections/gestoria/privacitat.test.js` (`18/18`) passa al **100% en verd**.
> - Tots els 175 originals ràster de `public/assets/` que ja tenen bessona `.webp` han sigut copiats i preservats a `../_multimedia_de_poble/originals_raster_public/assets/`.

1. Llig immediatament abans d'editar:
   - `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`
   - `_wiki_de_poble/04_escriptori/261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa.md`
   - `_wiki_de_poble/90_arxiu_historic/261029_1455_auditoria_claude.md`, `_wiki_de_poble/90_arxiu_historic/261029_1514_auditoria_gemini.md` i `_wiki_de_poble/90_arxiu_historic/261029_1447_auditoria_codex.md`
   - `src/sections/multimedia/motorMultimediaLocal.js`, `src/sections/multimedia/GestorMultimediaLocal.jsx` i `src/sections/multimedia/MultimediaSection.jsx`
   - `src/sections/gestoria/font/handleStore.js` i `src/sections/gestoria/tauler/ShellGestoria.jsx` (només lectura com a patró de referència; **mai** importar res de `src/sections/gestoria/**` des de `src/sections/multimedia/**`).

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### 1. BLOC A · `IDEA-54` + `IDEA-55`: Gestor Universal d'Arxius i Volums Locals + Àlbum Multimèdia Personal Local (`/multimedia` → `Carpeta local`) al Nivell de la Gestoria i d'Obsidian

1. **Biblioteca Multi-Carpeta en `IndexedDB` (Volums Locals Muntats) i Reconnexió d'1 Clic (`src/sections/multimedia/motorMultimediaLocal.js` + `src/sections/multimedia/GestorMultimediaLocal.jsx`):**
   - Implementa dins de `src/sections/multimedia/motorMultimediaLocal.js` un magatzem `IndexedDB` propi (`socdepoble_arxius_locals_v1`, store `carpetes`) capaç de desar **múltiples carpetes locals muntades** (`[{ id, nom, ultimAcces, handle }]`: ex. `_multimedia_de_poble`, `_cultura_de_poble`, `_oficina_de_poble`, `_salut_de_poble` o qualsevol carpeta que l'usuari vincule) per clonació estructurada (`desaCarpetaLocal`, `llistaCarpetesLocalsRecordades`, `recuperaCarpetaLocal`, `oblidaCarpetaLocal`, `verificaPermisCarpetaLocal`), inspirat en `src/sections/gestoria/font/handleStore.js` però 100% autònom dins de `motorMultimediaLocal.js` (prohibit crear subcarpetes noves a `src/` per `tractor-cens.mjs` `C1` i prohibit importar de `src/sections/gestoria/**`).
   - En muntar `GestorMultimediaLocal.jsx`:
     - Mostra una barra de **«Volums / Carpetes Locals Muntades»** amb pastilles d'1 clic per commutar entre les carpetes recordades a `IndexedDB` i un botó **`[ + Vincular carpeta local ]`**.
     - Si la carpeta activa té `queryPermission({ mode: 'read' }) === 'granted'`, obri i indexa automàticament la carpeta sense cap clic extra.
     - Si `queryPermission({ mode: 'read' }) === 'prompt'`, mostra un bàner clar amb botó de `min-height: 44px`: **«Carpeta recordada (`{nom}`) · [ Reconnectar amb 1 clic ] · [ Oblidar ]»** que cride `requestPermission({ mode: 'read' })` en el gest de l'usuari.
2. **Gestor Universal d'Arxius Locals (`IDEA-55`): Visor i Editor Polimòrfic (Imatges en Graella d'Àlbum, Markdown/Text/JSON amb edició i enviament al Bloc de Notes, Àudio, Vídeo i PDF):**
   - Suporta tots els tipus d'arxiu d'una carpeta local (`imatge`, `audio`, `video`, `document`, `codi`/`dades`: `.md`, `.txt`, `.json`, `.csv`, `.yml`, `.canvas`, `.pdf`, `.vcf`, `.xls`, `.xlsx`) i afegeix el commutador **«Graella d'Àlbum» / «Explorador d'Arxius (Taula)»**:
     - **Imatges (`.webp`, `.png`, `.jpg`, `.svg`, `.gif`, `.avif`):** en **Graella d'Àlbum**, mostra targetes visuals amb miniatura real generada des dels bytes locals (`URL.createObjectURL`, revocant-les sempre en desmuntar o canviar de pàgina amb límit de 24 miniatures per pàgina i paginació neta), badge d'estat (`PUBLICADA`, `BESSONA WEBP`, `INÈDITA`, `PES ALT`, `DUPLICADA`), subcarpeta i mida en KB.
     - **Markdown, Text i Dades (`.md`, `.txt`, `.json`, `.csv`, `.canvas`, `.yml`):** al panell lateral de detall, llig i decodifica el text UTF-8 (`llegixTextLocal(font, ruta)`) i ofereix un **Visor i Editor de Text/Markdown Local** amb tres botons (`min-h-[44px]`):
       1. **`[ Desar canvis al fitxer local ]`** (escriu els bytes UTF-8 amb `font.escriu(ruta, bytes, { sobreescriu: true })` amb permís `readwrite`).
       2. **`[ Enviar al Bloc de Notes ]`** (desa una nota nova a l'emmagatzematge del Bloc de Notes o la passa a `/notes` perquè es puga canonitzar amb `[ Proposa Card ]`).
       3. **`[ + Nou fitxer .md ]`** per crear un fitxer Markdown nou dins de la carpeta local activa.
     - **Àudio (`.mp3`, `.wav`, `.ogg`, `.m4a`), Vídeo (`.mp4`, `.webm`, `.mov`) i PDF (`.pdf`):** reproductor `<audio controls>`, `<video controls>` o visor `<iframe title={nom} src={blobUrl} />` amb `blob:` revocable.
3. **Intel·ligència d'Auditoria Local estil Gestoria (Hash `SHA-256`, Suggeriment de Poble per EXIF/GPS i Desat Directe de `.webp` en Disc):**
   - Afegeix `calculaHashFitxerLocal(font, ruta)` amb `crypto.subtle.digest('SHA-256', bytes)` i un botó **«Verificar duplicats exactes (SHA-256)»** per confirmar duplicats byte a byte entre subcarpetes (`00_inbox`, `originals_raster_public`, `nano_banana_historic`, `antic_sistema`).
   - Quan una imatge tinga EXIF amb GPS (`exif.gps`) o nom reconeixible, suggereix el poble de la comarca i la categoria del catàleg.
   - Al **Laboratori de Qualitat WebP**, afegeix al costat de «Descarregar .webp» el botó **«Desar .webp a la carpeta local»** que demane permís `readwrite` al handle local i escriga `font.escriu(rutaWebp, bytesWebp, { sobreescriu: true })` directament al disc local, refrescant l'inventari.

---

### 2. BLOC B · `IDEA-53`: Negreta Intuïtiva d'1 Toc al Xat (`*text*`, `**text**` i Botó `[ N ]`)

1. **Renderitzat segur a `src/sections/xat/components/Bombolla.jsx` (`TextAmbEnllacos`):**
   - Tokenitza de forma segura tant `**text**` (Markdown) com `*text*` (WhatsApp, sense espai immediat després de l'asterisc d'obertura ni abans del de tancament, i sense alterar expressions aritmètiques com `2 * 3 = 6`) i renderitza'ls com a nodes React `<strong>` purs (mai `dangerouslySetInnerHTML`), combinant-ho amb el detector d'enllaços existent.
2. **Botó `[ N ]` (`Negreta`) i drecera `Cmd/Ctrl+B` a `src/sections/xat/components/Compositor.jsx`:**
   - Afegeix un botó d'acció ràpida `[ N ]` (`aria-label="Negreta"`, `min-height: 44px; min-width: 44px`) i el gestor `onKeyDown` per a `Cmd+B` / `Ctrl+B` al `<textarea>` que embolique el text seleccionat amb `*...*` (o inserisca `**` amb el cursor al mig si no hi ha selecció).
   - Afegeix proves unitàries completes per a `Bombolla` i `Compositor`.

---

### 3. BLOC C · Liquidació del Deute Tècnic Anotat al Llibre Mestre (E2EE Pas 17 + Icones PWA AAA + R-02 Lleuger)

1. **`D-09` UI i Pressupost LRU de `blob:` Xifrats (`src/context/SessionContext.jsx`, `src/context/XatContext.jsx`, `src/data/xatMultimediaXifrat.js`):**
   - Connecta el tancament de sessió amb `servei.oblidaTotXat()` i exposa l'estat `OBLIT_FALLIT` a `XatContext` sense vulnerar `src/config/qualitat.amfitrio.test.js` (`host.js` no pot nomenar literalment `localStorage`, `sessionStorage` ni `indexedDB`).
   - Afegeix un pressupost LRU (`48 MB` objectiu, `100 MB` màxim) als `blob:` desxifrats de `src/data/xatMultimediaXifrat.js` amb les seues proves unitàries.
2. **`D-C2 PWA` (`public/icona-app-192.png`, `public/icona-app-512.png`, `public/apple-touch-icon.png`):**
   - Remapa els píxels del verd antic `#0F672F` (`15, 103, 47`) al verd institucional AAA `#0e662e` (`14, 102, 46`) en les icones PWA de `public/` i afegeix l'asserció corresponent a `src/natiu/projecteIos.test.js` (emprant `` `${'#'}0e662e` `` sense `#` literal per mantindre `design_guard.mjs` a `0 crítics`).
3. **`R-02` sense inflar 56 MB el repositori:**
   - Com que els 83 originals `.png` ja tenen tots bessona `.webp` i ja estan salvats a `../_multimedia_de_poble/originals_raster_public/assets/`, optimitza/quantitza o redimensiona eixos 83 PNG de fallback de `public/assets/` amb Pillow (`quantize(colors=256)` + `optimize=True`) perquè siguen PNGs reals vàlids (`89 50 4E 47`) però pesen menys (idealment <= 20-25 MB en total en lloc de 106 MB).

---

### 4. Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/multimedia` (pestanya `Carpeta local`) i `http://localhost:3340/xat`.
- **Criteris d'Acceptació:**
  1. `npx vitest run src/sections/multimedia/ src/sections/xat/ src/sections/gestoria/privacitat.test.js src/natiu/projecteIos.test.js src/data/xifratXat* src/data/xatMultimediaXifrat*` → `100%` en verd.
  2. `npm run test:precommit` i `npx eslint src tooling scripts tests --max-warnings=0` → `exit 0`.
  3. `node tooling/gates/design_guard.mjs --arrel=src` → `0 crítics (PASSA)`.
  4. Informe actualitzat o nou emés a `_wiki_de_poble/04_escriptori/` i Llibre Mestre actualitzat.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Frontera de la Gestoria (`src/sections/gestoria/privacitat.test.js`):** Cap fitxer de `src/sections/multimedia/**` pot importar cap mòdul de `src/sections/gestoria/**`.
- **Cens d'arquitectura (`tractor-cens.mjs` `C1`):** No crear subcarpetes noves dins de `src/sections/multimedia/`.
- **`design_guard.mjs` (`raw-color` i `touch-too-small`):** No escriure literals hexadecimals amb `#` dins de `src/` (ni tan sols en tests) i garantir que tot `<button>` de `GestorMultimediaLocal.jsx` i `Compositor.jsx` tinga `min-h-[44px]` o equivalent CSS.

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
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa]]
- [[../90_arxiu_historic/261029_1455_auditoria_claude]]
- [[../90_arxiu_historic/261029_1514_auditoria_gemini]]
- [[../90_arxiu_historic/261029_1447_auditoria_codex]]
