---
type: document
status: canonic
description: Pla d'Implementació canònic per assolir el 10/10 en les 15 Dimensions de la Matriu Universal (D01-D15) i tancar el deute tècnic pendent amb Claude Opus 5.5 i els kits de suport de Gemini i GPT Codex
tags:
  - implementacio
visibility: private
reflex: sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:ab2d5904-cafc-4082-853c-a4f4b9b9d481
---
# PLA D'IMPLEMENTACIÓ: ASSALT A L'EXCEL·LÈNCIA 10/10 EN LES 15 DIMENSIONS I TANCAMENT DEL DEUTE DEL LLIBRE MESTRE

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:ab2d5904-cafc-4082-853c-a4f4b9b9d481 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T11:46:25.202Z |
| Modificació | 2026-11-01T11:48:00.000Z |
| Propietari | agent-local |
| Aprovació humana | Mestre Javi Llinares (2026-11-01 12:42 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA (Orquestradora) + Claude Opus 5.5 + GPT Codex 6.1 Sol + Gemini 4 Argon High |
| Tokens consumits | ~38.000 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-11-01T11:46:25.202Z: esborrany creat per `document.mjs create`.
- 2026-11-01T11:48:00.000Z: completat amb l'anàlisi exhaustiva dels tres dictàmens de la Marató Nocturna (`261101_0409_auditoria_claude.md`, `261101_0403_auditoria_codex_marato_nocturna.md` i `261101_0407_auditoria_gemini_marato_nocturna.md`) per elevar les **15 Dimensions (`D01`–`D15`) al `10/10` real** abans d'enviar qualsevol correu a NLnet Fediversity (`2026-08-1a6`).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)

La Marató Nocturna (`261101_0311`) ha completat i verificat `27.243` tests sobre `755` fitxers (0 fallades), l'esquema OKF v0.2, la barra i el cartell reversiu del Bloc de Notes (`IDEA-59` / `P1-72`), l'exportador BagIt v1.0 (`exportaMunicipiOpenData.js`), la fase 1 de WebFinger/NodeInfo/ActivityPub (`genera-federacio.mjs`), les traduccions inicials de `eu.js` i `gl.js` i la desconnexió d'SDKs externs quan no tenen clau.

Tanmateix, les qualificacions rigoroses i conservadores de **Claude Opus 5.5** (`4.5` a `8.5/10`) i **GPT Codex 6.1 Sol** (`4.5` a `8.0/10`) en les **15 Dimensions (`D01`–`D15`)** mostren exactament què falta en codi viu per assolir el **`10/10` honest i verificable**:

