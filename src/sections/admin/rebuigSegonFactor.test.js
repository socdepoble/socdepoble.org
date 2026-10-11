// @vitest-environment node
/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El rebuig del servidor per
   falta del segon factor, tal com arriba del port (runtime.request embolcalla
   el cos de PostgREST) o ja traduït per l'adaptador. Pur. */
import { describe, expect, test } from 'vitest';
import { TEXT_CAL_SEGON_FACTOR, esRebuigDeSegonFactor } from './rebuigSegonFactor.js';
import { CODI_PERSONALITZACIO, errorDePersonalitzacio } from '../../data/errorsBackend.js';

const dePostgrest = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${JSON.stringify(cos)}`), { status });

describe('esRebuigDeSegonFactor', () => {
  test('el 42501 d’una funció del Tauler amb «SDP-ADMIN», servit com a 403 per PostgREST', () => {
    expect(esRebuigDeSegonFactor(dePostgrest(403, { code: '42501', message: 'SDP-ADMIN-001: cal rol de superadmin.', details: null, hint: null }))).toBe(true);
    expect(esRebuigDeSegonFactor(dePostgrest(403, { code: '42501', message: 'SDP-ADMIN-002: cal rol de superadmin.' }))).toBe(true);
    // El cos sense l'estat davant, o l'estat sense el codi al cos.
    expect(esRebuigDeSegonFactor(Object.assign(new Error('{"code":"42501","message":"SDP-ADMIN-001: cal rol de superadmin."}'), { status: 403 }))).toBe(true);
    expect(esRebuigDeSegonFactor(Object.assign(new Error('SDP-ADMIN-001: cal rol de superadmin.'), { code: '42501' }))).toBe(true);
    expect(esRebuigDeSegonFactor(Object.assign(new Error('SDP-ADMIN-001: cal rol de superadmin.'), { status: 403 }))).toBe(true);
  });

  test('un error que el port ja ha traduït a «cal segon factor»', () => {
    expect(esRebuigDeSegonFactor(errorDePersonalitzacio(CODI_PERSONALITZACIO.CAL_SEGON_FACTOR))).toBe(true);
    expect(esRebuigDeSegonFactor(errorDePersonalitzacio(CODI_PERSONALITZACIO.CONFLICTE_VERSIO))).toBe(false);
  });

  test('un 42501 sense «SDP-ADMIN» continua sent l’error de permisos de sempre; la xarxa i la resta, tampoc', () => {
    expect(esRebuigDeSegonFactor(Object.assign(new Error('permission denied'), { code: '42501' }))).toBe(false);
    expect(esRebuigDeSegonFactor(dePostgrest(403, { code: '42501', message: 'permission denied for table profiles' }))).toBe(false);
    expect(esRebuigDeSegonFactor(dePostgrest(404, { code: 'PGRST202', message: 'Could not find the function' }))).toBe(false);
    expect(esRebuigDeSegonFactor(new Error('42501'))).toBe(false);
    expect(esRebuigDeSegonFactor(new TypeError('Failed to fetch'))).toBe(false);
    expect(esRebuigDeSegonFactor(Object.assign(new Error('SDP-ADMIN-001 en un 500'), { status: 500 }))).toBe(false);
    expect(esRebuigDeSegonFactor(null)).toBe(false);
    expect(esRebuigDeSegonFactor('SDP-ADMIN-001')).toBe(false);
    expect(esRebuigDeSegonFactor(undefined)).toBe(false);
  });

  test('el text diu què cal fer i on, sense parlar de xarxa', () => {
    expect(TEXT_CAL_SEGON_FACTOR).toMatch(/^Cal confirmar el segon factor/);
    expect(TEXT_CAL_SEGON_FACTOR).toContain('Tauler');
    expect(TEXT_CAL_SEGON_FACTOR).toContain('El compte');
    expect(TEXT_CAL_SEGON_FACTOR).not.toMatch(/xarxa/i);
  });
});
