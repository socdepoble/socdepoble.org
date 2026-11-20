/* Gauntlet v1.2.13 · Una fila hostil (600 emojis, marques combinants seguides, caràcters de control) o una
   justificació llarga no poden tombar la safata LSSI d'administració. */
import { describe, expect, test } from 'vitest';
import { aplicaRevisioDenunciaDiligent, carregaSafataDenunciesDiligents, coaccionaFilaSafataRemota } from './serveiSafataDenunciesDiligents.js';
import { filaDenunciaDiligent } from '../../../data/moderacio/denunciesDiligents.js';

const ID = '11111111-2222-4333-8444-555555555555';
const PUB = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const fila = (detall) => ({ id: ID, publicacioId: PUB, motiu: 'altre', detall, estat: 'rebuda', versio: 1 });

describe('Gauntlet v1.2.13 · safata LSSI davant de files hostils', () => {
  test('600 emojis, 70 marques combinants seguides o un surrogat solt no llancen', () => {
    for (const detall of ['😀'.repeat(600), `a${'́'.repeat(70)}`, 'x\ud800y']) {
      expect(() => coaccionaFilaSafataRemota(fila(detall)), JSON.stringify(detall.slice(0, 8))).not.toThrow();
    }
  });

  test('el port llig el detall sense els caràcters de control en lloc de fer fallar la llista', () => {
    const neta = filaDenunciaDiligent(fila('Evidència\u0001 amb\u0007 control'));
    expect(neta.detall).toBe('Evidència amb control');
    expect(filaDenunciaDiligent(fila('\u0001\u0002')).detall).toBe('');
    // L'estructura continua sent estricta: un estat desconegut encara es refusa.
    expect(() => filaDenunciaDiligent({ ...fila('ok'), estat: 'inventat' })).toThrow();
  });

  const CONFIG_REMOT = { backendId: 'supabase', dataMode: 'remote', supabaseUrl: 'https://socdepoble.supabase.co',
    supabaseAnonKey: 'anon-test-key', tenantId: '00000000-0000-4000-8000-000000000001' };

  test('una justificació de 1.500 caràcters (el textarea en permet 2.000) arriba al port sense llançar', async () => {
    let rebuda = null;
    const port = { teCapacitat: () => true, revisaDenunciaDiligent: async (entrada) => { rebuda = entrada; return { id: entrada.id, estat: entrada.estat, versio: entrada.versio + 1, repetida: false }; } };
    await expect(aplicaRevisioDenunciaDiligent({ id: ID, estatEsperat: 'rebuda', versio: 1, estat: 'en_revisio', justificacio: 'a'.repeat(1500), config: CONFIG_REMOT }, port)).resolves.toBeTruthy();
    expect(Array.from(rebuda.justificacio).length).toBe(1500);
  });

  test('una fila que llança en llegir-la es descarta i les altres continuen arribant', async () => {
    const hostil = {};
    Object.defineProperty(hostil, 'id', { enumerable: true, get() { throw new Error('getter hostil'); } });
    const bona = fila('Evidència');
    const port = { teCapacitat: () => true, llistaDenunciesDiligents: async () => [hostil, bona] };
    const safata = await carregaSafataDenunciesDiligents({ filtre: 'pendent', config: CONFIG_REMOT }, port);
    expect(safata.disponibleRemot).toBe(true);
    expect(safata.remotes.map((r) => r.id)).toEqual([ID]);
  });
});
