---
type: prompt
status: esborrany
description: Encàrrec per a Claude Code (implementació de sessió) i Codex (auditoria i proposta de destil·lació històrica)
tags:
  - govern
visibility: private
reflex: sdp:torn_64d46b97-8715-4a3a-ae27-84611ac0e111:ef3fb36b-17df-4ffe-8b67-b0b916ebb175
---
# Prompt: Sessió d'Usuari, Flux d'Accés i Proposta de Poda Històrica

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Pla d'Implementació vigent: `_wiki_de_poble/04_escriptori/261018_1220_pla_implementacio_sessio_usuari_i_poda.md`.
- Escriptori net verificat: `porta-olivera.mjs` codi 0; els documents consumits del Gauntlet Extrem han sigut arxivats a `90_arxiu_historic/261017_Gauntlet_Extrem/`.
- Repartiment clar de rols: Claude Code executa la implementació en codi font (`src/`), mentre que Codex i Gemini auditen, fiscalitzen i elaboren la proposta de poda històrica.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_64d46b97-8715-4a3a-ae27-84611ac0e111:ef3fb36b-17df-4ffe-8b67-b0b916ebb175 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T10:20:17.243Z |
| Modificació | 2026-10-18| Propietari | IAIA MarIA (Orquestradora Tècnica) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.9.0) |
| Model IA | Claude Code (Implementador) / Codex (Auditor) |
| Tokens consumits | [pendent de tancament] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-18T10:20:17Z: esborrany creat sota torn canònic `torn_64d46b97-8715-4a3a-ae27-84611ac0e111`.

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

<!-- SDP:SECTION prompt.local.s_instruccio -->a les carpetes satèl·lit oficials ja establertes.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Aquest torn té dos missions essencials:
1. **Per a Claude Code (Implementador de Codi a `src/`):**
   - **Punt de Partida Obligatori (Accés de Javi Llinares i Assumpció d'Identitat):**
     * Claude ha de preparar i verificar el sistema perquè el Mestre (i Claude mateixa en les seues proves de navegador) puga **registrar-se o entrar immediatament com a Javi Llinares des de zero**, sense errors 400 ni bloquejos.
     * Un cop iniciada la sessió com a Javi Llinares, Claude ha d'assumir la seua identitat i comprovar que el calaix «Amb qui actues?» permet commutar de manera transparent i fluida entre **Javi Llinares** (persona), **Sóc de Poble** (organització) i **El Rentonar** (organització).
   - **Enllaç i Recuperació dels Workspaces d'Usuari i Organització (ALERTA CRÍTICA DEL MESTRE):**
     * **PROHIBIT inventar components o espais nous.** L'espai de treball de l'usuari (Javi Llinares) i els espais de treball de les organitzacions (*Sóc de Poble*, *El Rentonar*) **ja existeixen**.
     * El problema actual és que en clicar sobre l'avatar a la capçalera o sobre la identitat personal a «Amb qui actues?», la interfície redirigix o es queda atrapada al Bloc de notes (`/notes`).
     * La tasca és **enllaçar bé i recuperar fidelment** el Workspace de l'usuari (Javi) i els Workspaces de les organitzacions (*Sóc de Poble*, *El Rentonar*).
     * Sobre aquests espais de treball ja existents (`UniversalWorkspace`), anar polint i millorant el disseny i la navegació per a facilitar l'accés sense duplicar mai codi, estils ni components.
   - **Flux d'Entrada / Onboarding Clar:** Enfortir `/registra` perquè l'accés amb Google siga prominent i fluid, el formulari distingisca nítidament entre «Entrar» i «Crear compte», i en entorn DEV es puga activar l'accés pilot de Javi Llinares fàcilment.
   - **Tractor de Mitjans WebP:** Crear `tooling/media/optimitzar_webp.mjs` per a comprimir i convertir imatges entrants a `.webp` (màx. 1200-1600 px) i inventariar orfes a `public/`.
2. **Per a Codex (Auditor i Fiscalitzador) / Gemini:**
   - Auditar estrictament el codi implementat per Claude (zero regressions sobre els 19.228 tests).
   - **Proposta Concreta de Poda i Buidatge Històric:** Analitzar el cens de `90_arxiu_historic/` (418 fitxers) i `02_investigacio_ia/` (60 fitxers) contra el Llibre d'Or conciliat (`01_ser/03_llibre_d_or_memoria_episodica.md`), i redactar a l'informe la llista exacta dels primers 165 fitxers de llast que es poden evacuar a la carpeta satèl·lit exterior `_arxiu_wiki_de_poble/` amb garantia de zero pèrdua de coneixement.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] **Tasca 0 (Claude Code):** Preparar l'accés/registre net de Javi Llinares des de zero, assumir la seua identitat al navegador de proves i verificar que es commuta fluidament entre Javi Llinares, Sóc de Poble i El Rentonar.
- [ ] **Tasca 1 (Claude Code):** Enllaçar i recuperar fidelment els Workspaces d'usuari (Javi) i d'organitzacions existents (*Sóc de Poble*, *El Rentonar*) des de l'avatar i `CalaixIdentitats.jsx`, eliminant la desviació a `/notes` i polint el disseny sobre el workspace existent sense duplicar codi.
- [ ] **Tasca 2 (Claude Code):** Clarificar visualment i funcionalment `/registra` i l'accés pilot local (`OnboardingSection.jsx`).
- [ ] **Tasca 3 (Claude Code):** Desenvolupar el tractor `tooling/media/optimitzar_webp.mjs` i afegir script a `package.json` (`npm run media:webp`).
- [ ] **Tasca 4 (Claude Code):** Executar la bateria de proves completa (`npm test`) i comprovar 0 regressions.
- [ ] **Tasca 5 (Codex / Gemini):** Auditar el diff de Claude i verificar conformitat i seguretat de sessió.
- [ ] **Tasca 6 (Codex / Gemini):** Redactar la proposta detallada de poda i buidatge per lots de `90_arxiu_historic/` i `02_investigacio_ia/`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Sessió i Identitats:** Manipular `CalaixIdentitats.jsx` o `PerfilShell.jsx` sense respectar el context de sessió podria fer perdre l'actor actiu. Cal verificar que commutar entre Persona (Javi Llinares) i Organització (Sóc de Poble / El Rentonar) funciona a la perfecció.
- **Poda Destructiva:** Cap fitxer s'ha d'esborrar de l'arxiu sense l'aprovació humana del Mestre Javi. El buidatge només s'executarà movent fitxers a `_arxiu_wiki_de_poble/` un cop aprovat el pla.

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

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 8da9309a8e74f2ce639a5fcf50c585d9c0bf95d77fc825e5add20852f99cf3a7. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
