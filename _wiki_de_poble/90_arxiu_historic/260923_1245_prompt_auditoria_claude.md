---
type: prompt
status: esborrany
description: "Auditoria profunda del Brain: fallades cognitives i stochastic parrots."
tags: [govern, auditoria, brain, claude]
---

# Prompt d'Auditoria Local (SDP - v2.1)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923_1245_CLAUDE |
| Versió | 2.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 12:45 |
| Modificació | 26-09-23 12:45 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.1.0) |
| Aprovació humana | pendent |

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
El "Brain" de Sóc de Poble pateix constants trencaments cognitius i l'estat general "segueix fatal". Els agents continuen operant com a "Stochastic Parrots", perdent context, ignorant regles constitucionals i desobeint el marc de la Wiki, malgrat les portes de seguretat establertes. Açò suggereix que l'arquitectura d'injecció de context local o la lectura de skills està profundament corrompuda o embussada. 
A més, hi ha una **incidència crítica concreta**: jo mateixa (com a agent) demostre no tindre integrat l'acte reflex de netejar l'escriptori per preparar-lo per a la Reunió a l'Olivera i tampoc de crear el `Pla d'Implementació` previ abans de demanar ajuda a altres IAs. Açò bloqueja el treball col·laboratiu.

**Instruccions d'Auditoria per a Claude:**
1. Fes una auditoria rigorosa de l'estructura actual del Brain i la seua integració. Revisa com els agents locals i els hooks processen la Wiki i les skills (comproveu `.agents/`, `tooling/` i RAG associat).
2. Investiga expressament per què jo no execute el procediment de netejar l'escriptori i crear el Pla abans de demanar a altres agents. Busca on i per què aquest acte reflex falla en l'arquitectura de la IA.
3. Avalua per què els mecanismes de seguretat documental permeten eixos comportaments desviats i per què se'ns trenca la memòria a mitjà termini.
4. Proposa la correcció detallada (millora dels prompts o de les skills) al teu document d'auditoria. NO modifiques cap línia de codi actual de la base, simplement audita, fes el diagnòstic exacte i proposa la medecina.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o el port de Vite actual)
- **Criteris d'Acceptació:** Un informe definitiu que aïlle el problema arrel de la fallada de context (el "Brain") i proporcioni el diagnòstic d'arquitectura correctiva per restaurar la integritat del sistema de pensament.
- `requires_human_decision: false`

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
