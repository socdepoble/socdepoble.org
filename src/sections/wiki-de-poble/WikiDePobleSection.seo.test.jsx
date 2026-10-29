/* Pla 261028_1526 (P1-61, Fase 2) · El <head> d'un document de la Wiki, amb el
   head de veres (useSEO i seoHead, sense doble). Abans, WikiDetail no en
   registrava cap: tots els documents portaven el canonical de /wikidepoble.
   El manifest és un doble amb un document públic de reserva, el Llibre d'Or
   (la imatge pròpia de SOCIAL_IMAGES), un altre públic i un privat. La
   UniversalPage és un doble que guarda el Compartir que li arriba.
   Decisió 2 del Mestre (261028) · Compartir un document públic envia la
   forma de camí, /wikidepoble/<id>. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ATRIBUT_SSR } from '../../config/imatgeSocial.js';

const estat = vi.hoisted(() => ({ id: 'llibre', search: '?item=llibre', base: '/portal', props: null }));
vi.mock('../../data/wikiManifest.js', () => ({ wikiManifest: { categories: [], items: [
  { id: 'llibre', title: 'Nom del fitxer', subtitle: 'Descripció de reserva', tags: [],
    attributes: { description: 'Descripció llarga de reserva' },
    content: '# El Llibre d’Or\n\n## Memòria contrastada i llegible\n\nText de la memòria.' },
  { id: 'altre', title: 'altre', tags: [], attributes: {}, content: '# Un altre document\n\nUna entradeta **pròpia** del document.' },
  { id: '03_llibre_d_or_memoria_episodica', title: 'Memòria', tags: [], attributes: { description: 'Memòria dels pobles' }, content: '# El Llibre d’Or' },
  { id: 'privat', title: 'TÍTOL SECRET', tags: [], attributes: { visibility: 'private', description: 'DESCRIPCIÓ SECRETA' }, content: '# TÍTOL SECRET' },
  // R-07 · Una plantilla (comentari SDP:EIXIDA davant de l'H1) i un esborrany sense H1 (comentari sense tancar).
  { id: 'plantilla_acta', title: 'plantilla_acta', tags: [], attributes: { description: 'Plantilla d’acta' },
    content: '<!-- SDP:EIXIDA\ntype: acta\n-->\n<!-- Nom: aammdd_hhmm_acta_titol.md -->\n# Acta de sessió\n\n## Registre\n\nTaula.' },
  { id: 'esborrany_bundle', title: 'esborrany_bundle', tags: [], attributes: {}, content: '<!-- obert\n# Fals' }
] } }));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: ({ model, renderDetail }) => renderDetail({ item: model.items.find((item) => item.id === estat.id) })
}));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({
  UniversalPage: (props) => { estat.props = props; return <article><header className="page-title"><h1>{props.title}</h1></header>{props.children}</article>; }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/wikidepoble', search: estat.search }),
  useRouter: () => ({ basename: estat.base }),
  Link: 'a'
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, valor) => valor, resolveAsset: (uri) => uri }),
  useUIState: () => ({ externalConfig: { manageDocumentHead: true } })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSuperadminEstable.js', () => ({ useSuperadminEstable: () => ({ esSuperadmin: false, rolPendent: false }) }));

import WikiDePobleSection from './WikiDePobleSection.jsx';

afterEach(() => {
  cleanup();
  Object.assign(estat, { id: 'llibre', search: '?item=llibre', base: '/portal', props: null });
  document.head.replaceChildren();
  delete window.Capacitor;
  delete window.navigator.share;
});

const contingut = (selector) => document.head.querySelector(selector)?.getAttribute('content') ?? null;
const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;

/* Un head servit pel prerender (tooling/seo/prerender-social.mjs): cada node
   de la ruta marcat amb ATRIBUT_SSR; og:site_name, del lloc, sense marca. */
