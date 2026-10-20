/* Fase D (261020, tasca 2; pla 261020_1300) · «Més opcions» a la caputxa de
   la UniversalCard. Tres interruptors independents (la prop ambModeracio, el
   proveïdor de la moderació i la seua capacitat) i, damunt, que l'element es
   puga denunciar: sense tots, el DOM de sempre, byte a byte (Llei del Píxel).
   Amb tots, el ⋮ és l'últim de .sp-card-meta (darrere de la pastilla) i
   porta el títol al nom accessible; mai per al contingut propi, el del pilot
   ni una pàgina del sistema. Un valor de context de mentida (el contracte
   de moderacioDePoble.js), amb les regles de veres (config/moderacio.js). */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { ModeracioContext } from '../hooks/moderacioDePoble.js';
import { objecteDe, objecteDePagina } from '../../../config/navigation.js';
import { objectiuDeTargeta } from '../../../config/moderacio.js';
import { UniversalCard } from './UniversalCard.jsx';

afterEach(cleanup);

const PUBLICACIO = objecteDe({ id: 'p1', title: 'Fira de tardor', ownerUserId: 'pepa', author_name: 'Pepa' }, 'mur');
const DEL_PILOT = objecteDe({ id: 'p2', title: 'Avís', author_org_id: 'socdepoble', author_name: 'Sóc de Poble' }, 'mur');
const DE_SISTEMA = objecteDePagina({ titol: 'El Xat', ruta: '/page/xat', id: 'xat' });

function valor({ disponible = true, potBloquejar = true, esDeQuiMira = () => false } = {}) {
  return {
    disponible,
    potBloquejar,
    objectiuDeTargeta: (objecte) => objectiuDeTargeta(objecte, { esDeQuiMira }),
    demanaDenuncia: vi.fn(),
    demanaBloqueig: vi.fn()
  };
}

const targeta = (props = {}) => (
  <UniversalCard title="Fira de tardor" body="Castanyes i música." author="Pepa" location="La Torre de les Maçanes"
    time="11:00" date="25/10/26" dateTime="2026-10-25T11:00:00" mainHref="/mur/p1" objecte={PUBLICACIO}
    hasFooter={true} {...props} />
);
function pinta(props, context) {
  const fill = targeta(props);
  return render(
    <MemoryRouter rutaInicial="/mur">
      {context === undefined ? fill : <ModeracioContext.Provider value={context}>{fill}</ModeracioContext.Provider>}
    </MemoryRouter>
  );
}
const article = (container) => container.querySelector('article').outerHTML;

describe('sense els tres interruptors, el DOM de sempre', () => {
  test('sense proveïdor, amb proveïdor i sense la prop, amb la prop i sense proveïdor, i sense la capacitat', () => {
    const base = article(pinta().container);
    cleanup();
    expect(article(pinta({}, valor()).container)).toBe(base);
    cleanup();
    expect(article(pinta({ ambModeracio: true }).container)).toBe(base);
    cleanup();
    expect(article(pinta({ ambModeracio: true }, valor({ disponible: false })).container)).toBe(base);
    cleanup();
    expect(article(pinta({ ambModeracio: true }, null).container)).toBe(base);
  });

  test('cap ⋮ al contingut propi, al del pilot ni a una pàgina del sistema', () => {
    const base = article(pinta().container);
    cleanup();
    expect(article(pinta({ ambModeracio: true }, valor({ esDeQuiMira: (id) => id === 'pepa' })).container)).toBe(base);
    cleanup();
    const delPilot = article(pinta({ objecte: DEL_PILOT }).container);
    cleanup();
    expect(article(pinta({ objecte: DEL_PILOT, ambModeracio: true }, valor()).container)).toBe(delPilot);
    cleanup();
    const deSistema = article(pinta({ objecte: DE_SISTEMA }).container);
    cleanup();
    expect(article(pinta({ objecte: DE_SISTEMA, ambModeracio: true }, valor()).container)).toBe(deSistema);
  });
});

describe('amb els tres interruptors', () => {
  test('el ⋮ és l’últim de .sp-card-meta, darrere de la pastilla, amb el títol al nom', () => {
    const { container } = pinta({ ambModeracio: true }, valor());
    const meta = container.querySelector('.sp-card-header .sp-card-meta');
    const fills = [...meta.children];
    expect(fills.at(-2).classList.contains('btn-date-time')).toBe(true);
    expect(fills.at(-1).className).toBe('sdp-moderacio');
    const boto = screen.getByRole('button', { name: 'Més opcions: Fira de tardor' });
    expect(fills.at(-1).contains(boto)).toBe(true);
    expect(boto.getAttribute('aria-haspopup')).toBe('menu');
  });

  test('l’anatomia de l’article no canvia: caputxa, vel, cos i peu, en el mateix ordre', () => {
    const base = [...pinta().container.querySelector('article').children].map((fill) => fill.className);
    cleanup();
    const amb = [...pinta({ ambModeracio: true }, valor()).container.querySelector('article').children].map((fill) => fill.className);
    expect(amb).toEqual(base);
  });

  test('sense data, el ⋮ crea la .sp-card-meta i n’és l’únic fill', () => {
    const { container } = pinta({ ambModeracio: true, time: undefined, date: undefined, dateTime: undefined }, valor());
    const meta = container.querySelector('.sp-card-meta');
    expect([...meta.children].map((fill) => fill.className)).toEqual(['sdp-moderacio']);
  });

  test('«Denuncia el contingut» i «Bloqueja Pepa» porten l’objectiu i el ⋮ al proveïdor', () => {
    const context = valor();
    pinta({ ambModeracio: true }, context);
    const boto = screen.getByRole('button', { name: 'Més opcions: Fira de tardor' });
    act(() => { fireEvent.click(boto); });
    expect(screen.getAllByRole('menuitem').map((fila) => fila.textContent)).toEqual(['Denuncia el contingut', 'Bloqueja Pepa']);
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Denuncia el contingut' })); });
    expect(context.demanaDenuncia).toHaveBeenCalledWith(expect.objectContaining({
      tipus: 'publicacio', id: 'p1', autor: expect.objectContaining({ tipus: 'persona', id: 'pepa', nom: 'Pepa' }), bloquejable: true
    }), boto);
    act(() => { fireEvent.click(boto); });
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Bloqueja Pepa' })); });
    expect(context.demanaBloqueig).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }), boto);
  });

  test('qui no pot bloquejar (un visitant del remot) només denuncia', () => {
    pinta({ ambModeracio: true }, valor({ potBloquejar: false }));
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Més opcions: Fira de tardor' })); });
    expect(screen.getAllByRole('menuitem').map((fila) => fila.textContent)).toEqual(['Denuncia el contingut']);
  });
});
