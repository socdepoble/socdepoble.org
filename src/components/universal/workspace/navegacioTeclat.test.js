/* IDEA-58 (ordre del Mestre, 29-10-2026 23:22 CET) · Les peces de
   navegacioTeclat.js: el destí d'una tecla en una llista i en una graella,
   les columnes per geometria, les guardes comunes, la disponibilitat i el
   manejador de les graelles 2D sobre un DOM de veres (jsdom, amb les caixes
   simulades). Les proves de les columnes de l'espai de treball són a
   UniversalWorkspace.teclat.test.jsx; les de les graelles de /multimedia, a
   src/sections/multimedia/graelles.teclat.test.jsx. */
import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  botonsDelRail, columnesPerGeometria, destiDeGraella, destiDeLlista, disponible, entradaDelDetall, esCampEditable,
  fitxaActivaDeLlista, fitxaPrincipal, gestionaEscapeDelDetall, gestionaTeclaGraella, gestionaTeclaRail, ignoraTecla
} from './navegacioTeclat.js';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

/* El DOM de cada prova, llegit en un document inert (DOMParser) i posat al
   <body>: cap innerHTML (tractor-innerhtml, Gauntlet 261030). */
const pinta = (html) => document.body.replaceChildren(...new DOMParser().parseFromString(html, 'text/html').body.childNodes);

describe('destiDeLlista', () => {
  test('↓ el següent, ↑ l’anterior, Inici el primer, Fi l’últim', () => {
    expect(destiDeLlista('ArrowDown', 1, 4)).toBe(2);
    expect(destiDeLlista('ArrowUp', 2, 4)).toBe(1);
    expect(destiDeLlista('Home', 3, 4)).toBe(0);
    expect(destiDeLlista('End', 0, 4)).toBe(3);
  });

  test('als extrems torna el mateix índex (cap moviment)', () => {
    expect(destiDeLlista('ArrowUp', 0, 4)).toBe(0);
    expect(destiDeLlista('ArrowDown', 3, 4)).toBe(3);
    expect(destiDeLlista('Home', 0, 4)).toBe(0);
    expect(destiDeLlista('End', 3, 4)).toBe(3);
  });

  test('una tecla que no és de la llista, o una llista buida: null', () => {
    expect(destiDeLlista('ArrowLeft', 1, 4)).toBeNull();
    expect(destiDeLlista('Enter', 1, 4)).toBeNull();
    expect(destiDeLlista('ArrowDown', 0, 0)).toBeNull();
  });
});

describe('columnesPerGeometria', () => {
  const graella = (columnes, total, mida = 90) => Array.from({ length: total }, (_, i) => ({
    top: Math.floor(i / columnes) * (mida + 10), left: (i % columnes) * (mida + 10), width: mida, height: mida
  }));

  test('3 columnes: les cel·les inicials amb el mateix top', () => {
    expect(columnesPerGeometria(graella(3, 8))).toBe(3);
    expect(columnesPerGeometria(graella(5, 5))).toBe(5);
  });

  test('una sola columna (cada cel·la en una fila)', () => {
    expect(columnesPerGeometria(graella(1, 4))).toBe(1);
  });

  test('totes les caixes 0×0 (sense maquetació): 1 columna; cap caixa: 1', () => {
    expect(columnesPerGeometria(Array.from({ length: 6 }, () => ({ top: 0, left: 0, width: 0, height: 0 })))).toBe(1);
    expect(columnesPerGeometria([])).toBe(1);
  });

  test('tolerància de 2 px: un top de 2 px més és la mateixa fila; de 3, la següent', () => {
    const caixa = (top) => ({ top, left: 0, width: 50, height: 50 });
    expect(columnesPerGeometria([caixa(10), caixa(11.5), caixa(12), caixa(13)])).toBe(3);
  });
});