| Dimensió | Nota Claude / Codex | Què falta exactament per al `10/10` real (Troballes consolidades de Claude, Codex i Gemini) |
| :--- | :---: | :--- |
| **`D01` · Port Neutral i Model B** | `8.5` / `7.5` | Implementar el **segon adaptador complet** (`src/data/local/adaptadorLocal.js` sobre memòria/IndexedDB/JSON) que passe les 30+ proves de `src/data/conformitat/kit.js`, i propagar `AbortSignal` real i límit de peticions en vol a `src/data/supabase/storage.js` (`upload`, `sign`, `remove` — `P1-27`). |
| **`D02` · Pedra Seca i Geometria HD** | `8.5` / `7.5` | Reduir a **`0 avisos`** `node tooling/gates/design_guard.mjs --arrel=src` (actualment 9 avisos en `UniversalToolbar.jsx`, `MarkdownViewer.jsx`, `PageDetailSection.jsx`, `MarketDetailSection.jsx`, `PostDetailSection.jsx`, `TownDetailSection.jsx`, `UniversalDetailView.jsx`, `WikiDePobleSection.jsx` i `parseMarkdown.js`, sense trencar `sanitize.test.js`), arreglar el tall de paraules a `1024px` en Columna 1 i tancar `P1-28`. |
| **`D03` · Accessibilitat Rural AAA** | `7.5` / `6.5` | Tancar `P1-15` i `P1-22`: noms accessibles (`aria-label`/`aria-labelledby`), regions `aria-live="polite"`, gestió de focus en modals (`ConnectarSection.jsx`, `GestioMembres.jsx`, `DialegEnquadrament.jsx`, `DetallPrivacitat.jsx`), `tabIndex={0}` + rol accessible al wrapper de taules de `parseMarkdown.js` (`P2-16`) i bateria de tests d'arbre d'accessibilitat per a lector de pantalla. |
| **`D04` · Sobirania i Open Data Municipal** | `7.5` / `7.0` | Afegir lectura pública anònima de `noticies`, `agenda` i `memoria-cultural` al port/adaptadors perquè `recullDadesPubliquesDelMunicipi` (`src/data/exportaMunicipiOpenData.js`) exporte col·leccions reals (no sols el directori), incloure les fitxes OKF v0.2 revisades al paquet BagIt, i crear l'**Importador/Restaurador Municipal (`src/data/importaMunicipiOpenData.js`)** amb verificació SHA-256 de `manifest-sha256.txt` i test round-trip complet. |
| **`D05` · Federació Oberta (ActivityPub / NodeInfo / WebFinger)** | `5.5` / `4.5` | Crear el mòdul de **Fase 2 d'ActivityPub (`src/data/federacio/inboxActivityPub.js`)**: resolució dinàmica de WebFinger per paràmetre `?resource=acct:...`, verificació criptogràfica d'HTTP Signatures (`rsa-sha256` / `ed25519`), processament idempotent d'activitats entrants (`Follow` → `Accept`, `Create`, `Delete`, `Announce` d'alerta d'emergència municipal) i poblar l'`outbox` de `public/federacio/outbox/la-torre-de-les-macanes.json` amb ítems públics reals (`totalItems > 0`). |
| **`D06` · Enxufabilitat Universal (WordPress.org)** | `8.0` / `8.0` | Pujar el connector a **`v1.1.11`** (`wordpress-plugin/soc-de-poble.php` i `wordpress-plugin/readme.txt`), propagar l'idioma de l'atribut `lang` a `wordpress-plugin/includes/marcatge.php` (`TE-05`) i suportar mini-Markdown bàsic dins del detall `<details>` de `wordpress-plugin/includes/renderitzador.php`. |
| **`D07` · Replicabilitat de Nodes Germans (< 15 min)** | `6.0` / `6.0` | Corregir el **`[DEFECTE]` (`D-13`)** a `tooling/seo/genera-federacio.mjs` i `tooling/instalador/inicia-node-germa.mjs`: llegir `node-germa.json` (si existeix o per flag `--config`) perquè un node germà nou (ex. Xixona) genere el seu propi actor ActivityPub, WebFinger, Outbox i NodeInfo 2.1, amb prova d'extrem a extrem d'inicialització + federació pròpia. |
| **`D08` · Privacitat, RLS/RGPD i E2EE** | `7.5` / `6.5` | Completar la integració d'E2EE opt-in verificable al xat (`P1-12` a `src/sections/xat/XatContext.jsx` i `src/sections/xat/e2ee/sessioXat.js`), connectar la UI de recuperació social Shamir $k=3$ (`IDEA-48` a `src/sections/profile/DetallPrivacitat.jsx`) i tancar `P1-13` (`C11-03` cursa concurrent de membresia i `C11-05` projecció de contacte públic). |
| **`D09` · Sistema de Notes i Karpathy Local (OKF v0.2)** | `8.0` / `7.5` | Permetre afegir/editar etiquetes (`tags`) i triar/escriure el poble amb resolució d'àlies bilingües/populars (*Jijona* → `xixona`, *Torremanzanas* / *la Torre* → `la-torre-de-les-macanes`, etc.) a `src/sections/notes/FitxaMemoriaOral.jsx` (`D-5`), i fixar la Card tutorial de la mà amb la ploma sempre com a primera fila de la vista `Tot` (`D-4`). |
| **`D10` · Memòria Oral, Patrimoni i Multimèdia Local** | `6.5` / `7.0` | Connectar el pipeline complet **Àudio/Transcripció → Fitxa OKF v0.2 → Exportació al paquet Open Data municipal → Restauració round-trip**, i estendre el blindatge HMR de `useIdentitatOpcional()` (`D-7` / `P1-71`) a Mur, Notes i Xat amb reserva anònima de només lectura. |
| **`D11` · Comunicació Comunitària i Xat Rural** | `7.5` / `6.5` | Endurir `pot_signar_com_organitzacio` per verificar pertinença estricta al mateix `town_id` (`D-6`), afegir rellotge reactiu d'expiració en temps real a `src/sections/xat/components/AlertaMunicipal.jsx`, aplicar el `padding` harmònic pendent a la llista de converses (`P1-67`) i elevar el límit d'imatges/captures de pantalla d'adjunts del xat a `2048px` (`IDEA-36` a `src/sections/xat/adjuntLocal.js`). |
| **`D12` · Multilingüisme Natiu i Traductor Sobirà** | `7.5` / `7.0` | Tancar `TE-02` (afegir les **24 claus `t()` absents** als 5 diccionaris `ca`, `es`, `en`, `eu`, `gl`), `TE-05` (passar l'idioma de l'atribut `lang` de `src/natiu/entrada.jsx` i `wordpress-plugin/includes/marcatge.php` cap a `UIContext.jsx`), `TE-01` (internacionalitzar les cadenes i dates hardcoded a `src/sections/profile/DetallPrivacitat.jsx`) i polir `eu.js` / `gl.js`. |
| **`D13` · Botigues Mòbils (App Store / Google Play) i PWA** | `5.0` / `5.5` | Ocultar o desactivar el botó *Sign in with Apple* a iOS quan el proveïdor OAuth d'Apple no està actiu (`D-10` / `BOT-A3` a `src/sections/register/RegisterSection.jsx` i components d'accés, evitant rebuig per Guideline 2.1), unificar l'edat mínima legal a `16+` anys en textos legals i fitxes de botigues, i aplicar els pegats de `versio.js` i `preflight-botigues.mjs` (`P0-23`). |
| **`D14` · Governança Algorítmica, Telemetria i Consola** | `7.5` / `7.0` | Implementar `tooling/gates/tractor-vigilant.mjs` executable amb eixida JSON (`IDEA-13`), afegir l'estat additiu de recepció HTTP verificada (`estatRecepcio: 'pendent' | 'acceptat' | 'fallit'`) a `src/config/telemetria.js` (`P2-14` sense trencar l'API síncrona `enviat: true`) i actualitzar la capçalera de `/versions` (`D-12`). |
| **`D15` · Rendiment, Lleugeresa i Resiliència Rural** | `6.0` / `6.0` | Extreure `src/data/wikiManifest.js` (`578 KB`, `200 KB` gzip) a càrrega diferida (`import()` dinàmic a les vistes de la Wiki) i configurar `manualChunks` a `vite.config.js` perquè el bundle principal d'entrada baixe de `403 KB` gzip a **`< 250 KB` gzip** (`P1-20`), més compactació higienitzada del bloc d'arrencada (`P2-15`). |

