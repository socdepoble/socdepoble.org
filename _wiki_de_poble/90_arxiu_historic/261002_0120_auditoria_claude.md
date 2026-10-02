---
type: informe
status: esborrany
description: Implementació i auditoria del nucli de Gestoria només local, la porta d'aprovació de tractors a la Wiki, el Quiz de repàs i les correccions SEO.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9c46bf54-2e92-43bc-9a7d-a06e92419382:711543ae-94d9-4c39-8264-3cac9d00c895
---
# Auditoria Claude: Gestoria local, aprovació de tractors i SEO

Versió final (1.4.0) del torn de Claude de la nit de l'1 al 2 d'octubre de 2026, dins del bucle adversarial a tres bandes (Claude, Codex, MarIA). Queda llesta per al vistiplau del Mestre:

- **Gestoria:** la Gestoria només local, amb el full exacte de la gestoria.
- **Porta d'aprovació de tractors:** a la Wiki, amb signatura WebAuthn.
- **Altres peces:** el correu de lliurament, les fonts de calendari Google, el Quiz de repàs i les correccions SEO bloquejants.

Tot això està integrat, revisat de manera adversarial (13 troballes confirmades i corregides) i verificat amb 3.012 proves en verd. **No s'ha processat cap factura real: és el Mestre qui ha de signar els tractors primer.**

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9c46bf54-2e92-43bc-9a7d-a06e92419382:711543ae-94d9-4c39-8264-3cac9d00c895 |
| Versió del document | 1.4.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T23:19:20.962Z |
| Modificació | 2026-10-02T03:30:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, Ultracode, orquestració amb workflows de subagents) |
| Tokens consumits | Sense telemetria exacta. Subagents: unes 11 M de tokens en 11 workflows i agents (cartografia, quatre fases d'implementació, dues recerques web, revisió adversarial i correccions), més el fil principal |
| Tall d'evidència | HEAD 623a2af55 més l'arbre de treball de les 05:25 (Europe/Madrid) |
| Abast | Gestoria només local, porta d'aprovació de tractors, Quiz, SEO S5/S6, T1 calendari, T4 correu, plugins (0150) i revisió de l'Arbre Genealògic (0205) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-01T23:19:20.962Z: esborrany creat; contingut i verificació pendents.

2026-10-01T23:03Z–23:48Z: torn obert i cartografia del repositori. Llegida l'auditoria 0102 de Codex. Fase 1 dels nuclis. Escrites a mà les fitxes i els manifests. Llegides les captures de `01_produccio/gestoria/` per ordre del prompt 0125. Versió 1.1.0.

2026-10-01T23:55Z–00:30Z: llegides la 0148, la 0155, la 0215 i el 0205. Dues recerques amb fonts primàries. Afegit el §5 al pla 0045. Fase 2a (Tractors, T4 i T1). Versió 1.2.0.

2026-10-02T00:30Z–01:10Z: fases 2b i 2c:
- plantilla exacta de l'XLSX;
- pipeline;
- descompressor pur;
- retenció d'IRPF;
- UI de la Gestoria i integració a la Wiki;
- proves de privacitat i de qualitat;
- nivell «signatura».

També s'han corregit les regressions 10–12 de Codex.

2026-10-02T01:10Z–02:20Z: verificació al navegador i revisió adversarial: 25 troballes, de les quals 13 confirmades. Versió 1.3.0.

2026-10-02T02:20Z–03:25Z: corregides les 13 troballes, cadascuna amb una prova que fallava abans. Tancats els punts 23, 30 i 31 de Codex. Verificació final: 132 fitxers i 3.012 proves de Vitest, 58 de 58 portes amb `node --test`, i el navegador sense cap error. Versió 1.4.0.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Què troba el Mestre demà i com ho prova

1. **Servidor i adreça.** Arranca `npm run dev`, o fes servir el servidor que ja corre, i obri **`http://localhost:3340/wikidepoble`**. Ha de ser `localhost` i no la IP: la signatura i `crypto.subtle` només funcionen en un context segur.
2. **Les tres eines.** A l'arbre de la Wiki, darrere de «Consola Termodinàmica», hi ha dues categories noves:
   - **Tractors**, amb «Aprovació de tractors»;
   - **Gestoria de Poble**, amb «Full trimestral» i «Aprendre».

   Només apareixen en desenvolupament: el build de producció i el paquet de WordPress no en porten res.
3. **Aprovar el tractor de factures.** A Tractors, tria «Gestoria · Full trimestral de factures» (empremta d'esta versió: `F7F7-5444`).
   - Llig la fitxa sencera.
   - Marca «He llegit la fitxa sencera».
   - Prem «Signa amb Touch ID o clau de pas»: la primera vegada registra la clau i després signa.

   Si vols creuar el correu, fes el mateix amb «Creuament amb el correu» (`53B1-ACEF`).
4. **El full trimestral**, a Gestoria → Full trimestral:
   - El pas 1 ha de dir «Aprovat».
   - Al pas 2 tria 3T 2026 (és el valor per defecte), prem «Tria la carpeta de factures» i selecciona `_gestoria_de_poble/02_Facturacio`.
5. **Revisió.** Al pas 3 revisa les incidències: fora del trimestre, mensuals o bimestrals que falten, rebuts sense factura, duplicats, IVA, NIF, moneda estrangera, retencions. Corregix les cel·les que calga.
   - Les factures en USD han de passar a euros amb l'import del càrrec bancari, i després prems «Els imports ja són en euros».
   - Opcionalment, creua amb un `.mbox` del correu.
6. **Generar.** Al pas 4 marca «He revisat la proposta», genera, i descarrega o desa l'XLSX i el CSV. **Obri l'XLSX en Excel o Numbers abans d'enviar-lo.**
7. **Enviar.** El pas 5 prepara el correu: redacció de Gmail amb l'adjunt descarregat al costat, `.eml` o el menú de compartir. L'enviament el fas tu.
8. **Desenxufa.** «Desenxufa» ho oblida tot. Revocar a Tractors bloqueja l'eina a l'instant.

### 2. Estructura completa creada (T5)

**Porta d'aprovació de tractors, `src/sections/tractors/`** (genèrica, per a qualsevol tractor futur)
- `nucli/`: JS pur i isomòrfic.
  - `canonic.js`: JSON canònic i SHA-256.
  - `empremta.js`: empremta de manifest + fitxa + fonts.
  - `registre.js`: esquemes `sdp.tractor.v1` i `sdp.aprovacio.v1`, i `avaluaEstat`.
  - `webauthn.js`: CBOR, COSE→JWK i verificació d'asserció (repte, origen, rpIdHash, UP/UV, DER→r‖s).
  - `magatzem.js`: IndexedDB, que passa a memòria si falla.
  - `aprovacio.js`: `exigeixAprovacio`, que és fail-closed.
- `registreTractors.js`: catàleg amb glob `?raw` de `{js,jsx,md}`.
- `useTractors.js` i `contextAprovacio`.
- `PanellTractors.jsx` i `DialegAprovacio.jsx`.
- `clausura.test.js`: cada fitxer de la clausura d'imports és dins de l'empremta.

**Gestoria, `src/sections/gestoria/`**
- `tractors.js`: manifests `gestoria.factures` i `gestoria.correus`, amb nivell mínim «signatura», caducitat de 90 dies i fonts que cobrixen nucli, UI i porta.
- `fitxes/gestoria_factures.md` i `fitxes/gestoria_correus.md`: el flux explicat, que és el que signa el Mestre.
- `nucli/`:
  - `diners.js`, `dates.js`, `nif.js` (DNI, NIE, CIF i IVA-UE) i `csv.js`;
  - `model.js`: factura, validació, retenció i moneda;
  - `cataleg.js`, `proveidors.js` (cadències mensual i bimestral) i `classifica.js`;
  - `inflate.js`: DecompressionStream o motor pur;
  - `pdfText.js`: lector propi amb pressupost per PDF;
  - `receptes.js`: columnes, moneda, milers amb espai i IRPF;
  - `correus.js`: només capçaleres;
  - `auditoria.js`;
  - `plantilla.js` (`PLANTILLA_GESTORIA` exacta i `PLANTILLA_VERDA_ANTIGA`), `fullModel.js`, `xlsx.js` (cadenes compartides) i `zip.js`;
  - `tractor.js`: pipeline amb la porta abans de qualsevol lectura;
  - `entregables.js`: SHA-256 dels bytes.
- `font/fontNavegador.js`: selector natiu o `webkitdirectory`. Escriu només `.csv` i `.xlsx`, mai sobreescriu sense confirmació i no admet `..`.
- `enviament/`: `correuGestoria.js` (Gmail, `.eml` RFC 5322/2047/2231), `revisioAdjunts.js` i `EnviamentGestoria.jsx`.
- `aprendre/`: `leitner.js`, `baralla.js` (17 targetes), `magatzemProgres.js` i `Aprendre.jsx`.
- UI: `useGestoria.js`, `PanellGestoria.jsx`, `VistaPreviaFull.jsx` i `ContenidorGestoria.jsx`.
- Proves transversals: `privacitat.test.js`, `qualitat.test.js` (ESLint per API) i `qualitatPanell.test.js`.

**Calendari (T1)**
- `src/sections/calendari/fonts/`: contracte de font, adaptador Google Calendar v3 de lectura, configuració, sessió en memòria, `useFontsCalendari` i `PanellFontsCalendari`.
- `public/auth/calendari-google.{html,js}`: pàgina de tornada pròpia sense scripts en línia.
- Integració a `CalendariSection.jsx` només amb client configurat. En una web incrustada, només si l'amfitrió declara la URL de retorn.

**Wiki, SEO i suport**
- `WikiDePobleSection.jsx`: les eines locals amb `import.meta.env.DEV`, amb proves de desenvolupament i de compilació de producció.
- `seoHead.js` / `useSEO.js`: la imatge social es tracta com un conjunt (S6), i `gestoria` i `tractors` són privades (S5 client).
- CSS: quatre blocs `(261002)` a `modules.css`, dins de `@layer components`.
- `tests/helpers/autenticadorSimulat.js` i `tests/lint_calendari_fonts.test.mjs`.

### 3. Arquitectura de seguretat i dades (resum)

- **Res al núvol.** Les factures les tria la persona amb el selector natiu i es processen en memòria: res a Supabase, a Sollutia ni a cap model remot. `privacitat.test.js` fa un cens estàtic de tota l'API de xarxa, l'emmagatzematge i els imports de backend, amb una llista blanca mínima per a `enviament/`. També s'ha desactivat el botó «Traduir» de la barra a les eines locals, que hauria enviat el contingut de les taules al servei de traducció.
- **HITL en tres nivells:**
  1. versió del tractor, amb signatura WebAuthn;
  2. proposta concreta, amb SHA-256 de les files: qualsevol edició l'anul·la;
  3. enviament, que fa sempre la persona, amb revisió lligada als bytes exactes de l'adjunt.
- **Empremta.** Cobrix el nucli, la UI que aplica les aprovacions i la mateixa porta. La prova de clausura garantix que cap fitxer importat queda fora.
- **Model d'amenaça declarat a les fitxes.**
  - Sí que protegix contra l'execució accidental, contra una versió no llegida i contra un agent que no controla el navegador.
  - No protegix contra un programa que ja controle el perfil, perquè podria registrar-hi una clau pròpia.
  - Per a l'execució per agents fora del navegador, cal una àncora de clau fixada fora de l'origen (lease).

### 4. Revisió adversarial: 13 troballes confirmades, totes corregides

| ID | Sev. | Correcció aplicada (amb prova que fallava abans) |
| --- | --- | --- |
| format-fiscal-01 | Alta | Taules «IVA BASE CUOTA»: s'assigna per columnes només si quadra el recompte. Un IVA per damunt de la base no rep confiança alta. Un IVA per damunt del 21 % és incidència alta i deixa la factura pendent |
| format-fiscal-02 | Mitjana | Moneda detectada per import i per text. `MONEDA_ESTRANGERA` alta (art. 79.Once LIVA), botó «Els imports ja són en euros» i propagació a la factura |
| seguretat-01 / governanca-02 | Mitjana | Empremta ampliada a la UI i a la porta, glob `{js,jsx,md}`, prova de clausura d'imports estàtics i dinàmics |
| governanca-01 | Mitjana | Suport de proves copiat a `tests/helpers/` i tots els imports repuntats. **Falta esborrar l'original (§8)** |
| format-fiscal-03 | Baixa | Mensual = 3 mesos seguits o contigus en dos trimestres; bimestral detectat; catàleg no sobreescrit amb 2 mostres; FALTA_MENSUAL alta només amb un trimestre sencer vist |
| format-fiscal-05 | Baixa | Milers amb espai («1 020,46») quan el document no agrupa amb punt |
| seguretat-03 | Baixa | La revocació mai porta una data anterior a l'aprovació que revoca |
| seguretat-05 | Baixa | Sense spread de bytes. Error aïllat per missatge (`MISSATGE_ILLEGIBLE`) |
| seguretat-06 | Baixa | Pressupost de 128 MiB per PDF; flux compartit descomprimit una sola vegada; `PDF_MASSA_GRAN` |
| governanca-06 | Baixa | El magatzem de tractors passa a memòria si `open()` falla, també de manera asíncrona |
| regressio-01 | Baixa | Missatge neutre quan no es coneixia la identitat |
| regressio-02 | Baixa | `nivellTitol={3}` al pas 5 |

També tancats:
- **Punt 23 de Codex:** avís visible quan falta la URL de retorn en una web incrustada; pantalla idèntica sense client.
- **Punts 30 i 31 de Codex:** textos sense garanties absolutes.
- **Matís de governanca-04:** les fitxes declaren la substitució consentida del full i la lectura del correu.

### 5. Troballes heretades (estat)

| ID | Estat |
| --- | --- |
| F1, format de l'XLSX | **Resolta**: plantilla exacta. Codex l'ha contrastada amb openpyxl i LibreOffice. Falta Excel o Numbers real |
| F2, CIF incorrecte en un lliurament antic | Detectable amb `NIF_INVALID` |
| F3, carpeta del 3T i termini del 20/10 | Ara la Gestoria hi pot treballar quan el Mestre signe |
| F4, `checkTurn` d'arbre sencer | Oberta (lease, `requires_human_decision`) |
| F5, `segell-auto` | Codex el va reconciliar a les 02:44; persistix quan canvien les skills |
| F6, D3 | Respectada: no hi ha ruta `/gestoria` |
| F7, `.env.local` en mode test | Documentat a `.env.example` |
| F8, deute de lint heretat | Oberta (`lint_calendari`, `lint_logica_usuari`, `src/app` amb 4 roges anteriors a esta nit) |
| F9, `rpId` lligat a `localhost` | Documentat a la fitxa |
| F10, «esquetxes» al Full de Ruta | Oberta (text de la Wiki) |

### 6. Plugins i Arbre Genealògic

- **Plugins (encàrrec de MarIA).** Les conclusions i les fonts són al §5 del pla 0045; el contrast de Codex, al §6. No se n'instal·la cap. Se n'adapten tres idees de manera nativa:
  - l'escala de mínim codi de Ponytail;
  - el Mapa `sdp.mapa.v1` ampliat a la manera de Graphify;
  - les seccions «Verificació» i «Senyals d'alarma» de les skills, d'Agent Skills.

  OmniRoute queda rebutjat per a este repositori.
- **Arbre Genealògic.** Codex en va escriure l'arquitectura (0205), i la meua revisió G1–G7 hi va aportar evidència legal i tècnica verificada:
  - reserva TDM de les esqueles;
  - FamilySearch sense accés als registres;
  - OAI-PMH de BIVALDI i Prensa Histórica, i l'API d'Europeana;
  - marc legal;
  - límits de Safari 16.

  Codex les va incorporar a la v1.1 amb matisos raonats. No hi ha cap document duplicat.

### 7. Missatge final a Codex

Tanque el meu carril. Pots atacar amb el teu lector independent les correccions noves:
- `receptes.js`: columnes, moneda i milers;
- `proveidors.js` i `auditoria.js`: cadències;
- `clausura.test.js`;
- l'avís del punt 23.

Si hi trobes res, escriu-ho al teu informe: queda viu per a la pròxima sessió.

Per al teu relleu: les empremtes vigents dels dos tractors són `F7F7-5444` i `53B1-ACEF`. Cap aprovació real s'ha fet. La fixture vella només espera el `git rm` del Mestre.

### 8. Accions per al Mestre i pendents de lease

**Del Mestre** (poques i concretes):
1. Signar els dos tractors (§1).
2. `git rm src/sections/tractors/__fixtures__/autenticadorSimulat.js`. Ja no l'importa cap fitxer; sense això, la porta Pedra Seca (LLEI_08) queda roja.
3. Obrir l'XLSX generat en Excel o Numbers, i preguntar a la gestoria si el programa espera «NIF - CIF» o «NIF». Canviar-ho és una línia de `plantilla.js`.
4. Revisar la baralla d'Aprendre amb la gestoria abans d'oferir-la a altres autònoms.

**Per lease:**
- l'àncora de clau del Mestre fora de l'origen, per a l'execució per agents;
- les propostes natives del §5 del pla 0045 a les skills i al Mapa;
- `inflate.js` amb `maxEixida` per crida, per a ajustar el pic de memòria al pressupost del PDF;
- emetre `sdp:auth-change` amb l'usuari en arrencar (millor solució per a regressio-01).

### 9. Relleu preparat per a ESTAT i LEDGER

Claude no pot escriure a `.agents/` sense lease. Este és el text exacte que MarIA o el Mestre poden registrar.

ESTAT (bloc nou damunt de tot):

```markdown
## ESTAT_ACTUAL · 2026-10-02T03:30:00Z · Claude (Opus 5.5) · Gestoria només local, porta d'aprovació de tractors i full exacte

- Torn torn_9c46bf54-2e92-43bc-9a7d-a06e92419382. Informe [[261002_0120_auditoria_claude]] v1.4.0; pla [[261002_0045_pla_implementacio_gestoria]].
- Fet: src/sections/tractors (porta d'aprovació amb signatura WebAuthn, empremta que cobrix nucli+UI+porta, prova de clausura) i src/sections/gestoria (pipeline local fail-closed, XLSX/CSV amb la plantilla exacta de la gestoria, revisió editable, moneda/IRPF/cadències, correu HITL, Aprendre). Calendari: fonts Google (T1) sense canvi visual si no hi ha client. SEO S5/S6 client. Integrat a la Wiki només en DEV.
- Revisió adversarial: 25 troballes, 13 confirmades i corregides amb proves. Verificació: 132 fitxers / 3012 proves vitest verdes, 58/58 portes node, navegador sense errors.
- Pendents del Mestre: signar els tractors (F7F7-5444, 53B1-ACEF) a localhost:3340; git rm src/sections/tractors/__fixtures__/autenticadorSimulat.js; obrir l'XLSX en Excel/Numbers; NIF - CIF vs NIF amb la gestoria. Cap factura real processada, cap correu enviat.
```

LEDGER (entrada nova al final, abans del hash):

```markdown
## 2026-10-02T03:30:00Z · Claude · Gestoria local, porta de tractors i full exacte

- Torn torn_9c46bf54-2e92-43bc-9a7d-a06e92419382; auditoria 261002_0120_auditoria_claude v1.4.0. Codi nou a src/sections/gestoria, src/sections/tractors, src/sections/calendari/fonts, public/auth/calendari-google.*, tests/helpers; canvis a WikiDePobleSection.jsx, CalendariSection.jsx, seoHead.js, useSEO.js, modules.css, .env.example.
- 13 troballes adversarials corregides; 3012/3012 vitest i 58/58 node. Cap aprovació real, cap dada personal al repositori, cap desplegament.
```

### 10. Retroalimentació sobre la plantilla `prompt_local`

1. **«Qualsevol altre document present a 04_escriptori/ s'ha de llegir sencer»** contradiu «NO lliges informació que no estiga a Activitat en curs». Proposta: «els documents d'Activitat en curs i els que nomene el prompt».
2. **Declarar al prompt les eines realment disponibles sota els hooks:** Bash sense pipes, sense build ni ESLint, i WebSearch/WebFetch bloquejats (cal el navegador integrat). Així s'evita planificar passos impossibles.
3. **Separar «aprovar el pla» d'«aprovar el tractor»:** el pla deia «Estat: aprovat» amb «Aprovació humana: pendent».
4. **Quan el Mestre afig encàrrecs a mitja nit** (com el 0125, els plugins o l'arbre), **indicar si són addicionals o substitutius,** i qui en té la propietat. Codex i Claude van escriure en paral·lel sobre l'arbre, i només el bucle ho va evitar a temps.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run src/sections/gestoria src/sections/tractors src/sections/wiki-de-poble src/sections/calendari src/sections/mur src/hooks src/sections/control src/sections/consola src/css src/components/PedraSeca` (05:15, execució pròpia) | **132 fitxers, 3012/3012 verdes** |
| `node --test tests/lint_calendari_fonts.test.mjs tests/design-contracts.test.mjs tests/pedra-debt.test.mjs tests/action-contrast.test.mjs tests/tractor-inline-styles.test.mjs tests/tractor-importacions.test.mjs tests/corpus-scope.test.mjs tests/public_exports.test.mjs` (05:16, execució pròpia) | **58/58** |
| ESLint per API amb la configuració del repo (`gestoria/qualitat.test.js`, `tractors/qualitat.test.js`, `enviament/qualitat.test.js`, `tests/lint_calendari_fonts.test.mjs`) | 0 missatges als fitxers nous |
| Compilació de la Wiki amb Vite en mode producció (`WikiDePobleSection.produccio.test.jsx`) | 0 `import()` de Gestoria i Tractors; 3 en desenvolupament |
| Navegador: pestanya de fons sobre el servidor que ja corria al 3340 (no se n'ha arrancat cap altre) | Tractors en «Pendent» amb empremtes `F7F7-5444` i `53B1-ACEF`; la Gestoria bloqueja el pas de la carpeta sense aprovació; Aprendre funciona; 0 errors de consola |
| Revisió adversarial (4 revisors i 4 refutadors) | 25 troballes, 13 confirmades i corregides, 12 refutades amb raonament |
| `document.mjs check` d'esta auditoria | Vàlid |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Cap factura real s'ha processat ni cap tractor s'ha aprovat.** És el disseny que va demanar el Mestre.
- **No s'ha provat res amb un autenticador real.** La signatura amb Touch ID real i la connexió real a Google queden per al Mestre. Les proves usen autenticadors simulats.
- **El build sencer, l'ESLint global i `tancament.mjs` no s'han pogut executar** perquè els hooks no ho permeten. Codex ha executat els builds web i WP en el seu carril.
- **Les portes globals no estan verdes per deute heretat** (SCC, `lint_logica_usuari`, `src/app`). No s'han relaxat.
- **El relleu d'ESTAT i del LEDGER queda preparat (§9) però sense registrar.** La fixture vella espera el `git rm` del Mestre.
- **No s'ha llegit res de `90_arxiu_historic/`.** De `01_produccio/` només s'han llegit les cinc captures de Gestoria que el prompt 0125 autoritzava. De `_gestoria_de_poble`, els fitxers citats a la versió 1.3.0, i cap dada se n'ha copiat al repositori.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261002_0045_pla_implementacio_gestoria]]
- [[261002_0045_prompt_claude]]
- [[261002_0102_auditoria_codex]]
- [[261002_0125_prompt_comu_bucle_adversarial]]
- [[261002_0148_auditoria_codex]]
- [[261002_0155_auditoria_maria]]
- [[261002_0205_pla_implementacio_arbre_genealogic]]
- [[261002_0215_auditoria_maria_arbre]]
- [[261002_0310_visio_arquitectonica_expansio]]
