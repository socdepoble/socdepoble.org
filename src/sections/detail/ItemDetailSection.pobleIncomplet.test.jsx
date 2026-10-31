/**
 * VQ · Fase 3a de l'eina de pobles nous (261030; disseny
 * nit/viquipedia_disseny.md §4.3 passos 3a-1 i 3a-2, i §6.1) · La pàgina
 * d'un poble (/pobles/<id> i la pàgina viva del Xat):
 *   · fitxa completa: cap petició, cap import de la cau ni del panell, cap
 *     node nou, i les mateixes props de capçalera de sempre (Llei del Píxel);
 *   · fitxa incompleta amb la proposta a la cau: la capçalera n'omple els
 *     buits (entradilla, comarca) sense cap petició i sense cap foto de
 *     Commons, i el cos porta el panell de la Viquipèdia, diferit.
 */
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pagina: null, item: null, towns: [], t: (_, alternativa) => alternativa, seo: vi.fn(), cauImportada: 0, panellImportat: 0
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: 'pobles', itemId: mocks.item?.id }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: `/pobles/${mocks.item?.id}`, search: '', state: null }),
  Navigate: () => null,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
/* La pàgina de mentides: anota les props i pinta el cos (on va el panell). */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => { mocks.pagina = props; return <div data-pagina="">{props.children}</div>; }
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => ({ events: [], feedPosts: [], marketItems: [], status: 'ready' }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: mocks.towns, status: 'ready' }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [], status: 'ready' }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [], status: 'ready' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => ({ currentUser: null, estat: 'fora', rol: null }),
  useSessioOpcional: () => ({ currentUser: null, estat: 'fora', rol: null })
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
/* Les pestanyes del poble no són d'esta prova. */
vi.mock('../pobles/PublicacionsDelPoble.jsx', () => ({ default: () => null }));
vi.mock('../pobles/cauDeViquipedia.js', async (original) => {
  mocks.cauImportada += 1;
  return original();
});
vi.mock('../pobles/PanellDeViquipedia.jsx', async (original) => {
  mocks.panellImportat += 1;
  return original();
});

import ItemDetailSection, { VistaDelPoble } from './ItemDetailSection.jsx';
import { TOWNS } from '../pobles/townsContent.js';
import { clauDeViquipedia } from '../pobles/fitxaDelPoble.js';

const INCOMPLETA = Object.freeze({ id: 'vilanova-de-prova', title: 'Vilanova de Prova', provincia: 'Alacant' });
const DTO = Object.freeze({
  estat: 'parcial', id: 'vilanova-de-prova', title: 'Vilanova de Prova', author: 'Gent de Vilanova de Prova',
  content: 'Vilanova de Prova és un municipi inventat per a les proves.', provincia: 'Alacant', comarca: 'L’Alcoià',
  population: '120 hab', lat: 38.6, lng: -0.4, wikidata_id: 'Q1', wikipedia_title: 'Vilanova de Prova',
  copyright: 'Text: Viquipèdia (CC BY-SA 4.0)',
  imatges: { hero: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/A.jpg/1920px-A.jpg', fitxer: 'A.jpg', amplada: 3000, alcada: 2000 }, avatar: null, reserva: null }
});

let fetch;
beforeEach(() => {
  mocks.pagina = null;
  mocks.seo.mockReset();
  fetch = vi.fn(() => { throw new Error('cap petició'); });
  vi.stubGlobal('fetch', fetch);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('fitxa completa (la llavor): Llei del Píxel', () => {
  test('cap petició, cap import de la cau ni del panell, cap IndexedDB, i la capçalera de sempre', async () => {
    const obri = vi.fn();
    vi.stubGlobal('indexedDB', { open: obri });
    const torre = TOWNS[0];
    mocks.towns = TOWNS;
    mocks.item = torre;
    const { container } = render(<ItemDetailSection />);
    await new Promise((resol) => { setTimeout(resol, 20); });
    expect(mocks.cauImportada).toBe(0);
    expect(mocks.panellImportat).toBe(0);
    expect(obri).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.pagina.lead).toBe(torre.content);
    expect(mocks.pagina.heroImage).toBe(torre.image_url);
    expect(mocks.pagina.labels.map((l) => l.text)).toEqual(['Poble', torre.provincia, torre.comarca]);
    expect(container.querySelector('section.sdp-prose')).toBeNull();
    // La pàgina viva del Xat, igual.
    render(<VistaDelPoble pobleId={torre.id} />);
    await new Promise((resol) => { setTimeout(resol, 20); });
    expect(mocks.cauImportada).toBe(0);
    expect(mocks.panellImportat).toBe(0);
  });
});

describe('fitxa incompleta amb la proposta a la cau', () => {
  test('la capçalera omple els buits sense cap petició ni foto de Commons, i el cos porta el panell', async () => {
    const { cauDeViquipedia } = await import('../pobles/cauDeViquipedia.js');
    await cauDeViquipedia().desa(clauDeViquipedia(INCOMPLETA), DTO);
    mocks.towns = [INCOMPLETA];
    mocks.item = INCOMPLETA;
    const { container } = render(<ItemDetailSection />);
    await waitFor(() => expect(mocks.pagina.lead).toBe(DTO.content));
    expect(mocks.pagina.labels.map((l) => l.text)).toEqual(['Poble', 'Alacant', 'L’Alcoià']);
    expect(mocks.pagina.title).toBe('Gent de Vilanova de Prova');
    expect(mocks.pagina.heroImage ?? null).toBeNull();
    expect(JSON.stringify(mocks.pagina.authorAvatar ?? null)).not.toContain('wikimedia');
    // El <head>: la descripció és l'entradilla; cap imatge de Commons.
    const seo = mocks.seo.mock.calls.at(-1)[0];
    expect(seo.description).toBe(DTO.content);
    expect(JSON.stringify(seo.image ?? null)).not.toContain('wikimedia');
    // El panell, diferit, amb els crèdits; les fotos, només amb el sí.
    await waitFor(() => expect(container.querySelector('section.sdp-prose h3')).not.toBeNull());
    expect(mocks.panellImportat).toBe(1);
    expect(container.querySelector('figure')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('la pàgina viva del Xat també s’hidrata', async () => {
    const { cauDeViquipedia } = await import('../pobles/cauDeViquipedia.js');
    await cauDeViquipedia().desa(clauDeViquipedia(INCOMPLETA), DTO);
    mocks.towns = [INCOMPLETA];
    render(<VistaDelPoble pobleId={INCOMPLETA.id} />);
    await waitFor(() => expect(mocks.pagina.lead).toBe(DTO.content));
    expect(fetch).not.toHaveBeenCalled();
  });
});
