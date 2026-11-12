/* O4-CLAUDE-1 (ordre del Mestre, captura 261102_2121: «eliminar la finestra
   modal "On es publica?" i integrar-la dins d'"Edició avançada"") · Amb el
   DocumentEditor i la closca de veres (el motor TipTap no entra en joc, com a
   NotesEditor.p4.test.jsx):
     · dins de details.sdp-edicio-avancada, l'ordre exacte capçalera >
       logotip > «On es publica?» > classificació;
     · l'entrada ?ambit= obri sola l'«Edició avançada» amb l'àmbit actiu i el
       bloc a la vista, una sola vegada (també sota StrictMode);
     · el botó «Àmbit» de la botonera hi porta (vista i focus), sense diàleg;
     · la còpia de prova i una obra d'altri no porten el bloc;
     · cap encapçalament de la previsualització entra a l'Índex.
   jsdom no implementa scrollIntoView: es registra. Dades sintètiques. */
import React, { StrictMode, useMemo, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: {}, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' }, setLocal: vi.fn(), viva: { set: null },
  NET: Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) })
}));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: ({ onPublish, publishLabel }) => (
    <div className="sdp-editor-tools"><button type="button" onClick={onPublish}>{publishLabel || 'Publicar'}</button></div>
  ),
  UniversalRichTextContent: () => <div data-testid="cos" />
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, text) => text, config: mocks.config, workspaceKey: 'ambit-A',
    notes: [], setLocalNoteField: mocks.setLocal, saveNoteField: vi.fn(), notesComplete: true,
    potEsborrar: false, scopeKey: 'ambit-A'
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: () => mocks.NET
}));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'user' }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));

import NotesEditor from './NotesEditor.jsx';
import { CanalAmbitContext } from '../../components/universal/ambits/canalAmbit.js';
import { encapcalamentsIndex, selectorIndex } from '../../components/universal/PageFrame.jsx';

const saltats = [];
const scrollAbans = Element.prototype.scrollIntoView;
beforeEach(() => {
  mocks.session = { currentUser: { id: 'u' } };
  saltats.length = 0;
  Element.prototype.scrollIntoView = function scrollIntoView(opcions) { saltats.push([this, opcions]); };
  mocks.setLocal.mockReset().mockImplementation((id, camp, valor) => {
    mocks.viva.set?.((nota) => (nota && nota.id === id ? { ...nota, [camp]: valor } : nota));
  });
});
afterEach(() => {
  cleanup();
  Element.prototype.scrollIntoView = scrollAbans;
  mocks.viva.set = null;
});

const NOTA = Object.freeze({ id: 'p', title: 'Viatge a Alcoi', subtitle: 'Dissabte de matí', folderId: 'f-notes', categories: ['Sistema'], tags: [] });
const CANAL_BUIT = Object.freeze({ pendent: null, consumix: () => {} });

function NotaViva({ inicial }) {
  const [nota, setNota] = useState(inicial);
  mocks.viva.set = setNota;
  return <NotesEditor activeNote={nota} />;
}
function BlocAmbAmbit({ pendent, consumit = () => {}, children }) {
  const [p, setP] = useState(pendent);
  const canal = useMemo(() => ({ pendent: p, consumix: () => { consumit(); setP(null); } }), [p, consumit]);
  return <CanalAmbitContext.Provider value={canal}>{children}</CanalAmbitContext.Provider>;
}
const fillsAmbRanura = (el) => [...el.children].map((e) => (e.dataset.sdpRanura ? `${e.className} [${e.dataset.sdpRanura}]` : e.className));
const desplegable = (container) => container.querySelector('details.sdp-edicio-avancada');
const ranuraAmbit = (container) => container.querySelector('[data-sdp-ranura="ambit"]');

/* IDEA-164 (R104) · R11 Loop 3 (L2-03) · La revisora editorial entra dins del desplegable, després
   de la classificació i abans de tancar (ranura «revisio»): l'ordre del Mestre (capçalera > logotip
   > «On es publica?» > classificació) no canvia. Si la revisora ha de viure a l'edició, ho decidix
   el Mestre. */
test('dins de l’«Edició avançada», l’ordre exacte: capçalera > logotip > «On es publica?» > classificació > revisora > botó tancar', () => {
  const { container } = render(<CanalAmbitContext.Provider value={CANAL_BUIT}><NotaViva inicial={NOTA} /></CanalAmbitContext.Provider>);
  const cos = desplegable(container).querySelector(':scope > .sdp-edicio-avancada__cos');
  expect(fillsAmbRanura(cos)).toEqual([
    'sdp-edicio-avancada__imatge [capcalera]',
    'sdp-edicio-avancada__imatge [logotip]',
    'sdp-edicio-avancada__ambit [ambit]',
    'page-title-classificacio',
    'sdp-edicio-avancada__ambit [revisio]',
    'sdp-boto sdp-boto--secundari sdp-edicio-avancada__boto-tancar'
  ]);
  expect(cos.querySelector('[data-sdp-ranura="revisio"] [data-sdp-revisor-editorial-node0="true"]')).not.toBeNull();
  // Ni germana del DocumentEditor ni fora del desplegable.
  expect(container.querySelectorAll('[data-sdp-revisor-editorial-node0]')).toHaveLength(1);
  const bloc = within(ranuraAmbit(container)).getByRole('group', { name: 'On es publica?' });
  expect(within(bloc).getByLabelText('Àmbit').options).toHaveLength(8);
  // Plegat, com sempre: cap diàleg, cap salt.
  expect(desplegable(container).open).toBe(false);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(saltats).toEqual([]);
});

