/* T67 · Les files de la llista de Xats: la fila d'una comunitat es ressalta
   amb la mateixa regla que el filtre «No llegits», i l'avatar d'un canal és
   sempre el megàfon (captures 19.41.43, 19.42.54 i 19.43.00).
   Torn 260930 (T1) · Les marques i «Tu: » dels missatges propis, la pastilla
   grisa dels silenciats i el punt dels marcats a mà com a no llegits. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import FilaConversa, { AvatarFil, FilaComunitat } from './FilaConversa.jsx';
import { agrupaComunitats, mapejaFil } from '../missatges.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

function comunitat({ noLlegitManual = false } = {}) {
  const fils = [
    { id: 'c-1', tipus: 'comunitat', titol: 'Almàssera' },
    { id: 'a-1', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-1', ultimSeq: 0, llegitFinsSeq: 0 },
    { id: 'g-1', tipus: 'grup', titol: 'General', comunitatId: 'c-1', ultimSeq: 0, llegitFinsSeq: 0, noLlegitManual }
  ].map((f) => mapejaFil(f));
  return agrupaComunitats(fils)[0];
}

test('un fill marcat a mà com a no llegit ressalta la comunitat, com al filtre «No llegits»', () => {
  const { rerender } = render(<FilaComunitat comunitat={comunitat()} onObri={() => {}} t={t} />);
  const fila = screen.getByRole('button', { name: /Almàssera/ });
  expect(fila.classList.contains('sdp-xat-fila--nova')).toBe(false);

  rerender(<FilaComunitat comunitat={comunitat({ noLlegitManual: true })} onObri={() => {}} t={t} />);
  expect(screen.getByRole('button', { name: /Almàssera/ }).classList.contains('sdp-xat-fila--nova')).toBe(true);
});

test('el canal porta sempre el megàfon, amb imatge o sense; el grup, la seua imatge si en té', () => {
  const canal = mapejaFil({ id: 'a-1', tipus: 'canal', titol: 'Avisos', imatgeUrl: '/logo.svg' });
  const { container, rerender } = render(<AvatarFil fil={canal} nom="Avisos" />);
  expect(container.querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();

  rerender(<AvatarFil fil={canal} nom="Avisos" mida="sm" />);
  expect(container.querySelector('.sdp-xat-avatar-icona--sm svg.lucide-megaphone')).toBeTruthy();

  const grup = mapejaFil({ id: 'g-2', tipus: 'grup', titol: 'Festes' });
  rerender(<AvatarFil fil={grup} nom="Festes" />);
  expect(container.querySelector('svg.lucide-users')).toBeTruthy();
});

test('la fila d’un canal amb imatge també porta el megàfon i ho diu en text', () => {
  const canal = mapejaFil({ id: 'a-1', tipus: 'canal', titol: 'Avisos', imatgeUrl: '/logo.svg', ultimText: 'Benvinguts' });
  render(<FilaConversa fil={canal} onSelect={() => {}} t={t} locale="ca-ES" />);
  const fila = screen.getByRole('button', { name: /Avisos/ });
  expect(fila.querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(fila.querySelector('img')).toBeNull();
  expect(fila.textContent).toContain("Canal d'avisos");
});

/* ─── Torn 260930 (T1): la fila calcada de WhatsApp Desktop ─── */

const fila = (dades, joId = 'jo') => {
  render(<FilaConversa fil={mapejaFil(dades)} onSelect={() => {}} t={t} locale="ca-ES" joId={joId} />);
  return screen.getByRole('button');
};
const previa = (boto) => boto.querySelector('.sdp-xat-fila__previa');

/* Sense «entregat»: el rebut que dona el port és el propi, no el dels altres
   (missatges.js, derivaEstat; ronda C3). Amb rebutFinsSeq, la fila continua
   dient «Enviat»: pintar dos marques grises seria mentir. */
