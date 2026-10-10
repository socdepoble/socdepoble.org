/* T3 · Les apps locals s'obrin sense sessió (pas 4.1 del pla 261005_1303,
   línies 57-58; prompt 261006_0224, T3; aprovat al pla 261006_0224, «Canvis
   proposats», punt 3). Arbre real: PedraSecaEmbed > SessionProvider > App >
   AppShell > AppRoutes, amb router de navegador sobre la URL de jsdom, com
   App.test.jsx i plataforma/integracioApp.test.jsx.

   Què diu el codi (cartografia del 261006, abans de cap canvi):
   · «App local» = app interna de la Plataforma d'Apps que es veu sense
     sessió. Ho diu el seu manifest: permisos.veure 'public' i l'entrada sense
     `permis` (manifestApp.js:39 i :139). GuardaPermis (RutaApps.jsx:33-36)
     només embolica amb RequireAuth el que demana 'sessio' o 'superadmin'. Hui
     ho són totes les internes: Gestoria, El Bar (el TPV de la llavor La
     Parròquia), La Nevera de Casa, Notícies del Poble i Salut. Salut, a més,
     només s'obri si l'App és l'ama del document (interruptors.js:67): ací es
     munta amb manageDocumentHead, com el lloc propi (main.jsx:28).
   · Cap app importa el backend ni useSession (plataforma/fronteres.test.js,
     Model B); la Gestoria tampoc (gestoria/privacitat.test.js): llig
     IndexedDB local i els fitxers que tria la persona.
   · RequireAuth només embolica /admin/* (App.jsx:789), /el-meu-perfil (:838)
     i /consola/* fora de vite serve (:776-778, guardaConsola.js). /control
     no porta cap guarda (:800): sense sessió es pinta el Panell.
   La reproducció ho confirma: sense sessió, /app/gestoria ja es muntava a
   vite serve, sense portar a /registre. Estes proves ho fixen perquè cap
   canvi de guarda ho trenque, i fixen que les rutes amb guarda continuen
   exactament igual.

   Segona onada (261006, correccions de l'escèptic de la primera):
   · D2 · La closca corre en els tres modes de dades (MODES), no només en
     el remot que pren per defecte (backendConfig.js:19).
   · D3 · Cap llista blanca: el conjunt EXACTE de mètodes del port cridats
     sense sessió, per mode (CRIDES_SENSE_SESSIO).
   · D5 · /control espera el Panell de veres (la secció «Maquinària i
     Sistema» de ControlSection.jsx).
   · D1 · El clic al titular en un mode local es fixa com a [DEFECTE D1]
     (convenció de tests/porta-olivera-diagnosi.test.mjs:8-11): passa hui
     perquè afirma el comportament actual, i la reparació l'ha d'invertir.

   Tercera onada (261006, correcció de l'escèptic de la segona):
   · D1 · També amb la capacitat 'salut', que és la branca del lloc propi:
     sense backend injectat, host.js:156-157 instal·la l'adaptador Supabase,
     que exporta comprovaServidor (supabase/index.js:29). L'entrada sonda
     abans (OnboardingSection.jsx:172-178) i només canvia de mode si el
     servidor respon (:151-166). La prova de control en remot porta
     «[CONTROL]» al títol (tests/porta-olivera-diagnosi.test.mjs:10). */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState, sincronitza } from '../data/sessionService.js';
import { APPS_INTERNES } from '../apps/plataforma/registreApps.js';
import { rutaDeApp } from '../apps/plataforma/manifestApp.js';
import { RUTA_ENTRADA } from '../config/rutaEntrada.js';
import { oblidaRecuperacioPendent } from '../data/recuperacioPendent.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

/* Cap peça no ha de passar a l'entrada real (que desa l'elecció i recarrega la pàgina). */
const dades = vi.hoisted(() => ({ enterRemoteMode: null }));
vi.mock('../config/dataMode.js', async (importOriginal) => {
  const real = await importOriginal();
  dades.enterRemoteMode = vi.fn();
  return { ...real, enterRemoteMode: (...args) => dades.enterRemoteMode(...args) };
});

/* Un build (DEV false) per a la Consola, com App.test.jsx:28-32. */
const guarda = vi.hoisted(() => ({ produccio: false }));
vi.mock('./guards/guardaConsola.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, consolaDemanaSessio: (dev) => guarda.produccio || real.consolaDemanaSessio(dev) };
});

