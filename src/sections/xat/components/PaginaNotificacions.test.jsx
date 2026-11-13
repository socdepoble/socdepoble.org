/* B8C-6 (marató 261101_2143; B8-CLIENT §5.1) · La pàgina «Notificacions»
   (presentacional): l'interruptor reflectix `actiu`; amb `ocupat` està
   desactivat (el pany entre gestos, petició de B8C-1); les notes es mostren
   segons l'estat, amb un sol <p role="status">; la nota cega diu, caràcter a
   caràcter, el text que el worker posa a l'avís en cada llengua (paritat amb
   TEXTOS_AVIS de public/sw.js); i, acabat l'ocupat, el focus que havia caigut
   a <body> torna a l'interruptor. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import CA from '../../../config/idiomes/ca.js';
import ES from '../../../config/idiomes/es.js';
import EN from '../../../config/idiomes/en.js';
import EU from '../../../config/idiomes/eu.js';
import GL from '../../../config/idiomes/gl.js';
import PaginaNotificacions from './PaginaNotificacions.jsx';
import { TEXTOS_AVISOS, TEXTOS_AVISOS_ENTORN, notesDelsAvisos } from '../useAvisosPushXat.js';

const t = (_clau, reserva) => reserva;
const R = Object.fromEntries(Object.entries(TEXTOS_AVISOS).map(([nom, [, reserva]]) => [nom, reserva]));

/* Els avisos com els dona useControlAvisosPush. */
function avisosDe({ oferit = true, nomesNota = false, actiu = false, ocupat = false, estat = 'inactiu', tipus = 'web', onCanvi = vi.fn() } = {}, tr = t) {
  return { oferit, nomesNota, actiu, ocupat, estat, tipus, onCanvi, ...notesDelsAvisos({ oferit, nomesNota, estat, tipus }, tr) };
}
const interruptor = () => screen.getByRole('switch', { name: R.interruptor });

afterEach(cleanup);

describe('l\'interruptor', () => {
  test('reflectix actiu (aria-checked i Sí/No) i el gest crida onCanvi amb el contrari', () => {
    const inactiu = avisosDe();
    const vista = render(<PaginaNotificacions avisos={inactiu} t={t} />);
    expect(interruptor().getAttribute('aria-checked')).toBe('false');
    expect(interruptor().textContent).toBe('No');
    fireEvent.click(interruptor());
    expect(inactiu.onCanvi).toHaveBeenCalledWith(true);

    const actiu = avisosDe({ actiu: true, estat: 'actiu' });
    vista.rerender(<PaginaNotificacions avisos={actiu} t={t} />);
    expect(interruptor().getAttribute('aria-checked')).toBe('true');
    expect(interruptor().textContent).toBe('Sí');
    fireEvent.click(interruptor());
    expect(actiu.onCanvi).toHaveBeenCalledWith(false);
  });

  test('amb ocupat està desactivat i un clic no fa res (cap segon gest mentre en vola un)', () => {
    const avisos = avisosDe({ ocupat: true });
    render(<PaginaNotificacions avisos={avisos} t={t} />);
    expect(interruptor().disabled).toBe(true);
    fireEvent.click(interruptor());
    expect(avisos.onCanvi).not.toHaveBeenCalled();
  });

  test('l\'etiqueta i el Sí/No passen pel traductor (section.comu.si / .no)', () => {
    const claus = [];
    const tr = (clau, reserva) => { claus.push(clau); return reserva; };
    render(<PaginaNotificacions avisos={avisosDe({}, tr)} t={tr} />);
    expect(claus).toEqual(expect.arrayContaining(['section.xat.ajustos.avisos.interruptor', 'section.comu.si', 'section.comu.no']));
  });
});

