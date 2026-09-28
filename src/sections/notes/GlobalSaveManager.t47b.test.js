/* T47b (ordre del Mestre, 260928) · «Totes les dades s'han de desar
   automàticament sense pèrdues de dades.» Proves del gestor de Notes:
   funcions renovades a cada tecla, sessió sense toast, reintent amb retrocés
   i en 'online', quarantena de columna absent, repren i estat per a la ploma. */
import { afterEach, expect, test, vi } from 'vitest';
import { GlobalSaveManager, draftFields, classificaFallada, getDraftsForScope, esEsborranyDe } from './GlobalSaveManager.js';
import { ErrorColumnaAbsent } from '../../data/autodesament/errors.js';
import { DETALL_PESTANYA, estatPerAlEditor } from './useEstatDesamentNota.js';

const KEY = 'tenant:note';

function setup(opcions = {}) {
  const records = new Map();
  const persist = async (key, transform) => {
    const result = transform(structuredClone(records.get(key) || {}));
    if (result == null) records.delete(key);
    else records.set(key, structuredClone(result));
    return result;
  };
  const finestra = new EventTarget();
  const manager = new GlobalSaveManager({ persist, delay: 60000, finestra, ...opcions });
  const clear = vi.fn();
  const toast = vi.fn();
  const enqueue = (field, value, update, extra = {}) => manager.enqueue('tenant', 'note', field, value,
    () => ({ revision: 1 }), update, extra.clear || clear, extra.toast || toast);
  return { manager, records, enqueue, clear, toast, finestra };
}

const errorXarxa = () => Object.assign(
  new Error('Error de xarxa: No es pot connectar al servidor.'), { name: 'ErrorSupabase', status: 0 });
const avortat = () => new DOMException('Sessió canviada.', 'AbortError');
const pgrst204 = (columna) => Object.assign(new Error(
  `Supabase 400: {"code":"PGRST204","message":"Could not find the '${columna}' column of 'notes' in the schema cache"}`),
{ status: 400 });
const desa = async (_id, payload, revision) => ({ ...payload, revision: revision + 1 });

afterEach(() => { vi.useRealTimers(); });

test('les funcions es renoven a cada tecla: escriu la de l’última operació, no la del primer enqueue', async () => {
  const { manager, enqueue } = setup();
  const vella = vi.fn(async () => { throw avortat(); });
  const nova = vi.fn(desa);
  const clearVell = vi.fn();
  const clearNou = vi.fn();
  enqueue('title', 'A', vella, { clear: clearVell });
  const pendent = enqueue('title', 'AB', nova, { clear: clearNou });
  expect(await manager.flush('tenant', 'note')).toBe(true);
  expect(await pendent).toBe(true);
  expect(vella).not.toHaveBeenCalled();
  expect(nova).toHaveBeenCalledWith('note', { title: 'AB' }, 1);
  expect(clearVell).not.toHaveBeenCalled();
  expect(clearNou).toHaveBeenCalledWith('note', { title: 'AB' }, 2);
});

test('AbortError és la sessió: sense toast, l’esborrany es queda a la cua i ix en renovar-se la sessió', async () => {
  const { manager, records, enqueue, toast, finestra } = setup();
  let intents = 0;
  const update = vi.fn(async (id, payload, revision) => {
    intents += 1;
    if (intents === 1) throw avortat();
    return desa(id, payload, revision);
  });
  const pendent = enqueue('title', 'Meu', update);
  expect(await manager.flush('tenant', 'note')).toBe(false);
  expect(await pendent).toBe(false);
  expect(toast).not.toHaveBeenCalled();
  expect(draftFields(records.get(KEY))).toEqual({ title: 'Meu' });
  expect(manager.queues.has(KEY)).toBe(true);
  expect(manager.estat('tenant', 'note')).toMatchObject({ estat: 'sessio', problema: { tipus: 'sessio' } });

  finestra.dispatchEvent(new Event('sdp:auth-change'));
  await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(2));
  await manager.locks.get(KEY);
  expect(draftFields(records.get(KEY))).toEqual({});
  expect(manager.estat('tenant', 'note').estat).toBe('net');
});

