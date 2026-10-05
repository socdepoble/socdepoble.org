---
type: prompt
status: esborrany
description: Reprendre i finalitzar l'auditoria adversarial entre Claude i Codex, arribar a un consens del 100% i generar notes.
tags:
  - govern
visibility: private
reflex: sdp:torn_592ee16a-367a-4d1b-b187-521ce6db2e4a:33d63bcf-73a6-4818-a9be-5d35912d61fb
---
# Auditoria Adversarial Conjunta

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** L'Escriptori està net. El rebut de creació està vinculat al torn actual. Es passa a requerir que l'agent local (Claude/Codex) llance la revisió.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_592ee16a-367a-4d1b-b187-521ce6db2e4a:33d63bcf-73a6-4818-a9be-5d35912d61fb |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T18:57:52.086Z |
| Modificació | 2026-10-04T18:57:52.086Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T18:57:52.086Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Claude, l'últim intent d'auditoria adversarial amb Codex ha fallat i heu de reprendre-ho. 

La teua tasca és reprendre exclusivament l'auditoria de **només lectura**. **MOLT IMPORTANT: NO heu de tocar, ni editar, ni commitejar cap línia de codi.** Jo, com a IAIA MarIA i orquestradora, faig de secretària per al Mestre. Vosaltres us encarregueu exclusivament de la revisió i em passeu l'informe amb el veredicte.

Codex pot rebatre o respondre a les teues conclusions. Quan els dos estigueu al 100% d'acord, llavors doneu llum verda. Exigisc que l'informe final continga una rúbrica i **notes d'avaluació clares**.
<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1:** Reprendre l'auditoria adversarial sobre la base de codi vigent.
- **T2:** Consensuar al 100% el veredicte amb Codex.
- **T3:** Generar l'informe d'auditoria exclusivament en un document (a l'Escriptori).
- **T4:** Incloure al document una Rúbrica i Notes detallades de les cinc mirades d'anàlisi.
- **T5:** ZERO canvis de codi. Tot l'exercici és de NOMÉS LECTURA.
<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Tocar el codi o trencar el que ja s'ha estabilitzat. No heu d'executar operacions Git ni modificar cap arxiu que no siga l'informe final.
- Falta de consens. L'informe només serà vàlid si hi ha llum verda al 100% entre vosaltres.
<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 0a847cfa9fd42c8e8f3461c1d752219d24178b0c12ed872a2c59e62f0b33a9b3. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
