// @vitest-environment node
/* Lector de notícies · T5 (P1-07, 261024) · l'adaptador remot (fontRemota.js) amb un servei
   fals: cap xarxa. Els feeds són els de la llavor sintètica (example.org), servits pel servei
   com si foren de les fonts territorials. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaFontNoticies } from './fontNoticies.js';
import { CONCURRENCIA, TERMINI_RONDA_MS, TTL_MS, creaAdaptadorRemot } from './fontRemota.js';
import { CATEGORIES_LLAVOR, FONTS_LLAVOR } from './llavor/cataleg.js';
import { analitzaFeed } from './nucli/index.js';

const XML = Object.fromEntries(FONTS_LLAVOR.map((font) => [font.id, font.xml]));
const CATALEG = Object.freeze({
  categories: CATEGORIES_LLAVOR,
  fonts: FONTS_LLAVOR.map(({ id, nom, categoriaId, descripcio }) => ({ id, nom, categoriaId, descripcio, lloc: null }))
});
const sobre = (id, xml = XML[id]) => ({ font: id, xml, obtingut: '2026-10-24T09:00:00.000Z', obsoleta: false });
const ambMotiu = (motiu) => Object.assign(new Error(`caiguda ${motiu}`), { motiu });
const quantsDe = (id) => analitzaFeed(XML[id], { fontId: id }).articles.length;
const TOTS = FONTS_LLAVOR.reduce((suma, font) => suma + quantsDe(font.id), 0);

/* Un servei fals: `feed` respon el feed de la llavor, o el que diga `respon(id, signal)`. */
function serveiFals({ respon = null, cataleg = CATALEG } = {}) {
  return {
    fonts: vi.fn(async () => cataleg),
    feed: vi.fn(async (id, { signal } = {}) => (respon ? respon(id, signal) : sobre(id)))
  };
}
/* Una resposta que no arriba mai, però que s'avorta amb el senyal. */
const penjada = (signal) => new Promise((resol, rebutja) => {
  signal?.addEventListener('abort', () => rebutja(Object.assign(new Error('avortada'), { name: 'AbortError' })));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('la ronda', () => {
  test('llig cada feed amb el nucli i dona els resums, sense contingut; cap caiguda', async () => {
    const servei = serveiFals();
    const adaptador = creaAdaptadorRemot({ servei });
    const resums = await adaptador.llistaArticles();
    expect(resums).toHaveLength(TOTS);
    expect(resums.every((resum) => !('contingutHtml' in resum) && !('mitjansOmesos' in resum))).toBe(true);
    expect(servei.feed.mock.calls.map(([id]) => id)).toEqual(FONTS_LLAVOR.map((font) => font.id));
    expect((await adaptador.salut()).caigudes).toEqual([]);
  });

  test('una font que cau: la resta es veu, i salut() diu quina i per què', async () => {
    const servei = serveiFals({ respon: (id) => (id === 'pregoner' ? Promise.reject(ambMotiu('temps')) : sobre(id)) });
    const adaptador = creaAdaptadorRemot({ servei });
    const resums = await adaptador.llistaArticles();
    expect(resums).toHaveLength(TOTS - quantsDe('pregoner'));
    expect(resums.some((resum) => resum.fontId === 'pregoner')).toBe(false);
    expect((await adaptador.salut()).caigudes).toEqual([{ fontId: 'pregoner', motiu: 'temps' }]);
  });

  test('si cauen totes, resol buida i les llista totes; un motiu desconegut és servidor', async () => {
    const servei = serveiFals({ respon: (id) => Promise.reject(id === 'veu-placa' ? new Error('sense motiu') : ambMotiu('sense-connexio')) });
    const adaptador = creaAdaptadorRemot({ servei });
    expect(await adaptador.llistaArticles()).toEqual([]);
    const { caigudes } = await adaptador.salut();
    expect(caigudes.map((caiguda) => caiguda.fontId)).toEqual(FONTS_LLAVOR.map((font) => font.id));
    expect(caigudes.find((caiguda) => caiguda.fontId === 'veu-placa').motiu).toBe('servidor');
    expect(caigudes.filter((caiguda) => caiguda.motiu === 'sense-connexio')).toHaveLength(FONTS_LLAVOR.length - 1);
  });

  test('un text que no és cap feed (una pàgina HTML) és el motiu font', async () => {
    const servei = serveiFals({ respon: (id) => (id === 'cooperativa' ? sobre(id, '<html><body>No</body></html>') : sobre(id)) });
    const adaptador = creaAdaptadorRemot({ servei });
    await adaptador.llistaArticles();
    expect((await adaptador.salut()).caigudes).toEqual([{ fontId: 'cooperativa', motiu: 'font' }]);
  });

  test('els filtres: només les fonts de la categoria o la font demanada', async () => {
    const servei = serveiFals();
    const adaptador = creaAdaptadorRemot({ servei });
    const deFestes = await adaptador.llistaArticles({ categoriaId: 'festes' });
    expect(new Set(deFestes.map((resum) => resum.fontId))).toEqual(new Set(['colla-dimonis']));
    expect(servei.feed.mock.calls.map(([id]) => id)).toEqual(['colla-dimonis']);
    expect((await adaptador.llistaArticles({ fontId: 'club-pilota' })).every((resum) => resum.fontId === 'club-pilota')).toBe(true);
  });

  test(`com a molt ${CONCURRENCIA} peticions alhora`, async () => {
    let enCami = 0;
    let maxim = 0;
    const fonts = Array.from({ length: 9 }, (_, i) => ({ id: `font-${i}`, nom: `Font ${i}`, categoriaId: null }));
    const servei = serveiFals({
      cataleg: { categories: [], fonts },
      respon: async () => {
        enCami += 1;
        maxim = Math.max(maxim, enCami);
        await new Promise((resol) => { setTimeout(resol, 5); });
        enCami -= 1;
        return sobre('veu-placa');
      }
    });
    await creaAdaptadorRemot({ servei }).llistaArticles();
    expect(servei.feed).toHaveBeenCalledTimes(9);
    expect(maxim).toBe(CONCURRENCIA);
  });

  test(`un termini de ${TERMINI_RONDA_MS} ms per a tota la ronda: les que no han arribat són temps, i s’avorten`, async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const senyals = new Map();
    const servei = serveiFals({
      respon: (id, signal) => {
        senyals.set(id, signal);
        return id === 'club-pilota' || id === 'cooperativa' ? penjada(signal) : sobre(id);
      }
    });
    const adaptador = creaAdaptadorRemot({ servei });
    let resums = null;
    const promesa = adaptador.llistaArticles().then((valor) => { resums = valor; });
    await vi.advanceTimersByTimeAsync(TERMINI_RONDA_MS - 1);
    expect(resums).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    await promesa;
    expect(resums).toHaveLength(TOTS - quantsDe('club-pilota') - quantsDe('cooperativa'));
    expect((await adaptador.salut()).caigudes).toEqual([{ fontId: 'cooperativa', motiu: 'temps' }, { fontId: 'club-pilota', motiu: 'temps' }]);
    expect(senyals.get('club-pilota').aborted).toBe(true);
  });

  test('una ronda nova avorta la vella, que es rebutja', async () => {
    const senyals = [];
    const servei = serveiFals({ respon: (id, signal) => { senyals.push(signal); return penjada(signal); } });
    const adaptador = creaAdaptadorRemot({ servei });
    const vella = adaptador.llistaArticles();
    await vi.waitFor(() => expect(servei.feed).toHaveBeenCalled());
    const nova = adaptador.llistaArticles({ fontId: 'pregoner' });
    const novaAvortada = nova.then(() => false, (error) => error.name === 'AbortError');
    await expect(vella).rejects.toMatchObject({ name: 'AbortError' });
    expect(senyals[0].aborted).toBe(true);
    /* La tercera avorta la segona (penjada) i, amb el servei bo, arriba. */
    servei.feed.mockImplementation(async (id) => sobre(id));
    expect(await adaptador.llistaArticles({ fontId: 'pregoner' })).toHaveLength(quantsDe('pregoner'));
    expect(await novaAvortada).toBe(true);
  });
});

describe('la memòria', () => {
  test(`el que va bé es guarda ${TTL_MS} ms; el que falla, mai`, async () => {
    let moment = 0;
    let falla = true;
    const servei = serveiFals({ respon: (id) => (id === 'pregoner' && falla ? Promise.reject(ambMotiu('servidor')) : sobre(id)) });
    const adaptador = creaAdaptadorRemot({ servei, ara: () => moment });
    await adaptador.llistaArticles();
    expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length);
    falla = false;
    moment = TTL_MS - 1;
    await adaptador.llistaArticles();
    /* Només es torna a demanar la que havia fallat. */
    expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length + 1);
    expect(servei.feed.mock.calls.at(-1)[0]).toBe('pregoner');
    expect((await adaptador.salut()).caigudes).toEqual([]);
    moment = TTL_MS + 1;
    await adaptador.llistaArticles();
    expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length * 2);
  });

  test('el catàleg es demana una sola vegada', async () => {
    const servei = serveiFals();
    const adaptador = creaAdaptadorRemot({ servei });
    await adaptador.llistaFonts();
    await adaptador.llistaArticles();
    await adaptador.llistaFonts();
    expect(servei.fonts).toHaveBeenCalledTimes(1);
  });
});

