/* R22.1 (Gauntlet r221-dades-03, r221-dades-07, r221-text-09 i la regressió
   de admetFont) · Dues regles de sanitize.js, provades:
   1. esVideoDeCapcaleraDesable (el validador ÚNIC del vídeo que es desa, el de
      valorPerDesar i el del diàleg) mai admet res que el CHECK de
      20261113060000 rebutge. El CHECK es llig del fitxer de la migració i es
      transcriu a JavaScript ([:space:] → \s): si algú canvia l'un sense
      l'altre, esta prova ho diu. La prova contra PostgreSQL 18.6 de veres és
      tests/r22-1-hero-video-url-postgres.test.mjs.
   2. Els /media/ del Node 0 valen per al VÍDEO (esFontVideoPropia), no per a
      les imatges: el mode estricte de les imatges (admetFont) és el del
      COMMIT 5 i el del disparador del servidor (mur_imatge_propia). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  esFontImatgePropia, esFontImatgeSegura, esFontVideoPropia, esVideoDeCapcaleraDesable, fontImatgePropia, sanitizeHtml
} from './sanitize.js';

const SQL = readFileSync(path.join(process.cwd(), 'supabase/migrations/20261113060000_r22_1_hero_video_url.sql'), 'utf8');

/* El CHECK d'una taula, transcrit: les tres formes (~*), el '..' de la
   referència opaca, la llargària i els caràcters de control. */
function checkDe(taula) {
  const bloc = new RegExp(`add constraint ${taula}_hero_video_url_valida check \\(([\\s\\S]*?)\\n  \\);`).exec(SQL)?.[1];
  expect(bloc, taula).toBeTruthy();
  const formes = [...bloc.matchAll(/hero_video_url ~\* '([^']+)'/g)].map((m) => new RegExp(m[1].replaceAll('[:space:]', '\\s'), 'i'));
  expect(formes).toHaveLength(3);
  const [opac, https, cami] = formes;
  const maxim = Number(/char_length\(hero_video_url\) <= (\d+)/.exec(bloc)?.[1]);
  expect(maxim).toBe(2048);
  expect(bloc).toContain("hero_video_url !~ '[[:cntrl:]\\\\]'");
  expect(bloc).toContain("and hero_video_url !~ '\\.\\.')");
  return (valor) => valor === null || valor === '' || ([...valor].length <= maxim
    && !/[\u0000-\u001F\u007F\\]/.test(valor)
    && ((opac.test(valor) && !/\.\./.test(valor)) || https.test(valor) || cami.test(valor)));
}

const ORIGEN = window.location.origin;
const CORPUS = [
  // Admesos pel client
  'https://socdepoble.org/media/video-sintetic.mp4',
  'https://socdepoble.cat/media/spot.webm?v=2',
  'https://socdepoble.cat/media/spot.WEBM#t=3',
  'https://SOCDEPOBLE.ORG/media/MAJUSCULES.MP4',
  'sdp-media://mitjans/00000000-0000-4000-8000-000000000001/spot.mp4',
  'SDP-MEDIA://mitjans/u/spot.webm',
  '/media/video-propi.mp4',
  '/media/amb espai.mp4',
  `${ORIGEN.replace(/^http:/, 'https:')}/media/v.mp4`,
  // Que el CHECK rebutja (i el client també)
  'media/x.mp4', './x.mp4', '../x.mp4', 'x.webm', 'media/spot.webm?v=1',
  `${ORIGEN}/media/v.mp4`, 'http://socdepoble.org/media/video.mp4', 'http://localhost:3340/media/v.mp4',
  'sdp-media://mitjans_privats/u/secret.mp4', 'sdp-media://mitjans/../fora.mp4', 'sdp-media://mitjans/a/../../b.webm',
  'sdp-media://mitjans/u/spot.mp4?x=1', 'sdp-media://mitjans/u/amb espai.mp4',
  'https://socdepoble.org/media/foto.webp', 'https://socdepoble.org/media/sense-extensio', 'https://socdepoble.org.mp4',
  '//fora.example/video.mp4', '/\\fora.example/video.mp4', 'javascript:alert(1)//.mp4', 'data:video/mp4;base64,AAAA.mp4',
  `https://socdepoble.org/media/${'v'.repeat(2050)}.mp4`, 'https://socdepoble.org/media/salt\nde-linia.mp4',
  'https://socdepoble.org/media/a.mp4/..', 'https://socdepoble.org/media/x.mp4\u0085', 'https://socdepoble.org/media/x .mp4',
  'https://socdepoble.org/media/x.mp4?\u0085', '/media/x\u0085.mp4',
  // Que el CHECK admet i el client no (l'origen: el CHECK no el pot saber)
  'https://cdn-extern.exemple.com/video.mp4', 'https://youtube.com/v.mp4',
];

