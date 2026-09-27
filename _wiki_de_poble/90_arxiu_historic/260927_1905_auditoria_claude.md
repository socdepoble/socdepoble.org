---
type: informe
status: esborrany
description: 'Torn de Claude Fable sobre el prompt 260927_1850: diagnosi mesurada del rail de ClosCaXat, correccio confinada a .sdp-xat i verificacio en viu, proves i refutacio.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c8481e43-4709-43f7-b83d-121fdf40679d:a2fac919-2bdc-48a9-9668-642ce8c25bcf
---
# Auditoria Claude Fable: graella del rail del Xat

Torn d'execució sobre el prompt 260927_1850_prompt_claude i el pla 260927_1850_pla_implementacio_claude (arxivats a mà per MarIA a les 19:09, sense handoff, mentre el torn corria). Resultat en una frase: el rail del Xat no era una graella perquè tres regles alienes (la tipografia editorial de ul/li, el gap de 13px del nav-item genèric i un coixí de capçalera calculat per a icones de 20 que en rep de 24) li posaven 12px de coixí, 12px de separació entre files i un eix d'icones a 40px; ara calca la barra principal (files de 44 a sang, eix d'icones a 28, text a 56, primera fila a la mateixa altura, tant desplegat com plegat), la roda de «Menú» cau sobre l'eix de les icones i comparteix mida amb elles, i cap píxel fora de `.sdp-xat` es mou. Tot mesurat en viu abans i després en ample, mitjà i estret, cobert per una prova nova i sotmés a cinc lents adversàries que no han tombat cap afirmació de fons.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c8481e43-4709-43f7-b83d-121fdf40679d:a2fac919-2bdc-48a9-9668-642ce8c25bcf |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local · localhost:3340 (Vite del Mestre, PID 1921) · navegador integrat en pestanya de fons |
| Creació | 2026-09-27 19:08 (17:08Z) |
| Modificació | 2026-09-27 19:30 |
| Propietari | claude-fable |
| Aprovació humana | Prompt 1850 amb «Aprovació humana: aprovat» (T1 «analitzar i corregir»); cap decisió nova presa fora d'eixe abast |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1) sobre Claude Code; subagents amb el mateix model |
| Tokens consumits | Fil principal no mesurat per l'arnés. Workflow de refutació: 983.560 tokens de subagents (5 lents i 1 síntesi, 423 crides d'eines, 12,7 minuts). |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. Rebuts: context 80ee7284 (19:04) i create a2fac919 (19:08) sota torn_c8481e43. El rebut acredita entrega, no comprensió.

Lectures completes abans d'actuar: AGENTS.md, QUI_SOC.md, el Genotip, la taxonomia documental, protocolledge.json, l'Escriptori sencer tal com era a les 18:56 (pla i prompt 1850, pla i prompt 1720, auditoria 1805, índex), l'Acta Marmota 260927_1720 i, en descobrir-la a mitja sessió, la 260927_1850, més les skills que ha disparat el router (sdp-pedra-seca, wiki-documentacio-i-reflex, core-automillora, core-estrategia-ia) i sdp-app-grid-shell. Codi: ClosCaXat.jsx, AppGridColumn.jsx, AppGridShell.jsx i .css, XatSection.jsx, XatControlSection.jsx, XatSection.test.jsx, UniversalWorkspace.test.jsx, AppGridShell.capes.test.js, modules.css (estructura 186-350, .sdp-workspace 2925-3050, bloc .sdp-xat 3324-3420, rail plegat 4516-4660), layout.css (barra principal 103-140 i 603-655), index.css (ordre de capes), tokens.

