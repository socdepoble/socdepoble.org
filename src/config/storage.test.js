import { afterEach, expect, test, vi } from 'vitest';
import { desaGrupEfimer, getEfimer, setEfimer, getVal, setVal, delVal, magatzemWebPerAOblit } from './storage.js';
afterEach(() => { vi.restoreAllMocks(); window.sessionStorage.clear(); window.localStorage.clear(); });
test('D1: setVal i delVal diuen si han escrit, i la quota no llança', () => {
  expect(setVal('probe', { v: 1 })).toBe(true);
  expect(getVal('probe')).toEqual({ v: 1 });
  expect(delVal('probe')).toBe(true);
  expect(getVal('probe')).toBeNull();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denegat'); });
  expect(setVal('probe', { v: 1 })).toBe(false);
  expect(delVal('probe')).toBe(false);
});
test('l’escriptura efímera comunica indisponibilitat, quota i valors no serialitzables', () => {
  expect(setEfimer('probe', undefined)).toBe(false);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(setEfimer('probe', 'value')).toBe(false);
  expect(desaGrupEfimer({ a: 'A', b: 'B' })).toBe(false);
});
test('la marca persistent impedix llegir un grup parcial després de recarregar el mòdul', async () => {
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(key, value) {
    if (key === 'sdp_embed_b') throw new Error('quota');
    return original.call(this, key, value);
  });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denegat'); });
  expect(desaGrupEfimer({ a: 'A', b: 'B' })).toBe(false);
  vi.resetModules(); const fresh = await import('./storage.js');
  expect(fresh.getEfimer('a')).toBeNull(); expect(fresh.getEfimer('b')).toBeNull();
  vi.restoreAllMocks();
  expect(fresh.desaGrupEfimer({ a: 'next', b: null })).toBe(true);
  expect(fresh.getEfimer('a')).toBe('next'); expect(fresh.getEfimer('b')).toBeNull();
});
test('accés denegat i error en confirmar el grup fallen tancats', () => {
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denegat'); });
  expect(desaGrupEfimer({ a: 'A', b: 'B' })).toBe(false);
  expect(getEfimer('a')).toBeNull();
});

/* P1-12 pas 17 (D-09) · La façana de l'oblit del xat xifrat: només el prefix sdp_xat_, sense lectures. */
test('magatzemWebPerAOblit: només compta, nomena i esborra claus sdp_xat_ de la capa demanada', () => {
  const capes = { sessio: window.sessionStorage, preferencies: window.localStorage };
  for (const [capa, web] of Object.entries(capes)) {
    web.setItem('sdp_xat_a', '1');
    web.setItem('sdp_xat_b', '2');
    web.setItem('sdp_embed_xat_oblits_pendents', '[]');
    web.setItem('altra', 'queda');
    const m = magatzemWebPerAOblit(capa);
    expect(Object.keys(m).sort()).toEqual(['key', 'length', 'removeItem']);
    expect(m).not.toHaveProperty('getItem');
    expect(m).not.toHaveProperty('setItem');
    expect(Object.isFrozen(m)).toBe(true);
    expect(m.length).toBe(2);
    const claus = [m.key(0), m.key(1)].sort();
    expect(claus).toEqual(['sdp_xat_a', 'sdp_xat_b']);
    expect(m.key(2)).toBeNull();
    for (const clau of claus) m.removeItem(clau);
    expect(m.length).toBe(0);
    expect(web.getItem('sdp_xat_a')).toBeNull();
    expect(web.getItem('altra')).toBe('queda');
    expect(web.getItem('sdp_embed_xat_oblits_pendents')).toBe('[]');
    expect(() => m.removeItem('altra')).toThrow(TypeError);
    expect(() => m.removeItem('sdp_embed_xat_oblits_pendents')).toThrow(TypeError);
    expect(web.getItem('altra')).toBe('queda');
  }
});

test('magatzemWebPerAOblit: una capa desconeguda és null i els errors de la capa es propaguen', () => {
  expect(magatzemWebPerAOblit('altra')).toBeNull();
  expect(magatzemWebPerAOblit()).toBeNull();
  const sessio = window.sessionStorage;
  sessio.setItem('sdp_xat_a', '1');
  const m = magatzemWebPerAOblit('sessio');
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denegat'); });
  expect(() => m.removeItem('sdp_xat_a')).toThrow('denegat');
  vi.spyOn(Storage.prototype, 'key').mockImplementation(() => { throw new Error('capa bloquejada'); });
  expect(() => m.length).toThrow('capa bloquejada');
});

