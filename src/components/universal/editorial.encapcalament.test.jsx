import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MARCADORS_NO_INDICATS, encapcalamentDeTargeta } from './editorial.js';
import { DateTimeControl } from '../PedraSeca/atoms/controls.jsx';
import { usePastillaCalendari } from './barres/pastillaCalendari.js';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const navigate = vi.fn();
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => navigate }));
afterEach(() => { cleanup(); navigate.mockClear(); });
function Header({ source }) {
  const props = encapcalamentDeTargeta(source);
  const calendar = usePastillaCalendari(props);
  return <DateTimeControl {...props} onClick={calendar.onClick} label={calendar.etiqueta} />;
}
describe('reading header source contract', () => {
  test('uses real editorial date and author/locality; changing audit time cannot move it', () => {
    const p = encapcalamentDeTargeta({ author: { name: 'Pepa' }, town_name: 'Alcoi', date: '2026-01-21', updated_at: '2026-10-01T12:00:00Z' });
    expect(p).toEqual({ author: 'Pepa', location: 'Alcoi', date: '21/01/26', time: '', dateTime: '2026-01-21' });
  });
  test('keeps declared publication timestamp/time precision and explicit header precedence', () => {
    const p = encapcalamentDeTargeta({ author: 'Other', publish_date: '2026-09-08T14:00:00Z' }, { author: 'Real author', location: 'Real town' });
    expect(p).toMatchObject({ author: 'Real author', location: 'Real town', date: '08/09/26' });
    expect(p.time).toMatch(/^\d\d:\d\d$/); expect(p.dateTime).toContain('2026-09-08T');
  });
  test('missing/hostile values do not invent a person, town, day or instant', () => {
    const bad = { toString() { throw new Error('must not coerce'); } };
    expect(encapcalamentDeTargeta({ author: bad, town_name: ['Alcoi'], date: bad, created_at: '2026-02-30' })).toEqual({
      author: 'Autoria no indicada', location: 'Poble no indicat', time: '', date: 'Data no indicada', dateTime: null
    });
  });
  test.each([['2019', '2019'], [2019, '2019'], [null, 'Data no indicada'], [['2019'], 'Data no indicada']])('year precision %j remains truthful', (year, date) => {
    expect(encapcalamentDeTargeta({ year })).toMatchObject({ date, dateTime: null, time: '' });
  });
  test('translation keys and non-text cannot replace honest labels', () => {
    expect(encapcalamentDeTargeta({}, { t: key => key }).date).toBe('Data no indicada');
    expect(encapcalamentDeTargeta({}, { t: () => ({ bad: true }) }).author).toBe('Autoria no indicada');
  });
  test.each([
    { town_name: ' Sóc de Poble ' }, { townName: 'Sóc de Poble' },
    { poble: 'Sóc de Poble' }, { poble: { nom: 'Sóc de Poble' } }
  ])('a legacy brand in any town alias remains an unknown place: %j', source => {
    expect(encapcalamentDeTargeta({ ...source, author: 'Sóc de Poble' })).toMatchObject({
      author: 'Sóc de Poble', location: 'Poble no indicat'
    });
  });
  test('a false location override cannot hide the real village in the next candidate', () => {
    expect(encapcalamentDeTargeta({ town_name: 'Alcoi' }, { location: 'Sóc de Poble' }).location).toBe('Alcoi');
    expect(encapcalamentDeTargeta({ town_name: 'Sóc de Poble', townName: 'Alcoi' }).location).toBe('Alcoi');
    expect(encapcalamentDeTargeta({}, { location: 'Sóc de Poble' }).location).toBe('Poble no indicat');
  });
  test.each([{}, { year: '2019' }])('unknown/year-only pill has neither fake datetime nor calendar click', source => {
    const { container } = render(<Header source={source} />);
    expect(container.querySelector('.btn-date-time')).toBeTruthy();
    expect(container.querySelector('time')).toBeNull(); expect(screen.queryByRole('button')).toBeNull(); expect(navigate).not.toHaveBeenCalled();
  });
  test('a real day still links to the actual month', () => {
    render(<Header source={{ date: '2026-01-21' }} />);
    screen.getByRole('button', { name: /21\/01\/26/ }).click();
    expect(navigate).toHaveBeenCalledWith('/calendari?mes=2026-01');
  });
});

/* R21 (regressio_ui_xat-09, honestedat_textos-06) · Els tres marcadors honestos tenen clau als cinc
   diccionaris; les apps (Model B), que no poden llegir UIContext, trien per `idioma` una taula que diu
   el mateix; i cap cridador de src/ no els deixa en valencià per no passar ni l'un ni l'altre. */
