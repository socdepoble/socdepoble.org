---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-26T21:36:33.473Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 51c75c2a

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/04_escriptori/260926_2330_prompt_claude_xat.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-09-26 22:48 · Codex · Auditoria Extrema i directives MarIA

- Torn `torn_1a43a34c-9f10-4d1d-8beb-10fc33f6759a`; execució autoritzada explícitament pel Mestre després de l'auditoria inicial. Auditoria: `_wiki_de_poble/04_escriptori/260926_2132_auditoria_codex.md`; pla viu 1950 actualitzat.
- Implementat: aïllament JWT/refresh/PKCE/SDK per endpoint i tenant, injecció d'adaptador públic validat abans d'arrencar, Notes persistents en IndexedDB, rail i barres coherents, Aa mòbil, copyright/Creative Commons amb consentiment CC0 explícit, vista A4 i portada locals, ajuda ActorsMapa i navegació taronja.
- Verificació: Vitest 997/1.011, les 14 fallades inicials de Consola/Wiki; Node 51/51; lint, builds web/WP, enxufe/adaptadors/frontera/RLS correctes. Navegador seed: persistència després de recàrrega, rail i mòbil. Orfandat reparada: 0/0. Segell previ reconciliat després de llegir core-context-panic i comparar els hashes.
- Pendents: migració `260926_2232_copyright_editor.sql` preparada però no aplicada; PostgreSQL/staging absents. Riscos A04–A09 (exportació SQL, purga Storage, revocació/consentiment) i fases F2–F4 descrits a l'auditoria. No certificar servidor extern ni compliment legal. Tancament global s'executa a continuació i es registra a l'auditoria.
- Sense commit, push ni desplegament. Treball previ d'Opus conservat. Model IA: GPT-6, variant no exposada. Tokens entrada/eixida no disponibles; no s'inventen. Complexitat i fricció altes; sense delegació.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
