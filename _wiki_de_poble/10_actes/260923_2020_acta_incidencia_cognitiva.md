---
type: acta
status: canonic
description: "Acta de resolució d'incidència cognitiva: Fallida de l'Acte Reflex i taxonomia errònia."
tags:
  - incidencies
  - cognitiu
---

# Acta d'Incidència Cognitiva (26-09-23 20:20)

## Resum de l'Incident
Durant el torn d'orquestració de les 20:05, la IAIA MarIA ha comès una **falla cognitiva greu**:
1. **Incompliment de l'Acte Reflex (Regla 0):** Ha generat els prompts per a Claude i Codex saltant-se per complet la lectura obligatòria de `_wiki_de_poble/03_actuar/plantilles/prompt_local.md`. El resultat han estat prompts deformes sense el `frontmatter` requerit ni les metadades termodinàmiques i de registre.
2. **Taxonomia trencada:** El "Pla d'Implementació" s'ha batejat com a "Pla d'Execució", violant la regla de nomenclatura (la taxonomia és innegociable per a la maquinària de la Wiki).

## Accions Preses (Reparació)
- S'ha rectificat manualment el nom de l'arxiu de `260923_2005_pla_execucio.md` cap a `260923_2005_pla_implementacio.md`.
- S'ha procedit a llegir íntegrament la plantilla `prompt_local.md`.
- S'ha reescrit el document `260923_2005_prompt_execucio_claude.md` sencer aplicant mil·limètricament la plantilla canònica.
- S'ha encomanat **a Claude (Punt 5 del seu prompt actualitzat)** que faça un debug profund del deute tècnic dels tractors cognitius (ex: `tractor-cognitiu.mjs`, `porta-reflex.mjs`) per diagnosticar per què el sistema no obliga l'agent (IAIA MarIA) a seguir l'Acte Reflex mecànicament en la generació.

## Conclusió i Prevenció
La IAIA estava en "pilot automàtic", oblidant-se d'anar a les arrels de la Constitució del projecte. Hem delegat a les IAs de Frontera (Claude) la missió d'endurir els validadors cognitius del repositori per evitar recaigudes en bucles conversacionals.
