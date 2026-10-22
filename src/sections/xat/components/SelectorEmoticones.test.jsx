/* Pla 261022_1425 (emojis grans i paritat WhatsApp) · El calaix d'emoticones
   del compositor: la mida gran (glif de 36-40px en una diana de ≥48px), les
   pestanyes (Del poble i les famílies del catàleg, amb fletxes), el catàleg a
   demanda sense les emoticones que el navegador no reconeix, les recents i
   la selecció que arriba a qui el munta. Dades sintètiques i, en una prova,
   el catàleg de veres. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { buidaRecents } from '../emoticonesXat.js';
import SelectorEmoticones from './SelectorEmoticones.jsx';

afterEach(() => { cleanup(); buidaRecents(); });

const t = (_, alternativa) => alternativa;
const GRUPS = Object.freeze([
  { id: 'cares-emocions', nom: 'Cares i emocions', emojis: [['1F600', '😀', 'grinning face'], ['0061 0062', 'ab', 'not an emoji']] },
  { id: 'menjar-beguda', nom: 'Menjar i beguda', emojis: [['1F345', '🍅', 'tomato'], ['1F33D', '🌽', 'ear of corn']] },
  { id: 'natura', nom: 'Natura sintètica', emojis: [['1F333', '🌳', 'deciduous tree']] },
  { id: 'buida', nom: 'Res que es veja', emojis: [['0078', 'x', 'latin small letter x']] }
]);
/* Un carregador nou per prova: el selector guarda el catàleg de cada carregador. */
const cataleg = (grups = GRUPS) => vi.fn(async () => ({ GRUPS_EMOJIS: grups }));

function pinta(props = {}) {
  return render(<SelectorEmoticones id="prova-emoticones" t={t} onTria={vi.fn()} onTanca={vi.fn()} carregaCataleg={cataleg()} {...props} />);
}
const pestanyes = () => screen.getAllByRole('tab').map((p) => p.getAttribute('aria-label'));
const espera = () => waitFor(() => expect(pestanyes()).toEqual(['Del poble', 'Cares', 'Menjar', 'Natura sintètica']));

describe('la mida gran (36-40px, diana ≥48px)', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const regla = (selector) => {
    const inici = css.indexOf(`${selector} {`);
    expect(inici, selector).toBeGreaterThan(-1);
    return css.slice(inici, css.indexOf('}', inici));
  };
  const rem = (cos, propietat) => Number(cos.match(new RegExp(`(?:^|[\\s;{])${propietat}:\\s*([\\d.]+)rem`))?.[1]);

  test('les llistes del calaix porten la variant gran de la graella universal', async () => {
    pinta();
    await espera();
    const llistes = screen.getAllByRole('list');
    expect(llistes.length).toBeGreaterThan(0);
    for (const llista of llistes) {
      expect(llista.classList.contains('sdp-graella-emojis__graella')).toBe(true);
      expect(llista.classList.contains('sdp-graella-emojis__graella--gran')).toBe(true);
    }
    const tomaca = screen.getByRole('button', { name: 'tomato' });
    expect(tomaca.classList.contains('sdp-graella-emojis__boto')).toBe(true);
    expect(tomaca.querySelector('[aria-hidden="true"]').textContent).toBe('🍅');
  });

  test('el CSS: glif entre 2,25 i 2,5rem (36-40px) i diana de 3,25rem (52px), també a la columna de la graella', () => {
    const boto = regla('.sdp-graella-emojis__graella--gran .sdp-graella-emojis__boto');
    expect(rem(boto, 'font-size')).toBeGreaterThanOrEqual(2.25);
    expect(rem(boto, 'font-size')).toBeLessThanOrEqual(2.5);
    expect(rem(boto, 'min-block-size')).toBeGreaterThanOrEqual(3);
    expect(regla('.sdp-graella-emojis__graella--gran')).toMatch(/minmax\(3\.25rem, 1fr\)/);
    // La graella de sempre (Bloc i Perfil) no canvia.
    expect(rem(regla('.sdp-graella-emojis__boto'), 'font-size')).toBe(1.625);
  });

  test('el calaix i les pestanyes: popover acotat a la columna, alçada màxima i pestanyes de --sdp-touch', () => {
    const moduls = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const de = (selector) => moduls.slice(moduls.indexOf(`${selector} {`), moduls.indexOf('}', moduls.indexOf(`${selector} {`)));
    expect(de('.sdp-xat-emojis')).toMatch(/inline-size: min\(22\.5rem, calc\(100% - var\(--sdp-space-2\) \* 2\)\)/);
    // Primer vh (Chrome 100-107 i Firefox 100 no tenen dvh) i després dvh.
    expect(de('.sdp-xat-emojis')).toMatch(/max-block-size: min\(20rem, 60vh\);\s*max-block-size: min\(20rem, 60dvh\);/);
    expect(de('.sdp-xat-emojis--estret')).toMatch(/max-block-size: min\(17\.5rem, 50vh\);\s*max-block-size: min\(17\.5rem, 50dvh\);/);
    expect(de('.sdp-xat-emojis__pestanya')).toMatch(/inline-size: max\(var\(--sdp-touch\), calc\(100% \/ 6\.5\)\)/);
    expect(de('.sdp-xat-compositor--emojis')).toMatch(/z-index: 3/);
    expect(de('.sdp-xat-emojis__titol')).toMatch(/padding: 0;\s*border: 0;/);
    expect(de('.sdp-xat-emojis__pestanya')).toMatch(/block-size: var\(--sdp-touch\)/);
  });
});

