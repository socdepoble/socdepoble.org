/**
 * Ordre del Mestre (261013; pla 261013_1930, Front 3) · Les entitats
 * fundacionals de la llavor, 'socdepoble' i 'rentonar', resolen la seua fitxa
 * pública pel port en mode seed, sense xarxa i sense sessió. És el que llig
 * PerfilPublicSection a /empresa/socdepoble i a /grup/rentonar (App.jsx):
 * loadPerfilPublic d'este adaptador delega en localPerfils fora de 'remote'.
 */
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { rutaDePerfil } from '../../config/navigation.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG } from '../identitatsSeed.js';
import { loadPerfilPublic } from './perfils.js';

const SEED = Object.freeze({ dataMode: 'seed' });
const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA_EN_LLAVOR'); });
beforeAll(() => { vi.stubGlobal('fetch', xarxa); });
afterAll(() => { vi.unstubAllGlobals(); });

test('Front 3 · /grup/rentonar: la fitxa del grup Rentonar, sense propietària', async () => {
  const perfil = await loadPerfilPublic(ENTITAT_RENTONAR_SLUG, SEED);
  expect(perfil).toMatchObject({
    tipus: 'grup', id: ENTITAT_RENTONAR_SLUG, slug: ENTITAT_RENTONAR_SLUG, nom: 'Rentonar', lema: 'Natura i Patrimoni',
    esIA: false, publicat: true, propietari: false
  });
  expect(rutaDePerfil(perfil.tipus, perfil.slug)).toBe('/grup/rentonar');
  expect(xarxa).not.toHaveBeenCalled();
});

test('Front 3 · /empresa/socdepoble continua resolent l’entitat pilot', async () => {
  const perfil = await loadPerfilPublic(ENTITAT_PILOT_SLUG, SEED);
  expect(perfil).toMatchObject({ tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble' });
  expect(rutaDePerfil(perfil.tipus, perfil.slug)).toBe('/empresa/socdepoble');
  expect(xarxa).not.toHaveBeenCalled();
});