describe('l’article', () => {
  test('el d’una ronda, de la memòria; un enllaç profund demana només el seu feed (pel prefix més llarg)', async () => {
    const fonts = [...CATALEG.fonts, { id: 'colla', nom: 'Una altra colla', categoriaId: 'festes' }];
    const servei = serveiFals({ cataleg: { categories: CATEGORIES_LLAVOR, fonts }, respon: (id) => sobre(id, XML[id] ?? XML.pregoner) });
    const [primer] = analitzaFeed(XML['colla-dimonis'], { fontId: 'colla-dimonis' }).articles;
    const enllac = creaAdaptadorRemot({ servei });
    const sencer = await enllac.article(primer.id);
    expect(sencer.titol).toBe(primer.titol);
    expect(sencer.contingutHtml).toBeTruthy();
    expect(servei.feed.mock.calls.map(([id]) => id)).toEqual(['colla-dimonis']);
    /* Ja és a la memòria: cap petició més, i un id d'eixa font que no hi és, null. */
    expect((await enllac.article(primer.id)).id).toBe(primer.id);
    expect(await enllac.article('colla-dimonis-0000000000000000')).toBeNull();
    expect(await enllac.article('inventada-0000000000000000')).toBeNull();
    expect(servei.feed).toHaveBeenCalledTimes(1);
  });

  test('si el feed de l’article cau, es rebutja amb el seu motiu', async () => {
    const servei = serveiFals({ respon: () => Promise.reject(ambMotiu('limit')) });
    await expect(creaAdaptadorRemot({ servei }).article('pregoner-0000000000000000')).rejects.toMatchObject({ motiu: 'limit' });
  });
});

