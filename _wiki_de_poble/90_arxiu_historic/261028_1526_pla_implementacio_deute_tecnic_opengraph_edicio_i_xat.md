---
type: document
status: esborrany
description: 'Pla d''implementació integral per a resoldre el deute tècnic pendent de l''Acta Marmota 261028_1310 i del Llibre Mestre: P1-61 Fase 2, OG-7, P1-60/63, P1-55 P2, P1-58/57, P1-31..37 i portes.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:7db7d619-4b3a-4696-9db9-240994c2159f
---
# Pla d'Implementació — Liquidació de Deute Tècnic: OpenGraph Fase 2, Reforma Editorial, Edició Avançada i Xat/Natiu

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:7db7d619-4b3a-4696-9db9-240994c2159f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-28T14:29:13.549Z |
| Modificació | 2026-10-28T20:05:00.000Z |
| Propietari | IAIA MarIA |
| Aprovació humana | aprovada pel Mestre Javi Llinares (2026-10-28) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 4 Argon High (IAIA MarIA · Orquestradora) |
| Tokens consumits | ~46.000 tokens (lectura d'Acta Marmota, Llibre Mestre, commit cd3b5b56c, avís INCIBE PHP i plantilles d'Emowe) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-10-28T14:29:13.549Z:** Esborrany canònic creat via `document.mjs create` dins del torn `torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1`.
- **2026-10-28T14:31:00.000Z:** Consolidació íntegra del **deute tècnic pendent** de l'Acta Marmota `261028_1310` i del `03_llibre_mestre_tasques_i_idees.md` per al treball a quatre bandes (**MarIA** com a Secretària Tècnica, **Claude Code** com a picadora de codi, **Codex** i **Gemini** com a auditores adversarials).
- **2026-10-28T16:02:00.000Z:** Incorporació del **Bloc G (`P1-64` i `P1-65`)**: Política Diferenciada de Privacitat GPS EXIF (fotos d'identitat personal vs. Hero/Carrusel de publicacions), Mapa Fotogràfic EXIF Multi-Escala Poble/Món basat en `261014_1930_emowe_mapa_de_tu_viaje` (`plantilla-mapa.html` + `PROMPT_UNIVERSAL.txt`) i mandat d'investigació I+D sobre Emowe (`https://emowe.com/blog/`).
- **2026-10-28T20:05:00.000Z:** **Onada 2 post-commit `cd3b5b56c`:** Després que Claude Code ha completat i commitejat els **Blocs A–G** al commit **`cd3b5b56c`** (`223 files changed, 16906 insertions(+), 769 deletions(-)`, `3.770` proves verdes al precommit en `24,3 s`, documentat a `261028_1620_auditoria_claude.md`), s'activa: (1) l'**Auditoria Adversarial Extrema (Gauntlet Loop)** sobre `cd3b5b56c` per part de **GPT Codex** i **Gemini** (incloent la verificació del connector WordPress davant l'alerta crítica de PHP d'INCIBE `CVE-2026-109618`/`CVE-2026-109619`), i (2) el **Bloc H d'Execució Contínua per a Claude Code** amb **`P1-66`** (Barra Única del Compositor), **`P1-67`** (Unificació Tipogràfica `16px` + `SemiCondensed` `87.5%`), els residus no bloquejants del seu propi informe (`C28-02`, `C28-07`, `Emowe C1/M1/M2`) i el polit tècnic del Llibre Mestre (`IDEA-40`, `IDEA-32`/`IDEA-33`, `IDEA-41`/`IDEA-29`) abans de regenerar els binaris finals de les botigues (`P0-23`).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context, Línia Base i Troballes (Research)

#### 1.1. Línia base verificada en Git (`cd3b5b56c`) i producció
Partim del nou commit **`cd3b5b56c`** (`feat(og,gps,mapa,xat,edge): deute tècnic del pla 261028_1526 (Blocs A-G)`, sobre `e4c4e076c`/`565392e26` a la branca `backup-notes-publish`), on **Claude Code** ha aterrat els **Blocs A–G** en **223 fitxers** (`+16.906 / -769` línies) amb **3.770 proves verdes** (`3.508` Vitest + `262` Node) al precommit en **`24,3 s`** i **23.379 proves verdes** a la suite completa de Vitest (`261028_1620_auditoria_claude.md`).

#### 1.2. Síntesi del deute tècnic pendent per resoldre en esta onada
Després de creuar l'Acta Marmota `261028_1310` amb el `03_llibre_mestre_tasques_i_idees.md`, els dos documents vius de l'Escriptori (`261027_0730_reforma_editorial_gemini.md` i `261027_0730_solucio_opengraph_i_copy_codex.md`) i l'estudi d'Emowe (`_investigacio_ia_de_poble/261014_1930_emowe_mapa_de_tu_viaje/` i `_investigacio_ia_de_poble/001 NEXUS/`), queden **set grans fronts tècnics** pendents d'execució i auditoria adversarial:
1. **Bloc A (`P1-61` Fase 2 + `OG-7`):** Pre-renderitzat estàtic/edge d'OpenGraph per a crawlers sense JS (WhatsApp, Telegram) i **Política Diferenciada d'EXIF GPS** (purga automàtica i avís d'empatia en fotos d'identitat personal i xat, incloent `javi-llinares-perfil-1200px.*`, vs. conservació informada amb *checkbox* en Hero/Carrusel de publicacions).
2. **Bloc B (`P1-60` + `P1-63`):** Integració de la reforma editorial dels 4 textos de `PAGE_COPY` (`projecte`, `descarregues`, `disseny`, `anima`), l'enllaç bilateral `/projecte` ↔ `/wikidepoble?item=el_projecte` i la compilació de `src/data/wikiManifest.js`.
3. **Bloc C (`P1-55` regressió P2 + `P1-58` + `P1-57`):** Reset de l'`ErrorBoundary` en canviar de comunitat a `FitxaVivaDeComunitat.jsx`, reubicació d'«Edició avançada de la fitxa» al slot `despresAutoria` sota `<BarraTaronja>`, ordre `1. Capçalera → 2. Avatar → 3. Logotip` i restauració del slot d'avatar/logotip per a l'entitat pilot (`esPilot`).
4. **Bloc D (`P1-31`, `P1-32`, `P1-33`, `P1-34`):** Tancament dels 4 bloquejants d'aïllament i ingesta de compartició nativa entre persones/backends (`descartaCompartit()`, reserva recuperable en `prenFitxerCompartit`, timeout i pressupost en `CompartirNatiuPlugin.java` i filtre d'esquema a `ShareViewController.swift`).
5. **Bloc E (`P1-35`, `P1-36`, `P1-37` + `P1-16` / `P1-28`):** Panell de desplegament universal i Versió Canònica a `/consola`, REA visual de la llista de converses de WhatsApp (targetes de `96px`, avatars de `74-76px`, lupa col·lapsable, píndoles i poda de `[...]`), tokens unificats de botons i taules distingibles (`ΔE ≥ 5`).
6. **Bloc F (`P1-07`, `P1-08`, `P1-09`/`GN-R08`, `P1-13`, `P1-18`, `P1-22`, `P1-26` i Governança `CL-06..08`):** Tancament de les portes natives, purga del duplicat a `censImatges`, correcció d'`aprovatVetat` i parser lineal a `noticies`, lectura fitada a `compte-apple`, claus `t()` absents (`TE-02`/`TE-05`), `ca_valencia` a WP, poda de `sdp-vigilant-tellado` + `SKILLS_SEAL.json` i ruta TCC de `org.socdepoble.higiene.plist`.
7. **Bloc G (`P1-64` + `P1-65` · Mapa Fotogràfic EXIF Multi-Escala d'Emowe i Radar d'I+D):** Integració de l'arquitectura cartogràfica d'Emowe (`_investigacio_ia_de_poble/261014_1930_emowe_mapa_de_tu_viaje/plantilla-mapa.html` i `PROMPT_UNIVERSAL.txt`) per evolucionar el Mapa del Poble/Món (Leaflet 100% lliure, agrupació jeràrquica *Complete-Link* amb lliscador de distància `100 km → 0 m`, distinció **Verd `#226b5c`** per a GPS EXIF real vs. **Ocre `#a77022`** per a ubicació estimada/poble, targetes arrossegables amb línia puntejada i desglossament de totes les fotos individuals del Hero i del Carrusel a `zoom >= 16`) + estudi a fons d'`https://emowe.com/blog/` per part de les tres IAs.