test('una fallada de xarxa es reintenta amb retrocés i un sol avís, sense esborrar res abans de l’èxit', async () => {
  vi.useFakeTimers();
  const { manager, records, enqueue, toast } = setup();
  let intents = 0;
  const update = vi.fn(async (id, payload, revision) => {
    intents += 1;
    if (intents <= 2) throw errorXarxa();
    return desa(id, payload, revision);
  });
  enqueue('content', '<p>cos</p>', update);
  expect(await manager.flush('tenant', 'note')).toBe(false);
  expect(update).toHaveBeenCalledTimes(1);
  expect(draftFields(records.get(KEY))).toEqual({ content: '<p>cos</p>' });
  expect(manager.queues.has(KEY)).toBe(true);
  expect(manager.estat('tenant', 'note')).toMatchObject({ estat: 'error', problema: { tipus: 'temporal', intents: 1 } });

  await vi.advanceTimersByTimeAsync(999);
  expect(update).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  await manager.locks.get(KEY);
  expect(update).toHaveBeenCalledTimes(2);
  expect(manager.estat('tenant', 'note').problema).toMatchObject({ tipus: 'temporal', intents: 2 });
  expect(draftFields(records.get(KEY))).toEqual({ content: '<p>cos</p>' });

  // Segon retrocés: 2 s.
  await vi.advanceTimersByTimeAsync(1999);
  expect(update).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(1);
  await manager.locks.get(KEY);
  expect(update).toHaveBeenCalledTimes(3);
  expect(draftFields(records.get(KEY))).toEqual({});
  expect(manager.queues.has(KEY)).toBe(false);
  expect(manager.estat('tenant', 'note').estat).toBe('net');
  // Un sol toast per ratxa: la ploma diu la resta.
  expect(toast).toHaveBeenCalledTimes(1);
  expect(toast.mock.calls[0][0]).toContain('Es tornarà a provar sol');
});

test('en tornar la xarxa (online) el lot fallit ix ja, sense esperar el retrocés', async () => {
  vi.useFakeTimers();
  const { manager, records, enqueue, finestra } = setup();
  const update = vi.fn().mockRejectedValueOnce(errorXarxa()).mockImplementation(desa);
  enqueue('title', 'Títol', update);
  expect(await manager.flush('tenant', 'note')).toBe(false);
  finestra.dispatchEvent(new Event('online'));
  await manager.locks.get(KEY);
  expect(update).toHaveBeenCalledTimes(2);
  expect(draftFields(records.get(KEY))).toEqual({});
});

/* T47 (ordre del Mestre, 260928) · Un TimeoutError fa que NotesDataContext
   torne a carregar (refresh) i la càrrega crida repren: si repren avançara el
   lot, cada timeout en provocaria un altre a l'instant, sense retrocés. */
test('T47 · repren no anul·la el retrocés d’un lot amb fallada temporal', async () => {
  vi.useFakeTimers();
  const { manager, enqueue } = setup();
  const timeout = Object.assign(new Error('Temps esgotat.'), { name: 'TimeoutError' });
  const update = vi.fn().mockRejectedValueOnce(timeout).mockImplementation(desa);
  enqueue('title', 'Títol', update);
  expect(await manager.flush('tenant', 'note')).toBe(false);
  expect(manager.estat('tenant', 'note').problema).toMatchObject({ tipus: 'temporal', intents: 1 });
  manager.repren('tenant', 'note', { update });
  await vi.advanceTimersByTimeAsync(999);
  expect(update).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  await manager.locks.get(KEY);
  expect(update).toHaveBeenCalledTimes(2);
  expect(manager.estat('tenant', 'note').estat).toBe('net');
});

/* T47 (ordre del Mestre, 260928) · Firefox 100–114 en privat (Baseline 2022)
   no obri IndexedDB: abans Notes no enviava mai res i el Bloc ni carregava. */
