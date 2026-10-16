/* Gauntlet 261016 (Bloc 3.5.1 i 3.5.2; ordre del Mestre) · Les tres identitats
   que controla el Mestre (Javi Llinares, Sóc de Poble i Rentonar): una sola
   fitxa per a cadascuna, que qualsevol àlies seu resol, i el seu poble, La
   Torre de les Maçanes, a totes les fonts de la llavor (el catàleg, el padró i
   supabase/seed.sql). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { AGENTS_MAP } from './agentsSeed.js';
import {
  CLAUS_FUNDACIONALS, ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG, ENTITATS_SEED, IAIA_ID,
  IDS_REMOTS_FUNDACIONALS, PERSONA_PILOT, POBLE_FUNDACIONAL, clauFundacional, entitatSeed, fundacionalDeLaClau
} from './identitatsSeed.js';
import { createLocalPerfilsAdapter } from './localPerfils.js';
import { ONBOARDING_SEED } from './appSeed.js';

const USUARI = { id: '11111111-2222-4333-8444-555555555555', user_metadata: { full_name: 'Javi Llinares' } };

describe('el poble és innegociable', () => {
  test('les tres identitats són de La Torre de les Maçanes, al catàleg i al padró', () => {
    expect(POBLE_FUNDACIONAL).toBe('La Torre de les Maçanes');
    expect([AGENTS_MAP.SOCDEPOBLE.town_name, AGENTS_MAP.JAVI.town_name]).toEqual([POBLE_FUNDACIONAL, POBLE_FUNDACIONAL]);
    expect(ENTITATS_SEED.map((entitat) => [entitat.id, entitat.town_name]))
      .toEqual([[ENTITAT_PILOT_ID, POBLE_FUNDACIONAL], [ENTITAT_RENTONAR_SLUG, POBLE_FUNDACIONAL]]);
  });

  test('cap entitat del padró, cap agent del catàleg ni cap fitxa pública de la llavor ix sense poble', () => {
    for (const entitat of ENTITATS_SEED) expect([entitat.id, entitat.town_name.trim().length > 0]).toEqual([entitat.id, true]);
    for (const agent of Object.values(AGENTS_MAP)) expect([agent.id, Boolean(agent.town_name?.trim())]).toEqual([agent.id, true]);
    const perfils = createLocalPerfilsAdapter();
    for (const usuari of [null, USUARI]) {
      for (const clau of CLAUS_FUNDACIONALS) {
        expect([clau, perfils.loadPerfilPublic(clau, usuari)?.poble]).toEqual([clau, POBLE_FUNDACIONAL]);
      }
    }
  });
});

describe('un sol perfil per identitat', () => {
  test('el slug declarat de la persona pilot és el de la seua ruta neta; els àlies d’abans es conserven', () => {
    expect(PERSONA_PILOT.slug).toBe('javillinares');
    expect(PERSONA_PILOT.alies).toEqual(expect.arrayContaining(['javillinares', AGENTS_MAP.JAVI.id, 'javi', 'javi-llinares']));
  });

  test('tots els àlies de cada identitat resolen la MATEIXA fitxa, amb sessió i sense', () => {
    const perfils = createLocalPerfilsAdapter();
    const grups = [
      ['javillinares', PERSONA_PILOT.alies],
      [ENTITAT_PILOT_SLUG, entitatSeed(ENTITAT_PILOT_ID).alies],
      [ENTITAT_RENTONAR_SLUG, entitatSeed(ENTITAT_RENTONAR_SLUG).alies]
    ];
    for (const usuari of [null, USUARI]) {
      for (const [clau, alies] of grups) {
        const ids = new Set(alies.map((a) => perfils.loadPerfilPublic(a, usuari)?.id));
        expect([clau, usuari?.id ?? null, ids.size, ids.has(undefined)]).toEqual([clau, usuari?.id ?? null, 1, false]);
        expect(clauFundacional(perfils.loadPerfilPublic(clau, usuari))).toBe(clau);
      }
    }
    /* Amb sessió (regla del mode seed), la fitxa de la persona pilot és la de
       la sessió, i porta el slug declarat. */
    expect(perfils.loadPerfilPublic('javillinares', USUARI)).toMatchObject({ id: USUARI.id, slug: 'javillinares', tipus: 'persona' });
    expect(perfils.loadPerfilPublic('javillinares', null)).toMatchObject({ id: AGENTS_MAP.JAVI.id, tipus: 'persona' });
  });

  test('la plantilla d’alta no alça cap segon «Sóc de Poble»: el slug és el declarat, al codi i a supabase/seed.sql', () => {
    expect([ONBOARDING_SEED.company.slug, ONBOARDING_SEED.group.parentSlug]).toEqual([ENTITAT_PILOT_SLUG, ENTITAT_PILOT_SLUG]);
    const sql = readFileSync(path.join(process.cwd(), 'supabase/seed.sql'), 'utf8');
    const fila = /'onboarding', '(.*?)'::jsonb/.exec(sql)?.[1];
    expect(fila).toBeDefined();
    const onboarding = JSON.parse(fila.replaceAll("''", "'"));
    expect([onboarding.company.slug, onboarding.group.slug, onboarding.group.parentSlug])
      .toEqual([ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG, ENTITAT_PILOT_SLUG]);
    expect(sql).not.toContain('"slug":"soc-de-poble"');
    expect(sql).not.toContain('"parentSlug":"soc-de-poble"');
  });

  test('supabase/seed.sql: el catàleg porta el poble de Sóc de Poble i de Javi Llinares, i cap «Sóc de Poble» com a poble', () => {
    const sql = readFileSync(path.join(process.cwd(), 'supabase/seed.sql'), 'utf8');
    const fila = /'agents', '(.*?)'::jsonb/.exec(sql)?.[1];
    const agents = JSON.parse(fila.replaceAll("''", "'"));
    const poble = (id) => agents.find((agent) => agent.id === id)?.town_name;
    expect([poble(ENTITAT_PILOT_ID), poble(AGENTS_MAP.JAVI.id)]).toEqual([POBLE_FUNDACIONAL, POBLE_FUNDACIONAL]);
    expect(agents.filter((agent) => agent.town_name === 'Sóc de Poble').map((agent) => agent.id)).toEqual([]);
    expect(sql).not.toContain('"town_name":"Sóc de Poble"');
  });
});

