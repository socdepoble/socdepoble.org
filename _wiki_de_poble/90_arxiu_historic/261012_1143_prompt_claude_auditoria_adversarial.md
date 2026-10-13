---
type: prompt
status: esborrany
description: Prompt basat en la teoria del Gauntlet de Xavier Mitjana per sotmetre la Finestreta de Subvencions a una auditoria adversarial.
tags:
  - govern
visibility: private
reflex: sdp:torn_769f7988-1f57-470c-b10c-d9d06a1c4564:ae71da58-fb5e-4b88-98ed-66da43d86e14
---
# Auditoria Adversarial Extrema Onada 12

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[pendent] No es requereix execució prèvia per orquestradora ja que és només una plantilla.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_769f7988-1f57-470c-b10c-d9d06a1c4564:ae71da58-fb5e-4b88-98ed-66da43d86e14 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T09:43:24.303Z |
| Modificació | 2026-10-12T09:43:24.303Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.5.0) |
| Model IA | Claude 3.5 Sonnet (Cowork) / Codex (ChatGPT) |
| Tokens consumits | [estimat: ~5000 tokens per l'informe] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-12T09:43:24.303Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

[Instrucció Principal: Gauntlet Prompt]

Executa una **Auditoria Adversarial Extrema** a la infraestructura de la "Finestreta de Subvencions" (Onada 12). Actua sota el model de "Gauntlet Prompt":
- **El Mètode**: Treballa de forma autònoma en loop. Planifica, audita, avalua vulnerabilitats, revisa el propi resultat i repeteix. **Usa un àrbitre adversarial intern** que intenti tombar el treball que acabes de fer. Aquest àrbitre ha de buscar riscos d'arquitectura, punts de fallada en l'enxufabilitat (Sollutia) i vulnerabilitats. No m'entregues la primera versió que pensis; entrega la que ha superat l'àrbitre.
- **El Llistó (L'Estàndard)**: L'informe d'auditoria ha de tenir qualitat de consultoria de ciberseguretat top-tier i alhora respectar els principis visuals de Pedra Seca. Tot error trobat s'ha d'explicar clarament i s'hi ha de proposar el codi complet per resoldre'l.
- **Les Restriccions**: Zero placeholders (res d'escriure "..." o "aquí el teu codi"). Si proposeu codi, ha de ser íntegre.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. Executar l'auditoria extrema sobre el disseny i el comportament de la Finestreta de Subvencions.
2. Comprovar la hipermodularitat i la integració GET amb Sollutia.
3. El·laborar un document amb llistat d'errors detectats i propostes de solució, generat en HTML/MD amb css editorial si s'escau.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Risc de complaença: la IA (tu mateix) s'aprova la primera versió sense fer crítica adversarial real. Aplica l'Àrbitre!
- Trencar la "Llei de l'Enxufabilitat" o donar per bo dissenys que depenen fortament de base de dades sense port neutre.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 189187b73ba2ef4610f145a173aeb24c157c4453f41dc98c56f1a80f6f384475. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
