/* El diàleg d'aprovació sobre el Dialeg de Pedra Seca. jsdom no té showModal
   (el Dialeg posa l'atribut `open`): a la SPA es comprova que el demana, el
   nom accessible, Escape (l'esdeveniment `cancel`) i el retorn del focus; la
   trampa de Tab i aria-modal es comproven encastat, dins de <soc-de-poble>. */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ErrorAprovacio } from './nucli/aprovacio.js';
import DialegAprovacio, { textError } from './DialegAprovacio.jsx';

afterEach(() => {
  cleanup();
  document.querySelectorAll('soc-de-poble').forEach((el) => el.remove());
  vi.restoreAllMocks();
  delete HTMLDialogElement.prototype.show;
  delete HTMLDialogElement.prototype.showModal;
});

const EMPREMTA = `sha256:a3f91c2b${'0'.repeat(56)}`;
const MANIFEST = {
  schema: 'sdp.tractor.v1', id: 'prova.lector', nom: 'Lector de prova', versio: '1.2.0',
  descripcio: 'Llig una carpeta de prova.', fitxa: 'src/sections/gestoria/fitxes/prova.md',
  fonts: ['src/sections/gestoria/nucli/lector.js'], llig: ['La carpeta'], escriu: ['Res'], xarxa: 'cap',
  dadesPersonals: false, nivellMinim: 'confirmacio', caducitatDies: 90
};
const SIGNATURA = { ...MANIFEST, nivellMinim: 'signatura' };

function Arnes({ onAprova = async () => {}, manifest = MANIFEST, webauthn = false, onTanca = () => {} }) {
  const [obert, setObert] = useState(false);
  const [n, setN] = useState(0);
  return (
    <>
      <button type="button" onClick={() => { setN((x) => x + 1); setObert(true); }}>Obri</button>
      <DialegAprovacio key={n} obert={obert} manifest={manifest} empremta={EMPREMTA} webauthn={webauthn}
        onTanca={(...args) => { onTanca(...args); setObert(false); }}
        onAprova={async (dades) => { await onAprova(dades); setObert(false); }} />
    </>
  );
}

function obri() {
  const boto = screen.getByRole('button', { name: 'Obri' });
  boto.focus();
  fireEvent.click(boto);
  return { boto, dialeg: screen.getByRole('dialog', { name: 'Aprova «Lector de prova»' }) };
}

const casella = (d) => within(d).getByRole('checkbox', { name: /He llegit la fitxa sencera/ });
const camp = (d) => within(d).getByRole('textbox', { name: /Escriu l’empremta curta/ });
const confirma = (d) => within(d).getByRole('button', { name: 'Aprova amb confirmació escrita' });

