/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · La Porta de cobertura social del Router: l'extractor
   (rutes-del-router.mjs), les lleis (cobertura-router.mjs), les exempcions (exempcions-socials.mjs) i la porta
   (tooling/gates/tractor-cobertura-social.mjs), sobre l'arbre de veres i amb MUTANTS: cada un ha de ser roig. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {coberturaDelRouter, rutesJutjables} from './cobertura-router.mjs';
import {CLASSES_D_EXEMPCIO, EXEMPCIONS_SOCIALS} from './exempcions-socials.mjs';
import {extrauRutes, FITXERS_AMB_ROUTES, patroARegex, rutaQueServix} from './rutes-del-router.mjs';
import {camisServits} from './prerender-social.mjs';
import {cobertura, FITXES_SINTETIQUES} from '../gates/tractor-cobertura-social.mjs';

const projectRoot = process.env.SDP_PROJECT_ROOT || process.cwd();
const PORTA = path.join(projectRoot, 'tooling/gates/tractor-cobertura-social.mjs');
const base = await cobertura({root: projectRoot});

test('extractor sobre l’arbre de veres: cap ruta sense resoldre, les de path calculat, les apps, les redireccions i les seccions de detall', () => {
  const {router} = base;
  assert.deepEqual(router.infraccions, []);
  assert.deepEqual(router.fitxers, Object.keys(FITXERS_AMB_ROUTES));
  const patrons = router.rutes.map(r => r.patro);
  // Les quatre de path calculat (el tractor de rutes web d'abans no les veia).
  for (const ruta of ['/javillinares', '/socdepoble', '/rentonar', '/iaia']) assert.ok(patrons.includes(ruta), ruta);
  assert.deepEqual(router.rutes.filter(r => ['/javillinares', '/socdepoble', '/rentonar'].includes(r.patro)).map(r => r.props.id), ['javillinares', 'socdepoble', 'rentonar']);
  // Les sis apps, expandides dels seus manifests, sota el contenidor /app/*.
  assert.deepEqual(router.apps.map(a => `${a.id}:${a.veure}`), ['bar:public', 'genealogia:public', 'gestoria:public', 'lector:public', 'nevera:public', 'salut:public']);
  for (const app of router.apps) assert.ok(patrons.includes(`/app/${app.id}/*`), app.id);
  // Les famílies de la fitxa pública, del Router.
  assert.deepEqual(router.families, ['perfil', 'gent', 'empresa', 'entitats', 'ajuntament', 'grup']);
  // Les redireccions i el seu destí estàtic, deduïts del codi.
  const desti = Object.fromEntries(router.rutes.filter(r => r.redireccio).map(r => [r.patro, r.redireccio.desti]));
  assert.deepEqual({esdeveniments: desti['/esdeveniments'], panell: desti['/panell'], realitat: desti['/realitat'], ia: desti['/ia'], skills: desti['/skills'], wiki: desti['/wiki'],
    descarregues: desti['/descarregues'], avisador: desti['/app/avisador'], login: desti['/login'], chat: desti['/chat'], multimedia: desti['/multimedia/:itemId/*']},
  {esdeveniments: '/calendari', panell: '/control', realitat: '/iaia', ia: '/anima', skills: '/wikidepoble', wiki: '/wikidepoble',
    descarregues: '/page/descarregues', avisador: '/page/avisador', login: null, chat: null, multimedia: null});
  // Les guardes de sessió, les condicionals de build i les seccions del detall genèric.
  assert.deepEqual(router.rutes.filter(r => r.guarda).map(r => [r.patro, r.rol]), [['/admin/*', 'superadmin'], ['/el-meu-perfil', null]]);
  assert.deepEqual(router.rutes.filter(r => r.condicional).map(r => r.patro), ['/page/avisador', '/app/avisador']);
  assert.equal(router.seccionsDeDetall.length, 13);
  assert.ok(router.privades.includes('perfil') && router.privades.includes('utilitats') && router.privades.length >= 20);
  // La semàntica del Router: guanya el primer fill que casa; exacte sense «*»; distingix majúscules.
  const servix = cami => rutaQueServix(router.rutes, cami)?.patro;
  assert.deepEqual(['/empresa/olidelatorre', '/rentonar', '/app', '/app/bar/caixa', '/mur/x', '/page/a/b', '/admin/x/y', '/multimedia/x', '/PROJECTE', '/res/de/res'].map(servix),
    ['/empresa/:agentId', '/rentonar', '/app/*', '/app/bar/*', '/:sectionId/:itemId', '/page/:slug/:itemSlug', '/admin/*', '/multimedia/:itemId/*', '/*', '/*']);
  assert.ok(patroARegex('/perfil/:agentId').test('/perfil/x') && !patroARegex('/perfil/:agentId').test('/perfil/x/y') && !patroARegex('/perfil').test('/Perfil'));
});

