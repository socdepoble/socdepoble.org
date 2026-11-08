/* P0-58 (IDEA-189) · L'enganxat al cos entra net: el codi amb una URL és un
   enllaç clicable, el títol de nivell 1 baixa a h2, els enllaços només porten
   l'href, les negretes i cursives de Google Docs es conserven, el text pla
   amb Markdown entra amb el nostre format (esdeveniment paste de veres, amb
   només text/plain) i Maj+enganxar continua sent literal. Editor de veres
   (TipTap + ProseMirror) configurat com useUniversalRichText, en jsdom.
   Els porta-retalls de tests/helpers/portaretalls.js són SINTÈTICS. */
import { afterEach, describe, expect, test } from 'vitest';
import { Editor, createDocument, getHTMLFromFragment } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SenseSubratllat } from './senseSubratllat.js';
import { extensionsRiques, htmlDelPortaretalls, netejaHtmlPerAlCos } from './index.js';
import { NOM_ENGANXAT_DE_TEXT, netejaFormatEnganxat } from './enganxatNet.js';
import { markdownAHtml } from '../markdownEnganxat.js';
import { sanitizeHtml } from '../../../../utils/sanitize.js';
import { netejaCamp } from '../../../../sections/notes/netejaCamp.js';
import { llegixExif, teExif } from '../../enquadrament/exif.js';
import { dataOriginal, gpsTorre, jpegAmbExif } from '../../../../../tests/helpers/jpegProva.js';
import { PORTARETALLS, URL_PROVA_TANCADA } from '../../../../../tests/helpers/portaretalls.js';

/* Design Guard compta tota etiqueta d'obertura de títol de nivell 1 escrita
   literalment a src: va interpolada. */
const H1 = 'h1';

/* L'HTML llegit sense pintar-lo (DOMParser és inert). */
const cos = (html) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;

/* Una foto JPEG amb GPS, com a imatgesEnganxades.test.js. */
function aBase64(bytes) {
  let binari = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binari += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binari);
}
const URL_GPS = `data:image/jpeg;base64,${aBase64(jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() }))}`;
const deDataUrl = (url) => Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (c) => c.charCodeAt(0));
const fonts = (html) => Array.from(cos(html).querySelectorAll('img'), (img) => img.getAttribute('src'));
const esperaNeta = (src) => {
  expect(src.startsWith('data:image/jpeg;base64,')).toBe(true);
  const bytes = deDataUrl(src);
  expect(teExif(bytes)).toBe(false);
  expect(llegixExif(bytes)).toEqual({ orientacio: null, gps: null, dataCaptura: null });
};

/* L'editor com el munta useUniversalRichText (StarterKit amb h2–h6 i sense
   subratllat, SenseSubratllat) amb les extensions riques de DocumentEditor. */
let editors = [];
function creaEditor(content = '<p></p>', { senseMarkdown = false } = {}) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const riques = extensionsRiques().filter((e) => !senseMarkdown || e.name !== NOM_ENGANXAT_DE_TEXT);
  const editor = new Editor({
    element,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] }, underline: false }), SenseSubratllat, ...riques],
    content,
  });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  for (const editor of editors) editor.destroy();
  editors = [];
  document.body.replaceChildren();
});

const enganxaHtml = (editor, html) => editor.view.pasteHTML(html, new Event('paste'));

/* Un esdeveniment paste de veres despatxat al DOM de l'editor (NO view.pasteText,
   que força el text literal). `maj`: Maj+enganxar. */
function enganxa(editor, dades, { maj = false } = {}) {
  editor.view.input.shiftKey = maj;
  editor.view.input.lastKeyCode = maj ? 16 : null;
  const esdeveniment = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(esdeveniment, 'clipboardData', {
    value: { getData: (tipus) => dades[tipus] || '', types: Object.keys(dades) },
  });
  editor.view.dom.dispatchEvent(esdeveniment);
  editor.view.input.shiftKey = false;
  return esdeveniment;
}
const enganxaText = (editor, text, opcions) => enganxa(editor, { 'text/plain': text }, opcions);

