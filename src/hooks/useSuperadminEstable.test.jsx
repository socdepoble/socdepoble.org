/* Gauntlet 261016 · diürn 1530 (Bloc 3.4; revisió adversarial del carril D,
   problema 2) · El rol de superadmin no parpelleja mentre la sessió es torna a
   comprovar amb el mateix compte (renovació del JWT), i queda pendent quan no
   hi ha cap rol resolt d'eixe compte per heretar (arrencada en fred, compte
   nou). Els estats de la sessió són els que publica SessionContext: 'dins' amb
   el rol 'desconegut' arriba com a 'comprovant'. */
import { renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ sessio: null }));
vi.mock('../app/contexts/SessionContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useSessioOpcional: () => fixture.sessio,
}));

import { useSuperadminEstable } from './useSuperadminEstable.js';

const JAVI = { id: 'u-1' };
const PEPA = { id: 'u-2' };
const sessio = (estat, usuari, esSuperadmin = false) => ({ estat, currentUser: usuari, esSuperadmin, rol: esSuperadmin ? 'superadmin' : null });

afterEach(() => { fixture.sessio = null; });

test('sense proveïdor de sessió, ningú no és superadmin i no hi ha res pendent', () => {
  const { result } = renderHook(() => useSuperadminEstable());
  expect(result.current).toEqual({ esSuperadmin: false, rolPendent: false });
});

test('arrencada en fred: el rol és pendent fins que es resol, i llavors mana el resolt', () => {
  fixture.sessio = sessio('comprovant', null);
  const { result, rerender } = renderHook(() => useSuperadminEstable());
  expect(result.current).toEqual({ esSuperadmin: false, rolPendent: true });
  // Ja hi ha usuari, però el rol encara vola ('dins' + 'desconegut').
  fixture.sessio = sessio('comprovant', JAVI);
  rerender();
  expect(result.current).toEqual({ esSuperadmin: false, rolPendent: true });
  fixture.sessio = sessio('dins', JAVI, true);
  rerender();
  expect(result.current).toEqual({ esSuperadmin: true, rolPendent: false });
});

test('renovació del JWT amb el mateix compte: el superadmin no parpelleja', () => {
  fixture.sessio = sessio('dins', JAVI, true);
  const { result, rerender } = renderHook(() => useSuperadminEstable());
  expect(result.current.esSuperadmin).toBe(true);
  fixture.sessio = sessio('comprovant', JAVI);
  rerender();
  expect(result.current).toEqual({ esSuperadmin: true, rolPendent: false });
  // Torna el rol: continua sent-ho.
  fixture.sessio = sessio('dins', JAVI, true);
  rerender();
  expect(result.current).toEqual({ esSuperadmin: true, rolPendent: false });
});

test('si en tornar el rol ja no és superadmin, deixa de ser-ho de seguida', () => {
  fixture.sessio = sessio('dins', JAVI, true);
  const { result, rerender } = renderHook(() => useSuperadminEstable());
  fixture.sessio = sessio('comprovant', JAVI);
  rerender();
  fixture.sessio = { ...sessio('dins', JAVI, false), rol: 'usuari' };
  rerender();
  expect(result.current).toEqual({ esSuperadmin: false, rolPendent: false });
});

test('un veí que renova la sessió continua sense ser-ho, i no espera res', () => {
  fixture.sessio = { ...sessio('dins', PEPA, false), rol: 'usuari' };
  const { result, rerender } = renderHook(() => useSuperadminEstable());
  fixture.sessio = sessio('comprovant', PEPA);
  rerender();
  expect(result.current).toEqual({ esSuperadmin: false, rolPendent: false });
});

test('un compte nou no hereta el rol de l’anterior: el seu queda pendent', () => {
  fixture.sessio = sessio('dins', JAVI, true);
  const { result, rerender } = renderHook(() => useSuperadminEstable());
  fixture.sessio = sessio('comprovant', PEPA);
  rerender();
  expect(result.current).toEqual({ esSuperadmin: false, rolPendent: true });
  // Ni tornant a comprovar sense cap usuari (recuperació de sessió).
  fixture.sessio = sessio('comprovant', null);
  rerender();
  expect(result.current).toEqual({ esSuperadmin: false, rolPendent: true });
});

test('eixir tanca: després de «fora», qui entre no hereta res', () => {
  fixture.sessio = sessio('dins', JAVI, true);
  const { result, rerender } = renderHook(() => useSuperadminEstable());
  fixture.sessio = sessio('fora', null);
  rerender();
  expect(result.current).toEqual({ esSuperadmin: false, rolPendent: false });
  fixture.sessio = sessio('comprovant', JAVI);
  rerender();
  expect(result.current).toEqual({ esSuperadmin: false, rolPendent: true });
});

test('només un true literal fa superadmin', () => {
  for (const valor of ['true', 1, {}, null]) {
    fixture.sessio = { estat: 'dins', currentUser: JAVI, esSuperadmin: valor };
    const { result, unmount } = renderHook(() => useSuperadminEstable());
    expect([valor, result.current.esSuperadmin]).toEqual([valor, false]);
    unmount();
  }
});
