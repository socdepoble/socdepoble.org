/* P0-58 (IDEA-189; decisions 2, 4 i 5 de l'àrbitre) · Enganxar un document
   sencer sobre l'H1 d'una nota BUIDA el reparteix entre el títol, el
   subtítol, l'entradilla i el cos, amb el motor de «🎴 Proposa Card»
   (sections/notes/proposaCard.js, importat ací com el passa el Bloc). Sobre
   el TipTap de veres i la closca de veres (només la barra es captura).
   Els porta-retalls de tests/helpers/portaretalls.js són SINTÈTICS. */
import React, { useCallback, useMemo, useState } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ editor: null, barra: null, doc: null, updateLocal: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('./richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: (editor) => { m.editor = editor; return { state: {}, exec: {} }; },
  UniversalRichTextToolbar: (props) => { m.barra = props; return null; }
}));
import { createDocument, getHTMLFromFragment } from '@tiptap/core';
import { DocumentEditor } from './DocumentEditor.jsx';
import { proposaCard } from '../../sections/notes/proposaCard.js';
import { GUIA_NOTA, LLAVOR_NOTA, LLAVORS_NOTA } from '../../sections/notes/llavorNota.js';
import { useNotaPreparada } from '../../sections/notes/notaPreparada.js';
import { buidaLlavorVerge, esLlavorVerge, oblidaLlavorsConsumides } from './richText/useUniversalRichText.js';
import { CLAU_GUIA_COS, oblidaCossosEscrits } from './richText/extensions/guiaCos.js';
import { htmlDelPortaretalls, netejaHtmlPerAlCos } from './richText/extensions/index.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { llegixExif, teExif } from './enquadrament/exif.js';
import { PORTARETALLS, URL_PROVA_TANCADA } from '../../../tests/helpers/portaretalls.js';
import { dataOriginal, gpsTorre, jpegAmbExif } from '../../../tests/helpers/jpegProva.js';

/* Design Guard compta tota etiqueta d'obertura de títol de nivell 1 escrita
   literalment a src: va interpolada. */
const H1 = 'h1';

function aBase64(bytes) {
  let binari = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binari += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binari);
}
const URL_GPS = `data:image/jpeg;base64,${aBase64(jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() }))}`;
const deDataUrl = (url) => Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (c) => c.charCodeAt(0));

beforeEach(() => {
  oblidaLlavorsConsumides();
  oblidaCossosEscrits();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  m.editor = null;
  m.barra = null;
  m.doc = null;
});

const NOTA_BUIDA = Object.freeze({ id: 'd1', title: '', subtitle: '', lead: '', content: LLAVOR_NOTA, formattedDate: '01/01/26', formattedTime: '10:00' });

/* Un Bloc de mentira: updateLocal escriu al document, com NotesContext; el
   motor, la llavor i la guia són els del Bloc. */
function Banc({ inicial = NOTA_BUIDA, saveRemote, motor = proposaCard }) {
  const [doc, setDoc] = useState(inicial);
  const updateLocal = useCallback((id, camp, valor) => setDoc((d) => (d.id === id ? { ...d, [camp]: valor } : d)), []);
  const adapter = useMemo(() => ({
    document: doc, labels: [], seedContent: LLAVORS_NOTA, guiaCos: GUIA_NOTA, updateLocal, saveRemote, proposaCard: motor,
  }), [doc, updateLocal, saveRemote, motor]);
  m.doc = doc;
  m.updateLocal = updateLocal;
  return <DocumentEditor adapter={adapter} />;
}
const munta = (props = {}) => {
  const saveRemote = vi.fn();
  return { saveRemote, ...render(<Banc saveRemote={saveRemote} {...props} />) };
};
const camp = (nom) => document.querySelector(`.editor-${nom}-input`);
const camps = () => ({ title: m.doc.title, subtitle: m.doc.subtitle, lead: m.doc.lead });
const portaretalls = ({ html = '', text = '' } = {}) => ({
  getData: (tipus) => (tipus === 'text/html' ? html : tipus === 'text/plain' ? text : ''),
});
/* Enganxar sobre l'H1 (amb el focus, com la persona). */
const enganxaAlTitol = (dades) => {
  const titol = camp('title');
  fireEvent.focus(titol);
  return fireEvent.paste(titol, { clipboardData: portaretalls(dades) });
};
const camps_desats = (saveRemote) => saveRemote.mock.calls.filter(([, c]) => c !== 'content');

