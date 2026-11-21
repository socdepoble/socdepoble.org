import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  BandaBetaMicroApp,
  TEXTOS_BANDA_BETA_FISCAL,
  TEXTOS_BANDA_BETA_GENERAL,
} from '../../../components/PedraSeca/index.js';
import {
  bandaBetaPlegada,
  desaBandaBetaPlegada,
} from '../../../components/PedraSeca/molecules/textosBandaBeta.js';
import { ENTORN_OBERT, muntaPlataforma } from '../../plataforma/__fixtures__/munta.jsx';
import { LLENGUES_APP } from '../../plataforma/manifestApp.js';
import { creaRegistre } from '../../plataforma/registreApps.js';
import AppBar from '../AppBar.jsx';
import { TEXTOS_UI_BAR } from '../i18nBar.js';
import { creaMagatzemBar } from '../magatzem.js';
import manifestBar from '../manifest.js';
import { llavorCarta } from '../nucli/llavor.js';
import { modelCartaWorkspace } from '../vistes/modelCartaWorkspace.js';
import { pictogramaFamiliaBar } from '../vistes/vestits.js';

const SENSE_SESSIO = Object.freeze({
  ...ENTORN_OBERT,
  produccio: false,
  sessio: { estat: 'fora', enLinia: true, modeProves: false }
});

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1280);
  desaBandaBetaPlegada('general', false);
  desaBandaBetaPlegada('fiscal', false);
});

afterEach(() => {
  cleanup();
  desaBandaBetaPlegada('general', false);
  desaBandaBetaPlegada('fiscal', false);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('Onada R32.26 · IDEA-304 · El Bar com Loyverse (icones per família, Banda Beta plegable i Demo local)', () => {
  test('la carta per defecte diferencia les famílies gastronòmiques (☕, 🥖, 🥪, 🫒, 🍲, 🍰, 🥤, 🍺, 🍷, 🍸) en lloc d’un únic 🍽️', () => {
    const carta = llavorCarta();
    const model = modelCartaWorkspace(carta, { nom: 'El meu bar', slug: 'el-meu-bar' });
    const glifs = new Set(model.items.map((item) => item.glyph));
    expect(glifs.size).toBeGreaterThanOrEqual(8);
    expect(pictogramaFamiliaBar('cafeteria')).toBe('☕');
    expect(pictogramaFamiliaBar('torrades')).toBe('🥖');
    expect(pictogramaFamiliaBar('cerveseria')).toBe('🍺');
    expect(pictogramaFamiliaBar('postres')).toBe('🍰');
    expect(pictogramaFamiliaBar('vins-i-caves')).toBe('🍷');
    expect(pictogramaFamiliaBar('refrescs')).toBe('🥤');
    expect(pictogramaFamiliaBar('tapes')).toBe('🫒');
  });

  /* v1.2.17 · Gauntlet R1 (L3-10) · Es plega la general (un sol botó, el nom amb el text visible); la fiscal, no. */
  test.each(LLENGUES_APP)('BandaBetaMicroApp conserva el text íntegre desplegada i es pot plegar i tornar a obrir amb persistència (%s)', (lang) => {
    const { container, unmount } = render(<BandaBetaMicroApp idioma={lang} avisBeta="general" />);
    const banda = container.querySelector('aside.sdp-banda-beta');
    expect(banda?.textContent).toBe(TEXTOS_BANDA_BETA_GENERAL[lang].text);
    expect(banda?.getAttribute('data-plegada')).toBe('false');

    const botoPlega = screen.getByRole('button', { name: TEXTOS_BANDA_BETA_GENERAL[lang].plega });
    fireEvent.click(botoPlega);
    expect(bandaBetaPlegada('general')).toBe(true);
    expect(banda?.getAttribute('data-plegada')).toBe('true');

    unmount();
    const segona = render(<BandaBetaMicroApp idioma={lang} avisBeta="general" />);
    expect(segona.container.querySelector('aside.sdp-banda-beta')?.getAttribute('data-plegada')).toBe('true');

    const botoMostra = screen.getByRole('button', { name: TEXTOS_BANDA_BETA_GENERAL[lang].etiquetaCurta });
    fireEvent.click(botoMostra);
    expect(bandaBetaPlegada('general')).toBe(false);
    expect(segona.container.querySelector('aside.sdp-banda-beta')?.textContent).toBe(TEXTOS_BANDA_BETA_GENERAL[lang].text);
    segona.unmount();

    const fiscal = render(<BandaBetaMicroApp idioma={lang} avisBeta="fiscal" />);
    expect(fiscal.container.querySelector('aside.sdp-banda-beta')?.textContent).toBe(TEXTOS_BANDA_BETA_FISCAL[lang].text);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('a /app/bar/tpv sense sessió ni torn obert, «Prova el TPV en local (Demo)» permet jugar i veure la nota de consum de mostra sense desar res al disc', async () => {
    const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
    await magatzem.carrega();
    const abans = await magatzem.bolca();
    const App = () => <AppBar magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifestBar, carrega: () => Promise.resolve({ default: App }) }] });

    muntaPlataforma('/app/bar/tpv', { registre, entorn: SENSE_SESSIO });
    const botoDemo = await screen.findByRole('button', { name: TEXTOS_UI_BAR.ca.provaTpvDemo });
    fireEvent.click(botoDemo);

    expect(await screen.findByText(TEXTOS_UI_BAR.ca.demoLocalTitol)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Cafè sol,/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Torrada amb tomaca,/ }));
    const dialegPa = await screen.findByRole('dialog', { name: 'Torrada amb tomaca' });
    fireEvent.click(within(dialegPa).getByRole('button', { name: /^Pa de pagès/ }));

    const botoNota = screen.getByRole('button', { name: new RegExp(`^${TEXTOS_UI_BAR.ca.demoMostraNota}`) });
    expect(botoNota.disabled).toBe(false);
    fireEvent.click(botoNota);

    const dialegNota = await screen.findByRole('dialog', { name: TEXTOS_UI_BAR.ca.demoNotaTitol });
    expect(within(dialegNota).getByText(TEXTOS_UI_BAR.ca.demoNotaAvis)).toBeTruthy();
    expect(within(dialegNota).getByText(/1 × Cafè sol/)).toBeTruthy();
    expect(within(dialegNota).getByText(/1 × Torrada amb tomaca/)).toBeTruthy();
    expect(within(dialegNota).getByText(/Total: 3,70 €/)).toBeTruthy();

    /* Res no s'ha escrit al magatzem local ni s'ha creat cap torn ni comanda persistent. */
    expect(await magatzem.bolca()).toEqual(abans);

    fireEvent.click(within(dialegNota).getByRole('button', { name: TEXTOS_UI_BAR.ca.tancaNota }));
    fireEvent.click(screen.getByRole('button', { name: TEXTOS_UI_BAR.ca.ixDeLaDemo }));
    expect(await screen.findByRole('button', { name: TEXTOS_UI_BAR.ca.provaTpvDemo })).toBeTruthy();
  });
});
