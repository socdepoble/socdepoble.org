// Text pla compartit per l'editor, les notes i el perfil.
export const MAXIM_AUTORIA = 256;
export const CODIS_CC = Object.freeze({
  'cc-by-nc-sa': 'CC BY-NC-SA 4.0',
  'cc-by-nc-nd': 'CC BY-NC-ND 4.0',
  'cc-by-nc': 'CC BY-NC 4.0',
  'cc-by-nd': 'CC BY-ND 4.0',
  'cc-by-sa': 'CC BY-SA 4.0',
  'cc-by': 'CC BY 4.0',
  cc0: 'CC0 1.0',
});
export const MARCA_CC0 = ' · CC0 1.0';
export const PREFIX_COPYRIGHT = '© ';
// La marca addicional distingix un final CC0 literal del format lliure antic.
export const SEPARADOR_AUTORIA_LITERAL = ' · ';
export const PREFIX_RESERVATS_LITERAL = `©${SEPARADOR_AUTORIA_LITERAL}`;
const CC_PER_ID = Object.entries(CODIS_CC);
export const MAXIM_DRETS_DESATS = MAXIM_AUTORIA + Math.max(...CC_PER_ID.map(([, codi]) => codi.length + SEPARADOR_AUTORIA_LITERAL.length));

export const llargariaDe = (text) => Array.from(text).length;

export function sanejaAutoria(valor) {
  if (typeof valor !== 'string') return '';
  // Conserva l'escriptura i la puntuació, inclosos ZWJ/ZWNJ i els accents.
  return valor
    .replace(/[\t\n\r\u{2028}\u{2029}]+/gu, ' ')
    .replace(/[\u{0}-\u{1f}\u{7f}-\u{9f}\u{61c}\u{200e}\u{200f}\u{202a}-\u{202e}\u{2066}-\u{2069}\u{d800}-\u{dfff}]/gu, '')
    .normalize('NFC')
    .trim();
}

export function desglossaDrets(text) {
  for (const [id, codi] of CC_PER_ID) {
    if (text.startsWith(`${codi}${SEPARADOR_AUTORIA_LITERAL}`)) {
      return { id, autoria: text.slice(codi.length + SEPARADOR_AUTORIA_LITERAL.length) };
    }
  }
  if (text.startsWith(PREFIX_RESERVATS_LITERAL)) {
    return { id: 'reservats', autoria: text.slice(PREFIX_RESERVATS_LITERAL.length) };
  }
  if (text.endsWith(MARCA_CC0)) return { id: 'lliure', autoria: text.slice(0, -MARCA_CC0.length) };
  for (const [id, codi] of CC_PER_ID) {
    if (text === codi) return { id, autoria: '' };
    if (text.startsWith(`${codi} `)) return { id, autoria: text.slice(codi.length + 1) };
  }
  if (text.startsWith('©')) {
    // Com el ltrim() del CHECK de 2611110010: només l'espai ASCII, mai l'NBSP ni l'U+3000.
    return { id: 'reservats', autoria: text.slice(1).replace(/^ +/u, '') };
  }
  return { id: 'actual', autoria: text };
}

/* Fora de l'editor (connexions i preferències), un valor marcat massa llarg
   conserva la seua marca i talla l'autoria: la marca «©» no es pot perdre. */
function tallaAmbMarca(text, id, autoria) {
  const tallada = Array.from(autoria).slice(0, MAXIM_AUTORIA).join('').trimEnd();
  if (id === 'lliure') {
    const desat = `${tallada}${MARCA_CC0}`;
    return desglossaDrets(desat).id === 'lliure' ? desat : `${CODIS_CC.cc0}${SEPARADOR_AUTORIA_LITERAL}${tallada}`;
  }
  // Conserva la forma literal «… · » de l'original, i la força si l'autoria tallada la necessita.
  const literal = text.slice(0, text.length - autoria.length).endsWith(SEPARADOR_AUTORIA_LITERAL)
    || tallada.endsWith(MARCA_CC0) || tallada.startsWith('· ');
  if (id === 'reservats') return `${literal ? PREFIX_RESERVATS_LITERAL : PREFIX_COPYRIGHT}${tallada}`.trimEnd();
  return `${CODIS_CC[id]}${literal ? SEPARADOR_AUTORIA_LITERAL : ' '}${tallada}`.trimEnd();
}

export function sanejaDrets(valor, { estricte = false } = {}) {
  const text = sanejaAutoria(valor);
  const { id, autoria } = desglossaDrets(text);
  if (llargariaDe(autoria) <= MAXIM_AUTORIA && llargariaDe(text) <= MAXIM_DRETS_DESATS) return text;
  // Els valors antics sense cap marca mantenen el seu límit anterior.
  if (id === 'actual') return Array.from(text).slice(0, MAXIM_AUTORIA).join('').trimEnd();
  if (estricte) throw new RangeError(`L’autoria pot tindre com a màxim ${MAXIM_AUTORIA} caràcters.`);
  return tallaAmbMarca(text, id, autoria);
}
