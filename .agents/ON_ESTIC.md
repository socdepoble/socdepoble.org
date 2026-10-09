---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-09T10:29:47.906Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 63a00cde

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 261008_1919 i `_wiki_de_poble/04_escriptori/00_index_escriptori.md` s'ha tocat 17 h després. Hi ha faena feta que ningú ha anotat a `.agents/ESTAT.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-08 19:19 · MarIA · Tancament de l'Onada 4 i esborrats

L'Onada 4 ha finalitzat amb èxit. Claude ha completat els 5 fronts d'implementació:
- Editor de Perfil: retallador calc, 10MB, botons separats i Vistes (A4/Targeta) en menú lateral.
- Notes Personals: publicacions de l'entitat, botó unificat de desa/publica al Mur.
- Organitzacions: suport de membres (alta, rols, eixir) i eliminada la mare. Selector de "El compte".
- Xat (Auditoria adversarial): defectes de resiliència corregits, missatge d'error de privacitat implementat (SDP-XAT-016), protecció de metadades.
- App Stores: preparació de la fitxa sense codi natiu per ara. 

Les migracions SQL (`2610081400`, `2610081401`, `2610081402`, `2610081543`) han estat categoritzades a `node-suite-manifest.json`. L'empremta de drets d'autor s'ha aprovat a la frontissa. Els codis morts relacionats amb `DialegCapcaleraAvatar` han estat eliminats completament i els tests migrats cap a `DetallAjust`.
El paquet de tests passa la política (14.599 tests en verd). Queda el tancament final i preparar Acta Marmota per al Mestre.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