/* QA-C02 (Gauntlet 261029_1858) · «Sense capa» no és «capa bloquejada». Un getter
   que llança SecurityError (galetes blocades, marc de tercers) ja en carregar el
   mòdul convertia la capa en «absent» (null) i l'oblit del xat la saltava: un èxit
   fals. El getter es posa ABANS d'importar el mòdul (vi.resetModules + import). */
const NOMS_CAPA = Object.freeze({ sessio: ['session', 'Storage'].join(''), preferencies: ['local', 'Storage'].join('') });
function canviaCapa(capa, descriptor) {
  const nom = NOMS_CAPA[capa];
  const original = Object.getOwnPropertyDescriptor(window, nom);
  Object.defineProperty(window, nom, { configurable: true, ...descriptor });
  return () => {
    if (original) Object.defineProperty(window, nom, original);
    else delete window[nom];
  };
}

test('QA-C02: una capa bloquejada en carregar i en cridar no és absent; la façana llança l’error de seguretat', async () => {
  window[NOMS_CAPA.sessio].setItem('sdp_xat_a', '1');
  const denegat = new DOMException('Accés denegat a la capa.', 'SecurityError');
  const restaura = canviaCapa('sessio', { get() { throw denegat; } });
  try {
    vi.resetModules();
    const fresc = await import('./storage.js');
    const m = fresc.magatzemWebPerAOblit('sessio');
    expect(m).not.toBeNull();
    expect(Object.isFrozen(m)).toBe(true);
    expect(Object.keys(m).sort()).toEqual(['key', 'length', 'removeItem']);
    expect(() => m.length).toThrow(denegat);
    expect(() => m.key(0)).toThrow(denegat);
    expect(() => m.removeItem('sdp_xat_a')).toThrow(denegat);
    // La capa efímera continua fallant tancada, i la de preferències no es veu afectada.
    expect(fresc.getEfimer('a', 'reserva')).toBe('reserva');
    expect(fresc.magatzemWebPerAOblit('preferencies').length).toBe(0);
  } finally {
    restaura();
  }
  expect(window[NOMS_CAPA.sessio].getItem('sdp_xat_a')).toBe('1');
});

test('QA-C02: bloquejada en carregar però oberta en cridar, s’esborra de veres; absent de veres, null', async () => {
  const valor = window[NOMS_CAPA.preferencies];
  valor.setItem('sdp_xat_b', '1');
  let bloquejada = true;
  const restaura = canviaCapa('preferencies', { get() { if (bloquejada) throw new DOMException('denegat', 'SecurityError'); return valor; } });
  try {
    vi.resetModules();
    const fresc = await import('./storage.js');
    bloquejada = false;
    const m = fresc.magatzemWebPerAOblit('preferencies');
    expect(m.length).toBe(1);
    m.removeItem('sdp_xat_b');
    expect(valor.getItem('sdp_xat_b')).toBeNull();
  } finally {
    restaura();
  }
  const absent = canviaCapa('sessio', { get() { return undefined; } });
  try {
    vi.resetModules();
    const fresc = await import('./storage.js');
    expect(fresc.magatzemWebPerAOblit('sessio')).toBeNull();
  } finally {
    absent();
  }
});

/* Gauntlet c1 (troballa «qa-c02-cami-de-carrega-no-exercit») · La prova de dalt
   manté el getter llançant també en cridar: l'error de la crida ja hi basta i la
   captura en carregar (errorSessio, errorPreferencies) no hi juga cap paper. Ací
   el cas que només ella cobrix: bloquejada en carregar i sense capa en cridar.
   Hi podia haver dades d'abans que ningú no ha pogut esborrar, i l'oblit no pot
   donar-les per absents: la façana llança l'error que es va guardar en carregar. */
test('QA-C02: bloquejada en carregar i absent en cridar, cap capa és «absent»: la façana llança l’error guardat en carregar', async () => {
  for (const capa of ['sessio', 'preferencies']) {
    const denegat = new DOMException(`Accés denegat a ${capa}.`, 'SecurityError');
    let carregant = true;
    const restaura = canviaCapa(capa, { get() { if (carregant) throw denegat; return undefined; } });
    try {
      vi.resetModules();
      const fresc = await import('./storage.js');
      carregant = false;
      const m = fresc.magatzemWebPerAOblit(capa);
      expect(m, capa).not.toBeNull();
      expect(Object.keys(m).sort()).toEqual(['key', 'length', 'removeItem']);
      expect(() => m.length).toThrow(denegat);
      expect(() => m.key(0)).toThrow(denegat);
      expect(() => m.removeItem('sdp_xat_a')).toThrow(denegat);
    } finally {
      restaura();
    }
  }
});
