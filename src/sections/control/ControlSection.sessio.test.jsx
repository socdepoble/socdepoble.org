/* T1 i T4 (Acta 261005_0445 §3) + Reforma IDEA-341 (R32.63) · Integració de
   ControlSection dins de l'arbre real de proveïdors (ErrorBoundary >
   MemoryRouter > UIProvider > SessionProvider > StrictMode >
   NotificationProvider > RouteErrorBoundary > Suspense > Routes) amb
   RequireAuth a `/el-meu-perfil` i OnboardingSection lazy real a `/registre`:
     1. Sense sessió iniciada, `/control` pinta el peu de «Filet pur i dur» i
        tocar «El meu perfil, contrasenya i dades a l’aparell» redirigix netament
        a `/registre` dins del mateix SessionProvider sense cap crash ni frontera.
     2. Amb sessió iniciada, tocar «El meu perfil, contrasenya i dades a l’aparell»
        aterra a `/el-meu-perfil?vista=compte` mantenint la sessió viva.
     3. Si la sessió cau amb el Panell obert (una altra pestanya), el Panell
        continua estable i tocar la fila del Perfil redirigix a `/registre` sense crash. */
import { StrictMode, Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => {
  const DINS = Object.freeze({ usuari: Object.freeze({ id: 'U' }), estat: 'dins', rol: 'usuari', generacio: 1 });
  const FORA = Object.freeze({ usuari: null, estat: 'fora', rol: null, generacio: 2 });
  const sessio = { estat: DINS, oients: new Set() };
  const emet = (nou) => {
    sessio.estat = nou;
    for (const oient of [...sessio.oients]) oient(nou);
  };
  return { DINS, FORA, sessio, emet, logout: vi.fn() };
});

vi.mock('../../data/sessionService.js', () => ({
  getSessionState: () => m.sessio.estat,
  subscribeSession: (oient) => {
    m.sessio.oients.add(oient);
    oient(m.sessio.estat);
    return () => { m.sessio.oients.delete(oient); };
  },
  setSessionConfig: () => () => {},
  renovaAra: vi.fn(),
}));

vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
  getCurrentUser: () => m.sessio.estat.usuari,
  logout: (...args) => m.logout(...args),
}));

vi.mock('../../host.js', () => ({ quanLlest: () => new Promise(() => {}) }));

