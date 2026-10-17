import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   Ordre del Mestre (261008) · «LES VISTES»: «Vista A4 / PDF», «Crear
   portada» i «Vista targeta» fora de l'espai d'edició, com un apartat més.
   La pàgina és de veres (DocumentPrintPreview i TargetaViva reals); es
   simulen el context del Perfil, la cua d'autodesament (el que encara no ha
   confirmat el servidor), la Pàgina Universal (com a DetallCompte.test) i
   les peces de l'app que la targeta no necessita. Dades sintètiques.
   Gauntlet 261016 (F1) · El port (la persona de la sessió, updateProfile i
   updateOrganization) també: les proves del 403, al final, el fan passar per
   la cua de veres. Sense `m.usuari`, la sessió és la del port de sempre.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({
  perfil: null, pagina: null, desament: null, resolts: [], usuari: null, updateProfile: null, updateOrganization: null,
}));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    getCurrentUser: (...args) => (m.usuari ? m.usuari : original.getCurrentUser(...args)),
    updateProfile: (...args) => m.updateProfile(...args),
    updateOrganization: (...args) => m.updateOrganization(...args),
  };
});
vi.mock('../../data/autodesament/useAutodesament.js', () => ({ useAutodesament: (ref) => m.desament(ref) }));
/* Revisió del prompt 261014_0400 · `resolts`: el que s'ha demanat al port. */
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => {
    m.resolts.push(ref);
    return String(ref || '').startsWith('sdp-media://') ? 'blob:avatar-resolt' : ref;
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
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    m.pagina = props;
    const { title, lead, children } = props;
    return (
      <main>
        <header className="page-title"><h1>{title}</h1></header>
        <p>{lead}</p>{children}
      </main>
    );
  },
}));

import { DetallVistes } from './DetallVistes.jsx';
import { AVISOS_TARGETA_VIVA } from '../../components/universal/TargetaViva.jsx';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG, PERSONA_PILOT, POBLE_FUNDACIONAL } from '../../data/identitatsSeed.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const NET = Object.freeze({ camps: Object.freeze({}), errors: Object.freeze({}), estat: 'net', problema: null, persistent: true });
const AUTODESAMENT = Object.freeze({ ambit: 'ambit-A', context: { tenantId: '00000000-0000-4000-8000-000000000000' } });

const jo = {
  id: 'jo', mena: 'persona', nom: 'Pep del Mas', rol: 'Persona', avatar: 'sdp-media://avatars/pep.webp',
  dades: { id: 'U', full_name: 'Pep del Mas', bio: 'Llaurador', lema: 'De la Torre de tota la vida', town_name: 'La Torre', is_public: false },
};
const forn = {
  id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Empresa', avatar: '/assets/forn.webp',
  dades: { name: 'Forn', description: 'Pa de llenya', role: 'owner' },
};

beforeEach(() => {
  m.pagina = null;
  m.resolts = [];
  m.desament = vi.fn(() => NET);
  m.perfil = { identitats: [jo, forn], autodesament: AUTODESAMENT };
  m.usuari = null;
  m.updateProfile = vi.fn(async (canvis) => ({ id: 'U', ...canvis }));
  m.updateOrganization = vi.fn(async (id, canvis) => ({ id, ...canvis }));
});
afterEach(cleanup);

const bloc = (titol) => screen.getByRole('heading', { level: 2, name: titol }).closest('section');
const targeta = () => bloc('Vista targeta').querySelector('article.sp-card.sdp-targeta-viva-carta');
/* Onada 11 (261010; prompt 261010_1730, tasca 3) · el paper s'analitza amb
   DOMParser i es mira el text dels h1: cap literal de marcatge a la prova. */
const paperDom = (paper) => new DOMParser().parseFromString(paper.getAttribute('srcdoc'), 'text/html');
const titolsH1 = (paper) => [...paperDom(paper).querySelectorAll('h1')].map((h) => h.textContent);

