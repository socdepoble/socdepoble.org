/* Traductor Sobirà (ordre del Mestre, 260930 · via B) · El client neutre del
   servei de traducció: el contracte acordat amb Codex (auditoria 260930_2150,
   ronda D1), la validació de la resposta i els errors tipats. */
import { describe, expect, test, vi } from 'vitest';
import {
  CODI_TRADUCCIO, ErrorTraductor, LIMITS_TRADUCCIO, LLENGUES_TRADUCCIO, bytesDe, caractersDe,
  creaTraductor, partixEnLots, partixText, tradueixTot, urlDeServei
} from './traductor.js';

const URL_SERVEI = '/wp-json/socdepoble/v1/traduir';
const resposta = (status, cos) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => { if (cos instanceof Error) throw cos; return cos; },
});
const fetchQueTorna = (status, cos) => vi.fn(async () => resposta(status, cos));
const errorDe = async (promesa) => { try { await promesa; } catch (error) { return error; } throw new Error('no ha fallat'); };

describe('contracte de la petició', () => {
  test('un sol lot: POST JSON amb textos, desti, origen CA i format; sense galetes ni nonce (esmena 1 de Codex)', async () => {
    const fetch = fetchQueTorna(200, { traduccions: ['Hola', '¿Qué tal?'], origen: 'CA', desti: 'ES', cache: false });
    const { traduccions, cache } = await creaTraductor({ url: URL_SERVEI, fetch }).tradueix(['Hola', 'Què tal?'], 'ES');
    expect(traduccions).toEqual(['Hola', '¿Qué tal?']);
    expect(cache).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [adreca, opcions] = fetch.mock.calls[0];
    expect(adreca).toBe(`${window.location.origin}${URL_SERVEI}`);
    expect(opcions.method).toBe('POST');
    expect(opcions.credentials).toBe('omit');
    expect(opcions.headers).toEqual({ 'Content-Type': 'application/json', Accept: 'application/json' });
    expect(Object.keys(opcions.headers).map((nom) => nom.toLowerCase())).not.toContain('x-wp-nonce');
    expect(JSON.parse(opcions.body)).toEqual({ textos: ['Hola', 'Què tal?'], desti: 'ES', origen: 'CA', format: 'text' });
  });

  test('la llista tancada de destins: ES, EN-GB, FR i DE; qualsevol altre no ix de la pàgina', async () => {
    expect(LLENGUES_TRADUCCIO.map((llengua) => llengua.codi)).toEqual(['ES', 'EN-GB', 'FR', 'DE']);
    const fetch = fetchQueTorna(200, { traduccions: ['x'] });
    const traductor = creaTraductor({ url: URL_SERVEI, fetch });
    for (const desti of ['CA', 'EN', 'es', 'IT', '']) {
      expect((await errorDe(traductor.tradueix(['x'], desti))).codi).toBe(CODI_TRADUCCIO.PETICIO_INVALIDA);
    }
    expect((await errorDe(traductor.tradueix([], 'ES'))).codi).toBe(CODI_TRADUCCIO.PETICIO_INVALIDA);
    expect((await errorDe(traductor.tradueix([3], 'ES'))).codi).toBe(CODI_TRADUCCIO.PETICIO_INVALIDA);
    expect((await errorDe(traductor.tradueix(['x'], 'ES', { format: 'markdown' }))).codi).toBe(CODI_TRADUCCIO.PETICIO_INVALIDA);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('sense URL, o amb una URL d’un altre origen, el servei no està disponible i no es fa cap petició', async () => {
    const fetch = vi.fn();
    for (const url of [undefined, '', '   ', 'https://api.deepl.com/v2/translate', '//altre.example/traduir', 'javascript:alert(1)', `http://usuari:clau@${window.location.host}/x`]) {
      const traductor = creaTraductor({ url, fetch });
      expect(traductor.disponible).toBe(false);
      const error = await errorDe(traductor.tradueix(['Hola'], 'ES'));
      expect(error).toBeInstanceOf(ErrorTraductor);
      expect(error.codi).toBe(CODI_TRADUCCIO.NO_DISPONIBLE);
    }
    expect(fetch).not.toHaveBeenCalled();
    expect(urlDeServei(`${window.location.origin}/wp-json/x`)).toBe(`${window.location.origin}/wp-json/x`);
  });
});

describe('validació de la resposta', () => {
  test('una resposta amb una altra longitud, amb no-cadenes o amb un altre destí és invàlida', async () => {
    const dolentes = [
      { traduccions: ['només una'] },
      { traduccions: ['a', 2] },
      { traduccions: 'a,b' },
      { traduccions: ['a', 'b'], desti: 'FR' },
      null,
      new SyntaxError('no és JSON'),
    ];
    for (const cos of dolentes) {
      const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch: fetchQueTorna(200, cos) }).tradueix(['a', 'b'], 'ES'));
      expect(error.codi).toBe(CODI_TRADUCCIO.RESPOSTA_INVALIDA);
    }
  });
});

