/* T47b (ordre del Mestre, 260928) · La ploma a Notes: de l'estat del gestor a
   la prop `estatDesament` de la barra taronja. */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { GlobalSaveManager } from './GlobalSaveManager.js';
import { DETALL_PESTANYA, estatPerAlEditor, useEstatDesamentNota } from './useEstatDesamentNota.js';

afterEach(cleanup);

function gestor() {
  const records = new Map();
  const persist = async (key, transform) => {
    const result = transform(structuredClone(records.get(key) || {}));
    records.set(key, structuredClone(result));
    return result;
  };
  return new GlobalSaveManager({ persist, delay: 60000, finestra: new EventTarget() });
}

test('el hook seguix la nota: net, pendent en escriure i net quan el servidor ho confirma', async () => {
  const g = gestor();
  const { result } = renderHook(() => useEstatDesamentNota('ambit', 'n', g));
  expect(result.current.estat).toBe('net');
  act(() => { void g.enqueue('ambit', 'n', 'title', 'Hort', () => ({ revision: 1 }), async (_id, p, r) => ({ ...p, revision: r + 1 }), vi.fn(), vi.fn()); });
  expect(result.current.estat).toBe('pendent');
  await act(async () => { await g.flush('ambit', 'n'); });
  expect(result.current.estat).toBe('net');
});

test('sense àmbit o sense nota, sempre net (no hi ha res a desar)', () => {
  const g = gestor();
  void g.enqueue('ambit', 'n', 'title', 'Hort', () => ({ revision: 1 }), vi.fn(), vi.fn(), vi.fn());
  expect(renderHook(() => useEstatDesamentNota(undefined, 'n', g)).result.current.estat).toBe('net');
  expect(renderHook(() => useEstatDesamentNota('ambit', null, g)).result.current.estat).toBe('net');
});

test('estatPerAlEditor diu la veritat de cada estat, en valencià i sense prometre res que no passa', () => {
  expect(estatPerAlEditor()).toEqual({ estat: 'net', detall: '' });
  expect(estatPerAlEditor({ estat: 'pendent', problema: null, quarantena: [] })).toEqual({ estat: 'pendent', detall: '' });
  expect(estatPerAlEditor({ estat: 'enviant', problema: null, quarantena: [] })).toEqual({ estat: 'enviant', detall: '' });
  // Dins de Notes la persona és dins: 'sessio' és la finestra d'una renovació.
  expect(estatPerAlEditor({ estat: 'sessio', problema: { tipus: 'sessio' }, quarantena: [] })).toEqual({ estat: 'pendent', detall: '' });

  const xarxa = estatPerAlEditor({ estat: 'error', problema: { tipus: 'temporal', missatge: 'sense connexió', intents: 2 }, quarantena: [] });
  expect(xarxa.estat).toBe('error');
  expect(xarxa.detall).toBe('No s’ha pogut desar (sense connexió). Es tornarà a provar sol; mentrestant, el canvi es guarda en este dispositiu.');

  expect(estatPerAlEditor({ estat: 'error', problema: { tipus: 'conflicte' }, quarantena: [] }).detall)
    .toContain('versió més recent');
  expect(estatPerAlEditor({ estat: 'error', problema: { tipus: 'local', missatge: 'Només en esta pestanya.' }, quarantena: [] }))
    .toEqual({ estat: 'error', detall: 'Només en esta pestanya.' });
  expect(estatPerAlEditor({ estat: 'error', problema: { tipus: 'servidor', missatge: 'no tens permís per a canviar este camp' }, quarantena: [] }).detall)
    .toBe('No s’ha pogut desar: no tens permís per a canviar este camp. El canvi es guarda en este dispositiu.');

  expect(estatPerAlEditor({ estat: 'error', problema: null, quarantena: ['icon'] }).detall)
    .toBe('El servidor encara no pot guardar l’emoticona: es guarda en este dispositiu.');
  // T40 · la data de publicació té nom de persona, no el del camp intern.
  expect(estatPerAlEditor({ estat: 'error', problema: null, quarantena: ['icon', 'publishDate', 'tags'] }).detall)
    .toBe('El servidor encara no pot guardar l’emoticona, la data de publicació i les etiquetes: es guarda en este dispositiu.');
  /* T47 (ordre del Mestre, 260928) · La ploma no diu mai el nom intern d'un
     camp: els de text tenen nom de persona i un de desconegut es compta. */
  expect(estatPerAlEditor({ estat: 'error', problema: null, quarantena: ['title', 'subtitle', 'lead', 'content'] }).detall)
    .toBe('El servidor encara no pot guardar el títol, el subtítol, l’entradilla i el cos: es guarda en este dispositiu.');
  expect(estatPerAlEditor({ estat: 'error', problema: null, quarantena: ['resum'] }).detall)
    .toBe('El servidor encara no pot guardar un camp de la nota: es guarda en este dispositiu.');
  expect(estatPerAlEditor({ estat: 'error', problema: null, quarantena: ['icon', 'resum', 'altre'] }).detall)
    .toBe('El servidor encara no pot guardar l’emoticona i altres camps: es guarda en este dispositiu.');
});

test('T47 · sense còpia al dispositiu (pestanya), la ploma no promet cap dispositiu', () => {
  expect(estatPerAlEditor({ estat: 'pendent', problema: null, quarantena: [], pestanya: true }))
    .toEqual({ estat: 'pendent', detall: DETALL_PESTANYA });
  expect(estatPerAlEditor({ estat: 'enviant', problema: null, quarantena: [], pestanya: true }).detall).toBe(DETALL_PESTANYA);
  expect(estatPerAlEditor({ estat: 'error', problema: { tipus: 'conflicte' }, quarantena: [], pestanya: true }).detall)
    .toBe('Hi ha una versió més recent d’esta nota. El teu esborrany només es guarda en esta pestanya fins que tries quina vols conservar.');
  expect(estatPerAlEditor({ estat: 'error', problema: null, quarantena: ['icon'], pestanya: true }).detall)
    .toBe('El servidor encara no pot guardar l’emoticona: només es guarda en esta pestanya.');
  // Confirmat pel servidor: no queda res que es puga perdre.
  expect(estatPerAlEditor({ estat: 'net', problema: null, quarantena: [], pestanya: true })).toEqual({ estat: 'net', detall: '' });
});

test('T47 · una nota oberta amb un esborrany D01 (draftConflict) no és «tot desat»', () => {
  expect(estatPerAlEditor(undefined, { conflicte: true })).toEqual({
    estat: 'error',
    detall: 'Hi ha una versió més recent d’esta nota. El teu esborrany es guarda en este dispositiu fins que tries quina vols conservar.'
  });
  // Si el gestor ja diu alguna cosa més nova (s'està enviant la decisió), mana el gestor.
  expect(estatPerAlEditor({ estat: 'enviant', problema: null, quarantena: [] }, { conflicte: true })).toEqual({ estat: 'enviant', detall: '' });
});
