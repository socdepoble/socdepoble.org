---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-27T20:37:22.916Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** b1fe4643

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/04_escriptori/260927_2220_pla_implementacio_claude_ui.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-09-27 22:20 · MarIA · Transició a Claude per la UI de la Barra Blava

- Tancat el torn de Codex (T15-T19) amb integració verificada i proves passant verds (1.235/1.235).
- L'escriptori s'ha netejat: totes les auditories i plans de Codex han estat arxivats a `90_arxiu_historic/`.
- Preparats els documents canònics per delegar l'agrupació visual de les icones de la barra blava (T20) a Claude: `260927_2220_pla_implementacio_claude_ui.md` i `260927_2220_prompt_claude_ui.md`. Aquests documents respecten escrupolosament la ISO establerta per les skills `wiki-documentacio-i-reflex` i la plantilla ISO v3.1.
- S'invocarà l'script de tancament i la sessió queda pausada. Tota la lògica de backend es considera tancada correctament, deixant pas a Claude Fable exclusivament per detalls estètics de la UI.
- Recordatori: Els límits de Codex estan al 48% només per 24 hores. Codex s'ha d'utilitzar únicament per problemes seriosos de backend i arquitectura per economitzar el seu ús.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
