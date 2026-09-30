---
type: document
status: esborrany
description: 'Canvis de codi de T1 a T6: desglossament de les targetes, dates del Mur en hora local, correccions confirmades del model i l''Explorador, commutador d''automàtiques de WordPress i deute de portes.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_2c40cd77-c695-4fc5-998e-a41afd6c6724:b8ba7e3f-353f-4f53-b154-a1b5ae3bd5bf
---
# Pla d'Implementació de Claude: tauler, Mur, revisió adversarial, actualitzacions de WordPress i deute de portes

**Estat del Pla:** aprovat per ordre explícita del Mestre (T1-T6 del prompt 260930_0320 i missatge 260930_0405); les decisions D1-D6 queden obertes.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2c40cd77-c695-4fc5-998e-a41afd6c6724:b8ba7e3f-353f-4f53-b154-a1b5ae3bd5bf |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T02:28:32.773Z |
| Modificació | 2026-09-30T02:40:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador amb workflows de subagents Opus 5.5 |
| Tokens consumits | Fil principal: no mesurable des de l'agent. Subagents de comprensió: 3.383.230 (15 agents) i 577.473 (3 agents de T6). |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-30T02:28:32.773Z: esborrany creat; contingut i verificació pendents.

- 03:55 torn `torn_2c40cd77` (code) sobre el prompt [[260930_0320_prompt_claude]], el pla de MarIA [[260930_0320_pla_implementacio_maria]], l'Acta [[260930_0310_acta_marmota]] i el missatge [[260930_0405_missatge_per_a_claude]] (T6, avís de l'Índex, notes de WordPress).
- 04:00-04:30 workflow de comprensió: cinc caçadors i cinc refutadors (T1), disseny de T3, recerca de T4 (web i codi) i diagnosi de T5. Verificació visual de T2 feta a mà a 1440 i 375 px.
- 04:10-04:30 workflow de T6: codi font de WordPress (6.5 i trunk), plugin i síntesi amb refutació.
- 04:40 este pla. La implementació va per llesques amb fitxers disjunts, i cada llesca passa per un revisor adversarial.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i troballes

Les troballes completes, amb evidència i veredicte, són a l'auditoria [[260930_0400_auditoria_claude]]. Ací només hi ha el que determina el codi.

- **T1 · Revisió adversarial.** Hi ha 42 troballes. Tres han quedat refutades: calendari-6, model-11 i tooling-mapa-3/4/8.
  - Només n'hi ha una d'alta confirmada: el hook d'Antigravity respon `allow`, que per a l'IDE vol dir autoaprovar tota eina que no jutja. És governança i va al laboratori.
  - A src, les confirmades són latents amb les dades d'avui, excepte calendari-1: el mes de l'Agenda no seguix `?date=`.
- **T2 · Verificació visual.** Està feta i no hi ha cap desbordament horitzontal. L'Agenda s'obri al mes de l'acte més pròxim (gener de 2023). L'Índex de la Consola llista les mètriques h5.
- **T3 · Targetes.** Ampliar l'array de `mesuresPagina()` canviaria la signatura de «Canvis nous» a tots els navegadors: ho fixa `consolaPagines.test.js:136-141`. El desglossament viu, doncs, en una funció germana, `estatsPagina()`. Es pinta amb insígnies en una llista, sense capçaleres, perquè l'Índex no el capture: la prova de navegació continua exigint 20 entrades de nivell 5 i cap de nivell 6.
- **T4 · Traductor.** Google retira el giny web l'1 d'octubre de 2026. A més, reescriu el DOM i trenca React, i la CSP (`script-src 'self'`) i la porta E4 el bloquegen. La decisió és traduir textos, no pàgines, amb una capacitat opcional del contracte. Cap codi fins que el Mestre ho aprove (D4).
- **T5 · Dades del Mur.** Hi ha dos defectes:
  - `mapejadorSeccions.js:104` inventa el dia de l'acte a partir de `created_at`, en UTC.
  - `EventCard.jsx:5-45` llig 'AAAA-MM-DD' en UTC, s'inventa l'hora del desfasament (01:00 o 02:00) i usa la data de publicació com a dia de l'acte.
