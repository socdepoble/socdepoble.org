import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';

/* P1-35 (pla 261028_1526 §3.5.2; decisió 6 del Mestre) · Empaquetats i
   llançament, sense React: el nom d'un artefacte es llig sense obrir-lo, la
   resposta del middleware es valida (cap text de la font arriba a una ordre
   sense passar la regla de les versions), cada plataforma porta el seu
   semàfor contra la Versió Canònica del Sistema (WordPress, contra el seu
   canal: numeració pròpia; la web és la font i no compta), l'ordre de
   publicar és l'exacta dels scripts, amb les seues regles, i fora de DEV no
   hi ha cap petició. */
import {
  ESQUEMA_EMPAQUETATS, FONT_EMPAQUETATS, PLATAFORMES, REGLES_ORDRE, RUTA_EMPAQUETATS, SEMAFOR, carregaEmpaquetats,
  canonicaDesfasada, cobertaEmpaquetats, esRutaEmpaquetats, fitxerDeLOrdre, llegixArtefacte, normalitzaEmpaquetats,
  ordrePublicacio, paginaEmpaquetats, plataformesEmpaquetades
} from './empaquetats.js';
import { ETIQUETES } from './consolaPagines.js';
import { VERSIO_SISTEMA } from '../../config/versio.js';

/* La carpeta de builds i les versions declarades tal com eren el 261028. */
const BRUT = Object.freeze({
  schema: 'sdp.empaquetats.v1',
  generat: '2026-10-28T16:30:00.000Z',
  canonica: '1.0.0',
  carpeta: true,
  plataformes: {
    android: { versions: ['1.0.0'], builds: ['1'], font: 'android/app/build.gradle', artefactes: ['socdepoble-beta.apk', '261023_socdepoble_1.0.0+1.aab'] },
    ios: { versions: ['1.0.0'], builds: ['1'], font: 'ios/App/App.xcodeproj/project.pbxproj', artefactes: ['261024_socdepoble_1.0.0+1.xcarchive'] },
    pwa: { versions: ['1.0.0'], font: 'package.json', artefactes: [] },
    wordpress: {
      versions: ['1.1.9'], estable: '1.1.9', font: 'wordpress-plugin/socdepoble-enxufe.php',
      artefactes: [
        '261021_2015_wordpress_enxufe_v1.1.9.zip', '261021_0313_wordpress_enxufe_v1.1.8.zip',
        '261022_031343_wordpress_enxufe_v1.1.10-beta.2_intermedi.zip', '261022_0146_informe_validacio_mitjans_wordpress.json'
      ]
    }
  }
});
const amb = (canvis) => ({ ...BRUT, plataformes: { ...BRUT.plataformes, ...canvis } });
/* Els scripts que reben les ordres, llegits com a text: la Consola no els importa. */
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const ORDRE_WP = (v) => `SDP_RELEASE=1 SDP_VERSIO=${v} npm run build:wp && SDP_RELEASE=1 SDP_VERSIO=${v} npm run build:wp:directori && `
  + 'node wordpress-plugin/eines/empaqueta.mjs --url-base https://github.com/socdepoble/socdepoble.org/releases/download/enxufe-v{versio}/ --clau ~/.sdp/enxufe-ed25519.pem';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('el nom d’un artefacte', () => {
  test.each([
    ['261023_socdepoble_1.0.0+1.aab', { tipus: 'aab', data: '261023', hora: null, producte: 'socdepoble', versio: '1.0.0', build: '1', nota: null }],
    ['261024_socdepoble_1.0.0+1.xcarchive', { tipus: 'xcarchive', data: '261024', versio: '1.0.0', build: '1' }],
    ['261021_2015_wordpress_directori_v1.1.9.zip', { tipus: 'zip', data: '261021', hora: '2015', producte: 'wordpress_directori', versio: '1.1.9', build: null }],
    ['261021_2015_estatic_spa_v1.1.9.zip', { producte: 'estatic_spa', versio: '1.1.9' }],
    ['261022_0150_wordpress_enxufe_v1.1.10-beta.1.zip', { hora: '0150', versio: '1.1.10-beta.1', nota: null }],
    ['261022_030917_wordpress_enxufe_v1.1.10-beta.1_pre_gauntlet.zip', { hora: '030917', versio: '1.1.10-beta.1', nota: 'pre_gauntlet' }]
  ])('%s', (nom, esperat) => {
    expect(llegixArtefacte(nom)).toMatchObject({ nom, ...esperat });
  });

  test('un artefacte sense la forma del calendari es conserva, sense versió; el que no és artefacte, no', () => {
    expect(llegixArtefacte('socdepoble-beta.apk')).toEqual({ nom: 'socdepoble-beta.apk', tipus: 'apk', data: null, hora: null, producte: null, versio: null, build: null, nota: null });
    for (const nom of ['261022_0146_informe_validacio_mitjans_wordpress.json', '261022_031343_wordpress_beta2_build.log', 'README.md', '', null, 7]) {
      expect(llegixArtefacte(nom), String(nom)).toBeNull();
    }
    expect(llegixArtefacte(`${'a'.repeat(201)}.zip`)).toBeNull();
  });
});

