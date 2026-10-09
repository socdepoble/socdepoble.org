/* T7 (ordre del Mestre, prompt 261004_0515) · La targeta incrustada dins
   d'un EditorContent de veres: és la UniversalCard sencera en una illa no
   editable, els botons del peu avisen i no naveguen, i les eines
   (Esquerra, Dreta, Llevar) actuen sobre el document. */
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { NodeSelection } from '@tiptap/pm/state';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), editor: null }));
vi.mock('../../../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('../../../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { TargetesIncrustades } from './targetesIncrustades.js';
import { TargetesIncrustadesContext } from './TargetesIncrustadesContext.js';
import { DEFAULT_AUTHOR } from '../../../UniversalUtils.js';

/* jsdom no mesura rangs: el focus() de les eines desplaça fins a la selecció
   en el fotograma següent i ProseMirror en demana els rectangles. Cada fitxer
   de proves té el seu jsdom: el pedaç no ix d'ací. */
if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [];
  Range.prototype.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.editor = null;
});

/* Un paràgraf davant: si el document comença per la targeta, la selecció
   inicial (Selection.atStart) ja la tria. */
const UNA = '<p>Intro</p><div data-sdp-targetes="" data-alineacio="esquerra"><div data-sdp-targeta="publicacio:1" data-ruta="/mur/1" data-titol="La festa" data-entradilla="Música a la plaça" data-autor="Pep" data-poble="La Torre"></div></div><p>Text</p>';
const traductor = (_clau, text) => text;

function Banc({ contingut, avisa }) {
  const editor = useEditor({ extensions: [StarterKit, TargetesIncrustades], content: contingut, immediatelyRender: true });
  mocks.editor = editor;
  return (
    <TargetesIncrustadesContext.Provider value={{ avisa, t: traductor }}>
      <EditorContent editor={editor} />
    </TargetesIncrustadesContext.Provider>
  );
}

async function munta(contingut = UNA) {
  const avisa = vi.fn();
  const vista = render(<Banc contingut={contingut} avisa={avisa} />);
  await waitFor(() => expect(vista.container.querySelector('.sdp-targeta .sp-card')).not.toBeNull());
  return { ...vista, avisa };
}

const posDeLaTargeta = (clau) => {
  let pos = null;
  mocks.editor.state.doc.descendants((node, p) => {
    if (node.type.name === 'sdpTargeta' && node.attrs.clau === clau) pos = p;
  });
  return pos;
};

const tria = async (clau) => {
  await act(async () => {
    const { state } = mocks.editor;
    mocks.editor.view.dispatch(state.tr.setSelection(NodeSelection.create(state.doc, posDeLaTargeta(clau))));
  });
};

test('la UniversalCard sencera viu dins de .sdp-targeta, una illa no editable dins del grup', async () => {
  const { container } = await munta();
  const grup = container.querySelector('.ProseMirror div[data-sdp-targetes]');
  const targeta = grup.querySelector(':scope > .sdp-targeta');
  expect(targeta.getAttribute('contenteditable')).toBe('false');
  expect(targeta.getAttribute('data-sdp-targeta')).toBe('publicacio:1');
  const carta = targeta.querySelector('article.sp-card');
  expect(carta.querySelector('.sp-card-title').textContent).toBe('La festa');
  expect(carta.querySelector('.sp-card-text').textContent).toBe('Música a la plaça');
  expect(carta.querySelector('.sp-card-author-name').textContent).toBe('Pep');
  expect(carta.querySelector('.sp-card-footer')).not.toBeNull();
  // En edició, la targeta sencera no és cap enllaç; Pep no porta la seua pàgina, i la boina no s'endevina.
  expect(carta.querySelector('a')).toBeNull();
  expect(carta.querySelector('.sp-card-link-overlay')).toBeNull();
});

