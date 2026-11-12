// @vitest-environment node
/* B9 (marató 261101_2143, spec B9-BOTIGUES §3.1.6.1) · Les peces del canal de producció i dels avisos
   push de scripts/botigues/, sense cap simulació: el «sí» lligat al canal i al sha256, la monotonia,
   el registre de pujades (fitxers reals en carpetes temporals fora del repositori), la família
   «Avisos push» del preflight (l'arbre real, només lectura, i projectes de mostra), els avisos de
   producció i executa amb eco:false (un procés fill de veres). Cap eina de les botigues s'executa. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, test, vi } from 'vitest';
import * as e from '../scripts/botigues/entorn.mjs';
import * as p from '../scripts/botigues/preflight.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SENSE_NATIUS = !fs.existsSync(path.join(ARREL, 'ios', 'App', 'App', 'AppDelegate.swift')) || !fs.existsSync(path.join(ARREL, 'android', 'capacitor.settings.gradle'));
const SENSE_GIT = spawnSync('git', ['--version']).status !== 0;
const SENSE_MKFIFO = process.platform === 'win32' || spawnSync('mkfifo', ['--help']).error?.code === 'ENOENT';
const SHA = 'abcdef0123456789'.repeat(4);

const temporals = [];
const temporal = (nom = 'sdp-b9-') => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), nom)));
  temporals.push(dir);
  return dir;
};
afterEach(() => { vi.unstubAllEnvs(); while (temporals.length) fs.rmSync(temporals.pop(), { recursive: true, force: true }); });
const escriu = (arrel, rel, text) => {
  fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
  fs.writeFileSync(path.join(arrel, rel), text);
};
/* Les consultes a eines de fora, fingides: cap fastlane, keytool ni JDK de veres. */
const FINGIDES = Object.freeze({ llegixAjuda: () => 'ajuda fingida', jdkPerAGradle: () => null });
/* git sense les variables d'un hook (GIT_DIR i GIT_INDEX_FILE apuntarien al repositori de debò). */
const ENTORN_GIT = Object.fromEntries(Object.entries(process.env).filter(([nom]) => !nom.startsWith('GIT_')));
const git = (cwd, ...args) => {
  const r = spawnSync('git', ['-c', 'user.name=prova', '-c', 'user.email=prova@exemple.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8', env: ENTORN_GIT });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
};
/* Un fitxer d'entorn de veres (0600) fora de l'arrel, amb només estes línies. */
const fitxerDEntorn = (linies) => {
  const cami = path.join(temporal('sdp-b9-env-'), 'botigues.env');
  fs.writeFileSync(cami, `${linies.join('\n')}\n`, { mode: 0o600 });
  fs.chmodSync(cami, 0o600);
  return cami;
};

describe('el «sí» lligat al canal i al binari', () => {
  test('intern com sempre; producció amb el canal i els 12 primers del sha256; cap «sí» d’un canal val per a l’altre', () => {
    expect(e.CANALS).toEqual({ INTERN: 'intern', PRODUCCIO: 'produccio' });
    expect(e.confirmacioEsperada('1.0.0', '2')).toBe('1.0.0+2');
    expect(e.confirmacioEsperada('1.0.0', '2', { canal: 'produccio', sha256: SHA })).toBe(`produccio:1.0.0+2@${SHA.slice(0, 12)}`);
    expect(e.confirmacioEsperada('1.0.0', '2', { canal: 'produccio' })).toBe('produccio:1.0.0+2@<12 primers del sha256>');
    expect(e.analitzaConfirmacio('1.0.0+2', { versio: '1.0.0', build: '2' })).toEqual({ valida: true, sha12: null });
    expect(e.analitzaConfirmacio('1.0.0+2', { versio: '1.0.0', build: '2', canal: 'produccio' }).valida).toBe(false);
    expect(e.analitzaConfirmacio(`produccio:1.0.0+2@${SHA.slice(0, 12)}`, { versio: '1.0.0', build: '2' }).valida).toBe(false);
    expect(e.analitzaConfirmacio('produccio:1.0.0+2@ABCDEF012345', { versio: '1.0.0', build: '2', canal: 'produccio' })).toEqual({ valida: true, sha12: 'abcdef012345' });
    for (const dolent of ['produccio:1.0.0+3@abcdef012345', 'produccio:1.0.0+2@abc', 'produccio:1.0.0+2', 'produccio:1.0.0+2@abcdef01234g',
      'produccio:1.0.0+2@abcdef012345x', ' produccio:1.0.0+2@abcdef012345', 'produccio:1.0.0+2@<12 primers del sha256>']) {
      expect(e.analitzaConfirmacio(dolent, { versio: '1.0.0', build: '2', canal: 'produccio' }).valida, dolent).toBe(false);
    }
    expect(e.analitzaConfirmacio('1.0.0+2', { versio: '1.0.0', build: '2', canal: 'beta' }).valida, 'un canal desconegut no val mai').toBe(false);
    expect(e.analitzaConfirmacio(undefined, { versio: '1.0.0', build: '2' }).valida).toBe(false);
  });
});

