=== Sóc de Poble — Enxufe ===
Contributors: socdepoble
Tags: community, rural, village, social network, embed
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0-dev
License: AGPL-3.0-or-later
License URI: https://www.gnu.org/licenses/agpl-3.0.html

Embeds the Sóc de Poble rural community app in any page with a shortcode or a block, using the same markup as every other host.

== Description ==

![Sóc de Poble - Connected Villages](https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png)

Sóc de Poble is an open source civic network for rural communities: chat, posts, a marketplace, events and a map. It continues decades of rural activism and connects neighbours, associations and local businesses, with community ownership and independence from advertising platforms as its guiding principles.

= The Enxufe architecture =

The application is a modular single-page client, separated from its data provider. This plugin places the `<soc-de-poble>` web component on pages containing the `[socdepoble_app]` shortcode or the Sóc de Poble block. The plugin provides the WordPress adapter; the application contains the community features.

The current service uses a Supabase backend. The provider interfaces are designed for interchangeable backends, including future WordPress, Joomla or other host adapters. This does not mean those alternative backends are already implemented.

= Independent communities and the Fediverse =

The project aims to let independent rural communities run their own systems and communicate through the Fediverse. Federation is a roadmap goal, not a feature enabled by installing this plugin.

= Documentation and resilience =

The project is developed with AI assistance and is designed to remain understandable and maintainable by people. The application includes the public part of the project Wiki and design documentation. Private working documents and personal data are excluded by the publication policy.

= Features =

* The `[socdepoble_app]` shortcode accepts `nom_poble` (display name), `poble` (village identifier) and `ruta_inicial` (initial application route).
* A dynamic Sóc de Poble block provides the same three options.
* Settings → Sóc de Poble provides the host identity, package diagnostics (version, integrity and pinned data node) and embedding instructions.
* Site Health checks report a missing application script or manifest, or a package targeting a development backend.
* The application script loads only on pages that use it. Subresource Integrity is optional through `socdepoble_enxufe_integritat`; CDN plugins that rewrite output can otherwise prevent the script from loading.
* An optional full-screen page template supports classic and block themes.
* The `socdepoble_enxufe_config` filter sets the default display name and village identifier.
* Optional DeepL translation sends selected text through the server, where the API key is configured.
* Valencian (Catalan) translations are included for the plugin and block editor.

== External services ==

This plugin connects to the Sóc de Poble service. Accounts, messages and posts are stored in its backend, not in the WordPress database. The application uses the following services when a visitor opens an embedded application and uses the relevant features:

1. Sóc de Poble backend, currently hosted on Supabase: required for the connected service. It handles sign-in, profiles, messages, posts, marketplace listings, events and real-time updates. Terms and privacy information: https://socdepoble.org. Supabase terms: https://supabase.com/terms ; privacy: https://supabase.com/privacy
2. Sóc de Poble sign-in relay at auth.socdepoble.org: used when a visitor chooses Google sign-in.
3. Google Sign-In: used only when chosen by the visitor. Terms: https://policies.google.com/terms ; privacy: https://policies.google.com/privacy
4. OpenStreetMap: used for the map view. Terms: https://wiki.osmfoundation.org/wiki/Terms_of_Use ; privacy: https://osmfoundation.org/wiki/Privacy_Policy
5. Profile images for accounts using external identity providers may load from lh3.googleusercontent.com, graph.facebook.com or avatars.githubusercontent.com.
6. Optional DeepL translation: selected text or HTML is sent to api-free.deepl.com or api.deepl.com when a visitor requests translation. Configuration, retention, terms and privacy are described below.

Update channel (only in the package distributed by Sóc de Poble, not in the WordPress.org directory): the plugin reads https://socdepoble.org/enxufe/stable.json and its signature to offer updates, then downloads the listed package. It queries this channel after api.wordpress.org answers WordPress's own update check. Requests identify the plugin, not the site. Automatic updates remain disabled until enabled in Plugins. The switch appears after an update check with the plugin active; activation clears the update cache so the next Plugins visit triggers a check. Updates are installed only while the plugin is active, in the socdepoble-enxufe directory, with the release channel key, and outside symlinks or Git checkouts. Automatic updates also require WP-Cron and connectivity to WordPress.org. Settings → Sóc de Poble and Site Health explain unmet conditions.

