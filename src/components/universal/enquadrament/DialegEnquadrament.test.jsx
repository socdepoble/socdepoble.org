import { StrictMode, useState } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { DialegEnquadrament, ERROR_CARREGA_FITXER, ERROR_CARREGA_URL, ERROR_EXPORTA } from './DialegEnquadrament.jsx';

/* T46 (ordre del Mestre, 260928) · el diàleg d'enquadrament. jsdom no té
   canvas: el carregador, l'exportador i el dibuix s'injecten. */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const DESAR = 'Desar l’enquadrament';
const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

function munta({ font = foto(), imatge = {}, ...props } = {}) {
  const img = { amplada: 4000, alcada: 2000, tipus: 'image/jpeg', element: { soc: 'element' }, allibera: vi.fn(), ...imatge };
  const eines = {
    carregador: vi.fn(async () => img),
    exportador: vi.fn(async () => new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' })),
    dibuixant: vi.fn(() => true),
    onDesa: vi.fn(async () => true),
    onTanca: vi.fn(),
    ...props,
  };
  const vista = render(<DialegEnquadrament font={font} {...eines} />);
  return { ...vista, img, font, ...eines };
}

const carregat = async (vista) => {
  await act(async () => {});
  return vista.getByLabelText('Ampliació');
};
const radios = (container) => [...container.querySelectorAll('input[type="radio"]')];

/* Directiva del Mestre (261024, àudio 22:47) · Actualitzada a posta: el
   model porta ara també 3:2, 21:9, 4:5, 3:4 i 9:16 (abans, 1:1, Original,
   4:3 i 16:9); el quadrat continua primer i marcat. */
test('T46 · per defecte, el quadrat està marcat i les formes van en l’ordre del model', async () => {
  const vista = munta();
  expect(vista.getByRole('dialog', { name: 'Enquadrar la imatge' })).toBeTruthy();
  await carregat(vista);
  expect(radios(vista.container).map((r) => r.value)).toEqual(['1:1', 'original', '4:3', '3:2', '16:9', '21:9', '4:5', '3:4', '9:16']);
  expect(radios(vista.container).find((r) => r.checked).value).toBe('1:1');
  expect(vista.container.querySelector('legend').textContent).toBe('Forma');
  // El visor pinta el quadrat central de la foto.
  expect(vista.dibuixant).toHaveBeenLastCalledWith(vista.container.querySelector('canvas'), vista.img.element, { x: 1000, y: 0, w: 2000, h: 2000 });
  expect(vista.container.querySelector('canvas').getAttribute('width')).toBe('960');
  expect(vista.container.querySelector('canvas').getAttribute('height')).toBe('960');
});

/* Correcció C19 (260928) · Foto i lliscadors alhora: la vista (visor + ajuda)
   i els controls són les dues peces de la graella; els lliscadors, abans que
   la forma també en el DOM (l'ordre del focus és el que es veu). */
test('C19 · anatomia: vista i controls germans; els lliscadors abans de la forma; el diàleg porta la seua classe', async () => {
  const vista = munta();
  const zoom = await carregat(vista);
  const dialeg = vista.getByRole('dialog', { name: 'Enquadrar la imatge' });
  expect(dialeg.classList.contains('sdp-enquadrament__dialeg')).toBe(true);
  const obra = vista.container.querySelector('.sdp-enquadrament__obra');
  expect([...obra.children].map((e) => e.className)).toEqual(['sdp-enquadrament__vista', 'sdp-enquadrament__controls']);
  const peca = obra.querySelector('.sdp-enquadrament__vista');
  expect(peca.querySelector('canvas')).toBeTruthy();
  expect(peca.querySelector('.sdp-camp__ajuda').textContent).not.toContain('de davall');
  const forma = vista.container.querySelector('fieldset');
  expect(zoom.compareDocumentPosition(forma) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(vista.getByLabelText('Posició vertical').compareDocumentPosition(forma) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.querySelector('[style]')).toBeNull();
});

test('T46 · mentre carrega, un estat de càrrega i «Desar» desactivat', async () => {
  let resol;
  const vista = munta({ carregador: vi.fn(() => new Promise((r) => { resol = r; })) });
  expect(vista.getByRole('status').textContent).toContain('Obrint la imatge…');
  expect(vista.getByRole('button', { name: DESAR }).disabled).toBe(true);
  await act(async () => resol({ amplada: 800, alcada: 800, tipus: 'image/png', element: {}, allibera: vi.fn() }));
  expect(vista.getByRole('button', { name: DESAR }).disabled).toBe(false);
});

test('T46 · una panoràmica en quadrat: la vertical no es mou; l’ampliació es llig en percentatge', async () => {
  const vista = munta();
  const zoom = await carregat(vista);
  const horitzontal = vista.getByLabelText('Posició horitzontal');
  const vertical = vista.getByLabelText('Posició vertical');
  expect(vertical.disabled).toBe(true);
  expect(vertical.getAttribute('aria-describedby')).toBeTruthy();
  expect(horitzontal.disabled).toBe(false);
  expect(horitzontal.value).toBe('50');
  expect(zoom.getAttribute('aria-valuetext')).toBe('100 %');
  act(() => { fireEvent.change(zoom, { target: { value: '2' } }); });
  expect(zoom.getAttribute('aria-valuetext')).toBe('200 %');
  expect(vertical.disabled).toBe(false);
  act(() => { fireEvent.change(horitzontal, { target: { value: '0' } }); });
  expect(vista.dibuixant.mock.lastCall[2]).toEqual({ x: 0, y: 500, w: 1000, h: 1000 });
});

test('T46 · «Desar» en quadrat exporta el retall a 1200 px i el passa a onDesa; mentre desa, aria-busy', async () => {
  let resol;
  const onDesa = vi.fn(() => new Promise((r) => { resol = r; }));
  const vista = munta({ onDesa });
  await carregat(vista);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(vista.exportador).toHaveBeenCalledWith(vista.img.element, { x: 1000, y: 0, w: 2000, h: 2000 },
    { amplada: 1200, alcada: 1200, tipus: 'image/jpeg' });
  expect(onDesa).toHaveBeenCalledTimes(1);
  const [fitxer, info] = onDesa.mock.calls[0];
  expect(fitxer).toBeInstanceOf(File);
  expect(fitxer.name).toBe('enquadrament.jpg');
  expect(info).toEqual({ format: '1:1', rect: { x: 1000, y: 0, w: 2000, h: 2000 }, sencera: false });
  const peu = vista.container.querySelector('.sdp-dialeg__peu');
  expect(peu.querySelector('[aria-busy="true"]')).not.toBeNull();
  // Mentre desa, la X no el tanca; Escape, sí (el navegador el tancaria igualment).
  fireEvent.click(vista.getByRole('button', { name: 'Tancar' }));
  expect(vista.onTanca).not.toHaveBeenCalled();
  await act(async () => resol(true));
  expect(peu.querySelector('[aria-busy="true"]')).toBeNull();
});

test('T46 · «Original» sense zoom amb una foto nova torna el MATEIX fitxer, sense exportar res', async () => {
  const vista = munta();
  await carregat(vista);
  act(() => { fireEvent.click(radios(vista.container).find((r) => r.value === 'original')); });
  expect(vista.getByLabelText('Posició horitzontal').disabled).toBe(true);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(vista.exportador).not.toHaveBeenCalled();
  // Onada 4, T3a · el tercer argument (metadades) va sempre; sense geolocalització, tot null.
  expect(vista.onDesa).toHaveBeenCalledWith(vista.font, { format: 'original', rect: { x: 0, y: 0, w: 4000, h: 2000 }, sencera: true },
    { geolocalitzacio: null, dataCaptura: null });
});

test('T46 · «Original» sense zoom sobre una imatge ja desada: no hi ha res a desar i es tanca', async () => {
  const vista = munta({ font: '/assets/h.jpg' });
  await carregat(vista);
  act(() => { fireEvent.click(radios(vista.container).find((r) => r.value === 'original')); });
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(vista.onDesa).not.toHaveBeenCalled();
  expect(vista.onTanca).toHaveBeenCalledWith('boto');
});

test('T46 · si la imatge no es pot obrir, alerta en línia i «Desar» desactivat', async () => {
  const url = munta({ font: 'https://altre.example/h.jpg', carregador: vi.fn(async () => { throw new TypeError('Failed to fetch'); }) });
  await act(async () => {});
  expect(url.getByRole('alert').textContent).toBe(ERROR_CARREGA_URL);
  expect(url.getByRole('button', { name: DESAR }).disabled).toBe(true);
  expect(url.container.querySelector('canvas')).toBeNull();
  cleanup();
  const fitxer = munta({ carregador: vi.fn(async () => { throw new Error('decode'); }) });
  await act(async () => {});
  expect(fitxer.getByRole('alert').textContent).toBe(ERROR_CARREGA_FITXER);
});

test('T46 · en desmuntar, allibera la imatge carregada', async () => {
  const vista = munta();
  await carregat(vista);
  expect(vista.img.allibera).not.toHaveBeenCalled();
  vista.unmount();
  expect(vista.img.allibera).toHaveBeenCalledTimes(1);
});

test('T46 · arrossegar amb el punter mou el marc; «Centrar» el torna al mig', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 400, width: 400, height: 400 });
  const vista = munta();
  await carregat(vista);
  const canvas = vista.container.querySelector('canvas');
  expect(canvas.getAttribute('role')).toBe('img');
  expect(canvas.getAttribute('aria-label')).toBe('Previsualització de l’enquadrament');
  act(() => {
    fireEvent.pointerDown(canvas, { pointerId: 1, button: 0, buttons: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 1, clientX: 140, clientY: 100 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 140, clientY: 100 });
  });
  // s = 400 / 2000; dx = 40 → cx = 0,5 − 40 / (0,2 · 4000) = 0,45 → (0,45 − 0,25) / 0,5 = 40 %.
  expect(vista.getByLabelText('Posició horitzontal').value).toBe('40');
  // Després d'alliberar, moure el punter ja no arrossega.
  act(() => { fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 1, clientX: 300, clientY: 100 }); });
  expect(vista.getByLabelText('Posició horitzontal').value).toBe('40');
  act(() => { fireEvent.click(vista.getByRole('button', { name: 'Centrar' })); });
  expect(vista.getByLabelText('Posició horitzontal').value).toBe('50');
});

