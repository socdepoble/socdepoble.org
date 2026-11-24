/**
 * VersionsDosNivellsLazy.r32_48.test.jsx — Onada v1.2.23 · Lot 01 (IDEA-332 Opció A)
 *
 * Verifica l'arquitectura de /versions en 2 nivells:
 *   1. Nivell 1 lleuger: QuadreEstatCanalsVersions (QuadreDeComandament sense
 *      falsa alarma a localhost/WP, D-V1223-BOTO-BETA-OCULT per a TestFlight,
 *      regla 2.3.10 en app nativa) + només les últimes versions recents (3–5 H3).
 *   2. Nivell 2 sota demanda: el paquet històric (~750 KB) NO es demana en
 *      obrir /versions; es carrega amb import() en prémer el botó central
 *      «Consultar l'arxiu històric complet (2013 – versions anteriors)» en les
 *      5 llengües (ca, es, en, eu, gl) amb paritat byte a byte.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { VERSIO_SISTEMA } from '../../config/versio.js';
import { PLATAFORMA_ALIENA } from './perAppNativa.js';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import ArxiuHistoricVersions, { TEXTOS_ARXIU_HISTORIC_VERSIONS } from './ArxiuHistoricVersions.jsx';
import QuadreEstatCanalsVersions, {
  TEXTOS_QUADRE_CANALS_VERSIONS,
  extreuVersioConnectorWp,
} from './QuadreEstatCanalsVersions.jsx';
import TextSection from './TextSection.jsx';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

let idiomaMock = 'ca';

vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    language: idiomaMock,
    resolveAsset: (cami) => cami,
    t: (_clau, reserva) => reserva ?? _clau,
  }),
  useUIActionsOpcional: () => ({
    language: idiomaMock,
    resolveAsset: (cami) => cami,
    t: (_clau, reserva) => reserva ?? _clau,
  }),
  useUIState: () => ({
    externalConfig: null,
  }),
}));

vi.mock('../../hooks/usePublicadorsBarraRecurs.js', () => ({
  usePublicadorsBarraRecurs: () => ({ publicadorsRegistrats: [] }),
}));

vi.mock('../../hooks/useEdicioEnLloc.js', () => ({
  useEdicioEnLloc: () => ({ editarVisible: false, onEdit: null, editLabel: '' }),
}));

afterEach(() => {
  idiomaMock = 'ca';
  cleanup();
  vi.restoreAllMocks();
});

describe('IDEA-332 · Nivell 1: QuadreEstatCanalsVersions i últimes versions lleugeres', () => {
  test('a localhost i al connector de WordPress no consulta ard.json ni mostra «no s’ha pogut comprovar»', () => {
    const fetchSpy = vi.fn();
    for (const origen of ['http://localhost:3340', 'https://gentdelatorre.net']) {
      const { container } = render(
        <QuadreEstatCanalsVersions
          llengua="ca"
          etiquetes={PAGE_COPY.versions.labels}
          plataforma="web"
          nativa={false}
          origen={origen}
          fetchImpl={fetchSpy}
        />
      );
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(container.textContent).not.toMatch(/no s’ha pogut comprovar|no se ha podido comprobar|could not be checked/i);
      expect(screen.getByTestId('linia-versio-installada').textContent).toBe(
        `Instal·lada al dispositiu: ${VERSIO_SISTEMA} (web)`
      );
      expect(container.querySelector('h2')).toBeNull();
      expect(container.querySelector('h3')?.textContent).toBe(TEXTOS_QUADRE_CANALS_VERSIONS.ca.titol);
      // D-V1223-BOTO-BETA-OCULT: cap botó ni enllaç públic de TestFlight ni d'APK directe
      const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
      expect(hrefs.some((h) => /testflight|\.apk|play\.google\.com/i.test(h))).toBe(false);
      expect(hrefs).toContain('https://apps.apple.com/es/app/soc-de-poble/id6826441844');
      expect(hrefs).toContain('https://wordpress.org/plugins/socdepoble/');
      // Botons centrats (.sdp-accions) i amb icona viva dins de cada enllaç
      const grup = container.querySelector('.sdp-accions[role="group"]');
      expect(grup).not.toBeNull();
      for (const link of grup.querySelectorAll('a')) {
        expect(link.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
        expect(link.getAttribute('title')?.length).toBeGreaterThan(5);
      }
      cleanup();
    }
  });

  test('a socdepoble.org llig ard.json una sola vegada i reflectix versió i builds publicats', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        version: '1.2.22',
        androidBuild: 1,
        iosBuild: 1,
        entries: [],
      }),
    }));
    render(
      <QuadreEstatCanalsVersions
        llengua="ca"
        etiquetes={[{ text: 'v1.2.22 · WP v1.1.29' }]}
        plataforma="web"
        nativa={false}
        origen="https://socdepoble.org"
        fetchImpl={fetchMock}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('linia-versio-installada').textContent).toBe(
        `Instal·lada al dispositiu: ${VERSIO_SISTEMA} (web) · Última publicada: 1.2.22`
      );
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('versions-quadre-canals').textContent).toContain('v1.1.29');
    expect(screen.getByTestId('versions-quadre-canals').textContent).toContain('Publicada · build 1');
  });

  test('dins d’app nativa (regla 2.3.10 d’Apple App Store) no nomena Google Play, Android, APK ni botigues externes', () => {
    const { container } = render(
      <QuadreEstatCanalsVersions
        llengua="ca"
        etiquetes={PAGE_COPY.versions.labels}
        plataforma="ios"
        nativa={true}
        origen="capacitor://localhost"
        fetchImpl={async () => ({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ version: '1.2.22', androidBuild: 1, iosBuild: 1, entries: [] }),
        })}
      />
    );
    expect(PLATAFORMA_ALIENA.test(container.textContent)).toBe(false);
    expect(container.textContent).not.toMatch(/WordPress/i);
    expect(container.querySelectorAll('a[href]')).toHaveLength(0);
  });

  test.each(LLENGUES)('paritat completa de textos i absència de plantilla crua en %s', (lang) => {
    expect(extreuVersioConnectorWp([{ text: 'v1.2.23 · WP v1.1.31' }])).toBe('1.1.31');
    const { container } = render(
      <QuadreEstatCanalsVersions
        llengua={lang}
        etiquetes={PAGE_COPY.versions.labels}
        plataforma="web"
        nativa={false}
        origen="http://localhost:3340"
      />
    );
    expect(container.textContent).not.toMatch(/\{|\}/);
    expect(container.querySelector('h3')?.textContent).toBe(TEXTOS_QUADRE_CANALS_VERSIONS[lang].titol);

    const nivell1 = localitzaPagina(PAGE_COPY.versions, lang, 'versions');
    const h3s = [...nivell1.html.matchAll(/<h3>/g)];
    expect(h3s.length).toBeGreaterThanOrEqual(3);
    expect(h3s.length).toBeLessThanOrEqual(5);
    expect(nivell1.html).not.toContain('3 de novembre de 2026 · v1.1.0');
  });
});

describe('IDEA-332 · Nivell 2: ArxiuHistoricVersions sota demanda en 5 llengües', () => {
  test.each(LLENGUES)(
    '%s · NO carrega el mòdul històric a l’entrada i el desplega en prémer el botó central',
    async (lang) => {
      const carregadorSpy = vi.fn(() => import('./pageContent.versionsHistoric.js'));
      render(<ArxiuHistoricVersions llengua={lang} carregador={carregadorSpy} />);

      const boto = screen.getByTestId('versions-boto-arxiu-historic');
      expect(boto.textContent).toContain(TEXTOS_ARXIU_HISTORIC_VERSIONS[lang].obrir);
      expect(boto.getAttribute('aria-expanded')).toBe('false');
      expect(boto.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      expect(carregadorSpy).not.toHaveBeenCalled();
      expect(screen.queryByTestId('versions-arxiu-historic')).toBeNull();

      fireEvent.click(boto);
      expect(carregadorSpy).toHaveBeenCalledTimes(1);

      const regio = await screen.findByTestId('versions-arxiu-historic');
      expect(boto.getAttribute('aria-expanded')).toBe('true');
      expect(boto.textContent).toContain(TEXTOS_ARXIU_HISTORIC_VERSIONS[lang].plegar);
      expect(regio.querySelector('h2')).toBeNull();
      expect(regio.querySelectorAll('h3').length).toBeGreaterThan(25);
      expect(regio.textContent).toContain('2013');
      expect(regio.textContent).toContain('v1.1.0');

      // Plegar i tornar a desplegar reutilitza el mòdul ja carregat sense segon import()
      fireEvent.click(screen.getByTestId('versions-boto-plegar-historic'));
      expect(screen.queryByTestId('versions-arxiu-historic')).toBeNull();
      expect(boto.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(boto);
      expect(await screen.findByTestId('versions-arxiu-historic')).not.toBeNull();
      expect(carregadorSpy).toHaveBeenCalledTimes(1);
    }
  );

  test('gestiona una fallada de xarxa de l’import() amb Alerta d’avís i permet reintentar', async () => {
    let fallar = true;
    const carregador = vi.fn(async () => {
      if (fallar) throw new Error('ChunkLoadError');
      return import('./pageContent.versionsHistoric.js');
    });

    render(<ArxiuHistoricVersions llengua="ca" carregador={carregador} />);
    const boto = screen.getByTestId('versions-boto-arxiu-historic');

    fireEvent.click(boto);
    await waitFor(() => {
      expect(screen.getByText(TEXTOS_ARXIU_HISTORIC_VERSIONS.ca.error)).toBeTruthy();
    });
    expect(boto.getAttribute('aria-expanded')).toBe('false');

    fallar = false;
    fireEvent.click(boto);
    expect(await screen.findByTestId('versions-arxiu-historic')).not.toBeNull();
    expect(screen.queryByText(TEXTOS_ARXIU_HISTORIC_VERSIONS.ca.error)).toBeNull();
  });

  test('TextSection munta /versions amb Nivell 1, QuadreEstatCanalsVersions i botó d’arxiu històric sense H2', async () => {
    idiomaMock = 'ca';
    const { container } = render(
      <MemoryRouter initialEntries={['/versions']}>
        <TextSection page={PAGE_COPY.versions} pageKey="versions" />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByTestId('versions-quadre-canals')).toBeTruthy();
      expect(screen.getByTestId('versions-boto-arxiu-historic')).toBeTruthy();
    });
    expect(container.querySelector('main h2, .cms-preview h2')).toBeNull();
    expect(screen.queryByTestId('versions-arxiu-historic')).toBeNull();
    expect(container.textContent).not.toMatch(/no s’ha pogut comprovar/);
  });
});
