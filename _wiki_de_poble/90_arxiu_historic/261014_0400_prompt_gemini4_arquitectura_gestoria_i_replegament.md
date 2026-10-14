---
type: prompt
status: esborrany
description: 'Prompt per a Gemini 4: auto-descobriment de carpetes, ergonomia FacturaDirecta/Holded i replegament lateral'
tags:
  - govern
visibility: private
reflex: sdp:torn_dfd3a753-a75b-4317-9332-814fce86cb2f:e3acf1bb-0021-4abd-8df0-8b2258d07c93
---
# PROMPT GEMINI 4: Auto-descobriment Gestoria i Replegament

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Verificat Escriptori net per la Porta Olivera (codi 0). Quota de Gemini 4 Argon High al 97% restant (Weekly) i 92% (5h). Represa neta per evitar timeouts d'execució previs.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dfd3a753-a75b-4317-9332-814fce86cb2f:e3acf1bb-0021-4abd-8df0-8b2258d07c93 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T01:52:56.965Z |
| Modificació | 2026-10-14T03:55:00.000Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Gemini 4 Argon High (1M context) |
| Tokens consumits | [en curs] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-14T03:55:00.000Z: Prompt d'arrencada neta lliurat per la IAIA MarIA per al co-working de Gemini 4 Argon High amb Claude Code.

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

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Gemini 4 Argon High, com a Gran Arquitecte del Consell amb finestra d'1M de tokens, tens el 97% de bateria setmanal intacte. La teua missió és dissenyar l'arquitectura d'auto-descobriment de carpetes de Gestoria a `_gestoria_de_poble/`, les conciliacions bancàries visuals estil FacturaDirecta/Holded, i blindar el patró de replegament de columnes d'`AppGridShell`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Arquitectura d'Auto-descobriment de Carpetes (`_gestoria_de_poble/`):**
   - L'usuari no ha de pujar carpetes manualment: la IA i l'escàner local han d'explorar l'arbre real del disc.
   - Dissenya el model de descobriment per a categoritzar automàticament:
     * Extractes bancaris (Sabadell, CaixaBank, BBVA, etc., en formats CSV/C43/PDF).
     * Carpetes de factures per any/trimestre (emeses i rebudes).
     * Propostes de NIF/proveïdor basades en l'apunt bancari o concepte.

2. **Conciliacions i Duplicats Visuals (Zero Friction):**
   - Algorisme per aparellar moviments bancaris amb factures registrades (data propera, import coincident o suma de factures).
   - Detecció clara de duplicats (per evitar pagar o declarar dues vegades la mateixa despesa).
   - Especificar com presentar enllaços clicables directes a la UI (`/app/gestoria/bancs` i `/app/gestoria/full`) perquè el Mestre puga revisar la factura associada amb 1 clic.

3. **Ergonomia del Model FacturaDirecta & Holded:**
   - Analitzar els patrons que han fet líders a FacturaDirecta i Holded (claredat visual, separació d'impostos trimestrals 303/130, vista taula ampla i neta).
   - Definir l'especificació tècnica per a la taula `/app/gestoria/full` perquè Claude puga implementar-la amb precisió mil·limètrica.

4. **Blindatge del Patró de Replegament Lateral (Pedra Seca / `sdp-app-grid-shell`):**
   - El Mestre demana conservar a tot el sistema el botó `[|<]` que col·lapsa la barra lateral cap a l'esquerra mostrant només les icones (estalvia espai i dóna llibertat a l'usuari).
   - Auditar que totes les seccions del sistema complisquen aquest patró sense anomalies visuals.

5. **Lliurable:**
   - Redactar l'auditoria i proposta arquitectònica completa a `_wiki_de_poble/04_escriptori/261014_0415_auditoria_gemini4.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Evitar solucions dependents d'APIs externes no disponibles en mode desconnectat. Tot l'auto-descobriment i conciliació ha de poder córrer en Local-First (File System Access API / IndexedDB).
- Evitar crides excessivament pesades en bucle que puguen provocar nous timeouts de l'agent. Desglossar el treball en fases clares.

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

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 89652d0020c665ffb26152e000fbf97406f3716c40b74f914cab4a04652b3513. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