describe('la resposta del middleware', () => {
  test('es valida i ordena els artefactes, el més recent primer; els que no ho són, fora', () => {
    const net = normalitzaEmpaquetats(BRUT);
    expect(net).toMatchObject({ generat: BRUT.generat, canonica: '1.0.0', carpeta: true });
    expect(Object.keys(net.plataformes)).toEqual(PLATAFORMES.map((p) => p.id));
    expect(net.plataformes.android.artefactes.map((a) => a.nom)).toEqual(['261023_socdepoble_1.0.0+1.aab', 'socdepoble-beta.apk']);
    expect(net.plataformes.wordpress.artefactes.map((a) => a.nom)).toEqual([
      '261022_031343_wordpress_enxufe_v1.1.10-beta.2_intermedi.zip', '261021_2015_wordpress_enxufe_v1.1.9.zip', '261021_0313_wordpress_enxufe_v1.1.8.zip'
    ]);
    expect(net.plataformes.pwa).toEqual({ versions: ['1.0.0'], builds: [], estable: null, font: 'package.json', artefactes: [] });
  });

  test('una plataforma que no ve no s’inventa: sense versions ni artefactes', () => {
    const { plataformes, ...resta } = BRUT;
    const net = normalitzaEmpaquetats({ ...resta, plataformes: { android: plataformes.android } });
    expect(net.plataformes.ios).toEqual({ versions: [], builds: [], estable: null, font: null, artefactes: [] });
  });

  test.each([
    ['sense objecte', null, 'arrel'],
    ['un altre esquema', { ...BRUT, schema: 'sdp.mapa.v1' }, 'schema'],
    ['data invàlida', { ...BRUT, generat: 'ahir' }, 'generat'],
    ['canònica invàlida', { ...BRUT, canonica: 'v1' }, 'canonica'],
    ['plataformes en llista', { ...BRUT, plataformes: [] }, 'plataformes'],
    // Una versió o un build amb text de shell no arriba mai a una ordre.
    ['versió amb shell', amb({ android: { versions: ['1.0.0; rm -rf ~'] } }), 'android.versions'],
    ['build amb shell', amb({ ios: { versions: ['1.0.0'], builds: ['1 && curl x'] } }), 'ios.builds'],
    ['canal invàlid', amb({ wordpress: { versions: ['1.1.9'], estable: '$(id)' } }), 'wordpress.estable'],
    ['artefactes que no són text', amb({ android: { versions: ['1.0.0'], artefactes: [{ nom: 'x' }] } }), 'android.artefactes']
  ])('rebutja %s', (_nom, brut, camp) => {
    expect(() => normalitzaEmpaquetats(brut)).toThrow(`Resposta d’empaquetats invàlida: ${camp}.`);
  });
});

