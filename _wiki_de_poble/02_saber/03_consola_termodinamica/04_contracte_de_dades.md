---
type: document
status: esborrany
description: El JSON que llegirà la Consola Termodinàmica, les fonts que el compilen i el camp contracte que necessiten les skills perquè el mapa no depenga de prosa.
tags:
  - saber
  - arquitectura
  - graf
---
# Contracte de dades de la Consola

La Consola React no llig prosa ni rastreja el disc: llig un únic JSON generat per un compilador determinista de node. Este document fixa eixe esquema, les fonts que el compilen i el camp `contracte` que necessiten les skills perquè el mapa no depenga de prosa.

És el mateix camí que ja seguix la Wiki: `tooling/wiki/compile-wiki-to-app.mjs` genera `src/data/wikiManifest.js`. El navegador no pot llegir els plist ni executar git, i un compilador es pot provar.

## Què prenem de l'esquema d'Emowe

L'opció `--json` de `mapa_agentes.py` escriu:

- `version` i `generado`;
- `skills[]`, `aristas[]` (triples origen, destí i força) i `avisos{ruta: […]}`;
- `tareas[]` i `dicen[]`;
- `sistema{tablero, programadas, flujos, vigilante}`;
- `flujos[]`, `inferidos[]` i `actores{}`;
- els exemples de demostració.

Tres idees d'eixe esquema valen or:

1. **Cada dada porta el seu nivell de confiança.**
2. **El que falta es pinta, no s'amaga.** Per això té la caixa opaca i la caixa grisa. És la mateixa regla que la [[00_portada]] imposa a les mètriques: si falta una peça, `N/A`, mai un verd inventat.
3. **Tot el que és de demostració porta la xapa «exemple»** i es pot filtrar.

## Esquema proposat: `sdp.mapa.v1`

```json
{
  "schema": "sdp.mapa.v1",
  "generat": "AAAA-MM-DDTHH:MM:SSZ",
  "tall": { "branca": "…", "commit": "…", "arbre_net": false },
  "nodes": [
    { "id": "skill:sdp-workflow", "tipus": "skill",
      "font": ".agents/skills/sdp-workflow/SKILL.md",
      "atributs": { "core": true } }
  ],
  "arestes": [
    { "de": "ruta:pla.implementacio", "a": "skill:sdp-workflow",
      "tipus": "governa", "confianca": "declarat",
      "evidencia": ".agents/protocolledge.json" }
  ],
  "tasques": [
    { "id": "plaquetes-diagnostic", "estat": "viu" }
  ],
  "avisos": [
    { "node": "skill:wiki-cicle-de-vida", "codi": "disparador-decoratiu",
      "severitat": "mitjana", "evidencia": ".agents/skills_index.json" }
  ],
  "salut": [
    { "metrica": "conformitat-documental", "valor": "N/A",
      "numerador": null, "denominador": null,
      "font": "tooling/gates/porta-documents.mjs", "prova": null }
  ]
}
```

- **Tipus de node:** `skill`, `plantilla`, `ruta`, `script`, `hook`, `tasca`, `agent`, `document` i `porta`.
- **Tipus d'aresta:** `crida`, `llig`, `escriu`, `dispara`, `encamina`, `carrega` i `governa`.
- **Confiança:** `declarat`, `derivat` o `inferit` (vegeu [[01_fluxos_skills]]).
- **`tall`:** fixa branca i commit. Dos mapes només són comparables si se sap de quin arbre ixen.

## El camp que necessiten les skills

El frontmatter de les skills es valida contra `tooling/wiki/schema.json`, que té `additionalProperties: false`. **Qualsevol camp nou fa fallar la porta de frontmatter** fins que s'amplie l'esquema. Això és una decisió de govern, perquè l'esquema viu dins de `tooling/`.

Proposta: un sol camp niat, `contracte`. Seria opcional al principi i obligatori per a les skills nucli:

```yaml
contracte:
  llig:
    - .agents/protocolledge.json
    - _wiki_de_poble/03_actuar/plantilles/prompt_local.md
  escriu:
    - _wiki_de_poble/04_escriptori/AAMMDD_HHMM_prompt_*.md
  crida:
    - wiki-cicle-de-vida
  programacio: null
```

