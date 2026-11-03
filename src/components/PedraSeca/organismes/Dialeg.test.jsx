/* T40–T41 (ordre del Mestre, 260928) · poliment · El <dialog> natiu i l'estat
   de React no poden divergir. Dos Escape seguits: el segon `cancel` ja no és
   cancel·lable i el navegador tanca el diàleg pel seu compte. jsdom no té
   showModal (el Dialeg posa l'atribut `open`): el tancament natiu s'emula
   com el fa el navegador (fora `open` i l'esdeveniment `close`). */
import React, { useState } from 'react';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Dialeg, DialegConfirmacio } from './Dialeg.jsx';
import DialegNovaConversa from '../../../sections/xat/components/DialegNovaConversa.jsx';

afterEach(() => { cleanup(); document.querySelectorAll('soc-de-poble').forEach(el => el.remove()); vi.restoreAllMocks(); delete HTMLDialogElement.prototype.show; delete HTMLDialogElement.prototype.showModal; });

function Arnes({ onTanca = () => {}, accepta = true }) {
  const [obert, setObert] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setObert(true)}>Obrir</button>
      <Dialeg obert={obert} titol="Prova" onTanca={(...args) => { onTanca(...args); if (accepta) setObert(false); }}>
        <p>Cos</p>
      </Dialeg>
    </>
  );
}

const tancaNatiu = (dialeg) => act(() => {
  dialeg.removeAttribute('open');
  dialeg.dispatchEvent(new Event('close'));
});

test('si el navegador tanca el <dialog> pel seu compte, avisa el pare amb «esc» i { forcat: true }', () => {
  const onTanca = vi.fn();
  render(<Arnes onTanca={onTanca} />);
  const dialeg = screen.getByRole('dialog', { name: 'Prova' });
  tancaNatiu(dialeg);
  expect(onTanca).toHaveBeenCalledWith('esc', { forcat: true });
  expect(screen.queryByRole('dialog')).toBeNull();
  // El pare l'ha donat per tancat: es pot tornar a obrir.
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Obrir' })); });
  expect(screen.getByRole('dialog', { name: 'Prova' })).toBeTruthy();
});

test('el tancament que ordena el pare (obert=false) no torna a cridar onTanca', () => {
  const onTanca = vi.fn();
  render(<Arnes onTanca={onTanca} />);
  const dialeg = screen.getByRole('dialog', { name: 'Prova' });
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Tancar' })); });
  expect(onTanca).toHaveBeenCalledTimes(1);
  expect(onTanca).toHaveBeenCalledWith('boto');
  // L'esdeveniment `close` del tancament propi arriba després: ja no és cap sorpresa.
  act(() => { dialeg.dispatchEvent(new Event('close')); });
  expect(onTanca).toHaveBeenCalledTimes(1);
});

/* Gauntlet 261029 (cicle 1) · Un <dialog> obert sense activació de la
   persona (Avant, F5): el primer `cancel` ja no és cancel·lable i el
   navegador el tanca. Abans s'avisava dues vegades (el `cancel` i el
   `close`); a /multimedia, cada avís era un navigate(-1). Ara, una. */
test('un cancel no cancel·lable i el close del navegador avisen el pare UNA sola vegada', () => {
  const onTanca = vi.fn();
  render(<Arnes onTanca={onTanca} accepta={false} />);
  const dialeg = screen.getByRole('dialog', { name: 'Prova' });
  act(() => { dialeg.dispatchEvent(new Event('cancel', { cancelable: false })); });
  tancaNatiu(dialeg);
  expect(onTanca).toHaveBeenCalledTimes(1);
  expect(onTanca).toHaveBeenCalledWith('esc', { forcat: true });
});

test('el primer Escape (cancel·lable) continua sent del pare: el <dialog> no es tanca a esquenes de React', () => {
  const onTanca = vi.fn();
  render(<Arnes onTanca={onTanca} accepta={false} />);
  const dialeg = screen.getByRole('dialog', { name: 'Prova' });
  const cancel = new Event('cancel', { cancelable: true });
  act(() => { dialeg.dispatchEvent(cancel); });
  expect(cancel.defaultPrevented).toBe(true);
  expect(onTanca).toHaveBeenCalledWith('esc');
  expect(screen.getByRole('dialog', { name: 'Prova' })).toBeTruthy();
});


function Encastat({ pare = true, fill = false, onTanca = () => {} }) {
  return <><button>Disparador</button><Dialeg obert={pare} titol="Pare" onTanca={onTanca}>
    <button>Primer</button><button disabled>Inactiu</button><button>Últim</button>
    <Dialeg obert={fill} titol="Fill" onTanca={onTanca}><button>Acció del fill</button></Dialeg>
  </Dialeg></>;
}

function muntaLocal(element = <Encastat />) {
  const host = document.createElement('soc-de-poble'); document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const root = document.createElement('div'); root.className = 'sdp-root'; shadow.append(root);
  const muntatge = document.createElement('div'); root.append(muntatge);
  const resultat = render(element, { container: muntatge, baseElement: root });
  return { host, shadow, root, muntatge, ...resultat };
}

test('l’encastament usa show i una capa dins de la seua arrel; l’amfitrió i l’altra instància continuen actius', () => {
  const modal = vi.fn(function () { this.setAttribute('open', ''); });
  const normal = vi.fn(function () { this.setAttribute('open', ''); });
  Object.defineProperties(HTMLDialogElement.prototype, { show: { configurable: true, value: normal }, showModal: { configurable: true, value: modal } });
  const fora = document.createElement('button'); fora.textContent = 'Amfitrió'; document.body.append(fora);
  const altra = muntaLocal(<button>Altra instància</button>);
  const { root, muntatge, unmount } = muntaLocal();
  const d = within(root).getByRole('dialog', { name: 'Pare' });
  expect(d.parentElement.classList.contains('sdp-capa-modal')).toBe(true);
  expect(d.parentElement.parentElement).toBe(root);
  expect(normal).toHaveBeenCalled(); expect(modal).not.toHaveBeenCalled();
  expect(muntatge.hasAttribute('inert')).toBe(true);
  expect(muntatge.getAttribute('aria-hidden')).toBe('true');
  expect(altra.muntatge.hasAttribute('inert')).toBe(false);
  fora.focus(); expect(document.activeElement).toBe(fora);
  unmount(); expect(root.querySelector('.sdp-capa-modal')).toBeNull();
  expect(muntatge.hasAttribute('inert')).toBe(false);
  expect(muntatge.hasAttribute('aria-hidden')).toBe(false);
  fora.remove();
});

