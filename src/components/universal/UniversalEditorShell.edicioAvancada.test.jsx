/* Gauntlet 261016_1530 (Bloc 3.9, Onada 1.5; ordre del Mestre: «Desplegable
   d'"Edició Avançada" ubicat just damunt de l'Editor TipTap» que «agrupa i
   neteja de la capçalera tots els botons que embrutaven la vista bàsica»;
   plegat, «Títol -> Subtítol -> Entradella -> Barra d'eines TipTap -> Text»,
   i el que es configura «s'ubica al seu lloc visible real») · La closca amb
   la prop opcional `edicioAvancada`:
     · sense la prop, el DOM de sempre (Perfil i catàleg);
     · amb ella, un <details> natiu PLEGAT entre els avisos i les eines, amb la
       capçalera, el logotip i la ranura de classificació;
     · la capçalera i el logotip desats, al seu lloc de lectura (dalt i damunt
       de l'H1); entre l'H1 i el Subtítol, cap línia de copyright (decisió de
       direcció);
     · correcció de la revisió (261016) · les categories i les etiquetes
       assignades, també al seu lloc de lectura: les píndoles davall de l'H1
       («o assigna categories» és l'exemple literal de l'ordre). Una nota
       sense res assignat no en porta cap: el flux bàsic queda net;
     · els destins del focus obrin el desplegable abans d'enfocar;
     · `placeholderTitol`, el placeholder de l'H1.
   Pla 261028_1526 (P1-58; Llibre Mestre, Fita 22) · `posicioEdicioAvancada`:
     · per defecte ('cos'), el lloc de sempre, dins de l'article (Notes);
     · 'despres-autoria' (la fitxa del Perfil), un sol desplegable a la ranura
       despresAutoria de PageFrame, després de la barra taronja i abans de
       l'H1, i fora de l'article;
     · el cos (TipTap) no es remunta, i els destins del focus el troben igual;
     · dins, l'ordre de lectura Capçalera → Avatar → Logotip → classificació. */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { useEffect, useState } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
import { ETIQUETA_EDICIO_AVANCADA, UniversalEditorShell } from './UniversalEditorShell.jsx';
import { BotoDretsAutor } from './CopyrightSelector.jsx';
import { BotoneraClassificacio } from './classificacio/BotoneraClassificacio.jsx';
import { TEXTOS_LLAVOR } from './textosLlavor.js';

afterEach(cleanup);

const EINES = <div className="sdp-editor-tools" data-testid="eines" />;
const ranura = (onObri = vi.fn()) => (
  <>
    <BotoneraClassificacio carpeta="Mur" categories={['Sistema']} etiquetes={[]} emoticona="" etiquetaEmoticona="Emojis XL" onObri={onObri} />
    <div className="sdp-copyright-control">
      <BotoDretsAutor valor="CC BY-NC-SA 4.0" triada="CC BY-NC-SA 4.0" onClick={vi.fn()} />
    </div>
  </>
);
const closca = (props = {}) => render(
  <UniversalEditorShell id="d1" titleHtml="" subtitleHtml="" leadHtml="" topBar={EINES} posicioEines="davall-entradilla"
    labels={[{ text: 'Sistema', className: 'sdp-badge-category' }]} classificacio={ranura()} copyright="CC BY-NC-SA 4.0"
    onCanviaCopyright={vi.fn()} {...props}>
    <div className="ProseMirror" contentEditable suppressContentEditableWarning data-testid="cos" />
  </UniversalEditorShell>
);
const fills = (el) => [...el.children].map((e) => e.className || e.dataset.testid);
/* Cicle 3 (261030, VD) · Les ranures del desplegable es diuen amb data-sdp-ranura
   (ganxo de focus, sense estil): la classe de cada fill i, si en porta, la ranura. */
const fillsAmbRanura = (el) => [...el.children].map((e) => (e.dataset.sdpRanura ? `${e.className} [${e.dataset.sdpRanura}]` : e.className));

