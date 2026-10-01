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

![Sóc de Poble - Portal de Pobles Connectats](https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png)

Sóc de Poble és una xarxa social cívica, descentralitzada i de codi obert dissenyada específicament per a pobles rurals (xat, mur, mercat, esdeveniments i mapa). Està construïda per a connectar el veïnat, les associacions i el comerç local en un espai segur que pertany íntegrament a la comunitat, lliure de la publicitat, els algoritmes i la dependència de les plataformes Big Tech.

= L'arquitectura "Enxufe" (Un client pur) =

Sóc de Poble és **hiper-modular**. La interfície (aquesta aplicació) és un client pur (SPA) que està completament separat d'on es guarden les dades. 
Aquest connector actua com un adaptador lleuger. No té lògica pròpia de l'aplicació; simplement col·loca el component web autònom `<soc-de-poble>` en les pàgines on afiges el shortcode `[socdepoble_app]` o el bloc.
Mentre que l'aplicació pot connectar-se ara mateix a un backend de Supabase per a guanyar velocitat i eficiència, l'arquitectura en garanteix la sobirania. Demà, aquest "enxufe" podria desconnectar-se i tornar-se a connectar a un backend gestionat directament per **WordPress**, **Joomla** o **Wikimedia** sense que la interfície canvie gens ni mica.

= El Fedivers i les Micro-xarxes connectades =

No volem construir cap monopoli centralitzat. El nostre objectiu és empoderar les comunitats rurals independents perquè òbriguen les portes al **Fedivers**. A l'igual que **Mastodon** o **Diaspora**, Sóc de Poble es construeix amb la visió de "podes" o servidors independents que es comuniquen entre ells. Una veïna del Poble A pot xatejar amb un veí del Poble B i compartir un servei social públic sense un únic amo central.

= Resiliència IA i la Wiki integrada =

Sóc de Poble es construeix amb l'ajuda incansable de la Intel·ligència Artificial, però està explícitament dissenyada **per a sobreviure sense ella**. 
Tota la Wiki del projecte, la Constitució i el nostre Sistema de Disseny s'inclouen públicament dins de la mateixa aplicació. Si la IA desapareguera demà, qualsevol desenvolupador humà podria llegir aquests documents i entendre el sistema pas a pas. I mentre la IA existisca, pot llegir la nostra filosofia central directament des del codi per a millorar el projecte sense destruir la nostra identitat.

= Característiques =

* L'shortcode `[socdepoble_app]` amb atributs opcionals `nom_poble` (nom a mostrar), `poble` (identificador del poble) i `ruta_inicial` (ruta inicial de l'app).
* Un bloc dinàmic de Sóc de Poble amb les mateixes tres opcions.
* Ajustos → Sóc de Poble: la identitat de l'amfitrió (nom a mostrar i poble d'aterratge), un diagnòstic del paquet (versió, integritat, node de dades segellat) i el codi universal d'inserció.
* Les revisions de Salut del Lloc que avisen quan falta l'script de l'aplicació o el seu manifest, o quan el paquet apunta a un backend de desenvolupament.
* L'script de l'aplicació només es carrega a les pàgines que l'utilitzen. La Integritat de Subrecursos (SRI) és opcional (filtre `socdepoble_enxufe_integritat`), ja que d'altra manera els plugins de CDN que reescriuen l'eixida de la pàgina bloquejarien l'script.
* Plantilla de pàgina de pantalla completa opcional, per a temes clàssics i de blocs.
* El filtre `socdepoble_enxufe_config` estableix el nom de visualització i l'ID del poble per defecte.
* Traducció opcional de textos seleccionats a través de DeepL, amb la clau guardada de forma segura al servidor.
* Traducció al valencià (català) del connector i de l'editor de blocs.

== External services ==

Aquest connector és una interfície cap al servei Sóc de Poble. Els comptes, missatges i publicacions s'emmagatzemen al backend de Sóc de Poble, no a la teua base de dades de WordPress. L'aplicació contacta amb aquests serveis només quan un visitant obre una pàgina que conté l'shortcode o el bloc:

1. Backend de Sóc de Poble (allotjat a Supabase), obligatori. S'utilitza per a iniciar sessió, llegir i publicar perfils, missatges, publicacions, anuncis del mercat i esdeveniments, i per rebre actualitzacions en temps real. Condicions i privacitat: https://socdepoble.org. Supabase: https://supabase.com/terms i https://supabase.com/privacy
2. Retransmissor d'inici de sessió de Sóc de Poble (auth.socdepoble.org), només quan un visitant decideix iniciar sessió amb Google.
3. Google Sign-In, només quan un visitant ho tria: https://policies.google.com/terms i https://policies.google.com/privacy
4. OpenStreetMap, per a la vista del mapa: https://wiki.osmfoundation.org/wiki/Terms_of_Use i https://osmfoundation.org/wiki/Privacy_Policy
5. Les imatges de perfil de les persones que han iniciat sessió amb un compte extern poden carregar-se des de lh3.googleusercontent.com, graph.facebook.com o avatars.githubusercontent.com.
6. Traducció opcional de DeepL: el text o HTML seleccionat s'envia a api-free.deepl.com o api.deepl.com només quan un visitant sol·licita una traducció. La configuració, retenció, condicions i privacitat es detallen a continuació.

Canal d'actualització (només en el paquet distribuït per Sóc de Poble, no al directori de WordPress.org): el connector llig https://socdepoble.org/enxufe/stable.json i la seua signatura per a oferir actualitzacions, i descarrega el paquet que s'hi indica. WordPress només pregunta al canal després que api.wordpress.org conteste a la seua pròpia comprovació d'actualitzacions. Les peticions identifiquen el connector, no el teu lloc. Les actualitzacions automàtiques romanen desactivades fins que les actives a Extensions. L'interruptor apareix una vegada que WordPress ha comprovat si hi ha actualitzacions amb el connector actiu; en activar el connector, s'esborra la memòria cau d'actualitzacions, així que la propera visita a Extensions executa aquesta comprovació. Les actualitzacions només s'instal·len mentre el connector està actiu, es troba a la carpeta socdepoble-enxufe (no un enllaç simbòlic ni un 'checkout' de git) i porta la clau del canal, que té cada paquet de llançament; per a les automàtiques també cal WP-Cron i un lloc que puga arribar a WordPress.org. Ajustos → Sóc de Poble i Salut del Lloc indiquen quina condició falta.

== Servei de traducció opcional (DeepL) ==

Defineix DEEPL_API_KEY com a variable d'entorn del procés PHP o com a constant a wp-config.php. El connector no carrega l'arxiu .env del repositori font, ni envia la clau, ni l'exposa en JavaScript. Les claus gratuïtes acabades en :fx utilitzen api-free.deepl.com; les altres utilitzen api.deepl.com. No cal cap SDK.

POST /wp-json/socdepoble/v1/traduir accepta JSON {"textos":["Bon dia"],"desti":"ES","origen":"CA","format":"text"}. Destinacions permeses: ES, EN-GB, FR, DE. El format pot ser text o html; els renderitzadors han de sanejar l'HTML traduït. Fins a 50 cadenes, 5000 caràcters Unicode i 20000 bytes de text per lot; el cos JSON total pot arribar als 32768 bytes. Retorna {"traduccions":["..."],"origen":"CA","desti":"ES","cache":false}. L'atribut opcional traductor-url descobreix el servei del mateix origen per cada instància. No es requereixen galetes ni iniciar sessió a WordPress. El codi d'inserció portàtil omet la URL del servei local.

L'ús públic està limitat: 30 peticions no emmagatzemades a la cau cada 10 minuts per REMOTE_ADDR (no es confia en les capçaleres reemeses), 10000 caràcters per dia UTC i 100000 per mes UTC per lloc de WordPress. Les constants enteres SDP_TRADUCCIO_LIMIT_DIARI i SDP_TRADUCCIO_LIMIT_MENSUAL anul·len aquests pressupostos; zero desactiva les noves peticions d'origen. Els pressupostos es reserven atòmicament abans d'enviar i sobreviuen a l'evicció temporal. Les peticions fallides també consumeixen la reserva local, ja que els temps d'espera esgotats (timeouts) es poden facturar. Aquests són límits locals, no una lectura del teu saldo a DeepL; en multilloc cada lloc té el seu propi límit, així que cal establir límits de compte també a DeepL. Les pèrdues coincidents (overlapping misses) retornen 503 (ocupat); els textos independents es poden executar simultàniament. Un curt bloqueig global només protegeix la reserva de pressupost. Les fallades 403/429/456 del proveïdor i els errors de transport obrin una pausa de 60 segons; no hi ha reintents automàtics de pagament. Els lots repetits/parcials reutilitzen les traduccions individuals durant set dies, separades per idioma, format i clau. WordPress podria expulsar els transitoris abans d'hora.

