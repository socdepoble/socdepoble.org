---
type: document
status: esborrany
description: 'Pla del torn de Claude per a acabar el Xat calcat de WhatsApp: fulls d''Ajustos, conversa, llista i aterratge al grup del poble en entrar a /xat.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_ddd7a133-b647-4153-830e-aa31d09b5bc1:dec31b1b-b8eb-4c6a-8fb1-b0da385db4b0
---
# Pla d'Implementació — Clon de WhatsApp al Xat

**Estat del Pla:** aprovat en abast per l'ordre del Mestre (petorreta 2135: «iniciar la implementació completa»); el detall d'este pla no l'ha revisat cap humà. Les decisions que el Mestre ha de prendre van a la secció 2 i no bloquegen la resta.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ddd7a133-b647-4153-830e-aa31d09b5bc1:dec31b1b-b8eb-4c6a-8fb1-b0da385db4b0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T19:43:11.358Z |
| Modificació | 2026-09-30T20:30:00.000Z |
| Propietari | agent-local |
| Aprovació humana | Abast ordenat pel Mestre a la petorreta 260930_2135; detall pendent de revisió |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Ultracode |
| Tokens consumits | N/D (torn en curs) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-30T19:43:11.358Z: esborrany creat; contingut i verificació pendents.
2026-09-30T20:30:00.000Z: v1.0.0, pla complet després d'analitzar 74 captures i el mapa del codi (13 agents de lectura).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i troballes

**Què va capturar el Mestre hui (52 captures de `01_produccio/WhatsApp-Clon-02/`, 20:47–21:05).** Un recorregut sencer del full «Ajustes» de WhatsApp Desktop:

- l'entrada: «Tú» al peu de la barra lateral;
- l'arrel: X circular a l'esquerra, títol centrat, cercador, targeta de perfil i grups de files amb icona i xebró;
- les subpantalles: Favorits, Destacats, Historial, Compte, Privacitat i les seues set subpàgines, Xats, Aparença, Notificacions, Emmagatzematge i dades, i Ajuda.

La gramàtica és constant. El full és modal i centrat, d'uns 480×640 px, i no canvia de mida en navegar. La navegació és una pila dins del mateix marc: ‹ circular per a tornar i títol centrat. Les files són de 42 px dins de targetes blanques de radi xicotet. L'element de la dreta pot ser un xebró, un valor gris, un ✓ de selecció única o una casella. Les accions destructives van en roig i sense xebró. Els canvis s'apliquen a l'acte, sense botó de desar. Quan una pàgina és buida, s'hi posa un títol en negreta i una frase grisa.

La resta de captures (`WhatsApp-Clon-01`) ja estaven calcades en onades anteriors: llista, rail, cerca, comunitats i nova conversa.

