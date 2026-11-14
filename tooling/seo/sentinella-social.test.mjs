/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · La sentinella de frescor i de retirada
   (sentinella-social.mjs): només GET, amb un Supabase i dos orígens simulats (cap xarxa). El «lloc
   desplegat» es munta amb les mateixes funcions del build i després es desajusta a posta. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildSocialManifest} from './build-social-manifest.mjs';
import {entornDelBuild, projeccioPublica} from './projeccio-publica.mjs';
import {camisServits} from './prerender-social.mjs';
import {CODIS, headServit, main, ORIGENS_PER_DEFECTE, sentinella} from './sentinella-social.mjs';
import {renderSocialHead} from './social-edge.mjs';

const projectRoot = process.env.SDP_PROJECT_ROOT || process.cwd();
const ORG = 'https://socdepoble.org', CAT = 'https://socdepoble.cat';
const SUPABASE = 'https://exemple.supabase.co';
const TENANT = '11111111-1111-4111-8111-111111111111';
const sha = text => createHash('sha256').update(text).digest('hex');
const b64 = objecte => Buffer.from(JSON.stringify(objecte)).toString('base64url');
const ANON = [b64({alg: 'HS256', typ: 'JWT'}), b64({iss: 'supabase', ref: 'exemple', role: 'anon'}), 'c2lnbmF0dXJhLWZhbHNh'].join('.');
const ENTORN = entornDelBuild({VITE_SUPABASE_URL: SUPABASE, VITE_SUPABASE_ANON_KEY: ANON, VITE_TENANT_ID: TENANT, VITE_DATA_MODE: 'remote'});
const PORTADA = `sdp-media://mitjans/${TENANT}/22222222-2222-4222-8222-222222222222/organitzacions/portada.webp`;
const OLI = Object.freeze({id: '3073b933-69fc-4c3e-80dc-b0df9c6b8391', slug: 'olidelatorre', name: 'Oli de La Torre', kind: 'company', lema: 'El millor oli', description: null, logo_url: null, hero_url: PORTADA});
const FORN = Object.freeze({id: 'c0c1d2e3-f405-4a16-8b27-c38d49e5a6f7', slug: 'forn-de-la-torre', name: 'Forn de la Torre', kind: 'company', lema: 'Pa de llenya', description: null, logo_url: null, hero_url: null});
const jpeg = (w = 1200, h = 630, mida = 2000) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.alloc(14), Buffer.from([0xff, 0xdb, 0x00, 0x03, 0x00]),
  Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03]), Buffer.alloc(9), Buffer.from([0xff, 0xc4, 0x00, 0x03, 0x00, 0xff, 0xda, 0x00, 0x03, 0x00]), Buffer.alloc(mida), Buffer.from([0xff, 0xd9])]);
const json = cos => new Response(JSON.stringify(cos), {headers: {'content-type': 'application/json'}});
const GENERIC = '<!doctype html><html><head><title>Sóc de Poble</title><meta property="og:image" content="https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png"></head><body></body></html>';

/* El Supabase simulat: app_content buit i el directori que es demane. */
const supabase = directori => (url) => {
  if (url.pathname === '/rest/v1/app_content') return json([]);
  if (url.pathname === '/rest/v1/organization_directory') { const o = Number(url.searchParams.get('offset')), l = Number(url.searchParams.get('limit')); return json(directori.slice(o, o + l)); }
  throw new TypeError(`Supabase simulat: no previst ${url.pathname}`);
};