describe('el semàfor de cada plataforma', () => {
  test('el 261028: totes al pas, WordPress contra el seu canal estable i la web, que és la font, sense semàfor', () => {
    const plataformes = plataformesEmpaquetades(normalitzaEmpaquetats(BRUT), '1.0.0');
    expect(plataformes.map((p) => [p.id, p.semafor, p.versio, p.build])).toEqual([
      ['android', 'alineat', '1.0.0', '1'], ['ios', 'alineat', '1.0.0', '1'], ['pwa', 'font', '1.0.0', null], ['wordpress', 'alineat', '1.1.9', null]
    ]);
    const [android, , pwa, wordpress] = plataformes;
    expect(android.motiu).toBe('Declara 1.0.0, la Versió Canònica del Sistema.');
    expect(wordpress.motiu).toBe('La capçalera i el canal estable diuen 1.1.9. El connector porta numeració pròpia.');
    /* La web declara la de package.json, la font de la canònica: no es pot
       desfasar de si mateixa, i la desplegada no es mesura. Mai «Alineat». */
    expect([pwa.pista, SEMAFOR[pwa.semafor]]).toEqual(['font', { text: 'Font canònica', to: 'neutre' }]);
    expect(pwa.motiu).toBe('Declara 1.0.0, la de package.json, que és la font de la Versió Canònica del Sistema. La versió desplegada a socdepoble.org no es mesura, i no compta al recompte.');
    expect(plataformesEmpaquetades(normalitzaEmpaquetats(BRUT), '2.0.0')[2].semafor).toBe('font');
    // L'últim artefacte: el de la versió declarada a Android; a WordPress, una beta posterior.
    expect([android.ultim.nom, android.alDia]).toEqual(['261023_socdepoble_1.0.0+1.aab', true]);
    expect([wordpress.ultim.versio, wordpress.alDia]).toEqual(['1.1.10-beta.2', false]);
    expect([pwa.ultim, pwa.alDia]).toEqual([null, false]);
  });

  test('desfasat: una versió que no és la canònica, dues versions a la vegada o un canal que no és la capçalera', () => {
    const [android, ios, , wordpress] = plataformesEmpaquetades(normalitzaEmpaquetats(amb({
      android: { versions: ['1.0.1'], builds: ['2'] },
      ios: { versions: ['1.0.0'], builds: ['1', '2'] },
      wordpress: { versions: ['1.1.10'], estable: '1.1.9' }
    })), '1.0.0');
    expect([android.semafor, android.motiu]).toEqual(['desfasat', 'Declara 1.0.1 i la Versió Canònica del Sistema és 1.0.0.']);
    expect([ios.semafor, ios.motiu, ios.build]).toEqual(['desfasat', 'Declara més d’una versió a la vegada: 1.0.0, build 1, build 2.', null]);
    expect([wordpress.semafor, wordpress.motiu]).toEqual(['desfasat', 'La capçalera diu 1.1.10 i el canal estable, 1.1.9.']);
  });

  test('dues versions declarades a la vegada, amb un sol build: desfasat, sense versió triada ni ordre', () => {
    const [, ios] = plataformesEmpaquetades(normalitzaEmpaquetats(amb({ ios: { versions: ['1.0.0', '1.0.1'], builds: ['1'] } })), '1.0.0');
    expect([ios.semafor, ios.motiu, ios.versio, ios.build, ios.ordre]).toEqual(['desfasat', 'Declara més d’una versió a la vegada: 1.0.0, 1.0.1, build 1.', null, '1', null]);
  });

  test('la versió es compara sencera: un sufix no és la canònica', () => {
    const [android, , , wordpress] = plataformesEmpaquetades(normalitzaEmpaquetats(amb({
      android: { versions: ['1.0.0-rc.1'], builds: ['1'] },
      wordpress: { versions: ['1.1.9-beta.1'], estable: '1.1.9' }
    })), '1.0.0');
    expect([android.semafor, android.motiu]).toEqual(['desfasat', 'Declara 1.0.0-rc.1 i la Versió Canònica del Sistema és 1.0.0.']);
    expect(wordpress.semafor).toBe('desfasat');
  });

  test('al dia: el build del nom també compta; un nom sense build no el contradiu', () => {
    const ambArtefacte = (nom) => plataformesEmpaquetades(normalitzaEmpaquetats(amb({
      android: { versions: ['1.0.0'], builds: ['1'], artefactes: [nom] }
    })), '1.0.0')[0];
    expect(ambArtefacte('261029_socdepoble_1.0.0+2.aab')).toMatchObject({ alDia: false, ultim: { versio: '1.0.0', build: '2' } });
    expect(ambArtefacte('261029_socdepoble_1.0.1+1.aab').alDia).toBe(false);
    expect(ambArtefacte('261029_socdepoble_1.0.0.aab').alDia).toBe(true);
    expect(ambArtefacte('261029_socdepoble_1.0.0+1.aab').alDia).toBe(true);
  });

  test('sense dades: cap versió declarada, o el connector sense canal', () => {
    const plataformes = plataformesEmpaquetades(normalitzaEmpaquetats(amb({ ios: {}, wordpress: { versions: ['1.1.9'] } })), '1.0.0');
    const perId = Object.fromEntries(plataformes.map((p) => [p.id, p]));
    expect([perId.ios.semafor, perId.ios.motiu, perId.ios.ordre]).toEqual(['desconegut', 'No s’ha trobat cap versió declarada.', null]);
    expect([perId.wordpress.semafor, perId.wordpress.motiu]).toEqual(['desconegut', 'Declara 1.1.9, però no s’ha trobat el canal estable.']);
    expect(plataformesEmpaquetades(null)).toEqual([]);
  });

  test('per defecte, la canònica és la de config/versio.js; si el servidor en llig una altra, cal recarregar', () => {
    const net = normalitzaEmpaquetats(BRUT);
    expect(plataformesEmpaquetades(net)[0].semafor).toBe(VERSIO_SISTEMA === '1.0.0' ? 'alineat' : 'desfasat');
    expect(canonicaDesfasada(net, '1.0.0')).toBe(false);
    expect(canonicaDesfasada(net, '1.0.1')).toBe(true);
    expect(canonicaDesfasada(null)).toBe(false);
  });
});

