---
type: skill
status: esborrany
description: 'Blinda la generacio de prompts i petorretes: copia 1:1 de la plantilla viva, rebut real i porta mecanica que bloqueja qualsevol desviacio abans de desar.'
tags:
  - skills
visibility: private
reflex: sdp:torn_44b41021-191b-44c9-be4d-e67fc8899587:c3154db9-7d1a-4bd1-b882-1f8abbac990b
---
# Skill core-plantilla-literal: tractor cognitiu ISO

**Versió ISO:** 2.0.0 (Actualitzada a l'era 100% Online Sollutia)
**Categoria:** Plantilla
**Data Modificació:** 2026-09-15

---

<!-- SDP:SECTION skill.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_44b41021-191b-44c9-be4d-e67fc8899587:c3154db9-7d1a-4bd1-b882-1f8abbac990b |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T16:17:57.392Z |
| Modificació | 2026-09-24T16:40:00.000Z |
| Propietari | Fable |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/skill.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1) |
| Tokens consumits | estimats: dins de la sessió del torn 44b41021 (~720k d'entrada acumulada); mesurats: no exposats per l'arnés |

<!-- SDP:SECTION skill.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/skill.md; SHA-256 3a5d7bd76ae5fd49aa0b0872d0159df31e3e9bc4cbd0fe4c03312b1871a9a76e. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION skill.s3 -->
## Historial

- 2026-09-24T16:17:57.392Z: esborrany creat; contingut i verificació pendents.
- 2026-09-24 18:40: contingut redactat a partir de l'evidència de l'auditoria 1810 §5 (prompt 1745 amb bloc «Context» alterat; pla 1710 sense cap secció canònica).

<!-- SDP:SECTION skill.s4 -->
## Contingut

### Propòsit

Que cap prompt, petorreta ni pla puga existir a l'Escriptori si no és una còpia literal de la seua plantilla viva amb rebut real. No és un recordatori: el text d'esta skill diu **quina porta** fa la comprovació i **on s'endolla**, perquè la garantia és mecànica. La skill és per a la IAIA MarIA i per a qualsevol agent (Claude, Codex, Fable) que escriga a `04_escriptori/`.

### Per què cal (evidència del 24-09)

`tooling/gates/porta-plantilla-viva.mjs` diu del prompt 1745: `bloc normatiu alterat: «Context» ha de ser còpia literal de la plantilla`, i del pla 1710: set seccions absents i nou files del Registre absents. Els dos porten un `reflex:` inventat (`sdp:torn_1745_implementacio_fable_extra`, `sdp:torn_sintesi_eixam`) i les tres caselles de «0. Abans de generar» marcades a mà. La porta ja ho detecta; el que no hi havia era ningú que la cridara en el moment d'escriure.

### Frontera de confiança

- No crea, mou ni esborra cap document: només bloqueja escriptures i denuncia.
- No marca cap casella: les caselles de «0. Abans de generar» les marca el resultat verd de `document.mjs check`, mai la mà de qui escriu.
- No toca `.agents/`, `tooling/` ni `.husky/`: el cablejat de la porta és una mutació de governança amb lease (PROTOCOL_PETORRETA P-14).
- No resumix, no «adapta» i no «millora» cap plantilla: si la plantilla està malament, es canvia la plantilla amb el seu propi rebut i versió, mai el document.

### Procediment (l'únic camí per a un prompt, una petorreta o un pla)

1. `node tooling/gates/obrir_torn.mjs --actor NOM --scope documents` (o `code`). Guarda el `turn_id`.
2. `node tooling/wiki/document.mjs context --turn-id ID --route RUTA --file _wiki_de_poble/04_escriptori/aammdd_hhmm_categoria_titol.md`. La ruta ix de `.agents/protocolledge.json` per la categoria del nom (`prompt`/`petorreta` → `prompt.local` o `prompt.consell`; `pla_implementacio` → `pla.implementacio`; `pla` → `planificacio`). Llig sencera la plantilla que torna.
3. `node tooling/wiki/document.mjs create --turn-id ID --route RUTA --file CAMI --title TITOL --description DESCRIPCIO`. L'esborrany naix amb el frontmatter de l'esquema, el `reflex:` real, el Registre complet i els blocs fixos **copiats literalment** de la plantilla. El nom del fitxer no es canvia mai després d'este pas (un rebut apunta a un nom).
4. Omple només les seccions `[pendent]` i les files `[pendent]` del Registre. Els blocs fixos (`Context`, `Protocol de la Reunió a l'Olivera` en `prompt.local`) no s'editen: ni una lletra.
5. `node tooling/wiki/document.mjs check --file CAMI` ha de dir `valid: true`. Només llavors es marquen les caselles de «0. Abans de generar», i es marquen amb el que la porta ha comprovat: àncora a `00_index_escriptori.md`, pla d'implementació del dia, rebut.
6. Si `check` diu `Bloc normatiu alterat`, `reflex: cal un rebut`, `Secció absent` o `Registre: falta`, el document no ix del Mas. Es corregix el document, no la porta.

### Les tres portes mecàniques (on viu la garantia)

| Moment | Porta | Estat el 24-09 | Què cal |
| --- | --- | --- | --- |
| En escriure (Claude Code) | `tooling/gates/hooks-local.mjs` (PreToolUse) | passa les petorretes per `porta-olivera` (higiene), no per la plantilla | afegir la revisió estructural de `porta-plantilla-viva` al contingut candidat i bloquejar amb `code: 2` (pegat al laboratori `02_investigacio_ia/260924_1815_tractor_plantilla_literal/`) |
| En escriure (Antigravity / MarIA) | `porta-plantilla-viva.mjs --vigila --quarantena --avisa` (launchd) | no instal·lat | `node tooling/gates/porta-plantilla-viva.mjs --llancador > ~/Library/LaunchAgents/org.socdepoble.plantilla-viva.plist` i `launchctl load` |
| En commitar | `.husky/pre-commit` | no crida la porta | `node tooling/gates/porta-plantilla-viva.mjs --staged \|\| exit 1` abans de `git-staged.mjs` |

Amb les tres, un document fora de plantilla no es pot desar des de Claude, es posa en quarantena si el desa MarIA, i no es pot commitar des de ningú. Això és el «matemàticament impossible» que demana el Mestre: no és una promesa de conducta, són tres punts de control que no depenen de la memòria de qui escriu.

### Context tècnic

Entorn 100% Online, React i Pedra Seca. El contracte documental viu a `.agents/protocolledge.json` + `tooling/wiki/schema.json`; el comprova `tooling/documental/core.mjs` (`validateSections`, `validateRegister`, `fixedBlocks`) i `tooling/documental/turns.mjs` (`validateDocument`). `porta-plantilla-viva.mjs` reutilitza estes mateixes funcions: no hi ha una segona definició de «plantilla vàlida».

### Text proposat de `.agents/skills/core-plantilla-literal/SKILL.md`

El fitxer viu s'instal·la amb lease. Este és el text, amb el frontmatter que `cataleg_skills.mjs` exigix (`status` a `actiu|canonic`, `triggers_on` no buit) perquè el catàleg no torne a quedar bloquejat com amb `core-taxonomia-estricta`:

```markdown
---
type: skill
status: canonic
description: "Tractor de plantilla literal: cap prompt, petorreta ni pla ix de l'Escriptori si no és copia 1:1 de la plantilla viva amb rebut real; tres portes mecaniques ho garantixen."
name: core-plantilla-literal
triggers_on:
  - "petorreta"
  - "prompt"
  - "pla d'implementació"
  - "plantilla"
  - "prompt_local"
version: "1.0.0"
core: true
---
# Tractor de plantilla literal

## 1. Propòsit
Cap prompt, petorreta ni pla existix fora de la seua plantilla viva. La garantia és mecànica: `tooling/gates/porta-plantilla-viva.mjs` en escriure (hook de Claude i vigilant per a Antigravity) i en commitar (pre-commit).

## 2. Frontera de confiança
No crea, mou ni esborra. No marca caselles. No toca `.agents/`, `tooling/` ni `.husky/`. No resumix ni adapta cap plantilla: si la plantilla està malament, es canvia la plantilla amb rebut i versió.

## 3. Procediment
1. `node tooling/gates/obrir_torn.mjs --actor NOM --scope documents`
2. `node tooling/wiki/document.mjs context --turn-id ID --route RUTA --file CAMI` i llig sencera la plantilla.
3. `node tooling/wiki/document.mjs create --turn-id ID --route RUTA --file CAMI --title T --description D`. El nom no es canvia mai després.
4. Omple només `[pendent]`. Els blocs fixos no s'editen: ni una lletra.
5. `node tooling/wiki/document.mjs check --file CAMI` → `valid: true`. Només llavors es marquen les caselles de «0. Abans de generar», amb el que la porta ha comprovat.
6. Si la porta diu `Bloc normatiu alterat`, `reflex: cal un rebut`, `Secció absent` o `Registre: falta`, es corregix el document, no la porta.

## 4. Context tècnic
Contracte: `.agents/protocolledge.json` + `tooling/wiki/schema.json`. Comprovació: `tooling/documental/core.mjs` i `turns.mjs`; `porta-plantilla-viva.mjs` reutilitza les mateixes funcions.
```

<!-- SDP:SECTION skill.s5 -->
## Verificació

- Evidència reproduïble: `node --test tests/plantilla-viva-escriptori.test.mjs` (prova nova, només lectura) → 2 documents revisats, 2 fora de plantilla, amb la llista exacta d'incompliments del 1710 i del 1745.
- Un document creat pel circuit passa: este mateix fitxer i `260924_1810_auditoria_claude.md` han nascut de `document.mjs create` i es validen amb `document.mjs check` (resultat a l'Historial de l'auditoria).
- Pendent (amb lease): instal·lar el SKILL.md, aplicar el pegat del hook, la línia del pre-commit i el plist del vigilant; després repetir la prova amb un prompt escrit a mà i comprovar que el hook el bloqueja, que el vigilant el posa en quarantena i que el pre-commit el rebutja.
- Fusió pendent: `core-taxonomia-estricta` (0555) diu el mateix en prosa i sense nomenar la porta; una de les dues sobra.

<!-- SDP:SECTION skill.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_1810_auditoria_claude]]
- [[taxonomia_documental]]
