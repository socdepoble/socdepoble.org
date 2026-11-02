// @vitest-environment node
/* IDEA-60 (T1, prompt 261102_1532) · El Mode Jarvis Omnicanal d'1 Clic, sense
   React: els canals i el seu estat (derivat de plataformesEmpaquetades), la
   petició validada, els passos inicials, la lectura de la resposta del POST i
   del progrés (sdp.jarvis.publica.v1), l'ordre del terminal i la guarda de
   DEV. Casos límit: notes de 600 caràcters, canals desconeguts, cos HTML,
   status 403/404/405/409/500, schema erroni. */
import { describe, expect, test } from 'vitest';
import {
  CANALS_JARVIS, COTA_NOTES, ERROR_NOTES_BUIDES, ESQUEMA_JARVIS, INSIGNIA_PAS, MAX_NOTES, MISSATGES_JARVIS, MOTIU_FORA_DE_DEV,
  MOTIU_SENSE_FONT, PASSOS_INICIALS, RUTA_PROGRES, RUTA_PUBLICA_TOT, TITOL_PAS, canalsJarvis, canalsValids, entradetaJarvis,
  estatDelsCanals, interpretaResposta, llegixProgres, motiuDesactivat, normalitzaNotes, ordreTerminal, passosPerPintar,
  peticioPublicaTot, potPublicarDesDAci
} from './jarvis.js';
import { PLATAFORMES, SEMAFOR, normalitzaEmpaquetats, plataformesEmpaquetades } from './empaquetats.js';
import { nomenaPlataformaAliena } from '../text/perAppNativa.js';

const BRUT = Object.freeze({
  schema: 'sdp.empaquetats.v1',
  generat: '2026-11-02T16:40:00.000Z',
  canonica: '1.0.0',
  carpeta: true,
  plataformes: {
    android: { versions: ['1.0.0'], builds: ['2'], font: 'android/app/build.gradle', artefactes: ['261102_socdepoble_1.0.0+2.aab', 'socdepoble-beta.apk'] },
    ios: { versions: ['0.9.0'], builds: ['1'], font: 'ios/App/App.xcodeproj/project.pbxproj', artefactes: [] },
    pwa: { versions: ['1.0.0'], font: 'package.json', artefactes: [] },
    wordpress: { versions: ['1.1.10'], estable: '1.1.10', font: 'wordpress-plugin/socdepoble-enxufe.php', artefactes: ['261102_1612_wordpress_enxufe_v1.1.10.zip'] }
  }
});
const plataformes = () => plataformesEmpaquetades(normalitzaEmpaquetats(BRUT), '1.0.0', { nativa: false });
const progres = (canvis = {}) => ({ schema: ESQUEMA_JARVIS, estat: 'en_curs', passos: PASSOS_INICIALS(), ...canvis });

