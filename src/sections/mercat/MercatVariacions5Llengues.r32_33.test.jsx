import { cleanup, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { UIContext } from '../../app/contexts/objectesDeContext.js';
import { SelectorDeVariacions } from './SelectorDeVariacions.jsx';
import { TEXTOS_ESGOTAT_VARIACIO, textEsgotatVariacio } from './selectorDeVariacionsModel.js';
import { esVariacioEsgotada, variacionsDelProducte } from './variacionsDeProducte.js';

const OPCIONS = [
  { valor: 'pot-500', etiqueta: 'Pot 500 g' },
  { valor: 'pot-1000', etiqueta: 'Pot 1 kg', esgotada: true },
];

afterEach(cleanup);

describe('Onada R32.33 · Mercat · variacions esgotades en 5 llengues i normalitzacio de -0', () => {
  test('esVariacioEsgotada reconeix l’estat esgotat en les 5 llengues oficials i variacionsDelProducte evita -0', () => {
    for (const estat of ['Esgotat', 'Esgotada', 'Agotado', 'Out of stock', 'Sold out', 'Agortuta', 'Agortua', 'Esgotado']) {
      expect(esVariacioEsgotada({ stock_status: estat }), estat).toBe(true);
    }
    expect(esVariacioEsgotada({ stock_status: 'Disponible' })).toBe(false);

    const llista = variacionsDelProducte({
      variations: [{ id: 'mostra', name: 'Mostra', price: -0 }],
    });
    expect(llista[0].preu).toBe('0');
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])(
    'SelectorDeVariacions en %s localitza la insignia d’esgotat dins del nom accessible del radio',
    (lang) => {
      const esperat = TEXTOS_ESGOTAT_VARIACIO[lang];
      expect(textEsgotatVariacio(`${lang}-ES`)).toBe(esperat);
      const { container } = render(
        <UIContext.Provider value={{ language: lang }}>
          <SelectorDeVariacions llegenda="Format" opcions={OPCIONS} valor="pot-500" />
        </UIContext.Provider>
      );
      const radioEsgotat = within(container).getByRole('radio', { name: `Pot 1 kg ${esperat}` });
      expect(radioEsgotat.disabled).toBe(false);
    }
  );
});
