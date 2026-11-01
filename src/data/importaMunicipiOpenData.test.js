// @vitest-environment node
/* T2 · D04/D10 (assalt 261101) · src/data/importaMunicipiOpenData.js, el
   restaurador del paquet Open Data. Anada i tornada (exporta → verifica →
   importa → torna a exportar: el MATEIX SHA-256), idempotència, manipulacions
   (cada una falla tancat i no escriu res), compatibilitat 1.0.0 / 1.1.0 i
   capacitat absent. El servidor de destí és un doble en memòria fet amb
   dadesObertesLot.js (el mateix magatzem que l'adaptador local); la prova
   amb l'adaptador local de veres és a importaMunicipiOpenData.adaptadorLocal.test.js.
   Cap xarxa. Dades de prova (.invalid, cap publicació real). */
import { createHash, webcrypto } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { construeixOutbox } from './activitypub.js';
import { CAPACITATS } from './contracte.js';
import {
  entitatsDeLEstat, estatBuitDeDadesObertes, fusionaLotDadesObertes, llegixDeLEstat, validaLotDadesObertes
} from './dadesObertesLot.js';
import { VERSIO_FORMAT, exportaMunicipiOpenData, jsonCanonic, recullDadesPubliquesDelMunicipi, verificaPaquetOpenData } from './exportaMunicipiOpenData.js';
import { VERSIONS_LLEGIBLES, importaMunicipiOpenData, llegeixPaquetOpenData } from './importaMunicipiOpenData.js';
import { estructuraMemoriaOral, marcaRevisioHumana } from '../sections/notes/memoriaOral.js';
import { creaZip, llegeixZip } from '../utils/fulls/zip.js';

const subtle = webcrypto.subtle;
const TORRE = Object.freeze({ slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });
const ARA = '2026-11-01T10:00:00Z';
const ORIGEN = 'https://socdepoble.org';
const ARREL = `dades-obertes-${TORRE.slug}`;
const ENC = new TextEncoder();
const DEC = new TextDecoder();
const sha = (text) => createHash('sha256').update(typeof text === 'string' ? ENC.encode(text) : text).digest('hex');
const TRAMPES = Object.freeze({ correu: 'veina.trampa@poble.invalid', usuari: '0b0e0000-0000-4000-8000-00000000dead', html: '<script>alert(1)</script>', persona: 'Veïna Trampa De Prova' });

/* ── Fixtures en la forma que servix un servidor ─────────────────────────── */

const RENTONAR = '7d1f0000-0000-4000-8000-000000000001';
const FORN = '7d1f0000-0000-4000-8000-000000000002';
const PENYA = '7d1f0000-0000-4000-8000-000000000003';
const ENTITATS = () => [
  { id: RENTONAR, slug: 'rentonar', name: 'Rentonar', kind: 'entity', lema: 'Natura i Patrimoni', description: 'Grup ecologista.',
    logo_url: 'sdp-media://mitjans/rentonar/logo.png', copyright: 'CC BY 4.0', town_name: TORRE.nom, visibility: 'public' },
  { id: FORN, slug: 'forn-de-prova', name: 'Forn de prova', kind: 'company', parent_organization_id: RENTONAR, town_name: TORRE.nom, visibility: 'public' },
  /* 'group' s'exporta com a Organization i torna com a 'entity' (pèrdua documentada). */
  { id: PENYA, slug: 'penya', name: 'Penya de prova', kind: 'group', town_name: TORRE.nom, visibility: 'public' }
];
const NOTICIA = () => ({
  id: 'ban-aigua', title: 'Tall d’aigua dimecres', subtitle: 'Avís', entradilla: 'Avís de l’ajuntament de prova.',
  body: '<p>Primer paràgraf &amp; segon.</p><p>Tercer <b>fort</b>.</p>',
  created_at: '2026-10-20T08:00:00+02:00', updated_at: '2026-10-21T09:00:00Z', author_org_id: RENTONAR, poble_id: TORRE.slug,
  copyright: 'CC BY 4.0', image_url: 'sdp-media://mitjans/ban/ban.webp', visibility: 'public'
});
const ACTES = () => [
  { id: 'festa-de-prova', title: 'Festa de prova', date: '2026-08-15', time: '22:00', location: 'Plaça de prova', poble_id: TORRE.slug,
    author_org_id: RENTONAR, copyright: 'CC BY-SA 4.0', created_at: '2026-08-01T10:00:00Z', updated_at: '2026-08-02T10:00:00Z' },
  /* Dos dies sencers: la fi és EXCLUSIVA (el 31 vol dir que acaba el 30). */
  { id: 'fira-de-prova', title: 'Fira de prova', inici: { data: '2026-10-29' }, fi: { data: '2026-10-31' }, poble_id: TORRE.slug, author_org_id: FORN },
  { id: 'sense-inici', title: 'Acte sense data', poble_id: TORRE.slug, author_org_id: RENTONAR }
];
const MEMORIA = () => ({ id: 'llegenda-moro', title: 'La llegenda del moro', entradilla: 'Una llegenda.', text: 'Diuen que hi havia un moro.',
  author_org_id: RENTONAR, poble_id: TORRE.slug, copyright: 'CC0 1.0', created_at: '2026-09-01T10:00:00Z' });
