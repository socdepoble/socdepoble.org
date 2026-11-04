// @vitest-environment node
/* T2 · D04/D10 (assalt 261101) · L'anada i tornada del paquet Open Data sobre
   l'adaptador local de veres (src/data/local/, carril T1), en dues instàncies
   aïllades: un paquet fet de fonts → importa a A → exporta de A → importa a B
   → exporta de B. Els tres paquets tenen el MATEIX SHA-256. I el que s'ha
   restaurat ho veuen el directori, els pobles i el Mur del node. Cap xarxa. */
import { webcrypto } from 'node:crypto';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { validaBackendImplementation } from './backendPort.js';
import { CAPACITATS, LIMIT_DADES_OBERTES } from './contracte.js';
import { exportaMunicipiOpenData, recullDadesPubliquesDelMunicipi, verificaPaquetOpenData } from './exportaMunicipiOpenData.js';
import { importaMunicipiOpenData } from './importaMunicipiOpenData.js';
import { creaAdaptadorLocal } from './local/adaptadorLocal.js';
import { estructuraMemoriaOral, marcaRevisioHumana } from '../sections/notes/memoriaOral.js';

const subtle = webcrypto.subtle;
const TORRE = Object.freeze({ slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });
const ARA = '2026-11-01T10:00:00Z';
const ORIGEN = 'https://socdepoble.org';
const RENTONAR = '7d1f0000-0000-4000-8000-0000000000a1';
const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA'); });
beforeAll(() => { vi.stubGlobal('fetch', xarxa); });
afterAll(() => { vi.unstubAllGlobals(); });

/* El port d'un adaptador: els seus mètodes i teCapacitat (com backendPort.js). */
const portDe = (adaptador) => ({
  ...adaptador,
  teCapacitat: (capacitat) => Object.hasOwn(CAPACITATS, capacitat) && CAPACITATS[capacitat].every((metode) => typeof adaptador[metode] === 'function')
});
/* Sense el padró d'entitats de la llavor: el node només té el que s'hi restaura. La restauració, oberta a posta (T2-G04). */
const nodeBuit = () => creaAdaptadorLocal({ mode: 'local', dades: { entitats: [] }, restauracioOberta: true });

const fitxaOral = () => {
  const relat = "A la Torre de les Maçanes, quan arribava la collita de les olives, tot el poble anava a l'almàssera i les xiquetes portaven el berenar als bancals de dalt.";
  const revisada = marcaRevisioHumana(estructuraMemoriaOral(relat, { ara: '2026-10-30T09:00:00Z', autor: 'sense-identificador' }),
    { persona: 'sense-identificador', ara: '2026-10-31T09:00:00Z' });
  return { id: 'relat-olives', okf: { cami: revisada.okf.cami, frontmatter: structuredClone(revisada.okf.frontmatter), cos: revisada.okf.cos },
    author_org_id: RENTONAR, copyright: 'CC BY 4.0', visibility: 'public' };
};
const FONTS = {
  teCapacitat: (capacitat) => ['directoriEntitats', 'dadesObertes'].includes(capacitat),
  /* La fila d'organization_directory (contracte.js), com la que torna el node local: les columnes que el paquet no exporta
     (tenant_id, dates i presentacio_html) compten igual a les omissions dels dos costats. */
  listPublicOrganizations: async () => [{ id: RENTONAR, tenant_id: null, slug: 'rentonar', name: 'Rentonar', kind: 'entity', parent_organization_id: null,
    lema: null, description: null, created_at: null, updated_at: null, logo_url: null, hero_url: null, presentacio_html: null, copyright: null, town_name: TORRE.nom }],
  llegixDadesObertes: async () => ({
    noticies: [{ id: 'ban', title: 'Ban de prova', body: '<p>Text del ban.</p>', created_at: '2026-10-20T08:00:00Z', author_org_id: RENTONAR, poble_id: TORRE.slug, copyright: 'CC BY 4.0' }],
    agenda: [{ id: 'fira', title: 'Fira de prova', inici: { data: '2026-10-29' }, fi: { data: '2026-10-31' }, author_org_id: RENTONAR, poble_id: TORRE.slug }],
    memoria: [{ id: 'llegenda', title: 'Llegenda de prova', text: 'Diuen que…', author_org_id: RENTONAR, poble_id: TORRE.slug }],
    memoriaOral: [fitxaOral()]
  })
};

