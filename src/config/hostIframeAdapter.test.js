import { expect, test, vi } from 'vitest';
vi.mock('../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { configura, arrenca, exposaGlobal, injectaBackendDelPaquet } from '../host.js';
import { fixaCapaDelPaquet } from './capaDelPaquet.js';

test('T18 · el pont iframe valida origen/pare i espera la decisió de l’adaptador injectat', async () => {
  const parent = { postMessage: vi.fn() };
  const parentGetter = vi.spyOn(window, 'parent', 'get').mockReturnValue(parent);
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const backend = Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, vi.fn()]));
  let accepta;
  backend.adoptaSessioExterna = vi.fn(() => new Promise(resolve => { accepta = resolve; }));
  const origin = 'https://cms.example.test';
  /* Model B (correcció de l'A1): les opcions del pare són un canal de
     l'amfitrió. El tenant i el relé d'OAuth que hi porta no arriben a
     l'adaptador; la resta (emissorEsperat), sí. */
  const send = (from = origin, source = parent) => window.dispatchEvent(new MessageEvent('message', {
    origin: from, source,
    data: { type: 'SDP_HOST_CMD', cmd: 'injectaSessio', requestId: 'entrada',
      payload: { sessio: { opaque: 'sessio-cms' }, opcions: {
        tenantId: '00000000-0000-4000-8000-000000000000', oauthRelayUrl: 'https://socdepoble.sollutia.com/cb',
        emissorEsperat: 'https://emissor.example.test' } } }
  }));
  try {
    // Model B (A1, 261003): l'adaptador i el seu backend, per les vies internes del paquet.
    fixaCapaDelPaquet({ backendId: 'adaptador-de-prova', supabaseUrl: `${origin}/api` });
    injectaBackendDelPaquet(backend);
    configura({ auth: { parentOrigins: [origin] } });
    await arrenca();
    exposaGlobal({});
    parent.postMessage.mockClear();
    send('https://intrus.example.test');
    send(origin, { postMessage: vi.fn() });
    expect(backend.adoptaSessioExterna).not.toHaveBeenCalled();

    send();
    expect(backend.adoptaSessioExterna).toHaveBeenCalledWith({ opaque: 'sessio-cms' }, { emissorEsperat: 'https://emissor.example.test' });
    const delModelB = avis.mock.calls.map((crida) => crida.join(' ')).filter((text) => text.includes('Model B'));
    expect(delModelB).toEqual([expect.stringContaining('«sessio» porta tenantId, oauthRelayUrl')]);
    expect(parent.postMessage).not.toHaveBeenCalled();
    accepta(true);
    await vi.waitFor(() => expect(parent.postMessage).toHaveBeenCalledWith({
      type: 'SDP_HOST_ACK', cmd: 'injectaSessio', requestId: 'entrada', ok: true, result: null, error: null
    }, origin));

    parent.postMessage.mockClear();
    backend.adoptaSessioExterna.mockRejectedValueOnce(new Error('rebutjada'));
    send();
    await vi.waitFor(() => expect(parent.postMessage).toHaveBeenCalledWith(expect.objectContaining({
      ok: false, error: 'Sessió invàlida o rebutjada'
    }), origin));
  } finally { parentGetter.mockRestore(); avis.mockRestore(); }
});
