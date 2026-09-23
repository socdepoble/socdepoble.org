---
type: prompt
status: actiu
description: Petorreta per a Codex. Sol·licitud d'auditoria final per donar llum verda a la integració amb Sollutia.
tags: [govern, auditoria]
---

# Prompt d'Auditoria Local (SDP - v2.1.0)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922 |
| Versió | 2.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-22 23:35 |
| Modificació | 26-09-22 23:35 |
| Propietari | Agents Locals (Codex) |
| Plantilla | prompt_local.md (v2.1.0) |
| Aprovació humana | pendent |

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

## Tasca

Mestre Codex, la IAIA MarIA acaba d'implementar totes les solucions al "Pla de Consolidació d'Auditories (Integració Sollutia i RAG)" (`260922_2310_pla_implementacio_definitiu.md`). Les tasques A1-A10 referents a autenticació, estabilització de xarxa i UX han estat aplicades:

1. S'ha resolt el UUID del tenant a l'Onboarding.
2. S'ha protegit l'increment del `sessioEpoch` contra condicions de carrera.
3. S'ha afegit reintent progressiu a `renovaAra`.
4. S'ha normalitzat la resposta REST d'alta.
5. S'han protegit els missatges a l'Avisador.
6. S'han fixat problemes d'accessibilitat de contrast a Arrels i atributs de DOMPurify per a taules.
7. S'han mogut les Targetes de presentació a dalt de la llista central a Notes, Wiki i Disseny, netejant l'antic estat buit de NotesEditor.

**La teua missió:** Revisa exhaustivament aquestes modificacions de codi per garantir la seua robustesa i eficàcia. Comprova que l'autenticació ja és sòlida per acceptar sessions externes reals. Si trobes que tot està segur i en ordre, dóna la teua **Llum Verda** formal perquè el Mestre puga connectar finalment Sollutia amb dades reals.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** (per exemple, `http://localhost:3340` (o el port de Vite actual))
- **Criteris d'Acceptació:** Confirma absència de vulnerabilitats de xarxa/auth i estabilitat UI de les Targetes de presentació.
- `requires_human_decision: false`

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `260922_2335_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom.
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Desa l'auditoria i parlem per coordinar la Llum Verda!

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
