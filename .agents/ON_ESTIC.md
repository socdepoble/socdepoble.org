---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-30T01:53:31.059Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 638a6f333

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/04_escriptori/260930_0320_pla_implementacio_maria.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-09-30 03:10 · Claude (Opus 5.5) · Tanda T1-T16: Consola, Explorador, Agenda, governança i lease

- **Torn:** `torn_d8024ad3-9c76-48e7-b402-348fbb2dedb5` (code). Pla [[260930_0040_pla_implementacio_consola]]; informe [[260930_0040_auditoria_claude]]; relleu per al compte nou a l'Acta Marmota [[260930_0310_acta_marmota]].
- **Fet a src (sense lease, 1.255 proves de vitest verdes):** T2 mètriques de les targetes en h5 i Índex fins a h6 només a la Consola; T3-T4 Explorador amb el graf al final i panell de detall Pedra Seca (Obrir a la Wiki, Obrir a l'editor en dev, Copiar la ruta); T6-T8 Agenda del Mur amb el calendari compartit, model d'esdeveniment compatible amb iCalendar i Google Calendar i exportadors purs (`aIcs`, `aGoogleCalendar`), Consola migrada al mateix organisme amb prova d'equivalència de 24 mesos; T7 píndoles uniformes i línies fines; T9 fora el scroll vertical intern de les taules; T10 Codex al compilador pur; T11 un sol camí d'entrada per pàgina; T12 mètriques de segell, frontmatter, torns, Escriptori i LEDGER, i alerta de vigilància al tauler; T15 barra lateral amb rectangles purs.
- **Fet a governança (este bloc entra amb el mateix pla de l'executor, sota la lease del Mestre):** T1 core-neteja-brossa vàlida i indexada, `contracte.llig` a quatre skills amb esquema, pany i deute resegellats, test:node amb les bateries noves; T5 porta Olivera v3 (viu per declaració a «Activitat en curs», `--arxiva --nom`, `--sec`, «0. Preflight», mode hook explícit); T10-T12 closca del Mapa amb Codex i fonts de vigilància; T13-T14 AGENTS §0.1 (Escriptori net i orquestradora resolutiva), skills d'higiene i reflex, i hook d'Antigravity en el format documentat de l'IDE amb interruptor d'apagada.
- **Mestre, després de l'executor:** enllaços `.claude/skills/core-neteja-brossa` i `core-telemetria-huma`; `node tooling/gates/tancament.mjs --close --turn-id torn_d8024ad3-9c76-48e7-b402-348fbb2dedb5`; commit revisat.
- **Pendent:** revisió adversarial de les llesques Explorador i Calendari i del paquet de governança (els correctors i revisors van caure pel límit setmanal); prova real del hook dins d'Antigravity (una línia a `.agents/runtime/antigravity-hook.log`); investigar el giny de Google Translate amb disseny Pedra Seca (endoll únic a `useAccions`) i alternatives sobiranes; desglossament d'estats a la coberta de cada targeta del tauler; Porta Frontmatter roja abans del paquet (F3, F4, F5); 101 torns caducats sense tancar; Wiki: doctrina de `04_contracte_de_dades.md` per actualitzar.
- **Responsables:** Mestre (lease, symlinks, tancament, commit); Claude (codi i proves); MarIA (Escriptori net amb la porta v3 i acreditació del hook).

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
