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
      { id: 'doc_datat', title: 'Document datat', subtitle: '', categoryId: 'folder:02_saber', tags: [], attributes: { date: '2026-09-21' }, content: 'Text.' },
      { id: '260913_0635_arquitectura_perfil', title: 'Perfil', subtitle: '', categoryId: 'folder:02_saber', tags: [], attributes: {}, content: 'Text.' },
      { id: '260913_0635_amb_frontmatter', title: 'Datat dues voltes', subtitle: '', categoryId: 'folder:02_saber', tags: [], attributes: { date: '2026-09-20T18:00' }, content: 'Text.' }
    ]
  }
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), useLocation: () => ({ search: fixture.search }), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
/* Onada 7 (261009) · La Consola arriba a demanda (lazyRoute): el doble pinta
   una marca perquè la prova veja quan ha arribat. */
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => <p>Doble de la Consola</p> }));
import WikiDePobleSection, { dataDeDocumentWiki } from './WikiDePobleSection';
import { PAGE_COPY } from '../text/pageContent';
import { COPYRIGHT_SDP, dataHoraDeBarra, formatDate, formatTime } from '../../components/universal/editorial.js';
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

/* T51 · Regla del Mestre (260928): cap document sense data. La Wiki la pren
   del frontmatter (`date`) o del segell del nom (aammdd_hhmm). */
const pastilla = (arrel) => [...(arrel.querySelector('.bar-orange .btn-date-time')?.querySelectorAll('span') || [])].map(s => s.textContent);

test('T51 · un document amb el segell aammdd_hhmm al nom porta eixa data i hora a la barra taronja', () => {
  const arrel = obri('260913_0635_arquitectura_perfil');
  expect(pastilla(arrel)).toEqual(['06:35', '13/09/26']);
});

test('T51 · el `date` del frontmatter mana sobre el segell del nom', () => {
  expect(pastilla(obri('260913_0635_amb_frontmatter'))).toEqual(['18:00', '20/09/26']);
});

test('una data real del frontmatter sense hora: el dia, sense hora inventada', () => {
  expect(pastilla(obri('doc_datat'))).toEqual(['21/09/26']);
});

test('T51 · pendent del generador: un document sense `date` ni segell no té cap font real, i no s’hi posa la d’ara', () => {
  // Només es falseja el rellotge: si algú tornara a posar new Date() com a
  // data per defecte, apareixeria el 02/01/30.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2030-01-02T03:04:00Z'));
  try {
    const arrel = obri('doc_llarg');
    expect(arrel.textContent).not.toContain('02/01/30');
    // La detecció del deute: sense cap font, la funció de la pàgina ho diu.
    expect(dataDeDocumentWiki(fixture.props.model.items.find(item => item.id === 'doc_llarg'))).toEqual({ time: '', date: '', dateTime: '' });
    expect(arrel.querySelector('.btn-date-time')).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

test('T51 · dataDeDocumentWiki: frontmatter, després el segell del nom', () => {
  expect(dataDeDocumentWiki({ id: '260913_0635_x', attributes: {} })).toEqual(dataHoraDeBarra({ creat: '2026-09-13T06:35' }));
  expect(dataDeDocumentWiki({ id: '260913_0635_x', attributes: { date: 'no és data' } })).toEqual(dataHoraDeBarra({ creat: '2026-09-13T06:35' }));
  expect(dataDeDocumentWiki({ id: 'x', attributes: { date: '2026-09-21' } }).date).toBe('21/09/26');
  expect(dataDeDocumentWiki(null)).toEqual({ time: '', date: '', dateTime: '' });
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

/* T43 (ordre del Mestre, 260928) · la portada es connecta com a pàgina (abans
   passava onConnect={false}, que tampoc no s'aplicava); un document també. */
test('T43 · la portada i els documents porten CONNECTAR a la barra blava', () => {
  fixture.search = '';
  fixture.itemId = '__intro';
  const portada = render(<WikiDePobleSection />).container;
  expect(portada.querySelector('header.bar-blue .btn-connectar')).not.toBeNull();
  cleanup();
  expect(obri('doc_llarg').querySelector('header.bar-blue .btn-connectar')).not.toBeNull();
});

/* Onada 7 (261009) · La capçalera es pinta de seguida, abans que arribe el
   tros de la Consola; el cos espera amb «Carregant la Consola…» i, quan
   arriba, la capçalera és la mateixa. */
test('Consola incrustada: capçalera amb logo, píndoles, copyright i la data de PAGE_COPY, de seguida; el tauler, quan arriba', async () => {
  const consola = PAGE_COPY.consola;
  const arrel = obri('consola_termodinamica');
  const capcalera = () => {
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
  };
  capcalera();
  // És l'única prova del fitxer que obri la Consola: el tros encara no hi és.
  const espera = screen.getByText('Carregant la Consola…').closest('[role="status"]');
  expect(espera.className).toBe('sdp-carregant');
  expect(espera.closest('header.page-title')).toBeNull();
  expect(screen.queryByText('Doble de la Consola')).toBeNull();
  const cos = espera.parentElement;
  const tauler = await screen.findByText('Doble de la Consola');
  expect(screen.queryByText('Carregant la Consola…')).toBeNull();
  /* Revisió adversarial de l'Onada 7 · La barrera de la Consola no pinta cap
     element quan el tros arriba: el tauler ocupa el lloc de l'espera, al
     mateix pare, i no hi ha cap avís. */
  expect(tauler.parentElement).toBe(cos);
  expect(arrel.querySelector('.sdp-alerta')).toBeNull();
  capcalera();
  expect(arrel.querySelectorAll('h1')).toHaveLength(1);
});

test('T26.2 · en entrar sense res a la URL la portada és el detall i la primera carpeta («Wiki de Poble») és la triada', () => {
  fixture.search = '';
  fixture.itemId = '__intro';
  render(<WikiDePobleSection />);
  expect(fixture.props.initialSelection).toEqual({ categoryId: '__intro_cat', itemId: '__intro' });
  expect(fixture.props.selection).toEqual({ categoryId: '__intro_cat', itemId: '__intro' });
});

test('T26.2 · «Tot» triat a mà es conserva a la URL i torna a ser el filtre', () => {
  fixture.search = '?categoria=__all__';
  fixture.itemId = '__intro';
  render(<WikiDePobleSection />);
  expect(fixture.props.selection).toEqual({ categoryId: '__all__', itemId: '__intro' });
});

test('amb ?item la selecció seguix la URL i l’índex és un fitxer sense carpeta sintètica', () => {
  render(<WikiDePobleSection />);
  expect(fixture.props.selection).toEqual({ categoryId: '__all__', itemId: '00_index' });
  expect(fixture.props.model.categories.some(category => category.id === 'folder:__arrel')).toBe(false);
  expect(fixture.props.model.items.find(item => item.id === '00_index').categoryIds).toEqual([]);
  expect(fixture.props.model.itemsComplete).toBe(true);
});

test('el filtre explícit de carpeta es conserva amb un document obert', () => {
  fixture.search = '?categoria=folder%3A02_saber&item=doc_llarg';
  fixture.itemId = 'doc_llarg';
  render(<WikiDePobleSection />);
  expect(fixture.props.selection).toEqual({ categoryId: 'folder:02_saber', itemId: 'doc_llarg' });
});

/* Pla 261028_1526 (P1-61, Fase 2) · WikiDetail registra el seu <head> amb
   useSEO, que necessita UIProvider. Els contractes visuals d'esta suite són
   independents del head: el real té la seua suite (WikiDePobleSection.seo.test.jsx). */
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
