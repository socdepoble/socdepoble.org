---
type: prompt
status: esborrany
description: Estudi d'arquitectura per al futur sistema offline local (socdepoble.cat)
tags:
  - govern
visibility: private
reflex: sdp:torn_985476f9-4fde-4d09-89e1-8e6cec734c02:7025d07b-5728-4ee5-956b-a5137791f8c9
---
# Prompt Sistema Offline

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[x] **Escriptori net i indexat** (Validat per IAIA MarIA)
[x] **Pla d'Implementació** (Innecessari, tasca teòrica a llarg termini)
[x] **Rebut obtingut**

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_985476f9-4fde-4d09-89e1-8e6cec734c02:7025d07b-5728-4ee5-956b-a5137791f8c9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T19:09:59.429Z |
| Modificació | 2026-10-03T19:09:59.429Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude 3.5 Sonnet |
| Tokens consumits | [Per omplir per Claude] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-03T19:09:59.429Z: esborrany creat; contingut i verificació pendents.

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

Claude, necessitem la teua capacitat de visió arquitectònica a llarg termini per al que anomenem la "Programació Radical". Abans de dependre del backend de Sollutia, teníem un somni i unes idees clares per a un sistema 100% autònom, *offline-first* i local. Aquest sistema es desplegaria sota el domini `socdepoble.cat` (ara redirigit) i seria el pla de contingència absolut per a quan caiga internet al món rural. 

La instrucció d'aquest torn és que, en paral·lel al desenvolupament actiu actual, comences a llegir, recuperar i destil·lar totes aquelles idees i dissenys antics que es van haver d'aparcar quan vam canviar d'arquitectura. Vull que prepares el terreny, analitzant l'històric i creant un document especial amb tot aquest coneixement. Quan tinguem memòria i tokens de sobres (atès que enguany tenim límit elevat), la idea és posar-te a desenvolupar aquest sistema "offline" complet i dissenyar com es podria arribar a "enxufar" de forma reversible al sistema actual quan ens faça falta.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Llig tot l'històric i els arxius rellevants sobre la visió original *offline-first* i la descentralització abans del pacte amb Sollutia.
- T2: Crea un arxiu especial (informe d'arquitectura) recopilant i organitzant les idees, disseny, base de dades local (IndexedDB/CRDTs) i estratègies d'aquesta "Programació Radical".
- T3: Fes un primer esbós teòric de com, un cop construït, podríem endollar/desendollar l'usuari cap al backend de `socdepoble.cat` sense trencar l'SPA actual.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Aquesta és una tasca purament teòrica i de recuperació de la memòria històrica per ara.
- Sota **CAP CONCEPTE** has de modificar l'arquitectura SPA actual ni trencar el codi del *Master Branch* que depèn de Sollutia. Tot s'ha de mantenir en un document separat (com a disseny a llarg termini).

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
