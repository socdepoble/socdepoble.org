import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const fixture = vi.hoisted(() => ({
  content: Array.from({ length: 6 }, (_, i) => `${'#'.repeat(i + 1)} Nivell ${i + 1}`).join('\n\n'),
  search: '?item=00_index',
  itemId: '00_index',
  props: null
}));
/* UniversalPage de veres: les proves miren la capçalera editorial que pinta
   PageFrame (H1, píndoles, copyright, H2, entradilla i data). */
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({ UniversalWorkspace: (props) => { fixture.props = props; const { model, renderDetail, className } = props; return <div className={className}>{renderDetail({ item: model.items.find(item => item.id === fixture.itemId) })}</div>; } }));
vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:02_saber', parentId: null, label: 'SABER' }],
    items: [
      { id: '00_index', title: 'Wiki de Poble', subtitle: '', categoryId: null, tags: [], attributes: {}, get content() { return fixture.content; } },
      {
        id: 'doc_llarg',
        title: 'doc_llarg',
        subtitle: 'Descripció del document.',
        categoryId: 'folder:02_saber',
        tags: ['saber', 'wiki', 'Wiki'],
        attributes: { status: 'esborrany', description: 'Descripció del document.' },
        content: '# Arquitectura tècnica unificada.\n\nEntradilla amb **negreta** i [un enllaç](?item=x).\n\n## Primera secció.\n\nCos del document.'
      },
      { id: 'doc_datat', title: 'Document datat', subtitle: '', categoryId: 'folder:02_saber', tags: [], attributes: { date: '2026-09-21' }, content: 'Text.' }
    ]
  }
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), useLocation: () => ({ search: fixture.search }), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
import WikiDePobleSection from './WikiDePobleSection';
import { PAGE_COPY } from '../text/pageContent';
import { COPYRIGHT_SDP, formatDate, formatTime } from '../../components/universal/editorial.js';
afterEach(() => { cleanup(); fixture.search = '?item=00_index'; fixture.itemId = '00_index'; document.head.querySelectorAll('style[data-test]').forEach(node => node.remove()); });

const obri = (itemId) => { fixture.itemId = itemId; fixture.search = `?item=${itemId}`; return render(<WikiDePobleSection />).container; };
const pindoles = (arrel) => [...arrel.querySelectorAll('.page-title-labels > li')]
  .map((li) => [li.textContent, li.className.replace('sp-card-label ', '')]);

