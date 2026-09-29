/* T67 · Les files de la llista de Xats: la fila d'una comunitat es ressalta
   amb la mateixa regla que el filtre «No llegits», i l'avatar d'un canal és
   sempre el megàfon (captures 19.41.43, 19.42.54 i 19.43.00). */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import FilaConversa, { AvatarFil, FilaComunitat } from './FilaConversa.jsx';
import { agrupaComunitats, mapejaFil } from '../missatges.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

function comunitat({ noLlegitManual = false } = {}) {
  const fils = [
    { id: 'c-1', tipus: 'comunitat', titol: 'Almàssera' },
    { id: 'a-1', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-1', ultimSeq: 0, llegitFinsSeq: 0 },
    { id: 'g-1', tipus: 'grup', titol: 'General', comunitatId: 'c-1', ultimSeq: 0, llegitFinsSeq: 0, noLlegitManual }
  ].map((f) => mapejaFil(f));
  return agrupaComunitats(fils)[0];
}

test('un fill marcat a mà com a no llegit ressalta la comunitat, com al filtre «No llegits»', () => {
  const { rerender } = render(<FilaComunitat comunitat={comunitat()} onObri={() => {}} t={t} />);
  const fila = screen.getByRole('button', { name: /Almàssera/ });
  expect(fila.classList.contains('sdp-xat-fila--nova')).toBe(false);

  rerender(<FilaComunitat comunitat={comunitat({ noLlegitManual: true })} onObri={() => {}} t={t} />);
  expect(screen.getByRole('button', { name: /Almàssera/ }).classList.contains('sdp-xat-fila--nova')).toBe(true);
});

test('el canal porta sempre el megàfon, amb imatge o sense; el grup, la seua imatge si en té', () => {
  const canal = mapejaFil({ id: 'a-1', tipus: 'canal', titol: 'Avisos', imatgeUrl: '/logo.svg' });
  const { container, rerender } = render(<AvatarFil fil={canal} nom="Avisos" />);
  expect(container.querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();

  rerender(<AvatarFil fil={canal} nom="Avisos" mida="sm" />);
  expect(container.querySelector('.sdp-xat-avatar-icona--sm svg.lucide-megaphone')).toBeTruthy();

  const grup = mapejaFil({ id: 'g-2', tipus: 'grup', titol: 'Festes' });
  rerender(<AvatarFil fil={grup} nom="Festes" />);
  expect(container.querySelector('svg.lucide-users')).toBeTruthy();
});

test('la fila d’un canal amb imatge també porta el megàfon i ho diu en text', () => {
  const canal = mapejaFil({ id: 'a-1', tipus: 'canal', titol: 'Avisos', imatgeUrl: '/logo.svg', ultimText: 'Benvinguts' });
  render(<FilaConversa fil={canal} onSelect={() => {}} t={t} locale="ca-ES" />);
  const fila = screen.getByRole('button', { name: /Avisos/ });
  expect(fila.querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(fila.querySelector('img')).toBeNull();
  expect(fila.textContent).toContain("Canal d'avisos");
});
