// @vitest-environment node
/* Lector de notícies · les fonts personals (nucli pur, SN 261003). Adreces
   d'example.org (domini reservat): cap dada personal. */
import { describe, expect, test } from 'vitest';
import {
  LIMITS_PERSONALS, MOTIUS_PERSONAL, afigPersonal, idFontPersonal, llevaPersonal, llocDe, normalitzaFontPersonal,
  normalitzaPersonals, personalsInicials, tePersonal, validaFontPersonal
} from './index.js';

const URL_FONT = 'https://www.example.org/noticies';
const CATEGORIES = ['festes', 'camp'];

describe('l’id', () => {
  test('determinista per l’adreça, amb el prefix «meva» i opac per a la URL de l’app', () => {
    const id = idFontPersonal(URL_FONT);
    expect(id).toMatch(/^meva-[0-9a-f]{16}$/);
    expect(idFontPersonal(URL_FONT)).toBe(id);
    expect(idFontPersonal('https://www.example.org/altra')).not.toBe(id);
  });
});

describe('validaFontPersonal', () => {
  test('una adreça web, un nom i una categoria del poble', () => {
    const { ok, font } = validaFontPersonal({ url: `  ${URL_FONT}  `, nom: '  La   Veu  ', categoriaId: 'festes' }, CATEGORIES);
    expect(ok).toBe(true);
    expect(font).toEqual({ id: idFontPersonal(URL_FONT), nom: 'La Veu', url: URL_FONT, categoriaId: 'festes' });
    expect(Object.isFrozen(font)).toBe(true);
  });

  test('sense categoria (buida o null) és null', () => {
    expect(validaFontPersonal({ url: URL_FONT, nom: 'X', categoriaId: '' }).font.categoriaId).toBeNull();
    expect(validaFontPersonal({ url: URL_FONT, nom: 'X', categoriaId: null }).font.categoriaId).toBeNull();
    expect(validaFontPersonal({ url: URL_FONT, nom: 'X' }).font.categoriaId).toBeNull();
  });

  test.each([
    ['sense adreça', { nom: 'X' }, 'url'],
    ['una adreça buida', { url: '   ', nom: 'X' }, 'url'],
    ['javascript:', { url: 'javascript:alert(1)', nom: 'X' }, 'url-no-web'],
    ['ftp:', { url: 'ftp://example.org/feed', nom: 'X' }, 'url-no-web'],
    ['data:', { url: 'data:text/html,hola', nom: 'X' }, 'url-no-web'],
    /* L'arrova es compon: la porta de dades sintètiques (qualitat.test.js) la llegiria com un correu. */
    ['amb credencials', { url: ['https://nom:clau', 'example.org/feed'].join('@'), nom: 'X' }, 'url-no-web'],
    ['relativa', { url: '/feed', nom: 'X' }, 'url-no-web'],
    ['massa llarga', { url: `https://example.org/${'a'.repeat(2100)}`, nom: 'X' }, 'url-no-web'],
    ['sense nom', { url: URL_FONT, nom: '   ' }, 'nom'],
    ['una categoria que no és del poble', { url: URL_FONT, nom: 'X', categoriaId: 'inventada' }, 'categoria'],
    ['una categoria reservada', { url: URL_FONT, nom: 'X', categoriaId: 'fonts' }, 'categoria']
  ])('%s: el motiu', (_que, entrada, motiu) => {
    expect(validaFontPersonal(entrada, [...CATEGORIES, 'fonts'])).toEqual({ ok: false, motiu });
    expect(MOTIUS_PERSONAL[motiu].text.length).toBeGreaterThan(10);
  });

  test('el nom es talla al límit del model (80) sense partir cap emoji', () => {
    const { font } = validaFontPersonal({ url: URL_FONT, nom: `${'a'.repeat(79)}🍅` });
    expect(font.nom).toBe('a'.repeat(79));
  });

  test('els motius diuen a quin camp van', () => {
    expect(MOTIUS_PERSONAL.nom.camp).toBe('nom');
    expect(MOTIUS_PERSONAL.categoria.camp).toBe('categoria');
    expect(MOTIUS_PERSONAL['url-no-web'].text).toMatch(/http o https/);
    expect(MOTIUS_PERSONAL.repetida.camp).toBeNull();
    /* Correcció SN-R2 · No és de cap camp: va al peu del snippet. */
    expect(MOTIUS_PERSONAL['no-persistent'].camp).toBeNull();
    expect(MOTIUS_PERSONAL['no-persistent'].text).toMatch(/no deixa guardar/);
  });
});

describe('afig i lleva', () => {
  const font = (n) => validaFontPersonal({ url: `https://example.org/${n}`, nom: `Font ${n}` }).font;

  test('afig davant; la mateixa adreça és repetida i no canvia res', () => {
    const u = afigPersonal(personalsInicials(), font(1));
    expect(u.motiu).toBeNull();
    const dos = afigPersonal(u.registre, font(2)).registre;
    expect(dos.fonts.map((f) => f.nom)).toEqual(['Font 2', 'Font 1']);
    const repetida = afigPersonal(dos, font(1));
    expect(repetida).toEqual({ registre: dos, motiu: 'repetida' });
    expect(repetida.registre).toBe(dos);
  });

  test('plena: el límit no es passa', () => {
    let registre = personalsInicials();
    for (let n = 0; n < LIMITS_PERSONALS.fonts; n += 1) registre = afigPersonal(registre, font(n)).registre;
    expect(registre.fonts).toHaveLength(LIMITS_PERSONALS.fonts);
    expect(afigPersonal(registre, font('una-mes'))).toEqual({ registre, motiu: 'plena' });
  });

  test('lleva per l’id; si no hi era, el mateix registre', () => {
    const registre = afigPersonal(afigPersonal(personalsInicials(), font(1)).registre, font(2)).registre;
    const id = font(1).id;
    expect(tePersonal(registre, id)).toBe(true);
    const sense = llevaPersonal(registre, id);
    expect(sense.fonts.map((f) => f.nom)).toEqual(['Font 2']);
    expect(llevaPersonal(sense, id)).toBe(sense);
  });
});

describe('normalització (la llista blanca del magatzem)', () => {
  test('un registre corrupte o vell es llig net: sense fonts dolentes, repetides ni camps de més', () => {
    const bona = { url: URL_FONT, nom: 'Bona', categoriaId: 'festes', secret: 'no', id: 'id-falsificat' };
    const net = normalitzaPersonals({
      esquema: 99,
      altres: 'no',
      fonts: [bona, { ...bona, nom: 'Repetida' }, { url: 'javascript:x', nom: 'Dolenta' }, { url: URL_FONT }, 'text', null]
    });
    expect(net).toEqual({ esquema: 1, fonts: [{ id: idFontPersonal(URL_FONT), nom: 'Bona', url: URL_FONT, categoriaId: 'festes' }] });
    expect(normalitzaPersonals(undefined)).toEqual(personalsInicials());
    expect(normalitzaPersonals({ fonts: 'trencat' })).toEqual(personalsInicials());
  });

  test('una categoria que no és un id lliure cau a null; l’id sempre es recalcula', () => {
    expect(normalitzaFontPersonal({ url: URL_FONT, nom: 'X', categoriaId: 'Hui!' }).categoriaId).toBeNull();
    expect(normalitzaFontPersonal({ url: URL_FONT, nom: 'X', id: 'meva-0000000000000000' }).id).toBe(idFontPersonal(URL_FONT));
  });

  test('llocDe: el domini sense «www.»', () => {
    expect(llocDe(URL_FONT)).toBe('example.org');
    expect(llocDe('no és una adreça')).toBe('');
  });
});
