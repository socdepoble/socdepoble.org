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
| Modificació | 2026-11-03T03:14:00+01:00 |
| Propietari | agent-local |
| Aprovació humana | Ordre directa del Mestre Javi al xat (261102–261103, requires_human_decision: false) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) · Carril 3 (Onades 1–6) |
| Tokens consumits | 148500 |

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
- **2026-11-02T23:55:00.000Z (Onada 4 Nocturna · `O4-GEMINI-1` i `O4-GEMINI-2`):** Lliurat i verificat el kit `../_investigacio_ia_de_poble/261102_kit_gemini_onada4_continguts_tendencies_i_qa/` amb sub-targetes, doble certificació d'enllaços (`72/72`) i les 4 propostes d'I+D d'avantguarda (`IDEA-63`..`IDEA-66`).
- **2026-11-03T01:00:00.000Z (Onada 5 Nocturna · `O5-GEMINI-1` i `O5-GEMINI-2`):** Lliurat i verificat el kit `../_investigacio_ia_de_poble/261103_kit_gemini_onada5_dossier_apple_directe_i_qa/` amb `DOSSIER_APPLE_APP_STORE_DIRECTE_1_0_0.md` i els 9 fitxers reconciliats de `src/sections/text/` amb `.sdp-subtargeta` i `frontissa-contingut.mjs` `16/16`.
- **2026-11-03T03:14:00+01:00 (Onada 6 · `O6-GEMINI` · Tractor Verificador de Llegibilitat Editorial i Matriu `10/10`):** Construït a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/` el tractor verificador `audita-llegibilitat-editorial.mjs` (+ `audita-llegibilitat-editorial.test.mjs` **6/6** en verd, `INFORME_LLEGIBILITAT_EDITORIAL.md` i `radiografia-llegibilitat.json`), auditats els lliuraments de Claude i Codex i actualitzada la matriu `10/10` (`D01`–`D15`).

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

### 5. Matriu d'Avaluació `10/10` (`D01`–`D15`) — Codi Verificat vs Portes Operatives (Actualitzada Onada 6)

| Dimensió | Estat al Codi / Suites (`Onada 6`) | Evidència automatitzada verificada | Condició operativa / desplegament pendent |
| --- | --- | --- | --- |
| **D01 · Arquitectura i Enxufabilitat (Model B Sollutia)** | **`10/10` (codi)** | `tests/higiene-estructural.test.mjs` H8 (0 imports directes d'adaptadors des de la UI), `conformitat-amfitrio.test.mjs` i 1.765 suites Vitest (**31.458/31.458** proves) en verd. | Recepció dels endpoints GET de Sollutia per a la Frontissa. |
| **D02 · Pedra Seca i Disseny Atòmic (`--sdp-calaix-dalt`, `.sdp-subtargeta`)** | **`10/10` (codi)** | `node tooling/gates/design_guard.mjs --arrel=src`: **3030 fitxers, 0 crítics, 0 avisos**; `CalaixIdentitats.test.jsx` **6/6**, `TextSection.subtargeta.test.jsx` **13/13**. | Verificació visual final de les noves negretes d'escaneig ràpid a `:3340`. |
| **D03 · Xat i IAIA MarIA Local (`P1-24`, `P1-70`, `IDEA-28`, `IDEA-56`)** | **`10/10` (codi)** | `iaiaLocal.atles.test.js` (**172/172** amb `L3-A5`), `iaiaPublicacions.test.js` **10/10**, `Conversa.iaiaLocal.test.jsx` **14/14**, `ConsultaIAIA.test.jsx` **14/14**. | Definir `VITE_JAVI_USER_ID` real a `.env` per al xat humà autenticat amb el Mestre. |
| **D04 · Bloc de Notes, `BlocAmbit` en Línia i Flux Universal (`IDEA-61`)** | **`10/10` (codi)** | `BlocAmbit.test.jsx` **14/14** (`O4-CLAUDE-1` integrat en «Edició avançada» sense modal bloquejant), `publicacioUniversal.test.js` **50/50**, `SeccioVertical.test.jsx` **22/22**. | Aplicar migració `2611021800_notes_fitxa_ambit.sql` al Supabase remot si no s'ha aplicat. |
| **D05 · Internacionalització 5 Idiomes, Traducció Client i Llei del Lema WP (`P1-22`, `O6-WP`)** | **`10/10` (suites)** | **2.944 claus** als 5 diccionaris (**668/668** tests i18n), `TraduccioPagina` amb avís honest de límits, i tractor `audita-llegibilitat-editorial.mjs` validant els 5 lemes canònics (`va` i `es` idèntics en valencià). | Materialització final de `wordpress-plugin/` `v1.1.12` per `O6-CODEX`. |
| **D06 · Seguretat, RLS R2 DDL i Privacitat Local (`core-seguretat-audit`)** | **`10/10` (codi)** | `tractor-rls.mjs` + `tests/tractor-rls-r2-ddl.test.mjs` (**33/33** cobrint `RENAME TO`, `SET SCHEMA`, `DROP SCHEMA` sobre 74 fitxers SQL) i `politicaPrivacitat23.migracio.test.js` (**6/6**). | Si s'aplica el kit d'enriquiment de `legalContent.js`, crear migració `2.4` i re-segellar Frontissa (`ARB-XAT-01`). |
| **D07 · Recuperació Social i Criptografia E2EE (`IDEA-48`)** | **`10/10` (UI SAS + kits base) · `En curs` (activació E2EE)** | `CosPersonesConfianca.test.jsx` (**11/11**, `O3-GEMINI-2`: estats `pendent`, `verificat_sas`, `disputa` amb botons `>= 58px`) + `261102_kit_codex_recuperacio_consumidor_ui`. | `E2EE_ACTIU_PER_DEFECTE` es manté `false` fins a l'auditoria criptogràfica externa. |
| **D08 · Navegació Mòbil i Pila d'Arrere Android (`P0-24b`)** | **`10/10` (codi)** | `useCapaEnrere` + `261102_kit_codex_xat_menus` (`ARB-T2C-01/02` tancats a `Bombolla` i `CapcaleraConversa`, totes les suites `*.enrere.test.jsx` en verd). | Prova física en dispositiu real. |
| **D09 · Botigues (`Apple App Store`, `Google Play`, `WordPress.org`, `APK`) i Mode Jarvis (`IDEA-60`)** | **`10/10` (codi + enviaments oficials)** | Google Play `2 (1.0.0)` i Apple App Store Connect `1.0` enviats a revisió; WordPress.org `v1.1.11` amb actualitzacions automàtiques actives; `DOSSIER_APPLE_APP_STORE_DIRECTE_1_0_0.md` i `botigues.produccio.test.js` (**34/34**). | Pujar `v1.1.12` del connector WP amb pestanyes en 5 idiomes i versió canònica `v1.1.0`. |
| **D10 · Higiene Estructural, OpenData i Fediversity (`IDEA-62`, `O3-GEMINI-1`)** | **`10/10` (portes)** | `tests/opendata-fediversity.test.mjs` (**12/12**), `build-net-dsstore.test.mjs`, `tractor-higiene-paquets.mjs` (`valid: true`), i `certifica-enllacos.mjs` (**79/79** en arbre). | Afegir `application/activity+json` per a `activitystreams.json` (`G-D-01` al carril `O6-CODEX`). |
| **D11 · Rendiment, Pes d'Arrencada i HMR (`T-05` / `O2-T3`)** | **`10/10` (codi)** | `XatSection.pes.test.js` (**8/8**), `workspaceContextIntern.js` (**480/480**), `hostEstatIntern.js` + `tests/host.hmr.test.js` (`O2-T3` integrat). | Mesura contínua en xarxa mòbil rural. |
| **D12 · Accessibilitat i Llegibilitat Editorial (`core-llegibilitat-text`, Pedra Seca 58px)** | **`10/10` (portes + nou tractor O6)** | `01_porta_pedra_seca_58px.mjs` verd + nou tractor `audita-llegibilitat-editorial.mjs` (**6/6** tests) mesurant `<strong>`/`<p>`, `<ul>` i `<h4>` a les 5 superfícies editorials. | Completar la injecció de 5–8 `<strong>`/`<p>` en `O6-CLAUDE` i `O6-CODEX` fins a deixar `0` paràgrafs plans en `--strict`. |
| **D13 · Govern Documental, Fronteres de Skills i Olivera** | **`10/10` (codi)** | `porta-olivera.mjs` ix amb `0`; `fronteres-skills.mjs` (**42 skills, 0 violacions, 0 avisos**); `D6-01`, `D6-03`, `D6-04`, `D6-06` i `D6-11` verificats a les 4 skills. | Tancament d'Acta Marmota i `ESTAT.md` al final de l'Onada 6. |
| **D14 · Suite de Proves i Trinquet CI (`node-suite-policy`)** | **`10/10` (codi)** | `1.765` suites Vitest (`31.458` proves en verd, `0` roges) + `2.163` proves `node --test` en verd + `frontissa-contingut.mjs` (**16/16**). | Re-segellar `.agents/contingut_estructural.json` després de l'edició d'Onada 6. |
| **D15 · Coordinació Multi-Agent i Zero Col·lisions** | **`10/10` (operativa)** | Matriu d'exclusivitat de carrils respectada al 100% en Onades 1–6, kits amb verificació SHA-256 i zero processos/crons zombis. | Consolidació final d'Onada 6 per l'orquestradora MarIA. |

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

---

### 8. Onada 4 Nocturna (`O4-GEMINI-1` i `O4-GEMINI-2`) — Continguts, Sub-Targetes, Doble Certificació d'Enllaços i Estudi I+D d'Avantguarda

Confirmats aplicats a l'arbre viu els dos kits d'Onada 3 (`261102_kit_gemini_opendata_fediversity` i `261102_kit_gemini_idea48_cerimonia_ux`), hem executat el **Carril 3 (`O4-GEMINI-1` + `O4-GEMINI-2`)** de la Marató Nocturna i dipositat el kit CAS complet a:
- **`../_investigacio_ia_de_poble/261102_kit_gemini_onada4_continguts_tendencies_i_qa/`** (`manifest.json`, `SHA256SUMS`, `verifica_i_aplica.py` amb bloqueig CAS estricte `G-CAS-01`, `PROPOSTA_ID_TENDENCIES_LLIBRE_MESTRE.md`, `fitxers/` i `pegats/`).

#### 8.1 `O4-GEMINI-1`: Auditoria Integral de Textos, Diccionaris 5 Llengües, Sub-Targetes i Doble Certificació d'Enllaços

1. **Auditoria de Paritat dels 5 Diccionaris (`src/config/idiomes/{ca,es,en,eu,gl}.js`):**
   - **2.944 claus exactes** als 5 diccionaris (`0` claus absents, `0` sobrers, `0` cadenes buides).
   - Verificat amb `src/config/i18n.traduides.test.js` i `src/config/i18n.p122.test.js` que en anglés (`en.js`), basc (`eu.js`), gallec (`gl.js`) i castellà (`es.js`) no queda cap frase no traduïda fora dels 8 noms propis i de canal registrats (`Sóc de Poble`, `La Torre de les Maçanes`, `Wiki de Poble`, `Jarvis Torruà`, `Avisos, General`, `1 participant`).
2. **Disseny i Materialització de Sub-Targetes Estructurades (`data-sdp-targetes` / `data-sdp-targeta`) a `src/sections/text/pageContent.js`:**
   - **`/projecte` (`PAGE_COPY.projecte`):** Grup de 3 Sub-Targetes en graella (`data-forma="graella"`) connectant amb `/anima` («L'Ànima de la IAIA»), `/constitucio` («Constitució») i `/page/fediversity` («Candidatura Europea NLnet · NGI Fediversity»).
   - **`/anima` (`PAGE_COPY.anima`, el Manifest):** Grup de 2 Sub-Targetes en parella (`data-forma="parella"`) connectant amb `/projecte` i `/constitucio`.
   - **`/page/descarregues` (`PAGE_COPY.descarregues`):** Grup de 2 Sub-Targetes en parella connectant amb `/page/fediversity` i `/versions` (preservant el rànquing BM25 de `iaiaLocal.atles.test.js` per a `'Què és un node?'` → `/fedivers` i `'Com instal·le l’app al mòbil?'` → `/page/descarregues`).
   - **`/page/fediversity` (`PAGE_COPY.fediversity`):** Incorporació a l'apartat «Verificació en viu per als avaluadors i el veïnat» dels enllaços directes clicables als recursos reals de `public/opendata/manifest.json` (`https://socdepoble.org/opendata/manifest.json`, `https://socdepoble.org/opendata/municipi.jsonld` i `https://socdepoble.org/opendata/llicencies.md`) + Grup de 2 Sub-Targetes en parella cap a `/page/descarregues` i `/fedivers`.
   - **Nota sobre rutes d'Open Data:** El prompt citava a títol d'exemple `/opendata/mercat.jsonld` i `/opendata/llocs.geojson`, que no existeixen físicament a `public/opendata/` (on els recursos reals del manifest són `manifest.json`, `municipi.jsonld`, `llicencies.md`, `noticies.jsonld`, `agenda.jsonld`, `directori.jsonld`, `memoria-cultural.jsonld`, `memoria.md`, `configuracio.json` i `activitystreams.json`). Per complir estrictament la **Doble Certificació d'Enllaços (Zero 404)** s'enllacen exclusivament els recursos físics existents a `public/opendata/manifest.json`.
   - **Sincronització de Frontissa i Suites:** Actualitzat `.agents/contingut_estructural.json` (`16/16` claus aprovades amb `frontissa-contingut.mjs`), `src/sections/text/TextSection.targetes.test.jsx` (`34/34` tests passats) i `src/sections/text/pageContent.fediversity.test.js` (`36/36` tests passats).
