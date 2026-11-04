// @vitest-environment node
/* P1-23 · src/data/exportaMunicipiOpenData.js, l'exportació Open Data per
   municipi. Cada bloc cau amb un mutant (gauntlet p123/b): llista blanca
   trencada, persones dins, `|| slug` de Gemini, dates inventades, claus sense
   ordenar, llistes sense ordenar, ZIP sense ordre, CRC o data DOS mudats,
   manifest incoherent, verificador que no compara, llicència de sèrie,
   Markdown sense escapar, recollida sense filtre o sense sostre.
   Les dades són l'acte real de la llavor (eventsSeed.js) i fixtures de prova
   amb trampes (.invalid, 203.0.113.0/24): cap publicació real inventada. Cap
   xarxa. Les eines de fora (unzip, python3, shasum) només si hi són. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { normalitzaSlugMunicipi, urlsDeMunicipi } from './activitypub.js';
import { LIMIT_DADES_OBERTES, LIMIT_DIRECTORI_ENTITATS } from './contracte.js';
import {
  FORMAT_DADES_OBERTES, VERSIO_FORMAT, empaquetaZip, escapaMarkdown, exportaMunicipiOpenData, imatgeDe, jsonCanonic, llicenciaDe,
  preparaDadesObertesMunicipi, recullDadesPubliquesDelMunicipi, textDeCos, verificaPaquetOpenData
} from './exportaMunicipiOpenData.js';
import { elementDeFilaPublicada } from './mapejadorSeccions.js';
import { CALENDAR_EVENTS } from '../sections/mur/eventsSeed.js';
import { MOCK_TOWNS } from '../sections/pobles/townsSeed.js';
import { creaEsdeveniment } from '../utils/esdeveniment.js';
import { creaZip, llegeixZip } from '../utils/fulls/zip.js';
import { aIcs } from '../utils/ics.js';

const TORRE = Object.freeze({ slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });
const ARA = '2026-10-30T00:00:00Z';
const ORIGEN = 'https://socdepoble.org';
const ARREL = `dades-obertes-${TORRE.slug}`;
const descodifica = (bytes) => new TextDecoder().decode(bytes);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/* Valors que no han d'eixir mai, en cap byte del paquet. */
const TRAMPES = Object.freeze({
  correu: 'veina.trampa@exemple.invalid',
  usuari: '0b0e0000-0000-4000-8000-00000000dead',
  telefon: '+34 600 000 999',
  membre: 'usuari-membre-trampa',
  alies: 'alies-trampa-privat',
  html: '<script>alert("trampa")</script>',
  ip: '203.0.113.77',
  persona: 'Veïna Trampa De Prova',
  supabase: 'https://projecte-trampa.supabase.co'
});

const noticiaEntitat = () => ({
  id: 'ban-aigua',
  title: 'Tall d’aigua dimecres',
  entradilla: 'Avís de l’ajuntament de prova.',
  body: '<p>Primer paràgraf &amp; segon.</p><p>Tercer <b>fort</b>.</p>',
  created_at: '2026-10-20T08:00:00+02:00',
  updated_at: '2026-10-21T09:00:00Z',
  author_entity_id: 'ajuntament-de-prova',
  author_name: 'Ajuntament de prova',
  poble_id: TORRE.slug,
  copyright: 'CC BY 4.0',
  image_url: '/assets/prova/ban.jpg',
  /* Fora de la llista blanca. */
  email: TRAMPES.correu,
  telefon: TRAMPES.telefon,
  ip: TRAMPES.ip,
  usuariId: TRAMPES.usuari,
  presentacio_html: TRAMPES.html,
  geolocalitzacio: { lat: 38.59191, lng: -0.41842 }
});
const PERSONES = Object.freeze([
  { id: 'veina-1', title: TRAMPES.persona, owner_user_id: TRAMPES.usuari, poble_id: TORRE.slug, created_at: '2026-10-01T10:00:00Z' },
  { id: 'veina-2', title: TRAMPES.persona, author_id: TRAMPES.membre, poble_id: TORRE.slug },
  { id: 'entitat-nomes-membres', title: 'Signada per una entitat, llegida per membres', owner_user_id: TRAMPES.usuari, author_org_id: 'org-de-prova', poble_id: TORRE.slug },
  { id: 'sense-autoria', title: 'Sense ningú que la signe', poble_id: TORRE.slug }
]);
const fila = (extra = {}) => ({
  id: '7d1f0000-0000-4000-8000-000000000001',
  tenant_id: '11111111-2222-3333-4444-555555555555',
  slug: 'rentonar',
  name: 'Rentonar',
  kind: 'entity',
  parent_organization_id: null,
  lema: 'Natura i Patrimoni',
  description: 'Grup de treball de l’Associació ecologista El Rentonar.',
  logo_url: 'sdp-media://mitjans/rentonar/logo.png',
  hero_url: `${TRAMPES.supabase}/storage/v1/object/public/mitjans/rentonar/portada.webp`,
  presentacio_html: TRAMPES.html,
  copyright: '',
  town_name: TORRE.nom,
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-02T10:00:00Z',
  /* Fora del contracte i de la llista blanca. */
  email: TRAMPES.correu,
  membres: [{ usuariId: TRAMPES.usuari, nom: TRAMPES.persona }],
  alies: [TRAMPES.alies],
  ...extra
});
const ENTITATS = Object.freeze([
  fila(),
  fila({ id: '7d1f0000-0000-4000-8000-000000000002', slug: 'forn-de-prova', name: 'Forn de prova', kind: 'company', parent_organization_id: '7d1f0000-0000-4000-8000-000000000001', copyright: 'CC BY-SA 4.0', hero_url: null }),
  fila({ id: '7d1f0000-0000-4000-8000-000000000003', slug: 'privada', name: TRAMPES.persona, visibility: 'private' }),
  fila({ id: '7d1f0000-0000-4000-8000-000000000004', slug: 'de-penaguila', name: 'De Penàguila', town_name: 'Penàguila' }),
  fila({ id: '7d1f0000-0000-4000-8000-000000000005', slug: 'sense-poble', name: 'Sense poble', town_name: null })
]);

/* Un acte de La Torre signat per l'entitat del directori de prova (Rentonar),
   amb un author_name de persona en text lliure: el nom ha d'eixir del
   directori, mai d'ací. */
const RENTONAR = '7d1f0000-0000-4000-8000-000000000001';
const acteEntitat = () => ({
  id: 'festa-de-prova',
  title: 'Festa de prova',
  date: '2026-08-15',
  time: '22:00',
  location: 'Plaça de prova',
  poble_id: TORRE.slug,
  author_org_id: RENTONAR,
  author_name: TRAMPES.persona,
  copyright: 'CC BY 4.0',
  created_at: '2026-08-01T10:00:00Z',
  updated_at: '2026-08-02T10:00:00Z',
  email: TRAMPES.correu
});

const exporta = (extra = {}) => exportaMunicipiOpenData({ municipi: TORRE, ara: ARA, origen: ORIGEN, ...extra });
const prepara = (extra = {}) => preparaDadesObertesMunicipi({ municipi: TORRE, ara: ARA, origen: ORIGEN, ...extra });
const fitxerDe = (preparat, nom) => preparat.fitxers.find((f) => f.nom === nom).text;
const grafDe = (preparat, nom) => JSON.parse(fitxerDe(preparat, nom))['@graph'];
const totElText = (resultat) => llegeixZip(resultat.zip).map(({ dades }) => descodifica(dades)).join('\n');
const COMPLET = () => ({ noticies: [noticiaEntitat(), ...PERSONES], agenda: [...CALENDAR_EVENTS, acteEntitat()], entitats: ENTITATS });
/* Un «<» que obriria marcatge en HTML (lletra, «/», «!» o «?» darrere). */
const MARCATGE = /<[A-Za-z/!?]/;

/* Cap clau amb undefined, null o '' en tot l'arbre (defecte 9 del codi de Gemini). */
function clausBuides(valor, cami = '$') {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => clausBuides(v, `${cami}[${i}]`));
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([clau, v]) => (v === undefined || v === null || v === ''
      ? [`${cami}.${clau}`] : clausBuides(v, `${cami}.${clau}`)));
  }
  return [];
}
/* Els objectes amb les claus fora d'ordre (camí de cadascun). */
function clausDesordenades(valor, cami = '$') {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => clausDesordenades(v, `${cami}[${i}]`));
  if (valor && typeof valor === 'object') {
    const claus = Object.keys(valor);
    const propi = claus.join('\u0000') === [...claus].sort().join('\u0000') ? [] : [cami];
    return [...propi, ...claus.flatMap((clau) => clausDesordenades(valor[clau], `${cami}.${clau}`))];
  }
  return [];
}

/* Les capçaleres locals del ZIP llegides a mà (APPNOTE 4.3.7), sense zip.js. */
function capcaleresLocals(zip) {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const entrades = [];
  let pos = 0;
  while (pos + 30 <= zip.length && v.getUint32(pos, true) === 0x04034b50) {
    const [llargNom, llargExtra, mida] = [v.getUint16(pos + 26, true), v.getUint16(pos + 28, true), v.getUint32(pos + 18, true)];
    const inici = pos + 30 + llargNom + llargExtra;
    entrades.push({
      nom: descodifica(zip.subarray(pos + 30, pos + 30 + llargNom)),
      metode: v.getUint16(pos + 8, true), hora: v.getUint16(pos + 10, true), data: v.getUint16(pos + 12, true),
      crc: v.getUint32(pos + 14, true), comprimida: v.getUint32(pos + 18, true), mida: v.getUint32(pos + 22, true),
      dades: zip.subarray(inici, inici + mida)
    });
    pos = inici + mida;
  }
  return entrades;
}
/* CRC-32 bit a bit (polinomi reflectit 0xEDB88320), independent de la taula de zip.js. */
function crcBitABit(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) {
    c ^= b;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}
const tempsDe = (funcio) => { const t0 = performance.now(); funcio(); return performance.now() - t0; };
const eina = (ordre) => spawnSync(ordre, ['--version'], { encoding: 'utf8' }).error?.code !== 'ENOENT';

afterEach(() => { vi.useRealTimers(); });

describe('privacitat: llista blanca de camps i cap persona física', () => {
  test('cap valor de les trampes ix a cap byte del paquet, ni l’URL de Supabase ni l’HTML d’usuari', async () => {
    const r = await exporta(COMPLET());
    const tot = totElText(r);
    for (const valor of Object.values(TRAMPES)) expect(tot, valor).not.toContain(valor);
    for (const clau of ['email', 'usuariId', 'owner_user_id', 'membres', 'alies', 'presentacio_html', 'telefon', 'geolocalitzacio', 'tenant_id']) {
      expect(tot, clau).not.toContain(`"${clau}"`);
    }
    expect(tot).not.toContain('<script');
  });

  test('les publicacions de persones i del veïnat no ixen; les omissions només són recomptes', () => {
    const p = prepara(COMPLET());
    expect(grafDe(p, 'noticies.jsonld').map((n) => n.identifier)).toEqual(['ban-aigua']);
    expect(p.omissions.noticies).toMatchObject({ persones: 2, nomesMembres: 1, senseEntitat: 1 });
    /* email, telefon, ip, usuariId, presentacio_html, geolocalitzacio i author_name (el nom ix del directori). */
    expect(p.omissions.noticies.campsDescartats).toBe(7);
    expect(JSON.stringify(p.omissions)).not.toMatch(/veina|trampa|exemple\.invalid/i);
  });

  test('la forma REAL d’una publicació del veïnat (elementDeFilaPublicada) no ix mai, tampoc signada per una entitat', () => {
    const delVeinat = (extra) => elementDeFilaPublicada({
      id: `sub-${Object.keys(extra).join('-')}`,
      payload: { title: 'Publicació del veïnat', poble_id: TORRE.slug, body: 'només per a membres', author_name: TRAMPES.persona },
      createdAt: '2026-10-01T10:00:00Z',
      ...extra
    });
    const amb = delVeinat({ ownerUserId: TRAMPES.usuari, authorOrgId: 'org-de-prova' });
    expect(Object.keys(amb)).toEqual(expect.arrayContaining(['ownerUserId', 'author_org_id', 'authorOrgId']));
    expect(amb).not.toHaveProperty('owner_user_id');
    const casos = [
      [amb, 'nomesMembres'],
      [delVeinat({ ownerUserId: TRAMPES.usuari }), 'persones'],
      /* El mapejador hi posa ownerUserId: null: la fila és de section_submissions igualment. */
      [delVeinat({ authorOrgId: 'org-de-prova' }), 'nomesMembres']
    ];
    for (const [element, motiu] of casos) {
      const p = prepara({ noticies: [element] });
      expect(p.comptes.noticies, element.id).toBe(0);
      expect(p.omissions.noticies, element.id).toMatchObject({ [motiu]: 1 });
      expect(fitxerDe(p, 'noticies.jsonld')).not.toContain('Publicació del veïnat');
    }
  });

  test('authorOrgId (camelCase) és l’entitat que signa, amb persona propietària o sense', () => {
    const base = { id: 'signada', title: 'Signada', poble_id: TORRE.slug, authorOrgId: 'org-de-prova' };
    expect(prepara({ noticies: [{ ...base, owner_user_id: TRAMPES.usuari }] }).omissions.noticies).toMatchObject({ nomesMembres: 1 });
    const [noticia] = grafDe(prepara({ noticies: [base] }), 'noticies.jsonld');
    expect(noticia.author).toEqual({ '@type': 'Organization', identifier: 'org-de-prova' });
  });

  test('una entitat de l’administració amb author_id continua sent de l’entitat (regla de autorDe), i l’author_id no ix', () => {
    const p = prepara({ noticies: [{ id: 'avis-oficial', title: 'Avís', author_entity_id: 'socdepoble', author_id: 'soc-de-poble_official', poble_id: TORRE.slug }] });
    expect(grafDe(p, 'noticies.jsonld')).toHaveLength(1);
    expect(fitxerDe(p, 'noticies.jsonld')).not.toContain('soc-de-poble_official');
  });

  test('el Mercat, les claus desconegudes i un municipi de mostra (MOCK_TOWNS) s’aturen', () => {
    expect(() => prepara({ mercat: [] })).toThrow(/Mercat/);
    expect(() => prepara({ publicacions: [] })).toThrow(/no admés: publicacions/);
    expect(() => preparaDadesObertesMunicipi({ municipi: MOCK_TOWNS[0], ara: ARA })).toThrow(/Camp de municipi no admés/);
  });
});

describe('el poble de cada element (defecte 9: un element sense poble NO és del poble)', () => {
  const base = { title: 'Prova', author_entity_id: 'socdepoble' };
  test('declarat, deduït del lloc de l’element pel nom sencer, d’un altre poble o sense poble', () => {
    const p = prepara({
      noticies: [
        { ...base, id: 'declarada', poble_id: TORRE.slug },
        { ...base, id: 'per-uuid', poble_id: '11111111-2222-3333-4444-555555555555' },
        { ...base, id: 'deduida', town_name: TORRE.nom },
        { ...base, id: 'pel-lloc', location: TORRE.nom },
        { ...base, id: 'principal', town_name: `${TORRE.nom} · Penàguila` },
        { ...base, id: 'mana-el-declarat', poble_id: 'penaguila', town_name: TORRE.nom },
        { ...base, id: 'nom-a-mitges', town_name: 'La Torre' },
        { ...base, id: 'segon-poble', town_name: `Penàguila · ${TORRE.nom}` },
        /* El lloc de qui signa no diu on passa res. */
        { ...base, id: 'nomes-qui-signa', author_location: TORRE.nom },
        { ...base, id: 'lloc-d-un-altre', location: 'Benillup', author_location: TORRE.nom },
        { ...base, id: 'sense-poble' }
      ]
    });
    expect(grafDe(p, 'noticies.jsonld').map((n) => n.identifier).sort()).toEqual(['declarada', 'deduida', 'pel-lloc', 'principal']);
    expect(p.omissions.noticies).toMatchObject({ altresPobles: 5, sensePoble: 2 });
    const ambId = preparaDadesObertesMunicipi({ municipi: { ...TORRE, id: '11111111-2222-3333-4444-555555555555' }, ara: ARA, noticies: [{ ...base, id: 'per-uuid', poble_id: '11111111-2222-3333-4444-555555555555' }] });
    expect(grafDe(ambId, 'noticies.jsonld')).toHaveLength(1);
    expect(fitxerDe(p, 'memoria.md')).toMatch(/\(`deduida`\)\n {2}.*Poble deduït del lloc, no declarat\./);
    expect(fitxerDe(p, 'memoria.md')).not.toMatch(/\(`declarada`\)\n {2}.*Poble deduït/);
  });

  test('l’Aplec de la llavor es fa a Benillup i el signa una entitat de La Torre: no és de La Torre', () => {
    const [aplec] = CALENDAR_EVENTS;
    expect(aplec.author_location).toBe(TORRE.nom);
    expect(aplec.entradilla).toContain('a Benillup');
    const torre = prepara({ agenda: CALENDAR_EVENTS });
    expect(torre.comptes.agenda).toBe(0);
    expect(torre.omissions.agenda).toMatchObject({ sensePoble: 1 });
    expect(fitxerDe(torre, 'agenda.jsonld')).not.toContain('aplec-2023');
    /* Sense poble_id ni lloc, tampoc no s'afirma de Benillup: no es deduïx del text. */
    const benillup = preparaDadesObertesMunicipi({ municipi: { nom: 'Benillup' }, ara: ARA, agenda: CALENDAR_EVENTS });
    expect(benillup.comptes.agenda).toBe(0);
    expect(benillup.omissions.agenda).toMatchObject({ sensePoble: 1 });
  });

  test('el directori: només el poble que declara town_name, només les públiques', () => {
    const p = prepara({ entitats: ENTITATS });
    const directori = grafDe(p, 'directori.jsonld');
    expect(directori.map((e) => e.name)).toEqual(['Forn de prova', 'Rentonar']);
    expect(p.omissions.directori).toMatchObject({ noPubliques: 1, altresPobles: 1, sensePoble: 1 });
    expect(directori[0]['@type']).toBe('LocalBusiness');
    expect(directori[0].parentOrganization).toEqual({ '@id': `directori.jsonld#${RENTONAR}` });
    expect(directori[1]).toMatchObject({ '@type': 'Organization', alternateName: 'rentonar', slogan: 'Natura i Patrimoni', location: { '@id': `municipi.jsonld#${TORRE.slug}` } });
  });
});