describe('els canals', () => {
  test('quatre canals en l’ordre de publicació, cada un sobre una plataforma dels empaquetats', () => {
    expect(CANALS_JARVIS.map((c) => c.id)).toEqual(['web', 'wordpress', 'android', 'ios']);
    expect(CANALS_JARVIS.map((c) => c.plataforma)).toEqual(['pwa', 'wordpress', 'android', 'ios']);
    for (const c of CANALS_JARVIS) expect(PLATAFORMES.map((p) => p.id)).toContain(c.plataforma);
    expect(Object.isFrozen(CANALS_JARVIS)).toBe(true);
    expect(RUTA_PUBLICA_TOT).toBe('/__iaia/botigues/publica-tot');
    expect(RUTA_PROGRES).toBe('/__iaia/botigues/publica-tot.json');
  });

  test('dins de l’app nativa, cap canal ni l’entradeta nomena una altra plataforma mòbil; fora, tot tal qual', () => {
    expect(canalsJarvis().map((c) => c.id)).toEqual(['web', 'wordpress', 'android', 'ios']);
    expect(canalsJarvis({ nativa: true }).map((c) => c.id)).toEqual(['web', 'wordpress', 'ios']);
    expect(nomenaPlataformaAliena(entradetaJarvis())).toBe(true);
    const dins = entradetaJarvis({ nativa: true });
    expect(nomenaPlataformaAliena(dins)).toBe(false);
    expect(dins).toBe('Un sol botó actualitza la web, el connector de WordPress i l’App Store. Escriu què hem millorat i publica.');
  });

  test('l’estat de cada canal és el semàfor de la seua plataforma, amb la versió i l’últim artefacte', () => {
    const estats = estatDelsCanals(plataformes());
    expect(estats.map((c) => [c.id, c.semafor, c.text, c.to, c.versio, c.ultim])).toEqual([
      ['web', 'font', 'Font canònica', 'neutre', '1.0.0', null],
      ['wordpress', 'alineat', 'Alineat', 'exit', '1.1.10', '261102_1612_wordpress_enxufe_v1.1.10.zip'],
      ['android', 'alineat', 'Alineat', 'exit', '1.0.0+2', '261102_socdepoble_1.0.0+2.aab'],
      ['ios', 'desfasat', 'Desfasat', 'avis', '0.9.0+1', null]
    ]);
    expect(estats.map((c) => c.nom)).toEqual(CANALS_JARVIS.map((c) => c.nom));
    for (const c of estats) expect(SEMAFOR[c.semafor]).toEqual({ text: c.text, to: c.to });
  });

  test('sense lectura (o amb una plataforma que falta), «Sense dades» i cap versió inventada', () => {
    for (const buit of [[], null, undefined, 'res']) {
      expect(estatDelsCanals(buit).map((c) => [c.semafor, c.text, c.versio, c.ultim]))
        .toEqual(Array(4).fill(['desconegut', 'Sense dades', null, null]));
    }
    const sense = estatDelsCanals(plataformes().filter((p) => p.id !== 'ios'));
    expect(sense.find((c) => c.id === 'ios')).toMatchObject({ semafor: 'desconegut', versio: null, ultim: null });
    // Un semàfor fora del vocabulari no arriba a la pantalla.
    expect(estatDelsCanals([{ id: 'pwa', semafor: 'verd', versio: '1.0.0' }])[0]).toMatchObject({ semafor: 'desconegut', versio: '1.0.0' });
    // Dins de l'app nativa, tres canals.
    expect(estatDelsCanals(plataformes(), { nativa: true }).map((c) => c.id)).toEqual(['web', 'wordpress', 'ios']);
  });
});

describe('la petició', () => {
  test('notes normalitzades, canals vàlids en l’ordre dels canals, sec booleà', () => {
    expect(peticioPublicaTot({ notes: '  Arreglem el xat.\r\n\r\n\r\nI el Mur.  \n', canals: ['ios', 'web', 'nes', 'web'], sec: true }))
      .toEqual({ schema: ESQUEMA_JARVIS, notes: 'Arreglem el xat.\nI el Mur.', canals: ['web', 'ios'], sec: true });
    expect(peticioPublicaTot({ notes: 'Res' })).toEqual({ schema: ESQUEMA_JARVIS, notes: 'Res', canals: [], sec: false });
    expect(peticioPublicaTot({ notes: 'Res', sec: 'true' }).sec).toBe(false);
    expect(peticioPublicaTot({ notes: 'Res', canals: 'web' }).canals).toEqual([]);
  });

  test('600 caràcters queden en 500; els caràcters de control, fora', () => {
    const llargues = 'a'.repeat(600);
    expect(peticioPublicaTot({ notes: llargues }).notes).toHaveLength(MAX_NOTES);
    expect(normalitzaNotes(`${'b'.repeat(499)} ${'c'.repeat(100)}`)).toHaveLength(MAX_NOTES - 1);
    expect(normalitzaNotes('Hola\u0000 \u0007món\ttab')).toBe('Hola món\ttab');
  });

  test('200.000 espais sense cap salt de línia es normalitzen en temps lineal (àrbitre T1a-ARB-05: zero ReDoS)', () => {
    const inici = performance.now();
    expect(normalitzaNotes(' '.repeat(200000))).toBe('');
    expect(normalitzaNotes(`${' '.repeat(200000)}a`)).toBe('a');
    expect(normalitzaNotes(`a${' \t'.repeat(200000)}`)).toBe('a');
    expect(normalitzaNotes(`a${' \t'.repeat(500)}\nb`)).toBe('a\nb');
    expect(normalitzaNotes(`x${'\u0000'.repeat(200000)}`)).toBe('x');
    expect(ordreTerminal({ notes: `${'\t'.repeat(200000)}x` })).toBe('npm run jarvis:publica-tot -- --notes "x"');
    expect(ordreTerminal({ notes: `x${' '.repeat(200000)}y` })).toBe('npm run jarvis:publica-tot -- --notes "x"');
    expect(performance.now() - inici).toBeLessThan(50);
    // La cota de l'entrada: res de darrere de COTA_NOTES arriba a MAX_NOTES.
    expect(COTA_NOTES).toBe(MAX_NOTES * 4);
    expect(normalitzaNotes('a'.repeat(3000))).toBe('a'.repeat(MAX_NOTES));
  });

  test('notes buides: Error en valencià', () => {
    for (const buides of ['', '   ', '\n\n', null, undefined, '\u0000']) {
      expect(() => peticioPublicaTot({ notes: buides })).toThrow(ERROR_NOTES_BUIDES);
    }
    expect(() => peticioPublicaTot()).toThrow(ERROR_NOTES_BUIDES);
  });

  test('canalsValids: desconeguts fora, duplicats fora, ordre fix', () => {
    expect(canalsValids(['android', 'android', 'web', 'tv', 42, null])).toEqual(['web', 'android']);
    expect(canalsValids(null)).toEqual([]);
  });
});

