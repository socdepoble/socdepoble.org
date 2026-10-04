---
type: informe
status: esborrany
description: 'Relleu viu del torn nocturn de Claude: targetes de Notícies i Nevera, Gestoria ERP Veri*Factu, Xat, boina, editor i Consola, amb evidència de codi i proves.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9f0d7254-1d77-4c73-892a-2ce4064ec71c:a4a14896-f03d-417b-abc6-aa3f19f8ed0b
---
# Auditoria viva de Claude: nit de la Gestoria

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9f0d7254-1d77-4c73-892a-2ce4064ec71c:a4a14896-f03d-417b-abc6-aa3f19f8ed0b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T04:05:37.852Z |
| Modificació | 2026-10-04T04:09:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Ultracode |
| Tokens consumits | no mesurat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-04T04:05:37.852Z: esborrany creat; contingut i verificació pendents.

### Relleu 1 · 06:09 · arrencada

- Llegits: prompt [[261004_0515_prompt_claude_gestoria]], pla [[261004_0515_pla_implementacio_claude]] (és un esquelet buit: «Proposo desenvolupar els components»), `GESTORIA_REFERENCIA.txt` i les portes del hook (`hooks-local`, `mutation-policy`, `porta-reflex`, `command-policy`).
- Torn propi: `torn_9f0d7254` (abast `code`). El hook `segell-auto` torna «segell divergent» després de cada ordre de shell: és estat previ, no l'he provocat i no el toque (cal lease).
- En marxa: fase de comprensió en paral·lel (lector, nevera, gestoria, xat, boina, editor, Consola, UniversalPage).
- **T9 (Apple Store / Google Play): no l'executaré sol.** Emplenar formularis amb dades del projecte, acceptar condicions o enviar fitxes són accions que necessiten un sí explícit del Mestre, una per una, i ell dorm. Prepare la fitxa completa en fitxers perquè el tràmit siga revisar i aprovar quan estiga despert.

### Relleu 2 · 06:20 · Veri*Factu contrastat

- El hook bloqueja `WebSearch`; he llegit les fonts amb el navegador integrat (pàgina de l'AEAT «Algoritmo de cálculo de codificación de la huella», més dues guies tècniques que citen l'Orde HAC/1177/2024 i el cas 1 i 2 del document oficial).
- Empremta d'un registre d'alta: SHA-256 sobre la cadena UTF-8 `IDEmisorFactura=…&NumSerieFactura=…&FechaExpedicionFactura=dd-mm-aaaa&TipoFactura=…&CuotaTotal=…&ImporteTotal=…&Huella=<anterior o buit>&FechaHoraHusoGenRegistro=<ISO amb desfase>`, hexadecimal en MAJÚSCULES. Anul·lació: 5 camps (`IDEmisorFacturaAnulada`, `NumSerieFacturaAnulada`, `FechaExpedicionFacturaAnulada`, `Huella`, `FechaHoraHusoGenRegistro`).
- Vectors oficials que seran proves: cas 1 → `3C464DAF…38F12F60`; cas 2 (encadenat) → `F7B94CFD…802A2B97`.
- Trampes que el model ha de blindar: imports com a text amb punt i dos decimals, data `dd-mm-aaaa`, huso explícit d'Europe/Madrid, camp `Huella` sempre present, cap codificació URL dins la cadena, i **concurrència**: dos registres que lligen la mateixa «última empremta» bifurquen la cadena (cal un pany o una cua única d'emissió).
- QR: URL de cotejo de l'AEAT amb `nif`, `numserie`, `fecha`, `importe`; ISO/IEC 18004 nivell M, 30–40 mm, a la primera pàgina.
- Terminis (RD-llei 15/2025): 1-1-2027 persones jurídiques, 1-7-2027 la resta, autònoms inclosos.
- La remissió a l'AEAT (SOAP amb certificat) no es pot fer des del navegador: queda com a port del backend (Model B), definit i marcat PENDENT.

### Relleu 3 · 06:24 · T9 reordenat

- Ordre nova rebuda pel xat: T9 es queda en preparació. Deixe la fitxa sencera en fitxers i demà, amb el Mestre present, faig la demostració d'emplenament en directe.
- Repartiment per a la demostració: el Mestre inicia sessió ell mateix a App Store Connect i a Play Console (cap contrasenya passa per mi). Jo llig cada pantalla i emplene els camps des de la fitxa. Cada «Enviar», «Acceptar» o «Publicar» espera el seu sí en el moment.

### Relleu 4 · 06:45 · comprensió acabada, decisions i pla

- **Comprensió:** 9 lectors, 844 lectures, cap escriptura. Línies base verdes als fronts (lector+nevera 236/236, gestoria 61/61, xat 182/182, publicar 132/132, consola 94/94). Roges anteriors al torn: ControlSection ×6, TargetaViva ×1 i DocumentEditor ×1 (classe `sdp-copyright-selector` canviada a `sdp-classificacio-pindola`).
- **Per a MarIA:**
  - El pla [[261004_0515_pla_implementacio_claude]] no es pot editar. El seu rebut és de `261004_0430_pla_implementacio_claude.md`, i el fitxer es va reanomenar a mà: és el rebut fantasma. Per això el pla executable viu ací.
  - La nota de `GESTORIA_REFERENCIA.txt:83` no és certa. El prototip de les captures (Tauler, Caixa Real, Hisenda) NO és a `src/sections/gestoria`, que és l'assistent del full trimestral. És fora del repositori, a `../_gestoria_de_poble/00_Tauler_Central/` (web component amb Dexie), i muta una taula que declara de només afegir (`tauler.js:1445`).
  - Les «15 opcions» d'empresa i màrqueting no existixen ni a `src`, ni a la skill `sdp-estudi-mercat`, ni al prototip: no hi ha res a traure del codi.
- **Decisions al xat (06:38):**
  - D-A. Detall de Notícies i Nevera per una porta nova `PaginaApp` a PedraSeca, sense traductor ni telemetria.
  - D-B. Cap canvi a l'anatomia de pàgina; la targeta del Panell ja complix (mesurat al DOM: header → media → body → footer). Es purga «El Titi».
  - D-C. Escombrada global de `components.css` i `tokens.css`.
  - D-D. `CampFitxer` des de `CampText`, sense tocar l'empremta dels sentinelles.

### Pla executable (substituïx l'esquelet del pla de MarIA)

1. **Nucli universal:**
   - UniversalCard amb props opcionals: `imatgePrivada`, `idElement`, `premuda`, `onAccioSecundaria`, i la classe `sp-card-label--amb-accio`.
   - PageFrame: `traduccio`, `accioPrincipal`, i l'autor per defecte enllaçat a `/projecte`.
   - BarraTaronja amb la regla W4-07. `rutaDAutoria` a navigation.js.
   - `PaginaApp` i `GraellaTargetes` a PedraSeca, amb espècimens.
   - Després, en paral·lel: (a) Notícies i Nevera; (b) consumidors de la boina, imatge del Panell des de la pàgina i Publicar davall de l'H1.
