---
type: prompt
status: esborrany
description: 'Ordre d''execució per a Claude Code i de revisió de qualitat (QA) per a GPT Codex i Gemini sobre el Pla 261028_1526: P1-61 Fase 2, OG-7, P1-60/63, P1-55 P2, P1-58/57, P1-31..37 i portes.'
tags:
  - govern
visibility: private
reflex: sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:9dea8320-137f-43f9-b60b-9015c4c64221
---
# Prompt d'Execució i Auditoria Local — Liquidació de Deute Tècnic: OpenGraph Fase 2, Reforma Editorial, Edició Avançada i Xat/Natiu

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Aquest prompt s'entrega amb la línia base íntegra, vinculat al Pla d'Implementació canònic `_wiki_de_poble/04_escriptori/261028_1526_pla_implementacio_deute_tecnic_opengraph_edicio_i_xat.md`.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex/Gemini):** Aquesta plantilla és **DOGMA**. Treballeu simultàniament sota el **Protocol L'Olivera a 4 bandes**: **IAIA MarIA** (Secretària Tècnica i Orquestradora a Antigravity, sense tocar `src/` ni `tests/`), **Claude Code** (picadora de codi i integradora principal), **GPT Codex** (revisora de qualitat, concurrència i contractes) i **Gemini** (revisora d'arquitectura, UI/UX Pedra Seca i rendiment en instància paral·lela d'Antigravity).