test('Tab i Maj+Tab són cíclics; Escape queda consumit abans d’arribar al Xat', () => {
  const onTanca = vi.fn();
  const { root, shadow } = muntaLocal(<Encastat onTanca={onTanca} />);
  const d = within(root).getByRole('dialog', { name: 'Pare' });
  const primer = within(d).getByRole('button', { name: 'Tancar' });
  const ultim = within(d).getByRole('button', { name: 'Últim' });
  ultim.focus(); const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  fireEvent(ultim, tab); expect(tab.defaultPrevented).toBe(true); expect(shadow.activeElement).toBe(primer);
  fireEvent.keyDown(primer, { key: 'Tab', shiftKey: true }); expect(shadow.activeElement).toBe(ultim);
  const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true });
  fireEvent(ultim, esc); expect(esc.defaultPrevented).toBe(true); expect(onTanca).toHaveBeenCalledWith('esc');
});

test('els modals niats s’apilen; en tancar el fill es restaura el pare i després els atributs originals', () => {
  const { root, shadow, muntatge, rerender } = muntaLocal(<Encastat pare={false} />);
  muntatge.setAttribute('aria-hidden', 'false');
  const disparador = within(muntatge).getByRole('button', { name: 'Disparador' }); disparador.focus();
  rerender(<Encastat />);
  const pare = within(root).getByRole('dialog', { name: 'Pare' });
  const primer = within(pare).getByRole('button', { name: 'Primer' }); primer.focus();
  rerender(<Encastat fill />);
  // jsdom conserva el display:none calculat abans d'obrir dins del shadow.
  // La geometria/visibilitat es comprova al navegador; ací comprovem el contracte DOM.
  const fill = [...root.querySelectorAll('dialog[open]')].find(d => d.textContent.includes('Acció del fill'));
  expect(fill).toBeTruthy();
  expect(pare.parentElement.hasAttribute('inert')).toBe(true);
  expect(fill.parentElement.hasAttribute('inert')).toBe(false);
  rerender(<Encastat />);
  expect(pare.parentElement.hasAttribute('inert')).toBe(false);
  expect(shadow.activeElement).toBe(primer);
  rerender(<Encastat pare={false} />);
  expect(shadow.activeElement).toBe(disparador);
  expect(muntatge.getAttribute('aria-hidden')).toBe('false');
  expect(muntatge.hasAttribute('inert')).toBe(false);
});

test('el vel local tanca amb el mateix contracte i respecta tancaEnVel=false', () => {
  const onTanca = vi.fn();
  const { root, rerender } = muntaLocal(<Dialeg obert titol="Prova local" onTanca={onTanca}>Cos</Dialeg>);
  fireEvent.click(root.querySelector('.sdp-capa-modal')); expect(onTanca).toHaveBeenCalledWith('vel');
  onTanca.mockClear();
  rerender(<Dialeg obert titol="Prova local" onTanca={onTanca} tancaEnVel={false}>Cos</Dialeg>);
  fireEvent.click(root.querySelector('.sdp-capa-modal')); expect(onTanca).not.toHaveBeenCalled();
});

test('close local (inclòs form method=dialog) avisa el pare sense fingir un Escape forçat', () => {
  const onTanca = vi.fn();
  const { root } = muntaLocal(<Encastat onTanca={onTanca} />);
  const d = within(root).getByRole('dialog', { name: 'Pare' });
  tancaNatiu(d); expect(onTanca).toHaveBeenCalledWith('boto');
});


test('fora de soc-de-poble conserva showModal i no crea cap capa local', () => {
  const modal = vi.fn(function () { this.setAttribute('open', ''); });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: modal });
  render(<Arnes />);
  expect(modal).toHaveBeenCalledTimes(1);
  expect(document.querySelector('.sdp-capa-modal')).toBeNull();
});

/* Revisió del Gauntlet 261017 (M1, A11Y-1) · Un element enfocable fora de
   l'ordre de Tab (tabIndex -1: el marc del visor, que rep el focus d'un clic)
   també és una vora del parany quan no té cap control davant (Maj+Tab) o
   darrere (Tab): abans només ho eren el primer control, l'últim i el
   <dialog>, i el focus eixia al web amfitrió. Entre dos controls, l'ordre
   natiu, com sempre. */
test('la trampa de Tab dona la volta també des d’un element amb tabIndex -1 a la vora; entre controls, l’ordre natiu', () => {
  const { root, shadow } = muntaLocal(<Dialeg obert titol="Vores" variant="sense-marc" onTanca={() => {}}>
    <div data-prova="davant" tabIndex={-1}>
      <button>Primer</button><span data-prova="mig" tabIndex={-1}>mig</span><button>Últim</button>
    </div>
    <span data-prova="darrere" tabIndex={-1}>darrere</span>
  </Dialeg>);
  const d = within(root).getByRole('dialog', { name: 'Vores' });
  const primer = within(d).getByRole('button', { name: 'Primer' });
  const ultim = within(d).getByRole('button', { name: 'Últim' });
  const tecla = (node, shiftKey) => {
    node.focus();
    const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true, composed: true });
    fireEvent(node, e);
    return e;
  };
  expect(tecla(d.querySelector('[data-prova="davant"]'), true).defaultPrevented).toBe(true);
  expect(shadow.activeElement).toBe(ultim);
  expect(tecla(d.querySelector('[data-prova="darrere"]'), false).defaultPrevented).toBe(true);
  expect(shadow.activeElement).toBe(primer);
  const mig = d.querySelector('[data-prova="mig"]');
  expect(tecla(mig, true).defaultPrevented).toBe(false);
  expect(tecla(mig, false).defaultPrevented).toBe(false);
  // Tab avant des del contenidor de davant: el seu primer control, natiu.
  expect(tecla(d.querySelector('[data-prova="davant"]'), false).defaultPrevented).toBe(false);
  // El <dialog> mateix, com abans: Maj+Tab dona la volta i Tab és natiu.
  expect(tecla(d, true).defaultPrevented).toBe(true);
  expect(shadow.activeElement).toBe(ultim);
  expect(tecla(d, false).defaultPrevented).toBe(false);
});

/* Onada 11 (261010; prompt 261010_1730, tasca 3) · la secció s'amaga amb una
   classe i un full d'estil del document (jsdom no carrega el CSS de l'app),
   sense cap style=: la trampa (modalLocal.js, controls) la troba per l'estil
   calculat dels ancestres, el mateix camí que abans amb display:none en línia
   (l'atribut hidden entraria pel curtcircuit de closest('[hidden]')). */
