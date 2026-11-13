/**
 * IDEA-61 (T0, prompt 261102_1532) · Les tres seccions verticals
 * (SeccioVertical.jsx): la llista és la del Mur filtrada per àmbit (mai una
 * fitxa 'tancada' ni una d'un altre àmbit), amb la targeta del Mur; els
 * estats buit, carregant i error amb els textos de cada àmbit; el botó
 * «+ Publicar» a la ranura de l'acció principal cap a l'editor amb l'àmbit;
 * i «Mostra més» de la secció 'mur', que és on viuen les fitxes.
 * Patró de les proves veïnes del Mur: router, avisos i i18n substituïts; el
 * proveïdor del Mur, un doble amb l'estat de cada prova.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const estat = vi.hoisted(() => ({ navigate: vi.fn(), seo: vi.fn(), mur: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => estat.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (...args) => estat.seo(...args) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => estat.mur }));

import SeccioVertical, { AMBITS_VERTICALS, TEXTOS_VERTICALS, rutaDePublicar } from './SeccioVertical.jsx';
import CA from '../../config/idiomes/ca.js';

const CREAT = '2026-11-02T10:00:00.000Z';
const fitxa = (ambit, id, extra = {}) => ({
  id, type: ambit, title: `Fitxa ${id}`, ambit, estat: 'disponible', created_at: CREAT, dades: {}, ...extra
});
const puntMapa = (id, extra) => fitxa('mapa', id, { dades: { modalitat: 'patrimoni', lloc: 'Assut del riu', municipi: 'La Torre' }, ...extra });
const viatge = (id, extra) => fitxa('vehicle', id, { dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', places: 3 }, ...extra });
const animal = (id, extra) => fitxa('animalets', id, { dades: { modalitat: 'adopcio', especie: 'Gos pastor', municipi: 'La Torre' }, ...extra });
const oferta = (id, extra) => fitxa('treball', id, { dades: { modalitat: 'oferta_feina', ofici: 'Forn' }, ...extra });
const casa = (id, extra) => fitxa('habitatge', id, { dades: { modalitat: 'lloguer', preu: '350 €' }, ...extra });
const deSempre = (id) => ({ id, type: 'feed', title: `Publicació ${id}`, created_at: CREAT });

/* Un doble del proveïdor del Mur, llest, amb les publicacions donades. */
const mur = (sortedFeedPosts, extra = {}) => ({
  status: 'ready', error: null, refresh: vi.fn(), sortedFeedPosts,
  carregaMes: vi.fn(async () => true), hiHaMes: () => false, carregantMes: () => false, errorMes: () => null,
  ...extra
});
const pinta = (ambit) => render(<SeccioVertical ambit={ambit} />);
const targetes = () => [...document.querySelectorAll('.sdp-card-grid article.sp-card')];
const enllacos = () => targetes().map((article) => article.querySelector('a.sp-card-link-overlay')?.getAttribute('href'));
const titol = () => document.querySelector('header.page-title h1')?.textContent;

const TEXTOS = {
  mapa: { kicker: 'Mapa', buit: 'Encara no hi ha cap punt del mapa publicat en este poble.', error: 'No s’ha pogut carregar el Mapa', carregant: 'Carregant els punts del mapa…', publicar: 'Publicar un punt al mapa' },
  vehicle: { kicker: 'Compartir cotxe', buit: 'Encara no hi ha cap viatge publicat en este poble.', error: 'No s’ha pogut carregar Compartir cotxe', carregant: 'Carregant els viatges…', publicar: 'Publicar un viatge' },
  animalets: { kicker: 'Animalets', buit: 'Encara no hi ha cap fitxa d’animalets publicada en este poble.', error: 'No s’ha pogut carregar Animalets', carregant: 'Carregant les fitxes d’animalets…', publicar: 'Publicar una fitxa d’animalets' },
  treball: { kicker: 'Treball', buit: 'Encara no hi ha cap oferta publicada en este poble.', error: 'No s’ha pogut carregar Treball', carregant: 'Carregant les ofertes…', publicar: 'Publicar una oferta' },
  habitatge: { kicker: 'Habitatge', buit: 'Encara no hi ha cap habitatge publicat en este poble.', error: 'No s’ha pogut carregar Habitatge', carregant: 'Carregant els habitatges…', publicar: 'Publicar un habitatge' }
};
const TOTES = [puntMapa('m1'), puntMapa('m2', { estat: 'tancat' }), viatge('v1'), viatge('v2', { estat: 'tancat' }), animal('a1'), animal('a2', { estat: 'tancat' }), oferta('t1'), oferta('t2', { estat: 'reservat' }), casa('h1'), casa('h2', { estat: 'complet' }), deSempre('p1')];
const ESPERADES = { mapa: ['/mapa/m1'], vehicle: ['/vehicle/v1'], animalets: ['/animalets/a1'], treball: ['/treball/t1', '/treball/t2'], habitatge: ['/habitatge/h1', '/habitatge/h2'] };

