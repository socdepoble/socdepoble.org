// @vitest-environment node
/* Fase D (261020, tasca 5) · El projecte natiu d'iOS (ios/, nascut de `cap add ios`
   el 261020 i retocat a mà una sola vegada). Res d'açò ho regenera Capacitor: si
   algú torna a crear el projecte, o Xcode el reescriu, esta prova diu què s'ha
   perdut. Mira els fitxers tal com són (sense plutil ni xcodebuild):
     · Info.plist: regió ca, les cinc llengües, arm64, sense xifrat propi, els
       quatre textos dels permisos, UN esquema de Google (la reserva o el de veres)
       i l'iPhone només en vertical (Fase D, 261020, revisió);
     · project.pbxproj: iOS 16.0 als quatre llocs, l'identificador, els drets i els
       recursos nous (manifest de privacitat i InfoPlist.strings en 5 llengües);
     · Package.swift i Package.resolved: la plataforma, la versió de Capacitor i cap
       SDK de Facebook;
     · App.entitlements, PrivacyInfo.xcprivacy i els cinc InfoPlist.strings;
     · .gitignore: el que genera `cap sync` no entra a git, el projecte sí.
   Sense ios/App/App.xcodeproj (un arbre sense el projecte), se salta dient per què. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { esquemaInvertitDeGoogleIos } from '../config/publicCredentials.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const IOS = path.join(ARREL, 'ios');
const APP = path.join(IOS, 'App', 'App');
const PROJECTE = path.join(IOS, 'App', 'App.xcodeproj');
const HI_HA_PROJECTE = fs.existsSync(PROJECTE);
const llig = (...trossos) => fs.readFileSync(path.join(...trossos), 'utf8');

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const PERMISOS = ['NSCameraUsageDescription', 'NSMicrophoneUsageDescription', 'NSPhotoLibraryAddUsageDescription', 'NSPhotoLibraryUsageDescription'];
const TEXTOS_CA = Object.freeze({
  NSCameraUsageDescription: 'Sóc de Poble necessita accés a la càmera per a fer fotos dels productes del mercat o actualitzar el teu perfil.',
  NSMicrophoneUsageDescription: 'Sóc de Poble necessita el micròfon per a gravar el so dels vídeos que compartixes amb el poble.',
  NSPhotoLibraryAddUsageDescription: 'Permet desar a la teua galeria les imatges que tries guardar de Sóc de Poble.',
  NSPhotoLibraryUsageDescription: 'Permet triar fotografies de la teua galeria per a compartir-les amb el poble.'
});
const ESQUEMA_GOOGLE = /^com\.googleusercontent\.apps\.(?:pendent|[0-9]+-[a-z0-9]+)$/;
const TIPUS_DE_DADES = ['EmailAddress', 'Name', 'UserID', 'PhotosorVideos', 'AudioData', 'OtherUserContent', 'EmailsOrTextMessages']
  .map((tipus) => `NSPrivacyCollectedDataType${tipus}`);

/** Un plist XML com a objecte de JS: dict, array, key, string, integer, true i false. */
function llegixPlist(xml) {
  const net = xml.replace(/<\?xml[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/?plist[^>]*>|<!--[\s\S]*?-->/g, '');
  const fitxes = [...net.matchAll(/<(\/?)(\w+)\s*(\/?)>([^<]*)/g)].map(([, tanca, nom, buit, text]) => ({ tanca: !!tanca, nom, buit: !!buit, text }));
  const desescapa = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  let i = 0;
  const tanca = (nom) => { const f = fitxes[i++]; if (!f?.tanca || f.nom !== nom) throw new Error(`falta </${nom}>`); };
  const valor = () => {
    const f = fitxes[i++];
    if (!f || f.tanca) throw new Error(`etiqueta inesperada: ${f ? `</${f.nom}>` : 'final'}`);
    if (f.nom === 'true' || f.nom === 'false') return f.nom === 'true';
    if (f.nom === 'string' || f.nom === 'integer') { if (f.buit) return ''; tanca(f.nom); return f.nom === 'integer' ? Number(f.text) : desescapa(f.text); }
    if (f.nom === 'array') { const llista = []; if (f.buit) return llista; while (!fitxes[i].tanca) llista.push(valor()); tanca('array'); return llista; }
    if (f.nom === 'dict') {
      const objecte = {};
      if (f.buit) return objecte;
      while (!fitxes[i].tanca) {
        const clau = fitxes[i++];
        if (clau.nom !== 'key') throw new Error(`esperava <key>, no <${clau.nom}>`);
        tanca('key');
        objecte[desescapa(clau.text)] = valor();
      }
      tanca('dict');
      return objecte;
    }
    throw new Error(`etiqueta no prevista: <${f.nom}>`);
  };
  const arrel = valor();
  if (i !== fitxes.length) throw new Error('hi sobra contingut darrere de l’arrel');
  return arrel;
}

/** Un .strings d'Apple ("clau" = "valor";) com a objecte, sense els comentaris. */
function llegixStrings(text) {
  const net = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const desescapa = (t) => t.replace(/\\(["\\])/g, '$1').replace(/\\n/g, '\n');
  return Object.fromEntries([...net.matchAll(/"((?:[^"\\]|\\.)*)"\s*=\s*"((?:[^"\\]|\\.)*)"\s*;/g)].map(([, clau, valor]) => [desescapa(clau), desescapa(valor)]));
}

/** El valor d'una variable d'un fitxer .env (sense imprimir-lo mai), o ''. */
function delEnv(fitxer, nom) {
  if (!fs.existsSync(fitxer)) return '';
  const linia = fs.readFileSync(fitxer, 'utf8').split('\n').map((l) => l.trim()).find((l) => new RegExp(`^(?:export\\s+)?${nom}\\s*=`).test(l));
  return linia ? linia.replace(/^[^=]*=\s*/, '').replace(/^(['"])(.*)\1$/, '$2').trim() : '';
}

describe.skipIf(!HI_HA_PROJECTE)('el projecte d’iOS (ios/)', () => {
  test('el lector de plist i de .strings llig el que diu', () => {
    expect(llegixPlist('<?xml version="1.0"?><plist version="1.0"><dict><key>a</key><array><string>x &amp; y</string><true/></array><key>b</key><array/><key>c</key><integer>3</integer></dict></plist>'))
      .toEqual({ a: ['x & y', true], b: [], c: 3 });
    expect(() => llegixPlist('<dict><key>a</key><string>x</string>')).toThrow();
    expect(llegixStrings('/* nota */\n"a" = "b \\"c\\"";\n// x\n"d"="e";')).toEqual({ a: 'b "c"', d: 'e' });
  });

  test('Info.plist: regió ca, cinc llengües, arm64, sense xifrat propi, el nom i els quatre permisos en valencià', () => {
    const info = llegixPlist(llig(APP, 'Info.plist'));
    expect(info.CFBundleDevelopmentRegion).toBe('ca');
    expect(info.CFBundleLocalizations).toEqual(LLENGUES);
    expect(info.UIRequiredDeviceCapabilities).toEqual(['arm64']);
    expect(info.ITSAppUsesNonExemptEncryption).toBe(false);
    expect(info.CFBundleDisplayName).toBe('Sóc de Poble');
    /* Fase D (261020, revisió al simulador) · El diàleg del sistema «… vol usar
       accounts.google.com per a iniciar sessió» llig CFBundleName: amb el
       $(PRODUCT_NAME) de la plantilla deia «App». */
    expect(info.CFBundleName).toBe('Sóc de Poble');
    for (const permis of PERMISOS) expect(info[permis], permis).toBe(TEXTOS_CA[permis]);
    // Sign in with Apple el fa el sistema (cap Face ID propi); ASWebAuthenticationSession no demana cap esquema propi.
    expect('NSFaceIDUsageDescription' in info).toBe(false);
  });

  /* Fase D (261020, revisió) · La plantilla de `cap add ios` deixa l'iPhone en
     horitzontal, i l'app només farcix el marge segur de dalt: la barra, el
     calaix i les targetes quedarien davall de la Dynamic Island. L'iPhone, en
     vertical; l'iPad, les quatre (la multitasca les demana). */
  test('Info.plist: l’iPhone només en vertical; l’iPad, les quatre orientacions', () => {
    const info = llegixPlist(llig(APP, 'Info.plist'));
    expect(info.UISupportedInterfaceOrientations).toEqual(['UIInterfaceOrientationPortrait']);
    expect(info['UISupportedInterfaceOrientations~ipad']).toEqual([
      'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown',
      'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight'
    ]);
    // Cap ajust del projecte que les torne a escriure per damunt del plist.
    expect(llig(PROJECTE, 'project.pbxproj')).not.toContain('INFOPLIST_KEY_UISupportedInterfaceOrientations');
  });

  test('Info.plist: un sol esquema de Google registrat, la reserva o el del client d’iOS de .env.natiu.local', () => {
    const info = llegixPlist(llig(APP, 'Info.plist'));
    const esquemes = (info.CFBundleURLTypes || []).flatMap((tipus) => tipus.CFBundleURLSchemes || []);
    const deGoogle = esquemes.filter((esquema) => esquema.startsWith('com.googleusercontent.apps.'));
    expect(deGoogle).toHaveLength(1);
    expect(ESQUEMA_GOOGLE.test(deGoogle[0])).toBe(true);
    const client = delEnv(path.join(ARREL, '.env.natiu.local'), 'VITE_NATIU_GOOGLE_IOS_CLIENT_ID');
    if (client) expect(deGoogle[0] === esquemaInvertitDeGoogleIos(client), 'Info.plist no registra l’esquema del client d’iOS de .env.natiu.local').toBe(true);
  });

  test('project.pbxproj: iOS 16.0, l’identificador, els drets i els recursos nous en cinc llengües', () => {
    const pbx = llig(PROJECTE, 'project.pbxproj');
    expect([...pbx.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g)].map((m) => m[1])).toEqual(['16.0', '16.0', '16.0', '16.0']);
    expect(pbx.match(/PRODUCT_BUNDLE_IDENTIFIER = org\.socdepoble\.app;/g)).toHaveLength(2);
    expect(pbx).not.toContain('com.getcapacitor');
    expect(pbx.match(/CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;/g)).toHaveLength(2);
    expect(pbx).toMatch(/developmentRegion = ca;/);
    const recursos = /\/\* Resources \*\/ = \{\s*isa = PBXResourcesBuildPhase;[\s\S]*?files = \(([\s\S]*?)\);/.exec(pbx)?.[1] ?? '';
    expect(recursos).toContain('PrivacyInfo.xcprivacy in Resources');
    expect(recursos).toContain('InfoPlist.strings in Resources');
    const variants = /\/\* InfoPlist\.strings \*\/ = \{\s*isa = PBXVariantGroup;\s*children = \(([\s\S]*?)\);/.exec(pbx)?.[1] ?? '';
    expect([...variants.matchAll(/\/\* (\w+) \*\//g)].map((m) => m[1])).toEqual(LLENGUES);
    for (const llengua of LLENGUES) expect(pbx).toContain(`path = ${llengua}.lproj/InfoPlist.strings;`);
    const regions = /knownRegions = \(([\s\S]*?)\);/.exec(pbx)?.[1].split(',').map((r) => r.trim()).filter(Boolean) ?? [];
    expect([...regions].sort()).toEqual([...LLENGUES, 'Base'].sort());
  });

  test('Package.swift i Package.resolved: iOS 16, la versió exacta de Capacitor del package.json i cap SDK de Facebook', () => {
    const paquet = llig(IOS, 'App', 'CapApp-SPM', 'Package.swift');
    expect(paquet).toContain('.iOS(.v16)');
    const deps = JSON.parse(llig(ARREL, 'package.json')).dependencies || {};
    const versio = deps[['@capa', 'citor/ios'].join('')];
    expect(versio).toMatch(/^\d+\.\d+\.\d+$/);
    expect(paquet).toContain(`exact: "${versio}"`);
    const resolt = path.join(PROJECTE, 'project.xcworkspace', 'xcshareddata', 'swiftpm', 'Package.resolved');
    if (fs.existsSync(resolt)) expect(fs.readFileSync(resolt, 'utf8').toLowerCase()).not.toContain('facebook');
  });

  test('App.entitlements: Sign in with Apple, i res més', () => {
    expect(llegixPlist(llig(APP, 'App.entitlements'))).toEqual({ 'com.apple.developer.applesignin': ['Default'] });
  });

  test('PrivacyInfo.xcprivacy: cap rastreig, set tipus de dades lligats i per al servei, i UserDefaults amb CA92.1', () => {
    const manifest = llegixPlist(llig(APP, 'PrivacyInfo.xcprivacy'));
    expect(manifest.NSPrivacyTracking).toBe(false);
    expect(manifest.NSPrivacyTrackingDomains).toEqual([]);
    const tipus = manifest.NSPrivacyCollectedDataTypes;
    expect(tipus.map((t) => t.NSPrivacyCollectedDataType)).toEqual(TIPUS_DE_DADES);
    for (const t of tipus) {
      expect(t.NSPrivacyCollectedDataTypeLinked, t.NSPrivacyCollectedDataType).toBe(true);
      expect(t.NSPrivacyCollectedDataTypeTracking, t.NSPrivacyCollectedDataType).toBe(false);
      expect(t.NSPrivacyCollectedDataTypePurposes, t.NSPrivacyCollectedDataType).toEqual(['NSPrivacyCollectedDataTypePurposeAppFunctionality']);
    }
    expect(manifest.NSPrivacyAccessedAPITypes).toEqual([
      { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] }
    ]);
  });

  test('InfoPlist.strings: el nom i els quatre permisos en cada llengua; els de ca, els d’Info.plist', () => {
    const info = llegixPlist(llig(APP, 'Info.plist'));
    for (const llengua of LLENGUES) {
      const textos = llegixStrings(llig(APP, `${llengua}.lproj`, 'InfoPlist.strings'));
      expect(Object.keys(textos).sort(), llengua).toEqual(['CFBundleDisplayName', ...PERMISOS].sort());
      expect(textos.CFBundleDisplayName, llengua).toBe('Sóc de Poble');
      for (const permis of PERMISOS) expect(textos[permis].trim().length, `${llengua} · ${permis}`).toBeGreaterThan(20);
      if (llengua === 'ca') for (const permis of PERMISOS) expect(textos[permis], permis).toBe(info[permis]);
    }
  });

  test('.gitignore: el que copia `cap sync` no entra a git; el projecte, sí', (context) => {
    const git = spawnSync('git', ['--version'], { cwd: ARREL });
    if (git.status !== 0) { context.skip(); return; }
    const ignorat = (rel) => spawnSync('git', ['check-ignore', '--no-index', '-q', rel], { cwd: ARREL }).status === 0;
    for (const rel of ['ios/App/App/public/index.html', 'ios/App/App/capacitor.config.json']) expect(ignorat(rel), rel).toBe(true);
    for (const rel of ['ios/App/App/Info.plist', 'ios/App/App.xcodeproj/project.pbxproj', 'ios/App/CapApp-SPM/Package.swift',
      'ios/App/App/App.entitlements', 'ios/App/App/PrivacyInfo.xcprivacy', 'ios/App/App/ca.lproj/InfoPlist.strings']) {
      expect(ignorat(rel), rel).toBe(false);
    }
  });
});

test.skipIf(HI_HA_PROJECTE)('sense ios/App/App.xcodeproj en este arbre, les proves del projecte d’iOS se salten', () => {
  expect(HI_HA_PROJECTE).toBe(false);
});
