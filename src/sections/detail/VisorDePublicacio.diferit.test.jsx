/**
 * Revisió del Gauntlet 261017 (R3, pes) · El visor d'una publicació del Mur
 * ja no viatja amb la portada. detailSectionMeta.jsx (i, per ell,
 * elementDeSeccio, TextSection, /xat, Notes i cada pàgina de text) només porta
 * el disparador (VisorDePublicacio.jsx); la meitat del visor (VisorDeLArxiu,
 * useMetadadesFoto amb la lectura Range de l'EXIF, exif.js, VisorImatges i el
 * cens d'useCensImatges) arriba per import() diferit:
 *   · cap mòdul del visor abans de cap gest: ni en pintar la portada;
 *   · el punter que hi entra o el focus que hi arriba el precarreguen;
 *   · el clic l'obri quan arriba (Suspense sense res a la vista);
 *   · sense xarxa (el tros no es pot descarregar), el visor no s'obri, la
 *     pàgina continua i el focus es queda al disparador: cap error de ruta.
 * Els mòduls del visor són dobles que compten quan s'avaluen: el de veres ja
 * el proven VisorDePublicacio.test.jsx i MultimediaSection.visor.test.jsx.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const registre = { visor: 0, cens: 0 };
/* Cada prova, mòduls nous (resetModules) i dobles nous (doMock): el compte
   diu quantes vegades s'ha avaluat cada mòdul del visor en eixa prova. Sense
   xarxa, el doble del visor fa com el navegador: l'import() es rebutja. */
function dobles({ senseXarxa = false } = {}) {
  vi.doMock('../multimedia/VisorDeLArxiu.jsx', () => {
    if (senseXarxa) throw new TypeError('Failed to fetch dynamically imported module');
    registre.visor += 1;
    return {
      VisorDeLArxiu: ({ index, llista, cens }) => (index >= 0
        ? <div role="dialog" aria-label="Visor de prova" data-index={index} data-src={llista[index]?.src} data-cens={cens ? 'si' : 'no'} />
        : null)
    };
  });
  vi.doMock('../multimedia/useCensImatges.js', () => {
    registre.cens += 1;
    return { useCensImatges: () => ({ cens: new Map() }) };
  });
}

const OBRI = 'Veure la imatge a pantalla completa';
const FOTOS = ['/assets/mercat/mac-mini-m4.webp'];
const DADES = { titol: 'Mac Mini M4', autor: 'Javi Llinares' };
const espera = () => act(async () => { for (let i = 0; i < 6; i += 1) await Promise.resolve(); });

async function modul(opcions) {
  vi.resetModules();
  registre.visor = 0;
  registre.cens = 0;
  dobles(opcions);
  return import('./VisorDePublicacio.jsx');
}

beforeEach(() => { vi.restoreAllMocks(); });
afterEach(() => {
  cleanup();
  vi.doUnmock('../multimedia/VisorDeLArxiu.jsx');
  vi.doUnmock('../multimedia/useCensImatges.js');
});

describe('el visor, en diferit: res fins al primer gest', () => {
  test('pintar la portada no avalua cap mòdul del visor; el disparador és el de sempre', async () => {
    const { VisorDePublicacio } = await modul();
    render(<VisorDePublicacio fotos={FOTOS} dades={DADES} etiquetaObri={OBRI} alt="Mac Mini M4" />);
    await espera();
    expect([registre.visor, registre.cens]).toEqual([0, 0]);
    const boto = screen.getByRole('button', { name: OBRI });
    expect(boto.className).toBe('sdp-visor__obridor');
    expect([...boto.attributes].map((a) => a.name).sort()).toEqual(['aria-haspopup', 'aria-label', 'class', 'type']);
    expect([...boto.children].map((fill) => fill.tagName)).toEqual(['IMG']);
    expect([...boto.querySelector('img').attributes].map((a) => a.name).sort()).toEqual(['alt', 'src']);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('el punter que entra al disparador el precarrega; el clic l’obri a la foto, amb el cens', async () => {
    const { VisorDePublicacio } = await modul();
    render(<VisorDePublicacio fotos={FOTOS} dades={DADES} etiquetaObri={OBRI} alt="Mac Mini M4" />);
    const boto = screen.getByRole('button', { name: OBRI });
    fireEvent.pointerEnter(boto);
    await espera();
    expect([registre.visor, registre.cens]).toEqual([1, 1]);
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => { fireEvent.click(boto); });
    const visor = await screen.findByRole('dialog', { name: 'Visor de prova' });
    expect(visor.dataset).toMatchObject({ index: '0', src: FOTOS[0], cens: 'si' });
    expect(document.activeElement).toBe(boto);
    // El visor no queda dins del disparador.
    expect(boto.contains(visor)).toBe(false);
    expect([registre.visor, registre.cens]).toEqual([1, 1]);
  });

  test('el focus que arriba al disparador (Tab) també el precarrega', async () => {
    const { VisorDePublicacio } = await modul();
    render(<VisorDePublicacio fotos={FOTOS} dades={DADES} etiquetaObri={OBRI} alt="Mac Mini M4" />);
    act(() => screen.getByRole('button', { name: OBRI }).focus());
    await espera();
    expect([registre.visor, registre.cens]).toEqual([1, 1]);
  });

  test('el carrusel (children(obri)): sense precàrrega, el clic l’obri a la foto clicada', async () => {
    const { VisorDePublicacio } = await modul();
    render(
      <VisorDePublicacio fotos={['/a.jpg', '/b.jpg']} dades={DADES}>
        {(obri) => (
          <section>
            <button type="button" onClick={(e) => obri(0, e.currentTarget)}>A</button>
            <button type="button" onClick={(e) => obri(1, e.currentTarget)}>B</button>
          </section>
        )}
      </VisorDePublicacio>
    );
    await espera();
    expect(registre.visor).toBe(0);
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'B' })); });
    const visor = await screen.findByRole('dialog', { name: 'Visor de prova' });
    expect(visor.dataset).toMatchObject({ index: '1', src: '/b.jpg' });
  });
});

