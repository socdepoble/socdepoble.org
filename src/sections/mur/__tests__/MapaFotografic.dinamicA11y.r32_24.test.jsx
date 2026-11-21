import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { UIProvider } from '../../../app/contexts/UIContext';

vi.mock('../../../config/origenPublic.js', async (original) => ({
  ...(await original()),
  esAppNativa: () => false,
}));
vi.mock('../../../data/backendPort.js', async (original) => ({
  ...(await original()),
  resolveAsset: async (ref) => `/assets/uploads/resolta/${String(ref).split('/').pop()}`,
}));
vi.mock('leaflet/dist/leaflet.css?inline', async () => {
  const { readFileSync } = await import('node:fs');
  const { createRequire } = await import('node:module');
  return { default: readFileSync(createRequire(import.meta.url).resolve('leaflet/dist/leaflet.css'), 'utf8') };
});
vi.mock('../../../css/diferit-mapa-fotografic.css?inline', async () => {
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  return { default: readFileSync(resolve(process.cwd(), 'src/css/diferit-mapa-fotografic.css'), 'utf8') };
});

import MapaFotografic from '../MapaFotografic.jsx';

const FOTO = (nom) => `/assets/uploads/gent/veina/mur/${nom}.webp`;
const ITEMS = [
  {
    id: 'arbre-llorer',
    type: 'patrimoni',
    title: 'Llorer de Villa María',
    poble_id: 'la-torre-de-les-macanes',
    image_url: FOTO('llorer'),
    geolocalitzacio: { lat: 38.5919, lng: -0.4184, precisio: 'exacta', precisio_m: 5, origen: 'exif' },
    dataCaptura: '2026-10-12T10:00:00+02:00',
    fotos_geo: [
      { src: FOTO('llorer-2'), lat: 38.5921, lng: -0.4181, precisio: 'exacta', precisio_m: 5, dataCaptura: '2026-10-12T10:15:00+02:00' },
      { src: FOTO('llorer-3'), dataCaptura: '2026-10-12T10:20:00+02:00' },
    ],
  },
];

const MIDA = { clientWidth: 800, clientHeight: 600 };
beforeAll(() => {
  for (const [nom, valor] of Object.entries(MIDA)) {
    Object.defineProperty(HTMLElement.prototype, nom, {
      configurable: true,
      get() {
        return this.classList?.contains('sdp-mapa__llenc') ? valor : 0;
      },
    });
  }
});
afterAll(() => {
  for (const nom of Object.keys(MIDA)) delete HTMLElement.prototype[nom];
});

let mapa;
beforeEach(() => {
  mapa = null;
  window.localStorage.clear();
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new Error('sense xarxa')));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const pinta = async (fes) => {
  await act(async () => {
    fes();
  });
  await act(async () => {
    await new Promise((resol) => setTimeout(resol, 45));
  });
};

