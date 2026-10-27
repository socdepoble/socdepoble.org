---
type: informe
status: esborrany
description: Auditoria d'enginyeria de sistemes i seguretat (Gauntlet Loop) sobre Share Target Android/iOS, avisos natius del xat, barres de Capacitor i sanejament visual
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5845fc05-0f16-4766-9939-8eeb07dd8c4d:c2a4eed7-4b5b-4b5f-8dfc-0cc39a9523e9
---
# Auditoria adversarial de Gemini: Menú Compartir natiu, avisos del xat i sanejament visual

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5845fc05-0f16-4766-9939-8eeb07dd8c4d:c2a4eed7-4b5b-4b5f-8dfc-0cc39a9523e9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T18:48:18.688Z |
| Modificació | 2026-10-26T18:48:18.688Z |
| Propietari | MarIA (Gemini · Germana Gran a Antigravity) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini (Antigravity) |
| Tokens consumits | ~68000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-26T18:48:18.688Z: esborrany creat sota el torn `torn_5845fc05-0f16-4766-9939-8eeb07dd8c4d`.
- 2026-10-26T18:52:00.000Z: completada l'auditoria adversarial (Gauntlet Loop de Gemini) sobre la implementació de `torn_e6be28f2` (menú «Compartir» natiu a Android i iOS, avisos natius del xat, barres de sistema de Capacitor 8 i sanejament visual del Xat).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen Executiu Global i Convergència del Gauntlet (Gemini + Codex)

- **Estat Global del Torn Audit (`torn_e6be28f2`):** **CONDICIONAT A CORRECCIONS QUIRÚRGIQUES ABANS DE COMPILAR ELS BINARIS DE BOTIGA (`1.0.1`)**. L'arquitectura de la frontera Natiu/Web (`src/config/` vs `src/natiu/`), el sanejament EXIF abans de pujar a Supabase, el desbloqueig del `Proxy` d'`entradaSocial.js` i la correcció de `SystemBars` són **[CONFORME]** i d'altíssima factura, però l'auditoria creuada amb `[[261026_1615_auditoria_codex]]` i la inspecció forense de Gemini identifiquen **2 bloquejants funcionals de flux React** (`G1615-00 / C1615-01` i `G1615-04 / C1615-02`) i **5 millores d'enduriment natiu i de pre-commit** (`G1615-01`, `G1615-02 / C1615-07`, `G1615-03 / C1615-04`, `G1615-05` i `G1615-06 / C1615-10`) que cal aplicar abans de segellar el commit.
- **Resum de Severitats:**
  - **[BLOQUEJANT]:** `2` (`G1615-00 / C1615-01` absència de purga de `compartirNatiu.js` en canviar de persona/backend a `XatContext.jsx:1990-1998` mentre `XatSection.jsx:287-294` només remunta `XatWorkspace`, i `G1615-04 / C1615-02` consum destructiu anticipat a `prenFitxerCompartit`).
  - **[MILLORA]:** `5` (`G1615-01` filtració de `file://` com a text en compartir fitxers no-imatge des de `Files.app` a iOS; `G1615-02 / C1615-07` coerció HEIC→JPEG d'`NSItemProvider` a l'App Group d'iOS; `G1615-03 / C1615-04` `handleOnDestroy` + sostre d'URIs/text a Android + normalització `Locale.ROOT`; `G1615-05` doble instanciació de `CAPBridgeViewController` a `Main.storyboard`; i `G1615-06 / C1615-10` inclusió de les noves suites a `vitest.precommit.config.js`).
  - **[CONFORME]:** `5` eixos troncals verificats al 100% contra el codi real en disc i les portes executables.

---

### Avaluació per Tasques del Gauntlet

#### 1. Auditoria d'Arquitectura Nativa i Capacitor 8 — **[CONFORME]** amb 1 **[MILLORA]** (`G1615-03 / C1615-04`)