test('T46 · amb dos punters, el pessic amplia', async () => {
  const vista = munta();
  const zoom = await carregat(vista);
  const canvas = vista.container.querySelector('canvas');
  act(() => {
    fireEvent.pointerDown(canvas, { pointerId: 1, button: 0, buttons: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerDown(canvas, { pointerId: 2, button: 0, buttons: 1, clientX: 200, clientY: 100 });
    fireEvent.pointerMove(canvas, { pointerId: 2, buttons: 1, clientX: 300, clientY: 100 });
  });
  expect(zoom.getAttribute('aria-valuetext')).toBe('200 %');
});

/* Poliment T46 (ordre del Mestre, 260928) · Punters del visor: el botó dret
   (menú contextual) no arrossega; un moviment sense cap botó premut (el
   pointerup s'ha perdut fora de la finestra) allibera; perdre la captura,
   també. */
test('T46 · el botó dret del ratolí no arrossega ni bloqueja el menú contextual', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 400, width: 400, height: 400 });
  const vista = munta();
  await carregat(vista);
  const canvas = vista.container.querySelector('canvas');
  let baixada;
  act(() => {
    baixada = fireEvent.pointerDown(canvas, { pointerId: 1, pointerType: 'mouse', button: 2, buttons: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canvas, { pointerId: 1, pointerType: 'mouse', buttons: 2, clientX: 140, clientY: 100 });
  });
  // fireEvent torna false si s'ha cridat preventDefault: el menú contextual no es toca.
  expect(baixada).toBe(true);
  expect(vista.getByLabelText('Posició horitzontal').value).toBe('50');
});