Evidència primària: getBoundingClientRect i getComputedStyle en una pestanya de fons del navegador integrat, abans i després de cada canvi; la pestanya del Mestre no s'ha tocat. Les Tres Pedres: alternatives no triades, (a) cel·la d'icona de 44 a files i roda (eix a 38, que no casa amb la barra principal, a 28) i (b) corregir la regla general del coixí del plec (mou 4px totes les capçaleres de tots els espais de treball: redisseny sense ordre). Manteniment a sis mesos: tot el canvi viu en un sol bloc comentat de modules.css sota `.sdp-xat`, amb els números explicats, i una prova el vigila. Tres maneres de fallar, comprovades: una regla sense capa que guanye (no: tot és a `components`, verificat des del navegador i per la lent de cascada), el mode estret (mesurat), una prova que depenga de la mida d'icona (cap; ara n'hi ha una que la fixa).

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 18:56 Arrencada. Lectura de l'Escriptori, l'acta 1720, el Genotip, la taxonomia i les skills del router.
- 19:00 Lectura del codi i de la cascada. Primer intent de shell composta bloquejat pel hook: lectures literals i ordres d'una peça des d'ací.
- 19:02 Mesures en viu abans de tocar res: rail plegat, rail desplegat, /control-xat i barra principal oberta com a referència.
- 19:04 Torn `torn_c8481e43` obert. Context de la plantilla d'auditoria pel circuit.
- 19:05 Correcció aplicada (modules.css, bloc `.sdp-xat-rail-llista`; ClosCaXat.jsx, mides d'icona). Vitest Xat 72/72; workspace, layout i notes 59/59.
- 19:06 Verificació en viu: ample desplegat i plegat, /control-xat, estret (375) i mitjà (768). Rebut de creació d'este informe. Workflow de refutació llançat (cinc lents en paral·lel i síntesi, text pla, sense schema per la lliçó d'or de l'ESTAT 01:51).
- 19:09 a 19:25 Arbre concurrent: MarIA arxiva a mà pla i prompt 1850, l'esborrany d'este informe (19:12, ja amb la v1.0.0 escrita) i reescriu l'índex de l'Escriptori tres vegades; a les 19:25 hi deixa el pla 1925 de la tasca següent. Cap fitxer de codi tocat per ella durant el torn.
- 19:19 Síntesi de la refutació rebuda: veredicte «segur per a lliurar» amb dos condicions (comentari inexacte i geometria sense prova) i una troballa dins d'abast (rail plegat 5px més avall que la barra principal plegada). Les tres s'assumixen.
- 19:22 Comentari corregit; prova nova de mides d'icona (una fuita d'estat del rail entre proves, corregida en la mateixa prova); barra principal plegada mesurada en viu i restaurada; regla del rail plegat aplicada. Vitest Xat 73/73.
- 19:27 Mesura final del rail plegat: primera cel·la a la mateixa fila que la barra principal plegada. Un error transitori del navegador en recarregar (proveïdor de sessió fora d'arbre) desapareix amb la segona càrrega: artefacte d'HMR, cap fitxer de sessió modificat.
- 19:30 Informe tancat en versió 1.1.0.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### T1 · Diagnosi mesurada: per què el rail no era una graella

Referència del Mestre («full de càlcul»): la barra principal (nav.app-sidebar, layout.css). Mesurada oberta a 260px: capçalera «CONTROL» de 58 amb la roda de 24 a 16px de la vora (eix 28) i el text a 56; files de 44 a sang, pas 44, la primera a y=138 (coixí superior de 16); icona de 24 a 16 (eix 28), text a 57; l'activa és una banda taronja de vora a vora sense radi. Plegada a 56px: fila superior 56×58 amb la icona a l'eix 28, coixí de 4 i cel·les de 44 amb pas 48, la primera a y=126.

Rail del Xat desplegat, abans (columna a x=260, 260px):

| Element | Mesura | Causa |
| --- | --- | --- |
| Roda de «Menú» | caixa 48×24 a 16 de la vora, eix a 40; títol a 72 | modules.css:3007-3011 posa `padding-inline: calc((44 - 20px) / 2)` = 12px al svg del plec, calculat per a icones de 20; AppGridColumn.jsx:105 i :141 en pinta de 24 |
| Files | inset 12px (x=272, amplària 241), radi 999px, pas vertical 56 | ul amb `padding: 8px` i `gap: 4px` (bloc .sdp-xat) més la tipografia editorial de li a base.css:166-169 (capa legacy: `padding-left: 4px`, `margin-bottom: var(--sdp-li-gap)` = 8px), més `border-radius: var(--sdp-radi-pastilla)` del nav-item genèric (modules.css:316) |
| Icona de fila | eix a 40; etiqueta a 65 | 12 d'inset + 16 de coixí del botó + 12; `gap: 13px` (modules.css:311) |
| Activa | píndola taronja inset | mateix radi i inset |

Rail plegat, abans (56px): fila superior 56×58 amb la roda de 24 (eix 28); cel·les 44×44 amb pas 48 (eix 28, correcte per «un sol joc de regles», AppGridShell.css:284-340) però icones de 20 (`size={20}`), i la primera cel·la a y=131 (gap 4 més vora 1 més coixí 4) contra y=126 de la barra principal plegada. En desplegar, l'eix de les icones saltava de 28 a 40.

Severitat: P1 (menú principal del mòdul). Font de veritat en conflicte: sdp-pedra-seca §3 (13px no és múltiple de 4) i l'ordre del Mestre («una graella ben quadrada»).

### T2 · Correcció aplicada, confinada a `.sdp-xat`

- src/css/modules.css, bloc `@layer components` del Xat (busca `.sdp-xat-rail-llista`): la llista passa a `padding: var(--sdp-space-4) 0 var(--sdp-space-2)` i `gap: 0`; `> li { margin: 0; padding: 0 }` neutralitza la tipografia editorial; les files `.sdp-xat .sdp-xat-rail-llista .sdp-workspace-nav-item` porten `gap: var(--sdp-space-4)`, `padding: var(--sdp-space-2) var(--sdp-space-4)`, `border-radius: 0` i `min-height: var(--sdp-touch)`; la roda del rail `.sdp-xat .app-grid-column--left .app-grid-col-header__plec > svg { padding-inline: 0 }` i el plec `gap: var(--sdp-space-4)`; el rail plegat `.sdp-xat .app-grid-col-header--collapsed > .sdp-workspace-rail { border-top: 0; padding-top: 0 }`. Tot amb tokens o zero, tot múltiple de 4, cap HEX, cap estil en línia. Especificitat (0,3,0) i (0,3,1) dins de la mateixa capa que les regles genèriques: guanya per especificitat, no per ordre.
- src/sections/xat/components/ClosCaXat.jsx: icones del rail plegat de 20 a 24 (les de la roda i de la barra principal); les del desplegat de 18 a 24 (cap píxel canvia: modules.css:4675 ja les forçava a 24). Comentari de capçalera ampliat.
- src/sections/xat/XatSection.test.jsx: prova nova «el rail porta icones de 24 com la roda de Menú, plegat i desplegat» (atributs width i height dels set svg en els dos estats, sis entrades dins de `.sdp-xat-rail-llista`); deixa el rail plegat en acabar perquè l'estat es recorda entre proves.

Després, xifres relatives a la vora de la columna, iguals en els tres modes:

| Mode | Roda «Menú» | Títol | Files | Icona de fila | Etiqueta | Pas |
| --- | --- | --- | --- | --- | --- | --- |
| Ample desplegat (260) | 24×24 a 16, eix 28 | 56 | 44 a sang, primera a y=138 | eix 28 | 56 | 44 |
| Ample plegat (56) | fila 56×58, eix 28 | — | cel·les 44×44, primera a y=126 | 24 px, eix 28 | — | 48 |
| Mitjà (768, panell de 260) | eix 28 | 56 | 44 a sang | eix 28 | 56 | 44 |
| Estret (375, panell a tota amplària) | eix 28 | 56 | 44 a sang de 375 | eix 28 | 56 | 44 |

Barra principal al costat: oberta, roda eix 28, text 56, files a y=138 amb pas 44; plegada, cel·les a y=126 amb pas 48. «Xat» i «Xats» cauen a la mateixa fila en els dos estats. L'activa del rail és una banda taronja de vora a vora. Plegar i desplegar no mou cap icona d'eix. L'única diferència que queda és d'1px al text de les files de la barra principal (57: gap 13 més un marge de 4), que és deute seu (D4), no del rail.

### T3 · Novetats (el Control): cap desquadrament del rail

- /control-xat munta el mateix rail amb la mateixa CSS: mesures idèntiques a les de /xat, amb «Novetats» com a banda activa (aria-pressed i aria-current) i «Xats» en repòs, en plegat i en desplegat.
- Columna central del Control, observat i no tocat: la capçalera «Control del xat» té la roda en caixa de 48 (eix 40, la mateixa causa de T1) i les files `.sdp-xat-opcio` una cel·la d'icona de 44 a x=16 (eix 38): 2px. La fila 2 buida en ample (FilaSegona, XatControlSection.jsx:129-136) fa que la mateixa closca tinga tres alçades de capçalera (rail 58, llista 116, dreta 0); és de disseny declarat i una prova la blinda. Vegeu D1 i D6.
- Columna central de /xat: sense canvis (la regla del plec només casa amb `.app-grid-column--left`); «Converses» conserva la caixa de 48 (eix 40). Vegeu D1.

### T4 · Fora d'abast: decisions per al Mestre (requires_human_decision: true)

- D1 · P2 · modules.css:3007-3011 (i :2999-3003 amb 18). El coixí del svg del plec es calcula per a icones de 20 mentre AppGridColumn.jsx pinta 24: caixa 48 i eix 40 en TOTES les capçaleres de tots els espais de treball (Bloc, Wiki, Disseny, Perfil, columnes centrals del Xat), 12px a la dreta del rail plegat. Corregir-ho mou 4px cada títol de columna de l'aplicació: Llei del Píxel, cal ordre. Proposta: `calc((var(--sdp-touch) - 24px) / 2)` i, a la columna central del Xat, gap 12 perquè títol i text de fila queden a 72 (eix 38, el de `.sdp-xat-opcio__icona`).
- D2 · P3 · AppGridShell.css:306 i :334-340 contra layout.css:618-619. Els dos comentaris es contradiuen: el de la graella diu que els 9px (gap, vora, coixí) del rail plegat del Workspace són deliberats; el de la barra principal diu que el seu coixí de 4 «coincidix amb el Workspace». Mesurat: 131 contra 126. El Xat ja va a 126 (T2); Bloc, Wiki i Disseny continuen a 131, on la vora separa accions de carpetes. Decidir quin comentari és cert.
- D3 · P3 · UniversalWorkspace.jsx:485 i :845 (rail de carpetes) pinta icones de 20 al rail plegat i modules.css:4542-4544 ho documenta; el Xat, la roda i la barra principal van a 24. Una sola mida per ordre del Mestre (esta auditoria recomana 24) i actualitzar el comentari.
- D4 · P3 · modules.css:311 i layout.css:157 (`gap: 13px`), base.css:303 (`.icona-linia { margin-right: 4px }`), literals 16px a modules.css:314 i layout.css:159: fora de l'escala de Pedra Seca §3. Conseqüències mesurades: text de les files de la barra principal a 57 en lloc de 56, i a la barra plegada la icona de cada cel·la 2px a l'esquerra de l'eix (cx 26 en lloc de 28) perquè el marge de 4 viatja dins de la cel·la centrada. Escombrada d'1 i 2px en tots els menús: cal ordre.
- D5 · P3 · modules.css:346-350 amb tokens.css:271 i :280. L'anell de focus (`--sdp-crom-focus`, primary-400) sobre la fila activa (`--sdp-crom-actiu-fons`, primary-500) queda a un contrast d'1,3:1 aproximat amb offset -2: preexistent (també al rail plegat, :4621-4624) i el radi 0 no ho canvia. Proposta: `[aria-current="page"]:focus-visible { outline-color: var(--sdp-crom-actiu-text) }`. Del mateix paquet, preexistents i P3: fila activa sense hover diferenciat (modules.css:327-331 contra layout.css:170); BotoObriRail amb aria-expanded sense aria-controls (ClosCaXat.jsx); el panell lliscant no es tanca amb Escape; el botó desplegat no porta title i amb el preset compacta (210) l'etiqueta llarga es retalla sense tooltip; la prova d'estret de XatSection.test.jsx:508 clica una pestanya que modules.css amaga.
- D6 · P2 · XatControlSection.jsx:60 i :133-136. FilaSegona pinta una fila buida de 58 en ample només al Control: la llista del Xat en té una (D5 del pla 0055) i la columna dreta cap. Tres alçades de capçalera a la mateixa closca. Mantindre-la o llevar-la (i ajustar la prova :486-489) és decisió de disseny.
- D7 · P3 · .agents/skills/sdp-app-grid-shell/SKILL.md:30 situa la roda a la dreta de la capçalera esquerra; el Xat la usa com a icona del títol «Menú» per ordre del Mestre (18:35). Documentar l'excepció a la skill.

### T5 · Refutació adversarial

Cinc lents independents (cascada, modes i accessibilitat, regressió aliena, contracte Pedra Seca i app-grid-shell, completesa davant l'ordre del Mestre) amb l'ordre de refutar, sense schema ni navegador, i una síntesi obligada a reobrir cada evidència amb Read abans de donar-la per bona.

- Refutacions que es sostenen (5 de 5 lents, comprovades per la síntesi): «text a 56, on comença el text de la barra principal» era inexacte (les files de la barra cauen a 57; només «CONTROL» a 56); «les proves acrediten el canvi» era fals perquè jsdom no calcula geometria i cap prova fixava la mida 24. Les dos condicions s'han assumit: comentari de modules.css reescrit i prova nova de mides. També refutats dos comentaris preexistents: layout.css:618-619 (el rail plegat no coincidia amb la barra plegada: 131 contra 126, corregit al Xat en T2 i obert a D2 per a la resta) i ClosCaXat.jsx («panell de 260 o de 375»: en estret la columna és la cel·la sencera de la graella i en mitjà l'amplària ve d'AppGridShell.jsx:134-137, presets 210, 260 i 300).
- Confirmat per tres lents i la síntesi: confinament total del canvi (`.sdp-xat` naix a ClosCaXat.jsx:86 i cau a `.app-grid-page`; UniversalWorkspace.jsx:170 no la compon; cap regla compartida alterada; base a modules.css:308 dins del `@layer components` que obri a :6 i tanca a :724; AppGridShell.css i PerfilShell.css entren a la mateixa capa per index.css:65-66). Cap píxel fora del Xat canvia.
- Troballes noves: totes preexistents, cap introduïda pel canvi; van a D1-D7. Dos de menors s'han deixat tal qual amb raó: `border-radius: 0` sense token (Pedra Seca §5 no en té de zero; el precedent és la regla que es calca, layout.css:167, i la lliçó 260923 diu que el substitut el tria el Mestre) i les declaracions de min-height i padding que repetixen el valor de la base (ara són contracte explícit del bloc, no accident).
- Veredicte de la síntesi, literal: «Sí, és segur per a lliurar tal com està: les cinc regles i el JSX queden confinats al Xat, la cascada resol com es descriu dins de @layer components, cap regla compartida canvia i l'únic píxel nou fora del declarat és cap.»

### Retroalimentació de la plantilla prompt_local i del pla

- El prompt 1850 i el pla 1850 no portaven `reflex` al frontmatter («Rebut: [pendent d'emetre]»): escrits a mà. El pla, amb `type: planificacio` i vint-i-vuit línies sense les seccions del contracte pla.implementacio, no passaria `document.mjs check`. MarIA els ha arxivat a mà a les 19:09 sense `handoff` i sense àncora a l'índex: dos orfes nous a l'arrel de l'arxiu.
- El prompt encerta les xifres (72 de 72) i la URL; el que li faltava era la mesura: una captura o tres números (eix de la icona, text, pas de fila) del que el Mestre veu i del que vol. Amb això el torn hauria començat a corregir en lloc de mesurar.
- El punt 0 (Preflight) marca «Rebut obtingut» a mà: sense generador que la calcule, una casella marcada no és evidència (ja dit a l'auditoria 1805).

### Proposta d'Automillora

1. Escriure la graella al cervell, no només al comentari: afegir a `.agents/skills/sdp-app-grid-shell/SKILL.md` §2 el «full de càlcul» dels menús laterals com a contracte numèric (coixí 16, icona 24, separació 16, text a 56, files de var(--sdp-touch) a sang i sense radi, eix d'icones a 28 plegat i desplegat, rail plegat amb cel·les de 44, pas 48 i primera cel·la a 4 de la fila superior). Qualsevol rail nou (Mur, Mercat) l'hereta i esta auditoria no es repetix.
2. La prova de mides d'icona ja hi és; el pas següent és una prova de contracte de CSS, com AppGridShell.capes.test.js, que llija modules.css i exigisca que el bloc `.sdp-xat-rail-llista` conserve `gap: 0`, `border-radius: 0` i `padding-inline: 0` al svg del plec del rail.
3. Un torn no pot conviure amb una escombra que arxiva els seus documents mentre els escriu: MarIA ha mogut este informe a l'arxiu a les 19:12 amb la v1.0.0 dins i l'ha deixat allí desanclat; la v1.1.0 és esta, a l'Escriptori, i la còpia de l'arxiu queda superada. Proposta per a AGENTS §12: mentre hi haja un torn obert (`.agents/runtime/turns/*.json` en estat `opened`), els seus documents no s'arxiven; i tot moviment passa per `document.mjs handoff`, que és qui reapunta l'àncora.
4. El hook bloqueja `npx eslint` als agents: el lint el correrà el pre-commit del Mestre. Una llista de lectura que admeta `eslint` sense `--fix` estalviaria eixa cega.
5. Per a canvis visuals, el prompt ha de portar la referència que el Mestre té al cap (ací, la barra principal i WhatsApp per a Mac) i tres números mesurats del que es veu.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| npx vitest run src/sections/xat (19:05, abans de la prova nova) | 72 de 72 |
| npx vitest run src/components/universal/workspace src/components/layout src/sections/notes/NotesSection.test.jsx | 59 de 59 (8 fitxers) |
| npx vitest run src/sections/xat (19:23, amb la prova nova) | 73 de 73 (5 fitxers); una primera passada 71 de 73 per una fuita d'estat del rail entre proves, corregida dins de la prova |
| Cascada, des del navegador (CSSLayerBlockRule) | Les regles que casen amb les files del rail són totes de la capa `components` |
| Navegador, /xat ample desplegat | Roda 24 a 16 (eix 28), títol 56; files a sang, pas 44, primera a y=138; icones eix 28; etiquetes 56; banda activa sense radi |
| Navegador, /xat ample plegat (final) | Fila superior 56×58 amb roda de 24 (eix 28); cel·les 44×44, pas 48, primera a y=126, icones de 24 (eix 28); sense vora davall de «Menú» |
| Navegador, barra principal plegada (mesurada i restaurada) | Fila superior 56×58 (eix 28); cel·les 44 a y=126, pas 48; icona 2px a l'esquerra de l'eix (D4) |
| Navegador, /control-xat ample (plegat i desplegat) | Mateixes xifres; «Novetats» banda activa; columna central sense canvis |
| Navegador, estret 375 (panell obert des de «Menú») | Panell a tota amplària; capçalera «Tanca el menú»; files de 375 a sang; eix 28, text 56; focus a «Xats» en obrir |
| Navegador, mitjà 768 (panell obert des de «Menú») | Panell de 260 amb z-index 30; mateixes xifres que ample |
| Estat del Mestre | La seua pestanya no s'ha tocat; rail plegat (valor per defecte) i barra principal oberta en acabar; viewport de la pestanya de fons tornat a escriptori |
| document.mjs check (este informe) | valid: true en la v1.0.0; es repetix en tancar la v1.1.0 |
| Lint | No executat: el hook el bloqueja a l'agent; el pre-commit el correrà |
| Workflow de refutació | 6 agents, 423 crides, 983.560 tokens, 12,7 minuts; 0 errors; veredicte «segur per a lliurar» |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Sense commit, push ni desplegament: el hook ho prohibix a l'agent. ESTAT.md, LEDGER.md i tancament.mjs són inabastables per al mateix motiu (auditoria 1805, T5-05): el bloc de relleu es lliura al xat perquè MarIA l'incorpore. L'acta 1850 preveu un commit `--no-verify` del Mestre.
- Arbre concurrent: MarIA ha arxivat a mà, durant el torn, el pla i el prompt 1850 i la v1.0.0 d'este informe, i ha reescrit l'índex de l'Escriptori tres vegades. La còpia de l'arxiu (260927_1905_auditoria_claude.md a l'arrel de 90_arxiu_historic, 19:12) és la v1.0.0 i queda superada per esta; no s'ha esborrat (AGENTS §5). L'índex conserva l'àncora d'este fitxer a l'Escriptori; les dels 1850 no existixen.
- Les columnes central i dreta del Xat no s'han tocat: D1 i D6 documenten el que hi queda i per què cal ordre.
- Error transitori del navegador integrat a les 19:27 («useSession ha de ser usat dins de SessionProvider») en la recàrrega d'HMR que ha seguit l'última edició de CSS: SessionContext.jsx i IdentitatContext.jsx no estan modificats (26-09); la segona càrrega ha pintat l'aplicació neta. No s'ha investigat més.
- 90_arxiu_historic: una sola lectura dirigida de la còpia d'este informe per a saber quina versió contenia; cap RAG. 01_produccio: no tocat. Memòria persistent fora del repositori: no escrita.
- Els subagents no han executat proves ni han vist el navegador; les seues xifres són aritmètica de CSS que coincidix amb la mesura en viu.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/260927_1850_pla_implementacio_claude]]
- [[../90_arxiu_historic/260927_1850_prompt_claude]]
- [[../90_arxiu_historic/260927_1805_auditoria_claude]]
- [[../10_actes/260927_1850_acta_marmota]]