**Què hi ha hui al codi (lectura fitxer:línia; detall a l'auditoria 2145):**

- **Ajustos del xat.** Són una ruta (`/control-xat`), no un full. S'hi arriba en dos passos i fora del Xat. Només funciona 1 opció de 4 (`XatControlSection.jsx:35-40`).
- **Peu del rail.** L'avatar i «Tu» no són clicables; només el llapis porta a `/el-meu-perfil` (`ClosCaXat.jsx:414-420`).
- **«Gent de la Torre».** Cap fil ni comunitat del poble existix a les dades (`xatSeed.js:145-152`), i el Xat no llig ni `poble` ni `nomPoble`. El mecanisme per a fer-lo nàixer sí que existix: `?sobre=poble:<id>` (`XatSection.jsx:312-353`, `localXat.js:468-497`, RPC `obri_fil_de_pagina`).
- **Conversa.** Li falten cinc coses de WhatsApp:
  - l'agrupació de missatges consecutius, amb la cua només a la primera bombolla;
  - el separador de no llegits;
  - el botó flotant per a baixar. Hui salta al fons amb cada missatge, encara que llegisques més amunt (`XatSection.jsx:1057-1058`);
  - les respostes. Les dades ja hi són, i el port les accepta (`supabase/xat.js:272`, `localXat.js:395`);
  - els esborranys per conversa, que ara es perden (`XatSection.jsx:882`, `:1037`).
- **Llista.** L'últim missatge propi no porta les marques ni, en els grups, el prefix «Tu:». La pastilla d'un fil silenciat no és grisa, i el no llegit manual no té el seu punt.
- **Marques.** Falta l'«entregat» (✓✓ gris): el port dona `rebutFinsSeq`, però `mapejaFil` el descarta.
- **Disseny (T2).** La porta del disseny no troba cap violació al Xat. A mà, amb la skill Pedra Seca, n'hi ha de dos tipus:
  - literals que es poden passar a token sense canviar cap píxel (`68ch`, `--sdp-touch-min`, `z-index: 20`);
  - tensions de doctrina que ha de resoldre el Mestre: les ombres de les bombolles (T14), l'accent en elements funcionals, i l'àrea tàctil de l'autor.

**Baseline de proves abans de tocar res:** `npx vitest run src/sections/xat` dona 256/257. L'única roja és `XatSection.test.jsx:1342`, que busca una pestanya que la closca ja no pinta.

### 2. Preguntes obertes (decisió del Mestre, no bloquegen)

- **P1 · El nom del grup del poble.** En mode seed/local, el títol el posa el client i serà el `nomPoble` («Gent de la Torre»). En remot el posa el servidor (`towns.name`, `2609282100_xat_de_pagina.sql:163-176`), i dirà «La Torre de les Maçanes». Si ha de dir «Gent de la Torre» també en remot, cal canviar el servidor. `requires_human_decision: true`.
- **P2 · La creació automàtica en remot.** La migració de pàgina demana moderació abans d'obrir els fils de pàgina a tot un poble (`2609282100_xat_de_pagina.sql:61-68`). Per això, en remot NO el crearé en silenci: la fila fixada del poble el crea quan la persona hi prem, igual que el «Comentar» de la pàgina del poble. En seed/local sí que es crea en entrar. `requires_human_decision: true` per a canviar-ho.
- **P3 · Pedra Seca contra WhatsApp.** La skill `sdp-clon-whatsapp` mana copiar al mil·límetre. Pedra Seca prohibix les ombres decoratives (§5) i reserva l'accent per a la marca (§2). Les bombolles porten ombra (T14) i la bombolla aliena és de color accent. No ho toque. La prioritat entre les dues skills la decidix el Mestre.
- **P4 · On viu la roda dentada.** La skill `sdp-app-grid-shell` §2 posa l'engranatge de configuració a la dreta de la capçalera de la columna esquerra. WhatsApp obri els Ajustos des de «Tu». Faig l'entrada de WhatsApp («Tu»), no toque la roda (que hui replega el rail) i el Mestre decidix si la roda també ha d'obrir el full.

### 3. Canvis proposats

Repartiment acordat amb Codex (auditoria 2145, ronda C1): tot el que segueix viu a `src/sections/xat/`, als blocs `.sdp-xat*` de `modules.css` i als espècimens del Xat del catàleg. No toque `App.jsx`, `PedraSecaEmbed.jsx`, `base.css`, `layout.css`, `Dialeg.jsx` ni `wordpress-plugin/`.

#### A · El full «Ajustos» (T1, el nucli del torn)

- **NEW `src/sections/xat/components/FullAjustos.jsx`.** El full, muntat sobre `Dialeg` amb `variant="sense-marc"`, sense canviar-ne el contracte.
  - **Pila interna.** L'arrel porta la X circular a l'esquerra. Cada subpàgina porta el ‹ circular a l'esquerra, el títol centrat i, opcionalment, una acció a la dreta. La mida és fixa.
  - **Arrel.**
    - El cercador filtra les files per etiqueta.
    - La targeta de perfil (avatar i nom) porta a `/el-meu-perfil`.
    - Grup 1: Preferits, que llista les converses marcades com a preferides (dada real, `preferit`), i Destacats, en construcció.
    - Grup 2: Historial, en construcció i amb un text honest.
    - Grup 3:
      - Compte: el perfil i «Tanca la sessió» en roig, amb l'eixida que ja existix.
      - Privacitat: porta a «Privacitat i dades» del Perfil.
      - Xats: l'amplària de les columnes (real, la mateixa funció que `/control-xat`), missatges temporals i multimèdia, en construcció.
      - Aparença: el tema (sistema, clar o fosc) i la llengua, reals amb `UIContext`.
      - Notificacions: en construcció.
      - Dades i memòria local: en construcció.
    - Grup 4: Ajuda, amb el centre d'ajuda de la Wiki, les condicions i la llicència (només rutes que ja existixen).
  - **Contingut honest.** Cap fila fingix una funció. Una subpàgina sense dades pinta l'estat buit de WhatsApp: títol en negreta i una frase grisa.
- **NEW `src/sections/xat/components/ajustosXat.js`.** El model de dades pur de les files (id, etiqueta, icona, destí) i la cerca. Porta les seues proves.
- **MODIFY `ClosCaXat.jsx`.** En el rail desplegat, l'avatar i «Tu» passen a ser un botó que obri el full; el llapis continua anant a `/el-meu-perfil`. En el rail plegat, l'avatar obri el full. El full es munta una sola vegada, dins de la closca.
- **Amplària de les columnes.** El model de valors predefinits passa a un mòdul compartit, perquè `/control-xat` i el full no tinguen dues còpies. `/control-xat` continua existint (D16).
- **CSS.** Un bloc nou, `.sdp-xat-ajustos*`, al final dels blocs del Xat de `modules.css`, només amb tokens. En estret, el full ocupa tota la pantalla, com les pantalles empeses de WhatsApp mòbil.
- **Catàleg.** Un espècimen nou, `EspecimenXatAjustos`, registrat al manifest, al `detailRegistry` i al `registre` (Pedra Seca §9).

#### B · L'aterratge al grup del poble (T1, «Gent de la Torre»)

- **NEW `src/sections/xat/usePobleAmfitrio.js`.** Llig `externalConfig.poble` i `externalConfig.nomPoble` i els torna a sanejar amb els sanejadors de `configAmfitrio.js`. Sense amfitrió no torna res, i socdepoble.org no canvia ni un píxel.
- **MODIFY `XatSection.jsx`** (el memo de `files`):
  - si la comunitat del poble existix (el `subjecte` és `poble:<id>`), va la primera de tot;
  - si no, s'hi posa una fila virtual fixada amb el `nomPoble`, que en prémer-la fa el recorregut `?sobre=poble:<id>` que ja existix.
- **NEW `components/EntradaDelPoble.jsx`.** Es munta al costat de `PanellInicialMobil`. Només en ample, en `/xat` sense fil ni consulta i una sola vegada per sessió:
  - obri el General de la comunitat del poble si ja existix;
  - en seed/local, la crea i l'obri;
  - en remot sense comunitat, no fa res (P2).
- **La guarda viu a `XatProvider`**, que sobreviu a les tornades a `/xat`: `consumixEntrada()`.
- **MODIFY `FakeChatOnboarding.jsx`.** Sense sessió, la llista falsa també porta la comunitat del poble amb el `nomPoble`.

#### C · La conversa (T1, detall de WhatsApp)

- **MOVE.** La funció `Conversa` passa de `XatSection.jsx:1033-1218` a `components/Conversa.jsx`, sense cap canvi de comportament. És el pas previ perquè les feines puguen anar en paral·lel sense trepitjar-se.
- **Agrupació de missatges consecutius** del mateix autor: la cua només a la primera bombolla, i als grups el nom de l'autor només a la primera.
- **Separador «N missatges no llegits»**, calculat en obrir la conversa amb `llegitFinsSeq`. En obrir, el scroll va al separador.
- **Scroll.** Només baixa sol si ja eres a baix o si el missatge és teu. Si no, apareix el botó flotant ⌄ amb el recompte dels nous.
- **Respostes.**
  - «Respon» al menú de la bombolla i barra de resposta damunt del compositor, amb ✕.
  - La cita dins de la bombolla quan hi ha `respostaA`. En prémer-la, porta a l'original si està carregat.
  - `sendChatMessage(fil, text, { respostaA })`: el port ja ho accepta i no canvia cap contracte.
- **Esborranys per conversa**, en memòria i per àmbit (`scopeKey`).
- **Marca «entregat»** (✓✓ gris), amb `rebutFinsSeq` conservat a `mapejaFil`.

#### D · La fila de la llista (T1) i els tokens (T2)

- **Previsualització.** Les marques de l'últim missatge propi, i «Tu: » als grups. La pastilla, grisa si el fil està silenciat, i el punt si és un no llegit manual.
- **T2.** Els literals passen a token sense canviar cap píxel: `68ch` a `--sdp-measure` si val el mateix, `--sdp-touch-min` a `--sdp-touch`, i `z-index` a l'escala. A més, el comentari desfasat de `modules.css:3440` es corregix. Les tensions de doctrina queden a la P3.

#### E · Prova rància

- **MODIFY `XatSection.test.jsx:1335-1350`.** La prova de «tornar a la conversa oberta en estret» es fa contra el control real (el botó d'arrere de la conversa), no contra una pestanya que no existix.

### 4. Pla de verificació

- `npx vitest run src/sections/xat` i les proves del catàleg (`src/sections/disseny`). Totes verdes, amb les proves noves de cada part.
- `node tooling/gates/design_guard.mjs --arrel=src`: cap violació nova al Xat.
- Navegador (pestanya pròpia, 3340): el full d'Ajustos a 1280, 820 i 375 px (obrir, navegar, cercar, tornar, Escape); una conversa amb no llegits, el scroll i les respostes; la fila del poble amb `nomPoble` injectat.
- Revisió adversarial de tots els canvis en dues fases separades (cacera i refutació), abans de declarar res.
- Rondes creuades amb Codex a l'auditoria 2145.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Pendent d'execució; cada resultat es registrarà a [[260930_2145_auditoria_claude]] amb l'ordre exacta i la seua eixida.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Tres maneres de fallar:**
  - **El full d'Ajustos dins de `soc-de-poble`.** `Dialeg` fa `showModal()` i ix de la caixa de WordPress. Ho està resolent Codex (ronda C2), i el full hereta la correcció sense tocar `Dialeg.jsx`.
  - **L'entrada del poble no ha de segrestar la navegació.** Una guarda mal posada tornaria a obrir el General cada vegada que es torna a `/xat`. Per això la guarda viu al proveïdor i no al component, i porta proves.
  - **Scroll i agrupació.** El nou comportament de scroll pot trencar la càrrega de l'historial per dalt (`XatSection.jsx:1059-1061`). Les proves existents de «Carrega'n més» han de continuar verdes.
- **Arbre concurrent.** Hi ha canvis a `App.jsx` i `sections.js` que no són ni de Codex ni meus (barra mòbil de 7 caselles, Agenda). No els toque ni els revertisc.
- **Mantenibilitat a sis mesos.** El model de les files d'Ajustos és una taula pura amb proves. Afegir-hi una opció real és canviar una línia de la taula.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
