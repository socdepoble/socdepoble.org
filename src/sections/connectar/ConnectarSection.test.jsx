import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T5 · Connectar crea una nota amb origen a la safata «Connectats».
   T43 (ordre del Mestre, 260928) · objecte tipat, visibilitat honesta amb
   resultat per destinatari, identitat personal i error de servidor traduït. */
/* Els objectes i funcions dels mocks són estables (hoisted): un valor nou a
   cada render entraria als deps dels efectes i faria un bucle. */
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), crea: vi.fn(), update: vi.fn(), canCreate: true, user: { id: 'U' },
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
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: mocks.user }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => mocks.xat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('../notes/NotesDataContext', () => ({
  useNotesData: () => ({
    noteFolders: mocks.folders, notes: mocks.notes, creaNota: mocks.crea, updateNote: mocks.update,
    canCreate: mocks.canCreate, config: mocks.config
  })
}));
/* T43b · el bloc d'administrar té les seues proves; ací només es mira on es munta. */
vi.mock('./organitzacio/BlocAdministrarOrganitzacio.jsx', () => ({
  BlocAdministrarOrganitzacio: ({ orgId, nom, config }) => React.createElement('p', { 'data-bloc-administrar': orgId, 'data-mode': config?.dataMode || '', 'data-nom': nom ?? '' }, 'Administrar')
}));
import ConnectarSection, { origenAmbOriginal, origenDeLaConnexio } from './ConnectarSection.jsx';
import { contingutDeLaConnexio } from '../notes/connexions.js';

const PARAMS = 'item_id=samarreta-socdepoble&title=Samarreta&sectionId=mercat&targetUserId=socdepoble&autorTipus=entitat&author=S%C3%B3c%20de%20Poble';

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.canCreate = true;
  mocks.user = { id: 'U' };
  mocks.config = {};
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

