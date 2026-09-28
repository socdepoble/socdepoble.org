/* T47b (ordre del Mestre, 260928) · Quarantena de columnes opcionals: el
   mecanisme reutilitzable per a qualsevol taula (icon hui, publish_date demà). */
import { expect, test, vi } from 'vitest';
import { ambDescartats, creaColumnesOpcionals } from './columnesOpcionals.js';
import { classificaError } from '../autodesament/errors.js';

const pgrst204 = (columna, taula = 'notes') => Object.assign(new Error(
  `Supabase 400: {"code":"PGRST204","message":"Could not find the '${columna}' column of '${taula}' in the schema cache"}`),
{ status: 400 });
const postgres42703 = (columna, taula = 'notes') => Object.assign(new Error(
  `Supabase 400: {"code":"42703","message":"column ${taula}.${columna} does not exist"}`), { status: 400 });

test('una columna opcional absent es recorda i la resta s’envia amb la mateixa petició', async () => {
  const opcionals = creaColumnesOpcionals('notes', { icon: 'icon' });
  const peticio = vi.fn(async (cos) => {
    if ('icon' in cos) throw pgrst204('icon');
    return [{ ...cos }];
  });
  const primer = await opcionals.envia({ title: 'Hort', icon: '🌿' }, peticio);
  expect(peticio.mock.calls.map(([cos]) => cos)).toEqual([{ title: 'Hort', icon: '🌿' }, { title: 'Hort' }]);
  expect(primer).toEqual({ resultat: [{ title: 'Hort' }], descartats: ['icon'] });
  expect(opcionals.absents()).toEqual(['icon']);

  // Recordada: la segona vegada no hi ha cap petició fallida.
  const segon = await opcionals.envia({ lead: 'Entradilla', icon: '🍅' }, peticio);
  expect(peticio).toHaveBeenCalledTimes(3);
  expect(peticio.mock.calls[2][0]).toEqual({ lead: 'Entradilla' });
  expect(segon.descartats).toEqual(['icon']);
});

test('si només quedava la columna absent, no hi ha petició: ErrorColumnaAbsent, classificat com a columna', async () => {
  const opcionals = creaColumnesOpcionals('notes', { icon: 'icon' });
  const peticio = vi.fn(async () => { throw pgrst204('icon'); });
  const error = await opcionals.envia({ icon: '🌿' }, peticio).catch((e) => e);
  expect(peticio).toHaveBeenCalledTimes(1);
  expect(error.name).toBe('ErrorColumnaAbsent');
  expect(error.camps).toEqual(['icon']);
  expect(error.message).toContain('«icon»');
  expect(classificaError(error)).toMatchObject({ tipus: 'columna', columna: 'icon' });
  await expect(opcionals.envia({ icon: '🍅' }, peticio)).rejects.toMatchObject({ name: 'ErrorColumnaAbsent' });
  expect(peticio).toHaveBeenCalledTimes(1);
});

test('reutilitzable: mapa camp → columna, i també la forma 42703 de PostgreSQL', async () => {
  const opcionals = creaColumnesOpcionals('notes', { icon: 'icon', publishDate: 'publish_date' });
  const peticio = vi.fn(async (cos) => {
    if ('publish_date' in cos) throw postgres42703('publish_date');
    return cos;
  });
  const { resultat, descartats } = await opcionals.envia({ title: 'T', publish_date: '2026-09-28T10:00:00Z' }, peticio);
  expect(resultat).toEqual({ title: 'T' });
  expect(descartats).toEqual(['publishDate']);
});

test('una columna que NO és opcional continua sent un error: mai s’amaga', async () => {
  const opcionals = creaColumnesOpcionals('notes', { icon: 'icon' });
  const peticio = vi.fn(async () => { throw pgrst204('title'); });
  await expect(opcionals.envia({ title: 'T', icon: '🌿' }, peticio)).rejects.toThrow("'title'");
  expect(peticio).toHaveBeenCalledTimes(1);
  expect(opcionals.absents()).toEqual([]);
  // I un error qualsevol (xarxa, 409) tampoc es toca.
  const conflicte = Object.assign(new Error('Conflicte'), { status: 409 });
  await expect(opcionals.envia({ icon: '🌿' }, async () => { throw conflicte; })).rejects.toBe(conflicte);
});

test('ambDescartats només marca el DTO quan hi ha camps no desats', () => {
  const dto = { id: 'n', revision: 2 };
  expect(ambDescartats(dto, [])).toBe(dto);
  expect(ambDescartats(dto, ['icon'])).toEqual({ id: 'n', revision: 2, campsNoDesats: ['icon'] });
});
