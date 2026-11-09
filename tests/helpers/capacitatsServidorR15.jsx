/** Test-only · Sanejament R15 (B2 · P1-01, R15-REG-05, Q-06). L'escenari compartit de
 * src/data/supabase/capacitatsServidor.{senseBanderes,ambBanderes}.r15.test.jsx: l'adaptador
 * Supabase REAL al port, la xarxa interceptada a fetch (el client de Functions és un doble
 * que, com supabase-js, fa POST a /functions/v1/<nom>), i els tres camins del kit R54:
 * la IAIA amb servidor, el ritme del xat i el desvetllador. Cada fitxer fixa les banderes de
 * build abans d'importar res (vi.hoisted) i declara els mocks d'identitat i de config.js. */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as port from '../../src/data/backendPort.js';
import * as supabase from '../../src/data/supabase/index.js';
import * as iaiaServidor from '../../src/data/supabase/iaia.js';
import * as ritmeServidor from '../../src/data/supabase/xatRitme.js';
import { despertaXatConfirmat } from '../../src/data/supabase/despertaXat.js';
import { XatContext, useXat } from '../../src/sections/xat/XatContext.jsx';
import IAIAProvider from '../../src/sections/xat/IAIAProvider.jsx';
import { ID_FIL_LOCAL_IAIA } from '../../src/sections/xat/useObriXatPerDefecte.js';
import { useRitmeXat } from '../../src/sections/xat/useRitmeXat.js';
import { URL_SUPABASE, clientDeFunctions } from './clientFunctionsR15.js';

export const ACTOR = '10000000-0000-4000-8000-000000000001';
const FIL = '20000000-0000-4000-8000-000000000001';
const MISSATGE = '40000000-0000-4000-8000-000000000001';
const CONFIG = Object.freeze({ dataMode: 'remote', supabaseUrl: URL_SUPABASE, supabaseAnonKey: 'sb_publishable_fixturesintetica' });

const json = (cos, status = 200) => new Response(JSON.stringify(cos), { status, headers: { 'content-type': 'application/json' } });
function respon(url, init) {
  const ruta = new URL(url).pathname;
  const cos = init?.body ? JSON.parse(init.body) : null;
  if (ruta === '/functions/v1/iaia') {
    if (cos?.mode === 'discover') return json({ source: 'configuration', inference: false, available: true, group: null });
    if (cos?.mode === 'direct') return json({ source: 'model', inference: true, requestId: cos.requestId, text: 'Resposta del model propi' });
  }
  if (ruta === '/functions/v1/notifica-xat-desperta') return json({ ok: true });
  if (ruta === '/rest/v1/rpc/xat_ritme') return json({ rebutPelsAltresFinsSeq: 3, llegitPelsAltresFinsSeq: 1, escrivint: [] });
  if (ruta === '/rest/v1/rpc/xat_presencia') return json({ acceptat: true });
  return json({ message: 'no trobat' }, 404);
}

export const crides = (fetchFals) => fetchFals.mock.calls.map(([url]) => new URL(String(url)).pathname);

