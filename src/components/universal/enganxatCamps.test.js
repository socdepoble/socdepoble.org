/* P0-58 (IDEA-189) · El text pla dels camps de la capçalera (títol,
   subtítol i entradilla): enganxatCamps.js. Els porta-retalls de
   tests/helpers/portaretalls.js són SINTÈTICS (escrits a mà, no capturats). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { inserixTextAlCursor, normalitzaText, textPlaDelPortaretalls, unaLinia } from './enganxatCamps.js';
import { ORIGEN_SINTETIC, PORTARETALLS, URL_PROVA_TANCADA } from '../../../tests/helpers/portaretalls.js';

const H1 = 'h1';

afterEach(() => {
  vi.restoreAllMocks();
  delete document.execCommand;
  delete document.caretRangeFromPoint;
  delete document.caretPositionFromPoint;
  document.body.replaceChildren();
});

describe('textPlaDelPortaretalls', () => {
  test('les fixtures que fa servir són sintètiques', () => {
    for (const nom of ['captura', 'chatgptSeleccio', 'chatgptBotoCopiar', 'googleDocs', 'word']) {
      expect(PORTARETALLS[nom].origen).toBe(ORIGEN_SINTETIC);
    }
  });

  test('preferix text/plain encara que hi haja HTML', () => {
    expect(textPlaDelPortaretalls({ html: '<p><code>brossa</code></p>', text: 'Text pla' })).toBe('Text pla');
    expect(textPlaDelPortaretalls(PORTARETALLS.captura)).toBe(PORTARETALLS.captura.text);
  });

  test('un text/plain amb forma de Markdown (botó de copiar de ChatGPT) perd les marques', () => {
    const text = textPlaDelPortaretalls(PORTARETALLS.chatgptBotoCopiar);
    expect(text.split('\n')[0]).toBe('Com instal·lar l’app');
    expect(text).toContain(`Primer, apunta’t a la prova tancada: ${URL_PROVA_TANCADA}.`);
    expect(text).not.toMatch(/[#*`]|\]\(/);
  });

  /* C-02 · A HEAD el navegador hi posava el text tal qual: una línia que
     comença per un any, un apartat o un guió no perd res. */
  test.each(['2024. Un any per recordar', '1714. La caiguda de Barcelona', '3) Pressupost municipal', '- Avís important -'])(
    'C-02 · una sola línia %j es queda sencera, amb HTML o sense',
    (text) => {
      expect(textPlaDelPortaretalls({ text })).toBe(text);
      expect(textPlaDelPortaretalls({ html: `<p>${text}</p>`, text })).toBe(text);
    },
  );

  test('C-02 · amb HTML, una sola línia amb marques és el text visible de la font i es queda; sense HTML (botó de copiar), perd les marques', () => {
    expect(textPlaDelPortaretalls({ html: '<p># Pla de festes</p>', text: '# Pla de festes' })).toBe('# Pla de festes');
    expect(textPlaDelPortaretalls({ text: '# Pla de festes' })).toBe('Pla de festes');
    expect(textPlaDelPortaretalls({ html: '<h2>Pla</h2><ul><li>pa</li><li>vi</li></ul>', text: '## Pla\n- pa\n- vi' })).toBe('Pla\npa\nvi');
    expect(textPlaDelPortaretalls({ text: '# Història\n1714. La caiguda de Barcelona' })).toBe('Història\n1714. La caiguda de Barcelona');
  });

  test('un text sense marques es queda com és (WhatsApp: *x* no és cap bloc)', () => {
    expect(textPlaDelPortaretalls(PORTARETALLS.whatsappWeb)).toBe(PORTARETALLS.whatsappWeb.text);
  });

  test('amb només HTML: el text visible, sense <style>, <script>, <template> ni <head>, i cada bloc en una línia', () => {
    const html = '<html><head><title>Fora</title><style>p{color:red}</style></head><body>'
      + '<script>alert(1)</script><p>Primer <span style="font-weight:700">paràgraf</span></p>'
      + `<template><p>Amagat</p></template><${H1}>Títol</${H1}><div>Línia<br>partida</div>`
      + '<ul><li>u</li><li>dos</li></ul><noscript>tampoc</noscript></body></html>';
    expect(textPlaDelPortaretalls({ html })).toBe('Primer paràgraf\nTítol\nLínia\npartida\nu\ndos');
  });

  test('amb només HTML: cap imatge (ni el seu alt) i els espais del codi font col·lapsats; el <pre> conserva els salts', () => {
    const html = '<p>Foto:\n   <img src="data:image/jpeg;base64,AAAA" alt="casa"> ací</p><pre>a\n  b</pre>';
    expect(textPlaDelPortaretalls({ html, text: '' })).toBe('Foto: ací\na\nb');
  });

  test('Word i Google Docs (només HTML): sense estils, comentaris ni etiquetes d’Office', () => {
    const word = textPlaDelPortaretalls({ html: PORTARETALLS.word.html });
    expect(word.split('\n').map(unaLinia)).toEqual(['Assemblea de veïns', 'Dijous a les 19 h, a la sala gran.', '· Pressupost', 'Ordre del dia']);
    expect(textPlaDelPortaretalls({ html: PORTARETALLS.googleDocs.html }).split('\n'))
      .toEqual(['Fira de tardor', 'Dissabte a la plaça', 'Hi haurà parades de verdura, música i berenar per a tothom.']);
  });

  test('normalitza els salts (\\r\\n, \\r, U+2028, U+2029) i l’espai dur; lleva els controls C0 i els de direcció', () => {
    expect(textPlaDelPortaretalls({ text: 'a\r\nb\rc\u2028d\u2029e' })).toBe('a\nb\nc\nd\ne');
    expect(textPlaDelPortaretalls({ text: 'a\u00A0b' })).toBe('a b');
    expect(textPlaDelPortaretalls({ text: 'ad\u202Emin\u0000\u0007\u001B\u007F\u202A\u2066\u2069x' })).toBe('adminx');
    expect(textPlaDelPortaretalls({ html: '<p>&nbsp;Hola\u202E&nbsp;món</p>' })).toBe('Hola món');
  });

  test('sense res, cadena buida', () => {
    expect(textPlaDelPortaretalls()).toBe('');
    expect(textPlaDelPortaretalls({ html: '', text: '   ' })).toBe('');
    expect(textPlaDelPortaretalls({ html: '<p> </p><img src="x.png">' })).toBe('');
    expect(textPlaDelPortaretalls({ html: null, text: null })).toBe('');
  });
});

