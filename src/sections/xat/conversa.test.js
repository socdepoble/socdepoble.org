/* Torn 260930 (T1 · la conversa amb el patró de missatgeria) · Les funcions
   pures de la conversa: grups per autor, separador de no llegits, canvis de
   la llista, geometria del scroll i textos de la cita. */
import { describe, expect, test, vi } from 'vitest';
import {
  LLINDAR_FONS_PX, anotaGrups, anunciDeNous, autorDeCita, classificaCanvi, clauAutor, clauDe, comportamentDesplacament,
  construeixFiles, estaAlFons, estatObertura, extremsSeq, noLlegitsEnObrir, nousAnunciables, scrollPerCentrar, scrollPerDeixarDalt,
  textDeCita
} from './conversa.js';

const t = (_, alternativa) => alternativa;

/* Hores del mateix dia local (migdia), i de l'anterior, per als separadors. */
const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60000).toISOString();
const ahir = (minuts) => new Date(migdia.getTime() - 86400000 + minuts * 60000).toISOString();

const m = (id, seq, sender, extra = {}) => ({
  id, seq, sender, text: `Text ${id}`, creatAl: hui(seq ?? 0),
  ...(sender === 'me' ? {} : { author: 'Pep', usuariId: 'pep' }),
  ...extra
});
const sistema = (id, seq) => ({ id, seq, tipus: 'sistema', sender: 'other', metadades: {}, text: 'Canvi', creatAl: hui(seq) });
const primers = (files) => files.filter((f) => f.tipus === 'missatge').map((f) => [f.clau, f.primerDelGrup]);

describe('clauAutor i anotaGrups', () => {
  test('els propis són «jo»; els altres, per persona i per entitat; el sistema no té autor', () => {
    expect(clauAutor(m('1', 1, 'me'))).toBe('jo');
    expect(clauAutor(m('2', 2, 'other'))).toBe('persona:pep');
    expect(clauAutor(m('3', 3, 'other', { comEntitat: true }))).toBe('entitat:pep');
    expect(clauAutor(m('4', 4, 'other', { usuariId: undefined, author: 'Maria' }))).toBe('persona:Maria');
    expect(clauAutor(m('5', 5, 'other', { is_ai: true, usuariId: 'iaia' }))).toBe('persona:ia:iaia');
    expect(clauAutor(sistema('s', 6))).toBeNull();
    expect(clauAutor(null)).toBeNull();
  });

  test('la tirada del mateix autor només marca la primera; un altre autor, un separador o el sistema la tallen', () => {
    const files = [
      { tipus: 'missatge', clau: '1', msg: m('1', 1, 'other') },
      { tipus: 'missatge', clau: '2', msg: m('2', 2, 'other') },
      { tipus: 'missatge', clau: '3', msg: m('3', 3, 'other') },
      { tipus: 'missatge', clau: 's', msg: sistema('s', 4) },
      { tipus: 'missatge', clau: '5', msg: m('5', 5, 'other') },
      { tipus: 'dia', clau: 'dia-x' },
      { tipus: 'missatge', clau: '6', msg: m('6', 6, 'other') },
      { tipus: 'missatge', clau: '7', msg: m('7', 7, 'me') },
      { tipus: 'missatge', clau: '8', msg: m('8', 8, 'me') },
      { tipus: 'missatge', clau: '9', msg: m('9', 9, 'other', { usuariId: 'maria', author: 'Maria' }) }
    ];
    expect(primers(anotaGrups(files))).toEqual([
      ['1', true], ['2', false], ['3', false], ['s', true], ['5', true], ['6', true], ['7', true], ['8', false], ['9', true]
    ]);
    /* Les files que no són missatges passen tal qual. */
    expect(anotaGrups(files)[5]).toBe(files[5]);
  });
});