/* Regla d'or 1 del Mestre (261004) · La boina porta l'autor real enllaçat a
   la seua pàgina, també a l'editor; el clic, dins del contenteditable, no
   navega: ho diu l'avís de previsualització, com les accions del peu. */
test('la boina porta l’autor enllaçat a la seua pàgina; en edició, el clic avisa i no navega', async () => {
  const ambRuta = UNA.replace('data-autor="Pep"', 'data-autor="Pep" data-autor-ruta="/perfil/persona/pep"');
  const { container, avisa } = await munta(ambRuta);
  const boina = container.querySelector('.sdp-targeta .sp-card-header a.sp-card-author-link');
  expect(boina.getAttribute('to')).toBe('/perfil/persona/pep');
  expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Pep');
  const clic = new MouseEvent('click', { bubbles: true, cancelable: true });
  boina.dispatchEvent(clic);
  expect(clic.defaultPrevented).toBe(true);
  expect(avisa).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).not.toHaveBeenCalled();
});

/* Revisió del front «editor» (261004) · Arrossegar la targeta agafant-la
   per la boina de l'autor la mou com a node: el dragstart de l'enllaç
   arriba a ProseMirror (el stopEvent el deixa passar), que arrossega la
   targeta sencera (la tria el NodeView de TipTap) i en posa l'HTML al
   dataTransfer. Abans ProseMirror no el veia: el navegador arrossegava
   l'enllaç solt i, en deixar-lo anar, el text guanyava un «Pep» enllaçat. */
test('arrossegar per la boina de l’autor mou la targeta sencera, no l’enllaç', async () => {
  const ambRuta = UNA.replace('data-autor="Pep"', 'data-autor="Pep" data-autor-ruta="/perfil/persona/pep"');
  const { container } = await munta(ambRuta);
  const boina = container.querySelector('.sdp-targeta .sp-card-header a.sp-card-author-link');
  /* jsdom no té elementFromPoint: el punter és damunt de la targeta. */
  const posTargeta = posDeLaTargeta('publicacio:1');
  vi.spyOn(mocks.editor.view, 'posAtCoords').mockReturnValue({ pos: posTargeta, inside: posTargeta });
  const dades = { files: [], clearData: vi.fn(), setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: '' };
  // jsdom no té DragEvent: un Event amb el seu tipus i el dataTransfer a mà.
  const arrossega = new Event('dragstart', { bubbles: true, cancelable: true });
  Object.defineProperty(arrossega, 'dataTransfer', { value: dades });
  await act(async () => {
    boina.dispatchEvent(arrossega);
  });
  const { dragging } = mocks.editor.view;
  expect(dragging, 'ProseMirror no ha vist el dragstart').toBeTruthy();
  expect(dragging.move).toBe(true);
  expect(dragging.slice.content.childCount).toBe(1);
  expect(dragging.slice.content.firstChild.type.name).toBe('sdpTargeta');
  expect(dragging.slice.content.firstChild.attrs.clau).toBe('publicacio:1');
  expect(dades.setData).toHaveBeenCalledWith('text/html', expect.stringContaining('data-sdp-targeta="publicacio:1"'));
});

/* Onada 8 (261009) · La boina de Sóc de Poble porta al seu perfil
   (DEFAULT_AUTHOR.href), mai a /projecte: també una instantània desada amb la
   ruta vella. */
test('sense autor a la instantània, la boina és de Sóc de Poble i porta al seu perfil', async () => {
  const poble = '<p>Intro</p><div data-sdp-targetes=""><div data-sdp-targeta="poble:7" data-titol="La Torre de les Maçanes"></div></div><p>Text</p>';
  const { container } = await munta(poble);
  const boina = container.querySelector('.sdp-targeta .sp-card-header a.sp-card-author-link');
  expect(boina.getAttribute('to')).toBe(DEFAULT_AUTHOR.href);
  expect(boina.textContent).toContain('Sóc de Poble');
});

