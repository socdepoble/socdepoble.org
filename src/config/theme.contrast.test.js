/* D6 · Mode Bancal (Q1 del Mestre, 261004) · La preferència de contrast de
   config/theme.js: resolució ('normal', 'bancal', 'sistema'), persistència
   per persona amb storage.js, emmagatzematge indisponible (mode privat) i
   la consulta `prefers-contrast: more`, que Firefox 100 no coneix. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { STORAGE_PREFIX, delVal, getPreferenciaLlegat, getVal, setVal } from './storage.js';
import {
  ATRIBUT_CONTRAST, CONSULTA_CONTRAST_SISTEMA, CONTRAST_KEY, PREFERENCIES_CONTRAST, aplicaContrast,
  readContrastPreference, resolveContrast, sistemaDemanaContrast, subscriuContrastSistema, writeContrastPreference
} from './theme.js';

/* Una MediaQueryList de mentida que es pot canviar des de la prova. */
function consultaControlable({ matches = false, ambEventListener = true } = {}) {
  const oients = new Set();
  const mq = {
    matches,
    media: CONSULTA_CONTRAST_SISTEMA,
    canvia(valor) {
      mq.matches = valor;
      for (const oient of [...oients]) oient({ matches: valor, media: CONSULTA_CONTRAST_SISTEMA });
    },
    oients
  };
  if (ambEventListener) {
    mq.addEventListener = vi.fn((tipus, oient) => { if (tipus === 'change') oients.add(oient); });
    mq.removeEventListener = vi.fn((tipus, oient) => { if (tipus === 'change') oients.delete(oient); });
  } else {
    mq.addListener = vi.fn((oient) => oients.add(oient));
    mq.removeListener = vi.fn((oient) => oients.delete(oient));
  }
  return mq;
}

let abans = null;
beforeEach(() => {
  abans = getVal(CONTRAST_KEY);
  delVal(CONTRAST_KEY);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (abans == null) delVal(CONTRAST_KEY);
  else setVal(CONTRAST_KEY, abans);
});

describe('preferències i resolució', () => {
  test('tres preferències, en l’ordre del selector', () => {
    expect(PREFERENCIES_CONTRAST).toEqual(['normal', 'bancal', 'sistema']);
    expect(Object.isFrozen(PREFERENCIES_CONTRAST)).toBe(true);
    expect(ATRIBUT_CONTRAST).toBe('data-contrast');
    expect(CONSULTA_CONTRAST_SISTEMA).toBe('(prefers-contrast: more)');
  });

  test('«Bancal» sempre és bancal; «Normal» sempre és normal, encara que el sistema demane més', () => {
    expect(resolveContrast('bancal', false)).toBe('bancal');
    expect(resolveContrast('bancal', true)).toBe('bancal');
    expect(resolveContrast('normal', true)).toBe('normal');
    expect(resolveContrast('normal', false)).toBe('normal');
  });

  test('«Segons el sistema» seguix prefers-contrast: more', () => {
    expect(resolveContrast('sistema', true)).toBe('bancal');
    expect(resolveContrast('sistema', false)).toBe('normal');
  });

  test('un valor desconegut és normal: mai un atribut inventat', () => {
    for (const valor of [undefined, null, '', 'alt', 'dark', 'BANCAL', 1]) {
      expect([valor, resolveContrast(valor, true)]).toEqual([valor, 'normal']);
    }
  });

  test('sense segon argument, resolveContrast pregunta al sistema', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => consultaControlable({ matches: true })));
    expect(resolveContrast('sistema')).toBe('bancal');
    vi.stubGlobal('matchMedia', vi.fn(() => consultaControlable({ matches: false })));
    expect(resolveContrast('sistema')).toBe('normal');
  });
});

