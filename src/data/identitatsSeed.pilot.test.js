/* Pla 261018_1605 (Tasca 0, D7; ordre del Mestre, 18-10-2026) · El compte
   remot de la persona pilot i la seua fitxa canònica: es reconeix pel correu
   del compte (acreditat) o per un id declarat, mai pel nom, i la hidratació
   només omple buits, canvia la foto de Google per la canònica i no posa mai
   cap visibility. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { AGENTS_MAP } from './agentsSeed.js';
import {
  CORREU_PERSONA_PILOT, IDS_REMOTS_FUNDACIONALS, PERSONA_PILOT, POBLE_FUNDACIONAL, clauFundacional,
  esComptePersonaPilot, esCorreuPersonaPilot, hidrataPerfilPersonaPilot
} from './identitatsSeed.js';

const UUID = '99999999-8888-4777-8666-555555555555';
const ALTRE = '11111111-2222-4333-8444-555555555555';
const GOOGLE = 'https://lh3.googleusercontent.com/a/foto-google';
const PROPIA = 'sdp-media://mitjans/poble/99999999-8888-4777-8666-555555555555/avatars/propia.webp';
/* Un usuari de sessió de GoTrue: porta aud, app_metadata i identities. */
const deGoTrue = (extra = {}) => ({
  id: UUID, aud: 'authenticated', email: CORREU_PERSONA_PILOT, app_metadata: { provider: 'email' }, identities: [],
  user_metadata: {}, ...extra
});

describe('PERSONA_PILOT, la font única canònica', () => {
  test('nom, foto, bio, lema, poble i capçalera es lligen del catàleg i del poble fundacional', () => {
    expect(PERSONA_PILOT).toMatchObject({
      id: AGENTS_MAP.JAVI.id, correu: CORREU_PERSONA_PILOT, nom: AGENTS_MAP.JAVI.avatarName,
      avatar: AGENTS_MAP.JAVI.avatar_url, avatar_url: AGENTS_MAP.JAVI.avatar_url,
      bio: AGENTS_MAP.JAVI.role, lema: AGENTS_MAP.JAVI.lema, poble: POBLE_FUNDACIONAL, hero_url: ''
    });
    expect(Object.isFrozen(PERSONA_PILOT)).toBe(true);
    /* Doctrina: cap UUID remot declarat fins que el Mestre el done. */
    expect(IDS_REMOTS_FUNDACIONALS[PERSONA_PILOT.slug]).toEqual([]);
  });
});

describe('esCorreuPersonaPilot', () => {
  test('el correu del compte, sense distingir majúscules ni espais', () => {
    expect(esCorreuPersonaPilot(CORREU_PERSONA_PILOT)).toBe(true);
    expect(esCorreuPersonaPilot('  SocDePobleCom@Gmail.com ')).toBe(true);
  });
  test('cap altre correu, ni un valor que no és text', () => {
    for (const valor of ['altra@gmail.com', 'socdepoblecom@gmail.com.example', '', null, undefined, 42, { email: CORREU_PERSONA_PILOT }]) {
      expect(esCorreuPersonaPilot(valor), String(valor)).toBe(false);
    }
  });
});

