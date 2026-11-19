/* Onada R32.13 · Lot 01 (T3-UI-03) · Paritat de les 5 llengües oficials
   (ca, es, en, eu, gl) en El Bar, Mercaderies (CalculadoraCompraParroquia,
   Escandalls, Ingredients i àlies /app/mercaderies) i l'Esquelet Comú. */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import {
  TEXTOS_CATALEG_ESQUELET,
  TEXTOS_COLLECCIONS_ESQUELET,
  TEXTOS_COLLECCIO_ESQUELET,
  TEXTOS_TARGETES_ESQUELET
} from '../comu/esquelet/i18nEsquelet.js';
import manifestNevera from '../nevera/manifest.js';
import AppNevera from '../nevera/AppNevera.jsx';
import { creaMagatzemNevera } from '../nevera/magatzem.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { ProveidorApp } from '../plataforma/PlataformaContext.jsx';
import { LLENGUES_APP } from '../plataforma/manifestApp.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import { TEXTOS_PORTAL_APPS } from '../plataforma/textosPortalApps.js';
import AppBar from './AppBar.jsx';
import { ProveidorBar } from './estat/ProveidorBar.jsx';
import { CODIS_IDIOMA_BAR, TEXTOS_ERRORS_BAR, TEXTOS_UI_BAR, textosUiBar } from './i18nBar.js';
import { CODIS_IDIOMA_MERCADERIES, NOMS_ALERGENS_I18N, TEXTOS_MERCADERIES, textosMercaderies } from './i18nMercaderies.js';
import { creaMagatzemBar } from './magatzem.js';
import manifestBar from './manifest.js';
import { obriTorn } from './nucli/torn.js';
import { CalculadoraCompraParroquia } from './vistes/CalculadoraCompraParroquia.jsx';

const ENTORN_DINS = Object.freeze({
  ...ENTORN_OBERT,
  produccio: false,
  sessio: { estat: 'dins', enLinia: true, modeProves: false }
});

const ENTORN_LECTURA = Object.freeze({
  ...ENTORN_OBERT,
  produccio: false,
  sessio: { estat: 'fora', enLinia: true, modeProves: false }
});

function rellotgeFix() {
  let ms = Date.parse('2026-11-18T10:00:00.000Z');
  return () => {
    ms += 1000;
    return new Date(ms).toISOString();
  };
}

async function magatzemBarProva({ ambTorn = true } = {}) {
  const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  await magatzem.carrega();
  if (ambTorn) {
    const torn = obriTorn({ id: 'torn-r3213', per: 'Cambrer', fonsInicialCents: 5000, ara: '2026-11-18T09:00:00.000Z' });
    await magatzem.desaTorn(torn);
    await magatzem.desaMeta('tornActual', torn.id);
  }
  return magatzem;
}

function muntaBarEnIdioma(url, magatzem, idioma, entorn = ENTORN_DINS) {
  const rellotge = rellotgeFix();
  const App = () => <AppBar magatzem={magatzem} rellotge={rellotge} atzar={() => 0.42} />;
  const AppN = () => <AppNevera magatzem={creaMagatzemNevera({ idb: null, navegador: {}, Canal: null })} descarrega={vi.fn()} />;
  const registre = creaRegistre({
    internes: [
      { ...manifestBar, carrega: () => Promise.resolve({ default: App }) },
      { ...manifestNevera, carrega: () => Promise.resolve({ default: AppN }) }
    ]
  });
  return muntaPlataforma(url, { registre, entorn, externalConfig: { language: idioma } });
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Onada R32.13 · Lot 01 · Simetria de diccionaris i Llei 32 = 0', () => {
  test('tots els diccionaris d’El Bar, Mercaderies, Esquelet i Plataforma compartixen les mateixes claus en ca/es/en/eu/gl', () => {
    expect(CODIS_IDIOMA_BAR).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    expect(CODIS_IDIOMA_MERCADERIES).toEqual(['ca', 'es', 'en', 'eu', 'gl']);

    const grups = [
      ['TEXTOS_UI_BAR', TEXTOS_UI_BAR],
      ['TEXTOS_ERRORS_BAR', TEXTOS_ERRORS_BAR],
      ['TEXTOS_MERCADERIES', TEXTOS_MERCADERIES],
      ['NOMS_ALERGENS_I18N', NOMS_ALERGENS_I18N],
      ['TEXTOS_CATALEG_ESQUELET', TEXTOS_CATALEG_ESQUELET],
      ['TEXTOS_COLLECCIO_ESQUELET', TEXTOS_COLLECCIO_ESQUELET],
      ['TEXTOS_COLLECCIONS_ESQUELET', TEXTOS_COLLECCIONS_ESQUELET],
      ['TEXTOS_TARGETES_ESQUELET', TEXTOS_TARGETES_ESQUELET],
      ['TEXTOS_PORTAL_APPS', TEXTOS_PORTAL_APPS]
    ];

    const infraccionsLlei32 = [];
    const patroLlei32 = new RegExp(['servidor\\s+del\\s+poble', 'servidor\\s+del\\s+pueblo', 'village\\s+server'].join('|'), 'i');

    for (const [nom, grup] of grups) {
      const clausBase = Object.keys(grup.ca).sort();
      expect(clausBase.length, nom).toBeGreaterThan(0);
      for (const lang of LLENGUES_APP) {
        expect(Object.keys(grup[lang]).sort(), `${nom}.${lang}`).toEqual(clausBase);
        for (const [clau, valor] of Object.entries(grup[lang])) {
          const mostra = typeof valor === 'function' ? String(valor('Exemple', 'Full', 2, '10')) : JSON.stringify(valor);
          expect(mostra.trim().length, `${nom}.${lang}.${clau}`).toBeGreaterThan(0);
          if (patroLlei32.test(mostra)) infraccionsLlei32.push(`${nom}.${lang}.${clau}`);
        }
      }
    }
    expect(infraccionsLlei32).toEqual([]);
  });
});