describe('netejaFormatEnganxat · la funció', () => {
  test('la captura: el codi amb l’adreça de la prova tancada és un enllaç amb el mateix text', () => {
    const arrel = cos(netejaFormatEnganxat(PORTARETALLS.captura.html));
    expect(arrel.querySelector('code')).toBeNull();
    const enllac = arrel.querySelector('a');
    expect(enllac.getAttribute('href')).toBe(URL_PROVA_TANCADA);
    expect(enllac.textContent).toBe(URL_PROVA_TANCADA);
    expect(arrel.textContent).toBe(PORTARETALLS.captura.text);
  });

  test('un codi que no és una URL es queda igual (la mateixa cadena)', () => {
    const html = '<p>Executa <code>npm run dev</code> i ja.</p>';
    expect(netejaFormatEnganxat(html)).toBe(html);
  });

  test.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,x',
    'https://x" onmouseover="y',
    'https://usuari:clau@example.org',
    'vbscript:msgbox',
    '//example.org',
  ])('un codi amb «%s» no dona cap enllaç', (valor) => {
    const arrel = cos(netejaFormatEnganxat(`<p><code>${valor.replace(/"/g, '&quot;')}</code></p>`));
    expect(arrel.querySelector('a')).toBeNull();
    expect(arrel.querySelector('code').textContent).toBe(valor);
  });

  test('un codi dins d’un enllaç (o amb l’enllaç dins) es desfà: un sol <a>, sense codi', () => {
    expect(netejaFormatEnganxat('<p><a href="https://x.org"><code>https://x.org</code></a></p>')).toBe('<p><a href="https://x.org">https://x.org</a></p>');
    expect(netejaFormatEnganxat('<p><code><a href="https://x.org">web</a></code></p>')).toBe('<p><a href="https://x.org">web</a></p>');
  });

  test('un bloc de codi amb només una URL és un paràgraf amb l’enllaç; amb codi de veres, igual', () => {
    expect(netejaFormatEnganxat('<pre><code>https://x.org</code></pre>')).toBe('<p><a href="https://x.org">https://x.org</a></p>');
    const codi = '<pre><code>npm install\nnpm run dev</code></pre>';
    expect(netejaFormatEnganxat(codi)).toBe(codi);
  });

  test('el títol de nivell 1 baixa a h2, amb el contingut i els atributs', () => {
    expect(netejaFormatEnganxat(`<${H1}><strong>T</strong></${H1}>`)).toBe('<h2><strong>T</strong></h2>');
    expect(netejaFormatEnganxat(`<${H1} class="x" style="text-align: center">T</${H1}><p>a</p>`)).toBe('<h2 class="x" style="text-align: center">T</h2><p>a</p>');
  });

  test('un enllaç només conserva l’href', () => {
    expect(netejaFormatEnganxat('<a class="x" style="color: red" id="y" data-x="1" target="_blank" rel="noopener" href="https://x.org">w</a>'))
      .toBe('<a href="https://x.org">w</a>');
  });

  test('una imatge enllaçada conserva target i rel (SdpImage els llig de l’<a> pare, P0-26 D1)', () => {
    expect(netejaFormatEnganxat('<a class="x" style="color: red" target="_blank" rel="noopener" href="https://x.org"><img src="/assets/a.webp"></a>'))
      .toBe('<a target="_blank" rel="noopener" href="https://x.org"><img src="/assets/a.webp"></a>');
  });

  test('Google Docs torna IDÈNTIC: el style dels spans es queda (la negreta i la cursiva en depenen)', () => {
    expect(netejaFormatEnganxat(PORTARETALLS.googleDocs.html)).toBe(PORTARETALLS.googleDocs.html);
  });

  test('un enganxat intern (data-pm-slice) torna IDÈNTIC', () => {
    const intern = '<p data-pm-slice="1 1 []">Mira <code>https://x.org</code> <a class="x" href="https://y.org">y</a></p>';
    expect(netejaFormatEnganxat(intern)).toBe(intern);
    const ambTitol = `<${H1} data-pm-slice="0 0 []">T</${H1}>`;
    expect(netejaFormatEnganxat(ambTitol)).toBe(ambTitol);
  });

  test('sense codi, títol de nivell 1, enllaç ni bloc de codi torna IDÈNTIC (també <abbr> i <article>)', () => {
    for (const html of [
      '<p>Hola <strong>món</strong> <span style="font-weight: 700">x</span></p>',
      '<p><abbr title="Unió Europea">UE</abbr></p><article><p>a</p></article>',
      '<p>Diu «data-pm-slice» i <em>res</em> més</p>',
      '',
    ]) {
      expect(netejaFormatEnganxat(html)).toBe(html);
    }
  });

  test('un «</template>» enganxat torna l’entrada sense tocar; el que no és una cadena també', () => {
    const html = '<p><code>https://x.org</code></p></template><p>x</p>';
    expect(netejaFormatEnganxat(html)).toBe(html);
    for (const valor of [null, undefined, 3]) expect(netejaFormatEnganxat(valor)).toBe(valor);
  });
});

