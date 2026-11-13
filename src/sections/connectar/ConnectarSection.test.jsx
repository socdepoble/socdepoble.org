import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* T5 · Connectar crea una nota amb origen a la safata de les connexions.
   T43 (ordre del Mestre, 260928) · objecte tipat, visibilitat honesta amb
   resultat per destinatari, identitat personal i error de servidor traduït.
   D1 (ordre del Mestre, 260930) · la safata es diu «Safata d’Entrada» (id
   'f-connectats' intacte) i el verb de la vista és CONNECTAR: les asercions
   d'abans amb «Guardar…», «Simular Guardat» i «Connectats» passen a les
   formes noves. Sense sessió en remot no hi ha simulació: es va a entrar.
   D4 (excepció del Mestre, 260930) · còpia editable: subtítol, entradeta i
   drets de l'original resolt (mai de l'URL). */
/* Els objectes i funcions dels mocks són estables (hoisted): un valor nou a
   cada render entraria als deps dels efectes i faria un bucle. */
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), crea: vi.fn(), update: vi.fn(), canCreate: true, user: { id: 'U' },
  /* Revisió (260930) · l'estat del Bloc (status, error, refresh de useNotesData). */
  statusBloc: 'ready', errorBloc: null, refresh: vi.fn(),
  params: new URLSearchParams(), folders: [], notes: [], config: {}, t: (_, alternativa) => alternativa,
  identitat: { actor: { tipus: 'persona', nom: 'Pepa Soler' }, identitats: [{ tipus: 'persona', nom: 'Pepa Soler' }] },
  xat: { chatThreads: [], cercaMembres: vi.fn(), creaFil: vi.fn(), sendChatMessage: vi.fn() },
  /* T54 · les dades dels proveïdors d'on la mini-card resol l'original. */
  mur: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
/* P1-22 (assalt 261101, T5b) · També l'accés opcional (useTraductorOpcional): el resum i
   useAplicaAbast parlen la mateixa llengua que la vista. Amb el `t` de reserva, el valencià de sempre. */
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }), useUIActionsOpcional: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: mocks.user }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => mocks.xat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('../notes/NotesDataContext', () => ({
  useNotesData: () => ({
    noteFolders: mocks.folders, notes: mocks.notes, creaNota: mocks.crea, updateNote: mocks.update,
    canCreate: mocks.canCreate, config: mocks.config, status: mocks.statusBloc, error: mocks.errorBloc, refresh: mocks.refresh
  })
}));
/* T43b · el bloc d'administrar té les seues proves. Actualitzada a posta (IDEA-22, pla 261025_0045 T5):
   ja no es munta a /connectar; el simulacre es queda de guarda perquè no hi torne. */
vi.mock('./organitzacio/BlocAdministrarOrganitzacio.jsx', () => ({
  BlocAdministrarOrganitzacio: ({ orgId, nom, config }) => React.createElement('p', { 'data-bloc-administrar': orgId, 'data-mode': config?.dataMode || '', 'data-nom': nom ?? '' }, 'Administrar')
}));
import ConnectarSection, { idsDeQuiConnecta, origenAmbOriginal, origenDeLaConnexio } from './ConnectarSection.jsx';
import { contingutDeLaConnexio } from '../notes/connexions.js';
import { delVal, setVal } from '../../config/storage.js';
/* Gauntlet 261022_0225 (CA-1, CA-6) · el xat de «En privat» i els diccionaris de veres. */
import { XAT_SOCDEPOBLE_DE_LLAVOR, XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { directeDeLlavor } from '../control/xatCorporatiu.js';
import { CORREU_PERSONA_PILOT, IAIA_ID } from '../../data/identitatsSeed.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import { FONTS_PER_IDIOMA } from '../../../tests/helpers/diccionaris.js';

const PARAMS = 'item_id=samarreta-socdepoble&title=Samarreta&sectionId=mercat&targetUserId=socdepoble&autorTipus=entitat&author=S%C3%B3c%20de%20Poble';
/* D1 · el nom visible de la carpeta 'f-connectats' i el botó de connectar-hi. */
const SAFATA = 'Safata d’Entrada';
const CONNECTA = `Connectar a «${SAFATA}»`;
/* D1 · On porta «Entra per a connectar»: /registre en mode entrar, amb la tornada a esta consulta. */
const anadaAEntrar = (crida) => {
  const url = new URL(crida, 'http://sdp.test');
  return { ruta: url.pathname, mode: url.searchParams.get('mode'), tornar: url.searchParams.get('tornar') };
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.canCreate = true;
  mocks.user = { id: 'U' };
  mocks.config = {};
  mocks.statusBloc = 'ready';
  mocks.errorBloc = null;
  mocks.t = (_, alternativa) => alternativa;
  mocks.notes = [];
  mocks.params = new URLSearchParams(PARAMS);
  mocks.identitat = { actor: { tipus: 'persona', nom: 'Pepa Soler' }, identitats: [{ tipus: 'persona', nom: 'Pepa Soler' }] };
  mocks.xat.chatThreads = [];
  mocks.xat.status = undefined;
  mocks.xat.avis = null;
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [] };
  mocks.crea.mockResolvedValue({ id: 'n-9', revision: 0 });
  mocks.update.mockResolvedValue({ id: 'n-9', revision: 1 });
  mocks.xat.cercaMembres.mockResolvedValue([]);
  mocks.xat.creaFil.mockImplementation(async (id) => `f-${id}`);
  mocks.xat.sendChatMessage.mockImplementation(async () => [{ id: 'm-1' }]);
});

