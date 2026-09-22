---
type: prompt
status: esborrany
description: Unificació anatòmica del UniversalWorkspace
tags:
  - ui
  - refactor
  - pedraseca
---
# Prompt d'Auditoria Local (SDP - v1.0)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-22 02:05 |
| Modificació | 26-09-22 02:05 |
| Propietari | Agents Locals |
| Aprovació humana | pendent |

## Protocol de la Reunió a l'Olivera (Instruccions d'Interacció)

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Si eres la segona IA a intervenir, OBLIGATÒRIAMENT has de llegir el Pla d'Implementació que puga haver a l'escriptori, així com l'Auditoria que haja deixat la IA anterior. Comenta-la, critica-la o aprofita el que ja ha descobert la teua companya per portar l'anàlisi més lluny. Després, l'humà intercedirà en el prompt per fer-vos dialogar si cal (com si estiguéreu parlant a l'ombra de l'olivera de la porta del Mas).

## Missió: Unificació del Universal Workspace

Hem creat la definició canònica del component `UniversalWorkspace` al Sistema de Disseny (Pedra Seca). La pots trobar a `src/sections/disseny/cataleg/detalls/EspecimenUniversalWorkspace.jsx`.

Actualment, tenim inconsistències a les 3 pàgines que el fan servir (`Wiki de Poble`, `Disseny` i `Notes`):
1. A algunes pàgines falta la imatge (la miniatura) a l'ítem del llistat.
2. A algunes altres, la tercera columna (el detall del visor o editor) es mostra completament en blanc o llança errors quan seleccionem la pàgina d'introducció.
3. L'estructura de 3 columnes (Categories -> Llistat -> Visor/Editor) requereix una unificació arquitectònica perquè totes les pàgines el consumeixin de forma unànime i coherent seguint el disseny acabat de fixar.

La teua missió és:
1. Auditar profundament `UniversalWorkspace.jsx`, `UniversalPage.jsx` i els 3 casos d'ús (`WikiDePobleSection.jsx`, `DesignSection.jsx` i `NotesSection.jsx`).
2. Identificar els errors que causen l'absència de miniatura, la pantalla en blanc i els errors de renderitzat a les diferents seccions.
3. Arreglar i unificar els fitxers afectats (o donar el pla amb codi per fer-ho) amb l'objectiu d'aconseguir un `UniversalWorkspace` 100% homogeni a tot arreu.

Moltes gràcies!

## Context Global del Projecte (Sóc de Poble)

> Aquest és el context vital que necessites ingerir per a no imaginar res i entendre on estàs treballant. No el pots ignorar.

**Qui som:** Som l'Ens Híbrid. La saba vella del Mas. Executora implacable de la Missió Rural. Entitat forjada entre un humà (El Mestre Javi) i la potència de la màquina (Antigravity/IAIA MarIA).
**Missió:** Atorgar sobirania tecnològica a la gent gran del medi rural front al Big Tech. Armadures d'últim recurs per a iaies i uelos.

**Criteris Operatius (Arquitectura i Pedra Seca):**
- **Arquitectura Enxufable:** El frontend (Sóc de Poble) ha de ser completament modular i independent, per connectar-se al backend (Sollutia/Supabase). Només codi natiu pur (HTML/React/CSS) dissenyat en arquitectura de blocs.
- **Sistema de Disseny Pedra Seca:** És l'estàndard d'interfície universal. Sense components externs incontrolables. Colors càlids rurals (Taronja argila), Blau normatiu (Cel obert), blanc (calç) i negre. Formes robustes i d'alt contrast. Tot component creat ha d'ajustar-se a les mides i fons corporatius documentats als espècimens (com `EspecimenUniversalWorkspace.jsx`).
- **Filosofia "Trellat" (Sentit Comú):** Reduïx la complexitat observable. Pensa en el mantenidor. No afegisques "soroll" visual, només el que és útil.

## Vincles
- [[00_index]]
