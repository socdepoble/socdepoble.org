// @vitest-environment node
/* Onada R24 (CODEX-R24-12) · La fitxa en blocs que el diàleg d'aprovació pinta fora de DEV: cada construcció
   que fan servir les fitxes de la Gestoria, cap HTML interpretat, i cap paraula de cap fitxa real perduda. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { TRACTORS_GESTORIA } from '../gestoria/tractors.js';
import { blocsDeFitxa, trossosEnLinia } from './fitxaTractor.js';

describe('blocsDeFitxa', () => {
  test('títols, paràgrafs, llistes numerades i de pics, un nivell sagnat i les continuacions', () => {
    const md = [
      '# Tractor «Prova»', '', '**Identificador:** `prova.lector` · **Xarxa:** cap', '', '## Pas a pas', '',
      '1. **Tu tries.** El selector', 'del sistema.', '2. **Calcula:**', '   - **Primer:** una cosa', '   - Segona', '     que continua', '',
      '- Res', '* Tampoc', '', 'Un paràgraf', 'en dues línies.'
    ].join('\n');
    expect(blocsDeFitxa(md)).toEqual([
      { tipus: 'titol', nivell: 1, text: 'Tractor «Prova»' },
      { tipus: 'paragraf', text: '**Identificador:** `prova.lector` · **Xarxa:** cap' },
      { tipus: 'titol', nivell: 2, text: 'Pas a pas' },
      { tipus: 'llista', ordenada: true, elements: [
        { text: '**Tu tries.** El selector del sistema.', fills: [] },
        { text: '**Calcula:**', fills: [{ text: '**Primer:** una cosa' }, { text: 'Segona que continua' }] }
      ] },
      { tipus: 'llista', ordenada: false, elements: [{ text: 'Res', fills: [] }, { text: 'Tampoc', fills: [] }] },
      { tipus: 'paragraf', text: 'Un paràgraf en dues línies.' }
    ]);
  });

  test('l’HTML i qualsevol altra marca es queden com a text: res s’interpreta', () => {
    expect(blocsDeFitxa('<script>alert(1)</script>\n> cita\n[enllaç](https://exemple.org)')).toEqual([
      { tipus: 'paragraf', text: '<script>alert(1)</script> > cita [enllaç](https://exemple.org)' }
    ]);
    expect(trossosEnLinia('<b>no</b> **sí** `codi <i>` i *això*')).toEqual([
      { tipus: 'text', text: '<b>no</b> ' }, { tipus: 'fort', text: 'sí' }, { tipus: 'text', text: ' ' },
      { tipus: 'codi', text: 'codi <i>' }, { tipus: 'text', text: ' i *això*' }
    ]);
    expect(blocsDeFitxa(null)).toEqual([]);
    expect(trossosEnLinia('')).toEqual([]);
  });

  /* Les marques que es lleven (títols, pics, números, ** i `) i res més: el text de cada fitxa real arriba sencer. */
  test.each(TRACTORS_GESTORIA.map((m) => [m.id, m.fitxa]))('%s: cap paraula de la fitxa es perd', (_id, ruta) => {
    const md = readFileSync(path.join(process.cwd(), ruta), 'utf8');
    const net = (text) => text.replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();
    const font = net(md.split('\n').map((linia) => linia
      .replace(/^#{1,6}[ \t]+/, '').replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/, '')).join(' '));
    const textDe = (bloc) => (bloc.tipus === 'llista'
      ? bloc.elements.map((e) => [e.text, ...e.fills.map((f) => f.text)].join(' ')).join(' ')
      : bloc.text);
    const blocs = blocsDeFitxa(md);
    expect(blocs.length).toBeGreaterThan(5);
    expect(net(blocs.map(textDe).join(' '))).toBe(font);
    expect(blocs[0]).toMatchObject({ tipus: 'titol', nivell: 1 });
  });
});
