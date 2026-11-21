import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { LLENGUES_APP } from '../plataforma/manifestApp.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { TargetesArticles } from '../comu/esquelet/ColumnaCataleg.jsx';
import { creaMagatzemNevera } from './magatzem.js';
import manifest from './manifest.js';
import AppNevera from './AppNevera.jsx';
import { TEXTOS_BUIT_NEVERA, textosBuitNevera } from './i18nNevera.js';
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

describe('R32.5 / R32.10 · Lot 01 · T3-UI-01/02/03 (Nevera sense «Data no indicada» en vistes no cronològiques i estats buits en 5 llengües)', () => {
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
      expect(document.querySelector('.app-grid-shell')?.dataset.panell).toBe('middle');
    }

    const llista = document.getElementById('app-grid-list');
    const capcaleres = llista.querySelectorAll('.app-grid-col-header');
    expect(capcaleres.length).toBeGreaterThanOrEqual(2);

    const [capcaleraTitol, subcapcaleraEines] = capcaleres;
    expect(capcaleraTitol.querySelector('.app-grid-col-header__titol')?.textContent).toBe('Rebost');
    expect(capcaleraTitol.querySelectorAll('.sdp-cataleg-workspace__commutador')).toHaveLength(0);

    const commutadors = subcapcaleraEines.querySelectorAll('.sdp-cataleg-workspace__commutador');
    expect(commutadors).toHaveLength(3);
    expect(subcapcaleraEines.querySelector('[aria-label="Quadrícula 2×2"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  test('T3-UI-02: a /app/nevera/casa, /app/nevera/receptes i /app/nevera/temporada les targetes no cronològiques ometen «Data no indicada»', async () => {
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
    cleanup();

    muntaPlataforma('/app/nevera/receptes', { registre, entorn: { ...ENTORN_OBERT, produccio: false } });
    await screen.findByRole('region', { name: 'Receptes amb el que tens' });
    expect(document.getElementById('app-grid-main').textContent).not.toContain('Data no indicada');
    cleanup();

    muntaPlataforma('/app/nevera/temporada?mes=8', { registre, entorn: { ...ENTORN_OBERT, produccio: false } });
    await screen.findByRole('region', { name: 'De temporada a l’agost' });
    expect(document.getElementById('app-grid-main').textContent).not.toContain('Data no indicada');
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

  test.each(LLENGUES_APP)('T3-UI-03: els estats buits de La Nevera responen a l’idioma %s amb el diccionari modular i18nNevera', async (lang) => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
    const magatzem = creaMagatzemNevera({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    const App = () => <AppNevera magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });

    muntaPlataforma('/app/nevera/llista/casa', {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang }
    });

    const tx = TEXTOS_BUIT_NEVERA[lang];
    expect(textosBuitNevera(`${lang}-XX`)).toBe(tx);
    expect(await screen.findByText(tx.llistaBuida)).toBeTruthy();
    expect(screen.getByText(tx.llistaBuidaText)).toBeTruthy();
  });
});
