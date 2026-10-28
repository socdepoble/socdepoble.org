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
   CSP (fixada també per AdjuntXat.porta.test.js) val a tot el lloc. */
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
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
  expect(regla('!/@(assets|fonts)/**').headers).toEqual([{ key: 'Cache-Control', value: 'no-cache' }]);
  expect(regla('/assets/**').headers.map((h) => h.key)).toEqual([
    'Access-Control-Allow-Origin', 'Access-Control-Expose-Headers', 'Access-Control-Allow-Headers'
  ]);
  expect(regla('^/assets/[^/]+-[A-Za-z0-9_-]{8}\\.(js|mjs|css|woff2?)$').headers)
    .toEqual([{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]);
  // Cap no-store a l'HTML estàtic: només l'adaptador d'edge, adormit, el posa.
  expect(JSON.stringify(hosting.headers)).not.toMatch(/no-store/);
});