describe('cap contingut inventat (defectes del codi de Gemini)', () => {
  test('sense data de publicació real no n’hi ha cap: mai `ara`', () => {
    const p = prepara({ noticies: [{ id: 'sense-data', title: 'Sense data', author_entity_id: 'socdepoble', poble_id: TORRE.slug }], agenda: [{ id: 'acte-sense-dia', title: 'Acte', author_entity_id: 'socdepoble', poble_id: TORRE.slug }] });
    const [noticia] = grafDe(p, 'noticies.jsonld');
    const [acte] = grafDe(p, 'agenda.jsonld');
    expect(noticia).not.toHaveProperty('datePublished');
    expect(acte).not.toHaveProperty('startDate');
    for (const nom of ['noticies.jsonld', 'agenda.jsonld', 'directori.jsonld', 'municipi.jsonld']) expect(fitxerDe(p, nom)).not.toContain('2026-10-30');
  });

  test('el municipi no porta cap descripció, comarca, població ni coordenada que no li passen', () => {
    const municipi = JSON.parse(fitxerDe(prepara(), 'municipi.jsonld'));
    expect(Object.keys(municipi).sort()).toEqual(['@context', '@id', '@type', 'identifier', 'name']);
    const ambActor = JSON.parse(fitxerDe(prepara({ actorsPublicats: [TORRE.slug] }), 'municipi.jsonld'));
    expect(Object.keys(ambActor).sort()).toEqual(['@context', '@id', '@type', 'identifier', 'name', 'subjectOf', 'url']);
    const tot = prepara().fitxers.map((f) => f.text).join('\n');
    for (const inventat of ['Alacant', 'Muntanya', "L'Alacantí", '700 hab', 'Foia']) expect(tot).not.toContain(inventat);
  });

  test('cap rastre de la subvenció ni cap clau buida', async () => {
    const r = await exporta(COMPLET());
    const tot = totElText(r);
    for (const prohibit of ['fediversityGrant', '2026-08-1a6', 'Fediversity']) expect(tot).not.toContain(prohibit);
    for (const { nom, dades } of llegeixZip(r.zip)) {
      if (/\.(json|jsonld)$/.test(nom)) expect(clausBuides(JSON.parse(descodifica(dades))), nom).toEqual([]);
    }
  });

  test('imatges: ruta pròpia, referència opaca, Storage de Supabase reescrit; res amb consulta, http ni credencials', () => {
    expect(imatgeDe('/assets/a.jpg', ORIGEN)).toBe('https://socdepoble.org/assets/a.jpg');
    expect(imatgeDe('/assets/a.jpg')).toBe('/assets/a.jpg');
    expect(imatgeDe('sdp-media://mitjans/a.webp')).toBe('sdp-media://mitjans/a.webp');
    expect(imatgeDe('https://abc.supabase.co/storage/v1/object/public/mitjans/a.webp')).toBe('sdp-media://mitjans/a.webp');
    expect(imatgeDe('https://abc.supabase.co/storage/v1/object/sign/mitjans/a.webp')).toBeNull();
    /* Un domini propi o un Supabase autoallotjat: el camí de Storage delata el projecte en qualsevol host. */
    expect(imatgeDe('https://db.socdepoble.org/storage/v1/object/public/mitjans/poble/x.jpg')).toBe('sdp-media://mitjans/poble/x.jpg');
    expect(imatgeDe('https://dades.ajuntament.example/storage/v1/object/public/mitjans/a.webp')).toBe('sdp-media://mitjans/a.webp');
    for (const privada of ['https://db.socdepoble.org/storage/v1/object/sign/mitjans/a.webp',
      'https://db.socdepoble.org/storage/v1/object/authenticated/mitjans/a.webp', 'https://db.socdepoble.org/storage/v1/render/image/public/mitjans/a.webp']) {
      expect(imatgeDe(privada), privada).toBeNull();
    }
    expect(imatgeDe('https://upload.wikimedia.org/a.jpg')).toBe('https://upload.wikimedia.org/a.jpg');
    for (const dolenta of ['https://x.org/a.jpg?token=secret', 'http://x.org/a.jpg', 'https://u:p@x.org/a.jpg', '//x.org/a.jpg',
      'https://x.org/a.jpg#t', '/assets/../secret', 'sdp-media://../x', 'javascript:alert(1)', 'data:image/png;base64,AAAA']) {
      expect(imatgeDe(dolenta), dolenta).toBeNull();
    }
    const [noticia] = grafDe(prepara({ noticies: [noticiaEntitat()] }), 'noticies.jsonld');
    expect(noticia.image).toBe('https://socdepoble.org/assets/prova/ban.jpg');
    expect(noticia).not.toHaveProperty('encodingFormat');
    const propi = prepara({ noticies: [{ ...noticiaEntitat(), image_url: 'https://db.socdepoble.org/storage/v1/object/public/mitjans/poble/x.jpg' }] });
    expect(grafDe(propi, 'noticies.jsonld')[0].image).toBe('sdp-media://mitjans/poble/x.jpg');
    expect(propi.fitxers.map((f) => f.text).join('\n')).not.toContain('db.socdepoble.org');
  });

  /* Gauntlet 261030 (G8 de Gemini): decidix el camí de Storage, no el host. */
  test('imatges: una URL d’un tercer a supabase.co passa; el camí de Storage només amb segments segurs', () => {
    // El web de Supabase és un tercer: fora de /storage/v1/ no és cap projecte i la seua URL es publica tal qual.
    expect(imatgeDe('https://supabase.co/brand-assets/logo.png')).toBe('https://supabase.co/brand-assets/logo.png');
    expect(imatgeDe('https://www.supabase.co/images/x.webp')).toBe('https://www.supabase.co/images/x.webp');
    // Qualsevol host amb el camí de Storage continua opac (o fora, si no és el bucket públic).
    expect(imatgeDe('https://abc.supabase.co/storage/v1/object/public/mitjans/poble/a.webp')).toBe('sdp-media://mitjans/poble/a.webp');
    expect(imatgeDe('https://abc.supabase.co/storage/v1/object/public/mitjans/a~b_c-d.e.webp')).toBe('sdp-media://mitjans/a~b_c-d.e.webp');
    for (const insegura of [
      'https://db.example.org/storage/v1/object/public/mitjans%2F..%2Fmitjans_privats/a.webp',
      'https://db.example.org/storage/v1/object/public/mitjans/%2E%2E%2Fx.webp',
      'https://db.example.org/storage/v1/object/public/mitjans//a.webp',
      'https://db.example.org/storage/v1/object/public/mitjans/a%20b.webp',
      'https://db.example.org/storage/v1/object/public/mitjans',
      'https://db.example.org/storage/v1/object/public/mitjans/',
      'https://db.example.org/storage/v1/object/public/'
    ]) expect(imatgeDe(insegura), insegura).toBeNull();
    // La mateixa regla per a una referència opaca que ja ve feta.
    for (const insegura of ['sdp-media://mitjans%2F..%2Fmitjans_privats/a.webp', 'sdp-media://mitjans//a.webp', 'sdp-media://mitjans',
      'sdp-media://mitjans/./a.webp', 'sdp-media://mitjans/a%2fb.webp']) expect(imatgeDe(insegura), insegura).toBeNull();
    // I es compta com a imatge descartada, mai com un valor.
    const p = prepara({ noticies: [{ ...noticiaEntitat(), image_url: 'https://db.example.org/storage/v1/object/public/mitjans%2F..%2Fx/a.webp' }] });
    expect(grafDe(p, 'noticies.jsonld')[0]).not.toHaveProperty('image');
    expect(p.omissions.noticies.imatgesDescartades).toBe(1);
  });

  test('cap dateModified anterior o igual a la publicació (un rellotge desajustat no inventa cap edició)', () => {
    const [noticia] = grafDe(prepara({ noticies: [{ ...noticiaEntitat(), created_at: '2026-10-20T08:00:00Z', updated_at: '2026-10-19T08:00:00Z' }] }), 'noticies.jsonld');
    expect(noticia.datePublished).toBe('2026-10-20T08:00:00Z');
    expect(noticia).not.toHaveProperty('dateModified');
    const [acte] = grafDe(prepara({ agenda: [{ ...acteEntitat(), updated_at: '2026-08-01T10:00:00Z' }] }), 'agenda.jsonld');
    expect(acte.subjectOf).not.toHaveProperty('dateModified');
  });

  /* Gauntlet 261030 (C8 de Codex): les fraccions de segon es conserven i es comparen sense truncar. */
  test('dates amb fracció de segon: una edició dins del mateix segon és una edició; l’ordre, el del temps', () => {
    const noticia = (extra) => grafDe(prepara({ noticies: [{ ...noticiaEntitat(), ...extra }] }), 'noticies.jsonld')[0];
    expect(noticia({ created_at: '2026-10-20T08:00:00.123Z', updated_at: '2026-10-20T08:00:00.987Z' }))
      .toMatchObject({ datePublished: '2026-10-20T08:00:00.123Z', dateModified: '2026-10-20T08:00:00.987Z' });
    // Microsegons de Postgres (timestamptz amb +00:00), en UTC i sencers.
    expect(noticia({ created_at: '2026-10-20T08:00:00.123456+00:00', updated_at: '2026-10-20T08:00:00.123457+00:00' }))
      .toMatchObject({ datePublished: '2026-10-20T08:00:00.123456Z', dateModified: '2026-10-20T08:00:00.123457Z' });
    // '…:00Z' va darrere de '…:00.5Z' com a text, però és ANTERIOR: cap edició inventada.
    expect(noticia({ created_at: '2026-10-20T08:00:00.5Z', updated_at: '2026-10-20T08:00:00Z' })).not.toHaveProperty('dateModified');
    expect(noticia({ created_at: '2026-10-20T08:00:00.5Z', updated_at: '2026-10-20T08:00:00.500Z' })).not.toHaveProperty('dateModified');
    // Dins del mateix mil·lisegon mana la fracció (descendent a les notícies, ascendent a l'agenda), no l'identificador.
    const dues = [
      { ...noticiaEntitat(), id: 'a-abans', created_at: '2026-10-20T08:00:00.0001Z' },
      { ...noticiaEntitat(), id: 'b-despres', created_at: '2026-10-20T08:00:00.0009Z' }
    ];
    expect(grafDe(prepara({ noticies: dues }), 'noticies.jsonld').map((n) => n.identifier)).toEqual(['b-despres', 'a-abans']);
    const actes = [
      { ...acteEntitat(), id: 'b-primer', inici: '2026-08-15T22:00:00.0001+02:00' },
      { ...acteEntitat(), id: 'a-segon', inici: '2026-08-15T22:00:00.0009+02:00' }
    ];
    expect(grafDe(prepara({ agenda: actes }), 'agenda.jsonld').map((a) => [a.identifier, a.startDate])).toEqual([
      ['b-primer', '2026-08-15T22:00:00.0001+02:00'], ['a-segon', '2026-08-15T22:00:00.0009+02:00']
    ]);
  });
});

