/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Les fonts veïnals de la projecció (fonts-veinals.mjs):
   el directori públic amb huit columnes explícites i la RPC del Mur públic, sempre per GET anònim fitat. Un
   backend simulat amb fetch fals: cap xarxa ni credencial real. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COLUMNES_DIRECTORI, llegixDirectori, llegixMurPublic, MAX_ENTITATS, MOTIUS_D_EXCLUSIO, projectaEntitat} from './fonts-veinals.mjs';
import {CAP_SOCIAL_BASE} from '../../src/config/imatgeSocial.js';
import {metadadesDePerfil, rutaPublicaDePerfil} from '../../src/config/metadadesDePerfil.js';
import {perfilDOrganitzacio} from '../../src/data/supabase/perfils.js';

const SUPABASE = 'https://exemple.supabase.co';
const TENANT = '11111111-1111-4111-8111-111111111111';
const ENTORN = Object.freeze({supabaseUrl: SUPABASE, anonKey: 'clau-anon-de-prova', tenantId: TENANT});
const OPCIONS = Object.freeze({origen: 'https://socdepoble.org', supabaseUrl: SUPABASE, permesos: []});
const CAMPS = ['sectionId', 'id', 'slug', 'tipus', 'visibility', 'status', 'title', 'description', 'image', 'imageAlt'];
const uuid = n => `c0c1d2e3-f405-4a16-8b27-${String(n).padStart(12, '0')}`;
const fila = (n, extra = {}) => ({id: uuid(n), slug: `entitat-${n}`, name: `Entitat ${n}`, kind: 'company', lema: `Lema ${n}`, description: null, logo_url: null, hero_url: null, ...extra});
const json = (cos, status = 200) => new Response(JSON.stringify(cos), {status, headers: {'content-type': 'application/json'}});
const lectura = fetchImpl => ({fetchImpl, termini: 5000, maxResposta: 16 * 1024 * 1024, pausa: async () => {}});
const PORTADA = `sdp-media://mitjans/${TENANT}/22222222-2222-4222-8222-222222222222/organitzacions/portada.webp`;
const URL_PORTADA = `${SUPABASE}/storage/v1/object/public/mitjans/${TENANT}/22222222-2222-4222-8222-222222222222/organitzacions/portada.webp`;

function directori(files) {
  const crides = [];
  const fetchImpl = async (href, opcions) => {
    const url = new URL(href); crides.push({url, opcions});
    const limit = Number(url.searchParams.get('limit')), offset = Number(url.searchParams.get('offset'));
    return json(files.slice(offset, offset + limit));
  };
  return {crides, fetchImpl};
}

test('llegixDirectori: GET anònim amb les huit columnes explícites, la població, l’ordre per antiguitat i pàgines de 100', async () => {
  const {crides, fetchImpl} = directori(Array.from({length: 230}, (_, i) => fila(i)));
  const {files, tallat, peticions} = await llegixDirectori(ENTORN, lectura(fetchImpl));
  assert.deepEqual([files.length, tallat, peticions, crides.length], [230, false, 3, 3]);
  for (const {url, opcions} of crides) {
    assert.equal(url.origin + url.pathname, `${SUPABASE}/rest/v1/organization_directory`);
    assert.equal(url.searchParams.get('select'), 'id,slug,name,kind,lema,description,logo_url,hero_url');
    assert.equal(url.searchParams.get('tenant_id'), `eq.${TENANT}`);
    assert.equal(url.searchParams.get('order'), 'created_at.asc,id.asc');
    assert.equal(url.searchParams.get('limit'), '100');
    assert.deepEqual([opcions.method, opcions.redirect, opcions.body], ['GET', 'error', undefined]);
    assert.deepEqual([opcions.headers.apikey, opcions.headers.Authorization], [ENTORN.anonKey, `Bearer ${ENTORN.anonKey}`]);
    assert.ok(opcions.signal);
  }
  assert.deepEqual(crides.map(c => c.url.searchParams.get('offset')), ['0', '100', '200']);
  assert.deepEqual([...COLUMNES_DIRECTORI], ['id', 'slug', 'name', 'kind', 'lema', 'description', 'logo_url', 'hero_url']);
  for (const prohibida of ['*', 'correu_public', 'presentacio_html', 'town_name', 'tenant_id', 'parent_organization_id', 'hero_video_url', 'created_at', 'updated_at']) {
    assert.ok(!COLUMNES_DIRECTORI.includes(prohibida), prohibida);
  }
});

