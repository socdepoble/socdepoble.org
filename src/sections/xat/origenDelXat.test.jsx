/* Ordre del Mestre (261021, pla 261021_0015 §8.5) · La pàgina d'origen de la
   conversa: què es recorda (la darrera ruta de l'app fora del Xat, amb la
   consulta), fins quan val (lligada a la primera conversa que s'obri) i què
   torna el ganxo en cada pas de les entrades reals (/xat?amb= → /xat/<fil>,
   la fila d'ajuda, /xat/<fil> directe). Sense origen, sempre null: la
   capçalera de sempre. */
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import {
  SENSE_ORIGEN, oblidaOrigenDelXat, origenDelXat, recordaOrigenDelXat, seguentOrigen, useOrigenDelXat
} from './origenDelXat.js';

afterEach(() => oblidaOrigenDelXat());

describe('recordaOrigenDelXat', () => {
  test('recorda la darrera ruta de fora del Xat, amb la consulta', () => {
    expect(origenDelXat()).toBeNull();
    recordaOrigenDelXat('/iaia', '');
    expect(origenDelXat()).toBe('/iaia');
    recordaOrigenDelXat('/mercat', 'categoria=hort');
    expect(origenDelXat()).toBe('/mercat?categoria=hort');
    recordaOrigenDelXat('/pobles/sella', '?vista=mapa');
    expect(origenDelXat()).toBe('/pobles/sella?vista=mapa');
  });

  test('el Xat i el seu àlies no són cap origen; tampoc una ruta buida, relativa o «//»', () => {
    recordaOrigenDelXat('/iaia');
    for (const ruta of ['/xat', '/xat/abc', '/e/coop/xat', '/chat', '/chat/abc', '', 'iaia', '//dolent.example', null, undefined]) {
      recordaOrigenDelXat(ruta, 'amb=x');
    }
    expect(origenDelXat()).toBe('/iaia');
    /* Una paraula que només comença igual sí que és una pàgina. */
    recordaOrigenDelXat('/control-xat');
    expect(origenDelXat()).toBe('/control-xat');
  });

  test('l\'entrada (/registre i els seus àlies) no és cap origen: es conserva la pàgina d\'abans', () => {
    recordaOrigenDelXat('/iaia');
    for (const ruta of ['/registre', '/registra', '/login', '/accedir', '/entrar', '/crear-compte']) {
      recordaOrigenDelXat(ruta, 'mode=crear&tornar=%2Fxat%2Ffake-iaia');
    }
    expect(origenDelXat()).toBe('/iaia');
    /* Una ruta que només comença igual sí que és una pàgina. */
    recordaOrigenDelXat('/registres');
    expect(origenDelXat()).toBe('/registres');
  });
});

describe('seguentOrigen (pur)', () => {
  const ORIGEN = { ruta: '/iaia', fil: null };

  test('sense origen, mai no n\'hi ha', () => {
    expect(seguentOrigen(SENSE_ORIGEN, { intencio: true, fil: 'a' })).toBe(SENSE_ORIGEN);
    expect(seguentOrigen(null, { intencio: true, fil: 'a' })).toBe(SENSE_ORIGEN);
  });

  test('espera la primera conversa i s\'hi lliga', () => {
    expect(seguentOrigen(ORIGEN, { intencio: true, fil: null })).toBe(ORIGEN);
    expect(seguentOrigen(ORIGEN, { intencio: true, fil: 'a' })).toEqual({ ruta: '/iaia', fil: 'a' });
  });

  test('idempotent: la mateixa conversa el deixa com està', () => {
    const lligat = { ruta: '/iaia', fil: 'a' };
    expect(seguentOrigen(lligat, { intencio: true, fil: 'a' })).toBe(lligat);
    expect(seguentOrigen(lligat, { intencio: true, fil: null })).toBe(lligat);
  });

  test('una altra conversa o la llista l\'obliden', () => {
    const lligat = { ruta: '/iaia', fil: 'a' };
    expect(seguentOrigen(lligat, { intencio: true, fil: 'b' })).toBe(SENSE_ORIGEN);
    expect(seguentOrigen(lligat, { intencio: false, fil: null })).toBe(SENSE_ORIGEN);
    expect(seguentOrigen(ORIGEN, { intencio: false, fil: null })).toBe(SENSE_ORIGEN);
  });
});

describe('useOrigenDelXat', () => {
  test('/iaia → /xat?amb=<id> → /xat/<fil>: l\'origen apareix amb la conversa i val mentre és oberta', () => {
    recordaOrigenDelXat('/iaia');
    const { result, rerender } = renderHook((props) => useOrigenDelXat(props), { initialProps: { intencio: true, fil: null } });
    expect(result.current).toBeNull();
    rerender({ intencio: true, fil: 'iaia' });
    expect(result.current).toBe('/iaia');
    rerender({ intencio: true, fil: 'iaia' });
    expect(result.current).toBe('/iaia');
  });

  test('triar una altra conversa l\'oblida, també si després es torna a la primera', () => {
    recordaOrigenDelXat('/iaia');
    const { result, rerender } = renderHook((props) => useOrigenDelXat(props), { initialProps: { intencio: true, fil: 'a' } });
    expect(result.current).toBe('/iaia');
    rerender({ intencio: true, fil: 'b' });
    expect(result.current).toBeNull();
    rerender({ intencio: true, fil: 'a' });
    expect(result.current).toBeNull();
  });

  test('tornar a la llista l\'oblida', () => {
    recordaOrigenDelXat('/perfil/pepa');
    const { result, rerender } = renderHook((props) => useOrigenDelXat(props), { initialProps: { intencio: true, fil: 'a' } });
    expect(result.current).toBe('/perfil/pepa');
    rerender({ intencio: false, fil: null });
    rerender({ intencio: true, fil: 'a' });
    expect(result.current).toBeNull();
  });

  test('entrar a la llista nua no en porta cap, encara que hi haja una ruta de fora', () => {
    recordaOrigenDelXat('/mur');
    const { result, rerender } = renderHook((props) => useOrigenDelXat(props), { initialProps: { intencio: false, fil: null } });
    expect(result.current).toBeNull();
    rerender({ intencio: true, fil: 'a' });
    expect(result.current).toBeNull();
  });

  test('una càrrega directa (cap ruta de fora) no en té: la capçalera de sempre', () => {
    const { result } = renderHook(() => useOrigenDelXat({ intencio: true, fil: 'a' }));
    expect(result.current).toBeNull();
  });

  test('es pren en entrar: una ruta recordada després no el canvia', () => {
    recordaOrigenDelXat('/iaia');
    const { result, rerender } = renderHook((props) => useOrigenDelXat(props), { initialProps: { intencio: true, fil: 'a' } });
    recordaOrigenDelXat('/mur');
    rerender({ intencio: true, fil: 'a' });
    expect(result.current).toBe('/iaia');
  });
});
