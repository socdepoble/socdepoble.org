import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useElementFullscreen } from './useElementFullscreen.js';
function Viewer() {
  const { elementRef, isFullscreen, toggleFullscreen } = useElementFullscreen();
  return <section ref={elementRef} data-testid="viewer" className={isFullscreen ? 'is-fullscreen' : ''}><button onClick={toggleFullscreen}>{isFullscreen ? 'Exit' : 'Enter'}</button></section>;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); document.body.style.overflow = ''; delete document.fullscreenElement; delete document.exitFullscreen; delete HTMLElement.prototype.requestFullscreen; });
describe('pantalla completa amb reserva CSS', () => {
  test('API absent: ocupa la pantalla, Escape tanca, el <body> amfitrió no es toca (LLEI_06) i el focus torna', async () => {
    document.body.style.overflow = 'clip';
    render(<Viewer />);
    const enter = screen.getByRole('button', { name: 'Enter' }); enter.focus();
    fireEvent.click(enter);
    await waitFor(() => expect(screen.getByTestId('viewer').className).toBe('is-fullscreen'));
    expect(document.body.style.overflow).toBe('clip');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTestId('viewer').className).toBe('');
    expect(document.body.style.overflow).toBe('clip'); expect(document.activeElement).toBe(enter);
  });
  test('rebuig de l’API: reserva CSS i botó d’eixida', async () => {
    HTMLElement.prototype.requestFullscreen = vi.fn().mockRejectedValue(new Error('denied'));
    render(<Viewer />); fireEvent.click(screen.getByText('Enter'));
    await screen.findByText('Exit'); fireEvent.click(screen.getByText('Exit'));
    expect(screen.getByTestId('viewer').className).toBe('');
    expect(document.body.style.overflow).toBe('');
  });
  test('API nativa: sincronitza fullscreenchange, botó i Escape del navegador', async () => {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, writable: true, value: null });
    HTMLElement.prototype.requestFullscreen = vi.fn(function () { document.fullscreenElement = this; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); });
    document.exitFullscreen = vi.fn(() => { document.fullscreenElement = null; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); });
    render(<Viewer />); fireEvent.click(screen.getByText('Enter'));
    await screen.findByText('Exit'); fireEvent.click(screen.getByText('Exit'));
    await screen.findByText('Enter'); expect(document.exitFullscreen).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Enter')); await screen.findByText('Exit');
    act(() => { document.fullscreenElement = null; document.dispatchEvent(new Event('fullscreenchange')); });
    expect(screen.getByText('Enter')).toBeTruthy();
  });
  test('reserva amb API popover: puja a la capa superior i en baixa en eixir (Onada R11)', async () => {
    const show = vi.fn(), hide = vi.fn();
    HTMLElement.prototype.showPopover = show; HTMLElement.prototype.hidePopover = hide;
    try {
      render(<Viewer />); fireEvent.click(screen.getByText('Enter'));
      await screen.findByText('Exit');
      expect(screen.getByTestId('viewer').getAttribute('popover')).toBe('manual');
      expect(show).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByText('Exit'));
      expect(hide).toHaveBeenCalledOnce();
      expect(screen.getByTestId('viewer').hasAttribute('popover')).toBe(false);
    } finally { delete HTMLElement.prototype.showPopover; delete HTMLElement.prototype.hidePopover; }
  });
  test('VIS-03 · en eixir de la reserva, cada pare desplaçable torna on es llegia (també el que era a 0)', async () => {
    const avi = document.createElement('div'), pare = document.createElement('div');
    avi.appendChild(pare); document.body.appendChild(avi);
    try {
      avi.scrollTop = 380;
      render(<Viewer />, { container: pare });
      const enter = screen.getByRole('button', { name: 'Enter' }); enter.focus();
      fireEvent.click(enter);
      await screen.findByText('Exit');
      // El focus que camina dins de la capa superior desplaça els pares de darrere.
      avi.scrollTop = 2640; pare.scrollTop = 120;
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByTestId('viewer').className).toBe('');
      expect(avi.scrollTop).toBe(380);
      expect(pare.scrollTop).toBe(0);
      expect(document.activeElement).toBe(enter);
    } finally { cleanup(); avi.remove(); }
  });
  test('desmuntatge de la reserva restaura el scroll de la pàgina', async () => {
    const view = render(<Viewer />); fireEvent.click(screen.getByText('Enter')); await screen.findByText('Exit');
    view.unmount(); expect(document.body.style.overflow).toBe('');
  });
});

