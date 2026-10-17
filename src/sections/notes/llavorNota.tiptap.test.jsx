/* Gauntlet 261016_1530 (Bloc 3.9, Onada 1.5; ordre del Mestre: la plantilla
   «s'esvaeix al primer clic o pulsació de tecla»; verificació de la MCR) ·
   Sobre el TipTap DE VERES, les extensions de veres i la LLAVOR_NOTA de veres
   (cap mock d'una sola etiqueta, que amagava el defecte):
     · TipTap normalitza l'HTML (lleva els salts de línia entre blocs):
       getHTML() no és mai la cadena de la llavor, i la comparació exacta
       d'abans no buidava mai el cos;
     · ara el primer focus buida el cos si és la llavor verge (la d'ara, la
       d'abans, o la que ja ha desat l'editor) i el cos buit es desa;
     · un cos amb text propi, o una llavor que la persona ja ha tocat, no
       s'esborra mai; sense llavor (el Perfil, seedContent null), tampoc.
   Les regressions de l'auditoria de Codex (261017: atributs, consum únic,
   desfer, deixar anar) són a llavorNota.adversari.test.jsx. */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ editor: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
/* El motor TipTap és el de veres: només es captura la instància i fora la barra. */
vi.mock('../../components/universal/richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: (editor) => { m.editor = editor; return { state: {}, exec: {} }; },
  UniversalRichTextToolbar: () => null
}));
import { DocumentEditor } from '../../components/universal/DocumentEditor.jsx';
import { esLlavorVerge } from '../../components/universal/richText/useUniversalRichText.js';
/* La barra negra de veres (la mateixa execució que DocumentEditor passa a la barra). */
import { executa } from '../../components/universal/richText/tiptapToolbarAdapter.js';
import { LLAVOR_NOTA, LLAVOR_NOTA_ANTIGA, LLAVORS_NOTA, esLlavorDeNota } from './llavorNota.js';

afterEach(() => {
  cleanup();
  m.editor = null;
});

const compacta = (html) => html.replace(/>\s+</g, '><');
/* StarterKit (TrailingNode) afig un paràgraf buit al final quan el document
   acaba en una llista: no és text de ningú. */
const senseFinalBuit = (html) => html.replace(/(?:<p><\/p>)+$/, '');
const pinta = (content, claus = {}) => {
  const adapter = {
    document: { id: 'd1', title: 'Títol', subtitle: '', lead: '', content, formattedDate: '01/01/26', formattedTime: '10:00' },
    labels: [], updateLocal: vi.fn(), saveRemote: vi.fn(), ...claus
  };
  render(<DocumentEditor adapter={adapter} />);
  return adapter;
};
const enfoca = () => act(() => { fireEvent.focus(m.editor.view.dom); });
const tipus = () => m.editor.state.doc.content.content.map((node) => node.type.name);

test('la LLAVOR_NOTA de veres arriba al cos amb H3, H4, paràgrafs i les dues llistes; getHTML() no és la cadena (el defecte d’abans)', () => {
  pinta(LLAVOR_NOTA);
  expect(tipus().slice(0, 6)).toEqual(['heading', 'paragraph', 'heading', 'paragraph', 'bulletList', 'orderedList']);
  // Després de les llistes, com a molt el paràgraf buit de TrailingNode.
  expect(tipus().slice(6).every((nom) => nom === 'paragraph')).toBe(true);
  expect(m.editor.state.doc.child(0).attrs.level).toBe(3);
  expect(m.editor.state.doc.child(2).attrs.level).toBe(4);
  const html = m.editor.getHTML();
  // La comparació exacta d'abans (getHTML() === seedContent) no casava mai.
  expect(html).not.toBe(LLAVOR_NOTA);
  // La forma que torna TipTap és la llavor sense els salts: el Bloc la reconeix igual.
  expect(senseFinalBuit(html)).toBe(compacta(LLAVOR_NOTA));
  expect(esLlavorDeNota(html)).toBe(true);
  expect(esLlavorVerge(m.editor, [LLAVOR_NOTA])).toBe(true);
});

