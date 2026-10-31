/* VQ · Fase 3a de l'eina de pobles nous (261030; disseny
   nit/viquipedia_disseny.md §4.5, §4.6 i §6.3) · La memòria cau local (en
   memòria, `idb: null`, el mateix camí que la navegació privada) i el «sí»
   de la persona. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MAXIM_ENTRADES, NOM_BD, STORE, VIDA_MS, creaCauDeViquipedia, esCaducada, netejaEntrada } from './cauDeViquipedia.js';
import { creaIdbFals } from '../../utils/__fixtures__/navegadorFals.js';
import {
  CLAU_CONSENTIMENT, consentimentActiu, consentimentRecordat, donaConsentiment, oblidaConsentimentDeLaVisita,
  retiraConsentiment, subscriuConsentiment
} from './consentimentViquipedia.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { VERSIO_ALGORITME, clauDeViquipedia } from './fitxaDelPoble.js';

const DIA = 24 * 60 * 60 * 1000;
const FOTO = Object.freeze({
  src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/A.jpg/1920px-A.jpg', fitxer: 'A.jpg', amplada: 3008, alcada: 2000,
  autor: 'Relleu', llicencia: 'CC BY-SA 3.0 es', llicenciaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/es/deed.en',
  fontUrl: 'https://commons.wikimedia.org/wiki/File:A.jpg'
});
const DTO = Object.freeze({
  estat: 'complet', id: 'vilanova-de-prova', title: 'Vilanova de Prova', author: 'Gent de Vilanova de Prova',
  content: 'Un municipi inventat.', provincia: 'Alacant', comarca: 'L’Alcoià', population: '120 hab', lat: 38.6, lng: -0.4,
  wikidata_id: 'Q1', wikipedia_title: 'Vilanova de Prova', copyright: 'Text: Viquipèdia (CC BY-SA 4.0)',
  imatges: { hero: FOTO, avatar: { ...FOTO, fitxer: 'B.jpg' }, reserva: null },
  chat: '/xat?sobre=poble:vilanova-de-prova'
});
const CLAU = `vilanova-de-prova|alacant|a${VERSIO_ALGORITME}`;

let ara;
const nova = () => creaCauDeViquipedia({ idb: null, ara: () => ara, Canal: null, navegador: null });

beforeEach(() => {
  ara = Date.UTC(2026, 9, 30, 6);
});

describe('la cau', () => {
  test('desa i llig una proposta, sense chat ni camps desconeguts; la base es diu sdp-viquipedia', async () => {
    expect(NOM_BD).toBe('sdp-viquipedia');
    const cau = nova();
    expect(cau.entradaEnMemoria(CLAU)).toBeUndefined();
    expect(await cau.llig(CLAU)).toBeNull();
    expect(cau.entradaEnMemoria(CLAU)).toBeNull();
    await cau.desa(CLAU, { ...DTO, intrus: 'x' });
    const llegida = await cau.llig(CLAU);
    expect(llegida.llegitEl).toBe(ara);
    expect(llegida.dto).not.toHaveProperty('chat');
    expect(llegida.dto).not.toHaveProperty('intrus');
    expect(llegida.dto.imatges.avatar.fitxer).toBe('B.jpg');
    expect(cau.entradaEnMemoria(CLAU)).toBe(llegida);
  });

  test('vida: 30 dies per a complet i parcial, 7 per a sense-article; no-disponible no es desa', async () => {
    expect(VIDA_MS).toEqual({ complet: 30 * DIA, parcial: 30 * DIA, 'sense-article': 7 * DIA });
    const cau = nova();
    const desada = await cau.desa(CLAU, DTO);
    expect(esCaducada(desada, ara + 30 * DIA)).toBe(false);
    expect(esCaducada(desada, ara + 30 * DIA + 1)).toBe(true);
    expect(await cau.desa('altra|x|a1', { ...DTO, estat: 'no-disponible' })).toBeNull();
    expect(await cau.llig('altra|x|a1')).toBeNull();
    // Un sense-article caducat ja no diu res: es pot tornar a provar.
    await cau.desa('sense|x|a1', { ...DTO, estat: 'sense-article', content: '', imatges: {} });
    expect((await cau.llig('sense|x|a1')).dto.estat).toBe('sense-article');
    ara += 7 * DIA + 1;
    expect(await cau.llig('sense|x|a1')).toBeNull();
    // Un complet caducat es continua mostrant (amb la data), i es pot refrescar.
    expect((await cau.llig(CLAU)).dto.estat).toBe('complet');
  });

  test('la llista blanca rebutja URL de fora, javascript: i http:, i un QID fals', () => {
    const registre = (imatges, extra = {}) => ({ clau: CLAU, llegitEl: ara, dto: { ...DTO, imatges, ...extra } });
    for (const src of ['https://exemple.org/A.jpg', 'javascript:alert(1)', 'http://upload.wikimedia.org/A.jpg', 'https://user:pw@upload.wikimedia.org/A.jpg']) {
      expect(() => netejaEntrada(registre({ hero: { ...FOTO, src } })), src).toThrow(TypeError);
    }
    expect(() => netejaEntrada(registre({ hero: { ...FOTO, fontUrl: 'https://exemple.org/File:A.jpg' } }))).toThrow(TypeError);
    expect(() => netejaEntrada(registre({ hero: { ...FOTO, llicenciaUrl: 'javascript:alert(1)' } }))).toThrow(TypeError);
    expect(() => netejaEntrada(registre({}, { wikidata_id: 'Q1; DROP' }))).toThrow(TypeError);
    expect(() => netejaEntrada(registre({}, { estat: 'no-disponible' }))).toThrow(TypeError);
    expect(() => netejaEntrada(registre({}, { content: 'x'.repeat(257) }))).toThrow(TypeError);
    expect(() => netejaEntrada(registre({ hero: FOTO }))).not.toThrow();
  });

  test('un registre corrupte al disc és com si no hi fóra', async () => {
    const cau = nova();
    await cau.desa(CLAU, DTO);
    expect(() => netejaEntrada({ clau: CLAU, llegitEl: ara, dto: { ...DTO, imatges: { hero: { ...FOTO, src: 'javascript:x' } } } })).toThrow();
    // La llista blanca del magatzem tampoc no el deixa entrar.
    await expect(cau.desa(CLAU, { ...DTO, imatges: { hero: { ...FOTO, src: 'javascript:x' } } })).rejects.toThrow(TypeError);
  });

  test(`fitada a ${MAXIM_ENTRADES} entrades: se'n van les més velles`, async () => {
    const cau = nova();
    for (let i = 0; i < MAXIM_ENTRADES + 3; i += 1) {
      ara += 1000;
      await cau.desa(`poble-${i}|alacant|a1`, { ...DTO, title: `Poble ${i}` });
    }
    const totes = await Promise.all(Array.from({ length: MAXIM_ENTRADES + 3 }, (_, i) => cau.llig(`poble-${i}|alacant|a1`)));
    expect(totes.slice(0, 3)).toEqual([null, null, null]);
    expect(totes.slice(3).every(Boolean)).toBe(true);
  });

  test('pujar VERSIO_ALGORITME invalida la cau: la clau ja no casa', async () => {
    const cau = nova();
    await cau.desa(CLAU, DTO);
    expect(clauDeViquipedia({ title: 'Vilanova de Prova', provincia: 'Alacant' })).toBe(CLAU);
    expect(await cau.llig(CLAU.replace(/\|a\d+$/, `|a${VERSIO_ALGORITME + 1}`))).toBeNull();
  });

  test('llegir no crea la base: si el navegador diu que no hi és, cap obertura', async () => {
    const open = vi.fn(() => { throw new Error('cap obertura'); });
    const idb = { databases: vi.fn(async () => [{ name: 'una-altra', version: 1 }]), open };
    const cau = creaCauDeViquipedia({ idb, ara: () => ara, Canal: null, navegador: null });
    expect(await cau.llig(CLAU)).toBeNull();
    await cau.oblida(CLAU);
    await cau.oblidaTot();
    expect(idb.databases).toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  test('oblida una i totes, i avisa qui escolta', async () => {
    const cau = nova();
    let avisos = 0;
    const desfes = cau.subscriu(() => { avisos += 1; });
    await cau.desa(CLAU, DTO);
    await cau.desa('altra|x|a1', { ...DTO, title: 'Altra' });
    await cau.oblida(CLAU);
    expect(await cau.llig(CLAU)).toBeNull();
    expect(await cau.llig('altra|x|a1')).not.toBeNull();
    await cau.oblidaTot();
    expect(await cau.llig('altra|x|a1')).toBeNull();
    expect(avisos).toBeGreaterThanOrEqual(4);
    desfes();
    expect(cau.persistent).toBe(false);
  });
});

/* ── Cicle 4 · auditories matinals del 261030 (Gemini MITJÀ-02, Codex MITJÀ-C2 i MITJÀ-C3) ── */

