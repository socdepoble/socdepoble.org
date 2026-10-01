/* Ordre del Mestre, 261001 · «Botó de Pantalla Completa al Calendari».
   PantallaCompleta és un Dialeg de mida 'completa' i sense marc. Tancada no
   afig cap node (Llei del Píxel); oberta, la franja amb «Eixir» va primer i
   els fills es munten quan el <dialog> ja és obert. jsdom no té showModal ni
   show: el Dialeg posa l'atribut `open`, o la prova els simula. */
import { StrictMode, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { BotoPantallaCompleta, PantallaCompleta } from './PantallaCompleta.jsx';
import { usePantallaCompleta } from '../hooks/usePantallaCompleta.js';

afterEach(() => {
  cleanup();
  document.querySelectorAll('soc-de-poble').forEach((el) => el.remove());
  vi.restoreAllMocks();
  delete HTMLDialogElement.prototype.show;
  delete HTMLDialogElement.prototype.showModal;
});

const Fills = () => <><p className="fill">Contingut</p><button type="button">Acció del fill</button></>;
const NOM_EIXIR = 'Eixir de la pantalla completa';

test('tancada: els fills tal qual, sense cap node propi ni cap <dialog>', () => {
  const sols = render(<div><Fills /></div>).container.innerHTML;
  cleanup();
  const { container } = render(<div><PantallaCompleta oberta={false} titol="Prova"><Fills /></PantallaCompleta></div>);
  expect(container.innerHTML).toBe(sols);
  expect(container.querySelector('dialog')).toBeNull();
});

test('oberta: un diàleg amb nom, la franja primer, els fills quan ja és obert i el focus a «Eixir»', () => {
  let fillEnObrir;
  const modal = vi.fn(function () { fillEnObrir = this.querySelector('.fill'); this.setAttribute('open', ''); });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: modal });
  render(<PantallaCompleta oberta titol="Calendari a pantalla completa" onTanca={() => {}}><Fills /></PantallaCompleta>);
  const dialeg = screen.getByRole('dialog', { name: 'Calendari a pantalla completa' });
  expect(dialeg.className).toBe('sdp-dialeg sdp-dialeg--completa sdp-pantalla-completa sdp-dialeg--sense-marc');
  expect(dialeg.querySelector('h2')).toBeNull();
  expect(modal).toHaveBeenCalledTimes(1);
  // Quan showModal() obri el diàleg, el visor encara és buit: els fills arriben amb onObert.
  expect(fillEnObrir).toBeNull();
  expect([...dialeg.children].map((n) => n.className)).toEqual(['sdp-pantalla-completa__barra', 'sdp-pantalla-completa__visor']);
  expect(dialeg.querySelector('.sdp-pantalla-completa__visor > .fill')).not.toBeNull();
  const eixir = within(dialeg).getByRole('button', { name: NOM_EIXIR });
  expect(dialeg.querySelector('button')).toBe(eixir);
  expect(eixir.className).toBe('sdp-boto sdp-boto--secundari');
  expect(eixir.hasAttribute('data-sdp-focus-inicial')).toBe(true);
  expect(eixir.getAttribute('aria-keyshortcuts')).toBe('Escape');
  expect(eixir.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  expect(document.activeElement).toBe(eixir);
});

test('oberta: Escape i «Eixir» avisen el pare; el clic al fons no tanca; el tancament forçat arriba com a «esc»', () => {
  const onTanca = vi.fn();
  render(<PantallaCompleta oberta titol="Pantalla" onTanca={onTanca}><Fills /></PantallaCompleta>);
  const dialeg = screen.getByRole('dialog', { name: 'Pantalla' });
  const cancel = new Event('cancel', { cancelable: true });
  act(() => { dialeg.dispatchEvent(cancel); });
  expect(cancel.defaultPrevented).toBe(true);
  expect(onTanca).toHaveBeenLastCalledWith('esc');
  fireEvent.click(dialeg);
  expect(onTanca).toHaveBeenCalledTimes(1);
  act(() => within(dialeg).getByRole('button', { name: NOM_EIXIR }).click());
  expect(onTanca).toHaveBeenLastCalledWith('boto');
  // Dos Escape seguits: el navegador el tanca i el Dialeg avisa amb { forcat: true }; ací només arriba el motiu.
  act(() => { dialeg.removeAttribute('open'); dialeg.dispatchEvent(new Event('close')); });
  expect(onTanca).toHaveBeenLastCalledWith('esc');
  expect(onTanca).toHaveBeenCalledTimes(3);
});