test('la trampa de Tab exclou controls dins de seccions amagades per CSS', () => {
  const full = document.createElement('style');
  full.textContent = '.prova-seccio-amagada { display: none; }';
  document.head.append(full);
  const { root, shadow } = muntaLocal(<Dialeg obert titol="Focus visible" onTanca={() => {}}>
    <button>Últim visible</button><div className="prova-seccio-amagada"><button>Amagat</button></div>
  </Dialeg>);
  const ultim = within(root).getByRole('button', { name: 'Últim visible' }); ultim.focus();
  const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  fireEvent(ultim, e); expect(e.defaultPrevented).toBe(true);
  expect(shadow.activeElement).toBe(within(root).getByRole('button', { name: 'Tancar' }));
  full.remove();
});

test('desmuntar pare i fill oberts restituïx els germans i no altera el modal d’una altra instància', () => {
  const primera = muntaLocal(<Encastat />);
  primera.rerender(<Encastat fill />);
  const segona = muntaLocal(<Encastat />);
  const germana = document.createElement('div'); germana.setAttribute('inert', '');
  germana.setAttribute('aria-hidden', 'false'); primera.root.append(germana);
  primera.unmount();
  expect(primera.muntatge.hasAttribute('inert')).toBe(false);
  expect(primera.muntatge.hasAttribute('aria-hidden')).toBe(false);
  expect(germana.getAttribute('inert')).toBe('');
  expect(germana.getAttribute('aria-hidden')).toBe('false');
  expect(segona.root.querySelector('dialog').open).toBe(true);
  expect(segona.root.querySelector('dialog').parentElement.hasAttribute('inert')).toBe(false);
  expect(segona.muntatge.hasAttribute('inert')).toBe(true);
});

test('la branca nativa no afig cap fill extra a la columna', () => {
  const { container } = render(<div className="columna"><Dialeg obert={false} titol="Prova" /></div>);
  expect([...container.firstChild.children].map(node => node.tagName)).toEqual(['DIALOG']);
});

test('StrictMode, moure l’amfitrió i desmuntar amb un modal obert no deixen portals orfes', () => {
  const { host, root, rerender, unmount } = muntaLocal(<React.StrictMode><Encastat /></React.StrictMode>);
  expect(root.querySelectorAll('dialog[open]')).toHaveLength(1);
  const desti = document.createElement('section'); document.body.append(desti);
  desti.append(host);
  rerender(<React.StrictMode><Encastat fill /></React.StrictMode>);
  expect(root.querySelectorAll('dialog[open]')).toHaveLength(2);
  unmount(); expect(root.querySelectorAll('.sdp-capa-modal')).toHaveLength(0);
  expect(root.querySelectorAll('[inert]')).toHaveLength(0);
  desti.remove();
});


test('Nova conversa muntada ja oberta acaba amb el focus al cercador dins del shadow', async () => {
  const { root, shadow } = muntaLocal(<DialegNovaConversa obert onTanca={() => {}} t={(_, text) => text} cercaMembres={async () => []} />);
  await act(async () => {});
  expect(shadow.activeElement).toBe(within(root).getByRole('searchbox'));
});

test('la confirmació destructiva local conserva el focus inicial en Cancel·lar', () => {
  const { root, shadow } = muntaLocal(<DialegConfirmacio obert destructiu titol="Esborrar" onTanca={() => {}} onConfirma={() => {}} />);
  expect(shadow.activeElement).toBe(within(root).getByRole('button', { name: 'Cancel·lar' }));
});

// jsdom permet enfocar controls dins d'un dialog tancat. Emulem el primer
// commit real (ocult pel navegador); al portal el CSS ja el fa visible.
function focusComAlNavegador() {
  const focus = HTMLElement.prototype.focus;
  vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (...args) {
    if (this.closest('[hidden]')) return;
    const dialeg = this.closest('dialog');
    if (dialeg && !dialeg.open && !dialeg.parentElement.classList.contains('sdp-capa-modal')) return;
    return focus.apply(this, args);
  });
}

test('C4 · una confirmació muntada oberta torna al disparador anterior a autoFocus', () => {
  focusComAlNavegador();
  const dispara = <button>Disparador nou</button>;
  const { root, shadow, rerender } = muntaLocal(dispara);
  const boto = within(root).getByRole('button', { name: 'Disparador nou' }); boto.focus();
  rerender(<>{dispara}<DialegConfirmacio obert destructiu titol="Esborrar nou" /></>);
  expect(shadow.activeElement).toBe(within(root).getByRole('button', { name: 'Cancel·lar' }));
  rerender(dispara);
  expect(shadow.activeElement).toBe(boto);
});

test('C4 · autoFocus genèric del consumidor sobreviu als passos de focus de show()', () => {
  focusComAlNavegador();
  Object.defineProperty(HTMLDialogElement.prototype, 'show', { configurable: true, value() {
    this.setAttribute('open', ''); this.querySelector('button')?.focus();
  } });
  const { root, shadow } = muntaLocal(<Dialeg obert titol="Emoticona"><input aria-label="Cercar emoticona" autoFocus /></Dialeg>);
  expect(shadow.activeElement).toBe(within(root).getByRole('textbox', { name: 'Cercar emoticona' }));
});

/* Fase D (261020, revisió) · A la SPA, l'autoFocus del commit cau dins del
   <dialog> encara tancat i el navegador no hi fa res (focusComAlNavegador);
   showModal() fa els passos de focus del diàleg: l'atribut autofocus, que
   React no escriu, o el primer control, la X. El focus inicial a
   «Cancel·lar» el posa el Dialeg darrere de showModal(), i onObert encara
   té l'última paraula. */
function showModalComAlNavegador() {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() {
    this.setAttribute('open', '');
    (this.querySelector('[autofocus]') || this.querySelector('button'))?.focus();
  } });
}

test('la confirmació destructiva a la SPA porta el focus inicial a Cancel·lar, no a la X de showModal()', () => {
  focusComAlNavegador();
  showModalComAlNavegador();
  const { rerender } = render(<DialegConfirmacio obert={false} destructiu titol="Esborrar" onTanca={() => {}} onConfirma={() => {}} />);
  rerender(<DialegConfirmacio obert destructiu titol="Esborrar" onTanca={() => {}} onConfirma={() => {}} />);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel·lar' }));
  rerender(<DialegConfirmacio obert={false} destructiu titol="Esborrar" onTanca={() => {}} onConfirma={() => {}} />);
  /* En tornar a obrir-lo, el botó ja és muntat: l'autoFocus no torna a córrer. */
  rerender(<DialegConfirmacio obert destructiu titol="Esborrar" onTanca={() => {}} onConfirma={() => {}} />);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel·lar' }));
});