test('T47 · sense magatzem al dispositiu, el desat continua des de la memòria amb el mateix CAS i la ploma ho diu', async () => {
  const persist = vi.fn(async () => { throw new DOMException('No es pot obrir la base.', 'InvalidStateError'); });
  const manager = new GlobalSaveManager({ persist, delay: 60000, finestra: new EventTarget() });
  const update = vi.fn(desa);
  const toast = vi.fn();
  const pendent = manager.enqueue('ambit', 'n', 'title', 'Només ací', () => ({ revision: 3 }), update, vi.fn(), toast);
  await manager.writes.get('ambit:n');
  expect(manager.memoria.get('ambit:n')).toEqual({
    title: 'Només ací', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 3
  });
  expect(manager.estat('ambit', 'n')).toMatchObject({ estat: 'pendent', pestanya: true });
  expect(estatPerAlEditor(manager.estat('ambit', 'n'))).toEqual({ estat: 'pendent', detall: DETALL_PESTANYA });
  // La càrrega del Bloc no rebutja (jsdom no té IndexedDB) i veu el que hi ha en esta pestanya.
  expect(await getDraftsForScope('ambit', manager)).toEqual({ n: expect.objectContaining({ title: 'Només ací' }) });

  expect(await manager.flush('ambit', 'n')).toBe(true);
  expect(await pendent).toBe(true);
  expect(update).toHaveBeenCalledWith('n', { title: 'Només ací' }, 3);
  expect(manager.memoria.get('ambit:n')).toMatchObject({ _fieldVersions: {}, _baseRevision: 4 });
  expect(draftFields(manager.memoria.get('ambit:n'))).toEqual({});
  expect(toast).not.toHaveBeenCalled();
  // La clau ja no torna al disc: mai dos registres vius de la mateixa nota.
  expect(persist).toHaveBeenCalledTimes(1);
  expect(manager.estat('ambit', 'n').estat).toBe('net');

  // Una fallada de xarxa no promet cap còpia al dispositiu.
  const xarxa = vi.fn(async () => { throw errorXarxa(); });
  void manager.enqueue('ambit', 'n', 'lead', 'Entradilla', () => ({ revision: 4 }), xarxa, vi.fn(), toast);
  expect(await manager.flush('ambit', 'n')).toBe(false);
  expect(toast).toHaveBeenCalledWith('No s’ha pogut confirmar el desat. Es tornarà a provar sol; el canvi només es conserva en esta pestanya.', 'error');
  expect(estatPerAlEditor(manager.estat('ambit', 'n')).detall).toContain('el canvi només es guarda en esta pestanya');
  manager.cancelaCua('ambit:n');
});

test('T47 · eixir: darrer intent d’enviar i, després, s’obliden tots els esborranys de la persona (i només els seus)', async () => {
  const records = new Map();
  const persist = async (key, transform) => {
    const result = transform(structuredClone(records.get(key) || {}));
    if (result == null) records.delete(key);
    else records.set(key, structuredClone(result));
    return result;
  };
  const purga = vi.fn(async (predicat) => {
    const fora = [...records.keys()].filter(predicat);
    fora.forEach(clau => records.delete(clau));
    return fora;
  });
  const manager = new GlobalSaveManager({ persist, purga, delay: 60000, finestra: new EventTarget() });
  const B = 'backend:["sdp","","t","remote"]';
  const personal = `${B}_persona::U1_t`;
  const entitat = `${B}_U1_entitat::O_t`;
  const altra = `${B}_persona::U2_t`;
  records.set(`${entitat}:e`, { icon: '🌿', _quarantena: ['icon'], _operationVersion: 1, _fieldVersions: { icon: 1 }, _baseRevision: 2 });
  records.set(`${altra}:x`, { title: 'De U2', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 1 });
  const update = vi.fn(desa);
  const pendent = manager.enqueue(personal, 'n', 'title', 'Últim', () => ({ revision: 1 }), update, vi.fn(), vi.fn());

  // Pas 1, amb la sessió encara vàlida: el pendent ix.
  expect(await manager.enviaPendentsDe('U1')).toBe(true);
  expect(update).toHaveBeenCalledWith('n', { title: 'Últim' }, 1);
  expect(await pendent).toBe(true);
  expect(purga).not.toHaveBeenCalled();
  // Pas 3, tancada la sessió: s'oblida tot el d'U1 (també la quarantena), res d'U2.
  const oblidades = await manager.oblidaUsuari('U1');
  expect(oblidades).toEqual(expect.arrayContaining([`${personal}:n`, `${entitat}:e`]));
  expect([...records.keys()]).toEqual([`${altra}:x`]);
  expect(manager.queues.size).toBe(0);
  expect(esEsborranyDe(`${altra}:x`, 'U1')).toBe(false);
  expect(esEsborranyDe(`${personal}:n`, '')).toBe(false);

  // Eixir no es queda penjat per un servidor que no respon; oblidar talla la cua.
  const penjat = vi.fn(() => new Promise(() => {}));
  void manager.enqueue(personal, 'm', 'title', 'Sense resposta', () => ({ revision: 1 }), penjat, vi.fn(), vi.fn());
  expect(await manager.enviaPendentsDe('U1', { espera: 5 })).toBe(false);
  expect(penjat).toHaveBeenCalled();
  await manager.oblidaUsuari('U1');
  expect(records.has(`${personal}:m`)).toBe(false);
});

