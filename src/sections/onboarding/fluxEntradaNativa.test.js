/* Fase D (261020, tasca 1) · Les dues fases de l'entrada nativa
   (fluxEntradaNativa.js), amb dobles per al full, el port i l'oblit. */
import { describe, expect, test, vi } from 'vitest';
import { entraAmbProveidorNatiu } from './fluxEntradaNativa.js';
import { CODI_ENTRADA_NATIVA } from '../../config/entradaNativa.js';

const CREDENCIAL = Object.freeze({ testimoni: 'a.b.c', nonce: 'n'.repeat(64), testimoniAcces: null, nom: 'Maria' });
const CONFIG = Object.freeze({ dataMode: 'remote' });
const dobles = (extra = {}) => ({
  demana: vi.fn(async () => CREDENCIAL),
  oblida: vi.fn(),
  entra: vi.fn(async () => ({ user: { id: 'U' } })),
  ...extra
});

describe('entraAmbProveidorNatiu', () => {
  test('passa la credencial tal qual al port, torna la seua resposta i oblida després', async () => {
    const d = dobles();
    await expect(entraAmbProveidorNatiu('apple', d.entra, CONFIG, d)).resolves.toEqual({ user: { id: 'U' } });
    expect(d.demana).toHaveBeenCalledWith('apple', { viu: expect.any(Function) });
    expect(d.entra).toHaveBeenCalledWith('apple', { ...CREDENCIAL }, CONFIG);
    expect(d.oblida).toHaveBeenCalledWith('apple');
    expect(d.entra.mock.invocationCallOrder[0]).toBeLessThan(d.oblida.mock.invocationCallOrder[0]);
  });

  test('si el port rebutja, l’error puja i també s’oblida', async () => {
    const error = Object.assign(new Error('rebutjat'), { code: 'token-rebutjat' });
    const d = dobles({ entra: vi.fn(async () => { throw error; }) });
    await expect(entraAmbProveidorNatiu('google', d.entra, CONFIG, d)).rejects.toBe(error);
    expect(d.oblida).toHaveBeenCalledWith('google');
  });

  test('si la vista ja ha deixat l’intent: cap fase 2, s’oblida i l’error és CANCELADA', async () => {
    const d = dobles({ viu: () => false });
    await expect(entraAmbProveidorNatiu('apple', d.entra, CONFIG, d)).rejects.toMatchObject({ code: CODI_ENTRADA_NATIVA.CANCELADA });
    // Fase D (261020, revisió) · El mateix viu baixa a la fase 1.
    expect(d.demana.mock.calls[0][1].viu).toBe(d.viu);
    expect(d.entra).not.toHaveBeenCalled();
    expect(d.oblida).toHaveBeenCalledWith('apple');
  });

  test('si la persona tanca el full (fase 1), ni port ni oblit', async () => {
    const cancelada = Object.assign(new Error('tancat'), { code: CODI_ENTRADA_NATIVA.CANCELADA });
    const d = dobles({ demana: vi.fn(async () => { throw cancelada; }) });
    await expect(entraAmbProveidorNatiu('apple', d.entra, CONFIG, d)).rejects.toBe(cancelada);
    expect(d.entra).not.toHaveBeenCalled();
    expect(d.oblida).not.toHaveBeenCalled();
  });
});
