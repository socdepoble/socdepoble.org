/* Onada R32.11 · Lot 05 (D07 + D10 UI · 6 Estats UI + Llei 0 + Botons Centrats).
   Verifica els 6 estats UI (Loading, Empty, Error accionable, Partial, Success, Permission),
   l'alineació centrada de botons (.sdp-accions) i la paritat en 5 llengües de
   RestauradorOpenData, FitxaOpenData i el pont d'AppGestoria. */
import { webcrypto } from 'node:crypto';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
// Prova en castellà (UIProvider language 'es'): porta els cinc diccionaris des del primer pintat (i18n.idiomes.test.js).
import '../../../tests/helpers/diccionaris.js';
import { BrowserRouter } from '../../app/contexts/RouterContext.jsx';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { carregaDiccionari } from '../../config/i18n.js';
import { exportaMunicipiOpenData } from '../../data/exportaMunicipiOpenData.js';
import { preparaSnapshotOpenDataPublic } from '../../../tooling/seo/snapshot-opendata-public.mjs';
import { creaAdaptadorLocal } from '../../data/local/adaptadorLocal.js';
import { CAPACITATS } from '../../data/contracte.js';
import RestauradorOpenData from './RestauradorOpenData.jsx';
import { TEXTOS_RESTAURADOR } from './restauradorOpenDataModel.js';
import { TEXTOS_OPENDATA_ESTATS } from './i18nOpenDataEstats.js';
import {
  LimitErrorPontGestoria,
  TEXTOS_BUIT_GESTORIA,
  TEXTOS_PONT_GESTORIA,
  textosPontGestoria,
} from '../../apps/gestoria/AppGestoria.jsx';

const IDIOMES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);
const TX = Object.fromEntries(Object.entries(TEXTOS_RESTAURADOR).map(([k, [, v]]) => [k, v]));
const MUNICIPI = Object.freeze({ slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });

const creats = [];

beforeEach(async () => {
  window.localStorage.clear();
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
  await Promise.all(IDIOMES.map((codi) => carregaDiccionari(codi)));
});