test('a la SPA, onObert té l’última paraula sobre el focus inicial que demana el contingut', () => {
  focusComAlNavegador();
  showModalComAlNavegador();
  const onObert = () => document.getElementById('sdp-prova-desti')?.focus();
  render(
    <Dialeg obert titol="Prova" onObert={onObert}>
      <button type="button" data-sdp-focus-inicial>Inicial</button>
      <button type="button" id="sdp-prova-desti">Destí</button>
    </Dialeg>
  );
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Destí' }));
});

/* Pantalla completa (ordre del Mestre, 261001) · mida 'completa' i onObert.
   La resta de diàlegs no canvien ni de classes ni de capa. */
test('mida completa: la classe del diàleg i, encastat, la capa --completa; les mides s, m i g i el calaix, com sempre', () => {
  const { container } = render(<Dialeg obert={false} titol="Prova" mida="completa" />);
  expect(container.querySelector('dialog').className).toBe('sdp-dialeg sdp-dialeg--completa');
  cleanup();
  const capes = {};
  for (const [nom, props] of [['completa', { mida: 'completa' }], ['s', { mida: 's' }], ['m', {}], ['g', { mida: 'g' }],
    ['calaix', { costat: 'dreta' }], ['calaix completa', { costat: 'dreta', mida: 'completa' }]]) {
    const { root, unmount } = muntaLocal(<Dialeg obert titol={nom} {...props}>Cos</Dialeg>);
    capes[nom] = within(root).getByRole('dialog', { name: nom }).parentElement.className;
    unmount();
  }
  expect(capes).toEqual({
    completa: 'sdp-capa-modal sdp-capa-modal--completa', s: 'sdp-capa-modal', m: 'sdp-capa-modal', g: 'sdp-capa-modal',
    calaix: 'sdp-capa-modal sdp-capa-modal--calaix', 'calaix completa': 'sdp-capa-modal sdp-capa-modal--calaix'
  });
});

test('onObert a la SPA: una sola vegada, darrere de showModal(), i no en tornar a pintar', () => {
  const ordre = [];
  const modal = vi.fn(function () { ordre.push('showModal'); this.setAttribute('open', ''); });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: modal });
  const onObert = vi.fn(() => ordre.push('onObert'));
  const { rerender } = render(<Dialeg obert={false} titol="Prova" onObert={onObert}>Cos</Dialeg>);
  expect(onObert).not.toHaveBeenCalled();
  rerender(<Dialeg obert titol="Prova" onObert={onObert}>Cos</Dialeg>);
  rerender(<Dialeg obert titol="Prova" onObert={onObert}>Cos de nou</Dialeg>);
  expect(ordre).toEqual(['showModal', 'onObert']);
});

test('onObert encastat: una sola vegada, darrere de show() i ja dins de la capa; mai en el commit de sonda', () => {
  const ordre = [];
  const modal = vi.fn();
  const normal = vi.fn(function () { ordre.push(`show:${this.parentElement.className}`); this.setAttribute('open', ''); });
  Object.defineProperties(HTMLDialogElement.prototype, { show: { configurable: true, value: normal }, showModal: { configurable: true, value: modal } });
  const onObert = vi.fn(() => ordre.push('onObert'));
  muntaLocal(<Dialeg obert titol="Prova local" mida="completa" variant="sense-marc" onObert={onObert}><button>Dins</button></Dialeg>);
  expect(ordre).toEqual(['show:sdp-capa-modal sdp-capa-modal--completa', 'onObert']);
  expect(modal).not.toHaveBeenCalled();
});

test('C5 · calaix sense marc manté nom accessible, focus, Escape i vel locals', () => {
  const onTanca = vi.fn();
  const { root, shadow } = muntaLocal(<Dialeg obert costat="esquerra" variant="sense-marc" titol="Menú" onTanca={onTanca}><button>Primera ruta</button></Dialeg>);
  const dialeg = within(root).getByRole('dialog', { name: 'Menú' });
  expect(dialeg.getAttribute('aria-modal')).toBe('true');
  expect(dialeg.parentElement.classList.contains('sdp-capa-modal--calaix')).toBe(true);
  expect(shadow.activeElement).toBe(within(dialeg).getByRole('button', { name: 'Primera ruta' }));
  fireEvent.keyDown(shadow.activeElement, { key: 'Escape' });
  expect(onTanca).toHaveBeenLastCalledWith('esc');
  fireEvent.click(dialeg.parentElement);
  expect(onTanca).toHaveBeenLastCalledWith('vel');
});

/* Directiva del Mestre (261025, pla 261025_0045, T2) · La finestra de la
   barra s'ancora davall de les barres només si hi cap sencera: si el cos fa
   scroll, puja (sdp-dialeg--barra-amunt) i no torna a baixar fins que es
   tanca. Una finestra del centre o un calaix, mai. jsdom no maqueta: la mida
   del cos es fixa a mà. */
const fesQueNoHiCapia = (cos) => {
  Object.defineProperty(cos, 'scrollHeight', { configurable: true, value: 900 });
  Object.defineProperty(cos, 'clientHeight', { configurable: true, value: 600 });
};

function ArnesBarra({ lloc = 'barra', costat = null, text = 'Cos' }) {
  const [obert, setObert] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setObert((o) => !o)}>Commuta</button>
      <Dialeg obert={obert} titol="Barra" lloc={lloc} costat={costat} onTanca={() => setObert(false)}><p>{text}</p></Dialeg>
    </>
  );
}