describe('JSON-LD (schema.org), Data Package v2 i manifest SHA-256', () => {
  test('l’acte real de la llavor, amb el lloc que diu el seu text: Event amb el desfasament de Madrid i l’organitzadora', () => {
    /* La llavor no porta lloc (vegeu «l’Aplec de la llavor…»): ací se li dona el del seu text. */
    const benillup = { nom: 'Benillup' };
    const [acte] = grafDe(preparaDadesObertesMunicipi({ municipi: benillup, ara: ARA, origen: ORIGEN, agenda: [{ ...CALENDAR_EVENTS[0], location: 'Benillup' }] }), 'agenda.jsonld');
    expect(acte).toEqual({
      '@id': 'agenda.jsonld#aplec-2023',
      '@type': 'Event',
      description: CALENDAR_EVENTS[0].entradilla,
      disambiguatingDescription: CALENDAR_EVENTS[0].subtitle,
      identifier: 'aplec-2023',
      image: 'https://socdepoble.org/assets/events/aplec_2023_cartell.jpg',
      location: { '@type': 'Place', name: 'Benillup' },
      name: '2n Aplec pel Territori',
      /* Sense fitxa pública al directori de l'entrada: només l'id, mai l'author_name del text. */
      organizer: { '@type': 'Organization', identifier: 'socdepoble' },
      startDate: '2023-01-29T10:30:00+01:00'
    });
    const estiu = { id: 'festes', title: 'Festes', author_entity_id: 'socdepoble', poble_id: TORRE.slug, date: '2026-07-15', time: '19:30', fi: '2026-07-15T23:00', location: 'Plaça Major' };
    const actes = grafDe(prepara({ agenda: [estiu, { ...estiu, id: 'tot-el-dia', time: undefined, fi: undefined }] }), 'agenda.jsonld');
    expect(actes.map((a) => [a.identifier, a.startDate])).toEqual([['tot-el-dia', '2026-07-15'], ['festes', '2026-07-15T19:30:00+02:00']]);
    expect(actes[1]).toMatchObject({ endDate: '2026-07-15T23:00:00+02:00', location: { '@type': 'Place', name: 'Plaça Major' } });
  });

  test('NewsArticle: text pla dels paràgrafs, dates reals en UTC, autoria i llicència', () => {
    const [noticia] = grafDe(prepara({ noticies: [noticiaEntitat()] }), 'noticies.jsonld');
    expect(noticia).toMatchObject({
      '@type': 'NewsArticle', '@id': 'noticies.jsonld#ban-aigua', headline: 'Tall d’aigua dimecres',
      abstract: 'Avís de l’ajuntament de prova.', articleBody: 'Primer paràgraf & segon.\nTercer fort.',
      datePublished: '2026-10-20T06:00:00Z', dateModified: '2026-10-21T09:00:00Z',
      author: { '@type': 'Organization', identifier: 'ajuntament-de-prova' },
      license: 'https://creativecommons.org/licenses/by/4.0/', copyrightNotice: 'CC BY 4.0'
    });
    expect(noticia.author).not.toHaveProperty('name');
    expect(textDeCos('Línia 1\r\nLínia 2\n\n\n\nLínia 3')).toBe('Línia 1\nLínia 2\n\nLínia 3');
    expect(textDeCos('a < b i c > d')).toBe('a < b i c > d');
    expect(textDeCos('a   \tb')).toBe('a b');
  });

  test('datapackage.json: Frictionless v2 i cada recurs amb la mida i el SHA-256 de veres', async () => {
    const r = await exporta(COMPLET());
    const fitxers = new Map(llegeixZip(r.zip).map(({ nom, dades }) => [nom.slice(ARREL.length + 1), dades]));
    const paquet = JSON.parse(descodifica(fitxers.get('data/datapackage.json')));
    expect(paquet).toMatchObject({
      $schema: 'https://datapackage.org/profiles/2.0/datapackage.json', name: ARREL, created: ARA,
      licenses: [{ path: 'llicencies.md' }], sources: [{ path: ORIGEN }],
      socdepoble: { format: FORMAT_DADES_OBERTES, municipi: TORRE.slug, comptes: { noticies: 1, agenda: 1, directori: 2, memoria: 0 } }
    });
    expect(paquet.name).toMatch(/^[a-z0-9._-]+$/);
    expect(paquet.resources.map((x) => x.path)).toEqual([
      'agenda.ics', 'agenda.jsonld', 'configuracio.json', 'directori.jsonld', 'llicencies.md', 'memoria-cultural.jsonld', 'memoria.md', 'municipi.jsonld', 'noticies.jsonld'
    ]);
    for (const recurs of paquet.resources) {
      const dades = fitxers.get(`data/${recurs.path}`);
      expect(recurs).toMatchObject({ bytes: dades.length, hash: `sha256:${sha(dades)}`, encoding: 'utf-8' });
      expect(recurs.name).toMatch(/^[a-z0-9._-]+$/);
    }
    expect(r.datapackage).toEqual(paquet);
  });

  test('manifest i tagmanifest coherents (sha256sum), Payload-Oxum i bagit.txt de BagIt 1.0', async () => {
    const r = await exporta(COMPLET());
    const fitxers = new Map(llegeixZip(r.zip).map(({ nom, dades }) => [nom.slice(ARREL.length + 1), dades]));
    const linies = (nom) => descodifica(fitxers.get(nom)).trimEnd().split('\n').map((l) => l.split('  '));
    const dades = [...fitxers.keys()].filter((c) => c.startsWith('data/')).sort();
    expect(linies('manifest-sha256.txt').map(([, c]) => c)).toEqual(dades);
    for (const [hash, cami] of linies('manifest-sha256.txt')) expect(hash, cami).toBe(sha(fitxers.get(cami)));
    expect(linies('tagmanifest-sha256.txt').map(([, c]) => c)).toEqual(['bag-info.txt', 'bagit.txt', 'manifest-sha256.txt']);
    for (const [hash, cami] of linies('tagmanifest-sha256.txt')) expect(hash, cami).toBe(sha(fitxers.get(cami)));
    const octets = dades.reduce((t, c) => t + fitxers.get(c).length, 0);
    expect(descodifica(fitxers.get('bag-info.txt'))).toContain(`\nPayload-Oxum: ${octets}.${dades.length}\n`);
    expect(descodifica(fitxers.get('bagit.txt'))).toBe('BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n');
    expect(r.fitxers.find((f) => f.cami === 'data/datapackage.json').sha256).toBe(sha(fitxers.get('data/datapackage.json')));
  });

  test('federació: només l’actor que el build publica, com a document sobre el municipi (subjectOf), mai sameAs', () => {
    const publicat = prepara({ actorsPublicats: ['socdepoble', TORRE.slug] });
    const municipi = JSON.parse(fitxerDe(publicat, 'municipi.jsonld'));
    const urls = urlsDeMunicipi(normalitzaSlugMunicipi(TORRE.nom), { origen: ORIGEN });
    expect(municipi).toMatchObject({
      '@type': 'AdministrativeArea', identifier: TORRE.slug, url: urls.perfil,
      subjectOf: { '@type': 'CreativeWork', url: urls.actor, encodingFormat: 'application/activity+json' }
    });
    expect(municipi).not.toHaveProperty('sameAs');
    expect(fitxerDe(publicat, 'memoria.md')).toContain(`\`${urls.outbox}\``);
    expect(fitxerDe(publicat, 'memoria.md')).toContain(`\`@${TORRE.slug}@socdepoble.org\``);
    expect(fitxerDe(publicat, 'memoria.md')).toContain('es troba amb host-meta i un JRD estàtic');
    /* L'entitat de Wikidata sí que és la mateixa identitat (un QID de prova, no el del poble). */
    const ambWikidata = preparaDadesObertesMunicipi({ municipi: { ...TORRE, wikidata: 'Q123456789' }, ara: ARA, origen: ORIGEN, actorsPublicats: [TORRE.slug] });
    expect(JSON.parse(fitxerDe(ambWikidata, 'municipi.jsonld')).sameAs).toEqual(['https://www.wikidata.org/entity/Q123456789']);
    /* Un poble sense actor publicat (Benillup) o un origen sense la llista: cap url, cap actor ni cap compte @. */
    for (const sense of [
      preparaDadesObertesMunicipi({ municipi: { nom: 'Benillup' }, ara: ARA, origen: ORIGEN, actorsPublicats: ['socdepoble', TORRE.slug] }),
      prepara()
    ]) {
      const text = sense.fitxers.map((f) => f.text).join('\n');
      expect(text).not.toContain('/ap/actors/');
      expect(text).not.toContain('## Federació');
      expect(text).not.toMatch(/@[a-z-]+@socdepoble\.org/);
      expect(JSON.parse(fitxerDe(sense, 'municipi.jsonld'))).not.toHaveProperty('url');
    }
    expect(() => prepara({ actorsPublicats: [{ slug: TORRE.slug }] })).toThrow(/actorsPublicats/);
    expect(() => prepara({ actorsPublicats: TORRE.slug })).toThrow(/actorsPublicats/);
    const senseOrigen = preparaDadesObertesMunicipi({ municipi: TORRE, ara: ARA, agenda: CALENDAR_EVENTS, actorsPublicats: [TORRE.slug] });
    const tot = senseOrigen.fitxers.map((f) => f.text).join('\n');
    expect(tot).not.toContain('https://socdepoble.org');
    expect(tot).not.toContain('## Federació');
    expect(JSON.parse(fitxerDe(senseOrigen, 'municipi.jsonld'))).not.toHaveProperty('subjectOf');
    expect(() => preparaDadesObertesMunicipi({ municipi: { slug: 'La-Torre', nom: TORRE.nom }, ara: ARA })).toThrow(/Slug de municipi invàlid/);
    expect(() => prepara({ origen: 'http://socdepoble.org' })).toThrow(/Origen federat invàlid/);
  });

  test('configuració: només la taxonomia i l’estil que validen, refets camp a camp', () => {
    const taxonomia = { v: 1, pagines: { projecte: { labels: [{ text: ' Festes ', className: 'sdp-badge-tag', secret: TRAMPES.correu }] } }, categories: ['Bans'], etiquetes: [], extra: TRAMPES.usuari };
    const estil = { v: 1, tokens: { '--sdp-radi-m': '16px' }, crom: null };
    const text = fitxerDe(prepara({ personalitzacio: { taxonomia: { payload: taxonomia, versio: 3 }, estil: { payload: estil, versio: 1 } } }), 'configuracio.json');
    const configuracio = JSON.parse(text);
    expect(configuracio.personalitzacio.taxonomia).toEqual({ versio: 3, payload: { v: 1, pagines: { projecte: { labels: [{ text: 'Festes', className: 'sdp-badge-tag' }] } }, categories: ['Bans'], etiquetes: [] } });
    expect(configuracio.personalitzacio.estil).toEqual({ versio: 1, payload: { v: 1, tokens: { '--sdp-radi-m': '16px' } } });
    expect(text).not.toContain(TRAMPES.correu);
    expect(text).not.toContain(TRAMPES.usuari);
    const dolenta = prepara({ personalitzacio: { taxonomia: { payload: { v: 2 } }, estil: { payload: { v: 1, tokens: { '--sdp-text-cos': 'red;}body{x' } } } } });
    expect(dolenta.omissions.configuracio).toEqual({ taxonomiaInvalida: 1, estilInvalida: 1 });
    /* V2-02 · La cel·la de memoria.md: el que s'exporta, «sense personalització» si s'ha llegit buida, i «no s'exporta» si està pendent. */
    const cella = (p) => fitxerDe(p, 'memoria.md').split('\n').find((l) => l.startsWith('| `configuracio.json` |'));
    expect(cella(prepara({ personalitzacio: { taxonomia: { payload: taxonomia, versio: 3 }, estil: { payload: estil, versio: 1 } } }))).toBe('| `configuracio.json` | taxonomia, estil |');
    expect(cella(prepara())).toBe('| `configuracio.json` | sense personalització |');
    expect(cella(prepara({ pendents: [{ coleccio: 'configuracio', motiu: 'motiu de prova' }] }))).toBe("| `configuracio.json` | no s'exporta |");
  });
});

/* schema.org: el domini de cada propietat que fa servir el paquet («Used on
   these types» de cada pàgina, p. ex. schema.org/license → CreativeWork;
   /location → Action, Event, InteractionCounter, Organization; /slogan →
   Brand, Organization, Place, Product, Service), amb l'herència: NewsArticle ⊂
   Article ⊂ CreativeWork ⊂ Thing; LocalBusiness ⊂ Organization i Place;
   AdministrativeArea ⊂ Place. */
const THING = ['@id', '@type', 'identifier', 'name', 'alternateName', 'description', 'disambiguatingDescription', 'image', 'url', 'sameAs', 'subjectOf'];
const CREATIVE_WORK = [...THING, 'abstract', 'alternativeHeadline', 'author', 'copyrightNotice', 'dateModified', 'datePublished', 'encodingFormat', 'headline', 'license', 'text'];
const ORGANIZATION = [...THING, 'location', 'logo', 'parentOrganization', 'slogan'];
const PLACE = [...THING, 'geo', 'logo', 'slogan'];
const DOMINI = Object.freeze({
  CreativeWork: CREATIVE_WORK,
  NewsArticle: [...CREATIVE_WORK, 'articleBody'],
  Event: [...THING, 'endDate', 'location', 'organizer', 'startDate'],
  Organization: ORGANIZATION,
  LocalBusiness: [...ORGANIZATION, ...PLACE],
  Place: PLACE,
  AdministrativeArea: PLACE,
  GeoCoordinates: [...THING, 'latitude', 'longitude']
});
/* I el rang de les que enllacen nodes. */
const RANG = Object.freeze({
  subjectOf: ['CreativeWork', 'Event'],
  author: ['Organization', 'LocalBusiness', 'Person'],
  organizer: ['Organization', 'LocalBusiness', 'Person'],
  geo: ['GeoCoordinates'],
  location: ['Place', 'AdministrativeArea']
});
/* Cada node amb @type de l'arbre, amb el seu camí. */
function nodesTipats(valor, cami = '$') {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => nodesTipats(v, `${cami}[${i}]`));
  if (!valor || typeof valor !== 'object') return [];
  const fills = Object.entries(valor).flatMap(([clau, v]) => nodesTipats(v, `${cami}.${clau}`));
  return valor['@type'] ? [{ cami, node: valor }, ...fills] : fills;
}
const COMPLET_RIC = () => ({
  ...COMPLET(),
  memoria: [{ id: 'record-de-prova', title: 'Record de prova', text: 'Text del record.', author_org_id: RENTONAR, poble_id: TORRE.slug, copyright: 'CC0 1.0', created_at: '2026-09-01T10:00:00Z', image_url: '/assets/prova/record.jpg' }],
  actorsPublicats: [TORRE.slug]
});

describe('schema.org: cada propietat en un tipus que la té, i el graf enllaçat', () => {
  test('Event i Organization porten la llicència i les dates a la fitxa (subjectOf: CreativeWork), mai al node', async () => {
    const r = await exportaMunicipiOpenData({ municipi: { ...TORRE, wikidata: 'Q123456789', lat: 38.6, lng: -0.42 }, ara: ARA, origen: ORIGEN, ...COMPLET_RIC() });
    const tipus = new Set();
    for (const { nom, dades } of llegeixZip(r.zip).filter((e) => e.nom.endsWith('.jsonld'))) {
      for (const { cami, node } of nodesTipats(JSON.parse(descodifica(dades)))) {
        tipus.add(node['@type']);
        const permeses = DOMINI[node['@type']];
        expect(permeses, `${nom} ${cami}: tipus ${node['@type']}`).toBeDefined();
        for (const clau of Object.keys(node).filter((c) => c !== '@context')) {
          expect(permeses, `${nom} ${cami}.${clau} en un ${node['@type']}`).toContain(clau);
          if (RANG[clau] && node[clau]['@type']) expect(RANG[clau], `${nom} ${cami}.${clau}`).toContain(node[clau]['@type']);
        }
      }
    }
    expect([...tipus].sort()).toEqual(['AdministrativeArea', 'CreativeWork', 'Event', 'GeoCoordinates', 'LocalBusiness', 'NewsArticle', 'Organization', 'Place']);
    const p = prepara(COMPLET_RIC());
    const acte = grafDe(p, 'agenda.jsonld').find((a) => a.identifier === 'festa-de-prova');
    expect(acte.subjectOf).toEqual({
      '@type': 'CreativeWork', copyrightNotice: 'CC BY 4.0', license: 'https://creativecommons.org/licenses/by/4.0/',
      datePublished: '2026-08-01T10:00:00Z', dateModified: '2026-08-02T10:00:00Z'
    });
    const forn = grafDe(p, 'directori.jsonld').find((e) => e.name === 'Forn de prova');
    expect(forn.subjectOf).toEqual({ '@type': 'CreativeWork', copyrightNotice: 'CC BY-SA 4.0', license: 'https://creativecommons.org/licenses/by-sa/4.0/' });
    /* Sense llicència ni dates, cap fitxa buida. */
    expect(grafDe(p, 'directori.jsonld').find((e) => e.name === 'Rentonar')).not.toHaveProperty('subjectOf');
    expect(fitxerDe(p, 'llicencies.md')).toContain('| agenda | `festa-de-prova` | CC BY 4.0 | sí |');
  });

  test('anada i tornada del graf: l’organitzadora i l’autora són el MATEIX node que l’entitat del directori', () => {
    const p = prepara({
      ...COMPLET_RIC(),
      noticies: [
        { id: 'del-forn', title: 'Del forn', poble_id: TORRE.slug, author_org_id: '7d1f0000-0000-4000-8000-000000000002' },
        { id: 'de-penaguila', title: 'D’una entitat de Penàguila', poble_id: TORRE.slug, author_org_id: '7d1f0000-0000-4000-8000-000000000004' },
        { id: 'de-la-privada', title: 'D’una fitxa privada', poble_id: TORRE.slug, author_org_id: '7d1f0000-0000-4000-8000-000000000003' },
        { id: 'sense-fitxa', title: 'Sense fitxa', poble_id: TORRE.slug, author_entity_id: 'ajuntament-de-prova', author_name: TRAMPES.persona }
      ]
    });
    /* Els @id relatius, resolts com ho faria un processador JSON-LD amb el paquet desempaquetat. */
    const base = 'https://exemple.invalid/dades-obertes-la-torre-de-les-macanes/data/';
    const resol = (fitxer, id) => new URL(id, new URL(fitxer, base)).href;
    const nodes = new Map(grafDe(p, 'directori.jsonld').map((e) => [resol('directori.jsonld', e['@id']), e]));
    const acte = grafDe(p, 'agenda.jsonld').find((a) => a.identifier === 'festa-de-prova');
    expect(nodes.get(resol('agenda.jsonld', acte.organizer['@id']))).toMatchObject({ identifier: RENTONAR, name: 'Rentonar' });
    expect(acte.organizer).toEqual({ '@id': `directori.jsonld#${RENTONAR}`, '@type': 'Organization', identifier: RENTONAR, name: 'Rentonar' });
    const record = grafDe(p, 'memoria-cultural.jsonld')[0];
    expect(nodes.get(resol('memoria-cultural.jsonld', record.author['@id']))).toBe(nodes.get(resol('agenda.jsonld', acte.organizer['@id'])));
    const autores = Object.fromEntries(grafDe(p, 'noticies.jsonld').map((n) => [n.identifier, n.author]));
    expect(nodes.get(resol('noticies.jsonld', autores['del-forn']['@id']))).toMatchObject({ '@type': 'LocalBusiness', name: 'Forn de prova' });
    expect(autores['del-forn']['@type']).toBe('LocalBusiness');
    /* Una entitat pública d'un altre poble: el seu nom, però cap @id (no és al directori d'este paquet). */
    expect(autores['de-penaguila']).toEqual({ '@type': 'Organization', identifier: '7d1f0000-0000-4000-8000-000000000004', name: 'De Penàguila' });
    /* Una fitxa privada o cap fitxa: node en blanc amb l'id, sense nom (mai el text lliure author_name). */
    expect(autores['de-la-privada']).toEqual({ '@type': 'Organization', identifier: '7d1f0000-0000-4000-8000-000000000003' });
    expect(autores['sense-fitxa']).toEqual({ '@type': 'Organization', identifier: 'ajuntament-de-prova' });
    expect(p.fitxers.map((f) => f.text).join('\n')).not.toContain(TRAMPES.persona);
  });

  test('el nom de l’entitat que signa ix del directori públic, mai d’author_name (pot ser una persona)', () => {
    const element = { id: 'signat', title: 'Signat', poble_id: TORRE.slug, author_entity_id: 'ent-1', author_name: 'Pep Garcia Martí' };
    const sense = grafDe(prepara({ noticies: [element] }), 'noticies.jsonld')[0];
    expect(sense.author).toEqual({ '@type': 'Organization', identifier: 'ent-1' });
    const amb = prepara({ noticies: [element], entitats: [fila({ id: 'ent-1', name: 'Associació de prova', town_name: 'Penàguila' })] });
    expect(grafDe(amb, 'noticies.jsonld')[0].author).toEqual({ '@type': 'Organization', identifier: 'ent-1', name: 'Associació de prova' });
    /* Dos fitxes amb el mateix id: cap nom (no es tria a l'atzar). */
    const dues = prepara({ noticies: [element], entitats: [fila({ id: 'ent-1', name: 'A', town_name: 'Penàguila' }), fila({ id: 'ent-1', name: 'B', town_name: 'Benillup' })] });
    expect(grafDe(dues, 'noticies.jsonld')[0].author).toEqual({ '@type': 'Organization', identifier: 'ent-1' });
    for (const p of [prepara({ noticies: [element] }), amb, dues]) expect(p.fitxers.map((f) => f.text).join('\n')).not.toContain('Pep Garcia');
  });
});

