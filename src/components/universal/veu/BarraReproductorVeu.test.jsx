/**
 * BarraReproductorVeu.test.jsx · IDEA-255 (Onada R23 · 14-11-2026) · Suite
 * exhaustiva del Reproductor Flotant Universal de Veu en PageFrame:
 *   · Botó universal «Escolta la IAIA» baix l'entradilla en pàgines de lectura
 *     i absència en mode edició o pàgines buides.
 *   · Unificació sense duplicats dins LaVeuDeSocDePobleArticle i
 *     NovesTecnologiesCulturaRuralArticle quan es munten dins PageFrame.
 *   · Cua determinista [0..N-1] amb Pausa / Continua que conserva l'indexActual
 *     sense reiniciar a 0, Anterior / Següent, selector d'apartats i cerca en
 *     viu, ressaltat suau (.sdp-veu-bloc-actiu), Copiar fragment, Tancar amb
 *     retorn de focus, vista compacta (is-compact) i portal en ShadowRoot tancat.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { UIActionsContext } from '../../../app/contexts/objectesDeContext.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../../config/i18n.js';
import { RouterProvider } from '../../../app/contexts/RouterContext.jsx';
import { PageFrame } from '../PageFrame.jsx';
import { BarraReproductorVeu } from './BarraReproductorVeu.jsx';
import { CLASSE_BLOC_VEU_ACTIU, extreuBlocsLecturaVeu } from './lectorPaginaVeu.js';
import { useVeuLecturaPaginaActiva } from './VeuLecturaPaginaContext.js';
import { FONT_SO_RADIO_MOSTRA } from '../../../sections/disseny/cataleg/detalls/EspecimenBarraReproductorVeu.jsx';
import { LA_VEU_DE_SOC_DE_POBLE_POST, LA_VEU_DE_SOC_DE_POBLE_RUTA } from '../../../sections/mur/articles/laVeuDeSocDePobleContent.js';
import { LaVeuDeSocDePobleArticle } from '../../../sections/mur/articles/LaVeuDeSocDePobleArticle.jsx';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST, NOVES_TECNOLOGIES_CULTURA_RURAL_RUTA } from '../../../sections/mur/articles/novesTecnologiesCulturaRuralContent.js';
import NovesTecnologiesCulturaRuralArticle from '../../../sections/mur/articles/NovesTecnologiesCulturaRuralArticle.jsx';
import * as serveiVeu from '../../../services/veuIaiaService.js';

vi.mock('../../../services/veuIaiaService.js', async () => {
  const real = await vi.importActual('../../../services/veuIaiaService.js');
  return {
    ...real,
    // Port antic injectat: la suite de sessió R32.7 prova el motor real a banda.
    creaSessioVeu: undefined,
    parla: vi.fn(),
    atura: vi.fn(),
    llegeixVeuPreferida: vi.fn(() => ''),
    subscriuVeuPreferida: vi.fn(() => () => {}),
  };
});

function creaPausaControlada() {
  const pendents = [];
  const impl = vi.fn((text, opcions = {}) => new Promise((resolve, reject) => {
    const item = { text, opcions, resolve, reject, avortat: false };
    if (opcions.signal?.aborted) {
      const err = new Error('Avortat');
      err.codi = serveiVeu.CODI_VEU_AVORTADA;
      reject(err);
      return;
    }
    opcions.signal?.addEventListener?.('abort', () => {
      item.avortat = true;
      const err = new Error('Avortat');
      err.codi = serveiVeu.CODI_VEU_AVORTADA;
      reject(err);
    }, { once: true });
    pendents.push(item);
  }));
  return { impl, pendents };
}

function PaginaLecturaMostra({ onCanviaCopyright, fills = null }) {
  return (
    <RouterProvider initialPath="/page/node-zero">
      <div className="sdp-root">
        <PageFrame
          title="Node 0 · El cervell i la veu al poble"
          subtitle="Tecnologia oberta amb trellat des de la Torre de les Maçanes"
          lead="Una infraestructura local que unix memòria col·lectiva, models oberts i veu valenciana."
          onCanviaCopyright={onCanviaCopyright}
        >
          <h3>Primer apartat · Les escoles del Node 0</h3>
          <p>
            Al Mac mini M4 conviuen les escoles obertes que revisen cada canvi amb rigor abans de pujar a producció.
          </p>
          <h3>Segon apartat · El laboratori de la veu</h3>
          <p>
            Matxa-TTS v2 sintetitza en menys d’un segon amb veus obertes verificades acústicament i suport de NEL-VIVES.
          </p>
          <div data-sdp-no-locutar="">
            <p>Text exclòs expressament de la locució.</p>
          </div>
          {fills}
        </PageFrame>
      </div>
    </RouterProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('IDEA-255 · Reproductor Flotant Universal de Veu (PageFrame + BarraReproductorVeu)', () => {
  test('extreuBlocsLecturaVeu indexa H1, H2, lead, H3 i paràgrafs en ordre [0..N-1] i omet [data-sdp-no-locutar]', () => {
    const { container } = render(<PaginaLecturaMostra />);
    const capcalera = container.querySelector('header.page-title');
    const cos = container.querySelector('.content-wrapper');
    const blocs = extreuBlocsLecturaVeu({ capcalera, cos });

    expect(blocs.map((b) => b.etiqueta)).toEqual(['h1', 'h2', 'lead', 'h3', 'p', 'h3', 'p']);
    expect(blocs.map((b) => b.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(blocs[0].text).toBe('Node 0 · El cervell i la veu al poble');
    expect(blocs[4].seccioTitol).toBe('Primer apartat · Les escoles del Node 0');
    expect(blocs.some((b) => b.text.includes('Text exclòs expressament'))).toBe(false);
  });

  test('oculta el botó universal en mode edició o en pantalles sense prosa editorial', () => {
    const { rerender } = render(<PaginaLecturaMostra onCanviaCopyright={() => {}} />);
    expect(screen.queryByRole('button', { name: /Escolta la IAIA/i })).toBeNull();

    rerender(
      <RouterProvider initialPath="/consola">
        <PageFrame title="Consola">
          <div role="status">Carregant dades…</div>
        </PageFrame>
      </RouterProvider>
    );
    expect(screen.queryByRole('button', { name: /Escolta la IAIA/i })).toBeNull();
  });

  test('no duplica el botó d’escolta quan LaVeuDeSocDePobleArticle o NovesTecnologiesCulturaRuralArticle viuen dins PageFrame', async () => {
    const { unmount } = render(
      <RouterProvider initialPath={LA_VEU_DE_SOC_DE_POBLE_RUTA}>
        <PageFrame
          title={LA_VEU_DE_SOC_DE_POBLE_POST.title}
          subtitle={LA_VEU_DE_SOC_DE_POBLE_POST.post_subtitle}
          lead={LA_VEU_DE_SOC_DE_POBLE_POST.summary}
        >
          <LaVeuDeSocDePobleArticle item={LA_VEU_DE_SOC_DE_POBLE_POST} />
        </PageFrame>
      </RouterProvider>
    );

    const botonsVeu = await screen.findAllByRole('button', { name: /Escolta la IAIA/i });
    expect(botonsVeu).toHaveLength(1);
    unmount();

    render(
      <RouterProvider initialPath={NOVES_TECNOLOGIES_CULTURA_RURAL_RUTA}>
        <PageFrame
          title={NOVES_TECNOLOGIES_CULTURA_RURAL_POST.title}
          subtitle={NOVES_TECNOLOGIES_CULTURA_RURAL_POST.post_subtitle}
          lead={NOVES_TECNOLOGIES_CULTURA_RURAL_POST.summary}
        >
          <NovesTecnologiesCulturaRuralArticle item={NOVES_TECNOLOGIES_CULTURA_RURAL_POST} />
        </PageFrame>
      </RouterProvider>
    );

    const botonsNoves = await screen.findAllByRole('button', { name: /Escolta la IAIA/i });
    expect(botonsNoves).toHaveLength(1);
  });

  test('Pausa / Continua conserva exactament el bloc actiu sense reiniciar a 0, navega, cerca, copia i tanca netejant el ressaltat', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const { container } = render(<PaginaLecturaMostra />);
    const botoEscolta = await screen.findByRole('button', { name: /Escolta la IAIA/i });

    fireEvent.click(botoEscolta);

    const barra = await screen.findByRole('complementary', { name: /Reproductor de lectura en veu alta/i });
    expect(barra).toBeTruthy();

    await waitFor(() => {
      expect(cua.pendents.length).toBe(1);
    });
    expect(cua.pendents[0].text).toBe('Node 0 · El cervell i la veu al poble');
    expect(container.querySelector('h1')?.classList.contains(CLASSE_BLOC_VEU_ACTIU)).toBe(true);

    /* Avancem naturalment del bloc 0 (H1) al bloc 1 (H2) i al bloc 2 (lead). */
    await act(async () => {
      cua.pendents[0].resolve({ canal: 'local' });
    });
    await waitFor(() => expect(cua.pendents.length).toBe(2));
    expect(cua.pendents[1].text).toContain('Tecnologia oberta amb trellat');

    await act(async () => {
      cua.pendents[1].resolve({ canal: 'local' });
    });
    await waitFor(() => expect(cua.pendents.length).toBe(3));
    expect(cua.pendents[2].text).toContain('Una infraestructura local');
    expect(screen.getByText('Bloc 3 de 7')).toBeTruthy();

    /* PAUSA al bloc index 2 (Bloc 3 de 7) i CONTINUA: ha de reprendre exactament al bloc index 2, MAI al bloc 0! */
    fireEvent.click(screen.getByRole('button', { name: /Pausa la lectura/i }));
    expect(serveiVeu.atura).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Continua la lectura/i })).toBeTruthy();
    expect(screen.getByText('Bloc 3 de 7')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Continua la lectura/i }));
    await waitFor(() => expect(cua.pendents.length).toBe(4));
    expect(cua.pendents[3].text).toContain('Una infraestructura local');
    expect(screen.getByText('Bloc 3 de 7')).toBeTruthy();

    /* Salt amb Següent i Anterior */
    fireEvent.click(screen.getByRole('button', { name: /Bloc següent/i }));
    await waitFor(() => expect(screen.getByText('Bloc 4 de 7')).toBeTruthy());
    expect(cua.pendents.at(-1).text).toBe('Primer apartat · Les escoles del Node 0');

    /* Cerca per apartat o paraula i salt directe */
    fireEvent.click(screen.getByRole('button', { name: /Apartats i cerca al text/i }));
    const inputCerca = screen.getByPlaceholderText(/Cerca una paraula o apartat/i);
    fireEvent.change(inputCerca, { target: { value: 'Matxa-TTS' } });

    const botoResultat = screen.getByRole('button', { name: /Matxa-TTS v2 sintetitza/i });
    fireEvent.click(botoResultat);
    await waitFor(() => expect(screen.getByText('Bloc 7 de 7')).toBeTruthy());
    const cridesAbans = cua.pendents.length;
    expect(cua.pendents.at(-1).text).toContain('Matxa-TTS v2 sintetitza');

    /* R24 · Batching React 18/19 (cicleCua): tornar a saltar al mateix bloc mentre ja està parlant re-dispara la locució netament */
    fireEvent.click(screen.getByRole('button', { name: /Apartats i cerca al text/i }));
    fireEvent.click(screen.getByRole('button', { name: /Matxa-TTS v2 sintetitza/i }));
    await waitFor(() => expect(cua.pendents.length).toBeGreaterThan(cridesAbans));
    expect(cua.pendents.at(-1).text).toContain('Matxa-TTS v2 sintetitza');

    /* Copiar fragment actual */
    fireEvent.click(screen.getByRole('button', { name: /Copiar fragment actual/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        'Matxa-TTS v2 sintetitza en menys d’un segon amb veus obertes verificades acústicament i suport de NEL-VIVES.'
      );
    });

    /* Tancar: atura veu, neteja el ressaltat .sdp-veu-bloc-actiu, oculta barra i retorna focus al botó activador */
    const botoTanca = screen.getByRole('button', { name: /Tancar el reproductor de veu/i });
    botoTanca.focus();
    fireEvent.click(botoTanca);

    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: /Reproductor de lectura en veu alta/i })).toBeNull();
    });
    expect(container.querySelectorAll(`.${CLASSE_BLOC_VEU_ACTIU}`)).toHaveLength(0);
    await waitFor(() => {
      expect(document.activeElement).toBe(botoEscolta);
    });
  });

  test('marca data-compacte="true" en vista mòbil (.sdp-root.is-compact) i funciona dins d’un ShadowRoot tancat', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);

    if (!customElements.get('soc-de-poble')) {
      customElements.define('soc-de-poble', class extends HTMLElement {});
    }
    const amfitrio = document.createElement('soc-de-poble');
    document.body.appendChild(amfitrio);
    const ombra = amfitrio.attachShadow({ mode: 'closed' });
    const muntatge = document.createElement('div');
    muntatge.className = 'sdp-root is-compact';
    ombra.appendChild(muntatge);

    const arrel = createRoot(muntatge);
    await act(async () => {
      arrel.render(
        <RouterProvider initialPath="/page/node-zero">
          <PageFrame
            title="Node 0 en ombra tancada"
            subtitle="Subtítol en ombra"
            lead="Entradilla per a provar el portal dins d’un ShadowRoot tancat."
          >
            <p>Paràgraf complet dins de l’arrel d’ombra tancada per verificar capaDeDalt i vista compacta.</p>
          </PageFrame>
        </RouterProvider>
      );
    });

    await waitFor(() => {
      expect(ombra.querySelector('.sdp-veu-lectura-marc button')).not.toBeNull();
    });
    const boto = ombra.querySelector('.sdp-veu-lectura-marc button');

    await act(async () => {
      boto.click();
    });

    await waitFor(() => {
      expect(ombra.querySelector('.sdp-barra-veu')).not.toBeNull();
    });
    const barraEnOmbra = ombra.querySelector('.sdp-barra-veu');
    expect(barraEnOmbra.getAttribute('data-compacte')).toBe('true');
    expect(document.body.querySelector('.sdp-barra-veu')).toBeNull();

    await act(async () => {
      arrel.unmount();
    });
    amfitrio.remove();
  });

  test('IDEA-268 · en mòbil marca data-sdp-veu-oberta="true" i «Tria esta veu» obri sempre el reproductor inferior', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);

    const { container } = render(
      <RouterProvider initialPath={LA_VEU_DE_SOC_DE_POBLE_RUTA}>
        <div className="sdp-root is-compact">
          <PageFrame
            title={LA_VEU_DE_SOC_DE_POBLE_POST.title}
            subtitle={LA_VEU_DE_SOC_DE_POBLE_POST.post_subtitle}
            lead={LA_VEU_DE_SOC_DE_POBLE_POST.summary}
          >
            <LaVeuDeSocDePobleArticle item={LA_VEU_DE_SOC_DE_POBLE_POST} />
          </PageFrame>
        </div>
      </RouterProvider>
    );

    const sdpRoot = container.querySelector('.sdp-root');
    expect(sdpRoot.getAttribute('data-sdp-veu-oberta')).toBeNull();

    const botonsTriaVeu = await screen.findAllByRole('button', { name: /Tria esta veu|Veu preferida/i });
    fireEvent.click(botonsTriaVeu[0]);

    const barra = await screen.findByRole('complementary', { name: /Reproductor de lectura en veu alta/i });
    expect(sdpRoot.contains(barra)).toBe(true);
    expect(barra.getAttribute('data-compacte')).toBe('true');
    expect(sdpRoot.getAttribute('data-sdp-veu-oberta')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /Tancar el reproductor de veu/i }));
    await waitFor(() => {
      expect(sdpRoot.getAttribute('data-sdp-veu-oberta')).toBeNull();
    });
  });

  test('IDEA-268 · centra geomètricament la barra sobre el panell de lectura actiu (sidebar 260px) i admet fontSo d’àudio per a Ràdio de Poble', async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

    const fontRadio = {
      tipus: 'audio',
      titolEmissio: 'Ràdio de Poble · Emissió de prova',
      pistes: [
        { id: 'p1', titol: 'Crònica matinal de la Muntanya', subtitol: 'Ràdio de Poble', src: '/assets/audio/veus_node0/mostra_08_arnau_valencia.wav' },
        { id: 'p2', titol: 'El temps i el camp', subtitol: 'Ràdio de Poble', src: '/assets/audio/veus_node0/mostra_07_gina_valencia.wav' },
      ],
    };

    const { container } = render(
      <RouterProvider initialPath="/page/node-zero">
        <div className="sdp-root">
          <nav className="app-sidebar" aria-label="Menú lateral" />
          <main className="app-main">
            <PageFrame
              title="Ràdio de Poble"
              subtitle="Emissió comunitària"
              lead="Canal sonor compartit del projecte."
              fontSo={fontRadio}
            >
              <p>Contingut sonor obert preparat per a la futura emissora comunitària.</p>
            </PageFrame>
          </main>
        </div>
      </RouterProvider>
    );

    const sdpRoot = container.querySelector('.sdp-root');
    const panell = container.querySelector('.sdp-universal-page-container');
    vi.spyOn(sdpRoot, 'getBoundingClientRect').mockReturnValue({
      left: 0, right: 1440, top: 0, bottom: 900, width: 1440, height: 900, x: 0, y: 0, toJSON: () => {},
    });
    vi.spyOn(panell, 'getBoundingClientRect').mockReturnValue({
      left: 260, right: 1440, top: 0, bottom: 900, width: 1180, height: 900, x: 260, y: 0, toJSON: () => {},
    });

    const botoEscolta = await screen.findByRole('button', { name: /Escolta la IAIA/i });
    fireEvent.click(botoEscolta);

    const barra = await screen.findByRole('complementary', { name: /Ràdio de Poble · Emissió de prova/i });
    expect(barra.getAttribute('data-font-so')).toBe('audio');
    /* Contracte canviat a propòsit (R28): les propietats mesurades en temps
       d'execució són locals (--barra-veu-*), no tokens --sdp-* de tokens.css. */
    expect(barra.style.getPropertyValue('--barra-veu-inici')).toBe('260px');
    expect(barra.style.getPropertyValue('--barra-veu-fi')).toBe('0px');
    expect(barra.style.getPropertyValue('--sdp-barra-veu-inici')).toBe('');
    expect(screen.getByText('Pista 1 de 2')).toBeTruthy();
    expect(screen.getByText('Crònica matinal de la Muntanya')).toBeTruthy();
    await waitFor(() => expect(playSpy).toHaveBeenCalled());

    /* Onada R29 · R29-02-05 · Contracte canviat a propòsit: en mode àudio els controls parlen de pistes,
       no de blocs ni de lectura (el mode lectura conserva «Bloc següent» i «Pausa la lectura»). */
    expect(screen.queryByRole('button', { name: /Bloc següent/i })).toBeNull();
    expect(screen.getByRole('button', { name: /Pista anterior/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Pista següent/i }));
    await waitFor(() => expect(screen.getByText('Pista 2 de 2')).toBeTruthy());
    expect(screen.getByText('El temps i el camp')).toBeTruthy();

    expect(screen.queryByRole('button', { name: /Pausa la lectura/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Pausa l’àudio/i }));
    expect(pauseSpy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Escolta l’àudio/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Llista de pistes i cerca/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Copiar el text de la pista/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Tancar el reproductor de so/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Llista de pistes i cerca/i }));
    expect(screen.getByPlaceholderText('Cerca una pista…')).toBeTruthy();
    expect(screen.getByLabelText('Cerca entre les pistes')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Cerca una pista…'), { target: { value: 'cap pista amb este nom' } });
    expect(screen.getByText('Cap pista coincidix amb la cerca.')).toBeTruthy();

    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });
});