test('llegixDirectori: la fila 501 no és cap error: tallat, les 500 més antigues dins', async () => {
  const {crides, fetchImpl} = directori(Array.from({length: 501}, (_, i) => fila(i)));
  const {files, tallat} = await llegixDirectori(ENTORN, lectura(fetchImpl));
  assert.deepEqual([files.length, tallat, MAX_ENTITATS], [500, true, 500]);
  assert.deepEqual([files[0].id, files.at(-1).id], [uuid(0), uuid(499)]);
  assert.deepEqual(crides.at(-1).url.searchParams.get('limit'), '1');
  // Exactament 500: cap tall.
  const justes = directori(Array.from({length: 500}, (_, i) => fila(i)));
  assert.equal((await llegixDirectori(ENTORN, lectura(justes.fetchImpl))).tallat, false);
});

test('llegixDirectori: un 401, un 5xx repetit, un JSON trencat o una forma inesperada són error; només es reintenta el transitori', async () => {
  const casos = [
    [() => json({message: 'permission denied'}, 401), /HTTP 401 en llegir el directori públic/, 1],
    [() => json('', 503), /HTTP 503/, 2],
    [() => Promise.reject(new TypeError('fetch failed')), /fetch failed/, 2],
    [() => new Response('[{"id":', {headers: {'content-type': 'application/json'}}), /JSON/, 1],
    [() => new Response('<html>', {headers: {'content-type': 'text/html'}}), /sense JSON/, 1],
    [() => json({no: 'llista'}), /format inesperat/, 1],
    [() => json(['text']), /format inesperat/, 1],
    [() => json(Array.from({length: 101}, (_, i) => fila(i))), /format inesperat/, 1]
  ];
  for (const [resposta, motiu, intents] of casos) {
    let n = 0;
    await assert.rejects(llegixDirectori(ENTORN, lectura(async () => { n += 1; return resposta(); })), motiu);
    assert.equal(n, intents, String(motiu));
  }
  let volta = 0;
  const {files} = await llegixDirectori(ENTORN, lectura(async () => ((volta += 1) === 1 ? json('', 429) : json([fila(1)]))));
  assert.equal(files.length, 1);
  // La clau no ix mai a l'error, ni l'URL.
  await assert.rejects(llegixDirectori(ENTORN, lectura(async () => json({}, 500))), error => !error.message.includes(ENTORN.anonKey) && !error.message.includes(SUPABASE));
});

test('projectaEntitat: exactament deu camps; res del que la fila porta de més es copia enlloc', () => {
  const injectada = {...fila(1, {lema: 'Continuem treballant', hero_url: PORTADA}), correu_public: 'privat@exemple.org', presentacio_html: '<p>COS_SENCER</p>',
    tenant_id: TENANT, parent_organization_id: uuid(99), town_name: 'NO_EXPORTAR_POBLE', created_at: '2026-01-01', hero_video_url: 'sdp-media://mitjans/x.mp4'};
  const {element} = projectaEntitat(injectada, OPCIONS);
  assert.deepEqual(Object.keys(element), CAMPS);
  assert.deepEqual(element, {sectionId: 'perfil', id: uuid(1), slug: 'entitat-1', tipus: 'entitat', visibility: 'public', status: 'published',
    title: 'Entitat 1', description: 'Continuem treballant', image: URL_PORTADA, imageAlt: 'Entitat 1'});
  assert.ok(!/privat@|COS_SENCER|NO_EXPORTAR|2026-01-01|\.mp4/.test(JSON.stringify(element)));
  // Un grup és un grup; un id amb majúscules ix en minúscules.
  assert.equal(projectaEntitat(fila(2, {kind: 'group'}), OPCIONS).element.tipus, 'grup');
  assert.equal(projectaEntitat(fila(3, {id: uuid(3).toUpperCase()}), OPCIONS).element.id, uuid(3));
});

