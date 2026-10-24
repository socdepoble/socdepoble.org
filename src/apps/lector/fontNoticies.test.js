// @vitest-environment node
/* Lector de notícies · el port (fontNoticies.js) i la llavor sintètica
   (llavor/fontLlavor.js). Els feeds de la llavor es llegixen amb ?raw, com
   a l'app. */
import { describe, expect, test, vi } from 'vitest';
import { MAX_ARTICLES_PORT, MOTIUS_NOTICIES, creaFontNoticies, motiuDominant } from './fontNoticies.js';
import { CATEGORIES_LLAVOR, FONTS_LLAVOR } from './llavor/cataleg.js';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { FINESTRA_HUI, ICONES_CATEGORIA, esIdLector, msDeData } from './nucli/index.js';

const ARA = msDeData('2026-10-03T10:30:00Z');

const adaptadorFals = (dades = {}) => ({
  llistaFonts: vi.fn(async () => dades.fonts ?? { categories: [], fonts: [] }),
  llistaArticles: vi.fn(async () => dades.articles ?? []),
  article: vi.fn(async () => dades.article ?? null)
});

describe('el port no es fia de l’adaptador', () => {
  test('cal un adaptador amb els tres mètodes', () => {
    expect(() => creaFontNoticies(null)).toThrow(TypeError);
    expect(() => creaFontNoticies({ llistaFonts() {}, llistaArticles() {} })).toThrow(/article\(\)/);
  });

  test('categories i fonts: ids reservats o repetits, textos bruts i adreces que no són web cauen o es netegen', async () => {
    const port = creaFontNoticies(adaptadorFals({
      fonts: {
        categories: [
          { id: 'festes', nom: 'Festes', ordre: 2, icona: 'PartyPopper' }, { id: 'camp', nom: 'Camp', ordre: 1, icona: '<svg>' },
          { id: 'hui', nom: 'Reservada' }, { id: 'festes', nom: 'Repetida' }, { id: 'B@d', nom: 'x' }, null
        ],
        fonts: [
          { id: 'veu', nom: 'Veu\u0000', categoriaId: 'festes', lloc: 'javascript:alert(1)', imatge: '/relativa.png' },
          { id: 'totes', nom: 'Reservada' }, { id: 'radio', nom: 'Ràdio', categoriaId: 'inventada', lloc: 'https://example.org/radio' }
        ]
      }
    }));
    const { categories, fonts } = await port.llistaFonts();
    expect(categories).toEqual([{ id: 'camp', nom: 'Camp', ordre: 1, icona: null }, { id: 'festes', nom: 'Festes', ordre: 2, icona: 'PartyPopper' }]);
    expect(fonts).toEqual([
      { id: 'veu', nom: 'Veu', categoriaId: 'festes', lloc: null, descripcio: '', imatge: null },
      { id: 'radio', nom: 'Ràdio', categoriaId: null, lloc: 'https://example.org/radio', descripcio: '', imatge: null }
    ]);
    expect(Object.isFrozen(fonts)).toBe(true);
  });

  test('llistaArticles: filtres validats, resums nets, sense repetits i de la més nova a la més vella', async () => {
    const adaptador = adaptadorFals({
      articles: [
        { id: 'a', fontId: 'veu', titol: 'Vella', data: '2026-10-01T10:00:00Z', enllac: 'https://example.org/a' },
        { id: 'b', fontId: 'veu', titol: 'Nova', data: 'Sat, 03 Oct 2026 09:00:00 +0200', resum: 'x'.repeat(500), contingutHtml: '<p>no va al resum</p>' },
        { id: 'b', fontId: 'veu', titol: 'Repetida' }, { id: 'c', fontId: 'radio', titol: '' }, { id: 'D', fontId: 'veu', titol: 'Id dolent' }
      ]
    });
    const port = creaFontNoticies(adaptador);
    const resums = await port.llistaArticles({ categoriaId: 'festes' });
    expect(adaptador.llistaArticles).toHaveBeenCalledWith({ categoriaId: 'festes' });
    expect(resums.map((r) => r.titol)).toEqual(['Nova', 'Vella']);
    expect(resums[0].resum).toHaveLength(280);
    expect(Object.keys(resums[0]).sort()).toEqual(['autor', 'data', 'enllac', 'fontId', 'id', 'imatge', 'resum', 'titol']);
    expect(await port.llistaArticles({ fontId: 'radio' })).toEqual([]);
    expect(await port.llistaArticles({ categoriaId: 'Mala Categoria' })).toEqual([]);
    expect(adaptador.llistaArticles).toHaveBeenCalledTimes(2);
  });

  test('article: el contingut es torna a sanejar i un id que no casa no passa', async () => {
    const port = creaFontNoticies(adaptadorFals({
      article: { id: 'a', fontId: 'veu', titol: 'T', contingutHtml: '<p onclick="x()">hola<script>alert(1)</script></p><iframe></iframe>' }
    }));
    expect(await port.article('a')).toMatchObject({ id: 'a', contingutHtml: '<p>hola</p>', mitjansOmesos: 1 });
    expect(await port.article('b')).toBeNull();
    expect(await port.article('../a')).toBeNull();
  });

  test('si l’adaptador falla, la promesa es rebutja (la UI ho diu)', async () => {
    const port = creaFontNoticies({ llistaFonts: async () => { throw new Error('caigut'); }, llistaArticles: async () => [], article: async () => null });
    await expect(port.llistaFonts()).rejects.toThrow('caigut');
  });

  /* T5 (261024) · El motiu del rebuig, només si és de la llista tancada; res més de l'adaptador. */
  test('el rebuig porta el motiu només si és de MOTIUS_NOTICIES, i cap altre camp de l’adaptador', async () => {
    const ambMotiu = (motiu) => Object.assign(new Error('caigut'), { motiu, code: 'SECRET', url: 'https://example.org/feed' });
    const port = (motiu) => creaFontNoticies({
      llistaFonts: async () => { throw ambMotiu(motiu); }, llistaArticles: async () => { throw ambMotiu(motiu); }, article: async () => { throw ambMotiu(motiu); }
    });
    for (const motiu of MOTIUS_NOTICIES) {
      const error = await port(motiu).llistaFonts().catch((e) => e);
      expect(error.motiu, motiu).toBe(motiu);
      expect(error.message).toBe('caigut');
      expect(error.code).toBeUndefined();
      expect(error.url).toBeUndefined();
      expect((await port(motiu).llistaArticles().catch((e) => e)).motiu).toBe(motiu);
      expect((await port(motiu).article('a').catch((e) => e)).motiu).toBe(motiu);
    }
    expect('motiu' in await port('inventat').llistaFonts().catch((e) => e)).toBe(false);
    /* Actualitzada a posta (261024 Lector): dos motius nous del servei, 'adreca' (una adreça personal
       que no es llig, cap font contactada; R5-08) i 'personals-off' (el servei no llig personals;
       R5-01). Els cinc d'abans, igual i en el mateix ordre. */
    expect(MOTIUS_NOTICIES).toEqual(['sense-connexio', 'temps', 'servidor', 'font', 'limit', 'adreca', 'personals-off']);
  });

  test('salut(): sense salut a l’adaptador, cap caiguda; amb, neta i congelada', async () => {
    expect(await creaFontNoticies(adaptadorFals()).salut()).toEqual({ caigudes: [], motiu: null });
    const port = creaFontNoticies({
      ...adaptadorFals(),
      salut: async () => ({
        caigudes: [
          { fontId: 'veu', motiu: 'temps' }, { fontId: 'radio', motiu: 'inventat' }, { fontId: 'hui', motiu: 'temps' },
          { fontId: 'B@d', motiu: 'temps' }, { fontId: 'veu', motiu: 'font' }, { fontId: 'tv', motiu: 'temps' }, null
        ],
        comprovat: 1
      })
    });
    const salut = await port.salut();
    expect(salut).toEqual({
      caigudes: [{ fontId: 'veu', motiu: 'temps' }, { fontId: 'radio', motiu: 'servidor' }, { fontId: 'tv', motiu: 'temps' }], motiu: 'temps'
    });
    expect(Object.isFrozen(salut)).toBe(true);
    expect(Object.isFrozen(salut.caigudes[0])).toBe(true);
    const caiguda = creaFontNoticies({ ...adaptadorFals(), salut: async () => { throw new Error('no'); } });
    expect(await caiguda.salut()).toEqual({ caigudes: [], motiu: null });
  });

  test('motiuDominant: el que més es repetix; els empats, sense connexió i el límit primer', () => {
    const de = (...motius) => motius.map((motiu, i) => ({ fontId: `f${i}`, motiu }));
    expect(motiuDominant([])).toBeNull();
    expect(motiuDominant(de('temps', 'temps', 'servidor'))).toBe('temps');
    expect(motiuDominant(de('font', 'sense-connexio'))).toBe('sense-connexio');
    expect(motiuDominant(de('font', 'limit', 'temps'))).toBe('limit');
  });

  /* 261024 (Lector final) · Els dos motius nous també poden manar: abans, motiuDominant no els
     comptava i unes caigudes que només eren d'ells donaven null. Darrere en els empats. */
  test('motiuDominant: adreca i personals-off compten, i en els empats van darrere dels cinc de sempre', () => {
    const de = (...motius) => motius.map((motiu, i) => ({ fontId: `f${i}`, motiu }));
    expect(motiuDominant(de('adreca'))).toBe('adreca');
    expect(motiuDominant(de('personals-off', 'personals-off'))).toBe('personals-off');
    expect(motiuDominant(de('personals-off', 'adreca', 'adreca'))).toBe('adreca');
    expect(motiuDominant(de('adreca', 'personals-off'))).toBe('adreca');
    expect(motiuDominant(de('font', 'adreca'))).toBe('font');
    expect(motiuDominant(de('personals-off', 'personals-off', 'temps'))).toBe('personals-off');
  });

  test('salut(): unes caigudes que només són adreca o personals-off porten el seu motiu, no null', async () => {
    const port = creaFontNoticies({
      ...adaptadorFals(),
      salut: async () => ({ caigudes: [{ fontId: 'meva-a', motiu: 'personals-off' }, { fontId: 'meva-b', motiu: 'personals-off' }] })
    });
    expect((await port.salut()).motiu).toBe('personals-off');
    const vetada = creaFontNoticies({ ...adaptadorFals(), salut: async () => ({ caigudes: [{ fontId: 'meva-c', motiu: 'adreca' }] }) });
    expect((await vetada.salut()).motiu).toBe('adreca');
  });

  test('com a molt MAX_ARTICLES_PORT resums', async () => {
    const molts = Array.from({ length: MAX_ARTICLES_PORT + 10 }, (_, i) => ({ id: `n${i}`, fontId: 'veu', titol: `N${i}` }));
    expect(await creaFontNoticies(adaptadorFals({ articles: molts })).llistaArticles()).toHaveLength(MAX_ARTICLES_PORT);
  });

  test('el tall va després de l’ordre: les més noves es queden encara que l’adaptador les done al final', async () => {
    const ms = msDeData('2026-01-01T00:00:00Z');
    /* La llista crua va de la més vella a la més nova, amb deu més del límit. */
    const crus = Array.from({ length: MAX_ARTICLES_PORT + 10 }, (_, i) => ({
      id: `n${i}`, fontId: 'veu', titol: `N${i}`, data: new Date(ms + i * 60000).toISOString()
    }));
    const resums = await creaFontNoticies(adaptadorFals({ articles: crus })).llistaArticles();
    expect(resums).toHaveLength(MAX_ARTICLES_PORT);
    expect(resums[0].id).toBe(`n${MAX_ARTICLES_PORT + 9}`);
    expect(resums.at(-1).id).toBe('n10');
    expect(resums.some((resum) => resum.id === 'n9')).toBe(false);
  });
});

