---
type: prompt
status: esborrany
description: Prompt d'auditoria adversarial per a Gemini (germana gran a Antigravity) sobre la implementació nativa de Share Target a Android i iOS, avisos del xat i sanejament visual
tags:
  - govern
visibility: private
reflex: sdp:torn_5845fc05-0f16-4766-9939-8eeb07dd8c4d:1ca7642b-9ad3-4ca2-abc9-724770927e97
---
# Gauntlet Loop de Gemini: Auditoria adversarial del menú Compartir natiu i avisos del xat

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Escriptori net verificat: `node tooling/gates/porta-olivera.mjs` amb codi 0.
- Pla d'implementació canònic: `[[261026_1615_pla_implementacio_share_target_notificacions_i_xat]]`.
- Informe d'auditoria previ de Claude: `[[261026_1815_auditoria_claude]]`.
- Directiva de Direcció Autònoma: Gemini (germana gran en Antigravity) opera com a auditora d'enginyeria de sistemes i seguretat amb accés directe a disc, terminal i codi font.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5845fc05-0f16-4766-9939-8eeb07dd8c4d:1ca7642b-9ad3-4ca2-abc9-724770927e97 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T18:35:55.160Z |
| Modificació | 2026-10-26T18:35:55.160Z |
| Propietari | MarIA (Directora Tècnica) |
| Aprovació humana | aprovat (Mestre Javi, instrucció en àudio per a Gauntlet Loop Codex + Gemini) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Gemini (Germana Gran a Antigravity) |
| Tokens consumits | pendent |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-26T18:35:55.160Z: esborrany creat.
2026-10-26T19:35:00.000Z: instrucció de Gauntlet Loop adversarial completada i assignada a Gemini en Antigravity.

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

Gemini, com a germana gran a Antigravity, la teua missió és dur a terme una **Auditoria d'Enginyeria de Sistemes i Seguretat (Gauntlet Loop)** sobre la implementació nativa que Claude ha realitzat en el torn `torn_e6be28f2` (menú «Compartir» a Android i iOS, avisos natius de xat, barres blanques de Capacitor i sanejament visual).

El codi està sense commit a l'arbre de treball local, a l'espera de la teua anàlisi profunda. Revisa l'informe de Claude a `[[261026_1815_auditoria_claude]]`, però valida contra el codi real a disc: seguretat del FileProvider i URIs a Android, gestió de recursos a l'App Group d'iOS, robustesa de les cues d'adjunts al Xat i absència de regressions a la web i al connector de WordPress.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Auditoria d'Arquitectura Nativa i Capacitor 8:**
   - Inspecciona `capacitor.config.json`, `android/app/src/main/AndroidManifest.xml`, `MainActivity.java` i `CompartirNatiuPlugin.java`.
   - Verifica com Capacitor gestiona el cicle de vida de les activitats, la recepció d'intents en fred vs en calent i que no hi haja fuites de memòria en context de plugins estàtics.
   - Avalua la solució aplicada per a la barra d'estat (`SystemBars.style = "DARK"` i `styles.xml`) i confirma que no afecte negativament altres pantalles o diàlegs.

2. **Auditoria de Seguretat de l'Extensió d'iOS:**
   - Inspecciona `ios/App/Compartir/ShareViewController.swift`, `CompartirNatiuPlugin.swift`, `ControladorSdp.swift` i entitlements d'App Group.
   - Revisa la conversió i sanejament d'imatges HEIC/JPEG/PNG, la neteja d'EXIF i coordenades GPS per protegir la privacitat dels veïns.
   - Verifica que el directori compartit de l'App Group s'allibere correctament després de cada ingesta.

3. **Auditoria de Flux de Dades i React 18.3.1:**
   - Inspecciona `src/sections/xat/ReceptorCompartit.jsx`, `src/sections/xat/components/DialegCompartir.jsx` i `src/sections/xat/useCompartitPendent.js`.
   - Assegura't que l'estat de sessió i permisos estiga blindat: si l'usuari no està autenticat, què passa amb els fitxers compartits?
   - Verifica que el peu de foto compartit viatge correctament cap al bucket privat de Supabase `xat_adjunts` respectant les polítiques RLS.

4. **Verificació de Proves i Qualitat:**
   - Passa `npm run test:precommit` i analitza les noves proves unitàries afegides per Claude.
   - Detecta si hi ha casos límit (edge cases) no coberts per les proves actuals.

5. **Emissió de l'Informe d'Auditoria:**
   - Emet el teu informe a `_wiki_de_poble/04_escriptori/261026_1615_auditoria_gemini.md`.
   - Detalla les teues conclusions com a **[BLOQUEJANT]**, **[MILLORA]** o **[CONFORME]**.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Risc 1 (Concurrència en recepció múltiple):** Pèrdua de fotos quan l'usuari comparteix més d'un fitxer simultàniament des de la galeria nativa.
- **Risc 2 (Privacitat i metadades):** Fuita inadvertida de geolocalització o dades privades a la càrrega d'adjunts.
- **Risc 3 (Regressió de barreres natiu/web):** Injecció de mòduls natius en entorns web purs o WordPress que puga provocar errors en temps d'execució.

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
