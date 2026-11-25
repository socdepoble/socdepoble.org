/**
 * lot-g2-microapps-v1225.test.jsx — Bateria de verificació del Lot G2 (Onada v1.2.25)
 * Cobreix:
 *   1. Gestoria: VistaBurocracia (.ics + terminis + plaNeteja) i VistaContactes (alta + NIF + CSV)
 *   2. Bar: CuinaKds local + plantilla tèrmica 58/80 mm a NotaClient
 *   3. Multimèdia iPadOS / OPFS: botó dedicat i degradació neta
 *   4. Calendari Agrícola: <EstatBuit>, enllaç mutu a /calendari i recordatori local 5L
 *   5. Simetria de 5 llengües (ca, es, en, eu, gl) i zero termes vetats
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../src/app/contexts/RouterContext';
import VistaBurocracia from '../src/sections/gestoria/vistes/VistaBurocracia.jsx';
import VistaContactes from '../src/sections/gestoria/contactes/VistaContactes.jsx';
import { TEXTOS_GESTORIA_V1225 } from '../src/sections/gestoria/i18nGestoriaV1225.js';
import { TEXTOS_OPFS_IPAD } from '../src/sections/multimedia/i18nOpfsIpad.js';
import { BarraVolumsLocals } from '../src/sections/multimedia/BarraVolumsLocals.jsx';
import CalendariAgricolaLlavorsView from '../src/sections/patrimoni/CalendariAgricolaLlavorsView.jsx';
import { NotaClient } from '../src/apps/bar/vistes/NotaClient.jsx';
import { destinacioEnllacDelServei } from '../src/apps/lector/AppLector.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Lot G2 · Simetria de 5 llengües i vocabulari', () => {
  test('TEXTOS_GESTORIA_V1225 i TEXTOS_OPFS_IPAD són 100 % simètrics en ca/es/en/eu/gl', () => {
    const clausGestoria = Object.keys(TEXTOS_GESTORIA_V1225.ca).sort();
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(Object.keys(TEXTOS_GESTORIA_V1225[lang]).sort()).toEqual(clausGestoria);
      for (const k of clausGestoria) {
        expect(TEXTOS_GESTORIA_V1225[lang][k].trim().length).toBeGreaterThan(0);
      }
    }
    const clausOpfs = Object.keys(TEXTOS_OPFS_IPAD.ca).sort();
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(Object.keys(TEXTOS_OPFS_IPAD[lang]).sort()).toEqual(clausOpfs);
    }
  });
});

describe('Lot G2 · Gestoria (VistaBurocracia i VistaContactes)', () => {
  test('VistaBurocracia mostra obligacions, simula pla de neteja i descarrega .ics privat', () => {
    const descarrega = vi.fn();
    render(<VistaBurocracia avui={() => new Date(2026, 3, 10)} descarrega={descarrega} idioma="ca" />);
    expect(screen.getByText(/Dates orientatives a verificar amb la gestoria/)).toBeTruthy();
    expect(screen.getAllByText(/IVA · autoliquidació/).length).toBeGreaterThanOrEqual(4);
    fireEvent.click(screen.getByRole('button', { name: /Descarrega calendari \.ics/ }));
    expect(descarrega).toHaveBeenCalledTimes(1);
    expect(descarrega.mock.calls[0][0].dades).toContain('BEGIN:VCALENDAR');
    expect(descarrega.mock.calls[0][0].dades).toContain('CLASS:PRIVATE');
  });

  test('VistaContactes valida NIF, afig un client local i exporta CSV', () => {
    const descarrega = vi.fn();
    render(<VistaContactes descarrega={descarrega} idioma="ca" />);
    fireEvent.change(screen.getByLabelText(/Nom o raó social/), { target: { value: 'Forn del Mas' } });
    fireEvent.change(screen.getByLabelText(/NIF \/ CIF/), { target: { value: 'NIF-INVALID' } });
    fireEvent.click(screen.getByRole('button', { name: 'Afig a la llibreta' }));
    expect(screen.getByText(/no supera la validació/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/NIF \/ CIF/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Afig a la llibreta' }));
    expect(screen.getByText('Forn del Mas')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Exporta CSV local' }));
    expect(descarrega).toHaveBeenCalledTimes(1);
    expect(descarrega.mock.calls[0][0].dades).toContain('Forn del Mas');
  });
});

describe('Lot G2 · El Bar (tiquet tèrmic 58/80 mm)', () => {
  test('NotaClient canvia entre 58 mm i 80 mm i crida onImprimix', () => {
    const onImprimix = vi.fn();
    const tiquet = {
      id: 'k-1',
      numero: 7,
      tipus: 'venda',
      tancatA: '2026-11-25T10:15:00.000Z',
      linies: [{ id: 'l-1', producteId: 'cafe', nomCongelat: 'Cafè sol', quantitat: 2, preuUnitariCents: 150, totalCents: 300, estat: 'normal' }],
      totals: { totalCents: 300, perIva: [{ ivaPercent: 10, baseCents: 273, quotaCents: 27 }] },
      pagaments: [{ id: 'p-1', metode: 'efectiu', importCents: 300, lliuratCents: 500, canviCents: 200 }]
    };
    const { container } = render(
      <NotaClient obert tiquet={tiquet} establiment={{ nom: 'Bar de la Plaça' }} onTanca={() => {}} onImprimix={onImprimix} />
    );
    expect(container.querySelector('[data-sdp-tiquet-termic]')?.getAttribute('data-sdp-tiquet-termic')).toBe('80mm');
    fireEvent.click(screen.getByRole('button', { name: '58 mm' }));
    expect(container.querySelector('[data-sdp-tiquet-termic]')?.getAttribute('data-sdp-tiquet-termic')).toBe('58mm');
    fireEvent.click(screen.getByRole('button', { name: 'Imprimix tiquet' }));
    expect(onImprimix).toHaveBeenCalledWith('58mm');
  });
});

describe('Lot G2 · Multimèdia iPadOS / OPFS i Lector costura C2', () => {
  test('BarraVolumsLocals mostra el botó d’importació directa iPad/navegador i l’avís de còpia privada', () => {
    const onImportaIpad = vi.fn();
    render(
      <BarraVolumsLocals
        t={(_k, fb) => fb}
        onVincula={() => {}}
        onImportaIpad={onImportaIpad}
      />
    );
    const boto = screen.getByRole('button', { name: /Importa fotos o fitxers/ });
    expect(screen.getByText(/no modifica mai els originals del dispositiu/)).toBeTruthy();
    fireEvent.click(boto);
    expect(onImportaIpad).toHaveBeenCalledTimes(1);
  });

  test('destinacioEnllacDelServei refusa amb personals-off si el servei no declara personals actives', async () => {
    const serveiApagat = {
      estat: vi.fn(async () => ({ disponible: true, personals: false })),
      fonts: vi.fn(async () => []),
      feed: vi.fn(async () => ({ items: [] })),
      feedPersonal: vi.fn(async () => ({ items: [] }))
    };
    const dest = destinacioEnllacDelServei(serveiApagat);
    expect(dest).not.toBeNull();
    await expect(dest.afig({ url: 'https://exemple.org/feed.xml', nom: 'Poble', categoria: 'poble' }))
      .rejects.toMatchObject({ codi: 'personals-off' });
  });
});

describe('Lot G2 · Calendari Agrícola (EstatBuit, enllaç mutu i recordatoris)', () => {
  test('mostra enllaç a /calendari, EstatBuit en combinació sense resultats i activa recordatori local', () => {
    const onCanviSubscripcio = vi.fn(() => ({ ok: true, activa: true }));
    render(
      <MemoryRouter rutaInicial="/page/banc-de-llavors?llibre=calendari">
        <CalendariAgricolaLlavorsView onCanviSubscripcio={onCanviSubscripcio} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /Calendari del Poble/ }).getAttribute('href')).toBe('/calendari');
    fireEvent.click(screen.getByRole('button', { name: 'Activa recordatori local' }));
    expect(onCanviSubscripcio).toHaveBeenCalledWith(expect.objectContaining({ actiu: true, cultiu: 'tomaques' }));
    expect(screen.getByText(/Recordatori local actiu/)).toBeTruthy();

    // Combinació sense resultats: tomaques + recol·lecció + gener
    fireEvent.click(screen.getByRole('button', { name: /Tomaques/ }));
    fireEvent.click(screen.getByRole('button', { name: /Recol·lecció/ }));
    fireEvent.click(screen.getByRole('button', { name: /Gener/ }));
    expect(screen.getByText('Cap varietat amb esta combinació')).toBeTruthy();
  });
});