== Optional translation service (DeepL) ==

Set DEEPL_API_KEY in the PHP process environment or as a constant in wp-config.php. The plugin does not load the source repository's .env file or expose the key in JavaScript. Free API keys ending in :fx use api-free.deepl.com; other keys use api.deepl.com. The key authenticates server requests to DeepL. No SDK is required.

POST /wp-json/socdepoble/v1/traduir accepts JSON such as {"textos":["Bon dia"],"desti":"ES","origen":"CA","format":"text"}. Supported destinations are ES, EN-GB, FR and DE. The format may be text or html; renderers must sanitize translated HTML. Each batch accepts up to 50 strings, 5000 Unicode characters and 20000 text bytes; the whole JSON request body is limited to 32768 bytes. The response is {"traduccions":["..."],"origen":"CA","desti":"ES","cache":false}. The optional traductor-url attribute exposes the same-origin service to each instance. Cookies and a WordPress login are not required. Portable embedding code omits this local service URL.

Public usage is limited to 30 uncached requests per 10 minutes per REMOTE_ADDR, 10000 characters per UTC day and 100000 per UTC month per WordPress site. Forwarded address headers are not trusted. Integer constants SDP_TRADUCCIO_LIMIT_DIARI and SDP_TRADUCCIO_LIMIT_MENSUAL override the character budgets; zero disables new upstream requests. Budgets are reserved atomically before sending and survive transient eviction. Failed requests still consume the local reservation because a timed-out request may have been billed. These are local limits, not a reading of the DeepL account balance. Each multisite site has its own limit, so configure account limits at DeepL as well.

Overlapping cache misses return 503 (busy); independent texts may proceed concurrently. A short global lock protects only budget reservation. Provider errors 403/429/456 and transport failures trigger a 60-second pause, with no automatic paid retries. Repeated or overlapping batches reuse individual translations for seven days, separated by language, format and key. WordPress may evict transients earlier.

An explicit translation request sends the selected text from WordPress to DeepL over HTTPS. The plugin does not log original text or API keys, or place them in cache keys. Transients contain translated text for seven days and hashed client counters for ten minutes. Translations can contain the same personal data as the original text. Expired transients may remain in the database until WordPress cleans them up. Uninstallation removes database budgets, locks and transients; external object-cache entries normally expire within seven days. DeepL terms: https://www.deepl.com/pro-license ; privacy: https://www.deepl.com/privacy

The service uses REMOTE_ADDR. Behind a reverse proxy, visitors may share a rate limit; configure trusted proxy address handling at the web server rather than trusting arbitrary forwarded headers. Keep the WordPress home and site URLs aligned with the public origin.

Translation limits must be integer constants, without quotes. Requests without an Origin header are permitted for non-browser clients; JSON and budget checks still apply. Visitors can exhaust the public daily budget: Origin is not authentication. WordPress HTTP hooks and other installed plugins are trusted server code and can observe outgoing requests.

== Privacy ==

The plugin adds no analytics of its own. When embedded, the application does not send visit statistics to Sóc de Poble. If the host already loads Umami as window.umami, the application forwards its events to that host's Umami instance.

== Source code and build ==

The file dist/soc-de-poble.standalone.js is compiled and minified. Human-readable source and build tools are public at https://github.com/socdepoble/socdepoble.org: the application is in src/, the build configuration in vite.standalone.config.js and this adapter in wordpress-plugin/. Each build writes dist/sdp-release.json with the version, bundle SHA-256 and integrity, and its pinned data node, so a host can verify what it serves.

To build locally, run `npm ci`, `npm run build:wp` (standalone, dist/) and `npm run build:wp:directori` (WordPress, builds/directori/dist/). For a release, set SDP_RELEASE=1 and use the same SDP_VERSIO and public configuration for both commands. The packager verifies both inventories and their dependencies before creating packages.

The directory variant requires WordPress 6.6 or later and loads core React, ReactDOM and the JSX runtime through the react, react-dom and react-jsx-runtime handles. The standalone package includes its own React for Sollutia, other hosts and the project's distribution channel. Both use the same embedding contract, with different bundle hashes.

== Installation ==

