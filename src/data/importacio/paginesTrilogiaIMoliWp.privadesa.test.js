import { webcrypto } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { carregaPaginesTrilogiaIMoliWp } from './paginesTrilogiaIMoliWp.js';
import { transformaPaginaTrilogiaIMoliWp } from './paginesTrilogiaIMoliEditorial.js';

beforeAll(() => vi.stubGlobal('crypto', webcrypto));
afterAll(() => vi.unstubAllGlobals());

const CORREU = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

describe('IDEA-111 · privadesa de l’esborrany', () => {
  test('cap esborrany copia l’adreça d’un tercer; només queda la de l’associació', async () => {
    for (const page of await carregaPaginesTrilogiaIMoliWp()) {
      const adreces = (transformaPaginaTrilogiaIMoliWp(page).htmlNet.match(CORREU) || []).map(a => a.toLowerCase());
      expect(adreces.filter(a => a !== 'socdepoblecom@gmail.com')).toEqual([]);
    }
  });

  test('un mailto o un correu en text d’una persona aliena es retira, el de l’associació no', () => {
    const base = { id: 16668, slug: 'prova', title: 'Prova', date: '2014-01-01T12:00:00', link: 'https://socdepoble.net/prova/', featured_image: null, images: [], iframes: [] };
    const draft = transformaPaginaTrilogiaIMoliWp({ ...base, contentHtml: '<p>Escriviu a <a href="mailto:Algu.Aliè@mail.com">algú</a>, a algu@mail.com o a <a href="mailto:socdepoblecom@gmail.com">l’associació</a>.</p>' });
    expect(draft.htmlNet).not.toMatch(/@mail\.com/i);
    expect(draft.htmlNet).toContain('mailto:socdepoblecom@gmail.com');
    expect(draft.htmlNet).toContain('algú');
  });
});