function muntaLocal(element) {
  const host = document.createElement('soc-de-poble'); document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const root = document.createElement('div'); root.className = 'sdp-root'; shadow.append(root);
  const muntatge = document.createElement('div'); root.append(muntatge);
  const resultat = render(element, { container: muntatge, baseElement: root });
  return { host, shadow, root, muntatge, ...resultat };
}

test('incrustat: portal a .sdp-root amb la capa --completa; germans inert; Tab tancat; Escape tanca; en desmuntar, tot com abans', () => {
  const onTanca = vi.fn();
  const { root, shadow, muntatge, unmount } = muntaLocal(
    <><button type="button">Fora</button><PantallaCompleta oberta titol="Pantalla" onTanca={onTanca}><Fills /></PantallaCompleta></>
  );
  const dialeg = within(root).getByRole('dialog', { name: 'Pantalla' });
  expect(dialeg.getAttribute('aria-modal')).toBe('true');
  expect(dialeg.parentElement.className).toBe('sdp-capa-modal sdp-capa-modal--completa');
  expect(dialeg.parentElement.parentElement).toBe(root);
  expect(muntatge.hasAttribute('inert')).toBe(true);
  expect(muntatge.getAttribute('aria-hidden')).toBe('true');
  const eixir = within(dialeg).getByRole('button', { name: NOM_EIXIR });
  expect(shadow.activeElement).toBe(eixir);
  expect(within(dialeg).getByText('Contingut')).toBeTruthy();

  const ultim = within(dialeg).getByRole('button', { name: 'Acció del fill' });
  ultim.focus();
  const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  fireEvent(ultim, tab);
  expect(tab.defaultPrevented).toBe(true);
  expect(shadow.activeElement).toBe(eixir);
  fireEvent.keyDown(eixir, { key: 'Tab', shiftKey: true });
  expect(shadow.activeElement).toBe(ultim);
  fireEvent.keyDown(ultim, { key: 'Escape' });
  expect(onTanca).toHaveBeenLastCalledWith('esc');
  // El vel local no tanca (tancaEnVel=false).
  fireEvent.click(dialeg.parentElement);
  expect(onTanca).toHaveBeenCalledTimes(1);

  unmount();
  expect(root.querySelector('.sdp-capa-modal')).toBeNull();
  expect(muntatge.hasAttribute('inert')).toBe(false);
  expect(muntatge.hasAttribute('aria-hidden')).toBe(false);
});

/* El patró de la vista Any: activar un dia la desmunta (porta a la Setmana)
   amb el botó que tenia el focus. */
function CanviaVista() {
  const [setmana, setSetmana] = useState(false);
  return setmana
    ? <p>Vista Setmana</p>
    : <button type="button" onClick={() => setSetmana(true)}>Dia 5</button>;
}

test('incrustat: si el contingut desmunta el control amb focus, el focus torna al diàleg i Escape i Tab hi arriben', async () => {
  const onTanca = vi.fn();
  const { root, shadow } = muntaLocal(<PantallaCompleta oberta titol="Pantalla" onTanca={onTanca}><CanviaVista /></PantallaCompleta>);
  const dialeg = within(root).getByRole('dialog', { name: 'Pantalla' });
  const dia = within(dialeg).getByRole('button', { name: 'Dia 5' });
  dia.focus();
  // Els observadors de mutació van en microtasques: act asíncron les buida.
  await act(async () => { dia.click(); });
  expect(within(dialeg).getByText('Vista Setmana')).toBeTruthy();
  expect(dia.isConnected).toBe(false);
  expect(shadow.activeElement).toBe(dialeg);
  // El teclat va on és el focus: sense la xarxa seria el body, fora de l'arrel, i no tancaria.
  const desti = () => shadow.activeElement ?? document.body;
  fireEvent.keyDown(desti(), { key: 'Escape' });
  expect(onTanca).toHaveBeenLastCalledWith('esc');
  // onTanca és un espia: el diàleg continua obert i la guarda del Tab torna a actuar.
  fireEvent.keyDown(desti(), { key: 'Tab', shiftKey: true });
  expect(shadow.activeElement).toBe(within(dialeg).getByRole('button', { name: NOM_EIXIR }));
});

