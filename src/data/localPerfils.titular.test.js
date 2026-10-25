import { beforeEach, expect, test } from 'vitest';
import { createLocalPerfilsAdapter } from './localPerfils.js';
import { AGENTS_MAP } from './agentsSeed.js';
import { ENTITAT_PILOT_ID, ENTITAT_RENTONAR_SLUG, ENTITATS_SEED } from './identitatsSeed.js';

/* IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla 261025_0200)
   · La titular que ha triat mostrar-se, en seed i local, amb les regles de
   titular_public (2610250300): només la propietària tria (mai una
   administradora), la tria és seua, i es mostra si té la fitxa pública i
   sense baixa, si l'organització és pública i si qui mira no l'ha
   bloquejada. Mai cap correu ni cap rol. La llavor no declara cap titular:
   la persona pilot és de veres, i ningú no es mostra sense triar-ho. */
const USUARI = { id: '11111111-2222-4333-8444-555555555555', email: 'pilot@poble.invalid', user_metadata: { full_name: 'Javi Pilot', avatar_url: 'https://x.test/j.png' } };
const JAVI = { id: AGENTS_MAP.JAVI.id };
let adapter;
beforeEach(() => { adapter = createLocalPerfilsAdapter(); });

test('la llavor no declara cap titular: sense cap tria, cap entitat no en mostra cap', () => {
  expect(ENTITATS_SEED.flatMap((entitat) => entitat.membres).some((membre) => Object.hasOwn(membre, 'titularPublic'))).toBe(false);
  for (const entitat of ENTITATS_SEED) expect(adapter.loadTitularPublic(entitat.id, USUARI), entitat.id).toBeNull();
});

test('la propietària tria mostrar-se i ho pot desfer; la titular porta { tipus, id, nom, avatar } i res més', () => {
  expect(adapter.estatTitularPublic(ENTITAT_PILOT_ID, USUARI)).toEqual({ titularPublic: false });
  expect(adapter.marcaTitularPublic(ENTITAT_PILOT_ID, true, USUARI)).toEqual({ titularPublic: true });
  expect(adapter.estatTitularPublic(ENTITAT_PILOT_ID, USUARI)).toEqual({ titularPublic: true });
  expect(adapter.loadTitularPublic(ENTITAT_PILOT_ID, USUARI)).toEqual({ tipus: 'persona', id: USUARI.id, nom: 'Javi Pilot', avatar: 'https://x.test/j.png' });
  expect(adapter.marcaTitularPublic(ENTITAT_PILOT_ID, false, USUARI)).toEqual({ titularPublic: false });
  expect(adapter.loadTitularPublic(ENTITAT_PILOT_ID, USUARI)).toBeNull();
});

test('una administradora no pot llegir ni fer la tria (SDP-TIT-001); sense sessió, SDP-TIT-000 i cap titular', () => {
  /* La persona pilot administra Rentonar (admin, identitatsSeed), no n'és la propietària. */
  expect(() => adapter.estatTitularPublic(ENTITAT_RENTONAR_SLUG, JAVI)).toThrow(expect.objectContaining({ code: 'SDP-TIT-001' }));
  expect(() => adapter.marcaTitularPublic(ENTITAT_RENTONAR_SLUG, true, JAVI)).toThrow(expect.objectContaining({ code: 'SDP-TIT-001' }));
  expect(() => adapter.estatTitularPublic('no-existix', USUARI)).toThrow(expect.objectContaining({ code: 'SDP-TIT-001' }));
  expect(() => adapter.estatTitularPublic(ENTITAT_PILOT_ID, null)).toThrow(expect.objectContaining({ code: 'SDP-TIT-000' }));
  expect(() => adapter.marcaTitularPublic(ENTITAT_PILOT_ID, 'sí', USUARI)).toThrow(expect.objectContaining({ code: 'SDP-TIT-002' }));
  adapter.marcaTitularPublic(ENTITAT_PILOT_ID, true, USUARI);
  expect(adapter.loadTitularPublic(ENTITAT_PILOT_ID, null)).toBeNull();
  expect(adapter.loadTitularPublic('no-existix', USUARI)).toBeNull();
});

test('amb la tria feta: un perfil que no és públic o una persona bloquejada per qui mira no es mostren', () => {
  adapter.marcaTitularPublic(ENTITAT_PILOT_ID, true, USUARI);
  expect(adapter.loadTitularPublic(ENTITAT_PILOT_ID, USUARI, { bloquejos: [{ tipus: 'persona', id: USUARI.id }] })).toBeNull();
  /* Un bloqueig d'una entitat amb el mateix id no és cap bloqueig de la persona. */
  expect(adapter.loadTitularPublic(ENTITAT_PILOT_ID, USUARI, { bloquejos: [{ tipus: 'entitat', id: USUARI.id }] })?.id).toBe(USUARI.id);
  adapter.updateProfile(USUARI, { is_public: false });
  expect(adapter.loadTitularPublic(ENTITAT_PILOT_ID, USUARI)).toBeNull();
});

/* Una llavor de prova amb una persona clarament inventada, mai la pilot. */
const FORN = (membres, visibility = 'public') => ({
  id: 'forn-de-prova', slug: 'forn-de-prova', kind: 'company', name: 'Forn de prova', visibility, alies: [], membres
});
const DEMO = { id: 'persona-demo', nom: 'Persona de demostració', avatar: '' };

test('una pertinença owner declarada només compta amb la marca titularPublic i una persona del padró marcada pública', () => {
  const amb = (membres, persones, visibility) => createLocalPerfilsAdapter({ entitats: [FORN(membres, visibility)], persones });
  const owner = { usuariId: DEMO.id, role: 'owner', titularPublic: true };
  expect(amb([owner], [{ ...DEMO, publica: true }]).loadTitularPublic('forn-de-prova', USUARI))
    .toEqual({ tipus: 'persona', id: DEMO.id, nom: DEMO.nom, avatar: '' });
  /* Sense la marca, sense la persona pública, una administradora o una organització privada: res. */
  expect(amb([{ ...owner, titularPublic: undefined }], [{ ...DEMO, publica: true }]).loadTitularPublic('forn-de-prova', USUARI)).toBeNull();
  expect(amb([owner], [DEMO]).loadTitularPublic('forn-de-prova', USUARI)).toBeNull();
  expect(amb([{ ...owner, role: 'admin' }], [{ ...DEMO, publica: true }]).loadTitularPublic('forn-de-prova', USUARI)).toBeNull();
  expect(amb([owner], [{ ...DEMO, publica: true }], 'private').loadTitularPublic('forn-de-prova', USUARI)).toBeNull();
});