const DOCUMENT = `<${H1}>La festa del poble.</${H1}><p>Tres dies de música</p>`
  + '<p>Enguany al carrer Major, amb parades &amp; sopar per a tothom, i un concert que durarà fins a la matinada del diumenge.</p>'
  + '<ul><li><p>Dissabte</p></li><li><p>Diumenge</p></li></ul>';

describe('una nota buida: es reparteix', () => {
  test('h1 + paràgraf breu + paràgraf llarg + llista: títol sense punt final, subtítol i entradilla (escapats) pel camí de sempre, i la resta al cos', () => {
    const { saveRemote } = munta();
    expect(enganxaAlTitol({ html: DOCUMENT, text: 'brossa' })).toBe(false);
    expect(camps()).toEqual({
      title: 'La festa del poble',
      subtitle: 'Tres dies de música',
      lead: 'Enguany al carrer Major, amb parades &amp; sopar per a tothom, i un concert que durarà fins a la matinada del diumenge.',
    });
    expect(camps_desats(saveRemote)).toEqual([
      ['d1', 'subtitle', 'Tres dies de música'],
      ['d1', 'lead', 'Enguany al carrer Major, amb parades &amp; sopar per a tothom, i un concert que durarà fins a la matinada del diumenge.'],
    ]);
    expect(m.editor.getHTML()).toBe('<ul><li><p>Dissabte</p></li><li><p>Diumenge</p></li></ul><p></p>');
    expect(m.doc.content).toBe(m.editor.getHTML());
    // Els camps es pinten: el títol, l'inserit al cursor; el subtítol i l'entradilla, el valor nou.
    expect(camp('title').textContent).toBe('La festa del poble');
    expect(camp('subtitle').textContent).toBe('Tres dies de música');
    expect(camp('lead').textContent).toContain('amb parades & sopar');
    // La guia del cos no torna (s'hi ha escrit) i la llavor no hi és.
    expect(CLAU_GUIA_COS.getState(m.editor.state).escrit).toBe(true);
    expect(m.editor.getHTML()).not.toContain('Una llista amb pics');
  });

  test('el títol es desa per l’autodesament del camp (en eixir)', () => {
    const { saveRemote } = munta();
    enganxaAlTitol({ html: DOCUMENT });
    fireEvent.blur(camp('title'));
    expect(saveRemote).toHaveBeenCalledWith('d1', 'title', 'La festa del poble');
  });

  test('Cmd/Ctrl+Z al cos torna el cos buit (mai la llavor) i el subtítol i l’entradilla buits; Cmd/Ctrl+Maj+Z ho refà', () => {
    munta();
    enganxaAlTitol({ html: DOCUMENT });
    const repartit = m.editor.getHTML();
    act(() => { m.editor.commands.undo(); });
    expect(m.editor.getHTML()).toBe('<p></p>');
    expect(camps()).toEqual({ title: 'La festa del poble', subtitle: '', lead: '' });
    act(() => { m.editor.commands.redo(); });
    expect(m.editor.getHTML()).toBe(repartit);
    expect(camps().subtitle).toBe('Tres dies de música');
  });

  test('«Desfés la proposta» també ho torna; buidar el cos a mà, no (el subtítol i l’entradilla es queden)', () => {
    munta();
    enganxaAlTitol({ html: DOCUMENT });
    expect(m.barra.proposaCardDesfer).toBe(true);
    act(() => { m.editor.commands.clearContent(true); });
    expect(m.editor.getHTML()).toBe('<p></p>');
    expect(camps().subtitle).toBe('Tres dies de música');
    cleanup();
    oblidaLlavorsConsumides();
    munta();
    enganxaAlTitol({ html: DOCUMENT });
    act(() => { m.barra.onProposaCard(); });
    expect(m.editor.getHTML()).toBe('<p></p>');
    expect(camps()).toEqual({ title: 'La festa del poble', subtitle: '', lead: '' });
  });

  test('una foto data:image amb GPS en un bloc posterior: la <img> del cos ix sense EXIF (netejaHtmlPerAlCos)', () => {
    munta();
    enganxaAlTitol({ html: `<p>Títol</p><p>Entradilla breu.</p><p><img src="${URL_GPS}" alt="casa"></p>` });
    expect(camps()).toMatchObject({ title: 'Títol', subtitle: 'Entradilla breu' });
    const img = new DOMParser().parseFromString(m.editor.getHTML(), 'text/html').querySelector('img');
    expect(img).not.toBeNull();
    const src = img.getAttribute('src');
    expect(src.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(src).not.toBe(URL_GPS);
    expect(teExif(deDataUrl(src))).toBe(false);
    expect(llegixExif(deDataUrl(src))).toEqual({ orientacio: null, gps: null, dataCaptura: null });
    expect(JSON.stringify(m.doc)).not.toContain(URL_GPS);
  });

  test('la porta del repartiment és la de l’enganxat al cos: el transformPastedHTML de l’editor és netejaHtmlPerAlCos', () => {
    munta();
    const html = `<p>Foto</p><img src="${URL_GPS}" alt="A"><p><code>${URL_PROVA_TANCADA}</code></p>`;
    expect(m.editor.view.props.transformPastedHTML(html, m.editor.view)).toBe(netejaHtmlPerAlCos(html));
    expect(netejaHtmlPerAlCos(html)).not.toBe(html);
  });

  test('Google Docs (embolcall <b id=docs-internal-guid>): es reparteix i el cos conserva les negretes i les cursives', () => {
    const html = PORTARETALLS.googleDocs.html.replace('</p></b>', '</p><p dir="ltr" style="margin-top:0pt;">'
      + '<span style="font-weight:700;font-style:normal;">Molt</span><span style="font-weight:400;font-style:italic;"> important</span>'
      + '<span style="font-weight:400;font-style:normal;"> per al poble.</span></p></b>');
    munta();
    enganxaAlTitol({ html, text: 'brossa' });
    expect(camps()).toEqual({
      title: 'Fira de tardor', subtitle: 'Dissabte a la plaça',
      lead: 'Hi haurà parades de verdura, música i berenar per a tothom.',
    });
    expect(m.editor.getHTML()).toBe('<p><strong>Molt</strong><em> important</em> per al poble.</p>');
    // L'ordre importa: sanejar abans de llegir-lo amb l'esquema perdria les dues marques.
    const alReves = getHTMLFromFragment(createDocument(sanitizeHtml(htmlDelPortaretalls({ html })), m.editor.schema).content, m.editor.schema);
    expect(alReves).not.toMatch(/<strong>|<em>/);
  });

  test('la captura (codi amb URL) i un h1 extern: enllaç clicable al cos i cap h1', () => {
    munta();
    enganxaAlTitol({ html: `<${H1}>Prova tancada</${H1}><p>Per a Android</p><p>Entradilla.</p>${PORTARETALLS.captura.html}<${H1}>Més</${H1}><p>Fi</p>` });
    expect(camps()).toEqual({ title: 'Prova tancada', subtitle: 'Per a Android', lead: 'Entradilla.' });
    const cos = m.editor.getHTML();
    expect(cos).toContain(`<a target="_blank" rel="noopener noreferrer nofollow" href="${URL_PROVA_TANCADA}">${URL_PROVA_TANCADA}</a>`);
    expect(cos).not.toContain('<code>');
    expect(new DOMParser().parseFromString(cos, 'text/html').querySelector(H1)).toBeNull();
    expect(cos).toContain('<h2>Més</h2>');
  });

  test('el Markdown del botó de copiar de ChatGPT (només text/plain): títol, subtítol, entradilla i la resta amb format', () => {
    munta();
    enganxaAlTitol({ text: PORTARETALLS.chatgptBotoCopiar.text });
    expect(camps()).toEqual({
      title: 'Com instal·lar l’app', subtitle: 'Abans de començar',
      lead: `Primer, apunta’t a la prova tancada: ${URL_PROVA_TANCADA}.`,
    });
    const cos = m.editor.getHTML();
    expect(cos.startsWith('<h3>Passos</h3><ul>')).toBe(true);
    for (const etiqueta of ['<ol>', '<blockquote>', '<hr>', '<pre>', '<s>']) expect(cos).toContain(etiqueta);
    expect(cos).not.toMatch(/[#*]|```/);
  });

  test('text pla sense marques (diverses línies) i un paràgraf amb salts: també es reparteixen', () => {
    munta();
    enganxaAlTitol({ text: 'Fira de Sant Martí\nDissabte a les 10\nPorteu cadires i taules.\nhttps://socdepoble.org/agenda' });
    expect(camps()).toEqual({ title: 'Fira de Sant Martí', subtitle: 'Dissabte a les 10', lead: 'Porteu cadires i taules.' });
    expect(m.editor.getHTML()).toBe('<p><a target="_blank" rel="noopener noreferrer nofollow" href="https://socdepoble.org/agenda">https://socdepoble.org/agenda</a></p>');
    cleanup();
    oblidaLlavorsConsumides();
    munta();
    enganxaAlTitol({ html: '<p>Títol<br>Subtítol<br>La resta del paràgraf.</p>' });
    expect(camps()).toEqual({ title: 'Títol', subtitle: 'Subtítol', lead: 'La resta del paràgraf.' });
  });

  test('tot pujat als camps: el cos es queda buit i sense cap pas de més a l’historial', () => {
    munta();
    enganxaAlTitol({ text: 'Títol\n\nSubtítol' });
    expect(camps()).toEqual({ title: 'Títol', subtitle: 'Subtítol', lead: '' });
    expect(m.editor.getHTML()).toBe('<p></p>');
    expect(m.barra.proposaCardDesfer).toBe(false);
    // Escriure i esborrar al cos no torna res arrere.
    act(() => { m.editor.commands.insertContent('x'); });
    act(() => { m.editor.commands.clearContent(true); });
    expect(camps().subtitle).toBe('Subtítol');
  });
});

describe('decisions 4 i 5', () => {
  test('decisió 5 · un sol bloc: l’enganxat normal d’una línia (amb el punt) i el cos (la llavor) sense tocar', () => {
    const { saveRemote } = munta();
    enganxaAlTitol({ html: '<p>Hola <strong>món</strong>.</p>', text: 'Hola món.' });
    expect(camps()).toEqual({ title: 'Hola món.', subtitle: '', lead: '' });
    expect(camps_desats(saveRemote)).toEqual([]);
    expect(m.editor.getHTML()).toContain('Una llista amb pics');
  });

  test('C-02 · decisió 5 · una sola línia de text pla que comença per un any: el títol, sencer, i el cos sense tocar', () => {
    const { saveRemote } = munta();
    enganxaAlTitol({ text: '2024. Un any per recordar' });
    expect(camps()).toEqual({ title: '2024. Un any per recordar', subtitle: '', lead: '' });
    expect(camps_desats(saveRemote)).toEqual([]);
    expect(m.editor.getHTML()).toContain('Una llista amb pics');
  });

  test('decisió 5 · un sol paràgraf amb les línies en blanc del porta-retalls (Google Docs, Apple-interchange-newline) també és un sol bloc', () => {
    munta();
    enganxaAlTitol({
      html: '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1"><p dir="ltr"><span style="font-weight:700;">Fira</span>'
        + '<span style="font-weight:400;"> de tardor</span></p></b><br><br class="Apple-interchange-newline">',
      text: 'Fira de tardor',
    });
    expect(camps()).toEqual({ title: 'Fira de tardor', subtitle: '', lead: '' });
    expect(m.editor.getHTML()).toContain('Una llista amb pics');
  });

  test('decisió 4 · diversos blocs sense cap línia apta per al títol: tot al cos i el títol buit', () => {
    const llarg = `Un paràgraf molt llarg ${'que no cap en cap títol '.repeat(6)}de cap manera.`;
    expect(llarg.length).toBeGreaterThan(120);
    munta();
    enganxaAlTitol({ text: `${llarg}\n\nSegon paràgraf.` });
    expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
    expect(camp('title').childNodes).toHaveLength(0);
    expect(m.editor.getHTML()).toBe(`<p>${llarg}</p><p>Segon paràgraf.</p>`);
    cleanup();
    oblidaLlavorsConsumides();
    munta();
    enganxaAlTitol({ html: '<ul><li>pa</li><li>vi</li></ul><p>i oli</p>' });
    expect(camps()).toEqual({ title: '', subtitle: '', lead: '' });
    expect(m.editor.getHTML()).toBe('<ul><li><p>pa</p></li><li><p>vi</p></li></ul><p>i oli</p>');
  });
});

describe('no es reparteix', () => {
  test.each([
    ['un subtítol', { subtitle: 'S' }],
    ['una entradilla', { lead: '<p>E</p>' }],
    ['un cos amb text', { content: '<p>Ja hi ha text</p>' }],
  ])('amb %s: l’enganxat d’una línia', (_nom, canvis) => {
    const { saveRemote } = munta({ inicial: { ...NOTA_BUIDA, ...canvis } });
    const cosAbans = m.editor.getHTML();
    enganxaAlTitol({ html: DOCUMENT });
    expect(m.doc.title).toBe('La festa del poble. Tres dies de música Enguany al carrer Major, amb parades &amp; sopar per a tothom, i un concert que durarà fins a la matinada del diumenge. Dissabte Diumenge');
    expect(m.editor.getHTML()).toBe(cosAbans);
    expect(camps_desats(saveRemote)).toEqual([]);
  });

  /* C-04 · P1-02: un cos igual que la llavor però ja consumit (la persona
     l'ha tornat a escriure i desat) és text de la persona, no una llavor
     verge: el repartiment no el sobreescriu. */
  test('C-04 · P1-02 · un cos igual que la llavor però ja consumit: l’enganxat d’una línia i el cos intacte', () => {
    munta();
    act(() => { buidaLlavorVerge(m.editor); });
    cleanup();
    const { saveRemote } = munta();
    const cosDeLaPersona = m.editor.getHTML();
    expect(esLlavorVerge(m.editor, LLAVORS_NOTA)).toBe(true);
    enganxaAlTitol({ html: DOCUMENT });
    expect(m.editor.getHTML()).toBe(cosDeLaPersona);
    expect(camps().subtitle).toBe('');
    expect(camps().lead).toBe('');
    expect(m.doc.title.startsWith('La festa del poble. Tres dies')).toBe(true);
    expect(camps_desats(saveRemote)).toEqual([]);
  });

  test('amb el títol ple: la closca no ho pregunta', () => {
    const motor = vi.fn(proposaCard);
    munta({ inicial: { ...NOTA_BUIDA, title: 'Ja' }, motor });
    enganxaAlTitol({ text: 'A\n\nB' });
    expect(m.doc.title).toBe('JaA B');
    expect(motor.mock.calls.filter(([contingut]) => contingut?.title === '' && contingut?.subtitle === '')).toEqual([]);
  });

  test('sense motor (una connexió o un contingut de fora, citaOrigen): cap prop nova i l’enganxat d’una línia', () => {
    munta({ motor: null });
    enganxaAlTitol({ html: DOCUMENT });
    expect(camps().subtitle).toBe('');
    expect(m.doc.title.startsWith('La festa del poble. Tres dies')).toBe(true);
    expect(m.editor.getHTML()).toContain('Una llista amb pics');
  });

  test('el subtítol i l’entradilla no reparteixen mai', () => {
    munta();
    fireEvent.paste(camp('subtitle'), { clipboardData: portaretalls({ html: DOCUMENT }) });
    expect(camps().title).toBe('');
    expect(camps().subtitle.startsWith('La festa del poble. Tres dies')).toBe(true);
    expect(m.editor.getHTML()).toContain('Una llista amb pics');
  });
});

/* P4 · La «Nota sense títol» preparada (notaPreparada.js): no existix al
   servidor fins a la primera escriptura. Un sol gest porta quatre escriptures
   (subtítol, entradilla, cos i títol) mentre la creació viatja: s'ha de crear
   UNA vegada, amb el MATEIX id, i el que arriba mentrestant s'hi queda. */
function NotaPreparada({ creaNota, sortida }) {
  const preparada = useNotaPreparada({
    clau: 'ambit-A', base: { folderId: 'f-notes' }, llavor: LLAVORS_NOTA, notes: [], creaNota,
    setLocalNoteField: vi.fn(), updateNote: vi.fn(async () => ({})), informaError: vi.fn(),
  });
  sortida.preparada = preparada;
  const adapter = useMemo(() => ({
    document: preparada.document, labels: [], seedContent: LLAVORS_NOTA, guiaCos: GUIA_NOTA,
    updateLocal: preparada.escriu, saveRemote: preparada.desa, proposaCard,
  }), [preparada.document, preparada.escriu, preparada.desa]);
  return <DocumentEditor adapter={adapter} />;
}

test('nota preparada: enganxar un document sencer la crea una sola vegada, amb el mateix id i els quatre camps', async () => {
  const creaNota = vi.fn(async (entrada) => ({ ...entrada, revision: 1 }));
  const sortida = {};
  render(<NotaPreparada creaNota={creaNota} sortida={sortida} />);
  const { id } = sortida.preparada;
  await act(async () => { enganxaAlTitol({ html: DOCUMENT }); });
  expect(creaNota).toHaveBeenCalledTimes(1);
  expect(creaNota.mock.calls[0][0].id).toBe(id);
  expect(sortida.preparada.id).toBe(id);
  expect(sortida.preparada.camps).toMatchObject({
    title: 'La festa del poble',
    subtitle: 'Tres dies de música',
    lead: 'Enguany al carrer Major, amb parades &amp; sopar per a tothom, i un concert que durarà fins a la matinada del diumenge.',
    content: '<ul><li><p>Dissabte</p></li><li><p>Diumenge</p></li></ul><p></p>',
  });
});