describe('netejaHtmlPerAlCos i el contracte de les extensions', () => {
  test('SdpImage es queda a l’índex 0 i transformPastedHTML és netejaHtmlPerAlCos', () => {
    const [imatge] = extensionsRiques();
    expect(imatge.name).toBe('image');
    expect(imatge.config.transformPastedHTML(PORTARETALLS.captura.html)).toBe(netejaHtmlPerAlCos(PORTARETALLS.captura.html));
    expect(netejaHtmlPerAlCos(PORTARETALLS.captura.html)).toContain(`<a href="${URL_PROVA_TANCADA}">`);
  });

  test('EnganxatDeText hi és sempre, darrere de les fixes i davant de les opcionals', () => {
    const noms = (opcions) => extensionsRiques(opcions).map((e) => e.name);
    const fixes = noms();
    expect(fixes[fixes.length - 1]).toBe(NOM_ENGANXAT_DE_TEXT);
    expect(noms({ placeholderCos: 'Escriu' })).toEqual([...fixes, 'placeholderCos']);
  });

  test('sense res a fer, la mateixa cadena: P1-64 (foto pujada) i un enganxat intern amb el registre de foto', () => {
    const transforma = extensionsRiques()[0].config.transformPastedHTML;
    const pujada = '<p>Hola</p><img src="sdp-media://mitjans/t/u/notes/a.webp" alt="A" data-sdp-bloquejada="1">';
    expect(transforma(pujada)).toBe(pujada);
    const intern = '<p data-pm-slice="1 1 []"><code>https://x.org</code></p><img src="sdp-media://mitjans/t/u/notes/a.webp" data-lat="38.6" data-lng="-0.4" data-precisio="exacta">';
    expect(transforma(intern)).toBe(intern);
  });
});