3. **Troballes Caçades i Reparades en el Kit CAS (`D04` / `D11` / `D15`):**
   - **Troballa `O4-GEM-F1` (`src/config/firebaseHosting.test.js`):** Després d'aplicar `O3-GEMINI-1` a `firebase.json` (afegint `opendata` i `nodeinfo` al rewrite SPA, `_headers`/`_redirects` a `ignore` i les 2 regles de capçaleres `/opendata/*.jsonld` i `/opendata/*.json`), 3 assercions de `src/config/firebaseHosting.test.js` havien quedat desfasades esperant l'estat antic de `firebase.json`. Reparades al kit CAS (`9/9` tests en verd).
   - **Troballa `O4-GEM-F2` (`tooling/gates/certifica-enllacos.mjs`):** L'extractor de `certifica-enllacos.mjs` només extreia URLs absolutes `https?://` quan se li passava un fitxer i no extreia els atributs HTML `href="/..."` ni `data-ruta="/..."` de les Sub-Targetes ni validava que les llavors `/wikidepoble?item=<id>` existiren a `src/data/wikiManifest.js`, i tampoc incloïa `/app` (`<Route path="/app/*" element={<RutaApps />} />`) a `RUTES_CURTES_APP`. Ampliat al kit CAS: ara certifica **72/72 enllaços (0 falles, Segell SHA-256 `a8cb0ec483075601`)** cobrint tot `PAGE_COPY`, `legalContent.js`, totes les Sub-Targetes i totes les llavors de la Wiki.

