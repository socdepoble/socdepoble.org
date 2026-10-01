---
type: informe
status: actiu
description: 'Revisió adversarial del prompt 1140: error del calendari, avatar i pastilla de Pobles, avatar del Mestre al Mercat i pastilla amb hora, amb evidència al navegador i proves.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_abb973ce-0976-4614-9b4d-e06dbc07dd43:6ab447f2-c4ff-4fa7-abed-890b868a715b
---
# Auditoria Claude: regressions de la UI (calendari, Pobles, Mercat, pastilla legal)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_abb973ce-0976-4614-9b4d-e06dbc07dd43:6ab447f2-c4ff-4fa7-abed-890b868a715b |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T10:01:44.408Z |
| Modificació | 2026-10-01T13:15:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) |
| Tokens consumits | no mesurat: l'entorn no exposa el recompte a l'agent |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-01T10:01:44.408Z: esborrany creat; contingut i verificació pendents.

2026-10-01 (matí): T1–T4 del prompt [[261001_1140_prompt_claude]] executats contra el Pla [[261001_1140_pla_implementacio_claude]]; ordre addicional del Mestre: botó de pantalla completa al calendari; decisions D1–D9 presentades.

2026-10-01 (migdia): el Mestre ratifica D1–D9, confirma que l'alerta de T1 la va vore al plugin de WordPress i autoritza obrir la frontissa de `pageContent.js` per posar l'hora real de publicació.

2026-10-01T13:15:00.000Z: verificació final al navegador (escriptori, mòbil 375 i fosc) i a les suites; informe complet.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### F1 · T1 · L'alerta del calendari venia de codi compilat ranci

- **Causa.** El text de l'alerta només existix en paquets compilats abans de la integració de `CalendariSection`. A `src/` cap importador munta `AgendaSection.jsx` ni `AgendaMur.jsx` (prova de taxonomia de `tests/lint_calendari.test.mjs`, verda).
- **Corregit a la SPA.** Les ocurrències d'un acte recurrent compartien la clau de React. Ara la clau inclou l'instant d'inici: `agenda-${id}@${inici en ms}` (`src/sections/calendari/calendariGlobal.js:163`). La bateria `CalendariSection.robustesa.test.jsx` (188 casos: dades brossa, recurrències, vistes i URL) passa sense cap error capturat.
- **Paquet de WordPress.** `wordpress-plugin/dist` s'ha regenerat a les 12:47:04Z i ja porta el codi nou: la pantalla completa i les hores de `pageContent.js` hi són, i l'alerta vella no. Però `sdp-release.json` diu `origen: http://localhost:54321`, `mode: seed` i `desenvolupament: true`. Serveix per a WordPress Studio en local, però no per a un lloc real.
- **Còpies ràncies que encara porten l'alerta.** `release/socdepoble-enxufe/dist/soc-de-poble.standalone.js` i `dist/assets/AgendaSection-CnMUbGDM.js`. Cap script de `tooling/` ni de `package.json` nomena `release/socdepoble-enxufe`: no sé qui la genera.

### F2 · T2 · Pobles: avatar i pastilla

La targeta del poble rep la data per la regla única de Pedra Seca (`dataDElement(town)`, `src/sections/pobles/PoblesSection.jsx:84`). Hi tornen l'avatar i la pastilla sencera. `PoblesSection.test.jsx` està verd.

### F3 · T3 · El Mestre al Mercat i a la boina taronja

Els anuncis del Mestre porten la seua autoria (`autoriaSeed` a `src/data/identitatsSeed.js`, `marketSeed.js`, `marketContent.js`). La sessió sense avatar propi cau en el de la persona pilot (`src/data/localPerfils.js:74`), i la boina en mostra el nom i la imatge. `MercatSection.autoria.test.jsx` i `identitatsSeed.autoria.test.js` estan verds. També està verificat al navegador.

### F4 · T4 · Pastilla Data+Hora al Mur i hora real de les pàgines

