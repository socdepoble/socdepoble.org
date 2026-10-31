// @vitest-environment node
/* P1-23 (ordre del Mestre del 30-10-2026) · Gauntlet 261030, cicle 4
   (webfinger-jrd-creuat-fora-del-precommit) · El WebFinger estàtic de Firebase
   Hosting no respon MAI el JRD d'un compte per a un altre: Mastodon seguiria el
   subject cap a l'altre compte (especificació W). Abans, el contingut dels JRD
   que emet el build (fitxersWebFingerEstatic) i la simulació de l'algorisme de
   Mastodon només vivien a tooling/seo/genera-federacio.test.mjs, de test:node,
   que no executen ni el pre-commit (vitest.precommit.config.js) ni
   run-portes --nomes-portes: un JRD amb el subject d'un altre compte passava el
   hook. Estes proves són pures (cap xarxa, cap fitxer escrit), tarden
   mil·lisegons i entren al pre-commit pel nom (*.seguretat.test.js):
     · el host-meta i el JRD de cada actor principal (el mateix que el servidor);
     · les regles de WebFinger de firebase.json, exactament les del generador;
     · Mastodon contra les respostes estàtiques que donaria Firebase, per als
       tres comptes i per als que no hi són, també amb el CORS dels 404
       (cicle 4, webfinger-404-sense-cors-a-firebase).
   tooling/seo/genera-federacio.test.mjs es queda amb la resta: fonts,
   frontera, origen, determinisme, nginx, escriptura i CLI. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { test } from 'vitest';
import {
  ACTORS_WEBFINGER_ESTATIC, ALIES_WEBFINGER, NS_XRD, bytesDe, construeixHostMeta, fitxersDelServidor, fitxersWebFingerEstatic,
  preparaFederacio, reglesFirebaseWebFinger
} from '../../tooling/seo/genera-federacio.mjs';

const ARREL = process.cwd();
const ORIGEN = 'https://socdepoble.org';
const TORRE = 'la-torre-de-les-macanes';
const llegixHosting = () => JSON.parse(readFileSync(path.join(ARREL, 'firebase.json'), 'utf8')).hosting;

/* El host-meta (RFC 6415) i el JRD dels actors principals que emet el build web. */
test('WebFinger estàtic: host-meta amb la plantilla LRDD, el JRD de cada actor principal (el mateix que el servidor) i res més', async () => {
  const preparat = await preparaFederacio({ arrel: ARREL, origen: ORIGEN });
  const { ap } = preparat;
  const estatics = fitxersWebFingerEstatic(preparat);
  assert.deepEqual([...estatics.keys()], ['.well-known/host-meta', `.well-known/webfinger/${TORRE}.json`, '.well-known/webfinger/socdepoble.json']);
  assert.deepEqual(ACTORS_WEBFINGER_ESTATIC, ['socdepoble', TORRE]);
  // L'espai de noms XRD per defecte a l'arrel: Mastodon hi busca //xmlns:Link[@rel="lrdd"] (Nokogiri pren xmlns de l'arrel).
  assert.equal(estatics.get('.well-known/host-meta'), '<?xml version="1.0" encoding="UTF-8"?>\n'
    + `<XRD xmlns="${NS_XRD}">\n  <Link rel="lrdd" type="application/jrd+json" template="https://socdepoble.org/.well-known/webfinger/{uri}"/>\n</XRD>\n`);
  assert.equal(NS_XRD, 'http://docs.oasis-open.org/ns/xri/xrd-1.0');
  assert.match(construeixHostMeta({ ap, origen: 'https://proves.socdepoble.org' }), /template="https:\/\/proves\.socdepoble\.org\/\.well-known\/webfinger\/\{uri\}"/);
  const servidor = fitxersDelServidor(preparat);
  for (const slug of ACTORS_WEBFINGER_ESTATIC) {
    const jrd = estatics.get(`.well-known/webfinger/${slug}.json`);
    assert.deepEqual(jrd, servidor.get(`.well-known/webfinger/${slug}.json`), slug);
    assert.equal(jrd.subject, `acct:${slug}@socdepoble.org`);
    assert.deepEqual(jrd.links.find((l) => l.rel === 'self'), { rel: 'self', type: 'application/activity+json', href: `${ORIGEN}/ap/actors/${slug}.json` });
    assert.ok(preparat.fitxers.has(`ap/actors/${slug}.json`), slug);
  }
  // Determinisme: els mateixos bytes en dues generacions.
  const bytes = (mapa) => [...mapa].map(([cami, document]) => `${cami}\n${bytesDe(ap, document)}`).join('');
  assert.equal(bytes(fitxersWebFingerEstatic(await preparaFederacio({ arrel: ARREL, origen: ORIGEN }))), bytes(estatics));
  // L'àlies resol al JRD canònic (dev i nginx, com Firebase); el subject és el de La Torre.
  assert.equal(ap.construeixWebFinger('acct:latorredelesmacanes@socdepoble.org', { origen: ORIGEN, municipis: preparat.actors }).subject, `acct:${TORRE}@socdepoble.org`);
  assert.equal(ap.construeixWebFinger('acct:latorredelesmacanes@socdepoble.org', { origen: ORIGEN, municipis: preparat.actors.map((a) => a.slug) }), null);
  // Sense un actor principal, cap host-meta que prometa un JRD absent.
  assert.throws(() => fitxersWebFingerEstatic({ ...preparat, actors: preparat.actors.filter((a) => a.slug !== TORRE) }), /actor principal la-torre-de-les-macanes/);
});

