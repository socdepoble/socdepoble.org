---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-01T02:05:15.548Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 0f909050d

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/04_escriptori/261001_1000_prompt_claude.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-01 02:45 · Claude (Opus 5.5) / MarIA · Calendari i Boina Taronja completats

- **Objectiu:** Integració del `CalendariMur` i correcció del routing i visibilitat de targetes segons mes i hora.
- **Fet (Claude):** T1-T5 completades i passades per revisió adversarial amb 14 defectes corregits. `CalendariMur.jsx`, rutes `/calendari?mes=AAAA-MM`, pastilles enllacen correctament. Dates coherents a Wiki, Disseny i Mercat. Proves superades (4122/4124, només fallen 2 heretades de la barra mòbil). 
- **Telemetria (Consum Termodinàmic):** Cost del torn: $333.09 USD (714m API, 104m Wall).
- **Tancament (MarIA):** Es neteja l'Escriptori. L'Acta Marmota `261001_0245_acta_marmota_calendari_i_boina.md` es mou a `10_actes/`. S'esborren els fitxers obsolets `AgendaMur.jsx` i `AgendaSection.jsx`.
- **Decisions pendents per al pròxim torn:** Ratificar la barra mòbil ("Telefonades"), ajustar variables CSS òrfenes a la Consola.
- S'ha executat el commit final del torn. Sessió tancada. Preparats per al pròxim assalt de l'enxufabilitat de Google Calendar.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