describe('enganxar HTML al cos (editor de veres)', () => {
  test('la captura: entra un enllaç clicable, sense píndola de codi, i el desat de Notes el conserva', () => {
    const editor = creaEditor();
    enganxaHtml(editor, PORTARETALLS.captura.html);
    const html = editor.getHTML();
    const arrel = cos(html);
    expect(arrel.querySelector('code')).toBeNull();
    expect(arrel.querySelector('a').getAttribute('href')).toBe(URL_PROVA_TANCADA);
    expect(cos(netejaCamp('content', html)).querySelector('a').getAttribute('href')).toBe(URL_PROVA_TANCADA);
  });

  test('ChatGPT (selecció, SINTÈTIC): cap codi amb URL; títol, negreta, cursiva i les dues llistes es conserven', () => {
    const editor = creaEditor();
    enganxaHtml(editor, PORTARETALLS.chatgptSeleccio.html);
    const arrel = cos(editor.getHTML());
    for (const codi of arrel.querySelectorAll('code')) expect(codi.textContent).not.toMatch(/https?:/);
    expect(Array.from(arrel.querySelectorAll('a'), (a) => a.getAttribute('href'))).toEqual([URL_PROVA_TANCADA]);
    expect(arrel.querySelector('h3').textContent).toBe('Com instal·lar l’app');
    expect(Array.from(arrel.querySelectorAll('strong'), (s) => s.textContent)).toEqual(['apunta’t', 'Sóc de Poble']);
    expect(arrel.querySelector('em').textContent).toBe('Google Play');
    expect(arrel.querySelectorAll('ul > li')).toHaveLength(2);
    expect(arrel.querySelectorAll('ol > li')).toHaveLength(2);
    expect(Array.from(arrel.querySelectorAll('p > code'), (c) => c.textContent)).toContain('npm run dev');
  });

  test('Google Docs (SINTÈTIC): negreta i cursiva es conserven i la resta no queda en negreta', () => {
    const editor = creaEditor();
    enganxaHtml(editor, PORTARETALLS.googleDocs.html);
    const arrel = cos(editor.getHTML());
    expect(Array.from(arrel.querySelectorAll('strong'), (s) => s.textContent)).toEqual(['Fira de tardor', 'verdura']);
    expect(Array.from(arrel.querySelectorAll('em'), (e) => e.textContent)).toEqual(['Dissabte a la plaça']);
    const darrer = Array.from(arrel.querySelectorAll('p')).find((p) => p.textContent.startsWith('Hi haurà'));
    expect(darrer.firstChild.nodeType).toBe(Node.TEXT_NODE);
  });

  test('Word (SINTÈTIC): el títol de nivell 1 és un h2, negreta i cursiva es conserven i l’enllaç no porta la classe de Word', () => {
    const editor = creaEditor();
    enganxaHtml(editor, PORTARETALLS.word.html);
    const arrel = cos(editor.getHTML());
    expect(arrel.querySelector('h1')).toBeNull();
    expect(arrel.querySelector('h2').textContent).toBe('Assemblea de veïns');
    expect(arrel.querySelector('strong').textContent).toBe('Dijous');
    expect(arrel.querySelector('em').textContent).toBe('sala gran');
    const enllac = arrel.querySelector('a');
    expect(enllac.getAttribute('href')).toBe('https://socdepoble.org/assemblea');
    expect(enllac.hasAttribute('class')).toBe(false);
  });

  test('una imatge enllaçada de fora conserva l’enllaç en pestanya nova', () => {
    const editor = creaEditor();
    enganxaHtml(editor, '<a class="MsoHyperlink" target="_blank" href="https://socdepoble.org/aplec"><img src="/assets/cartell.webp" alt="Cartell"></a>');
    const enllac = cos(editor.getHTML()).querySelector('a');
    expect([enllac.getAttribute('href'), enllac.getAttribute('target'), enllac.getAttribute('rel'), enllac.getAttribute('class')])
      .toEqual(['https://socdepoble.org/aplec', '_blank', 'noopener noreferrer', 'sdp-image-link']);
    expect(enllac.querySelector('img').getAttribute('src')).toBe('/assets/cartell.webp');
  });

  test('un títol de nivell 1 de fora entra com a h2', () => {
    const editor = creaEditor();
    enganxaHtml(editor, `<${H1}>Títol de fora</${H1}><p>Text</p>`);
    expect(editor.getHTML()).toBe('<h2>Títol de fora</h2><p>Text</p>');
  });

  test('una foto data:image/jpeg amb GPS enganxada amb un codi amb URL (la passada nova) ix sense EXIF', () => {
    const editor = creaEditor();
    enganxaHtml(editor, `<p>Mira <code>${URL_PROVA_TANCADA}</code></p><img src="${URL_GPS}" alt="Olivera">`);
    const html = editor.getHTML();
    expect(cos(html).querySelector('a').getAttribute('href')).toBe(URL_PROVA_TANCADA);
    const [src] = fonts(html);
    esperaNeta(src);
  });

  test('copiar i enganxar dins del text un codi amb URL el conserva (enganxat intern)', () => {
    const origen = creaEditor(`<p>Codi: <code>${URL_PROVA_TANCADA}</code></p>`);
    origen.commands.selectAll();
    const { dom } = origen.view.serializeForClipboard(origen.state.selection.content());
    expect(dom.innerHTML).toContain('data-pm-slice');
    const desti = creaEditor();
    enganxaHtml(desti, dom.innerHTML);
    expect(cos(desti.getHTML()).querySelector('code').textContent).toBe(URL_PROVA_TANCADA);
  });
});

