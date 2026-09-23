---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-23T14:13:46.305Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 0ffda7a7

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 260923_1548 i `_wiki_de_poble/04_escriptori/260923_1615_prompt_implementacio_claude.md` s'ha tocat 24 min després. Hi ha faena feta que ningú ha anotat a `.agents/ESTAT.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 260923_1548 · Claude · Auditoria de l'Olivera lliurada, AFK respectat, decisió pendent

- **Torn:** `torn_faad1a46-4417-4913-bd10-a5ea9baae1ba` (abast **code**), **obert a propòsit**. Entrega: [[260923_1535_auditoria_claude]], rebut `sdp:torn_faad1a46…:040f2e41`, `document.mjs check` → `valid: true`, ancorada a `00_index_escriptori.md`. **Zero línies de codi tocades:** Mode AFK del Protocol §3, que preval sobre el «polvoritzeu d'arrel» de la Directiva 2.
- **Causa arrel de la fallada de context (Directiva 1):** `tooling/wiki/lib/context_preflight.mjs` — el «Bootloader determinista» — té **4 funcions amb el cos buit** (`loadCanonicalRegistry`, `routeSkills`, `extractDependencies`, `retrieveJIT`), retorna **sempre `ready: true`** i **no el crida ningú** (grep: només la declaració). `prompt_sgq.mjs:67` té el validador SGQ **retirat per comentari propi**. No és desídia dels agents: no hi havia porta. **No cal `n8n`** — cal endollar els hooks, que sí que funcionen.
- **ESLint (Directiva 2):** **121 avisos = 109 `no-unused-vars` + 12 `react-hooks/exhaustive-deps`**, xifra idèntica a la de Codex obtinguda per separat. **Purgar els 109 no deixa el linter en verd.** Dels 109: 70% a `tooling/`, només 17% a `src/`. Els 20 arguments orfes són **signatures de stubs** i la seua neteja està **bloquejada per decisió humana** (A/B/C a T-08): `eslint.config.js:69` ja permet `_` a `tooling/wiki/**` i la doctrina el prohibix — Fusible per prohibició sense substitut.
- **Modularitat (Directiva 3): 6/10.** API de render-props neta, però depén d'`AppGridShell`, hi ha fuita d'`ItemMedia` a `NotaFitxa.jsx` i **`DEFAULT_LABELS` porta el valencià dins del motor**, al revés de la doctrina. Canvi de superfície visible: Llei del Píxel.
- **Espill de skills (Directiva 4): NO.** `05_skills_ia/` no existix; `PUBLIC_WIKI_DIRS` només publica `01_ser`, `02_saber`, `03_actuar`; les **17** skills viuen a `.agents/skills/`, fora. El manifest publicat diu literalment «l'índex mirall està pendent de generació» i servix **9 enllaços trencats, 7 d'ells a `skills`**, amb `<!-- TODO: fix link -->` inclòs.
- **Olivera:** llegida l'auditoria de Codex i **corregides tres xifres meues amb la seua evidència** (`PUBLIC_WIKI_DIRS`, 17 skills, 68 documents). Cap conclusió revertida. Ell aporta que **`core-automillora` té `triggers_on: []` i el router no la selecciona** — la skill que el Mestre manava llegir no l'entrega el sistema — i que **les portes no cobrixen el dialecte de Codex**. Això matisa la meua recomanació: els hooks subjecten dos dels tres agents.
- **BLOQUEJADOR MECÀNIC (T-15):** `260923_1515_pla_implementacio_olivera.md` **no valida** — `document.mjs plan` el rebutja per `title` (propietat desconeguda) i `status: consensuat` (fora de l'enum; ha de ser `actiu`), i el seu `reflex: sdp:torn_immediat_olivera` no és un rebut emés. **Mentre el Pla no valide, cap torn d'esta reunió pot arribar a `closed`**, per correctes que siguen les auditories. Són tres línies de frontmatter. **És el primer que s'ha de fer**, abans de cap neteja. No l'he tocat: és document de MarIA i estic en AFK.
- **Portes:** després de signar el LEDGER (que havia trencat jo en afegir-hi el relleu), queden verdes `plantilles`, `autoritat`, `ledger`, `segell` i `documental-tests`. En roig, tot heretat: `skills` (2, per `core-automillora`), `wiki` (1, enllaços trencats de `00_index`) i `scc` (1, dos actes marmota òrfenes, incloent-hi la de hui `260923_1450`). **Cap porta declarada verda més enllà d'eixes cinc.**
- **Següent acció:** **el Mestre tria A, B o C** (T-08) i alça o manté l'AFK. Fins llavors el torn no es tanca i el linter no es toca. Després: pla d'execució de 6 passos ja escrit a l'auditoria.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
