/* IDEA-125 · Ordre del Mestre (261106 16:21) · El Banc d'Importació pinta cada article amb la
   nostra UniversalCard, no amb la <table class="sdp-admin-table"> que no cabia en mòbil; i escolta
   el registre compartit amb la fitxa de revisió del Bloc de notes (revisioImportacioWpStore.js). */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../../app/contexts/RouterContext.jsx', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn()
}));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null }));
vi.mock('../../../hooks/useProjeccionsCataleg.js', () => ({ useProjeccionsCataleg: () => ({ autoritzat: false }) }));

import BancImportacioEditorial from './BancImportacioEditorial.jsx';
import { desaRevisio } from '../../../data/importacio/revisioImportacioWpStore.js';
import { llegeixEstatRevisioEditorial } from '../../../utils/revisioEditorialWp.js';

beforeEach(() => { localStorage.clear(); });
afterEach(cleanup);

const llista = () => screen.getByRole('list', { name: 'Articles importats' });
const targetes = () => within(llista()).getAllByRole('article');
const targetaDe = (titol) => targetes().find((t) => within(t).queryByRole('heading', { level: 4, name: titol }));

test('no hi ha cap taula: una UniversalCard per article visible, dins d’un <li>, amb el títol com a encapçalament', () => {
  const { container } = render(<BancImportacioEditorial />);
  expect(container.querySelector('table')).toBeNull();
  expect(container.querySelector('.sdp-admin-table')).toBeNull();
  const files = [...llista().children];
  expect(files.length).toBe(20);
  for (const li of files) {
    expect(li.tagName).toBe('LI');
    const card = li.querySelector(':scope > article.sp-card');
    expect(card).not.toBeNull();
    const titol = card.querySelector('h4.sp-card-title');
    expect(titol?.textContent.trim().length).toBeGreaterThan(0);
    expect(within(card).getByRole('button', { name: 'Aprovar' })).toBeTruthy();
    expect(within(card).getByRole('link', { name: /Veure pàgina/ })).toBeTruthy();
  }
});

test('tocar la targeta del Catàleg d’Arbres (WP 619) la marca com a actual i obri la fitxa de revisió', () => {
  render(<BancImportacioEditorial />);
  fireEvent.change(screen.getByRole('textbox', { name: /Cerca per títol/ }), { target: { value: '619' } });
  const principal = screen.getByRole('button', { name: /^Catàleg d’Arbres/ });
  fireEvent.click(principal);
  expect(principal.getAttribute('aria-current')).toBe('true');
  /* El número va per plantilla: el Design Guard llig «#» + tres xifres com un color cru. */
  expect(screen.getByRole('heading', { name: new RegExp(`Fitxa de Revisió · #${619}`) })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Tornar a la llista d’articles/ })).toBeTruthy();
});

test('«Aprovar» dins de la targeta desa l’estat i no canvia l’article triat', async () => {
  render(<BancImportacioEditorial />);
  const [primera, segona] = targetes();
  const titolPrimera = primera.querySelector('.sp-card-title').textContent;
  const titolSegona = segona.querySelector('.sp-card-title').textContent;
  const idSegona = segona.querySelector('.sp-card-subtitle').textContent.match(/#(\d+)/)[1];
  expect(screen.getByTestId('importacio-barra-proxima').textContent).toContain(titolPrimera);
  fireEvent.click(within(segona).getByRole('button', { name: 'Aprovar' }));
  await waitFor(() => expect(llegeixEstatRevisioEditorial().estats[idSegona]).toBe('aprovat'));
  expect(screen.getByTestId('importacio-barra-proxima').textContent).toContain(titolPrimera);
  expect(screen.getByTestId('importacio-barra-proxima').textContent).not.toContain(titolSegona);
  await waitFor(() => expect(within(targetaDe(titolSegona)).getByText('✅ Revisió aprovada')).toBeTruthy());
});

test('un desat fet des de fora (la fitxa del Bloc de notes) es veu al Banc sense recarregar', async () => {
  render(<BancImportacioEditorial />);
  fireEvent.change(screen.getByRole('textbox', { name: /Cerca per títol/ }), { target: { value: '16839' } });
  const card = targetes()[0];
  expect(within(card).getByText('⏳ Pendent de revisió')).toBeTruthy();
  await act(async () => { await desaRevisio(16839, { estat: 'amb_observacions', nota: 'Des del Bloc' }); });
  expect(within(targetes()[0]).getByText('📝 Amb observacions')).toBeTruthy();
});
