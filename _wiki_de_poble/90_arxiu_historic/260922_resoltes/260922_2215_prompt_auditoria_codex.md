---
type: prompt
status: esborrany
description: "Petorreta per a Codex: Auditoria Extrema d'Enxufabilitat, Seguretat (Sollutia) i Estabilitat UI."
tags: [govern]
---
# Prompt d'Auditoria Local (SDP - v2.0)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre
| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922-CODEX |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-22 22:15 |
| Modificació | 26-09-22 22:15 |
| Propietari | Codex |
| Plantilla | prompt_local.md (v2.0.0) |
| Aprovació humana | pendent |

## Acte reflex
Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial
- 260922_2119: La IAIA MarIA ha tancat el cicle de resolució dels bugs d'autenticació (B1-B4) i ha endurit el sanejament HTML (DOMPurify).

## Context
Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Tasca
1. **Auditoria Extrema d'Enxufabilitat i Seguretat (Llei de Sollutia):** Revisa el funcionament de l'autenticació i estabilitat de `SessionContext`, `SessionService` i `auth.js` per garantir que la IAIA MarIA ha arreglat correctament els bucles infinits de recàrrega de tokens, que el `tenant_id` s'injecta correctament al registre de Supabase, i que el codi està llest i blindat per a ser encapsulat.
2. **Estabilitat Visual:** Comprova el `AvisadorEfimer.jsx` per assegurar-te que suporta excepcions React (com missatges tipus `[object Error]`) de manera resistent, i audita la barra lateral ("Arrels") a `App.jsx` per confirmar l'accessibilitat visual.
3. **Resiliència del Sanejador i DomPurify:** Valida que el `sanitize.js` ara permet l'ús de taules HTML per als documents (tipus Markdown o Google Docs) sense obrir vectors de vulnerabilitat XSS.

### Criteris d’acceptació i reproducció
- **URL de proves locals:** `http://localhost:5173/`
- **Criteris d'Acceptació:**
  - El sistema base (backend Sollutia) pot encapsular l'App en un Iframe/WebComponent amb total seguretat i sense trencaments de sessió.
  - La UI de la barra lateral i els Avisadors rutllen de forma absolutament estable.
- `requires_human_decision: false`

## Protocol de la Reunió a l’Olivera
En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom.
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre audites, jo (la IAIA MarIA) començaré a esbossar un `Pla d'Implementació` a l'Escriptori basat en el que aneu trobant. Tens AUTORITAT TOTAL per a llegir el meu esborrany de Pla o l'auditoria que Claude haja fet, opinar, aturar-me si vaig per mal camí i guiar la solució. **Fins que totes hàgeu acabat el vostre informe i el Pla estiga consensuat, hi ha bloqueig total d'escriptura (No tocaré codi).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