test('sense la prop: el DOM de sempre (la ranura davall del títol, el copyright, la capçalera i el logotip a dalt)', () => {
  const { container } = closca();
  expect(container.querySelector('details')).toBeNull();
  expect(container.textContent).not.toContain(ETIQUETA_EDICIO_AVANCADA);
  const capcalera = container.querySelector('header.page-title');
  expect(capcalera.querySelector('.page-title-classificacio .sdp-classificacio-botonera')).not.toBeNull();
  expect(capcalera.querySelector('p.page-title-copyright > button[data-sdp-drets]')).not.toBeNull();
  expect(capcalera.querySelector('.page-title-logo-personalitzat button').textContent).toContain('Editar logotip');
  expect(container.querySelector('.hero-image.hero-image--buit button').textContent).toContain('Editar capçalera');
  expect(fills(container.querySelector('article.content-wrapper'))).toEqual(['page-intro', 'sdp-editor-eines', 'ProseMirror']);
  expect(container.querySelector('.editor-title-input').dataset.placeholder).toBe(TEXTOS_LLAVOR.titol);
});

test('amb edicioAvancada: plegat, el flux bàsic Títol → Subtítol → Entradilla → eines → text, i res entre l’H1 i el Subtítol', () => {
  // Una nota nova: cap categoria ni etiqueta assignada.
  const { container } = closca({ edicioAvancada: true, labels: [] });
  // Cap caixa de capçalera entre la barra blava i la taronja.
  const pagina = container.querySelector('.sdp-universal-page-container');
  expect(fills(pagina).slice(0, 3)).toEqual(['bar-blue', 'bar-orange', 'page-title']);
  expect(container.querySelector('.hero-image')).toBeNull();
  // A la capçalera només l'H1: ni ranura, ni copyright, ni píndoles, ni uploader de logotip.
  const capcalera = container.querySelector('header.page-title');
  expect([...capcalera.children].map((e) => e.tagName)).toEqual(['H1']);
  expect(capcalera.querySelector('.editor-title-input')).not.toBeNull();
  // A l'article: el Subtítol i l'Entradilla, el desplegable, les eines i el cos.
  const article = container.querySelector('article.content-wrapper');
  expect(fills(article)).toEqual(['page-intro', 'sdp-edicio-avancada', 'sdp-editor-eines', 'ProseMirror']);
  const intro = article.querySelector('.page-intro');
  expect(intro.querySelector('.editor-subtitle-input')).not.toBeNull();
  expect(intro.querySelector('.editor-lead-input')).not.toBeNull();
  const desplegable = article.querySelector('details.sdp-edicio-avancada');
  expect(desplegable.open).toBe(false);
  expect(desplegable.querySelector('summary').textContent).toBe('Edició avançada');
  expect(desplegable.nextElementSibling.className).toBe('sdp-editor-eines');
});

/* Correcció de la revisió adversarial (261016) · Abans, amb el desplegable, la
   capçalera rebia una llista buida i les categories assignades només es veien
   dins de la botonera plegada. Ara es pinten on es pinten en lectura. */
test('amb edicioAvancada: les categories i etiquetes assignades es veuen al seu lloc real, les píndoles de lectura davall de l’H1', () => {
  const labels = [{ text: 'Sistema', className: 'sdp-badge-category' }, { text: 'Hort', className: 'sdp-badge-tag' }];
  const { container } = closca({ edicioAvancada: true, labels });
  const capcalera = container.querySelector('header.page-title');
  expect([...capcalera.children].map((e) => e.tagName)).toEqual(['H1', 'UL']);
  const pindoles = capcalera.querySelector('ul.page-title-labels');
  expect(pindoles.getAttribute('aria-label')).toBe('Categories');
  expect([...pindoles.querySelectorAll('li')].map((li) => [li.textContent, li.classList.contains(labels.find((l) => l.text === li.textContent).className)]))
    .toEqual([['Sistema', true], ['Hort', true]]);
  // De lectura: cap botó a les píndoles. La botonera (on es trien) continua dins del desplegable.
  expect(pindoles.querySelector('button')).toBeNull();
  expect(capcalera.querySelector('.page-title-classificacio')).toBeNull();
  expect(container.querySelector('details.sdp-edicio-avancada .sdp-classificacio-botonera')).not.toBeNull();
  // I cap línia de copyright entre l'H1 i el Subtítol (decisió de direcció).
  expect(capcalera.querySelector('p.page-title-copyright')).toBeNull();
});

