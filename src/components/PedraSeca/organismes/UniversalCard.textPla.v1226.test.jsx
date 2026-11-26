/* IDEA-357.2 (v1.2.26, Llibre Mestre línia 3681) · «Defensa en profunditat obligatòria al conversor de
   targetes (UniversalCard / extractor d'entradetes)»: el cos de text d'una UniversalCard mai no pinta
   marques Markdown crues (**, __, `, [text](url)), vinga de qui vinga (PaginaEditorialEtiqueta passa
   l'entradeta crua de la Wiki, EventCard la de l'acte). El netejador és el lineal de textPlaSenseMarkdown.js amb
   llevaHtml: false, perquè un cos de text ja és text: «< 5 graus», 2*3*4 o 5**2 es queden sencers (D2 de
   l'integrador C1-3). La traducció de la targeta parteix del mateix text net (textCosCard). Un cos que
   ja és un element de React és de qui el pinta. El transport lliure, com a UniversalCard.traduccioR51. */
import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../../data/backendPort.js', async (importOriginal) => ({ ...(await importOriginal()), teCapacitat: () => false }));
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...resta }) => React.createElement('a', { href: to, ...resta }, children)
}));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
import { UniversalCard } from './UniversalCard.jsx';
import { fixaCarregadorLliure, fixaTraductorLliure } from '../../../data/traductorDelLloc.js';

let motor;
beforeEach(() => {
  vi.clearAllMocks();
  motor = {
    disponible: true,
    comprovaPagina: vi.fn(),
    tradueix: vi.fn(async (textos, desti) => ({ traduccions: textos.map((text) => `[${desti}] ${text}`), desti, cache: false }))
  };
  fixaTraductorLliure('apertium');
  fixaCarregadorLliure(async () => ({ creaTraductorApertium: () => motor }));
});
afterEach(() => {
  cleanup();
  fixaTraductorLliure(null);
  fixaCarregadorLliure(null);
});

const pinta = (body, extra) => render(<UniversalCard title="Fira de l’Oli" body={body} hasFooter={false} {...extra} />).container;
const cos = (arrel) => arrel.querySelector('.sp-card-body > p.sp-card-text');

describe('IDEA-357.2 · el cos de text de la UniversalCard és text pla net', () => {
  test('body «**x** `y`» → «x y»', () => {
    expect(cos(pinta('**x** `y`')).textContent).toBe('x y');
  });

  test('negretes, cursives, codi i enllaços Markdown no arriben mai a la targeta', () => {
    const arrel = pinta('La **festa** de `poble` amb [música](/agenda), __ball__ i _sopar_.');
    expect(cos(arrel).textContent).toBe('La festa de poble amb música, ball i sopar.');
    expect(arrel.textContent).not.toMatch(/\*\*|__|`|\]\(/);
  });

  test('el contingut legítim es queda sencer: < i > de text, multiplicacions, potències, signes i guions baixos', () => {
    for (const legitim of [
      'Si fa < 5 graus i > 30 graus, tapa-ho.',
      'Barreja 2*3*4 grams i 5**2 cullerades.',
      '- 5 graus a la matinada',
      'L’arxiu es diu foto_de_la_placa.jpg.',
      '<b>Text</b> que ja és text'
    ]) {
      cleanup();
      expect(cos(pinta(legitim)).textContent).toBe(legitim);
    }
  });

  test('un cos que és un element de React no es toca', () => {
    const arrel = pinta(<span className="propi">Fet a mà</span>);
    expect(arrel.querySelector('.sp-card-body > div.sp-card-text > span.propi').textContent).toBe('Fet a mà');
  });

  test('la traducció parteix del text net i en pinta el resultat', async () => {
    const arrel = pinta('**Diumenge** al `matí`.', { hasFooter: true, showTranslate: true });
    act(() => { arrel.querySelector('[aria-label="Traduir Fira de l’Oli"]').click(); });
    const castella = [...arrel.querySelectorAll('[role="menuitemradio"]')].find((opcio) => opcio.textContent.includes('Castellà'));
    await act(async () => { castella.click(); });
    await waitFor(() => expect(cos(arrel).textContent).toBe('[ES] Diumenge al matí.'));
    const enviats = motor.tradueix.mock.calls.flatMap(([textos]) => textos);
    expect(enviats).toContain('Diumenge al matí.');
    expect(enviats.join(' ')).not.toMatch(/\*\*|`/);
  });
});
