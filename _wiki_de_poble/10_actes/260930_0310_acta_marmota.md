---
type: acta
status: esborrany
description: 'Tancament de la tanda T1-T16: què queda fet a src, el paquet de governança pendent de la lease del Mestre i els pendents per al pròxim agent.'
tags:
  - acta
visibility: private
reflex: sdp:torn_d8024ad3-9c76-48e7-b402-348fbb2dedb5:ab26f9a7-0fda-4b2b-aad0-88a4bc285e9a
---
# Acta Marmota i Informe de Relleu: tanda T1-T16 i pas al compte nou

Este document és el relleu per a l'agent que continue el projecte des del compte nou. Es pot usar sencer com a context inicial: diu què s'ha tancat, on és cada peça i què queda obert, amb l'ordre en què convé atacar-ho.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d8024ad3-9c76-48e7-b402-348fbb2dedb5:ab26f9a7-0fda-4b2b-aad0-88a4bc285e9a |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T01:02:58.527Z |
| Modificació | 2026-09-30T01:15:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador amb workflows de subagents Opus 5.5 |
| Tokens consumits | Fil principal: no mesurable des de l'agent. Subagents (segons els informes dels workflows): 10.819.517. Diversos agents van caure pel límit setmanal del compte. |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 3ae94f7f1a78091f4938d412286cd135269e64abdfc95663f2cde52b781c0913. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-09-30T01:02:58.527Z: esborrany creat; contingut i verificació pendents.

- 00:45-01:10 nou lectors independents del codi. 01:15-02:40 implementació de src en quatre llesques amb revisió adversarial, i paquet de governança en un laboratori. El Mestre va afegir la T15 (barra lateral) en calent i va reconciliar el segell de skills (0c91c0dd).
- 02:40-03:10 el límit setmanal va tombar correctors i l'integrador; Claude va tancar a mà les dues proves que un corrector va deixar a mitges, va escriure el generador de lease i el relleu, i va passar totes les proves.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### Tancat en esta sessió (src, sense lease; vitest 1.255 proves verdes a les àrees tocades)

- **T2 · Consola com a tauler.** Les mètriques de cada targeta són `h5` centrats (`mesuresPagina` a `src/sections/consola/consolaPagines.js`; el text i la signatura de «Canvis nous» no canvien). L'Índex arriba a h6 només a la Consola (`nivellMaxIndex` de `PageFrame.jsx`, 4 per defecte a la resta de l'app).
- **T3-T4 · Explorador.** Llegenda, cerca i filtres a dalt; el graf al final. Panell `DetallPeca.jsx` Pedra Seca amb «Obrir a la Wiki», «Obrir a l'editor» (només en desenvolupament, via l'obridor de Vite) i «Copiar la ruta», avisos en text humà i relacions navegables. BrainGraph accepta selecció controlada; la Wiki no canvia.
- **T6-T8 · Calendari.** Organisme `CalendariEsdeveniments` (catàleg i espècimen inclosos) sobre la graella compartida; Agenda del Mur amb calendari i filtre `?date=`; model `src/utils/esdeveniment.js` compatible amb iCalendar i Google Calendar (uid, inici i fi exclusiva, tot el dia, zona, recurrència acotada) i exportadors purs `aIcs` i `aGoogleCalendar`, sense cap API. La Consola usa el mateix organisme després d'una prova d'equivalència de 24 mesos. T7: píndoles d'amplària uniforme i línies fines, confinades a `sdp-calendari--gran`; en mòbil les píndoles es fan punts.
- **T9 · Taules.** Fora el modificador `sdp-taula--llarga` (el límit de 70vh); una prova de capes impedix que torne el scroll vertical intern.
- **T10 · Codex (part src).** El compilador pur del Mapa ja sap pintar Codex (etiqueta DESCONEGUT, candats per acreditar); apareixerà quan entre la closca del paquet de governança. També llig el format nou de hooks d'Antigravity.
- **T11 · Navegació.** A cada pàgina s'entra per la seua targeta del tauler i se'n torna per la molla; les xifres del Mas i les peces d'Agents atòmics són dades.
- **T12 · Vigilància.** Mètriques de coherència i antiguitat del segell, frontmatter de skills, torns, Escriptori, LEDGER i relleu d'ESTAT; alerta al tauler per a `segell-trencat` i `ledger-invalid`; data de l'últim rebut i etiqueta «Important» si passa de 7 dies.
- **T15 · Barra lateral.** Entrades i botó CONTROL tornen a ser rectangles purs (`src/css/layout.css`).

