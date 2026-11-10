/* PRODUCCIO-01 (R15b) · Dos magatzems del mateix abast (el mateix compte en dues pestanyes del Mas) comparteixen un
   sol bloqueig d'escriptura (Web Locks) i una sola base. El segon catàleg queda lector i el seu desament falla amb
   NOMES_LECTURA (el selector ho diu: tanca l'altra pestanya); quan la primera es tanca, agafa el relleu. Una superfície
   que només llig (el Mur, el Mercat: `lectora`) no agafa el bloqueig: el catàleg de l'altra pestanya hi desa. */
import { describe, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../utils/__fixtures__/navegadorFals.js';
import { creaServeiProjeccionsCataleg } from './projeccionsCatalegServei.js';

const SCOPE = { tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', ownerId: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', backendId: 'sdp-local' };
const FONT = { font: 'herbari', id: 'romer', title: 'Romer', subtitle: 'Salvia rosmarinus', lead: '' };
const espera = (ms = 5) => new Promise((resolve) => { setTimeout(resolve, ms); });
function navegador() {
  const { idb } = creaIdbFals();
  const comu = { idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal, subtil: webcrypto.subtle };
  return (extra = {}) => creaServeiProjeccionsCataleg({ abast: SCOPE, ...comu, ...extra });
}

describe('dos magatzems del mateix abast', () => {
  test('el segon catàleg és lector: desa falla amb NOMES_LECTURA fins que la primera pestanya es tanca', async () => {
    const pestanya = navegador();
    const a = pestanya(), b = pestanya();
    await a.prepara(); await b.prepara();
    expect([a.mode, b.mode]).toEqual(['escriptora', 'lectora']);
    await expect(b.desa(FONT, ['mur'])).rejects.toMatchObject({ codi: 'NOMES_LECTURA' });
    await a.desa(FONT, ['mur']);
    expect((await b.llista()).map(row => row.destins)).toEqual([['mur']]);
    a.tanca();
    await espera();
    expect(b.mode).toBe('escriptora');
    await b.desa(FONT, ['mur', 'herbari']);
    expect((await b.llista()).map(row => [row.destins, row.seq])).toEqual([[['mur', 'herbari'], 2]]);
    b.tanca();
  });

  test('el Mur (lector) obert abans no agafa el bloqueig: el catàleg de l’altra pestanya hi desa i el Mur ho llig', async () => {
    const pestanya = navegador();
    const mur = pestanya({ lectora: true }), cataleg = pestanya();
    const avisos = [];
    mur.subscriu(avis => avisos.push(avis));
    await mur.prepara();
    expect(mur.mode).toBe('lliure');
    await cataleg.prepara();
    expect(cataleg.mode).toBe('escriptora');
    await cataleg.desa(FONT, ['mur']);
    await espera();
    expect(avisos).toContainEqual({ tipus: 'canvi', store: 'projeccions', local: false });
    expect((await mur.llista()).map(row => row.font.id)).toEqual(['romer']);
    mur.tanca(); cataleg.tanca();
  });

  test('el lector no escriu mai: ni desa ni sincronitza', async () => {
    const pestanya = navegador();
    const publica = vi.fn();
    const mur = pestanya({ lectora: true, publica });
    await mur.prepara();
    await expect(mur.desa(FONT, ['mur'])).rejects.toMatchObject({ codi: 'nomes-lectura' });
    await expect(mur.sincronitza()).rejects.toMatchObject({ codi: 'nomes-lectura' });
    expect(publica).not.toHaveBeenCalled();
    expect(await mur.llista()).toEqual([]);
    mur.tanca();
  });
});