/* firebase.json porta, tal qual i en el mateix ordre, les regles que el generador deriva dels mateixos actors
   (cap deriva entre els dos, en cap sentit: ni una regla del generador que falte, ni una de WebFinger de més). */
test('firebase.json: les reescriptures i capçaleres de WebFinger són exactament les del generador, davant de l’SPA i de /ap/**', async () => {
  const hosting = llegixHosting();
  const regles = reglesFirebaseWebFinger(await preparaFederacio({ arrel: ARREL, origen: ORIGEN }));
  assert.deepEqual(hosting.rewrites.slice(0, -1), regles.rewrites);
  assert.equal(hosting.rewrites.at(-1).destination, '/index.html');
  assert.deepEqual(hosting.headers.filter((r) => (r.source ?? r.regex).includes('well-known')), regles.headers);
  const posicio = (regla) => hosting.headers.findIndex((r) => JSON.stringify(r) === JSON.stringify(regla));
  for (const regla of regles.headers) assert.ok(posicio(regla) >= 0, JSON.stringify(regla));
  assert.ok(regles.headers.every((regla) => posicio(regla) < hosting.headers.findIndex((r) => r.source === '/ap/**')));
  // flake.nix pren la primera regla amb «regex» com la dels actius immutables: les de WebFinger van després.
  assert.ok(regles.headers.every((regla) => posicio(regla) > hosting.headers.findIndex((r) => typeof r.regex === 'string')));
});

/* ── Simulació de l'algorisme de Mastodon contra el lloc estàtic de Firebase ──
   Fonts primàries (branca main de github.com/mastodon/mastodon):
   · app/lib/webfinger.rb: GET https://<domini>/.well-known/webfinger?resource=<uri>
     (uri sense codificar); 200 → el cos (buit: error); 404 → host-meta: 200 o
     error; el primer //xmlns:Link[@rel="lrdd"] (xmlns és l'espai de noms per
     defecte de l'arrel: sense ell, XPath::SyntaxError → error), {uri}
     substituït sense codificar i una sola petició més, ja sense alternativa;
     410 → GoneError; un altre codi → error. Response: JSON.parse (un HTML és
     error), subject obligatori i el primer link rel=self de tipus
     application/activity+json (o ld+json amb el perfil d'AS).
   · app/services/resolve_account_service.rb: usuari@domini (sense l'@ inicial,
     domini en minúscules), Webfinger("acct:usuari@domini"); split_acct
     (delete_prefix('acct:').split('@'), dos trossos); si el subject no casa
     (casecmp), UNA consulta més pel subject i, si tampoc casa,
     «Too many webfinger redirects».
   · app/services/activitypub/process_account_service.rb (check_webfinger!):
     preferredUsername@host de l'id de l'actor, la mateixa ronda, i el self del
     JRD ha de ser EXACTAMENT l'id de l'actor («does not loop back»).
   Firebase Hosting (docs/hosting/full-config): contingut estàtic exacte, després
   la primera reescriptura que casa, si no 404; les capçaleres casen pel camí
   original, també a les respostes 404 (el middleware de capçaleres de
   superstatic, el motor de l'emulador, les posa a qualsevol resposta), i la
   darrera que posa una clau mana. No encamina per la consulta.
   Si Firebase descodifica el camí abans de casar-lo no ho documenta: la
   simulació prova les dues lectures (camí cru i descodificat). Els globs, amb
   el minimatch de Node (el mateix comportament que el de superstatic 10, el
   motor de l'emulador); les «regex», amb RegExp u (superstatic sense RE2). */