describe('normalitzaText i unaLinia', () => {
  test('normalitzaText conserva les línies i el tabulador', () => {
    expect(normalitzaText('a\tb\r\nc')).toBe('a\tb\nc');
    expect(normalitzaText(undefined)).toBe('');
  });

  test('unaLinia col·lapsa salts, tabuladors i espais durs, i retalla les vores', () => {
    expect(unaLinia('  Hola\n\nmón\t de\u00A0 tots  ')).toBe('Hola món de tots');
    expect(unaLinia('\n \t ')).toBe('');
    expect(unaLinia(null)).toBe('');
  });
});

/* Un camp de prova (contenteditable) dins del document, amb text i el cursor on diga `cursor`. */
function campAmb(text, cursor = null) {
  const camp = document.createElement('span');
  camp.setAttribute('contenteditable', 'true');
  if (text) camp.append(document.createTextNode(text));
  document.body.append(camp);
  if (cursor !== null) {
    const rang = document.createRange();
    rang.setStart(camp.firstChild, cursor);
    rang.collapse(true);
    const seleccio = window.getSelection();
    seleccio.removeAllRanges();
    seleccio.addRange(rang);
  }
  return camp;
}
const cursorDarrereDe = (node) => {
  const rang = window.getSelection().getRangeAt(0);
  return rang.collapsed && rang.startContainer === node.parentNode
    && rang.startOffset === Array.prototype.indexOf.call(node.parentNode.childNodes, node) + 1;
};

