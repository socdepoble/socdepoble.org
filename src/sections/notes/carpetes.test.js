/**
 * D1 (ordre del Mestre, 260930) · La Safata d’Entrada és la carpeta
 * 'f-connectats' de sempre amb un nom visible nou: l'id és el contracte de
 * les dades locals i remotes i no canvia; el nom té una sola font, la llavor.
 */
import { createElement } from 'react';
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Folder, Inbox, NotebookPen, SquarePen } from 'lucide-react';
import { NOTE_FOLDERS_SEED } from '../../data/appSeed.js';
import { createTranslator } from '../../config/i18n.js';
/* Sense els diccionaris carregats, createTranslator('en') tornaria el valencià i la prova passaria en buit. */
import '../../../tests/helpers/diccionaris.js';
import {
  CARPETA_CONNECTATS, CARPETA_EN_PRODUCCIO, NOM_CARPETA_CONNECTATS, NOMS_CARPETES_DE_SERIE, carpetesDelBloc, iconaDeCarpeta, nomDeCarpeta, opcionsDeCarpetes
} from './carpetes.js';

/* Només per a l'últim describe (la graella de Connectar): les funcions pures no en depenen.
   Els mateixos dobles que ConnectarSection.test.jsx, reduïts al que cal per a pintar i connectar. */
const mocks = vi.hoisted(() => ({
  t: (_clau, reserva) => reserva, crea: vi.fn(), update: vi.fn(), toast: vi.fn(),
  params: new URLSearchParams('item_id=samarreta-socdepoble&title=Samarreta&sectionId=mercat&targetUserId=socdepoble&autorTipus=entitat&author=S%C3%B3c%20de%20Poble'),
  identitat: { actor: { tipus: 'persona', nom: 'Pepa Soler' }, identitats: [{ tipus: 'persona', nom: 'Pepa Soler' }] },
  xat: { chatThreads: [], cercaMembres: vi.fn(async () => []), creaFil: vi.fn(), sendChatMessage: vi.fn() },
  mur: { status: 'ready', feedPosts: [], events: [], marketItems: [] }, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] }
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => () => {}, useSearchParams: () => [mocks.params], Link: ({ children }) => children }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }), useUIActionsOpcional: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => mocks.xat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('./NotesDataContext', () => ({
  useNotesData: () => ({ noteFolders: [], notes: [], creaNota: mocks.crea, updateNote: mocks.update, canCreate: true, config: {}, status: 'ready', error: null, refresh: () => {} })
}));
import ConnectarSection from '../connectar/ConnectarSection.jsx';

test('la carpeta de les connexions es diu «Safata d’Entrada» i conserva l’id f-connectats', () => {
  expect(CARPETA_CONNECTATS).toBe('f-connectats');
  expect(NOM_CARPETA_CONNECTATS).toBe('Safata d’Entrada');
  expect(NOM_CARPETA_CONNECTATS).toContain('’');
  const deLaLlavor = NOTE_FOLDERS_SEED.find((carpeta) => carpeta.id === 'f-connectats');
  expect(deLaLlavor).toEqual({ id: 'f-connectats', name: NOM_CARPETA_CONNECTATS, parentId: null });
  expect(NOTE_FOLDERS_SEED.some((carpeta) => carpeta.name === 'Connectats')).toBe(false);
});

/* v1.2.26 (Gauntlet G26, Lent 1 punt 21) · «En producció» (IDEA-358.1, Llibre Mestre, l. 3691)
   «no és […] Altres notes»: no porta la seua icona (NotebookPen), sinó SquarePen. */
test('la icona de la safata és Inbox, la d’«En producció» és SquarePen (no la d’«Altres notes») i una desconeguda, la de sèrie', () => {
  expect(iconaDeCarpeta(CARPETA_CONNECTATS)).toBe(Inbox);
  expect(iconaDeCarpeta(CARPETA_EN_PRODUCCIO)).toBe(SquarePen);
  expect(iconaDeCarpeta('f-notes')).toBe(NotebookPen);
  expect(iconaDeCarpeta(CARPETA_EN_PRODUCCIO)).not.toBe(iconaDeCarpeta('f-notes'));
  expect(iconaDeCarpeta('f-inventada')).toBe(Folder);
});

