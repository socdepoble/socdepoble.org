/* Onada v1.2.23+ (R32.53) · IDEA-336 · Jerarquia d'escaneig visual Pedra Seca en CandidatsAlergens
   sense trencar l'invariant legal (mai passar candidats a IconesAlergens) ni el contracte DOM. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { CandidatsAlergens } from './CandidatsAlergens.jsx';
import { proposaCandidatsAlergens } from '../../../utils/candidatsAlergens.js';
import { ESTAT_CANDIDATS_ALERGENS, LLENGUES_ALERGENS } from '../../../utils/textosAlergens.js';
import { ALERGENS } from '../../../utils/productes/producteUniversal.js';

afterEach(cleanup);

function matriuEditorialMostra() {
  return {
    id: 'allioli-mostra',
    estat: ESTAT_CANDIDATS_ALERGENS,
    metode: 'matriu_receptari_r17',
    cobertura: 'completa',
    liniesPendents: [],
    alergens: ALERGENS.map((id) => {
      if (id === 'ous') {
        return {
          id,
          proposta: 'traca',
          traca: { estat: 'candidat', evidencies: [{ text: 'Variants amb rovell d’ou', camp: 'notes', naturalesa: 'nota_literal' }] },
        };
      }
      if (id === 'gluten') {
        return {
          id,
          proposta: 'ingredient',
          ingredient: { estat: 'candidat', evidencies: [{ text: 'Farina de blat', camp: 'ingredients[0]', naturalesa: 'ingredient_literal' }] },
        };
      }
      return { id, proposta: 'no-declarat' };
    }),
  };
}

describe('R32.53 · CandidatsAlergens jerarquia visual Pedra Seca i invariants legals', () => {
  test.each(LLENGUES_ALERGENS)('en %s aplica les classes diferenciades per a «•», «T» i «—» i mai munta IconesAlergens ni botons', (llengua) => {
    const { container } = render(<CandidatsAlergens proposta={matriuEditorialMostra()} llengua={llengua} escandall={false} />);
    const seccio = container.querySelector('section.sdp-candidats-alergens');
    expect(seccio).toBeTruthy();

    const gluten = container.querySelector('li[data-alergen="gluten"]');
    expect(gluten.dataset.simbol).toBe('•');
    expect(gluten.classList.contains('sdp-candidats-alergens__item--present')).toBe(true);
    expect(gluten.querySelector('.sdp-candidats-alergens__estat--present')).toBeTruthy();

    const ous = container.querySelector('li[data-alergen="ous"]');
    expect(ous.dataset.simbol).toBe('T');
    expect(ous.classList.contains('sdp-candidats-alergens__item--traca')).toBe(true);
    expect(ous.querySelector('.sdp-candidats-alergens__estat--traca')).toBeTruthy();

    const absents = container.querySelectorAll('li[data-simbol="—"]');
    expect(absents).toHaveLength(12);
    for (const fila of absents) {
      expect(fila.classList.contains('sdp-candidats-alergens__item--absent')).toBe(true);
      expect(fila.querySelector('.sdp-candidats-alergens__estat--absent')).toBeTruthy();
    }

    /* Invariant legal innegociable: mai renderitzar IconesAlergens ni botons de validació. */
    expect(container.querySelector('.sdp-alergens')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('adopta el full diferit candidats-alergens i marca les files «? Sense dada» amb l’estat desconegut', () => {
    const proposta = proposaCandidatsAlergens({
      id: 'oli-sal',
      fonts: [{ text: 'Oli d’oliva', tipus: 'ingredient_literal', camp: 'ingredients[0]' }],
    });
    const { container } = render(<CandidatsAlergens proposta={proposta} llengua="ca" />);
    const desconeguts = container.querySelectorAll('li.sdp-candidats-alergens__item--desconegut');
    expect(desconeguts).toHaveLength(14);
  });
});
