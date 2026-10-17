/* Gauntlet 261017 (WP7a; C02 de l'auditoria Codex) · L'extracte de la llista
   del Bloc davant d'una llavor. NotesSection · toWorkspaceNote amaga l'extracte
   amb dues reserves: el contracte compartit (llavorNota.js · esLlavorDeNota) i
   la de text pla de la llavor d'abans («Heading 3 (punxa…»). Es volia deixar
   només el contracte si la llista quedava idèntica (Llei del Píxel). No hi
   queda: una nota que comença amb la llavor d'abans i porta text propi no és
   cap llavor per al contracte, i sense la reserva de text la seua fitxa
   passaria de l'entradilla de reserva al text pla de la llavor. Per això la
   reserva es queda, i esta prova ho fixa amb la fitxa de veres (NotaFitxa,
   tancada), la que es veu a la llista. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ model: null, props: null, notes: [] }));
vi.mock('./NotesContext', async (importOriginal) => ({ ...await importOriginal(), useNotes: () => ({
  notes: mocks.notes, noteFolders: [], status: 'ready', canCreate: true, obriConfiguracioNotes: () => {}, creaNota: async () => null
}) }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'seed' } }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()], useNavigate: () => vi.fn(), Link: 'a'
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: null, actorId: null }) }));
vi.mock('../../app/contexts/SessionContext.jsx', async (importOriginal) => ({ ...await importOriginal(), useSession: () => ({ currentUser: null }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [] }) }));
/* L'espai de treball fals només desa el model i les props: la fitxa es pinta
   a part, amb el renderItem del Bloc. */
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({ UniversalWorkspace: (props) => {
  mocks.model = props.model;
  mocks.props = props;
  return null;
} }));
vi.mock('./NotesDetail.jsx', () => ({ default: () => null }));
import NotesSection from './NotesSection.jsx';
import { NotaFitxa } from './NotaFitxa.jsx';
import { LLAVOR_NOTA, LLAVOR_NOTA_ANTIGA, esLlavorDeNota, formaCompacta } from './llavorNota.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { TEXTOS_LLAVOR } from '../../components/universal/textosLlavor.js';

afterEach(() => {
  cleanup();
  mocks.notes = [];
});

/* La nota com la dona NotesContext: el text pla ix del cos (extractPlainText). */
const nota = (id, content) => ({ id, title: 'Hort', content, plainText: extractPlainText(content, Infinity), formattedDate: '17/10/26' });

/* El model de la llista i el subtítol visible de la fitxa tancada de cada nota. */
function llista(notes) {
  mocks.notes = notes;
  const { unmount } = render(<NotesSection />);
  // Només les notes de la prova, en el seu ordre (la llista hi pot afegir les seues).
  const items = notes.map(({ id }) => mocks.model.items.find((item) => item.id === id));
  unmount();
  return items.map((item) => {
    const fitxa = mocks.props.renderItem({ item, active: false, onSelect: () => {} });
    expect(fitxa.type).toBe(NotaFitxa);
    const { container, unmount: desmunta } = render(fitxa);
    const subtitol = container.querySelector('.sdp-gestor-fitxa__subtitol').textContent;
    desmunta();
    return { id: item.id, excerpt: item.excerpt, subtitol };
  });
}

describe('Gauntlet 261017 · l’extracte de la llista amb una llavor', () => {
  test('una llavor verge (la d’ara o la d’abans, escrita o en la forma de TipTap) no fa d’extracte: la fitxa pinta l’entradilla de reserva', () => {
    const verges = [LLAVOR_NOTA, formaCompacta(LLAVOR_NOTA), LLAVOR_NOTA_ANTIGA, formaCompacta(LLAVOR_NOTA_ANTIGA)];
    expect(verges.every(esLlavorDeNota)).toBe(true);
    const fitxes = llista(verges.map((content, i) => nota(`v${i}`, content)));
    expect(fitxes.map((f) => f.excerpt)).toEqual(['', '', '', '']);
    expect(fitxes.map((f) => f.subtitol)).toEqual(Array(4).fill(TEXTOS_LLAVOR.entradilla));
  });

  test('la llavor d’abans amb text propi no és cap llavor per al contracte, i la reserva de text pla és la que la deixa com estava', () => {
    const barrejada = `${LLAVOR_NOTA_ANTIGA}<p>Comprar planter de tomaca</p>`;
    expect(esLlavorDeNota(barrejada)).toBe(false);
    expect(extractPlainText(barrejada, Infinity).startsWith('Heading 3 (punxa')).toBe(true);
    const [fitxa] = llista([nota('b1', barrejada)]);
    // Amb només el contracte, l'extracte seria el text pla de la llavor: la llista canviaria.
    expect(fitxa.excerpt).toBe('');
    expect(fitxa.subtitol).toBe(TEXTOS_LLAVOR.entradilla);
  });

  test('una nota pròpia, i la llavor d’ara amb text propi, ensenyen el seu text', () => {
    const ambText = `${LLAVOR_NOTA}<p>Comprar planter de tomaca</p>`;
    expect(esLlavorDeNota(ambText)).toBe(false);
    const fitxes = llista([nota('p1', '<p>Comprar planter</p>'), nota('p2', ambText)]);
    expect(fitxes[0]).toEqual({ id: 'p1', excerpt: 'Comprar planter', subtitol: 'Comprar planter' });
    expect(fitxes[1].excerpt).toBe(extractPlainText(ambText, Infinity));
    expect(fitxes[1].subtitol).toBe(fitxes[1].excerpt);
  });
});
