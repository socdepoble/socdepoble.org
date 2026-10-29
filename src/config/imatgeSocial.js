/**
 * imatgeSocial.js — Pla 261027_1154 (P1-61) · La imatge social d'una pàgina
 * pública, una sola regla per a qui escriu el <head>: avui, el client (useSEO
 * i seoHead); el productor de WordPress (build-seo-manifest.mjs, que encara
 * tria image_url o avatar_url) i el port del servidor de la Fase 2 l'han
 * d'adoptar (pla 1154, passos de les eines).
 *
 * Regla del Mestre (P1-61, invariant) · Si l'autor ha triat la imatge per a
 * xarxes (og_image, o si no, featured_image), og:image és eixa; si no, en una
 * pàgina amb imatges, og:image és la PRIMERA imatge que una persona veu a la
 * galeria o al cos. Només una pàgina sense cap imatge pròpia ni triada porta
 * la targeta genèrica (CAP_SOCIAL_BASE.image).
 * Una primera imatge que existix però que no es pot servir a un rastrejador
 * (SVG, bucket privat, URL signada, origen de tercers, camí que no es resol)
 * NO se salta cap a la segona foto ni cap al logotip: el selector la torna com
 * a 'bloquejada'. En esta fase de client el <head> hi posa aleshores la
 * targeta genèrica; la fase del servidor en farà una porta roja del release.
 *
 * Decisions del Mestre (261027; valors recomanats d'OG-1 a OG-6, CL-12 de
 * l'auditoria de Claude 0925):
 *   · OG-1. Sense cap imatge, la targeta de 1200x630 que ja servix index.html
 *     (el logotip sobre el mapa verd), no el quadrat de 256 px.
 *   · OG-5. Les llistes i la portada ('/') porten la targeta genèrica: ací no
 *     n'hi ha cap tipus.
 *   · OG-6. Els documents de la Wiki (?item=) continuen genèrics: tampoc no hi
 *     ha cap tipus 'wiki' encara.
 *   · Les reserves de pintura compten com a «cap imatge» (IMATGES_DE_RESERVA):
 *     el panorama per defecte de les pàgines de text, els logotips de la marca
 *     (PNG, la seua bessona WebP i l'SVG d'abans) i la mateixa targeta base.
 *     Llevat d'una pàgina de text que nomena el panorama ella mateixa
 *     (/projecte): és la seua panoràmica (Llibre Mestre, P1-60).
 *   · L'avatar de qui signa o ven no és mai la imatge d'una publicació.
 *   · Llibre Mestre (P1-61, àudio de les 12:08) · Si l'autor ha triat la
 *     imatge per a xarxes (og_image o featured_image), va per davant de la
 *     primera de la galeria; el selector visual és de la Fase 2.
 *
 * Llei del Píxel · Este mòdul no pinta res i no canvia cap portada, carrusel
 * ni targeta: només diu quina imatge va al <head>. Els getImage/getImages de
 * detailSectionMeta.jsx i imatgesDeProducte.js continuen sent els de sempre i
 * no lligen mai og_image ni featured_image; una prova de paritat
 * (imatgeSocial.test.js) fixa que, sense cap imatge triada per l'autor, el
 * Mercat hi llig el mateix ordre, i així la portada i l'og:image no es poden
 * separar. Amb una triada, se separen a propòsit.
 *
 * Fulla SENSE CAP IMPORT: només el global URL. La carrega Vite i la carrega
 * node pla (`node -e "import('./src/config/imatgeSocial.js')"`), com
 * politicaDeMitjans.js; ho vigila la prova. Cap React, cap DOM, cap xarxa,
 * cap window ni import.meta: el que depén de l'amfitrió (l'origen públic,
 * l'URL de Supabase) entra per paràmetre.
 *
 * Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · Cada tipus llig
 * EXACTAMENT els camps que pinta el seu detall (detailSectionMeta.jsx): una
 * imatge que la pàgina no pinta no la veu ningú i no pot ser l'og:image.
 * L'única excepció és la imatge que l'autor tria per a xarxes (og_image, o si
 * no, featured_image; Llibre Mestre, P1-61), que va primera i no es pinta. Els
 * cossos es lligen com HTML (els pinten renderRichText i CosDeLaPagina); el
 * Markdown només amb { markdown: true }, per a un format declarat que el pinte
 * (el pla, §9: «Markdown i TipTap només si són formats declarats»).
 * Les URL que torna urlSocialDe són URL analitzades: el client les escriu amb
 * node.content (seoHead.js). Qui les escriga dins d'un HTML (el productor de
 * WordPress, el port del servidor) ha d'escapar l'atribut: el camí pot portar
 * un apòstrof (l'horta.jpg) o un '&'.
 *
 * Pla 261029_0216 (R-01/GM2-01 i R-02; Pas 2 i Pas 9) · Les VARIANTS SOCIALS.
 * WhatsApp no pinta a la primera una og:image de més de 300 KB ni cap WebP, i
 * un .png amb bytes JPEG declara un MIME que els bytes desmentixen. Per a
 * eixes imatges hi ha una derivada dedicada al costat de l'original,
 * <nom>-social-1200x630.jpg: un JPEG baseline real, exactament 1200x630 i
 * ≤300 000 bytes, sense EXIF (OG-7). urlSocialDe la posa al <head> en lloc de
 * l'original (VARIANTS_SOCIALS, un mapa explícit: esta fulla no té disc);
 * `ref` continua sent l'original, que la pàgina pinta com sempre (Llei del
 * Píxel). imatgeSocial.pes300.test.js fixa que cada parell existix i que la
 * variant pesa i mesura el que diu el nom.
 *
 * API (els noms exactes):
 *   · ORIGEN_SOCIAL_PER_DEFECTE, CAP_SOCIAL_BASE, ATRIBUT_SSR: constants.
 *   · MARQUES, MARQUES_SVG_ANTIGUES, HERO_PER_DEFECTE, IMATGES_DE_RESERVA i
 *     esImatgeDeReserva(ref, opcions?): les reserves que no compten com a
 *     imatge.
 *   · srcsDeLesImg(text, maxim = 32, { markdown = false } = {}) → string[]:
 *     les imatges d'un cos.
 *   · primerValor(valor) → string | null: la primera referència d'un camp.
 *   · TIPUS_DE_PAGINA i imatgesDeLaPagina(tipus, item, opcions?) → string[]:
 *     les candidates crues: la triada per l'autor, si n'hi ha, i després les
 *     de la pàgina en l'ordre en què les veu una persona.
 *   · MOTIUS_DE_BLOQUEIG i urlSocialDe(ref, opcions) → string | null: l'URL
 *     https absoluta que pot baixar un rastrejador.
 *   · VARIANTS_SOCIALS: original → la seua variant social (-social-1200x630.jpg),
 *     la que urlSocialDe torna en lloc de l'original.
 *   · primeraImatgeSocial(tipus, item, opcions) →
 *       { estat: 'triada', ref, url, posicio: 0 }
 *     | { estat: 'bloquejada', ref, motiu }
 *     | { estat: 'absent' }
 */

/* ── Constants del <head> ──────────────────────────────────────────── */

/** Pla 261027_1154 (P1-61) · L'origen públic de producció. El mateix
 *  ORIGEN_PUBLIC_PER_DEFECTE de config/origenPublic.js, escrit ací en literal
 *  perquè esta fulla no importa res: una prova en fixa la igualtat. */
export const ORIGEN_SOCIAL_PER_DEFECTE = 'https://socdepoble.org';

const congela = (objecte) => {
  for (const valor of Object.values(objecte)) if (valor && typeof valor === 'object') congela(valor);
  return Object.freeze(objecte);
};

