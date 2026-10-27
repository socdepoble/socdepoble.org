/* Ordre del Mestre (261026_2126, pla 261026_1615 §5) · L'Índex de la Pàgina
   Universal recull l'H1 de la pàgina (header.page-title h1, fora de l'article)
   com a primera entrada, i tots els nivells del cos, de l'H2 a l'H6: les
   targetes porten H3 i H4 per dins i l'Índex n'és el sumari. L'H1 no porta
   slug ni id: els slugs del cos (?seccio=) no canvien. jsdom no implementa
   scrollIntoView: es registra. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';

vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));

import { PageFrame, TableOfContentsDrawer, titolDeLIndex } from './PageFrame.jsx';

const saltats = [];
const scrollAbans = Element.prototype.scrollIntoView;
beforeEach(() => {
  saltats.length = 0;
  Element.prototype.scrollIntoView = function scrollIntoView(opcions) { saltats.push([this, opcions]); };
});
afterEach(() => {
  cleanup();
  Element.prototype.scrollIntoView = scrollAbans;
});

const obriIndex = () => fireEvent.click(screen.getByRole('button', { name: 'Índex de secció' }));
const index = () => screen.getByRole('dialog', { name: 'Taula de continguts' });
const entrades = () => [...index().querySelectorAll('.toc-nav li')].map((li) => [li.className, li.textContent]);

/* Una targeta (H3) amb els seus H4, H5 i H6, com UniversalCard. */
const TARGETA = (
  <section>
    <h3>Targeta</h3>
    <h4>Apartat</h4>
    <h5>38 rebuts</h5>
    <h6>Nota</h6>
  </section>
);

test('§5 · l’H1 de la capçalera és la primera entrada (nivell 1), i després l’H2 de l’entradeta i de l’H3 a l’H6 del cos', () => {
  render(<PageFrame chrome="system" title="Bloc de notes" subtitle="El teu estudi">{TARGETA}</PageFrame>);
  obriIndex();
  expect(entrades()).toEqual([
    ['toc-item toc-level-1', 'Bloc de notes'],
    ['toc-item toc-level-2', 'El teu estudi'],
    ['toc-item toc-level-3', 'Targeta'],
    ['toc-item toc-level-4', 'Apartat'],
    ['toc-item toc-level-5', '38 rebuts'],
    ['toc-item toc-level-6', 'Nota']
  ]);
});

test('§5 · clicar el títol hi porta (al mateix H1 de la capçalera) i tanca l’Índex', () => {
  const { container } = render(<PageFrame chrome="system" title="Bloc de notes">{TARGETA}</PageFrame>);
  obriIndex();
  fireEvent.click(within(index()).getByRole('button', { name: 'Bloc de notes' }));
  expect(saltats).toHaveLength(1);
  expect(saltats[0][0]).toBe(container.querySelector('header.page-title > h1'));
  expect(saltats[0][1]).toEqual({ behavior: 'smooth', block: 'start' });
  expect(screen.queryByRole('dialog', { name: 'Taula de continguts' })).toBeNull();
});

test('§5 · l’H1 no rep cap id i no canvia el slug d’una secció del cos amb el mateix text', () => {
  const { container } = render(<PageFrame chrome="system" title="Vincles"><h2>Vincles</h2></PageFrame>);
  obriIndex();
  const h1 = container.querySelector('header.page-title > h1');
  expect(h1.hasAttribute('id')).toBe(false);
  // La secció del cos conserva el seu slug de sempre, sense sufix -2.
  expect(container.querySelector('article.content-wrapper h2').id).toMatch(/-vincles$/);
  expect(entrades()).toEqual([['toc-item toc-level-1', 'Vincles'], ['toc-item toc-level-2', 'Vincles']]);
});

function Sonda() {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>;
}

