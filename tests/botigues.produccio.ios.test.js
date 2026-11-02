// @vitest-environment node
/* B9 (marató 261101_2143, spec B9-BOTIGUES §3.1.4 i §3.1.6.3) · puja-ios.mjs amb --canal produccio i
   els drets de push: l'estat dels avisos del preflight tancat per defecte (ARB-B9-02), codesign -dv
   amb els drets en XML i sense eco (ARB-B9-03), aps-environment production quan l'app n'anuncia, el
   «sí» lligat al sha256 de la còpia fixada, el registre de pujades després de la pujada i els passos
   del Mestre sense cap grup de TestFlight. Patró de tests/botigues.ipa.test.js (L03): cap eina real
   (ditto, plutil, codesign, xcodebuild i xcrun simulats); un «IPA» de prova és un JSON. */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const EQUIP = 'ABCDEFGHIJ';
const m = vi.hoisted(() => ({ root: '', fora: '', valors: {}, crides: [], ajuda: '', pujats: [], pre: null, codiPujada: 0, bolcat: null }));
const BE = { codi: 0, crua: '', eixida: '' };

/* La simulació de «ditto -x -k <ipa> <desti>»: desplega les apps que descriu el JSON. */
function desplega(ipa, desti) {
  let arbre;
  try { arbre = JSON.parse(fs.readFileSync(ipa, 'utf8')); } catch { return { codi: 1, crua: '', eixida: '' }; }
  for (const [nom, app] of Object.entries(arbre.apps ?? {})) {
    const dir = path.join(desti, 'Payload', nom);
    fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'Info.plist'), JSON.stringify(app.plist));
    fs.writeFileSync(path.join(dir, 'public', 'segell.json'), app.segell);
    fs.writeFileSync(path.join(dir, '.firma'), JSON.stringify({ equip: app.equip, aps: app.aps ?? null }));
  }
  return BE;
}
/* L'eixida de «codesign -dv --verbose=4 --entitlements - --xml»: el detall (amb l'equip) i l'XML dels drets,
   que porta l'equip dins de l'application-identifier. */
const eixidaDeCodesign = ({ equip, aps }) => `Executable=x\nTeamIdentifier=${equip}\n<?xml version="1.0"?><plist version="1.0"><dict>`
  + `<key>application-identifier</key><string>${equip}.org.socdepoble.app</string>`
  + (aps ? `<key>aps-environment</key><string>${aps}</string>` : '') + '</dict></plist>';

