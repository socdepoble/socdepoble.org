/**
 * formaDelGrup.js — Les regles pures de les targetes incrustades al cos del
 * text (T7, ordre del Mestre, prompt 261004_0515). Sense TipTap ni React:
 * l'editor (targetesIncrustades.js), el NodeView i la lectura (CosAmbTargetes)
 * llegixen d'ací el mateix contracte.
 *
 * REGLES DEL MESTRE
 *   · 1 targeta: alineada a l'esquerra o a la dreta, 360px (forma «sola»).
 *   · 2 targetes seguides: centrades (forma «parella»).
 *   · 3 o més: graella, la mateixa fórmula de .sdp-card-grid (forma «graella»).
 *   La targeta es tracta com una imatge: un bloc autònom dins del text.
 *
 * DECISIONS PER DEFECTE (pendents de confirmar pel Mestre)
 *   · Referència i instantània: cada targeta desa la clau «tipus:id», la ruta
 *     i una instantània mínima (títol, subtítol, entradilla, imatge, autor,
 *     poble i la ruta de l'autor). La lectura funciona sense permisos ni cap
 *     consulta; la instantània no seguix els canvis de l'original.
 *   · Només tipus públics: publicacions, actes, productes, pobles i pàgines.
 *     Mai una nota privada, una conversa ni un perfil de persona.
 *   · Una imatge només entra si el sanejador la deixaria pintar (el mateix
 *     origen, el de mitjans admès o data:image) i mai un mitjà privat: la
 *     promoció de publishNote (regex sobre l'HTML sencer) el faria públic.
 *     Revisió del front (261004): es pinta, a l'editor i a la lectura, amb el
 *     filtre privat de les apps (fontSegura) i sense referent, com un <img>
 *     del cos que pinta el sanejador (imatgePrivada d'UniversalCard).
 *
 * REGLA D'OR 1 DEL MESTRE (261004) · La boina porta sempre l'autor real
 *   enllaçat a la seua pàgina, també a l'editor. Sense autor a la
 *   instantània (un poble, una pàgina, una publicació del sistema), signa
 *   l'entitat Sóc de Poble i porta al projecte (DEFAULT_AUTHOR, el mateix
 *   del Mur i d'EventCard). Un nom sense la seua pàgina no s'endevina.
 *   Revisió del front (261004): la ruta del projecte sense nom també signa
 *   Sóc de Poble; la ruta d'una altra persona sense el seu nom no s'insereix
 *   (teAutoriaCompleta), perquè la boina eixiria buida.
 *
 * Tot atribut es neteja ací: sanitizeHtml(getHTML()) ha de ser getHTML(),
 * o l'efecte de sincronia de useUniversalRichText faria setContent i el
 * cursor saltaria. Per això el text de la instantània no porta < ni >: el
 * sanejador esborra sencer un atribut amb «-->», «]>», «/>» o «</style».
 */
import { esRutaInterna } from '../../../../../config/objecteConnectable.js';
import { esFontImatgeSegura } from '../../../../../utils/sanitize.js';
import { DEFAULT_AUTHOR } from '../../../UniversalUtils.js';

/* Els noms dels dos nodes de TipTap: el grup (contenidor) i la targeta (àtom). */
export const NOM_GRUP = 'sdpTargetes';
export const NOM_TARGETA = 'sdpTargeta';

/* Els tipus d'objecte que es poden incrustar (llista tancada d'origenNota.js). */
export const TIPUS_INCRUSTABLES = Object.freeze(['publicacio', 'esdeveniment', 'producte', 'poble', 'pagina']);

/* El tipus de la cerca (indexCerca.js) → el tipus d'objecte. La resta
   (persones, entitats, notes, converses, multimèdia) no s'incrusta. */
const TIPUS_DE_CERCA = Object.freeze({
  publicacions: 'publicacio', agenda: 'esdeveniment', mercat: 'producte', pobles: 'poble', pagines: 'pagina'
});

