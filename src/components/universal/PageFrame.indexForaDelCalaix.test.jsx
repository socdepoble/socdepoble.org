/* Ordre del Mestre (261026_2126, pla 261026_1615 §5) · El vel de l'Índex
   comença davall de la barra negra (64px i l'àrea segura), que es queda a la
   vista i a l'abast. Un toc a la barra ja no queia al vel: el diàleg
   aria-modal es quedava obert i el menú lateral s'obria damunt. Ara un
   pointerdown fora del vel (en captura, a l'arrel del destí) tanca l'Índex i
   el toc continua al seu botó; el vel conserva el seu clic (cap toc no cau al
   que hi ha davall) i el botó «Índex» que hi apunta no el tanca. La segona i
   la tercera prova són guardes de regressió de les excepcions (passen també
   sense l'oient); la primera i la quarta, no. Les tres del teclat, al final,
   porten el seu compte. */
import React, { useRef } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));

import { PageFrame, TableOfContentsDrawer } from './PageFrame.jsx';

afterEach(() => cleanup());

const NOM_INDEX = 'Taula de continguts';
const index = () => screen.queryByRole('dialog', { name: NOM_INDEX });
const botoIndex = () => screen.getByRole('button', { name: 'Índex de secció' });

/* La barra negra de la closca (header.bar-black de layout.css), fora de la
   pàgina i damunt del vel: el seu botó porta un oient natiu que para la
   propagació, com faria qualsevol control de la barra. */
function BarraNegra({ onMenu }) {
  const boto = useRef(null);
  React.useEffect(() => {
    const node = boto.current;
    const para = (e) => e.stopPropagation();
    node.addEventListener('pointerdown', para);
    return () => node.removeEventListener('pointerdown', para);
  }, []);
  return (
    <header className="bar-black">
      <button ref={boto} type="button" aria-label="Obrir menú" onClick={onMenu} />
    </header>
  );
}

const pagina = (onMenu = () => {}) => (
  <>
    <BarraNegra onMenu={onMenu} />
    <PageFrame chrome="system" title="Document">
      <h2>Primera secció</h2>
      <h3>Segona secció</h3>
    </PageFrame>
  </>
);

test('§5 · obert l’Índex, un toc a la barra negra el tanca i el toc continua al botó de la barra (el menú no s’obri damunt del diàleg)', () => {
  const onMenu = vi.fn();
  render(pagina(onMenu));
  fireEvent.click(botoIndex());
  expect(index()).not.toBeNull();
  const menu = screen.getByRole('button', { name: 'Obrir menú' });
  // Captura: el pointerdown arriba a l'arrel abans que el botó pare la propagació.
  fireEvent.pointerDown(menu);
  expect(index()).toBeNull();
  fireEvent.click(menu);
  expect(onMenu).toHaveBeenCalledTimes(1);
});

test('§5 · un pointerdown dins del calaix o al vel no el tanca (el vel es tanca amb el seu clic, i cap toc no cau al que hi ha davall)', () => {
  render(pagina());
  fireEvent.click(botoIndex());
  const dialeg = index();
  fireEvent.pointerDown(within(dialeg).getByRole('button', { name: 'Segona secció' }));
  fireEvent.pointerDown(within(dialeg).getByRole('heading', { name: NOM_INDEX }));
  expect(index()).not.toBeNull();
  const vel = dialeg.parentElement;
  expect(vel.className).toBe('toc-overlay');
  fireEvent.pointerDown(vel);
  expect(index()).not.toBeNull();
  fireEvent.click(vel);
  expect(index()).toBeNull();
});

test('§5 · el botó «Índex» que hi apunta (aria-controls) no el tanca per a tornar-lo a obrir; un botó secundari tampoc el tanca', () => {
  render(pagina());
  const boto = botoIndex();
  fireEvent.click(boto);
  expect(boto.getAttribute('aria-controls')).toBe(index().id);
  fireEvent.pointerDown(boto);
  expect(index()).not.toBeNull();
  fireEvent.click(boto);
  expect(index()).not.toBeNull();
  // El clic dret (button 2) a la barra no és un toc: l'Índex es queda.
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Obrir menú' }), { button: 2 });
  expect(index()).not.toBeNull();
});

/* El calaix sol, amb un onClose espia: l'oient només viu mentre és obert. */
function Calaix({ obert, onClose }) {
  const cos = useRef(null);
  return (
    <>
      <article ref={cos}><h2>Secció</h2></article>
      <TableOfContentsDrawer isOpen={obert} onClose={onClose} contentRef={cos} />
    </>
  );
}

