import { beforeEach, expect, test } from 'vitest';
import { createLocalPerfilsAdapter } from './localPerfils.js';
import { ENTITAT_PILOT_ID, IAIA_ID, MEMBRE_ADMIN_PILOT } from './identitatsSeed.js';

/* Lògica d'Usuari · el padró pilot del mode seed: qui ha entrat és la persona
   pilot i mana a «Sóc de Poble»; la IAIA és l'agent que eixa entitat administra. */
const USUARI = { id: '11111111-2222-4333-8444-555555555555', user_metadata: { full_name: 'Javi Pilot', avatar_url: 'https://x.test/j.png' } };
const PEPA = '4b0f9c3e-1a2d-4f5e-8b6c-0d1e2f3a4b01';
let adapter;
beforeEach(() => { adapter = createLocalPerfilsAdapter(); });

test('qui ha entrat és propietari de l’entitat pilot i administra la IAIA; sense sessió, res', () => {
  expect(adapter.listMyOrganizations(USUARI)).toMatchObject([{ id: ENTITAT_PILOT_ID, role: 'owner', kind: 'company', name: 'Sóc de Poble' }]);
  expect(adapter.listMyAgents(USUARI).map((a) => a.id)).toEqual([IAIA_ID]);
  expect(adapter.listMyOrganizations(null)).toEqual([]);
  expect(adapter.listMyAgents(null)).toEqual([]);
  /* Un membre de la llavor té el rol declarat, no el de propietari. */
  expect(adapter.listMyOrganizations({ id: MEMBRE_ADMIN_PILOT })[0].role).toBe('admin');
});

test('la fitxa naix de la sessió i els canvis es queden en memòria, només els camps del contracte', () => {
  expect(adapter.getProfile(USUARI)).toMatchObject({ id: USUARI.id, full_name: 'Javi Pilot', avatar_url: 'https://x.test/j.png', is_public: false });
  expect(adapter.getProfile(null)).toBeNull();
  adapter.updateProfile(USUARI, { lema: 'Del Comtat', is_public: true, rol: 'superadmin' });
  const perfil = adapter.getProfile(USUARI);
  expect(perfil).toMatchObject({ lema: 'Del Comtat', is_public: true });
  expect(perfil).not.toHaveProperty('rol');
  expect(() => adapter.updateProfile(null, { lema: 'x' })).toThrow('Cal iniciar sessió');
  adapter.updateOrganization(ENTITAT_PILOT_ID, { lema: 'Fem xarxa', visibility: 'members' });
  expect(adapter.listMyOrganizations(USUARI)[0]).toMatchObject({ lema: 'Fem xarxa', visibility: 'members' });
  expect(() => adapter.updateOrganization('cap', { lema: 'x' })).toThrow();
});

test('perfil públic: la IAIA es diu, l’entitat per slug, la persona pilot, el padró del xat i ningú', () => {
  expect(adapter.loadPerfilPublic('iaia-maria', USUARI)).toMatchObject({ tipus: 'ia', esIA: true, nom: 'IAIA MarIA', propietari: true, publicat: true });
  expect(adapter.loadPerfilPublic(IAIA_ID, null)).toMatchObject({ tipus: 'ia', esIA: true, propietari: false });
  expect(adapter.loadPerfilPublic('soc-de-poble', USUARI)).toMatchObject({ tipus: 'entitat', id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble', propietari: true, esIA: false });
  expect(adapter.loadPerfilPublic(ENTITAT_PILOT_ID, null)).toMatchObject({ tipus: 'entitat', propietari: false });
  expect(adapter.loadPerfilPublic(USUARI.id, USUARI)).toMatchObject({ tipus: 'persona', nom: 'Javi Pilot', propietari: true });
  expect(adapter.loadPerfilPublic('javillinares', USUARI)).toMatchObject({ tipus: 'persona', propietari: true });
  expect(adapter.loadPerfilPublic(PEPA, USUARI)).toMatchObject({ tipus: 'persona', nom: 'Pepa Ferrer', propietari: false });
  expect(adapter.loadPerfilPublic('0001', null)).toMatchObject({ tipus: 'persona', nom: 'Mestre Poble', propietari: false });
  expect(adapter.loadPerfilPublic('ningu', USUARI)).toBeNull();
  expect(adapter.loadPerfilPublic('', USUARI)).toBeNull();
});

test('la fitxa de la IAIA s’edita des del Workspace i el perfil públic ho reflectix', () => {
  adapter.updateAgent(IAIA_ID, { lema: 'Trellat digital', presentacio_html: '<p>Hola</p>', owner_org_id: 'ignorat' });
  const iaia = adapter.loadPerfilPublic(IAIA_ID, USUARI);
  expect(iaia).toMatchObject({ lema: 'Trellat digital', presentacioHtml: '<p>Hola</p>', propietari: true });
  expect(adapter.listMyAgents(USUARI)[0].owner_org_id).toBe(ENTITAT_PILOT_ID);
  expect(() => adapter.updateAgent('cap', { lema: 'x' })).toThrow();
  adapter.reinicia();
  expect(adapter.loadPerfilPublic(IAIA_ID, USUARI).lema).not.toBe('Trellat digital');
});
