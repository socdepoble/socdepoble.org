/* P0-58 (IDEA-189) · Enganxar i deixar anar als camps de la capçalera
   (títol h1, subtítol h2 i entradilla .lead) de la closca: text pla d'una
   línia, sense cap etiqueta ni imatge, pel camí d'onChange de sempre (A2, A3,
   comptadors i autodesament). Amb la prop opcional `onEnganxaDocument`, només
   el títol buit la crida. jsdom no té execCommand: el camí natiu se simula.
   Els porta-retalls de tests/helpers/portaretalls.js són SINTÈTICS. */
import React, { useState } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
import { EditableField, UniversalEditorShell } from './UniversalEditorShell.jsx';
import { PORTARETALLS, URL_PROVA_TANCADA } from '../../../tests/helpers/portaretalls.js';
import { dataOriginal, gpsTorre, jpegAmbExif } from '../../../tests/helpers/jpegProva.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete document.execCommand;
});

function aBase64(bytes) {
  let binari = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binari += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binari);
}
const URL_GPS = `data:image/jpeg;base64,${aBase64(jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() }))}`;

/* Un porta-retalls de mentida: getData(tipus), com el del navegador. */
const portaretalls = ({ html = '', text = '' } = {}) => ({
  getData: (tipus) => (tipus === 'text/html' ? html : tipus === 'text/plain' ? text : ''),
  types: [...(html ? ['text/html'] : []), ...(text ? ['text/plain'] : [])],
});
const enganxa = (camp, dades) => fireEvent.paste(camp, { clipboardData: portaretalls(dades) });

const closca = (props = {}) => render(
  <UniversalEditorShell id="d1" titleHtml="" subtitleHtml="" leadHtml="" {...props}>
    <div data-testid="cos" />
  </UniversalEditorShell>
);
const camp = (container, nom) => container.querySelector(`.editor-${nom}-input`);

