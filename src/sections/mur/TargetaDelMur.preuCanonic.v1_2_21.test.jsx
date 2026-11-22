/* v1.2.21 · L3-05 (Gauntlet R1 de la v1.2.20, ordre del Mestre de la v1.2.21) · El Mur i /mercat pinten
   el mateix preu d'un producte: el text i el tram del quadrat (data-mida) de la targeta del Mur són els de
   propsDeTargetaDeProducte, que és la font de la llista de /mercat (preuInicialDelProducte, R32.36 lot 03).
   Una publicació que no és del Mercat conserva el preu tal com ve. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));

import { TargetaDelMur } from './TargetaDelMur.jsx';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { propsDeTargetaDeProducte } from '../mercat/targetaDeProducte.js';
import { midaDelPreu } from '../../components/PedraSeca/organismes/SquareBadge.jsx';

afterEach(cleanup);

const quadrat = (container) => container.querySelector('.sp-card-calendar-badge__dia');
const deLaLlavor = MARKET_ITEMS.filter((item) => item && (item.price || item.variations?.length || item.variacions?.length));
/* Un producte per tram de midaDelPreu (els preus de les llavors del Gauntlet de la v1.2.20). */
const sintetics = ['8 €', '12 €', '4.95€', '900.00€', '1.250,5 €', 'A convenir'].map((price, i) => ({
  id: `sintetic-${i}`, type: 'product', ambit: 'mercat', title: `Producte ${i}`, price
}));
const ambPreu = [...deLaLlavor, ...sintetics];

describe('L3-05 · el preu del Mur és el de /mercat', () => {
  test('hi ha productes de la llavor amb preu per a comparar', () => {
    expect(deLaLlavor.length).toBeGreaterThanOrEqual(2);
  });

  test.each(ambPreu.map((item) => [item.id, item]))('%s: mateix text i mateix tram que la llista de /mercat', (_id, item) => {
    const esperat = propsDeTargetaDeProducte(item).price;
    const { container } = render(<TargetaDelMur item={item} />);
    const el = quadrat(container);
    if (!esperat) { expect(el).toBeNull(); return; }
    expect(el).not.toBeNull();
    expect(el.textContent).toBe(esperat);
    expect(el.getAttribute('data-mida')).toBe(midaDelPreu(esperat));
  });

  test.each(['product', 'market'])('un element de tipus %s sense àmbit explícit passa pel formatador', (type) => {
    const { container } = render(<TargetaDelMur item={{ id: `prova-${type}`, type, title: 'Oli', price: '8 €' }} />);
    expect(quadrat(container)?.textContent).toBe('8,00 €');
  });

  /* Gauntlet R1 (L3-04) · Un producte amb la primera variant esgotada: /mercat i el Mur mostren el preu de la variant que
     obri el detall («4,95 €»), no el del producte («15,00 €»). Distingix preuInicialDelProducte de formataPreuMercat. */
  test('la variant que obri el detall mana: el Mur no pinta el preu del producte si la primera variant està esgotada', () => {
    const item = { id: 'prova-variants', type: 'product', ambit: 'mercat', title: 'Mel', price: '15€',
      variations: [{ id: 'gran', name: 'Pot gran', price: '16€', stock_status: 'Esgotat' }, { id: 'menut', name: 'Pot menut', price: '4.95€' }] };
    expect(propsDeTargetaDeProducte(item).price).toBe('4,95\u00a0€');
    const { container } = render(<TargetaDelMur item={item} />);
    expect(quadrat(container)?.textContent).toBe('4,95\u00a0€');
  });

  test('una publicació del Mur conserva el preu tal com ve', () => {
    const { container } = render(<TargetaDelMur item={{ id: 'prova-mur', type: 'post', title: 'Fira', price: '8 €' }} />);
    expect(quadrat(container)?.textContent).toBe('8 €');
  });
});
