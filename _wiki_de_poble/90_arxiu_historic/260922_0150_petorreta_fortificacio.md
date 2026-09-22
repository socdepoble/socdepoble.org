---
type: prompt
status: esborrany
description: Petorreta per a Codex sobre la fortificació del sistema de Reflex i tancament (P0/P1).
tags:
  - codex
  - fortificacio
  - reflex
---
# Prompt d'Auditoria Local (SDP - v1.0)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922_0150 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-22 01:50 |
| Modificació | 26-09-22 01:50 |
| Propietari | Agents Locals |
| Aprovació humana | pendent |

## Objectiu de l'Auditoria i Execució

Codex, hem arribat a un punt crític. Hem implementat la porta de reflex (`porta-reflex.mjs`), però té **esquerdes de seguretat greus (P0/P1)** detectades en l'auditoria anterior. Necessitem que auditis i **repares** la fontaneria del sistema per garantir que la Ments Colmena (Claude) no puga saltar-se les normes de forma negligent.

### Esquerdes a resoldre obligatòriament (P1):
1. **Falsificació de rebuts:** A `porta-reflex.mjs:109-129`, només s'exigeix que el text de `reflex` tinga 20 caràcters. Això permet que un rebut inventat passe validació (0). Cal validar que el text vinculat al document/torn estiga basat en la plantilla i tinga les seccions reals.
2. **Evasió de rutes (Path Traversal):** Un Write a `_wiki_de_poble/./04_escriptori/prova.md` omet la protecció perquè s'usa un `.includes()`. Cal normalitzar la ruta (respecte del cwd) abans de validar l'espai protegit.
3. **Escapament via Bash:** El `.claude/settings.json` limita el matcher a `Write`, `Edit`, `NotebookEdit`. Les escriptures a disc usant Bash no passen pel hook. Cal cobrir les escriptures alternatives o protegir-les de base.
4. **Validació laxa d'esquemes:** A `porta-reflex.mjs:96-107`, valors fora d'enum (ex. `status: patata`) o claus duplicades al YAML són acceptades sense error. Cal usar el parser canònic que valide l'esquema correctament i retorne error (exit 1 o 2).
5. **Tancament deficient:** `tooling/gates/tancament.mjs` només copia el `turn_id` al resultat però no valida que el torn siga persistent (plantilla, ESTAT, historial). A més, `compile-wiki-to-app.mjs` encara escriu al disc tot i fer servir la flag `--check`.

### Accions a realitzar:
Fes una anàlisi a fons de `porta-reflex.mjs`, `.claude/settings.json`, `tancament.mjs` i `compile-wiki-to-app.mjs`, proposa la solució tècnica de cadascuna de les esquerdes (modificació dels hooks i scripts), i documenta l'auditoria resultant.

## Protocol de la Reunió a l'Olivera (Instruccions d'Interacció)

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Si eres la segona IA a intervenir, OBLIGATÒRIAMENT has de llegir el Pla d'Implementació que puga haver a l'escriptori, així com l'Auditoria que haja deixat la IA anterior (revisa `260922_0136_auditoria_codex.md`). Comenta-la, critica-la o aprofita el que ja ha descobert la teua companya per portar l'anàlisi més lluny. Després, l'humà intercedirà en el prompt per fer-vos dialogar si cal (com si estiguéreu parlant a l'ombra de l'olivera de la porta del Mas).

## Vincles
- [[00_index]]
