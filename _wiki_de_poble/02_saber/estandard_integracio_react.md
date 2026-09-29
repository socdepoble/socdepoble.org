---
type: norma
status: canonic
description: "Contracte d'integració Model B: com Sollutia allotja el Web Component de Pedra Seca sense injectar backend ni reescriure el frontend."
tags:
  - core
  - govern
---
# Lleis de pas: integració de Pedra Seca a l'amfitrió

Pedra Seca s'entrega com un Web Component autònom, l'etiqueta soc-de-poble, que porta dins del Shadow DOM el seu React, el seu enrutador i els seus estils. Sollutia l'allotja i li passa configuració i sessió; el backend el tria i el segella Sóc de Poble (Model B).

**Document vinculant per a l'equip de Sollutia i per a qualsevol amfitrió que allotge el mòdul Pedra Seca.**

Aquest document estableix el contracte d'integració definitiu. Pedra Seca ja no es lliura com a "plantilles HTML/CSS per muntar", sinó com un component autònom, empaquetat i aïllat. L'equip de Sollutia actua com a amfitrió: carrega l'script, proveïx la configuració i, si cal, entrega la sessió de la persona usuària. No injecta backend ni reescriu el frontend: la font de veritat és el Supabase de Sóc de Poble, i SdP només llig de Sollutia per GET a través de la Frontissa ([[ADR-2026-09-SOLLUTIA-MODEL-B]]).

El contracte és agnòstic: no sap quin amfitrió té davant. Sollutia, WordPress (que només és banc de proves), MediaWiki o una pàgina estàtica l'allotgen amb el mateix marcatge, i totes reben l'App completa.

---

## LLEI 1: Integració Standalone via `<script>`

Cap amfitrió, tampoc Sollutia, reconstruïx el JSX ni fa un import ESM del mòdul: l'aplicació s'empaqueta de forma hermètica en un IIFE (Standalone) per protegir les versions de React.

### El marcatge universal: tres peces

Per a incrustar l'App, qualsevol amfitrió emet exactament aquestes tres peces, en aquest ordre:

```html
<!-- 1. Identitat de l'amfitrió, ABANS del bundle -->
<script>
  Object.assign(window, {
    SocDePobleConfig: Object.freeze({
      nomPoble: 'Gent de la Torre',
      poble: 'la-torre-de-les-macanes'
    })
  });
</script>

<!-- 2. L'element on viu l'App -->
<soc-de-poble
  plugin-url="https://amfitrio.exemple/socdepoble/dist/"
  fonts-href="https://amfitrio.exemple/socdepoble/dist/fonts/noto-sans.css"></soc-de-poble>

<!-- 3. El bundle autònom: script clàssic amb src, sense type="module" -->
<script src="https://amfitrio.exemple/socdepoble/dist/soc-de-poble.standalone.js"></script>
```

* WordPress, Sollutia, MediaWiki o una pàgina estàtica emeten això i res més: ni atributs de backend, ni regles de reescriptura, ni CSS sobre les classes internes. La mida de la caixa que conté l'element és maquetació de l'amfitrió.
* `wordpress-plugin/socdepoble-enxufe.php` és només un adaptador d'aquest marcatge (shortcode `[socdepoble_app]`, filtre `socdepoble_enxufe_config`). No porta lògica de l'App: qualsevol correcció de comportament viu al nucli (`src/`).
* `dist/` és l'eixida de `npm run build:wp` (`vite.standalone.config.js`). L'amfitrió la servix sencera com a fitxers estàtics.
* La peça 1 és opcional: sense res a declarar, l'App arrenca sense marca d'amfitrió i aterra a la portada.
* Atributs opcionals per instància: `nom-poble`, `poble`, `ruta-inicial` i `base-path`.
* Els atributs de backend (`supabase-url`, `supabase-anon-key`, `backend-url`, `tenant-id`, `bot-api-url`, `data-mode`) servixen als desplegaments propis de SdP i no formen part del marcatge d'un amfitrió: el backend el porta el paquet (vegeu «Backend segellat al paquet»). `data-mode` només admet `remote`, `seed` o `local`; qualsevol altre valor (com l'antic exemple «produccio») es llig com a `remote`.
* L'única addició admesa fora del marcatge és la sessió d'un amfitrió amb comptes propis (vegeu «Sessió»).

