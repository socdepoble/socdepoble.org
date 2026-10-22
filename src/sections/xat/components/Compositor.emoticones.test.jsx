/* Pla 261022_1425 (emojis grans i paritat WhatsApp) · La carona del
   compositor i el calaix d'emoticones: l'emoticona entra on era el cursor (o
   en lloc del tros seleccionat) i el cursor queda darrere; en ample el focus
   torna al camp i el calaix seguix obert, en estret el calaix fa de teclat;
   es tanca amb Escape (abans que la resposta), clicant fora i en enviar. */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { buidaRecents } from '../emoticonesXat.js';
import Compositor, { LIMIT_TEXT } from './Compositor.jsx';

/* El catàleg de veres pesa 292 kB: ací, dues famílies sintètiques. */
vi.mock('../../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({
    GRUPS_EMOJIS: [
      { id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] },
      { id: 'menjar-beguda', nom: 'Menjar', emojis: [['1F345', '🍅', 'tomato']] }
    ]
  })
}));

afterEach(() => { cleanup(); buidaRecents(); });

const t = (_, alternativa) => alternativa;

function Prova({ inicial = '', mida = 'ample', ...props }) {
  const [valor, setValor] = useState(inicial);
  return (
    <AppGridContext.Provider value={{ mida, setPanellObert: vi.fn() }}>
      <Compositor valor={valor} onCanvia={setValor} onEnvia={vi.fn()} t={t} {...props} />
      <button type="button" onClick={() => setValor('Nou text')}>Fora</button>
    </AppGridContext.Provider>
  );
}

const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const carona = () => screen.getByRole('button', { name: 'Emoticones' });
const calaix = () => screen.queryByRole('dialog', { name: 'Emoticones' });
/* Obri amb el ratolí (detail 1) o amb el teclat (detail 0) i espera el catàleg. */
async function obri({ perTeclat = false } = {}) {
  fireEvent.click(carona(), { detail: perTeclat ? 0 : 1 });
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(3));
}
const cursor = (inici, fi = inici) => { camp().focus(); camp().setSelectionRange(inici, fi); };

describe('la carona', () => {
  test('a l’esquerra del camp, tancada: aria-expanded, aria-haspopup i sense aria-controls', () => {
    render(<Prova />);
    const boto = carona();
    expect(boto.getAttribute('aria-expanded')).toBe('false');
    expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
    expect(boto.hasAttribute('aria-controls')).toBe(false);
    expect(boto.compareDocumentPosition(camp()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(boto.querySelector('svg.lucide-face-slightly-smiling')).toBeTruthy();
    expect(calaix()).toBeNull();
  });

  test('oberta amb el ratolí en ample: el calaix (amb el seu id) i el focus es queda al camp', async () => {
    render(<Prova />);
    camp().focus();
    expect(fireEvent.mouseDown(carona())).toBe(false);
    await obri();
    expect(carona().getAttribute('aria-expanded')).toBe('true');
    expect(carona().getAttribute('aria-controls')).toBe('xat-message-emoticones');
    expect(calaix().id).toBe('xat-message-emoticones');
    expect(document.activeElement).toBe(camp());
  });

  test('oberta amb el teclat: el focus entra a la pestanya activa', async () => {
    render(<Prova />);
    await obri({ perTeclat: true });
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Del poble' }));
  });

  test('amb el camp desactivat, la carona també', () => {
    render(<Prova desactivat />);
    expect(carona().disabled).toBe(true);
  });

  test('el campRef de Conversa continua rebent el textarea', () => {
    const ref = { current: null };
    render(<Prova campRef={ref} />);
    expect(ref.current).toBe(camp());
  });
});

describe('inserció al cursor (ample)', () => {
  test('entra on és el cursor, el cursor queda darrere, el focus al camp i el calaix obert', async () => {
    render(<Prova inicial="Bon dia" />);
    await obri();
    cursor(3);
    fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
    expect(camp().value).toBe('Bon🍅 dia');
    expect(camp().selectionStart).toBe(5);
    expect(camp().selectionEnd).toBe(5);
    expect(document.activeElement).toBe(camp());
    expect(calaix()).toBeTruthy();
    // La segona va darrere de la primera.
    fireEvent.click(screen.getByRole('button', { name: 'bell' }));
    expect(camp().value).toBe('Bon🍅🔔 dia');
    expect(camp().selectionStart).toBe(7);
  });

  test('un tros seleccionat se’n va', async () => {
    render(<Prova inicial="Bon dia" />);
    await obri();
    cursor(0, 3);
    fireEvent.click(screen.getByRole('button', { name: 'waving hand' }));
    expect(camp().value).toBe('👋 dia');
    expect(camp().selectionStart).toBe(2);
  });

  test('si el camp ha perdut el focus, es recorda on era el cursor', async () => {
    render(<Prova inicial="Bon dia" />);
    cursor(4);
    screen.getByRole('button', { name: 'Fora' }).focus();
    await obri();
    fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
    expect(camp().value).toBe('Bon 🍅dia');
    expect(camp().selectionStart).toBe(6);
    expect(document.activeElement).toBe(camp());
  });

  test('sense cap cursor conegut, al final; i si el text canvia de fora, la posició vella s’oblida', async () => {
    render(<Prova inicial="Hola" />);
    await obri();
    fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
    expect(camp().value).toBe('Hola🍅');
    // El cursor a la posició 1 i el camp desenfocat: es recordaria...
    cursor(1);
    const fora = screen.getByRole('button', { name: 'Fora' });
    fora.focus();
    // ...però el text canvia de fora (enviar, l’esborrany d’un altre fil): ja no val.
    fireEvent.click(fora);
    expect(camp().value).toBe('Nou text');
    expect(calaix()).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'bell' }));
    expect(camp().value).toBe('Nou text🔔');
  });

  test('si passaria del límit, no entra', async () => {
    const ple = 'a'.repeat(LIMIT_TEXT - 1);
    render(<Prova inicial={ple} />);
    await obri();
    cursor(0);
    fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
    expect(camp().value).toBe(ple);
  });
});