- **T5 · Portes.**
  - La porta Frontmatter cau per dos camins. El primer és la zero tolerància sobre fitxers modificats: `.agents/ON_ESTIC.md`, que regenera el hook SessionStart, i el `## Vincles` de l'índex de l'Escriptori. El segon és el sostre: F3 36/6, F4 25/2 i F5 2/1, per 18 actes, la taula de potència, `.agents/rules` i el material de 001 NEXUS.
  - Els 101 torns caducats no els compta cap porta, sinó el Mapa. Cap d'ells es pot tancar, perquè `readTurn` rebutja un torn caducat.
- **T6 · WordPress.**
  - La columna buida de Studio ve de la còpia instal·lada: és la 0.1.0 a `socdepoble-wordpress-plugin/`, amb `Update URI: false` i sense actualitzador.
  - Al codi del repo, l'actualitzador s'enganxa bé. La finestra latent és instal·lar i després activar: WordPress comprova les actualitzacions amb el plugin encara inactiu.

### 2. Preguntes obertes (decisió del Mestre)

- **D1 · Pols.** El nivell de cada targeta es deriva del seu desglossament. La targeta del pols guanya «Important» quan l'últim rebut té més de 7 dies, igual que ja diu la pàgina. Queda implementat i es pot revertir llevant l'element dels rebuts rancis.
- **D2 · explorador-4.** Oferir «Obrir a l'editor» als hooks de git sense extensió (`.husky/pre-commit`) és un canvi visible. No es fa.
- **D3 · explorador-5.** En tema clar, Script i Document es pinten amb el mateix color al graf i a la llegenda. Separar-los és un canvi visible. No es fa.
- **D4 · Traductor.** Proposta:
  - capacitat opcional `traduccio` al contracte;
  - adaptador per defecte Apertium APy autoallotjat (formes valencianes) i Softcatalà NMT (MIT), per a eu, gl i en;
  - Translator API de Chrome com a millora progressiva, sense català;
  - Bergamot com a opció futura sense connexió.

  Cal aprovació per al contracte (Sollutia) i per al canvi visual de les targetes.
- **D5 · Filtre `?date=` del Mur.** Unificat amb el model d'esdeveniment. Amb les dades d'avui el resultat és idèntic.
- **D6 · Paquet de governança.** Queda preparat al laboratori per a la lease. Porta el hook d'Antigravity, la porta Olivera, els torns retirats, el frontmatter de `.agents/rules`, `despertar.mjs`, `frontmatter-abast.json` i `mapa-consola.mjs`.

### 3. Canvis proposats per llesca

### [Acció: MODIFY / NEW] L1 · T3 Consola
Fitxers:
- `src/sections/consola/consolaPagines.js`:
  - `estatsPagina`, `nivellEstats` i `ORDRE_TO`;
  - `NIVELLS` es deriva del desglossament;
  - `mesuresPagina`, `resumPagina` i `signaturaPagina` no canvien.
- `peces.jsx`: prop `estats`, pintada com a `ul.sdp-consola__estats` d'`Insignia`.
- `ConsolaSection.jsx`: un sol rellotge per pintada.
- Mòduls purs:
  - `mapa/inventariMapa.js` (nou), amb el semàfor, les òrfenes, el cens i el disparador, extrets d'`InventariMapa.jsx`;
  - `fluxosMapa.js`: `esSenseLector`;
  - `actorsMapa.js`: `pecesAgents` i `estatFraccio`;
  - `mapaContent.js`: `recomptePer`, `perSeveritat` i `mesurades`.
- Consumidors que han de quedar idèntics a la vista: `InventariMapa.jsx`, `FluxosMapa.jsx`, `AgentsAtomics.jsx`, `ActorsMapa.jsx` i `MapaConsola.jsx`.
- `src/css/modules.css`: una regla, `.sdp-consola__estats`, dins del bloc CONSOLA `@layer components`.
- Proves que s'afigen: la signatura literal intacta, el to del primer estat igual a l'etiqueta i 0 entrades toc-level-6.