/**
 * Pla 261027_1154 (P1-61), OG-1 · El <head> genèric: el que porta index.html
 * (una prova compara cada valor amb el fitxer) i el que torna a escriure el
 * client a una ruta sense imatge pròpia. `image.url` és un camí del mateix
 * origen: qui l'escriu al <head> el fa absolut amb l'origen públic. Congelat
 * sencer: ningú no el pot canviar per a la ruta següent.
 */
export const CAP_SOCIAL_BASE = congela({
  title: 'Sóc de Poble',
  description: 'Portal de pobles connectats',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  image: {
    url: '/assets/system/ui/og-socdepoble-1200x630.png',
    type: 'image/png',
    width: '1200',
    height: '630',
    alt: 'Logotip de Sóc de Poble, Portal de Pobles Connectats, sobre el mapa verd'
  }
});

/** Pla 261027_1154 (P1-61) · La marca que posarà el port del servidor a cada
 *  node que escriga al <head>: seoHead sabrà així que el head servit ja ve
 *  particularitzat i no el prendrà com a base. index.html no la porta. */
export const ATRIBUT_SSR = 'data-sdp-ssr';

/* ── Reserves: es pinten, però no són la imatge de cap pàgina ──────── */

/* Onada 8 (261009) · Els logotips de Sóc de Poble són PNG de 256 px d'alt:
   el quadrat de 256x256 i els rectangulars de 985x256 (es pinten fins a
   600 px CSS i han de quedar nítids). Pesen entre tres i deu vegades menys
   que els SVG (ho fixa config/logotips.test.js).
   Pla 261027_1154 (P1-61) · Abans vivien a components/universal/
   UniversalUtils.js, que ara els importa d'ací amb els mateixos valors:
   el selector social els reconeix sense arrossegar React ni el resolutor. */
export const MARQUES = Object.freeze({
  avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  clar: '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png',
  fosc: '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png'
});

/* Onada 8 (261009) · Els logotips d'abans, en SVG, amb la mateixa clau que
   el seu PNG. Els SVG continuen a public/: els porten supabase/seed.sql i
   les files ja desades al servidor. Per això la marca es reconeix en les dues
   formes (esMarcaDeLEntitat, camiDeLaMarca i el logotip de PageFrame): si no,
   una fila amb l'SVG tornaria a pintar la marca com a avatar redó.
   Pla 261027_1154 (P1-61) · Mogut ací des d'UniversalUtils.js, que el
   continua exportant amb el mateix nom. */
export const MARQUES_SVG_ANTIGUES = Object.freeze({
  avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
  clar: '/assets/system/ui/logo-socdepoble-rect-negre.svg',
  fosc: '/assets/system/ui/logo-socdepoble-rect-blanc.svg'
});

/* Onada 3 (P2) · La reserva viu a public/, que és el que viatja al paquet.
   Abans apuntava a /assets/img/, que només servix el servidor de dev (des de
   l'arrel del repo): /fedivers feia 404 a WordPress. Mateix fitxer, mateixa
   mida en bytes.
   Pla 261027_1154 (P1-61) · La portada de reserva de les pàgines de text
   (sections/text/paginaDeText.js, que la importa d'ací): es pinta quan la
   pàgina no en porta cap de pròpia, i per això no és mai la seua imatge
   social. */
export const HERO_PER_DEFECTE = '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png';

/**
 * Pla 261027_1154 (P1-61) · Les imatges que compten com a «cap imatge»: les
 * marques en totes les formes que hi ha a public/assets/system/ui (el PNG, la
 * seua bessona WebP, l'SVG d'abans i el rectangular estàndard, un SVG que la
 * Wiki nomena entre els logotips oficials), el panorama de reserva de les
 * pàgines de text i la targeta base, cadascun amb la seua bessona WebP. Una
 * prova fixa que cada camí existix al disc. Les reserves dels pobles
 * (assetResolver.js · TOWN_FALLBACK_IMAGES) NO hi són: el panorama n'és una,
 * però les altres huit encara esperen decisió del Mestre.
 * Revisió adversarial (261027) · També les icones de l'app de l'arrel de
 * public/ (la marca a la pantalla d'inici i a la pestanya): Firebase les
 * servix, però són el logotip, no la imatge de cap pàgina.
 */
export const IMATGES_DE_RESERVA = Object.freeze([
  MARQUES.avatar,
  '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.webp',
  MARQUES.clar,
  '/assets/system/ui/logo-socdepoble-rect-negre-985x256.webp',
  MARQUES.fosc,
  '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.webp',
  MARQUES_SVG_ANTIGUES.avatar,
  MARQUES_SVG_ANTIGUES.clar,
  MARQUES_SVG_ANTIGUES.fosc,
  '/assets/system/ui/logo-socdepoble-rect.svg',
  HERO_PER_DEFECTE,
  '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.webp',
  CAP_SOCIAL_BASE.image.url,
  '/assets/system/ui/og-socdepoble-1200x630.webp',
  '/icona-app-192.png',
  '/icona-app-512.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
  '/favicon.ico'
]);

/**
 * Pla 261029_0216 (R-01/GM2-01 i R-02) · La variant social de cada original
 * del manifest que un rastrejador no pintaria bé: les imatges de més de
 * 300 KB (R-01), les WebP (WhatsApp no en pinta) i el .png amb bytes JPEG
 * (R-02), en l'ordre del cens del 261029 (de més a menys pes). Camins nets de
 * public/: original → el mateix camí amb el sufix -social-1200x630.jpg (la
 * mateixa carpeta, cap carpeta nova), un JPEG baseline de 1200x630 i
 * ≤300 000 bytes que només va al <head>. Parells literals, no derivats: així
 * el cens de mitjans (tooling/media/cens_imatges.mjs) veu cada variant
 * nomenada al codi. L'original no es toca: el pinten les pàgines (Llei del
 * Píxel). La targeta base (CAP_SOCIAL_BASE) no hi és: la seua commutació va
 * alhora amb index.html, useSEO.js i el productor del manifest, i un .jpg del
 * mateix nom al costat del .png li llevaria la bessona WebP
 * (politicaDeMitjans.js · bessonesDe).
 */
