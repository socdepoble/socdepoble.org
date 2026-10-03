<?php
/**
 * Traducció al català (norma valenciana) del plugin, en el format PHP de
 * traduccions de WordPress 6.5+. Les claus són els textos originals exactes;
 * tests/enxufe-plugin.test.mjs comprova que no en falta cap.
 *
 * @package SocDePobleEnxufe
 */

defined( 'ABSPATH' ) || exit;

return array(
	'domain'       => 'socdepoble-enxufe',
	'plural-forms' => 'nplurals=2; plural=n != 1;',
	'language'     => 'ca',
	'messages'     => array(
		'Translation limit reached. Try again later.' => 'S’ha arribat al límit de traduccions. Torna-ho a provar més tard.',
		'Translation is not configured on this server.' => 'La traducció no està configurada en este servidor.',
		'Translation is busy. Try again shortly.' => 'El traductor està ocupat. Torna-ho a provar en uns instants.',
		'The translation provider is unavailable. Try again later.' => 'El proveïdor de traducció no està disponible. Torna-ho a provar més tard.',
		'The translation request could not be accepted.' => 'No s’ha pogut acceptar la petició de traducció.',
		'Embeds the Sóc de Poble rural community app with the universal host markup: a shortcode, a block and an optional full-screen template.' => 'Enxufa l’App comunitària rural de Sóc de Poble amb el marcatge universal d’amfitrió: un shortcode, un bloc i una plantilla opcional de pantalla completa.',
		"block description\x04Embeds the Sóc de Poble app with the universal host markup." => 'Enxufa l’App de Sóc de Poble amb el marcatge universal d’amfitrió.',
		"block keyword\x04village" => 'vila',
		"block keyword\x04community" => 'comunitat',

		// socdepoble-enxufe.php (doble còpia)
		'Sóc de Poble — Enxufe is already active from the folder %1$s. Deactivate that copy in Plugins before activating this one, in %2$s.' => 'Sóc de Poble — Enxufe ja està actiu des de la carpeta %1$s. Desactiva eixa còpia a Extensions abans d’activar esta, que és a %2$s.',
		'Sóc de Poble — Enxufe is installed twice and both copies are active. The copy in %1$s is loaded and the copy in %2$s is ignored. Deactivate one of them in Plugins.' => 'Sóc de Poble — Enxufe està instal·lat dues vegades i les dues còpies estan actives. Es carrega la còpia de %1$s i s’ignora la de %2$s. Desactiva’n una a Extensions.',

		// copies.php (activació a tota la xarxa)
		'Sóc de Poble — Enxufe is already active from the folder %1$s on at least one site of this network. Deactivate that copy on every site before activating this one, in %2$s, for the whole network.' => 'Sóc de Poble — Enxufe ja està actiu des de la carpeta %1$s en almenys un lloc d’esta xarxa. Desactiva eixa còpia en tots els llocs abans d’activar esta, que és a %2$s, a tota la xarxa.',

		// marcatge.php
		'Sóc de Poble — Enxufe: dist/soc-de-poble.standalone.js is missing. Build it with npm run build:wp.' => 'Sóc de Poble — Enxufe: falta dist/soc-de-poble.standalone.js, que ix de npm run build:wp.',
		'Sóc de Poble · full screen' => 'Sóc de Poble · pantalla completa',
		'Only the page content, without the theme header or footer, so the Sóc de Poble app fills the window.' => 'Només el contingut de la pàgina, sense la capçalera ni el peu del tema, perquè l’App de Sóc de Poble ocupe tota la finestra.',

		// ajustos.php
		'Host identity' => 'Identitat de l’amfitrió',
		'Village name' => 'Nom del poble',
		'Shown in the app as the server that hosts it, for example Gent de la Torre.' => 'L’App el mostra com el servidor que l’allotja, per exemple Gent de la Torre.',
		'Village id' => 'Identificador del poble',
		'Id of the village in the Villages section: visitors land on its page. It is not a data scope.' => 'Identificador del poble a la secció Pobles: qui entra aterra a la seua pàgina. No és un abast de dades.',
		'Empty fields keep the test bench values. The socdepoble_enxufe_config filter has the last word.' => 'Els camps buits conserven els valors del banc de proves. El filtre socdepoble_enxufe_config té l’última paraula.',
		'Settings' => 'Ajustos',
		'Package manifest' => 'Manifest del paquet',
		'Missing (dist/sdp-release.json). Rebuild the package with npm run build:wp.' => 'Falta (dist/sdp-release.json). Torna a compilar el paquet amb npm run build:wp.',
		'Missing, and the bundle is missing too.' => 'Falta, i el bundle també.',
		'App version' => 'Versió de l’App',
		'Bundle SHA-256' => 'SHA-256 del bundle',
		'Bundle integrity' => 'Integritat del bundle',
		'Sealed data node' => 'Node de dades segellat',
		'none' => 'cap',
		'Data mode' => 'Mode de dades',
		'Package kind' => 'Tipus de paquet',
		'Development: it only works next to its local backend.' => 'Desenvolupament: només funciona al costat del seu backend local.',
		'Release: it can serve real visitors, here or in any other host.' => 'Release: pot servir visitants reals, ací o en qualsevol altre amfitrió.',
		'Site environment' => 'Entorn del lloc',
		'This package points to a development backend. Visitors of this site will see the app without data. Rebuild it as a release with production values.' => 'Este paquet apunta a un backend de desenvolupament. Qui visite este lloc veurà l’App sense dades. Torna a compilar-lo com a release amb els valors de producció.',
		'Package and data node' => 'Paquet i node de dades',
		'Universal markup' => 'Marcatge universal',
		'The three pieces this plugin sends to the page (WordPress adds ?ver= to the script). Any other host (Sollutia, a static page) emits the same three pieces pointing to its own copy of dist/. The box that contains the element needs a height.' => 'Les tres peces que este plugin envia a la pàgina (WordPress afig ?ver= a l’script). Qualsevol altre amfitrió (Sollutia, una pàgina estàtica) emet les mateixes tres peces apuntant a la seua còpia de dist/. La caixa que conté l’element necessita una alçada.',

		// salut.php
		'Sóc de Poble package' => 'Paquet de Sóc de Poble',
		'Sóc de Poble update channel' => 'Canal d’actualitzacions de Sóc de Poble',
		'Open Settings → Sóc de Poble' => 'Obri Ajustos → Sóc de Poble',
		'The Sóc de Poble bundle is missing' => 'Falta el bundle de Sóc de Poble',
		'dist/soc-de-poble.standalone.js is not in the plugin folder, so pages with the shortcode or the block show nothing to visitors.' => 'dist/soc-de-poble.standalone.js no és a la carpeta del plugin: les pàgines amb el shortcode o el bloc no mostren res a qui les visita.',
		'The Sóc de Poble package has no valid manifest' => 'El paquet de Sóc de Poble no té cap manifest vàlid',
		'Without dist/sdp-release.json the app still loads, but nobody can tell which data node it uses, and the script loads without integrity.' => 'Sense dist/sdp-release.json l’App carrega igual, però ningú no pot saber quin node de dades usa, i l’script carrega sense integritat.',
		'The Sóc de Poble package points to a development backend' => 'El paquet de Sóc de Poble apunta a un backend de desenvolupament',
		'It was built against a local backend, without https or in seed mode. Visitors will see the app without data, and any other host would too. Rebuild it as a release with production values.' => 'Es va compilar contra un backend local, sense https o en mode llavor. Qui el visite veurà l’App sense dades, i en qualsevol altre amfitrió passaria igual. Torna a compilar-lo com a release amb els valors de producció.',
		'The Sóc de Poble package is ready' => 'El paquet de Sóc de Poble està a punt',
		'The bundle, its manifest and its sealed data node are consistent with this site.' => 'El bundle, el seu manifest i el node de dades segellat quadren amb este lloc.',

		// actualitzador.php
		'The URL is not valid.' => 'L’URL no és vàlida.',
		'Local URLs are only allowed on development sites.' => 'Les URL locals només s’admeten en llocs de desenvolupament.',
		'Only https URLs are allowed.' => 'Només s’admeten URL https.',
		'%1$s answered HTTP %2$d.' => '%1$s ha respost HTTP %2$d.',
		'No signing key is configured, so no update is offered.' => 'No hi ha cap clau de signatura configurada: no s’oferix cap actualització.',
		'The channel has not been read yet.' => 'Encara no s’ha llegit el canal.',
		'The channel signature does not verify.' => 'La signatura del canal no verifica.',
		'The signed manifest does not follow sdp.release.v1 or does not suit this site.' => 'El manifest signat no seguix sdp.release.v1 o no és per a este lloc.',
		'The channel served an older signed manifest; the newer one is kept.' => 'El canal ha servit un manifest signat més antic; es conserva el més nou.',
		'The plugin lives in the folder %1$s instead of %2$s, so an update would install a second copy. Reinstall it from a release package.' => 'El plugin viu a la carpeta %1$s en lloc de %2$s: una actualització n’instal·laria una segona còpia. Torna a instal·lar-lo des d’un paquet de release.',
		'The plugin folder is a symbolic link to a working copy. Updating it would delete the linked files, so updates stay off.' => 'La carpeta del plugin és un enllaç simbòlic a una còpia de treball. Actualitzar-la esborraria els fitxers enllaçats: les actualitzacions queden apagades.',
		'The plugin folder is a git checkout, so updates stay off to protect it.' => 'La carpeta del plugin és un repositori git: les actualitzacions queden apagades per a protegir-lo.',
		'Embeds the Sóc de Poble rural community app with the universal host markup. WordPress is one host among others: Sollutia or a static page embed exactly the same package.' => 'Enxufa l’App comunitària rural de Sóc de Poble amb el marcatge universal d’amfitrió. WordPress és un amfitrió més: Sollutia o una pàgina estàtica enxufen exactament el mateix paquet.',
		'Release notes' => 'Notes de la versió',
		'No release notes published.' => 'No s’han publicat notes de la versió.',
		'The Sóc de Poble update channel could not be verified.' => 'No s’ha pogut verificar el canal d’actualitzacions de Sóc de Poble.',
		'The package does not match the signed manifest.' => 'El paquet no coincidix amb el manifest signat.',
		'The package is not a valid zip file.' => 'El paquet no és un fitxer zip vàlid.',
		'On a multisite network WordPress only checks for updates on the main site and in the network admin. Activate the plugin network-wide or on the main site so the channel is consulted.' => 'En multilloc, WordPress només comprova les actualitzacions al lloc principal i a l’administració de xarxa. Activa el plugin a tota la xarxa o al lloc principal perquè es consulte el canal.',
		'WordPress update check' => 'Comprovació d’actualitzacions de WordPress',
		'The channel is applied.' => 'El canal s’aplica.',
		'Not applied yet: WordPress only asks the channel after api.wordpress.org answers its update check.' => 'Encara no s’aplica: WordPress només consulta el canal després que api.wordpress.org responga a la seua comprovació.',
		'WordPress has not asked the Sóc de Poble update channel yet' => 'WordPress encara no ha consultat el canal d’actualitzacions de Sóc de Poble',
		'The channel verifies, but WordPress only consults it after api.wordpress.org answers its update check. If this site blocks api.wordpress.org or has no Internet access, no update will be offered.' => 'El canal verifica, però WordPress només el consulta després que api.wordpress.org responga a la seua comprovació. Si este lloc bloqueja api.wordpress.org o no té accés a Internet, no s’oferirà cap actualització.',
		'Could not create a temporary file.' => 'No s’ha pogut crear un fitxer temporal.',
		'The package download answered HTTP %d.' => 'La descàrrega del paquet ha respost HTTP %d.',
		'The downloaded package does not match the size and SHA-256 of the signed manifest.' => 'El paquet descarregat no té la mida i el SHA-256 del manifest signat.',
		'The update package must contain the socdepoble-enxufe folder with socdepoble-enxufe.php inside.' => 'El paquet d’actualització ha de contindre la carpeta socdepoble-enxufe amb socdepoble-enxufe.php dins.',
		'You are not allowed to update plugins.' => 'No tens permís per a actualitzar extensions.',
		'Channel' => 'Canal',
		'Signing key' => 'Clau de signatura',
		'none: no update will be offered' => 'cap: no s’oferirà cap actualització',
		'Last check' => 'Última comprovació',
		'never' => 'mai',
		'Latest verified release' => 'Última release verificada',
		'Last error' => 'Últim error',
		'This installation' => 'Esta instal·lació',
		'Can update itself.' => 'Es pot actualitzar sola.',
		'Update channel' => 'Canal d’actualitzacions',
		'Updates come from the signed Sóc de Poble channel, not from WordPress.org. Automatic updates are off until an administrator turns them on in the Plugins screen.' => 'Les actualitzacions vénen del canal signat de Sóc de Poble, no de WordPress.org. Les automàtiques estan apagades fins que un administrador les activa a la pantalla d’Extensions.',
		'Check the channel now' => 'Comprova el canal ara',
		'Sóc de Poble cannot update itself here' => 'Sóc de Poble no es pot actualitzar sol ací',
		'The Sóc de Poble update channel has no signing key' => 'El canal d’actualitzacions de Sóc de Poble no té clau de signatura',
		'Updates stay off until the plugin carries the public key of the channel. Install a release package, which always carries it.' => 'Les actualitzacions queden apagades fins que el plugin porte la clau pública del canal. Instal·la un paquet de release, que sempre la porta.',
		'The Sóc de Poble update channel could not be verified' => 'No s’ha pogut verificar el canal d’actualitzacions de Sóc de Poble',
		'The Sóc de Poble update channel is verified' => 'El canal d’actualitzacions de Sóc de Poble està verificat',
		'The latest signed release is %s.' => 'L’última release signada és la %s.',
	),
);
