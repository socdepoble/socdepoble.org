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

  /* Onada v1.2.16 (ordres del Mestre 261121 01:32 i 01:55: ZERO APK fora de botiga) · Fins a la v1.2.15, la
     guia deia que a Android hi havia «dos canals vàlids» i oferia el fitxer APK directe com a canal 2. Ara
     cap llengua no l'oferix: el bloc 2 diu que no hi ha cap APK fora de botiga, l'avís parla només de passar
     d'un APK de proves antic a Google Play (mai «o al revés»), i la reserva valenciana és la de ca.js. Els
     tres blocs i el botó es queden al seu lloc. */
  test('v1.2.16 · ZERO APK: cap llengua no oferix l’APK com a canal, i el bloc 2 diu que no n’hi ha cap', () => {
    const CANAL_APK = {
      ca: /dos canals vàlids|instal·lació manual independent|o al revés|canal triat/i,
      es: /dos canales válidos|instalación manual independiente|o al revés|canal elegido/i,
      en: /two valid channels|independent manual install|or vice versa|chosen channel/i,
      eu: /bi kanal baliozko|eskuzko instalazio independentea|edo alderantziz|aukeratutako kanaletik/i,
      gl: /dous canais válidos|instalación manual independente|ou ao revés|canal escollido/i
    };
    const CAP_APK = { ca: /Cap APK fora de botiga/, es: /Ningún APK fuera de la tienda/, en: /No APK outside the store/, eu: /Dendatik kanpoko APKrik ez/, gl: /Ningún APK fóra da tenda/ };
    for (const [lang, dic] of [['ca', CA], ['es', ES], ['en', EN], ['eu', EU], ['gl', GL]]) {
      ui.t = (clau, reserva) => dic[clau] ?? reserva;
      const { container, unmount } = render(<GuiaCanalsActualitzacio />);
      const blocs = [...container.querySelectorAll('.sdp-guia-canals__bloc')];
      expect([lang, blocs.length, container.querySelectorAll('h4').length, container.querySelectorAll('button').length]).toEqual([lang, 3, 3, 1]);
      expect([lang, blocs[1].querySelector('h4').textContent]).toEqual([lang, dic['descarregues.canals.apk.titol']]);
      expect([lang, CAP_APK[lang].test(blocs[1].textContent)]).toEqual([lang, true]);
      expect([lang, CANAL_APK[lang].test(container.textContent)]).toEqual([lang, false]);
      // Cap enllaç ni baixada: la guia només explica.
      expect([lang, container.querySelectorAll('a, [download]').length]).toEqual([lang, 0]);
      unmount();
    }
    // La reserva de cada crida és el valor valencià de ca.js.
    ui.t = (_clau, reserva) => reserva;
    const { container } = render(<GuiaCanalsActualitzacio />);
    for (const clau of ['descarregues.canals.intro', 'descarregues.canals.apk.titol', 'descarregues.canals.apk.text']) {
      expect([clau, container.textContent.includes(CA[clau])]).toEqual([clau, true]);
    }
  });
});
