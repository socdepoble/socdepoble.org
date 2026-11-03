---
name: core-estrategia-ia
type: skill
status: actiu
triggers_on: ["consum", "estrategia", "captures de consum"]
description: Estratègia de consum, triatge de models i telemetria persistent de costos.
contracte.llig:
  - AGENTS.md
  - .agents/protocolledge.json
  - .agents/manifest.yaml
contracte.escriu:
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_metriques/consum_ia.csv
---

# ESTRATÈGIA DE CONSUM IA (Motor de Consum)

Aquesta skill documenta la forma en què *el Mas* recopila, analitza i aplica l'estratègia d'ús per a les diferents IAs, garantint la supervivència econòmica (estalvi de crèdits) sense perdre qualitat (Trellat).

## 1. Interpretació de Captures i Informes
S'ha detectat en el passat un greu error de comprensió (Fusible Rebentat) on es confonien els límits. Aquesta és la regla exacta de lectura:
- Llig l'etiqueta real: «consumit» i «restant» són mètriques diferents. Un 6% consumit equival a 94% lliure; un 15% restant equival a 85% consumit. No deduïsques el sentit només per la marca o el color de la gràfica.
- Conserva data, compte, model, període, unitat i font; si una captura no diu la mètrica o la quota actual no és accessible, declara-ho. Una observació antiga al CSV no és telemetria viva.

## 2. Telemetria Persistent (NO sigues un Lloro Estocàstic)
**OBLIGACIÓ:** Sempre que el Mestre envie informació, pantallassos o textos amb el consum de la sessió, **NO ho guardes en la teua memòria a curt termini.** Has d'invocar immediatament aquest script per registrar-ho al CSV:
```bash
node tooling/brain/tracker_consum.mjs <IA> <Model> <Limit> <Mètrica> <Valor%> "<Activitat>" "<Cost>"
```
*Exemple per a Claude:* `node tooling/brain/tracker_consum.mjs Claude Fable Semanal Consumit 6 "Auditoria T4" 0.30`
*Exemple per a Codex:* `node tooling/brain/tracker_consum.mjs Codex Astra Semanal Restant 15 "Auditor Independent" 0.0`

Les dades es guarden a `_wiki_de_poble/10_metriques/consum_ia.csv`.

## 3. Estratègia de Triatge
- L'assignació actual de rols i models la fixa l'encàrrec i la disponibilitat observada. Tria segons la feina, els límits confirmats i la revisió independent necessària; cap percentatge ni model d'una sessió històrica és una reserva permanent.
- Registra el cost només si la font l'exposa o si l'estimació queda identificada com a tal. No declares un restabliment, compra o consum de crèdits no observat. Un tracker CSV no modifica la quota del proveïdor.

## Vincles
- [[00_INDEX_SKILLS]]
