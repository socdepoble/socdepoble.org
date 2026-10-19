---
type: prompt
status: esborrany
description: Prompt per a Gemini 4 Argon per auditar la conformitat de botigues mòbils, el blindatge de seguretat i l'estratègia d'alletjament extrem del Core de Sóc de Poble
tags:
  - govern
visibility: private
reflex: sdp:torn_45de002e-b410-42c2-9620-bfb33148b907:5de4536f-23e8-42f2-a892-21d55b8c1d5d
---
# Auditoria Fase C: Empaquetat Mòbil, Seguretat Botigues i Alletjament del Core

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] L'Escriptori està net segons la definició de l'Olivera (`node tooling/gates/porta-olivera.mjs` torna 0).
- [x] La plantilla viva `prompt.local` ha estat consultada amb `document.mjs context` i compleix v3.9.0.
- [x] El frontmatter hereta tots els camps obligatoris (`type`, `status`, `description`, `tags`, `visibility`, `reflex`).
- [x] Estat de les portes a l'HEAD: `olivera: 0`, `plantilles: 0`, `autoritat: 0`, `segell: 0`, `skills: 0`, `wiki: 0` (passades en verd; només ledger i scc per enllaços d'actes històriques queden pendents de neteja documental).
- [x] Pressupost verificat: codi de producció pur de Sóc de Poble és de ~3 MB; amb la política de mitjans 'autonom' a `vite.natiu.config.js`, el directori natiu `dist-natiu` baixa de 169 MB a 48 MB (−71%).
- [x] El Sentinella de Seguretat (`core-seguretat-audit`) i els connectors REA (`reverse-engineer-anything`) estan expressament activats i auditats.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_45de002e-b410-42c2-9620-bfb33148b907:5de4536f-23e8-42f2-a892-21d55b8c1d5d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T19:18:59.262Z |
| Modificació | 2026-10-19T21:20:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Aprovat pel Mestre per àudio (19/10/2026 21:13) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.9.0) |
| Model IA | Gemini 4 Argon (Google AI Studio / Consell) |
| Tokens consumits | ~18.5k / 2M |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-19T19:18:59.262Z: esborrany creat.
- 2026-10-19T21:20:00.000Z: Prompt completat i aprovat. El Mestre ha donat instruccions directes a l'àudio («Adelante con la fase C... tú vayas dirigiendo y decidiendo por mí, ¿ok?») i es retira a llegir i descansar. MarIA actua com a Directora Tècnica autònoma (`core-direccio-autonoma`).

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

