---
type: prompt
status: esborrany
description: 'Directrius d''implementació per a Claude Opus i Gemini: emojis de 36px a 40px i comportament d''inserció estandarditzat.'
tags:
  - govern
visibility: private
reflex: sdp:torn_823c12d5-e3f6-4ba9-8031-d90b99226b8c:c0081c36-67c7-4806-aaba-5e59b5c60381
---
# Prompt d'execució local: Selector d'emojis grans i paritat WhatsApp

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents implementadors (Claude/Gemini).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` verificat amb `node tooling/gates/porta-olivera.mjs` (0 errors).
- [x] **Pla d'Implementació**: generat a `_wiki_de_poble/04_escriptori/261022_1425_pla_implementacio_emojis_grans_i_paritat_whatsapp.md`.
- [x] **Sentinella de Seguretat**: verificat codi de components frontend, zero dependències externes noves, zero càrrega de scripts forasters.
- [x] **Enginyeria Inversa i Paritat amb REA**: paritat de comportament amb WhatsApp Web / Telegram Web per a la inserció d'emojis i focus.
- [x] **Directora Tècnica**: MarIA supervisa, orquestra i audita; la implementació s'encomana exclusivament a agents de codificació (Claude Opus, Gemini).
- [x] **Rebut obtingut**: sdp:torn_823c12d5-e3f6-4ba9-8031-d90b99226b8c:c0081c36-67c7-4806-aaba-5e59b5c60381.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_823c12d5-e3f6-4ba9-8031-d90b99226b8c:c0081c36-67c7-4806-aaba-5e59b5c60381 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T12:39:11.791Z |
| Modificació | 2026-10-22T12:39:11.791Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Claude 3.5 Sonnet / Gemini 1.5 Pro |
| Tokens consumits | 0 (local) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-22T12:39:11.791Z: esborrany creat; contingut i verificació pendents.

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

Llegiu i executeu el **Pla d'Implementació** de referència a `_wiki_de_poble/04_escriptori/261022_1425_pla_implementacio_emojis_grans_i_paritat_whatsapp.md`.
La missió d'aquest torn és redissenyar el component del selector d'emoticones de Sóc de Poble (`SelectorEmoticones.jsx`) i la seua integració al compositor del xat (`Compositor.jsx`), garantint que les emoticones siguen **clarament visibles i fàcils de polsar** per a gent gran de poble (mida de **36px a 40px** per icona, diana tàctil de 48px), replicant el flux ergonòmic de WhatsApp.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Mida Gran de les Emoticones a `SelectorEmoticones.jsx`:**
   - Incrementar la mida de font de les emoticones a `2.25rem` - `2.5rem` (**36px a 40px**).
   - Augmentar la mida del botó tàctil individual a mínim `48px x 48px` (o `52px x 52px`), assegurant el compliment WCAG 2.2 AAA per a dits grans de gent gran.
   - Ajustar el contenidor del popover (`.selector-emoticones` o equivalent) amb amplada i alçària suficients (per exemple `max-height: 320px`, `width: 340px - 360px`) i scroll suau per categories.
   - Preservar les pestanyes de categories existents (cares, animals, menjar, activitats, objectes, símbols, banderes).

2. **Flux d'Inserció i Paritat WhatsApp a `Compositor.jsx`:**
   - Botó commutador d'emoticones a la barra d'eines inferiors (icona de la cara somrient).
   - En fer clic a una emoticona:
     - Inserir el caràcter exactament a la posició actual del cursor (`selectionStart` / `selectionEnd`) dins de l'àrea de text (`textarea`).
     - Després de la inserció, moure el cursor immediatament a la dreta de l'emoji inserit.
     - Retornar o mantindre el focus a l'àrea d'escriptura perquè l'usuari puga continuar escrivint sense haver de fer clic de nou.
   - Comportament de tancament ergonòmic:
     - Tancar el selector en prémer la tecla `Escape`.
     - Tancar el selector en fer clic fora del popover (*click-outside*).
     - Tancar el selector en enviar el missatge (`Enter` o botó d'enviament).

3. **Verificació i Proves:**
   - Executar la suite de proves del xat (`npm test -- src/sections/xat`) per confirmar que cap prova regressa.
   - Afegir proves unitàries a `SelectorEmoticones.test.jsx` que comproven la nova mida gran i la propagació correcta de l'esdeveniment de selecció.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Solapament en pantalles mòbils petites:** Si el popover creix massa en amplada, podria desbordar en pantalles de 320px-360px. Cal fer servir `max-width: calc(100vw - 24px)` i posicionament absolut calculat respecte a la part inferior.
- **Pèrdua de selecció del cursor:** En navegadors mòbils, fer clic al selector d'emojis pot desenfocar el `textarea` i perdre la posició de `selectionStart`. Cal enregistrar l'última posició de selecció abans de perdre el focus per inserir l'emoji exactament on tocava.

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

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 33bf809f3e982c6466f238664086d7b48b527bb30bb5a07843541902a279b315. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
