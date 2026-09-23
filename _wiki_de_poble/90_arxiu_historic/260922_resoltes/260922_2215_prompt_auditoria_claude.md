---
type: prompt
status: esborrany
description: "Petorreta per a Claude: Auditoria Extrema del Cervell, Arquitectura i resolució de 374 warnings del linter."
tags: [govern]
---
# Prompt d'Auditoria Local (SDP - v2.0)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre
| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922-CLAUDE |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-22 22:15 |
| Modificació | 26-09-22 22:15 |
| Propietari | Claude |
| Plantilla | prompt_local.md (v2.0.0) |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex
Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial
- 260922_2119: La IAIA MarIA ha blindat l'aïllament del Cervell, evitant que `.agents` i `GENOMA` acaben al client. S'ha realitzat un arranjament massiu dels bloquejos d'autenticació i rendiment detectats per Codex hores arrere.

## Context
Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Tasca
1. **Auditoria del Cervell i Arquitectura Cognitiva:** Verifica que els canvis recents en `compile-wiki-to-app.mjs` i `pre-commit.mjs` mantenen la separació entre la Wiki/Cervell i el frontend públic de l'App. Cap document privat ni instruccions d'IA (ex. `.agents/`) ha de poder colar-se al bundle final de Vite. Revisa si l'arquitectura mental del projecte és sana i si hi ha més fuites.
2. **Resolució de Linter:** Tenim actualment vora **374 warnings** en el codi de Vite/React. Necessitem analitzar-los en massa i donar-los caça (Imports orfes, regles de Hooks, dependències mancants). Proposa una estratègia contundent per baixar el `--max-warnings` a 0 al més prompte possible, generant els teus propis scripts si et cal.

### Criteris d’acceptació i reproducció
- **URL de proves locals:** `http://localhost:5173/`
- **Criteris d'Acceptació:**
  - L'arquitectura del Cervell roman 100% oculta i aïllada dels usuaris públics de l'App.
  - S'han identificat i donat passos clars (amb llistats d'acció) per netejar els warnings del linter del codi de React.
- `requires_human_decision: false`

## Protocol de la Reunió a l’Olivera
En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md`. Utilitza exclusivament la paraula "auditoria" al nom.
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre audites, jo (la IAIA MarIA) començaré a esbossar un `Pla d'Implementació` a l'Escriptori basat en el que aneu trobant. Tens AUTORITAT TOTAL per a llegir el meu esborrany de Pla o l'auditoria que Codex haja fet, opinar, aturar-me si vaig per mal camí i guiar la solució. **Fins que totes hàgeu acabat el vostre informe i el Pla estiga consensuat, hi ha bloqueig total d'escriptura (No tocaré codi).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
