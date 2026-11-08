/* R51 (P0-46; troballa R12G-SB-02) · El Mapa Fotogràfic del Mur pinta el
   títol de cada publicació a la targeta de la seua parada (un <p> de dades
   dins del panell de Leaflet) i a la targeta de cada foto. El Traduir de la
   pàgina (blocsTraduibles) recull el <p>: amb una publicació amb 'none', la
   revisada o un error, el títol eixia cap al motor quan tot el Mur era
   públic. Ara puntsDelMapa porta el veredicte del pla (publicacioTraduible)
   a cada foto i a cada parada, i la targeta d'una publicació protegida porta
   translate="no". Sense mode, el DOM de sempre. Leaflet de veres dins de
   jsdom, l'arnés de MapaFotografic.test.jsx. */
import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../config/origenPublic.js', async (original) => ({ ...(await original()), esAppNativa: () => false }));
vi.mock('../../data/backendPort.js', async (original) => ({ ...(await original()), resolveAsset: () => Promise.reject(new Error('sense port')) }));
/* El full de Leaflet llegit per Node, com a MapaFotografic.test.jsx (Vite nega el `?inline` fora de l'arrel en una còpia de l'arbre). */
vi.mock('leaflet/dist/leaflet.css?inline', async () => {
  const { readFileSync } = await import('node:fs');
  const { createRequire } = await import('node:module');
  return { default: readFileSync(createRequire(import.meta.url).resolve('leaflet/dist/leaflet.css'), 'utf8') };
});
import MapaFotografic from './MapaFotografic.jsx';
import { puntsDelMapa } from './puntsDelMapa.js';
import { blocsTraduibles } from '../../components/universal/traduccio/blocsTraduibles.js';

const FOTO = (nom) => `/assets/uploads/gent/veina/mur/${nom}.webp`;
const GPS = (lat, lng) => ({ lat, lng, precisio: 'exacta', precisio_m: 1, origen: 'exif' });
const revisades = Object.fromEntries(['ca', 'es', 'en', 'eu', 'gl']
  .map((codi) => [codi, { title: `Fonts revisades ${codi}`, content: `<p>Cos revisat ${codi}</p>`, reviewed: true }]));
const publicacio = (id, title, lat, lng, hora, extra = {}) => ({
  id, type: 'feed', title, poble_id: 'la-torre-de-les-macanes', image_url: FOTO(id),
  geolocalitzacio: GPS(lat, lng), dataCaptura: `2026-10-12T${hora}:00+02:00`, ...extra
});
const PROTEGIDA = publicacio('fonts', 'Les fonts sense traducció', 38.5919, -0.4184, '10:00', { translation_mode: 'none', source_language: 'ca' });
const DE_SEMPRE = publicacio('placa', 'La plaça de sempre', 38.5925, -0.4175, '11:00');

const MIDA = { clientWidth: 800, clientHeight: 600 };
beforeAll(() => {
  for (const [nom, valor] of Object.entries(MIDA)) {
    Object.defineProperty(HTMLElement.prototype, nom, {
      configurable: true,
      get() { return this.classList?.contains('sdp-mapa__llenc') ? valor : 0; }
    });
  }
});
afterAll(() => {
  for (const nom of Object.keys(MIDA)) delete HTMLElement.prototype[nom];
});

let mapa;
let fetchEspia;
beforeEach(() => {
  mapa = null;
  window.localStorage.clear();
  fetchEspia = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new Error('cap xarxa a les proves')));
});
afterEach(() => {
  cleanup();
  fetchEspia.mockRestore();
});

async function munta(items) {
  render(<MapaFotografic items={items} onMapa={(instancia) => { mapa = instancia; }} />);
  await waitFor(() => expect(mapa).toBeTruthy());
  await waitFor(() => expect(document.querySelector('.sdp-mapa-targeta, .sdp-mapa-foto')).not.toBeNull());
}
const pinta = async (fes) => {
  await act(async () => { fes(); });
  await act(async () => { await new Promise((resol) => setTimeout(resol, 40)); });
};
const targetaAmb = (selector, text) => [...document.querySelectorAll(selector)].find((targeta) => targeta.textContent.includes(text));

describe('puntsDelMapa · el veredicte de traducció de cada publicació', () => {
  test.each([
    ['sense mode', {}, true],
    ['amb l’automàtica', { translation_mode: 'on_the_fly', source_language: 'ca' }, true],
    ['amb «none»', { translation_mode: 'none', source_language: 'ca' }, false],
    ['amb la revisada', { translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades }, false],
    ['amb un mode que no existix', { translation_mode: 'auto', source_language: 'ca' }, false]
  ])('%s: cada foto i cada parada en porten el veredicte', (_, extra, esperat) => {
    const { fotos, parades } = puntsDelMapa([publicacio('p', 'Publicació', 38.5919, -0.4184, '10:00', extra)]);
    expect(fotos.length).toBeGreaterThan(0);
    expect(parades.length).toBeGreaterThan(0);
    expect(fotos.every((foto) => foto.traduible === esperat)).toBe(true);
    expect(parades.every((parada) => parada.traduible === esperat)).toBe(true);
  });
});

describe('el Mapa Fotogràfic i el Traduir de la pàgina', () => {
  test('una targeta per parada: la de la publicació protegida porta translate="no" i el seu títol no ix cap al motor', async () => {
    await munta([PROTEGIDA, DE_SEMPRE]);
    await pinta(() => mapa.setView([38.5922, -0.418], 14, { animate: false }));
    expect(document.querySelector('.sdp-mapa__estat').textContent).toContain('Detall de parades');
    const protegida = targetaAmb('.sdp-mapa-targeta', 'Les fonts sense traducció');
    const deSempre = targetaAmb('.sdp-mapa-targeta', 'La plaça de sempre');
    expect(protegida).toBeTruthy();
    expect(deSempre).toBeTruthy();
    expect(protegida.getAttribute('translate')).toBe('no');
    expect(deSempre.getAttribute('translate')).toBeNull();
    const textos = blocsTraduibles(document.querySelector('.sdp-mapa')).map(({ text }) => text).join('\n');
    expect(textos).toContain('La plaça de sempre');
    expect(textos).not.toContain('Les fonts sense traducció');
  });

  test('foto a foto: la targeta de la foto d’una publicació protegida també porta translate="no"', async () => {
    await munta([PROTEGIDA, DE_SEMPRE]);
    await pinta(() => mapa.setView([38.5922, -0.418], 16, { animate: false }));
    const protegida = targetaAmb('.sdp-mapa-foto', 'Les fonts sense traducció');
    const deSempre = targetaAmb('.sdp-mapa-foto', 'La plaça de sempre');
    expect(protegida).toBeTruthy();
    expect(deSempre).toBeTruthy();
    expect(protegida.getAttribute('translate')).toBe('no');
    expect(deSempre.getAttribute('translate')).toBeNull();
  });
});
