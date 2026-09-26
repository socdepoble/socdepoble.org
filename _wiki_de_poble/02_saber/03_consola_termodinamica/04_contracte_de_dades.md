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
