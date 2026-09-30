---
type: prompt
status: esborrany
description: Instruccions per a Claude per a corregir l'estructura semàntica de la Consola
tags:
  - govern
visibility: private
reflex: sdp:torn_ec03d02c-eeb4-4820-8ad3-edb310acdd32:0e1ec7bd-e472-4fb8-824c-413a21c14165
---
# Prompt Semàntic Claude

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

L'Escriptori ja està net. Els documents actius per a esta tasca són:
- `260930_1404_auditoria_semantic.md`
- `260930_1404_pla_implementacio_semantic.md`
- `260930_1404_prompt_claude.md`

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ec03d02c-eeb4-4820-8ad3-edb310acdd32:0e1ec7bd-e472-4fb8-824c-413a21c14165 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T12:04:35.232Z |
| Modificació | 2026-09-30T12:04:35.232Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T12:04:35.232Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude! Abans et demanava que passares a `<p>` els elements `h4` i `h5` de les targetes, però **ens hem equivocat completament de diagnòstic i em faig enrere. Desfés qualsevol canvi i no toques cap targeta.**
L'ús de `h4`, `h5` i `h6` a les targetes és intencionat per part del Mestre perquè decora i dóna estructura, i el Mestre **vol que TOTES estes etiquetes isquen a la Taula de Continguts (TOC)**. 
El problema real és que `PageFrame.jsx` per defecte talla l'índex al `H4` (`NIVELL_INDEX_PER_DEFECTE = 4`), ignorant els nivells inferiors.

Llig detingudament `_wiki_de_poble/04_escriptori/260930_1404_auditoria_semantic.md` per comprendre la nova troballa i `_wiki_de_poble/04_escriptori/260930_1404_pla_implementacio_semantic.md` per executar la solució aprovada.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1:** Revertir qualsevol canvi en HTML/CSS de les targetes (si n'havies començat algun).
- **T2:** A `src/components/universal/PageFrame.jsx`, canviar `NIVELL_INDEX_PER_DEFECTE` a 6.
- **T3:** Comprovar a `src/css/modules.css` (o on corresponga) que `.toc-level-5` i `.toc-level-6` existeixen i tenen estils coherents. Si no hi són, crea'ls mantenint la proporció (segurament sumant un `var(--sdp-space-2)` més de marge esquerre per a cada nivell).
- **T4 (Prueba de Técnica Visual):** El Mestre ha notat que en auditar taules llargues (per exemple, les de la Consola Termodinàmica) és molt més fàcil detectar errors mitjançant patrons visuals (com una cel·la buida al mig d'una taula plena) que llegint codi o dades crues. A partir d'ara, vull que proves d'aplicar aquesta tècnica: quan necessites auditar dades d'una taula o llistat llarg, demana-li al Mestre una captura de pantalla (o captura tu mateix si tens l'eina) del principi i el final de la taula. Revisa si aquesta tècnica de "patrons visuals" et resulta útil per detectar anomalies i comenta'n els resultats al teu informe.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Cap component s'hauria de trencar visualment. Només hem d'assegurar-nos que l'índex de les pàgines ara mostre més detall.

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
