/* Ordre del Mestre (261026_2126; pla 261026_2130, P1-36) · Sense el «…» de
   la fila de títol, la llista de converses obri «Seleccionar xats» amb la
   pulsació llarga de Pedra Seca (pulsacioLlarga.js): el dit o el ratolí
   mantinguts i quiets, el menú contextual i Maj+F10 o la tecla de menú. Només
   les files triables; el clic que ve darrere no obri res; dins de la
   selecció, no fa res. jsdom no pinta: es comprova el contracte del DOM. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DURADA_PULSACIO } from '../../../components/PedraSeca/organismes/pulsacioLlarga.js';

vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
import LlistaConverses, { esFilaTriable } from './LlistaConverses.jsx';
import { agrupaComunitats, mapejaFil } from '../missatges.js';

const t = (_, alternativa) => alternativa;
const PISTA = 'Mantín premuda una conversa, fes clic amb el botó dret o prem Maj+F10 per a seleccionar xats.';

function files() {
  const fils = [
    { id: 'c-1', tipus: 'comunitat', titol: 'Almàssera' },
    { id: 'g-1', tipus: 'grup', titol: 'General', comunitatId: 'c-1', ultimText: 'Bon dia', ultimAl: '2026-10-26T09:00:00Z' },
    { id: 'a', tipus: 'directe', titol: 'Vicent', ultimText: 'Hola', ultimAl: '2026-10-26T10:00:00Z' },
    { id: 'sdp-per-defecte:iaia', tipus: 'directe', titol: 'IAIA MarIA', perDefecte: true, ultimText: 'Pregunta-me' }
  ].map((f) => mapejaFil(f));
  const [comunitat] = agrupaComunitats(fils);
  return [
    { clau: 'poble:la-torre', tipus: 'poble', poble: { id: 'la-torre', nom: 'Gent de la Torre' } },
    { clau: 'entitat:socdepoble', tipus: 'entitat', entitat: { id: 'socdepoble', nom: 'Sóc de Poble', avatar: null } },
    { clau: 'comunitat:c-1', tipus: 'comunitat', comunitat },
    { clau: 'a', tipus: 'fil', fil: fils.find((f) => f.id === 'a') },
    { clau: 'sdp-per-defecte:iaia', tipus: 'fil', fil: fils.find((f) => f.id === 'sdp-per-defecte:iaia') }
  ];
}

const boto = (clau) => document.querySelector(`li[data-clau="${clau}"] > button`);

function munta({ seleccio = null, onSelecciona = vi.fn(), onSelect = vi.fn(), onObriComunitat = vi.fn(), llista = files() } = {}) {
  const props = { files: llista, onSelect, onObriComunitat, onObriPoble: vi.fn(), onObriEntitat: vi.fn(), locale: 'ca-ES', t, seleccio, onSelecciona };
  const vista = render(<LlistaConverses {...props} />);
  return { ...vista, onSelecciona, onSelect, onObriComunitat, props };
}

afterEach(cleanup);

describe('esFilaTriable', () => {
  test('una conversa i una comunitat sí; el poble, l’entitat i una fila d’ajuda per defecte, no', () => {
    const [poble, entitat, comunitat, fil, ajuda] = files();
    expect([poble, entitat, comunitat, fil, ajuda].map(esFilaTriable)).toEqual([false, false, true, true, false]);
    expect(esFilaTriable(null)).toBe(false);
  });
});

describe('la pista i la drecera', () => {
  test('la pista va fora de la <ul>, davant, i només la descriuen les files triables', () => {
    munta();
    const llista = screen.getByRole('list', { name: 'Converses' });
    const pista = llista.previousElementSibling;
    expect(pista.tagName).toBe('P');
    expect(pista.className).toBe('sdp-nomes-lector');
    expect(pista.textContent).toBe(PISTA);
    for (const clau of ['comunitat:c-1', 'a']) {
      expect(boto(clau).getAttribute('aria-keyshortcuts'), clau).toBe('Shift+F10');
      expect(boto(clau).getAttribute('aria-describedby'), clau).toBe(pista.id);
    }
    for (const clau of ['poble:la-torre', 'entitat:socdepoble', 'sdp-per-defecte:iaia']) {
      expect(boto(clau).hasAttribute('aria-keyshortcuts'), clau).toBe(false);
      expect(boto(clau).hasAttribute('aria-describedby'), clau).toBe(false);
    }
  });

  test('sense cap fila triable (el poble, l’entitat i les d’ajuda d’una llista nova), cap pista ni cap fila que la descriga', () => {
    munta({ llista: files().filter((fila) => !esFilaTriable(fila)) });
    expect(screen.getByRole('list', { name: 'Converses' }).previousElementSibling).toBeNull();
    expect(screen.queryByText(PISTA)).toBeNull();
    expect(document.querySelector('[aria-describedby]')).toBeNull();
    expect(document.querySelector('[aria-keyshortcuts]')).toBeNull();
  });

  test('sense onSelecciona, la llista de sempre: ni pista ni drecera', () => {
    render(<LlistaConverses files={files()} onSelect={() => {}} onObriComunitat={() => {}} locale="ca-ES" t={t} />);
    expect(screen.queryByText(PISTA)).toBeNull();
    expect(document.querySelector('[aria-keyshortcuts]')).toBeNull();
  });

  test('dins de la selecció, cap pista ni drecera: la fila és una casella', () => {
    munta({ seleccio: { triades: new Set(['a']), onAlterna: vi.fn() }, llista: files().filter(esFilaTriable) });
    expect(screen.queryByText(PISTA)).toBeNull();
    expect(boto('a').getAttribute('role')).toBe('checkbox');
    expect(boto('a').getAttribute('aria-checked')).toBe('true');
    expect(boto('a').hasAttribute('aria-keyshortcuts')).toBe(false);
    expect(boto('a').hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('la pulsació llarga', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] }); });
  afterEach(() => { vi.useRealTimers(); });

  test('mig segon quiet sobre una conversa: onSelecciona amb la seua clau, i el clic de després no l’obri', () => {
    const { onSelecciona, onSelect } = munta();
    fireEvent.pointerDown(boto('a'), { button: 0, clientX: 20, clientY: 20 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO - 1); });
    expect(onSelecciona).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onSelecciona).toHaveBeenCalledWith('a');
    fireEvent.pointerUp(boto('a'));
    fireEvent.click(boto('a'));
    expect(onSelect).not.toHaveBeenCalled();
    /* El toc següent ja és un toc: obri la conversa. */
    fireEvent.pointerDown(boto('a'), { button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerUp(boto('a'));
    fireEvent.click(boto('a'));
    expect(onSelect).toHaveBeenCalledWith('a');
    expect(onSelecciona).toHaveBeenCalledTimes(1);
  });

  test('també sobre una comunitat, i el clic de després no obri la seua fitxa', () => {
    const { onSelecciona, onObriComunitat } = munta();
    fireEvent.pointerDown(boto('comunitat:c-1'), { button: 0, clientX: 20, clientY: 20 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO); });
    fireEvent.pointerUp(boto('comunitat:c-1'));
    fireEvent.click(boto('comunitat:c-1'));
    expect(onSelecciona).toHaveBeenCalledWith('comunitat:c-1');
    expect(onObriComunitat).not.toHaveBeenCalled();
  });

  test('més de 10px de moviment, pointercancel (el desplaçament) o alçar el dit abans d’hora la cancel·len', () => {
    const { onSelecciona } = munta();
    fireEvent.pointerDown(boto('a'), { button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerMove(boto('a'), { clientX: 26, clientY: 26 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO); });
    /* 8,5px: dins de la tolerància, la pulsació continua. */
    expect(onSelecciona).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(1000); });

    fireEvent.pointerDown(boto('a'), { button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerMove(boto('a'), { clientX: 20, clientY: 31 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO * 2); });
    fireEvent.pointerDown(boto('a'), { button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerCancel(boto('a'));
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO * 2); });
    fireEvent.pointerDown(boto('a'), { button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerUp(boto('a'));
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO * 2); });
    expect(onSelecciona).toHaveBeenCalledTimes(1);
  });

  test('el botó dret no arma el temporitzador: només el menú contextual compta', () => {
    const { onSelecciona } = munta();
    fireEvent.pointerDown(boto('a'), { button: 2, clientX: 20, clientY: 20 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO * 2); });
    expect(onSelecciona).not.toHaveBeenCalled();
    expect(fireEvent.contextMenu(boto('a'))).toBe(false);
    expect(onSelecciona).toHaveBeenCalledWith('a');
  });

  test('Android: el temporitzador i el menú contextual del mateix dit compten una vegada', () => {
    const { onSelecciona, onSelect } = munta();
    fireEvent.pointerDown(boto('a'), { button: 0, clientX: 20, clientY: 20 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO); });
    expect(fireEvent.contextMenu(boto('a'))).toBe(false);
    fireEvent.pointerUp(boto('a'));
    fireEvent.click(boto('a'));
    expect(onSelecciona).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('Maj+F10 i la tecla de menú sobre la fila enfocada; Intro, en canvi, l’obri', () => {
    const { onSelecciona, onSelect } = munta();
    expect(fireEvent.keyDown(boto('a'), { key: 'F10', shiftKey: true })).toBe(false);
    expect(onSelecciona).toHaveBeenLastCalledWith('a');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(fireEvent.keyDown(boto('comunitat:c-1'), { key: 'ContextMenu' })).toBe(false);
    expect(onSelecciona).toHaveBeenLastCalledWith('comunitat:c-1');
    act(() => { vi.advanceTimersByTime(1000); });
    /* F10 sense Maj no és la drecera. */
    expect(fireEvent.keyDown(boto('a'), { key: 'F10' })).toBe(true);
    expect(onSelecciona).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(boto('a'), { key: 'Enter' });
    fireEvent.click(boto('a'));
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  test('les files no triables no l’obrin: ni el dit, ni el menú contextual (el del navegador continua), ni el teclat', () => {
    const { onSelecciona, props } = munta();
    for (const clau of ['poble:la-torre', 'entitat:socdepoble', 'sdp-per-defecte:iaia']) {
      fireEvent.pointerDown(boto(clau), { button: 0, clientX: 20, clientY: 20 });
      act(() => { vi.advanceTimersByTime(DURADA_PULSACIO * 2); });
      fireEvent.pointerUp(boto(clau));
      expect(fireEvent.contextMenu(boto(clau)), clau).toBe(true);
      expect(fireEvent.keyDown(boto(clau), { key: 'F10', shiftKey: true }), clau).toBe(true);
    }
    expect(onSelecciona).not.toHaveBeenCalled();
    /* El toc de la fila del poble continua fent el seu camí. */
    fireEvent.click(boto('poble:la-torre'));
    expect(props.onObriPoble).toHaveBeenCalledTimes(1);
  });

  test('dins de la selecció, la pulsació llarga no fa res i el clic que la seguix no desfà la tria', () => {
    const onAlterna = vi.fn();
    /* Com XatSection: mentre se selecciona, només les files triables. */
    const { onSelecciona } = munta({ seleccio: { triades: new Set(['a']), onAlterna }, llista: files().filter(esFilaTriable) });
    const llista = screen.getByRole('list', { name: 'Converses' });
    expect(within(llista).getAllByRole('checkbox').map((c) => c.closest('li').getAttribute('data-clau'))).toEqual(['comunitat:c-1', 'a']);
    fireEvent.pointerDown(boto('a'), { button: 0, clientX: 20, clientY: 20 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO); });
    fireEvent.pointerUp(boto('a'));
    fireEvent.click(boto('a'));
    expect(onAlterna).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1000); });
    /* El menú contextual que arriba tard (Android, retard llarg) tampoc. */
    expect(fireEvent.contextMenu(boto('a'))).toBe(false);
    expect(onSelecciona).not.toHaveBeenCalled();
    /* Un toc, sí: alterna. */
    fireEvent.pointerDown(boto('a'), { button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerUp(boto('a'));
    fireEvent.click(boto('a'));
    expect(onAlterna).toHaveBeenCalledWith('a');
  });
});

