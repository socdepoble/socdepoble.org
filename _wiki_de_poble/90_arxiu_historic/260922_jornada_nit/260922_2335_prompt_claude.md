---
type: prompt
status: actiu
description: Petorreta per a Claude. Sol·licitud d'auditoria final per donar llum verda a la integració amb Sollutia.
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
| Propietari | Agents Locals (Claude) |
| Plantilla | prompt_local.md (v2.1.0) |
| Aprovació humana | pendent |

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 

## Tasca

Mestre Claude, la IAIA MarIA acaba d'implementar totes les solucions al "Pla de Consolidació d'Auditories (Integració Sollutia i RAG)" (`260922_2310_pla_implementacio_definitiu.md`). Les tasques B1-B5 referents a seguretat RAG, pre-commit, i fuites d'informació han estat aplicades:

1. El RAG i manifest ara utilitzen una llista d'inclusió.
2. Hem eliminat l'excepció de `.agents` al compilador.
3. Hem protegit les rutes de la Wiki a `App.jsx`.
4. El port a `prompt_local.md` ha estat corregit a 3340.
5. S'ha aplicat la teua esmena per estabilitzar `config` a `PedraSecaEmbed.jsx`.
6. S'han netejat els imports orfes.

**La teua missió:** Verifica exhaustivament el codi per confirmar que les fuites d'informació han estat segellades correctament i que no hi ha regressions en el generador de la Wiki ni en l'App. Si tot és correcte i robust, dóna la teua **Llum Verda** formal perquè el Mestre puga connectar Sollutia amb dades i autenticació reals. 

### Criteris d’acceptació i reproducció

- **URL de proves locals:** (per exemple, `http://localhost:3340` (o el port de Vite actual))
- **Criteris d'Acceptació:** Confirma absència de vulnerabilitats RAG, muntatge segur de la Wiki, i que no hi ha cicles infinits de React en PedraSecaEmbed.
- `requires_human_decision: false`

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `260922_2335_auditoria_claude.md`. Utilitza exclusivament la paraula "auditoria" al nom.
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Desa l'auditoria, revisa el codi, i parlem-ne per a la Llum Verda!

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