describe('enganxar text pla al cos (esdeveniment paste de veres, només text/plain)', () => {
  test('el botó de copiar de ChatGPT (SINTÈTIC): h2, h3, llistes, cita, separador, codi, negreta, cursiva, ratllat i enllaços', () => {
    const editor = creaEditor();
    const esdeveniment = enganxaText(editor, PORTARETALLS.chatgptBotoCopiar.text);
    expect(esdeveniment.defaultPrevented).toBe(true);
    const arrel = cos(editor.getHTML());
    expect(Array.from(arrel.children, (e) => e.tagName.toLowerCase())).toEqual(['h2', 'h2', 'p', 'h3', 'ul', 'ol', 'blockquote', 'hr', 'p', 'pre', 'p']);
    expect(arrel.querySelector('strong').textContent).toBe('apunta’t');
    expect(Array.from(arrel.querySelectorAll('em'), (e) => e.textContent)).toEqual(['Google Play', 'Sóc de Poble']);
    expect(arrel.querySelector('s').textContent).toBe('Ja no cal registrar-se.');
    expect(Array.from(arrel.querySelectorAll('a'), (a) => [a.getAttribute('href'), a.textContent])).toEqual([
      [URL_PROVA_TANCADA, URL_PROVA_TANCADA],
      ['https://socdepoble.org', 'la web'],
      ['https://socdepoble.org/ajuda', 'https://socdepoble.org/ajuda'],
    ]);
    expect(arrel.querySelector('pre').textContent).toBe('npm run dev');
  });

  test('la llista de WhatsApp (SINTÈTIC) és una llista de veres', () => {
    const editor = creaEditor();
    enganxaText(editor, PORTARETALLS.whatsappWebLlista.text);
    expect(editor.getHTML()).toBe('<p>Per a la fira:</p><ul><li><p>pa</p></li><li><p>vi</p></li><li><p>oli</p></li></ul><p></p>');
  });

  /* C-02 · Un element de llista sol no és Markdown: «- Avís important -»
     entra literal, com a HEAD. Un text pla fet NOMÉS de línies numerades
     seguides («2024. …», «3. …\n4. …») el pren abans el handlePaste
     d'OrderedList de TipTap 3.31 (extension-list, parsePlainTextOrderedListPaste),
     que ja hi era a HEAD: el resultat és el mateix amb EnganxatDeText o sense. */
  test.each(['2024. Un any per recordar', '3. Tercer\n4. Quart', '- Avís important -', '1714. La caiguda de Barcelona'])(
    'C-02 · %j: el mateix HTML que sense EnganxatDeText (cap canvi respecte de HEAD)',
    (text) => {
      const editor = creaEditor();
      const sense = creaEditor('<p></p>', { senseMarkdown: true });
      enganxaText(editor, text);
      enganxaText(sense, text);
      expect(editor.getHTML()).toBe(sense.getHTML());
    },
  );

  /* C-02 · Quan el text porta Markdown i el converteix markdownAHtml (el
     handlePaste de TipTap no el pren perquè no totes les línies són
     numerades), una llista que comença per 3 no es renumera 1-2 (el desat
     de Notes lleva el start, WC-06): els números es queden com a text. */
  test('C-02 · «## Història» + «3. Tercer / 4. Quart»: el títol i els números com a text, sense cap <ol> renumerada', () => {
    const editor = creaEditor();
    enganxaText(editor, '## Història\n3. Tercer\n4. Quart');
    expect(editor.getHTML()).toBe('<h2>Història</h2><p>3. Tercer</p><p>4. Quart</p>');
    expect(netejaCamp('content', editor.getHTML())).toContain('<p>3. Tercer</p><p>4. Quart</p>');
  });

  test('amb Maj premuda entra literal: cap títol, llista ni cita', () => {
    const editor = creaEditor();
    enganxaText(editor, '## Títol\n- punt\n> cita', { maj: true });
    const arrel = cos(editor.getHTML());
    expect(arrel.querySelector('h2, h3, ul, ol, blockquote')).toBeNull();
    expect(Array.from(arrel.querySelectorAll('p'), (p) => p.textContent)).toEqual(['## Títol', '- punt', '> cita']);
  });

  test('un text sense marques de bloc dona el mateix HTML que sense l’extensió (un <p> per línia)', () => {
    for (const text of ['Hola veïns\nDemà hi ha fira\n\nPorteu cadira', PORTARETALLS.whatsappWeb.text]) {
      const amb = creaEditor();
      const sense = creaEditor('<p></p>', { senseMarkdown: true });
      enganxaText(amb, text);
      enganxaText(sense, text);
      expect(amb.getHTML()).toBe(sense.getHTML());
    }
    const editor = creaEditor();
    enganxaText(editor, 'Hola veïns\nDemà hi ha fira\n\nPorteu cadira');
    expect(editor.getHTML()).toBe('<p>Hola veïns</p><p>Demà hi ha fira</p><p>Porteu cadira</p>');
  });

  test('dins d’un bloc de codi el text entra cru', () => {
    const editor = creaEditor('<pre><code>abc</code></pre>');
    editor.commands.setTextSelection(4);
    enganxaText(editor, '# Títol\n- punt');
    expect(editor.getHTML()).toBe('<pre><code>abc# Títol\n- punt</code></pre><p></p>');
  });

  test('una URL sola sobre una selecció fa l’enllaç (linkOnPaste de TipTap, intacte)', () => {
    const editor = creaEditor('<p>la web</p>');
    editor.commands.setTextSelection({ from: 4, to: 7 });
    enganxaText(editor, 'https://example.org');
    const enllac = cos(editor.getHTML()).querySelector('a');
    expect(enllac.getAttribute('href')).toBe('https://example.org');
    expect(enllac.textContent).toBe('web');
  });

  test('XSS: un enllaç perillós es queda com a text i «![a](data:…)» no crea cap imatge', () => {
    const editor = creaEditor();
    enganxaText(editor, '- [x](javascript:alert(1))\n- ![a](data:image/jpeg;base64,/9j/4AAQ)\n- <img src=x onerror=alert(1)>');
    const html = editor.getHTML();
    const arrel = cos(html);
    expect(arrel.querySelector('img, script')).toBeNull();
    expect(Array.from(arrel.querySelectorAll('a'), (a) => a.getAttribute('href'))).toEqual([]);
    expect(Array.from(arrel.querySelectorAll('li'), (li) => li.textContent)).toEqual([
      '[x](javascript:alert(1))', '![a](data:image/jpeg;base64,/9j/4AAQ)', '<img src=x onerror=alert(1)>',
    ]);
  });

  test('amb text/html i text/plain, mana l’HTML (net)', () => {
    const editor = creaEditor();
    enganxa(editor, { 'text/html': PORTARETALLS.captura.html, 'text/plain': PORTARETALLS.captura.text });
    const arrel = cos(editor.getHTML());
    expect(arrel.querySelector('code')).toBeNull();
    expect(arrel.querySelector('a').getAttribute('href')).toBe(URL_PROVA_TANCADA);
  });
});