describe('destiDeGraella', () => {
  /* 3 columnes, 8 cel·les: 0 1 2 / 3 4 5 / 6 7 */
  test('→ +1, ← −1, ↓ +columnes, ↑ −columnes, Inici, Fi', () => {
    expect(destiDeGraella('ArrowRight', 4, 8, 3)).toBe(5);
    expect(destiDeGraella('ArrowLeft', 4, 8, 3)).toBe(3);
    expect(destiDeGraella('ArrowDown', 1, 8, 3)).toBe(4);
    expect(destiDeGraella('ArrowUp', 7, 8, 3)).toBe(4);
    expect(destiDeGraella('Home', 5, 8, 3)).toBe(0);
    expect(destiDeGraella('End', 0, 8, 3)).toBe(7);
  });

  test('→ i ← continuen a la fila següent i a l’anterior (ordre de lectura)', () => {
    expect(destiDeGraella('ArrowRight', 2, 8, 3)).toBe(3);
    expect(destiDeGraella('ArrowLeft', 3, 8, 3)).toBe(2);
  });

  test('a les vores, el mateix índex: → a l’última, ← a la primera, ↑ a la primera fila, ↓ sense cel·la davall', () => {
    expect(destiDeGraella('ArrowRight', 7, 8, 3)).toBe(7);
    expect(destiDeGraella('ArrowLeft', 0, 8, 3)).toBe(0);
    expect(destiDeGraella('ArrowUp', 2, 8, 3)).toBe(2);
    expect(destiDeGraella('ArrowDown', 5, 8, 3)).toBe(5);
    expect(destiDeGraella('ArrowDown', 6, 8, 3)).toBe(6);
  });

  test('una tecla aliena o una graella buida: null; columnes no vàlides compten com 1', () => {
    expect(destiDeGraella('Enter', 1, 8, 3)).toBeNull();
    expect(destiDeGraella('ArrowDown', 0, 0, 3)).toBeNull();
    expect(destiDeGraella('ArrowDown', 1, 8, 0)).toBe(2);
  });
});

describe('guardes comunes (ignoraTecla, esCampEditable)', () => {
  const boto = () => {
    const element = document.createElement('button');
    document.body.append(element);
    return element;
  };
  const tecla = (target, extres = {}) => ({ key: 'ArrowDown', target, defaultPrevented: false, ...extres });

  test('un botó, sense modificadors: no s’ignora', () => {
    expect(ignoraTecla(tecla(boto()))).toBe(false);
  });

  test.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])('amb %s s’ignora', (modificador) => {
    expect(ignoraTecla(tecla(boto(), { [modificador]: true }))).toBe(true);
  });

  test('ja atesa (defaultPrevented) o en composició (isComposing, també el de l’esdeveniment natiu, o keyCode 229) s’ignora', () => {
    expect(ignoraTecla(tecla(boto(), { defaultPrevented: true }))).toBe(true);
    expect(ignoraTecla(tecla(boto(), { isComposing: true }))).toBe(true);
    expect(ignoraTecla(tecla(boto(), { nativeEvent: { isComposing: true } }))).toBe(true);
    expect(ignoraTecla(tecla(boto(), { keyCode: 229 }))).toBe(true);
  });

  test('els camps editables: input, textarea, select, contenteditable i els rols de camp', () => {
    pinta(`
      <input id="i"><textarea id="t"></textarea><select id="s"></select>
      <div contenteditable="true"><span id="dins">x</span></div>
      <div contenteditable="true"><button id="no" contenteditable="false">b</button></div>
      <div id="tb" role="textbox"></div><div id="cb" role="combobox"></div><div id="sl" role="slider"></div>
      <div id="sp" role="spinbutton"></div><div id="sb" role="searchbox"></div><div id="bt" role="button"></div>`);
    const per = (id) => document.getElementById(id);
    for (const id of ['i', 't', 's', 'dins', 'tb', 'cb', 'sl', 'sp', 'sb']) {
      expect(esCampEditable(per(id)), id).toBe(true);
      expect(ignoraTecla(tecla(per(id))), id).toBe(true);
    }
    expect(esCampEditable(per('no'))).toBe(false);
    expect(esCampEditable(per('bt'))).toBe(false);
    expect(esCampEditable(null)).toBe(false);
  });
});

describe('disponible', () => {
  test('dins de [hidden], [inert], [aria-hidden="true"] o d’un <dialog> tancat, desactivat o desconnectat: no', () => {
    pinta(`
      <button id="ok">ok</button>
      <div hidden><button id="h">h</button></div>
      <div inert><button id="in">in</button></div>
      <div aria-hidden="true"><button id="ah">ah</button></div>
      <dialog><button id="dg">dg</button></dialog>
      <button id="ds" disabled>ds</button>`);
    const per = (id) => document.getElementById(id);
    expect(disponible(per('ok'))).toBe(true);
    for (const id of ['h', 'in', 'ah', 'dg', 'ds']) expect(disponible(per(id)), id).toBe(false);
    expect(disponible(document.createElement('button'))).toBe(false);
    expect(disponible(null)).toBe(false);
  });
});