describe('els tres camps: text pla d’una línia', () => {
  test('la captura (codi amb URL i negreta) al títol: onChange rep el text pla, una sola vegada', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange });
    const titol = camp(container, 'title');
    fireEvent.focus(titol);
    const esdeveniment = enganxa(titol, {
      html: `<p><code>${URL_PROVA_TANCADA}</code> <strong>x</strong></p>`,
      text: `${URL_PROVA_TANCADA} x`,
    });
    expect(esdeveniment).toBe(false);
    expect(onLocalChange).toHaveBeenCalledTimes(1);
    expect(onLocalChange).toHaveBeenLastCalledWith('title', `${URL_PROVA_TANCADA} x`, 'd1');
    expect(titol.querySelector('*')).toBeNull();
  });

  test('amb només HTML (captura de ChatGPT): sense <code>, <span>, <font> ni estils', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange });
    const entradilla = camp(container, 'lead');
    enganxa(entradilla, { html: '<p><span style="color:red"><font face="Arial">Hola</font></span> <code>món</code></p>' });
    expect(onLocalChange).toHaveBeenLastCalledWith('lead', 'Hola món', 'd1');
    enganxa(camp(container, 'subtitle'), { html: PORTARETALLS.captura.html });
    const [, valor] = onLocalChange.mock.lastCall;
    expect(valor).toBe(PORTARETALLS.captura.text);
    expect(valor).not.toMatch(/[<>]/);
  });

  test('un text amb salts i paràgrafs dona una sola línia als tres camps', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange });
    for (const nom of ['title', 'subtitle', 'lead']) {
      enganxa(camp(container, nom), { text: 'Primera línia\n\nSegona\r\nTercera\u2028quarta' });
      expect(onLocalChange).toHaveBeenLastCalledWith(nom, 'Primera línia Segona Tercera quarta', 'd1');
      expect(camp(container, nom).textContent).toBe('Primera línia Segona Tercera quarta');
    }
  });

  test('el Markdown del botó de copiar de ChatGPT entra sense marques', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange });
    enganxa(camp(container, 'subtitle'), { text: '## **Fira** de [tardor](https://socdepoble.org)' });
    expect(onLocalChange).toHaveBeenLastCalledWith('subtitle', 'Fira de tardor', 'd1');
  });

  test('C-02 · un títol que comença per un any, un apartat o un guió arriba sencer (a HEAD entrava tal qual)', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange });
    for (const text of ['2024. Un any per recordar', '1714. La caiguda de Barcelona', '3) Pressupost municipal', '- Avís important -']) {
      const titol = camp(container, 'title');
      titol.replaceChildren();
      enganxa(titol, { text });
      expect(onLocalChange).toHaveBeenLastCalledWith('title', text, 'd1');
    }
  });

  test('una foto data:image amb GPS no arriba mai a onChange: ni al títol ni a l’entradilla (es tanca la porta lateral de l’EXIF)', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange });
    for (const nom of ['title', 'lead']) {
      enganxa(camp(container, nom), { html: `<p>Foto <img src="${URL_GPS}" alt="casa"></p>` });
      expect(onLocalChange.mock.lastCall[1]).toBe('Foto');
      expect(camp(container, nom).querySelector('img')).toBeNull();
    }
    expect(JSON.stringify(onLocalChange.mock.calls)).not.toContain('data:image');
  });

  test('els controls i la direcció del text (U+202E) no entren', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange });
    enganxa(camp(container, 'title'), { text: 'Fira\u202E\u0007 gran' });
    expect(onLocalChange).toHaveBeenLastCalledWith('title', 'Fira gran', 'd1');
  });

  test('amb execCommand (navegador): l’escriu el navegador, d’una línia, i el onInput de sempre fa la resta', () => {
    const onLocalChange = vi.fn();
    const execCommand = vi.fn(() => true);
    document.execCommand = execCommand;
    const { container } = closca({ onLocalChange });
    const titol = camp(container, 'title');
    enganxa(titol, { text: 'Una\n\ndues' });
    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'Una dues');
    // El navegador dispara l'input: la closca no ho avisa dues vegades.
    expect(onLocalChange).not.toHaveBeenCalled();
    titol.append('Una dues');
    fireEvent.input(titol);
    expect(onLocalChange).toHaveBeenCalledTimes(1);
    expect(onLocalChange).toHaveBeenLastCalledWith('title', 'Una dues', 'd1');
  });

  test('sense clipboardData, el navegador fa el seu camí (no es cancel·la res)', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange });
    expect(fireEvent.paste(camp(container, 'title'))).toBe(true);
    expect(onLocalChange).not.toHaveBeenCalled();
  });
});

