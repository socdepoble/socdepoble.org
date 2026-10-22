/**
 * Pla 261022_1955 (Cercador Universal Desacoblat i Resilient, T2) · Proves
 * pures del directori d'entitats a l'índex (deOrganitzacio), del plegat
 * valencià ampliat i del rànquing per graons, IDF i poble actiu.
 */
import { expect, test } from 'vitest';
import {
  ambLaIdentitatPropia, cercaEntrades, deAgent, deIdentitat, deMembre, deOrganitzacio, dePublicacio, extracteAmbContext, fitxes,
  partsRessaltades, plega
} from './indexCerca.js';

const TORRE = 'edd2f840-f4af-414a-821c-ebb8b8b2a80a';
const LLAVORS = '11111111-2222-3333-4444-555555555555';
const ID_FIGUERA = 'a6d028a2-8abc-469d-bf86-ae21aea6bffc';
const LOGO = `sdp-media://mitjans/${TORRE}/7d3c2f4e-0000-4000-8000-000000000001/avatars/logo.webp`;
const FIGUERA = Object.freeze({
  id: ID_FIGUERA, tenant_id: TORRE, slug: 'lafiguera', name: 'La Figuera', kind: 'company', parent_organization_id: null,
  lema: '', description: 'Natural art 🌸 Made in La Terreta', logo_url: LOGO, hero_url: LOGO, presentacio_html: '',
  copyright: '', town_name: 'La Torre de les Maçanes', created_at: '2026-10-22T17:29:24Z', updated_at: '2026-10-22T17:34:44Z'
});
const membre = (usuari_id, nom, extra = {}) => ({ usuari_id, nom, tipus: 'persona', avatar_url: null, fil_id: null, ...extra });
const persona = (id, name, extra = {}) => deAgent({ id, name, type: 'PERSON', ...extra });
const titols = (resultat) => resultat.llista.map((e) => e.titol);

/* ── deOrganitzacio ── */

test('Pla 261022_1955 · una fila del directori és una entitat amb poble, extracte, logo per resoldre i enllaç', () => {
  const e = deOrganitzacio(FIGUERA, { tenantActiu: TORRE });
  expect(e).toMatchObject({
    clau: `entitats:${ID_FIGUERA}`, tipus: 'entitats', id: ID_FIGUERA, titol: 'La Figuera',
    meta: ['La Torre de les Maçanes'], extracte: 'Natural art 🌸 Made in La Terreta', href: '/empresa/lafiguera', canonica: null
  });
  /* El logo opac del bucket públic no és cap src: és la `ref` que el port resoldrà. */
  expect(e.avatar).toEqual({ nom: 'La Figuera', src: null, llavor: ID_FIGUERA, ref: LOGO });
});

test('Pla 261022_1955 · el slug només és la ruta quan el tenant de la fila és l’actiu; si no, l’id', () => {
  expect(deOrganitzacio(FIGUERA, { tenantActiu: LLAVORS }).href).toBe(`/empresa/${ID_FIGUERA}`);
  expect(deOrganitzacio(FIGUERA, { tenantActiu: TORRE.toUpperCase() }).href).toBe('/empresa/lafiguera');
  expect(deOrganitzacio(FIGUERA).href).toBe(`/empresa/${ID_FIGUERA}`);
  /* Seed i local: un sol poble, la fila no porta tenant. */
  expect(deOrganitzacio({ ...FIGUERA, tenant_id: null }).href).toBe('/empresa/lafiguera');
  /* Un slug que no compliria el CHECK de la taula no es fa servir mai de ruta. */
  expect(deOrganitzacio({ ...FIGUERA, slug: '../xat' }, { tenantActiu: TORRE }).href).toBe(`/empresa/${ID_FIGUERA}`);
  expect(deOrganitzacio({ ...FIGUERA, slug: 'La Figuera' }, { tenantActiu: TORRE }).href).toBe(`/empresa/${ID_FIGUERA}`);
});

