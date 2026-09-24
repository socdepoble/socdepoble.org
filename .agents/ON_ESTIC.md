---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-24T16:47:18.296Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 57ec5684

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 260924_1840 · Claude / Fable · UI unificada, cens de brain, skills i plantilla ISO

- Torn `torn_44b41021-191b-44c9-be4d-e67fc8899587` (code). Entrega [[260924_1810_auditoria_claude]] i esborrany [[260924_1815_skill_plantilla_literal]], `document.mjs check` → valid: true.
- Fet: pla 1710 §3.4 sencer (graella unificada 800/750/700 sense degradats ni fantasmes, roda dentada permanent amb configuració d'amplàries, Wiki i Notes amb actiu inicial, Disseny amb ordenar i sense CREAR, llavor sense H3 i textos compartits editor/targeta, EDITAR per a Forasters, barra de classificació i llicència). 35 proves verdes, lint net, design guard passa, verificat a 1440×900.
- Fet: cens de `tooling/brain/` (16 vius, 14 morts, 3 en decisió) amb `tests/tractor-orfes-brain.test.mjs`; eines de lectura per a agents engabiats a `tests/` (inventari, cerca, lint, plantilla viva).
- Trobat: catàleg de skills bloquejat per `core-taxonomia-estricta` (status esborrany, sense triggers); prompt 1745 i pla 1710 amb rebut fals i fora de plantilla; 19 contradiccions confirmades a les skills i 9 al govern.
- Pendent (Mestre): §7 de l'auditoria (8 decisions); `git rm` dels morts; instal·lar la porta de plantilla; resegellar.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