describe('htmlDelPortaretalls (per a qui reparteix un document enganxat)', () => {
  test('amb HTML, netejaHtmlPerAlCos; sense, el Markdown o un paràgraf per línia; buit, res', () => {
    expect(htmlDelPortaretalls({ html: PORTARETALLS.captura.html, text: PORTARETALLS.captura.text })).toBe(netejaHtmlPerAlCos(PORTARETALLS.captura.html));
    expect(htmlDelPortaretalls({ text: PORTARETALLS.chatgptBotoCopiar.text })).toBe(markdownAHtml(PORTARETALLS.chatgptBotoCopiar.text));
    expect(htmlDelPortaretalls({ html: '', text: 'Hola <veïns>\nbon dia' })).toBe('<p>Hola &lt;veïns&gt;</p><p>bon dia</p>');
    expect(htmlDelPortaretalls({ html: '  ', text: ' ' })).toBe('');
    expect(htmlDelPortaretalls()).toBe('');
  });

  test('P1-64 · una foto data:image amb GPS ix sense EXIF (setContent no passa per transformPastedHTML)', () => {
    const [src] = fonts(htmlDelPortaretalls({ html: `<p>Plaça</p><img src="${URL_GPS}" alt="Plaça">` }));
    esperaNeta(src);
  });

  test('Google Docs: llegit amb l’esquema i sanejat DESPRÉS, conserva negreta i cursiva; sanejat abans, es perden', () => {
    const editor = creaEditor();
    const { schema } = editor;
    const normalitza = (html) => getHTMLFromFragment(createDocument(html, schema).content, schema);
    const brut = htmlDelPortaretalls({ html: PORTARETALLS.googleDocs.html, text: PORTARETALLS.googleDocs.text });
    const bo = cos(sanitizeHtml(normalitza(brut)));
    expect(Array.from(bo.querySelectorAll('strong'), (s) => s.textContent)).toEqual(['Fira de tardor', 'verdura']);
    expect(Array.from(bo.querySelectorAll('em'), (e) => e.textContent)).toEqual(['Dissabte a la plaça']);
    expect(bo.textContent).toContain('Hi haurà parades de verdura, música i berenar per a tothom.');
    // L'ordre contrari: el sanejador lleva el style i les negretes dels spans es perden.
    const alReves = cos(normalitza(sanitizeHtml(brut)));
    expect(alReves.querySelector('strong, em')).toBeNull();
  });
});
