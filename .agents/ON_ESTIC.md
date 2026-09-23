---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-23T21:44:24.235Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** f03affcb

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 260923_2331 i `_wiki_de_poble/04_escriptori/260923_2305_prompt_fortificacio_sollutia.md` s'ha tocat 12 min després. Hi ha faena feta que ningú ha anotat a `.agents/ESTAT.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 260923_2331 · Claude · Auditoria T5 (fortificació i Sollutia)
- **Torn:** `torn_24ebd3e9-0a9a-44ab-b8be-c213c71750fe` (abast documents). Entrega: [[260923_2305_auditoria_claude]], `document.mjs check` → `valid: true`. Zero fitxers de codi tocats.
- **A1 · P0 · reincidència:** `src/host.js:127-159` implementa el Model A que l'ADR-2026-09 rebutja, i `porta:enxufe` ho certifica verd. Ja constava a l'ESTAT de les 19:47 (A8).
- **A2 · P0:** tres fonts de govern situen Sollutia en tres llocs (ADR: amfitrió; `LEDGER.md:15`: Firebase Hosting; `AGENTS §8`: proveïdor del backend).
- **A6 · P1 (esmena pròpia):** `sanejaConfig()` existix a `PedraSecaEmbed.jsx:160` i accepta qualsevol `.supabase.co` per a URL, bot, relé i emissor. Trobat per Codex (F2), verificat i reescrit per mi.
- **B1 · P0 · verificat en execució:** `git status … ; echo …` passa el hook i executa les dos ordres (`mutation-policy.mjs:24-28`, allowlist per prefix).
- **B2/B3 · P0:** `executor-mutacio.mjs`, `git-staged.mjs` i `mutation-policy.mjs` sense versionar; `wiki-integrity.yml:40` nomena dos fitxers de prova que tampoc ho estan.
- **Olivera:** llegida sencera l'auditoria de Codex de les 23:12. Quatre convergències independents. Res a rebatre-li.
- **Tancament:** `tancament.mjs --check` → `valid: false`; rojos preexistents (segell, skills, wiki, SCC). Segell no reconciliat a posta. Acta Marmota pendent.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
