---
type: informe
status: esborrany
description: 'Informe del torn de Claude: què s''ha implementat al Xat i rondes d''auditoria adversarial sobre el carril de Codex (plugin WordPress i incrustació).'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ddd7a133-b647-4153-830e-aa31d09b5bc1:a06aa589-1806-45a8-8065-6b454e6aa308
---
# Auditoria de Claude — Clon de WhatsApp i rondes creuades sobre Codex

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ddd7a133-b647-4153-830e-aa31d09b5bc1:a06aa589-1806-45a8-8065-6b454e6aa308 |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T19:43:11.624Z |
| Modificació | 2026-10-01T00:50:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Ultracode |
| Tokens consumits | N/D (torn en curs) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-30T19:43:11.624Z: esborrany creat; contingut i verificació pendents.
2026-09-30T19:47:00.000Z: v0.1.0, esquelet de rondes perquè Codex sàpia on llegir-les.
2026-09-30T19:58:00.000Z: v0.2.0, acord de repartiment amb Codex i crítica del seu pla 2143 (ronda C1).
2026-09-30T20:42:00.000Z: v0.3.0, rondes C2 (consens del diàleg local) i C3 (revisió adversarial del portal: sentinella, blindatge del contenidor, focus i apilament).
2026-09-30T22:40:00.000Z: v1.0.0, implementació, revisió adversarial pròpia (28/28 corregides), front del Traductor Sobirà, rondes C4-C10, verificació i límits.
2026-09-30T23:00:00.000Z: v1.1.0, B6: l'extractor del traductor ja no envia text ocult, de lector, de controls ni editable.
2026-10-01T00:50:00.000Z: v1.2.0, B7: Calendari, Boina Taronja i dates de prova (ordre del Mestre de l'1-10), amb dues revisions adversarials; detall a l'Acta Marmota 0245.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### A. Rondes creuades sobre el carril de Codex

Codex: ací van les meues rondes numerades. Si una troballa és falsa, rebat-la al teu informe i la reverificaré en la ronda següent.

#### Acord de repartiment (21:58)

Confirmat, amb una precisió:

- **Codex:** `src/PedraSecaEmbed.jsx`, `src/css/base.css`, `src/css/layout.css`, `wordpress-plugin/`, `vite.standalone.config.js` i les proves d'encastament.
- **Claude:** `src/sections/xat/` (components, context, ajustos del xat), els estils del Xat i els espècimens del Xat al catàleg de disseny. No toque `PedraSecaEmbed.jsx`, `base.css` ni `layout.css`.
- **`src/app/App.jsx`:** acord perquè Codex toque NOMÉS `AppShell` entre `App.jsx:175` i `App.jsx:208` (estat inicial, `useEffect` del `ResizeObserver`, càlcul d'`isCompact`). Jo no el toque en tot el torn. Si el Xat necessita una ruta nova (`/xat/ajustos` o semblant), la registraré dins de `src/sections/xat/` o t'avisaré ací abans de tocar cap taula de rutes.
- **La precisió:** els estils del Xat viuen a `src/css/modules.css`, que no és de ningú. Jo hi toque només blocs `.sdp-xat*`; si necessites una regla de `modules.css` fora d'eixos blocs (p. ex. `modules.css:5845`, `.sdp-drets__peu`), avisa ací i no hi entraré.

#### C1 · Crítica del pla `260930_2143_pla_implementacio_codex` (21:58)

Verificat per lectura del codi; cap prova executada en esta ronda.

- **C1-1 · D'acord, i és més greu del que diu el pla: les consultes anònimes ja es resolen contra contenidors interiors.** `base.css:53` fa contenidor `.sdp-root`, `#root` i `:host`, però `components.css:1620` (`header.bar-blue`), `components.css:1625` (`.sdp-universal-page-container`), `components.css:663` i `components.css:1657` en declaren d'altres. Un `@container (max-width: 1023px)` anònim s'avalua contra el contenidor AVANTPASSAT MÉS PROPER de l'element estilitzat. Cas candidat (fet de CSS verificat; muntatge NO verificat al navegador): `modules.css:5845` estila `.sdp-drets__peu` (`CopyrightPage.jsx:236`); si eixa vista es munta dins de `PageFrame.jsx:241` (`.sdp-universal-page-container`), la consulta mesura la columna i no l'arrel, i en escriptori ample amb una columna de 900 px afig el farcit d'una barra mòbil que no existix. Proposta: `container-name: sdp-arrel` a `.sdp-root` i `@container sdp-arrel (max-width: 1023px)` a tota regla que parle del breakpoint mestre. Severitat P1 (visual, sense pèrdua de dades).
- **C1-2 · D'acord amb `.is-compact` com a font única del breakpoint mestre.** `grep -rn is-compact src` només troba `App.jsx:355`: la classe hui no té cap regla. El Baseline canònic és Chrome 100 i Firefox 100, i `@container` arriba a Chrome 105 i Firefox 110: en eixos dos navegadors totes les regles de `layout.css:404`, `:554`, `:571`, `:620` i `:674` s'ignoren senceres. Recomane que el breakpoint mestre visca NOMÉS en `.sdp-root.is-compact …` (la mateixa decisió que React) i que `@container` quede per a consultes locals de component (barra blava, targetes). Mantindre les dues coses duplica la font de veritat i crea finestres on discrepen (amplàries fraccionàries entre 1023 i 1024).
- **C1-3 · La mesura inicial és imprescindible, i el patró ja existix.** `App.jsx:176` arrenca amb `window.innerWidth`: incrustada en un bloc de 700 px dins d'una finestra de 1400 px, el primer pintat és d'escriptori i el `ResizeObserver` el corregix un fotograma després (parpelleig i, amb `.is-compact` com a font única, un fotograma sense barra mòbil). `AppGridShell.jsx:77-107` ja mesura de forma síncrona abans d'observar: copia eixe patró en un `useLayoutEffect` amb `getBoundingClientRect().width` de l'arrel.
- **C1-4 · Guarda del `ResizeObserver`.** `App.jsx:183` i `AppGridShell.jsx:109` el construïxen sense comprovar que existisca. Tot el Baseline 2022 el té; jsdom no. Si afegixes `typeof ResizeObserver === 'undefined'`, que la caiguda siga la mesura síncrona i un `resize` de `window`, no un valor fix, perquè les proves de Vitest puguen exercitar els dos modes.
- **C1-5 · Contenció explícita a la frontera: d'acord, però limita-la a `:host`/`.sdp-root` de l'encastament.** Si poses `contain: layout` a `.sdp-root` també a socdepoble.org, tots els `position: fixed` interiors (diàlegs, toasts, barra mòbil, menús del Xat) passen a mesurar-se contra `.sdp-root`. Al lloc propi `.sdp-root` ocupa el viewport i no canvia res; però `contain: layout` també crea context d'apilament i talla el desbordament visual de pintura dels fills fixos. Demana-ho a les proves de navegador dels diàlegs del Xat (`DialegNovaConversa`, el full d'Ajustos que estic fent) i no només a la barra mòbil.
- **C1-6 · Dos detectors, dues preguntes: no els unifiques.** `AppShell` decidix «closca compacta» sobre l'arrel (≤ 1023 px, `App.jsx:83`); `AppGridShell` decidix «estret/mitjà/ample» sobre la graella interior (< 720 px, i «mitjà» segons les columnes, `AppGridShell.jsx:86-93`). Són preguntes diferents i han de continuar separades; el Xat depén de la segona. Si canvies l'arrel, comprova que `/xat` a 1023/1024 px no deixa la graella en «ample» amb la barra mòbil dibuixada damunt.
- **C1-7 · El pla no diu com es verificarà el Baseline 2022.** Les proves de navegador del pla són d'amplària; cap prova sense `@container`. Proposta barata: una prova de Vitest que munte `AppShell` amb una amplària forçada i comprove la classe `.is-compact`, i una revisió estàtica que cap regla del breakpoint mestre quede només dins d'`@container`.

#### C2 · Resposta a la ronda C2 de Codex: el `<dialog>` modal dins de `soc-de-poble` (22:15)

Llegits `Dialeg.jsx` (sencer), `DialegNovaConversa.jsx:5` i `:67`, `XatSection.jsx:415-428` i `XatSection.test.jsx:1335-1350`. **Validat, amb sis condicions.** Codex és l'amo de `Dialeg.jsx`, les seues proves i el CSS de frontera; jo no el toque. Jo sóc l'amo de `DialegNovaConversa` i del full d'Ajustos nou, que el consumiran sense canviar-ne el contracte.

- **C2-1 · El portal, a una capa DINS de `.sdp-root`, no a l'arrel del shadow.** Un fill directe del `ShadowRoot` és germà de `.sdp-root`: hereta de `:host`, però no li casen els selectors `.sdp-root …`, ni el que es declare només a `.sdp-root`. Proposta: un node `.sdp-capa-modal` com a últim fill de `.sdp-root`. Així el bloc contenidor del `fixed` és la frontera `:host .sdp-root { contain: layout }` que ja has posat, i cap columna intermèdia amb `overflow` o `contain` el retalla.
- **C2-2 · Conserva l'element `<dialog>` i obri'l amb `show()`, no amb un `<div>`.** El mode no modal manté `open`, l'esdeveniment `close`, `form method="dialog"`, les regles `.sdp-dialeg…` i les proves que ja busquen el `<dialog>`. Només perd la capa superior, el `::backdrop`, l'Escape natiu i l'inert natiu. El vel ha de ser un germà (el `::backdrop` no es pinta en no modal), amb el mateix token de color que hui.
- **C2-3 · `inert` no és del Baseline 2022.** Chrome el porta des de la 102 i Firefox des de la 112; el Baseline canònic és Chrome 100 i Firefox 100. La trampa de focus ha de ser manual (Tab i Maj+Tab cíclics dins del diàleg), amb `aria-modal="true"`. `inert` als germans de la instància, com a millora quan existisca.
- **C2-4 · Escape amb `preventDefault()`, obligatori.** `XatSection.jsx:419-428` escolta Escape a `window` i IGNORA els esdeveniments ja consumits (`defaultPrevented`) perquè un sol Escape no tanque un menú i alhora isca de la selecció de xats. El teu gestor local ha de cridar `preventDefault()` i ha de mantindre `onTanca('esc')` exactament igual. La branca `{ forcat: true }` (`Dialeg.jsx:62-64`) només té sentit en modal natiu.
- **C2-5 · La decisió, al moment d'obrir i per node.** `d.getRootNode()` és un `ShadowRoot` amb amfitrió `soc-de-poble` → mode local; si no, `showModal()`. Res de marca global: el catàleg de disseny i socdepoble.org continuen amb la capa superior (Llei del Píxel).
- **C2-6 · Apilament.** La capa ha d'estar per damunt de la barra mòbil (`Dialeg.jsx:4-6` recorda les barres de 99xxx), els diàlegs niats s'apilen per ordre de muntatge (`DialegConfirmacio` dins d'un `Dialeg`) i els avisos (`showToast`) han de quedar per damunt del vel. Si hi ha token de `z-index`, usa'l; si no n'hi ha, digues-ho a l'informe en lloc d'inventar un número.

Dependència: el full d'Ajustos que estic fent es muntarà sobre `Dialeg` (mateixes props: `obert`, `onTanca`, `titol`, `mida`, `className`, `variant`). Si canvies alguna prop o classe, avisa ací.

**Sobre `XatSection.test.jsx:1342`:** confirmat, és del meu carril i és una prova rància. Cerca `.app-grid-header-btn[aria-controls="app-grid-list"]`, però `AppGridShell.jsx` ja no pinta cap botó amb eixa classe (només en queda la regla a `AppGridShell.css:52`): la closca del Xat no pinta pestanyes en estret i mitjà (`XatSection.jsx:929-930`). La reescric contra el control real. Baseline de `src/sections/xat` en execució.

**Sobre el grup d'entrada «Gent de la Torre» (el teu P2):** la resposta anirà al meu pla, amb les dades del backend.

#### C3 · Revisió adversarial del portal local de `Dialeg` (22:40)

Tall: `Dialeg.jsx` de les 22:15:48, `modalLocal.js` de les 22:22:16 i `layout.css` de les 22:15:48 (hores de `ls -lT`). Llegits sencers.

**Reproducció de l'error «Target container is not a DOM element».** NO reproduït en este tall. Provat a la pestanya pròpia del navegador, sense cap error de React a la consola:

- `tests/manual/enxufe-amfitrio.html` servit per Vite, a 1280 px i a 375 px: obrir «Nova conversa», obrir el calaix compacte i navegar amb el calaix obert (desmuntatge del portal).
- WordPress Studio (`localhost:8881/pedra-seca-demo/`). Hi falla la connexió a `localhost:54321` (Supabase local aturat); no és cap error de React.

Tres fets que delimiten l'origen:

- El `dist/` del plugin és de les 22:07:44 (`ls -lT wordpress-plugin/dist`), ANTERIOR al portal: un crash al WordPress no pot vindre de `Dialeg.jsx` de les 22:15 si no s'hi ha tornat a compilar.
- Els dos paquets porten React de veres (cap àlies a preact a `vite.config.js:84-88` ni a `vite.standalone.config.js:380-384`). Eixe missatge el llança `react-dom` quan el contenidor és fals o no és un node: amb la guarda `desti ? createPortal(…)` de `Dialeg.jsx:39`, i `closest()`, que torna un `Element` o `null`, en este tall no pot passar.
- Els altres dos portals tenen destí vàlid: els avisos van al `ShadowRoot` (`PedraSecaEmbed.jsx:623`, `NotificationContext.jsx:37`) i el TOC va a `document.body` (`PageFrame.jsx:102`).

Hipòtesi més probable: una versió intermèdia durant l'edició (recàrrega en calent de Vite), no el codi d'ara. Encara que no es reproduïsca, el portal s'ha de blindar perquè no puga rebre un contenidor invàlid (C3-2).

**Troballes:**

- **C3-1 · P1 (FET) · El sentinella `<span hidden>` de `Dialeg.jsx:38` es pinta SEMPRE, també a la SPA, i ha tornat roja una prova del Xat.** `XatSection.test.jsx:651` comprova els fills de la columna de llista i ara en rep un de més (`[…, 'sdp-workspace-column__body', undefined, 'sdp-dialeg']`). No és només la prova: tot pare d'un `Dialeg` rep un node nou, i els selectors `:first-child`, `:last-child`, `:only-child` i `nth-child` canvien de fill (Llei del Píxel a socdepoble.org). **Com tractar-lo:** no s'ha de tocar la prova, que ha detectat un canvi de DOM real; s'ha de corregir `Dialeg`. Dos camins, en ordre de preferència:
  1. **Immediat:** pintar el sentinella NOMÉS mentre `desti === undefined` (el primer commit). La decisió és per node i un node no passa de dins a fora d'un shadow root, així que es pot recordar i no cal tornar-la a calcular a cada `obert`. Després del `useLayoutEffect` el sentinella desapareix abans de pintar, i la prova 651 torna a verd sense tocar-la.
  2. **Estat final net:** res de sonda al DOM. `AppShell` (el teu tram, `App.jsx:175-208`) publica en un context el node `.sdp-root` quan `getRootNode()` és el shadow de `soc-de-poble`, i `Dialeg` el llig amb `useContext`. Sense context, `showModal()` natiu. Zero nodes extra i zero commits extra.
- **C3-2 · P1 (enduriment) · El portal ha de validar el contenidor en pintar, no només en decidir.** `desti` es calcula en el `useLayoutEffect` i es guarda en estat. Si `.sdp-root` es desconnecta després (remuntatge de la closca, moviment de l'element amfitrió, recàrrega en calent), `createPortal` rep un node desconnectat. Proposta: `const valid = desti?.nodeType === 1 && desti.isConnected;` i `valid ? createPortal(…) : contingut`, sense tercer estat. És el blindatge que tanca la família d'errors «Target container is not a DOM element», encara que no l'haja reproduït.
- **C3-3 · P1 (FET de lectura, a confirmar amb prova) · En mode local, `enfoca()` roba el focus i trenca la Llei de la Por Orgànica.** Cas més greu que el de sota: `DialegConfirmacio destructiu` posa el focus a «Cancel·lar» amb `autoFocus` (`Dialeg.jsx`, capçalera i `DialegConfirmacio`). En el client, React NO escriu l'atribut `autofocus` al DOM: crida `focus()` en el commit. Per tant, `candidats.find(el => el.hasAttribute('autofocus'))` (`modalLocal.js:22`) no el troba mai, i `enfoca()` mou el focus al primer control, la X. En l'encastat, un Intro distret després d'obrir una confirmació destructiva ja no cau sobre «Cancel·lar». La mateixa correcció de sota ho resol.
- **C3-3 (continuació) · SOSPITA corregida per mi mateix · En mode local, `enfoca()` pot robar el focus que el contingut ja ha posat.** Primer vaig sospitar que un diàleg muntat ja obert perdia el focus inicial pel commit buit de `Dialeg.jsx:39`. No és així: `DialegNovaConversa.jsx:98-101` enfoca el cercador en el muntatge del seu propi contingut, i per això `DialegNovaConversa.test.jsx:53-56` passa. El risc real és l'ordre invers. L'efecte del fill (el contingut) s'executa abans que el de `ContingutDialeg`, i `obriModalLocal` crida després `enfoca(dialeg)` (`modalLocal.js:62`), que tria `[autofocus]` o el PRIMER control. En un `Dialeg` estàndard, el primer control és la X de la capçalera (`Dialeg.jsx:127`). Proposta: `if (!dialeg.contains(shadow.activeElement)) enfoca(dialeg);`, és a dir, respectar el focus que el contingut ja ha col·locat dins. Al navegador, el shadow tancat no deixa llegir `activeElement` des de fora; cal una prova de Vitest amb un amfitrió `soc-de-poble` simulat (el teu arnès de 19 proves).
- **C3-4 · P2 (FET) · `arrel.appendChild(capa)` (`modalLocal.js:58`) mou un node que React ha posat amb un portal.** React desmunta el portal amb `removeChild` sobre el mateix contenidor, i el node hi continua sent fill, així que funciona. Però és un node gestionat per React que canvia d'ordre per fora de React. Alternativa sense moure nodes: l'ordre d'apilament per `z-index` creixent segons la posició a la pila (`capa.style` no és admissible per AppGridShell §4; una classe o un atribut `data-nivell` amb 4-5 nivells en CSS). Ho deixe com a P2 perquè hui funciona.
- **C3-5 · P2 (FET) · El full inferior de mòbil del `Dialeg` depén del viewport.** `components.css:264-271` el decidix amb `@media` d'amplària. En una caixa de 375 px dins d'una finestra ampla, el diàleg local no es fa full inferior; en una finestra estreta amb una caixa ampla, sí. És la mateixa família que C1-2: si es vol el full inferior en compacte, cal `.is-compact`. `requires_human_decision: false`.
- **C3-6 · P3 (FET) · `max-height: inherit` de `.sdp-dialeg__marc` (`components.css:225`).** Dins de la capa, el `<dialog>` porta `max-height: 100%` (`layout.css:18`), i el marc l'hereta com a percentatge d'un pare d'alçada automàtica, que no limita res. El scroll recau en el `<dialog>` sencer (`overflow: auto`, `layout.css:18`) i la capçalera se'n va amb el contingut. Als diàlegs curts no es nota; al full d'Ajustos, que és de mida fixa, sí. Proposta: en mode local, `display: flex; flex-direction: column` al `<dialog>` i el cos amb `overflow: auto`.
- **Validat:** Escape consumit amb `preventDefault` a `.sdp-root`, abans que el `window` de `XatSection.jsx:419-428` (C2-4 complit); Tab cíclic sense dependre d'`inert` (C2-3 complit); retorn del focus amb `isConnected` (`modalLocal.js:103`); restauració dels atributs originals d'`inert` i `aria-hidden` (`modalLocal.js:96-99`).

**Reverificació (22:45, `Dialeg.jsx` de les 22:25:18).** Codex havia aplicat C3-1 i C3-2 mentre jo escrivia la ronda:

- el sentinella ja no existix: el sondeig el fa el mateix `<dialog>` (`nodeRef`, `Dialeg.jsx:38`);
- l'estat inicial és `null`, i per tant el primer commit pinta en el lloc, sense commit buit;
- la guarda `desti?.nodeType === 1 && desti.isConnected` (`Dialeg.jsx:37`) és exactament C3-2.

Evidència: `npx vitest run src/sections/xat` dona 16 fitxers i 260/260, inclosa `XatSection.test.jsx:651`, que abans era roja. C3-1 i C3-2 queden **tancades**.

Queda una observació nova, P3: en el shadow, el primer commit pinta el `<dialog>` en el lloc i el `useLayoutEffect` el passa al portal. React el tracta com un altre arbre i remunta `ContingutDialeg` una vegada, abans de pintar. Els efectes de muntatge dels fills poden executar-se dues vegades en l'encastat (per exemple, la primera crida de `cercaMembres` de «Nova conversa»). No trenca res; si molesta, el camí 2 de C3-1 (context des d'`AppShell`) l'elimina.

C3-3, C3-4, C3-5 i C3-6 continuen obertes.

**Conseqüència per al meu carril:** la base del `Dialeg` és prou sòlida per a muntar-hi el full d'Ajustos. Continue.

#### Rèplica a la troballa P1 de Codex sobre les marques «entregat» (23:05)

**Codex té raó; l'error era meu i ja està corregit.** Verificat: `xat_fils_meus` torna `jo.rebut_fins_seq` (`2609282100_xat_de_pagina.sql:631`), i `localXat.js:302` i `:403` fan `meu.rebutFinsSeq`. És fins on JO he rebut, no fins on l'han rebut els altres. Derivar-ne les dos marques grises pintava «entregat» sense cap prova del destinatari.

Correcció aplicada en el meu carril:

- `derivaEstat` torna a `pendent | enviat | llegit | error` (`missatges.js`);
- `mapejaFil` ja no exposa `rebutFinsSeq`;
- `MarquesEstat` i el CSS ja no tenen la variant `entregat`;
- `estatDeLUltim` (les marques de la llista) només usa `llegitPelsAltresFinsSeq`;
- prova de regressió amb el cas exacte de Codex (`missatges.test.js`, «el rebut propi mai es pinta com a entregat»).

Si el Mestre vol les dos marques grises, cal un `rebutPelsAltresFinsSeq` al contracte, simètric de `llegit_pels_altres_fins_seq`. `requires_human_decision: true`.

#### C4 · Ronda automàtica (22:49)

Tall per `ls -lT`: `Dialeg.jsx` i `modalLocal.js` de les 22:33:43, `Dialeg.test.jsx` i `embed.jsx` de les 22:29:12, `layout.css` de les 22:36:08. Sense canvis des de C3: `PedraSecaEmbed.jsx` (21:55:23), `base.css` (21:57:26), `App.jsx` (22:04:04), `pantalla-completa.php` (21:55:23), `wordpress-plugin/includes/` (21:11:34) i `tests/enxufe-*.mjs`. Informe de Codex llegit fins a la seua C4 (fitxer de les 22:46:22). Traçabilitat: les hores entre parèntesis de C3 i de la rèplica no casen amb el fitxer (l'informe tenia les 22:29:52 i les 22:38:32). D'ara avant, cada tall es data amb `ls -lT`.

**Proves executades en este tall:**

- `npx vitest run src/components/PedraSeca/organismes` a les 22:33:28, sobre `Dialeg.jsx` de les 22:25:18: 84/87. Roges: les dues regressions noves de Codex (`Dialeg.test.jsx:209` i `:215`, focus a «Tancar») i un temps exhaurit de `CalendariMes.test.jsx:99` (5,9 s, amb càrrega concurrent). Era la fase roja de C3-3, abans de la reparació.
- La mateixa ordre a les 22:40:05, sobre el codi de les 22:33:43: **87/87**. `Dialeg.test.jsx` amb `DialegNovaConversa.test.jsx`: 25/25.
- `node --test tests/enxufe-pantalla.test.mjs`: **4/4**.
- `npx vitest run src/sections/xat/XatSection.test.jsx` a les 22:46:23: **94/94**, inclosa la `:651`.

**El fill sense classe (petició del Mestre).** Era el `<span hidden>` sonda de C3-1. El tractament correcte és el que ja hi ha: cap node extra, i la prova `XatSection.test.jsx:651` intacta. No s'ha de filtrar `undefined` a la prova ni posar-li classe al node: la prova va detectar un canvi de DOM real. Ara la sonda és el mateix `<dialog>` (`nodeRef`, `Dialeg.jsx:37`), i `Dialeg.test.jsx:191-194` blinda la branca nativa (un sol fill `DIALOG`). Precisió: la `:651` descriu la SPA. En l'encastat el `<dialog>` no viu a la columna (va al portal) i la columna té tres fills. Cap regla depén d'eixe últim fill: les úniques amb `.sdp-root >` són `layout.css:31-32`.

**Cicle de muntatge del portal (estat verificat):**

- `createPortal` només rep un `Element` connectat (`Dialeg.jsx:36`). Els altres dos portals tenen destí vàlid: el `ShadowRoot` (`NotificationContext.jsx:37`) i `document.body` (`PageFrame.jsx:102`). En este tall, «Target container is not a DOM element» no pot eixir de `Dialeg`.
- SOSPITA sobre l'origen de l'error vist al banc: Fast Refresh conserva l'estat de `useState` entre versions si l'ordre dels hooks no canvia. Una versió intermèdia que guardara a `desti` un valor que no fóra un node, seguida d'una amb `desti ? createPortal(…, desti)`, dona exactament eixe missatge dins d'un Error Boundary. No es pot verificar: no hi ha còpia de les versions intermèdies. La recàrrega completa del banc (`embed.jsx:30-32`) tanca eixa via.
- `obriModalLocal` ara corre en `useLayoutEffect` (`Dialeg.jsx:57-63`), i la seua neteja també: el `retorn.focus()` s'executa abans que React retire la capa. És millor que abans.
- Ordre en el shadow: commit 1 en el lloc, `setDesti` en el layout del pare, commit 2 al portal, tot abans de pintar. Un diàleg niat afig un commit per nivell. Correcte.

**Troballes:**

- **C4-1 · P2 (FET de lectura, cal prova) · El focus no torna al disparador en els diàlegs muntats ja oberts amb `autoFocus`.** En el commit 2 la capa és visible, i `layout.css:18-20` dona `display: flex` al `<dialog>` encara sense `open` (l'autor guanya a l'agent d'usuari). L'`autoFocus` de React enfoca en la fase de layout, fills abans que pares (`react-dom.development.js:11029`). Per tant, el control de dins ja té el focus quan `obriModalLocal` captura `retorn` (`modalLocal.js:34`). En tancar, el focus va a un control que desapareix i es perd. Cas real: `NotesEditor.jsx:428-436` munta `DialegEmoticona` ja obert, amb `CampText autoFocus` (`DialegEmoticona.jsx:51`). També `DialegConfirmacio` muntada oberta. Proposta: capturar el disparador al `Dialeg` en un `useInsertionEffect` lligat a `obert` (corre en la fase de mutació, abans de cap `autoFocus`) i passar-lo a `obriModalLocal`. Prova roja: `muntaLocal` amb un botó enfocat, `rerender` que munta `<DialegConfirmacio obert destructiu />`, desmuntar-la i esperar el focus al botó.
- **C4-2 · P2 (FET de lectura) · El marcador `data-sdp-focus-inicial` només cobrix `DialegConfirmacio`.** `Dialeg.jsx:154` el posa a mà i `enfoca()` l'honora (`modalLocal.js:22`). `DialegEmoticona` (muntat obert, `NotesEditor.jsx:429-431`) perd el focus del camp: `enfoca()` el mou a «Tancar» encara que el camp ja el tinga. Proposta en dos passos, sense tocar consumidors: (a) a `obriModalLocal`, `if (!dialeg.contains(shadow.activeElement)) enfoca(dialeg);` (la guarda de C3-3, encara vàlida i genèrica); (b) si es vol un sol lloc, que `Boto` i `CampText` emeten el marcador quan reben `autoFocus`. Cap dels dos canvia la SPA.
- **C4-3 · P3 (SOSPITA, preexistent a la SPA, no és de Codex) · A socdepoble.org la Llei de la Por Orgànica tampoc es complix.** React 18 no escriu l'atribut `autofocus` (`react-dom.development.js:9709`) i enfoca en muntar, quan el `<dialog>` encara no està obert. Després, `showModal()` (`Dialeg.jsx:75`) enfoca el primer control: la X. La X no esborra res, i no hi ha risc de dades. Però la capçalera (`Dialeg.jsx:17-18`) promet «Cancel·lar». No verificat al navegador. Corregir-ho mou el focus visible a la SPA (Llei del Píxel). `requires_human_decision: true`.
- **C4-4 · P2 (FET de lectura de CSS) · C3-5 només està tancada a mitges.** La geometria del full inferior ja seguix `.is-compact` (`layout.css:31-34`). El peu, no: `components.css:264-271` (`@media (max-width: 720px)`) decidix botons a tota amplària, `column-reverse` i marge de `safe-area`. Dos efectes: una caixa de 375 px en finestra ampla pinta el full inferior amb peu d'escriptori; una caixa de 721 a 1023 px pinta full inferior on la SPA, al mateix ample, pinta el modal centrat (la SPA talla a 720 i `.is-compact` a 1023). Proposta: que la mateixa mesura d'`AppShell` publique una segona classe per al tall de 720 (p. ex. `is-estret`), i que el full i el seu peu la seguisquen dins de `:host`. Sense `@container` (Baseline 2022). `requires_human_decision: false`.
- **C4-5 · P3 (FET de lectura de CSS) · Les variants que es posicionen soles perden l'ancoratge dins de la capa.** `:host .sdp-capa-modal > .sdp-dialeg` (`layout.css:18-23`, especificitat 0,3,0, mateixa capa `components`) guanya a `.sdp-dialeg.sdp-dialeg--barra` (`modules.css:5892-5895`, 0,2,0) i a `.sdp-dialeg.sdp-print-dialog` (`modules.css:6051-6059`). La finestra de la barra taronja queda centrada i no dalt a la dreta. El diàleg d'impressió perd el seu `overflow: auto` i fa scroll el cos. Pot ser el que volem dins d'una caixa: cal mirar-ho al banc i decidir-ho per escrit.
- **C4-6 · P3 (FET de lectura) · Amb tres nivells o més, l'ordre dels nivells no superiors el decidix el DOM.** Només la capa superior puja a `--z-calaix` (99990); les altres queden a `--z-vel` (99960) (`layout.css:11` i `:16`, `tokens.css:222-223`). Si el nivell de baix s'ha muntat després del mitjà, es pinta damunt d'ell, davall del vel superior. Hui no conec cap cas de tres nivells. Sense acció fins que n'aparega un.
- **C4-7 · P3 (només desenvolupament) · `embed.jsx:30-32` recarrega el banc sencer en qualsevol actualització de Vite, també de CSS.** Amb tres agents editant, el banc es recarrega sovint i es perd l'estat d'una prova manual. El paquet compilat no ho porta. Per a proves manuals, `?compilat`.

**Tancades en este tall:** C3-3 (roja a les 22:33:28 i verda a les 22:40:05; les vores que queden són C4-1 i C4-2); C3-4 (cap `appendChild`; `modalLocal.js:43` marca només la superior; `--z-vel` 99960 per damunt de `--z-nav-mobil` 99950, `tokens.css:221-222`); C3-6 (`layout.css:18-30`: diàleg en columna flex, marc sense `max-height`, capçalera i peu amb `flex-shrink: 0`, scroll només al cos). **Oberta a mitges:** C3-5, ara C4-4. **Acceptada per Codex com a coneguda:** la remuntada del primer trasllat (P3 de C3).

**Ordre recomanat per a Codex:** C4-1 i C4-2 juntes (mateixa funció, una prova roja cadascuna), després C4-4. La resta pot esperar. Per al meu carril: la base és prou sòlida per a seguir amb la UI del Xat. El full d'Ajustos no fiarà el focus inicial a `autoFocus` fins que C4-2 estiga tancada.

#### C5 · Ronda automàtica (22:57)

Tall per `ls -lT` (22:55): `Dialeg.jsx` i `modalLocal.js` (22:33:43), `Dialeg.test.jsx` i `embed.jsx` (22:29:12), `PedraSecaEmbed.jsx` (21:55:23), `base.css` (21:57:26), `App.jsx` (22:04:04), `pantalla-completa.php` (21:55:23), `wordpress-plugin/includes/` (21:11:34) i `tests/enxufe-*.mjs`: **sense canvis des de C4**. Sí que canvien `layout.css` (22:50:15 i 22:55:02, tots dos a la barra mòbil), `tokens.css` (22:50:47) i el paquet `wordpress-plugin/dist/` (22:38:04). L'autoria dels canvis de la barra no està acreditada: poden ser d'un altre carril. Informe de Codex llegit sencer (22:49:34).

**Proves en este tall:**

- `npx vitest run src/components/PedraSeca/organismes` a les 22:52:13, sobre `Dialeg.jsx` i `modalLocal.js` de les 22:33:43: **87/87**, 7 fitxers.
- `node --test tests/enxufe-pantalla.test.mjs`: **4/4**.

**Portal i fill sense classe (petició del Mestre, reconfirmació).** El codi no ha canviat des de C4 i la resposta de C4 continua vigent: guarda `desti?.nodeType === 1 && desti.isConnected` (`Dialeg.jsx:36`), cap node sonda i la prova `XatSection.test.jsx:651` intacta. Fet nou: el paquet del plugin de les 22:38:04 ja porta el portal actual (`data-sdp-modal-top`, `data-sdp-focus-inicial` i `sdp-capa-modal--calaix` presents a `soc-de-poble.standalone.js`). El fet de C3 «el `dist/` és anterior al portal» ja no val.

**Resposta a la petició de Codex (la teua C5): C3-3/4/5/6 contra els consumidors nous.** Carrera d'escriptura: la meua C4 és de les 22:49:25 i el teu informe de les 22:49:34. C4 ja certifica C3-3, C3-4 i C3-6. Contrast per consumidor:

- `DialegNovaConversa`, únic `<Dialeg` del Xat (`XatSection.jsx:870`): focus al cercador, provat a `Dialeg.test.jsx:210`. Cap `autoFocus` a `src/app` ni a `src/sections/xat` (grep): C4-2 no afecta cap consumidor del Xat. Els Ajustos encara no són al disc.
- `variant="sense-marc"`: únic consumidor, el calaix del menú compacte (`App.jsx:366-384`, `costat="esquerra"`). Es munta tancat i s'obri per `obert`, així que `retorn` és el disparador i C4-1 no l'afecta. Sense X, `enfoca()` tria el primer control del menú, com `showModal()` a la SPA. Apilament: en compacte la capa del calaix hi és sempre, amagada; un altre modal la marca `inert` i després la restaura (`modalLocal.js:48-55`, `:96-99`). Full inferior: els `:not(…--calaix)` de `layout.css:31-32` l'exclouen. Scroll: el `<dialog>` porta `overflow: hidden` (`layout.css:21`) i `sense-marc` no té `__cos`; el scroll el fa la llista del menú (`layout.css:112-124`), amb el `nav` a `height: 100%` (`layout.css:465-474`). Tot correcte hui.

**Troballes:**

- **C5-1 · P2 (FET) · `--sdp-crom-buit` no existix.** `layout.css:513` pinta la vora superior de la barra mòbil amb `var(--sdp-crom-buit)`. Cap fitxer de `src/` ni de `public/` el definix (grep). Una `var()` sense valor invalida la declaració en temps de càlcul: la vora no es pinta, ni a socdepoble.org ni a l'encastat. Proposta: `var(--sdp-crom-vora)` (`tokens.css:291`), que ja usen altres vores del crom (`layout.css:145`, `:259`). Si es vol un to nou, que el declare `tokens.css` amb ordre.
- **C5-2 · P2 (FET de lectura de CSS) · `gap: clamp(8px, 3vw, 24px)` (`layout.css:500`, 22:55:02).** Dos defectes. (a) Pedra Seca: els espais van amb `--sdp-space-*`, i el comentari del bloc (`layout.css:490-491`) diu «cap px nou». (b) A l'encastat, `vw` mesura la finestra de WordPress i no la caixa: una caixa de 375 px dins d'una finestra de 1440 px rep el buit màxim, 24 px. És la família de C1-2 i C4-4. Proposta conservadora: `gap: var(--sdp-space-2)`; o, si ha de respirar, `clamp(var(--sdp-space-2), 3%, var(--sdp-space-6))`, perquè el percentatge del `gap` es resol contra la barra, i dins de la caixa la barra fa l'ample de la caixa. Cal comprovar-ho a 360, 375 i 1023 px.
- **C5-3 · P3 (FET) · La barra mòbil del paquet no és la del codi, i el comentari tampoc.** `soc-de-poble.standalone.js` (22:38:04) porta la píndola flotant: `max-width: 440px`, `border-radius: 100px` i `bottom` amb `--sdp-space-3`. El codi ara pinta una barra plana d'extrem a extrem (`layout.css:501-513`), i `tokens.css:191` ja la descriu així. El pressupost del comentari (`layout.css:492-495`: marges de 2×4, 8 de separació, botó de 48 i reserva de 96) no casa amb el codi (marge 0, `bottom: 0`, `mobile-nav__cta` de 60 px a `:563`, reserva de 72). Conseqüències: cap verificació amb `?compilat` val per a la barra fins que es recompile el paquet, i a socdepoble.org la barra compacta canvia de forma (Llei del Píxel). Si no hi ha ordre escrita del Mestre per a la barra plana, `requires_human_decision: true`. Proposta: qui tinga l'ordre actualitza el comentari; després, `build:wp`.
- **C5-4 · P3 (FET de lectura de CSS) · El calaix del menú és més ample a l'encastat que a la SPA.** `:host .sdp-capa-modal > .sdp-dialeg` (`layout.css:18-21`, especificitat 0,3,0) fixa `width: min(92%, 36rem)` i guanya a `.sdp-dialeg--calaix` (`components.css:255`, `min(88vw, 24rem)`, 0,1,0) dins de la mateixa capa `components`. `layout.css:36` no torna l'amplària. En una caixa de 700 px el menú fa 576 px; a la SPA, 384 px. No verificat al navegador. Proposta: `:host .sdp-capa-modal > .sdp-dialeg--calaix { width: min(88%, 24rem); }`. El `%` corregix de pas el `vw` de la regla original.
- **C5-5 · P3 (FET) · Cap prova local de `costat` ni de `sense-marc`.** `Dialeg.test.jsx` munta en local l'`Encastat`, `DialegNovaConversa` i `DialegConfirmacio`, però cap calaix (grep de `costat` i `variant`: zero). El calaix del menú és l'únic `Dialeg` sempre muntat en l'encastat compacte. Proposta: una prova amb `muntaLocal(<Dialeg obert costat="esquerra" variant="sense-marc" titol="Menú">…</Dialeg>)` que comprove la capa `--calaix`, `aria-modal`, `aria-label`, el focus al primer control, Escape → `'esc'` i clic al vel → `'vel'`. I una línia de contracte a la capçalera de `Dialeg.jsx`: en local, `sense-marc` obliga el fill a portar el seu propi scroll.

**Estat de les obertes:** C4-1, C4-2, C4-4, C4-5, C4-6 i C4-7 continuen obertes: `Dialeg.jsx`, `modalLocal.js` i `components.css` (28/09, 17:20:09) no han canviat. C4-3 espera decisió del Mestre. Cap tancada en este tall.

**Ordre recomanat per a Codex:** C4-1 i C4-2, sense canvis; després C5-4 i C5-5 juntes (una regla i una prova). C5-1, C5-2 i C5-3 són de la barra mòbil: si no són del teu carril, que les recollisca qui l'està editant.

#### C6 · Ronda automàtica (23:04)

Tall per `ls -lT` (23:01). L'únic fitxer nou del carril és `Dialeg.test.jsx` (23:00:43, de 12035 a 14445 bytes), amb tres proves noves: `:231`, `:242` i `:251`. Sense canvis des de C5: `Dialeg.jsx` i `modalLocal.js` (22:33:43), `embed.jsx` (22:29:12), `layout.css` (22:55:02), `tokens.css` (22:50:47), `components.css` (28/09, 17:20:09), `PedraSecaEmbed.jsx` (21:55:23), `base.css` (21:57:26), `App.jsx` (22:04:04), `pantalla-completa.php` (21:55:23), `wordpress-plugin/includes/` (21:11:34), el paquet `soc-de-poble.standalone.js` (22:38:04) i `tests/enxufe-*.mjs`. El banc `tests/manual/enxufe-responsive.html` (22:54:59) no era al tall de C5: llegit sencer, els botons del Xat (`#conversa-prova`, `#respon-prova`) no toquen el portal. L'informe de Codex no ha canviat (22:49:34).

**Proves en este tall:**

- `npx vitest run src/components/PedraSeca/organismes` a les 22:59:36, sobre el `Dialeg.test.jsx` de les 22:29:12: **87/87**, 7 fitxers.
- `npx vitest run src/components/PedraSeca/organismes/Dialeg.test.jsx` a les 23:02:15, sobre el de les 23:00:43: **16/18**. Roges: `:231` (C4-1: rep `null`, el focus es perd en tancar) i `:242` (C4-2: rep la X «Tancar» en lloc del camp). És la fase roja esperada, perquè el codi no ha canviat. La `:251` (C5-5) passa.
- `node --test tests/enxufe-pantalla.test.mjs`: **4/4**.

**Portal i fill sense classe (petició del Mestre, reconfirmació).** Sense canvis: guarda `desti?.nodeType === 1 && desti.isConnected` a `Dialeg.jsx:36`, cap node sonda, `Dialeg.test.jsx:191-194` intacta i `XatSection.test.jsx:651` sense tocar. Les proves noves no toquen eixa branca. La base continua sòlida per a la UI del Xat.

**Revisió de les proves noves.** Reproduïxen exactament C4-1 i C4-2. `focusComAlNavegador` (`:222-229`) emula bé el navegador: al commit 1 el `<dialog>` és al lloc, sense `open`, i l'agent d'usuari l'amaga; al portal, `layout.css:18-20` li dona `display: flex` i ja es pot enfocar. Però les dues roges desmunten part de les meues propostes de C4.

**Troballes:**

- **C6-1 · P2 (FET, correcció pròpia) · La guarda de C4-2(a) no basta.** L'estàndard HTML fa que `show()` execute els passos de focus del diàleg: el focus va a la X abans que la guarda mire. La prova `:242-249` ho emula així. Amb `if (!dialeg.contains(shadow.activeElement)) enfoca(dialeg)` després de `show()`, la prova continuaria roja. Proposta: decidir amb el valor que ja es llig ABANS de `show()` (`modalLocal.js:34`). Si eixe control ja és dins del diàleg, és el focus inicial del contingut: es torna a enfocar després de `show()` i `enfoca()` no s'executa.
- **C6-2 · P2 (FET de lectura de React 18.3.1, correcció pròpia) · El `useInsertionEffect` de C4-1 no pot llegir la ref en el muntatge.** React enllaça les refs en la fase de layout (`react-dom.development.js:23539-23545`); els efectes d'inserció corren abans, en la de mutació (`:24338`). I `document.activeElement` torna l'amfitrió, perquè el shadow és tancat. Camí conservador: al `useLayoutEffect` de `Dialeg` (`:29-35`), només mentre `desti` és `null` (commit 1) i abans del `setDesti`, guardar `node.getRootNode().activeElement` en una ref. En eixe commit l'`autoFocus` del contingut encara no ha pogut enfocar. `obriModalLocal` rep eixa ref com a tercer argument i l'usa com a `retorn` només si el focus actual ja és dins del diàleg (la mateixa lectura de C6-1). Així una sola lectura tanca C4-1 i C4-2.
- **C6-3 · P3 (FET) · `focusComAlNavegador` és més permissiva que el navegador amb la capa amagada.** Deixa enfocar dins d'una capa `hidden`; al navegador no es pot (`layout.css:17`, `display: none`). Hui cap prova en depén. Si una prova futura vol demostrar que un diàleg muntat tancat no roba el focus, eixirà roja sense motiu. Proposta: bloquejar també quan `this.closest('[hidden]')`.

**Estat de les obertes:** C4-1 i C4-2, en fase roja (proves escrites, reparació pendent). C5-5, tancada quant a la prova (`:251` verda); falta la línia de contracte de `sense-marc` a la capçalera de `Dialeg.jsx` (P3). C4-4, C4-5, C4-6, C4-7, C5-2, C5-3 i C5-4 continuen obertes: els fitxers no han canviat. C5-1 reconfirmada per grep: `layout.css:513` és l'únic ús de `--sdp-crom-buit` i no hi ha cap definició. C4-3 espera decisió del Mestre.

**Ordre recomanat per a Codex:** reparar C4-1 i C4-2 juntes pel camí de C6-1 i C6-2, i passar a verd `:231` i `:242` sense tocar-les. Després, C5-4.

**Reverificació (23:10), tall de les 23:07.** Mentre publicava la primera versió (23:04:28), Codex va aplicar la reparació (23:02:38) i va publicar la seua C6 (23:06:50), que ja cita C6-1, C6-2 i C6-3. Canvis nous: `Dialeg.jsx`, `modalLocal.js`, `layout.css` i `App.jsx` (23:02:38), i `Dialeg.test.jsx` (23:06:50). La resta del carril no ha canviat.

Proves:

- `npx vitest run src/components/PedraSeca/organismes` a les 23:05:10, sobre el codi de les 23:02:38: **90/90**, 7 fitxers. `:231` i `:242` passen sense haver-les tocat.
- `npx vitest run src/components/PedraSeca/organismes src/app/App.test.jsx` a les 23:08:06, amb les proves de les 23:06:50: **141/143**. `organismes`, 90/90. `App.test.jsx`, 51/53: les d'AppShell (`:889` i `:925`, amb `data-sdp-estret`) passen; les dos roges són de T3 (C6-6).

Portal i fill sense classe: la reparació no els toca. La guarda és ara a `Dialeg.jsx:37`, no hi ha cap node sonda i `Dialeg.test.jsx:191-194` continua intacta. La base és sòlida per a la UI del Xat.

Tancades amb evidència:

- **C4-1 i C6-2.** `Dialeg.jsx:58-62` captura el disparador en un `useInsertionEffect` amb `arrelModal.getRootNode().activeElement`. El destí del portal ja és a l'estat, i no cal la ref. `obriModalLocal` el rep com a tercer argument (`modalLocal.js:30`) i hi torna el focus a `:106`. És equivalent al camí que vaig proposar, i més curt.
- **C4-2 i C6-1.** `modalLocal.js:34` llig `focusInicial` abans de `show()`. `:63-64` el recupera si era dins del diàleg; si no, crida `enfoca()`.
- **C6-3.** `Dialeg.test.jsx:225` bloqueja el focus dins de `[hidden]`.
- **C4-4.** `AppShell` publica `data-sdp-estret` amb la mateixa mesura (`App.jsx:190`): ≤720, el tall del `@media` de la SPA (`components.css:264`). És un atribut, i React no el trepitja quan canvia `className`. Totes les regles són `:host` (`layout.css:31-40`): la SPA no canvia (Llei del Píxel). Entre 721 i 1023 px de caixa el modal queda centrat, com la SPA al mateix ample. Especificitats: `:host .sdp-capa-modal .sdp-dialeg__peu` (0,3,0) guanya al `@media` (0,1,0), i la variant estreta (0,4,0) guanya a totes dues. Cap consumidor redefinix la direcció del peu (grep: només `modules.css:6522`, una opacitat).
- **C5-4.** `layout.css:42`: calaix a `min(88%, 24rem)`, més avall que la regla general i amb la mateixa especificitat.
- **C5-5.** Prova `:251` verda i contracte de `sense-marc` a `Dialeg.jsx:14`.

Troballes noves:

- **C6-4 · P3 (FET de lectura de React 18.3.1, no provat) · En desenvolupament, un `autoFocus` genèric d'un diàleg muntat ja obert acaba a la X.** `App.jsx:540` embolcalla l'app en `StrictMode`. En el muntatge, React només repetix els efectes de layout i els passius (`react-dom.development.js:27354-27370`): ni els d'inserció ni l'`autoFocus`. La neteja simulada torna el focus al disparador (`modalLocal.js:105-106`). La segona crida d'`obriModalLocal` troba `focusInicial` fora del diàleg, i `enfoca()` tria la X. Afecta el camp de `DialegEmoticona`, el cas de C4-2. No afecta «Nova conversa», que enfoca en un efecte passiu i es repetix, ni `DialegConfirmacio`, que porta marcador. En producció i amb `?compilat` no passa. La prova `:196` no mira el focus. Proposta conservadora: una línia a la capçalera de `Dialeg.jsx` que diga que el focus inicial es verifica amb `?compilat`. Alternativa: en la neteja, si `obertRef` continua cert, guardar el control enfocat de dins i reutilitzar-lo en el muntatge següent.
- **C6-5 · P3 (FET) · El tall de 720 queda escrit dues vegades.** `App.jsx:190` (720 literal) i `components.css:264` (`max-width: 720px`) han de moure's junts, i res no els lliga. Proposta: una constant amb nom al costat d'`AMPLE_MAXIM_COMPACTE` (`App.jsx:84`), amb un comentari que apunte a `components.css:264`.
- **C6-6 · P2 (FET, fora del carril de Codex) · Dues proves T3 d'`App.test.jsx` continuen roges.** `:444-448` espera sis caselles (Xat, Mur, Panell de Control, Pobles, Mercat i Telefonades). La barra en pinta cinc, sense Telefonades i amb Mercat abans de Pobles. `:477-479` no troba el botó «Telefonades». El comentari de `layout.css:495` encara descriu les sis caselles de T3 (ordre del Mestre). Codex ho va atribuir en la seua C1 a un canvi concurrent de `src/config/sections.js`. No és d'AppShell: `:889` i `:925` passen. El coordinador ha d'acreditar si hi ha una ordre nova del Mestre per a la barra. Si n'hi ha, s'actualitzen les proves i el comentari; si no, és una regressió de T3. `requires_human_decision: true`.

Rebudes per al carril de Claude: C6-X1 (`Conversa.jsx:122`, scroll amb historial i missatge nou al mateix render) i C6-X2 (`FakeChatOnboarding.jsx:102` perd `respostaA`). No són del carril de Codex; no les verifique ací i passen al coordinador.

**Estat després de la reverificació:** tancades C4-1, C4-2, C4-4, C5-4, C5-5, C6-1, C6-2 i C6-3. Obertes: C4-5, C4-6 i C4-7, sense canvis; C5-1 (`layout.css:519`, `--sdp-crom-buit` sense definició), C5-2 (`:506`) i C5-3, de la barra mòbil i d'autoria no acreditada; C6-4, C6-5 i C6-6. C4-3 espera decisió del Mestre.

**Ordre recomanat per a Codex:** C6-4 i C6-5, totes dues P3. El carril base queda sòlid.

#### Rèplica a C6-X1 i C6-X2 de Codex (23:20)

- **C6-X1 · Confirmada i corregida.** El càlcul de Codex és correcte: `Conversa.jsx` compensava amb tot el creixement de la llista (`scrollHeight - alcada`), i quan en el mateix render entren antics per dalt i nous per baix, els de baix també sumaven.
  - **Correcció:** la geometria guarda la posició, dins del contingut, del missatge que era el primer (`posicioAlContingut`). En entrar antics, es compensa exactament el que ha baixat eixe missatge. Sense maquetació per a mesurar-lo (jsdom sense caixes), torna a la fórmula d'abans.
  - **Prova:** regressió amb el teu cas (`Conversa.test.jsx`, «antics per dalt i nous per baix alhora»): 1000 → 700, i el missatge alié compta 1 al botó. Verd. Amb la fórmula antiga l'aritmètica dona 1000, però no l'he executada roja.
- **C6-X2 · Confirmada i corregida.** `FakeChatOnboarding.sendChatMessage(fil, text, { respostaA })` conserva ara la cita a la bombolla simulada, com el context de veres.
  - **Proves:** `FakeChatOnboarding.test.jsx` (4) cobrix la cita, els `seq` sense repetir en dos enviaments seguits i la cancel·lació de les respostes pendents en desmuntar (els dos defectes vells del fitxer), i la comunitat del poble sense sessió.
- **Defecte meu trobat al navegador (corregit).** A 900×700 (arrel compacta, graella «ample»), la barra mòbil (y 608–688) tapava el compositor (y 637–700). El Xat reservava l'espai només amb `data-layout="estret"` (graella < 720 px), però la barra es mostra amb `.sdp-root.is-compact` (arrel ≤ 1023 px).
  - **Correcció:** les set reserves de `.sdp-xat*` passen a `:where(.sdp-root.is-compact) .app-grid-shell …`, la mateixa condició que mostra la barra (C1-2), amb l'especificitat equivalent.
  - **Mesura després:** el compositor queda a y 541–604, per damunt de la barra. Al catàleg (arrel no compacta), la reserva desapareix, i també un espai buit que abans sobrava.
- **i18n.** Hi ha 24 claus noves a les cinc llengües (conversa, fila, poble i xat de mostra). La porta `tests/lint_xat.test.mjs` ara també lint·la els fitxers nous: ESLint zero missatges. Queda una clau del full d'Ajustos, en curs.

#### Nova ordre del Mestre: el Traductor Sobirà (via B, DeepL) · proposta de contracte per a Codex (23:40)

**Fet verificat:** DeepL admet `CA` (català) com a llengua d'origen i de destí, amb gestió d'etiquetes (HTML). També admet `ES`, `EN-GB` i `EN-US` (aquestes dos, només com a destí), `FR` i `DE`. Font: documentació oficial de DeepL, «Languages supported» (developers.deepl.com, consultada a les 23:35). Proposta: `source_lang=CA` explícit, sense autodetecció, que podria confondre el valencià amb el castellà.

**Proposta de contracte (Codex, rebat-la o accepta-la a la teua ronda):**

- **Endpoint:** `POST /wp-json/socdepoble/v1/traduir`, amb el cos JSON `{ "textos": ["…", "…"], "desti": "ES" | "EN-GB" | "FR" | "DE", "origen": "CA", "format": "html" | "text" }`.
  - `textos` és un lot: el títol i el cos en una sola crida, com a màxim 50 textos, el límit de DeepL.
  - `desti` pertany a una llista tancada al servidor, que rebutja qualsevol altre valor.
- **Resposta 200:** `{ "traduccions": ["…"], "origen": "CA", "desti": "ES", "cache": true | false }`, amb el mateix ordre i la mateixa longitud que `textos`.
- **Errors, en format WP REST** (`{ code, message, data: { status } }`):
  - 400 `sdp_traduccio_invalida`;
  - 429 `sdp_traduccio_limit`: límit per IP o quota de DeepL (456);
  - 502 `sdp_traduccio_proveidor`;
  - 503 `sdp_traduccio_sense_clau`: no hi ha clau configurada.
  - El front només pinta el `message`, mai un detall del proveïdor.
- **Seguretat:**
  - La clau NO ix mai del servidor (l'entorn o una constant).
  - Nonce `wp_rest` a la capçalera `X-WP-Nonce`.
  - Límit per IP amb transients, perquè l'endpoint és públic i cada crida gasta crèdits.
  - La memòria cau de transients va per `hash(origen|desti|format|text)`.
  - Amb `format: "html"` s'usa `tag_handling=html`. El front torna a sanejar l'HTML traduït (`sanitizeHtml`) abans de pintar-lo: el servidor no és cap garantia de neteja.
- **Descobriment, al teu carril:** el plugin passa a l'element `traductor-url` (l'URL de l'endpoint, del mateix origen que la pàgina) i `traductor-nonce`. `sanejaConfig` els admet com a `traductorUrl` (només del mateix origen, amb la mateixa guarda que `fonts-href`) i `traductorNonce` (text opac, sense cap altre ús), i arriben a `useUIState().externalConfig`. Sense eixes claus (socdepoble.org), el front ho diu honestament: «La traducció automàtica no està disponible en este servidor».
- **Model B:** el front parla amb una interfície neutra, `tradueix(textos, desti)`, i no sap res ni de DeepL ni de WordPress. Si demà un altre amfitrió oferix el servei, n'hi ha prou de canviar l'URL.

**El meu carril (front):**

- El botó «Traduir» de `BarraBlava.jsx` obrirà un menú Pedra Seca amb la llista tancada Castellà, Anglés, Francés i Alemany, i «Original» quan la pàgina ja està traduïda.
- `useAccions` cridarà el servei; la pàgina canviarà el títol i el cos sense recarregar, amb un avís «Traduït automàticament del valencià · Veure l'original».
- Per la P2 del Mestre, l'eixida de sessió dels Ajustos deixarà de fer `window.location.reload()`, que a WordPress recarregava l'amfitrió sencer.

**Revisió adversarial del meu carril (en dues fases, 36 agents):** 29 troballes, 28 confirmades (2 P1, 11 P2, 15 P3). La refutada és l'«entregat» de la llavor de l'espècimen: es pinta com a «enviat», que és un estat real, i per això és neteja i no defecte. Les corregisc ara, juntament amb el traductor.

#### C7 · Ronda automàtica (23:55)

Tall per `ls -lT` (23:54). **FET: l'endpoint encara no existix.** `grep -rn -i` de `traduir`, `deepl` i `traductor` sobre `wordpress-plugin/includes`, `templates`, `socdepoble-enxufe.php`, `readme.txt` i `uninstall.php`: zero. `includes/` continua a les 21:11:34. `PedraSecaEmbed.jsx` (21:55:23) i `host.js` (29/09, 16:55:37) no porten cap `traductor`. `Dialeg.jsx` i `layout.css` (23:02:38) no han canviat des de la reverificació de C6. El que hi ha és el contracte: la ronda D1 de Codex (`260930_2150_auditoria_codex.md:168-174`, 23:48:51) i l'ampliació D1 del pla (`260930_2143_pla_implementacio_codex.md:61-75`, 23:44:57). Esta ronda audita eixe contracte i els punts del plugin on s'endollarà; no certifica codi que no existix.

**Proves en este tall:** `node --test tests/enxufe-pantalla.test.mjs tests/enxufe-plugin.test.mjs tests/dist-secrets.test.mjs`: **22/22** (4 + 13 + 5). Cap prova nova de Codex a `tests/` (grep de `traduir` i `deepl`: zero).

**Esmenes D1 de Codex: l'auditoria les dona per bones** (FET de lectura del nucli de WordPress del lloc local, `~/Studio/socdepoble`).

- **Sense nonce.** Sense nonce, `rest_cookie_check_errors` tracta la petició com a anònima i la deixa passar (`wp-includes/rest-api.php:1155-1158`). Amb un nonce ranci d'una pàgina en memòria cau, respon 403 a tothom (`:1162-1166`). El nonce anònim és el mateix per a tots els visitants (`pluggable.php:2487` i `:2542`, `nonce_user_logged_out`) i viu 24 h en torns de 12 (`:2454-2456`). No protegix la quota. Retire el nonce de la meua proposta de les 23:40; `credentials: 'omit'` és correcte.
- **L'origen és el control que importa.** `rest_send_cors_headers` reflectix qualsevol `Origin` amb `Allow-Credentials` (`rest-api.php:805-816`). Sense el 403 `sdp_traduccio_origen`, qualsevol web podria gastar la quota des dels navegadors dels seus visitants, i el límit per client no ho frenaria, perquè cada visitant té la seua IP. El 415 per a tot el que no és JSON obliga les peticions creuades a passar pel preflight.
- La confirmació des del front correspon al coordinador.

**Troballes (FETS):**

- **C7-1 · P2 (FET) · Dos canals de descobriment en els papers de Codex.**
  - El pla (`pla:67` i `:75`) anuncia un global nou, `window.SocDePobleServeis.traduccio` (`url`, `targetLangs`, `maxCharacters`), i un `GET …/traduir/config`.
  - L'informe (`auditoria_codex:172`) accepta `traductor-url` per instància i `traductorUrl` a `externalConfig`.
  - El global queda fora del contracte d'amfitrió, que només en té un (`global: 'SocDePobleConfig'`, `vite.standalone.config.js:176`), i no passaria per `sanejaConfig`.
  - Proposta: un sol canal, l'atribut. Cal retirar del pla el global i el `GET /config`: la llista tancada ja és al contracte, i el servidor la valida amb 400. Si `/config` es queda, que no exposi el pressupost restant.
- **C7-2 · P2 (FET, correcció pròpia) · «La mateixa guarda que `fonts-href`» era una mala proposta meua.**
  - `PedraSecaEmbed.jsx:357-361` també accepta `fonts.googleapis.com`, `fonts.bunny.net` i `ORIGEN_DEL_PAQUET`, que pot ser un CDN: els textos dels veïns podrien acabar en un altre origen. Per a `traductorUrl`, només ha de valer `u.origin === window.location.origin`.
  - Cal donar-la d'alta a `ATRIBUTS` (`:183-198`), a `CLAUS_PERMESES` (`:200-205`) i a `CAMPOS_URL` (`:312`). Sense `CLAUS_PERMESES`, la clau desapareix en silenci.
  - El bucle conserva la cadena crua (`:341-363`): cal guardar `u.href`. Una ruta relativa sense barra (`wp-json/…`) es valida contra l'origen, però `fetch` la resoldria contra el camí de la pàgina (`/pedra-seca-demo/wp-json/…`).
  - Prova: un origen alié, el del paquet, `fonts.googleapis.com`, `//host` i `javascript:` desapareixen; una ruta `/wp-json/…` arriba absoluta.
- **C7-3 · P2 (FET) · L'atribut nou toca tres guardes que s'han de moure juntes.**
  - Les tres guardes: `CONTRACTE_AMFITRIO.atributs` (`vite.standalone.config.js:173-179`, que el manifest publica per a Sollutia), la llista blanca de `wp_kses` (`marcatge.php:307-313`) i les proves `enxufe-plugin.test.mjs:183` i `:187`.
  - El bloc passa per `wp_kses` (`bloc/render.php:12-22`) i el shortcode no. Si només canvia l'element, el traductor funciona amb el shortcode i desapareix amb el bloc.
  - Les dues proves eixiran roges, i és bo: s'amplien, no s'afebleixen.
  - El marcatge de referència (`marcatge.php:369-378`) no ha de portar `traductor-url`: un altre amfitrió que el copiara cridaria este WordPress i rebria un 403 d'origen.
  - Proposta: emetre l'atribut només quan el servei està disponible, és a dir, amb clau i amb pressupost > 0. Si no, el front oferix un menú que sempre acaba en 503.
- **C7-4 · P2 (FET) · El ZIP no passa per cap porta de secrets.**
  - `empaqueta.mjs:44-47` i `:374-380` empaqueten tot el que no és ocult dins d'`includes/`, `templates/` i `languages/`.
  - `findDistSecrets` (`tooling/lib/dist-secrets.mjs:6-10`) no té cap patró de DeepL, i només l'usa `tractor-consell-core.mjs:326`.
  - Una clau posada «per a provar» en un PHP d'`includes/` viatjaria dins del paquet.
  - Proposta: abans de fer el zip, escanejar les entrades de l'adaptador i de `dist/` amb la forma de clau de DeepL (UUID amb `:fx` opcional), amb una prova de fixture sintètica com la de `dist-secrets.test.mjs`.
  - A favor (FET): el `loadEnv(mode, cwd, '')` de `vite.standalone.config.js:305` només alimenta la configuració, `import.meta.env` només porta `VITE_*`, i `pla:63` prohibix `VITE_DEEPL_API_KEY`.
- **C7-5 · P2 (FET) · El readme no declara DeepL.**
  - La secció «External services» (`readme.txt:29-39`) no el nomena. WordPress.org exigix dir què s'envia (el text de la pàgina quan el visitant tria un idioma), a qui (`api.deepl.com` o `api-free.deepl.com`) i amb quines condicions (enllaços als termes i a la privadesa de DeepL).
  - També cal actualitzar la capçalera (`socdepoble-enxufe.php:28-35`: «qualsevol capacitat que només tinga WordPress és un defecte de contracte») i `marcatge.php:8`. El traductor és un servei opcional de l'amfitrió, amb un contracte HTTP neutre que Sollutia pot implementar igual.
- **C7-6 · P3 (FET) · La desinstal·lació no neteja el traductor.** `uninstall.php:13-28` només esborra dos opcions. Els transients de resultats, els comptadors per client i el pressupost han de portar un prefix propi i esborrar-se en desinstal·lar, també en multisite.
- **C7-7 · P3 (FET) · El WordPress local porta una còpia vella del plugin.**
  - `~/Studio/socdepoble/wp-content/plugins/wordpress-plugin` és una carpeta, no un enllaç, de les 06:02. El seu `readme.txt` fa 6547 B, i el del repositori, 5738 B.
  - Una prova de punta a punta allí no exercitaria l'endpoint nou sense tornar a copiar el plugin. L'informe ha de dir quina còpia s'ha provat.
  - A Studio, l'entorn del procés no veu el fitxer d'entorn del repositori. La clau ha d'entrar com a constant al `wp-config.php` del lloc, fora del repositori, i mai a `includes/`.

**Sospites de disseny (per a quan hi haja codi):**

- **C7-S1 · P2 · El bloqueig global serialitza tot el lloc.**
  - El pany de `pla:75` cobrix també la crida a DeepL: mentre una traducció espera el proveïdor, qualsevol altra rep un 503 `ocupada`.
  - Proposta: fer atòmica només la reserva de pressupost; evitar la doble facturació amb un pany per clau de memòria cau; tornar el pressupost reservat si DeepL falla.
  - Sense memòria cau d'objectes persistent, `get_transient` i `set_transient` no són atòmics. Cal un pany amb `add_option` (INSERT únic) o un `UPDATE` condicional amb `$wpdb`.
  - Prova: dues peticions concurrents.
- **C7-S2 · P2 · El «client» del límit de 30 peticions cada 10 minuts no està definit.**
  - Darrere d'un proxy o d'un CDN, `REMOTE_ADDR` és el mateix per a tothom, i tot el lloc compartiria un sol comptador. `X-Forwarded-For` es pot falsificar.
  - Proposta: `REMOTE_ADDR` per defecte, un filtre per a la capçalera d'un proxy de confiança, i la IP passada per un resum amb `wp_salt()` al nom del transient. Mai en clar a `wp_options`.
- **C7-S3 · P2 · Privadesa (`requires_human_decision: true`).** En esta ronda no he verificat què fa DeepL API Free amb els textos (retenció o ús per a millorar el servei). El Xat té missatges privats. Fins que el Mestre decidisca, «Traduir» només ha d'enviar contingut públic, i el readme ho ha de dir.
- **C7-S4 · P3 · La clau i la crida a DeepL.**
  - La clau només ha de viatjar en la capçalera `Authorization: DeepL-Auth-Key` (la font que cita `auditoria_codex:174`), mai com a `auth_key` al cos ni a la consulta. Query Monitor, instal·lat al lloc local, mostra les URL de les crides HTTP.
  - Cap `error_log` d'`$args` ni del cos del proveïdor.
  - `sslverify` no ha d'anar mai a `false`, encara que Studio falle el TLS: això seria un límit de Studio, no una configuració.
  - `redirection => 0` (confirmat per Codex), `timeout` curt i `limit_response_size`.
  - URL fixa segons el sufix `:fx`. Cap URL que vinga de la petició ni d'una opció.
- **C7-S5 · P3 · Memòria cau.**
  - Només s'han de desar les respostes 200 amb `translations` de la mateixa longitud que `textos`: cap error i cap resposta parcial.
  - Per al 456, un transient curt de «quota esgotada», com un circuit, que evite tornar a cridar DeepL.
  - El nom del transient no pot passar de 172 caràcters (`option.php:1503`): prefix i resum hexadecimal de 64.
  - La HMAC amb l'empremta de la clau que proposa Codex és correcta.
- **C7-S6 · P3 · Validació abans de reservar.** Cal rebutjar l'UTF-8 invàlid, els elements que no són text, un `textos` buit i qualsevol `desti`, `origen` o `format` fora de les llistes (`enum` a l'esquema de la ruta). La ruta principal només ha d'admetre `POST`.
- **C7-S7 · P3 · Pressupost (`requires_human_decision: true`).** Els valors de 10 000 caràcters al dia i 100 000 al mes (`auditoria_codex:172`) són prudents. Però amb 5 000 caràcters per petició, només basten per a dos pàgines llargues noves cada dia. La quota de DeepL Free (no verificada en esta ronda) i el pressupost els decidix el Mestre.
- **C7-S8 · P3 · `rest_url()` es construïx des de `home_url`** (`rest-api.php:534-562`).
  - Si la pàgina es servix per https darrere d'un proxy que WordPress no detecta, o des d'un altre host (www), la guarda estricta de C7-2 rebutja l'URL, i el traductor desapareix sense cap avís.
  - Proposta: una prova amb `home` en un altre esquema, i valorar si cal emetre la ruta relativa (`wp_make_link_relative`).

**Ordre recomanat per a Codex:**

1. C7-1 (un sol canal), abans d'escriure codi.
2. C7-2 i C7-3 juntes: sanejador, contracte, `wp_kses` i proves.
3. C7-S1 i C7-S2, dins de l'endpoint.
4. C7-4, C7-5 i C7-6, abans de cap paquet.

C7-S3 i C7-S7 esperen el Mestre. Les obertes de C6 no han canviat.

#### C8 · Ronda automàtica (00:06)

Tall per `ls -lT` (00:04). **FET: l'endpoint ja existix.** Fitxers nous o tocats: `wordpress-plugin/includes/traduccio.php` (12 298 B, 23:58:08), `marcatge.php` i `socdepoble-enxufe.php` (23:58:08), `readme.txt`, `PedraSecaEmbed.jsx`, `vite.standalone.config.js` i `tests/enxufe-plugin.test.mjs` (23:58:09), `uninstall.php` (23:59:12), i les proves noves `tests/enxufe-traduccio.test.mjs` i `tests/fixtures/enxufe-traduccio.php` (23:58:09). `host.js`, `layout.css` i `Dialeg.jsx` no han canviat. L'informe de Codex continua en D1 (23:48:51): cap ronda descriu el codi, i esta auditoria el llig directament.

**Proves en este tall:**

- `node --test tests/enxufe-traduccio.test.mjs tests/enxufe-plugin.test.mjs tests/enxufe-pantalla.test.mjs tests/dist-secrets.test.mjs`: **50/50** (28 + 13 + 4 + 5). Hi ha el PHP de Studio: cap prova omesa.
- `npx vitest run src/PedraSecaEmbed.config.test.jsx`: **76/76**.
- Límit: les proves PHP criden les funcions directament amb dobles. No passen per `WP_REST_Server` ni per l'`option.php` real. La còpia del plugin a Studio (`~/Studio/socdepoble/wp-content/plugins/wordpress-plugin/includes`, 06:02:44) no té `traduccio.php`: encara no hi ha cap prova de punta a punta possible. El hook del torn ha bloquejat la consulta web: la retenció de DeepL API Free i la facturació de les etiquetes HTML continuen sense verificar.

**Contrastat i correcte (FET de lectura):**

- **Clau.** Només `DEEPL_API_KEY`, primer com a constant i després com a variable d'entorn (`traduccio.php:11-14`). Viatja només a `Authorization: DeepL-Auth-Key` (`:227`), sense cap `error_log`, i el missatge d'error és fix (`:18`). El descobriment només diu `available` (`:21-28`). El nom del transient és una HMAC amb `wp_salt` (`:120`). `enxufe-traduccio.test.mjs:20` busca la clau en tota l'eixida. C7-S4, tancada.
- **SSRF.** URL fixa segons el sufix `:fx` (`:217`); `redirection => 0`, `timeout` 15 i `limit_response_size` 131072 (`:222-229`); `sslverify` per defecte. Cap URL ve de la petició: la prova «URL injectada» dona 400.
- **Validació** (`:51-56`, `:153-180`):
  - rebutja claus desconegudes;
  - `textos` ha de ser un array JSON, no un objecte, amb entre 1 i 50 elements;
  - `desti` pertany a la llista tancada, `origen` ha de ser `'CA'` i `format`, `text` o `html`;
  - UTF-8 vàlid, com a màxim 5000 caràcters i 20000 bytes, i un cos de 32768 bytes com a màxim.
  
  C7-S6, tancada.
- **Memòria cau.** Va per text, deduplicada i amb l'ordre conservat. Només desa respostes 200 completes, durant 7 dies (`:250-253`). Amb caducitat, WordPress la desa sense autoload (`option.php:1550-1552`, nucli local); sense caducitat, s'autocarregaria a cada pàgina. C7-S5, tancada, excepte el circuit del 456 (C8-7).
- **Ritme.** `REMOTE_ADDR` passa per una HMAC i `X-Forwarded-For` s'ignora (`:197`). C7-S2, tancada en la part base.
- **HTML.** `tag_handling=html` només s'envia amb `format:'html'` (`:219-221`). La resposta és JSON, amb `Cache-Control: no-store` (`:145`) i el `nosniff` del nucli (`class-wp-rest-server.php:337`). L'HTML traduït no es saneja al servidor: ho ha de fer el front, i això és del meu carril.
- **Sense clau.** 503 `sdp_traduccio_sense_clau` abans de mirar el cos (`:57-59`). L'atribut només s'emet si hi ha clau (`marcatge.php:243-245`).
- **Descobriment.** `traductor-url` passa per `sanejaConfig` amb una guarda estricta de mateix origen (`PedraSecaEmbed.jsx:212-221`) i està donat d'alta a totes les guardes: `ATRIBUTS` (`:198`), `CLAUS_PERMESES` (`:205`), el contracte (`vite.standalone.config.js:178`) i `wp_kses` (`marcatge.php:318`). La prova s'ha ampliat, no afeblit (`enxufe-plugin.test.mjs:183`). No hi ha cap global `SocDePobleServeis`, i `GET /traduir/config` no exposa el pressupost. C7-1, tancada; C7-2 i C7-3, tancades en el principal.
- **Readme.** Declara DeepL com a servei extern, diu què s'hi envia i enllaça els termes i la privadesa (`readme.txt:41-49`). C7-5, tancada.
- **El vector `_method` + `_jsonp` és tancat.** FET del nucli:
  - `serve_request` canvia el mètode amb `?_method=` (`class-wp-rest-server.php:390-391`) i JSONP està actiu per defecte (`:316-321`);
  - `get_param` recorre a la consulta quan no troba el paràmetre al cos (`class-wp-rest-request.php:361-384`);
  - per tant, un `<script src="…/traduir?_method=POST&_jsonp=f&textos[]=…">` des d'una altra web arribaria al POST sense `Origin` i podria llegir la resposta.
  
  El paren el 415 sense `Content-Type` JSON (`traduccio.php:51-53`) i la lectura exclusiva amb `get_json_params()` (`:153`). Cap prova ho fixa, perquè el fixture no passa per `WP_REST_Server`.

**Correccions pròpies:**

- **C7-3.** Proposava emetre l'atribut només «amb pressupost > 0». Era un error: una pàgina en memòria cau congelaria eixe estat. Codex fa bé de condicionar-lo només a la clau: l'esgotament arriba en temps d'execució, com a 429.
- **C7-S1, el retorn del pressupost.** Proposava retornar-lo quan DeepL falla. Codex no el retorna perquè un timeout pot haver-se facturat (`traduccio.php:93-95`), i en el cas del timeout té raó.
- **C7-S1, el pany.** Proposava un pany amb `add_option` (INSERT únic). També era un error: vegeu C8-1.
- **El meu contracte de les 23:40.** Deia que el front «només pinta el `message`», però el missatge és fix i en anglés (`:18`). El front ha de traduir per `code`, i ho assumisc al meu carril.

**Troballes:**

- **C8-1 · P2 (FET del nucli; l'escenari de `notoptions` és SOSPITA) · `add_option` no és un INSERT atòmic. Ni el pany ni la creació del pressupost fan el que la prova certifica.**
  - `add_option` primer consulta `get_option` (o la memòria cau `notoptions`) i després fa `INSERT … ON DUPLICATE KEY UPDATE` (`option.php:1119-1126` i `:1142`). Si dues peticions fan la consulta alhora, totes dues escriuen i reben `true`: l'actualització dona 2 files afectades.
  - **Pany** (`traduccio.php:79` i `:85`): dos processos creuen tindre'l i criden DeepL. El CAS del pressupost (`:113`) evita passar del sostre, però no la doble facturació que el pany havia d'evitar.
  - **Pressupost** (`:99`): si hi ha una memòria cau d'objectes persistent i `notoptions` queda rància per una actualització perduda, `add_option('{}')` se salta la consulta i reescriu el comptador. El pressupost diari i el mensual tornen a zero.
  - **La prova no ho pot vore.** El fixture reimplementa `add_option` amb `INSERT OR IGNORE` (`fixtures/enxufe-traduccio.php:44`), un primitiu atòmic que WordPress no fa servir. «Petició simultània» (`enxufe-traduccio.test.mjs:108-112`) és una reentrada dins del mateix procés, on `get_option` ja veu el pany.
  - Proposta:
    - `INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'off')` amb `$wpdb->query`, comprovant `1 === $resultat`, per al pany i per a la creació del pressupost;
    - un fixture que imite el nucli (consulta + upsert), perquè la prova isca roja amb l'`add_option` actual.
- **C8-2 · P2 (FET) · Dues peticions esgoten el pressupost diari de tot el lloc.**
  - El límit per client compta peticions (`:202`), no caràcters, i el pressupost és global (`:109`). Cada petició admet 5000 caràcters: dos POST des de `curl`, amb l'`Origin` falsificat (fora del navegador no costa res), deixen el traductor en 429 per a tots els veïns fins a mitjanit UTC.
  - Amb IPv6, cada adreça d'un /64 és un client nou (`:197` resumix l'adreça sencera): el límit de 30 no frena qui tinga un bloc.
  - El cost queda acotat, i la decisió del Mestre funciona; la disponibilitat, no.
  - Proposta: un sostre de caràcters per client (per exemple, 2000 al dia) i el resum del /64 en IPv6. Els valors: `requires_human_decision: true`.
- **C8-3 · P3 (FET) · En WordPress real, una petició sense `Origin` rep 403, i la prova diu «CLI permesos».**
  - Per què:
    - `WP_REST_Request::get_header` torna `null` si la capçalera no hi és (`class-wp-rest-request.php:216-217`);
    - `'' !== null` és cert (`traduccio.php:45`), així que el codi calcula l'origen;
    - `wp_parse_url(null)` passa a `''` (`http.php:763`), l'origen calculat és `''`, no coincidix i ix 403.
  - El fixture torna `''` (`fixtures/enxufe-traduccio.php:28`), i per això `enxufe-traduccio.test.mjs:85` passa amb 200.
  - Als navegadors no canvia res: amb `fetch` en mode `cors`, un POST sempre porta `Origin`. Ho diu l'especificació Fetch; no ho he comprovat al navegador en esta ronda. Però una prova de punta a punta amb `curl` sense `-H Origin` rebrà un 403 que pareixerà una avaria.
  - Proposta: decidir-ho explícitament. Preferisc rebutjar l'absència amb `null === $origen`, perquè tanca el vector `_method` per una segona via. Caldria que el fixture torne `null` i que el readme ho diga.
- **C8-4 · P3 (FET) · El pany global cobrix la crida a DeepL (C7-S1, ara en codi).**
  - El pany (`:186-188`) tanca també la crida (`:222`, dins del `try`). Mentre una traducció nova espera DeepL, fins a 15 s, qualsevol altra traducció no cachejada rep un 503 `ocupada`. El readme ho declara (`readme.txt:47`).
  - A l'escala d'un poble pot ser acceptable. El front ha de tractar `sdp_traduccio_ocupada` com un «torna-ho a provar», i això és del meu carril.
  - Si el trànsit creix: un pany per clau de memòria cau, amb la reserva atòmica que ja hi ha, evita la doble facturació sense serialitzar tot el lloc.
- **C8-5 · P3 (FET) · Hi ha codis d'error fora del contracte.**
  - `sdp_traduccio_pressupost` (503, `:103` i `:207`) no és a la llista de D1 (`auditoria_codex:174`).
  - El nucli pot respondre abans que el plugin, amb `rest_invalid_json` (400) i `rest_no_route` (404).
  - Proposta: afegir-lo a la llista. El front mapeja per `code` i té un missatge genèric per a la resta.
- **C8-6 · P3 (FET) · `available` no té en compte els límits.**
  - Amb clau, `/traduir/config` diu `available: true` (`:26`) i l'atribut s'emet, encara que `SDP_TRADUCCIO_LIMIT_DIARI` valga 0.
  - Un valor que no és enter també es convertix en 0 sense avís (`:64-67`): un `define('…', '5000')`, amb cometes, apaga el servei.
  - Proposta: exigir clau i límits > 0 tant per a `available` com per a l'atribut, i avisar al readme que el valor ha de ser un enter.
- **C8-7 · P3 (FET) · No hi ha circuit per al 456 ni senyal per a una clau rebutjada.**
  - Quan la quota de DeepL està esgotada (456) o la clau no és vàlida (403), cada intent torna a cridar DeepL i crema pressupost local (`:230-239`).
  - Amb una clau invàlida, els veïns veuen un 429 `limit` i l'administrador no veu res.
  - Proposta: un transient curt de «proveïdor bloquejat» per al 403 i el 456, sense la clau ni el cos, i una línia a Salut.
- **C8-8 · P3 (FET) · El marcatge de referència porta `traductor-url`.**
  - `marcatge.php:381` reutilitza `socdepoble_enxufe_element()`, que afig l'URL d'este WordPress quan hi ha clau (`:243-245`). És el text que la pàgina d'ajustos oferix per copiar a Sollutia o a una pàgina estàtica.
  - El sanejador d'un altre origen el descarta, així que no hi ha risc per a les dades; però contradiu el contracte neutre (C7-3).
  - Proposta: un paràmetre per ometre'l a la referència i una asserció a `enxufe-plugin.test.mjs`.
- **C8-9 · P3 (FET) · El sanejador conserva la cadena crua.**
  - `PedraSecaEmbed.jsx:219` torna `valor`, validat contra `window.location.origin`, però `fetch` resol una ruta relativa contra `document.baseURI`. Si la pàgina amfitriona té un `<base href>` d'un altre origen, la validació i la petició no coincidixen.
  - Proposta: tornar `url.href` (C7-2). Mentrestant, el meu consumidor el resoldrà contra `window.location.origin`.
- **C8-10 · P3 (SOSPITA, lligada a C7-S3) · Oracle de pertinença.**
  - Les peticions cachejades no passen pel límit (`:182-185`) i la resposta diu `cache: true`. Si algun dia es traduïx contingut privat, qualsevol podrà comprovar, sense límit, si un text exacte s'ha traduït en els últims 7 dies.
  - A més, cada resposta cachejada fa fins a 50 `get_transient`.
  - Mentre el Mestre no decidisca C7-S3, el front només traduïx contingut públic.

**Obertes d'abans:**

- C7-4: `tooling/lib/dist-secrets.mjs` no té cap patró de DeepL (grep: zero).
- C7-6, parcial: la desinstal·lació esborra el pressupost i el pany; els transients caduquen sols, i el readme ho diu (`:49`).
- C7-7: la còpia de Studio no té `traduccio.php`.
- C7-S3 i C7-S7: esperen el Mestre.
- C7-S8.

**Ordre recomanat per a Codex:**

1. C8-1: el primitiu i el fixture.
2. C8-3: el fixture amb `null` i la decisió.
3. C8-5 i C8-6.
4. Copiar el plugin a Studio i definir la clau com a constant al `wp-config.php` del lloc, fora del repositori.
5. Prova de punta a punta, amb `curl -H Origin` i des del front.

C8-2 espera els valors del Mestre. **La connexió encara no fluïx de punta a punta:** el servidor està escrit i provat amb dobles, però cap WordPress l'executa.

#### C9 · Ronda automàtica (00:16)

Tall per `ls -lT` (00:13). **FET: el codi de Codex no ha canviat des de C8.** `traduccio.php` (12 298 B, 23:58:08), `marcatge.php`, `socdepoble-enxufe.php`, `readme.txt` (8103 B, 23:58:09), `uninstall.php` (23:59:12), `PedraSecaEmbed.jsx` (34 935 B, 23:58:09), `vite.standalone.config.js`, `tests/enxufe-traduccio.test.mjs` i el seu fixture tenen la mateixa mida i la mateixa hora. `host.js`, `layout.css` i `Dialeg.jsx`, igual que en C7. L'informe de Codex continua en D1 (23:48:51). L'únic document nou del carril és el pla de Codex (`260930_2143_pla_implementacio_codex.md`, 00:06:28), desat onze segons abans que C8 (00:06:39): respon C7, no C8. C8-1 a C8-10 continuen sense resposta escrita.

**Proves en este tall:**

- `node --test tests/enxufe-traduccio.test.mjs tests/enxufe-plugin.test.mjs tests/enxufe-pantalla.test.mjs tests/dist-secrets.test.mjs`: **50/50** (28 + 13 + 4 + 5), cap omesa.
- `npx vitest run src/PedraSecaEmbed.config.test.jsx src/data/traductor.test.js`: **88/88** (2 fitxers). El segon és el client del meu carril; l'execute per contrastar el contracte de punta a punta.
- Límit, el mateix de C8: dobles, sense `WP_REST_Server`. La còpia de Studio continua sense `traduccio.php` (`includes/` de les 06:02:44; el seu `marcatge.php` fa 14 755 B, i el del repositori, 15 008). Cap crida real a DeepL: que DeepL accepte `source_lang=CA` només ho diu la consulta de les 23:40. El fixture traduïx qualsevol llengua (`fixtures/enxufe-traduccio.php:71`), i cap prova ho pot desmentir.

**Contrastat i correcte (FET):**

- **Lots del nucli.** `/batch/v1` no pot embolcallar `/traduir`: el nucli rebutja qualsevol ruta sense `allow_batch['v1']` (`class-wp-rest-server.php:1795-1808`), i la ruta no el declara (`traduccio.php:265-269`).
- **C8-9, neutralitzada al consumidor.** `urlDeServei` resol l'URL contra `location.href` i passa a `fetch` l'`href` absolut (`src/data/traductor.js:92-96`): un `<base href>` alié ja no desvia la petició. Queda com a divergència del pla (C9-1).
- **Client i servidor parlen el mateix contracte.** El client envia exactament les quatre claus, amb `Content-Type: application/json` i `credentials: 'omit'` (`traductor.js:182-186`), i els seus límits per lot copien els del servidor (`:41`; `traduccio.php:161` i `:175`). `sense_clau`, `mida`, `limit` i `ocupada` tenen missatge propi; la resta, el genèric (`useTraduccioPagina.js:39-51`).

**Troballes:**

- **C9-1 · P2 (FET) · El pla de les 00:06 descriu un D2 que el codi de les 23:58 no té.** El pla ho escriu en present, com a contracte (`pla:65-72`). El codi, no:
  - «No hi ha … GET/config» (`pla:65`): la ruta hi és (`traduccio.php:270-274`), i el readme la documenta (`readme.txt:45`).
  - «La referència HTML copiable … omet el servei local» (`pla:65`): `marcatge.php:381` continua reutilitzant l'element amb `traductor-url` (`:243-245`). És C8-8.
  - «URL HTTP(S) absoluta normalitzada» (`pla:65`): el sanejador torna la cadena crua (`PedraSecaEmbed.jsx:219`), i la prova ho fixa (`PedraSecaEmbed.config.test.jsx:466-467`, `toBe(valor)` amb una ruta relativa). Quan Codex normalitze, eixa expectativa canviarà, i serà correcte: la prova s'amplia, no s'afebleix.
  - «Pany per text i pany curt per reserva» (`pla:68`): el pany continua sent global i cobrix la crida (`traduccio.php:76-90` i `:186`). És C8-4.
  - «429/456 pausa 60 s» (`pla:68`): no hi ha cap circuit (`:234-236`). És C8-7.
  - «Desinstal·lació elimina … transients de BD» (`pla:69`): `uninstall.php:22-23` i `:29-30` només esborren el pressupost i el pany, i el readme diu el contrari que el pla (`readme.txt:49`, «transient data expires normally»).
  - «Porta d'empaquetat busca claus DeepL» (`pla:69`): `grep -i deepl` sobre `tooling/lib` i `wordpress-plugin/eines` dona zero. És C7-4.
  - «Servidor REST real en BD temporal» (`pla:72`): cap prova passa per `WP_REST_Server`.
  - Proposta: que el pla marque cada punt com a fet o pendent, amb la prova que el cobrix. Fins llavors, el pla és intenció: esta auditoria certifica el codi de les 23:58, no el pla.
- **C9-2 · P2 (FET; interfície entre carrils, la correcció és del carril de Claude) · Una pàgina de més de 10 000 caràcters no es pot traduir el mateix dia, però cada intent crema el pressupost diari de tot el lloc.**
  - El client admet fins a 4 lots de 5000 caràcters (`traductor.js:41`), un darrere de l'altre (`:237`). El pressupost diari per defecte és de 10 000 (`traduccio.php:109`).
  - Una pàgina de 12 000 caràcters: els lots 1 i 2 reserven 10 000 i es traduïxen; el lot 3 rep 429 (`:109-110`); el client ho descarta tot (`traductor.js:223`, «mai es torna una traducció a mitges»). Resultat: cap traducció, i 429 per a tots els veïns fins a mitjanit UTC.
  - El comentari de `traductor.js:38-40` diu que una pàgina més llarga «no s'emporta el pressupost». Amb els valors per defecte, no és cert.
  - La memòria cau ho alleuja: l'endemà els lots 1 i 2 ja no gasten, i la pàgina acaba traduint-se, però a costa del pressupost de dos dies.
  - Proposta: `lots: 2` (el pressupost diari per defecte dividit pel màxim per petició) i el comentari corregit. Si el Mestre puja el pressupost (C7-S7), els lots pugen amb ell. Prova: una pàgina de tres lots rep `MASSA_LLARGA` sense cap petició.
- **C9-3 · P3 (FET de codi; que DeepL no factura estos casos és SOSPITA, sense web en esta ronda) · El pressupost local es crema també quan DeepL no ha pogut facturar.**
  - La reserva es fa abans de la xarxa (`traduccio.php:213`), i cap error la retorna (`:230-239`). Per al timeout, Codex té raó (C8, correccions pròpies). Però hi ha errors on DeepL no ha traduït res:
    - `pre_http_request` (`class-wp-http.php:277-281`) i `WP_HTTP_BLOCK_EXTERNAL` (`:301-307`, `http_request_not_executed`) tornen un `WP_Error` sense tocar la xarxa;
    - els errors de DNS, de connexió i de TLS (el cas de Studio de C7-S4) fallen abans d'enviar el cos;
    - 400, 403 (clau rebutjada), 429 i 456 (quota esgotada) són rebutjos de DeepL.
  - Efecte: un lloc mal configurat (TLS de Studio, HTTP extern bloquejat, clau revocada) queda en 429 per a tothom després de dos clics, i l'administrador no veu cap causa (C8-7).
  - Proposta: retornar la reserva amb el mateix CAS quan l'error és `http_request_not_executed` o la resposta és 400, 403, 429 o 456; conservar-la per a 5xx, timeouts i errors ambigus. Ha d'anar amb el circuit de C8-7: si no, retornar la reserva convertiria cada 429 de DeepL en una crida gratuïta més. Prova al fixture: un `transport` amb `http_request_not_executed` i un 403 deixen `budget.diari` com estava.
- **C9-4 · P3 (SOSPITA) · La clau viatja com a argument de cadena per tres funcions auxiliars, i una traça de pila en pot escriure el principi.**
  - `$clau` és un paràmetre de `socdepoble_enxufe_traduccio_cache` (`traduccio.php:119`), de `_lot` (`:123`) i de `_resposta` (`:140`).
  - PHP escriu els arguments a les traces d'excepció quan `zend.exception_ignore_args` val `Off`, el valor per defecte sense el `php.ini` de producció, i talla les cadenes a 15 bytes (`zend.exception_string_param_max_len`). Una excepció no capturada dins de `get_transient` o `set_transient` (per exemple, un *drop-in* de memòria cau d'objectes que llança) deixaria al registre `socdepoble_enxufe_traduccio_lot(Array, 'ES', 'text', 'xxxxxxxx-xxxx-x...')`.
  - No és explotable (en queden 76 bits), però contradiu «la clau no apareix mai als registres».
  - Proposta: calcular una sola vegada una empremta (`hash_hmac('sha256', $clau, wp_salt('auth'))`) i passar-la a les tres funcions. La clau només entra a la capçalera de `wp_remote_post` (`:227`), i la memòria cau continua separada per clau. `#[\SensitiveParameter]` (PHP 8.2) també serviria, però només en una línia pròpia: en PHP 7, `#` obri un comentari.
  - Límit de WordPress, no del plugin: la capçalera `Authorization` arriba a qualsevol extensió enganxada a `pre_http_request` (`class-wp-http.php:277`) o a `http_api_debug` (`:297` i `:305`). El readme ho hauria de dir en una línia, al costat del límit de compte que ja recomana (`readme.txt:47`).
- **C9-5 · P3 (FET) · Cap prova comprova l'esquema de l'autenticació.**
  - El fixture substituïx la capçalera sencera per `'REDACTED'` abans de registrar-la (`fixtures/enxufe-traduccio.php:62`), i cap prova la mira. Amb `Bearer …` o `DeepL-Auth-key …`, les 28 proves passarien, i DeepL respondria 403 (→ 502).
  - La clau a l'URL o al cos sí que la cobrix la prova (`enxufe-traduccio.test.mjs:20`): les traces porten els dos sense redactar.
  - Proposta: que el fixture registre només l'esquema (`DeepL-Auth-Key <redactada>`) i que una prova l'afirme.

**Obertes d'abans, sense canvis de codi:** C8-1, C8-2, C8-3, C8-4, C8-6, C8-7, C8-8 i C8-10. C8-5, tancada al contracte (`pla:70` porta `pressupost` entre els 503). C7-4; C7-6, parcial; C7-7 (Studio, 06:02:44); C7-S8. C7-S3, C7-S7 i C8-2 esperen el Mestre.

**Ordre recomanat per a Codex:**

1. Contestar C8 per escrit: el pla és anterior a la ronda.
2. C8-1 i C8-3: el primitiu, el `null` i un fixture que imite el nucli.
3. Portar el codi al pla (C9-1), o corregir el pla.
4. C9-3 amb C8-7: és la mateixa branca d'errors.
5. C9-4 i C9-5: canvis xicotets, sense canvi de comportament.
6. Copiar el plugin a Studio, definir la clau com a constant al `wp-config.php` del lloc, i fer la primera crida real. Que DeepL accepte `CA` només es pot confirmar així.

**La connexió encara no fluïx de punta a punta:** servidor i client existixen i parlen el mateix contracte en proves amb dobles (50/50 i 88/88), però cap WordPress executa `traduccio.php` i cap petició ha arribat a DeepL.

#### C10 · Ronda automàtica (00:29)

Tall per `ls -lT` (00:24). **FET: Codex ha aplicat D2 a les 00:20:18.** Tretze fitxers tenen eixa hora: `traduccio.php` (13 891 B), `marcatge.php`, `socdepoble-enxufe.php`, `readme.txt`, `uninstall.php`, `eines/empaqueta.mjs`, `tooling/lib/dist-secrets.mjs` i `PedraSecaEmbed.jsx`, i les proves `enxufe-traduccio` (amb el seu doble), `dist-secrets`, `enxufe-empaqueta` i `PedraSecaEmbed.config.test.jsx`. `host.js`, `layout.css` i `Dialeg.jsx` no han canviat des de C7. Documents nous: la ronda D2 de Codex i el seu pla (00:19:10), i dos documents de la IAIA (`261001_0025_prompt_desbloqueig_deepl.md`, 00:18:10, i un pla en blanc, 00:17:42). Esta ronda audita el codi de les 00:20:18 i el contrasta amb D2.

**Proves en este tall:**

- `node --test tests/enxufe-traduccio.test.mjs tests/enxufe-plugin.test.mjs tests/enxufe-pantalla.test.mjs tests/dist-secrets.test.mjs tests/enxufe-empaqueta.test.mjs`: **69/69** (32 + 13 + 4 + 6 + 14), cap omesa.
- `npx vitest run src/PedraSecaEmbed.config.test.jsx src/data/traductor.test.js`: **88/88** (2 fitxers).
- **La prova real de Codex (D2) està contrastada, però no l'he reproduïda:** no he llegit la clau ni he cridat DeepL.
  - L'evidència (`/private/tmp/sdp-deepl-http-evidence.json`, 00:16) diu `cache:false` i després `cache:true`, amb WordPress 7.1.2.
  - El WordPress temporal té `wp-content/plugins` buit: el mòdul s'hi va carregar amb un arnés, no activant el plugin.
  - Acredita el camí `WP_REST_Server` → `traduccio.php` → DeepL amb `source_lang=CA` → `src/data/traductor.js`. No acredita `socdepoble-enxufe.php`, l'emissió de `traductor-url`, el sanejador ni el clic.
  - El registre de crides (`sdp-deepl-http-calls.log`) continua creixent (set línies a les 00:24:45): no és una evidència fixa.
- **Clau als registres.** He buscat amb `grep -rl -E` la forma d'una clau en context (UUID amb `:fx`, `DeepL-Auth-Key <uuid>`, `DEEPL_API_KEY…<uuid>`) a les evidències de Codex de `/private/tmp` i a la BD del WordPress temporal: cap fitxer. Sense llegir `.env`.

**Contrastat i correcte (FET de lectura):**

- **C8-1, tancada.**
  - `socdepoble_enxufe_traduccio_insereix` fa `INSERT IGNORE` i exigix `1 ===` (`traduccio.php:75-97`), també per a crear el pressupost (`:106`).
  - El doble ja imita l'upsert del nucli (`fixtures/enxufe-traduccio.php:45`). «El pressupost no es reinicia» (`enxufe-traduccio.test.mjs:144-147`) eixiria roja amb el codi de les 23:58 (7 + 3 → 3).
- **C8-3, tancada per decisió.** `null` passa a cadena buida (`:42`), el doble torna `null` (`fixture:28`) i la prova és `:141-143`. Una petició sense `Origin` passa, com diu D1.
- **C8-4, tancada.**
  - Hi ha un pany per text (`:204-214`). El pany global només cobrix el ritme i la reserva, i s'allibera abans de la xarxa (`:220-243`). El `finally` ho allibera tot (`:289-296`).
  - L'ordre sempre és per text → global, sense esperes: no hi ha interbloqueig. Prova: `:131-135`.
- **C8-9, tancada.** El sanejador torna `url.href` i rebutja credencials i fragment (`PedraSecaEmbed.jsx:212-220`). Proves: `PedraSecaEmbed.config.test.jsx:467` i `:476-479`. `traductorNonce` i `deeplApiKey` no entren (`:471-472`).
- **C9-1, la part del GET.** `/traduir/config` ja no existix (`traduccio.php:299-306`; prova d'una sola ruta, `:25-30`).
- **C9-4 i C9-5, tancades.**
  - Les funcions auxiliars reben una empremta (`:128-155`, `:191`). `$clau` només apareix a `:190-191`, `:196`, `:247` i `:257`.
  - El doble registra `DeepL-Auth-Key <redactada>` (`fixture:64`), i la prova ho afirma (`:46`).
- **C7-4, tancada.** `findDeepLSecrets` (`tooling/lib/dist-secrets.mjs:19-25`) i `comprovaSecretsDeepL(entradesWp)` s'executen abans de cap ZIP (`empaqueta.mjs:468` i `:625-631`) i cobrixen l'adaptador i `dist/` (`:464-467`). Proves: `dist-secrets.test.mjs:21-28` i `enxufe-empaqueta.test.mjs:311-316`. Vegeu C10-7.
- **C7-6, tancada.** `uninstall.php:33-44` esborra `_transient_sdp_tr_%`, `_transient_timeout_sdp_tr_%` i `sdp_tr_lock_%` amb `esc_like`, lloc per lloc en multisite (`:13-24`).
- **C8-8, tancada en el codi** (`marcatge.php:236`, `:244` i `:382`). Vegeu C10-5.

**Troballes:**

- **C10-1 · P3 (FET del nucli; la prova la dona per bona perquè el doble conserva el tipus) · En WordPress real, la pausa per clau rebutjada (403) respon 429 `limit` a partir de la segona petició.**
  - `traduccio.php:265` desa l'enter `403`, i `:199` el compara amb `403 === $estat_pausa`.
  - Sense memòria cau d'objectes persistent, el transient passa per la BD. `add_option` escriu `maybe_serialize(403)` amb `%s` (`option.php:1128` i `:1142`, nucli de Studio). `get_transient` → `get_option` torna `$row->option_value` (`:206-211`) passat per `maybe_unserialize` (`:256`; `functions.php:653-658`), és a dir, la cadena `'403'`. `403 === '403'` és fals, i `:199` respon 429 `sdp_traduccio_limit`.
  - Efecte: amb una clau revocada, el primer veí veu «proveïdor no disponible» (502), i la resta, durant 60 s, «límit assolit» (429). Després, una altra crida a DeepL i un altre 403. L'administrador continua sense cap senyal (C8-7). Amb Redis o Memcached el tipus es conserva i es veu 502: el comportament depén de l'allotjament.
  - La prova `enxufe-traduccio.test.mjs:148-152` passa perquè el doble `get_transient` torna el valor PHP intacte (`fixture:57`).
  - Proposta: `403 === (int) $estat_pausa`, o desar un text (`'clau'`, `'quota'`). I que el doble torne els escalars com a cadena, com fa la BD: amb eixe doble, la prova actual ix roja.
- **C10-2 · P3 (FET de codi; l'efecte en una inundació és SOSPITA, no reproduïda) · El límit per client s'avalua dins dels panys, i el pany global no espera.**
  - L'ordre de `socdepoble_enxufe_traduir` és: panys per text (`:207-214`), relectura (`:216`), pany global (`:220`) i, només després, el ritme (`:225-232`). Una petició que ja ha esgotat el límit pren i allibera el pany global per a respondre 429.
  - `bloqueja()` no espera (`:83-97`). Qualsevol petició que el troba pres rep 503 `ocupada` (`:221-222`).
  - Escenari: un sol client que envia textos nous en bucle no gasta pressupost (cada petició ix per 429 abans de la reserva, `:241`), però manté el pany global pres una fracció del temps. Les traduccions legítimes que hi coincidixen reben 503.
  - Si C8-2 s'arregla amb un sostre de caràcters per client dins del mateix bloc, este canal continua obert.
  - Proposta:
    - una lectura del ritme (`get_transient` del client, sense escriure) abans de cap pany, que rebutja amb 429 sense prendre'n cap; l'increment es queda dins del pany global;
    - per al pany global, una espera curta i acotada (per exemple, 3 intents de 20 ms). No pot provocar un interbloqueig: l'ordre sempre és per text → global.
  - Prova: amb el ritme ja a 30, una petició no crea cap fila `sdp_traduccio_lock` ni `sdp_tr_lock_*` (comptar els INSERT al doble).
- **C10-3 · P3 (FET) · La pausa no cobrix els errors de transport, i C9-3 hi continua obert en l'únic cas segur.**
  - `is_wp_error($resposta)` (`:260-262`) torna 502 sense pausa, i la reserva ja està cremada (`:241`).
  - Amb `WP_HTTP_BLOCK_EXTERNAL` (llocs endurits o de proves) o un `pre_http_request`, WordPress no envia res (`class-wp-http.php:277-281` i `:301-307`, citats en C9-3). Tot i això, cada clic crema caràcters del pressupost diari, fins al 429 general.
  - `http_request_not_executed` és l'únic cas en què es pot afirmar que DeepL no ha facturat: retornar-hi la reserva no contradiu la decisió de Codex sobre els timeouts.
  - Proposta: per a `http_request_not_executed`, retornar la reserva amb el mateix CAS i obrir la pausa. Per a la resta d'errors de transport, una pausa curta sense retorn. Prova: un `transport` amb eixe codi deixa `budget.diari` com estava.
- **C10-4 · P2 (FET) · Cap porta executa les 32 proves del traductor.**
  - `test:node` (`package.json:78`) inclou `enxufe-plugin`, `enxufe-pantalla` i `enxufe-empaqueta`, però no `enxufe-traduccio` ni `dist-secrets`. La cadena de portes només crida `test:node` (`tooling/gates/run-portes.mjs:89`).
  - La CI crida `npm run test` (`.github/workflows/wiki-integrity.yml:59`), que és vitest, i vitest exclou `tests/**/*.test.mjs` (`vite.config.js:100`).
  - A més, sense PHP la prova s'omet (`enxufe-traduccio.test.mjs:13`), i node compta les omeses com a passades.
  - Efecte: una regressió de seguretat (clau, origen o pressupost) només la veu qui execute el fitxer a mà.
  - Proposta (fora de `wordpress-plugin/`; ho decidix el coordinador): afegir les dues proves a `test:node`, i que la porta falle quan falta PHP en compte d'ometre-les.
- **C10-5 · P3 (FET) · C8-8 està corregida sense cap prova.**
  - La correcció és a `marcatge.php:236` i `:382` (`$amb_serveis = false`) i al readme (`:46`). No hi ha cap asserció ni a `enxufe-plugin.test.mjs:358-369` ni a `enxufe-traduccio`: si la referència tornara a cridar `socdepoble_enxufe_element( array() )`, cap prova eixiria roja.
  - Proposta: executar la funció amb la clau definida i comprovar que l'eixida no porta `traductor-url`. Com a mínim, una asserció sobre el cos de la funció, com les veïnes.
- **C10-6 · P3 (FET) · L'atribut s'emet encara que el servei estiga apagat. És la part de C8-6 que queda.**
  - `marcatge.php:244` només mira la clau.
  - Amb `SDP_TRADUCCIO_LIMIT_DIARI = 0`, que és la manera documentada d'apagar el consum (readme `:48`), o amb `'5000'` entre cometes, que `traduccio.php:62-65` convertix en 0 sense avís, el menú apareix i cada clic acaba en 429 «límit assolit».
  - Proposta: una sola funció de disponibilitat (clau, i els dos límits > 0) per a l'atribut, i un avís a Ajustos o a Salut quan un límit no és un enter.
- **C10-7 · P3 (FET) · La porta de secrets deixa fora algunes extensions.**
  - `empaqueta.mjs:627` només escaneja `.php`, `.js`, `.json`, `.txt`, `.css`, `.html` i `.map`. `dist/` ja porta `.svg` (text) i un `.epub`, i una clau en un `.mjs`, un `.po` o un `.xml` futur viatjaria sense avís.
  - Proposta: escanejar totes les entrades (en `latin1`, que no falla amb els binaris) i reservar el filtre per als falsos positius, si n'hi ha.
- **C10-8 · P2 (FET de dates i de text; la via d'escriptura no la puc verificar) · Els documents diuen «NO aplicat», el codi ja ho està, i el prompt de la IAIA demana el defecte.**
  - La ronda D2 (`260930_2150_auditoria_codex.md`, 00:19:10) diu «Preparat però NO aplicat» i «zero escriptures D2». El pla (`260930_2143_pla_implementacio_codex.md:65`, 00:19:10) diu «D2/C8/C9 només preparat». A les 00:20:18, tretze fitxers tenen el contingut de la proposta: `traduccio.php` fa 13 891 B, la mateixa mida que `/private/tmp/sdp-traduccio-v3.php` (00:17).
  - `261001_0025_prompt_desbloqueig_deepl.md:64` (00:18:10) diu que s'ha suprimit a mà `SEGELL.lock`; `git status` el dona per esborrat.
  - La T1 del mateix prompt (`:65` i `:71`) mana «aplicar `add_option()`». **El codi fa el contrari, i fa bé.** C8-1 va demostrar que `add_option` és el defecte, i el pla de Codex (`:65`) diu que «`add_option` s'ha de substituir per INSERT IGNORE». Qui execute la T1 al peu de la lletra tornarà a obrir C8-1.
  - La T3 demana confirmar que el traductor «ja és completament enxufable i funciona». Esta ronda no ho pot confirmar (vegeu el final).
  - Proposta: Codex registra per quina via s'han escrit els tretze fitxers (executor amb lease o a mà) i posa al dia D2 i el pla. El Mestre corregix la T1.
- **C10-9 · P3 (FET) · Hi ha xifres enganxades al text.** Al readme de WordPress.org (`readme.txt:48`): «return503», «Provider403/429/456» i «a60-second». Al comentari de `traduccio.php:61`: «límits0». Proposta: posar-hi l'espai.

**Obertes d'abans:**

- C8-2: espera els valors del Mestre, i C10-2 hi afig un canal.
- C8-6, parcial (C10-6).
- C8-7, parcial: hi ha pausa, però cap línia a Salut (C10-1).
- C8-10: lligada a C7-S3.
- C9-2, al carril del client: `traductor.js:41` continua amb `lots: 4`, i el comentari de `:220` («503 a dos lots alhora») ja no és cert amb els panys per text.
- C9-3 (C10-3).
- C7-7: la còpia de Studio continua sense `traduccio.php` (06:02:44).
- C7-S3, C7-S7 i C7-S8.

**Ordre recomanat per a Codex:**

1. C10-8: posar al dia D2 i el pla. La correcció de la T1 és del Mestre.
2. C10-4: portar les proves a la porta.
3. C10-1: una línia al codi i el doble.
4. C10-2 i C10-3.
5. C10-5, C10-6, C10-7 i C10-9.
6. Activar el plugin en un WordPress (Studio o temporal) i fer el clic real des del navegador.

**La connexió fluïx del servidor fins a DeepL**, i el client real parla amb el servidor. Ho diu l'evidència de Codex amb WordPress 7.1.2, contrastada però no reproduïda ací. **Encara no està acreditada de punta a punta:** cap WordPress té el plugin activat amb `traduccio.php`, i ningú ha fet el clic des del navegador.

Sobre la plantilla `prompt_local`: el preflight marca «Pla d'Implementació generat» com a fet, però cap pla existia a l'Escriptori quan vaig arribar; he creat el meu (`260930_2135`). Suggeriment: que la casella la comprove una porta, no la mà.

### B. Clon de WhatsApp (carril de Claude)

El pla viu a [[260930_2135_pla_implementacio_claude]]. Tot el que segue és a `src/sections/xat/**`, als blocs `.sdp-xat*` de `modules.css`, a `src/config/i18n.js` i als espècimens del catàleg. Per l'ordre del traductor, també a la barra blava. Cap canvi a `App.jsx`, `PedraSecaEmbed.jsx`, `base.css`, `layout.css`, `Dialeg.jsx` ni `wordpress-plugin/`.

**B1 · Fet (T1, clon de WhatsApp):**

- **Full «Ajustos»** calcat de les 52 captures d'Ajustes de WhatsApp Desktop.
  - S'obri des de «Tu» al peu del rail i té una pila interna amb X o ‹ circular, cercador i targeta de perfil.
  - Files reals: Preferits, Compte (amb «Tanca la sessió»), Privacitat, Xats (amplària de les columnes), Aparença (tema i llengua) i Ajuda.
  - La resta de files, «en construcció» amb un text honest.
  - Funciona dins de l'amfitrió amb el diàleg local de Codex.
- **«Gent de la Torre»:**
  - la comunitat del poble de l'amfitrió va la primera de tot;
  - si encara no existix, una fila virtual la crea pel camí del «Comentar»;
  - en ample i en la primera arribada, s'obri el seu General;
  - en remot no es crea mai en silenci;
  - al xat de mostra sense sessió també hi és;
  - a socdepoble.org, sense amfitrió, res no canvia.
- **Conversa:**
  - grups per autor, amb la cua només a la primera bombolla;
  - separador «N missatges no llegits», calculat amb la llista al dia;
  - «Baixa al final» amb recompte;
  - respostes amb cita, que porten a l'original;
  - esborranys per conversa, que sobreviuen a la renovació del JWT i s'esborren si canvia la persona;
  - anunci discret dels nous, en lloc d'una regió en viu que ho anunciava tot.
- **Fila de la llista:** marques de l'últim missatge propi, «Tu: » als grups, pastilla grisa si està silenciada i punt si és un no llegit manual.
- **T2 · Tokens:** `68ch` passa a `--sdp-measure` i `--sdp-touch-min` a `--sdp-touch`, amb la mateixa pantalla. El `z-index: 20` es queda, perquè cap token no val 20.
- **Reserva de la barra mòbil:** segueix `.sdp-root.is-compact`, la mateixa condició que la mostra. Abans, entre 720 i 1023 px, la barra tapava el compositor.

**B2 · Fet (ordre del traductor, carril del front):**

- «Traduir» obri un menú amb Castellà, Anglés, Francés i Alemany, més «Original (valencià)» quan la pàgina ja està traduïda.
- El títol i el cos es traduïxen en local, sense recarregar, amb l'avís «Traduït automàticament del valencià · Veure l'original».
- Client neutre (`src/data/traductor.js`):
  - només accepta el mateix origen;
  - lots dins dels límits del servidor;
  - màxim d'una pàgina igual al pressupost diari (C9-2, corregit per mi: abans en deixava passar el doble);
  - errors triats pel codi del servidor.
- El cos s'envia en format text: React l'escapa i no entra cap HTML aliè.
- Sense servei (socdepoble.org), avís honest i cap navegació.
- **ORDRE DEL MESTRE (P2):** l'eixida de sessió dels Ajustos ja no fa `window.location.reload()`. Tampoc la d'«Eixir del poble» del Panell de Control, que tenia el mateix defecte a WordPress. S'ha verificat que tots els proveïdors de la persona es buiden amb la generació de sessió sense recarregar: Xat, Mur, Multimèdia, contingut, Notes, Perfil, Identitat i esborranys.

**B3 · Revisió adversarial pròpia:** 29 troballes en dues fases, 28 confirmades (2 P1, 11 P2, 15 P3). Les 28 estan corregides, cadascuna amb una prova que fallava abans de la correcció; la refutada, la neteja de l'espècimen, també s'ha fet. Les dos P1:

- el separador de no llegits es calculava amb la memòria cau rància en tornar a una conversa, i marcava com a llegits missatges que no s'havien vist;
- l'entrada del poble tornava a obrir el General a cada renovació del JWT.

**B4 · Per al Mestre (`requires_human_decision: true`):**

- P1 del pla: el nom del grup en remot, perquè el servidor posa `towns.name`.
- P3 del pla: prioritat entre Pedra Seca i «copiar al mil·límetre»: les ombres de les bombolles, l'accent i l'àrea de l'autor.
- P4 del pla: si la roda del rail també ha d'obrir els Ajustos.
- El «✓✓ gris» (entregat) necessita un `rebutPelsAltresFinsSeq` al contracte.
- Privacitat: paràmetre al Perfil, amagar la fila o deixar la nota.
- Traductor:
  - el cos en text perd els enllaços i les negretes de la vista traduïda;
  - el pressupost diari de 10.000 caràcters és curt per a pàgines llargues;
  - les targetes encara porten a `/traduccions`.
- Residu de #4: els no llegits no carregats per damunt de 4 pàgines es marquen llegits pel model de marca màxima. Cal tocar el contracte de lectura.
- **C10-8:** la T1 de `261001_0025_prompt_desbloqueig_deepl.md` mana `add_option()` per al pany, i això és el defecte C8-1. `add_option` fa `INSERT … ON DUPLICATE KEY UPDATE` i no és atòmic. Codex fa bé de no seguir-la: cal corregir la T1.

**B6 · Correcció final: l'extractor del traductor (avís de Codex en plegar, 00:57).** `blocsTraduibles.js` descartava els ocults i els editables només quan ho era el bloc o un avantpassat. El text, però, es prenia amb `textContent`, que arrossega tots els descendents. Hi havia tres forats:

- un fill ocult, de lector, un botó o un tros editable dins d'un paràgraf visible s'enviava a traduir, i es gastava pressupost;
- l'ocultació per CSS (`display: none`, `visibility: hidden`) no es mirava mai;
- només es reconeixia `contenteditable="true"`.

La correcció:

- ara un `TreeWalker` recull només els nodes de text visibles i talla els subarbres exclosos (llista de fora, `display: none` propi, `[contenteditable]:not([contenteditable="false"])`);
- la visibilitat s'avalua respecte de l'arrel: un `visibility: visible` dins d'un pare amagat es torna a vore, i l'ocultació de l'arrel mateixa (l'original amagat mentre es veu la traducció) no compta.

Proves: 4 casos nous a `blocsTraduibles.test.js`. Amb el càlcul antic, 3 són roges i ensenyen el text que es filtrava («Visible ocult lector decoratiu botó editable ·», «Element sense display», «Invisible», «Es veu no es veu», «Original intern»). La quarta, la de l'editable, depén del selector antic (`[contenteditable="true"]`), que no trobava ni l'atribut buit ni `plaintext-only`; no l'he executada amb eixe selector. Amb la correcció, `src/components`, el traductor i el catàleg donen 784 de 785; l'única roja és `MarcaAmfitrio.capes` (`layout.css`, Codex). ESLint no dona cap missatge sobre els dos fitxers.

**B7 · Ordre del Mestre de l'1-10: Calendari i Boina Taronja.** El detall és a l'acta [[261001_0245_acta_marmota_calendari_i_boina]].

- **Calendari:**
  - la pestanya del Mur es diu «Calendari» (`CalendariMur`);
  - `/calendari` (`CalendariSection`) és operativa amb totes les targetes del Mur i del Mercat i amb les pàgines del sistema;
  - el mes que es veu el governa la URL, i l'agenda de Sollutia queda com a font opcional.
- **Pastilla:** porta l'hora quan la font en té i porta al mes de publicació (`/calendari?mes=AAAA-MM`).
- **Dates de prova:** en mode seed, huit targetes d'esta setmana i les tècniques entre el 2 i el 15 de setembre.
- **Dos workflows amb revisió adversarial:**
  - primera tanda: 16 troballes, de les quals sobreviuen 9 (7 úniques);
  - segona tanda: 14 troballes, de les quals sobreviuen 7.
  - Totes estan corregides o elevades al Mestre: la barra mòbil sense «Telefonades», els tokens de la Consola, l'Aplec de 2023 i l'anell en tema clar.

**B5 · Text proposat per a `.agents/ESTAT.md`** (el meu carril no hi pot escriure: demana l'executor amb lease):

`## ESTAT_ACTUAL · 2026-10-01 · Claude (Opus 5.5) · Clon de WhatsApp al Xat i front del Traductor Sobirà` — Torn `torn_ddd7a133`. Pla [[260930_2135_pla_implementacio_claude]] i informe [[260930_2145_auditoria_claude]]. Fet: full d'Ajustos, «Gent de la Torre», conversa i fila calcades de WhatsApp, T2 de tokens, i el front del traductor amb l'eixida sense recàrrega. Revisió adversarial: 28 de 28 corregides. Proves: xat, catàleg, control, components, traductor, contextos i config, 1647 de 1648; l'única roja és `MarcaAmfitrio.capes`, de `layout.css`. `lint_xat`, 20 de 20. Pendent: la connexió WordPress→DeepL acreditada de punta a punta (Studio sense `traduccio.php`), les decisions B4 i el commit. Responsables: el Mestre (decisions i commit), Codex (plugin i Studio) i MarIA (ESTAT i LEDGER amb lease, i l'Escriptori).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves (1 d'octubre, 00:32):**
  - `npx vitest run src/sections/xat src/sections/disseny src/sections/control src/components src/data/traductor.test.js src/app/contexts src/config`: 123 fitxers, 1647 de 1648. La roja és `src/components/universal/MarcaAmfitrio.capes.test.js`, per la regla `.sdp-root.sidebar-closed .brand` de `layout.css`, carril de Codex.
  - `node --test tests/lint_xat.test.mjs`: 20 de 20 (ESLint amb zero missatges en tots els fitxers del torn, proves incloses; i18n idèntic a les cinc llengües; classes, tokens i CSS del Xat).
  - `node --test tests/lint-sessio.test.mjs`: 1 avís, `App.jsx:12`, `Boto` sense usar, de Codex.
- **Navegador** (pestanya pròpia, servidor al 3340; el shadow tancat de l'amfitrió obliga a clicar per coordenades):
  - Ajustos a la SPA: arrel, Aparença i Escape.
  - Ajustos dins de l'amfitrió: el full queda limitat a la caixa i sense vel sobre WordPress, i Escape el tanca.
  - «Gent de la Torre» la primera i el seu General obert en entrar.
  - Cues de les bombolles, mesurades amb `getComputedStyle(::before)`.
  - «Respon» de punta a punta, amb la cita a la bombolla.
  - Marques a la fila de la llista.
  - El compositor per damunt de la barra mòbil a 900×700: y 541–604 contra la barra a 608–688.
  - Traductor: sense servei, avís i cap navegació. Amb `traductor-url` des del muntatge, el menú de quatre llengües i un `POST` al mateix origen, amb un error que no trenca res.
- **Rondes C1-C10** sobre Codex: detall a la secció A.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La connexió WordPress→DeepL no s'ha acreditat de punta a punta: la còpia del plugin a Studio no porta `traduccio.php`. L'evidència real amb DeepL és de Codex, contrastada però no reproduïda ací.
- En remot, el separador de no llegits i l'entrada del poble estan provats amb dobles, no amb un Supabase viu.
- Canviar `traductor-url` després del muntatge no arriba a la interfície (P3, carril de Codex: `UIProvider`). El plugin l'emet abans, i per això no afecta el cas real.
- No he pogut executar `tancament.mjs` ni escriure a `.agents/`: el hook ho reserva per a l'executor amb lease.
- Cap commit.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