describe('mai HTML cru: cap «<» obri marcatge en cap text del paquet', () => {
  test('textDeCos: etiquetes partides, sense tancar, amb entitats o niades', () => {
    const casos = [
      ['<p><<script>script>alert(1)<</script>/script></p>', 'alert(1)'],
      ['<p>&lt;img src=x onerror=alert(1)&gt;</p>', '‹img src=x onerror=alert(1)>'],
      ['<b>x</b><img src=x onerror="alert(1)"', 'x‹img src=x onerror="alert(1)"'],
      ['<p>&lt;!-- c --&gt; i &lt;/p&gt; i &lt;?php</p>', '‹!-- c --> i ‹/p> i ‹?php'],
      ['pla <script>alert(1)</script>', 'pla alert(1)'],
      ['text pla amb <script', 'text pla amb ‹script'],
      [`${'<'.repeat(9)}a${'>'.repeat(9)}<p>x</p>`, null]
    ];
    for (const [entrada, eixida] of casos) {
      const text = textDeCos(entrada);
      expect(text, entrada).not.toMatch(MARCATGE);
      if (eixida !== null) expect(text, entrada).toBe(eixida);
    }
    /* El text que NO és marcatge es conserva (les entitats es descodifiquen després de llevar les etiquetes). */
    expect(textDeCos('<p>x &lt; y i z &gt; w</p>')).toBe('x < y i z > w');
    expect(textDeCos('a < b i c > d')).toBe('a < b i c > d');
    expect(textDeCos('1<2 i 3>2')).toBe('1<2 i 3>2');
  });

  test('cap camp de text de cap fitxer: títols, noms, llocs, llicències, directori i configuració', async () => {
    const hostil = '<img src=x onerror=alert(1)>';
    const element = {
      title: hostil, subtitle: hostil, entradilla: hostil, body: '<p><<script>script>alert(1)<</script>/script></p>', location: `${TORRE.nom} ${hostil}`,
      copyright: hostil, poble_id: TORRE.slug, author_org_id: 'ent-hostil', created_at: '2026-10-01T10:00:00Z'
    };
    const r = await exporta({
      /* Un id amb angles no és un id de veres: fora, no canviat. */
      noticies: [{ ...element, id: 'n' }, { ...element, id: '<script>x' }],
      agenda: [{ ...element, id: 'a', date: '2026-11-01' }],
      memoria: [{ ...element, id: 'm', text: `&lt;script&gt;alert(1)&lt;/script&gt; ${hostil}` }],
      entitats: [fila({ id: 'ent-hostil', slug: 'hostil', name: `Entitat ${hostil}`, lema: hostil, description: `<p>${hostil}</p>`, copyright: hostil })],
      personalitzacio: { taxonomia: { payload: { v: 1, pagines: { projecte: { labels: [{ text: hostil, className: 'sdp-badge-tag' }] } }, categories: [hostil], etiquetes: [hostil] } } },
      actorsPublicats: [TORRE.slug]
    });
    expect(r.comptes).toEqual({ noticies: 1, agenda: 1, directori: 1, memoria: 1 });
    expect(r.omissions.noticies).toMatchObject({ senseId: 1 });
    for (const { nom, dades } of llegeixZip(r.zip)) expect(descodifica(dades), nom).not.toMatch(MARCATGE);
    const configuracio = JSON.parse(descodifica(llegeixZip(r.zip).find((e) => e.nom.endsWith('/configuracio.json')).dades));
    expect(configuracio.personalitzacio.taxonomia.payload.categories).toEqual(['‹img src=x onerror=alert(1)>']);
  });
});

describe('llicències per element (disseny NLnet B §4.4)', () => {
  test('buit: no declarada (mai la de sèrie de l’editor); només CC0, CC BY i CC BY-SA són obertes', () => {
    expect(llicenciaDe('')).toEqual({ valor: null, estat: 'no-declarada', oberta: false, spdx: null });
    expect(llicenciaDe(undefined).estat).toBe('no-declarada');
    expect(llicenciaDe('CC BY-NC-SA 4.0')).toEqual({ valor: 'CC BY-NC-SA 4.0', estat: 'declarada', oberta: false, spdx: 'CC-BY-NC-SA-4.0' });
    expect(llicenciaDe('CC BY 4.0')).toMatchObject({ oberta: true, spdx: 'CC-BY-4.0' });
    expect(llicenciaDe('CC BY-SA 4.0')).toMatchObject({ oberta: true, spdx: 'CC-BY-SA-4.0' });
    expect(llicenciaDe('CC0 1.0')).toMatchObject({ oberta: true, spdx: 'CC0-1.0' });
    expect(llicenciaDe('Fotos de l’Arxiu municipal · CC0 1.0')).toMatchObject({ oberta: true, spdx: 'CC0-1.0' });
    expect(llicenciaDe('© Ajuntament de prova')).toEqual({ valor: '© Ajuntament de prova', estat: 'declarada', oberta: false, spdx: null });
    const md = fitxerDe(prepara({ entitats: ENTITATS }), 'llicencies.md');
    expect(md).toContain('| directori | `7d1f0000-0000-4000-8000-000000000001` | (no declarada) | no |');
    expect(md).toContain('| directori | `7d1f0000-0000-4000-8000-000000000002` | CC BY-SA 4.0 | sí |');
  });
});

describe('determinisme: mateixes dades, mateixos bytes', () => {
  test('dos crides, l’entrada en un altre ordre i un altre rellotge donen els mateixos bytes', async () => {
    const a = await exporta(COMPLET());
    const b = await exporta(COMPLET());
    expect(b.sha256).toBe(a.sha256);
    expect(Buffer.from(b.zip).equals(Buffer.from(a.zip))).toBe(true);
    const girat = (llista) => [...llista].reverse().map((x) => Object.fromEntries(Object.entries(x).reverse()));
    const c = await exportaMunicipiOpenData({ entitats: girat(ENTITATS), agenda: girat(COMPLET().agenda), noticies: girat([noticiaEntitat(), ...PERSONES]), origen: ORIGEN, ara: ARA, municipi: { nom: TORRE.nom, slug: TORRE.slug } });
    expect(c.sha256).toBe(a.sha256);
    vi.useFakeTimers({ now: new Date('2031-03-03T03:03:03Z'), toFake: ['Date'] });
    const d = await exporta(COMPLET());
    vi.setSystemTime(new Date('1999-12-31T23:59:59Z'));
    const e = await exporta(COMPLET());
    expect([d.sha256, e.sha256]).toEqual([a.sha256, a.sha256]);
    vi.useRealTimers();
    expect((await exporta({ ...COMPLET(), ara: '2026-10-31T00:00:00Z' })).sha256).not.toBe(a.sha256);
    expect(() => preparaDadesObertesMunicipi({ municipi: TORRE })).toThrow(/ara/);
  });

  test('cada objecte JSON amb les claus ordenades i cada llista en un ordre estable', () => {
    const p = prepara({
      ...COMPLET(),
      noticies: [noticiaEntitat(), { ...noticiaEntitat(), id: 'mes-nova', created_at: '2026-10-25T00:00:00Z' }, { ...noticiaEntitat(), id: 'a-sense-data', created_at: undefined }]
    });
    for (const f of p.fitxers.filter((x) => /\.json(ld)?$/.test(x.nom))) expect(clausDesordenades(JSON.parse(f.text)), f.nom).toEqual([]);
    expect(grafDe(p, 'noticies.jsonld').map((n) => n.identifier)).toEqual(['mes-nova', 'ban-aigua', 'a-sense-data']);
    expect(jsonCanonic({ b: 1, a: { d: [3, { z: 1, y: null }], c: '' } })).toBe('{\n  "a": {\n    "d": [\n      3,\n      {\n        "z": 1\n      }\n    ]\n  },\n  "b": 1\n}\n');
    expect(() => prepara({ noticies: [noticiaEntitat(), noticiaEntitat()] })).toThrow(/repetit/);
  });
});

