/* Gauntlet 261030 (Fase 3, TC3.2; troballa P1 `traduir-contingut-de-membres`)
   · Les llistes del poble (/mur, /mercat i /calendari) només es traduïxen si
   TOT el que pinten és públic (traduccio/visibilitatTraduible.js): una sola
   publicació del veïnat (section_submissions, ownerUserId encara que siga
   null; només per als membres) apaga Traduir a tota la pàgina, i el
   calendari, a més, amb qualsevol font de fora que la pàgina no pot garantir
   (l'agenda de Sollutia o els calendaris de Google). El botó no canvia (Llei
   del Píxel): PageFrame avisa (AVIS_PAGINA_SENSE_TRADUCCIO). Amb tot públic i
   sense servei de traducció, l'avís de sempre (AVIS_SENSE_TRADUCTOR).
   Router de veres (MemoryRouter), com CalendariSection.test.jsx. */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const mocks = vi.hoisted(() => ({
  t: (_, alternativa) => alternativa, toast: vi.fn(), mur: {}, capacitats: new Set(), gcal: false
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'loading', pageCopy: {}, towns: [] }) }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  loadActesAgenda: async () => []
}));
vi.mock('../calendari/fonts/configFonts.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, configFontsDeLEntorn: (...args) => ({ ...original.configFontsDeLEntorn(...args), configurades: mocks.gcal }) };
});
import MurSection from './MurSection.jsx';
import MercatSection from '../mercat/MercatSection.jsx';
import CalendariSection from '../calendari/CalendariSection.jsx';
import { AVIS_PAGINA_SENSE_TRADUCCIO } from '../../components/universal/PageFrame.jsx';
import { AVIS_SENSE_TRADUCTOR } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';

const CREAT = '2026-10-20T10:00:00.000Z';
const publicacio = { id: 'p-publica', type: 'feed', title: 'Festa inventada', content: 'Text públic inventat.', created_at: CREAT };
const delVeinat = { id: 'p-veinat', type: 'feed', title: 'Sopar del veïnat inventat', content: 'Text del veïnat.', created_at: CREAT, ownerUserId: null };
const producte = { id: 'm-public', type: 'market', title: 'Cistella inventada', description: 'Producte inventat.', created_at: CREAT };
const producteDelVeinat = { ...producte, id: 'm-veinat', owner_user_id: 'u-1' };

const fixaMur = ({ feed = [], mercat = [], actes = [] } = {}) => {
  mocks.mur = {
    status: 'ready', error: null, refresh: () => {},
    feedPosts: feed, sortedFeedPosts: feed, marketItems: mercat, sortedMarketItems: mercat, events: actes, sortedEvents: actes
  };
};
function avisDeTraduir(Seccio, ruta) {
  const { container } = render(<MemoryRouter rutaInicial={ruta}><Seccio /></MemoryRouter>);
  const boto = container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  expect(boto, `${ruta}: el botó hi és (Llei del Píxel)`).toBeTruthy();
  fireEvent.click(boto);
  const avis = mocks.toast.mock.calls.at(-1)?.[0];
  cleanup();
  return avis;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.capacitats = new Set();
  mocks.gcal = false;
});
afterEach(cleanup);

test('/mur: tot públic, Traduir hi és; una publicació del veïnat l’apaga a tota la pàgina', () => {
  fixaMur({ feed: [publicacio], mercat: [producte] });
  expect(avisDeTraduir(MurSection, '/mur')).toBe(AVIS_SENSE_TRADUCTOR);
  fixaMur({ feed: [publicacio, delVeinat], mercat: [producte] });
  expect(avisDeTraduir(MurSection, '/mur')).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
  fixaMur({ feed: [publicacio], mercat: [producteDelVeinat] });
  expect(avisDeTraduir(MurSection, '/mur')).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});

test('/mercat: tot públic, Traduir hi és; un producte del veïnat l’apaga', () => {
  fixaMur({ mercat: [producte] });
  expect(avisDeTraduir(MercatSection, '/mercat')).toBe(AVIS_SENSE_TRADUCTOR);
  fixaMur({ mercat: [producte, producteDelVeinat] });
  expect(avisDeTraduir(MercatSection, '/mercat')).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});

test('/calendari: tot públic i cap font de fora, Traduir hi és; el veïnat, l’agenda o Google l’apaguen', () => {
  const acte = { id: 'e-public', type: 'event', title: 'Ball inventat', start_date: '2026-10-25T18:00:00.000Z', created_at: CREAT };
  fixaMur({ feed: [publicacio], actes: [acte] });
  expect(avisDeTraduir(CalendariSection, '/calendari')).toBe(AVIS_SENSE_TRADUCTOR);
  fixaMur({ feed: [publicacio], actes: [{ ...acte, ownerUserId: null }] });
  expect(avisDeTraduir(CalendariSection, '/calendari')).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
  fixaMur({ feed: [publicacio], actes: [acte] });
  mocks.capacitats = new Set(['agenda']);
  expect(avisDeTraduir(CalendariSection, '/calendari')).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
  mocks.capacitats = new Set();
  mocks.gcal = true;
  expect(avisDeTraduir(CalendariSection, '/calendari')).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});