/* La secció de cada tipus, per al descriptor de Connectar (objecteConnectable.js). */
const SECCIO_DE_TIPUS = Object.freeze({
  publicacio: 'mur', producte: 'mercat', esdeveniment: 'events', poble: 'pobles', pagina: ''
});

export const ALINEACIONS = Object.freeze(['esquerra', 'dreta']);
export const ALINEACIO_PER_DEFECTE = 'esquerra';

/* La marca del grup a l'HTML desat: la lectura només hidrata si hi és. */
export const MARCA_GRUP = 'data-sdp-targetes';
export const MARCA_TARGETA = 'data-sdp-targeta';
/* La classe del cos que porta targetes (l'arrel de l'editor i l'article de
   lectura): conté la flotant de la «sola», que si no se n'eixiria per baix. */
export const CLASSE_AMB_TARGETES = 'sdp-amb-targetes';

/* Sostres de la instantània. La ruta, el de esRutaInterna. */
const MAXIM = Object.freeze({ id: 100, titol: 200, subtitol: 200, entradilla: 400, autor: 120, poble: 120 });

/** La forma del grup pel nombre de targetes: 'sola', 'parella', 'graella' o null. */
export function formaDe(nombre) {
  const n = Number(nombre);
  if (!Number.isInteger(n) || n < 1) return null;
  if (n === 1) return 'sola';
  if (n === 2) return 'parella';
  return 'graella';
}

export const alineacioValida = (valor) => (ALINEACIONS.includes(valor) ? valor : ALINEACIO_PER_DEFECTE);

/* Text pla d'una línia per a un atribut: sense control, espais plegats i
   sense < ni > (vegeu la capçalera), retallat al sostre. */
function textNet(valor, maxim) {
  if (valor == null || typeof valor === 'object') return '';
  return String(valor)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/</g, '‹')
    .replace(/>/g, '›')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxim)
    .trim();
}