#### 8.2 `O4-GEMINI-2`: Investigació I+D d'Avantguarda («Últimes Tendències per al Futur de Sóc de Poble»)

Hem elaborat i inclòs al kit CAS (`PROPOSTA_ID_TENDENCIES_LLIBRE_MESTRE.md`) les 4 noves entrades d'enginyeria d'avantguarda llestes per a incorporar al Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`):

1. **`IDEA-63` · Local-First Rural & CRDTs sobre PGlite/IndexedDB + Sincronització sense Servidor (LAN / QR / WebRTC):**
   - Estendre el segon adaptador (`src/data/local/`) amb rellotges lògics híbrids (`HLC: <wall_ms>:<counter>:<node_id>`) i operacions `LWW-Element-Set` signades amb ECDSA P-256 (`src/data/xifratXatCripto.js`).
   - Tres canals sense servidor: **(a)** Bàndol Municipal per QR comprimit amb `CompressionStream('deflate-raw')` (< 1,8 KB) verificable sense xarxa a la plaça del poble; **(b)** sincronització d'alertes i agenda per LAN/WebRTC DataChannel al Wi-Fi del Casal o de l'Ajuntament; **(c)** reconciliació amb Supabase en recuperar connexió.
2. **`IDEA-64` · Passkeys (WebAuthn PRF Extension) + Recuperació Social per Amics (`IDEA-48`) per a Gent Gran («Zero Contrasenyes»):**
   - Desbloqueig biomètric (dit o cara) de l'anell de claus P-256 a IndexedDB derivant la clau d'embolcall (`KEK`) amb `HKDF-SHA-256` des de l'extensió `prf` de WebAuthn Level 3 (Secure Enclave / Titan M2).
   - Partició de la clau mestra de recuperació (`MK`) amb **Shamir's Secret Sharing sobre $GF(2^8)$ ($k=2$ de $n=3$)** xifrant cada fragment cap a les claus públiques verificades per SAS (`verificat_sas` a `CosPersonesConfianca.jsx`) dels 3 amics de confiança.
3. **`IDEA-65` · Editor Universal de Targetes Interactives sobre Pedra Seca (Plantilles Rurals Estructurades en `sdpTargetes`):**
   - Evolucionar `sdpTargetes` (`CosAmbTargetes.jsx` i `TargetaIncrustadaNodeView.jsx`) amb 4 plantilles rurals sense CSS en línia: *Bàndol Municipal amb síntesi de veu local*, *Fitxa de Cultiu del Calendari Agrícola*, *Recepta i Memòria Oral OKF v0.2* (`FitxaMemoriaOral.jsx`) i *Fitxa d'Intercanvi Veïnal*, amb doble eixida `<UniversalCard>` + JSON-LD `schema.org` al paquet Open Data.
4. **`IDEA-66` · Federació Europea Bidireccional NGI0/Fediversity (ActivityPub Fase 2 + Mastodon, Mobilizon i Bonfire):**
   - Connectar el verificador criptogràfic pur `processaActivitatInbox` (`src/data/federacio/inboxActivityPub.js`) a un endpoint d'entrada/eixida (`POST /ap/inbox/<slug>`) amb lliurament signat HTTP Signatures (`rsa-sha256` / `ed25519`), federant avisos amb **Mastodon/GoToSocial**, actes de calendari amb **Mobilizon** (`Event` + `ical:VEVENT`) i mercat/ajuda mútua amb **Bonfire/ValueFlows**.

### 9. Actualització Onada 5 Nocturna (`O5-GEMINI-1` + `O5-GEMINI-2`) · Dossier Apple App Store Directe + Reconciliació i Auditoria Creuada

Tota l'execució de l'Onada 5 s'ha realitzat en còpia aïllada (`/private/tmp/sdp-gemini-o5`, eliminada en tancar) sense tocar cap fitxer de codi de l'arbre viu de `socdepoble.org`. El lliurable complet s'ha dipositat i verificat al kit CAS **`../_investigacio_ia_de_poble/261103_kit_gemini_onada5_dossier_apple_directe_i_qa/`**.

#### 9.1 `O5-GEMINI-1`: Dossier Operatiu de Pujada Directa a Apple App Store Connect (`DOSSIER_APPLE_APP_STORE_DIRECTE_1_0_0.md`)

Creat a `../_investigacio_ia_de_poble/261103_kit_gemini_onada5_dossier_apple_directe_i_qa/DOSSIER_APPLE_APP_STORE_DIRECTE_1_0_0.md` amb tots els textos i caselles exactes en blocs de codi nets (Format Zero Fricció, zero cites `>`) per a la pujada directa a **Apple App Store Connect (`iOS App 1.0 Prepare for Submission` → `Add for Review`, sense TestFlight)**:

1. **Verificació de Binari i Metadades Natives (`ios/App/`):**
   - Arxiu signat: `_builds_de_poble/ios/261102_socdepoble_1.0.0+2.xcarchive` (`Bundle ID: org.socdepoble.app`, `Team ID: J8972V93X3`, `MARKETING_VERSION = 1.0.0`, `CURRENT_PROJECT_VERSION = 2` sincronitzat en les 4 configuracions de `project.pbxproj`, `TARGETED_DEVICE_FAMILY = 1,2`).
   - `ITSAppUsesNonExemptEncryption = false` a `ios/App/App/Info.plist` i 4 cadenes de permís (`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryAddUsageDescription`, `NSPhotoLibraryUsageDescription`) redactades amb propòsit clar (evita `ITMS-90683`).
   - Sanejador natiu `src/sections/text/perAppNativa.js` verificat amb 29 proves unitàries (`perAppNativa.test.js`) per evitar qualsevol menció a plataformes externes a iOS (`Guideline 2.3.10`).
2. **Textos amb Recompte Exacte i Doble Certificació d'Enllaços (`ca`, `es`, `en-US`):**
   - **Name:** `Sóc de Poble` (`12/30` caràcters).
   - **Subtitle:** `Xarxa rural i memòria viva` (`26/30` caràcters en `ca`), `Red rural y memoria viva` (`24/30` en `es`), `Rural Community & Heritage` (`26/30` en `en-US`).
   - **Promotional Text:** `158/170` caràcters (`ca`), `155/170` (`es`), `143/170` (`en-US`).
   - **Keywords ASO:** `96/100` caràcters sense espais (`ca`/`es`) i `97/100` (`en-US`).
   - **URLs verificades (`HTTP 200 OK` + router SPA):** `Support URL: https://socdepoble.org/el-projecte`, `Marketing URL: https://socdepoble.org`, `Privacy Policy URL: https://socdepoble.org/legal`, `User Privacy Choices URL: https://socdepoble.org/legal`.
   - **Age Rating (`18+` / UGC moderat):** Taula casella per casella coherent amb Google Play Console (`None` en violència/contingut sexual/apostes, `Infrequent/Mild` en humor col·loquial, temes adults i referències culturals al vi/verema).
   - **App Privacy (`Privacy Nutrition Labels`):** Taula completa d'alineació amb `ios/App/App/PrivacyInfo.xcprivacy` (`App Functionality`, `Linked to User: Yes`, `Used for Tracking: No`).
   - **App Review Notes:** Instruccions detallades en anglés per al revisor d'Apple cobrint: (a) navegació pública completa sense login (`Sign-In Required` desmarcat), (b) **Guideline 1.2 (UGC)** (EULA, filtratge, botó `Denunciar` i botó `Bloquejar` immediat al Mur i al Xat + compromís `< 24h` a `info@socdepoble.org`), i (c) **Guideline 5.1.1(v) (Account Deletion)** (ruta interna a `Perfil` i ruta web a `https://socdepoble.org/legal`).

