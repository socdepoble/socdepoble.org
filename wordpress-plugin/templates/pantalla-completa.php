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
 * BARRA D'ADMINISTRACIÓ. WordPress ja empeny <html> 32px (46px a ≤782px) amb
 * !important. No es lluita contra eixe marge: es resta de l'alçada de
 * l'element perquè l'App no quede tallada per baix.
 *
 * CSS mínim, sense colors ni variables: el fons i la pell de l'App viuen dins
 * del seu shadow root, i l'amfitrió no depén de tokens que no controla.
 * S'afig a l'estil del plugin abans de wp_head() perquè isca a la capçalera.
 */

defined( 'ABSPATH' ) || exit;

wp_add_inline_style(
	SOCDEPOBLE_ENXUFE_HANDLE,
	'.socdepoble-enxufe-pantalla{margin:0;padding:0}'
	. '.socdepoble-enxufe-pantalla .socdepoble-enxufe{min-height:0;margin:0}'
	. '.admin-bar .socdepoble-enxufe{height:calc(100vh - 32px);height:calc(100dvh - 32px)}'
	. '@media screen and (max-width:782px){.admin-bar .socdepoble-enxufe{height:calc(100vh - 46px);height:calc(100dvh - 46px)}}'
);
wp_enqueue_style( SOCDEPOBLE_ENXUFE_HANDLE );
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