/** Registra les proves. `amb`: les banderes VITE_SDP_XAT_RITME i VITE_SDP_IAIA_SERVIDOR valen '1'. */
export function escenariCapacitatsServidor({ amb }) {
  let fetchFals;
  beforeEach(() => {
    fetchFals = vi.fn(async (url, init) => respon(String(url), init));
    vi.stubGlobal('fetch', fetchFals);
    // Com fan les altres proves del port: a vitest el namespace exposa getters; el navegador, valors.
    port.setBackendImplementation({ ...supabase });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  describe(amb ? 'amb les banderes literals, el comportament del kit R54' : 'sense banderes, cap capacitat sense backend', () => {
    it('les banderes del procés de prova són les que diu el fitxer', () => {
      expect([import.meta.env.VITE_SDP_XAT_RITME, import.meta.env.VITE_SDP_IAIA_SERVIDOR]).toEqual(amb ? ['1', '1'] : ['', '']);
    });

    it(amb ? 'l’adaptador anuncia iaia i xatRitme amb les funcions reals' : 'l’adaptador no anuncia iaia ni xatRitme: els exports valen undefined i el port els tracta com a absents', () => {
      if (amb) {
        expect(supabase.consultaIAIA).toBe(iaiaServidor.consultaIAIA);
        expect(supabase.loadRitmeXat).toBe(ritmeServidor.loadRitmeXat);
        expect(supabase.actualitzaPresenciaXat).toBe(ritmeServidor.actualitzaPresenciaXat);
      } else {
        for (const nom of ['consultaIAIA', 'loadRitmeXat', 'actualitzaPresenciaXat']) {
          expect(Object.hasOwn(supabase, nom), nom).toBe(true);
          expect(supabase[nom], nom).toBeUndefined();
        }
        expect(() => port.consultaIAIA({ mode: 'discover' })).toThrow(/no està implementat/);
        expect(() => port.loadRitmeXat(FIL)).toThrow(/no està implementat/);
      }
      expect(port.teCapacitat('iaia')).toBe(amb);
      expect(port.teCapacitat('xatRitme')).toBe(amb);
      // La resta de l'adaptador no canvia: les altres capacitats R54 i anteriors continuen.
      for (const cap of ['clausXat', 'avisosPush', 'silenciXat', 'xatMultimedia']) expect(port.teCapacitat(cap), cap).toBe(true);
      expect(fetchFals).not.toHaveBeenCalled();
    });

    it(amb ? 'IAIA: discover i consulta directa a functions/v1/iaia, amb la resposta del model' : 'IAIA: cap petició a functions/v1/iaia (ni discover ni la pregunta) i respon la IAIA local', async () => {
      const valor = { modeDades: 'remote', joId: ACTOR, ambitEstable: 'r15', senseSessio: false, chatThreads: [], sendChatMessage: vi.fn(async () => []), getThreadMessages: () => [], recarregaFil: vi.fn() };
      const wrapper = ({ children }) => <XatContext.Provider value={valor}><IAIAProvider>{children}</IAIAProvider></XatContext.Provider>;
      const { result } = renderHook(useXat, { wrapper });
      if (amb) await waitFor(() => expect(crides(fetchFals)).toEqual(['/functions/v1/iaia']));
      else await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      const fil = result.current.chatThreads.find((f) => f.id === ID_FIL_LOCAL_IAIA);
      await act(async () => { await result.current.sendChatMessage(fil, 'On és el forn del poble?'); });
      const ultim = () => result.current.getThreadMessages(ID_FIL_LOCAL_IAIA).at(-1)?.text ?? '';
      if (amb) {
        await waitFor(() => expect(ultim()).toBe('Resposta del model propi'));
        expect(crides(fetchFals)).toEqual(['/functions/v1/iaia', '/functions/v1/iaia']);
        expect(JSON.parse(fetchFals.mock.calls[1][1].body)).toMatchObject({ mode: 'direct', question: 'On és el forn del poble?' });
      } else {
        await waitFor(() => expect(ultim()).not.toBe(''));
        expect(ultim()).not.toBe('Resposta del model propi');
        expect(fetchFals).not.toHaveBeenCalled();
      }
    });

    it(amb ? 'ritme: xat_ritme en obrir la conversa i xat_presencia en escriure' : 'ritme: cap RPC xat_ritme ni xat_presencia, ni en obrir ni en escriure', async () => {
      // Conversa en primer pla (el ritme només consulta amb la finestra visible i enfocada).
      vi.spyOn(document, 'hasFocus').mockReturnValue(true);
      const props = { fil: { id: FIL, tipus: 'directe', participant: true, potEscriure: true }, joId: ACTOR, modeDades: 'remote', senseSessio: false, ambit: 'r15', config: CONFIG };
      const { result } = renderHook(() => useRitmeXat(props));
      if (amb) {
        await waitFor(() => expect(crides(fetchFals)).toContain('/rest/v1/rpc/xat_ritme'));
        await waitFor(() => expect(result.current.ritme.rebutPelsAltresFinsSeq).toBe(3));
        act(() => result.current.onEscrivint(true));
        await waitFor(() => expect(crides(fetchFals)).toContain('/rest/v1/rpc/xat_presencia'));
      } else {
        await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
        act(() => result.current.onEscrivint(true));
        await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
        expect(result.current.ritme).toEqual({ rebutPelsAltresFinsSeq: 0, llegitPelsAltresFinsSeq: 0, escrivint: [] });
        expect(fetchFals).not.toHaveBeenCalled();
      }
    });

    it(amb ? 'desvetllador: un enviament confirmat crida notifica-xat-desperta' : 'desvetllador: un enviament confirmat no crida notifica-xat-desperta', async () => {
      expect(despertaXatConfirmat(clientDeFunctions(), { missatgeId: MISSATGE, seq: 4 }, () => true)).toBe(amb);
      if (amb) await waitFor(() => expect(crides(fetchFals)).toEqual(['/functions/v1/notifica-xat-desperta']));
      else { await act(async () => { await new Promise((r) => setTimeout(r, 20)); }); expect(fetchFals).not.toHaveBeenCalled(); }
    });
  });
}