### El canal de l'amfitrió: `window.SocDePobleConfig`

* Només porta `nomPoble` i `poble` (`tenant` n'és àlies quan `poble` no es declara). Qualsevol altra clau es descarta sense llegir-la: backend, credencials, `tenantId` o mode de dades no entren per un global que qualsevol script de la pàgina pot escriure. Només es lligen claus pròpies d'un objecte pla.
* És presentació i navegació, mai abast de dades. `nomPoble` és el nom visible (fins a 80 caràcters, sense caràcters de control ni invisibles): l'App el pinta a la barra negra en escriptori i, en format compacte, en la franja «Estàs al servidor de {nom}». `poble` és l'id de l'element de la secció Pobles (p. ex. `la-torre-de-les-macanes`; minúscules, xifres i guions) i només tria on aterra qui entra.
* `poble` NO és `tenantId`. `tenantId` és l'UUID de `public.towns(id)`, l'abast de dades de Supabase. Confondre'ls faria que una dada de presentació governara quines files es lligen i s'escriuen.
* És la capa més baixa de les que declara algú (per davall només hi ha els defectes del paquet, que no hi compartixen cap clau) i es rellig en cada recàlcul de la configuració (`src/config/configAmfitrio.js`). Es declara abans del bundle i es congela amb `Object.freeze`. Val qualsevol forma que deixe un objecte pla en eixe global; el plugin de WordPress l'assigna directament.

### Precedència de la configuració

De menys a més prioritat; cada capa trepitja les anteriors (`composaCapes()`, `src/PedraSecaEmbed.jsx`):

1. Els defectes del paquet (`DEFECTES_DEL_PAQUET`): el backend de compilació, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DATA_MODE` i `VITE_TENANT_ID`. Només hi entren les variables que són text no buit, i es congelen una sola vegada, en avaluar-se el paquet.
2. `window.SocDePobleConfig` (només `nomPoble` i `poble`).
3. `window.SocDePoble.configura({ config })`, filtrada: no hi passen els àlies del backend (`backendUrl`, `backend_url`, `tenant_id`), que `configura()` ja ha portat a la seua clau canònica (`supabaseUrl`, `tenantId`), ni els valors buits (`undefined`, `null`, `''`), que no són cap declaració i no tapen els defectes del paquet.
4. L'script `application/json` referenciat per `config-id`.
5. L'atribut `config` (JSON).
6. Els atributs de l'etiqueta (`nom-poble`, `poble`, `ruta-inicial`, `base-path`, `plugin-url`, `fonts-href`…).
7. La propietat JS `element.config`.

Tot passa per `sanejaConfig()` (`src/PedraSecaEmbed.jsx`), que descarta claus desconegudes i tipa cada valor: `nomPoble` com a etiqueta, `poble` com a identificador, `rutaInicial` com a ruta interna, `basename` normalitzat (una base invàlida val com a absent), `routerType` només `'browser'` o `'memory'` i `manageDocumentHead` només booleà. Les URL de backend passen una llista d'orígens permesos, on sempre hi ha l'origen del `VITE_SUPABASE_URL` de compilació. `fonts-href` només s'accepta del mateix origen que la pàgina, de Google Fonts (`https://fonts.googleapis.com`), de Bunny Fonts (`https://fonts.bunny.net`) o de l'origen des d'on s'ha carregat el paquet (`ORIGEN_DEL_PAQUET`). Eixe origen és el de l'script del bundle, capturat una sola vegada en avaluar-se, abans que cap element fixe el seu `plugin-url`: el `plugin-url` viu de l'etiqueta no hi compta, perquè un atribut no pot declarar-se de confiança a si mateix. Si el paquet no sap on viu (carregat com a mòdul ES, com en desenvolupament), eixe origen és buit i no admet res.

### Backend segellat al paquet (Model B)

Sóc de Poble tria i segella el backend; l'amfitrió no el declara mai. Amb només les tres peces del marcatge universal, l'element pren l'endpoint de la capa 1, els defectes del paquet: el mateix backend de compilació que `src/embed.jsx` dona al `#root` del standalone. Cap capa de més amunt no ha de repetir-lo. Verificat per lectura del codi i per les proves de `src/PedraSecaEmbed.config.test.jsx`, no en un amfitrió real.

* `configura()` passa sempre per `normalizeBackendConfig()` (`src/config/backendConfig.js`), que deixa a la seua capa `backendId` i `dataMode` (per defecte `'remote'`): un amfitrió que la crida només per a `auth` fixa el mode remot encara que el paquet s'haja compilat amb un altre `VITE_DATA_MODE`. Verificat per lectura del codi.
* **Higiene de compilació.** Els defectes del paquet són les variables de la màquina que executa `npm run build:wp` (`vite build -c vite.standalone.config.js`, mode `production`). Vite hi llig `.env`, `.env.local`, `.env.production` i `.env.production.local`, i les variables que ja porta el procés guanyen a tots els fitxers. Un `.env.local` de desenvolupament (un Supabase local, per exemple) acaba segellat dins del paquet, i la llista d'orígens permesos l'admet perquè és el de compilació. Un paquet per a un amfitrió de producció s'ha de compilar amb les `VITE_*` de producció (al procés o a `.env.production.local`), i l'endpoint es comprova dins del paquet generat (`wordpress-plugin/dist/soc-de-poble.standalone.js`), no al servidor de desenvolupament.

### Política d'enrutament

La regla és una sola i no sap quin amfitrió té davant (`src/app/contexts/politicaRouter.js`):

* **Memòria per defecte.** Sense cap declaració, l'element incrustat navega en memòria: mai no toca la URL ni l'historial de l'amfitrió. El botó Arrere del navegador és de l'amfitrió.
* **Navegador només si es declara.** Amb una base (`base-path` o `basename`) o amb `routerType: 'browser'`, l'App és ama de la URL dins de la base. `routerType: 'browser'` sense base la fa ama de tota la URL: només per a un lloc propi, com el `#root` de socdepoble.org. `routerType: 'memory'` força la memòria encara que hi haja base.
* **Fora de la base, inert.** L'App no pinta rutes, no encén enllaços, no redirigix i no escriu a l'historial. L'amfitrió servix la pàgina amb el marcatge a qualsevol subruta de la base: `/comunitat/xat` torna la mateixa pàgina que `/comunitat/`.
* **Una sola ama.** Una segona instància a la mateixa pàgina navega sempre en memòria.
* **On aterra qui entra.** `ruta-inicial` / `rutaInicial` obri una pantalla concreta (camí i consulta interns; mai un origen, un esquema, un segment `..` ni un fragment). `poble` sense `ruta-inicial` obri `/pobles/<poble>`; un id que no existix mostra «Element no trobat».
* **Enllaços interns del contingut.** Només quan l'App viu incrustada (router en memòria, o de navegador amb una base declarada), els `<a href="?…">` i `<a href="/…">` crus dins del contingut (Wiki, articles, HTML del servidor) s'intercepten a l'arrel de l'App i es naveguen dins d'ella (`src/app/enllacosInterns.js`). Amb base, un camí que ja la porta la perd abans de navegar, perquè el router la hi posa una sola vegada. No s'intercepten els clics amb tecla modificadora o amb un altre botó, amb `target` distint de `_self`, amb `download`, ja cancel·lats, dins de contingut editable ni cap a recursos estàtics (`/assets/…`).
* **Mai a socdepoble.org.** Amb router de navegador sense base (`src/main.jsx`: `BrowserRouter` a `/`) l'interceptor no es munta: eixos enllaços fan la navegació nativa de sempre, amb recàrrega del document (Llei del Píxel).
* **Fet verificat (260929) · decisió de govern pendent (`requires_human_decision: true`): l'`href` dels enllaços en memòria.** En memòria, el clic d'un `<Link>` navega dins de l'App, però el seu `href` continua sent el camí de l'App (`/mur`, `/pobles/…`, amb la base davant si n'hi ha; `hrefDe()` a `src/app/contexts/RouterContext.jsx`), i en la pàgina de l'amfitrió eixe camí és una ruta de l'amfitrió. Obrir-lo en una pestanya nova, clicar-lo amb el botó del mig o copiar-ne l'enllaç porta a eixa ruta, que no és l'App. Quina és l'URL canònica d'una pantalla incrustada ho decidix el Mestre. Verificat per lectura del codi.
* Les rutes relatives es resolen sobre la ruta de l'App, no sobre la de l'amfitrió.

### Capçalera i telemetria

Pedra Seca només escriu al `<head>` del document (`<title>`, descripció, canònica, `og:image`, JSON-LD) i només registra visites de ruta quan la configuració diu `manageDocumentHead: true`. No s'inferix mai del DOM: penjar de `#root` no és cap declaració. Dins d'un iframe o fora de la base tampoc no s'hi toca. socdepoble.org ho declara a `src/main.jsx`; un amfitrió només ho declara si cedix la seua capçalera a l'App.

### Sessió (opcional, fora del marcatge)

Un amfitrió amb comptes propis fixa la política d'autenticació i entrega la sessió amb l'API global, abans que l'arrencada automàtica segelle el contracte (el tick següent a la càrrega del bundle):

```html
<script>
  if (window.SocDePoble) {
    // Opcional: aturar l'arrencada automàtica mentre l'amfitrió prepara la sessió
    // window.SocDePoble.deferArrenca();

    window.SocDePoble.configura({
      auth: {
        issuer: 'https://emissor.exemple', // emissor exacte dels JWT de l'amfitrió
        audiences: ['socdepoble']
      }
    });

    // Opcional: entregar la sessió de la persona usuària ja autenticada
    // window.SocDePoble.injectaSessio(sessio);

    // Si s'havia aturat amb deferArrenca(), cal arrencar manualment:
    // window.SocDePoble.arrenca();
  }
</script>
```

* `configura()` es crida una sola vegada i abans de l'arrencada; després llança. Admet `auth`, `config` i els àlies `backend_url` i `tenant_id`.
* **Fet verificat (260929) · decisió de govern pendent (`requires_human_decision: true`).** `configura()` de `src/host.js` accepta hui `backend`: un adaptador complet que valida `validaBackendImplementation` (`src/data/backendPort.js`: tot el nucli del contracte, cap capacitat a mitges) i que substituïx Supabase abans del segellat; amb un adaptador extern, `injectaSessio()` delega en el seu `adoptaSessioExterna`. El Model B diu que el backend el tria SdP i que `backendPort.js` no s'obri a implementacions de l'amfitrió. La doctrina no canvia: cap amfitrió passa `backend`. Tancar la porta al codi o reconéixer-la en una ADR ho decidix el Mestre.
* Per a entregar la sessió, l'amfitrió no declara cap endpoint: el backend ja viatja dins del paquet (vegeu «Backend segellat al paquet»), i amb només les tres peces l'element arrenca amb ell.

## LLEI 2: La Frontera del Mas (`.sdp-root`)

Per evitar que els estils antics de Sollutia o llibreries externes xoquen amb la puresa de la "Pedra Seca", tota la UI del mòdul renderitza dins d'un Shadow DOM tancat, penjada d'un contenidor amb la classe `.sdp-root`.

* **Encapsulament CSS:** El full d'estils s'adopta dins del Shadow DOM i els tokens es declaren per a `:host` i `.sdp-root`. No es toquen els estils globals de `html` ni de `body`; l'única excepció és opt-in: l'atribut `pinta-amfitrio` publica el fons del tema actiu a `--sdp-bg` del document.
* **Zero Interferències:** Sollutia té la garantia que carregar el CSS de Pedra Seca no trencarà la resta de la seua aplicació.
* **Prohibició de Mutació:** Sollutia no pot sobreescriure les classes internes (com `.sdp-card`) amb Tailwind o CSS extern. Qualsevol adaptació s'ha de fer passant paràmetres a la `config` o respectant les variables `--sdp-*`.

## LLEI 3: Dependències i Autonomia

* **Zero Dependències (Standalone):** El mòdul Pedra Seca porta el seu propi React i el seu Enrutador Natiu encapsulats dins del Shadow DOM. Sollutia **NO necessita** instal·lar React ni React Router. Això prevé completament qualsevol conflicte de versions (Dependency Hell).
* **Sense Service Worker:** Pedra Seca no registra cap Service Worker ni manifest PWA: l'arquitectura és online-first ([[ADR-2026-08-ONLINE-FIRST]]). Els workers i el manifest de la pàgina, si n'hi ha, són responsabilitat de l'amfitrió.

## LLEI 4: Accessibilitat Innegociable (WCAG AA)

Els tokens de Pedra Seca garantixen un contrast mínim de 4.5:1 (WCAG AA) tant en mode clar com en mode fosc.
* **Canvi de Tema:** Pedra Seca aplica el mode fosc assignant `data-theme="dark"` a l'element amfitrió `soc-de-poble` (els tokens el lligen amb `:host([data-theme="dark"])`), mai al `body` de la pàgina. Açò vol dir que Sollutia pot tindre un tema diferent a la resta de la pàgina, i Pedra Seca mantindrà l'aïllament del seu tema.

## LLEI 5: Aïllament Estricte de Rutes Absolutes

Dins del mòdul Pedra Seca no existixen referències forçades a l'arrel del domini de l'amfitrió. Els recursos que importa el codi (per exemple, `import logo from './assets/img/logo.svg'`) els resol Vite dins del paquet. Els de `public/` (`/assets/…`) es resolen contra la **base de recursos** (`src/config/assetResolver.js`):

* La base és `plugin-url` quan es declara i no és `/`; si no, el directori de l'script del bundle (`document.currentScript`: per això el bundle va en un script clàssic amb `src`).
* Sense base, tot resol com sempre: socdepoble.org no canvia ni un píxel.
* Els `src="/assets/…"` de l'HTML de contingut es resolen en pintar-lo, abans de `sanitizeHtml()`. El fons d'imatge del xat arriba per `--sdp-xat-fons-imatge`, que l'element fixa sobre ell mateix quan hi ha base.
* Si la base és d'un altre origen, el nucli l'afig als orígens d'imatge que admet el sanejador.
* La base és presentació: no és cap origen de dades ni cap permís.

**Què viatja.** L'artefacte incrustable porta tot `public/` excepte el que és propi del servidor de socdepoble.org (`PROPIS_DEL_LLOC` a `vite.standalone.config.js`): qualsevol fitxer o carpeta que comence per `.` (`.htaccess`, `.DS_Store`) i, a l'arrel, `robots.txt`, `sitemap.xml` i `auth/` (el relé OAuth només es servix des d'`auth.socdepoble.org`). Per decisió del Mestre (transparència radical), la Wiki de Poble (el manifest compilat dins del bundle), l'índex del RAG (`rag-index.json`, `slugIndex.json`) i la Consola viatgen amb l'App i s'obrin des del menú lateral, com a socdepoble.org.

***Aquesta normativa invalida protocols antics on es requeria que Sollutia convertira HTML a JSX. Avui, la integració és Plug & Play.***

## Vincles

- [[00_index]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[soci_sollutia]]
- [[estandard_ui_universal]]
