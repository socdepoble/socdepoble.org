import { beforeEach, expect, test } from 'vitest';
import { createLocalPerfilsAdapter } from './localPerfils.js';
import { ENTITAT_PILOT_ID, ENTITATS_SEED, IAIA_ID, MEMBRE_ADMIN_PILOT } from './identitatsSeed.js';

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

/* ── T43 (ordre del Mestre, 260928) · administrar organitzacions i correu ── */

/* Una organització que no és de la llavor: ningú no hi té rol implícit. */
const FORN = Object.freeze({ id: 'forn-proves', slug: 'forn', kind: 'company', name: 'Forn de proves', visibility: 'public' });
const PEPA_USUARI = { id: PEPA, email: 'pepa@poble.test' };
/* El `code` de l'error que llança `fn`, o null si no en llança cap. */
const codiDe = (fn) => { try { fn(); } catch (error) { return error.code ?? 'SENSE-CODI'; } return null; };

test('T43 · connectar-se a una organització sense rol hi fa entrar a l’instant com a admin; tornar-hi és idempotent', () => {
  const ambForn = createLocalPerfilsAdapter({ entitats: [...ENTITATS_SEED, FORN] });
  expect(ambForn.listMyOrganizations(PEPA_USUARI).map((o) => o.id)).toEqual([ENTITAT_PILOT_ID]);
  expect(ambForn.reclamaOrganitzacio('forn', PEPA_USUARI)).toMatchObject({ organitzacioId: 'forn-proves', estat: 'aprovada', role: 'admin', jaHiEra: false });
  expect(ambForn.listMyOrganizations(PEPA_USUARI).find((o) => o.id === 'forn-proves')).toMatchObject({ role: 'admin' });
  expect(ambForn.loadPerfilPublic('forn-proves', PEPA_USUARI)).toMatchObject({ propietari: true });
  expect(ambForn.reclamaOrganitzacio('forn-proves', PEPA_USUARI)).toMatchObject({ role: 'admin', jaHiEra: true });
  /* La regla de la llavor no canvia (D1): la pilot ja és seua. */
  expect(ambForn.reclamaOrganitzacio(ENTITAT_PILOT_ID, PEPA_USUARI)).toMatchObject({ role: 'owner', jaHiEra: true });
  expect(ambForn.lesMevesReclamacions()).toEqual([]);
  expect(codiDe(() => ambForn.reclamaOrganitzacio('forn', null))).toBe('SDP-CLAIM-000');
  expect(codiDe(() => ambForn.reclamaOrganitzacio('cap', PEPA_USUARI))).toBe('SDP-CLAIM-001');
  ambForn.reinicia();
  expect(ambForn.listMyOrganizations(PEPA_USUARI).map((o) => o.id)).toEqual([ENTITAT_PILOT_ID]);
});

test('T43 · el correu de l’organització és privat per a qui l’administra; la fitxa només rep el públic', () => {
  const buit = adapter.llegeixContacteOrganitzacio(ENTITAT_PILOT_ID, { ...USUARI, email: 'javi@poble.test' });
  expect(buit).toEqual({ correu: '', public: false, perDefecte: { origen: 'propietaria', correu: 'javi@poble.test' } });
  /* L'admin de la llavor no és la titular: mai veu el correu d'una altra persona. */
  expect(adapter.llegeixContacteOrganitzacio(ENTITAT_PILOT_ID, { id: MEMBRE_ADMIN_PILOT, email: 'maria@poble.test' }).perDefecte)
    .toEqual({ origen: 'propietaria', correu: null });

  adapter.desaContacteOrganitzacio(ENTITAT_PILOT_ID, { correu: ' Hola@SocDePoble.cat ', public: false }, USUARI);
  expect(adapter.llegeixContacteOrganitzacio(ENTITAT_PILOT_ID, USUARI)).toMatchObject({ correu: 'hola@socdepoble.cat', public: false });
  expect(adapter.loadPerfilPublic(ENTITAT_PILOT_ID, null).correu).toBe('');
  expect(JSON.stringify(adapter.listMyOrganizations(USUARI))).not.toContain('hola@socdepoble.cat');

  adapter.desaContacteOrganitzacio(ENTITAT_PILOT_ID, { correu: 'hola@socdepoble.cat', public: true }, USUARI);
  expect(adapter.loadPerfilPublic('soc-de-poble', null).correu).toBe('hola@socdepoble.cat');
  /* Sense correu no hi ha res a publicar. */
  expect(adapter.desaContacteOrganitzacio(ENTITAT_PILOT_ID, { correu: '', public: true }, USUARI)).toMatchObject({ correu: '', public: false });
  expect(adapter.loadPerfilPublic(ENTITAT_PILOT_ID, null).correu).toBe('');
  expect(codiDe(() => adapter.desaContacteOrganitzacio(ENTITAT_PILOT_ID, { correu: 'no és un correu' }, USUARI))).toBe('CORREU-INVALID');
});

test('T43 · qui no administra (o no té sessió) no llig ni escriu el correu', () => {
  const ambForn = createLocalPerfilsAdapter({ entitats: [...ENTITATS_SEED, FORN] });
  expect(codiDe(() => ambForn.llegeixContacteOrganitzacio('forn-proves', PEPA_USUARI))).toBe('SDP-ORGMAIL-001');
  expect(codiDe(() => ambForn.desaContacteOrganitzacio('forn-proves', { correu: 'a@b.cat' }, PEPA_USUARI))).toBe('SDP-ORGMAIL-001');
  expect(codiDe(() => ambForn.llegeixContacteOrganitzacio(ENTITAT_PILOT_ID, null))).toBe('SDP-ORGMAIL-000');
  expect(codiDe(() => ambForn.llegeixContacteOrganitzacio('cap', USUARI))).toBe('SDP-ORGMAIL-002');
});