describe('errors tipats', () => {
  test('un error de WP REST porta l’estat i el codi del servidor, mai el seu text', async () => {
    const fetch = fetchQueTorna(429, { code: 'sdp_traduccio_limit', message: 'Translation request could not be completed.', data: { status: 429 } });
    const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch }).tradueix(['Hola'], 'ES'));
    expect(error).toBeInstanceOf(ErrorTraductor);
    expect(error.codi).toBe(CODI_TRADUCCIO.SERVIDOR);
    expect(error.status).toBe(429);
    expect(error.codiServidor).toBe('sdp_traduccio_limit');
    expect(error.message).not.toMatch(/Translation request/);
  });

  test('una pàgina d’error sense JSON (un intermediari) continua sent un error del servidor, sense codi', async () => {
    const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch: fetchQueTorna(502, new SyntaxError('<html>')) }).tradueix(['Hola'], 'ES'));
    expect(error.codi).toBe(CODI_TRADUCCIO.SERVIDOR);
    expect(error.status).toBe(502);
    expect(error.codiServidor).toBeNull();
  });

  test('la xarxa caiguda és INABASTABLE (estat 0) i un avortament és CANCELLADA', async () => {
    const caiguda = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch: caiguda }).tradueix(['Hola'], 'ES'));
    expect(error.codi).toBe(CODI_TRADUCCIO.INABASTABLE);
    expect(error.status).toBe(0);
    const control = new AbortController();
    const avortat = vi.fn(async () => { control.abort(); throw new DOMException('abort', 'AbortError'); });
    const cancel = await errorDe(creaTraductor({ url: URL_SERVEI, fetch: avortat }).tradueix(['Hola'], 'ES', { signal: control.signal }));
    expect(cancel.codi).toBe(CODI_TRADUCCIO.CANCELLADA);
    expect(avortat.mock.calls[0][1].signal).toBe(control.signal);
  });
});

describe('lots dins dels límits del servidor', () => {
  test('caràcters Unicode i bytes UTF-8 com els compta el servidor', () => {
    expect(caractersDe('Açò 🍅')).toBe(5);
    expect(bytesDe('Açò 🍅')).toBe(1 + 2 + 2 + 1 + 4);
  });

  test('els lots respecten 50 textos i 5000 caràcters, en ordre', () => {
    const cinquanta1 = Array.from({ length: 51 }, (_, i) => `t${i}`);
    const lots = partixEnLots(cinquanta1);
    expect(lots.map((lot) => lot.length)).toEqual([50, 1]);
    expect(lots.flat()).toEqual(cinquanta1);
    const llargs = ['a'.repeat(3000), 'b'.repeat(3000)];
    expect(partixEnLots(llargs)).toEqual([[llargs[0]], [llargs[1]]]);
    expect(partixEnLots(['c'.repeat(LIMITS_TRADUCCIO.caracters + 1)])).toBeNull();
  });

  test('un text massa llarg es parteix en espais i es torna a ajuntar', async () => {
    const paraula = 'pedra ';
    const llarg = paraula.repeat(1200).trim();
    const trossos = partixText(llarg, 5000);
    expect(trossos.length).toBe(2);
    expect(trossos.every((tros) => caractersDe(tros) <= 5000)).toBe(true);
    expect(trossos.join('')).toBe(llarg);
    const fetch = vi.fn(async (_, { body }) => resposta(200, { traduccions: JSON.parse(body).textos.map((t) => t.toUpperCase()) }));
    const traduccions = await tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), ['Títol', llarg], 'ES');
    // Títol (5) + primer tros (4998) passen de 5000: tres lots, un darrere de l'altre.
    expect(fetch.mock.calls.map(([, { body }]) => JSON.parse(body).textos.length)).toEqual([1, 1, 1]);
    expect(traduccions).toEqual(['TÍTOL', llarg.toUpperCase()]);
  });

  test('més lots dels permesos: MASSA_LLARGA sense cap petició', async () => {
    const fetch = vi.fn();
    const textos = Array.from({ length: 5 }, () => 'x'.repeat(4000));
    const error = await errorDe(tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), textos, 'ES'));
    expect(error.codi).toBe(CODI_TRADUCCIO.MASSA_LLARGA);
    expect(fetch).not.toHaveBeenCalled();
  });

  /* Ronda C9-2 · 4 lots de 5000 caràcters en deixaven passar 20000, i el
     servidor en dona 10000 al dia per a tot el poble: una pàgina entre els dos
     buidava el pressupost i fallava a mitges. */
  test('una pàgina de més caràcters que el pressupost diari: MASSA_LLARGA sense cap petició', async () => {
    const fetch = vi.fn();
    const textos = ['Títol', 'x'.repeat(LIMITS_TRADUCCIO.caractersPagina)];
    const error = await errorDe(tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), textos, 'ES'));
    expect(error.codi).toBe(CODI_TRADUCCIO.MASSA_LLARGA);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('la primera fallada ho para tot: cap segona petició', async () => {
    const fetch = vi.fn(async () => resposta(503, { code: 'sdp_traduccio_ocupada' }));
    const error = await errorDe(tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), ['a'.repeat(3000), 'b'.repeat(3000)], 'FR'));
    expect(error.codiServidor).toBe('sdp_traduccio_ocupada');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
