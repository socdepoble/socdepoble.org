import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const m = vi.hoisted(() => ({ language: 'ca', error: null, rows: [], navigate: vi.fn() }));
vi.mock('../../../hooks/useProjeccionsCataleg.js', () => ({ useProjeccionsCataleg: () => ({ projeccions: m.rows, error: m.error, ownerId: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5' }) }));
vi.mock('../../../app/contexts/UIContext.jsx', () => ({ useUIActionsOpcional: () => ({ language: m.language }) }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../PedraSeca/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
  UniversalCard: ({ title }) => <article>{title}</article>,
}));
import ProjeccionsEnSuperficie from './ProjeccionsEnSuperficie.jsx';
beforeEach(() => { m.language = 'ca'; m.rows = []; m.error = null; });
afterEach(cleanup);
test.each([
  ['ca', 'No s’han pogut carregar les referències publicades. Torna-ho a provar més tard.'],
  ['es', 'No se han podido cargar las referencias publicadas. Inténtalo más tarde.'],
  ['en', 'Published references could not be loaded. Try again later.'],
  ['eu', 'Ezin izan dira argitaratutako erreferentziak kargatu. Saiatu geroago.'],
  ['gl', 'Non se puideron cargar as referencias publicadas. Téntao máis tarde.']
])('%s · una lectura fallida usa el widget Alerta d’avís estandarditzat (sense <h3> cru), mai absència reeixida ni publicació pendent', (language, text) => {
  m.language = language; m.error = new Error('lectura interrompuda');
  render(<ProjeccionsEnSuperficie desti="mur" />);
  const avis = screen.getByRole('status');
  expect(avis.textContent).toBe(text);
  expect(avis.classList.contains('sdp-alerta')).toBe(true);
  expect(avis.classList.contains('sdp-alerta--avis')).toBe(true);
  expect(screen.queryByRole('heading')).toBeNull();
  expect(screen.queryByText(/tria continua pendent|selection is still pending|Pendiente de sincronizar/i)).toBeNull();
});
test('la resposta buida reeixida no inventa una fallada i un POST pendent no es diu lectura fallida', () => {
  const view = render(<ProjeccionsEnSuperficie desti="mercat" />); expect(view.container.textContent).toBe('');
  m.error = Object.assign(new Error('POST pendent'), { desatLocal: true }); view.rerender(<ProjeccionsEnSuperficie desti="mercat" />);
  expect(view.container.textContent).toBe('');
});
test('IDEA-352 · amb referències i una lectura fallida, la secció pinta les targetes i l’avís és l’Alerta estandarditzada (role=status), no un <p> cru', () => {
  m.rows = [{ id: '00000000-0000-4000-8000-000000000001', ownerUserId: '2b3c4d5e-6f70-4812-9345-6789abcdef01', sectionId: 'mur', title: 'Mel de la veïna',
    subtitle: '', entradilla: '', author_name: 'Mel de la veïna', projeccioCataleg: { v: 1, font: 'nevera', id: 'mel', destins: ['mur'], audiencia: 'publica' } }];
  m.error = new Error('lectura interrompuda');
  render(<ProjeccionsEnSuperficie desti="mur" />);
  const seccio = screen.getByRole('region', { name: 'Referències publicades' });
  expect(seccio.querySelectorAll('.sdp-card-grid > article')).toHaveLength(1);
  const avis = screen.getByRole('status');
  expect(seccio.contains(avis)).toBe(true);
  expect(avis.classList.contains('sdp-alerta')).toBe(true);
  expect(avis.classList.contains('sdp-alerta--avis')).toBe(true);
  expect(avis.textContent).toBe('No s’han pogut carregar les referències publicades. Torna-ho a provar més tard.');
  expect(seccio.querySelectorAll('p[role="status"]')).toHaveLength(0);
});
