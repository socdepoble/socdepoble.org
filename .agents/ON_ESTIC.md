---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-05T22:17:20.042Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 44e2b8e2

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/04_escriptori/261005_1303_prompt_opus_local.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-05 04:40 · Claude · tancament de la Marató 2230

Informe [[261004_2245_auditoria_claude]] i avaluació [[261005_0345_avaluacio_final_marato]] (global 6,1). Fronts de Claude F1-F5 i P4 vius amb proves. Revisió adversarial de Codex amb 3 rondes d'ACK. Migració 2610042350 no aplicada. Res no està commitejat i hi ha un parany de commit parcial: tooling/tests, lazyRoute.js, RouteErrorBoundary, migracions i imatge OG sense versionar. Cap test:ci complet sobre el tall congelat. Següent: el commit atòmic, un runner únic i la primera tasca de 261005_0345_tasques_pendents_consola_visual (crash de useSession en eixir des de Control).

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