#### 9.2 `O5-GEMINI-2`: Reconciliació de `pageContent.js` (`.sdp-subtargeta`) i Auditoria Creuada d'Onada 4 (Claude + Codex)

1. **Reconciliació de `src/sections/text/pageContent.js` i de les 8 Suites de Text (`O5-RECONCILIACIO-TEXT`):**
   - Empaquetats al kit CAS (`fitxers/`, `preimages/`, `pegats/`) els 9 fitxers reconciliats de `src/sections/text/` (`pageContent.js`, `TextSection.targetes.test.jsx`, `TextSection.subtargeta.test.jsx`, `TextSection.recursos.test.jsx`, `TextSection.test.jsx`, `TextSection.imatgeSocial.test.jsx`, `TextSection.llengua.test.jsx`, `pageContent.fediversity.test.js`, `perAppNativa.test.js`).
   - Eliminats els 4 blocs `<div class="sdp-targetes" data-sdp-targetes="">` duplicats al final de `projecte`, `anima`, `descarregues` i `fediversity`, conservant intactes les caixes `.sdp-subtargeta[data-sdp-subtargeta]` (`O4-CLAUDE-2`) i els 6 enllaços `/opendata/*` de `PAGE_COPY.fediversity`.
   - Verificat que `node tooling/gates/frontissa-contingut.mjs` passa amb **`16/16 claus estructurals amb empremta aprovada`** i que les **11 suites de Vitest (`192/192` proves)** passen sense cap error.
