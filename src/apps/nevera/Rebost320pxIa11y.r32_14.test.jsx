import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { LLENGUES_APP } from '../plataforma/manifestApp.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppNevera from './AppNevera.jsx';
import {
  TEXTOS_CASA_NEVERA,
  TEXTOS_CATEGORIES_NEVERA,
  TEXTOS_ENTRADETA_NEVERA,
  TEXTOS_VISTA_NEVERA,
} from './i18nNevera.js';
import { creaMagatzemNevera } from './magatzem.js';
import manifest from './manifest.js';
import { estatInicial, marcaACasa } from './nucli/index.js';
import { modelRebostWorkspace } from './vistes/modelRebostWorkspace.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
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

describe('Onada R32.14 · T3-UI-01 i T3-UI-02 · Rebost a 320 px sense truncament, landmarks ARIA i 5 llengües', () => {
  test('T3-UI-01: les regles CSS <= 25rem eviten el truncament del Rebost i l’escanyament del catàleg a 320×700 sense usar el selector vetat', () => {
    const cssCataleg = senseComentaris(llig('src/css/diferit-cataleg-colleccio.css'));
    const cssModuls = senseComentaris(llig('src/css/modules.css'));
    const selectorVetat = new RegExp([':ha', 's\\('].join(''));

    expect(selectorVetat.test(cssCataleg)).toBe(false);
    expect(cssCataleg).toContain('@media (max-width: 25rem)');
    expect(cssCataleg).toContain('.sdp-barra-resum__obri');
    expect(cssCataleg).toContain('flex-wrap: wrap;');
    expect(cssCataleg).toContain('@media (max-width: 25rem) and (max-height: 46rem)');
    expect(cssCataleg).toContain('position: sticky;');

    expect(cssModuls).toContain('.sdp-app-unica .sdp-cataleg-workspace .sdp-workspace-folder-row > .sdp-workspace-folder-toggle-spacer');
    expect(cssModuls).toContain('.sdp-app-unica .sdp-cataleg-workspace .sdp-workspace-folder-row .sdp-workspace-nav-item__label');
    expect(cssModuls).toContain('.sdp-app-unica .sdp-cataleg-workspace .sdp-cataleg-workspace__canonica .sdp-gestor-fitxa__subtitol');
  });

  test.each(LLENGUES_APP)('T3-UI-02 + D03: a 320 px i en %s, el Rebost exposa grups ARIA amb nom i traduïx estats de casa, categories i entradeta', async (lang) => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320);
    const estat = estatInicial();
    const model = modelRebostWorkspace(estat, lang);
    expect(model.categories.find((c) => c.id === 'ingredients-especies')?.label).toBe(TEXTOS_CATEGORIES_NEVERA[lang]['ingredients-especies']);
    expect(model.items.find((it) => it.id === 'tomaques')?.subtitle).toBe(TEXTOS_CATEGORIES_NEVERA[lang]['fruita-verdura']);
    expect(model.items.find((it) => it.id === 'tomaques')?.lead).toBe(TEXTOS_ENTRADETA_NEVERA[lang].base);

    const magatzem = creaMagatzemNevera({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    await magatzem.desa(marcaACasa(estat, 'tomaques', 'se-n-acaba'));
    const App = () => <AppNevera magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });

    muntaPlataforma('/app/nevera/rebost', {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang },
    });

    const tx = TEXTOS_VISTA_NEVERA[lang];
    const txCasa = TEXTOS_CASA_NEVERA[lang];

    const botoTot = await screen.findByRole('button', { name: tx.totElCataleg }, { timeout: 5000 });
    fireEvent.click(botoTot);

    const botoTomaques = (await screen.findAllByRole('button', { name: 'Tomaques', exact: true }, { timeout: 5000 })).at(-1);
    fireEvent.click(botoTomaques);

    const detall = within(document.getElementById('app-grid-main'));
    expect(await detall.findByRole('heading', { name: 'Tomaques', level: 1 }, { timeout: 5000 })).toBeTruthy();

    const grupNavegacio = detall.getByRole('group', { name: tx.laNeveraDeCasa });
    expect(within(grupNavegacio).getByRole('link', { name: tx.queTincACasa })).toBeTruthy();

    const grupRebost = detall.getByRole('group', { name: tx.elTeuRebost });
    const botoSeNAcaba = within(grupRebost).getByRole('button', { name: txCasa['se-n-acaba'] });
    expect(botoSeNAcaba.getAttribute('aria-pressed')).toBe('true');
    expect(within(grupRebost).getByRole('button', { name: txCasa['hi-ha'] })).toBeTruthy();
    expect(within(grupRebost).getByRole('button', { name: txCasa.acabat })).toBeTruthy();
  });
});
