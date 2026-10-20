/* Fase D (261020, tasca 2; pla 261020_1300) · La fila d'una conversa on
   l'últim missatge és d'algú que has bloquejat (XatContext l'anota amb
   anotaFilsBloquejats): la vista prèvia diu «Missatge amagat», sense qui ni
   què. Sense l'anotació, la fila és la de sempre, byte a byte. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import FilaConversa from './FilaConversa.jsx';
import { mapejaFil } from '../missatges.js';
import { anotaFilsBloquejats } from '../../../config/moderacio.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);
const DIRECTE = mapejaFil({ id: 'd-1', tipus: 'directe', titol: 'Pepa', altres: [{ id: 'pepa', nom: 'Pepa', tipus: 'persona' }],
  ultimText: 'Insult', ultimAutorId: 'pepa', ultimSeq: 3, llegitFinsSeq: 3 });
const GRUP = mapejaFil({ id: 'g-1', tipus: 'grup', titol: 'Colla', ultimText: 'Insult', ultimAutorId: 'pepa', ultimSeq: 3, llegitFinsSeq: 3 });
const pinta = (fil) => {
  const vista = render(<FilaConversa fil={fil} onSelect={() => {}} t={t} locale="ca-ES" joId="jo" />);
  return { boto: screen.getByRole('button'), ...vista };
};
const previa = (boto) => boto.querySelector('.sdp-xat-fila__previa').textContent;

test('amb l’últim missatge d’una persona bloquejada, la vista prèvia és «Missatge amagat»', () => {
  for (const fil of anotaFilsBloquejats([DIRECTE, GRUP], (id) => id === 'pepa')) {
    const { boto, unmount } = pinta(fil);
    expect(previa(boto)).toBe('Missatge amagat');
    expect(boto.textContent).not.toContain('Insult');
    unmount();
  }
});

/* Fase D (261020, revisió) · correcció F1: el directe amb una persona
   bloquejada ni ressalta ni pinta pastilla, com el total, que no el suma. */
test('un directe amb una persona bloquejada i 3 no llegits: ni pastilla, ni negreta, ni hora', () => {
  const ambNous = { ...DIRECTE, noLlegits: 3, ultimAl: new Date().toISOString() };
  const cru = pinta(ambNous);
  expect(cru.boto.querySelector('.sdp-xat-pastilla')).not.toBeNull();
  expect(cru.boto.className).toContain('sdp-xat-fila--nova');
  cru.unmount();
  const [anotat] = anotaFilsBloquejats([ambNous], (id) => id === 'pepa');
  const { boto } = pinta(anotat);
  expect(boto.querySelector('.sdp-xat-pastilla')).toBeNull();
  expect(boto.className).not.toContain('sdp-xat-fila--nova');
  expect(boto.querySelector('.sdp-xat-fila__hora')).toBeNull();
  expect(boto.textContent).not.toContain('3');
  expect(previa(boto)).toBe('Missatge amagat');
});

test('sense l’anotació, la mateixa fila de sempre', () => {
  const { boto, unmount } = pinta(DIRECTE);
  const abans = boto.outerHTML;
  expect(previa(boto)).toContain('Insult');
  unmount();
  const [igual] = anotaFilsBloquejats([DIRECTE], () => false);
  expect(igual).toBe(DIRECTE);
  expect(pinta({ ...DIRECTE }).boto.outerHTML).toBe(abans);
});
