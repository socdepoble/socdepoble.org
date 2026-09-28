/**
 * T43 (ordre del Mestre, 260928) · La visibilitat d'una connexió diu la
 * veritat: què es pot triar en cada mode de dades i amb sessió o sense, quins
 * passos es fan i amb quins límits, i quin missatge ix per xat.
 */
import { expect, test } from 'vitest';
import {
  LIMIT_GRUPS, LIMIT_PERSONES, MAXIM_MISSATGE, aplicatDe, desDe, estatDelXat, grupsDeXat, missatgeDeConnexio,
  missatgeDeLError, modeAplicable, opcionsDAbast, passosDAplicacio
} from './abastConnexio.js';

const perValor = (opcions) => Object.fromEntries(opcions.map((o) => [o.valor, o]));
const GRUPS = [{ id: 'g1', nom: 'Comissió de Festes' }];

test.each([
  // [dataMode, teSessio, grups, desactivades]
  ['remote', true, GRUPS, []],
  ['remote', true, [], ['grups']],
  ['remote', false, GRUPS, ['persones', 'grups', 'poble']],
  ['seed', true, GRUPS, ['poble']],
  ['local', true, [], ['grups', 'poble']],
  ['seed', false, GRUPS, ['persones', 'grups', 'poble']]
])('opcions en %s amb sessió=%s: desactivades %j, cadascuna amb el seu motiu', (dataMode, teSessio, grups, desactivades) => {
  const opcions = opcionsDAbast({ dataMode, teSessio, grups });
  expect(opcions.map((o) => o.valor)).toEqual(['privada', 'persones', 'grups', 'poble']);
  expect(opcions.filter((o) => o.desactivada).map((o) => o.valor)).toEqual(desactivades);
  for (const opcio of opcions.filter((o) => o.desactivada)) expect(opcio.detall, opcio.valor).toBeTruthy();
  expect(perValor(opcions).privada.desactivada).toBeFalsy();
});

test('els textos no prometen cap permís: Privada, missatges de xat i «no Internet»', () => {
  const opcions = perValor(opcionsDAbast({ dataMode: 'remote', teSessio: true, grups: GRUPS }));
  expect(opcions.privada.ajuda).toBe('Es guarda al teu MAS. Ningú més la veu.');
  expect(opcions.persones.ajuda).toContain('És un missatge, no un permís');
  expect(opcions.grups.ajuda).toContain('És un missatge, no un permís');
  expect(opcions.poble.ajuda).toContain('la gent registrada del poble, no Internet');
  const seed = perValor(opcionsDAbast({ dataMode: 'seed', teSessio: true, grups: GRUPS }));
  expect(seed.poble.detall).toBe('Sense servidor no es pot compartir al Mur.');
  expect(seed.privada.detall).toContain('només en este dispositiu');
  expect(seed.persones.detall).toContain('ningú més el rep');
});

/* T43a-2 · una llista buida només vol dir «cap grup» quan el xat ha carregat bé. */
test('Grups: sense grups diu si el xat carrega, si ha fallat o si de veres no n’hi ha cap', () => {
  const grups = (xat) => perValor(opcionsDAbast({ dataMode: 'remote', teSessio: true, grups: [], xat })).grups;
  expect(grups('carregant')).toMatchObject({ desactivada: true, detall: 'Carregant els teus grups de xat…' });
  expect(grups('error')).toMatchObject({ desactivada: true, detall: 'El xat no està disponible ara mateix.' });
  expect(grups('llest')).toMatchObject({ desactivada: true, detall: 'Encara no eres en cap grup de xat.' });
  expect(grups(undefined).detall).toBe('Encara no eres en cap grup de xat.');
  /* Amb grups ja carregats, l'estat del xat no els amaga. */
  expect(perValor(opcionsDAbast({ dataMode: 'remote', teSessio: true, grups: GRUPS, xat: 'error' })).grups.desactivada).toBe(false);
  /* Sense sessió mana el motiu de la sessió. */
  expect(perValor(opcionsDAbast({ teSessio: false, xat: 'carregant' })).grups.detall).toContain('Entra amb el teu compte');
});

test('estatDelXat: carregant, error (avís i cap fil) o llest', () => {
  expect(estatDelXat({ status: 'loading' })).toBe('carregant');
  expect(estatDelXat({ status: 'ready', avis: 'No s’han pogut carregar les converses.', fils: [] })).toBe('error');
  /* Un avís d'una altra operació amb els fils ja carregats no tomba la llista. */
  expect(estatDelXat({ status: 'ready', avis: 'No s’han pogut carregar els missatges.', fils: [{ id: 'g1' }] })).toBe('llest');
  expect(estatDelXat({ status: 'ready', avis: null, fils: [] })).toBe('llest');
  expect(estatDelXat()).toBe('llest');
});

