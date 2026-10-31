---
type: norma
status: esborrany
description: Com es diuen els documents de treball del Mas (aammdd_hhmm_categoria_titol.ext), catàleg de categories, superfícies, excepcions i portes que ho comproven.
tags:
  - govern
  - escriptori
  - portes
---
# Taxonomia documental

Els documents de treball del Mas es diuen `aammdd_hhmm_categoria_titol.ext`, en minúscules i sense accents. Esta pàgina explica cada peça del nom, fixa el catàleg de categories i diu quines portes ho comproven.

La regla ve d'`AGENTS.md` §2, literal: «Tot document de treball o informe nou s'ha de crear amb el format: `aammdd_hhmm_categoria_titol.ext` (sempre en minúscules, separats per guions baixos `_`, sense accents)».

La porta `tooling/gates/porta-taxonomia.mjs` llig el mateix catàleg de `tooling/wiki/taxonomia.json` i comprova que esta pàgina i el JSON diuen el mateix (`--paritat`). Si canvies una categoria, canvia-la als dos llocs o la porta cau.

## Anatomia del nom

| Peça | Què és | Exemple |
|---|---|---|
| `aammdd` | any, mes i dia de creació, dos xifres cadascun | `260924` = 24 de setembre de 2026 |
| `hhmm` | hora local de creació, en 24 hores | `1410` = les 14:10 |
| `categoria` | una del catàleg de baix, mai inventada | `auditoria` |
| `titol` | snake_case: minúscules, xifres i guions baixos | `claude`, `consola_termodinamica` |
| `.ext` | extensió en minúscules | `.md` |

Exemple complet: `260924_1410_auditoria_claude.md`.

**L'ordre és any, mes, dia.** `260924` no és el 26 de setembre del 2024. Llegir `aammdd` com si fóra `ddmmaa` és un error que ja ha passat: la porta rebutja un fitxer nou amb una data de fa més de 30 dies, que és com es delata eixa inversió.

**Dins dels documents, les dates van en `AAAA-MM-DD`** (`2026-09-24`). El format curt `aammdd` només viu al nom del fitxer i no es transcriu mai al text.

### Noms que la porta rebutja

| Nom | Llei | Per què |
|---|---|---|
| `260924_1445_ACTA_MARMOTA_consola.md` | T1 | porta majúscules |
| `260924_1445_acta-marmota.md` | T1 | porta guions; el separador és el guió baix |
| `260231_1000_acta_x.md` | T2 | el 31 de febrer no existix |
| `260924_1000_incidencia_protocol.md` | T3 | `incidencia` no és al catàleg |
| `260924_1000_auditoria.md` | T4 | falta el títol |
| `261001_0900_acta_x.md` (escrit el 24-09) | T5 | data del futur |
| `240926_1000_acta_x.md` (fitxer nou) | T6 | data de fa dos anys: és `ddmmaa` |

## Catàleg de categories

Cada categoria correspon a una ruta de `.agents/protocolledge.json`, que és qui diu quina plantilla s'ha de llegir abans d'escriure. Quan dos categories comparteixen prefix, guanya la més llarga: `pla_implementacio_claude` és de la categoria `pla_implementacio`, no de `pla`.

