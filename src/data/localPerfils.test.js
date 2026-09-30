import { beforeEach, expect, test } from 'vitest';
import { createLocalPerfilsAdapter } from './localPerfils.js';
import { ENTITAT_PILOT_ID, ENTITATS_SEED, IAIA_ID } from './identitatsSeed.js';

/* Lògica d'Usuari · el padró pilot del mode seed: qui ha entrat és la persona
   pilot i mana a «Sóc de Poble»; la IAIA és l'agent que eixa entitat administra. */
const USUARI = { id: '11111111-2222-4333-8444-555555555555', user_metadata: { full_name: 'Javi Pilot', avatar_url: 'https://x.test/j.png' } };
/* Una persona qualsevol amb sessió, que no és de cap llavor. */
const VEI = 'vei-de-proves';
/* T63.1 · Identificadors de les persones inventades que ha retirat la llavor del xat. */
const RETIRADES = [
  '4b0f9c3e-1a2d-4f5e-8b6c-0d1e2f3a4b01', '4b0f9c3e-1a2d-4f5e-8b6c-0d1e2f3a4b02',
  '4b0f9c3e-1a2d-4f5e-8b6c-0d1e2f3a4b03', '4b0f9c3e-1a2d-4f5e-8b6c-0d1e2f3a4b04'
];
let adapter;
beforeEach(() => { adapter = createLocalPerfilsAdapter(); });

