import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { carregaPaginesTrilogiaIMoliWp, CORPUS_PAGINES_WP_SHA256, creaCarregadorPaginesWp, INDEX_PAGINES_TRILOGIA_WP } from './paginesTrilogiaIMoliWp.js';
import { carregaPortadaImportadaPublica, transformaPaginaTrilogiaIMoliWp } from './paginesTrilogiaIMoliEditorial.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { MITJANS_WP_LOCALS } from './paginesTrilogiaIMoliWp.mitjans.js';
import { carregaPaginaImportadaPerRevisio, trobaArticleImportatComAPublicacio } from '../../utils/transformadorEditorialWpBlogger.js';
const corpus = () => JSON.parse(readFileSync(`${process.cwd()}/src/data/importacio/paginesTrilogiaIMoliWp.corpus.json`, 'utf8'));
beforeAll(() => vi.stubGlobal('crypto', webcrypto));
afterAll(() => vi.unstubAllGlobals());

describe('IDEA-111 · corpus WP complet diferit i verificat', () => {
  test('importar l’índex no carrega dades; la petició concurrent importa una sola vegada', async () => {
    const importa = vi.fn(async () => ({ default: corpus() })), loader = creaCarregadorPaginesWp(importa);
    expect(importa).not.toHaveBeenCalled();
    expect(loader.obte(16839)).toBeNull();
    const [a, b] = await Promise.all([loader.carrega(), loader.carrega()]);
    expect(a).toBe(b); expect(importa).toHaveBeenCalledTimes(1);
    expect(a.map(p => p.id)).toEqual([16839, 16826, 16650, 16668, 2002, 3656, 16761, 3653, 3639, 619]);
    expect(a.map(p => p.slug)).toEqual(INDEX_PAGINES_TRILOGIA_WP.map(p => p.slug));
    expect(Object.isFrozen(a)).toBe(true); expect(Object.isFrozen(a[0].images)).toBe(true);
    const digest = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(a)));
    expect(Buffer.from(digest).toString('hex')).toBe(CORPUS_PAGINES_WP_SHA256);
  });
  test('cancel·lar una lectura no invalida altres lectors ni publica tard', async () => {
    let resolve;
    const loader = creaCarregadorPaginesWp(() => new Promise(r => { resolve = r; }));
    const controller = new AbortController(), cancelled = loader.carrega({ signal: controller.signal });
    const other = loader.carrega();
    await Promise.resolve(); controller.abort();
    await expect(cancelled).rejects.toMatchObject({ code: 'WP_CANCELLED' });
    resolve({ default: corpus() });
    expect(await other).toHaveLength(10);
    const never = vi.fn(), already = new AbortController(); already.abort();
    await expect(creaCarregadorPaginesWp(never).carrega({ signal: already.signal })).rejects.toMatchObject({ code: 'WP_CANCELLED' });
    expect(never).not.toHaveBeenCalled();
  });
  test('una font alterada falla tancada i permet reintent verificat', async () => {
    const bad = corpus(); bad[0].contentHtml += '<p>Alterat</p>';
    const importa = vi.fn().mockResolvedValueOnce({ default: bad }).mockResolvedValueOnce({ default: corpus() });
    const loader = creaCarregadorPaginesWp(importa);
    await expect(loader.carrega()).rejects.toMatchObject({ code: 'WP_CORPUS_HASH' });
    expect(loader.obte(16839)).toBeNull();
    expect(await loader.carrega()).toHaveLength(10);
  });
  test('les deu pàgines tenen el cos complet sanejat, data i cita; cap fallback públic', async () => {
    const pages = await carregaPaginesTrilogiaIMoliWp();
    for (const page of pages) {
      const draft = await carregaPaginaImportadaPerRevisio(page.id);
      expect(draft.wp_id).toBe(page.id); expect(draft.created_at).toBe(page.date);
      const original = document.createElement('template'), transformed = document.createElement('div');
      original.content.append(...new DOMParser().parseFromString(page.contentHtml, 'text/html').body.childNodes); transformed.innerHTML = sanitizeHtml(draft.htmlNet);
      original.content.querySelectorAll('script,style,noscript,iframe').forEach(node => node.remove());
      const normal = text => text.replace(/\s+/g, ' ').trim();
      const allText = normal(transformed.textContent);
      // Every substantive original paragraph survives: a summary fallback
      // cannot pass this test for the long Pou de Neu/Molí bodies.
      for (const p of original.content.querySelectorAll('p,li,td,th')) {
        // The only intended difference: a third party's address is withdrawn (privadesa.test.js).
        const text = normal(p.textContent).replace(/[\w.+-]+@(?!gmail\.com)[\w.-]+\.[a-z]{2,}/gi, 'correu de contacte');
        if (text.length > 35) expect(allText).toContain(text);
      }
      expect(draft.htmlNet).toContain('Font original:');
      expect(draft.htmlNet).toContain(page.link);
      expect(draft.htmlNet).not.toMatch(/<iframe|<script|data:image|onerror=/i);
      expect(draft.estat_revisio).toBe('pendent_admin'); expect(draft.quarantena).toBe(true);
      const pending = [...new Set([...page.images, page.featured_image].filter(Boolean).map(url => new URL(url).href))].filter(url => !MITJANS_WP_LOCALS[url]);
      expect(draft.publicable).toBe(pending.length === 0); expect(draft.imatgesPendents).toEqual(pending);
      // /mur keeps the metadata-only summary card: the loaded body (and an 'aprovat' flag in localStorage) never reach it.
      for (const publica of [trobaArticleImportatComAPublicacio(page.id), trobaArticleImportatComAPublicacio(page.slug, { getItem: () => JSON.stringify({ estats: { [page.id]: 'aprovat' } }) })]) {
        expect(publica).not.toBeNull(); expect(publica.content).not.toBe(draft.content);
        expect(publica.content).not.toContain('Font original:'); expect(publica.content).not.toContain('data-sdp-youtube');
        expect(publica.content.length).toBeLessThan(2000);
      }
      expect(trobaArticleImportatComAPublicacio(page.slug, null, { revisioPrivada: true }).content).toBe(draft.content);
    }
  });
  test('els tres vídeos conserven els ids reals i Yumpu/Maps només són enllaços', async () => {
    const expected = new Map([[16826, 'VBzEBQq_4LA'], [16650, '_knm0PiGE9A'], [16668, 'vpTVDipdXi4']]);
    for (const page of await carregaPaginesTrilogiaIMoliWp()) {
      const draft = transformaPaginaTrilogiaIMoliWp(page);
      expect(draft.videos).toEqual(expected.has(page.id) ? [expected.get(page.id)] : []);
      if (expected.has(page.id)) expect(draft.content).toContain(`data-sdp-youtube="${expected.get(page.id)}"`);
      for (const raw of page.iframes.filter(u => !u.includes('youtube'))) expect(draft.content).toContain(new URL(raw).hostname);
    }
  });
  test('codi/iframes/imatges desconegudes no guanyen permisos i no hi ha àncores niades', () => {
    const draft = transformaPaginaTrilogiaIMoliWp({ id: 16839, slug: 'prova', title: 'Prova', date: '2014-01-01T12:00:00', link: 'https://socdepoble.net/prova/',
      images: ['https://socdepoble.net/legal.jpg'], contentHtml: '<a href="https://socdepoble.net/pagina/"><img data-src="https://socdepoble.net/legal.jpg" alt="Legal"></a><img src="https://evil.test/tracker"><script>fetch("https://evil.test")</script><iframe src="https://youtube.com.evil.test/embed/VBzEBQq_4LA"></iframe><iframe src="javascript:alert(1)"></iframe><p onclick="alert(1)">Text real</p>' });
    expect(draft.content).not.toMatch(/<iframe|<img|<script|onclick|javascript:/i);
    const el = document.createElement('div'); el.innerHTML = sanitizeHtml(draft.content);
    expect(el.querySelector('a a')).toBeNull(); expect(el.textContent).toContain('Text real');
    expect(draft.imatgesPendents).toEqual(['https://socdepoble.net/legal.jpg']); expect(draft.videos).toEqual([]);
  });
  test('cap import estàtic del corpus fora del punt import() explícit', () => {
    const source = readFileSync(`${process.cwd()}/src/data/importacio/paginesTrilogiaIMoliWp.js`, 'utf8');
    expect(source).toContain("import('./paginesTrilogiaIMoliWp.corpus.json')");
    expect(source).not.toMatch(/import\s+[^;]*from\s+['"][^'"]*corpus\.json/);
    expect(source).not.toContain('contentHtml:');
  });

  test('R18 · la portada pública d’arbres reutilitza exactament el WP #619 amb les imatges verificades', async () => {
    const original = (await carregaPaginesTrilogiaIMoliWp()).find(p => p.id === 619);
    const privada = transformaPaginaTrilogiaIMoliWp(original);
    const portada = await carregaPortadaImportadaPublica(619);
    expect(portada).toMatchObject({ wp_id: 619, source_url: original.link, source_sha256: privada.source_sha256,
      content: privada.content, htmlNet: privada.htmlNet, quarantena: false, revisioPrivada: false,
      destinacio_workspace: 'arbres-monumentals', estat_revisio: 'portada_canonica' });
    expect(portada.imatgesPendents).toEqual([]);
    expect(Object.isFrozen(portada)).toBe(true);
    expect(portada.content).toContain('Font original:');
    for (const id of [2002, 16839, '619', null, {}, '__proto__']) expect(await carregaPortadaImportadaPublica(id)).toBeNull();
    // La lectura pública concreta no canvia la quarantena dels lectors de revisió ni del Mur.
    expect((await carregaPaginaImportadaPerRevisio(619)).quarantena).toBe(true);
    expect(trobaArticleImportatComAPublicacio(619).content).not.toContain('Font original:');
  });

  test('R18 · cancel·lar la portada concreta conserva la semàntica del carregador', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(carregaPortadaImportadaPublica(619, { signal: controller.signal })).rejects.toMatchObject({ code: 'WP_CANCELLED' });
  });
});
