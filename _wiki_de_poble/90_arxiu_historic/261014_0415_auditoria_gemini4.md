---
type: informe
status: esborrany
description: Auditoria i arquitectura mil·limètrica per a l'auto-descobriment de _gestoria_de_poble, conciliació bancària i duplicats visuals, ergonomia FacturaDirecta/Holded a /app/gestoria/full i replegament lateral AppGridShell
tags:
  - auditoria
visibility: private
reflex: sdp:torn_dfd3a753-a75b-4317-9332-814fce86cb2f:3f532a90-a7c6-450e-8132-0432c4c6081c
---
# AUDITORIA I PROPOSTA ARQUITECTÒNICA GEMINI 4: Auto-descobriment Gestoria, Conciliació FacturaDirecta/Holded i Blindatge AppGridShell

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dfd3a753-a75b-4317-9332-814fce86cb2f:3f532a90-a7c6-450e-8132-0432c4c6081c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T02:06:58.204Z |
| Modificació | 2026-10-14T02:10:00.000Z |
| Propietari | Gemini 4 Argon High |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon High (1M context) |
| Tokens consumits | ~62.000 tokens |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-14T02:06:58.204Z`: Esborrany creat i registrat via `tooling/wiki/document.mjs create` sota el torn `torn_dfd3a753-a75b-4317-9332-814fce86cb2f`.
- `2026-10-14T02:10:00.000Z`: Completada l'auditoria i especificació arquitectònica de les 4 tasques encomanades a `261014_0400_prompt_gemini4_arquitectura_gestoria_i_replegament.md`: (1) Auto-descobriment de carpetes a `_gestoria_de_poble/`, (2) Conciliacions i duplicats visuals Zero-Friction, (3) Ergonomia FacturaDirecta/Holded per a `/app/gestoria/full`, i (4) Blindatge del patró de replegament lateral `[|<]` (`sdp-app-grid-shell` i `ShellGestoria`). Incorporades totes les correccions de citació documental d'auditories prèvies (`C4-GEM-01`..`06` de Codex i `CR-01` de Claude).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Síntesi Executiva i Correcció d'Observacions Prèvies del Consell

Abans de desplegar les especificacions de les quatre tasques, deixem resoltes de forma taxativa les observacions que Codex (`261014_0235_auditoria_codex.md`, `C4-GEM-01`..`06`) i Claude (`261014_0320_auditoria_claude.md`, `CR-01`) van anotar sobre el document previ `261014_0148_auditoria_gemini4.md`:
1. **Persistència de `FileSystemDirectoryHandle` (`C4-GEM-01`):** El cofre xifrat de `src/sections/gestoria/facturacio/cofre.js:471` xifra un objecte serialitzat amb `JSON.stringify` dins de `xifra Sobret` (`src/sections/gestoria/facturacio/nucli/cripto.js:362`). Un `FileSystemDirectoryHandle` és un objecte natiu estructurat (clonable per *Structured Clone Algorithm* a IndexedDB, però no serialitzable a JSON). Per tant, **mai** s'ha d'intentar desar dins del JSON xifrat de `cofre.js`; s'ha de persistir en un *object store* dedicat d'IndexedDB (`sdp-gestoria-handles`) i compartir en memòria viva dins de `ShellGestoria.jsx`.
2. **Precisió de rutes i línies (`C4-GEM-02`..`06`, `CR-01`):** Totes les citacions d'este document han estat verificades contra el disc real en l'estat actual del repositori.

---

### TASCA 1 · Arquitectura d'Auto-descobriment de Carpetes (`_gestoria_de_poble/`)

#### 1.1. Diagnòstic de l'arbre real de `_gestoria_de_poble/` i dels motors actuals

L'exploració de l'arbre real a `/Users/javillinares/Documents/Antigravity/Som de Poble/_gestoria_de_poble/` mostra l'estructura canònica següent:
- `00_Tauler_Central/`: conté l'antic prototip estòtic (`tauler.js`, `csv_ingestor.js`, `dashboard_data.js`, `caixa-real.html`, `hisenda.html`). Actualment `src/sections/gestoria/escaner/nucli/escaner.js:23` l'ignora via `CARPETES_IGNORADES = new Set(['00_tauler_central', '04_eines_de_pedra_seca'])`.
- `01_Identitat_Legal/`: escriptures i certificats; `escaner.js:122` el classifica en el context `'identitat'` i l'ignora sense llegir-ne cap byte (`escaner.js:368`).
- `02_Facturacio/`:
  - Carpetes per any (`2021`, `2022`, `2023`, `2024`, `2025`, `2026`) i per trimestre (`2025_4T`, `2026_1T`, `2026_2T`, `2026_3T`, `2026_4T`).
  - `2026_Bancs/`: conté extractes reals en formats heterogenis:
    - `_26_3t_extracte_c43.txt` (67.650 bytes, Norma 43 amb extensió `.txt`).
    - `Documento.txt` (10.332 bytes).
    - `cajamar.csv` (33.007 bytes) i `cajamar_2026.csv` (20.033 bytes).
    - `_26_3t_moviments_comte_cuenta_excelFile_1790940247371.xls`, `excelFile_1768878634747.xls`, `excelFile_1782863396897.xls` (fitxers `.xls` binaris/HTML d'exportació bancària).
- `03_Burocracia/` (`Agencia_Tributaria`, `Herencia`, `Kit_Digital`, `OEPM_Marques`, `SUMA`) i `03_Projectes_Actius/` (`CEEC_Alegacions`, `Subvencions_2026`).
- `04_Quarantena_Llegat_Web/` i `90_Arxiu_Historic/Cajamar_Historic/` (amb extractes PDF `MOV2114396415-121025115057.pdf`, `MOV2114396415-200126041040.pdf`, `20240503012426500482.PDF`).

**Tres friccions arquitectòniques detectades al codi actual:**

1. **Aïllament d'estat entre mòduls (`ShellGestoria.jsx:367-370`, `useEscaner.js:63-64`, `useGestoria.js:303-361`):**
   - `ShellGestoria` munta `useTauler` (`src/sections/gestoria/tauler/useTauler.js:40`), però `PanellEscaner` (`src/sections/gestoria/escaner/PanellEscaner.jsx:325`) i `ContenidorGestoria` (`src/sections/gestoria/ContenidorGestoria.jsx:27`) tenen cadascun la seua pròpia memòria aïllada.
   - Quan l'usuari obri `_gestoria_de_poble` a `/app/gestoria/escaner` i prem «Enxufa al Tauler i obri'l» (`PanellEscaner.jsx:354-361`), només es passen els `File[]` dels extractes bancaris a `onEnxufaTauler` (`tauler.llig(fitxers)`), però **la `Font` de la carpeta (`fontDesDeHandle` o `fontDesDeFitxers`) es perd** en navegar a `/app/gestoria/full`, obligant el Mestre a tornar a seleccionar la carpeta manualment al Pas 2 de `PanellGestoria.jsx:1039-1052`.
2. **Bloqueig d'extractes CSV bancaris d'altres entitats (`escaner.js:241-245`, `escaner.js:378-380`, `tractorTauler.js:282-286`):**
   - `src/sections/gestoria/nucli/extracteCsv.js` ja és capaç de llegir CSV de CaixaBank, BBVA, Sabadell, Cajamar, Santander i targetes de crèdit (`llegeixExtracteCsv`).
   - Tanmateix, `escaner.js:241-245` comprova primer `llegeixMovimentsCsv(mostra)` (`src/sections/gestoria/nucli/movimentsBanc.js:80`, que exigeix les 4 columnes estrictes `dataOperacio`, `dataValor`, `concepte`, `import`) i, si falla però passa `llegeixExtracteCsv(mostra)`, el classifica com a `csv-altre` amb avís `CSV_ALTRE_FORMAT` i `seleccionable: false` (`escaner.js:378-380`) perquè `tractorTauler.js:283` només crida `llegeixMovimentsCsv`!
3. **Absència de generació automàtica de propostes de NIF/Proveïdor des d'apunts bancaris:**
   - Quan un moviment bancari queda en `movimentsSenseFactura` (`src/sections/gestoria/nucli/concilia.js:549`), el sistema no extrau ni proposa el NIF ni el proveïdor a partir del registre SEPA (`m.sepa?.cif`, `m.sepa?.creditor` de `c43.js:187-202`), del comerç de targeta (`m.comerc` de `movimentsBanc.js:53-60`) o del concepte bancari (`textDelsConceptes(m)` de `c43.js:423-426`).

#### 1.2. Disseny del Pont d'Auto-descobriment Local-First (`handleStore.js` + `ShellGestoria.jsx`)

Per aconseguir **Zero Friction** respectant el principi *Fail-Closed* dels tractors (`src/sections/tractors/nucli/aprovacio.js`):

1. **Magatzem dedicat d'IndexedDB per al `FileSystemDirectoryHandle` (`src/sections/gestoria/font/handleStore.js`):**
   - Emmagatzema únicament el `FileSystemDirectoryHandle` natiu (clonació estructurada directa a l'object store `'handles'`, clau `'arrel_gestoria'`), totalment separat del JSON xifrat de `cofre.js`.
   - Cicle de vida de permisos:
     - `desaHandleCarpeta(handle)`: guarda el handle quan l'usuari tria `_gestoria_de_poble` per primera vegada en qualsevol vista (`escaner` o `full`).
     - `recuperaHandleCarpeta()`: llig el handle d'IndexedDB; comprova `await handle.queryPermission({ mode: 'read' })`. Si és `'granted'`, crea automàticament la `Font` amb `fontDesDeHandle(handle)` sense obrir cap selector de fitxers. Si és `'prompt'`, mostra un únic botó de 1 clic «Reconecta `_gestoria_de_poble`» que executa `await handle.requestPermission({ mode: 'read' })` dins del gest de l'usuari.
     - `oblidaHandleCarpeta()`: esborra la clau d'IndexedDB quan l'usuari prem «Desenxufa» (`useGestoria.js:723`, `useTauler.js:71`, `useEscaner.js:138`).
2. **Font compartida a `ShellGestoria.jsx` (`src/sections/gestoria/tauler/ShellGestoria.jsx:367-425`):**
   - `ShellGestoria` manté l'estat `fontCompartida` (`{ font, handle }`) i el passa tant a `PanellEscaner` com a `ContenidorGestoria` (`PanellGestoria`).
   - Quan l'Escàner descobreix l'arbre de `_gestoria_de_poble`:
     - Els extractes bancaris (`n43` i `csv-tauler`) s'enxufen al Tauler (`tauler.llig(fitxers)`).
     - La mateixa `font` s'injecta automàticament a `useGestoria.usaFont(font)` (`useGestoria.js:324-340`), i es llança `analitza({ any, t })` per a l'últim trimestre amb dades (p. ex. `2026_3T`) tan bon punt `gestoria.factures` estiga aprovat.

#### 1.3. Model de Descobriment i Categorització Automàtica Multimotor

1. **Unificació d'Extractes Bancaris (`movimentsBanc.js`, `extracteCsv.js`, `tractorTauler.js`, `escaner.js`):**
   - A `src/sections/gestoria/nucli/movimentsBanc.js`, afegir `llegeixQualsevolCsvBanc(text)`:
     - Primer intenta `llegeixMovimentsCsv(text)` (format amb `dataOperacio` i `dataValor`).
     - Si retorna avís `'CAPCALERA'`, delega en `llegeixExtracteCsv(text)` (`src/sections/gestoria/nucli/extracteCsv.js`) i transforma cada moviment `{ fila, data, concepte, import, saldo }` al contracte `{ fila, dataOperacio: m.data, dataValor: m.data, concepte: m.concepte, centims: m.import, saldo: m.saldo, ...(comerc ? { comerc } : {}) }`.
   - Amb este canvi:
     - `tractorTauler.js:283` passa a cridar `llegeixQualsevolCsvBanc(decodificaText(bytes))` (mantenint intacta la funció `reduixCsv` per preservar la privacitat al Tauler!).
     - `escaner.js:244` i `378-380` promouen automàticament els CSV bancaris de Sabadell, CaixaBank, BBVA, Cajamar (`cajamar.csv`, `cajamar_2026.csv`), Santander i targetes a `format: 'csv-tauler'` i `seleccionable: true`!
   - Per als fitxers `.xls` de `2026_Bancs/` (`excelFile_*.xls`), `escaner.js:212` ja detecta `XLS_SENSE_CONVERSIO`; l'avís de la UI ha d'indicar quin fitxer `.csv` o `.txt` germà de la mateixa carpeta (`_26_3t_extracte_c43.txt` o `cajamar_2026.csv`) ja el cobreix perquè el Mestre sàpia que no perd cap dada.

2. **Categorització de Carpetes de Factures per Any/Trimestre (`emeses` i `rebudes`):**
   - `escaner.js:89-128` (`contextDeRuta`) i `tractor.js:280-295` (`carpetesDeTrimestre`) reconeixen qualsevol carpeta `AAAA_NT`, `AAAA-NT` o `NT_AAAA`, així com carpetes d'any (`2021`..`2026`).
   - Dins de cada trimestre (`2026_1T`, `2026_2T`, `2026_3T`), la classificació en `emeses` (`ingres`) i `rebudes` (`despesa`) opera en 3 nivells sense intervenció manual:
     1. **Per subcarpeta o nom de fitxer (`classifica.js`):** prefixos `Factura_AsocCine_F260001.pdf`, `Factura-2026-09-01-F260003.pdf` o sèrie apresa dels models anteriors (`serieEmesa(historial)` a `tractor.js:813`).
     2. **Per capçalera d'emissor propi (`emissorPropi` a `tractor.js:467-475`):** si abans de l'etiqueta `Cliente` / `Facturar a` / `Bill to` apareix el NIF o nom del titular (`nifsPropis`, `nomsPropis`), és `emesa` encara que al concepte s'esmente un proveïdor tecnològic.
     3. **Per empremta del catàleg i historial (`rebudaPelText` a `tractor.js:480-484`):** si `detectaProveidor` puntua `>= 50` amb motiu fort (`nif:`, `domini:` o `fitxer`) i l'emissor no és el titular, és `rebuda`.

3. **Motor de Propostes de NIF/Proveïdor basades en l'Apunt Bancari (`proposaProveidorDesDeMoviment`):**
   - A `src/sections/gestoria/nucli/proveidors.js`, afegir la funció pura:
     ```js
     /**
      * A partir d'un moviment bancari (C43 o CSV), proposa el proveïdor/client
      * i el seu NIF/CIF creuant SEPA (2301/2302), comerç de targeta i conceptes
      * amb el registre après (historial + CATALEG_PROVEIDORS).
      * @param {object} moviment
      * @param {object[]} registre resultat d'aprenProveidors
      * @returns {{ clau: string|null, nom: string, nif: string|null, confianca: 'alta'|'mitjana'|'baixa', origen: 'sepa'|'cataleg'|'comerc'|'concepte' }|null}
      */
     export function proposaProveidorDesDeMoviment(moviment, registre = [])
     ```
   - **Ordre de prioritat de la proposta:**
     1. **Domiciliació SEPA (`moviment.sepa` de `c43.js:187-202`):** conté `sepa.cif` (ja extret de l'identificador de creditor `ESddZZZ<NIF>`) i `sepa.creditor`. Si `identificaProveidor({ nif: sepa.cif, nom: sepa.creditor }, registre)` casa, torna `{ clau, nom, nif: sepa.cif, confianca: 'alta', origen: 'sepa' }`; si no és al catàleg però `sepa.cif` és un NIF vàlid (`validaNif`), torna proposta nova amb `confianca: 'alta'` i `origen: 'sepa'`.
     2. **Catàleg i Historial pel Comerç o Concepte (`moviment.comerc` o `textDelsConceptes(moviment)`):** crida `identificaProveidor({ nom: moviment.comerc || textConcepte }, registre)`. Així apunts com `ANTHROPIC`, `FAL.AI`, `GOOGLE CLOUD`, `SITEGROUND`, `DONDOMINIO`, `ENDESA` o `IBERDROLA` proposen immediatament el nom canònic i el NIF del catàleg (`src/sections/gestoria/nucli/cataleg.js:32-119`).
     3. **Heurística de comerç net (`moviment.comerc`):** si és una compra de targeta d'un comerç local no registrat al catàleg, proposa el nom netejat de `comercDelConcepte` amb `confianca: 'baixa'` i `origen: 'comerc'`.

---

### TASCA 2 · Conciliacions i Duplicats Visuals (Zero Friction)

#### 2.1. Diagnòstic de `concilia.js` i la Barrera de Privacitat de `tractorTauler.js`

1. L'algorisme actual de `src/sections/gestoria/nucli/concilia.js:353-552` és excel·lent i ja implementa 7 regles deterministes:
   - `R7` (línies 368–404): Anul·lació de càrrec (`conceptComu === '98'`) en `[0, +5]` dies pel mateix import canviat de signe.
   - `R1` (línies 422–436): Número de factura citat al camp `document`, `ref1`, `ref2` o `conceptes` del moviment amb import exacte (±1 cèntim) i finestra `[-5, +60]` dies (`confianca: 'alta'`).
   - `R4` (línies 439–457): Pagament agrupat (*subset sum* `combinacionsAmbSuma` de 2 a 4 factures del mateix proveïdor fins a 12 candidates en `[-5, +60]` dies).
   - `R2` (línies 460–473): Rebut SEPA (`conceptComu === '03'` o `m.sepa`) amb el mateix NIF de creditor (`m.sepa?.cif`) i import exacte en `[-5, +40]` dies (`confianca: 'alta'`).
   - `R5` (línies 476–521): Moneda estrangera (registre 24 `m.divisa` amb canvi oficial BCE ±5%, o comissió de canvi `conceptComu === '17'` del mateix dia).
   - `R3` (línies 525–536): Mateix import en euros dins de `[-3, +10]` dies (amb confiança `'mitjana'` si coincideix el proveïdor al concepte, o `'baixa'` si només casa per data i import).
   - `R6` (línies 540–547): Rebut en PDF a la carpeta que cita el número de la factura.
2. **Per què avui `R1`, `R2` i `R4` no funcionen al Tauler (`targetesTauler.js:360`):**
   - Com adverteix explícitament `targetesTauler.js:360` (*«El Tauler no guarda el text dels conceptes ni els rebuts SEPA: aparella per l'import, la data, el concepte comú i l'import en l'altra moneda, i no reconeix el número de factura ni el creditor d'un rebut»*), `tractorTauler.js:149-158` (`movimentReduit`) retalla `sepa`, `conceptes`, `document`, `ref1` i `ref2`, i `reduixCsv` (`tractorTauler.js:196-207`) retalla `concepte` i `comerc`.
   - **Solució sense trencar la privacitat d'URL ni d'encapçalaments:** Dins de `tractorTauler.js`, generar per a cada moviment un conjunt d'**empremtes opaques de conciliació** (`pistesConciliacio` o conservar en memòria efímera de sessió a `useTauler` la lectura interna només per a `concilia()`), de manera que:
     - Cap títol, cap subtítol i cap URL (`?seccio=`) no continga mai dades bancàries ni NIFs (complint estrictament la regla del Mestre de `targetesTauler.js:31-37`).
     - Però `concilia()` reba `sepa.cif`, `comerc` i tokens de número de factura per activar `R1`, `R2`, `R4` i `proposaProveidorDesDeMoviment`!

#### 2.2. Detecció Clara de Duplicats Visuals (3 Nivells)

Per evitar pagar o declarar dues vegades la mateixa despesa, el sistema ha de presentar les alertes de duplicats amb acció directa d'1 clic:
1. **Duplicat binari / documental (`DUPLICAT` d'`escaner.js:338-360` i `tractor.js:865-884`):**
   - Mateix `sha256` (`motiu: 'contingut'`) o mateix text/PDF-ID amb nom de còpia (`factura.pdf` i `factura copia.pdf` a `2026_3T`).
   - Ja s'exclou automàticament de la proposta i passa a `excloses` (`tractor.js:715-730`), mostrant al panell «Còpies que no s'han comptat» amb botó «Torna a la proposta» per si fora un document distint.
2. **Duplicat comptable (`DUPLICAT` d'`auditoria.js:245-266`):**
   - Dues files amb el mateix `clauDuplicat(f)` (`<NIF o nom normalitzat>|<num compacte>`, p. ex. quan hi ha tant el PDF com un altre fitxer amb el mateix número).
   - **Millora visual a `/app/gestoria/full`:** En lloc d'un avís genèric dalt de tot, pintar una insígnia roja `Duplicada amb «<fitxer>»` directament a la fila de la taula amb un botó d'1 clic **«Exclou la còpia»** (`exclouFactura(f.id)`).
3. **Possible doble cobrament o doble emissió (`POSSIBLE_DOBLE_COBRAMENT` d'`auditoria.js:450-471`):**
   - Mateix proveïdor, mateix dia i mateix import total amb números de factura diferents (molt freqüent en recàrregues automàtiques de `Anthropic` o `fal.ai` del mateix dia, com es veu a `2026_3T` amb `Invoice-EXEMPLE-0009.pdf` i `0010.pdf`, o `0011.pdf` i `0012.pdf`).
   - **Millora visual:** Enllaçar l'avís amb la conciliació bancària (`R3`/`R5`): si a l'extracte bancari hi ha **dos càrrecs** d'eixe import el mateix dia, l'avís es marca com a ` Pagaments confirmats al banc (2 càrrecs)`; si només hi ha **un càrrec**, l'alerta puja visualment per advertir de possible doble declaració o cobrament pendent.

#### 2.3. Especificació d'Enllaços Clicables Directes (`/app/gestoria/bancs` ↔ `/app/gestoria/full`)

1. **Estendre el retorn de `resumTauler.js:596-607` i `targetesTauler.js:334-364`:**
   - Actualment `resumTauler.js:601-606` només guarda els recomptes (`parelles: r.parelles.length`, etc.) i descarta els arrays `r.parelles`, `r.movimentsSenseFactura`, `r.facturesSensePagament` i `r.incidencies`.
   - S'ha de conservar dins de `conciliacio` l'objecte `detallConciliacio`:
     ```js
     detallConciliacio: {
       parelles: r.parelles.map((p) => ({
         regla: p.regla,
         confianca: p.confianca,
         dataMoviment: p.moviment.dataOperacio,
         centims: p.moviment.centims,
         factures: (p.factures ?? [p.factura]).filter(Boolean).map((f) => ({
           id: f.id,
           num: f.num,
           contrapart: f.contrapart,
           total: f.total,
           fitxer: f.origen?.fitxer ?? null,
           periode: trimestreDeData(f.data)
         }))
       })),
       facturesSensePagament: r.facturesSensePagament.map((f) => ({
         id: f.id,
         num: f.num,
         contrapart: f.contrapart,
         data: f.data,
         total: f.total,
         fitxer: f.origen?.fitxer ?? null,
         periode: trimestreDeData(f.data)
       })),
       movimentsSenseFactura: r.movimentsSenseFactura.map((m, idx) => ({
         id: `mov-${idx}`,
         dataOperacio: m.dataOperacio,
         centims: m.centims,
         propostaProveidor: proposaProveidorDesDeMoviment(m, registreProveidors)
       }))
     }
     ```
2. **Navegació d'1 clic des de `PaginaTargeta` (`Tauler.jsx:432-469`) i `/app/gestoria/bancs` cap a `/app/gestoria/full`:**
   - Quan `targeta.id === 'conciliacio'`, `PaginaTargeta` renderitza davall de «El detall de Conciliació» tres taules interactives (`Parelles conciliades`, `Factures pendents de conciliar al banc`, `Moviments bancaris sense factura`).
   - Cada factura aparellada o pendent és un enllaç/botó clicable:
     - Crida `onObreFacturaAlFull({ any, t, facturaId: f.id, fitxer: f.fitxer })` (passat per `ShellGestoria.jsx`).
     - Navega a `/app/gestoria/full?trimestre=${any}-${t}T&factura=${encodeURIComponent(f.id)}`.
   - A `PanellGestoria.jsx`:
     - Un `useEffect` observa el paràmetre `factura` (o la prop `facturaEnfocadaId` de `ShellGestoria`), localitza `<tr data-factura={facturaId}>`, executa `scrollIntoView({ behavior: 'smooth', block: 'center' })`, aplica la classe `.sdp-gestoria__fila--enfocada` i, si l'usuari ho demana, obri directament el visor lateral del PDF (`VistaPreviaFull.jsx`) amb el document original!
   - A l'inrevés, a `/app/gestoria/full`, cada fila de factura que tinga parella bancària en `concilia` mostra una píndola clicable `Conciliada (R1/R2/R3)` que porta en 1 clic a `/app/gestoria/tauler/conciliacio`.

---

### TASCA 3 · Ergonomia del Model FacturaDirecta & Holded per a `/app/gestoria/full`

#### 3.1. Anàlisi de Patrons Ergònics Líders (FacturaDirecta & Holded)

Els cinc pilars que fan que FacturaDirecta i Holded siguen referents d'ergonomia comptable i com es tradueixen al sistema de disseny **Pedra Seca**:

1. **Taula 100% d'amplada útil amb jerarquia tipogràfica tabular (`Zero Horizontal Clutter`):**
   - Res de caixes estretes amb doble scroll ni d'inputs que amaguen el text. La taula ocupa el 100% de l'espai central disponible (`width: 100%`), amb amplades proporcionals pensades per al contingut real: `Data` i `Núm.` compactes, `Proveïdor/Client` i `Concepte` elàstics, i columnes numèriques (`Base`, `% IVA`, `Quota IVA`, `% IRPF`, `Total`) alineades a la dreta amb `font-variant-numeric: tabular-nums`.
2. **Separació explícita de tipus impositius (`% IVA` i `% IRPF`) i Règim Fiscal:**
   - En lloc de mostrar només `Base` i `IVA` en euros (que obliga l'humà a dividir mentalment per saber si s'ha aplicat el 21%, el 10% o el 0% d'inversió del subjecte passiu), FacturaDirecta i Holded mostren una columna curta amb el `% IVA` (`21%`, `10%`, `4%`, `0% ISP`, `0% Ex.`) i un badge de règim fiscal (`Nacional`, `Intracomunitari ROI`, `Extracomunitari / Exportació`).
3. **Semàfor d'estat i conciliació per fila (1 sol cop d'ull):**
   - Cada fila té un estat inequívoc a la dreta: `Completa` (verd), `Pendent de revisió` (ambre, amb el camp dubtós subratllat) i l'estat de pagament/conciliació (`Conciliada` vs `Sense càrrec bancari`), més l'icona d'ull/document per previsualitzar el PDF al costat sense eixir de la taula (`Split View` amb `VistaPreviaFull.jsx`).
4. ** Capçalera de Síntesi Trimestral Viva (303 IVA + 130 IRPF):**
   - Dalt de les taules d'Ingressos i Despeses, un bloc horitzontal net de 3 caixes resumeix en temps real l'impacte del full que s'està editant:
     - **Ingressos (Vendes):** Base acumulada + IVA repercutit (`303 Meritat`) + Retencions suportades (`130`).
     - **Despeses (Compres):** Base deduïble + IVA suportat deduïble (`303 Deduïble`) + Operacions ISP/Extracomunitàries.
     - **Resultat Trimestral Estimat:** Quota 303 (a pagar o a compensar) i Quota 130 (20% sobre rendiment net anual menys retencions), connectat directament a `estimaIva303` i `estimaIrpf130` (`src/sections/gestoria/impostos/nucli/impostos.js`).
5. **Tractament sense fricció de Proveïdors Tecnològics Internacionals (UE i EUA):**
   - A Holded i FacturaDirecta, quan entra una factura d'`Anthropic Ireland` (`IE...`), `Google Cloud EMEA` (`IE...`), `SiteGround` o `fal.ai` (EUA, en USD o EUR sense IVA), el sistema reconeix l'operació com a **Intracomunitària (ISP)** o **Extracomunitària (No subjecta / Inversió)** i no bloqueja la fila exigint un NIF espanyol de 9 caràcters per a una corporació dels EUA (`fal.ai`).

#### 3.2. Especificació Tècnica Mil·limètrica per a `/app/gestoria/full` (Guia per a Claude Code)

Perquè Claude Code puga implementar la millora a `/app/gestoria/full` sense trencar cap test de `PanellGestoria.test.jsx`, `model.test.js`, `auditoria.test.js`, `impostos.test.js` ni `design_guard.mjs`:

1. **Règim Fiscal i Proveïdors Internacionals (`src/sections/gestoria/nucli/model.js`, `cataleg.js`, `impostos.js`):**
   - A `src/sections/gestoria/nucli/model.js`:
     - Conservar intactes `CAMPS_OBLIGATORIS` (`['data', 'num', 'contrapart', 'nif', 'subtotal', 'iva', 'total']`) perquè tots els tests unitaris existents de `validaFactura` i `estatFactura` continuen passant al 100%.
     - Afegir una funció derivada pura `regimFiscalDe(f, paisProveidor = null)`:
       - Si `paisDelNif(f.nif)` és un estat membre de la UE distint d'`ES` (`IE`, `DE`, `FR`, `NL`, `LU`, etc.) o el proveïdor del catàleg té `pais` UE: retorna `{ codi: 'intracomunitari', etiqueta: 'UE · ISP', tipusOperacio: 'isp-intracomunitari' }`.
       - Si el proveïdor del catàleg té `pais: 'US'` (com `fal.ai`) o moneda original estrangera amb `iva === 0`: retorna `{ codi: 'extracomunitari', etiqueta: 'Extracom.', tipusOperacio: 'extracomunitari' }`.
       - En la resta de casos amb NIF espanyol vàlid i `iva >= 0`: retorna `{ codi: 'nacional', etiqueta: 'Interior', tipusOperacio: 'interior-deduible' }`.
     - A `crearFactura(parcial)` (`model.js:137-166`), si `parcial.tipusOperacio` s'especifica o si la factura rebuda és `'completa'` amb NIF espanyol (`paisDelNif(f.nif) === 'ES'` o NIF nacional vàlid), assignar per defecte `tipusOperacio: 'interior-deduible'` perquè `estimaIva303` (`src/sections/gestoria/impostos/nucli/impostos.js:148-152`) pugui sumar automàticament l'IVA deduïble sense emetre `SENSE_TIPUS_OPERACIO` en factures nacionals completes (mentre preserva el comportament si `tipusOperacio` s'omet en proves sintètiques incompletes — **atenció Claude:** verifiqueu `src/sections/gestoria/impostos/nucli/impostos.test.js` abans de tocar el filtre de la línia 148 d'`impostos.js`; si el test d'`impostos.test.js` comprova que una factura sense `tipusOperacio` emet `SENSE_TIPUS_OPERACIO`, injecteu `tipusOperacio: 'interior-deduible'` només quan `PanellGestoria` / `ShellGestoria` passa les factures al Tauler a `onFactures`!).
2. **Columnes i Disseny de `TaulaFactures` a `src/sections/gestoria/PanellGestoria.jsx:119-310`:**
   - Ampliar la visualització de `TaulaFactures` mantenint els 8 `CAMPS_EDITABLES` i afegint dues cel·les informatives derivades (o selectors ràpids):
     - Columna **`% IVA`** (entre `Subtotal` i `IVA`): mostra el percentatge calculat `percentatgeIva(f.subtotal, f.iva)` (`21 %`, `10 %`, `4 %`, `0 %`) i la píndola del règim (`UE · ISP` si `paisDelNif(f.nif)` és `IE`/`EU`). En fer clic o seleccionar un tipus habitual (`0%`, `4%`, `10%`, `21%`), recalcula `iva = Math.round((f.subtotal * tipus) / 100)` i `total = f.subtotal + iva - retencio` cridant `onEdita`.
     - Columna **`Estat / Doc`**: mostra el badge d'estat (`Completa` / `Pendent`), el badge de conciliació si està aparellada, i el botó d'1 clic per obrir el PDF a `VistaPreviaFull.jsx` (`onVeureDocument(f)`).
3. **Full-Width Layout i Tokens CSS a `src/sections/gestoria/Gestoria.css`:**
   - A `.sdp-gestoria` (`Gestoria.css:15-23`): eliminar qualsevol restricció d'amplada estreta quan s'està al Pas 3 (`Proposta del full`), usant `width: 100%; max-width: none;`.
   - A `.sdp-gestoria__taula` (`Gestoria.css:212-238`):
     ```css
     .sdp-gestoria__taula {
       width: 100%;
       border-collapse: collapse;
       font-variant-numeric: tabular-nums;
     }
     .sdp-gestoria__fila--enfocada {
       outline: 2px solid var(--sdp-focus);
       outline-offset: -2px;
       background: var(--sdp-accent-vel);
     }
     ```
   - Respectar estrictament `design_guard.mjs`: usar **només** variables `--sdp-*` de `src/css/tokens.css` (cap color hex/rgb literal, cap `px` prohibit fora d'estructura).

---

### TASCA 4 · Blindatge del Patró de Replegament Lateral (`sdp-app-grid-shell` / `[|<]`)

#### 4.1. Auditoria Exhaustiva de Totes les Seccions i Closques del Sistema

Hem auditat totes les barres laterals i les 4 úniques portes que munten `<AppGridShell>` en producció (`policiaDisseny.js:31`), així com el menú propi de la Gestoria (`ShellGestoria.jsx`). A continuació es detalla l'estat exacte de cada secció:

| Component / Secció | Fitxer i Línies | Té botó `[|<]` (`PanelLeftClose`)? | Plega a rail d'icones (`56px`)? | Estat d'Auditoria |
| --- | --- | --- | --- | --- |
| **1. Barra lateral global SDP** | `src/app/App.jsx:190-196`<br>`src/css/layout.css:187, 968` | Sí (`.sidebar-rail-toggle` amb `<PanelLeftClose size={24} />` desplegada i `<Settings />` plegada) | Sí (`56px`, `.sidebar-closed`) | **CONFORME (100%)** |
| **2. Barra lateral d'Apps (`BarraApp`)** | `src/apps/plataforma/BarraApp.jsx:50-58` | Sí (`.sidebar-rail-toggle` amb `<PanelLeftClose size={24} />` desplegada i `<IconaApp />` plegada) | Sí (`56px`, `.sidebar-closed`) | **CONFORME (100%)** |
| **3. `UniversalWorkspace` (Wiki, Notes, Disseny, Perfil)** | `src/components/universal/workspace/UniversalWorkspace.jsx:516-552, 837-905, 1229-1332` | Sí (`AppGridColumn` amb `onReplega`, `PanelLeftClose` i `PanelRightOpen` al rail) | Sí (`--app-grid-col-collapsed: 56px`, `CategoryRail` i `DocumentRail`, més `railEsquerra` i `railMitja`) | **CONFORME (100%)** |
| **4. `ClosCaXat` (Xat i Control del Xat)** | `src/sections/xat/components/ClosCaXat.jsx:214-240, 373-455` | Sí (`AppGridColumn` amb `replegaTotaCapcalera` i `onReplega={ample ? onAlterna : tancaRail}`) | Sí (`56px`, arrenca plegat per defecte amb `CLAU_RAIL = 'sdp-xat-rail'`) | **CONFORME (100%)** |
| **5. `ShellGestoria` (`MenuGestoria`)** | `src/sections/gestoria/tauler/ShellGestoria.jsx:171-223`<br>`src/sections/gestoria/tauler/Tauler.css:41-55` | **NO** (només té calaix mòbil a `<= 720px`; en escriptori és un `<aside>` fix de `220px`) | **NO** (resta sempre `220px` a la taula `/app/gestoria/full`) | **TROBALLA I3 (A CORREGIR)** |
| **6. `AdminSection` (Tauler d'Admin)** | `src/sections/admin/AdminSection.jsx:412-420` | **NO** (`AdminSidebar` no usa `AppGridColumn` amb `onReplega` ni passa `leftCollapsed` a `AppGridShell`) | **NO** | **TROBALLA I1 (A CORREGIR)** |
| **7. `ClosaAplicacio` / `EsqueletCatalegColleccio` (Bar, Nevera, Lector, Salut)** | `src/apps/plataforma/ClosaAplicacio.jsx:146-155`<br>`src/apps/comu/esquelet/ColumnaColleccions.jsx:30` | **NO** (`ClosaAplicacio` no gestiona `leftCollapsed` ni passa `onReplega` a l'encapçalament `AppGridColumn`) | **NO** | **TROBALLA I2 (A CORREGIR)** |

#### 4.2. Especificació de Blindatge per a les 3 Troballes de Replegament Lateral

##### Troballa I3 (Prioritat Màxima per a Gestoria) · Replegament `[|<]` de `MenuGestoria` a `ShellGestoria.jsx`
- **Problema:** A `src/sections/gestoria/tauler/ShellGestoria.jsx:171-223` i `src/sections/gestoria/tauler/Tauler.css:41-55`, `.sdp-gestoria-shell` defineix `grid-template-columns: 220px minmax(0, 1fr)`. En escriptori, la barra lateral de la Gestoria (`El Tauler`, `Cabina d'Avió`, `Bancs`, `Impostos`, `Escàner`, `Full trimestral`, `Correu`, `Tractors`, `Històric`) no té el botó `[|<]` (`PanelLeftClose`) per col·lapsar-se a `56px` mostrant només les icones. Això lleva `164px` d'amplada horitzontal preciosa a la taula de `/app/gestoria/full`.
- **Solució Tècnica Exacta:**
  1. A `ShellGestoria.jsx`:
     - Afegir estat `const [menuPlegat, setMenuPlegat] = useState(() => getVal('sdp-gestoria-menu', 'obert') === 'plegat');` (o `useState(false)` si es vol purament en memòria de sessió; verifiquem que no trenque cap test de `ShellGestoria.test.jsx` començant en `false` per defecte!).
     - Al capdamunt de `MenuGestoria` (`ShellGestoria.jsx:171-223`), incloure en escriptori el botó `.sdp-gestoria-shell__plega-menu` amb `<PanelLeftClose size={20} />` (`aria-label={menuPlegat ? 'Desplegar menú de la Gestoria' : 'Replegar menú de la Gestoria'}`, `aria-expanded={!menuPlegat}`, `aria-controls="sdp-gestoria-menu"`).
     - Quan `menuPlegat === true`:
       - El contenidor `.sdp-gestoria-shell` rep `data-menu-plegat="true"`.
       - Cada entrada `.sdp-gestoria-shell__entrada` mostra la seua `<Icona size={20} />` centrada amb `title={m.titol}` i `aria-label={m.titol}`, ocultant visualment l'etiqueta de text i els títols de grup (`VISTA`, `FONTS I REVISIÓ`, `ARXIU`), exactament igual que `.sidebar-closed` de `layout.css` i `AppGridColumn variant="collapsed"`!
  2. A `src/sections/gestoria/tauler/Tauler.css:41-55`:
     ```css
     .sdp-gestoria-shell[data-menu-plegat="true"] {
       grid-template-columns: var(--sdp-touch, 56px) minmax(0, 1fr);
     }
     ```