Verificació de preflight completada per l'orquestradora:
- [x] **Escriptori net i indexat**: `node tooling/gates/porta-olivera.mjs --informe` executat amb eixida `0`. Tots els documents vius estan declarats i ancorats a `_wiki_de_poble/04_escriptori/00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` revisat de dalt a baix (Blocs P0, Matriu P1 i Matriu P2).
- [x] **Repartiment asíncron d'actors locals a disc**: Declarat per a **Claude Code**, **GPT Codex** i **Gemini** operant en paral·lel i sense bloquejos mutus.
- [x] **Pla d'Implementació**: Creat, validat i lligat al torn (`_wiki_de_poble/04_escriptori/261028_1526_pla_implementacio_deute_tecnic_opengraph_edicio_i_xat.md`, SHA-256 `0e89ef82238fed78f58dcfe30c9257b4e086615d1279787a3cd303a9ac638d5d`).
- [x] **Sentinella de Qualitat i Privacitat (`core-seguretat-audit`)**: Exigit el Checklist §5 (zero spread JSONB sense coacció, escàners lineals $O(n)$, RLS estricte, purga EXIF GPS en fotos personals d'identitat, conservació informada en Hero/Carrusel de publicacions, validació d'esquema en Share Target i comprovació d'absència de consultes directes PDO/mysqli al connector WordPress).
- [x] **Enginyeria Inversa i Paritat amb REA**: Autoritzat i requerit per a la calibració mil·limètrica de WhatsApp (`P1-36`, `P1-66`, `P1-67`), d'OpenGraph (`P1-61`) i del Mapa Fotogràfic EXIF d'Emowe (`P1-64`).
- [x] **Rebut obtingut**: `sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:9dea8320-137f-43f9-b60b-9015c4c64221`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:9dea8320-137f-43f9-b60b-9015c4c64221 |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-28T14:32:22.320Z |
| Modificació | 2026-10-28T20:06:30.000Z |
| Propietari | IAIA MarIA (Orquestradora) → Claude Code, GPT Codex i Gemini |
| Aprovació humana | aprovada pel Mestre Javi Llinares (2026-10-28) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Gemini 4 Argon High (Orquestradora) + Claude Opus/Sonnet + GPT Codex + Gemini |
| Tokens consumits | ~48.000 tokens (síntesi d'Acta Marmota, Llibre Mestre, Emowe, commit cd3b5b56c, avís INCIBE PHP, Pla i Prompt) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-10-28T14:32:22.320Z:** Esborrany creat via `document.mjs create` i vinculat al Pla `261028_1526_pla_implementacio_deute_tecnic_opengraph_edicio_i_xat.md`.
- **2026-10-28T14:34:00.000Z:** Emissió de l'ordre d'execució i revisió de qualitat a tres bandes (**Claude Code**, **GPT Codex** i **Gemini**) per liquidar el deute tècnic pendent de l'Acta Marmota `261028_1310` i del Llibre Mestre.
- **2026-10-28T16:04:00.000Z:** Incorporació del **Bloc G (`P1-64` i `P1-65`)**: Política Diferenciada de Privacitat GPS EXIF (fotos d'identitat personal vs. Hero/Carrusel de publicacions), Mapa Fotogràfic EXIF Multi-Escala Poble/Món basat en `261014_1930_emowe_mapa_de_tu_viaje` (`plantilla-mapa.html` + `PROMPT_UNIVERSAL.txt`) i mandat d'investigació I+D sobre Emowe (`https://emowe.com/blog/` i `001 NEXUS`).
- **2026-10-28T20:06:30.000Z:** **Onada 2 post-commit `cd3b5b56c` (`T8 · Bloc H`):** Amb els Blocs A–G ja commitejats a **`cd3b5b56c`** (`223 files changed, +16.906/-769`, `3.770` proves verdes en `24,3 s`, documentat a `261028_1620_auditoria_claude.md`), s'ordena: (1) la **Revisió de Qualitat i Conformitat (QA)** sobre `cd3b5b56c` per part de **GPT Codex** i **Gemini** (incloent la comprovació que `wordpress-plugin/` usa exclusivament les APIs oficials de WordPress), i (2) l'**Execució Tècnica Contínua de Claude Code** amb **`P1-66`** (Barra Única del Compositor), **`P1-67`** (Unificació Tipogràfica `16px` + `SemiCondensed` `87.5%`), **`P1-68`** (Registre Mòbil, `@username` i poble), **`P1-69`** (Botó PWA a `/page/descarregues`), els residus del seu informe `261028_1620` (`C28-02`, `C28-07`, `Emowe C1/M1/M2`) i el polit tècnic del Llibre Mestre (`IDEA-40`, `IDEA-32`/`IDEA-33`, `IDEA-41`/`IDEA-29`).

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

### 1. Context Operatiu i Línia Base (`HEAD`)
Partim del nou commit **`cd3b5b56c`** (`feat(og,gps,mapa,xat,edge): deute tècnic del pla 261028_1526 (Blocs A-G)`, sobre `e4c4e076c`/`565392e26` a la branca `backup-notes-publish`), on **Claude Code** ha aterrat els **Blocs A–G** en **223 fitxers** (`+16.906 / -769` línies) amb **3.770 proves verdes** (`3.508` Vitest + `262` Node) al precommit en **`24,3 s`** (`261028_1620_auditoria_claude.md`). El document rector d'aquest torn és el Pla d'Implementació canònic `_wiki_de_poble/04_escriptori/261028_1526_pla_implementacio_deute_tecnic_opengraph_edicio_i_xat.md`, que heu de llegir íntegrament junt amb els informes vius de l'Escriptori (`261028_1620_auditoria_claude.md`, `261028_1611_auditoria_codex.md`, `261028_1614_auditoria_gemini.md`, `261027_0730_reforma_editorial_gemini.md` i `261027_0730_solucio_opengraph_i_copy_codex.md`) i el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`).

### 2. Repartiment Estrictament Diferenciat per Aplicació (Protocol L'Olivera a 4 Bandes)
- **IAIA MarIA (Secretària Tècnica i Orquestradora en aquesta instància d'Antigravity):** Coordina amb el Mestre Javi, manté el Llibre Mestre i les portes, i **té terminantment prohibit tocar `src/` o `tests/`** (`core-secretaria-auditoria`).
- **Claude Code (Constructora i Picadora de Codi Principal):** És l'**única IA autoritzada a modificar `src/`, `tooling/` i `tests/`** en l'arbre viu. Ha d'implementar i integrar els 6 blocs del Pla `261028_1526`, executar les bateries de tests i generar el seu informe `261028_HHMM_implementacio_claude.md` (o `auditoria_claude.md`) a `_wiki_de_poble/04_escriptori/`.
- **GPT Codex (Revisora de Qualitat, Concurrència i Contractes):** Opera en mode **read-only sobre l'arbre viu** (utilitzant `/tmp` per a proves de regressió aïllades). Revisa cada bloc del Pla i els canvis de Claude a mesura que aterrissen, verificant l'escapat d'OpenGraph (`P1-61`), la neteja d'EXIF GPS (`OG-7`), el reset de l'`ErrorBoundary` (`P1-55`), la concurrència i aïllament del Share Target (`P1-31..34`), les Edge Functions (`P1-07`, `P1-18`) i els contractes SQL (`P1-13`, `P1-68`). Emet el seu dictamen a `_wiki_de_poble/04_escriptori/261028_HHMM_auditoria_codex.md`.
- **Gemini (Revisora d'Arquitectura, UI/UX Pedra Seca i Rendiment en finestra paral·lela d'Antigravity):** Opera en mode **read-only sobre el codi font** i revisa la fidelitat visual i geomètrica Pedra Seca (`P1-58`, `P1-57`, `P1-36`, `P1-37`, `P1-16`), la reforma editorial i l'escaneig de 6–8 negretes per paràgraf (`P1-60`, `P1-63`), la primera imatge real d'OpenGraph (`P1-61`) i el Port Neutral (`P1-27`). Emet el seu dictamen a `_wiki_de_poble/04_escriptori/261028_HHMM_auditoria_gemini.md`.

> **MÈTODE DE VERIFICACIÓ RIGOROSA (Obligatori):** L'Agent Local ha de processar aquest prompt amb verificació empírica completa. Planifica, construeix, revisa el teu propi resultat amb un *Revisor de Qualitat intern* (buscant regressió, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar la revisió de qualitat.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### T1 · Bloc A: OpenGraph Estàtic/Edge per a WhatsApp/Telegram (`P1-61` Fase 2) i Política Diferenciada EXIF GPS (`OG-7` + `P1-64`)
1. **`OG-7` + `P1-64` (Política Diferenciada de Privacitat GPS EXIF):**
   - **Fotos d'identitat personal (Avatar, Perfil Personal, Capçalera Personal i Xat Privat):** Purgar immediatament totes les metadades EXIF i coordenades GPS reals dels binaris públics `public/assets/fotos/javi-llinares-perfil-1200px.jpg`, `.webp` i variants, afegir un test automàtic de regressió sobre les fotos de perfil i garantir que en pujar una foto de perfil/avatar personal s'esborre sempre l'EXIF GPS per defecte mostrant l'avís transparent: *«🔒 Per la teua privacitat, s'han eliminat les dades GPS de la foto de perfil»*.
   - **Fotos de publicacions, esdeveniments, patrimoni i viatges (Hero i Carrusel/Galeria):** Mantindre activa i ben informada la casella de consentiment (`src/components/universal/enquadrament/exifIncrustat.js`: *«Conserva la ubicació i la data de la foto»*) tant per a la foto principal (**Hero**) com per a **cada foto del Carrusel/Galeria**, extraient i desant les seues coordenades (`lat`, `lng`, `precisio: 'exacta' | '100m' | 'poble'`) i data de captura per alimentar el Mapa Fotogràfic Multi-Escala (`P1-64`).
2. **`P1-61` Fase 2 (Pre-renderitzat Estàtic / Manifest i Shell Social + Rutes `/wikidepoble/<id>`):**
   - Copiar `_wiki_de_poble/04_escriptori/261027_0730_og_llibre_d_or_codex.png` a `public/assets/system/ui/og-llibre-d-or-1200x630.png` i crear `src/config/socialImages.js`.
   - Integrar els scripts i tests de `tooling/seo/` definits a `261027_0730_solucio_opengraph_i_copy_codex.md` (`build-social-manifest.mjs`, `prepare-social-shell.mjs`, `social-edge.mjs`, `apply-site-policy.mjs`, `build-site-policy.mjs` i les 5 suites `*.test.mjs`), més la generació d'HTML estàtic per ruta durant el build de Firebase Hosting (`dist/<ruta>/index.html`) per a les pàgines públiques i d'administrador, de manera que WhatsApp i Telegram reben sempre la **primera imatge real de la publicació o pàgina** i el seu títol/descripció sense executar JS.
   - **Aprovat per a la Wiki (`?item=` → `/wikidepoble/<id>`):** Pre-renderitzar `dist/wikidepoble/<id>/index.html` amb el seu títol i imatge OpenGraph (com el Llibre d'Or), fer que el botó de compartir genere `/wikidepoble/<id>` i que l'app accepte/redirigisca `/wikidepoble/<id>` a `?item=<id>` amb neteja d'estat entre rutes (`seo-client.patch`).

### T2 · Bloc B: Reforma Editorial (`P1-60`) i Enllaç Bilateral `/projecte` ↔ Wiki (`P1-63`)
1. **Integració de `PAGE_COPY` i Catàleg (`P1-60` i `P1-63`):**
   - Aplicar `copy-editorial.patch`, `copy-anima.patch` i `copy-tests.patch` sobre `src/sections/text/pageContent.js`, `src/sections/disseny/cataleg/manifest.js` i `src/config/systemPages.test.js`.
   - Verificar amb `node tooling/seo/check-editorial-copy.mjs` que els **62/62 paràgrafs llargs** (≥ 20 paraules) de `projecte`, `disseny`, `anima` i `descarregues` tenen entre **6 i 8 paraules en negreta**, subtítol H2 i entradeta en text pla, i el botó `.sdp-pagina-accio` cap a `/wikidepoble?item=el_projecte`.
2. **Sincronització de la Wiki i `wikiManifest.js`:**
   - Verificar la integritat d'`_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md` (18 errors com a `H3` al TOC) i `_wiki_de_poble/02_saber/el_projecte.md` (avís i enllaç de retorn a `/projecte`) segons `261027_0730_reforma_editorial_gemini.md`, i executar `node tooling/wiki/compile-wiki-to-app.mjs` per regenerar `src/data/wikiManifest.js`.

### T3 · Bloc C: Regressió P2 d'`ErrorBoundary` (`P1-55`) i Edició Avançada (`P1-58` + `P1-57`)
1. **`P1-55` (`GN-R01` a `src/sections/comunitat/FitxaVivaDeComunitat.jsx`):** Reiniciar l'`ErrorBoundary` pare quan canvie la comunitat activa (`key={comunitatId}` o `resetKeys` al boundary pare + reintent del loader `lazy()`) perquè una fallada de xarxa en la comunitat A no deixe bloquejada la comunitat B.
2. **`P1-58` i `P1-57` (`PageFrame.jsx`, `UniversalEditorShell.jsx`, `PerfilEditor.jsx`):**
   - Moure «Edició avançada de la fitxa» al slot `despresAutoria` de `PageFrame.jsx` (just **entre `<BarraTaronja>` i `<header className="page-title">` de l'H1**).
   - Reordenar els blocs interns de `.sdp-edicio-avancada__cos` a **`1. Capçalera` → `2. Avatar` → `3. Logotip`**.
   - Restaurar per a l'entitat pilot (`esPilot`) el slot d'avatar/logotip amb enquadrament no destructiu (`zoom`/`x`/`y`).

### T4 · Bloc D: Aïllament i Consum Recuperable del Share Target (`P1-31` a `P1-34`)
1. **`P1-31` (`compartirNatiu.js`, `XatContext.jsx`):** Lligar els lots compartits a `{ backendUrl, userId }` (conservant la transició `null → userId` en iniciar sessió) i cridar `descartaCompartit()` en fer logout o canviar d'usuari/backend.
2. **`P1-32` (`compartirNatiu.js`, `ControlsAdjunt.jsx`):** Implementar reserva/confirmació/alliberament no destructiu perquè si `ControlsAdjunt` es desmunta abans d'acabar `preparaAdjunt()`, la foto i el peu es restituïsquen.
3. **`P1-33` i `P1-34` (`CompartirNatiuPlugin.java` i `ShareViewController.swift`):** Tancar el descriptor en timeout, limitar pressupost agregat, afegir `handleOnDestroy()` amb `copiador.shutdownNow()`, usar `.toLowerCase(Locale.ROOT)` en Android i rebutjar `url.isFileURL` en `carregaUrl` d'iOS.

### T5 · Bloc E: REA Visual de WhatsApp (`P1-36`), Barra Única del Compositor (`P1-66`), Unificació Tipogràfica Semi-Condensed (`P1-67`), Botons (`P1-37`), Taules (`P1-16`) i Consola (`P1-35`)
1. **`P1-36` (`src/sections/xat/`, `src/css/modules.css`):** Targeta de conversa a **`96px`** (`2 × 48px`), avatar a **`74px–76px`**, títol i últim missatge agrupats sense buit mort, eliminació del botó `[...]` a la Fila 1, cerca col·lapsable per botó de Lupa i píndoles de filtre horitzontal.
2. **`P1-67` (Unificació Tipogràfica i Variant Semi-Condensed `87.5%` entre Barra Lateral Principal i Menús/Llistes del Xat i Sistema — Captura `_wiki_de_poble/04_escriptori/261028_1650_produccio_tipografia_sidebar_vs_xat.png`):**
   - **Mida tipogràfica idèntica en tots els menús del sistema (`16px` = `1rem`):** Actualment `.sdp-xat-llista` (`src/css/modules.css:3412`) hereta `font-size: var(--sdp-fluid-cos)` (**`20px`** en escriptori) de `ul, ol` (`src/css/base.css:169`), fent que els noms i resums del menú del Xat siguen més grans que el menú de la Barra Lateral Principal (`Xat`, `Mur`, `Mercat`, `Pobles`, `Bloc de notes`, `Sistema`, que usen `var(--sdp-font-barra)` = `1rem` = **`16px`**). Unificar `.sdp-xat-llista` / `.sdp-xat-fila, .sdp-xat-opcio` i la resta de menús/llistes secundàries a **`var(--sdp-text-small)` (`1rem` = `16px`)**: el menú del Xat mai ha de tindre la lletra més gran que el menú principal, sense baixar tampoc l'alçada per davall de `16px`.
   - **Variant Semi-Estreta (`SemiCondensed`, `font-stretch: var(--sdp-font-amplada-semi)` = `87.5%`):** Aplicar `font-stretch: var(--sdp-font-amplada-semi)` (`87.5%`, definit a `src/css/tokens.css:341` i `src/css/tipografia-estreta.css`) als menús i a la llista de converses (i incorporar l'arxiu variable `public/fonts/noto-sans-wdth-wght-latin.woff2` + `public/fonts/OFL.txt` documentat a `FONTS_LOCALS.txt:111-125` per activar l'eix `wdth` real) perquè els noms llargs (`Carmen Chave...`) i els resums càpien sense tallar-se prematurament ni reduir l'alçada de lletra.
3. **`P1-66` (`Compositor.jsx`, `ControlsAdjunt.jsx`, `Conversa.jsx`, `modules.css` — Captures `_wiki_de_poble/04_escriptori/261028_1638_produccio_whatsapp_compositor_referencia.png`, `261028_1638_produccio_socdepoble_compositor_actual.png` i `261028_1645_produccio_whatsapp_mobil_compositor.jpg`):**
   - Eliminar els dos botons blaus gegants permanents (`[ Foto o vídeo ]` i `[ Grava àudio ]`) i la línia permanent de quota que es mengen l'àrea de xat.
   - **Criteri d'Usabilitat Unificat Mòbil/Escriptori:** Teniu llibertat per triar i consolidar el disseny més usable i net en **una sola barra inferior** (combinant el millor de les captures d'escriptori i de mòbil sense necessitat de calcar-les):
     1. **Menú desplegable d'adjunts (`+` o `📎` + accés ràpid a foto/càmera)** que desplega cap amunt el popover flotant amb totes les opcions (**Fotos i vídeos**, **Arxiu/Document**, **Contacte**, **Esdeveniment**, **Enquesta**, i la quota de MB integrada discretament).
     2. **Gestor d'Emoticones (`😊` / `Smile`)** integrat a la mateixa barra/quadre de text `.sdp-xat-compositor__camp`.
     3. **Botó circular d'acció primària a la dreta** que mostra el **Micròfon (`Mic`)** per iniciar la gravació d'àudio quan el camp de text està buit (i sense adjunt preparat), i commuta automàticament a l'avió d'**Enviar (`Send`)** quan hi ha text escrit o un adjunt llest per enviar.
4. **`P1-37` i `P1-16` (`tokens.css`, `sdp.css`, `parseMarkdown.js`):** Unificar marges dels botons (`margin-inline: var(--sdp-space-4)`, `margin-block: var(--sdp-space-3)`), elevar el contrast de capçalera de `.sdp-taula-prosa` (`ΔE2000 ≥ 5`) i embolcallar les taules Markdown de `parseMarkdown.js:162-169` amb `.sdp-taula-prosa`, `role="region"`, nom i `tabIndex="0"`.
5. **`P1-35` (`src/sections/consola/`):** Mostrar la **Versió Canònica del Sistema** (`v1.0.1 (build 261028)`) i l'estat dels empaquetats multiplataforma.

### T6 · Bloc F: Serveis Edge, Idiomes, WordPress i Portes de Govern (`P1-07`, `P1-08`, `P1-09`, `P1-13`, `P1-18`, `P1-22`, `P1-26`, `CL-06..08`)
1. **`P1-07` i `P1-18`:** Corregir `aprovatVetat` (`nom.fallades > 0 || nom.adreces.length === 0`) i l'escàner lineal $O(n)$ a `supabase/functions/noticies/gestor.js`; aplicar lectura fitada per bytes (`<= 4096 B`) i cancel·lació completa a `supabase/functions/compte-apple/gestor.js`.
2. **`P1-22` i `P1-09` (`GN-R08`):** Afegir les 24 claus `t()` absents als 5 diccionaris, passar l'idioma des de `src/natiu/entrada.jsx` i `marcatge.php` a `UIContext.jsx`, corregir el fallback `ca_valencia` → `ca.mo` en `switch_to_locale()` per a WP < 6.5 i alinear els 3 tests d'empaquetat WP amb la v1.2.1.
3. **`P1-08`, `P1-26` i `CL-06..08`:** Incorporar `src/natiu/entrada.jsx` a `tractor-pedra-seca.mjs`, sentinella contra `facebook-ios-sdk` a `preflight.mjs`, resoldre el duplicat de `censImatges` i el mock de `fontServeis` a `AppsLector.test.jsx`, i deixar llestos o aplicats (segons frontera Reflex) la poda de `sdp-vigilant-tellado/SKILL.md` i el log TCC de `org.socdepoble.higiene.plist`.

### T7 · Bloc G: Mapa Fotogràfic EXIF Multi-Escala Poble/Món (`P1-64`) i Recerca Profunda d'Emowe (`P1-65`)
1. **Estudi obligatori dels materials d'Emowe al disc i al seu blog (`P1-64` i `P1-65`):**
   - Llegiu sencers els arxius custodiats pel Mestre a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261014_1930_emowe_mapa_de_tu_viaje/` (`LEEME.txt`, `PROMPT_UNIVERSAL.txt`, `plantilla-mapa.html` v3) i a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/001 NEXUS/` (`Mapa de mis agentes v0.1.html`, `mapa-de-mis-agentes/SKILL.md`, `mapa_agentes.py`), així com el seu blog `https://emowe.com/blog/` (`https://emowe.com/rss.xml`).
2. **Arquitectura del Mapa Fotogràfic EXIF Multi-Escala (`P1-64` · `src/sections/mur/mapConfig.js` i componentística del Mapa):**
   - Substituir l'iframe estàtic d'OpenStreetMap per l'arquitectura interactiva **Leaflet 100% lliure** inspirada en `plantilla-mapa.html`:
     - **Honestedat Visual Verd vs. Ocre:** **Verd (`#226b5c`)** = ubicació GPS EXIF real extreta de la foto (tant del **Hero** com de **cada foto del Carrusel/Galeria**); **Ocre (`#a77022`)** = ubicació estimada per proximitat temporal en una ruta/galeria o fallback municipal del poble (`poble_id`) quan la foto no té GPS.
     - **Clustering Jeràrquic *Complete-Link* (`nearbyGroups`) + Lliscador Manual (`Agrupació per distància`):** Llindars `[Infinity, 100, 60, 30, 15, 6, 2, 0.8, 0.2, 0]` km per distància Haversine real i desglossament de totes les fotos individuals en arribar a `zoom >= 16` (`showIndividualPhotos()`), permetent que un monument fotografiat a França i les fonts locals de La Torre convisquen al mateix mapa sense perdre l'escala de poble.
     - **Targetes de Foto Arrossegables amb Línia Puntejada (`bindCardDrag` + `drawCardLines`):** Targetes amb miniatura i carrusel arrossegables sense moure el mapa, connectades al punt GPS fix per una línia puntejada fina (`dashArray: '4 5'`), botó «Recol·locar grups» i commutador «Vore mapa / Ocultar mapa».
3. **Propostes d'I+D d'Emowe per a Sóc de Poble (`P1-65`):**
   - **Claude Code**, **GPT Codex** i **Gemini** han d'incloure una secció específica al seu informe amb les millores que proposen incorporar d'Emowe a la **Consola Termodinàmica**, al sistema d'**Agents i Skills** (estàndard atòmic de 4 peces `perfil → skill → tarjeta → candado`, separació determinista vs. cognitiva) i a l'arquitectura de **Sóc de Poble**, així com recomanar altres autors o repositoris d'aquest mateix nivell d'excel·lència pràctica.

### T8 · Bloc H (Onada 2 sobre `cd3b5b56c`): Revisió de Qualitat i Conformitat (QA) i Liquidació del Backlog Tècnic del Llibre Mestre
1. **Revisió de Qualitat i Conformitat (QA) sobre `cd3b5b56c` per a GPT Codex i Gemini:**
   - **GPT Codex:** Executar proves de regressió i verificació sobre els 223 fitxers modificats al commit `cd3b5b56c` (`git show --stat cd3b5b56c` i informe `261028_1620_auditoria_claude.md`): (a) els 111 HTML OpenGraph pre-renderitzats, `social-edge.mjs`, `publication-policy.mjs` i `/wikidepoble/<id>`; (b) la neteja binària EXIF GPS de les 10 imatges personals i la llista blanca de 8 fotos patrimonials de La Torre; (c) el reset d'`ErrorBoundary` (`P1-55`), l'època de sessió i reserva en 2 passos de `compartirNatiu.js` (`P1-31..34`), i els límits per bytes a `noticies` i `compte-apple` (`P1-07`, `P1-18`); i (d) **comprovació de qualitat de `wordpress-plugin/` (verificant que utilitza exclusivament les APIs estàndard de WordPress sense consultes directes `PDO` ni `mysqli`)** i revisió de contractes de `P1-68` i `P1-69`.
   - **Gemini:** Auditar en navegador i DOM el commit `cd3b5b56c`: l'encaix visual i privacitat de «Vore mapa» desactivat per defecte a `MapaFotografic.jsx` (`P1-64`), les targetes de conversa de `96px` amb avatar de `76px` i lupa col·lapsable (`P1-36`), el slot `despresAutoria` (`P1-58`), la versió canònica `v1.0.0 (build 261028)` a `/consola` (`P1-35`) i els 62/62 paràgrafs editorials (`P1-60`/`P1-63`), així com validar visualment `P1-66` i `P1-67` a mesura que Claude els aterre.
2. **Execució Tècnica Contínua de Claude Code sobre el Llibre Mestre (sense aturar-se després del push de `cd3b5b56c`):**
   - **`P1-66` (Prioritat #1 · Barra Única del Compositor de Xat):** Eliminar els 2 botons blaus gegants (`[ Foto o vídeo ]` i `[ Grava àudio ]`) i la línia fixa de quota de `ControlsAdjunt.jsx` (`>130px` d'estalvi vertical) i unificar `Compositor.jsx` + `ControlsAdjunt.jsx` en una sola barra inferior amb desplegable d'adjunts (`+`/`📎`), emoticones integrades i botó dinàmic `Micròfon` ↔ `Enviar`.
   - **`P1-67` (Prioritat #2 · Unificació Tipogràfica `16px` + `SemiCondensed` `87.5%`):** Corregir en `src/css/modules.css` l'herència de `20px` sobre `.sdp-xat-llista` / `.sdp-xat-fila` perquè iguale exactament els `16px` (`1rem`) de la Barra Lateral Principal (`nav.app-sidebar .nav-item`), aplicar `font-stretch: var(--sdp-font-amplada-semi)` (`87.5%`) i incorporar `public/fonts/noto-sans-wdth-wght-latin.woff2` + `public/fonts/OFL.txt` (`FONTS_LOCALS.txt:111-125`).
   - **`P1-68` (Prioritat #3 · Registre Mòbil d'1 Toc, Autogeneració de `@username` Únic i Sincronització Canònica de Poble a `public.profiles` — Captures `_wiki_de_poble/04_escriptori/261028_2008_produccio_supabase_profiles_1..4.png`):**
     - **Autogeneració i unicitat de `username` (sense `@` a la BD, mostrat com a `@username` a la UI):** Crear la migració SQL i el helper client (`proposaUsername(nom)` a `onboardingModel.js`) perquè tant `handle_new_user()` com `completa_la_meua_alta()` generen sempre un `username` únic en minúscules ASCII sense accents ni espais a partir del nom i cognom (ex. `Diego Calvo Bermejo` → `diegocalvo`, o `diegocalvo-2` si ja existix), fer backfill de les files amb `username IS NULL` (`Diego Calvo Bermejo`), afegir `'username'` a `CAMPS_PERFIL` (`src/data/supabase/auth.js:259`), `perfilDePersona` (`slug: fila.username || null`) i `PerfilEditor.jsx`, i mostrar al registre (`/registre`) i en la primera entrada post-OAuth la proposta editable `@username`.
     - **Sincronització canònica de Poble (`town_uuid`, `primary_town`, `town_name`, `provinces`, `comarcas`):** Preseleccionar per defecte el poble actiu (`La Torre de les Maçanes`) amb selector ràpid per canviar-lo al registre/perfil, i assegurar que `handle_new_user`, `completa_la_meua_alta` i l'actualització de perfil omplin sempre de forma atòmica i coherent `town_uuid`, `primary_town`, `town_name`, `provinces` i `comarcas` des de `public.towns` (i `public.town_memberships`), eliminant els `NULL` de `town_uuid`/`primary_town`.
   - **`P1-69` (Prioritat #4 · Botó Interactiu d'Instal·lació immediata `[ 📲 Instal·lar l'App (PWA) ]` a `/page/descarregues` — Captura `_wiki_de_poble/04_escriptori/261028_2013_produccio_descarregues_boto_pwa.png`):**
     - Com que la **Web / PWA (`socdepoble.org`)** ja és 100% operativa i instal·lable, afegir ara mateix a `/page/descarregues` (`/descarregues`, `src/sections/detail/PageDetailSection.jsx` + `src/sections/text/pageContent.js`) el botó primari d'acció **«📲 Instal·lar l'App (PWA)»** al peu de la capçalera `.page-title` (`.sdp-pagina-accio`) i a la secció `1. Aplicació web progressiva (PWA)`:
       - Capturar `window.addEventListener('beforeinstallprompt', ...)` i llançar `deferredPrompt.prompt()` en clicar el botó a Chrome/Edge/Android/Escriptori.
       - Si l'app ja està en mode instal·lat (`display-mode: standalone` o `navigator.standalone === true`), mostrar l'estat **«✓ Aplicació ja instal·lada en aquest dispositiu»**.
       - En Safari (iPhone/iPad/macOS, on no hi ha `beforeinstallprompt`), mostrar l'avís guiat amb els 2 passos (**«Prem Compartir ⬆️ i toca "Afegir a la pantalla d'inici"»**).
       - Deixar preparats a la configuració de `/page/descarregues` els slots de botó per a **Google Play (Android)** i **App Store (iPhone/iPad)** (i l'enllaç al connector de **WordPress.org**) perquè s'activen tan bon punt obriguem les botigues, i actualitzar `src/sections/detail/PageDetailSection.descarregues.test.jsx`.
   - **Residus propis de `261028_1620_auditoria_claude.md` i millores ràpides d'Emowe (`P1-65`):**
     - Passar `AbortSignal` a `llegix(url)` i lligar l'àmbit compost `{ backendUrl, userId }` en `src/natiu/compartirNatiu.js` (`C28-02`).
     - Incloure `resolver.getType(uri)` i `nomVisible(resolver, uri)` dins del timeout `ambTermini` a `CompartirNatiuPlugin.java` (`C28-07`).
     - Aplicar a `src/sections/mur/mapaFotografic.js` la separació `origen` vs. `inferencia` (`M1`) i la pre-agregació per coordenada arredonida `1e-4°` abans del clustering Complete-Link $O(n^3)$ (`M2`), i l'avís de torn tancat en `planned` sense rebut a `tancament.mjs` (`C1`).
   - **Polit tècnic pre-botigues del Llibre Mestre (`IDEA-40`, `IDEA-32`/`IDEA-33`, `IDEA-41`/`IDEA-29`):**
     - **`IDEA-40`:** Unificar el verd canònic `#0F672F` (WCAG AAA `7.19:1`) en `--sdp-verd` / `--sdp-accent-verd` i afegir l'indicador semàfor `squareBadge` a la Consola.
     - **`IDEA-32` i `IDEA-33`:** Alinear les icones de `24px` a la capçalera de `/app/notes` (`padding-left: 12px`, `gap: 8px`) i afegir l'índex desplegable H1–H6 sota `.bar-black` en notes llargues.
     - **`IDEA-41` (`IDEA-29`):** Canonitzador estructural de 3 passos `[ 🎴 Proposa Card ]` a `/app/notes` (`H1` → `H2` → `lead` sense duplicar paràgrafs al cos).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (servidor Vite ja actiu).
- **Criteris d'Acceptació Mesurables:**
  1. `node tooling/seo/check-editorial-copy.mjs` retorna `valid: true` amb `62/62` paràgrafs conformes i `errors: []`.
  2. Les 5 suites de `tooling/seo/*.test.mjs` passen al 100%, les imatges de perfil públic de `public/assets/fotos/` tenen zero coordenades EXIF GPS (`OG-7`), i el flux de Hero/Carrusel conserva/extrau les coordenades GPS amb consentiment informat (`P1-64`).
  3. `/usr/bin/time -p npm run test:precommit` ix amb codi `0` en menys de 30 segons i zero errors d'ESLint.
  4. Els informes de **Claude Code**, **GPT Codex** i **Gemini** queden depositats a `_wiki_de_poble/04_escriptori/` seguint la taxonomia canònica, amb la secció d'I+D d'Emowe (`P1-64`/`P1-65`) i la telemetria (`Model IA` i `Tokens consumits`) emplenada.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Contaminació de l'arbre viu si més d'una IA edita alhora:** Mitigat per la directiva estricta de rol: només **Claude Code** escriu a `src/`, `tooling/` i `tests/`; **Codex** i **Gemini** auditen sense modificar el codi font del repositori principal.
- **Desincronització entre el manifest de la Wiki i les rutes socials (`P1-61` / `P1-60`):** S'evita executant `node tooling/wiki/compile-wiki-to-app.mjs` abans de construir el manifest social (`build-social-manifest.mjs`) i verificant el hash de les fonts (`evidence.hashSrc`).
- **Fronteres protegides pel Reflex (`.agents/SKILLS_SEAL.json`, migracions SQL):** Cap migració s'aplica contra producció sense el Mestre, i qualsevol fitxer protegit per frontera es modifica només amb lease legítima o es lliura com a pegat verificable amb `git apply --check`.

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
- [[261028_1526_pla_implementacio_deute_tecnic_opengraph_edicio_i_xat]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[../10_actes/261028_1310_acta_marmota_triomf_marato_25h_opengraph_botigues_i_revisio_wp|261028_1310_acta_marmota_triomf_marato_25h_opengraph_botigues_i_revisio_wp]]
- [[261027_0730_reforma_editorial_gemini]]
- [[261027_0730_solucio_opengraph_i_copy_codex]]
