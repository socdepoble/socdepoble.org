/* T40–T41 (ordre del Mestre, 260928) · poliment · El <dialog> natiu i l'estat
   de React no poden divergir. Dos Escape seguits: el segon `cancel` ja no és
   cancel·lable i el navegador tanca el diàleg pel seu compte. jsdom no té
   showModal (el Dialeg posa l'atribut `open`): el tancament natiu s'emula
   com el fa el navegador (fora `open` i l'esdeveniment `close`). */
import React, { useState } from 'react';
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
