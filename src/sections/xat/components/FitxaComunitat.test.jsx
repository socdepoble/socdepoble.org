/* T67 (captures 19.42.54 i 19.43.00) · La fitxa d'una comunitat: capçalera
   amb avatar quadrat, nom i «Comunitat»; Avisos; «Grups als quals pertanys»;
   el text d'estat buit al peu i «+ Afegir grup». Amb dades de la llavor
   passades per mapejaFil i agrupaComunitats, com les dona el context. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import FitxaComunitat from './FitxaComunitat.jsx';
import { agrupaComunitats, mapejaFil } from '../missatges.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

function comunitat() {
  const fils = [
    { id: 'c-1', tipus: 'comunitat', titol: 'Sóc de Poble' },
    { id: 'g-1', tipus: 'grup', titol: 'General', comunitatId: 'c-1', ultimText: 'Hola', ultimAl: '2026-09-28T10:00:00Z', ultimAutorId: 'pep', altres: [{ id: 'pep', nom: 'Pep' }] },
    /* Com a la llavor (localXat.conversaDe), el canal hereta la imatge del
       primer participant: no és la seua i no s'ha de pintar. */
    { id: 'a-1', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-1', rol: 'membre', ultimText: 'Benvinguts', ultimAl: '2026-09-27T10:00:00Z', imatgeUrl: '/logo.svg' }
  ].map((f) => mapejaFil(f));
  return agrupaComunitats(fils)[0];
}

test('pinta la capçalera, Avisos primer, els grups i el peu de la fitxa', () => {
  const onObriFil = vi.fn();
  const onAfegirGrup = vi.fn();
  render(<FitxaComunitat comunitat={comunitat()} onObriFil={onObriFil} onAfegirGrup={onAfegirGrup} t={t} locale="ca-ES" joId="jo" />);
  const fitxa = screen.getByRole('region', { name: 'Sóc de Poble' });
  const cap = fitxa.querySelector('.sdp-xat-fitxa-comunitat__cap');
  expect(within(cap).getByText('Sóc de Poble')).toBeTruthy();
  expect(within(cap).getByText('Comunitat')).toBeTruthy();
  expect(cap.querySelector('.sdp-xat-apilat .sdp-xat-avatar--quadrat')).toBeTruthy();

  const files = within(fitxa).getAllByRole('button').filter((b) => b.classList.contains('sdp-xat-fila'));
  expect(files.map((b) => b.querySelector('.sdp-xat-fila__nom').firstChild.textContent)).toEqual(['Avisos', 'General']);
  /* El canal porta el megàfon i ho diu en text; el General, la bafarada. */
  expect(files[0].querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(files[0].querySelector('img')).toBeNull();
  expect(within(files[0]).getByText(", Canal d'avisos")).toBeTruthy();
  expect(files[1].querySelector('svg.lucide-message-circle-more')).toBeTruthy();
  expect(within(files[1]).getByText('Pep: Hola')).toBeTruthy();

  const titol = within(fitxa).getByRole('heading', { name: 'Grups als quals pertanys' });
  expect(Boolean(files[0].compareDocumentPosition(titol) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  expect(Boolean(titol.compareDocumentPosition(files[1]) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  expect(within(fitxa).getByText("Els grups que s'afegisquen a la comunitat apareixeran ací. Els membres de la comunitat s'hi podran unir.")).toBeTruthy();

  fireEvent.click(files[1]);
  expect(onObriFil).toHaveBeenCalledWith('g-1');
  const afegir = within(fitxa).getByRole('button', { name: 'Afegir grup' });
  expect(afegir.classList.contains('sdp-xat-pindola')).toBe(true);
  fireEvent.click(afegir);
  expect(onAfegirGrup).toHaveBeenCalledTimes(1);
});