beforeEach(() => { vi.clearAllMocks(); estat.mur = mur([]); });
afterEach(cleanup);

/* G3-regressio-01 i G3-pedra-seca-i18n-10 · El contracte del fitxer («la
   reserva és el valor de ca.js, caràcter a caràcter») es complia per a
   vehicle, treball i habitatge, però no per a Mapa ni Animalets (7 reserves
   diferents). La prova en fixava les reserves amb un t que les torna: ara
   cada parell [clau, reserva] es compara amb ca.js, també els que vinguen.
   G3-pedra-seca-i18n-15 · /mapa és una llista de targetes: l'entradilla no
   promet cap «vista geogràfica del projecte» (la clau section.mapa.subtitle,
   que encara fa servir el connector del Mapa), sinó el que s'hi publica. */
describe('els textos: la reserva és la de ca.js, caràcter a caràcter', () => {
  test.each(AMBITS_VERTICALS)('%s: cada [clau, reserva] és el valor de ca.js', (ambit) => {
    const parells = Object.values(TEXTOS_VERTICALS[ambit]);
    expect(parells.length).toBe(7);
    for (const [clau, reserva] of parells) expect([clau, reserva]).toEqual([clau, CA[clau]]);
  });

  test('/mapa: l’entradilla diu el que hi ha (punts, camins, patrimoni i incidències), mai una «vista geogràfica»', () => {
    expect(TEXTOS_VERTICALS.mapa.subtitle[0]).toBe('section.mapa.lead');
    pinta('mapa');
    const entradilla = TEXTOS_VERTICALS.mapa.subtitle[1];
    expect(entradilla).toBe('Punts d’interès, camins, patrimoni i incidències del terme que publica la gent de poble.');
    expect(document.body.textContent).toContain(entradilla);
    expect(document.body.textContent).not.toMatch(/geogr[aà]fica/i);
    expect(estat.seo).toHaveBeenCalledWith(expect.objectContaining({ description: entradilla }));
  });
});

describe('la llista: les fitxes de l’àmbit que es poden llistar, amb la targeta del Mur', () => {
  test('cinc àmbits amb secció', () => {
    expect(AMBITS_VERTICALS).toEqual(['mapa', 'vehicle', 'animalets', 'treball', 'habitatge']);
    expect(rutaDePublicar('vehicle')).toBe('/notes?ambit=vehicle');
  });

  test.each(AMBITS_VERTICALS)('%s: només les seues fitxes, mai una tancada ni una publicació de sempre, i el detall de l’àmbit', (ambit) => {
    estat.mur = mur(TOTES);
    pinta(ambit);
    expect(titol()).toBe(TEXTOS[ambit].kicker);
    expect(enllacos()).toEqual(ESPERADES[ambit]);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(estat.seo).toHaveBeenCalledWith(expect.objectContaining({ title: TEXTOS[ambit].kicker }));
  });

  test('la targeta d’una fitxa porta l’àmbit i l’estat com a etiquetes i el resum com a subtítol', () => {
    estat.mur = mur([viatge('v1')]);
    pinta('vehicle');
    const [article] = targetes();
    const etiquetes = [...article.querySelectorAll('li.sp-card-label')].map((li) => [li.textContent, li.className]);
    expect(etiquetes.slice(0, 2)).toEqual([['Compartir cotxe', 'sp-card-label sdp-badge-system'], ['Disponible', 'sp-card-label sdp-insignia sdp-insignia--exit']]);
    expect(article.textContent).toContain('Oferisc places · La Torre → Alcoi · 2026-11-15 · Places disponibles: 3');
  });

  test('un àmbit que no és cap vertical no pinta res', () => {
    estat.mur = mur(TOTES);
    const { container } = render(<SeccioVertical ambit="mercat" />);
    expect(container.childElementCount).toBe(0);
  });
});