const RELAT = `Jo vaig nàixer a la Torre de les Maçanes l'any quaranta-dos. Mon pare era llaurador i ma mare cosia per a les veïnes del carrer.

A l'estiu segàvem el blat amb la falç i després el batíem a l'era amb la mula. Les dones cantaven mentres collien les olives a la Torre de les Maçanes.`;
const fitxaOral = () => {
  const esborrany = estructuraMemoriaOral(RELAT, { ara: '2026-10-30T09:00:00Z', autor: 'sense-identificador' });
  const revisada = marcaRevisioHumana(esborrany, { persona: 'sense-identificador', ara: '2026-10-31T09:00:00Z' });
  return { id: 'relat-collita', okf: { cami: revisada.okf.cami, frontmatter: structuredClone(revisada.okf.frontmatter), cos: revisada.okf.cos },
    author_org_id: RENTONAR, copyright: 'CC BY 4.0', created_at: '2026-10-31T09:00:00Z', visibility: 'public' };
};
const NETES = () => ({ entitats: ENTITATS(), noticies: [NOTICIA()], agenda: ACTES(), memoria: [MEMORIA()], memoriaOral: [fitxaOral()] });

/* Un servidor de dades en memòria: el magatzem de dadesObertesLot.js, amb les tres capacitats. */
function servidorEnMemoria() {
  const s = { estat: estatBuitDeDadesObertes() };
  const port = {
    teCapacitat: (capacitat) => ['directoriEntitats', 'dadesObertes', 'restauracioDadesObertes'].includes(capacitat),
    listPublicOrganizations: vi.fn(async ({ poble }) => entitatsDeLEstat(s.estat, { nom: poble })),
    llegixDadesObertes: vi.fn(async ({ poble }) => llegixDeLEstat(s.estat, { poble })),
    restauraDadesObertes: vi.fn(async (lot) => {
      const { estat, informe } = fusionaLotDadesObertes(s.estat, lot);
      s.estat = estat;
      return informe;
    })
  };
  return { port, s };
}
/* Un servidor «brut» que servix files tal com vénen (camps de més, trampes, altres pobles). */
function servidorDeFonts(fonts) {
  return {
    teCapacitat: (capacitat) => ['directoriEntitats', 'dadesObertes'].includes(capacitat),
    listPublicOrganizations: async () => structuredClone(fonts.entitats),
    llegixDadesObertes: async () => structuredClone({ noticies: fonts.noticies, agenda: fonts.agenda, memoria: fonts.memoria, memoriaOral: fonts.memoriaOral })
  };
}
const opcionsExport = { subtle };
/* El que fa entradaOpenDataDelPoble, sense xarxa: recull del port i exporta amb el mateix instant, origen i actors. */
async function exportaDes(port, { actorsPublicats = [], activityStreams } = {}) {
  const dades = await recullDadesPubliquesDelMunicipi(port, TORRE);
  const { entitats, ...resta } = dades;
  return exportaMunicipiOpenData({ municipi: TORRE, ara: ARA, origen: ORIGEN, actorsPublicats, ...resta, entitats: entitats ?? undefined,
    ...(activityStreams ? { activityStreams } : {}) }, opcionsExport);
}

/* ── Bossa refeta: canvia fitxers i recalcula el Data Package, el manifest, l'Oxum i el tagmanifest ── */

function refa(zip, canvia, { refaDatapackage = true } = {}) {
  const fitxers = new Map(llegeixZip(zip).map(({ nom, dades }) => [nom.slice(ARREL.length + 1), DEC.decode(dades)]));
  canvia(fitxers);
  if (refaDatapackage) {
    const dp = JSON.parse(fitxers.get('data/datapackage.json'));
    const recurs = (cami) => ({ bytes: ENC.encode(fitxers.get(cami)).length, hash: `sha256:${sha(fitxers.get(cami))}` });
    dp.resources = dp.resources.filter((r) => fitxers.has(`data/${r.path}`)).map((r) => ({ ...r, ...recurs(`data/${r.path}`) }));
    for (const cami of fitxers.keys()) {
      if (cami.startsWith('data/') && cami !== 'data/datapackage.json' && !dp.resources.some((r) => `data/${r.path}` === cami)) {
        dp.resources.push({ name: cami.slice(5).replace(/[^a-z0-9._-]/g, '-'), path: cami.slice(5), title: 'x', format: 'json', mediatype: 'application/json', encoding: 'utf-8', ...recurs(cami) });
      }
    }
    fitxers.set('data/datapackage.json', jsonCanonic(dp));
  }
  const carrega = [...fitxers.keys()].filter((c) => c.startsWith('data/')).sort();
  fitxers.set('manifest-sha256.txt', carrega.map((c) => `${sha(fitxers.get(c))}  ${c}\n`).join(''));
  const octets = carrega.reduce((t, c) => t + ENC.encode(fitxers.get(c)).length, 0);
  fitxers.set('bag-info.txt', fitxers.get('bag-info.txt').replace(/Payload-Oxum: .*\n/, `Payload-Oxum: ${octets}.${carrega.length}\n`));
  fitxers.set('tagmanifest-sha256.txt', ['bag-info.txt', 'bagit.txt', 'manifest-sha256.txt'].map((c) => `${sha(fitxers.get(c))}  ${c}\n`).join(''));
  return creaZip([...fitxers].sort(([a], [b]) => (a < b ? -1 : 1)).map(([c, t]) => ({ nom: `${ARREL}/${c}`, dades: ENC.encode(t) })));
}
const textDe = (zip, cami) => DEC.decode(llegeixZip(zip).find((e) => e.nom === `${ARREL}/${cami}`).dades);
const grafDe = (zip, nom) => JSON.parse(textDe(zip, `data/${nom}`))['@graph'];
const ambGraf = (nom, canvia) => (fitxers) => {
  const graf = JSON.parse(fitxers.get(`data/${nom}`));
  canvia(graf['@graph']);
  fitxers.set(`data/${nom}`, jsonCanonic(graf));
};
/* Un nom hostil dins del ZIP: creaZip no en crea cap, així que es reescriuen els bytes d'un nom de la mateixa llargària
   a la capçalera local i a la central. */
