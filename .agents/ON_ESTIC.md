---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-23T23:27:51.066Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** a555b1ed

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/04_escriptori/00_index_escriptori.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 260924 · Codex · Auditoria estructural i enxufabilitat

- Torn `torn_c1630ab1-a567-4435-b42d-4ebc4db3a853`, abast documents. Entrega [[260924_0055_auditoria_codex]] i pla [[260924_0045_pla_implementacio_arquitectura_codex]], rèplica al pla compartit de Claude.
- Troballes: payload antic Mur, Multimèdia sense generació, cursa de rol, Frontissa fora de catàleg/origen i sense DTO, càrrega completa Notes i paginació inconsistent, lectures duplicades, retenció de writes/cua host. Sense bypass RLS acreditat.
- Verificació: 82/82 Vitest; 7/7 sondes forenses; 9 escenaris proposta Frontissa; Node 16/25 amb 9 fallades preexistents de catàleg skills. Enxufe/adaptadors/RLS estàtics verds; orfandat 53 enllaços trencats i 5 orfes.
- Model B mantingut: Supabase SdP autoritatiu; l’adaptador es tria internament, no s’injecta des del host. Domini/contracte/auth Sollutia pendents d’evidència real.
- Cap codi de producte modificat. Implementació pendent de consens i aprovació explícita segons prompt. Auditoria i pla nous validats. Tancament executat valid=false/state=planned: segell, skills, Wiki, SCC i metadades heretades del pla compartit. Relleu al LEDGER afegit. Claude 0055 llegida i replicada; consens pendent. Acta Marmota global pendent al final de conversa.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
