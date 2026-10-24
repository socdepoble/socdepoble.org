/**
 * P1-11 (pla 261024_2230, T5B-01; ordre del Mestre 261024 18:21) · La
 * segona pestanya de la pàgina d'un poble, «Empreses i entitats»: el
 * directori públic filtrat pel NOM del poble (al servidor, abans del límit),
 * la targeta del directori, cap botó solt de seguir i cap petició fins que la
 * persona obri la pestanya. Les píndoles duplicades de la capçalera ja no hi són.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ caps: new Set(['directoriEntitats']), llista: vi.fn(), navega: vi.fn() }));
vi.mock('../../data/backendPort.js', async (original) => ({
  ...(await original()),
  teCapacitat: (cap) => m.caps.has(cap),
  listPublicOrganizations: (...args) => m.llista(...args)
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => m.navega,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
/* L'App de mentides: el traductor torna la reserva valenciana (EstatErrorDades el demana). */
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, reserva) => reserva }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' }, locale: 'ca-ES' })
}));

import { EntitatsDelPoble, textosDeLesEntitats } from './EntitatsDelPoble.jsx';
import { nomDelPobleDeLaFitxa } from './useEntitatsDelPoble.js';
import { buildPoblesDetailSectionMeta } from '../detail/detailSectionMeta.jsx';

const t = (_, alternativa) => alternativa;
const POBLE = Object.freeze({ id: 'vilanova-de-prova-sdp', title: 'Vilanova de Prova SdP', population: 'Població de mostra', content: '.' });
const FORN = Object.freeze({ id: 'org-forn', slug: 'forn', name: 'Forn de la Plaça', kind: 'company', lema: 'Pa de llenya',
  description: 'Coca i pa cada matí', logo_url: '', hero_url: '', town_name: 'Vilanova de Prova SdP' });
const COLLA = Object.freeze({ id: 'org-colla', slug: 'colla', name: 'Colla de la Serra', kind: 'group', lema: '',
  description: 'Caminades', logo_url: '', hero_url: '', town_name: 'Vilanova de Prova SdP' });
const DE_FORA = Object.freeze({ ...FORN, id: 'org-fora', name: 'Taller de fora', town_name: 'Un altre poble' });

afterEach(cleanup);
beforeEach(() => {
  m.caps = new Set(['directoriEntitats']);
  m.llista.mockReset();
  m.llista.mockResolvedValue([FORN, COLLA]);
  m.navega.mockReset();
});

