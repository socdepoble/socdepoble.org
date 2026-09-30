---
type: prompt
status: esborrany
description: Ordre d'execució per a calcar l'UI de WhatsApp
tags:
  - govern
visibility: private
reflex: sdp:torn_a45ed6d5-78be-482f-9c90-a718a3140c51:913416d3-e72d-4e3f-b338-5a34be4336e2
---
# Prompt Claude WhatsApp

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[pendent]

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a45ed6d5-78be-482f-9c90-a718a3140c51:913416d3-e72d-4e3f-b338-5a34be4336e2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T13:25:56.415Z |
| Modificació | 2026-09-30T13:25:56.415Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T13:25:56.415Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Aquesta és una sessió inèdita de **Co-working a Tres Bandes**. Tu (com a Fable Ultra Code) i Codex (com a Astra Ultra) treballareu en paral·lel. Mentre Astra fa una cirurgia extrema del backend a WordPress, tu assumiràs el repte d'**Arquitectura Lògica d'Usuari i UX** més gran del projecte.

La directiva és transcendir la UI per dissenyar conceptualment on va cada peça (mur, xat, grups). T'has d'inspirar al 100% en l'ús diari de WhatsApp (per minimitzar fricció en gent major), però integrant conceptes subjacents d'**Obsidian** i **Raindrop** (bookmarklet) per fer que el "guardar" i "ordenar" informació siga intuïtiu. 

A més, estem preparant-nos per al Fedivers: necessitem que idees com "seguir a algú de fóra" s'integren lògicament a la UI.

Tens un company d'elit (Astra Ultra) treballant simultàniament amb tu en aquest mateix Escriptori. **Cada 5 minuts (o al finalitzar cada iteració important)** has d'anar a llegir el Pla d'Implementació Compartit (`_wiki_de_poble/04_escriptori/260930_1545_pla_implementacio_coworking.md`) per vore quin és l'estat del teu company, anotar els teus propis avenços en el teu Carril, i deixar-li missatges.

Quan acabes, realitzaràs una auditoria adversarial extrema sobre el codi de Codex.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: **Lògica UX basada en WhatsApp:** Analitza les captures de WhatsApp de la carpeta `01_produccio/`. On posem els conceptes propis de Sóc de Poble perquè encaixen en pestanyes estil WhatsApp? Dissenya-ho perquè no calga programar res nou a nivell d'usuari, sinó interaccionar amb botons familiars.
- T2: **Integració Raindrop/Obsidian:** Explica com ficarem el *bookmarklet* i el concepte d'enllaços bidireccionals dins la SPA de manera natural.
- T3: **Fedivers i Autoreproducció:** Descriu el funcionament teòric: com s'autoreprodueix el sistema? Com afegim a algú extern al nostre llistat de contactes?
- T4: Anota tot açò al teu Carril en el Pla Compartit. Després, llegeix el Carril d'Astra i emet una crítica constructiva i profunda sobre l'auditoria i els canvis que ell ha fet.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Calcar WhatsApp vol dir trencar alguns dels nostres patrons visuals actuals (colors taronja, marges). Pensa com ho podem integrar sense perdre del tot l'ànima de Pedra Seca.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 884ebb252c7392cd615ac1aa18f2fe4f18952575fd094bb6508d53c060c7f7a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