/* T47 (correcció de la revisió C01/C02, 260928) · Abans d'eixir, l'avís diu
   el que Notes encara no ha pogut enviar: del disc i de la memòria. */
test('T47 · C01/C02 · pendentsDe diu les notes d’esta persona que el servidor encara no té (disc i memòria) i no esborra res', async () => {
  const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const B = 'backend:["sdp","","t","remote"]';
    const personal = `${B}_persona::U1_t`;
    const altra = `${B}_persona::U2_t`;
    const disc = new Map([
      [`${personal}:a`, { title: 'Del disc', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 1 }],
      [`${personal}:neta`, { _operationVersion: 2, _fieldVersions: {}, _baseRevision: 2 }],
      [`${altra}:x`, { title: 'De U2', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 1 }],
    ]);
    const llegeix = vi.fn(async (predicat) => [...disc].filter(([clau]) => predicat(clau)));
    /* El dispositiu no guarda: la nota 'b' només és en esta pestanya. */
    const persist = async () => { throw new DOMException('No es pot obrir la base.', 'InvalidStateError'); };
    const manager = new GlobalSaveManager({ persist, llegeix, delay: 60000, finestra: new EventTarget() });
    void manager.enqueue(personal, 'b', 'icon', '🌿', () => ({ revision: 1 }), vi.fn(), vi.fn(), vi.fn());
    await manager.writes.get(`${personal}:b`);
    expect(await manager.pendentsDe('U1')).toEqual([
      { entitat: 'nota', id: 'a', camps: ['title'] },
      { entitat: 'nota', id: 'b', camps: ['icon'] },
    ]);
    expect(disc.size).toBe(3);
    expect(await manager.pendentsDe('')).toEqual([]);
    // Un disc que no es pot llegir no tomba l'avís: diu el que sap.
    manager.llegeix = async () => { throw new Error('bloquejat'); };
    expect(await manager.pendentsDe('U1')).toEqual([{ entitat: 'nota', id: 'b', camps: ['icon'] }]);
    manager.cancelaCua(`${personal}:b`);
  } finally {
    avisos.mockRestore();
  }
});

/* T47 (ordre del Mestre, 260928) · Les columnes opcionals (icon, publish_date)
   les aïlla l'adaptador (columnesOpcionals.js) i en diu els camps. Un PGRST204
   cru que arriba al gestor és d'una columna que no és opcional: amagar-la en
   quarantena, en silenci, donaria per desat un camp obligatori. */