/* D2 · Els tres modes de dades (dataMode.js:25). 'remote' és el que pren el
   paquet sense VITE_DATA_MODE (backendConfig.js:19); 'seed' i 'local' són els
   modes locals (dataMode.js:4), el «Mode Local» de la Fase 4: la closca s'obri
   en local i sense connexió de xarxa al backend. Al lloc propi el mode arriba
   per la capa del paquet (main.jsx:20-25); ací, amb host.js simulat, per la
   config del muntatge, com App.test.jsx:673-685. */
const MODES = Object.freeze(['remote', 'seed', 'local']);

/* D3 · El conjunt EXACTE de mètodes del port que la closca crida sense sessió,
   observat el 261006 a totes les apps locals (és el mateix per a totes: cap
   app no crida el port, plataforma/fronteres.test.js). Qualsevol altre mètode
   del contracte (organitzacions, perfil, missatges, escriptures, entrades)
   faria 42501 sense sessió, i una lectura de més de la closca també fa roig.
   · En els tres modes: getCurrentUser (sessió), getDefaultUserId
     (IdentitatContext.jsx:65), getRuntimeDataMode (NotesDataContext.jsx:264) i
     les lectures públiques dels proveïdors (AppContent, a App.jsx):
     loadCoreContent, loadMur i loadMultimedia.
   · Només en remot: recullTornadaOAuth (App.jsx, l'efecte que la guarda amb
     modeRemot).
   · Només en els modes locals: les notes i els fils del convidat local
     (NotesDataContext.jsx:263-285 i XatContext.jsx:230-231), mai d'un compte. */
const COMUNES = ['getCurrentUser', 'getDefaultUserId', 'getRuntimeDataMode', 'loadCoreContent', 'loadMur', 'loadMultimedia'];
const DEL_CONVIDAT_LOCAL = ['loadNotes', 'loadFils'];
const CRIDES_SENSE_SESSIO = Object.freeze({
  remote: [...COMUNES, 'recullTornadaOAuth'].sort(),
  seed: [...COMUNES, ...DEL_CONVIDAT_LOCAL].sort(),
  local: [...COMUNES, ...DEL_CONVIDAT_LOCAL].sort()
});
/* Sense sessió, el port real torna el convidat (identitat.js:421-427), no null. */
const CONVIDAT = 'convidat-t3';

/* L'app local, tal com la definix el seu manifest (GuardaPermis, RutaApps.jsx:33-36). */
const esPublic = (permis) => !permis || permis === 'public';
const entradaPerDefecte = (app) => app.entrades.find((entrada) => entrada.slug === app.entradaPerDefecte);
const APPS_LOCALS = APPS_INTERNES.filter((app) => esPublic(app.permisos.veure) && esPublic(entradaPerDefecte(app).permis));

/* El lloc propi (main.jsx:26-30): router de navegador i ama del document. */
const DEL_LLOC = Object.freeze({ routerType: 'browser', manageDocumentHead: true });
const USUARI = Object.freeze({ id: 'u-t3', user_metadata: Object.freeze({ full_name: 'Pepa Soler' }) });

afterEach(() => {
  cleanup();
  guarda.produccio = false;
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  oblidaRecuperacioPendent();
});

/**
 * Munta l'App sencera a `ruta`. `usuari`: null (sense sessió) o el compte.
 * `dataMode`: el mode de dades de la closca (MODES); el port diu el mateix.
 * `backend`: substitucions del port (p. ex., un servidor que no respon).
 * `capacitats`: mètodes de capacitats opcionals (CAPACITATS, contracte.js),
 * fora del nucli; sense ells, el port fals només és CONTRACTE_NUCLI.
 * Torna, dins de `cos`, els noms dels mètodes del port cridats i les peticions de xarxa.
 */
