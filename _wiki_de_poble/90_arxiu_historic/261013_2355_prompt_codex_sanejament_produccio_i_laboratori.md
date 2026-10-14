---
type: prompt
status: esborrany
description: 'Encàrrec adversarial per a GPT Codex: sanejament de 01_produccio, verificació de trasllat del laboratori IA i optimització de la consola.'
tags:
  - govern
visibility: private
reflex: sdp:torn_dda495f1-6c4b-4301-88d9-2c306ea24d80:9b92a697-0e3c-4022-af7e-d05b29b47a46
---
# Prompt Local per a GPT Codex — Auditoria Adversarial de Producció, Laboratori IA i Consola

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Pla d'Implementació vigent: `_wiki_de_poble/04_escriptori/261013_1930_pla_implementacio_jerarquia_taronja_i_operativitat.md`.
- Estudi de Destil·lació del Laboratori IA: `_wiki_de_poble/04_escriptori/261013_1600_estudi_destil_laboratori_ia.md`.
- Estat de l'Escriptori: Net (Porta Olivera en 0).
- Rol assignat a GPT Codex: **Revisor Adversarial i Sanejador Forense** de `01_produccio/`, `02_investigacio_ia/` i la Consola.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dda495f1-6c4b-4301-88d9-2c306ea24d80:9b92a697-0e3c-4022-af7e-d05b29b47a46 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T21:56:03.987Z |
| Modificació | 2026-10-13T22:00:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat (ordre directa del Mestre per àudio) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | GPT Codex / ChatGPT Codex |
| Tokens consumits | [pendent d'execució] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-13T21:56:03.987Z: esborrany creat.
2026-10-13T22:00:00.000Z: encàrrec completat i llest per a execució autònoma per part de GPT Codex.
2026-10-14T01:50:00.000Z: DESCONVOCATÒRIA EMESA («Cadascuna a sa casa»). Informe emés a `261014_0002_auditoria_codex.md`. Claude ha lliurat els 6 fronts amb 17.458 proves verdes. S'ordena l'aturada immediata de qualsevol cron recurrent per preservar la quota setmanal (63% restant).

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

Executar una **auditoria adversarial forense** sobre tres fronts d'higiene i sostenibilitat del projecte:
1. **Auditoria de Zona de Producció (`04_escriptori/01_produccio/`):** Classificar exhaustivament els 27 elements (10 carpetes i 17 fitxers) que hi habiten. Determinar quins elements han estat integrats al codi font (ex. clons Loyverse i WhatsApp a `UniversalWorkspace`), quins són duplicats obsolets (ex. els 5 formats de `checklist-limpieza-wp-ayudawp` i `Alergenos-ES_COPIA-ES_POT_BORRAR`), i quins recursos gràfics o audios originals s'han de protegir intactes. Proposar una matriu d'arxivat segura cap a `90_arxiu_historic/`.
2. **Revisió de Destil·lació del Laboratori IA (`04_escriptori/02_investigacio_ia/`):** Contrastar l'estudi `261013_1600_estudi_destil_laboratori_ia.md`. Validar si les 19 entrades proposades per al trasllat a l'arxiu històric tenen cap dependència oculta a les suites de test (`src/apps/bar/llavors/laParroquia.test.js` o scripts de `tooling/`).
3. **Auditoria de Sanejament de la Consola Termodinàmica:** Inspeccionar el codi de la consola (`src/pages/admin/SolatgeConsole.jsx`, components del panell de control) per identificar targetes inactives, mètriques orfes o blocs de sediment que calga netejar perquè el tauler siga àgil, clar i sense sobrecàrrega.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] **Tasca 1 (Forense de `01_produccio`):** Elaborar una taula de triatge de tots els elements de `04_escriptori/01_produccio/`: estat (integrat / duplicat / actiu humà), justificació i acció recomanada (conservar / arxivar a 90_historic / quarantena).
- [ ] **Tasca 2 (Verificació de laboratori IA):** Comprovar l'impacte en Vitest de les 19 entrades marcades per a trasllat a `261013_1600_estudi_destil_laboratori_ia.md`.
- [ ] **Tasca 3 (Auditoria Consola Termodinàmica):** Revisar `SolatgeConsole.jsx` i `modules.css` per a detectar elements de disseny morts o no conformes amb Pedra Seca.
- [ ] **Tasca 4 (Auditoria d'Invariants de la Gestoria):** Contrastar les noves peces d'Escàner Local i Finestreta amb els invariants financers de partida doble i integritat de dades.
- [ ] **Tasca 5 (Informe Final):** Redactar l'auditoria a `_wiki_de_poble/04_escriptori/261013_HHMM_auditoria_codex.md` sense tocar ni esborrar directament cap arxiu de `01_produccio` (AGENTS §12).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Zona Humana Sagrada (AGENTS §12):** La IA no pot esborrar ni moure unilateralment cap fitxer de `01_produccio/`. Tota proposta s'ha d'emetre com a dictamen perquè el Mestre o MarIA l'aprove.
- **Trencament de Proves:** Comprovar que cap trasllat de laboratori trenque suites actives abans de recomanar-ne l'arxiu.

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
