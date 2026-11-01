// @vitest-environment node
/* PC155-03, 03b i 03c (auditoria de Codex post-155d84bd8, marató 261101_2143) · puja-ios.mjs
   exigix un sol IPA a export/, el copia en una carpeta privada amb el sha256 fixat, verifica DINS
   d'eixa còpia el segell, la signatura (codesign --verify i l'equip) i l'Info.plist, i altool
   valida i puja eixa mateixa còpia; el rebut diu el sha256 fixat, no un de recalculat.
   El primer cas és el reproductor de Codex
   (_investigacio_ia_de_poble/261101_auditoria_postcommit_codex/adversarial.ipa.test.js) girat.
   Cap eina real: executa (ditto, plutil, codesign, xcodebuild, xcrun) i el preflight són simulats.
   Un «IPA» de prova és un JSON que la simulació de ditto desplega en carpetes de veres.
   Cada guarda del script té un cas que la mossega (16 mutacions, corrector de la marató): també
   el realpath de public/ i de Payload/, la còpia 0400, les carreres en copiar i en verificar i el
   segell de l'.xcarchive. */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const EQUIP = 'ABCDEFGHIJ';
const m = vi.hoisted(() => ({
  root: '', valors: {}, crides: [], ajuda: '', pujats: [], modes: [], codiValidacio: 0,
  trasEmpremta: null, durantVerificacio: null, durantValidacio: null, durantPujada: null, xcodebuild: null
}));
const BE = { codi: 0, crua: '', eixida: '' };

/* La simulació de «ditto -x -k <ipa> <desti>»: desplega les apps que descriu el JSON. ditto
   conserva els enllaços, i per això un IPA de prova pot portar Payload/, una app o public/ enllaçats. */
function desplega(ipa, desti) {
  let arbre;
  try { arbre = JSON.parse(fs.readFileSync(ipa, 'utf8')); } catch { return { codi: 1, crua: '', eixida: '' }; }
  if (arbre.payloadEnllac) {
    fs.mkdirSync(desti, { recursive: true });
    fs.symlinkSync(arbre.payloadEnllac, path.join(desti, 'Payload'));
    return BE;
  }
  fs.mkdirSync(path.join(desti, 'Payload'), { recursive: true });
  for (const [nom, app] of Object.entries(arbre.apps ?? {})) {
    const dir = path.join(desti, 'Payload', nom);
    if (app.enllac) { fs.symlinkSync(app.enllac, dir); continue; }
    fs.mkdirSync(dir, { recursive: true });
    if (app.publicEnllac) fs.symlinkSync(app.publicEnllac, path.join(dir, 'public'));
    else fs.mkdirSync(path.join(dir, 'public'));
    if (app.plist) fs.writeFileSync(path.join(dir, 'Info.plist'), JSON.stringify(app.plist));
    if (typeof app.segell === 'string') fs.writeFileSync(path.join(dir, 'public', 'segell.json'), app.segell);
    if (app.segellEnllac) fs.symlinkSync(app.segellEnllac, path.join(dir, 'public', 'segell.json'));
    fs.writeFileSync(path.join(dir, '.firma'), JSON.stringify({ equip: app.equip, valida: app.valida !== false }));
  }
  return BE;
}

