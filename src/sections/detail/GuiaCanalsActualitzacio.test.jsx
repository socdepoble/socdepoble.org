/**
 * GuiaCanalsActualitzacio.test.jsx — Proves del bloc pedagògic dels canals
 * d'actualització al peu de `/page/descarregues` (Onada R22 · T2).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const ui = vi.hoisted(() => ({ t: (_clau, reserva) => reserva }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (...args) => ui.t(...args) })
}));

import CA from '../../config/idiomes/ca.js';
import EN from '../../config/idiomes/en.js';
import ES from '../../config/idiomes/es.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import GuiaCanalsActualitzacio from './GuiaCanalsActualitzacio.jsx';

afterEach(cleanup);

describe('GuiaCanalsActualitzacio', () => {
  test('explica Google Play vs APK i UPDATE_INCOMPATIBLE en les llengües del sistema, sense <dl> ni enllaços duplicats de botiga', () => {
    ui.t = (clau, reserva) => CA[clau] ?? reserva;
    const { container, rerender } = render(<GuiaCanalsActualitzacio />);

    expect(container.querySelectorAll('dl')).toHaveLength(0);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 3, name: CA['descarregues.canals.titol'] })).toBeTruthy();
    expect(container.textContent).toContain('Google Play');
    expect(container.textContent).toContain('APK');
    expect(container.textContent).toContain('UPDATE_INCOMPATIBLE');

    ui.t = (clau, reserva) => EU[clau] ?? reserva;
    rerender(<GuiaCanalsActualitzacio />);
    expect(screen.getByRole('heading', { level: 3, name: EU['descarregues.canals.titol'] })).toBeTruthy();
    expect(container.textContent).toContain('UPDATE_INCOMPATIBLE');

    ui.t = (clau, reserva) => GL[clau] ?? reserva;
    rerender(<GuiaCanalsActualitzacio />);
    expect(screen.getByRole('heading', { level: 3, name: GL['descarregues.canals.titol'] })).toBeTruthy();
  });

  test('el botó centrat fa scroll i porta el focus al títol principal de la pàgina', () => {
    ui.t = (clau, reserva) => CA[clau] ?? reserva;
    const capcalera = document.createElement('header');
    capcalera.className = 'page-title';
    const h1 = document.createElement('h1');
    h1.textContent = 'Aplicacions';
    h1.scrollIntoView = vi.fn();
    capcalera.appendChild(h1);
    document.body.appendChild(capcalera);

    render(<GuiaCanalsActualitzacio />);
    fireEvent.click(screen.getByRole('button', { name: CA['descarregues.canals.pujaBotons'] }));

    expect(h1.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(h1.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(h1);

    capcalera.remove();
  });

  /* R24 botigues · E1 (KGA-07, RC-8) · Desinstal·lar per canviar de canal esborra el que viu només al
     telèfon (allowBackup=false): el llibre de la Facturació i el cofre de la Gestoria (IndexedDB). El bloc
     d'avís ho diu abans, i nomena les dues còpies que la persona pot fer. La signatura de Play i la de
     l'APK no s'han verificat a Play Console: el text ja no afirma que són diferents, ho diu en condicional. */
  test('E1 · el bloc d’avís diu que cal fer còpia de la Facturació i del cofre abans de desinstal·lar, en les cinc llengües', () => {
    ui.t = (clau, reserva) => CA[clau] ?? reserva;
    const { container, rerender } = render(<GuiaCanalsActualitzacio />);
    const avis = () => container.querySelector('.sdp-guia-canals__bloc--avis');
    expect(avis().textContent).toMatch(/Facturació/);
    expect(avis().textContent).toMatch(/cofre/);
    expect(avis().textContent).toMatch(/Abans de desinstal·lar/);
    expect(avis().textContent).toContain('«Còpia del llibre»');
    expect(avis().textContent).toContain('«Descarrega la còpia xifrada»');
    expect(avis().textContent).not.toMatch(/usen certificats de signatura diferents/);
    for (const [dic, facturacio, cofre] of [[ES, /Facturación/, /cofre/], [EN, /Invoicing/, /vault/], [EU, /Fakturazio/, /kutxa gotorra/], [GL, /Facturación/, /cofre/]]) {
      ui.t = (clau, reserva) => dic[clau] ?? reserva;
      rerender(<GuiaCanalsActualitzacio />);
      expect(avis().textContent).toMatch(facturacio);
      expect(avis().textContent).toMatch(cofre);
      expect(avis().textContent).toContain('Còpia del llibre');
      expect(avis().textContent).toContain('Descarrega la còpia xifrada');
    }
    /* La reserva de cada crida és el valor valencià (sense diccionari, el mateix text). */
    ui.t = (_clau, reserva) => reserva;
    rerender(<GuiaCanalsActualitzacio />);
    expect(avis().textContent).toBe(`${CA['descarregues.canals.signatura.titol']}${CA['descarregues.canals.signatura.text']}${CA['descarregues.canals.signatura.dadesLocals']}`);
  });
});