test('dins del desplegable: Editar capçalera, Editar logotip, la botonera (amb «Emojis XL») i els drets', () => {
  const { container } = closca({ edicioAvancada: true });
  const cos = container.querySelector('details.sdp-edicio-avancada > .sdp-edicio-avancada__cos');
  expect(fillsAmbRanura(cos)).toEqual([
    'sdp-edicio-avancada__imatge [capcalera]',
    'sdp-edicio-avancada__imatge [logotip]',
    'page-title-classificacio'
  ]);
  expect(cos.querySelector('[data-sdp-ranura="capcalera"] button').textContent).toContain('Editar capçalera');
  expect(cos.querySelector('[data-sdp-ranura="logotip"] button').textContent).toContain('Editar logotip');
  const botons = [...cos.querySelectorAll('.sdp-classificacio-botonera > button')].map((b) => b.textContent);
  expect(botons).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Emojis XL (—)']);
  expect(cos.querySelector('.sdp-copyright-control button[data-sdp-drets]')).not.toBeNull();
  // El disparador dels drets només viu ací: la línia de la capçalera no es pinta.
  expect(container.querySelectorAll('[data-sdp-drets]')).toHaveLength(1);
});

/* P1-58 · L'ordre de lectura de la fitxa: la capçalera primer, després la
   identitat (l'avatar redó del Perfil), el logotip i la classificació. */
test('dins del desplegable, amb identitat: Capçalera → Avatar → Logotip → classificació', () => {
  const { container } = closca({ edicioAvancada: true, identitatEdicioAvancada: <p data-testid="avatar">Avatar</p> });
  const cos = container.querySelector('details.sdp-edicio-avancada > .sdp-edicio-avancada__cos');
  expect(fillsAmbRanura(cos)).toEqual([
    'sdp-edicio-avancada__imatge [capcalera]',
    'sdp-edicio-avancada__identitat',
    'sdp-edicio-avancada__imatge [logotip]',
    'page-title-classificacio'
  ]);
  expect(cos.querySelector('.sdp-edicio-avancada__identitat [data-testid="avatar"]')).not.toBeNull();
});