vi.mock('../scripts/botigues/preflight.mjs', () => ({
  arrelComprovada: () => m.root,
  projecteIos: () => ({ opcio: '-project', cami: 'fixture.xcodeproj' }),
  preflight: () => ({ codi: 0, linies: [], valors: m.valors, segell: { commit: 'a'.repeat(40) }, fastlane: false })
}));
vi.mock('../scripts/botigues/entorn.mjs', async (original) => {
  const real = await original();
  return {
    ...real,
    /* El sha256 és el de veres; trasEmpremta deixa canviar un fitxer just després de mirar-lo. */
    sha256DeFitxer: (cami) => { const empremta = real.sha256DeFitxer(cami); m.trasEmpremta?.(cami); return empremta; },
    llegixAjuda: () => m.ajuda,
    executa: async (ordre, args) => {
      m.crides.push([ordre, [...args]]);
      if (ordre === 'ditto') return desplega(args[2], args[3]);
      if (ordre === 'plutil') {
        try { return { codi: 0, crua: String(JSON.parse(fs.readFileSync(args.at(-1), 'utf8'))[args[1]] ?? ''), eixida: '' }; } catch { return { codi: 1, crua: '', eixida: '' }; }
      }
      if (ordre === 'codesign') {
        const firma = JSON.parse(fs.readFileSync(path.join(args.at(-1), '.firma'), 'utf8'));
        // Cada app de prova (també l'arxivada, que sempre és bona) porta la seua «.firma».
        if (args[0] === '--verify') { m.durantVerificacio?.(args.at(-1)); return { codi: firma.valida ? 0 : 1, crua: '', eixida: '' }; }
        return { codi: 0, crua: `Executable=x\nTeamIdentifier=${firma.equip}\n`, eixida: '' };
      }
      if (ordre === 'xcodebuild') return m.xcodebuild?.(args) ?? BE;
      if (ordre === 'xcrun' && args.includes('--validate-app')) {
        const cami = args[args.indexOf('--validate-app') + 1];
        m.modes.push(fs.statSync(cami).mode & 0o777);
        m.durantValidacio?.(cami);
        return { codi: m.codiValidacio, crua: '', eixida: '' };
      }
      if (ordre === 'xcrun' && args.includes('--upload-app')) {
        const cami = args[args.indexOf('-f') + 1];
        m.modes.push(fs.statSync(cami).mode & 0o777);
        m.pujats.push({ cami, octets: fs.readFileSync(cami) });
        m.durantPujada?.(cami);
      }
      return BE;
    }
  };
});

const { EIXIDA } = await import('../scripts/botigues/entorn.mjs');
const { OPCIONS_ALTOOL, OPCIONS_XCODEBUILD, ipaUnicDe, main, planIos, rebut } = await import('../scripts/botigues/puja-ios.mjs');
/* El --build ha de ser VERSIO_CLIENT_NATIU (versio-client.mjs): la prova el llig, no el fixa, i no cau quan la constant puja. */
const { VERSIO_CLIENT_NATIU } = await import('../scripts/botigues/versio-client.mjs');
const BUILD = String(VERSIO_CLIENT_NATIU);

const SEGELL = JSON.stringify({ commit: 'a'.repeat(40), arbreNet: true, data: '2026-11-01T12:00:00Z' });
const SEGELL_VELL = JSON.stringify({ commit: 'b'.repeat(40), arbreNet: true, data: '2026-10-01T12:00:00Z' });
const appBona = (sobre = {}) => ({ plist: { CFBundleShortVersionString: '1.0.0', CFBundleVersion: BUILD }, segell: SEGELL, equip: EQUIP, ...sobre });
const ipaBo = () => ({ apps: { 'App.app': appBona() } });
const sha256 = (octets) => createHash('sha256').update(octets).digest('hex');