/* Revisió adversarial del Gauntlet 261016 (encàrrec C; troballes «reconeix
   per UUID una organització d'un altre poble» i «només pel slug») · El slug
   només és únic dins d'un poble i el tria qui crea l'organització: un altre
   poble, o un veí que el prenga abans que el Mestre, en té un d'igual. Una de
   les tres identitats es reconeix NOMÉS per un id o un àlies que declara la
   llavor i, en remot, per l'id del servidor que la llavor declara
   (IDS_REMOTS_FUNDACIONALS). */
describe('clauFundacional, estricta: només identificadors declarats', () => {
  const UUID_ALTRE_POBLE = '0c1d2e3f-4051-4a62-8b73-94a5b6c7d8e9';
  const UUID_SDP = '6c1d2e3f-4051-4b62-8c73-8d94ea5fb607';
  const UUID_RENTONAR = '7d2e3f40-5162-4c73-8d84-9ea5fb607182';
  const UUID_JAVI = '8e3f4051-6273-4d84-9e95-afb607182938';
  const DECLARATS = Object.freeze({ javillinares: [UUID_JAVI], socdepoble: [UUID_SDP], rentonar: [UUID_RENTONAR] });

  test('homònim · un grup «rentonar» o una empresa «socdepoble» d’un altre poble no és cap de les tres', () => {
    expect(clauFundacional({ tipus: 'grup', id: UUID_ALTRE_POBLE, slug: ENTITAT_RENTONAR_SLUG })).toBeNull();
    expect(clauFundacional({ tipus: 'entitat', id: UUID_ALTRE_POBLE, slug: ENTITAT_PILOT_SLUG })).toBeNull();
    /* Ni una organització que prenga el slug de la persona. */
    expect(clauFundacional({ tipus: 'entitat', id: UUID_ALTRE_POBLE, slug: PERSONA_PILOT.slug })).toBeNull();
    /* Tampoc amb uns ids remots declarats: l'homònim no és cap d'ells. */
    expect(clauFundacional({ tipus: 'grup', id: UUID_ALTRE_POBLE, slug: ENTITAT_RENTONAR_SLUG }, { idsRemots: DECLARATS })).toBeNull();
  });

  test('per l’id o un àlies de la llavor, sí, amb el tipus que toca', () => {
    expect(clauFundacional({ tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG })).toBe(ENTITAT_PILOT_SLUG);
    expect(clauFundacional({ tipus: 'entitat', id: 'soc-de-poble_official', slug: null })).toBe(ENTITAT_PILOT_SLUG);
    expect(clauFundacional({ tipus: 'grup', id: ENTITAT_RENTONAR_SLUG, slug: ENTITAT_RENTONAR_SLUG })).toBe(ENTITAT_RENTONAR_SLUG);
    expect(clauFundacional({ tipus: 'grup', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG })).toBeNull();
    expect(clauFundacional({ tipus: 'persona', id: AGENTS_MAP.JAVI.id, slug: null })).toBe(PERSONA_PILOT.slug);
  });

  test('en remot, només amb l’id del servidor que declara la llavor; hui no se’n declara cap', () => {
    expect(Object.keys(IDS_REMOTS_FUNDACIONALS)).toEqual(CLAUS_FUNDACIONALS);
    expect(Object.isFrozen(IDS_REMOTS_FUNDACIONALS)).toBe(true);
    for (const ids of Object.values(IDS_REMOTS_FUNDACIONALS)) expect([Object.isFrozen(ids), ids.length]).toEqual([true, 0]);
    expect(clauFundacional({ tipus: 'entitat', id: UUID_SDP, slug: ENTITAT_PILOT_SLUG })).toBeNull();
    expect(clauFundacional({ tipus: 'entitat', id: UUID_SDP, slug: ENTITAT_PILOT_SLUG }, { idsRemots: DECLARATS })).toBe(ENTITAT_PILOT_SLUG);
    /* El slug del servidor no hi compta: l'id declarat, encara que no en porte cap o en porte un altre. */
    expect(clauFundacional({ tipus: 'grup', id: UUID_RENTONAR, slug: 'un-altre' }, { idsRemots: DECLARATS })).toBe(ENTITAT_RENTONAR_SLUG);
    expect(clauFundacional({ tipus: 'grup', id: UUID_RENTONAR.toUpperCase(), slug: null }, { idsRemots: DECLARATS })).toBe(ENTITAT_RENTONAR_SLUG);
    expect(clauFundacional({ tipus: 'persona', id: UUID_JAVI, slug: null }, { idsRemots: DECLARATS })).toBe(PERSONA_PILOT.slug);
    /* Amb el tipus d'una altra identitat, no. */
    expect(clauFundacional({ tipus: 'entitat', id: UUID_RENTONAR, slug: null }, { idsRemots: DECLARATS })).toBeNull();
    expect(clauFundacional({ tipus: 'persona', id: UUID_SDP, slug: null }, { idsRemots: DECLARATS })).toBeNull();
  });

  test('fundacionalDeLaClau: la clau que es demana, per id, àlies o slug declarat a la llavor; mai pel nom', () => {
    for (const alies of PERSONA_PILOT.alies) expect([alies, fundacionalDeLaClau(alies)]).toEqual([alies, PERSONA_PILOT.slug]);
    for (const alies of entitatSeed(ENTITAT_PILOT_ID).alies) expect([alies, fundacionalDeLaClau(alies)]).toEqual([alies, ENTITAT_PILOT_SLUG]);
    expect(fundacionalDeLaClau(` ${ENTITAT_RENTONAR_SLUG} `)).toBe(ENTITAT_RENTONAR_SLUG);
    for (const clau of ['Javi Llinares', 'Sóc de Poble', 'Rentonar', 'forn', '', null, undefined, UUID_ALTRE_POBLE, IAIA_ID, 'iaia-maria']) {
      expect([clau, fundacionalDeLaClau(clau)]).toEqual([clau, null]);
    }
    expect(fundacionalDeLaClau(UUID_SDP)).toBeNull();
    expect(fundacionalDeLaClau(UUID_SDP.toUpperCase(), { idsRemots: DECLARATS })).toBe(ENTITAT_PILOT_SLUG);
    expect(fundacionalDeLaClau(UUID_JAVI, { idsRemots: DECLARATS })).toBe(PERSONA_PILOT.slug);
  });
});