describe('tancament', () => {
  test('Escape al calaix el tanca i torna al camp; el primer Escape del camp és del calaix, el segon cancel·la la resposta', async () => {
    const onEscapa = vi.fn();
    render(<Prova onEscapa={onEscapa} />);
    await obri({ perTeclat: true });
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(calaix()).toBeNull();
    expect(document.activeElement).toBe(camp());
    expect(onEscapa).not.toHaveBeenCalled();
    await obri();
    camp().focus();
    expect(fireEvent.keyDown(camp(), { key: 'Escape' })).toBe(false);
    expect(calaix()).toBeNull();
    expect(onEscapa).not.toHaveBeenCalled();
    fireEvent.keyDown(camp(), { key: 'Escape' });
    expect(onEscapa).toHaveBeenCalledTimes(1);
  });

  test('clicar fora del compositor el tanca sense moure el focus; clicar el camp, no', async () => {
    render(<Prova />);
    await obri();
    fireEvent.pointerDown(camp());
    expect(calaix()).toBeTruthy();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Fora' }));
    expect(calaix()).toBeNull();
    expect(carona().getAttribute('aria-expanded')).toBe('false');
  });

  test('la carona el torna a tancar i deixa el focus al camp', async () => {
    render(<Prova />);
    await obri();
    fireEvent.click(carona(), { detail: 1 });
    expect(calaix()).toBeNull();
    expect(document.activeElement).toBe(camp());
  });

  test('enviar (Retorn o el botó) el tanca; amb el camp buit no s’envia res i el calaix seguix', async () => {
    const onEnvia = vi.fn();
    render(<Prova onEnvia={onEnvia} />);
    await obri();
    fireEvent.keyDown(camp(), { key: 'Enter' });
    expect(onEnvia).not.toHaveBeenCalled();
    expect(calaix()).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
    fireEvent.keyDown(camp(), { key: 'Enter' });
    expect(onEnvia).toHaveBeenCalledTimes(1);
    expect(calaix()).toBeNull();
    await obri();
    fireEvent.click(screen.getByRole('button', { name: 'Envia' }));
    expect(onEnvia).toHaveBeenCalledTimes(2);
    expect(calaix()).toBeNull();
  });
});

