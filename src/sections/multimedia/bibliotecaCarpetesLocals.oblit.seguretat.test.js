// @vitest-environment node
/**
 * L'oblit de les carpetes recordades en eixir de la sessió (ordinador
 * compartit), contra l'IndexedDB fals estricte:
 *   · QA-R2-03 (Codex, Ronda 2) · Un desat en vol quan arriba l'oblit no torna
 *     a deixar el handle a la base: el desat que escriuria després del clear()
 *     es desfà dins de la seua transacció (època d'oblit per base).
 *   · QA-R2-04 (Codex, Ronda 2) · Si clear() falla (o la base no s'obri),
 *     l'oblit torna { ok:false, codi:'OBLIT_CARPETES_PENDENT' } i queda
 *     PENDENT: mentre ho és, llistar, recuperar i desar no tornen ni deixen
 *     res de l'anterior, i la crida següent torna a provar clear(); si va bé,
 *     lleva la marca. La marca persistent (la que SessionContext registra
 *     amb storage.js) sobreviu a una recàrrega (un mòdul nou).
 */
import { describe, expect, test, vi } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { CarpetaFalsa, clonaAmbHandles } from '../../../tests/helpers/carpetaLocalFalsa.js';
import {
  CODI_OBLIT_CARPETES_PENDENT, NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS,
  creaBibliotecaCarpetesLocals, oblidaTotesLesCarpetesLocals, oblitCarpetesLocalsPendent
} from './bibliotecaCarpetesLocals.js';

const fals = () => creaIdbFalsEstructurat({ clona: clonaAmbHandles });
const carpeta = (nom) => new CarpetaFalsa(nom, { 'a.txt': 'a' });
const errada = () => new DOMException('perduda', 'UnknownError');
const files = (idb) => idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS);

describe('QA-R2-03 · un desat en vol no sobreviu a l’oblit', () => {
  test('desa i, abans que acabe, l’eixida: la base queda buida i el desat no torna ok', async () => {
    const idb = fals();
    const bib = creaBibliotecaCarpetesLocals({ idb });
    expect((await bib.desa(carpeta('anterior'))).ok).toBe(true);
    const desant = bib.desa(carpeta('nova'));
    const oblit = oblidaTotesLesCarpetesLocals({ idb });
    const [desat, resultat] = await Promise.all([desant, oblit]);
    expect(resultat).toEqual({ ok: true });
    expect(desat.ok).toBe(false);
    expect(files(idb)).toHaveLength(0);
    expect(await bib.llista()).toEqual([]);
  });

  test('un desat que comença després de l’oblit desa com sempre', async () => {
    const idb = fals();
    const bib = creaBibliotecaCarpetesLocals({ idb });
    await bib.desa(carpeta('anterior'));
    expect(await oblidaTotesLesCarpetesLocals({ idb })).toEqual({ ok: true });
    expect((await bib.desa(carpeta('nova'))).ok).toBe(true);
    expect((await bib.llista()).map((r) => r.nom)).toEqual(['nova']);
  });
});