export const VARIANTS_SOCIALS = Object.freeze({
  '/assets/uploads/brain/thermodynamics_ai_hardware_1775882083812.png': '/assets/uploads/brain/thermodynamics_ai_hardware_1775882083812-social-1200x630.jpg',
  '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png': '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221-social-1200x630.jpg',
  '/assets/nano_cards/drets_autor_comic.jpg': '/assets/nano_cards/drets_autor_comic-social-1200x630.jpg',
  '/assets/uploads/brain/forensic_psychiatry_ai_1775882113147.png': '/assets/uploads/brain/forensic_psychiatry_ai_1775882113147-social-1200x630.jpg',
  '/assets/uploads/brain/llibre_anima_cover_1776032370908.png': '/assets/uploads/brain/llibre_anima_cover_1776032370908-social-1200x630.jpg',
  '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png': '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey-social-1200x630.jpg',
  '/assets/uploads/brain/mac_mini_m4_1787721966622.jpg': '/assets/uploads/brain/mac_mini_m4_1787721966622-social-1200x630.jpg',
  '/assets/towns/relleu/1.jpg': '/assets/towns/relleu/1-social-1200x630.jpg',
  '/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp': '/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431-social-1200x630.jpg',
  '/assets/uploads/brain/nano_descarregues_app.webp': '/assets/uploads/brain/nano_descarregues_app-social-1200x630.jpg',
  '/assets/towns/benifallim/1.jpg': '/assets/towns/benifallim/1-social-1200x630.jpg',
  '/assets/towns/penaguila/1.jpg': '/assets/towns/penaguila/1-social-1200x630.jpg',
  '/assets/towns/alcoleja/1.jpg': '/assets/towns/alcoleja/1-social-1200x630.jpg',
  '/assets/towns/xixona/1.jpg': '/assets/towns/xixona/1-social-1200x630.jpg',
  '/assets/uploads/brain/xat_portada.webp': '/assets/uploads/brain/xat_portada-social-1200x630.jpg',
  '/assets/ui/plugins/fedivers_vinyeta.webp': '/assets/ui/plugins/fedivers_vinyeta-social-1200x630.jpg',
  '/assets/uploads/brain/nano_mixa_socis_1774215027069.png': '/assets/uploads/brain/nano_mixa_socis_1774215027069-social-1200x630.jpg',
  /* Revisió final (261029, OG-01) · El cartell de l'Aplec (723x1024) és la foto
     d'una publicació remota de producció: la seua bessona .webp arribava al
     <head>. */
  '/assets/events/aplec_2023_cartell.jpg': '/assets/events/aplec_2023_cartell-social-1200x630.jpg',
  /* OG-02 (pla 261029_1305, Bloc B, M1.1) · Les sis imatges de llavor que no
     feien 1200x630: les dos vinyetes de les pàgines del Cervell i de la Consola
     (480x480) i quatre portades de pobles. Mateixa convenció que la resta:
     retall de cobertura centrat, JPEG baseline, ≤300 000 B, sense APP1. */
  '/assets/ui/plugins/cervell_vinyeta.jpg': '/assets/ui/plugins/cervell_vinyeta-social-1200x630.jpg',
  '/assets/ui/plugins/consola_vinyeta.jpg': '/assets/ui/plugins/consola_vinyeta-social-1200x630.jpg',
  '/assets/towns/la-torre-de-les-macanes/1.jpg': '/assets/towns/la-torre-de-les-macanes/1-social-1200x630.jpg',
  '/assets/towns/orxeta/1.jpg': '/assets/towns/orxeta/1-social-1200x630.jpg',
  '/assets/towns/sella/1.jpg': '/assets/towns/sella/1-social-1200x630.jpg',
  '/assets/towns/tibi/1.jpg': '/assets/towns/tibi/1-social-1200x630.jpg'
});

/* L'esquema d'una referència ('https', 'sdp-media', 'data'…), en minúscules, o
   null si és un camí. Una lletra de disc de Windows ('c:/…') també en dona un,
   i no és cap dels que s'admeten. */
const ESQUEMA = /^([a-z][a-z0-9+.-]*):/i;
const esquemaDe = (text) => {
  const trobat = ESQUEMA.exec(text);
  return trobat ? trobat[1].toLowerCase() : null;
};

/* Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · El context d'una
   comparació: els hosts propis (socdepoble.org i el de l'origen que passa qui
   crida, també un http de dev: només es compara) i la base de Supabase. */
const BASE_INVENTADA = 'http://sdp.invalid';
function hostDe(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.host : null;
  } catch {
    return null;
  }
}
function contextDeComparacio(opcions) {
  const hosts = new Set([hostDe(ORIGEN_SOCIAL_PER_DEFECTE)]);
  const propi = hostDe(opcions?.origen);
  if (propi) hosts.add(propi);
  return { hosts, supabase: baseDeSupabase(opcions?.supabaseUrl) };
}

/* El camí per a comparar: descodificat (un 'pn%67' és el mateix fitxer que
   'png' per a Firebase; si no es pot descodificar, cru) i sense barres
   repetides. Mai s'emet: analitza() continua bloquejant %2e, %2f i %5c. */
function camiPerComparar(cami) {
  let net = cami;
  try {
    net = decodeURIComponent(cami);
  } catch { /* el cru */ }
  return net.replace(/\/{2,}/g, '/');
}

/* La clau d'una referència per a comparar-la (deduplicar, reconéixer una
   reserva o un avatar), sense consulta ni fragment:
     · un camí, o una URL http(s) d'un host propi: el camí, des del primer
       '/assets/' (un recurs ja resolt amb la base de l'amfitrió, com
       '/wp-content/…/assets/…', és el mateix fitxer);
     · una foto del bucket públic, com a 'sdp-media://mitjans/<camí>' o com a
       URL pública del Supabase de qui crida: 'mitjans:<camí>', la mateixa;
     · una URL d'un altre host: l'origen i el camí. Un altre host no és mai
       una reserva ni un avatar propi, encara que el camí acabe igual: queda
       candidata, i analitza() la bloqueja ('origen');
     · una referència d'un altre esquema: sencera.
   Revisió adversarial (261027) · Abans, el camí sol de qualsevol origen: un
   logotip d'un altre host es prenia per reserva i se saltava a la segona. */
function clauDeComparacio(ref, { hosts, supabase }) {
  const text = ref.trim();
  const esquema = esquemaDe(text);
  if (esquema === 'sdp-media') {
    const mitja = /^sdp-media:\/\/mitjans\/(.*)$/i.exec(text);
    if (mitja) return `mitjans:${camiPerComparar(mitja[1].split(/[?#]/)[0])}`;
  }
  if (esquema && esquema !== 'http' && esquema !== 'https') return `${esquema}:${text.slice(esquema.length + 1)}`;
  let url;
  try {
    url = new URL(text, BASE_INVENTADA);
  } catch {
    return text;
  }
  const cami = camiPerComparar(url.pathname);
  if (supabase) {
    const publica = `${supabase}${PREFIX_PUBLIC_DE_MITJANS}`;
    const sencera = `${url.origin}${cami}`;
    if (sencera.startsWith(publica)) return `mitjans:${sencera.slice(publica.length)}`;
  }
  if (url.origin === BASE_INVENTADA || ((url.protocol === 'https:' || url.protocol === 'http:') && hosts.has(url.host))) {
    const assets = cami.indexOf('/assets/');
    return assets > 0 ? cami.slice(assets) : cami;
  }
  return `${url.origin}${cami}`;
}

/* Les reserves són camins nets de public/: la seua clau és el camí mateix. */
const CLAUS_DE_RESERVA = new Set(IMATGES_DE_RESERVA);
const esClauDeReserva = (clau) => CLAUS_DE_RESERVA.has(clau);

/* Llibre Mestre, P1-60 (Fita 24; directiva del Mestre, àudio del 27-10-2026 a
   les 05:08: «Que la pàgina del projecte continga la seua imatge pròpia
   panoràmica de Pedra Seca al SEO (og:image)») · El panorama és reserva quan
   el posa la pintura (paginaDeText.js, a una pàgina sense image) o la
   decoració d'un poble (assetResolver.js). Una pàgina de text que el nomena
   ella mateixa (page.image o el seu cos, com /projecte a PAGE_COPY) l'ha
   triat: per a 'pagina' és imatge pròpia. Els logotips, mai. */
const PANORAMA = new Set([HERO_PER_DEFECTE, '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.webp']);
const esReservaPer = (tipus, clau) => esClauDeReserva(clau) && !(tipus === 'pagina' && PANORAMA.has(clau));

/** Pla 261027_1154 (P1-61) · Cert si `ref` és una reserva (IMATGES_DE_RESERVA),
 *  en qualsevol de les seues formes PRÒPIES: camí, URL absoluta d'un host
 *  propi (socdepoble.org o el d'`opcions.origen`), camí resolt sota una base o
 *  codificat. La mateixa ruta en un altre host no ho és. */
