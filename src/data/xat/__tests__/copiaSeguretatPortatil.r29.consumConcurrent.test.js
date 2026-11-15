import { expect, test } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  CODI_QR_INVALID,
  creaOfertaTraspasLocalQr,
  creaRespostaTraspasLocalQr,
  generaParellaEfimeraTraspas,
  validaOfertaTraspasLocalQr,
} from '../copiaSeguretatPortatil.js';

const ARA = 1_790_000_000_000;
const USUARI = 'persona-fixture';
const POBLE = 'poble-fixture';
const empremta = Array.from({ length: 32 }, () => '10').join(':');
const sdpOffer = `v=0\r\na=fingerprint:sha-256 ${empremta}\r\n`;

async function ofertaNova() {
  const parella = await generaParellaEfimeraTraspas();
  return creaOfertaTraspasLocalQr({
    usuariId: USUARI, tenantId: POBLE, sdpOffer,
    clauPublicaEfimeraJwk: parella.clauPublicaJwk, araMs: ARA,
  });
}

test.each(['registre injectat', 'registre de la instància'])('R29: el consum únic del QR es conserva amb validacions concurrents (%s)', async mode => {
  const oferta = await ofertaNova();
  const sessionsConsumides = mode === 'registre injectat' ? new Set() : undefined;
  const opcions = { usuariIdEsperat: USUARI, tenantIdEsperat: POBLE, araMs: ARA + 1000, sessionsConsumides };

  const resultats = await Promise.allSettled(Array.from({ length: 4 }, () => validaOfertaTraspasLocalQr(oferta, opcions)));
  expect(resultats.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  const rebutjades = resultats.filter(r => r.status === 'rejected');
  expect(rebutjades).toHaveLength(3);
  for (const resultat of rebutjades) expect(resultat.reason).toMatchObject({ codi: CODI_QR_INVALID, motiu: 'reutilitzat' });
  await expect(validaOfertaTraspasLocalQr(oferta, opcions)).rejects.toMatchObject({ codi: CODI_QR_INVALID, motiu: 'reutilitzat' });
});

function digestPendent() {
  let continua;
  const espera = new Promise(resolve => { continua = resolve; });
  const cripto = {
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    subtle: new Proxy(webcrypto.subtle, { get(target, name) {
      if (name === 'digest') return async (...args) => { await espera; return target.digest(...args); };
      const membre = Reflect.get(target, name, target);
      return typeof membre === 'function' ? membre.bind(target) : membre;
    } }),
  };
  return { cripto, continua: () => continua() };
}

test('R29: mutar l’objecte de l’oferta durant el digest no canvia la identitat validada i consumida', async () => {
  const oferta = await ofertaNova();
  const original = { ...oferta };
  const { cripto, continua } = digestPendent();
  const sessionsConsumides = new Set();
  const opcions = { usuariIdEsperat: USUARI, tenantIdEsperat: POBLE, araMs: ARA + 1000, sessionsConsumides, cripto };
  const pendent = validaOfertaTraspasLocalQr(oferta, opcions);
  oferta.sessioId = '11111111111111111111111111111111';
  oferta.modeDispositiu = 'valor-modificat';
  continua();
  await expect(pendent).resolves.toMatchObject({ ok: true, sessioId: original.sessioId, modeDispositiu: original.modeDispositiu });
  expect([...sessionsConsumides]).toEqual([original.sessioId]);
  await expect(validaOfertaTraspasLocalQr(original, opcions)).rejects.toMatchObject({ codi: CODI_QR_INVALID, motiu: 'reutilitzat' });
});

test('R29: la resposta conserva també la JWK i la sessió de l’oferta que es va validar', async () => {
  const oferta = await ofertaNova();
  const original = { ...oferta, clauPublicaEfimeraJwk: { ...oferta.clauPublicaEfimeraJwk } };
  const respon = await generaParellaEfimeraTraspas();
  const { cripto, continua } = digestPendent();
  const pendent = creaRespostaTraspasLocalQr(oferta, {
    usuariId: USUARI, tenantId: POBLE, araMs: ARA + 1000,
    sdpAnswer: `v=0\r\na=fingerprint:sha-256 ${Array(32).fill('20').join(':')}\r\n`,
    clauPublicaEfimeraJwk: respon.clauPublicaJwk, sessionsConsumides: new Set(), cripto,
  });
  oferta.sessioId = '11111111111111111111111111111111';
  Object.assign(oferta.clauPublicaEfimeraJwk, respon.clauPublicaJwk);
  continua();
  await expect(pendent).resolves.toMatchObject({ sessioId: original.sessioId, empremtaOferta: original.empremtaSha256 });
});

test.each(['oferta', 'jwk'])('R29: un accessor de %s no s’executa com a efecte de validar dades QR', async lloc => {
  const oferta = await ofertaNova();
  const objecte = lloc === 'oferta' ? oferta : oferta.clauPublicaEfimeraJwk;
  const clau = lloc === 'oferta' ? 'sessioId' : 'x';
  let lectures = 0;
  const valor = objecte[clau];
  Object.defineProperty(objecte, clau, { enumerable: true, configurable: true, get: () => { lectures += 1; return valor; } });
  await expect(validaOfertaTraspasLocalQr(oferta, { usuariIdEsperat: USUARI, tenantIdEsperat: POBLE, araMs: ARA + 1000, sessionsConsumides: new Set() }))
    .rejects.toMatchObject({ codi: CODI_QR_INVALID, motiu: 'esquema' });
  expect(lectures).toBe(0);
});

test('R29: una oferta que no verifica no consumix la sessió vàlida concurrent', async () => {
  const oferta = await ofertaNova();
  const opcions = { usuariIdEsperat: USUARI, tenantIdEsperat: POBLE, araMs: ARA + 1000, sessionsConsumides: new Set() };
  const alterada = { ...oferta, sdpOffer: `${oferta.sdpOffer}a=sendrecv\r\n` };
  const resultats = await Promise.allSettled([
    validaOfertaTraspasLocalQr(alterada, opcions),
    validaOfertaTraspasLocalQr(oferta, opcions),
  ]);
  expect(resultats[0]).toMatchObject({ status: 'rejected', reason: { codi: CODI_QR_INVALID, motiu: 'empremta' } });
  expect(resultats[1]).toMatchObject({ status: 'fulfilled', value: { ok: true } });
});