describe('QA-R2-04 · un oblit que falla queda pendent i es torna a provar', () => {
  test('clear() falla: OBLIT_CARPETES_PENDENT; mentre és pendent, res de l’anterior; quan la base es recupera, la neteja es confirma', async () => {
    const idb = fals();
    const bib = creaBibliotecaCarpetesLocals({ idb });
    const a = await bib.desa(carpeta('a'));
    await bib.desa(carpeta('b'));
    expect(CODI_OBLIT_CARPETES_PENDENT).toBe('OBLIT_CARPETES_PENDENT');
    /* Quatre transaccions seguides fallen: l'oblit i els tres reintents de davall. */
    idb.errorsEnTransaccio.push(errada(), errada(), errada(), errada());
    expect(await oblidaTotesLesCarpetesLocals({ idb })).toEqual({ ok: false, codi: 'OBLIT_CARPETES_PENDENT' });
    expect(oblitCarpetesLocalsPendent({ idb })).toBe(true);
    expect(files(idb)).toHaveLength(2);
    expect(await bib.llista()).toEqual([]);
    expect(await bib.recupera(a.carpeta.id)).toBeNull();
    expect(await bib.desa(carpeta('c'))).toEqual({ ok: false, codi: 'TRANSACCIO_FALLIDA' });
    expect(files(idb)).toHaveLength(2);
    expect(oblitCarpetesLocalsPendent({ idb })).toBe(true);
    /* La base es recupera: la crida següent torna a provar clear() i lleva la marca. */
    expect(await bib.llista()).toEqual([]);
    expect(files(idb)).toHaveLength(0);
    expect(oblitCarpetesLocalsPendent({ idb })).toBe(false);
    expect((await bib.desa(carpeta('c'))).ok).toBe(true);
    expect((await bib.llista()).map((r) => r.nom)).toEqual(['c']);
  });

  test('la base no s’obri (bloquejada o privada): pendent; el reintent següent la buida', async () => {
    const idb = fals();
    const bib = creaBibliotecaCarpetesLocals({ idb });
    await bib.desa(carpeta('a'));
    idb.fallaEnObrir = new DOMException('bloquejada', 'UnknownError');
    expect(await oblidaTotesLesCarpetesLocals({ idb })).toEqual({ ok: false, codi: 'OBLIT_CARPETES_PENDENT' });
    expect(await bib.llista()).toEqual([]);
    idb.fallaEnObrir = null;
    expect(oblitCarpetesLocalsPendent({ idb })).toBe(true);
    expect(files(idb)).toHaveLength(1);
    expect(await bib.recupera('qualsevol')).toBeNull();
    expect(files(idb)).toHaveLength(0);
    expect(oblitCarpetesLocalsPendent({ idb })).toBe(false);
  });

  test('una nova crida a l’oblit que va bé també lleva la marca', async () => {
    const idb = fals();
    const bib = creaBibliotecaCarpetesLocals({ idb });
    await bib.desa(carpeta('a'));
    idb.errorsEnTransaccio.push(errada());
    expect((await oblidaTotesLesCarpetesLocals({ idb })).ok).toBe(false);
    expect(await oblidaTotesLesCarpetesLocals({ idb })).toEqual({ ok: true });
    expect(oblitCarpetesLocalsPendent({ idb })).toBe(false);
    expect(files(idb)).toHaveLength(0);
  });

  test('sense IndexedDB al navegador no hi ha res a oblidar: ok i cap marca', async () => {
    expect(await oblidaTotesLesCarpetesLocals({ idb: null })).toEqual({ ok: true });
    expect(oblitCarpetesLocalsPendent({ idb: null })).toBe(false);
  });

  test('la marca persistent sobreviu a una recàrrega (un mòdul nou) i el reintent la lleva', async () => {
    const marca = { valor: false, llig() { return this.valor; }, desa() { this.valor = true; return true; }, esborra() { this.valor = false; return true; } };
    const idb = fals();
    vi.resetModules();
    const abans = await import('./bibliotecaCarpetesLocals.js');
    abans.configuraMarcaOblitCarpetesLocals(marca);
    await abans.creaBibliotecaCarpetesLocals({ idb }).desa(carpeta('a'));
    idb.errorsEnTransaccio.push(errada(), errada());
    expect((await abans.oblidaTotesLesCarpetesLocals({ idb })).ok).toBe(false);
    expect(marca.valor).toBe(true);
    /* La recàrrega: la memòria del mòdul es perd; la marca registrada continua. */
    vi.resetModules();
    const despres = await import('./bibliotecaCarpetesLocals.js');
    expect(despres.oblitCarpetesLocalsPendent({ idb })).toBe(false);
    despres.configuraMarcaOblitCarpetesLocals(marca);
    expect(despres.oblitCarpetesLocalsPendent({ idb })).toBe(true);
    const bib = despres.creaBibliotecaCarpetesLocals({ idb });
    expect(await bib.llista()).toEqual([]);
    expect(files(idb)).toHaveLength(1);
    expect(await bib.llista()).toEqual([]);
    expect(files(idb)).toHaveLength(0);
    expect(marca.valor).toBe(false);
    expect(despres.oblitCarpetesLocalsPendent({ idb })).toBe(false);
    despres.configuraMarcaOblitCarpetesLocals(null);
  });
});