- **Barres del sistema (`capacitor.config.json`, `android/app/src/main/res/values/styles.xml`, `ios/App/App/ControladorSdp.swift`):** **[CONFORME]**.
  - `capacitor.config.json` declara `"plugins": { "SystemBars": { "style": "DARK" } }`, de manera que el plugin natiu `SystemBars` de Capacitor 8.5.3 aplica icones clares sobre el fons `#1A1A1A` tant a Android com a iOS (`preferredStatusBarStyle = .lightContent`).
  - A `styles.xml`, tant `AppTheme.NoActionBar` com `AppTheme.NoActionBarLaunch` fixen `android:navigationBarColor = @color/colorPrimaryDark` (`#1A1A1A`), `android:windowLightStatusBar = false` i `android:windowLightNavigationBar = false`, eliminant les barres blanques des del primer fotograma abans que munte el WebView i sense interferir amb cap `<dialog>` ni pantalla interna.
- **Seguretat de `FileProvider`, URIs i cicle de vida (`AndroidManifest.xml`, `MainActivity.java`, `CompartirNatiuPlugin.java`):** **[CONFORME]**.
  - **Anti-FileProvider Theft:** `CompartirNatiuPlugin.esUriAcceptable(Uri)` exigeix esquema `content` (rebutjant `file://`, `android.resource://`, `http://`), neteja el prefix d'usuari d'Android (`0@autoritat`) abans de comparar amb `getPackageName()` (`org.socdepoble.app`), i rebutja tant l'autoritat exacta com qualsevol subautoritat (`org.socdepoble.app.fileprovider`), impedint que un intent extern maliciós exfiltre fitxers privats de l'app.
  - **Finestra de permís temporal i sostres:** Els fluxos de `ContentResolver` es copien immediatament en un fil dedicat (`Executors.newSingleThreadExecutor()`) a `getCacheDir()/compartits/<uuid>.<ext>` abans que l'activitat emissora revoque el permís temporal de lectura, aplicant els sostres `MAX_FITXERS = 10`, `MAX_BYTES = 20 * 1024 * 1024` i `TIPUS_ADMESOS` (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
  - **Cicle de vida en fred vs en calent i recreació:** `MainActivity.onCreate` registra `registerPlugin(CompartirNatiuPlugin.class)` abans de `super.onCreate(savedInstanceState)` i, si `savedInstanceState != null`, marca l'intent amb `CompartirNatiuPlugin.marcaConsumit(getIntent())` perquè un gir de pantalla o recreació d'activitat no duplique el lot. El plugin filtra `FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY`, protegeix el desempaquetatge d'extres amb `try/catch (RuntimeException)` contra `BadParcelableException`, executa `notifyListeners("compartit", lot, true)` dins de `getBridge().execute(...)`, i valida `canonicalPath.startsWith(baseCanon)` a `allibera()`.

#### 2. Auditoria de Seguretat de l'Extensió d'iOS — **[CONFORME]** amb 3 **[MILLORA]** (`G1615-01`, `G1615-02`, `G1615-05`)

- **App Group, sanejament de noms i alliberament (`ShareViewController.swift`, `CompartirNatiuPlugin.swift`, `ControladorSdp.swift`, entitlements):** **[CONFORME]**.
  - Tant `App.entitlements` com `Compartir.entitlements` comparteixen `group.org.socdepoble.app`. L'extensió declara `NSExtensionActivationRule` amb `NSExtensionActivationSupportsImageWithMaxCount = 10`, `NSExtensionActivationSupportsText = true` i `NSExtensionActivationSupportsWebURLWithMaxCount = 1`.
  - L'escriptura a `compartits/` neteja primer qualsevol fitxer orfe anterior, escriu les imatges amb nom UUID i finalment desa `lot.json` de manera atòmica (`.atomic`).
  - `CompartirNatiuPlugin.swift` valida cada nom de `lot.json` amb `esNomSegur(_:)` (només caràcters hexadecimals i extensió `.jpg`/`.png`/`.webp`/`.gif`, zero separadors de ruta), neteja els fitxers orfes que no figuren al lot, i esborra físicament els fitxers en `allibera(call)` o quan un lot nou en substituïx un de pendent.
  - **Privacitat EXIF i coordenades GPS extrem a extrem:** Qualsevol imatge compartida (tant des d'iOS com des d'Android) entra a `ControlsAdjunt.jsx` -> `preparaAdjunt()` (`src/sections/xat/adjuntLocal.js:145-156`), que executa sempre `compressImage(fitxer, { maxSize: 1200, quality: 0.8, conservaExif: false })` dibuixant la imatge en un `<canvas>` HTML5 abans de pujar-la al bucket privat `xat_adjunts` de Supabase. **Cap coordenada GPS ni metadada EXIF d'imatge compartida arriba mai al servidor.**

