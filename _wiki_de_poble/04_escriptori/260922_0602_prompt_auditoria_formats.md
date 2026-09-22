---
type: prompt
status: esborrany
description: "Auditoria i mecanització del format de les Skills, la Taxonomia Documental i la Regla 9 de Zero Fricció."
tags: [govern, auditoria]
---
# Prompt d'Auditoria Local: Formats, Taxonomia i Zero Fricció

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble" (Claude Opus 5 Ultracode).

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922-0602 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22 06:02 |
| Modificació | 2026-09-22 06:02 |
| Propietari | Agent Local (Claude UltraCode) |
| Aprovació humana | aprovat |

## Acte reflex

Plantilla entregada: `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (v1.1.0).

## Context i Taxonomia a Aclarir

El Mestre ha detectat confusió sobre què és una "Skill" i quin format ha de tindre cada tipus de document. A més, s'ha registrat un incompliment flagrant de la **Regla 9 d'AGENTS.md (Zero Fricció)** on un agent va respondre amb format de cita (`>`) enlloc d'un bloc de codi per a ser copiat al Nanochat, i a més, va generar un document a l'escriptori sense **Ancoratge de Seguretat**.

Per establir ordre, et facilitem la taxonomia canònica que has de comprendre i mecanitzar:

1. **La Wiki (`_wiki_de_poble/**/*.md`)**: Són els documents de coneixement, filosofia, actes, i informes (el Cervell). **Tots** els documents d'aquesta zona han de tindre:
   - Frontmatter YAML complet (`type`, `status`, `description`, etc.).
   - Un **Ancoratge de Seguretat** al final de l'arxiu (enllaços cap a `## Vincles` amb `[[00_index_escriptori]]` o similars) per no quedar orfes.

2. **Les Skills (`.agents/skills/<nom_skill>/SKILL.md`)**: Són el "múscul" procedimental. Instruccions executives per als agents. Només el fitxer `SKILL.md` és la pròpia skill. Ha de tindre el seu propi frontmatter YAML, però el seu cos són regles d'execució pas a pas, no pas filosofia.

3. **Els Adjunts de Skill (`.agents/skills/<nom_skill>/<qualsevol_altra_cosa>`)**: Són scripts, recursos, aprenentatges tècnics o plantilles. **No són skills per si mateixos**, sinó peces auxiliars. Aquests no necessiten ancoratges de seguretat de la Wiki perquè no pertanyen al cos normatiu de la Wiki.

## Criteris d'Acceptació i Reproducció

El teu objectiu en aquesta auditoria és el següent:

1. **Mecanitzar la Regla 9 (Zero Fricció):** Construeix o dissenya el linter/tractor requerit a l'arxiu `260922_0255_cas_us_format_nanochat.md` (ara al 90_historic). El tractor ha de penalitzar blocs de text que comencen per `> ` quan estan destinats a copiar i apegar, exigint l'ús de ` ```markdown `.
2. **Revisió de Formats Documentals:** Comprova les regles per verificar si un document de la Wiki té l'Ancoratge de Seguretat i un frontmatter vàlid, per evitar que els agents creïn documents deformats (com va passar a les 02:55).
3. **Aclariment de Skills:** Aclareix i documenta aquesta taxonomia de manera oficial a la Wiki (potser a l'Arquitectura Cognitiva o on corresponga) perquè cap agent ni l'usuari torne a confondre què és una skill i què és un document adjunt.

- `requires_human_decision: false` (Executa els canvis i crea els tractors necessaris).

## Protocol de la Reunió a l'Olivera

1. Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. L'arxiu s'ha de dir `260922_HHMM_auditoria_claude.md`.

**Endavant, Claude. Tota teua.**

## Vincles
- [[00_index_escriptori]]
