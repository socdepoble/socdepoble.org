/* Plataforma d'Apps Enxufables · les destinacions d'un enllaç de fora (SN,
   261003): quan una app és destinació, què es carrega i què passa la
   validació. Manifests de prova sobre el del Lector; dades sintètiques. */
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import manifestLector from '../lector/manifest.js';
import { ENTORN_OBERT, preparaNavegador } from './__fixtures__/munta.jsx';
import {
  ESTATS_DESTINACIO, NOM_MAXIM_PER_DEFECTE, carregaDestinacioEnllac, esDestinacioPossible, useDestinacioEnllac,
  validaDestinacioEnllac
} from './destinacions.js';
import { ProveidorPlataforma } from './PlataformaContext.jsx';
import { creaRegistre } from './registreApps.js';
import { validaManifestApp } from './manifestApp.js';

const DESENVOLUPAMENT = Object.freeze({ ...ENTORN_OBERT, produccio: false });

/* Una destinació d'app de prova: el que torna `afig` es pot triar. */
function destinacioDeProva({ categories = [{ id: 'festes', nom: 'Festes' }], resultat = { id: 'f1', nom: 'La Veu', trams: ['fonts', 'colleccio'] } } = {}) {
  return {
    nomMaxim: 40,
    categories: vi.fn(async () => categories),
    afig: vi.fn(async () => resultat)
  };
}