test('projectaEntitat: buida, amb imatge i sense text, i el lema que no es pot usar', () => {
  // Només nom: no es prerenderitza.
  assert.deepEqual(projectaEntitat(fila(1, {lema: null}), OPCIONS), {motiu: 'buida'});
  assert.deepEqual(projectaEntitat(fila(1, {lema: '   ', description: ''}), OPCIONS), {motiu: 'buida'});
  // Amb imatge i sense text: la descripció de reserva.
  assert.equal(projectaEntitat(fila(1, {lema: null, logo_url: PORTADA}), OPCIONS).element.description, CAP_SOCIAL_BASE.description);
  // Un lema amb un contacte no s'usa (no es muta): es passa a la descripció; si tampoc, i sense imatge, buida.
  const avisos = {};
  for (const contacte of ['Truca al 965 123 456', 'info@forn.cat', 'https://forn.cat', 'wa.me/34666555444', `id ${uuid(7)}`]) {
    assert.equal(projectaEntitat(fila(1, {lema: contacte, description: 'Pa de llenya'}), OPCIONS, avisos).element.description, 'Pa de llenya', contacte);
    assert.deepEqual(projectaEntitat(fila(1, {lema: contacte}), OPCIONS), {motiu: 'buida'}, contacte);
  }
  assert.equal(avisos.lemaAmbContacte, 5);
  assert.equal(projectaEntitat(fila(1, {lema: 'Pa de llenya', description: 'Truca al 965 123 456'}), OPCIONS, avisos).element.description, 'Pa de llenya');
  assert.equal(avisos.descripcioAmbContacte, 1);
  // El lema mana sobre la descripció, com al client.
  assert.equal(projectaEntitat(fila(1, {lema: 'El lema', description: 'La descripció'}), OPCIONS).element.description, 'El lema');
});

test('projectaEntitat: el nom amb contacte, la suplantació, un possible secret i la forma, cada un amb el seu motiu', () => {
  assert.deepEqual(projectaEntitat(fila(1, {name: 'Forn 965 123 456'}), OPCIONS), {motiu: 'contacteAlNom'});
  assert.deepEqual(projectaEntitat(fila(1, {name: 'forn@exemple.org'}), OPCIONS), {motiu: 'contacteAlNom'});
  for (const name of ['Sóc de Poble', 'IAIA MarIA', 'iaia maria', 'Javi Llinares', 'Ajuntament de la Torre']) assert.deepEqual(projectaEntitat(fila(1, {name}), OPCIONS), {motiu: 'suplantacio'}, name);
  assert.equal(projectaEntitat(fila(1, {name: 'Ajuntament de la Torre', kind: 'city_hall'}), OPCIONS).element.title, 'Ajuntament de la Torre');
  // L'entitat pilot de veres (id declarat a la llavor) passa amb el seu nom.
  assert.equal(projectaEntitat({...fila(1), id: 'a240e870-4aef-4d92-b138-e8b4e2f2123a', slug: 'socdepoble', name: 'Sóc de Poble'}, OPCIONS).element.slug, 'socdepoble');
  assert.deepEqual(projectaEntitat(fila(1, {lema: 'clau sb_' + 'secret_abcdefghijklmnopqrstuvwxyz'}), OPCIONS), {motiu: 'secrets'});
  // Els caràcters de format se'n van del nom.
  assert.equal(projectaEntitat(fila(1, {name: 'For‮n​ Nou'}), OPCIONS).element.title, 'Forn Nou');
  for (const dolenta of [null, 'text', [], {...fila(1), id: 'no-uuid'}, {...fila(1), name: 7}, {...fila(1), name: '   '}, {...fila(1), kind: 'persona'},
    {...fila(1), slug: 'Amb Majúscules'}, {...fila(1), slug: 'a'.repeat(161)}, {...fila(1), lema: {text: 'x'}}, {...fila(1), hero_url: 9}]) {
    assert.deepEqual(projectaEntitat(dolenta, OPCIONS), {motiu: 'forma'}, JSON.stringify(dolenta));
  }
  for (const motiu of ['forma', 'secrets', 'contacteAlNom', 'suplantacio', 'buida']) assert.ok(MOTIUS_D_EXCLUSIO.includes(motiu));
});