describe('a la SPA (<dialog> amb showModal)', () => {
  test('demana showModal, té nom i descripció, i Escape tanca i torna el focus al disparador', () => {
    const modal = vi.fn(function () { this.setAttribute('open', ''); });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: modal });
    const onTanca = vi.fn();
    render(<Arnes onTanca={onTanca} />);
    const { boto, dialeg } = obri();
    expect(modal).toHaveBeenCalledTimes(1);
    expect(dialeg.tagName).toBe('DIALOG');
    expect(dialeg.getAttribute('aria-describedby')).toBeTruthy();
    expect(within(dialeg).getByText(/Aproves la versió 1\.2\.0 amb l’empremta curta A3F9-1C2B/)).toBeTruthy();
    expect(within(dialeg).queryByRole('heading', { level: 1 })).toBeNull();

    const cancel = new Event('cancel', { cancelable: true });
    act(() => { dialeg.dispatchEvent(cancel); });
    expect(cancel.defaultPrevented).toBe(true);
    expect(onTanca).toHaveBeenCalledWith('esc');
    expect(dialeg.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(boto);
  });

  test('sense «He llegit la fitxa sencera» no es pot aprovar; amb la curta escrita, sí', async () => {
    const onAprova = vi.fn(async () => {});
    render(<Arnes onAprova={onAprova} />);
    const { dialeg } = obri();
    fireEvent.change(camp(dialeg), { target: { value: 'a3f9 1c2b' } });
    expect(confirma(dialeg).disabled).toBe(true);
    fireEvent.click(casella(dialeg));
    expect(confirma(dialeg).disabled).toBe(false);
    expect(within(dialeg).queryByRole('button', { name: /Signa amb Touch ID/ })).toBeNull();
    await act(async () => { fireEvent.click(confirma(dialeg)); });
    expect(onAprova).toHaveBeenCalledWith({ nivell: 'confirmacio', confirmacio: 'a3f9 1c2b' });
    expect(dialeg.hasAttribute('open')).toBe(false);
  });

  test('amb WebAuthn, la signatura és la via principal i envia el nivell «signatura»', async () => {
    const onAprova = vi.fn(async () => {});
    render(<Arnes onAprova={onAprova} webauthn />);
    const { dialeg } = obri();
    // El que diu de la signatura és exacte: el gest és teu, però un programa que controle el navegador podria registrar-hi una clau.
    const via = within(dialeg).getByRole('region', { name: 'Signatura' });
    expect(via.textContent).toMatch(/El gest de verificació el fas tu/);
    expect(via.textContent).toMatch(/podria registrar-hi una clau pròpia/);
    expect(via.textContent).not.toMatch(/Cap agent/);
    const signa = within(dialeg).getByRole('button', { name: 'Signa amb Touch ID o clau de pas' });
    expect(signa.disabled).toBe(true);
    fireEvent.click(casella(dialeg));
    expect(signa.className).toContain('sdp-boto--primari');
    expect(confirma(dialeg).className).toContain('sdp-boto--secundari');
    await act(async () => { fireEvent.click(signa); });
    expect(onAprova).toHaveBeenCalledWith({ nivell: 'signatura', confirmacio: undefined });
  });

  test('si el manifest exigix signatura, la confirmació escrita queda desactivada i ho explica', () => {
    render(<Arnes manifest={SIGNATURA} />);
    const { dialeg } = obri();
    fireEvent.click(casella(dialeg));
    expect(camp(dialeg).disabled).toBe(true);
    expect(confirma(dialeg).disabled).toBe(true);
    expect(within(dialeg).getByText('Este tractor exigix signatura: la confirmació escrita no hi val.')).toBeTruthy();
    expect(within(dialeg).getByText('Este navegador no pot signar')).toBeTruthy();
  });

  test('un error de la porta es mostra en valencià, amb el motiu, i el diàleg continua obert', async () => {
    const onAprova = vi.fn(async () => {
      throw new ErrorAprovacio('SIGNATURA_INVALIDA', 'La signatura no s\'ha completat: NotAllowedError');
    });
    render(<Arnes onAprova={onAprova} webauthn />);
    const { dialeg } = obri();
    fireEvent.click(casella(dialeg));
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: /Signa amb Touch ID/ })); });
    const alerta = within(dialeg).getByRole('alert');
    expect(alerta.textContent).toContain('La signatura no s’ha completat o no és vàlida.');
    expect(alerta.textContent).toContain('NotAllowedError');
    expect(dialeg.hasAttribute('open')).toBe(true);
  });

  test('mentre treballa no es tanca amb Escape; cada obertura comença neta', async () => {
    let allibera;
    const onAprova = vi.fn(() => new Promise((resol) => { allibera = resol; }));
    const onTanca = vi.fn();
    render(<Arnes onAprova={onAprova} onTanca={onTanca} />);
    let { dialeg } = obri();
    fireEvent.click(casella(dialeg));
    fireEvent.change(camp(dialeg), { target: { value: 'A3F9-1C2B' } });
    act(() => { fireEvent.click(confirma(dialeg)); });
    expect(within(dialeg).getByRole('button', { name: 'Treballant…' })).toBeTruthy();
    act(() => { dialeg.dispatchEvent(new Event('cancel', { cancelable: true })); });
    expect(onTanca).not.toHaveBeenCalled();
    await act(async () => { allibera(); });
    expect(dialeg.hasAttribute('open')).toBe(false);

    ({ dialeg } = obri());
    expect(casella(dialeg).checked).toBe(false);
    expect(camp(dialeg).value).toBe('');
  });
});

describe('encastat (<soc-de-poble>, capa local)', () => {
  function muntaLocal(element) {
    const host = document.createElement('soc-de-poble');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const root = document.createElement('div');
    root.className = 'sdp-root';
    shadow.append(root);
    const muntatge = document.createElement('div');
    root.append(muntatge);
    render(element, { container: muntatge, baseElement: root });
    return { shadow, root };
  }

  test('aria-modal, Tab cíclic dins del diàleg i Escape tanca', () => {
    const onTanca = vi.fn();
    const { shadow, root } = muntaLocal(
      <DialegAprovacio obert manifest={MANIFEST} empremta={EMPREMTA} onTanca={onTanca} onAprova={async () => {}} />
    );
    const dialeg = within(root).getByRole('dialog', { name: 'Aprova «Lector de prova»' });
    expect(dialeg.getAttribute('aria-modal')).toBe('true');
    const primer = within(dialeg).getByRole('button', { name: 'Tancar' });
    const ultim = within(dialeg).getByRole('button', { name: 'Cancel·la' });
    ultim.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    fireEvent(ultim, tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(shadow.activeElement).toBe(primer);
    fireEvent.keyDown(primer, { key: 'Tab', shiftKey: true });
    expect(shadow.activeElement).toBe(ultim);
    fireEvent.keyDown(ultim, { key: 'Escape' });
    expect(onTanca).toHaveBeenCalledWith('esc');
  });
});

describe('textError', () => {
  test.each([
    ['APROVACIO_REQUERIDA', /cap aprovació vigent/],
    ['EMPREMTA_DIVERGENT', /han canviat/],
    ['APROVACIO_CADUCADA', /caducat/],
    ['APROVACIO_REVOCADA', /revocada/],
    ['NIVELL_INSUFICIENT', /exigix la signatura/],
    ['SIGNATURA_INVALIDA', /signatura no s’ha completat/],
    ['CONFIRMACIO_INCORRECTA', /no coincidix/],
    ['EMPREMTA_INCOMPLETA', /Falten fitxers/],
    ['EMPREMTA_INVALIDA', /No s’ha pogut calcular/]
  ])('%s té un text clar', (codi, text) => {
    expect(textError({ codi, message: 'motiu tècnic' })).toEqual({ titol: expect.stringMatching(text), detall: 'motiu tècnic' });
  });

  test('un error desconegut o sense missatge no trenca', () => {
    expect(textError(new Error('x'))).toEqual({ titol: 'No s’ha pogut completar l’operació.', detall: 'x' });
    expect(textError(null)).toEqual({ titol: 'No s’ha pogut completar l’operació.', detall: '' });
  });
});