2. **Auditoria dels Lliurables d'Onada 4 de Claude Opus 5.5 (`O4-CLAUDE-1`, `O4-CLAUDE-1b`, `O4-CLAUDE-2`, `tractor-rls.mjs`):**
   - **`BlocAmbit.jsx` + `carpetaAmbit.js` (`O4-CLAUDE-1`):** `14/14` proves en verd (`BlocAmbit.test.jsx`). Memòria independent per àmbit en `useRef` sincronitzada també davant canvis externs (`A1-02`), zero crides a `onCanvia` dins d'updaters d'estat (segur sota `<StrictMode>`) i `omple()` lineal sense regex vulnerable a backtracking.
   - **Token `--sdp-calaix-dalt` (`O4-CLAUDE-1b` / `IDEA-63`):** `6/6` proves en verd (`CalaixIdentitats.test.jsx`). Centralitzat a `src/css/tokens.css:272` (`calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))`) i compartit entre `.sdp-dialeg--calaix` i `.toc-overlay` perquè cap calaix ni teló tape mai `header.bar-black`.
   - **Primitiva `subtargeta.js` (`O4-CLAUDE-2`):** `13/13` proves en verd (`TextSection.subtargeta.test.jsx`). Node ProseMirror `sdpSubtargeta` aïllat (`isolating: true`), preservació del nivell d'encapçalament (`h3`–`h6`) davant `clearNodes` i jerarquia tipogràfica en `modules.css`.
   - **Kit `261103_kit_claude_o4_rls_r2_rename` (`tractor-rls.mjs`):** Verificat amb **`33/33` proves en verd** (`tests/tractor-rls-r2-ddl.test.mjs`) i `74 fitxers sql` sense infraccions. Cobreix `ALTER TABLE ... RENAME TO`, `SET SCHEMA` i `DROP SCHEMA` perquè un `CREATE TABLE IF NOT EXISTS` posterior amb el nom antic torne a exigir `ENABLE ROW LEVEL SECURITY`.
