import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { TargetesArticles } from '../comu/esquelet/ColumnaCataleg.jsx';
import { creaMagatzemNevera } from './magatzem.js';
import manifest from './manifest.js';
import AppNevera from './AppNevera.jsx';
import { estatInicial, marcaACasa } from './nucli/index.js';

const magatzems = [];

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  magatzems.splice(0).forEach((m) => m.tanca());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('R32.5 · Lot 03 · T3-UI-01 (/app/nevera/rebost capçalera neta a 320px) i T3-UI-02 (sense «Data no indicada» en inventari permanent)', () => {
  test.each([320, 1440])('T3-UI-01: a %ipx, la fila superior de la llista deixa el títol «Rebost» lliure dels 3 commutadors de vista, que viuen a la subcapçalera d’eines', async (amplada) => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
    const magatzem = creaMagatzemNevera({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    const App = () => <AppNevera magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });
    muntaPlataforma('/app/nevera/rebost', { registre, entorn: { ...ENTORN_OBERT, produccio: false } });

    await waitFor(() => {
      expect(document.getElementById('app-grid-list')).not.toBeNull();
    });

    if (amplada === 320) {
      const botoTot = await screen.findByRole('button', { name: /Tot el catàleg/i });
      fireEvent.click(botoTot);
    }

    const llista = document.getElementById('app-grid-list');
    const capcaleres = llista.querySelectorAll('.app-grid-col-header');
    expect(capcaleres.length).toBeGreaterThanOrEqual(2);

    const [capcaleraTitol, subcapcaleraEines] = capcaleres;
    expect(capcaleraTitol.querySelector('.app-grid-col-header__titol')?.textContent).toBe('Rebost');
    expect(capcaleraTitol.querySelectorAll('.sdp-cataleg-workspace__commutador')).toHaveLength(0);

    const commutadors = subcapcaleraEines.querySelectorAll('.sdp-cataleg-workspace__commutador');
    expect(commutadors).toHaveLength(3);
    expect(subcapcaleraEines.querySelector('[aria-label="Canònica"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  test('T3-UI-02: a /app/nevera/casa les targetes d’inventari permanent no mostren la pastilla «Data no indicada» (iaia-maria-core §11)', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
    const magatzem = creaMagatzemNevera({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    await magatzem.desa(marcaACasa(estatInicial(), 'oli-d-oliva', 'hi-ha'));
    const App = () => <AppNevera magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });
    muntaPlataforma('/app/nevera/casa', { registre, entorn: { ...ENTORN_OBERT, produccio: false } });

    await screen.findByRole('region', { name: 'A casa' });
    const regioACasa = document.getElementById('app-grid-main');
    expect(regioACasa.querySelectorAll('article.sp-card').length).toBeGreaterThan(0);
    expect(regioACasa.textContent).not.toContain('Data no indicada');
  });

  test('T3-UI-02: ometDataNoIndicada conserva la data real quan un article porta caducitat o data explícita', () => {
    const { container } = render(
      <MemoryRouter rutaInicial="/app/nevera/casa">
        <TargetesArticles
          idioma="ca"
          ometDataNoIndicada
          elements={[
            { article: { id: 'sal', nom: 'Sal marina' }, categoria: null },
            { article: { id: 'iogurt', nom: 'Iogurt natural', dataCaducitat: '2026-12-01' }, categoria: null }
          ]}
        />
      </MemoryRouter>
    );

    const targetes = container.querySelectorAll('article.sp-card');
    expect(targetes).toHaveLength(2);
    expect(targetes[0].textContent).not.toContain('Data no indicada');
    expect(targetes[1].textContent).not.toContain('Data no indicada');
    expect(targetes[1].textContent).toMatch(/2026|des|dic|dec/i);
  });
});