export function esImatgeDeReserva(ref, opcions) {
  return typeof ref === 'string' && ref.trim() !== '' && esClauDeReserva(clauDeComparacio(ref, contextDeComparacio(opcions)));
}

/* ── Les imatges d'un cos (HTML o Markdown) ────────────────────────── */

/* El que es busca, en l'ordre del document: un comentari HTML o una etiqueta
   d'obertura o de tancament, de qualsevol nom. Cada etiqueta es llig sencera
   (srcDeLEtiqueta, amb les seues cometes): una <img> en dona el src, una de
   contingut inert (script, style, template, textarea, noscript) salta fins al
   seu tancament, i qualsevol altra es travessa.
   Revisió adversarial (261027) · Abans només es buscaven '<img' i les inertes:
   un '<img' dins del valor d'un atribut d'una altra etiqueta
   (<a title="<img src=…>">) comptava, i el navegador no el pinta mai.
   Amb Markdown (MARQUES_AMB_MARKDOWN), també una imatge de Markdown ('![') i
   una tanca de codi (``` o ~~~ al començament d'una línia). Totes les
   alternatives comencen per un literal: la cerca és lineal. */
const MARQUES_HTML = /<!--|<(\/?)([a-z][a-z0-9-]*)(?=[\s/>])/gi;
const MARQUES_AMB_MARKDOWN = /<!--|<(\/?)([a-z][a-z0-9-]*)(?=[\s/>])|!\[|^ {0,3}(`{3,}|~{3,})/gim;
const TANCAMENTS_INERTS = Object.freeze({
  script: /<\/script(?=[\s/>])/gi,
  style: /<\/style(?=[\s/>])/gi,
  template: /<\/template(?=[\s/>])/gi,
  textarea: /<\/textarea(?=[\s/>])/gi,
  noscript: /<\/noscript(?=[\s/>])/gi
});
const TANCA_DE_CODI = /^ {0,3}(`{3,}|~{3,})[ \t]*$/gm;

/* Els límits del Markdown, per intent: un text que no casa no fa recórrer
   el document sencer des de cada '!['. Els intents que es poden encavalcar
   queden fitats per la fondària de parèntesis (cada '](' de dins n'obri un)
   i pel títol: el cost és lineal amb una constant menuda. Un destí real no
   passa de dos nivells de parèntesis ni un títol de dos-cents caràcters. */
const MAXIM_ALT = 1024;
const MAXIM_DESTI = 2048;
const MAXIM_TITOL = 256;
const MAXIM_ESPAIS = 64;
const MAXIM_PARENTESIS = 8;

const ENTITATS = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" });
const ENTITAT = /&(#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|amp|lt|gt|quot|apos);/g;

/* Les entitats d'un valor (les cinc amb nom i les numèriques): un
   src="/a.png?x=1&amp;y=2" és '/a.png?x=1&y=2'. Un punt de codi impossible
   dona U+FFFD, com al navegador. */
function decodificaEntitats(text) {
  if (!text.includes('&')) return text;
  return text.replace(ENTITAT, (sencera, nom) => {
    if (nom[0] !== '#') return ENTITATS[nom];
    const codi = nom[1] === 'x' || nom[1] === 'X' ? parseInt(nom.slice(2), 16) : parseInt(nom.slice(1), 10);
    const valid = codi > 0 && codi <= 0x10ffff && (codi < 0xd800 || codi > 0xdfff);
    return valid ? String.fromCodePoint(codi) : '\uFFFD';
  });
}

const esEspaiHtml = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';

/* El src d'una etiqueta <img> que comença a `inici` (just després de '<img'),
   llegida com la llig el navegador: atributs amb valor entre cometes dobles,
   simples o sense cometes, noms sense distingir majúscules, i el PRIMER src
   guanya (un atribut repetit no compta). Un '>' dins d'unes cometes no tanca
   l'etiqueta. Torna { src, fi }: `fi` és la posició just després del '>'; una
   etiqueta sense tancar al final del text no és cap imatge (el navegador la
   descarta) i dona fi = la llargària del text. */
function srcDeLEtiqueta(text, inici) {
  const n = text.length;
  let src = null;
  let i = inici;
  while (i < n) {
    const c = text[i];
    if (c === '>') return { src, fi: i + 1 };
    if (esEspaiHtml(c) || c === '/') {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < n && !esEspaiHtml(text[j]) && text[j] !== '/' && text[j] !== '>' && text[j] !== '=') j += 1;
    const esSrc = j - i === 3 && text.slice(i, j).toLowerCase() === 'src';
    i = j;
    while (i < n && esEspaiHtml(text[i])) i += 1;
    if (text[i] !== '=') continue;
    i += 1;
    while (i < n && esEspaiHtml(text[i])) i += 1;
    let valor;
    if (text[i] === '"' || text[i] === "'") {
      const tancament = text.indexOf(text[i], i + 1);
      if (tancament === -1) return { src: null, fi: n };
      valor = text.slice(i + 1, tancament);
      i = tancament + 1;
    } else {
      let k = i;
      while (k < n && !esEspaiHtml(text[k]) && text[k] !== '>') k += 1;
      valor = text.slice(i, k);
      i = k;
    }
    if (esSrc && src === null) src = decodificaEntitats(valor).trim();
  }
  return { src: null, fi: n };
}

const esPuntuacioAscii = (codi) => (codi >= 0x21 && codi <= 0x2f) || (codi >= 0x3a && codi <= 0x40)
  || (codi >= 0x5b && codi <= 0x60) || (codi >= 0x7b && codi <= 0x7e);

/* Espais i tabuladors i, com a molt, un salt de línia, fins a MAXIM_ESPAIS. */
function saltaEspais(text, k) {
  let p = k;
  const limit = Math.min(text.length, k + MAXIM_ESPAIS);
  let salts = 0;
  while (p < limit) {
    const c = text[p];
    if (c === ' ' || c === '\t') p += 1;
    else if ((c === '\n' || c === '\r') && salts === 0) {
      salts = 1;
      p += c === '\r' && text[p + 1] === '\n' ? 2 : 1;
    } else break;
  }
  return p;
}

/* Lleva les barres d'escapament d'un destí de Markdown ('\)' és ')'). */
const desescapaMarkdown = (text) => (text.includes('\\')
  ? text.replace(/\\([!-/:-@[-`{-~])/g, '$1')
  : text);

/* El destí i el títol d'una imatge de Markdown a partir del '(' que hi ha
   just després del ']' (posició `obert`): ![alt](destí "títol"), amb el destí
   entre angles o nu (parèntesis equilibrats, barres d'escapament) i el títol
   entre cometes dobles, simples o parèntesis. Torna { desti, fi } o null. */
function destiDeMarkdown(text, obert) {
  const n = text.length;
  let k = saltaEspais(text, obert + 1);
  let desti;
  if (text[k] === '<') {
    const limit = Math.min(n, k + 1 + MAXIM_DESTI);
    let p = k + 1;
    while (p < limit && text[p] !== '>' && text[p] !== '<' && text[p] !== '\n' && text[p] !== '\r') {
      p += text[p] === '\\' ? 2 : 1;
    }
    if (p >= limit || text[p] !== '>') return null;
    desti = text.slice(k + 1, p);
    k = p + 1;
  } else {
    const limit = Math.min(n, k + MAXIM_DESTI);
    let p = k;
    let fondaria = 0;
    while (p < limit) {
      const codi = text.charCodeAt(p);
      if (codi <= 0x20 || codi === 0x7f) break;
      if (codi === 0x5c && p + 1 < n && esPuntuacioAscii(text.charCodeAt(p + 1))) {
        p += 2;
        continue;
      }
      if (codi === 0x28) {
        fondaria += 1;
        if (fondaria > MAXIM_PARENTESIS) return null;
      } else if (codi === 0x29) {
        if (fondaria === 0) break;
        fondaria -= 1;
      }
      p += 1;
    }
    if (p >= limit && p < n) return null;
    if (fondaria !== 0) return null;
    desti = text.slice(k, p);
    k = p;
  }
  const abansDelTitol = k;
  k = saltaEspais(text, k);
  const obertura = text[k];
  if ((obertura === '"' || obertura === "'" || obertura === '(') && k > abansDelTitol) {
    const tanca = obertura === '(' ? ')' : obertura;
    const limit = Math.min(n, k + 1 + MAXIM_TITOL);
    let p = k + 1;
    while (p < limit && text[p] !== tanca) p += text[p] === '\\' ? 2 : 1;
    if (p >= limit) return null;
    k = saltaEspais(text, p + 1);
  }
  if (text[k] !== ')') return null;
  return { desti: decodificaEntitats(desescapaMarkdown(desti)).trim(), fi: k + 1 };
}

/**
 * Pla 261027_1154 (P1-61) · Les imatges d'un cos en l'ordre del document:
 * cada src d'una <img> (cometes dobles, simples o cap, en qualsevol caixa;
 * entitats descodificades). No hi compten les de dins d'un comentari HTML,
 * d'un contingut inert (script, style, template, textarea, noscript) ni del
 * valor d'un atribut d'una altra etiqueta: ningú no les veu. Un src buit no és
 * cap imatge.
 * Revisió adversarial (261027) · El Markdown, només amb
 * `{ markdown: true }`: cada destí d'una imatge ![alt](url "títol"),
 * barrejat amb les <img> en l'ordre en què apareixen, i res de dins d'un bloc
 * de codi (``` o ~~~). Cap superfície de les d'ara (renderRichText,
 * CosDeLaPagina) no el pinta: hi queda com a text, i un '![x](/a.jpg)' no és
 * cap imatge que es veja.
 *
 * Mai torna el text sencer com si fora una URL (a diferència de
 * detailHelpers.jsx · getFirstImage). Recorregut lineal, sense expressions
 * que facen marxa arrere: cada etiqueta es llig una vegada, cada intent de
 * Markdown està fitat (alt, destí, títol, espais i parèntesis) i el resultat
 * d'un ']' ja llegit es reaprofita. Com a molt `maxim` imatges (32 per
 * defecte); un text que no és cadena, [].
 * Límits coneguts del Markdown: un ']' dins de l'alt i els trossos de codi en
 * línia (`…`) no es reconeixen.
 */
export function srcsDeLesImg(text, maxim = 32, { markdown = false } = {}) {
  const eixida = [];
  if (typeof text !== 'string' || text === '') return eixida;
  const limit = Number.isFinite(maxim) ? Math.max(0, Math.floor(maxim)) : 32;
  if (limit === 0) return eixida;
  const marques = markdown === true ? MARQUES_AMB_MARKDOWN : MARQUES_HTML;
  const cerca = new RegExp(marques.source, marques.flags);
  /* El ']' següent ja trobat (-1: cap encara; Infinity: no n'hi ha cap més)
     i el destí ja llegit després d'un ']': un '![' que hi arriba igual no el
     torna a llegir. */
  let claudator = -1;
  let memoria = { claudator: -1, resultat: null };
  let trobat;
  while (eixida.length < limit && (trobat = cerca.exec(text)) !== null) {
    const inici = trobat.index;
    const marca = trobat[0];
    if (marca === '<!--') {
      const fi = text.indexOf('-->', inici + 4);
      if (fi === -1) break;
      cerca.lastIndex = fi + 3;
    } else if (marca === '![') {
      if (claudator !== Infinity && claudator < inici + 2) {
        const seguent = text.indexOf(']', inici + 2);
        claudator = seguent === -1 ? Infinity : seguent;
      }
      if (claudator === Infinity || claudator - (inici + 2) > MAXIM_ALT || text[claudator + 1] !== '(') continue;
      if (memoria.claudator !== claudator) memoria = { claudator, resultat: destiDeMarkdown(text, claudator + 1) };
      const { resultat } = memoria;
      if (!resultat) continue;
      if (resultat.desti) eixida.push(resultat.desti);
      cerca.lastIndex = resultat.fi;
    } else if (trobat[3]) {
      /* Una tanca de codi: el bloc acaba en una línia amb la mateixa tanca
         (el mateix caràcter, almenys tan llarga) o al final del text. */
      const tanca = trobat[3];
      const finalDeLinia = text.indexOf('\n', inici);
      if (finalDeLinia === -1) break;
      TANCA_DE_CODI.lastIndex = finalDeLinia + 1;
      let tancament;
      while ((tancament = TANCA_DE_CODI.exec(text)) !== null) {
        if (tancament[1][0] === tanca[0] && tancament[1].length >= tanca.length) break;
      }
      if (!tancament) break;
      cerca.lastIndex = tancament.index + tancament[0].length;
    } else {
      /* Una etiqueta: es llig fins al seu '>' (cap '<img' de dins de les
         seues cometes no compta). Sense tancar al final del text, el
         navegador la descarta i s'acaba. */
      const etiqueta = trobat[2].toLowerCase();
      const obertura = trobat[1] === '';
      const { src, fi } = srcDeLEtiqueta(text, inici + marca.length);
      if (fi >= text.length && text[fi - 1] !== '>') break;
      if (obertura && etiqueta === 'img' && src) eixida.push(src);
      const inert = obertura ? TANCAMENTS_INERTS[etiqueta] : undefined;
      if (inert) {
        inert.lastIndex = fi;
        const final = inert.exec(text);
        if (!final) break;
        cerca.lastIndex = final.index + final[0].length;
      } else {
        cerca.lastIndex = fi;
      }
    }
  }
  return eixida;
}

/* Els esquemes que fan d'un text una referència (una URL o una referència
   del port), encara que no es puga servir: un 'data:' o un 'javascript:' és
   una imatge que hi és, i la tria la bloqueja. Un «Nota: …» no n'és cap.
   Revisió adversarial (261027) · Qualsevol altre esquema sense espais
   ('ipfs://…', 'content://…', 'ws://…') també és una referència: abans es
   descartava i la tria passava a la SEGONA foto, mentre la portada
   (getFirstImage) el pintava primer. Ara arriba a analitza(), que la
   bloqueja ('esquema'). */
const ESQUEMES_DE_REFERENCIA = new Set(['http', 'https', 'sdp-media', 'data', 'blob', 'file', 'ftp', 'javascript', 'vbscript', 'capacitor']);
/* Un nom de fitxer d'imatge relatiu, sense espais ('foto.jpg', 'assets/x.png').
   Revisió adversarial (261027) · Només es prova sobre un text sense espais:
   amb un espai, el sufix [?#]\S* tornava a recórrer el text des de cada
   '.png?' i el cost era quadràtic (188 KB, 3 s al fil principal). Sense
   espais, \S* arriba sempre al final i la prova és lineal. */
const FITXER_D_IMATGE = /^[^\s<>"'`]+\.(?:avif|bmp|gif|ico|jpe?g|png|svgz?|webp)(?:[?#]\S*)?$/i;
const TE_ESPAIS = /\s/;

function semblaReferencia(text) {
  if (text.startsWith('/') || text.startsWith('./') || text.startsWith('../')) return true;
  const esquema = esquemaDe(text);
  if (esquema) return ESQUEMES_DE_REFERENCIA.has(esquema) || !TE_ESPAIS.test(text);
  return !TE_ESPAIS.test(text) && FITXER_D_IMATGE.test(text);
}

/**
 * Pla 261027_1154 (P1-61) · La primera referència d'un camp d'imatge: d'una
 * llista, el primer element que en dona una; d'un text amb <img>, el seu src
 * (srcsDeLesImg, com llig getFirstImage un HTML); d'un camí ('/…', './…'),
 * una URL o una referència del port ('sdp-media://…'), ell mateix, retallat.
 * Prosa que no és cap camí ni cap URL, null (detailHelpers.jsx ·
 * getFirstImage la tornaria sencera com si fora una URL). Qualsevol altra
 * cosa (un objecte, un número), null.
 * Revisió adversarial (261027) · Un camp amb una imatge de Markdown ja no en
 * dona el destí: la portada no el llig com a Markdown, i la persona no veu
 * cap imatge.
 */
export function primerValor(valor) {
  return primerDe(valor, 0);
}

/* Una llista dins d'una llista es llig fins a quatre nivells: les dades no
   en porten més, i una llista que es conté a si mateixa no penja. */
const MAXIM_NIVELLS = 4;

function primerDe(valor, nivell) {
  if (Array.isArray(valor)) {
    if (nivell >= MAXIM_NIVELLS) return null;
    for (const element of valor) {
      const primer = typeof element === 'string' || Array.isArray(element) ? primerDe(element, nivell + 1) : null;
      if (primer) return primer;
    }
    return null;
  }
  if (typeof valor !== 'string') return null;
  const text = valor.trim();
  if (text === '') return null;
  const [delCos] = srcsDeLesImg(text, 1);
  if (delCos) return delCos;
  return semblaReferencia(text) ? text : null;
}

/* ── Les candidates d'una pàgina ───────────────────────────────────── */

/** Pla 261027_1154 (P1-61) · Els tipus de pàgina que coneix el selector.
 *  'notes' hi és per a dir-ho: una nota és privada i no té mai imatge social.
 *  OG-6 · Cap 'wiki' encara: els documents de la Wiki continuen genèrics. */
export const TIPUS_DE_PAGINA = Object.freeze(['mercat', 'mur', 'events', 'pobles', 'pagina', 'notes']);

const llistaDe = (valor) => (Array.isArray(valor) ? valor.map(primerValor) : []);

/* Si un element de la galeria «hi és», amb el criteri d'imatgesDeProducte
   (detailHelpers.jsx · getFirstImage): un text no buit, encara que només
   porte espais, o una llista el primer element de la qual hi és. Una galeria
   on algun element hi és no cau a image_url, encara que cap no done una
   imatge: la portada tampoc no hi cau, i la persona no veu cap foto. */
function hiEs(valor, nivell = 0) {
  if (Array.isArray(valor)) return nivell < MAXIM_NIVELLS && valor.length > 0 && hiEs(valor[0], nivell + 1);
  return typeof valor === 'string' && valor !== '';
}

/* Els avatars i logotips de qui signa, ven o organitza: mai no són la imatge
   d'una publicació, en cap tipus (Pedra Seca §11; ordre del Mestre, 261007,
   per a la Samarreta). `avatarUrl` és la forma que llig també
   detail/elementDeSeccio.js per a la barra taronja. */
const avatarsDe = (item, context) => [item.avatar_url, item.author_avatar, item.author?.avatar, item.logo_image, item.avatarUrl]
  .filter((valor) => typeof valor === 'string' && valor.trim() !== '')
  .map((valor) => clauDeComparacio(valor, context));

/* Les candidates crues de cada tipus, en l'ordre en què les veu una persona
   (abans de llevar reserves, avatars i repetides). Revisió adversarial
   (261027) · Només els camps que pinta el detall (detailSectionMeta.jsx):
   ni el Mur ni els Pobles no pinten images[] (no tenen getImages, ni
   carrusel), i el cos del Mercat és item.description, no content. */
function candidatesDe(tipus, item) {
  switch (tipus) {
    case 'mercat': {
      /* Exactament l'ordre de mercat/imatgesDeProducte.js (la portada i el
         carrusel del detall): primer `images`; només si cap element no hi és
         (hiEs), image_url, image i imageSrc. Després, les del cos que es pinta
         (renderBody del Mercat: item.description). */
      const galeriaPresent = Array.isArray(item.images) && item.images.some((element) => hiEs(element));
      const galeria = galeriaPresent ? llistaDe(item.images) : [item.image_url, item.image, item.imageSrc].map(primerValor);
      return [...galeria, ...srcsDeLesImg(item.description)];
    }
    case 'mur': {
      /* La portada del detall (detailSectionMeta.jsx · getImage del Mur):
         imageSrc si n'hi ha, i si no, image_url o image. Després, les del cos
         (content, o summary). */
      const portada = item.imageSrc ? primerValor(item.imageSrc) : primerValor(item.image_url || item.image);
      return [portada, ...srcsDeLesImg(item.content || item.summary)];
    }
    case 'events':
      return [primerValor(item.image_url), ...srcsDeLesImg(item.description || item.content)];
    case 'pobles':
      /* La portada del poble (getImage: image_url). El cos no porta fotos. */
      return [primerValor(item.image_url)];
    case 'pagina':
      /* sections/text/paginaDeText.js · propsDePaginaDeText: page.image, i el
         cos (page.html). Sense image, la portada és HERO_PER_DEFECTE, que
         posa la pintura: no hi entra. Si la pàgina el nomena ella mateixa,
         sí (esReservaPer, P1-60). */
      return [primerValor(item.image), ...srcsDeLesImg(item.html)];
    default:
      /* 'notes' (privades: /notes no es compartix mai) i qualsevol tipus que
         no es coneix. */
      return [];
  }
}

/* Llibre Mestre, P1-61 (directiva del Mestre, àudio del 27-10-2026 a les
   12:08; esmena de Gemini 0920 §8.1) · La imatge que l'autor tria per a
   xarxes (el selector d'autor de la Fase 2): `item.og_image ||
   item.featured_image`, per davant de la primera de la galeria quan hi és.
   Avui cap dada no la porta, i la portada que es pinta no la llig mai (Llei
   del Píxel): sense eixos camps, l'ordre i la paritat amb imatgesDeProducte
   són els de sempre. Si la triada no es pot servir, la pàgina queda
   'bloquejada', com qualsevol primera: mai es passa a la galeria. */
const triadaPerLAutor = (item) => primerValor(item.og_image) || primerValor(item.featured_image);

/**
 * Pla 261027_1154 (P1-61) · Les imatges d'una pàgina en l'ORDRE en què les
 * veu una persona, crues (sense resoldre) i sense repetides (per camí, com
 * imatgesDeProducte). Mai una reserva (esImatgeDeReserva) ni l'avatar o el
 * logotip de qui la signa (avatar_url, author_avatar, author.avatar,
 * logo_image, avatarUrl de l'element), en cap tipus. Els cossos es lligen com
 * HTML (srcsDeLesImg sense Markdown).
 * En tots els tipus menys 'notes', la primera és la que ha triat l'autor
 * (og_image, o si no, featured_image), quan n'hi ha; després, les de cada
 * tipus:
 *   · 'mercat': images[]; només si cap element no hi és (ni un text, com a
 *     imatgesDeProducte), image_url, image, imageSrc;
 *     després, les del cos (description).
 *   · 'mur': imageSrc, o si no n'hi ha, image_url o image; després, les del
 *     cos (content, o summary).
 *   · 'events': image_url; després, les del cos (description, o content).
 *   · 'pobles': image_url.
 *   · 'pagina' (PAGE_COPY o una pàgina del contingut core): image; després,
 *     les del cos (html).
 *   · 'notes', un tipus desconegut o un element que no és objecte: [].
 * `opcions` (les d'urlSocialDe, opcionals) diuen quins hosts són propis i
 * quin és el Supabase: només es comparen amb el mateix fitxer d'eixos hosts.
 */
export function imatgesDeLaPagina(tipus, item, opcions) {
  if (!item || typeof item !== 'object' || !TIPUS_DE_PAGINA.includes(tipus)) return [];
  const context = contextDeComparacio(opcions);
  const exclosos = new Set(avatarsDe(item, context));
  const vistes = new Set();
  const imatges = [];
  const candidates = tipus === 'notes' ? [] : [triadaPerLAutor(item), ...candidatesDe(tipus, item)];
  for (const candidata of candidates) {
    if (typeof candidata !== 'string' || candidata.trim() === '') continue;
    const clau = clauDeComparacio(candidata, context);
    if (exclosos.has(clau) || vistes.has(clau) || esReservaPer(tipus, clau)) continue;
    vistes.add(clau);
    imatges.push(candidata);
  }
  return imatges;
}

/* ── La URL que pot baixar un rastrejador ──────────────────────────── */

/**
 * Pla 261027_1154 (P1-61) · Per què una primera imatge queda 'bloquejada'
 * (el `motiu` de primeraImatgeSocial). La fase del servidor els durà a la
 * porta del release.
 */
export const MOTIUS_DE_BLOQUEIG = Object.freeze({
  'no-analitzable': 'No és cap camí propi ni cap URL absoluta (un camí relatiu, un text).',
  cami: 'El camí no és net: «..», «%2e», barra inversa, caràcters de control o invisibles.',
  esquema: 'No és https: data:, blob:, http:, javascript: o un altre esquema.',
  credencials: 'La URL porta usuari o contrasenya.',
  privat: 'Mitjà privat o temporal: mitjans_privats, una URL signada, autenticada o transformada, un token.',
  svg: 'És un SVG: les xarxes no el pinten.',
  'sense-supabase': 'Una foto del bucket públic sense l’URL de Supabase per a fer-la absoluta.',
  'no-servit': 'No és cap fitxer d’imatge de contingut: un camí propi fora de /assets/ (una ruta de l’SPA, on Firebase torna la shell, o un fitxer de l’arrel com les icones) o una carpeta (acaba en «/»).',
  origen: 'Un altre origen, que no és a la llista de permesos.',
  llargaria: 'La referència passa de 2.048 caràcters, el límit del selector.'
});

/* sections/../utils/mitjaOpac.js · fotoDelBucketPublic, la mateixa regla
   escrita ací en literal (fulla sense imports; una prova en fixa la
   paritat): segments de lletres, xifres, '_', '-' i '.', que no comencen
   per punt, sense '%', barres inverses, espais ni caràcters de control. */
const FOTO_DEL_BUCKET_PUBLIC = /^sdp-media:\/\/mitjans\/((?:[a-z0-9_-][a-z0-9._-]*\/)*[a-z0-9_-][a-z0-9._-]*)$/i;
const CAMI_DEL_BUCKET_PUBLIC = /^(?:[a-z0-9_-][a-z0-9._-]*\/)*[a-z0-9_-][a-z0-9._-]*$/i;
const PREFIX_PUBLIC_DE_MITJANS = '/storage/v1/object/public/mitjans/';

/* Caràcters que una referència d'imatge no porta mai: control (Cc),
   invisibles i bidi (Cf), barra inversa (el navegador la llig com a barra),
   cometes dobles, angles i accent greu. */
const CARACTER_PROHIBIT = /[\p{Cc}\p{Cf}\\"<>`]/u;
const CODI_DE_CAMI = /%2e|%2f|%5c/i;
const MITJA_PRIVAT = /mitjans_privats|\/object\/sign\/|\/object\/authenticated\/|\/render\/image\//i;
const ES_SVG = /\.svgz?$/i;
/* Revisió adversarial (261027) · Cap referència de més de 2.048 caràcters:
   cap foto real no en porta tants, i el límit fita el cost de cada expressió
   de davall (abans, 5 MB eren acceptats i tornats com a og:image). */
const MAXIM_REFERENCIA = 2048;

/* Les claus d'una consulta signada o temporal (Supabase, S3, GCS,
   CloudFront). Revisió adversarial (261027) · Es miren les claus
   descodificades i en minúscules, separades per '&' o ';': abans,
   '?%74oken=…' o '?a=1;token=…' passaven. */
const CLAUS_SIGNADES = new Set(['token', 'signature', 'sig', 'expires', 'policy', 'key-pair-id', 'googleaccessid',
  'x-amz-signature', 'x-amz-credential', 'x-amz-security-token', 'x-goog-signature', 'x-goog-credential']);
function esConsultaSignada(search) {
  if (typeof search !== 'string' || search.length < 2) return false;
  return search.slice(1).split(/[&;]/).some((parell) => {
    const nom = parell.split('=')[0].replace(/\+/g, ' ');
    let clau = nom;
    try {
      clau = decodeURIComponent(nom);
    } catch { /* la crua */ }
    return CLAUS_SIGNADES.has(clau.trim().toLowerCase());
  });
}

/* Un segment '.' o '..' al camí cru (abans que l'analitzador d'URL el
   resolga i l'amague). */
const segmentsDeRetorn = (text) => {
  const tall = text.search(/[?#]/);
  return (tall === -1 ? text : text.slice(0, tall)).split('/').some((segment) => segment === '.' || segment === '..');
};

/* L'origen https d'una opció ('https://socdepoble.org/' → 'https://socdepoble.org'),
   o null si no ho és: un http (el servidor de dev), credencials o un camí. */
function origenHttps(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'https:' && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}

/* La base https de Supabase (origen i camí, sense barra final ni consulta), o null. */
function baseDeSupabase(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  try {
    const url = new URL(valor.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

/* Els permesos explícits: parells { origen, prefix } amb un origen https i un
   prefix de camí que comença per '/', sempre acabat en '/' (així '/imatges'
   no deixa passar '/imatgesx/'). Els que no ho són, fora.
   Revisió adversarial (261027) · Tampoc el prefix '/' ni un amb '.' o '..':
   eixe parell era un origen sencer, i la regla diu que mai no n'hi ha cap. */
function permesosNets(permesos) {
  if (!Array.isArray(permesos)) return [];
  return permesos.flatMap((permes) => {
    const origen = origenHttps(permes?.origen);
    const cru = typeof permes?.prefix === 'string' ? permes.prefix.trim() : '';
    if (!origen || !cru.startsWith('/') || cru.startsWith('//')) return [];
    const prefix = cru.endsWith('/') ? cru : `${cru}/`;
    if (prefix === '/' || segmentsDeRetorn(prefix)) return [];
    return [{ origen, prefix }];
  });
}

/* Pla 261029_0216 (R-01) · La URL d'un original propi d'/assets/ que va al
   <head>: la seua variant social, si en té (es mira el camí descodificat i
   sense barres repetides, que és el fitxer que servix Firebase), o la mateixa.
   La consulta de l'original (un ?v=) no viatja a la variant: és un altre
   fitxer. */
function ambVariantSocial(url, cami) {
  const net = cami.replace(/\/{2,}/g, '/');
  /* Revisió final (261029, OG-01) · Una publicació remota nomena la bessona
     .webp de l'original (la política de mitjans): la variant és la de
     l'original del mateix nom. WhatsApp no pinta WebP. */
  const variant = VARIANTS_SOCIALS[net]
    ?? (/\.webp$/i.test(net) ? ['.png', '.jpg', '.jpeg'].map((ext) => VARIANTS_SOCIALS[net.replace(/\.webp$/i, ext)]).find(Boolean) : undefined);
  return variant ? new URL(variant, url.origin).href : url.href;
}

/* { url } o { motiu }: la regla d'urlSocialDe, amb el perquè. */
function analitza(ref, { origen, supabaseUrl, permesos } = {}) {
  if (typeof ref !== 'string' || ref.trim() === '') return { motiu: 'no-analitzable' };
  const text = ref.trim();
  if (text.length > MAXIM_REFERENCIA) return { motiu: 'llargaria' };
  if (CARACTER_PROHIBIT.test(text) || CODI_DE_CAMI.test(text) || segmentsDeRetorn(text)) return { motiu: 'cami' };
  if (MITJA_PRIVAT.test(text)) return { motiu: 'privat' };
  const propi = origen === undefined || origen === null || origen === '' ? ORIGEN_SOCIAL_PER_DEFECTE : origenHttps(origen);
  const supabase = baseDeSupabase(supabaseUrl);
  const esquema = esquemaDe(text);
  if (esquema === 'sdp-media') {
    const foto = FOTO_DEL_BUCKET_PUBLIC.exec(text);
    if (!foto) return { motiu: /^sdp-media:\/\/mitjans\//i.test(text) ? 'cami' : 'privat' };
    if (ES_SVG.test(foto[1])) return { motiu: 'svg' };
    return supabase ? { url: `${supabase}${PREFIX_PUBLIC_DE_MITJANS}${foto[1]}` } : { motiu: 'sense-supabase' };
  }
  if (esquema && esquema !== 'https') return { motiu: 'esquema' };
  if (!esquema && !text.startsWith('/')) return { motiu: 'no-analitzable' };
  if (!esquema && !propi) return { motiu: 'origen' };
  let url;
  try {
    url = esquema ? new URL(text) : new URL(text, propi);
  } catch {
    return { motiu: 'no-analitzable' };
  }
  if (url.protocol !== 'https:') return { motiu: 'esquema' };
  if (url.username || url.password) return { motiu: 'credencials' };
  let cami;
  try {
    cami = decodeURIComponent(url.pathname);
  } catch {
    return { motiu: 'cami' };
  }
  if (CARACTER_PROHIBIT.test(cami) || CODI_DE_CAMI.test(cami) || segmentsDeRetorn(cami)) return { motiu: 'cami' };
  if (MITJA_PRIVAT.test(cami) || esConsultaSignada(url.search)) return { motiu: 'privat' };
  if (ES_SVG.test(url.pathname) || ES_SVG.test(cami)) return { motiu: 'svg' };
  /* Revisió adversarial (261027) · Una carpeta ('/assets/', '/assets/x.svg/')
     no és cap imatge. */
  if (url.pathname.endsWith('/')) return { motiu: 'no-servit' };
  url.hash = '';
  if (propi && url.origin === propi && url.pathname.startsWith('/assets/')) return { url: ambVariantSocial(url, cami) };
  if (supabase) {
    const prefix = `${supabase}${PREFIX_PUBLIC_DE_MITJANS}`;
    const sencera = `${url.origin}${url.pathname}`;
    if (sencera.startsWith(prefix) && CAMI_DEL_BUCKET_PUBLIC.test(sencera.slice(prefix.length))) return { url: url.href };
  }
  if (permesosNets(permesos).some((permes) => url.origin === permes.origen && url.pathname.startsWith(permes.prefix))) {
    return { url: url.href };
  }
  if (propi && url.origin === propi) return { motiu: 'no-servit' };
  if (supabase && url.origin === new URL(supabase).origin) return { motiu: 'privat' };
  return { motiu: 'origen' };
}

/**
 * Pla 261027_1154 (P1-61) · L'URL https absoluta d'una referència d'imatge que
 * un rastrejador (WhatsApp, Telegram, Facebook, X) pot baixar sense sessió,
 * o null. `opcions`:
 *   · origen: l'origen públic (https; per defecte ORIGEN_SOCIAL_PER_DEFECTE).
 *     Un origen que no és https (el servidor de dev) no en fa absolut cap.
 *   · supabaseUrl: la base https del projecte de Supabase; sense, una foto del
 *     bucket públic no es pot fer absoluta.
 *   · permesos: [{ origen, prefix }], parells explícits d'origen https i
 *     prefix de camí (mai un origen sencer).
 * S'admet:
 *   · '/assets/…' → origen + camí. Les imatges de contingut viuen a
 *     /assets/. Firebase servix qualsevol fitxer que existix (també les
 *     icones de l'arrel, que són reserves), però un camí propi fora
 *     d'/assets/ sol ser una ruta de l'SPA, que torna la shell: 'no-servit';
 *   · una URL https del mateix origen dins d'/assets/;
 *   · 'sdp-media://mitjans/<camí>' (la regla de mitjaOpac.js) →
 *     `${supabaseUrl}/storage/v1/object/public/mitjans/<camí>`;
 *   · una URL que ja és d'eixe prefix públic, amb un camí net;
 *   · una URL d'un parell de `permesos`.
 * Es rebutja (abans que cap permés): '..', '%2e', '%2f', '%5c', barres
 * inverses, caràcters de control o invisibles; .svg i .svgz (també
 * codificats); data:, blob:, http: i qualsevol esquema que no siga https;
 * credencials; mitjans_privats, /object/sign/, /object/authenticated/,
 * /render/image/ i una consulta signada (token=, signature=…, també
 * codificades o separades per ';'); una carpeta (acaba en '/'); més de 2.048
 * caràcters; qualsevol altre origen. No canvia mai a una bessona WebP; l'única
 * derivada és la variant social de VARIANTS_SOCIALS (R-01), que substituïx un
 * original propi d'/assets/ i no n'arrossega la consulta. Per a la resta, el
 * fragment se'n lleva; la consulta, no.
 */
export function urlSocialDe(ref, opcions) {
  return analitza(ref, opcions || {}).url ?? null;
}

/**
 * Pla 261027_1154 (P1-61) · La imatge social d'una pàgina, amb l'estat:
 *   · { estat: 'triada', ref, url, posicio: 0 }: la primera candidata
 *     d'imatgesDeLaPagina es pot servir; `url` és la d'urlSocialDe (la variant
 *     social, si l'original en té; `ref` és sempre l'original).
 *   · { estat: 'bloquejada', ref, motiu }: la primera candidata hi és però
 *     no es pot servir (motiu, una clau de MOTIUS_DE_BLOQUEIG). MAI es passa
 *     a la segona ni al logotip: el client hi posa la targeta genèrica i el
 *     servidor en farà una porta roja.
 *   · { estat: 'absent' }: la pàgina no té cap imatge pròpia; només ací val
 *     CAP_SOCIAL_BASE.image.
 * `opcions` són les d'urlSocialDe. `posicio` és sempre 0, la primera
 * candidata: pot ser la que ha triat l'autor (og_image o featured_image), que
 * no ha d'estar a la galeria. El registre del build encara no ho distingix;
 * el port del servidor de la Fase 2 en pot afegir l'origen.
 */
export function primeraImatgeSocial(tipus, item, opcions) {
  const [ref] = imatgesDeLaPagina(tipus, item, opcions || {});
  if (ref === undefined) return { estat: 'absent' };
  const { url, motiu } = analitza(ref, opcions || {});
  return url ? { estat: 'triada', ref, url, posicio: 0 } : { estat: 'bloquejada', ref, motiu };
}