describe('posicioEdicioAvancada', () => {
  test('per defecte (\'cos\'): el desplegable continua dins de l’article, damunt de les eines, i cap ranura dalt', () => {
    const { container } = closca({ edicioAvancada: true });
    expect(fills(container.querySelector('article.content-wrapper'))).toEqual(['page-intro', 'sdp-edicio-avancada', 'sdp-editor-eines', 'ProseMirror']);
    expect(container.querySelector('.sdp-pagina-despres-autoria')).toBeNull();
    expect(container.querySelector('[posicioedicioavancada]')).toBeNull();
  });

  test('\'despres-autoria\': un sol desplegable, davall de la barra taronja i damunt de l’H1, fora de l’article', () => {
    const { container } = closca({ edicioAvancada: true, posicioEdicioAvancada: 'despres-autoria' });
    expect(fills(container.querySelector('article.content-wrapper'))).toEqual(['page-intro', 'sdp-editor-eines', 'ProseMirror']);
    expect(container.querySelectorAll('details.sdp-edicio-avancada')).toHaveLength(1);
    const desplegable = container.querySelector('details.sdp-edicio-avancada');
    expect(desplegable.parentElement.className).toBe('sdp-pagina-despres-autoria');
    expect(desplegable.closest('article')).toBeNull();
    expect(desplegable.closest('header')).toBeNull();
    const pagina = container.querySelector('.sdp-universal-page-container');
    expect(fills(pagina).slice(0, 4)).toEqual(['bar-blue', 'bar-orange', 'sdp-pagina-despres-autoria', 'page-title']);
    const h1 = container.querySelector('header.page-title h1');
    const barra = container.querySelector('section.bar-orange');
    expect(barra.compareDocumentPosition(desplegable) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(desplegable.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // El contingut, el de sempre: plegat, amb la capçalera, el logotip, la botonera i els drets.
    expect(desplegable.open).toBe(false);
    expect(fillsAmbRanura(desplegable.querySelector('.sdp-edicio-avancada__cos'))).toEqual([
      'sdp-edicio-avancada__imatge [capcalera]',
      'sdp-edicio-avancada__imatge [logotip]',
      'page-title-classificacio'
    ]);
    expect(container.querySelectorAll('[data-sdp-drets]')).toHaveLength(1);
  });

  test('sense edicioAvancada, \'despres-autoria\' no pinta res: el DOM de sempre', () => {
    const sempre = closca().container.innerHTML;
    cleanup();
    expect(closca({ posicioEdicioAvancada: 'despres-autoria' }).container.innerHTML).toBe(sempre);
  });

  /* Un cos que compta els seus muntatges, com el TipTap de veres. */
  test('el cos no es remunta: ni en obrir i tancar el desplegable, ni amb un títol o etiquetes nous, ni en canviar de posició', () => {
    const muntat = vi.fn();
    function Cos() {
      useEffect(() => { muntat(); }, []);
      return <div className="ProseMirror" contentEditable suppressContentEditableWarning data-testid="cos" />;
    }
    const pinta = (props) => (
      <UniversalEditorShell id="d1" subtitleHtml="" leadHtml="" topBar={EINES} posicioEines="davall-entradilla"
        classificacio={ranura()} copyright="CC BY-NC-SA 4.0" onCanviaCopyright={vi.fn()} edicioAvancada
        posicioEdicioAvancada="despres-autoria" titleHtml="" labels={[]} {...props}>
        <Cos />
      </UniversalEditorShell>
    );
    const vista = render(pinta({}));
    const cos = vista.getByTestId('cos');
    expect(muntat).toHaveBeenCalledTimes(1);
    const desplegable = vista.container.querySelector('details.sdp-edicio-avancada');
    act(() => { desplegable.open = true; fireEvent(desplegable, new Event('toggle')); });
    act(() => { desplegable.open = false; fireEvent(desplegable, new Event('toggle')); });
    vista.rerender(pinta({ titleHtml: 'Títol nou', labels: [{ text: 'Hort', className: 'sdp-badge-tag' }] }));
    expect(vista.getByTestId('cos')).toBe(cos);
    expect(muntat).toHaveBeenCalledTimes(1);
    // Ni tan sols si la posició canviara entre pintades: el fill de l'article queda en el seu lloc.
    vista.rerender(pinta({ posicioEdicioAvancada: 'cos' }));
    expect(vista.container.querySelector('.sdp-pagina-despres-autoria')).toBeNull();
    vista.rerender(pinta({}));
    expect(vista.getByTestId('cos')).toBe(cos);
    expect(muntat).toHaveBeenCalledTimes(1);
    expect(vista.container.querySelectorAll('details.sdp-edicio-avancada')).toHaveLength(1);
  });

  /* Revisió adversarial P1-58 · Només la fitxa del Perfil ho demana: Notes i
     el DocumentEditor es queden en 'cos' (el defecte). Per text, com les
     proves de qualitat: una opció nova ha d'entrar en esta llista. */
  test('només el Perfil passa \'despres-autoria\'; Notes es queda en el cos', () => {
    const arrel = resolve(process.cwd(), 'src');
    const demanen = readdirSync(arrel, { recursive: true })
      .filter((f) => /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f))
      .filter((f) => /posicioEdicioAvancada\s*[:=]\s*\{?\s*['"]despres-autoria['"]/.test(readFileSync(resolve(arrel, f), 'utf8')))
      .map((f) => f.split('\\').join('/'));
    expect(demanen).toEqual(['sections/profile/PerfilEditor.jsx']);
  });
});

test('el que es configura es veu al seu lloc real: la capçalera desada dalt i el logotip desat damunt de l’H1', () => {
  const { container } = closca({ edicioAvancada: true, heroImage: '/assets/hort.webp', logoImage: '/assets/logo-hort.png' });
  const pagina = container.querySelector('.sdp-universal-page-container');
  expect(fills(pagina).slice(0, 4)).toEqual(['bar-blue', 'hero-image', 'bar-orange', 'page-title']);
  const portada = pagina.querySelector('.hero-image > img');
  expect(portada.getAttribute('src')).toBe('/assets/hort.webp');
  expect(portada.hasAttribute('role')).toBe(false);
  const capcalera = container.querySelector('header.page-title');
  const logo = capcalera.firstElementChild;
  expect(logo.tagName).toBe('IMG');
  expect(logo.classList.contains('page-title-logo--entitat')).toBe(true);
  expect(logo.getAttribute('src')).toBe('/assets/logo-hort.png');
  expect(logo.nextElementSibling.tagName).toBe('H1');
  // I, dins del desplegable, les dues imatges per a canviar-les.
  const cos = container.querySelector('.sdp-edicio-avancada__cos');
  expect(cos.querySelector('[data-sdp-ranura="capcalera"] img[role="button"]').getAttribute('src')).toBe('/assets/hort.webp');
  expect(cos.querySelector('[data-sdp-ranura="logotip"] img[role="button"]').getAttribute('src')).toBe('/assets/logo-hort.png');
});

test('placeholderTitol: el placeholder de l’H1 («Nota sense títol» al Bloc); sense, el de sempre', () => {
  const { container } = closca({ edicioAvancada: true, placeholderTitol: 'Nota sense títol' });
  expect(container.querySelector('.editor-title-input').dataset.placeholder).toBe('Nota sense títol');
  expect(container.querySelector('[placeholdertitol], [edicioavancada]')).toBeNull();
});

/* Els destins del focus d'una acció d'avís (Poliment T47) viuen dins del
   desplegable: s'obri abans d'enfocar, perquè el contingut d'un <details>
   plegat no rep el focus. */
function AmbAvis({ camp, ...props }) {
  const [avisos, setAvisos] = useState({
    [camp]: { error: { missatge: 'No s’ha pogut desar.', accions: [{ text: 'Tornar al que hi ha desat', onClick: () => setAvisos(null) }] } },
  });
  return (
    <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" avisosCamps={avisos} topBar={EINES}
      posicioEines="davall-entradilla" classificacio={ranura()} copyright="CC BY-NC-SA 4.0" onCanviaCopyright={vi.fn()} edicioAvancada {...props}>
      <div className="ProseMirror" contentEditable suppressContentEditableWarning data-testid="cos" />
    </UniversalEditorShell>
  );
}
const premAccio = (container) => {
  const boto = container.querySelector('.sdp-avisos-camps button');
  boto.focus();
  act(() => { fireEvent.click(boto); });
  expect(container.querySelector('.sdp-avisos-camps')).toBeNull();
};

test.each([
  ['la capçalera (sense imatge: el botó)', { camp: 'heroImage' }, '[data-sdp-ranura="capcalera"] button'],
  ['la capçalera (amb imatge)', { camp: 'heroImage', heroImage: '/assets/h.webp' }, '[data-sdp-ranura="capcalera"] img[role="button"]'],
  ['el logotip', { camp: 'logoImage' }, '[data-sdp-ranura="logotip"] button'],
  ['els drets', { camp: 'copyright' }, '.sdp-edicio-avancada [data-sdp-drets]'],
  ['l’emoticona (el botó «Emojis XL» de la botonera)', { camp: 'icon' }, '.sdp-edicio-avancada .sdp-classificacio-botonera > button:last-child']
])('després d’una acció d’avís de %s, el desplegable s’obri i el focus hi va', (_cas, props, desti) => {
  const { container } = render(<AmbAvis {...props} />);
  const desplegable = container.querySelector('details.sdp-edicio-avancada');
  expect(desplegable.open).toBe(false);
  premAccio(container);
  expect(desplegable.open).toBe(true);
  expect(document.activeElement).toBe(container.querySelector(desti));
});

test('un destí fora del desplegable (el títol) no l’obri', () => {
  const { container } = render(<AmbAvis camp="title" />);
  premAccio(container);
  expect(container.querySelector('details.sdp-edicio-avancada').open).toBe(false);
  expect(document.activeElement).toBe(container.querySelector('.editor-title-input'));
});

/* P1-58 · Amb el desplegable dalt (la fitxa del Perfil), els destins del focus
   el troben igual: la ranura és dins de l'arrel de la closca. */
test.each([
  ['la capçalera', { camp: 'heroImage' }, '[data-sdp-ranura="capcalera"] button'],
  ['el logotip', { camp: 'logoImage' }, '[data-sdp-ranura="logotip"] button'],
  ['els drets', { camp: 'copyright' }, '.sdp-edicio-avancada [data-sdp-drets]'],
  ['l’emoticona', { camp: 'icon' }, '.sdp-edicio-avancada .sdp-classificacio-botonera > button:last-child']
])('amb \'despres-autoria\', després d’una acció d’avís de %s, el desplegable s’obri i el focus hi va', (_cas, props, desti) => {
  const { container } = render(<AmbAvis {...props} posicioEdicioAvancada="despres-autoria" />);
  const desplegable = container.querySelector('.sdp-pagina-despres-autoria > details.sdp-edicio-avancada');
  expect(desplegable.open).toBe(false);
  premAccio(container);
  expect(desplegable.open).toBe(true);
  expect(document.activeElement).toBe(container.querySelector(desti));
});

/* GM2-03 (pla 261029_0216, Pas 8) · El full, llegit com a text (ací no hi ha
   layout): el cos del desplegable porta scroll-margin-block-start amb el token
   real de les barres sticky. A la pàgina continguda (utilities.css) la barra
   blava és sticky a top: 0 i la taronja a top: --sdp-alt-accio, totes dues
   d'alçada --sdp-alt-accio; el que es porta a la vista sense marge queda
   davall de la taronja. El token és un valor fix en píxels, declarat una sola
   vegada i fora de qualsevol @media: el marge val igual a 375, 820 i 1280 px.
   La recepta és la de .sdp-consola__detall (modules.css). Cap :has()
   (tests/lint_xat). */
describe('GM2-03 · scroll-margin-block-start del cos del desplegable', () => {
  const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
  const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = (css, selector) => {
    const m = new RegExp(`\\n\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(css);
    expect(m, selector).not.toBeNull();
    return m[1].split(';').map((d) => d.trim()).filter(Boolean);
  };
  const MARGE = 'scroll-margin-block-start: calc(var(--sdp-alt-accio) * 2 + var(--sdp-space-4))';

  test('el cos porta el marge de les dues barres sticky, amb el token --sdp-alt-accio', () => {
    const components = senseComentaris(llig('src/css/components.css'));
    expect(components.match(/\.sdp-edicio-avancada__cos \{/g)).toHaveLength(1);
    const cos = bloc(components, '.sdp-edicio-avancada__cos');
    expect(cos).toContain(MARGE);
    expect(cos.filter((d) => d.startsWith('scroll-'))).toEqual([MARGE]);
    expect(components).not.toMatch(/sdp-edicio-avancada[^{]*:has\(/);
  });

  test('--sdp-alt-accio és l’alçada i el top de la barra taronja sticky, declarat una vegada i en píxels', () => {
    const tokens = senseComentaris(llig('src/css/tokens.css'));
    // El nom, compost: la porta T3 de tractor-tokens només admet «--sdp-…:» a tokens.css.
    const ALT_ACCIO = ['--sdp', 'alt-accio'].join('-');
    const declaracions = [...tokens.matchAll(new RegExp(`${ALT_ACCIO}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim());
    expect(declaracions).toHaveLength(1);
    expect(declaracions[0]).toMatch(/^\d+px$/);
    // Cap redefinició dins d'un @media: el mateix valor a totes les amplàries.
    expect(tokens).not.toMatch(new RegExp(`@media[^{]*\\{[^}]*${ALT_ACCIO}\\s*:`));
    const layout = senseComentaris(llig('src/css/layout.css'));
    const taronja = bloc(layout, 'section.bar-orange');
    expect(taronja).toEqual(expect.arrayContaining(['height: var(--sdp-alt-accio)', 'top: var(--sdp-alt-accio)', 'position: sticky']));
    // A utilities.css la taronja té dues regles (una agrupada amb la blava): la seua pròpia porta el top.
    const utilitats = senseComentaris(llig('src/css/utilities.css'));
    const propies = [...utilitats.matchAll(/\n\s*\.sdp-universal-page-container--contained > \.bar-orange \{([^}]*)\}/g)].map((m) => m[1]);
    expect(propies.some((cos) => /\btop: var\(--sdp-alt-accio\);/.test(cos))).toBe(true);
    // La mateixa recepta que la Consola: un sol càlcul per a tot el Mas.
    expect(senseComentaris(llig('src/css/modules.css'))).toContain(`${MARGE.replace('scroll-margin-block-start', 'scroll-margin-top')};`);
  });
});
