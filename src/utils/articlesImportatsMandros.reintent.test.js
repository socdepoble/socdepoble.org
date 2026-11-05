/**
 * D-B4-4 (Onada R6, Bloc 4; Gauntlet del Node 0: Qwen 2.5 Coder 14B, Qwen 3 8B
 * i la IAIA MarIA) · El carregador mandrós dels articles importats: un
 * reintent torna a carregar de debò, el ganxo continua coherent quan itemId
 * canvia ràpid i un intent vell no xafa el d'ara. L'import() és un doble
 * (_reiniciaArticlesImportatsPerAProves): el de veres el prova
 * articlesImportatsMandros.test.js.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { CLAUS_ARTICLES_IMPORTATS } from '../data/taxonomia/indexArticlesImportats.js';
import {
  _reiniciaArticlesImportatsPerAProves,
  carregaArticlesImportats,
  estatArticleImportat,
  trobaArticleImportatComAPublicacio,
  useEstatArticleImportat,
} from './articlesImportatsMandros.js';

const [A, B] = [...CLAUS_ARTICLES_IMPORTATS];
const MODUL = Object.freeze({ trobaArticleImportatComAPublicacio: (clau) => ({ id: String(clau).trim(), doble: true }) });
function diferit() {
  let resol;
  let rebutja;
  const promesa = new Promise((ok, ko) => { resol = ok; rebutja = ko; });
  return { promesa, resol, rebutja };
}

afterEach(() => _reiniciaArticlesImportatsPerAProves());

test('dos claus diferents de l’índex per a les proves', () => {
  expect(A).toBeTruthy();
  expect(B).toBeTruthy();
  expect(A).not.toBe(B);
});

test('una fallada no es queda clavada: el reintent torna a fer import() i, mentre dura, és «carregant»', async () => {
  const importa = vi.fn().mockRejectedValueOnce(new Error('xarxa')).mockResolvedValueOnce(MODUL);
  _reiniciaArticlesImportatsPerAProves(importa);
  await expect(carregaArticlesImportats()).rejects.toThrow('xarxa');
  expect(estatArticleImportat(A)).toBe('error');
  expect(trobaArticleImportatComAPublicacio(A)).toBeNull();

  const reintent = carregaArticlesImportats();
  expect(estatArticleImportat(A)).toBe('carregant');
  await expect(reintent).resolves.toBe(MODUL);
  expect(importa).toHaveBeenCalledTimes(2);
  expect(estatArticleImportat(A)).toBeNull();
  expect(trobaArticleImportatComAPublicacio(A)).toEqual({ id: A, doble: true });
  // Ja carregat: cap import() més.
  await expect(carregaArticlesImportats()).resolves.toBe(MODUL);
  expect(importa).toHaveBeenCalledTimes(2);
});

test('un import que peta de manera síncrona és una promesa rebutjada, no una excepció', async () => {
  _reiniciaArticlesImportatsPerAProves(() => { throw new Error('síncron'); });
  let promesa;
  expect(() => { promesa = carregaArticlesImportats(); }).not.toThrow();
  await expect(promesa).rejects.toThrow('síncron');
  expect(estatArticleImportat(A)).toBe('error');
});

test('crides simultànies comparteixen un sol import()', async () => {
  const d = diferit();
  const importa = vi.fn(() => d.promesa);
  _reiniciaArticlesImportatsPerAProves(importa);
  const primera = carregaArticlesImportats();
  const segona = carregaArticlesImportats();
  expect(segona).toBe(primera);
  d.resol(MODUL);
  await expect(Promise.all([primera, segona])).resolves.toEqual([MODUL, MODUL]);
  expect(importa).toHaveBeenCalledTimes(1);
});

test('el ganxo: A → B → una clau que no és cap article → A, ràpid, amb una sola càrrega i coherent', async () => {
  const d = diferit();
  const importa = vi.fn(() => d.promesa);
  _reiniciaArticlesImportatsPerAProves(importa);
  const { result, rerender } = renderHook(({ id }) => useEstatArticleImportat(id), { initialProps: { id: A } });
  expect(result.current).toBe('carregant');
  rerender({ id: B });
  expect(result.current).toBe('carregant');
  rerender({ id: 'no-es-cap-article' });
  expect(result.current).toBeNull();
  rerender({ id: ` ${A} ` });
  expect(result.current).toBe('carregant');
  expect(importa).toHaveBeenCalledTimes(1);
  await act(async () => {
    d.resol(MODUL);
    await d.promesa;
  });
  expect(result.current).toBeNull();
  expect(trobaArticleImportatComAPublicacio(A)).toEqual({ id: A, doble: true });
  expect(importa).toHaveBeenCalledTimes(1);
});

test('després d’una fallada: la mateixa clau es queda en «error» sense bucle; una clau nova ho torna a provar', async () => {
  const importa = vi.fn()
    .mockRejectedValueOnce(new Error('xarxa'))
    .mockRejectedValueOnce(new Error('xarxa'))
    .mockResolvedValueOnce(MODUL);
  _reiniciaArticlesImportatsPerAProves(importa);
  const { result, rerender } = renderHook(({ id }) => useEstatArticleImportat(id), { initialProps: { id: A } });
  await waitFor(() => expect(result.current).toBe('error'));
  expect(importa).toHaveBeenCalledTimes(1);

  rerender({ id: A });
  await act(async () => {});
  expect(result.current).toBe('error');
  expect(importa).toHaveBeenCalledTimes(1);

  rerender({ id: B });
  await waitFor(() => expect(importa).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(result.current).toBe('error'));

  // Un reintent explícit (el «Reintentar» de la Revisió WP) torna a carregar i el ganxo ho veu.
  await act(async () => { await carregaArticlesImportats(); });
  expect(result.current).toBeNull();
  expect(importa).toHaveBeenCalledTimes(3);
});

test('un intent vell que arriba tard no xafa l’estat del d’ara', async () => {
  const vell = diferit();
  _reiniciaArticlesImportatsPerAProves(() => vell.promesa);
  const primer = carregaArticlesImportats();
  _reiniciaArticlesImportatsPerAProves(() => Promise.reject(new Error('nou')));
  await expect(carregaArticlesImportats()).rejects.toThrow('nou');
  vell.resol(MODUL);
  await expect(primer).resolves.toBe(MODUL);
  expect(estatArticleImportat(A)).toBe('error');
  expect(trobaArticleImportatComAPublicacio(A)).toBeNull();
});