async function exportaDes(port) {
  const { entitats, ...resta } = await recullDadesPubliquesDelMunicipi(port, TORRE);
  return exportaMunicipiOpenData({ municipi: TORRE, ara: ARA, origen: ORIGEN, actorsPublicats: [], ...resta, entitats: entitats ?? undefined }, { subtle });
}

test('l’adaptador local valida al port i declara les dues capacitats de dades obertes', () => {
  const a = nodeBuit();
  expect(() => validaBackendImplementation(a)).not.toThrow();
  const port = portDe(a);
  expect([port.teCapacitat('dadesObertes'), port.teCapacitat('restauracioDadesObertes')]).toEqual([true, true]);
});

test('fonts → A → B: el MATEIX SHA-256 als tres paquets, i dues instàncies aïllades', async () => {
  const P0 = await exportaDes(FONTS);
  await expect(verificaPaquetOpenData(P0.zip, { subtle })).resolves.toMatchObject({ slug: TORRE.slug });
  expect(P0.comptes).toEqual({ noticies: 1, agenda: 1, directori: 1, memoria: 1, memoriaOral: 1 });
  const A = nodeBuit();
  const B = nodeBuit();
  // Abans de restaurar, B no té res d'A.
  expect(await B.llegixDadesObertes({ poble: TORRE })).toEqual({ noticies: [], agenda: [], memoria: [], memoriaOral: [] });
  const informeA = await importaMunicipiOpenData(P0.zip, portDe(A), { subtle });
  expect(informeA.restauracio.creats).toEqual({ entitats: 1, noticies: 1, agenda: 1, memoria: 1, memoriaOral: 1 });
  expect((await B.listPublicOrganizations({ poble: TORRE.nom })).map((e) => e.id)).toEqual([]);
  const P1 = await exportaDes(portDe(A));
  expect(P1.sha256).toBe(P0.sha256);
  await importaMunicipiOpenData(P1.zip, portDe(B), { subtle });
  const P2 = await exportaDes(portDe(B));
  expect(P2.sha256).toBe(P1.sha256);
  // Idempotent sobre el node de veres.
  expect((await importaMunicipiOpenData(P2.zip, portDe(B), { subtle })).restauracio.iguals).toEqual({ entitats: 1, noticies: 1, agenda: 1, memoria: 1, memoriaOral: 1 });
  await A.destroy();
  await B.destroy();
  expect(xarxa).not.toHaveBeenCalled();
});

test('el que s’ha restaurat ho veuen el directori, els pobles i el Mur del node; destroy ho buida', async () => {
  const P0 = await exportaDes(FONTS);
  const B = nodeBuit();
  await importaMunicipiOpenData(P0.zip, portDe(B), { subtle });
  const directori = await B.listPublicOrganizations({ poble: TORRE.nom });
  expect(directori).toEqual([expect.objectContaining({ id: RENTONAR, name: 'Rentonar', kind: 'entity', town_name: TORRE.nom, tenant_id: null })]);
  expect(directori[0]).not.toHaveProperty('visibility');
  expect((await B.listPublicOrganizations({ consulta: 'rentonar' })).map((e) => e.id)).toEqual([RENTONAR]);
  expect(await B.listPublicOrganizations({ consulta: 'cap-entitat' })).toEqual([]);
  expect((await B.loadCoreContent()).towns).toEqual([{ id: TORRE.slug, slug: TORRE.slug, name: TORRE.nom, title: TORRE.nom }]);
  const mur = await B.loadMur();
  expect(mur.feedPosts.map((n) => n.id)).toEqual(['ban']);
  expect(mur.events.map((a) => a.id)).toEqual(['fira']);
  await B.destroy();
});