describe('pestanyes i contingut', () => {
  test('diàleg amb nom; «Del poble» activa; mentre arriba el catàleg, les famílies conegudes; després, les del catàleg', async () => {
    const carrega = cataleg();
    pinta({ carregaCataleg: carrega });
    expect(screen.getByRole('dialog', { name: 'Emoticones' }).id).toBe('prova-emoticones');
    expect(screen.getByRole('tablist', { name: 'Categories d’emoticones' })).toBeTruthy();
    expect(pestanyes()).toEqual(['Del poble', 'Cares', 'Persones', 'Animals', 'Menjar', 'Activitats', 'Viatges', 'Objectes', 'Símbols', 'Banderes']);
    await espera();
    expect(carrega).toHaveBeenCalledTimes(1);
    const poble = screen.getByRole('tab', { name: 'Del poble' });
    expect(poble.getAttribute('aria-selected')).toBe('true');
    expect(poble.tabIndex).toBe(0);
    expect(screen.getByRole('tab', { name: 'Cares' }).tabIndex).toBe(-1);
    const panell = screen.getByRole('tabpanel');
    expect(poble.getAttribute('aria-controls')).toBe(panell.id);
    expect(panell.getAttribute('aria-labelledby')).toBe(poble.id);
  });

  test('«Del poble»: les cinc seccions del pla, amb títol i llista; sense recents, cap secció de recents', async () => {
    pinta();
    await espera();
    const titols = within(screen.getByRole('tabpanel')).getAllByRole('heading').map((h) => h.textContent);
    expect(titols).toEqual(['Cares i emocions', 'Gestos i cors', 'Horta, camp i menjar', 'Animals i natura', 'Poble, eines i festes']);
    expect(screen.getByRole('list', { name: 'Horta, camp i menjar' })).toBeTruthy();
    for (const nom of ['tomato', 'garlic', 'tractor', 'bell', 'folded hands']) expect(screen.getByRole('button', { name: nom })).toBeTruthy();
  });

  test('triar una emoticona la dona a qui munta el calaix (el glif i el nom)', async () => {
    const onTria = vi.fn();
    pinta({ onTria });
    await espera();
    fireEvent.click(screen.getByRole('button', { name: 'tractor' }));
    expect(onTria).toHaveBeenCalledTimes(1);
    expect(onTria).toHaveBeenCalledWith('🚜', 'tractor');
  });

  test('si qui munta el calaix no la posa (torna false: el límit), no va a les recents', async () => {
    const primer = pinta({ onTria: vi.fn(() => false) });
    await espera();
    fireEvent.click(screen.getByRole('button', { name: 'tractor' }));
    primer.unmount();
    pinta();
    await espera();
    expect(screen.queryByRole('list', { name: 'Recents' })).toBeNull();
  });

  test('una família pinta el seu títol i els seus botons; les emoticones que el navegador no reconeix no hi són', async () => {
    const onTria = vi.fn();
    pinta({ onTria });
    await espera();
    fireEvent.click(screen.getByRole('tab', { name: 'Cares' }));
    const panell = screen.getByRole('tabpanel');
    expect(panell.getAttribute('aria-labelledby')).toBe(screen.getByRole('tab', { name: 'Cares' }).id);
    expect(within(panell).getByRole('heading').textContent).toBe('Cares');
    expect(within(panell).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['grinning face']);
    // Una família on no en queda cap no porta pestanya.
    expect(screen.queryByRole('tab', { name: 'Res que es veja' })).toBeNull();
    fireEvent.click(within(panell).getByRole('button', { name: 'grinning face' }));
    expect(onTria).toHaveBeenCalledWith('😀', 'grinning face');
  });

  test('fletxes, Inici i Fi: mouen el focus i trien la pestanya (amb volta)', async () => {
    pinta();
    await espera();
    const poble = screen.getByRole('tab', { name: 'Del poble' });
    poble.focus();
    fireEvent.keyDown(poble, { key: 'ArrowRight' });
    const cares = screen.getByRole('tab', { name: 'Cares' });
    expect(document.activeElement).toBe(cares);
    expect(cares.getAttribute('aria-selected')).toBe('true');
    expect(cares.tabIndex).toBe(0);
    expect(poble.tabIndex).toBe(-1);
    fireEvent.keyDown(cares, { key: 'End' });
    expect(document.activeElement.getAttribute('aria-label')).toBe('Natura sintètica');
    expect(within(screen.getByRole('tabpanel')).getByRole('heading').textContent).toBe('Natura sintètica');
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(poble);
    fireEvent.keyDown(poble, { key: 'ArrowLeft' });
    expect(document.activeElement.getAttribute('aria-label')).toBe('Natura sintètica');
    fireEvent.keyDown(document.activeElement, { key: 'Home' });
    expect(document.activeElement).toBe(poble);
  });

  test('les recents: davant de «Del poble» la pròxima vegada, i no es reordenen davall del dit', async () => {
    const primer = pinta();
    await espera();
    fireEvent.click(screen.getByRole('button', { name: 'bell' }));
    expect(screen.queryByRole('list', { name: 'Recents' })).toBeNull();
    primer.unmount();

    pinta();
    await espera();
    const recents = () => within(screen.getByRole('list', { name: 'Recents' })).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(within(screen.getByRole('tabpanel')).getAllByRole('heading')[0].textContent).toBe('Recents');
    expect(recents()).toEqual(['bell']);
    fireEvent.click(screen.getByRole('button', { name: 'tomato' }));
    expect(recents()).toEqual(['bell']);
  });

  test('el nom de les pestanyes i de les seccions passa pel traductor', async () => {
    const angles = { 'section.xat.emoticones.poble': 'From the village', 'section.xat.emoticones.familia.cares': 'Faces', 'section.xat.emoticones.seccio.horta': 'Garden, fields and food' };
    pinta({ t: (clau, alternativa) => angles[clau] ?? alternativa });
    await waitFor(() => expect(pestanyes()).toEqual(['From the village', 'Faces', 'Menjar', 'Natura sintètica']));
    expect(screen.getByRole('list', { name: 'Garden, fields and food' })).toBeTruthy();
  });
});

