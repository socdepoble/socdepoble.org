/* T47 (correcció de la revisió C01, 260928) · «Confirmar eixida» no esborra
 * en silenci el que el servidor encara no té: primer ho diu, i només «Eixir
 * igualment» tanca la sessió (i, amb ella, oblida els esborranys d'este
 * dispositiu). */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), logout: vi.fn(), preparaEixida: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ logout: m.logout, preparaEixida: m.preparaEixida }),
}));
/* Onada 11 (261010) · El segon factor té proves pròpies (admin/SegonFactor.test.jsx). */
vi.mock('../admin/SegonFactor.jsx', () => ({ SegonFactor: () => <p>el segon factor, en línia</p> }));
import DetallAjust, { AVIS_SENSE_COLUMNA, pagina } from './DetallAjust.jsx';
import { NotificationProvider } from '../../components/universal/NotificationContext.jsx';
import { desaLlicenciaPerDefecte, llegixLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';

const EIXIDA = Object.freeze({ id: 'sessio', lloc: 'compte', titol: 'Tancar sessió', tipus: 'accio', accio: 'logout', obert: true });
const jo = Object.freeze({ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} });

beforeEach(() => {
  m.navigate.mockReset();
  m.logout.mockReset().mockResolvedValue(undefined);
  m.preparaEixida.mockReset().mockResolvedValue([]);
  vi.spyOn(pagina, 'recarrega').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const confirma = () => act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirmar eixida' })); });

test('C01 · sense res pendent, «Confirmar eixida» ix de seguida', async () => {
  render(<DetallAjust ajust={EIXIDA} identitat={jo} />);
  await confirma();
  expect(m.preparaEixida).toHaveBeenCalledTimes(1);
  expect(m.logout).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  expect(pagina.recarrega).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('status')).toBeNull();
});

test('C01 · amb canvis que el servidor no té, ho diu abans i només «Eixir igualment» tanca la sessió', async () => {
  m.preparaEixida.mockResolvedValue([
    { entitat: 'perfil', id: 'jo', camps: ['lead'] },
    { entitat: 'nota', id: 'n', camps: ['title', 'icon'] },
  ]);
  render(<DetallAjust ajust={EIXIDA} identitat={jo} />);
  await confirma();
  expect(m.logout).not.toHaveBeenCalled();
  const avis = screen.getByRole('status');
  expect(avis.textContent).toContain('Encara hi ha canvis sense desar');
  expect(avis.textContent).toContain('Tens 3 canvis que el servidor encara no té (a la fitxa: l’entradilla; a Notes: 1 nota). Si ixes ara, s’esborraran d’este dispositiu.');
  // El focus va al botó que no esborra res.
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'No eixir encara' }));
  expect(screen.getByRole('button', { name: 'Confirmar eixida' }).disabled).toBe(true);

  // «No eixir encara»: ni es tanca ni s'esborra res.
  fireEvent.click(screen.getByRole('button', { name: 'No eixir encara' }));
  expect(screen.queryByRole('status')).toBeNull();
  expect(m.logout).not.toHaveBeenCalled();
  expect(pagina.recarrega).not.toHaveBeenCalled();

  // Una altra vegada, i ara «Eixir igualment».
  await confirma();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Eixir igualment' })); });
  expect(m.logout).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  expect(pagina.recarrega).toHaveBeenCalledTimes(1);
});

test('C01 · si tancar la sessió falla, es diu en línia i no es recarrega', async () => {
  m.logout.mockRejectedValue(new Error('Sense xarxa'));
  render(<DetallAjust ajust={EIXIDA} identitat={jo} />);
  await confirma();
  expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut tancar la sessió.');
  expect(pagina.recarrega).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Confirmar eixida' }).disabled).toBe(false);
});

/* ── Onada 11 (261010; prompt 261010_1730, tasca 2) · el segon factor i el Tauler del superadmin ── */

const SEGON_FACTOR = Object.freeze({ id: 'segon-factor', lloc: 'compte', titol: 'Segon factor', tipus: 'accio', accio: 'segon-factor', obert: true });
const PANELL = Object.freeze({ id: 'panell-superadmin', lloc: 'compte', titol: 'Panell de superadministració', tipus: 'accio', accio: 'obrir-admin', obert: true });

