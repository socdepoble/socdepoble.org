/* IDEA-61 (T0, prompt 261102_1532) · El Bloc de Notes i l'àmbit de publicació:
   el grup «Àmbit» de la botonera (dins del Bloc o amb fitxa; sense, el DOM de
   sempre), el diàleg «On es publica?» que desa la fitxa pel canal de la
   classificació (setLocalNoteField, o el canal de la nota preparada), la
   guarda de PUBLICAR amb una fitxa incompleta (el motiu en línia al selector)
   i l'entrada des d'una secció (el canal de l'àmbit: la nota rep la fitxa i el
   diàleg s'obri una vegada). Els mocks són els de NotesEditor.test.jsx. */
import { useMemo, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => {
  const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) });
  const TENANT_A = '00000000-0000-4000-8000-0000000000a1';
  return {
    TENANT_A, showToast: vi.fn(), noteFolders: [], adapter: null, config: { tenantId: TENANT_A }, notes: [], setLocal: vi.fn(),
    session: {}, NET, desament: vi.fn(() => NET), identitat: { actorId: 'user' }, core: { agents: [] }, publish: vi.fn(), compartir: vi.fn()
  };
});
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: mocks.noteFolders, t: (_key, fallback) => fallback, config: mocks.config, workspaceKey: mocks.config.tenantId,
    notes: mocks.notes, setLocalNoteField: mocks.setLocal, notesComplete: true,
    mouNota: vi.fn(), esborraNota: vi.fn(), potEsborrar: false, publishNote: mocks.publish, compartirNota: mocks.compartir, scopeKey: undefined
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: (scope, id) => mocks.desament(scope, id)
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
import NotesEditor from './NotesEditor.jsx';
import { SelectorVisibilitat } from '../../components/universal/SelectorVisibilitat.jsx';
import { CanalAmbitContext } from '../../components/universal/ambits/canalAmbit.js';
import { NotaPreparadaContext } from './notaPreparada.js';

beforeEach(() => {
  mocks.adapter = null;
  mocks.session = { currentUser: { id: 'U-1', user_metadata: { name: 'Pepa', town_name: 'La Torre' } } };
  mocks.core = { agents: [] };
  mocks.identitat = { actorId: 'user' };
  mocks.desament.mockReset().mockReturnValue(mocks.NET);
  mocks.setLocal.mockReset();
  mocks.publish.mockReset().mockResolvedValue(true);
  mocks.compartir.mockReset().mockResolvedValue(true);
});
afterEach(cleanup);

