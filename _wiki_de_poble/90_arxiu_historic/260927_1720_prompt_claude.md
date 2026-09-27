---
type: prompt
status: esborrany
description: Testing i QA amb Claude
tags:
  - govern
visibility: private
reflex: sdp:torn_c143d861-11d0-475c-96d8-8f7e2de61005:7fdac7b6-2736-4ed9-b013-cdb7412a2096
---
# Prompt QA Claude

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c143d861-11d0-475c-96d8-8f7e2de61005:7fdac7b6-2736-4ed9-b013-cdb7412a2096 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T15:52:02.119Z |
| Modificació | 2026-09-27T15:52:02.119Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.1.0) |
| Model IA | Claude Fable 5.1 |
| Tokens consumits | ~15000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-27T15:52:02.119Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Aquest és un torn de QA, Testing i DevOps lleuger on actues com a Claude Fable. El teu objectiu és certificar que el codi generat anteriorment per Codex funciona i tancar el paquet de treball.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Inicialització del Backend Local:** El servidor local de Supabase (`localhost:54321`) està actualment aturat. Arranca'l (`npx supabase start` o el procediment adequat per al projecte).
- **T2: Prova de Foc a la UI (Login i Org):** Obre el teu navegador en paral·lel al `localhost:3340`. Navega pel flux de registre/login creat per Codex (o la versió v2.4 si no s'ha completat la migració). Després de validar l'autenticació, entra i verifica que el component de "Nova Organització" permet crear un Empresa i després lligar-hi un Grup, reaccionant correctament.
- **T3: Refactoring de la Incoherència Documental:** La política `porta-plantilla-viva.mjs` bloqueja el commit. Inspecciona el `protocolledge.json` i resol per què espera la secció "Context" però nosaltres estem gastant "Context Tècnic i Arquitectònic". Tanca l'error definitivament per poder commitejar.
- **T4: Git Commit de la Jornada:** Executa un commit complet amb tot el treball de Codex i el teu QA per tancar formalment la jornada de treball al repositori de Som de Poble.
- **T5: Tancament i Informe d'Auto-replicació:** Escriu el teu informe sota l'estàndard `AAMMDD_HHMM_auditoria_claude.md`. Centra l'informe en el QA fet i dedica-hi la segona meitat a la Tasca T6 de la IAIA MarIA: ¿Què necessitaria una intel·ligència artificial aliena per aterrar aquí, entendre's al 100% i ser autònoma en poques hores? Fes una proposta de què manca.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Que el backend local no s'arranque bé per algun problema de Docker.
- Que la política documental ens continue bloquejant el git commit.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 acf5ec423d0cde7d6523fd0a8295d32a0244791013467b58f136e9cd02b1922c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
