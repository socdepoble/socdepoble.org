import { webcrypto } from 'node:crypto';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, beforeAll, afterAll, describe, expect, test, vi } from 'vitest';
import { extensionsRiques } from '../../components/universal/richText/extensions/index.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { carregaPaginesTrilogiaIMoliWp } from './paginesTrilogiaIMoliWp.js';
import { transformaPaginaTrilogiaIMoliWp } from './paginesTrilogiaIMoliEditorial.js';
let editor;
const open = html => {
  editor = new Editor({ element: document.createElement('div'),
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] }, underline: false }), ...extensionsRiques()], content: html });
  return editor;
};
beforeAll(() => vi.stubGlobal('crypto', webcrypto));
afterEach(() => { editor?.destroy(); editor = null; });
afterAll(() => vi.unstubAllGlobals());
describe('IDEA-111 · reobrir i desar amb l’editor real', () => {
  test('els deu documents conserven la cita, els enllaços d’imatge i els vídeos inerts en dos cicles TipTap', async () => {
    for (const page of await carregaPaginesTrilogiaIMoliWp()) {
      const original = transformaPaginaTrilogiaIMoliWp(page);
      const source = document.createElement('div'); source.innerHTML = sanitizeHtml(original.htmlNet, { imatgesPropies: true });
      const expectedImages = [...source.querySelectorAll('img')].map(img => img.getAttribute('src')).sort();
      open(original.htmlNet);
      const first = sanitizeHtml(editor.getHTML(), { imatgesPropies: true });
      editor.commands.setContent(first);
      const second = sanitizeHtml(editor.getHTML(), { imatgesPropies: true });
      expect(second).toContain(page.link); expect(second).toContain(page.date);
      expect(second).not.toMatch(/<iframe|<script|data:image/i);
      for (const id of original.videos) expect(second).toContain(`data-sdp-youtube="${id}"`);
      const links = document.createElement('div'); links.innerHTML = sanitizeHtml(second);
      expect([...links.querySelectorAll('img')].map(img => img.getAttribute('src')).sort()).toEqual(expectedImages);
      const hrefs = new Set([...links.querySelectorAll('a[href]')].map(a => a.href));
      for (const url of original.imatgesPendents) expect(hrefs.has(url)).toBe(true);
      editor.destroy(); editor = null;
    }
  });
  test('una imatge pròpia i un vídeo segur sobreviuen; cap iframe arbitrari no es desa', () => {
    open(sanitizeHtml('<p>Edició</p><img src="/assets/importacio-wp/fixture.webp" alt="Original"><div data-sdp-youtube="VBzEBQq_4LA"><a href="https://www.youtube.com/watch?v=VBzEBQq_4LA">Blat</a></div><iframe src="https://evil.test"></iframe>', { imatgesPropies: true }));
    const html = sanitizeHtml(editor.getHTML(), { imatgesPropies: true });
    expect(html).toContain('src="/assets/importacio-wp/fixture.webp"');
    expect(html).toContain('data-sdp-youtube="VBzEBQq_4LA"'); expect(html).not.toMatch(/<iframe|evil\.test/);
  });
});
