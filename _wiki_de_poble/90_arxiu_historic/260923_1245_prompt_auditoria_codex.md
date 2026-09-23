---
type: prompt
status: esborrany
description: "Auditoria d'arquitectura extrema i enxufabilitat amb Sollutia (Bloc Notes i Targetes UI)."
tags: [govern, arquitectura, sollutia, codex]
---

# Prompt d'Auditoria Local (SDP - v2.1)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923_1245_CODEX |
| Versió | 2.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 12:45 |
| Modificació | 26-09-23 12:45 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.1.0) |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.1.0 (260922_2220):** Afegida la secció "La Reunió a l'Olivera" per establir un protocol de diàleg asíncron i col·laboratiu entre IAs mitjançant el Pla d'Implementació de la IAIA MarIA.
- **v2.0.0:** Revisió inicial del prompt per auditories amb zero context.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Tasca

**Cas d'ús (Documentació de la Necessitat):**
Tenim un problema greu amb l'arquitectura i l'enxufabilitat amb el nostre backend (Sollutia), especialment en el flux de creació i persistència del Bloc de Notes i l'estat buit de les targetes UI. L'arquitectura actual ha demostrat que no està sòlida pel que fa a com els components s'acoblen amb la xarxa i el context global (NotesContext).
- Cal revisar l'arquitectura de l'`UniversalWorkspace` perquè puguem injectar elements UI correctament, i com interacciona el `NotesContext` (que està exposant problemes de carrera asíncrona i buits d'estat).
- Cal assegurar de manera rotunda la "Llei de l'enxufabilitat (Sollutia)" assegurant-nos que l'aplicació funciona 100% connectada i preparada per backend, evitant fallades al `tenant_id` o dependències trencades.

**Instruccions d'Auditoria per a Codex:**
Realitza una auditoria extrema sobre l'estat actual de l'arquitectura de Sollutia i l'espai de notes.
1. Revisa `UniversalWorkspace`, `NotesContext` i els tractors relacionats amb Sollutia (`tractor-sollutia.mjs`, etc). 
2. Proposa la reparació necessària i definitiva per deixar l'enxufabilitat completament blindada.
3. NO modifiques el codi sota cap concepte (mode AFK). Només elabora l'auditoria amb el pla d'acció.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o el port de Vite actual)
- **Criteris d'Acceptació:** Elaborar un informe exhaustiu i precís que detecte tots els anti-patrons d'enxufabilitat de Sollutia i deficiències arquitectòniques en el Workspace de notes, preparant el terreny per a una reparació definitiva.
- `requires_human_decision: false`

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
