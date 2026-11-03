/**
 * PHP real; només les fronteres del host són dobles locals. No carrega WordPress,
 * wp-config.php, catàlegs .mo ni BD. El sanejament de WordPress és una aproximació
 * explícita: no acredita wp_kses_post ni sanitize_text_field de WordPress real.
 * La lògica de l'opció, la identitat pública, el registre de camps i el renderer
 * provenen dels includes reals del plugin. Cap funció de xarxa és utilitzable.
 */
export const PHP_AJUSTOS = String.raw`
error_reporting(E_ALL);
set_error_handler(static function($level, $message, $file, $line) {
    throw new ErrorException($message, 0, $level, $file, $line);
});
$case = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
define('ABSPATH', '/fixture/');
define('SOCDEPOBLE_ENXUFE_FITXER', $argv[1] . '/socdepoble-enxufe.php');
define('SOCDEPOBLE_ENXUFE_SLUG', 'socdepoble');
define('SOCDEPOBLE_ENXUFE_OPCIO', 'socdepoble_enxufe');
define('SOCDEPOBLE_ENXUFE_BUNDLE', 'dist/soc-de-poble.standalone.js');
define('SOCDEPOBLE_ENXUFE_FONTS', 'dist/fonts/noto-sans.css');
$hooks = array(); $settings = array(); $sections = array(); $fields = array();
$reads = array(); $writes = array(); $requests = array(); $inline_calls = array();
function add_action($name, $callback, $priority = 10, $argc = 1) { $GLOBALS['hooks'][$name][] = array($callback, $priority, $argc); }
function add_filter($name, $callback, $priority = 10, $argc = 1) { add_action($name, $callback, $priority, $argc); }
function apply_filters($name, $value) { return $value; }
function __($text, $domain) { return empty($GLOBALS['case']['gettext_prefix']) ? $text : $GLOBALS['case']['gettext_prefix'] . $text; }
function esc_html($text) { return htmlspecialchars((string)$text, ENT_QUOTES, 'UTF-8', false); }
function esc_attr($text) { return htmlspecialchars((string)$text, ENT_QUOTES, 'UTF-8', false); }
function esc_url($text) { return esc_attr($text); }
function wp_json_encode($value, $flags = 0) { return json_encode($value, $flags | JSON_THROW_ON_ERROR); }
// Doble opcional del punt d'extensió de WordPress 5.7+: representa un filtre
// wp_inline_script_attributes que incorpora nonce. No carrega el nucli WP.
if (isset($case['inline_nonce'])) {
    function wp_print_inline_script_tag($data, $attributes = array()) {
        $GLOBALS['inline_calls'][] = $attributes;
        $attributes['nonce'] = $GLOBALS['case']['inline_nonce'];
        echo '<script';
        foreach ($attributes as $name => $value) echo ' ' . esc_attr($name) . '="' . esc_attr($value) . '"';
        echo '>' . $data . '</script>';
    }
}
function wp_kses_post($html) {
    return preg_replace('/<(strong|em|code)\b[^>]*>/i', '<$1>', strip_tags($html, '<strong><em><code>'));
}
function sanitize_text_field($value) { return trim(preg_replace('/\s+/', ' ', strip_tags($value))); }
function sanitize_title($value) { return strtolower(preg_replace('/\s+/', '-', trim(strip_tags($value)))); }
function current_user_can($capability) { return $GLOBALS['case']['can_manage'] ?? true; }
if (empty($case['without_user_locale'])) {
    function get_user_locale() { return $GLOBALS['case']['user_locale'] ?? 'ca_valencia'; }
}
function get_locale() { return $GLOBALS['case']['site_locale'] ?? 'en_US'; }
function get_option($name, $default = false) {
    $GLOBALS['reads'][] = $name;
    return $name === SOCDEPOBLE_ENXUFE_OPCIO ? ($GLOBALS['case']['options'] ?? $default) : $default;
}
function update_option($name, $value) { $GLOBALS['writes'][] = array($name, $value); }
function plugin_basename($file) { return 'socdepoble/' . basename($file); }
function plugin_dir_path($file) { return dirname($file) . '/'; }
function plugins_url($path, $file) { return 'https://host.invalid/plugins/socdepoble/' . $path; }
function wp_get_environment_type() { return 'production'; }
function socdepoble_enxufe_manifest_local() {
    if (array_key_exists('manifest', $GLOBALS['case'])) return $GLOBALS['case']['manifest'];
    return array('versio'=>'1.1.0', 'entrada'=>array('sha256'=>str_repeat('a',64), 'integrity'=>'sha384-local'), 'node'=>array('origen'=>'https://node.invalid', 'mode'=>'remote', 'desenvolupament'=>false));
}
function socdepoble_enxufe_node_inadequat() { return $GLOBALS['case']['development_warning'] ?? false; }
function register_setting($group, $name, $args) { $GLOBALS['settings'][] = array('group'=>$group, 'name'=>$name, 'args'=>$args); }
function add_settings_section($id, $title, $callback, $page) { $GLOBALS['sections'][$id] = compact('title','callback','page'); }
function add_settings_field($id, $title, $callback, $page, $section, $args) { $GLOBALS['fields'][$id] = compact('title','callback','page','section','args'); }
function settings_fields($group) {
    echo '<input type="hidden" name="option_page" value="' . esc_attr($group) . '"><input type="hidden" name="action" value="update"><input type="hidden" name="_wpnonce" value="fixture-nonce-ONLY-HOST-DOUBLE"><input type="hidden" name="_wp_http_referer" value="/wp-admin/options-general.php?page=socdepoble">';
}
function do_settings_sections($page) {
    foreach ($GLOBALS['sections'] as $id => $section) {
        if ($section['page'] !== $page) continue;
        echo '<h2>' . $section['title'] . '</h2>';
        $section['callback']();
        echo '<table class="form-table"><tbody>';
        foreach ($GLOBALS['fields'] as $field) {
            if ($field['page'] !== $page || $field['section'] !== $id) continue;
            echo '<tr><th scope="row"><label for="' . esc_attr($field['args']['label_for']) . '">' . $field['title'] . '</label></th><td>';
            $field['callback']($field['args']);
            echo '</td></tr>';
        }
        echo '</tbody></table>';
    }
}
function fixture_network($name, $args) { $GLOBALS['requests'][] = array($name,$args); throw new RuntimeException('Forbidden network attempt: ' . $name); }
function wp_remote_get(...$args) { return fixture_network(__FUNCTION__,$args); }
function wp_remote_post(...$args) { return fixture_network(__FUNCTION__,$args); }
function wp_remote_request(...$args) { return fixture_network(__FUNCTION__,$args); }
function wp_safe_remote_get(...$args) { return fixture_network(__FUNCTION__,$args); }
function wp_safe_remote_post(...$args) { return fixture_network(__FUNCTION__,$args); }
require $argv[1] . '/includes/marcatge.php';
require $argv[1] . '/includes/ajustos.php';
socdepoble_enxufe_registra_ajustos();
$sanitized = array();
foreach ($case['sanitize'] ?? array() as $value) $sanitized[] = socdepoble_enxufe_sanitza_opcio($value);
$locales = array();
foreach ($case['locales'] ?? array() as $value) $locales[] = socdepoble_enxufe_llengua_ajustos($value);
ob_start(); socdepoble_enxufe_pagina(); $html = ob_get_clean();
echo json_encode(array('html'=>$html,'language'=>socdepoble_enxufe_llengua_ajustos(),'locales'=>$locales,'copies'=>socdepoble_enxufe_copies_ajustos(),'settings'=>$settings,'fields'=>$fields,'reads'=>$reads,'writes'=>$writes,'requests'=>$requests,'inline_calls'=>$inline_calls,'sanitized'=>$sanitized,'public_config'=>socdepoble_enxufe_config(),'diagnosis'=>socdepoble_enxufe_diagnosi()), JSON_THROW_ON_ERROR);
`;