async function munta(ruta, cos, { usuari = null, backend = {}, capacitats = {}, dataMode = 'remote' } = {}) {
  vi.stubGlobal('innerWidth', 1024);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  const xarxa = vi.fn(async (url) => { throw new Error('Xarxa inesperada: ' + url); });
  vi.stubGlobal('fetch', xarxa);
  dades.enterRemoteMode = vi.fn();
  const crides = [];
  const propis = {
    getCurrentUser: () => usuari,
    getRuntimeDataMode: () => dataMode,
    getBackendConfigurat: () => true,
    getDefaultUserId: () => usuari?.id ?? CONVIDAT,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    listMyOrganizations: async () => [],
    ...backend,
    ...capacitats
  };
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation(Object.fromEntries([...CONTRACTE_NUCLI, ...Object.keys(capacitats)].map((nom) => [nom, (...args) => {
    crides.push(nom);
    return propis[nom] ? propis[nom](...args) : Promise.resolve(null);
  }])));
  /* L'estat de sessionService és de mòdul: amb compte, se sincronitza abans de muntar (App.test.jsx:424-426). */
  if (usuari) sincronitza();
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ ...DEL_LLOC, dataMode }} />);
    await waitFor(() => expect(getSessionState().estat).toBe(usuari ? 'dins' : 'fora'));
    await cos({ crides, xarxa });
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

const contenidor = (id) => document.querySelector(`.sdp-app-contenidor[data-sdp-app="${id}"]`);
/* L'app ja pintada: el seu H1, dins del contenidor (el component és lazy()). */
const h1DeLApp = (id) => waitFor(() => {
  const h1 = contenidor(id)?.querySelector('h1');
  expect(h1).not.toBeNull();
  return h1;
}, { timeout: 8000 });
/* Qualsevol app ja muntada: el component lazy() ha substituït la càrrega de
   la plataforma (RutaApps.jsx:48, un Carregant .sdp-carregant), que és el
   primer fill del contenidor mentre el tros no arriba. */
const appMuntada = (id) => waitFor(() => {
  const arrel = contenidor(id);
  expect(arrel?.firstElementChild).toBeTruthy();
  expect(arrel.firstElementChild.classList.contains('sdp-carregant')).toBe(false);
  expect(within(arrel).queryByText('Carregant l’app…')).toBeNull();
  return arrel;
}, { timeout: 8000 });
const tornar = () => new URLSearchParams(window.location.search).get('tornar');
const conjuntDeCrides = (crides) => [...new Set(crides)].sort();
/* Els proveïdors carreguen en efectes: s'espera que el conjunt arribe, i al
   final de cada prova es torna a comprovar que no n'ha entrat cap altre. */
const esperaElConjunt = (crides, mode) => waitFor(() => expect(conjuntDeCrides(crides)).toEqual(CRIDES_SENSE_SESSIO[mode]));

function senseCapBarrera() {
  expect(window.location.pathname).not.toBe(RUTA_ENTRADA);
  expect(screen.queryByText('Accés restringit')).toBeNull();
  expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();
  expect(screen.queryByText("No s'ha pogut carregar Sóc de Poble")).toBeNull();
  expect(screen.queryByRole('status', { name: /Comprovant la sessió/ })).toBeNull();
}

test('hi ha apps locals al paquet i la Gestoria n’és una', () => {
  expect(APPS_LOCALS.map((app) => app.id)).toContain('gestoria');
  expect(APPS_LOCALS.length).toBeGreaterThan(1);
});

/* Dins de l'app: /app/<id> es canonitza a una entrada i no ix de l'app. Cada
   app pot seguir canonitzant dins seu, amb replace, després de l'entrada per
   defecte: la Nevera hi posa la llista per defecte (AppNevera.jsx:92-99,
   /app/nevera/llista/casa) i Salut porta a l'avís de privacitat mentre no està
   acceptat (AppSalut.jsx:34, /app/salut/avis). Per això no s'espera el camí
   exacte de l'entrada per defecte: depenia de mirar abans d'eixe replace. */
const dinsDeLApp = (id) => expect(window.location.pathname.startsWith(rutaDeApp(id) + '/')).toBe(true);

const APPS_PER_MODE = MODES.flatMap((mode) => APPS_LOCALS.map((app) => [app.id, mode]));
test.each(APPS_PER_MODE)('sense sessió, /app/%s es munta sencera en mode %s i no porta a /registre', async (id, mode) => {
  const errors = vi.spyOn(console, 'error');
  await munta(rutaDeApp(id), async ({ crides, xarxa }) => {
    await waitFor(() => dinsDeLApp(id));
    await appMuntada(id);
    await esperaElConjunt(crides, mode);
    senseCapBarrera();
    dinsDeLApp(id);
    expect(xarxa).not.toHaveBeenCalled();
    expect(dades.enterRemoteMode).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(conjuntDeCrides(crides)).toEqual(CRIDES_SENSE_SESSIO[mode]);
  }, { dataMode: mode });
}, 15000);

