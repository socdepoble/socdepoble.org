/**
 * P5 · Onada 4 (Pedra Seca §9: l'espècimen abans de la producció) · La
 * targeta de doble acció a l'espècimen d'UniversalCard, amb l'ESMENA 261003
 * 22:34 (directrius 2234 i 2245): la UniversalCard estàndard amb portes, no
 * una variant compacta. Dues mostres reals (portes obertes, i Publicar en
 * obres sense il·lustració) i PortesTargeta sola. Les mostres d'abans no
 * canvien. El nom del fitxer és el de P5: este torn no pot moure fitxers.
 * P6 (directriu 2325) · Les mostres de portes porten el peu blau i cap
 * etiqueta; el preu va al quadrat. Muntat sol (sense UIProvider), l'autor
 * porta al xat de la llavor (xatCorporatiu.js).
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter, useLocation } from '../../../../app/contexts/RouterContext.jsx';
import { PAGE_COPY } from '../../../text/pageContent.js';
import EspecimenUniversalCard from './EspecimenUniversalCard.jsx';

afterEach(cleanup);

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const pinta = () => render(
  <MemoryRouter rutaInicial="/disseny">
    <EspecimenUniversalCard />
    <Ubicacio />
  </MemoryRouter>
).container;
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

test('dues targetes de doble acció estàndard: boina de socdepoble, contingut de la pàgina i portes al final del cos', () => {
  const arrel = pinta();
  const grup = screen.getByRole('group', { name: 'Targetes de doble acció de mostra' });
  expect(grup.className).toBe('sdp-card-grid');
  const targetes = [...grup.querySelectorAll(':scope > article.sp-card')];
  expect(targetes).toHaveLength(2);
  const [mur, mapa] = targetes;
  for (const [targeta, clau] of [[mur, 'publicar_mur'], [mapa, 'publicar_mapa']]) {
    expect(targeta.className).toBe('sp-card');
    expect(targeta.querySelector('a.sp-card-author-link').getAttribute('href')).toBe('/xat?amb=socdepoble');
    expect(within(targeta).getByRole('heading', { level: 3 }).textContent).toBe(PAGE_COPY[clau].title);
    expect(targeta.querySelector('p.sp-card-text').textContent).toBe(PAGE_COPY[clau].lead);
    expect(targeta.querySelector('.sp-card-body').lastElementChild.className).toBe('sp-card-portes');
    expect(targeta.querySelector('.sp-card-link-overlay')).toBeNull();
  }
  expect(mur.querySelector('img.sp-card-media').getAttribute('alt')).toBe('');
  expect(within(mur).getAllByRole('link').map((enllac) => enllac.getAttribute('href'))).toEqual([
    '/xat?amb=socdepoble', '/notes', '/page/publicar_mur'
  ]);
  expect(within(mapa).getByRole('button', { name: 'Publicar al Mapa (en obres)' }).getAttribute('aria-disabled')).toBe('true');
  expect(mapa.querySelector('.sp-card-calendar-badge svg.lucide-map-pin')).not.toBeNull();
  /* P6 (directriu 2325) · Cap etiqueta («en obres» ho diu la porta) i el peu
     blau de sempre, sense Connectar, al final de cada mostra. */
  for (const targeta of targetes) {
    expect(targeta.querySelector('.sp-card-labels')).toBeNull();
    expect(targeta.lastElementChild.className).toBe('sp-card-footer');
    expect([...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label').split(' ')[0]))
      .toEqual(['Traduir', 'Comentar', 'Compartir']);
  }
  /* Les mostres d'abans: les mateixes, sense portes, i cap rastre de la variant compacta. */
  expect(arrel.querySelectorAll('.sdp-especimen__targetes article.sp-card')).toHaveLength(3);
  expect(arrel.querySelectorAll('.sp-card--vinyeta, .sdp-card-grid--vinyetes')).toHaveLength(0);
  expect([...arrel.querySelectorAll('article.sp-card .sp-card-porta')].every((porta) => grup.contains(porta))).toBe(true);
});

/* P6 (directriu 2325) · El preu va al quadrat fosc, mai a la píndola, i un
   preu llarg baixa de tram de lletra; el contracte ho documenta. */
test('les mostres del Mercat porten el preu al quadrat, també el llarg, i el contracte documenta price', () => {
  const arrel = pinta();
  expect(arrel.querySelector('.sp-card-price')).toBeNull();
  const quadrat = (titol) => [...arrel.querySelectorAll('article.sp-card')]
    .find((targeta) => targeta.querySelector('.sp-card-title')?.textContent === titol)
    .querySelector('.sp-card-calendar-badge [data-mida]');
  expect([quadrat('Samarreta Sóc de Poble').textContent, quadrat('Samarreta Sóc de Poble').dataset.mida]).toEqual(['15 €', 'mitjana']);
  expect([quadrat('Motocultor de segona mà').textContent, quadrat('Motocultor de segona mà').dataset.mida]).toEqual(['1.250,00 €', 'minima']);
  const props = [...arrel.querySelectorAll('table tbody tr td:first-child code')].map((c) => c.textContent);
  expect(props).toContain('price');
});

test('el text nou de l’espècimen va en H5, amb negreta i sense llistes de punts', () => {
  pinta();
  for (const nom of ['Targeta de doble acció (portes)', 'Les portes, soles (PortesTargeta)']) {
    const titol = screen.getByRole('heading', { level: 5, name: nom });
    let germa = titol.nextElementSibling;
    while (germa && germa.tagName === 'P') {
      expect(germa.querySelector('strong'), nom).not.toBeNull();
      germa = germa.nextElementSibling;
    }
    expect(germa?.tagName, nom).not.toBe('UL');
  }
});

test('les portes de la mostra naveguen amb el router; PortesTargeta sola pinta les dues inertes', () => {
  pinta();
  fireEvent.click(screen.getByRole('link', { name: 'Saber-ne més sobre el Mur' }));
  expect(ubicacio()).toBe('/page/publicar_mur');
  cleanup();
  pinta();
  fireEvent.click(screen.getByRole('group', { name: 'Targetes de doble acció de mostra' }).querySelector('a.sp-card-author-link'));
  expect(ubicacio()).toBe('/xat?amb=socdepoble');
  cleanup();
  const arrel = pinta();
  const soles = [...arrel.querySelectorAll('.sp-card-portes')].find((portes) => !portes.closest('article'));
  expect(soles).toBeTruthy();
  expect(within(soles).getAllByRole('button').map((boto) => boto.getAttribute('aria-disabled'))).toEqual(['true', 'true']);
  expect(within(soles).getByRole('button', { name: 'Publicar: Vehicle Compartit (en obres)' })).toBeTruthy();
});
