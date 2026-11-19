# taxonomia_documental

> Com es diuen els documents de treball del Mas (aammdd_hhmm_categoria_titol.ext), catàleg de categories, superfícies, excepcions i portes que ho comproven.

- Document a la Wiki de Poble: https://socdepoble.org/wikidepoble?item=taxonomia_documental
- Llicència de sèrie del contingut: CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

# Taxonomia documental

Els documents de treball del Mas es diuen `aammdd_hhmm_categoria_titol.ext`, en minúscules i sense accents. Esta pàgina explica cada peça del nom, fixa el catàleg de categories i diu quines portes ho comproven.

La regla ve d'`AGENTS.md` §2, literal: «Tot document de treball o informe nou s'ha de crear amb el format: `aammdd_hhmm_categoria_titol.ext` (sempre en minúscules, separats per guions baixos `_`, sense accents)».

La porta `tooling/gates/porta-taxonomia.mjs` llig el mateix catàleg de `tooling/wiki/taxonomia.json` i comprova que esta pàgina i el JSON diuen el mateix (`--paritat`). Si canvies una categoria, canvia-la als dos llocs o la porta cau.

## Anatomia del nom

### Segment `aammdd`

Representa l'**any, mes i dia de creació**, amb **dues xifres cadascun** (exemple: `260924` = **24 de setembre de 2026**).

### Segment `hhmm`

Indica l'**hora local de creació**, expressada en format de **24 hores** (exemple: `1410` = **les 14:10**).

### Segment `categoria`

Ha de ser sempre **una categoria del catàleg** de baix, **mai inventada** (exemple: `auditoria`).

### Segment `titol`

S'escriu en **snake_case**: **minúscules, xifres i guions baixos** (exemples: `claude`, `consola_termodinamica`).

### Segment `.ext`

Correspon a l'**extensió del fitxer en minúscules** (exemple: `.md`).

Exemple complet: `260924_1410_auditoria_claude.md`.

**L'ordre és any, mes, dia.** `260924` no és el **26 de setembre del 2024**. Llegir `aammdd` com si fóra `ddmmaa` és un **error que ja ha passat**: la **porta rebutja** un fitxer nou amb una **data de fa més de 30 dies**, que és com es **delata eixa inversió**.

**Dins dels documents, les dates van en `AAAA-MM-DD`** (`2026-09-24`). El format curt `aammdd` només viu al nom del fitxer i no es transcriu mai al text.

### Noms que la porta rebutja

#### `260924_1445_ACTA_MARMOTA_consola.md` (`Llei T1`)

Rebutjat perquè **porta majúscules** al nom del fitxer.

#### `260924_1445_acta-marmota.md` (`Llei T1`)

Rebutjat perquè **porta guions**; l'únic separador admés és el **guió baix** (`_`).

#### `260231_1000_acta_x.md` (`Llei T2`)

Rebutjat perquè la data és invàlida (**el 31 de febrer no existix**).

#### `260924_1000_incidencia_protocol.md` (`Llei T3`)

Rebutjat perquè la paraula `incidencia` **no és al catàleg** de categories.

#### `260924_1000_auditoria.md` (`Llei T4`)

Rebutjat perquè **falta el títol** descriptiu després de la categoria.

#### `261001_0900_acta_x.md`, escrit el 24-09 (`Llei T5`)

Rebutjat perquè declara una **data del futur** respecte al rellotge d'execució.

#### `240926_1000_acta_x.md`, fitxer nou (`Llei T6`)

Rebutjat perquè porta una **data de fa dos anys**, símptoma d'escriure `ddmmaa` en lloc d'`aammdd`.

## Catàleg de categories

Cada categoria correspon a una ruta de `.agents/protocolledge.json`, que és qui diu quina plantilla s'ha de llegir abans d'escriure. Quan dos categories comparteixen prefix, guanya la més llarga: `pla_implementacio_claude` és de la categoria `pla_implementacio`, no de `pla`.

<!-- SDP:TAXONOMIA:CATEGORIES -->
| Categoria | Ruta documental |
|---|---|
| `acta` | `acta` |
| `auditoria` | `auditoria` |
| `brainstorming` | `brainstorming` |
| `branding` | `branding` |
| `bundle` | `bundle` |
| `doc_to_app` | `doc_to_app` |
| `estudi` | `estudi_ia` |
| `informe` | `estudi_ia` |
| `macro_bundle` | `bundle` |
| `macro_prompt` | `prompt.consell` |
| `micro_bundle` | `bundle` |
| `micro_prompt` | `prompt.consell` |
| `petorreta` | `prompt.local` · `prompt.consell` |
| `pla` | `pla.implementacio` |
| `pla_implementacio` | `pla.implementacio` |
| `produccio` | `modo_produccion` |
| `prompt` | `prompt.local` · `prompt.consell` |
| `skill` | `skill` |
| `solucio` | sense ruta |
| `tasques` | sense ruta |
<!-- /SDP:TAXONOMIA:CATEGORIES -->

