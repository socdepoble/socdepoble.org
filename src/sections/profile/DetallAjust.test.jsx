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
