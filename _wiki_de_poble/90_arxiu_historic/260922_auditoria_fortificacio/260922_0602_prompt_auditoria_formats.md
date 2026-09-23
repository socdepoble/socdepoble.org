---
type: prompt
status: esborrany
description: Auditoria i mecanització del format de les Skills, la Taxonomia Documental i la Regla 9 de Zero Fricció.
tags:
  - govern
visibility: private
reflex: sdp:torn_4d508f0f-6dcb-44a1-bdb9-8009d692e276:680aa3cc-fcb1-40b7-a577-6909c3a56dd5
---
# Prompt d'Auditoria Local: Formats, Taxonomia i Zero Fricció

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4d508f0f-6dcb-44a1-bdb9-8009d692e276:680aa3cc-fcb1-40b7-a577-6909c3a56dd5 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T15:32:48.306Z |
| Modificació | 2026-09-22T15:32:48.306Z |
| Propietari | codex (importació explícita) |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

<!-- SDP:SECTION prompt.local.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 4ce8aeddc043d9ff2395ff60857ac82abdb85980e8bb79440d85bd1dc95db43b. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s3 -->
## Historial

2026-09-22T15:32:48.306Z: revisió d’importació; original conservat, revisió editorial pendent.

<!-- SDP:SECTION prompt.local.s4 -->
## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

<!-- SDP:SECTION prompt.local.s5 -->
## Tasca

Importació explícita de _wiki_de_poble/04_escriptori/260922_0602_prompt_auditoria_formats.md; SHA-256 original f43b101919d6cecaab9a53a833503eb3da6d6a7a247d91cd66ad78fdd51622fe. No acredita una lectura anterior ni revalida les conclusions de l’original.

### Prompt d'Auditoria Local: Formats, Taxonomia i Zero Fricció

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble" (Claude Opus 5 Ultracode).

### Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922-0602 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22 06:02 |
| Modificació | 2026-09-22 06:02 |
| Propietari | Agent Local (Claude UltraCode) |
| Aprovació humana | aprovat |

### Acte reflex

Plantilla entregada: `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (v1.1.0).

### Context i Taxonomia a Aclarir

El Mestre ha detectat confusió sobre què és una "Skill" i quin format ha de tindre cada tipus de document. A més, s'ha registrat un incompliment flagrant de la **Regla 9 d'AGENTS.md (Zero Fricció)** on un agent va respondre amb format de cita (`>`) enlloc d'un bloc de codi per a ser copiat al Nanochat, i a més, va generar un document a l'escriptori sense **Ancoratge de Seguretat**.

Per establir ordre, et facilitem la taxonomia canònica que has de comprendre i mecanitzar:

1. **La Wiki (`_wiki_de_poble/**/*.md`)**: Són els documents de coneixement, filosofia, actes, i informes (el Cervell). **Tots** els documents d'aquesta zona han de tindre:
   - Frontmatter YAML complet (`type`, `status`, `description`, etc.).
   - Un **Ancoratge de Seguretat** al final de l'arxiu (enllaços cap a `## Vincles` amb `[[00_index_escriptori]]` o similars) per no quedar orfes.

2. **Les Skills (`.agents/skills/<nom_skill>/SKILL.md`)**: Són el "múscul" procedimental. Instruccions executives per als agents. Només el fitxer `SKILL.md` és la pròpia skill. Ha de tindre el seu propi frontmatter YAML, però el seu cos són regles d'execució pas a pas, no pas filosofia.

3. **Els Adjunts de Skill (`.agents/skills/<nom_skill>/<qualsevol_altra_cosa>`)**: Són scripts, recursos, aprenentatges tècnics o plantilles. **No són skills per si mateixos**, sinó peces auxiliars. Aquests no necessiten ancoratges de seguretat de la Wiki perquè no pertanyen al cos normatiu de la Wiki.

### Criteris d'Acceptació i Reproducció

El teu objectiu en aquesta auditoria és el següent:

1. **Mecanitzar la Regla 9 (Zero Fricció):** Construeix o dissenya el linter/tractor requerit a l'arxiu `260922_0255_cas_us_format_nanochat.md` (ara al 90_historic). El tractor ha de penalitzar blocs de text que comencen per `> ` quan estan destinats a copiar i apegar, exigint l'ús de ` ```markdown `.
2. **Revisió de Formats Documentals:** Comprova les regles per verificar si un document de la Wiki té l'Ancoratge de Seguretat i un frontmatter vàlid, per evitar que els agents creïn documents deformats (com va passar a les 02:55).
3. **Aclariment de Skills:** Aclareix i documenta aquesta taxonomia de manera oficial a la Wiki (potser a l'Arquitectura Cognitiva o on corresponga) perquè cap agent ni l'usuari torne a confondre què és una skill i què és un document adjunt.

- `requires_human_decision: false` (Executa els canvis i crea els tractors necessaris).

### Protocol de la Reunió a l'Olivera

1. Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. L'arxiu s'ha de dir `260922_HHMM_auditoria_claude.md`.

**Endavant, Claude. Tota teua.**

### Vincles
- [[00_index_escriptori]]


<!-- SDP:SECTION prompt.local.s6 -->
## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Si eres la segona IA a intervenir, OBLIGATÒRIAMENT has de llegir el Pla d'Implementació que puga haver a l'escriptori, així com l'Auditoria que haja deixat la IA anterior. Comenta-la, critica-la o aprofita el que ja ha descobert la teua companya per portar l'anàlisi més lluny. Després, l'humà intercedirà en el prompt per fer-vos dialogar si cal (com si estiguéreu parlant a l'ombra de l'olivera de la porta del Mas).
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

<!-- SDP:SECTION prompt.local.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
