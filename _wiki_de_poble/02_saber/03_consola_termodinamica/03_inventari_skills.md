---
type: document
status: esborrany
description: Cens i semàfor de salut de les skills; com el calcula Emowe, què falla aplicat al nostre corpus i quins avisos adaptats necessita la Consola.
tags:
  - saber
  - skills
  - tractors
---
# Inventari de skills

Esta peça de la Consola respon a una pregunta: **quines skills tenim de veres i en quin estat estan**. És el registre mestre de capacitats (tractors i protocols) del Mas.

## Com ho fa Emowe

- **On busca.** Recull skills de:
  - `~/.claude/skills`, `agents` i `commands`, i la carpeta `.claude/` del projecte;
  - les carpetes equivalents de Codex i de Gemini CLI;
  - `.cursor/rules` i `.agents/skills`;
  - qualsevol `SKILL.md` o `PERFIL.md`, i qualsevol `.md` dins de carpetes `agents/`, `commands/` o `prompts/` de la carpeta rastrejada.

  Salta `node_modules`, `.git` i les carpetes d'entregables i de jubilades.
- **Què en guarda de cada skill.**
  - nom: el `name` del frontmatter o, si no n'hi ha, el de la carpeta;
  - descripció: la del frontmatter o, si no n'hi ha, la primera línia de prosa d'almenys 20 caràcters;
  - paraules, KB i data de modificació;
  - si és un agent;
  - si té exemples;
  - si diu quan s'activa;
  - si està marcada com a privada.
- **Semàfor (funció `semaforo`).** Pot donar aquests avisos:
  - sense descripció;
  - no diu quan s'activa;
  - sense tocar fa més de 90 dies;
  - més de 3.000 paraules («costa context cada vegada que es carrega»);
  - menys de 60 paraules («quasi buida»);
  - possible duplicat (mateix prefix després de llevar sufixos com `v2`, `old` o `copia`);
  - orfe: cap altra skill la crida i no és un agent.

  Tres avisos o més pinten roig; un o dos, ambre; cap, verd. Estima els tokens com a paraules × 1,3.

  La Consola de Sóc de Poble no compta els avisos des de l'Onada 6: mira el més greu. Un avís alt pinta roig; només mitjans o baixos, ambre; cap, verd (vegeu [[04_contracte_de_dades]]).

## Què passa si l'apliquem al nostre cens (lectura del 24-09-2026)

- **Etiqueta equivocada.** Emowe classifica `.agents/skills` dins de «Cursor / otros»: les nostres skills eixirien com si foren de Cursor.
- **El cens no quadra.** Cada comptador dóna un número diferent:
  - `.agents/skills_index.json`: 17 (8 nucli i 9 connectables);
  - el catàleg que Claude carrega des de `.claude/skills/`: 16, sense `core-automillora`;
  - el disc: almenys 19. `core-edicio-segura` i `core-taxonomia-estricta` existixen a `.agents/skills/`, però cap dels dos cens les coneix, i `core-taxonomia-estricta` ni tan sols té `type` ni `status`.
- **«Diu quan s'activa» enganya.** Emowe dóna per bona qualsevol skill que tinga `triggers_on`. Però en almenys huit de les nostres el disparador és el propi nom («skill memoria historica», «skill cicle de vida»…) o està buit, i així no es disparen mai soles.
- **Disparadors massa amples.** El router compara per subcadena. El disparador «ui» de `sdp-pedra-seca` casa amb «quin», «guió» o «seguir», i el 24-09 va saltar en peticions que no tenien res a vore amb el disseny, com la de restaurar la Wiki. «error», de `core-context-panic`, casa amb qualsevol traça.
- **Orfes falsos.** Amb la regla d'Emowe, les skills nucli eixirien orfes: les criden `CLAUDE.md`, el router i `protocolledge.json`, no altres skills (vegeu [[01_fluxos_skills]]).

## Semàfor adaptat

### Frontmatter invàlid

**Regla:** el document no supera la validació contra `tooling/wiki/schema.json`. **Font:** **porta de frontmatter**.

