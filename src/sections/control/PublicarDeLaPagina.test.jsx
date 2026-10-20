/**
 * P6 · Onada 4, sisena passada (directriu 261003_2325 del Mestre,
 * confirmació 4) · Les sis UniversalPage de la doble acció (/page/<clau>):
 * cap etiqueta, i al final del text el gran botó blau «Publicar», amb el
 * mateix destí que la porta Publicar de la seua targeta (destinsControl.js).
 * El Mur porta al Bloc (/notes) amb el router de l'app; les altres cinc són
 * inertes: aria-disabled, «(en obres)» al nom i el toast, sense navegar.
 *
 * T8 (ordre del Mestre, 261004, prompt 261004_0515 §6, «el botonaco de
 * Publicar») · El mateix botó també dalt, davall de l'H1: PageDetailSection
 * el passa a TextSection com a `accioPrincipal` (la ranura de PageFrame) amb
 * lloc="dalt", i conserva el de baix. Derogat per l'ordre del Mestre del
 * 261004 (prompt 261004_0515): la pàgina ja no porta UN sol botó, en porta
 * dos, iguals (destí, nom i avís). Ara són huit pàgines (W4-08: Treball i
 * Habitatge), set d'elles inertes.
 *
 * Es munta PageDetailSection de veres, dins del router en memòria i amb
 * TextSection de veres; la UniversalPage es reduïx a les seues props, als
 * fills (div[data-pagina]) i, si n'hi ha, a l'acció principal, que es pinta
 * abans, com el bloc del títol de PageFrame (div[data-dalt]).
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
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
    return React.createElement(
      React.Fragment,
      null,
      props.accioPrincipal ? React.createElement('div', { 'data-dalt': '' }, props.accioPrincipal) : null,
      React.createElement('div', { 'data-pagina': '' }, children)
    );
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
const dalt = () => document.querySelector('[data-dalt]');
const boto = () => pagina().querySelector('.sdp-pagina-accio > .sdp-boto');
const botoDeDalt = () => dalt().querySelector('.sdp-boto');
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

  /* T8 · Amb el de dalt, el nom «Publicar al Mur» és de dos enllaços iguals. */
  test('Mur: «Publicar al Mur» obri el Bloc (/notes) amb el router, també amb la base de l’amfitrió', () => {
    for (const basename of ['', '/comunitat']) {
      visita('publicar_mur', { basename });
      const enllacos = screen.getAllByRole('link', { name: 'Publicar al Mur' });
      expect(enllacos).toHaveLength(2);
      for (const enllac of enllacos) expect(enllac.getAttribute('href'), basename).toBe(`${basename}/notes`);
      expect(fireEvent.click(enllacos[1])).toBe(false);
      expect(ubicacio(), basename).toBe('/notes');
      cleanup();
    }
  });

  /* W4-08 · Treball i Habitatge també són inertes. T8 · Els dos botons de cada
     pàgina diuen el mateix i avisen igual. */
  test('les altres set: inerts, «(en obres)» al nom, avisen amb el toast i no naveguen, dalt i baix', () => {
    const inertes = [
      ['publicar_mercat', 'Publicar al Mercat'], ['publicar_calendari', 'Publicar al Calendari'],
      ['publicar_mapa', 'Publicar al Mapa'], ['vehicle_compartit', 'Publicar: Vehicle Compartit'], ['animalets', 'Publicar: Animalets'],
      ['treball', 'Publicar: Treball'], ['habitatge', 'Publicar: Habitatge']
    ];
    for (const [clau, nom] of inertes) {
      visita(clau);
      const inerts = screen.getAllByRole('button', { name: `${nom} (en obres)` });
      expect([clau, inerts.length]).toEqual([clau, 2]);
      for (const inert of inerts) {
        expect([clau, inert.getAttribute('aria-disabled'), inert.matches(':disabled')]).toEqual([clau, 'true', false]);
        estat.toast.mockClear();
        fireEvent.click(inert);
        expect(estat.toast).toHaveBeenLastCalledWith(`“${nom}” encara està en obres.`);
        expect(ubicacio(), clau).toBe(`/page/${clau}`);
      }
      cleanup();
    }
  });

  test('en anglés, els dos botons es tradueixen com la porta i porten al mateix lloc', () => {
    estat.traductor = createTranslator('en');
    visita('publicar_mur');
    const enllacos = screen.getAllByRole('link', { name: 'Publish on the Wall' });
    expect(enllacos).toHaveLength(2);
    fireEvent.click(enllacos[0]);
    expect(ubicacio()).toBe('/notes');
    cleanup();
    visita('vehicle_compartit');
    const inerts = screen.getAllByRole('button', { name: 'Publish: Shared Vehicle (under construction)' });
    expect(inerts.map((inert) => inert.getAttribute('aria-disabled'))).toEqual(['true', 'true']);
  });
});

