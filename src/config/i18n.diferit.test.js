/**
 * Fase D (261020, tasca 4.1) · L1 · Diccionaris sota demanda.
 *  · El valencià és en memòria des del principi; es, en, eu i gl arriben amb
 *    import() i, mentrestant, el text és el valencià sencer.
 *  · Una càrrega en vol es compartix; una de fallida no es guarda, i la crida
 *    següent ho torna a provar.
 *  · Una càrrega que arriba tard d'una llengua que ja no es demana no canvia
 *    la llengua pintable de la que sí.
 *  · Cada oient va aïllat: un que llança no talla els altres.
 *  · pintaAmbDiccionari (main.jsx, natiu/entrada.jsx) pinta a l'acte amb el
 *    diccionari en memòria i, si no hi és, quan arriba o falla, com a molt
 *    ESPERA_DEL_PRIMER_PINTAT ms; sempre una sola vegada.
 * Este fitxer NO importa tests/helpers/diccionaris.js: el registre de l'app
 * comença amb el valencià tot sol, com al navegador.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ESPERA_DEL_PRIMER_PINTAT, IDIOMES_DIFERITS, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, carregaDiccionari, creaRegistreDeDiccionaris,
  createTranslator, desaIdiomaTriat, llenguaCarregada, pintaAmbDiccionari, subscriuDiccionaris, teDiccionari
} from './i18n.js';
import { delVal } from './storage.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delVal(LANGUAGE_STORAGE_KEY);
});

/** Una promesa que la prova resol o rebutja quan vol. */
function diferida() {
  let resol;
  let rebutja;
  const promesa = new Promise((a, b) => { resol = a; rebutja = b; });
  return { promesa, resol, rebutja };
}

/** Buida la cua de microtasques (una cadena then/catch/finally en porta unes quantes). */
const microtasques = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };

describe('el registre de l’app', () => {
  test('les llengües diferides són les del selector llevat del valencià', () => {
    expect([...IDIOMES_DIFERITS].sort()).toEqual(SUPPORTED_LANGUAGES.map((l) => l.code).filter((c) => c !== 'ca').sort());
  });

  test('abans de carregar-lo, el castellà es pinta en valencià sencer; després, en castellà, també amb el traductor d’abans', async () => {
    expect(teDiccionari('ca')).toBe(true);
    expect(teDiccionari('es')).toBe(false);
    expect(llenguaCarregada('es')).toBe('ca');
    const abans = createTranslator('es');
    expect(abans('common.back')).toBe('Torna');
    expect(abans('clau.que.no.existix', 'Reserva')).toBe('Reserva');
    expect(abans('clau.que.no.existix')).toBe('clau.que.no.existix');
    await expect(carregaDiccionari('es')).resolves.toBe(true);
    expect(teDiccionari('es')).toBe(true);
    expect(llenguaCarregada('es')).toBe('es');
    expect(abans('common.back')).toBe('Volver');
    expect(createTranslator('es')('common.back')).toBe('Volver');
    expect(abans('clau.que.no.existix', 'Reserva')).toBe('Reserva');
  });

  test('dues demandes mentre el tros és en vol compartixen la promesa; l’oient s’avisa una sola vegada', async () => {
    const avisos = [];
    const baixa = subscriuDiccionaris((codi) => avisos.push(codi));
    try {
      const a = carregaDiccionari('en');
      const b = carregaDiccionari('en');
      expect(a).toBe(b);
      await expect(a).resolves.toBe(true);
      await expect(carregaDiccionari('en')).resolves.toBe(true);
      expect(avisos).toEqual(['en']);
    } finally {
      baixa();
    }
  });

  test.each([['fr'], ['en-US'], [''], [42], [null], ['ca']])('carregaDiccionari(%j) és el valencià: true, sense cap tros', async (codi) => {
    await expect(carregaDiccionari(codi)).resolves.toBe(true);
    expect(llenguaCarregada(codi)).toBe('ca');
    expect(createTranslator(codi)('common.back')).toBe('Torna');
  });
});