describe('les fitxes de la llista', () => {
  test('fitxaPrincipal: el control de la fitxa (.sdp-gestor-fitxa o .sp-card-link-overlay), encara que n’hi haja un abans; si no, el primer enfocable', () => {
    pinta(`
      <ul class="sdp-gestor-llista">
        <li id="a"><button class="sdp-gestor-fitxa">A</button><button>Secundari</button></li>
        <li id="b"><article><header><button>Data</button></header><button class="sp-card-link-overlay" aria-current="true">B</button></article></li>
        <li id="c"><a href="/c">C</a><button>Més</button></li>
        <li id="d"><span>res</span></li>
      </ul>`);
    const per = (id) => document.getElementById(id);
    expect(fitxaPrincipal(per('a')).textContent).toBe('A');
    expect(fitxaPrincipal(per('b')).textContent).toBe('B');
    expect(fitxaPrincipal(per('c')).textContent).toBe('C');
    expect(fitxaPrincipal(per('d'))).toBeNull();
    const llista = document.querySelector('.sdp-gestor-llista');
    expect(fitxaActivaDeLlista(llista).textContent).toBe('B');
  });

  test('fitxaActivaDeLlista: sense activa, null (o la primera amb `primera`); amb la llista plegada, el rail de documents', () => {
    pinta(`
      <aside id="col"><ul class="sdp-gestor-llista"><li><button class="sdp-gestor-fitxa">A</button></li><li><button class="sdp-gestor-fitxa">B</button></li></ul></aside>
      <aside id="rail"><nav class="sdp-workspace-rail sdp-workspace-rail--documents"><ul><li><button>A</button></li><li><button aria-current="true">B</button></li></ul></nav></aside>`);
    expect(fitxaActivaDeLlista(document.getElementById('col'))).toBeNull();
    expect(fitxaActivaDeLlista(document.getElementById('col'), { primera: true }).textContent).toBe('A');
    expect(fitxaActivaDeLlista(document.getElementById('rail')).textContent).toBe('B');
    expect(fitxaActivaDeLlista(null)).toBeNull();
  });
});

describe('entradaDelDetall', () => {
  test('amb una graella de teclat, la cel·la activa (aria-pressed) o la primera; sense, el primer enfocable; sense cap, l’arrel', () => {
    pinta(`
      <div id="g" tabindex="-1"><button>Barra</button><ul data-graella-teclat=""><li><button>1</button></li><li><button aria-pressed="true">2</button></li></ul></div>
      <div id="p" tabindex="-1"><ul data-graella-teclat=""><li><button aria-pressed="false">1</button></li><li><button>2</button></li></ul></div>
      <div id="f" tabindex="-1"><header class="page-title"><h1 tabindex="-1">Títol</h1></header><a href="/x">Enllaç</a></div>
      <div id="b" tabindex="-1"><p>Selecciona un element.</p></div>
      <div hidden><div id="h" tabindex="-1"><button>amagat</button></div></div>`);
    const per = (id) => document.getElementById(id);
    expect(entradaDelDetall(per('g')).textContent).toBe('2');
    expect(entradaDelDetall(per('p')).textContent).toBe('1');
    expect(entradaDelDetall(per('f')).textContent).toBe('Enllaç');
    expect(entradaDelDetall(per('b'))).toBe(per('b'));
    expect(entradaDelDetall(per('h'))).toBeNull();
  });
});