test('T2 · la finestra de la barra que no hi cap puja; la que hi cap, s’ancora; en tancar torna a l’ancoratge', () => {
  const { rerender, container } = render(<ArnesBarra />);
  const dialeg = () => container.querySelector('dialog');
  expect(dialeg().className).toBe('sdp-dialeg sdp-dialeg--m sdp-dialeg--barra');
  fesQueNoHiCapia(dialeg().querySelector('.sdp-dialeg__cos'));
  rerender(<ArnesBarra text="Cos més llarg" />);
  expect(dialeg().classList.contains('sdp-dialeg--barra-amunt')).toBe(true);
  /* Cap salt mentre s'hi tria: encara que el cos torne a cabre, es queda dalt. */
  Object.defineProperty(dialeg().querySelector('.sdp-dialeg__cos'), 'scrollHeight', { configurable: true, value: 600 });
  rerender(<ArnesBarra text="Cos curt" />);
  expect(dialeg().classList.contains('sdp-dialeg--barra-amunt')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Commuta', hidden: true }));
  expect(dialeg().classList.contains('sdp-dialeg--barra-amunt')).toBe(false);
});

test('T2 · en canviar la mida de la finestra es torna a mirar; una finestra del centre o un calaix no pugen mai', () => {
  const { container, unmount } = render(<ArnesBarra />);
  fesQueNoHiCapia(container.querySelector('.sdp-dialeg__cos'));
  act(() => { window.dispatchEvent(new Event('resize')); });
  expect(container.querySelector('dialog').classList.contains('sdp-dialeg--barra-amunt')).toBe(true);
  unmount();
  for (const props of [{ lloc: 'centre' }, { lloc: 'barra', costat: 'dreta' }]) {
    const vista = render(<ArnesBarra {...props} />);
    fesQueNoHiCapia(vista.container.querySelector('.sdp-dialeg__cos'));
    act(() => { window.dispatchEvent(new Event('resize')); });
    vista.rerender(<ArnesBarra {...props} text="Més" />);
    expect(vista.container.querySelector('dialog').classList.contains('sdp-dialeg--barra-amunt')).toBe(false);
    vista.unmount();
  }
});

/* Revisió adversarial 261025 · En l'encastat la capa modal ja dimensiona el diàleg (layout.css,
   :host .sdp-capa-modal > .sdp-dialeg): la regla de pujar li hauria guanyat i el diàleg hauria
   crescut més que la caixa de l'amfitrió, sense títol ni peu. Ací no puja mai. */
test('T2 · en l’encastat la finestra de la barra no puja mai: la capa modal ja la dimensiona', () => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    show: { configurable: true, value: vi.fn(function () { this.setAttribute('open', ''); }) },
    showModal: { configurable: true, value: vi.fn(function () { this.setAttribute('open', ''); }) }
  });
  const { root, rerender } = muntaLocal(<ArnesBarra />);
  const dialeg = () => root.querySelector('dialog');
  expect(dialeg().classList.contains('sdp-dialeg--barra')).toBe(true);
  fesQueNoHiCapia(dialeg().querySelector('.sdp-dialeg__cos'));
  act(() => { window.dispatchEvent(new Event('resize')); });
  rerender(<ArnesBarra text="Cos més llarg" />);
  expect(dialeg().classList.contains('sdp-dialeg--barra-amunt')).toBe(false);
});

/* O4-CLAUDE-1b (IDEA-63, ordre del Mestre, captura 261102_2149) · Tot
   calaix del Dialeg (costat esquerra o dreta: «Amb qui actues?», el Crom del
   sistema, l'espècimen del catàleg i el menú compacte d'App.jsx) naix davall
   de la barra negra amb el mateix càlcul que l'Índex de la Pàgina Universal:
   els tokens compartits --sdp-calaix-dalt i --sdp-calaix-alt (tokens.css).
   jsdom no maqueta ni resol la cascada: es lligen els fulls de veres, com
   les proves de capes (src/css/*.capes.test.js), i les classes que pinta. */
const BARRA_NEGRA = 'calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))';
const lligFull = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Regles fulla d'un full: { prelud, cos, pares } (pares: els blocs que la contenen). */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}
/** Declaracions d'un cos: [[propietat, valor], …]. */
const declaracionsDe = (cos) => cos.split(';').map((d) => d.trim()).filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]);
/** Tots els valors de `propietat` a les regles amb eixe prelud exacte. */
const valors = (full, prelud, propietat) => full.filter((r) => r.prelud === prelud)
  .flatMap((r) => declaracionsDe(r.cos)).filter(([p]) => p === propietat).map(([, v]) => v);
/** Tots els fulls .css de src/, amb el camí relatiu. */
const fullsCss = () => readdirSync(resolve(process.cwd(), 'src'), { recursive: true })
  .filter((rel) => String(rel).endsWith('.css')).map((rel) => join('src', String(rel)));

test('O4-CLAUDE-1b · els tokens del calaix: el dalt és l’alçada de la barra negra; l’alçada, la resta (vh, i dvh només dins de @supports)', () => {
  const tokens = regles(lligFull('src/css/tokens.css'));
  const deTokens = (pares, nom) => tokens.filter((r) => r.prelud === ':root, :host, .sdp-root' && r.pares.join(' ') === pares)
    .flatMap((r) => declaracionsDe(r.cos)).filter(([p]) => p === nom).map(([, v]) => v);
  expect(deTokens('', '--sdp-calaix-dalt')).toEqual([BARRA_NEGRA]);
  expect(deTokens('', '--sdp-calaix-alt')).toEqual(['calc(100vh - var(--sdp-calaix-dalt))']);
  expect(deTokens('@supports (height: 100dvh)', '--sdp-calaix-alt')).toEqual(['calc(100dvh - var(--sdp-calaix-dalt))']);
  // Un sol lloc per al dalt, i cap dvh de token fora del seu @supports: una
  // segona declaració de la custom property no fa de reserva en Chrome 100.
  const totes = tokens.flatMap((r) => declaracionsDe(r.cos).map(([p, v]) => ({ ...r, p, v })));
  expect(totes.filter((d) => d.p === '--sdp-calaix-dalt')).toHaveLength(1);
  expect(totes.filter((d) => /\ddvh\b/.test(d.v) && !d.pares.includes('@supports (height: 100dvh)')).map((d) => `${d.prelud} { ${d.p}: ${d.v} }`)).toEqual([]);
  // La barra negra fa exactament esta alçada: el calaix comença on ella acaba.
  expect(senseComentaris(lligFull('src/css/layout.css')).replace(/\s+/g, ' '))
    .toContain(`header.bar-black { box-sizing: border-box; height: ${BARRA_NEGRA}; min-height: ${BARRA_NEGRA};`);
});