describe('creaRegistreDeDiccionaris (carregadors falsos)', () => {
  const BASE = Object.freeze({ salut: 'Bon dia' });

  test('una càrrega fallida no es guarda: la següent torna a cridar el carregador i entra', async () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const carregador = vi.fn()
      .mockRejectedValueOnce(new Error('sense xarxa'))
      .mockResolvedValueOnce({ default: { salut: 'Buenos días' } });
    const registre = creaRegistreDeDiccionaris({ base: BASE, carregadors: { es: carregador } });
    await expect(registre.carrega('es')).resolves.toBe(false);
    expect(registre.diccionari('es')).toBeNull();
    expect(avis).toHaveBeenCalledTimes(1);
    await expect(registre.carrega('es')).resolves.toBe(true);
    expect(carregador).toHaveBeenCalledTimes(2);
    expect(registre.diccionari('es')).toEqual({ salut: 'Buenos días' });
  });

  test('un carregador que llança sense promesa, o un tros sense diccionari, és una fallada, no una excepció', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registre = creaRegistreDeDiccionaris({
      base: BASE,
      carregadors: { es: () => { throw new Error('síncron'); }, en: async () => ({}), eu: async () => ({ default: 'text' }) }
    });
    await expect(registre.carrega('es')).resolves.toBe(false);
    await expect(registre.carrega('en')).resolves.toBe(false);
    await expect(registre.carrega('eu')).resolves.toBe(false);
    await expect(registre.carrega('xx')).resolves.toBe(false);
    expect(['es', 'en', 'eu', 'xx'].map((codi) => registre.diccionari(codi))).toEqual([null, null, null, null]);
  });

  test('es i gl en vol: gl arriba primer, es després; cada arribada avisa i cap no esborra l’altra', async () => {
    const es = diferida();
    const gl = diferida();
    const registre = creaRegistreDeDiccionaris({ base: BASE, carregadors: { es: () => es.promesa, gl: () => gl.promesa } });
    const avisos = [];
    registre.subscriu((codi) => avisos.push(codi));
    const pes = registre.carrega('es');
    const pgl = registre.carrega('gl');
    gl.resol({ default: { salut: 'Bos días' } });
    await pgl;
    expect([registre.diccionari('gl')?.salut, registre.diccionari('es')]).toEqual(['Bos días', null]);
    es.resol({ default: { salut: 'Buenos días' } });
    await pes;
    expect(avisos).toEqual(['gl', 'es']);
    expect(registre.diccionari('gl')?.salut).toBe('Bos días');
    expect(registre.diccionari('es')?.salut).toBe('Buenos días');
  });

  test('un carregador ja resolt (l’IIFE del directori, import() inlinat) arriba en una microtasca', async () => {
    const registre = creaRegistreDeDiccionaris({ base: BASE, carregadors: { es: () => Promise.resolve({ default: { salut: 'Hola' } }) } });
    const promesa = registre.carrega('es');
    expect(registre.diccionari('es')).toBeNull();
    await promesa;
    expect(registre.diccionari('es')).toEqual({ salut: 'Hola' });
  });

  test('donar de baixa un oient el deixa sense avisos', async () => {
    const registre = creaRegistreDeDiccionaris({ base: BASE, carregadors: { es: async () => ({ default: {} }) } });
    const oient = vi.fn();
    registre.subscriu(oient)();
    await registre.carrega('es');
    expect(oient).not.toHaveBeenCalled();
  });

  test('un oient que llança no talla els altres: el segon s’avisa i la càrrega és true', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const registre = creaRegistreDeDiccionaris({ base: BASE, carregadors: { es: async () => ({ default: { salut: 'Hola' } }) } });
    const segon = vi.fn();
    registre.subscriu(() => { throw new Error('oient trencat'); });
    registre.subscriu(segon);
    await expect(registre.carrega('es')).resolves.toBe(true);
    expect(segon).toHaveBeenCalledWith('es');
    expect(error).toHaveBeenCalledTimes(1);
    expect(registre.diccionari('es')).toEqual({ salut: 'Hola' });
  });
});