<!-- SDP:TAXONOMIA:CATEGORIES -->
| Categoria | Ruta documental | Nota |
|---|---|---|
| `acta` | `acta` | creació nova només a `10_actes/`; `acta_marmota_…` és categoria `acta` i títol `marmota_…` |
| `auditoria` | `auditoria` | `aammdd_hhmm_auditoria_claude.md` o `…_auditoria_codex.md` |
| `brainstorming` | `brainstorming` | |
| `branding` | `branding` | |
| `bundle` | `bundle` | només per a IAs externes |
| `doc_to_app` | `doc_to_app` | |
| `estudi` | `estudi_ia` | |
| `informe` | `estudi_ia` | transitòria de torn (porta Olivera) |
| `macro_bundle` | `bundle` | només per a IAs externes |
| `macro_prompt` | `prompt.consell` | només per a IAs externes |
| `micro_bundle` | `bundle` | només per a IAs externes |
| `micro_prompt` | `prompt.consell` | només per a IAs externes |
| `petorreta` | `prompt.local` · `prompt.consell` | |
| `pla` | `pla.implementacio` | àlies de categoria de la plantilla única |
| `pla_implementacio` | `pla.implementacio` | el títol és el cognom exacte de la petorreta que l'origina |
| `produccio` | `modo_produccion` | |
| `prompt` | `prompt.local` · `prompt.consell` | per a Claude i Codex, només `prompt`, mai `macro_` ni `micro_` |
| `skill` | `skill` | l'esborrany a l'Escriptori; la skill viva es diu `SKILL.md` |
| `solucio` | sense ruta | artefacte transitori de torn (porta Olivera), sense plantilla pròpia |
| `tasques` | sense ruta | transitòria de torn (porta Olivera) |
<!-- /SDP:TAXONOMIA:CATEGORIES -->

Una categoria de document formal nova necessita primer una ruta a `.agents/protocolledge.json` (amb plantilla i seccions) i després una fila ací i a `tooling/wiki/taxonomia.json`. `solucio` i `tasques` són artefactes transitoris admesos per la porta Olivera, sense ruta formal; esta excepció no crea plantilles. `incidencia` no és al catàleg.

## Superfícies i excepcions

- **On s'aplica.** Els fitxers de primer nivell de `_wiki_de_poble/04_escriptori/` i de `_wiki_de_poble/10_actes/`. Les subcarpetes (`00_bandeja_d_entrada`, `01_produccio`, `02_investigacio_ia`) queden fora.
- **Deute heretat.** En el pre-commit la porta només mira els fitxers afegits en eixe commit. Els noms antics es poden inventariar amb `--tot`, però no bloquegen.
- **Excepcions amb nom canònic.** `00_index_escriptori.md` i els arxius arrel de sistema que enumera `AGENTS.md` §2 (`SKILL.md`, `LEDGER.md`, `ESTAT.md`, `AGENTS.md`, `QUI_SOC.md`, `ON_ESTIC.md`, `VEINS.md`).
- **Codi i coneixement estable.** Conserven noms canònics útils, sense data (Genotip, llei 8). La nomenclatura termodinàmica és per als documents d'esdeveniment: actes, auditories, plans i petorretes.

## Qui ho comprova

| Porta | Què mira | Quan |
|---|---|---|
| `tooling/wiki/document.mjs` | `^\d{6}_\d{4}_[a-z0-9_]+\.md$` per a `context` i `create` | en crear un document pel circuit |
| `tooling/gates/porta-olivera.mjs` | el mateix patró i les categories transitòries | en escriure una petorreta a l'Escriptori |
| `tooling/wiki/tractor-nomenclatura.mjs` | snake_case de tota la Wiki (llei N1) | `npm run porta:nomenclatura` |
| `tooling/gates/porta-taxonomia.mjs` | lleis T1 a T6 i paritat amb esta pàgina | pre-commit, abans de la cadena de portes, `--staged` |

La porta de taxonomia ja és instal·lada a `tooling/gates/porta-taxonomia.mjs`, i el `.husky/pre-commit` l'executa amb `--staged` abans de la cadena de portes. Es va gestar al laboratori de `04_escriptori/02_investigacio_ia/` i la instrucció d'instal·lació és a l'auditoria `260924_1410_auditoria_claude`.

## Deute conegut

- La ruta antiga `planificacio` està retirada per a contextos nous. Els rebuts amb instantània anterior conserven la seua plantilla i versió; no es reescriuen. La plantilla operativa única és `pla_implementacio.md`.
- `document.mjs` i la porta Olivera no validen la categoria: accepten qualsevol paraula després de l'hora.

## Vincles

- [[00_index]]
- [[02_genotip]]
- [[auditoria_canonica]]
- [[sgq_prompts]]