vi.mock('../scripts/botigues/preflight.mjs', () => ({
  arrelComprovada: () => m.root,
  projecteIos: () => ({ opcio: '-project', cami: 'fixture.xcodeproj' }),
  preflight: (opcions) => {
    m.crides.push(['preflight', [], opcions]);
    return m.pre ?? { codi: 0, linies: [], valors: m.valors, segell: { commit: 'a'.repeat(40) }, fastlane: false, push: { anuncia: false, estat: {} } };
  }
}));
vi.mock('../scripts/botigues/entorn.mjs', async (original) => {
  const real = await original();
  return {
    ...real,
    llegixAjuda: () => m.ajuda,
    executa: async (ordre, args, opcions = {}) => {
      m.crides.push([ordre, [...args], { ...opcions }]);
      if (ordre === 'ditto') return desplega(args[2], args[3]);
      if (ordre === 'plutil') {
        try { return { codi: 0, crua: String(JSON.parse(fs.readFileSync(args.at(-1), 'utf8'))[args[1]] ?? ''), eixida: '' }; } catch { return { codi: 1, crua: '', eixida: '' }; }
      }
      if (ordre === 'codesign') {
        if (args[0] === '--verify') return BE;
        return { codi: 0, crua: eixidaDeCodesign(JSON.parse(fs.readFileSync(path.join(args.at(-1), '.firma'), 'utf8'))), eixida: '' };
      }
      if (ordre === 'xcrun' && args.includes('--upload-app')) {
        const cami = args[args.indexOf('-f') + 1];
        m.pujats.push({ cami, octets: fs.readFileSync(cami) });
        return { codi: m.codiPujada, crua: '', eixida: '' };
      }
      if (ordre === 'xcodebuild' && args.includes('archive')) {
        const app = path.join(args[args.indexOf('-archivePath') + 1], 'Products', 'Applications', 'App.app');
        fs.mkdirSync(path.join(app, 'public'), { recursive: true });
        fs.writeFileSync(path.join(app, 'public', 'segell.json'), SEGELL);
      }
      if (ordre === 'xcodebuild' && args.includes('-exportArchive')) {
        fs.mkdirSync(path.join(path.dirname(args[args.indexOf('-archivePath') + 1]), 'export'), { recursive: true });
        escriuIpa('App.ipa', ipaBo());
      }
      /* G1-B-seg-02 · Amb m.bolcat, l'eixida d'xcodebuild passa per l'executa de veres (màscara i eco
         inclosos) amb les mateixes opcions que li dona puja-ios: un fill escriu el bolcat a stdout i stderr. */
      if (ordre === 'xcodebuild' && m.bolcat) {
        const { out, err } = m.bolcat[args.includes('archive') ? 'archive' : 'export'];
        return real.executa(process.execPath, ['-e', 'process.stdout.write(process.env.SDP_PROVA_OUT); process.stderr.write(process.env.SDP_PROVA_ERR)'],
          { ...opcions, entornExtra: { SDP_PROVA_OUT: out, SDP_PROVA_ERR: err } });
      }
      return BE;
    }
  };
});

const { EIXIDA } = await import('../scripts/botigues/entorn.mjs');
/* El nom del registre, escrit: la prova no depén de l'export que comprova (cau per asserció, no per import). */
const REGISTRE_DE_PUJADES = 'pujades.jsonl';
const { OPCIONS_ALTOOL, OPCIONS_XCODEBUILD, PASSOS_REVISIO_IOS, main, planIos } = await import('../scripts/botigues/puja-ios.mjs');
const { VERSIO_CLIENT_NATIU } = await import('../scripts/botigues/versio-client.mjs');
const BUILD = String(VERSIO_CLIENT_NATIU);

const SEGELL = JSON.stringify({ commit: 'a'.repeat(40), arbreNet: true, data: '2026-11-01T12:00:00Z' });
const ipaBo = (sobre = {}) => ({ apps: { 'App.app': { plist: { CFBundleShortVersionString: '1.0.0', CFBundleVersion: BUILD }, segell: SEGELL, equip: EQUIP, ...sobre } } });
const sha256 = (octets) => createHash('sha256').update(octets).digest('hex');

let pla;
let eixida;
let errors;
const PLATAFORMA = Object.getOwnPropertyDescriptor(process, 'platform');
beforeEach(() => {
  Object.defineProperty(process, 'platform', { ...PLATAFORMA, value: 'darwin' });
  m.root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-b9-ios-')));
  m.fora = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-b9-ios-builds-')));
  m.valors = { SDP_BUILDS_DIR: m.fora, SDP_APPLE_TEAM_ID: EQUIP, SDP_ASC_KEY_PATH: path.join(m.fora, 'fixture.p8'), SDP_ASC_KEY_ID: 'EXEMPLE', SDP_ASC_ISSUER_ID: 'exemple' };
  m.ajuda = [...OPCIONS_ALTOOL, ...OPCIONS_XCODEBUILD].join(' ');
  Object.assign(m, { crides: [], pujats: [], pre: null, codiPujada: 0, bolcat: null });
  pla = planIos({ arrel: m.root, valors: m.valors, versio: '1.0.0', build: BUILD, projecte: { opcio: '-project', cami: 'fixture' } });
  fs.mkdirSync(path.join(pla.app, 'public'), { recursive: true });
  fs.mkdirSync(path.join(m.root, 'dist-natiu'), { recursive: true });
  fs.mkdirSync(pla.exportacio, { recursive: true });
  fs.writeFileSync(path.join(m.root, 'dist-natiu/segell.json'), SEGELL);
  fs.writeFileSync(path.join(pla.app, 'public/segell.json'), SEGELL);
  fs.writeFileSync(path.join(pla.app, 'Info.plist'), JSON.stringify(ipaBo().apps['App.app'].plist));
  eixida = [];
  errors = [];
  vi.spyOn(process.stdout, 'write').mockImplementation((s) => { eixida.push(String(s)); return true; });
  vi.spyOn(process.stderr, 'write').mockImplementation((s) => { errors.push(String(s)); return true; });
});
afterEach(() => {
  Object.defineProperty(process, 'platform', PLATAFORMA);
  vi.restoreAllMocks();
  for (const dir of [m.root, m.fora]) fs.rmSync(dir, { recursive: true, force: true });
});