let pla;
let eixida;
let errors;
/* main només treballa en macOS; la prova corre també a la CI (Linux) amb les eines simulades. */
const PLATAFORMA = Object.getOwnPropertyDescriptor(process, 'platform');
beforeEach(() => {
  Object.defineProperty(process, 'platform', { ...PLATAFORMA, value: 'darwin' });
  m.root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-ipa-prova-')));
  m.valors = { SDP_BUILDS_DIR: path.join(m.root, 'builds'), SDP_APPLE_TEAM_ID: EQUIP, SDP_ASC_KEY_PATH: path.join(m.root, 'fixture.p8'), SDP_ASC_KEY_ID: 'EXEMPLE', SDP_ASC_ISSUER_ID: 'exemple' };
  m.ajuda = [...OPCIONS_ALTOOL, ...OPCIONS_XCODEBUILD].join(' ');
  Object.assign(m, { crides: [], pujats: [], modes: [], codiValidacio: 0, trasEmpremta: null, durantVerificacio: null, durantValidacio: null, durantPujada: null, xcodebuild: null });
  pla = planIos({ arrel: m.root, valors: m.valors, versio: '1.0.0', build: BUILD, projecte: { opcio: '-project', cami: 'fixture' } });
  fs.mkdirSync(path.join(pla.app, 'public'), { recursive: true });
  fs.mkdirSync(path.join(m.root, 'dist-natiu'), { recursive: true });
  fs.mkdirSync(pla.exportacio, { recursive: true });
  fs.writeFileSync(path.join(m.root, 'dist-natiu/segell.json'), SEGELL);
  fs.writeFileSync(path.join(pla.app, 'public/segell.json'), SEGELL);
  /* L'app arxivada és sempre bona (segell, equip i versió): els casos dolents només són a l'IPA. */
  fs.writeFileSync(path.join(pla.app, 'Info.plist'), JSON.stringify(appBona().plist));
  fs.writeFileSync(path.join(pla.app, '.firma'), JSON.stringify({ equip: EQUIP, valida: true }));
  eixida = [];
  errors = [];
  vi.spyOn(process.stdout, 'write').mockImplementation((s) => { eixida.push(String(s)); return true; });
  vi.spyOn(process.stderr, 'write').mockImplementation((s) => { errors.push(String(s)); return true; });
});
afterEach(() => {
  Object.defineProperty(process, 'platform', PLATAFORMA);
  vi.restoreAllMocks();
  fs.rmSync(m.root, { recursive: true, force: true });
});

const escriuIpa = (nom, arbre) => {
  const cami = path.join(pla.exportacio, nom);
  fs.writeFileSync(cami, JSON.stringify(arbre));
  return cami;
};
const crides = (nom) => m.crides.filter(([ordre]) => ordre === nom);
const validacions = () => m.crides.filter(([ordre, args]) => ordre === 'xcrun' && args.includes('--validate-app'));
const privades = () => fs.readdirSync(pla.carpeta).filter((nom) => nom.startsWith('verifica-ipa-'));
const puja = () => main(['--versio', '1.0.0', '--build', BUILD, `--confirma=1.0.0+${BUILD}`]);
const DINS_DE_LA_COPIA = /\/verifica-ipa-[^/]+\/obert\/Payload\/App\.app(\/Info\.plist)?$/;

describe('reproductor de Codex, girat', () => {
  test('dos IPA a export/ (un de vell i un de nou): no es tria cap, no s’obri ni es puja res i no hi ha rebut', async () => {
    escriuIpa('A-vell.ipa', { apps: { 'App.app': appBona({ segell: SEGELL_VELL }) } });
    escriuIpa('Z-nou.ipa', ipaBo());
    expect(await puja()).toBe(EIXIDA.ARBRE);
    expect(m.pujats).toEqual([]);
    expect(validacions()).toEqual([]);
    expect(crides('ditto')).toEqual([]);
    expect(crides('codesign')).toEqual([]);
    expect(errors.join('')).toContain('hi ha 2 IPA a la carpeta d\'exportació (A-vell.ipa, Z-nou.ipa)');
    expect(eixida.join('')).not.toContain('REBUT');
    expect(privades()).toEqual([]);
  });
});