describe('els passos inicials', () => {
  test('quatre passos pendents amb títols humans numerats', () => {
    expect(PASSOS_INICIALS()).toEqual([
      { id: 'web', canal: 'web', titol: '1/4 Web al dia', estat: 'pendent' },
      { id: 'wordpress', canal: 'wordpress', titol: '2/4 WordPress al dia', estat: 'pendent' },
      { id: 'android', canal: 'android', titol: '3/4 Google Play i APK enviats', estat: 'pendent' },
      { id: 'ios', canal: 'ios', titol: '4/4 Apple enviat', estat: 'pendent' }
    ]);
    expect(Object.keys(TITOL_PAS)).toEqual(CANALS_JARVIS.map((c) => c.id));
  });

  test('un subconjunt es numera sobre el seu total; els desconeguts no compten; cap de vàlid vol dir tots', () => {
    expect(PASSOS_INICIALS(['ios', 'web', 'nes']).map((p) => p.titol)).toEqual(['1/2 Web al dia', '2/2 Apple enviat']);
    expect(PASSOS_INICIALS(['nes'])).toHaveLength(4);
    expect(PASSOS_INICIALS(canalsJarvis({ nativa: true }).map((c) => c.id)).map((p) => p.titol))
      .toEqual(['1/3 Web al dia', '2/3 WordPress al dia', '3/3 Apple enviat']);
  });

  test('dins de l’app nativa es pinten només els passos que no nomenen cap altra plataforma; fora, tots', () => {
    const tots = PASSOS_INICIALS();
    expect(passosPerPintar(tots)).toBe(tots);
    expect(passosPerPintar(tots, { nativa: true }).map((p) => p.id)).toEqual(['web', 'wordpress', 'ios']);
    const ambDetall = [{ id: 'ios', canal: 'ios', titol: '4/4 Apple enviat', estat: 'error', detall: 'Abans cal l’APK' }];
    expect(passosPerPintar(ambDetall, { nativa: true })).toEqual([]);
    expect(passosPerPintar(null, { nativa: true })).toEqual([]);
  });

  test('cada estat d’un pas té insígnia amb text i to d’Insignia', () => {
    expect(INSIGNIA_PAS).toEqual({
      pendent: { text: 'Pendent', to: 'neutre' },
      en_curs: { text: 'En curs', to: 'info' },
      fet: { text: 'Fet', to: 'exit' },
      error: { text: 'Error', to: 'error' }
    });
  });
});

