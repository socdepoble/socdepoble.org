/**
 * policiaDisseny.js — Sentinella 4 · Policia del Disseny.
 *
 * Les lleis de Pedra Seca (.agents/skills/sdp-pedra-seca) i de l'App Grid
 * Shell (.agents/skills/sdp-app-grid-shell) com a regles que es poden
 * comprovar sobre el text de JSX, JS, HTML i CSS que se li passa:
 *   roja   estil en línia (style= d'una etiqueta JSX o HTML; no l'XML d'una
 *          plantilla ni una variable), :has() (fora del Baseline 2022), color
 *          cru (hex, rgb, hsl) fora d'un bloc de tokens (:root, :host,
 *          .sdp-root), token primitiu en un component i control per davall
 *          de --sdp-touch (sense els seus pseudoelements ni els càlculs);
 *   groga  espai fora de l'escala de 0.25rem, h1 o h2 amb punt final, ombra
 *          sense token --sdp-ombra-*, radi sense token --sdp-radi-* i més
 *          d'una closca AppGridShell en un fitxer.
 * Al pre-commit, policiaDisseny.porta.test.js la fa servir de porta real
 * sobre src/apps i src/utils: cap roja. Pur: el text arriba com a argument.
 */
import { avis, contingutDe, esObjecte, fitxersTriats, nomDe, textDe } from './comu.js';
import { FONTS_COMUNES, definixSentinella } from './contracte.js';

