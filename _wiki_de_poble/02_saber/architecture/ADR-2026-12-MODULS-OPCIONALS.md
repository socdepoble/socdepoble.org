---
type: norma
status: esborrany
description: Contracte sdp.modul.v1 dels mòduls opcionals (la Gestoria, el primer), el nucli SocDePoble.nucli, la guarda financera i el pressupost de pes del paquet de WordPress.
tags:
  - arquitectura
  - maquina
---
# ADR-2026-12 — Mòduls opcionals i nucli ultralleuger

Esta ADR fixa com una app de la Plataforma d'Apps Enxufables viu fora del paquet del nucli: es compila a banda, l'amfitrió la registra i la plataforma en carrega el codi quan algú l'obri. La Gestoria és el primer mòdul. La recepta és la mateixa per al Rebost, el TPV, Salut i l'RSS, però d'eixes quatre només se n'ha comprovat que el manifest val com a mòdul: el cos de cada una passarà les guardes quan es compile.

## Estat

Pendent de signatura del Mestre. Aplicada el 261009 (Onada 6, de nit) amb les decisions per defecte de l'auditoria `261009_0310_auditoria_claude`, totes reversibles.

L'ordre del Mestre, al punt 5 del prompt `261009_0230_prompt_claude_onada6` (línia 73), diu:

> «La Gestoria no pot lastrar el pes de l'app de WordPress. Fes l'arquitectura de plugins perquè siga un mòdul opcional de GitHub. Aquesta filosofia hipermodular d'enxufes s'ha d'aplicar a la resta de funcionalitats secundàries (Rebost, TPV, Salut, RSS, etc.). El nucli ha de ser ultralleuger i la resta s'ha de poder connectar o desconnectar.»

Esta nit no s'ha llevat el doble pany de desenvolupament de la Gestoria ni s'ha mogut el seu CSS: la Gestoria del Mestre per a dilluns no canvia. Això és la fase 2 (més avall).

## Context

- Ja hi havia una plataforma d'apps (`src/apps/plataforma`), però de compilació. Una app interna porta `carrega` darrere d'un literal (`import.meta.env.DEV || VITE_SDP_APP_<ID> === '1'`) i una externa només pinta un custom element que l'amfitrió ha de portar. Encendre una app volia dir recompilar.
- El JS de la Gestoria ja no entra al paquet: `carrega` val null en producció i `AppGestoria.jsx` no porta cap vista fora de DEV (el doble pany que vigila `src/sections/gestoria/privacitat.test.js`). L'inventari del build del 261008 no té cap tros seu.
- El que sí que hi entra:
  - el CSS de la Gestoria, dins de `src/css/modules.css` (196 línies hi nomenen `sdp-gestoria` el 261009 a les 04:53, i creixen amb la feina de la Gestoria), inlinat al tros d'entrada per `index.css?inline` (`src/PedraSecaEmbed.jsx:105`);
  - les seues imatges (`assets/nano_cards/gestoria_nano_card.jpg` i `assets/ui/plugins/gestoria_vinyeta.jpg`), perquè `recursosDelPlugin` copia tot `public/` (`vite.standalone.config.js`).
- El pes de debò no és la Gestoria. El build real del 261009 a les 04:10 (`node --test tests/standalone-build.test.mjs`, a una carpeta temporal) mesura:
  - un tros d'entrada de 1.619.768 B (449.347 B en gzip), 27.913 B més que el del 261008 (1.591.855 B), amb tota la feina de l'Onada 6 a l'arbre;
  - dins de l'entrada, `index.css?inline` 378.653 B, `i18n.js` 250.041 B, els dos logotips SVG rectangulars 138.513 B i 138.512 B, `react-dom` 133.838 B, DOMPurify 129.021 B i `pageContent.js` 106.582 B.
- La CSP del lloc és `script-src 'self'`, sense `blob:` (`vercel.json:8`, `index.html:17`).
- Els import maps amb `integrity` queden fora del Baseline 2022 (Safari 16, Firefox 100).
- La variant del directori de WordPress.org no pot baixar codi executable de fora.

