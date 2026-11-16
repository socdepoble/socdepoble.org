/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Les adreces de les fitxes públiques (perfils-socials.mjs):
   la canònica única de cada fitxa i els seus àlies en cada família del Router, per slug i per id, i els
   mutants de segrest de targeta: cap dada d'un veí pot quedar-se el camí d'una altra fitxa, i cap fa llançar. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esElementDePerfil, rutesDePerfils} from './perfils-socials.mjs';
import * as metadades from '../../src/config/metadadesDePerfil.js';
import * as paquet from '../../src/sections/profile/perfilsDelPaquet.js';
import {IAIA_ID} from '../../src/data/identitatsSeed.js';

const FAMILIES = Object.freeze(['perfil', 'gent', 'empresa', 'entitats', 'ajuntament', 'grup']);
const OPCIONS = Object.freeze({origen: 'https://socdepoble.org', permesos: []});
const OLI = '3073b933-69fc-4c3e-80dc-b0df9c6b8391', PILOT = 'a240e870-4aef-4d92-b138-e8b4e2f2123a', RENTONAR = 'b2c87505-53b1-4108-902f-2313e77b9968';
const A = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6', B = '6b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
const fitxa = (id, slug, title, tipus = 'entitat') => ({sectionId: 'perfil', id, slug, tipus, visibility: 'public', status: 'published', title, description: `Lema de ${title}`, image: null, imageAlt: ''});
const pla = (elements = [], extra = {}) => rutesDePerfils({elements, families: FAMILIES, moduls: {metadades, paquet}, opcions: OPCIONS, ...extra});
const canonica = (resultat, ruta) => resultat.canoniques.find(c => c.ruta === ruta);
const destiDe = (resultat, cami) => (canonica(resultat, cami) ? cami : Object.fromEntries(resultat.alies)[cami]);

test('una entitat amb slug i id: la canònica /empresa/<slug> i onze àlies; un grup, /grup/<slug>', () => {
  const r = pla([fitxa(OLI, 'olidelatorre', 'Oli de La Torre'), fitxa(A, 'colla', 'La Colla', 'grup')]);
  assert.deepEqual([canonica(r, '/empresa/olidelatorre').title, canonica(r, '/empresa/olidelatorre').schema, canonica(r, '/empresa/olidelatorre').origen, canonica(r, '/empresa/olidelatorre').index],
    ['Oli de La Torre', 'Organization', 'veinal', true]);
  for (const [slug, id, ruta] of [['olidelatorre', OLI, '/empresa/olidelatorre'], ['colla', A, '/grup/colla']]) {
    const camins = FAMILIES.flatMap(f => [`/${f}/${slug}`, `/${f}/${id}`]);
    assert.equal(camins.filter(cami => destiDe(r, cami) === ruta).length, 12, slug);
    assert.equal(r.alies.filter(([, desti]) => desti === ruta).length, 11, slug);
  }
  assert.deepEqual([r.conflictes, r.avisos], [[], []]);
});

test('les identitats del paquet sense remot: les quatre adreces netes amb la dada de la llavor, i cada clau declarada com a àlies', () => {
  const r = pla();
  assert.deepEqual(r.canoniques.map(c => [c.ruta, c.title, c.origen, c.schema]), [['/iaia', 'IAIA MarIA', 'paquet', 'SoftwareApplication'],
    ['/javillinares', 'Javi Llinares', 'paquet', 'Person'], ['/rentonar', 'Rentonar', 'paquet', 'Organization'], ['/socdepoble', 'Sóc de Poble', 'paquet', 'Organization']]);
  for (const [clau, ruta] of [['0001', '/javillinares'], ['javi', '/javillinares'], ['javi-llinares', '/javillinares'], ['javillinares', '/javillinares'],
    ['socdepoble', '/socdepoble'], ['soc-de-poble_official', '/socdepoble'], [PILOT, '/socdepoble'], ['rentonar', '/rentonar'], [RENTONAR, '/rentonar'],
    ['iaia-maria', '/iaia'], [IAIA_ID, '/iaia']]) for (const familia of FAMILIES) assert.equal(destiDe(r, `/${familia}/${clau}`), ruta, `/${familia}/${clau}`);
  // Oli de La Torre no té fitxa del paquet: sense remot, cap camí.
  for (const cami of ['/empresa/olidelatorre', `/empresa/${OLI}`]) assert.equal(destiDe(r, cami), undefined);
  // Les claus només reservades no són cap adreça.
  for (const cami of ['/empresa/soc-de-poble', '/perfil/iaia', '/gent/iaia']) assert.equal(destiDe(r, cami), undefined, cami);
});