const LLINDARS = Object.freeze({ tactilPx: 44, maxAvisos: 300 });
const ES_CSS = /\.css$/i;
const ES_JS = /\.(?:jsx?|mjs|cjs|tsx?)$/i;
const ES_HTML = /\.html?$/i;
const COLOR_HEX = /#[0-9a-fA-F]{3,8}\b/g;
const COLOR_FUNCIO = /\b(?:rgba?|hsla?)\(/g;
const PRIMITIU = /var\(\s*--sdp-(?:pedra|primary|secondary|error|avis|exit|info)-\d+\b/g;
const ESTIL_EN_LINIA = /\sstyle\s*=\s*[{"']/g;
const HAS = /:has\(/g;
const TITOL_AMB_PUNT = /<h([12])\b[^>{]*>([^<{]*?)\.\s*<\/h\1>/g;
const CLOSCA = /<AppGridShell\b/g;
const CONTROLS = /^(?:button|a|summary|select|textarea|input|label)(?:$|[.:[])|\[role=["']?button|\.sdp-boto\b|\.sdp-control\b/;
/* Un pseudoelement (::after, i la forma antiga :before/:after/:first-line/:first-letter) no és el control. */
const PSEUDOELEMENT = /::|:(?:before|after|first-line|first-letter)(?![\w-])/i;
/* Les funcions on una longitud és un terme d'un càlcul, no la mida del control. */
const FUNCIO_DE_CALCUL = /\b(?:calc|min|max|clamp)\(/gi;
/* El subjecte d'un bloc de definició de tokens: ací els colors crus són la font de veritat. */
const SUBJECTE_DE_TOKENS = /^(?::root|:host|\.sdp-root)(?![\w-])/;

const liniaDe = (text, index) => text.slice(0, index).split('\n').length;

/* Els comentaris es tornen espais: les línies i les posicions no es mouen. */
function senseComentaris(text, js) {
  const blanc = (m) => m.replace(/[^\n]/g, ' ');
  let net = text.replace(/\/\*[\s\S]*?\*\//g, blanc);
  if (js) net = net.replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, abans) => abans + blanc(m.slice(abans.length)));
  return net;
}

/* El text de les plantilles (`…`) es torna espais; les expressions ${…} i les cometes es queden.
   Un XML o un HTML escrit en una plantilla és una cadena, no JSX. */
function sensePlantilles(codi) {
  const eixida = codi.split('');
  const pila = [];
  for (let i = 0; i < eixida.length; i += 1) {
    const c = eixida[i];
    const dalt = pila[pila.length - 1];
    if (dalt === undefined || typeof dalt === 'number') {
      if (c === '`') pila.push('plantilla');
      else if (c === '{' && dalt !== undefined) pila[pila.length - 1] += 1;
      else if (c === '}' && dalt !== undefined) {
        if (dalt === 0) pila.pop();
        else pila[pila.length - 1] -= 1;
      }
    } else if (c === '\\') {
      eixida[i] = ' ';
      if (i + 1 < eixida.length && eixida[i + 1] !== '\n') eixida[i + 1] = ' ';
      i += 1;
    } else if (c === '`') {
      pila.pop();
    } else if (c === '$' && eixida[i + 1] === '{') {
      pila.push(0);
      i += 1;
    } else if (c !== '\n') {
      eixida[i] = ' ';
    }
  }
  return eixida.join('');
}

/* Si la posició és dins d'una etiqueta d'obertura JSX: de dret a revés, sense eixir de les claus,
   saltant els valors entre cometes, fins a un «<» seguit d'una lletra que no ve d'una cadena.
   Un «>», un «;», un accent greu o una clau sense parella (bloc o objecte) diuen que no ho és. */
function dinsEtiquetaJsx(codi, index) {
  let claus = 0;
  for (let i = index - 1; i >= 0; i -= 1) {
    const c = codi[i];
    if (c === '}') claus += 1;
    else if (c === '{') {
      if (claus === 0) return false;
      claus -= 1;
    } else if (claus > 0) continue;
    else if (c === '"' || c === "'") {
      i = codi.lastIndexOf(c, i - 1);
      if (i < 0) return false;
    } else if (c === '>' || c === ';' || c === '`') return false;
    else if (c === '<' && /[A-Za-z]/.test(codi[i + 1] ?? '')) {
      const abans = codi.slice(0, i).trimEnd().slice(-1);
      return !['"', "'", '`'].includes(abans);
    }
  }
  return false;
}

/* Un valor CSS sense les funcions de càlcul (calc, min, max, clamp), amb els parèntesis niats. */
function senseCalculs(valor) {
  let net = valor;
  FUNCIO_DE_CALCUL.lastIndex = 0;
  for (let m = FUNCIO_DE_CALCUL.exec(net); m; m = FUNCIO_DE_CALCUL.exec(net)) {
    let nivell = 1;
    let fi = m.index + m[0].length;
    for (; fi < net.length && nivell > 0; fi += 1) {
      if (net[fi] === '(') nivell += 1;
      else if (net[fi] === ')') nivell -= 1;
    }
    net = `${net.slice(0, m.index)} ${net.slice(fi)}`;
    FUNCIO_DE_CALCUL.lastIndex = 0;
  }
  return net;
}

/* Les parts d'un selector separades per comes, i el subjecte (l'últim compost) de cada una,
   sense tallar dins de parèntesis, claudàtors ni cometes. */
function talls(selector, separador) {
  const parts = [];
  let nivell = 0;
  let cometa = null;
  let actual = '';
  for (const c of selector) {
    if (cometa) {
      if (c === cometa) cometa = null;
    } else if (c === '"' || c === "'") cometa = c;
    else if (c === '(' || c === '[') nivell += 1;
    else if (c === ')' || c === ']') nivell -= 1;
    else if (nivell === 0 && separador.test(c)) {
      parts.push(actual);
      actual = '';
      continue;
    }
    actual += c;
  }
  parts.push(actual);
  return parts.map((p) => p.trim()).filter(Boolean);
}
const subjecteDe = (part) => talls(part, /[\s>+~]/).pop() ?? '';

/* Un bloc és de tokens si el subjecte de cada part del selector és :root, :host o .sdp-root
   (amb qualificadors: [data-theme], :not(), :host(...)). Un @media de tema no ho és per ell
   mateix: només n'ho són els blocs de dins que ho complixen. */
function esSelectorDeTokens(selector) {
  const parts = talls(selector, /,/);
  return parts.length > 0 && parts.every((part) => SUBJECTE_DE_TOKENS.test(subjecteDe(part)));
}

/* Rangs [inici, fi) dels blocs CSS de definició de tokens. */
function rangsDeTokens(css) {
  const rangs = [];
  const pila = [];
  let tros = 0;
  for (let i = 0; i < css.length; i += 1) {
    const c = css[i];
    if (c === '{') {
      const selector = css.slice(tros, i).trim();
      const dinsDeTokens = pila.some((b) => b.tokens);
      pila.push({ inici: i, tokens: dinsDeTokens || (!selector.startsWith('@') && esSelectorDeTokens(selector)) });
      tros = i + 1;
    } else if (c === '}') {
      const bloc = pila.pop();
      if (bloc?.tokens && !pila.some((b) => b.tokens)) rangs.push([bloc.inici, i + 1]);
      tros = i + 1;
    } else if (c === ';') {
      tros = i + 1;
    }
  }
  return rangs;
}

/* Les regles CSS planes: { selector, cos, inici } (el cos sense blocs fills). */
function reglesCss(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), cos: m[2], inici: m.index + m[1].length + 1 }));
}

function longitudFora(valor) {
  const fora = [];
  for (const [, xifra, unitat] of valor.matchAll(/(-?\d*\.?\d+)(rem|em|px)\b/g)) {
    const n = Math.abs(Number(xifra));
    if (n === 0) continue;
    const bo = unitat === 'px' ? n % 4 === 0 : Number.isInteger(Math.round(n * 4 * 1000) / 1000);
    if (!bo) fora.push(`${xifra}${unitat}`);
  }
  return fora;
}

const pxDe = (xifra, unitat) => (unitat === 'px' ? Number(xifra) : Number(xifra) * 16);

/**
 * Revisa un fitxer i en torna els avisos (cap si no és CSS, JS ni HTML).
 * @param {string} ruta
 * @param {string} text
 * @returns {Array<{ codi: string, severitat: string, missatge: string, font: string }>}
 */
export function revisaFitxer(ruta, text) {
  const css = ES_CSS.test(ruta);
  const js = ES_JS.test(ruta);
  const html = ES_HTML.test(ruta);
  if (!css && !js && !html) return [];
  const avisos = [];
  const net = senseComentaris(String(text ?? ''), js);
  const on = (index) => `${ruta}:${liniaDe(net, index)}`;
  const tokens = css ? rangsDeTokens(net) : [];
  const dinsTokens = (index) => /(?:^|\/)tokens\.css$/i.test(ruta) || tokens.some(([a, b]) => index >= a && index < b);
  const troba = (patro, fes) => {
    for (const m of net.matchAll(patro)) fes(m);
  };

  if (js || html) {
    /* A l'HTML tot style= és un atribut; al JS només compta dins d'una etiqueta JSX, fora de les plantilles. */
    const codi = js ? sensePlantilles(net) : net;
    for (const m of codi.matchAll(ESTIL_EN_LINIA)) {
      if (js && !dinsEtiquetaJsx(codi, m.index)) continue;
      avisos.push(avis('PS-ESTIL-EN-LINIA', 'roja', 'Estil en línia (style=): Pedra Seca només admet classes del sistema.', on(m.index)));
    }
    troba(TITOL_AMB_PUNT, (m) => avisos.push(avis('PS-TITOL-PUNT', 'groga', `L’h${m[1]} acaba amb punt final: els títols h1 i h2 no en porten.`, on(m.index))));
    const closques = [...net.matchAll(CLOSCA)];
    if (closques.length > 1) avisos.push(avis('PS-CLOSCA-DOBLE', 'groga', `${closques.length} closques AppGridShell en un fitxer: n’hi ha d’haver una per pàgina (ids fixos).`, on(closques[1].index)));
  }
  /* El nom del selector es compon: escrit sencer, la mateixa policia el trobaria en este fitxer. */
  troba(HAS, (m) => avisos.push(avis('PS-HAS', 'roja', `${':has'}() és fora del Baseline 2022 (Chrome 100 i Firefox 100 no el tenen): controla-ho amb classes.`, on(m.index))));
  troba(COLOR_HEX, (m) => {
    if (net[m.index - 1] === '&' || dinsTokens(m.index)) return;
    avisos.push(avis('PS-COLOR-CRU', 'roja', `Color cru ${m[0]}: usa un token semàntic --sdp-*.`, on(m.index)));
  });
  troba(COLOR_FUNCIO, (m) => {
    if (dinsTokens(m.index)) return;
    avisos.push(avis('PS-COLOR-CRU', 'roja', `Color cru ${m[0]}…): usa un token semàntic --sdp-*.`, on(m.index)));
  });
  troba(PRIMITIU, (m) => {
    if (dinsTokens(m.index)) return;
    avisos.push(avis('PS-PRIMITIU', 'roja', `Token primitiu (${m[0].slice(4).trim()}) en un component: usa el semàntic (--sdp-fons-*, --sdp-text-*, --sdp-accio...).`, on(m.index)));
  });

  if (css) {
    for (const regla of reglesCss(net)) {
      if (dinsTokens(regla.inici) || regla.selector.startsWith('@')) continue;
      const declaracions = [...regla.cos.matchAll(/([a-z-]+)\s*:\s*([^;]+)/g)];
      const subjectes = talls(regla.selector, /,/).map(subjecteDe);
      const esControl = subjectes.some((s) => CONTROLS.test(s) && !PSEUDOELEMENT.test(s));
      for (const [tota, propietat, valor] of declaracions) {
        const index = regla.inici + regla.cos.indexOf(tota);
        if (/^(?:margin|padding)(?:-|$)|^(?:row-|column-)?gap$/.test(propietat)) {
          const fora = longitudFora(valor);
          if (fora.length) avisos.push(avis('PS-ESPAI', 'groga', `${propietat}: ${fora.join(', ')} fora de l’escala de 0.25rem (usa --sdp-space-*).`, on(index)));
        }
        if (esControl && /^(?:min-)?(?:height|width)$/.test(propietat)) {
          for (const [, xifra, unitat] of senseCalculs(valor).matchAll(/(\d*\.?\d+)(px|rem)\b/g)) {
            if (pxDe(xifra, unitat) < LLINDARS.tactilPx) {
              avisos.push(avis('PS-TACTIL', 'roja', `${regla.selector.slice(0, 60)}: ${propietat} ${xifra}${unitat} per davall de --sdp-touch (${LLINDARS.tactilPx}px).`, on(index)));
            }
          }
        }
        if (propietat === 'box-shadow' && !/^\s*(?:none|inherit|initial|unset)\s*$/.test(valor)
          && valor.replace(/var\(\s*--sdp-ombra-[\w-]+\s*\)/g, '').replace(/[\s,]/g, '') !== '') {
          avisos.push(avis('PS-OMBRA', 'groga', 'Ombra sense token: Pedra Seca no admet ombres decoratives (només --sdp-ombra-*).', on(index)));
        }
        if (/^border(?:-[a-z]+)*-radius$/.test(propietat) && /\d*\.?\d+(?:px|rem|em)\b/.test(valor.replace(/var\([^)]*\)/g, '').replace(/\b0(?:px|rem|em)?\b/g, ''))) {
          avisos.push(avis('PS-RADI', 'groga', `${propietat} amb un valor literal: usa l’escala --sdp-radi-s a --sdp-radi-xl.`, on(index)));
        }
      }
    }
  }
  return avisos;
}

/**
 * @param {{ fitxers: Array<{ ruta: string, text: string }> }} entrada
 */
export function observaPolicia(entrada) {
  const fitxers = (esObjecte(entrada) && Array.isArray(entrada.fitxers) ? entrada.fitxers : []).filter(esObjecte);
  const tots = fitxers.flatMap((f) => revisaFitxer(String(f.ruta ?? ''), f.text));
  const avisos = tots.slice(0, LLINDARS.maxAvisos);
  if (tots.length > avisos.length) {
    avisos.push(avis('PS-MASSA-AVISOS', 'info', `I ${tots.length - avisos.length} avisos més: revisa primer estos.`, 'entrada'));
  }
  const revisats = fitxers.filter((f) => ES_CSS.test(f.ruta) || ES_JS.test(f.ruta) || ES_HTML.test(f.ruta)).length;
  const compte = (s) => tots.filter((a) => a.severitat === s).length;
  const informe = [
    `${revisats} fitxers revisats amb les lleis de Pedra Seca i de l’App Grid Shell.`,
    `Roges: ${compte('roja')} (fallen abans del commit). Grogues: ${compte('groga')}.`,
    'La policia no corregix res: cada canvi visible necessita l’ordre del Mestre (Llei del Píxel).'
  ];
  return { avisos, informe: informe.join('\n') };
}

const preparaPolicia = (fitxers) => ({
  fitxers: fitxersTriats(fitxers).map((f) => ({ ruta: nomDe(f), text: textDe(contingutDe(f)) }))
});

export const SENTINELLA_POLICIA = definixSentinella({
  id: 'sentinella.policia-disseny',
  nom: 'Sentinella Policia del Disseny',
  versio: '1.0.0',
  descripcio: 'Revisa el JSX, el JS i el CSS que li passes amb les lleis de Pedra Seca i de l’App Grid Shell: estils en línia, el selector has, colors crus, tokens primitius, espais, objectius tàctils, títols, ombres i radis.',
  disparador: [
    { tipus: 'pre-commit', detall: 'policiaDisseny.porta.test.js sobre src/apps i src/utils, al costat de design_guard: cap roja abans del commit.' },
    { tipus: 'manual', detall: 'Des del panell de Sentinelles, amb els fitxers que tries.' }
  ],
  llig: ['Els fitxers de codi que tries (JSX, JS, HTML i CSS), com a text'],
  escriu: ['Res: no corregix cap fitxer, només en mostra les infraccions'],
  xarxa: 'cap',
  dadesPersonals: false,
  nivell: 'L0',
  eixida: ['bandera', 'informe'],
  superficie: { tipus: 'consola' },
  portaHumana: 'Assenyala les infraccions; corregir-les és un canvi de codi que revisa i aprova el Mestre (Llei del Píxel).',
  proves: ['src/sections/tractors/sentinelles/policiaDisseny.test.js', 'src/sections/tractors/sentinelles/policiaDisseny.porta.test.js'],
  llindars: { ...LLINDARS },
  fitxa: 'src/sections/tractors/sentinelles/fitxes/sentinella_policia_disseny.md',
  fonts: [...FONTS_COMUNES, 'src/sections/tractors/sentinelles/policiaDisseny.js'],
  entrada: {
    etiqueta: 'Fitxers de codi (JSX, JS, HTML o CSS)',
    ajuda: 'Pots triar-ne diversos alhora. No en canvia cap.',
    accepta: '.js,.jsx,.mjs,.css,.html',
    multiple: true,
    prepara: preparaPolicia
  },
  observa: observaPolicia
});