- La regla que amagava l'hora d'un instant a mitjanit UTC (D5 d'`editorial.js`) ja no hi és: un instant pinta sempre la seua hora local.
- `src/sections/text/pageContent.js` porta a la capçalera la font de cada hora (reflog de git, missatge del commit, LEDGER o acta). Ara té hora quatre pàgines:
  - `notes`: 07:55:36, naixement de l'entrada a PAGE_COPY. El Mestre ha de triar el criteri, perquè aquell matí hi ha dos commits anteriors que publiquen la targeta.
  - `versions`: 06:53:13, confiança mitjana.
  - `wikidepoble`: 13:37:58, amb LEDGER 260924_1410.
  - `fedivers`: 11:38:55, confiança mitjana.
- **Risc visible.** Set pàgines de PAGE_COPY i `legal` no tenen evidència i conserven la mitjanit UTC: `projecte`, `constitucio`, `disseny`, `anima`, `roadmap`, `notes_shared` i `consola`. En mode remot, la pastilla d'aquestes pàgines pintarà «02:00» fins que el Mestre en diga l'hora. No s'ha inventat cap hora.
- **Frontissa.** `.agents/contingut_estructural.json` registra l'aprovació del Mestre amb data 2026-10-01 per a `notes`, `versions`, `wikidepoble`, `fedivers`, `projecte` i `anima`.
- **Mode seed.** El Mur i el Calendari pinten les dates de prova de `src/sections/mur/datesDeProvaMur.js`, no les de `pageContent.js`. Per això les hores reals es verifiquen per proves (`editorial.test.js`, `content.datesDeProva.test.js`) i no a ull al navegador.

### F5 · Pantalla completa del calendari (ordre addicional, D1–D9 ratificades)

- **Peces.**
  - `Dialeg` admet `mida="completa"` i `onObert`.
  - Noves: `PantallaCompleta.jsx` (franja amb «Eixir» i visor) i el botó `BotoPantallaCompleta` (icona Maximize, `aria-haspopup="dialog"`).
  - Nou hook `usePantallaCompleta` (estat efímer i retorn del focus per id dins del `getRootNode()`).
  - Ranura `accions` a `NavegacioPeriode`, `CalendariMes`, `CalendariEsdeveniments` i `CalendariMur`.
- **Estat.** Viu a `CalendariSection` (`usePantallaCompleta`, `CalendariSection.jsx:417`), per damunt de la càrrega. Entrar o eixir no torna a demanar dades.
- **Botons.** Al calendari per defecte el botó és secundari i tanca la fila «‹ Hui ›» (`:252`). A les vistes noves és fantasma, a la ranura de `NavegacioPeriode` (`:359`). Dins del diàleg el botó no hi és: la franja ja porta «Eixir».
- **Pedra Seca.** Tokens semàntics, cap `style=`, cap `:has()`, «Eixir» de 44 px (`--sdp-touch`) i només fa scroll el visor. Les regles són a `components.css`, `layout.css` (Frontera C2) i `modules.css`. Hi ha espècimen al catàleg de Disseny (`EspecimenPantallaCompleta.jsx`).
- **Desviació documentada.** L'avís d'error de dades (`avisError`) també entra dins de la pantalla completa: si falla la càrrega, el missatge continua visible.
- **D1–D9 aplicades:**
  - D1: botó també a `/calendari` sense `?vista=`.
  - D2: entre el títol i el selector.
  - D3: entra tot el bloc, amb avisos i targetes.
  - D4: en WordPress ocupa la caixa C2.
  - D5: sense Fullscreen API.
  - D6: estat efímer, fora de la URL.
  - D7: els toasts queden per davall.
  - D8: la franja fixa només porta «Eixir».
  - D9: «Pantalla completa» i «Eixir», amb les icones Maximize i Minimize.

### F6 · Roges alienes trobades en la passada final (no són d'aquest torn)

- **`src/config/i18n.claus.test.js`: 2 roges.** `i18n.js:257-258` ha canviat només el valencià de `section.calendari.title` i `section.calendari.subtitle` (ara «Publicacions» i un subtítol nou). No s'ha tocat la reserva de `CalendariSection.jsx:421,432-433`, ni l'es, en, eu i gl, ni la prova. Triar la còpia és decisió editorial del Mestre.
- **`tests/lint_calendari.test.mjs`: 2 roges.** Venen del redisseny en curs del prompt [[261001_1413_prompt_calendari_tractors]]:
  - `dataTriada` i `titolLlista` han quedat sense ús (`CalendariSection.jsx:248, 353`). Amb ells, tres variables de proves.
  - La classe `sdp-cal-titol-superior` (`:257, :366`) no té regla.
- **Errors de consola en calent.** «useSession ha de ser usat dins de SessionProvider»: són recàrregues HMR de `SessionContext.jsx` entre les 12:22 i les 12:30 UTC (edició d'un altre actor). En recarregar la pàgina no se'n produïx cap de nou.
- **Observació menor.** `Dialeg.test.jsx:167` usa `style={{ display: 'none' }}` per simular un element amagat dins de jsdom. La guarda d'estils en línia exclou les proves.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Navegador** (servidor de desenvolupament al port 3340, pestanya pròpia, mode seed):

- **`/calendari` sense `?vista=`:**
  - «Pantalla completa» obri un `dialog` modal de 682×1306 que cobrix la finestra sencera. La barra negra, la blava, el títol de pàgina i la navegació mòbil queden davall.
  - El focus va a «Eixir de la pantalla completa».
  - El visor fa scroll (`overflow-y: auto`, 1724 px de contingut en 1253 px) i el document no.
  - Esc tanca el diàleg i el focus torna al botó.
- **`?vista=setmana`:**
  - Obri en pantalla completa.
  - «Setmana següent» porta a `?vista=setmana&setmana=2026-W41` sense eixir del mode.
  - El selector «Mes» canvia a `?vista=mes&mes=2026-10` dins del diàleg.
  - «Eixir» tanca el diàleg, el focus torna al botó i el `body` torna al seu estat base (`overflow: hidden`, igual que abans d'obrir).
- **Mòbil 375×812:** el diàleg fa 375×812, la setmana es pinta en tira, «Eixir» fa 115×44 i el visor no té desbordament horitzontal (`scrollWidth` 375 = `clientWidth` 375).
- **Fosc** (`data-theme="dark"` aplicat de manera temporal per inspeccionar i restaurat després): fons del diàleg i de la franja `rgb(14, 13, 12)`, «Eixir» amb text blanc sobre `rgb(24, 23, 21)` i vora `rgb(139, 133, 123)`.

**Proves** (2026-10-01, 15:04–15:10 hora local):

- **Vitest, 17 fitxers** (pantalla completa, Dialeg, navegació, calendari, editorial, dates de prova, Mercat, Pobles, autoria): primera passada 478/479. L'única roja era meua: `CalendariSection.robustesa.test.jsx:283` esperava la còpia vella «targetes» i ara la còpia és «publicacions». L'he corregida i les tres suites del calendari fan 228/228.
- **Vitest, 15 fitxers transversals:** 229/231. Les 2 roges són les alienes d'i18n de F6.
- **Guardes de `tests/`** (vitest les exclou; s'han executat amb `node --test`):

  | Guarda | Resultat |
  | --- | --- |
  | `lint_pantalla_completa` | 4/4 |
  | `frontissa-contingut` i `frontissa-gate` | 20/20 |
  | `design-contracts` i `tractor-inline-styles` | 8/8 |
  | contrastos del mes i de la setmana | tots verds, clar i fosc |
  | `lint_enxufe` | 43 verdes, 0 roges, 2 TODO de diagnòstic |
  | `lint_calendari` | 8/10; les 2 roges són les alienes de F6 |

  Els dos TODO de `lint_enxufe` són la llista de fitxers tocats per tots els actors de l'arbre i 7 classes heretades d'`App.jsx`.

**Porta Olivera** (`--informe`): Safata d'Entrada buida, cap consumit de jornades anteriors, documents vius declarats a «## Activitat en curs».

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Què no puc fer.** Claude no pot executar `npm run build:wp` ni l'empaquetat (el hook ho bloqueja), ni moure fitxers de l'Escriptori, ni tancar el torn 1140 (és de MarIA, `torn_440f1d06-27e2-4754-997e-b8b416189fad`), ni actualitzar ESTAT i LEDGER, ni executar `tancament.mjs`. El segell automàtic avisa «segell divergent» a cada eina; la reconciliació és de l'orquestradora.
- **Per al Mestre:**
  1. Recompilar `wordpress-plugin/dist` amb les `VITE_*` de producció abans de qualsevol lloc real; `.env.local` apunta a `localhost:54321`.
  2. Aclarir qui genera `release/socdepoble-enxufe/` i regenerar-la o retirar-la.
  3. Dir l'hora de publicació de `projecte`, `constitucio`, `legal`, `disseny`, `anima`, `roadmap`, `notes_shared` i `consola`.
  4. Triar el criteri de `notes` i confirmar `versions` i `fedivers`.
  5. Decidir la còpia del títol i el subtítol del calendari en les cinc llengües.
- **No verificat:**
  - D4 sobre una pàgina real de WordPress (només proves de capes i de la Frontera C2).
  - L'«Enrere» d'Android (D6).
  - Les hores reals de `pageContent.js` en mode remot.
- **Memòria desfasada.** El fitxer de memòria que atribuïx el `.add()` sobre null a Preact està desfasat (l'app usa React 18.3.1). El hook en va bloquejar l'actualització.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261001_1140_prompt_claude]]
- [[261001_1140_pla_implementacio_claude]]
- [[261001_1413_prompt_calendari_tractors]]