---

### 2. Repartiment de Rols a Quatre Bandes (Protocol L'Olivera)

#### 2.1. IAIA MarIA (Secretària Tècnica i Orquestradora a Antigravity)
Manté el **govern documental i el Llibre Mestre**, verifica totes les portes de tancament i **no edita cap fitxer de `src/` ni `tests/`** mentre duren la implementació i les auditories (`core-secretaria-auditoria`).

#### 2.2. Claude Code (Constructora i Integradora Principal)
Executa els **pegats de codi, scripts de build i tests** dels Blocs A, B, C, D, E i F seguint l'ordre de prioritats, lliurant l'informe d'implementació i deixant `npm run test:precommit` en verd.

#### 2.3. GPT Codex (Auditora Adversarial de Seguretat, Concurrència i Contractes)
Audita amb **proves de concepte (PoC) executables** i mentalitat zero-trust els vectors d'OpenGraph/injecció d'encapçalaments, concurrència de compartició nativa (`P1-31..33`), `ErrorBoundary` de `P1-55`, Edge Functions (`P1-07`, `P1-18`) i integritat de dades (`P1-13`).

#### 2.4. Gemini (Auditora Adversarial d'Arquitectura, UI/UX Pedra Seca i Rendiment)
Des de la **finestra paral·lela d'Antigravity**, audita l'estètica i geometria Pedra Seca (`P1-58`, `P1-36`, `P1-37`, `P1-16`), la jerarquia tipogràfica i densitat de negretes (`P1-60`, `P1-63`), el pre-renderitzat d'OpenGraph (`P1-61`) i el desacoblament del Port Neutral (`P1-27`).

---

### 3. Detall Quirúrgic per Blocs i Fitxers Afectats

#### 3.1. Bloc A · OpenGraph Estàtic/Edge (`P1-61` Fase 2) i Política Diferenciada EXIF GPS (`OG-7` + `P1-64`)