- Les claus són verbs (`llig`, `escriu`, `crida`) per a dir exactament la relació. Tot el que ve d'ací és confiança `declarat`.
- `programacio` apunta a un `id` de `.agents/cron/registre_tasques.json` (vegeu [[02_calendari]]).

**Regles de validació** (porta determinista nova):

1. Cada ruta de `llig` i `escriu` existix, o és un patró amb comodí que respecta la taxonomia `AAMMDD_HHMM_categoria_titol`.
2. Cada nom de `crida` té carpeta a `.agents/skills/` amb un `SKILL.md` vàlid. Es comprova contra el disc, no contra l'índex, que pot estar ranci.
3. Cada `programacio` existix al registre de tasques.
4. Es rebutja qualsevol ruta dins de `90_arxiu_historic/` (AGENTS §5).

## Fonts que el compilador llig tal com estan

| Font | Què aporta |
|---|---|
| `.agents/protocolledge.json` | rutes, plantilles, skills, seccions i destins |
| `.agents/skills_index.json` | cens de skills i `triggers_on` |
| `.agents/cervell.json` | ordre d'arrencada |
| `.claude/settings.json` | hooks per esdeveniment de Claude Code |
| `.agents/hooks.json` | hooks declarats d'Antigravity, sense consumidor acreditat |
| `package.json` | ordres npm i l'script que crida cadascuna |
| `.agents/cron/registre_tasques.json` | tasques, amb els camps nous de [[02_calendari]] |
| `.husky/<esdeveniment>` i `git config core.hooksPath` | text dels hooks de git instal·lats, per a jutjar les tasques `git-hook` (`fonts.hooksGit`) |
| `.agents/consell.json` | les dotze membres del Consell i el rol de cadascuna |
| `.agents/runtime/turns/*.json` | torns, rebuts i estat del cicle de vida |
| `tooling/wiki/schema.json` | validesa del frontmatter |
| `src/sections/text/pageContent.js` i consumidors | claus estructurals que vigila la frontissa de contingut ([[05_actors_i_salut]]) |

## Semàfor, problemes a la vista i honestedat (Onada 6)

La interfície pinta la gravetat amb tres colors, i el compilador no fabrica cap verd. El codi és a `src/sections/consola/semafor.js` i `src/sections/consola/mapa/construeixMapa.js`.

- **Semàfor.** Un avís `alta` és roig, i un `mitjana` o `baixa` és taronja. Sense cap avís, la targeta és verda i diu «En ordre». El que només informa (una relació inferida, una mètrica `N/A`, «Canvis nous») és neutre. Cap to de salut no és blau.
- **Un sol criteri a tot arreu.** Un avís té el mateix color a totes les targetes. Per exemple, una skill òrfena (`orfe`, mitjana) és taronja a l'Explorador, a Avisos i salut, a l'Inventari i a la xifra «skills òrfenes». Cada enllaç trencat de la coberta de l'Explorador pren la gravetat dels seus avisos.
- **Etiquetes de les peces.** `VIU`, `ACTIU` i `EN MARXA` van en verd; `MORT` i `SENSE CONSUMIDOR`, en roig; la resta (`SENSE LLANÇADOR`, `PARCIAL`, `DESCONEGUT`, `FALTA`), en taronja.
- **Inventari.** El semàfor d'una skill és el de l'avís més greu, no el del recompte. Un sol avís alt ja la fa roja.
- **Verd amb base.** Una targeta només diu «En ordre» si la seua font es pot llegir i ho mesura tot:
  - el pols, amb la termometria i un rebut datat;
  - Avisos i salut, amb totes les mètriques mesurades (cap `N/A` i almenys una mètrica);
  - Agents atòmics, amb cap peça `SENSE MESURA`.

  Sense base, la targeta no porta ni verd ni roig. Un avís alt sí que la fa roja, perquè el roig té base.