describe('EntitatsDelPoble · el panell', () => {
  test('demana el directori pel NOM del poble, amb el senyal, i pinta la targeta del directori de cada entitat', async () => {
    render(<EntitatsDelPoble poble={POBLE} />);
    expect(screen.getByText('Carregant les empreses i entitats del poble…')).toBeTruthy();
    await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
    expect(m.llista.mock.calls[0]).toEqual([{ poble: 'Vilanova de Prova SdP', signal: expect.any(AbortSignal) }, { dataMode: 'seed' }]);
    const forn = await screen.findByRole('heading', { name: 'Forn de la Plaça' });
    expect(forn).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Colla de la Serra' })).toBeTruthy();
    /* L'etiqueta del tipus i la fitxa pública de cadascuna (un grup, /grup). */
    expect(screen.getByText('Empresa')).toBeTruthy();
    expect(screen.getByText('Grup')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Colla de la Serra' }));
    expect(m.navega).toHaveBeenCalledWith('/grup/org-colla', expect.anything());
    /* Doctrina del Connectar · cap botó solt de seguir: la relació passa per /connectar. */
    expect(document.body.textContent).not.toMatch(/Seguir|seguix|Seguidors/);
  });

  test('una fila d’un altre poble (un amfitrió que ignorara el filtre) no entra mai a la pestanya', async () => {
    m.llista.mockResolvedValueOnce([FORN, DE_FORA, { ...COLLA, town_name: null }]);
    render(<EntitatsDelPoble poble={POBLE} />);
    expect(await screen.findByRole('heading', { name: 'Forn de la Plaça' })).toBeTruthy();
    expect(screen.queryByText('Taller de fora')).toBeNull();
    expect(screen.queryByText('Colla de la Serra')).toBeNull();
  });

  test('el buit, sense capacitat i sense nom de poble: un text i, sense nom, cap crida', async () => {
    m.llista.mockResolvedValueOnce([]);
    render(<EntitatsDelPoble poble={POBLE} />);
    expect(await screen.findByText('Encara no hi ha cap empresa ni entitat d’este poble al directori.')).toBeTruthy();
    cleanup();
    m.caps = new Set();
    render(<EntitatsDelPoble poble={POBLE} />);
    expect(screen.getByRole('status').textContent).toBe('Este servidor encara no llista les empreses i entitats dels pobles.');
    cleanup();
    m.caps = new Set(['directoriEntitats']);
    m.llista.mockClear();
    render(<EntitatsDelPoble poble={{ id: 'sense-nom', title: '   ' }} />);
    expect(screen.getByRole('status').textContent).toBe('Encara no hi ha cap empresa ni entitat d’este poble al directori.');
    expect(m.llista).not.toHaveBeenCalled();
  });

  test('C11-01 · un servidor que no sap el poble de les organitzacions (NO-DISPONIBLE) ho diu, sense reintent fals', async () => {
    m.llista.mockRejectedValueOnce(Object.assign(new Error('sense town_name'), { code: 'NO-DISPONIBLE' }));
    render(<EntitatsDelPoble poble={POBLE} />);
    expect(await screen.findByText('Este servidor encara no llista les empreses i entitats dels pobles.')).toBeTruthy();
    expect(screen.queryByText('Carregant les empreses i entitats del poble…')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Torna-ho a provar' })).toBeNull();
  });

  test('una fallada es diu amb «Torna-ho a provar», que torna a demanar', async () => {
    m.llista.mockRejectedValueOnce(Object.assign(new Error('Supabase 503'), { status: 503 }));
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<EntitatsDelPoble poble={POBLE} />);
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('No s’han pogut carregar les empreses i entitats del poble');
    /* És l'estat d'error de les dades, no la barrera de les targetes: res no ha petat. */
    expect(alerta.textContent).not.toContain('La resta de la pàgina continua com sempre.');
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    fireEvent.click(within(alerta).getByRole('button', { name: 'Torna-ho a provar' }));
    expect(await screen.findByRole('heading', { name: 'Forn de la Plaça' })).toBeTruthy();
    expect(m.llista).toHaveBeenCalledTimes(2);
  });

  test('el nom del poble de la fitxa: el title, o el name; sense cap, null', () => {
    expect(nomDelPobleDeLaFitxa({ title: '  Benifallim ', name: 'x' })).toBe('Benifallim');
    expect(nomDelPobleDeLaFitxa({ title: '', name: 'Benilloba' })).toBe('Benilloba');
    expect(nomDelPobleDeLaFitxa({ title: ' ' })).toBeNull();
    expect(nomDelPobleDeLaFitxa(null)).toBeNull();
    expect(textosDeLesEntitats().tipus).toEqual({ company: 'Empresa', entity: 'Entitat', group: 'Grup' });
  });
});

describe('la pàgina del poble', () => {
  test('dues pestanyes; la de les entitats no pregunta res fins que s’obri, i llavors carrega el panell', async () => {
    const meta = buildPoblesDetailSectionMeta({ t });
    const { container } = render(<>{meta.renderBody(POBLE, { detall: true })}</>);
    const pestanyes = screen.getAllByRole('tab');
    expect(pestanyes.map((p) => p.textContent)).toEqual(['Gent de Vilanova de Prova SdP', 'Empreses i entitats']);
    expect(pestanyes[0].getAttribute('aria-selected')).toBe('true');
    expect(m.llista).not.toHaveBeenCalled();
    fireEvent.click(pestanyes[1]);
    expect(pestanyes[1].getAttribute('aria-selected')).toBe('true');
    expect(await screen.findByRole('heading', { name: 'Forn de la Plaça' })).toBeTruthy();
    expect(m.llista).toHaveBeenCalledTimes(1);
    /* Tornar a «Gent» no desmunta el panell (cap segona crida en tornar-hi). */
    fireEvent.click(pestanyes[0]);
    fireEvent.click(pestanyes[1]);
    expect(m.llista).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(2);
  });

  test('sense les píndoles duplicades (.badge-row/.pill) de la població i del nom del poble', () => {
    const meta = buildPoblesDetailSectionMeta({ t });
    const { container } = render(<>{meta.renderBody(POBLE, { detall: true })}</>);
    expect(container.querySelector('.badge-row, .pill')).toBeNull();
    expect(container.textContent).not.toContain('Població de mostra');
    /* El lector del MAS (sense detall) tampoc: només el botó blau. */
    cleanup();
    const { container: lector } = render(<>{meta.renderBody(POBLE)}</>);
    expect(lector.querySelector('.badge-row, .pill, [role="tablist"]')).toBeNull();
    expect(lector.querySelector('.sdp-pagina-accio')).not.toBeNull();
  });
});
