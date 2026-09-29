import { expect, test, vi } from 'vitest';
import { dataDeTargeta, propsDeTargetaViva, textPla } from './targetaViva.js';
import { TEXTOS_LLAVOR } from './textosLlavor.js';

/* T50 (decisió del Mestre, 260928) · El document de l'editor, dit com a
   targeta: D1 (text pla), llavor, D3 (data de publicació), D4 (emoticona). */
const ARA = new Date(2026, 8, 28, 10, 7);

test('D1 · títol, subtítol i entradilla en text pla: res de &nbsp; ni <b> literals', () => {
  const props = propsDeTargetaViva({
    title: '<p>Tomaques <b>de penjar</b></p>',
    subtitle: 'Del&nbsp;Mas',
    lead: '<p><b>Hola</b>&nbsp;món &amp; poble</p>',
  }, { ara: ARA });
  expect(props.title).toBe('Tomaques de penjar');
  expect(props.subtitle).toBe('Del Mas');
  expect(props.body).toBe('Hola món & poble');
  for (const valor of [props.title, props.subtitle, props.body]) {
    expect(valor).not.toMatch(/<|&nbsp;|&amp;|\xA0/);
  }
  expect(textPla(null)).toBe('');
});

test('un camp buit (o només etiquetes buides) diu el text de llavor de l’editor', () => {
  const props = propsDeTargetaViva({ title: '<p></p>', subtitle: '', lead: undefined }, { ara: ARA });
  expect(props.title).toBe(TEXTOS_LLAVOR.titol);
  expect(props.subtitle).toBe(TEXTOS_LLAVOR.subtitol);
  expect(props.body).toBe(TEXTOS_LLAVOR.entradilla);
  // Sense document també: la targeta de llavor.
  expect(propsDeTargetaViva(null, { ara: ARA }).title).toBe(TEXTOS_LLAVOR.titol);
});

test('D4 · l’emoticona només si s’ha triat (un sol emoji del camp cru); mai la ploma de reserva', () => {
  expect(propsDeTargetaViva({ icon: '🍅' }, { ara: ARA }).emoticona).toBe('🍅');
  expect(propsDeTargetaViva({}, { ara: ARA }).emoticona).toBe('');
  expect(propsDeTargetaViva({ icon: '' }, { ara: ARA }).emoticona).toBe('');
  // Un text que no és un sol emoji no es pinta com a emoticona.
  expect(propsDeTargetaViva({ icon: '🍅 Tomaques' }, { ara: ARA }).emoticona).toBe('');
  // La targeta no rep mai la prop `icon` (el glif del títol): la ploma de la llista no hi arriba.
  expect(propsDeTargetaViva({ icon: '🍅' }, { ara: ARA })).not.toHaveProperty('icon');
});

test('D3 · la data de publicació triada (T40) mana sobre la d’última edició', () => {
  const publicacio = new Date(2026, 9, 3, 18, 30);
  const d = { publishDate: publicacio.toISOString(), formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' };
  expect(dataDeTargeta(d, ARA)).toEqual({ time: '18:30', date: '03/10/26', dateTime: '2026-10-03T18:30' });
  expect(propsDeTargetaViva(d, { ara: ARA })).toMatchObject({ time: '18:30', date: '03/10/26' });
});

/* T51 · Regla d'EDICIÓ del Mestre: la targeta viva ensenya el que es
   publicaria ara. Sense data triada, la d'ara; MAI la de l'última edició. */
const ARA_DE_LA_PASTILLA = { time: '10:07', date: '28/09/26', dateTime: '2026-09-28T10:07' };

test('T51 · sense data de publicació, la data i l’hora d’ara: mai la de l’última edició (formatted*, updatedAt)', () => {
  const d = { publishDate: null, formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' };
  expect(dataDeTargeta(d, ARA)).toEqual(ARA_DE_LA_PASTILLA);
  expect(propsDeTargetaViva(d, { ara: ARA })).toMatchObject(ARA_DE_LA_PASTILLA);
  // Una data de publicació invàlida no és cap tria: també la d'ara.
  expect(dataDeTargeta({ ...d, publishDate: '2026-02-30T10:00:00Z' }, ARA)).toEqual(ARA_DE_LA_PASTILLA);
  // La targeta no rep cap camp intern de la regla (esAra) com a prop.
  expect(propsDeTargetaViva(d, { ara: ARA })).not.toHaveProperty('esAra');
});

test('T51 · sense `ara` injectat, el rellotge de veres (fals ací): la d’ara, no la de l’última edició', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(ARA);
  try {
    expect(dataDeTargeta({ formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' })).toEqual(ARA_DE_LA_PASTILLA);
  } finally { vi.useRealTimers(); }
});

test('T51 · una tria de dia sol es mostra sense hora inventada', () => {
  expect(dataDeTargeta({ publishDate: '2026-10-05' }, ARA)).toEqual({ time: '', date: '05/10/26', dateTime: '2026-10-05' });
});

test('T51 · un document sense cap data (la fitxa del Perfil) porta la data i l’hora d’ara: mai buida', () => {
  expect(dataDeTargeta({}, ARA)).toEqual(ARA_DE_LA_PASTILLA);
});

test('autor, imatge, etiquetes i copyright passen tal qual (la imatge crua: la resol qui pinta)', () => {
  const etiquetes = [{ text: 'Sistema', className: 'sdp-badge-category' }];
  const props = propsDeTargetaViva(
    { heroImage: 'sdp-media://mitjans/a.webp', copyright: '© Pep' },
    { autor: { nom: 'Pep', avatar: 'https://poble.test/p.webp', poble: 'La Torre' }, etiquetes, ara: ARA },
  );
  expect(props).toMatchObject({
    imageUrl: 'sdp-media://mitjans/a.webp', author: 'Pep', avatarUrl: 'https://poble.test/p.webp',
    location: 'La Torre', labels: etiquetes, copyright: '© Pep',
  });
  // Sense autor ni copyright: res inventat.
  const buida = propsDeTargetaViva({}, { ara: ARA });
  expect(buida.author).toBeUndefined();
  expect(buida.copyright).toBeUndefined();
  expect(buida.labels).toEqual([]);
});
