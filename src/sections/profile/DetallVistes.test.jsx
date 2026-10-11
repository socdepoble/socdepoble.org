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

const m = vi.hoisted(() => ({ perfil: null, pagina: null, desament: null }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
vi.mock('../../data/autodesament/useAutodesament.js', () => ({ useAutodesament: (ref) => m.desament(ref) }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => (String(ref || '').startsWith('sdp-media://') ? 'blob:avatar-resolt' : ref),
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

test('qui només n’és membre no llig la cua (com l’editor en lectura); sense identitat, res', () => {
  render(<DetallVistes identitat={{ ...forn, dades: { ...forn.dades, role: 'member' } }} />);
  expect(m.desament).toHaveBeenCalledWith(null);
  cleanup();
  const { container } = render(<DetallVistes identitat={null} />);
  expect(container.innerHTML).toBe('');
});
