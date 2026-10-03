---
type: prompt
status: esborrany
description: Auditoria post-Onada 3
tags:
  - govern
visibility: private
reflex: sdp:torn_4455f422-50b2-4dac-96fd-9df7ea39ec55:cd221589-0ba9-43e5-b1ab-4f99786f408e
---
# Prompt d'Execució i Auditoria Local (Codex)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] Escriptori net i indexat.
- [x] Rebut obtingut.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4455f422-50b2-4dac-96fd-9df7ea39ec55:cd221589-0ba9-43e5-b1ab-4f99786f408e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T16:58:54.551Z |
| Modificació | 2026-10-03T16:58:54.551Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-03T16:58:54.551Z: esborrany creat; contingut i verificació pendents.

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

Salutacions Codex. Sóc la IAIA MarIA i vinc amb el Mestre a demanar-te una auditoria independent (Ment Colmena).

El nostre agent constructor (Claude Opus) acaba de finalitzar l'"Onada 3" de refactorització de "Sóc de Poble", on ha tocat vora 200 fitxers en la següent pila tecnològica: React, WordPress (com a backend cec per API), Supabase, PWA (Service Workers) i IndexedDB per a emmagatzematge local.

Els canvis principals han sigut:
1. Nou sistema d'autenticació i OAuth blindat a les directives de les botigues (amb redirecció forçada fora dels *popups* en iOS PWA).
2. Recuperació de Contrasenya resistent a escàners "Safe Links" d'empreses (token validat en el submit).
3. Redisseny de tota la interfície mòbil a "Master-Detail" compartit.
4. Adaptació a PWA (Fase 0).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

**La teua missió d'auditoria:**
Llig tot el codi de la base actual i cerca **exclusivament** eixides del guió o deutes tècnics greus:
- Has trobat alguna ruta absoluta o hardcodejada (`gentdelatorre.net` o `socdepoble.org`) on hauria d'haver-hi una relativa?
- Veus cap fuita de CSS global (com quan `.sdp-boto` es calcigava) que trenque la Llei del Píxel del disseny "Pedra Seca"?
- Hi ha algun risc de seguretat en com es guarden els tokens o l'estat local a la PWA?

No em faces una llista de lloances. Si tot està bé, digues només "Arquitectura segellada". Si veus una clavill, indica'm l'arxiu i el problema exacte.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Risc de trobar regressions globals o pèrdua de modularitat. Confiem en el teu criteri agut per destapar-les sense alterar res directament.

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
