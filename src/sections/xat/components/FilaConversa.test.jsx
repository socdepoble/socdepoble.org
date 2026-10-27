/* T67 · Les files de la llista de Xats: la fila d'una comunitat es ressalta
   amb la mateixa regla que el filtre «No llegits», i l'avatar d'un canal és
   sempre el megàfon (captures 19.41.43, 19.42.54 i 19.43.00).
   Torn 260930 (T1) · Les marques i «Tu: » dels missatges propis, la pastilla
   grisa dels silenciats i el punt dels marcats a mà com a no llegits. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import FilaConversa, { AvatarFil, AvatarComunitat, FilaComunitat } from './FilaConversa.jsx';
import { ENTITAT_PILOT_ID } from '../../../data/identitatsSeed.js';
import { AJUDA_PER_CLAU } from '../../../data/xatsPerDefecte.js';
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

/* ─── Torn 260930 (T1): la fila del patró de missatgeria ─── */

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

/* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-1) · xat_fils_meus v5 diu el tipus de l'últim:
   una foto sense peu no és «Cap missatge.». */
test('l’últim és un adjunt sense peu: la previa diu el tipus, amb «Pep: » davant', () => {
  const grup = { id: 'g-8', tipus: 'grup', titol: 'Festes', ultimText: '', ultimTipus: 'imatge', ultimSeq: 3,
    altres: [{ id: 'pep', nom: 'Pep' }], ultimAutorId: 'pep' };
  const boto = fila(grup);
  expect(previa(boto).textContent).toBe('Pep: Foto adjunta');
  expect(boto.textContent).not.toContain('Cap missatge.');
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


test('la comunitat de Sóc de Poble sense imatge mostra el logo oficial, però un homònim no', () => {
  const fil = { id: 'comunitat-remota', tipus: 'comunitat', avatar_url: null, subjecte: { tipus: 'entitat', id: ENTITAT_PILOT_ID } };
  const { container, rerender } = render(<AvatarComunitat fil={fil} nom="Sóc de Poble" />);
  expect(container.querySelector('img')?.getAttribute('src')).toBe(AJUDA_PER_CLAU.socdepoble.avatar);
  expect(container.querySelector('.sdp-xat-avatar--quadrat')).toBeTruthy();
  rerender(<AvatarComunitat fil={{ ...fil, subjecte: { tipus: 'entitat', id: 'altra-entitat' } }} nom="Sóc de Poble" />);
  expect(container.querySelector('img')).toBeNull();
});

/* ═══ Ordre del Mestre (261026_2126; pla 261026_2130, P1-36) ═══════════════
   La targeta de conversa a 96px (2 × --sdp-touch) amb l'avatar gran de 76px,
   el nom i l'últim missatge a 4px, i la pulsació llarga que obri la selecció
   (`premuda`, de LlistaConverses). */

/** Les declaracions d'un selector exacte de modules.css (l'última guanya). */
const MODULS = llig('src/css/modules.css').replace(/\/\*[\s\S]*?\*\//g, '');
function regla(selector) {
  const net = (text) => text.replace(/\s+/g, ' ').trim();
  const eixida = {};
  for (const m of MODULS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!net(m[1]).split(',').map(net).includes(selector)) continue;
    for (const declaracio of m[2].split(';')) {
      const [prop, ...resta] = declaracio.split(':');
      if (prop?.trim()) eixida[net(prop)] = net(resta.join(':'));
    }
  }
  return eixida;
}

/** Els píxels d'un token de tokens.css: «Npx», «var(--x)» o «calc(N * var(--x))». */
function px(nom) {
  const [valor] = declaracions(nom);
  const calc = /^calc\((\d+) \* var\((--[\w-]+)\)\)$/.exec(valor);
  if (calc) return Number(calc[1]) * px(calc[2]);
  const alias = /^var\((--[\w-]+)\)$/.exec(valor);
  if (alias) return px(alias[1]);
  const pixels = /^(\d+)px$/.exec(valor);
  if (!pixels) throw new Error(`${nom}: «${valor}» no és cap mida en px`);
  return Number(pixels[1]);
}

/** Cada selector de modules.css, net i solt. */
const SELECTORS = [...MODULS.matchAll(/([^{}]+)\{[^{}]*\}/g)]
  .flatMap((m) => m[1].split(',').map((s) => s.replace(/\s+/g, ' ').trim()));

/** Un avatar (la cara, la quadrada d'una comunitat o la icona) fill directe de la fila. */
const AL_AVATAR_DE_LA_FILA = /\.sdp-xat-fila(?![\w-])\S*\s*>\s*\.(sdp-avatar|sdp-xat-apilat|sdp-xat-avatar-icona)(?![\w-])/;
const NO_SENZILLA = '.sdp-xat-fila:not(.sdp-xat-fila--senzilla)';

test('P1-36 · els tokens: la fila fa 2 × --sdp-touch (96px), l’avatar 76px dins de la reixeta de 4px, i el que no és cap conversa conserva 72px', () => {
  expect(declaracions('--sdp-xat-fila-mida')).toEqual(['calc(2 * var(--sdp-touch))']);
  expect(declaracions('--sdp-touch')).toEqual(['48px']);
  expect(px('--sdp-xat-fila-mida')).toBe(96);
  expect(declaracions('--sdp-xat-avatar-mida')).toEqual(['76px']);
  expect(px('--sdp-xat-avatar-mida') % 4).toBe(0);
  expect(declaracions('--sdp-xat-fila-senzilla-mida')).toEqual(['72px']);
});

test('P1-36 · la fila: 96px d’alt, l’avatar de 76px hi cap amb el coixí, el nom i el missatge a 4px; sense menú emergent ni selecció de text', () => {
  const fila = regla('.sdp-xat-fila');
  expect(fila).toMatchObject({
    'min-height': 'var(--sdp-xat-fila-mida)',
    padding: 'var(--sdp-space-2) var(--sdp-space-4)',
    'align-items': 'center'
  });
  expect(regla(NO_SENZILLA)).toMatchObject({
    '-webkit-touch-callout': 'none',
    '-webkit-user-select': 'none',
    'user-select': 'none'
  });
  /* El coixí de dalt i de baix més l'avatar caben en la fila: 8 + 76 + 8 = 92 ≤ 96. */
  const coixi = px(/^var\((--[\w-]+)\)/.exec(fila.padding)[1]);
  expect(2 * coixi + px('--sdp-xat-avatar-mida')).toBeLessThanOrEqual(px('--sdp-xat-fila-mida'));
  expect(regla('.sdp-xat-fila__cos')).toMatchObject({ display: 'grid', gap: 'var(--sdp-space-1)' });
  for (const selector of [`${NO_SENZILLA} > .sdp-avatar`, `${NO_SENZILLA} > .sdp-xat-apilat > .sdp-avatar`, `${NO_SENZILLA} > .sdp-xat-avatar-icona`]) {
    expect(regla(selector), selector).toMatchObject({ width: 'var(--sdp-xat-avatar-mida)', height: 'var(--sdp-xat-avatar-mida)' });
  }
  expect(regla(`${NO_SENZILLA} > .sdp-xat-avatar-icona > svg`)).toMatchObject({ width: 'var(--sdp-space-10)', height: 'var(--sdp-space-10)' });
  /* El «…» retirat no deixa regles òrfenes. */
  expect(MODULS).not.toMatch(/\.sdp-xat-mes\b|\.sdp-xat-menu-llista\b|\.sdp-xat-menu--esquerra\b|\.sdp-xat-especimen--menu\b/);
});

test('P1-36 · Llei del Píxel: les opcions dels Ajustos i les files senzilles (AssignacioEmoji, adjunts de VistaMultimedia) es queden com a HEAD, 72px i la icona de 48', () => {
  expect(px('--sdp-xat-fila-senzilla-mida')).toBe(72);
  expect(regla('.sdp-xat-opcio')['min-height']).toBe('var(--sdp-xat-fila-senzilla-mida)');
  expect(regla('.sdp-xat-fila--senzilla')['min-height']).toBe('var(--sdp-xat-fila-senzilla-mida)');
  /* A igual especificitat, la dels 72 guanya perquè va darrere de la de la fila. */
  expect(MODULS.search(/\.sdp-xat-fila--senzilla\s*\{/)).toBeGreaterThan(MODULS.search(/\.sdp-xat-fila,\s*\.sdp-xat-opcio\s*\{/));
  expect(regla('.sdp-xat-fila--senzilla')).not.toHaveProperty('user-select');
  expect(regla('.sdp-xat-fila')).not.toHaveProperty('user-select');
  /* Cap regla dels 76px no arriba a l'avatar d'una fila senzilla. */
  const alAvatar = SELECTORS.filter((s) => AL_AVATAR_DE_LA_FILA.test(s));
  expect(alAvatar.length).toBeGreaterThanOrEqual(6);
  for (const selector of alAvatar) expect(selector.startsWith(`${NO_SENZILLA} >`), selector).toBe(true);
  /* I la icona de la fila senzilla és la de sempre: --sdp-touch (48), i el dibuix, el seu atribut de 24. */
  expect(regla('.sdp-xat-avatar-icona')).toMatchObject({ width: 'var(--sdp-touch)', height: 'var(--sdp-touch)' });
  expect(regla('.sdp-assigna-emoji__actual')).toMatchObject({ 'inline-size': 'var(--sdp-touch)', 'block-size': 'var(--sdp-touch)' });
});

test('P1-36 · cada tipus de fila porta l’avatar com a fill directe del botó, on el cobrix la regla dels 76px', () => {
  const directa = mapejaFil({ id: 'd', tipus: 'directe', titol: 'Vicent', ultimText: 'Hola' });
  const grup = mapejaFil({ id: 'g', tipus: 'grup', titol: 'Penya' });
  const canal = mapejaFil({ id: 'k', tipus: 'canal', titol: 'Avisos' });
  const { container } = render(
    <ul>
      <li><FilaConversa fil={directa} onSelect={() => {}} t={t} /></li>
      <li><FilaConversa fil={grup} onSelect={() => {}} t={t} /></li>
      <li><FilaConversa fil={canal} onSelect={() => {}} t={t} /></li>
      <li><FilaComunitat comunitat={comunitat()} onObri={() => {}} t={t} /></li>
      <li><FilaConversa fil={directa} onSelect={() => {}} t={t} seleccio={{ triada: true, onAlterna: () => {} }} /></li>
    </ul>
  );
  const [persona, ambGrup, ambCanal, ambComunitat, enSeleccio] = container.querySelectorAll('button.sdp-xat-fila');
  /* Cap targeta de conversa és una fila senzilla (la dels 72px). */
  expect(container.querySelector('.sdp-xat-fila--senzilla')).toBeNull();
  expect(persona.querySelector(':scope > .sdp-avatar')).not.toBeNull();
  expect(ambGrup.querySelector(':scope > .sdp-xat-avatar-icona > svg.lucide-users')).not.toBeNull();
  expect(ambCanal.querySelector(':scope > .sdp-xat-avatar-icona > svg.lucide-megaphone')).not.toBeNull();
  expect(ambComunitat.querySelector(':scope > .sdp-xat-apilat > .sdp-avatar.sdp-xat-avatar--quadrat')).not.toBeNull();
  /* En selecció, el cercle va davant i l'avatar continua sent fill directe. */
  expect([...enSeleccio.children].map((n) => n.classList[0])).toEqual(['sdp-xat-fila__tria', 'sdp-avatar', 'sdp-xat-fila__cos']);
});

test('P1-36 · amb `premuda`: els gestors al botó, la drecera i la pista fora de la selecció, i un clic gastat no obri ni alterna', () => {
  const fil = mapejaFil({ id: 'd', tipus: 'directe', titol: 'Vicent', ultimText: 'Hola' });
  let gastat = true;
  const onPointerDown = () => {};
  const premuda = { handlers: { onPointerDown }, consumeix: () => { const era = gastat; gastat = false; return era; }, pista: 'pista-1' };
  const seleccions = [];
  const { rerender } = render(<FilaConversa fil={fil} onSelect={(id) => seleccions.push(id)} t={t} premuda={premuda} />);
  const boto = screen.getByRole('button', { name: /Vicent/ });
  expect(boto.getAttribute('aria-keyshortcuts')).toBe('Shift+F10');
  expect(boto.getAttribute('aria-describedby')).toBe('pista-1');
  boto.click();
  expect(seleccions).toEqual([]);
  boto.click();
  expect(seleccions).toEqual(['d']);

  const alternades = [];
  gastat = true;
  rerender(<FilaConversa fil={fil} onSelect={() => {}} t={t} premuda={{ ...premuda, pista: null }} seleccio={{ triada: false, onAlterna: () => alternades.push('d') }} />);
  const casella = screen.getByRole('checkbox', { name: /Vicent/ });
  expect(casella.hasAttribute('aria-keyshortcuts')).toBe(false);
  expect(casella.hasAttribute('aria-describedby')).toBe(false);
  casella.click();
  expect(alternades).toEqual([]);
  casella.click();
  expect(alternades).toEqual(['d']);

  /* Sense `premuda`, el botó de sempre. */
  rerender(<FilaConversa fil={fil} onSelect={() => {}} t={t} />);
  expect(screen.getByRole('button', { name: /Vicent/ }).hasAttribute('aria-keyshortcuts')).toBe(false);
});