/* Deixa córrer les microtasques, no les tasques: el disc fals (navegadorFals.js)
   respon en una tasca posterior, i la lectura ja hi és a la cua. */
const microtasques = async (n = 20) => {
  for (let i = 0; i < n; i += 1) await Promise.resolve();
};
const ambDisc = () => {
  const disc = creaIdbFals();
  return { ...disc, cau: creaCauDeViquipedia({ idb: disc.idb, ara: () => ara, Canal: null, navegador: null }) };
};
const clausAlDisc = (files) => files(NOM_BD, STORE).map((registre) => registre.clau);

describe('c4 · l’enllaç de la llicència d’una foto, només de Creative Commons o de Commons (MITJÀ-02)', () => {
  const ambLlicencia = (llicenciaUrl) => ({ ...DTO, imatges: { hero: { ...FOTO, llicenciaUrl }, avatar: null, reserva: null } });

  test.each([
    'https://creativecommons.org/licenses/by-sa/4.0/',
    'https://www.creativecommons.org/publicdomain/zero/1.0/deed.ca',
    'https://commons.wikimedia.org/wiki/Template:PD-old'
  ])('es conserva: %s', (llicenciaUrl) => {
    expect(netejaEntrada({ clau: CLAU, llegitEl: ara, dto: ambLlicencia(llicenciaUrl) }).dto.imatges.hero.llicenciaUrl).toBe(llicenciaUrl);
  });

  test.each([
    'https://exemple.org/llicencia',
    'https://creativecommons.org.exemple.org/licenses/by/4.0/',
    'https://upload.wikimedia.org/wikipedia/commons/llicencia'
  ])('una adreça https d’un altre lloc no arriba a cap href, i la proposta es desa igual: %s', async (llicenciaUrl) => {
    const neta = netejaEntrada({ clau: CLAU, llegitEl: ara, dto: ambLlicencia(llicenciaUrl) });
    expect(neta.dto.imatges.hero.llicenciaUrl).toBeNull();
    expect(neta.dto.imatges.hero.llicencia).toBe(FOTO.llicencia);
    const desada = await nova().desa(CLAU, ambLlicencia(llicenciaUrl));
    expect(desada.dto.imatges.hero.llicenciaUrl).toBeNull();
    expect(desada.dto.imatges.hero.fontUrl).toBe(FOTO.fontUrl);
  });
});