test('T46 · un moviment sense cap botó premut, o perdre la captura, allibera el punter', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 400, width: 400, height: 400 });
  const vista = munta();
  await carregat(vista);
  const canvas = vista.container.querySelector('canvas');
  const horitzontal = () => vista.getByLabelText('Posició horitzontal').value;
  act(() => {
    fireEvent.pointerDown(canvas, { pointerId: 1, button: 0, buttons: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 0, clientX: 140, clientY: 100 });
    fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 1, clientX: 180, clientY: 100 });
  });
  expect(horitzontal()).toBe('50');
  act(() => {
    fireEvent.pointerDown(canvas, { pointerId: 2, button: 0, buttons: 1, clientX: 100, clientY: 100 });
    fireEvent.lostPointerCapture(canvas, { pointerId: 2 });
    fireEvent.pointerMove(canvas, { pointerId: 2, buttons: 1, clientX: 140, clientY: 100 });
  });
  expect(horitzontal()).toBe('50');
});

test('T46 · si onDesa llança, el missatge ix dins del diàleg i continua obert', async () => {
  const onDesa = vi.fn(async () => { throw new Error('La imatge no s’ha pogut pujar.'); });
  const vista = munta({ onDesa });
  await carregat(vista);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(vista.getByRole('alert').textContent).toBe('La imatge no s’ha pogut pujar.');
  expect(vista.getByRole('button', { name: DESAR }).disabled).toBe(false);
  expect(vista.onTanca).not.toHaveBeenCalled();
});