/* Un món: el directori de hui, el que hi ha desplegat a cada origen i el fetch que ho servix tot. */
async function mon(directoriDesplegat, directoriDeHui = directoriDesplegat) {
  const crides = [];
  const backend = {directori: directoriDesplegat};
  const pagines = {[ORG]: new Map(), [CAT]: new Map()}, imatges = {[ORG]: new Map(), [CAT]: new Map()};
  const fetchImpl = async (href, opcions = {}) => {
    const url = new URL(href); crides.push({url, opcions});
    if (url.origin === SUPABASE) return supabase(backend.directori)(url);
    if (!pagines[url.origin]) throw new TypeError(`origen no previst: ${url.origin}`);
    if (imatges[url.origin].has(url.pathname)) { const {bytes, tipus} = imatges[url.origin].get(url.pathname); return new Response(bytes, {headers: {'content-type': tipus}}); }
    if (url.pathname.startsWith('/assets/')) return new Response('no', {status: 404});
    // Firebase i el Node 0 tornen el shell genèric per a un camí sense fitxer.
    return new Response(pagines[url.origin].get(url.pathname) ?? GENERIC, {headers: {'content-type': 'text/html; charset=utf-8'}});
  };
  /* El desplegament: el que el build hauria escrit amb el directori «desplegat». */
  const {snapshot} = await projeccioPublica({entorn: ENTORN, origin: ORG, fetchImpl});
  const {manifest, evidence} = await buildSocialManifest({root: projectRoot, origin: ORG, publicSnapshot: snapshot, imageOrigins: [SUPABASE], estricte: true});
  const camins = [], llistaImatges = new Map();
  for (const {servit, clau, alies} of camisServits(manifest)) {
    const entrada = manifest.routes[clau];
    let image = entrada.image;
    if (new URL(image.url).origin === SUPABASE) {
      const nom = `${sha(image.url).slice(0, 24)}.jpg`;
      llistaImatges.set(nom, image.url);
      image = {url: `${ORG}/assets/og/${nom}`, alt: image.alt, type: 'image/jpeg', width: 1200, height: 630};
    }
    const html = `<!doctype html><html><head>${renderSocialHead({...entrada, image}, ORG)}</head><body></body></html>`;
    for (const origen of [ORG, CAT]) pagines[origen].set(servit, html);
    camins.push({cami: servit, sha256: sha(html), classe: alies ? 'alies' : 'canonica', origen: evidence.origens[clau] || 'editorial'});
  }
  for (const [nom] of llistaImatges) for (const origen of [ORG, CAT]) imatges[origen].set(`/assets/og/${nom}`, {bytes: jpeg(), tipus: 'image/jpeg'});
  const rebut = {schema: 'sdp.social-rebut.v1', camins, imatges: [...llistaImatges].map(([nom, ref]) => ({fitxer: `assets/og/${nom}`, refs: [sha(ref)]}))};
  backend.directori = directoriDeHui;
  crides.length = 0;
  const vigila = (extra = {}) => sentinella({root: projectRoot, entorn: ENTORN, rebut, fetchImpl, pausa: async () => {}, ...extra});
  return {crides, pagines, imatges, rebut, fetchImpl, vigila, manifest};
}
const imatgeDe = (m, cami) => new URL(headServit(m.pagines[ORG].get(cami)).image).pathname;

test('headServit llig el head sense executar res: la marca, el títol, la descripció i la imatge', () => {
  const cap = headServit(`<html><head>${renderSocialHead({title: 'Oli & "Torre"', description: 'El <millor> oli', type: 'website', canonical: `${ORG}/empresa/x`, index: true,
    image: {url: `${ORG}/assets/og/aaaaaaaaaaaaaaaaaaaaaaaa.jpg`, alt: 'x'}}, ORG)}</head><body><title>cos</title></body></html>`);
  assert.deepEqual(cap, {marcat: true, title: 'Oli & "Torre" | Sóc de Poble', description: 'El <millor> oli', image: `${ORG}/assets/og/aaaaaaaaaaaaaaaaaaaaaaaa.jpg`});
  assert.deepEqual(headServit(GENERIC), {marcat: false, title: 'Sóc de Poble', description: null, image: 'https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png'});
  assert.deepEqual([...ORIGENS_PER_DEFECTE], [ORG, CAT]);
});

test('tot fresc amb el rebut: 0; sense el rebut, 5 encara que tot semble fresc; només GET i als dos orígens', async () => {
  const m = await mon([OLI, FORN]);
  const informe = await m.vigila();
  assert.deepEqual([informe.codi, informe.estat, informe.faltants, informe.caducades, informe.retirades], [CODIS.fresc, 'fresc', [], [], []]);
  assert.equal(informe.fitxes, 6, 'les quatre del paquet i les dos entitats');
  for (const {url, opcions} of m.crides) { assert.equal(opcions.method, 'GET', url.href); assert.equal(opcions.body, undefined); }
  // La clau anon només viatja a Supabase; als orígens públics, cap capçalera de credencial.
  for (const {url, opcions} of m.crides) assert.equal(Boolean(opcions.headers?.apikey), url.origin === SUPABASE, url.href);
  // Als dos orígens, la canònica i tots els àlies (amb el rebut).
  for (const origen of [ORG, CAT]) for (const cami of ['/empresa/olidelatorre', `/entitats/${OLI.id}`, '/gent/olidelatorre', '/javillinares', '/perfil/iaia-maria']) {
    assert.ok(m.crides.some(c => c.url.origin === origen && c.url.pathname === cami), `${origen}${cami}`);
  }
  // Sense rebut: mai 0, i només la canònica i els àlies per id que emet l'app.
  m.crides.length = 0;
  const sense = await m.vigila({rebut: null});
  assert.deepEqual([sense.codi, sense.estat], [CODIS.noVerificable, 'no verificable sense el rebut']);
  assert.match(sense.avisos.join(' '), /sense rebut/);
  assert.ok(m.crides.some(c => c.url.pathname === `/empresa/${OLI.id}`) && !m.crides.some(c => c.url.pathname === '/gent/olidelatorre'));
  assert.deepEqual([CODIS.fresc, CODIS.error, CODIS.reRelease, CODIS.retirada, CODIS.noVerificable], [0, 1, 3, 4, 5]);
});

