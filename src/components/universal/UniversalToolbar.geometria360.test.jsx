/* Pas 8.4 del pla 261029_0216 (T8 · Geometria autenticada R2, 360–393 px) ·
   Revisió del Bloc H (R2): amb «🎴 Proposa Card» al grup de publicació, la
   barra d'eines del Bloc de Notes passava a dues files als telèfons (360,
   375 i 393 px). La correcció: en compacte (amplària pròpia < 500 px,
   PUNTS_DE_TALL.eines) la cel·la va dins d'«Aa», darrere de les llistes, i la
   fila de la barra no s'embolica (flex-wrap: nowrap).
   jsdom no té motor de maquetació: ací es fixa la col·locació al DOM a cada
   amplària de telèfon i en ample, també passant per DocumentEditor (la barra
   de Notes de veres, amb el motor del Bloc), i el text del CSS que impedix
   l'embolic (modules.css), llegit com a text, com Conversa.test.jsx i
   UniversalEditorShell.edicioAvancada.test.jsx. Llei del Píxel: cap canvi
   visual; només guardes. Cap :has() al CSS (tests/lint_xat). */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';

vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
import UniversalToolbar from './UniversalToolbar.jsx';
import { DocumentEditor } from './DocumentEditor.jsx';
import { PUNTS_DE_TALL } from '../layout/graella.js';
import { proposaCard } from '../../sections/notes/proposaCard.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const TELEFONS = [360, 375, 393];
const AMPLE = 900;
/* El telèfon: la finestra, la consulta de mitjans i l'amplària pròpia de la
   barra (ResizeObserver, el que llig useCompactControls). */
const amplada = (px) => {
  vi.stubGlobal('innerWidth', px);
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; }
    observe(element) { this.callback([{ target: element, contentRect: { width: px, height: 0 } }]); }
    unobserve() {}
    disconnect() {}
  });
};
const barraDe = (arrel) => arrel.querySelector('.sdp-editor-tools');
const filaDe = (barra) => barra.querySelector(':scope > .sdp-editor-tools__formats');
const opcionsDe = (barra) => barra.querySelector('.sdp-editor-tools__format-options');
const publicacioDe = (barra) => barra.querySelector('.sdp-editor-tools__group--publicacio');
/* Els controls que ocupen la fila: els fills directes de la fila i els del
   grup de publicació; el grup de format amagat ([hidden]) no hi compta. */
const controlsDeLaFila = (barra) => [
  ...[...filaDe(barra).children].filter((fill) => fill.matches('button')),
  ...publicacioDe(barra).querySelectorAll(':scope > button')
].map((boto) => boto.getAttribute('aria-label') || boto.textContent);
const obriAa = (barra) => fireEvent.click(within(barra).getByRole('button', { name: 'Format del text' }));

describe('R2 · UniversalToolbar amb Proposa Card als telèfons', () => {
  for (const px of TELEFONS) {
    test(`${px} px · compacta: la fila porta la tornada, «Aa», Borrar i Publicar; la cel·la de Proposa Card viu dins d’«Aa», l’última`, () => {
      expect(px).toBeLessThan(PUNTS_DE_TALL.eines);
      amplada(px);
      const proposa = vi.fn();
      const { container } = render(<UniversalToolbar onPublish={() => {}} onDelete={() => {}} onProposaCard={proposa} />);
      const barra = barraDe(container);
      expect(barra.dataset.compact).toBe('true');
      expect(controlsDeLaFila(barra)).toEqual(['Tornar a la llista', 'Format del text', 'Borrar', 'Publicar']);
      const opcions = opcionsDe(barra);
      expect(opcions.hidden).toBe(true);
      expect(within(barra).queryByRole('button', { name: 'Proposa Card' })).toBeNull();
      expect(publicacioDe(barra).querySelector('[aria-label="Proposa Card"]')).toBeNull();
      obriAa(barra);
      expect(opcions.hidden).toBe(false);
      const aa = within(barra).getByRole('button', { name: 'Format del text' });
      expect(aa.getAttribute('aria-controls')).toBe(opcions.id);
      const boto = within(barra).getByRole('button', { name: 'Proposa Card' });
      expect(opcions.contains(boto)).toBe(true);
      expect(opcions.lastElementChild).toBe(boto);
      expect(boto.previousElementSibling.getAttribute('aria-label')).toBe('Llista numerada');
      expect(boto.className).toBe('sdp-bloc-icon');
      /* La fila no canvia en obrir el menú: el menú és absolut (CSS, baix). */
      expect(controlsDeLaFila(barra)).toEqual(['Tornar a la llista', 'Format del text', 'Borrar', 'Publicar']);
      fireEvent.click(boto);
      expect(proposa).toHaveBeenCalledTimes(1);
    });

    test(`${px} px · «Desfés la proposta» (la mateixa cel·la) també viu dins d’«Aa»`, () => {
      amplada(px);
      const { container } = render(<UniversalToolbar onPublish={() => {}} onDelete={() => {}} onProposaCard={() => {}} proposaCardDesfer />);
      const barra = barraDe(container);
      expect(controlsDeLaFila(barra)).toEqual(['Tornar a la llista', 'Format del text', 'Borrar', 'Publicar']);
      obriAa(barra);
      const desfer = within(barra).getByRole('button', { name: 'Desfés la proposta' });
      expect(opcionsDe(barra).lastElementChild).toBe(desfer);
      expect(publicacioDe(barra).contains(desfer)).toBe(false);
    });
  }

  test(`${AMPLE} px · ampla: la cel·la torna al grup de publicació, davant de Borrar i Publicar, i no és dins d’«Aa»`, () => {
    amplada(AMPLE);
    const { container } = render(<UniversalToolbar onPublish={() => {}} onDelete={() => {}} onProposaCard={() => {}} />);
    const barra = barraDe(container);
    expect(barra.dataset.compact).toBe('false');
    expect(within(barra).queryByRole('button', { name: 'Format del text' })).toBeNull();
    expect(opcionsDe(barra).hidden).toBe(false);
    const boto = within(barra).getByRole('button', { name: 'Proposa Card' });
    expect(publicacioDe(barra).firstElementChild).toBe(boto);
    expect(opcionsDe(barra).contains(boto)).toBe(false);
    expect([...publicacioDe(barra).children].map((b) => b.getAttribute('aria-label') || b.textContent)).toEqual(['Proposa Card', 'Borrar', 'Publicar']);
  });
});

