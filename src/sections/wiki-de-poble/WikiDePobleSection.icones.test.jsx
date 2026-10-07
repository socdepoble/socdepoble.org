/* Ordre del Mestre, 261004 (pla 2045, Marató 2230, F3) · Els glifs de la Wiki
   amb el UniversalWorkspace de veres. Regla: una categoria que agrupa
   documents porta carpeta (Tractors, SER, SABER); una entrada directa a una
   sola pàgina, document (Wiki de Poble, Consola); un document final, el seu
   glif. Llei del Píxel: només canvia el glif de la categoria «Tractors»; la
   resta es fixa ací com a guarda. Vitest corre amb import.meta.env.DEV cert,
   de manera que la categoria dels Tractors hi és (al build, no:
   WikiDePobleSection.produccio.test.jsx). Bastida de navegacio.test.jsx. Les
   classes són les que emet lucide-react (lucide-folder, lucide-file-text); la
   identitat del component la prova einesLocals.test.jsx.
   261006 (MarIA, WikiDePobleSection.jsx de les 01:46; prompt 261006_0224, T6):
   ni Tractors ni la Consola tenen ja entrada pròpia a l'arbre. La Consola, els
   Tractors, els Sentinelles i els Agents pengen de «Maquinària de la IAIA»,
   que agrupa documents i per això porta carpeta. Les seues fitxes conserven el
   document, també la de la Consola, que abans el prenia de la seua entrada.
   Ordre del Mestre (261007) · Decisió presa, fins al §0.7 de baix: l'arbre
   (carpetes i categories) continuava amb Lucide, i les fitxes porten el seu
   emoji (iconesWiki.js), en XL
   al quadrat de la fitxa i al seu glif del rail plegat. Ni la Consola ni les
   eines locals porten ja el FileText, i els documents del manifest ja no
   hereten la carpeta.
   Ordre del Mestre (pla 261007_0012, §0.7, «Emojis a l'Índex de la Wiki
   (Carpetes i Arrel)») · L'arbre ja no repetix la carpeta de Lucide: cada
   carpeta i subcarpeta porta el seu emoji, menut com la icona germana
   (NavGlyph, cap XL), i l'entrada de la portada, «Wiki de Poble», el de la
   portada (📖). A la segona columna, la fitxa de la portada porta eixe emoji
   en XL, no la seua imatge. Una carpeta nova sense emoji, Folder. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Els ids de les carpetes són els de veres (iconesWiki.js); «NOVA», una
   carpeta que el manifest porta i la taula encara no. */
vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [
      { id: 'folder:01_ser', label: 'SER' },
      { id: 'folder:02_saber', label: 'SABER' },
      { id: 'folder:02_saber/architecture', parentId: 'folder:02_saber', label: 'ARCHITECTURE' },
      { id: 'folder:09_nova', label: 'NOVA' }
    ],
    items: [
      { id: 'identitat', title: 'Identitat', categoryId: 'folder:01_ser', tags: [], content: '# Identitat' },
      { id: 'coneixement', title: 'Coneixement', categoryId: 'folder:02_saber', tags: [], content: '# Coneixement' },
      { id: 'ADR-2026-08-ONLINE-FIRST', title: 'Online first', categoryId: 'folder:02_saber/architecture', tags: [], content: '# Online first' },
      { id: 'nota_nova', title: 'Nota nova', categoryId: 'folder:09_nova', tags: [], content: '# Nota nova' }
    ]
  }
}));
/* La URL que escriu la Wiki, en un doble: triar una carpeta la canvia i la
   Wiki la torna a llegir, com a navegacio.test.jsx. */
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => {
  const deVeres = await importOriginal();
  const React = await import('react');
  const Context = React.createContext(null);
  return {
    ...deVeres,
    RouterTest: ({ children }) => {
      const [search, setSearch] = React.useState('');
      return <Context.Provider value={{ search, navigate: setSearch }}>{children}</Context.Provider>;
    },
    useNavigate: () => React.useContext(Context)?.navigate ?? deVeres.useNavigate(),
    useLocation: () => {
      const doble = React.useContext(Context);
      return doble ? { search: doble.search } : deVeres.useLocation();
    },
    Link: 'a'
  };
});
vi.mock('../../components/universal/UniversalPage.jsx', () => ({
  UniversalPage: ({ title }) => <header className="page-title"><h1>{title}</h1></header>
}));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../tractors/PanellTractors.jsx', () => ({ default: () => <p>Doble dels Tractors</p> }));
vi.mock('../tractors/PanellSentinelles.jsx', () => ({ default: () => <p>Doble dels Sentinelles</p> }));
vi.mock('../tractors/PanellAgents.jsx', () => ({ default: () => <p>Doble dels Agents</p> }));
/* Tota imatge que porte una fitxa es resol: si la de la portada hi arribara,
   ItemMedia la pintaria en lloc de l'emoji. Sense imatge, la fitxa pinta el
   glif (ItemMedia). */
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAssetState: (ref) => (ref
    ? { url: `https://exemple.test${ref}`, status: 'ready', isLoading: false }
    : { url: null, status: 'idle', isLoading: false })
}));