/* ── R28 · Esmenes a IDEA-268 (Kit R27) ───────────────────────────────── */

const llegixCss = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla { selectors, cos } d'un full (sense blocs niats dins del cos). */
function reglesFulla(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, prelud, cos]) => ({
    selectors: prelud.split(',').map((sel) => sel.trim().replace(/\s+/g, ' ')).filter(Boolean),
    cos: cos.replace(/\s+/g, ' ').trim(),
  }));
}

/** Especificitat [ids, classes + atributs + pseudoclasses] d'un selector simple; :where() compta 0. */
function especificitat(selector) {
  const net = selector.replace(/:where\([^()]*\)/g, '');
  const atributs = (net.match(/\[[^\]]*\]/g) || []).length;
  const senseAtributs = net.replace(/\[[^\]]*\]/g, '');
  const classes = (senseAtributs.match(/\.[A-Za-z_-][\w-]*/g) || []).length;
  const pseudo = (senseAtributs.match(/:(?!:)[a-z-]+/g) || []).length;
  const ids = (senseAtributs.match(/#[A-Za-z_-][\w-]*/g) || []).length;
  return [ids, classes + atributs + pseudo];
}
const guanya = ([a1, b1], [a2, b2]) => a1 > a2 || (a1 === a2 && b1 > b2);

function MuntatgeRadio({ idioma, fontSo }) {
  const cosRef = useRef(null);
  return (
    <div className="sdp-root">
      <article ref={cosRef}><p>Cos de prova de la Ràdio de Poble.</p></article>
      <BarraReproductorVeu oberta cosRef={cosRef} idioma={idioma} fontSo={fontSo} />
    </div>
  );
}

describe('R28 · esmenes al Reproductor Universal de So (IDEA-268)', () => {
  test('CSS · amb nav.mobile-nav amagada («totes») la regla de baixar la barra guanya a [data-compacte="true"]', () => {
    const regles = reglesFulla(llegixCss('src/css/diferit-barra-veu.css') + llegixCss('src/css/components.css'));
    const compacte = '.sdp-barra-veu[data-compacte="true"]';
    expect(regles.some((r) => r.selectors.includes(compacte))).toBe(true);

    const totes = regles.flatMap((r) => r.selectors
      .filter((sel) => sel.includes('data-sdp-barres="totes"') && /\.sdp-barra-veu(?![\w-])/.test(sel))
      .map((sel) => ({ sel, cos: r.cos })));
    expect(totes.length).toBeGreaterThan(0);
    for (const { sel, cos } of totes) {
      expect(guanya(especificitat(sel), especificitat(compacte)), `${sel} ha de superar ${compacte}`).toBe(true);
      expect(cos).toMatch(/bottom:/);
      expect(cos).not.toMatch(/--sdp-alt-nav-mobil/);
    }
  });

  test('CSS · les propietats mesurades per JS són locals (--barra-veu-*), sense fallback literal ni ombra afegida', () => {
    const css = llegixCss('src/css/diferit-barra-veu.css') + llegixCss('src/css/components.css');
    expect(css).not.toMatch(/--sdp-barra-veu-/);
    const regles = reglesFulla(css);
    const tornarDalt = regles.find((r) => r.selectors.some((sel) => sel.includes('[data-sdp-veu-oberta="true"]') && sel.includes('.sdp-tornar-dalt')));
    expect(tornarDalt?.cos).toContain('var(--barra-veu-alcada, 0px)');
    const barra = regles.find((r) => r.selectors.includes('.sdp-barra-veu'));
    expect(barra?.cos).toContain('var(--barra-veu-inici)');
    expect(barra?.cos).not.toMatch(/box-shadow/);
  });

  test('Espècimen · les pistes de mostra de Ràdio de Poble apunten a fitxers que existixen a public/', () => {
    expect(FONT_SO_RADIO_MOSTRA.pistes.length).toBeGreaterThan(0);
    for (const pista of FONT_SO_RADIO_MOSTRA.pistes) {
      expect(pista.src, pista.id).toMatch(/^\/assets\/audio\//);
      expect(existsSync(resolve(process.cwd(), 'public', pista.src.slice(1))), pista.src).toBe(true);
    }
  });

  test('canviar de veu en calent després d’un error neteja l’avís i torna a provar el mateix bloc', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    const oients = new Set();
    serveiVeu.subscriuVeuPreferida.mockImplementation((oient) => {
      oients.add(oient);
      return () => oients.delete(oient);
    });
    try {
      render(<PaginaLecturaMostra />);
      fireEvent.click(await screen.findByRole('button', { name: /Escolta la IAIA/i }));
      await waitFor(() => expect(cua.pendents.length).toBe(1));

      await act(async () => {
        cua.pendents[0].reject(new Error('Síntesi no disponible'));
      });
      const avis = 'Este navegador no pot llegir la pàgina en veu alta ara mateix.';
      await waitFor(() => expect(screen.getByText(avis)).toBeTruthy());

      await act(async () => {
        for (const oient of oients) oient('arnau_valencia');
      });
      await waitFor(() => expect(cua.pendents.length).toBe(2));
      expect(screen.queryByText(avis)).toBeNull();
      expect(cua.pendents[1].text).toBe('Node 0 · El cervell i la veu al poble');
      expect(cua.pendents[1].opcions.veu).toBe('arnau_valencia');
      expect(screen.getByRole('button', { name: /Pausa la lectura/i })).toBeTruthy();
    } finally {
      serveiVeu.subscriuVeuPreferida.mockImplementation(() => () => {});
    }
  });

  test('canviar de veu en calent quan la lectura ja ha acabat torna a començar pel bloc 0, com el Play', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    const oients = new Set();
    serveiVeu.subscriuVeuPreferida.mockImplementation((oient) => {
      oients.add(oient);
      return () => oients.delete(oient);
    });
    try {
      render(<PaginaLecturaMostra />);
      fireEvent.click(await screen.findByRole('button', { name: /Escolta la IAIA/i }));
      for (let i = 0; i < 7; i += 1) {
        await waitFor(() => expect(cua.pendents.length).toBe(i + 1));
        await act(async () => {
          cua.pendents[i].resolve({ canal: 'local' });
        });
      }
      await waitFor(() => expect(screen.getByRole('button', { name: /Torna a escoltar des del principi/i })).toBeTruthy());
      expect(screen.getByText('Bloc 7 de 7')).toBeTruthy();

      await act(async () => {
        for (const oient of oients) oient('gina_valencia');
      });
      await waitFor(() => expect(cua.pendents.length).toBe(8));
      expect(cua.pendents[7].text).toBe('Node 0 · El cervell i la veu al poble');
      expect(screen.getByText('Bloc 1 de 7')).toBeTruthy();
    } finally {
      serveiVeu.subscriuVeuPreferida.mockImplementation(() => () => {});
    }
  });

  test('«Tria esta veu» no s’emporta la persona amb el scroll i, en tancar, el focus torna al mateix botó del banc', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    const scrollIntoView = vi.fn();
    const teniaScroll = Object.prototype.hasOwnProperty.call(Element.prototype, 'scrollIntoView');
    const scrollAbans = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      render(
        <RouterProvider initialPath={LA_VEU_DE_SOC_DE_POBLE_RUTA}>
          <div className="sdp-root">
            <PageFrame
              title={LA_VEU_DE_SOC_DE_POBLE_POST.title}
              subtitle={LA_VEU_DE_SOC_DE_POBLE_POST.post_subtitle}
              lead={LA_VEU_DE_SOC_DE_POBLE_POST.summary}
            >
              <LaVeuDeSocDePobleArticle item={LA_VEU_DE_SOC_DE_POBLE_POST} />
            </PageFrame>
          </div>
        </RouterProvider>
      );

      const botoEscolta = await screen.findByRole('button', { name: /Escolta la IAIA/i });
      const focusDalt = vi.spyOn(botoEscolta, 'focus');
      const botonsTria = await screen.findAllByRole('button', { name: /Tria esta veu|Veu preferida/i });
      const botoTria = botonsTria[1];
      fireEvent.click(botoTria);

      await screen.findByRole('complementary', { name: /Reproductor de lectura en veu alta/i });
      await waitFor(() => expect(cua.pendents.length).toBe(1));
      scrollIntoView.mockClear();
      await act(async () => {
        cua.pendents[0].resolve({ canal: 'local' });
      });
      await waitFor(() => expect(cua.pendents.length).toBe(2));
      expect(scrollIntoView).not.toHaveBeenCalled();

      const botoTanca = screen.getByRole('button', { name: /Tancar el reproductor de veu/i });
      botoTanca.focus();
      fireEvent.click(botoTanca);
      await waitFor(() => {
        expect(screen.queryByRole('complementary', { name: /Reproductor de lectura en veu alta/i })).toBeNull();
      });
      await waitFor(() => expect(document.activeElement).toBe(botoTria));
      expect(focusDalt).not.toHaveBeenCalled();
    } finally {
      if (teniaScroll) Element.prototype.scrollIntoView = scrollAbans;
      else delete Element.prototype.scrollIntoView;
    }
  });

  test('obert des del botó de dalt, la lectura seguix el bloc i en tancar el focus hi torna sense desplaçar la pàgina', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    const scrollIntoView = vi.fn();
    const teniaScroll = Object.prototype.hasOwnProperty.call(Element.prototype, 'scrollIntoView');
    const scrollAbans = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      render(<PaginaLecturaMostra />);
      const botoEscolta = await screen.findByRole('button', { name: /Escolta la IAIA/i });
      fireEvent.click(botoEscolta);
      await waitFor(() => expect(cua.pendents.length).toBe(1));
      scrollIntoView.mockClear();
      await act(async () => {
        cua.pendents[0].resolve({ canal: 'local' });
      });
      await waitFor(() => expect(cua.pendents.length).toBe(2));
      expect(scrollIntoView).toHaveBeenCalled();

      const focusDalt = vi.spyOn(botoEscolta, 'focus');
      const botoTanca = screen.getByRole('button', { name: /Tancar el reproductor de veu/i });
      botoTanca.focus();
      fireEvent.click(botoTanca);
      await waitFor(() => expect(focusDalt).toHaveBeenCalledWith({ preventScroll: true }));
      expect(document.activeElement).toBe(botoEscolta);
    } finally {
      if (teniaScroll) Element.prototype.scrollIntoView = scrollAbans;
      else delete Element.prototype.scrollIntoView;
    }
  });

  test('font d’àudio · canviar d’idioma no torna a la pista 1 ni força el Play; canviar les pistes sí que reinicia', async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const fontA = {
      tipus: 'audio',
      titolEmissio: 'Ràdio de Poble · Prova d’idioma',
      pistes: [
        { id: 'a1', titol: 'Pista Arnau', src: '/assets/audio/veus_node0/mostra_08_arnau_valencia.wav' },
        { id: 'a2', titol: 'Pista Gina', src: '/assets/audio/veus_node0/mostra_07_gina_valencia.wav' },
      ],
    };
    try {
      const { rerender } = render(<MuntatgeRadio idioma="ca" fontSo={fontA} />);
      await screen.findByRole('complementary', { name: /Ràdio de Poble · Prova d’idioma/i });
      expect(screen.getByText('Pista 1 de 2')).toBeTruthy();
      await waitFor(() => expect(playSpy).toHaveBeenCalled());

      /* Onada R29 · R29-02-05 · En mode àudio els controls parlen de pistes (contracte canviat a propòsit). */
      fireEvent.click(screen.getByRole('button', { name: /Pista següent/i }));
      await waitFor(() => expect(screen.getByText('Pista 2 de 2')).toBeTruthy());
      fireEvent.click(screen.getByRole('button', { name: /Pausa l’àudio/i }));
      expect(screen.getByRole('button', { name: /Escolta l’àudio/i })).toBeTruthy();

      playSpy.mockClear();
      rerender(<MuntatgeRadio idioma="es" fontSo={fontA} />);
      await act(async () => {});
      expect(screen.getByText('Pista 2 de 2')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Escolta l’àudio/i })).toBeTruthy();
      expect(playSpy).not.toHaveBeenCalled();

      /* Onada R28 · Un objecte nou amb el mateix contingut (el literal que un pare crea a cada render)
         no torna a la pista 1 ni força el Play. */
      rerender(<MuntatgeRadio idioma="es" fontSo={{ ...fontA, pistes: fontA.pistes.map((p) => ({ ...p })) }} />);
      await act(async () => {});
      expect(screen.getByText('Pista 2 de 2')).toBeTruthy();
      expect(playSpy).not.toHaveBeenCalled();

      const fontB = {
        ...fontA,
        pistes: [
          { id: 'b1', titol: 'Pista Lluc', src: '/assets/audio/veus_node0/mostra_06_lluc_valencia.wav' },
          { id: 'b2', titol: 'Pista Berta', src: '/assets/audio/veus_node0/mostra_09_berta_valencia.wav' },
          { id: 'b3', titol: 'Pista Emma', src: '/assets/audio/veus_node0/mostra_05_emma_occidental.wav' },
        ],
      };
      rerender(<MuntatgeRadio idioma="es" fontSo={fontB} />);
      await waitFor(() => expect(screen.getByText('Pista 1 de 3')).toBeTruthy());
      expect(screen.getByText('Pista Lluc')).toBeTruthy();
      await waitFor(() => expect(playSpy).toHaveBeenCalled());
    } finally {
      playSpy.mockRestore();
      pauseSpy.mockRestore();
    }
  });
});

