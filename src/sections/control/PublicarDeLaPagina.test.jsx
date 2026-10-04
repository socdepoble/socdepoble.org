/**
 * P6 · Onada 4, sisena passada (directriu 261003_2325 del Mestre,
 * confirmació 4) · Les sis UniversalPage de la doble acció (/page/<clau>):
 * cap etiqueta, i al final del text el gran botó blau «Publicar», amb el
 * mateix destí que la porta Publicar de la seua targeta (destinsControl.js).
 * El Mur porta al Bloc (/notes) amb el router de l'app; les altres cinc són
 * inertes: aria-disabled, «(en obres)» al nom i el toast, sense navegar.
 *
 * Es munta PageDetailSection de veres, dins del router en memòria i amb
 * TextSection de veres; la UniversalPage es reduïx a les seues props i als
 * fills, com a TextSection.test.jsx.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { createTranslator } from '../../config/i18n';

const estat = vi.hoisted(() => ({ toast: vi.fn(), traductor: null, props: null, pageCopy: {} }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: estat.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (clau, reserva) => (estat.traductor ? estat.traductor(clau, reserva) : reserva) })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: estat.pageCopy })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => {
    estat.props = props;
    return React.createElement('div', { 'data-pagina': '' }, children);
  }
}));

import PageDetailSection from '../detail/PageDetailSection.jsx';
import { PublicarDeLaPagina } from './PublicarDeLaPagina.jsx';
import { DESTINS_CONTROL, portesDe } from './destinsControl.js';

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const visita = (clau, { basename = '' } = {}) => render(
  <MemoryRouter rutaInicial={`/page/${clau}`} basename={basename}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
    </Routes>
    <Ubicacio />
  </MemoryRouter>
);
const reserva = (_, text) => text;
const pagina = () => document.querySelector('[data-pagina]');
const boto = () => pagina().querySelector('.sdp-pagina-accio > .sdp-boto');
const CLASSE = 'sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple';

beforeEach(() => {
  estat.toast.mockReset();
  estat.traductor = null;
  estat.props = null;
  estat.pageCopy = {};
});
afterEach(cleanup);

describe('P6 · les sis pàgines de la doble acció', () => {
  test('cap etiqueta, i el gran botó blau Publicar és l’últim, just després del text', () => {
    for (const desti of DESTINS_CONTROL) {
      visita(desti.pagina);
      expect([desti.pagina, estat.props.labels]).toEqual([desti.pagina, []]);
      const fills = [...pagina().children];
      expect(fills.map((fill) => fill.className), desti.pagina).toEqual(['cms-preview', 'sdp-pagina-accio']);
      expect(pagina().querySelectorAll('.sdp-boto')).toHaveLength(1);
      expect([desti.pagina, boto().className]).toEqual([desti.pagina, CLASSE]);
      cleanup();
    }
  });

  test('el destí és el de la porta Publicar de la targeta: una sola font', () => {
    for (const desti of DESTINS_CONTROL) {
      const [publicar] = portesDe(desti, reserva);
      visita(desti.pagina);
      if (publicar.desti) {
        expect([desti.id, boto().tagName, boto().getAttribute('href')]).toEqual([desti.id, 'A', publicar.desti]);
      } else {
        expect([desti.id, boto().tagName, boto().getAttribute('aria-disabled')]).toEqual([desti.id, 'BUTTON', 'true']);
      }
      cleanup();
    }
    expect(DESTINS_CONTROL.filter((desti) => portesDe(desti, reserva)[0].desti).map((desti) => desti.id)).toEqual(['mur']);
  });

  test('Mur: «Publicar al Mur» obri el Bloc (/notes) amb el router, també amb la base de l’amfitrió', () => {
    for (const basename of ['', '/comunitat']) {
      visita('publicar_mur', { basename });
      const enllac = screen.getByRole('link', { name: 'Publicar al Mur' });
      expect(enllac.getAttribute('href')).toBe(`${basename}/notes`);
      expect(fireEvent.click(enllac)).toBe(false);
      expect(ubicacio(), basename).toBe('/notes');
      cleanup();
    }
  });

  test('les altres cinc: inert, «(en obres)» al nom, avisa amb el toast i no navega', () => {
    const inertes = [
      ['publicar_mercat', 'Publicar al Mercat'], ['publicar_calendari', 'Publicar al Calendari'],
      ['publicar_mapa', 'Publicar al Mapa'], ['vehicle_compartit', 'Publicar: Vehicle Compartit'], ['animalets', 'Publicar: Animalets']
    ];
    for (const [clau, nom] of inertes) {
      visita(clau);
      const inert = screen.getByRole('button', { name: `${nom} (en obres)` });
      expect([clau, inert.getAttribute('aria-disabled'), inert.matches(':disabled')]).toEqual([clau, 'true', false]);
      fireEvent.click(inert);
      expect(estat.toast).toHaveBeenLastCalledWith(`“${nom}” encara està en obres.`);
      expect(ubicacio(), clau).toBe(`/page/${clau}`);
      cleanup();
    }
  });

  test('en anglés, el botó es tradueix com la porta i porta al mateix lloc', () => {
    estat.traductor = createTranslator('en');
    visita('publicar_mur');
    fireEvent.click(screen.getByRole('link', { name: 'Publish on the Wall' }));
    expect(ubicacio()).toBe('/notes');
    cleanup();
    visita('vehicle_compartit');
    expect(screen.getByRole('button', { name: 'Publish: Shared Vehicle (under construction)' }).getAttribute('aria-disabled')).toBe('true');
  });
});

describe('P6 · les altres pàgines no canvien', () => {
  test('una pàgina que no és de cap targeta del Panell no porta cap botó', () => {
    estat.pageCopy = { guia: { title: 'Guia del poble', html: '<p>Text</p>' } };
    visita('guia');
    expect([...pagina().children].map((fill) => fill.className)).toEqual(['cms-preview']);
    expect(document.querySelector('.sdp-pagina-accio')).toBeNull();
  });

  test('PublicarDeLaPagina amb una clau que no és de cap destí no pinta res', () => {
    const { container } = render(
      <MemoryRouter>
        <PublicarDeLaPagina clau="guia" />
        <PublicarDeLaPagina clau="constructor" />
        <PublicarDeLaPagina />
      </MemoryRouter>
    );
    expect(container.childElementCount).toBe(0);
  });
});