test.each(MODES)('sense sessió, en mode %s, la Gestoria de veres: el Tauler, la boina sense titular i cap crida de més', async (mode) => {
  await munta('/app/gestoria', async ({ crides, xarxa }) => {
    expect((await h1DeLApp('gestoria')).textContent).toBe('Tauler Central');
    expect(window.location.pathname).toBe('/app/gestoria/tauler');
    expect(await screen.findByText('Cal aprovar el tractor')).toBeTruthy();
    expect(within(contenidor('gestoria')).getAllByText('Titular sense configurar').length).toBeGreaterThan(0);
    /* La barra de l'app relleva la de Sóc de Poble: les deu entrades, cap «Entrar» dins de l'app. */
    const barra = screen.getByRole('navigation', { name: 'Navegació principal' });
    expect(within(barra).getByRole('link', { name: 'Aprendre' }).getAttribute('href')).toBe('/app/gestoria/aprendre');
    fireEvent.click(within(barra).getByRole('link', { name: 'Full trimestral' }));
    await waitFor(() => expect(window.location.pathname).toBe('/app/gestoria/full'));
    expect((await h1DeLApp('gestoria')).textContent).toBe('Full trimestral');
    await esperaElConjunt(crides, mode);
    senseCapBarrera();
    expect(xarxa).not.toHaveBeenCalled();
    expect(dades.enterRemoteMode).not.toHaveBeenCalled();
    expect(conjuntDeCrides(crides)).toEqual(CRIDES_SENSE_SESSIO[mode]);
  }, { dataMode: mode });
}, 15000);

/* El servidor no respon: totes les lectures del port fallen com un fetch sense
   xarxa. En els modes locals és el cas de la Fase 4 (sense connexió al backend). */
test.each(MODES)('sense sessió, en mode %s i amb el servidor caigut, la Gestoria s’obri igual: cap recàrrega ni entrada real', async (mode) => {
  const caigut = async () => { throw new TypeError('Failed to fetch'); };
  await munta('/app/gestoria/tauler', async ({ crides, xarxa }) => {
    expect((await h1DeLApp('gestoria')).textContent).toBe('Tauler Central');
    expect(await screen.findByText('Cal aprovar el tractor')).toBeTruthy();
    await esperaElConjunt(crides, mode);
    senseCapBarrera();
    expect(window.location.pathname).toBe('/app/gestoria/tauler');
    expect(xarxa).not.toHaveBeenCalled();
    expect(dades.enterRemoteMode).not.toHaveBeenCalled();
    expect(conjuntDeCrides(crides)).toEqual(CRIDES_SENSE_SESSIO[mode]);
  }, {
    dataMode: mode,
    backend: { loadCoreContent: caigut, loadMur: caigut, loadNotes: caigut, loadMultimedia: caigut, loadFils: caigut }
  });
}, 15000);

/* L'única porta de la Gestoria cap a /registre és un clic de la persona: el
   nom de la boina enllaça al perfil propi (ShellGestoria.jsx:54, RUTA_TITULAR),
   que sí que porta guarda (App.jsx:838). Es fixa tal com és: canviar-ho és
   decisió del Mestre. En remot, l'entrada no canvia de mode: és el [CONTROL]
   de les proves [DEFECTE D1] de més avall. */
test('[CONTROL] sense sessió, en mode remote, només el clic al titular de la boina porta a /registre (el perfil propi té guarda)', async () => {
  await munta('/app/gestoria/tauler', async () => {
    await h1DeLApp('gestoria');
    const titular = within(contenidor('gestoria')).getAllByRole('link').find((enllac) => enllac.textContent.includes('Titular sense configurar'));
    expect(titular?.getAttribute('href')).toBe('/el-meu-perfil');
    expect(window.location.pathname).toBe('/app/gestoria/tauler');
    fireEvent.click(titular);
    await waitFor(() => expect(window.location.pathname).toBe(RUTA_ENTRADA));
    expect(tornar()).toBe('/el-meu-perfil');
    /* L'entrada ja muntada (OnboardingSection.jsx:370-371): en remot no demana res. */
    expect(await screen.findByRole('heading', { name: 'Benvinguda al Mas Electrònic' }, { timeout: 8000 })).toBeTruthy();
    expect(dades.enterRemoteMode).not.toHaveBeenCalled();
  });
}, 15000);