describe('sense xarxa: el tros del visor no arriba', () => {
  test('el visor no s’obri, la pàgina continua i el focus es queda al disparador; un segon clic, igual', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    /* React 18 també avisa la finestra de l'error que recull la barrera: jsdom
       l'escriuria a la consola de la prova. */
    const calla = (event) => event.preventDefault();
    window.addEventListener('error', calla);
    const { VisorDePublicacio } = await modul({ senseXarxa: true });
    render(
      <main>
        <h1>Mac Mini M4</h1>
        <VisorDePublicacio fotos={FOTOS} dades={DADES} etiquetaObri={OBRI} alt="Mac Mini M4" />
      </main>
    );
    const boto = screen.getByRole('button', { name: OBRI });
    act(() => boto.focus());
    act(() => { fireEvent.click(boto); });
    await espera();
    await espera();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Mac Mini M4' })).toBeTruthy();
    expect(within(screen.getByRole('main')).getByRole('button', { name: OBRI })).toBe(boto);
    expect(document.activeElement).toBe(boto);
    act(() => { fireEvent.click(boto); });
    await espera();
    await espera();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(boto);
    window.removeEventListener('error', calla);
  });

  test('una precàrrega sense xarxa no condemna el clic: si el tros arriba després, el visor s’obri', async () => {
    const { VisorDePublicacio } = await modul();
    let intents = 0;
    vi.doMock('../multimedia/useCensImatges.js', () => {
      intents += 1;
      throw new TypeError('Failed to fetch dynamically imported module');
    });
    render(<VisorDePublicacio fotos={FOTOS} dades={DADES} etiquetaObri={OBRI} alt="Mac Mini M4" />);
    const boto = screen.getByRole('button', { name: OBRI });
    fireEvent.pointerEnter(boto);
    await vi.waitFor(() => expect(intents).toBe(1));
    await espera();
    vi.doMock('../multimedia/useCensImatges.js', () => ({ useCensImatges: () => ({ cens: null }) }));
    act(() => { fireEvent.click(boto); });
    expect(await screen.findByRole('dialog', { name: 'Visor de prova' })).toBeTruthy();
  });

  /* Revisió del Gauntlet 261017 (R3, reintent) · Abans el component diferit
     era un sol React.lazy per a tot el document, i React en guarda la promesa
     rebutjada per sempre: després d'un clic sense xarxa, cap altre clic no
     tornava a demanar el tros, encara que la xarxa ja hi fora. Ara una fallada
     oblida la promesa i el component, i el gest següent els fa de nou. */
  test('un clic sense xarxa no condemna el següent: quan el tros arriba, el segon clic l’obri', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const calla = (event) => event.preventDefault();
    window.addEventListener('error', calla);
    try {
      const { VisorDePublicacio } = await modul();
      let intents = 0;
      vi.doMock('../multimedia/useCensImatges.js', () => {
        intents += 1;
        throw new TypeError('Failed to fetch dynamically imported module');
      });
      render(
        <main>
          <h1>Mac Mini M4</h1>
          <VisorDePublicacio fotos={FOTOS} dades={DADES} etiquetaObri={OBRI} alt="Mac Mini M4" />
        </main>
      );
      const boto = screen.getByRole('button', { name: OBRI });
      act(() => { fireEvent.click(boto); });
      await vi.waitFor(() => expect(intents).toBe(1));
      await espera();
      await espera();
      // La primera fallada es tanca com sempre: cap visor, el focus al disparador.
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(boto);
      // Torna la xarxa: el segon clic torna a demanar el tros i l'obri.
      vi.doMock('../multimedia/useCensImatges.js', () => ({ useCensImatges: () => ({ cens: null }) }));
      act(() => { fireEvent.click(boto); });
      const visor = await screen.findByRole('dialog', { name: 'Visor de prova' });
      expect(visor.dataset).toMatchObject({ index: '0', src: FOTOS[0] });
      expect(intents).toBe(1);
      expect(registre.visor).toBe(1);
    } finally {
      window.removeEventListener('error', calla);
    }
  });
});
