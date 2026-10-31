// @vitest-environment node
/* Pla 261028_1526 (P1-61, Fase 2) · Els invariants de Firebase Hosting que
   fan servir les pàgines prerenderitzades (tooling/seo/prerender-social.mjs,
   dist/<ruta>/index.html). Decisió per defecte (261028, D1, opció A):
   «trailingSlash: false» servix dist/projecte/index.html a /projecte, sense
   cap 301 cap a /projecte/ (les rutes del router són exactes), i porta
   /projecte/ a /projecte. «cleanUrls» continua fals: amb ell, el retorn
   d'OAuth (/auth/calendari-google.html i /auth/callback.html) faria un 301.
   L'única reescriptura (la de l'SPA) continua sent l'última: Firebase només
   l'aplica quan no hi ha cap fitxer ni directori, i el contingut estàtic
   (cada directori prerenderitzat porta el seu index.html) va abans.
   Les capçaleres no canvien: el no-cache cobrix l'HTML prerenderitzat i la
   CSP (fixada també per AdjuntXat.porta.test.js) val a tot el lloc.
   M-01 (pla 261029_0216, Pas 9) · La regla global porta, a més de la CSP (que
   no canvia ni un byte), tres capçaleres de conformitat a tot el lloc, les
   mateixes a vercel.json: X-Content-Type-Options: nosniff (cap ensumada de
   tipus), Referrer-Policy: strict-origin-when-cross-origin (la mateixa
   política que ja porten els iframes del Mur i del Lector) i
   Permissions-Policy: camera=(self), microphone=(self), geolocation=(self).
   El perquè de cada permís:
     · microphone=(self): les notes de veu del xat criden
       navigator.mediaDevices.getUserMedia({ audio: true })
       (src/sections/xat/adjuntLocal.js · gravaVeu);
     · camera=(self): mateix àmbit propi que el micròfon, segons el Pla
       Variable. Hui la càmera entra per <input type="file"
       capture="environment"> (ControlsAdjunt.jsx); cap getUserMedia({ video }).
     · geolocation=(self): hui no es demana, però el mapa fotogràfic podrà
       demanar-la des del nostre origen;
     · cap origen de tercers a la llista: l'amfitrió de Sollutia incrusta el
       Web Component com a script del seu document, no com a iframe del nostre
       origen, i la política de capçalera només governa el nostre document i
       els iframes que ell incrusta. */
import { expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const hosting = JSON.parse(readFileSync(path.join(process.cwd(), 'firebase.json'), 'utf8')).hosting;

test('dist, sense barra final i sense URL netes', () => {
  expect(hosting.public).toBe('dist');
  expect(hosting.trailingSlash).toBe(false);
  expect(hosting.cleanUrls).toBe(false);
  expect(hosting.redirects).toBeUndefined();
  // Els fitxers amb punt no es despleguen (el prerender no n'escriu cap); .well-known/ sí (vegeu la prova de WebFinger).
  expect(hosting.ignore).toEqual(['**/.*', '!.well-known', '**/node_modules/**']);
});

/* P1-23 (ordre del Mestre del 30-10-2026) · Les reescriptures de WebFinger van
   davant de la de l'SPA (Firebase aplica la primera que casa), i la de l'SPA
   continua l'última i ara deixa fora també /.well-known/ (vegeu la prova de
   WebFinger, més avall). */
test('la reescriptura de l’SPA, l’última i sense assets, fonts, /ap/ ni /.well-known/; davant, les de WebFinger', () => {
  expect(hosting.rewrites.at(-1)).toEqual({ source: '!/@(assets|fonts|ap|.well-known)/**', destination: '/index.html' });
  expect(hosting.rewrites.slice(0, -1).map((r) => [Object.keys(r).sort(), r.destination])).toEqual([
    [['destination', 'regex'], '/.well-known/webfinger/socdepoble.json'],
    [['destination', 'regex'], '/.well-known/webfinger/la-torre-de-les-macanes.json'],
    [['destination', 'regex'], '/.well-known/webfinger/la-torre-de-les-macanes.json']
  ]);
});

/* Gauntlet 261030, cicle 2 (federacio) · Firebase casa reescriptures i
   capçaleres amb globs de minimatch (el motor de superstatic) contra el camí
   de la petició. path.matchesGlob de Node usa el mateix minimatch, però sense
   negació: el «!» inicial s'inverteix ací, com fa minimatch. Els camins de
   les proves van en minúscules (a macOS, Node casa sense caixa). */
const casaGlob = (glob, cami) => {
  let patro = glob;
  let negat = false;
  while (patro.startsWith('!')) { patro = patro.slice(1); negat = !negat; }
  return path.matchesGlob(cami, patro) !== negat;
};
/* Una regla amb «regex» (RE2 a Firebase) s'avalua ací amb RegExp i la
   bandera u, com fa superstatic (el motor de l'emulador de Firebase) quan no
   té l'enllaç natiu d'RE2; els modificadors (?i:…) són RE2 i també JavaScript
   (V8 12.5+, Node 23+). */
const casaRegla = (regla, cami) => (regla.regex ? new RegExp(regla.regex, 'u').test(cami) : casaGlob(regla.source, cami));
const reescritA = (cami) => hosting.rewrites.find((r) => casaRegla(r, cami))?.destination;

test('les capçaleres: CSP a tot el lloc, no-cache a l’HTML, CORS als assets i immutable als hashos', () => {
  const regla = (font) => hosting.headers.find((r) => r.source === font || r.regex === font);
  const csp = regla('**').headers.find((h) => h.key === 'Content-Security-Policy').value;
  expect(csp).toMatch(/script-src 'self';/);
  expect(csp).toMatch(/object-src 'none'/);
  // M-01 · La CSP continua sent la primera; les tres de conformitat, darrere, en este ordre.
  expect(regla('**').headers.map((h) => h.key)).toEqual([
    'Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy'
  ]);
  expect(regla('!/@(assets|fonts)/**').headers).toEqual([{ key: 'Cache-Control', value: 'no-cache' }]);
  expect(regla('/assets/**').headers.map((h) => h.key)).toEqual([
    'Access-Control-Allow-Origin', 'Access-Control-Expose-Headers', 'Access-Control-Allow-Headers'
  ]);
  expect(regla('^/assets/[^/]+-[A-Za-z0-9_-]{8}\\.(js|mjs|css|woff2?)$').headers)
    .toEqual([{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]);
  // Cap no-store a l'HTML estàtic: només l'adaptador d'edge, adormit, el posa.
  expect(JSON.stringify(hosting.headers)).not.toMatch(/no-store/);
});

/* M-01 · Les tres capçaleres de conformitat, a tot el lloc i amb el mateix
   valor a firebase.json i a vercel.json. La CSP, byte a byte la de sempre, la
   fixa AdjuntXat.porta.test.js (paritat entre els dos fitxers i la meta). */
const vercel = JSON.parse(readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'));
const CAPCALERES_GLOBALS = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)'
});
const valors = (regla) => Object.fromEntries(regla.headers.map((h) => [h.key, h.value]));

test('M-01 · nosniff, Referrer-Policy i Permissions-Policy a la regla global, iguals a Firebase i a Vercel', () => {
  const firebase = valors(hosting.headers.find((r) => r.source === '**'));
  const vercelGlobal = valors(vercel.headers.find((r) => r.source === '/(.*)'));
  for (const [clau, valor] of Object.entries(CAPCALERES_GLOBALS)) {
    expect(firebase[clau], clau).toBe(valor);
    expect(vercelGlobal[clau], clau).toBe(valor);
  }
  // Una sola regla global a cada fitxer, i cap altra regla no repetix estes tres.
  expect(hosting.headers.filter((r) => r.source === '**')).toHaveLength(1);
  expect(vercel.headers.filter((r) => r.source === '/(.*)')).toHaveLength(1);
  for (const r of hosting.headers.filter((r) => r.source !== '**')) {
    for (const clau of Object.keys(CAPCALERES_GLOBALS)) expect(valors(r)[clau], `${r.source ?? r.regex} · ${clau}`).toBeUndefined();
  }
  // A Vercel, els tres fitxers estàtics ja portaven nosniff (recursosEstatics.test.js): el mateix valor, cap conflicte.
  for (const r of vercel.headers.filter((r) => r.source !== '/(.*)' && 'X-Content-Type-Options' in valors(r))) {
    expect(valors(r)['X-Content-Type-Options'], r.source).toBe('nosniff');
  }
  // Cap valor amb CR o LF ni amb caràcters de control: una capçalera trencada tomba la resposta.
  for (const valor of Object.values({ ...firebase, ...vercelGlobal })) expect(valor).not.toMatch(/[\u0000-\u001f\u007f]/u);
});