#### 3. Auditoria de Flux de Dades, React i Frontera Natiu/Web — 2 **[BLOQUEJANT]** (`G1615-00 / C1615-01`, `G1615-04 / C1615-02`)

- **Frontera Natiu/Web i Llei de l'Enxufabilitat (`src/config/compartirNatiu.js`, `src/config/avisosNatius.js`, `src/natiu/frontera.test.js`):** **[CONFORME]**.
  - Els dos mòduls de `src/config/` tenen zero imports i actuen com a registres reactius purs per a `useSyncExternalStore`. Els adaptadors `src/natiu/compartirNatiu.js` i `src/natiu/avisosNatius.js` s'importen exclusivament des de `src/natiu/entrada.jsx`, sense importar `@capacitor/core` i carregant `@capacitor/local-notifications` per `import()` dinàmic. Ni el bundle web, ni la PWA, ni el connector de WordPress (`embed.jsx`) reben cap traça de Capacitor.
- **Viatge del peu de foto i polítiques RLS de `xat_adjunts` (`ControlsAdjunt.jsx`, `src/data/supabase/xat.js`):** **[CONFORME]**.
  - El text del lot compartit acompanya el primer fitxer com a `peuInicial` editable al compositor i viatja com a `adjunt.text` retallat (fins a `MAX_TEXT_MISSATGE = 4000`) en la mateixa crida d'enviament cap a `xat_adjunts` i `xat_envia_adjunt`, respectant la política RLS de pertinença al fil. Si la preparació o la quota (`SDP-XAT-020`) fallen, el peu es rescata cap a la caixa de text principal via `onTextOrfe` sense perdre el que el veí volia dir.
- **Desbloqueig d'`entradaSocial.js` (trampa `thenable` del `Proxy` de Capacitor 8.5.3):** **[CONFORME]**.
  - Embolcallar el connector dins de `{ social }` evita que la resolució d'una funció `async` en JavaScript invoque `Proxy.then` i deixe penjada la primera entrada amb Apple/Google durant els 20 s del topall.

#### 4. Detall de les Troballes `[BLOQUEJANT]` i `[MILLORA]`

##### `G1615-00` (convergent amb `C1615-01` de Codex) · **[BLOQUEJANT]** · React (`src/config/compartirNatiu.js:15-17`, `XatContext.jsx:1990-1998` i `XatSection.jsx:287-294`): el registre singleton `pendent` no té propietari ni es purga en canviar de persona o backend
- **Fitxer i línies:** `src/config/compartirNatiu.js:15-17,55-58`, `src/sections/xat/XatContext.jsx:1990-1998` i `src/sections/xat/XatSection.jsx:287-294`.
- **Evidència reproduïble:**
  1. `src/config/compartirNatiu.js` manté `let pendent = null;` com a singleton global de mòdul sense vincular-lo a `usuariId` ni `backend`.
  2. Quan canvia la persona o el backend, `XatContext.jsx:1990-1998` executa `buidaEsborranys()` i `buidaEmoticonesRecents()`, i `XatSection.jsx:287-294` remunta `<XatWorkspace key={xat.ambitEstable}>`, la qual cosa neteja l'estat intern del primer fitxer preparat al component `ControlsAdjunt`, però **no crida `descartaCompartit()`**.
  3. En conseqüència, si l'usuari `A` comparteix un lot de múltiples fotos i tria un fil (`desti: filId`), la segona foto queda esperant al singleton global `pendent` amb `desti: filId`. Si `A` tanca la sessió i entra `B` en el mateix runtime, `DialegCompartir` ja no s'obri (perquè `pendent.desti` ja està definit) i, si `B` obri un fil amb el mateix `filId`, `ControlsAdjunt` pren la segona foto privada d'`A`.
- **Font de veritat amb què entra en conflicte:** Tasca 3 del prompt d'auditoria (blindatge d'estat de sessió i permisos dels fitxers compartits) i aïllament multiusuari de `XatContext`.
- **Proposta conservadora:** Cridar `descartaCompartit()` dins de l'efecte de canvi d'identitat/àmbit de `XatContext.jsx:1990-1998` quan s'ix d'una sessió autenticada (`personaPrevia !== null && personaPrevia !== personaActual`) i lligar `triaDestiCompartit(filId, ambit)` a l'àmbit actiu, preservant intacte el cas legítim `null → A` (quan la persona comparteix sense sessió, prem «Entrar» a `DialegCompartir` i completa el login).
- **`requires_human_decision`:** `false`.