describe('honest markers speak the interface language', () => {
  const MARCADORS = { author: 'editorial.autoriaNoIndicada', location: 'editorial.pobleNoIndicat', date: 'editorial.dataNoIndicada' };
  const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  test.each(Object.entries(DICCIONARIS))('%s has the three keys, and `t` and `idioma` give the same words', (llengua, diccionari) => {
    const ambT = encapcalamentDeTargeta({}, { t: (clau) => diccionari[clau] });
    const ambIdioma = encapcalamentDeTargeta({}, { idioma: llengua });
    for (const [camp, clau] of Object.entries(MARCADORS)) {
      expect(typeof diccionari[clau] === 'string' && diccionari[clau].trim().length > 0, `${llengua}: ${clau}`).toBe(true);
      expect(ambT[camp]).toBe(diccionari[clau]);
      expect(ambIdioma[camp], `${llengua}: ${camp}`).toBe(diccionari[clau]);
    }
  });
  test('the table has exactly the five languages; unknown or missing idioma falls back to Valencian, and `t` wins', () => {
    expect(Object.keys(MARCADORS_NO_INDICATS).sort()).toEqual(Object.keys(DICCIONARIS).sort());
    expect(Object.isFrozen(MARCADORS_NO_INDICATS) && Object.isFrozen(MARCADORS_NO_INDICATS.ca)).toBe(true);
    for (const idioma of [undefined, null, 'fr', 'constructor', '__proto__', 7]) {
      expect(encapcalamentDeTargeta({}, { idioma })).toMatchObject({ author: CA[MARCADORS.author], location: CA[MARCADORS.location], date: CA[MARCADORS.date] });
    }
    expect(encapcalamentDeTargeta({}, { idioma: 'en', t: (clau) => ES[clau] }).author).toBe(ES[MARCADORS.author]);
    expect(encapcalamentDeTargeta({}, { idioma: 'en', t: (clau) => clau }).author).toBe(EN[MARCADORS.author]);
  });
  test('the Valencian dictionary says exactly the built-in fallback', () => {
    expect(encapcalamentDeTargeta({}, { t: (clau) => CA[clau] })).toMatchObject(encapcalamentDeTargeta({}));
  });
  /* L'única excepció, documentada: el Tauler de la Gestoria és un mòdul del nucli 1.5.0 que no pot
     portar UIContext (apps/plataforma/guardesDelModul.test.js) i no importa la plataforma, així que
     no té cap font de llengua; tota la seua interfície és en valencià. */
  const SENSE_FONT_DE_LLENGUA = new Set(['sections/gestoria/tauler/TargetaTauler.jsx']);
  test('every caller in src passes the translator `t` or the shell language `idioma`', () => {
    const arrel = path.join(process.cwd(), 'src');
    const fitxers = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const ruta = path.join(dir, e.name);
      return e.isDirectory() ? fitxers(ruta) : /\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name) ? [ruta] : [];
    });
    const crides = [];
    for (const fitxer of fitxers(arrel)) {
      const font = readFileSync(fitxer, 'utf8');
      if (!font.includes('encapcalamentDeTargeta(')) continue;
      const visita = (node) => {
        if (!node || typeof node.type !== 'string') return;
        if (node.type === 'CallExpression' && node.callee?.name === 'encapcalamentDeTargeta') {
          const opcions = node.arguments[1];
          const ambT = opcions?.type === 'ObjectExpression' && opcions.properties.some((prop) => ['t', 'idioma'].includes(prop.key?.name));
          crides.push({ fitxer: path.relative(arrel, fitxer), on: `${path.relative(arrel, fitxer)}:${node.loc.start.line}`, ambT });
        }
        for (const [clau, valor] of Object.entries(node)) {
          if (clau === 'loc') continue;
          if (Array.isArray(valor)) valor.forEach(visita); else if (valor && typeof valor === 'object') visita(valor);
        }
      };
      visita(parse(font, { sourceType: 'module', plugins: ['jsx'] }).program);
    }
    expect(crides.length).toBeGreaterThanOrEqual(18);
    expect(crides.filter((crida) => !crida.ambT && !SENSE_FONT_DE_LLENGUA.has(crida.fitxer)).map((crida) => crida.on)).toEqual([]);
    expect(crides.filter((crida) => SENSE_FONT_DE_LLENGUA.has(crida.fitxer)).map((crida) => crida.ambT)).toEqual([false]);
  });
});