test('qui ha entrat és propietari de l’entitat pilot i administra la IAIA; sense sessió, res', () => {
  expect(adapter.listMyOrganizations(USUARI)).toMatchObject([{ id: ENTITAT_PILOT_ID, role: 'owner', kind: 'company', name: 'Sóc de Poble' }]);
  expect(adapter.listMyAgents(USUARI).map((a) => a.id)).toEqual([IAIA_ID]);
  expect(adapter.listMyOrganizations(null)).toEqual([]);
  expect(adapter.listMyAgents(null)).toEqual([]);
  /* T63.1 · La llavor no declara cap membre inventat: hi mana qui té sessió. */
  expect(ENTITATS_SEED[0].membres).toEqual([]);
  expect(adapter.listMyOrganizations({ id: RETIRADES[2] })[0].role).toBe('owner');
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

/* T66 · L'emoticona de la fitxa (profiles.icon): la mateixa llista blanca que auth.js. */
test('T66 · la fitxa naix sense emoticona (null, com la columna nova) i la conserva en desar-la', () => {
  expect(adapter.getProfile(USUARI)).toHaveProperty('icon', null);
  expect(adapter.updateProfile(USUARI, { icon: '🌾' })).toMatchObject({ icon: '🌾' });
  expect(adapter.getProfile(USUARI).icon).toBe('🌾');
  // Llevar-la torna a null; organitzacions i agents no la guarden.
  expect(adapter.updateProfile(USUARI, { icon: null }).icon).toBeNull();
  adapter.updateOrganization(ENTITAT_PILOT_ID, { icon: '🍞' });
  expect(adapter.listMyOrganizations(USUARI)[0]).not.toHaveProperty('icon');
  adapter.updateAgent(IAIA_ID, { icon: '🤖' });
  expect(adapter.listMyAgents(USUARI)[0]).not.toHaveProperty('icon');
});

test('T66 · desar l’emoticona és una modificació: renova updated_at', () => {
  const ambRellotge = createLocalPerfilsAdapter({ ara: rellotge() });
  ambRellotge.getProfile(USUARI);
  expect(ambRellotge.updateProfile(USUARI, { icon: '🌾' })).toMatchObject({ icon: '🌾', created_at: minut(1), updated_at: minut(2) });
});

test('T66 · el perfil públic de la persona porta l’emoticona triada (neta); la resta de fitxes, buida', () => {
  expect(adapter.loadPerfilPublic(USUARI.id, USUARI)).toMatchObject({ tipus: 'persona', emoticona: '' });
  adapter.updateProfile(USUARI, { icon: '🌾' });
  expect(adapter.loadPerfilPublic(USUARI.id, USUARI).emoticona).toBe('🌾');
  // Un valor que no és un sol emoji no es pinta mai.
  adapter.updateProfile(USUARI, { icon: '🌾 i text' });
  expect(adapter.loadPerfilPublic(USUARI.id, USUARI).emoticona).toBe('');
  for (const clau of ['soc-de-poble', IAIA_ID, '0001']) {
    expect(adapter.loadPerfilPublic(clau, USUARI)).toHaveProperty('emoticona', '');
  }
});

test('perfil públic: la IAIA es diu, l’entitat per slug, la persona pilot, el catàleg i ningú', () => {
  expect(adapter.loadPerfilPublic('iaia-maria', USUARI)).toMatchObject({ tipus: 'ia', esIA: true, nom: 'IAIA MarIA', propietari: true, publicat: true });
  expect(adapter.loadPerfilPublic(IAIA_ID, null)).toMatchObject({ tipus: 'ia', esIA: true, propietari: false });
  expect(adapter.loadPerfilPublic('soc-de-poble', USUARI)).toMatchObject({ tipus: 'entitat', id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble', propietari: true, esIA: false });
  expect(adapter.loadPerfilPublic(ENTITAT_PILOT_ID, null)).toMatchObject({ tipus: 'entitat', propietari: false });
  expect(adapter.loadPerfilPublic(USUARI.id, USUARI)).toMatchObject({ tipus: 'persona', nom: 'Javi Pilot', propietari: true });
  expect(adapter.loadPerfilPublic('javillinares', USUARI)).toMatchObject({ tipus: 'persona', propietari: true });
  expect(adapter.loadPerfilPublic('0001', null)).toMatchObject({ tipus: 'persona', nom: 'Javi', propietari: false });
  expect(adapter.loadPerfilPublic('ningu', USUARI)).toBeNull();
  expect(adapter.loadPerfilPublic('', USUARI)).toBeNull();
});

test('T63.1 · les persones inventades del xat ja no tenen fitxa; Javi es resol una sola vegada', () => {
  for (const id of RETIRADES) {
    expect(adapter.loadPerfilPublic(id, USUARI)).toBeNull();
    expect(adapter.loadPerfilPublic(id, null)).toBeNull();
  }
  /* El «Javi» del padró del xat ('0001'): amb sessió és la persona pilot; sense, el catàleg. */
  expect(adapter.loadPerfilPublic('0001', USUARI)).toMatchObject({ tipus: 'persona', id: USUARI.id, propietari: true });
  expect(adapter.loadPerfilPublic('0001', null)).toMatchObject({ tipus: 'persona', id: '0001', propietari: false });
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

/* ── T51 (regla del Mestre, 260928) · cap fitxa sense data ─────────────── */

/* Un rellotge que avança un minut a cada lectura: cada acció té el seu moment. */
function rellotge(inici = Date.UTC(2026, 8, 28, 8, 0)) {
  let t = inici - 60000;
  return () => { t += 60000; return new Date(t); };
}
const minut = (n) => new Date(Date.UTC(2026, 8, 28, 8, n)).toISOString();

test('T51 · el padró naix amb el magatzem i la fitxa de la persona quan entra, com el default now() del servidor', () => {
  const ambRellotge = createLocalPerfilsAdapter({ ara: rellotge() });
  expect(ambRellotge.listMyOrganizations(USUARI)[0]).toMatchObject({ created_at: minut(0), updated_at: minut(0) });
  expect(ambRellotge.listMyAgents(USUARI)[0]).toMatchObject({ created_at: minut(0), updated_at: minut(0) });
  expect(ambRellotge.getProfile(USUARI)).toMatchObject({ created_at: minut(1), updated_at: minut(1) });
  // Tornar a llegir no la crea de nou: la data de creació no es mou.
  expect(ambRellotge.getProfile(USUARI).created_at).toBe(minut(1));
});

test('T51 · cada actualització amb camps del contracte renova updated_at; sense cap camp vàlid, no és cap modificació', () => {
  const ambRellotge = createLocalPerfilsAdapter({ ara: rellotge() });
  ambRellotge.getProfile(USUARI);
  expect(ambRellotge.updateProfile(USUARI, { lema: 'Del Comtat' })).toMatchObject({ created_at: minut(1), updated_at: minut(2) });
  expect(ambRellotge.updateProfile(USUARI, { rol: 'superadmin' })).toMatchObject({ updated_at: minut(2) });
  expect(ambRellotge.updateOrganization(ENTITAT_PILOT_ID, { lema: 'Fem xarxa' })).toMatchObject({ created_at: minut(0), updated_at: minut(4) });
  expect(ambRellotge.updateAgent(IAIA_ID, { lema: 'Trellat digital' })).toMatchObject({ created_at: minut(0), updated_at: minut(5) });
});

test('T51 · el perfil públic porta creat i modificat de la fitxa; les de només lectura, el naixement del magatzem', () => {
  const ambRellotge = createLocalPerfilsAdapter({ ara: rellotge() });
  ambRellotge.updateOrganization(ENTITAT_PILOT_ID, { lema: 'Fem xarxa' });
  expect(ambRellotge.loadPerfilPublic('soc-de-poble', USUARI)).toMatchObject({ creat: minut(0), modificat: minut(1) });
  expect(ambRellotge.loadPerfilPublic(IAIA_ID, USUARI)).toMatchObject({ creat: minut(0), modificat: minut(0) });
  expect(ambRellotge.loadPerfilPublic(USUARI.id, USUARI)).toMatchObject({ creat: minut(2), modificat: minut(2) });
  expect(ambRellotge.loadPerfilPublic('0001', null)).toMatchObject({ creat: minut(0), modificat: minut(0) });
});

/* ── T43 (ordre del Mestre, 260928) · administrar organitzacions i correu ── */

/* Una organització que no és de la llavor: ningú no hi té rol implícit. */
const FORN = Object.freeze({ id: 'forn-proves', slug: 'forn', kind: 'company', name: 'Forn de proves', visibility: 'public' });
const VEI_USUARI = { id: VEI, email: 'vei@poble.test' };
/* El `code` de l'error que llança `fn`, o null si no en llança cap. */
const codiDe = (fn) => { try { fn(); } catch (error) { return error.code ?? 'SENSE-CODI'; } return null; };

test('T43 · connectar-se a una organització sense rol hi fa entrar a l’instant com a admin; tornar-hi és idempotent', () => {
  const ambForn = createLocalPerfilsAdapter({ entitats: [...ENTITATS_SEED, FORN] });
  expect(ambForn.listMyOrganizations(VEI_USUARI).map((o) => o.id)).toEqual([ENTITAT_PILOT_ID]);
  expect(ambForn.reclamaOrganitzacio('forn', VEI_USUARI)).toMatchObject({ organitzacioId: 'forn-proves', estat: 'aprovada', role: 'admin', jaHiEra: false });
  expect(ambForn.listMyOrganizations(VEI_USUARI).find((o) => o.id === 'forn-proves')).toMatchObject({ role: 'admin' });
  expect(ambForn.loadPerfilPublic('forn-proves', VEI_USUARI)).toMatchObject({ propietari: true });
  expect(ambForn.reclamaOrganitzacio('forn-proves', VEI_USUARI)).toMatchObject({ role: 'admin', jaHiEra: true });
  /* La regla de la llavor no canvia (D1): la pilot ja és seua. */
  expect(ambForn.reclamaOrganitzacio(ENTITAT_PILOT_ID, VEI_USUARI)).toMatchObject({ role: 'owner', jaHiEra: true });
  expect(ambForn.lesMevesReclamacions()).toEqual([]);
  expect(codiDe(() => ambForn.reclamaOrganitzacio('forn', null))).toBe('SDP-CLAIM-000');
  expect(codiDe(() => ambForn.reclamaOrganitzacio('cap', VEI_USUARI))).toBe('SDP-CLAIM-001');
  ambForn.reinicia();
  expect(ambForn.listMyOrganizations(VEI_USUARI).map((o) => o.id)).toEqual([ENTITAT_PILOT_ID]);
});

test('T43 · el correu de l’organització és privat per a qui l’administra; la fitxa només rep el públic', () => {
  const buit = adapter.llegeixContacteOrganitzacio(ENTITAT_PILOT_ID, { ...USUARI, email: 'javi@poble.test' });
  expect(buit).toEqual({ correu: '', public: false, perDefecte: { origen: 'propietaria', correu: 'javi@poble.test' } });
  /* Qui administra sense ser-ne la titular no rep cap correu per defecte: mai
     el d'una altra persona. La llavor ja no té cap admin declarat (T63.1), i
     per això es prova amb una organització a la qual s'ha connectat. */
  const ambForn = createLocalPerfilsAdapter({ entitats: [...ENTITATS_SEED, FORN] });
  ambForn.reclamaOrganitzacio('forn', VEI_USUARI);
  expect(ambForn.llegeixContacteOrganitzacio('forn-proves', VEI_USUARI).perDefecte)
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
  expect(codiDe(() => ambForn.llegeixContacteOrganitzacio('forn-proves', VEI_USUARI))).toBe('SDP-ORGMAIL-001');
  expect(codiDe(() => ambForn.desaContacteOrganitzacio('forn-proves', { correu: 'a@b.cat' }, VEI_USUARI))).toBe('SDP-ORGMAIL-001');
  expect(codiDe(() => ambForn.llegeixContacteOrganitzacio(ENTITAT_PILOT_ID, null))).toBe('SDP-ORGMAIL-000');
  expect(codiDe(() => ambForn.llegeixContacteOrganitzacio('cap', USUARI))).toBe('SDP-ORGMAIL-002');
});