1. In Plugins → Add New → Upload Plugin, upload the package ZIP, or copy its socdepoble-enxufe directory into wp-content/plugins. Keep this directory name.
2. If another copy is active under a different directory name, deactivate it first. This version refuses activation while another copy is loaded and identifies both directories in its message.
3. Deactivate the older "soc-de-poble" plugin if active: both define the same custom element.
4. Activate Sóc de Poble — Enxufe.
5. Optionally set the display name and village identifier in Settings → Sóc de Poble.
6. Add the Sóc de Poble block or the `[socdepoble_app]` shortcode to a page.
7. Optionally select the "Sóc de Poble · full screen" page template. Classic themes expose it in the page editor. Block themes expose it in the page editor's Template panel on WordPress 6.7 or later; on WordPress 6.5 and 6.6, use Quick Edit in the Pages list.

== Frequently Asked Questions ==

= Does it work without the Sóc de Poble service? =

No. This plugin displays the application; connected community data lives in the Sóc de Poble backend.

= How do I choose the village? =

Use Settings → Sóc de Poble, the block options, `[socdepoble_app nom_poble="Gent de la Torre" poble="la-torre-de-les-macanes"]`, or the `socdepoble_enxufe_config` filter.

= Why is the script large? =

It contains the community application. A Shadow DOM isolates its styles from the theme. The script loads only where the shortcode or block is used. The directory variant uses WordPress's React runtime.

= Can the same village be served without WordPress? =

Yes. Use the standalone socdepoble-spa-vVERSIO-AAMMDD_HHMM.zip distribution and its embedding manifest. The project's own distribution also provides embedding code in Settings → Sóc de Poble. The directory variant requires WordPress's runtime and explains that another host needs the standalone package.

= The page shows an empty box. What is missing? =

Open Tools → Site Health. The plugin reports missing application scripts or manifests, and packages compiled against a development backend.

= The plugin is installed twice. What should I do? =

A ZIP without the socdepoble-enxufe directory at its root may install alongside the existing copy under the ZIP's name. Keep one copy: deactivate the other, activate the desired copy, then remove the unused directory. Deleting a copy from Plugins runs that copy's uninstaller. This version preserves shared settings while another copy remains active, but older versions delete the display name and village identifier, so record those settings first.

= Where are generated packages stored? =

Packages are written under wordpress-plugin/builds/. Names use the standalone build's timestamp in Europe/Madrid. The own-channel plugin is socdepoble-enxufe-vVERSIO-AAMMDD_HHMM.zip; the directory variant uses the same filename under directori/. Channel manifests declare each variant's exact name and path. --sortida accepts only builds/ or one of its subdirectories.

== Changelog ==

= 1.0.0 =
* First stable release.
* Optional DeepL translation at POST /wp-json/socdepoble/v1/traduir, with the key kept on the server, daily and monthly local budgets, per-client rate limiting and a seven-day cache. The element receives traductor-url only when a key is configured.
* Full-screen template accounts for the admin bar, allows the application to shrink below 32rem and leaves password-protected pages under WordPress control.
* Full-screen template listed in the block-theme page editor on WordPress 6.7 or later.
* Village identifiers and initial routes follow the application's validation rules; invalid values do not hide valid defaults.
* Activation refuses a second loaded copy and identifies both directories instead of causing a fatal error.
* Valencian (Catalan) translations for the plugin and block editor.
* The package distributed by Sóc de Poble uses an Ed25519-signed update channel, verifies package size and SHA-256 before installation, and refuses updates over symlinks, Git checkouts, renamed directories or multisite installations where WordPress does not check updates.
* View Details shows the description, installation instructions, FAQ and changelog from this readme.
* Uninstallation removes plugin options, channel state, translation budgets, locks and database caches if no other copy remains active.

= 0.2.0 =
* Block, settings page, Site Health checks and optional Subresource Integrity.
* The sdp.release.v1 manifest pins the script version instead of using its file modification date.
* Signed update channel for the package distributed by Sóc de Poble.

= 0.1.0 =
* Shortcode and full-screen template.

== Upgrade Notice ==

= 1.0.0 =
First stable release: optional DeepL translation, a full-screen template for block themes and a clear refusal instead of a fatal error when activating a second copy. Deactivate the older "soc-de-poble" plugin first.
