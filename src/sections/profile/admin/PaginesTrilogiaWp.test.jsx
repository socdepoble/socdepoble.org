import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ sessio: null }));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => state.sessio }));
vi.mock('../../../app/contexts/RouterContext.jsx', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../../data/importacio/paginesTrilogiaIMoliWp.js', async original => {
  const real = await original(); return { ...real, carregaPaginesTrilogiaIMoliWp: vi.fn(real.carregaPaginesTrilogiaIMoliWp) };
});
import PaginesTrilogiaWp from './PaginesTrilogiaWp.jsx';
import { carregaPaginesTrilogiaIMoliWp } from '../../../data/importacio/paginesTrilogiaIMoliWp.js';
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); vi.clearAllMocks(); state.sessio = null; });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const admin = () => ({ currentUser: { id: 'fixture-admin' }, generacio: 1, estat: 'dins', esSuperadmin: true, nivell: 'aal2' });
describe('IDEA-111 · previsualització privada del Laboratori', () => {
  test('sense administració resolta i segon factor no inicia la càrrega', () => {
    const view = render(<PaginesTrilogiaWp />); expect(carregaPaginesTrilogiaIMoliWp).not.toHaveBeenCalled();
    state.sessio = { ...admin(), nivell: 'aal1' }; view.rerender(<PaginesTrilogiaWp />);
    expect(carregaPaginesTrilogiaIMoliWp).not.toHaveBeenCalled(); expect(screen.getByRole('status').textContent).toContain('segon factor');
  });
  test('deu opcions, tres reproductors R18 i imatges pròpies verificades sense aprovació automàtica', async () => {
    state.sessio = admin(); const { container, rerender } = render(<PaginesTrilogiaWp />);
    const selector = await screen.findByRole('combobox'); expect(selector.options).toHaveLength(10);
    const ids = [[1, 'VBzEBQq_4LA'], [2, '_knm0PiGE9A'], [3, 'vpTVDipdXi4']];
    for (const [index, id] of ids) {
      fireEvent.change(selector, { target: { value: String(index) } });
      /* Gauntlet R9 · G2-04 · Façana de clic: cada vídeo s'obri amb el seu botó. */
      expect(container.querySelector('iframe')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Veure el vídeo (YouTube)' }));
      const frames = container.querySelectorAll('iframe'); expect(frames).toHaveLength(1);
      expect(frames[0].src).toBe(`https://www.youtube-nocookie.com/embed/${id}`);
      expect(frames[0].getAttribute('loading')).toBe('lazy'); expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
      for (const img of container.querySelectorAll('img')) expect(img.getAttribute('src')).toMatch(/^\/assets\/importacio-wp\//);
      expect(screen.getByRole('link', { name: 'Obri l’esborrany amb Edició avançada' }).href).toContain('/notes?importacioWp=');
    }
    expect(screen.getByRole('status').textContent).toContain('revisió editorial continua pendent');
    state.sessio = null; rerender(<PaginesTrilogiaWp />);
    expect(container.querySelector('iframe')).toBeNull();
  });
});