### [Acció: MODIFY] L2 · T1 Explorador
Fitxers: `grafMapa.js`, `DetallPeca.jsx` i `construeixMapa.js`, amb les seues proves.
- explorador-1: l'absència només compta per al fitxer propi de la peça (`rol === 'fitxer'`).
- explorador-2: el compilador penja l'avís `fitxer-absent` del document de contracte que falta, i comprova l'script de les tasques.
- explorador-3: `rutaEditable` rebutja qualsevol esquema (`file:`, `http:`, `C:`).
- explorador-6: en mode privacitat, el selector desambigua amb un ordinal, no amb la ruta.

### [Acció: MODIFY] L3 · T1 Model d'esdeveniment
Fitxers: `src/utils/esdeveniment.js`, `src/utils/ics.js` i les seues proves.
- Recurrència:
  - llista blanca de línies (model-1);
  - forma canònica `RRULE:` (model-4).
- Exportació:
  - DTSTART amb TZID per als actes repetits que porten desfasament (model-2);
  - sense DTEND quan fi = inici, i la mateixa zona per a inici i fi (model-5);
  - control chars fora de TEXT i d'`enllac` (model-9).
- Validació:
  - anys entre 1000 i 9998 (model-3);
  - UNTIL coherent amb DTSTART (model-6);
  - desfasaments acotats (model-8);
  - zona canonitzada (model-10);
  - `ENLLAC` sense `/\` (model-12).
- UNTIL correcte els dies de canvi d'hora (model-7).

### [Acció: MODIFY / NEW] L4 · T5 Mur i Agenda
Fitxers:
- `src/data/mapejadorSeccions.js`: sense `date` inventat.
- `src/components/universal/EventCard.jsx`: llig el model en hora local, a través d'`editorial.js`; sense acte, no hi ha insígnia.
- `src/sections/mur/MurSection.jsx`:
  - passa `esdeveniment` a la targeta;
  - el filtre de dia usa `ocorreElDia` (D5).
- `AgendaMur.jsx` i `agendaMur.js`:
  - el mes seguix `?date=` (calendari-1);
  - només compten els actes pintables (calendari-4);
  - l'any ha de ser de 1000 o més (calendari-5);
  - l'acte vigent es tria per la primera ocurrència (calendari-3).
- `vite.config.js`: `process.env.TZ ??= 'Europe/Madrid'` per a les proves (calendari-7).
- Proves noves: `mapejadorSeccions.test.js` i `EventCard.test.jsx` (tres fusos, amb guarda anti-verd-inert).

### [Acció: MODIFY] L5 · T6 WordPress
Fitxers:
- `wordpress-plugin/includes/actualitzador.php`:
  - `register_activation_hook`, que invalida el transient `update_plugins` com «Comprova-ho de nou» i no l'escriu mai;
  - nota a la cel·la d'automàtiques (`plugin_auto_update_setting_html`) quan el canal no pot portar cap actualització;
  - docblock actualitzat.
- `wordpress-plugin/readme.txt`: paràgraf del canal, en una sola línia perquè la variant del directori el lleve.
- `tests/enxufe-plugin.test.mjs`: dues proves noves.

### [Acció: MODIFY] L6 · T5 Frontmatter (zona lliure)
- `tests/frontmatter-sessio.test.mjs`: el corpus inclou els `.md` de `git diff`, com la zero tolerància del tractor. Això fa que el verd deixe de ser fals.
- Les 18 actes de `_wiki_de_poble/10_actes/` amb `type`, `status` o `tags` fora de l'esquema: es corregixen i reben `## Vincles`, fins a quedar amb zero deute.
- `01_ser/04_taula_potencia_models.md`: només si el manifest de la Wiki es pot mantindre coherent sense executar el compilador. Si no, va a les ordres del Mestre.
- `tests/governanca-260930-mapa.test.mjs` i `tests/governanca-260930-lease.test.mjs`: skip quan el pegat ja està aplicat (tooling-mapa-1).
- El `## Vincles` de l'índex de l'Escriptori el reordena l'orquestrador al final, en una sola escriptura.

