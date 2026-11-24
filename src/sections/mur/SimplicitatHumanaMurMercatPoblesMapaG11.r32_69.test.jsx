/**
 * Ronda G11 (R32.69_gemini) · Simplicitat Humana, Resiliència Offline 5 Llengües,
 * Llei 9 Botons Centrats i Accessibilitat WCAG AAA sense soroll d'aria-live a
 * Mur, Mercat, Pobles i Mapa Fotogràfic.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { UIContext, UIActionsContext } from '../../app/contexts/objectesDeContext.js';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';

vi.mock('../../config/origenPublic.js', async (original) => ({ ...(await original()), esAppNativa: () => false }));
vi.mock('../../data/backendPort.js', async (original) => ({
  ...(await original()),
  resolveAsset: () => Promise.reject(new Error('sense port'))
}));
vi.mock('leaflet/dist/leaflet.css?inline', async () => {
  const { readFileSync } = await import('node:fs');
  const { createRequire } = await import('node:module');
  return { default: readFileSync(createRequire(import.meta.url).resolve('leaflet/dist/leaflet.css'), 'utf8') };
});

import { EstatErrorDades } from './EstatErrorDades.jsx';
import { FalladaDeLHistoric, VistaPublicacionsDeLActor } from './PublicacionsDeLActor.jsx';
import { CODIS_IDIOMA_HUMANA, TEXTOS_OFFLINE_HUMANA, sanejaErrorEixidaRemota } from './i18nEstatErrorHumana.js';
import MapaFotografic from './MapaFotografic.jsx';
import { formataEtiquetaHumana } from '../mercat/etiquetesMercat.js';
import { textosDeLesEntitats } from '../pobles/entitatsDelPobleModel.js';
import { FontsTerritorials } from '../pobles/PanellDeViquipedia.jsx';

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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function AmbIdiomaOffline({ idioma, externalConfig = {}, children }) {
  // Simula caiguda 3G / offline abans de descarregar el paquet diferit d'idioma:
  // el traductor retorna la reserva en valencià (`_clau, reserva => reserva`).
  const t = (_clau, reserva) => reserva;
  return (
    <MemoryRouter initialEntries={['/mur']}>
      <UIContext.Provider value={{ language: idioma, locale: `${idioma}-ES`, externalConfig }}>
        <UIActionsContext.Provider value={{ language: idioma, t }}>
          {children}
        </UIActionsContext.Provider>
      </UIContext.Provider>
    </MemoryRouter>
  );
}

describe('G11 · Lot 01 · Resiliència offline 5 llengües, sanejament d’errors i estats centrats', () => {
  test('TEXTOS_OFFLINE_HUMANA manté simetria exacta de claus en ca, es, en, eu i gl', () => {
    const clausCa = Object.keys(TEXTOS_OFFLINE_HUMANA.ca).sort();
    expect(CODIS_IDIOMA_HUMANA).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    for (const codi of CODIS_IDIOMA_HUMANA) {
      expect(Object.keys(TEXTOS_OFFLINE_HUMANA[codi]).sort()).toEqual(clausCa);
    }
  });

  test.each([
    ['ca', 'Revisa la connexió i torna-ho a provar.', 'Torna-ho a provar'],
    ['es', 'Revisa la conexión y vuelve a intentarlo.', 'Vuelve a intentarlo'],
    ['en', 'Check your connection and try again.', 'Try again'],
    ['eu', 'Egiaztatu konexioa eta saiatu berriro.', 'Saiatu berriro'],
    ['gl', 'Revisa a conexión e téntao de novo.', 'Téntao de novo']
  ])('EstatErrorDades en %s conserva la llengua triada fins i tot sense diccionari diferit carregat', (codi, esperatCos, esperatBoto) => {
    const onReintenta = vi.fn();
    render(
      <AmbIdiomaOffline idioma={codi}>
        <EstatErrorDades titol="Avís" error={new Error('TimeoutError')} onReintenta={onReintenta} />
      </AmbIdiomaOffline>
    );
    expect(screen.getByText(esperatCos)).toBeTruthy();
    const boto = screen.getByRole('button', { name: esperatBoto });
    fireEvent.click(boto);
    expect(onReintenta).toHaveBeenCalledTimes(1);
    cleanup();
  });

  test('EstatErrorDades impedeix el doble clic mentre la promesa de reintent està en vol i saneja SecurityError', async () => {
    let resolReintent;
    const onReintenta = vi.fn(() => new Promise((resol) => { resolReintent = resol; }));
    render(
      <AmbIdiomaOffline idioma="es">
        <EstatErrorDades titol="Avís" error={{ status: 503 }} onReintenta={onReintenta} />
      </AmbIdiomaOffline>
    );
    const boto = screen.getByRole('button', { name: 'Vuelve a intentarlo' });
    fireEvent.click(boto);
    fireEvent.click(boto);
    expect(onReintenta).toHaveBeenCalledTimes(1);
    await act(async () => { resolReintent(); });
    fireEvent.click(boto);
    expect(onReintenta).toHaveBeenCalledTimes(2);

    expect(sanejaErrorEixidaRemota(new Error("SecurityError: Failed to read 'localStorage'"), 'en'))
      .toBe('Your choice could not be cleared. Allow browser storage and try again.');
    expect(sanejaErrorEixidaRemota(new Error('No s’ha pogut esborrar l’elecció. Permet l’emmagatzematge del navegador i torna a provar.'), 'ca'))
      .toContain('No s’ha pogut esborrar l’elecció.');
  });

  test('VistaPublicacionsDeLActor i FalladaDeLHistoric centren l’estat buit (.sdp-paragraf-centrat) i tradueixen en offline', () => {
    const { container } = render(
      <AmbIdiomaOffline idioma="eu">
        <VistaPublicacionsDeLActor seccio="mercat" elements={[]} estat="ready" />
        <FalladaDeLHistoric seccio="mur" t={(_c, r) => r} reinicia={vi.fn()} />
      </AmbIdiomaOffline>
    );
    const estatBuit = container.querySelector('p[role="status"].sdp-paragraf-centrat');
    expect(estatBuit?.textContent).toBe('Identitate honekin ez dago oraindik ezer argitaratuta Merkatuan.');
    expect(screen.getByRole('button', { name: 'Saiatu berriro' })).toBeTruthy();
  });

  test('formataEtiquetaHumana del Mercat i textosDeLesEntitats de Pobles parlen les 5 llengües sense argot opac', () => {
    expect(formataEtiquetaHumana('marxandatge', 'ca')).toBe('Marxandatge');
    expect(formataEtiquetaHumana('marxandatge', 'es')).toBe('Productos del proyecto');
    expect(formataEtiquetaHumana('marxandatge', 'en')).toBe('Project goods');
    expect(formataEtiquetaHumana('a-tornallom', 'eu')).toBe('Auzolanean');
    expect(formataEtiquetaHumana('oli-verge-extra', 'gl')).toBe('Aceite Virxe Extra');

    const entGl = textosDeLesEntitats((_c, r) => r, 'gl');
    expect(entGl.buit).toBe('Aínda non hai ningunha empresa nin entidade deste pobo no directorio.');
    expect(entGl.tipus.entity).toBe('Entidade');
  });

  test('FontsTerritorials utilitza .sdp-taula-prosa amb <th scope="row"> i no deixa <dl> despullat ni taules buides', () => {
    const pobleAmbDades = {
      id: 'nucli-prova',
      title: 'Nucli Prova',
      population: '42 hab',
      population_year: 2025,
      wikipedia_provenance: { scope: 'settlement' },
      imatges: {}
    };
    const { container, rerender } = render(<FontsTerritorials poble={pobleAmbDades} />);
    expect(container.querySelector('dl')).toBeNull();
    const taula = container.querySelector('table.sdp-taula-prosa');
    expect(taula).not.toBeNull();
    expect(taula.querySelector('th[scope="row"]')?.textContent).toBe('Població');
    expect(taula.querySelector('td')?.textContent).toBe('42 hab (2025)');

    rerender(<FontsTerritorials poble={{ id: 'buit', title: 'Buit', wikipedia_provenance: { scope: 'municipality' }, imatges: {} }} />);
    expect(container.querySelector('table.sdp-taula-prosa')).toBeNull();
  });
});

describe('G11 · Lot 02 · MapaFotografic sense spam aria-live, sense title= i amb botons centrats Llei 9', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new Error('sense xarxa')));
  });

  test('elimina aria-live redundant de h3, ajuda i output, substitueix title= per aria-describedby i centra eines i estat buit', async () => {
    let mapa = null;
    const { container } = render(
      <MapaFotografic items={[]} onMapa={(instancia) => { mapa = instancia; }} />
    );
    await waitFor(() => expect(mapa).toBeTruthy());

    const titol = container.querySelector('.sdp-mapa__titol');
    const ajuda = container.querySelector('.sdp-mapa__ajuda');
    const output = container.querySelector('output.sdp-mapa__valor');
    expect(titol.hasAttribute('aria-live')).toBe(false);
    expect(ajuda.hasAttribute('aria-live')).toBe(false);
    expect(output.getAttribute('aria-live')).toBe('off');

    // Cap atribut title= inaccessible al teclat ni a la barra d'eines ni als controls de zoom
    expect(container.querySelectorAll('.sdp-mapa__eines [title], .leaflet-control-zoom [title]')).toHaveLength(0);
    const recolloca = screen.getByRole('button', { name: 'Recol·locar grups' });
    const idDesc = recolloca.getAttribute('aria-describedby');
    expect(idDesc).toBeTruthy();
    expect(document.getElementById(idDesc)?.textContent).toBe('Torna les targetes que has mogut al seu lloc automàtic');

    // Llei 9: eines i capçalera d'agrupació centrades + avís buit amb role="status" i sdp-paragraf-centrat
    expect(container.querySelector('.sdp-mapa__eines')?.classList.contains('sdp-fila--centrada')).toBe(true);
    expect(container.querySelector('.sdp-mapa__agrupacio-cap')?.classList.contains('sdp-fila--centrada')).toBe(true);
    const avisBuit = container.querySelector('.sdp-mapa__avis.sdp-paragraf-centrat[role="status"]');
    expect(avisBuit?.textContent).toContain('Encara no hi ha cap foto del Mur amb lloc');
  });
});