describe('pintaAmbDiccionari (registre injectat)', () => {
  const BASE = Object.freeze({ salut: 'Bon dia' });
  const registreAmb = (carregadors) => creaRegistreDeDiccionaris({ base: BASE, carregadors });

  test('sense amfitrió ni tria desada: pinta una vegada, a l’acte', () => {
    vi.useFakeTimers();
    const carregador = vi.fn();
    const pinta = vi.fn();
    pintaAmbDiccionari(pinta, { registre: registreAmb({ es: carregador }) });
    expect(pinta).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(pinta).toHaveBeenCalledTimes(1);
    expect(carregador).not.toHaveBeenCalled();
  });

  test('amfitrió en castellà amb el castellà ja en memòria: pinta una vegada, a l’acte', async () => {
    const registre = registreAmb({ es: async () => ({ default: { salut: 'Hola' } }) });
    await registre.carrega('es');
    vi.useFakeTimers();
    const pinta = vi.fn();
    pintaAmbDiccionari(pinta, { amfitrio: 'es', registre });
    expect(pinta).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(pinta).toHaveBeenCalledTimes(1);
  });

  test('amfitrió en castellà, tros en vol: espera; pinta quan arriba, i només eixa vegada', async () => {
    vi.useFakeTimers();
    const es = diferida();
    const pinta = vi.fn();
    pintaAmbDiccionari(pinta, { amfitrio: 'es', registre: registreAmb({ es: () => es.promesa }) });
    expect(pinta).not.toHaveBeenCalled();
    es.resol({ default: { salut: 'Hola' } });
    await microtasques();
    expect(pinta).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(pinta).toHaveBeenCalledTimes(1);
  });

  test('un tros que no arriba: pinta en acabar el sostre, i una arribada tardana no torna a pintar', async () => {
    vi.useFakeTimers();
    const es = diferida();
    const pinta = vi.fn();
    pintaAmbDiccionari(pinta, { amfitrio: 'es', registre: registreAmb({ es: () => es.promesa }) });
    vi.advanceTimersByTime(ESPERA_DEL_PRIMER_PINTAT - 1);
    expect(pinta).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(pinta).toHaveBeenCalledTimes(1);
    es.resol({ default: { salut: 'Hola' } });
    await microtasques();
    expect(pinta).toHaveBeenCalledTimes(1);
  });

  test('un tros que falla: pinta quan la fallada s’assenta, abans del sostre', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pinta = vi.fn();
    const carrega = pintaAmbDiccionari(pinta, { amfitrio: 'es', registre: registreAmb({ es: () => Promise.reject(new Error('tros perdut')) }) });
    expect(pinta).not.toHaveBeenCalled();
    await expect(carrega).resolves.toBe(false);
    await microtasques();
    expect(pinta).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(ESPERA_DEL_PRIMER_PINTAT);
    expect(pinta).toHaveBeenCalledTimes(1);
  });

  test('la tria desada guanya a l’amfitrió: amb gl desat i amfitrió es, es demana el gallec', () => {
    vi.useFakeTimers();
    expect(desaIdiomaTriat('gl')).toBe(true);
    const es = vi.fn(() => new Promise(() => {}));
    const gl = vi.fn(() => new Promise(() => {}));
    const pinta = vi.fn();
    pintaAmbDiccionari(pinta, { amfitrio: 'es', registre: registreAmb({ es, gl }) });
    expect(gl).toHaveBeenCalledTimes(1);
    expect(es).not.toHaveBeenCalled();
    expect(pinta).not.toHaveBeenCalled();
    vi.advanceTimersByTime(ESPERA_DEL_PRIMER_PINTAT);
    expect(pinta).toHaveBeenCalledTimes(1);
  });
});
