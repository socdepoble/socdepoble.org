=== Sóc de Poble. Portal de Pobles Connectats ===
Contributors: socdepoble
Tags: community, village, social network, embed, municipal
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.1.11
License: AGPL-3.0-or-later
License URI: https://www.gnu.org/licenses/agpl-3.0.html

Portal comunitari rural 100% en Valencià/Català + 5 idiomes (CA, ES, EN, EU, GL) i Traductor Apertium integrat: Xat, Mur, Mercat i Agenda en 3 passos.

== Description ==

= 🌍 100% en Valencià / Català Natiu + 5 Idiomes + Traductor Automàtic Integrat =

* **Nota sobre l'avís de WordPress.org:** L'aplicació és nativa en valencià/català i porta 5 idiomes. L'avís del directori parla dels textos d'administració del connector (ajustos, Salut del lloc i nom de la plantilla): en la còpia de WordPress.org ixen en anglés fins que translate.wordpress.org n'aprove la traducció al català i, per als llocs en valencià, la valenciana (ca-val). Per a eixa part, l'avís és correcte.
* **5 idiomes d'interfície inclosos de sèrie:** **Valencià / Català (`ca`)**, **Castellà (`es`)**, **Anglés (`en`)**, **Basc (`eu`)** i **Gallec (`gl`)**, seleccionables en qualsevol moment pel visitant dins de l'aplicació.
* **Traductor Sobirà de Pàgines integrat (Apertium, sense Google):** Inclou a la barra superior un botó **«Traduir»** que traduïx al vol el contingut de les pàgines a altres idiomes (**Castellà, Anglés, Francés i Gallec**) utilitzant programari lliure (Apertium, nascut a la Universitat d'Alacant), sense enviar dades a Google Translate ni necessitar claus de pagament.

**Sóc de Poble (Enxufe Universal)** convertix qualsevol instal·lació de WordPress —d'un ajuntament, associació cultural, cooperativa agrícola, escola rural, grup d'acció local o col·lectiu veïnal— en una **plaça pública digital viva i sobirana**, connectada als pobles de Sóc de Poble. Dissenyat des de **La Torre de les Maçanes (l'Alacantí, País Valencià)** sota la filosofia del **Trellat** i l'arquitectura de **Pedra Seca Digital**, porta la tecnologia més avançada al món rural sense perdre l'ànima de poble ni l'humor gràfic de la nostra terra.

= Per què Sóc de Poble? (Filosofia de Pedra Seca i Trellat) =

Els nostres pobles patixen una doble despoblació: la física i la digital. Quan la vida d'un municipi es dispersa en desenes de grups tancats de multinacionals, la memòria oral es perd, el comerç local s'ofega i la gent gran queda exclosa darrere d'interfícies confuses i algoritmes publicitaris.

**Sóc de Poble** naix per revertir esta tendència amb quatre pilars fonamentals:

* **Valencià / Català com a llengua base i matriu cultural:** Tota la interfície, la documentació, les guies d'accessibilitat cognitiva i la memòria de la comunitat estan construïdes en la nostra llengua pròpia com a tronc principal, amb suport multillengua integrat (Valencià/Català, Castellà, Anglés, Basc, Gallec i traducció automàtica lliure de pàgines amb Apertium).
* **Arquitectura de Pedra Seca (Zero Fricció):** Com els marges de pedra seca de les nostres muntanyes, cada bloc encaixa pel seu propi pes sense necessitar ciment innecessari. El connector incrusta l'aplicació modular completa (`<soc-de-poble>`) en una pàgina del teu WordPress mitjançant un sol codi (`[socdepoble_app]`) o el bloc visual **Sóc de Poble**, sense alterar la resta del teu tema ni la base de dades d'usuaris del teu lloc web.
* **Accessibilitat Sènior Extrema (Regla dels 3 Segons):** Tipografia clara (`Noto Sans` local, zero connexions a Google Fonts), contrast d'alta visibilitat pensat per llegir-se a ple sol a la plaça del poble, botons tàctils generosos (`48x48 px`) i navegació intuïtiva tant per a una iaia de 85 anys com per a un tècnic municipal.
* **Sobirania de Dades, Portabilitat i Fedivers Rural (Fediversity):** Dades estructurades obertes (`Schema.org` / `JSON-LD`) i un paquet de dades obertes per municipi (Frictionless Data Package v2 i BagIt) que hui porta les notícies i l'agenda que el servidor de dades publica per a tothom i signa una entitat, i el directori públic d'entitats; la memòria cultural i la memòria oral encara no. A socdepoble.org, una primera fase de federació de només lectura: actors d'`ActivityPub`, `NodeInfo 2.1` i WebFinger per la ruta `/.well-known/webfinger/acct:…`, la que anuncia `/.well-known/host-meta` (la consulta estàndard `?resource=` encara no respon).

= Els 6 Mòduls del Poble Connectat =

1. **Xat Veïnal i Comunitats (Entrada Principal):** El punt de trobada viu del poble, amb canals per a l'Ajuntament, Gent del Poble, associacions, la IAIA MarIA i converses privades.
2. **El Mur del Poble (Bàndols i Vida Veïnal):** El taulell d'anuncis viu del municipi. Comunicats oficials, avisos d'aigua o camins, cròniques de festes, fotografies històriques i debats veïnals ordenats cronològicament, sense algoritmes opacs.
3. **El Mercat Rural de Km 0:** Aparador directe per als productors, forns, almàsseres, apicultors, artesans i comerços del poble per difondre la collita del dia i els productes de proximitat sense comissions ni intermediaris.
4. **L'Agenda i Calendari Comunal:** Festes patronals, aplecs, mercats setmanals, plens municipals, tallers i calendari agrícola compartit.
5. **La Wiki de Poble (Arxiu i Memòria Viva):** L'enciclopèdia col·laborativa del terme municipal: toponímia, fonts, masos, receptes tradicionals, oficis i història oral custodiada pel mateix poble.
6. **Directori de Pobles, Comerços i Associacions:** Fitxes verificades de totes les entitats, col·lectius, serveis públics i negocis locals.

= Com funciona a WordPress? (Exemple real: Gent de la Torre) =

* **Un sol codi de substitució (`[socdepoble_app]`):** Només cal crear una pàgina a WordPress i posar el codi `[socdepoble_app]` (o `[socdepoble_app poble="la-torre-de-les-macanes"]`).
* **Plantilla de pantalla completa (`Sóc de Poble · full screen`):** En seleccionar la plantilla inclosa **Sóc de Poble · full screen** al panell dret de la pàgina, el portal ocupa tota la finestra com una aplicació web progressiva (PWA) neta, sense que la capçalera ni el peu del tema de WordPress destorben.
* **Adreces compartibles:** Quan un veí navega pel Xat, el Mur o el Mercat, l'adreça s'actualitza i es pot compartir per WhatsApp, Telegram o Mastodon.
* **Diagnòstic a Salut del Lloc (*Site Health*):** Incorpora comprovacions automàtiques a *Ferramentes ➔ Salut del lloc* per verificar que el paquet d'actius locals (`dist/`) està íntegre i operatiu.

= English Summary (For International Reviewers & Fediverse Auditing) =

**Sóc de Poble** embeds the **Sóc de Poble** rural community web application (`https://socdepoble.org`) inside a WordPress site using the `[socdepoble_app]` shortcode or the **Sóc de Poble** block (`<soc-de-poble>`). Built in Valencian/Catalan as its cultural and linguistic foundation, it provides municipalities, rural cooperatives, and local associations with a Community Chat (`xat`), Village Wall (`mur`), Local Marketplace (`mercat`), Community Calendar (`calendari`), Local Directory (`pobles`), and Wiki (`wikidepoble`), while keeping all JavaScript, CSS, icons, and fonts (`Noto Sans` under SIL Open Font License 1.1 in `dist/fonts/OFL.txt`) bundled locally inside `dist/`. Federation endpoints are served by socdepoble.org; installing this plugin does not make the WordPress site a Fediverse node.

* Valencian (Catalan) translations are included for the plugin and block editor.

== External services ==

**Valencià / Català:**
Tots els fitxers d'execució del visor (JavaScript, fulls d'estil CSS, icones i tipografia `Noto Sans`) s'entreguen localment des de la carpeta `dist/` d'este connector. No es carrega cap script ni tipografia des de xarxes CDN de tercers ni des de Google Fonts. Quan un visitant obri una pàgina que conté el portal **Sóc de Poble**, el navegador es connecta als serveis del projecte **Sóc de Poble** per carregar el contingut comunitari en viu.

**English (WordPress.org Compliance Disclosure):**
This plugin connects to the Sóc de Poble service. Accounts, messages and posts are stored in its backend, not in the WordPress database. The application uses the following services when a visitor opens an embedded application and uses the relevant features:

1. Sóc de Poble backend, currently hosted on Supabase: required for the connected service. It handles sign-in, profiles, messages, posts, marketplace listings, events and real-time updates. Google sign-in returns directly to the page that hosts the application. Terms and privacy information: https://socdepoble.org. Supabase terms: https://supabase.com/terms ; privacy: https://supabase.com/privacy
2. Google Sign-In: used only when chosen by the visitor. Terms: https://policies.google.com/terms ; privacy: https://policies.google.com/privacy
3. OpenStreetMap: used for the map view. Terms: https://wiki.osmfoundation.org/wiki/Terms_of_Use ; privacy: https://osmfoundation.org/wiki/Privacy_Policy
4. Profile images from sign-in providers may load from lh3.googleusercontent.com, platform-lookaside.fbsbx.com, graph.facebook.com or avatars.githubusercontent.com. One design catalogue page embeds a YouTube video (youtube-nocookie.com). Terms: https://www.youtube.com/t/terms
5. Translation, only when a visitor presses Translate: the page's text or HTML is sent from WordPress to Apertium (beta.apertium.org, or apertium.org when it fails; Galician only beta.apertium.org) for Spanish, English, French and Galician, and for German and Basque to the LibreTranslate-compatible service set in SDP_TRADUCCIO_URL, if any. With a DeepL key, every language goes to api-free.deepl.com or api.deepl.com instead. Configuration, retention, terms and privacy are described below.
6. Wikimedia (Wikipedia, Wikidata and Wikimedia Commons): only on a village page with missing details, when the visitor presses the button to bring them from Wikipedia. The visitor's browser then sends the village name, IP address, browser user agent and language to ca.wikipedia.org, www.wikidata.org and commons.wikimedia.org, without cookies or the page address, and loads photos from upload.wikimedia.org or thumb.wikimedia.org. Terms: https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use ; privacy: https://foundation.wikimedia.org/wiki/Policy:Privacy_policy

Update channel (only in the package distributed by Sóc de Poble, not in the WordPress.org directory): the plugin reads https://socdepoble.org/enxufe/stable.json and its signature to offer updates, then downloads the listed package. It queries this channel after api.wordpress.org answers WordPress's own update check. Requests identify the plugin, not the site. Automatic updates remain disabled until enabled in Plugins. The switch appears after an update check with the plugin active; activation clears the update cache so the next Plugins visit triggers a check. Updates are installed only while the plugin is active, in the socdepoble directory, with the release channel key, and outside symlinks or Git checkouts. Automatic updates also require WP-Cron and connectivity to WordPress.org. Settings → Sóc de Poble and Site Health explain unmet conditions.

== Link previews per route ==

Off by default, and not available yet: current packages do not include the route table `dist/seo-routes.json`, so the filters described here have no effect. Once a package includes that table, when the `socdepoble_enxufe_seo` filter returns `true` and `socdepoble_enxufe_ruta_a_url` returns `parametre`, a request with `?sdp=/route` gets that route's Open Graph tags from the table only; nothing from the request is printed. The page cache must not ignore or strip the `sdp` query parameter.

== Translation service ==

Without configuration, Spanish (ES), English (EN-GB), French (FR) and Galician (GL) use the public Apertium service, free software from the Apertium project, with no key: one request per uncached text, with an explicit format (txt or html), to https://beta.apertium.org/apy/translate and, after a transport error or a 5xx response, to https://apertium.org/apy/translate (same project). Galician uses only the beta endpoint: the main one has no Catalan to Galician pair. The constant SDP_TRADUCCIO_APERTIUM_URL replaces these endpoints. Apertium has no Catalan to German or Basque pair: German (DE) and Basque (EU) use the LibreTranslate-compatible endpoint in the constant SDP_TRADUCCIO_URL, with the destination's language code and an optional key in SDP_TRADUCCIO_URL_CLAU; without it, these requests return 503 and the application says that translation is not available. Endpoint constants must be https URLs without credentials; other values are ignored. Each call to these services times out after 12 seconds, and a request stops calling them after 30 seconds; translations already received stay cached.

Optional DeepL: set DEEPL_API_KEY in the PHP process environment or as a constant in wp-config.php, and DeepL translates every language, Galician and Basque included. The plugin does not load the source repository's .env file or expose keys in JavaScript. Free API keys ending in :fx use api-free.deepl.com; other keys use api.deepl.com. No SDK is required.

POST /wp-json/socdepoble/v1/traduir accepts JSON such as {"textos":["Bon dia"],"desti":"ES","origen":"CA","format":"text"}. Supported destinations are ES, EN-GB, FR, DE, GL and EU. The format may be text or html; renderers must sanitize translated HTML. Each batch accepts up to 50 strings, 5000 Unicode characters and 20000 text bytes; the whole JSON request body is limited to 32768 bytes. The response is {"traduccions":["..."],"origen":"CA","desti":"ES","cache":false}. The plugin's own instances receive this same-origin service in the traductor-url attribute. Cookies and a WordPress login are not required. Portable embedding code omits this local service URL.

Public usage is limited to 30 uncached requests per 10 minutes per REMOTE_ADDR, 10000 characters per UTC day and 100000 per UTC month per WordPress site. Forwarded address headers are not trusted. Integer constants SDP_TRADUCCIO_LIMIT_DIARI and SDP_TRADUCCIO_LIMIT_MENSUAL override the character budgets; zero disables new upstream requests. Budgets are reserved atomically before sending and survive transient eviction. Failed requests still consume the local reservation because a timed-out request may have been billed. These local limits apply to every provider and also protect the public Apertium service; they are not a reading of a DeepL account balance. Each multisite site has its own limit, so configure account limits at DeepL as well.

Overlapping cache misses return 503 (busy); independent texts may proceed concurrently. A short global lock protects only budget reservation. Provider errors 403/429/456 trigger a 60-second pause, with no automatic retries; a timeout or transport failure does not, so the next request tries again. Repeated or overlapping batches reuse individual translations for seven days, separated by provider, language, format and DeepL key. WordPress may evict transients earlier.

An explicit translation request sends the selected text from WordPress to the provider over HTTPS, identified as SocDePoble-Translation. The plugin does not log original text, keys or service URLs, or place them in cache keys. Transients contain translated text for seven days and hashed client counters for ten minutes. Translations can contain the same personal data as the original text. Expired transients may remain in the database until WordPress cleans them up. Uninstallation removes database budgets, locks and transients; external object-cache entries normally expire within seven days. Apertium project and service information: https://www.apertium.org/ . For the service in SDP_TRADUCCIO_URL, its operator's terms apply. DeepL terms: https://www.deepl.com/pro-license ; privacy: https://www.deepl.com/privacy

The service uses REMOTE_ADDR. Behind a reverse proxy, visitors may share a rate limit; configure trusted proxy address handling at the web server rather than trusting arbitrary forwarded headers. Keep the WordPress home and site URLs aligned with the public origin.

Translation limits must be integer constants, without quotes. Requests without an Origin header are permitted for non-browser clients; JSON and budget checks still apply. Visitors can exhaust the public daily budget: Origin is not authentication. WordPress HTTP hooks and other installed plugins are trusted server code and can observe outgoing requests.

== Privacy ==

The plugin adds no analytics of its own. When embedded, the application does not send visit statistics to Sóc de Poble. If the host already loads Umami as window.umami, the application forwards its events to that host's Umami instance.

Shareable addresses place the application route, including any search text or item identifier, in the page address, the browser history and copied links. In the default `fragment` mode the route stays in the browser and is not sent to the web server. The `parametre` mode sends it to the server as a query parameter, where it can appear in server logs and caches.

== Source code and build ==

The file dist/soc-de-poble.standalone.js is compiled and minified; in the standalone package it is a small loader for the compiled and minified JavaScript modules in dist/trossos/. Human-readable source and build tools are public in the backup-notes-publish branch, https://github.com/socdepoble/socdepoble.org/tree/backup-notes-publish: the application is in src/, the build configuration in vite.standalone.config.js and this adapter in wordpress-plugin/. Each build writes dist/sdp-release.json with the version, bundle SHA-256 and integrity, and its pinned data node, and dist/sdp-inventari.json with the SHA-256 of every file, so a host can verify what it serves.

To build locally, run `npm ci`, `npm run build:wp` (standalone, dist/) and `npm run build:wp:directori` (WordPress, builds/directori/dist/). For a release, set SDP_RELEASE=1 and use the same SDP_VERSIO and public configuration for both commands. The packager verifies both inventories and their dependencies before creating packages.

The directory variant requires WordPress 6.6 or later and loads core React, ReactDOM and the JSX runtime through the react, react-dom and react-jsx-runtime handles. The standalone package includes its own React for Sollutia, other hosts and the project's distribution channel. Both use the same embedding contract, with different bundle hashes.

Typography: the Noto Sans font files in dist/fonts/ are used under the SIL Open Font License 1.1 (dist/fonts/OFL.txt).

== Installation ==

= Com posar Sóc de Poble a la teua web en 3 passos molt fàcils =

1. **Pas 1 · Instal·la el connector i configura el teu poble:**
   * Instal·la i activa **Sóc de Poble. Portal de Pobles Connectats** des de **Complements ➔ Afegir complement**.
   * Al menú esquerre de WordPress, ves a **Ajustos ➔ Sóc de Poble**.
   * Escriu el nom públic del teu portal (per exemple, `Gent de la Torre`) i l'identificador del teu poble (per exemple, `la-torre-de-les-macanes`), i prem el botó blau **«Guardar els canvis»**.

2. **Pas 2 · Posa Sóc de Poble en una pàgina (tria UNA de les dos maneres):**
   * **Manera A (amb el bloc Codi de substitució / Shortcode — la més ràpida):**
     Ves a **Pàgines ➔ Afegir una pàgina**, posa-li títol (per exemple, *Sóc de Poble*), afig un bloc de **Codi de substitució** (*Shortcode*) i pega **un sol** codi com este: `[socdepoble_app poble="la-torre-de-les-macanes"]`
     *(Nota: si ja has guardat el teu poble al Pas 1, també pots escriure simplement `[socdepoble_app]` sense res més).*
   * **Manera B (amb el bloc visual de l'editor):**
     Dins de l'editor de la pàgina, prem el botó `+` (*Afegir un bloc*), busca **«Sóc de Poble»**, fes-hi clic i publica la pàgina.

3. **Pas 3 · Fes que ocupe tota la pantalla i siga la pàgina d'inici:**
   * A la columna dreta de l'editor de la pàgina (pestanya **Pàgina**), busca l'apartat **«Plantilla»** (*Template*) i selecciona **«Sóc de Poble · full screen»** (*Sóc de Poble · pantalla completa*). Així el portal es veurà net a pantalla completa, sense les barres del tema antic (mira la captura de pantalla #10). Amb un tema de blocs, la plantilla apareix en eixe apartat a WordPress 6.7 o posterior; en versions anteriors, tria-la amb l'**Edició ràpida** de la llista de **Pàgines**.
   * Si vols que esta pàgina siga la portada principal de la teua web (com en `https://gentdelatorre.net/`), ves a **Ajustos ➔ Lectura**, marca *«Una pàgina estàtica»*, tria la pàgina *Sóc de Poble* com a **Pàgina d'inici** i prem **«Guardar els canvis»**.

= Opcions avançades del Codi de substitució (només si tens diverses pàgines) =

En el 99% dels casos només necessites posar **un sol** shortcode a la teua pàgina principal (`[socdepoble_app poble="la-torre-de-les-macanes"]`), que obri el portal complet a la seua entrada principal (**el Xat i les Comunitats del poble**, des d'on el veí ja es mou pel Mur, el Mercat, el Calendari o els Pobles).

Només si algun dia vols crear una altra pàgina secundària dins del teu WordPress que s'òbriga directament en un apartat concret, pots afegir l'atribut opcional `ruta_inicial`:

* Per obrir directament al **Xat del poble** (entrada per defecte): `[socdepoble_app poble="la-torre-de-les-macanes" ruta_inicial="/xat"]`
* Per obrir directament al **Mur de bàndols i notícies**: `[socdepoble_app poble="la-torre-de-les-macanes" ruta_inicial="/mur"]`
* Per obrir directament al **Mercat rural de Km 0**: `[socdepoble_app poble="la-torre-de-les-macanes" ruta_inicial="/mercat"]`

== Frequently Asked Questions ==

= Quin codi he de posar exactament a la meua pàgina: un o dos? =

**Només UN.** En la pàgina de WordPress on vulgues mostrar el portal (com la pàgina d'inici de `gentdelatorre.net`), només has de posar **un sol** bloc de *Codi de substitució* amb `[socdepoble_app poble="la-torre-de-les-macanes"]`
(canviant `la-torre-de-les-macanes` per l'identificador del teu poble, o posant simplement `[socdepoble_app]` si ja l'has configurat en **Ajustos ➔ Sóc de Poble**).

= Com faig perquè la pàgina es veja a pantalla completa sense les capçaleres del meu tema? =

Quan estigues editant la pàgina a WordPress, mira la columna de la dreta (pestanya **Pàgina**): on posa **Plantilla** (*Template*), canvia la plantilla per defecte i tria **«Sóc de Poble · full screen»** (*Sóc de Poble · pantalla completa*). Després prem **Guardar** (mira la captura #10). Amb un tema de blocs, la plantilla apareix en eixe apartat a WordPress 6.7 o posterior; en versions anteriors, tria-la amb l'**Edició ràpida** de la llista de **Pàgines**.

= Per què el connector té el Valencià / Català com a idioma principal? =

Perquè **Sóc de Poble** naix a les muntanyes alacantines (La Torre de les Maçanes) amb la vocació de preservar i dignificar la nostra llengua i cultura popular en l'entorn digital. Valencià i Català són la mateixa llengua que compartim milions de parlants, i en **Sóc de Poble** ocupa el primer lloc per dret propi, alhora que oferim suport multillengua complet (`ca`, `es`, `en`, `eu`, `gl`) i traductor lliure Apertium perquè cap veí ni visitant quede fora.

= Carrega tipografies o scripts de Google o d'altres multinacionals? =

Tipografies i scripts de la interfície, no: la tipografia (`Noto Sans`), les icones i el codi de la interfície viuen dins de la carpeta `dist/` del connector, sense Google Fonts ni cap CDN. Però el portal sí que es connecta a serveis de fora, i alguns són de multinacionals. Les dades viuen al servidor de Sóc de Poble, allotjat hui a Supabase. L'inici de sessió amb Google només s'usa si el visitant el tria, i les fotos de perfil dels comptes de Google, Facebook o GitHub es carreguen des dels servidors d'eixos proveïdors quan una pàgina les mostra. Una pàgina del catàleg de disseny incrusta un vídeo de YouTube (youtube-nocookie.com, de Google), que es carrega amb el reproductor de YouTube quan el visitant hi arriba. La traducció només s'envia quan el visitant prem «Traduir». La secció «External services» els detalla tots, amb les condicions de cada servei.

= Quins atributs i filtres té per a desenvolupadors? =

* El codi `[socdepoble_app]` admet tres atributs opcionals, que en eixa pàgina passen per damunt dels ajustos: `nom_poble` (nom públic del portal), `poble` (identificador del poble) i `ruta_inicial` (apartat on s'obri, sempre començant per `/`). El bloc **Sóc de Poble** té les mateixes tres opcions.
* El filtre `socdepoble_enxufe_config` rep el nom públic i l'identificador del poble dels ajustos i els pot canviar per a tot el lloc; els atributs d'una pàgina continuen passant-hi per damunt.
* El filtre `socdepoble_enxufe_idioma` fixa la llengua inicial de l'aplicació en este lloc amb un dels codis exactes `ca`, `es`, `en`, `eu` o `gl`; qualsevol altre valor s'ignora, i la tria del visitant sempre guanya. Sense el filtre, l'aplicació s'obri en valencià i la llengua de WordPress no la canvia.
* El filtre `socdepoble_enxufe_integritat` afig la Subresource Integrity a l'script de l'aplicació. Va apagat per defecte perquè un connector de memòria cau o de CDN que reescriu l'eixida faria que el navegador no carregara l'script.
* El filtre `socdepoble_enxufe_ruta_a_url` tria on es guarda la ruta de les adreces compartibles: `fragment` (per defecte, `#sdp=/xat`) o `parametre` (`?sdp=/xat`); qualsevol altre valor les apaga.

= Tinc el connector instal·lat dos voltes. Què faig? =

Un zip que no porta la carpeta `socdepoble` a l'arrel s'instal·la al costat de la còpia que ja tens, amb el nom del zip. El connector refusa activar una segona còpia mentre l'altra està activa. Conserva'n només una: desactiva l'altra, activa la que vols i esborra la carpeta que sobra. Les dos còpies compartixen els ajustos: esborrar-ne una des de **Complements** executa el seu desinstal·lador, que no esborra res mentre l'altra continue activa; les versions antigues sí que esborren el nom públic i l'identificador del poble, així que apunta'ls abans.

= Què passa si desinstal·le el connector? =

Si no queda cap altra còpia activa del connector, `uninstall.php` esborra els ajustos (`socdepoble_enxufe`), l'estat del canal d'actualitzacions i les dades temporals del traductor (pressupost, panys i traduccions en memòria cau). El connector no crea cap taula pròpia a la base de dades. Si una altra còpia del connector continua activa, la desinstal·lació no esborra res: els ajustos són de la còpia que queda. Les entrades d'una memòria cau d'objectes externa normalment caduquen en set dies.

== Screenshots ==

1. **Vista real del sistema · El Xat i les Comunitats del Poble (`/xat`):** Interfície principal amb el menú lateral a l'esquerra, la columna de converses i canals comunitaris al centre (*Sóc de Poble*, *Javi Llinares*, *Gent de La Torre*, *IAIA MarIA*) i la pàgina de benvinguda a la dreta.
2. **Vista real del sistema · El Mur del Poble (`/mur`):** Graella de publicacions recents amb les targetes quadrades de *Pedra Seca*, cercador i filtres per explorar el mur, el mercat, el calendari i el mapa.
3. **Vista real del sistema · Pobles i Territori (`/pobles`):** Directori de municipis i nodes rurals connectats (*La Torre de les Maçanes*, *Xixona* i la resta de pobles de la comarca).
4. **Vista real del sistema · La Wiki de Poble (`/wikidepoble`):** Espai de treball de tres columnes amb l'arbre del coneixement col·lectiu, llista de documents i lectura editorial.
5. **Vista real del sistema · El Bloc de Notes (`/notes`):** Estudi d'escriptura i publicació amb carpetes, previsualització en viu de la targeta (*Card*) i editor de continguts.
6. **Un Poble Imaginari de la Nostra Zona (`/projecte`):** Recreació fotogràfica d'un poble imaginari de les nostres muntanyes (no correspon a cap municipi concret, sinó que representa el paisatge de bancals i serres de la nostra terra) com a símbol dels pobles connectats.
7. **Disseny en Pedra Seca Digital (`/disseny`):** Il·lustració d'estil còmic del nostre sistema de disseny *Pedra Seca*: els mestres d'obra i les iaies del poble aixecant la interfície web carreu a carreu, amb humor i ofici.
8. **El Mercat de Poble i Productes Locals (`/mercat`):** Il·lustració d'estil còmic del mercat de proximitat i d'economia de Km 0 a la plaça del poble.
9. **Candidatura Europea NLnet · NGI Fediversity (`/page/fediversity`):** Il·lustració d'estil còmic on l'enginyeria popular del poble presenta el seu projecte de Fedivers rural davant dels avaluadors científics europeus. La candidatura està en avaluació: Sóc de Poble no rep cap finançament d'NGI Fediversity.
10. **Exemple real de configuració en 1 minut a WordPress (`gentdelatorre.net`):** Un sol bloc de *Codi de substitució* amb `[socdepoble_app poble="la-torre-de-les-macanes"]` al centre i la plantilla **«Sóc de Poble · full screen»** triada a la columna dreta.

== Changelog ==

= 1.1.11 =
* **«Mostra els detalls» com a WordPress.org:** la finestra de detalls del connector mostra la negreta i la cursiva del readme en lloc dels asteriscos, el codi literal, sense cursives ni enllaços a dins, i els tres passos de la instal·lació com una sola llista numerada, amb les seues subllistes.
* **Textos al dia:** el visor diu que el connector oficial és públic al directori de WordPress.org, i el readme descriu els serveis de fora, les traduccions, les dades obertes i la federació tal com funcionen hui.
* **Visor:** les condicions d'ús de la pàgina legal passen a la versió 2.3, amb una edat mínima de 16 anys sense cap excepció; cada alerta municipal del Mur diu fins quan és vigent i, quan caduca, ix de l'avís de dalt i deixa de pujar al capdamunt del Mur, sense recarregar la pàgina, però la targeta conserva el distintiu; la fitxa de memòria oral del Bloc de Notes permet triar el poble, també pel seu nom popular, i afegir etiquetes lliures; el paquet de dades obertes de cada poble (format 1.2.0) porta les notícies i l'agenda públiques; i Connectar, la gestió de membres i l'enquadrament de les imatges ja es mostren en les cinc llengües.

= 1.1.10 =
* **Guia d'instal·lació pas a pas en Valencià / Català amb exemple real (`gentdelatorre.net`):** Explicació clara en 3 passos del codi únic `[socdepoble_app poble="la-torre-de-les-macanes"]` i de la plantilla **«Sóc de Poble · full screen»**, amb captura real de l'editor de WordPress (#10) i il·lustracions de còmic de l'univers *Sóc de Poble*.
* **Visor complet:** Empaquetat autònom (`dist/soc-de-poble.standalone.js`) amb navegació per teclat (`IDEA-58`), traductor lliure Apertium (`IDEA-31`) i exportació de dades obertes per municipi (`JSON-LD`).
* **Enllaços de la llista de connectors:** *Mostra els detalls* obri la fitxa completa amb descripció, instal·lació, PMF i registre de canvis; `Plugin URI` apunta a `https://socdepoble.org`.

= 1.1.9 =
* **Actualització de seguretat i estandardització:** El visor incrustat incorpora les últimes millores del portal, amb pàgines públiques d'arquitectura oberta, privacitat i governança del projecte.
* **Desinstal·lació neta:** S'eliminen totes les opcions, avisos i memòria cau temporal en desinstal·lar el connector.

= 1.1.8 =
* **Codi font i construcció documentats:** Instruccions reproduïbles pas a pas per generar el paquet `dist/` des del repositori públic.

== Upgrade Notice ==

= 1.1.11 =
«Mostra els detalls» com a WordPress.org, i el visor al dia: condicions 2.3 amb 16 anys, alertes municipals que caduquen, memòria oral amb poble i etiquetes, dades obertes 1.2.0 amb notícies i agenda, i Connectar, membres i enquadrament en cinc llengües.

= 1.1.10 =
Guia d'instal·lació didàctica en 3 passos amb l'exemple real de Gent de la Torre ([socdepoble_app poble="la-torre-de-les-macanes"] + plantilla Sóc de Poble · full screen) i galeria de 10 captures.