test('projectaEntitat: la imatge, només del bucket públic; qualsevol altra és com si no n’hi haguera (mai bloquejada)', () => {
  const avisos = {};
  for (const ref of ['/assets/uploads/brain/iaia_maria_avatar.webp', 'https://tercers.example/logo.png', 'sdp-media://mitjans_privats/a/dni.webp',
    `${SUPABASE}/storage/v1/object/sign/mitjans/a/b.webp?token=abc`, `${SUPABASE}/storage/v1/object/public/avatars/u1.png`,
    `${SUPABASE}/storage/v1/object/public/chat_attachments/x.jpg`, `${SUPABASE}/storage/v1/render/image/public/mitjans/a/b.webp`,
    'https://altre.supabase.co/storage/v1/object/public/mitjans/a/b.webp', 'data:image/png;base64,AAAA', 'javascript:alert(1)']) {
    const {element} = projectaEntitat(fila(1, {hero_url: ref}), OPCIONS, avisos);
    assert.deepEqual([element.image, element.imageAlt], [null, ''], ref);
  }
  assert.equal(avisos.imatgeForaDelBucket, 10);
  // La portada mana; sense portada, el logotip; la URL pública del mateix bucket també val.
  assert.equal(projectaEntitat(fila(1, {logo_url: PORTADA.replace('portada', 'logo'), hero_url: PORTADA}), OPCIONS).element.image, URL_PORTADA);
  assert.equal(projectaEntitat(fila(1, {logo_url: PORTADA}), OPCIONS).element.image, URL_PORTADA);
  assert.equal(projectaEntitat(fila(1, {hero_url: URL_PORTADA}), OPCIONS).element.image, URL_PORTADA);
  // Un SVG del bucket no es pot servir: sense imatge (i un avís), mai una porta roja.
  const svg = {};
  assert.equal(projectaEntitat(fila(1, {hero_url: PORTADA.replace('.webp', '.svg')}), OPCIONS, svg).element.image, null);
  assert.equal(svg.imatgeNoServible, 1);
  // Sense l'URL de Supabase no es pot fer absoluta: sense imatge.
  assert.equal(projectaEntitat(fila(1, {hero_url: PORTADA}), {origen: OPCIONS.origen, permesos: []}).element.image, null);
});

test('projectaEntitat: un slug reservat pel paquet o amb forma d’UUID no és clau: la fitxa ix només pel seu id', () => {
  const avisos = {};
  for (const slug of ['javi', 'iaia-maria', 'iaia', 'soc-de-poble', 'rentonar']) assert.equal(projectaEntitat(fila(1, {slug}), OPCIONS, avisos).element.slug, null, slug);
  assert.equal(avisos.slugNoClau, 5);
  assert.equal(projectaEntitat(fila(1, {slug: null}), OPCIONS).element.slug, null);
});

