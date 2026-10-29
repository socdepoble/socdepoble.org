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
  // Els fitxers amb punt (.well-known a banda) no es despleguen: el prerender no n'escriu cap.
  expect(hosting.ignore).toContain('**/.*');
});

test('una sola reescriptura, la de l’SPA, sense assets ni fonts', () => {
  expect(hosting.rewrites).toEqual([{ source: '!/@(assets|fonts)/**', destination: '/index.html' }]);
});

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
