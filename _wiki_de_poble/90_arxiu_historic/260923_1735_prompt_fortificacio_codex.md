---
type: prompt
status: esborrany
description: "Codex millora l'enxufabilitat i fortifica problemes arquitectònics trobats per Claude."
tags: [arquitectura, codex, fortificacio]
---
# Prompt Fortificació Codex (SDP - v2.3)

Actua com a Arquitecte Sènior de Sistemes i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta directiva és exclusiva per a tu (Codex - GPT-6 Astra Ligero).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/`.
- [x] **Rebut obtingut** per a este fitxer.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-FORTIFICACIO-CODEX |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 17:35 |
| Modificació | 26-09-23 17:35 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_pendent:pendent |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

Analitza l'acta d'auditoria generada per Claude sobre els defectes del Brain (la trobaràs a l'escriptori). Agafa les solucions de codi plantejades i adapta'n l'arquitectura per complir amb la **Llei de l'Enxufabilitat** de Sóc de Poble. Volem que el sistema no depenga de CMS monolítics i que els components de dades i de validació estiguen modularitzats. Fortifica el codi base resolent els defectes residuals i prepara un mapa tècnic de com enllaçarem aquests mòduls al Backend.

## Tasques

- Llegir i avaluar l'auditoria i el Pla d'Implementació vigent de l'Olivera.
- Dissenyar els pedaços de fortificació assegurant la Llei de l'Enxufabilitat.
- Entregar a l'escriptori la teua auditoria tècnica proposant el canvi concret.

## Riscos

- Tocar codi abans de presentar l'informe d'auditoria. **NO S'HA DE MODIFICAR L'ESTRUCTURA DE DADES NI ELS FITXERS JS. L'OBJECTIU ÉS AUDITAR I REPORTAR A L'ESCRIPTORI.**

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
