---
type: prompt
status: esborrany
description: 'Prompt d''execució per a Claude Opus i auditoria per a Gemini: conversió física d''imatges, blindatge de pujades a webp al client i activació de fallback a main.jsx'
tags:
  - govern
visibility: private
reflex: sdp:torn_651710eb-f443-4aeb-a934-562596927f81:42a67c0c-e15f-4d5f-a857-cf454c756f22
---
# Encàrrec a Claude i Gemini: Transició Integral a WebP i Fallback de Bessones

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Pla d'implementació associat: `_wiki_de_poble/04_escriptori/261022_1645_pla_implementacio_transicio_webp_i_salvavides.md` (aprovat per la IAIA MarIA i el Mestre).
- Rebut de torn vigent: `sdp:torn_651710eb-f443-4aeb-a934-562596927f81:42a67c0c-e15f-4d5f-a857-cf454c756f22`.
- Directiva directa del Mestre (Àudio 261022_1637): «Ara que tenim poques imatges és el moment de fer-ho bé: canviar tots els enllaços a webp, assegurar-se que estan a disc, i que qualsevol imatge que entre al sistema desaparega com a jpeg i es convertisca en webp. El fallback és un salvavides invisible per si de cas».

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_651710eb-f443-4aeb-a934-562596927f81:42a67c0c-e15f-4d5f-a857-cf454c756f22 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T14:46:37.020Z |
| Modificació | 2026-10-22T14:46:37.020Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-22T14:46:37.020Z: esborrany creat; contingut i verificació pendents.

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

Claude Opus assumix el rol d'**Implementador Principal** per executar la transició integral a WebP natiu i connectar la xarxa de seguretat invisible de bessones a l'SPA autònoma.
Gemini 4 Argon assumix el rol d'**Auditor Adversari** per validar la seguretat dels canvis, comprovar que no hi ha fuites de memòria al Canvas de conversió de pujades, verificar que totes les proves continuen en verd i emetre l'informe final a l'Escriptori.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1: Conversió d'imatges locals pendents a WebP (Claude)
- Executar: `node tooling/media/optimitzar_webp.mjs converteix public/assets/img/*.jpg public/assets/fotos/*.png public/assets/towns/*/*.jpg --aplica`
- Assegurar-se que per a cada original JPEG o PNG a `public/assets/` es genera físicament el fitxer `.webp` corresponent.

### Tasca 2: Blindatge de la pujada al client a `src/utils/pujadaImatge.js` (Claude)
- Revisar `src/utils/pujadaImatge.js` (i qualsevol pipeline de pujada a Supabase Storage del Perfil, Mur o Editor).
- Implementar la conversió client-side abans de la transferència a Supabase:
  * Si el fitxer és una imatge (JPEG o PNG), redimensionar-lo a un màxim de 1600px i comprimir-lo a `image/webp` mitjançant un Canvas (`canvas.toBlob(blob => ..., 'image/webp', 0.82)`).
  * Substituir l'extensió del nom a `.webp` i establir `contentType: 'image/webp'`.
  * D'aquesta manera cap nou fitxer JPG o PNG entrarà al bucket de Supabase Storage.

### Tasca 3: Activació del Fallback de Bessones a `src/main.jsx` (Claude)
- A `src/main.jsx`, importar `instalaFallbackDeBessones` des de `src/config/fallbackBessones.js`.
- Cridar `instalaFallbackDeBessones(document.body)` a l'arrencada de l'SPA.
- El fallback actuarà en fase de captura davant d'errors `404` en elements `<img>`: si demana `.webp` i falla, commutarà a `.jpg` (o viceversa) i emetrà un avís per consola sense trencar la visualització de l'usuari.

### Tasca 4: Verificació de Suite de Proves i Build (Claude)
- Executar `npm test -- src/utils/pujadaImatge.test.js` (o afegir proves unitàries per a la conversió WebP del client).
- Executar `npm run build:web` per comprovar que Vite compila netament i col·loca tots els WebP generats a `dist/`.

### Tasca 5: Auditoria Adversària de Qualitat (Gemini)
- Inspeccionar el codi modificat per Claude.
- Verificar que el Canvas allibera els contextos i no genera fuites de memòria (Memory Leaks).
- Verificar que el fallback de bessones no entra en bucles infinits davant imatges absents de debò.
- Emetre informe a `_wiki_de_poble/04_escriptori/261022_HHMM_auditoria_gemini.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Imatges completament inexistents:** Si una imatge no existeix ni en `.webp` ni en `.jpg`, el mecanisme de fallback compta amb el sentinel `dataset.sdpFallback = '1'` per no fer més d'un intent i aturar el bucle.
- **Rendiment en dispositius mòbils:** La conversió a WebP al client via Canvas ha de ser asíncrona i lleugera (màx 1600px de costat llarg) per no congelar la interfície.

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