describe('pel port (fontNoticies.js)', () => {
  test('el port normalitza i la salut arriba neta, amb el motiu que més es repetix', async () => {
    const servei = serveiFals({
      respon: (id) => (['pregoner', 'cooperativa'].includes(id) ? Promise.reject(ambMotiu('temps'))
        : id === 'club-pilota' ? Promise.reject(ambMotiu('font')) : sobre(id))
    });
    const port = creaFontNoticies(creaAdaptadorRemot({ servei }));
    const { fonts } = await port.llistaFonts();
    expect(fonts.map((font) => font.id)).toEqual(FONTS_LLAVOR.map((font) => font.id));
    const resums = await port.llistaArticles();
    expect(resums.length).toBe(quantsDe('veu-placa') + quantsDe('colla-dimonis'));
    const salut = await port.salut();
    expect(salut.motiu).toBe('temps');
    expect(salut.caigudes.map((caiguda) => caiguda.fontId).sort()).toEqual(['club-pilota', 'cooperativa', 'pregoner']);
    expect(Object.isFrozen(salut)).toBe(true);
  });

  test('cal el servei de la plataforma', () => {
    expect(() => creaAdaptadorRemot({})).toThrow(TypeError);
    expect(() => creaAdaptadorRemot({ servei: { fonts() {} } })).toThrow(TypeError);
  });
});