describe('llegixProgres', () => {
  test('normalitza un progrés ben format (títols i detalls retallats d’espais)', () => {
    const cos = progres({ estat: 'fet', passos: [{ id: 'web', canal: 'web', titol: ' 1/4 Web al dia ', estat: 'fet', detall: ' dist/ al dia ' }, { id: 'ios', canal: 'ios', titol: '2/2 Apple enviat', estat: 'error', detall: '' }] });
    expect(llegixProgres(cos)).toEqual({
      estat: 'fet',
      passos: [
        { id: 'web', canal: 'web', titol: '1/4 Web al dia', estat: 'fet', detall: 'dist/ al dia' },
        { id: 'ios', canal: 'ios', titol: '2/2 Apple enviat', estat: 'error' }
      ]
    });
    expect(llegixProgres(progres({ passos: [] }))).toEqual({ estat: 'en_curs', passos: [] });
  });

  test.each([
    ['arrel', null], ['arrel', 'text'], ['arrel', []],
    ['schema', progres({ schema: 'sdp.jarvis.publica.v2' })],
    ['schema', { estat: 'fet', passos: [] }],
    ['estat', progres({ estat: 'pendent' })],
    ['passos', progres({ passos: 'cap' })],
    ['passos', progres({ passos: Array(17).fill({ id: 'web', canal: 'web', titol: 'x', estat: 'fet' }) })],
    ['passos[0]', progres({ passos: [null] })],
    ['passos[0].id', progres({ passos: [{ id: 'Web Gran', canal: 'web', titol: 'x', estat: 'fet' }] })],
    ['passos[0].canal', progres({ passos: [{ id: 'tv', canal: 'tv', titol: 'x', estat: 'fet' }] })],
    ['passos[0].titol', progres({ passos: [{ id: 'web', canal: 'web', titol: '   ', estat: 'fet' }] })],
    ['passos[0].titol', progres({ passos: [{ id: 'web', canal: 'web', titol: 'x'.repeat(121), estat: 'fet' }] })],
    ['passos[0].estat', progres({ passos: [{ id: 'web', canal: 'web', titol: 'x', estat: 'ok' }] })],
    ['passos[0].detall', progres({ passos: [{ id: 'web', canal: 'web', titol: 'x', estat: 'fet', detall: 'd'.repeat(301) }] })],
    ['passos[0].detall', progres({ passos: [{ id: 'web', canal: 'web', titol: 'x', estat: 'fet', detall: 7 }] })],
    ['passos.id', progres({ passos: [{ id: 'web', canal: 'web', titol: 'x', estat: 'fet' }, { id: 'web', canal: 'ios', titol: 'y', estat: 'fet' }] })]
  ])('falla amb «%s» si la forma no és la de l’esquema', (camp, cos) => {
    expect(() => llegixProgres(cos)).toThrow(`Progrés del corredor Jarvis invàlid: ${camp}.`);
  });
});

describe('interpretaResposta', () => {
  const JSON_TIPUS = 'application/json; charset=utf-8';
  const HTML = '<!doctype html><html><head><title>Sóc de Poble</title></head><body><div id="root"></div></body></html>';

  test('202 JSON amb l’esquema → iniciat, amb els passos del cos', () => {
    const cos = JSON.stringify(progres({ passos: [{ id: 'web', canal: 'web', titol: '1/4 Web al dia', estat: 'en_curs' }] }));
    expect(interpretaResposta({ status: 202, contentType: JSON_TIPUS, cos })).toEqual({
      estat: 'iniciat',
      passos: [{ id: 'web', canal: 'web', titol: '1/4 Web al dia', estat: 'en_curs' }],
      missatge: MISSATGES_JARVIS.iniciat
    });
    // Un objecte ja llegit també val; sense passos ben formats, iniciat sense passos.
    expect(interpretaResposta({ status: 202, contentType: JSON_TIPUS, cos: { schema: ESQUEMA_JARVIS, estat: 'en_curs' } }))
      .toEqual({ estat: 'iniciat', missatge: MISSATGES_JARVIS.iniciat });
  });

  test('404, 405 o un cos que no és JSON (l’HTML de l’SPA) → sense corredor, amb el text de l’ordre', () => {
    const esperat = { estat: 'sense-corredor', missatge: 'Este servidor no porta el corredor Jarvis. Executa-ho al terminal:' };
    expect(interpretaResposta({ status: 404, contentType: 'text/html', cos: HTML })).toEqual(esperat);
    expect(interpretaResposta({ status: 405, contentType: JSON_TIPUS, cos: '{}' })).toEqual(esperat);
    expect(interpretaResposta({ status: 200, contentType: 'text/html; charset=utf-8', cos: HTML })).toEqual(esperat);
    expect(interpretaResposta({ status: 200, contentType: '', cos: HTML })).toEqual(esperat);
    expect(interpretaResposta({ status: 202, contentType: JSON_TIPUS, cos: '{"schema": ' })).toEqual(esperat);
    expect(interpretaResposta({ status: 202, contentType: JSON_TIPUS, cos: '[1]' })).toEqual(esperat);
    expect(interpretaResposta({ status: 202, contentType: 'text/html', cos: JSON.stringify(progres()) })).toEqual(esperat);
    expect(interpretaResposta()).toEqual(esperat);
  });

  test('403 → no-local, abans que res', () => {
    expect(interpretaResposta({ status: 403, contentType: 'text/plain', cos: 'Forbidden' }))
      .toEqual({ estat: 'no-local', missatge: MISSATGES_JARVIS['no-local'] });
    expect(interpretaResposta({ status: 403, contentType: JSON_TIPUS, cos: JSON.stringify(progres()) }).estat).toBe('no-local');
  });

  test('la resta → error amb el text fix: 500, 400, un 202 amb schema erroni, un 200 JSON, i 409 el del corredor ocupat', () => {
    const error = { estat: 'error', missatge: MISSATGES_JARVIS.error };
    expect(interpretaResposta({ status: 500, contentType: JSON_TIPUS, cos: '{"schema":"sdp.jarvis.publica.v1","codi":"intern","error":"/Users/algu/secret"}' })).toEqual(error);
    expect(interpretaResposta({ status: 400, contentType: JSON_TIPUS, cos: '{"error":"notes"}' })).toEqual(error);
    expect(interpretaResposta({ status: 202, contentType: JSON_TIPUS, cos: JSON.stringify(progres({ schema: 'sdp.jarvis.v0' })) })).toEqual(error);
    expect(interpretaResposta({ status: 200, contentType: JSON_TIPUS, cos: JSON.stringify(progres()) })).toEqual(error);
    expect(interpretaResposta({ status: 409, contentType: JSON_TIPUS, cos: '{"error":"ocupat"}' })).toEqual({ estat: 'error', missatge: MISSATGES_JARVIS.ocupat });
    // Cap text del servidor arriba al missatge.
    for (const m of Object.values(MISSATGES_JARVIS)) expect(m).not.toMatch(/\/Users|secret/);
  });
});