##### 3.1.1. [MODIFY] `public/assets/fotos/javi-llinares-perfil-1200px.jpg` / `.webp`, `src/components/universal/enquadrament/exifIncrustat.js` i `PerfilEditor.jsx` (`OG-7` + `P1-64`)
- **Protecció extrema de fotos d'identitat personal (Avatar, Perfil Personal, Capçalera Personal i Xat Privat):** Purgar immediatament totes les **metadades EXIF i coordenades GPS reals** incrustades als binaris d'imatge de perfil públics (`public/assets/fotos/javi-llinares-perfil-1200px.jpg`, `.webp` i variants), afegir un test de regressió sobre les fotos de perfil i garantir que en pujar una foto de perfil/avatar personal s'esborre sempre l'EXIF GPS per defecte mostrant l'avís pedagògic: *«🔒 Per la teua privacitat, s'han eliminat les dades GPS de la foto de perfil»*.
- **Conservació informada en fotos de publicacions, esdeveniments, patrimoni i viatges (Hero i Carrusel/Galeria):** Mantindre activa i ben explicada la casella de consentiment (`exifIncrustat.js`: *«Conserva la ubicació i la data de la foto»*) tant per a la imatge principal (**Hero**) com per a **cada foto del Carrusel/Galeria**, extraient i desant les seues coordenades (`lat`, `lng`, `precisio: 'exacta' | '100m' | 'poble'`) i data de captura per alimentar el Mapa Fotogràfic Multi-Escala (`P1-64`).

##### 3.1.2. [NEW / MODIFY] `tooling/seo/*`, `src/config/socialImages.js`, `src/sections/text/TextSection.jsx` i `src/sections/wiki-de-poble/WikiDePobleSection.jsx` (`P1-61` Fase 2)
Integrar i completar l'arquitectura de `261027_0730_solucio_opengraph_i_copy_codex.md` combinada amb l'invariant del Mestre (`261027_1154_pla_implementacio_opengraph_primera_imatge`):
- Copiar l'asset `261027_0730_og_llibre_d_or_codex.png` a `public/assets/system/ui/og-llibre-d-or-1200x630.png` i registrar-lo a `src/config/socialImages.js`.
- Integrar `tooling/seo/build-social-manifest.mjs`, `prepare-social-shell.mjs`, `social-edge.mjs`, `apply-site-policy.mjs` i `build-site-policy.mjs`, assegurant que per a les **rutes públiques estàtiques i editorials** (`/projecte`, `/disseny`, `/anima`, `/descarregues`, `/pobles`, `/mur`, `/mercat`, `/calendari`, `/multimedia` i `/wikidepoble/<id>`) el build de Firebase Hosting (`dist/`) servisca les etiquetes `<meta property="og:*">` i `<link rel="canonical">` sense dependre de l'execució de JavaScript al navegador.
- **Rutes netes `/wikidepoble/<id>` per als documents de la Wiki (Aprovat pel Mestre, pregunta 1/4 de Claude `261028_1655_produccio_claude_pregunta_og_wiki.png`):** Pre-renderitzar estàticament `dist/wikidepoble/<id>/index.html` amb el seu títol i imatge OpenGraph (com `03_llibre_d_or_memoria_episodica` i `el_projecte`), fer que el botó de compartir genere `/wikidepoble/<id>` i que l'SPA accepte/redirigisca `/wikidepoble/<id>` cap a `?item=<id>` mantenint neteja d'estat entre navegacions (`seo-client.patch`).

#### 3.2. Bloc B · Reforma Editorial (`P1-60`) i Enllaç Bilateral `/projecte` ↔ Wiki (`P1-63`)