describe('contractes de sempre', () => {
  test('A2 · després d’enganxar, el valor que torna del pare no reescriu el node', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<EditableField html="" onChange={onChange} className="camp" />);
    const el = container.querySelector('.camp');
    fireEvent.focus(el);
    enganxa(el, { text: 'Hola' });
    expect(onChange).toHaveBeenLastCalledWith('Hola');
    const node = el.firstChild;
    rerender(<EditableField html="Hola" onChange={onChange} className="camp" />);
    expect(el.firstChild).toBe(node);
    // Un valor endarrerit tampoc no trepitja el que s'ha enganxat.
    rerender(<EditableField html="Ho" onChange={onChange} className="camp" />);
    expect(el.textContent).toBe('Hola');
  });

  test('A2 · s’enganxa al cursor, no al principi', () => {
    const onChange = vi.fn();
    const { container } = render(<EditableField html="Hola món" onChange={onChange} className="camp" />);
    const el = container.querySelector('.camp');
    fireEvent.focus(el);
    const rang = document.createRange();
    rang.setStart(el.firstChild, 4);
    rang.collapse(true);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(rang);
    enganxa(el, { html: '<b>,</b>' });
    expect(onChange).toHaveBeenLastCalledWith('Hola, món');
  });

  test('A3 · un porta-retalls d’espais (o només una imatge) no inserix res i el camp continua buit (:empty)', () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const { container } = render(<EditableField html="" onChange={onChange} onBlur={onBlur} className="camp" />);
    const el = container.querySelector('.camp');
    fireEvent.focus(el);
    for (const dades of [{ text: '   \n\t ' }, { html: '<p>&nbsp;</p>', text: '' }, { html: `<img src="${URL_GPS}">` }]) {
      expect(enganxa(el, dades)).toBe(false);
      expect(el.childNodes).toHaveLength(0);
    }
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(el);
    expect(onBlur).toHaveBeenLastCalledWith('');
    expect(el.childNodes).toHaveLength(0);
  });

  test('A3 · el que es TECLEJA continua igual (onInput): el <strong> i la <img> pròpia es conserven', () => {
    const onChange = vi.fn();
    const { container } = render(<EditableField html="" onChange={onChange} className="camp" />);
    const el = container.querySelector('.camp');
    fireEvent.focus(el);
    const negreta = document.createElement('strong');
    negreta.textContent = 'món';
    el.append('Hola ', negreta);
    fireEvent.input(el);
    expect(onChange).toHaveBeenLastCalledWith('Hola <strong>món</strong>');
  });

  test('l’autodesament: l’enganxat va per onLocalChange i, en eixir, per onSaveField (flush)', () => {
    vi.useFakeTimers();
    try {
      const onLocalChange = vi.fn();
      const onSaveField = vi.fn();
      const { container } = closca({ onLocalChange, onSaveField });
      const entradilla = camp(container, 'lead');
      fireEvent.focus(entradilla);
      enganxa(entradilla, { text: 'Del Mas de Baix' });
      expect(onSaveField).not.toHaveBeenCalled();
      vi.advanceTimersByTime(800);
      expect(onSaveField).toHaveBeenCalledWith('lead', 'Del Mas de Baix', 'd1');
    } finally {
      vi.useRealTimers();
    }
  });

  test('el comptador (avisosCamps, com el Perfil) es mou després d’enganxar', () => {
    function Pare() {
      const [lema, setLema] = useState('');
      const llargaria = [...lema].length;
      return (
        <UniversalEditorShell
          id="jo" titleHtml="Pep" subtitleHtml="" leadHtml={lema}
          onLocalChange={(camp_, valor) => { if (camp_ === 'lead') setLema(valor); }}
          avisosCamps={llargaria > 10 ? { lead: { comptador: { llargaria, maxim: 12 } } } : null}
        >
          <div />
        </UniversalEditorShell>
      );
    }
    const { container } = render(<Pare />);
    expect(container.querySelector('.sdp-avis-camp__comptador')).toBeNull();
    enganxa(camp(container, 'lead'), { html: '<p>Del Mas</p><p>de Baix</p>' });
    expect(container.querySelector('.sdp-avis-camp__comptador').textContent).toBe('Entradilla: 15 de 12 caràcters');
  });
});

describe('deixar anar', () => {
  test('un HTML deixat anar entra com a text pla d’una línia', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange });
    const titol = camp(container, 'title');
    const resultat = fireEvent.drop(titol, {
      dataTransfer: portaretalls({ html: `<p>Fira <code>gran</code></p><p><img src="${URL_GPS}"> nova</p>` }),
      clientX: 5, clientY: 5,
    });
    expect(resultat).toBe(false);
    expect(onLocalChange).toHaveBeenLastCalledWith('title', 'Fira gran nova', 'd1');
    expect(titol.querySelector('*')).toBeNull();
  });

  test('un arrossegament que naix dins del mateix camp és del navegador (no es toca)', () => {
    const onLocalChange = vi.fn();
    const { container } = closca({ onLocalChange, titleHtml: 'Hola món' });
    const titol = camp(container, 'title');
    fireEvent.dragStart(titol);
    expect(fireEvent.drop(titol, { dataTransfer: portaretalls({ text: 'món' }) })).toBe(true);
    expect(onLocalChange).not.toHaveBeenCalled();
    fireEvent.dragEnd(titol);
    expect(fireEvent.drop(titol, { dataTransfer: portaretalls({ text: '!' }) })).toBe(false);
    expect(onLocalChange).toHaveBeenCalledTimes(1);
  });

  test('sense dataTransfer, el navegador', () => {
    const { container } = closca({});
    expect(fireEvent.drop(camp(container, 'lead'))).toBe(true);
  });
});