describe('ordreTerminal i la guarda de DEV', () => {
  test('l’ordre del terminal: una línia, sense cometes dobles ni res que l’intèrpret expandisca', () => {
    expect(ordreTerminal({ notes: 'Arreglem el xat' })).toBe('npm run jarvis:publica-tot -- --notes "Arreglem el xat"');
    expect(ordreTerminal({ notes: 'Diu "hola"\n\ni `ls` amb $HOME i \\ fi' })).toBe('npm run jarvis:publica-tot -- --notes "Diu hola i ls amb HOME i fi"');
    expect(ordreTerminal({ notes: 'x'.repeat(600) })).toBe(`npm run jarvis:publica-tot -- --notes "${'x'.repeat(MAX_NOTES)}"`);
    expect(ordreTerminal()).toBe('npm run jarvis:publica-tot -- --notes ""');
  });

  test('potPublicarDesDAci: només DEV amb font viva, i mai fora de DEV', () => {
    expect(potPublicarDesDAci({ dev: true, fontViva: true })).toBe(true);
    expect(potPublicarDesDAci({ dev: true, fontViva: false })).toBe(false);
    expect(potPublicarDesDAci({ dev: false, fontViva: true })).toBe(false);
    expect(potPublicarDesDAci({ dev: 'true', fontViva: true })).toBe(false);
    expect(potPublicarDesDAci({ dev: true, fontViva: 1 })).toBe(false);
    expect(potPublicarDesDAci()).toBe(false);
  });

  test('motiuDesactivat diu per què, en l’ordre: DEV, font viva, notes; i null quan es pot publicar', () => {
    expect(motiuDesactivat({ dev: false, fontViva: true, notes: 'x' })).toBe(MOTIU_FORA_DE_DEV);
    expect(motiuDesactivat({ dev: true, fontViva: false, notes: 'x' })).toBe(MOTIU_SENSE_FONT);
    expect(motiuDesactivat({ dev: true, fontViva: true, notes: '  ' })).toBe(ERROR_NOTES_BUIDES);
    expect(motiuDesactivat({ dev: true, fontViva: true, notes: 'Arreglem el xat' })).toBeNull();
    expect(nomenaPlataformaAliena([MOTIU_FORA_DE_DEV, MOTIU_SENSE_FONT, ERROR_NOTES_BUIDES, ...Object.values(MISSATGES_JARVIS)].join(' '))).toBe(false);
  });

  test('motiuDesactivat és potPublicarDesDAci amb paraules: amb notes, es pot publicar exactament quan la guarda ho diu (àrbitre T1a-ARB-04)', () => {
    for (const dev of [true, false, 'true', undefined]) {
      for (const fontViva of [true, false, 1, undefined]) {
        expect(motiuDesactivat({ dev, fontViva, notes: 'x' }) === null).toBe(potPublicarDesDAci({ dev, fontViva }));
      }
    }
  });
});
