// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import * as port from './backendPort.js';
import {
  CAPACITATS, CONTRACTE_BACKEND, CONTRACTE_NUCLI, MISSATGES_MEMBRES_ORGANITZACIO, TIPUS_TRANSFERIBLES, destinatariaDeTransferencia
} from './contracte.js';

/* IDEA-24 (marató 261101_2143, B4) · La capacitat 'transferenciaPropietat':
   a banda (mai dins de 'membresOrganitzacio' ni del nucli), la regla
   d'entrada única, els tipus transferibles (els mateixos que la RPC) i el
   port, que no la pot cridar si el backend no la té. */
const SQL = readFileSync(path.join(process.cwd(), 'supabase/migrations/2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql'), 'utf8');
const nucli = () => Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => nom]));
const membres = () => Object.fromEntries(CAPACITATS.membresOrganitzacio.map((nom) => [nom, () => nom]));
const codiDe = (fn) => { try { fn(); } catch (error) { return error?.code ?? 'sense code'; } return 'no ha llançat'; };

afterEach(() => { port.setBackendImplementation(nucli()); });

test('capacitat atòmica d’un sol mètode, fora del nucli i de membresOrganitzacio, i una sola volta al contracte', () => {
  expect(CAPACITATS.transferenciaPropietat).toEqual(['transfereixPropietatOrganitzacio']);
  expect(Object.isFrozen(CAPACITATS.transferenciaPropietat)).toBe(true);
  expect(CAPACITATS.membresOrganitzacio).toEqual(['llistaMembresOrganitzacio', 'desaMembreOrganitzacio', 'llevaMembreOrganitzacio']);
  expect(CONTRACTE_NUCLI).not.toContain('transfereixPropietatOrganitzacio');
  expect(CONTRACTE_BACKEND.filter((nom) => nom === 'transfereixPropietatOrganitzacio')).toHaveLength(1);
  const capacitatsAmbElMetode = Object.entries(CAPACITATS).filter(([, noms]) => noms.includes('transfereixPropietatOrganitzacio')).map(([cap]) => cap);
  expect(capacitatsAmbElMetode).toEqual(['transferenciaPropietat']);
});

test('un backend amb els membres però sense la transferència continua sent vàlid i el port no la pot cridar', () => {
  port.setBackendImplementation({ ...nucli(), ...membres() });
  expect(port.teCapacitat('membresOrganitzacio')).toBe(true);
  expect(port.teCapacitat('transferenciaPropietat')).toBe(false);
  expect(() => port.transfereixPropietatOrganitzacio('o', { tipus: 'persona', id: 'p' })).toThrow('no està implementat');
});

test('amb la capacitat, el port delega els tres arguments tal qual i torna el que diu el backend', () => {
  const crides = [];
  const resposta = { organizationId: 'o', anticOwnerId: 'jo', nouOwnerId: 'p' };
  port.setBackendImplementation({ ...nucli(), transfereixPropietatOrganitzacio: (...args) => { crides.push(args); return resposta; } });
  expect(port.teCapacitat('transferenciaPropietat')).toBe(true);
  /* No porta 'membresOrganitzacio': cap dependència amagada entre les dues capacitats. */
  expect(port.teCapacitat('membresOrganitzacio')).toBe(false);
  const config = { dataMode: 'seed' };
  expect(port.transfereixPropietatOrganitzacio('o', { tipus: 'persona', id: 'p' }, config)).toBe(resposta);
  expect(crides).toEqual([['o', { tipus: 'persona', id: 'p' }, config]]);
});

test('TIPUS_TRANSFERIBLES són els de la RPC (R3 SQL-01): group i company, congelats', () => {
  expect(TIPUS_TRANSFERIBLES).toEqual(['group', 'company']);
  expect(Object.isFrozen(TIPUS_TRANSFERIBLES)).toBe(true);
  expect(SQL).toMatch(/if v_kind not in \('group','company'\) then/);
  // Ni l'entitat ni l'ajuntament: la seua titularitat només s'obté per reclamació revisada.
  expect(TIPUS_TRANSFERIBLES).not.toContain('entity');
  expect(TIPUS_TRANSFERIBLES).not.toContain('city_hall');
});

test('els codis que la RPC llança són tots de MISSATGES_MEMBRES_ORGANITZACIO', () => {
  const funcio = SQL.slice(SQL.indexOf('function public.transfereix_propietat_organitzacio'), SQL.indexOf('revoke all on function public.transfereix_propietat_organitzacio'));
  const codis = [...new Set([...funcio.matchAll(/SDP-ORGMEM-\d{3}/g)].map((m) => m[0]))].sort();
  expect(codis).toEqual(['SDP-ORGMEM-000', 'SDP-ORGMEM-001', 'SDP-ORGMEM-002', 'SDP-ORGMEM-003', 'SDP-ORGMEM-004', 'SDP-ORGMEM-006']);
  for (const codi of codis) expect(MISSATGES_MEMBRES_ORGANITZACIO[codi], codi).toBeTruthy();
});

test('destinatariaDeTransferencia: una persona amb id, normalitzada i sense rol; tota la resta, SDP-ORGMEM-001', () => {
  expect(destinatariaDeTransferencia({ tipus: ' persona ', id: ' p1 ', rol: 'owner' })).toEqual({ tipus: 'persona', id: 'p1' });
  for (const dades of [{ tipus: 'organitzacio', id: 'o1' }, { tipus: 'persona', id: '' }, { tipus: 'persona', id: '   ' }, { tipus: 'persona' },
    { tipus: 'ia', id: 'x' }, { id: 'p1' }, {}, null, undefined, 'p1', 42]) {
    expect(codiDe(() => destinatariaDeTransferencia(dades)), JSON.stringify(dades) ?? String(dades)).toBe('SDP-ORGMEM-001');
  }
});