/* A11Y-01 · A pantalla completa la pàgina de darrere no es veu: el focus no hi pot anar, ni amb Tab ni
   després d'un clic en una zona sense control (abans, 14 de 14 Tab queien en controls amagats). */
function Visor() {
  const { elementRef, isFullscreen, toggleFullscreen } = useElementFullscreen();
  return <section ref={elementRef} data-testid="visor" aria-labelledby="t">
    <h3 id="t">Pou</h3>
    <button onClick={toggleFullscreen}>{isFullscreen ? 'Exit' : 'Enter'}</button>
    <div data-testid="vista">vista sense control</div>
    <button>Mig</button>
    <button>Darrer</button>
  </section>;
}
describe('A11Y-01 · contenció del focus a pantalla completa', () => {
  const tab = (shiftKey = false) => fireEvent.keyDown(document.activeElement ?? document, { key: 'Tab', shiftKey });
  const pagina = () => {
    const fora = document.createElement('button');
    fora.textContent = 'Connectar';
    document.body.append(fora);
    return fora;
  };
  beforeEach(() => {
    // JSDOM no fa maquetació: cada element visible té una caixa (els [hidden], cap).
    vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function caixes() { return this.closest('[hidden]') ? [] : [{ width: 1, height: 1 }]; });
  });

  test('reserva: modal i enfocable; Tab i Maj+Tab giren dins, també des de l’element o des de fora', async () => {
    const fora = pagina();
    try {
      render(<Visor />);
      const visor = screen.getByTestId('visor');
      const entra = screen.getByRole('button', { name: 'Enter' }); entra.focus();
      fireEvent.click(entra);
      const ix = await screen.findByRole('button', { name: 'Exit' });
      const darrer = screen.getByRole('button', { name: 'Darrer' });
      expect([visor.getAttribute('tabindex'), visor.getAttribute('role'), visor.getAttribute('aria-modal')]).toEqual(['-1', 'dialog', 'true']);
      // Un clic a la vista (cap control) deixa el focus a l'element, no a la pàgina.
      visor.focus();
      expect(document.activeElement).toBe(visor);
      tab(); expect(document.activeElement).toBe(ix);
      visor.focus();
      tab(true); expect(document.activeElement).toBe(darrer);
      tab(); expect(document.activeElement).toBe(ix);
      tab(true); expect(document.activeElement).toBe(darrer);
      // El focus a la pàgina de darrere (o a enlloc): Tab torna dins.
      act(() => fora.focus());
      await waitFor(() => expect(document.activeElement).toBe(ix));
      act(() => document.activeElement.blur());
      tab(); expect(document.activeElement).toBe(ix);
      // En eixir, l'element torna a ser una secció normal i el focus és lliure.
      fireEvent.keyDown(document, { key: 'Escape' });
      expect([visor.hasAttribute('tabindex'), visor.hasAttribute('role'), visor.hasAttribute('aria-modal')]).toEqual([false, false, false]);
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Enter' }));
      act(() => fora.focus());
      await new Promise((r) => { setTimeout(r, 10); });
      expect(document.activeElement).toBe(fora);
    } finally { fora.remove(); }
  });

  test('si el focus ix de l’element, torna al primer control; si la finestra perd el focus, no es toca', async () => {
    const fora = pagina();
    try {
      render(<Visor />);
      fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
      const ix = await screen.findByRole('button', { name: 'Exit' });
      const mig = screen.getByRole('button', { name: 'Mig' });
      mig.focus();
      // Canvi d'aplicació: blur sense destí, però el control continua actiu.
      fireEvent.focusOut(mig, { relatedTarget: null });
      await new Promise((r) => { setTimeout(r, 10); });
      expect(document.activeElement).toBe(mig);
      act(() => fora.focus());
      await waitFor(() => expect(document.activeElement).toBe(ix));
    } finally { fora.remove(); }
  });

  test('API nativa: la mateixa contenció mentre dura, i res en eixir', async () => {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, writable: true, value: null });
    HTMLElement.prototype.requestFullscreen = vi.fn(function () { document.fullscreenElement = this; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); });
    const fora = pagina();
    try {
      render(<Visor />);
      const visor = screen.getByTestId('visor');
      fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
      const ix = await screen.findByRole('button', { name: 'Exit' });
      expect(visor.getAttribute('aria-modal')).toBe('true');
      expect(visor.hasAttribute('popover')).toBe(false);
      act(() => fora.focus());
      await waitFor(() => expect(document.activeElement).toBe(ix));
      tab(true); expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Darrer' }));
      act(() => { document.fullscreenElement = null; document.dispatchEvent(new Event('fullscreenchange')); });
      expect(visor.hasAttribute('aria-modal')).toBe(false);
      expect(visor.hasAttribute('tabindex')).toBe(false);
    } finally { fora.remove(); }
  });

  test('incrustat en un shadow root: el focus de veritat és el de l’arrel, no el del document', async () => {
    const amfitrio = document.createElement('div');
    document.body.append(amfitrio);
    const arrel = amfitrio.attachShadow({ mode: 'open' });
    const muntatge = document.createElement('div');
    arrel.append(muntatge);
    try {
      render(<Visor />, { container: muntatge });
      const dins = within(muntatge);
      fireEvent.click(dins.getByRole('button', { name: 'Enter' }));
      const ix = await dins.findByRole('button', { name: 'Exit' });
      const visor = dins.getByTestId('visor');
      visor.focus();
      expect(arrel.activeElement).toBe(visor);
      fireEvent.keyDown(visor, { key: 'Tab' });
      expect(arrel.activeElement).toBe(ix);
    } finally { cleanup(); amfitrio.remove(); }
  });

  test('V2C-01 · API nativa dins d’un shadow root: el document diu l’amfitrió, l’arrel diu el visor', async () => {
    const amfitrio = document.createElement('div');
    document.body.append(amfitrio);
    const arrel = amfitrio.attachShadow({ mode: 'closed' });
    const muntatge = document.createElement('div');
    arrel.append(muntatge);
    let plena = null;
    // Com al navegador: el document reté l'amfitrió i el shadow root, l'element de veritat.
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => (plena ? amfitrio : null) });
    Object.defineProperty(arrel, 'fullscreenElement', { configurable: true, get: () => plena });
    HTMLElement.prototype.requestFullscreen = vi.fn(function () { plena = this; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); });
    document.exitFullscreen = vi.fn(() => { plena = null; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); });
    try {
      render(<Visor />, { container: muntatge });
      const dins = within(muntatge);
      fireEvent.click(dins.getByRole('button', { name: 'Enter' }));
      const ix = await dins.findByRole('button', { name: 'Exit' });
      const visor = dins.getByTestId('visor');
      expect(visor.getAttribute('aria-modal')).toBe('true');
      visor.focus();
      fireEvent.keyDown(visor, { key: 'Tab' });
      expect(arrel.activeElement).toBe(ix);
      fireEvent.click(ix);
      await dins.findByRole('button', { name: 'Enter' });
      expect(document.exitFullscreen).toHaveBeenCalledOnce();
      expect(visor.hasAttribute('aria-modal')).toBe(false);
    } finally { cleanup(); amfitrio.remove(); }
  });
});