test('amb la fila remota de l’id declarat, l’adreça neta porta la dada del servidor (com a l’app); la llavor, només de reserva', () => {
  const imatge = 'https://socdepoble.org/assets/portada-remota.webp';
  const r = pla([{...fitxa(PILOT, 'socdepoble', 'Sóc de Poble del servidor'), image: imatge, imageAlt: 'Portada remota acreditada'}, fitxa(RENTONAR, 'rentonar', 'El Rentonar')]);
  assert.deepEqual([canonica(r, '/socdepoble').title, canonica(r, '/socdepoble').origen], ['Sóc de Poble del servidor', 'veinal']);
  assert.deepEqual([canonica(r, '/socdepoble').description, canonica(r, '/socdepoble').image, canonica(r, '/socdepoble').imageAlt], ['Lema de Sóc de Poble del servidor', imatge, 'Portada remota acreditada']);
  assert.deepEqual([canonica(r, '/rentonar').title, canonica(r, '/rentonar').origen], ['El Rentonar', 'veinal']);
  assert.equal(destiDe(r, `/empresa/${PILOT}`), '/socdepoble');
  assert.equal(destiDe(r, '/empresa/soc-de-poble_official'), '/socdepoble');
  assert.equal(r.canoniques.filter(c => /socdepoble|rentonar/.test(c.ruta)).length, 2, 'una sola canònica per identitat');
  assert.deepEqual(r.conflictes, []);
});

test('mutants de segrest: un slug amb la forma de l’id d’una altra fitxa no es queda cap camí seu', () => {
  const r = pla([fitxa(OLI, 'olidelatorre', 'Oli de La Torre'), fitxa(B, OLI, 'SEGREST')]);
  for (const familia of FAMILIES) assert.equal(destiDe(r, `/${familia}/${OLI}`), '/empresa/olidelatorre', familia);
  assert.equal(canonica(r, `/empresa/${B}`).title, 'SEGREST');
  assert.equal(r.alies.filter(([, desti]) => desti === `/empresa/${B}`).length, 5, 'només pel seu id, en les altres famílies');
  assert.ok(r.conflictes.some(c => c.de === B && /slug reservat o amb forma d’UUID/.test(c.motiu)));
});

test('mutants de segrest: l’id o el slug de la IAIA, «iaia», «soc-de-poble» i les claus de la persona pilot, reservats', () => {
  for (const slug of [IAIA_ID, 'iaia-maria', 'iaia', 'soc-de-poble', 'javi', 'javillinares', 'javi-llinares', '0001', 'socdepoble', 'rentonar', 'olidelatorre']) {
    const r = pla([fitxa(B, slug, 'SEGREST')]);
    const seus = [...r.canoniques.filter(c => c.id === B).map(c => c.ruta), ...r.alies.filter(([, desti]) => desti === `/empresa/${B}`).map(([cami]) => cami)];
    assert.deepEqual(seus.sort(), FAMILIES.map(f => `/${f}/${B}`).sort(), `${slug}: només pel seu id`);
    assert.equal(canonica(r, '/iaia').title, 'IAIA MarIA', slug);
    assert.equal(canonica(r, '/javillinares').title, 'Javi Llinares', slug);
    assert.equal(canonica(r, '/socdepoble').title, 'Sóc de Poble', slug);
    for (const cami of ['/perfil/iaia-maria', `/perfil/${IAIA_ID}`, '/gent/javi', '/empresa/socdepoble', '/grup/rentonar']) assert.notEqual(destiDe(r, cami), `/empresa/${B}`, `${slug} → ${cami}`);
    assert.ok(!JSON.stringify(r.canoniques.filter(c => c.id !== B)).includes('SEGREST'), slug);
    assert.ok(r.conflictes.some(c => c.de === B), slug);
  }
});