---

### 2. Preguntes Obertes Resoltes per la Directora Tècnica (`D-1` a `D-13` de `261101_0409_auditoria_claude.md`)

Per ordre expressa del Mestre Javi Llinares (delegació d'autoritat de direcció tècnica autònoma), totes les decisions obertes de l'informe de Claude queden resoltes així perquè cap IA s'ature ni traiga botons:
- **`D-1` (Correu NLnet Fediversity):** **NO enviar encara.** Primer executem aquest assalt al `10/10` de les 15 dimensions i deixem l'esborrany actualitzat amb les noves fites reals assolides.
- **`D-2` (`design_guard.mjs` vs `sanitize.test.js`):** Calibrar `tooling/gates/design_guard.mjs` perquè reconega wrappers semàntics legítims documentats (o classes d'encapçalament canòniques) sense exigir destruir l'etiqueta `<h2>` exigida per `sanitize.test.js`, i corregir els components restants fins que `node tooling/gates/design_guard.mjs --arrel=src` done **`0 errors i 0 avisos`**.
- **`D-3` (Lectura pública a `exportaMunicipiOpenData.js`):** Autoritzat afegir lectura pública anònima de les col·leccions obertes del municipi (`noticies`, `agenda`, `memoria-cultural` i fitxes `okf-v0.2` públiques) tant a `backendPort.js` com a l'adaptador Supabase i al nou adaptador local.
- **`D-4` (Card tutorial a `/notes`):** Autoritzat fixar la Card explicativa de la mà amb la ploma sempre com a primera fila de la vista `Tot` mentre no estiga arxivada.
- **`D-5` (Etiquetes i àlies de poble a `FitxaMemoriaOral.jsx`):** Autoritzat afegir camp d'etiquetes lliures i selector/cercador de municipi amb diccionari d'àlies oficials i populars (*Jijona* → `xixona`, *Torremanzanas* / *la Torre* → `la-torre-de-les-macanes`, *Ibi*, *Tibi*, *Castalla*, *Onil*, *Biar*, *Alcoi*, *Alacant*, *València*).
- **`D-6` (`pot_signar_com_organitzacio`):** Autoritzat restringir l'emissió d'alertes municipals al mateix `town_id` de l'organització.
- **`D-7` (Reserva anònima HMR a Mur, Notes i Xat):** Autoritzat usar `useIdentitatOpcional()` amb reserva anònima de només lectura per evitar pantalles d'error en recàrregues HMR.
- **`D-8` (Avatar de Javi Llinares):** Mantindre `javi-llinares-256x256.jpg` (16 KB) per a les llistes i bombolles del xat i la foto gran per a la fitxa de perfil.
- **`D-9` (`eu.js` i `gl.js`):** Autoritzat completar les 24 claus de `TE-02` i revisar la naturalitat de basc i gallec.
- **`D-10` (*Sign in with Apple* a iOS):** Autoritzat ocultar el botó d'Apple quan el proveïdor OAuth d'Apple no estiga actiu (governat per flag de configuració `VITE_APPLE_OAUTH_ACTIU`), eliminant el risc de rebuig per Guideline 2.1.
- **`D-11` (`wordpress-plugin` `v1.1.11`):** Autoritzat pujar versió a `1.1.11` a `soc-de-poble.php` i `readme.txt`.
- **`D-12` (Capçalera `/versions`):** Autoritzat actualitzar la capçalera de `/versions` a `pageContent.js`.
- **`D-13` (`genera-federacio.mjs` i `inicia-node-germa.mjs`):** Autoritzat corregir `genera-federacio.mjs` perquè accepte un fitxer de configuració de node germà (`--config` o `node-germa.json`) i genere l'actor, WebFinger, Outbox i NodeInfo propis del municipi instal·lat.

---

### 3. Canvis Proposats i Repartiment en 3 Carrils Sense Col·lisió

#### Carril 1 · Claude Opus 5.5 (Executora Principal al Repositori Viu `socdepoble.org/`)
*(Recomanació operativa per al Mestre: com que la sessió actual de Claude està al 81% de context tancant la revisió dels commits `C1..C4`, un colp acabe eixos commits convé obrir una sessió neta al 0% o continuar si té marge, llançant-li aquest prompt).*

- **`[NEW]` `src/data/local/adaptadorLocal.js` + `[MODIFY]` `src/data/backendPort.js`, `src/data/supabase/storage.js`, `src/data/conformitat/kit.js` (`D01` · `10/10`):**
  - Implementar el segon adaptador complet (`adaptadorLocal.js` en memòria/IndexedDB determinista) que implemente tots els dominis de `CONTRACTE_BACKEND` i passe el 100% de `executaKitConformitat`.
  - Propagar `AbortSignal` real i límit de concurrència en vol a `src/data/supabase/storage.js` (`upload`, `sign`, `remove` — `P1-27`).
- **`[NEW]` `src/data/importaMunicipiOpenData.js` + `[MODIFY]` `src/data/exportaMunicipiOpenData.js` (`D04` & `D10` · `10/10`):**
  - Ampliar `recullDadesPubliquesDelMunicipi` per exportar `noticies`, `agenda`, `memoria-cultural` i fitxes de memòria oral `okf-v0.2` públiques/revisades.
  - Crear `importaMunicipiOpenData.js` capaç de validar `bagit.txt`, recalcular i verificar tots els SHA-256 de `manifest-sha256.txt`, validar l'esquema de cada col·lecció i restaurar el municipi en qualsevol adaptador compatible amb `backendPort.js`, amb test round-trip complet (`exporta → verifica SHA-256 → importa en adaptadorLocal → compara identitat`).
- **`[NEW]` `src/data/federacio/inboxActivityPub.js` + `[MODIFY]` `tooling/seo/genera-federacio.mjs`, `tooling/instalador/inicia-node-germa.mjs` (`D05` & `D07` · `10/10`):**
  - Implementar en `inboxActivityPub.js` la resolució dinàmica de WebFinger (`resolveWebFingerAcct`), verificació de signatures HTTP (`verificaSignaturaHttpActivityPub` amb WebCrypto / Node `crypto`) i processador idempotent d'activitats ActivityPub (`processaActivitatInbox`: `Follow` → `Accept`, `Create`, `Delete`, `Announce` d'alerta d'emergència municipal).
  - Poblar `outbox` a `genera-federacio.mjs` amb activitats `Create` reals de les pàgines/notícies públiques del municipi (`totalItems > 0`).
  - Corregir el defecte `D-13` a `genera-federacio.mjs` i `inicia-node-germa.mjs` perquè qualsevol node germà (ex. Xixona) genere el seu propi actor ActivityPub, WebFinger, Outbox i NodeInfo 2.1.
- **`[MODIFY]` `vite.config.js`, `src/data/wikiManifest.js`, `src/sections/wikidepoble/WikiDePobleSection.jsx` (`D15` · `10/10`):**
  - Carregar `wikiManifest.js` de forma diferida (`lazy` / `import()`) i ajustar `manualChunks` a `vite.config.js` perquè el chunk principal d'entrada baixe de `< 250 KB` gzip (`P1-20`).
- **`[MODIFY]` `src/sections/notes/FitxaMemoriaOral.jsx`, `src/sections/notes/NotesSection.jsx`, `src/app/contexts/CoreContentContext.jsx` (`D09` & `D10` · `10/10`):**
  - Afegir editor d'etiquetes (`tags`) i selector de municipi amb resolució d'àlies (`Jijona`, `Torremanzanas`, `la Torre`, etc.) a `FitxaMemoriaOral.jsx` (`D-5`).
  - Fixar la Card tutorial de la mà amb la ploma al capdamunt de la vista `Tot` (`D-4`).
  - Estendre el blindatge HMR de `useIdentitatOpcional()` a Mur, Notes i Xat (`D-7`).
- **`[MODIFY]` `src/sections/xat/XatContext.jsx`, `src/sections/xat/e2ee/sessioXat.js`, `src/sections/profile/DetallPrivacitat.jsx`, `src/sections/xat/components/AlertaMunicipal.jsx`, `src/sections/xat/adjuntLocal.js`, `supabase/migrations/` (`D08` & `D11` · `10/10`):**
  - Completar el commutador E2EE opt-in per conversa i la interfície de custòdia social Shamir $k=3$ (`P1-12` / `IDEA-48`), més les garanties de `P1-13` (`C11-03` i `C11-05`).
  - Restringir `pot_signar_com_organitzacio` al mateix `town_id` (`D-6`), afegir comptador d'expiració en viu a `AlertaMunicipal.jsx` i elevar les captures del xat a `2048px` (`IDEA-36`).
- **`[MODIFY]` `wordpress-plugin/soc-de-poble.php`, `wordpress-plugin/readme.txt`, `wordpress-plugin/includes/marcatge.php`, `wordpress-plugin/includes/renderitzador.php` (`D06` · `10/10`):**
  - Pujar el connector WordPress a `v1.1.11`, propagar `lang` al Web Component (`TE-05`) i renderitzar mini-Markdown al detall desplegable.
- **`[NEW]` `tooling/gates/tractor-vigilant.mjs` + `[MODIFY]` `src/config/telemetria.js`, `src/sections/register/RegisterSection.jsx`, `src/config/versio.js`, `tooling/botigues/preflight-botigues.mjs`, `src/sections/text/pageContent.js` (`D13` & `D14` · `10/10`):**
  - Crear `tooling/gates/tractor-vigilant.mjs` (`IDEA-13`), afegir estat additiu de recepció HTTP verificada a `telemetria.js` (`P2-14`), ocultar *Sign in with Apple* quan no estiga actiu (`D-10`), unificar edat `16+` i integrar els kits de Gemini i Codex.

#### Carril 2 · GPT Codex 6.1 Sol (IA de Suport d'Enginyeria de Dades, Federació i Conformitat a `../_investigacio_ia_de_poble/261101_kits_10_10/codex/`)
- Sense tocar `src/`, `public/`, `supabase/`, `tooling/` ni `wordpress-plugin/` en viu, Codex construeix un **Kit d'Integració Directa (`../_investigacio_ia_de_poble/261101_kits_10_10/codex/`)** amb `verifica_i_aplica.py` (mode `--check` i `--apply`) + pegats `.patch` i tests unitaris llestos perquè Claude els integre:
  1. `adaptador-local-conformitat.patch` (`D01`: segon adaptador complet + tests de conformitat + `AbortSignal` de storage).
  2. `open-data-restaurador-roundtrip.patch` (`D04` & `D10`: `importaMunicipiOpenData.js` amb verificació SHA-256 i round-trip incloent fitxes OKF v0.2).
  3. `activitypub-fase2-i-node-germa.patch` (`D05` & `D07`: `inboxActivityPub.js` amb HTTP Signatures + correcció `D-13` de `genera-federacio.mjs` i `inicia-node-germa.mjs` + outbox poblat).
  4. `e2ee-shamir-i-alerta-tenant.patch` (`D08` & `D11`: validació de `pot_signar_com_organitzacio` per `town_id`, caducitat d'alerta i proves E2EE/Shamir).
- I actualitza el seu dictamen `_wiki_de_poble/04_escriptori/261101_0403_auditoria_codex_marato_nocturna.md` reavaluant les 15 dimensions conforme Claude i el seu propi kit tanquen cada bretxa.

#### Carril 3 · Gemini 4 Argon High (IA de Suport de Pedra Seca `0 avisos`, Accessibilitat AAA i Internacionalització 5 Llengües a `../_investigacio_ia_de_poble/261101_kits_10_10/gemini/`)
- **Regla d'Or Anti-Popups per a Gemini:** Prohibició absoluta d'usar `<<'PY'` (heredocs) o redireccions bash `>` que disparen el filtre `guarda-reflex`. Gemini ha d'usar **exclusivament** les seues eines natives `write_file` i `edit_file`.
- Sense tocar el codi viu, Gemini construeix a `../_investigacio_ia_de_poble/261101_kits_10_10/gemini/` un **Kit d'Integració Directa (`verifica_i_aplica.py` + pegats `.patch`)** per a Claude:
  1. `pedra-seca-zero-avisos.patch` (`D02`: deixar `tooling/gates/design_guard.mjs --arrel=src` en **0 errors i 0 avisos** resolent els 9 avisos sense trencar `sanitize.test.js`, més el fix de tall de paraules a `1024px`).
  2. `i18n-te01-te02-te05-complet.patch` (`D12`: les **24 claus de `TE-02`** traduïdes amb qualitat nativa a `ca.js`, `es.js`, `en.js`, `eu.js` i `gl.js`, més `TE-01` de `DetallPrivacitat.jsx` i `TE-05` de `src/natiu/entrada.jsx` i `wordpress-plugin/includes/marcatge.php`).
  3. `a11y-aaa-lector-pantalla.patch` (`D03`: noms accessibles, regions `aria-live`, focus de diàlegs en `ConnectarSection.jsx`, `GestioMembres.jsx`, `DialegEnquadrament.jsx`, `DetallPrivacitat.jsx` i wrapper de taules de `parseMarkdown.js`).
  4. `botigues-apple-guard-i-tractor-vigilant.patch` (`D13` & `D14`: ocultació condicional de *Sign in with Apple* a iOS, unificació `16+` i `tractor-vigilant.mjs`).
- I actualitza el seu dictamen `_wiki_de_poble/04_escriptori/261101_0407_auditoria_gemini_marato_nocturna.md` verificant el pas cap al `10/10`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `node tooling/gates/design_guard.mjs --arrel=src` → **0 errors i 0 avisos** (reduït des dels 9 avisos actuals).
2. `npm run build` → Bundle d'entrada principal **`< 250 KB` gzip** amb `wikiManifest.js` en chunk diferit.
3. `npx vitest run` → 100% dels tests en verd (superant els `27.243` tests actuals amb les noves bateries de `adaptadorLocal`, `importaMunicipiOpenData`, `inboxActivityPub`, `genera-federacio` per a node germà, `FitxaMemoriaOral` amb àlies i tags, `TE-01`/`TE-02`/`TE-05` i `tractor-vigilant.mjs`).
4. `node tooling/seo/genera-federacio.mjs` + test amb `node-germa.json` de Xixona → `outbox` amb `totalItems > 0` i actor propi per a cada node germà.
5. `node tooling/gates/tractor-vigilant.mjs` → eixida JSON vàlida amb `exit 0`.
6. `node tooling/gates/porta-olivera.mjs`, `node tooling/gates/verificador-scc.mjs` i `node tooling/gates/porta-documents.mjs --all` → `exit 0`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Saturació de context de la sessió actual de Claude (`81%`):** La sessió activa de Claude està tancant la revisió dels commits `C1..C4` de la marató nocturna. **Mitigació:** El Mestre pot deixar que Claude acabe de presentar o aplicar els commits `C1..C4` i llançar el nou prompt en una sessió fresca (o en la mateixa si encara té marge), mentre Gemini i Codex comencen immediatament a pre-assemblar els seus kits a `../_investigacio_ia_de_poble/261101_kits_10_10/`.
- **Col·lisió d'arxius entre les 3 IAs:** **Mitigació:** Es manté l'arquitectura d'aïllament estricte: només Claude toca el codi viu de `socdepoble.org/`; Codex i Gemini escriuen exclusivament als seus subdirectoris de `../_investigacio_ia_de_poble/261101_kits_10_10/` i al seu propi informe d'auditoria a `_wiki_de_poble/04_escriptori/`.
- **Popups de permisos a Gemini:** **Mitigació:** Prohibició explícita al prompt de Gemini d'usar heredocs (`<<'PY'`) o redireccions bash; ús obligatori de `write_file` i `edit_file`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261101_0409_auditoria_claude]]
- [[261101_0403_auditoria_codex_marato_nocturna]]
- [[261101_0407_auditoria_gemini_marato_nocturna]]