/** La clau «tipus:id» d'un tipus incrustable, o '' si no ho és. */
export function clauDe(tipus, id) {
  if (!TIPUS_INCRUSTABLES.includes(tipus)) return '';
  const net = textNet(id, MAXIM.id);
  if (!net || /[\s"]/.test(net)) return '';
  return `${tipus}:${net}`;
}

/** { tipus, id } d'una clau, partint pel PRIMER «:» (com XatSection), o null. */
export function llegeixClau(clau) {
  if (typeof clau !== 'string') return null;
  const tall = clau.indexOf(':');
  if (tall <= 0) return null;
  const tipus = clau.slice(0, tall);
  const id = clau.slice(tall + 1);
  return clauDe(tipus, id) === clau ? { tipus, id } : null;
}

/* Una ruta de l'app que el sanejador no tocarà (ni cometes ni angles). */
const rutaNeta = (ruta) => (esRutaInterna(ruta) && !/[<>"]/.test(ruta) ? ruta : '');

/* Una imatge que el sanejador pintaria (el mateix origen, data:image o un
   origen de mitjans admès, que sí que pot ser de tercers i es demana sense
   referent; vegeu la capçalera) i que no és cap mitjà privat. Cap altre
   origen. */
function imatgeNeta(src) {
  const net = typeof src === 'string' ? src.trim() : '';
  if (!net || /[<>"\s]/.test(net)) return '';
  if (/^sdp-media:\/\/mitjans_privats\//i.test(net)) return '';
  return esFontImatgeSegura(net) ? net : '';
}

/**
 * Els atributs nets d'una targeta. Sense clau vàlida, la clau és '' (el
 * normalitzador de l'editor i la lectura la descarten).
 */
export function netejaAtributs(attrs = {}) {
  const clau = llegeixClau(attrs?.clau) ? attrs.clau : '';
  return {
    clau,
    ruta: rutaNeta(attrs?.ruta),
    titol: textNet(attrs?.titol, MAXIM.titol),
    subtitol: textNet(attrs?.subtitol, MAXIM.subtitol),
    entradilla: textNet(attrs?.entradilla, MAXIM.entradilla),
    imatge: imatgeNeta(attrs?.imatge),
    autor: textNet(attrs?.autor, MAXIM.autor),
    autorRuta: rutaNeta(attrs?.autorRuta),
    poble: textNet(attrs?.poble, MAXIM.poble)
  };
}

export const esTargetaValida = (attrs) => Boolean(attrs && llegeixClau(attrs.clau));

/**
 * Regla d'or 1 · Revisió del front «editor» (261004) · Cap boina buida. Una
 * instantània té l'autoria completa si porta el nom de l'autor, si no porta
 * cap ruta d'autor (signa Sóc de Poble) o si la ruta és la del projecte
 * (també signa Sóc de Poble). La ruta d'una altra persona o entitat sense el
 * seu nom no s'endevina: eixa instantània no s'insereix. Es mira sobre els
 * atributs nets: una ruta que la neteja descarta no compta.
 */
export function teAutoriaCompleta(attrs) {
  const net = netejaAtributs(attrs);
  return Boolean(net.autor) || !net.autorRuta || net.autorRuta === DEFAULT_AUTHOR.href;
}

/**
 * D'una entrada de la cerca (indexCerca.js, més autor, poble, subtítol i
 * ruta de l'autor si l'adaptador els porta) als atributs del node. null si
 * no es pot incrustar: privada, d'un tipus no públic, sense clau, sense
 * títol o amb una boina que eixiria buida (teAutoriaCompleta).
 */
export function attrsDeEntrada(entrada) {
  if (!entrada || typeof entrada !== 'object' || entrada.privada) return null;
  const tipus = TIPUS_DE_CERCA[entrada.tipus] || (TIPUS_INCRUSTABLES.includes(entrada.tipus) ? entrada.tipus : null);
  const clau = tipus ? clauDe(tipus, entrada.id) : '';
  if (!clau) return null;
  const attrs = netejaAtributs({
    clau,
    ruta: entrada.href,
    titol: entrada.titol,
    subtitol: entrada.subtitol,
    entradilla: entrada.extracte,
    imatge: entrada.imatge?.src,
    autor: entrada.autor,
    autorRuta: entrada.autorRuta,
    poble: entrada.poble
  });
  return attrs.titol && teAutoriaCompleta(attrs) ? attrs : null;
}

/** El descriptor de Connectar i Comentar d'una targeta (objecteConnectable.js). */
export function objecteDeTargeta(attrs) {
  const clau = llegeixClau(attrs?.clau);
  if (!clau) return null;
  return {
    tipus: clau.tipus,
    id: clau.id,
    titol: attrs.titol || '',
    seccio: SECCIO_DE_TIPUS[clau.tipus] || '',
    ruta: rutaNeta(attrs.ruta),
    autor: null
  };
}

/* Regla d'or 1 (vegeu la capçalera) · Qui signa la boina i on porta: l'autor
   de la instantània amb la seua pàgina; sense pàgina, el nom sense enllaç;
   sense ningú, o amb la ruta del projecte i sense nom, l'entitat Sóc de
   Poble i el projecte. La ruta d'una altra persona sense el seu nom ja no
   s'insereix (teAutoriaCompleta); si arriba d'un HTML anterior o enganxat,
   no s'endevina qui és ni se signa per ell: es queda com estava. */
function autoriaDe(net) {
  if (net.autor) return { author: net.autor, authorHref: net.autorRuta || undefined };
  if (!net.autorRuta || net.autorRuta === DEFAULT_AUTHOR.href) {
    return { author: DEFAULT_AUTHOR.name, authorHref: DEFAULT_AUTHOR.href };
  }
  return { author: undefined, authorHref: net.autorRuta };
}

/**
 * Les props d'UniversalCard d'una targeta incrustada.
 *  · 'edicio': previsualització. Sense mainHref (un Link de tota la targeta
 *    dins del contenteditable navegaria) i cada acció del peu passa per
 *    `avisa`, com la targeta viva. La boina sí que porta l'enllaç de
 *    l'autor (regla d'or 1): el NodeView en para el clic i avisa.
 *  · 'lectura': la targeta del Mur. mainHref és la ruta, l'objecte tipat
 *    porta Connectar i Comentar, i l'autor enllaça a la seua pàgina.
 * La imatge i l'avatar arriben crus: qui pinta resol els sdp-media://, i
 * UniversalCard els filtra amb fontSegura i els demana sense referent.
 */
export function propsDeTargetaIncrustada(attrs, { mode = 'lectura', avisa = null } = {}) {
  const net = netejaAtributs(attrs);
  const base = {
    title: net.titol,
    subtitle: net.subtitol || undefined,
    body: net.entradilla || undefined,
    imageUrl: net.imatge || undefined,
    imageAlt: '',
    imatgePrivada: true,
    ...autoriaDe(net),
    location: net.poble || undefined,
    hasFooter: true,
    showTranslate: true,
    showComment: true,
    showShare: true,
    showConnect: true
  };
  if (mode === 'edicio') {
    return {
      ...base,
      showPin: false,
      telemetria: { mode: 'previsualitzacio' },
      onConnect: avisa,
      onTranslate: avisa,
      onComment: avisa,
      onShare: avisa,
      onDateTime: avisa
    };
  }
  return {
    ...base,
    mainHref: net.ruta || undefined,
    objecte: objecteDeTargeta(net) || undefined
  };
}

/* El text d'un node de text, escapat per a tornar a ser HTML. */
const escapa = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Els atributs d'una targeta llegits del DOM (data-*). */
function attrsDelDom(element) {
  return netejaAtributs({
    clau: element.getAttribute(MARCA_TARGETA),
    ruta: element.getAttribute('data-ruta'),
    titol: element.getAttribute('data-titol'),
    subtitol: element.getAttribute('data-subtitol'),
    entradilla: element.getAttribute('data-entradilla'),
    imatge: element.getAttribute('data-imatge'),
    autor: element.getAttribute('data-autor'),
    autorRuta: element.getAttribute('data-autor-ruta'),
    poble: element.getAttribute('data-poble')
  });
}

/**
 * La lectura hidratada: l'HTML JA SANEJAT partit en trossos d'HTML i grups
 * de targetes, en l'ordre del document. Només els grups de primer nivell
 * s'hidraten; un grup dins d'una llista o d'una cita es queda com a HTML
 * (l'enllaç de reserva). Un grup sense cap targeta vàlida desapareix, com a
 * l'editor. DOMParser és inert: res no s'executa ni es carrega.
 *   [{ tipus: 'html', html } | { tipus: 'targetes', forma, alineacio, targetes: [attrs] }]
 */
export function segmentsAmbTargetes(htmlSanejat) {
  const html = String(htmlSanejat || '');
  if (!html.includes(MARCA_GRUP) || typeof DOMParser === 'undefined') return [{ tipus: 'html', html }];
  const cos = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, 'text/html').body;
  const segments = [];
  let tros = [];
  const tancaTros = () => {
    if (tros.length) segments.push({ tipus: 'html', html: tros.join('') });
    tros = [];
  };
  for (const node of Array.from(cos.childNodes)) {
    if (node.nodeType === 1 && node.hasAttribute(MARCA_GRUP)) {
      const targetes = Array.from(node.children)
        .filter((fill) => fill.hasAttribute(MARCA_TARGETA))
        .map(attrsDelDom)
        .filter(esTargetaValida);
      if (!targetes.length) continue;
      tancaTros();
      segments.push({
        tipus: 'targetes',
        forma: formaDe(targetes.length),
        alineacio: alineacioValida(node.getAttribute('data-alineacio')),
        targetes
      });
    } else if (node.nodeType === 1) {
      tros.push(node.outerHTML);
    } else if (node.nodeType === 3) {
      tros.push(escapa(node.textContent));
    }
  }
  tancaTros();
  return segments;
}