test('directa amb l’últim missatge meu: les marques de l’estat davant del text i cap «Tu: »', () => {
  const base = { id: 'd-1', tipus: 'directe', titol: 'Vicent', ultimText: 'Perfecte', ultimAutorId: 'jo', ultimSeq: 5 };
  const casos = [
    [{}, 'sdp-xat-marques--enviat', 'Enviat'],
    [{ rebutFinsSeq: 5 }, 'sdp-xat-marques--enviat', 'Enviat'],
    [{ llegitPelsAltresFinsSeq: 5 }, 'sdp-xat-marques--llegit', 'Llegit']
  ];
  for (const [extra, classe, text] of casos) {
    const boto = fila({ ...base, ...extra });
    const marques = previa(boto).querySelector('.sdp-xat-marques');
    expect([...marques.classList]).toContain(classe);
    /* Les marques obrin la previsualització: van abans del text. */
    expect(previa(boto).firstElementChild).toBe(marques);
    expect(within(marques).getByText(text)).toBeTruthy();
    expect(within(boto).getByText('Perfecte')).toBe(previa(boto));
    expect(previa(boto).textContent).not.toContain('Tu:');
    cleanup();
  }
});

test('grup amb l’últim missatge meu: marques i «Tu: »; d’una altra persona: «Nom: » sense marques', () => {
  const grup = { id: 'g-9', tipus: 'grup', titol: 'Festes', ultimText: 'Porte la furgoneta.', ultimSeq: 2,
    altres: [{ id: 'pep', nom: 'Pep' }], llegitPelsAltresFinsSeq: 2 };
  let boto = fila({ ...grup, ultimAutorId: 'jo' });
  expect(within(boto).getByText('Tu: Porte la furgoneta.')).toBe(previa(boto));
  expect(previa(boto).querySelector('.sdp-xat-marques--llegit')).not.toBeNull();
  /* El nom accessible separa l'estat de «Tu:». */
  expect(boto.textContent).toContain('Llegit Tu: Porte la furgoneta.');
  cleanup();

  boto = fila({ ...grup, ultimAutorId: 'pep' });
  expect(within(boto).getByText('Pep: Porte la furgoneta.')).toBe(previa(boto));
  expect(previa(boto).querySelector('.sdp-xat-marques')).toBeNull();
  cleanup();

  /* Sense joId no se sap de qui és: ni marques ni «Tu: ». */
  boto = fila({ ...grup, ultimAutorId: 'jo' }, null);
  expect(previa(boto).querySelector('.sdp-xat-marques')).toBeNull();
  expect(previa(boto).textContent).toBe('Porte la furgoneta.');
});

test('un canal amb l’últim missatge meu també porta «Tu: »', () => {
  const boto = fila({ id: 'k-1', tipus: 'canal', titol: 'Avisos', rol: 'admin', ultimText: 'Tall d’aigua.', ultimAutorId: 'jo', ultimSeq: 1 });
  expect(within(boto).getByText('Tu: Tall d’aigua.')).toBe(previa(boto));
  expect(previa(boto).querySelector('.sdp-xat-marques--enviat')).not.toBeNull();
});

test('silenciat amb no llegits: la pastilla és grisa i l’hora no es ressalta', () => {
  const dades = { id: 'g-2', tipus: 'grup', titol: 'Banda', ultimText: 'Assaig', ultimAl: new Date().toISOString(), noLlegits: 3 };
  let boto = fila(dades);
  expect(boto.classList.contains('sdp-xat-fila--nova')).toBe(true);
  expect(boto.querySelector('.sdp-xat-pastilla').classList.contains('sdp-xat-pastilla--silenciada')).toBe(false);
  cleanup();

  const enAvant = new Date(Date.now() + 3600e3).toISOString();
  boto = fila({ ...dades, silenciatFinsAl: enAvant });
  expect(boto.classList.contains('sdp-xat-fila--nova')).toBe(false);
  const pastilla = boto.querySelector('.sdp-xat-pastilla');
  expect(pastilla.classList.contains('sdp-xat-pastilla--silenciada')).toBe(true);
  expect(pastilla.classList.contains('sdp-xat-pastilla--punt')).toBe(false);
  expect(within(pastilla).getByText('3 missatges no llegits')).toBeTruthy();
  expect(within(boto).getByText('Silenciada')).toBeTruthy();
});