test('Pla 261022_1955 · sense id, o amb un nom que és un correu, no hi ha entrada', () => {
  expect(deOrganitzacio({ ...FIGUERA, id: null })).toBeNull();
  expect(deOrganitzacio({ ...FIGUERA, id: '  ' })).toBeNull();
  expect(deOrganitzacio({ ...FIGUERA, name: 'figuera@exemple.cat' })).toBeNull();
  expect(deOrganitzacio(null)).toBeNull();
});

test('Pla 261022_1955 · un logo del bucket privat o un camí brut no porta ref; una URL segura és la foto', () => {
  expect(deOrganitzacio({ ...FIGUERA, logo_url: 'sdp-media://mitjans_privats/u/logo.webp' }).avatar).not.toHaveProperty('ref');
  expect(deOrganitzacio({ ...FIGUERA, logo_url: 'sdp-media://mitjans/../mitjans_privats/u/logo.webp' }).avatar).not.toHaveProperty('ref');
  expect(deOrganitzacio({ ...FIGUERA, logo_url: 'https://cdn.exemple.cat/logo.webp' }).avatar)
    .toEqual({ nom: 'La Figuera', src: 'https://cdn.exemple.cat/logo.webp', llavor: ID_FIGUERA });
});

test('Pla 261022_1955 · l’entitat pilot de la llavor porta la seua ruta canònica, per l’id', () => {
  const e = deOrganitzacio({ id: 'socdepoble', slug: 'socdepoble', name: 'Sóc de Poble', tenant_id: null, town_name: null });
  expect([e.canonica, e.href]).toEqual(['socdepoble', '/socdepoble']);
  /* Un slug 'socdepoble' d'una altra fila (un altre poble) no la suplanta: la clau és l'id. */
  const homonima = deOrganitzacio({ id: '00000000-0000-4000-8000-0000000000aa', slug: 'socdepoble', name: 'Sóc de Poble',
    tenant_id: LLAVORS }, { tenantActiu: LLAVORS });
  expect([homonima.canonica, homonima.href]).toEqual([null, '/empresa/socdepoble']);
});

test('Pla 261022_1955 · «figuera» troba La Figuera a Tot i a Entitats, amb accents o sense, i pel cos', () => {
  const index = [deOrganitzacio(FIGUERA, { tenantActiu: TORRE }), persona('p', 'Pepa Soler')];
  const tot = cercaEntrades(index, 'figuera');
  expect(titols(tot)).toEqual(['La Figuera']);
  expect(tot.perTipus).toMatchObject({ tot: 1, entitats: 1, persones: 0 });
  expect(cercaEntrades(index, 'figuera', 'entitats').total).toBe(1);
  expect(cercaEntrades(index, 'FIGUÉRA').total).toBe(1);
  expect(titols(cercaEntrades(index, 'natural terreta'))).toEqual(['La Figuera']);
  expect(cercaEntrades(index, 'maçanes figuera').total).toBe(1);
});

test('Pla 261022_1955 · la identitat pròpia, el padró i el directori són una sola fitxa (la pròpia mana, amb la ruta neta)', () => {
  const opcions = { tenantActiu: TORRE };
  const index = ambLaIdentitatPropia([
    deIdentitat({ tipus: 'entitat', id: ID_FIGUERA, nom: 'La Figuera', slug: 'lafiguera', avatar: null }),
    deMembre(membre(ID_FIGUERA, 'La Figuera', { tipus: 'entitat', fil_id: 'fil-9' })),
    deOrganitzacio(FIGUERA, opcions)
  ], []);
  const { llista, perTipus } = cercaEntrades(index, 'figuera');
  expect(perTipus.entitats).toBe(1);
  expect(llista).toHaveLength(1);
  const [fitxa] = llista;
  expect(fitxa.propia).toBe('entitat');
  /* La ruta de reserva (/empresa/<id>) cedix a la neta del directori. */
  expect(fitxa.href).toBe('/empresa/lafiguera');
  /* L'«Escriu-li» del padró es conserva i el logo del directori hi arriba. */
  expect(fitxa.accio).toEqual({ tipus: 'escriu', href: '/xat/fil-9' });
  expect(fitxa.avatar.ref).toBe(LOGO);
  expect(fitxa.meta).toContain('La Torre de les Maçanes');
});

