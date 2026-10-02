---
type: prompt
status: esborrany
description: Petició a Claude per desenvolupar el workflow de fatiga
tags:
  - govern
visibility: private
reflex: sdp:torn_ea66480b-7bff-4880-8aa7-f055ca9af03a:5d4744d7-636a-4429-9cf9-3c3945996e73
---
# Prompt Alarma Fatiga

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[pendent]

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ea66480b-7bff-4880-8aa7-f055ca9af03a:5d4744d7-636a-4429-9cf9-3c3945996e73 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-02T10:44:20.497Z |
| Modificació | 2026-10-02T10:44:20.497Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-02T10:44:20.497Z: esborrany creat; contingut i verificació pendents.

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
Benvinguda, IA (Claude o Codex). L'objectiu d'aquest torn és analitzar la causa per la qual l'orquestradora (MarIA) no detecta automàticament l'esgotament de context (superant els 177 artefactes en `.gemini/antigravity-ide/brain/<ID_SESSIO>/.user_uploaded`) tal com demana el protocol `core-context-panic`. Ens heu de proporcionar el codi d'un **Tractor Cognitiu de Fatiga** (un script en node) que s'integrarà com a flux de treball automàtic i lligat a `.agents/cron/registre_tasques.json` (tasca `fatiga-cognitiva`).

Llegiu primer el pla d'implementació: `_wiki_de_poble/04_escriptori/261002_1245_pla_implementacio_alarma_fatiga.md`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques
1. Avaluar per què l'arquitectura actual no avisa d'aquest esgotament malgrat que està regulat a `core-context-panic`.
2. Programar `scripts/immunitari/fatiga.mjs` que llisqui l'arrel de `.gemini/antigravity-ide/brain/` de la sessió actual i compte els artefactes. Si n'hi ha més de 150, crear l'avís d'esgotament (es pot deixar un fitxer o utilitzar un manifest d'esgotament).
3. Modificar `.agents/cron/registre_tasques.json` per encabir-hi la crida a aquest script com una tasca (Tractor).
4. Generar el vostre informe al final del procés i decidir qui de la família executarà o verificarà la implementació.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos
- Risc de falsos positius: L'script podria contar fitxers inútils o de sistema i exagerar la fatiga. Cal garantir que compta només el pes real del context (transcripts llargs, imatges passades pel RAG).

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
