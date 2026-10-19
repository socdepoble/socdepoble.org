import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DialegEnquadrament, ETIQUETA_CANVIA_FOTO } from './DialegEnquadrament.jsx';
import { configDeForma } from './useEnquadramentImatge.jsx';

/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2) · «Agrupa
   "Canviar foto", "Llevar avatar" i "Guardar enquadre" dins del propi
   diàleg.» Les props opcionals noves del mode senzill (onCanviaFoto,
   ajudaFoto, onLleva, etiquetaLleva, etiquetaDesa). Sense elles, el diàleg és
   el de sempre (l'últim bloc ho fixa). jsdom no té canvas: el carregador,
   l'exportador i el dibuix s'injecten. */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const foto = (nom = 'foto.png', tipus = 'image/png') => new File(['x'], nom, { type: tipus });
const AJUDA = 'PNG, JPEG o WebP, fins a 10 MB.';

function props({ font = 'https://mitjans.test/avatar.webp', imatge = {}, ...resta } = {}) {
  const cfg = configDeForma('avatar');
  const img = { amplada: 4000, alcada: 2000, tipus: 'image/png', element: { soc: 'element' }, allibera: vi.fn(), ...imatge };
  return {
    font, senzill: true, mascara: cfg.mascara, formatInicial: cfg.formatInicial, formats: cfg.formats,
    sortida: cfg.sortida(font), titol: cfg.titol, descripcio: cfg.descripcio,
    carregador: vi.fn(async () => img),
    exportador: vi.fn(async () => new File(['y'], 'enquadrament.png', { type: 'image/png' })),
    dibuixant: vi.fn(() => true),
    onDesa: vi.fn(async () => true),
    onTanca: vi.fn(),
    ...resta,
  };
}
const carregat = () => act(async () => {});
const dialeg = (vista) => vista.getByRole('dialog');
const boto = (vista, nom) => within(dialeg(vista)).getByRole('button', { name: nom });
const selectorDins = (vista) => dialeg(vista).querySelector('input[type="file"][data-enquadrament-foto]');
const zoom = (vista) => vista.getByLabelText('Ampliació');

describe('Pla 2000 · «Canviar foto» dins del diàleg', () => {
  test('el botó i el seu selector són DINS del diàleg; el botó clica el selector; els formats el descriuen', async () => {
    const p = props({ onCanviaFoto: vi.fn(() => null), ajudaFoto: AJUDA, acceptFoto: 'image/png,image/jpeg,image/webp' });
    const vista = render(<DialegEnquadrament {...p} />);
    await carregat();
    const canvia = within(dialeg(vista)).getByRole('button', { name: ETIQUETA_CANVIA_FOTO, description: AJUDA });
    expect(canvia.className).toContain('sdp-boto--secundari');
    const entrada = selectorDins(vista);
    expect(dialeg(vista).contains(entrada)).toBe(true);
    expect(entrada.getAttribute('accept')).toBe('image/png,image/jpeg,image/webp');
    expect(entrada.getAttribute('tabindex')).toBe('-1');
    expect(entrada.getAttribute('aria-hidden')).toBe('true');
    const clic = vi.spyOn(entrada, 'click');
    fireEvent.click(canvia);
    expect(clic).toHaveBeenCalledTimes(1);
    // La fila va davall del visor i de la fila de zoom.
    const fila = dialeg(vista).querySelector('.sdp-enquadrament__foto');
    expect(fila.querySelector('.sdp-camp__ajuda').textContent).toBe(AJUDA);
    expect(Boolean(dialeg(vista).querySelector('.sdp-enquadrament__zoom').compareDocumentPosition(fila) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(document.querySelector('[style]')).toBeNull();
  });

  test('una foto triada va al pare; si la rebutja, l’avís ix dins i la d’abans es queda', async () => {
    const onCanviaFoto = vi.fn(() => 'Només pots pujar fotos PNG, JPEG o WebP.');
    const p = props({ onCanviaFoto });
    const vista = render(<DialegEnquadrament {...p} />);
    await carregat();
    const gif = foto('a.gif', 'image/gif');
    await act(async () => { fireEvent.change(selectorDins(vista), { target: { files: [gif] } }); });
    expect(onCanviaFoto).toHaveBeenCalledWith(gif);
    expect(within(dialeg(vista)).getByRole('alert').textContent).toBe('Només pots pujar fotos PNG, JPEG o WebP.');
    expect(p.carregador).toHaveBeenCalledTimes(1);
    expect(p.onTanca).not.toHaveBeenCalled();
  });

  test('acceptada, el pare canvia `font`: la foto nova s’obri en el mateix diàleg, centrada i sense zoom, i l’avís se’n va', async () => {
    let font = 'https://mitjans.test/avatar.webp';
    const onCanviaFoto = vi.fn((fitxer) => {
      if (fitxer.type === 'image/gif') return 'No.';
      font = fitxer;
      return null;
    });
    const p = props({ onCanviaFoto });
    const vista = render(<DialegEnquadrament {...p} font={font} />);
    await carregat();
    act(() => { fireEvent.change(zoom(vista), { target: { value: '3' } }); });
    expect(zoom(vista).getAttribute('aria-valuetext')).toBe('300 %');
    await act(async () => { fireEvent.change(selectorDins(vista), { target: { files: [foto('a.gif', 'image/gif')] } }); });
    expect(within(dialeg(vista)).getByRole('alert')).toBeTruthy();
    const d = dialeg(vista);
    const nova = foto('nova.png');
    await act(async () => { fireEvent.change(selectorDins(vista), { target: { files: [nova] } }); });
    vista.rerender(<DialegEnquadrament {...p} font={font} />);
    await carregat();
    expect(p.carregador).toHaveBeenLastCalledWith(nova, expect.anything());
    expect(dialeg(vista)).toBe(d);
    expect(within(d).queryByRole('alert')).toBeNull();
    expect(zoom(vista).getAttribute('aria-valuetext')).toBe('100 %');
    expect(p.dibuixant).toHaveBeenLastCalledWith(expect.anything(), expect.anything(), { x: 1000, y: 0, w: 2000, h: 2000 });
  });

  test('tancar el selector sense triar (cancel a l’input) no tanca el diàleg; un canvi buit no fa res', async () => {
    const onCanviaFoto = vi.fn(() => null);
    const p = props({ onCanviaFoto });
    const vista = render(<DialegEnquadrament {...p} />);
    await carregat();
    fireEvent(selectorDins(vista), new Event('cancel', { bubbles: true, cancelable: true }));
    expect(p.onTanca).not.toHaveBeenCalled();
    await act(async () => { fireEvent.change(selectorDins(vista), { target: { files: [] } }); });
    expect(onCanviaFoto).not.toHaveBeenCalled();
    // L'Escape del diàleg continua tancant.
    fireEvent(dialeg(vista), new Event('cancel', { cancelable: true }));
    expect(p.onTanca).toHaveBeenLastCalledWith('esc');
  });

  test('sense imatge (una adreça que no s’ha pogut obrir), «Canviar foto» hi és: n’és l’eixida', async () => {
    const p = props({ onCanviaFoto: vi.fn(() => null), carregador: vi.fn(async () => { throw new Error('CORS'); }) });
    const vista = render(<DialegEnquadrament {...p} />);
    await carregat();
    expect(within(dialeg(vista)).getByRole('alert').textContent).toContain('No s’ha pogut obrir esta imatge');
    expect(boto(vista, ETIQUETA_CANVIA_FOTO).disabled).toBe(false);
    expect(boto(vista, 'Guardar').disabled).toBe(true);
  });
});

describe('Pla 2000 · «Llevar» i el nom del botó principal', () => {
  test('onLleva: el botó amb el seu nom, que crida el pare; mentre desa, desactivat (com «Canviar foto»)', async () => {
    let acaba;
    const onLleva = vi.fn();
    const p = props({
      onLleva, etiquetaLleva: 'Llevar avatar', onCanviaFoto: vi.fn(() => null), etiquetaDesa: 'Guardar enquadre',
      onDesa: vi.fn(() => new Promise((r) => { acaba = r; })),
    });
    const vista = render(<DialegEnquadrament {...p} />);
    await carregat();
    const fila = dialeg(vista).querySelector('.sdp-enquadrament__foto-accions');
    expect([...fila.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Canviar foto', 'Llevar avatar']);
    fireEvent.click(boto(vista, 'Llevar avatar'));
    expect(onLleva).toHaveBeenCalledTimes(1);
    expect([...dialeg(vista).querySelectorAll('.sdp-dialeg__peu button')].map((b) => b.textContent)).toEqual(['Restablir', 'Cancel·lar', 'Guardar enquadre']);
    await act(async () => { fireEvent.click(boto(vista, 'Guardar enquadre')); });
    expect(boto(vista, 'Llevar avatar').disabled).toBe(true);
    expect(boto(vista, 'Canviar foto').disabled).toBe(true);
    await act(async () => { acaba(true); });
    expect(boto(vista, 'Llevar avatar').disabled).toBe(false);
  });

  test('etiquetaDesa també val per al T46 (sense `senzill`); allí no hi ha cap fila de la foto', async () => {
    const p = props({ senzill: false, mascara: null, etiquetaDesa: 'Desar', onCanviaFoto: vi.fn(), onLleva: vi.fn() });
    const vista = render(<DialegEnquadrament {...p} />);
    await carregat();
    expect(boto(vista, 'Desar')).toBeTruthy();
    expect(dialeg(vista).querySelector('.sdp-enquadrament__foto')).toBeNull();
    expect(selectorDins(vista)).toBeNull();
  });

  test('regressió · sense les props noves, el mode senzill és el de sempre: cap fila de la foto ni selector, «Guardar»', async () => {
    const vista = render(<DialegEnquadrament {...props()} />);
    await carregat();
    expect(dialeg(vista).querySelector('.sdp-enquadrament__foto')).toBeNull();
    expect(dialeg(vista).querySelector('input[type="file"]')).toBeNull();
    expect([...dialeg(vista).querySelectorAll('.sdp-dialeg__peu button')].map((b) => b.textContent)).toEqual(['Restablir', 'Cancel·lar', 'Guardar']);
  });

  test('regressió · sense onCanviaFoto, una `font` nova conserva el zoom d’abans dins dels límits nous (com sempre)', async () => {
    const p = props();
    const vista = render(<DialegEnquadrament {...p} />);
    await carregat();
    act(() => { fireEvent.change(zoom(vista), { target: { value: '3' } }); });
    vista.rerender(<DialegEnquadrament {...p} font={foto('nova.png')} />);
    await carregat();
    expect(zoom(vista).getAttribute('aria-valuetext')).toBe('300 %');
  });
});
