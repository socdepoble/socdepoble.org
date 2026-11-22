<?php
// Dobles en memòria: cap WordPress real, xarxa ni base de dades.
define('ABSPATH', __DIR__ . '/');
define('SOCDEPOBLE_ENXUFE_OPCIO', 'socdepoble_enxufe');
define('SOCDEPOBLE_ENXUFE_FITXER', __FILE__);
define('SOCDEPOBLE_ENXUFE_SLUG', 'socdepoble');
define('SOCDEPOBLE_ENXUFE_VERSIO', 'test');
define('ARRAY_A', 'ARRAY_A');
$root = $argv[2] ?? dirname(__DIR__, 2);
$cas = $argv[1] ?? '';
// v1.2.19 · Gauntlet R1 (L2-05) · Amb un catàleg carregat (mode 'entorn'), __() el fa servir com WordPress.
function __($s,$d='') {return $GLOBALS['cataleg'][$s] ?? $s;}
function esc_html($s) {return htmlspecialchars((string)$s, ENT_QUOTES);}
function esc_attr($s) {return esc_html($s);}
function esc_url($s) {return $s;}
function esc_html__($s,$d='') {return esc_html($s);}
function admin_url($s) {return 'https://poble.example/' . $s;}
function add_action(...$args) {}
function add_filter(...$args) {}
function plugin_basename($s) {return 'socdepoble/socdepoble-enxufe.php';}
function register_activation_hook(...$args) {}
function current_user_can($cap) {return true;}
function add_option($name,$value,$deprecated='',$autoload=true) {$GLOBALS['added'][]=[$name,$autoload];return true;}
function wp_set_option_autoload($name,$autoload) {$GLOBALS['flags'][]=[$name,$autoload];return false;}
function register_setting(...$args) {}
function add_settings_section(...$args) {}
function add_settings_field(...$args) {}
function is_wp_error($x) {return $x instanceof WP_Error;}
function wp_remote_retrieve_response_code($r) {return $r['response']['code'];}
function set_transient($name,$value,$ttl) {$GLOBALS['transients'][]=[$name,$value,$ttl];return true;}
function wp_using_ext_object_cache() {return true;}
function wp_parse_url($url,$component=-1) {return parse_url($url,$component);}
function remove_filter(...$args) {}
// v1.2.19 · Gauntlet R1 (L2-03) · El mode 'canal' tria el Retry-After del 503 (null: sense capçalera).
function wp_safe_remote_get(...$args) {$GLOBALS['requests']=($GLOBALS['requests']??0)+1;$retry=array_key_exists('retry_canal',$GLOBALS)?$GLOBALS['retry_canal']:'7200';return ['response'=>['code'=>503],'headers'=>null===$retry?[]:['retry-after'=>$retry],'body'=>'COS_NO_PUBLICABLE'];}
function is_multisite() {return false;}
function update_option($key,$value,$autoload=null) {$GLOBALS['channel']=$value;return true;}
function get_site_option($key,$default=[]) {return $GLOBALS['channel']??$default;}

class WP_Error {
 public $code;public $message;public $data;
 function __construct($c='',$m='',$d=null) {$this->code=$c;$this->message=$m;$this->data=$d;}
 function get_error_code() {return $this->code;}
 function get_error_message() {return $this->message;}
 function get_error_data() {return $this->data;}
}
class WP_REST_Response {
 public $data;public $status;public $headers=[];
 function __construct($d,$s) {$this->data=$d;$this->status=$s;}
 function get_data() {return $this->data;}
 function get_status() {return $this->status;}
 function header($k,$v) {$this->headers[$k]=$v;}
}
class Request {public function get_route() {return '/socdepoble/v1/traduir';}}
/* v1.2.19 · Gauntlet R1 (L2-04) · Ara hi ha dues consultes: `resultats` respon cada get_results en
   ordre (les opcions fixes i després els prefixos); sense cua, `rows` per a totes. `sql` les porta totes. */
/* v1.2.19 · Gauntlet R2 (L2R2-02) · Com wpdb (wp-includes/class-wpdb.php): query() crida flush(), que buida
   last_error a CADA consulta, i una consulta que falla deixa el motiu a last_error i fa tornar array() a
   get_results(ARRAY_A), no null. `errors` és el last_error de cada get_results en ordre ('' si va bé). Un
   null només ix d'una consulta buida, quan prepare() falla. */
