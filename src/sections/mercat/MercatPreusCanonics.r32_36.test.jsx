import React from 'react';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { UIActionsContext, UIContext } from '../../app/contexts/objectesDeContext.js';

/* Només l'entorn de navegació i avisos: la targeta, el selector, el detall i
   el formatador són els de producció, sense dobles de preu. */
vi.mock('../../app/contexts/RouterContext.jsx', () => ({
  useNavigate: () => () => {},
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: () => {} }),
}));

import { TargetaDelMercat } from './TargetaDelMercat.jsx';
import { buildMercatDetailSectionMeta } from '../detail/detailSectionMeta.jsx';
import { formataPreuMercat } from './preuMercat.js';
import { propsDeTargetaDeProducte } from './targetaDeProducte.js';
import { variacionsDelProducte } from './variacionsDeProducte.js';

afterEach(cleanup);

const ESGOTAT = { ca: 'Esgotat', es: 'Agotado', en: 'Out of stock', eu: 'Agortuta', gl: 'Esgotado' };
const traductor = (language) => (clau, reserva) => clau === 'section.mercat.esgotat' ? ESGOTAT[language] : reserva;
const producte = (price, variations = [{ id: 'format', name: 'Format', price }]) => ({
  id: 'preu-canonic', title: 'Producte', seller: 'Venedora', price, variations,
});
function pinta(item, language = 'ca', opcions = {}) {
  const t = traductor(language);
  return render(
    <UIContext.Provider value={{ language, externalConfig: {} }}>
      <UIActionsContext.Provider value={{ language, t }}>
        <div data-testid="llista"><TargetaDelMercat item={item} /></div>
        <div data-testid="detall">{buildMercatDetailSectionMeta({ t, ...opcions }).renderBody(item)}</div>
      </UIActionsContext.Provider>
    </UIContext.Provider>
  );
}
const preuLlista = (view) => view.getByTestId('llista').querySelector('.sp-card-calendar-badge__dia')?.textContent ?? '';
const preuDetall = (view) => view.getByTestId('detall').querySelector('.sp-card-price')?.textContent ?? '';

