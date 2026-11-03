/* IDEA-61 (T0, prompt 261102_1532) i O4-CLAUDE-1 (ordre del Mestre, captura
   261102_2121: fora la finestra modal «On es publica?», dins de l'«Edició
   avançada») · El Bloc de Notes i l'àmbit de publicació:
     · el grup «Àmbit» de la botonera (dins del Bloc o amb fitxa; sense, el DOM
       de sempre), que ja no obri cap diàleg: demana anar al bloc en línia;
     · el bloc «On es publica?» de la ranura `ambitEdicioAvancada`, que escriu
       la fitxa pel canal de la classificació (setLocalNoteField, o el canal de
       la nota preparada) a cada canvi, sense «Desar l'àmbit»;
     · la carpeta i l'àmbit sincronitzats (carpetaAmbit.js): triar un àmbit
       porta la nota a la carpeta de la seua secció, i moure-la a la carpeta
       del Mercat (o traure-la'n cap al Mur) li canvia l'àmbit;
     · la guarda de PUBLICAR amb una fitxa incompleta (el motiu en línia al
       selector, i els errors al bloc);
     · l'entrada des d'una secció (el canal de l'àmbit: la nota rep la fitxa i
       la carpeta, i l'«Edició avançada» s'obri una vegada).
   El DocumentEditor és fals: pinta les dues ranures de l'adaptador (el bloc i
   la botonera) perquè es puguen tocar; la closca de veres es prova a
   NotesEditor.ambitEnLinia.test.jsx. La nota viu en un estat de la prova
   (setLocalNoteField l'actualitza), com a l'App. Dades sintètiques. */
import { StrictMode, useMemo, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => {
  const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) });
  const TENANT_A = '00000000-0000-4000-8000-0000000000a1';
  return {
    TENANT_A, showToast: vi.fn(), noteFolders: [], adapter: null, config: { tenantId: TENANT_A }, notes: [], setLocal: vi.fn(),
    session: {}, NET, desament: vi.fn(() => NET), identitat: { actorId: 'user' }, core: { agents: [] }, publish: vi.fn(), compartir: vi.fn(),
    viva: { set: null }
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
vi.mock('../../components/universal/DocumentEditor', () => ({
  DocumentEditor: ({ adapter }) => {
    mocks.adapter = adapter;
    return (
      <>
        <div data-testid="ranura-ambit">{adapter.ambitEdicioAvancada}</div>
        <div data-testid="classificacio">{adapter.classificacio}</div>
      </>
    );
  }
}));
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
  /* Com a l'App: escriure un camp actualitza la nota oberta. */
  mocks.setLocal.mockReset().mockImplementation((id, camp, valor) => {
    mocks.viva.set?.((nota) => (nota && nota.id === id ? { ...nota, [camp]: valor } : nota));
  });
  mocks.publish.mockReset().mockResolvedValue(true);
  mocks.compartir.mockReset().mockResolvedValue(true);
});
afterEach(() => {
  cleanup();
  mocks.viva.set = null;
});

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

/* La nota oberta, viva: setLocalNoteField (mocks.setLocal) l'actualitza. */
function NotaViva({ inicial, canal = null, children }) {
  const [nota, setNota] = useState(inicial);
  mocks.viva.set = setNota;
  const editor = children ? children(nota) : <NotesEditor activeNote={nota} />;
  return canal ? <CanalAmbitContext.Provider value={canal}>{editor}</CanalAmbitContext.Provider> : editor;
}
/* El Bloc de veres: el canal es consumix una vegada i deixa de demanar res. */
function BlocAmbAmbit({ pendent, consumit, children }) {
  const [p, setP] = useState(pendent);
  const canal = useMemo(() => ({ pendent: p, consumix: () => { consumit(); setP(null); } }), [p, consumit]);
  return <CanalAmbitContext.Provider value={canal}>{children}</CanalAmbitContext.Provider>;
}

