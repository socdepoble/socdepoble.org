/* T1 · D01 (assalt 261101) · Model B de punta a punta: l'adaptador local
   entra pel camí intern del paquet (host.injectaBackendDelPaquet), arrenca()
   el segella, teCapacitat diu cada capacitat que declara (i cap de les que
   deixa a posta) i les lectures passen per les guardes del port
   (lligAmbGuardes), sense cap petició de xarxa. És la prova d'endollabilitat:
   cap entrada de producció l'importa (adaptadorLocal.test.js ho vigila). */
import { expect, test, vi } from 'vitest';
vi.mock('../../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
import { CAPACITATS, CONTRACTE_BACKEND } from '../contracte.js';
import { arrenca, configura, injectaBackendDelPaquet } from '../../host.js';
import {
  getDefaultUserId, listPublicOrganizations, loadCoreContent, loadFils, loadMur, loadNotes, teCapacitat
} from '../backendPort.js';
import { fixaCapaDelPaquet } from '../../config/capaDelPaquet.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { CAPACITATS_NO_DECLARADES, creaAdaptadorLocal } from './adaptadorLocal.js';

const TENANT = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';

test('l’adaptador local entra pel paquet, arrenca segellat i servix lectures pel port sense xarxa', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  try {
    fixaCapaDelPaquet({ backendId: 'sdp-local', dataMode: 'seed', tenantId: TENANT });
    const adaptador = creaAdaptadorLocal({ tenantId: TENANT });
    const declarats = CONTRACTE_BACKEND.filter((metode) => typeof adaptador[metode] === 'function');
    const resultat = injectaBackendDelPaquet(adaptador);
    expect(resultat.pendents).toEqual([]);
    expect([...resultat.acceptats].sort()).toEqual([...declarats].sort());
    expect(configura({}).descartades).toEqual([]);
    await arrenca();
    expect(normalizeBackendConfig()).toMatchObject({ backendId: 'sdp-local', tenantId: TENANT, dataMode: 'seed' });

    for (const capacitat of Object.keys(CAPACITATS)) {
      expect(teCapacitat(capacitat), capacitat).toBe(!CAPACITATS_NO_DECLARADES.includes(capacitat));
    }

    const usuari = getDefaultUserId();
    expect(usuari).toEqual(expect.any(String));
    const mur = await loadMur(usuari, {});
    expect(Object.keys(mur).sort()).toEqual(['events', 'feedPosts', 'marketItems']);
    const core = await loadCoreContent(usuari, {});
    expect(core.pages.length).toBeGreaterThan(0);
    expect(Array.isArray(await loadFils({}))).toBe(true);
    expect(Array.isArray((await loadNotes(usuari, {})).notes)).toBe(true);
    expect((await listPublicOrganizations({}, {})).length).toBeGreaterThan(0);
    /* Les guardes del port: un senyal avortat no arriba a l'adaptador. */
    const ac = new AbortController();
    ac.abort();
    await expect(loadMur(usuari, { signal: ac.signal })).rejects.toMatchObject({ name: 'AbortError' });

    expect(fetch).not.toHaveBeenCalled();
    expect(() => injectaBackendDelPaquet(adaptador)).toThrow('arrancada');
    expect(() => configura({})).toThrow('arrancada');
  } finally { fetch.mockRestore(); }
});