test('carpetesDelBloc: sense «Tot», i la safata i «En producció» sempre presents, davant d’«Altres notes» o al final', () => {
  const sencer = carpetesDelBloc([]);
  expect(sencer.some((carpeta) => carpeta.id === 'f-tot')).toBe(false);
  expect(sencer.find((carpeta) => carpeta.id === CARPETA_CONNECTATS).name).toBe(NOM_CARPETA_CONNECTATS);
  expect(sencer.find((carpeta) => carpeta.id === CARPETA_EN_PRODUCCIO).name).toBe('En producció');
  const senseSafata = carpetesDelBloc([{ id: 'f-mur', name: 'Mur' }, { id: 'f-notes', name: 'Altres notes' }]);
  expect(senseSafata.map((carpeta) => carpeta.id)).toEqual(['f-mur', CARPETA_CONNECTATS, CARPETA_EN_PRODUCCIO, 'f-notes']);
  expect(carpetesDelBloc([{ id: 'f-mur', name: 'Mur' }]).map((carpeta) => carpeta.id)).toEqual(['f-mur', CARPETA_CONNECTATS, CARPETA_EN_PRODUCCIO]);
  // Si el backend ja la porta, amb el seu nom, mana el del backend (l'id és el contracte).
  const delBackend = carpetesDelBloc([{ id: CARPETA_CONNECTATS, name: 'Nom del servidor' }, { id: CARPETA_EN_PRODUCCIO, name: 'Esborranys' }]);
  expect(delBackend).toEqual([{ id: CARPETA_CONNECTATS, name: 'Nom del servidor' }, { id: CARPETA_EN_PRODUCCIO, name: 'Esborranys' }]);
});

/* v1.2.26 (Gauntlet G26, Lent 1 punt 10) · El selector de carpeta de l'editor: «En producció»
   sí, i la Safata només si ja hi era (al servidor o a la llavor). */
test('carpetesDelBloc amb afigSafata: false afig només «En producció»; «Tot» mai', () => {
  const delServidor = [{ id: 'f-tot', name: 'Tot' }, { id: 'f-mur', name: 'Mur' }, { id: 'f-notes', name: 'Altres notes' }];
  expect(carpetesDelBloc(delServidor, { afigSafata: false }).map((carpeta) => carpeta.id)).toEqual(['f-mur', CARPETA_EN_PRODUCCIO, 'f-notes']);
  const ambSafata = [{ id: 'f-mur', name: 'Mur' }, { id: CARPETA_CONNECTATS, name: 'Safata d’Entrada' }];
  expect(carpetesDelBloc(ambSafata, { afigSafata: false }).map((carpeta) => carpeta.id)).toEqual(['f-mur', CARPETA_CONNECTATS, CARPETA_EN_PRODUCCIO]);
  // Sense carpetes del servidor, la llavor sencera menys «Tot», com sempre.
  expect(carpetesDelBloc([], { afigSafata: false })).toEqual(NOTE_FOLDERS_SEED.filter((carpeta) => carpeta.id !== 'f-tot'));
  // Per defecte, la columna de sempre: la Safata també.
  expect(carpetesDelBloc(delServidor).map((carpeta) => carpeta.id)).toEqual(['f-mur', CARPETA_CONNECTATS, CARPETA_EN_PRODUCCIO, 'f-notes']);
});

/* P1-22 (marató 261101_2143, B3-I18N §3.A) · El nom de les carpetes de sèrie
   es tradueix en pintar-lo i només si és encara el de la llavor; la llavor i
   les dades que es desen no canvien mai. */
const EN = createTranslator('en');

test('la llavor és dada i inclou «En producció» (f-produccio) entre Safata d’Entrada i Altres notes (IDEA-358)', () => {
  expect(NOTE_FOLDERS_SEED.map((carpeta) => [carpeta.id, carpeta.name])).toEqual([
    ['f-tot', 'Tot'], ['f-mur', 'Mur'], ['f-mercat', 'Mercat'], ['f-pobles', 'Pobles'], ['f-media', 'Multimèdia'],
    ['f-events', 'Esdeveniments'], ['f-mapa', 'Mapa'], ['f-connectats', 'Safata d’Entrada'], ['f-produccio', 'En producció'], ['f-notes', 'Altres notes']
  ]);
});

test('IDEA-358 · «En producció» es traduïx en les 5 llengües (ca/es/en/eu/gl)', () => {
  const carpeta = { id: CARPETA_EN_PRODUCCIO, name: 'En producció' };
  expect(nomDeCarpeta(carpeta, createTranslator('ca'))).toBe('En producció');
  expect(nomDeCarpeta(carpeta, createTranslator('es'))).toBe('En producción');
  expect(nomDeCarpeta(carpeta, createTranslator('en'))).toBe('In production');
  expect(nomDeCarpeta(carpeta, createTranslator('eu'))).toBe('Produkzioan');
  expect(nomDeCarpeta(carpeta, createTranslator('gl'))).toBe('En produción');
});

