import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { CalendarClock } from 'lucide-react';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenUniversalCard from './EspecimenUniversalCard.jsx';
import { TargetaConsola } from '../../../consola/peces.jsx';

/* T2 (ordre del Mestre, 260930) · L'espècimen 7 (targeta explicativa de la
   Consola) ha de ser fidel a la instància real, TargetaConsola: el cos porta
   l'entradilla i les mètriques en h5, no una dada en negreta. */
afterEach(cleanup);

const pinta = (node) => render(<MemoryRouter>{node}</MemoryRouter>).container;
const formaDelCos = (article) => [...article.querySelectorAll('.sp-card-text *')]
  .filter((el) => el.tagName !== 'SVG' && !el.closest('svg'))
  .map((el) => `${el.tagName}.${el.className}`);

test('l’espècimen 7 té el mateix cos que la TargetaConsola amb mètriques', () => {
  const real = pinta(
    <TargetaConsola icona={CalendarClock} titol="Calendari de processos" subtitol="Per a vigilar el que corre sense ningú davant"
      entradilla="Què corre sol al Mas, quan, qui ho llança i si continua viu."
      metriques={['10 tasques', '2 vives', '1 morta']} font="Font: el Mapa del Mas" a="/consola/calendari" />
  ).querySelector('article.sp-card');
  const formaReal = formaDelCos(real);
  cleanup();

  const especimen = [...pinta(<EspecimenUniversalCard />).querySelectorAll('article.sp-card')]
    .find((t) => t.querySelector('h3')?.textContent === 'Calendari de processos');
  expect(formaDelCos(especimen)).toEqual(formaReal);
  expect(formaReal).toEqual(['P.', 'DIV.sdp-consola__metriques', 'H5.sdp-consola__metrica', 'H5.sdp-consola__metrica', 'H5.sdp-consola__metrica']);
  expect([...especimen.querySelectorAll('h5')].map((h) => h.textContent)).toEqual(['10 tasques', '2 vives', '1 morta']);
  expect(especimen.querySelector('.sp-card-text strong')).toBeNull();
});
