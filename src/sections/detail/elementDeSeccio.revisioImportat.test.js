/**
 * D-R6-1 (Onada R6, Bloc 3; decisió de MarIA) · Un article importat (el camí
 * de reserva de trobaElement: trobaArticleImportatComAPublicacio) també porta
 * la revisió editorial desada des de /notes (revisionsEditorials.js).
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ article: null }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({}) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({}) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({}) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva }) }));
vi.mock('../../utils/articlesImportatsMandros.js', () => ({
  trobaArticleImportatComAPublicacio: (clau) => (mocks.article && String(mocks.article.id) === String(clau) ? mocks.article : null),
  useEstatArticleImportat: () => null
}));

import { trobaElement } from './elementDeSeccio.js';
import { _reiniciaRevisionsEditorialsPerAProves, desaRevisioEditorial } from '../../data/revisionsEditorials.js';

const MUR = { listPath: '/mur', items: [{ id: 'una-altra', title: 'Una altra' }] };
const ARTICLE = Object.freeze({ id: 'article-importat', title: 'Article importat', content: '<p>Original.</p>' });

beforeEach(() => {
  _reiniciaRevisionsEditorialsPerAProves();
  mocks.article = ARTICLE;
});
afterEach(() => { _reiniciaRevisionsEditorialsPerAProves(); });

test('sense revisió, el MATEIX article importat', () => {
  expect(trobaElement(MUR, 'article-importat')).toBe(ARTICLE);
});

test('amb revisió desada des de /notes, el detall de l’article importat la porta', () => {
  expect(desaRevisioEditorial('mur', 'article-importat', { title: 'Article revisat', content: '<p>Revisat.</p>' })).toBe(true);
  expect(trobaElement(MUR, 'article-importat')).toMatchObject({ id: 'article-importat', title: 'Article revisat', content: '<p>Revisat.</p>' });
  expect(ARTICLE.title).toBe('Article importat');
});

test('una revisió de l’agenda amb el mateix id no toca l’article del Mur; cap article, null', () => {
  desaRevisioEditorial('events', 'article-importat', { title: 'No' });
  expect(trobaElement(MUR, 'article-importat')).toBe(ARTICLE);
  mocks.article = null;
  expect(trobaElement(MUR, 'article-importat')).toBeNull();
});