describe('gestionaTeclaGraella (DOM de veres, caixes simulades)', () => {
  /* 8 cel·les en 3 columnes: 0 1 2 / 3 4 5 / 6 7 */
  function graella({ columnes = 3, total = 8, dinsDeLEspai = false } = {}) {
    const espai = dinsDeLEspai
      ? '<div class="sdp-workspace"><ul class="sdp-gestor-llista"><li><button class="sdp-gestor-fitxa" aria-current="true">Fitxa</button></li></ul><div id="det"></div></div>'
      : '<div id="det"></div>';
    pinta(espai);
    const contenidor = document.createElement('div');
    contenidor.setAttribute('data-graella-teclat', '');
    for (let i = 0; i < total; i += 1) {
      const boto = document.createElement('button');
      boto.textContent = String(i);
      contenidor.append(boto);
    }
    document.getElementById('det').append(contenidor);
    contenidor.addEventListener('keydown', gestionaTeclaGraella);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function caixa() {
      const i = this.parentElement === contenidor ? [...contenidor.children].indexOf(this) : -1;
      if (i < 0 || columnes === 0) return { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 };
      const top = Math.floor(i / columnes) * 100;
      const left = (i % columnes) * 100;
      return { top, left, width: 90, height: 90, right: left + 90, bottom: top + 90 };
    });
    const cella = (i) => contenidor.children[i];
    return { contenidor, cella };
  }
  /* fireEvent torna false si el manejador ha cridat preventDefault. */
  const prem = (element, key, extres = {}) => {
    element.focus();
    return !fireEvent.keyDown(element, { key, ...extres });
  };
  const actiu = () => document.activeElement.textContent;

  test('→ ← ↓ ↑ Inici Fi, amb preventDefault quan mou', () => {
    const { cella } = graella();
    expect(prem(cella(4), 'ArrowRight')).toBe(true);
    expect(actiu()).toBe('5');
    expect(prem(cella(4), 'ArrowLeft')).toBe(true);
    expect(actiu()).toBe('3');
    expect(prem(cella(1), 'ArrowDown')).toBe(true);
    expect(actiu()).toBe('4');
    expect(prem(cella(7), 'ArrowUp')).toBe(true);
    expect(actiu()).toBe('4');
    expect(prem(cella(5), 'Home')).toBe(true);
    expect(actiu()).toBe('0');
    expect(prem(cella(0), 'End')).toBe(true);
    expect(actiu()).toBe('7');
  });

  test('a les vores no es mou, però la pàgina tampoc (preventDefault); ↓ sense cel·la davall es queda', () => {
    const { cella } = graella();
    expect(prem(cella(7), 'ArrowRight')).toBe(true);
    expect(actiu()).toBe('7');
    expect(prem(cella(1), 'ArrowUp')).toBe(true);
    expect(actiu()).toBe('1');
    expect(prem(cella(5), 'ArrowDown')).toBe(true);
    expect(actiu()).toBe('5');
  });

  test('sense maquetació (caixes 0×0) la graella és una columna: ↓ va a la següent', () => {
    const { cella } = graella({ columnes: 0 });
    prem(cella(1), 'ArrowDown');
    expect(actiu()).toBe('2');
  });

  test('fora d’un espai de treball, ← des de la primera columna és −1 (la fila d’abans)', () => {
    const { cella } = graella();
    prem(cella(3), 'ArrowLeft');
    expect(actiu()).toBe('2');
  });

  test('dins d’un .sdp-workspace, ← des de la primera columna torna a la fitxa activa de la llista', () => {
    const { cella } = graella({ dinsDeLEspai: true });
    expect(prem(cella(3), 'ArrowLeft')).toBe(true);
    expect(actiu()).toBe('Fitxa');
    /* Des d'una altra columna, −1 com sempre. */
    prem(cella(4), 'ArrowLeft');
    expect(actiu()).toBe('3');
  });

  test('cap acció amb modificadors, ja atesa, ni amb una tecla aliena', () => {
    const { cella } = graella();
    expect(prem(cella(4), 'ArrowRight', { shiftKey: true })).toBe(false);
    expect(prem(cella(4), 'ArrowRight', { metaKey: true })).toBe(false);
    expect(prem(cella(4), 'Enter')).toBe(false);
    expect(actiu()).toBe('4');
    cella(4).addEventListener('keydown', (event) => event.preventDefault(), { once: true });
    prem(cella(4), 'ArrowRight');
    expect(actiu()).toBe('4');
  });
});

