/**
 * Gauntlet 261016_1530 (Bloc 3.6.4; F66) · El flux sencer de l'entrada pilot
 * local, amb l'app de veres (PedraSecaEmbed) i l'adaptador de veres de
 * Supabase: SessionProvider → sessionService → identitat → sessioPilot.
 *
 * El cas del Mestre: localhost:3340/registre?mode=entrar en mode de proves,
 * amb el servidor del poble a http://127.0.0.1:54321 caigut. Ací el fetch fals
 * rebutja com ERR_EMPTY_RESPONSE i apunta cada petició:
 *   · l'única petició és la sonda de salut (/auth/v1/health), que diu que el
 *     servidor no respon;
 *   · «Entra com a persona pilot» obri la sessió de prova i aterra a la pròpia
 *     identitat (/el-meu-perfil), amb la persona pilot, i des del clic ja no
 *     ix CAP petició: ni per a entrar, ni per al rol, ni per a pintar el perfil;
 *   · en remot, la mateixa pàgina no l'oferix: l'entrada continua sent la real.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { esborraSessio, usuariDeSessio } from '../data/identitat.js';
import { getSessionState } from '../data/sessionService.js';
import { PERSONA_PILOT } from '../data/identitatsSeed.js';
import { RUTA_DESPRES_D_ENTRAR } from '../config/rutaEntrada.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
/* Gauntlet 261025_0545 (DF-03) · L'adaptador de veres ja no s'importa ací: el
   carrega host.arrenca(), l'única porta cap a src/data/supabase (tractor-enxufe
   E1). A Vitest l'espai de noms del mòdul porta getters i el port exigix
   mètodes: la còpia plana d'abans la fa ara este mock, sense canviar cap mètode. */
vi.mock('../data/supabase/index.js', async (importOriginal) => ({ ...await importOriginal() }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const SERVIDOR = 'http://127.0.0.1:54321';
const TENANT = '00000000-0000-4000-8000-0000000000f6';
const CONFIG = Object.freeze({
  routerType: 'browser', supabaseUrl: SERVIDOR, supabaseAnonKey: 'sb_publishable_prova_pilot', tenantId: TENANT
});
const ESPERA = { timeout: 10000 };
const BOTO = 'Entra com a persona pilot';

afterEach(() => {
  cleanup();
  esborraSessio({ abast: 'tot' });
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* L'app sencera, en `dataMode`, amb l'adaptador de veres i el servidor caigut. */
async function muntaLApp(dataMode, cos) {
  vi.stubGlobal('innerWidth', 1280);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  const xarxa = vi.fn(async (url) => {
    if (String(url).startsWith('/__iaia/')) return { status: 404, ok: false, statusText: 'Not Found' };
    throw new TypeError('Failed to fetch');
  });
  vi.stubGlobal('fetch', xarxa);
  /* Gauntlet 261025_0545 (DF-03) · Com en producció: l'host de veres (l'app
     continua veient el simulat de dalt) posa l'adaptador al port i el segella.
     És idempotent: les dues proves compartixen el mateix adaptador. */
  const { arrenca } = await vi.importActual('../host.js');
  await arrenca();
  window.history.replaceState(null, '', '/registre?mode=entrar');
  try {
    render(<PedraSecaEmbed config={{ ...CONFIG, dataMode }} />);
    await cos(xarxa);
  } finally {
    cleanup();
  }
}

/* Les peticions al servidor del poble, com a camí (sense l'origen). */
const peticionsAlServidor = (xarxa) => xarxa.mock.calls
  .map(([url]) => String(url))
  .filter((url) => url.startsWith(SERVIDOR))
  .map((url) => url.slice(SERVIDOR.length).split('?')[0]);

describe('F66 · l’entrada pilot local, de punta a punta', () => {
  test('seed · amb el servidor caigut, entra com a persona pilot sense cap petició i aterra al seu perfil', async () => {
    await muntaLApp('seed', async (xarxa) => {
      const avis = await screen.findByText(/El servidor del poble no respon ara mateix/, undefined, ESPERA);
      expect(avis.closest('[role="status"]')).not.toBeNull();
      // Fins ací, només la sonda de salut: cap petició d'entrada ni de dades.
      expect(peticionsAlServidor(xarxa).length).toBeGreaterThan(0);
      expect(new Set(peticionsAlServidor(xarxa))).toEqual(new Set(['/auth/v1/health']));
      expect(screen.queryByRole('button', { name: 'Forçar entrada local (Mock)' })).toBeNull();

      const boto = screen.getByRole('button', { name: BOTO });
      expect(boto.closest('.sdp-alerta').textContent).toContain('només viu en esta pestanya d’aquest ordinador');
      // El literal de l'encàrrec, sencer, al títol del bloc.
      expect(screen.getByText('Entra com a persona pilot · només en aquest ordinador').closest('.sdp-alerta')).toBe(boto.closest('.sdp-alerta'));
      const abans = xarxa.mock.calls.length;
      await act(async () => { fireEvent.click(boto); });

      await waitFor(() => expect(window.location.pathname).toBe(RUTA_DESPRES_D_ENTRAR), ESPERA);
      await waitFor(() => expect(getSessionState()).toMatchObject({ estat: 'dins', rol: 'usuari' }), ESPERA);
      expect(getSessionState().usuari).toMatchObject({ user_metadata: { full_name: PERSONA_PILOT.nom } });
      expect(usuariDeSessio()?.app_metadata?.provider).toBe('pilot-local');
      // El perfil propi pinta la persona pilot.
      await waitFor(() => expect(screen.getAllByText(PERSONA_PILOT.nom).length).toBeGreaterThan(0), ESPERA);
      // Des del clic, ni una petició: ni entrada, ni rol, ni perfil.
      await act(async () => { await new Promise((resol) => { setTimeout(resol, 50); }); });
      expect(xarxa.mock.calls.slice(abans).map(([url]) => String(url))).toEqual([]);
    });
  }, 30000);

  /* Encàrrec 261018_1220 (Tasques 0 i 2) · En remot continua sense haver-hi
     cap entrada pilot directa. En desenvolupament (Vitest ho és) hi ha l'accés
     que passa la pestanya al mode de proves: el seu clic el prova
     OnboardingSection.pilot.test.jsx, perquè recarrega el document. */
  test('negativa · en remot la mateixa pàgina no oferix l’entrada pilot directa i el formulari real està obert', async () => {
    await muntaLApp('remote', async (xarxa) => {
      const contrasenya = await screen.findByLabelText('Contrasenya', undefined, ESPERA);
      await act(async () => { await new Promise((resol) => { setTimeout(resol, 50); }); });
      expect(contrasenya.disabled).toBe(false);
      expect(screen.queryByRole('button', { name: BOTO })).toBeNull();
      expect(screen.queryByText('Entra com a persona pilot · només en aquest ordinador')).toBeNull();
      const acces = screen.getByRole('button', { name: `Entra com a ${PERSONA_PILOT.nom}` });
      expect(acces.closest('.sdp-alerta').textContent).toContain('Accés pilot de desenvolupament');
      expect(acces.closest('.sdp-alerta').textContent).toContain('es recarrega en mode de proves');
      expect(usuariDeSessio()).toBeNull();
      // En remot /registre no sonda ni entra sola: cap petició d'entrada.
      expect(peticionsAlServidor(xarxa).filter((ruta) => ruta.startsWith('/auth/v1/token'))).toEqual([]);
      const formulari = contrasenya.closest('form');
      expect(within(formulari).getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
    });
  }, 30000);
});
