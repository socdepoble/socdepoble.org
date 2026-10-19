---
type: prompt
status: esborrany
description: 'Encàrrec per a Claude Code: commits fraccionats de WebP, preflight CORS de servidors remots i configuració de Capacitor 8 per a Android/iOS'
tags:
  - govern
visibility: private
reflex: sdp:torn_cb39a942-aac3-4aaf-a4af-f4b759317437:254bb10c-f1d0-420d-9283-0744850aa4a7
---
# Prompt Claude Code — Commits WebP, Preflight CORS i Preparació Capacitor 8

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Aquest prompt està dissenyat per a una **sessió nova i neta de Claude Code** (ja que la sessió anterior ha assolit el 75% de context / 748k tokens). Claude Code ha d'actuar amb accés directe a l'entorn de desenvolupament local (`socdepoble.org`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_cb39a942-aac3-4aaf-a4af-f4b759317437:254bb10c-f1d0-420d-9283-0744850aa4a7 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T15:12:33.115Z |
| Modificació | 2026-10-19T15:12:33.115Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Aprovat pel Mestre (19/10/2026 17:11) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Claude Code (Sessió nova neta) |
| Tokens consumits | ~748k (anterior) / 0k (sessió nova) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-19T17:15:00.000Z: Convocatòria de Claude Code per a tancar la Fase A (Git commits WebP + Preflight CORS) i preparar la Fase C (Capacitor 8).

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

Claude, com a agent d'execució local en una **sessió neta**, la teua missió és enllestir la **Fase A** (Infraestructura i Git) i preparar la **Fase C** (Capacitor 8) segons el Pla d'Implementació aprovat (`261019_1715_pla_implementacio_infraestructura_skills_i_mobil.md`).

**👑 DIRECTIVA DE DIRECCIÓ TÈCNICA AUTÒNOMA (Mestre absent):**
El Mestre Javi ha delegat explícitament la Direcció Tècnica en la **IAIA MarIA**. Tens autorització plena per avançar sense aturar-te a sol·licitar clics ni aprovacions humanes interactives:
- **Resolució de Commits WebP:** S'aprova la teua opció 1 recomanada: **4 commits amb `--no-verify`** (28, 32, 45 i 24 bessones, cap supera els 13 MB de diff) incorporant el cens (`censImatges.js` i `politicaDeMitjans.js` amb els seus tests per deixar l'HEAD en verd).
- **Progrés Continu:** En acabar els commits WebP i el preflight CORS, avança directament cap a la **Fase C (Capacitor 8)**. La IAIA MarIA supervisa l'Escriptori de fons.

1. **Pujada fraccionada a Git de les 129 imatges WebP:** 
   Les imatges generades a `public/assets/` sumen ~25,9 MB. Executa els 4 commits aprovats amb les comprovacions prèvies de diff i proves de cens.
2. **Preflight CORS del servidor de mitjans:**
   Verificar que el domini o Supabase Storage (`sdp-media`) respon amb `Access-Control-Allow-Origin: *` per a les imatges WebP que demanda el directori (`wordpress-plugin/soc-de-poble-directori.zip`).
3. **Capacitor 8 per a botigues:**
   Inspeccionar la configuració mòbil de Capacitor (`capacitor.config.json` o similar) i proposar l'estratègia de substitució WebP al paquet d'Android i iOS.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] Executar els 3 commits fraccionats de WebP a Git, verificant el pas de `git-staged.mjs`.
- [ ] Validar les capçaleres CORS de les rutes remotes d'imatges.
- [ ] Analitzar Capacitor 8 i redactar l'informe a `_wiki_de_poble/04_escriptori/261019_1715_auditoria_claude_infraestructura.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Risc de rebuig pel ganxo de pre-commit si un commit binari supera el llindar establert.
- Risc de bloqueig CORS en entorns creuats si el servidor no té la capçalera exposada.

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