describe('esComptePersonaPilot', () => {
  test('un usuari de GoTrue amb el correu confirmat, o amb la identitat de Google, sí', () => {
    expect(esComptePersonaPilot(deGoTrue({ email_confirmed_at: '2026-10-01T10:00:00Z' }))).toBe(true);
    expect(esComptePersonaPilot(deGoTrue({ confirmed_at: '2026-10-01T10:00:00Z' }))).toBe(true);
    expect(esComptePersonaPilot(deGoTrue({
      identities: [{ provider: 'google', identity_data: { email: CORREU_PERSONA_PILOT } }]
    }))).toBe(true);
  });

  test('un usuari de GoTrue amb el correu sense confirmar i sense Google, no', () => {
    expect(esComptePersonaPilot(deGoTrue())).toBe(false);
    expect(esComptePersonaPilot(deGoTrue({ email_confirmed_at: null, confirmed_at: null }))).toBe(false);
    /* Només aud, o només app_metadata, ja és un usuari de GoTrue. */
    expect(esComptePersonaPilot({ id: UUID, aud: 'authenticated', email: CORREU_PERSONA_PILOT })).toBe(false);
    expect(esComptePersonaPilot({ id: UUID, app_metadata: {}, email: CORREU_PERSONA_PILOT })).toBe(false);
    /* Una identitat de Google amb un altre correu no l'acredita. */
    expect(esComptePersonaPilot(deGoTrue({
      identities: [{ provider: 'google', identity_data: { email: 'altra@gmail.com' } }]
    }))).toBe(false);
    expect(esComptePersonaPilot(deGoTrue({ identities: [{ provider: 'github' }] }))).toBe(false);
  });

  test('en un usuari de GoTrue, el correu de user_metadata (l’escriu la persona) no compta', () => {
    expect(esComptePersonaPilot(deGoTrue({
      email: 'altra@example.test', email_confirmed_at: '2026-10-01T10:00:00Z', user_metadata: { email: CORREU_PERSONA_PILOT }
    }))).toBe(false);
  });

  /* Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 0 (revisió
     adversarial) · un objecte sense cap prova de confirmació (una fila, un DTO
     o una sessió adoptada de l'amfitrió amb només el correu) no és la persona
     pilot pel correu. Amb la confirmació, sí. */
  test('una fila, un DTO o una sessió adoptada sense confirmació: el correu nu no basta', () => {
    expect(esComptePersonaPilot({ id: UUID, email: CORREU_PERSONA_PILOT })).toBe(false);
    expect(esComptePersonaPilot({ id: UUID, correu: CORREU_PERSONA_PILOT })).toBe(false);
    expect(esComptePersonaPilot({ id: UUID, user_metadata: { email: CORREU_PERSONA_PILOT } })).toBe(false);
    expect(esComptePersonaPilot({ id: UUID, email: CORREU_PERSONA_PILOT, email_confirmed_at: '2026-10-01T00:00:00Z' })).toBe(true);
  });

  test('per un àlies o un id remot declarat, i mai pel nom', () => {
    expect(esComptePersonaPilot({ id: AGENTS_MAP.JAVI.id })).toBe(true);
    expect(esComptePersonaPilot({ id: 'x', slug: PERSONA_PILOT.slug })).toBe(true);
    expect(esComptePersonaPilot({ id: UUID })).toBe(false);
    expect(esComptePersonaPilot({ id: UUID }, { idsRemots: { [PERSONA_PILOT.slug]: [UUID.toUpperCase()] } })).toBe(true);
    expect(esComptePersonaPilot({ id: UUID, full_name: PERSONA_PILOT.nom, user_metadata: { full_name: PERSONA_PILOT.nom } })).toBe(false);
    for (const res of [null, undefined, '', CORREU_PERSONA_PILOT, 42]) expect(esComptePersonaPilot(res), String(res)).toBe(false);
  });
});

describe('clauFundacional', () => {
  /* Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 0 (correcció
     de la revisió) · clauFundacional ja no reconeix la persona pilot pel
     correu: un DTO sense les claus de GoTrue saltaria la regla de confirmació,
     i cap qui crida no el necessita. Pel seu id declarat o un àlies, sí. */
  test('un correu nu (el de la pilot, confirmat o no) no fa la persona pilot; un id declarat, sí', () => {
    expect(clauFundacional({ tipus: 'persona', id: UUID, email: CORREU_PERSONA_PILOT })).toBeNull();
    expect(clauFundacional({ tipus: 'persona', id: UUID, correu: ' SOCDEPOBLECOM@gmail.com' })).toBeNull();
    expect(clauFundacional({
      tipus: 'persona', id: UUID, email: CORREU_PERSONA_PILOT, email_confirmed_at: '2026-10-01T00:00:00Z', aud: 'authenticated',
    })).toBeNull();
    expect(clauFundacional({ tipus: 'persona', id: UUID, email: 'altra@gmail.com' })).toBeNull();
    expect(clauFundacional({ tipus: 'persona', id: UUID })).toBeNull();
    expect(clauFundacional({ tipus: 'persona', id: UUID }, { idsRemots: { [PERSONA_PILOT.slug]: [UUID] } })).toBe(PERSONA_PILOT.slug);
    expect(clauFundacional({ tipus: 'persona', id: AGENTS_MAP.JAVI.id, email: 'altra@gmail.com' })).toBe(PERSONA_PILOT.slug);
    // L'usuari de sessió sencer, en canvi, el reconeix esComptePersonaPilot.
    expect(esComptePersonaPilot({
      id: UUID, email: CORREU_PERSONA_PILOT, email_confirmed_at: '2026-10-01T00:00:00Z', aud: 'authenticated', app_metadata: {},
    })).toBe(true);
  });
  test('el correu no fa persona pilot cap entitat ni cap grup', () => {
    expect(clauFundacional({ tipus: 'entitat', id: UUID, email: CORREU_PERSONA_PILOT })).toBeNull();
    expect(clauFundacional({ tipus: 'grup', id: UUID, correu: CORREU_PERSONA_PILOT })).toBeNull();
  });
});