describe('esVideoDeCapcaleraDesable · el client mai admet res que el CHECK rebutge', () => {
  test.each(['profiles', 'organizations'])('paritat amb el CHECK de %s', (taula) => {
    const check = checkDe(taula);
    const admesos = CORPUS.filter((valor) => esVideoDeCapcaleraDesable(valor));
    expect(admesos.length).toBeGreaterThanOrEqual(8);
    for (const valor of admesos) expect(check(valor), JSON.stringify(valor).slice(0, 80)).toBe(true);
  });

  test('els camins relatius sense barra i els http:// no hi entren (el CHECK els rebutjaria amb 23514)', () => {
    const check = checkDe('profiles');
    for (const valor of ['media/x.mp4', './x.mp4', '../x.mp4', 'x.webm', `${ORIGEN}/media/v.mp4`]) {
      expect(esVideoDeCapcaleraDesable(valor), valor).toBe(false);
      expect(check(valor), valor).toBe(false);
    }
  });

  test('ni el bucket privat, ni «..», ni els controls C1 o els separadors de línia', () => {
    for (const valor of ['sdp-media://mitjans_privats/u/secret.mp4', 'sdp-media://mitjans/../fora.mp4',
      'https://socdepoble.org/media/x.mp4\u0085', 'https://socdepoble.org/media/x .mp4', '/media/x\u0085.mp4']) {
      expect(esVideoDeCapcaleraDesable(valor), JSON.stringify(valor)).toBe(false);
    }
  });

  test('un camí propi passa pel resolutor de camins abans del filtre d’origen', () => {
    /* El paquet servit des de la finestra mateixa (resolRecursPropi amb una base). */
    const resol = (valor) => (valor.startsWith('/assets/') ? `${ORIGEN}/paquet${valor}` : valor);
    expect(esVideoDeCapcaleraDesable('/assets/video/spot.mp4', resol)).toBe(true);
    expect(esVideoDeCapcaleraDesable('/assets/video/spot.mp4', () => 'https://fora.example/spot.mp4')).toBe(false);
  });
});

describe('admetFont · els /media/ del Node 0 són del vídeo, no de les imatges (com al COMMIT 5)', () => {
  const FOTO_NODE0 = ['https://socdepoble.cat/media/foto.jpg', 'https://socdepoble.org/media/portada.webp'];

  test('cap imatge del Node 0 d’un altre origen passa el mode estricte ni el filtre general', () => {
    for (const url of FOTO_NODE0) {
      expect(new URL(url).origin).not.toBe(window.location.origin);
      expect(esFontImatgePropia(url), url).toBe(false);
      expect(fontImatgePropia(url), url).toBeNull();
      expect(esFontImatgeSegura(url), url).toBe(false);
    }
    expect(sanitizeHtml('<p><img src="https://socdepoble.cat/media/foto.jpg" alt="x"></p>')).not.toContain('socdepoble.cat/media');
  });

  test('el vídeo del Node 0 sí que és propi', () => {
    expect(esFontVideoPropia('https://socdepoble.cat/media/video.mp4')).toBe(true);
    expect(esFontVideoPropia('https://socdepoble.org/media/video.webm')).toBe(true);
    expect(esFontVideoPropia('https://socdepoble.org/altres/video.mp4')).toBe(false);
  });
});
