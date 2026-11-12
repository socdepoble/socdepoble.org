/** Les subscripcions OPML entren per la mateixa fusió atòmica que la còpia JSON. */
import { estatInicial } from './estat.js';
import { LIMITS_PERSONALS, validaFontPersonal } from './personals.js';
import { atributDe, fillDe, fillsDe, llegixXml } from './xml.js';

const invalida = () => Object.assign(new Error('El fitxer no és un OPML vàlid del Lector.'), { codi: 'COPIA_INVALIDA' });

export function llegixOpml(text) {
  const { arrel, errors } = llegixXml(text, { estricte: true });
  if (errors.length || arrel?.nom !== 'opml' || arrel.ns !== ''
    || !['1.0', '1.1', '2.0'].includes(atributDe(arrel, 'version'))
    || fillsDe(arrel, 'body').length !== 1) throw invalida();
  const fonts = [];
  const ids = new Set();
  function visita(node) {
    const url = atributDe(node, 'xmlUrl');
    if (url !== null) {
      const tipus = atributDe(node, 'type');
      const nom = atributDe(node, 'text') || atributDe(node, 'title');
      const resultat = validaFontPersonal({ url, nom });
      if (!resultat.ok || (tipus && !['rss', 'atom'].includes(tipus.toLowerCase()))
        || ids.has(resultat.font.id) || fonts.length >= LIMITS_PERSONALS.fonts) throw invalida();
      ids.add(resultat.font.id);
      fonts.push(resultat.font);
    }
    for (const fill of fillsDe(node, 'outline')) visita(fill);
  }
  visita(fillDe(arrel, 'body'));
  return { estat: estatInicial(), personals: { esquema: 1, fonts } };
}