test('Onada 11 · l’acció «segon-factor» pinta el segon factor en línia, i «obrir-admin» un botó primari amb el títol de l’ajust que porta a /admin', () => {
  render(<DetallAjust ajust={SEGON_FACTOR} identitat={jo} />);
  expect(screen.getByText('el segon factor, en línia')).toBeTruthy();
  expect(screen.queryByText(/Acció pendent/)).toBeNull();
  cleanup();
  render(<DetallAjust ajust={PANELL} identitat={jo} />);
  const boto = screen.getByRole('button', { name: 'Panell de superadministració' });
  expect(boto.className).toBe('sdp-boto sdp-boto--primari');
  expect(boto.disabled).toBe(false);
  fireEvent.click(boto);
  expect(m.navigate).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/admin');
});

/* ── Ordre del Mestre (261008, grup C) · el poble (selector) i els membres ── */

const forn = Object.freeze({ id: 'O', mena: 'empresa', nom: 'Forn', dades: { id: 'O', name: 'Forn', role: 'admin' } });
const POBLE = Object.freeze({
  id: 'poble', lloc: 'compte', titol: 'Poble', camp: 'town_name', tipus: 'selector', valor: 'Sella', obert: true,
  opcions: [{ valor: '', etiqueta: 'Tria un poble…' }, { valor: 'Benilloba', etiqueta: 'Benilloba' }, { valor: 'Sella', etiqueta: 'Sella' }],
});

