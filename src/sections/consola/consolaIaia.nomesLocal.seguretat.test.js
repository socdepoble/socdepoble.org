// @vitest-environment node
/* Ordre del Mestre (30-10-2026, B2) · Gauntlet 261030, f4b
   (f4b-fronteres-fora-del-precommit) · Les rutes de desenvolupament de
   /__iaia (consola.json, mapa.json, empaquetats.json i, des de B2,
   govern.json, que compila la matriu a partir del Llibre Mestre i del HEAD)
   descriuen la maquinària d'este ordinador. vite.config.js obri el servidor de
   desenvolupament a la xarxa local (server.host: true) i fs.deny n'aparta
   _wiki_de_poble: davant d'un altre ordinador de la xarxa, l'única barrera
   d'estes quatre rutes és local() de tooling/vite/consola-iaia.mjs. Fins ara
   només la vigilava tooling/vite/consola-iaia.test.mjs (node --test), que no
   executen ni el pre-commit (vitest.precommit.config.js i la llista de node de
   test:precommit) ni run-portes --nomes-portes. Esta prova munta els gestors
   del connector amb un servidor de mentides (cap port, cap xarxa, cap fitxer
   llegit en els casos rebutjats), tarda mil·lisegons i entra al pre-commit pel
   nom (*.seguretat.test.js); la guarda
   src/config/precommit.cobertura.seguretat.test.js vigila que no en torne a
   eixir. La resta de la ruta del Govern (JSON, errors, compilador, Vite de
   veres) es queda a tooling/vite/consola-iaia.test.mjs. */
import { describe, expect, test, vi } from 'vitest';
import consolaIaia, { RUTA_CONSOLA, RUTA_EMPAQUETATS, RUTA_GOVERN, RUTA_MAPA } from '../../../tooling/vite/consola-iaia.mjs';

const RUTES = [RUTA_CONSOLA, RUTA_MAPA, RUTA_EMPAQUETATS, RUTA_GOVERN];
const MATRIU = Object.freeze({ schema: 'sdp.govern.v1' });

/* Decisió del Mestre (31-10-2026) · consolaIaia() (vite.config.js) torna dos
   connectors: el de desenvolupament (les quatre rutes vives) i el del build
   (la instantània sanejada, estàtica). Ací es prova el de desenvolupament, el
   mateix objecte que registra vite.config.js. */
const connectorDev = (opcions) => consolaIaia(opcions).find((connector) => connector.apply === 'serve');

/* Els gestors que munta el connector, amb un compilador del Govern de mentides que compta les crides. */
function munta() {
  const compilador = vi.fn(async () => ({ recullGovern: async () => MATRIU }));
  const gestors = new Map();
  connectorDev({ arrelGovern: '/no/existix', compiladorGovern: compilador })
    .configureServer({ middlewares: { use: (ruta, gestor) => gestors.set(ruta, gestor) } });
  return { gestors, compilador };
}

/* Una petició i una resposta de mentides; torna la resposta quan el gestor l'acaba (o crida next). */
function demana(gestor, ruta, { method = 'GET', ip, headers = {} } = {}) {
  const res = { statusCode: 200, capcaleres: {}, cos: undefined, seguix: false };
  res.setHeader = (clau, valor) => { res.capcaleres[clau.toLowerCase()] = valor; };
  const fet = new Promise((resol) => {
    res.end = (cos) => { res.cos = cos; resol(res); };
    gestor({ method, url: ruta, headers, socket: { remoteAddress: ip } }, res, () => { res.seguix = true; resol(res); });
  });
  return fet;
}

/* Altres ordinadors de la xarxa local, IPv4 i IPv6; un sòcol ja tancat no diu d'on ve. Les
   capçaleres les escriu qui demana: cap no fa local una petició de fora. */
const DE_FORA = Object.freeze([
  { ip: '10.0.0.2' },
  { ip: '192.168.1.20' },
  { ip: '172.16.4.9' },
  { ip: '::ffff:192.168.1.20' },
  { ip: 'fe80::1' },
  { ip: 'fd00::7' },
  { ip: undefined },
  { ip: '192.168.1.20', headers: { host: 'localhost:3340', 'x-forwarded-for': '127.0.0.1', 'x-real-ip': '::1', forwarded: 'for=127.0.0.1' } }
]);
const LOCALS = Object.freeze(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

describe('/__iaia · només el mateix ordinador (local() de tooling/vite/consola-iaia.mjs)', () => {
  test('el connector munta les quatre rutes, i només en desenvolupament (el build no les coneix)', () => {
    expect(RUTES).toEqual(['/__iaia/consola.json', '/__iaia/mapa.json', '/__iaia/empaquetats.json', '/__iaia/govern.json']);
    expect([...munta().gestors.keys()]).toEqual(RUTES);
    // Les rutes vives, només el de desenvolupament; el del build no munta cap servidor (ni el de preview).
    const connectors = consolaIaia();
    expect(connectors.map((c) => [c.name, c.apply])).toEqual([['sdp:consola-iaia', 'serve'], ['sdp:consola-instantania', 'build']]);
    expect(connectors.filter((c) => c.configureServer || c.configurePreviewServer).map((c) => c.name)).toEqual(['sdp:consola-iaia']);
  });

  test.each(RUTES)('%s: des d’un altre ordinador de la xarxa, 403 i res més (ni es compila el Llibre Mestre)', async (ruta) => {
    const { gestors, compilador } = munta();
    for (const cas of DE_FORA) {
      const res = await demana(gestors.get(ruta), ruta, cas);
      expect([cas, res.statusCode, res.cos, res.seguix]).toEqual([cas, 403, 'Forbidden', false]);
    }
    expect(compilador).not.toHaveBeenCalled();
  });

  test.each(RUTES)('%s: del mateix ordinador, només GET', async (ruta) => {
    const { gestors, compilador } = munta();
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      for (const ip of LOCALS) {
        const res = await demana(gestors.get(ruta), ruta, { method, ip });
        expect([method, ip, res.statusCode, res.cos, res.seguix]).toEqual([method, ip, 403, 'Forbidden', false]);
      }
    }
    expect(compilador).not.toHaveBeenCalled();
  });

  test('la guarda distingix: un GET del mateix ordinador (IPv4, IPv6 i IPv4 dins d’IPv6) arriba a la matriu del Govern', async () => {
    const { gestors, compilador } = munta();
    for (const ip of LOCALS) {
      const res = await demana(gestors.get(RUTA_GOVERN), RUTA_GOVERN, { ip });
      expect([ip, res.statusCode, res.capcaleres['content-type'], res.capcaleres['cache-control']])
        .toEqual([ip, 200, 'application/json; charset=utf-8', 'no-store']);
      expect(JSON.parse(res.cos)).toEqual(MATRIU);
    }
    expect(compilador).toHaveBeenCalledTimes(LOCALS.length);
  });
});
