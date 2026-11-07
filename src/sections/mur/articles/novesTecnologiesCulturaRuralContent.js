/* IDEA-116 + IDEA-119 (Onada R9, carril C2; ordre del Mestre del 261106) ·
   «Noves tecnologies aplicades a la cultura rural: desmuntant en 3D el Pou de
   Neu del Rentonar», la primera publicació del Mur.

   Instantània editorial pura (sense imports). R9V-C2-01 · NO va al tros
   `pobles-aplec` (que l'arrencada precarrega) ni a l'entrada: només la
   importen mòduls de trossos diferits (la llavor, data/sectionContent.js; la
   capa de dades, content.js; l'article; /notes; la targeta de /page/fediversity).
   El document sencer és HTML editable des de /notes (P0-25: revisió editorial,
   publicacioEditable.js · CANONICS); el reproductor i la veu de la IAIA els
   posa l'article (NovesTecnologiesCulturaRuralArticle.jsx), en diferit.

   Honestedat (R7G-15.10, G10-05): cada xifra i cada fet ix de la taula de
   fets del carril (fonts del disc citades una a una): l'article de Josep Mª
   Segura Martí (socdepoble.net, WP 3656), les entrades d'El Rentonar (WP 3653
   i 16761, rentonar.blogspot.com) i el plànol de Gràfics de Poble
   (76150.jpg). El pou és de propietat privada i d'accés lliure (WP 3653): no
   s'hi nomena cap particular. Cap fotografia: l'esquema el dibuixa el codi.
   Les URL del blog són les del camp `link rel=alternate` del volcat Blogger.

   Data: el 06-11-2026 a les 14:29 (CET), quan naix este fitxer (stat: naixement
   14:29:18; R9V-C2-06), és a dir, quan s'escriu la publicació (ordre del Mestre
   del 261106, 14:06). Encara no hi ha cap commit que la publique: pendent del
   Mestre confirmar-la o canviar-la per la del desplegament (D-C2-1). */

export const NOVES_TECNOLOGIES_CULTURA_RURAL_ID = 'noves-tecnologies-aplicades-a-la-cultura-rural';

/** El documental (només este vídeo és d'Eugenio Monesma): id i títol del
 *  visor d'anatomia (anatomiaRural.js, estructura POU). */
export const NOVES_TECNOLOGIES_VIDEO = Object.freeze({
  id: '3RQv3xjVr-M',
  titol: 'Los EMPOZADORES y las NEVERAS naturales de HIELO. Conservación ancestral de la NIEVE para el verano'
});

const FORA = 'target="_blank" rel="noopener noreferrer"';
const enllac = (href, text) => `<a href="${href}" ${FORA}><strong>${text}</strong></a>`;

/** Les fonts publicades, en ordre de data (data, títol, URL).
 *  G1-N01 (Gauntlet de l'arbre R9) · «les jornades de neteja … (2021 i 2023)»: cada any porta la seua entrada.
 *  La de 2021 és la del volcat Blogger d'El Rentonar (21-06-2021, camp link rel=alternate), com les altres del blog. */
export const NOVES_TECNOLOGIES_FONTS = Object.freeze([
  ['17-04-2020', 'El Pou de la neu del Rentonar', 'https://socdepoble.net/2020/04/17/el-pou-de-la-neu-del-rentonar/'],
  ['30-10-2020', 'La fissura del sostre del pou de neu', 'https://socdepoble.net/2020/10/30/la-fissura-del-sostre-del-pou-de-neu/'],
  ['21-06-2021', 'Jornada de neteja del camí de pujada al Pou de neu', 'https://rentonar.blogspot.com/2021/06/jornada-de-neteja-del-cami-de-pujada-al.html'],
  ['25-12-2021', 'El Pou de Neu del Rentonar front a l’Administració', 'https://socdepoble.net/2021/12/25/el-pou-de-neu-del-rentonar-front-a-ladministracio/'],
  ['28-08-2023', 'Pou de Neu del Rentonar: Esperant amb candeleta', 'https://rentonar.blogspot.com/2023/08/pou-de-neu-del-rentonar-esperant-amb.html'],
  ['22-10-2023', 'Dues jornades de neteja de l’entorn del Pou de Neu', 'https://rentonar.blogspot.com/2023/10/dues-jornades-de-neteja-de-lentorn-del.html'],
  ['26-04-2025', 'Excursió al Pou de Neu del Rentonar amb Anna Garcia Barrachina', 'https://rentonar.blogspot.com/2025/04/excursio-al-pou-de-neu-del-rentonar-amb.html']
].map((fila) => Object.freeze(fila)));