test('§5 · des del títol, la secció s’esborra de la URL (el títol és dalt de tot: cap ?seccio=)', () => {
  render(
    <MemoryRouter rutaInicial="/page/prova?seccio=targeta-titol-h1">
      <PageFrame chrome="system" title="Prova"><h3>Targeta títol H1</h3></PageFrame>
      <Sonda />
    </MemoryRouter>
  );
  expect(screen.getByTestId('url').textContent).toBe('/page/prova?seccio=targeta-titol-h1');
  obriIndex();
  fireEvent.click(within(index()).getByRole('button', { name: 'Prova' }));
  expect(screen.getByTestId('url').textContent).toBe('/page/prova');
});

test('§5 · un títol buit (la nota nova de l’editor: el text d’ajuda és un data-placeholder) no fa cap entrada', () => {
  render(
    <PageFrame chrome="system" title={<span className="editor-title-input" data-placeholder="Nota sense títol" />}>
      <h3>Targeta</h3>
    </PageFrame>
  );
  obriIndex();
  expect(entrades()).toEqual([['toc-item toc-level-3', 'Targeta']]);
});

test('§5 · l’Índex obert seguix el títol mentre s’escriu (el text viu dins d’un span fill de l’H1)', async () => {
  const { container } = render(
    <PageFrame chrome="system" title={<span className="editor-title-input">Esborrany</span>}><h3>Targeta</h3></PageFrame>
  );
  obriIndex();
  expect(entrades()[0]).toEqual(['toc-item toc-level-1', 'Esborrany']);
  await act(async () => { container.querySelector('.editor-title-input').firstChild.data = 'Esborrany net'; });
  expect(entrades()[0]).toEqual(['toc-item toc-level-1', 'Esborrany net']);
});

test('§5 · el preu que l’H1 porta dins no és títol: no entra a l’Índex', () => {
  render(<PageFrame chrome="system" title="Bicicleta" price="50 €"><h3>Estat</h3></PageFrame>);
  obriIndex();
  expect(entrades()[0]).toEqual(['toc-item toc-level-1', 'Bicicleta']);
});

/* §5 · «El comportament erràtic del calaix». Al Bloc de Notes el cos és un
   TipTap (ProseMirror): l'editor redibuixa un node quan li canvien un
   atribut que no ix del document (comprovat al navegador, 261026). L'id que
   l'Índex escrivia als encapçalaments del cos feia que l'editor els
   substituïra, l'observador ho veia, l'Índex tornava a escriure i la pàgina
   es penjava. Ací, un editor de mentira que fa el mateix (amb un topall
   perquè una regressió no penge la prova). */
function EditorQueRedibuixa({ onRedibuixa }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const arrel = ref.current;
    let voltes = 0;
    const observador = new MutationObserver((mutacions) => {
      for (const m of mutacions) {
        if (m.type !== 'attributes' || voltes >= 50) continue;
        voltes += 1;
        onRedibuixa();
        const nou = document.createElement(m.target.tagName);
        nou.textContent = m.target.textContent;
        m.target.replaceWith(nou);
      }
    });
    observador.observe(arrel, { attributes: true, subtree: true });
    return () => observador.disconnect();
  }, [onRedibuixa]);
  return (
    <div ref={ref} className="tiptap ProseMirror" contentEditable suppressContentEditableWarning>
      <h3>Primera passa</h3>
      <p>Text.</p>
      <h3>Segona passa</h3>
    </div>
  );
}

test('§5 · dins d’un cos editable l’Índex no escriu cap id: l’editor no redibuixa res i el calaix no entra en bucle', async () => {
  const redibuixa = vi.fn();
  const { container } = render(
    <PageFrame chrome="system" title="Bloc de notes"><EditorQueRedibuixa onRedibuixa={redibuixa} /></PageFrame>
  );
  obriIndex();
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(redibuixa).not.toHaveBeenCalled();
  expect([...container.querySelectorAll('.ProseMirror h3')].map((h) => h.hasAttribute('id'))).toEqual([false, false]);
  expect(entrades()).toEqual([
    ['toc-item toc-level-1', 'Bloc de notes'],
    ['toc-item toc-level-3', 'Primera passa'],
    ['toc-item toc-level-3', 'Segona passa']
  ]);
  // El salt continua: l'entrada porta l'element.
  fireEvent.click(within(index()).getByRole('button', { name: 'Segona passa' }));
  expect(saltats.map(([element]) => element.textContent)).toEqual(['Segona passa']);
});