- **Les xifres.** Les xifres del tauler i les de dins de les pàgines i del pols porten la mateixa etiqueta que el tauler: «Cal reparar», «Important» o «En ordre».
  - Una xifra que compta avisos pren el color del més greu.
  - Una que compta tasques pren el del pitjor estat: viva, verd; morta, roig; la resta, taronja; sense cap tasca, cap color.
  - Una que compta el que falta (llocs sense lector, candats per acreditar, skills fora del manifest) és taronja o roja si n'hi ha, i verda si no n'hi ha cap.
  - Les que només diuen una mida (nodes, arestes, rutes documentals, cadenes, suggeriments, punts de trobada, agents atòmics, registres de consum, skills del manifest i del nucli, rebuts de lectura, operacions immunitàries) informen i no porten cap etiqueta.
- **Problemes a la vista.** Cada targeta diu quins problemes té: com a molt cinc, i «i N més». Ho fan les cobertes del tauler, els tres panells del pols, les xifres i les peces del Mapa (cada peça, els seus avisos). Cada problema porta davant una marca amb el color del semàfor: la severitat d'un avís, l'estat d'una tasca, el color d'una skill a l'Inventari o el que falta. Les rutes van en `<Mono>`, que el mode privacitat amaga. La targeta continua portant a la seua pàgina.
- **Ordre de reparació.** El botó de l'Inventari i de l'Explorador només copia. Cada línia diu, en un comentari de shell, quin avís repara. El segell no es torna a segellar des d'ací: es copia el diagnòstic (`node tooling/gates/segella.mjs`, sense `--update`), i el segell nou passa per l'executor de mutacions amb una lease.

Codis i fonts noves del compilador:

| Canvi | Què fa |
|---|---|
| `frontissa-roja` (alta) | Un avís per cada error de `fonts.frontissa.errors`, sobre la seua clau dins del registre d'empremtes: el node és `document:.agents/contingut_estructural.json#CLAU`. Sense clau, porta el número de l'error; una clau repetida porta `-2`, `-3`… Es repara amb una aprovació humana (`--aprova CLAU --per NOM`). |
| `ledger-invalid` | L'evidència diu la causa: el cos s'ha editat sense tornar-lo a segellar, o falta el segell. Els segells fòssils i les línies mal formades es compten a part. |
| `crida-inexistent` | No compta el nom d'un hook declarat a `.agents/hooks.json` (per exemple `sdp-fatiga`). |
| `fora-cataleg-claude` | Si `CLAUDE.md` importa la skill amb `@`, l'avís continua però baixa a `baixa`, i l'evidència ho diu. |
| Subtasques (`llancador.tipus: tasca`) | Una subtasca sense `script` propi i amb la mare viva és `desconegut`, mai `viu`. |
| `fonts.portaDocuments` | Rep l'eixida de `checkDocuments` (`{ valid, checked, errors }`) i mesura `conformitat-documental` com a documents sense cap error sobre els comprovats. Un error que no és de cap document compta com un document més que falla. Amb `checked: 0` és `N/A`: per defecte la porta només comprova els documents canviats, i amb l'arbre net no en comprova cap. |
| `fonts.cadenaPortes` | Rep l'eixida de `run-portes.mjs --diagnostic` (`{ valid, failures, total? }`) i mesura `cadena-portes`. |

Sense alguna d'estes dues fonts, la mètrica continua en `N/A`. La closca (`tooling/brain/mapa-consola.mjs`) encara no les passa: és governança, i el canvi va en el paquet de laboratori `04_escriptori/02_investigacio_ia/261009_0400_consola_claude/`.

## On viu l'eixida

El mapa descriu la maquinària interna, així que **no ha d'entrar** al manifest públic de la Wiki, ni a `public/rag-index.json`, ni al paquet de WordPress. Queda pendent una decisió humana:

- servir la Consola només en desenvolupament;
- o servir-la darrere del rol de superadministració, amb el JSON exclòs de la compilació independent.

## Vincles

- [[00_portada]]
- [[01_fluxos_skills]]
- [[02_calendari]]
- [[03_inventari_skills]]
- [[05_actors_i_salut]]