test('§5 · l’oient del document només viu amb l’Índex obert: tancat o desmuntat, un toc de fora no crida onClose', () => {
  const onClose = vi.fn();
  const afegits = vi.spyOn(document, 'addEventListener');
  const llevats = vi.spyOn(document, 'removeEventListener');
  try {
    const { rerender, unmount } = render(<Calaix obert={true} onClose={onClose} />);
    expect(afegits.mock.calls.filter(([tipus, , captura]) => tipus === 'pointerdown' && captura === true)).toHaveLength(1);
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<Calaix obert={false} onClose={onClose} />);
    expect(llevats.mock.calls.filter(([tipus, , captura]) => tipus === 'pointerdown' && captura === true)).toHaveLength(1);
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<Calaix obert={true} onClose={onClose} />);
    unmount();
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  } finally {
    afegits.mockRestore();
    llevats.mockRestore();
  }
});

/* Verificació (261027) · El teclat, igual que el toc: un Maj+Tab que ix del
   calaix cap a la barra negra deixava dos diàlegs a la vista (el menú lateral
   i l'Índex). jsdom no fa la navegació amb Tab: element.focus() és el pas que
   faria el Maj+Tab, i dispara el mateix focusin (composed) que el navegador.
   La primera i l'última prova fallen sense l'oient de focusin; la del mig és
   guarda de regressió de les excepcions (l'obridor, l'Esc i la tornada del
   focus a «Índex de secció»). */
test('teclat · obert l’Índex, el focus en un botó de la barra negra el tanca i s’hi queda; dins del calaix, el focus no el tanca', () => {
  const onMenu = vi.fn();
  render(pagina(onMenu));
  fireEvent.click(botoIndex());
  const dialeg = index();
  // El calaix rep el focus en obrir-se: és de dins, no el tanca.
  expect(document.activeElement).toBe(dialeg);
  act(() => within(dialeg).getByRole('button', { name: 'Segona secció' }).focus());
  act(() => within(dialeg).getByRole('button', { name: 'Tancar taula' }).focus());
  act(() => dialeg.focus());
  expect(index()).not.toBeNull();
  const menu = screen.getByRole('button', { name: 'Obrir menú' });
  act(() => menu.focus());
  expect(index()).toBeNull();
  // Cap trampa ni robatori: el focus es queda on la persona l'ha dut.
  expect(document.activeElement).toBe(menu);
  // L'Enter que ve després obri el menú, ja sense l'Índex damunt.
  fireEvent.click(menu);
  expect(onMenu).toHaveBeenCalledTimes(1);
  expect(index()).toBeNull();
});

test('teclat · el botó «Índex» que hi apunta no el tanca en rebre el focus; l’Esc el tanca i el focus torna a «Índex de secció»', () => {
  render(pagina());
  const boto = botoIndex();
  fireEvent.click(boto);
  expect(boto.getAttribute('aria-controls')).toBe(index().id);
  act(() => boto.focus());
  expect(index()).not.toBeNull();
  act(() => index().focus());
  expect(index()).not.toBeNull();
  fireEvent.keyDown(index(), { key: 'Escape' });
  expect(index()).toBeNull();
  expect(document.activeElement).toBe(botoIndex());
});

test('teclat · l’oient de focusin només viu amb l’Índex obert: tancat o desmuntat, un focus de fora no crida onClose', () => {
  const onClose = vi.fn();
  const afegits = vi.spyOn(document, 'addEventListener');
  const llevats = vi.spyOn(document, 'removeEventListener');
  const deFocusin = (espia) => espia.mock.calls.filter(([tipus, , captura]) => tipus === 'focusin' && captura === true);
  // Un control de fora que no es desmunta amb el calaix.
  const fora = document.createElement('button');
  fora.type = 'button';
  fora.textContent = 'Fora';
  document.body.append(fora);
  try {
    const { rerender, unmount } = render(<Calaix obert={true} onClose={onClose} />);
    expect(deFocusin(afegits)).toHaveLength(1);
    expect(document.activeElement).toBe(index());
    expect(onClose).not.toHaveBeenCalled();
    act(() => fora.focus());
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<Calaix obert={false} onClose={onClose} />);
    expect(deFocusin(llevats)).toHaveLength(1);
    act(() => { fora.blur(); fora.focus(); });
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<Calaix obert={true} onClose={onClose} />);
    expect(document.activeElement).toBe(index());
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    act(() => fora.focus());
    expect(onClose).toHaveBeenCalledTimes(1);
  } finally {
    fora.remove();
    afegits.mockRestore();
    llevats.mockRestore();
  }
});