describe('l’ordre per a publicar', () => {
  test('Android i iOS: la pujada amb --confirma=VERSIO+BUILD, exacta', () => {
    expect(ordrePublicacio('android', { versio: '1.0.0', build: '1' }))
      .toBe('node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 1 --confirma=1.0.0+1');
    expect(ordrePublicacio('ios', { versio: '1.0.0', build: '1' }))
      .toBe('node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 1 --confirma=1.0.0+1');
    // Sense build no hi ha confirmació possible: cap ordre.
    expect(ordrePublicacio('android', { versio: '1.0.0', build: null })).toBeNull();
  });

  test('Android i iOS: cap ordre que el script rebutjaria (un sufix, un build 0 o amb zeros davant)', () => {
    for (const id of ['android', 'ios']) {
      for (const [versio, build] of [['1.0.1-beta.1', '1'], ['1.0.0', '0'], ['1.0.0', '007'], ['1.0.0', '1234567890']]) {
        expect(ordrePublicacio(id, { versio, build }), `${id} ${versio}+${build}`).toBeNull();
        expect(fitxerDeLOrdre(id, { versio, build }), `${id} ${versio}+${build}`).toBeNull();
      }
      expect(ordrePublicacio(id, { versio: '10.20.30', build: '123456789' })).toContain('--confirma=10.20.30+123456789');
    }
  });

  test('les regles de les ordres són les dels scripts que les reben', () => {
    const entorn = llig('scripts/botigues/entorn.mjs');
    expect(entorn.match(/^export const VERSIO = \/(.+)\/;$/m)?.[1]).toBe(REGLES_ORDRE.versioBotiga.source);
    expect(entorn.match(/^export const BUILD = \/(.+)\/;$/m)?.[1]).toBe(REGLES_ORDRE.buildBotiga.source);
    for (const ruta of ['vite.standalone.config.js', 'wordpress-plugin/eines/empaqueta.mjs']) {
      const text = llig(ruta);
      expect(text.match(/^const SEMVER = \/(.+)\/;$/m)?.[1], ruta).toBe(REGLES_ORDRE.versioConnector.source);
      expect(text, ruta).toContain(`/${REGLES_ORDRE.desenvolupament.source}/.test(`);
    }
    // Els dos scripts de pujada validen amb eixes dues regles d'entorn.mjs.
    for (const script of ['scripts/botigues/puja-android.mjs', 'scripts/botigues/puja-ios.mjs']) {
      const text = llig(script);
      const importats = text.match(/import \{([^}]+)\} from '\.\/entorn\.mjs'/)?.[1].split(',').map((nom) => nom.trim());
      expect(importats, script).toEqual(expect.arrayContaining(['VERSIO', 'BUILD']));
      expect(text, script).toContain("!VERSIO.test(versio ?? '') || !BUILD.test(build ?? '')");
    }
  });

  test('WordPress: les dues variants i el canal signat, en l’ordre del --ajuda d’empaqueta.mjs; la web, cap ordre inventada', () => {
    expect(ordrePublicacio('wordpress', { versio: '1.1.9' })).toBe(ORDRE_WP('1.1.9'));
    expect(ordrePublicacio('wordpress', { versio: '1.1.10-beta.1' })).toBe(ORDRE_WP('1.1.10-beta.1'));
    // empaqueta.mjs refusa una versió de desenvolupament, i el build, un SemVer mal format.
    for (const versio of ['1.1.10-dev', '1.1.10-dev.1', '1.1.10-a..b', '1.1.10-.']) expect(ordrePublicacio('wordpress', { versio }), versio).toBeNull();
    expect(fitxerDeLOrdre('wordpress', { versio: '1.1.9' })).toBeNull();
    /* Els passos 1 i 2 de l'ajuda, amb les continuacions de línia unides: si
       el script canvia de recepta, esta prova cau abans que l'ordre. */
    const ajuda = llig('wordpress-plugin/eines/empaqueta.mjs').replace(/ \\\\\n\s*/g, ' ');
    const passos = ORDRE_WP('0.2.0').split(' && ');
    expect(passos).toHaveLength(3);
    const posicions = passos.map((pas) => ajuda.indexOf(pas));
    expect(posicions.every((p) => p >= 0), JSON.stringify(passos)).toBe(true);
    expect([...posicions].sort((a, b) => a - b)).toEqual(posicions);
    expect(ajuda.indexOf(`${passos[1]}\n`)).toBeGreaterThan(-1);
    const { scripts } = JSON.parse(llig('package.json'));
    expect(Object.keys(scripts)).toEqual(expect.arrayContaining(['build:wp', 'build:wp:directori']));
    expect(ordrePublicacio('pwa', { versio: '1.0.0' })).toBeNull();
    const [, , pwa] = plataformesEmpaquetades(normalitzaEmpaquetats(BRUT), '1.0.0');
    expect(pwa.nota).toBe('El desplegament de socdepoble.org no té cap script al repositori: la Consola no n’inventa l’ordre.');
  });

  test('el fitxer que puja cada ordre és el dels scripts, no cap artefacte de la carpeta de builds', () => {
    const aab = fitxerDeLOrdre('android', { versio: '1.0.0', build: '1' });
    const peces = llig('scripts/botigues/puja-android.mjs').match(/^export const AAB = Object\.freeze\(\[([^\]]+)\]\);$/m)?.[1];
    expect(aab).toBe(peces.split(',').map((p) => p.trim().replace(/^'|'$/g, '')).join('/'));
    expect(fitxerDeLOrdre('ios', { versio: '1.0.0', build: '1' })).toBe('<SDP_BUILDS_DIR>/sdp-ios-1.0.0-1/export/*.ipa');
    const ios = llig('scripts/botigues/puja-ios.mjs');
    expect(ios).toContain("rutaDe(arrel, valors, 'SDP_BUILDS_DIR'), `sdp-ios-${versio}-${build}`");
    expect(ios).toContain("path.join(carpeta, 'export')");
    expect(fitxerDeLOrdre('android', { versio: '1.0.0', build: null })).toBeNull();
    expect(fitxerDeLOrdre('pwa', { versio: '1.0.0' })).toBeNull();
    const [android, ios1, pwa] = plataformesEmpaquetades(normalitzaEmpaquetats(BRUT), '1.0.0');
    expect([android.fitxer, ios1.fitxer, pwa.fitxer]).toEqual([aab, '<SDP_BUILDS_DIR>/sdp-ios-1.0.0-1/export/*.ipa', null]);
    expect(ios1.nota).toMatch(/^Primer, la mateixa ordre amb --compila en lloc de --confirma arxiva i exporta l’IPA/);
  });

  test('una versió o un build fora de la regla no fa cap ordre', () => {
    for (const versio of ['1.0', 'v1.0.0', '1.0.0 ; id', '', undefined]) expect(ordrePublicacio('android', { versio, build: '1' }), String(versio)).toBeNull();
    expect(ordrePublicacio('ios', { versio: '1.0.0', build: '1;id' })).toBeNull();
    expect(ordrePublicacio('desconeguda', { versio: '1.0.0', build: '1' })).toBeNull();
  });
});