describe('noLlegitsEnObrir', () => {
  const llista = [m('1', 1, 'other'), m('2', 2, 'me'), m('3', 3, 'other'), m('4', 4, 'me'), m('5', 5, 'other')];

  test('compta els dels altres per damunt de la marca i diu quin és el primer', () => {
    expect(noLlegitsEnObrir(llista, 2)).toEqual({ clau: '3', quants: 2 });
    expect(noLlegitsEnObrir(llista, '4')).toEqual({ clau: '5', quants: 1 });
    expect(noLlegitsEnObrir(llista, 0)).toEqual({ clau: '1', quants: 3 });
  });

  test('sense no llegits, sense marca o amb una marca que no és un número, cap separador', () => {
    expect(noLlegitsEnObrir(llista, 5)).toBeNull();
    expect(noLlegitsEnObrir(llista, null)).toBeNull();
    expect(noLlegitsEnObrir(llista, undefined)).toBeNull();
    expect(noLlegitsEnObrir(llista, '')).toBeNull();
    expect(noLlegitsEnObrir(llista, 'x')).toBeNull();
    expect(noLlegitsEnObrir([], 0)).toBeNull();
  });

  test('els pendents (sense seq) no compten', () => {
    expect(noLlegitsEnObrir([m('p', null, 'other')], 0)).toBeNull();
  });

  /* Revisió adversarial 260930, #4: 80 no llegits i una pàgina de 50. */
  test('si el primer no llegit no s’ha carregat, el recompte és el del fil i no el de la pàgina', () => {
    const pagina = [m('51', 51, 'other'), m('52', 52, 'me'), m('53', 53, 'other')];
    expect(noLlegitsEnObrir(pagina, 20, { hiHaMes: true, total: 80 })).toEqual({ clau: '51', quants: 80 });
    /* Sense historial per damunt, o amb el primer no llegit carregat, mana la pàgina. */
    expect(noLlegitsEnObrir(pagina, 20, { hiHaMes: false, total: 80 })).toEqual({ clau: '51', quants: 2 });
    expect(noLlegitsEnObrir(pagina, 50, { hiHaMes: true, total: 80 })).toEqual({ clau: '51', quants: 2 });
    /* Un total que no és un número, o menor, no rebaixa el recompte. */
    expect(noLlegitsEnObrir(pagina, 20, { hiHaMes: true, total: 1 })).toEqual({ clau: '51', quants: 2 });
    expect(noLlegitsEnObrir(pagina, 20, { hiHaMes: true, total: null })).toEqual({ clau: '51', quants: 2 });
  });
});

/* Revisió adversarial 260930, #1 i #4: la conversa espera a estar al dia
   abans de fixar el separador i fer el salt inicial. */
describe('extremsSeq i estatObertura', () => {
  test('el seq més baix i el més alt del servidor; els pendents no compten', () => {
    expect(extremsSeq([m('p', null, 'me'), m('3', 3, 'other'), m('1', 1, 'me')])).toEqual({ minim: 1, maxim: 3 });
    expect(extremsSeq([m('p', null, 'me')])).toEqual({ minim: null, maxim: null });
    expect(extremsSeq(undefined)).toEqual({ minim: null, maxim: null });
  });

  test('buida sense missatges; rància si la memòria cau no arriba a l’ultimSeq d’obrir (un pendent no la posa al dia)', () => {
    const cau = [m('1', 1, 'other'), m('2', 2, 'other'), m('3', 3, 'other')];
    expect(estatObertura([], { ultimSeq: 6 })).toBe('buida');
    expect(estatObertura(cau, { ultimSeq: 6, llegitFinsSeq: 3 })).toBe('rancia');
    expect(estatObertura([...cau, m('p', null, 'me')], { ultimSeq: 6, llegitFinsSeq: 3 })).toBe('rancia');
    expect(estatObertura([m('p', null, 'me')], { ultimSeq: 6 })).toBe('rancia');
    expect(estatObertura([...cau, m('6', 6, 'other')], { ultimSeq: 6, llegitFinsSeq: 3 })).toBe('llesta');
    /* Sense ultimSeq conegut (o 0, un fil nou) no hi ha res a esperar. */
    expect(estatObertura(cau, { llegitFinsSeq: 3 })).toBe('llesta');
    expect(estatObertura([m('p', null, 'me')], { ultimSeq: 0 })).toBe('llesta');
  });

  test('antics si falta el missatge de després de la marca i el servidor en té més', () => {
    const pagina = [m('51', 51, 'other'), m('100', 100, 'other')];
    expect(estatObertura(pagina, { ultimSeq: 100, llegitFinsSeq: 20, hiHaMes: true })).toBe('antics');
    expect(estatObertura(pagina, { ultimSeq: 100, llegitFinsSeq: 20, hiHaMes: false })).toBe('llesta');
    expect(estatObertura(pagina, { ultimSeq: 100, llegitFinsSeq: 50, hiHaMes: true })).toBe('llesta');
    /* Sense marca (visitant) no es busca cap no llegit. */
    expect(estatObertura(pagina, { ultimSeq: 100, llegitFinsSeq: null, hiHaMes: true })).toBe('llesta');
  });
});