describe('càrrega, error i tancament', () => {
  test('una família mentre arriba el catàleg diu que carrega; si falla, ho diu i es pot tornar a provar', async () => {
    let falla = true;
    const carrega = vi.fn(async () => {
      if (falla) throw new Error('xarxa');
      return { GRUPS_EMOJIS: GRUPS };
    });
    pinta({ carregaCataleg: carrega });
    fireEvent.click(screen.getByRole('tab', { name: 'Cares' }));
    expect(screen.getByRole('status').textContent).toBe('Carregant les emoticones…');
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('No s’han pogut carregar les emoticones.');
    // «Del poble» no depén del catàleg.
    fireEvent.click(screen.getByRole('tab', { name: 'Del poble' }));
    expect(screen.getByRole('button', { name: 'tomato' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Cares' }));
    falla = false;
    const reintenta = within(screen.getByRole('alert')).getByRole('button', { name: 'Torna-ho a provar' });
    reintenta.focus();
    fireEvent.click(reintenta);
    // El botó se’n va: el focus passa a la pestanya, que es queda.
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Cares' }));
    expect(await screen.findByRole('button', { name: 'grinning face' })).toBeTruthy();
    expect(carrega).toHaveBeenCalledTimes(2);
  });

  test('Escape crida onTanca i queda consumit', async () => {
    const onTanca = vi.fn();
    pinta({ onTanca });
    await espera();
    const tomaca = screen.getByRole('button', { name: 'tomato' });
    const esdeveniment = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    act(() => { tomaca.dispatchEvent(esdeveniment); });
    expect(onTanca).toHaveBeenCalledTimes(1);
    expect(esdeveniment.defaultPrevented).toBe(true);
  });

  test('enfocaEnObrir porta el focus a la pestanya activa; sense, el focus no es mou', async () => {
    const abans = document.createElement('button');
    document.body.appendChild(abans);
    abans.focus();
    const primer = pinta();
    await espera();
    expect(document.activeElement).toBe(abans);
    primer.unmount();
    pinta({ enfocaEnObrir: true });
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Del poble' }));
    await espera();
    abans.remove();
  });

  test('retenFocus: el mousedown als botons del calaix no es du el focus (ample); sense, sí', async () => {
    const primer = pinta({ retenFocus: true });
    await espera();
    expect(fireEvent.mouseDown(screen.getByRole('button', { name: 'tomato' }))).toBe(false);
    expect(fireEvent.mouseDown(screen.getByRole('tab', { name: 'Cares' }))).toBe(false);
    primer.unmount();
    pinta();
    await espera();
    expect(fireEvent.mouseDown(screen.getByRole('button', { name: 'tomato' }))).toBe(true);
  });

  test('amb el catàleg de veres: «Del poble» i les nou famílies, en l’ordre del Bloc', async () => {
    pinta({ carregaCataleg: undefined });
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(10), { timeout: 10000 });
    fireEvent.click(screen.getByRole('tab', { name: 'Banderes' }));
    expect(await screen.findByRole('button', { name: 'chequered flag' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'chequered flag' }).closest('ul').classList.contains('sdp-graella-emojis__graella--gran')).toBe(true);
  }, 20000);
});
