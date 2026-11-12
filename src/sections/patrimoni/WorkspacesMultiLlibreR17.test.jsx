import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';
import NaturaPatrimoniWorkspaceSection from './NaturaPatrimoniWorkspaceSection.jsx';
import BancLlavorsWorkspaceSection from './BancLlavorsWorkspaceSection.jsx';
import CalendariAgricolaLlavorsView from './CalendariAgricolaLlavorsView.jsx';
import HerbariWorkspaceSection from './HerbariWorkspaceSection.jsx';
import RutesDePobleSection from './RutesDePobleSection.jsx';
import { LLIBRES_ARBRES_MONUMENTALS } from '../../data/patrimoni/llibresArbresMonumentals.js';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import { FONT_ARBRES_MONUMENTALS } from '../../data/patrimoni/arbresMonumentals.js';
import * as importacio from '../../data/importacio/paginesTrilogiaIMoliEditorial.js';

const ui = vi.hoisted(() => ({ language: 'ca', t: (_clau, reserva) => reserva }));
vi.mock('../../app/contexts/UIContext', async (orig) => ({
  ...(await orig()),
  useUIActions: () => ui,
  useUIActionsOpcional: () => ui
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => (
    <article>
      {title ? <header className="page-title"><h1>{title}</h1></header> : null}
      {children}
    </article>
  )
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AH-R17-13 / AH-R17-15 / P0-95 · Workspaces Multi-Llibre Lazy', () => {
  it('R18 · la llibreria obri la portada original WP #619, els 19 arbres i la fitxa documental del Pi dels Arrendaors', async () => {
    const carregaPortada = vi.spyOn(importacio, 'carregaPortadaImportadaPublica');
    const { container } = render(
      <MemoryRouter rutaInicial="/page/arbres-monumentals">
        <NaturaPatrimoniWorkspaceSection page={{ title: 'Arbres emblemàtics i monumentals', html: '<p>Intro</p>' }} />
      </MemoryRouter>
    );

    const llista = container.querySelector('#app-grid-list');
    expect(within(llista).queryAllByRole('heading', { level: 3 })).toHaveLength(0);
    expect(screen.getByText('Intro')).toBeTruthy();
    expect(carregaPortada).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${LLIBRES_ARBRES_MONUMENTALS[0].etiquetaNavegacio}`) }));
    const detall = container.querySelector('#app-grid-main');
    expect(await within(detall).findByRole('heading', { level: 1, name: FONT_ARBRES_MONUMENTALS.titol })).toBeTruthy();
    expect(carregaPortada).toHaveBeenCalledWith(619, { signal: expect.any(AbortSignal) });
    const capcaleres = [...llista.querySelectorAll('.sdp-gestor-fitxa')];
    expect(capcaleres).toHaveLength(19);
    expect(capcaleres[0].querySelector('.sdp-gestor-fitxa__titol').textContent).toBe(`#1 · ${ARBRES_MONUMENTALS_2020[0].nom}`);
    expect(ARBRES_MONUMENTALS_2020).toHaveLength(19);
    for (const arbre of ARBRES_MONUMENTALS_2020) {
      expect(within(llista).getByRole('button', { name: `#${arbre.ordre} · ${arbre.nom}` })).toBeTruthy();
    }
    expect(within(detall).getByText(/WP #619/)).toBeTruthy();
    expect(detall.querySelector(`a[href="${FONT_ARBRES_MONUMENTALS.enllac}"]`)).toBeTruthy();
    expect(detall.textContent).toContain('El Rentonar');
    expect(detall.textContent).toContain('Pedro Ferrer');

    // Obrim l'arbre #15 (Pi dels Arrendaors, Monumental Llei 4/2006)
    fireEvent.click(within(llista).getByRole('button', { name: '#15 · Pi dels Arrendaors' }));
    expect(await within(detall).findByRole('heading', { level: 1, name: /#15 · Pi dels Arrendaors/i })).toBeTruthy();
    expect(within(detall).getByText(/Esmena cartogràfica verificada/i)).toBeTruthy();
    expect(within(detall).getByText(/Pedro Ferrer Rodríguez · Associació El Rentonar/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Torna a la portada del llibre' }));
    await within(detall).findByText(/WP #619/);
    fireEvent.click(screen.getByRole('button', { name: /^Tots els arbres/ }));
    expect(screen.getByText('Intro')).toBeTruthy();
    expect(within(llista).queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });

  it.each([
    ['Herbari', '/page/herbari'],
    ['Rutes i camins', '/page/rutes-de-poble']
  ])('R18 · l’enllaç germà %s obri el seu catàleg canònic', async (nom, ruta) => {
    const { container } = render(<MemoryRouter rutaInicial="/page/arbres-monumentals">
      <Routes>
        <Route path="/page/arbres-monumentals" element={<NaturaPatrimoniWorkspaceSection />} />
        <Route path="/page/herbari" element={<HerbariWorkspaceSection />} />
        <Route path="/page/rutes-de-poble" element={<RutesDePobleSection />} />
      </Routes>
    </MemoryRouter>);
    const enllac = screen.getByRole('link', { name: nom });
    expect(enllac.getAttribute('href')).toBe(ruta);
    fireEvent.click(enllac);

    if (nom === 'Herbari') {
      await screen.findByRole('button', { name: 'Acacia robínia', exact: true });
      expect(container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')).toHaveLength(117);
    } else {
      const rutes = await screen.findByRole('region', { name: /Els itineraris de La Torre de les Maçanes/i });
      expect(within(rutes).getAllByRole('heading', { level: 4, name: /^Ruta \d+ ·/ })).toHaveLength(6);
    }
  });

  it('CalendariAgricolaLlavorsView filtra tomaques, fases i mesos exclusivament sobre dades reals del Catàleg valencià', () => {
    const onObrirVarietat = vi.fn();
    render(<CalendariAgricolaLlavorsView onObrirVarietat={onObrirVarietat} />);

    expect(screen.getByRole('heading', { level: 3, name: /Calendari agrícola de cultius i tomaques tradicionals/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tomaques tradicionals/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Desembre' }));
    fireEvent.click(screen.getByRole('button', { name: /Sembra \/ Sembra directa/i }));

    const fitxaQuarantena = screen.getByRole('article', { name: 'Tomaca quarantena' });
    expect(fitxaQuarantena).toBeTruthy();
    fireEvent.click(within(fitxaQuarantena).getByRole('button', { name: 'Obrir fitxa de varietat' }));
    expect(onObrirVarietat).toHaveBeenCalledTimes(1);
  });

  it('Workspace 2 (Biblioteca Agrícola i Banc de Llavors) articula Llavors (125), Calendari Agrícola i Pou de la Neu 3D', async () => {
    const { container } = render(
      <MemoryRouter rutaInicial="/page/banc-de-llavors">
        <BancLlavorsWorkspaceSection page={{ title: 'Banc de llavors', html: '<p>Cos banc</p>' }} />
      </MemoryRouter>
    );

    expect(container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')).toHaveLength(125);

    // Passem al Llibre 2: Calendari Agrícola i obrim una varietat cap al Llibre 1
    fireEvent.click(screen.getByRole('tab', { name: /Calendari Agrícola i Tomaques/i }));
    const titolCalendari = await screen.findByRole('heading', { level: 3, name: /Calendari agrícola de cultius i tomaques tradicionals/i });
    expect(titolCalendari).toBeTruthy();

    const primerBotoObrir = screen.getAllByRole('button', { name: 'Obrir fitxa de varietat' })[0];
    await act(async () => {
      fireEvent.click(primerBotoObrir);
    });
    expect(container.querySelector('.sdp-fitxa-didactica__titol')).toBeTruthy();

    // Passem al Llibre 3: Anatomia Rural · Pou de la Neu 3D
    fireEvent.click(screen.getByRole('tab', { name: /Anatomia Rural · Pou de la Neu 3D/i }));
    // El chunk 3D real pot arribar en fred alhora que les altres suites.
    expect(await screen.findByRole('heading', { level: 3, name: /Pou de neu del Rentonar · Anatomia 3D/i }, { timeout: 5000 })).toBeTruthy();
  });
});
