/**
 * Pla 261022_1955 (Cercador Universal, T1) · El directori públic en seed i
 * local: la mateixa fila que organization_directory, només les públiques.
 */
import { beforeEach, expect, test } from 'vitest';
import { createLocalPerfilsAdapter } from './localPerfils.js';
import { ENTITATS_SEED, ENTITAT_PILOT_ID } from './identitatsSeed.js';

/* Les 15 columnes de la vista (2610081401). */
const COLUMNES = ['id', 'tenant_id', 'slug', 'name', 'kind', 'parent_organization_id', 'lema', 'description',
  'created_at', 'updated_at', 'logo_url', 'hero_url', 'presentacio_html', 'copyright', 'town_name'];
const FORN = Object.freeze({
  id: 'forn-proves', slug: 'forn', kind: 'company', name: 'Forn de la Plaça', lema: 'Pa de llenya',
  description: 'Coca i pa cada matí', visibility: 'public', town_name: 'Benifallim',
  logo_url: '', hero_url: '', presentacio_html: '', copyright: ''
});
const AMAGADA = Object.freeze({ ...FORN, id: 'amagada', slug: 'amagada', name: 'Associació amagada', visibility: 'members' });

let local;
beforeEach(() => { local = createLocalPerfilsAdapter({ entitats: [...ENTITATS_SEED, FORN, AMAGADA] }); });

test('Pla 261022_1955 · només les públiques, amb la fila de la vista i cap camp intern', () => {
  const files = local.listPublicOrganizations();
  expect(files.map((fila) => fila.id)).not.toContain('amagada');
  expect(files.map((fila) => fila.id)).toEqual(expect.arrayContaining([ENTITAT_PILOT_ID, 'forn-proves']));
  for (const fila of files) {
    expect(Object.keys(fila).sort()).toEqual([...COLUMNES].sort());
    expect(fila.tenant_id).toBeNull();
  }
  /* Per nom, com el servidor (order=name.asc,id.asc). */
  const noms = files.map((fila) => fila.name);
  expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, 'ca')));
});

test('Pla 261022_1955 · una organització que es fa privada ix del directori', () => {
  local.updateOrganization(ENTITAT_PILOT_ID, { visibility: 'members' });
  expect(local.listPublicOrganizations().map((fila) => fila.id)).not.toContain(ENTITAT_PILOT_ID);
});

test('Pla 261022_1955 · la consulta vol totes les paraules al nom, al slug, al lema o a la descripció; el límit talla', () => {
  expect(local.listPublicOrganizations({ consulta: 'pa llenya' }).map((fila) => fila.id)).toEqual(['forn-proves']);
  expect(local.listPublicOrganizations({ consulta: 'Forn coca' }).map((fila) => fila.id)).toEqual(['forn-proves']);
  expect(local.listPublicOrganizations({ consulta: 'forn zzz' })).toEqual([]);
  expect(local.listPublicOrganizations({ consulta: 'amagada' })).toEqual([]);
  expect(local.listPublicOrganizations({ limit: 1 })).toHaveLength(1);
});

test('Pla 261022_1955 · la fila és una còpia: editar-la no toca el magatzem', () => {
  const [primera] = local.listPublicOrganizations({ consulta: 'forn' });
  primera.name = 'Un altre nom';
  expect(local.listPublicOrganizations({ consulta: 'forn' })[0].name).toBe('Forn de la Plaça');
});

test('Gauntlet · la consulta local plega accents, la ç, la ŀ i la forma descomposta', () => {
  const regants = Object.freeze({ ...FORN, id: 'regants', slug: 'regants-major', name: 'Comunitat de la Sèquia Major', lema: 'Coŀlectiu de regants' });
  const ambRegants = createLocalPerfilsAdapter({ entitats: [...ENTITATS_SEED, regants] });
  const ids = (consulta) => ambRegants.listPublicOrganizations({ consulta }).map((fila) => fila.id);
  expect(ids('sequia')).toEqual(['regants']);
  expect(ids('SÈQUIA')).toEqual(['regants']);
  expect(ids('Se\u0300quia'.normalize('NFD'))).toEqual(['regants']);
  expect(ids('col·lectiu')).toEqual(['regants']);
  expect(ids('collectiu')).toEqual(['regants']);
  expect(local.listPublicOrganizations({ consulta: 'placa' }).map((fila) => fila.id)).toEqual(['forn-proves']);
});