describe('persistència per persona (storage.js)', () => {
  test('sense res desat, «Normal»', () => {
    expect(readContrastPreference()).toBe('normal');
  });

  test('la tria es desa amb el prefix de storage.js i es torna a llegir', () => {
    expect(writeContrastPreference('bancal')).toBe(true);
    /* El valor cru, llegit per la capa (tractor L2): clau amb prefix i JSON. */
    expect(getPreferenciaLlegat(STORAGE_PREFIX + CONTRAST_KEY)).toBe('"bancal"');
    expect(readContrastPreference()).toBe('bancal');
    expect(writeContrastPreference('sistema')).toBe(true);
    expect(readContrastPreference()).toBe('sistema');
  });

  test('un valor invàlid no s’escriu, i un de desat a mà tampoc no es creu', () => {
    expect(writeContrastPreference('dark')).toBe(false);
    expect(getVal(CONTRAST_KEY)).toBeNull();
    setVal(CONTRAST_KEY, 'alt');
    expect(readContrastPreference()).toBe('normal');
  });

  test('una preferència configurada vàlida mana sobre la desada; una invàlida, no', () => {
    writeContrastPreference('bancal');
    expect(readContrastPreference('normal')).toBe('normal');
    expect(readContrastPreference('cap')).toBe('bancal');
  });

  test('emmagatzematge indisponible (mode privat): llegir dona «Normal», desar torna false, i res no llança', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloquejat', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Plena', 'QuotaExceededError'); });
    expect(() => readContrastPreference()).not.toThrow();
    expect(readContrastPreference()).toBe('normal');
    expect(writeContrastPreference('bancal')).toBe(false);
  });
});

describe('el sistema: prefers-contrast: more', () => {
  test('sense matchMedia (jsdom, entorn sense finestra): no demana més contrast', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(sistemaDemanaContrast()).toBe(false);
    expect(resolveContrast('sistema')).toBe('normal');
  });

  test('pregunta exactament per prefers-contrast: more', () => {
    const matchMedia = vi.fn(() => consultaControlable({ matches: true }));
    vi.stubGlobal('matchMedia', matchMedia);
    expect(sistemaDemanaContrast()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-contrast: more)');
  });

  test('Firefox 100: la consulta existix però no casa mai (la característica és desconeguda) → normal', () => {
    vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: false, media: consulta === CONSULTA_CONTRAST_SISTEMA ? 'not all' : consulta })));
    expect(sistemaDemanaContrast()).toBe(false);
    expect(resolveContrast('sistema')).toBe('normal');
  });

  test('un matchMedia que llança no trenca res', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => { throw new TypeError('consulta invàlida'); }));
    expect(sistemaDemanaContrast()).toBe(false);
    expect(subscriuContrastSistema(() => {})).toBeTypeOf('function');
  });

  test('subscriuContrastSistema avisa de cada canvi i deixa d’avisar en desubscriure’s', () => {
    const mq = consultaControlable();
    vi.stubGlobal('matchMedia', vi.fn(() => mq));
    const vist = [];
    const deixa = subscriuContrastSistema((valor) => vist.push(valor));
    mq.canvia(true);
    mq.canvia(false);
    expect(vist).toEqual([true, false]);
    deixa();
    expect(mq.removeEventListener).toHaveBeenCalledTimes(1);
    mq.canvia(true);
    expect(vist).toEqual([true, false]);
  });

  test('sense addEventListener (Safari < 14) usa addListener', () => {
    const mq = consultaControlable({ ambEventListener: false });
    vi.stubGlobal('matchMedia', vi.fn(() => mq));
    const vist = [];
    const deixa = subscriuContrastSistema((valor) => vist.push(valor));
    mq.canvia(true);
    deixa();
    mq.canvia(false);
    expect(vist).toEqual([true]);
    expect(mq.removeListener).toHaveBeenCalledTimes(1);
  });

  test('sense matchMedia o sense oient, torna igualment una funció', () => {
    vi.stubGlobal('matchMedia', undefined);
    const deixa = subscriuContrastSistema(() => {});
    expect(deixa).toBeTypeOf('function');
    expect(() => deixa()).not.toThrow();
    expect(subscriuContrastSistema(null)).toBeTypeOf('function');
  });
});

describe('aplicaContrast', () => {
  test('bancal posa data-contrast="bancal"; normal el lleva; sense element no fa res', () => {
    const element = document.createElement('div');
    aplicaContrast(element, 'bancal');
    expect(element.getAttribute('data-contrast')).toBe('bancal');
    aplicaContrast(element, 'normal');
    expect(element.hasAttribute('data-contrast')).toBe(false);
    aplicaContrast(element, 'qualsevol');
    expect(element.hasAttribute('data-contrast')).toBe(false);
    expect(() => aplicaContrast(null, 'bancal')).not.toThrow();
  });
});