test('Pla 261022_1955 · d’un altre tenant, la fitxa fusionada continua per id (una ruta que s’obri)', () => {
  const index = [
    deMembre(membre(ID_FIGUERA, 'La Figuera', { tipus: 'entitat' })),
    deOrganitzacio(FIGUERA, { tenantActiu: LLAVORS })
  ];
  expect(cercaEntrades(index, 'figuera').llista.map((e) => e.href)).toEqual([`/empresa/${ID_FIGUERA}`]);
});

/* ── Plegat valencià ── */

test('Pla 261022_1955 · la ela geminada en totes les formes, i les lligadures, es pleguen igual', () => {
  expect(plega('Col·legi')).toBe('collegi');
  expect(plega('Coŀlegi')).toBe('collegi');
  expect(plega('COĿLEGI')).toBe('collegi');
  expect(plega('col.legi')).toBe('collegi');
  expect(fitxes('Il.lusió')).toEqual(['illusio']);
  /* El punt només s'esborra entre dues eles. */
  expect(plega('Sr.Lluís')).toBe('sr.lluis');
  expect(plega('Œuvre ﬁra Ｆｉｇｕｅｒａ ß')).toBe('oeuvre fira figuera ss');
  expect(plega('Àá Èé Íï Òó Úü Ç Ñ')).toBe('aa ee ii oo uu c n');
});

test('Pla 261022_1955 · el ressaltat marca la paraula original en totes les formes de la geminada', () => {
  const marcats = (text, llista) => partsRessaltades(text, llista).filter((p) => p.marca).map((p) => p.text);
  expect(marcats('El Coŀlegi de la Torre', ['collegi'])).toEqual(['Coŀlegi']);
  expect(marcats('Al col.legi i al col·legi', ['collegi'])).toEqual(['col.legi', 'col·legi']);
  expect(marcats('La Ｆｉｇｕｅｒａ', ['figuera'])).toEqual(['Ｆｉｇｕｅｒａ']);
  expect(marcats('Pepa Güell', ['guell'])).toEqual(['Güell']);
});

/* ── Rànquing ── */

test('Pla 261022_1955 · graons: frase igual > paraula del títol > prefix > dins del títol > lema o ofici > cos', () => {
  const index = [
    persona('cos', 'Pere Mas', { short_bio: 'Fa pa al forn de la plaça' }),
    persona('etiqueta', 'Pep Soler', { role: 'Forner de nit' }),
    persona('dins', 'Cal Desforn'),
    persona('prefix', 'Fornera Mari'),
    persona('paraula', 'Forn de Dalt'),
    persona('igual', 'Forn')
  ];
  expect(cercaEntrades(index, 'forn').llista.map((e) => e.id)).toEqual(['igual', 'paraula', 'prefix', 'dins', 'etiqueta', 'cos']);
});

test('Pla 261022_1955 · el poble actiu desempata dins del graó, però mai el capgira', () => {
  const index = [
    persona('alcoi', 'Carmen Ferrer', { town_name: 'Alcoi' }),
    persona('torre', 'Carmen Vidal', { town_name: 'La Torre de les Maçanes' }),
    persona('prefix-torre', 'Carmencita Pla', { town_name: 'La Torre de les Maçanes' })
  ];
  expect(cercaEntrades(index, 'carmen').llista.map((e) => e.id)).toEqual(['alcoi', 'torre', 'prefix-torre']);
  expect(cercaEntrades(index, 'carmen', 'tot', { pobleActiu: 'la torre de les macanes' }).llista.map((e) => e.id))
    .toEqual(['torre', 'alcoi', 'prefix-torre']);
});

test('Pla 261022_1955 · la paraula més rara de l’índex pesa més (IDF): «carmen torre» posa Carmen davant', () => {
  const soroll = Array.from({ length: 6 }, (_, i) => persona(`s${i}`, `Veí ${i}`, { town_name: 'La Torre de les Maçanes' }));
  const index = [
    ...soroll,
    persona('torre', 'Bastida de la Torre', { short_bio: 'La casa on va nàixer Carmen' }),
    persona('carmen', 'Carmen Chaves', { town_name: 'La Torre de les Maçanes' })
  ];
  /* Sense IDF empatarien (6 + 0,5) i l'alfabet posaria la Bastida primer. */
  expect(cercaEntrades(index, 'carmen torre').llista.map((e) => e.id)).toEqual(['carmen', 'torre']);
});