test('T46 · si l’exportació falla, avís en línia i onDesa no es crida', async () => {
  const vista = munta({ exportador: vi.fn(async () => { throw new Error('SecurityError'); }) });
  await carregat(vista);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(vista.getByRole('alert').textContent).toBe(ERROR_EXPORTA);
  expect(vista.onDesa).not.toHaveBeenCalled();
});

/* L'avís de desat no pot quedar davall del visor i dels lliscadors: el cos del
   diàleg fa scroll i «Desar» és al peu fix. jsdom no té scrollIntoView: s'emula
   i es restituïx el prototip en acabar. */
async function ambScroll(prova) {
  const proto = Element.prototype;
  const original = Object.getOwnPropertyDescriptor(proto, 'scrollIntoView');
  const cridades = [];
  proto.scrollIntoView = function scrollIntoView(opcions) { cridades.push({ element: this, opcions }); };
  try {
    await prova(cridades);
  } finally {
    if (original) Object.defineProperty(proto, 'scrollIntoView', original);
    else delete proto.scrollIntoView;
  }
}

test('T46 · l’avís de desat ix el primer, davant del visor, i es porta a la vista a cada intent fallit', async () => {
  await ambScroll(async (cridades) => {
    const onDesa = vi.fn(async () => { throw new Error('La imatge no s’ha pogut pujar.'); });
    const vista = munta({ onDesa });
    await carregat(vista);
    expect(cridades).toHaveLength(0);
    await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
    const cos = vista.container.querySelector('.sdp-enquadrament');
    const alerta = vista.getByRole('alert');
    expect(cos.firstElementChild).toBe(alerta);
    expect(cridades).toEqual([{ element: alerta, opcions: { block: 'nearest' } }]);
    // Un segon intent amb el mateix error el torna a portar a la vista.
    await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
    expect(onDesa).toHaveBeenCalledTimes(2);
    expect(cridades).toHaveLength(2);
    expect(cridades[1].element).toBe(vista.getByRole('alert'));
  });
});