test('un sol h1: el «# » puja a la capçalera i la resta de nivells passen a h3,h4,h5,h6,h6', () => {
  render(<WikiDePobleSection />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Nivell 1');
  const headings = document.querySelectorAll('.sdp-prose :is(h1,h2,h3,h4,h5,h6)');
  expect([...headings].map(node => node.tagName)).toEqual(['H3', 'H4', 'H5', 'H6', 'H6']);
  expect([...headings].map(node => node.className)).toEqual(['h2', 'h3', 'h4', 'h5', 'h6']);
});

test('sense «# » inicial, l’H1 és el títol del manifest i la prosa conserva la democió', () => {
  fixture.content = '## Nivell 2\n\n### Nivell 3';
  try {
    render(<WikiDePobleSection />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wiki de Poble');
    expect([...document.querySelectorAll('.sdp-prose h3.h2, .sdp-prose h4.h3')].map(node => node.textContent)).toEqual(['Nivell 2', 'Nivell 3']);
  } finally {
    fixture.content = Array.from({ length: 6 }, (_, i) => `${'#'.repeat(i + 1)} Nivell ${i + 1}`).join('\n\n');
  }
});

test('capçalera editorial: H1 i H2 sense punt, entradilla extreta i la prosa no la repetix', () => {
  const arrel = obri('doc_llarg');
  expect(arrel.querySelector('header.page-title h1').textContent).toBe('Arquitectura tècnica unificada');
  expect(arrel.querySelector('.page-intro h2').textContent).toBe('Descripció del document');
  const lead = arrel.querySelector('.page-intro p.lead');
  expect(lead.textContent).toBe('Entradilla amb negreta i un enllaç.');
  expect(lead.querySelector('strong').textContent).toBe('negreta');
  expect(lead.querySelector('a').getAttribute('href')).toBe('?item=x');
  const prosa = arrel.querySelector('.sdp-prose');
  expect(prosa.textContent).not.toContain('Entradilla');
  expect(prosa.textContent).not.toContain('Arquitectura tècnica');
  expect(prosa.querySelector('p.lead')).toBeNull();
  expect(prosa.querySelector('h3.h2').textContent).toBe('Primera secció');
  // La descripció ja és l'H2: el quadre ISO no la repetix.
  expect([...arrel.querySelectorAll('.sdp-wiki-iso th')].map(th => th.textContent)).not.toContain('Descripció');
});

test('píndoles: carpeta, «En curs» i etiquetes, sense duplicats; logo i copyright compartit', () => {
  const arrel = obri('doc_llarg');
  expect(pindoles(arrel)).toEqual([
    ['SABER', 'sdp-badge-category'],
    ['saber', 'sdp-badge-tag'],
    ['wiki', 'sdp-badge-tag'],
    ['Wiki', 'sdp-badge-tag']
  ]);
  expect(arrel.querySelectorAll('header.page-title .page-title-logo')).toHaveLength(2);
  expect(arrel.querySelector('.page-title-copyright').textContent).toBe(COPYRIGHT_SDP);
});

test('cap data inventada: sense data al frontmatter no hi ha píndola de data', () => {
  // Només es falseja el rellotge: si algú tornara a posar new Date() com a
  // data per defecte, apareixeria el 02/01/30.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2030-01-02T03:04:00Z'));
  try {
    const arrel = obri('doc_llarg');
    expect(arrel.querySelector('.btn-date-time')).toBeNull();
    expect(arrel.textContent).not.toContain('02/01/30');
    const dates = fixture.props.model.items.filter(item => item.attributes?.date).map(item => [item.id, item.attributes.date]);
    expect(dates).toEqual([['__intro', PAGE_COPY.wikidepoble.date], ['doc_datat', '2026-09-21']]);
  } finally {
    vi.useRealTimers();
  }
});

test('una data real del frontmatter es pinta tal qual: el dia, sense hora inventada', () => {
  const arrel = obri('doc_datat');
  expect(arrel.querySelector('.bar-orange .btn-date-time').textContent).toContain('21/09/26');
});

test('l’accés «Explorador del Cervell» (obrir_graf) ja no és a la Wiki', () => {
  render(<WikiDePobleSection />);
  const { model } = fixture.props;
  expect(model.items.some(item => item.id === 'obrir_graf')).toBe(false);
  expect(model.categories.some(category => category.id === 'obrir_graf_cat')).toBe(false);
});

test('portada: logo, píndoles pròpies, copyright, entradilla i la data de PAGE_COPY', () => {
  fixture.search = '';
  fixture.itemId = '__intro';
  const page = PAGE_COPY.wikidepoble;
  const arrel = render(<WikiDePobleSection />).container;
  expect(arrel.querySelector('header.page-title h1').textContent).toBe(page.title);
  expect(arrel.querySelectorAll('header.page-title .page-title-logo')).toHaveLength(2);
  expect(pindoles(arrel)).toEqual([['WIKI DE POBLE', 'sdp-badge-system'], ['Portada', 'sdp-badge-category']]);
  expect(arrel.querySelector('.page-title-copyright').textContent).toBe(COPYRIGHT_SDP);
  expect(arrel.querySelector('.page-intro p.lead').textContent).toBe(page.lead);
  expect(arrel.querySelector('.hero-image img').getAttribute('alt')).toBe(page.imageAlt);
  expect(arrel.querySelector('.bar-orange .btn-date-time').textContent).toBe(`${formatTime(page.date)}${formatDate(page.date)}`);
});

test('Consola incrustada: capçalera amb logo, píndoles, copyright i la data de PAGE_COPY', () => {
  const consola = PAGE_COPY.consola;
  const arrel = obri('consola_termodinamica');
  expect(arrel.querySelector('header.page-title h1').textContent).toBe(consola.title);
  expect(arrel.querySelectorAll('header.page-title .page-title-logo')).toHaveLength(2);
  expect(pindoles(arrel)).toEqual([
    ['WIKI DE POBLE', 'sdp-badge-system'],
    ['Eina Interactiva', 'sdp-badge-category'],
    ['consola', 'sdp-badge-tag'],
    ['ia', 'sdp-badge-tag']
  ]);
  expect(arrel.querySelector('.page-title-copyright').textContent).toBe(COPYRIGHT_SDP);
  expect(arrel.querySelector('.bar-orange .btn-date-time').textContent).toBe(`${formatTime(consola.date)}${formatDate(consola.date)}`);
});

test('en entrar sense ?item la portada i la categoria «Wiki de Poble» són la selecció', () => {
  fixture.search = '';
  fixture.itemId = '__intro';
  render(<WikiDePobleSection />);
  expect(fixture.props.initialSelection).toEqual({ categoryId: '__intro_cat', itemId: '__intro' });
  expect(fixture.props.selection).toEqual({ categoryId: '__intro_cat', itemId: '__intro' });
});

test('amb ?item la selecció seguix la URL', () => {
  render(<WikiDePobleSection />);
  expect(fixture.props.selection).toEqual({ categoryId: 'folder:__arrel', itemId: '00_index' });
});
