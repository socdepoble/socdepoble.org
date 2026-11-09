/* R51 (P0-46 / IDEA-177; R51V-03) · La targeta del Mur passa tots els casos
   pel pla del contracte (planTraduccioPublicacio.js): sense mode, el peu de
   sempre (Llei del Píxel); amb on_the_fly, Traduir; amb 'none', cap Traduir;
   amb la revisada completa, el títol de la llengua de la interfície i cap
   Traduir; amb una revisada incompleta, un mode invàlid o una llengua que no
   és de les cinc, l'original, un avís a la targeta i cap Traduir (mai
   Apertium). L'arnés de TargetaDelMur.identitat.test.jsx. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const ui = vi.hoisted(() => ({ language: 'ca' }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  useSearchParams: () => [new URLSearchParams(), () => {}],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, language: ui.language }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => false, loadPerfilPublic: async () => null }));
import { TargetaDelMur } from './TargetaDelMur.jsx';

afterEach(() => { cleanup(); ui.language = 'ca'; });

const pinta = (item) => render(<TargetaDelMur item={item} />).container;
const accions = (item) => [...pinta(item).querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label'));
const publicacio = (extra) => ({ id: 'p1', type: 'feed', title: 'Crònica', description: 'Entradeta original', created_at: '2026-10-17T10:00:00.000Z', ...extra });
const AVIS = 'Esta publicació no té la traducció ben configurada: es mostra en la llengua original, sense traducció automàtica.';
const revisades = (llengues = ['ca', 'es', 'en', 'eu', 'gl']) => Object.fromEntries(llengues.map((codi) => [codi, { title: `Crònica ${codi}`, content: `<p>Cos ${codi}</p>`, reviewed: true }]));

test('sense mode o amb l’automàtica, Traduir de sempre; amb «none», cap Traduir i la resta del peu igual', () => {
  expect(accions(publicacio({}))).toEqual(['Traduir Crònica', 'Comentar Crònica', 'Compartir Crònica', 'Connectar amb Crònica']);
  cleanup();
  expect(accions(publicacio({ translation_mode: 'on_the_fly', source_language: 'ca' }))[0]).toBe('Traduir Crònica');
  cleanup();
  // Una altra llengua d'origen: el pla és on_the_fly, i Traduir hi és.
  expect(accions(publicacio({ translation_mode: 'on_the_fly', source_language: 'es' }))[0]).toBe('Traduir Crònica');
  cleanup();
  expect(accions(publicacio({ translation_mode: 'none', source_language: 'ca' }))).toEqual(['Comentar Crònica', 'Compartir Crònica', 'Connectar amb Crònica']);
});

/* V2-01 · L'article de la targeta: translate="no" amb 'none', la revisada o
   un error (el Traduir de la pàgina no n'envia cap text al motor); sense
   mode o amb l'automàtica, cap atribut (el DOM de sempre). */
test.each([
  ['sense mode', {}, null],
  ['l’automàtica', { translation_mode: 'on_the_fly', source_language: 'es' }, null],
  ['l’automàtica en la mateixa llengua', { translation_mode: 'on_the_fly', source_language: 'ca' }, null],
  ['«none»', { translation_mode: 'none', source_language: 'ca' }, 'no'],
  ['la revisada completa', { translation_mode: 'curated_5_langs', source_language: 'es', translations: revisades() }, 'no'],
  ['la revisada en la mateixa llengua', { translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades() }, 'no'],
  ['la revisada incompleta', { translation_mode: 'curated_5_langs', source_language: 'es', translations: revisades(['ca']) }, 'no'],
  ['un mode que no existix', { translation_mode: 'auto', source_language: 'ca' }, 'no']
])('V2-01 · %s: l’atribut translate de l’article', (_, extra, esperat) => {
  const article = pinta(publicacio(extra)).querySelector('article');
  expect(article.getAttribute('translate')).toBe(esperat);
});

test('la revisada completa: el títol revisat de la llengua de la interfície, cap text de l’original i cap Traduir', () => {
  ui.language = 'en';
  const targeta = pinta(publicacio({ translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades() }));
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('Crònica en');
  expect(targeta.textContent).not.toContain('Entradeta original');
  expect(targeta.textContent).not.toContain(AVIS);
  const botons = [...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label'));
  expect(botons.some((nom) => nom.startsWith('Traduir'))).toBe(false);
});

test.each([
  ['la revisada incompleta', { translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades(['ca', 'es', 'en', 'eu']) }],
  ['un mode que no existix', { translation_mode: 'auto', source_language: 'ca' }],
  ['un mode en majúscules', { translation_mode: 'ON_THE_FLY', source_language: 'ca' }],
  ['l’automàtica sense llengua original', { translation_mode: 'on_the_fly' }],
  ['una llengua que no és de les cinc', { translation_mode: 'none', source_language: 'fr' }]
])('%s: l’original, l’avís a la targeta i cap Traduir (mai Apertium)', (_, extra) => {
  ui.language = 'es';
  const targeta = pinta(publicacio(extra));
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('Crònica');
  expect(targeta.textContent).toContain('Entradeta original');
  expect(targeta.textContent).toContain(AVIS);
  // Sense regió viva: una llista no anuncia cada targeta en pintar-se.
  expect(targeta.querySelector('[role="status"], [role="alert"]')).toBeNull();
  const botons = [...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label'));
  expect(botons).toEqual(['Comentar Crònica', 'Compartir Crònica', 'Connectar amb Crònica']);
});

test.each([
  ['none', { translation_mode: 'none', source_language: 'ca' }],
  ['curated', { translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades() }],
  ['curated incompleta', { translation_mode: 'curated_5_langs', source_language: 'ca', translations: {} }],
  ['invàlid', { translation_mode: 'auto', source_language: 'ca' }],
])('R56 · la branca EventCard amb %s tampoc oferix Traduir ni entra al motor de pàgina', (_, extra) => {
  ui.language = 'en';
  const targeta = pinta(publicacio({ type: 'event', ...extra }));
  expect(targeta.querySelector('article').getAttribute('translate')).toBe('no');
  expect([...targeta.querySelectorAll('.sp-card-footer button')].some(b => b.getAttribute('aria-label')?.startsWith('Traduir'))).toBe(false);
  if (extra.translations && Object.keys(extra.translations).length) {
    expect(targeta.querySelector('.sp-card-title').textContent).toBe('Crònica en');
    expect(targeta.querySelector('.sp-card-title').getAttribute('lang')).toBe('en');
    expect(targeta.textContent).not.toContain('Entradeta original');
  }
  if (extra.translation_mode === 'auto' || extra.translations && !Object.keys(extra.translations).length) expect(targeta.textContent).toContain(AVIS);
});

test.each([{}, { translation_mode: 'on_the_fly', source_language: 'ca' }])('R56 · EventCard sense mode o automàtic conserva el peu de sempre: %j', extra => {
  const targeta = pinta(publicacio({ type: 'event', ...extra }));
  expect(targeta.querySelector('article').hasAttribute('translate')).toBe(false);
  expect([...targeta.querySelectorAll('.sp-card-footer button')].some(b => b.getAttribute('aria-label')?.startsWith('Traduir'))).toBe(true);
});