const NOTA = Object.freeze({ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [], title: 'Viatge a Alcoi' });
const FITXA_BUIDA = Object.freeze({ ambit: 'vehicle', estat: 'disponible', dades: {} });
const FITXA_PLENA = Object.freeze({
  ambit: 'vehicle', estat: 'disponible',
  dades: { modalitat: 'busque_lloc', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15' }
});
const TITOL = 'On es publica?';
const MISSATGE_INCOMPLETA = 'La fitxa de «Compartir cotxe» no està completa.';
/* El canal estàtic (cap àmbit pendent): només habilita el grup. */
const CANAL_BUIT = Object.freeze({ pendent: null, consumix: () => {} });
const alBloc = (fill, canal = CANAL_BUIT) => <CanalAmbitContext.Provider value={canal}>{fill}</CanalAmbitContext.Provider>;
/* La botonera viu dins de l'adaptador (la pinta el DocumentEditor, ací fals):
   es munta a part i els diàlegs els pinta el NotesEditor. */
function botonera() {
  const { container } = render(mocks.adapter.classificacio);
  return within(container).getAllByRole('button');
}
const dialeg = () => screen.queryByRole('dialog', { name: TITOL });
const escriuAlDialeg = (retol, value) => fireEvent.change(within(dialeg()).getByLabelText(new RegExp(`^${retol}( \\(obligatori\\))?$`)), { target: { value } });

/* El Bloc de veres: el canal es consumix una vegada i deixa de demanar res. */
function BlocAmbAmbit({ pendent, consumit, children }) {
  const [p, setP] = useState(pendent);
  const canal = useMemo(() => ({ pendent: p, consumix: () => { consumit(); setP(null); } }), [p, consumit]);
  return <CanalAmbitContext.Provider value={canal}>{children}</CanalAmbitContext.Provider>;
}

test('sense canal ni fitxa (fora del Bloc), la botonera és la de sempre: quatre botons, cap «Àmbit»', () => {
  render(<NotesEditor activeNote={NOTA} />);
  expect(botonera().map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Emojis XL (—)']);
  expect(mocks.adapter.classificacio.props).not.toHaveProperty('ambit', expect.anything());
});

test('dins del Bloc, «Àmbit (—)» entre Etiquetes i Emojis XL; amb fitxa, la píndola diu l’àmbit i el nom accessible el dona sencer', () => {
  render(alBloc(<NotesEditor activeNote={NOTA} />));
  const botons = botonera();
  expect(botons.map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Àmbit (—)', 'Emojis XL (—)']);
  expect(botons[3].getAttribute('aria-haspopup')).toBe('dialog');
  expect(botons[3].querySelector('svg.lucide-layers')).toBeTruthy();
  expect(botons[3].querySelector('.sp-card-label.sdp-badge-buit')).toBeTruthy();
  cleanup();
  // Amb fitxa, també fora del Bloc: la nota ja és d'un àmbit i es pot vore i canviar.
  render(<NotesEditor activeNote={{ ...NOTA, fitxa: FITXA_PLENA }} />);
  const ambFitxa = botonera();
  expect(ambFitxa.map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Compartir cotxe', 'Emojis XL (—)']);
  expect(ambFitxa[3].getAttribute('aria-label')).toBe('Àmbit: Compartir cotxe');
  expect(ambFitxa[3].getAttribute('title')).toBe('Àmbit: Compartir cotxe');
  expect(ambFitxa[3].querySelector('.sp-card-label').className).toBe('sp-card-label sdp-badge-system');
  expect(ambFitxa[3].querySelector('svg.lucide-layers')).toBeTruthy();
});

test('obrir «Àmbit», triar Treball i desar: setLocalNoteField rep la fitxa normalitzada i el diàleg es tanca', () => {
  render(alBloc(<NotesEditor activeNote={NOTA} />));
  expect(dialeg()).toBeNull();
  fireEvent.click(botonera()[3]);
  const obert = dialeg();
  expect(obert).toBeTruthy();
  // La previsualització signa com la barra taronja (la persona), no «Sóc de Poble».
  expect(within(obert).getByRole('heading', { name: 'Viatge a Alcoi' })).toBeTruthy();
  expect(obert.querySelector('.sp-card-author-name').textContent).toBe('Pepa');
  expect(obert.querySelector('.sp-card-author-location').textContent).toBe('La Torre');
  fireEvent.click(within(obert).getByRole('radio', { name: 'Treball' }));
  escriuAlDialeg('Modalitat', 'oferta_feina');
  escriuAlDialeg('Ofici o sector', '  Forner ');
  fireEvent.click(within(obert).getByRole('button', { name: 'Desar l’àmbit' }));
  expect(mocks.setLocal).toHaveBeenCalledTimes(1);
  expect(mocks.setLocal).toHaveBeenCalledWith('p', 'fitxa', { ambit: 'treball', estat: 'disponible', dades: { modalitat: 'oferta_feina', ofici: 'Forner' } });
  expect(dialeg()).toBeNull();
});

test('triar «Mur» en una nota amb fitxa la lleva (fitxa: null): la publicació de sempre, byte a byte', () => {
  render(<NotesEditor activeNote={{ ...NOTA, fitxa: FITXA_PLENA }} />);
  fireEvent.click(botonera()[3]);
  const obert = dialeg();
  fireEvent.click(within(obert).getByRole('radio', { name: 'Mur' }));
  fireEvent.click(within(obert).getByRole('button', { name: 'Desar l’àmbit' }));
  expect(mocks.setLocal).toHaveBeenCalledWith('p', 'fitxa', null);
  expect(dialeg()).toBeNull();
});

test('amb una fitxa incompleta, Desar no escriu res i el diàleg es queda obert amb el motiu; Cancel·lar tanca sense escriure', () => {
  render(alBloc(<NotesEditor activeNote={{ ...NOTA, fitxa: FITXA_BUIDA }} />));
  fireEvent.click(botonera()[3]);
  const obert = dialeg();
  expect(within(obert).getByRole('radio', { name: 'Compartir cotxe' }).checked).toBe(true);
  fireEvent.click(within(obert).getByRole('button', { name: 'Desar l’àmbit' }));
  expect(within(obert).getByRole('alert').textContent).toBe(MISSATGE_INCOMPLETA);
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(dialeg()).toBeTruthy();
  fireEvent.click(within(obert).getByRole('button', { name: 'Cancel·lar' }));
  expect(dialeg()).toBeNull();
  expect(mocks.setLocal).not.toHaveBeenCalled();
});

test('PUBLICAR amb una fitxa incompleta queda bloquejat amb el motiu en línia; amb la fitxa completa publica; «privada» no mira res', async () => {
  const incompleta = { ...NOTA, fitxa: FITXA_BUIDA };
  render(alBloc(<NotesEditor activeNote={incompleta} />));
  await expect(mocks.adapter.visibilitat.onTria(true, incompleta)).rejects.toThrow(MISSATGE_INCOMPLETA);
  expect(mocks.publish).not.toHaveBeenCalled();
  expect(await mocks.adapter.visibilitat.onTria(false, incompleta)).toBe(true);
  // El selector de veres pinta el motiu en línia i es queda obert.
  const onTanca = vi.fn();
  render(<SelectorVisibilitat obert esPublica={false} onTanca={onTanca} onTria={(publica) => mocks.adapter.visibilitat.onTria(publica, incompleta)} />);
  const selector = screen.getByRole('dialog', { name: 'Qui ho pot vore?' });
  act(() => { fireEvent.click(within(selector).getByRole('radio', { name: /Públic/ })); });
  await act(async () => { fireEvent.click(within(selector).getByRole('button', { name: 'Fer-lo públic' })); });
  expect(within(selector).getByRole('alert').textContent).toBe(MISSATGE_INCOMPLETA);
  expect(onTanca).not.toHaveBeenCalled();
  expect(mocks.publish).not.toHaveBeenCalled();
  cleanup();
  const completa = { ...NOTA, fitxa: FITXA_PLENA };
  render(alBloc(<NotesEditor activeNote={completa} />));
  expect(await mocks.adapter.visibilitat.onTria(true, completa)).toBe(true);
  expect(mocks.publish).toHaveBeenCalledWith(completa);
  cleanup();
  // Una fitxa del Mur (o cap) no bloqueja mai: la publicació de sempre.
  const delMur = { ...NOTA, fitxa: { ambit: 'mur', estat: 'disponible', dades: {} } };
  render(alBloc(<NotesEditor activeNote={delMur} />));
  expect(await mocks.adapter.visibilitat.onTria(true, delMur)).toBe(true);
  expect(mocks.publish).toHaveBeenCalledWith(delMur);
});

test('amb un àmbit pendent al canal (?ambit=vehicle): la nota rep la fitxa, el diàleg s’obri amb l’àmbit triat una sola vegada i el canal es consumix', () => {
  const consumit = vi.fn();
  const { rerender } = render(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotesEditor activeNote={NOTA} /></BlocAmbAmbit>);
  expect(mocks.setLocal).toHaveBeenCalledTimes(1);
  expect(mocks.setLocal).toHaveBeenCalledWith('p', 'fitxa', { ambit: 'vehicle', estat: 'disponible', dades: {} });
  const obert = dialeg();
  expect(obert).toBeTruthy();
  expect(within(obert).getByRole('radio', { name: 'Compartir cotxe' }).checked).toBe(true);
  expect(within(obert).getByLabelText('Lloc d’eixida (obligatori)')).toBeTruthy();
  expect(consumit).toHaveBeenCalledTimes(1);
  // Una pintada nova no torna a demanar res.
  rerender(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotesEditor activeNote={{ ...NOTA, subtitle: 'Dissabte' }} /></BlocAmbAmbit>);
  expect(consumit).toHaveBeenCalledTimes(1);
  expect(mocks.setLocal).toHaveBeenCalledTimes(1);
  // Tancar el deixa tancat: la demanda ja s'ha consumit.
  fireEvent.click(within(obert).getByRole('button', { name: 'Tancar' }));
  expect(dialeg()).toBeNull();
  rerender(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotesEditor activeNote={{ ...NOTA, subtitle: 'Diumenge' }} /></BlocAmbAmbit>);
  expect(dialeg()).toBeNull();
  expect(consumit).toHaveBeenCalledTimes(1);
});

test('una nota que ja és d’un altre àmbit conserva la seua fitxa: el canal només obri el diàleg', () => {
  const consumit = vi.fn();
  const deTreball = { ...NOTA, fitxa: { ambit: 'treball', estat: 'reservat', dades: { modalitat: 'oferisc_ofici', ofici: 'Forner' } } };
  render(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotesEditor activeNote={deTreball} /></BlocAmbAmbit>);
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(within(dialeg()).getByRole('radio', { name: 'Treball' }).checked).toBe(true);
  expect(consumit).toHaveBeenCalledTimes(1);
});

test('la nota preparada rep la fitxa pel seu canal (escriu), no per la cua de Notes', () => {
  const PREPARADA = Object.freeze({ id: '0f0e0d0c-0b0a-4000-8000-000000000001', folderId: 'f-mur', isPublished: false, preparada: true });
  const escriu = vi.fn();
  const consumit = vi.fn();
  render(
    <BlocAmbAmbit pendent="treball" consumit={consumit}>
      <NotaPreparadaContext.Provider value={{ escriu }}>
        <NotesEditor activeNote={PREPARADA} />
      </NotaPreparadaContext.Provider>
    </BlocAmbAmbit>
  );
  expect(escriu).toHaveBeenCalledWith(PREPARADA.id, 'fitxa', { ambit: 'treball', estat: 'disponible', dades: {} });
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(within(dialeg()).getByRole('radio', { name: 'Treball' }).checked).toBe(true);
  // Desar des del diàleg també va pel canal de la preparada.
  escriuAlDialeg('Modalitat', 'jornal_agricola');
  escriuAlDialeg('Ofici o sector', 'Collir olives');
  fireEvent.click(within(dialeg()).getByRole('button', { name: 'Desar l’àmbit' }));
  expect(escriu).toHaveBeenLastCalledWith(PREPARADA.id, 'fitxa', { ambit: 'treball', estat: 'disponible', dades: { modalitat: 'jornal_agricola', ofici: 'Collir olives' } });
  expect(mocks.setLocal).not.toHaveBeenCalled();
});

test('la còpia de prova (sense sessió) i una obra d’altri no reben cap fitxa del canal ni obrin el diàleg', () => {
  const consumit = vi.fn();
  mocks.session = { currentUser: null, estat: 'fora' };
  render(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotesEditor /></BlocAmbAmbit>);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(dialeg()).toBeNull();
  expect(consumit).not.toHaveBeenCalled();
  cleanup();
  mocks.session = { currentUser: { id: 'U-1' } };
  const connexio = { ...NOTA, id: 'c', folderId: 'f-connectats', origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa' } };
  render(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotesEditor activeNote={connexio} /></BlocAmbAmbit>);
  expect(dialeg()).toBeNull();
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(consumit).not.toHaveBeenCalled();
});

/* Revisió L2-A4 · Una obra d'altri es compartix i publishNote no li projecta cap
   fitxa: dins del Bloc, la botonera és la de sempre (cap «Àmbit» que convide a
   omplir una fitxa que mai eixiria). Amb una fitxa ja desada, el grup torna
   per a poder-la vore i llevar. */
test('dins del Bloc, una connexió o un contingut de fora no porten el grup «Àmbit»; amb fitxa desada, sí', () => {
  const connexio = { ...NOTA, id: 'c', folderId: 'f-connectats', origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa' } };
  render(alBloc(<NotesEditor activeNote={connexio} />));
  expect(botonera().map((b) => b.textContent)).toEqual(['Safata d’Entrada', 'Sistema', 'Etiquetes (0)', 'Emojis XL (—)']);
  expect(mocks.adapter.classificacio.props).not.toHaveProperty('ambit', expect.anything());
  cleanup();
  const extern = { ...NOTA, id: 'x', origen: { tipus: 'extern', lloc: 'example.org' } };
  render(alBloc(<NotesEditor activeNote={extern} />));
  expect(botonera().map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Emojis XL (—)']);
  cleanup();
  render(alBloc(<NotesEditor activeNote={{ ...connexio, fitxa: FITXA_PLENA }} />));
  expect(botonera().map((b) => b.textContent)).toEqual(['Safata d’Entrada', 'Sistema', 'Etiquetes (0)', 'Compartir cotxe', 'Emojis XL (—)']);
});
