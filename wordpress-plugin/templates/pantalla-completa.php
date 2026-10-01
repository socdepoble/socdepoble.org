<?php
/**
 * Plantilla «Sóc de Poble · pantalla completa» (opt-in).
 *
 * Només s'aplica a les pàgines que l'han triada a «Plantilla», mai per
 * detectar el shortcode. Deixa fora la capçalera, el peu i els marges del
 * tema perquè l'App ocupe tota la finestra, però manté wp_head() i
 * wp_footer(): sense ells no arriben ni el bundle ni la declaració de
 * l'amfitrió.
 *
 * El CSS (barra d'administració, caixa que pot baixar de 32rem) és el mateix
 * de la plantilla de blocs i viu a socdepoble_enxufe_estils_pantalla()
 * (includes/marcatge.php). S'afig abans de wp_head() perquè isca a la
 * capçalera.
 */

defined( 'ABSPATH' ) || exit;

socdepoble_enxufe_estils_pantalla();
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'socdepoble-enxufe-pantalla' ); ?>>
<?php wp_body_open(); ?>
<?php
while ( have_posts() ) :
	the_post();
	the_content();
endwhile;
?>
<?php wp_footer(); ?>
</body>
</html>
