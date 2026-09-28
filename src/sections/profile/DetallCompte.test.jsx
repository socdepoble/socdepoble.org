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

test('una organització mostra el correu, l’identificador i les accions pendents', () => {
  pinta(forn);
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  /* T43 (ordre del Mestre, 260928) · el correu opcional de l'organització va primer. */
  expect(titols).toEqual(['Correu de l’organització', 'Correu a la fitxa pública', 'Membres', 'Identificador', 'Fitxa pública', 'Eixir de l’organització']);
  expect(within(seccio('Identificador')).getByText('forn')).toBeTruthy();
  expect(screen.getByText('Correu, identificador, membres i eixida de Forn.')).toBeTruthy();
  /* Sense el correu llegit encara, els dos ajustos es pinten tancats i ho diuen. */
  expect(within(seccio('Correu de l’organització')).queryByRole('textbox')).toBeNull();
  expect(within(seccio('Correu de l’organització')).getByText('Carregant el correu de l’organització…')).toBeTruthy();
});

/* ── T43 · el correu opcional de l'organització ── */

const CONTACTE = { estat: 'llest', correu: '', public: false, perDefecte: { origen: 'creador', correu: 'pep@poble.test' } };

test('T43 · qui administra escriu un correu validat; l’ajuda diu d’on ix el per defecte, i buit és vàlid', async () => {
  pinta(forn, { contacte: CONTACTE });
  const bloc = seccio('Correu de l’organització');
  const camp = within(bloc).getByLabelText('Nou valor per a correu de l’organització:');
  expect(camp.getAttribute('type')).toBe('email');
  expect(camp.getAttribute('autocomplete')).toBe('email');
  const ajuda = within(bloc).getByText(/al teu correu \(pep@poble\.test\), perquè vas crear l’organització/);
  expect(camp.getAttribute('aria-describedby')).toBe(ajuda.id);
  fireEvent.change(camp, { target: { value: 'forn@x.cat?cc=altre@y.cat' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).not.toHaveBeenCalled();
  expect(within(bloc).getByRole('alert').textContent).toContain('Escriu un correu vàlid');
  fireEvent.change(camp, { target: { value: 'forn@exemple.cat' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).toHaveBeenCalledWith('O', 'correu', 'forn@exemple.cat');
  fireEvent.change(camp, { target: { value: '' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).toHaveBeenLastCalledWith('O', 'correu', '');
});

test('T43 · «Mostrar el correu a la fitxa pública» només s’obri amb un correu desat', () => {
  pinta(forn, { contacte: CONTACTE });
  expect(within(seccio('Correu a la fitxa pública')).queryByRole('checkbox')).toBeNull();
  expect(within(seccio('Correu a la fitxa pública')).getByText('Primer desa un correu de l’organització.')).toBeTruthy();
  cleanup();
  pinta(forn, { contacte: { ...CONTACTE, correu: 'forn@exemple.cat' } });
  const casella = within(seccio('Correu a la fitxa pública')).getByRole('checkbox', { name: 'Mostrar el correu a la fitxa pública' });
  expect(casella.checked).toBe(false);
});

test('T43 · un membre no veu MAI el correu, encara que el context el tinguera', () => {
  pinta({ ...forn, dades: { ...forn.dades, role: 'member' } }, { contacte: { ...CONTACTE, correu: 'secret@forn.cat' } });
  expect(screen.queryByText('secret@forn.cat')).toBeNull();
  expect(screen.queryByDisplayValue('secret@forn.cat')).toBeNull();
  expect(within(seccio('Correu de l’organització')).getByText('Només qui administra aquesta organització ho pot canviar.')).toBeTruthy();
});

test('T43 · sense servidor que el dese, es diu amb el motiu honest', () => {
  pinta(forn, { contacte: { estat: 'no-disponible', motiu: 'El servidor d’este poble encara no desa el correu de les organitzacions.' } });
  expect(within(seccio('Correu de l’organització')).getByText('El servidor d’este poble encara no desa el correu de les organitzacions.')).toBeTruthy();
  expect(within(seccio('Correu de l’organització')).queryByRole('textbox')).toBeNull();
});

test('sense identitat no pinta res', () => {
  const { container } = render(<DetallCompte identitat={null} />);
  expect(container.innerHTML).toBe('');
});
