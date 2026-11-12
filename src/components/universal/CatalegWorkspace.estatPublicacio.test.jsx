import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const m = vi.hoisted(() => ({ rows: [], error: null, ownerId: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', item: { id: 'timonet', title: 'Timonet', subtitle: '', lead: '' } }));
vi.mock('./workspace/ProjeccionsCatalegContext.js', () => ({ useProjeccionsCatalegContext: () => ({ projeccions: m.rows, error: m.error, ownerId: m.ownerId, persistent: true, autoritzat: true, desa: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActionsOpcional: () => ({ language: 'ca' }) }));
/* R19 · Des de R18 CatalegWorkspace.jsx:105 llig useLocation() per a sincronitzaRuta (l'URL de la fitxa
   oberta); el doble del router l'ha de portar. Ací sincronitzaRuta és false i la ruta no s'usa. */
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/', search: '' }), useNavigate: () => () => {}, useSearchParams: () => [new URLSearchParams()], Link: ({ children }) => <a>{children}</a> }));
vi.mock('../layout/AppGridShell.jsx', () => ({ useAppGrid: () => ({ tancaPanells() {} }) }));
vi.mock('./workspace/UniversalWorkspace.jsx', () => ({ UniversalWorkspace: ({ renderDetail }) => renderDetail({ item: m.item }) }));
vi.mock('../PedraSeca/index.js', () => ({ UniversalCard: () => null, Boto: ({ children, ...props }) => <button {...props}>{children}</button>,
  Camp: ({ children }) => <div>{children}</div>, Selector: () => null, Fila: ({ children }) => <div>{children}</div>, Alerta: ({ children }) => <div>{children}</div>, PaginaApp: () => null }));
import CatalegWorkspace from './CatalegWorkspace.jsx';
const fila = (id = 'timonet', pendent = true) => ({ id: '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d', ownerUserId: m.ownerId, sectionId: 'mur', title: 'Timonet',
  projeccioCataleg: { v: 1, font: 'herbari', id, destins: ['mur'], audiencia: 'publica' }, _projeccioPendent: pendent });
const mount = () => render(<CatalegWorkspace id="test" font="herbari" destiPublicacio="herbari" permetreEdicioDestins={true} model={{ items: [m.item], categories: [] }} renderDetail={() => <header className="page-title"><h1>Fitxa</h1></header>} />);
beforeEach(() => { m.rows = []; m.error = null; });
afterEach(cleanup);
test('la lectura fallida sense cap publicació no es presenta com una tria pendent', () => {
  m.error = new Error('GET fallit'); mount(); expect(screen.queryByText('No s’ha pogut sincronitzar. La tria continua pendent.')).toBeNull();
});
test('l’error pendent d’una altra fitxa no contamina esta fitxa', () => {
  m.rows = [fila('romer')]; m.error = Object.assign(new Error('POST fallit'), { desatLocal: true }); mount();
  expect(screen.queryByText('No s’ha pogut sincronitzar. La tria continua pendent.')).toBeNull();
});
test('només l’ACK pendent de la fitxa seleccionada mostra la fallada de sincronització', () => {
  m.rows = [fila()]; m.error = Object.assign(new Error('POST fallit'), { desatLocal: true }); mount();
  expect(screen.getByText('No s’ha pogut sincronitzar. La tria continua pendent.')).toBeTruthy();
});
test('una fitxa confirmada manté la confirmació quan una lectura posterior falla', () => {
  m.rows = [fila('timonet', false)]; m.error = new Error('GET fallit'); mount();
  expect(screen.getByText('Destins confirmats pel servidor.')).toBeTruthy(); expect(screen.queryByText('No s’ha pogut sincronitzar. La tria continua pendent.')).toBeNull();
});