describe('la targeta del tauler', () => {
  test('sense font, diu per què, amb el semàfor de la Consola', () => {
    expect(cobertaEmpaquetats(null, 'absent')).toEqual({ dada: 'Empaquetats no disponibles en este entorn', etiquetes: [ETIQUETES.senseFont] });
    expect(cobertaEmpaquetats(null, 'loading')).toEqual({ dada: 'Llegint els empaquetats…', etiquetes: [ETIQUETES.senseFont] });
    expect(cobertaEmpaquetats(null, 'error')).toEqual({ dada: 'No s’han pogut llegir els empaquetats', etiquetes: [ETIQUETES.reparar] });
  });

  test('amb font, quantes van al pas (la web, que és la font, no hi compta); En ordre només si hi van totes', () => {
    expect(cobertaEmpaquetats(normalitzaEmpaquetats(BRUT), 'ready', '1.0.0')).toEqual({ dada: 'v1.0.0 · 3 de 3 al pas', etiquetes: [ETIQUETES.enOrdre] });
    const desfasada = normalitzaEmpaquetats(amb({ android: { versions: ['1.0.1'], builds: ['2'] } }));
    expect(cobertaEmpaquetats(desfasada, 'ready', '1.0.0')).toEqual({ dada: 'v1.0.0 · 2 de 3 al pas · 1 desfasada', etiquetes: [ETIQUETES.important] });
    expect(cobertaEmpaquetats(normalitzaEmpaquetats(BRUT), 'ready', '1.0.1').etiquetes).toEqual([ETIQUETES.important]);
    // Una plataforma sense dades no desfasa, però tampoc va al pas: Important.
    expect(cobertaEmpaquetats(normalitzaEmpaquetats(amb({ ios: {} })), 'ready', '1.0.0')).toEqual({ dada: 'v1.0.0 · 2 de 3 al pas', etiquetes: [ETIQUETES.important] });
    // La web sense dades tampoc no compta: no és cap de les que es poden desfasar.
    expect(cobertaEmpaquetats(normalitzaEmpaquetats(amb({ pwa: {} })), 'ready', '1.0.0')).toEqual({ dada: 'v1.0.0 · 3 de 3 al pas', etiquetes: [ETIQUETES.enOrdre] });
  });

  test('la pàgina i la seua ruta', () => {
    expect(paginaEmpaquetats()).toMatchObject({ id: 'empaquetats', ruta: RUTA_EMPAQUETATS, title: 'Versions i empaquetats' });
    expect(paginaEmpaquetats().subtitle).toMatch(/^Per a /);
    expect(RUTA_EMPAQUETATS).toBe('/consola/empaquetats');
    for (const comodi of ['empaquetats', '/empaquetats/', 'empaquetats/']) expect(esRutaEmpaquetats(comodi), comodi).toBe(true);
    for (const comodi of ['', 'pols', 'empaquetats/android', 'govern/empaquetats', null, undefined]) expect(esRutaEmpaquetats(comodi), String(comodi)).toBe(false);
  });
});

