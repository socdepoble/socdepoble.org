// @vitest-environment node
import { webcrypto } from 'node:crypto';
import { test, expect, vi } from 'vitest';
import { diaAgricola, simulaAvisosAgricoles, enviaAvisosAgricoles } from './subscripcionsAgricoles.js';
import manifest from '../../apps/salut/manifest.js';
import { avaluaInterruptor } from '../../apps/plataforma/interruptors.js';
const id = (n) => `12250000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sub = { id: id(1), usuariId: id(2), pobleId: id(3), filId: id(4), cultiu: 'tomaca', comarca: 'alcoia', activa: true };
const fita = { id: id(5), cultiu: 'tomaca', comarca: 'alcoia', dia: '2026-03-29', titol: 'Fita facilitada per la cooperativa', font: 'https://example.org/fita' };
const base = { subscripcions: [sub], fites: [fita], desde: '2026-03-29', fins: '2026-03-30', cripto: webcrypto };

test('simulador determinista, civil DST, límits semioberts i desduplicació', async () => {
  const a = await simulaAvisosAgricoles({ ...base, subscripcions: [sub, sub], fites: [fita, fita] });
  expect(a).toEqual(await simulaAvisosAgricoles(base));
  expect(a).toMatchObject({ mode: 'simulat', senseIa: true, avisos: [{ dia: '2026-03-29', filId: sub.filId }] });
  expect(a.avisos).toHaveLength(1);
  expect((await simulaAvisosAgricoles({ ...base, fins: '2026-03-29', desde: '2026-03-28' })).avisos).toHaveLength(0);
  expect((await simulaAvisosAgricoles({ ...base, subscripcions: [{ ...sub, activa: false }] })).avisos).toHaveLength(0);
  expect(() => diaAgricola('2026-02-30')).toThrow();
  await expect(simulaAvisosAgricoles({ ...base, fites: [fita, { ...fita, titol: 'Divergent' }] })).rejects.toMatchObject({ codi: 'DUPLICAT' });
  await expect(simulaAvisosAgricoles({ ...base, fites: [{ ...fita, font: 'javascript:alert(1)' }] })).rejects.toMatchObject({ codi: 'FONT' });
});

test('Xat intern explícit, reintent amb mateix UUID, baixa immediata i ACK honest', async () => {
  const pla = await simulaAvisosAgricoles(base);
  const enviaXat = vi.fn(async (a) => ({ id: a.clientId }));
  const port = { usuariId: sub.usuariId, subscripcioActiva: async () => sub, enviaXat, comprovaAmbit: () => {} };
  expect(await enviaAvisosAgricoles(pla, port)).toEqual([{ clientId: pla.avisos[0].clientId, estat: 'confirmat' }]);
  await enviaAvisosAgricoles(pla, port);
  expect(enviaXat.mock.calls[0][0].clientId).toBe(enviaXat.mock.calls[1][0].clientId);
  expect(await enviaAvisosAgricoles(pla, { ...port, subscripcioActiva: async () => ({ ...sub, activa: false }) })).toMatchObject([{ estat: 'baixa' }]);
  await expect(enviaAvisosAgricoles(pla, { ...port, enviaXat: async () => ({}) })).rejects.toMatchObject({ codi: 'ACK' });
  const n = enviaXat.mock.calls.length;
  await expect(enviaAvisosAgricoles(pla, { ...port, usuariId: id(99) })).rejects.toMatchObject({ codi: 'AVIS' });
  expect(enviaXat).toHaveBeenCalledTimes(n);
});

test('[DEFECTE] enviament agrícola requereix guarda síncrona i fila autoritativa amb tot l’àmbit vigent', async () => {
  const pla = await simulaAvisosAgricoles(base);
  const enviaXat = vi.fn(async (a) => ({ id: a.clientId }));
  const port = { usuariId: sub.usuariId, subscripcioActiva: async () => sub, enviaXat, comprovaAmbit: () => {} };
  await expect(enviaAvisosAgricoles(pla, { ...port, comprovaAmbit: undefined })).rejects.toMatchObject({ codi: 'PORT' });
  await expect(enviaAvisosAgricoles(pla, { ...port, comprovaAmbit: async () => true })).rejects.toMatchObject({ codi: 'AMBIT_ASINCRON' });
  await expect(enviaAvisosAgricoles(pla, { ...port, comprovaAmbit: () => false })).rejects.toMatchObject({ codi: 'AMBIT' });
  await expect(enviaAvisosAgricoles(pla, { ...port, subscripcioActiva: async () => true })).rejects.toMatchObject({ codi: 'SUBSCRIPCIO' });
  for (const canvi of [{ id: id(91) }, { usuariId: id(92) }, { pobleId: id(93) }, { filId: id(94) }, { cultiu: 'ceba' }, { comarca: 'marina-alta' }]) {
    await expect(enviaAvisosAgricoles(pla, { ...port, subscripcioActiva: async () => ({ ...sub, ...canvi }) })).rejects.toMatchObject({ codi: 'SUBSCRIPCIO_DIVERGENT' });
  }
  expect(enviaXat).not.toHaveBeenCalled();
});

test('[DEFECTE] canvi de compte entre awaits refusa abans d’enviar i no confirma un ACK tardà', async () => {
  const pla = await simulaAvisosAgricoles(base);
  let ambitVigent = true;
  const comprovaAmbit = () => { if (!ambitVigent) throw Object.assign(new Error('Àmbit canviat'), { codi: 'AMBIT_CANVIAT' }); };
  const enviaXat = vi.fn(async (a) => ({ id: a.clientId }));
  const port = { usuariId: sub.usuariId, comprovaAmbit, enviaXat, subscripcioActiva: async () => { ambitVigent = false; return sub; } };
  await expect(enviaAvisosAgricoles(pla, port)).rejects.toMatchObject({ codi: 'AMBIT_CANVIAT' });
  expect(enviaXat).not.toHaveBeenCalled();
  ambitVigent = true;
  await expect(enviaAvisosAgricoles(pla, { ...port, subscripcioActiva: async () => sub, enviaXat: async (a) => { ambitVigent = false; return { id: a.clientId }; } })).rejects.toMatchObject({ codi: 'AMBIT_CANVIAT' });
});

test('[DEFECTE] un callback no pot canviar la destinació del pla després de validar-lo', async () => {
  const pla = structuredClone(await simulaAvisosAgricoles(base));
  const enviaXat = vi.fn(async (a) => ({ id: a.clientId }));
  await enviaAvisosAgricoles(pla, { usuariId: sub.usuariId, comprovaAmbit: () => {}, enviaXat,
    subscripcioActiva: async () => { pla.avisos[0].filId = id(99); return sub; } });
  expect(enviaXat.mock.calls[0][0].filId).toBe(sub.filId);
});

test('Salut: els tres interruptors són actius en producció i respecten la preferència personal', () => {
  for (const idInterruptor of ['agitacio', 'medicacio', 'deposicions']) {
    expect(avaluaInterruptor(manifest, idInterruptor).actiu).toBe(true);
    expect(avaluaInterruptor(manifest, idInterruptor, { preferencies: { interruptors: { salut: { [idInterruptor]: false } } } }).actiu).toBe(false);
  }
});


// C12 · regressions de rebuts d’interrupció i frontera d’errors.
import assertC12 from 'node:assert/strict';
const idC12 = n => `12250000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const subC12 = {
  id: idC12(1),
  usuariId: idC12(2),
  pobleId: idC12(3),
  filId: idC12(4),
  cultiu: 'tomaca',
  comarca: 'alcoia',
  activa: true
};
const fitaC12 = {
  id: idC12(5),
  cultiu: 'tomaca',
  comarca: 'alcoia',
  dia: '2026-03-29',
  titol: 'Fixture sintètica',
  font: 'https://fixture.invalid/fita'
};
const plaC12 = await simulaAvisosAgricoles({
  subscripcions: [subC12],
  fites: [fitaC12, {
    ...fitaC12,
    id: idC12(6)
  }, {
    ...fitaC12,
    id: idC12(7)
  }],
  desde: '2026-03-29',
  fins: '2026-03-30',
  cripto: webcrypto
});
const unC12 = {
  ...plaC12,
  avisos: plaC12.avisos.slice(0, 1)
};
const portC12 = {
  usuariId: subC12.usuariId,
  comprovaAmbit: () => {},
  subscripcioActiva: async () => subC12,
  enviaXat: async avis => ({
    id: avis.clientId
  })
};
async function falladaC12(task) {
  try {
    await task();
  } catch (error) {
    return error;
  }
  throw new Error('Expected rejection');
}
test('èxit conserva la forma anterior i un array congelat', async () => {
  const result = await enviaAvisosAgricoles(plaC12, portC12);
  assertC12.deepEqual(result, plaC12.avisos.map(a => ({
    clientId: a.clientId,
    estat: 'confirmat'
  })));
  assertC12.equal(Object.isFrozen(result), true);
});
test('un ACK, segon rebuig i tercer no intentat queden separats', async () => {
  let calls = 0;
  const original = Object.freeze(new Error('private transport diagnostic'));
  const error = await falladaC12(() => enviaAvisosAgricoles(plaC12, {
    ...portC12,
    enviaXat: async avis => {
      if (++calls === 1) return {
        id: avis.clientId
      };
      throw original;
    }
  }));
  assertC12.equal(calls, 2);
  assertC12.deepEqual(error.rebut.confirmats, [{
    clientId: plaC12.avisos[0].clientId,
    estat: 'confirmat'
  }]);
  assertC12.equal(error.rebut.interromput, plaC12.avisos[1].clientId);
  assertC12.equal(error.rebut.estatActual, 'sense-confirmacio');
  assertC12.deepEqual(error.rebut.noIntentats, [plaC12.avisos[2].clientId]);
  assertC12.equal(error.cause, original);
  assertC12.equal(error.teConfirmacions, true);
  assertC12.equal(error.ackConfirmat, false);
});
test('ACK exacte abans de revocació es conserva sense resoldre èxit', async () => {
  let current = true;
  const error = await falladaC12(() => enviaAvisosAgricoles(plaC12, {
    ...portC12,
    comprovaAmbit: () => {
      if (!current) throw Object.assign(new Error('scope'), {
        codi: 'AMBIT_CANVIAT'
      });
    },
    enviaXat: async avis => {
      current = false;
      return {
        id: avis.clientId
      };
    }
  }));
  assertC12.equal(error.codi, 'AMBIT_CANVIAT');
  assertC12.equal(error.ackConfirmat, true);
  assertC12.equal(error.rebut.estatActual, 'ack-confirmat');
  assertC12.deepEqual(error.rebut.confirmats, [{
    clientId: plaC12.avisos[0].clientId,
    estat: 'confirmat'
  }]);
  assertC12.deepEqual(error.rebut.noIntentats, plaC12.avisos.slice(1).map(a => a.clientId));
});
test('ACK alié o buit no s’inventa com a confirmació', async () => {
  for (const ack of [null, {}, false, {
    id: idC12(99)
  }]) {
    const error = await falladaC12(() => enviaAvisosAgricoles(unC12, {
      ...portC12,
      enviaXat: async () => ack
    }));
    assertC12.equal(error.codi, 'ACK');
    assertC12.equal(error.ackConfirmat, false);
    assertC12.equal(error.rebut.estatActual, 'sense-confirmacio');
    assertC12.deepEqual(error.rebut.confirmats, []);
  }
});
test('error de subscripció no afirma que s’haja intentat enviar', async () => {
  const original = new Error('subscription unavailable');
  const error = await falladaC12(() => enviaAvisosAgricoles(plaC12, {
    ...portC12,
    subscripcioActiva: async () => {
      throw original;
    }
  }));
  assertC12.equal(error.rebut.fase, 'subscripcio');
  assertC12.equal(error.rebut.estatActual, 'no-enviat');
  assertC12.equal(error.cause, original);
  assertC12.equal(error.teConfirmacions, false);
});
test('rebuig d’await observa l’àmbit i conserva les dues causes', async () => {
  let current = true,
    guards = 0;
  const original = new Error('transport failure');
  const scope = Object.assign(new Error('scope failure'), {
    codi: 'AMBIT_CANVIAT'
  });
  const error = await falladaC12(() => enviaAvisosAgricoles(unC12, {
    ...portC12,
    comprovaAmbit: () => {
      guards++;
      if (!current) throw scope;
    },
    enviaXat: async () => {
      current = false;
      throw original;
    }
  }));
  assertC12.equal(error.codi, 'AMBIT_CANVIAT');
  assertC12.ok(guards >= 4);
  assertC12.equal(error.cause.cause, original);
  assertC12.equal(error.cause.errorAmbit, scope);
  assertC12.equal(error.rebut.estatActual, 'sense-confirmacio');
});
test('guarda post-subscripció refusa abans d’enviar', async () => {
  let current = true,
    sends = 0;
  const error = await falladaC12(() => enviaAvisosAgricoles(unC12, {
    ...portC12,
    comprovaAmbit: () => current,
    subscripcioActiva: async () => {
      current = false;
      return subC12;
    },
    enviaXat: async () => {
      sends++;
    }
  }));
  assertC12.equal(sends, 0);
  assertC12.equal(error.codi, 'AMBIT');
  assertC12.equal(error.rebut.estatActual, 'no-enviat');
});
test('baixes comprovades es distingeixen dels ACK i del pendent', async () => {
  let queries = 0;
  const error = await falladaC12(() => enviaAvisosAgricoles(plaC12, {
    ...portC12,
    subscripcioActiva: async () => {
      if (++queries === 1) return {
        ...subC12,
        activa: false
      };
      throw new Error('later failure');
    }
  }));
  assertC12.deepEqual(error.rebut.baixes, [{
    clientId: plaC12.avisos[0].clientId,
    estat: 'baixa'
  }]);
  assertC12.deepEqual(error.rebut.confirmats, []);
  assertC12.equal(error.teConfirmacions, false);
});
test('no s’exposa text, àmbit o causa dins del rebut enumerable', async () => {
  const error = await falladaC12(() => enviaAvisosAgricoles(unC12, {
    ...portC12,
    enviaXat: async () => {
      throw new Error('PRIVATE_SERVER_TEXT');
    }
  }));
  const json = JSON.stringify(error.rebut);
  for (const secret of ['PRIVATE_SERVER_TEXT', 'Fixture sintètica', subC12.usuariId, subC12.pobleId, subC12.filId]) assertC12.equal(json.includes(secret), false);
  assertC12.equal(Object.keys(error).includes('cause'), false);
  assertC12.equal(error.message.includes('PRIVATE_SERVER_TEXT'), false);
});
test('rebut i totes les col·leccions públiques són immutables', async () => {
  const error = await falladaC12(() => enviaAvisosAgricoles(plaC12, {
    ...portC12,
    enviaXat: async () => {
      throw new Error('failure');
    }
  }));
  for (const v of [error.rebut, error.rebut.confirmats, error.rebut.baixes, error.rebut.noIntentats]) assertC12.equal(Object.isFrozen(v), true);
  assertC12.throws(() => error.rebut.noIntentats.push(idC12(90)), TypeError);
});
test('duplicat d’UUID refusa abans de qualsevol callback de subscripció o enviament', async () => {
  let effects = 0;
  const error = await falladaC12(() => enviaAvisosAgricoles({
    ...plaC12,
    avisos: [plaC12.avisos[0], {
      ...plaC12.avisos[0],
      text: 'divergent'
    }]
  }, {
    ...portC12,
    subscripcioActiva: async () => {
      effects++;
      return subC12;
    },
    enviaXat: async () => {
      effects++;
    }
  }));
  assertC12.equal(error.codi, 'AVIS_DUPLICAT');
  assertC12.equal(effects, 0);
});
test('mutar el pla després de començar no redirigix l’avís següent', async () => {
  const mutable = structuredClone(plaC12),
    calls = [];
  await enviaAvisosAgricoles(mutable, {
    ...portC12,
    enviaXat: async avis => {
      calls.push(avis);
      mutable.avisos[1].filId = idC12(91);
      mutable.avisos[1].text = 'CHANGED';
      return {
        id: avis.clientId
      };
    }
  });
  assertC12.equal(calls[1].filId, subC12.filId);
  assertC12.notEqual(calls[1].text, 'CHANGED');
});
test('throw síncron de transport també té rebut sense confirmació falsa', async () => {
  const original = Object.freeze(Object.assign(new Error('sync'), {
    code: 'TRANSPORT'
  }));
  const error = await falladaC12(() => enviaAvisosAgricoles(unC12, {
    ...portC12,
    enviaXat: () => {
      throw original;
    }
  }));
  assertC12.equal(error.cause, original);
  assertC12.equal(error.code, 'TRANSPORT');
  assertC12.equal(error.ackConfirmat, false);
  assertC12.equal(error.rebut.estatActual, 'sense-confirmacio');
});
test('pla buit conserva un èxit buit sense transports', async () => {
  let calls = 0;
  assertC12.deepEqual(await enviaAvisosAgricoles({
    ...plaC12,
    avisos: []
  }, {
    ...portC12,
    enviaXat: () => {
      calls++;
    }
  }), []);
  assertC12.equal(calls, 0);
});
test('TypeError conserva classe/codi numèric sense reutilitzar l’objecte original', async () => {
  const original = Object.freeze(Object.assign(new TypeError('PRIVATE_TYPE_MESSAGE'), {
    code: 407,
    codi: 'PORT_FALLIT'
  }));
  const error = await falladaC12(() => enviaAvisosAgricoles(unC12, {
    ...portC12,
    enviaXat: async () => {
      throw original;
    }
  }));
  assertC12.equal(error instanceof TypeError, true);
  assertC12.equal(error.code, 407);
  assertC12.equal(error.codi, 'PORT_FALLIT');
  assertC12.equal(error.cause, original);
  assertC12.notEqual(error, original);
  assertC12.equal(error.rebut.estatActual, 'sense-confirmacio');
});
test('DOMException nativa conserva classe/name/code i causa privada', async () => {
  const original = Object.freeze(new DOMException('PRIVATE_ABORT_MESSAGE', 'AbortError'));
  const error = await falladaC12(() => enviaAvisosAgricoles(unC12, {
    ...portC12,
    enviaXat: async () => {
      throw original;
    }
  }));
  assertC12.equal(error instanceof DOMException, true);
  assertC12.equal(error.name, 'AbortError');
  assertC12.equal(error.code, original.code);
  assertC12.equal(error.cause, original);
  assertC12.equal(JSON.stringify(error).includes('PRIVATE_ABORT_MESSAGE'), false);
});
for (const field of ['name', 'codi', 'code', 'constructor']) {
  test(`getter ${field} que llança no pot llevar el rebut de l’ACK previ`, async () => {
    let calls = 0,
      getters = 0;
    const original = new Error('PRIVATE_GETTER_MESSAGE');
    Object.defineProperty(original, field, {
      get() {
        getters++;
        throw new Error('PRIVATE_GETTER_FAILURE');
      }
    });
    Object.freeze(original);
    const error = await falladaC12(() => enviaAvisosAgricoles(plaC12, {
      ...portC12,
      enviaXat: async avis => {
        if (++calls === 1) return {
          id: avis.clientId
        };
        throw original;
      }
    }));
    assertC12.equal(getters, 0);
    assertC12.equal(error.teConfirmacions, true);
    assertC12.equal(error.cause, original);
    assertC12.deepEqual(error.rebut.confirmats, [{
      clientId: plaC12.avisos[0].clientId,
      estat: 'confirmat'
    }]);
    assertC12.equal(error.rebut.estatActual, 'sense-confirmacio');
    assertC12.equal(calls, 2);
  });
}
test('rebuig primitiu o proxy opac conserva sempre el rebut preparat', async () => {
  const opaque = new Proxy({}, {
    getOwnPropertyDescriptor() {
      throw new Error('descriptor');
    },
    getPrototypeOf() {
      throw new Error('prototype');
    }
  });
  for (const original of [null, undefined, 0, 'PRIVATE_STRING_REJECTION', opaque]) {
    const error = await falladaC12(() => enviaAvisosAgricoles(unC12, {
      ...portC12,
      enviaXat: async () => {
        throw original;
      }
    }));
    assertC12.equal(error.cause, original);
    assertC12.equal(error.codi, 'ENVIAMENT_FALLIT');
    assertC12.equal(error.rebut.estatActual, 'sense-confirmacio');
    assertC12.equal(error.message.includes('PRIVATE_STRING_REJECTION'), false);
  }
});