describe('estret (el calaix fa de teclat, com a WhatsApp al mòbil)', () => {
  test('en obrir, el focus entra al calaix (s’amaga el teclat de la pantalla) i la carona es torna teclat', async () => {
    render(<Prova mida="estret" inicial="Bon dia" />);
    cursor(3);
    await obri();
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Del poble' }));
    expect(carona().querySelector('svg.lucide-keyboard')).toBeTruthy();
    expect(screen.getByRole('dialog').classList.contains('sdp-xat-emojis--estret')).toBe(true);
  });

  test('l’emoticona entra on era el cursor, sense tornar el focus al camp; dues seguides, en ordre', async () => {
    render(<Prova mida="estret" inicial="Bon dia" />);
    cursor(3);
    await obri();
    fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
    fireEvent.click(screen.getByRole('button', { name: 'bell' }));
    expect(camp().value).toBe('Bon🍅🔔 dia');
    expect(document.activeElement).not.toBe(camp());
    expect(calaix()).toBeTruthy();
    // Tornar al teclat amb la carona deixa el cursor darrere de l’última, no al final.
    fireEvent.click(carona(), { detail: 1 });
    expect(document.activeElement).toBe(camp());
    expect(camp().selectionStart).toBe(7);
    expect(camp().selectionEnd).toBe(7);
  });

  test('tocar el camp tanca el calaix; la carona-teclat també, i torna al camp', async () => {
    render(<Prova mida="estret" />);
    await obri();
    act(() => camp().focus());
    expect(calaix()).toBeNull();
    await obri();
    fireEvent.click(carona(), { detail: 1 });
    expect(calaix()).toBeNull();
    expect(document.activeElement).toBe(camp());
    expect(carona().querySelector('svg.lucide-face-slightly-smiling')).toBeTruthy();
  });
});

/* Revisió adversarial del torn (workflow de subagents, 261022): les troballes
   confirmades, cadascuna amb la seua prova. */
