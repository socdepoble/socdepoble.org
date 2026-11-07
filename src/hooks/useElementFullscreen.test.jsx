import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
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
  test('desmuntatge de la reserva restaura el scroll de la pàgina', async () => {
    const view = render(<Viewer />); fireEvent.click(screen.getByText('Enter')); await screen.findByText('Exit');
    view.unmount(); expect(document.body.style.overflow).toBe('');
  });
});