test('T47 · un PGRST204 cru és d’una columna no opcional: error del servidor amb avís i flush false, mai quarantena', async () => {
  const { manager, records, enqueue, clear, toast } = setup();
  const update = vi.fn(async (_id, payload) => { throw pgrst204('title' in payload ? 'title' : 'icon'); });
  enqueue('title', 'Hort', update);
  const pendent = enqueue('icon', '🌿', update);
  expect(await manager.flush('tenant', 'note')).toBe(false);
  expect(await pendent).toBe(false);
  // Cap segon intent sense el camp: el lot sencer es queda a l'esborrany.
  expect(update).toHaveBeenCalledTimes(1);
  expect(draftFields(records.get(KEY))).toEqual({ title: 'Hort', icon: '🌿' });
  expect(records.get(KEY)._quarantena).toBeUndefined();
  expect(clear).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalledWith('No s’ha pogut desar: el servidor no té on guardar un dels camps d’esta nota. El canvi es conserva en este dispositiu.', 'error');
  expect(manager.estat('tenant', 'note')).toMatchObject({ estat: 'error', problema: { tipus: 'servidor' }, quarantena: [] });

  // Un lot d'un sol camp tampoc s'aïlla pel fet de ser l'únic.
  const sol = setup();
  const nomesTitol = vi.fn(async () => { throw pgrst204('title'); });
  sol.enqueue('title', 'Sol', nomesTitol);
  expect(await sol.manager.flush('tenant', 'note')).toBe(false);
  expect(sol.manager.estat('tenant', 'note')).toMatchObject({ problema: { tipus: 'servidor' }, quarantena: [] });
  expect(draftFields(sol.records.get(KEY))).toEqual({ title: 'Sol' });
});

test('T47 · la quarantena es guarda a l’esborrany (_quarantena) i no reté la base: un canvi remot no bloqueja els desats', async () => {
  const { manager, records, toast } = setup();
  // L'adaptador (notes.js) aïlla l'emoticona sense columna i ho diu amb campsNoDesats.
  const update = vi.fn(async (_id, payload, revision) => {
    const { icon, ...resta } = payload;
    return { ...resta, revision: revision + 1, ...(icon !== undefined ? { campsNoDesats: ['icon'] } : {}) };
  });
  const tecla = (field, value, revisio) => manager.enqueue('tenant', 'note', field, value,
    () => ({ revision: revisio }), update, vi.fn(), toast);
  tecla('title', 'Hort', 1);
  tecla('icon', '🌿', 1);
  expect(await manager.flush('tenant', 'note')).toBe(true);
  expect(records.get(KEY)).toMatchObject({ icon: '🌿', _quarantena: ['icon'], _baseRevision: 2 });

  // Un altre dispositiu desa la nota (revisió 5) i esta pestanya ja la veu:
  // el camp en quarantena no és pendent i la base avança a la revisió vista.
  const desat = tecla('lead', 'Entradilla', 5);
  expect(await manager.flush('tenant', 'note')).toBe(true);
  expect(await desat).toBe(true);
  expect(update).toHaveBeenLastCalledWith('note', { icon: '🌿', lead: 'Entradilla' }, 5);
  expect(toast).not.toHaveBeenCalled();
  expect(records.get(KEY)).toMatchObject({ icon: '🌿', _quarantena: ['icon'], _baseRevision: 6 });
  expect(draftFields(records.get(KEY))).toEqual({ icon: '🌿' });

  // Només queda el camp en quarantena: publicar no es bloqueja.
  const altra = tecla('icon', '🍅', 6);
  expect(await manager.runExclusive('tenant', 'note', async () => 'publicada')).toBe('publicada');
  expect(await altra).toBe(true);
  expect(draftFields(records.get(KEY))).toEqual({ icon: '🍅' });
});

test('T47 · en recarregar, un esborrany només en quarantena ix amb la revisió que es veu, no amb la seua base vella', async () => {
  const { manager, records } = setup();
  records.set(KEY, { icon: '🌿', _quarantena: ['icon'], _operationVersion: 1, _fieldVersions: { icon: 1 }, _baseRevision: 2 });
  const update = vi.fn(async (_id, _payload, revision) => ({ revision: revision + 1, campsNoDesats: ['icon'] }));
  manager.repren('tenant', 'note', { update, getBase: () => ({ revision: 5 }) });
  await vi.waitFor(() => expect(update).toHaveBeenCalled());
  expect(update).toHaveBeenCalledWith('note', { icon: '🌿' }, 5);
});