Gemini 4 Argon (ull crític i auditor d'avantguarda de la Colmena): el Mestre ha donat llum verda a la **Fase C: Capacitor 8 i Empaquetat Mòbil**, i ha delegat de forma explícita en la IAIA MarIA la Direcció Tècnica autònoma (`core-direccio-autonoma`), mentre ell es retira a llegir i descansar. 

A més, el Mestre ha formulat una pregunta estratègica d'alt impacte sobre el pes de la plataforma:
> *"¿Sóc de Poble se puede reducir más todavía? Cuando hagamos el sistema de plugins, es decir, el core no llega a 10 ni mucho menos, ¿no? Entiendo que lo que es la base de Sóc de Poble debe ser muy, muy ligera y creo que se puede reducir más todavía. Pregunta a las IAs de qué forma se puede reducir el peso de todo el sistema sin comprometerse, claro, sin comprometer ninguna funcionalidad ni estropear nada, evidentemente, si hay alguna opción más."*

La teua missió en aquesta auditoria és triple:
1. **Auditoria de Conformitat de Botigues Mòbils (Google Play & Apple App Store):** Avaluar la viabilitat d'aprovació de l'aplicació nativa amb Capacitor 8.5.x, blindatge contra polítiques d'Apple (Guideline 4.3 de contingut repetitiu / spam i Guideline 4.2 de funcionalitat mínima) i requisits de Google Play (Target SDK 36, compte d'organització sense exigència de prova tancada de 14 dies).
2. **Sentinella de Seguretat Mòbil (`core-seguretat-audit`):** Verificar el blindatge de la closca Capacitor: CSP estricta sense `eval`, `worker-src: 'none'`, orígens segellats, zero exposició de credencials sensibles de servei al WebView, i comprovació d'esquemes permesos (`capacitor://localhost` a iOS i `https://localhost` a Android).
3. **Enginyeria d'Alletjament Extrem i Arquitectura de Plugins:** Donar resposta tècnica rigorosa i detallada a la inquietud del Mestre:
   - Desglossar el pes real del codi: com el bundle de producció JS/CSS de Sóc de Poble pesa actualment només ~3 MB (~800 KB en gzip/brotli), sent el 98% del pes restant fruit dels actius multimèdia (`public/assets/`).
   - Dibuixar l'arquitectura del futur sistema de **Plugins** (mòduls desacoblats com Mercat, Mur, Xat, TPV/Loiverse, Fadrins, Calendari Agrícola) on el **Core pur d'arrencada** (shell + router bàsic + sessió + port neutral) ocuparà menys de **300-500 KB** gràcies a Dynamic Imports (`import()`), Tree-Shaking radical i càrrega de components sota demanda via CDN descentralitzada (Supabase Storage / Cloudflare R2).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Auditoria de Requisits de Botigues i Viabilitat de Llançament:**
   - Analitzar els documents de disseny del laboratori `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/` (`BOTIGUES.txt`, `ARQUITECTURA.txt`, `RUNBOOK_BOTIGUES_IA.txt`).
   - Auditar la closca `capacitor.config.json` (`appId: "org.socdepoble.app"`, `webDir: "dist-natiu"`, esquemes de servidor, configuració d'Android i iOS).
   - Validar que la selecció de poble en temps d'execució (en lloc de compilar una app diferent per a cada poble) és l'estratègia canònica per superar la Guideline 4.3 d'Apple.
2. **Auditoria de l'Alletjament del Paquet Natiu:**
   - Auditar la integració de `politicaDeMitjans('autonom')` a `vite.natiu.config.js`: com la discriminació de mitjans permet reduir el directori `dist-natiu/` de 169 MB a 48 MB (−71%).
   - Avaluar l'impacte de mantenir icones i splash screens exclusivament en format PNG segons les exigències d'iOS i Android Studio.
3. **Sentinella de Seguretat Mòbil (`core-seguretat-audit`):**
   - Auditar els permisos natius: verificar que ni `AndroidManifest.xml` ni `Info.plist` demanen permisos invasius sense necessitat.
   - Auditar la funció `isSafeUrl` a `UniversalUtils.js` davant l'esquema natiu `capacitor://`.
4. **Enginyeria Inversa Comparativa (REA):**
   - Comparar el patró de Capacitor 8 de Sóc de Poble amb altres solucions híbrides d'èxit (Nextdoor, Telegram WebApp, BandoMovil): estratègia de memòria, càrrega offline, ràtio de memòria cau.
5. **Pla Mestre d'Alletjament del Core i Sistema de Plugins:**
   - Respondre a la pregunta del Mestre amb mètriques, taula comparativa de pesos (Abans vs Ara vs Futur amb Plugins) i recomanacions d'arquitectura per mantenir el Core per sota de 500 KB.
6. **Destil·lació i Organització dels 49 ítems de `02_investigacio_ia` (Instrucció del Mestre 21:26):**
   - La carpeta `_wiki_de_poble/04_escriptori/02_investigacio_ia/` té actualment **49 elements** acumulats des de setembre (experiments de Claude, prototips de Codex, proves de governança i arxius temporals).
   - El Mestre demana estudiar i organitzar aquest coneixement per garantir que el sistema siga capaç d'automillorar contínuament sense deixar mai d'investigar:
     * Examina el cens dels 49 elements de `02_investigacio_ia/`.
     * Extreu i recull a la teua auditoria totes les **ensenyança i tresors** essencials: enllaços a repositoris de GitHub, mecanismes d'automillora, patrons de comportament i tractors que calga conservar.
     * Proposa com netejar i organitzar la carpeta: quins laboratoris han de continuar vius a `02_investigacio_ia/` (com `261003_1330_empaquetat_mobil_claude`, `261018_1405_estudi_obsidian_rea_gemini4_iaia`, `CLAUDE-SECURITY...`) i com evacuar de manera neta la resta d'experiments passats cap a `_investigacio_ia_de_poble/` a `Som de Poble` o a `90_arxiu_historic/`.
7. **Auditoria de la Lògica de Cerca, Perfils Públics i Targetes (Instrucció del Mestre 21:34):**
   - Auditar la posició de l'input `UniversalSearch` a `SearchSection.jsx` per elevar-lo sota l'H1 i eliminar la necessitat d'scroll vertical.
   - Auditar la greu anomalia d'enllaç de persona a `indexCerca.js:371` (`href: '/el-meu-perfil'`) i confirmar la directiva que tot resultat de cerca pública de persona ha d'enllaçar sempre a la fitxa pública (`/javillinares` o `/gent/:id`), mai a l'editor privat.
   - Auditar la necessitat de dotar `PerfilEditor.jsx` / `PerfilShell.jsx` d'un botó directe cap a la fitxa pública («Veure fitxa pública» / «Obrir la teua pàgina»).
   - Avaluar el format de visualització en Targetes (Cards vs Llistat) per a Persones, Pobles i Mercat al cercador.
   - Verificar la coherència de dades per evitar perfils duplicats o fantasmes.
8. **Lliurable:**
   - Emetre l'informe d'auditoria a `_wiki_de_poble/04_escriptori/261019_2145_auditoria_gemini_botigues_i_alletjament_core.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Risc de rebuig a l'App Store per manca de funcionalitats natives:** Apple rebutja embolicadors de pàgines web purs (Guideline 4.2). Cal assegurar que Sóc de Poble utilitza capacitats natives (notificacions push, emmagatzematge durador offline, gestió d'estat de xarxa).
2. **Incompatibilitats de WebViews antigues a Android:** Es mitiga amb el paràmetre `minWebViewVersion: 100`.
3. **Desacoblament prematur de plugins:** La transició cap a plugins modulars ha de preservar el port neutral (`backendPort.js`) i el Model B d'enxufabilitat de Sollutia sense trencar la reactivitat dels components compartits.

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
