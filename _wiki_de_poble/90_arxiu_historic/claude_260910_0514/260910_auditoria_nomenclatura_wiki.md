---
tipus: informe
estat: esborrany
description: Estàndard de nomenclatura de la Wiki i tractor validador, amb auditoria prèvia del corpus
tags:
  - core
  - graf
  - saber
---

# Auditoria i estàndard de nomenclatura de la Wiki

**Seient Núm. 5 — Auditor Sènior.** Bundle `260910_0501_BUNDLE_auditoria.md`, esquema `sdp.bundle.v2`.
**404 fitxers extrets, 404 sha256 coincidents, 0 discrepàncies.** El manifest no menteix.

---

## 1. Veredicte

Qwen té raó en la forma i s'equivoca en la prioritat. Les dues meitats de la seua proposta estan en estats molt diferents:

**La meitat YAML ja existix i està en roig.** No cal dissenyar-la. `tooling/wiki/esquema_frontmatter.json` (v1, 5 claus universals) i `tooling/wiki/tractor-frontmatter.mjs` ja són al repositori i ja estan engranats a `run-portes.mjs` com a `porta:frontmatter`. L'he executat contra el corpus real:

```
F1 OBLIGATÒRIA  17   F2 FORASTERA   2
F3 ENUM          6   F5 ENTROPIA    1     → deute màxim declarat: 0 en totes
```

La porta cau. I cau perquè `.agents/deute/.frontmatter-deute.json` **no existix al disc** — el propi bundle ho declara a `absents_no_critics`. Sense fitxer de deute el sostre és 0 a totes les lleis, i qualsevol infracció tomba la cadena. Dissenyar un segon estàndard YAML damunt d'este seria construir la tercera llei sobre dos que ja no es compleixen.

**La meitat snake_case no existix, i la justificació que li donem és falsa.** L'argument és «fricció a Linux per *case-sensitivity*». He buscat la fricció i no hi és: **0 col·lisions de caixa** en 72 fitxers. Cap parell de fitxers depén de la majúscula per a ser únic. El dany real del corpus és un altre, i és més greu:

> **15 de les 19 rutes `_wiki_de_poble/...` citades al codi apunten a carpetes que no existixen.**

`00_SER_Brain_Identitat` la citen **11 fitxers**, entre ells `.agents/consell.json` — el cens del Consell. `02_ACTUAR_Maquina_Tecnica` la citen 7, entre ells `.agents/BIOS.md` i `skill-acte-reflex/SKILL.md`. També són mortes `03_GOVERNAR_Normativa_Regles`, `01_SABER_Cultura_Coneixement`, `04_ARXIU_Documents_Historics` i `04_arquitectura_disseny`.

La wiki ja ha canviat d'estructura **almenys dues vegades**. Cap eina ho va notar cap de les dues. `esquema_frontmatter.json` encara declara el seu `extensio_agent.abast` sobre `_wiki_de_poble/00_SER_Brain_Identitat/...`: l'esquema canònic apunta a una carpeta fantasma.

**Conclusió:** el problema no és la caixa. És que ningú mesura si una ruta escrita al codi existix. Fer la migració a snake_case sense eixa mesura afegix la quarta capa de fòssils damunt de tres.

---

## 2. El precedent que ho demostra

No cal especular sobre què passa quan es renomena sense reescriure enllaços. Ja va passar, i el bundle en guarda la cicatriu:

`_wiki_de_poble/01_Ser/03_EQUIP_IA.md` apareix com a **T1 ORFE** al teixidor. Zero enllaços entrants. El motiu és que algú el va renumerar des de `02_` i va deixar **21 referències** apuntant al número vell. I encara pitjor: els blocs *«Sinapsis Entrants (Autogenerat)»* van quedar congelats amb la ruta antiga:

```markdown
- [[02_EQUIP_IA|00_SER_Brain_Identitat/02_EQUIP_IA.md]] — Categoria: [[Identitat]]
```

Eixa línia és autogenerada. Porta el número vell **i** la carpeta morta. Es va generar una vegada i no s'ha regenerat des de la reorganització.

Un renom va costar 21 arestes i 1 orfe. Ara es proposen **42 renoms de fitxer i 7 de directori** alhora.