/* El perquè de cada permís, lligat al codi: si algú porta la càmera a
   getUserMedia, o la geolocalització a un iframe d'un altre origen, esta
   prova demana revisar la política abans de desplegar. */
test('M-01 · Permissions-Policy: el micròfon és de les notes de veu, la càmera no passa per getUserMedia i cap origen de tercers', () => {
  const politica = valors(hosting.headers.find((r) => r.source === '**'))['Permissions-Policy'];
  const directives = Object.fromEntries(politica.split(',').map((d) => d.trim()).map((d) => {
    const m = /^([a-z-]+)=\((.*)\)$/.exec(d);
    expect(m, d).not.toBeNull();
    return [m[1], m[2].split(/\s+/).filter(Boolean)];
  }));
  expect(directives).toEqual({ camera: ['self'], microphone: ['self'], geolocation: ['self'] });
  // Cap origen explícit: l'amfitrió de Sollutia incrusta un script, no un iframe del nostre origen.
  expect(politica).not.toMatch(/https?:/);
  const llig = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');
  // microphone=(self): les notes de veu demanen només àudio.
  expect(llig('src/sections/xat/adjuntLocal.js')).toMatch(/mediaDevices\.getUserMedia\(\{ audio: true \}\)/);
  // La captura actual continua sent l'input natiu; camera=(self) conserva l'àmbit propi del Pla.
  expect(llig('src/sections/xat/components/ControlsAdjunt.jsx')).toMatch(/type="file"[^>]*capture="environment"/);
  // I cap getUserMedia amb vídeo a tot src/ (fora de les proves).
  const arrel = path.join(process.cwd(), 'src');
  const ambVideo = readdirSync(arrel, { recursive: true })
    .filter((f) => /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f))
    .filter((f) => /getUserMedia\([^)]*video/.test(readFileSync(path.join(arrel, f), 'utf8')));
  expect(ambVideo).toEqual([]);
});

/* P1-23 (ordre del Mestre del 30-10-2026, NLnet NGI Fediversity) · Els JSON-LD
   estàtics de la federació (/ap/actors|outbox|followers|objectes/…, els emet
   el build web: tooling/vite/federacio-iaia.mjs) ixen com a ActivityStreams,
   amb CORS obert i una memòria cau curta. La regla és l'ÚLTIMA: Firebase
   recorre totes les regles de capçaleres i, per a la mateixa clau, aplica la
   darrera que casa (github.com/firebase/firebase-tools/issues/8917 i
   /issues/9467, resposta del mantenidor);
   així el seu Cache-Control mana sobre el no-cache de «!/@(assets|fonts)/**».
   Els fitxers estàtics van abans que la reescriptura de l'SPA. Cap JRD fix a
   /.well-known/webfinger (un fitxer estàtic no veu ?resource=): el WebFinger
   del lloc estàtic va per host-meta (prova de WebFinger, més avall).
   Gauntlet 261030, cicle 2 (federacio) · La reescriptura de l'SPA NO cobrix
   /ap/: un actor, objecte o outbox que no és al build (un slug esborrat, un
   objecte retirat, una errata d'un servidor remot) dona el 404 de Firebase,
   com el connector de dev (federacio-iaia.mjs) i l'nginx de flake.nix
   («try_files $uri =404»). Abans, el glob negat «!/@(assets|fonts)/**» hi
   casava: l'index.html eixia amb 200 i, com que les capçaleres casen pel
   camí de la petició, etiquetat application/activity+json, CORS * i 5 minuts
   de memòria cau pública. Ho avalua el glob, no la cadena del JSON. */