describe('revisió adversarial', () => {
  test('amb el teclat dins del calaix, triar no se’n du el focus al camp (un segon Retorn no envia) i un avís en viu diu què s’ha afegit', async () => {
    const onEnvia = vi.fn();
    render(<Prova inicial="Bon dia" onEnvia={onEnvia} />);
    await obri({ perTeclat: true });
    const cor = screen.getByRole('button', { name: 'red heart' });
    cor.focus();
    fireEvent.click(cor);
    expect(camp().value).toBe('Bon dia❤️');
    expect(document.activeElement).toBe(cor);
    expect(screen.getByRole('status').textContent).toBe('Afegida: red heart');
    // Retorn sobre el botó torna a posar l’emoticona; no envia el missatge.
    fireEvent.click(cor);
    expect(camp().value).toBe('Bon dia❤️❤️');
    expect(onEnvia).not.toHaveBeenCalled();
    // Dues iguals seguides també s’anuncien (el text canvia).
    expect(screen.getByRole('status').textContent).toBe('Afegida: red heart ');
  });

  test('obrir amb el ratolí en ample porta el focus al camp (com a WhatsApp Web) i Escape tanca', async () => {
    render(<Prova inicial="Hola" />);
    screen.getByRole('button', { name: 'Fora' }).focus();
    await obri();
    expect(document.activeElement).toBe(camp());
    fireEvent.keyDown(camp(), { key: 'Escape' });
    expect(calaix()).toBeNull();
  });

  test('Escape amb el focus a la carona (o al botó d’enviar) també tanca el calaix i torna al camp', async () => {
    const onEscapa = vi.fn();
    render(<Prova onEscapa={onEscapa} />);
    await obri({ perTeclat: true });
    carona().focus();
    expect(fireEvent.keyDown(carona(), { key: 'Escape' })).toBe(false);
    expect(calaix()).toBeNull();
    expect(document.activeElement).toBe(camp());
    expect(onEscapa).not.toHaveBeenCalled();
  });

  test('tancar amb el focus ja al camp no mou el cursor (la selecció recordada pot ser vella)', async () => {
    render(<Prova inicial="Hola dia" />);
    await obri();
    fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
    expect(camp().value).toBe('Hola dia🍅');
    // La persona torna el cursor a la posició 2 sense escriure.
    camp().setSelectionRange(2, 2);
    fireEvent.keyDown(camp(), { key: 'Escape' });
    expect(calaix()).toBeNull();
    expect(camp().selectionStart).toBe(2);
  });

  test('una emoticona que no hi cap (límit) no va a les recents', async () => {
    render(<Prova inicial={'a'.repeat(LIMIT_TEXT - 1)} />);
    await obri();
    fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
    fireEvent.click(carona(), { detail: 1 });
    await obri();
    expect(screen.queryByRole('list', { name: 'Recents' })).toBeNull();
  });

  test('amb el calaix obert el compositor porta --emojis (puja damunt de «Baixa al final»)', async () => {
    render(<Prova />);
    const form = camp().closest('form');
    expect(form.classList.contains('sdp-xat-compositor--emojis')).toBe(false);
    await obri();
    expect(form.classList.contains('sdp-xat-compositor--emojis')).toBe(true);
    fireEvent.click(carona(), { detail: 1 });
    expect(form.classList.contains('sdp-xat-compositor--emojis')).toBe(false);
  });

  test('una tauleta tàctil en ample fa el flux de mòbil: el focus entra al calaix i triar no obri el teclat', async () => {
    const abans = globalThis.matchMedia;
    globalThis.matchMedia = (consulta) => ({ matches: consulta === '(hover: none) and (pointer: coarse)', media: consulta, addEventListener() {}, removeEventListener() {} });
    try {
      render(<Prova inicial="Hola" />);
      cursor(4);
      expect(fireEvent.mouseDown(carona())).toBe(true);
      await obri();
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Del poble' }));
      expect(carona().querySelector('svg.lucide-keyboard')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
      expect(camp().value).toBe('Hola🍅');
      expect(document.activeElement).not.toBe(camp());
      // El calaix és el d’ample (l’alçada la decidix la mida, no el tacte).
      expect(calaix().classList.contains('sdp-xat-emojis--estret')).toBe(false);
    } finally {
      globalThis.matchMedia = abans;
    }
  });

  test('encastat en una arrel d’ombra: un clic al web amfitrió tanca el calaix; un clic dins del giny fora del compositor també', async () => {
    const amfitrio = document.createElement('div');
    const pagina = document.createElement('p');
    document.body.append(amfitrio, pagina);
    const arrel = amfitrio.attachShadow({ mode: 'open' });
    const contenidor = document.createElement('div');
    arrel.appendChild(contenidor);
    try {
      render(<Prova />, { container: contenidor });
      const dins = (rol, nom) => within(contenidor).getByRole(rol, { name: nom });
      fireEvent.click(dins('button', 'Emoticones'), { detail: 1 });
      await waitFor(() => expect(within(contenidor).getAllByRole('tab')).toHaveLength(3));
      fireEvent.pointerDown(pagina);
      expect(within(contenidor).queryByRole('dialog')).toBeNull();
      fireEvent.click(dins('button', 'Emoticones'), { detail: 1 });
      await waitFor(() => expect(within(contenidor).getAllByRole('tab')).toHaveLength(3));
      fireEvent.pointerDown(dins('textbox', 'Escriu un missatge'));
      expect(within(contenidor).queryByRole('dialog')).toBeTruthy();
      fireEvent.pointerDown(dins('button', 'Fora'));
      expect(within(contenidor).queryByRole('dialog')).toBeNull();
    } finally {
      amfitrio.remove();
      pagina.remove();
    }
  });

  test('l’alçada del calaix no passa de l’espai fins a la llista de missatges (la capçalera no es tapa)', async () => {
    render(
      <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
        <div className="sdp-xat-conversa">
          <ol className="sdp-xat-missatges" />
          <Prova />
        </div>
      </AppGridContext.Provider>
    );
    const llista = document.querySelector('.sdp-xat-missatges');
    llista.getBoundingClientRect = () => ({ top: 300, bottom: 480, left: 0, right: 400, width: 400, height: 180 });
    const proto = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function caixa() {
      if (this.id === 'xat-message-emoticones') return { top: 180, bottom: 500, left: 8, right: 368, width: 360, height: 320 };
      return proto.call(this);
    };
    try {
      await obri();
      expect(calaix().style.maxBlockSize).toBe('200px');
      // Amb poc espai, mai per davall de les pestanyes i una fila.
      llista.getBoundingClientRect = () => ({ top: 450, bottom: 480, left: 0, right: 400, width: 400, height: 30 });
      act(() => { window.dispatchEvent(new Event('resize')); });
      expect(calaix().style.maxBlockSize).toBe('112px');
      // Amb espai de sobra, mana el CSS.
      llista.getBoundingClientRect = () => ({ top: 0, bottom: 480, left: 0, right: 400, width: 400, height: 480 });
      act(() => { window.dispatchEvent(new Event('resize')); });
      expect(calaix().style.maxBlockSize).toBe('');
    } finally {
      HTMLElement.prototype.getBoundingClientRect = proto;
    }
  });
});
