---
type: document
status: esborrany
description: Com el Mapa d'Emowe dedueix qui crida qui i qui llig el que un altre deixa, i com ho portem a la Consola amb arestes declarades en lloc de regex sobre prosa.
tags:
  - saber
  - graf
  - skills
---
# Fluxos de treball de les skills

Esta peça de la Consola respon a una pregunta: **per quin camí passa la faena**. Quina skill, plantilla o script en crida una altra, què deixa escrit cadascuna i qui ho llig després; és la Funció de Mapa, i la [[00_portada|Funció de Salut]] diu si eixe camí funciona.

## Com ho fa Emowe

Font estudiada: `mapa_agentes.py` v0.1 (1.341 línies), a `04_escriptori/02_investigacio_ia/001 NEXUS/mapa-de-mis-agentes/`. Cap skill d'Emowe declara res: tot ix del text.

1. **Crida o menció** (funció `relaciones`). Quan el nom d'una skill apareix dins d'una altra, és una *menció*. Passa a ser *crida* quan, a menys de 80 caràcters, hi ha:
   - un verb de la llista `VERBOS_LLAMADA` («monta», «ejecuta», «usa», «lanza», «invoca», «llama a», «carga», «aplica», «run», «use», «invoke», «call», «load», «apply»…);
   - una ruta `nom/SKILL.md` o `nom/*.py`;
   - una ordre `uv run … nom`;
   - un enllaç d'Obsidian cap a la skill.

   Si el nom va darrere de «no confundir», «jubilad», «sustituye a» o expressions semblants, torna a ser menció.
2. **Entrades i eixides** (`entradas_salidas`). Busca rutes al text (`RE_RUTA`) i mira quin verb hi ha més a prop. Un verb de lectura (`V_LEE`) fa la ruta entrada; un d'escriptura (`V_ESC`), eixida. Cada dada porta un nivell de confiança:
   - **declarat**: la ruta està escrita a la skill;
   - **inferit**: hi ha una ruta sense verb, o una URL;
   - **supòsit**: la skill no diu res i es dedueix pel seu tipus (una skill de «resum» llig un text).

   Una skill amb tot en *supòsit* és una **caixa opaca**: ningú sap què hi entra ni què n'ix. També reconeix claus explícites de frontmatter: `entrada`, `input`, `fuente`, `source` i `defecto` per a les entrades, i `salida`, `output`, `destino`, `target` i `patron_fichero` per a les eixides.
3. **Cadenes possibles** (`encaja` i `inferir_flujos`). Dues skills s'encadenen si el que deixa una és el que llig l'altra (mateixa ruta, una carpeta que conté l'altra o el mateix fitxer), o si una crida l'altra de veres. Construïx cadenes de 2 a 5 passos, una per cada origen (la més llarga), descarta les que ja estan contingudes en una altra i en pinta com a màxim 12, marcades «inferit, no declarat». Els supòsits no encadenen mai.
4. **Fluxos declarats** (`leer_flujos_yml`). Si troba un `flujos.yml` amb `nombre`, `resumen`, `estado`, `director`, `sirve_a`, `programada` i `pasos` (cadascun amb `perfil`, `nota` i `falta`), el pinta com un flux de veres, amb director i obrers.

## Per què no ho podem copiar tal qual

- **L'idioma.** Els verbs de les regex són en castellà i en anglés, i les nostres skills estan escrites en valencià. «Llig», «escriu», «desa», «crida», «executa» o «carrega» no hi casen. Només casen per coincidència «usa», «aplica», «invoca» o «consulta». Un exemple: `core-memoria-historica` diu «Tanca amb la skill `wiki-cicle-de-vida`», i Emowe ho classificaria com a menció, no com a crida.
- **Subcadenes sense frontera de paraula.** `V_ESC` acaba en `…|hacia|en)` i es busca sense `\b`. La síl·laba «en» apareix en quasi qualsevol línia («entrada», «document», «pendent»…), així que moltes rutes es classificarien com a eixides només pel soroll.
- **Els nostres cridadors no són skills.** Per a Emowe és orfe tota skill que cap altra skill crida. Les nostres les activen canals declaratius:
  - els `@`-imports de `CLAUDE.md`;
  - el router de `UserPromptSubmit`, pels `triggers_on`;
  - les rutes de `.agents/protocolledge.json`;
  - l'`entrada` de `.agents/cervell.json`.

  Amb la regla d'Emowe, justament les skills nucli eixirien com a orfes.
- **El que ja sabem no cal endevinar-ho.** Tenim arestes deterministes que Emowe no pot vore; les recull la taula de sota.

## Arestes que ja tenim declarades

| Aresta | Font de veritat | Confiança |
|---|---|---|
| ruta documental → plantilla → skill | `.agents/protocolledge.json` (13 rutes) | declarat |
| arrencada → skill | `@`-imports de `CLAUDE.md`; `entrada` de `.agents/cervell.json` | declarat |
| petició → skill | `triggers_on` → `.agents/skills_index.json` → `tooling/session/persona_router.mjs` | declarat (la coincidència amb la petició és textual) |
| esdeveniment de l'arnés → script | `hooks` de `.claude/settings.json` | declarat |
| ordre npm → script | `scripts` de `package.json` | declarat |
| tasca programada → script | plist de launchd, fora del repositori | derivat |
| document → document | enllaços wiki de les seccions de Vincles | declarat com a enllaç, no com a crida |

`.agents/hooks.json` declara hooks per a Antigravity, però el mateix fitxer avisa que no hi ha cap consumidor acreditat. La Consola ha de pintar eixes arestes amb traç discontinu.

## Com ho pintarà la Consola

- **Tres nivells de confiança, com Emowe, però amb un significat propi:**
  - **declarat**: camp estructurat (frontmatter, JSON o configuració);
  - **derivat**: es dedueix del codi o de la configuració amb un analitzador determinista;
  - **inferit**: ix de la prosa.

  Les arestes declarades i derivades es pinten amb traç ple. Les inferides, amb traç discontinu, i no encadenen mai: és la mateixa regla que Emowe aplica als supòsits.
- **Cadenes només amb arestes declarades o derivades.** Una cadena inferida no és un flux: és un suggeriment de «declara'm».
- **El primer flux a declarar: la Reunió davall l'Olivera.** Els passos són:
  1. Pla d'Implementació (ruta `pla.implementacio`);
  2. petorreta (ruta `prompt.local`);
  3. auditories de Claude i Codex (ruta `auditoria`);
  4. consolidació del pla;
  5. implementació;
  6. ESTAT i LEDGER;
  7. tancament.

  Cada pas ja té ruta, plantilla i destí. Només falta escriure'l com a dada (vegeu [[04_contracte_de_dades]]).

## Vincles

- [[00_portada]]
- [[02_calendari]]
- [[03_inventari_skills]]
- [[04_contracte_de_dades]]
- [[05_actors_i_salut]]
