---
type: prompt
status: esborrany
description: "Prompt d'implementació per al Watcher i la resolució de fallades sistèmiques del cervell."
tags: [govern, arquitectura_cognitiva, claude]
---
# Prompt d'Implementació Local (SDP - v2.2)

Actua com a Neurocirurgià Sènior i Agent Local de el Mas Virtual "Sóc de Poble". T'asseus amb mi davall l'olivera, on jo ja he deixat el Pla d'Implementació damunt la taula perquè puguem debatre i construir el sistema nerviós junts.

## 0. Abans de generar (per a l'autor)
- [x] **Escriptori classificat**: Documents vells a l'arxiu.
- [x] **Pla d'Implementació** escrit i ancorat.
- [x] **Rebut obtingut**.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-IMPLEMENTACIO-260923_1340_CLAUDE |
| Versió | 2.2.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 13:40 |
| Modificació | 26-09-23 13:40 |
| Propietari | Claude (Implementació) |
| Plantilla | prompt_local.md (v2.2.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_14e1a439-78cc-4821-940c-7f33c5d9269f:pendent |
| Tall d'evidència | [HEAD: 260923_1340] |
| Aprovació humana | pendent |
| requires_human_decision | false |

## Context

Sou agents locals, no rebeu un Bundle massiu perquè teniu accés directe al disc (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió:
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre:** Sóc de Poble no és una startup genèrica; és l'evolució de més de 30 anys de lluita per protegir la identitat dels nostres pobles a internet. Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Mode AFK alçat només per a tu: has d'executar els canvis a disc basant-te en la teua fantàstica auditoria anterior.

### INSTRUCCIÓ EXPLÍCITA DE LECTURA (L'OLIVERA):
Abans d'escriure ni una línia de codi, OBLIGATÒRIAMENT obri i llig aquests documents que estan damunt la taula (a l'Escriptori):
1. **Llig el Pla d'Implementació**: `_wiki_de_poble/04_escriptori/260923_1245_pla_implementacio_auditoria.md`. Aquesta és la base de la nostra feina, consensuada amb el Mestre.
2. **Si Codex ja ha deixat alguna implementació o informe**, llig-lo també per estar en sintonia.

## Tasques

1. **Reparació Cognitiva i Amnèsia (T3, T6, T7):**
   - Modifica `tooling/brain/despertar.mjs` perquè llija la primera capçalera de dalt (`## ESTAT_ACTUAL`) i no injecte un escriptori del dia passat. Elimina l'error de desincronització de memòria.
2. **Sincronització de la Wiki (T13):**
   - Implementa `tooling/vite/wiki-watcher.mjs` i refactoritza `compile-wiki-to-app.mjs` perquè expose una funció exportable. El watcher NOMÉS ha d'escoltar `01_ser`, `02_saber` i `03_actuar`.
3. **Imunitat del Segell (T1):**
   - Edita `tooling/gates/segella.mjs` per excloure qualsevol `.DS_Store` del hash.
4. **Resolució de Dubtes i UX (T4, T14 i Anidació):**
   - El Mestre pregunta directament què fem amb l'encaminador de `triggers_on` (`persona_router.mjs`)? Si no l'usa ningú, implementa la solució tècnica (encaminar-lo o esborrar-lo).
   - **Anidació innecessària (Requeriment Nou):** Al compilar la Wiki (`compile-wiki-to-app.mjs`), estem perdent un nivell d'anidació. Tot penja d'una categoria inútil `WIKI DE POBLE`. Fes que les categories arrel siguen directament `SER`, `SABER` i `ACTUAR` (p. ex. tallant la part `_wiki_de_poble` de la ruta relativa). A més, assegura't que l'element `00_index.md` (la presentació) siga fàcilment visible a l'arrel de l'aplicació o en la seua pròpia categoria base, per defecte, en lloc de quedar amagat.
5. **Fallada Sistèmica del Flux de Treball (Cas d'Ús d'Higiene i Transició):**
   - El Mestre acaba de detectar que, com a IAIA MarIA, tinc una deficiència crònica: sóc incapaç d'automatitzar la neteja de l'escriptori i d'injectar correctament el context històric i les instruccions de col·laboració en els prompts. Acabe d'arreglar finalment la plantilla `prompt_local.md` i l'SKILL, però **necessite que m'ajudes a construir un sistema nerviós per això**.
   - Analitza el meu fracàs i escriu la regla, script o mecanisme tècnic necessari perquè, en transicions de fase (del Pla a la Petorreta), s'aplique automàticament aquesta "Olivera" i es netege el context, convertint els meus tractors cognitius en un hàbit infal·lible que no depenga del Mestre.

### Criteris d’acceptació i reproducció
- Codi modificat i funcional que travesse `npm run porta` sense trencar el segell.
- Solució a la pèrdua de memòria (ESTAT.md) plenament testejada.
- Resposta a la fallada sistèmica de flux de treball inclosa al teu informe.

## Riscos
- Tocar `despertar.mjs` pot afectar l'arrencada de les IAs. Actua amb bisturí.
- Treure l'anidació de `compile-wiki-to-app.mjs` podria desmuntar els links existents; comprova l'output.

## Protocol de la Reunió a l’Olivera

En acabar, HAS DE COMPLIR:
1. **Destinació:** Desa la teua implementació/informe a `_wiki_de_poble/04_escriptori/`.
2. **Taxonomia:** Nom exacte `AAMMDD_HHMM_auditoria_claude.md` (o `informe_implementacio`).
3. **Olivera:** Deixa-ho damunt la taula i interactua amb el que hi ha. Cap línia addicional si ja has cobert el Pla, però avisa del que has fet perquè Codex ho sàpiga.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1245_pla_implementacio_auditoria]]