describe('c4 · una lectura antiga no desfà un oblit ni un desat (MITJÀ-C2)', () => {
  test('oblidar mentre es llig: la lectura no torna a posar a mà el que ja s’ha oblidat', async () => {
    const cau = nova();
    await cau.desa(CLAU, DTO);
    const lectura = cau.llig(CLAU);
    const oblit = cau.oblida(CLAU);
    const [llegida] = await Promise.all([lectura, oblit]);
    expect(llegida).toBeNull();
    expect(cau.entradaEnMemoria(CLAU)).toBeNull();
    expect(await cau.llig(CLAU)).toBeNull();
  });

  test('l’oblit global també invalida les lectures pendents', async () => {
    const cau = nova();
    await cau.desa(CLAU, DTO);
    await cau.desa('altra|x|a1', { ...DTO, title: 'Altra' });
    const lectures = Promise.all([cau.llig(CLAU), cau.llig('altra|x|a1')]);
    const oblit = cau.oblidaTot();
    expect(await lectures).toEqual([null, null]);
    await expect(oblit).resolves.toBe(true);
    expect([cau.entradaEnMemoria(CLAU), cau.entradaEnMemoria('altra|x|a1')]).toEqual([null, null]);
  });

  test('desar mentre una lectura del disc és en camí: mana el desat', async () => {
    const { cau } = ambDisc();
    await cau.desa(CLAU, DTO);
    const lectura = cau.llig(CLAU);
    await microtasques();
    const desat = cau.desa(CLAU, { ...DTO, title: 'Vilanova Nova' });
    const [llegida] = await Promise.all([lectura, desat]);
    expect(llegida.dto.title).toBe('Vilanova Nova');
    expect(cau.entradaEnMemoria(CLAU).dto.title).toBe('Vilanova Nova');
    expect((await cau.llig(CLAU)).dto.title).toBe('Vilanova Nova');
  });

  test('oblidar mentre una lectura del disc és en camí: la mà queda buida i el disc també', async () => {
    const { cau, files } = ambDisc();
    await cau.desa(CLAU, DTO);
    const lectura = cau.llig(CLAU);
    await microtasques();
    const oblit = cau.oblida(CLAU);
    expect(await lectura).toBeNull();
    await oblit;
    expect(cau.entradaEnMemoria(CLAU)).toBeNull();
    expect(clausAlDisc(files)).toEqual([]);
  });

  test('una lectura demanada després d’un desat l’espera, encara que el disc vaja tard', async () => {
    const { idb: disc } = creaIdbFals();
    let solta;
    const bases = new Promise((resol) => { solta = resol; });
    const idb = { open: (...args) => disc.open(...args), databases: () => bases };
    const cau = creaCauDeViquipedia({ idb, ara: () => ara, Canal: null, navegador: null });
    const oblit = cau.oblida('altra|x|a1'); // espera la llista de bases
    const desat = cau.desa(CLAU, DTO); // a la cua, darrere de l'oblit
    const lectura = cau.llig(CLAU);
    solta([{ name: NOM_BD, version: 1 }]);
    await Promise.all([oblit, desat]);
    expect((await lectura).dto.title).toBe(DTO.title);
    expect(cau.entradaEnMemoria(CLAU).dto.title).toBe(DTO.title);
  });

  test('oblidar i tornar a portar-ho de seguida: al disc queda el que s’ha portat, en l’ordre en què s’ha fet', async () => {
    const disc = creaIdbFals();
    let solta;
    const bases = new Promise((resol) => { solta = resol; });
    const idb = { open: (...args) => disc.idb.open(...args), databases: () => bases };
    const cau = creaCauDeViquipedia({ idb, ara: () => ara, Canal: null, navegador: null });
    const oblit = cau.oblida(CLAU);
    const desat = cau.desa(CLAU, { ...DTO, title: 'Portada de nou' });
    solta([{ name: NOM_BD, version: 1 }]);
    await Promise.all([oblit, desat]);
    expect(disc.files(NOM_BD, STORE).map((registre) => registre.dto.title)).toEqual(['Portada de nou']);
    expect(cau.entradaEnMemoria(CLAU).dto.title).toBe('Portada de nou');
  });
});

