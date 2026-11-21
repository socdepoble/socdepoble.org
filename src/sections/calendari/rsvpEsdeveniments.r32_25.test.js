import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as storage from '../../config/storage.js';
import {
  _reiniciaRsvpEsdeveniments,
  CLAU_RSVP_ESDEVENIMENTS,
  desaRsvpEsdeveniment,
  llegeixRsvpEsdeveniment,
  useMagatzemRsvpEsdeveniments
} from './rsvpEsdeveniments.js';

const ACTE = Object.freeze({ id: 'acte-r32-25', aforament: 2 });
const CLAU = storage.STORAGE_PREFIX + CLAU_RSVP_ESDEVENIMENTS;
const desa = (intencio, idParticipant = 'u:pepa', nota = '') => desaRsvpEsdeveniment(ACTE, { intencio, idParticipant, nota });

beforeEach(() => {
  localStorage.clear();
  _reiniciaRsvpEsdeveniments();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  _reiniciaRsvpEsdeveniments();
});

describe('R32.25 · RSVP només confirma persistència local real', () => {
  test('quota esgotada: cap ok:true, comptador ni canvi en memòria', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
    const resultat = desa('si');
    expect(resultat).toMatchObject({ ok: false, codi: 'PERSISTENCIA_NO_CONFIRMADA', persistit: false, ambit: 'navegador-local' });
    expect(llegeixRsvpEsdeveniment(ACTE)).toMatchObject({ confirmats: 0, intencio: null });
    expect(localStorage.getItem(CLAU)).toBeNull();
  });

  test('una excepció de la frontera storage també falla tancada', () => {
    vi.spyOn(storage, 'setVal').mockImplementation(() => { throw new Error('Capa indisponible'); });
    expect(desa('si')).toMatchObject({ ok: false, persistit: false });
    expect(llegeixRsvpEsdeveniment(ACTE, 'u:pepa').intencio).toBeNull();
  });

  test.each([false, undefined, null, 0, 'true', Promise.resolve(true)])('només true literal acredita el desat, no %s', (retorn) => {
    vi.spyOn(storage, 'setVal').mockReturnValue(retorn);
    expect(desa('si')).toMatchObject({ ok: false, persistit: false });
    expect(llegeixRsvpEsdeveniment(ACTE, 'u:pepa').confirmats).toBe(0);
  });

  test('reintent després de fallar: conserva la nota i sobreviu a recarregar el magatzem', () => {
    const escriu = vi.spyOn(storage, 'setVal').mockReturnValueOnce(false);
    expect(desa('si', 'u:pepa', 'Amb la néta').ok).toBe(false);
    expect(desa('si', 'u:pepa', 'Amb la néta')).toMatchObject({ ok: true, persistit: true, ambit: 'navegador-local' });
    expect(escriu).toHaveBeenCalledTimes(2);
    _reiniciaRsvpEsdeveniments();
    expect(llegeixRsvpEsdeveniment(ACTE, 'u:pepa')).toMatchObject({ intencio: 'si', nota: 'Amb la néta', confirmats: 1 });
  });

  test('Sequential Undo: retirar fallit no desfà la confirmació durable; el següent gest sí', () => {
    expect(desa('si').ok).toBe(true);
    const bytes = localStorage.getItem(CLAU);
    vi.spyOn(storage, 'setVal').mockReturnValueOnce(false);
    expect(desa('no').ok).toBe(false);
    expect(localStorage.getItem(CLAU)).toBe(bytes);
    expect(llegeixRsvpEsdeveniment(ACTE, 'u:pepa')).toMatchObject({ confirmats: 1, intencio: 'si' });
    expect(desa('potser').ok).toBe(true);
    expect(desa('no').ok).toBe(true);
    _reiniciaRsvpEsdeveniments();
    expect(llegeixRsvpEsdeveniment(ACTE, 'u:pepa')).toMatchObject({ confirmats: 0, potser: 0, intencio: 'no' });
  });

  test('fallada d’un actor no confirma ni retira la resposta d’una altra persona/entitat', () => {
    expect(desa('si', 'u:pepa').ok).toBe(true);
    expect(desa('potser', 'e:associacio').ok).toBe(true);
    vi.spyOn(storage, 'setVal').mockReturnValueOnce(false);
    expect(desa('no', 'u:pepa').ok).toBe(false);
    expect(llegeixRsvpEsdeveniment(ACTE, 'e:associacio')).toMatchObject({ confirmats: 1, potser: 1, intencio: 'potser' });
    expect(llegeixRsvpEsdeveniment(ACTE, 'u:pepa').intencio).toBe('si');
  });

  test('oients: cap notificació de candidatura fallida; èxit i storage extern mostren només l’estat confirmat', () => {
    let renders = 0;
    const { result, unmount } = renderHook(() => { renders += 1; return useMagatzemRsvpEsdeveniments(); });
    const inicial = result.current;
    const abans = renders;
    vi.spyOn(storage, 'setVal').mockReturnValueOnce(false);
    act(() => { expect(desa('si').ok).toBe(false); });
    expect(result.current).toBe(inicial);
    expect(renders).toBe(abans);
    act(() => { expect(desa('si').ok).toBe(true); });
    expect(result.current.actes[ACTE.id].participants['u:pepa'].intencio).toBe('si');
    const extern = { actes: { [ACTE.id]: { participants: { 'u:pepa': { intencio: 'no', nota: '', actualitzatAl: '' } } } } };
    storage.setVal(CLAU_RSVP_ESDEVENIMENTS, extern);
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: CLAU })));
    expect(result.current.actes[ACTE.id].participants['u:pepa'].intencio).toBe('no');
    const final = renders;
    unmount();
    window.dispatchEvent(new StorageEvent('storage', { key: CLAU }));
    expect(renders).toBe(final);
  });

  test('aforament i arguments es validen abans de qualsevol efecte de storage', () => {
    const escriu = vi.spyOn(storage, 'setVal');
    expect(desa('inventada').ok).toBe(false);
    expect(escriu).not.toHaveBeenCalled();
    desa('si', 'u:1');
    desa('si', 'u:2');
    escriu.mockClear();
    expect(desa('si', 'u:3').ok).toBe(false);
    expect(escriu).not.toHaveBeenCalled();
    expect(llegeixRsvpEsdeveniment(ACTE, 'u:3')).toMatchObject({ confirmats: 2, intencio: null });
  });
});
