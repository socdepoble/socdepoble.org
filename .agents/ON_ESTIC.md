---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-06T22:26:50.385Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 57f3288a

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/10_actes/261007_0025_acta_marmota.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-06 23:45 · Claude · TPV Universal

Relleu [[261006_2250_auditoria_claude]]. Fet: peça UniversalTPV (Pedra Seca), entrada /app/bar/tpv, ruta Unica i pont useSessioApp de la plataforma, sessió a tot el Bar amb mode de proves i venda offline amb sessió desada, model producteUniversal (canals i 14 al·lèrgens), icones d'al·lèrgens del Mestre, contracte sdp.vendes.v1. Res commitejat. Decisions pendents: ADR offline del service worker, auth.js sense commit (auth.persistencia.test.js, altre front), cicle d'imports de src/data, endollar la Nevera. Suite sencera de src: 3 rojos aliens al TPV. Següent: commit atòmic del TPV (sense auth.js, onboarding, identitat de la barra ni les migracions 2610061448/1450) i la Gestoria.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
