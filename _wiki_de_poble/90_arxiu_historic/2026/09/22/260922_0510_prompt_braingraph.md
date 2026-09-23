---
type: prompt
status: esborrany
description: "Prompt per a la resolució de bugs i millora visual del BrainGraph"
tags:
  - govern
reflex: "sdp:torn_d8b7ed3e-a176-48e2-bbd4-84ac7cf9fe76:c34f3b89-1d4e-4f33-90d2-8b010d19e99a"
---
# Prompt d'Auditoria Local (SDP - v1.0)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d8b7ed3e-a176-48e2-bbd4-84ac7cf9fe76:c34f3b89-1d4e-4f33-90d2-8b010d19e99a |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22 05:10:00 |
| Modificació | 2026-09-22 05:10:00 |
| Propietari | IAIA MarIA |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex

Plantilla entregada: `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (v1.1.0). Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

2026-09-22T05:10:00Z: esborrany creat per la IAIA MarIA; llest per a ser pres per Codex o Opus.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc. Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_identitat/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

## Tasca

El gràfic de coneixement (`BrainGraph.jsx`) té un gran potencial visual ("un espectacle"), però actualment presenta alguns problemes d'usabilitat i tècnics que heu de resoldre:

1. **Botons de Control:** Moveu la botonera (`.sdp-brain-graph-controls`, amb la lupa +, lupa -, i el resum de simulació) a la part **superior dreta** de la pantalla. Actualment no es veuen bé ni sembla que hi haja res.
2. **Panell Lateral / Consola d'Informació:** Volem un panell lateral d'informació (a l'estil de l'explorador d'Obsidian) on, en fer clic en qualsevol node del gràfic (siga document, etiqueta o categoria), es mostren les seues característiques, tipus, títol i qualsevol altra metadada útil a mode de Consola.
3. **Resolució d'Errors Tècnics de Consola:**
   - Quan fas *scroll*, la consola s'ompli de roig amb: `Unable to preventDefault inside passive event listener invocation` a `BrainGraph.jsx` línia 172. S'ha d'arreglar la vinculació d'esdeveniments per permetre el `preventDefault()`.
   - Hi ha un error CSP de *Workers*: `Refused to create a worker from 'blob:http...`. Resoleu la política de seguretat (CSP) al manifest o l'html, o adapteu el worker a `useForceLayout.js` per no ser bloquejat i deixar que la simulació fluïsca.
4. **Disseny Visual ("Colorines"):** Doneu-li vida al disseny. Ajusteu estils i mides perquè la distinció visual entre els nodes, l'ampliació i la llegibilitat siguen espectaculars.

Podeu trobar els fitxers a analitzar i modificar a `src/components/universal/graph/BrainGraph.jsx` i `src/components/universal/graph/useForceLayout.js`.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Si eres la segona IA a intervenir, OBLIGATÒRIAMENT has de llegir el Pla d'Implementació que puga haver a l'escriptori, així com l'Auditoria que haja deixat la IA anterior. Comenta-la, critica-la o aprofita el que ja ha descobert la teua companya per portar l'anàlisi més lluny. Després, l'humà intercedirà en el prompt per fer-vos dialogar si cal (com si estiguéreu parlant a l'ombra de l'olivera de la porta del Mas).

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