function headServit({ titol, clau }) {
  const node = (etiqueta, atributs) => {
    const element = document.createElement(etiqueta);
    for (const [nom, valor] of Object.entries(atributs)) element.setAttribute(nom, valor);
    document.head.appendChild(element);
    return element;
  };
  const title = node('title', { [ATRIBUT_SSR]: '' });
  title.textContent = `${titol} | Sóc de Poble`;
  node('meta', { property: 'og:site_name', content: 'Sóc de Poble' });
  node('meta', { name: 'description', content: `${titol} servit`, [ATRIBUT_SSR]: '' });
  node('meta', { property: 'og:title', content: `${titol} | Sóc de Poble`, [ATRIBUT_SSR]: '' });
  if (clau) {
    node('meta', { property: 'og:url', content: `https://socdepoble.org${clau}`, [ATRIBUT_SSR]: '' });
    node('link', { rel: 'canonical', href: `https://socdepoble.org${clau}`, [ATRIBUT_SSR]: '' });
  }
}

test('H1 i H2 editorials, og:type article i canonical amb l’item i la base', () => {
  render(<WikiDePobleSection />);
  expect(document.title).toBe('El Llibre d’Or | Sóc de Poble');
  expect(contingut('meta[property="og:description"]')).toBe('Memòria contrastada i llegible');
  expect(contingut('meta[property="og:type"]')).toBe('article');
  expect(contingut('meta[name="robots"]')).toBeNull();
  expect(canonical()).toMatch(/\/portal\/wikidepoble\?item=llibre$/);
  expect(contingut('meta[property="og:url"]')).toBe(canonical());
});

test('sense H2 davall de l’H1, l’entradeta en text pla', () => {
  Object.assign(estat, { id: 'altre', search: '?item=altre' });
  render(<WikiDePobleSection />);
  expect(document.title).toBe('Un altre document | Sóc de Poble');
  expect(contingut('meta[name="description"]')).toBe('Una entradeta pròpia del document.');
});

test('el Llibre d’Or porta la imatge pròpia del catàleg públic (SOCIAL_IMAGES), amb mides i MIME', () => {
  Object.assign(estat, { id: '03_llibre_d_or_memoria_episodica', search: '?item=03_llibre_d_or_memoria_episodica' });
  render(<WikiDePobleSection />);
  expect(contingut('meta[property="og:image"]')).toMatch(/\/assets\/system\/ui\/og-llibre-d-or-1200x630[.]png$/);
  expect(contingut('meta[property="og:image:width"]')).toBe('1200');
  expect(contingut('meta[property="og:image:height"]')).toBe('630');
  expect(contingut('meta[property="og:image:type"]')).toBe('image/png');
  expect(contingut('meta[property="og:image:alt"]')).toBe('El Llibre d’Or de Sóc de Poble: memòria contrastada dels pobles');
});

test('un document privat, desconegut o una consulta repetida: genèric, sense indexar i sense canonical', () => {
  const vista = render(<WikiDePobleSection />);
  for (const [id, search] of [['privat', '?item=privat'], ['llibre', '?item=llibre&item=privat'], [undefined, '?item=no_hi_es']]) {
    Object.assign(estat, { id, search });
    vista.rerender(<WikiDePobleSection />);
    expect(document.title).toBe('Wiki de Poble | Sóc de Poble');
    expect(document.head.textContent + JSON.stringify([...document.head.querySelectorAll('meta')].map((m) => m.content))).not.toMatch(/SECRET|Llibre/);
    expect(contingut('meta[name="robots"]')).toBe('noindex, nofollow');
    expect(canonical()).toBeNull();
    expect(contingut('meta[property="og:url"]')).toBeNull();
  }
});