const manifest = (canvis = {}, modul = { destinacioEnllac: destinacioDeProva() }) => {
  const { manifest: valid } = validaManifestApp({ ...manifestLector, carrega: () => Promise.resolve({ default: () => null, ...modul }), ...canvis });
  return valid;
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('validaDestinacioEnllac', () => {
  test('sense la forma (categories i afig, funcions), cap destinació', () => {
    for (const cru of [null, undefined, 'text', {}, { categories: () => [] }, { afig: () => ({}) }, { categories: [], afig: () => ({}) }]) {
      expect(validaDestinacioEnllac(cru, 'lector')).toBeNull();
    }
  });

  test('nomMaxim: el que declara l’app si és un enter positiu; si no, el de per defecte', () => {
    expect(validaDestinacioEnllac(destinacioDeProva(), 'lector').nomMaxim).toBe(40);
    expect(validaDestinacioEnllac({ ...destinacioDeProva(), nomMaxim: -3 }, 'lector').nomMaxim).toBe(NOM_MAXIM_PER_DEFECTE);
    expect(validaDestinacioEnllac({ ...destinacioDeProva(), nomMaxim: '80' }, 'lector').nomMaxim).toBe(NOM_MAXIM_PER_DEFECTE);
  });

  test('les categories passen la llista blanca: id opac, nom de text i sense repetits', async () => {
    const categories = [
      { id: 'festes', nom: '  Cultura   i festes ' }, { id: 'festes', nom: 'Repetida' }, { id: 'Majúscula', nom: 'X' },
      { id: 'buida', nom: '   ' }, { id: '../fora', nom: 'X' }, null, 'text', { id: 'camp', nom: 'Camp', secret: 'no' }
    ];
    const desti = validaDestinacioEnllac(destinacioDeProva({ categories }), 'lector');
    expect(await desti.categories()).toEqual([{ id: 'festes', nom: 'Cultura i festes' }, { id: 'camp', nom: 'Camp' }]);
    expect(await validaDestinacioEnllac(destinacioDeProva({ categories: 'trencat' }), 'lector').categories()).toEqual([]);
  });

  test('afig: passa només l’adreça, el nom i la categoria; torna el camí de l’app amb els trams segurs', async () => {
    const cru = destinacioDeProva();
    const desti = validaDestinacioEnllac(cru, 'lector');
    const resultat = await desti.afig({ url: 'https://example.org/feed', nom: 'La Veu', categoriaId: '', secret: 'no' });
    expect(cru.afig).toHaveBeenCalledWith({ url: 'https://example.org/feed', nom: 'La Veu', categoriaId: null });
    expect(resultat).toEqual({ id: 'f1', nom: 'La Veu', ruta: '/app/lector/fonts/colleccio' });
    expect(Object.isFrozen(resultat)).toBe(true);
  });

  test.each([
    ['un tram que puja', ['..', 'fora']],
    ['un tram amb barra', ['fonts/colleccio']],
    ['una adreça de fora', ['https:', 'example.org']],
    ['massa trams', Array.from({ length: 9 }, () => 'a')],
    ['cap llista', 'fonts']
  ])('%s: cap camí', async (_que, trams) => {
    const desti = validaDestinacioEnllac(destinacioDeProva({ resultat: { id: 'f1', nom: 'X', trams } }), 'lector');
    expect((await desti.afig({ url: 'https://example.org', nom: 'X' })).ruta).toBeNull();
  });

  test('un resultat sense nom porta el que s’ha demanat; els errors de l’app arriben tal qual', async () => {
    const desti = validaDestinacioEnllac(destinacioDeProva({ resultat: { id: 7 } }), 'lector');
    expect(await desti.afig({ url: 'https://example.org', nom: ' La Veu ' })).toEqual({ id: null, nom: 'La Veu', ruta: null });
    const error = Object.assign(new Error('Cal un nom per a la font.'), { codi: 'nom', camp: 'nom' });
    const fallida = validaDestinacioEnllac({ ...destinacioDeProva(), afig: async () => { throw error; } }, 'lector');
    await expect(fallida.afig({ url: 'https://example.org', nom: '' })).rejects.toBe(error);
  });
});

describe('carregaDestinacioEnllac', () => {
  test('carrega el mòdul de `carrega` i en valida la destinació', async () => {
    const desti = await carregaDestinacioEnllac(manifest());
    expect(desti.nomMaxim).toBe(40);
    expect(await desti.categories()).toEqual([{ id: 'festes', nom: 'Festes' }]);
  });

  test('cap destinació: sense manifest, sense `carrega`, una app externa o un mòdul que no n’exporta', async () => {
    expect(await carregaDestinacioEnllac(null)).toBeNull();
    expect(await carregaDestinacioEnllac(manifest({ carrega: null }))).toBeNull();
    expect(await carregaDestinacioEnllac({ ...manifest(), origen: 'externa' })).toBeNull();
    expect(await carregaDestinacioEnllac(manifest({}, {}))).toBeNull();
    expect(await carregaDestinacioEnllac(manifest({}, { destinacioEnllac: null }))).toBeNull();
  });
});

describe('useDestinacioEnllac', () => {
  const amb = (internes, entorn = DESENVOLUPAMENT, externalConfig = {}) => function Embolcall({ children }) {
    return (
      <UIProvider externalConfig={externalConfig}>
        <ProveidorPlataforma registre={creaRegistre({ internes })} entorn={entorn}>{children}</ProveidorPlataforma>
      </UIProvider>
    );
  };
  const munta = (id, ...args) => {
    preparaNavegador();
    return renderHook(() => useDestinacioEnllac(id), { wrapper: amb(...args) }).result;
  };
  const SENSE = { estat: ESTATS_DESTINACIO.cap, destinacio: null };

  test('una app interna, compilada, pública i disponible: carrega el mòdul en muntar i, resolta, la destinació neta', async () => {
    const carrega = vi.fn(() => Promise.resolve({ destinacioEnllac: destinacioDeProva() }));
    const resultat = munta('lector', [{ ...manifestLector, carrega }]);
    /* Mentre el mòdul arriba, encara no hi ha res per oferir. */
    expect(resultat.current).toEqual({ estat: ESTATS_DESTINACIO.carregant, destinacio: null });
    await waitFor(() => expect(resultat.current.estat).toBe(ESTATS_DESTINACIO.llesta));
    expect(resultat.current.destinacio.nomMaxim).toBe(40);
    expect(await resultat.current.destinacio.categories()).toEqual([{ id: 'festes', nom: 'Festes' }]);
    expect(carrega).toHaveBeenCalledTimes(1);
  });

  test('correcció SN-R1 · una app disponible el mòdul de la qual no exporta cap destinació (encesa sense port): cap, no una targeta morta', async () => {
    for (const modul of [{}, { destinacioEnllac: null }, { destinacioEnllac: { afig: () => ({}) } }]) {
      const resultat = munta('lector', [{ ...manifestLector, carrega: () => Promise.resolve(modul) }]);
      expect(resultat.current.estat).toBe(ESTATS_DESTINACIO.carregant);
      await waitFor(() => expect(resultat.current).toEqual(SENSE));
      cleanup();
    }
  });

  test('un mòdul que no arriba (xarxa): error, una fallada de pas', async () => {
    const resultat = munta('lector', [{ ...manifestLector, carrega: () => Promise.reject(new Error('xarxa')) }]);
    await waitFor(() => expect(resultat.current).toEqual({ estat: ESTATS_DESTINACIO.error, destinacio: null }));
  });

  test('cap destinació, i cap càrrega, si l’app no és al registre, no és disponible, no és compilada o no és pública', () => {
    const carrega = vi.fn(() => Promise.resolve({ destinacioEnllac: destinacioDeProva() }));
    const lector = { ...manifestLector, carrega };
    expect(munta('lector', []).current).toEqual(SENSE);
    /* En producció, una app de desenvolupament està apagada (interruptors.js). */
    expect(munta('lector', [lector], ENTORN_OBERT).current).toEqual(SENSE);
    /* L'amfitrió declara les seues apps i esta no hi és. */
    expect(munta('lector', [lector], DESENVOLUPAMENT, { apps: 'bar' }).current).toEqual(SENSE);
    expect(munta('lector', [{ ...lector, carrega: null }]).current).toEqual(SENSE);
    expect(munta('lector', [{ ...lector, permisos: { veure: 'sessio' } }]).current).toEqual(SENSE);
    expect(carrega).not.toHaveBeenCalled();
  });

  test('esDestinacioPossible: només amb estat «available»', () => {
    const lector = manifest();
    expect(esDestinacioPossible({ manifest: lector, estat: 'available' })).toBe(true);
    for (const estat of ['disabled', 'unavailable', 'unsubscribed']) expect(esDestinacioPossible({ manifest: lector, estat })).toBe(false);
    expect(esDestinacioPossible(null)).toBe(false);
  });
});
