---
type: prompt
status: esborrany
description: Prompt per ajustar la UI de la barra blava
tags:
  - govern
visibility: private
reflex: sdp:torn_0b48dfc8-211c-45e9-a74a-69ec6d9c8f8f:b9c7b737-d112-4828-99e2-4147604e0909
---
# Agrupació visual de la barra blava (T20)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0b48dfc8-211c-45e9-a74a-69ec6d9c8f8f:b9c7b737-d112-4828-99e2-4147604e0909 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T20:22:47.848Z |
| Modificació | 2026-09-27T20:22:47.848Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.1.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-27T20:22:47.848Z: esborrany creat; contingut i verificació pendents.

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

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

S'ha detectat massa separació visual a la barra superior blava (`bar-blue`) entre els blocs d'icones de la capçalera. Volem agrupar-los de forma més compacta creant dos "packs" clars o "trios".

**Obligatori**: Llegeix el pla d'implementació complet a `_wiki_de_poble/04_escriptori/260927_2220_pla_implementacio_claude_ui.md` abans de començar.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T20: Ajust de paddings/margins als `.sp-card-action` dins de `.bar-blue` per fer compactes els dos trios d'icones sense trencar l'arquitectura tàctil base (`--sdp-touch`).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Els botons de navegació (fletxes i llibre) pareixen un sol grup visual, igual que els botons d'acció de la dreta.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Tocar marges pot afectar l'alineació del botó de "Connectar" de la dreta. Vigila que tot mantinga el centre vertical.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 2c61fed71fa2ec7ecda2e7a2854b390169ecb762f1625422c2627001ea561a8c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
