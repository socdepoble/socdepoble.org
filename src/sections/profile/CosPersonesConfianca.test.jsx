/* IDEA-48 (estat previ a F7; pla 261101_1246, T7 · S6) · El cos del bloc
   «Persones de confiança»: el recompte i el que falta per a 0, 1, 2, 3 i 5
   contactes verificats, l'error, cap acció de crear el cercle, i l'anglés amb
   el traductor de l'app. */
import '../../../tests/helpers/diccionaris.js';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTranslator } from '../../config/i18n.js';
import CosPersonesConfianca from './CosPersonesConfianca.jsx';

const m = vi.hoisted(() => ({ t: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActionsOpcional: () => (m.t ? { t: m.t } : null) }));

afterEach(() => { cleanup(); m.t = null; });

const textos = (container) => [...container.querySelectorAll('p')].map((p) => p.textContent);
const PENDENT = 'La recuperació amb persones de confiança encara no està activa en este node: ara mateix, ningú no et pot ajudar a recuperar els xats privats.';

describe('en valencià (sense traductor: les reserves)', () => {
  test.each([
    [0, 'Encara no has verificat el número de seguretat de cap contacte. En falten 3 per a arribar a tres.'],
    [1, 'Tens 1 contacte amb el número de seguretat verificat. En falten 2 per a arribar a tres.'],
    [2, 'Tens 2 contactes amb el número de seguretat verificat. En falta 1 per a arribar a tres.'],
    [3, 'Tens 3 contactes amb el número de seguretat verificat. Ja en tens prou. Quan la recuperació amb persones de confiança estiga activa en este node, les podràs triar ací.'],
    [5, 'Tens 5 contactes amb el número de seguretat verificat. Ja en tens prou. Quan la recuperació amb persones de confiança estiga activa en este node, les podràs triar ací.']
  ])('%i verificats', (verificats, recompte) => {
    const { container } = render(<CosPersonesConfianca verificats={verificats} />);
    const paragrafs = textos(container);
    expect(paragrafs).toHaveLength(4);
    expect(paragrafs[0]).toMatch(/^Si un dia perds tots els aparells i la frase, tres de les teues persones de confiança/);
    /* Gauntlet T7b-G02 · En tots els estats, just després de l'explicació: encara no està activa. */
    expect(paragrafs[1]).toBe(PENDENT);
    expect(paragrafs[2]).toBe(recompte);
    expect(paragrafs[3]).toBe('Tria gent de qui et fies de veres: tres d’elles juntes podrien obrir la teua còpia de seguretat.');
    /* Cap acció: el cercle encara no es pot crear (F7). */
    expect(container.querySelector('button, a, input')).toBeNull();
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('mentre es llig (null): sense recompte i sense cap número inventat, però amb l’avís que encara no està activa', () => {
    const { container } = render(<CosPersonesConfianca verificats={null} />);
    expect(textos(container)).toHaveLength(3);
    expect(textos(container)[1]).toBe(PENDENT);
    expect(container.textContent).not.toMatch(/\d/);
  });

  test('error: l’avís, sense recompte', () => {
    const { container } = render(<CosPersonesConfianca verificats={2} error />);
    expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut llegir quins contactes tens verificats.');
    expect(container.textContent).not.toMatch(/Tens 2/);
    expect(textos(container)).toContain(PENDENT);
  });

  /* Gauntlet T7b-G08 · Quan la recuperació siga activa (F7): cap «encara no», i amb tres o més, cap «Ja en tens prou… Quan…». */
  test('amb la recuperació activa: sense l’avís de pendent; amb 3, només el recompte; amb 1, el que falta', () => {
    const { container, rerender } = render(<CosPersonesConfianca verificats={3} teRecuperacio />);
    expect(textos(container)).toEqual([
      expect.stringMatching(/^Si un dia perds/),
      'Tens 3 contactes amb el número de seguretat verificat.',
      'Tria gent de qui et fies de veres: tres d’elles juntes podrien obrir la teua còpia de seguretat.'
    ]);
    rerender(<CosPersonesConfianca verificats={1} teRecuperacio />);
    expect(textos(container)[1]).toBe('Tens 1 contacte amb el número de seguretat verificat. En falten 2 per a arribar a tres.');
    expect(container.textContent).not.toMatch(/encara no està activa/);
  });
});

test('en anglés, amb el traductor de l’app', () => {
  m.t = createTranslator('en');
  const { container } = render(<CosPersonesConfianca verificats={2} />);
  expect(textos(container)[1]).toBe('Recovery with trusted people is not turned on for this node yet: right now, nobody can help you recover your private chats.');
  expect(textos(container)[2]).toBe('You have 2 contacts with a verified safety number. 1 more is needed to reach three.');
  expect(container.textContent).not.toMatch(/Tens|falten|confiança/);
});
