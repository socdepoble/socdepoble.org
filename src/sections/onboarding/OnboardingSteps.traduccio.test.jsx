import { cleanup, render as pintaSol } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { RegistrationStep } from './OnboardingSteps.jsx';
import { ContrasenyaNovaStep } from './RecuperacioSteps.jsx';
import { blocsTraduibles, preparaTraduccio } from '../../components/universal/traduccio/blocsTraduibles.js';

/* Gauntlet 261030 (cicle 2, traduir-correu-a-registre) · La confirmació de
   l'alta i la contrasenya nova pinten el correu de la persona dins d'una
   frase. Encara que una pàgina amb Traduir actiu les muntara, el correu porta
   translate="no" i el Traductor Sobirà (blocsTraduibles) no l'envia mai: ni
   en HTML (Apertium) ni en text (MyMemory, en una URL GET). El correu és
   inventat. */
const CORREU = 'maria.prova@example.org';
afterEach(cleanup);
// UniversalCard (la pastilla de la data) vol un router.
const render = (node) => pintaSol(<MemoryRouter>{node}</MemoryRouter>);

const enviats = (arrel, html) => preparaTraduccio(blocsTraduibles(arrel), { html }).textos
  .map((text) => (typeof text === 'string' ? text : text.text));

test('la confirmació de l’alta: el correu es veu, porta translate="no" i no va mai al traductor', () => {
  const { container } = render(<RegistrationStep confirmationEmail={CORREU} onRegister={() => {}} onLogin={() => {}} onTornar={() => {}} />);
  expect(container.textContent).toContain(CORREU);
  expect(container.querySelector('strong[translate="no"]').textContent).toBe(CORREU);
  for (const html of [true, false]) {
    const textos = enviats(container, html);
    expect(textos.length).toBeGreaterThan(0);
    expect([html, textos.filter((text) => text.includes('@'))]).toEqual([html, []]);
  }
});

test('la contrasenya nova: «Compte: <correu>» es veu, porta translate="no" i no va mai al traductor', () => {
  const { container } = render(<ContrasenyaNovaStep correu={CORREU} onDesa={() => {}} />);
  expect(container.textContent).toContain(`Compte: ${CORREU}.`);
  expect(container.querySelector('strong[translate="no"]').textContent).toBe(CORREU);
  for (const html of [true, false]) {
    expect([html, enviats(container, html).filter((text) => text.includes('@'))]).toEqual([html, []]);
  }
});
