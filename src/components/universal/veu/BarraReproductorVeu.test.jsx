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
import { createRoot } from 'react-dom/client';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RouterProvider } from '../../../app/contexts/RouterContext.jsx';
import { PageFrame } from '../PageFrame.jsx';
import { CLASSE_BLOC_VEU_ACTIU, extreuBlocsLecturaVeu } from './lectorPaginaVeu.js';
import { LA_VEU_DE_SOC_DE_POBLE_POST, LA_VEU_DE_SOC_DE_POBLE_RUTA } from '../../../sections/mur/articles/laVeuDeSocDePobleContent.js';
import { LaVeuDeSocDePobleArticle } from '../../../sections/mur/articles/LaVeuDeSocDePobleArticle.jsx';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST, NOVES_TECNOLOGIES_CULTURA_RURAL_RUTA } from '../../../sections/mur/articles/novesTecnologiesCulturaRuralContent.js';
import NovesTecnologiesCulturaRuralArticle from '../../../sections/mur/articles/NovesTecnologiesCulturaRuralArticle.jsx';
import * as serveiVeu from '../../../services/veuIaiaService.js';

vi.mock('../../../services/veuIaiaService.js', async () => {
  const real = await vi.importActual('../../../services/veuIaiaService.js');
  return {
    ...real,
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

function PaginaLecturaMostra({ onCanviaCopyright }) {
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
});
