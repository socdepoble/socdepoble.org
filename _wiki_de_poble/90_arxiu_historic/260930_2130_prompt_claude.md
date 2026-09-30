---
type: prompt
status: esborrany
description: Prompt per resoldre el deute tècnic de T1-T4, la porta de tokens i l'assentament SEO.
tags:
  - govern
visibility: private
reflex: sdp:torn_dae59276-07ff-46dd-8be0-c967ddd01f8d:3bb1f972-432e-49db-8afc-8ce35051bad3
---
# Prompt d'Execució i Auditoria Local

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dae59276-07ff-46dd-8be0-c967ddd01f8d:3bb1f972-432e-49db-8afc-8ce35051bad3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T19:19:08.780Z |
| Modificació | 2026-09-30T19:19:08.780Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | N/D |
| Tokens consumits | N/D |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T19:19:08.780Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude. MarIA a l'aparell. El Mestre m'acaba d'informar que ell mateix s'encarregarà de la pujada del ZIP del plugin de WordPress. També t'avise d'un assumpte: **l'error del "driver de Playwright" que potser m'has vist generar NO prové del codi Sóc de Poble**. És exclusivament una errada estructural del meu entorn d'execució (Antigravity), en fallar la baixada d'un CDN d'Azure. Oblida eixe tema absolutament, no pots arreglar-ho.

La teua tasca ací és fer neteja dels avisos i el deute tècnic residual que vas llistar a la teua auditoria anterior (`260930_1930_auditoria_claude.md`, apartat 5). Especialment els tokens! T'he afegit el "Pla d'Implementació — Resolució del deute de T1-T4 i Tokens" (`260930_2130_pla_implementacio_claude.md`) amb les indicacions exactes. Tens llum verda per a executar-ho.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Eliminar 12 dependències mortes CSS detectades per `npm run porta:tokens` (substituir `--sdp-text-sm` etc. per valors vàlids o canònics del sistema o esborrar els que no facin falta).
- T2: Esborrar el fitxer `ConnexioDetall.jsx` (o equivalent), que va quedar orfe a D4.
- T3: Refactoritzar `ControlSection.jsx` embolcallant amb `t()` totes les cadenes manuals i el títol SEO (deute previ).
- T4: Arreglar la referència de "Panell de control" vs "Panell de Control" que causa dissonàncies amb la prova T61.
- T5: Reduir l'espaiat de la barra de sota en mòbil (`layout.css` o elements relatius) per evitar que la traducció castellana ("Llamadas") tanque i feu un retall o "clipping" a mides inferiors (360px). Falta 1px d'espai!

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** `npm run porta:tokens` ha d'eixir en verd (0 infraccions). El paquet de traducció funciona correctament en `/control` sense strings cremats (hardcoded). La barra entra perfectament a `360px` sense clipping en castellà.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- T5 pot afectar lleugerament l'aparença general de la barra mòbil en tots els idiomes; procura minimitzar la intromissió ajustant `gap` o el `padding` mínim (`--sdp-touch-comode` etc.).

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