test('un conflicte no escriu res: un id que ja és d’un altre poble', async () => {
  const P0 = await exportaDes(FONTS);
  const B = nodeBuit();
  await B.restauraDadesObertes({
    format: 'socdepoble.dadesobertes.v1', versio: '1.2.0', municipi: { slug: 'sella', nom: 'Sella' },
    entitats: [], noticies: [{ id: 'ban', title: 'De Sella', author_org_id: 'org-sella', poble_id: 'sella', visibility: 'public' }],
    agenda: [], memoria: [], memoriaOral: []
  });
  await expect(importaMunicipiOpenData(P0.zip, portDe(B), { subtle })).rejects.toMatchObject({ code: 'conflicte-identificador' });
  expect(await B.llegixDadesObertes({ poble: TORRE })).toEqual({ noticies: [], agenda: [], memoria: [], memoriaOral: [] });
  expect(await B.listPublicOrganizations({ poble: TORRE.nom })).toEqual([]);
  await B.destroy();
});

/* Gauntlet D-01/D-02/D-04 (assalt 261101) · El lot no es pot apropiar del que el node ja té fora del magatzem. */
const LOT = (municipi, colleccions = {}) => ({ format: 'socdepoble.dadesobertes.v1', versio: '1.2.0', municipi,
  entitats: [], noticies: [], agenda: [], memoria: [], memoriaOral: [], ...colleccions });
const BENILLUP = Object.freeze({ slug: 'benillup', nom: 'Benillup' });
const SELLA = Object.freeze({ slug: 'sella', nom: 'Sella' });
const conflicteDe = async (promesa) => promesa.then(() => null, (error) => error);

test('D-01 (sonda2) · seed: un lot de Benillup no es queda l’entitat del padró ni l’acte de la llavor; el de La Torre sí que porta la seua', async () => {
  const A = creaAdaptadorLocal({ mode: 'seed', restauracioOberta: true });
  const directori = await A.listPublicOrganizations({});
  const actes = (await A.loadMur()).events;
  expect(actes.map((a) => a.id)).toEqual(['aplec-2023']);
  const segrest = { id: 'rentonar', slug: 'rentonar', name: 'SEGREST', kind: 'entity', town_name: BENILLUP.nom, visibility: 'public' };
  const acte = { id: 'aplec-2023', title: 'ACTE SEGRESTAT', author_org_id: 'rentonar', poble_id: BENILLUP.slug, visibility: 'public' };
  for (const colleccions of [{ entitats: [segrest], agenda: [acte] }, { entitats: [segrest] }, { agenda: [{ ...acte, author_org_id: 'org-benillup' }] }]) {
    const error = await conflicteDe(A.restauraDadesObertes(LOT(BENILLUP, colleccions)));
    expect(error, JSON.stringify(Object.keys(colleccions))).toMatchObject({ code: 'conflicte-identificador' });
  }
  expect(await A.listPublicOrganizations({})).toEqual(directori);
  expect((await A.loadMur()).events).toEqual(actes);
  expect((await A.loadCoreContent()).towns.map((t) => t.id)).not.toContain(BENILLUP.slug);
  // El lot legítim de La Torre porta la seua entitat del padró (el mateix id i el mateix slug).
  const informe = await A.restauraDadesObertes(LOT(TORRE, { entitats: [{ id: 'rentonar', slug: 'rentonar', name: 'Rentonar', kind: 'entity', town_name: TORRE.nom, visibility: 'public' }] }));
  expect(informe.creats.entitats).toBe(1);
  // Però no pot donar el slug d'una entitat del padró a una altra.
  const error = await conflicteDe(A.restauraDadesObertes(LOT(TORRE, { entitats: [{ id: 'una-altra', slug: 'socdepoble', name: 'Una altra', town_name: TORRE.nom, visibility: 'public' }] })));
  expect(error).toMatchObject({ code: 'conflicte-identificador', message: "El slug socdepoble ja és d'una altra entitat." });
  await A.destroy();
});

