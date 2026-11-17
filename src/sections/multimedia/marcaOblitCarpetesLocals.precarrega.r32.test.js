// @vitest-environment node
/* Onada R32.2 · Fusió del lot_05 de Codex R32 (marca d'oblit abans del tros
   diferit) amb la marca viva de R32 (QA-R2-04). La biblioteca importa la marca
   del mòdul lleuger: no hi ha port ni injecció, i estes proves ho fixen SENSE
   cap connexió prèvia entre el Gestor i la marca. La biblioteca i l'IndexedDB
   fals són els reals de les altres proves de seguretat del Gestor. */
import { describe, expect, test, vi } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { CarpetaFalsa, clonaAmbHandles } from '../../../tests/helpers/carpetaLocalFalsa.js';

async function prepara() {
  vi.resetModules();
  const biblioteca = await import('./bibliotecaCarpetesLocals.js');
  const marca = await import('./marcaOblitCarpetesLocals.js');
  const idb = creaIdbFalsEstructurat({ clona: clonaAmbHandles });
  const bib = biblioteca.creaBibliotecaCarpetesLocals({ idb });
  expect((await bib.desa(new CarpetaFalsa('anterior', { 'nota.md': 'privat' }))).ok).toBe(true);
  const persistent = { valor: false,
    llig() { return this.valor; },
    desa() { this.valor = true; return true; },
    esborra() { this.valor = false; return true; }
  };
  marca.configuraMarcaOblitCarpetesLocals(persistent);
  const modul = { ...biblioteca, oblidaTotesLesCarpetesLocals: () => biblioteca.oblidaTotesLesCarpetesLocals({ idb }) };
  const files = () => idb.files(biblioteca.NOM_BD_ARXIUS_LOCALS, biblioteca.STORE_CARPETES_LOCALS);
  return { biblioteca, marca, idb, bib, persistent, modul, files };
}
const errorDisc = () => new DOMException('base bloquejada', 'UnknownError');

