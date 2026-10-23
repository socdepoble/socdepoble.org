---
type: informe
status: esborrany
description: Informe de Claude (torn de codi) sobre el selector d'emoticones gran (38 px, diana de 52 px) i la inserció al cursor estil WhatsApp al Compositor del xat.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9101beba-2ac7-44ae-8801-8f023cd394a7:2545c175-c840-4165-98f2-d00ec750baed
---
# Auditoria Claude: emoticones grans i paritat WhatsApp al compositor del xat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9101beba-2ac7-44ae-8801-8f023cd394a7:2545c175-c840-4165-98f2-d00ec750baed |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T13:55:28.851Z |
| Modificació | 2026-10-22T14:45:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Claude Code a l'app d'escriptori, amb un workflow de 10 subagents per a la revisió adversarial |
| Tokens consumits | no mesurat (l'agent local no té comptador fiable per torn) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-22T13:55:28Z: esborrany creat. Torn `torn_9101beba` (actor claude, scope code) obert, pla `261022_1425_pla_implementacio_emojis_grans_i_paritat_whatsapp` vinculat (`document.mjs plan`, hash b4da837b…) i fitxers propis declarats (`document.mjs own`).
- 2026-10-22T14:00Z (relleu 1): cap torn de Gemini ni cap canvi a `src/` en començar. Descoberta: `SelectorEmoticones.jsx` no existia.
- 2026-10-22T14:07Z (relleu 2): implementació completa i proves noves en verd.
- 2026-10-22T14:12Z (relleu 3): resposta a l'auditoria de Gemini (`261022_1556_auditoria_gemini`): tres infraccions de porta meues, corregides.
- 2026-10-22T14:20Z: informe sencer. Revisió adversarial per subagents en curs.
- 2026-10-22T14:40Z: revisió adversarial acabada (§3): 15 de les 16 troballes distintes confirmades estan corregides; la que queda és fora d'abast i està documentada. Proves, portes, compilació i navegador refets.
- 2026-10-22T14:45Z: la segona passada de suites va trobar una regressió meua i està corregida (§3, «Regressió pròpia»). Nota sobre l'informe de Gemini (§4).
- 2026-10-22T14:55Z: per decisió del Mestre en xat («fes el commit de la resta del torn … amb índex temporal, llista explícita de fitxers i --no-verify»), commit de la resta del torn damunt de `466fcee7d`: codi corregit, proves, claus d'i18n, `tests/lint_xat.test.mjs` i este informe. Queden fora els fitxers d'altri: `.agents/` (ESTAT, torns), l'informe de Gemini, `supabase/seed.sql`, l'índex de l'Escriptori i els documents nous de MarIA.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum

El compositor del xat té ara una carona a l'esquerra del camp que obri un calaix d'emoticones gran: glif de 38 px (2,375 rem) en botons de 52 px (3,25 rem), pestanyes de 48 px. L'emoticona entra on era el cursor (o en lloc del tros seleccionat) i el cursor queda just darrere, com a WhatsApp. En ample el focus no ix del camp i el calaix seguix obert per a posar-ne més (WhatsApp Web). En mòbil el calaix fa de teclat (WhatsApp al mòbil). Es tanca amb Escape, en clicar fora i en enviar. Comprovat amb proves i al navegador real.

### 1. Què s'ha fet (fitxer per fitxer)

- `src/sections/xat/emoticonesXat.js` (nou, pur): `inserixAlCursor` (posició en unitats UTF-16, com `selectionStart`; respecta el límit de 4.096 que el `maxLength` no frena quan escriu el codi), `EMOTICONES_DEL_POBLE` (les cinc seccions rurals del pla, 115 emoticones d'Emoji 12.0 o anteriors, cada una idèntica a la seua entrada del catàleg Emojis XL), recents en memòria (`recordaRecent`, `buidaRecents`, 18 com a màxim).
- `src/sections/xat/components/SelectorEmoticones.jsx` (nou): diàleg no modal amb pestanyes ARIA (fletxes, Inici, Fi). Primera pestanya «Del poble» (recents + tria rural); després les nou famílies del catàleg, en l'ordre de `familiesEmojis.js`. El catàleg (292 kB) arriba a demanda la primera volta i es queda en memòria; les emoticones que el navegador no reconeix (`emojiSol`) no es pinten.
- `src/sections/xat/components/Compositor.jsx`: carona (`Smile`, o `Keyboard` amb el calaix obert en tàctil), calaix, selecció recordada (select, blur, escriure), cursor posat després que el valor torne del pare, tancaments, alçada retallada a l'espai fins a la llista de missatges, avís en viu de l'emoticona afegida.
- `src/components/universal/classificacio/GraellaEmojis.jsx`: exporta la llista amb fletxes (`LlistaEmojis`) amb la prop `gran`. No es duplica la navegació per teclat.
- `src/css/components.css`: variant `.sdp-graella-emojis__graella--gran`. `src/css/modules.css`: `.sdp-xat-compositor__emojis` i `.sdp-xat-emojis*` (popover acotat a l'amplada de la columna, no a `100vw`: també encastat; `:hover` dins de `(hover: hover) and (pointer: fine)`; `prefers-reduced-motion`).
- `src/sections/xat/XatContext.jsx`: `buidaRecents()` al costat de `buidaEsborranys()` quan canvia la persona.
- `src/config/idiomes/{ca,es,en,eu,gl}.js`: 21 claus `section.xat.emoticones.*` (reintentar usa `common.reintenta`).
- Proves noves: `emoticonesXat.test.js`, `SelectorEmoticones.test.jsx` (inclou la mida gran llegint el CSS), `Compositor.emoticones.test.jsx`.
- `tests/lint_xat.test.mjs`: el component nou, el mòdul i les tres proves entren a les llistes de la porta del xat (ESLint a zero, i18n en cinc llengües, classes declarades al CSS, tokens).

### 2. Troballes i decisions

**T1 · La premissa del prompt no era certa.** `SelectorEmoticones.jsx` no existia (cap fitxer amb eixe nom al repo). Les «pestanyes existents» que demana preservar són les famílies del catàleg Emojis XL del Bloc i del Perfil (`src/sections/notes/familiesEmojis.js`).
- Severitat: baixa. Font: prompt §Tasques 1.
- Resolució: el selector del xat reutilitza el catàleg, les famílies i la llista amb fletxes. Cap còpia de codi.
- `requires_human_decision: false`.

**T2 · El pla i el prompt no demanen les mateixes categories.** El pla vol cinc categories rurals («Cares i emocions», «Gestos i cors», «Horta, camp i menjar», «Animals i natura», «Poble, eines i festes»). El prompt vol preservar les famílies del catàleg.
- Resolució: les dues coses. «Del poble» porta les cinc seccions del pla; les altres pestanyes són les famílies.
- `requires_human_decision: false`. El Mestre pot retallar la llista de «Del poble» (és dada, a `emoticonesXat.js`).

**T3 · Alçada: el prompt diu 320 px i el pla en diu 280.**
- Resolució: 320 px (`min(20rem, 60dvh)`) en ample i 280 px (`min(17.5rem, 50dvh)`) en estret, on el pla té el risc del teclat.

**T4 · «Retornar el focus al camp» i el teclat del mòbil.** En mòbil o tauleta, tornar el focus al camp després de cada emoticona obriria el teclat de la pantalla damunt del calaix.
- Resolució: en tàctil (estret, o qualsevol pantalla sense ratolí, `CONSULTA_TACTIL`), com a WhatsApp al mòbil, el calaix fa de teclat. El focus no torna al camp en triar; la carona es torna una icona de teclat que el tanca i torna al camp amb el cursor darrere de l'última emoticona; tocar el camp també el tanca. Amb ratolí, el focus sí que torna (o no ix) del camp, com a WhatsApp Web. Amb el teclat dins del calaix, el focus s'hi queda (§3, A11Y-1).
- `requires_human_decision: true` només si el Mestre vol el comportament d'ample també en mòbil.

**T5 · Infraccions de porta assenyalades per Gemini.** Totes tres eren certes i meues, i estan corregides:
- `sdp-xat-emojis__seccio` era una classe forastera/òrfena (`tractor-vocabulari`, `tractor-pedra-seca` LLEI_01). S'ha llevat.
- Dues `classe-opaca` (`GraellaEmojis.jsx`, `SelectorEmoticones.jsx`) passen a ternari de cadenes senceres.
- Evidència: després de la correcció, cap de les dues portes nomena cap fitxer d'este torn.

**T6 · Un commit aliè s'ha endut el codi a mig fer.** El commit `466fcee7d` («chore(checkpoint): salvaguarda pre-purga supabase», 16:04 local, autor «Javi Llinares»; no l'he fet jo) inclou el codi d'este torn com estava a eixa hora. Hi falten:
- les tres proves noves;
- les claus d'i18n (sense elles, la interfície cau als textos valencians de reserva en les altres quatre llengües);
- les correccions posteriors (T5, el cursor en tornar al teclat i tot el §3).

Tot això continua sense commit a l'arbre.
- `requires_human_decision: true`: si es fa commit de la resta, i com.

**T7 · Recents només en memòria.** Com els esborranys (`esborranys.js`), que el projecte manté fora de l'emmagatzematge persistent: no passen d'una persona a l'altra en una tauleta compartida. Recarregar les oblida. WhatsApp les persistix.
- `requires_human_decision: true`: si es volen persistents (per persona i dispositiu).

**T8 · Persones porta 2.430 emoticones, amb tots els tons de pell.** És l'ordre del Mestre de 261007 sobre la diversitat. WhatsApp mostra una sola emoticona per persona i el to amb una pulsació llarga.
- Proposta: un selector de to per defecte a la capçalera de la pestanya.
- `requires_human_decision: true`. No s'ha fet.

**T9 · Portes que ja eren roges abans del torn.** No s'han tocat:
- `tractor-pedra-seca`: 29 classes òrfenes noves alienes, 12 tokens fantasma del Calendari, encapsulament i subarbres;
- `tractor-vocabulari`: `classe-opaca` antigues, com `sdp-xat-compositor${…}`, que ja hi era;
- `tancament.mjs --check`: signatura del LEDGER trencada, enllaços trencats de la Wiki i de l'índex de l'Escriptori;
- `vite build`: el tros principal de 1,23 MB i l'import mixt de `backendPort.js`.

### 3. Revisió adversarial (workflow de subagents)

Cinc revisors independents, un per lent, i un verificador per lent que intentava refutar cada troballa (sondes en jsdom i en una arrel d'ombra tancada com la de `PedraSecaEmbed.jsx`; cap sonda queda al repo). Lents: cursor i focus, accessibilitat per a gent gran, CSS i mòbil, regressions i convencions, conformitat amb el pla i WhatsApp.

Resultat: 23 confirmades (16 de distintes) i 8 refutades. Les refutades eren:
- decisions aprovades sense dany concret (focus en mòbil, pestanyes en lloc d'una llista contínua, recents en memòria);
- coses ja cobertes;
- casos que no es poden donar (IME, `desactivat`).

Correccions, cadascuna amb la seua prova a `Compositor.emoticones.test.jsx`, `SelectorEmoticones.test.jsx` o `emoticonesXat.test.js`:

| Id | Sev. | Problema | Correcció |
| --- | --- | --- | --- |
| CSS-1 | alta | L'alçada només la frenava el viewport: en mòbil apaïsat el calaix pujava damunt de la capçalera i amagava les pestanyes. | El Compositor retalla el calaix a l'espai entre el seu peu i el cap de la llista (`.sdp-xat-missatges`), amb un mínim de 112 px (pestanyes i una fila). Es recalcula amb `ResizeObserver` i `resize`; sense llista, mana el CSS. Comprovat a 844×390: 126 px, comença on acaba la capçalera. |
| CSS-2 / REG-1 / PAR-1 | alta | `dvh` no és de Chrome 100-107 ni de Firefox 100 (Baseline): la declaració queia i el calaix no tenia sostre. | Primer una línia en `vh`; després la de `dvh`. |
| A11Y-3 / CSS-3 / REG-2 | mitjana | El botó «Baixa al final» (z-index 2) tapava les emoticones de la vora i se'n menjava el toc. | `.sdp-xat-compositor--emojis { z-index: 3; }` mentre el calaix és obert. Sense `:has()`, que Firefox 100 no té. |
| CUR-1 | mitjana | La restauració del cursor en tancar (afegida en este torn) usava una selecció vella si el focus ja era al camp. Dins de l'arrel d'ombra el `select` de React no arriba. | Només es restaura quan el focus venia de fora. Si no se sap on era, va al final. |
| CUR-2 / A11Y-7 / PAR-6 | mitjana | Escape no tancava si el focus no era ni al camp ni al calaix (obert amb el ratolí des de la llista, o amb el focus a la carona o a «Envia»). | Escape al `<form>` (si ningú l'ha consumit abans). Obrir amb el ratolí porta el focus al camp, com a WhatsApp Web. |
| A11Y-1 | mitjana | Amb el teclat, triar una emoticona portava el focus al camp: un segon Retorn enviava el missatge (irreversible). | Si el focus és dins del calaix, s'hi queda. |
| A11Y-2 | mitjana | Una tauleta (iPad) en ample tenia el flux d'escriptori: el teclat de la pantalla eixia a cada emoticona. | El flux tàctil depén de `CONSULTA_TACTIL` (`useBarresAmbScroll.js`), no de la mida. |
| A11Y-4 | mitjana | «Torna-ho a provar» desapareixia amb el focus a dins: el focus queia al `<body>` (al web amfitrió, encastat) i Escape deixava de funcionar. | El focus passa abans a la pestanya activa. |
| A11Y-6 | baixa | Cap avís quan el focus no és al camp: un lector de pantalla no sabia si l'emoticona havia entrat. | Regió en viu `.sdp-nomes-lector`: «Afegida: {nom}» (clau nova en cinc llengües). Dues iguals seguides també s'anuncien. |
| CUR-3 | baixa | Encastat en arrel d'ombra, un clic al web amfitrió no tancava el calaix. | El document també escolta, i ignora el que porta de destí l'amfitrió. |
| CUR-5 | baixa | Una emoticona rebutjada pel límit anava igualment a les recents. | `onTria` torna false i el calaix no la recorda. |
| A11Y-8 / CSS-4 | baixa | En 320-360 px les últimes pestanyes quedaven amagades sense cap pista. | Pestanyes de `max(48px, 100%/6.5)`: la mitja de la vora diu que n'hi ha més. La pestanya clicada es desplaça a la vista. |
| REG-3 | baixa | Els títols de secció heretaven el filet i el coixí dels h3 editorials. | `padding: 0; border: 0`. |
| REG-4 | baixa | La porta del xat (`tests/lint_xat.test.mjs`) no cobria els fitxers nous. | Afegits; la porta passa (20/20). |
| PAR-2 | baixa | `emojiSol` mira les dades d'Unicode del motor, no la font. «Del poble» portava quatre emoticones d'Emoji 13 (🫒 🫑 🪣 🪗), que Windows 10 i Android ≤10 pinten com a quadrets. | Llevades de «Del poble»; queden a les famílies. Prova que la tria és d'Emoji 12.0 o anterior. |

**Regressió pròpia trobada a la segona passada i corregida.** La regió en viu d'A11Y-6 era sempre al DOM. La conversa ja té el seu `role="status"`, i tres proves de `Conversa` (`Conversa.renders`, `Conversa.revisio260930` #11) fallaven per «multiple elements with the role status». Ara la regió només hi és amb el calaix obert: naix buida en obrir i el text canvia després, de manera que l'anunci continua funcionant. `src/sections/xat` torna a passar sencer.

No corregida, documentada:
- **CUR-4** (baixa): en tàctil, quan acaba de pujar una foto, `Conversa.jsx` (fora dels fitxers d'este torn) porta el focus al camp; això tanca el calaix i obri el teclat.
- Correcció mínima proposada: no prendre el focus si ja és dins del compositor (`campRef.current.form.contains(activeElement)`).
- `requires_human_decision: false`; és una tasca per al pròxim torn sobre `Conversa.jsx`.

### 4. Nota sobre l'informe de Gemini (`261022_1556_auditoria_gemini`)

Les tres infraccions de porta que va trobar eren certes i són corregides (T5). Però la secció «Invariants» del seu informe descriu un codi que no és el de l'arbre. MarIA no s'hauria de fiar d'eixa secció:
- no existixen `guardaCursor`, `inserixEmoji`, `onKeyUp`/`onClick` per a la selecció ni cap `requestAnimationFrame`. La selecció es recorda en `select`, `blur` i en escriure, i el cursor es posa en un `useLayoutEffect` quan el valor torna del pare;
- el calaix no es tanca en canviar de conversa per `conversaId` ni en gravar veu, i Escape no torna el focus a la carona sinó al camp;
- l'amplada no usa `100vw` sinó el contenidor: `min(22.5rem, calc(100% - var(--sdp-space-2) * 2))`;
- «Del poble» té 115 emoticones, no 55;
- les claus són `section.xat.emoticones.*` (21) i no hi ha cap `section.xat.compositor.emoticones*`.

Les xifres de proves que cita (91 fitxers, 1.087 proves) són d'abans de la revisió adversarial.

### 5. Retroalimentació a la plantilla `prompt_local`

- **Fitxers nomenats.** Que el preflight comprove que existixen els fitxers que el prompt dona per existents (`ls`), i que ho diga. Ací s'ha demanat «preservar les pestanyes existents» d'un component que no existia.
- **Pla i prompt.** Quan les mesures o les categories del pla i del prompt no coincidixen (280 vs 320 px; categories rurals vs famílies), que el prompt diga quina mana.
- **Amplades.** En un frontend que s'encasta (WordPress, Sollutia), els riscos d'amplada han de parlar del contenidor i no de `100vw`.
- **Camp «Model IA».** Té valors caducats («Claude 3.5 Sonnet / Gemini 1.5 Pro»): millor deixar-lo a l'agent.
- **Cadència del canal viu.** La plantilla diu «cada 10-15 minuts» i la lliçó 261003 de `wiki-documentacio-i-reflex` diu «cada 3-4 minuts»: cal unificar-les.
- **Crons.** El tancament de crons ha de dir que és per a qui els ha creat. Claude no n'ha creat cap.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves noves i veïnes** (després de les correccions del §3): `npx vitest run src/sections/xat/emoticonesXat.test.js src/sections/xat/components/SelectorEmoticones.test.jsx src/sections/xat/components/Compositor.emoticones.test.jsx src/sections/xat/components/Compositor.test.jsx src/components/universal/classificacio/GraellaEmojis.test.jsx`: 5 fitxers, 85 proves en verd, sense avisos d'`act`.
- **Porta del xat:** `node --test tests/lint_xat.test.mjs`: 20/20 (ara amb els fitxers nous).
- **Suites després del §3:** `npx vitest run src/sections/xat src/css src/config src/components/universal src/sections/notes` va donar 360 fitxers en verd i 2 en roig: les 3 proves de `Conversa` per la regressió pròpia del §3. Corregida, `npx vitest run src/sections/xat` torna a passar sencer: 89 fitxers, 1.074 proves. La correcció només toca `Compositor.jsx`.
- **Suites dels directoris afectats:** `npx vitest run src/sections/xat src/css src/config src/components/universal src/sections/notes`: 362 fitxers, 5.157 proves en verd. Inclou les portes de CSS (tokens, abast, òrfenes), la paritat i18n i les llistes de qualitat del xat. Es va córrer abans de les correccions de T5 i del cursor; després s'han tornat a passar els fitxers afectats.
- **ESLint:** `npx eslint --max-warnings=0` sobre tots els fitxers tocats: 0 missatges.
- **Compilació:** `vite build` a una carpeta temporal fora del repo, per no xafar el `dist/` compartit: correcta, abans i després del §3. El catàleg continua en un tros a part (`emojisUnicode18-*.js`, 262 kB, 42 kB amb gzip) que només es baixa en obrir el calaix.
- **Portes:** `tractor-vocabulari` i `tractor-pedra-seca --detall` no nomenen cap fitxer d'este torn després de T5. `porta-olivera.mjs`: Escriptori net, este informe ancorat.
- **Navegador real** (Chromium del panell de l'app, servidor :3340 que ja corria, accés pilot de desenvolupament amb dades de mostra):
  - **Ample:** calaix de 360×320 px, glif de 38 px, botons de 52 px, pestanyes de 48×48. «Bon dia a tots» amb el cursor a 3 → «Bon😊😂! dia a tots»: el focus no ix del camp i es continua escrivint. Escape tanca i deixa el focus al camp. El catàleg de veres porta 10 pestanyes; Banderes, 270 botons.
  - **Mòbil (375×812):** calaix de 359×280 px, 6 columnes, focus a la pestanya «Del poble», carona convertida en teclat. Una emoticona entra on era el cursor sense tornar el focus al camp. Tocar el camp tanca el calaix i torna la carona.
  - **Mòbil apaïsat (844×390, després del §3):** el calaix es retalla a 126 px i comença on acaba la capçalera (y=122), amb les pestanyes visibles. El compositor porta `--emojis`. Obert amb el ratolí, el focus és al camp.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Sense dispositius reals: el mòbil s'ha provat amb el viewport emulat de Chromium, no en un iPhone amb Safari 16 ni en un Android antic. El filtre d'emoticones no reconegudes depén d'`emojiSol` (dades d'Unicode del motor), no de la font del sistema: un navegador modern amb una font d'emojis antiga encara pot pintar algun quadret.
- No s'ha passat la suite sencera (més de 10 minuts en este Mac): només els directoris afectats i la porta `tests/lint_xat.test.mjs`.
- CUR-4 (§3) queda per a `Conversa.jsx`.
- L'alçada retallada no s'ha provat en un encastament real de WordPress; les sondes de l'arrel d'ombra són de jsdom.
- No s'ha fet cap commit ni s'ha tocat `.agents/ESTAT.md` ni `.agents/LEDGER.md`: el relleu d'ESTAT i LEDGER d'este torn és de l'orquestradora (MarIA). Per això `tancament.mjs --check` continua sense passar.
- El panell de navegador de l'app queda amb l'accés pilot de desenvolupament (Javi Llinares, dades de mostra) a `localhost:3340`. Per a tornar al compte de veres: eixir de la sessió.
- Crons: Claude no n'ha creat cap. El workflow de revisió acaba sol; no queda cap procés en segon pla.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261022_1425_pla_implementacio_emojis_grans_i_paritat_whatsapp]]
- [[261022_1425_prompt_claude_gemini_emojis_grans_i_paritat_whatsapp]]
- [[261022_1556_auditoria_gemini]]