/* La barra del Bloc de Notes de veres: DocumentEditor amb el motor del Bloc
   (proposaCard), les eines davall de l'entradilla i el TipTap real, com la
   munta NotesEditor. A cada amplària de telèfon, la cel·la és dins d'«Aa»; en
   ample, al grup de publicació. */
describe('R2 · la barra de Notes (DocumentEditor + proposaCard) als telèfons', () => {
  const DOC = Object.freeze({ id: 'n1', title: '', subtitle: '', lead: '', content: '<p>La festa del poble</p><p>Tres dies de música.</p>', formattedDate: '01/01/26', formattedTime: '10:00' });
  const muntaNotes = () => render(<DocumentEditor adapter={{
    document: DOC, labels: [], seedContent: null, updateLocal: vi.fn(), saveRemote: vi.fn(), deleteDocument: vi.fn(),
    proposaCard, posicioEines: 'davall-entradilla', edicioAvancada: true, placeholderTitol: 'Nota sense títol'
  }} />);

  for (const px of TELEFONS) {
    test(`${px} px · les eines ancorades de la nota porten Proposa Card dins d’«Aa», encés, i la fila sense ell`, () => {
      amplada(px);
      const { container } = muntaNotes();
      const barra = container.querySelector('.sdp-editor-eines > .sdp-editor-tools');
      expect(barra).not.toBeNull();
      expect(barra.dataset.compact).toBe('true');
      expect(controlsDeLaFila(barra)).toEqual(['Tornar a la llista', 'Format del text', 'Borrar', 'Publicar']);
      expect(within(barra).queryByRole('button', { name: 'Proposa Card' })).toBeNull();
      obriAa(barra);
      const boto = within(barra).getByRole('button', { name: 'Proposa Card' });
      expect(opcionsDe(barra).lastElementChild).toBe(boto);
      expect(boto.disabled).toBe(false);
    });
  }

  test(`${AMPLE} px · en ample, Proposa Card obri el grup de publicació de la nota`, () => {
    amplada(AMPLE);
    const { container } = muntaNotes();
    const barra = container.querySelector('.sdp-editor-eines > .sdp-editor-tools');
    expect(barra.dataset.compact).toBe('false');
    expect([...publicacioDe(barra).children].map((b) => b.getAttribute('aria-label') || b.textContent)).toEqual(['Proposa Card', 'Borrar', 'Publicar']);
  });
});

/* El full, llegit com a text (modules.css): la fila no s'embolica, el grup de
   format amagat no ocupa lloc, el menú d'«Aa» és absolut davall de la fila
   (no la fa créixer) i cada cel·la fa el sòl tàctil (--sdp-bloc-control). Les
   dues regles de .sdp-editor-tools__formats són de la mateixa capa
   (@layer components) i la mateixa especificitat: l'última, nowrap, mana. */
