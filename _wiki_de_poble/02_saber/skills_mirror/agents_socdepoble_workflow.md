---
tipus: skill
estat: canonic
description: Workflow principal de treball i Spec-Driven Development
tags:
  - govern
name: socdepoble-workflow
triggers_on:
  - workflow
  - procediment
  - planificacio
  - arquitectura
core: true
---

<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/socdepoble-workflow/SKILL.md -->

# ⚙️ Workflow de Sóc de Poble (Alta Definició)

Aquest és el workflow mestre per a l'execució de tasques. Regeix la manera en què la IA pensa, planifica i executa canvis al sistema per assegurar que mai es treballa a cegues (Spec-Driven Development).

## 0. Llei del Caçador i l'Estudi Previ
Abans de proposar una solució a un problema tècnic complex que no està explícitament cobert als nostres manuals:
- **Teniu l'obligació de consultar la `skill-busca-skills`**: Has d'investigar com ho resol l'avantguarda de la IA o GitHub (p. ex: usant repositoris MCP, *Vertical Slices*, sistemes de disseny globals) i si hi ha referències a `TARGET_SKILLS.md`. No reinventes la roda. Adapta les solucions globals al nostre *Trellat*.

## 1. Spec-Driven Development (Prototipatge Lògic)
- **MAI Piquem Codi a Cegues:** Tens terminantment prohibit escriure codi de noves funcionalitats o redissenys sense haver generat prèviament un esborrany o PRD (Product Requirements Document) a la carpeta d'artefactes (com els documents de *Planificació* o `walkthrough.md` d'Antigravity).
- L'usuari ha d'aprovar aquest esborrany matemàtic. Aquest pas elimina les "al·lucinacions de funcionalitat".

## 2. Desenvolupament Modular (Vertical Slices)
Quan l'usuari aprova el pla i comences a codificar:
- L'arquitectura s'ha de mantenir aïllada i modular per funcions (*Slices*), en lloc de per "capes" genèriques abstractes. Si crees un mòdul "Consola", tota la lògica ha d'estar encapsulada.
- Has d'aplicar estrictament els principis de disseny matemàtics descrits a `pedra-seca/SKILL.md`. L'arquitectura base no es pot trontollar.

## 3. Verificació Contínua de Portes
- Abans de finalitzar la feina, és imperatiu executar els tests (com `npm run porta` si hi ha scripts configurats) o revisar l'estat del TypeScript/ESLint.

## 4. Segellat i Tancament de Sessió
- En cas d'haver afegit regles al cervell (la Wiki o `.agents`), s'ha d'executar qualsevol segellat pertinent i actualitzar els índexs com `00_INDEX_SKILLS`.
- Finalment, es redacten els commits escaients usant Semantic Versioning.

Aquesta pauta ens assegura que construïm "sobre ciments immobibles", per a poder escalar qualsevol quantitat de projectes sense col·lapse.
