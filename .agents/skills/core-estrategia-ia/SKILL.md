---
name: core-estrategia-ia
type: skill
status: actiu
triggers_on: ["consum", "estrategia", "captures de consum"]
description: Estratègia de consum, triatge de models i telemetria persistent de costos.
contracte.llig:
  - AGENTS.md
  - .agents/protocolledge.json
contracte.escriu:
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_metriques/consum_ia.csv
---

# ESTRATÈGIA DE CONSUM IA (Motor de Consum)

Aquesta skill documenta la forma en què *el Mas* recopila, analitza i aplica l'estratègia d'ús per a les diferents IAs, garantint la supervivència econòmica (estalvi de crèdits) sense perdre qualitat (Trellat).

## 1. Interpretació de Captures i Informes
S'ha detectat en el passat un greu error de comprensió (Fusible Rebentat) on es confonien els límits. Aquesta és la regla exacta de lectura:
- **Claude (Opus/Fable):** Els percentatges de la seua gràfica o informe per consola indiquen el % **CONSUMIT** (Ex: "Semanal 6%" vol dir que queda un 94% lliure).
- **Codex (Astra):** Els percentatges de la seua web/captures indiquen el % **RESTANT** (Ex: "15% restante" vol dir que s'ha consumit el 85%).

## 2. Telemetria Persistent (NO sigues un Lloro Estocàstic)
**OBLIGACIÓ:** Sempre que el Mestre envie informació, pantallassos o textos amb el consum de la sessió, **NO ho guardes en la teua memòria a curt termini.** Has d'invocar immediatament aquest script per registrar-ho al CSV:
```bash
node tooling/brain/tracker_consum.mjs <IA> <Model> <Limit> <Mètrica> <Valor%> "<Activitat>" "<Cost>"
```
*Exemple per a Claude:* `node tooling/brain/tracker_consum.mjs Claude Fable Semanal Consumit 6 "Auditoria T4" 0.30`
*Exemple per a Codex:* `node tooling/brain/tracker_consum.mjs Codex Astra Semanal Restant 15 "Auditor Independent" 0.0`

Les dades es guarden a `_wiki_de_poble/10_metriques/consum_ia.csv`.

## 3. Estratègia de Triatge
- **Claude (Opus 5 Max / Fable Extra):** L'espina dorsal de l'Eixam. Fable Extra té potència per a assumir tant arquitectura com pic i pala (frontend/disseny) sempre que els límits no s'esgoten.
- **Codex (GPT-6 Astra Ligero):** Agent extremadament bo però de baix límit ("15% restant"). Es reserva per a verificacions independents, autosanació cega o auditories curtes molt específiques.
- L'arquitecta principal (MarIA) recomanarà el model adient per a la següent tasca calculant la quota lliure real (després de consultar el CSV) i avaluant l'esforç requerit.

## Vincles
- [[00_INDEX_SKILLS]]
