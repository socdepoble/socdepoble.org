import { expect, test } from 'vitest';
import {
  ESTATS_ADMINISTRACIO, dataCurta, esErrorDeXarxa, estatDeLAdministracio, textDeLaLectura, textDeLError
} from './estatAdministracio.js';

/* T43 (ordre del Mestre, 260928) · en quin punt està qui vol administrar. */

const base = { teSessio: true, disponible: true };
const err = (code) => Object.assign(new Error('Supabase 409: text cru del servidor'), { code });

test.each([
  [{ teSessio: false }, 'sense-sessio'],
  [{ ...base, membership: { role: 'owner' } }, 'administres'],
  [{ ...base, membership: { role: 'admin' }, reclamacio: { estat: 'pendent' } }, 'administres'],
  /* Sense la capacitat, qui ja l'administra ho continua veient. */
  [{ teSessio: true, disponible: false, membership: { role: 'admin' } }, 'administres'],
  [{ ...base, reclamacio: { estat: 'aprovada' } }, 'activant'],
  [{ teSessio: true, disponible: false }, 'no-disponible'],
  [{ ...base, error: err('NO-DISPONIBLE') }, 'no-disponible'],
  [{ ...base, reclamacio: { estat: 'pendent' } }, 'pendent'],
  [{ ...base, reclamacio: { estat: 'rebutjada' }, error: err('JA-PENDENT') }, 'pendent'],
  [{ ...base, error: err('SDP-CLAIM-003') }, 'te-propietaria'],
  [{ ...base, error: err('SDP-CLAIM-002') }, 'no-del-poble'],
  [{ ...base, membership: { role: 'member' } }, 'membre'],
  [{ ...base, reclamacio: { estat: 'rebutjada' } }, 'rebutjada'],
  [base, 'pot-connectar'],
  [{ ...base, error: err('ALTRE') }, 'pot-connectar']
])('%o → %s', (entrada, esperat) => {
  expect(estatDeLAdministracio(entrada)).toBe(esperat);
});

test('els errors es diuen en valencià i mai amb el text cru; els que ja són estat no es repetixen', () => {
  for (const code of ['NO-DISPONIBLE', 'JA-PENDENT', 'SDP-CLAIM-003', 'SDP-CLAIM-002']) expect(textDeLError(err(code))).toBeNull();
  expect(textDeLError(err('SDP-CLAIM-001'))).toBe('Esta organització no existix en este poble.');
  expect(textDeLError(err('SDP-CLAIM-000'))).toContain('Torna a entrar');
  const generic = textDeLError(err(undefined));
  expect(generic).toContain('No s’ha pogut enviar la petició');
  expect(generic).not.toContain('Supabase');
  expect(textDeLError(null)).toBeNull();
});

/* T43b-1 · una reclamació d'una altra organització no compta. */
test('una reclamació d’una altra organització s’ignora; la pròpia (o sense orgId) sí', () => {
  const pendentAltra = { organitzacioId: 'o-2', estat: 'pendent' };
  expect(estatDeLAdministracio({ ...base, orgId: 'o-1', reclamacio: pendentAltra })).toBe('pot-connectar');
  expect(estatDeLAdministracio({ ...base, orgId: 'o-1', reclamacio: { organitzacioId: 'o-2', estat: 'aprovada' } })).toBe('pot-connectar');
  expect(estatDeLAdministracio({ ...base, orgId: 'o-1', reclamacio: { organitzacioId: 'o-2', estat: 'rebutjada' } })).toBe('pot-connectar');
  expect(estatDeLAdministracio({ ...base, orgId: 'o-1', reclamacio: { organitzacioId: 'o-1', estat: 'pendent' } })).toBe('pendent');
  expect(estatDeLAdministracio({ ...base, reclamacio: pendentAltra })).toBe('pendent');
});

/* T43b-2 · mentre es llig no se sap res: 'comprovant'. Llegir i enviar no fallen igual. */
test('llegint → comprovant, excepte quan ja se sap (administres, activant, no-disponible)', () => {
  expect(estatDeLAdministracio({ ...base, llegint: true })).toBe('comprovant');
  expect(estatDeLAdministracio({ ...base, llegint: true, membership: { role: 'member' } })).toBe('comprovant');
  expect(estatDeLAdministracio({ ...base, llegint: true, membership: { role: 'owner' } })).toBe('administres');
  expect(estatDeLAdministracio({ ...base, llegint: true, reclamacio: { estat: 'aprovada' } })).toBe('activant');
  expect(estatDeLAdministracio({ teSessio: true, disponible: false, llegint: true })).toBe('no-disponible');
  expect(estatDeLAdministracio({ ...base, errorLectura: err('NO-DISPONIBLE') })).toBe('no-disponible');
  expect(estatDeLAdministracio({ ...base, errorLectura: err('ALTRE') })).toBe('pot-connectar');
  expect(ESTATS_ADMINISTRACIO).toContain('comprovant');
});

test('xarxa: TimeoutError, status 0 o TypeError; cada text diu si s’enviava o es llegia', () => {
  const timeout = Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' });
  expect(esErrorDeXarxa(timeout)).toBe(true);
  expect(esErrorDeXarxa(Object.assign(new Error('Error de xarxa'), { status: 0 }))).toBe(true);
  expect(esErrorDeXarxa(new TypeError('Failed to fetch'))).toBe(true);
  expect(esErrorDeXarxa(Object.assign(new Error('x'), { status: 500 }))).toBe(false);
  expect(esErrorDeXarxa(null)).toBe(false);
  expect(textDeLError(timeout)).toBe('El servidor no ha respost. Comprova la connexió i torna-ho a provar.');
  expect(textDeLaLectura(timeout)).toContain('El servidor no ha respost i no hem pogut comprovar');
  const generic = textDeLaLectura(err('ALTRE'));
  expect(generic).toContain('No hem pogut comprovar si ja havies demanat administrar-la');
  expect(generic).not.toContain('enviar');
  expect(generic).not.toContain('Supabase');
  expect(textDeLaLectura(err('NO-DISPONIBLE'))).toBeNull();
  expect(textDeLaLectura(null)).toBeNull();
});

test('la data curta és valenciana i no inventa res si no n’hi ha', () => {
  expect(dataCurta('2026-09-28T10:00:00Z')).toContain('2026');
  expect(dataCurta(null)).toBeNull();
  expect(dataCurta('no és una data')).toBeNull();
});