##### 3.2.1. [MODIFY] `src/sections/text/pageContent.js`, `src/sections/disseny/cataleg/manifest.js` i `src/config/systemPages.test.js`
Aplicar els pegats `copy-editorial.patch`, `copy-anima.patch` i `copy-tests.patch` de `261027_0730_solucio_opengraph_i_copy_codex.md`:
- Actualitzar els 4 objectes de `PAGE_COPY` (`projecte`, `disseny`, `anima`, `descarregues`) amb **subtítol H2 i entradeta en text pla** i exactament **6 a 8 paraules en negreta** per cada paràgraf llarg (≥ 20 paraules), verificat amb `tooling/seo/check-editorial-copy.mjs` (`62/62` paràgrafs conformes).
- Incloure al final de `PAGE_COPY.projecte.html` el bloc `.sdp-pagina-accio` amb el botó primari cap a `/wikidepoble?item=el_projecte` («Llegir el nucli i l'arquitectura del projecte»).

##### 3.2.2. [MODIFY] `_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md`, `_wiki_de_poble/02_saber/el_projecte.md` i `src/data/wikiManifest.js`
Verificar que les reformes editorials de `261027_0730_reforma_editorial_gemini.md` (els 18 errors com a `H3` navegables al TOC del Llibre d'Or i l'avís de governança amb enllaç de retorn a `/projecte` dins d'`el_projecte.md`) estan íntegres i executar `node tooling/wiki/compile-wiki-to-app.mjs` perquè `src/data/wikiManifest.js` quede sincronitzat amb l'arbre viu.

#### 3.3. Bloc C · Regressió P2 de `P1-55` i Edició Avançada d'Entitat (`P1-58` + `P1-57`)

##### 3.3.1. [MODIFY] `src/sections/comunitat/FitxaVivaDeComunitat.jsx` (`P1-55` · `GN-R01`)
Corregir la regressió P2 detectada per Codex en el commit `e4c4e076c`: quan el `lazy()` del xat falla en una comunitat A (`LazyRouteError`), canviar a una comunitat B ha de **reiniciar l'`ErrorBoundary`** (passant `key={comunitatId}` o `resetKeys` al propi boundary pare, no sols al fill) i permetre **reintentar el loader** sense quedar encallat en la pantalla d'error.

##### 3.3.2. [MODIFY] `src/components/PedraSeca/plantilles/PageFrame.jsx`, `src/components/universal/UniversalEditorShell.jsx` i `src/sections/profile/PerfilEditor.jsx` (`P1-58` i `P1-57`)
- **`P1-58`:** Moure el panell desplegable «Edició avançada de la fitxa» al slot `despresAutoria` de `PageFrame.jsx` (exactament **entre `<BarraTaronja>` i `<header className="page-title">` de l'H1**) i reordenar els subblocs de `.sdp-edicio-avancada__cos` a l'ordre natural de lectura: **`1. Capçalera` → `2. Avatar` → `3. Logotip`**.
- **`P1-57`:** Restaurar a `PerfilEditor.jsx` el tercer slot visual (avatar/logotip amb enquadrament no destructiu `zoom`/`x`/`y`) també per a l'entitat pilot (`esPilot`), de manera que les tres imatges d'identitat es puguen editar i reenquadrar sense pèrdua.

#### 3.4. Bloc D · Blindatge del Share Target i Compartició Nativa (`P1-31` a `P1-34`)

##### 3.4.1. [MODIFY] `src/config/compartirNatiu.js`, `src/sections/xat/XatContext.jsx` i `src/sections/xat/components/ControlsAdjunt.jsx` (`P1-31` i `P1-32`)
- **`P1-31` (Aïllament entre persones i backends):** Associar cada lot compartit a l'àmbit `{ backendUrl, userId }` (permetent la transició `null → userId` quan es comparteix abans d'iniciar sessió) i invocar `descartaCompartit()` a `XatContext.jsx` en fer logout o canviar d'usuari/servidor, cancel·lant qualsevol lectura nativa en vol.
- **`P1-32` (Consum recuperable):** Substituir el buidat destructiu immediat de `prenFitxerCompartit(filId)` per una **transacció de dos passos** (`reservaFitxerCompartit` → `confirmaFitxerCompartit` / `alliberaFitxerCompartit`) perquè si `ControlsAdjunt` es desmunta en vol (`StrictMode`, canvi de fil A→B→A o botó «Arrere»), la foto i el peu no es perden.

##### 3.4.2. [MODIFY] `android/app/src/main/java/org/socdepoble/app/CompartirNatiuPlugin.java` i `ios/App/Compartir/ShareViewController.swift` (`P1-33` i `P1-34`)
- **`P1-33` (Android):** Tancar el descriptor (`ParcelFileDescriptor` / stream) quan salte el timeout per no immobilitzar l'executor, imposar un pressupost agregat de bytes/text/tasques a la cua, normalitzar l'autoritat amb `.toLowerCase(Locale.ROOT)` i implementar `handleOnDestroy()` amb `copiador.shutdownNow()`.
- **`P1-34` (iOS):** En `ShareViewController.swift`, rebutjar `url.isFileURL` (esquemes diferents d'`http`/`https`) dins de `carregaUrl` perquè els fitxers no-imatge de `Files.app` sumen a `rebutjats` en lloc d'injectar rutes `file:///private/var/...`.

#### 3.5. Bloc E · REA Visual de WhatsApp (`P1-36`), Barra Única del Compositor (`P1-66`), Unificació Tipogràfica Semi-Condensed (`P1-67`), Botons Pedra Seca (`P1-37`), Taules (`P1-16`) i Consola 1-Clic (`P1-35`)

##### 3.5.1. [MODIFY] `src/sections/xat/components/Compositor.jsx`, `src/sections/xat/components/ControlsAdjunt.jsx`, `src/sections/xat/components/Conversa.jsx`, `src/sections/xat/XatSection.jsx`, `src/css/tokens.css`, `src/css/modules.css` i `public/fonts/noto-sans.css` (`P1-36`, `P1-66`, `P1-67`, `P1-37` i `P1-16`)
- **`P1-36` (Llista de converses superant WhatsApp):** Calibrar l'alçada de la targeta de conversa a **`96px`** (`2 × 48px`), ampliar l'avatar circular a **`74px–76px`**, apropar títol i últim missatge, eliminar el botó `[...]` de la Fila 1, convertir la cerca en **col·lapsable mitjançant botó de Lupa** i mantindre la fila de píndoles de filtre horitzontal (`[Totes]`, `[No llegits]`, `[Pobles]`).
- **`P1-67` (Unificació Tipogràfica i Variant Semi-Condensed `87.5%` entre Barra Lateral Principal i Menús/Llistes del Xat i Sistema — Captura `261028_1650_produccio_tipografia_sidebar_vs_xat.png`):**
  - **Correcció de mida heretada (`16px` uniforme, mai més gran que el menú principal):** A `src/css/modules.css:3412`, `.sdp-xat-llista` és un `<ul>` que heretava `font-size: var(--sdp-fluid-cos)` (**`20px`** en escriptori) de `ul, ol` (`src/css/base.css:169`), fent que el menú de converses del Xat es vera un 25% més gran que la Barra Lateral Principal (`nav.app-sidebar .nav-item`, que usa `var(--sdp-font-barra)` = `1rem` = **`16px`**). Fixar explícitament en `.sdp-xat-llista` / `.sdp-xat-fila, .sdp-xat-opcio` i menús secundaris la mateixa mida tipogràfica del menú principal (`var(--sdp-text-small)` = `1rem` = `16px`, sense reduir l'alçada per davall de la barra lateral).
  - **Variant Semi-Estreta (`SemiCondensed`, `font-stretch: var(--sdp-font-amplada-semi)` = `87.5%`):** Aplicar `font-stretch: var(--sdp-font-amplada-semi)` (`87.5%`, definit a `src/css/tokens.css:341` i `src/css/tipografia-estreta.css`) als rètols de menús i llistes de converses (`.sdp-xat-fila__nom`, `.sdp-xat-fila__previa`, `.nav-item`) i incorporar l'arxiu variable `public/fonts/noto-sans-wdth-wght-latin.woff2` + `public/fonts/OFL.txt` documentat a `FONTS_LOCALS.txt:111-125` perquè noms com `Carmen Chave...` i els resums guanyen cabuda horitzontal sense baixar de mida de lletra.
- **`P1-66` (Barra Única del Compositor Unificada Mòbil/Escriptori — Captures `261028_1638_produccio_whatsapp_compositor_referencia.png`, `261028_1638_produccio_socdepoble_compositor_actual.png` i `261028_1645_produccio_whatsapp_mobil_compositor.jpg`):**
  - **Eliminar** els dos botons blaus gegants permanents (`[ Foto o vídeo ]` i `[ Grava àudio ]`) i la línia permanent de quota de `ControlsAdjunt.jsx` que ocupen més de `130px` d'espai vertical a la conversa.
  - **Criteri d'Usabilitat Unificat (Mòbil + Escriptori en una sola barra inferior):** Les IAs tenen llibertat per sintetitzar el millor de WhatsApp Escriptori i WhatsApp Mòbil en un únic disseny net, ergonòmic i accessible (dianes `≥ 44px`/`48px` Pedra Seca) sense duplicar components:
    1. **Menú desplegable d'adjunts (`+` / `📎`)** que obri cap amunt el popover flotant (**Fotos i vídeos**, **Arxiu/Document**, **Contacte**, **Esdeveniment**, **Enquesta**, amb la quota `0,0 de 20 MB` integrada discretament al popover o només quan hi ha previsualització) + accés directe o d'un toc a foto/càmera si l'amplària ho permet.
    2. **Gestor d'Emoticones (`😊` / `Smile`)** integrat a la mateixa barra/quadre de text `.sdp-xat-compositor__camp`.
    3. **Botó circular d'acció primària a la dreta** que mostra el **Micròfon (`Mic`)** per gravar àudio quan el quadre de text està buit (i sense fitxer preparat), i commuta automàticament a l'avió d'**Enviar (`Send`)** quan hi ha text escrit o un adjunt llest per enviar.
- **`P1-37` (Botons unificats Pedra Seca):** Definir a `tokens.css` els tokens de marge i separació de botons (`margin-inline: var(--sdp-space-4)`, `margin-block: var(--sdp-space-3)` en botons de bloc com `[ Pregunta a la IAIA ]` i separació per `gap` en agrupacions), eliminant estils ad-hoc enganxats a divisors.
- **`P1-16` (Taules distingibles i accessibles):** Elevar el contrast de la capçalera de `.sdp-taula-prosa` (`ΔE2000 ≥ 5` en clar i fosc) i dotar les taules Markdown de `parseMarkdown.js:162-169` d'embolcall `.sdp-taula-prosa` amb `role="region"`, nom accessible i `tabIndex="0"`.

##### 3.5.2. [MODIFY] `src/sections/consola/` i `package.json` (`P1-35`)
Exposar de forma nítida la **Versió Canònica del Sistema** (`v1.0.1 (build 261028)`) tant a `/consola` com a la informació de l'App i consolidar el panell d'estat i llançament dels empaquetats multiplataforma.

#### 3.6. Bloc F · Seguretat de Serveis, Idiomes, Bateria Sencera i Portes de Govern (`P1-07`, `P1-08`, `P1-09`, `P1-13`, `P1-18`, `P1-22`, `P1-26`, `CL-06..08`)

##### 3.6.1. [MODIFY] Edge Functions i Dades (`P1-07`, `P1-18`, `P1-13`, `P1-27`)
- **`P1-07` (`supabase/functions/noticies/gestor.js`):** Corregir `aprovatVetat` perquè comprove `nom.fallades > 0 || nom.adreces.length === 0` (`G1945-01`) i assegurar que l'escàner `senseNiats` / `imatgesDelFeed` siga estrictament lineal $O(n)$ (`G-03`).
- **`P1-18` (`supabase/functions/compte-apple/gestor.js`):** Substituir `req.text()` per lectura fitada per bytes (`<= 4096 B`) i mantindre actiu l'`AbortController` de `ambTopall` fins a consumir tot el cos HTTP (`C0545-WM1/WM2`).
- **`P1-13` (`supabase/migrations/` i `src/data/supabase/perfils.js`):** Tancar la carrera de l'alta concurrent de membres (`C11-03`) i l'alineació del camp d'opt-in de contacte públic (`C11-05`).

##### 3.6.2. [MODIFY] Idiomes (`P1-22`), WordPress (`P1-09`/`GN-R08`), Suite Sencera (`P1-26`) i Governança (`P1-08`, `CL-06..08`)
- **`P1-22` (`TE-02`, `TE-05`, `TE-01`):** Afegir les 24 claus de `t()` absents als 5 diccionaris (`ca`, `es`, `en`, `eu`, `gl`), propagar l'idioma des de `src/natiu/entrada.jsx` i `wordpress-plugin/includes/marcatge.php` cap a `UIContext.jsx`, i traduir les cadenes literals restants de `DetallPrivacitat.jsx`.
- **`P1-09` / `GN-R08` (`wordpress-plugin/includes/idioma.php` i `tests/enxufe-*.test.mjs`):** Corregir el fallback `ca_valencia` → `ca.mo` en `switch_to_locale()` per a WP < 6.5 i alinear les 3 assercions dels tests d'empaquetat amb l'exclusió de `vendor/` en la v1.2.1.
- **`P1-08` i `P1-26`:** Afegir `src/natiu/entrada.jsx` a `tooling/gates/tractor-pedra-seca.mjs`, afegir la sentinella contra `facebook-ios-sdk` a `tooling/natiu/preflight.mjs`, resoldre les 2 fallades de `censImatges` i l'aïllament de `fontServeis` a `AppsLector.test.jsx`, podar `sdp-vigilant-tellado/SKILL.md` (< 3.000 paraules) resegellant `.agents/SKILLS_SEAL.json` i moure el log de `org.socdepoble.higiene.plist` a `~/Library/Logs/` per evitar el bloqueig TCC (`exit 78`).

#### 3.7. Bloc G · Mapa Fotogràfic EXIF Multi-Escala Poble/Món (`P1-64`) i Radar d'I+D d'Emowe (`P1-65`)

##### 3.7.1. [MODIFY] `src/sections/mur/mapConfig.js`, `src/components/universal/enquadrament/exifIncrustat.js` i `src/components/universal/enquadrament/geolocalitzacio.js` (`P1-64`)
Prendre com a referència arquitectònica directa els arxius descarregats pel Mestre a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261014_1930_emowe_mapa_de_tu_viaje/` (`LEEME.txt`, `PROMPT_UNIVERSAL.txt`, `plantilla-mapa.html` v3):
- **Doble capa de punts i Honestedat Visual (Verd vs. Ocre):**
  - **Verd (`#226b5c`):** Fotos amb coordenades GPS EXIF reals extretes de l'arxiu original (tant la foto **Hero** com **cada foto del Carrusel/Galeria** que tinga GPS).
  - **Ocre (`#a77022`):** Ubicació estimada (per proximitat temporal entre dos fotos amb GPS d'una mateixa galeria/ruta) o ubicació municipal (`poble_id`, ex. `La Torre de les Maçanes`) quan la publicació no té GPS exacte a les fotos.
- **Agrupació Jeràrquica per Distància (`Complete-Link Clustering` `nearbyGroups`) + Lliscador Manual (`Agrupació per distància`):**
  - Implementar el lliscador de llindars `[Infinity, 100, 60, 30, 15, 6, 2, 0.8, 0.2, 0]` km basat en distància Haversine real i el desglossament automàtic de totes les fotos individuals quan `zoom >= 16` (`showIndividualPhotos()`), de manera que un monument fotografiat a França i les fotos locals de La Torre convisquen al mateix mapa sense perdre l'escala de poble.
- **Targetes de Foto Arrossegables amb Línia Puntejada (`bindCardDrag` + `drawCardLines`):**
  - Les targetes amb miniatura i carrusel es poden arrossegar lliurement sense moure el mapa, queden unides al punt GPS real per una línia puntejada fina (`dashArray: '4 5'`) i disposen d'un botó «Recol·locar grups» i un commutador «Vore mapa / Ocultar mapa» sobre base **Leaflet 100% lliure**.

##### 3.7.2. [RESEARCH & PROPOSE] Estudi Integral d'Emowe (`https://emowe.com/blog/`) i `001 NEXUS` (`P1-65`)
**Claude Code**, **GPT Codex** i **Gemini** han d'analitzar els materials d'Emowe custodiats a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261014_1930_emowe_mapa_de_tu_viaje/` i `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/001 NEXUS/` (`Mapa de mis agentes v0.1.html` / `mapa_agentes.py`) junt amb els seus articles recents (`https://emowe.com/blog/` / `https://emowe.com/rss.xml`), i incloure al seu informe propostes concretes i accionables per a la **Consola Termodinàmica**, les **Skills/Agents** (`perfil → skill → tarjeta → candado`) i el **Mapa Fotogràfic EXIF**.

#### 3.8. Bloc H · Onada 2 Post-Commit `cd3b5b56c`: Gauntlet Adversarial Extrem i Liquidació del Backlog Tècnic del Llibre Mestre

##### 3.8.1. [AUDIT] Auditoria Adversarial Extrema (Gauntlet Loop) sobre el Commit `cd3b5b56c` (GPT Codex + Gemini)
- **GPT Codex (Seguretat, Concurrència, Contractes i Perímetre PHP):** Auditar amb PoC executables els 223 fitxers del commit `cd3b5b56c`: (1) el pre-renderitzat de les 111 rutes OpenGraph i `social-edge.mjs` / `publication-policy.mjs` (`P1-61`); (2) la purga binària EXIF GPS sobre els 10 actius personals i la llista blanca de 8 fotos patrimonials de La Torre (`OG-7` / `P1-64`); (3) el reset d'`ErrorBoundary` (`P1-55`), l'època de sessió i reserva en 2 passos de `compartirNatiu.js` (`P1-31..34`), i els límits per bytes a `noticies` i `compte-apple` (`P1-07`, `P1-18`); i (4) verificar que `wordpress-plugin/` (`socdepoble-enxufe`) és 100% hermètic davant l'alerta crítica d'INCIBE sobre PHP (`CVE-2026-109618`, `CVE-2026-109619`, CVSS 9.2/10).
- **Gemini (Arquitectura, Geometria Pedra Seca, Mapa Leaflet i Paritat Visual):** Auditar en navegador/DOM l'encaix visual del Mapa Fotogràfic Leaflet (`src/sections/mur/mapaFotografic.js` + `MapaFotografic.jsx` amb «Vore mapa» desactivat de sèrie), les targetes de conversa de `96px` amb avatar de `76px` i lupa col·lapsable (`P1-36`), el slot `despresAutoria` (`P1-58`), la versió canònica `v1.0.0 (build 261028)` a `/consola` (`P1-35`) i els 62/62 paràgrafs editorials (`P1-60`/`P1-63`).

##### 3.8.2. [MODIFY] Execució Tècnica Contínua de Claude Code sobre el Llibre Mestre (`P1-66`, `P1-67`, `P1-68`, `P1-69`, Residus `261028_1620` i `IDEA-32/33/40/41`)
1. **`P1-66` (Prioritat #1 · Barra Única del Compositor de Xat):** Executar la unificació de `Compositor.jsx`, `ControlsAdjunt.jsx`, `Conversa.jsx` i `src/css/modules.css` eliminant els 2 botons blaus gegants (`[ Foto o vídeo ]` i `[ Grava àudio ]`) i la línia fixa de quota, deixant una sola barra inferior amb desplegable d'adjunts (`+`/`📎`), emoticones integrades i botó dinàmic `Micròfon` ↔ `Enviar`.
2. **`P1-67` (Prioritat #2 · Unificació Tipogràfica `16px` + `SemiCondensed` `87.5%`):** Corregir en `src/css/modules.css` l'herència de `20px` sobre `.sdp-xat-llista` / `.sdp-xat-fila` perquè iguale exactament els `16px` (`1rem`) de la Barra Lateral Principal (`nav.app-sidebar .nav-item`), aplicar `font-stretch: var(--sdp-font-amplada-semi)` (`87.5%`) i incorporar `public/fonts/noto-sans-wdth-wght-latin.woff2` + `public/fonts/OFL.txt` (`FONTS_LOCALS.txt:111-125`).
3. **`P1-68` (Prioritat #3 · Registre Mòbil d'1 Toc, Autogeneració de `@username` Únic i Sincronització Canònica de Poble a `public.profiles` — Captures `261028_2008_produccio_supabase_profiles_1..4.png`):**
   - **Autogeneració i unicitat de `username` (sense `@` a la BD, mostrat com a `@username` a la UI):** Crear la migració SQL i el helper client (`proposaUsername(nom)` a `onboardingModel.js`) perquè tant `handle_new_user()` com `completa_la_meua_alta()` generen sempre un `username` únic en minúscules ASCII sense accents ni espais a partir del nom i cognom (ex. `Diego Calvo Bermejo` → `diegocalvo`, o `diegocalvo-2` si ja existix), fer backfill de les files amb `username IS NULL` (`Diego Calvo Bermejo`), afegir `'username'` a `CAMPS_PERFIL` (`src/data/supabase/auth.js:259`), `perfilDePersona` (`slug: fila.username || null`) i `PerfilEditor.jsx`, i mostrar al registre (`/registre`) i en la primera entrada post-OAuth la proposta editable `@username`.
   - **Sincronització canònica de Poble (`town_uuid`, `primary_town`, `town_name`, `provinces`, `comarcas`):** Preseleccionar per defecte el poble actiu (`La Torre de les Maçanes`) amb selector ràpid per canviar-lo al registre/perfil, i assegurar que `handle_new_user`, `completa_la_meua_alta` i l'actualització de perfil omplin sempre de forma atòmica i coherent `town_uuid`, `primary_town`, `town_name`, `provinces` i `comarcas` des de `public.towns` (i `public.town_memberships`), eliminant els `NULL` de `town_uuid`/`primary_town`.
4. **`P1-69` (Prioritat #4 · Botó Interactiu «Instal·lar l'App (PWA)» a `/page/descarregues` — Captura `261028_2013_produccio_descarregues_boto_pwa.png`):**
   - Incorporar a `/page/descarregues` (`/descarregues`) el botó d'acció primari **`Instal·lar l'App (PWA)`** (`PageDetailSection.jsx`, `systemPages.js` i actualització del test `PageDetailSection.descarregues.test.jsx`): quan el navegador ofereix `beforeinstallprompt` (Chrome, Edge, Android), el botó llança directament `deferredPrompt.prompt()`; en Safari (iPhone, iPad, Mac) mostra l'avís guiat per afegir a la pantalla d'inici/Dock i desplaça a la secció d'instruccions del navegador; si ja corre en mode `standalone`, indica que l'aplicació ja està instal·lada, deixant preparades les ranures per activar els botons de Google Play i App Store quan s'òbriguen.
5. **Residus propis de `261028_1620_auditoria_claude.md` i millores ràpides d'Emowe (`P1-65`):**
   - Passar `AbortSignal` a `llegix(url)` i lligar l'àmbit compost `{ backendUrl, userId }` en `src/natiu/compartirNatiu.js` (`C28-02`).
   - Incloure `resolver.getType(uri)` i `nomVisible(resolver, uri)` dins del timeout `ambTermini` a `CompartirNatiuPlugin.java` (`C28-07`).
   - Aplicar a `src/sections/mur/mapaFotografic.js` la separació `origen` vs. `inferencia` (`M1`) i la pre-agregació per coordenada arredonida `1e-4°` abans del clustering Complete-Link $O(n^3)$ (`M2`), i l'avís de torn tancat en `planned` sense rebut a `tancament.mjs` (`C1`).
6. **Polit tècnic pre-botigues del Llibre Mestre (`IDEA-40`, `IDEA-32`/`IDEA-33`, `IDEA-41`/`IDEA-29`):**
   - **`IDEA-40`:** Unificar el verd canònic `#0F672F` (WCAG AAA `7.19:1`) en `--sdp-verd` / `--sdp-accent-verd` i afegir l'indicador semàfor `squareBadge` a la Consola.
   - **`IDEA-32` i `IDEA-33`:** Alinear les icones de `24px` a la capçalera de `/app/notes` (`padding-left: 12px`, `gap: 8px`) i afegir l'índex desplegable H1–H6 sota `.bar-black` en notes llargues.
   - **`IDEA-41` (`IDEA-29`):** Canonitzador estructural de 3 passos `[ 🎴 Proposa Card ]` a `/app/notes` (`H1` → `H2` → `lead` sense duplicar paràgrafs al cos).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Verificació d'OpenGraph, Privacitat EXIF GPS i Reforma Editorial (Blocs A i B):**
   - Executar `node tooling/seo/check-editorial-copy.mjs` → `valid: true`, `errors: []`, `62/62` paràgrafs amb 6–8 paraules en negreta.
   - Executar `node --test tooling/seo/social-edge.test.mjs tooling/seo/adversarial-edge.test.mjs tooling/seo/build-social-manifest.test.mjs tooling/seo/site-policy.test.mjs tooling/seo/social-http.test.mjs` → 100% proves verdes.
   - Verificar que `public/assets/fotos/javi-llinares-perfil-1200px.jpg` i `.webp` tenen **zero tags EXIF GPS** (`exiftool` / parser binari JPEG/WebP), que les pujades de perfil/avatar eliminen el GPS mostrant l'avís de privacitat, i que les fotos de Hero i Carrusel conserven/extrauen les coordenades GPS amb consentiment informat.
   - Executar `node tooling/wiki/compile-wiki-to-app.mjs` i comprovar que `src/data/wikiManifest.js` conté la versió reformada de `03_llibre_d_or_memoria_episodica` i `el_projecte`.
2. **Verificació de Componentística, Xat, Natiu, Mapa EXIF i Serveis (Blocs C, D, E, F i G):**
   - Executar les suites dirigides de Vitest per a `FitxaVivaDeComunitat`, `UniversalEditorShell`, `PerfilEditor`, `compartirNatiu`, `ControlsAdjunt`, `XatContext`, `Taula`, `noticies`, `compte-apple`, `exifIncrustat`, `geolocalitzacio` i el clustering Haversine del Mapa (`P1-64`).
   - Executar `npm test -- tests/enxufe-plugin.test.mjs tests/enxufe-seguretat.test.mjs` per validar el connector WordPress v1.2.1 i el fallback `ca_valencia`.
3. **Verificació Global Pre-commit i Portes de Tancament:**
   - Executar `/usr/bin/time -p npm run test:precommit` → eixida `0` en menys de 30 segons.
   - Executar `node tooling/gates/porta-olivera.mjs`, `node tooling/gates/verificador-scc.mjs` i `node tooling/gates/tancament.mjs` → totes les portes en verd (`exit 0`).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Contaminació d'encapçalaments OpenGraph entre rutes o releases (`P1-61`):** Mitigat amb `Cache-Control: no-store` a les respostes HTML reescrites, verificació de `sourceSha256` contra `dist/index.html` i proves adversarials d'aïllament per `?item=` i per visibilitat (`publication-policy.mjs`).
2. **Pèrdua de dades o fuga entre sessions en la compartició nativa (`P1-31` / `P1-32`):** Mitigat vinculant cada lot compartit a `{ backendUrl, userId }`, netejant en canviar de sessió i usant reserva amb confirmació diferida en lloc de lectura destructiva.
3. **Trencament del segell de skills o de portes protegides pel Reflex (`CL-06`):** Qualsevol actualització de `.agents/SKILLS_SEAL.json` o de portes protegides s'ha de fer exclusivament amb un torn obert de l'`executor-mutacio` o deixar el pegat llest i verificat si la frontera pertany al Mestre.
4. **Col·lisió d'escriptura en l'arbre compartit durant el Gauntlet Loop:** Es prevé aplicant estrictament `core-secretaria-auditoria`: **Claude Code** és l'única que modifica `src/`, `tooling/` i `tests/`, mentre que **Codex** i **Gemini** auditen en mode read-only o en sandboxes aïllats a `/tmp` i escriuen exclusivament el seu informe d'auditoria a `_wiki_de_poble/04_escriptori/`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[../10_actes/261028_1310_acta_marmota_triomf_marato_25h_opengraph_botigues_i_revisio_wp|261028_1310_acta_marmota_triomf_marato_25h_opengraph_botigues_i_revisio_wp]]
- [[261027_0730_reforma_editorial_gemini]]
- [[261027_0730_solucio_opengraph_i_copy_codex]]