describe('el que es verifica és el que es puja', () => {
  test('un sol IPA bo: es verifica dins de la còpia privada, eixa còpia es valida i es puja, i el rebut diu el seu sha256', async () => {
    const ipa = escriuIpa('App.ipa', ipaBo());
    const octets = fs.readFileSync(ipa);
    expect(await puja()).toBe(EIXIDA.BE);
    expect(m.pujats).toHaveLength(1);
    const [{ cami: pujat, octets: octetsPujats }] = m.pujats;
    /* altool rep la còpia privada (no el fitxer d'export/), amb els mateixos octets. */
    expect(pujat).not.toBe(ipa);
    expect(path.relative(pla.carpeta, pujat)).toMatch(/^verifica-ipa-[^/]+\/App\.ipa$/);
    expect(Buffer.compare(octetsPujats, octets)).toBe(0);
    expect(validacions()).toHaveLength(1);
    expect(validacions()[0][1]).toContain(pujat);
    /* La còpia que reben --validate-app i --upload-app és de només lectura (0400). */
    expect(m.modes).toEqual([0o400, 0o400]);
    /* ditto obri eixa mateixa còpia; plutil i codesign miren l'app que n'ix, no la de l'.xcarchive. */
    expect(crides('ditto')).toHaveLength(1);
    expect(crides('ditto')[0][1].slice(0, 3)).toEqual(['-x', '-k', pujat]);
    for (const [ordre, args] of [...crides('plutil'), ...crides('codesign')]) {
      expect(args.at(-1), ordre).toMatch(DINS_DE_LA_COPIA);
      expect(args.at(-1).startsWith(pla.arxiu), ordre).toBe(false);
    }
    /* PC155-03c · la integritat es comprova (--verify --deep --strict), no només es llig l'equip (-dv). */
    expect(crides('codesign').map(([, args]) => args[0])).toEqual(['--verify', '-dv']);
    expect(crides('codesign')[0][1]).toEqual(expect.arrayContaining(['--deep', '--strict']));
    /* L'ordre: obrir i verificar abans de validar, i validar abans de pujar. */
    const posicio = (prova) => m.crides.findIndex(prova);
    expect(posicio(([o]) => o === 'ditto')).toBeLessThan(posicio(([o, a]) => o === 'codesign' && a[0] === '--verify'));
    expect(posicio(([o]) => o === 'plutil')).toBeLessThan(posicio(([o, a]) => o === 'xcrun' && a.includes('--validate-app')));
    expect(posicio(([o, a]) => o === 'xcrun' && a.includes('--validate-app'))).toBeLessThan(posicio(([o, a]) => o === 'xcrun' && a.includes('--upload-app')));
    const text = eixida.join('');
    expect(text).toContain(`sha256 de l'IPA: ${sha256(octets)}`);
    expect(text).toContain('IPA: App.ipa');
    expect(text).toContain(`commit: ${'a'.repeat(40)}`);
    expect(text).toContain('pujat a App Store Connect: sí');
    /* La carpeta privada no queda i el fitxer d'export/ no s'ha tocat. */
    expect(privades()).toEqual([]);
    expect(Buffer.compare(fs.readFileSync(ipa), octets)).toBe(0);
  });

  test('--compila: arxiva, exporta, verifica l’IPA exportat i el rebut diu «pujat: no» sense cap altool', async () => {
    fs.rmSync(pla.arxiu, { recursive: true, force: true });
    fs.rmSync(pla.exportacio, { recursive: true, force: true });
    let octets = null;
    m.xcodebuild = (args) => {
      if (args.includes('archive')) {
        fs.mkdirSync(path.join(pla.app, 'public'), { recursive: true });
        fs.writeFileSync(path.join(pla.app, 'public/segell.json'), SEGELL);
        fs.writeFileSync(path.join(pla.app, 'Info.plist'), JSON.stringify(appBona().plist));
        fs.writeFileSync(path.join(pla.app, '.firma'), JSON.stringify({ equip: EQUIP, valida: true }));
      }
      if (args.includes('-exportArchive')) {
        fs.mkdirSync(pla.exportacio, { recursive: true });
        octets = fs.readFileSync(escriuIpa('App.ipa', ipaBo()));
      }
      return BE;
    };
    expect(await main(['--versio', '1.0.0', '--build', BUILD, '--compila'])).toBe(EIXIDA.BE);
    expect(crides('xcrun')).toEqual([]);
    expect(crides('codesign')[0][1][0]).toBe('--verify');
    const text = eixida.join('');
    expect(text).toContain(`sha256 de l'IPA: ${sha256(octets)}`);
    expect(text).toContain('pujat a App Store Connect: no');
    expect(privades()).toEqual([]);
  });

  test.each([
    ['el segell de l’IPA és d’un altre build (l’arxiu sí que és bo)', () => ({ apps: { 'App.app': appBona({ segell: SEGELL_VELL }) } }), 'ARBRE'],
    ['l’IPA no porta segell', () => ({ apps: { 'App.app': appBona({ segell: undefined }) } }), 'ARBRE'],
    ['el segell de l’IPA és un enllaç al dist-natiu/ del repositori', (arrel) => ({ apps: { 'App.app': appBona({ segell: undefined, segellEnllac: path.join(arrel, 'dist-natiu/segell.json') }) } }), 'VERIFICACIO'],
    ['l’IPA és d’un altre build', () => ({ apps: { 'App.app': appBona({ plist: { CFBundleShortVersionString: '1.0.0', CFBundleVersion: String(VERSIO_CLIENT_NATIU + 1) } }) } }), 'VERIFICACIO'],
    ['l’app de l’IPA no porta Info.plist', () => ({ apps: { 'App.app': appBona({ plist: undefined }) } }), 'VERIFICACIO'],
    ['l’IPA el signa un altre equip', () => ({ apps: { 'App.app': appBona({ equip: 'ZZZZZZZZZZ' }) } }), 'VERIFICACIO'],
    ['la signatura de l’IPA no és íntegra (03c)', () => ({ apps: { 'App.app': appBona({ valida: false }) } }), 'VERIFICACIO'],
    ['l’IPA porta dues apps', () => ({ apps: { 'App.app': appBona(), 'Altra.app': appBona() } }), 'VERIFICACIO'],
    ['l’IPA no porta cap app', () => ({ apps: {} }), 'VERIFICACIO'],
    ['Payload/App.app és un enllaç a l’app arxivada', () => ({ apps: { 'App.app': { enllac: pla.app } } }), 'VERIFICACIO'],
    /* Les dues guardes de realpath: lstat no veu un enllaç que no siga l'últim tros del camí. */
    ['public/ de l’app de l’IPA és un enllaç al dist-natiu/ del repositori', (arrel) => ({ apps: { 'App.app': appBona({ segell: undefined, publicEnllac: path.join(arrel, 'dist-natiu') }) } }), 'VERIFICACIO'],
    ['Payload/ de l’IPA és un enllaç fora de la carpeta privada (a l’app arxivada)', () => ({ payloadEnllac: path.dirname(pla.app) }), 'VERIFICACIO'],
    ['l’IPA no s’obri (no és un zip)', () => 'no és un IPA', 'VERIFICACIO']
  ])('%s: no es puja res, no hi ha rebut i la carpeta privada no queda', async (_nom, arbre, codi) => {
    const contingut = arbre(m.root);
    fs.writeFileSync(path.join(pla.exportacio, 'App.ipa'), typeof contingut === 'string' ? contingut : JSON.stringify(contingut));
    expect(await puja()).toBe(EIXIDA[codi]);
    expect(m.pujats).toEqual([]);
    expect(validacions()).toEqual([]);
    expect(eixida.join('')).not.toContain('REBUT');
    expect(privades()).toEqual([]);
    /* Esborrar la carpeta privada no segueix els enllaços: el segell i l'app arxivada continuen. */
    expect(fs.readFileSync(path.join(m.root, 'dist-natiu/segell.json'), 'utf8')).toBe(SEGELL);
    expect(fs.existsSync(path.join(pla.app, 'Info.plist'))).toBe(true);
  });

  test('l’app arxivada porta el segell d’un altre build (l’IPA és bo): no s’obri cap IPA ni es puja res', async () => {
    fs.writeFileSync(path.join(pla.app, 'public/segell.json'), SEGELL_VELL);
    escriuIpa('App.ipa', ipaBo());
    expect(await puja()).toBe(EIXIDA.ARBRE);
    expect(errors.join('')).toContain('l\'app arxivada porta el segell d\'un altre build');
    expect(crides('ditto')).toEqual([]);
    expect(crides('codesign')).toEqual([]);
    expect(validacions()).toEqual([]);
    expect(m.pujats).toEqual([]);
    expect(eixida.join('')).not.toContain('REBUT');
    expect(privades()).toEqual([]);
  });
});

