// @vitest-environment node
/* T5 · Les reserves divergents del cens 261102 no poden reaparéixer.
   Les claus ja eren als diccionaris: t() usa ara el valor canònic; els dos
   parells de textos conserven una reserva idèntica per als muntatges aïllats. */
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import { describe, expect, test } from 'vitest';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';
const FITXERS = [
  'src/app/App.jsx',
  'src/sections/control/ControlSection.jsx',
  'src/sections/mercat/MercatSection.jsx',
  'src/sections/mur/MurSection.jsx',
  'src/sections/poblacio/PoblacioSection.jsx',
  'src/sections/pobles/PoblesSection.jsx',
  'src/sections/search/SearchSection.jsx',
  'src/sections/xat/XatControlSection.jsx',
  'src/sections/xat/XatSection.jsx',
  'src/sections/xat/components/FullAjustos.jsx',
  'src/sections/xat/components/VistaEnConstruccio.jsx'
];
const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
function clausDe(font) {
  const resultats = [];
  const visita = (node) => {
    if (!node || typeof node !== 'object') return;
    const crida = ['CallExpression', 'OptionalCallExpression'].includes(node.type) && node.callee?.name === 't';
    const parell = node.type === 'ArrayExpression' && node.elements.length === 2;
    const [clau, reserva] = crida ? node.arguments : parell ? node.elements : [];
    if (clau?.type === 'StringLiteral' && /^(?:section|nav|common|pull|editor|workspace)\./.test(clau.value)) {
      resultats.push({ clau: clau.value, reserva: reserva?.type === 'StringLiteral' ? reserva.value : undefined });
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'extra', 'comments'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visita);
      else if (value && typeof value === 'object') visita(value);
    }
  };
  visita(parse(font, { sourceType: 'module', plugins: ['jsx'] }));
  return resultats;
}
const divergencies = (font) => clausDe(font).filter(({ clau, reserva }) => reserva !== undefined && reserva !== CA[clau]);

describe('T5 · reserves canòniques i claus resolubles en els cinc idiomes', () => {
  test.each(FITXERS)('%s', (file) => {
    const font = readFileSync(file, 'utf8');
    const claus = clausDe(font);
    expect(claus.length).toBeGreaterThan(0);
    expect(divergencies(font)).toEqual([]);
    for (const { clau } of claus) {
      for (const [idioma, dic] of Object.entries(DICCIONARIS)) {
        expect(typeof dic[clau], `${file}: ${idioma}/${clau}`).toBe('string');
        expect(dic[clau].trim(), `${file}: ${idioma}/${clau}`).not.toBe('');
      }
    }
  });
  test('la guarda detecta tant crides opcionals com parells i no exigix reserves redundants', () => {
    expect(divergencies("t('pull.pull'); t?.('pull.pull', 'Canvi no traduït'); const P = ['pull.pull', 'Canvi no traduït'];"))
      .toEqual([{ clau: 'pull.pull', reserva: 'Canvi no traduït' }, { clau: 'pull.pull', reserva: 'Canvi no traduït' }]);
  });
});