test('ambReservaDelPaquet: una clau d’IA o de la persona pilot amb una organització al servidor continua sent del paquet', () => {
  const org = clau => ({tipus: 'entitat', id: B, slug: clau, nom: 'SEGREST', publicat: true});
  assert.equal(paquet.ambReservaDelPaquet('iaia-maria', org('iaia-maria')).nom, 'IAIA MarIA');
  assert.equal(paquet.ambReservaDelPaquet(IAIA_ID, {...org(IAIA_ID), tipus: 'grup'}).nom, 'IAIA MarIA');
  assert.equal(paquet.ambReservaDelPaquet('javi', org('javi')).nom, 'Javi Llinares');
  // Una fitxa remota que sí que és una IA (una sessió la pot rebre) mana; i per a una clau qualsevol, el servidor.
  assert.equal(paquet.ambReservaDelPaquet(IAIA_ID, {tipus: 'ia', id: IAIA_ID, nom: 'IAIA del servidor'}).nom, 'IAIA del servidor');
  assert.equal(paquet.ambReservaDelPaquet('forn', org('forn')).nom, 'SEGREST');
  assert.equal(paquet.ambReservaDelPaquet('forn', null), null);
  assert.equal(paquet.ambReservaDelPaquet('socdepoble', org('socdepoble')).nom, 'SEGREST', 'per a una entitat fundacional, el servidor mana (la canònica la decidix l’id)');
});

test('dos slugs iguals, una clau no escrivible i un element mal format: es perd el camí, mai es llança; l’ordre d’entrada no canvia res', () => {
  const elements = [fitxa(B, 'forn', 'Forn B'), fitxa(A, 'forn', 'Forn A'), fitxa(OLI, 'olidelatorre', 'Oli de La Torre')];
  const r = pla(elements), girat = pla([...elements].reverse());
  assert.deepEqual(r, girat);
  // Es queda el slug la primera per id (A); B només ix pel seu id.
  assert.equal(canonica(r, '/empresa/forn').id, A);
  assert.ok(r.conflictes.some(c => c.de === B));
  const dolents = [{...fitxa(A, 'x', 'Persona'), tipus: 'persona'}, {...fitxa('NO-UUID', 'x', 'X')}, {...fitxa(A, 'amb.punt', 'X')}, {...fitxa(A, 'x', '')}, null, 'text'];
  const net = pla(dolents);
  assert.equal(net.canoniques.filter(c => c.origen === 'veinal').length, 0, 'cap persona ni cap element mal format entra des d’una dada remota');
  assert.match(net.avisos.join(' '), /forma inesperada/);
  for (const dolent of dolents) assert.equal(esElementDePerfil(dolent, metadades.FORMA_UUID), false);
  // Sense famílies (un arbre sense Router), cap ruta.
  assert.deepEqual(rutesDePerfils({elements, families: [], moduls: {metadades, paquet}, opcions: OPCIONS}), {canoniques: [], alies: [], conflictes: [], avisos: []});
});

test('la indexació de la canònica: la conjunció amb la política del lloc; una canònica sota /perfil ix sense indexar', () => {
  assert.equal(canonica(pla([], {indexable: () => false}), '/iaia').index, false);
  assert.equal(metadades.indexDePerfil({publicat: true}, '/perfil/gall'), false);
  assert.equal(metadades.indexDePerfil({publicat: true}, '/empresa/forn'), true);
  assert.equal(metadades.indexDePerfil({publicat: false}, '/empresa/forn'), false);
});
