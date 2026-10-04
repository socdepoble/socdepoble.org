/* Verificació 261004 (front «campfitxer») · El contracte de l'espècimen del
   Camp diu el que fa el codi: CampFitxer (i CampText tipus="file", que hi
   delega) no hereta el required natiu del Camp obligatori, perquè `value` es
   buida a cada canvi. Porta aria-required i una validesa pròpia segons els
   fitxers triats, el botó du l'etiqueta del Camp i el fitxer es llig des
   d'onChange. Sense h1, sense style= i sense cap avís de React. */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import EspecimenCamp from './EspecimenCamp.jsx';

let errors;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

/* La fila del contracte d'una prop: [tipus, per defecte, què fa]. */
const filaDe = (taula, prop) => {
  const fila = [...taula.querySelectorAll('tbody tr')].find((tr) => tr.querySelector('td code')?.textContent === prop);
  return fila ? [...fila.querySelectorAll('td')].slice(1).map((td) => td.textContent) : null;
};

it('la descripció ja no diu que CampFitxer hereta required, i el contracte diu com valida', () => {
  const { container } = render(<EspecimenCamp />);
  expect(container.querySelector('h1')).toBeNull();
  expect(container.querySelector('[style]')).toBeNull();
  const descripcio = container.querySelector('.sdp-especimen > p').textContent;
  expect(descripcio).toContain('El control de dins (CampText, AreaText o Selector) hereta id, aria-describedby, aria-invalid i required.');
  expect(descripcio).toContain('CampFitxer (i CampText tipus="file", que hi delega) no hereta required: porta aria-required i una validesa pròpia segons els fitxers triats.');

  const taula = within(container).getByRole('table', { name: 'Contracte' });
  const [tipus, , que] = filaDe(taula, 'CampFitxer');
  expect(tipus).toContain('onInvalid');
  expect(que).toContain('El nom del botó du l’etiqueta del Camp.');
  expect(que).toContain('es llig des d’onChange');
  const [, defecte, obligatori] = filaDe(taula, 'CampFitxer dins de Camp obligatori');
  expect(defecte).toBe('false');
  expect(obligatori).toContain('Cap required natiu');
  expect(obligatori).toContain('només en enviar i si és el primer control invàlid del formulari');
});

it('l’espècimen viu de CampFitxer no porta required natiu i el botó du l’etiqueta del Camp', () => {
  render(<EspecimenCamp />);
  const input = screen.getByLabelText('Còpia de seguretat (JSON)');
  expect(input.type).toBe('file');
  expect(input.required).toBe(false);
  expect(screen.getByRole('button', { name: 'Còpia de seguretat (JSON): Triar fitxers' })).toBeTruthy();
});
