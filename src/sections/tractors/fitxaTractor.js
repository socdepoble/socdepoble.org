/**
 * fitxaTractor.js — la fitxa d'un tractor, en blocs per a pintar-la sense cap HTML.
 *
 * Onada R24 (CODEX-R24-12) · Fora de DEV no hi ha panell de Tractors: el diàleg
 * d'aprovació (DialegAprovacio.jsx) porta la fitxa sencera perquè qui aprova a
 * la web publicada la llija abans de signar. El panell la pinta amb
 * parseMarkdown i sanitizeHtml, però el diàleg és dins de la closca de la
 * Gestoria, que es compila també com a mòdul net (ADR-2026-12,
 * plataforma/guardesDelModul.test.js: cap sanejador, cap paquet propi, cap
 * adreça). Per això ací la fitxa es llig en blocs i el diàleg en fa elements de
 * React: tot el text hi entra com a text, mai com a HTML.
 *
 * Cobrix el que fan servir les fitxes de src/sections/gestoria/fitxes: títols
 * (# a ######), paràgrafs, llistes numerades i de pics, un nivell de llista
 * dins d'un element (sagnat), **negreta** i `codi`. Qualsevol altra marca es
 * queda com a text, tal qual: res no es perd ni s'interpreta.
 *
 * Funció pura, sense React ni DOM:
 *   blocsDeFitxa(md) → [{ tipus: 'titol', nivell, text } | { tipus: 'paragraf', text }
 *     | { tipus: 'llista', ordenada, elements: [{ text, fills: [{ text }] }] }]
 *   trossosEnLinia(text) → [{ tipus: 'text' | 'fort' | 'codi', text }]
 */
const TITOL = /^(#{1,6})[ \t]+(.+?)[ \t#]*$/;
const NUMERADA = /^(\d+)[.)][ \t]+(.*)$/;
const PIC = /^[-*+][ \t]+(.*)$/;
const SAGNAT = /^[ \t]{2,}(?:[-*+]|\d+[.)])[ \t]+(.*)$/;

/**
 * @param {string} md
 * @returns {Array<object>}
 */
export function blocsDeFitxa(md) {
  const blocs = [];
  let paragraf = null;
  let llista = null;
  const tancaParagraf = () => {
    if (paragraf) blocs.push({ tipus: 'paragraf', text: paragraf.join(' ') });
    paragraf = null;
  };
  const tancaLlista = () => {
    if (llista) blocs.push(llista);
    llista = null;
  };
  for (const crua of String(md ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    const linia = crua.replace(/[ \t]+$/, '');
    if (!linia.trim()) {
      tancaParagraf();
      tancaLlista();
      continue;
    }
    const titol = TITOL.exec(linia);
    const numerada = NUMERADA.exec(linia);
    const pic = PIC.exec(linia);
    const sagnat = SAGNAT.exec(linia);
    if (titol) {
      tancaParagraf();
      tancaLlista();
      blocs.push({ tipus: 'titol', nivell: titol[1].length, text: titol[2] });
    } else if (numerada || pic) {
      tancaParagraf();
      const ordenada = Boolean(numerada);
      if (llista && llista.ordenada !== ordenada) tancaLlista();
      llista ||= { tipus: 'llista', ordenada, elements: [] };
      llista.elements.push({ text: (numerada ? numerada[2] : pic[1]).trim(), fills: [] });
    } else if (sagnat && llista) {
      llista.elements[llista.elements.length - 1].fills.push({ text: sagnat[1].trim() });
    } else if (llista) {
      // La continuació d'un element (o del seu darrer fill), sense marca de llista.
      const darrer = llista.elements[llista.elements.length - 1];
      const fill = darrer.fills[darrer.fills.length - 1];
      if (fill) fill.text = `${fill.text} ${linia.trim()}`;
      else darrer.text = `${darrer.text} ${linia.trim()}`;
    } else {
      (paragraf ||= []).push(linia.trim());
    }
  }
  tancaParagraf();
  tancaLlista();
  return blocs;
}

/**
 * La negreta (**…**) i el codi (`…`) d'una línia; la resta, text.
 * @param {string} text
 * @returns {Array<{ tipus: 'text'|'fort'|'codi', text: string }>}
 */
export function trossosEnLinia(text) {
  const trossos = [];
  const patro = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  const font = String(text ?? '');
  let des = 0;
  for (const m of font.matchAll(patro)) {
    if (m.index > des) trossos.push({ tipus: 'text', text: font.slice(des, m.index) });
    trossos.push(m[1] !== undefined ? { tipus: 'fort', text: m[1] } : { tipus: 'codi', text: m[2] });
    des = m.index + m[0].length;
  }
  if (des < font.length) trossos.push({ tipus: 'text', text: font.slice(des) });
  return trossos;
}