### Notes d'abast per categoria

- **`acta`:** creació nova permesa **només a `10_actes/`**; un fitxer `acta_marmota_…` té categoria `acta` i títol `marmota_…`.
- **`auditoria`:** pren la forma `aammdd_hhmm_auditoria_claude.md` o `…_auditoria_codex.md` (i anàlegs per agent).
- **`bundle`, `macro_bundle`, `micro_bundle`, `macro_prompt` i `micro_prompt`:** s'utilitzen **només per a IAs externes** del Consell.
- **`informe`:** categoria **transitòria de torn** governada per la porta Olivera.
- **`pla`:** **àlies de categoria** de la plantilla única `pla.implementacio`.
- **`pla_implementacio`:** el **títol és el cognom exacte** de la petorreta que l'origina.
- **`prompt`:** per a **Claude i Codex** s'utilitza **només `prompt`**, mai prefixos `macro_` ni `micro_`.
- **`skill`:** identifica l'**esborrany a l'Escriptori**; la skill viva instal·lada es diu sempre `SKILL.md`.
- **`solucio` i `tasques`:** **artefactes transitoris de torn** (porta Olivera), sense ruta ni plantilla pròpia.

Una **categoria de document formal nova** necessita **primer una ruta** a `.agents/protocolledge.json` (amb **plantilla i seccions**) i després una fila ací i a `tooling/wiki/taxonomia.json`. `solucio` i `tasques` són **artefactes transitoris** admesos per la porta Olivera, **sense ruta formal**; esta **excepció no crea plantilles**. `incidencia` no és al catàleg.

## Superfícies i excepcions

- **On s'aplica.** Els fitxers de primer nivell de `_wiki_de_poble/04_escriptori/` i de `_wiki_de_poble/10_actes/`. Les subcarpetes (`00_bandeja_d_entrada`, `01_produccio`, `02_investigacio_ia`) queden fora.
- **Deute heretat.** En el pre-commit la porta només mira els fitxers afegits en eixe commit. Els noms antics es poden inventariar amb `--tot`, però no bloquegen.
- **Excepcions amb nom canònic.** `00_index_escriptori.md` i els arxius arrel de sistema que enumera `AGENTS.md` §2 (`SKILL.md`, `LEDGER.md`, `ESTAT.md`, `AGENTS.md`, `QUI_SOC.md`, `ON_ESTIC.md`, `VEINS.md`).
- **Codi i coneixement estable.** Conserven noms canònics útils, sense data (Genotip, llei 8). La nomenclatura termodinàmica és per als documents d'esdeveniment: actes, auditories, plans i petorretes.

## Qui ho comprova

### `tooling/wiki/document.mjs`

Exigix el patró `^\d{6}_\d{4}_[a-z0-9_]+\.md$` per a `context` i `create` **en crear un document pel circuit**.

### `tooling/gates/porta-olivera.mjs`

Comprova **el mateix patró i les categories transitòries** **en escriure una petorreta a l'Escriptori**.

### `tooling/wiki/tractor-nomenclatura.mjs`

Valida el **snake_case de tota la Wiki** (`llei N1`) mitjançant `npm run porta:nomenclatura`.

### `tooling/gates/porta-taxonomia.mjs`

Verifica les **lleis `T1` a `T6`** i la **paritat amb esta pàgina** al **pre-commit**, abans de la cadena de portes, amb `--staged`.

La porta de taxonomia ja és instal·lada a `tooling/gates/porta-taxonomia.mjs`, i el `.husky/pre-commit` l'executa amb `--staged` abans de la cadena de portes. Es va gestar al laboratori de `04_escriptori/02_investigacio_ia/` i la instrucció d'instal·lació és a l'auditoria `260924_1410_auditoria_claude`.

## Deute conegut

- La ruta antiga `planificacio` està retirada per a contextos nous. Els rebuts amb instantània anterior conserven la seua plantilla i versió; no es reescriuen. La plantilla operativa única és `pla_implementacio.md`.
- `document.mjs` i la porta Olivera no validen la categoria: accepten qualsevol paraula després de l'hora.

## Vincles

- [[00_index]]
- [[02_genotip]]
- [[auditoria_canonica]]
- [[sgq_prompts]]