test('§5 · fora d’un cos editable, l’id de sempre (T7 · P9): el slug del text amb el prefix de l’Índex', () => {
  const { container } = render(<PageFrame chrome="system" title="T"><h3>Secció llegible</h3></PageFrame>);
  obriIndex();
  expect(container.querySelector('article.content-wrapper h3').id).toMatch(/^toc-.+-seccio-llegible$/);
});

test('§5 · el títol d’un <dialog> tancat del cos (la «Vista prèvia d’impressió» de l’editor) no entra a l’Índex', () => {
  render(
    <PageFrame chrome="system" title="Nota">
      <h3>Visible</h3>
      <dialog><h2>Vista prèvia d’impressió</h2></dialog>
      <dialog open><h2>Diàleg obert</h2></dialog>
    </PageFrame>
  );
  obriIndex();
  expect(entrades().map(([, text]) => text)).toEqual(['Nota', 'Visible', 'Diàleg obert']);
});

test('§5 · sense títol (chrome="none" no pinta la capçalera) l’Índex és el del cos de sempre', () => {
  const { container } = render(<PageFrame chrome="none" title="Amagat"><h2>Primera</h2></PageFrame>);
  // Sense capçalera ni barra blava: cap H1 per a l'Índex i cap botó Índex;
  // es comprova la peça pura amb la capçalera absent (capcaleraRef buit).
  expect(container.querySelector('header.page-title')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Índex de secció' })).toBeNull();
  expect(titolDeLIndex(null)).toBeNull();
  expect(titolDeLIndex(document.createElement('header'))).toBeNull();
  // Els nodes es fan amb createElement: la porta de disseny compta les
  // etiquetes d'H1 escrites al text del fitxer (una per pàgina).
  const capcalera = document.createElement('header');
  const titol = capcalera.appendChild(document.createElement('h1'));
  titol.className = 'sr-only';
  titol.textContent = 'Ocult';
  expect(titolDeLIndex(capcalera)).toBeNull();
  titol.className = '';
  titol.textContent = '  Títol   amb  espais ';
  expect(titolDeLIndex(capcalera)).toMatchObject({ id: null, slug: null, text: 'Títol amb espais', level: 1, titol: true });
});

/* Ordre del Mestre (261027; auditoria Gauntlet R5, G3-01 de Gemini) · Una
   capçalera que es munta després d'obrir l'Índex hi entra amb el pròxim canvi
   del cos, i des d'aleshores l'Índex en seguix el text. Els nodes es fan amb
   createElement (la porta de disseny compta les etiquetes d'H1 del fitxer). */
test('§5 · una capçalera muntada després d’obrir l’Índex hi entra, i se’n seguix el text', async () => {
  const cos = document.body.appendChild(document.createElement('article'));
  cos.appendChild(document.createElement('h2')).textContent = 'Primera';
  const contentRef = { current: cos };
  const capcaleraRef = { current: null };
  try {
    render(<TableOfContentsDrawer isOpen onClose={() => {}} contentRef={contentRef} capcaleraRef={capcaleraRef} />);
    expect(entrades().map(([, text]) => text)).toEqual(['Primera']);
    const capcalera = document.body.appendChild(document.createElement('header'));
    const titol = capcalera.appendChild(document.createElement('h1'));
    titol.textContent = 'Arriba tard';
    capcaleraRef.current = capcalera;
    await act(async () => { cos.appendChild(document.createElement('h2')).textContent = 'Segona'; });
    expect(entrades()).toEqual([
      ['toc-item toc-level-1', 'Arriba tard'],
      ['toc-item toc-level-2', 'Primera'],
      ['toc-item toc-level-2', 'Segona']
    ]);
    await act(async () => { titol.firstChild.data = 'Ja hi és'; });
    expect(entrades()[0]).toEqual(['toc-item toc-level-1', 'Ja hi és']);
    capcalera.remove();
  } finally {
    cos.remove();
  }
});