test('T46 · l’avís d’exportació fallida també ix el primer i es porta a la vista', async () => {
  await ambScroll(async (cridades) => {
    const vista = munta({ exportador: vi.fn(async () => { throw new Error('SecurityError'); }) });
    await carregat(vista);
    await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
    const alerta = vista.getByRole('alert');
    expect(alerta.textContent).toBe(ERROR_EXPORTA);
    expect(vista.container.querySelector('.sdp-enquadrament').firstElementChild).toBe(alerta);
    expect(cridades).toEqual([{ element: alerta, opcions: { block: 'nearest' } }]);
  });
});

test('T46 · Escape tanca; el vel no', async () => {
  const vista = munta();
  await carregat(vista);
  const dialeg = vista.getByRole('dialog');
  fireEvent.click(dialeg);
  expect(vista.onTanca).not.toHaveBeenCalled();
  fireEvent(dialeg, new Event('cancel', { cancelable: true }));
  expect(vista.onTanca).toHaveBeenCalledWith('esc');
});

function Arnes(props) {
  const [obert, setObert] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setObert(true)}>Obri</button>
      {obert ? <DialegEnquadrament {...props} onTanca={() => setObert(false)} /> : null}
    </>
  );
}

test('T46 · en cancel·lar, el focus torna al botó que l’ha obert', async () => {
  const carregador = vi.fn(async () => ({ amplada: 1000, alcada: 500, tipus: 'image/jpeg', element: {}, allibera: vi.fn() }));
  const vista = render(<Arnes font={foto()} carregador={carregador} dibuixant={() => true} onDesa={vi.fn()} />);
  const obri = vista.getByRole('button', { name: 'Obri' });
  obri.focus();
  await act(async () => { fireEvent.click(obri); });
  vista.getByLabelText('Ampliació').focus();
  expect(document.activeElement).not.toBe(obri);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Cancel·lar' })); });
  expect(vista.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(obri);
});

/* Regressió vista al navegador: StrictMode (App.jsx) repetix els efectes en
   desenvolupament i, amb un modal de veres, la segona captura ja trobava el
   focus dins del diàleg. jsdom no té showModal ni inert: s'emulen com als
   navegadors (el focus entra al diàleg i la resta no el pot rebre). */
test('T46 · amb StrictMode i un modal de veres, el focus torna igualment al botó que l’ha obert', async () => {
  const dialeg = HTMLDialogElement.prototype;
  const element = HTMLElement.prototype;
  const originals = [
    [dialeg, 'showModal', Object.getOwnPropertyDescriptor(dialeg, 'showModal')],
    [dialeg, 'close', Object.getOwnPropertyDescriptor(dialeg, 'close')],
    [element, 'focus', Object.getOwnPropertyDescriptor(element, 'focus')],
  ];
  const focusNatiu = element.focus;
  dialeg.showModal = function showModal() {
    this.setAttribute('open', '');
    this.dataset.modal = '';
    this.querySelector('button')?.focus();
  };
  dialeg.close = function close() {
    this.removeAttribute('open');
    delete this.dataset.modal;
  };
  element.focus = function focus(...args) {
    const modal = document.querySelector('dialog[data-modal]');
    if (modal && !modal.contains(this)) return undefined; // inert
    return focusNatiu.apply(this, args);
  };
  try {
    const carregador = vi.fn(async () => ({ amplada: 1000, alcada: 500, tipus: 'image/jpeg', element: {}, allibera: vi.fn() }));
    const vista = render(
      <StrictMode>
        <Arnes font={foto()} carregador={carregador} dibuixant={() => true} onDesa={vi.fn()} />
      </StrictMode>
    );
    const obri = vista.getByRole('button', { name: 'Obri' });
    obri.focus();
    await act(async () => { fireEvent.click(obri); });
    expect(vista.getByRole('dialog').contains(document.activeElement)).toBe(true);
    await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Cancel·lar' })); });
    expect(vista.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(obri);
  } finally {
    for (const [objectiu, clau, descriptor] of originals) {
      if (descriptor) Object.defineProperty(objectiu, clau, descriptor);
      else delete objectiu[clau];
    }
  }
});