class DB {
 public $options='wp_options';public $rows=[];public $resultats=[];public $errors=[];public $last_error='';public $sql='';
 function prepare($sql,...$args) {$this->sql.=$sql."\n";return $sql;}
 function esc_like($s) {return addcslashes($s,'_%');}
 function get_results($sql,$format) {$files=$this->resultats ? array_shift($this->resultats) : $this->rows;$this->last_error=(string)array_shift($this->errors);return ''===$this->last_error ? $files : [];}
}
/* v1.2.19 · Gauntlet R1 (L2-04) · wp_options de veres (SQLite en memòria) per a l'ordre i el LIMIT:
   el «_» va davant de les lletres, com a les col·lacions de MySQL, i LIKE escapa amb «\» com MySQL. */
class DBSqlite {
 public $options='wp_options';public $pdo;public $sql='';
 function __construct() {$this->pdo=new PDO('sqlite::memory:');$this->pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$this->pdo->exec('CREATE TABLE wp_options (option_name TEXT PRIMARY KEY, option_value TEXT, autoload TEXT)');}
 function esc_like($s) {return addcslashes($s,'_%\\');}
 function prepare($sql,...$args) {$sql=str_replace('LIKE %s',"LIKE %s ESCAPE '\\'",$sql);foreach($args as $v){$sql=preg_replace_callback('/%s/',fn()=>$this->pdo->quote((string)$v),$sql,1);}$this->sql.=$sql."\n";return $sql;}
 function get_results($sql,$format) {return $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);}
 function posa($nom,$autoload,$bytes=1) {$this->pdo->prepare('INSERT INTO wp_options VALUES (?,?,?)')->execute([$nom,str_repeat('x',$bytes),$autoload]);}
}
if ($cas==='wp_head' || $cas==='wp_head_svg') {
 function socdepoble_enxufe_estils_pantalla() {}
 function language_attributes() {echo 'lang="ca"';}
 function bloginfo($key) {echo 'UTF-8';}
 function wp_head() {echo '<link rel="icon" type="image/png" sizes="192x192" href="/icon.png">';if ($GLOBALS['cas']==='wp_head_svg') echo '<link rel="icon" type="image/svg+xml" href="/favicon.svg">';}
 function body_class($value) {echo 'class="pantalla"';}
 function wp_body_open() {}
 function have_posts() {return false;}
 function the_post() {}
 function the_content() {}
 function wp_footer() {}
 require $root . '/wordpress-plugin/templates/pantalla-completa.php';exit;
}
require $root . '/wordpress-plugin/includes/salut.php';
if ($cas==='cache') {echo json_encode(socdepoble_enxufe_diagnostic_cache());exit;}
if ($cas==='autoload') {
 $wpdb=new DB();$wpdb->resultats=[[['option_name'=>'socdepoble_enxufe_canal','autoload'=>'auto-on','bytes'=>'8192'],['option_name'=>'socdepoble_enxufe','autoload'=>'off','bytes'=>'99']],[]];
 $r=socdepoble_enxufe_diagnostic_autoload();$r['sql']=$wpdb->sql;echo json_encode($r);exit;
}
/* v1.2.19 · Gauntlet R2 (L2R2-02) · Errors com els del wpdb real: la consulta de les opcions fixes es talla i
   la dels prefixos va bé (i buida last_error); o al revés. `autoload_nul` és el null de prepare() fallit. */
if ($cas==='autoload_error') {$wpdb=new DB();$wpdb->resultats=[[],[]];$wpdb->errors=['Lost connection to MySQL server during query',''];echo json_encode(socdepoble_enxufe_diagnostic_autoload());exit;}
if ($cas==='autoload_error_prefixos') {$wpdb=new DB();$wpdb->resultats=[[['option_name'=>'socdepoble_enxufe','autoload'=>'off','bytes'=>'9']],[['option_name'=>'sdp_traduccio_x','autoload'=>'off','bytes'=>'1']]];$wpdb->errors=['','Query execution was interrupted (max_statement_time exceeded)'];echo json_encode(socdepoble_enxufe_diagnostic_autoload());exit;}
if ($cas==='autoload_nul') {$wpdb=new DB();$wpdb->rows=null;echo json_encode(socdepoble_enxufe_diagnostic_autoload());exit;}
if ($cas==='autoload_limit') {$wpdb=new DB();$wpdb->resultats=[[],array_fill(0,501,['option_name'=>'sdp_tr_lock_x','autoload'=>'off','bytes'=>'1'])];echo json_encode(socdepoble_enxufe_diagnostic_autoload());exit;}
/* v1.2.19 · Gauntlet R1 (L2-04) · argv[3]: {traduccions, principal, canal, persistent}. Cada traducció en
   memòria cau són dues files sense autoload (valor i timeout), com les crea set_transient amb caducitat. */
