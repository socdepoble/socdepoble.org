---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-01T22:25:05.458Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 120bc1328

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/04_escriptori/261001_2345_auditoria_claude.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-01 14:10 · MarIA · Auditoria F01-F07 i Calendari verd

- **Objectiu:** Executar la verda total i procedir amb la reparació de contractes i registre d'execucions de la Consola (Auditoria 261001_1332_auditoria_codex.md).
- **Fet:** S'ha assegurat que Vite no servix fitxers interns a connexions HTTP (F02). Reparats els contractes DTO a `consolaContent.js` (F01) per admetre tipus `ajust` sense trencar el panell, i preservada l'`estrategia_consum` (F03). Implementat el reconeixement de `contracte.escriu` a `construeixMapa.js` evitant les 0 cadenes del mapa (F04). Adaptat el parser JSONL de la consola per exposar l'estat dels fitxers i línies corrompudes sense ocultar dades vàlides (F06). Unificats els deutes dels hooks de Git i deduplicats els candats a `actorsMapa.js` (F07).
- **Verda Total:** Resoles les 18 fallades (F13) al `CalendariSection` provocades per canvis semàntics recents ('targeta' -> 'publicació'). Executat Vitest individual per `CalendariSection.test.jsx` (19/19 verdes) i `CalendariSection.vistes.test.jsx` (18/18 verdes).
- **Pendents:** El registre exhaustiu d'execucions del cron (F05) requereix aclarir si s'incorporarà directament al `diari_sessio.jsonl` amb format de rebut per cada pas; queda apuntat. També pendents el sistema de Comunicació Institucional i dossiers (F08, F12).
- **Tancament:** S'ha donat compliment a l'ordre de reparar contractes F01-F07 i estabilitzar el Calendari; Escriptori mantingut lliure.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
