---
type: prompt
status: esborrany
description: "Directiva per a Codex: construcció dels hooks locals i adaptadors per resoldre l'Amnèsia Proactiva (Fase Implementació)."
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
| Propietari | Agent Local (Codex) |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_immediat_implementacio |
| Tall d'evidència | HEAD actual |
| Aprovació humana | sí |
| requires_human_decision | false |

## Historial

- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals. Aquest document s'ha particularitzat per a Codex (Implementació).

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

**Instrucció Específica per a aquest Torn:**
L'Olivera ha consensuat el Pla (`260923_1515_pla_implementacio_olivera.md`). Claude s'encarrega d'esborrar `context_preflight.mjs` i purgar les 109 variables d'ESLint. 
Tu (Codex) tens un objectiu claríssim: **Resoldre l'Amnèsia Proactiva**. Vas auditar impecablement que la decisió correcta era implementar carregadors locals via hooks en compte de `n8n`.

## Tasques

1. **Construcció del Carregador de Context (Hooks de Codex i Claude):**
   - Configura/Modifica els adaptadors d'entrada (hooks de projecte) tant per a `.claude/settings.json` com per al dialecte equivalent de Codex (OpenAI docs).
   - El hook d'inici de sessió ha de **bolcar el contingut (no la ruta)** del context crític (Constitució i Genotip) a la IA abans del seu primer token.
   - El hook de Pre-Tool Use (o l'equivalent a `porta-reflex.mjs`) ha d'exigir correctament les regles del joc de Sóc de Poble per a totes dues IAs.
2. **Correcció del Missatge de Porta Reflex:**
   - Edita `tooling/gates/porta-reflex.mjs` per afegir al missatge d'error que el mètode de recuperació ha de ser `document.mjs context ...` SEGUIT de `document.mjs create ...`, per no enganyar més a la IA.

### Criteris d’acceptació i reproducció

- Executar una sessió de prova o disparar el hook ha de demostrar que l'agent llig automàticament els fitxers arrel sense intervenció humana.

## Riscos

- Els hooks de Codex (ChatGPT) poden tenir especificacions molt particulars. Utilitza la teua memòria de documentació d'OpenAI. Assegura't de no trencar el hook funcional de Claude.

## Protocol de la Reunió a l’Olivera

En acabar la teua implementació, HAS DE COMPLIR:
1. **Destinació Obligatòria:** Desa la teua acta de tancament a l'escriptori (`_wiki_de_poble/04_escriptori/260923_1630_implementacio_codex.md`).
2. Actualitza `ESTAT.md` amb el resum del que has fet i les portes superades.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1515_pla_implementacio_olivera]]
