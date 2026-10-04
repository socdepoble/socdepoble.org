/* Notícies del Poble · la privacitat de les imatges. Cap imatge de fora es
   carrega si l'amfitrió no n'ha permés l'origen (AppLector.test.jsx ho prova
   amb la llavor tal qual). Ací l'amfitrió permet example.org amb el
   resolutor de mitjans de sempre (utils/sanitize.js · permetOrigenMitjans).
   Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515) · Les
   targetes ja no són les files i rajoles 16:9 pròpies: són UniversalCard amb
   la imatge privada (el mateix filtre de mitjans i sense referent), a la
   Revista i a les Targetes. El detall és la Pàgina Universal: la portada és
   la mateixa imatge de la targeta, sense referent, i el cos de l'article
   (article.content-wrapper) continua sense cap imatge. Fitxer a part: la
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

const IMATGES = [
  'https://example.org/colla-dimonis/fotos/correfoc.jpg', 'https://example.org/cooperativa/fotos/caquis.jpg',
  'https://example.org/veu-placa/fotos/escola.jpg', 'https://example.org/veu-placa/fotos/llavador.jpg'
];

test('amb l’origen permés per l’amfitrió, les imatges de les targetes es pinten sense referent; la portada del detall és la mateixa; el cos de l’article, mai', async () => {
  const detall = () => within(document.getElementById('app-grid-main'));
  const imatgesDe = (arrel) => [...arrel.querySelectorAll('img')];
  munta('/app/lector/noticies/hui');
  await screen.findByRole('region', { name: 'Hui' });
  /* Derogat per l'ordre del Mestre, 261004 (integració final, arreglo 6) · Les carpetes porten la
     boina de l'app amb el seu logo (un recurs propi del paquet): cap imatge de fora enlloc, i cap
     a les targetes de notícia. */
  expect(document.getElementById('app-grid-main').querySelectorAll('img')).toHaveLength(0);
  for (const img of document.querySelectorAll('img')) expect(img.getAttribute('src')).not.toMatch(/^(?:https?:)?\/\//);
  cleanup();

  permetOrigenMitjans('https://example.org');
  munta('/app/lector/noticies/hui');
  await screen.findByRole('region', { name: 'Hui' });
  const imatges = imatgesDe(document.getElementById('app-grid-main'));
  expect(imatges.map((img) => img.getAttribute('src')).sort()).toEqual(IMATGES);
  /* La imatge de la UniversalCard: el seu marc de sempre, sense referent i decorativa (el títol ja diu què és). */
  const revisa = (img) => {
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.classList.contains('sp-card-media')).toBe(true);
    expect(img.parentElement.classList.contains('sp-card-media-container')).toBe(true);
    expect(img.closest('article.sp-card')).not.toBeNull();
  };
  for (const img of imatges) revisa(img);
  /* Cap resta de la variant 16:9 ni del marcador propi. */
  expect(document.querySelector('.sdp-panoramica, .sdp-marca-article')).toBeNull();

  /* Les Targetes: les mateixes imatges, amb les mateixes garanties. */
  fireEvent.click(detall().getByRole('button', { name: 'Targetes' }));
  const enTargetes = imatgesDe(document.getElementById('app-grid-main'));
  expect(enTargetes.map((img) => img.getAttribute('src')).sort()).toEqual(IMATGES);
  for (const img of enTargetes) revisa(img);
  fireEvent.click(detall().getByRole('button', { name: 'Revista' }));

  /* Derogat per l'ordre del Mestre, 261004 (integració final, F05) · L'element principal de la
     targeta és l'enllaç al detall, no un botó. */
  fireEvent.click(detall().getByRole('link', { name: 'El ple aprova la reforma del llavador vell' }));
  const titol = await detall().findByRole('heading', { level: 1, name: 'El ple aprova la reforma del llavador vell' });
  const pagina = titol.closest('.sdp-universal-page-container');
  /* La portada de la Pàgina Universal és la imatge de la seua targeta, sense referent. */
  const portades = imatgesDe(pagina.querySelector('.hero-image'));
  expect(portades.map((img) => img.getAttribute('src'))).toEqual(['https://example.org/veu-placa/fotos/llavador.jpg']);
  expect(portades[0].getAttribute('referrerpolicy')).toBe('no-referrer');
  /* Cap altra imatge a la pàgina: ni al cos de l'article ni a la boina (el logo de la font no hi va). */
  expect(pagina.querySelector('article.content-wrapper').querySelectorAll('img')).toHaveLength(0);
  expect(imatgesDe(pagina)).toEqual(portades);
});
