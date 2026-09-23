---
name: core-estrategia-ia
type: skill
status: actiu
description: Estratègia de consum, triatge de models i panell de control. Defineix com recollim l'ús de Claude i Codex per prendre decisions eficients.
---

# ESTRATÈGIA DE CONSUM IA (Motor de Consum)

Aquesta skill documenta la forma en què *el Mas* recopila, analitza i aplica l'estratègia d'ús per a les diferents IAs, garantint la supervivència econòmica (estalvi de crèdits) sense perdre qualitat (Trellat).

## 1. El Panell de Control i la Recopilació de Dades
- Les dades d'ús de **Claude (Opus 5 Max)** s'obtenen en format Markdown al final de cada execució o sessió important.
- Les dades d'ús de **Codex (GPT-6 Astra Ligero)** s'extreuen de l'UI i es transformen en dades per alimentar el motor.
- **MarIA** és l'encarregada de rebre aquestes dades, classificar-les i actualitzar el **Panell de Control** (ubicat a Obsidian en Markdown i en HTML a la web) per tindre un quadre de comandament i estadístiques clares del consum.

## 2. Estratègia de Triatge (Opus 5 Max vs GPT-6 Astra Ligero)
- **Claude (Opus 5 Max):** El model tàctic per excel·lència. El seu ús prioritari és per a **disseny arquitectònic complex, auditories forenses, seguretat i resolució de problemes estructurals**. Com ha demostrat la pràctica, és intocable per la seua qualitat de raonament.
- **Codex (GPT-6 Astra Ligero):** Agent d'execució molt potent però **massa car per a tasques trivials**. Es reservarà exclusivament per a implementacions directes on la força bruta i ràpida siga clau. 
- **Models Menors (Ex: Fable, etc.):** Ús reservat per a documentació o tasques simples on la despesa d'Opus 5 Max o Astra no estiga justificada.

## 3. Lògica de Recomanació i Decisions (L'Escriptori Obert)
Quan s'assignen tasques a *L'Olivera*, cal sempre tindre present l'esgotament de pressupost (per ex., quan l'Astra està al 91%). 
Aquesta skill requereix que l'arquitecta principal (MarIA) actue amb *Trellat* abans d'invocar agents cars per a arreglar problemes de sintaxi xicotets. Es requerirà als agents auditar el propi disseny d'aquest motor de recomanació per evolucionar-lo.
