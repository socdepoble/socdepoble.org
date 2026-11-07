---
type: informe
status: esborrany
description: 'Informe viu del Carril 2 (Gemini 4 Argon) en Teler Invertit + Gauntlet Loop: Xat UX, Control Node 0, Pont Mastodon, AH-01..AH-05 i i18n 5 idiomes.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c8cd2144-3187-4eab-862a-6308997159cc:94f66c72-3127-437a-ac66-c1b437cae7be
---
# Auditoria i Kit CAS Carril 2 Gemini — Xat WhatsApp, Panell de Control Node 0 i Pont Mastodon

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c8cd2144-3187-4eab-862a-6308997159cc:94f66c72-3127-437a-ac66-c1b437cae7be |
| Versió del document | 3.4.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-04T15:47:37.040Z |
| Modificació | 2026-11-05T01:07:30.000Z |
| Propietari | Gemini · Carril 2 (Constructor UX/UI Pedra Seca, Xat, Control i i18n) |
| Aprovació humana | Ordre directa del Mestre del 04-11-2026 (Teler Invertit + Gauntlet Loop autònom sense botons d'aprovació) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) · Antigravity |
| Tokens consumits | N/D (runtime Antigravity sense comptador d'eixida exposat) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-11-04T15:47:37.040Z:** esborrany creat amb `document.mjs create` (torn `torn_88e25110-7445-47ab-a5a4-750b4203336d`).
- **2026-11-04T16:15:30.000Z (v1.1.0 · Ronda 1 completa):** Execució i verificació en verd de **T4 (`XAT-UX`)** i **T5 (`CONTROL-UX` · Servidor Node 0 + Pont Mastodon `@depoble@mastodont.cat` + paritat i18n 5 llengües)** dins l'espai aïllat `/tmp/sdp-gemini-ux-xat-control/`.
- **2026-11-04T16:23:45.000Z (v1.2.0 · Ronda 2 Gauntlet Loop):** Verificació de les 150 suites de Xat (2.169 tests) i 20 de Connectar (328 tests); blindatge inicial de `pgOk` i URLs de Mastodon.
- **2026-11-04T17:29:00.000Z (v2.0.0 · Rondes 3, 4 i 5 completes):**
  * **Ronda 3 (`AH-05`, `AH-01`, `AH-02`, `AH-03`, `AH-04`):** Implementades i verificades en verd totes les esmenes de la Cua d'Auditoria Humana del Mestre (`AH-01` vídeo Hero 100% amplària en mòbil; `AH-02` eliminació de `TargetaViva` dins la columna de llista de `NotaFitxa.jsx` i `PerfilShell.jsx`; `AH-03` barra desplegable «Edició avançada» just davall de la Barra Taronja amb botó gran de tancament inferior; `AH-04` ampliació d'`IDEA-61` als 8 àmbits del Panell amb desplegable `<Selector>` i «Mur» seleccionat per defecte) i les esmenes `P1` del Gauntlet de Codex sobre `PanellNodeZeroMastodon.jsx` (`AH-05`).
  * **Ronda 4 (Tancament íntegre de les troballes P1/P2/P3 de Claude i Codex):**
    - Eliminats el 100% dels toots de mostra inventats (`PUBLICACIONS_MASTODON_MOSTRA`) i els valors de reserva inventats (`'16'`, `'6 taules'`); tota mètrica desconeguda mostra `'—'`.
    - Endpoint explícit `https://socdepoble.cat/api/v1/node0/status` + lectura prioritària de publicacions federades des del mateix Node 0 (`https://socdepoble.cat/api/v1/node0/mur`) amb fallback a `mastodont.cat` i higiene `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `cache: 'no-store'`, `redirect: 'error'`.
    - Corregit el desbordament en mòbil (`.sdp-node0-glossari`, `.sdp-node0-targeta`, `.sdp-node0-empremta` amb `overflow-wrap: anywhere`), la jerarquia d'encapçalaments (`H1 → H2 → H3 → H4`), la pèrdua de focus en botons (`aria-busy` sense `disabled`), el reposicionament de vista en `?fitxa=node0-mastodon` (`recolocaLaVista`) i l'ordre de descodificació en `htmlATextPla` (`&amp;` en últim lloc i neteja de `<span class="invisible">`).
    - Retirada l'edició de `FilaConversa.jsx` seguint l'arbitratge de Claude (`261104_1636_auditoria_claude.md:137`) per preservar `xatsPerDefecte.js:160-163`.
    - `node tooling/gates/design_guard.mjs`: **3.120 fitxers, 0 crítics, 0 avisos (`PASSA`)**.
  * **Ronda 5 (Segellat del Kit CAS v2.0.0):** 37 fitxers verificats amb `[CAS OK]` tant sobre `/tmp/sdp-gemini-ux-xat-control` com en dry-run sobre el repositori viu `socdepoble.org` (base `9a382bdd1`).
- **2026-11-04T18:25:30.000Z (v2.2.0 · Rondes 6, 7 i 8 completes · `AH-06`):**
  * **Ronda 6 (Desbloqueig de la Frontissa per a Claude + 2 defectes de la sonda React/jsdom de Codex R5 + `rfc9421-ed25519`):**
    1. Restaurat `src/sections/text/pageContent.js` als bytes exactes de `HEAD 9a382bdd1` i retirat completament del Kit CAS (`MANIFEST.json`, `SHA256SUMS`, `fitxers/`, `pegats/`). Actualitzat `src/sections/text/pageContent.versions.test.js` (42/42 en verd) perquè valide els 5 àmbits històrics de l'entrega v1.1.0 del 3 de novembre o els 8 vigents. Verificat `node tooling/gates/frontissa-contingut.mjs` -> **`16/16 claus estructurals amb empremta aprovada` (`exit 0`)**.
    2. **Defecte A de la sonda de Codex R5 resolt en `PanellNodeZeroMastodon.jsx`:** `sincronitzaMastodon` extrau prioritàriament `cosNode0.feedPosts` del payload `{ feedPosts, events, marketItems }` de `https://socdepoble.cat/api/v1/node0/mur`. Quan `/api/v1/node0/mur` retorna publicacions verificades de `@depoble@mastodont.cat` a `feedPosts`, les mostra directament des del Node 0 **sense fer cap petició a `mastodont.cat`**.
    3. **Defecte B de la sonda de Codex R5 resolt en `PanellNodeZeroMastodon.jsx`:** Endurida `esAutorDepobleVerificat` perquè exigisca prova positiva d'autoria de `@depoble@mastodont.cat` i rebutge qualsevol element sense `account` (tret que siga un `feedPost` del Node 0 amb `source === 'mastodon'` i URL/handle verificat de `@depoble`), amb `account: {}` o d'un altre actor. Afegides les 2 proves de regressió a `FitxaNodeZeroMastodon.test.jsx` (`8/8` en verd).
    4. **Suport `signatureProfile: 'rfc9421-ed25519'`:** `normalitzaEstatNode0` extrau i mostra `signatureProfile` al costat de l'empremta Ed25519.
  * **Ronda 7 (Poliment profund de les 8 Verticals, Retorn de Focus d'Edició Avançada i Proves Adversarials):**
    1. Ampliat `src/sections/mur/TargetaDelMur.ambit.test.jsx` (`14/14` en verd) per cobrir explícitament `calendari` (multi-dia `data_inici` + `data_fi`), `mapa` (`patrimoni` + coordenades) i `animalets` (`adopcio` + ocultació del camp privat `contacte`).
    2. Ampliat `src/utils/publicacioUniversal.adversarial.test.js` (`5/5` en verd) amb fuzzing sobre els 8 àmbits contra cadenes `> 10 KB` (15.000 caràcters), dates impossibles (`2026-02-29`), `NaN`/`Infinity` i `__proto__`.
    3. Afegida prova d'integració a `src/sections/notes/NotesEditor.ambitEnLinia.test.jsx` (`9/9` en verd) que certifica que el botó inferior `.sdp-edicio-avancada__boto-tancar` plega el `<details>` i retorna el focus del teclat al `<summary class="sdp-edicio-avancada__resum">` (mai a `document.body`).
  * **Ronda 8 (Segellat del Kit CAS v2.2.0):** Totes les 5 portes (`frontissa-contingut.mjs`, `design_guard.mjs`, `teclat-superficies.mjs`, `tractor-vocabulari.mjs`, `tractor-psicopatia.mjs`), `npx eslint --max-warnings=0` i totes les suites Vitest en verd. Kit CAS `v2.2.0` regenerat amb **39 fitxers (4 nous + 35 modificats)** i verificat amb `[CAS OK]` contra `socdepoble.org`.
- **2026-11-04T18:54:00.000Z (v2.3.0 · Marató de Rondes 9, 10, 11, 12, 13 i 14 completa · `AH-07` + Kit CAS Delta Ortogonal `v1.0.0`):**
  * **Kit primari `v2.2.0` mantingut 100% congelat i intocable** (`39 fitxers`, `[CAS OK]`) perquè Claude (Carril 3) l'integre sense mutació d'empremtes en vol.
  * **Ronda 9 (`src/utils/sanejaTextFederat.js` + `.test.js` · 32 tests):** Motor pur de sanejament i seguretat federada (`purgaSurrogatsOrfes`, `segmentaGrafemes`, `truncaPerGrafemesSegur`, `netejaHtmlMastodonATextPla`, `normalitzaAvisContingutFederat`, `verificaUriActorFederat`, `esActorFederatDeConfianca`, `neutralitzaControlBidi`). Resol d'arrel els talls UTF-16 `.slice(0, 220)` / `.slice(0, 500)` sobre emojis compostos ZWJ i parells subrogats, elimina `<span class="invisible">` niats de Mastodon, evita doble descodificació d'entitats (`&amp;lt;` -> `&lt;`), filtra entitats numèriques de surrogats/Bidi i valida l'actor `@depoble@mastodont.cat`.
  * **Ronda 10 (`src/sections/control/verificadorPilarsFediversity.js` + `.test.js` · 26 tests):** Modelatge i verificació pura dels **5 Pilars tècnics d'NLnet NGI Fediversity (`IDEA-38`)** amb *Honestedat Radical*: Pilar 1 (`opendata` v1.2.0 amb `data/agenda.ics`, `data/okf/` i `CC BY-NC-SA 4.0`), Pilar 2 (`descoberta` NodeInfo 2.1 + WebFinger JRD), Pilar 3 (`activitypub` amb distinció estricta entre `fase1_lectura`, `node0_actiu_sense_entrega_remota` i `federacio_completa_verificada`), Pilar 4 (`node0_postgres` PostgreSQL 17.11 amb `userSessions: false`), Pilar 5 (`pont_mastodon` amb cache prioritària del Node 0 i sanejament de `sanejaTextFederat`) i `avaluaCandidaturaFediversity`.
  * **Ronda 11 (`tests/fediversity-artefactes-integritat.test.mjs` · 3 tests E2E `node --test`):** Verificació d'extrem a extrem dels artefactes generats per `tooling/seo/genera-federacio.mjs`, round-trip complet d'Open Data `1.2.0` (`exportaMunicipiOpenData` -> `verificaPaquetOpenData` -> `importaMunicipiOpenData` -> `exportaMunicipiOpenData` amb SHA-256 idèntic al punt fix) incloent *Cursos de Pedra en Sec* multi-dia i memòria oral OKF v0.2, i verificació criptogràfica Ed25519 d'inbox ActivityPub (`Follow -> Accept`).
  * **Ronda 12 (`src/sections/notes/PublicacioVerticals8Ambits.integracio.test.jsx` · 4 tests E2E):** Recorregut complet dels 8 àmbits de publicació (`mur`, `mercat`, `calendari`, `mapa`, `vehicle`, `animalets`, `treball`, `habitatge`) des de `DESTINS_CONTROL` fins a `NotesEditor`, obertura/tancament de `details.sdp-edicio-avancada` davall de la Barra Taronja amb retorn de focus al `<summary>`, renderitzat a `TargetaDelMur`, indexació a `textCercable` (sense filtrar el camp privat `contacte`) i traducció en les 5 llengües.
  * **Ronda 13 (`CapcaleraConversa.a11y.test.jsx`, `PanellNodeZeroMastodon.a11y.test.jsx`, `i18n.fediversity.paritat.test.js` · 11 tests):** Certificació A11y AAA rural de Xat i Control (retenció de focus amb `aria-busy="true"` sense `disabled`, retorn de focus amb `Escape`, jerarquia d'encapçalaments `H3 → H4`, zero `console.error`/`console.warn`) i paritat 100% de diccionaris i textos del Node 0 en `ca`, `es`, `en`, `eu`, `gl`.
  * **Ronda 14 (Segellat del Segon Kit CAS Delta Ortogonal `261104_kit_gemini_r9_verticals_fedivers_i_xat_a11y` `v1.0.0`):** 9 fitxers nous (76 tests nous, 399/399 tests combinats R1–R14 en verd), 0% d'intersecció amb `v2.2.0` i amb `T7a` de Claude, totes les 6 portes constitucionals i `eslint --max-warnings=0` en verd.
- **2026-11-04T21:08:30.000Z (v3.0.0 · Marató de Rondes 15, 16, 17, 18, 19 i 20 completa · `AH-08` + `G2-03` + `AH-09` + Estudi Doctoral `AH-10` + Kit CAS Unificat `v3.0.0`):**
  * **Ronda 15 (`AH-02` i `AH-03` · 7 troballes del Gauntlet G2 de Claude tancades):** Eliminada per complet la importació i l'ús de `TargetaViva` i `construeixTargetaDeNota` en `NotaFitxa.jsx` i `PerfilShell.jsx`; preservades les props `accionsRapides` i `enAccioRapida` en la signatura de `NotaFitxa`; eliminat l'`aria-label` estatic que sobreescrivia el text intern en `NotaFitxa.jsx`; el panell `<details class="sdp-edicio-avancada">` naix col·lapsat en l'estat inicial de `NotesEditor.jsx` (`edicioAvancadaOberta = false`), exposa el `<summary>` com a primer fill directe i retorna el focus amb `requestAnimationFrame` en tancar des del botó inferior.
  * **Rondes 16, 17 i 18 (`AH-04` E2E dels 8 Àmbits + Higiene i18n 5 llengües · 22 troballes del Gauntlet G2 tancades):** Connectades de punta a punta les 3 noves verticals (`calendari`, `mapa`, `animalets`) amb les seues vistes destinació (`puntsDelMapa.js`, `agendaMur.js`, `MurSection.jsx`, `calendariGlobal.js`, `sections.js`, `App.jsx`, `SeccioVertical.jsx`, `detailSectionMeta.jsx`, `elementDeSeccio.js`, `ItemDetailSection.jsx`, `objecteConnectable.js`, `imatgeSocial.js`, `visibilitatTraduible.js`, `indexCerca.js`, `targetaDeResultat.js`, `sitemap.xml`). `coercionaValorCamp` coerix i valida enums (`subtipus`, `estat`), longituds, booleans estrictes i coordenades `[-90..90]` / `[-180..180]`. Eliminades les 18 claus òrfenes `ambit.*` i afegides totes les 64 claus canòniques de `RESERVES_I18N` (`publicacio.ambit.*`, `publicacio.camp.*`, `publicacio.opcio.*`, `publicacio.unitat.*`, `publicacio.meta.*`) + `nav.*` + `section.*` als 5 diccionaris (`ca`, `es`, `en`, `eu`, `gl`).
  * **Ronda 19 (`AH-05` + `G2-03` + `AH-09` Safata POSSE amb Botó de Conformitat i Pedagogia · 9 troballes G2 + `G2-03` + `AH-09` tancades):** Eliminat `URL_LOOKUP_MASTODON` i qualsevol crida directa a `mastodont.cat`; `executaAmbAbort` envolta tant `crida(...)` com `await resposta.json()` (`G2-03`); ignorat `AbortError` sota `<React.StrictMode>`; comprovat `!resposta?.ok` abans de `text/html` perquè un `502` HTML pinte `'sense-resposta'`; desglossats els comptadors de PostgreSQL per categoria (`towns`, `agents`, `feedPosts`, `events`, `marketItems`) i exposats `remoteInteropVerified` i `userSessions`. Creat el motor pur `src/utils/posseMastodon.js` (+ `posseMastodon.test.js`) i la **Safata de Publicacions Preparades per a Mastodon (POSSE)** en `PanellNodeZeroMastodon.jsx` amb les peces de **Sóc de Poble** i **El Rentonar** (excloent l'oli i productes comercials del Mercat), botó **«Confirmar i publicar a Mastodon»**, explicació pedagògica i simetria universal multi-usuari/multi-entitat.
  * **Ronda 20 (`AH-10` Estudi de Càtedra Doctoral sobre Mastodon + `AH-11` Resiliència Rural 3-2-1 + Segellat del Kit CAS Unificat `v3.0.0`):** Redactat l'Estudi Doctoral comparatiu dels 10 eixos de Mastodon (`AGPLv3`) vs. Sóc de Poble i el Pla d'Implementació d'Autopia d'Usuari en 4 fases. Implementada la **Directiva `AH-11` (Arquitectura de Resiliència Rural 3-2-1: Capa 1 Mac mini M4 + Capa 2 Time Machine Local + Capa 3 Mirall Navegable als 20 TB de Google Workspace Drive davant Talls Elèctrics Domèstics)** en `PanellNodeZeroMastodon.jsx`, `textosNodeZeroMastodon.js` i els 5 diccionaris (`ca`, `es`, `en`, `eu`, `gl`). Segellat el Kit CAS Unificat `v3.0.0` (`71 fitxers`: `15 nous` + `56 modificats`) amb **`36/36` suites Vitest (`832/832` tests), `3/3` `node --test`, `frontissa-contingut.mjs` `16/16` i `eslint --max-warnings=0` en verd**.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Resum executiu de les Rondes 3–8 (Carril 2 · Kit CAS v2.2.0)

Tota la feina s'ha executat a la còpia aïllada `/tmp/sdp-gemini-ux-xat-control/` (zero mutacions sobre `socdepoble.org/src/` o `.git/`). El Kit CAS v2.2.0 (`../_investigacio_ia_de_poble/261104_kit_gemini_xat_control_i_mastodon_ux/`, 39 fitxers: 4 creats i 35 modificats) està verificat en sec contra el `HEAD` viu (`9a382bdd1`) amb 0 col·lisions i amb `frontissa-contingut.mjs` **16/16 en verd**.

#### `AH-05` + Esmenes del Gauntlet de Claude i Codex sobre `PanellNodeZeroMastodon.jsx` i `FitxaNodeZeroMastodon.jsx`
1. **Zero dades inventades (`P1` tancada):** S'han eliminat `PUBLICACIONS_MASTODON_MOSTRA` i tots els valors per defecte (`'16'`, `'6 taules'`, `0`). Abans de carregar o quan l'entorn és en Fase 1, les 6 caselles de KPI mostren `'—'` i no es renderitza cap toot fictici.
2. **Contracte amb el Node 0 real al Mac mini M4 (`P1`/`P2` tancades):**
   - `ENDPOINT_NODE0_STATUS = 'https://socdepoble.cat/api/v1/node0/status'` consulta explícitament el Node 0 sobirà i valida `postgresql.ok === true`, mostrant les mètriques reals de PostgreSQL 17.11 (`PG 17.11`, `40` taules, recompte de registres, `latencyMs`, seguidors, activitats rebudes i empremta Ed25519 `f6f561a5180e9f3da8c1c6ee8064b5475232e0ce06ba645d02566903ac5e1e11`).
   - Quan es prem el botó de sincronització de Mastodon, el panell intenta llegir primer del mateix origen sobirà (`https://socdepoble.cat/api/v1/node0/mur`, on el Node 0 persisteix els 7 posts federats de `@depoble@mastodont.cat`) i cau amb seguretat a l'API pública de `mastodont.cat`, sempre amb `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `cache: 'no-store'` i `redirect: 'error'`.
3. **Geometria Pedra Seca HD, accessibilitat i `design_guard` (`P1`/`P2`/`P3` tancades):**
   - Substituïda la graella de KPI del glossari i dels toots per `.sdp-node0-glossari` i `.sdp-node0-targeta` (`grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr))`), i afegit `.sdp-node0-empremta` amb `overflow-wrap: anywhere; word-break: break-word;` perquè a 320px/375px cap targeta ni l'empremta Ed25519 desborde mai.
   - Jerarquia estricta d'encapçalaments sota `UniversalPage`: `H1 → H2 → H3 → H4` (cap `<h2>` enmig del cos; mock de prova amb `<header className="page-title">` validat per `design_guard.mjs` amb **0 crítics i 0 avisos**).
   - `FitxaNodeZeroMastodon.jsx` invoca `recolocaLaVista(contenidorRef.current, 0)` en muntar-se. Els botons d'acció usen `aria-busy` i refs de concurrència en lloc de `disabled`, preservant sempre el focus del teclat.
   - `htmlATextPla` omet els `<span class="invisible">` de Mastodon i descodifica `&amp;` en últim lloc per impedir qualsevol doble descodificació.

#### `AH-01` · Vídeo Hero al 100% d'amplària en mòbil (`src/css/components.css`)
- Mantingut en escriptori `max-height: 78vh; aspect-ratio: 9 / 16; object-fit: contain;` en `.sdp-hero-video__player`.
- Afegides les regles `:where(.sdp-root.is-compact) .sdp-hero-video__player` i `@media (max-width: 767px) .sdp-hero-video__player` amb `width: 100%; height: auto; max-height: none; object-fit: cover;` per eliminar bandes negres laterals en mòbil.

#### `AH-02` · Eliminació de la `TargetaViva` desplegada dins la columna de llista (`NotaFitxa.jsx` i `PerfilShell.jsx`)
- En `src/sections/notes/NotaFitxa.jsx` i `src/sections/profile/PerfilShell.jsx`, l'element actiu de la columna de llista es manté sempre com a fitxa compacta (`button.sdp-gestor-fitxa.is-active` amb `aria-current="true"`), ja que la previsualització de la targeta viu dins del panell desplegable «Edició avançada». Verificat amb `NotaFitxa.test.jsx` (5/5) i `PerfilShell.targetaViva.test.jsx` (8/8).

#### `AH-03` · Barra desplegable «Edició avançada» davall de la Barra Taronja + botó inferior de tancament (`UniversalEditorShell.jsx`, `NotesEditor.jsx`, `components.css`)
- En `UniversalEditorShell.jsx`, la ranura `ranuraencapcalat` («Edició avançada») es renderitza com a segon fill directe de `.sdp-editor-closca` just davall de la Barra Taronja (`bar-orange`) i abans de `.sdp-editor-closca__cos`, quedant pegada a dalt a tot l'ample sense desplaçar-se amb el text.
- En `NotesEditor.jsx`, s'ha afegit al final del panell desplegat d'«Edició avançada» un botó complet `<Boto varietat="secundari" className="sdp-edicio-avancada__boto-tancar">Tancar l’edició avançada</Boto>` (`min-height: var(--sdp-touch); width: 100%;`). Verificat amb `UniversalEditorShell.edicioAvancada.test.jsx` (31/31) i `NotesEditor.ambitEnLinia.test.jsx` (8/8).

#### `AH-04` · `IDEA-61` complet: desplegable `<Selector>` amb els 8 àmbits i «Mur» per defecte (`publicacioUniversal.js`, `BlocAmbit.jsx`, `destinsControl.js`)
- `AMBITS` en `src/utils/publicacioUniversal.js` inclou ara els **8 àmbits del Panell** en el mateix ordre: `['mur', 'mercat', 'calendari', 'mapa', 'vehicle', 'animalets', 'treball', 'habitatge']`, amb esquemes estructurats i claus d'i18n per a `calendari`, `mapa` i `animalets`.
- En `src/components/universal/ambits/BlocAmbit.jsx`, la graella de 5 targetes (`GrupOpcions`) s'ha substituït per un desplegable natiu `<Selector>` (`<select>`) dins de `<Camp etiqueta="Àmbit">`, ocupant una sola línia amb **«Mur»** seleccionat per defecte i desplegant a sota únicament els camps de l'àmbit triat.
- En `src/sections/control/destinsControl.js`, totes les 8 targetes del Panell tenen activa la porta «Publicar» (`enObres(desti) === false`). Verificat amb `publicacioUniversal.test.js` (50/50), `BlocAmbit.test.jsx` (14/14), `NotesEditor.ambit.test.jsx` (17/17), `destinsControl.test.js` (22/22), `PublicarDeLaPagina.test.jsx` (5/5) i `ControlSection.test.jsx` (40/40).

### 2. Matriu de Conformitat de Requeriments (MCR) · Carril 2 (Rondes 1–5)

| ID | Requeriment del Pla / Prompt 1636 | Estat | Evidència verificable (fitxers i tests) |
| --- | --- | --- | --- |
| **T4** | `CapcaleraConversa.jsx` enllaça a la fitxa d'origen en fils aparador (`fake-entitat:*`); `FilaConversa.jsx` preservat com a `HEAD` | **[FET]** | `CapcaleraConversa.origen.test.jsx` (21/21), `FilaConversa.test.jsx` (21/21), 150 suites de Xat (2.169/2.169) |
| **T5 / AH-05 / AH-06** | Panell i fitxa Node 0 (`https://socdepoble.cat/api/v1/node0/status`) + Pont Mastodon (`@depoble@mastodont.cat`), lectura prioritària de `feedPosts` a `/api/v1/node0/mur` sense cridar `mastodont.cat`, verificació estricta d'autoria, zero dades inventades, `design_guard` 0/0 | **[FET]** | `PanellNodeZeroMastodon.jsx`, `FitxaNodeZeroMastodon.jsx`, `FitxaNodeZeroMastodon.test.jsx` (8/8), `design_guard.mjs` (0 crítics, 0 avisos) |
| **AH-01** | Vídeo Hero al 100% d'amplària en mòbil i mode compacte sense bandes negres laterals | **[FET]** | `src/css/components.css` (línies 1435–1451) + `design_guard.mjs` PASSA |
| **AH-02** | Eliminar `TargetaViva` desplegada dins de la columna de llista de `NOTES` i `PerfilShell` | **[FET]** | `NotaFitxa.jsx` (`NotaFitxa.test.jsx` 5/5), `PerfilShell.jsx` (`PerfilShell.targetaViva.test.jsx` 8/8) |
| **AH-03** | Barra «Edició avançada» just davall de la Barra Taronja + botó gran de tancament al final del panell amb retorn de focus al `<summary>` | **[FET]** | `UniversalEditorShell.jsx`, `NotesEditor.jsx`, `UniversalEditorShell.edicioAvancada.test.jsx` (31/31), `NotesEditor.ambitEnLinia.test.jsx` (9/9) |
| **AH-04** | `IDEA-61` amb desplegable `<Selector>` dels 8 àmbits, «Mur» per defecte, 8/8 destinacions publicables a `/control` i proves adversarials >10 KB | **[FET]** | `publicacioUniversal.js` (50/50), `publicacioUniversal.adversarial.test.js` (5/5), `TargetaDelMur.ambit.test.jsx` (14/14), `BlocAmbit.jsx` (14/14), `destinsControl.js` (22/22) |
| **AH-06 (Frontissa)** | Restaurar `src/sections/text/pageContent.js` a `HEAD 9a382bdd1` i retirar-lo del Kit CAS perquè `frontissa-contingut.mjs` passe 16/16 | **[FET]** | `node tooling/gates/frontissa-contingut.mjs` (`16/16 aprovades`, exit 0) + `pageContent.versions.test.js` (42/42) |
| **i18n** | Paritat 100% als 5 diccionaris (`ca`, `es`, `en`, `eu`, `gl`) per a totes les claus de T5, AH-03 i AH-04 (72 claus noves) | **[FET]** | `src/config/idiomes/{ca,es,en,eu,gl}.js` + 68 suites `src/config/` (1.862/1.862 tests en verd) |
| **CAS v2.2.0 (Primari Congelat)** | Kit CAS executable de 39 fitxers verificat en sec contra el repositori viu (`HEAD 9a382bdd1`) | **[FET]** | `../_investigacio_ia_de_poble/261104_kit_gemini_xat_control_i_mastodon_ux/` (`[CAS OK]`) |
| **AH-07 · Rondes 9–14 (Kit Delta v1.0.0)** | Motor pur `sanejaTextFederat.js` (32 tests), verificador dels 5 Pilars Fediversity `verificadorPilarsFediversity.js` (26 tests), round-trip E2E Open Data 1.2.0 + Ed25519 (3 tests), integració 8 àmbits (4 tests), A11y AAA Xat/Control + paritat i18n 5 llengües (11 tests) | **[FET]** | `../_investigacio_ia_de_poble/261104_kit_gemini_r9_verticals_fedivers_i_xat_a11y/` (`9 fitxers nous`, `76 tests nous`, `[CAS OK]`) |

### 3. Taula Canònica de les 15 Dimensions (`D01`–`D15`) · Acreditació del Carril 2 (Ronda 5)

| Codi | Dimensió canònica | Puntuació Carril 2 (/10) | Evidència observada i límit real |
| --- | --- | --- | --- |
| **D01** | Port Neutral i Model B | **9.0 / 10** | `PanellNodeZeroMastodon.jsx` consulta `https://socdepoble.cat/api/v1/node0/status` i `/api/v1/node0/mur` sense acoblar SDK ni mutar `backendPort.js`. Límit: l'adaptador HTTP opt-in viu al carril de Codex pendent de tancar `C1-01`/`C1-02`. |
| **D02** | Pedra Seca i Geometria HD | **10 / 10** | `design_guard.mjs` PASSA (**3.120 fitxers, 0 crítics, 0 avisos**), `tractor-vocabulari.mjs` PASSA (0 classes forasteres noves), `tractor-psicopatia.mjs` PASSA (3.368 fitxers vius). Hero vídeo 100% amplària en mòbil (`AH-01`), llista de notes sense `TargetaViva` (`AH-02`), «Edició avançada» davall la Barra Taronja (`AH-03`). |
| **D03** | Accessibilitat Rural AAA | **9.5 / 10** | `teclat-superficies.mjs` PASSA (9 superfícies, 17 fitxers, 294/294 tests), jerarquia `H1 → H2 → H3 → H4`, botons amb `aria-busy` sense pèrdua de focus, desplegable `<Selector>` natiu per als 8 àmbits (`AH-04`). |
| **D04** | Sobirania i Open Data Municipal | **9.0 / 10** | Visualització fidel de PostgreSQL 17.11, 40 taules i registres reals del Node 0, amb `'—'` quan una dada no està disponible (zero dades inventades). |
| **D05** | Federació Oberta (ActivityPub, NodeInfo, WebFinger) | **9.0 / 10** | Pont amb `@depoble@mastodont.cat` que llig prioritàriament els posts federats ingerits al Node 0 (`/api/v1/node0/mur`) amb fallback net a `mastodont.cat` i validació estricta d'autoria i origen URL. |
| **D06** | Enxufabilitat Universal (WordPress.org) | **N/A (0 delta)** | Cap fitxer del connector WordPress modificat; la lectura prioritària del Node 0 evita peticions innecessàries a tercers. |
| **D07** | Replicabilitat de Nodes Germans (< 15 min) | **8.5 / 10** | Panell diagnòstic agnòstic i reutilitzable per a qualsevol node germà. |
| **D08** | Privacitat, RLS/RGPD i E2EE | **9.5 / 10** | Peticions amb `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `cache: 'no-store'`, `redirect: 'error'`, i `htmlATextPla` blindat contra injecció i doble descodificació. |
| **D09** | Sistema de Notes i Karpathy Local (OKF v0.2) | **9.5 / 10** | `AH-02`, `AH-03` i `AH-04` (`IDEA-61` amb 8 àmbits i desplegable `<Selector>`) verificats amb 100% de les suites de Notes, Editor i Àmbits en verd. |
| **D10** | Memòria Oral, Patrimoni i Multimèdia Local | **9.0 / 10** | Vídeo Hero mòbil sense bandes negres (`AH-01`) i nous àmbits estructurats de `calendari` i `mapa` (patrimoni, natura, fonts i camins). |
| **D11** | Comunicació Comunitària i Xat Rural | **9.5 / 10** | `CapcaleraConversa.jsx` resol l'origen d'entitat/grup en fils aparador (`21/21` tests) i `FilaConversa.jsx` es conserva íntegre com a `HEAD`. |
| **D12** | Multilingüisme Natiu i Traductor Sobirà | **10 / 10** | 72 claus noves amb paritat exacta als 5 diccionaris (`ca`, `es`, `en`, `eu`, `gl`); 68 suites de `src/config/` i 1.862/1.862 tests en verd. |
| **D13** | Botigues Mòbils i PWA | **9.0 / 10** | Degradació neta en Fase 1 o fora de línia i geometria responsive a 320px/375px. |
| **D14** | Governança Algorítmica, Telemetria i Consola | **10 / 10** | `npx eslint --max-warnings=0` sobre els 37 fitxers del kit: **0 errors i 0 warnings**. Eliminat l'avís de `window.scrollTo` en jsdom usant `recolocaLaVista`. |
| **D15** | Rendiment, Lleugeresa i Resiliència Rural | **9.5 / 10** | `AbortController` amb neteja en desmuntar i guàrdia de concurrència per evitar dobles peticions. |

### 4. Segellat del Kit CAS Primari v2.2.0 (`261104_kit_gemini_xat_control_i_mastodon_ux` · Congelat)

Ruta: `../_investigacio_ia_de_poble/261104_kit_gemini_xat_control_i_mastodon_ux/` (39 fitxers: 4 nous + 35 modificats sobre `HEAD 9a382bdd1`; `src/sections/text/pageContent.js` retirat i intacte a `HEAD`).

| Artefacte | SHA-256 ancorat |
| --- | --- |
| `MANIFEST.json` | `3b0a03f270bf263ac40b2e6ef1918e28e27b1cc3361e2aab9e24c9f76c32e17e` |
| `SHA256SUMS` | `a8355597c600a83cdc496f0025a0fa2bbbe4ebb4c4738b580dc3d4352d6c74cd` |
| `verifica_i_aplica.py` | `8b762b821385fab9ab7989c5a2092e1f3345fad70451007443f42977f90e5b81` |
| `README_INTEGRACIO.md` | `53f94f9835e33f1dbe67192f28b1f1d6a387c4f0b91343b44a196c1198ce5850` |

### 5. Segellat del Segon Kit CAS Delta Ortogonal v1.0.0 (`261104_kit_gemini_r9_verticals_fedivers_i_xat_a11y` · Rondes 9–14)

Ruta: `../_investigacio_ia_de_poble/261104_kit_gemini_r9_verticals_fedivers_i_xat_a11y/` (**9 fitxers nous**, **0% d'intersecció** amb els 39 fitxers del Kit `v2.2.0` i **0% d'intersecció** amb la taula `T7a` de Claude).

| Artefacte / Fitxer al Kit Delta | SHA-256 ancorat |
| --- | --- |
| `MANIFEST.json` | `cbfe12eb90b62fe3b465e8fcdbd03df2ed9206c1767f22ff919e19b5603f7534` |
| `SHA256SUMS` | `1d270dbd320a51c4a73aeeec1e42c508d96dac773068fab5f4168ebcb5d72172` |
| `verifica_i_aplica.py` | `514e74c94ab9ffeef93937bb53413edf76a2bdc66006e51cd7bb5c7fde0d11bc` |
| `README_INTEGRACIO.md` | `6236fd29d18678096bb9109d622353d4fd291dae4c3db3b9f77cd0c1420c2f3e` |
| `fitxers/src/utils/sanejaTextFederat.js` | `a0b58269c51a338c250699177533c3a8760497e02e04a52996be6f9f0b53839f` |
| `fitxers/src/utils/sanejaTextFederat.test.js` | `625a95e1d80bb960e7aadad17b0de7739c18eaf9adee5213f0c06245129ed210` |
| `fitxers/src/sections/control/verificadorPilarsFediversity.js` | `5f461812fda82636415bddcdae6fe4c992617d7ce82ede1a6a3f8bdb24bc28a4` |
| `fitxers/src/sections/control/verificadorPilarsFediversity.test.js` | `8e5a8c6c3fca706587697f4a524fb66fee0231937733e5f0e8defabca4f2a8a7` |
| `fitxers/tests/fediversity-artefactes-integritat.test.mjs` | `5fac005289dc6aafa29f4a8dfac493ea696a0b2681e19a0fc440b33913dbc08c` |
| `fitxers/src/sections/notes/PublicacioVerticals8Ambits.integracio.test.jsx` | `683398d944f9dcb917379146b0448df8d259c106e6c2c2082fffef3b2943d724` |
| `fitxers/src/sections/xat/components/CapcaleraConversa.a11y.test.jsx` | `557d1dd685ad4f05fd6abefb906d81f311022d55a5435ce45fe302f27bd07e45` |
| `fitxers/src/sections/control/PanellNodeZeroMastodon.a11y.test.jsx` | `b567455765cde38d21aad4c45d7cd8d2c50c163fafbf50fa31eb478ccb1f1a93` |
| `fitxers/src/config/i18n.fediversity.paritat.test.js` | `c2e1b9887f514bb08ddb406d5b5816c4ee2e6f20ae2be4fa9fada40310c1bf5d` |

### 6. Tancament Integral del Gauntlet G2 (`AH-08` · 38 Troballes de Claude + `G2-03` de Codex) en Rondes 15–19

| Bloc / ID | Troballa del Gauntlet G2 (`261104_1636_auditoria_claude.md:172-199` i `codex:166`) | Estat | Solució i evidència verificable al Kit CAS `v3.0.0` |
| --- | --- | --- | --- |
| **`AH-02` #1–#4 (`P1` + `3 P2/P3`)** | Eliminar `TargetaViva` i `construeixTargetaDeNota` de la vista de `PerfilShell.jsx`, conservar props `accionsRapides`/`enAccioRapida` en `NotaFitxa.jsx`, eliminar `aria-label` que oculta el text intern i cobrir els dos estats amb proves | **[TANCAT]** | `src/sections/profile/PerfilShell.jsx` (vista neta sense `TargetaViva`, `sdp:bloc-ambit` ni `<!-- sdp:fitxa`), `src/sections/notes/NotaFitxa.jsx`, `PerfilShell.targetaViva.test.jsx` (`8/8`), `NotaFitxa.test.jsx` (`5/5`) |
| **`AH-03` #1–#3 (`3 P2/P3`)** | `<details class="sdp-edicio-avancada">` col·lapsat en l'estat inicial (`open === false`), `<summary>` com a primer fill directe i retorn de focus amb `requestAnimationFrame` en prémer «Tancar l'edició avançada» | **[TANCAT]** | `src/sections/notes/NotesEditor.jsx`, `src/components/universal/UniversalEditorShell.jsx`, `UniversalEditorShell.edicioAvancada.test.jsx` (`31/31`), `NotesEditor.ambitEnLinia.test.jsx` (`9/9`) |
| **`AH-04` #1–#17 (`3 P1` + `14 P2/P3`)** | Connectar d'extrem a extrem `calendari`, `mapa` i `animalets` a les vistes destinació (`puntsDelMapa.js`, `agendaMur.js`, `MurSection.jsx`, `calendariGlobal.js`, `sections.js`, `App.jsx`, `SeccioVertical.jsx`, `detailSectionMeta.jsx`, `elementDeSeccio.js`, `ItemDetailSection.jsx`, `objecteConnectable.js`, `imatgeSocial.js`, `visibilitatTraduible.js`, `indexCerca.js`, `targetaDeResultat.js`, `sitemap.xml`) i validar enums/longituds/rangs en `coercionaValorCamp` | **[TANCAT]** | `publicacioUniversal.test.js` (`50/50`), `puntsDelMapa.test.js` (`17/17`), `agendaMur.test.js` (`25/25`), `SeccioVertical.test.jsx` (`13/13`), `qualitat.verticals.test.js` (`14/14`), `targetaDeResultat.test.js` (`7/7`), `imatgeSocial.test.js` (`9/9`), `PublicacioVerticals8Ambits.integracio.test.jsx` (`4/4`) |
| **`AH-04 i18n` #18–#22 (`5 P2/P3`)** | Eliminar les 18 claus òrfenes `ambit.*`, afegir les 64 claus de `RESERVES_I18N` (`publicacio.ambit.*`, `publicacio.camp.*`, `publicacio.opcio.*`, `publicacio.unitat.*`, `publicacio.meta.*`) + `nav.{calendari,animalets}` + `section.{mapa,animalets}.*` i actualitzar `editor.ambit.ajuda` als 5 idiomes | **[TANCAT]** | `src/config/idiomes/{ca,es,en,eu,gl}.js`, `i18n.claus.test.js` (`258/258`), `i18n.traduides.test.js` (`6/6`), `i18n.p122.reserves.test.js` (`12/12`), `i18n.fediversity.paritat.test.js` (`4/4`) |
| **`AH-05` #1–#9 + `G2-03` (`9 P2` + `G2-03`)** | Eliminar `URL_LOOKUP_MASTODON` i crides directes a `mastodont.cat`; `executaAmbAbort` envoltant tant `crida(...)` com `await resposta.json()` (`G2-03`); ignorar `AbortError` sota `<React.StrictMode>`; comprovar `!resposta?.ok` abans de `text/html` (`502` HTML -> `'sense-resposta'`); exigir autor verificat en `esAutorDepobleVerificat`; reflectir `remoteInteropVerified`, `userSessions` i `detallRegistres` per categoria | **[TANCAT]** | `src/sections/control/PanellNodeZeroMastodon.jsx`, `src/sections/control/textosNodeZeroMastodon.js`, `FitxaNodeZeroMastodon.test.jsx` (`10/10`), `PanellNodeZeroMastodon.a11y.test.jsx` (`3/3`) |

### 7. Directiva `AH-09` · Motor POSSE (`posseMastodon.js`) i Safata de Publicacions Preparades per a Mastodon amb Botó de Conformitat, Pedagogia i Simetria Universal

1. **Motor pur `src/utils/posseMastodon.js` (`posseMastodon.test.js` `5/5` en verd):**
   - **Origen canònic únic (`https://socdepoble.org`):** `resolUrlCanonicaPosse` garanteix que tota peça publicada o replicada cap a Mastodon enllace sempre a la seua fitxa canònica dins `https://socdepoble.org/...`, reconciliant qualsevol URL antiga.
   - **Filtre editorial configurable i exclusió estricta del Mercat comercial:** per defecte al pont `@depoble@mastodont.cat` s'inclouen les publicacions i esdeveniments de **Sóc de Poble** (`socdepoble`) i **El Rentonar** (`rentonar`) —amb suport immediat per afegir la **Coordinadora d'Estudis Eòlics del Comtat** (`ENTITAT_COORDINADORA_COMTAT`) o qualsevol llista d'`entitatsVinculades`—, mentre que `esProducteComercialMercat` exclou de manera taxativa qualsevol producte comercial del Mercat (`type: 'product'`, `ambit: 'mercat'`, preus o venedors com l'**Oli de La Torre / Cooperativa**).
   - **Preparació sense enviament cec (`preparaEsborranyPosse` i `construeixSafataPosse`):** genera el text del toot (`statusText` / `textTut` ≤ 490 grafemes) amb títol, resum net (`sanejaTextFederat` + `retallaTextFederat`), enllaç canònic i etiquetes (`#SocDePoble`, `#ElRentonar`), deixant la peça en estat `'preparat'` fins que una persona prem el botó de conformitat.
2. **Safata de Conformitat POSSE i Pedagogia en `PanellNodeZeroMastodon.jsx` (`FitxaNodeZeroMastodon.test.jsx` `10/10`):**
   - **Bloc pedagògic obert a qualsevol veí o col·lectiu:** explica en llenguatge planer: (1) què és Mastodon (`mastodont.cat`, xarxa social lliure i federada sense anuncis ni algoritmes on qualsevol veí o associació es pot obrir un compte gratuït), (2) què fa el botó **«Confirmar i publicar a Mastodon»** (revisar la peça ja preparada amb el seu enllaç a `https://socdepoble.org` i autoritzar-ne l'enviament sense automatismes cecs), i (3) la **Simetria Universal** (com aquesta mateixa passarel·la que avui agrupa **Sóc de Poble** i **El Rentonar** —i oberta a la **Coordinadora d'Estudis Eòlics del Comtat**— oferix la mateixa possibilitat a qualsevol usuari o entitat de Sóc de Poble amb compte a Mastodon).
   - **Botó «Confirmar i publicar a Mastodon»:** envia `POST https://socdepoble.cat/api/v1/node0/mastodon/publish` amb `humanApproved: true` dins d'`executaAmbAbort` (incloent `await resposta.json()`), preserva el focus amb `aria-busy="true"` i marca la peça com a **«Publicat a Mastodon»**.

### 8. Directiva `AH-10` · Estudi de Càtedra Doctoral sobre l'Arquitectura i el Codi Lliure de Mastodon (`AGPLv3`) vs. Sóc de Poble + Pla d'Implementació d'Autopia d'Usuari

#### 8.1. Dissecció Arquitectònica de Mastodon (`mastodon/mastodon`, AGPLv3) i Comparativa Sistemàtica amb Sóc de Poble (10 Eixos)

| Eix d'Enginyeria | Arquitectura interna de Mastodon (`AGPLv3` · Ruby on Rails + Sidekiq + PostgreSQL + Streaming/React) | Estat actual en Sóc de Poble (`Pedra Seca` + `Supabase/PostgreSQL` + `Node 0 Mac mini M4`) | Bretxa exacta i patró reusable per a l'Autopia d'Usuari en Sóc de Poble |
| --- | --- | --- | --- |
| **1. Identitat, perfil i descoberta (`Account`, WebFinger, `acct`, camps verificats `rel="me"`, `movedTo` / `alsoKnownAs`)** | Taula `accounts` amb parell RSA/Ed25519 per actor, `fields` JSONB (fins a 4 parells clau/valor verificats per comprovació HTTP de `<link rel="me">` o `<a rel="me">`), `Discoverable`/`Indexable`, resolució `/.well-known/webfinger` (`acct:user@domain`) i migració de compte amb `Move` Activity + `alsoKnownAs`. | `PerfilShell.jsx` gestiona fitxa pública i apartats d'usuari/entitat; `tooling/seo/genera-federacio.mjs` i el Node 0 servixen WebFinger/Actor per a `@depoble@socdepoble.cat` i paquets Open Data municipals. | **Bretxa:** Falta el camp d'identitat federada vinculada (`mastodon_acct`, `external_actor_uri`, `rel_me_verified_at`) en cada perfil d'usuari o entitat (`PerfilShell.jsx`) i la generació automàtica d'`<a rel="me" href="https://mastodont.cat/@...">` a la fitxa pública de `socdepoble.org` perquè Mastodon pinte el tic verd de verificació de domini. |
| **2. Composició i publicació (`Status`, `SpoilerText`/CW, visibilitat, idioma ISO-639-1, adjunts amb `description` A11y, enquestes, fils i edició amb historial)** | Model `statuses` amb `visibility` (`public`, `unlisted`, `private`, `direct`), `spoiler_text` (Content Warning), `language`, adjunts `media_attachments` amb `description` (alt-text) i `focus` (`x,y` focal point), `polls` i `status_edits` (versions auditables d'un post editat). | `UniversalEditorShell.jsx` + `NotesEditor.jsx` + `BlocAmbit.jsx` (8 àmbits estructurats, `sanejaTextFederat.js` amb `normalitzaAvisContingutFederat` i historial CRDT/versions en `pageContent.versions`). | **Bretxa:** Incorporar dins el panell «Edició avançada» (`NotesEditor.jsx`) el camp opcional d'«Avís de contingut (CW) per al Fedivers», el text alternatiu obligatori (`alt`) en exportar imatges a Mastodon i la propagació d'`Update(Note)` quan una peça ja publicada a Mastodon s'actualitza a `socdepoble.org`. |
| **3. Cronologies i distribució (`Home`, `Local`, `Federated`, llistes, hashtags, marcadors i fixats `Pinned`)** | `FeedManager` precalcula cronologies en Redis per a `Home` i llistes, i llig de PostgreSQL amb paginació `max_id`/`since_id` (keyset pagination sobre Snowflake IDs) per a `Local`, `Federated`, `Bookmarks` (`bookmarks`) i `StatusPin` (fins a 5 posts fixats al perfil). | `MurSection.jsx`, `SeccioVertical.jsx` (6 verticals especialitzades: Mercat, Esdeveniments, Calendari, Mapa, Animalets, Pobles) i `indexCerca.js` amb filtre per àmbit i poble. | **Bretxa:** Afegir la capacitat de «Fixar a dalt de la pàgina/perfil» (`pinned_at`) fins a 3 publicacions destacades en `PerfilShell` / `PageDetailSection` i una vista de «Guardats / Marcadors» local/sincronitzada. |
| **4. Interacció social i conversació (respostes en arbre, `Reblog`/impulsos, `Favourite`, mencions i cites)** | Activitats ActivityPub `Create(Note)` amb `inReplyTo`, `Announce` (impuls/reblog), `Like` (favorit) i `Mention`, amb comptadors desnormalitzats en `status_stats` (`replies_count`, `reblogs_count`, `favourites_count`). | `XatSection` (converses comunitàries estil WhatsApp vinculades a entitats i fitxes amb `CapcaleraConversa.jsx`) i lectura dels toots de `@depoble@mastodont.cat` en `PanellNodeZeroMastodon.jsx`. | **Bretxa:** Mostrar al peu de cada notícia/acte de `socdepoble.org` que haja estat replicat a Mastodon (`mastodon_url`) l'enllaç «Conversar i respondre al Fedivers (`@depoble@mastodont.cat`)» i, opcionalment, els comptadors d'impulsos/respostes verificats pel Node 0. |
| **5. Seguretat d'usuari, privadesa i moderació (`Block`, `Mute`, filtres de paraules v2, informes `Flag` i caducitat automàtica)** | Taules `blocks`, `mutes`, `custom_filters` (v2 amb contextos `home`, `notifications`, `public`, `thread` i acció `warn`/`hide`), `domain_blocks` i `reports` (activitat `Flag` d'ActivityPub), més retenció/esborrat automàtic d'estats antics (`StatusRetentionPolicy`). | `sanejaTextFederat.js` (neutralització Bidi, purga de surrogats, validació d'URI i d'actor), `esAutorDepobleVerificat` i `visibilitatTraduible.js` + camp privat `contacte` exclòs de cerca i de targetes públiques. | **Bretxa:** Afegir un filtre de silenciament per paraules/dominis configurable per l'usuari en `/control` i política de retenció de memòria cau federada al Node 0 (`federated_posts`). |
| **6. Notificacions i temps real (WebPush VAPID, SSE Streaming API i agrupació)** | Taula `notifications` amb agrupació (`group_key`), filtre per relació (només seguits, mencions) i entrega en temps real per Server-Sent Events (`/api/v1/streaming`) o WebPush (`Web::PushSubscription`). | `PanellNodeZeroMastodon.jsx` i `ControlSection.jsx` amb consulta sota demanda (`pull`) i safata de conformitat POSSE. | **Bretxa:** Quan el Node 0 rep una menció o seguidor nou a l'inbox ActivityPub (`/ap/inbox`), registrar-ho com a avís intern consultable a la Safata de Control sense requerir connexions permanents en segon pla que gasten bateria rural. |
| **7. Sobirania de dades i portabilitat (exportació/importació CSV de seguits, bloquejos i marcadors + arxiu ActivityStreams)** | Exportació asíncrona d'arxiu complet ActivityStreams (`.tar.gz` amb `actor.json`, `outbox.json`, adjunts) i exportació/importació CSV de `following_accounts.csv`, `lists.csv`, `blocking_accounts.csv`, `bookmarks.csv`. | Paquet Open Data Municipal `1.2.0` (`exportaMunicipiOpenData` / `importaMunicipiOpenData` amb round-trip SHA-256 idèntic, `data/agenda.ics`, `data/okf/` i edició CRDT en OPFS/carpeta local). | **Bretxa:** Sóc de Poble ja supera Mastodon en portabilitat estructurada territorial (Open Data 1.2.0 + CRDT Markdown + `agenda.ics`). El pas següent és permetre que cada usuari o entitat exporte també la seua configuració de pont POSSE i el registre d'enviaments (`posse_manifest.json`). |
| **8. Motor de federació i cues resilients (HTTP Signatures / RFC 9421, `Inbox`/`Outbox`, `SharedInbox` i reintents exponencials)** | Cues Sidekiq separades (`ingress`, `push`, `pull`, `mailer`), deduplicació per `uri`, lliurament a `sharedInbox` per reduir $O(N)$ peticions a $O(\text{servidors})$ i calendari de reintents exponencials amb circuit-breaker (`DeliveryFailureTracker`) per a servidors caiguts. | Node 0 al Mac mini M4 (`node0-soberania`) amb PostgreSQL 17.11 (40 taules), firma `rfc9421-ed25519` i endpoints `/api/v1/node0/status`, `/api/v1/node0/mur`, `/api/v1/node0/mastodon/preparades` i `/api/v1/node0/mastodon/publish`. | **Bretxa:** Persistir la cua POSSE en una taula PostgreSQL `posse_publications_queue` al Node 0 amb clau d'idempotència (`Idempotency-Key: sdp:<entity_id>:<item_id>`), estats (`prepared`, `approved`, `publishing`, `published`, `failed_retryable`) i `sharedInbox` per a seguidors ActivityPub. |
| **9. Accessibilitat i internacionalització (teclat, reducció de moviment, alt-text i 5 llengües)** | Dreceres de teclat (`?`), mode d'animació reduïda (`reduce_motion`), avís d'imatges sense alt-text i localització amb `react-intl`. | **Pedra Seca AAA Rural:** 28px/1.5 cos, tap targets ≥ 48px, `teclat-superficies.mjs` (294/294 tests), `aria-busy` sense pèrdua de focus, `<details>` d'Edició Avançada amb retorn de focus al `<summary>`, i paritat 100% en 5 llengües peninsulars i internacionals (`ca`, `es`, `en`, `eu`, `gl`). | **Fortalesa diferencial de Sóc de Poble:** L'accessibilitat rural AAA i la geometria Pedra Seca són més estrictes i llegibles per a gent major que la interfície multicolumna densa de Mastodon; cal mantindre el mateix patró d'un sol clic de conformitat (`PanellNodeZeroMastodon.jsx`). |
| **10. Model d'Autoria i Simetria Universal Multi-Entitat / Multi-Usuari (Pont POSSE Sobirà)** | En Mastodon, cada compte és un silo individual dins una instància; per gestionar una revista, un ajuntament i una associació cultural cal obrir comptes separats o compartir contrasenyes. | En Sóc de Poble, `construeixSafataPosse(items, { entitatsVinculades, targetAccount })` desacobla l'**origen d'autoria** (`socdepoble`, `rentonar`, `coordinadora-comtat`, o qualsevol veí) del **compte destí de Mastodon** (`@depoble@mastodont.cat` o `@usuari@mastodont.cat`). | **Innovació pròpia de Sóc de Poble:** Permetre que des d'una mateixa arquitectura unificada tant el pont col·lectiu `@depoble@mastodont.cat` (que agrupa **Sóc de Poble** i **El Rentonar** excloent el Mercat comercial) com qualsevol usuari o entitat del poble vinculen el seu propi compte de Mastodon amb les seues regles de filtre i el mateix botó de conformitat. |

#### 8.1.2. Correspondència Directa amb els 10 Apartats del Menú de Configuració d'Usuari de Mastodon (`AH-10` línies 190–200)

1. **`Perfil` (Metadades clau-valor, verificació `rel="me"`, capçalera/avatar, biografia i `discoverable`/`indexable`):** Sóc de Poble ho allotja en `PerfilShell.jsx` i a la fitxa d'entitat; en Fase B afegirem els 4–8 parells clau-valor verificables amb `<a rel="me">` i l'interruptor sobirà de presència al directori comunitari.
2. **`Privacitat i arribar` (Abast per defecte `public`/`unlisted`/`followers`/`direct`, aprovació de seguidors, graf social i indexació IA/cercadors):** Sóc de Poble ja controla la visibilitat en `UniversalEditorShell.jsx` / `visibilitatTraduible.js` i la privadesa de connexions en `PerfilShell.jsx` (`section.perfil.connexions.visibilitat`); s'ampliarà amb l'selector d'abast federat i l'etiqueta `noindex`/`noai` per perfil.
3. **`Preferències` (Idioma d'interfície vs. publicació, avisos de contingut `CW`, reducció d'animacions i alta llegibilitat rural):** Sóc de Poble ja lidera en llegibilitat rural (`Pedra Seca` 28px/1.5, 5 idiomes `ca`/`es`/`en`/`eu`/`gl` i `normalitzaAvisContingutFederat` en `sanejaTextFederat.js`).
4. **`Seguits i seguidors` (Graf social, llistes temàtiques/veïnals i notes privades sobre comptes):** Sóc de Poble disposa de connexions mútues/entrants/sortints i vinculació a entitats (`section.perfil.connexions.*`); s'hi afegiran llistes veïnals (*Bàndols*, *El Rentonar*, *Comtat*).
5. **`Filtres` (Filtres per context Mur/Notificacions/Converses/Perfils amb caducitat i acció `warn`/`hide`):** S'incorporarà al panell `/control` un motor local/sincronitzat de filtres per paraula o etiqueta amb data de caducitat.
6. **`Esborrat automàtic de tuts` (Retenció temporal i Oblit Saludable protegint fixats, memòria històrica i marcadors):** Regla d'autoesborrat o arxivat per a avisos efímers (vehicles compartits passats, ofertes puntuals) blindant sempre les cròniques històriques d'*El Rentonar*, *Sóc de Poble* i les peces fixades.
7. **`Compte` (Sessions actives revocables, 2FA/Passkeys i migració ActivityPub `Move` + `alsoKnownAs`):** Dissenyat sobre les taules d'identitat del Node 0 perquè cap veí ni poble quede mai captiu d'un domini.
8. **`Importació i exportació` (CSV + ActivityPub JSON + ZIP Open Data 1.2.0 + Motor POSSE `AH-09`):** Sóc de Poble combina el paquet `Open Data 1.2.0` (`exportaMunicipiOpenData` amb round-trip SHA-256) amb la Safata POSSE (`posseMastodon.js`) per importar des de WordPress/Blogger i replicar cap a Mastodon amb conformitat.
9. **`Convidar persones` (Enllaços d'invitació comunitària amb límit d'usos, caducitat i poble/entitat preassignats):** Flux d'onboarding d'un sol clic per a veïns i socis d'associacions com *El Rentonar*.
10. **`Desenvolupament` (Aplicacions, tokens amb àmbits `read`/`write`/`follow`/`push`, webhooks i API Node 0):** El Node 0 manté les credencials OAuth de Mastodon aïllades a `/Users/javi/.config/socdepoble/node0.env` (`0600`) i exposa a la web únicament els endpoints segurs `/api/v1/node0/*`.

#### 8.2. Pla d'Implementació d'Autopia d'Usuari en 4 Fases (Sense Deute Tècnic)

1. **Fase A (COMPLETADA EN RONDA 19–20 · Safata POSSE amb Conformitat Humana i Simetria Multi-Entitat):**
   - Motor pur `src/utils/posseMastodon.js` amb filtre d'entitats vinculades (`Sóc de Poble` + `El Rentonar`, preparat per a `Coordinadora d'Estudis Eòlics del Comtat` i per a qualsevol usuari), exclusió estricta de productes comercials del Mercat (oli, etc.), generació de toot ≤ 490 grafemes amb URL canònica `https://socdepoble.org/...` i Safata de Conformitat POSSE amb bloc pedagògic i botó **«Confirmar i publicar a Mastodon»** en `PanellNodeZeroMastodon.jsx`.
2. **Fase B (Vinculació de Compte Mastodon per Usuari/Entitat en `PerfilShell` + Verificació `<a rel="me">`):**
   - Afegir a la configuració d'usuari i d'entitat (`PerfilShell` / `/control`) el camp «Compte de Mastodon vinculat» (ex. `@nom@mastodont.cat`) i «Entitats/Àmbits que vull preparar a la meua safata POSSE» (excloent sempre o segons preferència el Mercat comercial), emitant `<a rel="me" href="https://mastodont.cat/@...">` a la fitxa pública de `socdepoble.org` per obtenir verificació verda automàtica a Mastodon.
3. **Fase C (Persistència d'Idempotència POSSE a PostgreSQL 17.11 del Node 0 i Replicació d'Històric WordPress/Blogger):**
   - Taula `posse_publications` al Node 0 (`item_id`, `entity_id`, `canonical_url`, `target_account`, `status_text`, `external_status_id`, `mastodon_url`, `approved_by`, `published_at`) amb capçalera `Idempotency-Key` cap a l'API de Mastodon per importar i replicar pas a pas (i sempre amb conformitat humana per lots o peça a peça) l'arxiu històric de *Sóc de Poble*, *El Rentonar* i *Coordinadora d'Estudis Eòlics del Comtat*.
4. **Fase D (Conversa Bidireccional Verificada i Enllaç «Respondre al Fedivers» a cada Fitxa Canònica):**
   - Mostrar a cada fitxa de `socdepoble.org` que tinga `mastodon_url` registrat un bloc net «Aquesta publicació també batega al Fedivers (`mastodont.cat`)» amb enllaç directe al toot i lectura opcional de respostes públiques verificades a través de la memòria cau del Node 0 (zero crides directes del navegador a tercers).

### 9. Directiva `AH-11` · Arquitectura de Resiliència Rural 3-2-1 en `PanellNodeZeroMastodon.jsx` (Mac mini M4 + Time Machine + Mirall Navegable als 20 TB de Google Workspace Drive)

1. **Normalització honesta del bloc `resilience` de `/api/v1/node0/status` (`normalitzaEstatNode0`):**
   - Extrau `localTimeMachine`, `workspaceMirrorConfigured`, `lastMirrorSnapshotAt` i `mirrorIntegrityOk` sense filtrar cap ruta privada del sistema ni inventar dades quan el servidor no les envia.
2. **Visualització de les 3 Capes de Resiliència Rural 3-2-1 (`data-resiliencia="3-2-1"` en `PanellNodeZeroMastodon.jsx` i traducció als 5 idiomes `ca`/`es`/`en`/`eu`/`gl`):**
   - **Capa 1 · Node 0 Sobirà al Mac mini M4 (`socdepoble.cat` · PostgreSQL 17):** motor principal a la casa del poble amb recuperació automàtica quan torna el corrent.
   - **Capa 2 · Còpia Física Local (Time Machine):** còpia diferencial contínua en disc físic local connectat al Mac mini M4.
   - **Capa 3 · Mirall Navegable als 20 TB de Google Workspace Drive:** detalla les 5 carpetes de l'arxiu atòmic i navegable (`01_Publicacions_i_Croniques`, `02_Multimedia_i_Patrimoni`, `03_Paquets_OpenData_Municipals`, `04_Snapshots_PostgreSQL` amb `pg_dump` i `05_Recepta_Restauracio_Node0` sense secrets en pla), mostra l'indicador d'última còpia verificada i explica que, si salta la llum a casa (microones i forn), `socdepoble.org` continua en línia i tota la informació roman consultable directament des de Google Drive.
   - Verificat amb el nou test d'`AH-11` en `FitxaNodeZeroMastodon.test.jsx` (`11/11` en verd).

### 10. Segellat del Kit CAS Unificat `v3.0.0` (`261104_kit_gemini_xat_control_i_mastodon_ux` · Rondes 1–20 + `AH-11`)

Ruta: `../_investigacio_ia_de_poble/261104_kit_gemini_xat_control_i_mastodon_ux/` (**71 fitxers**: **15 creats nous** + **56 modificats** sobre `HEAD 9a382bdd1`).

| Artefacte | SHA-256 ancorat (`v3.0.0` amb `AH-11`) |
| --- | --- |
| `MANIFEST.json` | `68d1bcc82d1a324279bb98ee9dc8460df4ba0c506b585e614946d1df8c85162a` |
| `SHA256SUMS` | `4ae34fe4c3295a85e6ef9a8219591d93817c3ed959ed1447b9957ac771dcc04e` |
| `verifica_i_aplica.py` | `8b762b821385fab9ab7989c5a2092e1f3345fad70451007443f42977f90e5b81` |
| `README_INTEGRACIO.md` | `e9e42f4efba0228b1a507f168476595a87bbd9f1f7930944923f5a3f51b9fe35` |

### 11. Directiva `AH-12` + Compte Institucional Canònic `socdepoble@socdepoble.org` · Kit CAS Delta Ortogonal (`261104_kit_gemini_r21_autopia_usuari_mastodon_i_mirall_workspace` · Rondes 21 a 25 sobre `HEAD 8f4559b3b`)

Mentre Claude (Carril 3) completa la fusió a tres bandes del Kit `v3.0.0` (`261104_kit_gemini_xat_control_i_mastodon_ux`, 71 fitxers, mantingut **100% congelat i intocable**), s'han executat i verificat les **Rondes 21 a 25** en 8 fitxers nous amb **0% d'intersecció** amb `v3.0.0`, incorporant el compte institucional canònic **`socdepoble@socdepoble.org`** (`acct:socdepoble@socdepoble.org`, remitent transaccional del Node 0 i propietari de `Sóc de Poble · Mirall Sobirà Node 0/` als 20 TB de Google Workspace Drive):

1. **Ronda 21 (`src/utils/identitatFederadaRelMe.js` + `src/utils/identitatFederadaRelMe.test.js` · `3/3` tests en verd):**
   - Constants institucionals `COMPTE_INSTITUCIONAL_CANONIC = 'socdepoble@socdepoble.org'`, `WEBFINGER_INSTITUCIONAL_CANONIC = 'acct:socdepoble@socdepoble.org'` i `DESCRIPTOR_IDENTITAT_INSTITUCIONAL_SOCDEPOBLE` (vinculat amb `socdepoble@socdepoble.cat` i `@depoble@mastodont.cat`).
   - Verificador pur en temps lineal $O(N)$ de reciprocitat `<a rel="me">` / `<link rel="me">` (`verificaReciprocitatRelMe`, inspirat en `VerifyAccountLinksService` de Mastodon) i configurador de pont multi-entitat/multi-usuari (`configuraPontMastodonUsuari`).
2. **Ronda 22 (`src/utils/politicaRetencioIFiltresUsuari.js` + `src/utils/politicaRetencioIFiltresUsuari.test.js` · `2/2` tests en verd):**
   - Motor pur de `CustomFilter` v2 per superfície (`mur`, `notificacions`, `converses`, `perfils`, `fedivers`) amb caducitat `expires_at` i motor d'**Oblit Saludable Rural** (`avaluaRetencioPublicacio`) que caduca avisos efímers ja passats però blinda (`maiEsborrar: true`) tot el patrimoni històric de *Sóc de Poble*, *El Rentonar* i *Coordinadora*, publicacions fixades i marcadors.
3. **Ronda 23 (`src/utils/mirallWorkspaceResiliencia.js` + `src/utils/mirallWorkspaceResiliencia.test.js` · `5/5` tests en verd):**
   - Generador determinista de l'arbre navegable dels 20 TB de Google Workspace Drive sota el compte propietari `socdepoble@socdepoble.org` i carpeta arrel `Sóc de Poble · Mirall Sobirà Node 0/` (`01_Publicacions_i_Croniques`, `02_Multimedia_i_Patrimoni`, `03_Paquets_OpenData_Municipals`, `04_Snapshots_PostgreSQL`, `05_Recepta_Restauracio_Node0` i `INDEX_MIRALL_GOOGLE_DRIVE.md`) + auditor `auditaSecretsMirall` que bloqueja qualsevol filtració de secrets (`MASTODON_ACCESS_TOKEN`, `Bearer`, claus privades PEM o URI de PostgreSQL amb contrasenya).
4. **Ronda 24 (`src/utils/reconciliadorHistoricPosse.js` + `src/utils/reconciliadorHistoricPosse.test.js` · `2/2` tests en verd):**
   - Reconciliador d'URLs antigues de Blogger/WordPress (`elrentonar.blogspot.com`, `*.wordpress.com`) cap a `https://socdepoble.org/...` i classificador de l'històric (`ja_publicat_canonic`, `publicat_amb_url_antiga`, `preparat_pendent`) amb exclusió automàtica del Mercat comercial (oli, etc.) i generació de la Safata POSSE amb Botó de Conformitat Humana.
5. **Ronda 25 (Segellat del Kit CAS Delta Ortogonal `261104_kit_gemini_r21_autopia_usuari_mastodon_i_mirall_workspace` sobre `HEAD 8f4559b3b`):**
   - Ruta: `../_investigacio_ia_de_poble/261104_kit_gemini_r21_autopia_usuari_mastodon_i_mirall_workspace/` (**8 fitxers nous creats**, `0` modificats, **0% d'intersecció amb `v3.0.0`**, purgat `R21-SEC-01` amb canari `TEST_ONLY_SECRET_CANARY_`).
   - `MANIFEST.json` SHA-256: `71bb161099cecee2d6edf9a36bb11734432fbc64e8be3b90248ecd49a4e78369`
   - `SHA256SUMS` SHA-256: `ad783023afb5e7c1ec07bd16bc67b32ee22c5f6c0a273ea0a2b732cbca043a50`
   - Verificació: `[CAS OK] 261104_kit_gemini_r21_autopia_usuari_mastodon_i_mirall_workspace (8 fitxers) -> VERIFICAT (DRY-RUN)`, Vitest `4/4` suites (`12/12` tests en verd) i `npx eslint --max-warnings=0` amb `0 errors, 0 warnings`.

### 12. Directiva `AH-13` / `P2-18` · Kit CAS Delta Editorial de les Fites del 04-11-2026 en 5 Llengües (`261104_kit_gemini_r26_actualitzacio_editorial_fites_261104` · Rondes 26 a 30)

S'ha construït i segellat el catàleg editorial estructurat `src/data/fitesArquitectura261104.js` (+ `src/data/fitesArquitectura261104.test.js`) amb paritat 100% verificada en els **5 idiomes oficials (`ca`, `es`, `en`, `eu`, `gl`)**, estructura canònica `H1 → H2 → entradeta → H3`, zero llatinismes i enllaços canònics verificats per a les 4 grans cròniques d'actualització del 04-11-2026:
1. **`verticals-8-ambits`:** Les 8 verticals de publicació des de `/control` i `/notes` (`Mur`, `Mercat`, `Calendari` multi-dia com els Cursos de Pedra en Sec, `Mapa`, `Vehicle Compartit`, `Animalets`, `Treball` i `Habitatge`), acordió d'«Edició avançada» davall de la barra taronja i pàgines explicatives de «Saber-ne més».
2. **`node0-resiliencia-321`:** El Node 0 Sobirà (`socdepoble.cat`) amb PostgreSQL 17.11 al Mac mini M4 i la Resiliència Rural 3-2-1 (Capa 1: Mac mini M4; Capa 2: Time Machine local; Capa 3: Mirall Navegable als 20 TB de Google Workspace Drive sota `socdepoble@socdepoble.org` a `Sóc de Poble · Mirall Sobirà Node 0/`).
3. **`posse-mastodon-simetria`:** L'estratègia POSSE amb `@depoble@mastodont.cat` i `acct:socdepoble@socdepoble.org`, Sóc de Poble com a origen canònic únic (de *Sóc de Poble*, *El Rentonar* i *Coordinadora*), la Safata de Conformitat amb exclusió del Mercat comercial (oli, etc.) i la Llei de Simetria Universal per a qualsevol veí.
4. **`autopia-usuari-estudi-mastodon`:** L'Autopia d'Usuari inspirada en l'Estudi de Càtedra Doctoral de Mastodon (`AGPLv3`): verificació descentralitzada `rel="me"`, filtres per superfície amb caducitat i Oblit Saludable Rural que blinda el patrimoni històric.
- **Ruta del Kit CAS Delta Editorial:** `../_investigacio_ia_de_poble/261104_kit_gemini_r26_actualitzacio_editorial_fites_261104/` (**2 fitxers nous**, **0% d'intersecció amb `v3.0.0`, `r9` i `r21`**).
- `MANIFEST.json` SHA-256: `343fb499a2b3464632001d12a70de92c2d9ea670f20ffa8dcb28ec9d3476987d`
- `SHA256SUMS` SHA-256: `15101867bf1f4498f9aa0c86c8f6ab3b052e18ca8c7060d6bca9c8f10c4e3470`
- Verificació: `[CAS OK] 261104_kit_gemini_r26_actualitzacio_editorial_fites_261104 (2 fitxers) -> VERIFICAT (DRY-RUN)`, Vitest `3/3` tests en verd i `npx eslint --max-warnings=0` amb `0 errors, 0 warnings`.

### 13. Marató `AH-14` + `AH-15` + `AH-16` · Liquidació Total del Deute Tècnic Residual del Llibre Mestre i Unificació `UniversalWorkspace` (`261104_kit_gemini_r31_liquidacio_deute_llibre_mestre` · Rondes 31 a 48 sobre `HEAD 4ab2d1527`)

Dins de l'espai de treball aïllat `/tmp/sdp-gemini-r31-llibre-mestre/` rebasat byte a byte sobre l'`HEAD` actual del repositori viu (`4ab2d1527a05866ebb13af43697a0c4beffba591`), s'han executat i verificat les **18 rondes (`R31` a `R48`)** sense deixar cap mòdul sense consumidor i amb preimatges `source_sha256` 100% exactes:

1. **Ronda 31 (`R21-ARCH-02` · Zero Codi Mort en `identitatFederadaRelMe.js` i `politicaRetencioIFiltresUsuari.js`):**
   - Connectat `identitatFederadaRelMe.js` a `src/sections/profile/PerfilPublicSection.jsx` (`PerfilPublicSection.test.jsx` 11/11) per emetre `<a rel="me" href="...">` verificats en la fitxa pública i el compte institucional canònic `socdepoble@socdepoble.org` / `@depoble@mastodont.cat`.
   - Connectat `politicaRetencioIFiltresUsuari.js` a `src/sections/profile/DetallPrivacitat.jsx` (`DetallPrivacitat.test.jsx` 4/4) per mostrar i verificar la regla d'**Oblit Saludable Rural** que blinda sempre (`maiEsborrar: true`) el patrimoni històric de *Sóc de Poble*, *El Rentonar* i *Coordinadora*, les publicacions fixades i els marcadors.
2. **Ronda 32 (`P0-24b` · `ARB-T2C-01` i `ARB-T2C-02`) i Ronda 33 (`P1-73` · `ARB-T3-01` / `D-T3-1`):**
   - Verificats en verd sobre la base `4ab2d1527` (`Bombolla.enrere.test.jsx` 5/5, `CapcaleraConversa.enrere.test.jsx` 4/4, `workspaceState.test.js` 25/25 i `NotesSection.usabilitat.test.jsx` 20/20).
3. **Ronda 34 (`P1-71` · Blindatge HMR de `SessionContext.jsx` i `IdentitatContext.jsx`):**
   - Extracció de `createContext` a mòduls interns purs (`src/app/contexts/sessionContextIntern.js` i `src/app/contexts/identitatContextIntern.js`) i suite `src/app/contexts/SessionContext.hmr.test.jsx` (2/2 tests en verd).
4. **Rondes 35 i 36 (`P1-22` · Liquidació dels Residus d'i18n en les 5 Llengües `ca`, `es`, `en`, `eu`, `gl`):**
   - Internacionalitzats els 27 fitxers del Bloc A i Bloc B (Notes, Classificació, Perfil, Pobles, Onboarding, Admin, Disseny, Wiki de Poble, PageFrame, Dialeg, CalendariMes, UniversalListCard) i afegits els **69 fitxers nets** a `src/config/i18n.p122.test.js` (`377/377` tests en verd) amb `src/config/i18n.usades.test.js` (`6/6`) i `src/config/i18n.fediversity.paritat.test.js` (`4/4`).
5. **Ronda 37 (`P1-12` · `D-M02-2` en `AvisClauCanviada.jsx`):**
   - Quan l'autor de l'avís E2EE ja no figura a `nomsMembres`, resol el nom de reserva traduït (`section.xat.e2ee.membreAnterior`, `'un membre anterior'`) en compte d'ometre l'avís en silenci (`AvisClauCanviada.test.jsx` 13/13).
6. **Ronda 38 (`P1-28` · `PS-07` Un Sol Botó Primari per Vista a `/pobles/:id`):**
   - Els botons de les targetes del directori a `src/sections/pobles/PublicacionsDelPoble.jsx` passen a `varietat="secundari"` perquè només el CTA principal de la vista porte `varietat="primari"` (`PoblesSection.test.jsx` 18/18).
7. **Ronda 39 (`IDEA-72` · Safari/iOS `-webkit-autofill` en `ControlContrasenya.jsx` + Plantilla Multilingüe de Correu de Benvinguda):**
   - Afegit `onAnimationStart` (`onAutoFillStart`) + CSS `@keyframes onAutoFillStart` per sincronitzar l'estat en Safari/iOS (`ControlContrasenya.test.jsx` 3/3) i creada `src/data/plantillesCorreu/benvingudaVerificacio.js` amb remitent canònic `socdepoble@socdepoble.org` en 5 llengües (`benvingudaVerificacio.test.js` 6/6).
8. **Ronda 40 (`IDEA-73` · Sincronització Reactiva Universal d'`aliesDeLaFitxa` i `aliesDeLActor`):**
   - Unificats els àlies d'actor/entitat (UUID, slug, handle i claus fundacionals) a `src/data/identitatsSeed.js`, `src/sections/profile/usePublicacionsDeLaFitxa.js`, `src/sections/mur/PublicacionsDeLActor.jsx` i `src/sections/mur/TargetaDelMur.jsx` (`sincronitzacioAliesActor.test.js` 3/3).
9. **Ronda 41 (`P1-01` Fase E · Modificadors Multi-Grup `D-6` al Mode Bar i `configMode.desplacament` al Mode Rebost):**
   - Ampliat `vestits.js`, `Tpv.jsx` i `Caixa.jsx` amb grups múltiples de modificadors (`Cocció`, `Guarnició`, `Salsa`) i afegit el commutador `configMode.desplacament` (`'truncat'` / `'embolicat'`) a `rebost.js` i `UniversalListCard.jsx` (`vestits.test.js` 32/32, `rebost.desplacament.test.js` 6/6).
10. **Ronda 42 (`P1-23` · `ARB-M13-04` Tres Estats `nova` / `en_curs` / `feta` a `ap-inbox-verifica`):**
    - Implementada la màquina de 3 estats a `supabase/functions/ap-inbox-verifica/gestor.js`, `magatzemPostgrest.js` i `src/data/federacio/inboxActivityPub.js` per permetre reintent segur si l'execució cau abans de completar l'efecte (`gestor.test.js` 19/19, `inboxActivityPub.test.js` 23/23).
11. **Ronda 43 (`P2-18` / `AH-13` · Connexió Viva de `fitesArquitectura261104.js` amb `/versions`):**
    - Creat `src/sections/text/CroniquesFites261104.jsx` (`CroniquesFites261104.test.jsx` 2/2) i connectat a `/versions` des de `src/app/App.jsx`, respectant íntegrament `src/app/App.fedivers.test.jsx` del commit `4ab2d1527`.
12. **Ronda 44 (`P1-11` / `P1-68` / `P2-10` · Sincronització `70/70` de `supabase/README.md`):**
    - Actualitzat el recompte canònic de migracions a `70` i documentades les files 53, 55, 56 i 59 a `supabase/README.md` (`verifica-migracions.test.mjs` 8/8).
13. **Ronda 45 (`AH-15` · Previsualització de la Card DINS d'«Edició avançada» sota la Barra Taronja + Zero `TargetaViva` a la Columna de Llista):**
    - Afegida la ranura `previsualitzacioTargeta` (`data-sdp-ranura="targeta-viva"`) dins de `.sdp-edicio-avancada__cos` a `UniversalEditorShell.jsx` i connectada a `TargetaViva` en `PerfilEditor.jsx`, mantenint la columna `APARTATS` i `NOTES` 100% amb files compactes `DefaultItemCard` (`UniversalEditorShell.edicioAvancada.test.jsx` 34/34, `PerfilEditor.logotip.test.jsx` 10/10, `PerfilShell.targetaViva.test.jsx` 9/9).
14. **Rondes 46 i 47 (`AH-16` · Unificació de `collapsibleNavigation={false}`, Caixa d'Icona `48×48 px` i Commutador Dual Mòbil `[Icona Col 1] [Icona Col 2] ... [|<]` en `UniversalWorkspace`):**
    - A `AppGridColumn.jsx` i `AppGridShell.css`: caixa geomètrica de `48×48 px` i alineació vertical/horitzontal simètrica tant amb ranura `esquerra` com sense.
    - A `UniversalWorkspace.jsx`, `PerfilShell.jsx`, `NotesSection.jsx`, `Noticies.jsx` i els espècimens de `/disseny`: unificat `collapsibleNavigation={false}` al títol de la Columna 1 i afegit en vista estreta/mòbil (`mida !== 'ample'`) el commutador de 2 botons d'icona (`[Icona Col 1] [Icona Col 2]`) amb estat actiu (`is-active`, `aria-pressed`) + botó `[|<]` a la dreta (`UniversalWorkspace.usabilitat.test.jsx` 52/52).
15. **Ronda 48 (Empaquetat CAS Atòmic Tot-o-Res `261104_kit_gemini_r31_liquidacio_deute_llibre_mestre` sobre `HEAD 4ab2d1527`):**
    - Ruta del Kit: `../_investigacio_ia_de_poble/261104_kit_gemini_r31_liquidacio_deute_llibre_mestre/` (**90 fitxers**: 15 creats i 75 modificats sobre `base_commit` `4ab2d1527a05866ebb13af43697a0c4beffba591`).
    - `verifica_i_aplica.py` **100% atòmic (tot-o-res)**: verifica el 100% dels hashes `target_sha256` del kit i el 100% de les preimatges `source_sha256` de l'arbre destí abans d'escriure cap byte.

| Artefacte del Kit `r31` (`v3.4.0` sobre `4ab2d1527`) | SHA-256 ancorat |
| --- | --- |
| `MANIFEST.json` | `83cbad591b0eae311ad222321f2dc37adce0e89c6f4737c04a8f03aadc27374b` |
| `SHA256SUMS` | `e5a216912762774e8fab6746b1f39095fcf77a3886e766be75634897dc08b983` |
| `verifica_i_aplica.py` | `c0022be81f7537df47a880a99317af6399da6f904ff964d83bf7cbed37dc84ed` |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades i verificades en verd sobre `/tmp/sdp-gemini-ux-xat-control/`:

1. **ESLint estricte (`--max-warnings=0`) sobre tots els 69 fitxers JS/JSX/MJS del Kit CAS Unificat `v3.0.0`:**
   - `npx eslint --max-warnings=0 ...` -> **exit 0 (0 errors, 0 warnings)**.
2. **Portes de Frontissa, Disseny, Vocabulari, Psicopatia i Teclat:**
   - `node tooling/gates/frontissa-contingut.mjs` -> **`✅ [Frontissa] 16/16 claus estructurals amb empremta aprovada.`** (exit 0).
   - `node tooling/gates/design_guard.mjs` -> **`Design Guard: 0 critics, 0 avisos. PASSA.`** (exit 0).
   - `node tooling/gates/teclat-superficies.mjs` -> **`PASSA: 9 superfícies, 17 fitxers executats (294/294 tests).`** (exit 0).
   - `node tooling/gates/tractor-vocabulari.mjs` -> **`PASSA. Cap classe forastera nova.`** (exit 0).
   - `node tooling/gates/tractor-psicopatia.mjs` -> **`Coherència verificada.`** (exit 0).
3. **Bateria completa de les 36 suites Vitest + `node --test` del Kit CAS Unificat `v3.0.0` (Rondes 1–20 + `AH-11`):**
   - **Vitest:** **`36 passed (36)` fitxers, `832 passed (832)` tests en verd** (`FitxaNodeZeroMastodon.test.jsx` 11/11, `PanellNodeZeroMastodon.a11y.test.jsx` 3/3, `posseMastodon.test.js` 5/5, `sanejaTextFederat.test.js` 32/32, `verificadorPilarsFediversity.test.js` 26/26, `CapcaleraConversa.origen.test.jsx` 21/21, `CapcaleraConversa.a11y.test.jsx` 4/4, `ControlSection.test.jsx` 40/40, `destinsControl.test.js` 22/22, `PublicarDeLaPagina.test.jsx` 5/5, `NotaFitxa.test.jsx` 5/5, `PerfilShell.targetaViva.test.jsx` 8/8, `UniversalEditorShell.edicioAvancada.test.jsx` 31/31, `NotesEditor.ambit.test.jsx` 17/17, `NotesEditor.ambitEnLinia.test.jsx` 9/9, `BlocAmbit.test.jsx` 14/14, `carpetaAmbit.test.js` 5/5, `EspecimenBlocAmbit.test.jsx` 3/3, `publicacioUniversal.test.js` 50/50, `publicacioUniversal.adversarial.test.js` 5/5, `TargetaDelMur.ambit.test.jsx` 14/14, `puntsDelMapa.test.js` 17/17, `agendaMur.test.js` 25/25, `indexCerca.ambit.test.js` 9/9, `targetaDeResultat.test.js` 7/7, `notesFitxa.migracio.test.js` 11/11, `SeccioVertical.test.jsx` 13/13, `qualitat.verticals.test.js` 14/14, `PageDetailSection.publicar.test.jsx` 3/3, `pageContent.versions.test.js` 42/42, `imatgeSocial.test.js` 9/9, `PublicacioVerticals8Ambits.integracio.test.jsx` 4/4, `i18n.claus.test.js` 258/258, `i18n.traduides.test.js` 6/6, `i18n.p122.reserves.test.js` 12/12, `i18n.fediversity.paritat.test.js` 4/4).
   - **`node --test tests/fediversity-artefactes-integritat.test.mjs`:** **`3/3` tests en verd**.
4. **Verificació d'integritat del Kit CAS Unificat `v3.0.0` (`71 fitxers`):**
   - `python3 ../_investigacio_ia_de_poble/261104_kit_gemini_xat_control_i_mastodon_ux/verifica_i_aplica.py --arrel "/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org"` -> **`[CAS OK] 261104_kit_gemini_xat_control_i_mastodon_ux (71 fitxers) -> VERIFICAT (DRY-RUN)`**.
5. **Verificació integral del Kit CAS `261104_kit_gemini_r31_liquidacio_deute_llibre_mestre` (`90 fitxers`, Rondes 31 a 48 sobre `HEAD 4ab2d1527`):**
   - `python3 ../_investigacio_ia_de_poble/261104_kit_gemini_r31_liquidacio_deute_llibre_mestre/verifica_i_aplica.py --arrel "/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org" --dry-run` -> **`[CAS OK] 90 fitxers verificats amb preimatge exacta sobre base_commit 4ab2d1527.`** (exit 0).
   - `shasum -a 256 -c SHA256SUMS` -> **94/94 entrades `OK`** (exit 0).
   - Portes de qualitat sobre `/tmp/sdp-gemini-r31-llibre-mestre/`:
     * `npm run porta:design-guard` -> **`Design Guard: 3154 fitxers, 0 critics, 0 avisos. PASSA.`**
     * `npm run porta:frontissa` -> **`✅ tractor-frontissa: entrada tancada, transport GET sense credencials, origen i DTO verificats.`**
     * `npm run porta:vocabulari` -> **`PASSA. Cap classe forastera nova. (classe-forastera: 436 -> 22 baixa; classe-opaca: 12 -> 6 baixa)`**
     * `npm run porta:inlinestyles` -> **`[ESTILS] 0 infraccions; sense baseline ni canvis visuals.`**
     * `npm run porta:rutes` -> **`PASSA. Cap ruta canonica nova escrita a ma. (R1: 98 -> 84 baixa)`**
     * `npm run porta:cataleg` -> **`✅ [CATÀLEG] 99 components de PedraSeca/ registrats · viu 146 · maqueta 9 · extern 0 · obsolet 3`**
     * `npx eslint --max-warnings=0` -> **`0 errors, 0 warnings`**.

6. **Verificació integral del Kit CAS `261105_kit_gemini_r49_editor_geometria_i_mode_rural` (`37 fitxers`, Rondes 49 a 54 sobre `HEAD 064ec0137`):**
   - `AH-20` (`IDEA-77`): `SquareBadge` (`128×128 px`) clicable cap al `/calendari` en el mes de l'acte (`isCalendar`) tant a `UniversalCard.jsx` com dalt a la dreta de `header.page-title` a `PageFrame.jsx`; excepció d'alineació d'`<h1>` a l'esquerra quan `ambLogo === false` (`header.page-title.has-aside--sense-logo h1 { text-align: left; margin-left: 0; }`); codi cromàtic `--sdp-primary-700` (`#ad4c03`) per a calendari i `--sdp-accio-control` (`#004983`) per a preus de Mercat; geometria `.hero-image img` al 100% d'amplària (`width: 100%; height: auto; max-height: none`).
   - `AH-21` (`IDEA-78`): `ModeRural.jsx` centrat horitzontalment i verticalment dins d'`UniversalPage` amb interruptor mestre taronja al capdamunt, bloc didàctic «Per a què servix el Mode rural?» en 5 idiomes i previsualització en viu del JSON abans de descarregar.
   - `AH-23` (`IDEA-80`): Scroll automàtic a dalt de tot (`scrollTop = 0`) en obrir o canviar de document a `UniversalEditorShell.jsx`, previsualització compacta de la `UniversalCard` dins d'«Edició avançada» i copyright de la nota de benvinguda (`NOTA_BENVINGUDA.copyright`).
   - `AH-24` (`IDEA-81`): Selector únic desplegable en «On es publica?» (`BlocAmbit.jsx`) sense caixes de ràdio, amb opció en línia «➕ Crear nova organització…».
   - `AH-25` (`IDEA-82`): Desplegables en línia de Carpetes, Categories i Etiquetes (`BotoneraClassificacio.jsx`) amb creació i supressió directa + nota tutorial d'`appSeed.js` traduïda als 5 idiomes.
   - `AH-26` (`IDEA-83`): Botó explícit «Imatge de Perfil» davall del cercle de l'avatar (`PageFrame.jsx` + `PerfilEditor.jsx`) i clic directe en qualsevol imatge de capçalera o logotip cap a `DialegEnquadrament`.
   - `python3 ../_investigacio_ia_de_poble/261105_kit_gemini_r49_editor_geometria_i_mode_rural/verifica_i_aplica.py --arrel /private/tmp/sdp-gemini-r31-llibre-mestre --dry-run` -> **`[CAS OK] 37 fitxers verificats amb preimatge exacta sobre base_commit 064ec0137.`**
7. **Verificació integral del Kit CAS `261105_kit_gemini_r56_didactica_fediversity_i_gauntlet` (`18 fitxers`, Carril B Nocturn sobre `064ec0137 + R3..R10 + r49`):**
   - **BLOC 1 · Reescriptura Super-Didàctica i Humana de les Pàgines del Sistema en 5 idiomes (`ca, es, en, eu, gl`) + Estabilització Gauntlet de `R10`:**
     * `src/sections/text/pageContent.r10.js`: Reescriptura didàctica i pròxima per a totes les edats de `benvinguda`, `dossier`, `projecte` i `fediversity` en els 5 idiomes oficials de l'app (`ca, es, en, eu, gl`), preservant totes les àncores normatives, taules comparatives i fites verificables.
     * Harmonització d'invariants entre `R10` i les suites existents (`src/sections/text/paginaDeText.test.js`, `src/app/App.fediversity.test.jsx`, `src/data/iaiaLocal.js`).
   - **BLOC 2.1 · Client de Lectura Verificada del Node 0 (`src/data/node0Client.js` + `src/data/node0Client.test.js` · `8/8` proves):**
     * Lector opt-in amb `AbortController` (`4000 ms`), coacció primitiva estricta i *fallback* determinista per a `/api/v1/node0/status`, `/api/v1/node0/posts` (amb caiguda neta a `/api/v1/node0/mur`) i `/.well-known/nodeinfo` + `/nodeinfo/2.1.json`.
   - **BLOC 2.2 · `P2-13` Traducció Dinàmica de Targetes (`src/components/PedraSeca/hooks/useTraduccioTargeta.js` + `useTraduccioTargeta.test.jsx` · `4/4` proves):**
     * Hook React i funció pura `tradueixCampsTargeta` connectats a `carregaTraductorLliure` (`traductorDelLloc.js`) i `tradueixTot` (`traductor.js`), amb protecció de topònims i noms propis, memòria cau LRU de sessió (`64` entrades) i suport de `campsEnOriginal`. Verificat conjuntament amb `traductorLliure.test.js` (`38/38`) i `TranslationsSection.test.jsx` (`11/11`).
   - **BLOC 2.3 · `IDEA-86` / `IDEA-90` Guarda Anti-Escuts Municipals i Fusió Harmònica de Diccionaris `R10 + r49`:**
     * `src/sections/pobles/pobleDeViquipedia.js` i `src/sections/pobles/pobles.escutsProhibits.test.js` (`62/62` proves): Exportació de `NOM_EXCLOS` / `esNomExclos` i guarda unitària que certifica zero `shield_url`, zero heràldica (`P94`/`P41`), zero `hero_nanobanana` i autoria col·lectiva `Gent de <Poble>`.
     * Fusió sense col·lisió dels diccionaris `src/config/idiomes/{ca,es,en,eu,gl}.js` entre `R10` i `r49` i tancament al 100% de la matriu completa: **46/46 suites de Vitest (`1.197/1.197` proves) en verd**.
   - `python3 ../_investigacio_ia_de_poble/261105_kit_gemini_r56_didactica_fediversity_i_gauntlet/verifica_i_aplica.py --arrel /private/tmp/sdp-gemini-r56-didactica-i-gauntlet --dry-run` -> **`[CAS OK] 18 fitxers verificats amb preimatge exacta sobre b373f89fe (064ec0137 + R3..R10 + r49).`**

### Gauntlet Loop d'Alt Valor (Propostes de Millora contínua per a la Xarxa Rural i Fediversity)

1. **Pre-càrrega predictiva en segon pla (`Idle Callback`) del diccionari de traducció local per a les targetes visibles al viewport (`P2-13`):**
   - **Què aporta de bo:** Quan una persona canvia l'idioma de la interfície (per exemple, a basc, gallec o anglès), les targetes del Mur i dels Pobles es tradueixen a l'instant sense esperar cap clic manual ni cap càrrega perceptible.
   - **Quin risc podria tindre i com s'evita:** Carregar els diccionaris de traducció durant l'arrencada inicial podria competir amb el *Largest Contentful Paint (LCP)* en mòbils rurals amb 3G. S'evita disparant `carregaTraductorLliure()` només quan l'idioma actiu és diferent del valencià o dins d'`requestIdleCallback` després del primer pintat, i limitant la cau LRU de `useTraduccioTargeta` a 64 entrades per sessió.
   - **Com encaixa en la visió global de Sóc de Poble:** Fa realitat el plurilingüisme franja a franja (Valencià, Castellà, Anglès, Basc i Gallec) amb cost zero de servidor i 100% de privacitat local al navegador.
2. **Sincronització diferencial d'estat del Node 0 (`ETag` / `If-None-Match`) en `node0Client.js` per al Mode Rural i panells de diagnòstic:**
   - **Què aporta de bo:** Permet que la Consola i el Panell de Control verifiquen la salut de PostgreSQL 17, GoToSocial i el mirall Mastodon amb respostes `304 Not Modified` de pocs bytes, estalviant bateria i dades mòbils en zones de baixa cobertura.
   - **Quin risc podria tindre i com s'evita:** Un encapçalament personalitzat podria disparar preflights CORS innecessaris si el servidor no l'exposa. S'evita mantenint `Accept: application/json` amb `credentials: 'omit'` per defecte i guardant l'última instantània verificada en memòria amb coacció primitiva estricta.
   - **Com encaixa en la visió global de Sóc de Poble:** Reforça el patró *Local-First* i l'arquitectura d'enxufabilitat sobirana (Model B + Node 0) sense dependre de telemetria de tercers.

## Onada R6 · Auditoria Gauntlet Adversarial Creuada i Kit CAS r58

### 1. Conversa Tècnica i Avisos Immediats en Temps Real per a Claude Opus (`S1`–`S4`) i GPT Codex (`R12`) · `19:34 CET`

Després d'auditar l'estat viu del repositori (`064ec0137..c49d173c4` + worktree) i el diagnòstic que acaben d'escriure `S1`, `S2`, `S3` i `S4` a `261104_1636_auditoria_claude.md:1280-1383`, deixe constància immediata dels següents avisos crítics i punts de coordinació entre carrils:

1. **AVÍS CRÍTIC `A1` per a Claude `S3` i `S2` (`P0-26` / `IDEA-97` — Perill de pèrdua d'enllaços en imatges clicables dins de TipTap `SdpImage`):**
   - `S3` ha diagnosticat encertadament (`261104_1636_auditoria_claude.md:1336`) que en `src/sections/notes/NotesEditor.jsx` el node `SdpImage` és un bloc atòmic (`group: 'block', atom: true`) **sense atribut `href` i sense suport per al mark `Link`**.
   - **El risc real:** En `ManifestDePobleArticle.jsx` hi ha **8 imatges enllaçades** amb `<a href="..."><img .../></a>` (logotip → PDF, portada → PDF, Facebook → FB, els **3 logotips clicables d'entitats impulsores** `https://www.zona14.org`, `/rentonar`, `/socdepoble`, el cartell A4 → `/events/aplec-2023` i el cartell de ponents) i en `Aplec2023Article.jsx` n'hi ha **9** (Telegram, Facebook, els **3 logotips clicables**, cartell A4, ponents, reunions i el **logotip del Manifest → `/mur/manifest-de-poble`**). Si `item.content` conté `<a href="..."><img .../></a>`, `renderRichText` el pintarà bé en lectura, **però tan bon punt `PublicacioEditable` (`S2`) òbriga la peça dins de `NotesEditor` (TipTap), el parser de ProseMirror convertirà cada `<img>` en un bloc `sdpImage` solt i descartarà l'`<a href="...">` pare**, trencant els 3 logotips clicables i l'enllaç visual bidireccional `/mur/manifest-de-poble` ↔ `/events/aplec-2023`.
   - **Solució recomanada a `S2`/`S3`:**
     * Dotar `SdpImage` (`src/sections/notes/NotesEditor.jsx:64-121`) d'atributs opcionals `href`, `target` i `rel`: en `parseHTML`, llegir `img.getAttribute('data-sdp-href') || (img.parentElement?.tagName === 'A' ? img.parentElement.getAttribute('href') : null)` (i `target`/`rel`), i en `renderHTML`, si `HTMLAttributes.href` existeix, retornar `['a', { href, target, rel, class: 'sdp-image-link' }, ['img', imgAttrs]]`.
     * Complementàriament, mantindre sempre l'enllaç textual explícit al peu de cada imatge enllaçada (`<p><a href="/events/aplec-2023">...</a></p>` i `<p><a href="/mur/manifest-de-poble">...</a></p>`).

2. **AVÍS CRÍTIC `A2` per a Claude `S3` (`P0-26` / `IDEA-97` — Distinció estricta entre les 34 fotos del visor i les imatges amb enllaç a `VisorDePublicacio.jsx:293`):**
   - `src/components/universal/VisorDePublicacio.jsx:293-305` (`useVisorImatgesDetall`) activa el visor d'imatges (`InteractiveImageViewer`) per a totes les `<img>` dins de `.detail-content` que **NO** tinguen `img.closest('a[href]')` i que complisquen `w >= 48 && h >= 48`.
   - Per tant, en `Aplec2023Article` (`item.content`):
     * Les **34 fotos de `APLEC_GALLERY`** (25 de la galeria principal + 9 d'ampliació) han d'anar com a `<img src="..." alt="..." width="400" height="300" loading="lazy" decoding="async" />` **SENSE `<a>` al voltant** i amb atributs `width="400" height="300"` explícits (imprescindibles perquè en JSDOM i abans de la descàrrega de xarxa `img.getAttribute('width')` siga `>= 48` i el visor les registre).
     * El **vídeo d'À Punt NTC** (`https://www.youtube-nocookie.com/embed/TlZWYbnGuCE`) és eliminat per `DOMPurify` (`FORBID_TAGS: ['iframe']` a `src/utils/sanitize.js:244`). El disseny de `S3` (mantindre'l com a camp declaratiu `video_youtube: { id: 'TlZWYbnGuCE', titol: ... }` pintat per l'embolcall `Aplec2023Article.jsx` abans de `renderRichText(content)`) és 100% segur i evita obrir `iframe` arbitrari a `sanitize.js`.

3. **RESPOSTA I COORDINACIÓ AMB `S1` (`R5-D5` La Torre de les Maçanes + Cànon 600px del Logotip):**
   - Verificat sobre l'arbre viu el pegat de `S1` a `src/sections/pobles/townsSeed.js:184-195` (`fusionaAmbAplec`): `la-torre-de-les-macanes` recupera `image_url: '/assets/towns/la-torre-de-les-macanes/1.jpg'`, `avatar_url: '/assets/towns/la-torre-de-les-macanes/2.jpg'`, `700 hab` i `{ lat: 38.5919, lng: -0.4184 }`.
   - **Recollida de les peticions `X1` i `X2` de `S1` (`261104_1636_auditoria_claude.md:1310`):** Assumisc dins del Kit CAS `261105_kit_gemini_r58_gauntlet_admin_css_i_notes/` la resolució de:
     * **`X1`:** `src/sections/xat/pobleAmfitrio.js:55` (`POBLE_PER_DEFECTE.avatar` → `'/assets/towns/la-torre-de-les-macanes/2.jpg'`) i alineació de `src/sections/xat/pobleAmfitrio.test.js:89,102,104`.
     * **`X2`:** `src/sections/multimedia/suggerimentPobleLocal.test.js:23` (`GPS_TORRE` → `{ lat: 38.5919, lng: -0.4184 }`).
   - **Verificació del Cànon de 600px del Logotip (`IDEA-93`):** Comprovat que `src/css/layout.css:551` (`width: 600px; max-width: 100%`) i `src/css/modules.css:7359` (`width: min(100%, 600px); min-width: min(100%, 260px)`) governen `.page-title-logo` en totes les rutes i que s'ha eliminat `.sdp-connectar-pagina .page-title-logo { width: min(100%, 260px); }`.

4. **RESPOSTA I COORDINACIÓ AMB `S4` (`R5-D6` CSS dels 6 Panells d'Administració + Troballes `P1`/`P2`):**
   - Confirmada al 100% la diagnosi de `S4` (`261104_1636_auditoria_claude.md:1351-1374`) i contrastada amb l'execució de `node tooling/gates/tractor-vocabulari.mjs --detall`:
     * `tractor-vocabulari.mjs` marca a més `css-de-seccio` sobre `src/sections/profile/PerfilShell.css:1` (i les regles `.sdp-admin-*` que hi viuen no compten com a declarades als `FULLS_CANONICS` de `src/css/*.css`, motiu pel qual les 55 classes ixen com a `classe-forastera`).
     * En el Kit CAS `r58` consolide totes les regles CSS d'administració (`.sdp-admin-*`, `.sdp-admin-taxonomia*`, `.sdp-admin-importacio*`, `.sdp-crom-*`, `.sdp-workspace-settings*`), de revisió WordPress (`.sdp-mur-revisio-*`) i de Mode Rural (`.sdp-mode-rural__punts`, `.sdp-dtn-delta`) dins del full canònic `src/css/modules.css` amb tokens `--sdp-*` de Pedra Seca, alineant els noms i botons (`sdp-boto sdp-boto--primari|--secundari`), i corregint també els punts de `S4`:
       - `PerfilShell.jsx:240`: passar `navigationGroups={grupsNavegacio}` a `PanellAjustosVistesColumnes`.
       - `transformadorEditorialWpBlogger.js:259,274,301,331,332-365`: accés a `window.localStorage` protegit dins de `try/catch` (`obteStorageSegur()`) i sanejament/contingut segur.
       - `SquareBadge.jsx:63-67`: accessibilitat completa per teclat (`role="button"`, `tabIndex={0}`, `onKeyDown` Enter/Espai) quan és interactiu.
       - Restauració del baseline de `.agents/deute/.vocabulari-deute.json` amb `0` classes forasteres noves.

*(Continuació completada a les `19:50 CET`: construcció i verificació de `R5-D6`, `X1`/`X2`, `P1`/`P2`/`P3` i paritat i18n al Kit CAS `261105_kit_gemini_r58_gauntlet_admin_css_i_notes/`)*

### 2. Resolució Completa de `R5-D6` (`P1-e`), `P1-a`, `P1-c`, `X1`/`X2`, `P2`/`P3` i Paritat `i18n` · Kit CAS `r58`

Totes les troballes del nostre carril i les peticions creuades dels àrbitres i subagents de Claude Opus (`S1`, `S2`, `S3`, `S4`) han quedat resoltes, provades en còpia aïllada (`/tmp/sdp-gemini-r58-gauntlet/`) i segellades al Kit CAS `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261105_kit_gemini_r58_gauntlet_admin_css_i_notes/`:

1. **Resolució Completa de `R5-D6` / `P1-e` (~60 Classes CSS als 6 Panells d'Administració + Mode Revisió WP + Baseline Vocabulari):**
   - **`src/css/modules.css` (`@layer components`):** Definides totes les ~60 classes CSS emprades per `LaboratoriTaxonomiaDoctoral.jsx`, `BancImportacioEditorial.jsx`, `PanellCromIntegrat`, `PanellAjustosVistesColumnes`, `PanellNodesFediversResiliencia`, `PanellEmpaquetatsDesplegament`, `MurSection.jsx` (`.sdp-mur-revisio-*`), `detailSectionMeta.jsx` i `ModeRural.jsx` (`.sdp-mode-rural__punts`, `.sdp-dtn-delta`) usant exclusivament tokens `--sdp-*` de Pedra Seca, zero colors crus, zero fallbacks prohibits i zero fantasmes.
   - **`src/sections/profile/PerfilShell.css`:** Eliminades les 25 regles `.sdp-admin-taxonomia__*` òrfenes (amb sufixos en anglès que cap JSX consumia) i les 8 línies obsoletes de `.perfil-espai__detall > .sdp-admin-*`.
   - **`src/sections/profile/admin/BancImportacioEditorial.jsx` i `src/sections/profile/admin/PanellsAdministracioSistema.jsx`:** Substituït `sdp-btn sdp-btn--primari|--secundari` pel cànon `sdp-boto sdp-boto--primari|--secundari`.
   - **Baseline de `tractor-vocabulari.mjs` (`.agents/deute/.vocabulari-deute.json`, copiat a `fitxers/vocabulari-deute.json`):** El comptador de `classe-forastera` baixa de **`136` a `22`** (s'han extirpat les **114 entrades** d'`admin/`, `MurSection.jsx`, `detailSectionMeta.jsx` i `ModeRural.jsx`), amb **`0` classes forasteres noves** i **`0` fantasmes**.

2. **Resolució de les Troballes `P1-a` i `P1-c` de `S4`:**
   - **`P1-a` (`src/sections/profile/PerfilShell.jsx:240`):** Corregit el nom de la prop `grupsNavegacio={grupsNavegacio}` → `navigationGroups={grupsNavegacio}` en muntar `PanellAjustosVistesColumnes` (ara mostra les carpetes reals del Perfil).
   - **`P1-c` (`src/sections/mur/MurSection.jsx:153,357`):** La barra `<div className="sdp-mur-revisio-bar">` («🔍 Mode Revisió d'Importació (Admin)») queda protegida sota `mostraBarraRevisioWp = esSuperadminMur || modeRevisioWp` (`useSessioOpcional()?.rol === 'superadmin' || revisioParam === 'wordpress'`), de manera que cap visitant públic ni convidat la veu al Mur ordinari.

3. **Resolució de les Peticions `X1` i `X2` de `S1` (`R5-D5` La Torre de les Maçanes):**
   - **`X1` (`src/sections/xat/pobleAmfitrio.js:55` + 5 suites de test de xat):** `POBLE_PER_DEFECTE.avatar` actualitzat de `commons-ah27.webp` a `'/assets/towns/la-torre-de-les-macanes/2.jpg'` i alineats `pobleAmfitrio.test.js`, `XatSection.actorsPermanents.test.jsx`, `XatSection.caraDelPoble.test.jsx`, `XatSection.avatars.test.jsx` i `FakeChatOnboarding.avatars.test.jsx`.
   - **`X2` (`src/sections/multimedia/suggerimentPobleLocal.test.js:23`):** `GPS_TORRE` actualitzat a `{ lat: 38.5919, lng: -0.4184 }`.

4. **Resolució de les Peticions de `S2`, `S3` i `S4` (`P2`/`P3` + Paritat `i18n` en 5 llengües):**
   - **Àrbitre de `S2` (`261104_1636_auditoria_claude.md:1362` · `src/config/idiomes/{ca,es,en,eu,gl}.js`):** Afegides als 5 diccionaris les dues claus noves de `src/sections/notes/publicacioEditable.js`:
     * `section.notes.publicacio.noActualitzableActe`
     * `section.notes.publicacio.noActualitzableLlavor`
   - **Petició de `S3` (`261104_1636_auditoria_claude.md:1393` · `src/config/assetResolver.test.js:33,532`):** Importat `permetOrigenMitjans` de `../utils/sanitize.js` i cridat `permetOrigenMitjans(PAQUET)` darrere de `fixaBaseRecursos(PAQUET)` a la prova de l'article de l'Aplec.
   - **Troballes `P2`/`P3` de `S4`:**
     * `src/utils/transformadorEditorialWpBlogger.js`: `obteStorageSegur(storage)` amb `try/catch` en totes les lectures/escriptures de `localStorage`, validació d'URL amb `new URL()` i hostname exacte (`parsejaUrlExternaSegura`, `HOSTS_VIDEO_SEGURS`), escapat d'atributs HTML (`escapaAtributHtml`) i resum HTML enllaçat a `trobaArticleImportatComAPublicacio` en lloc de `content: ''`.
     * `src/components/PedraSeca/organismes/SquareBadge.jsx:61-78`: afegits `role="button"`, `tabIndex={0}` i `onKeyDown` (Enter/Espai) a l'element `<time>` quan és interactiu (`navegaAlCalendari`).
     * `src/sections/pobles/territoriDelPoble.js:15`: substituït `params.size` (incompatible amb Safari 16) per `const q = params.toString(); return q ? \`/pobles?\${q}\` : '/pobles';`.
     * `src/components/PedraSeca/hooks/useTraduccioTargeta.js:99,111`: substituït «Aquesta targeta» per «Esta targeta».

### 3. Inventari i Sumes SHA-256 del Kit CAS `261105_kit_gemini_r58_gauntlet_admin_css_i_notes`

- **Ubicació:** `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261105_kit_gemini_r58_gauntlet_admin_css_i_notes/`
- **Pegat unificat:** `pegats/r58_gauntlet_admin_css_i_notes.patch` (`01ea089fb9e5b3bf41056ab2a03e3614c0bdf2d70fd8ac431433e53ec82c4bab`)
- **Verificador CAS:** `verifica_i_aplica.py` (`[CAS OK · PREIMATGE] 23 fitxers verificats` contra el repo viu; `[CAS OK · POSTIMATGE] 23 fitxers verificats` contra la còpia aïllada).

| Fitxer | Acció | SHA-256 Postimatge |
|---|---|---|
| `src/css/modules.css` | modify | `e10e380adc7b4ab23049aa39d35ce639050750c53d020b89861088be65398db4` |
| `src/sections/profile/PerfilShell.css` | modify | `08217843771dee9dd0167c32dea8e3513a3b7e5c3b264896ce918777bd9eae97` |
| `src/sections/profile/PerfilShell.jsx` | modify | `0ce70ec9437fbced3cd607ddf80ddf5acf54638f7a7914686246638c71c61948` |
| `src/sections/profile/admin/BancImportacioEditorial.jsx` | modify | `7dd445ba2e9ea15ec4bba86e1fb2f3394cb4b68ddca85b8f36cca6d12454baa1` |
| `src/sections/profile/admin/PanellsAdministracioSistema.jsx` | modify | `8e8d50ce876d20c30f250e618daa9618b2e2a55e53a929c786c7fad39d899bd5` |
| `src/sections/mur/MurSection.jsx` | modify | `1c73c93c76a9b7f5d7e9aed3e2054aa89204679707f917821263cda4e4e80db8` |
| `src/sections/xat/pobleAmfitrio.js` | modify | `c0c68e4e57764545f964b1438ce34d674dbf3a754d4a7800de1af8af726939d5` |
| `src/sections/xat/pobleAmfitrio.test.js` | modify | `554c43c2c456dfb08881403ca51cf82f8a553311804b0c2def45ee95eeb51b69` |
| `src/sections/xat/XatSection.actorsPermanents.test.jsx` | modify | `831d0285080e6d7eb41051a11dedaf77688dc1a2350ba99a3d90277da7d364a2` |
| `src/sections/xat/XatSection.caraDelPoble.test.jsx` | modify | `8afd1b94afe8de47adef33eec6d193bef7fda95ad91501bd112994b51d925727` |
| `src/sections/xat/XatSection.avatars.test.jsx` | modify | `6c8931f5a2e5cb7d2a8693edc6ad63430460529b11db53a273441e145610f9bf` |
| `src/sections/xat/components/FakeChatOnboarding.avatars.test.jsx` | modify | `516610c9288f89d2fe3c203d9e71cf58c259e092d4f31a8fdd543fbd900eeb40` |
| `src/sections/multimedia/suggerimentPobleLocal.test.js` | modify | `9be687277ec07661ee930247b9d2e33ee6c8e4d14d3376fe857094ffdbe8154b` |
| `src/utils/transformadorEditorialWpBlogger.js` | modify | `244e9fcb4746243cc4d91529c35279a8d64c7a1bed23433a266f64e0a8a879bf` |
| `src/components/PedraSeca/organismes/SquareBadge.jsx` | modify | `8c8ab49a06677d5fde7dd14eaa0efa6e37b6393bcbe6a97b3e4d0f5a156ead25` |
| `src/sections/pobles/territoriDelPoble.js` | modify | `8c5627ffeb89ac0e4aa3926bf5440acb1b5577120e1470e4e7f3cf159fcd8c60` |
| `src/components/PedraSeca/hooks/useTraduccioTargeta.js` | modify | `abe6bab9b7393e3920dcb0c965e042837921e46dddbe9a5ce8d1c77c90f97f8a` |
| `src/config/assetResolver.test.js` | modify | `fcfd60ba2a70099c7152c3ff38442441b07e6314cc5e0c16587bf8629b338a74` |
| `src/config/idiomes/ca.js` | modify | `8483d4ab3728dd0c3681c94a9ae06833a3303f31beb885773696093d29907d27` |
| `src/config/idiomes/es.js` | modify | `a4e0c9a60d59a720d930943ef01286b950ddd8e2eac19b60462a1f1c22dcf6ce` |
| `src/config/idiomes/en.js` | modify | `84e5c7bc323d506ade410294c147c419bf27fedbe43084acac360070d665d6f7` |
| `src/config/idiomes/eu.js` | modify | `b1ef8c3d74213e6c692cb049d4b348decca97726ff060e3b3034de48c00a1ef6` |
| `src/config/idiomes/gl.js` | modify | `95efa948ee3f25c7795b4130c0d2a17ae3b1f0f232e6a81db4977a2c9e561f1e` |
| `.agents/deute/.vocabulari-deute.json` (`fitxers/vocabulari-deute.json`) | baseline | `7754c512bfc77423bd513a11b63ef21d6fa87a6844091352d69bba4c34c5d62e` |

### 4. Verificació de Proves i dels 14 Tractors Pedra Seca (Onada R6)

- **18 suites Vitest focalitzades executades en `/tmp/sdp-gemini-r58-gauntlet/`:**
  * Bloc 1 (12 suites: `pobleAmfitrio.test.js`, `XatSection.actorsPermanents.test.jsx`, `XatSection.caraDelPoble.test.jsx`, `XatSection.avatars.test.jsx`, `FakeChatOnboarding.avatars.test.jsx`, `suggerimentPobleLocal.test.js`, `transformadorEditorialWpBlogger.test.js`, `LaboratoriTaxonomiaDoctoral.test.jsx`, `PerfilShell.ambit.test.js`, `elementDeSeccio.agenda.test.jsx`, `PageFrame.logo.test.jsx`, `connectar.graella.css.test.js`) → **12/12 suites, 208/208 proves en verd.**
  * Bloc 2 (6 suites: `i18n.claus.test.js`, `i18n.traduides.test.js`, `i18n.usades.test.js`, `i18n.fediversity.paritat.test.js`, `useTraduccioTargeta.test.jsx`, `assetResolver.test.js`) → **6/6 suites, 311/311 proves en verd.**
  * **Total Vitest del carril:** **18/18 suites, 519/519 proves en verd (0 fallades).**
- **14 Tractors Pedra Seca + ESLint (`task-237`):**
  * `design_guard.mjs --arrel=src` → **PASSA (3201 fitxers, 0 crítics, 0 avisos).**
  * `tractor-tokens.mjs` → **PASSA (306 tokens declarats, T1–T6 nets).**
  * `tractor-cromatic.mjs` → **PASSA (C1–C6 nets).**
  * `tractor-crom.mjs` → **PASSA (K1–K6 nets).**
  * `tractor-vocabulari.mjs` → **PASSA (2396 classes canòniques, 31 infraccions històriques, `classe-forastera` reduïda de `136` a `22`, `0` noves).**
  * `tractor-estucat.mjs --arrel=.` → **PASSA (0 regles buides, 0 fitxers > 25% mort).**
  * `tractor-atomic.mjs`, `tractor-inline-styles.mjs`, `tractor-classes.mjs`, `tractor-frontissa.mjs`, `01_porta_pedra_seca_58px.mjs`, `tractor-graella.mjs`, `tractor-innerhtml.mjs` → **PASSA.**
  * `teclat-superficies.mjs` → **PASSA (17/17 fitxers, 294/294 proves).**
  * `npx eslint` sobre els 15 fitxers JS/JSX modificats → **0 errors, 0 avisos.**

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Totes les modificacions de codi de l'Onada R6 viuen a `/tmp/sdp-gemini-r58-gauntlet/` i al Kit CAS `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261105_kit_gemini_r58_gauntlet_admin_css_i_notes/`; cap fitxer de `src/` ni `.git/` del repositori viu `socdepoble.org` ha sigut alterat per evitar col·lisions amb els subagents de Claude Opus (`S1`–`S4`).
- El panell `PanellNodeZeroMastodon.jsx` mostra les dades reals servides per `https://socdepoble.cat/api/v1/node0/status` i `/api/v1/node0/mur`, i degrada a `'—'` sense inventar cap mètrica si l'endpoint no és accessible des de la xarxa del visitant.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261104_1636_pla_implementacio_teler_node0_postgres_mastodon_xat_i_fediversity]]
- [[261104_1636_prompt_teler_node0_postgres_mastodon_xat_i_fediversity]]
- [[261104_1636_auditoria_codex]]
- [[261104_1636_auditoria_claude]]
- [[03_llibre_mestre_tasques_i_idees]]
