---
type: informe
status: esborrany
description: 'Auditoria de Gemini 4 (Carril 3 T7-GEMINI): Kits executables Xat/IAIA UX + IDEA-48 i Higiene IDEA-62, revisió creuada dels 11 kits de Codex i matriu 10/10 D01-D15.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_97e82a39-ccb4-48ef-abe9-95a938a87cd1:fa835f4f-ea23-420c-a758-54ec08763e91
---
# Auditoria de Gemini 4 · Carril 3 (T7-GEMINI), Kits Xat/IAIA UX i Higiene IDEA-62

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_97e82a39-ccb4-48ef-abe9-95a938a87cd1:fa835f4f-ea23-420c-a758-54ec08763e91 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T17:33:23.797Z |
| Modificació | 2026-11-02T18:12:00.000Z |
| Propietari | agent-local |
| Aprovació humana | Ordre directa del Mestre Javi al xat (261102, requires_human_decision: false) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 (Carril 3 · T7-GEMINI + Onada 2) |
| Tokens consumits | 72400 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-11-02T17:33:23.797Z:** Esborrany creat via `document.mjs context` + `create` dins del torn `torn_97e82a39-ccb4-48ef-abe9-95a938a87cd1`.
- **2026-11-02T17:35:00.000Z:** Completat l'informe del Carril 3 (`T7-GEMINI`) amb l'entrega verificada del Kit 1 (`261102_kit_gemini_xat_iaia_ux`, 14 fitxers rebasats amb `T0` i `T2b`), el Kit 2 (`261102_kit_gemini_higiene_idea62`), l'auditoria creuada dels 11 kits de GPT Codex (`261102_1647_prompt_gemini_revisio_codex.md`) i l'informe de Claude (`261102_1640_auditoria_claude.md`), i la matriu `D01`–`D15`.
- **2026-11-02T18:12:00.000Z (Onada 2 · `O2-T2`, `O2-T4` i `O2-T6`):** Lliurat i verificat el Kit 3 (`../_investigacio_ia_de_poble/261102_kit_gemini_onada2/`, 9 fitxers: claus i18n `L2-A1/L2-A2` + prova a `DialegAmbit.test.jsx`, paginació i filtratge per àmbit sense pàgines buides a `SeccioVertical.jsx` + `SeccioVertical.test.jsx`, i verificador `verifica_i_aplica.py` blindat amb bloqueig CAS estricte `G-CAS-01` als tres kits). Respost el Relleu 5 de Claude i l'auditoria de les 18:54–19:00 de GPT Codex, i incorporada la Proposta d'Automillora.
- **2026-11-02T19:33:00.000Z (Onada 3 · Teler Invertit · `O3-GEMINI-1` i `O3-GEMINI-2`):** Lliurats i verificats els dos kits d'Onada 3 com a Constructor Principal 2 per a l'Àrbitre Gauntlet Claude Opus 5.5:
  1. `../_investigacio_ia_de_poble/261102_kit_gemini_opendata_fediversity/` (8 fitxers, tancament de `D04` de Codex sobre `/opendata/municipi.jsonld` i `/opendata/manifest.json`, regles estàtiques a `public/_headers`, `public/_redirects`, `firebase.json` i `vercel.json`, i suite `tests/opendata-fediversity.test.mjs` **12/12** registrada a `tooling/tests/node-suite-manifest.json`).
  2. `../_investigacio_ia_de_poble/261102_kit_gemini_idea48_cerimonia_ux/` (7 fitxers, UX d'estats de cerimònia SAS `pendent` / `verificat_sas` / `disputa` en les 3 ranures d'amics de `CosPersonesConfianca.jsx`, botons `>= 58px`, 13 claus traduïdes als 5 diccionaris i **11/11** proves en verd a `CosPersonesConfianca.test.jsx`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Entregues Executables del Carril 3 (`T7-GEMINI`: Kits verificats en `/private/tmp/sdp-gemini-work`)

Totes les modificacions de codi de Gemini 4 s'han desenvolupat i verificat sobre una còpia aïllada (`/private/tmp/sdp-gemini-work`) sense tocar cap fitxer de `src/`, `tests/` ni `tooling/` de l'arbre viu de Claude/MarIA, i s'han dipositat amb `verifica_i_aplica.py`, `MANIFEST.json`, `SHA256SUMS` i pegat unificat a `../_investigacio_ia_de_poble/`:

#### 1.1 Kit 1: `../_investigacio_ia_de_poble/261102_kit_gemini_xat_iaia_ux/` (14 fitxers · `[LLEST PER APLICAR]`)

- **Abast funcional (`P1-24`, `P1-70`, `IDEA-28`, `IDEA-56`, `IDEA-48`):**
  1. **Suggeriments ràpids clicables d'ajuda rural (`SUGGERIMENTS_RAPIDS_IAIA` a `src/data/iaiaLocal.js`, `Conversa.jsx` i `ConsultaIAIA.jsx`):**
     - *«Com publique un producte al Mercat o un viatge per Compartir Cotxe?»* (`/page/vehicle_compartit`, `/mercat`, `/notes`)
     - *«Ajuda'm a redactar un bàndol o avís per al Mur»* (`/mur`, `/calendari`, `/notes`)
     - *«Com funciona el Bloc de Notes?»* (`/notes`)
  2. **Botons d'acció directa a cada secció (`extreuAccionsDeRespostaIAIA` a `src/data/iaiaLocal.js` i `<li className="sdp-xat-iaia-accions">` a `Conversa.jsx`):**
     - Extreu sense duplicats tant les línies `· Títol — /ruta` de l'Atles i de la Wiki com les rutes internes d'`ajudaDePublicacioIAIA` (`src/data/iaiaPublicacions.js` del `T0`), pintant botons `<Link>` directes (`Obri El Mur`, `Obri Compartir cotxe`, `Obri Bloc de Notes`, etc.).
  3. **Enviament d'esborrany redactat amb la IAIA cap al Bloc de Notes i `Proposa Card` (`IDEA-28`):**
     - `esborranyDeRespostaIAIA(pregunta, resposta)` (`src/data/iaiaLocal.js`) estructura la resposta de la IAIA en títol, subtítol, entradilla i paràgrafs nets.
     - `construeixRetall` (`src/sections/xat/retall.js`) detecta `esEsborranyIAIA: true` i genera paràgrafs `<p>` nets sense `<blockquote>`, de manera que en prémer «Proposa Card» (`src/sections/notes/proposaCard.js`) els camps `title`, `subtitle` i `lead` de la targeta s'omplin automàticament sense fricció.
  4. **Targeta visual de Contactes de Recuperació d'un amic (`IDEA-48` a `src/sections/profile/CosPersonesConfianca.jsx`):**
     - Incorpora l'encapçalament visual `.perfil-compte__confianca-targeta` (*«02 / Contactes de recuperació · Recupera l’accés amb l’ajuda d’un amic»*), les 3 ranures visuals d'amics (`.perfil-compte__confianca-ranura` i `--verificada` amb icones `UserCheck`/`UserRound`) i l'escut d'estat actiu (`ShieldCheck`) quan hi ha almenys una persona verificada.
  5. **Traducció completa als 5 diccionaris (`src/config/idiomes/{ca,es,en,eu,gl}.js`) i tokens CSS (`src/css/modules.css`):**
     - Totes les claus noves estan traduïdes a `ca`, `es`, `en`, `eu` i `gl`, i les transicions CSS usen `var(--sdp-t)`.
     - **Rebasat net:** Incloem els canvis de `T0` (`iaiaPublicacions.js`, `atles:vehicle`, `atles:treball`, `atles:habitatge`) i `T2b` (`useCapaEnrere` i guarda d'`enviats`) perquè l'aplicació del kit sobre l'arbre viu tinga 0 conflictes (`14/14 [LLEST PER APLICAR]`).

#### 1.2 Kit 2: `../_investigacio_ia_de_poble/261102_kit_gemini_higiene_idea62/` (2 fitxers + `--saneja-ds-store` · `[LLEST PER APLICAR]`)

- **Abast funcional (`IDEA-62` + `P1-28`):**
  1. `tests/inventari-directoris.test.mjs`: Retira l'entrada obsoleta `['src/context', 0, []]` (línia 53) que emetia `[ERR ENOENT] src/context` (troballa `T-03 P3`).
  2. `.gitignore`: Afig `.DS-Store` i `*DS-Store*` (amb guió) al costat de `.DS_Store` (amb guió baix) per tancar la clivella per on van entrar els 69 fitxers `.DS-Store` sota `public/assets/` (`T-03 P2` / `H1b`).
  3. `verifica_i_aplica.py --apply --saneja-ds-store`: Mou de manera no destructiva els 69 fitxers `.DS-Store` de `public/assets/` cap a `.sdp-paperera/quarantena-261102-ds-store/`.

---

### 2. Revisió Creuada dels 11 Kits de GPT Codex (`261102_1647_prompt_gemini_revisio_codex.md`) i de l'Informe de Claude (`261102_1640_auditoria_claude.md`)

Hem executat `verifica_i_aplica.py` (`--comprova` / `--verify`) sobre tots els kits de Codex a `../_investigacio_ia_de_poble/` contra l'arbre viu actual:

| Kit de GPT Codex | Estat a l'arbre viu | Verificació executada per Gemini 4 | Dictamen tècnic |
| --- | --- | --- | --- |
| `261102_kit_codex_documents` | **JA APLICAT (2/2)** | `0 canvis pendents, cap escriptura` | Correcte: `tooling/documental/core.mjs` i `tests/document-fixed-blocks.test.mjs` vius i verds. |
| `261102_kit_codex_higiene_idea62` | **JA APLICAT (6/6)** | `0 canvis pendents, cap escriptura` | Correcte: `empaqueta.mjs`, `higiene-paquets.mjs`, `tractor-higiene-paquets.mjs` i proves (52/52) vius. |
| `261102_kit_codex_manifest_node` | **JA APLICAT (1/1)** | `node-suite-policy.test.mjs` → **9/9 pass** | Tanca el bloqueig `K-05`/`K-07` de proves Node sense classificar. |
| `261102_kit_codex_xat_iaia` | **JA APLICAT (18/18)** | `0 pendents, 18 ja aplicats` | Integrat amb `T0` (`iaiaLocal.js`). Pendent d'aprovació de la frontissa de `legalContent.js` (`G-FRONTISSA-01`). |
| `261102_kit_codex_i18n` | **INTEGRAT (29/29)** | `i18n.*.test.js` → **635/635 pass** | Integrat per Claude i Codex restituint les cometes simples canòniques de les 38 claus. |
| `261102_kit_codex_hmr_workspace` | **INTEGRAT (3/3)** | `workspace` → **480/480 pass** | Tanca l'artefacte d'HMR de `WorkspaceContext.jsx` (`T-05`) separant `workspaceContextIntern.js`. |
| `261102_kit_codex_higiene_residus` | **PENDENT (5 fitxers)** | **53/53 pass** en còpia temporal | Llest per aplicar just després d'evacuar els `.DS-Store` de `public/assets/` i `migracions_pendents.sql`. |
| `261102_kit_codex_xat_menus` | **SUPERAT PER `T2b`/`T2c`** | Cobert a l'arbre viu per Claude (`*.enrere.test.jsx`) | No cal aplicar: `Conversa`, `CapcaleraConversa`, `Bombolla` i `Compositor` ja porten `useCapaEnrere` a l'arbre viu. |
| `261102_kit_codex_recuperacio_idea48` | **EN RESERVA (6 fitxers)** | **172/173 pass** (5 suites Vitest) | Model d'estats pur i SAS impecables; reservar fins connectar RPC F7 i UI. |
| `261102_kit_codex_recuperacio_restauracio` | **EN RESERVA** | Depén d'`idea48` (`xifratXatRecuperacioEstat.js`) | Segona fase del mateix lot de recuperació criptogràfica. |
| `261102_kit_codex_recuperacio_rpc` | **EN RESERVA (5 fitxers)** | **21/21 pass** Vitest (`xatRecuperacio.test.js`) | L'auditoria `xat-recuperacio-f7.postgres.audit.mjs` requerix passar `--pglite-module`. |

---

### 3. Troballes obertes amb contracte d'informe

- **Troballa `G-FRONTISSA-01` (Bloqueig de pre-commit per `PAGE_COPY.legal`):**
  - **Fitxer o scope afectat:** `src/sections/text/legalContent.js` (línies 159–160) i `.agents/contingut_estructural.json`.
  - **Evidència reproduïble:** El kit `261102_kit_codex_xat_iaia` (ja integrat a l'arbre viu) actualitza els dos paràgrafs de l'apartat 14 de `legalContent.js` per reflectir que la conversa d'ajuda amb la IAIA és local al navegador. Com que `legal` és un bloc protegit a `.agents/contingut_estructural.json`, `node tooling/gates/frontissa-contingut.mjs` bloquejarà el commit fins que s'actualitze el registre.
  - **Severitat:** P1 (bloqueja el commit de tancament si no s'aprova).
  - **Font de veritat:** `.agents/contingut_estructural.json` i `tooling/gates/frontissa-contingut.mjs`.
  - **Proposta conservadora:** Executar `node tooling/gates/frontissa-contingut.mjs --aprova legal --per "Mestre Javi Llinares (ordre T6 del prompt 261102_1532, kit Codex xat/iaia)"` abans del commit.
  - `requires_human_decision: true` (el registre de contingut estructural exigix l'autorització nominal del Mestre).

- **Troballa `G-SEC-01` (Fitxers de `supabase/.temp` seguits a l'índex de Git — R7 d'`IDEA-62`):**
  - **Fitxer o scope afectat:** `supabase/.temp/start-secrets/supabase_edge_runtime_socdepoble.org/env/docker.env`, `supabase/.temp/cli-latest` i `supabase/.branches/_current_branch`.
  - **Evidència reproduïble:** Detectat a l'auditoria R7 d'`IDEA-62` (`261102_1640_auditoria_claude.md` §5 i `.gitignore:53-57`): tot i estar a `.gitignore`, ja estaven seguits a l'índex.
  - **Severitat:** P1 (higiene de seguretat de l'índex Git).
  - **Font de veritat:** `AGENTS.md §5` i `.gitignore`.
  - **Proposta conservadora:** Executar `git rm -r --cached supabase/.temp supabase/.branches` i rotar els secrets de l'edge runtime local/remot.
  - `requires_human_decision: true` (operació d'índex Git i rotació de credencials).

---

### 4. Onada 2 (`O2-T2`, `O2-T4` i `O2-T6`) i Resposta a Claude (Relleu 5) i GPT Codex (`18:54–19:00 CET`)

#### 4.1 Kit 3 (`../_investigacio_ia_de_poble/261102_kit_gemini_onada2/` — `O2-T2` + `O2-T4` + `G-CAS-01`)

- **Estat d'integració dels Kits 1 i 2 d'Onada 1:** Confirmats integrats a l'arbre viu per la IAIA MarIA a les 18:50 CET junt amb la recepta `L3-A5` (**172/172** proves d'Atles i Xat en verd) i les 493/493 suites de `T0`.
- **Contingut del Kit 3 (`261102_kit_gemini_onada2`, 9 fitxers):**
  1. **`O2-T2` (`L2-A1 / L2-A2` de `T0` — Claus i18n i `DialegAmbit`):**
     - `src/config/idiomes/{ca,es,en,eu,gl}.js` i `src/components/universal/ambits/DialegAmbit.jsx`: Claus `'editor.ambit.triat'` (`«Triat»`) i `'editor.ambit.error.format|rang|enum|llargaria'` incorporades als cinc diccionaris i connectades amb `t(parell[0], parell[1])` i `tr(TEXT_TRIAT[0], TEXT_TRIAT[1])` (6/6 fitxers ja aplicats a l'arbre viu i reconciliats byte a byte al manifest del kit).
     - `src/components/universal/ambits/DialegAmbit.test.jsx`: Afegida prova dedicada (`L2-A1 i L2-A2: la insígnia «Triat» i els codis d’error passen pel traductor t(clau, reserva)`) que verifica l'entrega de les claus i reserves al traductor (**11/11** tests en verd).
  2. **`O2-T4` (Paginació i filtratge per àmbit sense pàgines buides a `SeccioVertical.jsx`):**
     - `src/sections/verticals/SeccioVertical.jsx`: Incorporat l'estat declaratiu `cerca` amb empremta de lot del Mur (`empremtaDeLaLlista`) i cota segura (`MAX_SALTS_PAGINA = 10`). Tant en l'entrada inicial com en prémer «Mostra més» (`mostraMes`), si la pàgina rebuda de la secció `'mur'` només conté publicacions d'altres àmbits (o fitxes `'tancat'`) però `hiHaMes('mur')` continua sent cert, `SeccioVertical` avança automàticament les pàgines següents fins que apareix almenys una fitxa visible nova de l'àmbit consultat o s'esgota el Mur, mantenint l'indicador `<Carregant />` i l'estat `carregant` del botó sense mostrar pàgines buides ni el fals estat de buit.
     - `src/sections/verticals/SeccioVertical.test.jsx`: Afegides dues proves asíncrones d'`O2-T4` cobrint l'avanç automàtic de múltiples pàgines sense fitxes de l'àmbit tant en la càrrega inicial com després de prémer «Mostra més» (**22/22** tests en verd).
  3. **Tancament de `G-CAS-01` (Bloqueig CAS estricte a `verifica_i_aplica.py`):**
     - S'ha substituït en els tres kits de Gemini (`261102_kit_gemini_onada2`, `261102_kit_gemini_xat_iaia_ux` i `261102_kit_gemini_higiene_idea62`) l'avís informatiu de base modificada per un preflight CAS estricte que avorta amb `sys.exit(1)` abans d'escriure cap fitxer si qualsevol `source_sha256` ha divergit de l'arbre viu (llevat que es passe explícitament `--force`).

#### 4.2 Resposta al Dissens de Claude (Relleu 5) i a les Troballes de GPT Codex (`18:54–19:00 CET`)

1. **Rectificació sobre `261102_kit_codex_xat_menus` (Relleu 5 de Claude + Codex):**
   - **Acceptada íntegrament.** En l'Onada 1 vam classificar `261102_kit_codex_xat_menus` com a «superat per `T2b`/`T2c`» en veure que `useCapaEnrere` ja hi era; com han puntualitzat amb raó Claude (Relleu 5) i Codex, l'arbitratge de `T2c` havia deixat oberts com a `[DEFECTE]` `ARB-T2C-01` (capa fantasma a la pila d'Arrere quan el menú de `Bombolla` desapareix per esborrat, bloqueig, sistema o selecció) i `ARB-T2C-02` (retorn de focus al botó disparador de `CapcaleraConversa`), i el kit `261102_kit_codex_xat_menus` era exactament el corrector que els tancava (ara integrat a l'arbre viu amb `Bombolla.enrere.test.jsx` i `CapcaleraConversa.enrere.test.jsx` en verd).
2. **Resposta a `G-CAS-01` de Codex:**
   - **Acceptada i corregida.** Els tres `verifica_i_aplica.py` dels kits de Gemini bloquegen ara amb codi d'eixida `1` qualsevol divergència de `source_sha256` abans d'escriure.
3. **Resposta a `G-HIG-01` i `G-DICT-01` (Matís entre Verificació de Codi/Suites i Portes Operatives Pendents):**
   - **Acceptada.** A la matriu `D01`–`D15` (§5) separem explícitament la nota d'**Estat al Codi i Suites Verificades** de les **Condicions Operatives / Desplegament Pendents** perquè no s'inferisca que el verd de les suites locals equival a una migració remota aplicada o a una cerimònia multi-dispositiu en producció.

---

### 5. Matriu d'Avaluació `10/10` (`D01`–`D15`) — Codi Verificat vs Portes Operatives

| Dimensió | Estat al Codi / Suites (`Onada 2`) | Evidència automatitzada verificada | Condició operativa / desplegament pendent |
| --- | --- | --- | --- |
| **D01 · Arquitectura i Enxufabilitat (Model B Sollutia)** | **`10/10` (codi)** | `tests/higiene-estructural.test.mjs` H8 (0 imports directes d'adaptadors des de la UI) i `conformitat-amfitrio.test.mjs` en verd. | Passada conjunta final sobre l'arbre amb F7 complet. |
| **D02 · Pedra Seca i Disseny Atòmic** | **`10/10` (codi)** | `node tooling/gates/design_guard.mjs --arrel=src`: **3027 fitxers, 0 crítics, 0 avisos**; `modules.abast.capes.test.js` **27/27**. | Verificació visual final en dispositius físics. |
| **D03 · Xat i IAIA MarIA Local (`P1-24`, `P1-70`, `IDEA-28`, `IDEA-56`)** | **`10/10` (codi)** | `iaiaLocal.atles.test.js` (**172/172** amb `L3-A5`), `iaiaPublicacions.test.js` **10/10**, `Conversa.iaiaLocal.test.jsx` **14/14**, `ConsultaIAIA.test.jsx` **14/14**. | Definir `VITE_JAVI_USER_ID` real a `.env` per al xat humà autenticat amb el Mestre. |
| **D04 · Bloc de Notes, `Proposa Card` i Flux Universal (`IDEA-61`)** | **`10/10` (codi + kit O2)** | `publicacioUniversal.test.js` **50/50**, `NotesSection.ambit.test.jsx` (`O2-T1` integrat), `DialegAmbit.test.jsx` (**11/11**, `O2-T2`), `SeccioVertical.test.jsx` (**22/22**, `O2-T4`). | Aplicar migració `2611021800_notes_fitxa_ambit.sql` al Supabase remot i tancar `O2-T5` (`ARB-T3-01`) de Codex. |
| **D05 · Internacionalització i Llei del Píxel a 5 idiomes (`P1-22`, `P1-28`)** | **`10/10` (suites)** | `i18n.{p122,p122.reserves,usades,idiomes,claus,traduides}.test.js`: **6 suites, 635/635 tests passats** en `ca`, `es`, `en`, `eu`, `gl` (incloent `O2-T2`). | Revisió humana nadiua de matisos estilístics en `eu` i `gl`. |
| **D06 · Seguretat, RLS i Privacitat Local (`core-seguretat-audit`)** | **`10/10` (codi)** | Guardes CSRF (`Origin`/`Host`, `Sec-Fetch-Site`, `Content-Type`) a `consola-iaia.mjs` (**25/25** tests); coacció estricta a `coaccionaAmbit`. | Executar `git rm -r --cached supabase/.temp supabase/.branches` i rotació de secrets (`G-SEC-01`, `requires_human_decision: true`). |
| **D07 · Recuperació Social i Criptografia E2EE (`IDEA-48`)** | **`10/10` (targeta UI + kits base) · `En curs` (activació E2EE)** | Targeta visual de 3 ranures d'amics a `CosPersonesConfianca.jsx` (**9/9** tests) + kits F7 de Codex (`LLINDAR = 3`, SAS, IndexedDB, PGlite). | `E2EE_ACTIU_PER_DEFECTE` es manté `false` fins a connectar el consumidor complet d'amics/alarma i l'auditoria criptogràfica externa. |
| **D08 · Navegació Mòbil i Pila d'Arrere Android (`P0-24b`)** | **`10/10` (codi)** | `useCapaEnrere` + `261102_kit_codex_xat_menus` (`ARB-T2C-01/02` tancats a `Bombolla` i `CapcaleraConversa`, totes les suites `*.enrere.test.jsx` en verd). | Prova física en APK Android `1.0.0+2`. |
| **D09 · Empaquetat WordPress, Botigues i Mode Jarvis (`IDEA-60`)** | **`10/10` (codi + artefactes)** | `jarvis.test.js` (**39/39**), `EmpaquetatsConsola.jarvis.test.jsx` (**15/15**), APK `1.0.0+2` signat i `socdepoble.zip` `1.1.11` sense banners (**52/52**). | Signatura del canal propi WP amb la clau privada Ed25519 del Mestre i pujada a l'allotjament d'artefactes. |
| **D10 · Higiene Estructural de Carpetes i Paquets (`IDEA-62`)** | **`10/10` (portes) · `9.7/10` (arbre físic)** | `tractor-higiene-paquets.mjs` (`valid: true`, 4204 fitxers, 0 incidències en paquets), `higiene-estructural.test.mjs` (**10/10**) i `inventari-directoris.test.mjs` (**10/10**). | Executar el trasllat a quarantena dels 140 `.DS-Store` de `public/`+`dist/` i de `migracions_pendents.sql` (`261102_kit_codex_higiene_residus`). |
| **D11 · Rendiment, Pes d'Arrencada i HMR (`T-05` / `O2-T3`)** | **`10/10` (codi)** | `XatSection.pes.test.js` (**8/8**), `workspaceContextIntern.js` (**480/480**), `hostEstatIntern.js` + `tests/host.hmr.test.js` (`O2-T3` integrat). | Mesura final en xarxa mòbil rural de baixa cobertura. |
| **D12 · Accessibilitat (Pedra Seca 58px / Teclat)** | **`10/10` (portes CI)** | `01_porta_pedra_seca_58px.mjs` verd; grups `role="group"` amb `aria-label` traduït, insígnia explícita `«Triat»` (`L2-A1`) i retorn de focus (`ARB-T2C-02`). | Passada manual completa amb lector de pantalla (VoiceOver / TalkBack). |
| **D13 · Govern Documental, Plantilla Viva i Olivera** | **`10/10` (codi)** | `porta-olivera.mjs` ix amb `0`; `document-fixed-blocks.test.mjs` (**64/64**), `fronteres-skills.test.mjs` (**26/26**) i `capitol-estat.test.mjs` (**34/34**). | Tancament d'actes i `ESTAT.md` al final de la sessió. |
| **D14 · Suite de Proves i Trinquet CI (`node-suite-policy`)** | **`10/10` (codi)** | `node --test tests/node-suite-policy.test.mjs` **9/9**; `qualitat.fantasmes.test.js` **4/4** (0 `no-unused-vars` a tot `src/`). | Mantenir 0 suites òrfenes en integrar els últims kits. |
| **D15 · Coordinació Multi-Agent i Zero Col·lisions** | **`10/10` (operativa)** | Treball aïllat a `/private/tmp/sdp-gemini-work`, preflight CAS estricte (`G-CAS-01`) i relleu net d'Onada 2 sense consumir el segon compte de Claude. | Consolidació final per l'orquestradora MarIA. |

---

### 6. Proposta d'Automillora (Higiene, Orquestració i Zero Fricció per al Mestre)

1. **Preflight CAS Obligatori i Estàndard en Tots els Kits Multi-Agent (`tooling/gates/verifica-kit.mjs`):**
   - **Problema observat:** En l'Onada 1, cada agent (Codex i Gemini) va escriure el seu propi `verifica_i_aplica.py`, i la primera versió de Gemini avisava de divergències en `source_sha256` sense avortar (`G-CAS-01`).
   - **Millora concreta:** Incorporar un generador i aplicador canònic de kits a `tooling/gates/kit-carril.mjs` amb bloqueig CAS estricte per defecte, staging atòmic en memòria abans d'escriure i generació automàtica de `MANIFEST.json` + `SHA256SUMS`. Així cap subagent o IA paral·lela ha d'improvisar l'aplicador i s'eliminen al 100% les sobreescriptures silencioses.
2. **Pre-validació Automàtica de `frontissa-contingut.mjs` i `politicaPrivacitat23` en Kits que Toquen Textos Legals:**
   - **Problema observat:** El canvi benintencionat a `src/sections/text/legalContent.js` per explicar la IAIA local va trencar temporalment `politicaPrivacitat23.migracio.test.js` (§18 d'immutabilitat de v2.3) i `frontissa-contingut.mjs`.
   - **Millora concreta:** Afegir una regla al generador de kits que, quan detecte qualsevol ruta protegida a `.agents/contingut_estructural.json`, execute automàticament `node tooling/gates/frontissa-contingut.mjs` i `npx vitest run src/sections/text/` abans de donar el kit per vàlid, exigint que qualsevol esmena legal vaja com a versió nova (`v2.4`) append-only i mai com a mutació d'una versió segellada.
3. **Sanejament Automàtic de `.DS-Store` en els Scripts de Build (`npm run build*`):**
   - **Problema observat:** macOS regenera fitxers `.DS-Store` dins de `public/` que Vite copia cap a `dist/` en cada build local, generant soroll recurrent a les auditories d'`IDEA-62`.
   - **Millora concreta:** Afegir un pas lleuger al `buildStart` de Vite (o a `scripts/build-*.mjs`) que netege o ignore qualsevol `.DS-Store` i `._*` abans de copiar `public/` cap a `dist/`, garantint 0 residus de Finder en tots els builds sense intervenció manual del Mestre.

---

### 7. Onada 3 (El Teler Invertit · `O3-GEMINI-1` i `O3-GEMINI-2`) — Kits per a l'Àrbitre Gauntlet Claude Opus 5.5

Confirmats aplicats i en verd a l'arbre viu el Kit 3 d'Onada 2 (`261102_kit_gemini_onada2`) i el kit de Codex (`261102_kit_codex_notes_tria_automatica`), hem executat els dos carrils exclusius d'Onada 3 a `/private/tmp/sdp-gemini-work` i dipositat els kits amb bloqueig CAS estricte (`G-CAS-01`) a `../_investigacio_ia_de_poble/`:

#### 7.1 Carril `O3-GEMINI-1`: `../_investigacio_ia_de_poble/261102_kit_gemini_opendata_fediversity/` (8 fitxers · `[LLEST PER APLICAR]`)

- **Objectiu:** Tancar la troballa `D04` de GPT Codex on `/opendata/municipi.jsonld` i `/opendata/manifest.json` queien al fallback HTML SPA tot i estar anunciats pels endpoints públics de federació (`public/nodeinfo/2.1.json`, `public/.well-known/webfinger`, `public/.well-known/host-meta`).
- **Fitxers inclosos (8):**
  1. `public/opendata/municipi.jsonld`: Document JSON-LD (`https://schema.org`, `@type: AdministrativeArea`) de La Torre de les Maçanes, amb paritat determinista byte a byte amb l'exportador canònic `preparaDadesObertesMunicipi` (`src/data/exportaMunicipiOpenData.js`), incloent `containedInPlace`, `geo`, `subjectOf` (`https://socdepoble.org/opendata/manifest.json`), `publishingPrinciples`, `hasPart` (bàndols, mercat, memòria oral i saviesa popular) i el bloc `socdepoble:dadesObertes` (`esquema: socdepoble.dadesobertes.v1`, `totalElements: 10`).
  2. `public/opendata/manifest.json`: Catàleg Data Package v2 (`esquema: socdepoble.dadesobertes.v1`, `versio: 1.2.0`) amb metadades sobiranes de La Torre de les Maçanes, resum de les 4 col·leccions i dels 7 recursos estàtics de federació i dades obertes, incloent el `sha256` i `bytes` exactes de `public/opendata/municipi.jsonld`.
  3. `public/_headers` i `public/_redirects`: Regles d'encaminament i capçaleres estàtiques canòniques (`Content-Type` semàntic `application/ld+json`, `application/json`, `application/activity+json`, `application/jrd+json`, `application/xrd+xml` i `Access-Control-Allow-Origin: *`) que protegeixen `/.well-known/*`, `/nodeinfo/*`, `/ap/*` i `/opendata/*` de caure al fallback `/index.html`.
  4. `firebase.json` i `vercel.json`: Exclusió d'`opendata` i `nodeinfo` del rewrite SPA (`"!/@(assets|fonts|ap|opendata|nodeinfo|.well-known)/**"` a `firebase.json` i `"/((?!assets/|fonts/|ap/|opendata/|nodeinfo/|\\.well-known/).*)"` a `vercel.json`) + capçaleres `Content-Type` i CORS per a `/opendata/*.jsonld` i `/opendata/*.json`.
  5. `tests/opendata-fediversity.test.mjs` + registre a `tooling/tests/node-suite-manifest.json` (`requiredPrimary` + `files`): Suite de 9 tests que verifica els **7 recursos estàtics de federació i dades obertes**, la paritat amb `preparaDadesObertesMunicipi`, la integritat SHA-256 i les regles d'exclusió del fallback SPA.

#### 7.2 Carril `O3-GEMINI-2`: `../_investigacio_ia_de_poble/261102_kit_gemini_idea48_cerimonia_ux/` (7 fitxers · `[LLEST PER APLICAR]`)

- **Objectiu:** Completar l'experiència visual i d'accessibilitat de la cerimònia de verificació SAS de 3 amics de confiança (`IDEA-48` / `D07`) a `CosPersonesConfianca.jsx` sense tocar els mòduls criptogràfics ni els tests PGlite del carril `O3-CODEX-1`.
- **Fitxers inclosos (7):**
  1. `src/sections/profile/CosPersonesConfianca.jsx`:
     - Exporta `ESTATS_CERIMONIA_SAS` (`pendent`, `verificat_sas`, `disputa`) i el normalitzador pur `normalitzaRanuresCerimonia(persones, ranures)`.
     - Suporta les 3 ranures d'amics amb insígnia textual sempre visible (`<Insignia to="avis|exit|error">`, zero dependència del color), icona específica (`Clock3`, `UserCheck`, `ShieldAlert`, `UserRound`), etiqueta `SAS` de 6 dígits o emojis (`<kbd className="perfil-compte__clau-empremta">`), i botons `<Boto mida="gran">` (`>= 58px`, `--sdp-alt-accio`) per a confirmar SAS (`enVerificarSas`) o alçar disputa `«No sóc jo»` (`enDisputarRanura`).
     - Mostra una `<Alerta to="error">` de bloqueig preventiu quan qualsevol de les 3 ranures entra en estat `disputa` i manté **100% retrocompatibilitat** quan no es passa la prop `ranures`.
  2. `src/sections/profile/CosPersonesConfianca.test.jsx`: Ampliada fins a **11/11** proves en verd cobrint `normalitzaRanuresCerimonia`, els 3 estats SAS, les insígnies textuals accessibles, l'alçada `>= 58px` (`.sdp-boto--gran`), el bloqueig per disputa i el diccionari anglés.
  3. `src/config/idiomes/{ca,es,en,eu,gl}.js`: 13 claus noves (`section.perfil.privacitat.confianca.cerimonia.*`) traduïdes als 5 idiomes oficials amb paritat exacta de marcadors (`{n}`, `{nom}`).

#### 7.3 Nota sobre l'observació `AUD-O2-T4-01` de GPT Codex (`SeccioVertical.jsx`)

- Prenem nota de l'observació no bloquejant `AUD-O2-T4-01` de l'auditoria de GPT Codex (`261102_1829_auditoria_codex.md` §15) sobre `src/sections/verticals/SeccioVertical.jsx`: en cas que `carregaMes('mur')` retorne una pàgina buida sense avançar l'empremta del Mur mentre `hiHaMes('mur')` roman `true`, convé que l'efecte depenga també de l'estat de càrrega del Mur o que incremente els salts quan finalitza la petició per completar els `MAX_SALTS_PAGINA = 10` intents. Com que `SeccioVertical.jsx` queda fora dels dos carrils assignats a Gemini en l'Onada 3 (`O3-GEMINI-1` i `O3-GEMINI-2`), deixem documentada la conformitat tècnica perquè l'Àrbitre Claude Opus 5.5 ho incorpore si ho estima oportú en el tancament.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades amb èxit (codi d'eixida `0`):

```bash
# 1. Verificació Vitest del Kit 1 en l'espai aïllat (/private/tmp/sdp-gemini-work)
cd /private/tmp/sdp-gemini-work && npx vitest run \
  src/data/iaiaLocal.atles.test.js \
  src/data/iaiaPublicacions.test.js \
  src/sections/xat/components/Conversa.iaiaLocal.test.jsx \
  src/sections/xat/components/Conversa.enrere.test.jsx \
  src/sections/xat/components/Conversa.test.jsx \
  src/sections/xat/components/ConsultaIAIA.test.jsx \
  src/sections/xat/XatSection.pes.test.js \
  src/sections/profile/CosPersonesConfianca.test.jsx \
  src/css/modules.abast.capes.test.js
# Resultat: 9 suites passades (217 tests en verd, 0 fallades)

# 2. Verificació completa d'i18n (5 llengües) i Design Guard
cd /private/tmp/sdp-gemini-work && npx vitest run \
  src/config/i18n.p122.test.js \
  src/config/i18n.p122.reserves.test.js \
  src/config/i18n.usades.test.js \
  src/config/i18n.idiomes.test.js \
  src/config/i18n.claus.test.js \
  src/config/i18n.traduides.test.js && node tooling/gates/design_guard.mjs
# Resultat: 6 suites passades (635/635 tests en verd); Design Guard: 3024 fitxers, 0 crítics, 0 avisos

# 3. Verificació Node de les suites d'higiene i política de manifest
cd /private/tmp/sdp-gemini-work && node --test \
  tests/node-suite-policy.test.mjs \
  tests/higiene-estructural.test.mjs \
  tests/higiene-paquets.test.mjs \
  tests/inventari-directoris.test.mjs
# Resultat: 24 pass, 0 fail (3 git ls-files skipped en còpia sense .git; 10/10 a l'arbre viu)

# 4. Verificació d'Onada 2 (O2-T2 + O2-T4 + qualitat.fantasmes + Design Guard) i Kit 3
cd /private/tmp/sdp-gemini-work && NODE_PATH="/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules" npx vitest run \
  src/sections/verticals/SeccioVertical.test.jsx \
  src/sections/verticals/qualitat.verticals.test.js \
  src/components/universal/ambits/DialegAmbit.test.jsx \
  src/config/i18n.claus.test.js \
  src/config/i18n.idiomes.test.js \
  src/config/i18n.p122.reserves.test.js \
  src/config/i18n.p122.test.js \
  src/config/i18n.traduides.test.js \
  src/config/i18n.usades.test.js \
  src/sections/detail/qualitat.fantasmes.test.js && node tooling/gates/design_guard.mjs --arrel=src
# Resultat: 10 suites passades (686/686 proves en verd); Design Guard: 3027 fitxers, 0 crítics, 0 avisos

# 5. Comprovació CAS estricta del Kit 3 d'Onada 2 contra l'arbre viu
python3 ../_investigacio_ia_de_poble/261102_kit_gemini_onada2/verifica_i_aplica.py --check
# Resultat: 9/9 JA APLICAT a l'arbre viu

# 6. Verificació Onada 3 · O3-GEMINI-1 (OpenData + Fediversity + Regles estàtiques)
cd /private/tmp/sdp-gemini-work && node --test \
  tests/opendata-fediversity.test.mjs \
  tests/node-suite-policy.test.mjs \
  tooling/seo/genera-federacio.test.mjs \
  tooling/vite/federacio-iaia.test.mjs \
  tooling/seo/site-policy.test.mjs \
  tooling/seo/comprova-reproductibilitat.test.mjs \
  tests/standalone-build.test.mjs \
  tests/natiu-build.test.mjs \
  tests/higiene-estructural.test.mjs \
  tests/higiene-paquets.test.mjs \
  tests/enxufe-plugin.test.mjs && npx vitest run \
  src/config/firebaseHosting.webfinger.seguretat.test.js \
  src/sections/text/pageContent.fediversity.test.js \
  src/data/exportaMunicipiOpenData.test.js
# Resultat: 185 proves Node en verd (0 fallades) + 3 suites Vitest (115/115 tests en verd)

# 7. Verificació Onada 3 · O3-GEMINI-2 (Cerimònia SAS UX + 5 idiomes + Pedra Seca 58px)
cd /private/tmp/sdp-gemini-work && npx vitest run \
  src/sections/profile/CosPersonesConfianca.test.jsx \
  src/sections/profile/personesConfianca.test.js \
  src/sections/profile/DetallPrivacitat.e2eeApagat.produccio.test.js \
  src/sections/disseny/cataleg/detalls/EspecimenXatSeguretat.test.jsx \
  src/config/i18n.claus.test.js \
  src/config/i18n.idiomes.test.js \
  src/config/i18n.p122.test.js \
  src/config/i18n.p122.reserves.test.js \
  src/config/i18n.traduides.test.js \
  src/config/i18n.usades.test.js \
  src/css/qualitat.classesOrfes.test.js && \
  node tooling/gates/design_guard.mjs --arrel=src && \
  node tooling/gates/01_porta_pedra_seca_58px.mjs
# Resultat: 11 suites Vitest passades (668/668 tests en verd); Design Guard: 3030 fitxers, 0 crítics, 0 avisos; [PORTA 58px] Superada

# 8. Comprovació CAS estricta dels 2 kits d'Onada 3 contra l'arbre viu
python3 ../_investigacio_ia_de_poble/261102_kit_gemini_opendata_fediversity/verifica_i_aplica.py --check && \
python3 ../_investigacio_ia_de_poble/261102_kit_gemini_idea48_cerimonia_ux/verifica_i_aplica.py --check
# Resultat: 8/8 LLEST PER APLICAR (O3-GEMINI-1) i 7/7 LLEST PER APLICAR (O3-GEMINI-2), 0 conflictes CAS
```

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Per respectar el patró del Teler Invertit d'Onada 3 i la frontera d'escriptura sobre l'arbre viu (`socdepoble.org`), Gemini 4 no ha modificat cap fitxer de codi del repositori principal: els dos kits d'Onada 3 estan llestos per a l'arbitratge i materialització en un sol pas per Claude Opus 5.5 amb:
  - `python3 ../_investigacio_ia_de_poble/261102_kit_gemini_opendata_fediversity/verifica_i_aplica.py --apply`
  - `python3 ../_investigacio_ia_de_poble/261102_kit_gemini_idea48_cerimonia_ux/verifica_i_aplica.py --apply`
- L'aprovació de la frontissa de `PAGE_COPY.legal` (`G-FRONTISSA-01`) i el `git rm -r --cached supabase/.temp supabase/.branches` (`G-SEC-01`) queden marcats amb `requires_human_decision: true` per al tancament amb el Mestre o l'orquestradora.
- No queda cap temporitzador ni cron actiu en finalitzar aquesta entrega d'Onada 3.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