test('?ambit=vehicle obri l’«Edició avançada» amb Compartir cotxe actiu i manté l’scroll a dalt de tot (AH-23), la carpeta del Mur i el canal consumit', () => {
  const consumit = vi.fn();
  const { container } = render(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotaViva inicial={NOTA} /></BlocAmbAmbit>);
  expect(desplegable(container).open).toBe(true);
  const ranura = ranuraAmbit(container);
  expect(within(ranura).getByLabelText('Àmbit').value).toBe('vehicle');
  expect(within(ranura).getByLabelText('Lloc d’eixida (obligatori)')).toBeTruthy();
  // AH-23 · L'entrada ?ambit= NO baixa la vista fins a ranura: manté l'inici a dalt (scrollTop = 0).
  expect(saltats).toEqual([]);
  expect(container.querySelector('.sdp-universal-page-container')?.scrollTop).toBe(0);
  // L'entrada no roba el focus: la vista és a dalt, la persona tria on escriure.
  expect(ranura.contains(document.activeElement)).toBe(false);
  expect(mocks.setLocal.mock.calls).toEqual([
    ['p', 'fitxa', { ambit: 'vehicle', estat: 'disponible', dades: {} }],
    ['p', 'folderId', 'f-mur']
  ]);
  expect(consumit).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).toBeNull();
  // Plegar-lo a mà el deixa plegat: la petició ja s'ha atés.
  act(() => { desplegable(container).open = false; });
  fireEvent.change(within(ranura).getByLabelText('Lloc d’eixida (obligatori)'), { target: { value: 'La Torre' } });
  expect(desplegable(container).open).toBe(false);
  expect(saltats).toEqual([]);
});

test('?ambit=mercat: la carpeta del Mercat i el Mercat actiu', () => {
  const { container } = render(<BlocAmbAmbit pendent="mercat"><NotaViva inicial={NOTA} /></BlocAmbAmbit>);
  expect(desplegable(container).open).toBe(true);
  expect(within(ranuraAmbit(container)).getByLabelText('Àmbit').value).toBe('mercat');
  expect(mocks.setLocal.mock.calls).toEqual([
    ['p', 'fitxa', { ambit: 'mercat', estat: 'disponible', dades: {} }],
    ['p', 'folderId', 'f-mercat']
  ]);
});

test('sota StrictMode, l’entrada ?ambit= escriu, consumix i manté la vista a dalt una sola vegada', () => {
  const consumit = vi.fn();
  const { container } = render(
    <StrictMode>
      <BlocAmbAmbit pendent="treball" consumit={consumit}><NotaViva inicial={NOTA} /></BlocAmbAmbit>
    </StrictMode>
  );
  expect(desplegable(container).open).toBe(true);
  expect(within(ranuraAmbit(container)).getByLabelText('Àmbit').value).toBe('treball');
  expect(mocks.setLocal.mock.calls).toEqual([
    ['p', 'fitxa', { ambit: 'treball', estat: 'disponible', dades: {} }],
    ['p', 'folderId', 'f-mur']
  ]);
  expect(consumit).toHaveBeenCalledTimes(1);
  expect(saltats).toEqual([]);
});

