---
type: acta
status: esborrany
description: Torn de Claude del 30-09 al 01-10 amb el Xat, el Traductor, el Calendari i la Boina Taronja fets i provats, i amb la barra mòbil, els tokens de la Consola i el commit pendents.
tags:
  - acta
visibility: private
reflex: sdp:torn_ddd7a133-b647-4153-830e-aa31d09b5bc1:e966df80-ca28-4f7f-b511-7fb184467ba0
---
# Acta Marmota de Claude, Xat, Traductor, Calendari i Boina Taronja

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ddd7a133-b647-4153-830e-aa31d09b5bc1:e966df80-ca28-4f7f-b511-7fb184467ba0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T00:37:57.239Z |
| Modificació | 2026-10-01T00:50:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Ultracode |
| Tokens consumits | Subagents dels dos workflows del Calendari: 6.831.940 (3.762.512 + 3.069.428). La resta del torn: N/D |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 2d5838a987f9ea587784fcffabbd3889bd42c72bce135f63e853343c6cf17cb2. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-10-01T00:37:57.239Z: esborrany creat; contingut i verificació pendents.
2026-10-01T00:50:00.000Z: v1.0.0, acta completa del torn de Claude: Xat, Traductor, Calendari, Boina Taronja, dates de prova, proves roges heretades, verificació i pendents.

<!-- SDP:SECTION acta.s4 -->
## Resultats

Torn `torn_ddd7a133` de Claude, obert amb la petorreta 260930_2135_prompt_claude (30-09, 21:35) i tancat amb esta acta (01-10, 02:45, hora de València). El pla és 260930_2135_pla_implementacio_claude i l'informe viu, amb totes les rondes, és 260930_2145_auditoria_claude. Contrastat amb l'última Acta Marmota, [[261001_0045_acta_marmota]] (MarIA), i amb el lliurament de Codex, 261001_0052_acta_lliurament_codex.

### 1. Part Tècnica (Graner Ple de Codis i Arquitectura)