He mesurat l'impacte exacte. La llei de resolució del teixidor (`teixidor.mjs:71,98`) és `path.basename()` **sensible a majúscules**:

> Sota la llei actual, un `snake_case` massiu trencaria **1.031 de 1.613 enllaços (64%)**.

`[[00_index]]` ×267. `[[graf]]` ×119. `[[00_index_identitat]]` ×85. `[[maquina]]` ×49.

I hi ha un detall que agreuja això: `lib/resolutor.mjs` — el resolutor amb semàntica d'Obsidian, **insensible a la caixa** — ja existix i resoldria el problema. Però només l'importa `llaurador_indexs.mjs`. **`teixidor.mjs` no l'usa.** Encara fa `basename` a pèl.

---

## 3. Estat mesurat del corpus

| Mesura | Valor |
|---|---|
| Fitxers a la wiki | 72 (66 `.md`) |
| Documents sota les lleis de frontmatter | 86 (wiki + `.agents`) |
| Fitxers que violen `snake_case` | 58/86 (**67%**) |
| Directoris que violen `snake_case` | 17/26 |
| Col·lisions de caixa reals | **0** |
| Enllaços `[[...]]` totals | 1.725 (1.613 arestes + 112 pseudo-etiquetes) |
| Enllaços ja penjats **hui** | **136** (sostre declarat: 59) |
| Rutes de wiki citades al codi | 19 — **15 mortes** |
| Documents a `02_Saber` | **56 de 66 (85%)** |
| Documents a `03_Actuar` | **1** (només el seu índex) |

**Portes en roig ara mateix:** `porta:frontmatter` (deute pujat), `porta:teixit` (orfes 3>0, penjats 136>59), i **`run-portes.mjs` pas 19 crida `tooling/brain/build_skills_index.mjs`, que no existix** — pas fantasma, sense `script:` npm associat, que tomba la cadena sencera. `npm run portes` no pot passar hui per tres motius independents.

**Altres troballes:**

- `tooling/gates/esquema_frontmatter.json` és **còpia literal byte a byte** de `tooling/wiki/esquema_frontmatter.json`. **Zero lectors.** `tractor-esquemes.mjs` compara `schema.json` amb `esquema_frontmatter.json`, però no vigila esta tercera còpia. Deriva garantida.
- `[[doc_logos_oficials]]` — citat 10 vegades i **penjat**. La Petorreta d'esta sessió diu «Consulta sempre: [[doc_logos_oficials]]» i el seu bloc `SDP-ISO-CONTEXT` li declara `sha256: c426ffc2…`. **El fitxer no és al bundle ni al disc.** L'àncora de la instrucció apunta al buit, i el bloc ISO certifica el hash d'un fitxer absent.
- `[[MOTOR_OFFLINE]]` — 44 aparicions, 28 enllaços penjats. Fòssil de l'era Online-First que l'ADR-2026-08 va derogar.
- Dos carpetes de plantilles: `02_Saber/07_plantilles/` (11 fitxers) i `02_Saber/plantilles/` (1). El tractor de frontmatter té una exempció per contingut (`{marcadors}`) que ha de cobrir les dues.
- `00_Bandeja_d_Entrada` és castellà. La ferramenta que la neteja es diu `autoneteja_safata_produccio.sh`. L'eina parla valencià, la carpeta no.

---

## 4. Estructura de carpetes mestres

La proposta de Qwen és afegir semàntica a les carpetes perquè l'indexador la capte. **Això és exactament el que ha fallat dues vegades.** Si el frontmatter ja porta `tipus` i `tags` (vocabulari tancat de 16 termes, ja validat per `porta:frontmatter`), tindre a més una taxonomia de carpetes és mantindre **dos sistemes de classificació competint**. El que deriva és el que no es mesura, i les carpetes no es mesuraven.

**Llei:** la carpeta diu **on és** un document en el seu cicle de vida. El frontmatter diu **de què va**. Mai al revés.

