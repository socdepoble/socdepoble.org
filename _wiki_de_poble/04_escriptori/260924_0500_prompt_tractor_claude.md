---
type: prompt
status: actiu
description: "Prompt d'execució ISO (Tractor) per a Claude Ultracode per implementar el Pla de l'Olivera."
tags: [govern]
reflex: sdp:torn_260924_0500:tractor_claude
---

# Prompt d'Auditoria Local i Implementació (SDP - v2.3)

Actua com a Tractor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla s'utilitza ací per a Claude Ultracode.

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/`.
- [x] **Rebut obtingut** per a este fitxer: `document.mjs context`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max) i els camps de "Tokens consumits".

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 05:00 |
| Modificació | 26-09-24 05:08 |
| Propietari | Claude Ultracode |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_260924_0500:tractor_claude |
| Tall d'evidència | HEAD + 26-09-24 05:00 |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha regenerat aplicant el "Trellat" de la IAIA MarIA després d'una **INCIDÈNCIA GREU I RECURRENT** on la IAIA ha fallat en crear el prompt segons la plantilla ISO en el primer intent i ha estat corregida pel Mestre. A l'hora d'auditar i programar, s'ha d'investigar per què aquest error segueix passant.

## Historial

- **v2.3.0:** Prompt utilitzat per a la implementació de fortificació.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/04_escriptori/260924_0445_pla_implementacio_olivera.md` (Pla d'implementació actualitzat)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org).

## Instrucció del torn

Claude, aquesta nit has fet una auditoria estàtica magistral usant només un 5% de la quota. Ara la gàbia de mutacions (`mutation-policy`) se t'obrirà per permetre edicions. Tens el mandat d'aplicar les troballes de la teua auditoria i de Codex que hem consensuat.

A més a més, t'he d'informar d'un **ERROR GREU I RECURRENT**: Jo, la IAIA MarIA, he sigut incapaç de crear aquest prompt correctament segons la plantilla ISO al primer intent, i el Mestre m'ha hagut de renyar per esmenar-ho. Necessitem que millores els meus **tractors cognitius** o informes de per què estic perdent aquesta pràctica, perquè aquest error no torne a passar mai més en la vida.

## Tasques

- **[T1]** Fixa la condició de carrera dels tokens detectada per Codex (C14) i afig el `check` al PostToolUse (U02). Autoritza ToolSearch a la política de lectura.
- **[T2]** Arregla el `.sdp-skip-link`, posa subratllat als enllaços de text (`base.css`), canvia el token del botó de data, i arregla el `.badge` duplicat i el botó de CONNECTAR (neteja CSS).
- **[T3]** Repara el `sanitize.js` i `WikiDePobleSection.jsx` per protegir els blocs de codi, arreglar negretes, permetre espais als callouts i protegir les capçaleres de les taules (C15). També fes els retocs de Placeholders i altures a 58px.
- **[T4]** Analitza i reporta per què jo (la IAIA) he fallat al aplicar la plantilla ISO per defecte, amb recomanacions per a l'arquitectura cognitiva.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** 
  - La cadena de portes `npm run porta` torna a estar verd complet i net de regressions.
  - Els fitxers s'han canviat respectant la Llei de la Pedra Seca (sense desmuntar la UI existent).

## Riscos

- Tocar el `sanitize.js` i el component Wiki de Poble sense trencar cap document antic.
- Modificar l'Autenticació sense introduir una regressió en els temps d'espera (Timeout del catàleg).

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
