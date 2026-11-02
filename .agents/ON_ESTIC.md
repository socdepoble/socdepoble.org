---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-11-02T07:06:55.192Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** e1b7210b0

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 261102_0806 i `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` s'ha tocat 0 min després. Hi ha faena feta que ningú ha anotat a `.agents/ESTAT.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-11-02T08:06:00+01:00 · Claude · Marató nocturna 261101_2143: B0-B10 en Gauntlet, quatre commits locals i delegació autònoma fins a l'alba

- **Torn i ordre:** `torn_3d9af83b-3a4a-4735-a6ec-925b1d9c633e` (code). Ordres del Mestre al xat: B0-B7 del [prompt 2059](../_wiki_de_poble/04_escriptori/261101_2059_prompt_marato_nocturna_extirpacio_total_deute_llibre_mestre.md) (21:41) i, abans de dormir, B8-B10 amb delegació autònoma (`requires_human_decision: false`). Informe: [261101_2143_auditoria_claude](../_wiki_de_poble/04_escriptori/261101_2143_auditoria_claude.md).
- **Commits locals (sense push):** `921c332ac` (Onada 1: B0, B1 i les bases de B2, B3 i B6), `333af8c2c` (Onada 2: B2-B7, que segella B0-B7), `e1b7210b0` (Onada 3: B8, B9 i B10, més les correccions dels dos Gauntlets transversals) i el commit documental del tancament.
- **Fet:**
  - **B0:** PC155-01..03 i T11-01..05.
  - **B1:** Olivera, hook i portes.
  - **B2:** E2EE amb el kid monòton i F2a, darrere de la bandera apagada.
  - **B3:** Arrere natiu, sis mòduls de literals i verificador de migracions.
  - **B4:** vCard i transferència.
  - **B5:** inbox i cua signada.
  - **B6:** benzina, facetes, EspaiCerca i germanes.
  - **B7:** PS-01..PS-11 i el cartell A4.
  - **B8:** avisos del Xat apagats (funció `notifica-xat`, migració 2611020417, port de 37 capacitats, PWA, silenci, ajustos i baixa en eixir).
  - **B9:** `--canal produccio` en esborrany i `/page/descarregues` directe.
  - **B10:** P1-09, P1-24, P1-29, P1-30, P2-12, P2-15 (sense rotar) i P1-71.
- **Governança (executor i CAS):**
  - Reflex `bf4dcc4c`, `a2b14eb0`, `5aeb79f4` i `9a7dd881`.
  - La transacció de tancament (ESTAT i LEDGER).
  - Frontissa 16/16.
- **Proves:**
  - **Vitest:** 30.610 passades.
  - **Node:** 2.015 passades.
  - **ESLint i `design_guard`:** 0/0.
  - **Roges de còpia:** són les de sempre (sense `.git` ni fitxers d'entorn).
  - **`run-portes` encara roig per:** Cens C4 (l'informe de Codex), Reflex (arbre brut) i Llaurador (fins que es regenere ON_ESTIC).
- **Per al Mestre:**
  - Aplicar les migracions (2611012257, 2611020106, 2611020417 i les anteriors) en l'ordre de `supabase/ordre_desplegament.json`.
  - Tornar a construir i desplegar el web.
  - Tornar a segellar les cinc skills de `skills-per-segellar/`.
  - Avisos: VAPID, secrets, funció i bandera.
  - Botigues: D-B9-2.
  - Arrere en un aparell.
  - Decisions D-E1-2, D-E1-4, D-2 i D-1 de L08.
  - El detall és al bloc de relleu de §0.3 del Llibre Mestre.
- **Fronteres:** cap push, cap operació remota, cap `npm install`, cap secret ni lectura de fitxers d'entorn.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.

## Vincles

- [[00_index]]