describe('construeixFiles', () => {
  test('separador de dia a cada canvi de dia, i el grup no passa d’un dia a l’altre', () => {
    const files = construeixFiles([
      m('1', 1, 'other', { creatAl: ahir(1) }),
      m('2', 2, 'other', { creatAl: ahir(2) }),
      m('3', 3, 'other', { creatAl: hui(3) })
    ]);
    expect(files.map((f) => f.tipus)).toEqual(['dia', 'missatge', 'missatge', 'dia', 'missatge']);
    expect(primers(files)).toEqual([['1', true], ['2', false], ['3', true]]);
  });

  test('el de no llegits va davant del primer no llegit i talla el grup', () => {
    const files = construeixFiles(
      [m('1', 1, 'other'), m('2', 2, 'other'), m('3', 3, 'other')],
      { noLlegits: { clau: '3', quants: 1 } }
    );
    expect(files.map((f) => f.tipus)).toEqual(['dia', 'missatge', 'missatge', 'no-llegits', 'missatge']);
    expect(files[3]).toEqual({ tipus: 'no-llegits', clau: 'no-llegits', quants: 1 });
    expect(primers(files)).toEqual([['1', true], ['2', false], ['3', true]]);
  });

  test('sense id, la clau és la posició (com abans de l’extracció)', () => {
    expect(clauDe({ text: 'x' }, 4)).toBe('pos-4');
    expect(construeixFiles([{ text: 'x', sender: 'me' }]).map((f) => f.clau)).toEqual(['pos-0']);
    expect(construeixFiles(undefined)).toEqual([]);
  });
});

describe('classificaCanvi', () => {
  const llista = [m('3', 3, 'other'), m('4', 4, 'other')];

  test('la primera càrrega és inicial; una llista buida, no', () => {
    expect(classificaCanvi([], llista)).toEqual({ inicial: true, antics: 0, nous: [] });
    expect(classificaCanvi([], [])).toEqual({ inicial: false, antics: 0, nous: [] });
  });

  test('els que entren davant del primer són antics; els de darrere, nous', () => {
    const antics = [m('1', 1, 'other'), m('2', 2, 'other'), ...llista];
    expect(classificaCanvi(['3', '4'], antics)).toEqual({ inicial: false, antics: 2, nous: [] });
    const nou = m('5', 5, 'me');
    expect(classificaCanvi(['3', '4'], [...llista, nou])).toEqual({ inicial: false, antics: 0, nous: [nou] });
  });

  test('un pendent confirmat conserva l’id i no és nou; res no canvia, res no es mou', () => {
    const pendent = { ...m('p', null, 'me'), estatEnviament: 'pendent' };
    const confirmat = { ...pendent, seq: 5, estatEnviament: 'enviat' };
    expect(classificaCanvi(['3', '4', 'p'], [...llista, confirmat]).nous).toEqual([]);
    expect(classificaCanvi(['3', '4'], llista)).toEqual({ inicial: false, antics: 0, nous: [] });
  });
});

describe('geometria del scroll', () => {
  test('a baix vol dir a menys de LLINDAR_FONS_PX (2rem) del fons', () => {
    expect(LLINDAR_FONS_PX).toBe(32);
    expect(estaAlFons({ scrollHeight: 1000, scrollTop: 600, clientHeight: 400 })).toBe(true);
    expect(estaAlFons({ scrollHeight: 1000, scrollTop: 568, clientHeight: 400 })).toBe(true);
    expect(estaAlFons({ scrollHeight: 1000, scrollTop: 567, clientHeight: 400 })).toBe(false);
    expect(estaAlFons({ scrollHeight: 1000, scrollTop: 500, clientHeight: 400 }, 100)).toBe(true);
    expect(estaAlFons()).toBe(true);
  });

  test('deixar dalt i centrar es calculen des de les caixes, sense baixar de zero', () => {
    const llista = { top: 100, height: 400 };
    expect(scrollPerDeixarDalt(0, llista, { top: 600, height: 30 }, 16)).toBe(484);
    expect(scrollPerDeixarDalt(200, llista, { top: 50, height: 30 })).toBe(150);
    expect(scrollPerDeixarDalt(0, llista, { top: 50, height: 30 })).toBe(0);
    expect(scrollPerCentrar(0, llista, { top: 700, height: 50 })).toBe(425);
    /* Més alt que la vista: queda a dalt. */
    expect(scrollPerCentrar(0, llista, { top: 700, height: 600 })).toBe(600);
  });

  test('sense animació si es demana menys moviment, si no hi ha matchMedia o si falla', () => {
    expect(comportamentDesplacament(vi.fn(() => ({ matches: true })))).toBe('auto');
    const cap = vi.fn(() => ({ matches: false }));
    expect(comportamentDesplacament(cap)).toBe('smooth');
    expect(cap).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(comportamentDesplacament(null)).toBe('auto');
    expect(comportamentDesplacament(() => { throw new Error('sense suport'); })).toBe('auto');
  });
});