/* [DEFECTE D1] (escèptic de la primera onada; auditoria Opus 261006_0025,
   «Troballa nova P2») · En un mode local, el mateix clic porta a /registre i
   OnboardingSection, en muntar-se, decidix l'entrada tota sola
   (OnboardingSection.jsx:123 i :182-187). La decisió depén de la capacitat
   'salut' del port (:172-178):
   · Sense 'salut' (un port de només CONTRACTE_NUCLI), demana l'entrada real
     directament.
   · Amb 'salut', que és la del lloc propi (host.js:156-157 instal·la
     l'adaptador Supabase, que exporta comprovaServidor, supabase/index.js:29;
     supabase/index.test.js:25-26), sonda abans el servidor: GET
     /auth/v1/health, i amb la xarxa caiguda { ok: false }
     (supabase/auth.js:352-368). Només demana l'entrada real si respon; si
     no, pinta l'avís de servidor caigut i no desa res ni recarrega
     (OnboardingSection.jsx:151-166 i :388-395).
   L'entrada real desa l'elecció remota i recarrega la pàgina (dataMode.js:36-43;
   dataMode.test.js:22-25). Estes proves PASSEN hui perquè afirmen eixe
   comportament; quan el Mestre decidisca la reparació, s'han d'invertir. No
   es toca OnboardingSection: és decisió pendent del Mestre. */
async function clicAlTitularFinsAlRegistre() {
  await h1DeLApp('gestoria');
  const titular = within(contenidor('gestoria')).getAllByRole('link').find((enllac) => enllac.textContent.includes('Titular sense configurar'));
  expect(dades.enterRemoteMode).not.toHaveBeenCalled();
  fireEvent.click(titular);
  await waitFor(() => expect(window.location.pathname).toBe(RUTA_ENTRADA));
  expect(tornar()).toBe('/el-meu-perfil');
  expect(await screen.findByRole('heading', { name: 'Benvinguda al Mas Electrònic' }, { timeout: 8000 })).toBeTruthy();
}
const AVIS_SERVIDOR_CAIGUT = /El servidor del poble no respon ara mateix/;

test.each(['local', 'seed'])('[DEFECTE D1] sense sessió, en mode %s i amb un port sense la capacitat ‘salut’, el clic al titular porta a /registre i l’entrada demana enterRemoteMode (la real desa l’elecció i recarrega)', async (mode) => {
  await munta('/app/gestoria/tauler', async ({ crides }) => {
    await clicAlTitularFinsAlRegistre();
    await waitFor(() => expect(dades.enterRemoteMode).toHaveBeenCalledTimes(1));
    expect(dades.enterRemoteMode).toHaveBeenCalledWith(expect.objectContaining({ dataMode: mode }));
    expect(crides).not.toContain('comprovaServidor');
  }, { dataMode: mode });
}, 15000);

test.each(['local', 'seed'])('[DEFECTE D1] sense sessió, en mode %s i amb la capacitat ‘salut’ del lloc propi, el clic al titular porta a /registre, sonda el servidor i, com que respon, l’entrada demana enterRemoteMode', async (mode) => {
  const sonda = vi.fn(async () => ({ ok: true }));
  await munta('/app/gestoria/tauler', async ({ xarxa }) => {
    await clicAlTitularFinsAlRegistre();
    await waitFor(() => expect(dades.enterRemoteMode).toHaveBeenCalledTimes(1));
    expect(dades.enterRemoteMode).toHaveBeenCalledWith(expect.objectContaining({ dataMode: mode }));
    expect(sonda).toHaveBeenCalledTimes(1);
    expect(sonda).toHaveBeenCalledWith(expect.objectContaining({ dataMode: mode }));
    expect(sonda.mock.invocationCallOrder[0]).toBeLessThan(dades.enterRemoteMode.mock.invocationCallOrder[0]);
    expect(screen.queryByText(AVIS_SERVIDOR_CAIGUT)).toBeNull();
    expect(xarxa).not.toHaveBeenCalled();
  }, { dataMode: mode, capacitats: { comprovaServidor: sonda } });
}, 15000);