const botonera = () => within(screen.getByTestId('classificacio')).getAllByRole('button');
const bloc = () => within(screen.getByTestId('ranura-ambit')).queryByRole('group', { name: TITOL });
const radio = (nom) => within(bloc()).getByRole('radio', { name: nom });
const escriuAlBloc = (retol, value) => fireEvent.change(within(bloc()).getByLabelText(new RegExp(`^${retol}( \\(obligatori\\))?$`)), { target: { value } });
const escriptures = () => mocks.setLocal.mock.calls.map(([id, camp, valor]) => [id, camp, valor]);

test('sense canal ni fitxa (fora del Bloc), la botonera és la de sempre i cap bloc «On es publica?»', () => {
  render(<NotaViva inicial={NOTA} />);
  expect(botonera().map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Emojis XL (—)']);
  expect(mocks.adapter.classificacio.props).not.toHaveProperty('ambit', expect.anything());
  expect(mocks.adapter.ambitEdicioAvancada).toBeNull();
  expect(mocks.adapter.peticioAmbit).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('dins del Bloc, «Àmbit (—)» entre Etiquetes i Emojis XL, sense aria-haspopup (la resta, sí); amb fitxa, la píndola diu l’àmbit', () => {
  render(<NotaViva inicial={NOTA} canal={CANAL_BUIT} />);
  const botons = botonera();
  expect(botons.map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Àmbit (—)', 'Emojis XL (—)']);
  expect(botons.map((b) => b.getAttribute('aria-haspopup'))).toEqual(['dialog', 'dialog', 'dialog', null, 'dialog']);
  expect(botons[3].querySelector('svg.lucide-layers')).toBeTruthy();
  expect(botons[3].querySelector('.sp-card-label.sdp-badge-buit')).toBeTruthy();
  // L'emoticona continua sent l'últim botó (DESTINS_FOCUS.icon).
  expect(botons.at(-1).textContent).toBe('Emojis XL (—)');
  expect(bloc()).toBeTruthy();
  cleanup();
  // Amb fitxa, també fora del Bloc: la nota ja és d'un àmbit i es pot vore i canviar.
  render(<NotaViva inicial={{ ...NOTA, fitxa: FITXA_PLENA }} />);
  const ambFitxa = botonera();
  expect(ambFitxa.map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Compartir cotxe', 'Emojis XL (—)']);
  expect(ambFitxa[3].getAttribute('aria-label')).toBe('Àmbit: Compartir cotxe');
  expect(ambFitxa[3].getAttribute('title')).toBe('Àmbit: Compartir cotxe');
  expect(ambFitxa[3].hasAttribute('aria-haspopup')).toBe(false);
  expect(ambFitxa[3].querySelector('.sp-card-label').className).toBe('sp-card-label sdp-badge-system');
  expect(radio('Compartir cotxe').checked).toBe(true);
});

test('el botó «Àmbit» no obri cap diàleg: demana anar al bloc amb el focus, una petició per clic, que s’oblida un cop atesa', () => {
  render(<NotaViva inicial={NOTA} canal={CANAL_BUIT} />);
  expect(mocks.adapter.peticioAmbit).toBeNull();
  fireEvent.click(botonera()[3]);
  expect(screen.queryByRole('dialog')).toBeNull();
  const peticio = mocks.adapter.peticioAmbit;
  expect(peticio).toEqual({ nota: 'p', enfoca: true });
  act(() => { mocks.adapter.onPeticioAmbitAtesa(peticio); });
  expect(mocks.adapter.peticioAmbit).toBeNull();
  fireEvent.click(botonera()[3]);
  expect(mocks.adapter.peticioAmbit).toEqual({ nota: 'p', enfoca: true });
  expect(mocks.adapter.peticioAmbit).not.toBe(peticio);
  expect(mocks.setLocal).not.toHaveBeenCalled();
});

test('triar Treball escriu de seguida la fitxa i la carpeta del Mur; cada camp escriu la fitxa normalitzada; cap «Desar l’àmbit»', () => {
  render(<NotaViva inicial={{ ...NOTA, folderId: 'f-notes' }} canal={CANAL_BUIT} />);
  expect(within(bloc()).queryByRole('button')).toBeNull();
  // La previsualització signa com la barra taronja (la persona), no «Sóc de Poble».
  expect(within(bloc()).getByRole('heading', { name: 'Viatge a Alcoi' })).toBeTruthy();
  expect(bloc().querySelector('.sp-card-author-name').textContent).toBe('Pepa');
  expect(bloc().querySelector('.sp-card-author-location').textContent).toBe('La Torre');
  fireEvent.click(radio('Treball'));
  expect(escriptures()).toEqual([
    ['p', 'fitxa', { ambit: 'treball', estat: 'disponible', dades: {} }],
    ['p', 'folderId', 'f-mur']
  ]);
  expect(radio('Treball').checked).toBe(true);
  escriuAlBloc('Modalitat', 'oferta_feina');
  escriuAlBloc('Ofici o sector', '  Forner ');
  expect(escriptures().slice(2)).toEqual([
    ['p', 'fitxa', { ambit: 'treball', estat: 'disponible', dades: { modalitat: 'oferta_feina' } }],
    ['p', 'fitxa', { ambit: 'treball', estat: 'disponible', dades: { modalitat: 'oferta_feina', ofici: 'Forner' } }]
  ]);
  // Un espai de més no canvia la fitxa: no es torna a escriure.
  escriuAlBloc('Ofici o sector', '  Forner  ');
  expect(mocks.setLocal).toHaveBeenCalledTimes(4);
  expect(within(bloc()).getByLabelText(/^Ofici o sector/).value).toBe('  Forner  ');
});

test('triar Mur escriu fitxa null (la publicació de sempre); el Mercat porta la nota a la seua carpeta i el Mur la torna', () => {
  render(<NotaViva inicial={{ ...NOTA, fitxa: FITXA_PLENA }} canal={CANAL_BUIT} />);
  fireEvent.click(radio('Mur'));
  // Ja era al Mur: només la fitxa.
  expect(escriptures()).toEqual([['p', 'fitxa', null]]);
  fireEvent.click(radio('Mercat'));
  expect(escriptures().slice(1)).toEqual([
    ['p', 'fitxa', { ambit: 'mercat', estat: 'disponible', dades: {} }],
    ['p', 'folderId', 'f-mercat']
  ]);
  fireEvent.click(radio('Mur'));
  expect(escriptures().slice(3)).toEqual([['p', 'fitxa', null], ['p', 'folderId', 'f-mur']]);
  // I tornar a Compartir cotxe recupera les dades d'abans, i les torna a escriure.
  fireEvent.click(radio('Compartir cotxe'));
  expect(escriptures().at(-1)).toEqual(['p', 'fitxa', FITXA_PLENA]);
  expect(within(bloc()).getByLabelText(/^Lloc d’eixida/).value).toBe('La Torre');
});

test('moure la nota a la carpeta del Mercat (Carpeta del document) li posa l’àmbit Mercat; traure-la cap al Mur la torna al Mur', () => {
  render(<NotaViva inicial={NOTA} canal={CANAL_BUIT} />);
  const mou = (carpeta) => {
    fireEvent.click(botonera()[0]);
    const dialeg = screen.getByRole('dialog', { name: 'Carpeta del document' });
    fireEvent.click(within(dialeg).getByRole('radio', { name: carpeta }));
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar' }));
  };
  mou('Mercat');
  expect(escriptures()).toEqual([['p', 'folderId', 'f-mercat'], ['p', 'fitxa', { ambit: 'mercat', estat: 'disponible', dades: {} }]]);
  expect(radio('Mercat').checked).toBe(true);
  mou('Mur');
  expect(escriptures().slice(2)).toEqual([['p', 'folderId', 'f-mur'], ['p', 'fitxa', null]]);
  expect(radio('Mur').checked).toBe(true);
  // Cap altre moviment toca la fitxa.
  mou('Altres notes');
  expect(escriptures().slice(4)).toEqual([['p', 'folderId', 'f-notes']]);
});

test('PUBLICAR amb una fitxa incompleta queda bloquejat amb el motiu en línia i el bloc mostra què falta; completa, publica', async () => {
  const incompleta = { ...NOTA, fitxa: FITXA_BUIDA };
  render(<NotaViva inicial={incompleta} canal={CANAL_BUIT} />);
  expect(within(bloc()).getByLabelText(/^Lloc d’eixida/).getAttribute('aria-invalid')).toBeNull();
  await act(async () => { await expect(mocks.adapter.visibilitat.onTria(true, incompleta)).rejects.toThrow(MISSATGE_INCOMPLETA); });
  expect(mocks.publish).not.toHaveBeenCalled();
  // El bloc «On es publica?» ja diu què falta, sense esperar cap tecla.
  expect(within(bloc()).getByLabelText(/^Lloc d’eixida/).getAttribute('aria-invalid')).toBe('true');
  expect(bloc().querySelector('.sdp-alerta--error').textContent).toBe(MISSATGE_INCOMPLETA);
  /* Correcció A1-03 de l'àrbitre · I la closca l'obri i hi porta la vista
     (l'«Edició avançada» pot estar plegada), sense robar el focus al selector. */
  expect(mocks.adapter.peticioAmbit).toEqual({ nota: 'p', enfoca: false });
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
  render(<NotaViva inicial={completa} canal={CANAL_BUIT} />);
  expect(await mocks.adapter.visibilitat.onTria(true, completa)).toBe(true);
  expect(mocks.publish).toHaveBeenCalledWith(completa);
  cleanup();
  // Una fitxa del Mur (o cap) no bloqueja mai: la publicació de sempre.
  const delMur = { ...NOTA, fitxa: { ambit: 'mur', estat: 'disponible', dades: {} } };
  render(<NotaViva inicial={delMur} canal={CANAL_BUIT} />);
  expect(await mocks.adapter.visibilitat.onTria(true, delMur)).toBe(true);
  expect(mocks.publish).toHaveBeenCalledWith(delMur);
});

test('?ambit=vehicle: la nota rep la fitxa i la carpeta del Mur en una sola escriptura, l’«Edició avançada» es demana oberta (sense focus) i el canal es consumix una vegada', () => {
  const consumit = vi.fn();
  render(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotaViva inicial={{ ...NOTA, folderId: 'f-notes' }} /></BlocAmbAmbit>);
  expect(escriptures()).toEqual([
    ['p', 'fitxa', { ambit: 'vehicle', estat: 'disponible', dades: {} }],
    ['p', 'folderId', 'f-mur']
  ]);
  expect(mocks.adapter.peticioAmbit).toEqual({ nota: 'p', enfoca: false });
  expect(radio('Compartir cotxe').checked).toBe(true);
  expect(within(bloc()).getByLabelText('Lloc d’eixida (obligatori)')).toBeTruthy();
  expect(consumit).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).toBeNull();
  // Una pintada nova (una tecla al títol) no torna a demanar res.
  act(() => { mocks.viva.set((nota) => ({ ...nota, subtitle: 'Dissabte' })); });
  expect(consumit).toHaveBeenCalledTimes(1);
  expect(mocks.setLocal).toHaveBeenCalledTimes(2);
});

test('?ambit=mercat: la fitxa del Mercat i la carpeta del Mercat', () => {
  const consumit = vi.fn();
  render(<BlocAmbAmbit pendent="mercat" consumit={consumit}><NotaViva inicial={NOTA} /></BlocAmbAmbit>);
  expect(escriptures()).toEqual([
    ['p', 'fitxa', { ambit: 'mercat', estat: 'disponible', dades: {} }],
    ['p', 'folderId', 'f-mercat']
  ]);
  expect(radio('Mercat').checked).toBe(true);
});

test('una nota que ja és d’un altre àmbit conserva la seua fitxa i la seua carpeta: el canal només obri el bloc', () => {
  const consumit = vi.fn();
  const deTreball = { ...NOTA, folderId: 'f-notes', fitxa: { ambit: 'treball', estat: 'reservat', dades: { modalitat: 'oferisc_ofici', ofici: 'Forner' } } };
  render(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotaViva inicial={deTreball} /></BlocAmbAmbit>);
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(radio('Treball').checked).toBe(true);
  expect(mocks.adapter.peticioAmbit).toEqual({ nota: 'p', enfoca: false });
  expect(consumit).toHaveBeenCalledTimes(1);
});

test('la nota preparada rep la fitxa i la carpeta pel seu canal (escriu), no per la cua de Notes; el bloc també hi escriu', () => {
  const PREPARADA = Object.freeze({ id: '0f0e0d0c-0b0a-4000-8000-000000000001', folderId: 'f-mur', isPublished: false, preparada: true });
  const escriu = vi.fn((id, camp, valor) => { mocks.viva.set?.((nota) => (nota && nota.id === id ? { ...nota, [camp]: valor } : nota)); });
  const consumit = vi.fn();
  render(
    <BlocAmbAmbit pendent="treball" consumit={consumit}>
      <NotaPreparadaContext.Provider value={{ escriu }}>
        <NotaViva inicial={PREPARADA} />
      </NotaPreparadaContext.Provider>
    </BlocAmbAmbit>
  );
  // La carpeta, també si ja hi naix: la base de la preparada canvia en consumir el canal.
  expect(escriu.mock.calls).toEqual([
    [PREPARADA.id, 'fitxa', { ambit: 'treball', estat: 'disponible', dades: {} }],
    [PREPARADA.id, 'folderId', 'f-mur']
  ]);
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(radio('Treball').checked).toBe(true);
  escriuAlBloc('Modalitat', 'jornal_agricola');
  escriuAlBloc('Ofici o sector', 'Collir olives');
  expect(escriu).toHaveBeenLastCalledWith(PREPARADA.id, 'fitxa', { ambit: 'treball', estat: 'disponible', dades: { modalitat: 'jornal_agricola', ofici: 'Collir olives' } });
  expect(mocks.setLocal).not.toHaveBeenCalled();
});

test('la còpia de prova (sense sessió) i una obra d’altri: cap bloc, cap fitxa del canal ni cap petició', () => {
  const consumit = vi.fn();
  mocks.session = { currentUser: null, estat: 'fora' };
  render(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotesEditor /></BlocAmbAmbit>);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.ambitEdicioAvancada).toBeNull();
  expect(mocks.adapter.peticioAmbit).toBeNull();
  expect(bloc()).toBeNull();
  // Ni el botó «Àmbit»: no hi ha cap bloc on portar.
  expect(botonera().map((b) => b.textContent)).not.toContain('Àmbit (—)');
  expect(consumit).not.toHaveBeenCalled();
  cleanup();
  mocks.session = { currentUser: { id: 'U-1' } };
  const connexio = { ...NOTA, id: 'c', folderId: 'f-connectats', origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa' } };
  render(<BlocAmbAmbit pendent="vehicle" consumit={consumit}><NotaViva inicial={connexio} /></BlocAmbAmbit>);
  expect(bloc()).toBeNull();
  expect(mocks.adapter.peticioAmbit).toBeNull();
  expect(mocks.setLocal).not.toHaveBeenCalled();
  // Correcció D2-publicacio-5-verticals-05 · L'obra d'altri consumix el canal (sense escriure), perquè no caiga damunt de la nota pròpia següent.
  expect(consumit).toHaveBeenCalledTimes(1);
});

/* Revisió L2-A4 · Una obra d'altri es compartix i publishNote no li projecta cap
   fitxa: dins del Bloc, la botonera és la de sempre (cap «Àmbit» que convide a
   omplir una fitxa que mai eixiria). Amb una fitxa ja desada, el grup torna
   per a poder-la vore i llevar, sense tocar la carpeta (O4-CLAUDE-1). */
test('dins del Bloc, una connexió o un contingut de fora no porten el grup «Àmbit»; amb fitxa desada, sí, i llevar-la no la mou de carpeta', () => {
  const connexio = { ...NOTA, id: 'c', folderId: 'f-connectats', origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa' } };
  render(<NotaViva inicial={connexio} canal={CANAL_BUIT} />);
  expect(botonera().map((b) => b.textContent)).toEqual(['Safata d’Entrada', 'Sistema', 'Etiquetes (0)', 'Emojis XL (—)']);
  expect(mocks.adapter.classificacio.props).not.toHaveProperty('ambit', expect.anything());
  expect(bloc()).toBeNull();
  cleanup();
  const extern = { ...NOTA, id: 'x', origen: { tipus: 'extern', lloc: 'example.org' } };
  render(<NotaViva inicial={extern} canal={CANAL_BUIT} />);
  expect(botonera().map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Emojis XL (—)']);
  cleanup();
  render(<NotaViva inicial={{ ...connexio, fitxa: FITXA_PLENA }} canal={CANAL_BUIT} />);
  expect(botonera().map((b) => b.textContent)).toEqual(['Safata d’Entrada', 'Sistema', 'Etiquetes (0)', 'Compartir cotxe', 'Emojis XL (—)']);
  /* Correcció A1-04 de l'àrbitre · Amb el teclat al ràdio «Mur», llevar la
     fitxa no desmunta el bloc: el focus no cau a <body>. */
  radio('Mur').focus();
  fireEvent.click(radio('Mur'));
  expect(escriptures()).toEqual([['c', 'fitxa', null]]);
  expect(bloc()).toBeTruthy();
  expect(document.activeElement).toBe(radio('Mur'));
  expect(radio('Mur').checked).toBe(true);
});

/* Correcció A1-04 de l'àrbitre (O4-CLAUDE-1) · Fora del Bloc (sense canal),
   una nota amb fitxa porta el bloc; triar «Mur» lleva la fitxa i el bloc es
   queda mentre la nota continua oberta (el focus no cau a <body>). Una altra
   nota sense fitxa no l'hereta. */
test('fora del Bloc, triar «Mur» en una nota amb fitxa no desmunta el bloc amb el focus a dins; una altra nota sense fitxa no l’hereta', () => {
  render(<NotaViva inicial={{ ...NOTA, fitxa: FITXA_PLENA }} />);
  radio('Mur').focus();
  fireEvent.click(radio('Mur'));
  expect(escriptures()).toEqual([['p', 'fitxa', null]]);
  expect(bloc()).toBeTruthy();
  expect(document.activeElement).toBe(radio('Mur'));
  // El botó «Àmbit» continua portant-hi.
  expect(botonera().map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Àmbit (—)', 'Emojis XL (—)']);
  // Una altra nota (sense fitxa) no porta el bloc; tornar a la primera, ja sense fitxa, tampoc.
  act(() => { mocks.viva.set({ ...NOTA, id: 'q' }); });
  expect(bloc()).toBeNull();
  act(() => { mocks.viva.set({ ...NOTA }); });
  expect(bloc()).toBeNull();
});

test('sota StrictMode, l’entrada ?ambit= escriu i consumix una sola vegada, i triar un àmbit escriu una sola vegada', () => {
  const consumit = vi.fn();
  render(
    <StrictMode>
      <BlocAmbAmbit pendent="habitatge" consumit={consumit}><NotaViva inicial={{ ...NOTA, folderId: 'f-notes' }} /></BlocAmbAmbit>
    </StrictMode>
  );
  expect(escriptures()).toEqual([
    ['p', 'fitxa', { ambit: 'habitatge', estat: 'disponible', dades: {} }],
    ['p', 'folderId', 'f-mur']
  ]);
  expect(consumit).toHaveBeenCalledTimes(1);
  expect(radio('Habitatge').checked).toBe(true);
  fireEvent.click(radio('Mercat'));
  expect(escriptures().slice(2)).toEqual([
    ['p', 'fitxa', { ambit: 'mercat', estat: 'disponible', dades: {} }],
    ['p', 'folderId', 'f-mercat']
  ]);
  escriuAlBloc('Preu', '3 €');
  expect(escriptures().slice(4)).toEqual([['p', 'fitxa', { ambit: 'mercat', estat: 'disponible', dades: { preu: '3 €' } }]]);
});

/* Correcció D2-publicacio-5-verticals-05 (Onada 4) · Una entrada ?ambit= que
   arriba amb una obra d'altri oberta (la nota destinació, però no apta) es
   consumix sense escriure res: el canal no resta pendent per a caure damunt
   de la primera nota pròpia que s'obriga després. */
test('?ambit=mercat amb una connexió oberta es consumix sense escriure; obrir després una nota pròpia no li posa cap fitxa ni la mou de carpeta', () => {
  const consumit = vi.fn();
  const connexio = { ...NOTA, id: 'c', folderId: 'f-connectats', origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa' } };
  render(<BlocAmbAmbit pendent="mercat" consumit={consumit}><NotaViva inicial={connexio} /></BlocAmbAmbit>);
  expect(consumit).toHaveBeenCalledTimes(1);
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(mocks.adapter.peticioAmbit).toBeNull();
  // La persona obri la seua nota «Receptes de l'àvia».
  act(() => { mocks.viva.set({ ...NOTA, id: 'n', title: 'Receptes de l’àvia', folderId: 'f-notes' }); });
  expect(mocks.adapter.document.id).toBe('n');
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(mocks.adapter.peticioAmbit).toBeNull();
  expect(consumit).toHaveBeenCalledTimes(1);
});

/* Correcció D2-publicacio-5-verticals-02 (Onada 4) · La guarda de PUBLICAR
   mira també el que pinta el bloc (el tercer argument de BlocAmbit), lligat a
   la nota i a la fitxa desada: obrir una altra nota i tornar-hi remunta el
   bloc amb les dades desades, ja netes, i llavors no queda cap bloqueig fantasma. */
test('PUBLICAR s’atura amb «60» habitacions al bloc encara que la fitxa desada siga neta; tornar a la nota (dades netes) ja no la para', async () => {
  const HABITATGE = { ambit: 'habitatge', estat: 'disponible', dades: { modalitat: 'lloguer', preu: '450 €/mes' } };
  render(<NotaViva inicial={{ ...NOTA, fitxa: HABITATGE }} canal={CANAL_BUIT} />);
  escriuAlBloc('Habitacions', '60');
  // Res a escriure: la fitxa normalitzada és la mateixa.
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(mocks.adapter.document.fitxa).toEqual(HABITATGE);
  await act(async () => {
    await expect(mocks.adapter.visibilitat.onTria(true, mocks.adapter.document)).rejects.toThrow('La fitxa de «Habitatge» no està completa.');
  });
  expect(mocks.publish).not.toHaveBeenCalled();
  expect(bloc().querySelector('.sdp-alerta--error').textContent).toBe('La fitxa de «Habitatge» no està completa.');
  expect(mocks.adapter.peticioAmbit).toEqual({ nota: 'p', enfoca: false });
  const nota = mocks.adapter.document;
  act(() => { mocks.viva.set({ ...NOTA, id: 'q' }); });
  act(() => { mocks.viva.set(nota); });
  expect(within(bloc()).getByLabelText(/^Habitacions/).value).toBe('');
  expect(await mocks.adapter.visibilitat.onTria(true, mocks.adapter.document)).toBe(true);
  expect(mocks.publish).toHaveBeenCalledTimes(1);
});
