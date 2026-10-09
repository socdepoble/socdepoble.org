/**
 * T3 (ordre del Mestre, 261001) · Qui signa un element de la llavor porta el
 * nom i l'avatar de la SEUA identitat (identitatsSeed · autoriaSeed). El Mac
 * Mini de la persona pilot pintava el logo de l'entitat perquè l'avatar era
 * una còpia escrita al producte i la identitat no en tenia cap de real.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { ENTITATS_SEED, PERSONA_PILOT, autoriaSeed } from './identitatsSeed.js';
import { createLocalPerfilsAdapter } from './localPerfils.js';

/* Onada 8 (261009) · El logo de l'entitat pilot és el PNG (abans, l'SVG). */
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const FOTO = '/assets/fotos/javi-llinares-perfil-1200px.jpg';
/* Des de l'arrel del repositori (on corre vitest): en jsdom, import.meta.url no és file://. */
const fitxerDe = (carpeta, ruta) => join(process.cwd(), carpeta, ruta);

test('la persona pilot porta la foto del seu perfil, no el logo de l’entitat', () => {
  expect(PERSONA_PILOT.avatar).toBe(FOTO);
  expect(PERSONA_PILOT.avatar).not.toBe(ENTITATS_SEED[0].logo_url);
  /* La foto existix a public/. Només es mira public/: wordpress-plugin/dist no
     es versiona (.gitignore · dist) i en un clon net o a la CI no hi és. El
     paquet del connector copia public/ sencer llevat dels ocults i de quatre
     noms de l'arrel (vite.standalone.config.js · PROPIS_DEL_LLOC), i per això
     existir ací ja vol dir viatjar al paquet després de build:wp. */
  expect(existsSync(fitxerDe('public', FOTO))).toBe(true);
});

test('per qualsevol àlies de la persona pilot: el seu nom i la seua foto', () => {
  for (const id of PERSONA_PILOT.alies) {
    expect(autoriaSeed({ author_id: id })).toEqual({ tipus: 'persona', nom: 'Javi', avatar: FOTO });
  }
  expect(autoriaSeed({ owner_user_id: 'javillinares' })).toEqual({ tipus: 'persona', nom: 'Javi', avatar: FOTO });
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

test('una identitat que no és del padró pilot no es resol: l’element conserva el que porta', () => {
  expect(autoriaSeed({ author_id: 'pepa' })).toBeNull();
  expect(autoriaSeed({})).toBeNull();
  expect(autoriaSeed(null)).toBeNull();
  // Una entitat buida no és cap entitat: signa la persona.
  expect(autoriaSeed({ author_entity_id: '', author_id: 'javi' }).avatar).toBe(FOTO);
});
