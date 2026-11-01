/* D-7 (pla 261101_1246; P1-71) · useIdentitatOReserva() i la reserva anònima
   de només lectura (identitatDeReserva.js), la font única de Core,
   Multimèdia, Mur, Notes i Xat.
     · Dins d'IdentitatProvider, el valor del proveïdor, tal qual.
     · Fora, IDENTITAT_DE_RESERVA: congelada, sense id ni clau de ningú, amb
       totes les claus del valor real i la marca nomesLectura. Cap error a la
       consola: el pet de useIdentitat() es queda dins del ganxo.
   Dades sintètiques. */
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react';

vi.mock('./SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: null }) }));
vi.mock('./UIContext.jsx', () => ({ useUIActions: () => ({ setGlobalStatus: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => ({
  getDefaultUserId: () => 'veina-de-prova',
  getProfile: vi.fn(async () => null),
  listMyOrganizations: vi.fn(async () => [])
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));

import { MISSATGE_SENSE_PROVEIDOR, useIdentitatOReserva } from './useIdentitatOReserva.js';
import { CODI_IDENTITAT_DE_LECTURA, ErrorIdentitatDeLectura, IDENTITAT_DE_RESERVA, esIdentitatDeLectura } from './identitatDeReserva.js';
import { IdentitatProvider, useIdentitat, useIdentitatOpcional } from './IdentitatContext.jsx';
import * as CoreContent from './CoreContentContext.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('fora d’IdentitatProvider', () => {
  test('sanitat: useIdentitat() sí que llança (la prova mossega el cas real)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // React torna a llançar el pet com a error de la finestra: jsdom el pintaria.
    const calla = (event) => event.preventDefault();
    window.addEventListener('error', calla);
    try {
      let pet = null;
      try { renderHook(useIdentitat); } catch (error) { pet = error; }
      // El missatge exacte del qual depén la reserva (useIdentitatOReserva.js).
      expect(pet?.message).toBe(MISSATGE_SENSE_PROVEIDOR);
    } finally {
      window.removeEventListener('error', calla);
    }
  });

  test('torna la reserva anònima de només lectura i no escriu cap error', () => {
    const errors = vi.spyOn(console, 'error');
    const { result } = renderHook(useIdentitatOReserva);
    expect(result.current).toBe(IDENTITAT_DE_RESERVA);
    expect(errors).not.toHaveBeenCalled();
  });

  test('la reserva: congelada, sense id ni clau de ningú, convidat i sense cap identitat', () => {
    const r = IDENTITAT_DE_RESERVA;
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.actor)).toBe(true);
    expect(Object.isFrozen(r.identitats)).toBe(true);
    expect(Object.isFrozen(r.memberships)).toBe(true);
    expect(r).toMatchObject({ actorType: 'persona', actorId: null, actorKey: 'anon', carregant: false, error: null, nomesLectura: true });
    expect(r.actor).toEqual({ tipus: 'persona', id: null, nom: null, avatar: null, rol: 'convidat', slug: null, kind: null, poble: null });
    expect(r.identitats).toEqual([]);
    expect(r.memberships).toEqual([]);
    expect(r.setActor('entitat', 'forn')).toBe(false);
    expect(r.setActor('persona')).toBe(false);
    expect(r.refresh()).toBeUndefined();
    // La clau d'àmbit no és mai «tipus::id» de ningú.
    expect(r.actorKey.includes('::')).toBe(false);
    expect(esIdentitatDeLectura(r)).toBe(true);
  });

  test('una sola font: CoreContentContext reexporta el mateix objecte', () => {
    expect(CoreContent.IDENTITAT_DE_RESERVA).toBe(IDENTITAT_DE_RESERVA);
  });
});

describe('dins d’IdentitatProvider', () => {
  test('torna el valor del proveïdor, el mateix que useIdentitatOpcional(), sense nomesLectura', async () => {
    const errors = vi.spyOn(console, 'error');
    const vist = {};
    function Sonda() {
      vist.reserva = useIdentitatOReserva();
      vist.opcional = useIdentitatOpcional();
      return null;
    }
    await act(async () => { render(<IdentitatProvider config={{}}><Sonda /></IdentitatProvider>); });
    await waitFor(() => expect(vist.reserva?.carregant).toBe(false));
    expect(vist.reserva).toBe(vist.opcional);
    expect(vist.reserva).not.toBe(IDENTITAT_DE_RESERVA);
    expect(vist.reserva.nomesLectura).toBeUndefined();
    expect(esIdentitatDeLectura(vist.reserva)).toBe(false);
    expect(vist.reserva.actorId).toBe('veina-de-prova');
    expect(errors).not.toHaveBeenCalled();
  });

  test('la reserva porta totes les claus del valor real (cap consumidor llig un camp absent)', async () => {
    let real = null;
    function Sonda() {
      real = useIdentitatOReserva();
      return null;
    }
    await act(async () => { render(<IdentitatProvider config={{}}><Sonda /></IdentitatProvider>); });
    const absents = Object.keys(real).filter((clau) => !Object.hasOwn(IDENTITAT_DE_RESERVA, clau));
    expect(absents).toEqual([]);
    expect(Object.keys(real.actor).filter((clau) => !Object.hasOwn(IDENTITAT_DE_RESERVA.actor, clau))).toEqual([]);
  });
});

test('ErrorIdentitatDeLectura: un Error amb nom i codi propis', () => {
  const error = new ErrorIdentitatDeLectura();
  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe('ErrorIdentitatDeLectura');
  expect(error.code).toBe(CODI_IDENTITAT_DE_LECTURA);
  expect(CODI_IDENTITAT_DE_LECTURA).toBe('SDP-IDENTITAT-001');
  expect(error.message.length).toBeGreaterThan(0);
});

/* Revisió adversarial T6b (G-T6b-06) · Només el pet de «sense proveïdor» passa
   a la reserva. Un altre error no es convertix en una lectura silenciosa: ni
   un error de veres d'useIdentitat() ni el d'un doble de prova que simula
   IdentitatContext sense l'exportació useIdentitat. El ganxo es crida fora de
   React: només delega en useIdentitat(), que ací és el doble. */
describe('qualsevol altre error es torna a llançar', () => {
  afterEach(() => {
    vi.doUnmock('./IdentitatContext.jsx');
    vi.resetModules();
  });

  async function ganxoAmb(fabrica) {
    vi.resetModules();
    vi.doMock('./IdentitatContext.jsx', fabrica);
    return (await import('./useIdentitatOReserva.js')).useIdentitatOReserva;
  }

  test('un error de veres d’useIdentitat() ix tal qual', async () => {
    const pet = new TypeError('Una altra fallada');
    const ganxo = await ganxoAmb(() => ({ useIdentitat: () => { throw pet; } }));
    expect(() => ganxo()).toThrow(pet);
  });

  test('un doble d’IdentitatContext sense useIdentitat no rep la reserva en silenci', async () => {
    const ganxo = await ganxoAmb(() => ({ useIdentitatOpcional: () => null }));
    expect(() => ganxo()).toThrow(/useIdentitat/);
  });

  test('sanitat: el doble que llança el missatge de «sense proveïdor» sí que dona la reserva', async () => {
    const ganxo = await ganxoAmb(() => ({ useIdentitat: () => { throw new Error(MISSATGE_SENSE_PROVEIDOR); } }));
    const { IDENTITAT_DE_RESERVA: reserva } = await import('./identitatDeReserva.js');
    expect(ganxo()).toBe(reserva);
  });
});