describe('R2 · el CSS que impedix l’embolic de la barra', () => {
  const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = (css, selector) => {
    const m = new RegExp(`\\n\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(css);
    expect(m, selector).not.toBeNull();
    return m[1].split(';').map((d) => d.trim()).filter(Boolean);
  };
  const capaDe = (css, posicio) => {
    let capa = null;
    for (const m of css.matchAll(/@layer\s+([\w-]+)\s*\{/g)) if (m.index < posicio) capa = m[1];
    return capa;
  };
  const moduls = llig('src/css/modules.css');
  const NOWRAP = '.sdp-editor-tools__formats { position: relative; flex-wrap: nowrap; }';

  test('la fila de la barra no s’embolica: nowrap mana sobre la regla base (mateixa capa, després)', () => {
    const base = /\n\s*\.sdp-editor-tools__formats \{([^}]*)\}/.exec(moduls);
    expect(base).not.toBeNull();
    expect(base[1]).toContain('flex-wrap: wrap');
    const mana = moduls.indexOf(NOWRAP);
    expect(mana).toBeGreaterThan(base.index);
    expect(capaDe(moduls, base.index)).toBe('components');
    expect(capaDe(moduls, mana)).toBe('components');
    expect(moduls.match(/\.sdp-editor-tools__formats \{/g)).toHaveLength(2);
    /* La barra ocupa l'amplària de la columna i es pot encongir (min-width: 0). */
    expect(bloc(moduls, '.sdp-editor-tools')).toEqual(expect.arrayContaining(['width: 100%', 'min-width: 0']));
    expect(moduls).toContain('.sdp-editor-tools__group--publicacio { margin-inline-start: auto; }');
  });

  test('en compacte, el grup de format amagat no ocupa lloc i el menú d’«Aa» és absolut davall de la fila', () => {
    expect(moduls).toContain('.sdp-editor-tools__format-options[hidden] { display: none; }');
    const menu = /\.sdp-editor-tools\[data-compact="true"\] \.sdp-editor-tools__format-options:not\(\[hidden\]\) \{([^}]*)\}/.exec(moduls);
    expect(menu).not.toBeNull();
    const declaracions = menu[1].split(';').map((d) => d.trim()).filter(Boolean);
    expect(declaracions).toEqual(expect.arrayContaining(['position: absolute', 'inset-block-start: 100%', 'max-width: calc(100% - 16px)']));
    expect(moduls).not.toMatch(/\.sdp-editor-tools[^{]*:has\(/);
  });

  test('cada cel·la de la fila fa el sòl tàctil de 48 px i, en compacte, la fila mínima cap a 360 px', () => {
    expect(moduls).toContain('.sdp-bloc-icon { width: var(--sdp-bloc-control); padding: 0; }');
    /* El selector va en dues línies al full: .sdp-bloc-icon,\n .sdp-bloc-action { */
    const cellaComuna = /\n\s*\.sdp-bloc-icon,\s*\.sdp-bloc-action \{([^}]*)\}/.exec(moduls);
    expect(cellaComuna).not.toBeNull();
    expect(cellaComuna[1].split(';').map((d) => d.trim()).filter(Boolean)).toEqual(expect.arrayContaining(['min-width: var(--sdp-bloc-control)', 'flex: none']));
    const fila = bloc(moduls, '.sdp-editor-tools__formats');
    expect(fila).toEqual(expect.arrayContaining(['gap: var(--sdp-space-2)', 'padding: var(--sdp-space-1) var(--sdp-space-2)']));
    /* Els tokens, amb un analitzador de declaracions (no amb el text «nom:
       valor», que seria una declaració més per a tractor-tokens.mjs). */
    const tokens = llig('src/css/tokens.css');
    const token = (nom) => [...tokens.matchAll(new RegExp(`${nom}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim());
    expect(token('--sdp-bloc-control')).toEqual(['max(var(--sdp-touch), var(--sdp-touch-comode))']);
    const cella = Math.max(parseInt(token('--sdp-touch')[0], 10), parseInt(token('--sdp-touch-comode')[0], 10));
    const buit = parseInt(token('--sdp-space-2')[0], 10);
    expect(cella).toBe(48);
    /* La fila compacta: 4 controls (tornada, «Aa», Borrar i Publicar) al seu
       mínim (la cel·la), 3 buits i el coixí lateral. Un cinqué control (la
       cel·la de Proposa Card a la fila) és el que l'R2 va traure d'ací. */
    const controls = 4;
    const minim = controls * cella + (controls - 1) * buit + 2 * buit;
    expect(minim).toBeLessThanOrEqual(Math.min(...TELEFONS));
  });
});
