=== Sóc de Poble — Enxufe ===
Contributors: socdepoble
Tags: community, rural, village, social network, embed
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.2.0-dev
License: AGPL-3.0-or-later
License URI: https://www.gnu.org/licenses/agpl-3.0.html

Embeds the Sóc de Poble rural community app in any page with a shortcode or a block, using the same markup as every other host.

== Description ==

Sóc de Poble is an open source community platform for rural villages: chat, wall, market, events and a map, built to keep working when big platforms change their rules.

This plugin is a thin adapter. It places the self-contained Sóc de Poble web component on the pages where you add the `[socdepoble_app]` shortcode or the Sóc de Poble block. WordPress is one host among others: Sollutia, a static page or a wiki embed exactly the same package with exactly the same markup, which the settings page shows so you can copy it.

* `[socdepoble_app]` shortcode with optional `nom_poble` (display name), `poble` (village id) and `ruta_inicial` (initial app route) attributes.
* A dynamic Sóc de Poble block with the same three options.
* Settings → Sóc de Poble: the host identity (display name and landing village), a diagnosis of the package (version, integrity, sealed data node) and the universal markup.
* Site Health checks that warn when the package points to a development backend.
* The app script loads only on pages that use it. Subresource Integrity is opt-in (filter `socdepoble_enxufe_integritat`), because CDN plugins that rewrite the page output would otherwise block the script.
* Optional full-screen page template.
* The `socdepoble_enxufe_config` filter sets the default display name and village id.

The data backend is sealed into the package when it is built. No setting, attribute or filter of this plugin can point the app to another backend.

== External services ==

This plugin is an interface to the Sóc de Poble service. Accounts, messages and posts are stored by the Sóc de Poble backend, not in your WordPress database. The app contacts these services only when a visitor opens a page that contains the shortcode or the block:

1. Sóc de Poble backend (hosted on Supabase), required. Used to sign in, to read and publish profiles, messages, posts, market listings and events, and to receive real-time updates. Terms and privacy: https://socdepoble.org. Supabase: https://supabase.com/terms and https://supabase.com/privacy
2. Sóc de Poble sign-in relay (auth.socdepoble.org), only when a visitor chooses to sign in with Google.
3. Google Sign-In, only when a visitor chooses it: https://policies.google.com/terms and https://policies.google.com/privacy
4. OpenStreetMap, for the map view: https://wiki.osmfoundation.org/wiki/Terms_of_Use and https://osmfoundation.org/wiki/Privacy_Policy
5. Profile pictures of people who signed in with an external account may load from lh3.googleusercontent.com, graph.facebook.com or avatars.githubusercontent.com.

Update channel (only in the package distributed by Sóc de Poble, not in the WordPress.org directory): the plugin reads https://socdepoble.org/enxufe/stable.json and its signature to offer updates, and downloads the package named there. WordPress only asks the channel after api.wordpress.org answers its own update check. Requests identify the plugin, not your site.

== Privacy ==

The plugin adds no analytics of its own. When embedded, the app sends no visit statistics to Sóc de Poble; if your site already loads Umami (window.umami), the app forwards its events to your own Umami instance.

== Source code and build ==

The file dist/soc-de-poble.standalone.js is compiled and minified. The human-readable source code and the build tools are public at https://github.com/socdepoble/socdepoble.org (the app in src/, the build in vite.standalone.config.js, this adapter in wordpress-plugin/). Every build writes dist/sdp-release.json with the version, the SHA-256 and integrity of the bundle and its sealed data node, so any host can verify what it serves.

== Installation ==

1. Install and activate the plugin.
2. Add the Sóc de Poble block, or the `[socdepoble_app]` shortcode, to a page.
3. Optional: choose the page template "Sóc de Poble · full screen".

== Frequently Asked Questions ==

= Does it work without the Sóc de Poble service? =

No. The plugin displays the app; the data lives in the Sóc de Poble backend.

= How do I choose the village? =

In Settings → Sóc de Poble, per block, with `[socdepoble_app nom_poble="Gent de la Torre" poble="la-torre-de-les-macanes"]` or with the `socdepoble_enxufe_config` filter.

= Why is the script large? =

It contains the whole app inside a Shadow DOM, so it cannot conflict with your theme or other plugins. It loads only where the shortcode or the block is used.

== Changelog ==

= 0.2.0 =
* Block, settings page, Site Health checks and opt-in Subresource Integrity.
* The package manifest (sdp.release.v1) sets the script version instead of the file date.
* Signed update channel in the package distributed by Sóc de Poble.

= 0.1.0 =
* Shortcode and full-screen template.