describe('hidrataPerfilPersonaPilot', () => {
  const USUARI = { id: UUID, email: CORREU_PERSONA_PILOT, email_confirmed_at: '2026-10-01T00:00:00Z', user_metadata: { avatar_url: GOOGLE, picture: GOOGLE } };

  test('omple els buits amb els canònics i canvia la foto de Google per la canònica', () => {
    const fila = { id: UUID, full_name: '', avatar_url: GOOGLE, town_name: null, bio: '   ', lema: undefined };
    const hidratada = hidrataPerfilPersonaPilot(fila, USUARI);
    expect(hidratada).toMatchObject({
      id: UUID, full_name: PERSONA_PILOT.nom, avatar_url: PERSONA_PILOT.avatar, town_name: PERSONA_PILOT.poble,
      bio: PERSONA_PILOT.bio, lema: PERSONA_PILOT.lema, is_public: true
    });
    /* La fila d'entrada no es toca. */
    expect(fila).toEqual({ id: UUID, full_name: '', avatar_url: GOOGLE, town_name: null, bio: '   ', lema: undefined });
    /* Sense foto, també la canònica. */
    expect(hidrataPerfilPersonaPilot({ id: UUID, avatar_url: '' }, USUARI).avatar_url).toBe(PERSONA_PILOT.avatar);
    expect(hidrataPerfilPersonaPilot({ id: UUID, avatar_url: null }, USUARI).avatar_url).toBe(PERSONA_PILOT.avatar);
  });

  test('mai xafa una dada pròpia de la fila: foto pròpia, poble, bio, lema, capçalera i is_public', () => {
    const fila = {
      id: UUID, full_name: ' Javi ', avatar_url: PROPIA, town_name: 'Relleu · Sella', bio: 'Llaurador', lema: 'Del Comtat',
      hero_url: '/assets/fotos/capcalera.jpg', is_public: false, presentacio_html: '<p>Hola</p>'
    };
    expect(hidrataPerfilPersonaPilot(fila, USUARI)).toEqual(fila);
    /* Una foto pròpia del mateix lloc també es queda. */
    expect(hidrataPerfilPersonaPilot({ ...fila, avatar_url: '/assets/fotos/una-altra.jpg' }, USUARI).avatar_url).toBe('/assets/fotos/una-altra.jpg');
  });

  test('mai posa ni canvia la visibility', () => {
    const senseVisibility = hidrataPerfilPersonaPilot({ id: UUID }, USUARI);
    expect(Object.hasOwn(senseVisibility, 'visibility')).toBe(false);
    expect(hidrataPerfilPersonaPilot({ id: UUID, visibility: 'private' }, USUARI).visibility).toBe('private');
    expect(hidrataPerfilPersonaPilot({ id: UUID, visibility: '' }, USUARI).visibility).toBe('');
    /* Una capçalera canònica buida no hi afig cap clau. */
    expect(Object.hasOwn(senseVisibility, 'hero_url')).toBe(false);
  });

  test('is_public: el de la fila; si no en porta, pública', () => {
    expect(hidrataPerfilPersonaPilot({ id: UUID }, USUARI).is_public).toBe(true);
    expect(hidrataPerfilPersonaPilot({ id: UUID, is_public: null }, USUARI).is_public).toBe(true);
    expect(hidrataPerfilPersonaPilot({ id: UUID, is_public: false }, USUARI).is_public).toBe(false);
  });

  test('una fila de reserva conserva la marca i la seua visibility', () => {
    const reserva = { reserva: true, id: UUID, full_name: '', avatar_url: GOOGLE, visibility: 'private', is_public: true, town_name: '' };
    expect(hidrataPerfilPersonaPilot(reserva, USUARI)).toEqual({
      reserva: true, id: UUID, full_name: PERSONA_PILOT.nom, avatar_url: PERSONA_PILOT.avatar, visibility: 'private',
      is_public: true, town_name: PERSONA_PILOT.poble, bio: PERSONA_PILOT.bio, lema: PERSONA_PILOT.lema
    });
  });

  test('una altra persona, una sessió sense acreditar o la fila d’un altre compte, tal qual', () => {
    const fila = { id: ALTRE, full_name: '', avatar_url: GOOGLE };
    expect(hidrataPerfilPersonaPilot(fila, { id: ALTRE, email: 'altra@gmail.com' })).toBe(fila);
    expect(hidrataPerfilPersonaPilot(fila, null)).toBe(fila);
    /* La sessió és de la pilot, però la fila és d'un altre compte. */
    expect(hidrataPerfilPersonaPilot(fila, USUARI)).toBe(fila);
    /* GoTrue amb el correu sense confirmar: no hi ha hidratació. */
    const senseConfirmar = deGoTrue({ user_metadata: { avatar_url: GOOGLE } });
    const propia = { id: UUID, full_name: '', avatar_url: GOOGLE };
    expect(hidrataPerfilPersonaPilot(propia, senseConfirmar)).toBe(propia);
    for (const res of [null, undefined, 'text']) expect(hidrataPerfilPersonaPilot(res, USUARI)).toBe(res);
  });

  test('la fila de la llavor (per l’àlies) s’hidrata encara que la sessió no diga res', () => {
    expect(hidrataPerfilPersonaPilot({ id: AGENTS_MAP.JAVI.id, avatar_url: GOOGLE })).toMatchObject({
      avatar_url: PERSONA_PILOT.avatar, town_name: PERSONA_PILOT.poble
    });
  });
});