**Primera meitat del torn (detall a l'auditoria 2145, seccions A i B):**

- **T1 · clon de WhatsApp al Xat:**
  - full «Ajustos»;
  - «Gent de la Torre» la primera i oberta en entrar;
  - conversa calcada (grups per autor, separador de no llegits, «Baixa al final», respostes amb cita, esborranys per conversa);
  - fila de la llista amb marques.
- **T2 · tokens.**
- **T3 · deu rondes creuades (C1-C10) sobre el carril de Codex**, inclòs el diàleg local dins del Shadow DOM.
- **Front del Traductor Sobirà (via B, DeepL)**, amb l'eixida de sessió sense `window.location.reload()` (P2 del Mestre).
- **Correcció de l'extractor del traductor:** ja no envia text ocult, de lector de pantalla, de controls ni editable. És el B6, que el Mestre va donar per segellat.
- **Revisió adversarial pròpia:** 28 de 28 troballes corregides.

**Segona meitat: l'ordre del Calendari i de la Boina Taronja (Mestre, 01-10).** La van executar dos workflows de tres carrils, cadascun amb revisió adversarial en dues fases (cacera i refutació). Les esmenes finals les vaig fer jo.

1. **Taxonomia del Mur:**
   - La pestanya ara diu «Calendari» (`MurSection.jsx`). El valor intern continua sent `'events'`, perquè no va a cap URL.
   - Hi ha un `CalendariMur.jsx` nou, amb el contingut d'`AgendaMur`, i també `TargetaDelMur.jsx` i `targetesMur.js`, que són la targeta i l'ordre compartits pel Mur i per `/calendari`.
   - `agendaMur.js` no es reanomena: el nomena el contracte segellat `src/data/contracte.js`.
   - `AgendaMur.jsx` i `src/sections/agenda/AgendaSection.jsx` queden sense cap importador. La porta `lint_calendari` ho comprova. No s'han esborrat: el hook ho impedix i és decisió del Mestre.
2. **La pàgina `/calendari`:**
   - `src/sections/calendari/CalendariSection.jsx` munta el MATEIX calendari del Mur. A `App.jsx` només han canviat la importació i la ruta.
   - L'Alerta «El calendari no està disponible» ha desaparegut.
   - L'agenda de Sollutia (capacitat `agenda`) es conserva com a font opcional, amb la Directiva Suprema de l'enxufabilitat:
     - si respon, els seus actes s'afigen;
     - sense la capacitat, no diu res;
     - si falla, ix una línia discreta amb «Torna a provar».
3. **Totes les targetes:**
   - `calendariGlobal.js`, pur i provat, passa al calendari els actes, les publicacions, els productes del Mercat i les pàgines del sistema que el Mur barreja.
   - Cada targeta va al dia de la seua pastilla (`dataDElement`/`momentDElement`). Els actes van els dies que ocorren.
   - **El mes que es veu el governa la URL**, sense cap `useState`: el `?date=`, el `?mes=AAAA-MM` o el mes d'obertura, que es recalcula quan arriben tard les pàgines del sistema.
   - Les fletxes i «Hui» escriuen `?mes=` i lleven `?date=`. Clicar un dia el posa, i tornar-lo a clicar el lleva.
   - Davall del calendari ixen totes les targetes del període: les del mes o les del dia triat, de la més nova a la més vella.
4. **La Boina Taronja:**
   - **Diagnòstic:** el codi no perdia l'hora. Les huit targetes de dalt eren pàgines del sistema amb una data de només dia (mitjanit UTC), i Pedra Seca §10 prohibix inventar-ne l'hora. L'hora arriba amb les dates de prova (punt 5).
   - **Pastilla clicable en lectura, a targetes i pàgines** (segon missatge del Mestre): porta al Calendari en el MES i l'any de publicació de la targeta (`/calendari?mes=AAAA-MM`, mes local), on ixen totes les targetes d'eixe mes.
   - **Nom accessible** en l'ordre en què es veu: «19:22 30/09/26 · Obri el calendari d'eixe mes».
   - **Historial:** dins del Calendari, la pastilla reemplaça l'entrada de l'historial (context `DinsDelCalendari`), i un sol «Enrere» torna d'on es venia.
   - **En edició no canvia res.**
   - **Coherència de dates:**
     - el Mercat pinta la boina amb el format únic «30/09/26» (`dataDElement`);
     - la Wiki i el Disseny lligen el `pageCopy` carregat i diuen la mateixa data que la seua targeta.
   - **Anell de focus en fosc:** l'anell de la boina (`.sp-card-header`) i el de l'enllaç d'autoria de la barra de pàgina ja no fan 1,26:1 (`modules.css`, al costat de la C15).
5. **Dates de prova** (`src/sections/mur/datesDeProvaMur.js`, aplicades només en mode seed a `content.js`):
   - huit targetes d'esta setmana amb dia i hora, calculades a partir de l'arrencada (de dilluns fins ara, entre les 8 i les 22, mai en el futur), de manera que no caduquen;
   - les tècniques, entre el 2 i el 15 de setembre: Disseny el 14/09 a les 18:25 i Versions el 03/09 a les 11:50;
   - el 2n Aplec, un acte real, conserva el 29/01/2023.
6. **Proves roges heretades:**
   - `ControlSection.test` adaptada al Panell compactat per MarIA (acta 0045);
   - `MarcaAmfitrio.capes` i les T6, T8 i T9 de `lint_logica_usuari` adaptades a la guarda `:not(.is-compact)` (C1-2 de Claude, aplicada per Codex; D5-T1 de Codex);
   - claus d'i18n `section.calendari.*` a les cinc llengües, amb la seua prova de paritat;
   - la importació de `Boto` que `App.jsx` no usava, retirada.

**Estat del Repositori:**

- **Fitxers creats en la segona meitat:**
  - `src/sections/calendari/` (`CalendariSection.jsx`, `calendariGlobal.js` i les seues proves);
  - `src/sections/mur/` (`CalendariMur.jsx`, `TargetaDelMur.jsx`, `targetesMur.js`, `datesDeProvaMur.js` i les seues proves);
  - `src/components/universal/barres/` (`pastillaCalendari.js` i la seua prova);
  - proves de dates de Wiki, Disseny i Mercat, i del focus de la boina;
  - `tests/lint_calendari.test.mjs` i `tests/lint_calendari_mes.test.mjs`.
- **Esborrats:** cap.
- **Ordres executades:**
  - `npx vitest run` (diverses tandes);
  - `node --test` de `lint_xat`, `lint-sessio`, `lint_calendari`, `lint_calendari_mes`, `lint_enxufe` i `lint_logica_usuari`;
  - el circuit `document.mjs` d'esta acta.
- **Cap commit.**

**Verificació:**

- **Bateria `npx vitest run src`** (començada a les 02:38): 280 fitxers, 4122 de 4124. Les dues roges són les T3 de la barra mòbil (`App.test.jsx:446` i `:479`, Pendents, punt 1).
- **Portes:**
  - `lint_xat`, 20 de 20;
  - `lint-sessio` net;
  - `lint_calendari` i `lint_calendari_mes`, 10 de 10;
  - `lint_enxufe`, 9 de 9, amb dos diagnòstics de deute heretat;
  - `lint_logica_usuari`, 16 de 17. La roja és de tokens sense definició al bloc de l'estratègia de la Consola (Pendents, punt 2).
- **Navegador** (dev server al 3340, mode seed, pestanya de fons ja tancada):
  - **Mur:** les 11 targetes porten hora («19:22 30/09/26»…), i la pestanya diu «Calendari».
  - **De la pastilla al Calendari:** la pastilla porta a `/calendari?mes=2026-09`, que mostra «Targetes del mes · setembre del 2026» i 10 targetes, de la més nova a la més vella.
  - **Navegació pel calendari:** el dia 14 dona `?date=2026-09-14` i «1 targeta: Disseny Pedra Seca». «Mes següent» dona `?mes=2026-10` i «Cap targeta este mes.». «Mes anterior» torna a setembre amb les 10.
  - **Historial:** tres pastilles dins del calendari no fan créixer l'historial, i un sol «Enrere» torna a `/mur`.
  - **Coherència de dates:** `/wikidepoble` diu «12:22 29/09/26» i `/disseny` «18:25 14/09/26», les mateixes dates que les seues targetes. `/mercat` pinta «14:07 30/09/26».
  - **`/calendari` a soles** ja no mostra l'Alerta i obri setembre amb 10 targetes.
  - Cap error a la consola.

### 2. Part Termodinàmica Psiquiàtrica (El Temps, Incidències i Trellat)

- **Medició del Temps:**
  - Inici i fi: 30-09-2026 21:35 - 01-10-2026 02:45, hora de València (5 h 10 min). Els dos workflows del Calendari van durar 41 i 35 minuts.
  - **Temps estalviat:** la revisió adversarial en dues fases va trobar, abans que el Mestre ho veiera, 14 defectes reals entre les dues tandes. Els més cars de trobar a mà:
    - la pastilla de la Wiki i del Disseny portava a un dia on la seua targeta no hi era;
    - la llista del Calendari es quedava en un dia que la graella ja no mostrava;
    - l'historial s'omplia d'entrades idèntiques;
    - l'anell de focus no es veia en fosc.
  - **Estat del Mestre:** N/D. Cap mètrica inventada de l'estat humà.
- **Incidències i Fusible Mental:**
  - El primer llançament del workflow va fallar per una errada de sintaxi del guió: cometes inverses dins d'una plantilla de text. Es va reescriure amb cometes «».
  - El missatge nou del Mestre va arribar a mig workflow i canviava el destí de la pastilla, del dia al mes del període. No es va interrompre: es va aplicar en la segona tanda.
  - Una primera versió de l'historial llegia la ubicació del router i trencava desenes de simulacions de prova. Es va canviar per un context propi, sense tocar cap prova aliena.
  - **Sense tapar res:**
    - les dues T3 de la barra mòbil continuen roges, perquè cap document acredita que la retirada de «Telefonades» siga una ordre;
    - els tokens sense definició de la Consola no es tradueixen per deducció, perquè la regla no designa el substitut (lliçó 260923 de `sdp-workflow`).
- **Patrons Detectats:**
  - Un mateix concepte («la data de la targeta») vivia en tres lectors diferents. Llegir el `pageCopy` carregat i un sol lector de dates (`llegixData`) ha eliminat tota una classe de desajustos.
  - Les proves que simulen el router amb una fàbrica tancada fan fràgil afegir cap hook nou al router. Un context de domini és més robust.
- **Decisions de Trellat:**
  - **La URL com a única font del mes visible:** elimina la sincronització entre estat i URL i corregix dues troballes alhora.
  - **El calendari, al mes i no a la setmana:** la setmana no existix ni al calendari ni a la URL. Afegir-la era sobre-enginyeria sense ordre.
  - **Les dates de prova, en una capa de seed:** no s'escriuen al copy, per a no posar dates inventades a producció.

### 3. Part Marmota (Checkpoint Executable i Següents Passos)

- **Estat final:**
  - Codi i proves al dia, sense commit, a la branca `backup-notes-publish`.
  - L'acta és a l'Escriptori: el hook no deixa crear documents a `10_actes/`, i ha de fer-ne el `handoff` MarIA o el Mestre.
  - El darrer pas executat va ser la bateria completa, amb el resultat que diu la Part 1.
- **Tasques pendents immediates:** a la secció «Pendents».

### 4. Metadades per a Màquines (Patrons Sistèmics)

```yaml
data: "261001_0245"
blockers:
  - "La barra mòbil ha perdut «Telefonades» sense cap ordre escrita: dues proves T3 roges (App.test.jsx)"
  - "Tokens sense definició al bloc de l'estratègia de la Consola (modules.css ~5726-5747): --sdp-radi-base, --sdp-text-sm, --sdp-text-sec, --sdp-text-xs, --sdp-fons-terciari, --sdp-ok"
  - "El hook no deixa esborrar AgendaMur.jsx ni AgendaSection.jsx, ni crear actes fora de l'Escriptori"
decisions_clau:
  - "La pastilla porta a /calendari?mes=AAAA-MM (mes local de publicació)"
  - "El mes visible de /calendari el governa la URL (?date= > ?mes= > mes d'obertura)"
  - "Les dates de prova són una capa de seed i no toquen el copy de producció"
  - "agendaMur.js conserva el nom pel contracte segellat"
requereix_auditoria: false
```

<!-- SDP:SECTION acta.s5 -->
## Pendents

Per al Mestre (`requires_human_decision: true`):

1. **La barra mòbil:** «Telefonades» ha desaparegut i Mercat ha passat abans de Pobles. Cap acta, ESTAT ni LEDGER no ho ordena.
   - Si es restaura, la recepta és al carril C de la segona tanda: `App.jsx:92`, el botó amb el `Dialeg` i la importació de `Boto`.
   - Si es ratifica, cal adaptar les dues T3, l'espècimen `EspecimenNavMobil` i els comentaris de `layout.css` i `App.jsx`.
2. **El bloc de l'estratègia de la Consola** usa tokens que no existixen. Cal designar els substituts; cap agent els ha de deduir.
3. **Esborrar els fitxers sense importador:** `src/sections/mur/AgendaMur.jsx` i `src/sections/agenda/AgendaSection.jsx`.
4. **El 2n Aplec (acte real de 2023):** manté la seua data, o es vol un acte de prova al setembre?
5. **Abast del nom «Calendari»:**
   - Mes o setmana: s'ha implementat el mes.
   - La píndola «Agenda» d'`EventCard`, `section.events.title` i el filtre de la cerca continuen dient «Agenda»: cal decidir si «Calendari» s'estén a la categoria de contingut.
   - Les targetes de `/pobles` no entren al calendari.
6. **Navegació i ratificacions:**
   - Clicar un dia fa `replace`. Cal decidir si «Enrere» ha de tornar del dia al mes.
   - L'anell de la boina també canvia en tema clar (de ≈3,4:1 a ≈7:1), com la C15: cal ratificar-ho.
7. **Decisions B4 de l'auditoria 2145:**
   - el nom del grup en remot;
   - Pedra Seca davant de «copiar al mil·límetre»;
   - la roda del rail;
   - el «✓✓ gris»;
   - la fila de Privacitat;
   - el pressupost i el format del traductor;
   - la C10-8.

Per a MarIA (amb lease) o el Mestre:

8. **Tancament del torn:**
   - escriure ESTAT i LEDGER (el text proposat és al B5 de l'auditoria 2145, i cal afegir-hi el Calendari);
   - fer el `handoff` d'esta acta a `10_actes/`;
   - executar `node tooling/gates/tancament.mjs --check --turn-id torn_ddd7a133-b647-4153-830e-aa31d09b5bc1`;
   - fer el commit.
9. **La ruta `/consola`** encara llig `PAGE_COPY` directament. Hui no es nota.
10. **La connexió WordPress → DeepL** no s'ha acreditat de punta a punta (carril de Codex).

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261001_0045_acta_marmota]]