/* ═══ T8 · El botonaco de dalt, davall de l'H1 (accioPrincipal) ═══ */
describe('T8 · el mateix botó, també davall de l’H1', () => {
  test('cada pàgina amb destí passa a la UniversalPage una accioPrincipal amb la porta sola (sense l’embolcall de baix)', () => {
    for (const desti of DESTINS_CONTROL) {
      visita(desti.pagina);
      expect([desti.pagina, Object.hasOwn(estat.props, 'accioPrincipal')]).toEqual([desti.pagina, true]);
      expect([desti.pagina, estat.props.accioPrincipal.props]).toEqual([desti.pagina, { clau: desti.pagina, lloc: 'dalt' }]);
      expect([...dalt().children].map((fill) => fill.className), desti.pagina).toEqual([CLASSE]);
      expect(dalt().querySelector('.sdp-pagina-accio'), desti.pagina).toBeNull();
      cleanup();
    }
  });

  test('dalt i baix són la mateixa porta: mateix element, mateix destí o mateix estat inert, mateix nom', () => {
    for (const desti of DESTINS_CONTROL) {
      visita(desti.pagina);
      const [deDalt, deBaix] = [botoDeDalt(), boto()];
      expect([desti.id, deDalt.tagName, deDalt.className]).toEqual([desti.id, deBaix.tagName, deBaix.className]);
      expect([desti.id, deDalt.getAttribute('href'), deDalt.getAttribute('aria-disabled')])
        .toEqual([desti.id, deBaix.getAttribute('href'), deBaix.getAttribute('aria-disabled')]);
      expect([desti.id, deDalt.textContent]).toEqual([desti.id, deBaix.textContent]);
      /* El de dalt va abans en el document, com el bloc del títol de PageFrame. */
      expect(deDalt.compareDocumentPosition(deBaix) & Node.DOCUMENT_POSITION_FOLLOWING, desti.id).toBeTruthy();
      cleanup();
    }
  });

  test('PublicarDeLaPagina: «baix» per defecte (amb div.sdp-pagina-accio); «dalt», la porta sola', () => {
    const { container } = render(
      <MemoryRouter>
        <div data-cas="defecte"><PublicarDeLaPagina clau="publicar_mur" /></div>
        <div data-cas="baix"><PublicarDeLaPagina clau="publicar_mur" lloc="baix" /></div>
        <div data-cas="dalt"><PublicarDeLaPagina clau="publicar_mur" lloc="dalt" /></div>
        <div data-cas="estrany"><PublicarDeLaPagina clau="publicar_mur" lloc="enmig" /></div>
      </MemoryRouter>
    );
    const cas = (nom) => container.querySelector(`[data-cas="${nom}"]`);
    for (const nom of ['defecte', 'baix', 'estrany']) {
      expect([nom, cas(nom).innerHTML]).toEqual([nom, cas('defecte').innerHTML]);
      expect([nom, cas(nom).firstElementChild.className]).toEqual([nom, 'sdp-pagina-accio']);
    }
    expect(cas('dalt').firstElementChild.className).toBe(CLASSE);
    expect(cas('dalt').innerHTML).toBe(cas('defecte').firstElementChild.innerHTML);
  });
});

describe('P6 · les altres pàgines no canvien', () => {
  /* T8 · Ni a baix ni a dalt: cap accioPrincipal (ni un null), i les props
     de la UniversalPage són les de sempre. */
  test('una pàgina que no és de cap targeta del Panell no porta cap botó, ni dalt ni baix', () => {
    estat.pageCopy = { guia: { title: 'Guia del poble', html: '<p>Text</p>' } };
    visita('guia');
    expect([...pagina().children].map((fill) => fill.className)).toEqual(['cms-preview']);
    expect(document.querySelector('.sdp-pagina-accio')).toBeNull();
    expect(Object.hasOwn(estat.props, 'accioPrincipal')).toBe(false);
    expect(dalt()).toBeNull();
    expect(document.querySelector('.sdp-boto')).toBeNull();
  });

  test('PublicarDeLaPagina amb una clau que no és de cap destí no pinta res, en cap lloc', () => {
    const { container } = render(
      <MemoryRouter>
        <PublicarDeLaPagina clau="guia" />
        <PublicarDeLaPagina clau="constructor" />
        <PublicarDeLaPagina />
        <PublicarDeLaPagina clau="guia" lloc="dalt" />
      </MemoryRouter>
    );
    expect(container.childElementCount).toBe(0);
  });
});
