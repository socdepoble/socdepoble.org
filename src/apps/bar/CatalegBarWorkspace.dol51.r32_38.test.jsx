/* Onada R32.38 · DOL-51 · A /app/bar en pantalla estreta (320px i 360px),
   la portada obri el detall sense que el calaix del catàleg tape «Obri el TPV»
   ni «Obri la caixa», i les accions principals es pinten a page-title-accio
   amb grup accessible en les 5 llengües oficials. */
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppBar from './AppBar.jsx';
import { CODIS_IDIOMA_BAR, textosUiBar } from './i18nBar.js';
import { creaMagatzemBar } from './magatzem.js';
import manifestBar from './manifest.js';

const magatzems = [];

const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  magatzems.splice(0).forEach((m) => m.base.tanca());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
  sessionStorage.clear();
});

async function muntaBar(amplada = 360, idioma = 'ca') {
  ambAmplada(amplada);
  const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  magatzems.push(magatzem);
  await magatzem.carrega();
  const App = () => <AppBar magatzem={magatzem} />;
  const registre = creaRegistre({ internes: [{ ...manifestBar, carrega: () => Promise.resolve({ default: App }) }] });
  return muntaPlataforma('/app/bar', {
    registre,
    entorn: { ...ENTORN_OBERT, produccio: false, sessio: { estat: 'fora', enLinia: true, modeProves: false } },
    externalConfig: { language: idioma }
  });
}

describe('Onada R32.38 · DOL-51 · Accés immediat al TPV i a la Caixa a /app/bar en mòbil (320px / 360px)', () => {
  test.each([320, 360])(
    'a %ipx /app/bar obri la portada sense calaix al damunt i manté «Obri el TPV» i «Obri la caixa» interactius (sense inert)',
    async (amplada) => {
      await muntaBar(amplada, 'ca');
      expect(await screen.findByRole('heading', { name: 'Catàleg del Bar', level: 1 })).toBeTruthy();

      const main = document.getElementById('app-grid-main');
      expect(main.hasAttribute('inert')).toBe(false);
      expect(main.getAttribute('aria-hidden')).toBeNull();

      const accionsCapcalera = main.querySelector('.page-title-accio .sdp-accions');
      expect(accionsCapcalera).not.toBeNull();

      const enllacTpv = within(accionsCapcalera).getByRole('link', { name: 'Obri el TPV' });
      const enllacCaixa = within(accionsCapcalera).getByRole('link', { name: 'Obri la caixa' });
      expect(enllacTpv.getAttribute('href')).toBe('/app/bar/tpv');
      expect(enllacCaixa.getAttribute('href')).toBe('/app/bar/caixa');
      expect(enllacTpv.closest('[inert]')).toBeNull();
    }
  );

  test.each(CODIS_IDIOMA_BAR)(
    'localitza les accions operatives de la portada d’El Bar en %s',
    async (idioma) => {
      const tx = textosUiBar(idioma);
      await muntaBar(360, idioma);
      expect(await screen.findByRole('heading', { name: tx.catalegTitol, level: 1 })).toBeTruthy();
      const main = document.getElementById('app-grid-main');
      const grup = within(main).getByRole('group', { name: tx.catalegTitol });
      expect(within(grup).getByRole('link', { name: tx.obriTpv }).getAttribute('href')).toBe('/app/bar/tpv');
      expect(within(grup).getByRole('link', { name: tx.obriCaixa }).getAttribute('href')).toBe('/app/bar/caixa');
      expect(within(grup).getByRole('link', { name: tx.gestionaCarta }).getAttribute('href')).toBe('/app/bar/ajustos/carta');
    }
  );
});