test('una entitat pública sense head propi en un dels dos orígens, o creada després del desplegament: 3', async () => {
  const m = await mon([OLI, FORN]);
  m.pagines[CAT].delete('/empresa/forn-de-la-torre');
  const informe = await m.vigila();
  assert.equal(informe.codi, CODIS.reRelease);
  assert.deepEqual(informe.faltants, [{origen: CAT, cami: '/empresa/forn-de-la-torre', motiu: 'sense head propi (la targeta genèrica)'}]);
  // Una fitxa nova al directori que el desplegament encara no porta.
  const nou = await mon([OLI], [OLI, FORN]);
  const falta = await nou.vigila();
  assert.equal(falta.codi, CODIS.reRelease);
  assert.ok(falta.faltants.some(f => f.origen === ORG && f.cami === '/empresa/forn-de-la-torre') && falta.faltants.some(f => f.origen === CAT));
});

test('el títol, la descripció o la imatge servits ja no són els de hui: 3', async () => {
  const reanomenada = await mon([OLI, FORN], [{...OLI, name: 'Oli de La Torre SCV'}, FORN]);
  const titol = await reanomenada.vigila();
  assert.equal(titol.codi, CODIS.reRelease);
  assert.ok(titol.caducades.some(c => c.cami === '/empresa/olidelatorre' && /títol/.test(c.motiu)));
  const lema = await (await mon([OLI, FORN], [OLI, {...FORN, lema: 'Pa i coques'}])).vigila();
  assert.ok(lema.caducades.some(c => c.cami === '/empresa/forn-de-la-torre' && /descripció/.test(c.motiu)));
  // Ara el Forn té portada i el head servit no la porta; i a l'inrevés.
  const novaFoto = await (await mon([OLI, FORN], [OLI, {...FORN, hero_url: PORTADA.replace('portada', 'forn')}])).vigila();
  assert.ok(novaFoto.caducades.some(c => c.cami === '/empresa/forn-de-la-torre' && /té imatge i el head servit no la porta/.test(c.motiu)));
  const senseFoto = await (await mon([OLI, FORN], [{...OLI, hero_url: null}, FORN])).vigila();
  assert.ok(senseFoto.caducades.some(c => c.cami === '/empresa/olidelatorre' && /una imatge que la fitxa ja no té/.test(c.motiu)));
  assert.equal(senseFoto.codi, CODIS.retirada, 'i la imatge vella encara es servix: retirada pendent');
});

test('una og:image que no torna 200, image/jpeg, 300.000 B com a molt i 1200x630: 3', async () => {
  for (const [canvia, motiu] of [
    [m => m.imatges[ORG].delete(imatgeDe(m, '/empresa/olidelatorre')), /HTTP 404/],
    [m => m.imatges[CAT].set(imatgeDe(m, '/empresa/olidelatorre'), {bytes: jpeg(1200, 630, 300_100), tipus: 'image/jpeg'}), /pesa 30\d+ B/],
    [m => m.imatges[ORG].set(imatgeDe(m, '/empresa/olidelatorre'), {bytes: jpeg(1200, 800), tipus: 'image/jpeg'}), /fa 1200x800/],
    [m => m.imatges[ORG].set(imatgeDe(m, '/empresa/olidelatorre'), {bytes: jpeg(), tipus: 'image/webp'}), /no és un JPEG/],
    [m => m.imatges[ORG].set(imatgeDe(m, '/empresa/olidelatorre'), {bytes: Buffer.from('<html>'), tipus: 'image/jpeg'}), /no és un JPEG/]
  ]) {
    const m = await mon([OLI, FORN]); canvia(m);
    const informe = await m.vigila();
    assert.equal(informe.codi, CODIS.reRelease, String(motiu));
    assert.ok(informe.caducades.some(c => c.cami === '/empresa/olidelatorre' && motiu.test(c.motiu)), `${motiu}: ${JSON.stringify(informe.caducades)}`);
  }
});