test('un mode desactivat o desconegut no s’aplica: cau a «privada»', () => {
  const opcions = opcionsDAbast({ dataMode: 'seed', teSessio: true, grups: [] });
  expect(modeAplicable('poble', opcions)).toBe('privada');
  expect(modeAplicable('grups', opcions)).toBe('privada');
  expect(modeAplicable('persones', opcions)).toBe('persones');
  expect(modeAplicable('internet', opcions)).toBe('privada');
});

test('els grups són els fils de xat «grup» i «comunitat» no arxivats', () => {
  const fils = [
    { id: 'd1', tipus: 'directe', name: 'Pepa' },
    { id: 'g1', tipus: 'grup', name: 'Comissió de Festes' },
    { id: 'c1', tipus: 'comunitat', title: 'La Torre' },
    { id: 'g2', tipus: 'grup', name: 'Vell', arxivat: true },
    { id: 'i1', tipus: 'iaia', name: 'IAIA' }
  ];
  expect(grupsDeXat(fils)).toEqual([{ id: 'g1', nom: 'Comissió de Festes' }, { id: 'c1', nom: 'La Torre' }]);
  expect(grupsDeXat(null)).toEqual([]);
});

test('passos: privada no fa res; persones i grups amb límits i sense repetits; poble és un pas pendent', () => {
  expect(passosDAplicacio({ mode: 'privada' })).toEqual([]);
  expect(passosDAplicacio(null)).toEqual([]);
  const persones = Array.from({ length: 30 }, (_, i) => ({ id: `u${i % 25}`, nom: `P${i}` }));
  const passos = passosDAplicacio({ mode: 'persones', persones: [{ id: 'u0', nom: 'Pepa', filId: 'f0' }, ...persones] });
  expect(passos).toHaveLength(LIMIT_PERSONES);
  expect(passos[0]).toEqual({ tipus: 'xat-persona', desti: { id: 'u0', nom: 'Pepa', filId: 'f0' } });
  expect(new Set(passos.map((p) => p.desti.id)).size).toBe(LIMIT_PERSONES);
  const grups = Array.from({ length: 15 }, (_, i) => ({ id: `g${i}` }));
  const passosGrups = passosDAplicacio({ mode: 'grups', grups });
  expect(passosGrups).toHaveLength(LIMIT_GRUPS);
  expect(passosGrups[0]).toEqual({ tipus: 'xat-grup', desti: { id: 'g0', nom: 'g0' } });
  expect(passosDAplicacio({ mode: 'poble' })).toEqual([{ tipus: 'mur', desti: { id: 'mur', nom: 'El teu mur' } }]);
});

test('el missatge diu què és, de qui és i on es veu; mai passa de 4096 caràcters', () => {
  expect(missatgeDeConnexio({ titol: 'Sella', autorNom: 'Gent de Sella' }, 'https://poble.example/pobles/sella'))
    .toBe('T’envie «Sella» (de Gent de Sella), que he connectat al meu MAS. Ho pots vore ací: https://poble.example/pobles/sella');
  expect(missatgeDeConnexio({ titol: 'Fira' })).toBe('T’envie «Fira», que he connectat al meu MAS.');
  expect(missatgeDeConnexio({}, '')).toContain('«un element»');
  expect(missatgeDeConnexio({ titol: 'x'.repeat(5000) }, `https://a.example/${'y'.repeat(5000)}`).length).toBeLessThanOrEqual(MAXIM_MISSATGE);
});

test('D10 · sense la columna notes.origen, un missatge honest en lloc de l’error cru', () => {
  const cru = new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'origen\' column of \'notes\' in the schema cache"}');
  expect(missatgeDeLError(cru)).toContain('El servidor d’este poble encara no admet connexions');
  expect(missatgeDeLError(cru)).not.toContain('PGRST204');
  expect(missatgeDeLError(new Error('column "origen" does not exist (42703)'))).toContain('encara no admet connexions');
  expect(missatgeDeLError(new Error('Error de xarxa'))).toBe('Error de xarxa');
  expect(missatgeDeLError(null)).toContain('No s’ha pogut guardar');
});

test('«des del / des de l’ / des dels», mai «des el»', () => {
  expect(desDe('mur')).toBe('des del Mur');
  expect(desDe('events')).toBe('des de l’agenda');
  expect(desDe('pobles')).toBe('des dels Pobles');
  expect(desDe('perfil')).toBe('des del directori');
  expect(desDe('')).toBe('des de Sóc de Poble');
});

test('aplicat només apunta el que s’ha fet de veres', () => {
  const ara = new Date('2026-09-28T02:00:00.000Z');
  expect(aplicatDe([
    { tipus: 'xat-persona', id: 'u1', estat: 'fet' },
    { tipus: 'xat-persona', id: 'u2', estat: 'error' },
    { tipus: 'xat-grup', id: 'g1', estat: 'fet' },
    { tipus: 'mur', id: 'mur', estat: 'pendent' }
  ], ara)).toEqual({ persones: ['u1'], grups: ['g1'], mur: false, al: '2026-09-28T02:00:00.000Z' });
});