### Nom diferent de la carpeta

**Regla:** el camp `name` del frontmatter **no coincidix** amb el **nom físic de la carpeta**. **Font:** **catàleg**.

### Fora del cens

**Regla:** apareix en un cens (`skills_index.json`, `.claude/skills/`, segell…) i **falta en un altre**. **Font:** **comparació creuada**.

### Disparador decoratiu

**Regla:** `triggers_on` està **buit** o és igual a «skill» més el propi nom. **Font:** `.agents/skills_index.json`.

### Disparador ample

**Regla:** algun disparador té **menys de 4 lletres** o és una **paraula comuna** amb alt soroll. **Font:** `.agents/skills_index.json`.

### Orfe

**Regla:** no té **cap aresta entrant** declarada ni derivada. **Font:** **mapa** ([[01_fluxos_skills]]).

### Pes

**Regla:** supera les **3.000 paraules** o els **4.000 tokens estimats**. **Font:** **fitxer**.

### Lliçons acumulades

**Regla:** compta el nombre d'entrades a «**Lliçons del Mestre**»; si creix, la skill aprén acumulant lliçons, no reescrivint-se. **Font:** **fitxer**.

### Segell

**Regla:** la skill ha canviat al disc **després de l'últim segell** registrat. **Font:** `.agents/SKILLS_SEAL.json`.

### Crida a una skill inexistent

**Regla:** un document o una skill cita una skill que **no té carpeta** a `.agents/skills/`. **Font:** **text + disc**.

### Skill fora de l'índex

**Regla:** té carpeta física a `.agents/skills/` però **no consta** a `.agents/skills_index.json`. **Font:** **disc + índex**.

La Consola ha de comptar el cens **des del disc** i comparar-lo amb cada llista derivada. L'índex és una còpia regenerable i pot quedar ranci: el 24-09 ho estava.

## Cens vigent (261126)

Font executiva: les carpetes de `.agents/skills/`. `tooling/brain/cataleg_skills.mjs --check` comprova el catàleg; el segell i els miralls tenen comprovacions pròpies. El prefix d’un nom no equival a la marca `core: true` del frontmatter.

De les 45 skills actives, 23 declaren motors propis al camp `motors:` del frontmatter (scripts de `tooling/`, `tests/` o `wordpress-plugin/eines/`) i 22 són procedimentals o de governança cognitiva. Ho reproduïx `node tooling/brain/fronteres-skills.mjs`:

- 17-11-2026: «43 skills (23 procediment, 20 amb motor)»;
- 24-11-2026, quan `core-llegibilitat-text` declara `tractor-maquetacio-canonica.mjs`: «44 skills (22 procediment, 22 amb motor)»;
- 26-11-2026, quan entra `iaia-maria-core` (D8) amb `incubadora.mjs` i `sincronitza-iaia-core.mjs`: «45 skills (22 procediment, 23 amb motor)».

El mapa divulgatiu per famílies i la distinció amb els repositoris externs estudiats es poden consultar a [[sistema_nervios_skills_i_repositoris]].

| Mesura | Valor |
| --- | --- |
| skills actives | 45 |
| marca core: true | 10 |
| sense marca core: true | 35 |
| prefix core- | 28 |
| prefix sdp- | 12 |
| prefix wiki- | 4 |
| prefix iaia- | 1 |

Els recomptes de la secció del 24-09 són evidència històrica i es conserven amb la seua data; no són el cens vigent.

## Salut agregada

Segons el contracte de la [[00_portada]], la xifra de l'inventari no és un percentatge d'ànim. És `skills sense cap avís / skills del cens`, amb numerador, denominador, font, data i l'ordre que la reproduïx. Si una font falta, el valor és `N/A`.

## Vincles

- [[00_portada]]
- [[01_fluxos_skills]]
- [[02_calendari]]
- [[04_contracte_de_dades]]
- [[05_actors_i_salut]]
- [[sistema_nervios_skills_i_repositoris]]
