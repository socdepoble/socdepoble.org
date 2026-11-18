import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ items: [
  { id: 'capitol', title: 'nom_del_fitxer', subtitle: 'Subtítol del llibre', content: '# Títol **viu**.\n\nEntradilla amb **veu**.\n\n## Cos\nText', mur: true,
    image: '/assets/portada.jpg', imageAlt: 'Portada', tags: ['Documentació'], date: '2026-01-01T00:00:00Z', updated: '2026-11-17T19:15:00Z' },
  { id: 'nomes-llibre', title: 'Només llibre', content: '# Només llibre', mur: false },
  { id: 'privat', content: '# Privat', mur: true, attributes: { visibility: 'private' } },
  { id: 'capitol', title: 'Duplicat', content: '# Duplicat', mur: true }
] }));
vi.mock('./wikiManifest.js', () => ({ wikiManifest: { items: m.items } }));
import { carregaCapitolsWiki, preparaCapitolsWiki } from './wikiAlMur.js';
import { extreuEditorial } from '../sections/wiki-de-poble/parseMarkdown.js';
import { desaRevisioEditorial, oblidaRevisioEditorial, revisaElement, revisaLlista, subscriuRevisionsEditorials, _buidaRevisionsDelNavegadorPerAProves } from './revisionsEditorialsDelNavegador.js';
import { capturaVisibilitatMur, esVisibleAlMur } from './visibilitatMur.js';
import { CONTRACTE_NUCLI } from './contracte.js';
import * as port from './backendPort.js';
import { STORAGE_PREFIX } from '../config/storage.js';

beforeAll(carregaCapitolsWiki);
beforeEach(_buidaRevisionsDelNavegadorPerAProves);
afterEach(() => { port.destroy(); vi.restoreAllMocks(); });

test('mateixa capçalera, portada, etiquetes, dates i URL del llibre; ni privat ni duplicat', () => {
  const before = JSON.stringify(m.items), rows = preparaCapitolsWiki(m.items, extreuEditorial);
  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({ id: 'wiki:capitol', wikiId: 'capitol', title: 'Títol viu', subtitle: 'Subtítol del llibre', entradilla: 'Entradilla amb **veu**.',
    image: '/assets/portada.jpg', imageAlt: 'Portada', tags: ['Documentació'], created_at: m.items[0].date,
    updated_at: m.items[0].updated, publish_date: m.items[0].updated, mainHref: '/wikidepoble?item=capitol' });
  expect(JSON.stringify(m.items)).toBe(before);
  expect(preparaCapitolsWiki([{ id: 'id amb espais', mur: true, content: '# T' }], extreuEditorial)[0].mainHref).toBe('/wikidepoble?item=id%20amb%20espais');
});

test('opt-in estricte: true/false editorial sobreescriu frontmatter i es pot oblidar sense alterar el llibre', () => {
  expect(revisaLlista([], 'mur').map(i => i.id)).toEqual(['wiki:capitol']);
  const callback = vi.fn(), unsubscribe = subscriuRevisionsEditorials(callback);
  try {
    expect(desaRevisioEditorial('mur', 'wiki:capitol', { mostrarAlMur: false })).toBe(true);
    expect(revisaLlista([], 'mur')).toEqual([]);
    expect(desaRevisioEditorial('mur', 'wiki:nomes-llibre', { mostrarAlMur: true })).toBe(true);
    expect(revisaLlista([], 'mur').map(i => i.id)).toEqual(['wiki:nomes-llibre']);
    expect(callback).toHaveBeenCalledTimes(2);
    oblidaRevisioEditorial('mur', 'wiki:capitol');
    expect(revisaLlista([], 'mur').map(i => i.id)).toEqual(['wiki:capitol', 'wiki:nomes-llibre']);
    expect(m.items[0].mur).toBe(true); expect(m.items[1].mur).toBe(false); expect(m.items[0].content).toContain('## Cos');
  } finally { unsubscribe(); }
});

test('una revisió true mai publica un ítem privat; el catàleg no el conté', () => {
  desaRevisioEditorial('mur', 'wiki:privat', { mostrarAlMur: true });
  expect(revisaLlista([], 'mur').some(i => i.wikiId === 'privat')).toBe(false);
  for (const metadata of [{ visibility: 'private' }, { status: 'arxivat' }, { status: 'quarantena' }, { private: true }, { draft: true }, { isDraft: true }, { public: false }]) {
    expect(preparaCapitolsWiki([{ id: 'bloquejat', content: '# Secret', mur: true, attributes: metadata }], extreuEditorial)).toEqual([]);
  }
  expect(preparaCapitolsWiki([{ id: 'bloquejat', attributes: null, mur: true }], extreuEditorial)).toEqual([]);
});