function ambNomHostil(zip, hostil) {
  const placeholder = 'q'.repeat(ENC.encode(hostil).length);
  const base = llegeixZip(zip).map(({ nom, dades }) => ({ nom, dades }));
  const cru = creaZip([...base, { nom: placeholder, dades: 'x' }]);
  const de = ENC.encode(placeholder);
  const a = ENC.encode(hostil);
  for (let i = 0; i <= cru.length - de.length; i += 1) {
    if (de.every((b, j) => cru[i + j] === b)) cru.set(a, i);
  }
  return cru;
}

async function paquetBo() {
  const { port, s } = servidorEnMemoria();
  const llegit = await exportaDes(servidorDeFonts(NETES()));
  await importaMunicipiOpenData(llegit.zip, port, { subtle });
  return { zip: llegit.zip, P: llegit, port, s };
}

describe('anada i tornada', () => {
  test('exporta → verifica → importa en un servidor buit → torna a exportar: el MATEIX SHA-256, ZIP sencer', async () => {
    const P1 = await exportaDes(servidorDeFonts(NETES()));
    expect(P1.fitxers.map((f) => f.cami)).toEqual(expect.arrayContaining(['data/memoria-oral.jsonld', 'data/okf/index.md', 'data/okf/log.md']));
    await expect(verificaPaquetOpenData(P1.zip, { subtle })).resolves.toMatchObject({ slug: TORRE.slug });
    const B = servidorEnMemoria();
    const informe = await importaMunicipiOpenData(P1.zip, B.port, { subtle });
    expect(informe).toMatchObject({ slug: TORRE.slug, versio: VERSIO_FORMAT, sha256: P1.sha256, integritat: 'sha256-verificada', autenticitat: 'no-verificada',
      comptes: { noticies: 1, agenda: 3, directori: 3, memoria: 1, memoriaOral: 1 } });
    expect(informe.restauracio.creats).toEqual({ entitats: 3, noticies: 1, agenda: 3, memoria: 1, memoriaOral: 1 });
    expect(informe.noRestaurat.map((n) => n.coleccio)).toEqual(['configuracio', 'activitystreams', 'mitjans']);
    const P2 = await exportaDes(B.port);
    expect(P2.sha256).toBe(P1.sha256);
    expect(P2.zip).toEqual(P1.zip);
    // La pèrdua documentada: la penya ('group') torna com a 'entity'.
    expect(entitatsDeLEstat(B.s.estat).find((e) => e.id === PENYA).kind).toBe('entity');
  });

  test('l’agenda: la fi exclusiva del model torna igual (endDate + 1 dia), i un acte amb hora porta el seu desfasament', async () => {
    const { s } = await paquetBo();
    const agenda = llegixDeLEstat(s.estat, { poble: TORRE }).agenda;
    expect(agenda.find((a) => a.id === 'fira-de-prova')).toMatchObject({ inici: '2026-10-29', fi: '2026-10-31' });
    expect(agenda.find((a) => a.id === 'festa-de-prova')).toMatchObject({ inici: '2026-08-15T22:00:00+02:00', location: 'Plaça de prova' });
    expect(agenda.find((a) => a.id === 'sense-inici')).not.toHaveProperty('inici');
  });

  test('la fitxa OKF torna byte a byte, i el seu Markdown és el del paquet', async () => {
    const { zip, s } = await paquetBo();
    const [oral] = llegixDeLEstat(s.estat, { poble: TORRE }).memoriaOral;
    expect(oral.okf.cami).toBe(fitxaOral().okf.cami);
    expect(oral.okf.frontmatter).toEqual(fitxaOral().okf.frontmatter);
    const revisada = marcaRevisioHumana(estructuraMemoriaOral(RELAT, { ara: '2026-10-30T09:00:00Z', autor: 'sense-identificador' }),
      { persona: 'sense-identificador', ara: '2026-10-31T09:00:00Z' });
    expect(textDe(zip, `data/okf/${oral.okf.cami}`)).toBe(revisada.okf.markdown);
  });

  test('idempotent: la segona importació no crea ni actualitza res, i l’estat no canvia', async () => {
    const { zip, port, s } = await paquetBo();
    const abans = llegixDeLEstat(s.estat, { poble: TORRE });
    const segona = await importaMunicipiOpenData(zip, port, { subtle });
    expect(segona.restauracio).toEqual({
      creats: { entitats: 0, noticies: 0, agenda: 0, memoria: 0, memoriaOral: 0 },
      actualitzats: { entitats: 0, noticies: 0, agenda: 0, memoria: 0, memoriaOral: 0 },
      iguals: { entitats: 3, noticies: 1, agenda: 3, memoria: 1, memoriaOral: 1 }
    });
    expect(llegixDeLEstat(s.estat, { poble: TORRE })).toEqual(abans);
  });

  test('fonts brutes (trampes, veïnat, altres pobles, privades, camps de més): els grafs i okf/ tornen iguals, P3 = P2 i cap trampa a l’estat', async () => {
    const brutes = NETES();
    brutes.noticies.push(
      { ...NOTICIA(), id: 'veina-1', owner_user_id: TRAMPES.usuari, title: TRAMPES.persona },
      { ...NOTICIA(), id: 'privada', visibility: 'members' },
      { ...NOTICIA(), id: 'de-sella', poble_id: 'sella' }
    );
    brutes.noticies[0].email = TRAMPES.correu;
    brutes.noticies[0].presentacio_html = TRAMPES.html;
    brutes.entitats.push({ id: 'org-sella', name: 'De Sella', town_name: 'Sella', visibility: 'public', email: TRAMPES.correu });
    brutes.memoriaOral.push({ ...fitxaOral(), id: 'esborrany', okf: { ...fitxaOral().okf, cami: fitxaOral().okf.cami.replace('.md', '-b.md'), frontmatter: { ...fitxaOral().okf.frontmatter, status: 'draft' } } });
    const P1 = await exportaDes(servidorDeFonts(brutes));
    const B = servidorEnMemoria();
    await importaMunicipiOpenData(P1.zip, B.port, { subtle });
    const P2 = await exportaDes(B.port);
    const dades = (zip) => llegeixZip(zip).filter((e) => /\/data\/(?:.*\.jsonld|okf\/.*|llicencies\.md)$/.test(e.nom)).map((e) => [e.nom, DEC.decode(e.dades)]);
    expect(dades(P2.zip)).toEqual(dades(P1.zip));
    expect(P1.omissions.noticies).toMatchObject({ nomesMembres: 1, noPubliques: 1, altresPobles: 1 });
    expect(P1.omissions.memoriaOral).toEqual({ noRevisades: 1 });
    const C = servidorEnMemoria();
    await importaMunicipiOpenData(P2.zip, C.port, { subtle });
    const P3 = await exportaDes(C.port);
    expect(P3.sha256).toBe(P2.sha256);
    const estat = JSON.stringify(llegixDeLEstat(B.s.estat, { poble: TORRE })) + JSON.stringify(entitatsDeLEstat(B.s.estat));
    for (const trampa of Object.values(TRAMPES)) expect(estat).not.toContain(trampa);
    expect(estat).not.toMatch(/owner_user_id|ownerUserId|email|correu/);
  });

  test('un poble federat: l’actor i l’outbox es validen (no es restauren), i la tornada és la mateixa', async () => {
    const outbox = construeixOutbox(TORRE.slug, [{ id: 'avis-1', tipus: 'Note', nom: 'Avís', text: 'Text públic', llengua: 'ca', publicat: '2026-10-01T10:00:00Z' }], { origen: ORIGEN });
    const P1 = await exportaDes(servidorDeFonts(NETES()), { actorsPublicats: [TORRE.slug], activityStreams: outbox });
    const llegit = await llegeixPaquetOpenData(P1.zip, { subtle });
    expect(llegit).toMatchObject({ actorsPublicats: [TORRE.slug], origen: ORIGEN, activityStreams: { type: 'OrderedCollection' } });
    const B = servidorEnMemoria();
    await importaMunicipiOpenData(P1.zip, B.port, { subtle });
    const P2 = await exportaDes(B.port, { actorsPublicats: [TORRE.slug], activityStreams: outbox });
    expect(P2.sha256).toBe(P1.sha256);
  });

  test('el lot no porta cap persona, correu ni id de compte, i és un lot vàlid', async () => {
    const P1 = await exportaDes(servidorDeFonts(NETES()));
    const { lot } = await llegeixPaquetOpenData(P1.zip, { subtle });
    expect(validaLotDadesObertes(lot)).toEqual([]);
    expect(JSON.stringify(lot)).not.toMatch(/owner_user_id|ownerUserId|author_user_id|author_id"|email|correu|human:(?!sense-identificador)/);
  });
});

describe('manipulacions: TypeError i restauraDadesObertes no es crida', () => {
  const rebutja = async (zip, patro, opcions = {}) => {
    const { port } = servidorEnMemoria();
    await expect(importaMunicipiOpenData(zip, port, { subtle, ...opcions })).rejects.toThrow(patro);
    expect(port.restauraDadesObertes).not.toHaveBeenCalled();
  };

  test('la bossa refeta sense canvis passa (cada prova de davall canvia UNA cosa)', async () => {
    const { zip } = await paquetBo();
    const { port } = servidorEnMemoria();
    await expect(importaMunicipiOpenData(refa(zip, () => {}), port, { subtle })).resolves.toMatchObject({ slug: TORRE.slug });
  });

  test('a) un byte canviat amb el CRC refet', async () => {
    const { zip } = await paquetBo();
    const tocat = creaZip(llegeixZip(zip).map((e) => (e.nom.endsWith('/data/noticies.jsonld') ? { ...e, dades: Uint8Array.from(e.dades, (b, i) => (i === 60 ? b ^ 1 : b)) } : e)));
    await rebutja(tocat, /SHA-256 que no quadra: data\/noticies\.jsonld/);
  });

  test('b) un camp injectat amb el manifest, el tagmanifest i el Data Package refets', async () => {
    const { zip } = await paquetBo();
    await rebutja(refa(zip, ambGraf('noticies.jsonld', (g) => { g[0].email = TRAMPES.correu; })), /propietat no admesa: email/);
    // Un valor canviat que la llista blanca admet: la regeneració canònica el veu.
    await rebutja(refa(zip, ambGraf('noticies.jsonld', (g) => { g[0].articleBody = `${TRAMPES.html} cos`; })), /no és canònic/);
    await rebutja(refa(zip, ambGraf('agenda.jsonld', (g) => { g[0].startDate = '2026-08-15T22:00'; })), /no és canònic/);
    // Una autoria que diu ser d'una entitat del directori amb un altre nom.
    await rebutja(refa(zip, ambGraf('noticies.jsonld', (g) => { g[0].author.name = TRAMPES.persona; })), /no és la de l’entitat del directori/);
  });

  test('c) un fitxer absent, amb la bossa refeta', async () => {
    const { zip } = await paquetBo();
    await rebutja(refa(zip, (f) => f.delete('data/agenda.jsonld')), /falta data\/agenda\.jsonld/);
    await rebutja(refa(zip, (f) => f.delete('data/okf/log.md')), /okf\//);
  });

  test('d) un fitxer de més, amb la bossa refeta, i un de més sense refer-la', async () => {
    const { zip } = await paquetBo();
    await rebutja(refa(zip, (f) => f.set('data/extra.json', '{}\n')), /data\/extra\.json no és de la versió/);
    await rebutja(refa(zip, (f) => f.set('data/okf/memoria-oral/la-torre-de-les-macanes/colada.md', 'x')), /okf\//);
    const sense = creaZip([...llegeixZip(zip).map(({ nom, dades }) => ({ nom, dades })), { nom: `${ARREL}/data/extra.md`, dades: 'x' }]);
    await rebutja(sense, /no llista exactament/);
  });

  test('e) noms hostils: ../, camí absolut, barra invertida i okf/../..', async () => {
    const { zip } = await paquetBo();
    for (const nom of [`${ARREL}/../bagit.txt`, '../evil', '/abs', `${ARREL}/data\\x.json`, `${ARREL}/data/okf/../../x.md`]) {
      await rebutja(ambNomHostil(zip, nom), TypeError);
    }
  });

  test('f) dues arrels, o una arrel que no quadra amb el Data Package', async () => {
    const { zip } = await paquetBo();
    const dues = creaZip([...llegeixZip(zip).map(({ nom, dades }) => ({ nom, dades })), { nom: 'dades-obertes-sella/data/x.md', dades: 'x' }]);
    await rebutja(dues, /no esperat/);
    await rebutja(refa(zip, (f) => {
      const dp = JSON.parse(f.get('data/datapackage.json'));
      dp.socdepoble.municipi = 'sella';
      f.set('data/datapackage.json', jsonCanonic(dp));
    }), /municipi del Data Package/);
    await rebutja(refa(zip, (f) => {
      const dp = JSON.parse(f.get('data/datapackage.json'));
      dp.name = 'dades-obertes-sella';
      f.set('data/datapackage.json', jsonCanonic(dp));
    }), /municipi del Data Package/);
  });

  test('g) una versió que no es llig', async () => {
    const { zip } = await paquetBo();
    await rebutja(refa(zip, (f) => {
      const dp = JSON.parse(f.get('data/datapackage.json'));
      Object.assign(dp.socdepoble, { schemaVersion: '9.9.9', versio: '9.9.9' });
      f.set('data/datapackage.json', jsonCanonic(dp));
    }), /versió del format no admesa: 9\.9\.9/);
    expect(VERSIONS_LLEGIBLES).toEqual(['1.0.0', '1.1.0', '1.2.0']);
  });

  test('h) __proto__ en un node (i Object.prototype intacte)', async () => {
    const { zip } = await paquetBo();
    const contaminat = refa(zip, (f) => {
      const text = f.get('data/noticies.jsonld').replace('"@type": "NewsArticle",', '"@type": "NewsArticle",\n      "__proto__": { "admin": true },');
      f.set('data/noticies.jsonld', text);
    });
    await rebutja(contaminat, /clau prohibida __proto__/);
    expect({}.admin).toBeUndefined();
  });

  test('i) un sostre de lectura petit és un RangeError', async () => {
    const { zip } = await paquetBo();
    await rebutja(zip, RangeError, { maxEixida: 1000 });
  });

  test('j) un SHA-256 esperat que no coincidix; i quan coincidix, l’autenticitat ho diu', async () => {
    const { zip } = await paquetBo();
    await rebutja(zip, /no és l’esperat/, { sha256Esperat: '0'.repeat(64) });
    await rebutja(zip, /64 xifres/, { sha256Esperat: 'no' });
    const { port } = servidorEnMemoria();
    await expect(importaMunicipiOpenData(zip, port, { subtle, sha256Esperat: sha(zip).toUpperCase() }))
      .resolves.toMatchObject({ autenticitat: 'sha256-esperat-coincidix' });
  });

  test('k) una fitxa OKF en esborrany o amb l’identificador d’una persona, amb la bossa refeta', async () => {
    const { zip } = await paquetBo();
    const cami = `data/okf/${fitxaOral().okf.cami}`;
    // En esborrany el generador no la publica: el paquet porta un fitxer que no escriuria.
    await rebutja(refa(zip, (f) => f.set(cami, f.get(cami).replace('status: stable', 'status: draft'))), /no són els que el generador escriu/);
    // Amb l'identificador d'una persona, tampoc (actorsAmbIdentificador).
    await rebutja(refa(zip, (f) => f.set(cami, f.get(cami).replaceAll('"human:sense-identificador"', `"human:${TRAMPES.usuari}"`))), /no són els que el generador escriu/);
  });

  test('l) un .md OKF amb una clau YAML de més, o que no és el Markdown del Mas', async () => {
    const { zip } = await paquetBo();
    const cami = `data/okf/${fitxaOral().okf.cami}`;
    await rebutja(refa(zip, (f) => f.set(cami, f.get(cami).replace('status: stable\n', 'status: stable\npersona: "Veïna"\n'))), /clau del frontmatter no admesa \(persona\)/);
    await rebutja(refa(zip, (f) => f.set(cami, f.get(cami).replace('status: stable', 'status:  stable'))), /estat no admés/);
    await rebutja(refa(zip, (f) => f.set(cami, f.get(cami).replace('type: "Memòria oral"', 'type: Memòria oral'))), /valor YAML no admés/);
    // Una forma que l'analitzador llig però que el serialitzador del Mas no escriu (l'etiqueta entre cometes): no és byte a byte.
    const original = textDe(zip, cami);
    const ambCometes = original.replace(/^tags: \[([a-z][a-z0-9-]*)/m, 'tags: ["$1"');
    expect(ambCometes).not.toBe(original);
    await rebutja(refa(zip, (f) => f.set(cami, ambCometes)), /no és el Markdown OKF que escriu el Mas/);
  });

  test('un JSON que no és canònic, encara que diga el mateix', async () => {
    const { zip } = await paquetBo();
    await rebutja(refa(zip, (f) => f.set('data/municipi.jsonld', JSON.stringify(JSON.parse(f.get('data/municipi.jsonld'))))), /no és el JSON canònic/);
  });

  test('un recompte del Data Package que no quadra amb el graf', async () => {
    const { zip } = await paquetBo();
    await rebutja(refa(zip, (f) => {
      const dp = JSON.parse(f.get('data/datapackage.json'));
      dp.socdepoble.comptes.noticies = 7;
      f.set('data/datapackage.json', jsonCanonic(dp));
    }), /comptes\.noticies no quadra/);
  });

  test('Gauntlet SEG-06 · calendari i omissions del Data Package: la forma de l’exportador o TypeError (mai JSON arbitrari)', async () => {
    const { zip, P } = await paquetBo();
    const ambSdp = (canvia) => refa(zip, (f) => {
      const dp = JSON.parse(f.get('data/datapackage.json'));
      canvia(dp.socdepoble);
      f.set('data/datapackage.json', jsonCanonic(dp));
    });
    // El paquet bo: les dues claus tal com les ha escrites l'exportador.
    const llegit = await llegeixPaquetOpenData(zip, { subtle });
    expect(llegit.calendari).toEqual(P.datapackage.socdepoble.calendari);
    expect(llegit.calendari).toEqual({ actes: expect.any(Number), senseInici: expect.any(Number), foraDAbast: expect.any(Number) });
    expect(llegit.omissions).toEqual(P.datapackage.socdepoble.omissions);
    // Sense calendari (la 1.0.0) o amb null (sense cap acte): null.
    expect((await llegeixPaquetOpenData(ambSdp((s) => { delete s.calendari; }), { subtle })).calendari).toBeNull();
    expect((await llegeixPaquetOpenData(ambSdp((s) => { s.calendari = null; }), { subtle })).calendari).toBeNull();
    const calendarisDolents = [
      (s) => { s.calendari.actes = { niat: { mes: 1 } }; },
      (s) => { s.calendari.colat = 0; },
      (s) => { delete s.calendari.foraDAbast; },
      (s) => { s.calendari.senseInici = -1; },
      (s) => { s.calendari.actes = 1.5; },
      (s) => { s.calendari = [1, 2, 3]; },
      (s) => { s.calendari = 'tres'; }
    ];
    for (const canvia of calendarisDolents) await rebutja(ambSdp(canvia), /datapackage\.json calendari invàlid/);
    const omissionsDolentes = [
      (s) => { s.omissions.noticies = { motiu: { niat: 1 } }; },
      (s) => { s.omissions.noticies = { motiu: '1' }; },
      (s) => { s.omissions.colada = {}; },
      (s) => { s.omissions.agenda = [1]; },
      (s) => { s.omissions = 'cap'; }
    ];
    for (const canvia of omissionsDolentes) await rebutja(ambSdp(canvia), /datapackage\.json omissions invàlides/);
  });

  test('un paquet que no és un ZIP, o que no són bytes', async () => {
    await rebutja(ENC.encode('no és cap zip'), TypeError);
    const { port } = servidorEnMemoria();
    await expect(importaMunicipiOpenData('text', port, { subtle })).rejects.toThrow(/Uint8Array/);
  });

  test('T2-G05 · un Buffer de Node que qui crida esborra just després: el restaurador treballa sobre la seua còpia', async () => {
    const { zip } = await paquetBo();
    const buffer = Buffer.from(zip);
    const { port } = servidorEnMemoria();
    const restauracio = importaMunicipiOpenData(buffer, port, { subtle, sha256Esperat: sha(zip) });
    buffer.fill(0);
    await expect(restauracio).resolves.toMatchObject({ slug: TORRE.slug, autenticitat: 'sha256-esperat-coincidix' });
  });
});

describe('compatibilitat de versions', () => {
  /* El mateix paquet reescrit amb la forma d'una versió anterior. */
  function comVersio(zip, versio) {
    return refa(zip, (f) => {
      for (const cami of [...f.keys()]) if (cami.startsWith('data/okf/') || cami === 'data/memoria-oral.jsonld') f.delete(cami);
      const dp = JSON.parse(f.get('data/datapackage.json'));
      dp.socdepoble.versio = versio;
      delete dp.socdepoble.comptes.memoriaOral;
      delete dp.socdepoble.omissions.memoriaOral;
      if (versio === '1.0.0') {
        delete dp.socdepoble.schemaVersion;
        delete dp.socdepoble.calendari;
        f.delete('data/agenda.ics');
        // La 1.0.0 escrivia la fi exclusiva del model tal qual.
        const graf = JSON.parse(f.get('data/agenda.jsonld'));
        for (const acte of graf['@graph']) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(acte.endDate ?? '')) {
            const [a, m, d] = acte.endDate.split('-').map(Number);
            acte.endDate = new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
          }
        }
        f.set('data/agenda.jsonld', jsonCanonic(graf));
      } else {
        dp.socdepoble.schemaVersion = versio;
        f.set('data/agenda.ics', f.get('data/agenda.ics').replace(`exportaMunicipiOpenData ${VERSIO_FORMAT}`, `exportaMunicipiOpenData ${versio}`));
      }
      for (const cami of ['data/memoria.md', 'bag-info.txt']) f.set(cami, f.get(cami).replaceAll(VERSIO_FORMAT, versio));
      f.set('data/datapackage.json', jsonCanonic(dp));
    });
  }

  test('1.1.0: fi = endDate + 1 dia; 1.0.0 (sense agenda.ics ni schemaVersion): fi = endDate', async () => {
    const P1 = await exportaDes(servidorDeFonts({ ...NETES(), memoriaOral: [] }));
    expect(grafDe(P1.zip, 'agenda.jsonld').find((a) => a.identifier === 'fira-de-prova').endDate).toBe('2026-10-30');
    for (const [versio, fi] of [['1.1.0', '2026-10-31'], ['1.0.0', '2026-10-31']]) {
      const zip = comVersio(P1.zip, versio);
      if (versio === '1.0.0') expect(grafDe(zip, 'agenda.jsonld').find((a) => a.identifier === 'fira-de-prova').endDate).toBe('2026-10-31');
      const B = servidorEnMemoria();
      await expect(importaMunicipiOpenData(zip, B.port, { subtle }), versio).resolves.toMatchObject({ versio });
      expect(llegixDeLEstat(B.s.estat, { poble: TORRE }).agenda.find((a) => a.id === 'fira-de-prova').fi, versio).toBe(fi);
    }
  });

  test('una versió anterior no pot portar okf/, ni la 1.0.0 un agenda.ics', async () => {
    const { zip } = await paquetBo();
    const ambOkf = refa(zip, (f) => {
      const dp = JSON.parse(f.get('data/datapackage.json'));
      Object.assign(dp.socdepoble, { schemaVersion: '1.1.0', versio: '1.1.0' });
      f.set('data/datapackage.json', jsonCanonic(dp));
    });
    const { port } = servidorEnMemoria();
    await expect(importaMunicipiOpenData(ambOkf, port, { subtle })).rejects.toThrow(/no és de la versió 1\.1\.0/);
    const P1 = await exportaDes(servidorDeFonts({ ...NETES(), memoriaOral: [] }));
    const ics100 = refa(comVersio(P1.zip, '1.0.0'), (f) => f.set('data/agenda.ics', 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n'));
    await expect(importaMunicipiOpenData(ics100, port, { subtle })).rejects.toThrow(/data\/agenda\.ics no és de la versió 1\.0\.0/);
    expect(port.restauraDadesObertes).not.toHaveBeenCalled();
  });

  /* T2-G02 · Una rebaixa a 1.0.0 no salta la regeneració de l'agenda: el
     mateix canvi que la 1.2.0 rebutja, la 1.0.0 també. El paquet 1.0.0 de
     veres (f66de7865) és a importaMunicipiOpenData.v100.test.js. */
  test('m) rebaixa a 1.0.0 amb un nom, una imatge i un inici que el generador no escriu', async () => {
    const P1 = await exportaDes(servidorDeFonts({ ...NETES(), memoriaOral: [] }));
    const hostil = (g) => { Object.assign(g.find((a) => a.identifier === 'festa-de-prova'), { name: TRAMPES.html, image: 'javascript:alert(1)', startDate: 'quan vulgues' }); };
    for (const versio of ['1.0.0', '1.1.0']) {
      const { port } = servidorEnMemoria();
      await expect(importaMunicipiOpenData(comVersio(P1.zip, versio), port, { subtle }), versio).resolves.toMatchObject({ versio });
      await expect(importaMunicipiOpenData(refa(comVersio(P1.zip, versio), ambGraf('agenda.jsonld', hostil)), port, { subtle }), versio)
        .rejects.toThrow(/data\/agenda\.jsonld no és canònic/);
      expect(port.restauraDadesObertes, versio).toHaveBeenCalledTimes(1);
    }
  });
});

describe('el port', () => {
  test('sense la capacitat restauracioDadesObertes: codi sense-capacitat i res llegit ni escrit', async () => {
    const { zip } = await paquetBo();
    const restauraDadesObertes = vi.fn();
    const error = await importaMunicipiOpenData(zip, { teCapacitat: () => false, restauraDadesObertes }, { subtle }).catch((e) => e);
    expect(error).toMatchObject({ code: 'sense-capacitat', message: 'Este servidor de dades no pot restaurar paquets de dades obertes.' });
    expect(restauraDadesObertes).not.toHaveBeenCalled();
    await expect(importaMunicipiOpenData(zip, null, { subtle })).rejects.toThrow(TypeError);
    expect(CAPACITATS.restauracioDadesObertes).toEqual(['restauraDadesObertes']);
  });

  test('un senyal avortat: AbortError, abans de llegir i abans d’escriure', async () => {
    const { zip } = await paquetBo();
    const { port } = servidorEnMemoria();
    const control = new AbortController();
    control.abort();
    await expect(importaMunicipiOpenData(zip, port, { subtle, signal: control.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(port.restauraDadesObertes).not.toHaveBeenCalled();
    // El senyal i la config arriben a l'adaptador.
    const viu = new AbortController();
    await importaMunicipiOpenData(zip, port, { subtle, signal: viu.signal, config: { tenantId: 'x' } });
    expect(port.restauraDadesObertes.mock.calls[0][1]).toEqual({ tenantId: 'x', signal: viu.signal });
  });

  test('un informe de l’adaptador que no té la forma del contracte és un TypeError; un conflicte es propaga', async () => {
    const { zip } = await paquetBo();
    const port = { teCapacitat: () => true, restauraDadesObertes: async () => ({ creats: 1 }) };
    await expect(importaMunicipiOpenData(zip, port, { subtle })).rejects.toThrow(/creats, actualitzats, iguals/);
    const conflicte = { teCapacitat: () => true, restauraDadesObertes: async () => { throw Object.assign(new Error('d’un altre poble'), { code: 'conflicte-identificador' }); } };
    await expect(importaMunicipiOpenData(zip, conflicte, { subtle })).rejects.toMatchObject({ code: 'conflicte-identificador' });
  });

  test('llegeixPaquetOpenData informa de la configuració, les omissions i les fonts pendents sense restaurar res', async () => {
    const { zip } = await paquetBo();
    const llegit = await llegeixPaquetOpenData(zip, { subtle });
    expect(llegit).toMatchObject({ versio: VERSIO_FORMAT, ara: ARA, origen: ORIGEN, municipi: TORRE, personalitzacio: {},
      pendents: [{ coleccio: 'configuracio', motiu: "la personalització és de tot el node, no d'un poble, i la fitxa del poble no la inclou" }] });
    expect(llegit.sha256).toBe(sha(zip));
  });
});