describe('ZIP: STORE, CRC-32, data DOS fixa, ordre estable i anada i tornada', () => {
  test('cada entrada: CRC-32 independent, sense compressió, 1980-01-01 00:00 i noms en ordre de bytes sota una arrel', async () => {
    const r = await exporta(COMPLET());
    const entrades = capcaleresLocals(r.zip);
    expect(entrades).toHaveLength(14);
    for (const e of entrades) {
      expect(e.crc, e.nom).toBe(crcBitABit(e.dades));
      expect([e.metode, e.hora, e.data, e.comprimida], e.nom).toEqual([0, 0, 0x0021, e.mida]);
      expect(e.nom.startsWith(`${ARREL}/`)).toBe(true);
    }
    const noms = entrades.map((e) => e.nom);
    expect(noms).toEqual([...noms].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b))));
    expect(noms[0]).toBe(`${ARREL}/bag-info.txt`);
  });

  test('anada i tornada: llegeixZip torna els mateixos fitxers i el verificador els accepta', async () => {
    const r = await exporta(COMPLET());
    const llegits = llegeixZip(r.zip);
    expect(llegits.map(({ nom, dades }) => ({ cami: nom.slice(ARREL.length + 1), bytes: dades.length, sha256: sha(dades) }))).toEqual(r.fitxers);
    await expect(verificaPaquetOpenData(r.zip)).resolves.toEqual({ slug: TORRE.slug, arrel: ARREL, fitxers: 14, recursos: 9 });
    expect(Buffer.compare(Buffer.from(empaquetaZip([{ nom: 'b.txt', dades: 'b' }, { nom: 'a.txt', dades: 'a' }])), Buffer.from(empaquetaZip([{ nom: 'a.txt', dades: 'a' }, { nom: 'b.txt', dades: 'b' }])))).toBe(0);
    expect(Buffer.compare(Buffer.from(empaquetaZip([{ nom: 'b.txt', dades: 'b' }, { nom: 'a.txt', dades: 'a' }])), Buffer.from(creaZip([{ nom: 'a.txt', dades: 'a' }, { nom: 'b.txt', dades: 'b' }])))).toBe(0);
  });

  test('eines de fora (si hi són): unzip -t, zipfile de Python i shasum -c sobre la bossa desempaquetada', async () => {
    const r = await exporta(COMPLET());
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-dades-obertes-'));
    try {
      const zip = path.join(dir, r.nomFitxer);
      fs.writeFileSync(zip, r.zip);
      if (eina('unzip')) {
        const prova = spawnSync('unzip', ['-t', zip], { encoding: 'utf8' });
        expect(prova.status, prova.stdout + prova.stderr).toBe(0);
        expect(spawnSync('unzip', ['-q', zip, '-d', path.join(dir, 'fora')]).status).toBe(0);
        if (eina('shasum')) {
          for (const manifest of ['manifest-sha256.txt', 'tagmanifest-sha256.txt']) {
            const comprova = spawnSync('shasum', ['-a', '256', '-c', manifest], { cwd: path.join(dir, 'fora', ARREL), encoding: 'utf8' });
            expect(comprova.status, comprova.stdout + comprova.stderr).toBe(0);
          }
        }
      }
      if (eina('python3')) {
        const py = spawnSync('python3', ['-I', '-m', 'zipfile', '-t', zip], { encoding: 'utf8' });
        expect(py.status, py.stdout + py.stderr).toBe(0);
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('verificació: qualsevol diferència falla tancat', () => {
  const refa = (zip, canvia) => creaZip(canvia(llegeixZip(zip).map(({ nom, dades }) => ({ nom, dades }))));
  const torna = (entrades, cami, text) => entrades.map((e) => (e.nom === `${ARREL}/${cami}` ? { ...e, dades: new TextEncoder().encode(text) } : e));

  test('un byte canviat (amb el CRC refet), un fitxer de més o un manifest refet sense el datapackage', async () => {
    const r = await exporta(COMPLET());
    const tocat = refa(r.zip, (es) => es.map((e) => (e.nom.endsWith('/data/agenda.jsonld') ? { ...e, dades: Uint8Array.from(e.dades, (b, i) => (i === 40 ? b ^ 1 : b)) } : e)));
    await expect(verificaPaquetOpenData(tocat)).rejects.toThrow(/SHA-256 que no quadra: data\/agenda\.jsonld/);
    const cru = Uint8Array.from(r.zip);
    cru[200] ^= 0xff;
    await expect(verificaPaquetOpenData(cru)).rejects.toThrow(TypeError);
    await expect(verificaPaquetOpenData(refa(r.zip, (es) => [...es, { nom: `${ARREL}/data/extra.md`, dades: 'x' }]))).rejects.toThrow(/no llista exactament/);
    await expect(verificaPaquetOpenData(refa(r.zip, (es) => [...es, { nom: `${ARREL}/data/executa.sh`, dades: 'x' }]))).rejects.toThrow(/no esperat/);
    await expect(verificaPaquetOpenData(refa(r.zip, (es) => [...es, { nom: 'una-altra-arrel/x.md', dades: 'x' }]))).rejects.toThrow(/no esperat/);

    /* El datapackage canviat amb el manifest i el tagmanifest refets: només el datapackage ho veu. */
    const fitxers = new Map(llegeixZip(r.zip).map(({ nom, dades }) => [nom.slice(ARREL.length + 1), descodifica(dades)]));
    const paquet = JSON.parse(fitxers.get('data/datapackage.json'));
    paquet.resources[0].bytes += 1;
    const nouPaquet = `${JSON.stringify(paquet, null, 2)}\n`;
    const manifest = fitxers.get('manifest-sha256.txt').replace(/^[0-9a-f]{64}(?= {2}data\/datapackage\.json$)/m, sha(nouPaquet));
    const tag = `${sha(fitxers.get('bag-info.txt'))}  bag-info.txt\n${sha(fitxers.get('bagit.txt'))}  bagit.txt\n${sha(manifest)}  manifest-sha256.txt\n`;
    const coherent = refa(r.zip, (es) => torna(torna(torna(es, 'data/datapackage.json', nouPaquet), 'manifest-sha256.txt', manifest), 'tagmanifest-sha256.txt', tag));
    await expect(verificaPaquetOpenData(coherent)).rejects.toThrow(/datapackage\.json no quadra amb data\/agenda\.ics/);
  });

  /* La bossa refeta de manera COHERENT amb una sola cosa canviada: `dades`
     (camí de data/ → text) substituïx fitxers; el manifest, el Payload-Oxum i
     el tagmanifest es recalculen, tret dels que porte `etiquetes` (camí →
     text, o una funció del text que tocaria). Així cada prova veu caure una
     sola comprovació del verificador. */
  const ENC = new TextEncoder();
  function bossa(r, { dades = {}, etiquetes = {} } = {}) {
    const fitxers = new Map(llegeixZip(r.zip).map(({ nom, dades: d }) => [nom.slice(ARREL.length + 1), descodifica(d)]));
    for (const [cami, text] of Object.entries(dades)) fitxers.set(cami, text);
    const tria = (cami, calculat) => {
      const propi = etiquetes[cami];
      return typeof propi === 'function' ? propi(calculat) : propi ?? calculat;
    };
    const carrega = [...fitxers.keys()].filter((c) => c.startsWith('data/')).sort();
    const octets = carrega.reduce((t, c) => t + ENC.encode(fitxers.get(c)).length, 0);
    const manifest = tria('manifest-sha256.txt', carrega.map((c) => `${sha(fitxers.get(c))}  ${c}\n`).join(''));
    const bagInfo = tria('bag-info.txt', fitxers.get('bag-info.txt').replace(/Payload-Oxum: .*\n/, `Payload-Oxum: ${octets}.${carrega.length}\n`));
    const bagit = tria('bagit.txt', fitxers.get('bagit.txt'));
    const tag = tria('tagmanifest-sha256.txt', [['bag-info.txt', bagInfo], ['bagit.txt', bagit], ['manifest-sha256.txt', manifest]]
      .map(([c, t]) => `${sha(t)}  ${c}\n`).join(''));
    Object.entries({ 'manifest-sha256.txt': manifest, 'bag-info.txt': bagInfo, 'bagit.txt': bagit, 'tagmanifest-sha256.txt': tag })
      .forEach(([c, t]) => fitxers.set(c, t));
    return creaZip([...fitxers].sort(([a], [b]) => (a < b ? -1 : 1)).map(([c, t]) => ({ nom: `${ARREL}/${c}`, dades: ENC.encode(t) })));
  }
  const paquetDe = (r, canvia) => {
    const paquet = JSON.parse(descodifica(llegeixZip(r.zip).find((e) => e.nom === `${ARREL}/data/datapackage.json`).dades));
    canvia(paquet);
    return jsonCanonic(paquet);
  };

  test('la bossa refeta sense canvis passa: cada prova de davall canvia UNA cosa', async () => {
    const r = await exporta(COMPLET());
    await expect(verificaPaquetOpenData(bossa(r))).resolves.toEqual({ slug: TORRE.slug, arrel: ARREL, fitxers: 14, recursos: 9 });
  });

  test('un datapackage.json que ha perdut un recurs (amb el manifest, l’Oxum i el tagmanifest refets)', async () => {
    const r = await exporta(COMPLET());
    const dades = { 'data/datapackage.json': paquetDe(r, (p) => { p.resources = p.resources.filter((x) => x.path !== 'noticies.jsonld'); }) };
    await expect(verificaPaquetOpenData(bossa(r, { dades }))).rejects.toThrow(/no descriu tots els fitxers de dades/);
  });

  /* Gauntlet 261030 (C9 de Codex): abans només es comparava el nombre de recursos. */
  test('un recurs repetit que en substituïx un altre (el mateix nombre de recursos) no passa', async () => {
    const r = await exporta(COMPLET());
    const agenda = (p) => p.resources.find((x) => x.path === 'agenda.jsonld');
    const repetit = { 'data/datapackage.json': paquetDe(r, (p) => { p.resources = p.resources.map((x) => (x.path === 'noticies.jsonld' ? { ...agenda(p) } : x)); }) };
    await expect(verificaPaquetOpenData(bossa(r, { dades: repetit }))).rejects.toThrow(/Recurs repetit a datapackage\.json \(path o name\): data\/agenda\.jsonld/);
    // El mateix path amb un altre name, també.
    const ambAltreNom = { 'data/datapackage.json': paquetDe(r, (p) => { p.resources = p.resources.map((x) => (x.path === 'noticies.jsonld' ? { ...agenda(p), name: 'noticies' } : x)); }) };
    await expect(verificaPaquetOpenData(bossa(r, { dades: ambAltreNom }))).rejects.toThrow(/Recurs repetit/);
    // Un name repetit en dos recursos diferents.
    const nomRepetit = { 'data/datapackage.json': paquetDe(r, (p) => { p.resources = p.resources.map((x) => (x.path === 'noticies.jsonld' ? { ...x, name: 'agenda' } : x)); }) };
    await expect(verificaPaquetOpenData(bossa(r, { dades: nomRepetit }))).rejects.toThrow(/Recurs repetit a datapackage\.json \(path o name\): data\/noticies\.jsonld/);
    // Un recurs sense name, o amb un name fora de la forma de Data Package v2.
    for (const name of [undefined, '', 'Notícies', 'a b']) {
      const dades = { 'data/datapackage.json': paquetDe(r, (p) => { p.resources = p.resources.map((x) => (x.path === 'noticies.jsonld' ? { ...x, name } : x)); }) };
      await expect(verificaPaquetOpenData(bossa(r, { dades })), String(name)).rejects.toThrow(/Recurs sense un name vàlid: data\/noticies\.jsonld/);
    }
  });

  test('un recurs que s’apunta a si mateix (data/datapackage.json)', async () => {
    const r = await exporta(COMPLET());
    const dades = { 'data/datapackage.json': paquetDe(r, (p) => { p.resources[0] = { ...p.resources[0], name: 'datapackage', path: 'datapackage.json' }; }) };
    await expect(verificaPaquetOpenData(bossa(r, { dades }))).rejects.toThrow(/Recurs sense fitxer: data\/datapackage\.json/);
  });

  test('un Payload-Oxum que no quadra (amb el tagmanifest refet)', async () => {
    const r = await exporta(COMPLET());
    const etiquetes = { 'bag-info.txt': (text) => text.replace(/Payload-Oxum: (\d+)\./, (_, n) => `Payload-Oxum: ${Number(n) + 1}.`) };
    await expect(verificaPaquetOpenData(bossa(r, { etiquetes }))).rejects.toThrow(/Payload-Oxum que no quadra/);
  });

  test('un bagit.txt d’una altra versió de BagIt (amb el tagmanifest refet)', async () => {
    const r = await exporta(COMPLET());
    const etiquetes = { 'bagit.txt': 'BagIt-Version: 0.97\nTag-File-Character-Encoding: UTF-8\n' };
    await expect(verificaPaquetOpenData(bossa(r, { etiquetes }))).rejects.toThrow(/bagit\.txt no és de BagIt 1\.0/);
  });

  test('un bag-info.txt tocat sense refer el tagmanifest', async () => {
    const r = await exporta(COMPLET());
    const original = descodifica(llegeixZip(r.zip).find((e) => e.nom === `${ARREL}/tagmanifest-sha256.txt`).dades);
    const etiquetes = { 'bag-info.txt': (text) => `${text}Contact-Name: Algú de prova\n`, 'tagmanifest-sha256.txt': original };
    await expect(verificaPaquetOpenData(bossa(r, { etiquetes }))).rejects.toThrow(/SHA-256 que no quadra: bag-info\.txt/);
  });

  test('una línia repetida al manifest (amb el tagmanifest refet)', async () => {
    const r = await exporta(COMPLET());
    const etiquetes = { 'manifest-sha256.txt': (text) => `${text}${text.split('\n')[0]}\n` };
    await expect(verificaPaquetOpenData(bossa(r, { etiquetes }))).rejects.toThrow(/línia invàlida o repetida/);
  });

  test('el sostre de lectura (maxEixida) arriba a llegeixZip', async () => {
    const r = await exporta(COMPLET());
    await expect(verificaPaquetOpenData(r.zip, { maxEixida: 1024 })).rejects.toThrow(/passaria de 1024 bytes/);
    await expect(verificaPaquetOpenData(r.zip, { maxEixida: r.zip.length })).resolves.toMatchObject({ fitxers: 14 });
  });
});

describe('Markdown segur i cap ReDoS', () => {
  test('cap enllaç, imatge ni HTML d’un títol arriba viu a memoria.md', () => {
    const titol = '[clica](javascript:alert(1)) <img src=x onerror=alert(1)> **fort** `codi` | taula';
    const md = fitxerDe(prepara({ noticies: [{ ...noticiaEntitat(), title: titol }] }), 'memoria.md');
    /* El «<» ja ix neutre del títol (senseMarcatge) i el «>» s'escapa. */
    expect(md).toContain('\\[clica\\](javascript:alert(1)) ‹img src=x onerror=alert(1)&gt; \\*\\*fort\\*\\* \\`codi\\` \\| taula');
    expect(md).not.toContain('<img');
    expect(md).not.toMatch(/(?<!\\)\[clica(?<!\\)\]\(/);
    expect(escapaMarkdown('a\nb # c')).toBe('a b \\# c');
    expect(escapaMarkdown('<b> & [x](y)')).toBe('‹b&gt; &amp; \\[x\\](y)');
  });

  test('ni el nom de l’entitat que signa (memoria.md) ni el text de la llicència (llicencies.md) arriben vius', () => {
    const hostil = '[clica](javascript:alert(1)) <img src=x onerror=alert(1)> **fort**';
    const escapat = '\\[clica\\](javascript:alert(1)) ‹img src=x onerror=alert(1)&gt; \\*\\*fort\\*\\*';
    const entitat = fila({ id: 'ent-hostil', slug: 'hostil', name: hostil, copyright: hostil, town_name: 'Penàguila' });
    const p = prepara({ entitats: [entitat], noticies: [{ id: 'signada', title: 'Signada', poble_id: TORRE.slug, author_org_id: 'ent-hostil', copyright: hostil }] });
    const md = fitxerDe(p, 'memoria.md');
    expect(md).toMatch(/^- \*\*Signada\*\* · (.*)\(`signada`\)$/m);
    expect(md).toContain(` · ${escapat} (\`signada\`)`);
    const llicencies = fitxerDe(p, 'llicencies.md');
    expect(llicencies).toContain(`| noticies | \`signada\` | ${escapat} | no |`);
    for (const text of [md, llicencies]) {
      expect(text).not.toMatch(/(?<!\\)\[clica(?<!\\)\]\(/);
      expect(text).not.toMatch(/(?<!\\)\*\*fort/);
      expect(text).not.toMatch(MARCATGE);
    }
  });

  test('100.000 caràcters a cada camp de text es processen en temps lineal', () => {
    const llarg = '<'.repeat(50000) + 'a'.repeat(50000);
    const etiquetes = '<p'.repeat(50000);
    const item = { ...noticiaEntitat(), title: llarg, body: etiquetes, entradilla: ' \t'.repeat(50000), copyright: llarg, author_location: llarg, image_url: `/${'a/'.repeat(50000)}` };
    expect(tempsDe(() => prepara({ noticies: [item], agenda: [{ ...item, poble_id: TORRE.slug, date: llarg, time: llarg, inici: llarg }] }))).toBeLessThan(2000);
    expect(tempsDe(() => textDeCos(`<p>${'<b'.repeat(50000)}`))).toBeLessThan(500);
    expect(tempsDe(() => textDeCos(`<p> <${'a'.repeat(100000)}`))).toBeLessThan(500);
    expect(tempsDe(() => imatgeDe(`https://x.org/${'a'.repeat(100000)}`))).toBeLessThan(200);
  });
});

describe('recullDadesPubliquesDelMunicipi: només el que el port servix com a públic', () => {
  const portDe = (files, { ambCapacitat = true } = {}) => ({
    teCapacitat: vi.fn((cap) => ambCapacitat && cap === 'directoriEntitats'),
    listPublicOrganizations: vi.fn(async () => files),
    loadMur: vi.fn(() => { throw new Error('loadMur barreja contingut de membres'); }),
    loadCoreContent: vi.fn(() => { throw new Error('no s’ha de cridar'); })
  });

  test('sense la capacitat directoriEntitats: cap crida i tot pendent', async () => {
    const port = portDe([]);
    const r = await recullDadesPubliquesDelMunicipi({ ...port, teCapacitat: () => false }, TORRE);
    expect(r.entitats).toBeNull();
    expect(r.pendents.map((p) => p.coleccio)).toEqual(['directori', 'noticies', 'agenda', 'memoria', 'memoriaOral', 'configuracio']);
    expect(port.listPublicOrganizations).not.toHaveBeenCalled();
    /* V1-02 · Els motius ixen a memoria.md: valencià planer, sense noms de codi, decisions internes, anglés ni dos punts. */
    expect(Object.fromEntries(r.pendents.map(({ coleccio, motiu }) => [coleccio, motiu]))).toEqual({
      directori: "este servidor de dades no oferix el directori d'entitats",
      noticies: "encara no hi ha cap lectura pública garantida d'estes dades",
      agenda: "encara no hi ha cap lectura pública garantida d'estes dades",
      memoria: 'el Mas no té cap mòdul de memòria cultural',
      /* T2 · D04/D10 (1.2.0) · La memòria oral, sense la lectura pública, com les notícies. */
      memoriaOral: "encara no hi ha cap lectura pública garantida d'estes dades",
      configuracio: "la personalització és de tot el node, no d'un poble, i la fitxa del poble no la inclou"
    });
    for (const { motiu } of r.pendents) {
      expect(motiu, motiu).not.toMatch(/[:()]|[a-z][A-Z]|\bD-[A-Z]\d|\b(?:tenant|backend|port|capacitat|dadesObertes|directoriEntitats)\b/);
    }
  });

  test('amb ella: una sola crida pel NOM del poble, refiltrada; mai loadMur ni loadCoreContent', async () => {
    const port = portDe(ENTITATS);
    const config = { tenantId: '11111111-2222-3333-4444-555555555555' };
    const r = await recullDadesPubliquesDelMunicipi(port, TORRE, { config });
    expect(port.listPublicOrganizations).toHaveBeenCalledTimes(1);
    expect(port.listPublicOrganizations).toHaveBeenCalledWith({ poble: TORRE.nom, limit: LIMIT_DIRECTORI_ENTITATS, signal: undefined }, config);
    expect(r.entitats.map((f) => f.slug)).toEqual(['rentonar', 'forn-de-prova']);
    expect(port.loadMur).not.toHaveBeenCalled();
    expect(port.loadCoreContent).not.toHaveBeenCalled();
    const paquet = prepara({ entitats: r.entitats });
    expect(grafDe(paquet, 'directori.jsonld')).toHaveLength(2);
  });

  test('el signal de qui crida arriba al port (cancel·lar l’exportació cancel·la la petició)', async () => {
    const port = portDe(ENTITATS);
    const control = new AbortController();
    await recullDadesPubliquesDelMunicipi(port, TORRE, { config: {}, signal: control.signal });
    expect(port.listPublicOrganizations.mock.calls[0][0].signal).toBe(control.signal);
  });

  test('al sostre del directori s’atura en lloc de tallar en silenci', async () => {
    const plenes = Array.from({ length: LIMIT_DIRECTORI_ENTITATS }, (_, i) => fila({ id: `org-${i}` }));
    await expect(recullDadesPubliquesDelMunicipi(portDe(plenes), TORRE)).rejects.toThrow(RangeError);
    await expect(recullDadesPubliquesDelMunicipi(portDe(null), TORRE)).rejects.toThrow(/cap llista/);
    await expect(recullDadesPubliquesDelMunicipi(null, TORRE)).rejects.toThrow(/port/);
  });
});

/* T3.1 (marató del 261101) · L'esquema 1.1.0 i l'agenda en iCalendar. El
   lector de davall és independent del generador: llig els BYTES (CRLF, 75
   octets per línia física, cap caràcter partit), desplega les línies
   (§3.1), comprova que els components s'obrin i es tanquen i desescapa el
   TEXT (§3.3.11) fallant amb un «,» o un «;» sense escapar. */
const ENC_ICS = new TextEncoder();
const DEC_ICS = new TextDecoder('utf-8', { fatal: true });
const LINIA_ICS = /^([A-Z][A-Z0-9-]*)((?:;[A-Z][A-Z0-9-]*=[^;:]*)*):(.*)$/;
function desescapaTextIcs(valor) {
  let text = '';
  for (let i = 0; i < valor.length; i += 1) {
    const c = valor[i];
    if (c === ',' || c === ';') throw new Error(`«${c}» sense escapar: ${valor}`);
    if (c !== '\\') { text += c; continue; }
    const seguent = valor[i + 1];
    if (seguent === 'n' || seguent === 'N') text += '\n';
    else if (seguent === ',' || seguent === ';' || seguent === '\\') text += seguent;
    else throw new Error(`escapada invàlida: ${valor}`);
    i += 1;
  }
  return text;
}
function llegeixIcs(text) {
  const bytes = ENC_ICS.encode(text);
  expect([bytes.at(-2), bytes.at(-1)]).toEqual([0x0d, 0x0a]);
  const fisiques = [];
  let inici = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    if (bytes[i] === 0x0a) {
      expect(bytes[i - 1], `LF sense CR a l'octet ${i}`).toBe(0x0d);
      fisiques.push(bytes.subarray(inici, i - 1));
      inici = i + 1;
    } else if (bytes[i] === 0x0d) expect(bytes[i + 1], `CR sense LF a l'octet ${i}`).toBe(0x0a);
  }
  for (const linia of fisiques) {
    expect(linia.length, DEC_ICS.decode(linia)).toBeLessThanOrEqual(75);
    // Cap línia física no comença ni acaba a mitges d'un caràcter UTF-8.
    expect(() => DEC_ICS.decode(linia)).not.toThrow();
  }
  const logiques = text.slice(0, -2).replace(/\r\n[ \t]/g, '').split('\r\n');
  const pila = [];
  const components = [];
  for (const linia of logiques) {
    const m = LINIA_ICS.exec(linia);
    expect(m, linia).not.toBeNull();
    const [, nom, params, valor] = m;
    if (nom === 'BEGIN') { const component = { nom: valor, props: [] }; pila.push(component); components.push(component); continue; }
    if (nom === 'END') { expect(pila.pop()?.nom, linia).toBe(valor); continue; }
    expect(pila.length, linia).toBeGreaterThan(0);
    pila.at(-1).props.push({ nom, params, valor });
  }
  expect(pila).toEqual([]);
  expect(components[0].nom).toBe('VCALENDAR');
  const prop = (component, nom) => {
    const totes = component.props.filter((p) => p.nom === nom);
    expect(totes.length, `${component.nom} ${nom}`).toBeLessThanOrEqual(1);
    return totes[0] ?? null;
  };
  const calendari = components[0];
  expect(prop(calendari, 'VERSION').valor).toBe('2.0');
  expect(prop(calendari, 'PRODID').valor).toMatch(/^-\/\/.+\/\/.+\/\/[A-Z]{2}$/);
  const esdeveniments = components.filter((c) => c.nom === 'VEVENT');
  expect(components.length).toBe(esdeveniments.length + 1);
  expect(esdeveniments.length).toBeGreaterThan(0);
  const text_ = (component, nom) => { const p = prop(component, nom); return p ? desescapaTextIcs(p.valor) : null; };
  return {
    calendari: { nom: text_(calendari, 'NAME'), wr: text_(calendari, 'X-WR-CALNAME'), escala: prop(calendari, 'CALSCALE')?.valor },
    fisiques: fisiques.length,
    logiques: logiques.length,
    esdeveniments: esdeveniments.map((vevent) => {
      for (const obligatori of ['UID', 'DTSTAMP', 'DTSTART']) expect(prop(vevent, obligatori), obligatori).not.toBeNull();
      const dtstart = prop(vevent, 'DTSTART');
      const dtend = prop(vevent, 'DTEND');
      const dia = dtstart.params === ';VALUE=DATE';
      expect(dtstart.valor).toMatch(dia ? /^\d{8}$/ : /^\d{8}T\d{6}Z$/);
      if (!dia) expect(dtstart.params).toBe('');
      if (dtend) {
        expect(dtend.params, 'DTEND del mateix tipus que DTSTART').toBe(dtstart.params);
        expect(dtend.valor > dtstart.valor, 'DTEND posterior').toBe(true);
      }
      for (const nom of ['DTSTAMP', 'CREATED', 'LAST-MODIFIED']) if (prop(vevent, nom)) expect(prop(vevent, nom).valor, nom).toMatch(/^\d{8}T\d{6}Z$/);
      return {
        uid: text_(vevent, 'UID'), dtstamp: prop(vevent, 'DTSTAMP').valor, dtstart: `${dtstart.params}:${dtstart.valor}`,
        dtend: dtend ? `${dtend.params}:${dtend.valor}` : null, resum: text_(vevent, 'SUMMARY'), descripcio: text_(vevent, 'DESCRIPTION'),
        lloc: text_(vevent, 'LOCATION'), classe: prop(vevent, 'CLASS')?.valor, creat: prop(vevent, 'CREATED')?.valor ?? null,
        editat: prop(vevent, 'LAST-MODIFIED')?.valor ?? null, claus: vevent.props.map((p) => p.nom)
      };
    })
  };
}
const icsDe = (preparat) => preparat.fitxers.find((f) => f.nom === 'agenda.ics')?.text ?? null;
const acteDeLaTorre = (extra) => ({ title: 'Acte', poble_id: TORRE.slug, author_org_id: RENTONAR, ...extra });

/* T2 · D04/D10 (assalt 261101) · El format és la 1.2.0 (la memòria oral); l'agenda.ics és la de la 1.1.0, amb la versió del format. */
describe('T3.1 · esquema 1.1.0 i agenda.ics (iCalendar, RFC 5545)', () => {
  test('schemaVersion a datapackage.json, memoria.md, bag-info.txt i el PRODID, i agenda.ics dins del sumari SHA-256', async () => {
    expect(VERSIO_FORMAT).toBe('1.2.0');
    const r = await exporta(COMPLET());
    const fitxers = new Map(llegeixZip(r.zip).map(({ nom, dades }) => [nom.slice(ARREL.length + 1), dades]));
    expect(r.datapackage.socdepoble).toMatchObject({ format: FORMAT_DADES_OBERTES, schemaVersion: '1.2.0', versio: '1.2.0' });
    expect(descodifica(fitxers.get('data/memoria.md'))).toContain(`Paquet \`${FORMAT_DADES_OBERTES}\` (versió 1.2.0)`);
    expect(descodifica(fitxers.get('bag-info.txt'))).toContain('Bag-Software-Agent: Sóc de Poble · exportaMunicipiOpenData 1.2.0\n');
    const ics = fitxers.get('data/agenda.ics');
    expect(descodifica(ics)).toContain('\r\nPRODID:-//Soc de Poble//exportaMunicipiOpenData 1.2.0//CA\r\n');
    // El seu hash al Data Package i al manifest, i el hash del manifest al tagmanifest.
    expect(r.datapackage.resources.find((x) => x.path === 'agenda.ics')).toEqual({
      name: 'agenda-ics', path: 'agenda.ics', title: 'Agenda (iCalendar, RFC 5545)', format: 'ics', mediatype: 'text/calendar',
      encoding: 'utf-8', bytes: ics.length, hash: `sha256:${sha(ics)}`
    });
    expect(descodifica(fitxers.get('manifest-sha256.txt'))).toContain(`${sha(ics)}  data/agenda.ics\n`);
    expect(descodifica(fitxers.get('tagmanifest-sha256.txt'))).toContain(`${sha(fitxers.get('manifest-sha256.txt'))}  manifest-sha256.txt\n`);
    expect(r.fitxers.find((f) => f.cami === 'data/agenda.ics')).toEqual({ cami: 'data/agenda.ics', bytes: ics.length, sha256: sha(ics) });
    await expect(verificaPaquetOpenData(r.zip)).resolves.toMatchObject({ fitxers: 14, recursos: 9 });
    // Un byte de l'.ics canviat: el verificador ho veu.
    const tocat = creaZip(llegeixZip(r.zip).map((e) => (e.nom.endsWith('/data/agenda.ics') ? { ...e, dades: Uint8Array.from(e.dades, (b, i) => (i === 20 ? b ^ 1 : b)) } : e)));
    await expect(verificaPaquetOpenData(tocat)).rejects.toThrow(/SHA-256 que no quadra: data\/agenda\.ics/);
  });

  test('l’acte de La Torre: un VEVENT amb UID estable, DTSTAMP de l’última edició, l’hora en UTC i CLASS:PUBLIC', () => {
    const p = prepara(COMPLET());
    const { calendari, esdeveniments } = llegeixIcs(icsDe(p));
    /* G2-06 · El nom del calendari contrau l'article del poble: «la Torre», en minúscula. */
    expect(calendari).toEqual({ nom: 'Agenda de la Torre de les Maçanes', wr: 'Agenda de la Torre de les Maçanes', escala: 'GREGORIAN' });
    /* L'Aplec de la llavor no és de La Torre (sensePoble): tampoc al calendari. */
    expect(esdeveniments).toEqual([{
      uid: `agenda-festa-de-prova.${TORRE.slug}@socdepoble.org`,
      dtstamp: '20260802T100000Z',
      dtstart: ':20260815T200000Z',
      dtend: null,
      resum: 'Festa de prova',
      descripcio: null,
      lloc: 'Plaça de prova',
      classe: 'PUBLIC',
      creat: '20260801T100000Z',
      editat: '20260802T100000Z',
      claus: ['UID', 'DTSTAMP', 'DTSTART', 'SUMMARY', 'LOCATION', 'CLASS', 'CREATED', 'LAST-MODIFIED']
    }]);
    const md = fitxerDe(p, 'memoria.md');
    expect(md).toContain('| `agenda.ics` | 1 |');
    expect(md).toContain("L'acte amb data d'inici també és a `agenda.ics` (iCalendar, RFC 5545), per a importar-lo a qualsevol calendari.");
    expect(md).toContain('(schema.org JSON-LD, iCalendar RFC 5545, Frictionless Data Package v2');
  });

  /* Gauntlet 261101 (B1-02) · L'escapat i el plegat són els d'utils/ics.js (escapa i plega,
     amb les seues proves unitàries a ics.test.js): ací, l'anada i tornada dins del paquet. */
  test('caràcters especials i línies llargues: «,», «;», «\\» i salts escapats, plegat a 75 octets sense partir cap caràcter, i anada i tornada exacta', () => {
    const titol = 'Ball, sopar; i \\ barra: la festa de la Maçana 🍎 a la plaça, amb música en directe, focs i coca';
    const entradilla = `Primer paràgraf: «quan arriba la tardor», la Torre de les Maçanes es vestix de festa; hi haurà 中文, ελληνικά i ☃️.\n\nSegon paràgraf amb ${'paraules valencianes llargues '.repeat(8)}i punt final.`;
    const lloc = 'Plaça Major, 1; davant de l’Ajuntament \\ porxada';
    const p = prepara({ agenda: [acteDeLaTorre({ id: 'ball,de;festa\\1', title: titol, subtitle: 'Festes; tardor, 2026', entradilla, location: `${TORRE.nom} · ${lloc}`, date: '2026-10-31', time: '21:30' })] });
    const ics = icsDe(p);
    const lectura = llegeixIcs(ics);
    expect(lectura.fisiques).toBeGreaterThan(lectura.logiques);
    const [acte] = grafDe(p, 'agenda.jsonld');
    const [vevent] = lectura.esdeveniments;
    expect(vevent.resum).toBe(acte.name);
    expect(vevent.resum).toBe(titol);
    expect(vevent.descripcio).toBe(`${acte.disambiguatingDescription}\n\n${acte.description}`);
    expect(vevent.descripcio).toContain('\n\nSegon paràgraf');
    expect(vevent.lloc).toBe(acte.location.name);
    // L'id amb «,», «;» i «\» ix codificat a l'UID (agenda-ball%2Cde%3Bfesta%5C1…): el mateix cada volta, sense res a escapar.
    expect(vevent.uid).toBe(`agenda-ball%2Cde%3Bfesta%5C1.${TORRE.slug}@socdepoble.org`);
    expect(ics).toContain(`\r\nUID:agenda-ball%2Cde%3Bfesta%5C1.${TORRE.slug}@socdepoble.org\r\n`);
    expect(vevent.dtstart).toBe(':20261031T203000Z');
    expect(ics).toContain('SUMMARY:Ball\\, sopar\\; i \\\\ barra');
    // 100.000 caràcters per camp: temps lineal i, igualment, cap línia de més de 75 octets ni cap escapada perduda.
    const enorme = { id: 'enorme', title: 'ç,'.repeat(50000), entradilla: '🎉;\n'.repeat(30000), location: `${TORRE.nom} · ${'\\'.repeat(100000)}`, date: '2026-10-31' };
    let gran = null;
    expect(tempsDe(() => { gran = prepara({ agenda: [acteDeLaTorre(enorme)] }); })).toBeLessThan(2000);
    const [lleig] = llegeixIcs(icsDe(gran)).esdeveniments;
    const [acteLleig] = grafDe(gran, 'agenda.jsonld');
    expect([lleig.resum, lleig.descripcio, lleig.lloc]).toEqual([acteLleig.name, acteLleig.description, acteLleig.location.name]);
  });

  /* Gauntlet 261101 (B1-01) · La fi de l'acte és EXCLUSIVA (la del model d'esdeveniment): la
     fira del 15 que acaba { data: '…-16' } és d'un sol dia. endDate n'és l'últim dia (el 15) i
     DTEND, el dia següent a l'últim (el 16), el mateix que aIcs. */
  test('dies sencers, finals i hores d’hivern: DTEND exclusiu, del mateix tipus i posterior; sense inici, fora del calendari però dit', async () => {
    const p = prepara({ agenda: [
      acteDeLaTorre({ id: 'fira', date: '2026-07-15', fi: { data: '2026-07-16' } }),
      acteDeLaTorre({ id: 'tres-dies', inici: { data: '2026-07-15' }, fi: '2026-07-18' }),
      acteDeLaTorre({ id: 'fi-igual', date: '2026-07-19', fi: { data: '2026-07-19' } }),
      acteDeLaTorre({ id: 'un-dia', date: '2026-07-20' }),
      acteDeLaTorre({ id: 'tipus-barrejats', date: '2026-07-21', fi: '2026-07-21T23:00' }),
      acteDeLaTorre({ id: 'barrejats-al-reves', inici: '2026-07-21T20:00', fi: { data: '2026-07-22' } }),
      acteDeLaTorre({ id: 'fi-abans', inici: '2026-07-22T20:00', fi: '2026-07-22T19:00' }),
      acteDeLaTorre({ id: 'amb-fi', date: '2026-07-23', time: '19:30', fi: '2026-07-23T23:00' }),
      acteDeLaTorre({ id: 'nit-de-nadal', date: '2026-12-24', time: '22:00' }),
      acteDeLaTorre({ id: 'cap-d-any', date: '9999-12-30', fi: { data: '9999-12-31' } }),
      acteDeLaTorre({ id: 'sense-inici' })
    ] });
    const actes = Object.fromEntries(grafDe(p, 'agenda.jsonld').map((acte) => [acte.identifier, [acte.startDate ?? null, acte.endDate ?? null]]));
    expect(actes).toEqual({
      fira: ['2026-07-15', '2026-07-15'],
      'tres-dies': ['2026-07-15', '2026-07-17'],
      // Una fi exclusiva igual a l'inici no deixa cap dia: el model no admet l'acte, i no hi ha endDate.
      'fi-igual': ['2026-07-19', null],
      'un-dia': ['2026-07-20', null],
      'tipus-barrejats': ['2026-07-21', '2026-07-21T23:00:00+02:00'],
      'barrejats-al-reves': ['2026-07-21T20:00:00+02:00', '2026-07-21'],
      'fi-abans': ['2026-07-22T20:00:00+02:00', '2026-07-22T19:00:00+02:00'],
      'amb-fi': ['2026-07-23T19:30:00+02:00', '2026-07-23T23:00:00+02:00'],
      'nit-de-nadal': ['2026-12-24T22:00:00+01:00', null],
      'cap-d-any': ['9999-12-30', '9999-12-30'],
      'sense-inici': [null, null]
    });
    const dates = Object.fromEntries(llegeixIcs(icsDe(p)).esdeveniments.map((e) => [e.uid.split('.')[0], [e.dtstart, e.dtend, e.dtstamp]]));
    /* Sense data d'edició ni de publicació, DTSTAMP és `ara` (mai cap rellotge). */
    expect(dates).toEqual({
      'agenda-fira': [';VALUE=DATE:20260715', ';VALUE=DATE:20260716', '20261030T000000Z'],
      'agenda-tres-dies': [';VALUE=DATE:20260715', ';VALUE=DATE:20260718', '20261030T000000Z'],
      'agenda-fi-igual': [';VALUE=DATE:20260719', null, '20261030T000000Z'],
      'agenda-un-dia': [';VALUE=DATE:20260720', null, '20261030T000000Z'],
      'agenda-tipus-barrejats': [';VALUE=DATE:20260721', null, '20261030T000000Z'],
      'agenda-barrejats-al-reves': [':20260721T180000Z', null, '20261030T000000Z'],
      'agenda-fi-abans': [':20260722T180000Z', null, '20261030T000000Z'],
      'agenda-amb-fi': [':20260723T173000Z', ':20260723T210000Z', '20261030T000000Z'],
      'agenda-nit-de-nadal': [':20261224T210000Z', null, '20261030T000000Z'],
      'agenda-cap-d-any': [';VALUE=DATE:99991230', ';VALUE=DATE:99991231', '20261030T000000Z']
    });
    /* B1-07 · L'acte sense inici SÍ que és al paquet (agenda.jsonld): no és cap omissió. Ho diu
       la secció de l'agenda, i datapackage.json en porta el recompte a socdepoble.calendari. */
    expect(p.omissions.agenda).toEqual({});
    expect(p.calendari).toEqual({ actes: 10, senseInici: 1, foraDAbast: 0 });
    const md = fitxerDe(p, 'memoria.md');
    expect(md).toContain('| `agenda.ics` | 10 |');
    expect(md).toContain("Els 10 actes amb data d'inici també són a `agenda.ics` (iCalendar, RFC 5545), per a importar-los a qualsevol calendari.\n\nL'acte sense data d'inici només és a `agenda.jsonld`: cap calendari no el pot situar.\n");
    expect(md.slice(md.indexOf('## Què queda fora'))).not.toMatch(/data d'inici|calendari/);
    const r = await exporta({ agenda: [acteDeLaTorre({ id: 'un', date: '2026-07-20' }), acteDeLaTorre({ id: 'dos' }), acteDeLaTorre({ id: 'tres' })] });
    expect(r.datapackage.socdepoble.calendari).toEqual({ actes: 1, senseInici: 2, foraDAbast: 0 });
    const { actes: ambIcs, senseInici: sense, foraDAbast: fora } = r.datapackage.socdepoble.calendari;
    expect(ambIcs + sense + fora).toBe(r.datapackage.socdepoble.comptes.agenda);
    expect(r.datapackage.socdepoble.omissions.agenda).toEqual({});
  });

  /* B1-01 · La prova creuada: la mateixa fira, al paquet i a aIcs (el serialitzador de l'App,
     des del model d'esdeveniment), dona el mateix DTSTART i el mateix DTEND. */
  test('un acte de 1 i de 3 dies: el mateix DTSTART i DTEND que aIcs del model d’esdeveniment', () => {
    const momentsDe = (ics) => ics.replace(/\r\n /g, '').split('\r\n').filter((linia) => /^DT(?:START|END)[;:]/.test(linia));
    for (const [inici, fi] of [['2026-08-15', '2026-08-16'], ['2026-08-15', '2026-08-18'], ['2026-12-31', '2027-01-01']]) {
      const delPaquet = icsDe(prepara({ agenda: [acteDeLaTorre({ id: 'fira', inici: { data: inici }, fi: { data: fi } })] }));
      const delModel = aIcs([creaEsdeveniment({ id: 'fira', titol: 'Acte', inici: { data: inici }, fi: { data: fi } })], { ara: new Date(ARA) });
      expect(momentsDe(delPaquet), `${inici}..${fi}`).toEqual(momentsDe(delModel));
      expect(momentsDe(delPaquet)).toEqual([`DTSTART;VALUE=DATE:${inici.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${fi.replace(/-/g, '')}`]);
    }
  });

  test('sense cap acte amb data d’inici no hi ha agenda.ics (un VCALENDAR buit no és vàlid), ni fila ni menció, i el paquet es verifica', async () => {
    for (const agenda of [undefined, [], [acteDeLaTorre({ id: 'sense-inici' })]]) {
      const p = prepara({ agenda });
      expect(icsDe(p)).toBeNull();
      expect(p.fitxers.map((f) => f.nom)).not.toContain('agenda.ics');
      expect(fitxerDe(p, 'memoria.md')).not.toMatch(/agenda\.ics`|iCalendar/);
      const r = await exporta({ agenda });
      expect(r.datapackage.resources.map((x) => x.path)).not.toContain('agenda.ics');
      await expect(verificaPaquetOpenData(r.zip)).resolves.toMatchObject({ fitxers: 13, recursos: 8 });
    }
    /* B1-07 · Un acte sense data d'inici és a agenda.jsonld i la memòria diu per què no hi ha calendari;
       sense cap acte, datapackage.json no porta cap recompte del calendari. */
    expect(fitxerDe(prepara({ agenda: [acteDeLaTorre({ id: 'sense-inici' })] }), 'memoria.md'))
      .toContain("L'acte no té data d'inici: cap calendari no el pot situar, i el paquet no porta cap calendari .ics.\n");
    expect((await exporta({ agenda: [acteDeLaTorre({ id: 'sense-inici' })] })).datapackage.socdepoble.calendari).toEqual({ actes: 0, senseInici: 1, foraDAbast: 0 });
    expect((await exporta({ agenda: [] })).datapackage.socdepoble).not.toHaveProperty('calendari');
  });

  test('només el que és públic: cap acte privat, de persones, del veïnat ni d’un altre poble, i cap correu, telèfon, persona ni GPS', () => {
    const p = prepara({
      agenda: [
        acteEntitat(),
        acteDeLaTorre({ id: 'privat', date: '2026-08-16', visibility: 'private', title: TRAMPES.persona }),
        acteDeLaTorre({ id: 'de-persona', date: '2026-08-17', author_org_id: undefined, author_id: TRAMPES.membre, title: TRAMPES.persona }),
        acteDeLaTorre({ id: 'del-veinat', date: '2026-08-18', owner_user_id: TRAMPES.usuari, title: TRAMPES.persona }),
        acteDeLaTorre({ id: 'de-penaguila', date: '2026-08-19', poble_id: 'penaguila', title: 'De Penàguila' }),
        acteDeLaTorre({ id: 'amb-trampes', date: '2026-08-20', title: 'Amb trampes', telefon: TRAMPES.telefon, email: TRAMPES.correu, geolocalitzacio: { lat: 38.59191, lng: -0.41842 }, ip: TRAMPES.ip })
      ],
      entitats: ENTITATS
    });
    const ics = icsDe(p);
    expect(llegeixIcs(ics).esdeveniments.map((e) => e.uid.split('.')[0])).toEqual(['agenda-festa-de-prova', 'agenda-amb-trampes']);
    for (const valor of [...Object.values(TRAMPES), 'De Penàguila', '38.59191', '-0.41842']) expect(ics, valor).not.toContain(valor);
    expect(ics).not.toMatch(/^(?:ORGANIZER|ATTENDEE|CONTACT|GEO|URL)[;:]/m);
    expect(ics).not.toMatch(/mailto:|tel:/i);
    expect(ics.match(/^X-[A-Z-]+/gm)).toEqual(['X-WR-CALNAME']);
  });

  test('determinisme: el mateix .ics i els mateixos hashos per a les mateixes dades, en qualsevol ordre i amb qualsevol rellotge', async () => {
    const a = await exporta(COMPLET());
    const hashIcs = (r) => r.fitxers.find((f) => f.cami === 'data/agenda.ics').sha256;
    const girat = (llista) => [...llista].reverse().map((x) => Object.fromEntries(Object.entries(x).reverse()));
    const b = await exportaMunicipiOpenData({ municipi: TORRE, ara: ARA, origen: ORIGEN, ...COMPLET(), agenda: girat(COMPLET().agenda), entitats: girat(ENTITATS) });
    expect([hashIcs(b), b.sha256]).toEqual([hashIcs(a), a.sha256]);
    vi.useFakeTimers({ now: new Date('2031-03-03T03:03:03Z'), toFake: ['Date'] });
    const c = await exporta(COMPLET());
    vi.useRealTimers();
    expect([hashIcs(c), c.sha256]).toEqual([hashIcs(a), a.sha256]);
    /* Un altre `ara` canvia memoria.md i bag-info.txt (i el ZIP), però no l'.ics d'un acte amb dates: el seu DTSTAMP és la seua última edició. */
    const d = await exporta({ ...COMPLET(), ara: '2026-11-01T00:00:00Z' });
    expect(hashIcs(d)).toBe(hashIcs(a));
    expect(d.sha256).not.toBe(a.sha256);
    /* Sense cap data a l'acte, DTSTAMP és l'`ara` explícit de l'entrada. */
    const senseDates = (ara) => icsDe(preparaDadesObertesMunicipi({ municipi: TORRE, ara, agenda: [acteDeLaTorre({ id: 'sense-dates', date: '2026-08-15' })] }));
    expect(senseDates('2026-11-01T00:00:00Z')).toContain('\r\nDTSTAMP:20261101T000000Z\r\n');
    expect(senseDates('2026-11-01T00:00:00Z')).toBe(senseDates('2026-11-01T00:00:00Z'));
  });

  /* Gauntlet 261101 (B1-05) · Abans, amb un acte sense dates, el DTSTAMP de `ara` llegia `.valor` de null (TypeError cru). */
  test('un `ara` que passa de l’any 9999 en UTC s’atura amb un missatge clar, amb agenda o sense', () => {
    const acte = acteDeLaTorre({ id: 'sense-dates', date: '2026-08-15' });
    for (const agenda of [undefined, [acte]]) {
      expect(() => prepara({ ara: '9999-12-31T23:30:00-01:00', agenda })).toThrow(/^L'instant de l'exportació \(`ara`\) ha de caure dins de l'any 9999 en UTC\.$/);
    }
    // El mateix dia amb un desfasament positiu encara és de l'any 9999 en UTC: DTSTAMP amb quatre xifres.
    expect(icsDe(prepara({ ara: '9999-12-31T23:30:00+01:00', agenda: [acte] }))).toContain('\r\nDTSTAMP:99991231T223000Z\r\n');
  });

  /* Gauntlet 2 261101 (G2-07) · Un acte AMB data d'inici vàlida a agenda.jsonld que, en UTC, passa
     de l'any 9999 (9999-12-31T23:30:00-01:00 és el +010000-01-01T00:30:00Z): iCalendar no la pot
     escriure i no va a agenda.ics, però TÉ data d'inici. Abans es comptava a senseInici i memoria.md
     deia, en fals, «L'acte no té data d'inici». Ara va a foraDAbast, amb una frase pròpia. */
  test('un inici vàlid que iCalendar no pot escriure no es compta com a «sense data d’inici»: foraDAbast i una frase certa', async () => {
    const fora = acteDeLaTorre({ id: 'fora', inici: '9999-12-31T23:30:00-01:00' });
    const sol = prepara({ agenda: [fora] });
    expect(grafDe(sol, 'agenda.jsonld').map((a) => a.startDate)).toEqual(['9999-12-31T23:30:00-01:00']);
    expect(icsDe(sol)).toBeNull();
    expect(sol.calendari).toEqual({ actes: 0, senseInici: 0, foraDAbast: 1 });
    const mdSol = fitxerDe(sol, 'memoria.md');
    expect(mdSol).not.toMatch(/no té data d'inici|sense data d'inici/);
    expect(mdSol).toContain("L'acte amb una data d'inici que, en UTC, cau fora dels anys 0000 a 9999 només és a `agenda.jsonld`: iCalendar (RFC 5545) no pot escriure eixa data, i el paquet no porta cap calendari .ics.\n");
    /* Amb un acte al calendari i un sense inici: cada recompte, la seua frase. */
    const mixt = prepara({ agenda: [fora, acteDeLaTorre({ id: 'fora-2', inici: '9999-12-31T22:00:00-02:00' }), acteDeLaTorre({ id: 'un', date: '2026-07-20' }), acteDeLaTorre({ id: 'sense' })] });
    expect(mixt.calendari).toEqual({ actes: 1, senseInici: 1, foraDAbast: 2 });
    expect(fitxerDe(mixt, 'memoria.md')).toContain([
      "L'acte amb data d'inici també és a `agenda.ics` (iCalendar, RFC 5545), per a importar-lo a qualsevol calendari.",
      "L'acte sense data d'inici només és a `agenda.jsonld`: cap calendari no el pot situar.",
      "Els 2 actes amb una data d'inici que, en UTC, cau fora dels anys 0000 a 9999 només són a `agenda.jsonld`: iCalendar (RFC 5545) no pot escriure eixa data.",
      ''
    ].join('\n\n'));
    /* Sense cap acte al calendari, un sense inici i un fora d'abast: cap «Cap dels N actes». */
    const senseIcs = fitxerDe(prepara({ agenda: [fora, acteDeLaTorre({ id: 'sense' })] }), 'memoria.md');
    expect(senseIcs).toContain("L'acte sense data d'inici només és a `agenda.jsonld`: cap calendari no el pot situar.\n");
    expect(senseIcs).not.toMatch(/Cap dels \d+ actes/);
    /* datapackage.json: el recompte complet, que suma tota l'agenda; i el paquet es verifica. */
    const r = await exporta({ agenda: [fora, acteDeLaTorre({ id: 'un', date: '2026-07-20' })] });
    expect(r.datapackage.socdepoble.calendari).toEqual({ actes: 1, senseInici: 0, foraDAbast: 1 });
    expect(r.datapackage.socdepoble.comptes.agenda).toBe(2);
    await expect(verificaPaquetOpenData(r.zip)).resolves.toMatchObject({ fitxers: 14 });
  });

  /* Gauntlet 2 261101 (G2-06) · El nom del calendari (NAME i X-WR-CALNAME, el que mostren Google,
     Apple i Thunderbird) i els títols del paquet contrauen l'article i apostrofen, com mana l'AVL:
     «Agenda d'Alcoi», «del Campello», «dels Poblets». La regla és la de nomDeLaGent
     (sections/pobles/nomsDelPoble.js), una sola font: la i i la u semivocals no s'apostrofen. */
  test('G2-06 · «Agenda d’Alcoi», «del Campello», «dels Poblets»: el nom del calendari i els títols del paquet amb la contracció i l’apòstrof', async () => {
    const CASOS = [
      ['Alcoi', "d'Alcoi"], ['El Campello', 'del Campello'], ['Els Poblets', 'dels Poblets'], ["L'Alfàs del Pi", "de l'Alfàs del Pi"],
      ['La Torre de les Maçanes', 'de la Torre de les Maçanes'], ['Les Coves de Vinromà', 'de les Coves de Vinromà'],
      ['Benillup', 'de Benillup'], ['Iecla', 'de Iecla'], ['Orxeta', "d'Orxeta"]
    ];
    for (const [nom, de] of CASOS) {
      const slug = normalitzaSlugMunicipi(nom);
      const entrada = { municipi: { nom }, ara: ARA, agenda: [{ id: 'fira', title: 'Fira', poble_id: slug, author_org_id: RENTONAR, date: '2026-07-20' }] };
      const p = preparaDadesObertesMunicipi(entrada);
      expect(llegeixIcs(icsDe(p)).calendari, nom).toEqual({ nom: `Agenda ${de}`, wr: `Agenda ${de}`, escala: 'GREGORIAN' });
      expect(fitxerDe(p, 'memoria.md').split('\n')[0], nom).toBe(`# Dades obertes ${de}`);
      const r = await exportaMunicipiOpenData(entrada);
      expect(r.datapackage.title, nom).toBe(`Dades obertes ${de}`);
      const bag = descodifica(llegeixZip(r.zip).find((e) => e.nom.endsWith('/bag-info.txt')).dades);
      expect(bag, nom).toContain(`\nExternal-Description: Dades obertes públiques ${de} (${FORMAT_DADES_OBERTES})\n`);
    }
    /* Cap «de El», «de Els», «de L'» ni «de» davant de vocal en cap fitxer de text del paquet. */
    const r = await exportaMunicipiOpenData({ municipi: { nom: 'El Campello' }, ara: ARA, origen: ORIGEN, actorsPublicats: ['el-campello'] });
    expect(totElText(r)).not.toMatch(/\bde (?:El|Els|La|Les|L'|[AEIOUÀÈÉÍÒÓÚaeiouàèéíòóú])/);
    expect(JSON.parse(descodifica(llegeixZip(r.zip).find((e) => e.nom.endsWith('/data/municipi.jsonld')).dades)).subjectOf.name)
      .toBe('Actor ActivityPub del Campello a Sóc de Poble (fase 1, només lectura)');
  });

  /* Gauntlet 261101 (B1-04) · El que diu el comentari de VERSIO_FORMAT: el verificador 1.0.0 només
     admetia data/*.jsonld|json|md (el seu NOM_DE_DADES, ací copiat), i agenda.ics és l'únic nom
     nou; sense cap acte amb data d'inici, el paquet 1.1.0 no en porta cap. I el verificador 1.1.0
     accepta un paquet 1.0.0 (sense schemaVersion, sense calendari i sense agenda.ics). */
  test('compatibilitat amb la 1.0.0: només data/agenda.ics cau fora de la llista tancada, i el verificador 1.1.0 llig un paquet 1.0.0', async () => {
    const NOM_DE_DADES_1_0_0 = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jsonld|json|md)$/;
    const fora = (r) => r.fitxers.map((f) => f.cami).filter((cami) => cami.startsWith('data/') && !NOM_DE_DADES_1_0_0.test(cami.slice('data/'.length)));
    expect(fora(await exporta(COMPLET()))).toEqual(['data/agenda.ics']);
    const sense = await exporta({ ...COMPLET(), agenda: [acteDeLaTorre({ id: 'sense-inici' })] });
    expect(fora(sense)).toEqual([]);

    // Un paquet amb la forma de la 1.0.0, amb la bossa refeta de manera coherent.
    const ENC = new TextEncoder();
    const fitxers = new Map(llegeixZip(sense.zip).map(({ nom, dades }) => [nom.slice(ARREL.length + 1), descodifica(dades)]));
    for (const cami of ['data/memoria.md', 'bag-info.txt']) fitxers.set(cami, fitxers.get(cami).replaceAll(VERSIO_FORMAT, '1.0.0'));
    const paquet = JSON.parse(fitxers.get('data/datapackage.json'));
    delete paquet.socdepoble.schemaVersion;
    delete paquet.socdepoble.calendari;
    paquet.socdepoble.versio = '1.0.0';
    const memoria = paquet.resources.find((recurs) => recurs.path === 'memoria.md');
    Object.assign(memoria, { bytes: ENC.encode(fitxers.get('data/memoria.md')).length, hash: `sha256:${sha(fitxers.get('data/memoria.md'))}` });
    fitxers.set('data/datapackage.json', jsonCanonic(paquet));
    const carrega = [...fitxers.keys()].filter((cami) => cami.startsWith('data/')).sort();
    fitxers.set('manifest-sha256.txt', carrega.map((cami) => `${sha(fitxers.get(cami))}  ${cami}\n`).join(''));
    const octets = carrega.reduce((total, cami) => total + ENC.encode(fitxers.get(cami)).length, 0);
    fitxers.set('bag-info.txt', fitxers.get('bag-info.txt').replace(/Payload-Oxum: .*\n/, `Payload-Oxum: ${octets}.${carrega.length}\n`));
    fitxers.set('tagmanifest-sha256.txt', ['bag-info.txt', 'bagit.txt', 'manifest-sha256.txt'].map((cami) => `${sha(fitxers.get(cami))}  ${cami}\n`).join(''));
    const paquet100 = creaZip([...fitxers].sort(([a], [b]) => (a < b ? -1 : 1)).map(([cami, text]) => ({ nom: `${ARREL}/${cami}`, dades: ENC.encode(text) })));
    expect(descodifica(llegeixZip(paquet100).find((e) => e.nom.endsWith('/bag-info.txt')).dades)).toContain('exportaMunicipiOpenData 1.0.0\n');
    await expect(verificaPaquetOpenData(paquet100)).resolves.toEqual({ slug: TORRE.slug, arrel: ARREL, fitxers: 13, recursos: 8 });
  });
});

/* T2 · D04/D10 (assalt 261101; pla 261101_1246, D-3) · La memòria oral al
   paquet 1.2.0 i la recollida amb la capacitat 'dadesObertes'. */
describe('T2 · memòria oral (OKF v0.2) al paquet 1.2.0', async () => {
  const memoria = await import('../sections/notes/memoriaOral.js');
  const { ACTOR_HUMA_PUBLICABLE } = await import('./exportaMunicipiOpenData.js');
  const { PERSONA_SENSE_IDENTIFICADOR } = await import('../sections/notes/memoriaOralDelBloc.js');
  const RELAT_ORAL = "A la Torre de les Maçanes, quan arribava la collita de les olives, tot el poble anava a l'almàssera i les xiquetes portaven el berenar als bancals de dalt.";
  const revisada = (persona = 'sense-identificador') => memoria.marcaRevisioHumana(
    memoria.estructuraMemoriaOral(RELAT_ORAL, { ara: '2026-10-30T09:00:00Z', autor: 'sense-identificador' }), { persona, ara: '2026-10-31T09:00:00Z' });
  const fitxa = (extra = {}, f = revisada()) => ({ id: 'relat-olives', okf: { cami: f.okf.cami, frontmatter: structuredClone(f.okf.frontmatter), cos: f.okf.cos },
    author_org_id: RENTONAR, copyright: 'CC BY 4.0', created_at: '2026-10-31T09:00:00Z', visibility: 'public', ...extra });

  test('l’actor humà publicable és el del Bloc, sense identificador', () => {
    expect(ACTOR_HUMA_PUBLICABLE).toBe(`human:${PERSONA_SENSE_IDENTIFICADOR}`);
  });

  test('una fitxa revisada i signada: memoria-oral.jsonld, okf/<camí> = markdownOkf, index.md i log.md deterministes', async () => {
    const f = revisada();
    const r = prepara({ entitats: ENTITATS, memoriaOral: [fitxa()] });
    const noms = r.fitxers.map((x) => x.nom);
    expect(noms).toEqual(expect.arrayContaining(['memoria-oral.jsonld', `okf/${f.okf.cami}`, 'okf/index.md', 'okf/log.md']));
    expect(fitxerDe(r, `okf/${f.okf.cami}`)).toBe(f.okf.markdown);
    expect(fitxerDe(r, `okf/${f.okf.cami}`)).toBe(memoria.markdownOkf(f.okf.frontmatter, f.okf.cos));
    const [node] = grafDe(r, 'memoria-oral.jsonld');
    expect(node).toMatchObject({ '@type': 'CreativeWork', identifier: 'relat-olives', genre: memoria.TIPUS_OKF, creativeWorkStatus: 'stable',
      url: `okf/${f.okf.cami}`, encodingFormat: 'text/markdown', contentLocation: { '@id': `municipi.jsonld#${TORRE.slug}` },
      author: { '@id': `directori.jsonld#${RENTONAR}`, name: 'Rentonar' }, license: 'https://creativecommons.org/licenses/by/4.0/' });
    expect(Object.keys(node).filter((k) => !['@type', '@id', 'identifier', 'name', 'abstract', 'genre', 'keywords', 'creativeWorkStatus', 'contentLocation', 'url',
      'encodingFormat', 'datePublished', 'dateModified', 'author', 'license', 'copyrightNotice'].includes(k))).toEqual([]);
    expect(fitxerDe(r, 'okf/index.md')).toBe(memoria.indexOkf([{ okf: { cami: f.okf.cami, frontmatter: f.okf.frontmatter }, municipi: { nom: TORRE.nom } }], { titol: 'Memòria oral' }));
    expect(fitxerDe(r, 'okf/log.md')).toBe(`---\nokf_version: "0.2"\n---\n\n# Registre de la memòria oral\n\n${memoria.entradaLog({ okf: f.okf }, { ara: '2026-10-31T09:00:00Z' })}`);
    expect(r.comptes.memoriaOral).toBe(1);
    expect(fitxerDe(r, 'memoria.md')).toContain('## Memòria oral (fitxes OKF) (1)');
    expect(fitxerDe(r, 'llicencies.md')).toContain('| memoria-oral | `relat-olives` | CC BY 4.0 | sí |');
    for (const nom of noms) expect([nom, MARCATGE.test(fitxerDe(r, nom).replace(/<script/gi, ''))]).toEqual([nom, false]);
    // El paquet sencer es verifica, i els recursos okf- porten el seu nom.
    const paquet = await exporta({ entitats: ENTITATS, memoriaOral: [fitxa()] });
    await expect(verificaPaquetOpenData(paquet.zip)).resolves.toMatchObject({ slug: TORRE.slug });
    expect(paquet.datapackage.resources.map((x) => x.name)).toEqual(expect.arrayContaining(['memoria-oral', 'okf-index', 'okf-log', expect.stringMatching(/^okf-la-torre-de-les-macanes--/)]));
  });

  test('només ix la fitxa estable, revisada per una persona, signada, del poble i sense identificador de compte', () => {
    const esborrany = memoria.estructuraMemoriaOral(RELAT_ORAL, { ara: '2026-10-30T09:00:00Z' });
    const ambCompte = revisada('0b0e0000-0000-4000-8000-00000000dead');
    const altreCami = (f, sufix) => ({ ...f, okf: { ...f.okf, cami: f.okf.cami.replace('.md', `-${sufix}.md`) } });
    const r = prepara({ entitats: ENTITATS, memoriaOral: [
      fitxa(),
      altreCami(fitxa({ id: 'esborrany' }, esborrany), 'a'),
      altreCami(fitxa({ id: 'amb-compte' }, ambCompte), 'b'),
      fitxa({ id: 'veina', owner_user_id: TRAMPES.usuari }),
      fitxa({ id: 'sense-entitat', author_org_id: undefined }),
      fitxa({ id: 'privada', visibility: 'members' }),
      altreCami(fitxa({ id: 'sella', okf: { ...fitxa().okf, frontmatter: { ...fitxa().okf.frontmatter, municipi: 'sella' } } }), 'c'),
      fitxa({ id: 'cami-hostil', okf: { ...fitxa().okf, cami: 'memoria-oral/la-torre-de-les-macanes/../../x.md' } }),
      fitxa({ id: 'sense-poble', okf: { cami: 'x.md', frontmatter: {}, cos: '' } })
    ] });
    expect(grafDe(r, 'memoria-oral.jsonld').map((n) => n.identifier)).toEqual(['relat-olives']);
    expect(r.omissions.memoriaOral).toEqual({ actorsAmbIdentificador: 1, altresPobles: 1, nomesMembres: 1, noPubliques: 1, noRevisades: 1, okfInvalides: 1,
      senseEntitat: 1, sensePoble: 1 });
    expect(fitxerDe(r, 'memoria.md')).toContain("- memoriaOral: 1 fitxes amb l'identificador d'una persona");
    expect(JSON.stringify(r.fitxers)).not.toContain('0b0e0000-0000-4000-8000-00000000dead');
  });

  test('un camí repetit atura; una font amb consulta o de Storage no ix', () => {
    const f = fitxa();
    expect(() => prepara({ memoriaOral: [f, { ...f, id: 'copia' }] })).toThrow(/Camí OKF repetit/);
    const ambConsulta = fitxa();
    ambConsulta.okf.frontmatter.sources[0].resource = 'https://socdepoble.org/notes/1?token=secret';
    const deStorage = fitxa();
    deStorage.okf.frontmatter.sources[0].resource = 'https://x.supabase.co/storage/v1/object/sign/mitjans/a.mp3';
    for (const dolenta of [ambConsulta, deStorage]) expect(prepara({ memoriaOral: [dolenta] }).omissions.memoriaOral).toEqual({ okfInvalides: 1 });
  });

  test('el text de la persona ix sense marcatge: el títol en una línia i el cos sense cap «<» que obriga res', () => {
    const f = fitxa();
    f.okf.frontmatter.title = 'Relat\n<img src=x onerror=alert(1)>';
    f.okf.cos = `${f.okf.cos}\n<script>alert(1)</script>\n`;
    const r = prepara({ memoriaOral: [f] });
    const md = fitxerDe(r, `okf/${f.okf.cami}`);
    expect(md).not.toMatch(MARCATGE);
    expect(md).toContain('title: "Relat ‹img src=x onerror=alert(1)>"');
    expect(grafDe(r, 'memoria-oral.jsonld')[0].name).toBe('Relat ‹img src=x onerror=alert(1)>');
  });

  test('sense memoriaOral a l’entrada: cap fitxer okf ni memoria-oral.jsonld, cap compte ni omissió (el paquet de la 1.1.0)', () => {
    const r = prepara(COMPLET());
    expect(r.fitxers.map((f) => f.nom).filter((n) => n.startsWith('okf/') || n === 'memoria-oral.jsonld')).toEqual([]);
    expect(r.comptes).not.toHaveProperty('memoriaOral');
    expect(r.omissions).not.toHaveProperty('memoriaOral');
    expect(fitxerDe(r, 'memoria.md')).not.toContain('Memòria oral');
    // Amb memoriaOral pendent: la secció ho diu, però cap fitxer.
    const pendent = prepara({ ...COMPLET(), pendents: [{ coleccio: 'memoriaOral', motiu: 'el servidor de dades encara no desa cap fitxa de memòria oral revisada' }] });
    expect(fitxerDe(pendent, 'memoria.md')).toContain("## Memòria oral (fitxes OKF) (0)\n\nNo s'exporta en esta versió: el servidor de dades encara no desa cap fitxa de memòria oral revisada.");
    expect(fitxerDe(pendent, 'memoria.md')).not.toContain('memoria-oral.jsonld');
    expect(pendent.pendents).toEqual(['memoriaOral']);
  });

  test('Gauntlet D-06 · la descripció del Data Package diu la veritat: amb fitxes orals, que poden nomenar persones; sense, la de sempre', async () => {
    const SEMPRE = 'Contingut públic del municipi i de les seues entitats exportat pel Mas (Sóc de Poble). '
      + "Sense dades de persones. La llicència de cada element és a llicencies.md: el conjunt no n'atorga cap de nova.";
    const ambOral = await exporta({ ...COMPLET(), memoriaOral: [fitxa()] });
    expect(ambOral.datapackage.description).toBe('Contingut públic del municipi i de les seues entitats exportat pel Mas (Sóc de Poble). '
      + 'Sense dades de cap compte de persona. Les fitxes de memòria oral són relats revisats per una persona i signats per una entitat, i poden nomenar persones del poble. '
      + "La llicència de cada element és a llicencies.md: el conjunt no n'atorga cap de nova.");
    expect(ambOral.datapackage.description).not.toContain('Sense dades de persones');
    await expect(verificaPaquetOpenData(ambOral.zip)).resolves.toMatchObject({ slug: TORRE.slug });
    // Sense memòria oral, o amb la col·lecció pendent i cap fitxa, la frase de sempre.
    expect((await exporta(COMPLET())).datapackage.description).toBe(SEMPRE);
    const pendent = await exporta({ ...COMPLET(), pendents: [{ coleccio: 'memoriaOral', motiu: 'el servidor de dades encara no desa cap fitxa de memòria oral revisada' }] });
    expect(pendent.datapackage.description).toBe(SEMPRE);
  });

  test('el verificador 1.2.0 admet okf/; una llista tancada de la 1.1.0 només rebutja okf/ i memoria-oral.jsonld no', async () => {
    const NOM_DE_DADES_1_1_0 = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jsonld|json|md|ics)$/;
    const paquet = await exporta({ ...COMPLET(), memoriaOral: [fitxa()] });
    const fora = paquet.fitxers.map((f) => f.cami).filter((c) => c.startsWith('data/') && !NOM_DE_DADES_1_1_0.test(c.slice(5)));
    expect(fora.every((c) => c.startsWith('data/okf/'))).toBe(true);
    expect(fora).toHaveLength(3);
    await expect(verificaPaquetOpenData(paquet.zip)).resolves.toMatchObject({ slug: TORRE.slug });
  });
});

describe('T2 · recullDadesPubliquesDelMunicipi amb la capacitat dadesObertes', () => {
  const portAmb = (obertes, { capacitats = ['directoriEntitats', 'dadesObertes'] } = {}) => ({
    teCapacitat: vi.fn((cap) => capacitats.includes(cap)),
    listPublicOrganizations: vi.fn(async () => ENTITATS),
    llegixDadesObertes: vi.fn(async () => obertes),
    loadMur: vi.fn(() => { throw new Error('loadMur barreja contingut de membres'); }),
    loadCoreContent: vi.fn(() => { throw new Error('no s’ha de cridar'); })
  });

  test('una sola crida anònima pel poble { slug, nom } i el senyal; mai loadMur ni loadCoreContent; null → pendent amb motiu', async () => {
    const port = portAmb({ noticies: [noticiaEntitat()], agenda: [], memoria: null, memoriaOral: null });
    const control = new AbortController();
    const config = { tenantId: '11111111-2222-3333-4444-555555555555' };
    const r = await recullDadesPubliquesDelMunicipi(port, TORRE, { config, signal: control.signal });
    expect(port.llegixDadesObertes).toHaveBeenCalledTimes(1);
    expect(port.llegixDadesObertes).toHaveBeenCalledWith({ poble: { slug: TORRE.slug, nom: TORRE.nom }, signal: control.signal }, config);
    expect(port.loadMur).not.toHaveBeenCalled();
    expect(port.loadCoreContent).not.toHaveBeenCalled();
    expect(r.noticies.map((n) => n.id)).toEqual(['ban-aigua']);
    expect(r.agenda).toEqual([]);
    expect(r).not.toHaveProperty('memoria');
    expect(r).not.toHaveProperty('memoriaOral');
    expect(Object.fromEntries(r.pendents.map(({ coleccio, motiu }) => [coleccio, motiu]))).toEqual({
      memoria: 'el Mas no té cap mòdul de memòria cultural',
      memoriaOral: 'el servidor de dades encara no desa cap fitxa de memòria oral revisada',
      configuracio: "la personalització és de tot el node, no d'un poble, i la fitxa del poble no la inclou"
    });
    for (const { motiu } of r.pendents) {
      expect(motiu, motiu).not.toMatch(/[:()]|[a-z][A-Z]|\bD-[A-Z]\d|\b(?:tenant|backend|port|capacitat|dadesObertes|directoriEntitats)\b/);
    }
    // El paquet porta la notícia i diu de les altres que són pendents.
    const paquet = prepara({ ...r, municipi: TORRE, entitats: r.entitats });
    expect(grafDe(paquet, 'noticies.jsonld').map((n) => n.identifier)).toEqual(['ban-aigua']);
    expect(paquet.pendents).toEqual(['memoria', 'memoriaOral', 'configuracio']);
    expect(paquet.comptes).toEqual({ noticies: 1, agenda: 0, directori: 2, memoria: 0, memoriaOral: 0 });
  });

  test('sense font de notícies ni d’agenda (null): pendents amb el seu motiu, en l’ordre del contracte', async () => {
    const r = await recullDadesPubliquesDelMunicipi(portAmb({ noticies: null, agenda: null, memoria: [], memoriaOral: [] }), TORRE);
    expect(r.pendents.map((p) => p.coleccio)).toEqual(['noticies', 'agenda', 'configuracio']);
    expect(r.pendents[0].motiu).toBe('este servidor de dades no en té cap font pública');
    expect([r.memoria, r.memoriaOral]).toEqual([[], []]);
  });

  test('sense el directori però amb dades obertes: el directori pendent primer', async () => {
    const r = await recullDadesPubliquesDelMunicipi(portAmb({ noticies: [], agenda: [], memoria: null, memoriaOral: null }, { capacitats: ['dadesObertes'] }), TORRE);
    expect(r.entitats).toBeNull();
    expect(r.pendents.map((p) => p.coleccio)).toEqual(['directori', 'memoria', 'memoriaOral', 'configuracio']);
  });

  test('una forma dolenta és un TypeError; per damunt del sostre, un RangeError (mai es talla)', async () => {
    for (const dolenta of [[], null, { noticies: [] }, { noticies: 'x', agenda: [], memoria: null, memoriaOral: null }, { noticies: [], agenda: [], memoria: null, memoriaOral: null, xat: [] }]) {
      await expect(recullDadesPubliquesDelMunicipi(portAmb(dolenta), TORRE), JSON.stringify(dolenta)).rejects.toThrow(/llegixDadesObertes no ha tornat/);
    }
    const plena = Array.from({ length: LIMIT_DADES_OBERTES + 1 }, (_, i) => ({ id: `n-${i}` }));
    await expect(recullDadesPubliquesDelMunicipi(portAmb({ noticies: plena, agenda: [], memoria: null, memoriaOral: null }), TORRE)).rejects.toThrow(RangeError);
  });

  test('un port de prova antic (teCapacitat sempre cert i sense el mètode) va pel camí d’abans', async () => {
    const port = { teCapacitat: () => true, listPublicOrganizations: async () => [] };
    const r = await recullDadesPubliquesDelMunicipi(port, TORRE);
    expect(r.pendents.map((p) => p.coleccio)).toEqual(['noticies', 'agenda', 'memoria', 'memoriaOral', 'configuracio']);
  });
});