test('D-01 (sonda3) · seed: el slug de La Torre amb un altre nom, o el nom de La Torre amb un altre slug, no entra', async () => {
  const A = creaAdaptadorLocal({ mode: 'seed', restauracioOberta: true });
  const pobles = (await A.loadCoreContent()).towns;
  const directoriInicial = await A.listPublicOrganizations({ poble: TORRE.nom });
  const entitat = (nom) => ({ id: 'ent-x', name: 'Entitat X', town_name: nom, visibility: 'public' });
  const noticia = (slug) => ({ id: 'n-x', title: 'Notícia X', author_org_id: 'ent-x', poble_id: slug, visibility: 'public' });
  for (const municipi of [{ slug: TORRE.slug, nom: 'Torre Falsa' }, { slug: 'torre-falsa', nom: TORRE.nom }]) {
    const error = await conflicteDe(A.restauraDadesObertes(LOT(municipi, { entitats: [entitat(municipi.nom)], noticies: [noticia(municipi.slug)] })));
    expect(error, municipi.nom).toMatchObject({ code: 'conflicte-identificador' });
  }
  expect((await A.loadCoreContent()).towns).toEqual(pobles);
  expect((await A.llegixDadesObertes({ poble: TORRE })).noticies.map((n) => n.id)).not.toContain('n-x');
  expect(await A.listPublicOrganizations({ poble: TORRE.nom })).toEqual(directoriInicial);
  await A.destroy();
});

test('D-01 · el padró sencer: una entitat no pública, i el slug d’una pública més enllà del sostre del directori', async () => {
  const privada = { id: 'privada-de-sella', slug: 'privada', name: 'Privada', kind: 'entity', town_name: SELLA.nom, visibility: 'private' };
  const moltes = Array.from({ length: 501 }, (_, i) => ({ id: `e-${String(i).padStart(3, '0')}`, slug: `entitat-${i}`, name: `Entitat ${String(i).padStart(3, '0')}`,
    kind: 'entity', town_name: SELLA.nom, visibility: 'public' }));
  const A = creaAdaptadorLocal({ mode: 'local', dades: { entitats: [privada, ...moltes] }, restauracioOberta: true });
  expect(await conflicteDe(A.restauraDadesObertes(LOT(BENILLUP, { entitats: [{ id: 'privada-de-sella', name: 'Segrest', town_name: BENILLUP.nom, visibility: 'public' }] }))))
    .toMatchObject({ code: 'conflicte-identificador', message: expect.stringContaining('privada-de-sella') });
  // L'última per nom (la 501a) no ix al directori amb el sostre, però el seu slug ja és seu.
  expect((await A.listPublicOrganizations({})).map((o) => o.id)).not.toContain('e-500');
  expect(await conflicteDe(A.restauraDadesObertes(LOT(BENILLUP, { entitats: [{ id: 'org-benillup', slug: 'entitat-500', name: 'Segrest', town_name: BENILLUP.nom, visibility: 'public' }] }))))
    .toMatchObject({ code: 'conflicte-identificador', message: "El slug entitat-500 ja és d'una altra entitat." });
  expect(await A.llegixDadesObertes({ poble: BENILLUP })).toEqual({ noticies: [], agenda: [], memoria: [], memoriaOral: [] });
  await A.destroy();
});

