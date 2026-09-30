import { expect, test } from 'vitest';
import {
  AUTOR_PER_DEFECTE, LLICENCIA_PER_DEFECTE, LLICENCIES, MARCA_CC0, MAXIM_COPYRIGHT, MAXIM_TEXT_LLIURE,
  copyrightBuit, copyrightDe, llargariaDe, llicenciaDe, maximTextCopyright, requereixCC0, reservatsDe,
  tallaTextCopyright, triaDe, valorDe,
} from './llicencies.js';
import { LIMITS_TEXT } from '../../../sections/profile/perfilCamps.js';

/* T39 (ordre del Mestre, 260928) · el catàleg didàctic dels drets d'autor. */

test('el límit és el del CHECK de la columna: 246 de text + 10 de marca = 256', () => {
  expect(MARCA_CC0).toBe(' · CC0 1.0');
  expect(MARCA_CC0.length).toBe(10);
  expect(MAXIM_TEXT_LLIURE).toBe(246);
  expect(MAXIM_TEXT_LLIURE + MARCA_CC0.length).toBe(MAXIM_COPYRIGHT);
  expect(MAXIM_COPYRIGHT).toBe(LIMITS_TEXT.copyright[1]);
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

test('text lliure: la marca CC0 s’afig en desar i es lleva en llegir; el text es talla a 246', () => {
  expect(triaDe('Fotos de la Iaia · CC0 1.0', 'Pep')).toEqual({ id: 'lliure', text: 'Fotos de la Iaia' });
  expect(valorDe('lliure', { text: 'Fotos de la Iaia' })).toBe('Fotos de la Iaia · CC0 1.0');
  expect(valorDe('lliure', { text: 'a'.repeat(300) })).toBe(`${'a'.repeat(246)} · CC0 1.0`);
  expect(valorDe('lliure', { text: 'a'.repeat(300) })).toHaveLength(256);
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

test('D15 · el valor de «Copyright (C)» comença per «©» i no passa de 256 en total', () => {
  const llarg = valorDe('reservats', { text: 'x'.repeat(300) });
  expect(llarg).toHaveLength(MAXIM_COPYRIGHT);
  expect(llarg.startsWith('©')).toBe(true);
  expect(llarg).toBe(`© ${'x'.repeat(254)}`);
  expect(valorDe('reservats', { text: `© ${'y'.repeat(300)}` })).toHaveLength(256);
  expect(valorDe('reservats', { text: 'Pepa Soler' })).toBe('© Pepa Soler');
  expect(valorDe('reservats', { text: '  © Pepa Soler  ' })).toBe('© Pepa Soler');
  expect(copyrightDe('Pepa')).toBe('© Pepa');
  expect(copyrightDe('   ')).toBe('');
});

/* F4 (revisió adversarial T1–T4, 260930) · El valor es talla per punts de codi,
   com el CHECK char_length de la columna i com netejaCampOrigen: un emoji és un
   caràcter i mai queda partit en un surrogate orfe. */
const SURROGATE_ORFE = /[\uD800-\uDFFF]/u;
const EMOJI = '😀';

test('F4 · copyrightDe talla per punts de codi: l’emoji de la frontera no queda partit', () => {
  // 253 lletres + 😀 + «© » = 256 caràcters de veres (257 unitats UTF-16): hi cap sencer.
  const text = `${'a'.repeat(253)}${EMOJI}`;
  const desat = copyrightDe(text);
  expect(desat).toBe(`© ${text}`);
  expect(llargariaDe(desat)).toBe(MAXIM_COPYRIGHT);
  expect(desat).not.toMatch(SURROGATE_ORFE);
  // Un caràcter més: l'emoji ix sencer, no la meitat.
  expect(copyrightDe(`${'a'.repeat(254)}${EMOJI}`)).toBe(`© ${'a'.repeat(254)}`);
  // El text de sèrie «© autor» també.
  expect(reservatsDe(text)).toBe(`© ${text}`);
  expect(reservatsDe(text)).not.toMatch(SURROGATE_ORFE);
  expect(llargariaDe(EMOJI)).toBe(1);
});

test('F4 · el camp de «Copyright (C)» admet 254 caràcters sense «©» i 256 amb «©»: el que hi queda és el que es desa', () => {
  expect(maximTextCopyright('Pepa')).toBe(MAXIM_COPYRIGHT - 2);
  expect(maximTextCopyright('')).toBe(MAXIM_COPYRIGHT - 2);
  expect(maximTextCopyright('© Pepa')).toBe(MAXIM_COPYRIGHT);
  // Els espais del davant no es desen (copyrightDe els lleva): no ocupen lloc.
  expect(maximTextCopyright('  ©Pepa')).toBe(MAXIM_COPYRIGHT + 2);
  expect(maximTextCopyright(' Pepa')).toBe(MAXIM_COPYRIGHT - 1);

  const sense = tallaTextCopyright('x'.repeat(256));
  expect(sense).toBe('x'.repeat(254));
  expect(copyrightDe(sense)).toBe(`© ${sense}`);
  const amb = tallaTextCopyright(`© ${'x'.repeat(300)}`);
  expect(amb).toBe(`© ${'x'.repeat(254)}`);
  expect(copyrightDe(amb)).toBe(amb);
  // Emoji a la frontera del camp: sencer o fora, mai partit.
  expect(tallaTextCopyright(`${'a'.repeat(253)}${EMOJI}`)).toBe(`${'a'.repeat(253)}${EMOJI}`);
  expect(tallaTextCopyright(`${'a'.repeat(254)}${EMOJI}`)).toBe('a'.repeat(254));
  // Per a qualsevol text tallat, copyrightDe no en perd res (només els espais dels extrems).
  for (const t of ['x'.repeat(400), `© ${'y'.repeat(400)}`, `  ${'z'.repeat(400)}`, `${EMOJI.repeat(300)}`, `©${EMOJI.repeat(300)}`]) {
    const net = tallaTextCopyright(t).trim();
    expect(copyrightDe(tallaTextCopyright(t)), Array.from(t).slice(0, 4).join('')).toBe(net.startsWith('©') ? net : `© ${net}`);
    expect(tallaTextCopyright(tallaTextCopyright(t))).toBe(tallaTextCopyright(t));
  }
});

test('D15 · un «Copyright (C)» sense ningú darrere de la «©» és buit', () => {
  for (const buit of ['', '   ', '©', '©  ', ' © ']) expect(copyrightBuit(buit), JSON.stringify(buit)).toBe(true);
  for (const ple of ['© Pepa', 'Pepa', '©Pepa']) expect(copyrightBuit(ple), ple).toBe(false);
});

test('CC0 i el text lliure demanen l’acceptació; la resta, no', () => {
  expect(requereixCC0('cc0')).toBe(true);
  expect(requereixCC0('lliure')).toBe(true);
  expect(requereixCC0('cc-by')).toBe(false);
  expect(requereixCC0('reservats')).toBe(false);
  expect(requereixCC0('actual')).toBe(false);
});