test('marcada a mà com a no llegida i sense recompte: el punt amb el seu text; amb recompte, el número', () => {
  const dades = { id: 'd-2', tipus: 'directe', titol: 'Teresa', ultimText: 'Bon dia', noLlegits: 0, noLlegitManual: true };
  let boto = fila(dades);
  let pastilla = boto.querySelector('.sdp-xat-pastilla');
  expect(pastilla.classList.contains('sdp-xat-pastilla--punt')).toBe(true);
  expect(pastilla.textContent).toBe('Marcada com a no llegida');
  expect(pastilla.querySelector('[aria-hidden="true"]')).toBeNull();
  expect(boto.classList.contains('sdp-xat-fila--nova')).toBe(true);
  cleanup();

  boto = fila({ ...dades, noLlegits: 2 });
  pastilla = boto.querySelector('.sdp-xat-pastilla');
  expect(pastilla.classList.contains('sdp-xat-pastilla--punt')).toBe(false);
  expect(within(pastilla).getByText('2')).toBeTruthy();
  cleanup();

  /* Silenciada i marcada: el punt gris, i l'hora tampoc es ressalta. */
  boto = fila({ ...dades, silenciatFinsAl: new Date(Date.now() + 3600e3).toISOString() });
  pastilla = boto.querySelector('.sdp-xat-pastilla');
  expect([...pastilla.classList]).toEqual(['sdp-xat-pastilla', 'sdp-xat-pastilla--punt', 'sdp-xat-pastilla--silenciada']);
  expect(boto.classList.contains('sdp-xat-fila--nova')).toBe(false);
  cleanup();

  /* Sense marca ni recompte, cap pastilla. */
  boto = fila({ ...dades, noLlegitManual: false });
  expect(boto.querySelector('.sdp-xat-pastilla')).toBeNull();
});

test('la comunitat no porta ni el punt ni la pastilla grisa', () => {
  render(<FilaComunitat comunitat={comunitat({ noLlegitManual: true })} onObri={() => {}} t={t} />);
  expect(screen.getByRole('button', { name: /Almàssera/ }).querySelector('.sdp-xat-pastilla')).toBeNull();
});

/* jsdom no pinta: es comproven les regles i el contrast WCAG dels tokens
   (els hex de tokens.css, primer el tema clar i després el fosc). */
const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const TOKENS = llig('src/css/tokens.css');
const declaracions = (nom) => [...TOKENS.matchAll(new RegExp(`${nom}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim());
function hexDe(valor) {
  let v = valor;
  for (let i = 0; i < 6 && v.startsWith('var('); i += 1) v = declaracions(v.slice(4, -1).trim())[0];
  return v;
}
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [clar, fosc] = [lum(hexDe(a)), lum(hexDe(b))].sort((x, y) => y - x);
  return (clar + 0.05) / (fosc + 0.05);
}

test('la pastilla grisa passa AA i el punt gris fa 3:1 sobre la fila, en clar i en fosc', () => {
  const css = llig('src/css/modules.css').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(css).toMatch(/\.sdp-xat-pastilla--silenciada\s*\{\s*background:\s*var\(--sdp-fons-subtil\);\s*color:\s*var\(--sdp-text-cos\);\s*\}/);
  expect(css).toMatch(/\.sdp-xat-pastilla--punt\.sdp-xat-pastilla--silenciada\s*\{\s*background:\s*var\(--sdp-vora-control\);\s*\}/);
  const [subtil, cos, vora, targeta] = ['--sdp-fons-subtil', '--sdp-text-cos', '--sdp-vora-control', '--sdp-fons-targeta'].map(declaracions);
  for (const tema of [0, 1]) {
    expect(contrast(cos[tema], subtil[tema])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(vora[tema], targeta[tema])).toBeGreaterThanOrEqual(3);
    /* El hover de la fila és --sdp-fons-subtil. */
    expect(contrast(vora[tema], subtil[tema])).toBeGreaterThanOrEqual(3);
  }
});