import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext';
import { SessionProvider, useSession } from '../../app/contexts/SessionContext.jsx';
import { RequireAuth } from '../../app/guards/RequireAuth.jsx';
import { RouteErrorBoundary } from '../../app/RouteErrorBoundary.jsx';
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx';
import { NotificationProvider } from '../../components/universal/NotificationContext.jsx';
import { lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { oblidaRecuperacioPendent } from '../../data/recuperacioPendent.js';
import { TEXTOS_PEU_CONTROL } from './textosPeuControl.js';

const ControlSection = lazyRoute(() => import('./ControlSection'));
const OnboardingSection = lazyRoute(() => import('../onboarding/OnboardingSection'));

const CONFIG = Object.freeze({ supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', tenantId: '00000000-0000-4000-8000-000000000000' });
const UI = Object.freeze({ dataMode: 'seed' });
const REGISTRE = 'Accés ràpid amb Google';

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

function LecturaDeLaSessio({ testId = 'registre' }) {
  const { estat, currentUser } = useSession();
  return <p data-testid={testId}>{`${estat}:${currentUser?.id ?? 'ningú'}`}</p>;
}

function Frontera({ children }) {
  const { pathname } = useLocation();
  return <RouteErrorBoundary resetKey={pathname} externalConfig={UI}>{children}</RouteErrorBoundary>;
}

function pinta() {
  return render(
    <ErrorBoundary>
      <MemoryRouter rutaInicial="/control">
        <UIProvider externalConfig={UI}>
          <SessionProvider config={CONFIG}>
            <StrictMode>
              <NotificationProvider>
                <Frontera>
                  <Suspense fallback={<p>Carregant la vista…</p>}>
                    <Routes>
                      <Route path="/control" element={<ControlSection />} />
                      <Route path="/el-meu-perfil" element={<RequireAuth><LecturaDeLaSessio testId="perfil-sessio" /></RequireAuth>} />
                      <Route path="/registre" element={<><OnboardingSection /><LecturaDeLaSessio /></>} />
                    </Routes>
                  </Suspense>
                </Frontera>
                <Ubicacio />
              </NotificationProvider>
            </StrictMode>
          </SessionProvider>
        </UIProvider>
      </MemoryRouter>
    </ErrorBoundary>,
  );
}

const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const textDe = (args) => args
  .map((arg) => {
    if (arg instanceof Error) return `${arg.message}\n${arg.cause?.message ?? ''}\n${arg.stack ?? ''}`;
    return typeof arg?.componentStack === 'string' ? arg.componentStack : String(arg);
  })
  .join(' ');
const CRASH = /useSession ha de ser usat|\[RouteErrorBoundary\]|\[PedraSeca\] Error capturat/;
const errorsDelCrash = (espia) => espia.mock.calls.map(textDe).filter((text) => CRASH.test(text));
const FRONTERES = Object.freeze(['Hi ha hagut un problema', "No s'ha pogut carregar Sóc de Poble"]);
const fronteraCaiguda = () => FRONTERES.some((text) => screen.queryByText(text) !== null);

async function esperaSenseFrontera(espia, cerca, timeout = 8000) {
  const trobat = await waitFor(() => (fronteraCaiguda() ? { caiguda: true } : { element: cerca() }), { timeout });
  if (trobat.caiguda) {
    const detall = [...document.querySelectorAll('pre')].map((pre) => pre.textContent).join('\n');
    throw new Error(`Una frontera ha capturat un error abans d'arribar a la vista.\n${detall}\n${errorsDelCrash(espia).join('\n---\n')}`);
  }
  return trobat.element;
}

const filaPerfil = (espia) => esperaSenseFrontera(espia, () => screen.getByRole('link', { name: TEXTOS_PEU_CONTROL.ca.perfilNom }));
const vistaDeRegistre = (espia) => esperaSenseFrontera(espia, () => screen.getByText(REGISTRE));
const arribaARegistre = (espia) => esperaSenseFrontera(espia, () => {
  expect(ubicacio().startsWith('/registre')).toBe(true);
  return ubicacio();
}, 3000);

function senseCrash(espia) {
  for (const text of FRONTERES) expect(screen.queryByText(text)).toBeNull();
  expect(errorsDelCrash(espia)).toEqual([]);
}

beforeEach(async () => {
  m.sessio.estat = m.DINS;
  m.sessio.oients.clear();
  m.logout.mockReset();
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
  oblidaRecuperacioPendent();
  await cuaDesament.reinicia();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  oblidaRecuperacioPendent();
});

test('T1 · IDEA-341 · amb sessió, la fila del Perfil al peu de /control aterra a /el-meu-perfil?vista=compte dins del SessionProvider', async () => {
  const errors = vi.spyOn(console, 'error');
  pinta();
  fireEvent.click(await filaPerfil(errors));
  await esperaSenseFrontera(errors, () => expect(ubicacio()).toBe('/el-meu-perfil?vista=compte'));
  expect(screen.getByTestId('perfil-sessio').textContent).toBe('dins:U');
  senseCrash(errors);
}, 15000);

test('T1 · IDEA-341 · sense sessió, /control continua obert sense guarda i la fila del Perfil porta a /registre amb OnboardingSection dins del mateix proveïdor', async () => {
  m.sessio.estat = m.FORA;
  const errors = vi.spyOn(console, 'error');
  pinta();
  fireEvent.click(await filaPerfil(errors));
  await arribaARegistre(errors);
  await vistaDeRegistre(errors);
  expect(screen.getByTestId('registre').textContent).toBe('fora:ningú');
  senseCrash(errors);
}, 15000);

test('T1 · IDEA-341 · si la sessió cau amb el Panell obert (una altra pestanya), el Panell continua estable i la fila del Perfil porta a /registre sense crash', async () => {
  const errors = vi.spyOn(console, 'error');
  pinta();
  await filaPerfil(errors);
  act(() => { m.emet(m.FORA); });
  expect(ubicacio()).toBe('/control');
  fireEvent.click(screen.getByRole('link', { name: TEXTOS_PEU_CONTROL.ca.perfilNom }));
  await arribaARegistre(errors);
  await vistaDeRegistre(errors);
  expect(screen.getByTestId('registre').textContent).toBe('fora:ningú');
  senseCrash(errors);
}, 15000);