describe('textos de la cita', () => {
  test('l’autor és «Tu» si el missatge és teu; si no, el seu nom o «Veí»', () => {
    expect(autorDeCita(m('1', 1, 'me'), t)).toBe('Tu');
    expect(autorDeCita(m('2', 2, 'other'), t)).toBe('Pep');
    expect(autorDeCita({ sender: 'other', author_name: 'Maria' }, t)).toBe('Maria');
    expect(autorDeCita({ sender: 'other' }, t)).toBe('Veí');
  });

  test('el text és el del missatge, o la làpida si s’ha esborrat', () => {
    expect(textDeCita(m('1', 1, 'other', { text: 'Bon dia' }), t)).toBe('Bon dia');
    expect(textDeCita({ content: 'Antic' }, t)).toBe('Antic');
    expect(textDeCita({ esborrat: true, text: 'x' }, t)).toBe("S'ha esborrat este missatge");
    expect(textDeCita(null, t)).toBe('');
  });

  /* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-1) · Un adjunt sense peu es desa amb text NULL. */
  test('un adjunt sense peu es cita pel seu tipus; amb peu, pel peu', () => {
    expect(textDeCita({ tipus: 'imatge', text: null }, t)).toBe('Foto adjunta');
    expect(textDeCita({ tipus: 'video', text: '' }, t)).toBe('Vídeo adjunt');
    expect(textDeCita({ tipus: 'veu' }, t)).toBe('Missatge de veu');
    expect(textDeCita({ tipus: 'imatge', text: 'La bassa' }, t)).toBe('La bassa');
    expect(textDeCita({ tipus: 'text', text: '' }, t)).toBe('');
  });
});

/* Revisió adversarial 260930, #11: només s'anuncien els nous d'altres. */
describe('anunciDeNous', () => {
  test('un de sol diu qui i què; més d’un, quants; els propis i el sistema no', () => {
    expect(anunciDeNous([m('1', 1, 'other', { text: 'Bon dia' })], t)).toBe('Pep: Bon dia');
    expect(anunciDeNous([m('1', 1, 'other'), m('2', 2, 'other')], t)).toBe('2 missatges nous');
    expect(anunciDeNous([m('1', 1, 'me'), m('2', 2, 'other', { esborrat: true })], t)).toBe("Pep: S'ha esborrat este missatge");
    expect(anunciDeNous([m('1', 1, 'me'), sistema('s', 2)], t)).toBe('');
    expect(anunciDeNous(undefined, t)).toBe('');
  });
});

/* Fase D (261020, tasca 2) · El missatge d'algú que has bloquejat arriba
   anotat de XatContext (bloquejat: true, sense text): ni s'anuncia ni es
   cita amb el seu text. */
describe('missatges de qui has bloquejat', () => {
  test('nousAnunciables no els compta, i anunciDeNous no en diu res', () => {
    const amagat = m('2', 2, 'other', { text: '', bloquejat: true });
    expect(nousAnunciables([m('1', 1, 'other'), amagat])).toEqual([m('1', 1, 'other')]);
    expect(anunciDeNous([amagat], t)).toBe('');
    expect(anunciDeNous([m('1', 1, 'other', { text: 'Bon dia' }), amagat], t)).toBe('Pep: Bon dia');
  });

  test('la cita diu «Missatge amagat», també si a més s’ha esborrat', () => {
    expect(textDeCita(m('1', 1, 'other', { text: '', bloquejat: true }), t)).toBe('Missatge amagat');
    expect(textDeCita({ bloquejat: true, esborrat: true }, t)).toBe('Missatge amagat');
  });
});
