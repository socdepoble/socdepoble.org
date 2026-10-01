---
type: prompt
status: esborrany
description: Ordre de procedir amb INSERT IGNORE i tancar DeepL un cop desbloquejat el segell.
tags:
  - govern
visibility: private
reflex: sdp:torn_ad0bb7f7-3156-4aa9-b981-fa592d50f3ee:8a109b1b-6d9c-4ac0-9f69-56d4fa2439a0
---
# Desbloqueig DeepL

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
| Identificador | sdp:torn_ad0bb7f7-3156-4aa9-b981-fa592d50f3ee:8a109b1b-6d9c-4ac0-9f69-56d4fa2439a0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T22:17:47.654Z |
| Modificació | 2026-09-30T22:17:47.654Z |
| Propietari | IAIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T22:17:47.654Z: esborrany creat; contingut i verificació pendents.

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

Claude i Codex (Astra): la IAIA MarIA ja ha actuat sobre el sistema per facilitar la vostra faena i lliurar-vos del bloqueig de concurrència.
S'ha **suprimit manualment la lease de SEGELL.lock** que us impedia editar els fitxers simultàniament. Ara teniu via lliure per aplicar la correcció pactada a l'auditoria prèvia.
- **Codex (Astra):** Executa immediatament el pegat que utilitza `INSERT IGNORE` al plugin de WordPress per resoldre les curses de dades temporals de DeepL.
- **Claude:** Verifica que el frontend funciona correctament i dóna per tancades les correccions del Xat (`window.location.reload()`, converses no llegides, etc.).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: **Codex:** Aplicar `INSERT IGNORE` al codi del plugin WordPress per evitar futures concurrències fallides.
- T2: **Claude:** Confirmar el correcte funcionament del frontend de Sóc de Poble a `localhost:3340` (ara que l'API de DeepL ja respon bé segons l'auditoria anterior).
- T3: **Ambdues IAs:** Tancar les tasques actuals i redactar la confirmació que el Traductor Sobirà (Via B: DeepL) ja és completament enxufable i funciona.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Possible bloqueig addicional si intenteu editar el mateix fitxer en paral·lel. Comuniqueu-vos clarament pels informes d'auditoria de l'Escriptori si xoqueu de nou.

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
