import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  AGENT_USUARI, CATALEG, ESPAI_ENTRE_PETICIONS_MS, MAXIM_VALOR, creaLectorViquipedia, partixTitols
} from './client.js';

/* Onada 5 (F5) · El client de Wikimedia amb fetch fals i rellotge fals: cap
   petició de veres. Les respostes són les captures del 261009. */
const DIR = resolve(process.cwd(), 'tests/frontissa/fixtures/viquipedia');
const captura = (nom) => JSON.parse(readFileSync(resolve(DIR, `${nom}.json`), 'utf8'));
const resposta = (cos, { status = 200, headers = {} } = {}) => new Response(cos === null ? null : JSON.stringify(cos), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
});
const SELLA = captura('cerca-sella');
const MAXLAG = captura('error-maxlag');
const cercaDe = (nom) => ({ srsearch: `${nom} haswbstatement:P31=Q2074737` });
const parametres = (url) => [...new URL(url).searchParams].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

let lector;
let fetchImpl;
const nou = (opcions = {}) => {
  lector = creaLectorViquipedia({ fetchImpl, atzar: () => 0, ...opcions });
  return lector;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('transport', () => {
  test('GET sense credencials ni redireccions, amb Api-User-Agent i els paràmetres de la captura', async () => {
    fetchImpl = vi.fn(async () => resposta(SELLA.body));
    const resultat = nou().llig('cercaMunicipi', cercaDe('Sella'));
    await vi.advanceTimersByTimeAsync(0);
    expect(await resultat).toEqual(['Q985137']);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(parametres(url)).toEqual(parametres(SELLA.url));
    expect(new URL(url).origin).toBe('https://www.wikidata.org');
    expect(init).toMatchObject({ method: 'GET', credentials: 'omit', redirect: 'error' });
    expect(init.headers).toEqual({ Accept: 'application/json', 'Api-User-Agent': AGENT_USUARI });
    expect(AGENT_USUARI).toMatch(/^SocDePoble\/\d+\.\d+ \(https:\/\/socdepoble\.org\//);
  });

  test('cada recurs del catàleg es fonamenta en una captura versionada', () => {
    for (const recurs of Object.values(CATALEG)) {
      const fitxer = resolve(DIR, `${recurs.captureId.replace(/^viquipedia-/, '').replace(/-261009$/, '')}.json`);
      expect(existsSync(fitxer)).toBe(true);
      expect(JSON.parse(readFileSync(fitxer, 'utf8')).captureId).toBe(recurs.captureId);
    }
  });

  test('recursos i entrades fora del catàleg no ixen mai', async () => {
    fetchImpl = vi.fn();
    nou();
    await expect(lector.llig('https://evil.example/', { titles: 'x' })).rejects.toMatchObject({ code: 'UNKNOWN_RESOURCE' });
    await expect(lector.llig('article', { titles: 'x', origin: 'https://evil.example' })).rejects.toMatchObject({ code: 'INVALID_QUERY' });
    await expect(lector.llig('article', { titles: '   ' })).rejects.toMatchObject({ code: 'INVALID_QUERY' });
    await expect(lector.llig('article', {})).rejects.toMatchObject({ code: 'INVALID_QUERY' });
    await expect(lector.llig('article', { titles: 'x'.repeat(MAXIM_VALOR + 1) })).rejects.toMatchObject({ code: 'INVALID_QUERY' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('reintents', () => {
  test('429 amb Retry-After 2: espera els 2 s que demana el servidor i torna a provar', async () => {
    fetchImpl = vi.fn()
      .mockResolvedValueOnce(resposta({}, { status: 429, headers: { 'retry-after': '2' } }))
      .mockResolvedValueOnce(resposta(SELLA.body));
    const resultat = nou().llig('cercaMunicipi', cercaDe('Sella'));
    await vi.advanceTimersByTimeAsync(1999);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(await resultat).toEqual(['Q985137']);
  });

  test('503 continu: quatre intents (1 + 3 reintents a 1, 2 i 4 s) i UNAVAILABLE, cap cinquè', async () => {
    fetchImpl = vi.fn(async () => resposta({}, { status: 503 }));
    const resultat = nou().llig('cercaMunicipi', cercaDe('Sella')).catch((error) => error);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(4000);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(await resultat).toMatchObject({ code: 'UNAVAILABLE', status: 503 });
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  test('maxlag (HTTP 200 amb MediaWiki-API-Error, la resposta capturada) reintenta i respecta Retry-After', async () => {
    fetchImpl = vi.fn()
      .mockResolvedValueOnce(resposta(MAXLAG.body, { status: MAXLAG.status, headers: MAXLAG.headers }))
      .mockResolvedValueOnce(resposta(SELLA.body));
    const resultat = nou().llig('cercaMunicipi', cercaDe('Sella'));
    await vi.advanceTimersByTimeAsync(4999);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(await resultat).toEqual(['Q985137']);
  });

  test('un Retry-After desmesurat es fita a 10 s', async () => {
    fetchImpl = vi.fn()
      .mockResolvedValueOnce(resposta({}, { status: 503, headers: { 'retry-after': '3600' } }))
      .mockResolvedValueOnce(resposta(SELLA.body));
    const resultat = nou().llig('cercaMunicipi', cercaDe('Sella'));
    await vi.advanceTimersByTimeAsync(9999);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await resultat).toEqual(['Q985137']);
  });

  test('una xarxa caiguda es reintenta', async () => {
    fetchImpl = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(resposta(SELLA.body));
    const resultat = nou().llig('cercaMunicipi', cercaDe('Sella'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(await resultat).toEqual(['Q985137']);
  });

  test('un 404, un JSON d’error o una forma estranya no es reintenten', async () => {
    for (const [cos, status, code] of [[{}, 404, 'UNAVAILABLE'], [{ error: { code: 'badvalue' } }, 200, 'INVALID_PAYLOAD']]) {
      fetchImpl = vi.fn(async () => resposta(cos, { status }));
      const resultat = nou().llig('cercaMunicipi', cercaDe('Sella')).catch((error) => error);
      await vi.advanceTimersByTimeAsync(20000);
      expect(await resultat).toMatchObject({ code });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
  });

  test('una cancel·lació és CANCELLED i no es reintenta; amb el senyal ja avortat, ni s’intenta', async () => {
    fetchImpl = vi.fn((_url, { signal }) => new Promise((_resol, rebutja) => {
      signal.addEventListener('abort', () => rebutja(new DOMException('Abort', 'AbortError')));
    }));
    const controlador = new AbortController();
    const resultat = nou().llig('cercaMunicipi', cercaDe('Sella'), { signal: controlador.signal }).catch((error) => error);
    await vi.advanceTimersByTimeAsync(0);
    controlador.abort();
    expect(await resultat).toMatchObject({ code: 'CANCELLED' });
    await vi.advanceTimersByTimeAsync(20000);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const avortat = new AbortController();
    avortat.abort();
    await expect(lector.llig('cercaMunicipi', cercaDe('Relleu'), { signal: avortat.signal })).rejects.toMatchObject({ code: 'CANCELLED' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('cua i memòria', () => {
  test('mai dues peticions vives alhora i un respir de 250 ms entre una i la següent', async () => {
    let vives = 0;
    let maxim = 0;
    const trams = [];
    fetchImpl = vi.fn(() => {
      const inici = Date.now();
      vives += 1;
      maxim = Math.max(maxim, vives);
      return new Promise((resol) => setTimeout(() => {
        vives -= 1;
        trams.push([inici, Date.now()]);
        resol(resposta(SELLA.body));
      }, 100));
    });
    nou();
    const resultats = Promise.all(['Sella', 'Relleu', 'Orxeta'].map((nom) => lector.llig('cercaMunicipi', cercaDe(nom))));
    await vi.advanceTimersByTimeAsync(2000);
    await resultats;
    expect(maxim).toBe(1);
    expect(trams).toHaveLength(3);
    for (let i = 1; i < trams.length; i += 1) {
      expect(trams[i][0] - trams[i - 1][1]).toBeGreaterThanOrEqual(ESPAI_ENTRE_PETICIONS_MS);
    }
  });

  test('dues crides iguals alhora fan una sola petició, i la memòria de sessió estalvia la tercera', async () => {
    fetchImpl = vi.fn(async () => resposta(SELLA.body));
    nou();
    const [a, b] = await Promise.all([
      lector.llig('cercaMunicipi', cercaDe('Sella')),
      lector.llig('cercaMunicipi', cercaDe('Sella'))
    ]);
    expect(a).toBe(b);
    expect(await lector.llig('cercaMunicipi', cercaDe('Sella'))).toBe(a);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test('si un dels dos interessats cancel·la, l’altre rep la resposta de la mateixa petició', async () => {
    let resol;
    fetchImpl = vi.fn(() => new Promise((r) => { resol = r; }));
    nou();
    const controlador = new AbortController();
    const primer = lector.llig('cercaMunicipi', cercaDe('Sella'), { signal: controlador.signal }).catch((error) => error);
    const segon = lector.llig('cercaMunicipi', cercaDe('Sella'));
    await vi.advanceTimersByTimeAsync(0);
    controlador.abort();
    expect(await primer).toMatchObject({ code: 'CANCELLED' });
    resol(resposta(SELLA.body));
    expect(await segon).toEqual(['Q985137']);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test('qui arriba quan l’últim interessat ja ha cancel·lat no hereta la petició avortada: en fa una de nova', async () => {
    fetchImpl = vi.fn((_url, { signal }) => new Promise((resol, rebutja) => {
      signal.addEventListener('abort', () => rebutja(new DOMException('Abort', 'AbortError')));
      setTimeout(() => resol(resposta(SELLA.body)), 100);
    }));
    nou();
    const controlador = new AbortController();
    const primer = lector.llig('cercaMunicipi', cercaDe('Sella'), { signal: controlador.signal }).catch((error) => error);
    await vi.advanceTimersByTimeAsync(0);
    controlador.abort();
    const segon = lector.llig('cercaMunicipi', cercaDe('Sella')).catch((error) => error);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await primer).toMatchObject({ code: 'CANCELLED' });
    expect(await segon).toEqual(['Q985137']);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test('un error no es guarda a la memòria: la crida següent ho torna a provar', async () => {
    fetchImpl = vi.fn()
      .mockResolvedValueOnce(resposta({}, { status: 404 }))
      .mockResolvedValueOnce(resposta(SELLA.body));
    nou();
    await expect(lector.llig('cercaMunicipi', cercaDe('Sella'))).rejects.toMatchObject({ code: 'UNAVAILABLE', status: 404 });
    const resultat = lector.llig('cercaMunicipi', cercaDe('Sella'));
    await vi.advanceTimersByTimeAsync(ESPAI_ENTRE_PETICIONS_MS);
    expect(await resultat).toEqual(['Q985137']);
  });
});

describe('partixTitols', () => {
  test('grups de com a molt 512 caràcters, en ordre i sense perdre cap títol que hi càpiga', () => {
    const titols = Array.from({ length: 30 }, (_, i) => `File:Foto ${String(i).padStart(2, '0')} ${'x'.repeat(50)}.jpg`);
    const grups = partixTitols([...titols, `File:${'y'.repeat(600)}.jpg`]);
    expect(grups.length).toBeGreaterThan(1);
    for (const grup of grups) expect(grup.length).toBeLessThanOrEqual(MAXIM_VALOR);
    expect(grups.join('|').split('|')).toEqual(titols);
  });

  test('com a molt 50 títols per petició', () => {
    const titols = Array.from({ length: 60 }, (_, i) => `F:${i}`);
    expect(partixTitols(titols).map((grup) => grup.split('|').length)).toEqual([50, 10]);
  });
});
