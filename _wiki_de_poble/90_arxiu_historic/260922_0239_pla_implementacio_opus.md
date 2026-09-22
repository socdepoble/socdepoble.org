---
type: document
status: esborrany
description: Pla d'implementació per tancar el col·lapse cognitiu (porta que ensenya) i abordar les sis tasques de fortificació del Mestre.
tags:
  - implementacio
  - reflex
  - portes
---

# Pla d'Implementació — La Porta que Ensenya

**Estat del Pla:** en elaboració · pendent d'aprovació del Mestre
**Torn:** `torn_1790037435784` · Opus 5 · 260922_0239
**Auditoria d'origen:** [[260922_0239_auditoria_opus]]

## Vincles (Ancoratge de Seguretat)
- [[00_index_escriptori]]
- [[00_index]]

---

## 1. Context i Troballes

L'auditoria adjunta demostra amb quatre proves executables que l'Acte Reflex és irrealitzable tal com està escrit: 14 de 14 plantilles produïxen documents que `porta-reflex.mjs` rebutja, la plantilla canònica d'auditoria descriu 13 pilars que no existixen, i la porta accepta un `reflex:` inventat de 40 caràcters.

El pegat del 260922_0054 (hooks + `.claude/skills/`) va soldar el **canal** i està verificat com a funcional. El que queda és el **contingut** que hi circula i, sobretot, **el moment** en què arriba.

Antecedents llegits: [[260922_0235_acta_marmota]], `ESTAT.md`, `ON_ESTIC.md`, `00_index_escriptori`, auditoria de Codex 260922_0056 (arxivada).

---

## 2. Preguntes Obertes (decisió del Mestre)

1. **`revisat`** (T4): l'afegim a `schema.json` o el llevem de `auditoria_canonica.md`? Ara està autoritzat per la plantilla i prohibit pel schema. *No ho decidiré jo.*
2. **Ordre d'atac:** Bloc A (cervell) abans que Bloc C (graf i sincronització viva), o t'interessa més veure el graf funcionant esta nit? La meua recomanació és A primer: és el que et lleva faena a tu cada sessió.
3. **Tasca 4 (OEPM, M4392826):** és burocràcia amb data límit del 21/10/2026, fora del meu abast tècnic. La deixe fora del pla i te la recorde com a tasca humana.
4. **Tasca 5 (prompt de panells interactius perdut):** confirmes que `02_investigacio_ia/` està buida? Ho he verificat al disc i no hi ha res. Si no apareix, desenvolupe solució pròpia.

---

## 3. Canvis Proposats

### BLOC A — La Porta que Ensenya (tanca el col·lapse cognitiu)

#### A1 · `[NEW]` `tooling/wiki/plantilles.mjs`
Mòdul únic que resol intenció → plantilla → contracte. Llig `protocolledge.json` i `schema.json`. Exposa `resolPlantilla(intencio)`, `contracteDe(plantilla)` i `hashPlantilla(ruta)` (sha256, 8 hex). Font mecànica única: elimina la contradicció triangular de T4.

#### A2 · `[MODIFY]` Les 14 plantilles — bloc `EIXIDA`
A cada plantilla de `03_actuar/plantilles/` i a `auditoria_canonica.md`, afegir:

```
<!-- SDP:EIXIDA
type: informe
status: esborrany
description: <12-220 caràcters>
tags: [auditoria]
-->
```

No és YAML, per tant **no pot col·lisionar** amb el frontmatter propi de la plantilla. Resol T1 i T6 alhora: els dos `prompt_*` perden el segon bloc `---`.

#### A3 · `[MODIFY]` `tooling/gates/porta-reflex.mjs` — el missatge passa a ser la plantilla
Quan bloqueja, en lloc de queixar-se, imprimix: intenció detectada, ruta de la plantilla, skill que la governa, i **el frontmatter exacte ja resolt i llest per apegar**, amb el `reflex:` prefabricat (`<turn_id> · <hash8>`). Este és el cor de l'arranjament: converteix una norma memoritzada en una instrucció present en el moment de l'escriptura.

#### A4 · `[MODIFY]` `porta-reflex.mjs` — rebut criptogràfic
Substituir `REFLEX_MINIM = 20` per validació de format `<turn_id> · <hash8>`: la porta recalcula el hash de la plantilla del disc i compara. Tanca la Prova B (T2). **Garanteix contacte amb el fitxer, no comprensió** — ho documentarem així, sense inflar-ho.

#### A5 · `[NEW]` `tooling/gates/tractor-plantilles.test.mjs`
Per cada plantilla: el bloc `EIXIDA` existix, el seu `type` és a l'enum de `schema.json`, i **un document construït a partir d'ella passa `porta-reflex.mjs` amb `exit 0`**. Més una prova que injecta un `reflex:` fals i **exigix `exit 2`**.
> *Lliçó del Mestre (260922): una porta necessita una prova que la faça fallar.*