test('P1-23 · /ap/**: application/activity+json, CORS i Cache-Control curt, l’última regla i res més', () => {
  const regla = hosting.headers.at(-1);
  expect(regla).toEqual({
    source: '/ap/**',
    headers: [
      { key: 'Content-Type', value: 'application/activity+json; charset=utf-8' },
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Cache-Control', value: 'public, max-age=300' }
    ]
  });
  expect(hosting.headers.filter((r) => r.source === '/ap/**')).toHaveLength(1);
  // Cap altra regla posa Content-Type fora de la federació: /ap/**, el host-meta i els JRD de WebFinger.
  expect(hosting.headers.filter((r) => r.headers.some((h) => h.key === 'Content-Type')).map((r) => r.source ?? 'regex:webfinger'))
    .toEqual(['/.well-known/host-meta', 'regex:webfinger', '/ap/**']);
  // Cap redirecció, i cap camí de /ap/ no cau a cap reescriptura:
  // ni els que el build publica ni els que no hi són (Firebase hi torna el seu 404).
  expect(hosting.redirects).toBeUndefined();
  for (const cami of [
    '/ap/', '/ap/actors/socdepoble.json', '/ap/actors/ningu.json', '/ap/outbox/ningu.json',
    '/ap/followers/ningu.json', '/ap/inbox/ningu', '/ap/objectes/socdepoble/no-existix.json', '/ap/col-leccio-futura/x.json'
  ]) {
    expect(reescritA(cami), cami).toBeUndefined();
    expect(casaGlob('/ap/**', cami), cami).toBe(true);
  }
  // Les rutes de l'app continuen a l'SPA, també les que comencen per «ap» sense ser /ap/ (RutaApps viu a /app/*).
  for (const cami of ['/', '/xat', '/fedivers', '/fediversity', '/pobles/la-torre', '/app', '/app/xat', '/app/bar/tpv', '/apps']) {
    expect(reescritA(cami), cami).toBe('/index.html');
  }
  for (const cami of ['/assets/index-abcdef12.js', '/fonts/x.woff2']) expect(reescritA(cami), cami).toBeUndefined();
  // I cap ruta del router no viu davall de /ap/: Firebase li tornaria 404.
  expect(readFileSync(path.join(process.cwd(), 'src/app/App.jsx'), 'utf8')).not.toMatch(/path="\/?ap(?:\/|")/);
});

/* P1-23 · WebFinger al lloc estàtic (ordre del Mestre del 30-10-2026:
   @socdepoble@socdepoble.org i @latorredelesmacanes@socdepoble.org s'han de
   poder trobar des de Mastodon quan es desplegue). Fonts primàries:
   · Firebase Hosting (firebase.google.com/docs/hosting/full-config): ordre de
     resposta redireccions → contingut estàtic exacte → reescriptures (la
     primera que casa) → 404; «source» és un glob amb extglob i «regex», RE2;
     les capçaleres casen amb el camí de la petició ORIGINAL, abans de les
     reescriptures. No encamina per la consulta.
   · Mastodon (app/lib/webfinger.rb, branca main): si
     /.well-known/webfinger?resource=… torna 404, llig /.well-known/host-meta,
     pren el primer //xmlns:Link[@rel="lrdd"] i substituïx {uri} per
     acct:usuari@domini SENSE codificar-lo; un 200 que no és JSON (l'SPA) és
     un error i no hi ha alternativa. resolve_account_service.rb: si el subject
     no és el demanat (sense caixa), torna a preguntar UNA volta pel subject.
   Per això: /.well-known/webfinger (amb consulta o sense) NO cau a l'SPA i
   torna 404; host-meta i els JRD són estàtics (genera-federacio.mjs,
   fitxersWebFingerEstatic, emesos pel build); una reescriptura RE2 per compte
   porta el camí de la plantilla al JRD del seu actor, i un compte sense
   reescriptura dona 404, mai el JRD d'un altre. Glob amb un punt dins d'un
   extglob: el minimatch de superstatic 10 (l'emulador de firebase-tools
   15.34.1, minimatch 6.2.3) i el de Node l'exclouen; el minimatch 3 no. La
   simulació completa de l'algorisme de Mastodon és a
   src/config/firebaseHosting.webfinger.seguretat.test.js (pre-commit).
   Gauntlet 261030, cicle 4 (webfinger-404-sense-cors-a-firebase) · RFC 7033
   §5: el servidor MUST posar Access-Control-Allow-Origin a les respostes de
   WebFinger, i el 404 també n'és una. Abans només el portaven el host-meta i
   els JRD: el 404 de Firebase (la consulta per paràmetre, un compte que no hi
   és) eixia sense CORS i un client del navegador veia un error opac en lloc
   del 404; el servidor de desenvolupament (federacio-iaia.mjs) sí que el
   posava. Ara una regla sense Content-Type el posa a tot
   /.well-known/webfinger, i és l'única que el posa en eixos camins. */