test('la connexió naix a «Connectats», recorda l’origen sencer i porta a la nota', async () => {
  render(<ConnectarSection />);
  expect(screen.getByRole('button', { name: 'Connectats' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' }));
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
  expect(entrada.content).toContain('Guardat per a llegir-lo més tard.');
  /* T54 · replace: «arrere» des del lector no torna al formulari ja desat. */
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=n-9', { replace: true }));
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('Connectats'), 'success');
  expect(mocks.xat.sendChatMessage).not.toHaveBeenCalled();
});

test('es pot triar una altra carpeta i afegir etiquetes abans de guardar', async () => {
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Mur' }));
  fireEvent.click(screen.getByRole('button', { name: 'Patrimoni' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Etiqueta lliure' }), { target: { value: 'Roba' } });
  fireEvent.click(screen.getByRole('button', { name: 'Afegir' }));
  expect(screen.getByRole('button', { name: 'Lleva l’etiqueta Roba' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0]).toMatchObject({ folderId: 'f-mur', tags: ['Patrimoni', 'Roba'] });
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
  expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Cerca al padró del poble' }));
});

/* Correcció C18 (260928) · La carpeta triada es llig sense color; el nom accessible no canvia. */
test('C18 · cada carpeta porta la insígnia «Triada» amb check, decorativa; l’estat el diu aria-pressed', () => {
  render(<ConnectarSection />);
  const connectats = screen.getByRole('button', { name: 'Connectats' });
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

test('sense poder guardar (Foraster en remot) només simula i no crea res', () => {
  mocks.canCreate = false;
  mocks.user = null;
  vi.useFakeTimers();
  try {
    render(<ConnectarSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Simular Guardat' }));
    expect(mocks.crea).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('Mode Foraster'), 'info');
  } finally {
    vi.useRealTimers();
  }
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

test('T43 · la vista diu què es connecta i que la connexió és personal, també actuant com a entitat', () => {
  mocks.identitat = {
    actor: { tipus: 'entitat', nom: 'Forn de la Torre' },
    identitats: [{ tipus: 'persona', nom: 'Pepa Soler' }, { tipus: 'entitat', nom: 'Forn de la Torre' }]
  };
  const { container } = render(<ConnectarSection />);
  expect(container.querySelector('header.page-title h1').textContent).toBe('Connectar');
  expect(container.querySelector('header.bar-blue .btn-connectar')).toBeNull();
  expect(screen.getByText('Producte del Mercat')).toBeTruthy();
  expect(screen.getByText('Es guarda al MAS de Pepa Soler.')).toBeTruthy();
  expect(screen.getByText('Actues com a Forn de la Torre, però les connexions són personals.')).toBeTruthy();
});

test('T43 · les opcions diuen la veritat: en seed «Tot el poble» està desactivada amb el motiu', () => {
  mocks.config = { dataMode: 'seed' };
  render(<ConnectarSection />);
  expect(screen.getByRole('radio', { name: 'Privada' }).checked).toBe(true);
  const poble = screen.getByRole('radio', { name: 'Tot el poble' });
  expect(poble.disabled).toBe(true);
  expect(screen.getByText('Sense servidor no es pot compartir al Mur.')).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Grups' }).disabled).toBe(true);
  expect(screen.getByRole('radio', { name: 'Persones concretes' }).disabled).toBe(false);
});

test('T43 · persones concretes: tria del padró, desa la tria, envia l’enllaç per xat i ho resumix', async () => {
  mocks.params = new URLSearchParams('item_id=sella&title=Sella&sectionId=pobles&objecte=poble&ruta=%2Fpobles%2Fsella');
  mocks.xat.cercaMembres.mockResolvedValue([{ usuari_id: 'u1', nom: 'Toni Ferrer', tipus: 'persona', fil_id: null }]);
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('radio', { name: 'Persones concretes' }));
  expect(screen.getByRole('button', { name: 'Guardar i enviar a 0 persones' }).disabled).toBe(true);
  const toni = await screen.findByRole('button', { name: 'Toni Ferrer' });
  fireEvent.click(toni);
  expect(toni.getAttribute('aria-pressed')).toBe('true');
  expect(mocks.xat.cercaMembres).toHaveBeenCalledWith(null);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar i enviar a 1 persona' }));
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
  expect(screen.getByRole('status').textContent).toContain('Guardada a «Connectats».');
  fireEvent.click(screen.getByRole('button', { name: 'Obrir la connexió al teu MAS' }));
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
  fireEvent.click(screen.getByRole('radio', { name: 'Grups' }));
  expect(screen.queryByRole('checkbox', { name: 'Pepa' })).toBeNull();
  expect(screen.queryByRole('checkbox', { name: 'Sóc de Poble' })).toBeNull();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Comissió de Festes' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'La Torre' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar i enviar a 2 grups' }));
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
  expect(screen.getByRole('radio', { name: 'Grups' }).disabled).toBe(true);
  expect(screen.getByText('Carregant els teus grups de xat…')).toBeTruthy();
  expect(screen.queryByText('Encara no eres en cap grup de xat.')).toBeNull();
  vista.unmount();
  mocks.xat.status = 'ready';
  mocks.xat.avis = 'No s’han pogut carregar les converses.';
  render(<ConnectarSection />);
  expect(screen.getByText('El xat no està disponible ara mateix.')).toBeTruthy();
  expect(screen.queryByText('Encara no eres en cap grup de xat.')).toBeNull();
});

test('T43 · tot el poble (remot amb sessió): guarda, no publica sol i diu que el pas al Mur és pendent', async () => {
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('radio', { name: 'Tot el poble' }));
  /* T54 · el pas al Mur es fa al lector del MAS, amb el botó «Compartir al Mur»
     de la tira (ConnexioDetall). L'avís el nomena sencer: el «Compartir» a
     seques és el de la barra blava, que només envia l'enllaç de l'original. */
  const avis = screen.getByText(/El Mur el llig la gent registrada del poble, no Internet/, { selector: '.sdp-alerta__text' });
  expect(avis.textContent).toContain('prem «Compartir al Mur»');
  expect(avis.textContent).not.toContain('prem «Compartir»');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' }));
  const obrir = await screen.findByRole('button', { name: 'Obrir la connexió al teu MAS' });
  expect(mocks.crea.mock.calls[0][0].origen.abast).toEqual({ mode: 'poble', persones: [], grups: [] });
  expect(mocks.xat.sendChatMessage).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(screen.getByText('Pendent')).toBeTruthy();
  fireEvent.click(obrir);
  expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=n-9', { replace: true });
});

/* T54 · La mini-card resol l'original en local (sectionId + item_id): l'URL no porta cap imatge. */
test('T54 · mini-card amb la foto de l’original quan l’element és al Mercat, sense peu ni data', () => {
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [{ id: 'samarreta-socdepoble', title: 'Samarreta', image_url: '/assets/x.png' }] };
  const { container } = render(<ConnectarSection />);
  const targeta = container.querySelector('.sdp-connectar__previsualitzacio .sp-card');
  expect(targeta.querySelector('img.sp-card-media').getAttribute('src')).toBe('/assets/x.png');
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('Samarreta');
  expect(targeta.querySelector('.sp-card-footer')).toBeNull();
  expect(targeta.querySelector('.btn-date-time')).toBeNull();
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
const ANIMA = 'item_id=%2Fia&title=T%C3%ADtol%20de%20l%E2%80%99URL&objecte=pagina&ruta=%2Fia&author=Foraster&targetUserId=intrus&autorTipus=persona';

test('T71 · una pàgina de text (/ia): la mini-card porta la foto, el títol i l’autor de l’original, no els de l’URL', () => {
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
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  const [entrada] = mocks.crea.mock.calls[0];
  expect(entrada.title).toBe("L'Ànima de la IAIA");
  expect(entrada.origen).toMatchObject({ tipus: 'connexio', titol: "L'Ànima de la IAIA", autorNom: '', ruta: '/ia', objecte: 'pagina' });
  /* T71b · una pàgina no declara autor: cap identitat, tampoc la de l'URL. */
  expect(entrada.origen).toMatchObject({ autorId: '', autorTipus: '' });
  expect(entrada.content).toContain('<a href="/ia">L\'Ànima de la IAIA</a>');
  expect(JSON.stringify(entrada)).not.toMatch(/Foraster|Títol de l’URL|intrus/);
});

/* T71b · revisió de T71: resolt l'original, l'autoria no pot mesclar el nom
   de l'original amb la identitat (targetUserId, autorTipus) de l'URL. */
const INTRUS = 'item_id=samarreta-socdepoble&title=X&sectionId=mercat&targetUserId=intrus&autorTipus=persona&author=Y';
const guardaIRetornaOrigen = async () => {
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' }));
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

test('T71 · amb una url externa, la ruta la mostra i no crea res fins al clic; el clic crea la nota a «Connectats»', async () => {
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
  // El formulari de les connexions internes no hi és.
  expect(screen.queryByRole('button', { name: 'Guardar Connexió' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar a Connectats' }));
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

test('T71 · una url javascript: o data: no es guarda: es diu per què i no hi ha cap botó', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>']) {
    mocks.params = new URLSearchParams({ url, title: 'Trampa' });
    const { container, unmount } = render(<ConnectarSection />);
    expect(screen.getByText('Este enllaç no es pot guardar', { selector: '.sdp-alerta__titol' })).toBeTruthy();
    expect(screen.getByText('Només es poden guardar adreces web (http o https).')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Guardar a Connectats' })).toBeNull();
    expect(container.querySelector('a[href^="javascript"], a[href^="data"]')).toBeNull();
    expect(container.textContent).not.toContain('Trampa');
    expect(mocks.crea).not.toHaveBeenCalled();
    unmount();
  }
});

test('T71 · el Foraster en remot només simula el guardat del contingut de fora', () => {
  mocks.canCreate = false;
  mocks.user = null;
  mocks.params = new URLSearchParams(EXTERN);
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Simular Guardat' }));
  expect(mocks.crea).not.toHaveBeenCalled();
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('Mode Foraster'), 'info');
});

test('T54 · el peu diu el que es podrà fer al MAS: llegir i canviar de carpeta, no etiquetar ni compartir', () => {
  render(<ConnectarSection />);
  const nota = screen.getByText(/Al teu MAS la llegiràs/);
  expect(nota.textContent).not.toMatch(/etiquetar|compartir/);
});

test('T43 · categories del Bloc com a destí de la connexió', async () => {
  mocks.notes = [{ id: 'a', categories: ['Receptes'] }];
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Receptes' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Categoria nova' }), { target: { value: 'Festes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Afegir categoria' }));
  expect(screen.getByRole('button', { name: 'Festes' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Sistema' }).getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0].categories).toEqual(['Receptes', 'Festes']);
});

test('T43b · amb ?organitzacio=ID apareix el bloc d’administrar, i guardar la connexió continua sent una acció a banda', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.params = new URLSearchParams('item_id=socdepoble&title=S%C3%B3c%20de%20Poble&sectionId=perfil&objecte=entitat&ruta=%2Fempresa%2Fsocdepoble&organitzacio=socdepoble');
  const { container } = render(<ConnectarSection />);
  const bloc = container.querySelector('[data-bloc-administrar]');
  expect(bloc.getAttribute('data-bloc-administrar')).toBe('socdepoble');
  expect(bloc.getAttribute('data-mode')).toBe('seed');
  /* T43b-3 · el title de l'URL no arriba al consentiment: el bloc resol el nom d'una font de confiança. */
  expect(bloc.getAttribute('data-nom')).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0].origen).toMatchObject({ objecte: 'entitat', ruta: '/empresa/socdepoble' });
});

test('T43b · sense el paràmetre la vista no porta cap bloc d’administrar', () => {
  const { container } = render(<ConnectarSection />);
  expect(container.querySelector('[data-bloc-administrar]')).toBeNull();
});

test('T43 · D10: sense la columna notes.origen el servidor ho rebutja i es diu clar, sense l’error cru', async () => {
  mocks.crea.mockRejectedValue(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'origen\' column of \'notes\' in the schema cache"}'));
  render(<ConnectarSection />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' })); });
  const avis = await screen.findByRole('alert');
  expect(avis.textContent).toContain('El servidor d’este poble encara no admet connexions');
  expect(avis.textContent).not.toContain('PGRST204');
  expect(mocks.navigate).not.toHaveBeenCalled();
});