/* ── Onada R28 · Revisió adversarial del grup «veu» (veu-editorial-03, 04, 05, 06 i 10) ───────── */

/* Llig el context de la veu que PageFrame dona als fills, com ho faria una peça de l'article. */
function SondaContextVeu() {
  const ctx = useVeuLecturaPaginaActiva();
  return (
    <div data-sdp-no-locutar="">
      <span data-testid="sonda-veu">{`${Boolean(ctx?.reproductorObert)}|${Boolean(ctx?.parlant)}`}</span>
    </div>
  );
}

describe('Onada R28 · revisió adversarial del Reproductor Universal de So', () => {
  test('veu-editorial-03 · una locució aliena que avorta la de la barra la deixa en pausa al mateix bloc, no en «parlant» muda', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    render(<PaginaLecturaMostra />);
    const botoEscolta = await screen.findByRole('button', { name: /Escolta la IAIA/i });
    fireEvent.click(botoEscolta);
    await waitFor(() => expect(cua.pendents.length).toBe(1));
    await waitFor(() => expect(botoEscolta.className).toContain('sdp-boto--primari'));

    /* El que fa veuIaiaService.atura() quan una altra peça (el Refranyer, el joc o el menú Traduir)
       comença a parlar: rebutja la promesa en curs amb VEU_AVORTADA sense tocar el senyal de la barra. */
    expect(cua.pendents[0].opcions.signal.aborted).toBe(false);
    await act(async () => {
      const err = new Error('Locució aturada.');
      err.codi = serveiVeu.CODI_VEU_AVORTADA;
      cua.pendents[0].reject(err);
    });

    await waitFor(() => expect(screen.getByRole('button', { name: /Continua la lectura/i })).toBeTruthy());
    expect(screen.queryByRole('button', { name: /Pausa la lectura/i })).toBeNull();
    expect(screen.getByText('Bloc 1 de 7')).toBeTruthy();
    expect(botoEscolta.className).toContain('sdp-boto--secundari');
    expect(cua.pendents).toHaveLength(1);

    /* Continua reprén el mateix bloc, com després d'una pausa pròpia. */
    fireEvent.click(screen.getByRole('button', { name: /Continua la lectura/i }));
    await waitFor(() => expect(cua.pendents.length).toBe(2));
    expect(cua.pendents[1].text).toBe('Node 0 · El cervell i la veu al poble');
  });

  test('veu-editorial-05 · tancar amb el botó de dalt no deixa cap «parlant» caducat ni al botó ni al context', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    render(<PaginaLecturaMostra fills={<SondaContextVeu />} />);
    const botoEscolta = await screen.findByRole('button', { name: /Escolta la IAIA/i });
    const sonda = screen.getByTestId('sonda-veu');
    expect(sonda.textContent).toBe('false|false');

    fireEvent.click(botoEscolta);
    await screen.findByRole('complementary', { name: /Reproductor de lectura en veu alta/i });
    await waitFor(() => expect(cua.pendents.length).toBe(1));
    await waitFor(() => expect(sonda.textContent).toBe('true|true'));
    expect(botoEscolta.className).toContain('sdp-boto--primari');
    expect(botoEscolta.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(botoEscolta);
    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: /Reproductor de lectura en veu alta/i })).toBeNull();
    });
    expect(botoEscolta.getAttribute('aria-pressed')).toBe('false');
    expect(botoEscolta.className).toContain('sdp-boto--secundari');
    expect(botoEscolta.className).not.toContain('sdp-boto--primari');
    expect(sonda.textContent).toBe('false|false');
    expect(serveiVeu.atura).toHaveBeenCalled();
  });

  test('veu-editorial-04 · PageFrame marca el seu contenidor per a la reserva d’alçada només mentre la barra és oberta', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    const { container } = render(<PaginaLecturaMostra />);
    const pagina = container.querySelector('.sdp-universal-page-container');
    expect(pagina.hasAttribute('data-sdp-veu-reserva')).toBe(false);

    fireEvent.click(await screen.findByRole('button', { name: /Escolta la IAIA/i }));
    await screen.findByRole('complementary', { name: /Reproductor de lectura en veu alta/i });
    expect(pagina.getAttribute('data-sdp-veu-reserva')).toBe('true');
    expect(container.querySelector('.sdp-root').getAttribute('data-sdp-veu-oberta')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /Tancar el reproductor de veu/i }));
    await waitFor(() => expect(pagina.hasAttribute('data-sdp-veu-reserva')).toBe(false));
  });

  test('veu-editorial-06 · triar un apartat al panell torna el focus al botó «Apartats i cerca al text», no al body', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    render(<PaginaLecturaMostra />);
    fireEvent.click(await screen.findByRole('button', { name: /Escolta la IAIA/i }));
    await waitFor(() => expect(cua.pendents.length).toBe(1));

    const botoApartats = screen.getByRole('button', { name: /Apartats i cerca al text/i });
    fireEvent.click(botoApartats);
    const item = screen.getByRole('button', { name: /Segon apartat/i });
    item.focus();
    expect(document.activeElement).toBe(item);
    fireEvent.click(item);

    await waitFor(() => expect(screen.getByText('Bloc 6 de 7')).toBeTruthy());
    expect(item.isConnected).toBe(false);
    expect(document.activeElement).toBe(botoApartats);
    expect(botoApartats.getAttribute('aria-expanded')).toBe('false');
  });

  test('veu-editorial-10 · aria-controls només apunta a un panell que existix i Escape el tanca i torna el focus al seu botó', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    render(<PaginaLecturaMostra />);
    fireEvent.click(await screen.findByRole('button', { name: /Escolta la IAIA/i }));
    await waitFor(() => expect(cua.pendents.length).toBe(1));

    const botoApartats = screen.getByRole('button', { name: /Apartats i cerca al text/i });
    expect(botoApartats.getAttribute('aria-expanded')).toBe('false');
    expect(botoApartats.hasAttribute('aria-controls')).toBe(false);

    fireEvent.click(botoApartats);
    const idPanell = botoApartats.getAttribute('aria-controls');
    expect(idPanell).toBeTruthy();
    expect(document.getElementById(idPanell)).not.toBeNull();

    const cerca = screen.getByPlaceholderText(/Cerca una paraula o apartat/i);
    cerca.focus();
    fireEvent.keyDown(cerca, { key: 'Escape' });
    expect(document.getElementById(idPanell)).toBeNull();
    expect(botoApartats.getAttribute('aria-expanded')).toBe('false');
    expect(botoApartats.hasAttribute('aria-controls')).toBe(false);
    expect(document.activeElement).toBe(botoApartats);

    /* Amb el panell tancat, Escape no tanca la barra ni para la lectura. */
    const crides = serveiVeu.atura.mock.calls.length;
    fireEvent.keyDown(botoApartats, { key: 'Escape' });
    expect(screen.getByRole('complementary', { name: /Reproductor de lectura en veu alta/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Pausa la lectura/i })).toBeTruthy();
    expect(serveiVeu.atura.mock.calls.length).toBe(crides);
  });

  /* Onada R29 · R29-02-05 (kit Gemini lot_02, adaptat) · Les cinc llengües, no només la reserva en valencià.
     La barra marca data-sdp-veu-oberta però no escriu data-sdp-barres: l'únic que l'escriu és
     useBarresAmbScroll, que passa de «totes» a «dalt» quan veu la marca (useBarresAmbScroll.test.jsx).
     Dos escriptors desquadrarien la memòria «escrit» del hook. */
  test('Onada R29 · en mode àudio usa les claus dedicades *Audio en les cinc llengües i no escriu data-sdp-barres', async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const font = {
      tipus: 'audio',
      titolEmissio: 'Ràdio R29',
      pistes: [
        { id: 'r1', titol: 'Pista 1', text: 'Descripció pista 1', src: '/assets/audio/veus_node0/mostra_08_arnau_valencia.wav' },
        { id: 'r2', titol: 'Pista 2', text: 'Descripció pista 2', src: '/assets/audio/veus_node0/mostra_07_gina_valencia.wav' },
      ],
    };
    try {
      for (const { code } of SUPPORTED_LANGUAGES) {
        const tr = createTranslator(code);
        function MuntatgeIdioma() {
          const cosRef = useRef(null);
          return (
            <UIActionsContext.Provider value={{ t: tr }}>
              <div className="sdp-root is-compact" data-sdp-barres="totes" data-testid={`arrel-${code}`}>
                <article ref={cosRef}><p>Prova</p></article>
                <BarraReproductorVeu oberta cosRef={cosRef} idioma={code} fontSo={font} />
              </div>
            </UIActionsContext.Provider>
          );
        }
        render(<MuntatgeIdioma />);
        const arrel = screen.getByTestId(`arrel-${code}`);
        expect(arrel.getAttribute('data-sdp-veu-oberta')).toBe('true');
        expect(arrel.getAttribute('data-sdp-barres')).toBe('totes');

        expect(screen.getByRole('button', { name: tr('veu.reproductor.anteriorAudio') })).toBeTruthy();
        expect(screen.getByRole('button', { name: tr('veu.reproductor.seguentAudio') })).toBeTruthy();
        expect(screen.getByRole('button', { name: tr('veu.reproductor.pausaAudio') })).toBeTruthy();
        expect(screen.getByRole('button', { name: tr('veu.reproductor.copiaAudio') })).toBeTruthy();
        expect(screen.getByRole('button', { name: tr('veu.reproductor.tancaAudio') })).toBeTruthy();

        const botoPistes = screen.getByRole('button', { name: tr('veu.reproductor.apartatsAudio') });
        fireEvent.click(botoPistes);
        const campCerca = screen.getByPlaceholderText(tr('veu.reproductor.cercaPlaceholderAudio'));
        expect(screen.getByLabelText(tr('veu.reproductor.cercaEtiquetaAudio'))).toBe(campCerca);
        fireEvent.change(campCerca, { target: { value: 'cap-coincidencia-zzz' } });
        expect(screen.getByText(tr('veu.reproductor.senseResultatsAudio'))).toBeTruthy();
        cleanup();
      }
    } finally {
      playSpy.mockRestore();
      pauseSpy.mockRestore();
    }
  });
});