test('AH-24 · la classificació de l’«Edició avançada» mostra 3 files en línia de 2 columnes (Carpeta, Categories, Etiquetes) sense xip redundant «Àmbit»', () => {
  const { container } = render(
    <CanalAmbitContext.Provider value={CANAL_BUIT}>
      <NotaViva inicial={{ ...NOTA, fitxa: { ambit: 'habitatge', estat: 'disponible', dades: {} } }} />
    </CanalAmbitContext.Provider>
  );
  const details = desplegable(container);
  act(() => { details.open = true; });
  const classif = details.querySelector('.page-title-classificacio');
  expect(within(classif).queryByRole('button', { name: /Àmbit/i })).toBeNull();
  expect(within(classif).getByLabelText('Carpeta').value).toBe('f-notes');
  expect(within(classif).getByLabelText('Crear nova carpeta')).toBeTruthy();
  expect(within(classif).getByLabelText('Categories')).toBeTruthy();
  expect(within(classif).getByLabelText('Crear nova categoria')).toBeTruthy();
  expect(within(classif).getByLabelText('Etiquetes')).toBeTruthy();
  expect(within(classif).getByLabelText('Crear nova etiqueta')).toBeTruthy();
  expect(within(classif).getByRole('button', { name: 'Llevar «Sistema»' })).toBeTruthy();
  expect(within(classif).getByRole('button', { name: /Emojis XL/ })).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('la còpia de prova del Foraster i una obra d’altri: l’«Edició avançada» sense el bloc', () => {
  mocks.session = {};
  const foraster = render(<BlocAmbAmbit pendent="vehicle"><NotesEditor /></BlocAmbAmbit>);
  expect(desplegable(foraster.container)).not.toBeNull();
  expect(ranuraAmbit(foraster.container)).toBeNull();
  expect(desplegable(foraster.container).open).toBe(false);
  cleanup();
  mocks.session = { currentUser: { id: 'u' } };
  const connexio = { ...NOTA, id: 'c', folderId: 'f-connectats', origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa' } };
  const cita = render(<BlocAmbAmbit pendent="vehicle"><NotaViva inicial={connexio} /></BlocAmbAmbit>);
  expect(ranuraAmbit(cita.container)).toBeNull();
  expect(desplegable(cita.container).open).toBe(false);
  expect(saltats).toEqual([]);
  expect(mocks.setLocal).not.toHaveBeenCalled();
});

test('cap encapçalament de la previsualització (ni res de l’«Edició avançada») entra a l’Índex de la pàgina', () => {
  const { container } = render(<BlocAmbAmbit pendent="vehicle"><NotaViva inicial={NOTA} /></BlocAmbAmbit>);
  const ranura = ranuraAmbit(container);
  // La previsualització pinta la targeta pública amb el títol i el subtítol de la nota…
  expect(within(ranura).getByRole('heading', { name: 'Viatge a Alcoi' })).toBeTruthy();
  expect(ranura.querySelectorAll('h1, h2, h3, h4, h5, h6').length).toBeGreaterThan(0);
  // …i l'Índex, que llig l'article sencer, no en recull cap.
  const article = container.querySelector('article.content-wrapper');
  const entrades = encapcalamentsIndex(article, selectorIndex(6)).map(({ element }) => element);
  expect(entrades.some((element) => desplegable(container).contains(element))).toBe(false);
});

/* Correcció D2-publicacio-5-verticals-02 (Onada 4) · Amb la closca de veres:
   «60» habitacions no entra a la fitxa desada (normalitzaDades el descarta),
   però el bloc el pinta amb el seu error. PUBLICAR no la deixa eixir neta i
   muda: el selector diu que la fitxa no està completa. */
test('PUBLICAR amb un valor fora de rang al bloc (Habitacions «60») s’atura amb «La fitxa de «Habitatge» no està completa.»', async () => {
  const { container } = render(<CanalAmbitContext.Provider value={CANAL_BUIT}><NotaViva inicial={NOTA} /></CanalAmbitContext.Provider>);
  act(() => { desplegable(container).open = true; });
  const ranura = ranuraAmbit(container);
  fireEvent.change(within(ranura).getByLabelText('Àmbit'), { target: { value: 'habitatge' } });
  fireEvent.change(within(ranura).getByLabelText('Modalitat (obligatori)'), { target: { value: 'lloguer' } });
  fireEvent.change(within(ranura).getByLabelText('Preu (obligatori)'), { target: { value: '450 €/mes' } });
  fireEvent.change(within(ranura).getByLabelText('Habitacions'), { target: { value: '60' } });
  // La fitxa desada és neta i, per si sola, passaria validaFitxa.
  expect(mocks.setLocal).toHaveBeenLastCalledWith('p', 'fitxa', { ambit: 'habitatge', estat: 'disponible', dades: { modalitat: 'lloguer', preu: '450 €/mes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
  // Onada R20 (Bucle 1 · zero modals flotants a /notes): l'acció enfoca i preselecciona el panell en línia.
  expect(screen.queryByRole('dialog')).toBeNull();
  const panell = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
  expect(within(panell).getByRole('radio', { name: /Públic al Mur del poble/ }).checked).toBe(true);
  await act(async () => { fireEvent.click(within(panell).getByRole('button', { name: 'Publicar al Mur' })); });
  expect(within(panell).getByRole('alert').textContent).toBe('La fitxa de «Habitatge» no està completa.');
  // Corregit el valor, la guarda ja no la para per la fitxa.
  fireEvent.change(within(ranura).getByLabelText('Habitacions'), { target: { value: '3' } });
  expect(mocks.setLocal).toHaveBeenLastCalledWith('p', 'fitxa', { ambit: 'habitatge', estat: 'disponible', dades: { modalitat: 'lloguer', preu: '450 €/mes', habitacions: 3 } });
});

test('AH-03 / AH-06 · el botó inferior «Tancar l’edició avançada» plega el desplegable i retorna el focus al <summary> (mai a document.body)', () => {
  const { container } = render(
    <CanalAmbitContext.Provider value={CANAL_BUIT}>
      <NotaViva inicial={NOTA} />
    </CanalAmbitContext.Provider>
  );
  const details = desplegable(container);
  act(() => { details.open = true; });
  const botoTancar = details.querySelector('button.sdp-edicio-avancada__boto-tancar');
  expect(botoTancar).not.toBeNull();
  botoTancar.focus();
  fireEvent.click(botoTancar);
  expect(details.open).toBe(false);
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toBe(details.querySelector('summary.sdp-edicio-avancada__resum'));
});
