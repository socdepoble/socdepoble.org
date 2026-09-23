---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-23T12:45:23.334Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 6423590e

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 260923_1430 i `_wiki_de_poble/04_escriptori/260923_1430_auditoria_claude.md` s'ha tocat 10 min després. Hi ha faena feta que ningú ha anotat a `.agents/ESTAT.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 260923_1430 · Claude · Implementació del sistema nerviós (AFK alçat)

- **Entrega:** [[260923_1430_auditoria_claude]], `tooling/wiki/document.mjs check` → `valid: true`. Torn `torn_7bb49ce4-f3fb-4d1b-8b58-2e762fab300d`, abast **code**, rebut persistent `…:ef73c48c`. Respon a la petorreta de les 13:40. **Mode AFK alçat pel Mestre: sí que s'ha tocat codi.**
- **Fet (I1-I6):** segell immune al `.DS_Store` (hash només sobre `**/*.md`) i resegellat automàtic amb traça a `.agents/runtime/segell.log`; `tooling/brain/despertar.mjs` amb dos canals —stdout fresc amb la llista de l'Escriptori, `.agents/ON_ESTIC.md` sense cap nom de fitxer— i lectura de la **primera** capçalera `## ESTAT_ACTUAL`, més detector de rancidesa; `compila()` exportada amb escriptura condicional i `tooling/vite/wiki-watcher.mjs` endollat a `vite.config.js`; anidació `SER`/`SABER`/`ACTUAR` com a arrels i `00_index` a la categoria base `ÍNDEX`; `triggers_on` encaminat amb `build_skills_index.mjs` + `persona_router.mjs --punters` a `UserPromptSubmit`; **Porta Olivera** (`tooling/gates/porta-olivera.mjs`) que bloqueja una petorreta sense Escriptori classificat, sense Pla de hui o sense §0, i que també veu les redireccions de shell.
- **Contracte:** `.agents/protocolledge.json` sincronitzat amb `prompt_local.md` v2.2.0 (9 seccions, §0 obligatòria). Això desencallava la **porta 1**, que és on moria la cadena.
- **Portes:** la cadena passa de la **porta 1** a la **5 de 48**. Passen plantilles, autoritat, segell i LEDGER; s'atura al Contracte documental pels **4 rebuts absents** (Pla de les 12:45, dos petorretes de les 13:40, `TRACTOR_COGNITIU`), que són d'altres torns i **no s'han falsificat**. Pendent més avall: Linter amb 121 avisos previs. **Cap porta declarada verda més enllà de la 4.**
- **Proves:** 80 React, 14+11 Node, 45 documental. `tests/sistema_nervios.test.mjs` nou (11 proves) registrat a `npm run test:node`. ESLint: 0 avisos als 11 fitxers tocats.
- **Navegador:** `http://localhost:3340/wikidepoble` verificat en el servidor viu; arbre sense el nivell contenidor, zero errors de consola; watcher recompila en 3 s i ignora l'Escriptori.
- **Següent acció:** MarIA emet els 4 rebuts absents i confirma el nom de l'esdeveniment `UserPromptSubmit` al seu client. Decisions humanes pendents: R1 (resegellat automàtic), R2 (router al context de cada torn), R5 (27 àncores fantasma i `02_investigacio_ia`). Acta Marmota de jornada pendent.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
