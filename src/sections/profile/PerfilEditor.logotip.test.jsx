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

const m = vi.hoisted(() => ({ perfil: null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
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
vi.mock('../notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<p>llavor</p>' }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));

import { PerfilEditor } from './PerfilEditor.jsx';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { oblidaEntitatDelProjecte, rutaDAutoria } from '../../config/navigation.js';

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { id: 'U', full_name: 'Pep', town_name: 'La Torre' } };
const ambAvatar = { ...jo, avatar: '/assets/a.webp', dades: { ...jo.dades, avatar_url: '/assets/a.webp' } };
const org = (role, extra = {}) => ({ id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', ...extra, dades: { name: 'Forn', visibility: 'public', role, ...extra.dades } });

beforeEach(() => {
  m.perfil = { identitats: [], autodesament: null, guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn() };
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
const inputDeLaRanura = () => capcalera().querySelector('.page-title-logo-personalitzat input[type="file"]');
/* Els botons d'imatge de damunt de l'H1, amb els noms d'abans i els de l'Onada 4. */
const BOTONS_IMATGE = /^(Logotip|Avatar|Editar logotip|Canvia la teua imatge)$/;

test('Onada 4 · una organització que no és la pilot: «Logotip» damunt de l’H1, que obri el selector del logotip (cap diàleg intermedi)', () => {
  render(<PerfilEditor identitat={org('owner')} />);
  const boto = within(capcalera()).getByRole('button', { name: 'Logotip' });
  expect(boto.closest('.page-title-logo-personalitzat')).not.toBeNull();
  expect(abansDe(boto, titol())).toBe(true);
  const ranura = vi.spyOn(inputDeLaRanura(), 'click');
  const obri = vi.spyOn(selector('logoImage'), 'click');
  fireEvent.click(boto);
  expect(obri).toHaveBeenCalledOnce();
  expect(ranura).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog', { name: 'Capçalera i avatar' })).toBeNull();
  // La capçalera té el seu botó, a part.
  expect(screen.getByRole('button', { name: 'Capçalera' })).toBeTruthy();
});

test('Onada 4 · una persona amb avatar: l’avatar redó amb la càmera, abans de l’H1; el clic obri el selector de l’avatar', () => {
  render(<PerfilEditor identitat={ambAvatar} />);
  const avatar = capcalera().querySelector('button.page-title-avatar--canvia');
  expect(avatar).not.toBeNull();
  // El nom el posa PageFrame: el d'abans o, amb el CONTRACTE-1, etiquetaCanvia.
  expect(['Canvia la teua imatge', 'Avatar']).toContain(avatar.getAttribute('aria-label'));
  expect(avatar.querySelector('img').getAttribute('src')).toBe('/assets/a.webp');
  expect(abansDe(avatar, titol())).toBe(true);
  expect(capcalera().querySelector('.page-title-logo-personalitzat')).toBeNull();
  const obri = vi.spyOn(selector('logoImage'), 'click');
  act(() => { fireEvent.click(avatar); });
  expect(obri).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('Onada 4 · una persona sense avatar: la ranura «Avatar», que obri el selector de l’avatar; «Capçalera», el seu', () => {
  render(<PerfilEditor identitat={jo} />);
  const boto = within(capcalera()).getByRole('button', { name: 'Avatar' });
  expect(boto.closest('.page-title-logo-personalitzat')).not.toBeNull();
  expect(abansDe(boto, titol())).toBe(true);
  const ranura = vi.spyOn(inputDeLaRanura(), 'click');
  const avatar = vi.spyOn(selector('logoImage'), 'click');
  const hero = vi.spyOn(selector('heroImage'), 'click');
  act(() => { fireEvent.click(boto); });
  expect(ranura).not.toHaveBeenCalled();
  expect(avatar).toHaveBeenCalledOnce();
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Capçalera' })); });
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
  // Només «Capçalera».
  expect(screen.getByRole('button', { name: 'Capçalera' })).toBeTruthy();
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
  // La capçalera conserva el seu botó.
  expect(screen.getByRole('button', { name: 'Capçalera' })).toBeTruthy();
  // El registre (com a PerfilPublicSection): les boines del pilot ja porten a /projecte.
  expect(rutaDAutoria({ tipus: 'entitat', id: uuid })).toBe('/projecte');
});

test('Auditoria 261007 · el slug només val per a una entitat: un altre slug o un grup amb el del pilot conserven la ranura i no es registren', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  render(<PerfilEditor identitat={org('owner', { id: uuid, dades: { slug: 'forn' } })} />);
  expect(within(capcalera()).getByRole('button', { name: 'Logotip' })).toBeTruthy();
  cleanup();
  render(<PerfilEditor identitat={org('owner', { id: uuid, mena: 'grup', nom: 'Colla', dades: { slug: ENTITAT_PILOT_SLUG, kind: 'group' } })} />);
  expect(within(capcalera()).getByRole('button', { name: 'Logotip' })).toBeTruthy();
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

test('ordre E · una persona en lectura (baixa en curs) veu el seu avatar redó, sense el botó', () => {
  const enBaixa = { ...ambAvatar, dades: { ...ambAvatar.dades, baixa_demanada_at: '2026-09-26T10:00:00Z' } };
  render(<PerfilEditor identitat={enBaixa} />);
  const avatar = capcalera().querySelector('.page-title-avatar');
  expect(avatar.tagName).toBe('DIV');
  expect(avatar.querySelector('img').getAttribute('alt')).toBe('Avatar de Pep');
  expect(capcalera().querySelector('.page-title-avatar--canvia')).toBeNull();
});