describe('R32.24 · MapaFotografic · Estats dinàmics, teclat APG, retorn de focus i 5 llengües', () => {
  test('tradueix els controls de zoom (+ / −), permet activar-los amb Espai i exposa anell :focus-visible per a .leaflet-interactive', async () => {
    const { container } = render(
      <UIProvider externalConfig={{ language: 'ca' }}>
        <MapaFotografic items={ITEMS} onMapa={(instancia) => { mapa = instancia; }} />
      </UIProvider>,
    );
    await waitFor(() => expect(mapa).toBeTruthy());

    const zoomIn = container.querySelector('.leaflet-control-zoom-in');
    const zoomOut = container.querySelector('.leaflet-control-zoom-out');
    expect(zoomIn.getAttribute('aria-label')).toBe('Apropar');
    expect(zoomOut.getAttribute('aria-label')).toBe('Allunyar');

    const zoomInicial = mapa.getZoom();
    await pinta(() => fireEvent.keyDown(zoomIn, { key: ' ' }));
    expect(mapa.getZoom()).toBeGreaterThan(zoomInicial);
    const zoomDespresMes = mapa.getZoom();
    await pinta(() => fireEvent.keyDown(zoomOut, { key: ' ' }));
    expect(mapa.getZoom()).toBeLessThan(zoomDespresMes);

    // Canvi d'idioma en calent a anglés i basc
    for (const [codi, esperat] of [['en', 'Zoom in'], ['eu', 'Hurbildu']]) {
      await pinta(() => {
        window.dispatchEvent(new CustomEvent('sdp:language-changed', { detail: { language: codi } }));
      });
      await waitFor(() => expect(zoomIn.getAttribute('aria-label')).toBe(esperat));
    }

    // Verifica que el full diferit inclou la regla :focus-visible per a .leaflet-interactive i .sdp-mapa-diana
    const reglesAdoptades = [
      ...(document.adoptedStyleSheets || []).flatMap((s) => [...(s.cssRules || [])].map((r) => r.cssText)),
      ...[...document.querySelectorAll('style')].map((n) => n.textContent || ''),
    ].join('\n');
    expect(reglesAdoptades).toContain('.leaflet-interactive:focus-visible');
    expect(reglesAdoptades).toContain('.sdp-mapa-diana:focus-visible');
  });

  test('els punts .leaflet-interactive en mode parades i foto-a-foto tenen nom accessible, obrin el visor amb Enter/Espai i recuperen el focus amb Escape fins i tot si el mapa es repinta', async () => {
    const { container } = render(
      <UIProvider externalConfig={{ language: 'ca' }}>
        <MapaFotografic items={ITEMS} onMapa={(instancia) => { mapa = instancia; }} />
      </UIProvider>,
    );
    await waitFor(() => expect(mapa).toBeTruthy());

    // Mode parades (zoom 14)
    await pinta(() => mapa.setView([38.5919, -0.4184], 14, { animate: false }));
    const dianesParada = [...container.querySelectorAll('path.sdp-mapa-diana.leaflet-interactive')];
    expect(dianesParada.length).toBeGreaterThan(0);
    for (const diana of dianesParada) {
      expect(diana.getAttribute('role')).toBe('button');
      expect(diana.getAttribute('tabindex')).toBe('0');
      expect((diana.getAttribute('aria-label') || '').trim().length).toBeGreaterThan(5);
    }

    // Obrir visor amb Enter sobre la primera diana i tancar amb Escape després d'un repintat del mapa
    const primeraDiana = dianesParada[0];
    const clauEsperada = primeraDiana.dataset.clau;
    const rolEsperat = primeraDiana.dataset.rol;
    await pinta(() => fireEvent.keyDown(primeraDiana, { key: 'Enter' }));
    await waitFor(() => expect(document.querySelector('dialog[open]')).not.toBeNull());

    // Simula un repintat intern del mapa mentre el visor és obert (el node original queda desconnectat)
    await pinta(() => mapa.fire('moveend'));
    expect(primeraDiana.isConnected).toBe(false);

    // Tanca el visor (Escape / botó Tancar) -> el focus ha de tornar a la nova diana equivalent o al llenç, mai al body
    const botoTanca = screen.getByRole('button', { name: /Tanca/i });
    await pinta(() => botoTanca.click());
    await waitFor(() => expect(document.querySelector('dialog[open]')).toBeNull());
    expect(container.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.dataset?.clau).toBe(clauEsperada);
    expect(document.activeElement?.dataset?.rol).toBe(rolEsperat);

    // Mode foto-a-foto (zoom 16): obrir amb Espai i verificar literalització de classes
    await pinta(() => mapa.setView([38.5919, -0.4184], 16, { animate: false }));
    const targetesFoto = [...container.querySelectorAll('button.sdp-mapa-foto')];
    expect(targetesFoto).toHaveLength(3);
    expect(targetesFoto.some((b) => b.classList.contains('sdp-mapa-foto--verd'))).toBe(true);
    expect(targetesFoto.some((b) => b.classList.contains('sdp-mapa-foto--ocre'))).toBe(true);

    const dianaFoto = container.querySelector('path.sdp-mapa-diana.leaflet-interactive');
    await pinta(() => fireEvent.keyDown(dianaFoto, { key: ' ' }));
    await waitFor(() => expect(document.querySelector('dialog[open]')).not.toBeNull());
  });
});