if ($cas==='autoload_sqlite') {
 $o=json_decode($argv[3] ?? '{}', true) ?: [];
 $wpdb=new DBSqlite();
 for ($i=0;$i<($o['traduccions']??0);$i++) {$h=hash('sha256',(string)$i);$wpdb->posa('_transient_sdp_tr_'.$h,'off',40);$wpdb->posa('_transient_timeout_sdp_tr_'.$h,'off',10);}
 $wpdb->posa('_transient_sdp_tr_pause_'.str_repeat('p',64),'off',30);$wpdb->posa('_transient_timeout_sdp_tr_pause_'.str_repeat('p',64),'off',10);
 $wpdb->posa('sdp_traduccio_pressupost','off',60);
 if (!empty($o['persistent'])) $wpdb->posa('_transient_sdp_tr_'.str_repeat('f',64),'on',70);
 $wpdb->posa('socdepoble_enxufe',$o['principal']??'off',120);$wpdb->posa('socdepoble_enxufe_canal',$o['canal']??'off',300);
 $wpdb->posa('socdepoble_enxufer_aliena','on',5);$wpdb->posa('sdpXtrYaliena','on',5);
 $r=socdepoble_enxufe_diagnostic_autoload();$r['sql']=$wpdb->sql;echo json_encode($r);exit;
}
/* v1.2.19 · Gauntlet R1 (L2-05) · El resultat de Salut amb observacions donades i, si argv[4] és 'ca',
   amb el catàleg valencià que servix el connector. */
if ($cas==='entorn') {
 if (($argv[4] ?? '')==='ca') $GLOBALS['cataleg']=(require $root . '/wordpress-plugin/languages/socdepoble-ca.l10n.php')['messages'];
 $o=json_decode($argv[3] ?? '{}', true) ?: [];
 echo json_encode(socdepoble_enxufe_resultat_entorn($o['opcions'],$o['cache']));exit;
}
/* v1.2.19 · Gauntlet R2 (L2R2-02) · De cap a cap: el diagnòstic amb el wpdb fidel d'una consulta fallida
   (argv[3].falla: 'fixes' o 'prefixos') i el resultat de Salut amb la memòria cau d'argv[3].cache. */
if ($cas==='entorn_sql') {
 if (($argv[4] ?? '')==='ca') $GLOBALS['cataleg']=(require $root . '/wordpress-plugin/languages/socdepoble-ca.l10n.php')['messages'];
 $o=json_decode($argv[3] ?? '{}', true) ?: [];
 $wpdb=new DB();$wpdb->resultats=[[],[]];$wpdb->errors=($o['falla']??'fixes')==='fixes' ? ['Lost connection to MySQL server during query',''] : ['','Query execution was interrupted (max_statement_time exceeded)'];
 $diagnostic=socdepoble_enxufe_diagnostic_autoload();
 echo json_encode(['diagnostic'=>$diagnostic,'salut'=>socdepoble_enxufe_resultat_entorn($diagnostic,$o['cache'])]);exit;
}
if ($cas==='settings') {
 require $root . '/wordpress-plugin/includes/ajustos.php';
 socdepoble_enxufe_registra_ajustos();echo json_encode(['added'=>$GLOBALS['added'] ?? null,'flags'=>$GLOBALS['flags']]);exit;
}
require $root . '/wordpress-plugin/includes/http-perimetre.php';
if ($cas==='retry') {
 $now=1700000000;$cases=['120','0','9999999999','-1','tomorrow','120, 60',"120\r\nLocation: http://fora",['120'],gmdate('D, d M Y H:i:s \G\M\T',$now+90),gmdate('D, d M Y H:i:s \G\M\T',$now-1)];
 echo json_encode(array_map(fn($s)=>socdepoble_enxufe_retry_after($s,$now),$cases));exit;
}
if ($cas==='translation') {
 require $root . '/wordpress-plugin/includes/traduccio.php';
 $r=socdepoble_enxufe_traduccio_fallada(['response'=>['code'=>503],'headers'=>['retry-after'=>'120']],'pause');
 $rest=new WP_REST_Response(['code'=>$r->code,'data'=>$r->data],503);
 socdepoble_enxufe_traduccio_capcaleres_pausa($rest,null,new Request());
 echo json_encode(['error'=>$r,'transients'=>$GLOBALS['transients'],'headers'=>$rest->headers]);exit;
}