/* ── Onada R29 · propietat de la locució de la barra ───────────────────── */

const BLOCS_ESPECIMEN = Object.freeze([
  Object.freeze({ index: 0, id: 'r29-0', etiqueta: 'h1', esTitol: true, seccioTitol: 'Prova', resumCurt: 'Primer bloc', text: 'Primer bloc.', element: null }),
  Object.freeze({ index: 1, id: 'r29-1', etiqueta: 'p', esTitol: false, seccioTitol: 'Prova', resumCurt: 'Segon bloc', text: 'Segon bloc.', element: null }),
]);

const avortadaPerUnaAltraPeca = () => Object.assign(new Error('Locució aturada.'), { codi: serveiVeu.CODI_VEU_AVORTADA });

describe('Onada R29 · la barra només calla la veu que és seua', () => {
  test('R29-CV-05 · tancar la barra pausada per una altra peça no talla la veu d’eixa peça', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    render(<PaginaLecturaMostra />);
    fireEvent.click(await screen.findByRole('button', { name: /Escolta la IAIA/i }));
    await waitFor(() => expect(cua.pendents.length).toBe(1));

    /* Una altra peça (el Refranyer) comença a parlar: el servei rebutja la locució de la barra. */
    await act(async () => { cua.pendents[0].reject(avortadaPerUnaAltraPeca()); });
    await waitFor(() => expect(screen.getByRole('button', { name: /Continua la lectura/i })).toBeTruthy());

    const crides = serveiVeu.atura.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /Tancar el reproductor de veu/i }));
    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: /Reproductor de lectura en veu alta/i })).toBeNull();
    });
    expect(serveiVeu.atura.mock.calls.length).toBe(crides);
  });

  test('R29-CV-05 · tancar la barra mentre llig continua aturant la seua veu', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    render(<PaginaLecturaMostra />);
    fireEvent.click(await screen.findByRole('button', { name: /Escolta la IAIA/i }));
    await waitFor(() => expect(cua.pendents.length).toBe(1));

    const crides = serveiVeu.atura.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /Tancar el reproductor de veu/i }));
    expect(serveiVeu.atura.mock.calls.length).toBeGreaterThan(crides);
    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: /Reproductor de lectura en veu alta/i })).toBeNull();
    });
  });

  test('R29-CV-04 · l’espècimen de /disseny que llig calla la seua veu en desmuntar-se', async () => {
    const cua = creaPausaControlada();
    serveiVeu.parla.mockImplementation(cua.impl);
    const { unmount } = render(<BarraReproductorVeu oberta mostraEspecimen blocsMostra={BLOCS_ESPECIMEN} />);
    fireEvent.click(screen.getByRole('button', { name: /Continua la lectura/i }));
    await waitFor(() => expect(cua.pendents.length).toBe(1));
    const crides = serveiVeu.atura.mock.calls.length;
    unmount();
    expect(serveiVeu.atura.mock.calls.length).toBeGreaterThan(crides);
  });

  test('R29-CV-04 · l’espècimen que no llig no calla cap altra veu en desmuntar-se', () => {
    const { unmount } = render(<BarraReproductorVeu oberta mostraEspecimen blocsMostra={BLOCS_ESPECIMEN} />);
    unmount();
    expect(serveiVeu.atura).not.toHaveBeenCalled();
  });
});
