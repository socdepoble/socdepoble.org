import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   Ordre del Mestre (261008) · «LES VISTES»: «Vista A4 / PDF», «Crear
   portada» i «Vista targeta» fora de l'espai d'edició, com un apartat més.
   La pàgina és de veres (DocumentPrintPreview i TargetaViva reals); es
   simulen el context del Perfil, la cua d'autodesament (el que encara no ha
   confirmat el servidor), la Pàgina Universal (com a DetallCompte.test) i
   les peces de l'app que la targeta no necessita. Dades sintètiques.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({ perfil: null, pagina: null, desament: null, resolts: [] }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
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
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';

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
  expect(within(carta).getByText('Persona')).toBeTruthy();
  expect(bloc('Vista targeta').textContent).toContain(AVISOS_TARGETA_VIVA.perfil.vista);
  // Cap xip «Vista targeta»: la targeta ja és a la vista.
  expect(screen.queryByRole('button', { name: 'Vista targeta' })).toBeNull();
  // Els botons de la previsualització no fan res: ho diu l'avís del Perfil, sense prometre cap publicació.
  fireEvent.click(within(carta).getByRole('button', { name: /^Comentar Pep del Mas/ }));
  const avis = screen.getByRole('dialog', { name: AVISOS_TARGETA_VIVA.perfil.titol });
  expect(avis.textContent).toContain(AVISOS_TARGETA_VIVA.perfil.descripcio);
  expect(avis.textContent).not.toMatch(/Mur/);
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
    expect(m.pagina.topBarData).toEqual({
      authorName: 'Sóc de Poble',
      authorAvatar: DEFAULT_AUTHOR.avatarUrl,
      authorLocation: identitat.dades.town_name || '',
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
