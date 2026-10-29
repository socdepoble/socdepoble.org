---
type: registre
status: canonic
description: Panell visual de les quotes d'IA (Claude i Codex) amb diagrames Mermaid a partir de consum_ia.csv, captura del 25-09-2026.
tags:
  - log
visibility: private
---
# Panell Visual de Consum IA

Aquest document reflecteix visualment l'estat de les nostres capacitats cognitives (quotes) basant-se en les dades recollides a `consum_ia.csv`.

## Estat de Claude (Darrera Captura: 25-09-2026 15:34)

```mermaid
pie title Estat Sessió (Opus 5.5) - Límit de 5 hores
    "Consumit" : 100
    "Restant (Lliure)" : 0
```

```mermaid
pie title Estat Setmanal Global (Tots els models)
    "Consumit" : 27
    "Restant (Lliure)" : 73
```

```mermaid
pie title Estat Setmanal Fable
    "Consumit" : 17
    "Restant (Lliure)" : 83
```

## Estat de Codex / ChatGPT (Darrera Captura: 25-09-2026 17:36)

- **Límit Setmanal (GPT-6):** 100% consumit (0% restant, es restableix en 4 dies i 6 hores).
- **Saldo de crèdits:** 1.758 crèdits restants (Recàrrega automàtica: Desactivada).

```mermaid
pie title Estat Setmanal (Codex)
    "Consumit" : 100
    "Restant (Lliure)" : 0
```

## Evolució dels Costos

```mermaid
xychart-beta
    title "Cost Econòmic per Sessió (USD)"
    x-axis ["24-09", "25-09 (15:21)", "25-09 (15:27)", "25-09 (CRASH)"]
    y-axis "USD" 0 --> 120
    bar [93.28, 104.97, 12.26, 82.89]
```

## Vincles

- [[00_index]]