##### Troballa I1 · Replegament `[|<]` a `AdminSection.jsx` (`src/sections/admin/AdminSection.jsx:412-420`)
- **Problema:** `AdminSection` munta `<AppGridShell>` sense `leftCollapsed` i `AdminSidebar` no ofereix el botó `[|<]` (`onReplega`).
- **Solució Tècnica Exacta:**
  - Afegir `[leftCollapsed, setLeftCollapsed] = useState(false)` a `AdminSection`, passar `leftCollapsed={leftCollapsed}` i `railEsquerra` a `<AppGridShell>`, i usar `<AppGridColumn esDark titol="ADMINISTRACIÓ" onReplega={() => setLeftCollapsed((v) => !v)} variant={leftCollapsed ? 'collapsed' : null}>` a `AdminSidebar`, pintant les icones de les facetes quan està en mode `'collapsed'`.

##### Troballa I2 · Suport de Replegament `[|<]` a `ClosaAplicacio.jsx` (`src/apps/plataforma/ClosaAplicacio.jsx:146-155`)
- **Problema:** `ClosaAplicacio` munta `<AppGridShell>` per a les apps de 3 columnes (`bar`, `nevera`, `lector`, `salut`), però no exposa `leftCollapsed` ni `alternaEsquerra` a `useClosaAplicacio()`.
- **Solució Tècnica Exacta:**
  - Afegir `[esquerraPlegada, setEsquerraPlegada] = useState(false)` a `ClosaAplicacio`, passar `leftCollapsed={esquerraPlegada}` a `<AppGridShell>`, i exposar `{ esquerraPlegada, alternaEsquerra }` a `useClosaAplicacio()` perquè les columnes esquerres de l'esquelet (`ColumnaColleccions.jsx`, `Carpetes.jsx`) puguen passar `onReplega={alternaEsquerra}` al seu `<AppGridColumn>`.