#### A6 · `[MODIFY]` `auditoria_canonica.md`
Reescriure l'abast sobre els 6 directoris reals (`01_ser`, `02_saber`, `03_actuar`, `04_escriptori`, `10_actes`, `90_arxiu_historic`). Substituir `npm run porta:esquemes` (inexistent) per les comandes que sí existixen. Llevar la llista de camps i remetre a `schema.json`. Resol T3.

#### A7 · `[MODIFY]` `.agents/protocolledge.json`
Afegir ruta `pla.implementacio` → `pla_implementacio.md`. Resol T5.

#### A8 · `[MODIFY]` `00_index_escriptori.md`
Moure els set documents ja arxivats de «Documents Actius» a la secció d'arxivats i ancorar els dos d'esta sessió. Resol T8.

### BLOC B — Deute tècnic declarat pel Mestre

#### B1 · Pedra Seca en roig (bloqueja `tancar` ara mateix)
`tancament.mjs` dona `valid: false` per `PEDRA_SECA_INLINE_STYLE` a `src/components/layout/AppGridColumn.jsx` i `src/components/universal/graph/BrainGraph.jsx`. Passar els estils en línia a tokens semàntics. **És el que impedix tancar cap torn ara mateix.**

#### B2 · Neteja ESLint (tasca 2)
`npm run lint` corre amb `--max-warnings=0`. Cal mesurar l'estat real abans de prometre res.

#### B3 · Migració `.brain-reports/` i `.brain-trash/` (tasca 3)
`.brain-reports/` acumula 9,6 MB de fitxers d'agost (`audit.json` 1,3 MB, `distill-plan.json` 1,8 MB, un `.abans-260830` de 884 KB). `.brain-trash/` té 6 carpetes datades. Proposta: `audit.md.abans-260830` s'esborra; la resta es comprimix a `90_arxiu_historic/`. **No toque res sense el teu vistiplau explícit** (zona de quarantena, AGENTS.md §5).

### BLOC C — Producte (les tasques que et fan il·lusió)

#### C1 · Explorador Visual del Brain amb panell de control (tasca 5)
Graf interactiu dins `UniversalWorkspace` amb panell estil roda dentada d'Obsidian: filtres per etiqueta, per `type`, per carpeta, profunditat de vincles i cerca. Sobre el nostre JSON de dades existent, en Pedra Seca pura (SVG + canvas, sense llibreries de graf externes — cap dependència tòxica). Requerix tindre B1 resolt, perquè `BrainGraph.jsx` és precisament un dels dos fitxers en roig.

#### C2 · Sincronització Viva (tasca 6)
Watcher (`chokidar` o `fs.watch` natiu) sobre `_wiki_de_poble/**` que recompila **només el fitxer tocat** i empenta el canvi al client per HMR del dev server. Objectiu: canviar un `.md` i veure'l al graf sense reconstruir el bundle. És la peça que acosta la web a l'experiència d'Obsidian.

#### C3 · Fases 4-5 de Fortificació (tasca 1)
Bucket `public_assets` a Supabase i «Porta Promesa» sobre les 48 portes. **Deute previ conegut:** la meua memòria del projecte registra 21 de 48 portes en roig per deute anterior. Redefinir-les abans de netejar-les seria construir damunt de sorra. Propose fer-ho **després** del Bloc A.

---

## 4. Pla de Verificació

| Pas | Comanda | Criteri |
| --- | --- | --- |
| 1 | `node --test tooling/gates/tractor-plantilles.test.mjs` | 14/14 plantilles generen documents amb `exit 0` |
| 2 | Prova B de l'auditoria (reflex inventat) | **`exit 2`** (ara dona 0) |
| 3 | `npm run porta:frontmatter` | verd |
| 4 | `npm run porta:llaurador` | sense enllaços a fitxers inexistents |
| 5 | `npm run lint` | mesurar abans, zero warnings després de B2 |
| 6 | `node tooling/gates/tancament.mjs --turn-id=<id> --json` | `valid: true` |
| 7 | Prova del cec: obrir sessió nova i escriure un document a l'Escriptori **sense recordar-li res a l'agent** | ha d'encertar a la segona, guiat només pel missatge de la porta |

El pas 7 és l'únic que realment mesura si el col·lapse està tancat. La resta són condicions necessàries.

---

## 5. Ordre d'execució recomanat

```
A1 → A2 → A3 → A4 → A5 (proves)  ·  el cervell
A6 → A7 → A8                      ·  la coherència
B1                                ·  desbloquejar `tancar`
── frontera: ací pares i valides ──
B2 → B3 → C1 → C2 → C3
```

La frontera és deliberada: el Bloc A es pot verificar en una sessió i es pot demostrar amb el pas 7. Encadenar-hi el Bloc C abans de validar-lo seria repetir l'error del 0054 — declarar salut sense comprovar-la.

---

**Ancoratge de Seguretat:** [[00_index_escriptori]] | [[00_index]]