test('la Porta sobre l’arbre de veres és verda, i diu les exemptes, les pendents i la diferència de les dos llistes privades', () => {
  const {resultat, router} = base;
  assert.deepEqual(resultat.infraccions, []);
  // Cada ruta jutjable és coberta o exempta, mai les dos.
  const cobertes = new Set(resultat.cobertes.map(c => c.ruta)), exemptes = new Set([...resultat.exemptes, ...resultat.pendents].map(e => e.ruta));
  for (const ruta of rutesJutjables(router)) assert.equal(cobertes.has(ruta.patro) !== exemptes.has(ruta.patro), true, ruta.patro);
  // La regressió d'este P0: les sis famílies, les quatre adreces netes, el directori i les verticals són cobertes.
  for (const ruta of ['/perfil/:agentId', '/gent/:agentId', '/empresa/:agentId', '/entitats/:agentId', '/ajuntament/:agentId', '/grup/:agentId',
    '/javillinares', '/socdepoble', '/rentonar', '/iaia', '/perfil', '/mapa', '/vehicle', '/animalets', '/treball', '/habitatge', '/esdeveniments', '/wiki', '/skills', '/ia', '/realitat']) {
    assert.ok(cobertes.has(ruta), ruta);
  }
  assert.deepEqual(resultat.pendents.map(e => e.ruta).sort(), ['/animalets/:itemId', '/calendari/:itemId', '/habitatge/:itemId', '/mapa/:itemId', '/page/:slug/:itemSlug',
    '/page/avisador', '/page/la-iaia-sabuda', '/page/node-zero', '/page/notes_shared', '/page/tot-el-que-pots-fer', '/receptes/:itemId', '/treball/:itemId', '/vehicle/:itemId']);
  for (const pendent of resultat.pendents) assert.ok(pendent.revisio, pendent.ruta);
  assert.deepEqual(resultat.diferenciaDePrivades, ['accedir', 'admin', 'control-xat', 'crear-compte', 'el-meu-perfil', 'entrar', 'utilitats']);
  for (const exempcio of EXEMPCIONS_SOCIALS) {
    assert.ok(CLASSES_D_EXEMPCIO.includes(exempcio.classe) && exempcio.motiu.trim().length >= 20 && Object.isFrozen(exempcio), exempcio.ruta);
    assert.ok(!/\*\*|\?|\(/.test(exempcio.ruta), `${exempcio.ruta}: cap comodí propi`);
  }
  // Les 35 claus de PAGE_COPY (IDEA-287: la guia pas a pas) i les de PAGE_ROUTE_MAP tenen entrada, àlies o exempció per instància.
  assert.ok(base.instancies >= 35 + 10 + 15);
});

/* ── Mutants de les lleis: sobre les dades de l'arbre de veres, canviades en memòria ─────────────────── */
const copia = valor => structuredClone(valor);
async function aplica(muta) {
  const {router, manifest} = base;
  const dades = {router: copia(router), manifest: copia(manifest), exempcions: EXEMPCIONS_SOCIALS.map(e => ({...e})), instancies: [], redireccionsDePagina: {'/page/dispositius': '/dispositius',
    '/page/guia': '/page/tot-el-que-pots-fer', '/page/iaia-sabuda': '/page/la-iaia-sabuda', '/page/nodrir-la-iaia': '/page/la-iaia-sabuda'}, servidor: ['perfil', 'notes', 'xat'], sintetic: undefined};
  for (const cami of ['/page/dispositius', '/page/guia', '/page/iaia-sabuda', '/page/nodrir-la-iaia', '/page/la-iaia-sabuda', '/page/node-zero', '/page/notes_shared', '/page/projecte', '/page/tot-el-que-pots-fer']) dades.instancies.push({cami, familia: '/page/:slug'});
  muta(dades);
  const client = new Set(dades.router.privades);
  const indexable = cami => !client.has(String(cami).replace(/^\/+/, '').split(/[/?#]/)[0]);
  return coberturaDelRouter({router: dades.router, manifest: dades.manifest, camins: camisServits(dades.manifest), exempcions: dades.exempcions, indexable,
    privades: {client: [...client], servidor: dades.servidor}, universos: {instancies: dades.instancies, redireccionsDePagina: dades.redireccionsDePagina}, sintetic: dades.sintetic});
}
const roig = (resultat, llei, motiu) => assert.ok(resultat.infraccions.some(i => i.llei === llei && motiu.test(i.detall)), `${llei} ${motiu}: ${JSON.stringify(resultat.infraccions)}`);
const novaRuta = (router, patro, extra = {}) => router.rutes.splice(router.rutes.findIndex(r => r.patro === '/:sectionId/:itemId'), 0,
  {patro, component: 'Nova', props: {}, guarda: false, rol: null, condicional: false, redireccio: null, fitxer: 'src/app/App.jsx', funcio: 'ActorRoutes',
    ordre: 999, muntador: router.rutes.find(r => r.patro === '/xat').muntador, comodi: false, contenidor: false, contenidorPur: false, ...extra});

test('el control: sense cap mutació, les dades en memòria són verdes', async () => {
  assert.deepEqual((await aplica(() => {})).infraccions, []);
});

test('S1 · una ruta nova sense cobertura ni exempció és roja; coberta i exempta alhora, també', async () => {
  roig(await aplica(d => novaRuta(d.router, '/botiga')), 'S1', /\/botiga: ni OpenGraph específic ni exempció declarada/);
  roig(await aplica(d => novaRuta(d.router, '/fira/:id')), 'S1', /\/fira\/:id/);
  roig(await aplica(d => d.exempcions.push({ruta: '/mur', classe: 'pendent', revisio: 'R99', motiu: 'Una exempció de més per a una ruta que ja té head.'})), 'S1', /\/mur: coberta .* i exempta alhora/);
  // Llevar una exempció deixa la ruta al descobert.
  roig(await aplica(d => { d.exempcions = d.exempcions.filter(e => e.ruta !== '/xat'); }), 'S1', /\/xat: ni OpenGraph/);
  // El productor desconnectat de veres: sense cap camí d'una família, la família és roja.
  roig(await aplica(d => { for (const cami of Object.keys(d.manifest.aliases)) if (cami.startsWith('/empresa/')) delete d.manifest.aliases[cami]; }), 'S1', /\/empresa\/:agentId: ni OpenGraph/);
});

test('S2 · una exempció que ja no casa amb el Router, un motiu curt, una classe que el codi no confirma', async () => {
  roig(await aplica(d => d.exempcions.push({ruta: '/ja-no-existix', classe: 'pendent', revisio: 'R23', motiu: 'Una ruta que el Router ja no té declarada.'})), 'S2', /no casa amb cap ruta viva/);
  roig(await aplica(d => { d.exempcions.find(e => e.ruta === '/xat').motiu = 'curt'; }), 'S2', /20 caràcters/);
  roig(await aplica(d => { delete d.exempcions.find(e => e.ruta === '/page/avisador').revisio; }), 'S2', /'pendent' exigix una revisió/);
  // 'eina' per a una ruta indexable; 'sessio' sense RequireAuth; 'portada' fora de «/»; 'plataforma' fora de /app.
  roig(await aplica(d => { novaRuta(d.router, '/botiga'); d.exempcions.push({ruta: '/botiga', classe: 'eina', motiu: 'Una botiga pública que algú vol amagar com a eina.'}); }), 'S2', /'eina' exigix un primer tram sense indexar/);
  roig(await aplica(d => { novaRuta(d.router, '/botiga'); d.exempcions.push({ruta: '/botiga', classe: 'sessio', motiu: 'Una botiga pública que algú declara de sessió.'}); }), 'S2', /'sessio' exigix una ruta amb RequireAuth/);
  roig(await aplica(d => { novaRuta(d.router, '/botiga'); d.exempcions.push({ruta: '/botiga', classe: 'portada', motiu: 'Una botiga pública que algú declara portada.'}); }), 'S2', /'portada' només val/);
  roig(await aplica(d => { novaRuta(d.router, '/botiga'); d.exempcions.push({ruta: '/botiga', classe: 'plataforma', motiu: 'Una botiga pública que algú declara plataforma.'}); }), 'S2', /'plataforma' és/);
  roig(await aplica(d => { novaRuta(d.router, '/botiga'); d.exempcions.push({ruta: '/botiga', classe: 'secreta', motiu: 'Una classe que no existix a la taula de classes.'}); }), 'S2', /classe desconeguda/);
  // 'redireccio': sense component de redirecció, sense destí, o amb un destí que no és el del codi.
  roig(await aplica(d => { novaRuta(d.router, '/botiga'); d.exempcions.push({ruta: '/botiga', classe: 'redireccio', desti: '/control', motiu: 'Una botiga que no redirigix enlloc de veres.'}); }), 'S2', /exigix un component de redirecció/);
  roig(await aplica(d => { d.exempcions.find(e => e.ruta === '/panell').desti = '/xat'; }), 'S2', /el destí declarat \(\/xat\) no és el del codi \(\/control\)/);
  roig(await aplica(d => { delete d.exempcions.find(e => e.ruta === '/login').desti; }), 'S2', /exigix el destí declarat/);
  roig(await aplica(d => d.exempcions.push({...d.exempcions.find(e => e.ruta === '/xat')})), 'S2', /repetida/);
  // Una exempció per instància només val per a una instància que visca al repositori.
  roig(await aplica(d => d.exempcions.push({ruta: '/page/inventada', classe: 'pendent', revisio: 'R23', motiu: 'Una pàgina que no és a PAGE_COPY ni enlloc.'})), 'S2', /instància que visca al repositori/);
});

test('S3 · una ruta amb sessió al manifest, un tram sense indexar com a ruta indexable i les dos llistes privades', async () => {
  roig(await aplica(d => { d.manifest.routes['/el-meu-perfil'] = {...d.manifest.routes['/projecte'], canonical: 'https://socdepoble.org/el-meu-perfil'}; }), 'S3', /\/el-meu-perfil: un camí servit casa amb una ruta amb sessió/);
  roig(await aplica(d => { d.manifest.routes['/admin/usuaris'] = {...d.manifest.routes['/projecte'], canonical: 'https://socdepoble.org/admin/usuaris'}; }), 'S3', /ruta amb sessió/);
  roig(await aplica(d => { d.manifest.routes['/notes'] = {...d.manifest.routes['/projecte'], canonical: 'https://socdepoble.org/notes'}; }), 'S3', /\/notes: el primer tram no és indexable/);
  // /perfil sense les dos marques (indexable) és roig; amb elles, verd (el control).
  roig(await aplica(d => { d.manifest.routes['/perfil'].index = true; delete d.manifest.routes['/perfil'].compartible; }), 'S3', /\/perfil: el primer tram no és indexable/);
  roig(await aplica(d => { d.servidor.push('tractors-nous'); }), 'S3', /«tractors-nous» és sense indexar al servidor/);
});

test('S4 · una infracció de l’extractor, una secció de detall nova i una app sense fila', async () => {
  roig(await aplica(d => d.router.infraccions.push({llei: 'S4', detall: 'src/app/App.jsx:1: path no resoluble'})), 'S4', /path no resoluble/);
  // Una clau nova a buildDetailSectionMeta: una família de detall sense classificar.
  roig(await aplica(d => d.router.seccionsDeDetall.push('fira')), 'S1', /\/fira\/:itemId: ni OpenGraph/);
  // Una app nova amb veure 'public' i sense fila.
  roig(await aplica(d => { d.router.apps.push({id: 'botiga', veure: 'public'}); d.router.rutes.push({...d.router.rutes.find(r => r.patro === '/app/bar/*'), patro: '/app/botiga/*', ordre: 1000}); }), 'S4', /\/app\/botiga\/\*: una app sense fila/);
});

test('S5 i S6 · un camí que el Router enviaria a la 404 i un head que no és específic', async () => {
  roig(await aplica(d => { d.manifest.routes['/a/b/c'] = {...d.manifest.routes['/projecte'], canonical: 'https://socdepoble.org/a/b/c'}; }), 'S5', /\/a\/b\/c: el Router no el servix/);
  roig(await aplica(d => { d.manifest.routes['/fira/nadal'] = {...d.manifest.routes['/projecte'], canonical: 'https://socdepoble.org/fira/nadal'}; }), 'S5', /\/fira\/nadal/);
  roig(await aplica(d => { Object.assign(d.manifest.routes['/mapa'], {title: 'Sóc de Poble', description: 'Portal de pobles connectats'}); }), 'S6', /\/mapa: el títol i la descripció són els genèrics/);
  roig(await aplica(d => { d.manifest.routes['/mapa'].description = ' '; }), 'S6', /\/mapa: sense descripció/);
  roig(await aplica(d => { d.manifest.routes['/mapa'].image = {url: '/assets/x.png'}; }), 'S6', /\/mapa: sense imatge absoluta/);
  roig(await aplica(d => { d.manifest.routes['/mapa'].canonical = 'https://socdepoble.org/altra'; }), 'S6', /\/mapa: l'adreça de l'entrada/);
});

test('S7 · el generador de perfils desconnectat: el snapshot sintètic no dona el camí del slug ni el de l’id', async () => {
  const fitxes = FITXES_SINTETIQUES.map(({slug, id}) => ({slug, id}));
  // Amb el productor connectat (el manifest sintètic de veres), verd.
  assert.deepEqual(base.resultat.infraccions.filter(i => i.llei === 'S7'), []);
  // Desconnectat: el manifest «sintètic» és el de sense snapshot.
  const r = await aplica(d => { d.sintetic = {camins: camisServits(d.manifest), fitxes}; });
  roig(r, 'S7', /\/empresa\/entitat-sintetica-de-la-porta: el productor no dona el camí/);
  roig(r, 'S7', /\/gent\/aaaaaaaa-0000-4000-8000-000000000002/);
  assert.equal(r.infraccions.filter(i => i.llei === 'S7').length, 6 * 2 * 2);
});

test('S8 i S9 · una clau nova a PAGE_COPY sense entrada ni exempció, i una redirecció exempta a una ruta coberta', async () => {
  roig(await aplica(d => d.instancies.push({cami: '/page/pagina-nova', familia: '/page/:slug'})), 'S8', /\/page\/pagina-nova: una instància de \/page\/:slug sense head social/);
  roig(await aplica(d => { delete d.manifest.aliases['/page/projecte']; }), 'S8', /\/page\/projecte/);
  // /esdeveniments redirigix a /calendari, que és coberta: ha de ser un àlies, no una exempció.
  roig(await aplica(d => { delete d.manifest.aliases['/esdeveniments']; d.exempcions.push({ruta: '/esdeveniments', classe: 'redireccio', desti: '/calendari', motiu: 'Àlies vell del calendari, declarat com a exempció.'}); }),
    'S9', /exempció \/esdeveniments: el destí \/calendari és una ruta coberta/);
});

/* ── Mutants de l'extractor: arbres menuts de prova, amb el Router escrit a posta ───────────────────── */
function arbre(t, fitxers) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-router-')); t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  for (const [rel, text] of Object.entries(fitxers)) { fs.mkdirSync(path.dirname(path.join(root, rel)), {recursive: true}); fs.writeFileSync(path.join(root, rel), text); }
  return root;
}
const app = cos => `import {RUTA_FITXA_IAIA, RUTES_CANONIQUES} from '../config/navigation.js';\nexport default function App(){return <Routes>${cos}<Route path="*" element={<NotFoundPage />} /></Routes>;}`;
const llig = (t, cos, altres = {}) => extrauRutes({root: arbre(t, {'src/app/App.jsx': app(cos), ...altres}), policyRoot: projectRoot});

test('extractor · el que és una ruta ho diu el Router, no el nom de l’etiqueta: un element amb un altre nom i path és una ruta', async t => {
  const {rutes, infraccions} = await llig(t, '<Route path="mur" element={<MurSection />} /><RutaProtegida path="botiga" element={<Botiga />} /><Route index element={<Portada />} />');
  assert.deepEqual(infraccions, []);
  assert.deepEqual(rutes.map(r => [r.patro, r.component]), [['/mur', 'MurSection'], ['/botiga', 'Botiga'], ['/', 'Portada'], ['/*', 'NotFoundPage']]);
});

test('extractor · fail-closed: un atribut escampat, un fragment, una variable, un map desconegut, un path no resoluble i un fill sense path', async t => {
  for (const [cos, motiu] of [
    ['<Route {...ruta} element={<X />} />', /atribut escampat/],
    ['<><Route path="a" element={<X />} /></>', /un fragment com a fill/],
    ['{rutesExtres}', /fora de les formes conegudes \(Identifier\)/],
    ['{llista.map(r => <Route key={r} path={r} element={<X />} />)}', /fora de les formes conegudes \(CallExpression\)/],
    ['{Object.entries(ALTRA_TAULA).map(([clau, ruta]) => <Route key={clau} path={ruta} element={<X />} />)}', /fora de les formes conegudes/],
    ['<Route path={calculaRuta()} element={<X />} />', /path no resoluble/],
    ['<Route path={`${prefix}/x`} element={<X />} />', /path no resoluble/],
    ['<Route element={<X />} />', /sense path ni index/],
    ['{mostra && <Route path="a" element={<X />} />}', /fora de les formes conegudes \(LogicalExpression\)/],
    ['text solt', /text solt/]
  ]) {
    const {infraccions} = await llig(t, cos);
    assert.ok(infraccions.some(i => i.llei === 'S4' && motiu.test(i.detall)), `${cos}: ${JSON.stringify(infraccions)}`);
  }
  // Les formes conegudes: el condicional de build, IDENT.slice(1) i el map sobre RUTES_CANONIQUES.
  const {rutes, infraccions} = await llig(t, `{import.meta.env.X !== '0' ? <Route path="/page/avisador" element={<Avisador />} /> : null}
    {Object.entries(RUTES_CANONIQUES).map(([clau, ruta]) => (<Route key={clau} path={ruta.slice(1)} element={<PerfilPublicSection id={clau} />} />))}
    <Route path={RUTA_FITXA_IAIA.slice(1)} element={<PerfilPublicSection />} /><Route path="gent/:agentId" element={<PerfilPublicSection />} />`);
  assert.deepEqual(infraccions, []);
  assert.deepEqual(rutes.map(r => r.patro), ['/page/avisador', '/javillinares', '/socdepoble', '/rentonar', '/iaia', '/gent/:agentId', '/*']);
  assert.equal(rutes[0].condicional, true);
});

test('extractor · un <Routes> en un fitxer nou és roig fins que es declara; un comentari que el nomena, no', async t => {
  const {infraccions, fitxers} = await llig(t, '<Route path="mur" element={<MurSection />} />', {
    'src/sections/botiga/Botiga.jsx': 'export default function Botiga(){return <Routes><Route path="cistella" element={<Cistella />} /></Routes>;}',
    'src/sections/botiga/notes.js': '/* Açò no és cap <Routes>: només un comentari. */\nexport const res = 1;\n',
    'src/sections/botiga/Botiga.test.jsx': 'test("x", () => render(<Routes><Route path="x" element={<X />} /></Routes>));',
    'src/sections/botiga/__fixtures__/munta.jsx': 'export const munta = () => <Routes><Route path="x" element={<X />} /></Routes>;'
  });
  assert.deepEqual(fitxers, ['src/app/App.jsx', 'src/sections/botiga/Botiga.jsx']);
  assert.ok(infraccions.some(i => /src\/sections\/botiga\/Botiga\.jsx: un fitxer nou amb <Routes>/.test(i.detall)));
  assert.equal(infraccions.filter(i => /fitxer nou/.test(i.detall)).length, 1, 'ni la prova, ni la fixture, ni el comentari');
  // El component Routes importat amb un altre nom muntaria rutes que el lector no veu: roig.
  const amagat = await llig(t, '<Route path="mur" element={<MurSection />} />', {
    'src/sections/botiga/Amagada.jsx': "import { Routes as Taula, Route } from '../../app/contexts/RouterContext';\nexport default function Amagada(){return <Taula><Route path=\"cistella\" element={<Cistella />} /></Taula>;}"
  });
  assert.ok(amagat.infraccions.some(i => /Amagada\.jsx: importa Routes amb un altre nom \(«Taula»\)/.test(i.detall)), JSON.stringify(amagat.infraccions));
});

/* Revisió adversària R22 (14-11-2026) · La Porta es podia esquivar sense renomenar l'import: totes estes formes
   munten rutes que el lector no veia, i la porta quedava VERDA (mutants M3, M4, M5 i M7 sobre l'arbre de veres). */
test('extractor · Routes per altres camins (variable, espai de noms, createElement, barril, export *) és roig; un import i un JSX normals, no', async t => {
  const ROUTER = "'../../app/contexts/RouterContext'";
  for (const [nom, fitxers, motiu] of [
    ['variable', {'src/sections/botiga/Amagada.jsx': `import { Routes, Route } from ${ROUTER};\nconst Encaminador = Routes;\nexport default function Amagada(){return <Encaminador><Route path="cistella" element={<Cistella />} /></Encaminador>;}`},
      /Amagada\.jsx: fa servir Routes com a valor, fora d'un element JSX \(línia 2\)/],
    ['espai de noms', {'src/sections/botiga/Amagada.jsx': `import * as RC from ${ROUTER};\nexport default function Amagada(){return <RC.Routes><RC.Route path="cistella" element={<Cistella />} /></RC.Routes>;}`},
      /Amagada\.jsx: importa el mòdul del Router sencer \(«RC»\)/],
    ['createElement', {'src/sections/botiga/Amagada.jsx': `import { createElement } from 'react';\nimport { Routes, Route } from ${ROUTER};\nexport default function Amagada(){return createElement(Routes, null, createElement(Route, {path: 'cistella'}));}`},
      /Amagada\.jsx: fa servir Routes com a valor, fora d'un element JSX \(línia 3\)/],
    ['barril', {'src/sections/botiga/barril.js': `export { Routes as Encaminador, Route } from ${ROUTER};`,
      'src/sections/botiga/Amagada.jsx': "import { Encaminador, Route } from './barril';\nexport default function Amagada(){return <Encaminador><Route path=\"cistella\" element={<Cistella />} /></Encaminador>;}"},
    /barril\.js: reexporta Routes/],
    ['export *', {'src/sections/botiga/barril.js': `export * from ${ROUTER};`,
      'src/sections/botiga/Amagada.jsx': "import * as B from './barril';\nexport default function Amagada(){return <B.Routes><B.Route path=\"cistella\" element={<Cistella />} /></B.Routes>;}"},
    /barril\.js: reexporta el mòdul del Router sencer/]
  ]) {
    const {infraccions} = await llig(t, '<Route path="mur" element={<MurSection />} />', fitxers);
    assert.ok(infraccions.some(i => i.llei === 'S4' && motiu.test(i.detall)), `${nom}: ${JSON.stringify(infraccions)}`);
  }
  // El control: un fitxer que importa del Router sense Routes, o que el nomena en un comentari o en un text, no és cap
  // infracció; i la façana declarada del nucli (FACANES_DEL_ROUTER) pot passar Routes a les apps enxufables.
  const {infraccions} = await llig(t, '<Route path="mur" element={<MurSection />} />', {
    'src/sections/botiga/Botiga.jsx': `import { useNavigate, Link } from ${ROUTER};\n/* Routes: cap. */\nexport const text = 'Routes';\nexport default function Botiga(){useNavigate();return <Link to="/mur">Mur</Link>;}`,
    'src/apps/plataforma/nucliModuls.js': `import { Route, Routes } from ${ROUTER};\nexport const NUCLI = Object.freeze({router: Object.freeze({Route, Routes})});`
  });
  assert.deepEqual(infraccions, []);
});

test('la porta (CLI) sobre un arbre de prova: roja amb una ruta pública nova sense cobertura i amb un Router il·legible', t => {
  // La porta de veres, sobre l'arbre de veres, ix amb 0 i diu «PORTA VERDA».
  const verda = spawnSync(process.execPath, [PORTA], {cwd: projectRoot, encoding: 'utf8'});
  assert.equal(verda.status, 0, verda.stdout.slice(-600) + verda.stderr);
  assert.match(verda.stdout, /PORTA VERDA/);
  const json = spawnSync(process.execPath, [PORTA, '--json'], {cwd: projectRoot, encoding: 'utf8'});
  assert.deepEqual(JSON.parse(json.stdout).infraccions, []);
  // Un arbre que no es pot llegir (cap package.json ni Router): 1, mai un verd buit.
  const buit = arbre(t, {'package.json': '{"type":"module"}'});
  const roja = spawnSync(process.execPath, [PORTA, `--arrel=${buit}`], {cwd: projectRoot, encoding: 'utf8'});
  assert.equal(roja.status, 1);
  assert.match(roja.stderr + roja.stdout, /PORTA ROJA/);
});
