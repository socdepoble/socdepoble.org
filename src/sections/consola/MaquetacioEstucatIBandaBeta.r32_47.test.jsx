import { cleanup, render, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { CopyrightPage } from '../../components/universal/drets/CopyrightPage.jsx';
import { GestorMultimediaLocal } from '../multimedia/GestorMultimediaLocal.jsx';
import { FitxaWeb } from '../multimedia/PaginesEspaiMultimedia.jsx';
import {
  TEXTOS_BANDA_BETA_FISCAL,
  TEXTOS_BANDA_BETA_GENERAL,
} from '../../components/PedraSeca/index.js';
import { ENTORN_OBERT, muntaPlataforma } from '../../apps/plataforma/__fixtures__/munta.jsx';
import { LLENGUES_APP } from '../../apps/plataforma/manifestApp.js';
import { creaRegistre } from '../../apps/plataforma/registreApps.js';
import manifestGestoria from '../../apps/gestoria/manifest.js';
import manifestBar from '../../apps/bar/manifest.js';
import manifestNevera from '../../apps/nevera/manifest.js';
import manifestSalut from '../../apps/salut/manifest.js';

const llig = (rel) => readFileSync(path.join(process.cwd(), rel), 'utf8');

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('Onada R32.47 (Ronda G3) · Maquetació Canònica 0 Infraccions, Estucat Net i Escut Legal Beta IDEA-285', () => {
  test('Lot 01 · CopyrightPage, GestorMultimediaLocal autònom i FitxaWeb sense subtítol usen H3 canònic i zero H1/H2 interns', () => {
    const drets = render(<CopyrightPage valor="© Sóc de Poble" autor="Javi" onDesa={() => {}} onTanca={() => {}} />);
    expect(within(drets.container).getByRole('heading', { level: 3, name: 'Drets d’autor' })).toBeTruthy();
    expect(drets.container.querySelector('h1, h2')).toBeNull();
    cleanup();

    const gestor = render(<GestorMultimediaLocal cens={new Map()} entorn={{}} />);
    expect(within(gestor.container).getByRole('heading', { level: 3, name: 'Gestor d’arxius locals' })).toBeTruthy();
    expect(gestor.container.querySelector('h1, h2')).toBeNull();
    cleanup();

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
    const espai = {
      t: (_clau, text) => text,
      cens: null,
      obriVisor: () => {},
      visorObert: false,
      refTitol: null,
    };
    const fitxa = render(
      <MemoryRouter rutaInicial="/multimedia">
        <FitxaWeb espai={espai} item={{ id: 'foto-sense-etiqueta', title: 'Olivera centenària', src: '/assets/img/pi-pla-verd.jpg' }} />
      </MemoryRouter>
    );
    const cos = fitxa.container.querySelector('.sdp-espai-multimedia__cos');
    expect(cos).not.toBeNull();
    expect(cos.querySelector('h2')).toBeNull();
    expect(within(cos).getByRole('heading', { level: 3, name: 'Dades de la imatge' })).toBeTruthy();
  });

  test('Lot 01 + Lot 02 · CSS sense --sdp-measure en els 9 selectors migrats i extirpació total de btn-secondary i btn-taronja-fort', () => {
    const componentsCss = llig('src/css/components.css');
    const connectarCss = llig('src/css/diferit-connectar.css');
    const modulesCss = llig('src/css/modules.css');
    const deuteEstucat = JSON.parse(llig('.agents/deute/.estucat-deute.json'));

    expect(componentsCss).not.toContain('--sdp-measure');
    expect(componentsCss).not.toContain('.btn-secondary');
    expect(componentsCss).not.toContain('.btn-taronja-fort');
    expect(deuteEstucat.orfes).not.toContain('src/css/components.css::btn-secondary');
    expect(deuteEstucat.orfes).not.toContain('src/css/components.css::btn-taronja-fort');

    expect(connectarCss).not.toMatch(/\.sdp-connectar\s*\{[^}]*--sdp-measure/);
    for (const selector of [
      /\.sdp-xat-control__panell\s*\{[^}]*--sdp-measure/,
      /\.sdp-xat-dialeg__panell\s*>\s*p\s*\{[^}]*--sdp-measure/,
      /\.sdp-xat-construccio__avis\s*\{[^}]*--sdp-measure/,
      /\.sdp-xat-ajustos__nota\s*\{[^}]*--sdp-measure/,
      /\.sdp-xat-pindola-push__text\s*\{[^}]*--sdp-measure/,
      /\.sdp-xat-ajustos__buit-text\s*\{[^}]*--sdp-measure/,
      /\.sdp-assigna-emoji\s*\{[^}]*--sdp-measure/,
    ]) {
      expect(modulesCss).not.toMatch(selector);
    }
  });

  test.each(LLENGUES_APP)('Lot 03 · IDEA-285 escut legal Beta en 5 llengües (%s) per a Gestoria, Bar, Nevera i Salut, incloent mòdul sdp.modul.v1', async (lang) => {
    for (const [cru, esperatTipus] of [
      [manifestGestoria, 'fiscal'],
      [manifestBar, 'fiscal'],
      [manifestNevera, 'general'],
      [manifestSalut, 'general'],
    ]) {
      const registre = creaRegistre({
        internes: [{
          ...cru,
          carrega: () => Promise.resolve({ default: () => <p>Cos {cru.id}</p> }),
        }],
      });
      const { container } = muntaPlataforma(`/app/${cru.id}/${cru.entradaPerDefecte}`, {
        registre,
        entorn: { ...ENTORN_OBERT, produccio: false },
        externalConfig: { language: lang },
      });
      expect(await within(container).findByText(`Cos ${cru.id}`)).toBeTruthy();
      const banda = container.querySelector(`[data-sdp-banda-beta="${esperatTipus}"]`);
      expect(banda).not.toBeNull();
      const esperatText = esperatTipus === 'fiscal'
        ? TEXTOS_BANDA_BETA_FISCAL[lang].text
        : TEXTOS_BANDA_BETA_GENERAL[lang].text;
      expect(banda.textContent).toBe(esperatText);
      cleanup();
    }

    // Verifica que una micro-app compilada com a mòdul enxufable (origen 'modul') també conserva l'escut legal Beta
    const registreModul = creaRegistre({
      internes: [],
      carregador: {
        carregaCos: async () => ({ default: () => <p>Bar modular carregat</p> }),
        carregaEstils: async () => {},
      },
    });
    const alta = registreModul.registraModul({
      schema: 'sdp.app.v1',
      id: 'bar',
      nucli: '^1',
      titol: manifestBar.titol,
      icona: manifestBar.icona,
      avisBeta: 'fiscal',
      entrades: [{ slug: 'comanda', titol: { ca: 'Comanda', es: 'Pedido', en: 'Order', eu: 'Eskaera', gl: 'Pedido' }, icona: 'Utensils' }],
      entradaPerDefecte: 'comanda',
      permisos: { veure: 'public' },
      capacitats: [],
      nivell: 'gratuit',
      actiuPerDefecte: true,
      entorn: 'produccio',
      dadesPersonals: false,
      cos: { cami: '/moduls/bar/index.js', integrity: 'sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
    });
    expect(alta.errors).toEqual([]);
    expect(alta.ok).toBe(true);
    const vistaModul = muntaPlataforma('/app/bar/comanda', {
      registre: registreModul,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang },
    });
    expect(await within(vistaModul.container).findByText('Bar modular carregat')).toBeTruthy();
    const bandaModul = vistaModul.container.querySelector('[data-sdp-banda-beta="fiscal"]');
    expect(bandaModul).not.toBeNull();
    expect(bandaModul.textContent).toBe(TEXTOS_BANDA_BETA_FISCAL[lang].text);
  });
});