```
_wiki_de_poble/
├── 00_index.md
├── 01_ser/            ← identitat, genotip, BIOS. Canvia poc.
├── 02_saber/          ← doctrina, arquitectura, normes. Estable.
│   ├── arquitectura/  (era architecture/ — anglés sense motiu)
│   ├── codex_huma/
│   ├── obsidian/      (era obsidian_plugins/)
│   ├── plantilles/    ← FUSIÓ de 07_plantilles/ + plantilles/
│   └── skills/
├── 03_actuar/         ← fitxes tècniques d'scripts. Buida hui.
└── 04_escriptori/     ← treball viu. Rota constantment.
    ├── 00_safata/     (era 00_Bandeja_d_Entrada — castellà)
    └── 01_produccio/
```

**Profunditat màxima: 2 sota la wiki.** Cap subcarpeta nova sense una llei que la mesure.

Dos decisions que no depenen de la caixa i que s'han de prendre igualment:

1. **`02_saber` amb 29 documents a l'arrel no és una carpeta, és un calaix.** Els quatre pilars no existixen: n'hi ha un que porta el 85% i tres etiquetes. Repartir-los és feina de `tags`, no de carpetes noves.
2. **`03_actuar` porta 1 fitxer que promet «s'ompliran progressivament».** O s'omple en esta migració o es fusiona amb `02_saber`. Un pilar buit és cerimònia, i la cerimònia és precisament el que la llei F5 del frontmatter ja penalitza als documents. Aplica-te-la a les carpetes.

---

## 5. Guia d'estil de nomenclatura

**Llei N1 — Caixa.** Tot segment de ruta compleix `^[a-z0-9]+(_[a-z0-9]+)*$`. Minúscules pures, dígits, guió baix com a únic separador. Sense accents, sense espais, sense guions mitjans, sense punts fora de l'extensió. Extensió sempre en minúscules.

**Llei N2 — Prefix ordinal.** `NN_` només on l'ordre és semàntic (`01_ser` abans que `02_saber`). Si l'ordre no significa res, no poses número: un número sense ordre és una invitació a renumerar, i renumerar és el que va deixar `03_equip_ia` orfe.

**Llei N3 — Llengua.** Valencià, AVL. `safata`, no `bandeja`. `arquitectura`, no `architecture`. L'única excepció són les claus que exigix una eina externa (`tags`, `aliases` d'Obsidian), i eixes van al frontmatter, no al nom del fitxer.

**Llei N4 — Exempcions declarades.** Cada exempció viu a `tooling/wiki/nomenclatura.json` **amb el motiu escrit**. Les d'ara:

| Exempt | Motiu |
|---|---|
| `SKILL.md` | `matrix.mjs:56` el busca literalment en majúscules. Contracte extern. |
| `README.md`, `LICENSE`, `AGENTS.md` | Convencions de repositori i d'agents de codi. |
| `BIOS.md`, `LEDGER.md`, `ESTAT.md`, `PROFILE.md`, `BASELINE.md`, `BOOTSTRAP.md`, `PROTOCOL_PETORRETA.md` | Arrel de `.agents/`, càrrega per nom literal. |
| `ADR-YYYY-MM-*.md` | Identificador estable citat fora del repositori. |

Una exempció sense motiu escrit és deute, no excepció.

**Llei N5 — Renom atòmic.** Cap renom sense reescriptura d'enllaços **en el mateix commit**. Sense això, el renom no és un canvi de nom: és una supressió amb testimonis.

---

## 6. El tractor

`tractor-nomenclatura.mjs` + `nomenclatura.json`. Zero dependències, ESM, *fail-closed*, mateix patró de deute segellat que la resta de tractors.

```
N1  CAIXA        segment que no és snake_case i no està exempt
N2  RUTA-MORTA   ruta de wiki citada al codi que no existix al disc
N3  COL·LISIÓ    dos fitxers que col·lapsarien al mateix nom canònic
```

**N2 és la llei que importa.** N1 és la que has demanat; N2 és la que hauria evitat les 15 rutes mortes i les hauria detectat les dues vegades anteriors. Si només n'engranes una, engrana N2.

Executat contra el corpus real d'este bundle:

```
🚜 TRACTOR NOMENCLATURA — sistema d'arxius
  72 fitxers · 13 directoris · 21 rutes citades al codi

❌ N1 · CAIXA — 49 màx 0
❌ N2 · RUTA-MORTA — 11 màx 0
      _wiki_de_poble/00_SER_Brain_Identitat  ← 11 fitxers: .agents/consell.json, …
      _wiki_de_poble/02_ACTUAR_Maquina_Tecnica  ← 7 fitxers: .agents/BIOS.md, …
✅ N3 · COL·LISIÓ — 0 màx 0
```