test('D1 · la connexió naix a la Safata d’Entrada, recorda l’origen sencer i porta a la nota', async () => {
  render(<ConnectarSection />);
  expect(screen.getByRole('button', { name: SAFATA }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  const [entrada] = mocks.crea.mock.calls[0];
  expect(entrada).toMatchObject({
    title: 'Samarreta', folderId: 'f-connectats', tags: [], categories: [],
    origen: { tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Samarreta',
      autorId: 'socdepoble', autorNom: 'Sóc de Poble', autorTipus: 'entitat', ruta: '/mercat/samarreta-socdepoble',
      objecte: 'producte', abast: { mode: 'privada', persones: [], grups: [] } }
  });
  expect(entrada.content).toContain('href="/mercat/samarreta-socdepoble"');
  expect(entrada.content).toContain('Element connectat des del Mercat de Sóc de Poble');
  /* T54 · el cos no promet accions que el lector del MAS no té, ni parla a
     «el teu MAS» (si arribara a altres ulls, seria fals). */
  expect(entrada.content).not.toMatch(/etiqueta'l|compartix-lo|teu MAS/);
  expect(entrada.content).toContain('Connectat per a llegir-lo més tard.');
  expect(entrada.content).not.toMatch(/[Gg]uard/);
  /* T54 · replace: «arrere» des de la nota no torna al formulari ja fet. */
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=n-9', { replace: true }));
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining(`«${SAFATA}»`), 'success');
  expect(mocks.xat.sendChatMessage).not.toHaveBeenCalled();
});

test('D1 · es pot triar una altra carpeta i afegir etiquetes; el botó i el toast diuen la carpeta triada', async () => {
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Mur' }));
  fireEvent.click(screen.getByRole('button', { name: 'Patrimoni' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Etiqueta lliure' }), { target: { value: 'Roba' } });
  fireEvent.click(screen.getByRole('button', { name: 'Afegir' }));
  expect(screen.getByRole('button', { name: 'Lleva l’etiqueta Roba' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Connectar a «Mur»' }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0]).toMatchObject({ folderId: 'f-mur', tags: ['Patrimoni', 'Roba'] });
  /* Regressió: el toast deia sempre la safata, encara que s'haguera triat una altra carpeta. */
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledTimes(1));
  const [text, to] = mocks.toast.mock.calls[0];
  expect(to).toBe('success');
  expect(text).toContain('«Mur»');
  expect(text).not.toContain(SAFATA);
  /* 261024 correccions (Gemini G2-02) · el toast diu «a les teues notes», mai «MAS». */
  expect(text).toBe('Element connectat a les teues notes: el trobaràs a «Mur».');
});

/* Correcció C16 (260928) · WCAG 2.4.3: cap dels tres camins deixa el focus al <body>. */
test('C16 · llevar una etiqueta porta el focus a la següent; l’última, al camp «Etiqueta lliure»', () => {
  render(<ConnectarSection />);
  const lliure = screen.getByRole('textbox', { name: 'Etiqueta lliure' });
  for (const valor of ['Roba', 'Fira']) {
    fireEvent.change(lliure, { target: { value: valor } });
    fireEvent.click(screen.getByRole('button', { name: 'Afegir' }));
  }
  const roba = screen.getByRole('button', { name: 'Lleva l’etiqueta Roba' });
  roba.focus();
  fireEvent.click(roba);
  expect(screen.queryByRole('button', { name: 'Lleva l’etiqueta Roba' })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lleva l’etiqueta Fira' }));
  fireEvent.click(document.activeElement);
  expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Etiqueta lliure' }));
});

test('C16 · triar una suggerida porta el focus a la suggerida següent; l’última, a la píndola nova', () => {
  render(<ConnectarSection />);
  const patrimoni = screen.getByRole('button', { name: 'Patrimoni' });
  patrimoni.focus();
  fireEvent.click(patrimoni);
  expect(screen.getByRole('button', { name: 'Lleva l’etiqueta Patrimoni' })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Gent del Poble' }));
  // «Debat» és l'última suggerida: el focus va a la seua píndola triada.
  fireEvent.click(screen.getByRole('button', { name: 'Debat' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lleva l’etiqueta Debat' }));
});

test('T43 · triar una suggerida no esborra el que s’estava escrivint a «Etiqueta lliure»', () => {
  render(<ConnectarSection />);
  const lliure = screen.getByRole('textbox', { name: 'Etiqueta lliure' });
  fireEvent.change(lliure, { target: { value: 'Rog' } });
  fireEvent.click(screen.getByRole('button', { name: 'Patrimoni' }));
  expect(screen.getByRole('button', { name: 'Lleva l’etiqueta Patrimoni' })).toBeTruthy();
  expect(screen.getByRole('textbox', { name: 'Etiqueta lliure' }).value).toBe('Rog');
});

test('C16 · llevar una persona porta el focus a la següent; l’última, al camp de cerca del padró', async () => {
  mocks.xat.cercaMembres.mockResolvedValue([
    { usuari_id: 'u1', nom: 'Toni Ferrer', tipus: 'persona', fil_id: null },
    { usuari_id: 'u2', nom: 'Rosa Pla', tipus: 'persona', fil_id: null }
  ]);
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('radio', { name: 'Persones concretes' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Toni Ferrer' }));
  fireEvent.click(screen.getByRole('button', { name: 'Rosa Pla' }));
  const toni = screen.getByRole('button', { name: 'Lleva Toni Ferrer de la llista' });
  toni.focus();
  fireEvent.click(toni);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lleva Rosa Pla de la llista' }));
  fireEvent.click(document.activeElement);
  expect(screen.queryByRole('list', { name: 'Persones triades' })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Cerca al padró del teu poble' }));
});

/* Correcció C18 (260928) · La carpeta triada es llig sense color; el nom accessible no canvia. */
test('C18 · cada carpeta porta la insígnia «Triada» amb check, decorativa; l’estat el diu aria-pressed', () => {
  render(<ConnectarSection />);
  const connectats = screen.getByRole('button', { name: SAFATA });
  const insignia = connectats.querySelector('.sdp-connectar__carpeta-insignia');
  expect(insignia.getAttribute('aria-hidden')).toBe('true');
  expect(insignia.classList.contains('sdp-insignia--exit')).toBe(true);
  expect(insignia.textContent).toBe('Triada');
  expect(insignia.querySelector('svg')).toBeTruthy();
  const mur = screen.getByRole('button', { name: 'Mur' });
  expect(mur.querySelector('.sdp-connectar__carpeta-insignia')).toBeTruthy();
  fireEvent.click(mur);
  expect(mur.getAttribute('aria-pressed')).toBe('true');
  expect(connectats.getAttribute('aria-pressed')).toBe('false');
});

/* D1 · Abans el Foraster en remot rebia «Simular Guardat», un toast i un
   navigate(-1): ara no hi ha simulació, es va a entrar i es torna ací. */
test('D1 · sense sessió en remot, «Entra per a connectar» porta a /registre?mode=entrar&tornar=… i no crea res', () => {
  mocks.canCreate = false;
  mocks.user = null;
  vi.useFakeTimers();
  try {
    render(<ConnectarSection />);
    expect(screen.queryByRole('button', { name: /Simular/ })).toBeNull();
    expect(screen.getByText('Per a connectar cal entrar al teu compte.')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/crea carpetes|Quan et registres/);
    fireEvent.click(screen.getByRole('button', { name: 'Entra per a connectar' }));
    vi.runAllTimers();
    expect(mocks.crea).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    const [crida, opcions] = mocks.navigate.mock.calls[0];
    expect(opcions).toBeUndefined();
    expect(anadaAEntrar(crida)).toEqual({ ruta: '/registre', mode: 'entrar', tornar: `/connectar?${new URLSearchParams(PARAMS).toString()}` });
  } finally {
    vi.useRealTimers();
  }
});

test('D1 · en seed sense sessió es connecta al dispositiu, sense prometre cap traspàs al compte', async () => {
  mocks.user = null;
  mocks.config = { dataMode: 'seed' };
  render(<ConnectarSection />);
  expect(screen.getByText('Sense sessió, el que connectes es queda només en este dispositiu.')).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/Quan et registres|de debò|crea carpetes/);
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=n-9', { replace: true });
});

test('D1 · amb sessió i el Bloc carregant, el botó espera desactivat: ni simulació, ni toast, ni nota', () => {
  mocks.canCreate = false;
  render(<ConnectarSection />);
  const boto = screen.getByRole('button', { name: 'Obrint el teu Bloc…' });
  expect(boto.disabled).toBe(true);
  fireEvent.click(boto);
  expect(mocks.crea).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(screen.queryByText('Mode Foraster actiu')).toBeNull();
});

test('l’origen i el cos es calculen sense inventar res: escapen el text i enllacen només si hi ha ruta', () => {
  const origen = origenDeLaConnexio(new URLSearchParams('item_id=x&title=%3Cb%3EFira%3C%2Fb%3E'));
  expect(origen).toMatchObject({ tipus: 'connexio', itemId: 'x', titol: '<b>Fira</b>', sectionId: '', ruta: '', objecte: 'pagina' });
  const cos = contingutDeLaConnexio(origen);
  expect(cos).toContain('&lt;b&gt;Fira&lt;/b&gt;');
  expect(cos).toContain('Element connectat des de Sóc de Poble');
  expect(cos).not.toContain('<a ');
  expect(origenDeLaConnexio(new URLSearchParams('')).titol).toBe('element-desconegut');
});

test('T43 · l’objecte i la ruta arriben per URL; una ruta que no és interna i segura no s’accepta', () => {
  const poble = origenDeLaConnexio(new URLSearchParams('item_id=sella&title=Sella&sectionId=pobles&objecte=poble&ruta=%2Fpobles%2Fsella'));
  expect(poble).toMatchObject({ objecte: 'poble', ruta: '/pobles/sella' });
  expect(contingutDeLaConnexio(poble)).toContain('Element connectat des dels Pobles');
  const dolenta = origenDeLaConnexio(new URLSearchParams('item_id=x&title=X&objecte=script&ruta=%2F%2Fmal.example'));
  expect(dolenta).toMatchObject({ objecte: 'pagina', ruta: '' });
  expect(origenDeLaConnexio(new URLSearchParams('item_id=x&sectionId=%2Fmal.example')).ruta).toBe('');
  const perfil = origenDeLaConnexio(new URLSearchParams('item_id=u1&title=Pepa&sectionId=perfil&autorTipus=persona'));
  expect(perfil).toMatchObject({ objecte: 'persona', ruta: '/perfil/u1' });
  expect(contingutDeLaConnexio(perfil)).toContain('des del directori');
});

/* Actualitzada a posta (IDEA-22, pla 261025_0045 T5; Directiva del Mestre 261025): fora «les connexions són
   personals». Qui administra una entitat tria amb quin barret connecta (ConnectarSection.relacions.test.jsx). */
test('T43 · la vista diu què es connecta i, actuant com a entitat, ja no diu que la connexió és personal', () => {
  mocks.identitat = {
    actor: { tipus: 'entitat', nom: 'Forn de la Torre' },
    identitats: [{ tipus: 'persona', nom: 'Pepa Soler' }, { tipus: 'entitat', nom: 'Forn de la Torre' }]
  };
  const { container } = render(<ConnectarSection />);
  expect(container.querySelector('header.page-title h1').textContent).toBe('Connectar');
  expect(container.querySelector('header.bar-blue .btn-connectar')).toBeNull();
  expect(screen.getByText('Producte del Mercat')).toBeTruthy();
  expect(screen.getByText('Es connecta a Pepa Soler.')).toBeTruthy();
  expect(container.textContent).not.toMatch(/connexions són personals|Actues com a/);
});

test('T43 · les opcions diuen la veritat: en seed «Tot el poble» està desactivada amb el motiu', () => {
  mocks.config = { dataMode: 'seed' };
  render(<ConnectarSection />);
  expect(screen.getByRole('radio', { name: 'Privada' }).checked).toBe(true);
  const poble = screen.getByRole('radio', { name: 'Tot el poble' });
  expect(poble.disabled).toBe(true);
  expect(screen.getByText('Sense servidor no es pot compartir al Mur.')).toBeTruthy();
  /* Actualitzada a posta (261024 T6a): l'opció es diu «Grups de xat» (IDEA-14), per no confondre-la amb les entitats de tipus grup. */
  expect(screen.getByRole('radio', { name: 'Grups de xat' }).disabled).toBe(true);
  expect(screen.getByRole('radio', { name: 'Persones concretes' }).disabled).toBe(false);
});

test('T43 · persones concretes: tria del padró, desa la tria, envia l’enllaç per xat i ho resumix', async () => {
  mocks.params = new URLSearchParams('item_id=sella&title=Sella&sectionId=pobles&objecte=poble&ruta=%2Fpobles%2Fsella');
  mocks.xat.cercaMembres.mockResolvedValue([{ usuari_id: 'u1', nom: 'Toni Ferrer', tipus: 'persona', fil_id: null }]);
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('radio', { name: 'Persones concretes' }));
  expect(screen.getByRole('button', { name: 'Connectar i enviar a 0 persones' }).disabled).toBe(true);
  const toni = await screen.findByRole('button', { name: 'Toni Ferrer' });
  fireEvent.click(toni);
  expect(toni.getAttribute('aria-pressed')).toBe('true');
  expect(mocks.xat.cercaMembres).toHaveBeenCalledWith(null);
  fireEvent.click(screen.getByRole('button', { name: 'Connectar i enviar a 1 persona' }));
  await screen.findByText('Enviat per xat.');
  expect(mocks.crea.mock.calls[0][0].origen).toMatchObject({
    objecte: 'poble', ruta: '/pobles/sella', abast: { mode: 'persones', persones: [{ id: 'u1', nom: 'Toni Ferrer' }], grups: [] }
  });
  expect(mocks.xat.creaFil).toHaveBeenCalledWith('u1', null);
  const [fil, text] = mocks.xat.sendChatMessage.mock.calls[0];
  expect(fil).toEqual({ id: 'f-u1' });
  expect(text).toContain('«Sella»');
  expect(text).toContain('/pobles/sella');
  expect(mocks.update.mock.calls[0][1].origen.abast.aplicat).toMatchObject({ persones: ['u1'] });
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(screen.getByRole('status').textContent).toContain(`Connectada a «${SAFATA}».`);
  /* Actualitzada a posta (261024 correccions): directiva del Mestre 15:05 (Gemini G2-02), cap «MAS» a la interfície. */
  expect(screen.getByRole('status').textContent).toContain('Les teues notes');
  expect(screen.getByRole('status').textContent).not.toMatch(/\bMAS\b/);
  fireEvent.click(screen.getByRole('button', { name: 'Obrir la connexió a les teues notes' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=n-9', { replace: true });
});

test('T43 · grups de xat: només els grups on ja eres, i una fallada es diu per destinatari', async () => {
  mocks.xat.chatThreads = [
    { id: 'g1', tipus: 'grup', name: 'Comissió de Festes' },
    { id: 'g2', tipus: 'grup', name: 'La Torre' },
    { id: 'c1', tipus: 'comunitat', name: 'Sóc de Poble' },
    { id: 'd1', tipus: 'directe', name: 'Pepa' }
  ];
  mocks.xat.sendChatMessage.mockImplementation(async (fil) => (fil.id === 'g2' ? [] : [{ id: 'm' }]));
  render(<ConnectarSection />);
  /* Actualitzada a posta (261024 T6a): «Grups de xat» (IDEA-14). */
  fireEvent.click(screen.getByRole('radio', { name: 'Grups de xat' }));
  expect(screen.queryByRole('checkbox', { name: 'Pepa' })).toBeNull();
  expect(screen.queryByRole('checkbox', { name: 'Sóc de Poble' })).toBeNull();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Comissió de Festes' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'La Torre' }));
  fireEvent.click(screen.getByRole('button', { name: 'Connectar i enviar a 2 grups' }));
  await screen.findByText('No enviat');
  expect(mocks.xat.creaFil).not.toHaveBeenCalled();
  expect(mocks.xat.sendChatMessage.mock.calls.map(([f]) => f.id)).toEqual(['g1', 'g2']);
  const resum = screen.getByRole('status');
  expect(resum.textContent).toContain('no tot s’ha enviat');
  expect(resum.textContent).toContain('Comissió de Festes');
});

test('T43a-2 · «Grups» diu si el xat carrega o ha fallat, i no promet que no n’hi ha cap', () => {
  mocks.xat.status = 'loading';
  const vista = render(<ConnectarSection />);
  /* Actualitzada a posta (261024 T6a): «Grups de xat» (IDEA-14). */
  expect(screen.getByRole('radio', { name: 'Grups de xat' }).disabled).toBe(true);
  expect(screen.getByText('Carregant els teus grups de xat…')).toBeTruthy();
  expect(screen.queryByText('Encara no eres en cap grup de xat.')).toBeNull();
  vista.unmount();
  mocks.xat.status = 'ready';
  mocks.xat.avis = 'No s’han pogut carregar les converses.';
  render(<ConnectarSection />);
  expect(screen.getByText('El xat no està disponible ara mateix.')).toBeTruthy();
  expect(screen.queryByText('Encara no eres en cap grup de xat.')).toBeNull();
});

test('T43 · tot el poble (remot amb sessió): connecta, no publica sol i diu que el pas al Mur és pendent', async () => {
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('radio', { name: 'Tot el poble' }));
  /* T54 · el pas al Mur es fa al lector del MAS, amb el botó «Compartir al Mur»
     de la tira (ConnexioDetall). L'avís el nomena sencer: el «Compartir» a
     seques és el de la barra blava, que només envia l'enllaç de l'original. */
  /* D1 Opció A (decisió del Mestre, 261112) · el Mur el pot llegir qualsevol persona, també sense compte. */
  const avis = screen.getByText(/El Mur el pot llegir qualsevol persona, també sense compte/, { selector: '.sdp-alerta__text' });
  expect(avis.textContent).not.toMatch(/registrada|Internet/);
  expect(avis.textContent).toContain('prem «Compartir al Mur»');
  expect(avis.textContent).not.toContain('prem «Compartir»');
  /* Actualitzada a posta (261024 correccions): «a les teues notes», sense «MAS» (Gemini G2-02). */
  expect(avis.textContent).toContain('obri-la a les teues notes');
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  const obrir = await screen.findByRole('button', { name: 'Obrir la connexió a les teues notes' });
  expect(mocks.crea.mock.calls[0][0].origen.abast).toEqual({ mode: 'poble', persones: [], grups: [] });
  expect(mocks.xat.sendChatMessage).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(screen.getByText('Pendent')).toBeTruthy();
  fireEvent.click(obrir);
  expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=n-9', { replace: true });
});

/* T54 · La mini-card resol l'original en local (sectionId + item_id): l'URL no porta cap imatge. */
test('T54/R21.6 · mini-card amb foto i capçalera honesta, sense peu ni calendari; la regió es diu com l’element', () => {
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [{ id: 'samarreta-socdepoble', title: 'Samarreta', image_url: '/assets/x.png' }] };
  const { container } = render(<ConnectarSection />);
  const targeta = container.querySelector('.sdp-connectar__previsualitzacio .sp-card');
  expect(targeta.querySelector('img.sp-card-media').getAttribute('src')).toBe('/assets/x.png');
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('Samarreta');
  expect(targeta.querySelector('.sp-card-footer')).toBeNull();
  expect(targeta.querySelector('.btn-date-time').textContent).toBe('Data no indicada');
  expect(targeta.querySelector('.btn-date-time[datetime], button.btn-date-time')).toBeNull();
  expect(targeta.querySelector('.sp-card-title-icon')).toBeNull();
  expect(screen.getByText('Producte del Mercat')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Samarreta' })).toBeTruthy();
});

test('T54 · també una publicació del Mur; una imatge a l’URL no hi entra', () => {
  mocks.params = new URLSearchParams('item_id=p1&title=Fira&sectionId=mur&image=%2F%2Fmal.example%2Fx.png');
  mocks.mur = { status: 'ready', feedPosts: [{ id: 'p1', title: 'Fira', image_url: '/assets/fira.png' }], events: [], marketItems: [] };
  const { container } = render(<ConnectarSection />);
  expect(container.querySelector('.sdp-connectar__previsualitzacio img.sp-card-media').getAttribute('src')).toBe('/assets/fira.png');
  expect(screen.getByText('Publicació del Mur')).toBeTruthy();
});

test('T54 · sense l’element als proveïdors, la targeta ix sense imatge i amb la icona de capes', () => {
  const { container } = render(<ConnectarSection />);
  const targeta = container.querySelector('.sdp-connectar__previsualitzacio .sp-card');
  expect(targeta.querySelector('img')).toBeNull();
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('Samarreta');
  expect(targeta.querySelector('.sp-card-title-icon svg')).toBeTruthy();
  expect(screen.getByText('Producte del Mercat')).toBeTruthy();
  expect(screen.getByText('De Sóc de Poble')).toBeTruthy();
});

/* ── T71 · l'intern es resol (també les pàgines de text) i manen les dades de l'original ── */
const ANIMA = 'item_id=%2Fiaia&title=T%C3%ADtol%20de%20l%E2%80%99URL&objecte=pagina&ruta=%2Fiaia&author=Foraster&targetUserId=intrus&autorTipus=persona';

test('T71 · una pàgina de text (/iaia): la mini-card porta la foto, el títol i l’autor de l’original, no els de l’URL', () => {
  mocks.params = new URLSearchParams(ANIMA);
  const { container } = render(<ConnectarSection />);
  const targeta = container.querySelector('.sdp-connectar__previsualitzacio .sp-card');
  expect(targeta.querySelector('img.sp-card-media').getAttribute('src'))
    .toBe('/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp');
  expect(targeta.querySelector('.sp-card-title').textContent).toBe("L'Ànima de la IAIA");
  expect(screen.getByText('De Sóc de Poble')).toBeTruthy();
  expect(screen.queryByText('De Foraster')).toBeNull();
  expect(container.textContent).not.toContain('Títol de l’URL');
  expect(screen.getByText('Pàgina')).toBeTruthy();
});

test('T71 · en guardar una connexió resolta, la memòria cau (títol i cos) és la de l’original', async () => {
  mocks.params = new URLSearchParams(ANIMA);
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  const [entrada] = mocks.crea.mock.calls[0];
  expect(entrada.title).toBe("L'Ànima de la IAIA");
  expect(entrada.origen).toMatchObject({ tipus: 'connexio', titol: "L'Ànima de la IAIA", autorNom: '', ruta: '/iaia', objecte: 'pagina' });
  /* T71b · una pàgina no declara autor: cap identitat, tampoc la de l'URL. */
  expect(entrada.origen).toMatchObject({ autorId: '', autorTipus: '' });
  expect(entrada.content).toContain('<a href="/iaia">L\'Ànima de la IAIA</a>');
  expect(JSON.stringify(entrada)).not.toMatch(/Foraster|Títol de l’URL|intrus/);
});

/* T71b · revisió de T71: resolt l'original, l'autoria no pot mesclar el nom
   de l'original amb la identitat (targetUserId, autorTipus) de l'URL. */
const INTRUS = 'item_id=samarreta-socdepoble&title=X&sectionId=mercat&targetUserId=intrus&autorTipus=persona&author=Y';
const guardaIRetornaOrigen = async () => {
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  return mocks.crea.mock.calls[0][0].origen;
};

test('T71b · un article resolt sense identitat d’autor: cap targetUserId ni autorTipus de la query queda a l’origen', async () => {
  mocks.params = new URLSearchParams(INTRUS);
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [{ id: 'samarreta-socdepoble', title: 'Samarreta', author_name: 'Sóc de Poble' }] };
  const origen = await guardaIRetornaOrigen();
  expect(origen).toMatchObject({ titol: 'Samarreta', autorNom: 'Sóc de Poble', autorId: '', autorTipus: '' });
  expect(JSON.stringify(origen)).not.toMatch(/intrus|"Y"|persona/);
});

test('T71b · un article resolt amb autor: el nom, l’id i el tipus són tots de l’original', async () => {
  mocks.params = new URLSearchParams(INTRUS);
  mocks.mur = {
    status: 'ready', feedPosts: [], events: [],
    marketItems: [{ id: 'samarreta-socdepoble', title: 'Samarreta', author_name: 'Sóc de Poble', author_entity_id: 'socdepoble' }]
  };
  const origen = await guardaIRetornaOrigen();
  expect(origen).toMatchObject({ autorNom: 'Sóc de Poble', autorId: 'socdepoble', autorTipus: 'entitat' });
  expect(JSON.stringify(origen)).not.toContain('intrus');
});

test('T71b · origenAmbOriginal: sense original, l’origen de l’URL tal qual; amb original, cap identitat de l’URL', () => {
  const deLURL = origenDeLaConnexio(new URLSearchParams(INTRUS));
  expect(origenAmbOriginal(deLURL, null)).toBe(deLURL);
  expect(deLURL).toMatchObject({ autorId: 'intrus', autorTipus: 'persona' });
  const targeta = { titol: 'Samarreta', autor: { nom: 'Pepa', propi: true } };
  expect(origenAmbOriginal(deLURL, targeta, null)).toMatchObject({ titol: 'Samarreta', autorNom: 'Pepa', autorId: '', autorTipus: '' });
  expect(origenAmbOriginal(deLURL, targeta, { author_id: 'u-7' })).toMatchObject({ autorId: 'u-7', autorTipus: 'persona' });
  expect(origenAmbOriginal(deLURL, { titol: '', autor: { nom: 'Sóc de Poble', propi: false } }, { author_id: 'u-7' }))
    .toMatchObject({ titol: 'X', autorNom: '', autorId: 'u-7', autorTipus: 'persona' });
});

/* ── T71 · el contingut de fora: es mostra, es confirma amb un clic i naix editable ── */
const EXTERN = `url=${encodeURIComponent('https://exemple.org/recepta?id=7')}&title=Coca%20de%20llanda&entradilla=Farina%20i%20ous`;

test('T71 · amb una url externa, la ruta la mostra i no crea res fins al clic; el clic crea la nota a la Safata d’Entrada', async () => {
  mocks.params = new URLSearchParams(EXTERN);
  const { container } = render(<ConnectarSection />);
  expect(mocks.crea).not.toHaveBeenCalled();
  expect(screen.getByText('Enllaç de fora de Sóc de Poble')).toBeTruthy();
  expect(screen.getByText('https://exemple.org/recepta?id=7')).toBeTruthy();
  expect(screen.getByText('De exemple.org')).toBeTruthy();
  expect(container.querySelector('.sdp-connectar__previsualitzacio .sp-card-title').textContent).toBe('Coca de llanda');
  // Cap imatge de l'altra web, i la url no és cap enllaç.
  expect(container.querySelector('.sdp-connectar__previsualitzacio img')).toBeNull();
  expect(container.querySelector('a[href^="https://exemple.org"]')).toBeNull();
  // El formulari de les connexions internes no hi és (D1: els dos botons diuen ara el mateix).
  expect(screen.queryByRole('heading', { name: 'Privacitat de la connexió' })).toBeNull();
  expect(screen.queryByRole('button', { name: SAFATA })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0]).toEqual({
    title: 'Coca de llanda',
    lead: 'Farina i ous',
    content: '<p>Font: <a href="https://exemple.org/recepta?id=7">exemple.org</a></p>',
    folderId: 'f-connectats',
    origen: { tipus: 'extern', url: 'https://exemple.org/recepta?id=7', titol: 'Coca de llanda' }
  });
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=n-9', { replace: true }));
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('la pots editar'), 'success');
});

test('T71 · una url javascript: o data: no es connecta: es diu per què i no hi ha cap botó', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>']) {
    mocks.params = new URLSearchParams({ url, title: 'Trampa' });
    const { container, unmount } = render(<ConnectarSection />);
    expect(screen.getByText('Este enllaç no es pot connectar', { selector: '.sdp-alerta__titol' })).toBeTruthy();
    expect(screen.getByText('Només es poden connectar adreces web (http o https).')).toBeTruthy();
    expect(screen.queryByRole('button', { name: CONNECTA })).toBeNull();
    expect(container.querySelector('a[href^="javascript"], a[href^="data"]')).toBeNull();
    expect(container.textContent).not.toContain('Trampa');
    expect(mocks.crea).not.toHaveBeenCalled();
    unmount();
  }
});

/* D1 · Abans el contingut de fora també simulava el guardat: ara es va a entrar. */
test('D1 · sense sessió en remot, el contingut de fora porta a entrar i torna a la mateixa consulta', () => {
  mocks.canCreate = false;
  mocks.user = null;
  mocks.params = new URLSearchParams(EXTERN);
  render(<ConnectarSection />);
  expect(screen.queryByRole('button', { name: /Simular/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Entra per a connectar' }));
  expect(mocks.crea).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
  expect(anadaAEntrar(mocks.navigate.mock.calls[0][0])).toEqual({
    ruta: '/registre', mode: 'entrar', tornar: `/connectar?${new URLSearchParams(EXTERN).toString()}`
  });
});

test('D1 · amb sessió i el Bloc carregant, el contingut de fora també espera desactivat', () => {
  mocks.canCreate = false;
  mocks.params = new URLSearchParams(EXTERN);
  render(<ConnectarSection />);
  const boto = screen.getByRole('button', { name: 'Obrint el teu Bloc…' });
  expect(boto.disabled).toBe(true);
  fireEvent.click(boto);
  expect(mocks.crea).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
});

/* D4 (excepció del Mestre, 260930) · la connexió és una còpia editable al MAS:
   el peu ja no diu que només es llig ni que les etiquetes es trien ara. */
test('D4 · el peu diu el que es podrà fer al MAS: llegir-la i editar-la com una nota teua', () => {
  render(<ConnectarSection />);
  /* Actualitzada a posta (261024 correccions): «A les teues notes», sense «MAS» (Gemini G2-02). */
  const nota = screen.getByText(/A les teues notes la llegiràs/);
  expect(nota.textContent).toContain('editar');
  expect(nota.textContent).not.toMatch(/etiquetar|compartir|tria-les ara/);
});

/* ── D10-A · el paràmetre `text` (Web Share Target): la primera adreça vàlida ── */
test('D10-A · sense url, una adreça dins de `text` obri el contingut de fora i la resta en fa l’entradeta', async () => {
  mocks.params = new URLSearchParams({ title: 'Coca de llanda', text: 'Mira açò https://exemple.org/recepta?id=7 que bona' });
  render(<ConnectarSection />);
  expect(screen.getByText('Enllaç de fora de Sóc de Poble')).toBeTruthy();
  expect(screen.getByText('https://exemple.org/recepta?id=7')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0]).toMatchObject({
    title: 'Coca de llanda', lead: 'Mira açò que bona', folderId: 'f-connectats',
    origen: { tipus: 'extern', url: 'https://exemple.org/recepta?id=7' }
  });
});

test('D10-A · un `text` sense cap adreça web no és cap contingut de fora', () => {
  mocks.params = new URLSearchParams({ text: 'Només text, javascript:alert(1)' });
  render(<ConnectarSection />);
  expect(screen.queryByText('Enllaç de fora de Sóc de Poble')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Privacitat de la connexió' })).toBeTruthy();
});

/* ── D4 · subtítol, entradeta i drets de l'original resolt; mai de l'URL ── */
const MERCAT_AMB = (camps) => ({
  status: 'ready', feedPosts: [], events: [],
  marketItems: [{ id: 'samarreta-socdepoble', title: 'Samarreta', author_name: 'Pepa Soler', ...camps }]
});

test('D4 · es desen el subtítol i l’entradeta de l’original resolt, escapats com a HTML', async () => {
  mocks.mur = MERCAT_AMB({ subtitle: 'Cotó & tinta', entradilla: 'Feta al <poble>' });
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0]).toMatchObject({ subtitle: 'Cotó &amp; tinta', lead: 'Feta al &lt;poble&gt;' });
});

test('D4 · sense l’original resolt no es desa cap subtítol ni entradeta (l’URL no en posa)', async () => {
  mocks.params = new URLSearchParams(`${PARAMS}&subtitol=Fals&entradilla=Fals&lead=Fals`);
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  const [entrada] = mocks.crea.mock.calls[0];
  expect(entrada).not.toHaveProperty('subtitle');
  expect(entrada).not.toHaveProperty('lead');
});

test('D4 · amb drets reservats a l’original: avís abans de connectar i els drets queden a l’origen', async () => {
  mocks.mur = MERCAT_AMB({ copyright: '© Pepa Soler' });
  render(<ConnectarSection />);
  const avis = screen.getByText('Contingut amb drets reservats', { selector: '.sdp-alerta__titol' }).closest('.sdp-alerta');
  expect(avis.textContent).toContain('no en copies el contingut sencer sense permís de qui el signa');
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0].origen).toMatchObject({ drets: '© Pepa Soler' });
});

test('D4 · uns drets oberts es desen sense l’avís de drets reservats', async () => {
  mocks.mur = MERCAT_AMB({ copyright: 'CC BY-SA 4.0' });
  render(<ConnectarSection />);
  expect(screen.queryByText('Contingut amb drets reservats')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0].origen.drets).toBe('CC BY-SA 4.0');
});

test('D4 · els drets no es prenen mai de l’URL: ni sense original ni amb un original que no en porta', async () => {
  const ambDretsALURL = `${PARAMS}&drets=${encodeURIComponent('© Fals')}&copyright=${encodeURIComponent('© Fals')}`;
  for (const mur of [{ status: 'ready', feedPosts: [], events: [], marketItems: [] }, MERCAT_AMB({})]) {
    mocks.crea.mockClear();
    mocks.mur = mur;
    mocks.params = new URLSearchParams(ambDretsALURL);
    const { unmount } = render(<ConnectarSection />);
    expect(screen.queryByText('Contingut amb drets reservats')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
    await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
    expect(mocks.crea.mock.calls[0][0].origen).not.toHaveProperty('drets');
    expect(JSON.stringify(mocks.crea.mock.calls[0][0])).not.toContain('Fals');
    unmount();
  }
});

test('T43 · categories del Bloc com a destí de la connexió', async () => {
  mocks.notes = [{ id: 'a', categories: ['Receptes'] }];
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Receptes' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Categoria nova' }), { target: { value: 'Festes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Afegir categoria' }));
  expect(screen.getByRole('button', { name: 'Festes' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Sistema' }).getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0].categories).toEqual(['Receptes', 'Festes']);
});

test('T43b · amb ?organitzacio=ID no es munta cap bloc d’administrar, i guardar la connexió continua sent una acció a banda', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.params = new URLSearchParams('item_id=socdepoble&title=S%C3%B3c%20de%20Poble&sectionId=perfil&objecte=entitat&ruta=%2Fempresa%2Fsocdepoble&organitzacio=socdepoble');
  const { container } = render(<ConnectarSection />);
  expect(container.querySelector('[data-bloc-administrar]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0].origen).toMatchObject({ objecte: 'entitat', ruta: '/empresa/socdepoble' });
});

test('T43b · sense el paràmetre la vista no porta cap bloc d’administrar', () => {
  const { container } = render(<ConnectarSection />);
  expect(container.querySelector('[data-bloc-administrar]')).toBeNull();
});

/* ── Revisió del torn (260930) · el Bloc que falla, el mode resolt, els drets traduïts i l'original que carrega ── */
const errorAmb = (camps) => Object.assign(new Error('Supabase 500: {"message":"relation does not exist"}'), camps);

test('Revisió · amb el Bloc en error no queda «Obrint el teu Bloc…»: l’Alerta diu el motiu pel codi i «Torna-ho a provar» crida refresh', () => {
  mocks.canCreate = false;
  mocks.statusBloc = 'error';
  mocks.errorBloc = errorAmb({ status: 500 });
  render(<ConnectarSection />);
  expect(screen.queryByRole('button', { name: 'Obrint el teu Bloc…' })).toBeNull();
  const avis = screen.getByText('No s’ha pogut obrir el teu Bloc.', { selector: '.sdp-alerta__titol' }).closest('.sdp-alerta');
  expect(avis.getAttribute('role')).toBe('alert');
  expect(avis.textContent).toContain('El servidor de poble ha tornat un error. Torna-ho a provar més tard.');
  expect(avis.textContent).not.toMatch(/Supabase|relation/);
  // El botó de connectar no fa res mentre el Bloc no s'ha obert.
  const connecta = screen.getByRole('button', { name: CONNECTA });
  expect(connecta.disabled).toBe(true);
  fireEvent.click(connecta);
  expect(mocks.crea).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Mode Foraster actiu')).toBeNull();
});

test('Revisió · el text del Bloc fallat el tria el codi: servidor inabastable, error del servidor o la resta', () => {
  mocks.canCreate = false;
  mocks.statusBloc = 'error';
  const casos = [
    [{ codi: 'backend-inabastable' }, 'El servidor de poble no respon ara mateix.'],
    [{ status: 0 }, 'El servidor de poble no respon ara mateix.'],
    [{ status: 403 }, 'El servidor de poble ha tornat un error.'],
    [{}, 'Revisa la connexió i torna-ho a provar.']
  ];
  for (const [camps, text] of casos) {
    mocks.errorBloc = errorAmb(camps);
    const { unmount } = render(<ConnectarSection />);
    expect(screen.getByRole('alert').textContent).toContain(text);
    unmount();
  }
});

test('Revisió · el contingut de fora amb el Bloc en error també ho diu i es pot tornar a provar', () => {
  mocks.canCreate = false;
  mocks.statusBloc = 'error';
  mocks.errorBloc = errorAmb({ codi: 'backend-inabastable' });
  mocks.params = new URLSearchParams(EXTERN);
  render(<ConnectarSection />);
  expect(screen.queryByRole('button', { name: 'Obrint el teu Bloc…' })).toBeNull();
  expect(screen.getByText('No s’ha pogut obrir el teu Bloc.', { selector: '.sdp-alerta__titol' })).toBeTruthy();
  expect(screen.getByRole('alert').textContent).toContain('El servidor de poble no respon ara mateix.');
  expect(screen.getByRole('button', { name: CONNECTA }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
  expect(mocks.crea).not.toHaveBeenCalled();
});

test('Revisió · mentre el Bloc carrega (loading) continua «Obrint el teu Bloc…», sense cap avís d’error', () => {
  mocks.canCreate = false;
  mocks.statusBloc = 'loading';
  render(<ConnectarSection />);
  expect(screen.getByRole('button', { name: 'Obrint el teu Bloc…' }).disabled).toBe(true);
  expect(screen.queryByText('No s’ha pogut obrir el teu Bloc.')).toBeNull();
});

/* D1 · «cal entrar» es decidix amb el mode resolt: un paquet 'seed' que ja
   ha passat al servidor (elecció remota desada per a este node). Un node
   propi: el retrat de resolveDataMode és per node i per document. */
const NODE_REMOT = { dataMode: 'seed', backendUrl: 'https://eleccio-remota.example' };
const CLAU_ELECCIO = `data-mode-choice:${JSON.stringify(['supabase', NODE_REMOT.backendUrl, null])}`;

test('Revisió · un paquet seed amb l’elecció remota desada: sense sessió cal entrar, a les dues vistes', () => {
  expect(setVal(CLAU_ELECCIO, { v: 1, mode: 'remote' })).toBe(true);
  try {
    mocks.user = null;
    mocks.config = NODE_REMOT;
    const intern = render(<ConnectarSection />);
    expect(screen.getByText('Per a connectar cal entrar al teu compte.')).toBeTruthy();
    expect(screen.queryByText('Sense sessió, el que connectes es queda només en este dispositiu.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Entra per a connectar' }));
    expect(anadaAEntrar(mocks.navigate.mock.calls[0][0])).toMatchObject({ ruta: '/registre', mode: 'entrar' });
    expect(mocks.crea).not.toHaveBeenCalled();
    intern.unmount();
    mocks.params = new URLSearchParams(EXTERN);
    render(<ConnectarSection />);
    expect(screen.getByText('Per a connectar cal entrar al teu compte.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Entra per a connectar' })).toBeTruthy();
  } finally {
    delVal(CLAU_ELECCIO);
  }
});

test('Revisió · l’Alerta de drets reservats de /connectar passa per t() amb les claus de l’editor', () => {
  mocks.mur = MERCAT_AMB({ copyright: '© Pepa Soler' });
  /* Gauntlet R22 (notes-06) · La clau del text és la de l'editor (PARELL_TEXT_DRETS, textCita): la vella
     ('section.notes.drets.text') prometia citar l'autoria, i amb una traducció carregada era la que es pintava. */
  const traduccions = { 'section.notes.drets.titol': 'Contenido con derechos reservados', 'section.notes.drets.textCita': 'Texto traducido.',
    'section.notes.drets.text': 'Texto viejo que promete la autoría.' };
  mocks.t = (clau, alternativa) => traduccions[clau] ?? alternativa;
  render(<ConnectarSection />);
  const avis = screen.getByText('Contenido con derechos reservados', { selector: '.sdp-alerta__titol' }).closest('.sdp-alerta');
  expect(avis.textContent).toContain('Texto traducido.');
  expect(avis.textContent).not.toContain('Texto viejo');
  expect(screen.queryByText('Contingut amb drets reservats')).toBeNull();
});

/* Gauntlet R22 (notes-06) · Amb els cinc diccionaris de veres: l'avís de /connectar és el de l'editor
   (t(...PARELL_TEXT_DRETS)) i no promet citar l'autoria en cap llengua; les claus velles ja no hi són. */
test('R22 · l’avís de drets de /connectar, amb els diccionaris de veres, no promet l’autoria', async () => {
  const { createTranslator } = await import('../../config/i18n.js');
  await import('../../../tests/helpers/diccionaris.js');
  const { PARELL_TEXT_DRETS } = await import('../notes/visibilitatNota.js');
  const PROMESA = { ca: /autoria/i, es: /autoría/i, en: /authorship/i, eu: /egile/i, gl: /autoría/i };
  for (const [llengua, promesa] of Object.entries(PROMESA)) {
    cleanup();
    mocks.mur = MERCAT_AMB({ copyright: '© Pepa Soler' });
    const t = createTranslator(llengua);
    mocks.t = t;
    render(<ConnectarSection />);
    const avis = document.querySelector('.sdp-alerta');
    expect(avis, llengua).toBeTruthy();
    expect(avis.textContent, llengua).toContain(t(...PARELL_TEXT_DRETS));
    expect(avis.textContent, llengua).not.toMatch(promesa);
    for (const vella of ['section.notes.drets.text', 'section.notes.connexio.textEditable',
      'section.notes.visibilitat.connexio.descripcio', 'section.notes.visibilitat.enLinia.publica.explicacioConnexio']) {
      expect(t(vella, 'RESERVA'), `${llengua} ${vella}`).toBe('RESERVA');
    }
  }
});

test('Revisió · mentre la font de l’original carrega no es connecta; resolt, es connecta amb els seus drets', async () => {
  mocks.mur = { status: 'loading', feedPosts: [], events: [], marketItems: [] };
  const { rerender } = render(<ConnectarSection />);
  const espera = screen.getByRole('button', { name: 'Carregant l’original…' });
  expect(espera.disabled).toBe(true);
  fireEvent.click(espera);
  expect(mocks.crea).not.toHaveBeenCalled();
  mocks.mur = MERCAT_AMB({ copyright: '© Pepa Soler', subtitle: 'Cotó' });
  rerender(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0]).toMatchObject({ subtitle: 'Cotó', origen: { drets: '© Pepa Soler' } });
});

test('Revisió · amb la font de l’original en error (o sense l’element), es connecta sense original', async () => {
  mocks.mur = { status: 'error', feedPosts: [], events: [], marketItems: [] };
  render(<ConnectarSection />);
  expect(screen.queryByRole('button', { name: 'Carregant l’original…' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0].origen).not.toHaveProperty('drets');
});

test('T43 · D10: sense la columna notes.origen el servidor ho rebutja i es diu clar, sense l’error cru', async () => {
  mocks.crea.mockRejectedValue(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'origen\' column of \'notes\' in the schema cache"}'));
  render(<ConnectarSection />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: CONNECTA })); });
  const avis = await screen.findByRole('alert');
  expect(avis.textContent).toContain('El servidor d’este poble encara no admet connexions');
  expect(avis.textContent).not.toContain('PGRST204');
  expect(mocks.navigate).not.toHaveBeenCalled();
});


/* 261022: el contacte humà no és el desat d'una targeta al MAS.
   Gauntlet 261022_0225 (CA-1, CA-2, CA-4 i CA-6) · El xat amb l'autor és el
   de «En privat» (useAccions): l'entitat pilot va al xat de Sóc de Poble que
   resol el port, en remot un id de la llavor no té xat i en llavor va a l'id
   del padró (directeAmb). El botó diu amb qui, amb el nom de l'element resolt
   i per t(). Les fitxes del Mercat són les de supabase/seed.sql (app_content). */
const UUID_PERSONA = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';
const UUID_ENTITAT = '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091';
const UUID_SOCDEPOBLE = '0e9d8c7b-6a5f-4e3d-9c2b-1a0f9e8d7c6b';
const SAMARRETA = { author_name: 'Sóc de Poble', seller: 'Sóc de Poble', author_id: 'soc-de-poble_official', author_entity_id: 'socdepoble' };
const MAC_MINI = { author_name: 'Javi Llinares', seller: 'Javi Llinares', author_id: 'javillinares' };
/* El valor de ProveidorXatSocDePoble: en remot, amb l'entitat ja resolta pel port; en llavor, amb directeAmb. */
const XAT_REMOT = Object.freeze({ estat: 'remot', href: `/xat?amb=${UUID_SOCDEPOBLE}`, avis: null, resol: null });
const XAT_DE_LLAVOR = Object.freeze({ ...XAT_SOCDEPOBLE_DE_LLAVOR, directeAmb: directeDeLlavor });
const ambXat = (xat) => <XatSocDePobleContext.Provider value={xat}><ConnectarSection /></XatSocDePobleContext.Provider>;
const seccioDeLAutor = () => screen.queryByRole('heading', { name: 'Connectar amb l’autor' });
const TEXT_AUTOR = (nom) => `Obri una conversa privada amb ${nom}. Li apareixerà de seguida a la seua llista de converses, però no rebrà cap missatge fins que l’escrigues.`;
/* Revisió (CN-R4) · En llavor la conversa és d'este dispositiu: l'autor no la veu. */
const TEXT_AUTOR_LLAVOR = (nom) => `Obri una conversa privada amb ${nom} en este dispositiu. No rebrà cap missatge fins que l’escrigues.`;

test.each([
  [{ author_user_id: UUID_PERSONA }, UUID_PERSONA],
  [{ author_org_id: UUID_ENTITAT, author_user_id: UUID_PERSONA }, UUID_ENTITAT]
])('remot · un autor amb l’id del servidor: el botó diu amb qui, obri el seu xat i no envia res: %j', (autoria, id) => {
  mocks.mur = MERCAT_AMB(autoria);
  render(ambXat(XAT_REMOT));
  expect(mocks.xat.creaFil).not.toHaveBeenCalled();
  expect(mocks.xat.sendChatMessage).not.toHaveBeenCalled();
  expect(mocks.crea).not.toHaveBeenCalled();
  /* CA-4 · el text no amaga que la conversa ja li apareix a l'autor. */
  expect(screen.getByText(TEXT_AUTOR('Pepa Soler'))).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li a Pepa Soler' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${id}`);
  expect(mocks.crea).not.toHaveBeenCalled();
  expect(mocks.xat.sendChatMessage).not.toHaveBeenCalled();
});

test('R2C2X-02 · l’autoria d’Oli amb l’UUID remot oferix el seu xat sense tractar-la com a identitat fundacional', () => {
  const id = '3073b933-69fc-4c3e-80dc-b0df9c6b8391';
  mocks.mur = MERCAT_AMB({ author_org_id: id, author_name: 'Oli de La Torre' });
  render(ambXat(XAT_REMOT));
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li a Oli de La Torre' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${id}`);
  expect(mocks.crea).not.toHaveBeenCalled();
  expect(mocks.xat.creaFil).not.toHaveBeenCalled();
  expect(mocks.xat.sendChatMessage).not.toHaveBeenCalled();
});

test('CA-1 · remot · la Samarreta (entitat pilot) obri el xat de Sóc de Poble que ha resolt el port, mai /xat?amb=socdepoble', () => {
  mocks.mur = MERCAT_AMB(SAMARRETA);
  render(ambXat(XAT_REMOT));
  expect(screen.getByText(TEXT_AUTOR('Sóc de Poble'))).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li a Sóc de Poble' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID_SOCDEPOBLE}`);
  expect(mocks.navigate).not.toHaveBeenCalledWith('/xat?amb=socdepoble');
  expect(mocks.xat.creaFil).not.toHaveBeenCalled();
});

test('CA-1 · remot · amb el xat de Sóc de Poble encara per resoldre, el clic el demana al proveïdor i hi va quan arriba', async () => {
  const resol = vi.fn(async () => ({ estat: 'remot', href: `/xat?amb=${UUID_SOCDEPOBLE}`, avis: null, darrera: true }));
  mocks.mur = MERCAT_AMB(SAMARRETA);
  render(ambXat({ estat: 'pendent', href: null, avis: 'Xat de Sóc de Poble: encara s’està buscant en este servidor.', resol }));
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li a Sóc de Poble' }));
  expect(resol).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID_SOCDEPOBLE}`));
  expect(mocks.navigate).not.toHaveBeenCalledWith('/xat?amb=socdepoble');
});

test('CA-1 · remot · sense abast de backend (resol null), la Samarreta no ofereix cap xat', () => {
  mocks.mur = MERCAT_AMB(SAMARRETA);
  render(ambXat({ estat: 'absent', href: null, avis: 'Xat de Sóc de Poble: encara no disponible en este servidor.', resol: null }));
  expect(seccioDeLAutor()).toBeNull();
});

/* Revisió (CN-R5) · L'«absent» que ha dit el port conserva `resol` per a
   tornar-ho a provar passada l'espera (M4-01): el botó hi és, i durant
   l'espera el clic diu l'avís i no porta enlloc. */
test('CN-R5 · remot · amb l’«absent» del port, la Samarreta conserva el botó: el clic diu l’avís i no navega', async () => {
  const AVIS_ABSENT = 'Xat de Sóc de Poble: encara no disponible en este servidor.';
  const resol = vi.fn(async () => ({ estat: 'absent', href: null, avis: AVIS_ABSENT, darrera: true }));
  mocks.mur = MERCAT_AMB(SAMARRETA);
  render(ambXat({ estat: 'absent', href: null, avis: AVIS_ABSENT, resol }));
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li a Sóc de Poble' }));
  expect(mocks.toast).toHaveBeenCalledWith(AVIS_ABSENT);
  expect(resol).toHaveBeenCalledTimes(1);
  await act(async () => { await resol.mock.results[0].value; });
  expect(mocks.toast).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test.each(['javillinares', 'javi-llinares'])('CA-1 · remot · el Mac Mini signat amb l’àlies de llavor %s no ofereix cap xat: el servidor no el pot obrir', (alies) => {
  mocks.mur = MERCAT_AMB({ ...MAC_MINI, author_id: alies });
  render(ambXat(XAT_REMOT));
  expect(seccioDeLAutor()).toBeNull();
  expect(mocks.navigate).not.toHaveBeenCalled();
});

/* Revisió (CN-R2) · La guarda de la llavor no mira el tipus declarat. */
test.each([
  ['soc-de-poble_official', 'Sóc de Poble'],
  [IAIA_ID, 'IAIA MarIA']
])('CN-R2 · remot · un id de la llavor signat com a persona (%s) no ofereix cap xat', (idDeLlavor, nom) => {
  mocks.mur = MERCAT_AMB({ author_name: nom, seller: nom, author_id: idDeLlavor });
  render(ambXat(XAT_REMOT));
  expect(seccioDeLAutor()).toBeNull();
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('CA-2 · en remot, la sessió acreditada de la persona pilot signa també amb els seus àlies; una altra sessió, no', () => {
  const actor = { tipus: 'persona', id: UUID_PERSONA, slug: 'javillinares' };
  const pilot = { id: UUID_PERSONA, email: CORREU_PERSONA_PILOT, email_confirmed_at: '2026-10-18T18:00:00.000Z' };
  const propis = idsDeQuiConnecta({ currentUser: pilot, actor, identitats: [actor], dataMode: 'remote' });
  expect([...propis]).toEqual(expect.arrayContaining([UUID_PERSONA, 'javillinares', 'javi-llinares', '0001']));
  /* El mateix UUID sense el correu acreditat no és la persona pilot: cap àlies (D1, mai pel nom). */
  const altra = idsDeQuiConnecta({ currentUser: { id: UUID_PERSONA }, actor, identitats: [actor], dataMode: 'remote' });
  expect([...altra]).toEqual([UUID_PERSONA]);
});

/* Revisió (CN-R1) · En remot ho decidix esIdDeLaLlavor, per a qualsevol sessió. */
test('CA-2 · remot · el Mac Mini no té xat ni per a la persona pilot ni per a cap altra sessió (esIdDeLaLlavor)', () => {
  mocks.user = { id: UUID_PERSONA, email: CORREU_PERSONA_PILOT, email_confirmed_at: '2026-10-18T18:00:00.000Z' };
  mocks.identitat = { actor: { tipus: 'persona', id: UUID_PERSONA, nom: 'Javi Llinares' }, identitats: [{ tipus: 'persona', id: UUID_PERSONA, nom: 'Javi Llinares' }] };
  mocks.mur = MERCAT_AMB(MAC_MINI);
  const vista = render(ambXat(XAT_REMOT));
  expect(seccioDeLAutor()).toBeNull();
  mocks.user = { id: UUID_PERSONA };
  vista.rerender(ambXat(XAT_REMOT));
  expect(seccioDeLAutor()).toBeNull();
});

/* Revisió (CN-R1) · En 'local' aliesDeLActor no dona cap àlies a una persona:
   l'únic que fa seu el Mac Mini és el compte acreditat de la persona pilot. */
test('CA-2 · local · la persona pilot no té xat sobre el seu Mac Mini; el mateix id sense el correu acreditat va al directe del padró (0001)', () => {
  mocks.config = { dataMode: 'local' };
  const actor = { tipus: 'persona', id: UUID_PERSONA, nom: 'Javi Llinares' };
  mocks.identitat = { actor, identitats: [actor] };
  mocks.mur = MERCAT_AMB(MAC_MINI);
  mocks.user = { id: UUID_PERSONA, email: CORREU_PERSONA_PILOT, email_confirmed_at: '2026-10-18T18:00:00.000Z' };
  const vista = render(ambXat(XAT_DE_LLAVOR));
  expect(seccioDeLAutor()).toBeNull();
  mocks.user = { id: UUID_PERSONA };
  vista.rerender(ambXat(XAT_DE_LLAVOR));
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li a Javi Llinares' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?amb=0001');
});

test('llavor · el Mac Mini va al directe del padró (0001), la Samarreta al xat de Sóc de Poble, i qui no és del padró no té botó', () => {
  mocks.config = { dataMode: 'seed' };
  mocks.mur = MERCAT_AMB(MAC_MINI);
  const vista = render(ambXat(XAT_DE_LLAVOR));
  expect(screen.getByText(TEXT_AUTOR_LLAVOR('Javi Llinares'))).toBeTruthy();
  expect(screen.queryByText(TEXT_AUTOR('Javi Llinares'))).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li a Javi Llinares' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?amb=0001');
  mocks.mur = MERCAT_AMB(SAMARRETA);
  vista.rerender(ambXat(XAT_DE_LLAVOR));
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li a Sóc de Poble' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?amb=socdepoble');
  mocks.mur = MERCAT_AMB({ author_user_id: 'u-veina' });
  vista.rerender(ambXat(XAT_DE_LLAVOR));
  expect(seccioDeLAutor()).toBeNull();
});

test('una autoria inventada en l’URL no activa el contacte, ni sense original ni amb un original sense autor', () => {
  const vista = render(ambXat(XAT_REMOT));
  expect(seccioDeLAutor()).toBeNull();
  mocks.mur = MERCAT_AMB({ author_name: 'Sóc de Poble' });
  vista.rerender(ambXat(XAT_REMOT));
  expect(seccioDeLAutor()).toBeNull();
});

test('un autor sense nom a l’element no té botó: el botó ha de dir amb qui', () => {
  mocks.mur = MERCAT_AMB({ author_name: '', author_user_id: UUID_PERSONA });
  render(ambXat(XAT_REMOT));
  expect(seccioDeLAutor()).toBeNull();
});

test.each([
  { author_user_id: 'U' },
  { author_org_id: 'org-propia' }
])('el contacte humà no obri un xat amb qui mira ni amb una entitat que representa: %j', (autoria) => {
  mocks.identitat.identitats.push({ tipus: 'entitat', id: 'org-propia' });
  mocks.mur = MERCAT_AMB(autoria);
  render(ambXat(XAT_REMOT));
  expect(seccioDeLAutor()).toBeNull();
  expect(mocks.xat.creaFil).not.toHaveBeenCalled();
});

test('sense sessió remota, el botó de l’autor diu amb qui i conserva la consulta per a entrar', () => {
  mocks.user = null;
  mocks.config = { dataMode: 'remote' };
  mocks.mur = MERCAT_AMB({ author_user_id: UUID_PERSONA });
  render(ambXat(XAT_REMOT));
  fireEvent.click(screen.getByRole('button', { name: 'Entra per a escriure-li a Pepa Soler' }));
  expect(anadaAEntrar(mocks.navigate.mock.calls.at(-1)[0])).toEqual({ ruta: '/registre', mode: 'entrar', tornar: `/connectar?${mocks.params}` });
  expect(mocks.xat.creaFil).not.toHaveBeenCalled();
  expect(mocks.crea).not.toHaveBeenCalled();
});

test('CA-6 · en castellà, el títol, el text i el botó són del diccionari, amb el nom de l’element i no el de l’URL', () => {
  mocks.t = createTranslator('es');
  mocks.params = new URLSearchParams(PARAMS.replace('author=S%C3%B3c%20de%20Poble', 'author=Impostora'));
  mocks.mur = MERCAT_AMB({ author_user_id: UUID_PERSONA });
  render(ambXat(XAT_REMOT));
  expect(screen.getByRole('heading', { name: 'Conectar con el autor' })).toBeTruthy();
  expect(screen.getByText(/^Abre una conversación privada con Pepa Soler\. /)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Escríbele a Pepa Soler' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID_PERSONA}`);
  expect(screen.queryByText(/Impostora/)).toBeNull();
});

test('CA-6 · les claus del xat amb l’autor són als cinc diccionaris, cadascuna amb el seu {nom}', () => {
  const CLAUS_AMB_NOM = ['section.connectar.autor.text', 'section.connectar.autor.textLlavor', 'section.connectar.autor.boto', 'section.connectar.autor.entra'];
  for (const { code } of SUPPORTED_LANGUAGES) {
    for (const clau of ['section.connectar.autor.titol', ...CLAUS_AMB_NOM]) expect(FONTS_PER_IDIOMA[code]).toContain(`'${clau}':`);
    const t = createTranslator(code);
    for (const clau of CLAUS_AMB_NOM) expect(t(clau, '').split('{nom}')).toHaveLength(2);
    /* Revisió (CN-R3) · Cap sufix enganxat al nom: el nom de l'autor és lliure
       i una declinació ('-rekin') només casa amb part dels noms. */
    for (const clau of CLAUS_AMB_NOM) expect(t(clau, '')).not.toMatch(/\{nom\}-/);
  }
});

/* PS-11 (auditoria Pedra Seca 261025) · /connectar sense títol ni item_id
   ensenyava l'identificador intern «element-desconegut» com a títol gran de
   la targeta. Ara la targeta diu una etiqueta llegible (per t()), i l'itemId
   que la nota recorda continua sent el de sempre. */
test('PS-11 · sense títol ni item_id, la targeta diu «Element sense títol» i l’itemId intern no canvia', async () => {
  mocks.params = new URLSearchParams('');
  render(<ConnectarSection />);
  expect(screen.getByRole('heading', { name: 'Element sense títol' })).toBeTruthy();
  expect(screen.queryByText('element-desconegut')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: CONNECTA }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0].origen).toMatchObject({ itemId: 'element-desconegut', titol: 'element-desconegut' });
});

test('PS-11 · l’etiqueta passa pel traductor; amb títol a l’URL, la targeta diu el títol de sempre', () => {
  mocks.t = (clau, alternativa) => (clau === 'section.connectar.senseTitol' ? 'Elemento sin título' : alternativa);
  mocks.params = new URLSearchParams('');
  render(<ConnectarSection />);
  expect(screen.getByRole('heading', { name: 'Elemento sin título' })).toBeTruthy();
  cleanup();
  mocks.params = new URLSearchParams('title=element-desconegut');
  render(<ConnectarSection />);
  expect(screen.getByRole('heading', { name: 'element-desconegut' })).toBeTruthy();
});

/* P1-22 (assalt 261101, T5b) · /connectar sencer en les cinc llengües: amb el
   traductor de veres (createTranslator i els cinc diccionaris), cap text de la
   vista es queda en valencià, llevat del nom de la carpeta, que és de Notes. */
const VALENCIA_DE_LA_VISTA = [
  'Privacitat de la connexió', 'Qui ho pot vore?', 'Persones concretes', 'Tot el poble', 'On arriba',
  'Per defecte, tota connexió', 'Opcional: la connexió', 'Categoria nova', 'Afegir categoria',
  'Assistent de context', 'La IAIA et suggereix', 'Etiqueta lliure', 'Història local', 'Gent del Poble',
  'A les teues notes la llegiràs', 'Es connecta a', 'Producte del Mercat', 'Triada',
  /* FEDI-22 (ordre del Mestre, 261103) · el plegable «Guardar a les teues notes», obert en un element. */
  'Guardar a les teues notes', 'Una còpia al teu Bloc'
];

describe('P1-22 · Connectar en cinc llengües', () => {
  test.each(['es', 'en', 'eu', 'gl'])('%s · el títol, la privacitat, les carpetes, les etiquetes i el peu ixen del diccionari', (code) => {
    const t = createTranslator(code);
    mocks.t = t;
    const { container } = render(<ConnectarSection />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(t('section.connectar.kicker', ''));
    expect(screen.getByRole('group', { name: t('section.connectar.abast.llegenda', '') })).toBeTruthy();
    expect(screen.getByRole('radio', { name: t('section.connectar.abast.persones', '') })).toBeTruthy();
    expect(screen.getByRole('heading', { name: t('section.connectar.privacy', '') })).toBeTruthy();
    expect(screen.getByRole('list', { name: t('section.connectar.etiquetes.llista', '') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t('section.connectar.suggerida.patrimoni', '') })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: t('section.connectar.etiquetes.lliure', '') })).toBeTruthy();
    expect(screen.getByText(t('section.connectar.objecte.producte', ''))).toBeTruthy();
    for (const text of VALENCIA_DE_LA_VISTA) expect(container.textContent, `${code}: ${text}`).not.toContain(text);
    /* El nom de la carpeta és de Notes (residual de P1-22): es queda com està. */
    expect(screen.getByRole('button', { name: `${t('section.connectar.connect', '')} «${SAFATA}»` })).toBeTruthy();
    expect(container.textContent).not.toMatch(/\bMAS/);
  });

  test('es · el botó principal, el camp del padró, el límit i el peu dels enviaments, en castellà', async () => {
    mocks.t = createTranslator('es');
    mocks.xat.cercaMembres.mockResolvedValue([{ usuari_id: 'u1', nom: 'Toni Ferrer', tipus: 'persona', fil_id: null }, { usuari_id: 'e1', nom: 'Colla', tipus: 'entitat' }]);
    render(<ConnectarSection />);
    expect(screen.getByRole('button', { name: `Conectar a «${SAFATA}»` })).toBeTruthy();
    expect(screen.getByText('En tus notas la leerás y podrás editarla como una nota tuya.')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Personas concretas' }));
    expect(screen.getByRole('textbox', { name: 'Busca en el padrón del pueblo' })).toBeTruthy();
    expect(screen.getByText(/^Elige hasta 20 personas\./)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Conectar y enviar a 0 personas' }).disabled).toBe(true);
    expect(screen.getByText('Elige al menos una persona del padrón.')).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: 'Toni Ferrer' }));
    expect(screen.getByRole('button', { name: 'Colla · entidad' })).toBeTruthy();
    expect(screen.getByText('1 de 20 personas elegidas.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Quita a Toni Ferrer de la lista' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Conectar y enviar a 1 persona' })).toBeTruthy();
    expect(screen.getByText('El envío por chat no se puede deshacer.')).toBeTruthy();
  });

  test('es · grups de xat: el missatge del xat i el resum ixen en la llengua de qui connecta', async () => {
    mocks.t = createTranslator('es');
    mocks.xat.chatThreads = [{ id: 'g1', tipus: 'grup', name: 'Comissió de Festes' }, { id: 'g2', tipus: 'grup' }];
    render(<ConnectarSection />);
    fireEvent.click(screen.getByRole('radio', { name: 'Grupos de chat' }));
    expect(screen.getByRole('group', { name: 'Grupos de chat en los que ya estás (hasta 10)' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Grupo sin nombre' })).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Comissió de Festes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Conectar y enviar a 1 grupo' }));
    await screen.findByText('Enviado por chat.');
    const [, text] = mocks.xat.sendChatMessage.mock.calls[0];
    expect(text).toMatch(/^Te envío «Samarreta» \(de Sóc de Poble\), que he guardado en mis notas\. Puedes verlo aquí: \S+\/mercat\/samarreta-socdepoble$/);
    const resum = screen.getByRole('status');
    expect(resum.textContent).toContain('Tus notas');
    expect(resum.textContent).toContain(`Conectada a «${SAFATA}».`);
    expect(resum.textContent).toContain('Hecho');
    expect(resum.textContent).not.toMatch(/Les teues notes|Connectada|Fet\b/);
    expect(screen.getByRole('button', { name: 'Abrir la conexión en tus notas' })).toBeTruthy();
  });

  test('en · l’error del servidor sense la columna de l’origen, traduït i sense el missatge cru', async () => {
    mocks.t = createTranslator('en');
    mocks.crea.mockRejectedValue(Object.assign(new Error('PGRST204 origen'), { codi: 'esquema-absent' }));
    render(<ConnectarSection />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: `Connect to «${SAFATA}»` })); });
    const avis = await screen.findByRole('alert');
    expect(avis.textContent).toContain('Could not connect');
    expect(avis.textContent).toContain('This town’s server does not accept connections yet');
    expect(avis.textContent).not.toContain('PGRST204');
  });

  test('gl · sense sessió en remot: el Mode Foraster i el botó d’entrar, del diccionari', () => {
    mocks.t = createTranslator('gl');
    mocks.user = null;
    mocks.canCreate = false;
    render(<ConnectarSection />);
    expect(screen.getByText('Modo Forasteiro activo', { selector: '.sdp-alerta__titol' })).toBeTruthy();
    expect(screen.getByText('Para conectar tes que entrar na túa conta.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Entra para conectar' })).toBeTruthy();
  });

  test('eu · un contingut de fora: el tipus, d’on ve, el motiu i el peu, sense cap sufix enganxat', () => {
    mocks.t = createTranslator('eu');
    mocks.params = new URLSearchParams({ url: 'https://exemple.org/recepta?id=7', title: 'Coca de llanda' });
    const vista = render(<ConnectarSection />);
    expect(screen.getByText('Sóc de Pobletik kanpoko esteka')).toBeTruthy();
    expect(screen.getByText('Iturria: exemple.org')).toBeTruthy();
    expect(screen.getByText(/^Ohar berri gisa iristen da hona: «Safata d’Entrada»\./)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Konektatu');
    vista.unmount();
    mocks.params = new URLSearchParams({ url: 'ftp://exemple.org/a', title: 'Trampa' });
    render(<ConnectarSection />);
    expect(screen.getByText('Esteka hau ezin da konektatu', { selector: '.sdp-alerta__titol' })).toBeTruthy();
    expect(screen.getByText('Web helbideak bakarrik konekta daitezke (http edo https).')).toBeTruthy();
  });

  /* Gauntlet T5b-G01 · La ruta de fora també tradueix el toast d'èxit i l'error del
     servidor: sense estes dues asercions, tornar-hi el literal valencià passava en verd. */
  test('eu · un contingut de fora: el toast d’èxit i l’error del servidor sense la columna de l’origen, del diccionari', async () => {
    mocks.t = createTranslator('eu');
    mocks.params = new URLSearchParams({ url: 'https://exemple.org/recepta?id=7', title: 'Coca de llanda' });
    const vista = render(<ConnectarSection />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: `Konektatu «${SAFATA}»` })); });
    await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
    expect(mocks.toast).toHaveBeenCalledWith(`Hemen konektatuta: «${SAFATA}». Zure oharra da: edita dezakezu.`, 'success');
    vista.unmount();
    mocks.toast.mockClear();
    mocks.crea.mockRejectedValue(Object.assign(new Error('PGRST204 origen'), { codi: 'esquema-absent' }));
    render(<ConnectarSection />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: `Konektatu «${SAFATA}»` })); });
    const avis = await screen.findByRole('alert');
    expect(avis.textContent).toContain('Esteka ez da konektatu');
    expect(avis.textContent).toContain('Herri honetako zerbitzariak ez ditu oraindik konexioak onartzen');
    expect(avis.textContent).not.toMatch(/PGRST204|El servidor d’este poble/);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('les claus noves amb {nom} o {lloc} el porten una sola vegada i, en basc, sense cap sufix enganxat', () => {
    const AMB_NOM = ['section.connectar.de', 'section.connectar.esConnectaA', 'section.connectar.padro.entitat',
      'section.connectar.padro.lleva', 'section.connectar.etiquetes.lleva'];
    for (const { code } of SUPPORTED_LANGUAGES) {
      const t = createTranslator(code);
      for (const clau of AMB_NOM) {
        expect(FONTS_PER_IDIOMA[code], `${code} ${clau}`).toContain(`'${clau}':`);
        expect(t(clau, '').split('{nom}'), `${code} ${clau}`).toHaveLength(2);
        expect(t(clau, ''), `${code} ${clau}`).not.toMatch(/\{nom\}-/);
      }
      expect(t('section.connectar.extern.de', '').split('{lloc}'), code).toHaveLength(2);
    }
  });
});