---

### 5. Retroalimentació sobre la Plantilla (`prompt_local.md`)

En compliment del punt 4 del Protocol d'Interacció i Sortida (`prompt.local.s6`):
- **Optimització proposada per a `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (v3.7.0):**
  1. **Camp de Ruta Documental de Sortida (`route`):** Quan el prompt demana un lliurable a `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_auditoria_[nom_ia].md`, convé incloure al bloc `Registre` o a `Instrucció del torn` la comanda exacta de creació documental:
     `node tooling/wiki/document.mjs create --turn-id <ID_TORN> --route auditoria --file _wiki_de_poble/04_escriptori/<FITXER>.md ...`
     Això evita que un agent cree el fitxer a mà sense registrar el `reflex` de creació al fitxer `.agents/runtime/turns/<ID_TORN>.json`, la qual cosa faria fallar `porta-documents.mjs` amb l'error ` Rebut de creació invàlid o no registrat al torn`.
  2. **Separació explícita d'abast d'escriptura en co-working paral·lel:** Quan dos agents (Gemini 4 i Claude Code) treballen simultàniament sobre el mateix torn o branca, la plantilla hauria d'incloure una matriu `Fitxers d'escriptura permesos per agent` (p. ex. Gemini 4: només `_wiki_de_poble/04_escriptori/`; Claude Code: `src/sections/gestoria/` i `src/components/layout/`). Això garanteix zero col·lisions d'edició i zero condicions de carrera sobre l'arbre de treball.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comprovacions executades durant l'auditoria (totes amb codi d'eixida `0`):

1. **Verificació de l'arbre real de `_gestoria_de_poble/`:**
   - Inspeccionats els directoris `/Users/javillinares/Documents/Antigravity/Som de Poble/_gestoria_de_poble/00_Tauler_Central`, `02_Facturacio/2026_Bancs`, `02_Facturacio/2026_2T`, `02_Facturacio/2026_3T` i `90_Arxiu_Historic/Cajamar_Historic`.
2. **Verificació de totes les citacions `fitxer:línia` sobre el codi font:**
   - `src/sections/gestoria/escaner/nucli/escaner.js` (428 línies) i `src/sections/gestoria/escaner/useEscaner.js` (154 línies).
   - `src/sections/gestoria/nucli/tractor.js` (1119 línies), `auditoria.js` (615 línies), `concilia.js` (569 línies), `proveidors.js` (267 línies), `cataleg.js` (153 línies), `c43.js` (443 línies), `movimentsBanc.js` (167 línies), `extracteCsv.js` (242 línies), `model.js` (381 línies).
   - `src/sections/gestoria/tauler/nucli/tractorTauler.js` (291 línies), `resumTauler.js` (611 línies), `targetesTauler.js` (612 línies), `ShellGestoria.jsx` (567 línies), `Tauler.jsx` (479 línies).
   - `src/components/layout/AppGridShell.jsx` (548 línies), `AppGridShell.css` (709 línies), `AppGridColumn.jsx` (182 línies), `UniversalWorkspace.jsx` (1578 línies), `ClosCaXat.jsx` (622 línies), `AdminSection.jsx` (424 línies), `ClosaAplicacio.jsx` (180 línies).
3. **Validació del circuit documental i Porta Olivera:**
   - Creació registrada al torn `torn_dfd3a753-a75b-4317-9332-814fce86cb2f` amb `reflex: sdp:torn_dfd3a753-a75b-4317-9332-814fce86cb2f:3f532a90-a7c6-450e-8132-0432c4c6081c`.
   - Validació amb `node tooling/wiki/document.mjs check --turn-id torn_dfd3a753-a75b-4317-9332-814fce86cb2f --file _wiki_de_poble/04_escriptori/261014_0415_auditoria_gemini4.md` i `node tooling/gates/porta-olivera.mjs`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Zero mutació de codi de producció (`src/`):** En compliment estricte del protocol de Canal Viu i Execució Paral·lela (`prompt.local.s6`, punt 3), este agent (Gemini 4 Argon High) no ha modificat cap fitxer dins de `src/` per no interferir amb el treball simultani de Claude Code ni alterar cap empremta de tractor signada (`src/sections/gestoria/tractors.js`).
- **Empremta criptogràfica dels Tractors (`gestoria.factures` i `gestoria.tauler`):** Qualsevol canvi que Claude Code aplique als mòduls llistats a `BASE_GESTORIA`, `TRACTOR_FACTURES` o `TRACTOR_TAULER` (`src/sections/gestoria/tractors.js`) canviarà l'empremta SHA-256 del manifest; caldrà executar els tests de `tractors.test.js` i reaprovar el tractor a la UI en mode desenvolupament.
- **Zero processos de fons:** Verificat amb `manage_task` que no queda cap cron ni tasca en segon pla activa en finalitzar el torn («Cadascuna a sa casa»).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261014_0400_prompt_gemini4_arquitectura_gestoria_i_replegament]]
- [[261014_0400_prompt_claude_gestoria_i_replegament]]
- [[261014_0412_auditoria_claude]]
- [[261014_0320_auditoria_claude]]
- [[261014_0235_auditoria_codex]]
- [[261014_0148_auditoria_gemini4]]
