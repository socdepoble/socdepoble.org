import { expect, test } from 'vitest';
import {
  AUTOR_PER_DEFECTE, LLICENCIA_PER_DEFECTE, LLICENCIES, MARCA_CC0, MAXIM_AUTORIA,
  llicenciaDe, requereixCC0, reservatsDe, triaDe, valorDe,
} from './llicencies.js';
import { sanejaDrets } from '../../../data/dretsAutor.js';
import { LIMITS_TEXT, valorPerDesar } from '../../../sections/profile/perfilCamps.js';

test('el límit d’autoria al perfil és de 256 punts de codi', () => {
  expect(MAXIM_AUTORIA).toBe(256);
  expect(MAXIM_AUTORIA).toBe(LIMITS_TEXT.copyright[1]);
});

test('els codis que es desen són els de sempre (les set Creative Commons del selector vell)', () => {
  const codis = LLICENCIES.map((l) => l.codi).filter(Boolean).sort();
  expect(codis).toEqual(['CC BY 4.0', 'CC BY-NC 4.0', 'CC BY-NC-ND 4.0', 'CC BY-NC-SA 4.0', 'CC BY-ND 4.0', 'CC BY-SA 4.0', 'CC0 1.0'].sort());
});

test('cada opció del catàleg porta explicació, exemple de poble i permisos amb text', () => {
  for (const l of LLICENCIES) {
    expect(l.nom, l.id).toBeTruthy();
    expect(l.explicacio, l.id).toBeTruthy();
    expect(l.exemple, l.id).toBeTruthy();
    expect(l.permisos.length, l.id).toBeGreaterThan(0);
    for (const p of l.permisos) expect(p.text, l.id).toBeTruthy();
  }
  expect(Object.isFrozen(LLICENCIES)).toBe(true);
  expect(llicenciaDe('cc-by')?.codi).toBe('CC BY 4.0');
  expect(llicenciaDe('no-existix')).toBeNull();
});

test('triaDe i valorDe fan anada i tornada per a totes les llicències amb codi', () => {
  for (const l of LLICENCIES.filter((x) => x.codi)) {
    expect(triaDe(valorDe(l.id), 'Pep')).toEqual({ id: l.id, text: '' });
  }
});

test('el text lliure conserva 256 caràcters més la marca CC0', () => {
  const text = 'é'.repeat(255) + '😀';
  expect(triaDe('Fotos de la Iaia · CC0 1.0', 'Pep')).toEqual({ id: 'lliure', text: 'Fotos de la Iaia' });
  expect(valorDe('lliure', { text })).toBe(`${text}${MARCA_CC0}`);
  expect(valorDe('lliure', { text: text + 'x' })).toBe('');
});

/* D15 (ordre del Mestre, 260930) · «Tots els drets reservats» passa a dir-se
   «Copyright (C)» i porta text lliure: triaDe torna el valor com a text (abans
   el text era buit) i la tria del valor buit ja no és el copyright, sinó la
   Creative Commons de sèrie (prova de baix). */
test('«Copyright (C)» és «© autor» de sèrie (o «© Sóc de Poble» sense autor)', () => {
  expect(reservatsDe('Pep')).toBe('© Pep');
  expect(reservatsDe('  ')).toBe(`© ${AUTOR_PER_DEFECTE}`);
  expect(valorDe('reservats', { autor: 'Pep' })).toBe('© Pep');
  expect(triaDe('© Pep', 'Pep')).toEqual({ id: 'reservats', text: '© Pep' });
});

/* D15 · Un «© …» que no és de l'autor ja no és «actual»: és Copyright amb el
   seu text (la nota vella sense drets arriba com «© Sóc de Poble»). */
test('un valor desconegut preselecciona «actual», que es desa intacte', () => {
  expect(triaDe('Drets de l’Ajuntament', 'Pep')).toEqual({ id: 'actual', text: '' });
  expect(valorDe('actual', { actual: 'Drets de l’Ajuntament' })).toBe('Drets de l’Ajuntament');
});

/* ── D15 (ordre del Mestre, 260930) · CC per defecte i «Copyright (C)» ── */

test('D15 · la llicència de sèrie és CC BY-NC-SA 4.0 i és la PRIMERA opció del catàleg', () => {
  expect(LLICENCIA_PER_DEFECTE).toBe('CC BY-NC-SA 4.0');
  expect(LLICENCIES[0].codi).toBe(LLICENCIA_PER_DEFECTE);
  expect(LLICENCIES.filter((l) => l.codi === LLICENCIA_PER_DEFECTE)).toHaveLength(1);
});

test('D15 · l’ordre: la de sèrie, la resta de CC, CC0, el text lliure CC0 i «Copyright (C)» l’última', () => {
  expect(LLICENCIES.map((l) => l.id)).toEqual([
    'cc-by-nc-sa', 'cc-by-nc-nd', 'cc-by-nc', 'cc-by-nd', 'cc-by-sa', 'cc-by', 'cc0', 'lliure', 'reservats',
  ]);
  const ultima = LLICENCIES.at(-1);
  expect(ultima.id).toBe('reservats');
  expect(ultima.nom).toBe('Copyright (C)');
  expect(ultima.codi).toBeNull();
  // Es conserva «Text lliure personalitzat (CC0)».
  expect(llicenciaDe('lliure')?.nom).toBe('Text lliure personalitzat (CC0)');
});