describe('DOL-40 · format canònic real de llista, selector i detall', () => {
  test.each([
    [15, '15,00\u00a0€'], ['4,95 €', '4,95\u00a0€'], [0, '0,00\u00a0€'], [-0, '0,00\u00a0€'],
    ['-0.00€', '0,00\u00a0€'], ['-2.5 €', '-2,50\u00a0€'],
    ['1,250.50 EUR', '1.250,50\u00a0€'], ['9007199254740993.50', '9.007.199.254.740.993,50\u00a0€'],
    ['15.999€', '15.999€'], [0.1 + 0.2, '0.30000000000000004'], [1e-7, '1e-7'],
    ['4,95 €/kg', '4,95 €/kg'], ['5–10 €', '5–10 €'], ['A convenir', 'A convenir'], ['$5', '$5'],
    [null, ''], [undefined, ''], [NaN, ''], [Infinity, ''], [{ amount: 15 }, ''],
  ])('conserva l’import i el text declarat %j → %s en les dues superfícies', (price, esperat) => {
    const item = producte(price);
    const view = pinta(item);
    expect(preuLlista(view)).toBe(esperat);
    expect(preuDetall(view)).toBe(esperat);
    expect(formataPreuMercat(price)).toBe(esperat);
    expect(item.price).toBe(price);
    expect(item.variations[0].price).toBe(price);
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('en %s canviar variant actualitza preu, anunci i estat sense duplicar format', language => {
    const onAfegeixAlCabas = vi.fn();
    const item = producte('4.95€', [
      { id: 'menuda', name: 'Menuda', price: '4.95€' },
      { id: 'gran', name: 'Gran', price: '1250.50€', stock_status: 'Esgotat' },
      { id: 'mostra', name: 'Mostra', price: 0 },
    ]);
    const view = pinta(item, language, { onAfegeixAlCabas });
    const detall = view.getByTestId('detall');
    expect(preuLlista(view)).toBe('4,95\u00a0€');
    expect(preuDetall(view)).toBe('4,95\u00a0€');
    expect(detall.querySelector('[aria-live="polite"]').textContent).toBe('');
    fireEvent.click(within(detall).getByRole('radio', { name: `Gran ${ESGOTAT[language]}` }));
    expect(preuDetall(view)).toBe('1.250,50\u00a0€');
    expect(detall.querySelector('[aria-live="polite"]').textContent).toBe(`Gran, 1.250,50\u00a0€, ${ESGOTAT[language]}`);
    const boto = within(detall).getByRole('button');
    expect(boto.disabled).toBe(true);
    fireEvent.click(boto);
    expect(onAfegeixAlCabas).not.toHaveBeenCalled();
    fireEvent.click(within(detall).getByRole('radio', { name: 'Mostra' }));
    expect(preuDetall(view)).toBe('0,00\u00a0€');
    expect(boto.disabled).toBe(false);
    fireEvent.click(boto);
    expect(onAfegeixAlCabas).toHaveBeenCalledWith({ productId: item.id, variantId: 'mostra', quantitat: 1 });
    expect(preuLlista(view)).toBe('4,95\u00a0€');
  });

  test.each([null, undefined, '', '  ', {}, NaN, Infinity])('variant sense import %j recau en el preu declarat del producte', price => {
    const view = pinta(producte('4.95€', [{ id: 'sense-preu', name: 'Sense preu', price }]));
    expect(preuLlista(view)).toBe('4,95\u00a0€');
    expect(preuDetall(view)).toBe('4,95\u00a0€');
  });

  test.each([
    ['primera disponible, sense calcular el mínim', [
      { id: 'esgotada', name: 'Esgotada', price: '1.00€', stock_status: 'Esgotat' },
      { id: 'disponible', name: 'Disponible', price: '4.95€' },
      { id: 'altra', name: 'Altra', price: '2.00€' },
    ], 'disponible', '4,95\u00a0€', false],
    ['si totes estan esgotades, la primera', [
      { id: 'primera', name: 'Primera', price: '7.00€', stock_status: 'Esgotat' },
      { id: 'segona', name: 'Segona', price: '3.00€', stock_status: 'Esgotat' },
    ], 'primera', '7,00\u00a0€', true],
    ['zero és un import, sense recórrer a la base', [
      { id: 'mostra', name: 'Mostra', price: 0 },
    ], 'mostra', '0,00\u00a0€', false],
  ])('llista i detall compartixen la selecció inicial existent: %s', (_nom, variations, id, esperat, esgotada) => {
    const view = pinta(producte('99.00€', variations));
    const detall = view.getByTestId('detall');
    expect(preuLlista(view)).toBe(esperat);
    expect(preuDetall(view)).toBe(esperat);
    expect(within(detall).getAllByRole('radio').find(radio => radio.checked).value).toBe(id);
    expect(within(detall).getByRole('button').disabled).toBe(esgotada);
  });

  test('no modifica el DTO ni els camps crus de variacions del contracte v1.2.19', () => {
    const item = Object.freeze(producte('15.00€', Object.freeze([
      Object.freeze({ id: 'mostra', name: 'Mostra', price: -0 }),
    ])));
    expect(variacionsDelProducte(item)[0].preu).toBe('0');
    expect(() => { propsDeTargetaDeProducte(item); pinta(item); }).not.toThrow();
    expect(Object.is(item.variations[0].price, -0)).toBe(true);
    expect(item.price).toBe('15.00€');
  });

  test('sense variants conserva la targeta i el detall editorial, sense inventar una caixa de compra', () => {
    const item = { ...producte('15.00€', []), description: 'Descripció editorial.' };
    const view = pinta(item);
    expect(preuLlista(view)).toBe('15,00\u00a0€');
    expect(view.getByTestId('detall').textContent).toBe('Descripció editorial.');
    expect(view.getByTestId('detall').querySelector('.sdp-compra')).toBeNull();
  });
});