describe('les notes', () => {
  test.each([
    ['inactiu', null, false],
    ['actiu', null, false],
    ['denegat', R.denegat, false],
    ['sense-servidor', R.noDisponible, false],
    ['sense-worker', R.senseWorker, true],
    ['error', R.error, true]
  ])('estat %s: la nota d\'estat (role="status") i, sempre, la cega i la de l\'eixida', (estat, text, error) => {
    const { container } = render(<PaginaNotificacions avisos={avisosDe({ estat })} t={t} />);
    const estats = container.querySelectorAll('[role="status"]');
    /* Sempre UNA regió d'estat (CORRECTOR ARB-P05-04): amb nota, visible; sense, buida i fora del flux. */
    expect(estats).toHaveLength(1);
    if (text) {
      expect(estats[0].textContent).toBe(text);
      expect(estats[0].classList.contains('sdp-xat-ajustos__nota')).toBe(true);
      expect(estats[0].classList.contains('sdp-xat-ajustos__nota--error')).toBe(error);
      expect(estats[0].classList.contains('sdp-sr-only')).toBe(false);
    } else {
      expect(estats[0].textContent).toBe('');
      expect(estats[0].className).toBe('sdp-sr-only');
    }
    const notes = [...container.querySelectorAll('.sdp-xat-ajustos__nota')].map((n) => n.textContent);
    expect(notes).toEqual([...(text ? [text] : []), R.cec, R.eixida]);
    /* Cap nota de les fixes no és una regió viva. */
    expect(container.querySelectorAll('.sdp-xat-ajustos__nota:not([role])')).toHaveLength(2);
  });

  test('la regió viva ja hi és abans de la nota: el text arriba al MATEIX node i, en anar-se\'n, el node queda buit (CORRECTOR ARB-P05-04)', () => {
    const vista = render(<PaginaNotificacions avisos={avisosDe()} t={t} />);
    const regio = screen.getByRole('status');
    expect(regio.textContent).toBe('');
    vista.rerender(<PaginaNotificacions avisos={avisosDe({ estat: 'denegat' })} t={t} />);
    expect(screen.getByRole('status')).toBe(regio);
    expect(regio.textContent).toBe(R.denegat);
    expect(regio.className).toBe('sdp-xat-ajustos__nota');
    vista.rerender(<PaginaNotificacions avisos={avisosDe({ estat: 'error' })} t={t} />);
    expect(screen.getByRole('status')).toBe(regio);
    expect(regio.className).toBe('sdp-xat-ajustos__nota sdp-xat-ajustos__nota--error');
    vista.rerender(<PaginaNotificacions avisos={avisosDe({ estat: 'actiu', actiu: true })} t={t} />);
    expect(screen.getByRole('status')).toBe(regio);
    expect(regio.textContent).toBe('');
    expect(regio.className).toBe('sdp-sr-only');
  });

  test('a l\'app, el permís denegat parla del dispositiu', () => {
    render(<PaginaNotificacions avisos={avisosDe({ estat: 'denegat', tipus: 'natiu' })} t={t} />);
    expect(screen.getByRole('status').textContent).toBe(R.denegatApp);
  });

  test('només la nota d\'instal·lar (iPhone sense l\'app a la pantalla d\'inici): cap interruptor', () => {
    const { container } = render(<PaginaNotificacions avisos={avisosDe({ oferit: false, nomesNota: true })} t={t} />);
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect([...container.querySelectorAll('.sdp-xat-ajustos__nota')].map((n) => n.textContent)).toEqual([R.ios]);
  });

  test('sense res a oferir no pinta res (FullAjustos hi deixa la pàgina «en construcció»)', () => {
    const { container } = render(<PaginaNotificacions avisos={avisosDe({ oferit: false })} t={t} />);
    expect(container.innerHTML).toBe('');
    cleanup();
    expect(render(<PaginaNotificacions avisos={null} t={t} />).container.innerHTML).toBe('');
  });

  /* El t de la pàgina en cada llengua: el diccionari (com createTranslator) i, si no hi és, la reserva. */
  test.each(['ca', 'es', 'en', 'eu', 'gl'])('R21.4-UI (R21.2-F04) · en %s, amb motiu sense-clau / sense-config / sense-connector pinta avís honest amb role="status" i cap interruptor', (llengua) => {
    const dic = { ca: CA, es: ES, en: EN, eu: EU, gl: GL }[llengua];
    const tr = (clau, reserva) => dic[clau] || CA[clau] || reserva;
    for (const motiu of ['sense-clau', 'sense-config', 'sense-connector']) {
      const esperat = dic[TEXTOS_AVISOS_ENTORN[motiu][0]];
      /* Les notes del hook, i també la reserva de la pàgina quan l'avís arriba sense nota. */
      for (const avisos of [
        { oferit: false, nomesNota: false, avisEntorn: true, motiu, ...notesDelsAvisos({ oferit: false, avisEntorn: true, motiu }, tr) },
        { oferit: false, nomesNota: false, avisEntorn: true, motiu, nota: null, notes: [] }
      ]) {
        const { container } = render(<PaginaNotificacions avisos={avisos} t={tr} />);
        expect(screen.queryByRole('switch')).toBeNull();
        const regio = screen.getByRole('status');
        expect(regio.textContent).toBe(esperat);
        expect(container.querySelectorAll('.sdp-xat-ajustos__nota')).toHaveLength(1);
        cleanup();
      }
    }
  });

  test('el marcatge de targeta dels altres grups (ul + li) i les classes que ja existixen', () => {
    const { container } = render(<PaginaNotificacions avisos={avisosDe()} t={t} />);
    const grup = container.firstElementChild;
    expect(grup.className).toBe('sdp-xat-ajustos__grup');
    expect(grup.querySelector(':scope > ul.sdp-xat-ajustos__targeta > li > .sdp-interruptor.sdp-xat-ajustos__interruptor')).not.toBeNull();
  });
});