test('O4-CLAUDE-1b · el calaix i el seu vel comencen davall de la barra amb els tokens; els costats només posen left i right; l’Índex, els mateixos', () => {
  const components = regles(lligFull('src/css/components.css'));
  expect(valors(components, '.sdp-dialeg--calaix', 'top')).toEqual(['var(--sdp-calaix-dalt)']);
  expect(valors(components, '.sdp-dialeg--calaix', 'bottom')).toEqual(['0']);
  expect(valors(components, '.sdp-dialeg--calaix', 'height')).toEqual(['var(--sdp-calaix-alt)']);
  // El sostre, el mateix token: ni el de l'agent d'usuari (100% − 2em) ni el de .sdp-dialeg el retallen.
  expect(valors(components, '.sdp-dialeg--calaix', 'max-height')).toEqual(['var(--sdp-calaix-alt)']);
  expect(valors(components, '.sdp-dialeg--calaix', 'margin')).toEqual(['0']);
  // El vel comença a enfosquir on comença el calaix, amb el mateix token (B1b-02: transparent damunt de la barra).
  expect(valors(components, '.sdp-dialeg--calaix::backdrop', 'background')).toEqual([
    'linear-gradient(to bottom, transparent var(--sdp-calaix-dalt), var(--sdp-fons-vel) var(--sdp-calaix-dalt))'
  ]);
  expect(valors(components, '.sdp-dialeg--esquerra', 'left')).toEqual(['0']);
  expect(valors(components, '.sdp-dialeg--dreta', 'right')).toEqual(['0']);
  for (const costat of ['.sdp-dialeg--esquerra', '.sdp-dialeg--dreta']) {
    const propietats = components.filter((r) => r.prelud === costat).flatMap((r) => declaracionsDe(r.cos)).map(([p]) => p);
    // Un inset sencer tornaria el dalt a 0, damunt de la barra.
    expect(propietats.filter((p) => /^(inset|inset-block|inset-block-start|top|height|max-height)$/.test(p)), costat).toEqual([]);
  }
  // El cos fa el seu scroll i el peu queda damunt de la zona segura de baix.
  expect(valors(components, '.sdp-dialeg--calaix .sdp-dialeg__marc', 'height')).toEqual(['100%']);
  expect(valors(components, '.sdp-dialeg__cos', 'overflow-y')).toEqual(['auto']);
  expect(valors(components, '.sdp-dialeg--calaix .sdp-dialeg__peu', 'padding-bottom'))
    .toEqual(['calc(var(--sdp-space-4) + env(safe-area-inset-bottom, 0px))']);
  // L'Índex de la Pàgina Universal (modules.css): els mateixos tokens i una sola alçada.
  const moduls = regles(lligFull('src/css/modules.css'));
  expect(valors(moduls, '.toc-overlay', 'top')).toEqual(['var(--sdp-calaix-dalt)']);
  expect(valors(moduls, '.toc-overlay', 'height')).toEqual(['var(--sdp-calaix-alt)']);
});

test('O4-CLAUDE-1b · cap regla de calaix, del seu vel ni de l’Índex torna a 100dvh (ni a cap vh) sense restar la barra, ni posa el dalt a 0', () => {
  const SUBJECTE = /(\.sdp-dialeg--(calaix|esquerra|dreta)|\.sdp-dialeg-sidebar|\.toc-overlay)(::backdrop)?$/;
  const VERTICALS = /^(height|max-height|min-height|top|inset|inset-block|inset-block-start)$/;
  const trobades = [];
  const infraccions = [];
  for (const full of fullsCss()) {
    for (const regla of regles(lligFull(full))) {
      // L'encastat (:host) el dimensiona la capa modal de layout.css: 100% de la caixa de l'App.
      const selectors = regla.prelud.split(',').map((s) => s.trim()).filter((s) => !s.startsWith(':host') && SUBJECTE.test(s));
      if (!selectors.length) continue;
      trobades.push(regla.prelud);
      for (const [propietat, valor] of declaracionsDe(regla.cos)) {
        if (!VERTICALS.test(propietat)) continue;
        const dalt = /^(top|inset|inset-block|inset-block-start)$/.test(propietat) ? valor.split(/\s+/)[0] : null;
        if (/\d(s|l|d)?vh\b/.test(valor) || dalt === '0' || dalt === '0px') infraccions.push(`${full} · ${regla.prelud} { ${propietat}: ${valor} }`);
      }
    }
  }
  expect(trobades).toEqual(expect.arrayContaining(['.sdp-dialeg--calaix', '.sdp-dialeg--calaix::backdrop', '.toc-overlay']));
  expect(infraccions).toEqual([]);
});

/* O4-CLAUDE-1b · B1b-02 (àrbitre, P2) · Amb showModal() el document és
   inert: un vel que començara davall de la barra deixaria la barra visible
   però morta (un toc no arriba ni a ella ni al <dialog>, i tornar a tocar
   l'avatar per a tancar no faria res). El vel ocupa tota la pantalla, com
   el ::backdrop de l'agent d'usuari (fixed, inset: 0), i és transparent
   damunt de la barra: no l'enfosquix, i un toc allí cau al vel i tanca el
   calaix amb el motiu 'vel', com abans. */
const VEL_CALAIX = 'linear-gradient(to bottom, transparent var(--sdp-calaix-dalt), var(--sdp-fons-vel) var(--sdp-calaix-dalt))';
const GEOMETRIA_VERTICAL = /^(position|inset|inset-block|inset-block-start|inset-block-end|top|bottom|height|min-height|max-height|block-size)$/;

test('O4-CLAUDE-1b · B1b-02 · el vel del calaix cobrix tota la pantalla i és transparent damunt de la barra negra: un toc a la barra el tanca', () => {
  const components = regles(lligFull('src/css/components.css'));
  const delVel = components.filter((r) => r.prelud.split(',').map((s) => s.trim()).includes('.sdp-dialeg--calaix::backdrop'));
  // Cap geometria pròpia: la de l'agent d'usuari, tota la pantalla.
  expect(delVel.flatMap((r) => declaracionsDe(r.cos)).map(([p]) => p).filter((p) => GEOMETRIA_VERTICAL.test(p))).toEqual([]);
  // La franja de la barra, transparent; davall, el vel de sempre, des del mateix token que el calaix.
  expect(valors(components, '.sdp-dialeg--calaix::backdrop', 'background')).toEqual([VEL_CALAIX]);
  expect(valors(components, '.sdp-dialeg--calaix', 'top')).toEqual(['var(--sdp-calaix-dalt)']);
  // jsdom: el toc al vel arriba al <dialog> mateix (e.target) i el tanca amb el motiu 'vel'.
  const onTanca = vi.fn();
  render(<Dialeg obert costat="dreta" titol="Calaix del vel" onTanca={onTanca}><p>Cos</p></Dialeg>);
  fireEvent.click(screen.getByRole('dialog', { name: 'Calaix del vel' }));
  expect(onTanca).toHaveBeenCalledTimes(1);
  expect(onTanca).toHaveBeenCalledWith('vel');
});

/* O4-CLAUDE-1b · B1b-04 (àrbitre, P3) · Els valors no basten: l'ordre del
   full també mana. (1) Si el @supports (height: 100dvh) de tokens.css pujara
   per damunt del :root principal, el vh guanyaria a tots els navegadors
   moderns: l'Índex deixaria de ser idèntic al píxel i el peu dels calaixos
   quedaria davall de la barra del navegador. (2) Si .sdp-dialeg--calaix
   pujara per damunt de .sdp-dialeg (la mateixa especificitat, 0,1,0),
   tornarien a manar el margin: auto i el max-height: min(88dvh, 48rem), i el
   calaix es retallaria. El mateix per al vel. Les guardes es proven també
   contra un full girat: han de detectar l'ordre invers. */
