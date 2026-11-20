/* Onada R32.19 · Paritat Craft Anything a El Bar (/app/bar/taules, /app/bar/caixa, /app/bar/emportar)
   i puresa Fast Refresh / HMR en GestioMembres.jsx i TaulerTelemetria.jsx. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma, ENTORN_OBERT } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestBar from './manifest.js';
import AppBar from './AppBar.jsx';
import { creaMagatzemBar } from './magatzem.js';
import { obriTorn } from './nucli/torn.js';
import { creaComanda } from './nucli/comanda.js';
import { textosUiBar, TEXTOS_UI_BAR } from './i18nBar.js';
import { tiquetsOberts } from './vistes/vestits.js';
import '../../../tests/helpers/diccionaris.js';

const ENTORN = Object.freeze({
  ...ENTORN_OBERT,
  produccio: false,
  sessio: { estat: 'dins', enLinia: true, modeProves: false }
});

function rellotgeDeProva() {
  let ms = Date.parse('2026-10-02T08:00:00.000Z');
  return () => {
    ms += 1000;
    return new Date(ms).toISOString();
  };
}

function atzarDeProva() {
  let x = 0;
  return () => {
    x = (x + 0.137) % 1;
    return x;
  };
}

async function magatzemDeProva({ ambTorn = true } = {}) {
  const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  await magatzem.carrega();
  if (ambTorn) {
    const torn = obriTorn({ id: 'torn-r3219', per: 'Cambrer 1', fonsInicialCents: 0, ara: '2026-10-02T07:00:00.000Z' });
    await magatzem.desaTorn(torn);
    await magatzem.desaMeta('tornActual', torn.id);
  }
  return magatzem;
}

function munta(url, magatzem, idioma = 'ca') {
  const rellotge = rellotgeDeProva();
  const atzar = atzarDeProva();
  const App = () => <AppBar magatzem={magatzem} rellotge={rellotge} atzar={atzar} />;
  const registre = creaRegistre({ internes: [{ ...manifestBar, carrega: () => Promise.resolve({ default: App }) }] });
  return muntaPlataforma(url, { registre, entorn: ENTORN, externalConfig: { language: idioma } });
}

const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  ambAmplada(1280);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('R32.19 · El Bar · zero columna fantasma, zero torn duplicat i zero tiquets buits acumulats', () => {
  test('a /app/bar/taules la closca marca has-left-empty, oculta #app-grid-sidebar i omet el separador esquerre', async () => {
    const magatzem = await magatzemDeProva({ ambTorn: true });
    munta('/app/bar/taules', magatzem);
    await screen.findByRole('region', { name: 'Sala' });

    const content = document.querySelector('.app-grid-content');
    const sidebar = document.getElementById('app-grid-sidebar');
    expect(content.classList.contains('has-left-empty')).toBe(true);
    expect(sidebar.getAttribute('aria-hidden')).toBe('true');
    expect(sidebar.hasAttribute('inert')).toBe(true);
    expect(document.querySelector('.app-grid-resizer--left')).toBeNull();
    expect(document.querySelector('.app-grid-resizer--middle')).not.toBeNull();
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])(
    'sense torn obert (%s), en ample (1280 px) i mitja (800 px) només hi ha un missatge de torn tancat i un botó d’obrir el torn',
    async (idioma) => {
      const tx = textosUiBar(idioma);
      expect(TEXTOS_UI_BAR[idioma].senseTornLateral.length).toBeGreaterThan(3);

      for (const amplada of [1280, 800]) {
        ambAmplada(amplada);
        const magatzem = await magatzemDeProva({ ambTorn: false });
        munta('/app/bar/taules', magatzem, idioma);
        const tancats = await screen.findAllByText(tx.tornTancatTitol);
        expect(tancats).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: tx.obriTorn })).toHaveLength(1);
        /* Integració v1.2.15 · la línia la pinta EstatBuit breu: el mateix <p class="sdp-buit"> del kit. */
        const linia = within(document.getElementById('app-grid-list')).getByText(tx.senseTornLateral);
        expect([linia.tagName, linia.className, linia.childElementCount]).toEqual(['P', 'sdp-buit', 0]);
        cleanup();
      }
    }
  );

  test('en pantalla estreta (375 px) sense torn obert, la columna visible conserva el seu botó d’obrir el torn', async () => {
    ambAmplada(375);
    const magatzem = await magatzemDeProva({ ambTorn: false });
    munta('/app/bar/taules', magatzem);
    await screen.findAllByText('El torn està tancat');
    const main = document.getElementById('app-grid-main');
    expect(within(main).getByRole('button', { name: 'Obri el torn' })).toBeTruthy();
    expect(main.getAttribute('aria-hidden')).toBeNull();
  });

  test('prémer repetidament «Nou tiquet de barra» reutilitza el tiquet buit existent (0 línies · 0,00 €) i tiquetsOberts no duplica buits', async () => {
    const magatzem = await magatzemDeProva({ ambTorn: true });
    munta('/app/bar/taules', magatzem);
    const botoNou = await screen.findByRole('button', { name: 'Nou tiquet de barra' });

    fireEvent.click(botoNou);
    await waitFor(async () => expect(await magatzem.base.totes('comandes')).toHaveLength(1));
    const [primera] = await magatzem.base.totes('comandes');

    /* Segon i tercer clic mentre continua buida (0 línies · 0,00 €): no en crea cap altra. */
    const botoCaixa = await screen.findByRole('button', { name: 'Nou tiquet de barra' });
    fireEvent.click(botoCaixa);
    fireEvent.click(botoCaixa);
    await new Promise((r) => setTimeout(r, 30));
    const comandes = await magatzem.base.totes('comandes');
    expect(comandes).toHaveLength(1);
    expect(comandes[0].id).toBe(primera.id);

    /* Defensa addicional sobre dades preexistents amb dos buits del mateix origen. */
    const b1 = creaComanda({ id: 'c-buit-1', tornId: 'torn-r3219', origen: { tipus: 'barra' }, ara: '2026-10-02T08:01:00.000Z', per: 'Cambrer 1' });
    const b2 = creaComanda({ id: 'c-buit-2', tornId: 'torn-r3219', origen: { tipus: 'barra' }, ara: '2026-10-02T08:01:20.000Z', per: 'Cambrer 1' });
    const vestides = tiquetsOberts([b1, b2], { taules: [] }, 'ca');
    expect(vestides).toHaveLength(1);
    expect(vestides[0].id).toBe('c-buit-2');
  });
});

describe('R32.19 · P1-CRAFT-01b · Fast Refresh pur en GestioMembres.jsx i TaulerTelemetria.jsx', () => {
  test.each([
    ['src/sections/profile/GestioMembres.jsx', ['TriaTitular', 'GestioMembres', 'default']],
    ['src/sections/text/TaulerTelemetria.jsx', ['default']]
  ])('%s només exporta components React', (rel, esperats) => {
    const codi = readFileSync(path.join(process.cwd(), rel), 'utf8');
    const ast = parse(codi, { sourceType: 'module', plugins: ['jsx'] });
    const exportats = [];
    for (const node of ast.program.body) {
      if (node.type === 'ExportDefaultDeclaration') exportats.push('default');
      else if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration?.id?.name) exportats.push(node.declaration.id.name);
        if (node.declaration?.declarations) {
          for (const d of node.declaration.declarations) if (d.id?.name) exportats.push(d.id.name);
        }
        for (const s of node.specifiers || []) exportats.push(s.exported.name);
      }
    }
    expect(exportats).toEqual(esperats);
  });
});