test('llegixMurPublic: la RPC per GET, el cursor amb els dos camps junts, cinc pàgines com a molt i la forma validada', async () => {
  const totes = Array.from({length: 450}, (_, i) => ({id: uuid(i), section_id: 'mur', title: `P${i}`, description: 'd', public_content: 'c', created_at: new Date(Date.UTC(2026, 10, 12) - i * 1000).toISOString()}));
  const crides = [];
  const fetchImpl = async (href, opcions) => {
    const url = new URL(href); crides.push({url, opcions});
    const abans = url.searchParams.get('p_before_id');
    const inici = abans === null ? 0 : totes.findIndex(f => f.id === abans) + 1;
    return json(totes.slice(inici, inici + 200));
  };
  const {files, tallat, peticions} = await llegixMurPublic(ENTORN, lectura(fetchImpl));
  assert.deepEqual([files.length, tallat, peticions], [450, false, 3]);
  for (const {url, opcions} of crides) {
    assert.equal(url.origin + url.pathname, `${SUPABASE}/rest/v1/rpc/llig_mur_public`);
    assert.deepEqual([url.searchParams.get('p_tenant_id'), url.searchParams.get('p_limit'), opcions.method, opcions.body], [TENANT, '200', 'GET', undefined]);
    assert.equal(url.searchParams.has('p_before_created_at'), url.searchParams.has('p_before_id'));
  }
  assert.deepEqual([crides[1].url.searchParams.get('p_before_created_at'), crides[1].url.searchParams.get('p_before_id')], [totes[199].created_at, totes[199].id]);
  // Cinc pàgines plenes: tallat, i la sisena no es demana.
  let n = 0;
  const sempre = async href => { n += 1; const k = Number(new URL(href).searchParams.get('p_before_id')?.slice(-6) ?? -1); return json(Array.from({length: 200}, (_, i) => ({...totes[0], id: uuid(k + 1 + i)}))); };
  const tallada = await llegixMurPublic(ENTORN, lectura(sempre));
  assert.deepEqual([tallada.files.length, tallada.tallat, n], [1000, true, 5]);
  for (const dolenta of [{no: 'llista'}, [{...totes[0], id: 'no-uuid'}], [{...totes[0], created_at: ''}], [{...totes[0], title: 7}], Array.from({length: 201}, () => totes[0])]) {
    await assert.rejects(llegixMurPublic(ENTORN, lectura(async () => json(dolenta))), /format inesperat/);
  }
  await assert.rejects(llegixMurPublic(ENTORN, lectura(async () => json({code: 'PGRST202'}, 404))), /HTTP 404 en llegir el Mur públic/);
});

/* Paritat client i build: la fitxa que pinta l'app d'una fila del directori (perfilDOrganitzacio, amb select=*) i el
   head que en fa el client (metadadesDePerfil) diuen el mateix que l'element que projecta el build amb huit columnes. */
test('paritat: projectaEntitat diu el mateix que metadadesDePerfil sobre la fitxa del client (perfilDOrganitzacio)', () => {
  const LOGO = PORTADA.replace('portada', 'logo');
  const filaSencera = {id: uuid(1), tenant_id: TENANT, slug: 'olidelatorre-de-prova', name: 'Oli de prova', kind: 'company', parent_organization_id: null,
    lema: 'Continuem treballant perquè arribe a la vostra taula el millor oli d’oliva.', description: 'Almàssera familiar', created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z', logo_url: LOGO, hero_url: PORTADA, presentacio_html: '<p>Cos</p>', copyright: '', town_name: 'La Torre de les Maçanes', correu_public: null, hero_video_url: null};
  for (const fila of [filaSencera, {...filaSencera, hero_url: null}, {...filaSencera, lema: null}, {...filaSencera, kind: 'group'}, {...filaSencera, kind: 'entity', logo_url: null}]) {
    const client = perfilDOrganitzacio(fila);
    const meta = metadadesDePerfil(client, OPCIONS);
    const {element} = projectaEntitat(fila, OPCIONS);
    assert.deepEqual({title: element.title, description: element.description, image: element.image, imageAlt: element.imageAlt},
      {title: meta.title, description: meta.description, image: meta.image?.url ?? null, imageAlt: meta.image?.alt ?? ''});
    assert.deepEqual([element.tipus, element.id, element.slug], [client.tipus, client.id, client.slug]);
    assert.equal(rutaPublicaDePerfil({tipus: element.tipus, id: element.id, slug: element.slug}), rutaPublicaDePerfil(client));
  }
});