describe('la lectura', () => {
  const resposta = (status, cos, tipus = 'application/json') => ({
    status, ok: status >= 200 && status < 300, statusText: String(status), headers: { get: () => tipus }, json: async () => cos
  });

  test('fora de DEV no demana res', async () => {
    vi.stubEnv('DEV', false);
    const peticio = vi.fn();
    vi.stubGlobal('fetch', peticio);
    await expect(carregaEmpaquetats()).resolves.toBeNull();
    expect(peticio).not.toHaveBeenCalled();
  });

  test('en DEV: la resposta normalitzada; 404 o l’HTML de l’aplicació és absència; un 500, error', async () => {
    vi.stubEnv('DEV', true);
    const peticio = vi.fn(async () => resposta(200, BRUT));
    vi.stubGlobal('fetch', peticio);
    await expect(carregaEmpaquetats()).resolves.toEqual(normalitzaEmpaquetats(BRUT));
    expect(peticio.mock.calls[0][0]).toBe(FONT_EMPAQUETATS);
    expect(peticio.mock.calls[0][1]).toMatchObject({ cache: 'no-store' });
    peticio.mockImplementationOnce(async () => resposta(404, null));
    await expect(carregaEmpaquetats()).resolves.toBeNull();
    peticio.mockImplementationOnce(async () => resposta(200, null, 'text/html'));
    await expect(carregaEmpaquetats()).resolves.toBeNull();
    peticio.mockImplementationOnce(async () => resposta(500, null));
    await expect(carregaEmpaquetats()).rejects.toThrow('Empaquetats 500');
    peticio.mockImplementationOnce(async () => resposta(200, { ...BRUT, schema: 'x' }));
    await expect(carregaEmpaquetats()).rejects.toThrow('schema');
    expect(ESQUEMA_EMPAQUETATS).toBe('sdp.empaquetats.v1');
  });
});