test('una fitxa que ja no és al directori i encara es servix: 4, també si només passa a .cat; i la seua imatge', async () => {
  const m = await mon([OLI, FORN], [FORN]);
  const informe = await m.vigila();
  assert.equal(informe.codi, CODIS.retirada);
  for (const origen of [ORG, CAT]) for (const cami of ['/empresa/olidelatorre', `/gent/${OLI.id}`, imatgeDe(m, '/empresa/olidelatorre')]) {
    assert.ok(informe.retirades.some(r => r.origen === origen && r.cami === cami), `${origen}${cami}`);
  }
  // A .org ja s'ha desplegat una release nova (tot ha desaparegut); al Node 0, no (rsync sense --delete).
  const nomesCat = await mon([OLI, FORN], [FORN]);
  const imatge = imatgeDe(nomesCat, '/empresa/olidelatorre');
  for (const cami of [...nomesCat.pagines[ORG].keys()]) if (/olidelatorre|3073b933/.test(cami)) nomesCat.pagines[ORG].delete(cami);
  nomesCat.imatges[ORG].delete(imatge);
  const parcial = await nomesCat.vigila();
  assert.equal(parcial.codi, CODIS.retirada);
  assert.ok(parcial.retirades.length > 0 && parcial.retirades.every(r => r.origen === CAT));
  // Retirada a tot arreu: fresc.
  for (const cami of [...nomesCat.pagines[CAT].keys()]) if (/olidelatorre|3073b933/.test(cami)) nomesCat.pagines[CAT].delete(cami);
  nomesCat.imatges[CAT].delete(imatge);
  assert.equal((await nomesCat.vigila()).codi, CODIS.fresc);
});

test('una fitxa que ara queda exclosa (un nom amb un contacte): 4', async () => {
  const m = await mon([OLI, FORN], [OLI, {...FORN, name: 'Forn 965 123 456'}]);
  const informe = await m.vigila();
  assert.equal(informe.codi, CODIS.retirada);
  assert.ok(informe.retirades.some(r => r.cami === '/empresa/forn-de-la-torre'));
  assert.ok(!informe.retirades.some(r => /olidelatorre/.test(r.cami)));
});

test('la CLI: el codi d’eixida, l’informe en JSON i cap clau ni cap URL de Storage a l’eixida; un error ix amb 1', async () => {
  const m = await mon([OLI, FORN]);
  const sortida = () => { let text = ''; return {write: s => { text += s; return true; }, get text() { return text; }}; };
  const bo = {stdout: sortida(), stderr: sortida()};
  assert.equal(await main(['--root', projectRoot], {env: {}, entorn: ENTORN, fetchImpl: m.fetchImpl, ...bo}), CODIS.noVerificable);
  assert.equal(JSON.parse(bo.stdout.text).estat, 'no verificable sense el rebut');
  assert.ok(!bo.stdout.text.includes(ANON) && !bo.stdout.text.includes(SUPABASE) && !/storage\/v1/.test(bo.stdout.text));
  const mal = {stdout: sortida(), stderr: sortida()};
  assert.equal(await main(['--root', projectRoot], {env: {}, entorn: ENTORN, fetchImpl: async () => { throw new Error(`connexió tallada amb apikey=${ANON}`); }, ...mal}), CODIS.error);
  assert.match(mal.stderr.text, /\[clau\]/); assert.ok(!mal.stderr.text.includes(ANON));
  for (const args of [[], ['--root'], ['--desplega', 'x'], ['--root', projectRoot, '--origen', 'http://insegur.example']]) {
    assert.equal(await main(args, {env: {}, entorn: ENTORN, fetchImpl: m.fetchImpl, stdout: sortida(), stderr: sortida()}), CODIS.error, args.join(' '));
  }
  await assert.rejects(sentinella({root: projectRoot, entorn: ENTORN, rebut: {schema: 'altre'}, fetchImpl: m.fetchImpl}), /rebut/);
});
