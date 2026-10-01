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

describe('normalitza · crèdits', () => {
  /* Les cinc files literals de .agents/credits.json (261001): una quota i
     quatre ajustos, tres d'ells en text. Abans el primer ajust de text
     tombava consola.json sencer i el pols deia «No s’han pogut llegir les dades». */
  const creditsReals = [
    { proveidor: 'ChatGPT Pro 100 (Límit Setmanal %)', consumit: 60, limit: 100 },
    { proveidor: 'Crèdits restants (Codex / Work)', valor: '1702 crèdits', tipus: 'ajust', actiu: true },
    { proveidor: 'Recàrrega automàtica', valor: 'DESACTIVADA', tipus: 'ajust', actiu: false },
    { proveidor: 'Permetre ús de restabliments automàticament (<10%)', valor: 'ACTIVAT', tipus: 'ajust', actiu: true },
    { proveidor: 'Restabliments complets disponibles', valor: 1, tipus: 'ajust', actiu: true }
  ];

  it('els ajustos en text o en número es conserven tal com es pinten', () => {
    const dades = normalitza({ ...minima(), credits: creditsReals });
    expect(dades.credits.map((c) => c.tipus)).toEqual(['quota', 'ajust', 'ajust', 'ajust', 'ajust']);
    expect(dades.credits.slice(1).map((c) => c.valor)).toEqual(['1702 crèdits', 'DESACTIVADA', 'ACTIVAT', 1]);
    expect(dades.credits[2].actiu).toBe(false);
  });

  it('un ajust sense valor llegible falla en veu alta', () => {
    const ajust = (valor) => ({ ...minima(), credits: [{ proveidor: 'P', tipus: 'ajust', valor }] });
    for (const valor of ['', '   ', -1, 1.5, null, undefined, {}]) {
      expect(() => normalitza(ajust(valor))).toThrow('Resposta de consola invàlida: credits[0].valor.');
    }
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
