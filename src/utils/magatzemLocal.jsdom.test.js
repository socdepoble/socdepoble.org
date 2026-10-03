/* magatzemLocal amb els valors per defecte de l'entorn de proves de les apps
   (jsdom): sense IndexedDB ni Web Locks treballa en memòria, escriu i no
   deixa el procés penjat pel canal entre pestanyes. */
import { expect, test } from 'vitest';
import { creaMagatzemIdb } from './magatzemLocal.js';

test('en jsdom, sense injectar res: memòria, escriptora i còpies independents', async () => {
  const magatzem = creaMagatzemIdb({
    nom: 'sdp-prova-jsdom', versio: 1,
    stores: { apunts: { clau: 'id' } },
    llistaBlanca: { apunts: ['id', 'hora'] }
  });
  const avisos = [];
  magatzem.subscriu((avis) => avisos.push(avis));
  expect(magatzem.persistent).toBe(typeof globalThis.indexedDB !== 'undefined');
  expect(await magatzem.obtinBloqueig()).toBe('escriptora');
  const desat = await magatzem.desa('apunts', { id: 'a-1', hora: '07:30', sobra: 'x' });
  expect(desat).toEqual({ id: 'a-1', hora: '07:30' });
  desat.hora = '08:00';
  expect(await magatzem.obte('apunts', 'a-1')).toEqual({ id: 'a-1', hora: '07:30' });
  await new Promise((resolve) => { setTimeout(resolve, 0); });
  expect(avisos).toContainEqual({ tipus: 'canvi', store: 'apunts', local: true });
  magatzem.tanca();
});