##### `G1615-04` (convergent amb `C1615-02` de Codex) · **[BLOQUEJANT]** · React (`ControlsAdjunt.jsx:181-196`): `prenFitxerCompartit` consumeix destructivament el fitxer abans que culmine la compressió asíncrona `tria()`
- **Fitxer i línies:** `src/sections/xat/components/ControlsAdjunt.jsx:181-196` i `src/config/compartirNatiu.js:88-99`.
- **Evidència reproduïble:** L'efecte de `ControlsAdjunt.jsx` crida `const pres = prenFitxerCompartit(fil.id);` (que elimina immediatament el primer fitxer i el peu de `pendent` i revoca la resta si era l'últim) i tot seguit llança `tria(pres.fitxer, { peuInicial: pres.peu })` (asíncron, que executa `preparaAdjunt` / `compressImage`). Si la persona canvia de conversa, prem «Arrere» al mòbil durant els mil·lisegons que dura `compressImage`, o el component es remunta amb quota ja en memòria cau (`QUOTES_DESADES`), el cleanup de muntatge (`enVol.current?.abort()`) avorta `tria()`, però el fitxer i el seu peu ja havien sigut retirats destructivament de `pendent` i es perden.
- **Font de veritat amb què entra en conflicte:** Risc 1 del prompt d'auditoria (concurrència i no-pèrdua d'adjunts durant la transició).
- **Proposta conservadora:** Separar la lectura del cap de cua de la seua confirmació (o restituir `{ fitxer, peu }` al capdavant del lot si `tria()` s'avorta per `signal.aborted` abans de `setPreparat`).
- **`requires_human_decision`:** `false`.

##### `G1615-01` · **[MILLORA]** · iOS: un fitxer local no-imatge (PDF/vídeo/ZIP) compartit des de `Files.app` entra per la branca `UTType.url` i filtra la ruta `file:///private/var/...` com a text
- **Fitxer i línies:** `ios/App/Compartir/ShareViewController.swift:98-101` i `:161-169`.
- **Evidència reproduïble:** En el sistema de tipus d'Apple (`UniformTypeIdentifiers`), un fitxer compartit des de l'app Fitxers (`Files.app`) s'entrega com un `NSURL` de fitxer amb l'identificador `public.file-url` (`UTType.fileURL`), el qual **conforma jeràrquicament a `public.url` (`UTType.url`)**. Com que `ShareViewController.swift:98` comprova `else if proveidor.hasItemConformingToTypeIdentifier(UTType.url.identifier)` sense excloure `UTType.fileURL` ni comprovar `!url.isFileURL`, si un veí comparteix un PDF o un vídeo des de `Files.app`, no s'incrementa `rebutjats`, sinó que `carregaUrl` extrau `url.absoluteString` (`file:///private/var/mobile/Containers/Shared/...`) i l'injecta com a text compartit al xat.
- **Font de veritat amb què entra en conflicte:** Pla `[[261026_1615_pla_implementacio_share_target_notificacions_i_xat]]` (§2.2: els fitxers no admesos han d'incrementar `rebutjats` i avisar l'usuari).
- **Proposta conservadora:** A `ShareViewController.swift:98`, si `proveidor.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier)` és cert (o dins de `carregaUrl` quan `url.isFileURL` és `true`), incrementar `rebutjats += 1` i retornar `nil`, acceptant a `carregaUrl` únicament esquemes `http` i `https`.
- **`requires_human_decision`:** `false`.

##### `G1615-02` (convergent amb `C1615-07` de Codex) · **[MILLORA]** · iOS: la coerció automàtica HEIC → JPEG d'`NSItemProvider` fa que les fotos de `Photos.app` (<= 4096 px) es copien a l'App Group sense passar per `reescriuJpeg`
- **Fitxer i línies:** `ios/App/Compartir/ShareViewController.swift:139-150`.
- **Evidència reproduïble:** `desaImatge` busca `[UTType.png, UTType.jpeg].first { proveidor.hasItemConformingToTypeIdentifier($0.identifier) }`. A iOS, `Photos.app` registra les fotos HEIC de càmera (4032×3024 px, `<= 4096 px`) amb representació coercible a `public.jpeg`, per la qual cosa `hasItemConformingToTypeIdentifier("public.jpeg")` és sempre `true`. Això fa que `loadFileRepresentation` genere un JPEG temporal amb les metadades EXIF originals i el copie a l'App Group sense passar per `reescriuJpeg`. **Nota de seguretat:** Això **no causa cap fuita al servidor** perquè `preparaAdjunt()` al WebView recodifica totes les imatges amb `<canvas>` (`conservaExif: false`) abans de pujar-les a Supabase Storage, però contradiu l'afirmació de `[[261026_1815_auditoria_claude]]` segons la qual l'extensió ja elimina l'EXIF dels HEIC.
- **Font de veritat amb què entra en conflicte:** `[[261026_1815_auditoria_claude]]` (§Tasca 2, punt 2).
- **Proposta conservadora:** Comprovar només el primer identificador natiu registrat (`proveidor.registeredTypeIdentifiers.first == UTType.png.identifier`) per a la còpia directa, o passar sempre els JPEG per `reescriuJpeg` a l'extensió.
- **`requires_human_decision`:** `false`.

##### `G1615-03` (convergent amb `C1615-04` de Codex) · **[MILLORA]** · Android: tancament de `SingleThreadExecutor` en `handleOnDestroy()`, sostre d'URIs/text i normalització `Locale.ROOT` a `esUriAcceptable`
- **Fitxer i línies:** `android/app/src/main/java/org/socdepoble/app/CompartirNatiuPlugin.java:56`, `:154-185` i `:206-214`.
- **Evidència reproduïble:**
  1. `CompartirNatiuPlugin` crea `private final ExecutorService copiador = Executors.newSingleThreadExecutor();` com a camp d'instància, però no sobreescriu `@Override protected void handleOnDestroy() { copiador.shutdownNow(); }`. Si Android destrueix i recrea `MainActivity` dins del mateix procés JVM, el fil de l'executor anterior roman viu.
  2. A `esUriAcceptable(Uri uri)`, `autoritat` es compara amb `propi` (`getPackageName()`) sense `.toLowerCase(Locale.ROOT)`. Normalitzar `autoritat = autoritat.substring(autoritat.lastIndexOf('@') + 1).toLowerCase(Locale.ROOT);` blinda la comparació contra resolucions `ContentResolver` insensibles a majúscules.
  3. Al bucle de `SEND_MULTIPLE`, `acceptats < MAX_FITXERS` només incrementa en imatges vàlides; afegir un sostre total d'URIs examinades (p. ex. `Math.min(uris.size(), 32)`) i verificar `textos.length() < MAX_CARACTERS_TEXT` abans de `llegirTextUri` evita amplificació de memòria en intents amb centenars d'URIs.
- **Font de veritat amb què entra en conflicte:** Tasca 1 del prompt d'auditoria (`261026_1615_prompt_gemini_gauntlet_share_target`).
- **Proposta conservadora:** Sobreescriure `handleOnDestroy()` amb `copiador.shutdownNow()`, limitar el nombre d'URIs inspeccionades i la longitud acumulada de `textos`, i aplicar `.toLowerCase(Locale.ROOT)` a `autoritat`.
- **`requires_human_decision`:** `false`.

##### `G1615-05` · **[MILLORA]** · iOS: doble instanciació inicial de `CAPBridgeViewController` per convivència de `UISceneStoryboardFile = Main` i `SceneDelegate.swift`
- **Fitxer i línies:** `ios/App/App/Info.plist:56-57`, `ios/App/App/Base.lproj/Main.storyboard:20` i `ios/App/App/SceneDelegate.swift:10-16`.
- **Evidència reproduïble:** `Info.plist` declara `UISceneStoryboardFile = Main` (on el controlador inicial és `CAPBridgeViewController`), de manera que UIKit instancia automàticament una primera finestra amb `CAPBridgeViewController` (i el seu `WKWebView`) abans d'invocar `SceneDelegate.scene(_:willConnectTo:options:)`, on es crea una segona `UIWindow` amb `ControladorSdp()` que substitueix la primera.
- **Font de veritat amb què entra en conflicte:** Higiene d'arrencada i memòria nativa a iOS (`[[261026_1615_pla_implementacio_share_target_notificacions_i_xat]]` §2.2).
- **Proposta conservadora:** Eliminar la clau `UISceneStoryboardFile` de `UIApplicationSceneManifest` a `ios/App/App/Info.plist` (ja que `SceneDelegate` crea la finestra per codi amb `ControladorSdp()`) o declarar `customClass="ControladorSdp"` a `Main.storyboard`.
- **`requires_human_decision`:** `false`.

##### `G1615-06` (convergent amb `C1615-10` de Codex) · **[MILLORA]** · Suite de pre-commit (`vitest.precommit.config.js`): incloure les noves suites de compartició i avisos al pre-commit
- **Fitxer i línies:** `vitest.precommit.config.js:35-50`.
- **Evidència reproduïble:** `src/natiu/compartirNatiu.seguretat.test.js` i `src/natiu/frontera.test.js` entren a `npm run test:precommit` pels patrons `src/**/*.seguretat.test.{js,jsx}` i `src/**/frontera*.test.js`, però `src/natiu/projecteAndroid.test.js`, `src/natiu/projecteIos.test.js`, `src/natiu/avisosNatius.test.js`, `src/config/{compartirNatiu,avisosNatius}.test.js`, `ReceptorCompartit.test.jsx`, `DialegCompartir.test.jsx` i `ControlsAdjunt.compartir.test.jsx` queden fora de `PRECOMMIT_INCLUDE`.
- **Font de veritat amb què entra en conflicte:** Tasca 4 del prompt d'auditoria.
- **Proposta conservadora:** Afegir `'src/natiu/{projecte*,avisosNatius}.test.js'`, `'src/config/{compartirNatiu,avisosNatius}.test.js'` i `'src/sections/xat/{ReceptorCompartit,components/DialegCompartir,components/ControlsAdjunt.compartir}.test.jsx'` a `PRECOMMIT_INCLUDE` dins de `vitest.precommit.config.js`.
- **`requires_human_decision`:** `false`.

---

### Contrast sobre `C1615-03`, `C1615-08` i `C1615-09` de `[[261026_1615_auditoria_codex]]`

- **Sobre `C1615-03` i `C1615-08` (alliberament anticipat dels fitxers natius després del `fetch` a `src/natiu/compartirNatiu.js:65`):** Codex assenyala que `src/natiu/compartirNatiu.js` crida `allibera(connector, caminsPerAlliberar)` tan bon punt el WebView ha carregat els `File` en memòria (`Blob`), de manera que les URLs emeses a l'esdeveniment DOM `sdp:compartir_natiu` ja apunten a fitxers esborrats i, si el sistema operatiu mata l'App abans de prémer «Envia», el lot no sobreviu a un reinici. **Veredicte Gemini:** És molt net posposar la crida a `allibera()` fins que el lot es descarte o es consumisca completament al registre (o passar els `File` ja oberts en `sdp:compartir_natiu`), resolent `C1615-08` i evitant l'esborrat prematur sense necessitat d'introduir una nova base de dades persistent.
- **Sobre `C1615-09` (cursa entre `createChannel` i tornada a primer pla a `src/natiu/avisosNatius.js:63-80`):** Si l'App torna a primer pla mentre `asseguraCanal()` o `schedule()` estan en vol, revalidar `document.visibilityState === 'hidden'` (o portar un comptador de generació de `netejaAvisos()`) just abans de `connector.schedule(...)` és una guarda de 3 línies neta i recomanable.

---

### Validació de les Decisions `D-1` a `D-6` de Claude (`[[261026_1815_auditoria_claude]]`)

1. **`D-1` (Sense auto-enviament):** **[CONFORME]**. Tota compartició requereix triar conversa a `DialegCompartir` («Envia a…») i prémer «Envia el fitxer» o «Envia» al compositor.
2. **`D-2` (Pont d'iOS via App Group + esquema URL `socdepoble://compartir`):** **[CONFORME]**. És el patró estàndard de producció en iOS quan l'app principal és un WebView de Capacitor i no té base de dades nativa SQLite compartida amb l'extensió.
3. **`D-3` (Avisos natius per sondeig de 60 s en segon pla + `@capacitor/local-notifications`):** **[CONFORME]**. Respecta l'absència de FCM/APNs, no consumeix xarxa si el permís no està concedit, silencia converses silenciades o arxivades i neteja la barra en tornar a l'App.
4. **`D-4` (Camp de peu restringit als lots del menú «Compartir»):** **[CONFORME]**. Fidel a l'abast del pla i cobert per les proves de regressió (`ControlsAdjunt.compartir.test.jsx`).
5. **`D-5` (Sanejament de textos del Xat i « escriu… » en 5 idiomes):** **[CONFORME]**. Zero punts suspensius ASCII ni vocabulari anglicitzat (`online`); paritat completa als 5 diccionaris verificada per `tests/lint_xat.test.mjs`.
6. **`D-6` (Desbloqueig del `Proxy` de Capacitor a `entradaSocial.js`):** **[CONFORME]**. Correcció imprescindible i demostrada amb prova unitària sobre `Proxy` amb trampa `then`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades des de `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org` amb resultat íntegre en verd (codi d'eixida `0`):

1. `node tooling/gates/porta-olivera.mjs` → **VERD** (`10 fitxer(s) a l'Escriptori, 0 arxivat(s), 0 pendent(s)`).
2. `npm run test:precommit` → **VERD**:
   - Vitest (`vitest.precommit.config.js`): **166 fitxers passats, 3.171 proves passades, 0 fallades** (`23,62 s`).
   - Node test runner (`tests/fortificacio.test.mjs`, `tests/dist-secrets.test.mjs`, `tests/migracio-*.test.mjs`, `tests/tractor-rls-realtime.test.mjs`, `tests/xat_f0_migracio.test.mjs`, `tests/documental.test.mjs`, `tests/porta-reflex.test.mjs`): **262 proves passades, 0 fallades** (`3,01 s`).
3. `npx vitest run src/natiu/projecteAndroid.test.js src/natiu/projecteIos.test.js src/natiu/compartirNatiu.seguretat.test.js src/natiu/avisosNatius.test.js src/config/compartirNatiu.test.js src/config/avisosNatius.test.js src/sections/xat/ReceptorCompartit.test.jsx src/sections/xat/XatContext.avisosNatius.test.jsx src/sections/xat/components/ControlsAdjunt.compartir.test.jsx src/sections/xat/components/DialegCompartir.test.jsx src/sections/xat/XatSection.acces.capes.test.js src/sections/xat/XatSection.avatars.test.jsx` → **VERD** (**12 fitxers passats, 193 proves passades, 2 skipped, 0 fallades** en `3,92 s`).
4. `node --test tests/lint_xat.test.mjs tests/natiu-build.test.mjs` → **VERD** (**49 proves passades, 2 skipped, 0 fallades** en `1,47 s`, incloent ESLint amb zero avisos i paritat i18n en `ca`, `es`, `en`, `eu`, `gl`).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Els 2 tests marcats com a `skipped` a `projecteAndroid.test.js` (`./gradlew compileDebugJavaWithJavac`) i `projecteIos.test.js` (`xcodebuild`) són proves optatives que s'activen amb `SDP_PROVA_COMPILACIO_NATIVA=1` o abans de generar els binaris `.aab`/`.ipa` de botiga.
- **Retroalimentació d'enginyeria de prompts sobre la plantilla `prompt_local.md` (v3.10.0):**
  - El bloc de context arquitectònic i l'enquadrament del Gauntlet Loop a `[[261026_1615_prompt_gemini_gauntlet_share_target]]` són nítids i proporcionen la traçabilitat exacta dels fitxers a auditar.
  - Com a millora per a la plantilla `prompt_local.md`, convé indicar explícitament al bloc «Protocol d'Interacció i Sortida» la comanda exacta del generador documental (`node tooling/wiki/document.mjs context/create --turn-id <torn> --route auditoria --file ...`) perquè cap agent local intente crear l'informe d'auditoria sense passar pel segell Reflex del torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261026_1615_pla_implementacio_share_target_notificacions_i_xat]]
- [[261026_1615_prompt_claude_share_target_notificacions_i_xat]]
- [[261026_1615_prompt_gemini_gauntlet_share_target]]
- [[261026_1615_prompt_codex_gauntlet_share_target]]
- [[261026_1815_auditoria_claude]]
- [[261026_1615_auditoria_codex]]