/* P1-53 (Llibre Mestre, 261027) · Les files van arran, sense el marge
   editorial que cada <li> hereta de base.css (8px davall i 4px a
   l'esquerra). jsdom no fa la cascada: es comprova la classe de la llista i
   la regla de modules.css.
   Ordre del Mestre (261027; auditoria Gauntlet R5, G2-01) · El reinici és de
   la classe mare, .sdp-xat-llista: totes les llistes del xat van arran, i el
   modificador de la de converses ja no cal. */
describe('les files arran', () => {
  const classes = () => screen.getByRole('list', { name: 'Converses' }).className.split(' ');

  test('la llista de converses és una .sdp-xat-llista, amb peu i sense', () => {
    const { props } = munta();
    expect(classes()).toEqual(['sdp-xat-llista']);
    cleanup();
    render(<LlistaConverses {...props} peu={<p>Peu</p>} />);
    expect(classes()).toEqual(['sdp-xat-llista', 'sdp-xat-llista--amb-peu']);
  });

  test('la regla de la classe mare, amb :where, anul·la el marge i el coixí del <li>', () => {
    const modules = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ');
    expect(modules).not.toContain('sdp-xat-llista--converses');
    /* Amb :where pesa com el <li> sol, i la classe pròpia d'un <li>
       (.sdp-xat-multimedia__item, amb 16px de coixí) continua guanyant. Es
       comprova el text: l'última declaració de margin-bottom i padding-left
       per a eixe selector exacte, que el selector sense :where no hi és, i
       que la regla viu dins de @layer components (fora de la capa guanyaria
       també la classe del <li>). Una altra forma de tornar el marge (un
       shorthand, un altre selector o un altre full) no la veu. */
    const SELECTOR = ':where(.sdp-xat-llista) > li';
    const valor = (propietat) => {
      let trobat = null;
      for (const m of modules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selectors = m[1].split(';').pop().split(',').map((s) => s.trim());
        if (!selectors.includes(SELECTOR)) continue;
        for (const declaracio of m[2].split(';')) {
          const [prop, ...resta] = declaracio.split(':');
          if ((prop || '').trim() === propietat) trobat = resta.join(':').trim();
        }
      }
      return trobat;
    };
    expect([valor('margin-bottom'), valor('padding-left')]).toEqual(['0', '0']);
    expect(modules).not.toMatch(/(^|[\s}])\.sdp-xat-llista\s*>\s*li\s*[{,]/);
    const posicio = modules.indexOf(`${SELECTOR} {`);
    const dinsDeComponents = [...modules.matchAll(/@layer components \{/g)].some((capa) => {
      let profunditat = 0;
      for (let i = capa.index + capa[0].length - 1; i < modules.length; i += 1) {
        if (modules[i] === '{') profunditat += 1;
        else if (modules[i] === '}' && (profunditat -= 1) === 0) return posicio > capa.index && posicio < i;
      }
      return false;
    });
    expect(posicio).toBeGreaterThan(-1);
    expect(dinsDeComponents).toBe(true);
  });
});
