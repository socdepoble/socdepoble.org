// @vitest-environment node
import { expect, test } from 'vitest';
import { BARALLA_GESTORIA } from './baralla.js';
import { pendents } from './leitner.js';

const CAMPS = ['id', 'versio', 'titol', 'concepte', 'mnemotecnia', 'pregunta', 'resposta', 'explicacio'];
const perId = id => BARALLA_GESTORIA.targetes.find(t => t.id === id);

test('identitat, avís literal i entre 14 i 18 targetes congelades', () => {
  expect(BARALLA_GESTORIA).toMatchObject({ id: 'gestoria-autonoms', versio: '1.0.0' });
  expect(BARALLA_GESTORIA.avis).toBe('Contingut formatiu general; confirma-ho sempre amb la teua gestoria.');
  expect(BARALLA_GESTORIA.targetes.length).toBeGreaterThanOrEqual(14);
  expect(BARALLA_GESTORIA.targetes.length).toBeLessThanOrEqual(18);
  expect(Object.isFrozen(BARALLA_GESTORIA.targetes)).toBe(true);
  expect(BARALLA_GESTORIA.targetes.every(Object.isFrozen)).toBe(true);
});

test('cada targeta té tots els camps amb text i un id únic amb prefix de la baralla', () => {
  const ids = new Set();
  for (const t of BARALLA_GESTORIA.targetes) {
    for (const camp of CAMPS) expect(typeof t[camp] === 'string' && t[camp].trim().length > 0, `${t.id}.${camp}`).toBe(true);
    expect(t.id).toMatch(/^gestoria-[a-z0-9-]+$/);
    expect(t.versio).toMatch(/^\d+\.\d+\.\d+$/);
    ids.add(t.id);
  }
  expect(ids.size).toBe(BARALLA_GESTORIA.targetes.length);
});

test('les dades fixades pel contracte no s’han desviat', () => {
  expect(perId('gestoria-terminis-303-130').concepte).toMatch(/1 al 20 d’abril.*1 al 20 de juliol.*1 al 20 d’octubre.*1 al 30 de gener/);
  expect(perId('gestoria-model-130').resposta).toMatch(/20 %.*acumulat.*retencions/);
  expect(perId('gestoria-tipus-iva').concepte).toMatch(/21 %.*10 %.*4 %/);
  expect(perId('gestoria-inversio-subjecte-passiu').explicacio).toMatch(/349/);
  expect(perId('gestoria-roi-036').resposta).toMatch(/036/);
  expect(perId('gestoria-retencio-irpf').concepte).toMatch(/15 %.*7 %/);
  expect(perId('gestoria-conservacio-factures').concepte).toMatch(/quatre anys.*sis anys/);
  expect(perId('gestoria-lletra-entitat').concepte).toMatch(/A, societat anònima; B, societat limitada; F, cooperativa; G, associació o fundació/);
});

test('sense dades amb forma personal ni marques prohibides', () => {
  const text = JSON.stringify(BARALLA_GESTORIA);
  expect(text).not.toMatch(/\d{8}[A-Za-z]/);
  expect(text).not.toMatch(/[A-Z]{2}\d{2}\s?\d{4}/); // forma d'IBAN
  expect(text).not.toMatch(/@/);
  expect(text).not.toMatch(/#/);
});

test('la baralla és vàlida per al motor: sense progrés, totes són noves', () => {
  const llista = pendents([], BARALLA_GESTORIA, Date.UTC(2026, 9, 2, 8));
  expect(llista).toHaveLength(BARALLA_GESTORIA.targetes.length);
  expect(llista.every(p => p.nova && p.estat.caixa === 0)).toBe(true);
});