describe('monotonia i registre de pujades', () => {
  const registreDeMostra = [
    JSON.stringify({ plataforma: 'android', canal: 'intern', versio: '1.0.0', build: 2, data: '2026-11-02T00:00:00Z' }),
    'no és json',
    JSON.stringify({ plataforma: 'ios', canal: 'intern', versio: '1.0.0', build: '2' }),
    JSON.stringify({ plataforma: 'ios', canal: 'secret', versio: '1.0.0', build: '3' }),
    '[1, 2]',
    ''
  ].join('\n');

  test('les línies que no s’entenen es diuen pel número; es promou, no es repuja; el build creix i la versió no torna arrere', () => {
    const { entrades, errors } = e.analitzaRegistre(registreDeMostra);
    expect(errors).toEqual([2, 4, 5]);
    expect(entrades).toHaveLength(2);
    expect(e.problemaDeMonotonia({ plataforma: 'android', canal: 'produccio', versio: '1.0.0', build: '2' }, entrades)).toMatch(/promou-lo des de Play Console/);
    expect(e.problemaDeMonotonia({ plataforma: 'ios', canal: 'produccio', versio: '1.0.0', build: '2' }, entrades)).toMatch(/adjunta'l a la versió de l'App Store/);
    expect(e.problemaDeMonotonia({ plataforma: 'android', canal: 'intern', versio: '1.0.0', build: '2' }, entrades)).toMatch(/ja s'ha pujat .*cada pujada porta un build nou/);
    expect(e.problemaDeMonotonia({ plataforma: 'android', canal: 'produccio', versio: '1.0.0', build: '1' }, entrades)).toMatch(/no és més gran que l'últim pujat \(2\)/);
    expect(e.problemaDeMonotonia({ plataforma: 'android', canal: 'produccio', versio: '0.9.9', build: '3' }, entrades)).toMatch(/més vella que la 1\.0\.0/);
    expect(e.problemaDeMonotonia({ plataforma: 'android', canal: 'produccio', versio: '1.0.0', build: '3' }, entrades)).toBeNull();
    expect(e.problemaDeMonotonia({ plataforma: 'android', canal: 'produccio', versio: '1.0.0', build: '2' }, [])).toBeNull();
    expect(e.comparaVersions('1.10.0', '1.9.9')).toBe(1);
    expect(e.comparaVersions('1.0', '1.0.0')).toBeNull();
    /* Enters sense límit: amb Number, les dues serien iguals. */
    expect(e.comparaVersions('1.0.90071992547409930', '1.0.90071992547409931')).toBe(-1);
  });

  test('sense fitxer és buit; apunta només els camps del registre, en 0600, i es torna a llegir', () => {
    const dir = temporal();
    expect(e.llegixRegistre(dir)).toEqual({ entrades: [], errors: [] });
    const apuntat = e.apuntaPujada(dir, { plataforma: 'ios', canal: 'produccio', versio: '1.0.0', build: 3, sha256: SHA, commit: 'c'.repeat(40), data: '2026-11-02T00:00:00Z', SDP_ASC_KEY_ID: 'NO-HI-HA-DE-SER' });
    expect(apuntat).toEqual({ cami: path.join(dir, e.REGISTRE_DE_PUJADES), obert: false });
    expect(fs.statSync(apuntat.cami).mode & 0o777).toBe(0o600);
    const text = fs.readFileSync(apuntat.cami, 'utf8');
    expect(text).not.toContain('NO-HI-HA-DE-SER');
    expect(Object.keys(JSON.parse(text))).toEqual(['plataforma', 'canal', 'versio', 'build', 'sha256', 'commit', 'data']);
    expect(e.llegixRegistre(dir)).toEqual({ entrades: [{ plataforma: 'ios', canal: 'produccio', versio: '1.0.0', build: '3', data: '2026-11-02T00:00:00Z' }], errors: [] });
    /* Una entrada que després no es podria llegir no s'escriu. */
    expect(e.apuntaPujada(dir, { plataforma: 'web', canal: 'produccio', versio: '1.0.0', build: 4 })).toBeNull();
    expect(e.llegixRegistre(dir).entrades).toHaveLength(1);
  });

  /* ARB-N05-01 · avisDelRegistre demana «apunta-ho a mà», i un editor o un printf poden deixar l'última
     línia sense salt final: la línia nova no s'hi ha d'enganxar (es perdrien les dues). */
  test('una última línia apuntada a mà sense salt final: la nova va en línia pròpia, i la guarda la veu', () => {
    const dir = temporal();
    const cami = path.join(dir, e.REGISTRE_DE_PUJADES);
    fs.writeFileSync(cami, JSON.stringify({ plataforma: 'android', canal: 'intern', versio: '1.0.0', build: '2', data: '2026-11-02T00:00:00Z' }), { mode: 0o600 });
    fs.chmodSync(cami, 0o600);
    expect(e.apuntaPujada(dir, { plataforma: 'android', canal: 'intern', versio: '1.0.0', build: 3, data: '2026-11-02T01:00:00Z' })).toEqual({ cami, obert: false });
    expect(e.llegixRegistre(dir)).toEqual({
      entrades: [
        { plataforma: 'android', canal: 'intern', versio: '1.0.0', build: '2', data: '2026-11-02T00:00:00Z' },
        { plataforma: 'android', canal: 'intern', versio: '1.0.0', build: '3', data: '2026-11-02T01:00:00Z' }
      ],
      errors: []
    });
    /* Amb el salt final ja posat, cap línia buida de més. */
    expect(e.apuntaPujada(dir, { plataforma: 'android', canal: 'intern', versio: '1.0.0', build: 4 })).toEqual({ cami, obert: false });
    const text = fs.readFileSync(cami, 'utf8');
    expect(text.endsWith('}\n')).toBe(true);
    expect(text).not.toContain('\n\n');
    expect(text.split('\n').filter(Boolean)).toHaveLength(3);
    /* El build 3 que s'acaba d'apuntar no es torna a pujar, i no queda cap línia il·legible. */
    const guarda = e.guardaDelRegistre({ arrel: temporal('sdp-b9-arrel-'), valors: { SDP_BUILDS_DIR: dir }, canal: 'intern', plataforma: 'android', versio: '1.0.0', build: '3' });
    expect(guarda).toMatchObject({ codi: e.EIXIDA.ARBRE, avisos: [], problemes: [expect.stringMatching(/el build 3 ja s'ha pujat/)] });
  });

  test('un registre amb permisos oberts es diu i no es canvia; un enllaç, massa gran o una cua (FIFO) no es lligen ni s’hi escriu', () => {
    const dir = temporal();
    const cami = path.join(dir, e.REGISTRE_DE_PUJADES);
    fs.writeFileSync(cami, '', { mode: 0o644 });
    fs.chmodSync(cami, 0o644);
    expect(e.apuntaPujada(dir, { plataforma: 'android', canal: 'intern', versio: '1.0.0', build: 2 })).toEqual({ cami, obert: true });
    expect(fs.statSync(cami).mode & 0o777, 'el script no fa chmod').toBe(0o644);
    expect(e.avisDelRegistre({ cami, obert: true })).toMatch(/permisos oberts: chmod 600/);
    expect(e.avisDelRegistre(null)).toMatch(/apunta-ho a mà/);
    expect(e.avisDelRegistre({ cami, obert: false })).toBeNull();

    const altre = temporal();
    const desti = path.join(altre, 'no-es-el-registre.txt');
    fs.writeFileSync(desti, 'intacte\n');
    fs.rmSync(cami);
    fs.symlinkSync(desti, cami);
    expect(e.llegixRegistre(dir)).toEqual({ entrades: [], errors: [0] });
    expect(e.apuntaPujada(dir, { plataforma: 'android', canal: 'intern', versio: '1.0.0', build: 3 })).toBeNull();
    expect(fs.readFileSync(desti, 'utf8'), 'no segueix l’enllaç').toBe('intacte\n');

    fs.rmSync(cami);
    fs.writeFileSync(cami, `${JSON.stringify({ plataforma: 'android', canal: 'intern', versio: '1.0.0', build: 2 })}\n${' '.repeat(1024 * 1024)}`);
    expect(e.llegixRegistre(dir)).toEqual({ entrades: [], errors: [0] });
  });

  /* En un procés a banda amb un termini: si l'obertura es quedara esperant, el fill es mata i la prova cau
     (dins del mateix procés, una obertura bloquejada penjaria tota la suite). */
  test.skipIf(SENSE_MKFIFO)('una cua (FIFO) en lloc del registre: ni la lectura ni l’escriptura es queden esperant', () => {
    const dir = temporal();
    expect(spawnSync('mkfifo', [path.join(dir, e.REGISTRE_DE_PUJADES)]).status).toBe(0);
    const guio = `
      import { llegixRegistre, apuntaPujada } from ${JSON.stringify(pathToFileURL(path.join(ARREL, 'scripts/botigues/entorn.mjs')).href)};
      const llegit = llegixRegistre(process.argv[1]);
      const apuntat = apuntaPujada(process.argv[1], { plataforma: 'android', canal: 'intern', versio: '1.0.0', build: 2 });
      process.stdout.write(JSON.stringify({ llegit, apuntat }));
    `;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', guio, dir], { encoding: 'utf8', timeout: 4000 });
    expect(r.signal, 'el fill s’ha quedat esperant').toBeNull();
    expect(r.status, r.stderr).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual({ llegit: { entrades: [], errors: [0] }, apuntat: null });
  }, 10000);

  test('guardaDelRegistre: en producció tot tanca (5 o 7); en intern, sense carpeta o amb una línia dolenta, només avisa', () => {
    const arrel = temporal('sdp-b9-arrel-');
    const fora = temporal('sdp-b9-builds-');
    const base = { arrel, plataforma: 'android', versio: '1.0.0', build: '2' };
    expect(e.guardaDelRegistre({ ...base, canal: 'produccio', valors: {} })).toMatchObject({ codi: e.EIXIDA.FALTA, carpeta: null });
    expect(e.guardaDelRegistre({ ...base, canal: 'intern', valors: {} })).toMatchObject({ codi: e.EIXIDA.BE, carpeta: null, avisos: [expect.stringMatching(/falta SDP_BUILDS_DIR/)] });
    fs.mkdirSync(path.join(arrel, 'builds'));
    const dins = { SDP_BUILDS_DIR: path.join(arrel, 'builds') };
    expect(e.guardaDelRegistre({ ...base, canal: 'produccio', valors: dins })).toMatchObject({ codi: e.EIXIDA.FALTA, carpeta: null });
    expect(e.guardaDelRegistre({ ...base, canal: 'intern', valors: dins })).toMatchObject({ codi: e.EIXIDA.BE, carpeta: null, avisos: [expect.stringMatching(/fora del repositori/)] });
    const valors = { SDP_BUILDS_DIR: fora };
    expect(e.guardaDelRegistre({ ...base, canal: 'produccio', valors })).toEqual({ carpeta: fora, codi: e.EIXIDA.BE, problemes: [], avisos: [] });
    fs.writeFileSync(path.join(fora, e.REGISTRE_DE_PUJADES), `${JSON.stringify({ plataforma: 'android', canal: 'intern', versio: '1.0.0', build: '2' })}\n{trencat\n`, { mode: 0o600 });
    const enProduccio = e.guardaDelRegistre({ ...base, canal: 'produccio', valors });
    expect(enProduccio.codi).toBe(e.EIXIDA.ARBRE);
    expect(enProduccio.problemes.join('\n')).toMatch(/la línia 2 no s'entén/);
    const enIntern = e.guardaDelRegistre({ ...base, canal: 'intern', valors, build: '3' });
    expect(enIntern).toMatchObject({ codi: e.EIXIDA.BE, carpeta: fora, avisos: [expect.stringMatching(/la línia 2 no s'entén/)] });
    fs.writeFileSync(path.join(fora, e.REGISTRE_DE_PUJADES), `${JSON.stringify({ plataforma: 'android', canal: 'intern', versio: '1.0.0', build: '2' })}\n`, { mode: 0o600 });
    expect(e.guardaDelRegistre({ ...base, canal: 'produccio', valors })).toMatchObject({ codi: e.EIXIDA.ARBRE, problemes: [expect.stringMatching(/promou-lo/)] });
    /* Cap missatge porta cap ruta del fitxer d'entorn. */
    for (const r of [enProduccio, enIntern]) expect([...r.problemes, ...r.avisos].join('\n')).not.toContain(fora);
  });

  /* ARB-N05-02 (A4) · El camí de SDP_BUILDS_DIR és de fora, però l'enllaç du a dins del repositori: es
     mira també el camí real, i el registre no s'escriu mai dins de l'arbre. */
  test('SDP_BUILDS_DIR com a enllaç cap a dins del repositori: cap registre (5 en producció, avís en intern)', () => {
    const arrel = temporal('sdp-b9-arrel-');
    const fora = temporal('sdp-b9-builds-');
    fs.mkdirSync(path.join(arrel, 'builds'));
    const enllac = path.join(fora, 'builds-enllacat');
    fs.symlinkSync(path.join(arrel, 'builds'), enllac);
    const base = { arrel, valors: { SDP_BUILDS_DIR: enllac }, plataforma: 'android', versio: '1.0.0', build: '2' };
    expect(e.guardaDelRegistre({ ...base, canal: 'produccio' })).toMatchObject({ codi: e.EIXIDA.FALTA, carpeta: null, problemes: [expect.stringMatching(/no és un directori de fora del repositori/)] });
    expect(e.guardaDelRegistre({ ...base, canal: 'intern' })).toMatchObject({ codi: e.EIXIDA.BE, carpeta: null, avisos: [expect.stringMatching(/no és un directori de fora del repositori/)] });
  });

  test('aps-environment de l’XML de codesign', () => {
    const xml = '<?xml version="1.0"?><plist version="1.0"><dict><key>aps-environment</key><string>production</string><key>com.apple.developer.applesignin</key><array><string>Default</string></array></dict></plist>';
    expect(e.apsDeCodesign(`Executable=x\nTeamIdentifier=ABCDE12345\n${xml}`)).toBe('production');
    expect(e.apsDeCodesign('<key>aps-environment</key>\n\t<string>development</string>')).toBe('development');
    expect(e.apsDeCodesign('TeamIdentifier=ABCDE12345\n')).toBeNull();
  });
});

describe('preflight: el context de producció i la família «Avisos push»', () => {
  test('SDP_BUILDS_DIR passa a ser obligatòria a producció, també a Android; sense opcions, res no canvia', () => {
    expect(e.VARIABLES.SDP_BUILDS_DIR.per).toEqual(['ios', 'produccio']);
    expect(e.falten({}, ['android'])).toEqual(['SDP_ANDROID_UPLOAD_CERT_SHA256', 'SDP_APP_ID', 'SDP_PLAY_JSON_KEY_PATH']);
    expect(e.falten({}, ['android', 'produccio'])).toEqual(['SDP_ANDROID_UPLOAD_CERT_SHA256', 'SDP_APP_ID', 'SDP_BUILDS_DIR', 'SDP_PLAY_JSON_KEY_PATH']);
  });

  test('Android a producció sense SDP_BUILDS_DIR: eixida 5, amb els avisos de producció i cap valor', () => {
    const arrel = temporal('sdp-b9-arrel-');
    const fora = temporal('sdp-b9-claus-');
    const json = path.join(fora, 'play.json');
    fs.writeFileSync(json, 'fals', { mode: 0o600 });
    fs.chmodSync(json, 0o600);
    const linies = ['SDP_APP_ID=org.socdepoble.app', `SDP_PLAY_JSON_KEY_PATH=${json}`, `SDP_ANDROID_UPLOAD_CERT_SHA256=${'AB'.repeat(32)}`];
    const env = { SDP_BOTIGUES_ENV: fitxerDEntorn(linies) };
    const produccio = p.preflight({ arrel, plataformes: ['android'], env, consultes: FINGIDES, canal: 'produccio' });
    const text = produccio.linies.join('\n');
    expect(produccio.codi, text).toBe(e.EIXIDA.FALTA);
    expect(text).toMatch(/✗ falta SDP_BUILDS_DIR \(o és buida\)/);
    expect(text).toMatch(/Producció \(només avisos/);
    expect(text).toMatch(/! un compte personal de Play Console només publica a producció després de la prova tancada \(12 provadors durant 14 dies, P0-23\)/);
    for (const valor of ['org.socdepoble.app', json, fora]) expect(text).not.toContain(valor);
    /* El canal intern (per defecte) no la demana: l'arrel no és cap repositori i falla l'arbre (7), no les variables. */
    const intern = p.preflight({ arrel, plataformes: ['android'], env, consultes: FINGIDES });
    expect(intern.codi).toBe(e.EIXIDA.ARBRE);
    expect(intern.linies.join('\n')).not.toMatch(/Producció/);
    /* Amb la carpeta (fora de l'arrel), producció també arriba a l'arbre. */
    const ambCarpeta = p.preflight({ arrel, plataformes: ['android'], env: { SDP_BOTIGUES_ENV: fitxerDEntorn([...linies, `SDP_BUILDS_DIR=${temporal('sdp-b9-builds-')}`]) }, consultes: FINGIDES, canal: 'produccio' });
    expect(ambCarpeta.codi, ambCarpeta.linies.join('\n')).toBe(e.EIXIDA.ARBRE);
  });

  /* Un repositori de mostra amb l'arbre net i un dist-natiu/ segellat al seu HEAD: sense plataformes,
     l'única família que pot fallar és la dels avisos push. */
  const repositoriNet = () => {
    const arrel = temporal('sdp-b9-repo-');
    git(arrel, 'init', '-q');
    escriu(arrel, '.gitignore', 'dist-natiu/\n');
    git(arrel, 'add', '-A');
    git(arrel, 'commit', '-q', '-m', 'mostra');
    escriu(arrel, 'dist-natiu/index.html', '<!doctype html>');
    escriu(arrel, 'dist-natiu/segell.json', JSON.stringify({ commit: git(arrel, 'rev-parse', 'HEAD'), arbreNet: true, data: new Date().toISOString() }));
    return arrel;
  };

  test.skipIf(SENSE_GIT)('sense connector: amb --push, ✗ i eixida 7; sense --push, ✓ i eixida 0; push.anuncia és sempre un booleà', () => {
    const arrel = repositoriNet();
    const env = { SDP_BOTIGUES_ENV: fitxerDEntorn(['# sense variables']) };
    const sense = p.preflight({ arrel, plataformes: [], env, consultes: FINGIDES });
    const textSense = sense.linies.join('\n');
    expect(sense.codi, textSense).toBe(e.EIXIDA.BE);
    expect(textSense).toMatch(/Avisos push\n {2}✓ push: l'app no porta cap connector d'avisos remots \(B8 en fase N1\)/);
    expect(sense.push).toEqual({ anuncia: false, estat: expect.objectContaining({ connector: { paquet: false, ios: false, android: false } }) });
    const amb = p.preflight({ arrel, plataformes: [], env, consultes: FINGIDES, push: true });
    const textAmb = amb.linies.join('\n');
    expect(amb.codi, textAmb).toBe(e.EIXIDA.ARBRE);
    expect(textAmb).toMatch(/✗ --push: el connector @capacitor\/push-notifications no és al projecte .*decisió del Mestre \(D-WP-7\)/);
    expect(amb.push.anuncia).toBe(true);
    /* L'ordre de les famílies no canvia: «Avisos push» va davall d'«Arbre». */
    expect(amb.linies.indexOf('Avisos push')).toBeGreaterThan(amb.linies.indexOf('Arbre'));
  });

  test.skipIf(SENSE_NATIUS)('l’arbre real (només lectura): connector cablejat i APNs reenviat; FCM absent bloqueja Android amb i sense --push', () => {
    const estat = p.estatDelPush(ARREL);
    expect(estat.connector).toEqual({ paquet: true, ios: true, android: true });
    expect(estat.ios.reenviaRegistre, 'R54: el delegat reenvia registre i fallada d’APNs a Capacitor').toBe(true);
    expect(estat.ios.apsEnvironment).toBe('development');
    expect(estat.android.postNotifications).toBe(true);
    expect(estat.android.googleServices.hiEs).toBe(false);
    expect(estat.android.connectorGoogleServices).toBe(true);
    for (const push of [false, true]) {
      const result = p.liniesDelPush(estat, { push, plataformes: ['ios', 'android'] });
      expect(result.mal).toEqual(["falta android/app/google-services.json (Firebase › configuració del projecte; git l'ignora)"]);
      expect(result.linies.join('\n')).toContain("AppDelegate.swift reenvia el registre d'APNs");
      expect(result.linies.join('\n')).not.toContain("l'app no porta cap connector");
      expect(result.linies.join('\n')).not.toMatch(/--push: el connector .* no és al projecte/);
      expect(result.linies.join('\n')).toContain("l'IPA de l'App Store l'ha de portar en production: es mira després d'exportar");
    }
  });

  test.skipIf(SENSE_NATIUS)('avisos de producció de l’arbre real: Google iOS configurat i iPad a iOS, la prova tancada a Android; cap ✗', () => {
    const ios = p.avisosDeProduccio(ARREL, ['ios']).join('\n');
    expect(ios).not.toMatch(/com\.googleusercontent\.apps\.pendent/);
    expect(ios).toMatch(/TARGETED_DEVICE_FAMILY porta l'iPad/);
    expect(ios).not.toMatch(/ITSAppUsesNonExemptEncryption/);
    const android = p.avisosDeProduccio(ARREL, ['android']).join('\n');
    expect(android).toMatch(/prova tancada \(12 provadors durant 14 dies, P0-23\)/);
    expect(android).not.toMatch(/targetSdkVersion/);
  });

  test('avisos de producció d’un projecte de mostra: esquema Google de reserva, sense ITSAppUsesNonExemptEncryption i amb un targetSdk vell', () => {
    const arrel = temporal('sdp-b9-mostra-');
    escriu(arrel, 'ios/App/App/Info.plist', '<plist><dict><string>com.googleusercontent.apps.pendent</string><!-- <key>ITSAppUsesNonExemptEncryption</key><false/> --></dict></plist>');
    escriu(arrel, 'ios/App/App.xcodeproj/project.pbxproj', 'TARGETED_DEVICE_FAMILY = 1;\n');
    escriu(arrel, 'android/variables.gradle', 'ext {\n    targetSdkVersion = 34\n}\n');
    escriu(arrel, 'android/app/build.gradle', 'android { defaultConfig { targetSdkVersion rootProject.ext.targetSdkVersion } }');
    const ios = p.avisosDeProduccio(arrel, ['ios']).join('\n');
    expect(ios).toMatch(/com\.googleusercontent\.apps\.pendent/);
    expect(ios).toMatch(/no diu ITSAppUsesNonExemptEncryption = false/);
    expect(ios).not.toMatch(/iPad/);
    expect(p.avisosDeProduccio(arrel, ['android']).join('\n')).toMatch(/targetSdkVersion 34 és més baix que 36/);
    /* ARB-N05-02 (A7) · Just al llindar no hi ha avís. */
    escriu(arrel, 'android/variables.gradle', `ext {\n    targetSdkVersion = ${p.TARGET_SDK_PLAY_MINIM}\n}\n`);
    expect(p.avisosDeProduccio(arrel, ['android']).join('\n')).not.toMatch(/targetSdkVersion/);
  });

  /* ARB-N05-02 (A5) · D-B9-17: sense connector, un aps-environment a la font és vàlid si l'App ID té Push;
     només n'avisa (si el perfil no el porta, xcodebuild para amb 8 sense pujar res). */
  test('sense connector, un aps-environment a App.entitlements només és un avís, i només per a iOS', () => {
    const arrel = temporal('sdp-b9-mostra-');
    escriu(arrel, 'ios/App/App/App.entitlements', '<plist><dict><key>aps-environment</key><string>production</string></dict></plist>');
    const estat = p.estatDelPush(arrel);
    expect(estat.connector).toEqual({ paquet: false, ios: false, android: false });
    expect(estat.ios.apsEnvironment).toBe('production');
    const ios = p.liniesDelPush(estat, { plataformes: ['ios'] });
    expect(ios.mal).toEqual([]);
    expect(ios.linies.join('\n')).toMatch(/ {2}! ios\/App\/App\/App\.entitlements porta aps-environment sense connector: el perfil de distribució ha de tindre Push Notifications/);
    expect(p.liniesDelPush(estat, { plataformes: ['android'] }).linies.join('\n')).not.toMatch(/sense connector|!/);
    /* Un dret comentat no compta. */
    escriu(arrel, 'ios/App/App/App.entitlements', '<plist><dict><!-- <key>aps-environment</key><string>production</string> --></dict></plist>');
    expect(p.liniesDelPush(p.estatDelPush(arrel), { plataformes: ['ios'] }).linies.join('\n')).not.toMatch(/sense connector|!/);
  });

  test('un projecte de mostra amb el connector: cada peça que falta és un ✗, i cap valor de google-services.json ix mai', () => {
    const arrel = temporal('sdp-b9-mostra-');
    // The fixture is intentionally outside a Git project even when TMPDIR
    // lives inside the sole R15.2 clone. Do not inherit its ancestor's ignore.
    vi.stubEnv('GIT_CEILING_DIRECTORIES', path.dirname(arrel));
    escriu(arrel, 'package.json', JSON.stringify({ dependencies: { '@capacitor/push-notifications': '8.0.0' } }));
    escriu(arrel, 'capacitor.config.json', JSON.stringify({ appId: 'org.socdepoble.app' }));
    escriu(arrel, 'ios/App/CapApp-SPM/Package.swift', '.product(name: "CapacitorPushNotifications", package: "CapacitorPushNotifications")\n');
    escriu(arrel, 'android/capacitor.settings.gradle', "include ':capacitor-push-notifications'\nproject(':capacitor-push-notifications').projectDir = new File('../node_modules/@capacitor/push-notifications/android')\n");
    escriu(arrel, 'node_modules/@capacitor/push-notifications/android/src/main/AndroidManifest.xml', '<manifest><uses-permission android:name="android.permission.POST_NOTIFICATIONS"/></manifest>');
    escriu(arrel, 'android/app/src/main/AndroidManifest.xml', '<manifest xmlns:tools="t"><!-- <uses-permission android:name="android.permission.POST_NOTIFICATIONS" tools:node="remove"/> --></manifest>');
    escriu(arrel, 'android/app/build.gradle', "try { apply plugin: 'com.google.gms.google-services' } catch (e) {}\n");
    escriu(arrel, 'ios/App/App/App.entitlements', '<plist><dict></dict></plist>');
    escriu(arrel, 'ios/App/App/AppDelegate.swift', [
      'class AppDelegate {',
      '  // func application(_ a: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken t: Data) { NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: t) }',
      '  /* func application(_ a: UIApplication, didFailToRegisterForRemoteNotificationsWithError e: Error) { NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: e) } */',
      '}'
    ].join('\n'));
    const mira = (plataformes = ['ios', 'android'], push = false) => p.liniesDelPush(p.estatDelPush(arrel), { plataformes, push });
    let r = mira();
    expect(r.mal, r.linies.join('\n')).toHaveLength(3);
    expect(r.mal.some((m) => /AppDelegate\.swift no reenvia el registre d'APNs/.test(m)), 'un reenviament comentat no compta (ARB-B9-05)').toBe(true);
    expect(r.linies.join('\n')).toMatch(/! el projecte porta el connector d'avisos remots/);
    expect(p.estatDelPush(arrel).connector).toEqual({ paquet: true, ios: true, android: true });
    expect(mira(['ios'], true).mal.every((m) => !/google-services|POST_NOTIFICATIONS/.test(m)), 'iOS sol no mira Android').toBe(true);

    escriu(arrel, 'ios/App/App/AppDelegate.swift', [
      'class AppDelegate {',
      '  func application(_ a: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken t: Data) { NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: t) }',
      '  func application(_ a: UIApplication, didFailToRegisterForRemoteNotificationsWithError e: Error) { NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: e) }',
      '}'
    ].join('\n'));
    r = mira();
    expect(r.mal, r.linies.join('\n')).toHaveLength(2);
    expect(r.linies.join('\n')).toMatch(/✓ AppDelegate\.swift reenvia el registre d'APNs/);

    escriu(arrel, 'ios/App/App/App.entitlements', '<plist><dict><key>aps-environment</key><string>development</string></dict></plist>');
    escriu(arrel, 'android/app/google-services.json', JSON.stringify({ project_info: { project_number: 'SECRET-123' }, client: [{ client_info: { android_client_info: { package_name: 'org.socdepoble.app' } }, api_key: [{ current_key: 'AIzaFALS' }] }] }));
    r = mira();
    /* Fora d'un repositori, git no pot dir si l'ignora: es tanca (fail-closed). */
    expect(r.mal).toEqual(['android/app/google-services.json: git no l\'ignora (o no s\'ha pogut comprovar), i no es versiona']);
    for (const valor of ['SECRET-123', 'AIzaFALS', 'org.socdepoble.app']) expect(r.linies.join('\n')).not.toContain(valor);

    escriu(arrel, 'android/app/src/main/AndroidManifest.xml', '<manifest xmlns:tools="t"><uses-permission android:name="android.permission.POST_NOTIFICATIONS" tools:node="remove"/></manifest>');
    expect(mira(['android']).mal.some((m) => /POST_NOTIFICATIONS/.test(m)), 'tools:node="remove" a l’app guanya al manifest del connector').toBe(true);

    /* A mig sincronitzar: el connector a package.json però no a Package.swift, o només als natius. */
    escriu(arrel, 'ios/App/CapApp-SPM/Package.swift', '// .product(name: "CapacitorPushNotifications")\n');
    expect(mira(['ios']).mal.some((m) => /no a ios\/App\/CapApp-SPM\/Package\.swift: npx cap sync ios/.test(m))).toBe(true);
    escriu(arrel, 'package.json', JSON.stringify({ dependencies: {} }));
    expect(mira(['android']).mal.some((m) => /als projectes natius però no a package\.json/.test(m))).toBe(true);
  });

  test.skipIf(SENSE_GIT)('un projecte de mostra complet (dins de git, amb google-services.json ignorat): cap ✗', () => {
    const arrel = repositoriNet();
    escriu(arrel, '.gitignore', 'dist-natiu/\ngoogle-services.json\n');
    escriu(arrel, 'package.json', JSON.stringify({ dependencies: { '@capacitor/push-notifications': '8.0.0' } }));
    escriu(arrel, 'capacitor.config.json', JSON.stringify({ appId: 'org.socdepoble.app' }));
    escriu(arrel, 'ios/App/CapApp-SPM/Package.swift', '.product(name: "CapacitorPushNotifications", package: "CapacitorPushNotifications")\n');
    escriu(arrel, 'android/capacitor.settings.gradle', "include ':capacitor-push-notifications'\n");
    escriu(arrel, 'android/app/src/main/AndroidManifest.xml', '<manifest><uses-permission android:name="android.permission.POST_NOTIFICATIONS"/></manifest>');
    escriu(arrel, 'android/app/build.gradle', "apply plugin: 'com.google.gms.google-services'\n");
    escriu(arrel, 'ios/App/App/App.entitlements', '<plist><dict><key>aps-environment</key><string>production</string></dict></plist>');
    escriu(arrel, 'ios/App/App/AppDelegate.swift', '.capacitorDidRegisterForRemoteNotifications didRegisterForRemoteNotificationsWithDeviceToken didFailToRegisterForRemoteNotificationsWithError .capacitorDidFailToRegisterForRemoteNotifications\n');
    escriu(arrel, 'android/app/google-services.json', JSON.stringify({ client: [{ client_info: { android_client_info: { package_name: 'org.socdepoble.app' } } }] }));
    const r = p.liniesDelPush(p.estatDelPush(arrel), { plataformes: ['ios', 'android'], push: true });
    expect(r.mal, r.linies.join('\n')).toEqual([]);
    expect(r.linies.join('\n')).toMatch(/✓ google-services\.json del paquet de l'app, ignorat per git/);
    /* ARB-N05-02 (A6) · build.gradle sense el connector google-services (o amb la línia comentada): el ✗ de §3.1.2. */
    for (const gradle of ['android { }\n', "// apply plugin: 'com.google.gms.google-services'\n"]) {
      escriu(arrel, 'android/app/build.gradle', gradle);
      expect(p.liniesDelPush(p.estatDelPush(arrel), { plataformes: ['android'], push: true }).mal, gradle).toEqual(['android/app/build.gradle no aplica com.google.gms.google-services']);
    }
    escriu(arrel, 'android/app/build.gradle', "apply plugin: 'com.google.gms.google-services'\n");
    /* El d'un altre paquet no val. */
    escriu(arrel, 'android/app/google-services.json', JSON.stringify({ client: [{ client_info: { android_client_info: { package_name: 'com.altra.app' } } }] }));
    expect(p.liniesDelPush(p.estatDelPush(arrel), { plataformes: ['android'], push: true }).mal).toEqual(['android/app/google-services.json no és del paquet de capacitor.config.json']);
  });
});

describe('preflight.mjs com a ordre: el canal', () => {
  test('--canal desconegut: eixida 2 abans de llegir cap fitxer d’entorn', () => {
    const r = spawnSync(process.execPath, [path.join(ARREL, 'scripts/botigues/preflight.mjs'), '--plataforma', 'android', '--canal', 'beta'],
      { encoding: 'utf8', cwd: temporal(), env: { ...process.env, SDP_BOTIGUES_ENV: path.join(os.tmpdir(), 'sdp-b9-no-existix.env') } });
    expect(r.status, r.stderr).toBe(e.EIXIDA.US);
    expect(r.stderr).toMatch(/--canal ha de ser intern o produccio/);
    expect(r.stdout).toBe('');
  });
});

describe('executa amb eco:false (ARB-B9-03)', () => {
  /* Un procés a banda, sense cap simulació: el fill escriu l'XML de drets (amb el Team ID dins
     d'«<equip>.org.socdepoble.app», que abans de G1-B-seg-02 la màscara de peça sencera no tapava) a
     stdout i el detall a stderr. */
  const XML = '<plist><dict><key>application-identifier</key><string>ABCDE12345.org.socdepoble.app</string><key>keychain-access-groups</key><array><string>ABCDE12345.*</string></array><key>aps-environment</key><string>production</string></dict></plist>';
  const guio = `
    import { executa, equipDeCodesign } from ${JSON.stringify(pathToFileURL(path.join(ARREL, 'scripts/botigues/entorn.mjs')).href)};
    const apsDeCodesign = (text) => /<key>aps-environment<\\/key><string>([a-z]+)<\\/string>/.exec(text)?.[1] ?? null;
    const valors = { SDP_APPLE_TEAM_ID: 'ABCDE12345' };
    const fill = ['-e', 'process.stdout.write(process.argv[1]); console.error("TeamIdentifier=ABCDE12345")', ${JSON.stringify(XML)}];
    const ambEco = process.argv[1] === 'eco';
    const r = await executa(process.execPath, fill, { valors, mostra: false, ...(ambEco ? {} : { eco: false }) });
    process.stderr.write('\\nCRUA=' + r.crua.includes('ABCDE12345.org.socdepoble.app') + ' APS=' + apsDeCodesign(r.crua) + ' EQUIP_LLEGIT=' + (equipDeCodesign(r.crua) !== null) + '\\n');
  `;
  const corre = (...args) => spawnSync(process.execPath, ['--input-type=module', '-e', guio, ...args], { encoding: 'utf8' });

  test('sense eco: res a stdout, cap Team ID a stderr, i la crua el conserva per a llegir l’equip i l’aps-environment', () => {
    const sense = corre('sense');
    expect(sense.status, sense.stderr).toBe(0);
    expect(sense.stdout).toBe('');
    expect(sense.stderr).toMatch(/CRUA=true APS=production EQUIP_LLEGIT=true/);
    expect(sense.stderr.replace(/\nCRUA=.*\n$/, '')).not.toContain('ABCDE12345');
  });

  /* G1-B-seg-02 · Abans, esta sonda mossegava: amb l'eco per defecte l'XML eixia amb el Team ID.
     Ara l'XML continua eixint (l'eco funciona), però amb el Team ID emmascarat arreu, i la crua el conserva. */
  test('amb l’eco per defecte, l’XML ix per stdout amb el Team ID emmascarat arreu, i la crua el conserva (G1-B-seg-02)', () => {
    const amb = corre('eco');
    expect(amb.status, amb.stderr).toBe(0);
    expect(amb.stdout).toContain('<string><SDP_APPLE_TEAM_ID>.org.socdepoble.app</string>');
    expect(amb.stdout).toContain('<string><SDP_APPLE_TEAM_ID>.*</string>');
    expect(amb.stdout).not.toContain('ABCDE12345');
    expect(amb.stderr).toMatch(/TeamIdentifier=<SDP_APPLE_TEAM_ID>\n/);
    expect(amb.stderr).toMatch(/CRUA=true APS=production EQUIP_LLEGIT=true/);
    expect(amb.stderr.replace(/\nCRUA=.*\n$/, '')).not.toContain('ABCDE12345');
  });
});

describe('el Team ID d’Apple, emmascarat arreu (G1-B-seg-02)', () => {
  /* El bolcat de drets que xcodebuild archive pinta al pas ProcessProductPackaging (registre real d'un
     arxiu d'esta App, amb el Team ID canviat): el Team ID hi va enganxat a «.» i a «\=», on la regla de
     la peça sencera no el veia. */
  const EQUIP = 'ABCDE12345';
  const BOLCAT = [
    'ProcessProductPackaging /x/App.entitlements /x/App.app.xcent (in target \'App\' from project \'App\')',
    'Entitlements:',
    '{',
    `    "application-identifier" = "${EQUIP}.org.socdepoble.app";`,
    '    "aps-environment" = production;',
    `    "com.apple.developer.team-identifier" = ${EQUIP};`,
    `    "keychain-access-groups" = ( "${EQUIP}.org.socdepoble.app", "${EQUIP}.*" );`,
    '}',
    `    export TeamIdentifierPrefix\\=${EQUIP}.`,
    `    export DEVELOPMENT_TEAM\\=${EQUIP}`,
    `Signing Identity:     "Apple Distribution: Nom Cognom (${EQUIP})"`,
    '** ARCHIVE SUCCEEDED **'
  ].join('\n');

  test('cap forma del bolcat de drets deixa veure el Team ID, i la resta del text no canvia', () => {
    const tapat = BOLCAT.split(EQUIP).join('<SDP_APPLE_TEAM_ID>');
    expect(e.emmascara(BOLCAT, { SDP_APPLE_TEAM_ID: EQUIP })).toBe(tapat);
    expect(e.emmascara(BOLCAT, { SDP_APPLE_TEAM_ID: ` ${EQUIP} ` }), 'el valor es busca sense els espais del fitxer').toBe(tapat);
    expect(e.mostraOrdre('echo', [`${EQUIP}.org.socdepoble.app`], { SDP_APPLE_TEAM_ID: EQUIP })).toBe('echo <SDP_APPLE_TEAM_ID>.org.socdepoble.app');
  });

  test('els altres identificadors continuen amb la regla de la peça sencera', () => {
    expect(e.emmascara('--upload-app alias upload', { SDP_ANDROID_KEY_ALIAS: 'upload' })).toBe('--upload-app alias <SDP_ANDROID_KEY_ALIAS>');
    expect(e.emmascara('org.socdepoble.app org.socdepoble.app.debug', { SDP_APP_ID: 'org.socdepoble.app' })).toBe('<SDP_APP_ID> org.socdepoble.app.debug');
  });
});

describe('O4 · target Android efectiu per a l’avís de Play', () => {
  const projecte = (app, variables = 'ext {\n targetSdkVersion = 36\n}\n') => {
    const arrel = temporal('sdp-o4-target-');
    escriu(arrel, 'android/app/build.gradle', app);
    escriu(arrel, 'android/variables.gradle', variables);
    return arrel;
  };
  const avisa = arrel => p.avisosDeProduccio(arrel, ['android']).join('\n');

  test('35 ja és inferior al mínim36, encara que vinga de rootProject.ext', () => {
    const arrel = projecte('android { defaultConfig { targetSdkVersion rootProject.ext.targetSdkVersion } }', 'ext {\n targetSdkVersion = 35\n}');
    expect(avisa(arrel)).toMatch(/targetSdkVersion 35 és més baix que 36/);
  });

  test('la declaració literal de l’app preval sobre la variable global', () => {
    expect(avisa(projecte('android { defaultConfig { targetSdkVersion 35 } }'))).toMatch(/targetSdkVersion 35 és més baix que 36/);
    expect(avisa(projecte('android { defaultConfig { targetSdk = 37 } }', 'ext {\n targetSdkVersion = 34\n}'))).not.toMatch(/targetSdkVersion/);
  });

  test('36 i una versió superior resoltes de rootProject.ext no donen un avís fals', () => {
    for (const version of [36, 37]) {
      const arrel = projecte('android {\n defaultConfig {\n targetSdkVersion rootProject.ext.targetSdkVersion\n }\n}', `ext {\n targetSdkVersion = ${version}\n}`);
      expect(avisa(arrel)).not.toMatch(/targetSdkVersion/);
    }
  });

  test('comentaris i cadenes no poden substituir el target de defaultConfig', () => {
    const app='def mostra = """\nandroid { defaultConfig { targetSdkVersion 37 } }\n"""\n'
      +'// targetSdkVersion 37\nandroid { defaultConfig {\n/* targetSdkVersion 37 */\ntargetSdkVersion 35\n} }';
    expect(avisa(projecte(app))).toMatch(/targetSdkVersion 35 és més baix que 36/);
  });

  test('una expressió desconeguda o un projecte absent no acrediten el target per la variable sola', () => {
    const arrel = projecte('android { defaultConfig { targetSdkVersion calculaTarget() } }');
    expect(avisa(arrel)).toMatch(/no es pot resoldre.*targetSdkVersion/);
    fs.rmSync(path.join(arrel, 'android/app/build.gradle'));
    expect(avisa(arrel)).toMatch(/no es pot resoldre.*targetSdkVersion/);
  });
});

test('O4 · un flavor que pot rebaixar el target no s’acredita amb el defaultConfig', () => {
  const arrel = temporal('sdp-o4-flavors-');
  escriu(arrel, 'android/app/build.gradle', 'android { defaultConfig { targetSdkVersion 36 } productFlavors { demo { targetSdkVersion 35 } } }');
  escriu(arrel, 'android/variables.gradle', 'ext { targetSdkVersion = 36 }');
  expect(p.avisosDeProduccio(arrel, ['android']).join('\n')).toMatch(/no es pot resoldre.*targetSdkVersion/);
});

test('O4 · una sobreescriptura fora del bloc no queda tapada pel defaultConfig', () => {
  const arrel = temporal('sdp-o4-post-target-');
  escriu(arrel, 'android/app/build.gradle', 'android { defaultConfig { targetSdkVersion 36 } }\nandroid.defaultConfig.targetSdkVersion = 35\n');
  escriu(arrel, 'android/variables.gradle', 'ext { targetSdkVersion = 36 }');
  expect(p.targetSdkAndroid(arrel)).toBeNull();
  expect(p.avisosDeProduccio(arrel, ['android']).join('\n')).toMatch(/no es pot resoldre.*targetSdkVersion/);
});

test('O4 · literals slashy i dollar-slashy no suportats donen UNKNOWN', () => {
  for (const literal of ['/\n targetSdkVersion 36\n /', '$/\n targetSdkVersion 36\n /$']) {
    const arrel = temporal('sdp-o4-slashy-');
    escriu(arrel, 'android/app/build.gradle', `android { defaultConfig {\n def exemple = ${literal}\n} }`);
    escriu(arrel, 'android/variables.gradle', 'ext { targetSdkVersion = 36 }');
    expect(p.targetSdkAndroid(arrel)).toBeNull();
    expect(p.avisosDeProduccio(arrel, ['android']).join('\n')).toMatch(/no es pot resoldre.*targetSdkVersion/);
  }
});

test('O4 · una assignació dins d’un condicional no acredita el defaultConfig', () => {
  const arrel = temporal('sdp-o4-target-condicional-');
  escriu(arrel, 'android/app/build.gradle', 'android { defaultConfig {\n if (false) {\n targetSdkVersion 36\n }\n} }');
  expect(p.targetSdkAndroid(arrel)).toBeNull();
});

for (const [nom, variables] of [
  ['expressió posterior', 'ext {\n targetSdkVersion = 36\n targetSdkVersion = 35 + 0\n}'],
  ['assignació condicional posterior', 'ext {\n targetSdkVersion = 36\n if (true) { targetSdkVersion = 35 }\n}']
]) test(`O4 · ${nom} de la variable dona UNKNOWN`, () => {
  const arrel = temporal('sdp-o4-target-variable-');
  escriu(arrel, 'android/app/build.gradle', 'android { defaultConfig { targetSdkVersion rootProject.ext.targetSdkVersion } }');
  escriu(arrel, 'android/variables.gradle', variables);
  expect(p.targetSdkAndroid(arrel)).toBeNull();
  expect(p.avisosDeProduccio(arrel, ['android']).join('\n')).toMatch(/no es pot resoldre.*targetSdkVersion/);
});