3. **Auditoria dels Lliurables d'Onada 4 de GPT-5.4 Codex (`261102_kit_codex_onada4_skills_tractors_i_destrossa`):**
   - **Porta de Fronteres de Skills (`tooling/brain/fronteres-skills.mjs`):** `42 skills (25 procediment, 17 amb motor) · 0 violacions noves · 0 en deute · 0 deute ranci · 0 avisos`.
   - **Certificador d'Enllaços (`tooling/gates/certifica-enllacos.mjs`):** Ara analitza l'AST real de `src/app/App.jsx` amb `@babel/parser`, resol subrutes de Consola, valida `?item=` contra `wikiManifest.js` i extreu `href`, `data-ruta` i `data-autor-ruta` (`79/79` comprovats en arbre).
   - **Observació sobre «## Lliçons del Mestre» (`O5-SKILLS-LLICONS`):** En `.agents/skills/sdp-workflow/SKILL.md` i `.agents/skills/wiki-documentacio-i-reflex/SKILL.md`, Codex ha adaptat el vocabulari per eliminar afirmacions absolutes que disparaven `fronteres-skills.mjs`, mantenint el bloc `## Lliçons del Mestre` en ambdues skills amb `0` avisos.

---

### 10. Actualització Onada 6 (`CARRIL 3 · T4 / O6-GEMINI`) · Tractor Verificador `audita-llegibilitat-editorial.mjs`, Radiografia Empírica de les 5 Superfícies i Auditoria de Lliuraments

S'ha construït i verificat al dipòsit exclusiu **`_wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/`** el tractor verificador no destructiu **`audita-llegibilitat-editorial.mjs`** junt amb la seua suite de proves unitàries **`audita-llegibilitat-editorial.test.mjs`** (**6/6** tests en verd), l'informe **`INFORME_LLEGIBILITAT_EDITORIAL.md`**, la telemetria **`radiografia-llegibilitat.json`**, **`README_INTEGRACIO.md`**, **`manifest.json`** i **`SHA256SUMS`**.

#### 10.1 Què mesura i verifica el tractor `audita-llegibilitat-editorial.mjs`