### Preparat i pendent de la lease (29 fitxers en un sol pla)

Laboratori `_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude/` (pegats, fitxers nous i `lease.mjs`), verificat amb 49 proves de laboratori:
- T1 skills sanejades (`core-neteja-brossa`, `contracte.llig` amb esquema, pany i deute), índexs i `test:node`;
- T5 porta Olivera v3;
- T10-T12 closca del Mapa amb Codex i fonts de vigilància (`tooling/brain/fonts-vigilancia.mjs`);
- T13-T14 AGENTS §0.1 i mirall, skills d'higiene i reflex, hook d'Antigravity amb interruptor d'apagada;
- T16 bloc d'ESTAT i entrada signada del LEDGER.

<!-- SDP:SECTION acta.s5 -->
## Pendents

### Primer, abans de res (Mestre)

2. Després: els dos enllaços `.claude/skills/core-neteja-brossa` i `.claude/skills/core-telemetria-huma`; `node tooling/gates/tancament.mjs --close --turn-id torn_d8024ad3-9c76-48e7-b402-348fbb2dedb5` (el torn caduca el 2026-09-30 a les 22:37 UTC); commit revisat.

### Tasques per al pròxim agent

1. **Revisió adversarial pendent.** Els correctors de les llesques Explorador (B2) i Calendari (B3) i els revisors del paquet de governança van caure pel límit: cal una passada de revisió sobre `DetallPeca.jsx`, `CalendariEsdeveniments.jsx`, `AgendaMur.jsx`, `esdeveniment.js`, `ics.js` i els fitxers nous de tooling.
2. **Verificació visual** a 1440 i 375 px de l'Explorador, l'Agenda del Mur, el Calendari i l'Índex de la Consola (no s'ha pogut fer sencera abans del tancament).
3. **Directiva d'UI · targetes del tauler.** Cada targeta de la Consola ha de mostrar a la coberta el desglossament dels estats interns de la seua pàgina, amb el que falla primer (per exemple, a Inventari: semàfor roig o ambre, òrfenes, fora de cens, sense disparador útil). Es fa ampliant `mesuresPagina()`; convé separar les mètriques de coberta de la signatura de «Canvis nous», perquè no marque «Canvis nous» a tothom.
4. **Recerca · traductor.** El botó «Traduir» (`BarraBlava.jsx`) crida l'acció única `useAccions` (`src/components/PedraSeca/hooks/useAccions.js`), que ara navega a `/traduccions`. Investigar si el giny de Google Translate es pot retallar (llista tancada d'idiomes, sense bàner, menú propi Pedra Seca) i els seus riscos (servei tancat a llocs nous des de 2019, reescriu el DOM i xoca amb React, envia contingut a Google i necessita consentiment), i comparar-lo amb alternatives sobiranes (traducció al dispositiu del navegador com a millora progressiva, Bergamot en WebAssembly, LibreTranslate propi). Enxufar-lo com a adaptador a `useAccions`.
5. **Acreditar el hook d'Antigravity:** que MarIA escriga un prompt de prova amb l'Escriptori brut i que aparega una línia a `.agents/runtime/antigravity-hook.log`. Si no, el consumidor continua sense acreditar.
6. **Deute de portes previ:** Porta Frontmatter ja roja abans del paquet (F3, F4, F5: `.agents/rules`, `04_taula_potencia_models`, tags del pla 2346); 101 torns caducats sense tancar; porta-olivera-v2 i el generador del laboratori 260927_1310 no reconeixen «0. Preflight».
7. **Doctrina de la Wiki:** `02_saber/03_consola_termodinamica/04_contracte_de_dades.md` ha de dir clau plana `contracte.llig` i les fonts noves del Mapa (cal regenerar el manifest de la Wiki).
8. **Dades del Mur:** `mapejadorSeccions.js` inventa la data d'un acte a partir de `created_at`, i `EventCard.jsx` llig les dates en UTC.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
