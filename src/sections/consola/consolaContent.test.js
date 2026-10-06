import { afterEach, describe, expect, it, vi } from 'vitest';
import { FONT_CONSOLA, carregaConsola, normalitza } from './consolaContent.js';

/* La lectura de /__iaia/consola.json, amb el mateix criteri que carregaMapa:
   absència si no hi ha middleware, error si el middleware falla. */

const minima = () => ({
  generat: '2026-09-25T13:00:00.000Z',
  rebuts: [], consums: [], credits: null,
  skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: '', core: true, alDisc: true, alManifest: true }],
  segell: null,
  immunitari: { operacions: 2 }
});

const resposta = (status, cos, tipus = 'application/json; charset=utf-8') => ({
  status,
  ok: status >= 200 && status < 300,
  statusText: String(status),
  headers: { get: (nom) => (nom.toLowerCase() === 'content-type' ? tipus : null) },
  json: vi.fn(async () => cos)
});

afterEach(() => vi.unstubAllGlobals());

describe('carregaConsola', () => {
  it('llig i normalitza la font JSON sense memòria cau', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(200, minima())));
    const dades = await carregaConsola();
    expect(fetch).toHaveBeenCalledWith(FONT_CONSOLA, expect.objectContaining({ cache: 'no-store' }));
    expect(dades.skills.map((s) => s.nom)).toEqual(['sdp-workflow']);
    expect(dades.immunitari.operacions).toBe(2);
  });

  it('404 vol dir que no hi ha consola en este entorn', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(404, null)));
    await expect(carregaConsola()).resolves.toBeNull();
  });

  it('l’HTML de l’aplicació (servidor sense middleware) és absència, no una consola trencada', async () => {
    const r = resposta(200, null, 'text/html');
    vi.stubGlobal('fetch', vi.fn(async () => r));
    await expect(carregaConsola()).resolves.toBeNull();
    expect(r.json).not.toHaveBeenCalled();
  });

  it('una resposta sense content-type tampoc no es parseja', async () => {
    const r = { ...resposta(200, minima()), headers: { get: () => null } };
    vi.stubGlobal('fetch', vi.fn(async () => r));
    await expect(carregaConsola()).resolves.toBeNull();
    expect(r.json).not.toHaveBeenCalled();
  });

  it('un error del middleware es diu en veu alta', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(500, { error: 'x' })));
    await expect(carregaConsola()).rejects.toThrow('Consola 500');
  });

  it('un JSON que no complix el contracte falla, no es pinta com si res', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(200, { ...minima(), skills: 'no' })));
    await expect(carregaConsola()).rejects.toThrow('Resposta de consola invàlida: skills.');
  });
});

describe('normalitza · el que la Consola ja no pinta', () => {
  /* Fase A (pas 2.2 del pla, 261006) · Sense panell de Crèdits, un credits.json o
     una estratègia mal formats no poden tombar consola.json sencer. */
  it('credits i estrategia_consum no es validen ni es conserven', () => {
    const dades = normalitza({ ...minima(), credits: [{ proveidor: 'P', tipus: 'ajust', valor: '' }], estrategia_consum: null });
    expect(dades).not.toHaveProperty('credits');
    expect(dades).not.toHaveProperty('estrategia_consum');
  });
});

describe('normalitza · termometria', () => {
  it('sense termometria, null: el pols diu que la càrrega no es mesura', () => {
    expect(normalitza(minima()).termometria).toBeNull();
    expect(normalitza({ ...minima(), termometria: null }).termometria).toBeNull();
  });

  it('si la font la porta, es conserva (abans es perdia ací)', () => {
    const dades = normalitza({ ...minima(), termometria: { artefactesActius: 162, abast: 'Escriptori i actes vives' } });
    expect(dades.termometria).toEqual({ artefactesActius: 162, abast: 'Escriptori i actes vives' });
  });

  it('un abast nul o absent no invalida la instantània', () => {
    expect(normalitza({ ...minima(), termometria: { artefactesActius: 3, abast: null } }).termometria)
      .toEqual({ artefactesActius: 3, abast: '' });
    expect(normalitza({ ...minima(), termometria: { artefactesActius: 3 } }).termometria.abast).toBe('');
  });

  it('una termometria que no complix el contracte falla en veu alta', () => {
    expect(() => normalitza({ ...minima(), termometria: { artefactesActius: -1 } }))
      .toThrow('Resposta de consola invàlida: termometria.artefactesActius.');
    expect(() => normalitza({ ...minima(), termometria: 'molta' }))
      .toThrow('Resposta de consola invàlida: termometria.');
  });
});
