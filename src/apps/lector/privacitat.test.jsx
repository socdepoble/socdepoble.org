/* Notícies del Poble · la privacitat de les imatges. Cap imatge de fora es
   carrega si l'amfitrió no n'ha permés l'origen (AppLector.test.jsx ho prova
   amb la llavor tal qual). Ací l'amfitrió permet example.org amb el
   resolutor de mitjans de sempre (utils/sanitize.js · permetOrigenMitjans):
   les imatges 16:9 de les targetes (la variant panoràmica de Pedra Seca,
   l'excepció del Lector) apareixen, sense referent, a la Revista i a les
   Targetes; el cos de l'article continua sense cap imatge. Fitxer a part: la
   llista d'orígens és estat del mòdul i no ha de tocar les altres proves. */
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { munta, tancats } from './__fixtures__/muntaLector.jsx';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('amb l’origen permés per l’amfitrió, les imatges de les targetes es pinten (16:9, sense referent); el cos de l’article, mai', async () => {
  const detall = () => within(document.getElementById('app-grid-main'));
  munta('/app/lector/noticies/hui');
  await screen.findByRole('region', { name: 'Hui' });
  expect(document.querySelectorAll('img')).toHaveLength(0);
  cleanup();

  permetOrigenMitjans('https://example.org');
  munta('/app/lector/noticies/hui');
  await screen.findByRole('region', { name: 'Hui' });
  const imatges = [...document.getElementById('app-grid-main').querySelectorAll('img')];
  expect(imatges.map((img) => img.getAttribute('src')).sort()).toEqual([
    'https://example.org/colla-dimonis/fotos/correfoc.jpg', 'https://example.org/cooperativa/fotos/caquis.jpg',
    'https://example.org/veu-placa/fotos/escola.jpg', 'https://example.org/veu-placa/fotos/llavador.jpg'
  ]);
  const revisa = (img, classe) => {
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.closest('[aria-hidden="true"]')).not.toBeNull();
    /* La variant panoràmica: la imatge permesa ocupa el marc 16:9 de la targeta. */
    expect(img.classList.contains(classe)).toBe(true);
    expect(img.closest('.sdp-panoramica')).not.toBeNull();
  };
  for (const img of imatges) revisa(img, 'sdp-marca-article__imatge');
  /* Les notícies sense imatge, el marcador en el mateix marc. */
  expect(document.getElementById('app-grid-main').querySelectorAll('.sdp-panoramica .sdp-llista-articles__quadrat > .sdp-marca-article')).toHaveLength(2);

  /* Les Targetes: les mateixes imatges, damunt del títol. */
  fireEvent.click(detall().getByRole('button', { name: 'Targetes' }));
  const enTargetes = [...document.getElementById('app-grid-main').querySelectorAll('.sdp-rajola__media img')];
  expect(enTargetes.map((img) => img.getAttribute('src')).sort()).toEqual(imatges.map((img) => img.getAttribute('src')).sort());
  for (const img of enTargetes) revisa(img, 'sdp-rajola__imatge');
  fireEvent.click(detall().getByRole('button', { name: 'Revista' }));

  fireEvent.click(detall().getByRole('button', { name: /^El ple aprova la reforma del llavador vell/ }));
  const titol = await detall().findByRole('heading', { level: 2, name: 'El ple aprova la reforma del llavador vell' });
  expect(titol.closest('article').querySelectorAll('img')).toHaveLength(0);
});
