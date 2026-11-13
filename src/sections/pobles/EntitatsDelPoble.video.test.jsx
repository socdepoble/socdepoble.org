/**
 * R22.1 · Gauntlet r221-ui-05 i r221-text-08 · La targeta del directori d'un
 * poble pinta el vídeo principal de la FILA (hero_video_url de la vista,
 * 20261113060000) i cap altre: ni un spot hidratat al client, ni una portada
 * d'estudi. Una entitat que el lleva (null) o un servidor sense la columna
 * tornen la targeta de sempre (el logotip). Una referència opaca del bucket
 * públic (sdp-media://mitjans/…) es resol pel port, com a la fitxa pública.
 * Totes les entitats són SINTÈTIQUES (Gauntlet R22.1, dades de prova).
 */
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ caps: new Set(['directoriEntitats']), llista: vi.fn(), navega: vi.fn(), resol: vi.fn() }));
vi.mock('../../data/backendPort.js', async (original) => ({
  ...(await original()),
  teCapacitat: (cap) => m.caps.has(cap),
  listPublicOrganizations: (...args) => m.llista(...args),
  resolveAsset: (...args) => m.resol(...args)
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => m.navega,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, reserva) => reserva }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' }, locale: 'ca-ES' })
}));

import { EntitatsDelPoble } from './EntitatsDelPoble.jsx';

const POBLE = Object.freeze({ id: 'vilanova-de-prova-sdp', title: 'Vilanova de Prova SdP', population: 'Població de mostra', content: '.' });
const LOGO = '/assets/logo-sintetic-cooperativa.webp';
/* La fila d'una entitat (sintètica) tal com la torna la vista d'abans de la migració: sense la columna. */
const COOPERATIVA = Object.freeze({ id: '00000000-0000-4000-8000-0000000000e1', slug: 'cooperativa-sintetica', name: 'Cooperativa Sintètica',
  kind: 'company', lema: '', description: '', logo_url: LOGO, hero_url: '', town_name: 'Vilanova de Prova SdP' });
const FORN = Object.freeze({ id: 'org-forn', slug: 'forn', name: 'Forn de la Plaça', kind: 'company', lema: '', description: '',
  logo_url: '/assets/forn-logo.webp', hero_url: '/media/forn-portada.webp', town_name: 'Vilanova de Prova SdP',
  hero_video_url: 'https://socdepoble.org/media/forn-video.mp4' });

const targetaDe = async (nom) => (await screen.findByRole('heading', { name: nom })).closest('article, .sp-card, [class*="card"]') || document.body;

afterEach(cleanup);
beforeEach(() => {
  m.caps = new Set(['directoriEntitats']);
  m.llista.mockReset();
  m.navega.mockReset();
  m.resol.mockReset();
});

describe('EntitatsDelPoble · el vídeo de la targeta és el de la fila', () => {
  test('una entitat sense vídeo a la fila no en rep cap de llavor: la targeta du el logotip', async () => {
    m.llista.mockResolvedValue([COOPERATIVA]);
    const { container } = render(<EntitatsDelPoble poble={POBLE} />);
    await targetaDe('Cooperativa Sintètica');
    expect(container.querySelector('video')).toBeNull();
    expect(container.innerHTML).not.toMatch(/spot|portada-estudi/);
    expect([...container.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toContain(LOGO);
  });

  test('amb la columna i el vídeo llevat (null), tampoc no n’hi ha cap', async () => {
    m.llista.mockResolvedValue([{ ...COOPERATIVA, hero_video_url: null }]);
    const { container } = render(<EntitatsDelPoble poble={POBLE} />);
    await targetaDe('Cooperativa Sintètica');
    expect(container.querySelector('video')).toBeNull();
  });

  test('qualsevol entitat amb un vídeo propi a la fila el pinta, amb la seua portada com a pòster', async () => {
    m.llista.mockResolvedValue([FORN]);
    const { container } = render(<EntitatsDelPoble poble={POBLE} />);
    await targetaDe('Forn de la Plaça');
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video.getAttribute('src')).toBe(FORN.hero_video_url);
    expect(video.getAttribute('poster')).toBe(FORN.hero_url);
  });

  test('un vídeo de fora a la fila no es pinta', async () => {
    m.llista.mockResolvedValue([{ ...FORN, hero_video_url: 'https://cdn-extern.exemple.com/espia.mp4' }]);
    const { container } = render(<EntitatsDelPoble poble={POBLE} />);
    await targetaDe('Forn de la Plaça');
    expect(container.querySelector('video')).toBeNull();
  });
});

/* Gauntlet R22.1 (regressió de la targeta) · Un vídeo desat com a referència
   opaca del bucket públic (el validador i el CHECK l'admeten) es filtrava cru
   i no es veia mai a la targeta, encara que la fitxa pública sí que el
   resolia. Ara es resol pel port (resolveAsset) com la resta de mitjans. */
describe('EntitatsDelPoble · el vídeo sdp-media:// de la fila es resol pel port', () => {
  const OPAC = 'SDP-MEDIA://mitjans/00000000-0000-4000-8000-0000000000f1/forn-spot.mp4';
  const RESOLT = 'https://socdepoble.org/media/00000000-0000-4000-8000-0000000000f1/forn-spot.mp4';

  test('resolt pel port, la targeta el pinta amb la portada de pòster', async () => {
    m.caps = new Set(['directoriEntitats', 'mitjans']);
    m.resol.mockResolvedValue(RESOLT);
    m.llista.mockResolvedValue([{ ...FORN, hero_video_url: OPAC }]);
    const { container } = render(<EntitatsDelPoble poble={POBLE} />);
    await targetaDe('Forn de la Plaça');
    const video = await vi.waitFor(() => {
      const trobat = container.querySelector('video');
      if (!trobat) throw new Error('encara sense vídeo');
      return trobat;
    });
    expect(m.resol).toHaveBeenCalledWith(OPAC.replace(/^SDP-MEDIA:/, 'sdp-media:'), expect.objectContaining({ signal: expect.anything() }));
    expect(video.getAttribute('src')).toBe(RESOLT);
    expect(video.getAttribute('poster')).toBe(FORN.hero_url);
    expect(container.innerHTML).not.toContain('sdp-media:');
  });

  test('si el port no el resol, o el resol fora de casa, la targeta de sempre i cap referència crua', async () => {
    m.caps = new Set(['directoriEntitats', 'mitjans']);
    for (const resposta of [null, 'https://cdn-extern.exemple.com/espia.mp4']) {
      m.resol.mockReset();
      m.resol.mockResolvedValue(resposta);
      m.llista.mockResolvedValue([{ ...FORN, hero_video_url: OPAC }]);
      const { container, unmount } = render(<EntitatsDelPoble poble={POBLE} />);
      await targetaDe('Forn de la Plaça');
      await vi.waitFor(() => expect(m.resol).toHaveBeenCalled());
      await act(async () => {});
      expect(container.querySelector('video'), String(resposta)).toBeNull();
      expect(container.innerHTML).not.toContain('sdp-media:');
      unmount();
    }
  });
});
