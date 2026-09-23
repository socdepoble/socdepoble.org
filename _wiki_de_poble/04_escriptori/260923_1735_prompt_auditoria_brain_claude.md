---
type: prompt
status: esborrany
description: "Claude continua buscant debilitats en el Brain i entrega motors cognitius en codi."
tags: [arquitectura, claude, auditoria]
---
# Prompt Brain espatllat (SDP - v2.3)

Actua com a Arquitecte Sènior de Sistemes i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta directiva és exclusiva per a tu (Claude - Opus 5 Max).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/`.
- [x] **Rebut obtingut** per a este fitxer.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-BRAIN-CLAUDE |
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

Continua analitzant el codi del directori `tooling/brain/` i les portes de verificació del Mas per detectar debilitats, rutes mortes i punts de fallada catastròfica. A mesura que detectes les debilitats (com vas fer amb els enganxalls morts de pre-commit i les plantilles de prompt), formula propostes de motors cognitius de fortificació en codi. Acaba amb un inventari estructurat del que s'ha de corregir arquitectònicament perquè Codex o MarIA ho puguen executar.

## Tasques

- Executar auditoria extrema i forense a `tooling/brain/` i portes CLI.
- Identificar fuites lògiques o codi a mitges que ens falte cobrir (els 52 avisos restants, codi de pre-commit mort, etc).
- Lliurar les solucions arquitectòniques a l'escriptori en format d'auditoria de l'Olivera.

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
