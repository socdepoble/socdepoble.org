import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  navigate: vi.fn(), logout: vi.fn(), estatBaixa: vi.fn(), estatConsentiment: vi.fn(), exporta: vi.fn(),
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ logout: m.logout }) }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, lead, topBarData, children }) => (
    <main>
      <header className="page-title"><h1>{title}</h1></header>
      <p>{lead}</p><p>{topBarData?.authorName}</p>{children}
    </main>
  ),
}));
/* El compte ja no crida cap dret: si algú els tornara a posar ací, estes
   funcions ho delatarien. */
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => true,
  exportaLesMeuesDades: m.exporta, estatBaixa: m.estatBaixa, estatConsentiment: m.estatConsentiment,
}));
import { DetallCompte } from './DetallCompte.jsx';

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { full_name: 'Pep', email: 'pep@poble.test', is_public: false, town_name: 'La Torre' } };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { name: 'Forn', slug: 'forn', kind: 'company', role: 'owner' } };

let props;
function pinta(identitat = jo, extra = {}) {
  props = { identitat, guardarAjust: vi.fn(async () => undefined), pujaMitja: vi.fn(), ...extra };
  return render(<DetallCompte {...props} />);
}
const seccio = (titol) => screen.getByRole('heading', { level: 2, name: titol }).closest('section');

beforeEach(() => {
  for (const f of [m.navigate, m.logout, m.estatBaixa, m.estatConsentiment, m.exporta]) f.mockReset();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('la persona veu els ajustos del compte i no els de la fitxa', () => {
  pinta();
  expect(screen.getByRole('heading', { level: 1, name: 'El compte' })).toBeTruthy();
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(titols).toEqual(['Correu electrònic', 'Estat del perfil', 'Contrasenya', 'Tancar sessió']);
  expect(within(seccio('Correu electrònic')).getByText('pep@poble.test')).toBeTruthy();
});

test('una contrasenya de menys de 10 caràcters no s’envia', async () => {
  pinta();
  const camp = within(seccio('Contrasenya')).getByLabelText(/contrasenya/i);
  expect(camp.getAttribute('autocomplete')).toBe('new-password');
  fireEvent.change(camp, { target: { value: 'curta' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).not.toHaveBeenCalled();
  expect(screen.getByText('La contrasenya ha de tindre almenys 10 caràcters.')).toBeTruthy();
  fireEvent.change(camp, { target: { value: 'una-bona-contrasenya' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).toHaveBeenCalledWith('jo', 'contrasenya', 'una-bona-contrasenya');
});

test('els drets tenen pàgina pròpia: ni amb les capacitats hi ha cap bloc de drets ni cap crida', () => {
  pinta();
  expect(screen.queryByRole('heading', { name: 'Les meues dades' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Donar-se de baixa' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Consentiment' })).toBeNull();
  expect(m.estatBaixa).not.toHaveBeenCalled();
  expect(m.estatConsentiment).not.toHaveBeenCalled();
  expect(m.exporta).not.toHaveBeenCalled();
});

test('«Estat del perfil»: la casella té un nom estable, l’etiqueta visible hi apunta i el desat s’anuncia', async () => {
  pinta();
  const bloc = seccio('Estat del perfil');
  const casella = within(bloc).getByRole('checkbox', { name: 'Perfil públic' });
  expect(casella.checked).toBe(false);
  // L'etiqueta «Estat del perfil:» apunta a la casella (abans, a un id que no existia).
  expect(within(bloc).getByLabelText('Estat del perfil:')).toBe(casella);
  fireEvent.click(casella);
  expect(within(bloc).getByRole('checkbox', { name: 'Perfil públic' }).checked).toBe(true);
  await act(async () => { fireEvent.submit(casella.closest('form')); });
  expect(props.guardarAjust).toHaveBeenCalledWith('jo', 'privacitat', true);
  expect(within(bloc).getByRole('status').textContent).toBe('Desat correctament.');
  props.guardarAjust.mockRejectedValueOnce(new Error('Sense xarxa'));
  await act(async () => { fireEvent.submit(casella.closest('form')); });
  expect(within(bloc).getByRole('alert').textContent).toBe('Sense xarxa');
});

test('amb una baixa en curs, «Estat del perfil» no es pot desar i diu per què', () => {
  pinta({ ...jo, dades: { ...jo.dades, baixa_demanada_at: '2026-09-26T10:00:00Z' } });
  const bloc = seccio('Estat del perfil');
  expect(within(bloc).queryByRole('checkbox')).toBeNull();
  expect(within(bloc).queryByRole('button', { name: 'Guardar' })).toBeNull();
  expect(within(bloc).getByText(/baixa en curs/)).toBeTruthy();
  expect(within(bloc).getByText(/Privacitat i dades/)).toBeTruthy();
});

test('una organització mostra identificador i accions pendents', () => {
  pinta(forn);
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(titols).toEqual(['Membres', 'Identificador', 'Fitxa pública', 'Eixir de l’organització']);
  expect(within(seccio('Identificador')).getByText('forn')).toBeTruthy();
  expect(screen.getByText('Identificador, membres i eixida de Forn.')).toBeTruthy();
});

test('sense identitat no pinta res', () => {
  const { container } = render(<DetallCompte identitat={null} />);
  expect(container.innerHTML).toBe('');
});
