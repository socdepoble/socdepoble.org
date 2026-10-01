import { expect, test, vi } from 'vitest';
vi.mock('../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { configura, arrenca, exposaGlobal } from '../host.js';

test('T18 · el pont iframe valida origen/pare i espera la decisió de l’adaptador injectat', async () => {
  const parent = { postMessage: vi.fn() };
  const parentGetter = vi.spyOn(window, 'parent', 'get').mockReturnValue(parent);
  const backend = Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, vi.fn()]));
  let accepta;
  backend.adoptaSessioExterna = vi.fn(() => new Promise(resolve => { accepta = resolve; }));
  const origin = 'https://cms.example.test';
  const send = (from = origin, source = parent) => window.dispatchEvent(new MessageEvent('message', {
    origin: from, source,
    data: { type: 'SDP_HOST_CMD', cmd: 'injectaSessio', requestId: 'entrada',
      payload: { sessio: { opaque: 'sessio-cms' }, opcions: { tenantId: '00000000-0000-4000-8000-000000000000' } } }
  }));
  try {
    configura({ backend, config: { backendId: 'wordpress', backendUrl: `${origin}/api` },
      auth: { parentOrigins: [origin] } });
    await arrenca();
    exposaGlobal({});
    parent.postMessage.mockClear();
    send('https://intrus.example.test');
    send(origin, { postMessage: vi.fn() });
    expect(backend.adoptaSessioExterna).not.toHaveBeenCalled();

    send();
    expect(backend.adoptaSessioExterna).toHaveBeenCalledWith({ opaque: 'sessio-cms' }, { tenantId: '00000000-0000-4000-8000-000000000000' });
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
  } finally { parentGetter.mockRestore(); }
});
