/**
 * T3 (ordre del Mestre, 261001) · Qui signa un element de la llavor porta el
 * nom i l'avatar de la SEUA identitat (identitatsSeed · autoriaSeed). El Mac
 * Mini de la persona pilot pintava el logo de l'entitat perquè l'avatar era
 * una còpia escrita al producte i la identitat no en tenia cap de real.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { AGENTS_MAP } from './agentsSeed.js';
import { ENTITATS_SEED, PERSONA_PILOT, autoriaSeed, signaturaDeQuiSigna } from './identitatsSeed.js';
import { PERSONES_SEED, createLocalPerfilsAdapter } from './localPerfils.js';
import { XAT_SEED_IDS, XAT_SEED_MEMBRES } from './xatSeed.js';

/* Onada 8 (261009) · El logo de l'entitat pilot és el PNG (abans, l'SVG). */
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const FOTO = '/assets/fotos/javi-llinares-perfil-1200px.jpg';
/* Des de l'arrel del repositori (on corre vitest): en jsdom, import.meta.url no és file://. */
const fitxerDe = (carpeta, ruta) => join(process.cwd(), carpeta, ruta);

test('la persona pilot porta la foto del seu perfil, no el logo de l’entitat', () => {
  expect(PERSONA_PILOT.avatar).toBe(FOTO);
  expect(PERSONA_PILOT.avatar).not.toBe(ENTITATS_SEED[0].logo_url);
  /* Onada 11 (261010; prompt 261010_1730, tasca 6, D8) · També al catàleg
     d'agents: AGENTS_MAP.JAVI porta la foto, no la marca (Pedra Seca §11), i
     és la font única d'on PERSONA_PILOT la llig. */
  expect(AGENTS_MAP.JAVI.avatar_url).toBe(FOTO);
  expect(AGENTS_MAP.JAVI.avatar_url).not.toBe(AGENTS_MAP.SOCDEPOBLE.avatar_url);
  /* La foto existix a public/. Només es mira public/: wordpress-plugin/dist no
     es versiona (.gitignore · dist) i en un clon net o a la CI no hi és. El
     paquet del connector copia public/ sencer llevat dels ocults i de quatre
     noms de l'arrel (vite.standalone.config.js · PROPIS_DEL_LLOC), i per això
     existir ací ja vol dir viatjar al paquet després de build:wp. */
  expect(existsSync(fitxerDe('public', FOTO))).toBe(true);
});

test('per qualsevol àlies de la persona pilot: el seu nom i la seua foto', () => {
  expect(PERSONA_PILOT.alies).toEqual(['javillinares', '0001', 'javi', 'javi-llinares']);
  for (const id of PERSONA_PILOT.alies) {
    expect(autoriaSeed({ author_id: id })).toEqual({ tipus: 'persona', nom: 'Javi Llinares', avatar: FOTO });
  }
  expect(autoriaSeed({ owner_user_id: 'javillinares' })).toEqual({ tipus: 'persona', nom: 'Javi Llinares', avatar: FOTO });
});

test('per qualsevol àlies de l’entitat pilot: el seu nom i el seu logo', () => {
  for (const id of ENTITATS_SEED[0].alies) {
    expect(autoriaSeed({ author_entity_id: id })).toEqual({ tipus: 'entitat', nom: 'Sóc de Poble', avatar: LOGO });
  }
});

test('mana l’entitat (l’ordre d’autorDe): un element signat per l’entitat no porta la foto de la persona', () => {
  expect(autoriaSeed({ author_id: 'javillinares', author_entity_id: 'socdepoble' }).avatar).toBe(LOGO);
  // Una entitat que no és del padró no es resol, encara que hi haja una persona pilot.
  expect(autoriaSeed({ author_id: 'javillinares', author_entity_id: 'forn-de-la-torre' })).toBeNull();
});

test('una sola font: la fitxa local de la persona pilot, el seu perfil públic i la seua autoria porten la mateixa foto', () => {
  const perfils = createLocalPerfilsAdapter();
  const senseFoto = { id: '11111111-2222-4333-8444-555555555555', user_metadata: {} };
  // Abans la fitxa naixia amb '' (silueta) i la targeta amb la foto.
  expect(perfils.getProfile(senseFoto).avatar_url).toBe(PERSONA_PILOT.avatar);
  for (const clau of [senseFoto.id, ...PERSONA_PILOT.alies]) {
    expect(perfils.loadPerfilPublic(clau, senseFoto).avatar).toBe(PERSONA_PILOT.avatar);
  }
  // Sense sessió, la fitxa del catàleg de la persona pilot: la foto, no el logo que porta el catàleg.
  for (const clau of PERSONA_PILOT.alies) {
    expect(perfils.loadPerfilPublic(clau, null)).toMatchObject({ tipus: 'persona', id: '0001', avatar: PERSONA_PILOT.avatar });
  }
  expect(autoriaSeed({ author_id: 'javillinares' }).avatar).toBe(perfils.getProfile(senseFoto).avatar_url);
  // La foto de la sessió mana; llevar-la des de la fitxa es respecta (la silueta, no es torna a omplir).
  const ambFoto = { id: 'altra-sessio', user_metadata: { avatar_url: 'https://x.test/j.png' } };
  expect(perfils.getProfile(ambFoto).avatar_url).toBe('https://x.test/j.png');
  expect(perfils.updateProfile(senseFoto, { avatar_url: '' }).avatar_url).toBe('');
  expect(perfils.getProfile(senseFoto).avatar_url).toBe('');
  // Només canvia la persona pilot: l'entitat conserva el seu logo.
  expect(perfils.loadPerfilPublic('socdepoble', null).avatar).toBe(LOGO);
});