describe('la nota cega és el text del worker', () => {
  const sw = readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');
  const textosDelWorker = Object.fromEntries(
    [...sw.matchAll(/^\s*(ca|es|en|eu|gl): Object\.freeze\(\{ titol: '[^']*', cos: '([^']*)' \}\)/gm)].map(([, llengua, cos]) => [llengua, cos])
  );
  const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };

  test('el worker té els cinc textos', () => {
    expect(Object.keys(textosDelWorker).sort()).toEqual(['ca', 'en', 'es', 'eu', 'gl']);
  });

  test.each(Object.keys(DICCIONARIS))('%s: la nota cita literalment el cos de l\'avís, entre cometes', (llengua) => {
    const dic = DICCIONARIS[llengua];
    const tr = (clau, reserva) => dic[clau] || CA[clau] || reserva;
    render(<PaginaNotificacions avisos={avisosDe({}, tr)} t={tr} />);
    const cos = textosDelWorker[llengua];
    const nota = screen.getByText((text) => text === dic['section.xat.ajustos.avisos.cec']);
    expect(nota.textContent.includes(`«${cos}»`) || nota.textContent.includes(`“${cos}”`), `${llengua}: ${nota.textContent}`).toBe(true);
  });

  test('la reserva valenciana és el valor de ca.js, caràcter a caràcter (Llei del Píxel)', () => {
    for (const [clau, reserva] of Object.values(TEXTOS_AVISOS)) expect(CA[clau], clau).toBe(reserva);
  });
});

describe('el focus en acabar l\'ocupat', () => {
  test('si havia caigut a <body>, torna a l\'interruptor', () => {
    const vista = render(<PaginaNotificacions avisos={avisosDe({ ocupat: true })} t={t} />);
    document.body.focus();
    expect(document.activeElement).toBe(document.body);
    act(() => { vista.rerender(<PaginaNotificacions avisos={avisosDe({ ocupat: false, actiu: true, estat: 'actiu' })} t={t} />); });
    expect(document.activeElement).toBe(interruptor());
  });

  test('si la persona ja és en un altre lloc, no se la mou', () => {
    const vista = render(
      <>
        <button type="button">fora</button>
        <PaginaNotificacions avisos={avisosDe({ ocupat: true })} t={t} />
      </>
    );
    const altre = screen.getByRole('button', { name: 'fora' });
    altre.focus();
    act(() => {
      vista.rerender(
        <>
          <button type="button">fora</button>
          <PaginaNotificacions avisos={avisosDe({ ocupat: false })} t={t} />
        </>
      );
    });
    expect(document.activeElement).toBe(altre);
  });
});
