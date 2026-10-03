// @vitest-environment node
/* Salut · el magatzem «sdp-salut»: amb l'IndexedDB fals de les proves; la
   llista blanca del diccionari (el que no hi és no arriba al disc); la meta
   només amb claus conegudes; i, sense IndexedDB, memòria amb persistent: false. */
import { describe, expect, test } from 'vitest';
import { creaIdbFals } from '../../utils/__fixtures__/navegadorFals.js';
import { CLAUS_META, IDS_INTERRUPTORS, NOM_BASE, carregaTot, creaMagatzemSalut, desaMeta } from './magatzem.js';

const ID = '00000000-0000-4000-8000-000000000001';
const MICCIO = { id: ID, tipus: 'miccio', moment: '2026-10-05T08:00', ofsetMin: 120, jornada: '2026-10-05', volumMl: 250, mesura: 'mesurat', lloc: 'vater' };
const crea = (idb) => creaMagatzemSalut({ idb, navegador: null, Canal: null });

describe('amb IndexedDB', () => {
  test('desa a la base sdp-salut i llig des d’una altra instància', async () => {
    const fals = creaIdbFals();
    const primer = crea(fals.idb);
    expect(primer.persistent).toBe(true);
    await primer.desa('apunts', MICCIO);
    await primer.desa('jornades', { data: '2026-10-05', completa: true });
    await desaMeta(primer, 'avis', { acceptatA: '2026-10-05T08:00:00.000Z', versio: 1 });
    const segon = crea(fals.idb);
    const tot = await carregaTot(segon);
    expect(tot.apunts).toEqual([MICCIO]);
    expect(tot.jornades).toEqual([{ data: '2026-10-05', completa: true }]);
    expect(tot.avis).toEqual({ acceptatA: '2026-10-05T08:00:00.000Z', versio: 1 });
    expect(tot.persona.alias).toBe('el pare');
    expect(await segon.perIndex('apunts', 'jornada', '2026-10-05')).toEqual([MICCIO]);
    expect(fals.registre.obrides.every(([nom, versio]) => nom === NOM_BASE && versio === 1)).toBe(true);
    expect(fals.registre.obertes).toBe(0);
  });

  test('llista blanca: el que no és del diccionari no arriba al disc, i el que no és vàlid es rebutja', async () => {
    const fals = creaIdbFals();
    const magatzem = crea(fals.idb);
    await magatzem.desa('apunts', { ...MICCIO, nomDelMetge: 'no ha d’arribar', notaLliure: 'tampoc' });
    expect(fals.files(NOM_BASE, 'apunts')).toEqual([MICCIO]);
    await expect(magatzem.desa('apunts', { ...MICCIO, volumMl: 99999 })).rejects.toThrow(TypeError);
    await expect(magatzem.desa('apunts', { ...MICCIO, id: 'a-1' })).rejects.toThrow(TypeError);
    await expect(magatzem.desa('jornades', { data: 'ahir' })).rejects.toThrow(TypeError);
    await expect(desaMeta(magatzem, 'secret', 'x')).rejects.toThrow(/desconeguda/);
    await expect(desaMeta(magatzem, 'descartades', ['risc@2026-10-05..2026-10-07', 'no val'])).rejects.toThrow(TypeError);
    await desaMeta(magatzem, 'persona', { alias: 'el iaio', pesKg: 9999, colorPreferit: 'blau' });
    expect(fals.files(NOM_BASE, 'meta')).toEqual([{ clau: 'persona', valor: { alias: 'el iaio', majorDe65: true, usaAbsorbent: false, horaAlcarHabitual: '07:00', horaGitarHabitual: '22:00' } }]);
    expect(CLAUS_META).toEqual(['persona', 'avis', 'descartades', 'ultimaCopia', 'apagats']);
  });

  test('els apartats apagats: només els interruptors de Salut, sense repetits, i «Esborra-ho tot» els oblida (SAL-03)', async () => {
    const fals = creaIdbFals();
    const magatzem = crea(fals.idb);
    expect(IDS_INTERRUPTORS).toEqual(['agitacio', 'deposicions', 'medicacio']);
    expect((await carregaTot(magatzem)).apagats).toEqual([]);
    await desaMeta(magatzem, 'apagats', ['medicacio', 'agitacio', 'medicacio']);
    expect((await carregaTot(magatzem)).apagats).toEqual(['agitacio', 'medicacio']);
    await expect(desaMeta(magatzem, 'apagats', ['medicacio', 'cuina'])).rejects.toThrow(TypeError);
    await expect(desaMeta(magatzem, 'apagats', 'medicacio')).rejects.toThrow(TypeError);
    await magatzem.buidaTot();
    expect((await carregaTot(magatzem)).apagats).toEqual([]);
  });

  test('esborrar-ho tot buida tots els stores', async () => {
    const fals = creaIdbFals();
    const magatzem = crea(fals.idb);
    await magatzem.desa('apunts', MICCIO);
    await desaMeta(magatzem, 'ultimaCopia', '2026-10-05T08:00:00.000Z');
    await magatzem.buidaTot();
    const tot = await carregaTot(magatzem);
    expect(tot.apunts).toEqual([]);
    expect(tot.ultimaCopia).toBeNull();
  });
});

describe('sense IndexedDB', () => {
  test('memòria, persistent: false, i funciona igual', async () => {
    const magatzem = crea(null);
    expect(magatzem.persistent).toBe(false);
    await magatzem.desa('apunts', MICCIO);
    expect((await carregaTot(magatzem)).apunts).toEqual([MICCIO]);
    expect((await magatzem.estatPersistencia()).persistent).toBe(false);
  });

  test('si la base no s’obri la primera vegada, passa a memòria i ho avisa', async () => {
    const fals = creaIdbFals({ fallaObrir: true });
    const magatzem = crea(fals.idb);
    const avisos = [];
    magatzem.subscriu((avis) => avisos.push(avis));
    await magatzem.desa('apunts', MICCIO);
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(magatzem.persistent).toBe(false);
    expect(avisos).toContainEqual({ tipus: 'persistent', persistent: false });
    expect((await carregaTot(magatzem)).apunts).toEqual([MICCIO]);
    magatzem.tanca();
  });
});
