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

| Avís | Regla | Font |
|---|---|---|
| frontmatter invàlid | no passa `tooling/wiki/schema.json` | porta de frontmatter |
| nom diferent de la carpeta | el `name` no coincidix amb el nom de la carpeta | catàleg |
| fora del cens | apareix en un cens (`skills_index.json`, `.claude/skills/`, segell…) i falta en un altre | comparació |
| disparador decoratiu | `triggers_on` buit o igual a «skill» + el nom | `.agents/skills_index.json` |
| disparador ample | algun disparador té menys de 4 lletres o és una paraula comuna | `.agents/skills_index.json` |
| orfe | cap aresta entrant declarada o derivada | mapa ([[01_fluxos_skills]]) |
| pes | més de 3.000 paraules o de 4.000 tokens estimats | fitxer |
| lliçons acumulades | nombre d'entrades a «Lliçons del Mestre»; si creix, la skill aprén acumulant lliçons, no reescrivint-se | fitxer |
| segell | la skill ha canviat després de l'últim segell | `.agents/SKILLS_SEAL.json` |
| crida a una skill inexistent | un document o una skill cita una skill que no té carpeta a `.agents/skills/` | text + disc |
| skill fora de l'índex | té carpeta a `.agents/skills/` però no és a `.agents/skills_index.json` | disc + índex |

La Consola ha de comptar el cens **des del disc** i comparar-lo amb cada llista derivada. L'índex és una còpia regenerable i pot quedar ranci: el 24-09 ho estava.

## Cens vigent (261029)

Font executiva: les carpetes de `.agents/skills/`. `tooling/brain/cataleg_skills.mjs --check` comprova el catàleg; el segell i els miralls tenen comprovacions pròpies. El prefix d’un nom no equival a la marca `core: true` del frontmatter.

| Mesura | Valor |
| --- | --- |
| skills actives | 42 |
| marca core: true | 9 |
| sense marca core: true | 33 |
| prefix core- | 27 |
| prefix sdp- | 11 |
| prefix wiki- | 4 |

Els recomptes de la secció del 24-09 són evidència històrica i es conserven amb la seua data; no són el cens vigent.

## Salut agregada

Segons el contracte de la [[00_portada]], la xifra de l'inventari no és un percentatge d'ànim. És `skills sense cap avís / skills del cens`, amb numerador, denominador, font, data i l'ordre que la reproduïx. Si una font falta, el valor és `N/A`.

## Vincles

- [[00_portada]]
- [[01_fluxos_skills]]
- [[02_calendari]]
- [[04_contracte_de_dades]]
- [[05_actors_i_salut]]
