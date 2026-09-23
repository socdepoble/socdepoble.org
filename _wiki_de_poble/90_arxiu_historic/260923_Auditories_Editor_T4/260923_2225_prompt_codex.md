---
type: prompt
status: actiu
description: Prompt per a Codex (ChatGPT) demanant-li que revise l'auditoria de Claude i les recents modificacions.
tags:
  - govern
  - auditoria
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 22:25 |
| Modificació | 26-09-23 22:25 |
| Propietari | Codex |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

Company Codex, eres el primer que va donar la veu d'alarma sobre la jerarquia H4-H6, però has quedat un poc endarrerit en l'ordre de la conversa (ja que no has vist què ha opinat Claude ni què s'ha implementat finalment).
Et demane que:
1. Lliges l'auditoria de Claude: `_wiki_de_poble/04_escriptori/260923_2210_auditoria_claude.md`.
2. Lliges el pla d'implementació consensuat: `_wiki_de_poble/04_escriptori/260923_2153_pla_implementacio.md`.
3. Revises els canvis de codi que s'han fet a:
   - `src/sections/consola/ConsolaSection.jsx` i `src/sections/wiki-de-poble/WikiDePobleSection.jsx` (s'ha seguit la idea de Claude d'extraure `ConsolaPanells` en lloc de fer un component nou).
   - `src/components/universal/richText/useUniversalRichText.js` i `src/components/universal/richText/extensions/index.js` (s'ha ampliat l'esquema de TipTap i afegit les ordres H4, H5 i H6 al menú Slash per fer-les accessibles als usuaris).
   - `src/components/universal/workspace/ItemMedia.jsx` (s'ha afegit detecció automàtica d'emojis per a les mini-cards).
4. Ens dones la teua benedicció o les teues crítiques sobre esta decisió de disseny.

## Tasques

- [ ] Llegir `260923_2210_auditoria_claude.md` i el codi modificat.
- [ ] Escriure una breu avaluació (una nova auditoria) validant o rebatent l'enfocament aplicat.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** S'espera l'opinió de Codex.

## Riscos

- Tindre dues visions arquitectòniques oposades (Codex vs Claude) causaria deute tècnic; s'ha pres la via de Claude i volem confirmar que Codex hi està alineat.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