test('Pla 261022_1955 · una persona del padró porta el poble de la sessió per a la bonificació, sense pintar-lo', () => {
  const opcions = { pobleDelPadro: 'La Torre de les Maçanes' };
  const index = [deMembre(membre('d2', 'Damián Llorens')), deMembre(membre('d1', 'Damián Llorens'), opcions)];
  const resultat = cercaEntrades(index, 'damian', 'tot', { pobleActiu: 'La Torre de les Maçanes' });
  expect(resultat.llista.map((e) => e.id)).toEqual(['d1', 'd2']);
  expect(resultat.llista[0].meta).toEqual([]);
});

/* ── Gauntlet: les troballes confirmades ── */

test('Gauntlet · amb dues paraules i IDF baixa, el poble actiu tampoc no capgira un graó', () => {
  const veins = Array.from({ length: 8 }, (_, i) => persona(`v${i}`, `Veí ${i}`, { town_name: 'La Torre de les Maçanes' }));
  const index = [
    ...veins,
    /* «torre» al rol (lema/ofici) */
    persona('rol', 'Carmen Ferrer', { role: 'Guia de Vilatorre', town_name: 'Alcoi' }),
    /* «torre» només al cos, però del poble actiu */
    persona('cos', 'Carmen Vidal', { role: 'Mestra', town_name: 'La Torre de les Maçanes' })
  ];
  const opcions = { pobleActiu: 'La Torre de les Maçanes' };
  expect(cercaEntrades(index, 'carmen torre', 'tot', opcions).llista.map((e) => e.id)).toEqual(['rol', 'cos']);
  expect(cercaEntrades(index, 'carmen torre').llista.map((e) => e.id)).toEqual(['rol', 'cos']);
});

test('Gauntlet · una frase amb paraules repetides també és un títol exacte («Bora Bora», «Pas a pas»)', () => {
  const bora = [persona('bora', 'Bora'), persona('borabora', 'Bora Bora')];
  expect(cercaEntrades(bora, 'Bora Bora').llista.map((e) => e.id)).toEqual(['borabora', 'bora']);
  const pas = [
    dePublicacio({ id: 'llarg', title: 'Pas a pas, la caminada', created_at: '2026-10-01' }),
    dePublicacio({ id: 'exacte', title: 'Pas a pas', created_at: '2026-01-01' })
  ];
  expect(cercaEntrades(pas, 'pas a pas').llista.map((e) => e.id)).toEqual(['exacte', 'llarg']);
});

test('Gauntlet · les lletres decoratives del pla astral es troben i es ressalten senceres', () => {
  /* «𝐅𝐢𝐠𝐮𝐞𝐫𝐚» en negreta matemàtica (U+1D400…), construït per punt de codi. */
  const negreta = (paraula) => [...paraula].map((lletra) => String.fromCodePoint(
    /[A-Z]/.test(lletra) ? 0x1d400 + lletra.charCodeAt(0) - 65 : 0x1d41a + lletra.charCodeAt(0) - 97)).join('');
  const nom = `${negreta('La')} ${negreta('Figuera')}`;
  const e = deOrganitzacio({ ...FIGUERA, name: nom }, { tenantActiu: TORRE });
  expect(cercaEntrades([e], 'figuera').total).toBe(1);
  const marcats = partsRessaltades(nom, ['figuera']).filter((p) => p.marca).map((p) => p.text);
  expect(marcats).toEqual([negreta('Figuera')]);
  /* Un extracte llarg comença prop de la coincidència, sense partir cap lletra. */
  const llarg = `${'Lorem ipsum dolor sit amet. '.repeat(12)}${nom}. ${'Consectetur adipiscing elit. '.repeat(6)}`;
  const extracte = extracteAmbContext(llarg, ['figuera'], 120);
  expect(extracte).toContain(negreta('Figuera'));
  expect(extracte.isWellFormed ? extracte.isWellFormed() : true).toBe(true);
});