/* El fragment per al Mestre (supabase/snippets) escriu els MATEIXOS valors
   que PERSONA_PILOT: si el catàleg canvia, esta prova obliga a revisar-lo.
   Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 0 (correcció de
   la revisió) · L'alineació dels buits ja no publica la fitxa: tornar-la a
   executar no ha de desfer una tria privada posterior. La publicació és un
   fragment a banda, d'una sola vegada, i la previsualització va a la
   capçalera (l'editor només ensenya el resultat de l'última sentència). */
const llegixFragment = (nom) => readFileSync(path.join(process.cwd(), 'supabase/snippets', nom), 'utf8');
const senseComentarisSql = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const literal = (text) => `'${String(text).replace(/'/g, "''")}'`;

function comprovaFragmentSegur(SQL, CODI) {
  expect(CODI).not.toMatch(/\bvisibility\s*=/i);
  expect(SQL).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  expect(CODI).not.toMatch(/\b(delete from|truncate|insert into|alter table|create table|drop |grant |revoke )/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/\bupdate public\.profiles\b/gi) || []).length).toBe(1);
  // Cap consulta fora de la transacció: la previsualització va comentada a la capçalera.
  expect(CODI.slice(0, CODI.search(/^\s*begin;\s*$/im))).not.toMatch(/\bselect\b/i);
  expect(SQL).toMatch(/--\s+select p\.id/);
  expect(CODI).toMatch(/p\.baixa_demanada_at is null/);
  expect(CODI).toMatch(/SDP-PILOT-001/);
  expect(CODI).toContain(`lower(u.email) = ${literal(CORREU_PERSONA_PILOT)}`);
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline-first|local-first/i);
}

describe('supabase/snippets/2610181800_alinea_perfil_javi_llinares.sql', () => {
  const SQL = llegixFragment('2610181800_alinea_perfil_javi_llinares.sql');
  const CODI = senseComentarisSql(SQL);

  test('omple els buits amb els valors canònics de PERSONA_PILOT i resol el compte pel seu correu', () => {
    for (const [camp, valor] of [['full_name', PERSONA_PILOT.nom], ['town_name', PERSONA_PILOT.poble], ['bio', PERSONA_PILOT.bio], ['lema', PERSONA_PILOT.lema]]) {
      expect(CODI, camp).toContain(`${camp} = case when coalesce(btrim(p.${camp}), '') = '' then ${literal(valor)} else p.${camp} end`);
    }
    expect(CODI).toContain(`then ${literal(PERSONA_PILOT.avatar)}`);
  });

  test('no toca is_public: tornar-lo a executar no fa pública una fitxa que s’ha fet privada', () => {
    expect(CODI).not.toMatch(/is_public/);
    expect(SQL).toMatch(/EXECUTEU-LO UNA SOLA VEGADA/);
    expect(SQL).toContain('2610181800_publica_perfil_javi_llinares.sql');
  });

  test('mai visibility, cap UUID, cap esborrat ni cap canvi d’esquema; una sola transacció', () => {
    comprovaFragmentSegur(SQL, CODI);
  });
});

describe('supabase/snippets/2610181800_publica_perfil_javi_llinares.sql', () => {
  const SQL = llegixFragment('2610181800_publica_perfil_javi_llinares.sql');
  const CODI = senseComentarisSql(SQL);

  test('només is_public = true, una sola vegada i només si encara no ho és', () => {
    expect(CODI).toMatch(/set is_public = true\s/);
    expect(CODI).toMatch(/p\.is_public is distinct from true;/);
    expect(CODI).not.toMatch(/full_name|town_name|avatar_url|\bbio\b|\blema\b|hero_url/);
    expect(SQL).toMatch(/EXECUTEU-LO UNA SOLA VEGADA/);
    comprovaFragmentSegur(SQL, CODI);
  });
});
