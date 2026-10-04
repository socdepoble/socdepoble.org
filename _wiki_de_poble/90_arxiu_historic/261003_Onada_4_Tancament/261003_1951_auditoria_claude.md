---
type: informe
status: esborrany
description: 'Execució de l''Onada 4: F1 COOP a l''OAuth, F2 enllaços del full de ruta, retallador multimèdia i fonaments de Capacitor, amb proves i revisió adversarial.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_50ca5709-8cd2-416a-bf41-2afdb3450179:d22c8c27-7767-4685-9f10-671532788c90
---
# Auditoria Onada 4 de Claude

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_50ca5709-8cd2-416a-bf41-2afdb3450179:d22c8c27-7767-4685-9f10-671532788c90 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T17:51:54.654Z |
| Modificació | 2026-10-04T02:20:00Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Ultracode amb workflows d'agents i revisió adversarial |
| Tokens consumits | No disponibles en esta sessió; no estimats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-03T17:51:54.654Z: esborrany creat; contingut i verificació pendents.
2026-10-03T17:56:00Z: v0.1.0, disseny de F1 publicat per a Codex abans d'executar.
2026-10-03T18:50:00Z: v0.2.0, primera onada aplicada.
2026-10-03T19:20:00Z: v0.3.0, resposta al despertador (cron bloquejat pel hook).
2026-10-03T19:45:00Z: v0.4.0, directrius de MarIA (orquestració per esdeveniments, lectura d'un salt).
2026-10-03T20:05:00Z: v0.5.0, resposta a l'ordre d'intercepció W4-06 (iframe + COOP).
2026-10-03T20:55:00Z - 2026-10-04T01:40:00Z: relleus per bloc (tercera a sisena passada, plugins, pla de disseny, passada de disseny, decisions del Mestre).
2026-10-04T02:20:00Z: v1.0.0, informe final de l'Onada 4: set passades de codi, passada de disseny Impeccable/Kowalski i passada de tancament, totes amb revisió adversarial; regressió final; ZIP 1.0.2 preparat per a l'aprovació del Mestre.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

##### Resum per al Mestre

**L'Onada 4 és feta al codi, revisada i provada.** **Cap roja de la regressió final és nostra.** **Falta només el que no pot fer una IA en este entorn:** **compilar el ZIP 1.0.2** (el hook bloqueja npm i el Terminal), les **decisions humanes** pendents i la **governança** de MarIA (ESTAT, LEDGER, tancament, skills). **Cap commit**: espera la lease.

##### Autenticació (F1 i sèrie W4)

**F1 / W4-03.** **Fora el vigilant de `closed`**, que COOP falseja. Hi ha un **id d'intent aleatori de 128 bits** (`sdp_oauth_attempt`) amb **registre per id**, i un **relé per `storage` i `postMessage` filtrat per origen, font i id**. El PKCE **no ix mai** de la pestanya mare, i el botó **«Cancel·la l'entrada»** és a /registre. **W4-02:** **sense marca pròpia no hi ha cap efecte** sobre l'amfitrió, i una **instantània per id** restaura la **URL i l'`history.state`** de l'amfitrió, **també en el reintent**. **W4-06:** **Opció B**. En un marc d'un altre origen apareix un **avís honest** i el botó **«Obri en una pestanya nova»**, amb **zero PKCE** i **zero emergents**. L'**Opció A** queda escrita com a **contracte futur per a Sollutia** (`CONTRACTE_SDP_AUTH_REQUEST.txt`). **Recuperació i alta** porten **marca pròpia**: un enllaç caducat **torna a avisar**. **W4-01:** **`embed.jsx` ja no munta mai sobre un `#root` aliè.** **W4-09 i W4-10:** l'autor corporatiu es resol **pel port**, i la **restricció UUID viu a l'adaptador** de Supabase, no a la UI.

##### Continguts, multimèdia i navegació

**F2:** els **43 enllaços** del full de ruta són **rutes de l'app**, i la prova munta el router real. **Pendent:** el registre de la Wiki (`00_full_de_ruta.md`) encara té **45 enllaços absoluts**, i és de MarIA. **Retallador:** s'ha estés **`DialegEnquadrament`** amb **EXIF propi** (orientació, data i GPS), les **huit orientacions**, **límits** i **WebP amb reserva JPEG**, i amb **geolocalització voluntària**. L'**avatar 1:1** puja **un sol fitxer**. **Cap camí puja l'EXIF ni el GPS originals**, ni tan sols les **imatges enganxades** al text enriquit. **AppGrid en mòbil:** un **rail de 56 px** i una **llista plegable**, i l'escriptori **idèntic**.

##### Panell de Control i plugins

**Targetes de publicació** (directrius 2234, 2245 i 2325): **UniversalCard canòniques** amb **boina Sóc de Poble**, els **textos definitius**, el **quadrat de 128 px gris fosc** per a dates i preus, el **peu restaurat** i **sis pàgines** «Saber-ne més» amb un **gran botó Publicar**. **Plugins:** un **registre únic**, la ruta **`/plugin/:id`**, una **UniversalPage genèrica** amb **portada plegable per persona** i una **graella canònica** que **només navega a la pàgina del plugin** (W4-11). **Cens decidit pel Mestre:** **Mapa, Vehicle i Animalets només a dalt.** **Zero `style=`** al Control i al Panell de Disseny.

##### Disseny Impeccable/Kowalski (fases A-E, amb les 8 respostes del Mestre)

**Tokens:** moviment (durades i corbes), focus 3/2, **tàctil de 48 px sempre**, **tipografia fluida** (**H1 > h2** a tota amplària i **×1,84 amb zoom 200 %**) i **amplades condensades**. **AAA sempre:** el text suau fa **9,09** (abans 6,41), l'anell sobre el blau **5,01** (abans 1,42), el hover taronja **8,97** (abans 5,42) i el text blanc sobre el blau d'acció està corregit (abans 3,87). **Bancal:** interruptor **normal / bancal / sistema**, amb **política d'arrel** (W4-12): l'atribut va al **host del Shadow DOM**, a l'**arrel del mòdul** dins d'un document aliè, i a l'**`<html>` només quan l'app n'és ama**. Els **atributs aliens es conserven**. **Fonts locals:** **cap petició a Google**, i la font és **variable de 400 a 800**. **Ombres de les targetes conservades** (Q6). **Calaix de l'Índex** reparat (**280 ms**). **Flux lliure** del text (**fora el topall de 68ch**), **cap sagnat**, i **imatges de lectura a ample complet**. **Panell de Disseny** (W4-13): **es munta** i els seus controls usen **el mateix estat** de contrast.

##### Capacitor i botigues

`vite.natiu.config.js` amb **substitucions exactes** i un **entorn validat**: **cap VITE_ de desenvolupament** entra al binari. La **prova de frontera** cobrix **11 formes d'import**, i hi ha una **entrada nativa mínima**. **W4-05 esmenat:** una versió per paquet, **Node 22 o més**. **Runbook de botigues** amb les **claus d'API** fora del repositori i els **scripts** al laboratori (`nous/botigues/`). **Pregunta Zero:** la frontera de seguretat és una **regla d'operació de Claude**.

##### Gestoria (referència, sense codi)

Les captures del Mestre i els **quatre principis** (**món privat**, **boina personal**, **taulers de negoci**, **skills encapsulades fora del Brain**) són a **`GESTORIA_REFERENCIA.txt`**. El **nucli ja existix** a `src/sections/gestoria/`. Hi ha un **deute**: la sentinella `trituradorFinancer` viu al registre global de tractors.

##### Roges d'altres actors (no tocades)

**`CopyrightSelector.jsx`** (canvi de les 03:00): el **`return` ja l'ha restituït el seu autor** (verificat a les 04:15). **Queden 8 roges** a `classificacio/`: el text dels botons ara és **«Carpetes (—)»** en lloc de «Carpetes—», hi ha una **píndola de més** i un **`Boto` sense usar** a `BotoneraClassificacio.jsx:31`. És **redisseny en curs d'un altre actor**: o s'actualitzen les proves, o es torna enrere. **`agentsSeed.js`:** la ruta de l'avatar de la IAIA ha canviat i hi ha una **clau `avatar_url` duplicada** (10 roges). **`aplicacions.js` i `DetallEspai.jsx`** (6). **«Ajustos del xat»** ja no és al Control (4). La **barra taronja T38** s'ha revertit (4 més 1 de node).

##### Decisions pendents del Mestre

**1.** Si el **format nou de les píndoles de classificació** («Carpetes (—)») és el bo: llavors cal **actualitzar 7 proves** i llevar el `Boto` sobrant; si no, **tornar al format d'abans**. No bloqueja el ZIP: el botó de drets d'autor ja es pinta. **2.** A **320 px**, la **barra blava** talla 16 px del **CONNECTAR**; opcions: un **menú «⋯»** o un **CONNECTAR només amb icona**. **3.** La **data de la barra taronja** fa **3,69:1** (no és AAA). **4.** Si **«Ajustos del xat»** torna al Control. **5.** Si el **peu del Panell** porta **CONNECTAR**. **6.** Per al ZIP: **tenant** (de llavor o real), **url-base** (.com o .net), **signatura** (`--prova` com la 1.0.1, o generar la clau), i si es **regeneren els índexs de la Wiki**. **7.** Aprovar les **empremtes de la frontissa** (roadmap i pàgines noves) abans del commit.

##### Per a MarIA (governança: Claude no hi pot escriure)

**ESTAT:** «Onada 4 completa al codi; ZIP 1.0.2 a compilar pel Mestre; decisions 1-7 de l'informe 1951 v1.0.0». **LEDGER:** «261004 | onada4 | claude | set passades, disseny A-E, tancament W4-08/10/12/13; regressió sense roges pròpies». **Lliçons proposades** (wiki-documentacio-i-reflex): «**canal viu a l'Olivera**» i «**lectura d'un salt**» (textos a les versions 0.3.0 i 0.4.0 d'este informe). **Skill §4:** esmenar el **68ch** per la decisió del Mestre del **flux lliure**. **Fitxa Graella** (01_produccio): el text exacte és a `GRAELLA_FITXA_PER_APLICAR.txt`. **Segell divergent** (`segell-auto`) des de les 21:00. **Ancorar a l'índex** els fitxers nous dels laboratoris `261003_1330_onada4_claude/` i `261003_1330_empaquetat_mobil_claude/`.