test('P1-23 · WebFinger: /.well-known/webfinger torna 404 amb CORS, host-meta i els JRD amb tipus i CORS, i cada compte al seu JRD', () => {
  // Cap camí de /.well-known/ no cau a l'SPA (Firebase hi torna el seu 404); la resta de l'app, sí.
  for (const cami of ['/.well-known/webfinger', '/.well-known/webfinger/', '/.well-known/host-meta', '/.well-known/change-password',
    '/.well-known/webfinger/acct:ningu@socdepoble.org', '/.well-known/webfinger/acct:penaguila@socdepoble.org', '/.well-known/nodeinfo']) {
    expect(reescritA(cami), cami).toBeUndefined();
  }
  for (const cami of ['/', '/xat', '/fediversity', '/pobles/la-torre-de-les-macanes', '/well-known/webfinger', '/x.well-known']) {
    expect(reescritA(cami), cami).toBe('/index.html');
  }
  // Cada compte, en la forma de Mastodon («:» i «@» tal qual), codificada (%3A, %40, hex en qualsevol caixa) i en qualsevol caixa.
  const comptes = {
    socdepoble: '/.well-known/webfinger/socdepoble.json',
    'la-torre-de-les-macanes': '/.well-known/webfinger/la-torre-de-les-macanes.json',
    latorredelesmacanes: '/.well-known/webfinger/la-torre-de-les-macanes.json'
  };
  for (const [usuari, jrd] of Object.entries(comptes)) {
    for (const forma of [`acct:${usuari}@socdepoble.org`, `acct%3A${usuari}%40socdepoble.org`, `acct%3a${usuari}%40socdepoble.org`,
      `ACCT:${usuari.toUpperCase()}@SocDePoble.org`]) {
      expect(reescritA(`/.well-known/webfinger/${forma}`), forma).toBe(jrd);
    }
    // Cap variant que no siga eixe compte: ni un altre host, ni un sufix, ni la consulta.
    for (const dolenta of [`acct:${usuari}@socdepoble.org.example`, `acct:${usuari}@socdepoblexorg`, `acct:${usuari}x@socdepoble.org`,
      `acct:x${usuari}@socdepoble.org`, `acct:${usuari}@socdepoble.org/`, `${usuari}@socdepoble.org`, `acct:${usuari}`]) {
      expect(reescritA(`/.well-known/webfinger/${dolenta}`), dolenta).toBeUndefined();
    }
  }
  // Les capçaleres casen pel camí original: el JRD i el host-meta amb el seu tipus i CORS; un 404 no s'etiqueta com a JRD.
  const capcaleres = (cami) => Object.fromEntries(hosting.headers.filter((r) => casaRegla(r, cami)).flatMap((r) => r.headers.map((h) => [h.key, h.value])));
  const reglesAmbCors = (cami) => hosting.headers.filter((r) => casaRegla(r, cami) && r.headers.some((h) => h.key === 'Access-Control-Allow-Origin'));
  expect(capcaleres('/.well-known/host-meta')).toMatchObject({ 'Content-Type': 'application/xrd+xml; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  const jrds = [...Object.values(comptes), '/.well-known/webfinger/acct:latorredelesmacanes@socdepoble.org',
    '/.well-known/webfinger/acct%3ASocDePoble%40socdepoble.org'];
  for (const cami of jrds) {
    expect(capcaleres(cami), cami).toMatchObject({ 'Content-Type': 'application/jrd+json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  }
  // Els 404 de WebFinger (la consulta per paràmetre, un compte que no hi és, un poble de mostra): CORS * (RFC 7033 §5) i cap tipus JRD.
  const nos = ['/.well-known/webfinger', '/.well-known/webfinger/', '/.well-known/webfinger/acct:ningu@socdepoble.org',
    '/.well-known/webfinger/acct%3Aningu%40socdepoble.org', '/.well-known/webfinger/acct:penaguila@socdepoble.org', '/.well-known/webfinger/penaguila.json'];
  for (const cami of nos) {
    expect(capcaleres(cami)['Content-Type'], cami).toBeUndefined();
    expect(capcaleres(cami)['Access-Control-Allow-Origin'], cami).toBe('*');
  }
  // Una sola regla posa el CORS a cada camí de WebFinger (cap clau repetida); fora de WebFinger i del host-meta, cap CORS a /.well-known/.
  for (const cami of [...jrds, ...nos]) expect(reglesAmbCors(cami), cami).toHaveLength(1);
  for (const cami of ['/.well-known/change-password', '/.well-known/nodeinfo', '/.well-known/webfingerx', '/.well-known/webfinger.json']) {
    expect(capcaleres(cami), cami).not.toHaveProperty('Content-Type');
    expect(capcaleres(cami), cami).not.toHaveProperty('Access-Control-Allow-Origin');
  }
  // flake.nix pren la regla dels actius immutables amb «lib.findFirst (r: r ? regex)»: la dels JRD (també regex) va després.
  expect(hosting.headers.find((r) => typeof r.regex === 'string').headers).toEqual([{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]);
});

/* P1-23 · «ignore» no deixa fora .well-known/. Dues lectures, i les dues el
   publiquen:
   · la de firebase-tools 15.34.1 (la fixada per a desplegar), lib/listFiles.js:
     glob 10 sync('**', { dot: true, nodir: true, ignore }), amb el «nonegate»
     de glob als patrons d'ignore. Un fitxer queda fora si un patró casa amb el
     seu camí: «**\/.*» només casa si l'ÚLTIM segment comença per punt, i
     «!.well-known» és literal (cap fitxer comença per «!»). Comprovat amb el
     listFiles de veres: .well-known/host-meta i els JRD hi són; .DS_Store no.
   · la de la documentació («same way that Git handles .gitignore»): «**\/.*»
     trauria el directori .well-known sencer, i «!.well-known», darrere, el
     torna a incloure (l'últim patró que casa mana). */
test('P1-23 · ignore: .well-known/ es desplega amb les dues lectures (glob de firebase-tools i .gitignore); la resta de fitxers amb punt, no', () => {
  const publicats = ['.well-known/host-meta', '.well-known/webfinger/socdepoble.json', '.well-known/webfinger/la-torre-de-les-macanes.json', 'index.html', 'ap/actors/socdepoble.json'];
  const amagats = ['.DS_Store', 'ap/.DS_Store', '.env'];
  // Lectura de glob (nonegate): un patró sense «!» que casa amb el camí; «**\/.*» exigix un punt a l'inici de l'últim segment.
  const ignoratGlob = (fitxer) => hosting.ignore.filter((p) => !p.startsWith('!')).some((p) => (p === '**/.*'
    ? fitxer.split('/').at(-1).startsWith('.') : path.matchesGlob(fitxer, p)));
  // Lectura de .gitignore: per a cada directori del camí i el fitxer, l'últim patró que hi casa mana; un directori fora treu el que conté.
  const ignoratGit = (fitxer) => {
    const trossos = fitxer.split('/');
    return trossos.some((_, i) => {
      const cami = trossos.slice(0, i + 1).join('/');
      let fora = false;
      for (const patro of hosting.ignore) {
        const negat = patro.startsWith('!');
        const net = negat ? patro.slice(1) : patro;
        if (path.matchesGlob(cami, net) || path.matchesGlob(cami, `**/${net}`)) fora = !negat;
      }
      return fora;
    });
  };
  for (const fitxer of publicats) expect([fitxer, ignoratGlob(fitxer), ignoratGit(fitxer)]).toEqual([fitxer, false, false]);
  for (const fitxer of amagats) expect([fitxer, ignoratGlob(fitxer), ignoratGit(fitxer)]).toEqual([fitxer, true, true]);
});