test('nomDeCarpeta tradueix el nom de sèrie i deixa intactes el reanomenat, el d’una carpeta pròpia i la Safata (D-1)', () => {
  expect(nomDeCarpeta({ id: 'f-mur', name: 'Mur' }, EN)).toBe('Wall');
  expect(nomDeCarpeta({ id: 'f-media', nom: 'Multimèdia' }, EN)).toBe('Media');
  expect(nomDeCarpeta({ id: 'f-notes', name: 'Altres notes' }, createTranslator('eu'))).toBe('Beste oharrak');
  expect(nomDeCarpeta({ id: 'f-events', name: 'Esdeveniments' }, createTranslator('es'))).toBe('Eventos');
  expect(nomDeCarpeta({ id: 'f-mur', name: 'El meu mur' }, EN)).toBe('El meu mur');
  expect(nomDeCarpeta({ id: 'x', name: 'Mur' }, EN)).toBe('Mur');
  expect(nomDeCarpeta({ id: CARPETA_CONNECTATS, name: NOM_CARPETA_CONNECTATS }, EN)).toBe('Safata d’Entrada');
  // Un id que no és propi de l'objecte (toString) no és cap carpeta de sèrie.
  expect(nomDeCarpeta({ id: 'toString', name: 'Mur' }, EN)).toBe('Mur');
  // Sense traductor (o amb un que no és una funció), el nom tal com es va desar.
  expect(nomDeCarpeta({ id: 'f-mur', name: 'Mur' })).toBe('Mur');
  expect(nomDeCarpeta({ id: 'f-mur', name: 'Mur' }, 'en')).toBe('Mur');
  expect(nomDeCarpeta(undefined, EN)).toBeUndefined();
});

test('Llei del Píxel · amb el traductor valencià, cada carpeta de la llavor es pinta amb el nom que porta', () => {
  const CA = createTranslator('ca');
  for (const carpeta of NOTE_FOLDERS_SEED) expect(nomDeCarpeta(carpeta, CA)).toBe(carpeta.name);
  expect(Object.keys(NOMS_CARPETES_DE_SERIE)).not.toContain(CARPETA_CONNECTATS);
});

test('opcionsDeCarpetes pinta traduït sense tocar l’entrada; carpetesDelBloc torna les dades crues', () => {
  const entrada = [{ id: 'f-mur', name: 'Mur', parentId: null }, { id: 'p1', name: 'Receptes', parentId: 'f-mur' },
    { id: 'f-notes', name: 'Les meues notes', parentId: null }];
  const abans = JSON.stringify(entrada);
  expect(opcionsDeCarpetes(entrada, EN)).toEqual([
    { id: 'f-mur', nom: 'Wall', parentId: null }, { id: 'p1', nom: 'Receptes', parentId: 'f-mur' },
    { id: CARPETA_CONNECTATS, nom: 'Safata d’Entrada', parentId: null },
    { id: CARPETA_EN_PRODUCCIO, nom: 'In production', parentId: null },
    { id: 'f-notes', nom: 'Les meues notes', parentId: null }
  ]);
  expect(JSON.stringify(entrada)).toBe(abans);
  const crues = carpetesDelBloc(entrada);
  expect(crues[0]).toBe(entrada[0]);
  expect(crues.map((carpeta) => carpeta.name)).toEqual(['Mur', 'Receptes', 'Safata d’Entrada', 'En producció', 'Les meues notes']);
  // Sense traductor, les opcions de sempre.
  expect(opcionsDeCarpetes(entrada).map((opcio) => opcio.nom)).toEqual(['Mur', 'Receptes', 'Safata d’Entrada', 'En producció', 'Les meues notes']);
});

/* ARB-M05-01 (C9, C10) · Connectar pinta el nom de sèrie traduït a la graella
   «On arriba» i al botó i al toast de connectar, i la nota es crea amb l'id
   de sempre: el nom traduït no arriba mai a les dades. Sense este cas, tornar
   a pintar folder.name passava en verd. */
describe('Connectar · la graella de carpetes en la llengua de l’app', () => {
  afterEach(() => {
    cleanup();
    mocks.t = (_clau, reserva) => reserva;
  });

  test('en anglés, «Wall» a la graella, al botó i al toast; es crea a f-mur', async () => {
    mocks.t = EN;
    mocks.crea.mockReset().mockResolvedValue({ id: 'n-9', revision: 0 });
    mocks.update.mockReset().mockResolvedValue({ id: 'n-9', revision: 1 });
    mocks.toast.mockReset();
    const { container } = render(createElement(ConnectarSection));
    const graella = within(container.querySelector('.sdp-connectar__carpetes'));
    expect(graella.queryByRole('button', { name: 'Mur' })).toBeNull();
    expect(graella.getByRole('button', { name: NOM_CARPETA_CONNECTATS })).toBeTruthy();
    fireEvent.click(graella.getByRole('button', { name: 'Wall' }));
    await act(async () => { fireEvent.click(within(container).getByRole('button', { name: 'Connect to «Wall»' })); });
    await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
    expect(mocks.crea.mock.calls[0][0]).toMatchObject({ folderId: 'f-mur' });
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('«Wall»'), 'success'));
  });

  test('amb el traductor de reserva, el nom de la llavor de sempre', () => {
    const { container } = render(createElement(ConnectarSection));
    const graella = within(container.querySelector('.sdp-connectar__carpetes'));
    expect(graella.getByRole('button', { name: 'Mur' })).toBeTruthy();
    expect(graella.queryByRole('button', { name: 'Wall' })).toBeNull();
  });
});