function problemesDOrdreDelToken(css) {
  const declaracions = regles(css).flatMap((r) => declaracionsDe(r.cos).filter(([p]) => p === '--sdp-calaix-alt')
    .map(([, v]) => ({ v, dins: r.pares.includes('@supports (height: 100dvh)') })));
  const vh = declaracions.findIndex((d) => !d.dins && d.v === 'calc(100vh - var(--sdp-calaix-dalt))');
  const dvh = declaracions.findIndex((d) => d.dins && d.v === 'calc(100dvh - var(--sdp-calaix-dalt))');
  if (vh < 0 || dvh < 0) return ['falta el vh o el dvh de --sdp-calaix-alt'];
  const problemes = [];
  if (dvh < vh) problemes.push('el dvh del @supports va davant del vh: el vh guanyaria');
  if (declaracions.length - 1 !== dvh) problemes.push('una declaració posterior tapa el dvh');
  return problemes;
}
function problemesDOrdreDelCalaix(css) {
  const totes = regles(css);
  const ultima = (prelud, propietats) => totes.reduce((i, r, j) => (r.prelud === prelud
    && declaracionsDe(r.cos).some(([p]) => propietats.test(p)) ? j : i), -1);
  const primera = (prelud) => totes.findIndex((r) => r.prelud === prelud);
  const problemes = [];
  const base = ultima('.sdp-dialeg', /^(margin|max-height|height|top|inset)$/);
  const calaix = primera('.sdp-dialeg--calaix');
  if (base < 0 || calaix < base) problemes.push('.sdp-dialeg--calaix ha d’anar darrere de .sdp-dialeg');
  const velBase = ultima('.sdp-dialeg::backdrop', /^background$/);
  const velCalaix = primera('.sdp-dialeg--calaix::backdrop');
  if (velBase < 0 || velCalaix < velBase) problemes.push('.sdp-dialeg--calaix::backdrop ha d’anar darrere de .sdp-dialeg::backdrop');
  return problemes;
}

test('O4-CLAUDE-1b · B1b-04 · l’ordre del full: el dvh del token, darrere del vh; el calaix i el seu vel, darrere de .sdp-dialeg', () => {
  expect(problemesDOrdreDelToken(lligFull('src/css/tokens.css'))).toEqual([]);
  expect(problemesDOrdreDelCalaix(lligFull('src/css/components.css'))).toEqual([]);
  // Les guardes veuen l'ordre invers.
  // El nom del token a banda: un full de mentida no és una segona definició (tractor-tokens, T3).
  const alt = '--sdp-calaix-alt';
  const vh = `:root, :host, .sdp-root { ${alt}: calc(100vh - var(--sdp-calaix-dalt)); }`;
  const dvh = `@supports (height: 100dvh) { :root, :host, .sdp-root { ${alt}: calc(100dvh - var(--sdp-calaix-dalt)); } }`;
  expect(problemesDOrdreDelToken(`${vh}\n${dvh}`)).toEqual([]);
  expect(problemesDOrdreDelToken(`${dvh}\n${vh}`)).not.toEqual([]);
  const base = '.sdp-dialeg { margin: auto; max-height: min(88dvh, 48rem); } .sdp-dialeg::backdrop { background: var(--sdp-fons-vel); }';
  const calaix = `.sdp-dialeg--calaix { margin: 0; max-height: var(--sdp-calaix-alt); } .sdp-dialeg--calaix::backdrop { background: ${VEL_CALAIX}; }`;
  expect(problemesDOrdreDelCalaix(`${base}\n${calaix}`)).toEqual([]);
  expect(problemesDOrdreDelCalaix(`${calaix}\n${base}`)).toHaveLength(2);
});

/* O4-CLAUDE-1b · B1b-05 (àrbitre, P3) · El càlcul de la barra encara viu
   copiat en literal fora del token (header.bar-black, .brand, :host
   .toc-overlay a layout.css i .sdp-ptr-indicator a modules.css: fora del
   carril, petició a l'orquestrador per a passar-los a var(--sdp-calaix-dalt)).
   Mentre hi siguen, cap còpia no es pot desviar del token: si canvia l'un i
   no l'altre, el calaix, l'Índex de l'encastat o l'indicador de recarregar
   deixen de començar on acaba la barra. */
test('O4-CLAUDE-1b · B1b-05 · cap còpia literal del càlcul de la barra negra es desvia del token --sdp-calaix-dalt', () => {
  const token = regles(lligFull('src/css/tokens.css')).filter((r) => r.prelud === ':root, :host, .sdp-root' && !r.pares.length)
    .flatMap((r) => declaracionsDe(r.cos)).find(([p]) => p === '--sdp-calaix-dalt')?.[1];
  expect(token).toBe(BARRA_NEGRA);
  const FIRMA = 'var(--sdp-alt-negra) + env(safe-area-inset-top';
  const copies = [];
  for (const full of fullsCss()) {
    if (full === join('src', 'css', 'tokens.css')) continue;
    for (const regla of regles(lligFull(full))) {
      for (const [propietat, valor] of declaracionsDe(regla.cos)) {
        for (let i = valor.indexOf(FIRMA); i >= 0; i = valor.indexOf(FIRMA, i + 1)) {
          // El calc() que la conté, sencer (parèntesis equilibrats).
          const inici = valor.lastIndexOf('calc(', i);
          let fi = inici;
          for (let profunditat = 0; fi < valor.length; fi += 1) {
            if (valor[fi] === '(') profunditat += 1;
            else if (valor[fi] === ')' && --profunditat === 0) break;
          }
          copies.push({ on: `${full} · ${regla.prelud} { ${propietat} }`, calcul: valor.slice(inici, fi + 1) });
        }
      }
    }
  }
  expect(copies.map((c) => c.on)).toEqual(expect.arrayContaining([expect.stringContaining('header.bar-black { height }')]));
  expect(copies.filter((c) => c.calcul !== token).map((c) => `${c.on}: ${c.calcul}`)).toEqual([]);
});

