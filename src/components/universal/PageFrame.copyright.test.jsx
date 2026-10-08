/**
 * Ordre del Mestre (261007) · El copyright de la capçalera d'una pàgina és
 * un enllaç a la pàgina «Drets d'autor» (/page/drets-autor), SEMPRE, siga
 * quin siga el text. El paràgraf de sempre (.sp-card-copyright
 * .page-title-copyright) es queda i l'enllaç va dins, amb el LinkComponent
 * de les etiquetes: un <a> sense router, el Link de l'app amb router
 * (UniversalPage hi passa Link).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));
import { Link, MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { ETIQUETA_CANVIA_DRETS, PageFrame, nomDelBotoDeDrets } from './PageFrame.jsx';
import { COPYRIGHT_SDP } from './editorial.js';

afterEach(cleanup);

const COPYRIGHTS = [COPYRIGHT_SDP, '© Pepet', 'CC BY-SA 4.0 · Sóc de Poble'];

test.each(COPYRIGHTS)('sense router, un <a> a /page/drets-autor dins del paràgraf de sempre: «%s»', (copyright) => {
  const { container } = render(<PageFrame title="Títol" copyright={copyright} authorName="Pepa" authorHref="/gent/pepa" />);
  const paragraf = container.querySelector('header.page-title > p.sp-card-copyright.page-title-copyright');
  expect(paragraf.outerHTML).toBe(
    '<p class="sp-card-copyright page-title-copyright">'
    + `<a href="/page/drets-autor" class="sp-card-copyright__enllac">${copyright}</a></p>`
  );
  // El text del paràgraf continua sent el copyright (les proves de la Wiki i del Disseny el lligen així).
  expect(paragraf.textContent).toBe(copyright);
});

test('sense copyright, cap paràgraf ni cap enllaç de drets', () => {
  const { container } = render(<PageFrame title="Títol" authorName="Pepa" authorHref="/gent/pepa" />);
  expect(container.querySelector('.page-title-copyright')).toBeNull();
  expect(container.querySelector('.sp-card-copyright__enllac')).toBeNull();
});

function Ubicacio() {
  const { pathname } = useLocation();
  return <output data-testid="ubicacio">{pathname}</output>;
}

test('amb el Link de l’app (el de UniversalPage), el clic navega a la pàgina dels drets', () => {
  render(
    <MemoryRouter rutaInicial="/legal">
      <PageFrame title="Legal i privacitat" copyright="© Pepet" LinkComponent={Link} authorName="Pepa" authorHref="/gent/pepa" />
      <Ubicacio />
    </MemoryRouter>
  );
  const enllac = screen.getByRole('link', { name: '© Pepet' });
  expect(enllac.className).toBe('sp-card-copyright__enllac');
  expect(enllac.getAttribute('href')).toBe('/page/drets-autor');
  expect(enllac.closest('p').className).toBe('sp-card-copyright page-title-copyright');
  fireEvent.click(enllac);
  expect(screen.getByTestId('ubicacio').textContent).toBe('/page/drets-autor');
});

/* Decisió del Mestre (261008) · En EDICIÓ (onCanviaCopyright, només el passa
   DocumentEditor), el mateix text dins del mateix paràgraf és un botó que obri
   el selector de drets: no navega. El nom accessible comença pel text visible.
   Fora de l'editor (sense la prop, o amb un valor que no és una funció),
   l'enllaç byte a byte. */
test('amb onCanviaCopyright, un botó amb el text, la classe de l’enllaç i data-sdp-drets, dins del paràgraf de sempre', () => {
  const onCanviaCopyright = vi.fn();
  const { container } = render(<PageFrame title="Títol" copyright="CC BY 4.0" onCanviaCopyright={onCanviaCopyright} authorName="Pepa" authorHref="/gent/pepa" />);
  const paragraf = container.querySelector('header.page-title > p.sp-card-copyright.page-title-copyright');
  expect(paragraf.children).toHaveLength(1);
  const boto = paragraf.firstElementChild;
  expect(boto.tagName).toBe('BUTTON');
  expect(boto.getAttribute('type')).toBe('button');
  expect(boto.className).toBe('sp-card-copyright__enllac');
  expect(boto.hasAttribute('data-sdp-drets')).toBe(true);
  expect(boto.textContent).toBe('CC BY 4.0');
  expect(paragraf.textContent).toBe('CC BY 4.0');
  expect(boto.getAttribute('aria-label')).toBe(`CC BY 4.0: ${ETIQUETA_CANVIA_DRETS}`);
  expect(boto.getAttribute('aria-label').startsWith(boto.textContent)).toBe(true);
  expect(container.querySelector('a.sp-card-copyright__enllac')).toBeNull();
  fireEvent.click(boto);
  expect(onCanviaCopyright).toHaveBeenCalledTimes(1);
});