## Decisió

### 1 · El contracte sdp.modul.v1

Un mòdul és un manifest `sdp.app.v1` amb un tercer origen, «modul» (`src/apps/plataforma/manifestApp.js`). Porta les claus comunes de sempre i tres de pròpies:

- `cos: { cami, integrity }`. El script del cos. `cami` és un camí des de l'arrel (`/…`, mai `//…`) o una URL http(s) absoluta sense credencials, d'un fitxer `.js`, sense espais ni barres invertides. `integrity` és un SRI sha384.
- `estils: { cami, integrity }`, opcional, d'un fitxer `.css`.
- `nucli: '^1'` o `'^1.0'`: el rang del nucli que necessita.

No admet `carrega` ni `element`. Les capacitats són de `CAPACITATS`, com per a tota app. Un rang que este nucli no satisfà no entra al registre (`registraModul` de `registreApps.js`).

### 2 · Tres claus noves a l'API de l'amfitrió (sdp.amfitrio.v1, additives)

`window.SocDePoble` guanya tres claus al final de `CONTRACTE_AMFITRIO_V1.api.claus` (`src/config/contracteAmfitrio.js`, amb la secció `moduls`):

- `registraModul(manifest)`. El fitxer de registre del mòdul la crida. Si encara no ha arribat l'API real, el SocDePoble provisional del paquet trossejat l'encua com la resta de verbs.
- `lliuraCos(id, fabrica)`. El script del cos la crida mentre s'executa. Només val per a un mòdul que la plataforma està carregant i des del script que hi ha injectat (`document.currentScript`). La resta s'ignora i torna `false`.
- `nucli`. Una lectura, com `isReady`: val `null` fins que un mòdul el demana. En el provisional val `undefined` fins a l'adopció (`src/config/carregadorDelPaquet.js`).

Cap verb nou a `SocDePobleCua` ni al pont d'iframe. El Model B no canvia: cap clau toca el backend ni l'abast de dades.

### 3 · El carregador (`src/apps/plataforma/carregaModul.js`)

Quan algú obri `/app/<id>/…` d'un mòdul, el registre en fa el component amb `carregaCos`:

1. Comprova que el cos i els estils són del MATEIX origen que la pàgina. Si no, no injecta res.
2. Demana el nucli amb `import()`. És un tros a banda: el paquet no el paga fins ara.
3. Injecta `<script src integrity crossorigin="anonymous" data-sdp-modul>`. El navegador el baixa i en comprova la integritat; res de `fetch` ni de `blob:`.
4. Espera `lliuraCos` de ESTE script. `fabrica(nucli)` ha de tornar un component.

Si el fitxer no baixa o no casa amb la integritat (`error`), si s'executa sense lliurar res (`load`), si no arriba en 120 s o si la fàbrica falla, ix un `LazyRouteError`: la ruta ho explica (`RouteErrorBoundary`) i no es recarrega res.

El temps límit només ha de tallar un fitxer penjat: `error` i `load` ja diuen quan una baixada falla. Un `<script>` no avisa del progrés, i el temps compta també mentre baixa; per això és de dos minuts, perquè una baixada lenta però bona, amb la xarxa d'un poble, no caiga.

Com tota ruta lazy (`lazyRoute.js`), una fallada es queda fins que es recarrega la pàgina, o fins que l'amfitrió retira el mòdul i el torna a registrar (`retiraAppExterna` n'oblida el cos).

Els estils es pinten com un `<link rel="stylesheet" integrity>` dins del mateix arbre que el cos, perquè arriben també dins d'un Shadow DOM.

### 4 · El nucli (`SocDePoble.nucli`, v1.0.0)

Un objecte congelat i versionat amb semver (`src/apps/plataforma/nucliModuls.js`). Les portes i els noms els fixa `src/apps/plataforma/contracteNucli.js`:

- `React`: el React de la pàgina, sencer;
- `jsxRuntime`: `jsx`, `jsxs` i `Fragment`;
- `router`: `useLocation`, `useNavigate`, `useParams`, `useSearchParams`, `Link`, `NavLink`, `Navigate`, `Routes`, `Route` i `matchPath`;
- `plataforma`: l'API pública sencera de les apps (`plataforma/index.js`), també `useSessioApp`, el pont de sessió de només lectura;
- `pedraSeca`: tot el que importen la Gestoria i els Tractors que arrossega (Boto, Insignia, els estats, Alerta, Dialeg, Taula, formulari, controls, PaginaApp, UniversalCard, Pestanyes i Accordion de l'Històric i ControlContrasenya del Cofre) i les dues peces de gràfics de les apps (Histograma i LiniaDelTemps).

`src/apps/plataforma/guardesDelModul.test.js` contrasta esta llista amb l'arbre de veritat: un import nou de Pedra Seca a la Gestoria o als Tractors que no siga del nucli el posa en roig abans que el build del mòdul s'ature.

Mai hi ha el port del backend, `SessionContext` ni `IdentitatContext`.

Afegir una porta o un nom és un canvi menor de `VERSIO_NUCLI`; llevar-ne o canviar-ne un és major i trenca els mòduls publicats.

### 5 · El build d'un mòdul (`vite.modul.config.js`)

```bash
SDP_MODUL=gestoria npx vite build -c vite.modul.config.js
```

Emet a `wordpress-plugin/moduls/<id>/dist/`:

- `cos-<hash>.js`, un IIFE clàssic i només ASCII que crida `SocDePoble.lliuraCos`. Cada importació de React, del router, de la plataforma o de Pedra Seca es mapeja a `SocDePoble.nucli.<porta>`.
- `estils-<hash>.css`, si en porta.
- `modul.js`, el registre: crida `registraModul` amb l'URL del cos germana d'ell mateix i la seua integritat.
- `sdp-modul.json`, la fitxa amb sha256 i SRI de cada fitxer.

El build s'atura si:

- el cos porta un React, un react-dom o un scheduler propis;
- porta un context de la pàgina, la capa de dades, `host.js` o `config/storage.js`;
- porta plataforma o Pedra Seca fora del nucli;
- importa un nom que el nucli no exposa;
- deixa un `import()` sense inlinar;
- obri xarxa: `fetch` (també per claudàtors), `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `importScripts`, WebRTC, WebTransport, el registre d'un service worker, una imatge-balisa (`new Image`) o una URL protocol-relativa (`//host`);
- fa servir un magatzem del navegador que el mòdul no declara (IndexedDB, `localStorage`, `sessionStorage`, galetes o la Cache API);
- porta una URL de fora que no és una dada declarada pel mòdul.

Les guardes del text viuen a `src/apps/plataforma/guardesDelModul.js`, un fitxer pur que lligen el build i les proves. Separen dues coses:

- **La xarxa** es veta sempre, per a tots els mòduls.
- **Les adreces que són dada** (el text de l'URL de cotejo de l'AEAT dins del QR, l'adreça de redacció de Gmail que obri la persona, els espais de noms d'OOXML) valen només per al mòdul que les declara, host per host. Ningú s'hi connecta. Els espais de noms del W3C valen per a tots.

La Gestoria declara els hosts de la llista blanca de `src/sections/gestoria/privacitat.test.js`, aprovada pel Mestre, i `localhost:3340`. Este últim surt de la fitxa signada del tractor `gestoria.factures`, que diu a la persona que òbriga la Wiki ací per a signar amb WebAuthn. La Gestoria només declara IndexedDB.

`guardesDelModul.test.js` comprova que la declaració és exactament eixa llista més les adreces de les fitxes. També passa totes les guardes a la clausura del pont, amb les quatre vistes, des del codi font i sense compilar.

Cap `VITE_*` del projecte entra al cos (`envPrefix` sense cap variable).

### 6 · La guarda financera

`dadesPersonals: 'financeres'` exigix ara `amaDelDocument === true`, com `'salut'` (`src/apps/plataforma/interruptors.js`). Porta el seu motiu, `document-no-propi-financeres`, i el seu text al portal i a `/plugin/<id>`.

La Gestoria no s'obri mai dins d'un WordPress ni de l'iframe d'un tercer, ni encara que l'amfitrió la declare a `apps`: allà l'IndexedDB és de l'origen de l'amfitrió i la poden llegir tots els seus connectors i scripts.

El `dadesPersonals` d'un mòdul o d'una app externa el posa l'amfitrió que el registra, i res no el lliga amb el cos signat. Per això els ids amb dades sensibles queden reservats (`DADES_RESERVADES` de `registreApps.js`): `gestoria` ha de declarar `'financeres'` i `salut`, `'salut'`. Si no, el registre no l'admet, tampoc com a app externa. La reserva es conserva encara que la Gestoria isca de les apps internes a la fase 2. Una verificació del manifest contra la fitxa signada (`sdp-modul.json`) és part del punt 5 de la fase 2.

### 7 · El pressupost de pes (`src/apps/plataforma/pesDelNucli.test.js`)

Un trinquet sobre el paquet ja construït (`wordpress-plugin/dist`) que comprova tres coses:

- cap tros de `trossos/` porta el nom d'un mòdul propi de la Gestoria, del Bar, de Salut, de la Nevera o del Lector;
- cap tros, tampoc el d'entrada (on Rollup podria inlinar codi sense deixar-ne el nom), porta el codi d'una d'estes apps. Les marques són els noms de les seues bases d'IndexedDB: contractes de dades estables que el minificador no toca. Una prova sense build comprova que cada marca és al codi de la seua app i en cap fitxer del nucli. La Wiki compilada no compta, perquè és text de documentació que les nomena;
- el tros d'entrada no passa de 1.591.855 B (el del 261008).

Té dues proves `[DEFECTE]` que reproduïxen el deute i s'han de girar a la fase 2: el CSS de la Gestoria dins del tros d'entrada i els seus mitjans dins del paquet.

El títol de la prova diu de quan és el build que mesura (`generat` de `sdp-release.json`). El dist no es reconstruïx sol, i hui és el del 261008 a les 22:01: passa perquè el sostre és la seua mida, no perquè l'arbre d'ara hi càpia. Sense build, les proves del dist se salten i vitest les compta com a saltades, mai com a verdes.

### 8 · Els tres registres no s'unifiquen esta nit

`registreApps` (ids `bar`, `nevera`, `lector`…), `registrePlugins` (`tpv`, `rebost`, `rss`…) i `profile/aplicacions.js` (`lector-rss`, amb la taula `ALIES_DEL_PANELL`) descriuen les mateixes utilitats amb ids divergents. Unificar-los demana:

- tocar `src/sections/plugins` i `src/sections/profile`, fora d'este front;
- migrar les preferències desades amb els ids vells;
- portar les dades de les targetes (títol, entradeta i imatge) al manifest, una clau nova que obliga a versionar l'esquema tancat `sdp.app.v1`.

No es pot fer sense cap canvi visible ni risc per a les preferències: queda com a pregunta.

## Alternatives descartades

- **Import maps amb `integrity`**: fora del Baseline 2022.
- **`fetch`, verificació i `blob:`**: la CSP no ho deixa i els imports relatius del mòdul es trencarien.
- **Mòduls ESM amb trossos**: el navegador no verifica els trossos (`wordpress-plugin/includes/marcatge.php`). Un fitxer clàssic amb `integrity` sí que es verifica sencer.
- **L'app externa com a custom element autònom** (`sollutia-*`, `sdp-ext-*`): aïlla més, però duplica React i Pedra Seca a cada mòdul i no té pont de sessió. Continua disponible per a amfitrions que vulguen portar la seua UI.
- **Un `SocDePoble.nucli` estàtic a `host.js`**: portaria al tros d'entrada Pedra Seca que avui va en trossos a banda (Taula, PaginaApp, UniversalCard…). El nucli es demana només quan cal.

## Conseqüències

- Una app pot viure fora del paquet i connectar-se o desconnectar-se sense recompilar el nucli: l'amfitrió encua o no el seu `modul.js`. Desconnectar-la és no encuar-lo; dins de la pàgina, `retiraAppExterna(id)` la lleva del registre i n'oblida el cos.
- `SocDePoble.nucli` és un contracte públic nou: cada canvi a `plataforma/index.js` o a la Pedra Seca del contracte s'ha de pensar en semver. `nucliModuls.test.js` posa en roig qualsevol desajust entre l'objecte i la llista.
- Un mòdul hereta les capes de sempre: entorn, amfitrió (`apps`), persona, capacitats del backend, dret premium i, ara, document propi per a salut i finances.
- Pedra Seca no es mira per dins: `PaginaApp` arriba al port del backend per `PageFrame` i `useResolvedAsset`, que resol les imatges, igual que per a les apps internes. El mòdul no en rep cap mànec.
- La directiva de Sollutia no canvia: `src/data/adaptadors/sollutia/` no es toca, el port del backend tampoc, i el kit de conformitat i la bateria d'amfitrió passen.

## Fase 2 (després de dilluns, amb ordre del Mestre)

1. **El pany DEV.** Llevar el doble pany d'`AppGestoria.jsx` només per al build del mòdul. Avui `privacitat.test.js` el prohibix a posta. Fins llavors el cos de la Gestoria compilat com a mòdul només diu «La Gestoria no és en este paquet» (`modulDeBuild.test.jsx` ho comprova).
   - La recepta ja s'ha provat amb la Gestoria sencera. `modulDeBuild.test.jsx` la compila en memòria amb el literal de DEV forçat a cert només en eixa prova: les quatre vistes i els Tractors que arrosseguen. Passa totes les guardes amb la declaració de la Gestoria, i sense la declaració no passaria. El producte no canvia.
   - Llevar el pany no demana tocar el build. Sí que demana decidir el pes del cos (punt 8).
2. **El CSS.** Moure el CSS de la Gestoria de `modules.css` a un full propi que el build del mòdul emeta com a `estils-<hash>.css`, i el dels Tractors al seu. Cal decidir si es relaxa el veto d'importar CSS a les apps (`src/apps/comu/qualitat.test.js`).
   - Llei del Píxel: captures abans i després de `/app/gestoria/tauler`, `/app/gestoria/facturacio`, `/app/gestoria/aprendre` i `/app/gestoria/historic`, en clar, en fosc i en Bancal, al servidor de desenvolupament (port 3340).
   - Moure el bloc canvia l'ordre dins de `@layer components`: un empat d'especificitat podria canviar de guanyador.
   - Quan estiga fet, la prova `[DEFECTE]` del CSS es gira.
3. **Els mitjans.** Una llista d'exclusions per mòdul a `recursosDelPlugin`, i la segona prova `[DEFECTE]` es gira.
4. **El lloc propi (socdepoble.org).** És l'únic amfitrió on la Gestoria es pot obrir: la guarda financera exigix el document propi, i `src/main.jsx` és l'única entrada que el té. El camí, en cinc passos:
   - El build del lloc (`vite.config.js`) llig `wordpress-plugin/moduls/<id>/dist/sdp-modul.json` de cada mòdul que el lloc connecta.
   - Copia el cos, els estils i el registre a l'arrel de `dist/assets/` amb noms `<nom>-<hash de 8>.<ext>` (`cos-…js`, `estils-…css` i el registre reanomenat `modul-…js`).
   - Eixos noms ja casen amb `RECURS_AMB_EMPREMTA` del service worker (`public/sw.js`), sense patró nou.
   - El registre entra a la pàgina com un `<script src integrity crossorigin>` del mateix origen, després de `exposaGlobal()`. Pot ser un connector de Vite que l'escriga a `index.html` darrere del mòdul principal, o `main.jsx` que l'injecte. La CSP `script-src 'self'` ja ho permet.
   - Desconnectar el mòdul vol dir traure'l de la llista del build del lloc.
5. **WordPress, només per a mòduls sense dades sensibles.** Un connector afegit per mòdul (`Requires Plugins: socdepoble-enxufe`) que verifique la signatura Ed25519 de `sdp-modul.json` amb sodium (com `actualitzador.php`), encue `modul.js` amb `integrity` després del paquet i afija l'id a `apps`. Sense clau pública no s'encua cap mòdul.
   - No s'aplica a cap mòdul amb `dadesPersonals` `'financeres'` o `'salut'`. La guarda el deixaria «no disponible» i el connector només n'exposaria el codi. L'empaquetador no en fa connector de WordPress.
   - El nucli hauria de verificar el manifest que registra l'amfitrió contra la fitxa signada abans d'admetre'l. Fins llavors, la defensa és la reserva d'ids (§6).
6. **L'empaquetador.** `--modul <id>` a `wordpress-plugin/eines/empaqueta.mjs`, que signe fora de línia. GitHub Releases és el canal on es publiquen els zips, mai la font que demana el navegador.
7. **Sense xarxa.** El service worker només fa closca de `/assets/<nom>-<hash8>.*` (`public/sw.js`). Amb el punt 4 els fitxers del mòdul hi casen. Falta que la pàgina els incloga al missatge d'escalfament de la closca de `/app/<id>/`, amb la seua prova (`src/pwa/sw.test.js`), abans que la Facturació sense xarxa depenga d'un mòdul.
8. **El pes del cos de la Gestoria.** Compilada sencera, fa 2.383.329 B. El cos és ASCII: cada lletra accentuada hi ocupa 6 bytes (`\uXXXX`). La major part és el text font dels dos carrils (Gestoria i Tractors), que `src/sections/tractors/registreTractors.js` inlina amb `import.meta.glob(…, { query: '?raw' })` per a calcular l'empremta que el Mestre aprova. Cal decidir si l'empremta es precalcula al build del mòdul o si el cos porta el text. Ara no pesa al nucli: només es baixa quan algú obri la Gestoria.
9. **El nucli lleuger.** Les mesures del context diuen on és el pes: el CSS global, el diccionari, els logotips SVG inlinats, la Wiki i la Consola. Cada peça és una decisió pròpia.

## Preguntes al Mestre

1. La Gestoria ha de funcionar dins del WordPress d'un tercer? Esta ADR diu que no: les dades financeres només s'obrin a la pàgina pròpia.
2. «Mòdul opcional de GitHub» vol dir un artefacte a les Releases d'este repositori (la proposta) o un repositori separat? Un repositori separat demanaria publicar el contracte del nucli com a paquet.
3. Acceptes `SocDePoble.nucli` com a contracte públic versionat amb semver?
4. Autoritzes llevar el pany DEV d'`AppGestoria.jsx` per al build del mòdul (fase 2)?
5. Qui genera i on es custodia la clau privada Ed25519 dels mòduls?
6. Les targetes del Panell i les pàgines `/plugin/<id>` d'un mòdul no instal·lat han de desaparéixer a WordPress? És un canvi visible.
7. Unifiquem els tres registres amb l'id de l'app com a únic identificador, i migrem les preferències amb els àlies?
8. El sostre del tros d'entrada: el build real de l'arbre del 261009 ja el passa, i creix amb la feina concurrent de l'Onada 6 (1.619.768 B a les 04:10 i 1.626.651 B a les 04:56, `node --test tests/standalone-build.test.mjs`). S'apuja a posta o s'aprima el nucli abans del pròxim build?
9. El cos de la Gestoria porta el text font dels dos carrils per a l'empremta dels tractors (fase 2, punt 8). Es precalcula l'empremta al build del mòdul o es manté el text dins del cos?

## Límits coneguts

- **L'ordre del build no s'ha executat amb la CLI.** `npx vite build -c vite.modul.config.js` amb `@vitejs/plugin-react` és NO VERIFICADA. La resta s'ha verificat amb builds reals en memòria (`write: false`) i el JSX de l'esbuild de Vite: externs, globals, guardes, registre, fitxa i ASCII.
  - El mòdul de prova, executat amb el `SocDePoble.nucli` real.
  - La Gestoria amb el seu pany, que només dona el taló.
  - La Gestoria sencera amb el literal de DEV forçat només en la prova. Esta passa les guardes, i el pany del producte no canvia.
- **El sostre caurà.** `pesDelNucli.test.js` llig l'inventari del 261008. Quan es torne a construir el paquet, el sostre de 1.591.855 B fallarà amb la feina de l'Onada 6. És el trinquet: s'ha de decidir (pregunta 8).
- **Cap navegador real.** jsdom no executa scripts amb `src`: l'SRI i la càrrega real d'un cos no s'han provat en un navegador. El camí que falla (un cos que no existix) sí que s'ha vist al navegador.
- **Cap amfitrió carrega encara cap `modul.js`.** No hi ha connector de WordPress ni res al lloc propi: `registraModul`, `lliuraCos` i el carregador només s'abasten des de la consola o des de les proves. El camí del lloc propi és el punt 4 de la fase 2.
- **Un sol carregador per pàgina.** Si la pàgina té dues instàncies de `<soc-de-poble>`, totes dues compartixen el registre i el carregador del document, com fins ara amb les apps externes.
- **Els textos dels motius** del portal (`PortalApps.jsx`) continuen sense passar per `i18n.js`, com tots els d'eixa taula.

## Proves

- `src/apps/plataforma/manifestApp.test.js`: l'origen «modul», el cos, els estils, la integritat i el rang; els camins que no passen (protocol-relatiu, barra invertida, `javascript:`, `data:`, credencials).
- `src/apps/plataforma/registreApps.test.js`: `registraModul`, l'id ocupat, els ids reservats a dades sensibles, el nucli incompatible i el component lazy que oblida en retirar.
- `src/apps/plataforma/interruptors.test.js`: la guarda financera, la Gestoria real dins d'un WordPress i d'un iframe, i el mòdul fora de la capa de build.
- `src/apps/plataforma/carregaModul.test.jsx`, amb fàbriques escrites a mà (jsdom no executa cap `<script src>`):
  - el mateix origen, la integritat i el `currentScript`;
  - `error`, `load` sense lliurament, el temps límit, la fàbrica dolenta i els estils;
  - el nucli real, carregat a soles;
  - de punta a punta a `/app/<id>`, amb `RouteErrorBoundary` quan falla.
- `src/apps/plataforma/nucliModuls.test.js`: l'objecte i el contracte diuen el mateix, les instàncies són les de la pàgina i cap porta dona backend ni sessió.
- `src/apps/plataforma/guardesDelModul.test.js`:
  - les guardes del text, amb una sonda per patró;
  - la declaració de la Gestoria contra la llista blanca de `privacitat.test.js`;
  - la clausura del pont amb les quatre vistes, també el text que porta per `?raw` i `import.meta.glob`, passada per les guardes del build;
  - cada import de Pedra Seca de la Gestoria i dels Tractors, contra el nucli.
- `src/apps/plataforma/modulDeBuild.test.jsx`:
  - els manifests reals de les cinc apps com a mòduls;
  - les guardes del cos, amb chunks sintètics;
  - el registre;
  - builds reals en memòria: el mòdul de prova (també executat amb el nucli real), la Gestoria amb el pany i la Gestoria sencera.
- `src/apps/plataforma/fronteres.test.js`: el nucli només importa React, el router, l'API pública i Pedra Seca; sense contexts de sessió; només el carregador l'importa, per `import()`.
- `src/apps/plataforma/pesDelNucli.test.js`: les marques de les apps, el pressupost de pes i els dos `[DEFECTE]`.
- `src/config/contracteAmfitrio.paritat.test.js`: les claus noves, l'ordre, `nucli` com a lectura i el provisional que encua `registraModul` i `lliuraCos`.

## Vincles

- [[00_index]]
- [[00_index_maquina]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-10-APPS-DEL-DISPOSITIU]]
- [[estandard_integracio_react]]
