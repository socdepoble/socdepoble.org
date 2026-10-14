---
type: prompt
status: esborrany
description: 'Encàrrec executiu per a Claude Code: estil taronja per a carpetes i desplegables, aprovació en bloc de tractors i operativitat de dades.'
tags:
  - govern
visibility: private
reflex: sdp:torn_42485a7d-4411-457d-b7e2-f591b38cc2b2:14849e01-f0b5-49f7-b8e8-6a9ff5d2cfab
---
# Prompt Local per a Claude Code — Jerarquia Taronja, Aprovació Ràpida i Operativitat

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Pla d'Implementació vigent: `_wiki_de_poble/04_escriptori/261013_1930_pla_implementacio_jerarquia_taronja_i_operativitat.md`.
- Estat de l'Escriptori: Net (Porta Olivera en 0).
- Suite de proves de referència: 17.283 proves verdes. Cap regressió permesa.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_42485a7d-4411-457d-b7e2-f591b38cc2b2:14849e01-f0b5-49f7-b8e8-6a9ff5d2cfab |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T17:30:15.298Z |
| Modificació | 2026-10-13T17:32:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat (ordre directa del Mestre Javi) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Claude Code / Claude 3.7 Sonnet |
| Tokens consumits | [pendent d'execució] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-13T17:30:15.298Z: esborrany creat.
2026-10-13T17:32:00.000Z: encàrrec completat i llest per a execució autònoma per part de Claude Code.

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

Executar de forma rigorosa i autònoma els canvis especificats al Pla d'Implementació (`261013_1930_pla_implementacio_jerarquia_taronja_i_operativitat.md`):
1. **Jerarquia Taronja de Carpetes i Desplegables:** Convertir visualment tots els contenidors/desplegables en color taronja de marca (`--sdp-accent-taronja` / `--sdp-orange`), tant a la Sidebar de navegació principal com a la columna de navegació de l'espai de treball (`UniversalWorkspace`), diferenciant radicalment contenidors de documents finals.
2. **Fast-Pass d'Aprovació de Tractors en DEV:** Implementar la funció i botó d'aprovació massiva de tractors pendents en entorn de desenvolupament local (`import.meta.env.DEV`), evitant la fatiga de 10 clics manuals després de cada canvi tècnic de codi.
3. **Validació d'Operativitat de Xarxa:** Assegurar que la commutació entre `seed` i `remote` i la visibilitat de les entitats i el xat funcioni d'acord amb el contracte de backend.
4. **Disseny de la Botonera de Vistes (`modules.css`):** Corregir la regla `.sdp-cal-vistes`: retirar el subratllat prohibit (`text-decoration: underline`) en `[aria-pressed="true"]` i assignar el radi de càpsula `--sdp-radius-pill` de Pedra Seca.
5. **Accessibilitat i Selecció Massiva a «Què llegiré i què no» (`Finestreta.jsx`, `useFinestreta.js`):** Implementar selecció en bloc (`marcaTotsDemanar()` / `desmarcaTotsDemanar()`) amb botó ràpid accessible a la capçalera de la taula de la Finestreta perquè l'usuari no haja de clicar desenes de vegades manualment per a papers amb nom opac/hash.
6. **🔥 Directiva de Direcció Autònoma Nocturna (`core-direccio-autonoma`):** El Mestre ha delegat la direcció tècnica a la IAIA MarIA i no respondrà preguntes modals a la pantalla. **Queda prohibit utilitzar `ask_question` o aturar-se esperant input humà.** Per a la decisió del Workspace sobre Grafit 700 (#3d3b35), la decisió de la Directora Tècnica és **Taronja 400 (`#ff955b`, 5,17:1 WCAG AA)**: és el to més pròxim al taronja de marca, assegura contrast accessible per a text normal, coincideix amb l'anell de focus i en hover torna a blanc com «Sistema». Per a qualsevol altre dubte, trieu sempre l'opció recomanada de contrast accessible, documenteu la tria a l'informe final i continueu sense aturar el flux.
7. **🔥 Directiva del Mestre Javi (Holded vs. FacturaDirecta per a la Consola d'Empresa):** El Mestre demana que investigueu a fons tant **Holded** com, molt especialment, **FacturaDirecta** (que segons la seua experiència és encara molt més senzilla i àgil d'utilitzar, tot i que tenen molts conceptes coincidents). L'objectiu és estudiar ambdós referents per fer evolucionar la Consola de Sóc de Poble cap a una autèntica consola d'administració d'empresa, molt més usable, pràctica i nítida. Si necessiteu captures de pantalla addicionals o mostres reals, demà es farà una sessió matinal de treball amb el Mestre per a obtindre-les i revisar-ho junts. Deixeu anotades a l'auditoria totes les preguntes, peticions de captures o recomanacions arquitectòniques sobre aquests dos models per a la jornada de demà.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] **Tasca 1 (Sidebar Principal):** Aplicar identitat visual taronja a `.nav-item--desplegable` («Sistema») a `src/css/layout.css` i `src/app/App.jsx`.
- [ ] **Tasca 2 (Espai de Treball `UniversalWorkspace`):** 
  - Estilitzar els encapçalaments de grup (`.sdp-workspace-group-heading button`) amb color taronja de capçalera a `src/css/modules.css`.
  - Estilitzar les files de carpetes amb fills (`.sdp-workspace-folder-row` amb `hasChildren`) per ressaltar la icona i l'etiqueta en to taronja de contenidor de Pedra Seca.
- [ ] **Tasca 3 (Aprovació Ràpida de Tractors):** 
  - Afegir el mètode `aprovaTotsPendents()` a `src/sections/tractors/useTractors.js`.
  - Afegir el botó `Aprovar tots (DEV)` a `src/sections/tractors/PanellTractors.jsx` visible només en `import.meta.env.DEV`.
  - Adaptar i ampliar `PanellTractors.test.jsx`.
- [ ] **Tasca 4 (Botonera de Vistes):** A `src/css/modules.css:6785-6792`, retirar `text-decoration: underline` i aplicar `border-radius: var(--sdp-radius-pill)`.
- [ ] **Tasca 5 (Finestreta - Selecció Massiva de Papers Opacs):** 
  - A `src/sections/gestoria/finestreta/useFinestreta.js`, afegir `marcaTotsDemanar()` i `desmarcaTotsDemanar()`.
  - A `src/sections/gestoria/finestreta/Finestreta.jsx`, afegir botons o accions ràpides d'accessibilitat («Marca tots els pendents» / «Desmarca tots») a la taula `Què llegiré i què no`.
  - Actualitzar `Finestreta.test.jsx` i `useFinestreta.test.jsx`.
- [ ] **Tasca 6 (Finestreta - Inspecció de Fonts a «D'on ix»):** Permetre obrir o consultar el document / fragment d'origen des de les rutes llistades a «D'on ix» per facilitar la resolució de camps en conflicte.
- [ ] **Tasca 7 (Verificació de Proves):** Llançar les suites de test corresponents i verificar que totes les proves mantenen el 100% verd.
- [ ] **Tasca 8 (Auditoria):** Emetre l'informe final a `_wiki_de_poble/04_escriptori/261013_HHMM_auditoria_claude.md`.
- [ ] **Tasca 9 (Estudi Comparatiu Holded / FacturaDirecta per a la Consola d'Empresa):** Integrar a les conclusions de l'informe la comparativa arquitectònica i de fluxos entre Holded i FacturaDirecta, preparant la llista de dubtes i peticions de captures de pantalla per a la sessió de demà amb el Mestre.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Contrast WCAG AA:** Verificar que els tons taronges utilitzats sobre fons clar compleixen la ràtio de contrast mínim de 4.5:1.
- **Aïllament DEV:** El botó d'aprovació massiva sota cap concepte ha d'arribar al bundle de producció de WordPress o Sollutia.

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