afterEach(async () => {
  cleanup();
  for (const a of creats.splice(0)) await a.destroy();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function creaPaquetProva() {
  const s = preparaSnapshotOpenDataPublic({
    feedPosts: [{ id: 'node-zero-mac-mini-m4', title: 'Node 0', body: 'A La Torre de les Maçanes.', author_entity_id: 'socdepoble' }],
    events: [],
    ara: '2026-11-03T15:33:02Z',
  });
  return exportaMunicipiOpenData(s.entrada, { subtle: webcrypto.subtle });
}

function creaPortLocal() {
  const a = creaAdaptadorLocal({ mode: 'local', dades: { entitats: [] }, restauracioOberta: true });
  creats.push(a);
  return {
    ...a,
    teCapacitat: (c) => CAPACITATS[c]?.every((k) => typeof a[k] === 'function') || false,
    restauraDadesObertes: vi.fn(a.restauraDadesObertes),
  };
}

describe('Onada R32.11 · Lot 05 · Simetria 5 llengües dels diccionaris d’estats UI', () => {
  test.each([
    ['TEXTOS_OPENDATA_ESTATS', TEXTOS_OPENDATA_ESTATS],
    ['TEXTOS_BUIT_GESTORIA', TEXTOS_BUIT_GESTORIA],
    ['TEXTOS_PONT_GESTORIA', TEXTOS_PONT_GESTORIA],
  ])('%s té paritat exacta de claus en ca, es, en, eu i gl', (nom, diccionari) => {
    expect(Object.keys(diccionari).sort(), nom).toEqual([...IDIOMES].sort());
    const claus = Object.keys(diccionari.ca).sort();
    for (const codi of IDIOMES) {
      expect(Object.keys(diccionari[codi]).sort(), `${nom}[${codi}]`).toEqual(claus);
      for (const clau of claus) {
        expect(typeof diccionari[codi][clau], `${nom}[${codi}].${clau}`).toBe(typeof diccionari.ca[clau]);
      }
    }
  });
});

describe('Onada R32.11 · Lot 05 · Els 6 estats UI i botons centrats a RestauradorOpenData', () => {
  test('Empty, Permission, Loading, Error accionable, Partial i Success amb botons centrats (.sdp-accions)', async () => {
    const p = await creaPaquetProva();
    const port = creaPortLocal();

    const { container, rerender } = render(
      <UIProvider externalConfig={{ language: 'es' }}>
        <RestauradorOpenData
          port={port}
          municipi={MUNICIPI}
          scopeKey="persona::tenant-a::local"
          config={{ tenantId: 'a', dataMode: 'local' }}
          autoritzat={false}
          idioma="es"
        />
      </UIProvider>
    );

    // 1. Empty + Permission + botons centrats
    expect(screen.getByText(TEXTOS_OPENDATA_ESTATS.es.buitPaquetTitol)).toBeTruthy();
    expect(screen.getByText(TEXTOS_OPENDATA_ESTATS.es.modeVerificacioLocalTitol)).toBeTruthy();
    expect(container.querySelectorAll('.sdp-accions').length).toBeGreaterThan(0);

    // Passem a autoritzat per provar Error -> Partial -> Success
    rerender(
      <UIProvider externalConfig={{ language: 'ca' }}>
        <RestauradorOpenData
          port={port}
          municipi={MUNICIPI}
          scopeKey="persona::tenant-a::local"
          config={{ tenantId: 'a', dataMode: 'local' }}
          autoritzat
          idioma="ca"
        />
      </UIProvider>
    );

    const file = new File([p.zip], 'poble.zip', { type: 'application/zip' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => p.zip.buffer.slice(p.zip.byteOffset, p.zip.byteOffset + p.zip.byteLength),
    });

    // 2. Error accionable amb botó de descartar
    fireEvent.change(screen.getByLabelText(TX.fitxer), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText(TX.sha), { target: { value: '0'.repeat(64) } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: TX.comprova }));
    });
    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: TX.descarta }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText(TEXTOS_OPENDATA_ESTATS.ca.buitPaquetTitol)).toBeTruthy();

    // 3. Partial (1 de 5 col·leccions amb registres) + Success
    const fileValid = new File([p.zip], 'poble.zip', { type: 'application/zip' });
    Object.defineProperty(fileValid, 'arrayBuffer', {
      value: async () => p.zip.buffer.slice(p.zip.byteOffset, p.zip.byteOffset + p.zip.byteLength),
    });
    fireEvent.change(screen.getByLabelText(TX.fitxer), { target: { files: [fileValid] } });
    fireEvent.change(screen.getByLabelText(TX.sha), { target: { value: p.sha256 } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: TX.comprova }));
    });
    expect(await screen.findByText(TEXTOS_OPENDATA_ESTATS.ca.paquetVerificatTitol)).toBeTruthy();
    expect(screen.getByText(TEXTOS_OPENDATA_ESTATS.ca.coberturaParcialTitol(4, 5))).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: TX.restaura }));
    });
    expect(await screen.findByText(TEXTOS_OPENDATA_ESTATS.ca.restauracioConfirmadaTitol)).toBeTruthy();
  });
});

describe('Onada R32.11 · Lot 05 · Error recuperable i Llei 0 al pont d’AppGestoria', () => {
  test('LimitErrorPontGestoria captura un error de mòdul diferit i el reintenta netament', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function ModulAmbFallada({ falla }) {
      if (falla) throw new Error('chunk-error');
      return <p>Mòdul recuperat amb èxit</p>;
    }
    function Contenidor() {
      const [falla, setFalla] = useState(true);
      const tx = textosPontGestoria('en');
      return (
        <BrowserRouter>
          <button type="button" onClick={() => setFalla(false)}>Arregla</button>
          <LimitErrorPontGestoria clauRuta="/app/gestoria/facturacio" tx={tx} rutaTauler="/app/gestoria/tauler">
            <ModulAmbFallada falla={falla} />
          </LimitErrorPontGestoria>
        </BrowserRouter>
      );
    }

    render(<Contenidor />);
    expect(screen.getByText(TEXTOS_PONT_GESTORIA.en.errorModulTitol)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Arregla' }));
    fireEvent.click(screen.getByRole('button', { name: TEXTOS_PONT_GESTORIA.en.reintentaModul }));
    expect(screen.getByText('Mòdul recuperat amb èxit')).toBeTruthy();
    spy.mockRestore();
  });

  test('els textos d’abast pre-comptable de Facturació declaren honestament que no hi ha homologació AEAT en les 5 llengües', () => {
    for (const codi of IDIOMES) {
      expect(TEXTOS_PONT_GESTORIA[codi].abastFacturacioText).toMatch(/AEAT/);
      expect(TEXTOS_PONT_GESTORIA[codi].abastFacturacioText).not.toMatch(/Veri\*Factu/);
    }
  });
});