Verificat: eixida 1 sense fitxer de deute, eixida 0 després de `--baseline`, `--json` vàlid. **No he segellat cap deute** — el sostre el poses tu quan decidisques, no jo.

Mode `--pla`, que no toca cap fitxer:

```
🗺️  PLA DE MIGRACIÓ — cap fitxer tocat
  Directoris a renomenar : 7
  Fitxers a renomenar    : 42
  Enllaços a reescriure  : 1083   ← al MATEIX commit
  Col·lisions bloquejants: 0
```

Eixos 1.083 enllaços són la factura real de la proposta. Amb `--json` en tens el detall fitxer:línia per a alimentar el codemod.

**Instal·lació** — afig a `package.json` i a `run-portes.mjs` **davant de `porta:teixit`** (si el teixit cau primer, no arribes a saber per què):

```json
"porta:nomenclatura": "node tooling/wiki/tractor-nomenclatura.mjs --arrel=."
```

---

## 7. Ordre d'execució

L'ordre no és negociable. Cada pas depén que l'anterior estiga verd.

1. **Traure el pas fantasma** `build_skills_index.mjs` de `run-portes.mjs`, o crear el fitxer. Mentre hi siga, la cadena no pot passar mai i cap altra mesura és llegible.
2. **Engranar N2 i posar les 15 rutes mortes a zero.** És reescriure text a 23 fitxers. No toca cap nom, no trenca cap enllaç, i tanca la ferida que ja sagna. Inclou l'`abast` de `esquema_frontmatter.json`.
3. **Esborrar `tooling/gates/esquema_frontmatter.json`** (còpia sense lectors) o fer que `tractor-esquemes.mjs` la vigile. Una de les dues.
4. **Cablejar `lib/resolutor.mjs` dins de `teixidor.mjs`.** Sense això, el pas 6 trenca 1.031 enllaços per construcció. El resolutor ja existix i ja és insensible a la caixa: només cal usar-lo.
5. **Posar `porta:frontmatter` en verd** (F1 17, F3 6) i segellar el deute. La meitat YAML de la proposta acaba ací; no cal dissenyar-ne cap altra.
6. **Aleshores** el renom: `--pla --json` → codemod → renom + reescriptura dels 1.083 enllaços **en un commit** → `--baseline`.
7. **Baixar `porta:teixit` de 136 penjats.** `MOTOR_OFFLINE` (28) és fòssil derogat per l'ADR-2026-08: o es crea la làpida o s'esborren els enllaços.

Els passos 1–5 no toquen ni un nom de fitxer i deixen el sistema millor que ara. El pas 6 és el que has demanat, i és l'únic que pot destruir res.

---

## 8. El que no he verificat

- **No he executat `npm run portes` sencer.** No hi ha `node_modules` al bundle. Les portes que he provat les he executades individualment amb `--arrel=.`.
- **`build_skills_index.mjs`**: absent del manifest i el contracte del bundle no exclou `tooling/brain/`. Conclusió: no existix al repositori. Si existix i el bundler l'ha perdut, això és un forat al bundler i és més greu que el pas fantasma.
- **`DOC_Logos_Oficials.md`**: el bloc `SDP-ISO-CONTEXT` de la Petorreta li declara un sha256 que jo no puc comprovar contra res. O el fitxer es va esborrar després de generar el bloc, o el generador de blocs ISO llig d'un índex ranci. Val la pena mirar-ho: afecta la integritat de totes les Petorretes, no només esta.
- **No he tocat cap fitxer del teu repositori.** Tot s'ha fet sobre una còpia extreta del bundle a `/home/claude/extract`.

---

**Ancoratge de Seguretat:** [[00_index_escriptori]]

## Sinapsis

- [[00_bios]]
- [[02_genotip]]
- [[doc_governanca]]
- [[graf]]
- [[maquina]]

## Taxonomia

- **Categoria:** [[maquina]]
- **Etiquetes:** [[graf]]
