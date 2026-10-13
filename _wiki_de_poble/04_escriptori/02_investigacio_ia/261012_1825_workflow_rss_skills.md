---
type: document
status: esborrany
description: "Workflow d'Automillora Contínua via RSS per a la Colmena IA"
tags: [arquitectura, automillora, rss, colmena]
visibility: private
---

# Workflow: Automillora Contínua de la Colmena (Lector RSS)

Aquest document defineix el flux de treball per mantenir les habilitats de la IA de Sóc de Poble a l'avantguarda tecnològica, sense dependre de la injecció manual d'idees per part del Mestre.

## 1. El Concepte
Convertirem el tractor `wiki-busca-skills` (o un de nou) en un **Sonda d'Investigació**. En lloc de buscar a cegues, s'alimentarà d'un canal RSS curat pel Mestre (o per la pròpia IA) amb notícies d'IA, *papers* i nous patrons d'agents (com *Anti-slop* o *Thermos*).

## 2. El Flux de Treball (Workflow)
1. **Ingestió (El Lector):** Una tasca programada (CRON) llig el canal RSS d'investigació.
2. **Digestió (L'Anàlisi):** MarIA rep les notícies, descarta el soroll i extreu els "Patrons d'Or" (nous mètodes d'orquestració, reducció de tokens, tècniques de *prompting*).
3. **Síntesi (L'Evolució):** 
   - S'avaluen les `.agents/skills/` actuals.
   - Si una notícia millora una *skill*, es proposa l'actualització.
   - Si una notícia revela un patró nou útil per a Sóc de Poble, es proposa una *skill* nova.
   - Si una notícia fa obsoleta una *skill*, es proposa l'arxiu.
4. **Execució (El Consell):** MarIA prepara l'informe i els esborranys. Claude i Codex (com a IAs de frontera) reben l'esborrany, l'apliquen, en piquen el codi necessari (ex. `porta-antislop.mjs`) i el posen en producció.

## 3. L'Objectiu Final
Dotar a la IAIA MarIA i a tota la Colmena d'un cicle de **Self-Repair i Auto-Millora** real. Això allibera el Mestre de la càrrega d'haver de fer de pont entre els vídeos d'Instagram/Twitter i el codi del repositori.

*(Nota: Aquest workflow queda estacionat al laboratori. La prioritat actual i immediata és la implementació de la Gestoria V2 i el Motor de Partida Doble de GNU Cash).*