Només la traducció explícita envia el text seleccionat a DeepL, a través de HTTPS des de WordPress. Aquest connector no registra els textos originals ni les claus de l'API, ni els emmagatzema en claus de la memòria cau. Els transitoris contenen el text traduït durant set dies i els comptadors de clients en format hash durant deu minuts; aquests poden contenir les mateixes dades personals que el text original. Els transitoris caducats poden romandre a la base de dades fins a la neteja de WordPress. La desinstal·lació elimina el pressupost, els bloquejos i els transitoris de la base de dades. Les entrades externes d'object-cache caduquen normalment als set dies. Condicions de DeepL: https://www.deepl.com/pro-license ; privacitat: https://www.deepl.com/privacy

El servei utilitza REMOTE_ADDR. Darrere d'un servidor intermediari invers (reverse proxy) els visitants poden compartir el seu límit de velocitat; configura el tractament d'adreces de proxy de confiança al servidor web en lloc de confiar en capçaleres reemeses arbitràries. Mantingues els URLs d'inici/lloc de WordPress alineats amb l'origen públic.

Els límits de traducció han de ser constants enteres (sense cometes). Es permet la falta d'Origen (Origin) per als clients que no són navegadors; les comprovacions de JSON i pressupost s'apliquen igualment. El pressupost diari públic pot ser exhaurit pels visitants; l'Origen no és una autenticació. Els filtres de WordPress (HTTP hooks) i els altres connectors instal·lats formen part del codi de confiança del servidor i poden observar les peticions d'eixida.

== Privacitat ==

El connector no afegeix cap analítica pròpia. Quan s'insereix, l'aplicació no envia estadístiques de visites a Sóc de Poble; si el teu lloc ja carrega Umami (window.umami), l'aplicació reenvia els seus esdeveniments a la teua pròpia instància d'Umami.

== Codi font i compilació ==

L'arxiu dist/soc-de-poble.standalone.js està compilat i minificat. El codi font llegible per a humans i les eines de compilació són públiques a https://github.com/socdepoble/socdepoble.org (l'app a src/, la compilació a vite.standalone.config.js, i aquest adaptador a wordpress-plugin/). Cada compilació escriu dist/sdp-release.json amb la versió, el SHA-256 i la integritat del paquet (bundle) i el seu node de dades segellat, perquè qualsevol amfitrió puga verificar el que serveix.

== Installation ==

1. A Extensions → Afegeix una extensió nova → Puja un connector, puja el zip del paquet o copia la seua carpeta socdepoble-enxufe a wp-content/plugins. Mantingues el nom de la carpeta.
2. Si una altra còpia d'aquest connector està activa en una carpeta diferent, desactiva-la primer. Aquesta versió es nega a activar-se mentre hi haja una altra còpia carregada, i el missatge indica totes dues carpetes.
3. Desactiva l'antic connector "soc-de-poble" si està actiu: tots dos defineixen el mateix element.
4. Activa Sóc de Poble — Enxufe.
5. Opcional: estableix el nom de visualització i l'ID del poble a Ajustos → Sóc de Poble.
6. Afegeix el bloc de Sóc de Poble, o l'shortcode `[socdepoble_app]`, a una pàgina.
7. Opcional: tria la plantilla de pàgina "Sóc de Poble · pantalla completa" perquè l'aplicació ocupe tota la finestra. Els temes clàssics la mostren a l'editor de pàgines. Els temes de blocs la mostren al panell de Plantilla de l'editor de pàgines a partir de WordPress 6.7; a WordPress 6.5 i 6.6 cal triar-la a l'Edició Ràpida de la llista de Pàgines.

== Frequently Asked Questions ==

= Funciona sense el servei Sóc de Poble? =

