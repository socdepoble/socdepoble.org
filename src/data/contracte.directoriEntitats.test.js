/**
 * Pla 261022_1955 (Cercador Universal, T1) · El directori públic de les
 * organitzacions al contracte: una capacitat opcional a banda, perquè un
 * amfitrió amb 'directori' i sense llistat continue sent vàlid.
 */
import { expect, test } from 'vitest';
import * as port from './backendPort.js';
import { CAPACITATS, CONTRACTE_BACKEND, CONTRACTE_NUCLI, LIMIT_DIRECTORI_ENTITATS } from './contracte.js';

const nucli = () => Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => nom]));

test('Pla 261022_1955 · directoriEntitats és una capacitat opcional d’un mètode, fora del nucli i de directori, i congelada', () => {
  expect(CAPACITATS.directoriEntitats).toEqual(['listPublicOrganizations']);
  expect(Object.isFrozen(CAPACITATS.directoriEntitats)).toBe(true);
  /* 'directori' no creix: la fitxa pública d'un amfitrió que ja la té continua oberta. */
  expect(CAPACITATS.directori).toEqual(['loadPerfilPublic']);
  expect(CONTRACTE_NUCLI).not.toContain('listPublicOrganizations');
  expect(CONTRACTE_NUCLI).toHaveLength(32);
  expect(CONTRACTE_BACKEND).toContain('listPublicOrganizations');
  expect(LIMIT_DIRECTORI_ENTITATS).toBe(500);
});

test('Pla 261022_1955 · un backend amb la fitxa pública i sense directori és vàlid, i també al revés', () => {
  expect(() => port.validaBackendImplementation({ ...nucli(), loadPerfilPublic: () => null })).not.toThrow();
  expect(() => port.validaBackendImplementation({ ...nucli(), listPublicOrganizations: () => [] })).not.toThrow();

  port.setBackendImplementation({ ...nucli(), loadPerfilPublic: () => null });
  expect(port.teCapacitat('directori')).toBe(true);
  expect(port.teCapacitat('directoriEntitats')).toBe(false);
  /* Sense la capacitat, el port llança abans de cap crida: qui busca pregunta abans amb teCapacitat. */
  expect(() => port.listPublicOrganizations({}, {})).toThrow('no està implementat');

  port.setBackendImplementation({ ...nucli(), listPublicOrganizations: (filtre) => [{ id: 'o', filtre }] });
  expect(port.teCapacitat('directoriEntitats')).toBe(true);
  expect(port.teCapacitat('directori')).toBe(false);
  expect(port.listPublicOrganizations({ limit: 3 }, {})).toEqual([{ id: 'o', filtre: { limit: 3 } }]);
});
