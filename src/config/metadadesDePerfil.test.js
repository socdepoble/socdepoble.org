// @vitest-environment node
/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Les metadades socials d'una fitxa pública
   (metadadesDePerfil.js), la regla única del client (PerfilPublicSection) i del prerender del build:
   títol, descripció, imatge, clau pública, adreça canònica, schema i indexació. Que la projecció que fa el
   build d'una fila del directori és la mateixa fitxa que pinta el client (perfilDOrganitzacio) ho prova
   tooling/seo/fonts-veinals.test.mjs (ací no s'importa l'adaptador remot: el port és l'única porta). */
import { describe, expect, test } from 'vitest';
import {
  CLAUS_RESERVADES, FORMA_UUID, clauPublicaDePerfil, esClauReservadaPerAUnAltre, imatgeDePerfil, indexDePerfil, metadadesDePerfil,
  rutaPublicaDePerfil, schemaDePerfil, slugPotSerClau
} from './metadadesDePerfil.js';
import { CAP_SOCIAL_BASE, MARQUES } from './imatgeSocial.js';
import { AGENTS_MAP } from '../data/agentsSeed.js';
import { AGENTS_IA_SEED, ENTITATS_SEED, IAIA_ID, IDS_REMOTS_FUNDACIONALS, PERSONA_PILOT } from '../data/identitatsSeed.js';
import { ambReservaDelPaquet, perfilDeLaIADelPaquet, perfilDeLaPersonaPilot, perfilFundacionalDelPaquet } from '../sections/profile/perfilsDelPaquet.js';

const SUPABASE = 'https://exemple.supabase.co';
const OPCIONS = Object.freeze({ origen: 'https://socdepoble.org', supabaseUrl: SUPABASE, permesos: [] });
const PORTADA = 'sdp-media://mitjans/t1/u1/organitzacions/portada.webp';
const LOGO = 'sdp-media://mitjans/t1/u1/organitzacions/logo.webp';
const publica = (ref) => `${SUPABASE}/storage/v1/object/public/mitjans/${ref.split('mitjans/')[1]}`;
const OLI = Object.freeze({ tipus: 'entitat', id: '3073b933-69fc-4c3e-80dc-b0df9c6b8391', slug: 'olidelatorre', nom: 'Oli de La Torre',
  avatar: LOGO, hero: PORTADA, lema: 'El millor oli', bio: 'Almàssera', esIA: false, publicat: true });
const ALTRE = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';

describe('metadadesDePerfil: el head d’una fitxa', () => {
  test('títol = nom; descripció = lema i, sense, bio i, sense, la de reserva', () => {
    expect(metadadesDePerfil(OLI, OPCIONS)).toMatchObject({ title: 'Oli de La Torre', description: 'El millor oli' });
    expect(metadadesDePerfil({ ...OLI, lema: '' }, OPCIONS).description).toBe('Almàssera');
    expect(metadadesDePerfil({ ...OLI, lema: '  ', bio: '<p>Almàssera <b>familiar</b></p>' }, OPCIONS).description).toBe('Almàssera familiar');
    expect(metadadesDePerfil({ ...OLI, lema: '', bio: '' }, OPCIONS).description).toBe(CAP_SOCIAL_BASE.description);
    expect(metadadesDePerfil({ ...OLI, nom: '  <b>Oli</b> de La Torre ' }, OPCIONS).title).toBe('Oli de La Torre');
    expect(metadadesDePerfil(null, OPCIONS)).toEqual({ title: '', description: CAP_SOCIAL_BASE.description, imatge: { estat: 'absent' }, image: null });
    expect(metadadesDePerfil({ ...OLI, nom: 'x'.repeat(400), lema: 'y'.repeat(400) }, OPCIONS)).toMatchObject({ title: 'x'.repeat(160), description: 'y'.repeat(300) });
  });

  test('imatge = portada i, sense, avatar, resolta; una marca de Sóc de Poble o una reserva no compten; mai es passa a la segona', () => {
    expect(metadadesDePerfil(OLI, OPCIONS).image).toEqual({ url: publica(PORTADA), alt: 'Oli de La Torre' });
    expect(metadadesDePerfil({ ...OLI, hero: '' }, OPCIONS).image).toEqual({ url: publica(LOGO), alt: 'Oli de La Torre' });
    expect(metadadesDePerfil({ ...OLI, hero: '', avatar: '' }, OPCIONS)).toMatchObject({ imatge: { estat: 'absent' }, image: null });
    // La marca (el quadrat de 256 px) és una reserva: la targeta genèrica, mai el logotip com a imatge de pàgina.
    expect(imatgeDePerfil({ hero: '', avatar: MARQUES.avatar }, OPCIONS)).toEqual({ estat: 'absent' });
    expect(imatgeDePerfil({ hero: MARQUES.avatar, avatar: LOGO }, OPCIONS)).toMatchObject({ estat: 'triada', url: publica(LOGO) });
    // Una portada que no es pot servir queda bloquejada: no es passa a l'avatar.
    for (const hero of ['sdp-media://mitjans_privats/a/dni.webp', `${SUPABASE}/storage/v1/object/sign/mitjans/a.webp?token=x`, 'https://tercers.example/x.png', '/assets/logo.svg']) {
      expect(imatgeDePerfil({ hero, avatar: LOGO }, OPCIONS).estat, hero).toBe('bloquejada');
      expect(metadadesDePerfil({ ...OLI, hero }, OPCIONS).image, hero).toBeNull();
    }
    // Sense l'URL de Supabase, una foto del bucket no es pot fer absoluta.
    expect(imatgeDePerfil(OLI, { origen: OPCIONS.origen, permesos: [] }).estat).toBe('bloquejada');
    // Un asset propi amb variant social: la variant (la portada de la IAIA).
    expect(metadadesDePerfil(perfilDeLaIADelPaquet(AGENTS_IA_SEED[0]), OPCIONS).image).toEqual({
      url: 'https://socdepoble.org/assets/uploads/brain/iaia_maria_avatar-social-1200x630.jpg', alt: 'IAIA MarIA' });
    expect(metadadesDePerfil(perfilDeLaPersonaPilot(), OPCIONS).image.url).toBe(`https://socdepoble.org${AGENTS_MAP.JAVI.avatar_url}`);
  });

  test('el head no porta mai el correu, el poble, les dates ni la presentació', () => {
    const farcida = { ...OLI, correu: 'privat@exemple.org', poble: 'NO_EXPORTAR_POBLE', creat: '2026-01-01', presentacioHtml: '<p>COS_SENCER</p>', propietari: true };
    expect(JSON.stringify(metadadesDePerfil(farcida, OPCIONS))).not.toMatch(/privat@|NO_EXPORTAR|2026-01-01|COS_SENCER|propietari/);
  });
});

describe('la clau pública, l’adreça canònica, el schema i la indexació', () => {
  test('clauPublicaDePerfil: el slug si pot ser clau; si no (forma d’UUID o reservat amb un id no declarat), l’id', () => {
    expect(clauPublicaDePerfil(OLI)).toBe('olidelatorre');
    expect(clauPublicaDePerfil({ ...OLI, slug: null })).toBe(OLI.id);
    expect(clauPublicaDePerfil({ ...OLI, id: ALTRE, slug: OLI.id })).toBe(ALTRE);
    for (const slug of ['javi', 'javillinares', '0001', 'iaia-maria', 'iaia', 'soc-de-poble', 'socdepoble', 'rentonar', 'olidelatorre', IAIA_ID]) {
      expect(clauPublicaDePerfil({ tipus: 'entitat', id: ALTRE, slug }), slug).toBe(ALTRE);
      expect(slugPotSerClau(slug, ALTRE), slug).toBe(false);
      expect(esClauReservadaPerAUnAltre(slug, ALTRE), slug).toBe(true);
    }
    // Les identitats de veres fan servir el seu slug: l'id és un dels que declara la llavor.
    expect(slugPotSerClau('socdepoble', 'a240e870-4aef-4d92-b138-e8b4e2f2123a')).toBe(true);
    expect(slugPotSerClau('rentonar', 'B2C87505-53B1-4108-902F-2313E77B9968')).toBe(true);
    expect(esClauReservadaPerAUnAltre('forn', ALTRE)).toBe(false);
    expect(clauPublicaDePerfil(null)).toBe('');
    expect(FORMA_UUID.test(OLI.id) && !FORMA_UUID.test('olidelatorre')).toBe(true);
  });

  test('les claus reservades ixen de la llavor: ids, slugs i àlies de la persona pilot, de cada entitat i de cada IA, i dos amb motiu', () => {
    /* Onada R24.2 · També els ids remots que declara la llavor (IDS_REMOTS_FUNDACIONALS): hui, l'UUID de Javi. */
    const declarades = [PERSONA_PILOT.id, PERSONA_PILOT.slug, ...PERSONA_PILOT.alies, ...ENTITATS_SEED.flatMap((e) => [e.id, e.slug, ...e.alies]),
      ...AGENTS_IA_SEED.flatMap((a) => [a.id, a.slug]), ...Object.values(IDS_REMOTS_FUNDACIONALS).flat()].map((clau) => String(clau).toLowerCase());
    expect(CLAUS_RESERVADES).toContain('c7cc745b-2c54-4739-b9c1-add751aac3c4');
    expect([...CLAUS_RESERVADES].sort()).toEqual([...new Set([...declarades, 'soc-de-poble', 'iaia'])].sort());
  });

  test('rutaPublicaDePerfil: les adreces netes del Mestre i de la IAIA; /empresa/<slug>, /grup/<slug>, /gent/<id> i /perfil/<id> per a la resta', () => {
    expect(rutaPublicaDePerfil(perfilDeLaPersonaPilot())).toBe('/javillinares');
    expect(rutaPublicaDePerfil(perfilFundacionalDelPaquet('socdepoble'))).toBe('/socdepoble');
    expect(rutaPublicaDePerfil(perfilFundacionalDelPaquet('rentonar'))).toBe('/rentonar');
    expect(rutaPublicaDePerfil(perfilDeLaIADelPaquet(AGENTS_IA_SEED[0]))).toBe('/iaia');
    expect(rutaPublicaDePerfil(OLI)).toBe('/empresa/olidelatorre');
    expect(rutaPublicaDePerfil({ ...OLI, tipus: 'grup', slug: 'colla' })).toBe('/grup/colla');
    expect(rutaPublicaDePerfil({ tipus: 'persona', id: ALTRE, slug: null })).toBe(`/gent/${ALTRE}`);
    expect(rutaPublicaDePerfil({ tipus: 'ia', id: 'gall', slug: null })).toBe('/perfil/gall');
    // La fila de producció de l'entitat pilot i la de Rentonar (kind entity), pels seus ids declarats.
    expect(rutaPublicaDePerfil({ tipus: 'entitat', id: 'a240e870-4aef-4d92-b138-e8b4e2f2123a', slug: 'socdepoble' })).toBe('/socdepoble');
    expect(rutaPublicaDePerfil({ tipus: 'entitat', id: 'b2c87505-53b1-4108-902f-2313e77b9968', slug: 'rentonar' })).toBe('/rentonar');
    // Un homònim amb un id no declarat: la seua, pel seu id; mai la del Mestre.
    expect(rutaPublicaDePerfil({ tipus: 'entitat', id: ALTRE, slug: 'socdepoble' })).toBe(`/empresa/${ALTRE}`);
    expect(rutaPublicaDePerfil({ tipus: 'grup', id: ALTRE, slug: 'rentonar' })).toBe(`/grup/${ALTRE}`);
    expect(rutaPublicaDePerfil({ tipus: 'entitat', id: '', slug: '' })).toBeNull();
    expect(rutaPublicaDePerfil(null)).toBeNull();
  });

  test('schemaDePerfil i indexDePerfil', () => {
    expect([schemaDePerfil({ tipus: 'persona' }), schemaDePerfil(OLI), schemaDePerfil({ tipus: 'grup' }), schemaDePerfil({ tipus: 'ia' })])
      .toEqual(['Person', 'Organization', 'Organization', 'SoftwareApplication']);
    expect(indexDePerfil(OLI, '/empresa/olidelatorre')).toBe(true);
    expect(indexDePerfil(perfilDeLaIADelPaquet(AGENTS_IA_SEED[0]), '/iaia')).toBe(true);
    expect(indexDePerfil({ ...OLI, publicat: false }, '/empresa/olidelatorre')).toBe(false);
    for (const ruta of ['/perfil/gall', '/perfil', 'perfil/x', '', null]) expect(indexDePerfil(OLI, ruta), String(ruta)).toBe(false);
  });
});

describe('la reserva del paquet', () => {
  test('ambReservaDelPaquet és la regla del client: el servidor mana, llevat de la IA del paquet i de la persona pilot', () => {
    expect(ambReservaDelPaquet('olidelatorre', OLI)).toBe(OLI);
    expect(ambReservaDelPaquet('olidelatorre', null)).toBeNull();
    expect(ambReservaDelPaquet('iaia-maria', null).nom).toBe('IAIA MarIA');
    expect(ambReservaDelPaquet('iaia-maria', { ...OLI, slug: 'iaia-maria' }).nom).toBe('IAIA MarIA');
    expect(ambReservaDelPaquet('javillinares', { ...OLI, slug: 'javillinares' }).nom).toBe(PERSONA_PILOT.nom);
    expect(ambReservaDelPaquet('socdepoble', null).nom).toBe(AGENTS_MAP.SOCDEPOBLE.name);
  });
});