test('amb onCanviaCopyright i el router de l’app, el clic obri el selector i NO navega', () => {
  const onCanviaCopyright = vi.fn();
  render(
    <MemoryRouter rutaInicial="/notes">
      <PageFrame title="Nota" copyright="© Pepet" LinkComponent={Link} onCanviaCopyright={onCanviaCopyright} authorName="Pepa" authorHref="/gent/pepa" />
      <Ubicacio />
    </MemoryRouter>
  );
  expect(screen.queryByRole('link', { name: '© Pepet' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: `© Pepet: ${ETIQUETA_CANVIA_DRETS}` }));
  expect(onCanviaCopyright).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('ubicacio').textContent).toBe('/notes');
});

test('un onCanviaCopyright que no és una funció deixa l’enllaç byte a byte', () => {
  for (const valor of [undefined, null, '/page/drets-autor', true]) {
    const { container, unmount } = render(<PageFrame title="Títol" copyright="© Pepet" onCanviaCopyright={valor} authorName="Pepa" authorHref="/gent/pepa" />);
    expect(container.querySelector('header.page-title > p.page-title-copyright').outerHTML, String(valor)).toBe(
      '<p class="sp-card-copyright page-title-copyright">'
      + '<a href="/page/drets-autor" class="sp-card-copyright__enllac">© Pepet</a></p>'
    );
    unmount();
  }
});

test('el nom del botó: el text visible i l’acció; sense text, l’acció sola', () => {
  expect(nomDelBotoDeDrets('  CC BY-SA 4.0 ')).toBe(`CC BY-SA 4.0: ${ETIQUETA_CANVIA_DRETS}`);
  expect(nomDelBotoDeDrets('')).toBe("Canviar els drets d'autor");
  expect(nomDelBotoDeDrets(<span>©</span>)).toBe("Canviar els drets d'autor");
});

/* jsdom no calcula capes ni :active: es comprova la regla escrita (com
   PageFrame.capes). El botó es veu com l'enllaç (Llei del Píxel): sense la
   pell del navegador, amb la lletra i l'espaiat del paràgraf, i el premut no
   escala dins del paràgraf. Dins de @layer components, com el bloc 261007. */
const cssNet = readFileSync(resolve(process.cwd(), 'src/css/components.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const blocDe = (text, obertura, regla) => {
  for (let obri = text.indexOf(obertura); obri >= 0; obri = text.indexOf(obertura, obri + 1)) {
    let fons = 0;
    for (let i = text.indexOf('{', obri); i < text.length; i += 1) {
      if (text[i] === '{') fons += 1;
      else if (text[i] === '}' && (fons -= 1) === 0) {
        const bloc = text.slice(obri, i + 1);
        if (bloc.includes(regla)) return bloc;
        break;
      }
    }
  }
  return '';
};

test('CSS · el botó del copyright es desfà de la pell del navegador dins de @layer components', () => {
  const capa = blocDe(cssNet, '@layer components {', 'button.sp-card-copyright__enllac {');
  expect(capa).not.toBe('');
  const regla = blocDe(capa, 'button.sp-card-copyright__enllac {', 'border: 0;');
  for (const declaracio of ['padding-inline: 0;', 'border: 0;', 'background: none;', 'font: inherit;', 'letter-spacing: inherit;', 'text-align: inherit;', 'cursor: pointer;']) {
    expect(regla, declaracio).toContain(declaracio);
  }
  // El que ja fa l'enllaç (coixí vertical, retall, color) no es torna a escriure.
  expect(regla).not.toContain('padding-block');
  expect(regla).not.toContain('color:');
  /* Correcció de la revisió (261008) · En prémer, la resposta de l'enllaç en
     línia (base.css: opacity 0.7, sense escala), i opac al Bancal. */
  expect(capa).toContain('.sp-card-copyright button.sp-card-copyright__enllac:active { transform: none; opacity: 0.7; }');
  expect(capa).toContain(':root[data-contrast="bancal"] .sp-card-copyright button.sp-card-copyright__enllac:active, :host([data-contrast="bancal"]) .sp-card-copyright button.sp-card-copyright__enllac:active { opacity: 1; }');
  const base = readFileSync(resolve(process.cwd(), 'src/css/base.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  expect(base).toContain('p a[href]:active, li a[href]:active, .sdp-prose a[href]:active, .sdp-taula a[href]:active { transform: none; opacity: 0.7; }');
  // La regla de l'enllaç (261007) continua igual.
  expect(cssNet).toContain('.sp-card-copyright__enllac { display: inline-block; max-inline-size: 100%; min-inline-size: var(--sdp-touch); vertical-align: top; padding-block: var(--sdp-space-4); margin-block: calc(var(--sdp-space-4) * -1);');
});