test('D-01 · les files de la base són del poble que declaren (poble_id, també l’id del poble; town_name; el lloc): el seu poble les porta, un altre no', async () => {
  const ID_SELLA = '5e11a000-0000-4000-8000-000000000001';
  const dades = {
    towns: [{ id: ID_SELLA, slug: SELLA.slug, title: SELLA.nom }],
    feedPosts: [{ id: 'ban-de-sella', title: 'Ban', town_name: SELLA.nom }, { id: 'ban-del-lloc', title: 'Ban', location: `${SELLA.nom} · Plaça` }],
    events: [{ id: 'acte-de-sella', title: 'Acte', poble_id: ID_SELLA }]
  };
  const A = creaAdaptadorLocal({ mode: 'local', dades, restauracioOberta: true });
  const fila = (id) => ({ id, title: 'Restaurada', author_org_id: 'org-1', poble_id: SELLA.slug, visibility: 'public' });
  for (const [coleccio, id] of [['noticies', 'ban-de-sella'], ['noticies', 'ban-del-lloc'], ['agenda', 'acte-de-sella']]) {
    expect(await conflicteDe(A.restauraDadesObertes(LOT(BENILLUP, { [coleccio]: [{ ...fila(id), poble_id: BENILLUP.slug }] }))), id)
      .toMatchObject({ code: 'conflicte-identificador' });
  }
  const informe = await A.restauraDadesObertes(LOT(SELLA, { noticies: [fila('ban-de-sella'), fila('ban-del-lloc')], agenda: [fila('acte-de-sella')] }));
  expect(informe.creats).toMatchObject({ noticies: 2, agenda: 1 });
  expect((await A.loadMur()).feedPosts.map((n) => [n.id, n.title])).toEqual([['ban-de-sella', 'Restaurada'], ['ban-del-lloc', 'Restaurada']]);
  // El mateix nom amb el slug que no és el del poble de la base: conflicte.
  expect(await conflicteDe(A.restauraDadesObertes(LOT({ slug: 'sella-de-dalt', nom: SELLA.nom })))).toMatchObject({ code: 'conflicte-identificador' });
  await A.destroy();
});

test('D-04 · llegixDadesObertes no passa de LIMIT_DADES_OBERTES: s’atura amb un RangeError, mai talla', async () => {
  const files = (n) => Array.from({ length: n }, (_, i) => ({ id: `n-${i}`, title: 'Ban', poble_id: TORRE.slug }));
  const al = creaAdaptadorLocal({ mode: 'local', dades: { feedPosts: files(LIMIT_DADES_OBERTES) } });
  expect((await al.llegixDadesObertes({ poble: TORRE })).noticies).toHaveLength(LIMIT_DADES_OBERTES);
  const passa = creaAdaptadorLocal({ mode: 'local', dades: { events: files(LIMIT_DADES_OBERTES + 1) } });
  await expect(passa.llegixDadesObertes({ poble: TORRE })).rejects.toThrow(new RangeError(`«agenda» passa de ${LIMIT_DADES_OBERTES} elements: no es talla en silenci.`));
  await al.destroy();
  await passa.destroy();
});

test('T2-G04 · sense restauracioOberta: un paquet bo és sense-permis i no escriu res; un lot invàlid continua sent un TypeError', async () => {
  const P0 = await exportaDes(FONTS);
  for (const opcions of [{}, { restauracioOberta: 'sí' }]) {
    const C = creaAdaptadorLocal({ mode: 'local', dades: { entitats: [] }, ...opcions });
    await expect(importaMunicipiOpenData(P0.zip, portDe(C), { subtle })).rejects.toMatchObject({ code: 'sense-permis' });
    expect(await C.llegixDadesObertes({ poble: TORRE })).toEqual({ noticies: [], agenda: [], memoria: [], memoriaOral: [] });
    expect(await C.listPublicOrganizations({ poble: TORRE.nom })).toEqual([]);
    await expect(C.restauraDadesObertes({ format: 'socdepoble.dadesobertes.v1', versio: '1.2.0', entitats: [], noticies: [], agenda: [], memoria: [], memoriaOral: [] }))
      .rejects.toThrow(TypeError);
    await C.destroy();
  }
});