/* T5b (ordre del Mestre, 261024) · El que tria la persona: les fonts del sistema que ha apagat no es
   demanen, i les seues fonts personals es lligen pel mateix servei (feedPersonal), mai pel
   navegador, amb la mateixa ronda, la mateixa memòria i les mateixes caigudes. */
describe('el que tria la persona', () => {
  const ADRECA = 'https://blog.example.org/feed';
  const PROPIA = Object.freeze({ id: 'meva-0123456789abcdef', nom: 'El meu blog', url: ADRECA, categoriaId: null });
  const ambPersonals = (opcions = {}) => ({
    ...serveiFals(opcions),
    feedPersonal: vi.fn(async (url) => ({ url, xml: XML.pregoner, obtingut: null, obsoleta: false }))
  });

  test('cap font apagada es demana ni compta com a caiguda; demanada pel seu id, sí', async () => {
    const servei = serveiFals();
    const adaptador = creaAdaptadorRemot({ servei, persona: () => ({ noSeguides: ['pregoner', 'cooperativa'], personals: [] }) });
    const resums = await adaptador.llistaArticles();
    expect(servei.feed.mock.calls.map(([id]) => id)).toEqual(FONTS_LLAVOR.map((font) => font.id).filter((id) => !['pregoner', 'cooperativa'].includes(id)));
    expect(resums.some((resum) => ['pregoner', 'cooperativa'].includes(resum.fontId))).toBe(false);
    expect((await adaptador.salut()).caigudes).toEqual([]);
    /* El catàleg les porta igual: la persona les pot tornar a encendre. */
    expect((await adaptador.llistaFonts()).fonts.map((font) => font.id)).toEqual(FONTS_LLAVOR.map((font) => font.id));
    expect(await adaptador.llistaArticles({ fontId: 'pregoner' })).toHaveLength(quantsDe('pregoner'));
  });

  test('la tria es llig en cada ronda: tornar-ne a encendre una només demana eixa (la resta, de la memòria)', async () => {
    const servei = serveiFals();
    let noSeguides = ['pregoner'];
    const adaptador = creaAdaptadorRemot({ servei, persona: () => ({ noSeguides, personals: [] }) });
    await adaptador.llistaArticles();
    expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length - 1);
    noSeguides = [];
    expect(await adaptador.llistaArticles()).toHaveLength(TOTS);
    expect(servei.feed).toHaveBeenCalledTimes(FONTS_LLAVOR.length);
    expect(servei.feed.mock.calls.at(-1)[0]).toBe('pregoner');
  });

  test('sense persona, o mentre torna null o llança, es seguixen totes i no hi ha cap personal', async () => {
    for (const persona of [null, () => null, () => { throw new Error('disc'); }, () => ({ noSeguides: 'pregoner', personals: 'no' })]) {
      const servei = ambPersonals();
      const adaptador = creaAdaptadorRemot({ servei, persona });
      expect(await adaptador.llistaArticles()).toHaveLength(TOTS);
      expect(servei.feedPersonal).not.toHaveBeenCalled();
    }
  });

  test('una font personal entra al catàleg i es llig pel servei amb la seua adreça; mai amb feed()', async () => {
    const servei = ambPersonals();
    const adaptador = creaAdaptadorRemot({ servei, persona: () => ({ noSeguides: [], personals: [PROPIA] }) });
    const { fonts } = await adaptador.llistaFonts();
    expect(fonts.at(-1)).toEqual({ id: PROPIA.id, nom: 'El meu blog', categoriaId: null, descripcio: 'Una font que has afegit tu.', lloc: 'https://blog.example.org' });
    const resums = await adaptador.llistaArticles();
    expect(servei.feedPersonal.mock.calls.map(([url]) => url)).toEqual([ADRECA]);
    expect(servei.feedPersonal.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(servei.feed.mock.calls.map(([id]) => id)).not.toContain(PROPIA.id);
    const delBlog = resums.filter((resum) => resum.fontId === PROPIA.id);
    expect(delBlog).toHaveLength(quantsDe('pregoner'));
    expect(delBlog.every((resum) => resum.id.startsWith(`${PROPIA.id}-`))).toBe(true);
    /* Per la memòria, com les altres; i un enllaç profund a una notícia seua la troba pel prefix. */
    await adaptador.llistaArticles();
    expect(servei.feedPersonal).toHaveBeenCalledTimes(1);
    const enllac = creaAdaptadorRemot({ servei: ambPersonals(), persona: () => ({ noSeguides: [], personals: [PROPIA] }) });
    expect((await enllac.article(delBlog[0].id))?.titol).toBe(delBlog[0].titol);
  });

  test('una font personal que cau és una caiguda més, amb el seu motiu; la resta es veu', async () => {
    const servei = ambPersonals();
    servei.feedPersonal.mockImplementation(async () => { throw ambMotiu('font'); });
    const adaptador = creaAdaptadorRemot({ servei, persona: () => ({ noSeguides: [], personals: [PROPIA] }) });
    expect(await adaptador.llistaArticles()).toHaveLength(TOTS);
    expect((await adaptador.salut()).caigudes).toEqual([{ fontId: PROPIA.id, motiu: 'font' }]);
  });

  test('una font personal apagada tampoc no es demana; una llevada desapareix del catàleg a la ronda següent', async () => {
    const servei = ambPersonals();
    let tria = { noSeguides: [PROPIA.id], personals: [PROPIA] };
    const adaptador = creaAdaptadorRemot({ servei, persona: () => tria });
    await adaptador.llistaArticles();
    expect(servei.feedPersonal).not.toHaveBeenCalled();
    tria = { noSeguides: [], personals: [] };
    expect((await adaptador.llistaFonts()).fonts.some((font) => font.id === PROPIA.id)).toBe(false);
  });

  test('un servei sense feedPersonal no les llig: no entren al catàleg (queden pendents a la gestió de fonts)', async () => {
    const servei = serveiFals();
    const adaptador = creaAdaptadorRemot({ servei, persona: () => ({ noSeguides: [], personals: [PROPIA] }) });
    expect((await adaptador.llistaFonts()).fonts.map((font) => font.id)).toEqual(FONTS_LLAVOR.map((font) => font.id));
    expect(await adaptador.llistaArticles()).toHaveLength(TOTS);
  });

  test('una personal amb l’id d’una del sistema, repetida o sense adreça no hi entra; pel port, la del sistema mana', async () => {
    const servei = ambPersonals();
    const personals = [{ ...PROPIA, id: 'pregoner' }, PROPIA, { ...PROPIA, nom: 'Repetida' }, { id: 'meva-ffffffffffffffff', nom: 'Sense adreça' }];
    const port = creaFontNoticies(creaAdaptadorRemot({ servei, persona: () => ({ noSeguides: [], personals }) }));
    const { fonts } = await port.llistaFonts();
    expect(fonts.filter((font) => font.id.startsWith('meva-')).map((font) => font.nom)).toEqual(['El meu blog']);
    expect(fonts.find((font) => font.id === 'pregoner').nom).toBe(FONTS_LLAVOR.find((font) => font.id === 'pregoner').nom);
  });
});