/* P1-15 (assalt 261101, T5b) · Els resultats del padró s'anuncien (una regió
   viva sense rol, sempre muntada al panell) i les carpetes són un grup amb nom. */
describe('P1-15 · regions vives i grups amb nom', () => {
  test('les carpetes són un grup que es diu «On arriba» i conté els botons de cada carpeta', () => {
    render(<ConnectarSection />);
    const grup = screen.getByRole('group', { name: 'On arriba' });
    expect(grup.classList.contains('sdp-connectar__carpetes')).toBe(true);
    expect(within(grup).getByRole('button', { name: SAFATA }).getAttribute('aria-pressed')).toBe('true');
    expect(within(grup).getByRole('button', { name: 'Mur' })).toBeTruthy();
  });

  test('cap resultat: la regió diu «Resultats al padró: 0.», el text visible no es duplica i no hi ha cap status de més', async () => {
    render(<ConnectarSection />);
    fireEvent.click(screen.getByRole('radio', { name: 'Persones concretes' }));
    const regio = await screen.findByText('Resultats al padró: 0.');
    expect(regio.getAttribute('aria-live')).toBe('polite');
    expect(regio.getAttribute('role')).toBeNull();
    expect(regio.classList.contains('sdp-nomes-lector')).toBe(true);
    expect(screen.getAllByText('Ningú del padró coincidix amb la cerca.')).toHaveLength(1);
    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });

  test('la regió és la mateixa de principi a fi: buida mentre busca i amb el nombre quan arriba', async () => {
    let respon;
    mocks.xat.cercaMembres.mockImplementation(() => new Promise((resol) => { respon = resol; }));
    const { container } = render(<ConnectarSection />);
    fireEvent.click(screen.getByRole('radio', { name: 'Persones concretes' }));
    const regio = container.querySelector('.sdp-connectar__panell .sdp-nomes-lector[aria-live="polite"]');
    expect(regio).toBeTruthy();
    await screen.findByText('Buscant al padró…');
    expect(regio.textContent).toBe('');
    await act(async () => { respon([{ usuari_id: 'u1', nom: 'Toni Ferrer', tipus: 'persona' }, { usuari_id: 'u2', nom: 'Rosa Pla', tipus: 'persona' }]); });
    expect(regio.textContent).toBe('Resultats al padró: 2.');
    expect(container.querySelector('.sdp-connectar__panell .sdp-nomes-lector[aria-live="polite"]')).toBe(regio);
  });

  test('un padró que falla sense missatge diu el motiu de reserva, en la llengua de qui mira', async () => {
    mocks.t = createTranslator('es');
    mocks.xat.cercaMembres.mockRejectedValue(new Error(''));
    render(<ConnectarSection />);
    fireEvent.click(screen.getByRole('radio', { name: 'Personas concretas' }));
    expect((await screen.findByRole('alert')).textContent).toContain('No se ha podido abrir el padrón del pueblo.');
  });
});
