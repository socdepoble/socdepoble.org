import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { RouterProvider } from '../../app/contexts/RouterContext.jsx';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import FitxaArbreMonumental from './FitxaArbreMonumental.jsx';
import FitxaDadesDoctoralsArbre from './FitxaDadesDoctoralsArbre.jsx';
import RutesDePobleSection from './RutesDePobleSection.jsx';
import { buildMurDetailSectionMeta, buildVerticalDetailSectionMeta } from '../detail/detailSectionMeta.jsx';
import { QuadreAssistenciaEsdeveniment } from '../detail/QuadreAssistenciaEsdeveniment.jsx';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function ArbreAmbContext({ children }) {
  return (
    <RouterProvider initialPath="/page/arbres-monumentals">
      <UIProvider>{children}</UIProvider>
    </RouterProvider>
  );
}

describe('R32.55 · U-DIS-01 · Noblesa Pedra Seca a Fitxes de Patrimoni i Verticals', () => {
  it('FitxaArbreMonumental i FitxaDadesDoctoralsArbre substitueixen tots els <dl> nus per .sdp-taula-prosa amb <th scope="row">', () => {
    const arbre = ARBRES_MONUMENTALS_2020[0];
    const { container } = render(
      <ArbreAmbContext>
        <FitxaArbreMonumental arbre={arbre} />
      </ArbreAmbContext>
    );

    expect(container.querySelector('dl')).toBeNull();
    expect(container.querySelectorAll('.sdp-taula-prosa table th[scope="row"]').length).toBeGreaterThanOrEqual(4);
    expect(container.querySelector('.sdp-arbre-fitxa__pindoles')).not.toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: /Fitxa Oficial CIEF/i }));
    expect(container.querySelector('dl')).toBeNull();
    expect(container.querySelectorAll('.sdp-taula-prosa table th[scope="row"]').length).toBe(24);

    fireEvent.click(screen.getByRole('tab', { name: /Ordenança Municipal/i }));
    expect(container.querySelector('dl')).toBeNull();
    expect(container.querySelector('.sdp-arbre-ordenanca')).not.toBeNull();

    cleanup();
    const doc = render(
      <ArbreAmbContext>
        <FitxaDadesDoctoralsArbre arbre={arbre} />
      </ArbreAmbContext>
    );
    expect(doc.container.querySelector('dl')).toBeNull();
    expect(doc.container.querySelectorAll('.sdp-taula-prosa table th[scope="row"]').length).toBeGreaterThanOrEqual(8);
  });

  it('RutesDePobleSection estructura cada itinerari en targeta Pedra Seca amb píndoles i preserva l’ordre de germans', () => {
    const { container } = render(
      <ArbreAmbContext>
        <RutesDePobleSection />
      </ArbreAmbContext>
    );

    const rutes = container.querySelectorAll('article.sdp-rutes-poble__ruta');
    expect(rutes.length).toBeGreaterThanOrEqual(2);
    expect(rutes[0].querySelectorAll('.sdp-rutes-poble__pindola').length).toBe(3);
    expect(container.textContent).toContain('Durada: 4 h · Distància: 1,3 km · Pàgina 4 del PDF');
    const vigencia = container.querySelector('p.sdp-rutes-poble__vigencia');
    expect(vigencia?.nextElementSibling?.tagName).toBe('ARTICLE');
  });

  it('detailSectionMeta aplica .sdp-fitxa-vertical a la fitxa de lectura i .sdp-taula-prosa a l’article importat', () => {
    const t = (_k, fb) => fb;
    const viatge = {
      id: 'v1',
      type: 'vehicle',
      title: 'Viatge a Alcoi',
      ambit: 'vehicle',
      estat: 'disponible',
      created_at: '2026-11-02T10:00:00.000Z',
      content: '<p>Isc a les huit.</p>',
      dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', places: 3 },
    };
    const metaVertical = buildVerticalDetailSectionMeta('vehicle', { feedPosts: [viatge], t });
    const vistaVertical = render(<ArbreAmbContext>{metaVertical.renderBody(viatge)}</ArbreAmbContext>);
    expect(vistaVertical.container.querySelector('dl.sdp-fitxa-vertical')).not.toBeNull();
    cleanup();

    const importat = {
      id: 'imp-1',
      type: 'feed',
      title: 'Crònica importada',
      slug: 'cronica-importada',
      esImportatWp: true,
      created_at: '2026-11-02T10:00:00.000Z',
      content: '<p>Cos íntegre de la crònica.</p>',
    };
    const metaMur = buildMurDetailSectionMeta({ feedPosts: [importat], t });
    const vistaImportada = render(<ArbreAmbContext>{metaMur.renderBody(importat)}</ArbreAmbContext>);
    expect(vistaImportada.container.querySelector('dl')).toBeNull();
    expect(vistaImportada.container.querySelector('.sdp-taula-prosa table th[scope="row"]')).not.toBeNull();
  });

  it('QuadreAssistenciaEsdeveniment deduplica el títol quan amagaTitol és actiu dins de UniversalPage i manté h3 standalone', () => {
    const acte = {
      id: 'acte-1',
      title: 'Aplec de Pedra en Sec',
      date: '2027-06-15',
      location: 'Plaça Major',
    };
    const standalone = render(
      <ArbreAmbContext>
        <QuadreAssistenciaEsdeveniment item={acte} />
      </ArbreAmbContext>
    );
    expect(standalone.container.querySelector('h3.sdp-quadre-esdeveniment__titol')?.textContent).toBe('Aplec de Pedra en Sec');
    expect(standalone.container.querySelector('.sdp-quadre-esdeveniment__pindoles')).not.toBeNull();
    cleanup();

    const integrat = render(
      <ArbreAmbContext>
        <QuadreAssistenciaEsdeveniment item={acte} amagaTitol />
      </ArbreAmbContext>
    );
    expect(integrat.container.querySelector('.sdp-quadre-esdeveniment__titol')).toBeNull();
  });
});
