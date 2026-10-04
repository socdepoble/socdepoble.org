import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { CalendarClock } from 'lucide-react';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenUniversalCard from './EspecimenUniversalCard.jsx';
import { TargetaConsola } from '../../../consola/peces.jsx';

/* T2 (ordre del Mestre, 260930) · L'espècimen 7 (targeta explicativa de la
   Consola) ha de ser fidel a la instància real, TargetaConsola: el cos porta
   l'entradilla i les mètriques en h5, no una dada en negreta.
   Derogat per l'ordre del Mestre del 261004 (xat: tota targeta amb boina i
   pàgina pròpia): la targeta de sistema sense boina i amb la data a l'última
   línia del cos (prompt 261004_0515, §6/T8). Ara, la boina de Sóc de Poble
   (l'autor porta a /projecte) i la data a la pastilla, un <time> sense clic;
   tota clicable i el peu de la barra blava. */
afterEach(cleanup);

const pinta = (node) => render(<MemoryRouter>{node}</MemoryRouter>).container;
const formaDelCos = (article) => [...article.querySelectorAll('.sp-card-text *')]
  .filter((el) => el.tagName !== 'SVG' && !el.closest('svg'))
  .map((el) => `${el.tagName}.${el.className}`);
const forma = (article) => ({
  classe: article.className,
  fills: [...article.children].map((el) => el.className.split(' ')[0]),
  peu: [...article.querySelectorAll('.sp-card-footer button')].map((b) => b.getAttribute('aria-label'))
});
const boina = (article) => {
  const capcal = article.querySelector('.sp-card-header');
  const autor = capcal.querySelector('a.sp-card-author-link');
  const pastilla = capcal.querySelector('.btn-date-time');
  return {
    autor: autor.getAttribute('href'),
    nom: autor.querySelector('.sp-card-author-name').textContent,
    poble: autor.querySelector('.sp-card-author-location').textContent,
    avatar: autor.querySelector('img.sp-card-avatar').getAttribute('src'),
    pastilla: [pastilla.tagName, ...[...pastilla.querySelectorAll('span')].map((s) => s.textContent)]
  };
};

test('l’espècimen 7 té la mateixa anatomia que la TargetaConsola: boina, cos amb mètriques i peu', () => {
  const real = pinta(
    <TargetaConsola icona={CalendarClock} titol="Calendari de processos" subtitol="Per a vigilar el que corre sense ningú davant"
      entradilla="Què corre sol al Mas, quan, qui ho llança i si continua viu."
      metriques={['10 tasques', '2 vives', '1 morta']} generat="2026-09-26T01:42:00" a="/consola/calendari" />
  ).querySelector('article.sp-card');
  const formaReal = formaDelCos(real);
  const anatomiaReal = forma(real);
  const boinaReal = boina(real);
  cleanup();

  const especimen = [...pinta(<EspecimenUniversalCard />).querySelectorAll('article.sp-card')]
    .find((t) => t.querySelector('h3')?.textContent === 'Calendari de processos');
  expect(formaDelCos(especimen)).toEqual(formaReal);
  expect(formaReal).toEqual([
    'P.', 'DIV.sdp-consola__metriques', 'H5.sdp-consola__metrica', 'H5.sdp-consola__metrica', 'H5.sdp-consola__metrica'
  ]);
  expect([...especimen.querySelectorAll('h5')].map((h) => h.textContent)).toEqual(['10 tasques', '2 vives', '1 morta']);
  expect(especimen.querySelector('.sp-card-text strong')).toBeNull();
  // La mateixa anatomia: boina, tota clicable i el peu de la barra blava.
  expect(forma(especimen)).toEqual(anatomiaReal);
  expect(anatomiaReal).toEqual({
    classe: 'sp-card sdp-consola__targeta',
    fills: ['sp-card-header', 'sp-card-link-overlay', 'sp-card-body', 'sp-card-footer'],
    peu: ['Traduir Calendari de processos', 'Comentar Calendari de processos', 'Compartir Calendari de processos',
      'Connectar amb Calendari de processos']
  });
  // La boina: Sóc de Poble, que porta a /projecte, i la data en un <time> sense clic.
  expect(boina(especimen)).toEqual(boinaReal);
  expect(boinaReal).toEqual({
    autor: '/projecte', nom: 'Sóc de Poble', poble: 'La Torre de les Maçanes',
    avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg', pastilla: ['TIME', '01:42', '26/09/26']
  });
  expect(especimen.querySelector('.sp-card-header time.btn-date-time').getAttribute('datetime')).toBe('2026-09-26T01:42:00');
  // Cap línia de data al cos: la data és a la boina.
  expect(especimen.querySelector('.sdp-consola__data')).toBeNull();
});