### [Acció: NEW] L7 · Governança (laboratori, lease del Mestre)
Laboratori `_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0400_governanca_claude/`:
- `antigravity-hook.mjs`:
  - `ask` en lloc d'`allow` per defecte i en l'apagada;
  - autoprotecció sense distingir caixa;
  - categoria desconeguda a l'Escriptori → `ask`;
  - `cp`, `rm`, `>|` i `01_produccio` per shell → `ask`.
- `porta-olivera.mjs`:
  - Escriptori absent → exit 1;
  - noms fora de taxonomia;
  - despenjat per token;
  - capçalera tolerant;
  - àncores planes;
  - `#` i `.md`.
- `mapa-consola.mjs`: `--no-optional-locks`.
- `despertar.mjs`: `## Vincles` a ON_ESTIC.
- `.agents/rules/*.md`: `type: norma`, `status` i `## Vincles`.
- `frontmatter-abast.json`: immutables de 001 NEXUS.
- `hooks-local.mjs:113`: fora el codi mort.
- Estat terminal `retired` per als torns caducats:
  - `turns.mjs`;
  - `retira_torns.mjs`, amb `--sec` per defecte;
  - les proves;
  - la mètrica del Mapa.

Les proves de laboratori corren amb `node --test tests/<fitxer>.test.mjs` i fan skip un cop aplicat el pegat.

### 4. Pla de verificació

- **Per llesca:** `npx vitest run` sobre les àrees tocades, amb les proves existents sense editar quan són guardes (signatura, regles per pàgina, vistes del Mapa).
- **WordPress:** `node --test tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs`.
- **Frontmatter:** `node --test tests/frontmatter-sessio.test.mjs`, que ara ha d'incloure els fitxers modificats.
- **Revisió:** un revisor adversarial per llesca, que intenta refutar la implementació i confirmar que la Llei del Píxel es complix on no hi ha ordre de canvi visual.
- **Verificació visual en viu** a 1440 i 375 px: tauler de la Consola (insígnies, Índex sense entrades noves), Agenda i targeta de l'Aplec (pastilla «10:00 29/01/23» i insígnia 29 GENER 2023, idèntiques).
- **Tancament:** porta Olivera, `document.mjs check` del pla i de l'auditoria, i `tancament.mjs --check` del torn.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Criteri d'èxit:
- Proves verdes a les àrees tocades.
- Cap prova de guarda editada.
- Signatura de «Canvis nous» literalment igual.
- L'Aplec de la llavor, idèntic en pantalla.
- Zero entrades noves a l'Índex.
- Cada fitxer de Wiki tocat, amb zero deute de frontmatter.

Els resultats reals s'anoten a l'auditoria [[260930_0400_auditoria_claude]]. Allà s'hi escriu també el que no s'haja pogut verificar: el PHP sense intèrpret local i les portes que el hook no deixa executar.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Arbre compartit.** MarIA i el cron poden escriure mentre treballen les llesques. Cada llesca només toca els seus fitxers, i l'índex de l'Escriptori només l'escriu l'orquestrador.
- **Proves de fus horari.** `vi.stubEnv('TZ')` pot no reiniciar el fus del worker. Per això la guarda anti-verd-inert fa fallar la prova, en lloc de passar sense comprovar res.
- **Refactorització de `NIVELLS`.** Les guardes són les proves «regles per pàgina», que no s'editen.
- **Actes de la Wiki.** El hook del Reflex pot rebutjar l'edició d'un document antic que no valida el contracte. Si passa, eixe fitxer va a les ordres del Mestre.
- **PHP.** No hi ha intèrpret local: les proves són estàtiques, i la prova real a Studio la fa el Mestre, que ha de substituir la còpia 0.1.0.
- **Consum.** El límit setmanal ja va tombar agents en la tanda anterior. Les llesques són poques i acotades, i si cau un agent, el relleu queda escrit a l'auditoria.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