/* O4-CLAUDE-1b · B1b-01 (àrbitre, P1) · [DEFECTE] fora del carril
   (layout.css). El menú compacte (App.jsx, <Dialeg costat="esquerra"
   className="sdp-dialeg-sidebar">) naix ara davall de la barra negra i de la
   zona segura, però la seua marca (.brand, @layer legacy de layout.css)
   continua sumant la zona segura de dalt (padding-top: env(...) !important i
   height amb env), com quan el calaix obria des de dalt de la pantalla: a
   l'iPhone amb osca, una franja negra buida de 47-59px al cim del menú. Des
   de components.css no s'hi pot guanyar: amb !important l'ordre de les capes
   s'invertix i legacy guanya a components. test.fails mentre el defecte hi
   siga. Aplicada a layout.css (orquestrador, 261102 23:4x): ara és una prova
   normal. Amagar la marca dins del calaix continua sent tria del Mestre. */
test('O4-CLAUDE-1b · B1b-01 · la marca del menú compacte no torna a sumar la zona segura de dalt davall de la barra', () => {
  const marcaDelCalaix = (r) => r.prelud.split(',').some((s) => /\.sdp-dialeg-sidebar\b.*\s\.brand(\.[\w-]+)*$/.test(s.trim()));
  const fulls = ['src/css/layout.css', 'src/css/components.css'].flatMap((full) => regles(lligFull(full)));
  // (a) Amagada dins del calaix (tria del Mestre: el logotip ja es veu a la barra).
  const amagada = fulls.filter(marcaDelCalaix).some((r) => declaracionsDe(r.cos).some(([p, v]) => p === 'display' && v === 'none'));
  // (b) Sense la zona segura: padding-top a 0 amb !important en una capa que guanye a legacy, i una alçada sense env().
  const neta = fulls.filter((r) => marcaDelCalaix(r) && r.pares.some((p) => /^@layer (reset|sdp|legacy)$/.test(p))).some((r) => {
    const declaracions = declaracionsDe(r.cos);
    const senseCoixi = declaracions.some(([p, v]) => /^(padding-top|padding-block-start)$/.test(p) && /^0(px)? !important$/.test(v))
      || declaracions.some(([p, v]) => p === 'padding' && /^0(px)?\b.*!important$/.test(v));
    const alcada = declaracions.some(([p, v]) => p === 'height' && !v.includes('safe-area-inset-top'));
    return senseCoixi && alcada;
  });
  expect(amagada || neta).toBe(true);
});

/* O4-CLAUDE-1b · B1b-03 (àrbitre, P2) · [DEFECTE] fora del carril
   (layout.css). Encastada (<soc-de-poble>, mode local del Dialeg), la capa
   modal del calaix (:host .sdp-capa-modal, inset: 0, amb --calaix només
   padding: 0) i el calaix (height: 100%) continuen cobrint i enfosquint la
   barra negra de l'App. Petició: el mateix patró que a la SPA (B1b-02), la
   capa sencera, transparent damunt de la barra i amb el calaix davall
   d'ella; un inset que la fera començar davall de la barra també ho
   resoldria, però deixaria la barra inert (modalLocal.js) sense cap toc.
   Aplicada a layout.css (orquestrador, 261102 23:4x): ara és una prova
   normal. */
test('O4-CLAUDE-1b · B1b-03 · encastada, la capa del calaix no vela la barra negra de l’App', () => {
  const capa = regles(lligFull('src/css/layout.css'))
    .filter((r) => r.prelud.split(',').map((s) => s.trim()).includes(':host .sdp-capa-modal--calaix'))
    .flatMap((r) => declaracionsDe(r.cos));
  const darrer = (propietat) => capa.filter(([p]) => p === propietat).map(([, v]) => v).at(-1);
  const davall = (darrer('inset') ?? '').startsWith('var(--sdp-calaix-dalt)') || darrer('top') === 'var(--sdp-calaix-dalt)';
  const transparent = darrer('background') === VEL_CALAIX
    && (darrer('padding-top') ?? darrer('padding') ?? '').startsWith('var(--sdp-calaix-dalt)');
  expect(davall || transparent).toBe(true);
});

test('O4-CLAUDE-1b · a la SPA el Dialeg pinta el calaix fora de la capa modal, amb la classe compartida i el costat; cap estil en línia', () => {
  for (const [costat, extra] of [['dreta', {}], ['esquerra', {}], ['esquerra', { variant: 'sense-marc', className: 'sdp-dialeg-sidebar' }]]) {
    render(<Dialeg obert costat={costat} titol={`Calaix ${costat}`} accions={<button type="button">Peu</button>} {...extra}><p>Cos</p></Dialeg>);
    const dialeg = screen.getByRole('dialog', { name: `Calaix ${costat}` });
    expect(dialeg.classList.contains('sdp-dialeg--calaix'), costat).toBe(true);
    expect(dialeg.classList.contains(`sdp-dialeg--${costat}`), costat).toBe(true);
    // Fora d'un encastament, cap regla :host .sdp-capa-modal no hi guanya.
    expect(dialeg.closest('.sdp-capa-modal')).toBeNull();
    expect(dialeg.getAttribute('style')).toBeNull();
    expect(dialeg.querySelectorAll('[style]')).toHaveLength(0);
    if (!extra.variant) {
      expect(dialeg.querySelector(':scope > .sdp-dialeg__marc > .sdp-dialeg__cos')).not.toBeNull();
      expect(dialeg.querySelector(':scope > .sdp-dialeg__marc > footer.sdp-dialeg__peu')).not.toBeNull();
    }
    cleanup();
  }
});

/* La petició de B1b-03 no toca estes regles: el calaix continua fent el 100%
   de la capa, i és la capa la que el deixa davall de la barra. */
test('O4-CLAUDE-1b · l’encastat no canvia: la capa modal de layout.css continua dimensionant el calaix (inset: auto, 100% de la caixa) i hi guanya', () => {
  const layout = regles(lligFull('src/css/layout.css'));
  expect(valors(layout, ':host .sdp-capa-modal > .sdp-dialeg', 'inset')).toEqual(['auto']);
  expect(valors(layout, ':host .sdp-capa-modal > .sdp-dialeg', 'max-height')).toEqual(['100%']);
  expect(valors(layout, ':host .sdp-capa-modal > .sdp-dialeg--calaix', 'height')).toEqual(['100%']);
  // (0,3,0) contra (0,1,0), a la mateixa capa: el :host guanya al top, al bottom, al left, al right i a l'alçada del calaix.
  const capa = (full, prelud) => regles(lligFull(full)).find((r) => r.prelud === prelud)?.pares;
  expect(capa('src/css/layout.css', ':host .sdp-capa-modal > .sdp-dialeg')).toEqual(['@layer components']);
  expect(capa('src/css/components.css', '.sdp-dialeg--calaix')).toEqual(['@layer components']);
});