test('Onada 8 · amb data-autor-ruta="/projecte" desat, la boina signa Sóc de Poble i porta al perfil', async () => {
  const vella = '<p>Intro</p><div data-sdp-targetes=""><div data-sdp-targeta="pagina:drets-autor" data-ruta="/page/drets-autor" data-titol="Drets d’autor" data-autor="Sóc de Poble" data-autor-ruta="/projecte"></div></div><p>Text</p>';
  const { container } = await munta(vella);
  const boina = container.querySelector('.sdp-targeta .sp-card-header a.sp-card-author-link');
  expect(boina.getAttribute('to')).toBe(DEFAULT_AUTHOR.href);
  expect(boina.textContent).toContain('Sóc de Poble');
});

/* Revisió del front «editor» (261004) · La imatge de la instantània es
   demana sense referent també a l'editor (abans només la lectura del cos). */
test('la imatge de la targeta es demana sense referent', async () => {
  const ambImatge = UNA.replace('data-autor="Pep"', 'data-autor="Pep" data-imatge="https://lh3.googleusercontent.com/abc.jpg"');
  const { container } = await munta(ambImatge);
  const imatge = container.querySelector('.sdp-targeta img.sp-card-media');
  expect(imatge.getAttribute('src')).toBe('https://lh3.googleusercontent.com/abc.jpg');
  expect(imatge.getAttribute('referrerpolicy')).toBe('no-referrer');
});

for (const nom of [/Compartir La festa/, /Connectar amb La festa/, /Comentar La festa/, /Traduir La festa/]) {
  test(`en edició, ${nom} avisa i no navega`, async () => {
    const { container, avisa } = await munta();
    fireEvent.click(within(container.querySelector('.sdp-targeta')).getByRole('button', { name: nom }));
    expect(avisa).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
}

test('sense triar-la, cap eina; triada i sola, Esquerra (premuda), Dreta i Llevar', async () => {
  const { container } = await munta();
  expect(container.querySelector('.sdp-targeta-incrustada__eines')).toBeNull();
  await tria('publicacio:1');
  const eines = container.querySelector('.sdp-targeta-incrustada__eines');
  const botons = within(eines).getAllByRole('button');
  expect(botons.map((boto) => boto.textContent)).toEqual(['Esquerra', 'Dreta', 'Llevar la targeta']);
  expect(botons[0].getAttribute('aria-pressed')).toBe('true');
  expect(botons[1].getAttribute('aria-pressed')).toBe('false');
});

test('Dreta canvia l’alineació del grup, i Llevar se’n du la targeta i el grup', async () => {
  const { container } = await munta();
  await tria('publicacio:1');
  await act(async () => {
    fireEvent.click(within(container.querySelector('.sdp-targeta-incrustada__eines')).getByRole('button', { name: 'Dreta' }));
  });
  expect(mocks.editor.getHTML()).toContain('data-alineacio="dreta"');
  await tria('publicacio:1');
  await act(async () => {
    fireEvent.click(within(container.querySelector('.sdp-targeta-incrustada__eines')).getByRole('button', { name: 'Llevar la targeta' }));
  });
  expect(mocks.editor.getHTML()).toBe('<p>Intro</p><p>Text</p>');
});

test('en una parella no hi ha Esquerra ni Dreta: només Llevar', async () => {
  const dues = '<p>Intro</p><div data-sdp-targetes=""><div data-sdp-targeta="poble:1" data-titol="Poble 1"></div><div data-sdp-targeta="poble:2" data-titol="Poble 2"></div></div><p></p>';
  const { container } = await munta(dues);
  await waitFor(() => expect(container.querySelectorAll('.sdp-targeta .sp-card')).toHaveLength(2));
  await tria('poble:2');
  const eines = container.querySelector('.sdp-targeta-incrustada__eines');
  expect(within(eines).getAllByRole('button').map((boto) => boto.textContent)).toEqual(['Llevar la targeta']);
});
