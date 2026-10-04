/* Plataforma d'Apps Enxufables · el portal /app com a pàgina de sistema.
   Norma del Mestre, 261004 (logotips; «SÍ A TOT») · Abans el portal pintava
   el bloc del títol a mà, fora de la Pàgina Universal: sense barra blava, ni
   taronja, ni logotip. Ara és una PaginaApp: doble barra, la boina de Sóc de
   Poble enllaçada a /projecte i el seu logotip dalt de l'H1, amb el contingut
   i l'ordre de sempre (l'H1, l'entradeta i la llista). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { delVal } from '../../config/storage.js';
import { muntaPlataforma } from './__fixtures__/munta.jsx';
import { manifestDeProva } from './__fixtures__/manifests.js';
import { CLAU_PREFERENCIES, _reiniciaPreferencies } from './preferenciesApps.js';
import { creaRegistre } from './registreApps.js';

const carrega = vi.fn(() => Promise.resolve({ default: () => null }));
const registre = () => creaRegistre({ internes: [manifestDeProva({ carrega })] });

beforeEach(() => {
  delVal(CLAU_PREFERENCIES);
  _reiniciaPreferencies();
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  delVal(CLAU_PREFERENCIES);
  _reiniciaPreferencies();
});

const fills = (element) => [...element.children].map((e) => e.className);

describe('el portal /app és una Pàgina Universal de sistema', () => {
  test('doble barra, la boina de Sóc de Poble enllaçada a /projecte, i el bloc del títol dins de la pàgina', () => {
    const { container } = muntaPlataforma('/app', { registre: registre() });
    const pagina = container.querySelector('.sdp-universal-page-container');
    expect(pagina).not.toBeNull();
    expect(fills(pagina)).toEqual(['bar-blue', 'bar-orange', 'page-title', 'content-wrapper']);
    const autor = pagina.querySelector('section.bar-orange').firstElementChild;
    expect(autor.getAttribute('href')).toBe('/projecte');
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    expect(container.querySelectorAll('header.page-title')).toHaveLength(1);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  test('el logotip de Sóc de Poble, clar i fosc, va dalt de l’H1 «Apps»', () => {
    const { container } = muntaPlataforma('/app', { registre: registre() });
    const capcalera = container.querySelector('header.page-title');
    expect([...capcalera.children].map((e) => `${e.tagName}.${e.className}`)).toEqual([
      'IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only', 'H1.'
    ]);
    expect([...capcalera.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual([
      '/assets/system/ui/logo-socdepoble-rect-negre.svg', '/assets/system/ui/logo-socdepoble-rect-blanc.svg'
    ]);
    expect(screen.getByRole('heading', { level: 1, name: 'Apps' })).toBe(capcalera.querySelector('h1'));
  });

  test('el contingut i l’ordre de sempre: l’H1, l’entradeta i la llista de les apps', () => {
    const { container } = muntaPlataforma('/app', { registre: registre() });
    const article = container.querySelector('article.content-wrapper');
    expect(article.querySelector('.page-intro p.lead').textContent)
      .toBe('Eines del poble que s’enxufen i es desenxufen. El node decidix quines porta; tu, quines vols vore.');
    const llista = article.querySelector('.sdp-app-portal > ul.sdp-app-portal__llista');
    expect(llista).not.toBeNull();
    expect(article.querySelector('.page-intro').compareDocumentPosition(llista) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(llista).getByRole('heading', { level: 2, name: 'La Prova' })).toBeTruthy();
    expect(carrega).not.toHaveBeenCalled();
  });

  test('sense apps, l’estat buit va al mateix lloc, dins de la pàgina', () => {
    const { container } = muntaPlataforma('/app', { registre: creaRegistre({ internes: [] }) });
    expect(container.querySelector('article.content-wrapper .sdp-app-portal').textContent).toContain('Encara no hi ha cap app');
    expect(container.querySelectorAll('header.page-title > img.page-title-logo')).toHaveLength(2);
  });

  test('Tornar de la barra blava va a la pàgina d’abans', () => {
    const enrere = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    muntaPlataforma('/app', { registre: registre() });
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    expect(enrere).toHaveBeenCalledTimes(1);
    enrere.mockRestore();
  });
});
