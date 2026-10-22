import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   ORDRE DEL MESTRE (261007, ORDRE E) · LA IMATGE DAMUNT DE L'H1 DEL PERFIL

   «No hi ha cap botó per a posar el logotip (o cap imatge) damunt de
   l'H1.» De punta a punta: PerfilEditor → DocumentEditor →
   UniversalEditorShell → UniversalPage → PageFrame, tot de veres. Només es
   simulen el context del Perfil (sense cua d'autodesament), TipTap, el
   router, el resolutor d'assets i les peces que no hi entren.
   Damunt del nom, el mateix que la fitxa pública; a qui pot editar, el botó.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({ perfil: null, resolts: [] }));
/* Revisió del prompt 261014_0400 · `resolts`: el que l'editor ha demanat al port. */
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => {
    m.resolts.push(ref);
    return ref;
  },
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null, estat: 'fora', generacio: 1 }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/el-meu-perfil' } }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/el-meu-perfil' }),
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUI: () => ({ externalConfig: {} }),
  useUIActions: () => ({ t: (_clau, text) => text }),
}));
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({ ...(await importOriginal()), teCapacitat: () => false }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
  UniversalRichTextContent: () => null,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));

import { PerfilEditor } from './PerfilEditor.jsx';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { oblidaEntitatDelProjecte, RUTA_PERFIL_PROJECTE, rutaDAutoria } from '../../config/navigation.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { llegixDocumentViu } from '../../components/universal/documentViu.js';

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { id: 'U', full_name: 'Pep', town_name: 'La Torre' } };
const ambAvatar = { ...jo, avatar: '/assets/a.webp', dades: { ...jo.dades, avatar_url: '/assets/a.webp' } };
const org = (role, extra = {}) => ({ id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', ...extra, dades: { name: 'Forn', visibility: 'public', role, ...extra.dades } });

beforeEach(() => {
  m.perfil = { identitats: [], autodesament: null, guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn() };
  m.resolts = [];
});
/* Auditoria 261007 (retocs de l'ordre E) · La fitxa d'una organització amb
   slug registra el seu id com a identificador del projecte (estat de mòdul
   de navigation.js): cada prova en comença sense cap. */
afterEach(() => { cleanup(); oblidaEntitatDelProjecte(); });

const capcalera =() => document.querySelector('.sdp-editor-document header.page-title');
const titol = () => within(capcalera()).getByRole('heading', { level: 1 });
const abansDe = (el, despres) => Boolean(el.compareDocumentPosition(despres) & Node.DOCUMENT_POSITION_FOLLOWING);
/* Onada 4 (retallador senzill, 261008) · Els selectors de la fitxa
   (useImatgeDeFitxa), germans de l'editor; el de la ranura de la closca
   (dins de .page-title-logo-personalitzat) ja no s'obri. */
const selector = (camp) => document.querySelector(`input[type="file"][data-imatge-de-fitxa="${camp}"]`);
/* Encàrrec d'harmonització (261018, ordre del Mestre: «la gestió d'imatges va
   dins d'Edició avançada») · En edició, la ranura de la closca, l'avatar redó i
   la capçalera viuen dins del desplegable PLEGAT «Edició avançada», no damunt
   de l'H1. S'obri com ho faria la persona: clicant el resum. */
const desplegable = () => document.querySelector('.sdp-editor-document details.sdp-edicio-avancada');
function obriEdicioAvancada() {
  const details = desplegable();
  expect(details).not.toBeNull();
  expect(details.open).toBe(false);
  fireEvent.click(details.querySelector('summary.sdp-edicio-avancada__resum'));
  expect(details.open).toBe(true);
  return details;
}
const inputDeLaRanura = () => desplegable().querySelector('.sdp-edicio-avancada__logotip input[type="file"]');
/* Els botons d'imatge (abans damunt de l'H1), amb els noms d'abans i els de l'Onada 4. */
const BOTONS_IMATGE = /^(Logotip|Avatar|Editar logotip|Canvia la teua imatge)$/;

/* Encàrrec d'harmonització (261018) · «Logotip» ja no és damunt de l'H1: va
   dins d'«Edició avançada» (.sdp-edicio-avancada__logotip). La intenció es
   queda: obri el selector del logotip de la fitxa, cap diàleg intermedi. */
test('Onada 4 · una organització que no és la pilot: «Logotip» dins d’«Edició avançada», que obri el selector del logotip (cap diàleg intermedi)', () => {
  render(<PerfilEditor identitat={org('owner')} />);
  // Damunt de l'H1, cap ranura: la fitxa neta per a escriure.
  expect(capcalera().querySelector('.page-title-logo-personalitzat')).toBeNull();
  expect(within(capcalera()).queryByRole('button', { name: BOTONS_IMATGE })).toBeNull();
  const details = obriEdicioAvancada();
  expect(details.querySelector('.sdp-edicio-avancada__titol').textContent).toBe('Edició avançada de la fitxa');
  expect(details.querySelector('.sdp-edicio-avancada__subtitol').textContent).toBe('Canvia el logotip, afig la foto de capçalera i gestiona els drets i les dades');
  const boto = within(details).getByRole('button', { name: 'Logotip' });
  expect(boto.closest('.sdp-edicio-avancada__logotip')).not.toBeNull();
  // Una organització no té avatar redó.
  expect(details.querySelector('.sdp-edicio-avancada__identitat')).toBeNull();
  const ranura = vi.spyOn(inputDeLaRanura(), 'click');
  const obri = vi.spyOn(selector('logoImage'), 'click');
  fireEvent.click(boto);
  expect(obri).toHaveBeenCalledOnce();
  expect(ranura).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog', { name: 'Capçalera i avatar' })).toBeNull();
  // La capçalera té el seu botó, a part, i va abans del logotip.
  const botoCapcalera = within(details).getByRole('button', { name: 'Capçalera' });
  expect(botoCapcalera.closest('.sdp-edicio-avancada__capcalera')).not.toBeNull();
  expect(abansDe(botoCapcalera, boto)).toBe(true);
});

/* Encàrrec d'harmonització (261018, ordre del Mestre: «fora l'avatar gegant de
   300px del centre») · L'avatar redó amb la càmera ja no és abans de l'H1:
   damunt del nom no queda res (l'avatar ja va a la barra taronja) i el control
   viu, el primer, dins d'«Edició avançada».
   Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2) · Expectativa
   actualitzada a propòsit: davall del cercle ja no hi ha ni «Avatar», ni
   «Llevar l'avatar», ni la línia d'ajuda; el clic obri directament la
   finestra de retall amb la imatge que ja hi ha, no el selector. */
test('Onada 4 · una persona amb avatar: l’avatar redó amb la càmera, dins d’«Edició avançada» i res damunt de l’H1; el clic obri el retall de la imatge que ja hi ha', async () => {
  render(<PerfilEditor identitat={ambAvatar} />);
  expect(capcalera().querySelector('.page-title-avatar')).toBeNull();
  expect(capcalera().querySelector('.page-title-logo-personalitzat')).toBeNull();
  expect(capcalera().querySelector('img.page-title-logo')).toBeNull();
  expect(abansDe(titol(), desplegable())).toBe(true);
  // Un sol avatar gran a la pàgina, el del desplegable; el de la barra taronja és el discret.
  expect(document.querySelectorAll('.sdp-editor-document .page-title-avatar')).toHaveLength(1);
  expect(barraTaronja().querySelector('img.sp-card-avatar').getAttribute('src')).toBe('/assets/a.webp');
  const details = obriEdicioAvancada();
  expect(details.querySelector('.sdp-edicio-avancada__subtitol').textContent).toBe('Canvia el teu avatar, afig la teua foto de capçalera i gestiona les dades');
  const identitat = details.querySelector('.sdp-edicio-avancada__identitat');
  const avatar = identitat.querySelector('button.page-title-avatar--canvia');
  expect(avatar).not.toBeNull();
  // El nom diu el que fa (Pla 2000): ajustar la imatge que hi ha o canviar-la.
  expect(avatar.getAttribute('aria-label')).toBe('Ajusta o canvia l’avatar');
  expect(avatar.getAttribute('aria-haspopup')).toBe('dialog');
  expect(avatar.querySelector('img').getAttribute('src')).toBe('/assets/a.webp');
  // Neteja total davall del cercle: cap píndola ni cap línia d'ajuda.
  expect(within(identitat).getAllByRole('button')).toEqual([avatar]);
  expect(identitat.querySelector('.page-title-avatar-accions, .sdp-camp__ajuda')).toBeNull();
  expect(identitat.textContent).not.toContain('10 MB');
  // L'avatar és el primer del desplegable, abans de la capçalera; cap ranura.
  expect(abansDe(identitat, details.querySelector('.sdp-edicio-avancada__capcalera'))).toBe(true);
  expect(details.querySelector('.sdp-edicio-avancada__logotip')).toBeNull();
  const obri = vi.spyOn(selector('logoImage'), 'click');
  await act(async () => { fireEvent.click(avatar); });
  expect(obri).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog', { name: 'Retalla la foto' })).toBeTruthy();
});

/* Encàrrec d'harmonització (261018) · La ranura «Avatar» de qui no té foto ja
   no és damunt de l'H1: va dins d'«Edició avançada», després de «Capçalera».
   Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: ja no és cap
   ranura (amb el seu text dels 10 MB), és el cercle buit amb la càmera, el
   primer del desplegable, que obri el mateix selector de l'avatar. */
test('Onada 4 · una persona sense avatar: el cercle buit dins d’«Edició avançada», que obri el selector de l’avatar; «Capçalera», el seu', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(capcalera().querySelector('.page-title-logo-personalitzat')).toBeNull();
  expect(within(capcalera()).queryByRole('button', { name: BOTONS_IMATGE })).toBeNull();
  const details = obriEdicioAvancada();
  const boto = within(details).getByRole('button', { name: 'Posa un avatar' });
  expect(boto.closest('.sdp-edicio-avancada__identitat')).not.toBeNull();
  expect(boto.querySelector('img')).toBeNull();
  expect(boto.querySelector('.page-title-avatar__marca')).not.toBeNull();
  expect(boto.hasAttribute('aria-haspopup')).toBe(false);
  expect(details.querySelector('.sdp-edicio-avancada__logotip')).toBeNull();
  expect(within(details).queryByRole('button', { name: 'Avatar' })).toBeNull();
  const avatar = vi.spyOn(selector('logoImage'), 'click');
  const hero = vi.spyOn(selector('heroImage'), 'click');
  act(() => { fireEvent.click(boto); });
  expect(avatar).toHaveBeenCalledOnce();
  act(() => { fireEvent.click(within(details).getByRole('button', { name: 'Capçalera' })); });
  expect(hero).toHaveBeenCalledOnce();
  expect(avatar).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('ordre E · l’entitat pilot: el logotip fix de Sóc de Poble damunt de l’H1, sense cap botó', () => {
  render(<PerfilEditor identitat={{ ...org('owner'), id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble' }} />);
  const logos = capcalera().querySelectorAll('img.page-title-logo');
  expect([...logos].map((img) => img.className)).toEqual(['page-title-logo light-only', 'page-title-logo dark-only']);
  expect(abansDe(logos[0], titol())).toBe(true);
  expect(capcalera().querySelector('.page-title-logo-personalitzat')).toBeNull();
  expect(within(capcalera()).queryByRole('button', { name: BOTONS_IMATGE })).toBeNull();
  /* Encàrrec d'harmonització (261018) · Tampoc cap ranura dins d'«Edició
     avançada», on ara viuria: només «Capçalera». */
  const details = obriEdicioAvancada();
  expect(details.querySelector('.sdp-edicio-avancada__logotip')).toBeNull();
  expect(within(details).queryByRole('button', { name: BOTONS_IMATGE })).toBeNull();
  expect(within(details).getByRole('button', { name: 'Capçalera' })).toBeTruthy();
});

/* Auditoria 261007 (retocs de l'ordre E) · En remot, l'id de l'entitat pilot
   és un UUID que rutaDAutoria no reconeix fins que algú el registra
   (useEntitatDelProjecte a App.jsx: sense 'directori' no fa res, i després
   d'una fallada espera 60 s). Mentrestant, al propietari se li oferia la
   ranura «Editar logotip», que guanyava al logotip fix, i una pujada
   sobreescrivia el logo_url del pilot. La fitxa el reconeix pel slug de la
   seua fila des del primer render (el registre, en un efecte, no la torna a
   pintar) i el registra per a la resta de l'app. */
test('Auditoria 261007 · l’entitat pilot amb un id UUID i el slug declarat: cap ranura, el logotip fix, i el seu id queda registrat', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  expect(rutaDAutoria({ tipus: 'entitat', id: uuid })).toBe(`/empresa/${uuid}`);
  render(<PerfilEditor identitat={org('owner', { id: uuid, nom: 'Sóc de Poble', dades: { slug: ENTITAT_PILOT_SLUG } })} />);
  expect(capcalera().querySelector('.page-title-logo-personalitzat')).toBeNull();
  expect(capcalera().querySelector('input[type="file"]')).toBeNull();
  expect(within(capcalera()).queryByRole('button', { name: BOTONS_IMATGE })).toBeNull();
  const logos = capcalera().querySelectorAll('img.page-title-logo');
  expect([...logos].map((img) => img.className)).toEqual(['page-title-logo light-only', 'page-title-logo dark-only']);
  expect(abansDe(logos[0], titol())).toBe(true);
  /* Encàrrec d'harmonització (261018) · Cap ranura tampoc dins d'«Edició
     avançada», on ara viuria; la capçalera conserva el seu botó, allí. */
  const details = obriEdicioAvancada();
  expect(details.querySelector('.sdp-edicio-avancada__logotip')).toBeNull();
  expect(within(details).queryByRole('button', { name: BOTONS_IMATGE })).toBeNull();
  expect(within(details).getByRole('button', { name: 'Capçalera' })).toBeTruthy();
  // El registre (com a PerfilPublicSection): les boines del pilot ja porten al seu perfil (Onada 8).
  expect(rutaDAutoria({ tipus: 'entitat', id: uuid })).toBe(RUTA_PERFIL_PROJECTE);
});

/* Encàrrec d'harmonització (261018) · La ranura «Logotip» es conserva, ara
   dins d'«Edició avançada». */
test('Auditoria 261007 · el slug només val per a una entitat: un altre slug o un grup amb el del pilot conserven la ranura i no es registren', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  render(<PerfilEditor identitat={org('owner', { id: uuid, dades: { slug: 'forn' } })} />);
  expect(within(obriEdicioAvancada()).getByRole('button', { name: 'Logotip' }).closest('.sdp-edicio-avancada__logotip')).not.toBeNull();
  cleanup();
  render(<PerfilEditor identitat={org('owner', { id: uuid, mena: 'grup', nom: 'Colla', dades: { slug: ENTITAT_PILOT_SLUG, kind: 'group' } })} />);
  expect(within(obriEdicioAvancada()).getByRole('button', { name: 'Logotip' }).closest('.sdp-edicio-avancada__logotip')).not.toBeNull();
  expect(capcalera().querySelector('img.page-title-logo')).toBeNull();
  expect(rutaDAutoria({ tipus: 'entitat', id: uuid })).toBe(`/empresa/${uuid}`);
});

test('ordre E · un membre sense permís veu el logotip de l’entitat, com a la fitxa pública, sense cap botó', () => {
  render(<PerfilEditor identitat={org('member', { avatar: '/assets/forn.webp', dades: { logo_url: '/assets/forn.webp' } })} />);
  const logo = capcalera().querySelector('img.page-title-logo--entitat');
  expect(logo).not.toBeNull();
  expect(logo.getAttribute('src')).toBe('/assets/forn.webp');
  expect(logo.getAttribute('alt')).toBe('Logotip de Forn');
  expect(abansDe(logo, titol())).toBe(true);
  expect(capcalera().querySelector('button')).toBeNull();
  expect(capcalera().querySelector('input[type="file"]')).toBeNull();
});

/* Relleu 261007 (revisor de perfil-retocs, onada 3b) · El canvi visible que
   faltava provar: en remot, un membre de l'entitat pilot sense permís
   d'edició, mentre el UUID encara no estava registrat, veia el logo_url
   propi del pilot (el logotip de lectura). Amb el slug de la seua fila, la
   fitxa la reconeix des del primer render i hi pinta el logotip fix, com
   PerfilPublicSection; i la lectura no porta cap botó a la capçalera. */
test('Relleu 261007 · un membre de l’entitat pilot sense permís (UUID i slug declarat): el logotip fix, no el propi, i cap botó a la capçalera', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  render(<PerfilEditor identitat={org('member', { id: uuid, nom: 'Sóc de Poble', avatar: '/assets/x.webp', dades: { slug: ENTITAT_PILOT_SLUG, logo_url: '/assets/x.webp' } })} />);
  expect(capcalera().querySelector('img.page-title-logo--entitat')).toBeNull();
  const logos = capcalera().querySelectorAll('img.page-title-logo');
  expect([...logos].map((img) => img.className)).toEqual(['page-title-logo light-only', 'page-title-logo dark-only']);
  expect([...logos].some((img) => img.getAttribute('src') === '/assets/x.webp')).toBe(false);
  expect(abansDe(logos[0], titol())).toBe(true);
  expect(capcalera().querySelector('button')).toBeNull();
  expect(capcalera().querySelector('input[type="file"]')).toBeNull();
});

/* Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com a
   Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
   oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») · La
   fitxa del pilot a /el-meu-perfil, pel slug declarat o per l'id de la llavor
   (el criteri de l'ordre E, esRutaDelProjecte): la barra taronja i la targeta
   viva porten el PNG verd oficial, siga quin siga el logo de la fila (cap,
   una referència opaca o un de propi), també en lectura. */
const barraTaronja = () => {
  const barres = document.querySelectorAll('section.bar-orange');
  expect(barres).toHaveLength(1);
  return barres[0];
};

test('prompt 261014_0400 · la fitxa del pilot: la barra taronja i la targeta viva porten el PNG verd oficial, mai la silueta ni el logo de la fila', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  expect(DEFAULT_AUTHOR.avatarUrl).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
  const fitxes = [
    org('owner', { id: uuid, nom: 'Sóc de Poble', avatar: null, dades: { slug: ENTITAT_PILOT_SLUG } }),
    org('owner', { id: uuid, nom: 'Sóc de Poble', avatar: 'sdp-media://organitzacions/x.png', dades: { slug: ENTITAT_PILOT_SLUG, logo_url: 'sdp-media://organitzacions/x.png' } }),
    org('member', { id: uuid, nom: 'Sóc de Poble', avatar: '/assets/x.webp', dades: { slug: ENTITAT_PILOT_SLUG, logo_url: '/assets/x.webp' } }),
    { ...org('owner'), id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble' },
  ];
  for (const identitat of fitxes) {
    render(<PerfilEditor identitat={identitat} />);
    const barra = barraTaronja();
    expect(barra.querySelector('img.sp-card-avatar').getAttribute('src')).toBe(DEFAULT_AUTHOR.avatarUrl);
    expect(barra.querySelector('.sp-card-avatar--fallback').classList.contains('sp-card-avatar--amagat')).toBe(true);
    expect(llegixDocumentViu(identitat.id).autor.avatar).toBe(DEFAULT_AUTHOR.avatarUrl);
    // La boina continua portant al perfil del pilot.
    expect(llegixDocumentViu(identitat.id).autor.ruta).toBe(RUTA_PERFIL_PROJECTE);
    /* Encàrrec d'harmonització (261018) · Amb «Edició avançada», el logotip
       desat d'una organització es repinta damunt de l'H1 (logoAlTitol). El del
       pilot no: damunt del nom, en edició com en lectura, sempre el logotip fix
       de Sóc de Poble (ordre E; «l'editor del pilot no pinta el logo de la fila
       enlloc», revisió del prompt 261014_0400), mai el de la seua fila. */
    const logos = [...capcalera().querySelectorAll('img.page-title-logo')];
    expect([identitat.dades.role, logos.map((img) => img.className)])
      .toEqual([identitat.dades.role, ['page-title-logo light-only', 'page-title-logo dark-only']]);
    cleanup();
    oblidaEntitatDelProjecte();
  }
});

test('prompt 261014_0400 · una altra organització sense logo (també la que es diu «Sóc de Poble») i una persona no canvien', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  for (const identitat of [org('owner', { id: uuid, dades: { slug: 'forn' } }), org('owner', { id: uuid, nom: 'Sóc de Poble', dades: { slug: 'soc-de-poble-de-relleu' } })]) {
    render(<PerfilEditor identitat={identitat} />);
    const barra = barraTaronja();
    expect(barra.querySelector('img.sp-card-avatar')).toBeNull();
    expect(barra.querySelector('.sp-card-avatar--fallback').classList.contains('sp-card-avatar--amagat')).toBe(false);
    expect(llegixDocumentViu(uuid).autor.avatar).toBe('');
    cleanup();
  }
  render(<PerfilEditor identitat={ambAvatar} />);
  expect(barraTaronja().querySelector('img.sp-card-avatar').getAttribute('src')).toBe('/assets/a.webp');
  expect(llegixDocumentViu('jo').autor.avatar).toBe('/assets/a.webp');
});

/* Revisió del prompt 261014_0400 · L'editor del pilot no pinta el logo de la
   fila enlloc (ni a la barra, ni a la targeta viva, ni damunt de l'H1): no
   se'n demana cap al port, com a la fitxa pública. Una altra organització
   amb una foto pujada continua resolent-la. En lectura, perquè en edició la
   closca (UniversalEditorShell) resol pel seu compte el logoImage del
   document, i això no és de PerfilEditor. */
test('prompt 261014_0400 · l’editor del pilot, en lectura, no demana al port el logo de la fila; una altra organització, sí', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  const logo = 'sdp-media://organitzacions/x.png';
  for (const identitat of [
    org('member', { id: uuid, nom: 'Sóc de Poble', avatar: logo, dades: { slug: ENTITAT_PILOT_SLUG, logo_url: logo } }),
    { ...org('member'), id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble', avatar: logo },
  ]) {
    render(<PerfilEditor identitat={identitat} />);
    expect(barraTaronja().querySelector('img.sp-card-avatar').getAttribute('src')).toBe(DEFAULT_AUTHOR.avatarUrl);
    expect(m.resolts).not.toContain(logo);
    cleanup();
    oblidaEntitatDelProjecte();
    m.resolts = [];
  }
  render(<PerfilEditor identitat={org('member', { avatar: logo, dades: { logo_url: logo } })} />);
  expect(m.resolts).toContain(logo);
});

/* Expectativa actualitzada a propòsit (Gauntlet 261022_0225, PERF-5) · Abans
   la persona en lectura veia el seu avatar redó de 300px damunt de l'H1. Ara,
   com a la seua fitxa pública, la cara només viu a la barra taronja. */
test('ordre E · una persona en lectura (baixa en curs) no porta avatar damunt de l’H1, només a la barra taronja', () => {
  const enBaixa = { ...ambAvatar, dades: { ...ambAvatar.dades, baixa_demanada_at: '2026-09-26T10:00:00Z' } };
  render(<PerfilEditor identitat={enBaixa} />);
  expect(capcalera().querySelector('.page-title-avatar')).toBeNull();
  expect(capcalera().querySelector('.page-title-avatar--canvia')).toBeNull();
  expect(barraTaronja().querySelector('img.sp-card-avatar')).not.toBeNull();
});