export const NOVES_TECNOLOGIES_CULTURA_RURAL_HTML = [
  '<h3>Per què un pou de neu en 3D</h3>',
  '<p>Les <strong>noves tecnologies</strong> també servixen per a entendre el <strong>patrimoni rural</strong>. Damunt d’este text, un <strong>esquema isomètric</strong> generat amb codi desmunta el <strong>Pou de Neu del Rentonar</strong>, a <strong>La Torre de les Maçanes</strong>: cap fotografia, i cada xifra amb la seua <strong>font</strong>. Quan dues fonts <strong>no coincidixen</strong>, ho diem.</p>',
  '<p><strong>Nota sobre les imatges i els models:</strong> no vos espanteu si veieu il·lustracions o esquemes <strong>experimentals</strong>; encara no pretenem que siguen exactes al mil·límetre, sinó que estem <strong>provant maneres de fer</strong> les coses dins de <strong>Sóc de Poble</strong>.</p>',
  '<h3>Què diu l’estudi</h3>',
  '<blockquote><p>«autèntics magatzems de neu amb què abastir els pobles durant l’estiu»</p></blockquote>',
  `<p>Així definix els pous de neu <strong>Josep Mª Segura Martí</strong>, del Museu Arqueològic Municipal d’Alcoi, a l’article que ${enllac('https://socdepoble.net/2020/04/17/el-pou-de-la-neu-del-rentonar/', 'Sóc de Poble conserva')}, amb les dades del seu treball a la revista <em>Eines</em> (<strong>1987</strong>). El pou està a <strong>1.160 m</strong>, té un <strong>túnel</strong> d’accés al sud i una <strong>galeria de desguàs</strong> de <strong>29 m</strong>, i els documents en parlen de <strong>1724</strong> a <strong>1880</strong>.</p>`,
  '<h3>El pou hui</h3>',
  `<p>El pou <strong>no és de titularitat pública</strong>, però és de <strong>lliure accés</strong>. L’<strong>Associació El Rentonar</strong> n’ha documentat la ${enllac('https://socdepoble.net/2020/10/30/la-fissura-del-sostre-del-pou-de-neu/', 'fissura del sostre')} (2020), les ${enllac('https://socdepoble.net/2021/12/25/el-pou-de-neu-del-rentonar-front-a-ladministracio/', 'gestions davant l’Administració')} per l’error d’inscripció com a bé de rellevància local (2020-2022) i les <strong>jornades de neteja</strong> del camí i de l’entorn (2021 i 2023). Segons el blog de l’associació, el <strong>26 d’agost de 2023</strong> l’error encara <strong>no s’havia corregit</strong>.</p>`,
  '<h3>El documental</h3>',
  `<div data-sdp-youtube="${NOVES_TECNOLOGIES_VIDEO.id}" data-titol="${NOVES_TECNOLOGIES_VIDEO.titol}"><a href="https://www.youtube.com/watch?v=${NOVES_TECNOLOGIES_VIDEO.id}" ${FORA}>${NOVES_TECNOLOGIES_VIDEO.titol}</a></div>`,
  '<p>Documental d’<strong>Eugenio Monesma</strong>, amb el títol original en castellà: tracta de l’ofici dels <strong>empouadors</strong> i de les <strong>neveres naturals</strong>. Les dades del Rentonar són les de les <strong>fonts</strong> d’esta publicació, i només este vídeo és seu.</p>',
  '<h3>Les fonts</h3>',
  '<ul>',
  ...NOVES_TECNOLOGIES_FONTS.map(([data, titol, url]) => `<li><strong>${data}</strong> · ${enllac(url, titol)}</li>`),
  '<li><strong>Plànol</strong> · «Pozo de nieve “EL RENTONAR”», de l’arxiu <strong>Gràfics de Poble</strong>: 18 m d’alçada (15 + 3), 9,75 m d’amplària a la cota i 10 m a la llegenda, galeria de 29 m (24 + 5) i entrada de 43 cm.</li>',
  '</ul>',
  '<p>Les <strong>nou estructures</strong> de l’enginyeria rural, amb el mateix visor, són a l’<a href="/page/anatomia-rural"><strong>Anatomia rural</strong></a>.</p>'
].join('\n');

/** La primera publicació del Mur. Signa l'entitat Sóc de Poble (com el
 *  Manifest); la data de prova del Mur (datesDeProvaMur.js) la posa dalt de
 *  tot en mode seed, i en remot mana la seua data real. */
export const NOVES_TECNOLOGIES_CULTURA_RURAL_POST = {
  id: NOVES_TECNOLOGIES_CULTURA_RURAL_ID,
  slug: NOVES_TECNOLOGIES_CULTURA_RURAL_ID,
  type: 'post',
  title: 'Noves tecnologies aplicades a la cultura rural: desmuntant en 3D el Pou de Neu del Rentonar',
  post_subtitle: 'Un esquema generat amb codi, capa a capa, amb la font de cada xifra',
  description: 'El Pou de Neu del Rentonar, a La Torre de les Maçanes, explicat pas a pas',
  entradilla: 'Desmuntem el Pou de Neu del Rentonar peça a peça: la cúpula, les finestres, els estreps, el pou, el túnel i la galeria de desguàs. Un esquema generat amb codi, sense cap fotografia, on cada xifra porta la seua font i on es diu quan les fonts no coincidixen.',
  image_url: '/assets/uploads/patrimoni/anatomia-rural-pou-neu-ibanez.webp',
  image_alt: "Il·lustració didàctica de còmic d'estil Ibáñez del Pou de la Neu del Rentonar, l'almàssera i el forn de calç a La Torre de les Maçanes",
  content: NOVES_TECNOLOGIES_CULTURA_RURAL_HTML,
  /* Sense publish_date (la data triada al calendari, que manaria sobre la de
     prova del Mur en mode seed): la data és la de creació. */
  created_at: '2026-11-06T14:29:00+01:00',
  important: true,
  author_entity_id: 'socdepoble',
  author: 'Sóc de Poble',
  author_name: 'Sóc de Poble',
  author_avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  author_location: 'La Torre de les Maçanes',
  town: 'La Torre de les Maçanes',
  town_name: 'La Torre de les Maçanes',
  poble_id: 'la-torre-de-les-macanes',
  tags: ['Patrimoni', 'Pou de neu', 'Noves tecnologies'],
  copyright: 'Text i esquema: Sóc de Poble · Dades: les fonts citades a la publicació'
};