describe('c4 · oblida() confirma l’esborrat o diu que ha fallat (MITJÀ-C3)', () => {
  test('confirma; si el disc no respon, falla, la mà continua buida (també en tornar a llegir) i un reintent l’acaba', async () => {
    const { cau, control, files } = ambDisc();
    await cau.desa(CLAU, DTO);
    await cau.desa('altra|x|a1', { ...DTO, title: 'Altra' });
    await expect(cau.oblida('altra|x|a1')).resolves.toBe(true);
    expect(clausAlDisc(files)).toEqual([CLAU]);
    let avisos = 0;
    const desfes = cau.subscriu(() => { avisos += 1; });
    control.fallaObrir = true;
    await expect(cau.oblida(CLAU)).rejects.toThrow();
    expect(cau.oblitFallit(CLAU)).toBe(true);
    expect(cau.oblitFallit('altra|x|a1')).toBe(false);
    expect(cau.entradaEnMemoria(CLAU)).toBeNull();
    expect(avisos).toBeGreaterThanOrEqual(2);
    control.fallaObrir = false;
    // El disc encara la guarda, però llegir-la no la torna a posar a mà.
    expect(clausAlDisc(files)).toEqual([CLAU]);
    expect(await cau.llig(CLAU)).toBeNull();
    expect(cau.entradaEnMemoria(CLAU)).toBeNull();
    await expect(cau.oblida(CLAU)).resolves.toBe(true);
    expect(cau.oblitFallit(CLAU)).toBe(false);
    expect(clausAlDisc(files)).toEqual([]);
    desfes();
  });

  test('després d’un oblit fallit, portar-ho de nou (desa) torna a valdre', async () => {
    const { cau, control } = ambDisc();
    await cau.desa(CLAU, DTO);
    control.fallaObrir = true;
    await expect(cau.oblida(CLAU)).rejects.toThrow();
    control.fallaObrir = false;
    await cau.desa(CLAU, { ...DTO, title: 'Tornada' });
    expect(cau.oblitFallit(CLAU)).toBe(false);
    expect((await cau.llig(CLAU)).dto.title).toBe('Tornada');
  });

  test('un oblit confirmat no deixa la clau tapada: el que una altra pestanya hi torne a desar es llig', async () => {
    const { idb } = creaIdbFals();
    const aquesta = creaCauDeViquipedia({ idb, ara: () => ara, Canal: null, navegador: null });
    const altra = creaCauDeViquipedia({ idb, ara: () => ara, Canal: null, navegador: null });
    await aquesta.desa(CLAU, DTO);
    await expect(aquesta.oblida(CLAU)).resolves.toBe(true);
    await altra.desa(CLAU, { ...DTO, title: 'De l’altra pestanya' });
    expect((await aquesta.llig(CLAU)).dto.title).toBe('De l’altra pestanya');
  });

  test('si mentre el disc fallava s’ha tornat a desar, mana el desat: cap oblit fallit', async () => {
    const { cau, control } = ambDisc();
    await cau.desa(CLAU, DTO);
    control.fallaObrir = true;
    const oblit = cau.oblida(CLAU);
    const desat = cau.desa(CLAU, { ...DTO, title: 'Tornada' });
    await expect(oblit).rejects.toThrow();
    await desat;
    expect(cau.oblitFallit(CLAU)).toBe(false);
    expect(cau.entradaEnMemoria(CLAU).dto.title).toBe('Tornada');
  });

  test('l’oblit global acaba també un oblit que havia fallat', async () => {
    const { cau, control, files } = ambDisc();
    await cau.desa(CLAU, DTO);
    control.fallaObrir = true;
    await expect(cau.oblida(CLAU)).rejects.toThrow();
    control.fallaObrir = false;
    await expect(cau.oblidaTot()).resolves.toBe(true);
    expect(cau.oblitFallit(CLAU)).toBe(false);
    expect(clausAlDisc(files)).toEqual([]);
  });

  test('sense base al navegador no hi ha res a esborrar: també confirma', async () => {
    const idb = { databases: vi.fn(async () => []), open: vi.fn(() => { throw new Error('cap obertura'); }) };
    const cau = creaCauDeViquipedia({ idb, ara: () => ara, Canal: null, navegador: null });
    await expect(cau.oblida(CLAU)).resolves.toBe(true);
    expect(idb.open).not.toHaveBeenCalled();
  });
});

