/* T1 i T4 (Acta 261005_0445 §3, «crash de useSession en eixir des de
   Control»; auditoria de Fable 261005_1211 §2, T1-02) · «Eixir del poble»
   de veres: el botó real del Panell → useEixidaSegura → useSession →
   SessionContext.logout (eixDeLaSessio) → el port → /registre.

   Les altres proves del Panell (ControlSection.test.jsx,
   ControlSection.eixida.test.jsx, ControlSection.espais.test.jsx)
   substituïxen EixidaSegura i pinten sense SessionProvider; esta no. L'arbre
   calca PedraSecaEmbed.jsx:261-281 i App.jsx:676-681, 737 i 784-800, sense la
   closca (AppShell) ni els proveïdors de dades: ErrorBoundary > MemoryRouter >
   UIProvider > SessionProvider > StrictMode > NotificationProvider >
   RouteErrorBoundary (resetKey = camí) > Suspense > Routes. /control i
   /registre són les rutes REALS per lazyRoute, com App.jsx:44-45 i :797-800:
   ControlSection i OnboardingSection, que crida useSession
   (OnboardingSection.jsx:83) i és l'únic chunk lazy que es carrega en eixir.

   Només se simulen el port (backendPort.js: logout, teCapacitat i
   getCurrentUser; la resta, de veres), el servei de sessió
   (sessionService.js), com a SessionContext.test.jsx, i host.js. El logout
   simulat fa el que fa l'adaptador de Supabase (supabase/auth.js:856-865):
   buida la sessió i ho avisa ABANS del primer await, de manera que el
   proveïdor es torna a pintar amb la sessió nul·la mentre l'eixida encara
   espera. El port de host.js no arriba mai a estar llest: en llavor,
   OnboardingSection decidiria l'entrada (enterRemoteMode, dataMode.js:36-43),
   que desa l'elecció remota per a la prova següent i recarrega la pàgina.

   Revisió adversarial (261006) · Una fallada de la ruta lazy (LazyRouteError,
   lazyRoute.js:16) no s'amaga darrere d'un timeout: cada espera, també la de
   la ubicació /registre, falla quan apareix una frontera, amb el <pre>, la
   causa (error.cause) i el component stack de React.

   Abast · La prova acredita que el crash no naix d'esta capa només per a
   l'arbre muntat en llavor (dataMode 'seed'), en memòria (MemoryRouter; el
   lloc propi usa BrowserRouter, main.jsx:30 i PedraSecaEmbed.jsx:279) i amb
   un sol graf de mòduls de vitest, és a dir, una sola instància de
   SessionContext.jsx. No cobrix una hipòtesi que dona exactament el mateix
   missatge: al servidor de Vite en desenvolupament, el chunk lazy
   d'OnboardingSection carregat després d'una actualització HMR, o servit per
   un servidor ranci, pot importar una segona instància de SessionContext.jsx,
   amb un segon createContext (SessionContext.jsx:11) que no és el que
   proveïx l'arbre. Per construcció, ací no es pot reproduir. Es comprova
   repetint l'eixida des de Control amb el servidor de desenvolupament fresc
   (arrencat de nou, sense cap HMR pel mig) o amb el paquet IIFE construït
   (vite.standalone.config.js:451), que té un sol graf. Si el crash només
   apareix amb el servidor ranci o després d'un HMR, la causa és la instància
   doble i no el codi. */
import { StrictMode, Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => {
  const DINS = Object.freeze({ usuari: Object.freeze({ id: 'U' }), estat: 'dins', rol: 'usuari', generacio: 1 });
  const FORA = Object.freeze({ usuari: null, estat: 'fora', rol: null, generacio: 2 });
  const sessio = { estat: DINS, oients: new Set() };
  /* Com notify() de sessionService.js:33: tots els oients, síncronament. */
  const emet = (nou) => {
    sessio.estat = nou;
    for (const oient of [...sessio.oients]) oient(nou);
  };
  return { DINS, FORA, sessio, emet, logout: vi.fn() };
});

vi.mock('../../data/sessionService.js', () => ({
  getSessionState: () => m.sessio.estat,
  /* Com sessionService.js:28-32: l'oient rep l'estat en subscriure's. */
  subscribeSession: (oient) => {
    m.sessio.oients.add(oient);
    oient(m.sessio.estat);
    return () => { m.sessio.oients.delete(oient); };
  },
  setSessionConfig: () => () => {},
  renovaAra: vi.fn()
}));

vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  /* Cap capacitat opcional: ni recuperació de contrasenya ni directori. */
  teCapacitat: () => false,
  /* La sessió viva del port, per a la cua d'autodesament (ambit.js:29-33). */
  getCurrentUser: () => m.sessio.estat.usuari,
  logout: (...args) => m.logout(...args)
}));

/* El port encara no és llest: OnboardingSection.jsx:172-178 no decidix l'entrada. */
vi.mock('../../host.js', () => ({ quanLlest: () => new Promise(() => {}) }));

import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext';
import { SessionProvider, useSession } from '../../app/contexts/SessionContext.jsx';
import { RouteErrorBoundary } from '../../app/RouteErrorBoundary.jsx';
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx';
import { NotificationProvider } from '../../components/universal/NotificationContext.jsx';
import { ERROR_EIXIDA, textPendentsEixida } from '../../components/universal/EixidaSegura.jsx';
import { lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
import { oblidaRecuperacioPendent } from '../../data/recuperacioPendent.js';

/* Les mateixes rutes lazy que App.jsx:44 i :45. */
const ControlSection = lazyRoute(() => import('./ControlSection'));
const OnboardingSection = lazyRoute(() => import('../onboarding/OnboardingSection'));

const CONFIG = Object.freeze({ supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', tenantId: '00000000-0000-4000-8000-000000000000' });
/* La capa d'interfície en llavor, sense xarxa. Ordre del Mestre (261007, C2) · El Panell ja no resol el xat
   corporatiu pel seu compte: el llig del proveïdor de l'app (ací, sense proveïdor, el de la llavor). */
const UI = Object.freeze({ dataMode: 'seed' });
/* Un canvi que el servidor no té: cap escriptor per a l'entitat (cua.js:216). */
const PENDENT = Object.freeze({ entitat: 'prova-sense-escriptor', id: 'jo', camps: Object.freeze(['lead']) });
/* Un text que només pinta OnboardingSection (OnboardingSection.jsx:408). */
const REGISTRE = 'Accés ràpid amb Google';

function Ubicacio() {
  const { pathname } = useLocation();
  return <output data-testid="ubicacio">{pathname}</output>;
}

/* No substituïx la ruta: dins del mateix element de /registre, diu la sessió
   que veu OnboardingSection (estat:usuari). */
function LecturaDeLaSessio() {
  const { estat, currentUser } = useSession();
  return <p data-testid="registre">{`${estat}:${currentUser?.id ?? 'ningú'}`}</p>;
}

/* Com AppDataLoader (App.jsx:737): la frontera es reinicia en canviar de camí. */
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
    </ErrorBoundary>
  );
}

const ubicacio = () => screen.getByTestId('ubicacio').textContent;
/* Un error porta la seua causa: LazyRouteError embolcalla el rebuig de l'import() (lazyRoute.js:16).
   L'objecte info que les fronteres passen a console.error (RouteErrorBoundary.jsx:20,
   ErrorBoundary.jsx:12) porta el component stack: diu quin component ha llançat. */
const textDe = (args) => args
  .map((arg) => {
    if (arg instanceof Error) return `${arg.message}\n${arg.cause?.message ?? ''}\n${arg.stack ?? ''}`;
    return typeof arg?.componentStack === 'string' ? arg.componentStack : String(arg);
  })
  .join(' ');
/* El que delataria el crash: el missatge de useSession o una frontera que ha capturat un error. */
const CRASH = /useSession ha de ser usat|\[RouteErrorBoundary\]|\[PedraSeca\] Error capturat/;
const errorsDelCrash = (espia) => espia.mock.calls.map(textDe).filter((text) => CRASH.test(text));
const FRONTERES = Object.freeze(['Hi ha hagut un problema', "No s'ha pogut carregar Sóc de Poble"]);
const fronteraCaiguda = () => FRONTERES.some((text) => screen.queryByText(text) !== null);

/* Espera `cerca` (una consulta getBy*), però si una frontera pinta el seu
   avís, falla en eixe moment amb el <pre> de la frontera i els console.error
   del crash, en lloc d'esgotar el timeout. Primera càrrega de la ruta lazy en
   fred: el mateix marge que App.test.jsx:98. */
async function esperaSenseFrontera(espia, cerca, timeout = 8000) {
  const trobat = await waitFor(() => (fronteraCaiguda() ? { caiguda: true } : { element: cerca() }), { timeout });
  if (trobat.caiguda) {
    const detall = [...document.querySelectorAll('pre')].map((pre) => pre.textContent).join('\n');
    throw new Error(`Una frontera ha capturat un error abans d'arribar a la vista.\n${detall}\n${errorsDelCrash(espia).join('\n---\n')}`);
  }
  return trobat.element;
}

const botoEixir = (espia) => esperaSenseFrontera(espia, () => screen.getByRole('button', { name: /Eixir del poble/ }));
const vistaDeRegistre = (espia) => esperaSenseFrontera(espia, () => screen.getByText(REGISTRE));
/* La navegació també passa per la frontera: si l'arbre cau entre el clic i
   /registre, falla amb la frontera i la causa, no amb «Unable to find ubicacio». */
const arribaARegistre = (espia) => esperaSenseFrontera(espia, () => {
  expect(ubicacio()).toBe('/registre');
  return ubicacio();
}, 3000);

function senseCrash(espia) {
  for (const text of FRONTERES) expect(screen.queryByText(text)).toBeNull();
  expect(screen.queryByText(ERROR_EIXIDA)).toBeNull();
  expect(errorsDelCrash(espia)).toEqual([]);
}

beforeEach(async () => {
  m.sessio.estat = m.DINS;
  m.sessio.oients.clear();
  m.logout.mockReset().mockImplementation(async () => {
    /* supabase/auth.js:856-865 · la sessió es buida i s'avisa abans del primer await. */
    m.emet(m.FORA);
    await Promise.resolve();
  });
  /* UIContext.jsx:68 crida matchMedia sense guarda; jsdom no en té. */
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
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

test('T1 · «Eixir del poble» de veres: tanca la sessió pel proveïdor, porta a /registre i res no queda fora de SessionProvider', async () => {
  const errors = vi.spyOn(console, 'error');
  pinta();
  fireEvent.click(await botoEixir(errors));
  await arribaARegistre(errors);
  expect(m.logout).toHaveBeenCalledTimes(1);
  expect(m.logout).toHaveBeenCalledWith(CONFIG, undefined);
  /* La ruta nova, la d'OnboardingSection, és dins del mateix proveïdor i ja veu la sessió tancada. */
  await vistaDeRegistre(errors);
  expect(screen.getByTestId('registre').textContent).toBe('fora:ningú');
  expect(screen.queryByRole('button', { name: /Eixir del poble/ })).toBeNull();
  senseCrash(errors);
}, 15000);

test('T1 · amb canvis que el servidor no té, «Eixir igualment» també arriba a /registre dins del proveïdor i oblida l’esborrany', async () => {
  const errors = vi.spyOn(console, 'error');
  pinta();
  const eixir = await botoEixir(errors);
  const ref = { ambit: ambitDe(CONFIG, 'U'), entitat: PENDENT.entitat, id: PENDENT.id, context: CONFIG };
  cuaDesament.encua(ref, 'lead', 'Encara no és al servidor');
  fireEvent.click(eixir);
  expect(await screen.findByText(textPendentsEixida([PENDENT]), {}, { timeout: 3000 })).toBeTruthy();
  expect(m.logout).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Eixir igualment' }));
  await arribaARegistre(errors);
  expect(m.logout).toHaveBeenCalledTimes(1);
  await vistaDeRegistre(errors);
  expect(screen.getByTestId('registre').textContent).toBe('fora:ningú');
  await waitFor(() => expect(cuaDesament.llig(ref).camps).toEqual({}));
  senseCrash(errors);
}, 15000);

test('T1 · si la sessió cau amb el Panell obert (una altra pestanya), el Panell continua i «Eixir del poble» encara porta a /registre', async () => {
  const errors = vi.spyOn(console, 'error');
  pinta();
  await botoEixir(errors);
  act(() => { m.emet(m.FORA); });
  expect(ubicacio()).toBe('/control');
  fireEvent.click(screen.getByRole('button', { name: /Eixir del poble/ }));
  await arribaARegistre(errors);
  expect(m.logout).toHaveBeenCalledTimes(1);
  await vistaDeRegistre(errors);
  expect(screen.getByTestId('registre').textContent).toBe('fora:ningú');
  senseCrash(errors);
}, 15000);