test('R-07 · una plantilla amb el comentari davant porta l’H1 al head i a la pàgina; sense H1, l’id humanitzat', () => {
  Object.assign(estat, { id: 'plantilla_acta', search: '?item=plantilla_acta' });
  const vista = render(<WikiDePobleSection />);
  expect(document.title).toBe('Acta de sessió | Sóc de Poble');
  expect(estat.props.title).toBe('Acta de sessió');
  expect(contingut('meta[property="og:description"]')).toBe('Registre');
  expect(canonical()).toMatch(/\/portal\/wikidepoble\?item=plantilla_acta$/);
  Object.assign(estat, { id: 'esborrany_bundle', search: '?item=esborrany_bundle' });
  vista.rerender(<WikiDePobleSection />);
  expect(document.title).toBe('Esborrany bundle | Sóc de Poble');
  expect(document.head.textContent + JSON.stringify([...document.head.querySelectorAll('meta')].map((m) => m.content))).not.toMatch(/Fals|esborrany_bundle \|/);
  expect(contingut('meta[name="robots"]')).toBeNull();
});

test('sense ?item=, la portada de la Wiki és indexable amb el canonical de la llista', () => {
  Object.assign(estat, { id: '__intro', search: '' });
  render(<WikiDePobleSection />);
  expect(document.title).toBe('Wiki de Poble | Sóc de Poble');
  expect(contingut('meta[name="robots"]')).toBeNull();
  expect(canonical()).toMatch(/\/portal\/wikidepoble$/);
});

test('el head servit del document A es queda a A i se’n va en obrir B al mateix camí', () => {
  estat.base = '';
  headServit({ titol: 'Servit A', clau: '/wikidepoble?item=llibre' });
  const vista = render(<WikiDePobleSection />);
  // A la ruta del head servit, el head és el del servidor.
  expect(document.title).toBe('Servit A | Sóc de Poble');
  expect(canonical()).toBe('https://socdepoble.org/wikidepoble?item=llibre');
  Object.assign(estat, { id: 'altre', search: '?item=altre' });
  vista.rerender(<WikiDePobleSection />);
  expect(document.head.querySelectorAll(`[${ATRIBUT_SSR}]`)).toHaveLength(0);
  expect(document.title).toBe('Un altre document | Sóc de Poble');
  expect(canonical()).toMatch(/\/wikidepoble\?item=altre$/);
  expect(document.head.textContent).not.toContain('Servit A');
  // El del lloc es queda: no és de cap ruta.
  expect(document.head.querySelectorAll('meta[property="og:site_name"]')).toHaveLength(1);
});

test('el head servit de la llista (/wikidepoble, sense canonical) se’n va en el primer registre', () => {
  estat.base = '';
  headServit({ titol: 'Wiki servida', clau: null });
  render(<WikiDePobleSection />);
  expect(document.head.querySelectorAll(`[${ATRIBUT_SSR}]`)).toHaveLength(0);
  expect(document.title).toBe('El Llibre d’Or | Sóc de Poble');
  expect(canonical()).toMatch(/\/wikidepoble\?item=llibre$/);
});

test('Compartir un document públic envia /wikidepoble/<id>; un privat, el Compartir de sempre', async () => {
  Object.assign(estat, { id: '03_llibre_d_or_memoria_episodica', search: '?categoria=folder%3A01_ser&item=03_llibre_d_or_memoria_episodica', base: '' });
  window.Capacitor = { isNativePlatform: () => true };
  const share = vi.fn(async () => undefined);
  Object.defineProperty(window.navigator, 'share', { value: share, configurable: true, writable: true });
  const vista = render(<WikiDePobleSection />);
  expect(typeof estat.props.onShare).toBe('function');
  await estat.props.onShare();
  expect(share).toHaveBeenCalledWith({
    title: 'El Llibre d’Or', url: 'https://socdepoble.org/wikidepoble/03_llibre_d_or_memoria_episodica'
  });
  Object.assign(estat, { id: 'privat', search: '?item=privat' });
  vista.rerender(<WikiDePobleSection />);
  expect(estat.props.onShare).toBeUndefined();
});