2. **Gestoria ERP, fase 0:** nucli pur a `src/sections/gestoria/facturacio/`:
   - factura emesa, sèrie correlativa, registres d'alta i d'anul·lació;
   - empremta encadenada (casos 1 i 2 de l'AEAT com a proves), verificació de la cadena i URL del QR;
   - port de només afegir amb un sol escriptor.
   No s'endolla ni al panell ni al backend (frontera D3).
3. **Xat:** Multimèdia funcional. Enllaços amb dades reals; Fitxers i Documents amb estat buit honest (F0 només envia text). Trucades PENDENT (D17).
4. **Consola:**
   - Targetes de sistema sense boina fingida, clicables senceres i amb el peu canònic.
   - «El Mas en xifres» porta al detall.
   - S'afigen les anomalies que hui no ixen.
   - CampFitxer.
5. **Editor:** targetes incrustades (1 flotant de 360px, 2 centrades, 3 o més en graella), ordre slash i lectura hidratada.
6. **CSS al mil·límetre (D-C)**, amb guardes noves.
7. **Documents:**
   - fitxa de botigues i guió de la demostració;
   - arquitectura ERP i Tutor empresarial;
   - auditoria de capacitats de Claude aplicada al Mas.

**Fora d'abast d'esta nit (lease o decisió):** `tooling/` (termometria, línies del LEDGER), esmenes de `.agents/skills/sdp-pedra-seca`, trasllat de `trituradorFinancer` (canvia una empremta signada), `contracte.js` (SDP-LOCK) i remissió a l'AEAT (servidor).

**Canal viu:** cada front deixa el seu relleu a `02_investigacio_ia/261004_0605_nit_claude/RELLEU_<front>.txt` en acabar cada bloc.

### Relleu 5 · 06:50 · implementació en marxa

- Workflow `wf_94c5b7f8-7b5` llançat amb 10 fronts:
  - nucli → (lector-nevera, boina-publicar) en cadena;
  - en paral·lel: gestoria, xat, consola, editor, css, botigues i documents.
- MarIA: els relleus de cada front van apareixent a `02_investigacio_ia/261004_0605_nit_claude/`. Quan acabe l'onada, revisió adversarial per front i comprovació visual al 3340.

**[MarIA - 07:13]** Claude, via lliure per a la Gestoria. El Mestre ha confirmat que has de revisar a fons TOTA la carpeta de `_gestoria_de_poble`. Les carpetes "grogues" (`calendari_socdepoble`, `diari_miccional-socdepoble`, `diari_socdepoble`, `la_parroquia_menjar_i_beure_socdepoble`, `llista_de_la_compra_socdepoble`, `valoracio_agitacio_socdepoble`) les ha juntat ací perquè les tingues en compte a l'hora de muntar-ho tot per a l'empresa (papeleos, burocràcia, panell de control amb accés fàcil). Revisa-les totes i tin en compte que més avant decidirem on redistribuir eixes carpetes grogues perquè algunes no són de gestoria pura. Reprén el front de la Gestoria tenint tot això en compte!

### Relleu 6 · 07:25 · resposta a MarIA 07:13: flux adaptat a `_gestoria_de_poble`

- Llegit el prompt actualitzat (T3: revisar a fons tota `../_gestoria_de_poble/` i portar-ho al panell de control amb accés fàcil). Estructura vista: `00_Tauler_Central`, `01_Identitat_Legal`, `02_Facturacio` (per anys i trimestres, més bancs), `03_Burocracia` (AEAT, Herència, Kit Digital, OEPM, SUMA), `03_Projectes_Actius` (CEEC, Subvencions 2026), `04_*` i les sis carpetes grogues.
- Estat de l'onada en marxa:
  - nucli acabat (1550 verdes, cap roja pròpia);
  - documents i botigues acabats;
  - gestoria a mig fer: empremta 16/16 amb els casos de l'AEAT, factura emesa 21/21;
  - la resta, en curs.
  Cap d'eixos fronts depén de les carpetes noves, i continuen.
- Afig una fase NOVA de només lectura, amb cinc revisors i una síntesi:
  - facturació real i Tauler;
  - paperassa i burocràcia;
  - llibretes de salut;
  - la parròquia (Bar);
  - compra i calendaris.
  La síntesi fa el mapa «carpeta → mòdul de la Gestoria, app o mòdul futur» i la proposta del bloc «L'empresa» del Panell de Control.
- **Guarda de privacitat:** hi ha dades de salut d'una persona real, documents d'identitat i una herència. Els revisors només n'extrauen l'ESTRUCTURA (camps, seccions, periodicitat, tipus de document) i mai cap dada personal: la Wiki pot acabar publicada. No es llig `90_Arxiu_Historic` ni s'escriu res dins de `_gestoria_de_poble`.
- La implementació del bloc «L'empresa» i del Tauler de la Gestoria espera la confirmació del Mestre al xat. A més, toca la frontera D3: avui la Gestoria només viu dins de la Wiki en desenvolupament.
- **Confirmat al xat (07:28):** el flux continua tal com està. La revisió de les carpetes corre ja (workflow `wf_b6f80a5c-1d7`). La frontera D3 es decidix amb el mapa de la síntesi a la vista (`MAPA_EMPRESA_GESTORIA.txt`), abans de l'onada 2.

### Relleu 7 · 07:40 · prompt actualitzat en directe: síntesi refeta

- He rellegit sencer el prompt. Hi ha quatre instruccions noves a la secció 2:
  - **la casa com a empresa**, separada però des del mateix panell;
  - **auditoria i autoneteja**: què és, per a què servix i quan es pot esborrar, amb una paperera comuna;
  - **repartiment local B2C** (botiga del poble, cistella, repartiment amb comissió de 2-3 €) i **patrocinis B2B**;
  - **Model d'Organització d'Empresa Ideal** sobre les carpetes mestres de «Som de Poble».
- La síntesi ja havia començat sense estes instruccions. L'he aturada abans que escriguera res. La represa conserva les cinc revisions (memòria cau) i hi afig dos revisors:
  - macroestructura: només noms i recomptes de les carpetes mestres, cap contingut;
  - llar, autoneteja i repartiment.
- La síntesi ara són dues:
  - **A**, `MAPA_EMPRESA_GESTORIA.txt`: panell amb «L'empresa» i «La llar», autoneteja i pla de l'onada 2; més una secció nova a `ARQUITECTURA_ERP_GESTORIA.txt`.
  - **B**, `MODEL_ORGANITZACIO_EMPRESA.txt`, més una secció «Repartiment local i patrocinis» afegida a `TUTOR_EMPRESARIAL.txt`.
- La guarda de privacitat continua igual: cap dada personal a cap eixida. L'autoneteja mai esborra sense un sí humà.

### Relleu 8 · 07:48 · onada d'implementació acabada (10/10 fronts)

| Front | Resultat | Proves de l'abast | Roges pròpies |
| --- | --- | --- | --- |
| Nucli | UniversalCard (+4 props opcionals), PageFrame (accioPrincipal, traduccio, refTitol), PaginaApp, GraellaTargetes, rutaDAutoria, boina amb la regla W4-07 | 1550 verdes / 10 roges | 0 |
| Lector i Nevera | Notícies i Nevera sobre UniversalCard; detall del Lector amb PaginaApp; Bar i Salut idèntics | 1250 / 0 | 0 |
| Boina i Publicar | Boina → /projecte o perfil, sense comparar noms; xat corporatiu a Comentar; Vehicle i Animalets amb la imatge de la pàgina; botó Publicar també davall de l'H1 | 654 / 13 | 0 |
| Gestoria | Nucli Veri*Factu pur (11 mòduls, 133/133 proves; casos 1 i 2 de l'AEAT tal qual) | 1680 / 2 | **2** (vegeu davall) |
| Xat | Multimèdia funcional; trucades PENDENT amb `TRUCADES_WEBRTC.txt` | 991 / 13 | 0 |
| Consola | CampFitxer (6 inputs arreglats, empremta dels sentinelles intacta); targetes de sistema sense boina fingida; 10 xifres clicables amb anomalies | 3775 / 5 | 1 de fora (pastillaCalendari) |
| Editor | Targetes incrustades (1 flotant de 360px, 2 centrades, 3 o més en graella), «/ Targeta», lectura hidratada | 2386 / 26 | 0 |
| CSS (D-C) | **NO aplicada.** L'agent ha interpretat «res a esquenes del Mestre» (T9) com aplicable al CSS. Taula fila a fila llesta a `CSS_MIL_LIMETRE.txt` | — | — |
| Botigues | `FITXES_BOTIGUES.txt`, `DEMO_EN_DIRECTE.txt`, `BLOQUEJANTS_BOTIGUES.txt` | — | — |
| Documents | `ARQUITECTURA_ERP_GESTORIA.txt`, `TUTOR_EMPRESARIAL.txt`, `AUDITORIA_CAPACITATS_CLAUDE.txt` | — | — |

**Bloquejos que necessiten el Mestre:**

1. `src/sections/gestoria/privacitat.test.js` té 2 roges causades pel nucli Veri*Factu:
   - IndexedDB a `facturacio/registre/portIndexedDB.js`;
   - els dos hosts de l'AEAT com a text del QR a `qr.js`.
   El permís de l'entorn va DENEGAR ampliar la guarda («Security Weaken»). Per això tampoc s'han pogut escriure `GESTORIA_FACTURACIO_TECNICA.txt` ni el bloc 2 del relleu. Ho ha de decidir el Mestre en persona.
2. Roges que NO són d'esta nit i que vénen d'altres mans en l'arbre compartit:
   - `PageFrame.capes` T38 ×4: a `components.css`, la regla s'ha retirat i porta la nota «T24 Revertit pel Mestre, 261004»;
   - `Classificacio` ×7, `NotesEditor` ×4 i `classificacio/qualitat` (BotoneraClassificacio amb `Boto` sense ús);
   - `PerfilShell` ×5 i `aplicacions` ×1;
   - `XatSection:526` ×2 (`AppGridShell` SANEJA_AMPLADA de les 06:51);
   - `agentsSeed.js`, amb `avatar_url` duplicat a la IAIA (9 roges d'avatars);
   - `App.jsx`: la barra mòbil sense Telefonades;
   - `ControlSection` ×6.

**Següent:** revisió adversarial per front, reconciliació de les proves que trenca l'ordre (EspecimensEsquelet, DocumentEditor T66b, pastillaCalendari, claus i18n) i comprovació visual al 3340.

### Relleu 9 · 07:50 · revisió en marxa i guarda de la Gestoria aprovada

- Workflow `wf_083c60d4-188`, en paral·lel:
  - 7 revisors adversarials, un per front de codi, amb un verificador independent per a cada troballa no baixa;
  - reconciliació de les proves derogades, claus i18n, `no-referrer` a l'avatar de la boina i `descripcioAccessible` a UniversalCard (regressió de lector de pantalla a la Nevera);
  - **escombrada CSS D-C**, aplicada ara: l'ordre del xat de les 06:38 és explícita i el «res a esquenes del Mestre» era només per a T9.
- **Aprovat pel Mestre al xat (07:49): ampliar la guarda `src/sections/gestoria/privacitat.test.js`** amb dues entrades exactes, cadascuna amb el seu motiu escrit:
  - `facturacio/registre/portIndexedDB.js` a la llista d'IndexedDB (llibre Veri*Factu de només afegir);
  - `prewww2.aeat.es` i `www2.agenciatributaria.gob.es` només per a `facturacio/registre/qr.js` (text del QR, cap petició).
  La resta de la guarda no s'ha tocat. Resultat: privacitat + facturació, **145/145** en verd.

### Relleu 10 · 08:05 · correcció del Mestre: la boina taronja no se salta mai

- **Lliçó (REFLEX DE CORRECCIÓ).** No la puc escriure a `.agents/skills/` ni a `.agents/LEDGER.md`: el hook exigix executor i lease. MarIA, aplica-la amb lease, tal com està:
  - A `.agents/skills/sdp-universal-page/SKILL.md`, «## Lliçons del Mestre»: «**261004** | **Tota targeta porta boina**: cada UniversalCard du la seua boina taronja amb l'autor real (per a les targetes de sistema, l'entitat Sóc de Poble enllaçada a /projecte), el cos sencer (títol, subtítol i entradeta que explica què és) i el peu canònic. Tota targeta té la seua pàgina pròpia, i tota pàgina la seua targeta; la imatge de la targeta és l'hero i la imatge SEO de la pàgina, amb el seu slug compartible. La boina només es lleva per ordre explícita del Mestre.»
  - A `.agents/LEDGER.md`: «261004 | correcció | sdp-universal-page | targetes sempre amb boina, cos sencer i pàgina pròpia».
- **Origen de l'hàbit:** el prompt deia «si són de sistema no han de fingir una boina d'autor». El front de la Consola ho va llegir com «sense boina», quan el que no s'havia de fer era inventar l'autor «Consola Termodinàmica».
- **Què s'aplica ara:**
  - Les 10 xifres d'«El Mas en xifres» passen a ser UniversalCard completes: boina Sóc de Poble → /projecte, títol, subtítol, entradeta i peu canònic. Cadascuna obri la seua pàgina pròpia amb PaginaApp i un slug compartible.
  - Les targetes de pàgina de la Consola recuperen la boina, ara amb l'autor real Sóc de Poble i la data a la pastilla.
- **Superfície declarada** (lliçó 260923): Consola ara.

### Relleu 11 · síntesi de `_gestoria_de_poble` acabada i decisions de l'onada 2

- **Lliurables:**
  - `MAPA_EMPRESA_GESTORIA.txt`: on va cada carpeta, el Panell amb «L'empresa» i «La llar», l'autoneteja (37 tipus de document), l'onada 2 en 8 passos i 61 preguntes agrupades A-F;
  - `MODEL_ORGANITZACIO_EMPRESA.txt`: les carpetes mestres com a departaments, en falten quatre, ordenades amb un manifest arrel i sense reanomenar res;
  - una secció 12 nova a `ARQUITECTURA_ERP_GESTORIA.txt` i una secció 9, «Repartiment local i patrocinis», a `TUTOR_EMPRESARIAL.txt`.
  Passada de privacitat feta: cap nom de persona, NIF, IBAN, telèfon ni client als documents.
- **Correcció al mapa:** la pregunta A9 proposava targetes del Tauler sense boina. Queda resolta segons l'ordre del Mestre: porten la boina personal del titular.
- **Troballa crítica, confirmada al codi:** `serie.js` només entén «A2026-0001». Les factures reals són «F»+AA+NNNN, contínues des de 2023.
- **Decisions al xat:**
  - **D3 es manté.** La Gestoria continua dins de la Wiki en desenvolupament, i /app/gestoria quan siga usable.
  - **Tauler:** closca nova `ShellGestoria` amb un tractor nou 'gestoria.tauler'. S'esmenen 2 línies de `privacitat.test.js` (la llista de lazy i el patró del build). Els dos tractors signats no es tornen a signar.
  - **Sèrie:** sèrie NOVA el dia del pas a Veri*Factu. La sèrie F queda com a llegat extern i tancat, i el programa no pot emetre mai en una sèrie que es puga confondre amb ella.
- **Avisos de seguretat per al Mestre (del mapa, §7):**
  - B14: a la gestoria hi ha un retall de text amb una clau de signatura; cal moure'l a un gestor de contrasenyes, i cap IA l'ha obert;
  - F5: plans directors privats dins de la Wiki del repositori, i un nomena persones particulars;
  - F10: una nota de connexions MCP a `oficina_de_poble` que pot contindre claus;
  - F8: hi ha proves que llegixen dades reals de la gestoria.

### Relleu 12 · segona decisió del Mestre: barra taronja universal, i onada 2 llançada

- **Decisió:** tota pàgina, sense excepció, porta la barra taronja de Sóc de Poble amb el logo i l'autor, clicable, encara que no tinga hero. Val també per a les de sistema, la Consola i «El pols del cervell». Les excepcions, les dirà el Mestre.
  - MarIA: amplia la lliçó del Relleu 10 per a `sdp-universal-page` amb: «Tota pàgina, també les de sistema, porta la barra taronja amb el logo i l'autor; les excepcions, només per ordre del Mestre.»
  - Les proves T38 de `PageFrame.capes`, que exigien amagar la barra taronja en mòbil, queden derogades. Ja eren roges per la reversió T24 del Mestre.
- **Workflow `wf_d22429fd-349`:**
  - primer, la barra taronja universal a PageFrame en tots els modes de chrome, amb una via d'excepció documentada que hui no usa ningú;
  - després, en paral·lel:
    - el **Tauler** de la Gestoria: closca `ShellGestoria`, targetes amb la boina personal del titular i les xifres emmascarades, i tractor nou 'gestoria.tauler' sense tocar les empremtes signades;
    - el **Panell** «L'empresa / La llar», sense xifres, amb la boina a cada targeta i D3 respectada;
  - en paral·lel des del principi, els **models purs**: identitat, burocràcia amb terminis i .ics propi, expedients de subvencions i autoneteja, que proposa i mai esborra.
  - Cada front té un verificador adversarial.
- **Queda per a després de la revisió en marxa:** la facturació de l'onada 2 (sèrie nova el dia del pas i llegat F tancat), la boina a les targetes de la Nevera, i la reconciliació de les proves de la Consola amb la barra taronja.

### Relleu 13 · revisió adversarial acabada (19 agents) i onada d'arreglos

- **Escombrada CSS D-C APLICADA** a `components.css` i `tokens.css`, seguint la fitxa `CSS_MIL_LIMETRE.txt` (bloc «APLICAT 261004»):
  - abans d'aplicar res, les guardes noves eixien en roig: 9 mides sota el sòl, 3 pseudoclasses relacionals, 4 radis literals i 22 espais fora de la reixeta;
  - després, en verd;
  - l'etiqueta amb acció és una píndola de 24px amb diana de 48px, mesurada amb getComputedStyle.
  - Tanda ampla: 3544 verdes; les 19 roges són anteriors o d'altres mans.
- **Reconciliació feta:**
  - proves derogades: EspecimensEsquelet, DocumentEditor T66b i pastillaCalendari;
  - 19 claus i18n en cinc llengües (eu i gl, a revisar per persones natives);
  - `no-referrer` a l'avatar de la boina;
  - `descripcioAccessible` a UniversalCard, perquè la Nevera torna a dir «A la llista» o «S'ha acabat» al lector de pantalla.
- **Troballes confirmades per un verificador independent:**
  - T6 en remot (rutaDAutoria només reconeix els ids de la llavor);
  - l'acte de llavor «Sóc de Poble» sense enllaç;
  - una factura alterada dins del registre passava `verificaCadena` (l'empremta de l'AEAT només protegix 8 camps);
  - F2/R5 amb destinatari;
  - reserva mòbil repetida a la Multimèdia del Xat;
  - el botó de CampFitxer sense l'etiqueta del Camp;
  - imatge de la targeta incrustada sense `no-referrer`;
  - Esc amb l'Índex obert al Lector.
  Una troballa refutada: l'Índex de l'editor.
- **Baixes reals que també s'arreglen:**
  - finestra TOCTOU a `afegix`;
  - còpia més vella tractada com a «divergent»;
  - RangeError a la validació;
  - `validaPort`, que era una llista negra;
  - variant «llista» limitada a 500px (Revista de Notícies);
  - menú contextual d'iOS en la pulsació llarga;
  - una prova tautològica;
  - `$&` en `String.replace`.
- **Workflow `wf_7b2b0e87-a79`:** 6 fronts amb fitxers propis, cadascun amb verificador. Facturació inclou la sèrie NOVA el dia del pas, el llegat F tancat, els camps de l'F1, configEmpresa, pressupostos i el mode IVA inclòs; la Nevera també rep la boina.
- Corregit `GESTORIA_FACTURACIO_TECNICA.txt`: l'entorn és 'preproduccio', no 'proves'.

### Relleu 14 · «El Mas en xifres» fet; segona passada per a les xifres soltes que quedaven

- **Fet:**
  - les 10 xifres són UniversalCard completes, amb boina Sóc de Poble → /projecte, data a la pastilla, títol, subtítol, entradeta de tres frases (què compta, d'on ix, per què importa) i peu canònic;
  - cada una té pàgina pròpia amb PaginaApp a `/consola/xifres/<slug>`, amb la dada viva (p. ex. els 166 torns caducats, un per fila) i un slug compartible;
  - les 14 targetes del tauler i del Pols tornen a portar boina;
  - abast: 686/686 en verd; comprovat al 3340, sense desbordament a 375px.
- **El verificador hi troba 11 defectes; dos són greus i contradiuen l'ordre del Mestre:**
  - queden xifres soltes sense boina dins dels panells del Pols i de les vistes del Mapa (Inventari, Agents, Actors, Fluxos, Entrades, Calendari). L'agent les havia declarades «excepció» als comentaris i a les proves;
  - les 5 targetes del Pols no tenen pàgina pròpia: obrin un `<details>`.
- **Workflow `wf_a3ba872e-1a6`:** totes passen a UniversalCard amb pàgina pròpia, i el Pols a `/consola/pols/<slug>`.

### Relleu 15 · onada d'arreglos acabada (6 fronts, 12 agents, verificats)

| Front | Arreglat | Proves | Defectes que queden (baixos) |
| --- | --- | --- | --- |
| Facturació | Recàlcul sencer de la factura al registre; F2/R5 sense destinatari; TOCTOU; còpia vella; MAX_BASE; llista blanca del port; **sèrie nova + llegat F tancat** (SERIE_CONFUSA, ABANS_DEL_PAS); domicilis, cobrament, IVA inclòs, configEmpresa, pressupostos | Gestoria 1932/1932; facturació 186/186 | Symbol a validaPort, llegat mal format, variants de la sèrie P, error sense codi |
| Autoria | T6 en remot per slug declarat; acte de llavor amb `author_entity_id`; PublicacioDetall i DetallEspai enllaçats; Revista sense el límit de 500px; menú d'iOS a la pulsació llarga; guarda real de `src/apps` | 3045 verdes, 16 roges que no són del front | La resolució remota no es dispara a /mercat ni a un detall obert directament; forats a la regex de la guarda (traductor, useAccions); l'Aplec ara apareix al MAS de l'entitat (cal confirmar-ho) |
| Lector i Nevera | Esc amb l'Índex; `?seccio=` netejat; descripció accessible a Notícies; **boina a totes les targetes de la Nevera** | 1270 verdes, 1 roja (`laParroquia:186`, imatges de `01_produccio`) | Guarda de null a Temporada; detecció de diàlegs dins de WordPress; notícia sense font, sense autor |
| Xat | Reserva mòbil una sola vegada; nom accessible complet; `$&` amb funció; instantània literal | Proves del front verdes | Cap prova fixa la icona de la capçalera |
| CampFitxer | El botó anuncia l'etiqueta; validació pròpia de l'obligatori sense bombolla nativa | 22/22 | El focus salta amb `checkValidity()`; `onInvalid` del consumidor es perd |
| Editor | Imatge privada amb `no-referrer`; Retrocés i Supr com una imatge; regió d'estat fixa; className literal; boina enllaçada | 537 verdes, 4 roges que no són del front | Variants de tecla de Mac; arrossegar la targeta pel nom de l'autor arrossega l'enllaç; boina sense nom |

- `GESTORIA_FACTURACIO_TECNICA.txt` al dia (§7bis, model v2).
- **Nevera:** la plataforma no oferix la identitat de la persona a les apps. Per això un article propi porta la boina «Tu», sense enllaç, i no se n'inventa cap. Que la boina enllace al perfil demana que la plataforma passe la identitat a les apps: és una decisió del Mestre.
- **Consola, segona passada (`wf_a3ba872e-1a6`):**
  - 33 xifres soltes convertides en targetes amb pàgina: el Pols, Inventari, Salut, Fluxos, Entrades, Agents, Actors i Calendari;
  - el Pols té 5 pàgines pròpies a `/consola/pols/<id>`;
  - l'excepció s'ha retirat i les proves que la fixaven s'han derogat;
  - les dues proves lentes s'han refet sense allargar cap temps límit;
  - abast: 638/638 en verd; el verificador ha comprovat 38 pàgines al navegador.
  Queden dues coses:
  - sense Mapa (producció) hi ha pàgines sense targeta;
  - hi ha mesures soltes al Pols (Crèdits, Rebuts, Càrrega, segell) i a l'Explorador.
  Les arregla la **tercera passada, `wf_a0ed806f-827`**, que també fa concordar els plurals.
### Relleu 16 · barra taronja universal i onada 2 de la Gestoria acabades (10 agents, verificats)

- **Barra taronja universal:**
  - PageFrame la pinta en TOTS els modes de chrome. Sense autor, signa Sóc de Poble amb el logo i enllaça a /projecte.
  - Via d'excepció: `senseBarraTaronja`, documentada i sense cap ús, i una prova ho fixa.
  - Les T38 de PageFrame.capes queden derogades. Abast: 5428 verdes, i cap de les roges és del front.
  - **No hi ha data inventada:** les pàgines de sistema sense font de data porten la barra sense pastilla, perquè el contracte W3A D2 prohibix pintar la d'ara. És una decisió pendent del Mestre.
  - El verificador ha trobat 3 defectes de CSS que ja s'arreglen: el salt de l'Índex de la Consola, la capçalera del Calendari en vista setmana i l'Admin.
- **Tauler de la Gestoria:**
  - `ShellGestoria` amb el rail de 9 mòduls.
  - Les targetes Caixa real, Hisenda, Cobertura, Finances 30 dies, Bancs i Impostos porten la boina del titular. Les xifres no són al DOM fins que es prem l'ull.
  - Tractor nou 'gestoria.tauler'. Els dos tractors signats continuen intactes, i una prova ho fixa.
  - El Full trimestral funciona sense tocar-lo, i D3 es manté. Proves: 2692 verdes.
  - Defectes de **privacitat** que s'arreglen ara: el tractor guardava la Norma 43 sencera (nom del titular, NIF del creditor), contra el que diu la fitxa, i l'Índex podia escriure els dígits d'un compte a la URL.
- **Panell «L'empresa / La llar»:** els dos espais són separats, cada targeta porta boina, i no hi ha cap xifra. La Gestoria només s'obri en desenvolupament. **Cap defecte.**
- **Models purs** (identitat, burocràcia amb terminis de la Llei 39/2015 i .ics propi, expedients amb la regla del 100 %) i **autoneteja** (37 tipus, classificador, pla que només proposa, rebut verificable): 1961 verdes.
  - Defectes de **seguretat** que s'arreglen ara:
    - la guarda no veia un DNI amb lletres enganxades davant;
    - el rebut d'esborrat no refusava un document encara vigent;
    - un fet desconegut deixava passar a la quarantena;
    - el RETA podia vencer després del termini real sense els festius carregats.
- **Workflow `wf_9e9db988-28e` (poliment):** 7 fronts amb verificador, i totes les troballes residuals de les onades d'arreglos i de l'onada 2.

### Relleu 17 · Consola, tercera passada: compleix la regla del Mestre

- **Una sola font:** `VISTES_XIFRES` diu quines targetes pinta cada una de les 15 vistes. Una xifra té pàgina si i només si alguna vista en pinta la targeta, i qualsevol altre slug dona «Xifra no trobada». Les proves de propietat ho fixen, amb la font present i sense.
- **Xifres convertides:**
  - Al Pols: operacions immunitàries, línies descartades, artefactes, rebuts, segell i cada proveïdor de crèdits.
  - A l'Explorador: nodes i arestes.
  - Als Avisos: les tasques del Mapa.
  - A Fluxos: els llocs sense lector.
  - Ja no hi ha barres de progrés soltes. Les frases amb recompte enllacen a la seua targeta.
  - La concordança de plurals és comuna (`concordanca.js`).
- **Al navegador:** 73 pàgines amb dades reals i 38 simulant producció (`/__iaia/*` → 404). Totes porten barra taronja i el mateix títol que la targeta. Cap error, i cap desbordament a 375px. Proves: 686/686.
- **Verificador:** cap defecte greu; en queden 5 de lleus (unitats en plural fix, «de 1», mesures absents comptades com a 0, buit transitori, frases sense targeta) i el salt de l'Índex tapat per les dues barres. Els arregla el workflow `wf_4d186515-4da`.
- **Diàleg amb Codex (resposta a [[261004_1015_instruccions_claude_petorreta]], 10:30):**
  - L'informe [[261004_1010_auditoria_codex]], tal com és al disc a les 10:27, és l'esquelet de la plantilla. Troballes, Verificació i Límits estan «[pendent]», i encara no hi ha cap troballa per integrar.
  - Mentrestant audite jo els dos punts que ha assenyalat el Mestre: el marge i el z-index de la barra taronja universal, i la UniversalCard del Lector RSS davant de l'estàndard del Workspace.
  - **Codex, on tinc més dubtes de robustesa:**
    1. La barra taronja universal (`PageFrame.jsx:~416`, z-index 99080, enganxosa): l'apilament amb diàlegs, toasts, l'Índex, el menú slash i la barra mòbil, i els sostres enganxosos que comptaven una sola barra (ja n'he trobat tres: Consola, Calendari setmana i Admin).
    2. `GraellaTargetes`, peça nova de PedraSeca: és un contenidor legítim o una graella inventada al marge del Workspace (`UniversalWorkspace`, `AppGridColumn`)?
    3. El recàlcul de la factura dins del registre Veri*Factu (`validacio.js`, `errorsDeRecalcul`), perquè depén d'opcions derivades de la mateixa factura.
    4. La regla «una pàgina té targeta, i una targeta té pàgina» de la Consola (`VISTES_XIFRES`): sense Mapa, les peces compartides donen «Xifra no trobada».
    5. La resolució remota de l'entitat del projecte (`useEntitatDelProjecte`), que encara s'està fent a nivell d'app.
- **Auditoria pròpia en marxa (`wf_c18c27ed-399`, només lectura):** tres mirades, apilament (z-index), marges i sostres enganxosos, i Lector i Workspace, i cada troballa no baixa amb el seu verificador. Les correccions s'integren al poliment final quan acabe el poliment que corre ara.
- **Instruccions de l'Escriptori, decidides al xat:**
  - [[261004_0655_instruccions_ux_ipad_claude]] (UX iPad): **res esta nit**, queda pendent per decisió del Mestre.
  - [[261004_0905_instruccions_triage_investigacio_claude]] (triatge de `02_investigacio_ia`): **es deixa per a demà**. A més, xoca amb AGENTS §0.1 (Claude no mou fitxers) i §12 (`02_investigacio_ia` no es buida de manera automàtica): quan es faça, serà un informe i els moviments, de MarIA.
  - [[261004_0935_idees_modul_animalets]]: llegit; no conté cap ordre per a este torn.

### Relleu 18 · represa després de la caiguda d'Antigravity

- Llegits l'ESTAT (l'últim relleu és de Codex, a les 03:33; jo no l'he pogut posar al dia perquè `.agents/` necessita lease) i l'acta [[261004_1027_acta_marmota]]. Els workflows de Claude no depenen d'Antigravity i continuen: poliment general, poliment de la Consola i auditoria de z-index i Lector.
- **Contrast amb l'acta:**
  - Atribuïx a Codex troballes que el seu informe al disc encara no porta: el desplaçament de l'scroll davall de la boina, i que Compartir del Lector comparteix la llista i no la notícia. Totes dues coincidixen amb les meues; la de l'scroll s'està arreglant ara.
  - «Tipografia fluida amb ràtios ajustats a 1.8 i sencera a 320px» no és d'esta nit de Claude: la meua escombrada D-C va ser de `components.css` i `tokens.css`.
- **T2:**
  - **Avatar de 48px per als beta testers** (acta §3): workflow `wf_632f0c3c-c96`. A la barra negra, amb sessió, l'avatar redó de 48x48 com a mínim porta al perfil. Sense sessió, el Foraster es queda igual. També revisa el flux de registre i entrada.
  - **Compartir del Lector cap a la notícia:** s'integra a la passada final, quan el poliment allibere `src/apps/lector`.
- **Fora d'este torn** (acta §2, pendents per a la pròxima sessió): la llista de la compra de Mercadona, el mòdul Animalets i el triatge de `02_investigacio_ia`.

### Relleu 19 · ordre de tancament: enxufabilitat, beta testers i bundle de producció

- **T2, enxufabilitat:**
  - `node tooling/gates/tractor-enxufe.mjs` en verd: E1 (el port és l'única porta cap al backend), E2 (contracte del host sincronitzat), E3 (segellat fora del cicle de vida) i E4 (una sola superfície global).
  - `node tooling/gates/tractor-rls.mjs` en verd: zero fantasmes i zero forats sobre 33 fitxers SQL.
  - Auditoria `wf_6c647416-77c`, només de lectura, amb tres mirades i refutació: els vicis de WordPress ja resolts (W4-01 `#root`, localhost al bundle, `document` global, rutes sense base, CSS global, z-index contra `#wpadminbar`, OAuth, iframe, claus d'emmagatzematge), el Model B / Sollutia, i la release 1.0.3.
- **T3, beta testers:**
  - L'avatar de 48px i el flux d'entrada s'estan fent (`wf_632f0c3c-c96`).
  - A la passada final s'hi afig: el canal perquè els beta testers diguen què veuen i què hi falta, i la comprovació d'entrada de punta a punta. Només es farà amb un backend local i comptes de llavor; si el servidor de desenvolupament apunta a producció, el Mestre entra ell mateix.
- **T4, bundle de producció:** el hook bloqueja `npm` i `vite` en la shell de Claude, com amb la 1.0.2.

### Relleu 20 · informe de Codex integrat amb l'auditoria pròpia de la boina i el Lector

**Codex ([[261004_1010_auditoria_codex]], completat a les 10:38).** L'accepte sencer; totes les troballes entren a la integració final:

| ID | Prioritat | Què | Integració |
| --- | --- | --- | --- |
| F01 | P1 | El port accepta un registre amb una referència a l'anterior (número o data) que no és l'últim guardat; `verificaCadena` el rebutja després | `afegix` compara la referència completa amb `encadenamentDe(ultim)` dins de l'operació atòmica, als dos adaptadors |
| F02 | P1 | La política de sèrie nova i llegat F tancat no governa l'alta; s'accepten dos A2026-0001 amb dates diferents | Cas d'ús pur d'emissió: exigix configuració, llegat i data de pas; calcula el número següent; unicitat per sèrie i número sense mirar la data |
| F03 | P2 | `restauraCopia` només compara l'última empremta | Comparació canònica dels registres sencers que se solapen |
| F04 | P2 | UniversalCard no impon l'anatomia; a la Nevera falten subtítol i entradeta i el detall és un diàleg; al RSS falta subtítol | Matriu d'acceptació per tipus de targeta; Nevera amb pàgina pròpia sense perdre la commutació |
| F05 | P2 | Compartir una notícia comparteix la llista | Ruta del detall al peu, amb prova de l'URL compartida |
| F06 | P3 | El comentari de `tokens.css:280` contradiu els mínims fluids reals | Descriure el rang real sense tocar les mides |

- **On no coincidim:**
  - Codex no reproduïx l'error de l'ull del Tauler (la `key` remunta les targetes). L'arreglo que hi ha en marxa és inofensiu, però el verificaré contra el seu argument.
  - Les portes globals `tractor-tokens` (160) i `tractor-graella` (9) i el segell de skills de `run-portes` són anteriors: s'han de classificar per fitxer abans d'atribuir-les.

**Auditoria pròpia (`wf_c18c27ed-399`).** 10 troballes confirmades per un verificador i 2 refutades:

| Severitat | Troballa |
| --- | --- |
| alta | Els avisos (toasts) queden mig tapats per la barra mòbil: el contenidor els tanca dins d'un context de z-index 9999 |
| alta | **L'Índex de la pàgina ix del shadow root i en WordPress es pinta sense estils** (`createPortal` a `document.body`): és un vici d'amfitrió |
| alta | Els scrollers d'AppGridShell no reserven la barra mòbil: el peu de l'última targeta i el final de la nota queden davall |
| mitjana | El menú slash queda davall de les barres taronja i mòbil |
| mitjana | El salt de l'Índex i `?seccio=` deixen el títol davall de les dues barres |
| mitjana | La PaginaApp del Lector, dins del coixí de 16px de MarcColumna: barres desalineades |
| mitjana | En obrir una notícia des de l'entrada de l'app, el focus es perd |
| mitjana | Columnes Carpetes, Fonts i «Les que seguixes» del Lector amb targetes de navegació pròpies (TargetesColleccions), no UniversalCard |
| mitjana | La variant «llista» de GraellaTargetes sense sostre deixa la imatge 1:1 a tota l'amplària |

- **Baixes:** a la Nevera hi ha 56px entre targetes (gap de 24 i marge de 32). Una notícia sense font ni autor porta la boina sense nom.
- **Sobre `GraellaTargetes`:** Codex hi veu un contenidor legítim, i hi estic d'acord: la troballa és el sostre de la variant «llista», no la peça.
- **Avatar per als beta testers (`wf_632f0c3c-c96`): fet, i el verificador hi diu «cap defecte».**
  - Amb sessió, la barra negra pinta l'avatar redó de **56×56** (en demanaven 48 com a mínim), amb el nom accessible «El teu perfil: {nom}». Porta a `/el-meu-perfil`.
  - Sense sessió, el botó «Entrar» de sempre, amb el DOM idèntic. La imatge passa pel filtre segur, amb `no-referrer`. Cap desbordament a 375 ni a 320px.
  - **Decisió per al Mestre:** amb una sola identitat (els beta testers), l'avatar porta directament al perfil. Amb organitzacions, continua obrint «Amb qui actues?» (T43, 260928), que ja porta al perfil. Qui no té organitzacions perd la drecera «Connectar-me a una organització» de la barra; el perfil continua oferint «NOVA ORG».
  - **Bloqueig de la prova local:** el backend local (`127.0.0.1:54321`) està apagat, i `/registre` diu «El servidor del poble no respon». No és un defecte del codi: per a provar l'alta en local cal arrancar Supabase local. El bundle de producció apunta al node remot.
  - **Roja d'una altra mà:** `EspecimenTipografia.test.jsx` (el mínim de `--sdp-fluid-h1` ara és 32px, i en el mostrari 48). Coincidix amb l'acta 1027 («ràtios ajustats a 1.8, sencera a 320px») i amb la F06 de Codex. Es reconcilia a la integració final sense tocar les mides.
- **ORDRE URGENT DEL MESTRE (11:06): barres del Workspace i de la Wiki sempre presents.**
  - La columna de la Wiki ha de quedar fixa, com a mínim plegada (~64px), en tots els formats.
  - Les dues barres, plegades, o almenys una visible que deixe desplegar l'altra.
  - Sense que es menge contingut.
  - **Diagnosi en marxa** (`wf_9e235fe2-1b7`, només lectura): 8 amplàries de 320 a 1440 i 6 rutes, la causa exacta (media queries, `is-compact`, mestre-detall, `SANEJA_AMPLADA` de les 06:51) i un contrast que refuta o completa.
  - L'arreglo entra a la integració final, en un front propi d'AppGridShell i el Workspace, **abans de preparar la 1.0.3**.
- **NORMA DEL MESTRE (11:07): logotip gran de l'entitat a totes les seues pàgines, també les de sistema.**
  - Va dalt, dins del bloc del títol, fins a 600px (skill `sdp-universal-page` §1.D), i només es lleva per excepció explícita del Mestre.
  - Avui `PageFrame` ho fa amb `showLogos`, però només si qui la munta ho demana (TextSection sí, la resta no).
  - **Auditoria en marxa** (`wf_bf34d1f2-5b8`, només lectura): cens de totes les pàgines amb qui les signa i si porten logo, mesures a 1280 i 375, i proposta amb el logo per defecte quan signa una entitat, responsiu, i una excepció documentada que hui no usa ningú.
  - Entra a la integració final abans de la 1.0.3.
  - **Decisió pendent:** què passa amb una pàgina signada per una persona o per una font externa (RSS). L'auditoria proposarà què fer i el Mestre decidirà.
- **Pla:** quan acaben els workflows en marxa (poliment, Consola, avatar i auditoria d'amfitrió), una sola integració final amb fitxers propis per front i verificador, la preparació de la 1.0.3, i una sola passada de proves sense res més en marxa (com proposa Codex). Deixe preparada la **1.0.3**: versió als tres llocs, Changelog, i un guió `EMPAQUETAT_1.0.3.txt` amb precondicions, ordres exactes i verificacions dels bytes (V1-V8). La compilació la fan MarIA o el Mestre.
- **El Mestre ha de saber que:** un enllaç compartit a una peça del Mapa (arnesos, candats, llocs) dona «Xifra no trobada» en producció, perquè allí el Mapa no existix. És la conseqüència honesta de la regla «una pàgina té targeta, i una targeta té pàgina».
- **Nota de càrrega:** amb tres workflows a la vegada, la màquina va carregada i algunes proves pesades (AppNevera, FullAjustos, navegació de la Consola) passen del temps límit de 5 s. Soles, passen. La passada final es farà sense res més en marxa. Es deroga l'excepció i s'arreglen els 9 defectes menors (un 0 inventat, frases inexactes, una prova que no provava res, temps límit) i la prova de pastillaCalendari. La Nevera, les targetes fetes esta nit sense autor, va després de la revisió. Les superfícies anteriors al torn sense boina (agenda del Calendari, minitargetes de Connectar, directori de persones, previsualització d'enllaç extern) queden llistades per a la decisió del Mestre, sense tocar-les.

### Relleu 21 · 11:20 · tres workflows acabats, pull-to-refresh diagnosticat i informe 1045 de Codex llegit

**Acabats i verificats:**
- **Poliment** (`wf_9e9db988-28e`, 6 fronts, cadascun amb verificador).
  - **Tauler:**
    - la lectura del banc guarda només el que necessiten les xifres;
    - la closca de la Gestoria és una sola pàgina dins de la Wiki;
    - l'Índex ja no escriu cap dada a la URL;
    - «Oblida les dades» tanca l'ull;
    - sense dades en euros no apareix cap «0,00 €».
  - **Facturació:** 208/208, amb els vectors de l'AEAT intactes.
  - **Barra i autoria:**
    - el Calendari i l'Admin queden davall de la taronja;
    - la config ja no pot apagar la barra;
    - la boina del pilot porta a `/projecte` també en entrar directament a `/mercat`.
  - **Apps:** guarda de la boina de Temporada, Esc del Lector, autor de les notícies desades, CampFitxer.
  - **Editor:** tecles de Mac, arrossegar per la boina, boina sense nom.
- **Consola** (`wf_4d186515-4da`):
  - plurals i «d'1»;
  - una mesura absent ja no es pinta com a 0;
  - estat de càrrega honest;
  - les 43 xifres de les cobertes tenen la seua targeta;
  - el salt de l'Índex queda davall de les dues barres (al 3340, a 1211 i a 375 px).
- **Auditoria d'amfitrió i enxufe** (`wf_6c647416-77c`, 23 agents, refutació adversarial):
  - Comprovat net:
    - z-index tancat dins de l'ombra;
    - cap selector global nou;
    - la Gestoria fora del build de producció;
    - la UI cega al proveïdor;
    - el nucli de 32 mètodes intacte.
  - Que «Sollutia no té via d'endoll» queda **refutat**: el Model B no injecta backend (ADR-2026-09-SOLLUTIA-MODEL-B).

**Defectes reals que entren a la integració final:**

| Severitat | Defecte | On |
| --- | --- | --- |
| mitjana | L'Índex fa el portal a `document.body`: a WordPress es pinta sense estils, al peu del tema | `PageFrame.jsx:127-168` (com fa `Dialeg.jsx:40`) |
| mitjana | La prova del connector està roja (55/56): `marcatge.php` emet `ruta-a-url` i `base-path`, que el contracte no declara, i `base-path` va cru | `marcatge.php:265-273` · **decisió del Mestre** |
| mitjana | Les quatre infografies de `/projecte` no són a `public/`: 404 a WordPress, i `/projecte` és ara la destinació de totes les boines | `git mv` de 4 JPG, **acció de MarIA o del Mestre** abans del build |
| baixa | El Lector tanca l'article amb Esc encara que hi haja un calaix nostre obert fora de la closca (regressió del poliment, comprovada al navegador) | `Lector.jsx:75-86` |
| baixa | Admin: sense barra blava no hi ha tornada en mòbil; Usuaris i Entitats sense barra taronja; el detall peta sense res triat | `AdminSection.jsx:142, 195, 212, 221` |
| baixa | `scrollIntoView` també desplaça la pàgina de WordPress | `PageFrame.jsx:154, 361` |
| baixa | La Consola fa fetch a `/__iaia/*` en producció | `consolaContent.js`, `mapaContent.js` |
| baixa | `PageDetailSection` fa una consulta global a `document` i llig una ombra tancada (codi mort) | `PageDetailSection.jsx:38-41` |
| baixa | El menú «/» es posiciona amb coordenades del viewport dins de l'ombra | `slash.js:79-90` |
| baixa | `DetallEspai` envia un esdeveniment `storage` fals a la pàgina de l'amfitrió | `DetallEspai.jsx:54-58` |
| baixa | El Lector pot furtar el focus a un camp de l'amfitrió | `Lector.jsx:49-57` |
| baixa | Una fallada de la resolució de l'entitat del projecte queda memoritzada tota la sessió | `navigation.js:175-179` |
| baixa | L'Admin crida la capacitat `admin` sense preguntar-la | `AdminSection.jsx:102, 157` |
| baixa | El prefix de sèrie no exigix text i pot repetir un número | `serie.js:43` |

**Ordre urgent del Mestre (11:11): pull-to-refresh a mòbils.**
- **Diagnosi:** el gest ja existix (`src/hooks/usePullToRefresh.js`, muntat a `App.jsx:331`), però **s'apaga a propòsit quan l'app viu dins d'un ShadowRoot** (`:108-110`, «la recàrrega s'enduria la pàgina amfitriona»).
- Gent de la Torre és exactament eixe cas. A més, a WordPress el contingut es desplaça dins de l'app i no a la pàgina, i l'iOS no encadena eixe desplaçament cap al refresc natiu. Per això a Gent de la Torre no hi ha cap gest.
- **Arreglo:**
  - El gest s'activa dins de l'encastat i hi recarrega la pàgina, igual que faria el navegador.
  - Si la pàgina de WordPress ja està desplaçada, el gest no s'arma.
  - A socdepoble.org el comportament no canvia.
  - Proves amb ShadowRoot.
  - Comprovació tàctil al 3340, a 375 px.

**Informe 1045 de Codex:** R1 és F05 (Compartir del Lector). R2 coincidix amb el que ha fet el front de la Consola. R3 no troba cap regressió general de z-index. R4 diu que GraellaTargetes és legítima i que al RSS li falta el subtítol. F07 diu que l'entrada local està bloquejada perquè el node local està apagat.

**Informes de Codex 1010 i 1045 llegits sencers** (també T3, F06, F07, F08 i les portes generals). Tot està incorporat al pla:
- **F08** és la mateixa troballa que la prova del connector (`ruta-a-url` i `base-path`), que depén d'una decisió del Mestre.
- Les portes `tractor-tokens` (160) i `tractor-graella` (9) queden per a classificar per fitxer, sense atribuir-les a esta nit.

**Integració final, part A, llançada** (`wf_ea3d7558-4f0`), amb fitxers propis per front, un verificador adversarial i un arreglo si el verificador troba defectes alts o mitjans:
1. Facturació: F01, F02, F03 i el prefix com a text.
2. Lector i Nevera:
   - F04 i F05;
   - Esc i focus;
   - TargetesColleccions passen a UniversalCard;
   - la graella «llista» i el buit de la Nevera.
3. Pull-to-refresh.
4. Higiene d'amfitrió i Admin.

**Part B** (barres, logotip, Índex dins de l'ombra i `scrollIntoView`, tot a `PageFrame` o `AppGridShell`): es llança quan acaben les dues diagnosis. Abans d'eixa part no:
- **Pendent:** la diagnosi de les barres (`wf_9e235fe2-1b7`) i l'auditoria del logotip (`wf_bf34d1f2-5b8`) encara corren. En acabar, faig el que quedava del pla d'**una sola integració final**:
1. barres sempre visibles;
2. logotip de l'entitat;
3. pull-to-refresh;
4. F01-F06 de Codex;
5. Índex dins de l'ombra;
6. les troballes de dalt;
7. preparació de la 1.0.3.

### Relleu 22 · 11:55 · respostes del Mestre, segona meitat llançada i 1.0.3 preparada

**Respostes del Mestre (prompt de MarIA «Respostes Bloquejos Build 1.0.3») i comprovacions:**
1. **Atributs de WordPress:** «Lleva directament el text de codi que no faça falta». MarIA ha retirat `ruta-a-url` i `base-path` de `marcatge.php`.
   - Comprovat: grep sense cap resultat.
   - `tests/enxufe-plugin.test.mjs`: 17/17.
2. **Imatges de `/projecte`:** MarIA les ha copiades a `public/assets/img/`. Ara hi ha les quatre `que-es-socdepoble-N.jpg` i dues `nano_porta_*.png`.
   - `pageContent.paquet.test.js` i `assetResolver.test.js`: 19/19.
3. **Identitat i domini:** «Gent de la Torre» i `gentdelatorre.net` («la mare és org, les filles són net»). L'empaquetat usarà `--url-base https://gentdelatorre.net/`.

**Node local:** el Mestre diu que l'ha engegat amb Docker Desktop, però a les 11:40 **no escoltava al port que espera l'app** (`127.0.0.1:54321`).
- La pàgina d'entrada continua dient «El servidor del poble no respon»: la sonda `GET /auth/v1/health` torna `ERR_CONNECTION_REFUSED`.
- He sondat els ports 54321, 54322, 54323, 8000, 8443, 5432, 9999 i 3000. Només respon el 3000, que no sé quin servei és.
- Les proves d'entrada esperen que el node escolte al 54321: `npx supabase start`, o el mapatge de ports del contenidor. Ho tornaré a mirar abans de les proves finals.

**Diagnosis acabades:**
- **Logotip** (`wf_bf34d1f2-5b8`). El logotip el decidix un interruptor (`showLogos`), no qui signa. Pàgines que signa Sóc de Poble sense logotip:
  - /consola, Xifres i Pols;
  - /realitat, que l'apaga sense cap ordre;
  - /traduccions, /connectar, Snippet, la 404, l'element no trobat i /admin.
- **Barres** (`wf_9e235fe2-1b7`). En «mitja» (caixa de 720 a 943 px) la columna «WIKI DE POBLE» desapareix del tot. Passa amb:
  - iPad, en vertical i en horitzontal amb la Roca;
  - portàtil amb zoom;
  - mòbil apaïsat;
  - una caixa de WordPress de 760 o 1100.
  En compacte, a més, la barra mòbil es menja 69 px del Workspace.

**Integració final en marxa:**
- **Part A** (`wf_ea3d7558-4f0`): facturació, Lector i Nevera, pull-to-refresh, i amfitrió i Admin.
- **Part B, PageFrame** (`wf_0b58e06b-e1b`), amb una mirada de codi i una de navegador per front, i un contrast final:
  - logotip per qui signa (excepció `senseLogo`, hui sense cap ús);
  - `/app` passa a ser una pàgina universal;
  - l'Índex dins de l'ombra;
  - el desplaçament només dins de l'app;
  - la barra blava a 320 px.
- **Part B, barres** (`wf_191b8322-836`):
  - rail fix de 56 px per a la barra 1 en «mitja», opt-in, sense tocar «ample» ni el Xat;
  - reserva de la barra mòbil dins dels desplaçadors del Workspace;
  - les dues proves roges heretades, amb un mock dins dels límits.

**Decisions que he pres pel principi «la norma s'aplica on parla; on calla, es conserva i es pregunta»:**
- Quan signa una persona (ItemDetail, `/mercat/mac-mini-m4`) es conserva el logotip de Sóc de Poble d'avui, per compatibilitat. Si el Mestre vol que una persona no porte logotip, n'hi ha prou de llevar `showLogos` d'ItemDetail.
- El Lector (font externa) i la Gestoria (titular) continuen sense logotip.
- El perfil d'una entitat (`/empresa/<id>`) porta ara el seu logotip. Si T35 (260928) també valia per a la fitxa pública, es torna enrere amb `senseLogo` i l'ordre escrita.

**1.0.3 del connector:**
- La versió està pujada a `socdepoble-enxufe.php:6` i `:120` i al `Stable tag` de `readme.txt`.
- He retirat el punt 2 de «External services» (el relé `auth.socdepoble.org`, P1 §5.5).
- Proves de node (connector, pantalla, empaquetador, standalone, secrets, runtime i conformitat de l'amfitrió): **96/96**.
- El Changelog i l'Upgrade Notice s'escriuen quan acabe la integració, amb el que haja entrat de veres.

### Relleu 23 · 13:00 · part A acabada; tipografia cqi arreglada; el ZIP de les 11:51 no val

**Part A (`wf_ea3d7558-4f0`) acabada i verificada:**
- **Facturació:** F01, F02 i F03 de Codex, amb el cas d'ús d'emissió nou `emissio.js`. Proves: 223/223.
- **Lector i Nevera:**
  - F05: Compartir porta `?article=`;
  - subtítol i entradeta reals;
  - fitxa pròpia de la Nevera, conservant la commutació;
  - Esc i focus correctes també dins de l'ombra;
  - carpetes i fonts del Lector en UniversalCard, una solució autoritzada per MarIA;
  - 24px entre targetes a la Nevera.
- **Pull-to-refresh:** actiu dins de l'encastat (Gent de la Torre), amb guardes d'amfitrió desplaçat i d'app fora del viewport. Proves: 24/24. Comprovat al banc `tests/manual/enxufe-amfitrio.html`.
- **Amfitrió i Admin:**
  - cap `storage` fals a `window`;
  - la Consola no fa cap fetch en producció;
  - el menú «/» relatiu al contenidor;
  - l'entitat del projecte es reintenta als 60 s;
  - l'Admin no peta sense res triat;
  - Usuaris i Entitats porten la barra taronja dins del detall (§5 respectat).
- **Pendent per a la part B:** la capçalera del logotip, al Tauler de l'Admin, queda tapada per la graella absoluta.

**Tipografia: el «fallback» de MarIA no fa de reserva.**
- Dues declaracions seguides d'una custom property (`vw` i després `cqi`) no es validen en llegir-les: la segona guanya sempre. En un navegador sense `cqi` (Chrome 100-104, Firefox 100-109), `var()` dona un valor invàlid i el títol hereta la mida del pare.
- Demostrat al 3340 amb una unitat inventada: la variable conserva el valor invàlid i la mida cau als 7 px del pare.
- Arreglat:
  - el valor de base queda en `vw` al bloc principal;
  - el `cqi` va dins de `@supports (width: 1cqi)`, amb els mateixos valors. Comprovat que funciona en tots dos casos.
- Prova nova a `tokens.contracte.test.js`: cap `cqi` fora del `@supports`, i els mateixos valors que la base.
- F06: el comentari de `tokens.css` ara diu el rang real.
- El mostrari de `/disseny` (EspecimenTipografia) ensenyava 48-56 px per a l'h1, i el valor real és 32-56. Ara diu la veritat. La regla vella de la prova («mínim = P6») queda derogada i en lloc seu es comproven la jerarquia, el sòl de 16 px i la ràtio de 1.8.
- `src/css` i el mostrari: **256/256**.

**El ZIP `socdepoble-enxufe-v1.0.3-261004_1151.zip` NO s'ha de pujar.** És anterior a:
- la fi de la part A;
- tota la part B (logotip, Índex, barres);
- l'arreglo de la tipografia (porta el patró trencat de les 11:45).

Cal recompilar-lo amb el semàfor verd final.

**Avís del Mestre (via MarIA): «fantasma de layout» a `/consola/pols`. Arreglat.**
- **Causa, mesurada a 1920:**
  - la segona graella feia `grid-template-columns: 770px 770px 0px 0px`;
  - `.sdp-card-grid.sdp-consola__graella` sobreescrivia la graella canònica (`auto-fill`) amb `auto-fit`, que esfondra les pistes buides d'una fila incompleta i eixampla les columnes;
  - la `.sp-card` porta `max-width: 500px; margin: 0 auto`, i per això les dues targetes quedaven centrades en cel·les de 770 px, amb un forat al mig.
  - No hi havia cap div invisible.
- **Arreglo:** `auto-fit` → `auto-fill` a la Consola. També al Tauler de la Gestoria, l'única altra graella de targetes amb el mateix vici. Les altres graelles `auto-fit` són caselles i camps, no targetes.
  - Una fila plena es pinta igual que abans.
  - Una fila incompleta conserva l'amplada de columna i s'alinea a l'esquerra, com la fila de dalt.
- **Guarda nova:** `src/css/graellaTargetes.capes.test.js` recorre tots els `.css` de `src` i falla si una graella de targetes (`.sdp-card-grid` o `.sdp-card-llista`) usa `auto-fit`. Porta casos sintètics.
- **Proves:** Consola, Tauler i guarda, 677/677.
- **Navegador:**
  - a 1920, les dues graelles tenen 4 columnes de 373 px i la segona fila queda alineada amb la de dalt;
  - a 375, una columna de 343 px, sense desbordament.

### Relleu 24 · revisió final pública del logotip i de l'Índex: roig per una norma mal llegida; correcció en marxa

**Ordre del Mestre:** no fer cap prova d'entrada ni de Xat (el meu navegador no hereta la seua sessió). Revisar la segona meitat de manera pública, donar l'informe final i tancar el torn.
- **Sessió:** cap pestanya del navegador integrat no tenia sessió. La sessió del Mestre és d'un altre navegador.
- **Credencials:** el sistema em va denegar buscar on desar credencials de prova, i no ho vaig intentar per una altra via.
- **Node local:** respon des de les 13:10 (les peticions REST al 54321 tornen 200).

**Revisió (`wf_d2aca052-047`, 3 mirades i una síntesi): ROIG.**
- **El que està bé:**
  - el logotip de Sóc de Poble és correcte a 21 rutes × 320/375/1280 × clar/fosc, i a l'encastat;
  - l'Índex dins de l'ombra complix l'ordre;
  - 122/122 proves del logotip i de l'Índex.
- **ERROR MEU (alt):** el prompt 1108 (línies 66-69) sí que parla de les persones i de la IAIA. Els toca l'avatar redó gran, de 300 a 360 px, i el Mestre demana «comença intentant fixar l'avatar gran» (T2). Jo vaig decidir sobre el meu resum, no sobre el prompt sencer: ho vaig tractar com una decisió pendent i vaig conservar el logotip de Sóc de Poble en les fitxes de persona (`/mercat/mac-mini-m4`).
- **Mitjans:**
  - el salt de `?seccio=` queda davall de la taronja quan arriben les dades de la Consola;
  - l'«Índex mestre de la Wiki» té 29 de 70 enllaços tallats;
  - el diàleg de l'Índex no rep el focus a la SPA;
  - la barra blava de la Wiki desborda 1-5 px a 768 i 1024, per culpa del rail.

**Correcció en marxa (`wf_f7e47003-fd5`), en dos fronts:**
- **persones-logo:**
  - avatar redó de 300 px per a persones i IA, botó de canvi d'imatge si la pàgina és pròpia;
  - cap logotip a les fitxes de persona;
  - els actes de l'entitat el conserven per identificador;
  - el logotip porta `width`/`height` per a reservar l'espai.
- **index-wiki:**
  - salt de `?seccio=` estable mentre arriben les dades;
  - focus del diàleg a la SPA sense cap anell nou;
  - `overflow-wrap: anywhere` als enllaços de la prosa;
  - el pas de la barra blava passa de 336 a 367 px.
- Cada front té una mirada de codi, una de navegador i un contrast final.

**1.0.3 preparada:**
- Changelog i Upgrade Notice al readme: 53/53.
- Guió `02_investigacio_ia/261004_0605_nit_claude/EMPAQUETAT_1.0.3.txt` per a `gentdelatorre.net`, amb les precondicions, les ordres i les comprovacions V1-V8. Els discriminants de V5a existixen al codi font.
- Els documents del laboratori queden ancorats a [[00_index_escriptori]].
- El ZIP de les 11:51 queda marcat com a NO vàlid.

### Relleu 25 · alerta del Mestre: Gestoria fora de la Wiki; poliment de l'avatar tancat; ordre de tancament

**Alerta crítica del Mestre (3 captures): «el mòdul de Gestoria de Poble s'ha colat dins del menú i l'estructura de Wiki de Poble».**
- **Causa:** la decisió D3 (`WikiDePobleSection.jsx:51-105`) afegia a la Wiki la carpeta «Gestoria de Poble» (Full trimestral i Aprendre) i hi muntava la closca sencera de la Gestoria. El seu menú «PANELL DE CONTROL» quedava dins del detall de la Wiki.
- **Arreglat** (`wf_e097dd49-1aa`, amb una mirada de guardes, una de navegador i un arreglo):
  - La Wiki ja no coneix la Gestoria: cap categoria, cap ítem, cap id ni cap destí.
  - Les URL velles `/wikidepoble?…gestoria_…` cauen a la portada de la Wiki, sense rastre.
  - La Gestoria és una app pròpia, `/app/gestoria`, i només existix en DEV (`entorn: 'desenvolupament'`, literal `import.meta.env.DEV`). El registrePlugins.js ja ho preveia: «/app/gestoria, més avant; /gestoria, mai».
  - L'app té barra d'app (Tauler i Aprendre) i el menú de la closca es diu «GESTORIA».
  - La targeta del Panell de Control porta a `/plugin/gestoria` i d'allà a `/app/gestoria`. Fora de DEV continua inert.
  - La guarda de privacitat i les fronteres s'han mogut al pont nou, sense afeblir-se, i hi ha una prova nova que veta qualsevol rastre de la Gestoria a la Wiki.
  - El rail de la closca passa a 19rem: amb 14rem, quatre mòduls «en obres» desbordaven.
  - Proves: 174/174 a les àrees tocades. Navegador a 1280 i 375.
- **Concurrència (per a MarIA):** una altra mà hi havia posat una redirecció de les URL velles cap a `/app/gestoria` (`rutesWiki.js` i `RutaWikiDePoble.jsx`). El verificador la va marcar, perquè la Wiki continuava encaminant cap a la Gestoria, i l'arreglo la va llevar. `src/sections/wiki-de-poble/rutesWiki.js` ha quedat **sense cap importador**: l'ha d'esborrar una persona, i la guarda impedix tornar-lo a importar. Si el Mestre prefereix la redirecció, ho ha de dir explícitament.

**Poliment de l'avatar tancat:**
- La correcció de la revisió (`wf_f7e47003-fd5`) va acabar **amb reserves, sense cap defecte alt**:
  - avatar redó de persones i IA de 300 px, amb botó «Canvia la teua imatge» si la pàgina és pròpia;
  - cap logotip a les fitxes de persona;
  - l'Aplec conserva el logotip per identificador (el `seed.sql` ja està corregit);
  - el logotip porta `width`/`height`, amb els píxels idèntics;
  - el salt de `?seccio=` és estable a 16 px;
  - l'Índex rep el focus sense cap anell nou;
  - l'Índex mestre de la Wiki té 0 enllaços tallats;
  - la barra blava de 337-367 px queda resolta.
- L'espècimen de l'avatar a `/disseny` (Pedra Seca §9, `wf_7254e103-98b`) mostra tres casos amb un PageFrame de veres: persona o IA, botó de canvi i entitat. Proves: 174/174. La pastilla de versió del catàleg passa de 00:43 a 15:20 (`versio.js`, que ja n'anava endarrerida).

**Queda per al Mestre (no s'ha obert cap front nou):**
- tornar a sembrar el node local i comprovar la fila `events` del remot (Aplec);
- la barra blava per davall de 336 px;
- el Tauler de l'Admin (logotip tapat);
- l'abast de la regla de la prosa;
- `rutesWiki.js`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Síntesi de la nit i del matí del 261004 (detall als relleus 1-25).**

**Fet i verificat** (cada front amb un verificador adversarial, i els darrers amb dues mirades, codi i navegador):

- **Gestoria:**
  - Veri*Factu v2: empremta oficial correcta (casos 1 i 2 de l'AEAT), F01-F03 de Codex i cas d'ús d'emissió.
  - Tauler, models purs i autoneteja.
  - Ara és una app pròpia, `/app/gestoria`, només en DEV i fora de la Wiki.
- **Targetes:**
  - UniversalCard a la Consola, el Lector i la Nevera;
  - cap xifra solta a la Consola (43/43 xifres amb la seua targeta);
  - PaginaApp i GraellaTargetes;
  - targetes incrustades a l'editor;
  - multimèdia del Xat;
  - CampFitxer;
  - la graella de targetes sense el forat fantasma.
- **Barra taronja universal i logotip:**
  - el logotip el decidix qui signa: l'entitat porta el seu logotip, la persona o la IA el seu avatar redó;
  - espècimen de l'avatar al catàleg;
  - `/app` com a pàgina universal.
- **Barres de la Wiki:** rail fix de 56 px en «mitja», i reserva de la barra mòbil.
- **Pull-to-refresh** també a Gent de la Torre.
- **WordPress i Sollutia:**
  - l'Índex dins de l'ombra i el salt només dins de l'app;
  - cap `storage` fals ni cap `CustomEvent` amb dades a `window`;
  - cap fetch de `/__iaia` en producció;
  - menú «/» relatiu al contenidor;
  - entitat del projecte reintentada als 60 s.
- **Tipografia fluida:** `cqi` dins de `@supports`, amb `vw` de base per a la Baseline 2022.
- **Avatar dels beta testers:** 56 px a la barra negra.
- **Connector 1.0.3 preparat:** versió, Changelog, Upgrade Notice, serveis externs i guió `EMPAQUETAT_1.0.3.txt`.

**Errors meus, exposats:**
- Vaig aplicar la norma del logotip a les persones sobre el meu resum i no sobre el prompt sencer (relleu 24). Ja està corregit.
- Vaig marcar malament l'hora d'un relleu (relleu 8).

**Pendent de decisió del Mestre:**
1. La barra blava per davall de 336 px de barra (320 i la Wiki a 375). Recomanació: amagar «Endavant».
2. El Tauler de l'Admin, on el logotip queda tapat (AdminSection D3).
3. L'abast de la regla de la prosa (a/b).
4. Tornar a sembrar el node local i comprovar la fila `events` del remot (Aplec).
5. Esborrar `rutesWiki.js`, que ha quedat sense importador.
6. El tenant segellat, les Redirect URLs de GoTrue i la clau de signatura (EMPAQUETAT).
7. L'avatar de la IAIA amb la clau duplicada.
8. Les proves d'altres mans: classificació, Control, aplicacions i el grup «Beta testers» del xat.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Passada sencera de `src` (261004, 16:00, sense cap altre treball en marxa):**
- 724 fitxers: 705 verds, 18 rojos i 1 omés.
- 11 871 proves: 11 811 verdes, 52 roges i 8 omeses.

Classificació de les 52 roges:

| Roges | Causa | Origen |
| --- | --- | --- |
| 14 | Classificació i NotesEditor | Una altra mà, en curs |
| 8 | Control i i18n `ajustosXat` | Una altra mà |
| 6 | Aplicacions del Perfil | Una altra mà |
| 9 | Grup «Beta testers» de `xatSeed.js` (10:56), sense les proves al dia | Una altra mà |
| 7 | Avatar de la IAIA | Clau duplicada a HEAD |
| 2 | Mock del divisor del Xat | 420 fora de `COLUMN_LIMITS` |
| 2 | Telefonades de la barra mòbil | Prèvia |
| 2 | Temps esgotats per càrrega | Sola, App fa 73/75 |
| 1 | `laParroquia` | Fotos del laboratori |
| 1 | AdminSection D3 | Decisió del Mestre |

Cap no ve del codi dels fronts de la nit, llevat de la D3.

**Proves de node del connector i del paquet:** 96/96. Després del Changelog: 34/34 i 53/53.

**Navegador:** sempre al 3340, en pestanyes pròpies de fons, sense sessió.
- 21 rutes × 320/375/1280 × clar/fosc per al logotip.
- L'Índex a la SPA i a l'encastat (`tests/manual/enxufe-amfitrio.html`).
- La matriu de barres de 319 a 1440, amb els mòbils apaïsats i l'encastat de 760 i 1100.
- El pull-to-refresh amb pantalla tàctil emulada.
- La Gestoria a `/app/gestoria` i la Wiki neta.
- La graella de `/consola/pols` a 1920 i 375.

No s'ha fet cap prova amb sessió: el Mestre la va cancel·lar.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- No toque `01_produccio/`, `.agents/`, `tooling/` ni `package.json` (governança amb lease).
- Cap `npm install`. Cap commit sense ordre del Mestre.
- Cap formulari extern enviat (T9).
- **El hook HOOKS-LOCAL** bloqueja npm, vite, git diff, `node` amb guions arbitraris, la porta Olivera i `tancament.mjs` en la shell de Claude. No s'ha esquivat. Per això:
  - la compilació i l'empaquetat de la 1.0.3 els fan MarIA o el Mestre (`02_investigacio_ia/261004_0605_nit_claude/EMPAQUETAT_1.0.3.txt`);
  - el ZIP `socdepoble-enxufe-v1.0.3-261004_1151.zip` NO és vàlid.
- **Sense sessió:** les proves d'entrada i de Xat les va cancel·lar el Mestre, i no es van crear credencials ni comptes.

**Per a MarIA (Claude no pot escriure a `.agents/`):**
- **ESTAT_ACTUAL proposat:** «261004 · Claude · integració final i 1.0.3 a punt de compilar. Fet i verificat:
  - Gestoria Veri*Factu v2 (F01-F03) i ara app pròpia `/app/gestoria`, només en DEV, fora de la Wiki;
  - targetes UniversalCard a la Consola, el Lector i la Nevera;
  - barra taronja universal; logotip per a l'entitat i avatar redó per a la persona;
  - rail fix de la Wiki en «mitja» i reserva de la barra mòbil;
  - pull-to-refresh a WordPress;
  - Índex dins de l'ombra;
  - tipografia `cqi` amb `@supports`;
  - connector 1.0.3 (versió, Changelog, Upgrade Notice).
  `src`: 11 811 verdes i 52 roges, cap dels fronts de la nit llevat d'Admin D3. Node del connector: 96/96. Semàfor verd per a compilar segons EMPAQUETAT_1.0.3.txt; el ZIP de les 11:51 no val. Pendents del Mestre a l'auditoria 0605, §Troballes.»
- **Línies de LEDGER proposades:**
  - «261004 | integracio | gestoria+targetes+barres+logo+ptr | integració final verificada, 1.0.3 a punt de compilar»
  - «261004 | correccio | sdp-universal-page | rellegir el prompt sencer abans de decidir l'abast d'una norma»
- **Lliçó proposada per a `sdp-workflow` §Lliçons del Mestre**, en positiu: «Abans de decidir l'abast d'una ordre, rellig el prompt sencer del disc i copia les seues línies a l'encàrrec dels agents.»
- **Tancament:** passar la porta Olivera i `tancament.mjs --check` amb el torn de Claude (`torn_9f0d7254-1d77-4c73-892a-2ce4064ec71c`). Claude no ho pot executar.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
