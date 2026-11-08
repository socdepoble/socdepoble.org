/* Ordre explícita del Mestre (R53, 261108): Anatomia rural és una porta a
   l'article COMPLET del Mur. S'usa l'àlies canònic i Navigate replace de
   PageDetailSection; no hi ha una segona còpia curta ni HTML duplicat. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  Link, MemoryRouter, Route, RouterProvider, Routes, useLocation, useNavigate, useRouter
} from '../../app/contexts/RouterContext';

const mocks = vi.hoisted(() => ({ language: 'ca', coreStatus: 'ready' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, reserva) => reserva, language: mocks.language })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: mocks.coreStatus, towns: [], pages: [], pageCopy: {} })
}));
vi.mock('../mur/MurContext', () => ({
  useMur: () => ({ status: 'ready', events: [], marketItems: [], feedPosts: [POST] })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [], status: 'ready' }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [], status: 'ready' }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => ({ currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }),
  useSessioOpcional: () => ({ currentUser: null, estat: 'fora', rol: null, esSuperadmin: false })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

import PageDetailSection from './PageDetailSection.jsx';
import ItemDetailSection from './ItemDetailSection.jsx';
import { resolvePageSlugPath } from '../../config/navigation.js';
import { paginaDeRuta, pageKeyDeRuta } from '../text/paginaDeText.js';
import {
  NOVES_TECNOLOGIES_CULTURA_RURAL_HTML as HTML,
  NOVES_TECNOLOGIES_CULTURA_RURAL_POST as POST,
  NOVES_TECNOLOGIES_FONTS, NOVES_TECNOLOGIES_VIDEOS
} from '../mur/articles/novesTecnologiesCulturaRuralContent.js';

const ALIAS = '/page/anatomia-rural';
const ARTICLE = '/mur/noves-tecnologies-aplicades-a-la-cultura-rural';
function Sonda() {
  const { pathname } = useLocation();
  const { index } = useRouter();
  const navigate = useNavigate();
  return <>
    <output data-testid="ruta">{pathname}</output>
    <output data-testid="index">{index}</output>
    <Link to={ALIAS}>Obrir Anatomia</Link>
    <button type="button" onClick={() => navigate(-1)}>Arrere de prova</button>
    <button type="button" onClick={() => navigate(1)}>Avant de prova</button>
  </>;
}
const arbre = <>
  <Routes>
    <Route path="/page/:slug" element={<PageDetailSection />} />
    <Route path="/:sectionId/:itemId" element={<ItemDetailSection />} />
    {/* Rutes de prova: un títol amb role i aria-level, no una etiqueta H1 literal,
        perquè el Design Guard (h1-multiple, h1-outside-header) llig també les proves. */}
    <Route path="/mur" element={<p role="heading" aria-level={1}>Mur de prova</p>} />
    <Route path="/" element={<p role="heading" aria-level={1}>Inici de prova</p>} />
  </Routes>
  <Sonda />
</>;
const visita = (ruta = ALIAS, basename = '') => render(<MemoryRouter rutaInicial={ruta} basename={basename}>{arbre}</MemoryRouter>);
const rutaActual = () => screen.getByTestId('ruta').textContent;

async function comprovaArticleComplet() {
  await waitFor(() => expect(rutaActual()).toBe(ARTICLE));
  const cos = await waitFor(() => {
    const article = document.querySelector('.noves-tecnologies-rural article.detail-content');
    expect(article).not.toBeNull();
    return article;
  // El primer import() real pot travessar el segon de marge per defecte
  // durant transformacions paral·leles en CI. Continuem esperant el cos
  // complet real amb un límit explícit, sense substituir-lo per un mock.
  }, { timeout: 5000 });
  expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([POST.title]);
  const canonic = new DOMParser().parseFromString(HTML, 'text/html');
  expect([...cos.querySelectorAll('h3')].map((h) => h.textContent))
    .toEqual([...canonic.querySelectorAll('h3')].map((h) => h.textContent));
  expect(cos.querySelectorAll('p').length).toBeGreaterThanOrEqual(canonic.querySelectorAll('p').length);
  expect(cos.textContent).toContain('Què era un pou de neu i per a què servia');
  expect(cos.textContent).toContain('Bibliografia no consultada');
  for (const [, , href] of NOVES_TECNOLOGIES_FONTS) expect(cos.querySelector(`a[href="${href}"]`)).not.toBeNull();
  for (const video of NOVES_TECNOLOGIES_VIDEOS) {
    expect(screen.getByRole('button', { name: `Veure el vídeo (YouTube) ${video.titol}` })).toBeTruthy();
  }
  await waitFor(() => expect(document.querySelectorAll('.pou-neu-card')).toHaveLength(1), { timeout: 10000 });
  expect(document.querySelectorAll('.noves-tecnologies-rural')).toHaveLength(1);
  expect(document.querySelectorAll('.noves-tecnologies-rural__veu')).toHaveLength(1);
  expect(document.querySelector('.cms-preview')).toBeNull();
  expect(document.querySelector('section.anatomia')).toBeNull();
  return cos;
}