describe('el sí de la persona', () => {
  const fisica = `${STORAGE_PREFIX}${CLAU_CONSENTIMENT}`;
  afterEach(() => {
    retiraConsentiment();
    oblidaConsentimentDeLaVisita();
  });

  test('sense cap gest, no; el de la visita no escriu res; «Recorda-ho» escriu sdp_embed_viquipedia', () => {
    expect(fisica).toBe('sdp_embed_viquipedia');
    expect(consentimentActiu()).toBe(false);
    let avisos = 0;
    const desfes = subscriuConsentiment(() => { avisos += 1; });
    donaConsentiment();
    expect(consentimentActiu()).toBe(true);
    expect(consentimentRecordat()).toBe(false);
    expect(window.localStorage.getItem(fisica)).toBeNull();
    oblidaConsentimentDeLaVisita();
    expect(consentimentActiu()).toBe(false);
    expect(donaConsentiment({ recorda: true })).toBe(true);
    expect(window.localStorage.getItem(fisica)).toBe('"sempre"');
    oblidaConsentimentDeLaVisita();
    expect(consentimentActiu()).toBe(true);
    retiraConsentiment();
    expect(window.localStorage.getItem(fisica)).toBeNull();
    expect(consentimentActiu()).toBe(false);
    expect(avisos).toBe(5);
    desfes();
  });
});