/* Gauntlet 261017 (C06, auditoria Codex) · El DocumentEditor universal ja no
   importa la secció de Notes per a la seua llavor per defecte: el Bloc la
   passa (NotesEditor · seedContent: LLAVORS_NOTA) i, sense la clau, no n'hi
   ha cap, com al Perfil. */
test('amb la llavor del Bloc (seedContent: LLAVORS_NOTA), el primer focus buida la plantilla i el cos buit es desa; sense la clau, cap llavor', () => {
  const adapter = pinta(LLAVOR_NOTA, { seedContent: LLAVORS_NOTA });
  expect(m.editor.isEmpty).toBe(false);
  enfoca();
  expect(m.editor.isEmpty).toBe(true);
  expect(adapter.updateLocal).toHaveBeenLastCalledWith('d1', 'content', '<p></p>');
  cleanup();
  const senseClau = pinta(LLAVOR_NOTA);
  enfoca();
  expect(m.editor.isEmpty).toBe(false);
  expect(senseClau.updateLocal.mock.calls.filter(([, , valor]) => valor === '<p></p>')).toEqual([]);
});

test.each([
  ['la llavor d’abans (H3 a H6)', LLAVOR_NOTA_ANTIGA],
  ['la llavor d’ara tal com la desa l’editor', compacta(LLAVOR_NOTA)],
  ['la llavor d’abans tal com la desa l’editor', compacta(LLAVOR_NOTA_ANTIGA)]
])('amb les llavors del Bloc (LLAVORS_NOTA), %s també s’esvaeix al primer focus', (_cas, content) => {
  const adapter = pinta(content, { seedContent: LLAVORS_NOTA });
  enfoca();
  expect(m.editor.isEmpty).toBe(true);
  expect(adapter.updateLocal).toHaveBeenLastCalledWith('d1', 'content', '<p></p>');
});

test.each([
  ['un text propi', '<p>Hola, poble</p>'],
  ['la plantilla amb un paràgraf afegit', `${compacta(LLAVOR_NOTA)}<p>Ho he escrit jo</p>`],
  ['la plantilla amb una paraula canviada', compacta(LLAVOR_NOTA).replace('Una llista amb pics', 'Comprar planter')],
  ['la plantilla amb una negreta', compacta(LLAVOR_NOTA).replace('El segon pas de la llista', '<strong>El segon pas de la llista</strong>')]
])('%s no s’esborra mai en rebre el focus', (_cas, content) => {
  const adapter = pinta(content, { seedContent: LLAVORS_NOTA });
  const abans = senseFinalBuit(m.editor.getHTML());
  enfoca();
  expect(m.editor.isEmpty).toBe(false);
  expect(senseFinalBuit(m.editor.getHTML())).toBe(abans);
  // Cap desat del cos buit: res no s'ha esborrat.
  expect(adapter.updateLocal.mock.calls.filter(([, camp, valor]) => camp === 'content' && valor === '<p></p>')).toEqual([]);
});

test('una edició feta abans del focus (la plantilla tocada) ja no és la llavor: no s’esborra', () => {
  const adapter = pinta(LLAVOR_NOTA, { seedContent: LLAVORS_NOTA });
  act(() => { m.editor.commands.insertContentAt(1, 'Ara '); });
  const escrit = senseFinalBuit(m.editor.getHTML());
  expect(escrit).toContain('Ara Títol de secció');
  enfoca();
  expect(senseFinalBuit(m.editor.getHTML())).toBe(escrit);
  expect(adapter.updateLocal.mock.calls.filter(([, , valor]) => valor === '<p></p>')).toEqual([]);
});

test('sense llavor (seedContent null, el Perfil): la plantilla es queda', () => {
  const adapter = pinta(LLAVOR_NOTA, { seedContent: null });
  enfoca();
  expect(m.editor.isEmpty).toBe(false);
  expect(adapter.updateLocal.mock.calls.filter(([, , valor]) => valor === '<p></p>')).toEqual([]);
});

