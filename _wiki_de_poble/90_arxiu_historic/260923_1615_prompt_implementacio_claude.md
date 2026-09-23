---
type: prompt
status: esborrany
description: "Directiva per a Claude: resolució quirúrgica de les 109 variables no utilitzades d'ESLint (Fase Implementació)."
tags: [implementacio, codex]
---
# Prompt d'Implementació Local (SDP - v2.3)

Actua com a Agent Local Executiu de el Mas Virtual "Sóc de Poble". En aquest torn abandones el Mode AFK.

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Les auditories velles s'han mogut.
- [x] **Pla d'Implementació** escrit i desat.
- [x] **Rebut obtingut** per a este fitxer.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 16:15 |
| Modificació | 26-09-23 16:15 |
| Propietari | Agent Local (Claude) |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_immediat_implementacio |
| Tall d'evidència | HEAD actual |
| Aprovació humana | sí |
| requires_human_decision | false |

## Historial

- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals. Aquest document s'ha particularitzat per a Claude (Implementació).

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

**Instrucció Específica per a aquest Torn:**
L'Olivera ha consensuat el Pla (`260923_1515_pla_implementacio_olivera.md`). El Mestre m'ha delegat la decisió arquitectònica i he triat el **Trellat**: el bootloader inútil morirà, els hooks prendran el seu lloc. Tu (Claude) t'encarregues exclusivament de la massacre del linter (les variables, no els hooks).

## Tasques

1. **Massacre Quirúrgica (ESLint 109 variables):**
   - Utilitza l'script `node tooling/scripts/llevar-imports-orfes.mjs --escriu` per als imports.
   - Pels `catch (e)` no usats, transforma'ls a `catch { }` sense binding. ⚠️ Atenció als 6 enganxalls engolits en `pre-commit.mjs`! Aquests s'han d'auditar manualment i corregir, no silenciar-los.
   - Esborra (fes un rm o envia a quarantena) l'arxiu `tooling/wiki/lib/context_preflight.mjs`. Ja no el volem, només feia nosa.
   - Pels 2 arguments orfes de `reflex_document.mjs`, aplica el prefix `_` (és la decisió final per mantenir el contracte).
   - No toques les dependències de `react-hooks/exhaustive-deps`. Això queda per a un altre torn.
   
2. **Neteja del Soroll Extern:**
   - Afegeix `'**/.obsidian/**'` a la llista d'`ignores` dins de `eslint.config.js` per purgar el soroll del plugin de tercers.

3. **INCIDÈNCIA FORENSE (Auditoria de Comportament): Per què la IAIA mutila les plantilles?**
   - **El Cas:** Durant la generació d'aquest mateix prompt, Antigravity (la IAIA MarIA) va llegir la plantilla canònica (`prompt_local.md`) però, en escriure l'arxiu final, va **esborrar completament el context històric del Rentonar i Sollutia**, substituint-lo per un resum propi, tot i les regles que ho prohibeixen. Ja és la segona volta que passa.
   - **Hipòtesi del Mestre:** El Mestre sospita que hi ha algun arxiu antic que fa conflicte i que "fa que no funcione res", o potser cal incloure una directiva ineludible al *fitxer principal que llegeix quan desperta* (ex: `AGENTS.md` o el Genotip).
   - **La teua Missió:** Busca on està el problema cognitiu o de sistema que permet a Antigravity saltar-se la literalitat de la plantilla. Proposa una solució d'arquitectura (per exemple: potser el carregador de plantilles hauria d'injectar el text directament via un script sense que la IA l'haja de transcriure de memòria? O cal una regla específica a l'arrel?). Respon a això en el teu informe final.

### Criteris d’acceptació i reproducció

- **Comprovació:** Executar `npm run lint` ha de baixar dramàticament el recompte d'avisos. (Recorda que en quedaran 12 dels hooks).

## Riscos

- Trencar codi de producció en canviar imports. Utilitza exclusivament eines segures (AST via `llevar-imports-orfes.mjs`) o modificacions molt acurades.

## Protocol de la Reunió a l’Olivera

En acabar la teua implementació, HAS DE COMPLIR:
1. **Destinació Obligatòria:** Desa la teua acta de tancament a l'escriptori (`_wiki_de_poble/04_escriptori/260923_1630_implementacio_claude.md`).
2. Actualitza `ESTAT.md` i llança les portes pertinents per validar el codi canviat.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1515_pla_implementacio_olivera]]
