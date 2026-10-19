---
type: skill
status: canonic
description: Propaga un canvi de decisió estructural o arquitectònica arreu de tota la Wiki per mantenir la coherència del sistema.
tags:
  - saber
name: wiki-propagar-veritat
triggers_on:
  - propagar una decisió
  - actualitzar una decisió arquitectònica
  - coherència de la wiki
contracte.llig:
  - _wiki_de_poble/00_index.md
  - AGENTS.md
  - _wiki_de_poble/02_saber/doc_governanca.md
contracte.escriu:
  - _wiki_de_poble/00_index.md
  - AGENTS.md
---
# SKILL: Propagar la Veritat (Buscar i Reemplaçar Global)

Quan una característica clau del sistema canvia (per exemple: abandonem un patró antic com el selector flotant per una subvista integrada, o reanomenem un terme d'arquitectura), és fonamental actualitzar tota la Wiki d'Obsidian i el codi font per evitar contradiccions cognitives (la IA llegint instruccions contradictòries segons el fitxer).

## Pas 1. Identificar les paraules clau a substituir

Identifica les frases o paraules exactes que l'arquitectura antiga feia servir i el seu reemplaçament canònic.
Exemple: substituir `TERME_ANTIC` per `TERME_CANONIC`.

## Pas 2. Cerca de l'abast

Fes servir l'eina `grep_search` o una ordre `ripgrep` amb `run_command` per veure on apareixen aquestes paraules clau a `_wiki_de_poble` i `src`, excloent sempre `90_arxiu_historic` (immutable segons `AGENTS.md` §5).

## Pas 3. Formulació de l'expressió de substitució

Per realitzar canvis massius en múltiples fitxers de forma segura des del terminal, fes servir `find` combinat amb `sed` o `perl` excloent l'arxiu històric i el laboratori en quarantena:

### Exemple d'ordre per a macOS (BSD `sed`)

```bash
find ./_wiki_de_poble -type f -name "*.md" \
  -not -path "*/90_arxiu_historic/*" \
  -not -path "*/04_escriptori/02_investigacio_ia/*" \
  -exec sed -i '' -e 's/TERME_ANTIC/TERME_CANONIC/g' {} +
```

## Pas 4. Execució i Verificació

1. Llança la comanda de substitució sobre les rutes vives autoritzades.
2. Comprova amb un `git status` o un nou `grep_search` que no queden rastres de la informació desactualitzada i que cap fitxer de `90_arxiu_historic/` s'ha tocat.
3. Si el canvi afecta plantilles o metadades estructurals que els agents llegeixen per defecte, revisa el registre `.agents/protocolledge.json`.

> [!IMPORTANT]
> Aquest procediment ha de ser un **acte reflex**. Si llegeixes una ADR que dicta la substitució d'un patró antic, el primer pas és esporgar eixe anacronisme dels llibres de regles vius perquè els futurs agents de l'eixam no el reintrodueixin.

## Vincles

- [[00_INDEX_SKILLS]]
