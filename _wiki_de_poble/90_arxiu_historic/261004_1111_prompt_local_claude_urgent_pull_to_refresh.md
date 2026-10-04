---
type: prompt
status: esborrany
description: Ordre directa per implementar l'efecte d'arrossegar cap a baix per recarregar la pàgina (pull-to-refresh) en dispositius mòbils.
tags:
  - govern
visibility: private
reflex: sdp:torn_19f918b3-dce9-44cb-a810-0ff3936533b3:dff0c7bb-8b15-441a-8b26-6e30f99b9286
---
# Ordre Urgent: Pull-to-refresh a mòbils

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_19f918b3-dce9-44cb-a810-0ff3936533b3:dff0c7bb-8b15-441a-8b26-6e30f99b9286 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T09:10:54.933Z |
| Modificació | 2026-10-04T09:10:54.933Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T09:10:54.933Z: esborrany creat; contingut i verificació pendents.

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

Company Claude, un requisit d'usabilitat clau d'última hora abans de tancar el paquet 1.0.3 per a *Gent de la Torre*:
**S'ha d'implementar i garantir que funcione l'efecte de 'pull-to-refresh'** (arrossegar el dit cap avall per a recarregar la pàgina o el feed) en dispositius mòbils. 

En l'última versió de Gent de la Torre es va perdre o no funcionava correctament, i és una interacció fonamental que els usuaris esperen. Et preguem que ho audites i, si no està implementat (o està fallant per algun bloqueig del scroll, *overscroll-behavior* o z-index), ho repares i ho implementes a nivell de l'enquadrament principal (`AppGridShell` o l'àrea de contingut rellevant).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Revisar la lògica de scroll al contenidor principal de l'aplicació per a dispositius tàctils.
- T2: Implementar (o reparar) el comportament de 'pull-to-refresh' natiu o emulat, assegurant que actua quan l'usuari arrossega cap avall des de la part superior del contingut.
- T3: Incloure aquesta millora dins la passada final prèvia a la versió 1.0.3.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Conflictes de scroll si hi ha panells niuats o *overflow: hidden* que capturen els esdeveniments tàctils de manera errònia.
- Compte amb la propietat `overscroll-behavior-y` i com interactua amb la barra mòbil i el comportament natiu del navegador en PWA.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 6d988b3a752dac3f4108497058a90efbf107d50b70e5e25c3557edb20653ff0a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