test('grup C · un ajust «selector» pinta Camp i Selector de Pedra Seca i desa el valor triat', async () => {
  const guardarAjust = vi.fn(async () => undefined);
  render(<DetallAjust ajust={{ ...POBLE, ajuda: 'El poble de l’organització.' }} identitat={forn} guardarAjust={guardarAjust} />);
  const selector = screen.getByLabelText('Nou valor per a poble:');
  expect(selector.tagName).toBe('SELECT');
  expect(selector.className).toContain('sdp-control--selector');
  expect(selector.value).toBe('Sella');
  expect(selector.getAttribute('aria-describedby')).toBe(screen.getByText('El poble de l’organització.').id);
  fireEvent.change(selector, { target: { value: '' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  expect(guardarAjust).toHaveBeenCalledWith('O', 'poble', '');
  expect(screen.getByRole('status').textContent).toBe('Desat correctament.');
});

/* Correcció 261008 · Integració: com el Perfil de veres (PerfilContext.aplicaColumnes),
   el pare torna a pintar l'ajust amb el valor que s'acaba de desar. Eixe eco
   del nostre desat sincronitza el control, però no esborra el «Desat
   correctament.» (abans durava, com a molt, un fotograma). */
function ArnesPoble({ desa = async () => {} }) {
  const [identitat, setIdentitat] = React.useState({ ...forn, dades: { ...forn.dades, town_name: 'Sella' } });
  const guardarAjust = async (_id, _ajust, valor) => {
    await desa(valor);
    setIdentitat((previ) => ({ ...previ, dades: { ...previ.dades, town_name: valor } }));
  };
  return (
    <>
      <DetallAjust ajust={{ ...POBLE, opcions: [...POBLE.opcions, { valor: 'Alcoi', etiqueta: 'Alcoi' }], valor: identitat.dades.town_name }}
        identitat={identitat} guardarAjust={guardarAjust} />
      <button type="button" onClick={() => setIdentitat((previ) => ({ ...previ, dades: { ...previ.dades, town_name: 'Alcoi' } }))}>Canvi de fora</button>
    </>
  );
}

test('grup C · desar el poble: el valor nou torna del Perfil i «Desat correctament.» es queda visible', async () => {
  render(<ArnesPoble />);
  const selector = screen.getByLabelText('Nou valor per a poble:');
  fireEvent.change(selector, { target: { value: 'Benilloba' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  // El pare ja porta el valor desat, i el missatge no l'ha esborrat l'eco.
  expect(screen.getByLabelText('Nou valor per a poble:').value).toBe('Benilloba');
  expect(screen.getByRole('status').textContent).toBe('Desat correctament.');
  await act(async () => { await new Promise((r) => { setTimeout(r, 50); }); });
  expect(screen.getByRole('status').textContent).toBe('Desat correctament.');
});

test('grup C · un canvi de valor que no ve del nostre desat continua sincronitzant el control i esborrant l’avís', async () => {
  render(<ArnesPoble desa={async () => { throw new Error('Sense xarxa'); }} />);
  fireEvent.change(screen.getByLabelText('Nou valor per a poble:'), { target: { value: 'Benilloba' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Canvi de fora' })); });
  expect(screen.getByLabelText('Nou valor per a poble:').value).toBe('Alcoi');
  expect(screen.queryByRole('alert')).toBeNull();
});

test('grup C · canviar d’identitat després de desar no hi deixa el «Desat correctament.» de l’anterior', async () => {
  const guardarAjust = vi.fn(async () => undefined);
  const { rerender } = render(<DetallAjust ajust={POBLE} identitat={forn} guardarAjust={guardarAjust} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  expect(screen.getByRole('status').textContent).toBe('Desat correctament.');
  rerender(<DetallAjust ajust={{ ...POBLE, valor: 'Benilloba' }} identitat={{ ...forn, id: 'G', nom: 'Colla' }} guardarAjust={guardarAjust} />);
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByLabelText('Nou valor per a poble:').value).toBe('Benilloba');
});

/* ── Pla 261018_1605 (Tasca 2, D5; ordre del Mestre, 18-10-2026) · els pobles de la persona ── */

const CATALEG = Object.freeze([
  { valor: '', etiqueta: 'Tria un poble…' },
  { valor: 'Benilloba', etiqueta: 'Benilloba' },
  { valor: 'La Torre de les Maçanes', etiqueta: 'La Torre de les Maçanes' },
  { valor: 'Xixona', etiqueta: 'Xixona' },
]);
const POBLES = Object.freeze({
  id: 'poble', lloc: 'compte', titol: 'Poble', camp: 'town_name', tipus: 'selector', multiple: true,
  valor: 'La Torre de les Maçanes', obert: true, opcions: CATALEG, ajuda: 'Només els pobles del Mas.',
});
const pobles = () => within(screen.getByRole('list', { name: 'Els teus pobles' })).getAllByRole('listitem')
  .map((li) => li.firstChild.textContent);
const afegix = (nom) => {
  fireEvent.change(screen.getByLabelText('Afegir un poble:'), { target: { value: nom } });
  fireEvent.click(screen.getByRole('button', { name: 'Afegir poble' }));
};

test('261018 · els pobles de la persona: n’afig un del catàleg, el desa com «A · B» i el primer és el principal', async () => {
  const guardarAjust = vi.fn(async () => undefined);
  render(<DetallAjust ajust={POBLES} identitat={jo} guardarAjust={guardarAjust} />);
  expect(pobles()).toEqual(['La Torre de les Maçanes']);
  expect(within(screen.getByRole('list', { name: 'Els teus pobles' })).getByText('Principal')).toBeTruthy();
  // Amb un sol poble, no es pot llevar: una persona no es queda sense poble.
  expect(screen.queryByRole('button', { name: /^Llevar/ })).toBeNull();
  const selector = screen.getByLabelText('Afegir un poble:');
  expect(selector.className).toContain('sdp-control--selector');
  expect(selector.getAttribute('aria-describedby')).toBe(screen.getByText('Només els pobles del Mas.').id);
  // «Afegir poble» només amb un poble triat.
  expect(screen.getByRole('button', { name: 'Afegir poble' }).disabled).toBe(true);
  afegix('Xixona');
  expect(pobles()).toEqual(['La Torre de les Maçanes', 'Xixona']);
  expect(guardarAjust).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  expect(guardarAjust).toHaveBeenCalledWith('jo', 'poble', 'La Torre de les Maçanes · Xixona');
  expect(screen.getByRole('status').textContent).toBe('Desat correctament.');
});

test('261018 · només del catàleg i sense repetits: el selector no porta els triats ni cap opció de més d’un poble', () => {
  const ajust = { ...POBLES, valor: 'La Torre de les Maçanes · Xixona', opcions: [...CATALEG, { valor: 'La Torre de les Maçanes · Xixona', etiqueta: 'La Torre de les Maçanes · Xixona' }] };
  const { rerender } = render(<DetallAjust ajust={ajust} identitat={jo} guardarAjust={vi.fn()} />);
  expect(pobles()).toEqual(['La Torre de les Maçanes', 'Xixona']);
  const selector = screen.getByLabelText('Afegir un poble:');
  expect([...selector.options].map((o) => o.value)).toEqual(['', 'Benilloba']);
  // Cap camp de text lliure: només el selector del catàleg.
  expect(screen.queryByRole('textbox')).toBeNull();
  /* Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 2 (correcció de
     la revisió) · Un <select> no pren un valor que no té: la guarda d'«Afegir
     poble» es prova amb un poble triat que, després, ix del catàleg. */
  fireEvent.change(selector, { target: { value: 'Poble inventat' } });
  expect(selector.value).toBe('');
  expect(screen.getByRole('button', { name: 'Afegir poble' }).disabled).toBe(true);
  fireEvent.change(selector, { target: { value: 'Benilloba' } });
  rerender(<DetallAjust ajust={{ ...ajust, opcions: CATALEG.filter((o) => o.valor !== 'Benilloba') }} identitat={jo} guardarAjust={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Afegir poble' }).disabled).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Afegir poble' }));
  expect(pobles()).toEqual(['La Torre de les Maçanes', 'Xixona']);
  rerender(<DetallAjust ajust={ajust} identitat={jo} guardarAjust={vi.fn()} />);
  afegix('Benilloba');
  expect(pobles()).toEqual(['La Torre de les Maçanes', 'Xixona', 'Benilloba']);
  // Sense cap més al catàleg, el selector ho diu i no es pot afegir res.
  expect([...screen.getByLabelText('Afegir un poble:').options].map((o) => o.textContent)).toEqual(['No en queda cap més al catàleg']);
  expect(screen.getByLabelText('Afegir un poble:').disabled).toBe(true);
});

test('261018 · llevar un poble: el «Llevar» de cada un, que desapareix quan només en queda un', async () => {
  const guardarAjust = vi.fn(async () => undefined);
  render(<DetallAjust ajust={{ ...POBLES, valor: 'La Torre de les Maçanes · Xixona' }} identitat={jo} guardarAjust={guardarAjust} />);
  const lleva = screen.getByRole('button', { name: 'Llevar La Torre de les Maçanes' });
  expect(lleva.className).toContain('sdp-boto');
  expect(screen.getByRole('button', { name: 'Llevar Xixona' })).toBeTruthy();
  fireEvent.click(lleva);
  // El que queda passa a ser el principal, i ja no es pot llevar.
  expect(pobles()).toEqual(['Xixona']);
  expect(screen.queryByRole('button', { name: /^Llevar/ })).toBeNull();
  // El llevat torna a ser del catàleg disponible.
  expect([...screen.getByLabelText('Afegir un poble:').options].map((o) => o.value)).toEqual(['', 'Benilloba', 'La Torre de les Maçanes']);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  expect(guardarAjust).toHaveBeenCalledWith('jo', 'poble', 'Xixona');
});

/* Pla 261018_1605 (Tasca 2, D5; correcció de la revisió) · Els camins que
   faltaven: el poble triat i no afegit, «Fer principal», un poble que no és
   del catàleg, el catàleg que encara no s'ha llegit, i el focus. */
test('261018 · un poble triat al Selector i no afegit entra en «Guardar», i el Selector torna a buit', async () => {
  const guardarAjust = vi.fn(async () => undefined);
  render(<DetallAjust ajust={POBLES} identitat={jo} guardarAjust={guardarAjust} />);
  fireEvent.change(screen.getByLabelText('Afegir un poble:'), { target: { value: 'Xixona' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  expect(guardarAjust).toHaveBeenCalledWith('jo', 'poble', 'La Torre de les Maçanes · Xixona');
  expect(pobles()).toEqual(['La Torre de les Maçanes', 'Xixona']);
  expect(screen.getByLabelText('Afegir un poble:').value).toBe('');
  expect(screen.getByRole('status').textContent).toBe('Desat correctament.');
});

test('261018 · «Fer principal»: el poble passa primer, el desat diu «B · A» i el focus va al seu «Llevar»', async () => {
  const guardarAjust = vi.fn(async () => undefined);
  render(<DetallAjust ajust={{ ...POBLES, valor: 'La Torre de les Maçanes · Xixona' }} identitat={jo} guardarAjust={guardarAjust} />);
  const llista = screen.getByRole('list', { name: 'Els teus pobles' });
  expect(within(llista).getAllByRole('listitem')[0].textContent).toContain('Principal');
  expect(screen.queryByRole('button', { name: 'Fer principal La Torre de les Maçanes' })).toBeNull();
  const boto = screen.getByRole('button', { name: 'Fer principal Xixona' });
  boto.focus();
  fireEvent.click(boto);
  expect(pobles()).toEqual(['Xixona', 'La Torre de les Maçanes']);
  expect(within(within(llista).getAllByRole('listitem')[0]).getByText('Principal')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Fer principal La Torre de les Maçanes' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Fer principal Xixona' })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Llevar Xixona' }));
  expect(screen.getByText('Xixona és ara el poble principal: prem «Guardar» per a desar-ho.').getAttribute('aria-live')).toBe('polite');
  expect(guardarAjust).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  expect(guardarAjust).toHaveBeenCalledWith('jo', 'poble', 'Xixona · La Torre de les Maçanes');
});

test('261018 · el focus no es perd: «Llevar» va al del costat (o a la llista) i «Afegir poble», al Selector', () => {
  render(<DetallAjust ajust={{ ...POBLES, valor: 'La Torre de les Maçanes · Xixona · Benilloba' }} identitat={jo} guardarAjust={vi.fn()} />);
  const llevaXixona = screen.getByRole('button', { name: 'Llevar Xixona' });
  llevaXixona.focus();
  fireEvent.click(llevaXixona);
  expect(pobles()).toEqual(['La Torre de les Maçanes', 'Benilloba']);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Llevar Benilloba' }));
  expect(screen.getByText('S’ha llevat Xixona: prem «Guardar» per a desar-ho.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Llevar Benilloba' }));
  // Només en queda un: cap «Llevar», el focus a la llista.
  expect(document.activeElement).toBe(screen.getByRole('list', { name: 'Els teus pobles' }));
  afegix('Xixona');
  expect(document.activeElement).toBe(screen.getByLabelText('Afegir un poble:'));
  expect(screen.getByText('S’ha afegit Xixona: prem «Guardar» per a desar-ho.')).toBeTruthy();
});

test('261018 · un poble que no és del catàleg (d’abans): es veu, no es pot llevar si és l’únic i, llevat, no es pot tornar a afegir', () => {
  render(<DetallAjust ajust={{ ...POBLES, valor: 'Poble antic' }} identitat={jo} guardarAjust={vi.fn()} />);
  expect(pobles()).toEqual(['Poble antic']);
  expect(screen.queryByRole('button', { name: /^Llevar/ })).toBeNull();
  afegix('Xixona');
  fireEvent.click(screen.getByRole('button', { name: 'Llevar Poble antic' }));
  expect(pobles()).toEqual(['Xixona']);
  expect([...screen.getByLabelText('Afegir un poble:').options].map((o) => o.value)).toEqual(['', 'Benilloba', 'La Torre de les Maçanes']);
});

test('261018 · amb el catàleg sense llegir, el Selector ho diu (no que no en quede cap) i no es pot afegir res', () => {
  render(<DetallAjust ajust={{ ...POBLES, opcions: [{ valor: '', etiqueta: 'Tria un poble…' }] }} identitat={jo} guardarAjust={vi.fn()} />);
  const selector = screen.getByLabelText('Afegir un poble:');
  expect([...selector.options].map((o) => o.textContent)).toEqual(['Encara no s’ha pogut llegir el catàleg de pobles']);
  expect(selector.disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Afegir poble' }).disabled).toBe(true);
});

test('261018 · tancat (p. ex. amb la fila de reserva), els pobles es veuen i el motiu, sense controls', () => {
  render(<DetallAjust ajust={{ ...POBLES, valor: 'La Torre de les Maçanes · Xixona', obert: false, motiu: 'No s’ha pogut llegir el compte del servidor.' }} identitat={jo} />);
  expect(screen.getByText('La Torre de les Maçanes · Xixona')).toBeTruthy();
  expect(screen.getByText('No s’ha pogut llegir el compte del servidor.')).toBeTruthy();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});

test('grup C · un «selector» tancat mostra el valor i el motiu, sense control', () => {
  render(<DetallAjust ajust={{ ...POBLE, obert: false, motiu: 'Només qui administra aquesta organització ho pot canviar.' }} identitat={forn} />);
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.getByText('Sella')).toBeTruthy();
  expect(screen.getByText('Només qui administra aquesta organització ho pot canviar.')).toBeTruthy();
});

test.each([
  ['PGRST204 (cos del PATCH)', 'Supabase 400: {"code":"PGRST204","message":"Could not find the \'town_name\' column of \'organizations\' in the schema cache"}'],
  ['42703 (columna del select)', 'Supabase 400: {"code":"42703","message":"column organizations.town_name does not exist"}'],
])('grup C · una columna absent (%s) es diu en valencià, no amb el text cru', async (_, cru) => {
  const guardarAjust = vi.fn(async () => { throw new Error(cru); });
  render(<DetallAjust ajust={POBLE} identitat={forn} guardarAjust={guardarAjust} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  const avis = screen.getByRole('alert').textContent;
  expect(avis).toBe(`${AVIS_SENSE_COLUMNA} («town_name»): no s’ha desat. Cal aplicar al servidor la migració pendent.`);
  expect(avis).not.toMatch(/Could not find|does not exist/);
});

test('grup C · la resta d’errors de desat continuen amb el missatge de sempre', async () => {
  const guardarAjust = vi.fn(async () => { throw new Error('Sense xarxa'); });
  render(<DetallAjust ajust={POBLE} identitat={forn} guardarAjust={guardarAjust} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar' })); });
  expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
});

test('grup C · l’avís de columna absent comença igual que el de la fitxa (PerfilEditor)', async () => {
  const { AVIS_SENSE_COLUMNA: deLaFitxa } = await import('./PerfilEditor.jsx');
  expect(AVIS_SENSE_COLUMNA).toBe(deLaFitxa);
}, 60000);

const MEMBRES = Object.freeze({ id: 'membres', lloc: 'compte', titol: 'Membres', tipus: 'accio', accio: 'membres', pendent: false, obert: true });
const EIXIR = Object.freeze({ id: 'eixir', lloc: 'compte', titol: 'Eixir de l’organització', tipus: 'accio', accio: 'eixir', pendent: false, obert: true });
const accionsMembres = (extra = {}) => ({
  usuariId: 'U',
  llistaMembres: vi.fn(async () => [{ tipus: 'persona', id: 'U', nom: 'Jo', avatar: '', rol: 'admin', desDe: null }]),
  desaMembre: vi.fn(), llevaMembre: vi.fn(async () => ({ llevat: true })), cercaCandidats: vi.fn(async () => []),
  ...extra,
});

test('grup C · «Membres» pinta la gestió amb les accions del Perfil; sense, és pendent i honest', async () => {
  const membres = accionsMembres();
  render(<DetallAjust ajust={MEMBRES} identitat={forn} membres={membres} />);
  expect(await screen.findByRole('region', { name: 'Membres de Forn' })).toBeTruthy();
  expect(membres.llistaMembres).toHaveBeenCalledWith('O', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  cleanup();
  render(<DetallAjust ajust={MEMBRES} identitat={forn} />);
  expect(screen.getByRole('button', { name: 'Membres' }).disabled).toBe(true);
  expect(screen.getByText('Aquesta acció encara no està implementada en aquesta versió.')).toBeTruthy();
});

test('grup C · «Eixir» demana confirmació; «Cancel·lar» no fa res i «Eixir» es lleva a si mateixa', async () => {
  const membres = accionsMembres();
  render(<NotificationProvider><DetallAjust ajust={EIXIR} identitat={forn} membres={membres} /></NotificationProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir de l’organització' }));
  let dialeg = screen.getByRole('dialog', { name: 'Eixir de Forn?' });
  // Llei de la Por Orgànica: el focus inicial va a «Cancel·lar».
  expect(within(dialeg).getByRole('button', { name: 'Cancel·lar' }).hasAttribute('data-sdp-focus-inicial')).toBe(true);
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
  expect(membres.llevaMembre).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Eixir de l’organització' }));
  dialeg = screen.getByRole('dialog', { name: 'Eixir de Forn?' });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Eixir' })); });
  expect(membres.llevaMembre).toHaveBeenCalledTimes(1);
  expect(membres.llevaMembre).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'U' });
  /* Correcció 261008 · La confirmació és l'avís efímer de l'App (NotificationProvider),
     no un text d'esta pàgina: en el flux real esta pàgina ja no hi és (vegeu la següent). */
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByRole('alert').textContent).toBe('Ja no formes part de Forn.');
});

/* Correcció 261008 · Integració: com el Perfil de veres (PerfilContext.llevaMembre
   lleva l'organització abans de tornar), el pare deixa de pintar «El compte»
   de Forn. La confirmació ha de sobreviure a la pàgina que l'ha demanada. */
function ArnesEixir({ membres }) {
  const [ambForn, setAmbForn] = React.useState(true);
  const accions = {
    ...membres,
    llevaMembre: async (...args) => {
      const resultat = await membres.llevaMembre(...args);
      setAmbForn(false);
      return resultat;
    },
  };
  return ambForn ? <DetallAjust ajust={EIXIR} identitat={forn} membres={accions} /> : <p>El perfil, sense Forn.</p>;
}

test('grup C · eixir bé: «El compte» de Forn desapareix i la confirmació es veu igualment', async () => {
  const membres = accionsMembres();
  render(<NotificationProvider><ArnesEixir membres={membres} /></NotificationProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir de l’organització' }));
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Eixir de Forn?' })).getByRole('button', { name: 'Eixir' })); });
  expect(membres.llevaMembre).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'U' });
  expect(screen.queryByRole('button', { name: 'Eixir de l’organització' })).toBeNull();
  expect(screen.getByText('El perfil, sense Forn.')).toBeTruthy();
  expect(screen.getByRole('alert').textContent).toBe('Ja no formes part de Forn.');
});

test('grup C · si el servidor no la deixa eixir, el motiu es diu en línia; un doble clic només envia una eixida', async () => {
  let rebutja;
  const membres = accionsMembres({ llevaMembre: vi.fn(() => new Promise((_, r) => { rebutja = r; })) });
  render(<DetallAjust ajust={EIXIR} identitat={forn} membres={membres} />);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir de l’organització' }));
  const dialeg = screen.getByRole('dialog', { name: 'Eixir de Forn?' });
  const boto = within(dialeg).getByRole('button', { name: 'Eixir' });
  act(() => { fireEvent.click(boto); fireEvent.click(boto); });
  expect(membres.llevaMembre).toHaveBeenCalledTimes(1);
  await act(async () => { rebutja(Object.assign(new Error('La propietària no es canvia ni es lleva.'), { code: 'SDP-ORGMEM-005' })); });
  expect(screen.getByRole('alert').textContent).toBe('La propietària no es canvia ni es lleva.');
  expect(screen.getByRole('button', { name: 'Eixir de l’organització' }).disabled).toBe(false);
});

/* Correcció 261008 · Amb el <dialog> modal obert, la resta de la pàgina és
   inert i un avís que hi naix no s'anuncia: primer es tanca la confirmació,
   després naix l'error (l'ordre real del DOM, amb MutationObserver). */
test('grup C · si «Eixir» falla, l’error naix quan la confirmació ja s’ha tancat', async () => {
  const membres = accionsMembres({ llevaMembre: vi.fn(async () => { throw new Error('Sense xarxa'); }) });
  render(<DetallAjust ajust={EIXIR} identitat={forn} membres={membres} />);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir de l’organització' }));
  const dialeg = screen.getByRole('dialog', { name: 'Eixir de Forn?' });
  const ordre = [];
  const anota = (registres) => {
    for (const r of registres) {
      if (r.type === 'attributes' && r.target === dialeg && r.oldValue !== null) ordre.push('tancat');
      if (r.type === 'childList') {
        for (const node of r.addedNodes) if (node.nodeType === 1 && node.matches('[role="alert"]')) ordre.push('avis');
      }
    }
  };
  const observador = new MutationObserver(anota);
  observador.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'], attributeOldValue: true });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Eixir' })); });
  anota(observador.takeRecords());
  observador.disconnect();
  expect(ordre).toEqual(['tancat', 'avis']);
  expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
});

test('grup C · sense persona de sessió, «Eixir» no crida el port', async () => {
  const membres = accionsMembres({ usuariId: null });
  render(<DetallAjust ajust={EIXIR} identitat={forn} membres={membres} />);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir de l’organització' }));
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Eixir de Forn?' })).getByRole('button', { name: 'Eixir' })); });
  expect(membres.llevaMembre).not.toHaveBeenCalled();
  expect(screen.getByRole('alert').textContent).toBe('Cal iniciar sessió.');
});

/* ── Pla 261016 (Bloc 3.1; ordre del Mestre) · els drets de sèrie de les notes, a «El compte» ──
   La píndola dels drets de l'editor (BotoDretsAutor) obri CopyrightPage dins
   del bloc, amb l'àmbit 'compte'; desar passa per guardarAjust com qualsevol
   altre ajust, i en tancar el focus torna a la píndola. */

const DRETS = Object.freeze({
  id: 'drets-notes', lloc: 'compte', titol: 'Drets de sèrie de les meues notes', camp: 'copyright', tipus: 'llicencia', valor: '', obert: true,
});
const pep = Object.freeze({ id: 'jo', mena: 'persona', nom: 'Pep', dades: { id: 'uuid-pep', full_name: 'Pep del Mas' } });
const ELEGIR = "Elegir drets d'autor";
const vistaDrets = () => screen.queryByRole('region', { name: 'Drets d’autor' });
afterEach(() => { for (const id of ['uuid-pep', 'jo', 'O']) desaLlicenciaPerDefecte(id, ''); });

test('261016 · sense drets desats, la píndola diu «Elegir drets d’autor» i obri CopyrightPage dins del bloc, amb els textos del compte', () => {
  render(<DetallAjust ajust={DRETS} identitat={pep} guardarAjust={vi.fn()} />);
  const pindola = screen.getByRole('button', { name: ELEGIR });
  expect(pindola.hasAttribute('data-sdp-drets')).toBe(true);
  expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull();
  fireEvent.click(pindola);
  const vista = vistaDrets();
  expect(document.activeElement).toBe(within(vista).getByRole('heading', { level: 2, name: 'Drets d’autor' }));
  expect(within(vista).getByRole('button', { name: 'Tornar al compte' })).toBeTruthy();
  expect(vista.querySelector('.sdp-drets__intro').textContent)
    .toBe('Tria amb quins drets naixen les teues notes noves. Res no canvia fins que prems «Desar autoria».');
  expect(within(vista).getByRole('group', { name: 'Tria els drets de sèrie de les teues notes' })).toBeTruthy();
  expect(within(vista).getByRole('status').textContent).toContain('Les teues notes noves naixen amb estos drets');
  // Sense valor desat, la CC de sèrie preseleccionada; «Copyright (C)» porta el nom de la fitxa.
  expect(within(vista).getByRole('radio', { name: /^CC BY-NC-SA 4\.0/ }).checked).toBe(true);
  fireEvent.click(within(vista).getByRole('radio', { name: /Copyright \(C\)/ }));
  expect(within(vista).getByRole('textbox').value).toBe('© Pep del Mas');
  // Escape torna sense desar, i el focus a la píndola.
  fireEvent.keyDown(vista, { key: 'Escape' });
  expect(vistaDrets()).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: ELEGIR }));
});

test('261016 · «Desar autoria» tanca la vista, desa per guardarAjust i ho diu davall de la píndola, que recupera el focus', async () => {
  const guardarAjust = vi.fn(async () => undefined);
  render(<DetallAjust ajust={{ ...DRETS, valor: 'CC BY 4.0' }} identitat={pep} guardarAjust={guardarAjust} />);
  fireEvent.click(screen.getByRole('button', { name: "Drets d'autor: CC BY 4.0" }));
  const vista = vistaDrets();
  expect(vista.querySelector('.sdp-drets__intro').textContent).toContain('Ara són «CC BY 4.0».');
  expect(within(vista).getByRole('radio', { name: /^CC BY 4\.0/ }).checked).toBe(true);
  fireEvent.click(within(vista).getByRole('radio', { name: /CC BY-SA 4\.0/ }));
  await act(async () => { fireEvent.click(within(vista).getByRole('button', { name: 'Desar autoria' })); });
  expect(guardarAjust).toHaveBeenCalledTimes(1);
  expect(guardarAjust).toHaveBeenCalledWith('jo', 'drets-notes', 'CC BY-SA 4.0');
  expect(vistaDrets()).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('Desat correctament.');
  expect(document.activeElement).toBe(screen.getByRole('button', { name: "Drets d'autor: CC BY 4.0" }));
});

test('261016 · si el servidor no l’accepta, l’error es diu en línia i la tria es recupera en tornar-hi; «Cancel·lar» hi renuncia', async () => {
  const guardarAjust = vi.fn(async () => { throw new Error('Sense xarxa'); });
  render(<DetallAjust ajust={{ ...DRETS, valor: 'CC BY 4.0' }} identitat={pep} guardarAjust={guardarAjust} />);
  const pindola = () => screen.getByRole('button', { name: "Drets d'autor: CC BY 4.0" });
  fireEvent.click(pindola());
  fireEvent.click(screen.getByRole('radio', { name: /CC BY-SA 4\.0/ }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desar autoria' })); });
  expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
  fireEvent.click(pindola());
  expect(screen.getByRole('radio', { name: /CC BY-SA 4\.0/ }).checked).toBe(true);
  expect(screen.getByText('Continues on ho havies deixat')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·lar' }));
  fireEvent.click(pindola());
  expect(screen.getByRole('radio', { name: /^CC BY 4\.0/ }).checked).toBe(true);
  expect(screen.queryByText('Continues on ho havies deixat')).toBeNull();
});

test('261016 · tancat (p. ex. amb una baixa en curs), mostra els drets desats i el motiu, sense píndola', () => {
  render(<DetallAjust ajust={{ ...DRETS, valor: 'CC0 1.0', obert: false, motiu: 'Tens una baixa en curs: el perfil està congelat.' }} identitat={pep} />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByText('CC0 1.0')).toBeTruthy();
  expect(screen.getByText('Tens una baixa en curs: el perfil està congelat.')).toBeTruthy();
});

test('261016 · els drets desats al servidor passen a la preferència d’este dispositiu (per l’id de la fila); un valor buit no l’esborra', () => {
  render(<DetallAjust ajust={{ ...DRETS, valor: 'CC BY 4.0' }} identitat={pep} />);
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY 4.0');
  expect(llegixLlicenciaPerDefecte('jo')).toBeNull();
  cleanup();
  render(<DetallAjust ajust={DRETS} identitat={pep} />);
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY 4.0');
  cleanup();
  // Una organització no en porta (els seus drets es trien a la fitxa), encara que algú li passara l'ajust.
  render(<DetallAjust ajust={{ ...DRETS, valor: 'CC0 1.0' }} identitat={forn} />);
  expect(llegixLlicenciaPerDefecte('O')).toBeNull();
});