describe('els estats de la pàgina', () => {
  test.each(AMBITS_VERTICALS)('%s: sense cap fitxa, el text de buit de l’àmbit', (ambit) => {
    estat.mur = mur([deSempre('p1')]);
    pinta(ambit);
    expect(screen.getByRole('status').textContent).toBe(TEXTOS[ambit].buit);
    expect(targetes()).toHaveLength(0);
  });

  test.each(AMBITS_VERTICALS)('%s: mentre carrega, el Carregant (role status) amb el text de l’àmbit, cap targeta i cap text de buit', (ambit) => {
    estat.mur = mur([], { status: 'loading' });
    pinta(ambit);
    expect(screen.getByRole('status').textContent).toBe(TEXTOS[ambit].carregant);
    expect(screen.queryByText(TEXTOS[ambit].buit)).toBeNull();
    expect(targetes()).toHaveLength(0);
  });

  test.each(AMBITS_VERTICALS)('%s: en error, l’avís amb el títol de l’àmbit i «Torna-ho a provar» recarrega el Mur', (ambit) => {
    const refresh = vi.fn();
    estat.mur = mur([], { status: 'error', error: Object.assign(new Error('Supabase 500'), { status: 500 }), refresh });
    pinta(ambit);
    const avis = screen.getByRole('alert');
    expect(avis.textContent).toContain(TEXTOS[ambit].error);
    fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

describe('«+ Publicar», l’acció principal de la pàgina', () => {
  test.each(AMBITS_VERTICALS)('%s: un enllaç a l’editor amb l’àmbit, dins del bloc del títol', (ambit) => {
    estat.mur = mur(TOTES);
    pinta(ambit);
    const porta = screen.getByRole('link', { name: TEXTOS[ambit].publicar });
    expect(porta.getAttribute('href')).toBe(`/notes?ambit=${ambit}`);
    expect(porta.closest('.page-title-accio')).not.toBeNull();
    expect(porta.className).toBe('sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple');
    expect(document.querySelectorAll('.page-title-accio .sdp-boto')).toHaveLength(1);
  });
});

describe('«Mostra més» de la secció del Mur', () => {
  test('amb més pàgines del Mur, el botó carrega la secció mur; sense, cap botó', () => {
    const carregaMes = vi.fn(async () => true);
    estat.mur = mur([viatge('v1')], { carregaMes, hiHaMes: (seccio) => seccio === 'mur' });
    pinta('vehicle');
    fireEvent.click(screen.getByRole('button', { name: 'Mostra més' }));
    expect(carregaMes).toHaveBeenCalledWith('mur');
    cleanup();
    estat.mur = mur([viatge('v1')], { carregaMes, hiHaMes: (seccio) => seccio === 'mercat' });
    pinta('vehicle');
    expect(screen.queryByRole('button', { name: 'Mostra més' })).toBeNull();
  });

  test('si la pàgina següent falla, l’avís de l’àmbit i «Torna-ho a provar» torna a demanar la secció mur', () => {
    const carregaMes = vi.fn(async () => true);
    estat.mur = mur([viatge('v1')], { carregaMes, hiHaMes: () => true, errorMes: (seccio) => (seccio === 'mur' ? Object.assign(new Error('500'), { status: 500 }) : null) });
    pinta('vehicle');
    expect(screen.getByRole('alert').textContent).toContain(TEXTOS.vehicle.error);
    fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
    expect(carregaMes).toHaveBeenCalledWith('mur');
  });

  test('O2-T4: si les primeres pàgines del Mur no tenen cap fitxa de l’àmbit però hiHaMes és cert, avança pàgines fins a trobar-ne una', async () => {
    const pagines = [
      [deSempre('p2'), oferta('t2')],
      [casa('h2'), viatge('v_tancat', { estat: 'tancat' })],
      [viatge('v2')]
    ];
    const carregaMes = vi.fn(async () => {
      const seguent = pagines.shift() ?? [];
      estat.mur = {
        ...estat.mur,
        sortedFeedPosts: [...estat.mur.sortedFeedPosts, ...seguent],
        hiHaMes: () => pagines.length > 0
      };
      return true;
    });
    estat.mur = mur([deSempre('p1')], { carregaMes, hiHaMes: () => pagines.length > 0 });
    pinta('vehicle');

    await waitFor(() => {
      expect(enllacos()).toEqual(['/vehicle/v2']);
    });
    expect(carregaMes).toHaveBeenCalledTimes(3);
    expect(screen.queryByText(TEXTOS.vehicle.buit)).toBeNull();
  });

  test('O2-T4: en prémer «Mostra més», salta les pàgines del Mur sense fitxes de l’àmbit fins que n’apareix una de nova', async () => {
    const pagines = [
      [deSempre('p2'), oferta('t2')],
      [deSempre('p3'), casa('h2')],
      [viatge('v2')]
    ];
    const carregaMes = vi.fn(async () => {
      const seguent = pagines.shift() ?? [];
      estat.mur = {
        ...estat.mur,
        sortedFeedPosts: [...estat.mur.sortedFeedPosts, ...seguent],
        hiHaMes: () => pagines.length > 0
      };
      return true;
    });
    estat.mur = mur([viatge('v1')], { carregaMes, hiHaMes: () => pagines.length > 0 });
    pinta('vehicle');
    expect(enllacos()).toEqual(['/vehicle/v1']);

    fireEvent.click(screen.getByRole('button', { name: 'Mostra més' }));

    await waitFor(() => {
      expect(enllacos()).toEqual(['/vehicle/v1', '/vehicle/v2']);
    });
    expect(carregaMes).toHaveBeenCalledTimes(3);
  });

  /* AUD-O2-T4-01 (revisió de Codex, àrbitre de Claude 261102): el Mur filtra
     les publicacions bloquejades abans de lliurar sortedFeedPosts, així que
     una pàgina pot avançar el cursor sense canviar cap element visible. */
  test('AUD-O2-T4-01: una pàgina sense cap element visible però cursor avançat no talla la cerca', async () => {
    let pagines = 0;
    const carregaMes = vi.fn(async () => {
      pagines++;
      estat.mur = {
        ...estat.mur,
        sortedFeedPosts: pagines === 1 ? [...estat.mur.sortedFeedPosts] : [...estat.mur.sortedFeedPosts, viatge('v_visible')],
        hiHaMes: () => pagines < 2
      };
      return true;
    });
    estat.mur = mur([deSempre('p1')], { carregaMes, hiHaMes: () => pagines < 2 });
    pinta('vehicle');
    await waitFor(() => expect(enllacos()).toEqual(['/vehicle/v_visible']));
    expect(carregaMes).toHaveBeenCalledTimes(2);
  });

  test('AUD-O2-T4-01: «Mostra més» tampoc es queda en blanc si la pàgina següent només porta elements filtrats', async () => {
    let pagines = 0;
    const carregaMes = vi.fn(async () => {
      pagines++;
      estat.mur = {
        ...estat.mur,
        sortedFeedPosts: pagines === 1 ? [...estat.mur.sortedFeedPosts] : [...estat.mur.sortedFeedPosts, viatge('v2')],
        hiHaMes: () => pagines < 2
      };
      return true;
    });
    estat.mur = mur([viatge('v1')], { carregaMes, hiHaMes: () => pagines < 2 });
    pinta('vehicle');
    expect(enllacos()).toEqual(['/vehicle/v1']);
    fireEvent.click(screen.getByRole('button', { name: 'Mostra més' }));
    await waitFor(() => expect(enllacos()).toEqual(['/vehicle/v1', '/vehicle/v2']));
    expect(carregaMes).toHaveBeenCalledTimes(2);
  });

  test('AUD-O2-T4-01: una pàgina que no avança (carregaMes torna false) no reobri la cerca', async () => {
    const carregaMes = vi.fn(async () => false);
    estat.mur = mur([deSempre('p1')], { carregaMes, hiHaMes: () => true });
    pinta('vehicle');
    await waitFor(() => expect(carregaMes).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 30));
    expect(carregaMes).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toBe(TEXTOS.vehicle.buit);
  });
});
