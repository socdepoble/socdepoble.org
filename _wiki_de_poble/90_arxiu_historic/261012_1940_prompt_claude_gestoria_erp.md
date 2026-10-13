---
type: prompt
status: esborrany
description: Ordres per a Claude per implementar el nou dashboard ERP de la Gestoria V2
tags:
  - govern
visibility: private
reflex: sdp:torn_8f2e40ba-660b-41a9-818f-557ac881e445:2e2bee44-082c-41a6-87b5-cb3c85f67cdf
---
# Prompt Gestoria V2 (ERP)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Escriptori netejat segons la Porta Olivera.
- Torn `torn_8f2e40ba-660b-41a9-818f-557ac881e445` obert i validat.
- L'agent ha llegit el document `261012_1915_arquitectura_visual_erp.md` abans de començar.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8f2e40ba-660b-41a9-818f-557ac881e445:2e2bee44-082c-41a6-87b5-cb3c85f67cdf |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T17:35:40.658Z |
| Modificació | 2026-10-12T17:35:40.658Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.6.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-12T17:35:40.658Z: esborrany creat; contingut i verificació pendents.

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

Has de dur a terme el redisseny complet de la interfície de la Gestoria V2 per convertir-la en un **Panell ERP professional** (tipus Odoo o Ever-Gauzy), executant l'estratègia definida al Pla d'Implementació.
El repte és augmentar la densitat d'informació, usar *Sidebars* i *Top bars* de context, i mostrar gràfics o barres de progrés CSS natius sense dependre de components externs, respectant l'ànima de Pedra Seca.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. Llig el document d'investigació a l'Escriptori: `02_investigacio_ia/261012_1915_arquitectura_visual_erp.md` per entendre les lliçons visuals (Dashboards multidimensionals, Pipelines, Simuladors).
2. Refactoritza `ShellGestoria.jsx` per incloure una barra lateral de mòduls i una capçalera de context (any/trimestre).
3. Implementa almenys un component visual de progrés (barra o tirador) basat en CSS natiu i HSL per projectar la liquidació d'impostos.
4. Adapta els components fills del Tauler perquè encaixen dins d'aquest nou layout dens, substituint les targetes aïllades tradicionals.
5. Repara qualsevol test de `src/sections/gestoria` que falle pel canvi d'estructura DOM.
6. **Integració d'IAs al Calendari d'Equip:** El Mestre ha demanat que les IAs siguen tractades com a membres de l'equip al calendari de la plataforma. Proposa al teu informe com integrar els estats de fatiga tèrmica (ex. "Compte El Rentonar bloquejat fins divendres a les 12:00") perquè qualsevol humà sàpia quina IA està disponible.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Assegura't de no trencar el flux de dades existent provinent del pont V2 (`useGestoria`). Les dades fluiran igual, només canvia la presentació visual.
- Ajusta manualment el disseny responsiu perquè la *Sidebar* i el *Dashboard* siguen usables des del telèfon (lectura d'un salt, 15pt tipografia base).

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 c7f9cebc8d206eb7bda0ce5e74b7f2f69489818cb35b733024a8181eb6645b11. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
