// @vitest-environment node
/* B8-SERVIDOR · S2 (marató 261101_2143) · La paritat de les dues llistes
   blanques dels endpoints de push: la del worker (formaDeLEndpoint,
   webpush.js) i la del client (formaDeLaSubscripcio i SERVEIS_DE_PUSH,
   src/pwa/avisosPush.js, import real).
   La regla és «servidor ⊆ client»: un endpoint que el worker accepta l'ha
   d'acceptar el client, perquè si no el client no el desaria mai. A
   l'inrevés, el client només pot ser més permissiu en les etiquetes buides
   que ja coneix la spec (R6: «.push.apple.com», «a..push.apple.com»), que el
   servidor rebutja amb SDP-PUSH-003 i el client llavors desfà. Si el client
   les tanca (petició a B8-CLIENT), esta prova continua verda; si en deixa
   passar una altra, cau.
   I el tema del push (Topic) és l'etiqueta dels avisos del Xat al client i
   al worker del navegador (public/sw.js). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { ETIQUETA_AVIS_XAT, MAXIM_ENDPOINT, SERVEIS_DE_PUSH, formaDeLaSubscripcio } from '../../../src/pwa/avisosPush.js';
import { AMFITRIONS_EXACTES, SUFIXOS_ADMESOS, WEB_PUSH, formaDeLEndpoint } from './webpush.js';

const REALS = Object.freeze([
  'https://fcm.googleapis.com/fcm/send/dQw4w9WgXcQ:APA91bH-opac_0123456789',
  'https://fcm.googleapis.com/wp/opac',
  'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABl-opac',
  'https://web.push.apple.com/QGx1bGx5LW9wYWM',
  'https://wns2-par02p.notify.windows.com/w/?token=BQYAAAB%2bopac'
]);

/* Les diferències conegudes (R6): el client les accepta i el servidor no. */
const NOMES_CLIENT_CONEGUTS = new Set(['https://.push.apple.com/x', 'https://a..push.apple.com/x', 'https://.notify.windows.com/x', 'https://a..notify.windows.com/x']);

const CORPUS = Object.freeze([
  ...REALS,
  'https://push.apple.com/x',
  'https://notify.windows.com/x',
  'https://xn--pple-43d.push.apple.com/x',
  'http://fcm.googleapis.com/x',
  'https://evil.example.com/x',
  'https://fcm.googleapis.com:443/x',
  'https://fcm.googleapis.com:444/x',
  'https://u:p@fcm.googleapis.com/x',
  'https://x@fcm.googleapis.com/x',
  'https://fcm.googleapis.com/x#f',
  'https://FCM.googleapis.com/x',
  'https://FCM.GOOGLEAPIS.COM/x',
  'https://fcm.googleapis.com',
  'https://fcm.googleapis.com?x=/y',
  'https://push.apple.com.evil.com/x',
  'https://fcm.googleapis.com.evil/x',
  'https://evil.fcm.googleapis.com/x',
  'https://127.0.0.1/x',
  'https://169.254.169.254/latest',
  'https://[::1]/x',
  'https://fcm.googleapis.com/x y',
  'https://fcm.googleapis.com/x\ty',
  'https://fcm.googleapis.com/é',
  'https://fcm.googleapis.com./x',
  `https://fcm.googleapis.com/${'a'.repeat(2020)}`,
  `https://fcm.googleapis.com/${'a'.repeat(2030)}`,
  'https://evilnotify.windows.com/x',
  'https://fcm.googleapis.com\\@evil.com/x',
  'https://fcm.googleapis.com%2f@evil.com/x',
  'HTTPS://fcm.googleapis.com/x',
  ...NOMES_CLIENT_CONEGUTS
]);

const servidor = (e) => formaDeLEndpoint(e) !== null;
const client = (e) => formaDeLaSubscripcio({ endpoint: e }) !== null;

describe('servidor (webpush.js) ⊆ client (src/pwa/avisosPush.js)', () => {
  test('els serveis reals passen tots dos, amb el mateix endpoint tal qual', () => {
    for (const e of REALS) {
      expect(formaDeLEndpoint(e)?.endpoint).toBe(e);
      expect(formaDeLaSubscripcio({ endpoint: e })?.endpoint).toBe(e);
    }
  });

  test('tot el que accepta el servidor ho accepta el client', () => {
    const nomesServidor = CORPUS.filter((e) => servidor(e) && !client(e));
    expect(nomesServidor).toEqual([]);
  });

  test('el client només és més permissiu en les etiquetes buides conegudes (R6)', () => {
    const nomesClient = CORPUS.filter((e) => client(e) && !servidor(e));
    for (const e of nomesClient) expect(NOMES_CLIENT_CONEGUTS.has(e)).toBe(true);
    /* El corpus no és buit de sentit: hi ha acceptats i rebutjats pels dos. */
    expect(CORPUS.filter(servidor).length).toBeGreaterThanOrEqual(REALS.length + 3);
    expect(CORPUS.filter((e) => !client(e) && !servidor(e)).length).toBeGreaterThanOrEqual(20);
  });

  test('el mateix límit de llargària', () => {
    expect(WEB_PUSH.MAXIM_ENDPOINT).toBe(MAXIM_ENDPOINT);
    const base = 'https://fcm.googleapis.com/';
    for (const n of [MAXIM_ENDPOINT, MAXIM_ENDPOINT + 1]) {
      const e = base + 'a'.repeat(n - base.length);
      expect(servidor(e)).toBe(client(e));
    }
  });

  test('cada amfitrió de la llista del servidor el reconeix SERVEIS_DE_PUSH del client', () => {
    for (const host of AMFITRIONS_EXACTES) expect(SERVEIS_DE_PUSH.some((r) => r.test(host))).toBe(true);
    for (const sufix of SUFIXOS_ADMESOS) expect(SERVEIS_DE_PUSH.some((r) => r.test(`a${sufix}`))).toBe(true);
  });
});

describe('el tema del push és l’etiqueta dels avisos del Xat', () => {
  test('WEB_PUSH.TEMA === ETIQUETA_AVIS_XAT (client) === la de public/sw.js', () => {
    expect(WEB_PUSH.TEMA).toBe(ETIQUETA_AVIS_XAT);
    const sw = readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');
    expect(sw).toContain(`const ETIQUETA_AVIS_XAT = '${WEB_PUSH.TEMA}';`);
  });
});