/* Correcció de la revisió adversarial (261016) · La primera interacció amb una
   nota nova pot vindre de FORA del cos, amb la plantilla verge i el cos sense
   focus: un emoji de la icona «Emojis» de NOTES (el canal: registraInsercio) o
   un botó de la barra negra (executa). TipTap enfoca dins de la mateixa cadena
   (editor.chain().focus()…):
     · Chrome i Firefox, al fotograma següent: l'ordre s'escrivia DINS de la
       plantilla (a l'inici de l'H3) i, quan arribava el focus, ja no era verge
       i no s'esvaïa mai;
     · Safari 16 (la Baseline), iOS i Android, al moment: el buidatge del focus
       deixava desfasada la transacció de la cadena, que petava amb un
       RangeError («Applying a mismatched transaction») i l'acció es perdia.
   Ara la plantilla s'esvaeix ABANS de l'ordre, en una transacció pròpia. */
const SAFARI_16 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15';
const ambCanal = (content = LLAVOR_NOTA) => {
  const registra = vi.fn();
  const adapter = pinta(content, { seedContent: LLAVORS_NOTA, registraInsercio: registra });
  const [inserix] = registra.mock.calls.at(-1);
  return { adapter, inserix };
};

describe.each([
  ['Chrome i Firefox (el focus, al fotograma següent)', false],
  ['Safari 16, iOS i Android (el focus, dins de la cadena)', true]
])('ordres de fora del cos sobre la plantilla verge · %s', (_navegador, safari) => {
  beforeEach(() => {
    if (safari) vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(SAFARI_16);
  });
  afterEach(() => vi.restoreAllMocks());

  test('un emoji del canal: la plantilla s’esvaeix i l’emoji queda sol al cos, sense cap error', () => {
    const { adapter, inserix } = ambCanal();
    expect(m.editor.isFocused).toBe(false);
    let fet;
    expect(() => act(() => { fet = inserix('🍅'); })).not.toThrow();
    expect(fet).toBe(true);
    expect(senseFinalBuit(m.editor.getHTML())).toBe('<p>🍅</p>');
    expect(esLlavorVerge(m.editor, LLAVORS_NOTA)).toBe(false);
    expect(adapter.updateLocal).toHaveBeenLastCalledWith('d1', 'content', m.editor.getHTML());
  });

  test.each([
    ['titol', '<h2></h2>'],
    ['llista', '<ul><li><p></p></li></ul>'],
    ['citacio', '<blockquote><p></p></blockquote>']
  ])('el botó «%s» de la barra negra: la plantilla s’esvaeix i el format s’aplica al cos buit', (id, esperat) => {
    const adapter = pinta(LLAVOR_NOTA, { seedContent: LLAVORS_NOTA });
    let fet;
    expect(() => act(() => { fet = executa(m.editor, id); })).not.toThrow();
    expect(fet).toBe(true);
    expect(senseFinalBuit(m.editor.getHTML())).toBe(esperat);
    expect(adapter.updateLocal).toHaveBeenLastCalledWith('d1', 'content', m.editor.getHTML());
  });

  test('una plantilla ja tocada no s’esborra: l’emoji s’hi afig', () => {
    const { inserix } = ambCanal();
    act(() => { m.editor.commands.insertContentAt(1, 'Ara '); });
    let fet;
    act(() => { fet = inserix('🍅'); });
    expect(fet).toBe(true);
    // Al cursor, que l'edició ha deixat darrere de «Ara »: la resta, intacta.
    const html = m.editor.getHTML();
    expect(html).toContain('<h3>Ara 🍅Títol de secció (H3)</h3>');
    expect(html).toContain('Esta és la plantilla de format de Sóc de Poble');
  });

  test('sense llavor (seedContent null, el Perfil): el botó de la barra no esborra res', () => {
    pinta(LLAVOR_NOTA, { seedContent: null });
    act(() => { executa(m.editor, 'titol'); });
    expect(m.editor.getHTML()).toContain('Títol de secció (H3)');
  });
});