describe('R32.2 · marca d’oblit abans del tros diferit i de recuperar cap handle', () => {
  test('la biblioteca llig la marca del mòdul lleuger: el Gestor queda bloquejat mentre la precàrrega no resol, sense cap port', async () => {
    const { marca, idb, bib, persistent, modul, files } = await prepara();
    persistent.valor = true;
    let resol;
    const importa = vi.fn(() => new Promise((resolve) => { resol = resolve; }));
    const loader = marca.creaCarregadorOblitCarpetesLocals(importa);
    expect(importa).not.toHaveBeenCalled();
    const precarrega = loader.carrega();
    await Promise.resolve();
    expect(importa).toHaveBeenCalledTimes(1);
    idb.errorsEnTransaccio.push(errorDisc());
    expect(await bib.llista()).toEqual([]);
    expect(files()).toHaveLength(1);
    expect(persistent.valor).toBe(true);
    resol(modul);
    await precarrega;
    expect(files()).toHaveLength(1); // precarregar no és confirmar cap neteja
    expect(await loader.oblidaTotesLesCarpetesLocals()).toEqual({ ok: true });
    expect(importa).toHaveBeenCalledTimes(1); // la càrrega bona es reutilitza
    expect(files()).toHaveLength(0);
    expect(persistent.valor).toBe(false);
    expect(marca.esOblitCarpetaPendent()).toBe(false);
  });

  test('un tros que no arriba rebutja, conserva la marca posada abans d’esperar i es pot tornar a carregar', async () => {
    const { marca, idb, bib, persistent, modul, files } = await prepara();
    const error = new Error('tros no disponible');
    const importa = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(modul);
    const loader = marca.creaCarregadorOblitCarpetesLocals(importa);
    const eixida = loader.oblidaTotesLesCarpetesLocals();
    expect(persistent.valor).toBe(true); // abans de cap callback d'importació
    expect(marca.esOblitCarpetaPendent()).toBe(true);
    expect(importa).not.toHaveBeenCalled();
    await expect(eixida).rejects.toBe(error);
    expect(persistent.valor).toBe(true);
    idb.errorsEnTransaccio.push(errorDisc());
    expect(await bib.llista()).toEqual([]);
    expect(files()).toHaveLength(1);
    expect(await loader.oblidaTotesLesCarpetesLocals()).toEqual({ ok: true });
    expect(importa).toHaveBeenCalledTimes(2);
    expect(files()).toHaveLength(0);
    expect(persistent.valor).toBe(false);
  });

  test('la neteja fallida es retorna tal qual i manté la marca fins a confirmar el clear', async () => {
    const { marca, idb, persistent, modul, files } = await prepara();
    const loader = marca.creaCarregadorOblitCarpetesLocals(() => Promise.resolve(modul));
    idb.errorsEnTransaccio.push(errorDisc());
    expect(await loader.oblidaTotesLesCarpetesLocals()).toEqual({ ok: false, codi: 'OBLIT_CARPETES_PENDENT' });
    expect(persistent.valor).toBe(true);
    expect(files()).toHaveLength(1);
    expect(await loader.oblidaTotesLesCarpetesLocals()).toEqual({ ok: true });
    expect(persistent.valor).toBe(false);
    expect(files()).toHaveLength(0);
  });

  /* Divergència deliberada del lot_05 de Codex: allà una marca persistent que
     llançava rebutjava l'oblit SENSE provar el clear(), i els handles de qui
     ix es quedaven a la base. Ací la marca de memòria protegix esta pestanya
     (QA-R2-04, com en R32) i la neteja es prova igual: si va bé, no queda res. */
  test('una marca persistent que llança no impedix l’oblit: la memòria protegix esta pestanya i el clear es prova igual', async () => {
    const { marca, idb, bib, modul, files } = await prepara();
    const error = new DOMException('quota de preferències', 'QuotaExceededError');
    marca.configuraMarcaOblitCarpetesLocals({ llig: () => false, desa: () => { throw error; }, esborra: () => { throw error; } });
    const importa = vi.fn().mockRejectedValueOnce(new Error('tros no disponible')).mockResolvedValue(modul);
    const loader = marca.creaCarregadorOblitCarpetesLocals(importa);
    await expect(loader.oblidaTotesLesCarpetesLocals()).rejects.toThrow('tros no disponible');
    expect(marca.esOblitCarpetaPendent()).toBe(true);
    idb.errorsEnTransaccio.push(errorDisc());
    expect(await bib.llista()).toEqual([]);
    expect(files()).toHaveLength(1);
    expect(await loader.oblidaTotesLesCarpetesLocals()).toEqual({ ok: true });
    expect(importa).toHaveBeenCalledTimes(2);
    expect(files()).toHaveLength(0);
    expect(marca.esOblitCarpetaPendent()).toBe(false);
  });

  test('sense IndexedDB (no hi havia res a oblidar) l’oblit bo no deixa la marca posada per sempre', async () => {
    const { biblioteca, marca, persistent } = await prepara();
    const senseBase = { ...biblioteca, oblidaTotesLesCarpetesLocals: () => biblioteca.oblidaTotesLesCarpetesLocals({ idb: null }) };
    const loader = marca.creaCarregadorOblitCarpetesLocals(() => Promise.resolve(senseBase));
    expect(await loader.oblidaTotesLesCarpetesLocals()).toEqual({ ok: true });
    expect(persistent.valor).toBe(false);
    expect(marca.esOblitCarpetaPendent()).toBe(false);
    /* Un Gestor sense base continua dient SENSE_INDEXEDDB, no una transacció fallida. */
    expect(await biblioteca.creaBibliotecaCarpetesLocals({ idb: null }).desa(new CarpetaFalsa('nova', {}))).toEqual({ ok: false, codi: 'SENSE_INDEXEDDB' });
  });

  test('la precàrrega fallida no marca res i la següent ho torna a provar', async () => {
    const { marca, persistent, modul } = await prepara();
    const error = new Error('tros no disponible');
    const importa = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(modul);
    const loader = marca.creaCarregadorOblitCarpetesLocals(importa);
    await expect(loader.carrega()).rejects.toBe(error);
    expect(persistent.valor).toBe(false);
    expect(marca.esOblitCarpetaPendent()).toBe(false);
    await expect(loader.carrega()).resolves.toBe(modul);
    expect(importa).toHaveBeenCalledTimes(2);
    expect(persistent.valor).toBe(false);
  });

  test('el carregador exigix la funció d’importació', async () => {
    const { marca } = await prepara();
    expect(() => marca.creaCarregadorOblitCarpetesLocals(null)).toThrow(TypeError);
  });
});