/* Corrector del Gauntlet f4 (30-10-2026, idea58-rails-sense-fletxes) · ← des
   de la llista i → des de l'arbre (o l'Escape del detall) porten el focus al
   rail d'una columna plegada. Dins del rail les fletxes s'hi mouen i en
   tornen: ↑ ↓ Inici Fi entre els botons, sense triar res; al de la navegació
   → va a la fitxa activa de la llista; al de documents ← va a l'opció activa
   de la navegació i → al detall. */
describe('gestionaTeclaRail (els rails de les columnes plegades)', () => {
  function espai({ llistaPlegada = false } = {}) {
    pinta(`
      <aside id="nav"><nav class="sdp-workspace-rail" id="railNav">
        <ul><li><button class="sdp-workspace-rail__boto" id="n0">Wiki</button></li><li><button class="sdp-workspace-rail__boto" id="n1" aria-current="page">Pobles</button></li></ul>
        <ul><li><button class="sdp-workspace-rail__boto" id="n2">Etiquetes</button></li><li hidden><button class="sdp-workspace-rail__boto" id="nh">Amagada</button></li></ul>
      </nav></aside>
      <aside id="llista">${llistaPlegada
    ? '<nav class="sdp-workspace-rail sdp-workspace-rail--documents" id="railDoc"><ul><li><button class="sdp-workspace-rail__boto" id="d0">La Torre</button></li><li><button class="sdp-workspace-rail__boto" id="d1" aria-current="true">Xixona</button></li><li><button class="sdp-workspace-rail__boto" id="d2">Tibi</button></li></ul></nav>'
    : '<ul class="sdp-gestor-llista"><li><button class="sdp-gestor-fitxa" id="f0">La Torre</button></li><li><button class="sdp-gestor-fitxa" id="f1" aria-current="true">Xixona</button></li></ul>'}</aside>
      <div id="det" tabindex="-1"><button id="editar">Editar</button></div>`);
    const per = (id) => document.getElementById(id);
    const opcions = { navegacio: per('nav'), llista: per('llista'), detall: per('det') };
    per('railNav').addEventListener('keydown', (event) => gestionaTeclaRail(event, opcions));
    per('railDoc')?.addEventListener('keydown', (event) => gestionaTeclaRail(event, opcions));
    return per;
  }
  /* fireEvent torna false si el manejador ha cridat preventDefault. */
  const prem = (key, extres = {}) => !fireEvent.keyDown(document.activeElement, { key, ...extres });

  test('botonsDelRail: els botons disponibles del rail, en ordre de document', () => {
    const per = espai();
    expect(botonsDelRail(per('railNav')).map((boto) => boto.id)).toEqual(['n0', 'n1', 'n2']);
    expect(botonsDelRail(null)).toEqual([]);
  });

  test('rail de la navegació: ↓ ↑ Inici Fi mouen el focus entre els seus botons (també d’un grup a l’altre) sense clicar-ne cap', () => {
    const per = espai();
    const clics = vi.fn();
    per('railNav').addEventListener('click', clics);
    per('n1').focus();
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(per('n2'));
    expect(prem('ArrowUp')).toBe(true);
    expect(document.activeElement).toBe(per('n1'));
    expect(prem('Home')).toBe(true);
    expect(document.activeElement).toBe(per('n0'));
    expect(prem('End')).toBe(true);
    expect(document.activeElement).toBe(per('n2'));
    expect(clics).not.toHaveBeenCalled();
  });

  test('als extrems no es mou, però la pàgina tampoc (preventDefault)', () => {
    const per = espai();
    per('n0').focus();
    expect(prem('ArrowUp')).toBe(true);
    expect(prem('Home')).toBe(true);
    expect(document.activeElement).toBe(per('n0'));
    per('n2').focus();
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(per('n2'));
  });

  test('rail de la navegació: → torna a la fitxa activa de la llista (o al rail de documents, si la llista és plegada); ← no té on anar', () => {
    const per = espai();
    per('n1').focus();
    expect(prem('ArrowLeft')).toBe(false);
    expect(document.activeElement).toBe(per('n1'));
    expect(prem('ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(per('f1'));
    const plegada = espai({ llistaPlegada: true });
    plegada('n0').focus();
    expect(prem('ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(plegada('d1'));
  });

  test('rail de documents: ↓ ↑ entre els documents, ← a l’opció activa de la navegació i → a l’entrada del detall', () => {
    const per = espai({ llistaPlegada: true });
    per('d1').focus();
    expect(prem('ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(per('d2'));
    expect(prem('ArrowLeft')).toBe(true);
    expect(document.activeElement).toBe(per('n1'));
    per('d0').focus();
    expect(prem('ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(per('editar'));
  });

  test('cap acció amb modificadors, ja atesa, amb una tecla aliena ni des d’un element que no és cap botó del rail', () => {
    const per = espai({ llistaPlegada: true });
    per('d1').focus();
    expect(prem('ArrowDown', { shiftKey: true })).toBe(false);
    expect(prem('ArrowRight', { altKey: true })).toBe(false);
    expect(prem('Enter')).toBe(false);
    expect(document.activeElement).toBe(per('d1'));
    per('d1').addEventListener('keydown', (event) => event.preventDefault(), { once: true });
    prem('ArrowDown');
    expect(document.activeElement).toBe(per('d1'));
    const intrus = document.createElement('button');
    per('railDoc').append(intrus);
    intrus.focus();
    expect(prem('ArrowDown')).toBe(false);
    expect(document.activeElement).toBe(intrus);
  });

  test('un destí no disponible no rep el focus i no es crida preventDefault', () => {
    const per = espai({ llistaPlegada: true });
    per('det').setAttribute('inert', '');
    per('d1').focus();
    expect(prem('ArrowRight')).toBe(false);
    expect(document.activeElement).toBe(per('d1'));
  });
});

/* Gemini 261030 (G5) · Una casella, un ràdio o un <input> que és un botó no
   són camps editables: l'Escape del detall hi torna a la fitxa i les fletxes
   d'una graella s'hi mouen; les fletxes d'un ràdio natiu, però, són del seu
   grup. I l'Escape del detall no deixa cap oient penjat a la finestra quan
   algú n'atura la propagació, sense llevar-lo abans d'hora: amb una tecla de
   veres, el navegador buida les microtasques entre oient i oient (comprovat
   a Chrome el 30-10-2026), cosa que un dispatchEvent sintètic no fa. */
describe('G5 · caselles, ràdios i botons <input> (Gemini 261030)', () => {
  const tecla = (target, key) => ({ key, target, defaultPrevented: false });
  const per = (id) => document.getElementById(id);

  test('no són camps editables; els <input> de text, número, interval, data o cerca, sí, i dins d’un contenteditable també', () => {
    pinta(`
      <input id="cb" type="checkbox"><input id="ra" type="radio" name="r"><input id="RA" type="RADIO" name="r">
      <input id="bt" type="button" value="b"><input id="sb" type="submit"><input id="rs" type="reset">
      <input id="im" type="image" alt="i"><input id="fi" type="file"><input id="co" type="color">
      <input id="tx"><input id="nu" type="number"><input id="rg" type="range"><input id="dt" type="date"><input id="se" type="search">
      <div contenteditable="true"><input id="cbe" type="checkbox"></div>`);
    for (const id of ['cb', 'ra', 'RA', 'bt', 'sb', 'rs', 'im', 'fi', 'co']) expect(esCampEditable(per(id)), id).toBe(false);
    for (const id of ['tx', 'nu', 'rg', 'dt', 'se', 'cbe']) expect(esCampEditable(per(id)), id).toBe(true);
  });

  test('una casella o un botó <input> no ignoren cap tecla; un ràdio ignora les fletxes (són del seu grup), però no Inici, Fi ni l’Escape', () => {
    pinta('<input id="cb" type="checkbox"><input id="bt" type="submit"><input id="ra" type="radio" name="r">');
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape']) {
      expect(ignoraTecla(tecla(per('cb'), key)), `casella ${key}`).toBe(false);
      expect(ignoraTecla(tecla(per('bt'), key)), `botó ${key}`).toBe(false);
    }
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) expect(ignoraTecla(tecla(per('ra'), key)), key).toBe(true);
    for (const key of ['Home', 'End', 'Escape']) expect(ignoraTecla(tecla(per('ra'), key)), key).toBe(false);
  });

  test('a una graella, les fletxes es mouen des d’una casella i no des d’un ràdio', () => {
    pinta(`
      <div id="caselles" data-graella-teclat=""><label><input id="c0" type="checkbox"> 0</label><label><input id="c1" type="checkbox"> 1</label></div>
      <div id="radios" data-graella-teclat=""><label><input id="r0" type="radio" name="r"> 0</label><label><input id="r1" type="radio" name="r"> 1</label></div>`);
    per('caselles').addEventListener('keydown', gestionaTeclaGraella);
    per('radios').addEventListener('keydown', gestionaTeclaGraella);
    per('c0').focus();
    expect(fireEvent.keyDown(per('c0'), { key: 'ArrowDown' })).toBe(false);
    expect(document.activeElement).toBe(per('c1'));
    per('r0').focus();
    expect(fireEvent.keyDown(per('r0'), { key: 'ArrowDown' })).toBe(true);
    expect(document.activeElement).toBe(per('r0'));
  });
});

describe('gestionaEscapeDelDetall (G5, Gemini 261030)', () => {
  const per = (id) => document.getElementById(id);
  function detall() {
    pinta(`
      <ul class="sdp-gestor-llista" id="llista"><li aria-current="true"><button class="sdp-gestor-fitxa" id="fitxa">La Torre de les Maçanes</button></li></ul>
      <section id="detall" tabindex="-1">
        <button id="editar">Editar</button><input id="casella" type="checkbox"><input id="radio" type="radio" name="r">
        <input id="boto" type="button" value="Desa"><input id="nom" value="Xixona">
      </section>`);
    per('detall').addEventListener('keydown', (event) => gestionaEscapeDelDetall(event, per('llista')));
  }
  /* fireEvent torna false si algú ha cridat preventDefault. */
  const escape = (element) => {
    element.focus();
    return !fireEvent.keyDown(element, { key: 'Escape' });
  };
  /* La crida de React des de l'arrel del detall, a mà, amb la tecla nativa encara pel camí. */
  const delDetall = (natiu) => gestionaEscapeDelDetall(
    { key: 'Escape', target: per('editar'), currentTarget: per('detall'), nativeEvent: natiu, defaultPrevented: false },
    per('llista')
  );
  const nova = () => new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });

  test('des d’una casella, un ràdio o un <input> botó, l’Escape torna a la fitxa; des d’un camp de text, no', () => {
    detall();
    for (const id of ['casella', 'radio', 'boto', 'editar']) {
      expect(escape(per(id)), id).toBe(true);
      expect(document.activeElement, id).toBe(per('fitxa'));
    }
    expect(escape(per('nom'))).toBe(false);
    expect(document.activeElement).toBe(per('nom'));
  });

  test('si algú n’atura la propagació, l’Escape és seu i, en acabar la tasca de la tecla, no queda cap oient a la finestra', async () => {
    detall();
    const afig = vi.spyOn(window, 'addEventListener');
    const lleva = vi.spyOn(window, 'removeEventListener');
    const penjats = () => {
      const llevats = new Set(lleva.mock.calls.filter(([tipus]) => tipus === 'keydown').map(([, oient]) => oient));
      return afig.mock.calls.filter(([tipus, oient]) => tipus === 'keydown' && !llevats.has(oient));
    };
    const atura = (event) => event.stopPropagation();
    document.addEventListener('keydown', atura);
    try {
      expect(escape(per('editar'))).toBe(false);
      expect(escape(per('casella'))).toBe(false);
      expect(document.activeElement).toBe(per('casella'));
      expect(penjats()).toHaveLength(2);
      await new Promise((resolve) => { setTimeout(resolve, 0); });
      expect(penjats()).toHaveLength(0);
    } finally {
      document.removeEventListener('keydown', atura);
    }
  });

  test('l’oient sobreviu a les microtasques que el navegador buida entre oient i oient, i la tecla torna a la fitxa', async () => {
    detall();
    per('editar').focus();
    const natiu = nova();
    delDetall(natiu);
    await Promise.resolve();
    await Promise.resolve();
    window.dispatchEvent(natiu);
    expect(natiu.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(per('fitxa'));
  });

  test('una altra tecla que arriba abans a la finestra no se l’endú: l’oient espera la seua', () => {
    detall();
    per('editar').focus();
    const natiu = nova();
    delDetall(natiu);
    const altra = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    window.dispatchEvent(altra);
    expect(altra.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(per('editar'));
    window.dispatchEvent(natiu);
    expect(natiu.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(per('fitxa'));
  });
});