test('incrustat: si el focus ja és a la pàgina amfitriona, desmuntar el control que el tenia no li’l pren', async () => {
  const fora = document.createElement('button');
  fora.textContent = 'De la pàgina amfitriona';
  document.body.append(fora);
  try {
    const { root, shadow } = muntaLocal(<PantallaCompleta oberta titol="Pantalla" onTanca={() => {}}><CanviaVista /></PantallaCompleta>);
    const dialeg = within(root).getByRole('dialog', { name: 'Pantalla' });
    const dia = within(dialeg).getByRole('button', { name: 'Dia 5' });
    dia.focus();
    fora.focus();
    await act(async () => { dia.click(); });
    expect(within(dialeg).getByText('Vista Setmana')).toBeTruthy();
    expect(document.activeElement).toBe(fora);
    expect(shadow.activeElement).toBeNull();
  } finally {
    fora.remove();
  }
});

test('BotoPantallaCompleta: només icona, amb nom, aria-haspopup i la pell triada', () => {
  const onClick = vi.fn();
  const { getByRole, rerender } = render(<BotoPantallaCompleta id="obridor" onClick={onClick} />);
  const boto = getByRole('button', { name: 'Pantalla completa' });
  expect(boto.className).toBe('sdp-boto sdp-boto--fantasma sdp-pantalla-completa__entra');
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  expect(boto.getAttribute('title')).toBe('Pantalla completa');
  expect(boto.id).toBe('obridor');
  expect(boto.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  expect(boto.textContent).toBe('');
  act(() => boto.click());
  expect(onClick).toHaveBeenCalledTimes(1);
  rerender(<BotoPantallaCompleta varietat="secundari" className="de-prova" />);
  expect(getByRole('button', { name: 'Pantalla completa' }).className).toBe('sdp-boto sdp-boto--secundari sdp-pantalla-completa__entra de-prova');
});

/* El patró de CalendariSection: el botó d'entrar viu dins dels fills i no
   es pinta mentre la pantalla és oberta. */
function Arnes() {
  const pantalla = usePantallaCompleta();
  return (
    <PantallaCompleta oberta={pantalla.oberta} onTanca={pantalla.tanca} titol="Mostra">
      <div className="barra">{pantalla.oberta ? null : <BotoPantallaCompleta id={pantalla.idObridor} onClick={pantalla.obri} />}</div>
      <Fills />
    </PantallaCompleta>
  );
}

test('amb usePantallaCompleta: entrar, eixir amb «Eixir» o amb Escape, i el focus torna al botó', () => {
  render(<Arnes />);
  act(() => screen.getByRole('button', { name: 'Pantalla completa' }).click());
  let dialeg = screen.getByRole('dialog', { name: 'Mostra' });
  expect(screen.queryByRole('button', { name: 'Pantalla completa' })).toBeNull();
  expect(screen.getAllByText('Contingut')).toHaveLength(1);
  expect(document.activeElement).toBe(within(dialeg).getByRole('button', { name: NOM_EIXIR }));
  act(() => within(dialeg).getByRole('button', { name: NOM_EIXIR }).click());
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pantalla completa' }));

  act(() => screen.getByRole('button', { name: 'Pantalla completa' }).click());
  dialeg = screen.getByRole('dialog', { name: 'Mostra' });
  act(() => { dialeg.dispatchEvent(new Event('cancel', { cancelable: true })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pantalla completa' }));
});

test('StrictMode (el de l’App): un sol diàleg, cap avís de React, i en eixir tot torna com era', () => {
  const error = vi.spyOn(console, 'error');
  const { container } = render(<StrictMode><Arnes /></StrictMode>);
  const abans = container.innerHTML;
  act(() => screen.getByRole('button', { name: 'Pantalla completa' }).click());
  expect(document.querySelectorAll('dialog')).toHaveLength(1);
  expect(screen.getAllByText('Contingut')).toHaveLength(1);
  act(() => screen.getByRole('button', { name: NOM_EIXIR }).click());
  expect(document.querySelectorAll('dialog')).toHaveLength(0);
  expect(container.innerHTML).toBe(abans);
  expect(error).not.toHaveBeenCalled();
});
