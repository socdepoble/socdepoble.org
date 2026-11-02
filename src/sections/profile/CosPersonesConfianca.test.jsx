/* IDEA-48 (estat previ a F7 i cerimònia SAS O3-GEMINI-2; pla 261101_1246, T7 · S6) ·
   El cos del bloc «Persones de confiança»: el recompte i el que falta per a 0, 1,
   2, 3 i 5 contactes verificats, l'error, les 3 ranures d'amics de confiança amb
   els estats de cerimònia SAS (pendent, verificat_sas, disputa), insígnia textual
   accessible, botons >= 58px (.sdp-boto--gran) i els 5 idiomes amb el traductor. */
import '../../../tests/helpers/diccionaris.js';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTranslator } from '../../config/i18n.js';
import CosPersonesConfianca, { ESTATS_CERIMONIA_SAS, normalitzaRanuresCerimonia } from './CosPersonesConfianca.jsx';

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
    expect(container.querySelector('.perfil-compte__confianca-targeta')).not.toBeNull();
    expect(container.querySelectorAll('.perfil-compte__confianca-ranura')).toHaveLength(3);
    expect(container.querySelectorAll('.perfil-compte__confianca-ranura--verificada')).toHaveLength(Math.min(verificats, 3));
    expect(Boolean(container.querySelector('.perfil-compte__confianca-escut'))).toBe(verificats >= 3);
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

describe('O3-GEMINI-2 · cerimònia SAS de les 3 ranures (pendent, verificat_sas, disputa)', () => {
  test('normalitza sempre exactament 3 ranures i valida els estats SAS', () => {
    expect(normalitzaRanuresCerimonia(null)).toBeNull();
    const ranures = normalitzaRanuresCerimonia([
      { nom: 'Pepa', estat: 'verificat_sas', sas: '48291 10492' },
      'disputa',
      { nom: 'Vicent', estat: 'estat_inventat' }
    ]);
    expect(ranures).toHaveLength(3);
    expect(ranures.map((r) => [r.numero, r.nom, r.estat])).toEqual([
      [1, 'Pepa', ESTATS_CERIMONIA_SAS.verificatSas],
      [2, '', ESTATS_CERIMONIA_SAS.disputa],
      [3, 'Vicent', ESTATS_CERIMONIA_SAS.pendent]
    ]);
  });

  test('renderitza els 3 estats SAS amb insígnia textual accessible, botons >= 58px (.sdp-boto--gran) i bloqueig per disputa', () => {
    const onAccioRanura = vi.fn();
    const onDisputa = vi.fn();
    const ranures = [
      { id: 'r1', nom: 'Pepa', estat: 'verificat_sas', sas: '12345 67890' },
      { id: 'r2', nom: 'Toni', estat: 'pendent' },
      { id: 'r3', nom: 'Maria', estat: 'pendent' }
    ];
    const { container, rerender } = render(
      <CosPersonesConfianca
        teRecuperacio
        ranures={ranures}
        onAccioRanura={onAccioRanura}
        onDisputa={onDisputa}
      />
    );

    expect(container.querySelector('[style]')).toBeNull();
    const llista = screen.getByRole('list', { name: 'Ranures de cerimònia SAS' });
    const items = within(llista).getAllByRole('listitem');
    expect(items).toHaveLength(3);

    // Insígnies textuals accessibles (no depenen només del color)
    expect(within(items[0]).getByText('SAS verificat').className).toContain('sdp-insignia--exit');
    expect(within(items[1]).getByText('Pendent de verificar SAS').className).toContain('sdp-insignia--avis');
    expect(within(items[2]).getByText('Pendent de verificar SAS').className).toContain('sdp-insignia--avis');

    // Botons d'acció >= 58px (.sdp-boto--gran = min-height: var(--sdp-alt-accio))
    const botons = container.querySelectorAll('button');
    expect(botons.length).toBe(4);
    for (const boto of botons) {
      expect(boto.className).toContain('sdp-boto--gran');
    }

    fireEvent.click(screen.getByRole('button', { name: 'Verificar codi SAS de Toni' }));
    expect(onAccioRanura).toHaveBeenCalledTimes(1);
    expect(onAccioRanura.mock.calls[0][0]).toBe(1);
    expect(onAccioRanura.mock.calls[0][1]).toMatchObject({ numero: 2, nom: 'Toni', estat: 'pendent' });

    fireEvent.click(screen.getByRole('button', { name: 'Aturar i declarar «No sóc jo»' }));
    expect(onDisputa).toHaveBeenCalledTimes(1);

    // Quan una ranura entra en estat 'disputa', apareix l'alerta d'error i es desactiven els botons d'acció
    rerender(
      <CosPersonesConfianca
        teRecuperacio
        ranures={[
          { id: 'r1', nom: 'Pepa', estat: 'verificat_sas' },
          { id: 'r2', nom: 'Toni', estat: 'disputa' },
          { id: 'r3', nom: 'Maria', estat: 'pendent' }
        ]}
        onAccioRanura={onAccioRanura}
        onDisputa={onDisputa}
      />
    );
    expect(container.querySelector('.perfil-compte__confianca-targeta').getAttribute('data-estat')).toBe('disputa');
    expect(screen.getByRole('alert').textContent).toBe(
      'S’ha declarat una disputa («No sóc jo»): la cerimònia de recuperació ha quedat bloquejada.'
    );
    expect(screen.getByText('En disputa («No sóc jo»)').className).toContain('sdp-insignia--error');
    for (const boto of container.querySelectorAll('button')) {
      expect(boto.disabled).toBe(true);
    }
  });
});

test('en anglés, amb el traductor de l’app (recompte i cerimònia SAS)', () => {
  m.t = createTranslator('en');
  const { container } = render(
    <CosPersonesConfianca
      verificats={2}
      ranures={[
        { nom: 'Pepa', estat: 'verificat_sas' },
        { nom: 'Toni', estat: 'pendent' },
        { estat: 'disputa' }
      ]}
      onAccioRanura={() => {}}
    />
  );
  expect(textos(container)[1]).toBe('Recovery with trusted people is not turned on for this node yet: right now, nobody can help you recover your private chats.');
  expect(textos(container)[2]).toBe('You have 2 contacts with a verified safety number. 1 more is needed to reach three.');
  expect(screen.getByRole('list', { name: 'SAS ceremony slots' })).toBeTruthy();
  expect(screen.getByText('SAS verified')).toBeTruthy();
  expect(screen.getByText('Pending SAS verification')).toBeTruthy();
  expect(screen.getByText('In dispute (“Not me”)')).toBeTruthy();
  expect(screen.getByText('Trusted friend slot 3')).toBeTruthy();
  expect(container.textContent).not.toMatch(/Tens|falten|confiança|Ranura/);
});