##### Retroalimentació de la plantilla prompt_local

**Declarar el tall** (commit i fitxers en flux) i **què vol dir «tancat»**. **Una llista explícita de documents vius** (no «tot l'Escriptori»). **Separar decisions del Mestre de directrius de MarIA**, amb data. **Dir que la shell està confinada** i quines ordres pot executar l'agent: s'hauria estalviat el malentés del ZIP. **Model IA real** a les metadades.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Regressió final (passada de tancament):** **vitest 10.295 de 10.341** (45 roges, **cap de Claude**; a les 03:14 eren 77) i **node 890 de 963** (28 roges de governança i plantilles, **cap de Claude**). **tractor-enxufe E1-E4 en verd.** `design_guard` ix amb 1 per tres identitats **prèvies o alienes**; **les del Control, del Panell i d'`App.jsx` han desaparegut**. **Cens d'ESLint:** tots els fitxers nous de l'Onada són a algun cens **sense cap missatge**; l'únic avís és aliè (`BotoneraClassificacio.jsx`).

**Mètode:** a cada passada, **implementació amb proves roges abans i verdes després**, un **revisor adversarial** que refuta o corregix, i **proves al navegador** (pestanya de fons a localhost:3340) per a tot el que és visual. **Codex** ha contrastat de manera independent F1, W4-02, W4-07, W4-11 i els contrastos.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

**Sense verificar:** **Google real** amb COOP, **Safari 16 i Firefox 100 reals**, **`forced-colors`**, **dispositius** i el **WordPress real** de gentdelatorre.net. **El ZIP 1.0.2 no està compilat:** el hook bloqueja npm i el Terminal, i les ordres són al runbook `EMPAQUETAT_1.0.2.txt`. **Cap commit**, perquè espera la lease i la frontissa. **No es poden escriure binaris:** el **fitxer Noto Sans estret** s'ha de baixar a mà (`FONTS_LOCALS.txt`). Les **decisions humanes** són a «Troballes». **ESTAT, LEDGER i tancament** són de **MarIA**.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261003_1935_prompt_claude_onada_4]]
- [[261003_1935_pla_implementacio_maria]]
- [[261003_1950_auditoria_codex]]
- [[261004_0050_pla_implementacio_claude]]
- [[261003_2325_directriu_universal_card_regressio]]
- [[261003_2245_contingut_pagines_doble_accio]]