test.each(['local', 'seed'])('[DEFECTE D1] sense sessió, en mode %s, amb la capacitat ‘salut’ del lloc propi i el servidor que no respon, el clic al titular porta a /registre i pinta l’avís de servidor caigut: cap enterRemoteMode ni recàrrega', async (mode) => {
  const sonda = vi.fn(async () => ({ ok: false }));
  await munta('/app/gestoria/tauler', async ({ xarxa }) => {
    await clicAlTitularFinsAlRegistre();
    expect(await screen.findByText(AVIS_SERVIDOR_CAIGUT, {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Torna-ho a provar' })).toBeTruthy();
    expect(sonda).toHaveBeenCalledTimes(1);
    expect(sonda).toHaveBeenCalledWith(expect.objectContaining({ dataMode: mode }));
    /* L'avís es pinta quan la sonda ja ha decidit (setServidorCaigut, :164): no queda cap canvi de mode pendent. */
    expect(dades.enterRemoteMode).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe(RUTA_ENTRADA);
    expect(xarxa).not.toHaveBeenCalled();
  }, { dataMode: mode, capacitats: { comprovaServidor: sonda } });
}, 15000);

test('amb sessió, la Gestoria es pinta igual que sense', async () => {
  /* Els id de useId (`:r3:`) depenen de l'ordre de muntatge de tot l'arbre, no de l'app. */
  const pintura = async () => {
    await h1DeLApp('gestoria');
    await screen.findByText('Cal aprovar el tractor');
    return contenidor('gestoria').innerHTML.replace(/:r[0-9a-z]+:/g, ':id:');
  };
  let senseSessio = null;
  await munta('/app/gestoria/tauler', async () => { senseSessio = await pintura(); });
  await munta('/app/gestoria/tauler', async () => {
    expect(await pintura()).toBe(senseSessio);
    expect(window.location.pathname).toBe('/app/gestoria/tauler');
    senseCapBarrera();
  }, { usuari: USUARI });
}, 20000);

/* La resta de rutes, exactament igual que abans d'este front. */
test.each(['/admin', '/el-meu-perfil'])('sense sessió, %s continua portant a /registre', async (ruta) => {
  await munta(ruta, async () => {
    await waitFor(() => expect(window.location.pathname).toBe(RUTA_ENTRADA));
    expect(tornar()).toBe(ruta);
  });
});

test('sense sessió i en un build (DEV false), /consola continua portant a /registre', async () => {
  guarda.produccio = true;
  await munta('/consola', async () => {
    await waitFor(() => expect(window.location.pathname).toBe(RUTA_ENTRADA));
    expect(tornar()).toBe('/consola');
  });
});

/* D5 · No n'hi ha prou amb l'aria-current de la barra (controlActiu, a
   App.jsx): es pinta per la ruta, encara que ControlSection no s'haja muntat. S'espera el
   Panell de veres: la secció «Maquinària i Sistema» (section.sdp-control-maquinaria
   de ControlSection.jsx) i «Eixir del poble» (el seu .sdp-control-actions), que
   només pinta PanellControl.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les cites
   portaven números de línia del Panell (373-374 i 408-416), que ja eren rancis
   i es tornen a moure: les tres targetes de sistema ixen de la secció. Ara es
   cita per nom. La secció i el seu h2 es conserven, amb el Lector RSS i el TPV
   del Bar: les assercions no canvien. */
test('sense sessió, /control continua sense guarda: es pinta el Panell, com abans', async () => {
  await munta('/control', async () => {
    const maquinaria = await screen.findByRole('heading', { level: 2, name: 'Maquinària i Sistema' }, { timeout: 8000 });
    expect(maquinaria.closest('section')?.classList.contains('sdp-control-maquinaria')).toBe(true);
    expect(screen.getByRole('button', { name: 'Eixir del poble' })).toBeTruthy();
    const barra = screen.getByRole('navigation', { name: 'Navegació principal' });
    expect(within(barra).getByRole('button', { name: 'Panell de control' }).getAttribute('aria-current')).toBe('page');
    expect(window.location.pathname).toBe('/control');
    senseCapBarrera();
  });
}, 15000);

test('amb sessió, /el-meu-perfil continua obrint-se', async () => {
  await munta('/el-meu-perfil', async () => {
    await waitFor(() => expect(document.querySelector('.sdp-gestor-pagina')).not.toBeNull(), { timeout: 8000 });
    expect(window.location.pathname).toBe('/el-meu-perfil');
  }, { usuari: USUARI });
}, 15000);