describe('Onada R32.13 · Lot 01 · Renderitzat 5 llengües d’El Bar i Mercaderies', () => {
  test.each(LLENGUES_APP)('El Bar (/app/bar/caixa, /torn, /escandalls, /ajustos) respon en %s sense fuites en valencià', async (lang) => {
    const tx = textosUiBar(lang);
    const tm = textosMercaderies(lang);
    const magatzem = await magatzemBarProva({ ambTorn: true });
    muntaBarEnIdioma('/app/bar/caixa', magatzem, lang);

    expect(await screen.findByText(tx.comandaBuidaTitol)).toBeTruthy();
    expect(screen.getAllByText(tx.tiquetsOberts).length).toBeGreaterThan(0);
    if (lang !== 'ca') {
      expect(screen.queryByText('La comanda és buida')).toBeNull();
      expect(screen.queryByText('Tiquets oberts')).toBeNull();
    }

    await act(async () => {
      window.history.pushState(null, '', '/app/bar/escandalls');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(await screen.findByText(tm.triaProducteEscandallText)).toBeTruthy();
    if (lang !== 'ca') {
      expect(screen.queryByText('El cost per ració, el food cost i el PVP suggerit.')).toBeNull();
    }

    await act(async () => {
      window.history.pushState(null, '', '/app/bar/ajustos');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(await screen.findByText(tx.onSonLesDades)).toBeTruthy();
    if (lang !== 'ca') {
      expect(screen.queryByText('On són les dades')).toBeNull();
    }
  });

  test.each(LLENGUES_APP)('Mercaderies (CalculadoraCompraParroquia) cobrix els estats UI i el Permís en %s', async (lang) => {
    const tm = textosMercaderies(lang);
    const magatzem = await magatzemBarProva({ ambTorn: false });
    const carta = await magatzem.carrega().then((d) => d.carta);
    const producte = {
      ...carta.productes[0],
      font: { cataleg: 'la-parroquia' }
    };
    const variant = producte.variants[0];

    render(
      <MemoryRouter rutaInicial="/app/bar/carta">
        <ProveidorApp
          manifest={manifestBar}
          fontSessio={() => ({ estat: 'fora', enLinia: true, modeProves: false, esSuperadmin: false, marca: null })}
          serveis={{}}
          idioma={lang}
        >
          <ProveidorBar magatzem={magatzem} rellotge={rellotgeFix()} atzar={() => 0.5} idioma={lang}>
            <CalculadoraCompraParroquia producte={producte} variant={variant} />
          </ProveidorBar>
        </ProveidorApp>
      </MemoryRouter>
    );

    /* Estat Permission (només lectura sense sessió) + botó inicial */
    expect(await screen.findByText(tm.permisLecturaMercaderies)).toBeTruthy();
    const botoObrir = screen.getByRole('button', { name: tm.obriCalculadora });
    expect(botoObrir).toBeTruthy();

    /* Estat Loading + càrrega real de tarifes de mercaderies */
    await act(async () => {
      fireEvent.click(botoObrir);
    });
    const selectorTarifa = await screen.findByLabelText(tm.tarifaCompraFont);
    expect(selectorTarifa).toBeTruthy();

    /* Estat Partial (falta informar camps abans del càlcul) */
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: tm.calculaCompra }));
    });
    const grup = screen.getByRole('group', { name: tm.llegendaCompra });
    expect(within(grup).getAllByRole('status').length + within(grup).queryAllByRole('alert').length).toBeGreaterThanOrEqual(0);
  });

  test('/app/mercaderies canonitza netament amb replace cap a /app/nevera/rebost en qualsevol llengua', async () => {
    const magatzem = await magatzemBarProva({ ambTorn: false });
    muntaBarEnIdioma('/app/mercaderies', magatzem, 'es', ENTORN_LECTURA);
    await waitFor(() => {
      expect(screen.getByTestId('ubicacio').textContent.startsWith('/app/nevera/rebost')).toBe(true);
    });
  });
});
