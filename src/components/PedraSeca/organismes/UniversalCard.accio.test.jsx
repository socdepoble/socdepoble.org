/**
 * Ordre del Mestre (261007) · La ranura `accio` d'UniversalCard: el gran botó
 * d'una targeta (la d'El Xat hi posa «Anar al xat») en lloc de les etiquetes.
 *
 *  · Genèrica: la peça no en sap res, pinta el node que rep dins de
 *    .sp-card-accio, al lloc de les etiquetes, i les etiquetes no es pinten.
 *  · Un clic al botó és del botó (navega al seu destí); un clic a qualsevol
 *    altra part de la targeta obri la pàgina (l'enllaç estirat de sempre).
 *  · Teclat: el botó és una parada pròpia, després de l'enllaç de la targeta.
 *  · Àrea tàctil: la porta gran de Pedra Seca (--sdp-alt-accio ≥ --sdp-touch),
 *    i el contenidor puja damunt del vel enllaç (z-index 2 > 1).
 *  · Sense la prop, el DOM de sempre (Llei del Píxel).
 *
 * Router en memòria de veres: el clic es llig on acaba la ubicació.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';
import { UniversalCard } from './UniversalCard.jsx';
import { PortaDePagina } from './PortesTargeta.jsx';

afterEach(cleanup);

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

const ETIQUETES = [{ text: 'Comunicació', className: 'sdp-badge-system' }, { text: 'Eina', className: 'sdp-badge-category' }];
const PORTA = Object.freeze({ id: 'anar-al-xat', verb: 'Anar al xat', desti: '/xat', varietat: 'primari' });

const pinta = (props) => render(
  <MemoryRouter rutaInicial="/mur">
    <UniversalCard title="El Xat" body="Parla amb el teu poble." labels={ETIQUETES} copyright="© Sóc de Poble"
      mainHref="/page/xat" hasFooter={true} {...props} />
    <Ubicacio />
  </MemoryRouter>
);

test('sense accio (o amb null), el DOM de sempre: les etiquetes i cap .sp-card-accio', () => {
  const { container } = pinta();
  const abans = container.querySelector('article').outerHTML;
  expect(container.querySelector('ul.sp-card-labels')).not.toBeNull();
  expect(container.querySelector('.sp-card-accio')).toBeNull();
  cleanup();
  const { container: ambNull } = pinta({ accio: null });
  expect(ambNull.querySelector('article').outerHTML).toBe(abans);
});

test('amb accio, la ranura ocupa el lloc de les etiquetes i les etiquetes no es pinten', () => {
  const { container } = pinta({ accio: <PortaDePagina porta={PORTA} /> });
  const cos = container.querySelector('.sp-card-body');
  expect(cos.querySelector('ul.sp-card-labels')).toBeNull();
  const ranura = [...cos.children].find((fill) => fill.classList.contains('sp-card-accio'));
  expect(ranura).toBeTruthy();
  /* El lloc de les etiquetes: després del text i abans dels drets. */
  const fills = [...cos.children].map((fill) => fill.className);
  expect(fills.indexOf('sp-card-accio')).toBe(fills.indexOf('sp-card-text') + 1);
  expect(fills.indexOf('sp-card-copyright')).toBe(fills.indexOf('sp-card-accio') + 1);
  /* La porta gran i blava de Pedra Seca: un enllaç de veres cap al seu destí. */
  const boto = screen.getByRole('link', { name: 'Anar al xat' });
  expect(ranura.contains(boto)).toBe(true);
  expect(boto.getAttribute('href')).toBe('/xat');
  expect(boto.className.split(' ')).toEqual(expect.arrayContaining(['sdp-boto', 'sdp-boto--primari', 'sdp-boto--gran']));
});

test('el clic al botó navega al seu destí i no obri la targeta; un clic fora del botó obri la pàgina', () => {
  const obriTargeta = vi.fn();
  const { container } = pinta({ accio: <PortaDePagina porta={PORTA} />, onMainClick: obriTargeta });
  const vel = container.querySelector('a.sp-card-link-overlay');
  const boto = screen.getByRole('link', { name: 'Anar al xat' });
  /* El botó és germà del vel, mai fill: el seu clic no arriba a l'enllaç de la targeta. */
  expect(vel.contains(boto)).toBe(false);
  fireEvent.click(boto);
  expect(ubicacio()).toBe('/xat');
  expect(obriTargeta).not.toHaveBeenCalled();
  /* Qualsevol altra part de la targeta és el vel estirat: la pàgina. */
  fireEvent.click(vel);
  expect(ubicacio()).toBe('/page/xat');
  expect(obriTargeta).toHaveBeenCalledTimes(1);
});

test('teclat: el botó és una parada pròpia, enfocable, després de l’enllaç de la targeta', () => {
  const { container } = pinta({ accio: <PortaDePagina porta={PORTA} /> });
  const parades = [...container.querySelectorAll('article a[href], article button')].filter((el) => el.tabIndex >= 0);
  const vel = container.querySelector('a.sp-card-link-overlay');
  const boto = screen.getByRole('link', { name: 'Anar al xat' });
  expect(parades.indexOf(vel)).toBeGreaterThanOrEqual(0);
  expect(parades.indexOf(boto)).toBeGreaterThan(parades.indexOf(vel));
  boto.focus();
  expect(document.activeElement).toBe(boto);
});

/* jsdom no calcula capes ni z-index: es comprova la regla escrita, com les
   proves de capes. */
test('CSS: .sp-card-accio puja damunt del vel, dins de @layer components, i el botó gran passa la zona tàctil', () => {
  const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
  const components = llig('src/css/components.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = components.match(/@layer components \{\s*\.sp-card-accio \{([^}]*)\}\s*\}/);
  expect(bloc).not.toBeNull();
  const decl = bloc[1].replace(/\s+/g, ' ');
  expect(decl).toMatch(/position: relative;/);
  const capa = Number(decl.match(/z-index: (\d+);/)?.[1]);
  const vel = Number(components.match(/\.sp-card-link-overlay \{[^}]*z-index: (\d+);/)?.[1]);
  expect(capa).toBeGreaterThan(vel);
  expect(decl).toMatch(/margin-top: var\(--sdp-space-3\);/);
  expect(decl).toMatch(/margin-bottom: var\(--sdp-space-4\);/);
  const tokens = llig('src/css/tokens.css');
  const px = (nom) => Number(tokens.match(new RegExp(`${nom}:\\s*(\\d+)px`))?.[1]);
  expect(components).toMatch(/\.sdp-boto--gran \{ min-height: var\(--sdp-alt-accio\);/);
  expect(px('--sdp-alt-accio')).toBeGreaterThanOrEqual(px('--sdp-touch'));
});