/* Onada 12 (261011; ordres 261011_0130, punt 3, D-09) · Ratificada la foto del
   padró com a cara de JAVI, «al padró de llavor i al xat». La fila de Javi al
   padró del xat anava sense avatar (avatarUrl null: la silueta) perquè el
   catàleg li posava el logotip de l'entitat. Ara els tres padrons de la llavor
   (catàleg d'agents, persones del poble i xat) diuen la mateixa foto, i cap
   la torna a escriure: tots la lligen de PERSONA_PILOT.avatar. */
test('D-09 · la persona pilot porta la mateixa foto al catàleg, al padró de persones i al padró del xat; l’entitat, el logotip', () => {
  const javiAlXat = XAT_SEED_MEMBRES.find((membre) => membre.usuariId === XAT_SEED_IDS.javi);
  expect(javiAlXat).toMatchObject({ usuariId: AGENTS_MAP.JAVI.id, tipus: 'persona', avatarUrl: FOTO });
  expect(javiAlXat.avatarUrl).toBe(PERSONA_PILOT.avatar);
  expect(PERSONES_SEED.map((persona) => [persona.id, persona.avatar])).toEqual([[AGENTS_MAP.JAVI.id, PERSONA_PILOT.avatar]]);
  // Cap fila de persona del padró del xat pinta la marca, i l'entitat la conserva.
  for (const membre of XAT_SEED_MEMBRES.filter((m) => m.tipus === 'persona')) expect(membre.avatarUrl).not.toBe(LOGO);
  expect(XAT_SEED_MEMBRES.find((membre) => membre.tipus === 'entitat').avatarUrl).toBe(LOGO);
  // Una sola font: la ruta de la foto només s'escriu al catàleg d'agents.
  const fonts = ['xatSeed.js', 'identitatsSeed.js', 'localPerfils.js', 'localXat.js'].map((nom) => readFileSync(fitxerDe('src/data', nom), 'utf8'));
  for (const font of fonts) expect(font).not.toContain('javi-llinares-perfil');
  expect(readFileSync(fitxerDe('src/data', 'agentsSeed.js'), 'utf8').match(/javi-llinares-perfil/g)).toHaveLength(1);
});

test('una identitat que no és del padró pilot no es resol: l’element conserva el que porta', () => {
  expect(autoriaSeed({ author_id: 'pepa' })).toBeNull();
  expect(autoriaSeed({})).toBeNull();
  expect(autoriaSeed(null)).toBeNull();
  // Una entitat buida no és cap entitat: signa la persona.
  expect(autoriaSeed({ author_entity_id: '', author_id: 'javi' }).avatar).toBe(FOTO);
});

/* Gauntlet 261016 · diürn 1530 (Bloc -1; ordre del Mestre: «Sempre és la
   seua foto personal de perfil») · El resolutor únic de qui signa. */
test('signaturaDeQuiSigna: la persona pilot porta SEMPRE el seu nom sencer i la seua foto', () => {
  const declarats = [
    {}, { nom: 'Javi', avatar: '' }, { nom: 'Javi', avatar: LOGO }, { avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' },
    { avatar: '/assets/fotos/una-altra.webp' }, { avatar: 'sdp-media://mitjans/T/U/avatars/a.webp' }, { avatar: 23 }
  ];
  for (const id of PERSONA_PILOT.alies) {
    for (const camp of ['author_id', 'owner_user_id', 'ownerUserId', 'author_user_id']) {
      for (const declarat of declarats) {
        expect(signaturaDeQuiSigna({ [camp]: id }, declarat)).toEqual({ nom: 'Javi Llinares', avatar: FOTO, personaPilot: true });
      }
    }
  }
});

test('signaturaDeQuiSigna: una entitat signant, un altre autor o un homònim conserven el que declara qui pinta', () => {
  const declarat = { nom: 'Declarat', avatar: '/assets/proves/declarat.webp' };
  const conserva = { ...declarat, personaPilot: false };
  // L'entitat té prioritat encara que la persona autora siga la pilot.
  expect(signaturaDeQuiSigna({ author_entity_id: 'socdepoble', author_id: 'javillinares' }, declarat)).toEqual(conserva);
  expect(signaturaDeQuiSigna({ author_org_id: 'entitat-remota', author_id: 'javillinares' }, declarat)).toEqual(conserva);
  // Un altre id, encara que el nom siga el de la pilot: el nom no identifica ningú.
  expect(signaturaDeQuiSigna({ author_id: 'persona-homonima', author_name: PERSONA_PILOT.nom }, declarat)).toEqual(conserva);
  expect(signaturaDeQuiSigna({ author_name: PERSONA_PILOT.nom }, declarat)).toEqual(conserva);
  // Sense declarat, undefined: qui pinta posa la seua reserva de sempre.
  expect(signaturaDeQuiSigna({ author_id: 'pepa' })).toEqual({ nom: undefined, avatar: undefined, personaPilot: false });
  expect(signaturaDeQuiSigna(null)).toEqual({ nom: undefined, avatar: undefined, personaPilot: false });
});
