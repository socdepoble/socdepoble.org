/**
 * lot-g9-tancament-revisio-g6-i-esmenes-v1225.test.jsx — Bateria de tancament del Lot G9
 * (Onada v1.2.25 · Guàrdia #6 MarIA 11:00 CET + Revisió Codex G6 + Esmenes Assaig 1):
 *   1. Codex P1 · primera importació de làpida a restauraCopiaLocal neteja text/content/adjunts
 *   2. Codex P2 · CalendariAgricola exigeix ACK autoritatiu (absent/false/Promise.resolve(false)/ACK obsolet rebutjats)
 *   3. G2-04 · VistaBurocracia calcula dates mínimes reals amb dates.data
 *   4. MarIA 11:00 CET · Claus 5L PUB-D11-01, ENT0108-VS-03, XAT_ACCIO_INVALIDA, cerca conversa i OPFS iPad
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ca from '../src/config/idiomes/ca.js';
import es from '../src/config/idiomes/es.js';
import en from '../src/config/idiomes/en.js';
import eu from '../src/config/idiomes/eu.js';
import gl from '../src/config/idiomes/gl.js';
import { restauraCopiaLocal } from '../src/sections/xat/components/PaginaCopiaSeguretatXat.jsx';
import CalendariAgricolaLlavorsView, { esAckPositiuSubscripcio } from '../src/sections/patrimoni/CalendariAgricolaLlavorsView.jsx';
import VistaBurocracia from '../src/sections/gestoria/vistes/VistaBurocracia.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function creaDriverIdbMemoria() {
  let desat = null;
  const driver = {
    open() {
      const req = {};
      queueMicrotask(() => {
        req.result = {
          objectStoreNames: { contains: () => true },
          close() {},
          transaction() {
            const tx = {};
            tx.objectStore = () => ({
              get() {
                const g = {};
                queueMicrotask(() => { g.result = desat; g.onsuccess?.(); });
                return g;
              },
              put(val) {
                desat = val;
                queueMicrotask(() => { tx.oncomplete?.(); });
              }
            });
            return tx;
          }
        };
        req.onsuccess?.();
      });
      return req;
    }
  };
  return { driver, getDesat: () => desat };
}

describe('Lot G9 · Codex revisio_g6_costures (P1 + P2)', () => {
  test('P1 · primera importació d’una làpida normalitza i buida cos i adjunts abans de desar', async () => {
    const { driver, getDesat } = creaDriverIdbMemoria();
    const rebut = await restauraCopiaLocal(
      {
        fils: [{ id: 'f-1' }],
        missatges: [{
          id: 'm-lapida-1',
          filId: 'f-1',
          esborrat: true,
          text: 'TEXT_PRIVAT_ESBORRAT',
          content: 'CONTINGUT_PRIVAT',
          adjunts: [{ id: 'a-1', url: 'blob:privat' }],
          metadades: { adjunt: { id: 'a-1' }, etiqueta: 'ok' }
        }]
      },
      { abast: { usuariId: 'u-1', tenantId: 't-1' }, indexedDB: driver }
    );
    expect(rebut.durable).toBe(true);
    const guardat = getDesat().missatges[0];
    expect(guardat.esborrat).toBe(true);
    expect(guardat.text).toBe('');
    expect(guardat.content).toBe('');
    expect(guardat.adjunts).toBeUndefined();
    expect(guardat.metadades?.adjunt).toBeUndefined();
  });

  test('P2 · CalendariAgricola rebutja absent, false, Promise(false) i ACK obsolet; només activa amb ACK positiu', async () => {
    expect(esAckPositiuSubscripcio(false, true)).toBe(false);
    expect(esAckPositiuSubscripcio(null, true)).toBe(false);
    expect(esAckPositiuSubscripcio(undefined, true)).toBe(false);
    expect(esAckPositiuSubscripcio({ ok: true, activa: false }, true)).toBe(false);
    expect(esAckPositiuSubscripcio({ ok: true, activa: true, comarca: 'La Safor' }, true, { comarca: 'El Comtat' })).toBe(false);
    expect(esAckPositiuSubscripcio({ ok: true, activa: true, comarca: 'El Comtat', cultiu: 'tomaques' }, true, { comarca: 'El Comtat', cultiu: 'tomaques' })).toBe(true);

    // 1) Callback absent: botó desactivat i avís honest
    const v1 = render(<CalendariAgricolaLlavorsView />);
    const b1 = screen.getByRole('button', { name: 'Activa recordatori local' });
    expect(b1.disabled).toBe(true);
    expect(screen.getByText(/requerixen un compte connectat/i)).toBeTruthy();
    v1.unmount();

    // 2) Retorn síncron false i Promise.resolve(false): mai anuncia activat
    const onCanvi = vi.fn()
      .mockReturnValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce({ ok: true, activa: true });
    render(<CalendariAgricolaLlavorsView onCanviSubscripcio={onCanvi} />);
    const boto = screen.getByRole('button', { name: 'Activa recordatori local' });

    await act(async () => { fireEvent.click(boto); });
    expect(boto.getAttribute('aria-pressed')).toBe('false');
    expect(screen.queryByText(/Recordatori local actiu/)).toBeNull();

    await act(async () => { fireEvent.click(boto); });
    expect(boto.getAttribute('aria-pressed')).toBe('false');
    expect(screen.queryByText(/Recordatori local actiu/)).toBeNull();

    await act(async () => { fireEvent.click(boto); });
    expect(boto.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Recordatori local actiu/)).toBeTruthy();
  });
});

describe('Lot G9 · Esmena G2-04 i claus 5L MarIA 11:00 CET', () => {
  test('G2-04 · VistaBurocracia calcula data mínima de conservació en passar dates.data', () => {
    render(<VistaBurocracia avui={() => new Date(2026, 3, 10)} idioma="ca" />);
    expect(screen.queryByText(/Falta la data per a calcular/)).toBeNull();
  });

  test('les 9 claus noves (PUB-D11-01, ENT0108-VS-03, XAT_ACCIO_INVALIDA, cerca conversa i OPFS iPad) estan traduïdes a les 5 llengües', () => {
    const claus = [
      'section.xat.conversa.cerca',
      'section.xat.error.accioInvalida',
      'section.multimedia.local.ipadImporta',
      'section.multimedia.local.ipadImportaAria',
      'section.multimedia.local.ipadNotaCopiaPrivada',
      'section.notes.visibilitat.errorPublicarDocument',
      'section.login.error.altesTancades',
      'section.login.error.compteSuspes',
      'section.login.error.confirmaCorreuGoogle'
    ];
    for (const clau of claus) {
      expect(typeof ca[clau]).toBe('string');
      expect(ca[clau].trim().length).toBeGreaterThan(5);
      for (const [nom, dic] of [['es', es], ['en', en], ['eu', eu], ['gl', gl]]) {
        expect(typeof dic[clau], `${nom}:${clau}`).toBe('string');
        expect(dic[clau].trim().length, `${nom}:${clau}`).toBeGreaterThan(5);
        expect(dic[clau], `${nom}:${clau} no pot quedar en valencià`).not.toBe(ca[clau]);
      }
    }
  });
});