import { RouterTest } from '../../app/contexts/RouterContext';
import WikiDePobleSection from './WikiDePobleSection.jsx';

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const nav = () => screen.getByRole('navigation', { name: 'WIKI DE POBLE' });
const llista = () => document.querySelector('#app-grid-list');
/* Les classes de glif (lucide-…) que porta un botó, sense la genèrica «lucide». */
const glifs = (boto) => [...boto.querySelectorAll('svg')]
  .flatMap((svg) => [...svg.classList].filter((classe) => classe.startsWith('lucide-')));

/* Les fitxes de la Maquinària de la IAIA: la Consola i les tres eines locals,
   amb el seu emoji (ordre del Mestre, 261007). */
const FITXES_MAQUINARIA = [
  [/Consola Termodinàmica/, '⚙️'], [/Aprovació de tractors/, '🚜'], [/Sentinelles/, '💂'], [/Agents \(BIOS\)/, '🤖']
];
/* El glif de la fitxa: l'emoji XL del quadrat, cap icona de Lucide i cap imatge. */
const emojiDeLaFitxa = (boto) => {
  const glif = boto.querySelector('.sdp-gestor-fitxa__media .sdp-fitxa-emoji-xl');
  return { emoji: glif?.textContent ?? null, lucide: glifs(boto), imatge: boto.querySelector('img') !== null };
};
/* El glif d'una entrada de l'arbre: l'emoji menut de NavGlyph (.sdp-nav-glyph),
   les icones de Lucide i quants emojis XL porta (cap). */
const glifDeLArbre = (boto) => ({
  emoji: boto.querySelector('.sdp-workspace-nav-item__icon .sdp-nav-glyph')?.textContent ?? null,
  lucide: glifs(boto),
  xl: boto.querySelectorAll('.sdp-fitxa-emoji-xl').length
});
const portadaDeLaLlista = () => [...llista().querySelectorAll('.sdp-gestor-fitxa')]
  .find((fitxa) => fitxa.querySelector('.sdp-gestor-fitxa__titol')?.textContent === 'Wiki de Poble');

/* Ordre del Mestre (pla 261007_0012, §0.7) · Cada carpeta i subcarpeta, el seu
   emoji, i la portada, el seu; a l'arbre, menuts (NavGlyph), no XL. */
const ARBRE = [
  ['Wiki de Poble', '📖'], ['Maquinària de la IAIA', '🎛️'], ['SER', '🌱'], ['SABER', '🦉'], ['ARCHITECTURE', '📐']
];

test('arbre: la portada, la Maquinària de la IAIA i cada carpeta i subcarpeta porten el seu emoji, menut (NavGlyph) i mai XL; ni Tractors ni Consola hi tenen entrada pròpia', () => {
  render(<RouterTest><WikiDePobleSection /></RouterTest>);
  const arbre = within(nav());
  fireEvent.click(arbre.getByRole('button', { name: 'Desplegar SABER' }));
  for (const [nom, emoji] of ARBRE) {
    expect(glifDeLArbre(arbre.getByRole('button', { name: nom })), nom).toEqual({ emoji, lucide: [], xl: 0 });
  }
  // Distints entre germanes: cap dues entrades de l'arbre porten el mateix.
  expect(new Set(ARBRE.map(([, emoji]) => emoji)).size).toBe(ARBRE.length);
  // Una carpeta nova del manifest sense emoji a iconesWiki.js: la carpeta de Lucide, sense petar.
  expect(glifDeLArbre(arbre.getByRole('button', { name: 'NOVA' }))).toEqual({ emoji: null, lucide: ['lucide-folder'], xl: 0 });
  // Cap emoji XL a la navegació: l'XL és de la segona columna.
  expect(nav().querySelectorAll('.sdp-fitxa-emoji-xl')).toHaveLength(0);
  expect(arbre.queryByRole('button', { name: 'Tractors' })).toBeNull();
  expect(arbre.queryByRole('button', { name: 'Consola Termodinàmica' })).toBeNull();
});