describe('la llavor sintètica', () => {
  const port = creaFontNoticies(creaAdaptadorLlavor({ ara: ARA }));

  test('quatre categories i cinc fonts inventades, totes vàlides, amb icones de la llista tancada', async () => {
    const { categories, fonts } = await port.llistaFonts();
    expect(categories.map((c) => c.id)).toEqual(['ajuntament', 'festes', 'camp', 'esports']);
    for (const categoria of CATEGORIES_LLAVOR) expect(ICONES_CATEGORIA).toContain(categoria.icona);
    expect(fonts.map((f) => f.id)).toEqual(FONTS_LLAVOR.map((f) => f.id));
    for (const font of fonts) expect(font.lloc, font.id).toMatch(/^https:\/\/example\.org\//);
  });

  test('cada feed es llig sencer, sense errors, i totes les adreces són d’example.org', async () => {
    const resums = await port.llistaArticles();
    expect(resums).toHaveLength(16);
    for (const resum of resums) {
      expect(esIdLector(resum.id), resum.id).toBe(true);
      expect(resum.enllac, resum.id).toMatch(/^https:\/\/example\.org\//);
      if (resum.imatge) expect(resum.imatge, resum.id).toMatch(/^https:\/\/example\.org\//);
    }
    for (const font of FONTS_LLAVOR) expect(font.xml).not.toMatch(/https?:\/\/(?!example\.org\/|purl\.org\/|search\.yahoo\.com\/mrss\/|www\.w3\.org\/)/);
  });

  test('les dates es desplacen: la més nova és d’una hora abans d’ara i n’hi ha sis de les últimes 24 hores', async () => {
    const resums = await port.llistaArticles();
    expect(msDeData(resums[0].data)).toBe(ARA - 60 * 60 * 1000);
    expect(resums.filter((r) => msDeData(r.data) >= ARA - FINESTRA_HUI)).toHaveLength(6);
  });

  test('els filtres de la llavor i l’article sencer', async () => {
    expect((await port.llistaArticles({ categoriaId: 'festes' })).map((r) => r.fontId)).toEqual(['colla-dimonis', 'colla-dimonis', 'colla-dimonis']);
    expect(await port.llistaArticles({ fontId: 'club-pilota' })).toHaveLength(3);
    const [primer] = await port.llistaArticles({ fontId: 'colla-dimonis' });
    const sencer = await port.article(primer.id);
    expect(sencer.titol).toBe('El correfoc de les festes passarà pel barranc');
    expect(sencer.contingutHtml).toContain('<h3>Recomanacions</h3>');
    expect(await port.article('colla-dimonis-0000000000000000')).toBeNull();
  });
});