test('D15 · sense valor, la tria és la Creative Commons de sèrie', () => {
  for (const buit of ['', '   ', null, undefined]) {
    const tria = triaDe(buit, 'Pep');
    expect(tria).toEqual({ id: 'cc-by-nc-sa', text: '' });
    expect(llicenciaDe(tria.id)?.codi).toBe(LLICENCIA_PER_DEFECTE);
  }
});

test('D15 · qualsevol valor que comença per «©» és «Copyright (C)» amb el valor com a text', () => {
  expect(triaDe('© Pepa')).toEqual({ id: 'reservats', text: '© Pepa' });
  expect(triaDe('© Sóc de Poble', 'Pep')).toEqual({ id: 'reservats', text: '© Sóc de Poble' });
  expect(triaDe('©2026 Cooperativa del Mas')).toEqual({ id: 'reservats', text: '©2026 Cooperativa del Mas' });
  // Anada i tornada: el text es desa tal qual.
  expect(valorDe('reservats', { text: triaDe('© Pepa').text })).toBe('© Pepa');
  // El text lliure CC0 que comença per «©» continua sent CC0 (mana la marca).
  expect(triaDe('© Pepa · CC0 1.0').id).toBe('lliure');
});

test('cada llicència desa i torna a llegir una autoria de 256 caràcters', () => {
  const text = 'é'.repeat(255) + '😀';
  for (const { id } of LLICENCIES) {
    const valor = valorDe(id, { text });
    expect(valor, id).toContain(text);
    expect(sanejaDrets(valor)).toBe(valor);
    expect(valorPerDesar('organitzacio', 'copyright', valor)).toEqual({ columna: 'copyright', valor });
    expect(triaDe(valor)).toEqual({ id, text: id === 'reservats' ? `© ${text}` : text });
    expect(valorDe(id, { text: text + 'x' }), id).toBe('');
  }
});

test('l’autoria manté els noms sencers i les marques literals sense canviar la llicència', () => {
  const lliureAntic = 'CC BY 4.0 crèdits del llibre · CC0 1.0';
  expect(triaDe(lliureAntic)).toEqual({ id: 'lliure', text: 'CC BY 4.0 crèdits del llibre' });
  const text = 'Pepa Soler i fills · CC0 1.0';
  for (const id of ['cc-by', 'reservats']) {
    const valor = valorDe(id, { text });
    expect(triaDe(valor).id).toBe(id);
    expect(valorDe(id, { text: triaDe(valor).text })).toBe(valor);
  }
  expect(valorDe('reservats', { text: '  © Pepa Soler  ' })).toBe('© Pepa Soler');
  expect(valorDe('reservats', { text: '© ' })).toBe('');
});

test('el sanejament és de text pla i elimina controls sense coaccionar objectes', () => {
  expect(valorDe('cc-by', { text: '  Pepa\u0007 & Mei\u{202E}\nSoler i fills  ' })).toBe('CC BY 4.0 Pepa & Mei Soler i fills');
  expect(valorDe('cc-by', { text: { toString() { throw new Error('no'); } } })).toBe('CC BY 4.0');
  expect(valorPerDesar('organitzacio', 'copyright', 'CC BY 4.0 Pepa <P> & fills').valor).toBe('CC BY 4.0 Pepa <P> & fills');
  expect(() => sanejaDrets(`CC BY 4.0 ${'x'.repeat(257)}`, { estricte: true })).toThrow(/256/);
});

/* Auditoria R18 (P2) · Després de «©» només es lleva l'espai ASCII, com el
   ltrim() del CHECK de 2611110010: un NBSP o un U+3000 compten com a autoria. */
test('després de «©», l’NBSP i l’espai ideogràfic compten com el CHECK', () => {
  for (const espai of ['\u{A0}', '\u{3000}']) {
    const cap = `©${espai}${'x'.repeat(MAXIM_AUTORIA - 1)}`;
    expect(valorDe('reservats', { text: cap }), JSON.stringify(espai)).toBe(cap);
    expect(sanejaDrets(cap, { estricte: true })).toBe(cap);
    const llarg = `©${espai}${'x'.repeat(MAXIM_AUTORIA)}`;
    expect(valorDe('reservats', { text: llarg }), JSON.stringify(espai)).toBe('');
    expect(() => sanejaDrets(llarg, { estricte: true })).toThrow(/256/);
    expect(() => valorPerDesar('organitzacio', 'copyright', llarg)).toThrow();
  }
  // L'espai ASCII sí que es lleva: «© » + 256 cap.
  expect(sanejaDrets(`© ${'x'.repeat(MAXIM_AUTORIA)}`, { estricte: true })).toBe(`© ${'x'.repeat(MAXIM_AUTORIA)}`);
  // Auditoria R18 (P2) · El perfil també valida el total amb la marca (≤ 274), com el CHECK.
  expect(() => valorPerDesar('organitzacio', 'copyright', `©${' '.repeat(30)}${'x'.repeat(MAXIM_AUTORIA)}`)).toThrow();
});

test('CC0 i el text lliure requerixen acceptació; les altres opcions, no', () => {
  expect(LLICENCIES.filter(({ id }) => requereixCC0(id)).map(({ id }) => id)).toEqual(['cc0', 'lliure']);
});