class ErrorWebFinger extends Error {}
const TIPUS_AP_LLESTOS = ['application/activity+json', 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'];
const { window: FINESTRA } = new JSDOM('');

function firebaseEstatic({ hosting, dist, descodifica }) {
  const glob = (patro, cami) => {
    let net = patro;
    let negat = false;
    while (net.startsWith('!')) { net = net.slice(1); negat = !negat; }
    return path.matchesGlob(cami, net) !== negat;
  };
  const casa = (regla, cami) => (regla.regex ? new RegExp(regla.regex, 'u').test(cami) : glob(regla.source, cami));
  const perExtensio = (fitxer) => (fitxer.endsWith('.json') ? 'application/json' : fitxer.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream');
  assert.equal(hosting.redirects, undefined);
  return (url) => {
    const cru = new URL(url).pathname;
    const cami = descodifica ? decodeURIComponent(cru) : cru;
    let fitxer = cami === '/' ? 'index.html' : dist.has(cami.slice(1)) ? cami.slice(1) : null;
    if (!fitxer) {
      const regla = hosting.rewrites.find((r) => casa(r, cami));
      fitxer = regla && dist.has(regla.destination.slice(1)) ? regla.destination.slice(1) : null;
    }
    const capcaleres = { 'content-type': fitxer ? perExtensio(fitxer) : 'text/html; charset=utf-8' };
    for (const regla of hosting.headers) if (casa(regla, cami)) for (const { key, value } of regla.headers) capcaleres[key.toLowerCase()] = value;
    return fitxer ? { status: 200, capcaleres, cos: dist.get(fitxer) } : { status: 404, capcaleres, cos: '<!doctype html><title>404</title>' };
  };
}

function mastodon(peticio, { codifica = false } = {}) {
  const peticions = [];
  const demana = (url) => {
    const resposta = peticio(url);
    const { pathname, search } = new URL(url);
    peticions.push([`${pathname}${search}`, resposta.status]);
    return resposta;
  };
  const plantillaDe = (xml, uri) => {
    const doc = new FINESTRA.DOMParser().parseFromString(xml, 'application/xml');
    const xmlns = doc.documentElement?.lookupNamespaceURI(null);
    if (doc.getElementsByTagName('parsererror').length || !xmlns) throw new ErrorWebFinger('Invalid XML encountered in host-meta');
    const link = [...doc.getElementsByTagNameNS(xmlns, 'Link')].find((e) => e.getAttribute('rel') === 'lrdd');
    if (!link) throw new ErrorWebFinger('host-meta without link to Webfinger');
    return link.getAttribute('template').replaceAll('{uri}', codifica ? encodeURIComponent(uri) : uri);
  };
  const webfinger = (uri) => {
    const domini = uri.split('@')[1];
    const cos = (url, alternativa) => {
      const resposta = demana(url);
      if (resposta.status === 200) {
        if (!resposta.cos) throw new ErrorWebFinger('empty response');
        return resposta.cos;
      }
      if (resposta.status === 404 && alternativa) {
        const hostMeta = demana(`https://${domini}/.well-known/host-meta`);
        if (hostMeta.status !== 200) throw new ErrorWebFinger(`host-meta HTTP ${hostMeta.status}`);
        return cos(plantillaDe(hostMeta.cos, uri), false);
      }
      throw new ErrorWebFinger(resposta.status === 410 ? 'gone' : `HTTP ${resposta.status}`);
    };
    const text = cos(`https://${domini}/.well-known/webfinger?resource=${uri}`, true);
    let json = null;
    try { json = JSON.parse(text); } catch { throw new ErrorWebFinger('Invalid JSON in response'); }
    if (!json.subject) throw new ErrorWebFinger('Missing subject');
    const self = (json.links ?? []).find((l) => l.rel === 'self' && TIPUS_AP_LLESTOS.includes(l.type));
    if (!self?.href) throw new ErrorWebFinger('Missing self link');
    return { subject: json.subject, self: self.href };
  };
  const parteix = (acct) => {
    const trossos = acct.replace(/^acct:/, '').split('@');
    if (trossos.length !== 2) throw new ErrorWebFinger('missing user or host');
    return trossos;
  };
  const igual = (a, b) => a.toLowerCase() === b.toLowerCase();
  /* La ronda de resolve_account_service i de check_webfinger!: una consulta i, si el subject no casa, una més. */
  const ronda = (usuari, domini) => {
    let resposta = webfinger(`acct:${usuari}@${domini}`);
    let [u, d] = parteix(resposta.subject);
    if (!(igual(u, usuari) && igual(d, domini))) {
      resposta = webfinger(`acct:${u}@${d}`);
      const [u2, d2] = parteix(resposta.subject);
      if (!(igual(u2, u) && igual(d2, d))) throw new ErrorWebFinger('Too many webfinger redirects');
      [u, d] = [u2, d2];
    }
    return { usuari: u, domini: d, self: resposta.self };
  };
  return (entrada) => {
    const [usuari, domini] = entrada.trim().replace(/^@/, '').split('@');
    const resolt = ronda(usuari, domini.toLowerCase());
    const actor = demana(resolt.self);
    if (actor.status !== 200) throw new ErrorWebFinger(`actor HTTP ${actor.status}`);
    const json = JSON.parse(actor.cos);
    if (!['Application', 'Group', 'Organization', 'Person', 'Service'].includes(json.type)) throw new ErrorWebFinger('tipus d’actor');
    const comprova = ronda(json.preferredUsername, new URL(json.id).host);
    if (comprova.self !== json.id) throw new ErrorWebFinger('does not loop back');
    return { usuari: resolt.usuari, domini: resolt.domini, actor: json.id, tipusActor: actor.capcaleres['content-type'], peticions };
  };
}

/* El dist del build web: ap/**, el WebFinger estàtic (el mateix que emet el connector) i l'SPA. */
async function distDelBuild(index) {
  const preparat = await preparaFederacio({ arrel: ARREL, origen: ORIGEN });
  const dist = new Map([...preparat.fitxers, ...fitxersWebFingerEstatic(preparat)].map(([cami, document]) => [cami, bytesDe(preparat.ap, document)]));
  dist.set('index.html', index);
  return { preparat, dist };
}

test('Mastodon contra Firebase: @socdepoble, @la-torre-de-les-macanes i l’àlies @latorredelesmacanes es troben per host-meta; cap altre compte', async () => {
  const hosting = llegixHosting();
  const { preparat, dist } = await distDelBuild('<!doctype html><html><body><div id="root"></div></body></html>');
  for (const descodifica of [false, true]) {
    const firebase = firebaseEstatic({ hosting, dist, descodifica });
    // /.well-known/webfinger, amb consulta o sense, és 404 de veres (l'SPA el faria 200 i Mastodon no provaria host-meta),
    // i porta CORS * (RFC 7033 §5): un client del navegador veu el 404, no un error CORS opac.
    for (const url of [`${ORIGEN}/.well-known/webfinger?resource=acct:socdepoble@socdepoble.org`, `${ORIGEN}/.well-known/webfinger`]) {
      const resposta = firebase(url);
      assert.deepEqual([resposta.status, resposta.capcaleres['access-control-allow-origin']], [404, '*'], url);
    }
    assert.equal(firebase(`${ORIGEN}/xat`).cos, dist.get('index.html'));
    const hostMeta = firebase(`${ORIGEN}/.well-known/host-meta`);
    assert.deepEqual([hostMeta.status, hostMeta.capcaleres['content-type'], hostMeta.capcaleres['access-control-allow-origin']],
      [200, 'application/xrd+xml; charset=utf-8', '*']);
    for (const codifica of [false, true]) {
      const resol = (entrada) => mastodon(firebase, { codifica })(entrada);
      const etiqueta = `descodifica=${descodifica}, codifica=${codifica}`;
      const projecte = resol('@socdepoble@socdepoble.org');
      assert.deepEqual([projecte.usuari, projecte.domini, projecte.actor, projecte.tipusActor],
        ['socdepoble', 'socdepoble.org', `${ORIGEN}/ap/actors/socdepoble.json`, 'application/activity+json; charset=utf-8'], etiqueta);
      const plantilla = codifica ? '/.well-known/webfinger/acct%3Asocdepoble%40socdepoble.org' : '/.well-known/webfinger/acct:socdepoble@socdepoble.org';
      assert.deepEqual(projecte.peticions.slice(0, 4), [
        ['/.well-known/webfinger?resource=acct:socdepoble@socdepoble.org', 404], ['/.well-known/host-meta', 200], [plantilla, 200],
        ['/ap/actors/socdepoble.json', 200]
      ], etiqueta);
      assert.equal(resol('@la-torre-de-les-macanes@socdepoble.org').actor, `${ORIGEN}/ap/actors/${TORRE}.json`, etiqueta);
      // L'àlies: el JRD torna el subject canònic i Mastodon torna a preguntar per ell (una sola volta).
      const alies = resol('@latorredelesmacanes@socdepoble.org');
      assert.deepEqual([alies.usuari, alies.actor], [TORRE, `${ORIGEN}/ap/actors/${TORRE}.json`], etiqueta);
      assert.deepEqual(alies.peticions.filter(([cami]) => cami.startsWith('/.well-known/webfinger/')).slice(0, 2).map(([cami]) => decodeURIComponent(cami)),
        ['/.well-known/webfinger/acct:latorredelesmacanes@socdepoble.org', `/.well-known/webfinger/acct:${TORRE}@socdepoble.org`], etiqueta);
      // Com ho escriu la persona: sense caixa i amb el domini en majúscules.
      assert.equal(resol('@LaTorreDeLesMacanes@SocDePoble.org').usuari, TORRE, etiqueta);
      // Els pobles de mostra i els comptes que no hi són: error de WebFinger (404 a la plantilla), mai un altre compte.
      for (const ningu of ['@penaguila@socdepoble.org', '@sella@socdepoble.org', '@ningu@socdepoble.org', '@socdepoble-x@socdepoble.org']) {
        assert.throws(() => resol(ningu), (error) => error instanceof ErrorWebFinger && /HTTP 404/.test(error.message), `${ningu} · ${etiqueta}`);
      }
    }
    // Propietat: per a qualsevol usuari, la plantilla torna 404 (amb CORS i sense tipus JRD) o el JRD del SEU actor (l'àlies, el del seu canònic).
    const canonic = (usuari) => (ALIES_WEBFINGER[TORRE].includes(usuari) ? TORRE : usuari);
    const usuaris = [...preparat.actors.map((a) => a.slug), 'latorredelesmacanes', 'ningu', 'socdepoble.json', 'la-torre', 'admin', 'socdepoble0'];
    for (const usuari of usuaris) {
      for (const cami of [`acct:${usuari}@socdepoble.org`, `acct%3A${usuari}%40socdepoble.org`, `acct:${usuari}@altre.example`]) {
        const resposta = firebase(`${ORIGEN}/.well-known/webfinger/${cami}`);
        assert.equal(resposta.capcaleres['access-control-allow-origin'], '*', cami);
        if (resposta.status === 404) { assert.notEqual(resposta.capcaleres['content-type'], 'application/jrd+json; charset=utf-8', cami); continue; }
        assert.equal(resposta.capcaleres['content-type'], 'application/jrd+json; charset=utf-8', cami);
        assert.equal(JSON.parse(resposta.cos).subject, `acct:${canonic(usuari)}@socdepoble.org`, `${cami} · descodifica=${descodifica}`);
        assert.ok([...ACTORS_WEBFINGER_ESTATIC, 'latorredelesmacanes'].includes(usuari) && !cami.includes('altre.example'), cami);
      }
    }
  }
});

test('Mastodon: sense l’espai de noms XRD a host-meta, o amb /.well-known/webfinger a l’SPA, el compte no es troba', async () => {
  const hosting = llegixHosting();
  const { dist } = await distDelBuild('<!doctype html><html></html>');
  // Un host-meta sense xmlns: Nokogiri no resol el prefix xmlns del XPath de Mastodon.
  const senseNs = new Map(dist).set('.well-known/host-meta', dist.get('.well-known/host-meta').replace(` xmlns="${NS_XRD}"`, ''));
  assert.throws(() => mastodon(firebaseEstatic({ hosting, dist: senseNs, descodifica: false }))('@socdepoble@socdepoble.org'), /Invalid XML/);
  // L'SPA de sempre (sense /.well-known/ fora): un 200 HTML que no és JSON, i Mastodon no prova host-meta.
  const ambSpa = { ...hosting, rewrites: [...hosting.rewrites.slice(0, -1), { source: '!/@(assets|fonts|ap)/**', destination: '/index.html' }] };
  assert.throws(() => mastodon(firebaseEstatic({ hosting: ambSpa, dist, descodifica: false }))('@socdepoble@socdepoble.org'), /Invalid JSON/);
});