test('dos blocs dins d’una pàgina de context: «Vista A4 / PDF» i «Vista targeta», en este ordre', () => {
  render(<DetallVistes identitat={jo} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Les vistes' })).toBeTruthy();
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Vista A4 / PDF', 'Vista targeta']);
  expect(m.pagina).toMatchObject({ chrome: 'context', layout: 'contained' });
  expect(bloc('Vista A4 / PDF').closest('.perfil-compte')).not.toBeNull();
});

test('la vista A4: els dos botons de sempre, que obrin la vista prèvia sense portada i amb portada', () => {
  render(<DetallVistes identitat={jo} />);
  const a4 = bloc('Vista A4 / PDF');
  expect(within(a4).getAllByRole('button').map((b) => b.textContent)).toEqual(['Vista A4 / PDF', 'Crear portada']);
  fireEvent.click(within(a4).getByRole('button', { name: 'Vista A4 / PDF' }));
  expect(screen.getByRole('checkbox', { name: 'Incloure portada' }).checked).toBe(false);
  const paper = screen.getByTitle('Document A4');
  expect(titolsH1(paper)).toEqual(['Pep del Mas']);
  expect(paper.getAttribute('srcdoc')).not.toContain('<section class="cover">');
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tancar' }));
  fireEvent.click(within(a4).getByRole('button', { name: 'Crear portada' }));
  expect(screen.getByRole('checkbox', { name: 'Incloure portada' }).checked).toBe(true);
  // La portada porta el nom de qui signa (el de la barra taronja, com a l'editor); l'únic h1 continua sent el de l'article.
  const ambPortada = screen.getByTitle('Document A4');
  expect(ambPortada.getAttribute('srcdoc')).toContain('<section class="cover">');
  expect(paperDom(ambPortada).querySelector('.cover .cover-titol').textContent).toBe('Pep del Mas');
  expect(titolsH1(ambPortada)).toEqual(['Pep del Mas']);
});

test('la vista targeta: la targeta viva en línia, amb l’autoria de la barra taronja, les píndoles i l’avís del Perfil', () => {
  render(<DetallVistes identitat={jo} />);
  const carta = targeta();
  expect(carta).not.toBeNull();
  expect(carta.querySelector('.sp-card-title').textContent).toBe('Pep del Mas');
  expect(carta.querySelector('.sp-card-subtitle').textContent).toBe('Llaurador');
  expect(carta.querySelector('.sp-card-text').textContent).toBe('De la Torre de tota la vida');
  expect(carta.querySelector('.sp-card-author-name').textContent).toBe('Pep del Mas');
  expect(carta.querySelector('.sp-card-author-location').textContent).toBe('La Torre');
  // Dignitat Humana (pla 261015_1900) · Ni la píndola «Persona» ni drets: el poble ja va a l'autoria.
  expect(within(carta).queryByText('Persona')).toBeNull();
  expect(carta.querySelector('.sp-card-labels')).toBeNull();
  expect(carta.querySelector('.sp-card-copyright')).toBeNull();
  expect(bloc('Vista targeta').textContent).toContain(AVISOS_TARGETA_VIVA.perfil.vista);
  // Cap xip «Vista targeta»: la targeta ja és a la vista.
  expect(screen.queryByRole('button', { name: 'Vista targeta' })).toBeNull();
  // Els botons de la previsualització no fan res: ho diu l'avís del Perfil, sense prometre cap publicació.
  fireEvent.click(within(carta).getByRole('button', { name: /^Comentar Pep del Mas/ }));
  const avis = screen.getByRole('dialog', { name: AVISOS_TARGETA_VIVA.perfil.titol });
  expect(avis.textContent).toContain(AVISOS_TARGETA_VIVA.perfil.descripcio);
  expect(avis.textContent).not.toMatch(/Mur/);
});

/* Directiva de Dignitat Humana (pla 261015_1900, Onada 1.1) · Ni el paper A4,
   ni la portada, ni la targeta de «Les vistes» d'una persona porten drets
   d'autor: tampoc amb una llicència desada o un esborrany vell de «Desar
   autoria» a la cua. Control: l'organització conserva la seua al peu. */
test('Dignitat Humana · la persona: cap drets al paper A4, a la portada ni a la targeta; l’organització, sí', () => {
  m.desament = vi.fn((ref) => (ref ? { ...NET, estat: 'pendent', camps: { copyright: 'CC0 1.0' } } : NET));
  const peus = (paper) => [...paperDom(paper).querySelectorAll('footer')].map((f) => f.textContent).join('|');
  render(<DetallVistes identitat={{ ...jo, dades: { ...jo.dades, copyright: 'CC BY 4.0' } }} />);
  expect(targeta().querySelector('.sp-card-copyright')).toBeNull();
  fireEvent.click(within(bloc('Vista A4 / PDF')).getByRole('button', { name: 'Crear portada' }));
  const paper = screen.getByTitle('Document A4');
  expect(paper.getAttribute('srcdoc')).toContain('<section class="cover">');
  expect(peus(paper)).not.toMatch(/CC BY|CC0|©/);
  cleanup();
  m.desament = vi.fn(() => NET);
  render(<DetallVistes identitat={{ ...forn, dades: { ...forn.dades, copyright: 'CC BY 4.0' } }} />);
  expect(targeta().querySelector('.sp-card-copyright')?.textContent).toBe('CC BY 4.0');
  fireEvent.click(within(bloc('Vista A4 / PDF')).getByRole('button', { name: 'Vista A4 / PDF' }));
  expect(peus(screen.getByTitle('Document A4'))).toContain('CC BY 4.0');
});

test('l’esborrany que el servidor encara no té es veu al paper i a la targeta (la cua, amb la clau de l’editor)', () => {
  m.desament = vi.fn((ref) => (ref ? { ...NET, estat: 'pendent', camps: { title: 'Pep del Mas &amp; Cia', lead: 'Escrit fa un moment' } } : NET));
  render(<DetallVistes identitat={jo} />);
  expect(m.desament).toHaveBeenCalledWith({ ambit: 'ambit-A', context: AUTODESAMENT.context, entitat: 'perfil', id: 'jo' });
  expect(targeta().querySelector('.sp-card-title').textContent).toBe('Pep del Mas & Cia');
  expect(targeta().querySelector('.sp-card-text').textContent).toBe('Escrit fa un moment');
  // El subtítol no s'ha tocat: el del servidor.
  expect(targeta().querySelector('.sp-card-subtitle').textContent).toBe('Llaurador');
  act(() => { fireEvent.click(within(bloc('Vista A4 / PDF')).getByRole('button', { name: 'Vista A4 / PDF' })); });
  expect(screen.getByTitle('Document A4').getAttribute('srcdoc')).toContain('Escrit fa un moment');
});

test('sense àmbit d’autodesament, cap clau de la cua: la fitxa del servidor', () => {
  m.perfil = { ...m.perfil, autodesament: null };
  render(<DetallVistes identitat={jo} />);
  expect(m.desament).toHaveBeenCalledWith(null);
  expect(targeta().querySelector('.sp-card-title').textContent).toBe('Pep del Mas');
});

test('la barra taronja: la fitxa pública (id real), el poble de la persona i l’avatar resolt pel port', () => {
  render(<DetallVistes identitat={jo} />);
  expect(m.pagina.topBarData).toEqual({
    authorName: 'Pep del Mas', authorAvatar: 'blob:avatar-resolt', authorLocation: 'La Torre', authorHref: '/gent/U',
  });
  expect(m.pagina.lead).toContain('Pep del Mas');
});

test('una organització: el seu poble o cap (mai el de la persona), la seua fitxa pública i la clau «organitzacio» de la cua', () => {
  render(<DetallVistes identitat={forn} />);
  expect(m.pagina.topBarData).toEqual({ authorName: 'Forn', authorAvatar: '/assets/forn.webp', authorLocation: '', authorHref: '/empresa/O' });
  expect(m.desament).toHaveBeenCalledWith(expect.objectContaining({ entitat: 'organitzacio', id: 'O' }));
  expect(targeta().querySelector('.sp-card-subtitle').textContent).toBe('Pa de llenya');
  cleanup();
  render(<DetallVistes identitat={{ ...forn, dades: { ...forn.dades, town_name: 'Alcoi' } }} />);
  expect(m.pagina.topBarData.authorLocation).toBe('Alcoi');
});

/* Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com a
   Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
   oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») · «Les
   vistes» diuen el mateix que l'editor (avatarDeLaBarraDeFitxa, de
   fitxaDePerfil.js): la fitxa del pilot, pel slug declarat o per l'id de la
   llavor, porta el PNG verd a la barra taronja i a la «Vista targeta», siga
   quin siga el logo de la fila. El nom, el poble i l'enllaç no canvien. */
const avatarDeLaCarta = () => targeta().querySelector('.sp-card-author .sp-card-avatar');

test('prompt 261014_0400 · la fitxa del pilot: la barra taronja i la «Vista targeta» porten el PNG verd oficial, mai la silueta ni el logo de la fila', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  expect(DEFAULT_AUTHOR.avatarUrl).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
  const pilot = { ...forn, id: uuid, nom: 'Sóc de Poble', dades: { ...forn.dades, name: 'Sóc de Poble', slug: ENTITAT_PILOT_SLUG, town_name: 'Alcoi' } };
  const fitxes = [
    { ...pilot, avatar: null },
    { ...pilot, avatar: '' },
    { ...pilot, avatar: 'sdp-media://organitzacions/x.png' },
    { ...pilot, avatar: '/assets/x.webp', dades: { ...pilot.dades, role: 'member' } },
    { ...forn, id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble', avatar: null },
  ];
  for (const identitat of fitxes) {
    render(<DetallVistes identitat={identitat} />);
    /* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar
       entitats sense poble») · Expectativa actualitzada a propòsit: la fitxa
       del pilot per l'id de la llavor (l'última) i sense poble porta ara el
       seu, POBLE_FUNDACIONAL (abans, ''). Les de l'UUID porten el desat. */
    expect(m.pagina.topBarData).toEqual({
      authorName: 'Sóc de Poble',
      authorAvatar: DEFAULT_AUTHOR.avatarUrl,
      authorLocation: identitat.dades.town_name || (identitat.id === ENTITAT_PILOT_ID ? POBLE_FUNDACIONAL : ''),
      authorHref: RUTA_PERFIL_PROJECTE,
    });
    const avatar = avatarDeLaCarta();
    expect(avatar.tagName).toBe('IMG');
    expect(avatar.getAttribute('src')).toBe(DEFAULT_AUTHOR.avatarUrl);
    expect(targeta().querySelector('.sp-card-avatar--fallback')).toBeNull();
    expect(targeta().querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    cleanup();
  }
});

/* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar entitats
   sense poble»; «El Rentonar no pot aparèixer mai sense poble») · Sense poble
   desat, les tres identitats del Mestre porten el seu a la barra taronja de
   «Les vistes» (pobleDeFitxa → pobleDeReservaDeFitxa, la regla de la fitxa
   pública: clauFundacional). Cap altra fitxa se n'inventa cap, i el poble
   desat sempre mana. */
test('Bloc 3.5.2 · les tres identitats del Mestre sense poble porten el seu; una altra fitxa o un UUID no declarat, cap; el desat mana', () => {
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  const casos = [
    [{ ...forn, id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble' }, POBLE_FUNDACIONAL],
    [{ ...forn, id: ENTITAT_RENTONAR_SLUG, mena: 'grup', nom: 'Rentonar' }, POBLE_FUNDACIONAL],
    [{ ...jo, dades: { ...jo.dades, town_name: '', slug: PERSONA_PILOT.slug } }, POBLE_FUNDACIONAL],
    [{ ...forn, id: uuid, nom: 'Sóc de Poble', dades: { ...forn.dades, slug: ENTITAT_PILOT_SLUG } }, ''],
    [{ ...forn, id: uuid, mena: 'grup', nom: 'Rentonar', dades: { ...forn.dades, slug: ENTITAT_RENTONAR_SLUG } }, ''],
    [forn, ''],
    [{ ...jo, dades: { ...jo.dades, town_name: '' } }, ''],
    [{ ...forn, id: ENTITAT_RENTONAR_SLUG, mena: 'grup', nom: 'Rentonar', dades: { ...forn.dades, town_name: 'Benilloba' } }, 'Benilloba'],
  ];
  for (const [identitat, esperat] of casos) {
    render(<DetallVistes identitat={identitat} />);
    expect([identitat.id, identitat.nom, m.pagina.topBarData.authorLocation]).toEqual([identitat.id, identitat.nom, esperat]);
    cleanup();
  }
});

test('prompt 261014_0400 · una altra organització (també la que es diu «Sóc de Poble») i una persona no canvien', () => {
  render(<DetallVistes identitat={forn} />);
  expect(m.pagina.topBarData.authorAvatar).toBe('/assets/forn.webp');
  expect(avatarDeLaCarta().getAttribute('src')).toBe('/assets/forn.webp');
  cleanup();
  const homonima = { ...forn, id: '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6', nom: 'Sóc de Poble', avatar: null, dades: { ...forn.dades, slug: 'soc-de-poble-de-relleu' } };
  render(<DetallVistes identitat={homonima} />);
  expect(m.pagina.topBarData.authorAvatar).toBe('');
  expect(avatarDeLaCarta().classList.contains('sp-card-avatar--fallback')).toBe(true);
  cleanup();
  render(<DetallVistes identitat={{ ...jo, avatar: '/assets/pep.webp', dades: { ...jo.dades, slug: ENTITAT_PILOT_SLUG } }} />);
  expect(m.pagina.topBarData.authorAvatar).toBe('/assets/pep.webp');
  expect(avatarDeLaCarta().getAttribute('src')).toBe('/assets/pep.webp');
});

/* Revisió del prompt 261014_0400 · La fitxa del pilot no pinta el logo de
   la fila: no se'n demana cap al port (com la fitxa pública, logoCru). Una
   altra organització amb una foto pujada continua resolent-la. */
test('prompt 261014_0400 · la fitxa del pilot no demana al port el logo de la fila; una altra organització, sí', () => {
  const logo = 'sdp-media://organitzacions/x.png';
  const pilots = [
    { ...forn, id: '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6', nom: 'Sóc de Poble', avatar: logo, dades: { ...forn.dades, slug: ENTITAT_PILOT_SLUG } },
    { ...forn, id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble', avatar: logo },
  ];
  for (const identitat of pilots) {
    render(<DetallVistes identitat={identitat} />);
    expect(m.pagina.topBarData.authorAvatar).toBe(DEFAULT_AUTHOR.avatarUrl);
    expect(m.resolts).not.toContain(logo);
    cleanup();
    m.resolts = [];
  }
  render(<DetallVistes identitat={{ ...forn, avatar: logo }} />);
  expect(m.resolts).toContain(logo);
  expect(m.pagina.topBarData.authorAvatar).toBe('blob:avatar-resolt');
});

test('qui només n’és membre no llig la cua (com l’editor en lectura); sense identitat, res', () => {
  render(<DetallVistes identitat={{ ...forn, dades: { ...forn.dades, role: 'member' } }} />);
  expect(m.desament).toHaveBeenCalledWith(null);
  cleanup();
  const { container } = render(<DetallVistes identitat={null} />);
  expect(container.innerHTML).toBe('');
});

/* ═══════════════════════════════════════════════════════════════════
   GAUNTLET 261016 (F1) · «LES VISTES» I L'EDITOR, LA MATEIXA IMATGE

   La regla de font única de l'editor (Bloc 3.5.4, PerfilEditor.jsx:
   imatgeDeLaFitxa i ambEsborranyDImatge). Abans «Les vistes» llegien
   identitat.avatar, el del servidor: després d'un avatar rebutjat (403),
   l'apartat ensenyava la foto vella mentre l'editor, la barra taronja i la
   targeta viva ensenyaven la nova. Com a PerfilEditor.imatges.test.jsx, el
   403 s'injecta al port i el viu la cua de veres (cuaDesament, amb els
   escriptors de perfilEscriptor.js); «Les vistes» en lligen la instantània,
   que és el que dona useAutodesament.
   ═══════════════════════════════════════════════════════════════════ */
describe('Gauntlet 261016 (F1) · un 403 al desat de l’avatar: «Les vistes» porten la imatge de l’editor', () => {
  const VELLA = '/assets/a.webp';
  const NOVA = '/assets/nou.webp';
  const error403 = (taula) => Object.assign(
    new Error(`Supabase 403: {"code":"42501","message":"permission denied for table ${taula}"}`), { status: 403, code: '42501' },
  );
  const javi = { ...jo, nom: 'Javi Llinares', avatar: VELLA, dades: { ...jo.dades, full_name: 'Javi Llinares', avatar_url: VELLA } };
  const rentonar = {
    id: 'R', mena: 'grup', nom: 'El Rentonar', rol: 'Propietària', avatar: '/assets/rentonar.webp',
    dades: { name: 'El Rentonar', role: 'owner', logo_url: '/assets/rentonar.webp' },
  };
  /* La cua només envia amb la sessió de l'àmbit de l'esborrany (ambit.js):
     la persona U dins, com a PerfilEditor.imatges.test.jsx. */
  const AMBIT_U = ambitDe(AUTODESAMENT.context, 'U');
  const refDe = (id, entitat) => ({ ambit: AMBIT_U, context: AUTODESAMENT.context, entitat, id });
  /* El valor s'encua, el servidor el rebutja, i «Les vistes» lligen la cua. */
  async function rebutjat(ref, valor) {
    cuaDesament.encua(ref, 'logoImage', valor);
    await cuaDesament.desaAra(ref);
    m.desament = vi.fn((clau) => (clau ? cuaDesament.llig(clau) : NET));
  }
  const imatges = () => ({ barra: m.pagina.topBarData.authorAvatar, targeta: avatarDeLaCarta()?.getAttribute('src') ?? null });

  beforeEach(() => {
    m.usuari = { id: 'U' };
    m.perfil = { ...m.perfil, autodesament: { ambit: AMBIT_U, context: AUTODESAMENT.context } };
  });
  afterEach(() => cuaDesament.reinicia());

  test('Javi Llinares · l’avatar rebutjat: la barra taronja i la «Vista targeta» porten la foto nova de la cua, no la del servidor', async () => {
    m.updateProfile = vi.fn(async () => { throw error403('profiles'); });
    await rebutjat(refDe('jo', 'perfil'), NOVA);
    const estat = cuaDesament.llig(refDe('jo', 'perfil'));
    expect([estat.estat, estat.camps.logoImage, estat.errors.logoImage.tipus]).toEqual(['error', NOVA, 'servidor']);
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: NOVA }, AUTODESAMENT.context]]);
    render(<DetallVistes identitat={javi} />);
    expect(imatges()).toEqual({ barra: NOVA, targeta: NOVA });
  });

  test('Javi Llinares · «Llevar l’avatar» rebutjat: cap foto (la reserva de la targeta), mai la vella', async () => {
    m.updateProfile = vi.fn(async () => { throw error403('profiles'); });
    await rebutjat(refDe('jo', 'perfil'), '');
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: null }, AUTODESAMENT.context]]);
    render(<DetallVistes identitat={javi} />);
    expect(m.pagina.topBarData.authorAvatar).toBe('');
    expect(avatarDeLaCarta().classList.contains('sp-card-avatar--fallback')).toBe(true);
  });

  test('El Rentonar · el logotip rebutjat, el mateix; «Tornar al que hi ha desat» (la cua neta) torna al del servidor', async () => {
    m.updateOrganization = vi.fn(async () => { throw error403('organizations'); });
    await rebutjat(refDe('R', 'organitzacio'), NOVA);
    expect(m.updateOrganization.mock.calls).toEqual([['R', { logo_url: NOVA }, AUTODESAMENT.context]]);
    expect(cuaDesament.llig(refDe('R', 'organitzacio')).errors.logoImage.tipus).toBe('servidor');
    render(<DetallVistes identitat={rentonar} />);
    expect(imatges()).toEqual({ barra: NOVA, targeta: NOVA });
    cleanup();
    cuaDesament.descarta(refDe('R', 'organitzacio'), 'logoImage');
    render(<DetallVistes identitat={rentonar} />);
    expect(imatges()).toEqual({ barra: '/assets/rentonar.webp', targeta: '/assets/rentonar.webp' });
  });

  test('Sóc de Poble · amb un logotip rebutjat a la cua, la barra i la targeta continuen amb el PNG verd oficial, i no es demana al port', async () => {
    const logo = 'sdp-media://organitzacions/nou.png';
    m.updateOrganization = vi.fn(async () => { throw error403('organizations'); });
    await rebutjat(refDe(ENTITAT_PILOT_ID, 'organitzacio'), logo);
    expect(m.updateOrganization).toHaveBeenCalledTimes(1);
    expect(cuaDesament.llig(refDe(ENTITAT_PILOT_ID, 'organitzacio')).errors.logoImage.tipus).toBe('servidor');
    render(<DetallVistes identitat={{ ...forn, id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble', avatar: null }} />);
    expect(imatges()).toEqual({ barra: DEFAULT_AUTHOR.avatarUrl, targeta: DEFAULT_AUTHOR.avatarUrl });
    expect(m.resolts).not.toContain(logo);
  });

  test('sense esborrany a la cua: la imatge de la fitxa i, sense cap, la reserva de la identitat (la foto de la sessió)', () => {
    render(<DetallVistes identitat={{ ...jo, avatar: 'https://proveidor.example/foto.jpg', dades: { ...jo.dades, avatar_url: '/assets/pep.webp' } }} />);
    expect(imatges()).toEqual({ barra: '/assets/pep.webp', targeta: '/assets/pep.webp' });
    cleanup();
    render(<DetallVistes identitat={{ ...jo, avatar: 'https://proveidor.example/foto.jpg' }} />);
    expect(imatges()).toEqual({ barra: 'https://proveidor.example/foto.jpg', targeta: 'https://proveidor.example/foto.jpg' });
  });
});
