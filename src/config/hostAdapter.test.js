import { expect, test, vi } from 'vitest';
vi.mock('../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { configura, arrenca, injectaSessio, injectaBackendDelPaquet } from '../host.js';
import { getBackendImplementation } from '../data/backendPort.js';
import { normalizeBackendConfig } from './backendConfig.js';
import { fixaCapaDelPaquet } from './capaDelPaquet.js';

/* Model B (A1 i A3, 261003): un adaptador complet i el seu backend només
   entren per les vies internes del paquet; configura() de l'amfitrió hi posa
   la sessió i res més. Valors sintètics. */
test('un adaptador complet del paquet entra per la via interna, amb el backend i el tenant de la capa del paquet', async () => {
  expect(() => injectaBackendDelPaquet({})).toThrow('Nucli incomplet');
  const backend = Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, vi.fn()]));
  backend.adoptaSessioExterna = vi.fn(() => true);
  backend.loadNotes.mockResolvedValue({ notes: [{ id: 'nota-de-l-adaptador' }] });
  const paquet = { supabaseUrl: 'https://adaptador.example.test/api/v1', tenantId: '00000000-0000-0000-0000-000000000000', backendId: 'adaptador-de-prova' };
  fixaCapaDelPaquet(paquet);
  const fetch = vi.spyOn(globalThis, 'fetch');
  try {
    expect(injectaBackendDelPaquet(backend).pendents).toEqual([]);
    const result = configura({});
    expect(result.descartades).toEqual([]);
    await arrenca();
    const normalized = normalizeBackendConfig();
    expect(normalized).toMatchObject({ backendUrl: paquet.supabaseUrl, tenantId: paquet.tenantId, backendId: 'adaptador-de-prova' });
    expect(await getBackendImplementation().loadNotes('local-user', normalized)).toEqual({ notes: [{ id: 'nota-de-l-adaptador' }] });
    expect(injectaSessio({ session: 'opaque-host-session' })).toBe(true);
    expect(backend.adoptaSessioExterna).toHaveBeenCalledWith({ session: 'opaque-host-session' }, {});
    // Les opcions de l'amfitrió arriben a l'adaptador sense les claus del paquet (correcció de l'A1).
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const opcions = Object.freeze({ tenant_id: paquet.tenantId, supabaseUrl: 'https://altre.example.test', emissorEsperat: 'https://emissor.example.test' });
      expect(injectaSessio({ session: 'opaque-host-session' }, opcions)).toBe(true);
      expect(backend.adoptaSessioExterna).toHaveBeenLastCalledWith({ session: 'opaque-host-session' }, { emissorEsperat: 'https://emissor.example.test' });
      expect(avis.mock.calls.map((crida) => crida.join(' '))).toEqual([expect.stringContaining('«sessio» porta tenant_id, supabaseUrl')]);
    } finally { avis.mockRestore(); }
    expect(fetch).not.toHaveBeenCalled();
    expect(() => injectaBackendDelPaquet(backend)).toThrow('arrancada');
    expect(() => configura({})).toThrow('arrancada');
  } finally { fetch.mockRestore(); }
});
