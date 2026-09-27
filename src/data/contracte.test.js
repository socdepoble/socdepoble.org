import { expect, test } from 'vitest';
import * as port from './backendPort.js';
import { CAPACITATS, CONTRACTE_BACKEND, CONTRACTE_NUCLI } from './contracte.js';
/* L'adaptador Supabase sencer es valida a supabase/index.test.js: E1 de
   tractor-enxufe no deixa importar-lo des d'ací, tampoc en una prova. */

/* Les funcions pròpies del port, que no deleguen cap mètode del backend. */
const INFRAESTRUCTURA = ['setBackendImplementation', 'validaBackendImplementation', 'getBackendImplementation',
  'freezeImplementation', 'destroy', 'teCapacitat'];
const nucli = () => Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => nom]));
const capacitat = (cap, quants = CAPACITATS[cap].length) =>
  Object.fromEntries(CAPACITATS[cap].slice(0, quants).map((nom) => [nom, () => nom]));

/* E2 de tractor-enxufe, però en temps d'execució i en els dos sentits. */
test('el port delega exactament el contracte: ni un mètode de més ni un de menys', () => {
  for (const nom of CONTRACTE_BACKEND) expect(typeof port[nom], nom).toBe('function');
  const delegats = Object.keys(port).filter((nom) => !INFRAESTRUCTURA.includes(nom)).sort();
  expect(delegats).toEqual([...CONTRACTE_BACKEND].sort());
});

test('les capacitats compte i consentiment són les del contracte d’interfícies', () => {
  expect(CAPACITATS.compte).toEqual(['exportaLesMeuesDades', 'estatBaixa', 'demanaBaixa', 'cancelaBaixa']);
  expect(CAPACITATS.consentiment).toEqual(['estatConsentiment', 'registraConsentiment', 'revocaConsentiment']);
  expect(Object.isFrozen(CAPACITATS.compte) && Object.isFrozen(CAPACITATS.consentiment)).toBe(true);
  for (const nom of [...CAPACITATS.compte, ...CAPACITATS.consentiment]) expect(CONTRACTE_NUCLI).not.toContain(nom);
});

test('una capacitat compte a mitges para la validació', () => {
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('compte', 3) }))
    .toThrow('Capacitat parcial: compte');
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('consentiment', 2) }))
    .toThrow('Capacitat parcial: consentiment');
});

test('cicleNotes és una capacitat opcional de dos mètodes, fora del nucli', () => {
  expect(CAPACITATS.cicleNotes).toEqual(['mouNota', 'esborraNota']);
  expect(Object.isFrozen(CAPACITATS.cicleNotes)).toBe(true);
  for (const nom of CAPACITATS.cicleNotes) expect(CONTRACTE_NUCLI).not.toContain(nom);
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('cicleNotes', 1) }))
    .toThrow('Capacitat parcial: cicleNotes');
});

test('un backend injectat sense cicleNotes continua sent vàlid i no pot esborrar', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('cicleNotes')).toBe(false);
  expect(() => port.esborraNota('n', 0)).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('cicleNotes') });
  expect(port.teCapacitat('cicleNotes')).toBe(true);
  expect(port.mouNota('n', 'paperera', 0)).toBe('mouNota');
});

test('un node amb el nucli sol continua sent vàlid, sense compte ni consentiment', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('compte')).toBe(false);
  expect(port.teCapacitat('consentiment')).toBe(false);
  expect(() => port.exportaLesMeuesDades()).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('compte'), ...capacitat('consentiment') });
  expect(port.teCapacitat('compte')).toBe(true);
  expect(port.teCapacitat('consentiment')).toBe(true);
});