function escriuIpa(nom, arbre) {
  const cami = path.join(pla.exportacio, nom);
  fs.writeFileSync(cami, JSON.stringify(arbre));
  return cami;
}
const crides = (nom) => m.crides.filter(([ordre]) => ordre === nom);
const validacions = () => m.crides.filter(([ordre, args]) => ordre === 'xcrun' && args.includes('--validate-app'));
const registre = () => {
  const cami = path.join(m.fora, REGISTRE_DE_PUJADES);
  return fs.existsSync(cami) ? fs.readFileSync(cami, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
};
const ambPush = (push) => { m.pre = { codi: 0, linies: [], valors: m.valors, segell: { commit: 'a'.repeat(40) }, fastlane: false, push }; };
const intern = () => main(['--versio', '1.0.0', '--build', BUILD, `--confirma=1.0.0+${BUILD}`]);
const produccio = (...mes) => main(['--versio', '1.0.0', '--build', BUILD, '--canal', 'produccio', ...mes]);
const siDe = (ipa) => `--confirma=produccio:1.0.0+${BUILD}@${sha256(fs.readFileSync(ipa)).slice(0, 12)}`;

describe('l’estat dels avisos push, tancat per defecte (ARB-B9-02)', () => {
  test.each([
    ['sense push', undefined],
    ['push nul', null],
    ['anuncia que no és un booleà', { anuncia: 'no', estat: {} }]
  ])('un preflight %s: eixida 7, sense obrir l’IPA ni cap codesign', async (_nom, push) => {
    escriuIpa('App.ipa', ipaBo());
    ambPush(push);
    expect(await intern()).toBe(EIXIDA.ARBRE);
    expect(errors.join('')).toMatch(/el preflight no ha dit l'estat dels avisos push/);
    expect(crides('ditto')).toEqual([]);
    expect(crides('codesign')).toEqual([]);
    expect(crides('xcodebuild')).toEqual([]);
    expect(m.pujats).toEqual([]);
  });
});

describe('els drets de l’IPA (codesign -dv … --entitlements - --xml)', () => {
  test('la crida porta eco:false, -dv al davant i l’app al final, i cap escriptura del script diu l’equip', async () => {
    escriuIpa('App.ipa', ipaBo());
    expect(await intern()).toBe(EIXIDA.BE);
    const dv = crides('codesign').find(([, args]) => args[0] === '-dv');
    expect(dv[1]).toEqual(['-dv', '--verbose=4', '--entitlements', '-', '--xml', expect.stringMatching(/\/Payload\/App\.app$/)]);
    expect(dv[2]).toMatchObject({ mostra: false, eco: false });
    expect([...eixida, ...errors].join('')).not.toContain(EQUIP);
    expect(eixida.join('')).toMatch(/✓ signatura de l'equip de SDP_APPLE_TEAM_ID; aps-environment: cap/);
  });

  /* G1-B-seg-02 · xcodebuild archive pinta els drets al pas ProcessProductPackaging, amb el Team ID dins
     d'«<equip>.org.socdepoble.app» (registre real d'un arxiu d'esta App), i l'eco de puja-ios el passava a
     la pantalla. Ara l'eixida continua veient-se, però amb el Team ID emmascarat arreu, en els dos passos. */
  test('--compila: l’eixida d’xcodebuild archive i -exportArchive es veu, però sense el Team ID (G1-B-seg-02)', async () => {
    fs.rmSync(pla.arxiu, { recursive: true, force: true });
    fs.rmSync(pla.exportacio, { recursive: true, force: true });
    m.bolcat = {
      archive: {
        out: ['Entitlements:', '{', `    "application-identifier" = "${EQUIP}.org.socdepoble.app";`, `    "com.apple.developer.team-identifier" = ${EQUIP};`,
          `    "keychain-access-groups" = ( "${EQUIP}.org.socdepoble.app" );`, '}', `    export TeamIdentifierPrefix\\=${EQUIP}.`, '** ARCHIVE SUCCEEDED **', ''].join('\n'),
        err: `note: Signing Identity: "Apple Distribution: Nom Cognom (${EQUIP})"\n`
      },
      export: { out: `Exported App to: ${pla.exportacio}\n** EXPORT SUCCEEDED **\n`, err: `note: keychain-access-groups ${EQUIP}.*\n` }
    };
    expect(await main(['--versio', '1.0.0', '--build', BUILD, '--compila'])).toBe(EIXIDA.BE);
    expect(crides('xcodebuild').map(([, args]) => args.includes('archive') || args.includes('-exportArchive'))).toEqual([true, true]);
    const pantalla = [...eixida, ...errors].join('');
    expect(pantalla).toContain('"application-identifier" = "<SDP_APPLE_TEAM_ID>.org.socdepoble.app";');
    expect(pantalla).toContain('TeamIdentifierPrefix\\=<SDP_APPLE_TEAM_ID>.');
    expect(pantalla).toContain('** EXPORT SUCCEEDED **');
    expect(pantalla).toContain('keychain-access-groups <SDP_APPLE_TEAM_ID>.*');
    expect(pantalla).not.toContain(EQUIP);
  });

  test('l’app anuncia push i l’IPA porta aps-environment development: eixida 9, sense validar ni pujar', async () => {
    escriuIpa('App.ipa', ipaBo({ aps: 'development' }));
    ambPush({ anuncia: true, estat: {} });
    expect(await intern()).toBe(EIXIDA.VERIFICACIO);
    expect(errors.join('')).toMatch(/l'IPA no porta aps-environment production/);
    expect(validacions()).toEqual([]);
    expect(m.pujats).toEqual([]);
  });

  test('l’app anuncia push i l’IPA no porta aps-environment: eixida 9', async () => {
    escriuIpa('App.ipa', ipaBo());
    ambPush({ anuncia: true, estat: {} });
    expect(await intern()).toBe(EIXIDA.VERIFICACIO);
    expect(m.pujats).toEqual([]);
  });

  test('l’app anuncia push i l’IPA porta aps-environment production: es valida i es puja', async () => {
    escriuIpa('App.ipa', ipaBo({ aps: 'production' }));
    ambPush({ anuncia: true, estat: {} });
    expect(await intern()).toBe(EIXIDA.BE);
    expect(m.pujats).toHaveLength(1);
    expect(eixida.join('')).toMatch(/aps-environment: production/);
  });

  test('l’app no anuncia push i l’IPA porta aps-environment: només un avís (D-B9-17), i es puja', async () => {
    escriuIpa('App.ipa', ipaBo({ aps: 'production' }));
    expect(await intern()).toBe(EIXIDA.BE);
    expect(eixida.join('')).toMatch(/! l'IPA porta aps-environment production però l'app no anuncia avisos remots/);
    expect(m.pujats).toHaveLength(1);
  });
});

describe('el canal de producció', () => {
  test('el preflight rep el canal i --push', async () => {
    await produccio('--push');
    expect(crides('preflight')[0][2]).toMatchObject({ canal: 'produccio', push: true, plataformes: ['ios'] });
  });

  test('--compila i --confirma junts, un canal desconegut o un «sí» intern: 2, 2 i 10, abans del preflight', async () => {
    const ipa = escriuIpa('App.ipa', ipaBo());
    expect(await produccio('--compila', siDe(ipa))).toBe(EIXIDA.US);
    expect(await main(['--versio', '1.0.0', '--build', BUILD, '--canal', 'testflight'])).toBe(EIXIDA.US);
    expect(await produccio(`--confirma=1.0.0+${BUILD}`)).toBe(EIXIDA.CONFIRMACIO);
    expect(m.crides).toEqual([]);
  });

  test('un sha12 que no és el de l’IPA: eixida 10, sense obrir-lo, validar-lo ni pujar-lo', async () => {
    escriuIpa('App.ipa', ipaBo());
    expect(await produccio(`--confirma=produccio:1.0.0+${BUILD}@000000000000`)).toBe(EIXIDA.CONFIRMACIO);
    expect(crides('ditto')).toEqual([]);
    expect(validacions()).toEqual([]);
    expect(m.pujats).toEqual([]);
    expect(registre()).toEqual([]);
  });

  test('camí bo: puja la còpia verificada, l’apunta DESPRÉS com a producció i dona els passos de revisió sense TestFlight', async () => {
    const ipa = escriuIpa('App.ipa', ipaBo());
    const empremta = sha256(fs.readFileSync(ipa));
    expect(await produccio(siDe(ipa))).toBe(EIXIDA.BE);
    expect(m.pujats).toHaveLength(1);
    expect(sha256(m.pujats[0].octets)).toBe(empremta);
    expect(registre()).toEqual([{ plataforma: 'ios', canal: 'produccio', versio: '1.0.0', build: BUILD, sha256: empremta, commit: 'a'.repeat(40), data: expect.any(String) }]);
    const text = eixida.join('');
    expect(text).toContain('«Afegeix per a revisió» › «Envia a App Review»');
    expect(text).toContain(`versió iOS 1.0.0`);
    expect(text).toMatch(/canal: produccio/);
  });

  test('si altool falla en pujar, el registre no s’apunta', async () => {
    const ipa = escriuIpa('App.ipa', ipaBo());
    m.codiPujada = 1;
    expect(await produccio(siDe(ipa))).toBe(EIXIDA.EXTERNA);
    expect(registre()).toEqual([]);
  });

  test('el build ja pujat a intern: eixida 7 amb «adjunta’l», abans d’arxivar ni d’obrir cap IPA', async () => {
    const ipa = escriuIpa('App.ipa', ipaBo());
    fs.writeFileSync(path.join(m.fora, REGISTRE_DE_PUJADES), `${JSON.stringify({ plataforma: 'ios', canal: 'intern', versio: '1.0.0', build: BUILD })}\n`, { mode: 0o600 });
    expect(await produccio(siDe(ipa))).toBe(EIXIDA.ARBRE);
    expect(errors.join('')).toMatch(/adjunta'l a la versió de l'App Store/);
    expect(crides('xcodebuild')).toEqual([]);
    expect(crides('ditto')).toEqual([]);
    expect(m.pujats).toEqual([]);
  });

  test('--compila a producció: arxiva, exporta i verifica, i el rebut dona el «sí» amb el sha12 de l’IPA, sense altool', async () => {
    fs.rmSync(pla.arxiu, { recursive: true, force: true });
    fs.rmSync(pla.exportacio, { recursive: true, force: true });
    expect(await produccio('--compila')).toBe(EIXIDA.BE);
    expect(crides('xcodebuild').map(([, args]) => args.includes('archive') || args.includes('-exportArchive'))).toEqual([true, true]);
    const ipa = path.join(pla.exportacio, 'App.ipa');
    expect(eixida.join('')).toContain(`«sí» per a pujar ESTE IPA: --canal produccio --confirma=produccio:1.0.0+${BUILD}@${sha256(fs.readFileSync(ipa)).slice(0, 12)}`);
    expect(crides('xcrun')).toEqual([]);
    expect(registre()).toEqual([]);
  });

  test('en sec a producció: el «sí» amb el marcador i la llista d’abans de la revisió, sense cap eina', async () => {
    expect(await produccio()).toBe(EIXIDA.BE);
    const text = eixida.join('');
    expect(text).toContain(`--canal produccio --confirma=produccio:1.0.0+${BUILD}@<12 primers del sha256>`);
    expect(text).toMatch(/comerciant de la DSA/);
    expect(m.crides.filter(([ordre]) => ordre !== 'preflight')).toEqual([]);
  });

  /* ARB-N05-03 · L'arxiu i l'IPA ja fets (p. ex., amb un --compila intern): --compila pararia (7) i
     gastaria un número de build. L'execució en sec diu d'on traure el sha12, i --confirma funciona. */
  test('en sec a producció amb l’arxiu i l’IPA ja fets: no torna a demanar --compila i diu d’on traure el sha12, sense cap eina', async () => {
    const ipa = escriuIpa('App.ipa', ipaBo());
    expect(await produccio()).toBe(EIXIDA.BE);
    const text = eixida.join('');
    expect(text).not.toMatch(/Primer --canal produccio --compila/);
    expect(text).toMatch(/no cal --compila/);
    expect(text).toContain(`shasum -a 256 <SDP_BUILDS_DIR>/sdp-ios-1.0.0-${BUILD}/export/App.ipa | cut -c1-12`);
    expect(text).toContain(`--canal produccio --confirma=produccio:1.0.0+${BUILD}@<12 primers del sha256>`);
    expect(text).toMatch(/comerciant de la DSA/);
    expect(text, 'cap ruta del fitxer d’entorn').not.toContain(m.fora);
    expect(m.crides.filter(([ordre]) => ordre !== 'preflight')).toEqual([]);
    /* El camí que diu és bo: --confirma amb el sha12 de l'IPA puja la còpia verificada. */
    expect(await produccio(siDe(ipa))).toBe(EIXIDA.BE);
    expect(m.pujats).toHaveLength(1);
  });

  test('--compila amb l’arxiu ja fet: 7; a producció, el missatge porta primer al --confirma de producció; a intern, com sempre', async () => {
    escriuIpa('App.ipa', ipaBo());
    expect(await produccio('--compila')).toBe(EIXIDA.ARBRE);
    const enProduccio = errors.join('');
    const si = enProduccio.indexOf(`--canal produccio --confirma=produccio:1.0.0+${BUILD}@<12 primers del sha256>`);
    expect(si).toBeGreaterThan(-1);
    expect(si).toBeLessThan(enProduccio.indexOf('puja el build següent'));
    errors.length = 0;
    expect(await main(['--versio', '1.0.0', '--build', BUILD, '--compila'])).toBe(EIXIDA.ARBRE);
    expect(errors.join('')).toMatch(/ja hi ha un arxiu per a esta versió i este build: puja el build següent \(el Mestre decidix què fer amb l'anterior\)/);
    expect(errors.join('')).not.toMatch(/produccio/);
    expect(crides('xcodebuild')).toEqual([]);
  });

  test('PASSOS_REVISIO_IOS: cap grup de TestFlight ni provadors, i l’App Review és del Mestre', () => {
    const tot = PASSOS_REVISIO_IOS.join('\n');
    expect(tot).not.toMatch(/TestFlight|provador|tester|grup/i);
    expect(tot).toMatch(/Publicació de la versió: manual/);
    expect(tot).toMatch(/Envia a App Review/);
    expect(Object.isFrozen(PASSOS_REVISIO_IOS)).toBe(true);
  });
});