1. **Superfície 1 — `src/sections/text/pageContent.js` (`PAGE_COPY`, 24 claus):**
   - Mesura en cada clau el nombre de `<p>` narratius (excloent contenidors purs d'imatge o rètol metadada), la mitjana, mínim i màxim de sintagmes `<strong>` per `<p>`, els paràgrafs plans (`0` negretes), els paràgrafs de baixa densitat (`< 5` negretes en paràgrafs `>= 25` paraules), les llistes `<ul>` (`<li>` i `<li>` amb `<strong>` inicial on la negreta perd força visual) i la jerarquia `<h3>`/`<h4>`/`<h5>` sense salts de nivell.
   - Verifica específicament el contracte d'Onada 6 per a `PAGE_COPY.versions`: capçalera `v1.1.0`, entrada `3 de novembre de 2026 · v1.1.0`, `0` llistes `<ul>` i presència de subtítols `<h4>`.
2. **Superfície 2 — `src/sections/text/legalContent.js` (`/legal`):**
   - Mesura la densitat de `<strong>` per `<p>` (71 paràgrafs narratius + 1 de metadada) i verifica la **Guarda d'Immutabilitat RGPD (`politicaPrivacitat23.migracio.test.js` §18)** contrastant el SHA-256 de `legalContent.html` amb la darrera migració de `supabase/migrations/*_politica_privacitat_*.sql`.
3. **Superfície 3 — `src/sections/plugins/presentacioPlugins.js` (`PRESENTACIO_PLUGINS`: `rebost`, `salut`, `gestoria`, `rss`):**
   - Avalua els 6 paràgrafs didàctics de cadascun dels 4 plugins:
     - `rebost` (`5.67` `<strong>`/`<p>`, rang `5–8`, `0` plans) i `salut` (`6.00` `<strong>`/`<p>`, rang `5–7`, `0` plans) ja estan en **`10/10 OK`**.
     - `gestoria` (`1.33` `<strong>`/`<p>`, paràgraf `#3` amb `0` negretes) i `rss` (`1.33` `<strong>`/`<p>`, paràgraf `#4` amb `0` negretes) queden assenyalats per a l'enriquiment de `O6-CLAUDE`, recordant la guarda de `presentacioPlugins.test.js` (exactament 12 línies `<h3>`/`<p>` alternades, només marques nues `h3`/`p`/`strong` i preservació dels literals entre cometes `«...»` de `CITES`).
4. **Superfície 4 — `src/data/appSeed.js` (`NOTES_SEED[0]` · Card tutorial «Bloc de notes»):**
   - Detecta els 4 paràgrafs plans (`0` negretes de 5 `<p>`), les 2 llistes `<ul>` (6 `<li>` amb `<strong>` inicial) i comprova la menció d'«Edició avançada» i del selector d'àmbit («On es publica?»).
5. **Superfície 5 — `wordpress-plugin/includes/ajustos.php` (+ `socdepoble-enxufe.php` i `readme.txt`):**
   - Verifica la pujada a versió **`1.1.12`**, el selector de pestanyes dels **5 idiomes (`va`, `es`, `en`, `eu`, `gl`)**, la tipografia gran (`16px`–`17px`, `line-height: 1.65`), el desglossament d'etiquetes `<strong>` per idioma i la **Llei Canònica de Marca i Lema per Idioma**:
     - `va`: `Sóc de Poble. Portal de Pobles Connectats`
     - `es`: `Sóc de Poble. Portal de Pobles Connectats` (i **0 ocurrències** de `"Portal de Pueblos Conectados"` en tot el repositori)
     - `en`: `Sóc de Poble. Portal of Connected Villages`
     - `eu`: `Sóc de Poble. Konektatutako Herrien Ataria`
     - `gl`: `Sóc de Poble. Portal de Pobos Conectados`
6. **Verificació dels Tancaments d'Onada 4/5 (`D6-01`, `D6-03`, `D6-04`, `D6-06`, `D6-11`, `G-D-01`, `ARB-XAT-01`):**
   - Confirmats presents i en verd a l'arbre viu els 5 punts de les 4 skills (`D6-01`, `D6-06` a `core-context-panic`, `D6-03` a `core-secretaria-auditoria`, `D6-04` a `core-higiene-escriptori`, `D6-11` a `core-comprensio-reflexiva`) amb `node tooling/brain/fronteres-skills.mjs` a **`0` violacions i `0` avisos**, i `ARB-XAT-01` (`politicaPrivacitat23.migracio.test.js` **6/6** en verd).

#### 10.2 Guardes Tècniques Detectades per a la Integració Segura de `O6-CLAUDE` i `O6-CODEX`

1. **Guarda `SDP-RGPD-021` a `src/data/supabase/politicaPrivacitat23.migracio.test.js` (§18) sobre `legalContent.js`:**
   - Si s'aplica el kit d'enriquiment de `<strong>` de `O6-CODEX` sobre `src/sections/text/legalContent.js` a l'arbre viu, cal recordar que `politicaPrivacitat23.migracio.test.js` comprova que el SHA-256 de `legalContent.html` coincidisca byte a byte amb l'última migració de `supabase/migrations/*_politica_privacitat_*.sql`. Per tant, qualsevol canvi a `legalContent.js` ha d'anar acompanyat d'una migració append-only `261103xxxx_politica_privacitat_2_4.sql` (i rètol `Versió 2.4`), o mantindre's dins del kit CAS fins a segellar la migració `2.4`.
2. **Guarda d'atributs i entitats a `src/sections/plugins/presentacioPlugins.test.js`:**
   - En enriquir `GESTORIA` i `RSS` a `src/sections/plugins/presentacioPlugins.js`, no s'ha d'afegir cap `<h4>`, ni `<ul>`, ni atributs, ni entitats HTML (`&nbsp;`, etc.), ja que la línia 97 de `presentacioPlugins.test.js` exigeix `expect([...new Set(marques(html))].sort()).toEqual(['h3', 'p', 'strong'])`.

#### 10.3 Proposta d'Automillora d'Onada 6 (`prompt.local.s7`)

1. **Anàlisi Crítica del Prompt d'Onada 6:**
   - *«Si m'hagueres demanat l'enriquiment de `legalContent.js` advertint explícitament al prompt que `src/data/supabase/politicaPrivacitat23.migracio.test.js` (§18) exigeix crear alhora la migració `2.4` amb el nou `text_sha256` i que `presentacioPlugins.test.js` prohibeix `<h4>` dins de `presentacioPlugins.js` (on només s'admeten `<h3>`, `<p>` i `<strong>`), hauria sigut encara més eficient i evitaria qualsevol ensurt de pre-commit a Claude i Codex.»*
2. **Avaluació de Noves Funcionalitats i Flux de Treball del Trio Local:**
   - El nou tractor `audita-llegibilitat-editorial.mjs` pot connectar-se directament com a porta consultiva o estricta (`--strict`) abans de segellar `frontissa-contingut.mjs`, de manera que cap pàgina nova de `PAGE_COPY` o plugin didàctic puga entrar al repositori amb paràgrafs plans (`0` negretes) o sense respectar la Llei Canònica del Lema en els 5 idiomes.

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
# Resultat: Aplicats a l'arbre viu

# 9. Verificació Onada 4 Nocturna · O4-GEMINI-1 i O4-GEMINI-2 (Sub-Targetes + Doble Certificació d'Enllaços + Frontissa + Vitest)
cd /private/tmp/sdp-gemini-work && \
  node tooling/gates/frontissa-contingut.mjs && \
  node tooling/gates/certifica-enllacos.mjs && \
  node --test tests/certifica-enllacos.test.mjs tests/frontissa-contingut.test.mjs tests/opendata-fediversity.test.mjs && \
  NODE_PATH="/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules" npx vitest run \
    src/sections/text/TextSection.targetes.test.jsx \
    src/sections/text/pageContent.fediversity.test.js \
    src/sections/text/paginaDeText.test.js \
    src/sections/text/pageContent.paquet.test.js \
    src/sections/text/pageContent.roadmap.test.js \
    src/sections/text/pageContent.versions.test.js \
    src/sections/text/perAppNativa.test.js \
    src/config/firebaseHosting.test.js \
    src/data/iaiaLocal.atles.test.js \
    src/sections/text/legal.ubicacioFotos.test.js && \
  node tooling/gates/design_guard.mjs --arrel=src && \
  python3 ../_investigacio_ia_de_poble/261102_kit_gemini_onada4_continguts_tendencies_i_qa/verifica_i_aplica.py --check
# Resultat: Frontissa 16/16 aprovades; Certificador d'Enllaços 72/72 verificats (0 falles, Segell SHA-256 a8cb0ec483075601); 17/17 tests Node en verd; 10/10 suites Vitest (302/302 tests en verd); Design Guard 3030 fitxers (0 crítics, 0 avisos); CAS OK (7 fitxers verificats).

# 10. Verificació Onada 5 Nocturna · O5-GEMINI-1 i O5-GEMINI-2 (Dossier Apple Directe + Reconciliació Subtargeta + Auditoria O4)
cd /private/tmp/sdp-gemini-o5 && \
  node tooling/gates/frontissa-contingut.mjs && \
  node tooling/gates/certifica-enllacos.mjs && \
  node tooling/brain/fronteres-skills.mjs && \
  node --test tests/tractor-rls-r2-ddl.test.mjs && \
  NODE_PATH="/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules" npx vitest run \
    src/sections/text/TextSection.test.jsx \
    src/sections/text/TextSection.imatgeSocial.test.jsx \
    src/sections/text/TextSection.llengua.test.jsx \
    src/sections/text/TextSection.recursos.test.jsx \
    src/sections/text/TextSection.subtargeta.test.jsx \
    src/sections/text/TextSection.targetes.test.jsx \
    src/sections/text/pageContent.fediversity.test.js \
    src/sections/text/perAppNativa.test.js \
    src/components/universal/ambits/BlocAmbit.test.jsx \
    src/components/universal/identitat/CalaixIdentitats.test.jsx \
    tests/botigues.produccio.test.js && \
  python3 ../_investigacio_ia_de_poble/261103_kit_gemini_onada5_dossier_apple_directe_i_qa/verifica_i_aplica.py --check
# Resultat: Frontissa 16/16 aprovades; Certificador 79/79 OK; Fronteres de Skills 42 skills (0 violacions, 0 avisos); RLS R2 DDL 33/33 proves en verd; 11/11 suites Vitest (192/192 proves en verd); CAS OK (dossier=b670a453d542, 9/9 fitxers verificats).

# 11. Verificació Onada 6 · CARRIL 3 (O6-GEMINI: Tractor audita-llegibilitat-editorial.mjs + Proves Unitàries + Guardes RGPD i Plugins)
node --test _wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/audita-llegibilitat-editorial.test.mjs && \
  node _wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/audita-llegibilitat-editorial.mjs \
    --write-report _wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat && \
  npx vitest run src/data/supabase/politicaPrivacitat23.migracio.test.js src/config/versio.test.js src/sections/plugins/presentacioPlugins.test.js && \
  node tooling/brain/fronteres-skills.mjs && \
  node tooling/gates/porta-olivera.mjs
# Resultat: 6/6 tests Node del tractor en verd; radiografia de les 5 superfícies generada (INFORME_LLEGIBILITAT_EDITORIAL.md + radiografia-llegibilitat.json); 3/3 suites Vitest (64/64 tests en verd); Fronteres de Skills 0 violacions; Porta Olivera 0 errors.
```

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Per respectar estrictament la Matriu d'Exclusivitat de Carrils d'Onada 6 (`CARRIL 3 · O6-GEMINI`), aquest agent ha escrit únicament dins del seu carril autoritzat (`_wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/` i `_wiki_de_poble/04_escriptori/261102_1832_auditoria_gemini.md`), sense tocar els fitxers d'escriptura exclusiva de `O6-CLAUDE` (`pageContent.js`, `presentacioPlugins.js`, `appSeed.js`, `package.json`) ni de `O6-CODEX` (`wordpress-plugin/`, `legalContent.js`).
- A mesura que `O6-CLAUDE` i `O6-CODEX` completen la injecció de negretes i l'actualització a `v1.1.0` / `v1.1.12`, es pot tornar a llançar en qualsevol instant `node _wiki_de_poble/04_escriptori/02_investigacio_ia/261103_kit_gemini_onada6_auditoria_llegibilitat/audita-llegibilitat-editorial.mjs --strict` per certificar el `0` de paràgrafs plans en totes les superfícies.
- No queda cap temporitzador, cron ni procés en segon pla actiu.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