if ($cas==='updates') {
 require $root . '/wordpress-plugin/includes/actualitzador.php';
 $state=socdepoble_enxufe_refresca_canal(['cos'=>'manifest_verificat_previ','signatura'=>'signatura_previa']);
 socdepoble_enxufe_canal(true);
 echo json_encode(['state'=>$state,'requests'=>$GLOBALS['requests'],'remaining'=>$state['reintenta_despres']-time()]);exit;
}

/* v1.2.19 · Gauntlet R1 (L2-03) · Un 503 del canal amb el Retry-After d'argv[3] ('' o absent: sense
   capçalera), amb o sense un manifest signat de veres d'abans; després, el botó «Comprova el canal ara»
   (caduca + canal(true)) i la secció del canal pintada. */
if ($cas==='canal') {
 $opcions=json_decode($argv[3] ?? '{}', true) ?: [];
 $GLOBALS['retry_canal']=$opcions['retry'] ?? null;
 $estat=[];
 if (!empty($opcions['previ'])) {
  $parell=sodium_crypto_sign_keypair();
  define('SOCDEPOBLE_ENXUFE_CLAU_PUBLICA', bin2hex(sodium_crypto_sign_publickey($parell)));
  function esc_url_raw($u,$p=null) {return $u;}
  function sanitize_text_field($s) {return $s;}
  require $root . '/wordpress-plugin/includes/manifest.php';
  $cos=json_encode(['schema'=>'sdp.release.v1','producte'=>'soc-de-poble','versio'=>'1.2.19',
   'entrada'=>['cami'=>'soc-de-poble.standalone.js','sha256'=>str_repeat('a',64),'integrity'=>'sha384-'.str_repeat('A',64)],
   'node'=>['origen'=>'https://node.example','mode'=>'remote','desenvolupament'=>false],
   'adaptadors'=>['wordpress'=>['slug'=>'socdepoble','versio'=>'1.1.27','requires'=>'6.5','requires_php'=>'7.4','tested'=>'7.1',
    'paquet'=>['url'=>'https://socdepoble.org/enxufe/socdepoble-1.1.27.zip','sha256'=>str_repeat('b',64),'mida'=>1000]]]]);
  $estat=['cos'=>$cos,'signatura'=>bin2hex(sodium_crypto_sign_detached($cos, sodium_crypto_sign_secretkey($parell)))];
 }
 define('WP_PLUGIN_DIR', sys_get_temp_dir() . '/sdp-sense-plugins-' . getmypid());
 function get_option($k,$d=false) {return ['date_format'=>'Y-m-d','time_format'=>'H:i'][$k] ?? $d;}
 function wp_date($format,$ts) {return gmdate($format,$ts);}
 function esc_html_e($s,$d='') {echo esc_html($s);}
 function wp_nonce_field(...$args) {}
 function submit_button(...$args) {}
 function get_site_transient($k) {return false;}
 function trailingslashit($s) {return rtrim($s,'/').'/';}
 require $root . '/wordpress-plugin/includes/actualitzador.php';
 $state=socdepoble_enxufe_refresca_canal($estat);
 socdepoble_enxufe_caduca_canal();
 /* v1.2.19 · Gauntlet R2 (L2R2-01) · {"forca":false}: després de buidar la memòria cau, una lectura
    automàtica (canal() sense forçar) en lloc del botó. `comprovat` és el que queda desat al final. */
 socdepoble_enxufe_canal($opcions['forca'] ?? true);
 ob_start();socdepoble_enxufe_seccio_canal();$seccio=ob_get_clean();
 echo json_encode(['error'=>$state['error'],'verificada'=>null!==socdepoble_enxufe_analitza_canal($state['cos']??'',$state['signatura']??'')[0],'requests'=>$GLOBALS['requests'],'pausa'=>isset($state['reintenta_despres'])?$state['reintenta_despres']-time():null,'comprovat'=>(int)(socdepoble_enxufe_estat_canal()['comprovat']??0),'ara'=>time(),'seccio'=>$seccio]);exit;
}