describe('onEnganxaDocument (opt-in, només el títol)', () => {
  test('Llei del Píxel · sense la prop, el DOM és el mateix que amb ella, i cap camp porta atributs nous', () => {
    const senseProp = closca({ titleHtml: 'Títol' }).container.innerHTML;
    cleanup();
    const ambProp = closca({ titleHtml: 'Títol', onEnganxaDocument: () => null }).container.innerHTML;
    expect(ambProp).toBe(senseProp);
    cleanup();
    const { container } = closca({ titleHtml: 'Títol' });
    for (const nom of ['title', 'subtitle', 'lead']) {
      expect(camp(container, nom).getAttributeNames().sort()).toEqual(['class', 'contenteditable', 'data-placeholder']);
    }
    expect(container.querySelector('[onenganxadocument], [onenganxabloc]')).toBeNull();
  });

  test('només el títol buit la crida, amb { html, text }; el que torna (titol) entra d’una línia', () => {
    const onEnganxaDocument = vi.fn(() => ({ titol: 'Fira\n de  tardor' }));
    const onLocalChange = vi.fn();
    const { container } = closca({ onEnganxaDocument, onLocalChange });
    enganxa(camp(container, 'subtitle'), { text: 'A\n\nB' });
    enganxa(camp(container, 'lead'), { text: 'A\n\nB' });
    expect(onEnganxaDocument).not.toHaveBeenCalled();
    enganxa(camp(container, 'title'), { html: '<p>A</p><p>B</p>', text: 'A\n\nB' });
    expect(onEnganxaDocument).toHaveBeenCalledTimes(1);
    expect(onEnganxaDocument).toHaveBeenLastCalledWith({ html: '<p>A</p><p>B</p>', text: 'A\n\nB' });
    expect(onLocalChange).toHaveBeenLastCalledWith('title', 'Fira de tardor', 'd1');
  });

  test('amb el títol ple, no la crida: l’enganxat d’una línia', () => {
    const onEnganxaDocument = vi.fn(() => ({ titol: 'No' }));
    const onLocalChange = vi.fn();
    const { container } = closca({ onEnganxaDocument, onLocalChange, titleHtml: 'Ja' });
    enganxa(camp(container, 'title'), { text: ' i prou' });
    expect(onEnganxaDocument).not.toHaveBeenCalled();
    expect(onLocalChange).toHaveBeenLastCalledWith('title', 'Jai prou', 'd1');
  });

  test('null (o una excepció) vol dir l’enganxat d’una línia; { titol: \'\' } no inserix res', () => {
    const onLocalChange = vi.fn();
    const { container, unmount } = closca({ onEnganxaDocument: () => null, onLocalChange });
    enganxa(camp(container, 'title'), { text: 'Un\nbloc' });
    expect(onLocalChange).toHaveBeenLastCalledWith('title', 'Un bloc', 'd1');
    unmount();
    onLocalChange.mockClear();
    const peta = closca({ onEnganxaDocument: () => { throw new Error('motor'); }, onLocalChange });
    enganxa(camp(peta.container, 'title'), { text: 'Dos' });
    expect(onLocalChange).toHaveBeenLastCalledWith('title', 'Dos', 'd1');
    peta.unmount();
    onLocalChange.mockClear();
    const buit = closca({ onEnganxaDocument: () => ({ titol: '' }), onLocalChange });
    enganxa(camp(buit.container, 'title'), { text: 'Tot\n\nal cos' });
    expect(onLocalChange).not.toHaveBeenCalled();
    expect(camp(buit.container, 'title').childNodes).toHaveLength(0);
  });

  test('deixar anar no reparteix (només enganxar sobre l’H1, decisió 2)', () => {
    const onEnganxaDocument = vi.fn(() => ({ titol: 'No' }));
    const onLocalChange = vi.fn();
    const { container } = closca({ onEnganxaDocument, onLocalChange });
    fireEvent.drop(camp(container, 'title'), { dataTransfer: portaretalls({ text: 'A\n\nB' }) });
    expect(onEnganxaDocument).not.toHaveBeenCalled();
    expect(onLocalChange).toHaveBeenLastCalledWith('title', 'A B', 'd1');
  });
});