test('booleans strictes també després de storage, sense convertir "false", 0 ni null', () => {
  for (const mostrarAlMur of ['false', 0, null, [], {}]) {
    expect(desaRevisioEditorial('mur', 'wiki:nomes-llibre', { mostrarAlMur })).toBe(false);
    expect(() => capturaVisibilitatMur({ mostrarAlMur })).toThrow();
  }
  expect(capturaVisibilitatMur({ ocultarDelMur: true })).toEqual({ mostrarAlMur: false, ocultarDelMur: true });
  expect(() => capturaVisibilitatMur({ mostrarAlMur: true, ocultarDelMur: true })).toThrow();
  expect(esVisibleAlMur({ mostrarAlMur: 'false' })).toBe(false);
  const unsubscribe = subscriuRevisionsEditorials(() => {});
  try {
    const key = STORAGE_PREFIX + 'publicacions.revisions.v1';
    window.localStorage.setItem(key, JSON.stringify({ 'mur:wiki:nomes-llibre': { camps: { mostrarAlMur: 'true' } } }));
    window.dispatchEvent(new StorageEvent('storage', { key }));
    expect(revisaLlista([], 'mur').map(i => i.id)).toEqual(['wiki:capitol']);
  } finally { unsubscribe(); }
});

test('dedupe estable i reconciliació: retirar l’override recupera la capçalera canònica', () => {
  const base = [{ id: 'veinal', title: 'Publicació' }, { id: 'capitol', title: 'Publicació legítima', mainHref: '/mur/capitol' }, { id: 'altre', mainHref: '/wikidepoble?item=capitol' }];
  desaRevisioEditorial('mur', 'wiki:capitol', { title: 'Revisat' });
  const first = revisaLlista(base, 'mur');
  expect(first.map(i => i.id)).toEqual(['veinal', 'capitol', 'wiki:capitol']); expect(first[2].title).toBe('Revisat');
  oblidaRevisioEditorial('mur', 'wiki:capitol');
  const second = revisaLlista(first, 'mur'); expect(second[2].title).toBe('Títol viu');
  expect(revisaLlista(second, 'mur')).toEqual(second);
  expect(base[1].title).toBe('Publicació legítima');
});

test('false lleva únicament l’aparador: revisaElement i una altra llista conserven el document', () => {
  const item = { id: 'nota', content: 'Cos íntegre', folderId: 'carpeta', isPublished: true };
  desaRevisioEditorial('mur', 'nota', { mostrarAlMur: false });
  expect(revisaLlista([item], 'mur').some(i => i.id === 'nota')).toBe(false);
  expect(revisaElement('mur', item)).toMatchObject({ content: 'Cos íntegre', folderId: 'carpeta', isPublished: true, mostrarAlMur: false });
  expect(revisaLlista([item], 'events')).toEqual([item]);
});

function backend(loadMur) { return { ...Object.fromEntries(CONTRACTE_NUCLI.map(n => [n, vi.fn()])), loadMur }; }
test('loadMur neutral conserva paginació i les altres seccions, sense llegir Notes ni duplicar', async () => {
  const value = Object.freeze({ feedPosts: [{ id: 'post', mostrarAlMur: false }, { id: 'normal' }], events: [{ id: 'acte' }], marketItems: [], paginacio: { mur: 'cursor-original' } });
  const impl = backend(vi.fn().mockResolvedValue(value)); port.setBackendImplementation(impl);
  const result = await port.loadMur('uid', { dataMode: 'remote' });
  expect(result.feedPosts.map(i => i.id)).toEqual(['normal', 'wiki:capitol']);
  expect(result.paginacio).toBe(value.paginacio); expect(result.events).toBe(value.events); expect(impl.loadNotes).not.toHaveBeenCalled();
  expect((await port.loadMur('uid')).feedPosts.map(i => i.id)).toEqual(['normal', 'wiki:capitol']);
  expect(value.feedPosts).toHaveLength(2);
});

test('loadMur: error remot i abort no es converteixen en un Mur de reserva aparentment bo', async () => {
  const error = Object.assign(new Error('Prohibit'), { status: 403 });
  port.setBackendImplementation(backend(vi.fn().mockRejectedValue(error)));
  await expect(port.loadMur('uid')).rejects.toBe(error);
  let resolve; const pending = new Promise(r => { resolve = r; });
  port.setBackendImplementation(backend(() => pending));
  const control = new AbortController(), job = port.loadMur('uid', { signal: control.signal });
  control.abort(); await expect(job).rejects.toMatchObject({ name: 'AbortError' });
  resolve({ feedPosts: [], events: [], marketItems: [] });
});
