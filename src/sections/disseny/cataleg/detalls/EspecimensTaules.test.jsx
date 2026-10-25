import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenGestor from './EspecimenGestor.jsx';
import EspecimenUniversalWorkspace from './EspecimenUniversalWorkspace.jsx';
import EspecimenInventariGlobal from './EspecimenInventariGlobal.jsx';

/* Gauntlet 261025_0545 (P1-16 · DF-04, C2-04 i G0200-R2-01) · Les taules de
   referència del catàleg viuen a la columna del detall, que és estreta fins i
   tot en una finestra de 1280px (385px). Una <table> nua hi vessava: «Mides»
   fa 432px, i l'overflow:hidden de .sdp-workspace-detail en tallava un tros
   que ningú podia abastar (WCAG 1.4.10); l'Inventari en vessava uns 738px.
   sdp.css només fa desplaçar una taula nua en una FINESTRA estreta (@media
   max-width 40rem), no en una COLUMNA estreta. Cada taula ha de viure dins
   d'una caixa que es desplaça a qualsevol amplada: una regió amb el nom de
   la seua llegenda i tabIndex=0 (s'hi arriba i es desplaça amb el teclat,
   WCAG 2.1.1), com el contracte de la fitxa (Especimen.jsx).
   jsdom no calcula el layout: es comprova el DOM i que la regla de la caixa
   no depén de cap @media. La mesura de veres (1280 i 375px) és al navegador. */

afterEach(cleanup);

const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** El full sense comentaris ni blocs @media: el que hi queda val a qualsevol amplada. */
function senseMedia(css) {
  let net = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (let inici = net.indexOf('@media'); inici !== -1; inici = net.indexOf('@media')) {
    const obri = net.indexOf('{', inici);
    if (obri === -1) break;
    let i = obri + 1;
    for (let fondaria = 1; fondaria > 0 && i < net.length; i += 1) {
      if (net[i] === '{') fondaria += 1;
      else if (net[i] === '}') fondaria -= 1;
    }
    net = net.slice(0, inici) + net.slice(i);
  }
  return net;
}

const CSS_DIR = resolve(process.cwd(), 'src/css');
const FULLS = readdirSync(CSS_DIR).filter((nom) => nom.endsWith('.css'))
  .map((nom) => senseMedia(readFileSync(resolve(CSS_DIR, nom), 'utf8'))).join('\n');

/** La classe fa de caixa de desplaçament a qualsevol amplada: overflow-x:auto fora
 *  de cap @media, i la taula de dins torna a ser taula (la caixa és l'única que es
 *  desplaça, també en mòbil, on sdp.css fa de cada taula nua un bloc desplaçable). */
function esCaixaDeDesplacament(classe, css = FULLS) {
  const c = `\\.${escapa(classe)}(?![\\w-])`;
  return new RegExp(`${c}\\s*\\{[^}]*overflow-x:\\s*auto`).test(css)
    && new RegExp(`${c}\\s*>?\\s*:where\\(table\\)\\s*\\{[^}]*display:\\s*table`).test(css);
}

const pinta = (Especimen) => render(<MemoryRouter><Especimen /></MemoryRouter>).container;

describe('el detector de la caixa', () => {
  it('una regla dins d’un @media no fa la caixa: depén de la finestra, no de la columna', () => {
    const css = '@media (max-width: 40rem) { .x { overflow-x: auto; } .x :where(table) { display: table; } } .y { color: red; }';
    expect(esCaixaDeDesplacament('x', senseMedia(css))).toBe(false);
    expect(esCaixaDeDesplacament('x', '.x { overflow-x: auto; } .x > :where(table) { display: table; }')).toBe(true);
    expect(esCaixaDeDesplacament('x', '.x-y { overflow-x: auto; } .x-y :where(table) { display: table; }')).toBe(false);
  });

  it('la caixa del contracte (Especimen.jsx) ho és, i la caixa de mostra no', () => {
    expect(esCaixaDeDesplacament('sdp-especimen__contracte')).toBe(true);
    expect(esCaixaDeDesplacament('sdp-especimen__viu')).toBe(false);
  });
});

describe.each([
  ['Gestor', EspecimenGestor, ['Plegat en escriptori', 'Mides', 'Amplades de columna', 'Colors i profunditat', 'Contracte']],
  ['UniversalWorkspace', EspecimenUniversalWorkspace, ['Variants d’ús i anatomia', 'Contracte']],
  ['InventariGlobal', EspecimenInventariGlobal, ['Registre del catàleg']],
])('%s · cap taula nua', (_, Especimen, llegendes) => {
  it('cada taula viu dins d’una regió amb el nom de la seua llegenda, focusable i que es desplaça a qualsevol amplada', () => {
    const arrel = pinta(Especimen);
    const taules = [...arrel.querySelectorAll('table')];
    expect(taules.map((t) => t.caption?.textContent ?? '')).toEqual(llegendes.map((l) => expect.stringContaining(l)));
    for (const taula of taules) {
      const llegenda = taula.caption.textContent;
      const caixa = taula.parentElement;
      expect([...caixa.classList].some((c) => esCaixaDeDesplacament(c)), `${llegenda}: dins de «${caixa.className}»`).toBe(true);
      expect(caixa.getAttribute('role'), llegenda).toBe('region');
      expect(caixa.tabIndex, llegenda).toBe(0);
      // El nom de la regió comença per la llegenda (el contracte hi afig el nom de la fitxa).
      const regio = within(arrel).getAllByRole('region', { name: (nom, el) => el === caixa && nom.startsWith(llegenda) });
      expect(regio, llegenda).toHaveLength(1);
    }
  });

  it('cada regió nomena la llegenda pel seu id, i els ids no es repetixen', () => {
    const arrel = pinta(Especimen);
    for (const taula of arrel.querySelectorAll('table')) {
      const id = taula.caption.id;
      expect(id, taula.caption.textContent).not.toBe('');
      expect(arrel.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
      expect(taula.parentElement.getAttribute('aria-labelledby').split(' ')[0]).toBe(id);
    }
  });
});