test('si l’adaptador ja ha aïllat la columna (campsNoDesats o ErrorColumnaAbsent), el camp es conserva', async () => {
  const { manager, records, enqueue, clear, toast } = setup();
  const update = vi.fn(async (_id, payload, revision) => ({ ...payload, revision: revision + 1, campsNoDesats: ['icon'] }));
  enqueue('title', 'Hort', update);
  enqueue('icon', '🌿', update);
  expect(await manager.flush('tenant', 'note')).toBe(true);
  expect(update).toHaveBeenCalledTimes(1);
  expect(draftFields(records.get(KEY))).toEqual({ icon: '🌿' });
  expect(clear).toHaveBeenCalledWith('note', { title: 'Hort' }, 2);

  const senseXarxa = vi.fn(async () => {
    throw new ErrorColumnaAbsent('El servidor encara no té la columna «icon».', { columna: 'icon', camps: ['icon'] });
  });
  const pendent = enqueue('icon', '🍅', senseXarxa);
  expect(await manager.flush('tenant', 'note')).toBe(true);
  expect(await pendent).toBe(true);
  expect(senseXarxa).toHaveBeenCalledTimes(1);
  expect(draftFields(records.get(KEY))).toEqual({ icon: '🍅' });
  expect(toast).not.toHaveBeenCalled();
  expect(manager.estat('tenant', 'note').quarantena).toEqual(['icon']);
});

test('un 404 no es reintenta: avisa, conserva l’esborrany i no torna a la cua', async () => {
  const { manager, records, enqueue, toast } = setup();
  const update = vi.fn(async () => { throw Object.assign(new Error('No accessible o eliminada.'), { status: 404 }); });
  enqueue('title', 'Perduda', update);
  expect(await manager.flush('tenant', 'note')).toBe(false);
  expect(classificaFallada({ status: 404 }).tipus).toBe('servidor');
  expect(manager.queues.has(KEY)).toBe(false);
  expect(draftFields(records.get(KEY))).toEqual({ title: 'Perduda' });
  expect(toast).toHaveBeenCalledWith(expect.stringContaining('ja no és al servidor'), 'error');
  expect(manager.estat('tenant', 'note')).toMatchObject({ estat: 'error', problema: { tipus: 'servidor' } });
});

test('l’estat per a la ploma passa per pendent, enviant i net, i és estable entre avisos', async () => {
  const { manager, enqueue } = setup();
  const estats = [];
  const deixa = manager.subscriu(() => estats.push(manager.estat('tenant', 'note').estat));
  let resol;
  const update = vi.fn(() => new Promise((r) => { resol = r; }));
  expect(manager.estat('tenant', 'note').estat).toBe('net');
  enqueue('title', 'A', update);
  expect(manager.estat('tenant', 'note')).toBe(manager.estat('tenant', 'note'));
  const flushed = manager.flush('tenant', 'note');
  await vi.waitFor(() => expect(update).toHaveBeenCalled());
  expect(manager.estat('tenant', 'note').estat).toBe('enviant');
  resol({ revision: 2 });
  expect(await flushed).toBe(true);
  expect(estats).toEqual(['pendent', 'enviant', 'net']);
  deixa();
});

test('repren envia un esborrany de la cua de disc sense cap tecla, amb la base del CAS', async () => {
  const { manager, records } = setup();
  records.set(KEY, { title: 'Pendent', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 3 });
  const update = vi.fn(desa);
  manager.repren('tenant', 'note', { update });
  await vi.waitFor(() => expect(update).toHaveBeenCalled());
  expect(update).toHaveBeenCalledWith('note', { title: 'Pendent' }, 3);
  await manager.locks.get(KEY);
  expect(draftFields(records.get(KEY))).toEqual({});
  expect(records.get(KEY)._baseRevision).toBe(4);
  // Sense la funció d'escriptura de l'operació viva no es fa res.
  manager.repren('tenant', 'altra', {});
  expect(manager.queues.has('tenant:altra')).toBe(false);
});