describe('PC155-03b · els octets fixats', () => {
  test('si el fitxer d’export/ canvia mentre es copia, no s’obri ni es puja res', async () => {
    const ipa = escriuIpa('App.ipa', ipaBo());
    /* Un altre IPA que també passaria la verificació: només la comparació dels dos sha256 el para. */
    m.trasEmpremta = (cami) => {
      if (cami !== ipa) return;
      m.trasEmpremta = null;
      fs.writeFileSync(ipa, JSON.stringify({ apps: { 'App.app': appBona({ altre: true }) } }));
    };
    expect(await puja()).toBe(EIXIDA.VERIFICACIO);
    expect(errors.join('')).toContain('ha canviat mentre es copiava');
    expect(crides('ditto')).toEqual([]);
    expect(validacions()).toEqual([]);
    expect(m.pujats).toEqual([]);
    expect(eixida.join('')).not.toContain('REBUT');
    expect(privades()).toEqual([]);
  });

  test('si la còpia canvia mentre es verifica, no es valida ni es puja res', async () => {
    escriuIpa('App.ipa', ipaBo());
    m.durantVerificacio = () => {
      const [[, [, , copia]]] = crides('ditto');
      fs.chmodSync(copia, 0o600);
      fs.appendFileSync(copia, ' ');
    };
    expect(await puja()).toBe(EIXIDA.VERIFICACIO);
    expect(errors.join('')).toContain('ha canviat mentre es verificava');
    expect(validacions()).toEqual([]);
    expect(m.pujats).toEqual([]);
    expect(eixida.join('')).not.toContain('REBUT');
    expect(privades()).toEqual([]);
  });

  test('si el fitxer d’export/ canvia durant la validació, es puja igualment la còpia verificada i el rebut diu el seu sha256', async () => {
    const ipa = escriuIpa('App.ipa', ipaBo());
    const verificats = fs.readFileSync(ipa);
    m.durantValidacio = () => fs.writeFileSync(ipa, JSON.stringify({ apps: { 'App.app': appBona({ segell: SEGELL_VELL }) } }));
    expect(await puja()).toBe(EIXIDA.BE);
    expect(m.pujats).toHaveLength(1);
    expect(Buffer.compare(m.pujats[0].octets, verificats)).toBe(0);
    expect(Buffer.compare(fs.readFileSync(ipa), verificats)).not.toBe(0);
    expect(eixida.join('')).toContain(`sha256 de l'IPA: ${sha256(verificats)}`);
  });

  test('si la còpia verificada canvia entre la validació i la pujada, no es puja res', async () => {
    escriuIpa('App.ipa', ipaBo());
    m.durantValidacio = (copia) => { fs.chmodSync(copia, 0o600); fs.appendFileSync(copia, ' '); };
    expect(await puja()).toBe(EIXIDA.VERIFICACIO);
    expect(m.pujats).toEqual([]);
    expect(errors.join('')).toContain('ha canviat després de validar-la');
    expect(eixida.join('')).not.toContain('REBUT');
    expect(privades()).toEqual([]);
  });

  test('si la còpia canvia durant la pujada, no hi ha rebut', async () => {
    escriuIpa('App.ipa', ipaBo());
    m.durantPujada = (copia) => { fs.chmodSync(copia, 0o600); fs.appendFileSync(copia, ' '); };
    expect(await puja()).toBe(EIXIDA.VERIFICACIO);
    expect(m.pujats).toHaveLength(1);
    expect(errors.join('')).toContain('ha canviat durant la pujada: cap rebut');
    expect(eixida.join('')).not.toContain('REBUT');
    expect(privades()).toEqual([]);
  });

  test('si altool --validate-app falla, no es puja res i la carpeta privada no queda', async () => {
    escriuIpa('App.ipa', ipaBo());
    m.codiValidacio = 1;
    expect(await puja()).toBe(EIXIDA.EXTERNA);
    expect(m.pujats).toEqual([]);
    expect(privades()).toEqual([]);
  });

  test('rebut: amb el sha256 fixat no el recalcula (ni llig l’IPA); sense IPA, com abans', () => {
    const fixat = 'f'.repeat(64);
    const text = rebut({ segell: { commit: 'c'.repeat(40) }, versio: '1.0.0', build: '2', ipa: path.join(m.root, 'no-hi-es', 'App.ipa'), sha256: fixat, pujat: true });
    expect(text).toContain(`sha256 de l'IPA: ${fixat}`);
    expect(text).toContain('IPA: App.ipa');
    const sense = rebut({ segell: null, versio: '1.0.0', build: '2', ipa: null, pujat: false });
    expect(sense).toMatch(/^ {2}IPA: sense IPA$/m);
    expect(sense).toMatch(/^ {2}sha256 de l'IPA: sense IPA$/m);
    expect(sense).toMatch(/^ {2}commit: desconegut \(el de dist-natiu\/segell\.json, que porta l'app arxivada\)$/m);
  });
});

describe('ipaUnicDe i el pla en sec', () => {
  test('ipaUnicDe: sense carpeta, cap, un, dos (també amb l’extensió en majúscules), un enllaç i una carpeta', () => {
    expect(ipaUnicDe(path.join(m.root, 'no-hi-es'))).toEqual({ ipa: null, problema: null });
    expect(ipaUnicDe(pla.exportacio)).toEqual({ ipa: null, problema: null });
    const ipa = escriuIpa('App.ipa', {});
    expect(ipaUnicDe(pla.exportacio)).toEqual({ ipa, problema: null });
    fs.writeFileSync(path.join(pla.exportacio, 'VELL.IPA'), '{}');
    expect(ipaUnicDe(pla.exportacio)).toEqual({ ipa: null, problema: expect.stringMatching(/^hi ha 2 IPA .*\(App\.ipa, VELL\.IPA\)/) });
    fs.rmSync(path.join(pla.exportacio, 'VELL.IPA'));
    fs.rmSync(ipa);
    fs.symlinkSync(path.join(m.root, 'dist-natiu/segell.json'), ipa);
    expect(ipaUnicDe(pla.exportacio)).toEqual({ ipa: null, problema: 'App.ipa no és un fitxer regular' });
    fs.rmSync(ipa);
    fs.mkdirSync(ipa);
    expect(ipaUnicDe(pla.exportacio).problema).toBe('App.ipa no és un fitxer regular');
  });

  test('en sec: el pla diu la verificació nova i que altool rep la còpia privada, i no s’executa cap eina', async () => {
    expect(await main(['--versio', '1.0.0', '--build', BUILD])).toBe(EIXIDA.BE);
    const text = eixida.join('');
    expect(text).toContain('codesign --verify --deep --strict');
    expect(text).toMatch(new RegExp(`altool --validate-app '?<SDP_BUILDS_DIR>/sdp-ios-1\\.0\\.0-${BUILD}/verifica-ipa-XXXXXX/App\\.ipa`));
    expect(text).not.toContain(m.root);
    expect(m.crides).toEqual([]);
  });
});
