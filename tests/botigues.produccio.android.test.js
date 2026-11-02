// @vitest-environment node
/* B9 (marató 261101_2143, spec B9-BOTIGUES §3.1.3 i §3.1.6.2) · puja-android.mjs amb --canal produccio:
   guardes abans de tocar res, pista production SEMPRE en esborrany, «sí» lligat al canal i al sha256 de
   l'AAB, verificació en sec quan el Mestre ja ha signat l'AAB (ARB-B9-04), registre de pujades després
   de la pujada i el canal intern com sempre. Cap eina real: el preflight i executa (keytool, fastlane)
   són simulats; l'AAB, el registre i build.gradle són fitxers de veres en carpetes temporals. */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  root: '', fora: '', valors: {}, crides: [], preflights: [], fastlane: true, segell: '',
  codiValidacio: 0, codiPujada: 0, durantValidacio: null, durantPujada: null
}));

vi.mock('../scripts/botigues/preflight.mjs', () => ({
  arrelComprovada: () => m.root,
  preflight: (opcions) => {
    m.preflights.push(opcions);
    return { codi: 0, linies: [], valors: m.valors, fastlane: m.fastlane, jdk: { home: '/jdk/fals', major: 21 }, segell: { commit: 'b'.repeat(40) }, push: { anuncia: false, estat: {} } };
  }
}));
vi.mock('../scripts/botigues/entorn.mjs', async (original) => {
  const real = await original();
  return {
    ...real,
    llegixAjuda: () => ['--aab', '--track', '--release_status', '--package_name', '--json_key', '--skip_upload_metadata',
      '--skip_upload_images', '--skip_upload_screenshots', '--skip_upload_changelogs', '--validate_only'].join(' '),
    /* El segell de dins de l'AAB és el de dist-natiu/: problemaDeLAab passa. */
    llegixDelZip: () => Buffer.from(m.segell),
    executa: async (ordre, args, opcions = {}) => {
      m.crides.push([ordre, [...args], { ...opcions }]);
      if (ordre === 'keytool') return { codi: 0, crua: `Propietari: CN=Mestre\nSHA256: ${'AB:'.repeat(31)}AB\n`, eixida: '' };
      if (ordre === 'fastlane') {
        if (args.at(-1) === 'true') { m.durantValidacio?.(); return { codi: m.codiValidacio, crua: '', eixida: '' }; }
        m.durantPujada?.();
        return { codi: m.codiPujada, crua: '', eixida: '' };
      }
      return { codi: 0, crua: '', eixida: '' };
    }
  };
});

const { EIXIDA } = await import('../scripts/botigues/entorn.mjs');
/* El nom del registre, escrit: la prova no depén de l'export que comprova (cau per asserció, no per import). */
const REGISTRE_DE_PUJADES = 'pujades.jsonl';
const { AAB, PASSOS_DESPRES_PRODUCCIO, main, planAndroid } = await import('../scripts/botigues/puja-android.mjs');
const { VERSIO_CLIENT_NATIU } = await import('../scripts/botigues/versio-client.mjs');
const BUILD = String(VERSIO_CLIENT_NATIU);
const OCTETS_AAB = 'AAB de prova signat pel Mestre';
const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const SHA12 = sha256(OCTETS_AAB).slice(0, 12);

let eixida;
let errors;
beforeEach(() => {
  m.root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-b9-android-')));
  m.fora = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-b9-android-builds-')));
  m.valors = { SDP_APP_ID: 'org.socdepoble.app', SDP_PLAY_JSON_KEY_PATH: path.join(m.fora, 'play.json'), SDP_ANDROID_UPLOAD_CERT_SHA256: 'AB'.repeat(32), SDP_BUILDS_DIR: m.fora };
  m.segell = JSON.stringify({ commit: 'b'.repeat(40), arbreNet: true, data: '2026-11-01T12:00:00Z' });
  fs.mkdirSync(path.join(m.root, 'dist-natiu'));
  fs.writeFileSync(path.join(m.root, 'dist-natiu/segell.json'), m.segell);
  fs.mkdirSync(path.join(m.root, 'android/app'), { recursive: true });
  fs.writeFileSync(path.join(m.root, 'android/app/build.gradle'), `android {\n  defaultConfig {\n    versionCode ${BUILD}\n    versionName "1.0.0"\n  }\n}\n`);
  escriuAab(OCTETS_AAB);
  Object.assign(m, { crides: [], preflights: [], fastlane: true, codiValidacio: 0, codiPujada: 0, durantValidacio: null, durantPujada: null });
  eixida = [];
  errors = [];
  vi.spyOn(process.stdout, 'write').mockImplementation((s) => { eixida.push(String(s)); return true; });
  vi.spyOn(process.stderr, 'write').mockImplementation((s) => { errors.push(String(s)); return true; });
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of [m.root, m.fora]) fs.rmSync(dir, { recursive: true, force: true });
});

