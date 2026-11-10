/* Onada R15b (RV-01, RV-02) · El panell de la proposta assistida d'al·lèrgens: l'etiqueta obligatòria és el títol en
   les 5 llengües, cada fila és «•», «T» o «? Sense dada» (mai una absència), la cobertura parcial mostra les línies que
   el lèxic no coneix i la línia d'escandall només ix on es demana. Cap botó: el panell no valida ni publica. */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CandidatsAlergens } from './CandidatsAlergens.jsx';
import { proposaCandidatsAlergens } from '../../../utils/candidatsAlergens.js';
import { LLENGUES_ALERGENS, TEXTOS_ALERGENS } from '../../../utils/textosAlergens.js';
import { ALERGENS } from '../../../utils/productes/producteUniversal.js';

afterEach(cleanup);

const proposta = (linies) => proposaCandidatsAlergens({ id: 'mostra',
  fonts: linies.map((text, i) => ({ text, tipus: 'ingredient_literal', camp: `ingredients[${i}]` })) });
const files = (container) => [...container.querySelectorAll('li[data-alergen]')];

describe('panell d’al·lèrgens · proposta assistida pendent de validació humana', () => {
  it.each(LLENGUES_ALERGENS)('%s: etiqueta obligatòria com a títol, llegenda, 14 files i «•» per als cacaus', (llengua) => {
    const t = TEXTOS_ALERGENS[llengua];
    const { container } = render(<CandidatsAlergens proposta={proposta(['Cacaus', 'Oli'])} llengua={llengua} />);
    const seccio = screen.getByRole('region', { name: t.ariaLabel });
    expect(seccio.getAttribute('lang')).toBe(llengua);
    expect(within(seccio).getByRole('heading', { level: 3 }).textContent).toBe(t.etiqueta);
    expect(within(seccio).getByRole('note').textContent).toBe(t.llegenda);
    expect(files(container).map((li) => li.dataset.alergen)).toEqual(ALERGENS);
    const cacauets = container.querySelector('li[data-alergen="cacauets"]');
    expect(cacauets.dataset.simbol).toBe('•');
    expect(cacauets.textContent).toContain(`${t.noms.cacauets}: ${t.ingredient}`);
    expect(files(container).filter((li) => li.dataset.simbol === '?').map((li) => li.textContent.endsWith(t.desconegut)))
      .toEqual(Array(13).fill(true));
    expect(seccio.textContent).toContain(t.completa);
    expect(within(seccio).queryByRole('button')).toBeNull();
  });

  it('l’etiqueta exacta en valencià i cap paraula d’absència', () => {
    const { container } = render(<CandidatsAlergens proposta={proposta(['Oli', 'Sal'])} />);
    expect(screen.getByRole('heading', { name: 'Proposta assistida · Pendent de validació humana' })).toBeTruthy();
    expect(container.textContent).not.toMatch(/\babsent|lliure de|sense gluten|cap dels 14/i);
  });

  /* Abans, la prova del camí de compatibilitat src/components/universal/CandidatsAlergens.jsx (esborrat a R15b per
     LLEI_08, ja no l'importava ningú): una marca d'ingredient i una de traça en valencià, la llegenda de «? sense dada»
     i, a les dotze files sense marca, «? Sense dada», mai una absència. */
  it('ingredient i traça en valencià: dotze files «? Sense dada» i cap paraula d’absència', () => {
    const ambTraca = proposaCandidatsAlergens({ id: 'mostra', fonts: [
      { text: 'Llet', tipus: 'ingredient_literal', camp: 'ingredients[0]' },
      { text: 'Pot contindre traces de soja', tipus: 'ingredient_literal', camp: 'etiqueta' }
    ] });
    const { container } = render(<CandidatsAlergens proposta={ambTraca} />);
    expect(screen.getByRole('heading', { name: 'Proposta assistida · Pendent de validació humana' })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toContain('? sense dada: no vol dir que no n’hi haja');
    expect(files(container)).toHaveLength(14);
    expect(container.querySelectorAll('li[data-simbol="?"]')).toHaveLength(12);
    expect(container.querySelector('li[data-alergen="llet"]').textContent).toContain('Llet: • Ingredient');
    expect(container.querySelector('li[data-alergen="soja"]').textContent).toContain('Soja: T Traça');
    for (const fila of container.querySelectorAll('li[data-simbol="?"]')) expect(fila.textContent).toMatch(/: \? Sense dada$/);
    expect(container.textContent).not.toMatch(/absent|no en conté|lliure d/i);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getAllByText('Font literal de la proposta')).toHaveLength(2);
  });

  it('cobertura parcial: la línia desconeguda ix amb lang="ca" i els no marcats queden «? Sense dada»', () => {
    const { container } = render(<CandidatsAlergens proposta={proposta(['Un grapat de gambotes', 'Ous'])} llengua="en" />);
    expect(container.querySelector('section').dataset.cobertura).toBe('parcial');
    const pendent = [...container.querySelectorAll('section > p q')];
    expect(pendent.map((q) => [q.textContent, q.getAttribute('lang')])).toEqual([['Un grapat de gambotes', 'ca']]);
    expect(container.textContent).toContain(TEXTOS_ALERGENS.en.parcial);
    expect(container.textContent).toContain(TEXTOS_ALERGENS.en.noMarcats);
    expect(container.querySelector('li[data-alergen="crustacis"]').textContent).toBe(`Crustaceans: ${TEXTOS_ALERGENS.en.desconegut}`);
    expect(container.querySelector('li[data-alergen="ous"]').dataset.simbol).toBe('•');
  });

  it('la font literal de cada marca, amb el text en valencià', () => {
    const { container } = render(<CandidatsAlergens proposta={proposta(['Llet; pot contindre traces de soja'])} llengua="es" />);
    const soja = container.querySelector('li[data-alergen="soja"]');
    expect(soja.dataset.simbol).toBe('T');
    expect(within(soja).getByText(TEXTOS_ALERGENS.es.fontLiteral)).toBeTruthy();
    expect(soja.querySelector('q').getAttribute('lang')).toBe('ca');
  });

  it('la línia d’escandall només ix quan es demana', () => {
    const ambEscandall = { ...proposta(['Oli']), escandall: { motiu: 'Falten racions.' } };
    const { container, rerender } = render(<CandidatsAlergens proposta={ambEscandall} />);
    expect(container.textContent).toContain('Escandall pendent: Falten racions.');
    rerender(<CandidatsAlergens proposta={ambEscandall} escandall={false} />);
    expect(container.textContent).not.toMatch(/escandall/i);
  });

  it('no presenta una proposta amb estat falsificat com a validada', () => {
    const { container } = render(<CandidatsAlergens proposta={{ estat: 'validat', alergens: [] }} />);
    expect(container.textContent).toBe('');
  });
});

describe('panell d’al·lèrgens · codi de llengua', () => {
  it.each([['es-ES', 'es'], ['EN', 'en'], ['gl_ES', 'gl'], ['fr', 'ca'], [undefined, 'ca']])('«%s» → %s', (entrada, codi) => {
    const { container } = render(<CandidatsAlergens proposta={proposta(['Oli'])} llengua={entrada} />);
    expect(container.querySelector('section').getAttribute('lang')).toBe(codi);
    expect(container.querySelector('h3').textContent).toBe(TEXTOS_ALERGENS[codi].etiqueta);
  });
});
