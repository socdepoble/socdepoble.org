/* Onada R30 · PF-01 · La migració de les carpetes de Notes que només són al navegador
   (creades abans de la correcció de R29). Un servidor fals fa com la RPC
   crea_carpeta_notes de la migració 76: una carpeta per lower(nom), i el mateix nom
   torna la mateixa carpeta. Les invariants: només amb sessió real; idempotent (dos
   inicis, dues pestanyes, reintent i ACK perdut, cap duplicat); no destructiu (la
   carpeta local no es toca mai i només es dona per migrada amb l'ACK escrit); i
   cap error ix ni avisa. «Recarregar» és oblidar la memòria del mòdul. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { STORAGE_PREFIX } from '../../../config/storage.js';
import { CLAU_CARPETES_CREADES, _reiniciaCarpetesCreades, desaCarpetaCreada } from './carpetesCreades.js';
import {
  CLAU_CARPETES_MIGRADES, _reiniciaMigracioCarpetes, carpetesPendentsDeMigrar, migraCarpetesLocals,
  normalitzaCarpetesMigrades, registraReplica, repliquesAmagades, repliquesDeCarpetes, senseRepliques,
  useCarpetesDelBlocVisibles, useRepliquesDeCarpetes
} from './migracioCarpetesLocals.js';
import { opcionsDeCarpetes } from '../../../sections/notes/carpetes.js';
import { NOTE_FOLDERS_SEED } from '../../../data/carpetesSeed.js';

const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const ALTRA = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const POBLE = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const AMBIT = `supabase:poble_persona::${PERSONA}_${POBLE}`;
const CONFIG = Object.freeze({ dataMode: 'remote', tenantId: POBLE });
const DEL_SERVIDOR = 'f-0f0e0d0c-0b0a-4908-8706-050403020100';
const CLAU_LOCAL = STORAGE_PREFIX + CLAU_CARPETES_CREADES;
const CLAU_REGISTRE = STORAGE_PREFIX + CLAU_CARPETES_MIGRADES;

/* Un servidor fals amb la idempotència de crea_carpeta_notes (on conflict lower(nom)). */
function creaServidor() {
  const carpetes = new Map();
  let n = 0;
  return {
    carpetes,
    crea(nom) {
      const clau = nom.toLowerCase();
      if (!carpetes.has(clau)) {
        n += 1;
        carpetes.set(clau, { id: `f-00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, nom, parentId: null });
      }
      return { ...carpetes.get(clau) };
    }
  };
}

function creaPort(servidor, { persona = PERSONA, capacitat = true, mode = 'remote' } = {}) {
  const port = {
    persona,
    teCapacitat: vi.fn((cap) => capacitat && cap === 'carpetesNotes'),
    getRuntimeDataMode: vi.fn(() => mode),
    getCurrentUser: vi.fn(() => (port.persona ? { id: port.persona } : null)),
    creaCarpetaNotes: vi.fn(async ({ nom }) => servidor.crea(nom))
  };
  return port;
}

const sembra = (...noms) => noms.forEach((nom) => desaCarpetaCreada(AMBIT, { id: `f-${nom.toLowerCase()}`, nom }));
const cruLocal = () => localStorage.getItem(CLAU_LOCAL);
const abast = (entrada = 1, config = CONFIG, scopeKey = AMBIT) => ({ scopeKey, entrada, config });

beforeEach(() => {
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
});

describe('detecció', () => {
  test('només són pendents les carpetes locals sense rèplica: ni les nascudes al servidor ni les ja confirmades', () => {
    sembra('Festes', 'Hort');
    desaCarpetaCreada(AMBIT, { id: DEL_SERVIDOR, nom: 'Fira' });
    expect(carpetesPendentsDeMigrar(AMBIT).map((c) => c.id)).toEqual(['f-festes', 'f-hort']);
    expect(registraReplica(AMBIT, { local: 'f-hort', remot: DEL_SERVIDOR })).toBe(true);
    expect(carpetesPendentsDeMigrar(AMBIT).map((c) => c.id)).toEqual(['f-festes']);
    /* Un altre àmbit (un altre compte, tenant o backend) no hi compta. */
    expect(carpetesPendentsDeMigrar(`supabase:poble_persona::${ALTRA}_${POBLE}`)).toEqual([]);
  });
});

describe('pujada amb sessió real', () => {
  test('puja pel port, apunta la rèplica amb l’ACK i no toca la carpeta local', async () => {
    sembra('Festes', 'Hort');
    const abans = cruLocal();
    const servidor = creaServidor();
    const port = creaPort(servidor);
    await expect(migraCarpetesLocals(abast(), PERSONA, { port })).resolves.toEqual({ estat: 'fet', migrades: 2, pendents: 0, noMigrables: 0 });
    expect(port.creaCarpetaNotes.mock.calls).toEqual([[{ nom: 'Festes' }, CONFIG], [{ nom: 'Hort' }, CONFIG]]);
    expect(repliquesDeCarpetes(AMBIT)).toEqual([
      { local: 'f-festes', remot: servidor.carpetes.get('festes').id },
      { local: 'f-hort', remot: servidor.carpetes.get('hort').id }
    ]);
    expect(cruLocal()).toBe(abans);
    expect(JSON.parse(localStorage.getItem(CLAU_REGISTRE)).ambits[AMBIT]).toHaveLength(2);
  });

  test('idempotent · dos inicis: el segon no torna a eixir cap a la xarxa', async () => {
    sembra('Festes');
    const servidor = creaServidor();
    const port = creaPort(servidor);
    await migraCarpetesLocals(abast(1), PERSONA, { port });
    _reiniciaCarpetesCreades();
    _reiniciaMigracioCarpetes();
    await expect(migraCarpetesLocals(abast(2), PERSONA, { port })).resolves.toEqual({ estat: 'res', migrades: 0, pendents: 0, noMigrables: 0 });
    expect(port.creaCarpetaNotes).toHaveBeenCalledTimes(1);
    expect(servidor.carpetes.size).toBe(1);
    expect(repliquesDeCarpetes(AMBIT)).toHaveLength(1);
  });

  test('idempotent · dues crides a la vegada en la mateixa pestanya compartixen una sola pujada', async () => {
    sembra('Festes');
    const servidor = creaServidor();
    const port = creaPort(servidor);
    const [a, b] = await Promise.all([migraCarpetesLocals(abast(1), PERSONA, { port }), migraCarpetesLocals(abast(1), PERSONA, { port })]);
    expect(a).toBe(b);
    expect(port.creaCarpetaNotes).toHaveBeenCalledTimes(1);
  });

  test('idempotent · dues pestanyes a la vegada: una carpeta al servidor i una rèplica apuntada', async () => {
    sembra('Festes', 'Hort');
    const servidor = creaServidor();
    let solta;
    const porta = new Promise((resol) => { solta = resol; });
    /* Les dues pestanyes demanen abans que cap rebja resposta. */
    const lent = (port) => { port.creaCarpetaNotes.mockImplementation(async ({ nom }) => { await porta; return servidor.crea(nom); }); return port; };
    vi.resetModules();
    const pestanyaB = await import('./migracioCarpetesLocals.js');
    const enA = migraCarpetesLocals(abast(1), PERSONA, { port: lent(creaPort(servidor)) });
    const enB = pestanyaB.migraCarpetesLocals(abast(1), PERSONA, { port: lent(creaPort(servidor)) });
    await Promise.resolve();
    solta();
    const [ra, rb] = await Promise.all([enA, enB]);
    expect(ra.estat).toBe('fet');
    expect(rb.estat).toBe('fet');
    expect(servidor.carpetes.size).toBe(2);
    _reiniciaMigracioCarpetes();
    expect(repliquesDeCarpetes(AMBIT).map((r) => r.local)).toEqual(['f-festes', 'f-hort']);
    expect(new Set(repliquesDeCarpetes(AMBIT).map((r) => r.remot)).size).toBe(2);
  });

  test('un error de xarxa ho conserva tot, no es reintenta en la mateixa entrada i sí en el pròxim inici', async () => {
    sembra('Festes');
    const abans = cruLocal();
    const servidor = creaServidor();
    const port = creaPort(servidor);
    port.creaCarpetaNotes.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port })).resolves.toEqual({ estat: 'pendent', migrades: 0, pendents: 1, noMigrables: 0 });
    expect(repliquesDeCarpetes(AMBIT)).toEqual([]);
    expect(cruLocal()).toBe(abans);
    /* Una altra càrrega del Bloc en la mateixa entrada no torna a provar-ho. */
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port })).resolves.toMatchObject({ estat: 'omes', motiu: 'ja-intentada' });
    expect(port.creaCarpetaNotes).toHaveBeenCalledTimes(1);
    await expect(migraCarpetesLocals(abast(2), PERSONA, { port })).resolves.toEqual({ estat: 'fet', migrades: 1, pendents: 0, noMigrables: 0 });
    expect(servidor.carpetes.size).toBe(1);
    expect(cruLocal()).toBe(abans);
  });

  test('un ACK perdut (el servidor l’ha desada però la resposta no arriba) no duplica res en reintentar', async () => {
    sembra('Festes');
    const servidor = creaServidor();
    const port = creaPort(servidor);
    port.creaCarpetaNotes.mockImplementationOnce(async ({ nom }) => {
      servidor.crea(nom);
      throw Object.assign(new Error('Temps esgotat'), { name: 'TimeoutError' });
    });
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port })).resolves.toMatchObject({ estat: 'pendent' });
    await expect(migraCarpetesLocals(abast(2), PERSONA, { port })).resolves.toMatchObject({ estat: 'fet', migrades: 1 });
    expect(servidor.carpetes.size).toBe(1);
    expect(repliquesDeCarpetes(AMBIT)).toEqual([{ local: 'f-festes', remot: servidor.carpetes.get('festes').id }]);
  });

  test('una resposta sense id de carpeta o amb un altre nom no és cap ACK', async () => {
    sembra('Festes', 'Hort', 'Fira', 'Pou');
    const port = creaPort(creaServidor());
    port.creaCarpetaNotes
      .mockResolvedValueOnce({ id: '', nom: 'Festes' })
      .mockResolvedValueOnce({ id: DEL_SERVIDOR, nom: 'Vinya' })
      /* Onada R30 · PF-01 (àrbitre, P3) · Un adaptador que torna l'id local, o un slug que no
         és l'id del servidor (f-<uuid>), no ha escrit res al servidor. */
      .mockResolvedValueOnce({ id: 'f-fira', nom: 'Fira' })
      .mockResolvedValueOnce({ id: 'f-pou-2', nom: 'Pou' });
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port })).resolves.toEqual({ estat: 'pendent', migrades: 0, pendents: 4, noMigrables: 0 });
    expect(port.creaCarpetaNotes).toHaveBeenCalledTimes(4);
    expect(repliquesDeCarpetes(AMBIT)).toEqual([]);
    expect(localStorage.getItem(CLAU_REGISTRE)).toBeNull();
  });

  test('un nom que el port rebutja (caràcters de format, Cf) no ix cap a la xarxa, no para les altres i es compta com a no migrable', async () => {
    sembra('Festes');
    /* Onada R30 · PF-01 (àrbitre, P3) · El guionet tou (U+00AD) i la unió ZWJ d'un emoji compost
       són de format (\p{Cf}): carpetesCreades els accepta, nomDeCarpetaValid no. */
    expect(desaCarpetaCreada(AMBIT, { id: 'f-familia', nom: 'Fam\u00ADília' })).toBe(true);
    expect(desaCarpetaCreada(AMBIT, { id: 'f-cuina', nom: 'Cuina \u{1F469}\u200D\u{1F373}' })).toBe(true);
    const abans = cruLocal();
    const servidor = creaServidor();
    const port = creaPort(servidor);
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port })).resolves.toEqual({ estat: 'pendent', migrades: 1, pendents: 2, noMigrables: 2 });
    expect(port.creaCarpetaNotes.mock.calls).toEqual([[{ nom: 'Festes' }, CONFIG]]);
    expect(carpetesPendentsDeMigrar(AMBIT).map((c) => c.id)).toEqual(['f-familia', 'f-cuina']);
    expect(cruLocal()).toBe(abans);
    /* En el pròxim inici, igual: ni una crida, i les carpetes locals continuen on eren. */
    await expect(migraCarpetesLocals(abast(2), PERSONA, { port })).resolves.toEqual({ estat: 'pendent', migrades: 0, pendents: 2, noMigrables: 2 });
    expect(port.creaCarpetaNotes).toHaveBeenCalledTimes(1);
  });

  test('el comptador de no migrables és el de l’estat final, també si la xarxa para la pujada abans', async () => {
    sembra('Festes');
    expect(desaCarpetaCreada(AMBIT, { id: 'f-familia', nom: 'Fam\u00ADília' })).toBe(true);
    const port = creaPort(creaServidor());
    port.creaCarpetaNotes.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port })).resolves.toEqual({ estat: 'pendent', migrades: 0, pendents: 2, noMigrables: 1 });
  });

  test('sense l’ACK escrit (quota, mode privat) no es dona per migrada', async () => {
    sembra('Festes');
    const abans = cruLocal();
    const port = creaPort(creaServidor());
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function setItem(clau, valor) {
      if (clau === CLAU_REGISTRE) throw new DOMException('Quota', 'QuotaExceededError');
      return original.call(this, clau, valor);
    });
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port })).resolves.toEqual({ estat: 'pendent', migrades: 0, pendents: 1, noMigrables: 0 });
    expect(repliquesDeCarpetes(AMBIT)).toEqual([]);
    expect(cruLocal()).toBe(abans);
  });
});

describe('sense sessió real no fa res', () => {
  test('sense persona, amb un àmbit d’una altra persona o en mode del navegador, ni toca el port', async () => {
    sembra('Festes');
    const port = creaPort(creaServidor());
    for (const [entrada, usuariId] of [[abast(1), null], [abast(2), ''], [abast(3), ALTRA],
      [abast(4, { dataMode: 'seed', tenantId: POBLE }), PERSONA], [abast(5, { dataMode: 'local' }), PERSONA], [abast(6, null), PERSONA]]) {
      await expect(migraCarpetesLocals(entrada, usuariId, { port })).resolves.toMatchObject({ estat: 'omes', motiu: 'sense-sessio' });
    }
    expect(port.teCapacitat).not.toHaveBeenCalled();
    expect(port.creaCarpetaNotes).not.toHaveBeenCalled();
  });

  test('sense la capacitat, o amb un adaptador que no escriu al servidor, cap pujada', async () => {
    sembra('Festes');
    const senseCapacitat = creaPort(creaServidor(), { capacitat: false });
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port: senseCapacitat })).resolves.toMatchObject({ estat: 'omes', motiu: 'sense-capacitat' });
    const delNavegador = creaPort(creaServidor(), { mode: 'seed' });
    await expect(migraCarpetesLocals(abast(2), PERSONA, { port: delNavegador })).resolves.toMatchObject({ estat: 'omes', motiu: 'sense-capacitat' });
    expect(senseCapacitat.creaCarpetaNotes).not.toHaveBeenCalled();
    expect(delNavegador.creaCarpetaNotes).not.toHaveBeenCalled();
    expect(carpetesPendentsDeMigrar(AMBIT)).toHaveLength(1);
  });

  test('una sessió que canvia a mitges para la pujada: res va al compte d’una altra persona', async () => {
    sembra('Festes', 'Hort');
    const servidor = creaServidor();
    const port = creaPort(servidor);
    port.creaCarpetaNotes.mockImplementationOnce(async ({ nom }) => {
      const carpeta = servidor.crea(nom);
      port.persona = ALTRA;
      return carpeta;
    });
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port })).resolves.toEqual({ estat: 'interromput', migrades: 1, pendents: 1, noMigrables: 0 });
    expect(port.creaCarpetaNotes).toHaveBeenCalledTimes(1);
    expect([...servidor.carpetes.keys()]).toEqual(['festes']);
  });

  test('mai rebutja ni escriu a la consola, tampoc amb un port que llança', async () => {
    sembra('Festes');
    const consola = [vi.spyOn(console, 'error'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'log')];
    const trencat = {
      teCapacitat: () => { throw new Error('port trencat'); },
      getRuntimeDataMode: () => 'remote', getCurrentUser: () => ({ id: PERSONA }), creaCarpetaNotes: vi.fn()
    };
    await expect(migraCarpetesLocals(abast(1), PERSONA, { port: trencat })).resolves.toMatchObject({ estat: 'omes' });
    const senseLlista = creaPort(creaServidor());
    senseLlista.getCurrentUser.mockImplementation(() => { throw new Error('sense sessió'); });
    await expect(migraCarpetesLocals(abast(2), PERSONA, { port: senseLlista })).resolves.toMatchObject({ estat: 'interromput' });
    expect(trencat.creaCarpetaNotes).not.toHaveBeenCalled();
    expect(senseLlista.creaCarpetaNotes).not.toHaveBeenCalled();
    for (const espia of consola) expect(espia).not.toHaveBeenCalled();
  });
});

describe('registre de rèpliques', () => {
  test('un storage brut o estrany es descarta; registrar és idempotent per id local', () => {
    expect(normalitzaCarpetesMigrades({ v: 1, ambits: { [AMBIT]: [{ local: 'f-mur', remot: DEL_SERVIDOR }, { local: 'F-x', remot: DEL_SERVIDOR }, 'x'] } }).ambits[AMBIT]).toBeUndefined();
    expect(normalitzaCarpetesMigrades('{"v":1}').ambits).toEqual({});
    localStorage.setItem(CLAU_REGISTRE, '{ trencat');
    expect(repliquesDeCarpetes(AMBIT)).toEqual([]);
    expect(registraReplica(AMBIT, { local: 'f-festes', remot: DEL_SERVIDOR })).toBe(true);
    expect(registraReplica(AMBIT, { local: 'f-festes', remot: 'f-00000000-0000-4000-8000-000000000009' })).toBe(true);
    expect(repliquesDeCarpetes(AMBIT)).toEqual([{ local: 'f-festes', remot: DEL_SERVIDOR }]);
  });

  test('una rèplica és un slug local i un id de servidor: mai el mateix id, mai un slug com a rèplica', () => {
    /* Onada R30 · PF-01 (àrbitre, P3) · El mateix contracte que l'ACK. */
    expect(registraReplica(AMBIT, { local: 'f-hort', remot: 'f-hort' })).toBe(false);
    expect(registraReplica(AMBIT, { local: 'f-hort', remot: 'f-hort-2' })).toBe(false);
    expect(registraReplica(AMBIT, { local: DEL_SERVIDOR, remot: DEL_SERVIDOR })).toBe(false);
    expect(repliquesDeCarpetes(AMBIT)).toEqual([]);
    expect(normalitzaCarpetesMigrades({ v: 1, ambits: { [AMBIT]: [{ local: 'f-hort', remot: 'f-hort' }, { local: 'f-pou', remot: 'f-pou-2' }] } }).ambits[AMBIT]).toBeUndefined();
  });

  test('useRepliquesDeCarpetes es posa al dia amb una rèplica nova i amb la d’una altra pestanya', () => {
    const { result } = renderHook(() => useRepliquesDeCarpetes(AMBIT));
    expect(result.current).toEqual([]);
    act(() => { registraReplica(AMBIT, { local: 'f-festes', remot: DEL_SERVIDOR }); });
    expect(result.current).toEqual([{ local: 'f-festes', remot: DEL_SERVIDOR }]);
    act(() => {
      localStorage.setItem(CLAU_REGISTRE, JSON.stringify({ v: 1, ambits: { [AMBIT]: [{ local: 'f-festes', remot: DEL_SERVIDOR }, { local: 'f-hort', remot: 'f-00000000-0000-4000-8000-000000000002' }] } }));
      window.dispatchEvent(new StorageEvent('storage', { key: CLAU_REGISTRE }));
    });
    expect(result.current.map((r) => r.local)).toEqual(['f-festes', 'f-hort']);
  });
});

describe('useCarpetesDelBlocVisibles · el filtre de tots els que pinten les carpetes del Bloc', () => {
  const REPLICA = { id: DEL_SERVIDOR, nom: 'Festes', parentId: null };

  test('sense cap rèplica que amagar, la mateixa llista (la mateixa referència); amb la rèplica apuntada, sense ella i en viu', () => {
    sembra('Festes');
    const carpetes = [...NOTE_FOLDERS_SEED, REPLICA];
    const notes = [{ id: 'n-1', folderId: 'f-festes' }];
    const { result, rerender } = renderHook(({ llista }) => useCarpetesDelBlocVisibles(carpetes, llista, AMBIT), { initialProps: { llista: notes } });
    expect(result.current).toBe(carpetes);
    act(() => { registraReplica(AMBIT, { local: 'f-festes', remot: DEL_SERVIDOR }); });
    expect(result.current).toEqual(NOTE_FOLDERS_SEED);
    const filtrades = result.current;
    /* Una tecla porta una llista de notes nova amb les mateixes carpetes: la llista filtrada no canvia. */
    rerender({ llista: [{ ...notes[0], title: 'Les festes' }] });
    expect(result.current).toBe(filtrades);
  });

  test('una rèplica amb notes, un altre àmbit o sense carpetes del port: la llista tal com arriba', () => {
    sembra('Festes');
    expect(registraReplica(AMBIT, { local: 'f-festes', remot: DEL_SERVIDOR })).toBe(true);
    const carpetes = [...NOTE_FOLDERS_SEED, REPLICA];
    const ambNota = renderHook(() => useCarpetesDelBlocVisibles(carpetes, [{ id: 'n-2', folderId: DEL_SERVIDOR }], AMBIT));
    expect(ambNota.result.current).toBe(carpetes);
    const altreAmbit = renderHook(() => useCarpetesDelBlocVisibles(carpetes, [], `supabase:poble_persona::${ALTRA}_${POBLE}`));
    expect(altreAmbit.result.current).toBe(carpetes);
    expect(renderHook(() => useCarpetesDelBlocVisibles(undefined, undefined, null)).result.current).toBeUndefined();
  });
});

describe('la columna del Bloc es queda igual (Llei del Píxel)', () => {
  /* La mateixa fórmula que NotesSection (carpetes): les del port i, darrere, les locals que no hi són. */
  const columna = (noteFolders, locals, amagades) => {
    const base = opcionsDeCarpetes(senseRepliques(noteFolders, amagades), null);
    const extres = locals.filter((extra) => !base.some((c) => c.id === String(extra.id)))
      .map((extra) => ({ id: String(extra.id), nom: extra.nom, parentId: null }));
    return extres.length ? [...base, ...extres] : base;
  };
  const FIRA = { id: DEL_SERVIDOR, nom: 'Fira', parentId: null };

  test('abans i després de migrar, les mateixes carpetes en el mateix ordre', async () => {
    sembra('Festes');
    const locals = [{ id: 'f-festes', nom: 'Festes' }];
    const notes = [{ id: 'n-1', folderId: 'f-festes' }];
    const abans = columna([...NOTE_FOLDERS_SEED, FIRA], locals, repliquesAmagades(repliquesDeCarpetes(AMBIT), locals, notes));
    const servidor = creaServidor();
    await migraCarpetesLocals(abast(), PERSONA, { port: creaPort(servidor) });
    const replica = servidor.carpetes.get('festes');
    /* La càrrega següent porta la rèplica entre les carpetes del servidor. */
    const despres = columna([...NOTE_FOLDERS_SEED, FIRA, replica], locals, repliquesAmagades(repliquesDeCarpetes(AMBIT), locals, notes));
    expect(despres).toEqual(abans);
    expect(despres.filter((c) => c.nom === 'Festes')).toEqual([{ id: 'f-festes', nom: 'Festes', parentId: null }]);
  });

  test('una rèplica amb notes (d’un altre dispositiu) o sense la carpeta local d’origen es pinta com sempre', () => {
    const repliques = [{ local: 'f-festes', remot: DEL_SERVIDOR }];
    const locals = [{ id: 'f-festes', nom: 'Festes' }];
    expect(repliquesAmagades(repliques, locals, [{ id: 'n', folderId: DEL_SERVIDOR }])).toBe('');
    expect(repliquesAmagades(repliques, [], [])).toBe('');
    expect(repliquesAmagades([], locals, [])).toBe('');
    expect(repliquesAmagades(repliques, locals, [{ id: 'n', folderId: 'f-festes' }])).toBe(DEL_SERVIDOR);
    const llista = [...NOTE_FOLDERS_SEED, FIRA];
    expect(senseRepliques(llista, '')).toBe(llista);
    expect(senseRepliques(llista, 'f-00000000-0000-4000-8000-000000000009')).toBe(llista);
    expect(senseRepliques(llista, DEL_SERVIDOR)).toEqual(NOTE_FOLDERS_SEED);
  });
});

/* Onada R30 · PF-01 (àrbitre del kit lot_01 de Codex) · Dues invariants que el kit provava sobre
   la seua implementació (que esborrava la còpia local després de l'ACK) i que esta no tenia
   escrites: l'aïllament per àmbit amb el mateix slug i una altra pestanya que reescriu el
   storage mentre l'ACK és en vol. */
describe('casos empeltats del kit de Codex', () => {
  const ALTRE_AMBIT = `supabase:poble_persona::${ALTRA}_${POBLE}`;

  test('només puja l’àmbit propi: un altre àmbit amb el mateix slug i un altre nom no ix ni s’apunta', async () => {
    sembra('Festes');
    desaCarpetaCreada(ALTRE_AMBIT, { id: 'f-festes', nom: 'Altres festes' });
    const abans = cruLocal();
    const servidor = creaServidor();
    const port = creaPort(servidor);
    await expect(migraCarpetesLocals(abast(), PERSONA, { port })).resolves.toMatchObject({ estat: 'fet', migrades: 1 });
    expect(port.creaCarpetaNotes.mock.calls).toEqual([[{ nom: 'Festes' }, CONFIG]]);
    expect([...servidor.carpetes.keys()]).toEqual(['festes']);
    expect(repliquesDeCarpetes(ALTRE_AMBIT)).toEqual([]);
    expect(carpetesPendentsDeMigrar(ALTRE_AMBIT)).toEqual([{ id: 'f-festes', nom: 'Altres festes' }]);
    expect(cruLocal()).toBe(abans);
  });

  test('una altra pestanya que reescriu el storage mentre l’ACK és en vol no perd cap carpeta ni cap àmbit', async () => {
    sembra('Festes');
    const servidor = creaServidor();
    const port = creaPort(servidor);
    let solta;
    port.creaCarpetaNotes.mockImplementation(async ({ nom }) => { await new Promise((r) => { solta = r; }); return servidor.crea(nom); });
    const enVol = migraCarpetesLocals(abast(), PERSONA, { port });
    await vi.waitFor(() => expect(solta).toBeTypeOf('function'));
    const deLaPestanyaB = JSON.stringify({ v: 1, ambits: {
      [AMBIT]: [{ id: 'f-festes', nom: 'Festes' }, { id: 'f-hort', nom: 'Hort' }],
      [ALTRE_AMBIT]: [{ id: 'f-b', nom: 'Carpeta B' }]
    } });
    localStorage.setItem(CLAU_LOCAL, deLaPestanyaB);
    window.dispatchEvent(new StorageEvent('storage', { key: CLAU_LOCAL }));
    solta();
    await expect(enVol).resolves.toMatchObject({ migrades: 1 });
    expect(localStorage.getItem(CLAU_LOCAL)).toBe(deLaPestanyaB);
    _reiniciaCarpetesCreades();
    expect(carpetesPendentsDeMigrar(AMBIT).map((c) => c.id)).toEqual(['f-hort']);
    expect(carpetesPendentsDeMigrar(ALTRE_AMBIT).map((c) => c.id)).toEqual(['f-b']);
    expect(repliquesDeCarpetes(AMBIT)).toEqual([{ local: 'f-festes', remot: servidor.carpetes.get('festes').id }]);
  });
});
