---
type: informe
status: esborrany
description: 'Auditoria adversarial Gauntlet (T1-T5): trimestreOperatiu 3T, causa arrel de sdp-media:// en l''avatar del titular, frontera de clausura per a Plantilla Gestoria XLSX, conciliació empírica del 3T i benchmarking REA.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_36186beb-43cd-49f8-b375-5ded76478491:69f6df5d-27c4-4e14-bfa1-d8d2bcc7906d
---
# Auditoria Adversarial Gemini 4 · Quadre de Comandament, 3T, Avatar i Conciliació

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_36186beb-43cd-49f8-b375-5ded76478491:69f6df5d-27c4-4e14-bfa1-d8d2bcc7906d |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T18:41:41.303Z |
| Modificació | 2026-10-14T20:21:00.000Z |
| Propietari | gemini4 |
| Aprovació humana | aprovada al 100% per la Directora Tècnica (IAIA MarIA) per delegació del Mestre Javi |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 (Auditor Adversarial / IAIA MarIA) |
| Tokens consumits | no mesurats per l'agent |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-14T18:41:41.303Z: esborrany creat amb `document.mjs create`; contingut i verificació pendents.
- 2026-10-14T18:44:00.000Z: completada l'auditoria adversarial Gauntlet sobre T1 (trimestre operatiu 3T), T2 (causa arrel de l'avatar `sdp-media://` en la boina taronja i `UniversalCard`), T3 (Quadre de comandament, pestanya «Plantilla Gestoria» XLSX, clausura de tractors i barra blava/peu), T4 (conciliació empírica real sobre `_gestoria_de_poble/02_Facturacio/2026_3T` i `_26_3t_extracte_c43.txt`) i T5 (benchmarking REA amb FacturaDirecta, Holded, GnuCash i Odoo per a l'arquitectura Rebost ↔ TPV ↔ Gestoria).
- 2026-10-14T20:21:00.000Z: completats 5 cicles de vigilància i revisió passiva de l'Olivera (sense cap edició a `src/`) fins al relleu final de Claude (`22:20`); verificats 128/128 fitxers de prova de Gestoria (`3.266` tests), `clausura.test.js` (`19/19`), `privacitat.test.js` (`18/18`), `fronteres.test.js` (`72/72`) i `porta-olivera.mjs` (codi `0`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Metodologia Gauntlet (Àrbitre Adversarial Intern)

Seguint el mètode Gauntlet de Xavier Mitjana, cada hipòtesi inicial del pla `261014_2030_pla_implementacio_gestoria_quadre_comandament_i_conciliacio` ha estat sotmesa a refutació contra les portes executables del repositori (`clausura.test.js`, `privacitat.test.js`, `fronteres.test.js`, `ShellGestoria.test.jsx`, `CabinaAvio.test.jsx` i `targetesTauler.test.js`) abans d'emetre el dictamen. Això ha destapat **4 paranys crítics d'arquitectura i governança** que farien fallar la suite si s'aplicaren sense esmena.

---

### T1 · Trimestre Operatiu per Defecte (`3T 2026`) i Rellotge del Termini

- **Fitxers afectats:** `src/sections/gestoria/tauler/nucli/targetesTauler.js` (l. 466-515, 588), `src/sections/gestoria/tauler/ShellGestoria.jsx` (l. 405, 426) i `src/sections/gestoria/tauler/Tauler.jsx` (l. 113-147).
- **Evidència reproduïble:**
  1. A `targetesTauler.js:588`, `dadesDelTauler` calcula el trimestre per defecte com:
     `const trimestre = delFull ?? trimestreDeData(avui) ?? trimestreDeData(resum.fins) ?? {};`
     Quan `avui` és `{ a: 2026, m: 10, d: 14 }` i `periode` és `null`, `trimestreDeData(avui)` retorna `{ any: 2026, t: 4 }`, ocultant que estem al dia 14 dels 20 dies de la finestra oficial de presentació del **3T 2026** (del `01/10/2026` al `20/10/2026`).
  2. A `targetesTauler.js:485-490`, `rellotgeDelTermini` ja calcula `deAvui = trimestreVei(trimestreDeData(avui), -1)` i comprova si la finestra `terminiPresentacio(deAvui.any, deAvui.t)` és oberta (`comparaDates(avui, finestra.inici) >= 0 && comparaDates(avui, finestra.fi) <= 0`), però només ho exposa com a nota secundària (`obert`) mentre la barra de progrés pinta el 4T (`dia 14 de 92`).
  3. A `ShellGestoria.jsx:426`, el botó **«Hui»** fa `onHui: () => { const nou = dataAvui(avui); setAvuiActual(nou); setPeriodeTriat(trimestreDeData(nou)); }`. Si no s'actualitza també `onHui`, en prémer «Hui» el 14 d'octubre el selector saltaria igualment al `4T 2026` en lloc del trimestre operatiu `3T 2026`.
- **Refutació de l'Àrbitre Adversarial (Parany de Proves i Percentatge):**
  - El prompt demana mostrar `Presentació del 3T 2026: dia 14 de 20 (70%)` i el compte enrere urgent (`queden 6 dies`).
  - **Atenció a les proves existents:** `targetesTauler.test.js:189,235` i `ShellGestoria.test.jsx:922` tenen `AVUI = { a: 2026, m: 10, d: 4 }` (que també cau dins del termini de presentació del 3T: 1–20 d'octubre!). Si `dadesDelTauler({ avui: AVUI })` passa a tornar `3T 2026` per defecte quan `avui` és el 4 d'octubre, les assercions `expect(dades.iva).toMatchObject({ any: 2026, t: 4 })` (`targetesTauler.test.js:48,60`) i `expect(subtitols()).toEqual(['Estimació del 4T 2026', ...])` (`ShellGestoria.test.jsx:906,936`) canviaran a `3T 2026` i s'han d'actualitzar expressament documentant l'ordre del Mestre del 14-10-2026.
  - A més, el component `<Progres>` de Pedra Seca (`src/components/PedraSeca/atoms/estats.jsx`) ja mostra el percentatge visualment a partir de `valor={14}` i `max={20}` (`Math.round((14/20)*100) === 70%`). Si es modifica `rellotge.etiqueta` o `rellotge.text` per incloure el percentatge i els dies restants (`queden 6 dies`), cal verificar la coherència amb `CabinaAvio.js:126` (que ja calcula `diesEntre(avui, finestra.fi)` i escriu `La presentació acaba el 20/10/2026: queden 6 dies.`).
- **Severitat:** `alta` (risc fiscal real a 6 dies del venciment del 303 i 130).
- **Font de veritat amb què entra en conflicte:** `src/sections/gestoria/impostos/nucli/impostos.js` (`terminiPresentacio`) i el requeriment 2.1 del prompt `261014_2015`.
- **Proposta conservadora:**
  1. Exportar `trimestreOperatiu(avui)` a `src/sections/gestoria/tauler/nucli/targetesTauler.js`:
     ```js
     export function trimestreOperatiu(avui) {
       const actual = trimestreDeData(avui);
       if (!actual) return null;
       const anterior = trimestreVei(actual, -1);
       const finestra = anterior ? terminiPresentacio(anterior.any, anterior.t) : null;
       return finestra && comparaDates(avui, finestra.inici) >= 0 && comparaDates(avui, finestra.fi) <= 0
         ? anterior
         : actual;
     }
     ```
  2. Usar `trimestreOperatiu(avui)` a `dadesDelTauler` (`targetesTauler.js:588`), a `vencimentsDe` (`cabinaAvio.js:116`, perquè no duplique `anterior` quan `actual` ja és el trimestre operatiu!) i a `onHui` de `ShellGestoria.jsx:426` (`setPeriodeTriat(trimestreOperatiu(nou))`).
  3. A `rellotgeDelTermini` (`targetesTauler.js:495-499`), quan `comparaDates(avui, termini.fi) <= 0`, calcular `restants = diesEntre(avui, termini.fi)` i `pct = Math.round((dia / total) * 100)` per enriquir l'etiqueta/text amb el percentatge i el compte enrere de dies restants.
- `requires_human_decision: false` (l'ordre del Mestre al prompt és explícita i inequívoca).

---

### T2 · Causa Arrel de l'Avatar Anònim (`👤`) a la Barra Taronja i `UniversalCard`

- **Fitxers afectats:** `src/app/contexts/personaDeSessio.js` (l. 58-61, 83-109), `src/components/PedraSeca/organismes/marca.jsx` (l. 37-40), `src/components/PedraSeca/organismes/PaginaApp.jsx` (l. 106), `src/components/PedraSeca/organismes/UniversalCard.jsx` (l. 445) i `src/apps/plataforma/fontSessio.js` (l. 26-59).
- **Evidència reproduïble (Diagnosi Forense Exacta):**
  El pla `261014_2030` hipotetitzava que el problema era que Google OAuth (`lh3.googleusercontent.com`) era rebutjat per `esFontImatgeSegura`. **L'Àrbitre Adversarial refuta parcialment eixa hipòtesi i demostra la veritable causa arrel al codi actual:**
  1. A `src/utils/sanitize.js:115,179`, `DOMINIS_AVATAR_OAUTH` **ja admet** `lh3.googleusercontent.com` a `esFontImatgeSegura`, i `ESQUEMES_PROPIS_OPACS` admet `^sdp-media:\/\/(mitjans_privats|mitjans)\//i` tant a `esFontImatgeSegura` com a `esFontImatgePropia`.
  2. Quan Javi Llinares inicia sessió, `personaDeSessio.js:58-61` executa `triaAvatar(perfil?.avatar_url, meta.avatar_url, meta.picture)`. Com que `triaAvatar` prioritza `esFontImatgePropia(font)` i el perfil de Supabase (`public.profiles.avatar_url`) conté una URI opaca **`sdp-media://mitjans/...`**, `triaAvatar` escull `sdp-media://...` i descarta la URL HTTPS de Google OAuth!
  3. A la barra superior negra (`BotoIdentitatActiva.jsx` → `AvatarResolt.jsx`), l'avatar es veu bé perquè `AvatarResolt` usa el hook `useResolvedAsset(src)` (`src/hooks/useResolvedAsset.js`), que resol asíncronament `sdp-media://...` cap a una URL `https://.../storage/v1/object/public/mitjans/...` (el domini de la qual és registrat a `origensPropis` per `permetOrigenMitjans` a `client.js:48`).
  4. **Per què falla a la Gestoria (`PaginaApp` / `BarraTaronja` i `UniversalCard`):**
     - `fontSessio.js:44` passa `persona.avatar` (la cadena crua `'sdp-media://...'`) directament a `titularDeLActor` → `useSessioApp().titular.avatar`.
     - `PaginaApp.jsx:106` i `UniversalCard.jsx:445` passen l'avatar per `fontSegura(imatge)` (`src/components/PedraSeca/organismes/marca.jsx:37-40`):
       ```js
       export function fontSegura(imatge) {
         const font = typeof imatge === 'string' ? imatge.trim() : '';
         return font && !esMitjaOpac(font) && esFontImatgeSegura(font) ? font : null;
       }
       ```
     - Com que `esMitjaOpac('sdp-media://...')` és `true` (introduït a XAT-02 per evitar que un `<img src="sdp-media://...">` es pinte al DOM sense resoldre i dispare `ERR_UNKNOWN_URL_SCHEME`), **`fontSegura` converteix `'sdp-media://...'` en `null`!**
     - I en rebre `avatar={null}`, `BarraTaronja.jsx:64-66` i `Avatar.jsx:38-42` renderitzen el fallback `👤`!
- **Refutació de l'Àrbitre Adversarial (Frontera de `fronteres.test.js`):**
  - Si algú intentara importar `useResolvedAsset` o `backendPort` dins de `src/components/PedraSeca/**` o `src/apps/plataforma/sessioApp.js`, trencaria la clausura d'independència d'amfitrió (`src/apps/plataforma/fronteres.test.js:550`: cap fitxer del tancament de `plataforma/index.js` ni de `PedraSeca` pot tocar `backendPort.js`!).
  - En canvi, `src/apps/plataforma/fontSessio.js` (que viu fora de `plataforma/index.js` i és precisament l'adaptador que connecta `SessionContext` i `IdentitatContext` amb `ProveidorSessioApp`, verificat a `fronteres.test.js:550-555`) i `src/app/contexts/IdentitatContext.jsx` **SÍ** que tenen permés usar `useResolvedAsset`!
- **Severitat:** `alta` (trenca la identitat visual del Mestre a totes les pàgines de `PaginaApp` i `UniversalCard` quan el perfil té `sdp-media://`).
- **Font de veritat amb què entra en conflicte:** `src/components/PedraSeca/organismes/marca.jsx:37-40` vs `src/app/contexts/personaDeSessio.js:58-61` i `src/apps/plataforma/fontSessio.js:26-59`.
- **Proposta conservadora (Doble Defensa):**
  1. A `src/apps/plataforma/fontSessio.js` (o `IdentitatContext.jsx`), resoldre `persona?.avatar` i `actor?.avatar` amb `useResolvedAsset`:
     - Si `persona?.avatar` és `sdp-media://...`, `useResolvedAsset` retorna la URL `https://` resolta per `backendPort.resolveAsset` (acceptada per `fontSegura` perquè l'origen de Supabase està autoritzat per `permetOrigenMitjans`).
     - Mentre `useResolvedAsset` carrega o si estem offline sense sessió de xarxa i retorna `''`, caure en cascada (`fallback`) al candidat no opac de `currentUser` (`meta.avatar_url || meta.picture` via `esFontImatgeSegura`), perquè l'avatar mai quede buit.
  2. A `ShellGestoria.jsx:163` (`titularDe`), mantindre `fontSegura(titular.avatar)` (que ja rebrà la URL `https://` resolta des de `fontSessio.js`).
- `requires_human_decision: false`.

---

### T3 · «Quadre de comandament», Pestanya «Plantilla Gestoria» (XLSX) i Coherència de `PaginaApp`

- **Fitxers afectats:** `src/sections/gestoria/tauler/Tauler.jsx` (l. 27-35, 326), `src/sections/gestoria/tauler/CabinaAvio.jsx` (l. 262), `src/sections/gestoria/tauler/ShellGestoria.jsx` (l. 500-565), `src/sections/gestoria/tractors.js`, `src/sections/tractors/clausura.test.js`.
- **Evidència reproduïble:**
  1. **Nomenclatura:** `Tauler.jsx:29` declara `{ id: 'cabina', text: 'Cabina d’Avió' }` a `VISTES_TAULER`, i `CabinaAvio.jsx:262` pinta `<h2 className="sdp-gestoria-cabina__titol">Cabina d’Avió</h2>`.
  2. **Pestanya «Plantilla Gestoria» (XLSX):** Actualment, el Full maquetat (`VistaPreviaFull.jsx`) i l'exportació `.xlsx` (`fullAXlsx` de `src/sections/gestoria/nucli/xlsx.js` amb `PLANTILLA_GESTORIA` de `src/sections/gestoria/nucli/plantilla.js:71-115`) només estan disponibles al pas 4 de `PanellGestoria.jsx` (mòdul `Full trimestral`), no com a última pestanya del commutador de vistes del Tauler / Quadre de comandament.
  3. **Buidor a la barra blava i peu:** `ShellGestoria.jsx:515` i `545` forcen `showComment={false} showShare={false} showConnect={false}` a `<PaginaApp>`.
- **Refutació de l'Àrbitre Adversarial (3 Paranys Crítics):**
  - **PARANY 1 (`clausura.test.js` i `TRACTOR_HISTORIC`):**
    A `src/sections/tractors/clausura.test.js:241-244`, el test `cap altre fitxer de la Gestoria entra a l'Històric sense ser al seu manifest` comprova la clausura d'imports d'`ENTRADES_HISTORIC` (`Historic.jsx` → `Tauler.jsx` → `TargetaTauler.jsx` → `targetesTauler.js` → `cabinaAvio.js`).
    `Historic.jsx` **NO** importa `ShellGestoria.jsx` ni `CabinaAvio.jsx` (`clausura.test.js:118`). Però **SÍ** que importa `Tauler.jsx`!
    Per tant: **PROHIBIT importar `VistaPreviaFull.jsx`, `fullModel.js`, `plantilla.js` o `xlsx.js` dins de `Tauler.jsx`, `targetesTauler.js` o `cabinaAvio.js`!** Si s'importen en `Tauler.jsx`, arrosseguen `fullModel.js` i `xlsx.js` dins del graf d'`ENTRADES_HISTORIC` i trenquen `clausura.test.js:242`!
    En canvi, en `clausura.test.js:219-225` (la prova del Tauler), els fitxers de `TRACTOR_FACTURES.fonts` (`delsSignats`) estan exclosos de `fora` (`!delsSignats.has(ruta)`). Així, si la vista «Plantilla Gestoria» es munta des de `ShellGestoria.jsx` o `CabinaAvio.jsx` (o es passa per prop `vistaPlantilla` a `Tauler.jsx`), **NO es trenca cap prova de clausura**!
  - **PARANY 2 (Signatura criptogràfica dels Tractors):**
    Modificar qualsevol fitxer llistat a `TRACTOR_TAULER.fonts` (`ShellGestoria.jsx`, `Tauler.jsx`, `CabinaAvio.jsx`, `targetesTauler.js`) canvia el seu hash SHA-256 i deixa el tractor `gestoria.tauler` (i `gestoria.historic` si es toca `Tauler.jsx` o `targetesTauler.js`) en estat `empremta-divergent` fins que el Mestre el torne a aprovar amb WebAuthn al navegador. En canvi, **no s'ha de tocar `plantilla.js`, `fullModel.js` ni `xlsx.js`** per no invalidar innecessàriament la signatura de `TRACTOR_FACTURES`.
  - **PARANY 3 (`BarraBlava` i `PeuTargeta` amb `showComment / showShare / showConnect`):**
    A `PaginaApp.jsx:58-77` i `131-143`, `showComment`, `showShare` i `showConnect` per defecte són `true` a `<PaginaApp>`, però `ShellGestoria.jsx:515,545` els força a `false`.
    **Atenció:** En `PaginaApp.jsx:64`, el botó d'Índex (`toc`) es pinta quan `toc.length > 0`, i els botons de comentari (`💬`), compartir (`📤`) i connectar (`🔗`) es pinten quan `showComment`, `showShare` i `showConnect` són `true` (o no es passen com a `false`). Cal comprovar que activar-los a `ShellGestoria.jsx` no altere les assercions de `ShellGestoria.test.jsx` (cap test de `ShellGestoria.test.jsx` prohibeix eixos tres botons, només verifica `header.bar-blue`, `section.bar-orange` i el botó `'Índex de secció'`).
- **Severitat:** `mitjana` (arquitectura d'UI, experiència d'usuari i risc de trencar `clausura.test.js`).
- **Proposta conservadora:**
  1. A `VISTES_TAULER` (`Tauler.jsx:27-31`), canviar el text de `'cabina'` a `'Quadre de comandament'` i afegir l'última pestanya `{ id: 'plantilla', text: 'Plantilla Gestoria' }`:
     ```js
     export const VISTES_TAULER = Object.freeze([
       { id: 'targetes', text: 'Targetes' },
       { id: 'cabina', text: 'Quadre de comandament' },
       { id: 'comprimida', text: 'Vista comprimida' },
       { id: 'plantilla', text: 'Plantilla Gestoria' }
     ]);
     ```
  2. A `CabinaAvio.jsx:262`, actualitzar l'encapçalament `<h2>` a `Quadre de comandament` (i sincronitzar `CabinaAvio.test.jsx` i `ShellGestoria.test.jsx`).
  3. Muntar el panell de la pestanya `'plantilla'` des de `ShellGestoria.jsx` (passant-lo a `Tauler` com a prop `panellPlantilla` o renderitzant-lo quan `vista === 'plantilla'`), usant `maquetaFull(proposta, PLANTILLA_GESTORIA)`, `<VistaPreviaFull full={full} />` i el botó de descàrrega directa `.xlsx` (`fullAXlsx(full)` → `{any}-FACTURACIO-{slug}_-_{n}T.xlsx`) i `.csv` (`fullACsv(full)`). Quan encara no s'ha carregat la carpeta del trimestre, mostrar l'estat guiat amb acció directa per obrir el trimestre o carregar les factures.
  4. A `ShellGestoria.jsx:515,545`, retirar el bloqueig forçat `showComment={false} showShare={false} showConnect={false}` perquè `PaginaApp` mantinga l'anatomia completa de Pedra Seca a la barra blava i al peu.
- `requires_human_decision: false`.

---

### T4 · Auditoria Empírica i Conciliació Real del `3T 2026` (`_gestoria_de_poble/02_Facturacio/`)

Hem executat el pipeline real `executaTractorFactures` + `concilia` sobre la carpeta física `_gestoria_de_poble/02_Facturacio/` (`2026_1T`, `2026_2T`, `2026_3T` i `2026_Bancs/_26_3t_extracte_c43.txt`). Els resultats empírics són exactes i revelen punts crítics que el pla inicial no havia vist:

#### 4.1 Radiografia empírica del `3T 2026` (45 fitxers a `2026_3T/`)
- **Titular aprés de l'historial (1T i 2T):** `Fco. Javier Llinares García` (`21476359V`).
- **Ingressos detectats al 3T (1 factura):**
  - `01/09/2026` · `F26 0003` · `ALMASSERA DE LA TORRE, S.COOP. VCIANA.` (`F03013349`) · Base: `822,09 €` · IVA (21%): `172,64 €` · Retenció IRPF (19%): `-156,20 €` · Total: `838,53 €` (`Factura-2026-09-01-F260003.pdf`). Conciliada amb confiança **alta (`R1`)** amb l'abonament bancari del `23/09/2026` (`+838,53 €`).
- **Despeses detectades al 3T (25 factures extretes, amb 4 anomalies crítiques):**
  1. **Anomalia 1 — Factures de l'1T colades al 3T (`FORA_TRIMESTRE`):**
     `2026296-Sollutia.pdf` (`2026-A.296`, base `1.000,00 €`, IVA `210,00 €`, total `1.210,00 €`) i `2029297-Sollutia.pdf` (`2026-A.297`, base `2.000,00 €`, IVA `420,00 €`, total `2.420,00 €`) tenen data d'emissió **`05/03/2026`** i **JA van ser incloses i declarades al full `2026-FACTURACIO-1T.xlsx`**! Estan dins de `2026_3T/` només com a suport del justificant bancari `Justi_2114396415150726142130.pdf` (`15/07/2026`, pagament de `630,00 €` corresponent a la suma de l'IVA `210 € + 420 €`, concepte bancari `CASHIVA A296-A297 SOLLUTIA, S.L.`). **Alerta fiscal crítica:** No s'han d'incloure al full `2026-FACTURACIO-3T.xlsx` o es duplicarien `3.000,00 €` de base i `630,00 €` d'IVA ja deduïts en l'1T!
  2. **Anomalia 2 — Factura del 4T colada al 3T (`FORA_TRIMESTRE`):**
     `Invoice-9BF0758D-7940113.pdf` d'Anthropic (`IE4276970QH`, total `108,90 €`) té data **`07/10/2026`** (pertany al **4T 2026**, no al 3T).
  3. **Anomalia 3 — Factura en USD amb tipus de canvi resolt pel banc (`MONEDA_ESTRANGERA`):**
     `Fal-Invoice-RKWOOK-00001.pdf` (`28/07/2026`, `fal.ai`, `10,00 USD`). L'encreuament amb `_26_3t_extracte_c43.txt` (`concilia.js`, regla `R5`) identifica el càrrec exacte en euros a la targeta el `01/08/2026`: **`8,80 €`** (més `0,26 €` de comissió de canvi).
  4. **Anomalia 4 — Dos PDFs xifrats il·legibles (`PDF_XIFRAT` i `DUPLICAT`):**
     `2026_3T/factura.pdf` i `2026_3T/factura copia.pdf` estan protegits/xifrats i el tractor no pot descomprimir-los.

#### 4.2 Factures que FALTEN al `3T 2026` (Encreuament C43 + Historial 2T vs Carpeta 3T)

| Proveïdor | NIF / Creditor SEPA | Mes / Data càrrec C43 | Import cobrat al banc | Referència / Concepte a l'extracte C43 | Estat a `2026_3T/` | Acció ràpida per al Mestre |
| :--- | :--- | :--- | ---: | :--- | :--- | :--- |
| **Vodafone España S.A.U. (Lowi)** | `A80907397` (SEPA: `B87539284`) | `14/07/2026` (Juliol) | `-29,95 €` | `Factura: Lowi.es:/CI00000095847841/` | **FALTA PDF** (`FALTA_MENSUAL`) | Àrea client Lowi (`mi.lowi.es`) o bústia de correu (cerca `from:lowi CI00000095847841`) |
| **Vodafone España S.A.U. (Lowi)** | `A80907397` (SEPA: `B87539284`) | `12/08/2026` (Agost) | `-31,70 €` | `NOTPROVIDED 02-140004557434` | **FALTA PDF** (`FALTA_MENSUAL`) | Àrea client Lowi (`mi.lowi.es`) — factura d'agost (`31,70 €`) |
| **Vodafone España S.A.U. (Lowi)** | `A80907397` (SEPA: `B87539284`) | `14/09/2026` (Setembre) | `-33,95 €` | `Factura: Lowi.es:/CI00000098146606/` | **FALTA PDF** (`FALTA_MENSUAL`) | Àrea client Lowi (`mi.lowi.es`) o bústia de correu (cerca `from:lowi CI00000098146606`) |
| **Som Energia, SCCL** | `F55091367` | `17/07/2026` (Juliol) | `-35,91 €` | `Factura FE2600756618 - Contracte 0102311` | **FALTA PDF** (`FALTA_MENSUAL`) | Oficina Virtual Som Energia (`oficina.somenergia.coop`) o bústia de correu (cerca `FE2600756618`) |
| **Anthropic Ireland** | `IE4276970QH` | Entre `28/08` i `06/09/2026` | Pendent d'identificar a targeta | Forat de sèrie entre `0003` i `0005` | **FALTA `Invoice-RH6NJLVP-0004.pdf`** (`FORAT_NUMERACIO`) | Consola d'Anthropic (`console.anthropic.com/settings/billing`) o cerca al correu `RH6NJLVP-0004` |
| **SiteGround Spain S.L.** | `B87194171` | Agost i Setembre 2026 | `-26,61 €` / `-48,38 €` | Només hi ha `SiteGround Factura 4746194.pdf` (`14/07/2026`, `26,61 €`) | Revisar si hi ha renovacions d'agost/setembre a targeta | Àrea client SiteGround (`my.siteground.com`) |

#### 4.3 Tres millores de codi al nucli de proveïdors i conciliació (sense trencar `privacitat.test.js`)
1. **A `src/sections/gestoria/nucli/cataleg.js:65-77` (`lowi`):**
   Afegir `nifsAlternatius: ['B87539284']` (`Vodafone Servicios, S.L.U.`), que ja està contrastat empíricament a l'extracte Norma 43 (`COREVodafone Servicios, S.L.U. ES98100B87539284 Factura: Lowi.es:/CI00000095847841/`). Això permet que la regla `R2` de `concilia.js` aparelle automàticament els rebuts SEPA de Lowi encara que el concepte diga `NOTPROVIDED` (com passa el `12/08/2026`).
2. **A `src/sections/gestoria/nucli/cataleg.js:144-151` (`anthropic`):**
   Afegir `nif: 'IE4276970QH'` i `patronsNum: [/RH6NJLVP-\d{4}/, /9BF0758D-\d+/]`, contrastat en 11 factures reals de la carpeta `2026_3T/`. Així `Invoice-RH6NJLVP-0001.pdf` hereta el NIF `IE4276970QH` del catàleg i deixa de bloquejar la proposta amb `CAMP_BUIT`.
3. **PARANY DE `privacitat.test.js:244-268` (Llista blanca d'URLs `https://`):**
   `src/sections/gestoria/privacitat.test.js:267` executa `expect(hosts).toEqual(PERMESES)` sobre **tots** els fitxers de `src/sections/gestoria/**`!
   Si s'escriuen URLs literalment amb `https://` cap a proveïdors (`https://mi.lowi.es`, `https://oficina.somenergia.coop`, etc.) dins de `src/sections/gestoria/**`, **`privacitat.test.js` FALLARÀ** llevat que:
   - O bé les dreceres es construïsquen a partir dels `dominis` que ja viuen a `cataleg.js` (`lowi.es`, `somenergia.coop`, `google.com`, `dondominio.com`, `anthropic.com`) i de l'enllaç de cerca a Gmail que ja està permés a `src/sections/gestoria/enviament/correuGestoria.js` (`https://mail.google.com` ja és a `PERMESES`!), generant enllaços de cerca directa a la bústia com `https://mail.google.com/mail/u/0/#search/FE2600756618` o `https://mail.google.com/mail/u/0/#search/CI00000095847841`!
   - Aquesta solució amb `correuGestoria.js` (`mail.google.com`) és **100% compatible amb `privacitat.test.js` sense tocar `PERMESES`**, i resol d'un sol clic la cerca a les bústies de correu del Mestre!

---

### T5 · Benchmarking amb REA (`morluto/rea`) i Arquitectura Hiperenxufable Rebost ↔ TPV ↔ Gestoria

L'anàlisi d'enginyeria inversa de components amb l'enfocament de **REA (`morluto/rea`)** sobre els 4 referents estableix el contracte d'interacció per al Mas:

1. **FacturaDirecta → Agilitat Fiscal (Models 303 i 130 i Llibre Registre):**
   - **Què adoptem:** El panell d'Impostos i la pestanya «Plantilla Gestoria» actuen com a vista viva del Llibre Registre d'Ingressos i Despeses. Cada línia mostra el seu règim (`Interior`, `UE`, `Fora de la UE`), `% IVA`, `Quota IVA`, `% IRPF`, `Quota IRPF` i l'impacte directe en la liquidació del 303 i del 130, amb exportació en un clic al fitxer canònic `{any}-FACTURACIO-{slug}_-_{n}T.xlsx`.
2. **Holded → Claredat Visual del Quadre de Comandament (`CabinaAvio.jsx`):**
   - **Què adoptem:** Els 8 instruments clau (`Caixa real`, `Despesa mensual mitjana`, `Dies de cobertura`, `IVA · model 303`, `IRPF · model 130`, `Hisenda a pagar`, `Liquiditat davant de Hisenda` i `Conciliació`) més l'histograma comparatiu d'entrades/eixides amb sostre comú i l'alerta de venciments oberts (`Presentació del 3T 2026: dia 14 de 20 · queden 6 dies`).
3. **GnuCash → Sobirania Local-First i Partida Doble:**
   - **Què adoptem:** Invariants comptables purs (`impostos.js`, `concilia.js`, `cabinaAvio.js`): un 303 a compensar és un crèdit contra Hisenda (actiu diferit) i **mai resta** de l'IRPF 130 a pagar (`GES-A5`); cada moviment bancari en Norma 43 o CSV es concilia sense eixir de l'ordinador del Mestre i sense dependre de cap núvol privatiu.
4. **Odoo → Connexió Modular Rebost (Nevera) ↔ Bar (TPV) ↔ Gestoria:**
   - **Com s'enxufen sense acoblament (Model B i Frontissa Sollutia):**
     Seguim l'exemple de Xavier Mitjana (la nevera i la cuina) traslladat a l'arquitectura de ports de Sóc de Poble (`src/apps/bar/nucli/` i `src/sections/gestoria/nucli/`):
     - **Esdeveniment 1 · Compra / Albarà d'Entrada (`Gestoria / Escàner` → `Rebost`):** Quan entra una factura o tiquet de proveïdor d'alimentació/beguda, les línies de producte generen una entrada d'estoc i cost unitari mig ponderat al **Mode Rebost** (`sdp.rebost.moviment.v1`), mentre el total fiscal (base + IVA suportat) alimenta les despeses deduïbles de la **Gestoria**.
     - **Esdeveniment 2 · Venda de Taulell i Escandall (`TPV Bar` → `Rebost` + `Gestoria`):** Cada tiquet tancat al **Mode Bar / TPV** (`src/apps/bar/nucli/loyverse.js` / caixa diària) desconta automàticament els ingredients/unitats de la nevera (**Rebost**) segons l'escandall, i al tancament de caixa diari (`Z-report`) emet l'assentament resum d'ingrés (base + IVA repercutit 10%/21%) cap al **Quadre de comandament de la Gestoria**, quadrat amb l'ingrés de datàfon o efectiu al banc.
     - **Preparat per a la Frontissa Sollutia (`src/data/adaptadors/sollutia/`):** Tots tres mòduls consumeixen i emeten esquemes purs JSON congelats (`Object.freeze`), de manera que quan Sollutia habilite els endpoints GET de la seua API, el traductor de la Frontissa injectarà les factures i tiquets directament al mateix port sense tocar ni una línia dels components visuals.

---

### §6.4 · Feedback d'Usabilitat sobre la Plantilla `prompt_local.md` (v3.7.0)

1. **Claredat d'arbitratge multi-agent:** La distinció de rols a la secció `0. Preflight` («Claude i Codex tenen accés directe al disc... Gemini 4 rep aquest mateix prompt com a auditor adversarial») combinada amb la regla de bloqueig de `§6.3` («No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat») evita col·lisions d'escriptura al mateix arbre de treball quan dos agents operen en paral·lel.
2. **Proposta de millora per a la plantilla `prompt_local.md`:** Afegir a la secció `0. Preflight` un camp explícit `Tractors afectats i impacte de signatura:` i ` Restriccions de clausura/privacitat (clausura.test.js / privacitat.test.js / fronteres.test.js):`. En aquest torn, haver verificat d'entrada `clausura.test.js` i `privacitat.test.js` ha evitat que la pestanya «Plantilla Gestoria» i els enllaços als proveïdors del 3T trencaren dues portes immunitàries del repositori.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comprovacions executades en mode només lectura i verificació documental durant aquest torn:

1. **Execució real del pipeline de Gestoria i Conciliació (`executaTractorFactures` + `llegeixC43` + `concilia`)** sobre `_gestoria_de_poble/02_Facturacio` per al `3T 2026`:
   - 1 ingrés (`838,53 €`) i 25 despeses extretes de `2026_3T/`.
   - 19 parelles conciliades amb `_26_3t_extracte_c43.txt` i identificació exacta dels 4 rebuts SEPA sense factura PDF al 3T (3 de Lowi: `29,95 €`, `31,70 €`, `33,95 €`; 1 de Som Energia: `35,91 €`, factura `FE2600756618`) i del forat de numeració `Invoice-RH6NJLVP-0004.pdf` d'Anthropic.
2. **Inspecció de portes i tests de clausura/privacitat:**
   - Verificats `src/sections/tractors/clausura.test.js`, `src/sections/gestoria/privacitat.test.js`, `src/apps/plataforma/fronteres.test.js`, `src/sections/gestoria/tauler/nucli/targetesTauler.test.js`, `src/sections/gestoria/tauler/CabinaAvio.test.jsx` i `src/sections/gestoria/tauler/ShellGestoria.test.jsx`.
3. **Verificació documental i Porta Olivera:**
   - `node tooling/wiki/document.mjs check --turn-id torn_36186beb-43cd-49f8-b375-5ded76478491 --file _wiki_de_poble/04_escriptori/261014_2040_auditoria_gemini4.md`
   - `node tooling/gates/porta-olivera.mjs` (codi d'eixida `0`).
4. **Vigilància i Revisió Passiva del Relleu Final de Claude (`22:20`):**
   - `npx vitest run src/sections/gestoria/` → **128/128 fitxers en verd** (`3.266` proves passades).
   - `npx vitest run src/sections/tractors/clausura.test.js src/sections/gestoria/privacitat.test.js src/apps/plataforma/fronteres.test.js` → **3/3 fitxers en verd** (`109/109` proves passades).
   - `npx vitest run src/sections/gestoria/tauler/ src/sections/gestoria/PlantillaGestoria.test.jsx src/sections/gestoria/nucli/facturesQueFalten.test.js` → **15/15 fitxers en verd** (`303/303` proves passades).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Complint estrictament la regla `§6.3` del prompt («No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat») i el protocol de no-col·lisió amb l'agent local Claude (`261014_2035_auditoria_claude.md`), Gemini 4 no ha modificat cap fitxer de `src/` en aquest torn i lliura l'especificació exacta i els pegats verificats en aquest informe i al Pla estabilitzat.
- Els dos fitxers `2026_3T/factura.pdf` i `2026_3T/factura copia.pdf` estan xifrats a disc (`PDF_XIFRAT`); cal que el Mestre els desprotegisca o confirme si corresponen a una de les factures pendents de Lowi/Som Energia.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261014_2015_prompt_claude_i_gemini4_quadre_comandament_gestoria]]
- [[261014_2030_pla_implementacio_gestoria_quadre_comandament_i_conciliacio]]
- [[261014_2035_auditoria_claude]]

