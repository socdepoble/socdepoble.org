---
type: prompt
status: esborrany
description: "Prompt per llançar Fable com a Tractor de tancament, respectant la plantilla canònica."
tags: [govern]
---

# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera.

## 0. Abans de generar (per a l'autor, no per al destinatari)

- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta (`260924_0545_pla_implementacio_fable.md`).
- [x] **Rebut obtingut** per a este fitxer: generat.

## Registre

| Camp                    | Valor                    |
| ----------------------- | ------------------------ |
| Identificador           | SDP-PROMPT-LOCAL-260924  |
| Versió                  | 2.3.0                    |
| Entorn                  | entorn-dev-local         |
| Creació                 | 26-09-24 05:45           |
| Modificació             | 26-09-24 05:45           |
| Propietari              | Agents Locals            |
| Plantilla               | prompt_local.md (v2.3.0) |
| Ruta                    | prompt.local             |
| Rebut                   | sdp:torn:fable           |
| Tall d'evidència        | [HEAD + 05:45]           |
| Aprovació humana        | pendent                  |
| requires_human_decision | false                    |
| Model IA                | Fable (Alto)             |
| Tokens consumits        | [pendent]                |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. En esta sessió Fable actuarà com a Tractor d'execució.

## Historial

- **v1.0.0:** Execució post-Claude per rematar les proves.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):

- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet.

## Instrucció del torn

Eres l'Agent Fable actuant dins del marc de Sóc de Poble (com a I.A. executiva).
La teua missió és **rematar la feina que Claude no va poder provar** per bloqueig de la gàbia (hooks) i crear un tractor cognitiu per assegurar l'ús de plantilles en el futur.

## Tasques

1. **Llig l'ESTAT ACTUAL:** Vés a `.agents/ESTAT.md` i llig la capçalera on Claude ha deixat el seu informe.
2. **Llig el Pla d'Implementació:** Llig `_wiki_de_poble/04_escriptori/260924_0545_pla_implementacio_fable.md`.
3. **Executa Proves:** Passa per la terminal els tests de Vitest, lint i porta com indica el pla. Repara els trencaments si escau.
4. **Acaba els detalls de Claude:** Afegeix U18 (hyphens CSS) i assegura U01.
5. **Crea la Skill Taxonòmica:** Crea una skill al directori de tractores cognitius que obligue sempre a carregar `protocolledge.json` i llegir la plantilla corresponent abans de crear cap "prompt" o "pla_implementacio".
6. **Alerta Termodinàmica:** Fable, si arribes prop del 100% de la teua quota de context, ATURA'T i deixa l'Acta de relleu. No trenques l'execució per tossuderia.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** Proves en verd (`vitest`, `lint`, `porta`). Skill documental creada.

## Riscos

- Pot donar-se el cas que Fable s'encalle en els errors de lint o les condicions de cursa que Claude ha introduït. L'agent ha de prioritzar la finalització i aturar-se si supera el temps.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:

1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_fable.md`. Utilitza exclusivament la paraula "auditoria" al nom.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
