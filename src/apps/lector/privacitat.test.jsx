/* Notícies del Poble · la privacitat de les imatges. Cap imatge de fora es
   carrega si l'amfitrió no n'ha permés l'origen (AppLector.test.jsx ho prova
   amb la llavor tal qual). Ací l'amfitrió permet example.org amb el
   resolutor de mitjans de sempre (utils/sanitize.js · permetOrigenMitjans).
   Bloc 0 del Gauntlet (ordre del Mestre, 261016) · Actualitzada a posta: la
   llista ja no és de UniversalCard amb la imatge privada, és la fila de
   l'espai de treball (DefaultItemCard), que la pintaria amb ItemMedia sense
   política de referent. Per això les files no porten cap imatge, tampoc amb
   l'origen permés. El detall és la Pàgina Universal: la portada és la imatge
   de la notícia, sense referent, i el cos de l'article (article.content-wrapper)
   continua sense cap imatge. Fitxer a part: la llista d'orígens és estat del
   mòdul i no ha de tocar les altres proves. */
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { munta, tancats } from './__fixtures__/muntaLector.jsx';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const LLAVADOR = 'El ple aprova la reforma del llavador vell';
const fitxa = (titol) => [...document.getElementById('app-grid-list').querySelectorAll('button.sdp-gestor-fitxa')]
  .find((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent === titol);

test('amb l’origen permés per l’amfitrió, cap imatge a les files; la portada del detall, sense referent; el cos de l’article, mai', async () => {
  const imatgesDe = (arrel) => [...arrel.querySelectorAll('img')];
  munta('/app/lector/noticies/hui');
  await screen.findByRole('region', { name: 'Hui' });
  expect(document.querySelectorAll('.app-grid-page img')).toHaveLength(0);
  cleanup();

  permetOrigenMitjans('https://example.org');
  munta('/app/lector/noticies/hui');
  await screen.findByRole('region', { name: 'Hui' });
  /* Cap imatge a la llista ni a l'arbre, encara que l'origen siga permés: la fila no en demana. */
  expect(imatgesDe(document.getElementById('app-grid-list'))).toEqual([]);
  expect(imatgesDe(document.getElementById('app-grid-sidebar'))).toEqual([]);
  expect(document.querySelector('.sdp-gestor-fitxa__imatge')).toBeNull();
  /* Cap resta de la variant 16:9 ni del marcador propi. */
  expect(document.querySelector('.sdp-panoramica, .sdp-marca-article')).toBeNull();

  fireEvent.click(fitxa(LLAVADOR));
  const titol = await screen.findByRole('heading', { level: 1, name: LLAVADOR });
  const pagina = titol.closest('.sdp-universal-page-container');
  /* La portada de la Pàgina Universal és la imatge de la notícia, sense referent. */
  const portades = imatgesDe(pagina.querySelector('.hero-image'));
  expect(portades.map((img) => img.getAttribute('src'))).toEqual(['https://example.org/veu-placa/fotos/llavador.jpg']);
  expect(portades[0].getAttribute('referrerpolicy')).toBe('no-referrer');
  /* Cap altra imatge a la pàgina: ni al cos de l'article ni a la boina (el logo de la font no hi va). */
  expect(pagina.querySelector('article.content-wrapper').querySelectorAll('img')).toHaveLength(0);
  expect(imatgesDe(pagina)).toEqual(portades);
  /* Ni amb la notícia oberta: la llista continua sense cap imatge. */
  expect(imatgesDe(document.getElementById('app-grid-list'))).toEqual([]);
});
