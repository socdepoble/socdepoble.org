import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { _reiniciaPreferencies } from '../plataforma/preferenciesApps.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestGenealogia from './manifest.js';
import AppGenealogia from './AppGenealogia.jsx';
import { VERSIO_AVIS, t } from './textos.js';
import { creaMagatzemGenealogia, desaMeta } from './magatzem.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ARA = new Date(2026, 10, 18, 19, 45);
const LLENGUES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

beforeEach(() => {
  window.localStorage.clear();
  _reiniciaPreferencies();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Onada R32.11 Lot 07 · AppGenealogia closca i PortaAvis en 5 llengües', () => {
  test.each(LLENGUES)('traduïx la closca de ClosaAplicacio i la porta en idioma %s', async (idioma) => {
    const magatzem = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual: 2026 });
    await desaMeta(magatzem, 'avis', { acceptatA: '2026-11-18T18:00:00.000Z', versio: VERSIO_AVIS });
    let seq = 0;
    const App = () => (
      <AppGenealogia
        magatzem={magatzem}
        rellotge={() => ARA}
        nouId={() => `00000000-0000-4000-8000-${String(9900 + (++seq)).padStart(12, '0')}`}
      />
    );
    const carrega = vi.fn(() => Promise.resolve({ default: App }));
    muntaPlataforma('/app/genealogia/arbre', {
      registre: creaRegistre({ internes: [{ ...manifestGenealogia, carrega }] }),
      entorn: ENTORN,
      externalConfig: { language: idioma },
    });

    const titolApp = t(idioma, 'app.titol');
    const matches = await screen.findAllByText(titolApp);
    expect(matches.length).toBeGreaterThan(0);
  });
});