test('fitxes: la portada, la Consola, les eines locals i els documents del manifest porten el seu emoji XL a «Tot» i dins de la Maquinària; cap carpeta heretada', () => {
  render(<RouterTest><WikiDePobleSection /></RouterTest>);

  fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
  for (const [nom, emoji] of FITXES_MAQUINARIA) {
    expect(emojiDeLaFitxa(within(llista()).getByRole('button', { name: nom })), String(nom)).toEqual({ emoji, lucide: [], imatge: false });
  }
  // Ordre del Mestre (261007) · Els documents del manifest, el seu emoji (iconesWiki.js), no la carpeta.
  expect(emojiDeLaFitxa(within(llista()).getByRole('button', { name: /Identitat/ }))).toEqual({ emoji: '🆔', lucide: [], imatge: false });
  expect(emojiDeLaFitxa(within(llista()).getByRole('button', { name: /Coneixement/ }))).toEqual({ emoji: '📚', lucide: [], imatge: false });
  expect(emojiDeLaFitxa(within(llista()).getByRole('button', { name: /Online first/ }))).toEqual({ emoji: '🏛️', lucide: [], imatge: false });

  // Ordre del Mestre (pla 261007_0012, §0.7) · La portada, el seu emoji en XL a
  // la llista, no la seua imatge (que es resoldria: vegeu el doble de dalt).
  expect(emojiDeLaFitxa(portadaDeLaLlista())).toEqual({ emoji: '📖', lucide: [], imatge: false });

  // Amb la Maquinària activa, glifDeCategoria prova primer eixa carpeta (🎛️): el glif propi guanya.
  fireEvent.click(within(nav()).getByRole('button', { name: 'Maquinària de la IAIA' }));
  expect(within(nav()).getByRole('button', { name: 'Maquinària de la IAIA' }).getAttribute('aria-current')).toBe('page');
  expect(within(llista()).queryByRole('button', { name: /Identitat/ })).toBeNull();
  for (const [nom, emoji] of FITXES_MAQUINARIA) {
    expect(emojiDeLaFitxa(within(llista()).getByRole('button', { name: nom })), String(nom)).toEqual({ emoji, lucide: [], imatge: false });
  }
});

test('a l’entrada, «Wiki de Poble» és la triada i la seua llista porta la fitxa de la portada amb el seu emoji XL', () => {
  render(<RouterTest><WikiDePobleSection /></RouterTest>);
  expect(within(nav()).getByRole('button', { name: 'Wiki de Poble' }).getAttribute('aria-current')).toBe('page');
  expect(llista().querySelectorAll('.sdp-gestor-fitxa')).toHaveLength(1);
  expect(emojiDeLaFitxa(portadaDeLaLlista())).toEqual({ emoji: '📖', lucide: [], imatge: false });
});

test('rail de la llista plegada: la portada i els documents, el seu emoji menut (NavGlyph), mai XL', () => {
  render(<RouterTest><WikiDePobleSection /></RouterTest>);
  fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
  fireEvent.click(screen.getByRole('button', { name: 'Replegar DOCUMENTS' }));
  const rail = document.querySelector('.sdp-workspace-rail--documents');
  const glifDelRail = (nom) => {
    const boto = within(rail).getByRole('button', { name: nom });
    return { emoji: boto.querySelector('.sdp-nav-glyph')?.textContent ?? null, lucide: glifs(boto) };
  };
  expect(glifDelRail('Wiki de Poble')).toEqual({ emoji: '📖', lucide: [] });
  expect(glifDelRail('Identitat')).toEqual({ emoji: '🆔', lucide: [] });
  expect(glifDelRail('Consola Termodinàmica')).toEqual({ emoji: '⚙️', lucide: [] });
  expect(rail.querySelectorAll('.sdp-fitxa-emoji-xl')).toHaveLength(0);
});
