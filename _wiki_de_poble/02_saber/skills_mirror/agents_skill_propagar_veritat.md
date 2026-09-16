---
estat: "esborrany"
tipus: "skill"
description: "Propaga un canvi de decisió estructural o arquitectònica arreu de tota la Wiki per mantenir la coherència del sistema."
tags:
  - "arquitectura"
  - "saber"
---

<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/skill-propagar-veritat/SKILL.md -->

\n# SKILL: Propagar la Veritat (Buscar i Reemplaçar Global)

Quan una característica clau del sistema canvia (per exemple: abandonem el suport per a un dispositiu antic, canviem d'estratègia offline-first a online-first, o reanomenem un terme de negoci), és fonamental actualitzar tota la Wiki d'Obsidian i el codi font per evitar contradiccions cognitives (la IA llegint instruccions contradictòries segons el dia).

## Pas 1. Identificar les paraules clau a substituir
Identifica les frases o paraules exactes que l'arquitectura antiga feia servir.
Exemple: `iPad A10`, `local-first`, `offline-first`.

## Pas 2. Cerca de l'abast
Fes servir l'eina `grep_search` o una ordre `ripgrep` amb `run_command` per veure on apareixen aquestes paraules clau a `_wiki_de_poble` i `src`.

## Pas 3. Formulació de l'expressió de substitució
Per realitzar canvis massius en múltiples fitxers de forma segura des del terminal, fes servir `find` combinat amb `sed` o `perl` i passa-ho mitjançant l'eina `run_command` (ja que és més ràpid i precís per a milers de fitxers que fer servir les eines d'edició fitxer per fitxer quan són modificacions pures de text).

### Exemple d'ordre per a GNU/Linux i macOS
```bash
# Per a MacOS (bsd sed requereix un backup buit '')
find ./_wiki_de_poble -type f -name "*.md" -exec sed -i '' -e 's/iPad A10/dispositius moderns/g' {} +
```

## Pas 4. Execució i Verificació
1. Llança la comanda de substitució.
2. Comprova amb un `git status` o un nou `grep_search` que no queden rastres de la informació desactualitzada.
3. Si el canvi afecta plantilles ISO o metadades estructurals que els agents llegeixen per defecte, assegura't especialment de revisar `/02_saber/07_plantilles/`.

---
> [!IMPORTANT]  
> Aquest procediment ha de ser un **acte reflex**. Si llegeixes un ADR que dicta la mort d'una tecnologia, el primer pas com a Intel·ligència Crítica madura és esporgar aquesta tecnologia dels teus propis llibres de regles perquè els futurs agents de l'eixam no la re-introdueixin.