describe('inserixTextAlCursor', () => {
  test('jsdom no té execCommand: les proves cobrixen els dos camins', () => {
    expect(typeof document.execCommand).not.toBe('function');
  });

  test('amb execCommand: el navegador l’escriu (desfer natiu i input) i torna «natiu» sense tocar el DOM', () => {
    const execCommand = vi.fn(() => true);
    document.execCommand = execCommand;
    const camp = campAmb('Hola món', 4);
    expect(inserixTextAlCursor(camp, 'XYZ')).toBe('natiu');
    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'XYZ');
    expect(camp.textContent).toBe('Hola món');
  });

  test('sense execCommand: «manual», al lloc del cursor i amb el cursor darrere', () => {
    const camp = campAmb('Hola món', 4);
    expect(inserixTextAlCursor(camp, 'XYZ')).toBe('manual');
    expect(camp.textContent).toBe('HolaXYZ món');
    const inserit = [...camp.childNodes].find((n) => n.data === 'XYZ');
    expect(inserit).toBeTruthy();
    expect(cursorDarrereDe(inserit)).toBe(true);
  });

  test('si execCommand no ho fa (false) o peta, el camí manual', () => {
    document.execCommand = vi.fn(() => false);
    const camp = campAmb('ab', 1);
    expect(inserixTextAlCursor(camp, '-')).toBe('manual');
    expect(camp.textContent).toBe('a-b');
    document.execCommand = vi.fn(() => { throw new Error('no'); });
    expect(inserixTextAlCursor(camp, '+')).toBe('manual');
    expect(camp.textContent).toBe('a-+b');
  });

  test('amb una selecció, la substituïx', () => {
    const camp = campAmb('Hola món');
    const rang = document.createRange();
    rang.setStart(camp.firstChild, 5);
    rang.setEnd(camp.firstChild, 8);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(rang);
    expect(inserixTextAlCursor(camp, 'poble')).toBe('manual');
    expect(camp.textContent).toBe('Hola poble');
  });

  test('amb la selecció fora del camp, inserix al final', () => {
    const fora = document.createElement('p');
    fora.append('fora');
    document.body.append(fora);
    const camp = campAmb('Hola');
    const rang = document.createRange();
    rang.setStart(fora.firstChild, 2);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(rang);
    expect(inserixTextAlCursor(camp, ' món')).toBe('manual');
    expect(camp.textContent).toBe('Hola món');
    expect(fora.textContent).toBe('fora');
  });

  test('en un camp buit, també', () => {
    const camp = campAmb('');
    window.getSelection().removeAllRanges();
    expect(inserixTextAlCursor(camp, 'Nou')).toBe('manual');
    expect(camp.textContent).toBe('Nou');
  });

  test('deixar anar: el punt del ratolí (caretRangeFromPoint o caretPositionFromPoint) mana si cau dins del camp', () => {
    const camp = campAmb('Hola món', 0);
    document.caretRangeFromPoint = vi.fn(() => {
      const rang = document.createRange();
      rang.setStart(camp.firstChild, 4);
      return rang;
    });
    expect(inserixTextAlCursor(camp, '!', { x: 10, y: 20 })).toBe('manual');
    expect(document.caretRangeFromPoint).toHaveBeenCalledWith(10, 20);
    expect(camp.textContent).toBe('Hola! món');
    delete document.caretRangeFromPoint;
    document.caretPositionFromPoint = vi.fn(() => ({ offsetNode: camp.lastChild, offset: 1 }));
    expect(inserixTextAlCursor(camp, '?', { x: 1, y: 2 })).toBe('manual');
    expect(camp.textContent).toBe('Hola! ?món');
  });

  test('deixar anar fora del camp (el punt cau en un altre node): al cursor o al final', () => {
    const fora = document.createElement('p');
    fora.append('fora');
    document.body.append(fora);
    const camp = campAmb('Hola');
    window.getSelection().removeAllRanges();
    document.caretPositionFromPoint = vi.fn(() => ({ offsetNode: fora.firstChild, offset: 1 }));
    expect(inserixTextAlCursor(camp, ' món', { x: 1, y: 2 })).toBe('manual');
    expect(camp.textContent).toBe('Hola món');
    expect(fora.textContent).toBe('fora');
  });

  test('sense text o sense camp, null i res canvia', () => {
    const camp = campAmb('Hola', 4);
    expect(inserixTextAlCursor(camp, '')).toBeNull();
    expect(inserixTextAlCursor(null, 'x')).toBeNull();
    expect(inserixTextAlCursor(camp, 42)).toBeNull();
    expect(camp.textContent).toBe('Hola');
  });

  test('inserix TEXT, mai HTML', () => {
    const camp = campAmb('', null);
    expect(inserixTextAlCursor(camp, '<img src=x onerror=alert(1)><b>x</b>')).toBe('manual');
    expect(camp.querySelector('*')).toBeNull();
    expect(camp.textContent).toBe('<img src=x onerror=alert(1)><b>x</b>');
  });
});

describe('Baseline (Safari 16 / Chrome 100 / Firefox 100) i porta innerHTML', () => {
  const font = readFileSync(path.join(process.cwd(), 'src/components/universal/enganxatCamps.js'), 'utf8');

  test('cap lookbehind, cap URL.canParse, cap plaintext-only, cap assignació d’innerHTML', () => {
    expect(font).not.toContain('(?<');
    expect(font).not.toContain('canParse');
    expect(font).not.toContain('plaintext-only');
    expect(font).not.toMatch(/innerHTML\s*=|outerHTML|insertAdjacentHTML/);
  });

  test('cap expressió regular amb la bandera «v» ni amb lookbehind, i cap new RegExp', () => {
    const expressions = [];
    const recorre = (node) => {
      if (!node || typeof node.type !== 'string') return;
      if (node.type === 'RegExpLiteral') expressions.push(node);
      for (const valor of Object.values(node)) {
        if (Array.isArray(valor)) valor.forEach(recorre);
        else if (valor && typeof valor === 'object') recorre(valor);
      }
    };
    recorre(parse(font, { sourceType: 'module' }).program);
    expect(expressions.length).toBeGreaterThan(0);
    for (const { pattern, flags } of expressions) {
      expect(flags, pattern).not.toContain('v');
      expect(pattern).not.toMatch(/\(\?<[=!]/);
    }
    expect(font).not.toMatch(/new RegExp\(/);
  });

  test('ReDoS: 50.000 caràcters patològics en menys de 50 ms', () => {
    for (const tros of ['\n', ' ', '\t', '<', '<p>', '\u2028', '\u202E', '&nbsp;']) {
      const entrada = tros.repeat(50000);
      const inici = performance.now();
      unaLinia(textPlaDelPortaretalls({ text: entrada }));
      normalitzaText(entrada);
      expect(performance.now() - inici, JSON.stringify(tros)).toBeLessThan(50);
    }
  });
});
