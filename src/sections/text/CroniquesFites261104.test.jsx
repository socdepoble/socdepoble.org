// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CroniquesFites261104 from './CroniquesFites261104.jsx';
import { IDIOMES_OFICIALS_FITES } from '../../data/fitesArquitectura261104.js';

afterEach(cleanup);

describe('CroniquesFites261104 — Consumidor UI a /versions del catàleg fitesArquitectura261104 (P2-18 / AH-13)', () => {
  it('renderitza les 4 cròniques del 04-11-2026 en valencià per defecte amb identitat socdepoble@socdepoble.org', () => {
    render(<CroniquesFites261104 />);

    const cont = screen.getByTestId('croniques-fites-261104');
    expect(cont.getAttribute('lang')).toBe('ca');
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: /Huit verticals de publicació comunitària des del Panell i el Bloc de Notes/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: /Node 0 al Mac mini M4 i Arquitectura de Resiliència Rural 3-2-1/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: /Publicar en casa i replicar al Fedivers amb la Safata de Conformitat POSSE/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: /Autopia d'Usuari i Sobirania Ciutadana inspirada en el programari lliure de Mastodon/i,
      }),
    ).toBeTruthy();
  });

  it('renderitza les 4 cròniques localitzades en els 5 idiomes oficials (ca, es, en, eu, gl)', () => {
    for (const lang of IDIOMES_OFICIALS_FITES) {
      const { unmount } = render(<CroniquesFites261104 idiomaForcat={lang} />);
      const cont = screen.getByTestId('croniques-fites-261104');
      expect(cont.getAttribute('lang')).toBe(lang);
      expect(cont.querySelectorAll('article[data-fita-id]')).toHaveLength(4);
      unmount();
    }
  });
});
