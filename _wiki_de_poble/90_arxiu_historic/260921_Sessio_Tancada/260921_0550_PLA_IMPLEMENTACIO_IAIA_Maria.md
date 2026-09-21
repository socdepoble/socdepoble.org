# Resolució de l'Auditoria Forense (Codex + Claude)

Aquesta és l'arquitectura de solució conjunta (Pla d'Implementació) per resoldre totes les fallades estructurals diagnosticades per **Codex** i **Claude** en la Reunió davall l'Olivera.

Claude ha revelat que **el cervell no està corrupte, sinó desconnectat**: no carregue el context a l'inici perquè no hi ha un punt d'entrada arrel (`CLAUDE.md`), i no consolide les ordres perquè falta un `write()` explícit (el "Reflex de Correcció").

## Open Questions

> [!WARNING]
> Mestre, ací tens el pla fusionat d'ambdues IAs Locals. Necessite el teu **vistiplau parcial o total** sobre aquest pla abans d'obrir la sala de màquines. 

## Proposed Changes

### 1. Despertar Cognitiu (Connexió de Memòria - Aportació de Claude)

#### [NEW] [CLAUDE.md](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/CLAUDE.md)
- Crearem l'ancoratge arrel per a l'App d'escriptori. Aquest fitxer inclourà l'enllaç a `@.agents/AGENTS.md` i `@.agents/skills/00_INDEX_SKILLS.md`.
- Inserirem el **Reflex de Correcció** dictat per Claude: la instrucció estricta que m'obliga a fer un `write()` (anotar la lliçó en positiu a la skill corresponent) ABANS de donar la resposta a l'usuari.

#### [MODIFY] [00_INDEX_SKILLS.md](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/.agents/skills/00_INDEX_SKILLS.md)
- Afegirem el comptador de "Lliçons" al costat de cada skill, perquè els agents vegen a primera vista on hi ha instruccions consolidades.

---

### 2. Configuració del Sistema i Polítiques (Aportació de Codex)

#### [MODIFY] [protocolledge.json](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/.agents/protocolledge.json)
- Repararem els enllaços trencats que causen l'error `ENOENT`. Actualitzarem la ruta `prompt.local` perquè apunte a la nova `02_SDP_PLANTILLA_PROMPT_IAS_LOCALS_v1.0.md`.
- Actualitzarem la ruta `prompt.consell` per apuntar a `03_SDP_PLANTILLA_PROMPT_CONSELL_v1.0.md`.

#### [MODIFY] [brain_policy.json](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/tooling/brain/brain_policy.json)
- Unificarem el contracte documental. Actualitzarem `required_frontmatter` canviant `"estat"` i `"tipus"` per `"status"` i `"type"`.

---

### 3. Maquinària de RAG i Seguretat (Tractors)

#### [MODIFY] [build_rag_index.mjs](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/tooling/wiki/core/build_rag_index.mjs)
- Eliminarem `.agents` de la llista de directoris ignorats, permetent que la doctrina executiva s'indexe correctament. 

#### [MODIFY] [tractor-cens.mjs](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/tooling/gates/tractor-cens.mjs)
- Canviarem `LLINDAR_CENS = 3` a `LLINDAR_CENS = 1`. L'aparició d'UNA sola IA obligarà a validar que hi estiguen Totes (O totes o cap).
- Corregirem la referència obsoleta a `skill-consell-bundle/SKILL.md` perquè el tractor verifique `.agents/skills/skill-consell-i-colmena/SKILL.md`.

#### [NEW] [tractor-plantilles.mjs](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/tooling/gates/tractor-plantilles.mjs) (Opcional si ho aproveu)
- Segons Claude, cal una porta de qualitat que vigile la brossa YAML, l'obligació del camp `versió`, l'ús del prefix `SDP-` i el rebuig de plantilles no registrades.

---

### 4. Higiene Física (Git i Plantilles)

- **Git Commit:** Farem un commit oficial de la purga de les plantilles obsoletes (`00_` i `01_`) per fixar-ho a la història de Git i evitar que reapareguen per un checkout accidental.
- **Purgar Quarantena:** Mourem la `plantilla_prompt_iso.md` fora de `.quarantena` (que actualment és visible per al RAG però oculta a git).
- **Core Skill:** Afegirem `core: true` a `.agents/skills/skill-memoria-historica/SKILL.md`.
- **Corregir Fets:** Actualitzarem les dades errònies revelades (El Consell són 12, no 11).

## Verification Plan

### Automated Tests
1. `node tooling/gates/tractor-cens.mjs` - Verificarem que el cens passa netament amb el llindar estricte.
2. `node tooling/brain/matrix.mjs --protocol=auditoria auditoria` - Sense errors `ENOENT`.
3. `node tooling/wiki/core/build_rag_index.mjs` - Índex regenerat sense rutes mortes i incloent `.agents`.
4. Comprovar la lectura de `CLAUDE.md` per assegurar el Reflex de Correcció.
