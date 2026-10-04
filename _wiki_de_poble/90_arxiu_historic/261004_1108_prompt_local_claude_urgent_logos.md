---
type: prompt
status: esborrany
description: Ordre directa per assegurar que tota pàgina universal mostre el logotip de l'entitat creadora (600px) com a norma general.
tags:
  - govern
visibility: private
reflex: sdp:torn_b10e938f-9aa6-4aaf-b81a-364771ca2ed5:6c7ca3c4-2009-4592-98bc-28b88a56cd0b
---
# Ordre Urgent: Logotips a les Pàgines Universals

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
| Identificador | sdp:torn_b10e938f-9aa6-4aaf-b81a-364771ca2ed5:6c7ca3c4-2009-4592-98bc-28b88a56cd0b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T09:07:46.503Z |
| Modificació | 2026-10-04T09:07:46.503Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T09:07:46.503Z: esborrany creat; contingut i verificació pendents.

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

Company Claude, atenció a aquesta norma de disseny estructural sobre capçaleres:
Quan una **empresa o entitat** (per exemple, *Sóc de Poble*) té pàgines creades per ella, **totes les seues pàgines han de portar el seu logotip dalt, en gran (a 600px de resolució o format d'amplada gran)**. Cal tindre clar que l'entitat té un avatar (per al xat) i un logotip apaïsat (per a la pàgina). A la pàgina va el logotip, ajustant l'alçada a eixos màxim 600px d'amplada. Açò aplica a totes les pàgines, incloses les del sistema, tret d'excepció dictada.

Per contra, davant la qüestió de les **persones o la IAIA (ents de carboni o silici)**:
- Han de mostrar el seu **avatar redó**, centrat dalt de l'H1, amb una mida gran però estandarditzada inferior a la del logotip (per exemple, 300px o 360px).
- La idea és que l'usuari entenga que punxant en eixe avatar gran podrà canviar la seua imatge.
- Prova primer a renderitzar-ho amb aquest avatar; si visualment no agrada com queda a la pàgina, es llevarà i es deixarà sense res, però comença intentant fixar l'avatar gran.

Necessitem que audites les Pàgines Universals i vistes del sistema per assegurar que aquesta norma es complix de forma estricta durant aquesta passada final abans de tancar l'1.0.3.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Auditar la UniversalPage per verificar la presència de logotip o avatar dalt de l'H1.
- T2: Afegir el logotip (màx 600px) per a entitats i l'avatar redó (300-360px) per a persones/IA.
- T3: Incloure aquesta revisió visual en la passada final abans del *build*.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Trencament del disseny responsiu si la imatge de 600px no s'escala bé en pantalles xicotetes (aplicar CSS correcte d'amplada màxima).

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
