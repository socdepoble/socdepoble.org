---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-28T23:42:10.645Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 4b4c6d80

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/04_escriptori/260928_2355_auditoria_claude.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-09-28 23:55 · MarIA / Claude · Onada 3A completada i llançament Onada 3B

- **Objectiu:** Continuar amb l'Onada Final (T61-T71) fraccionada per Claude en etapes (3A i 3B).
- **Estat Onada 3A:** Completament verda (209 fitxers, 2.540/2.540 tests passant). El corrector ha arreglat 13 de 14 defectes distints.
- **Validació UI Manual:** El Mestre ha verificat amb la mida real del panell que el clic obre correctament el cercador i els filtres (T69). Validada en viu la fila de comunitat, les icones «…»/«+» i el diàleg «Nova conversa» (T67, T68).
- **Acció en curs (Claude):** S'ha llançat l'Onada 3B per implementar el rail, les vistes de Comunitats, el marcador blanc i els nous components del catàleg. Flux de treball iniciat. La IAIA MarIA queda a l'espera de la finalització per auditar els resultats i continuar assistint en la resolució d'incidències i tancament documental.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