No. El connector mostra l'aplicació; les dades viuen al backend de Sóc de Poble.

= Com trie el poble? =

A Ajustos → Sóc de Poble, a cada bloc, amb `[socdepoble_app nom_poble="Gent de la Torre" poble="la-torre-de-les-macanes"]` o amb el filtre `socdepoble_enxufe_config`.

= Per què l'script és tan gros? =

Conté tota l'aplicació dins d'un Shadow DOM, de manera que no pot entrar en conflicte amb el teu tema o altres connectors. Només es carrega on s'utilitza l'shortcode o el bloc.

= Es pot servir el mateix poble sense WordPress? =

Sí. Copia el codi d'inserció universal d'Ajustos → Sóc de Poble i serveix la carpeta dist del paquet des de qualsevol servidor web. WordPress és un amfitrió entre tants d'altres.

= La pàgina mostra un quadre buit. Què hi falta? =

Obri Eines → Salut del Lloc. Allí el connector informa si falta l'script de l'aplicació o el seu manifest, o si el paquet s'ha compilat contra un backend de desenvolupament.

= El connector està instal·lat dues vegades. Què faig? =

Un zip sense la carpeta socdepoble-enxufe a l'arrel s'instal·la en una nova carpeta anomenada com el zip, al costat de l'existent. Queda't amb una còpia: desactiva l'altra, activa aquesta i elimina l'altra carpeta. Si esborres una còpia des de la pantalla d'Extensions, s'executarà el desinstal·lador d'aquella còpia. A partir d'aquesta versió, el connector conserva la configuració compartida si hi ha una altra còpia activa, però les versions antigues esborren el nom a mostrar i l'ID del poble, així que anota'ls abans de fer res.

== Changelog ==

= 1.0.0 =
* Primer llançament estable.
* Traducció opcional de textos seleccionats amb DeepL a POST /wp-json/socdepoble/v1/traduir: la clau es queda al servidor, amb pressupostos locals diaris i mensuals, un límit de velocitat per visitant i una memòria cau de set dies. L'element només rep traductor-url si hi ha una clau configurada.
* Plantilla de pantalla completa: resta la barra d'administració de l'altura, permet a l'aplicació reduir-se per sota dels 32rem i deixa les pàgines protegides per contrasenya en mans de WordPress.
* Plantilla de pantalla completa llistada a l'editor de pàgines dels temes de blocs en WordPress 6.7 o superior.
* L'ID del poble i la ruta inicial segueixen les mateixes normes que l'aplicació, per tant, un valor no vàlid mai no amagarà un de vàlid.
* S'impedeix l'activació d'una còpia d'aquesta versió mentre n'hi ha una altra carregada i es mostra un missatge que identifica les dues carpetes, en lloc de provocar un error fatal.
* Traducció al valencià (català) del connector i de l'editor de blocs.
* Paquet distribuït per Sóc de Poble: canal d'actualització signat amb Ed25519, comprovació de la mida i el SHA-256 del paquet abans d'instal·lar-lo, i s'evita l'actualització sobre un enllaç simbòlic, un checkout de git, una carpeta reanomenada o una instal·lació multilloc on WordPress no comprova les actualitzacions.
* A "Mostra els detalls" s'ensenyen la descripció, la instal·lació, les preguntes freqüents i el registre de canvis d'aquest readme.
* En desinstal·lar-se s'eliminen les opcions del connector, l'estat del canal, i el pressupost, els bloquejos i la memòria cau de traducció de la base de dades, sempre que no quede cap altra còpia del connector activa.

= 0.2.0 =
* Bloc, pàgina de configuració, controls de Salut del Lloc i Integritat de Subrecursos opcional.
* El manifest del paquet (sdp.release.v1) fixa la versió de l'script en compte de la data de l'arxiu.
* Canal d'actualització signat al paquet distribuït per Sóc de Poble.

= 0.1.0 =
* Shortcode i plantilla de pantalla completa.

== Upgrade Notice ==

= 1.0.0 =
Primer llançament estable: traducció opcional amb DeepL, la plantilla de pantalla completa per a temes de blocs i un rebuig net en compte d'un error fatal quan s'activa una segona còpia. Desactiva primer el connector antic "soc-de-poble".