beforeEach(() => { mocks.language = 'ca'; mocks.coreStatus = 'ready'; });
afterEach(() => { cleanup(); delete window.Capacitor; window.history.replaceState(null, '', '/'); });

describe('/page/anatomia-rural → l’article complet', () => {
  test('és un àlies de publicació; el resolvedor de pàgines breus no en fabrica cap', () => {
    expect(resolvePageSlugPath('anatomia-rural')).toBe(ARTICLE);
    expect(pageKeyDeRuta(ALIAS)).toBeNull();
    expect(paginaDeRuta(ALIAS)).toBeNull();
    expect(resolvePageSlugPath('projecte')).toBe('/projecte');
    expect(resolvePageSlugPath('herbari')).toBeNull();
  });

  test.each([false, true])('nativa=%s: H1, cos sencer, dos documentals, fonts, veu i visor únics', async (nativa) => {
    if (nativa) window.Capacitor = { isNativePlatform: () => true };
    visita();
    await comprovaArticleComplet();
    expect(screen.getByTestId('index').textContent).toBe('0');
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s: la llengua de la interfície no recupera la versió breu', async (language) => {
    mocks.language = language;
    visita();
    await comprovaArticleComplet();
  });

  test('la ruta canònica i l’àlies carreguen el mateix cos complet', async () => {
    visita(ARTICLE);
    const directe = (await comprovaArticleComplet()).textContent;
    cleanup();
    visita(ALIAS);
    expect((await comprovaArticleComplet()).textContent).toBe(directe);
  });

  test('replace evita un bucle en Arrere i Avant després d’obrir l’àlies', async () => {
    visita('/mur');
    fireEvent.click(screen.getByRole('link', { name: 'Obrir Anatomia' }));
    await comprovaArticleComplet();
    expect(screen.getByTestId('index').textContent).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' }));
    expect(rutaActual()).toBe('/mur');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Mur de prova');
    fireEvent.click(screen.getByRole('button', { name: 'Avant de prova' }));
    await comprovaArticleComplet();
    expect(screen.getByTestId('index').textContent).toBe('1');
  });

  test('en memòria amb base d’amfitrió, la navegació queda dins de l’app i no altera la URL amfitriona', async () => {
    const host = window.location.href;
    visita(ALIAS, '/poble');
    await comprovaArticleComplet();
    expect(screen.getByRole('link', { name: 'Obrir Anatomia' }).getAttribute('href')).toBe(`/poble${ALIAS}`);
    expect(window.location.href).toBe(host);
  });

  test('RouterProvider amb base reemplaça l’àlies dins de la base', async () => {
    window.history.replaceState(null, '', `/poble${ALIAS}`);
    const longitud = window.history.length;
    render(<RouterProvider basename="/poble">{arbre}</RouterProvider>);
    await comprovaArticleComplet();
    expect(window.location.pathname).toBe(`/poble${ARTICLE}`);
    expect(window.history.length).toBe(longitud);
  });

  test('l’àlies no espera ni mostra el PAGE_COPY breu mentre Core encara carrega', async () => {
    mocks.coreStatus = 'loading';
    visita();
    await comprovaArticleComplet();
  });

  test('una altra pàgina continua sent la pàgina pròpia i no munta l’article', () => {
    visita('/page/drets-autor');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe("Drets d'autor");
    expect(rutaActual()).toBe('/page/drets-autor');
    expect(document.querySelector('.noves-tecnologies-rural')).toBeNull();
  });
});