test('repren renova l’escriptura d’un lot que esperava sessió i l’envia', async () => {
  const { manager, records, enqueue } = setup();
  const morta = vi.fn(async () => { throw avortat(); });
  enqueue('lead', 'Entradilla', morta);
  expect(await manager.flush('tenant', 'note')).toBe(false);
  const viva = vi.fn(desa);
  manager.repren('tenant', 'note', { update: viva });
  await vi.waitFor(() => expect(viva).toHaveBeenCalledWith('note', { lead: 'Entradilla' }, 1));
  await manager.locks.get(KEY);
  expect(morta).toHaveBeenCalledTimes(1);
  expect(draftFields(records.get(KEY))).toEqual({});
});

test('una tecla recent no s’avança per un repren: el seu temporitzador mana', async () => {
  const { manager, enqueue } = setup();
  const update = vi.fn(desa);
  enqueue('title', 'Escrivint', update);
  manager.repren('tenant', 'note', { update });
  await new Promise((r) => setTimeout(r, 5));
  expect(update).not.toHaveBeenCalled();
  expect(manager.estat('tenant', 'note').estat).toBe('pendent');
});

test('D01: decidir conservar el meu esborrany lleva el conflicte de la ploma', async () => {
  const { manager, records, enqueue } = setup();
  const update = vi.fn(async () => { throw Object.assign(new Error('conflicte'), { status: 409 }); });
  enqueue('title', 'Meu', update);
  expect(await manager.flush('tenant', 'note')).toBe(false);
  expect(manager.queues.has(KEY)).toBe(false);
  expect(manager.estat('tenant', 'note').problema).toMatchObject({ tipus: 'conflicte' });
  expect(await manager.rebaseDraft('tenant', 'note', 5)).toEqual({ title: 'Meu' });
  expect(manager.estat('tenant', 'note').problema).toBeNull();
  expect(records.get(KEY)._baseRevision).toBe(5);
  await manager.clearDraft('tenant', 'note');
  expect(manager.estat('tenant', 'note').estat).toBe('net');
});

/* Correcció de revisió: moure la nota (paperera o arxiu) no pot destruir la
   única còpia d'un camp que el servidor encara no admet. */
test('retira (paperera o arxiu) conserva al dispositiu el camp en quarantena; oblida (esborrat) no', async () => {
  const { manager, records, enqueue } = setup();
  // T47 · Com l'adaptador: l'emoticona sense columna torna com a campsNoDesats.
  const update = vi.fn(async (_id, payload, revision) => ({
    ...payload, revision: revision + 1, ...('icon' in payload ? { campsNoDesats: ['icon'] } : {})
  }));
  enqueue('title', 'Hort', update);
  enqueue('icon', '🌿', update);
  const moguda = vi.fn(async () => 'moguda');
  expect(await manager.runExclusive('tenant', 'note', moguda)).toBe('moguda');
  // Una tecla que arriba mentre es mou: es cancel·la, però el valor ja és al disc.
  const tardana = enqueue('lead', 'Tardana', update);
  expect(await manager.retira('tenant', 'note')).toEqual(['icon', 'lead']);
  expect(await tardana).toBe(false);
  expect(draftFields(records.get(KEY))).toEqual({ icon: '🌿', lead: 'Tardana' });
  expect(manager.queues.has(KEY)).toBe(false);
  expect(manager.estat('tenant', 'note').estat).toBe('net');
  expect(update.mock.calls.map(([, payload]) => payload)).toEqual([{ title: 'Hort', icon: '🌿' }]);

  // Sense res pendent, el registre s'esborra com abans.
  records.set(KEY, { _operationVersion: 3, _fieldVersions: {}, _baseRevision: 2 });
  expect(await manager.retira('tenant', 'note')).toEqual([]);
  expect(records.has(KEY)).toBe(false);

  // L'esborrat definitiu sí que ho oblida tot.
  records.set(KEY, { icon: '🌿', _operationVersion: 1, _fieldVersions: { icon: 1 }, _baseRevision: 2 });
  await manager.oblida('tenant', 'note');
  expect(records.has(KEY)).toBe(false);
});