function escriuAab(octets) {
  const cami = path.join(m.root, ...AAB);
  fs.mkdirSync(path.dirname(cami), { recursive: true });
  fs.writeFileSync(cami, octets);
}
const crides = (nom) => m.crides.filter(([ordre]) => ordre === nom);
const registre = () => {
  const cami = path.join(m.fora, REGISTRE_DE_PUJADES);
  return fs.existsSync(cami) ? fs.readFileSync(cami, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
};
const produccio = (...mes) => main(['--versio', '1.0.0', '--build', BUILD, '--canal', 'produccio', ...mes]);
const text = () => eixida.join('');

describe('guardes abans de tocar res', () => {
  test('un canal desconegut: eixida 2, sense preflight ni cap eina', async () => {
    expect(await main(['--versio', '1.0.0', '--build', BUILD, '--canal', 'beta'])).toBe(EIXIDA.US);
    expect(errors.join('')).toMatch(/--canal ha de ser intern o produccio/);
    expect(m.preflights).toEqual([]);
    expect(m.crides).toEqual([]);
  });

  test('producció amb --compila i --confirma a la vegada: eixida 2 (el «sí» va en una altra execució)', async () => {
    expect(await produccio('--compila', `--confirma=produccio:1.0.0+${BUILD}@${SHA12}`)).toBe(EIXIDA.US);
    expect(errors.join('')).toMatch(/el «sí» va en una altra execució/);
    expect(m.preflights).toEqual([]);
    expect(m.crides).toEqual([]);
  });

  test('un «sí» intern no val per a producció, ni un de producció per a intern: eixida 10 sense cap eina', async () => {
    expect(await produccio(`--confirma=1.0.0+${BUILD}`)).toBe(EIXIDA.CONFIRMACIO);
    expect(errors.join('')).toMatch(/un «sí» intern no val per a producció/);
    expect(await main(['--versio', '1.0.0', '--build', BUILD, `--confirma=produccio:1.0.0+${BUILD}@${SHA12}`])).toBe(EIXIDA.CONFIRMACIO);
    expect(errors.join('')).toMatch(/va amb --canal produccio/);
    expect(m.preflights).toEqual([]);
    expect(m.crides).toEqual([]);
  });

  test('un sha12 que no és el de l’AAB: eixida 10, i fastlane no es crida mai', async () => {
    expect(await produccio(`--confirma=produccio:1.0.0+${BUILD}@ffffffffffff`)).toBe(EIXIDA.CONFIRMACIO);
    expect(errors.join('')).toMatch(new RegExp(`comença per ${SHA12}, no per ffffffffffff`));
    expect(crides('fastlane')).toEqual([]);
    expect(registre()).toEqual([]);
  });

  test('el build ja és a la prova interna: eixida 7 amb «promou-lo», abans de keytool i de fastlane', async () => {
    fs.writeFileSync(path.join(m.fora, REGISTRE_DE_PUJADES), `${JSON.stringify({ plataforma: 'android', canal: 'intern', versio: '1.0.0', build: BUILD, data: '2026-11-02T00:00:00Z' })}\n`, { mode: 0o600 });
    expect(await produccio(`--confirma=produccio:1.0.0+${BUILD}@${SHA12}`)).toBe(EIXIDA.ARBRE);
    expect(errors.join('')).toMatch(/promou-lo des de Play Console/);
    expect(m.crides).toEqual([]);
  });

  test('un registre il·legible tanca la producció (7) abans de cap eina', async () => {
    fs.writeFileSync(path.join(m.fora, REGISTRE_DE_PUJADES), '{trencat\n', { mode: 0o600 });
    expect(await produccio(`--confirma=produccio:1.0.0+${BUILD}@${SHA12}`)).toBe(EIXIDA.ARBRE);
    expect(errors.join('')).toMatch(/la línia 1 no s'entén/);
    expect(m.crides).toEqual([]);
  });

  test('el preflight rep el canal i --push', async () => {
    await produccio('--push');
    expect(m.preflights[0]).toMatchObject({ canal: 'produccio', push: true, plataformes: ['android'] });
  });
});

describe('pista production, sempre en esborrany', () => {
  test('el pla: production i draft a producció, internal i draft per defecte; mai completed, inProgress ni desplegament per fases', () => {
    const pla = planAndroid({ arrel: m.root, valors: m.valors, canal: 'produccio' });
    const intern = planAndroid({ arrel: m.root, valors: m.valors });
    for (const [args, pista] of [[pla.valida[1], 'production'], [pla.puja[1], 'production'], [intern.valida[1], 'internal'], [intern.puja[1], 'internal']]) {
      expect(args[args.indexOf('--track') + 1]).toBe(pista);
      expect(args[args.indexOf('--release_status') + 1]).toBe('draft');
      expect(args.join(' ')).not.toMatch(/completed|inProgress|halted|--rollout/);
    }
  });

  test('en sec a producció amb fastlane: el pla diu --track production --release_status draft, i res no diu completed', async () => {
    fs.rmSync(path.join(m.root, ...AAB));
    expect(await produccio()).toBe(EIXIDA.BE);
    expect(text()).toMatch(/--track production --release_status draft/);
    expect(text()).not.toMatch(/completed/);
  });
});

describe('en sec a producció (ARB-B9-04)', () => {
  test('amb l’AAB signat pel Mestre: verifica en local i dona el «sí» exacte amb el sha12 de veres, sense fastlane; keytool sense eco', async () => {
    expect(await produccio()).toBe(EIXIDA.BE);
    expect(text()).toContain(`--confirma=produccio:1.0.0+${BUILD}@${SHA12}`);
    expect(text()).toContain(`sha256 de l'AAB: ${sha256(OCTETS_AAB)}`);
    expect(text()).toMatch(/pujat a Google Play \(esborrany, pista production\): no/);
    expect(crides('fastlane')).toEqual([]);
    expect(crides('keytool')).toHaveLength(1);
    expect(crides('keytool')[0][2]).toMatchObject({ mostra: false, eco: false });
    expect(registre(), 'en sec no s’apunta res').toEqual([]);
  });

  test('sense AAB: torna 0, sense keytool, i diu que cal signar-lo i tornar a executar l’ordre en sec', async () => {
    fs.rmSync(path.join(m.root, ...AAB));
    expect(await produccio()).toBe(EIXIDA.BE);
    expect(text()).toMatch(/torna a executar esta ordre en sec/);
    expect(text()).toMatch(/Generate Signed Bundle/);
    expect(m.crides).toEqual([]);
  });

  test('un AAB d’un altre build (segell que no casa): eixida 7, sense keytool ni rebut', async () => {
    m.segell = JSON.stringify({ commit: 'c'.repeat(40), arbreNet: true, data: '2026-10-01T12:00:00Z' });
    expect(await produccio()).toBe(EIXIDA.ARBRE);
    expect(crides('keytool')).toEqual([]);
    expect(text()).not.toContain('REBUT');
  });
});

describe('el canal intern no canvia', () => {
  test('sense --canal: pista internal, i en sec torna abans de keytool amb el «sí» de sempre', async () => {
    expect(await main(['--versio', '1.0.0', '--build', BUILD])).toBe(EIXIDA.BE);
    expect(m.preflights[0]).toMatchObject({ canal: 'intern', push: false });
    expect(text()).toContain(`--confirma=1.0.0+${BUILD}\n`);
    expect(text()).not.toMatch(/produccio|production/);
    expect(text()).toMatch(/--track internal --release_status draft/);
    expect(m.crides).toEqual([]);
  });

  test('pujada interna: esborrany a internal, apuntada al registre com a intern, i keytool amb l’eco de sempre', async () => {
    expect(await main(['--versio', '1.0.0', '--build', BUILD, `--confirma=1.0.0+${BUILD}`])).toBe(EIXIDA.BE);
    expect(crides('fastlane')).toHaveLength(2);
    expect(crides('keytool')[0][2].eco).not.toBe(false);
    expect(registre()).toEqual([expect.objectContaining({ plataforma: 'android', canal: 'intern', versio: '1.0.0', build: BUILD, sha256: sha256(OCTETS_AAB) })]);
    expect(text()).toMatch(/pujat com a ESBORRANY a la prova interna/);
  });
});

describe('la pujada a producció', () => {
  const si = () => `--confirma=produccio:1.0.0+${BUILD}@${SHA12}`;

  test('camí bo: valida i puja a production en esborrany, apunta la pujada DESPRÉS i dona els passos del Mestre', async () => {
    expect(await produccio(si())).toBe(EIXIDA.BE);
    expect(crides('fastlane')).toHaveLength(2);
    const [valida, puja] = crides('fastlane');
    expect(valida[1].at(-1)).toBe('true');
    expect(puja[1].at(-1)).toBe('false');
    for (const [, args] of [valida, puja]) {
      expect(args[args.indexOf('--track') + 1]).toBe('production');
      expect(args[args.indexOf('--release_status') + 1]).toBe('draft');
    }
    expect(registre()).toEqual([{ plataforma: 'android', canal: 'produccio', versio: '1.0.0', build: BUILD, sha256: sha256(OCTETS_AAB), commit: 'b'.repeat(40), data: expect.any(String) }]);
    expect(fs.statSync(path.join(m.fora, REGISTRE_DE_PUJADES)).mode & 0o777).toBe(0o600);
    expect(text()).toMatch(/pujat com a ESBORRANY a la pista production/);
    expect(text()).toContain(PASSOS_DESPRES_PRODUCCIO[2]);
    expect(text()).toMatch(/pujat a Google Play \(esborrany, pista production\): sí/);
    /* ARB-N05-02 (A3) · Després de pujar, el rebut ja no ofereix cap «sí»: només valia per a esta pujada. */
    expect(text()).not.toMatch(/«sí» per a pujar ESTE AAB/);
  });

  test('si fastlane falla en pujar, el registre no s’apunta (l’apunt va després de la pujada)', async () => {
    m.codiPujada = 1;
    expect(await produccio(si())).toBe(EIXIDA.EXTERNA);
    expect(registre()).toEqual([]);
  });

  test('si --validate_only falla: no es puja res, cap registre, i el missatge diu la prova tancada de Play', async () => {
    m.codiValidacio = 1;
    expect(await produccio(si())).toBe(EIXIDA.EXTERNA);
    expect(crides('fastlane')).toHaveLength(1);
    expect(registre()).toEqual([]);
    expect(errors.join('')).toMatch(/prova tancada de 12 provadors × 14 dies \(P0-23\)/);
  });

  test('si l’AAB canvia durant --validate_only, no es puja (eixida 9)', async () => {
    m.durantValidacio = () => escriuAab('un altre AAB');
    expect(await produccio(si())).toBe(EIXIDA.VERIFICACIO);
    expect(crides('fastlane')).toHaveLength(1);
    expect(registre()).toEqual([]);
  });

  /* ARB-N05-02 (A1) · fastlane torna 0, però l'AAB d'ara ja no és el del «sí»: no se sap quin ha arribat. */
  test('si l’AAB canvia durant la pujada: eixida 9, cap registre ni rebut de pujat', async () => {
    m.durantPujada = () => escriuAab('un altre AAB');
    expect(await produccio(si())).toBe(EIXIDA.VERIFICACIO);
    expect(crides('fastlane')).toHaveLength(2);
    expect(errors.join('')).toMatch(/l'AAB ha canviat durant la pujada/);
    expect(registre()).toEqual([]);
    expect(text()).not.toMatch(/REBUT|pujat com a ESBORRANY/);
  });

  test('sense fastlane: eixida 6, els passos a mà de producció (esborrany, prova tancada) i cap registre', async () => {
    m.fastlane = false;
    expect(await produccio(si())).toBe(EIXIDA.EINA);
    expect(text()).toMatch(/Test and release › Production › Create new release/);
    expect(text()).toMatch(/Desar com a ESBORRANY/);
    expect(text()).toMatch(/prova tancada de 12 provadors durant 14 dies \(P0-23\)/);
    expect(crides('fastlane')).toEqual([]);
    expect(registre()).toEqual([]);
  });

  test('un pujades.jsonl amb permisos oberts: la pujada es fa, s’apunta, s’avisa i no es fa chmod', async () => {
    const cami = path.join(m.fora, REGISTRE_DE_PUJADES);
    fs.writeFileSync(cami, '', { mode: 0o644 });
    fs.chmodSync(cami, 0o644);
    expect(await produccio(si())).toBe(EIXIDA.BE);
    expect(errors.join('')).toMatch(/permisos oberts: chmod 600/);
    expect(fs.statSync(cami).mode & 0o777).toBe(0o644);
    expect(registre()).toHaveLength(1);
  });
});
