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
     · l'extensió «Compartir» (261026): el target App la incrusta i en depén, el
       receptor ajunta els lots en un sol lliurament i escolta l'avís Darwin que
       l'extensió envia, i els textos de l'extensió en les cinc llengües;
     · la barra d'estat amb icones blanques (Info.plist i SystemBars);
     · Gauntlet 261026_1615 (Codex C1615-03 / Gemini G1615-01, G1615-05): les
       còpies locals sobreviuen al load() i tornen (una setmana, deu com a molt),
       l'extensió rebutja els URL que no són web, i l'escena sense storyboard;
     · .gitignore: el que genera `cap sync` no entra a git, el projecte sí.
   Sense ios/App/App.xcodeproj (un arbre sense el projecte), se salta dient per què. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { describe, expect, test } from 'vitest';
import { MAX_FITXERS_COMPARTITS } from '../config/compartirNatiu.js';
import { esquemaInvertitDeGoogleIos } from '../config/publicCredentials.js';
import { CONNECTOR_COMPARTIR, ESDEVENIMENT_COMPARTIT } from './compartirNatiu.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const IOS = path.join(ARREL, 'ios');
const APP = path.join(IOS, 'App', 'App');
const PROJECTE = path.join(IOS, 'App', 'App.xcodeproj');
const HI_HA_PROJECTE = fs.existsSync(PROJECTE);
const llig = (...trossos) => fs.readFileSync(path.join(...trossos), 'utf8');

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const PERMISOS = ['NSCameraUsageDescription', 'NSMicrophoneUsageDescription', 'NSPhotoLibraryAddUsageDescription', 'NSPhotoLibraryUsageDescription'];
const TEXTOS_CA = Object.freeze({
  NSCameraUsageDescription: 'Sóc de Poble necessita accés a la càmera per a fer les fotos i els vídeos que compartixes amb el poble i la foto del teu perfil.',
  NSMicrophoneUsageDescription: 'Sóc de Poble necessita el micròfon per a gravar els àudios del xat i el so dels vídeos que compartixes amb el poble.',
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

/* 261026 (prompt 261026_1615, revisió) · Lectors estructurals per al
   project.pbxproj i per al Swift: el que hi ha entre un signe d'obrir i el seu
   parell, saltant les cadenes entre cometes dobles (amb els seus escapaments). */
const ID_PBX = '[0-9A-F]{24}';
const PARELLS = Object.freeze({ '{': '}', '(': ')', '[': ']' });

/** El contingut entre el signe d'obrir de la posició `obri` i el seu parell; '' si no n'hi ha o no es tanca. */
function tancat(codi, obri) {
  const obertura = codi[obri];
  const parell = PARELLS[obertura];
  if (!parell) return '';
  let fondaria = 0;
  for (let i = obri; i < codi.length; i += 1) {
    const signe = codi[i];
    if (signe === '"') {
      for (i += 1; i < codi.length && codi[i] !== '"'; i += 1) {
        if (codi[i] === '\\') i += 1;
      }
    } else if (signe === obertura) {
      fondaria += 1;
    } else if (signe === parell) {
      fondaria -= 1;
      if (fondaria === 0) return codi.slice(obri + 1, i);
    }
  }
  return '';
}

/** El cos ({…}) de l'objecte del project.pbxproj amb este identificador, o ''. */
function objectePbx(pbx, id) {
  const inici = new RegExp(`^\\s*${id}(?: /\\*[^*]*\\*/)? = \\{`, 'm').exec(pbx);
  return inici ? tancat(pbx, inici.index + inici[0].length - 1) : '';
}

/** L'identificador del PBXNativeTarget amb este nom, o ''. */
const idDelTarget = (pbx, nom) => new RegExp(`^\\s*(${ID_PBX}) /\\* ${nom} \\*/ = \\{\\s*isa = PBXNativeTarget;`, 'm').exec(pbx)?.[1] ?? '';

/** Una llista «clau = ( ID /* nom *\/, … );» d'un objecte com a [{ id, nom }]. */
function llistaPbx(objecte, clau) {
  const llista = new RegExp(`(?:^|[\\s;{])${clau} = \\(([\\s\\S]*?)\\);`).exec(objecte)?.[1] ?? '';
  return [...llista.matchAll(new RegExp(`(${ID_PBX})(?: /\\* ([^*]*?) \\*/)?\\s*,`, 'g'))].map(([, id, nom]) => ({ id, nom: nom ?? '' }));
}

/* Els comentaris de Swift fora («//» dins d'una URL entre cometes no és cap comentari). */
const senseComentarisSwift = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<![:"])\/\/[^\n]*/g, '');

/** El cos de la primera clau que obri darrere de `signatura`, o ''. */
function cosDe(codi, signatura) {
  const inici = codi.indexOf(signatura);
  const obri = inici < 0 ? -1 : codi.indexOf('{', inici + signatura.length);
  return obri < 0 ? '' : tancat(codi, obri);
}

/** Els arguments de la primera crida a `nom(…)`, o ''. */
function crida(codi, nom) {
  const inici = codi.indexOf(`${nom}(`);
  return inici < 0 ? '' : tancat(codi, inici + nom.length);
}

/* Gauntlet 261026_1615 (Codex C1615-03 / Gemini G1615-01) · Les condicions d'un
   `if`/`guard` de Swift, separades per les comes de primer nivell (no les d'un
   literal ["a", "b"], d'una crida o d'una cadena). */
function separaPerComes(text) {
  const trossos = [];
  let tros = '';
  let fondaria = 0;
  for (let i = 0; i < text.length; i += 1) {
    const signe = text[i];
    if (signe === '"') {
      let fi = i + 1;
      for (; fi < text.length && text[fi] !== '"'; fi += 1) {
        if (text[fi] === '\\') fi += 1;
      }
      tros += text.slice(i, fi + 1);
      i = fi;
      continue;
    }
    if ('([{'.includes(signe)) fondaria += 1;
    else if (')]}'.includes(signe)) fondaria -= 1;
    if (signe === ',' && fondaria === 0) { trossos.push(tros.trim()); tros = ''; } else tros += signe;
  }
  trossos.push(tros.trim());
  return trossos.filter(Boolean);
}

/** El valor d'una `static let NOM(: Tipus)? = 7 * 24 * 1_000` de Swift (productes de literals), o NaN. */
function constantSwift(codi, nom) {
  const trobada = new RegExp(`static let ${nom}(?::\\s*\\w+)? = ([^\\n]+)`).exec(codi);
  if (!trobada) return Number.NaN;
  const factors = trobada[1].trim().split('*').map((factor) => factor.trim().replace(/_/g, ''));
  return factors.every((factor) => /^\d+$/.test(factor)) ? factors.reduce((producte, factor) => producte * Number(factor), 1) : Number.NaN;
}

describe.skipIf(!HI_HA_PROJECTE)('el projecte d’iOS (ios/)', () => {
  test('el lector de plist i de .strings llig el que diu', () => {
    expect(llegixPlist('<?xml version="1.0"?><plist version="1.0"><dict><key>a</key><array><string>x &amp; y</string><true/></array><key>b</key><array/><key>c</key><integer>3</integer></dict></plist>'))
      .toEqual({ a: ['x & y', true], b: [], c: 3 });
    expect(() => llegixPlist('<dict><key>a</key><string>x</string>')).toThrow();
    expect(llegixStrings('/* nota */\n"a" = "b \\"c\\"";\n// x\n"d"="e";')).toEqual({ a: 'b "c"', d: 'e' });
  });

  test('els lectors del project.pbxproj i del Swift llegixen el que diuen', () => {
    const A = 'A'.repeat(24);
    const B = 'B'.repeat(24);
    const C = 'C'.repeat(24);
    const pbx = [
      `\t\t${A} /* App */ = {`, '\t\t\tisa = PBXNativeTarget;', `\t\t\tbuildPhases = (\n\t\t\t\t${B} /* Fase */,\n\t\t\t);`,
      '\t\t\tpackageProductDependencies = (\n\t\t\t);', `\t\t\tdependencies = (\n\t\t\t\t${C} /* PBXTargetDependency */,\n\t\t\t);`,
      '\t\t\tshellScript = "echo \\"}\\"";', '\t\t};', `\t\t${B} /* Fase */ = {isa = X; settings = {A = (b, ); }; };`
    ].join('\n');
    expect(idDelTarget(pbx, 'App')).toBe(A);
    expect(idDelTarget(pbx, 'Fase')).toBe('');
    const app = objectePbx(pbx, A);
    expect(app).toContain('shellScript');
    expect(app).not.toContain('isa = X');
    expect(llistaPbx(app, 'buildPhases')).toEqual([{ id: B, nom: 'Fase' }]);
    expect(llistaPbx(app, 'dependencies')).toEqual([{ id: C, nom: 'PBXTargetDependency' }]);
    expect(objectePbx(pbx, B)).toBe('isa = X; settings = {A = (b, ); }; ');
    expect(objectePbx(pbx, C)).toBe('');
    const swift = 'func f() { g("}", { x in h(x) }) } // fora { \nlet u = "https://x"';
    expect(cosDe(senseComentarisSwift(swift), 'func f()')).toBe(' g("}", { x in h(x) }) ');
    expect(crida(swift, 'g')).toBe('"}", { x in h(x) }');
    expect(senseComentarisSwift(swift)).toContain('"https://x"');
    expect(tancat('(()', 0)).toBe('');
  });

  test('els lectors de condicions i de constants de Swift llegixen el que diuen (Gauntlet 261026_1615)', () => {
    expect(separaPerComes('let url, !url.isFileURL, ["http", "https"].contains(f(a, "x,y") ?? "")'))
      .toEqual(['let url', '!url.isFileURL', '["http", "https"].contains(f(a, "x,y") ?? "")']);
    expect(separaPerComes('a < b, let c = d.first(where: { $0 == e, f })?.key')).toEqual(['a < b', 'let c = d.first(where: { $0 == e, f })?.key']);
    expect(constantSwift('private static let a: Int64 = 7 * 24 * 1_000\nlet b = 2', 'a')).toBe(168000);
    expect(constantSwift('private static let m = 10\n', 'm')).toBe(10);
    expect(constantSwift('static let c = d + 1\n', 'c')).toBeNaN();
    expect(constantSwift('', 'e')).toBeNaN();
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

  /* 261026 (ordre del Mestre, prompt 261026_1615, tasca 5) · La capçalera de
     l'App és negra: l'hora, la cobertura i la bateria, en blanc des de
     l'arrencada (el plist) i després (SystemBars DARK vol dir icones clares). */
  test('la barra d’estat: icones blanques des de l’arrencada (Info.plist) i SystemBars fosc (capacitor.config.json)', () => {
    const info = llegixPlist(llig(APP, 'Info.plist'));
    expect(info.UIStatusBarStyle).toBe('UIStatusBarStyleLightContent');
    expect(info.UIViewControllerBasedStatusBarAppearance).toBe(false);
    // Cap ajust del projecte que les torne a escriure per damunt del plist.
    expect(llig(PROJECTE, 'project.pbxproj')).not.toMatch(/INFOPLIST_KEY_UI(?:StatusBarStyle|ViewControllerBasedStatusBarAppearance)/);
    const { plugins } = JSON.parse(llig(ARREL, 'capacitor.config.json'));
    expect(plugins.SystemBars.style).toBe('DARK');
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

  /* 261026 (ordre del Mestre, prompt 261026_1615, tasca 1) · I l'App Group que
     compartix amb l'extensió «Compartir»: és per on li arriben les captures. */
  test('App.entitlements: Sign in with Apple i l’App Group del menú Compartir, i res més', () => {
    expect(llegixPlist(llig(APP, 'App.entitlements'))).toEqual({
      'com.apple.developer.applesignin': ['Default'],
      'com.apple.security.application-groups': ['group.org.socdepoble.app']
    });
  });

  test('extensió Compartir: el target, el seu identificador, el mateix App Group, les versions de l’App i incrustada a l’App', () => {
    const pbx = llig(PROJECTE, 'project.pbxproj');
    expect(pbx).toMatch(/\/\* Compartir \*\/ = \{\s*isa = PBXNativeTarget;[\s\S]*?productType = "com\.apple\.product-type\.app-extension";/);
    expect(pbx.match(/PRODUCT_BUNDLE_IDENTIFIER = org\.socdepoble\.app\.compartir;/g)).toHaveLength(2);
    expect(pbx.match(/CODE_SIGN_ENTITLEMENTS = Compartir\/Compartir\.entitlements;/g)).toHaveLength(2);
    expect(pbx.match(/APPLICATION_EXTENSION_API_ONLY = YES;/g)).toHaveLength(2);
    // Les versions de l'extensió han de ser les de l'App (App Store Connect les compara).
    const valors = (clau) => [...new Set([...pbx.matchAll(new RegExp(`${clau} = ([^;]+);`, 'g'))].map((m) => m[1]))];
    expect(valors('MARKETING_VERSION')).toHaveLength(1);
    expect(valors('CURRENT_PROJECT_VERSION')).toHaveLength(1);
    expect(pbx).toMatch(/Compartir\.appex in Embed Foundation Extensions/);
    expect(pbx).toMatch(/dstSubfolderSpec = 13;/);
    expect(llegixPlist(llig(IOS, 'App', 'Compartir', 'Compartir.entitlements'))).toEqual({
      'com.apple.security.application-groups': ['group.org.socdepoble.app']
    });
    const info = llegixPlist(llig(IOS, 'App', 'Compartir', 'Info.plist'));
    expect(info.CFBundleDisplayName).toBe('Sóc de Poble');
    expect(info.NSExtension.NSExtensionPointIdentifier).toBe('com.apple.share-services');
    expect(info.NSExtension.NSExtensionAttributes.NSExtensionActivationRule).toEqual({
      NSExtensionActivationSupportsImageWithMaxCount: 10,
      NSExtensionActivationSupportsText: true,
      NSExtensionActivationSupportsWebURLWithMaxCount: 1
    });
    // L'App i l'extensió parlen pel mateix grup i pel mateix nom de carpeta.
    const extensio = llig(IOS, 'App', 'Compartir', 'ShareViewController.swift');
    const receptor = llig(APP, 'CompartirNatiuPlugin.swift');
    for (const codi of [extensio, receptor]) {
      expect(codi).toContain('"group.org.socdepoble.app"');
      expect(codi).toContain('"compartits"');
    }
    expect(llig(APP, 'SceneDelegate.swift')).toContain('window?.rootViewController = ControladorSdp()');
    expect(llig(APP, 'ControladorSdp.swift')).toContain('registerPluginInstance(CompartirNatiuPlugin())');
  });

  /* 261026 (prompt 261026_1615, revisió) · Que el projecte porte la fase i la
     dependència no basta: han de ser del target App. Una fase de còpia solta, o
     penjada d'un altre target, compila igual i l'App ix sense l'extensió. */
  test('extensió Compartir: la fase «Embed Foundation Extensions» i la dependència són del target App, i copien el producte de Compartir', () => {
    const pbx = llig(PROJECTE, 'project.pbxproj');
    const idApp = idDelTarget(pbx, 'App');
    const idCompartir = idDelTarget(pbx, 'Compartir');
    expect(idApp).toMatch(new RegExp(`^${ID_PBX}$`));
    expect(idCompartir).toMatch(new RegExp(`^${ID_PBX}$`));
    const app = objectePbx(pbx, idApp);
    expect(app).toMatch(/\bname = App;/);
    expect(app).toMatch(/productType = "com\.apple\.product-type\.application";/);

    const fases = llistaPbx(app, 'buildPhases');
    const incrusta = fases.filter((fase) => fase.nom === 'Embed Foundation Extensions');
    expect(incrusta, 'el target App no té la fase «Embed Foundation Extensions»').toHaveLength(1);
    const copia = objectePbx(pbx, incrusta[0].id);
    expect(copia).toMatch(/\bisa = PBXCopyFilesBuildPhase;/);
    expect(copia).toMatch(/\bdstSubfolderSpec = 13;/);
    const fitxers = llistaPbx(copia, 'files');
    const appex = fitxers.filter((f) => f.nom === 'Compartir.appex in Embed Foundation Extensions');
    expect(appex).toHaveLength(1);
    // El fitxer que es copia és el producte del target Compartir, no un altre .appex.
    const producte = new RegExp(`\\bproductReference = (${ID_PBX})`).exec(objectePbx(pbx, idCompartir))?.[1];
    expect(producte).toBeTruthy();
    expect(objectePbx(pbx, appex[0].id)).toMatch(new RegExp(`\\bisa = PBXBuildFile; fileRef = ${producte}\\b`));

    const dependencies = llistaPbx(app, 'dependencies').map(({ id }) => objectePbx(pbx, id));
    const deCompartir = dependencies.filter((dep) => /\bisa = PBXTargetDependency;/.test(dep) && new RegExp(`\\btarget = ${idCompartir}\\b`).test(dep));
    expect(deCompartir, 'el target App no depén del target Compartir').toHaveLength(1);

    // L'extensió no s'incrusta a si mateixa.
    expect(llistaPbx(objectePbx(pbx, idCompartir), 'buildPhases').map((fase) => fase.nom)).not.toContain('Embed Foundation Extensions');
  });

  /* 261026 (prompt 261026_1615, revisió) · Diverses comparticions abans d'obrir
     l'App arriben juntes: una passada de recull() ajunta tots els lots complets
     i els lliura una sola vegada (el web només en guarda un de pendent). I amb
     l'App ja activa (l'iPad en pantalla dividida) no hi ha cap didBecomeActive:
     l'extensió ho avisa per Darwin, amb el mateix nom que escolta el receptor. */
  test('CompartirNatiuPlugin.swift: un sol notifyListeners, des de lliura i fora del bucle dels lots; escolta l’avís Darwin que envia l’extensió', () => {
    const AVIS_DARWIN = 'org.socdepoble.app.compartit';
    const receptor = senseComentarisSwift(llig(APP, 'CompartirNatiuPlugin.swift'));
    const extensio = senseComentarisSwift(llig(IOS, 'App', 'Compartir', 'ShareViewController.swift'));
    // El nom i l'esdeveniment, els mateixos que escolta l'adaptador de JS.
    expect(receptor).toContain(`public let jsName = "${CONNECTOR_COMPARTIR}"`);
    expect(/static let esdeveniment = "([^"]+)"/.exec(receptor)?.[1]).toBe(ESDEVENIMENT_COMPARTIT);

    expect(receptor.match(/\bnotifyListeners\(/g)).toHaveLength(1);
    const lliura = cosDe(receptor, 'private func lliura(');
    expect(lliura).toContain('notifyListeners(Self.esdeveniment, data: dades, retainUntilConsumed: true)');
    const recull = cosDe(receptor, 'private func recull(');
    /* Gauntlet 261026_1615 (Codex C1615-03) · Dos lliuraments possibles, mai dins
       del bucle: sense App Group les restes locals ixen igual (i s'acaba), i amb
       App Group, tot junt després del bucle. */
    expect(recull.match(/\blliura\([^)]*\)/g)).toEqual(['lliura(junts)', 'lliura(junts)']);
    expect(recull).toMatch(/guard let contenidor = [^\n]*else \{ lliura\(junts\); return \}/);
    const capBucle = /for lot in [^\n]*\{(?=[ \t]*\n)/.exec(recull);
    expect(capBucle, 'falta el bucle dels lots a recull()').toBeTruthy();
    const bucle = tancat(recull, capBucle.index + capBucle[0].length - 1);
    expect(bucle).toContain('afig(contingut, de: lot, a: &junts)');
    expect(bucle).not.toMatch(/\blliura\(|\bnotifyListeners\(/);
    const fiDelBucle = capBucle.index + capBucle[0].length + bucle.length;
    // Un sol acumulador per passada, declarat abans del bucle; el lliurament, després.
    expect(recull.indexOf('var junts = Lliurament()')).toBeGreaterThanOrEqual(0);
    expect(recull.indexOf('var junts = Lliurament()')).toBeLessThan(capBucle.index);
    expect(recull.indexOf('lliura(junts)')).toBeLessThan(capBucle.index);
    expect(recull.lastIndexOf('lliura(junts)')).toBeGreaterThan(fiDelBucle);

    for (const codi of [receptor, extensio]) expect(codi).toContain(`"${AVIS_DARWIN}"`);
    expect(/static let avisDarwin = "([^"]+)"/.exec(receptor)?.[1]).toBe(AVIS_DARWIN);
    const observa = crida(cosDe(receptor, 'override public func load()'), 'CFNotificationCenterAddObserver');
    expect(observa).toContain('CFNotificationCenterGetDarwinNotifyCenter()');
    expect(observa).toContain('Self.avisDarwin as CFString');
    expect(observa).toMatch(/\.revisa\(\)/);
    const avisa = crida(extensio, 'CFNotificationCenterPostNotification');
    expect(avisa).toContain('CFNotificationCenterGetDarwinNotifyCenter()');
    expect(avisa).toContain(`CFNotificationName("${AVIS_DARWIN}" as CFString)`);
    // L'avís va darrere del manifest: l'App només llig lots complets.
    const desa = cosDe(extensio, 'private func desa() async');
    expect(desa.indexOf('"manifest.json"')).toBeGreaterThanOrEqual(0);
    expect(desa.indexOf('CFNotificationCenterPostNotification(')).toBeGreaterThan(desa.indexOf('"manifest.json"'));
  });

  /* 261026 (prompt 261026_1615, revisió) · L'extensió no porta catàlegs propis:
     els seus textos són una taula al codi, en les cinc llengües de l'App. */
  test('ShareViewController.swift: cada text de l’extensió en ca, es, en, eu i gl, i ca de reserva', () => {
    const extensio = senseComentarisSwift(llig(IOS, 'App', 'Compartir', 'ShareViewController.swift'));
    const casos = /private enum Text: String \{ case ([\w, ]+) \}/.exec(extensio)?.[1].split(',').map((cas) => cas.trim()).filter(Boolean) ?? [];
    expect(casos).toContain('desat');
    const declaracio = /private static let textos: \[String: \[Text: String\]\] = \[/.exec(extensio);
    expect(declaracio, 'falta la taula de textos').toBeTruthy();
    const taula = tancat(extensio, declaracio.index + declaracio[0].length - 1);
    const perLlengua = Object.fromEntries([...taula.matchAll(/"(\w+)":\s*\[/g)].map((m) => {
      const bloc = tancat(taula, m.index + m[0].length - 1);
      return [m[1], Object.fromEntries([...bloc.matchAll(/\.(\w+):\s*"((?:[^"\\]|\\.)*)"/g)].map(([, cas, text]) => [cas, text]))];
    }));
    expect(Object.keys(perLlengua).sort()).toEqual([...LLENGUES].sort());
    for (const llengua of LLENGUES) {
      expect(Object.keys(perLlengua[llengua]).sort(), llengua).toEqual([...casos].sort());
      for (const cas of casos) expect(perLlengua[llengua][cas].trim().length, `${llengua} · ${cas}`).toBeGreaterThan(5);
    }
    // Cap llengua no és una còpia d'una altra.
    expect(new Set(LLENGUES.map((llengua) => perLlengua[llengua].desat)).size).toBe(LLENGUES.length);
    expect(cosDe(extensio, 'private static func text(')).toContain('?? "ca"');
  });

  /* Gauntlet 261026_1615 (Codex C1615-03) · load() buidava Caches/compartits a
     cada arrencada: el que s'havia compartit i no s'havia enviat es perdia en
     tancar l'App. Ara les còpies només se'n van quan el web les allibera, i la
     primera passada (a la cua serial) les torna a lliurar. Les passades de
     primer pla no, o cada retorn a l'App repetiria el lot. */
  test('CompartirNatiuPlugin.swift: load() ja no esborra la carpeta local i la primera passada porta les restes (ambRestes: true); les altres, no', () => {
    const receptor = senseComentarisSwift(llig(APP, 'CompartirNatiuPlugin.swift'));
    const carrega = cosDe(receptor, 'override public func load()');
    expect(carrega).not.toBe('');
    expect(carrega).not.toMatch(/\bremoveItem\(/);
    expect(receptor).not.toMatch(/\bremoveItem\(at:\s*(?:Self\.)?carpetaLocal\(\)\s*\)/);
    expect(carrega).toMatch(/\bcua\.async \{ \[weak self\] in self\?\.recull\(intent: 0, ambRestes: true\) \}/);
    expect(receptor.match(/\bambRestes: true\b/g)).toHaveLength(1);
    expect(receptor).toMatch(/private func recull\(intent: Int, ambRestes: Bool = false\)/);
    expect(cosDe(receptor, '@objc private func revisa()')).toMatch(/self\?\.recull\(intent: 0\)/);
    expect(cosDe(receptor, '@objc private func revisa()')).not.toContain('ambRestes');

    const recull = cosDe(receptor, 'private func recull(');
    expect(recull).toMatch(/self\?\.recull\(intent: intent \+ 1\)/);
    const restes = recull.indexOf('if ambRestes { afigRestes(a: &junts, ara: ara) }');
    expect(restes, 'les restes, a la primera passada').toBeGreaterThan(recull.indexOf('var junts = Lliurament()'));
    // Abans de mirar l'App Group: sense grup, les restes locals ixen igual.
    expect(restes).toBeLessThan(recull.indexOf('guard let contenidor'));
    expect(restes).toBeLessThan(recull.search(/\bfor lot in /));
    expect(recull).toMatch(/\blet ara = Int64\(Date\(\)\.timeIntervalSince1970 \* 1000\)/);
  });

  /* Gauntlet 261026_1615 (Codex C1615-03) · Les restes no es guarden per sempre:
     una setmana, com a Android, i com a molt deu (el sostre del xat); la resta, i
     les que no porten hora al nom, s'esborren. */
  test('CompartirNatiuPlugin.swift: afigRestes aplica caducitatRestaMs (una setmana) i maxFitxers (10), i esborra la resta', () => {
    const receptor = senseComentarisSwift(llig(APP, 'CompartirNatiuPlugin.swift'));
    expect(constantSwift(receptor, 'caducitatRestaMs')).toBe(7 * 24 * 60 * 60 * 1000);
    expect(receptor).toMatch(/private static let caducitatRestaMs: Int64 = /);
    expect(constantSwift(receptor, 'maxFitxers')).toBe(10);
    expect(constantSwift(receptor, 'maxFitxers')).toBe(MAX_FITXERS_COMPARTITS);

    const restes = cosDe(receptor, 'private func afigRestes(');
    expect(restes).toMatch(/contentsOfDirectory\(at: Self\.carpetaLocal\(\)/);
    const capBucle = /for (\w+) in [^\n]*\{(?=[ \t]*\n)/.exec(restes);
    expect(capBucle, 'el bucle de les restes').toBeTruthy();
    const resta = capBucle[1];
    const bucle = tancat(restes, capBucle.index + capBucle[0].length - 1);
    const marca = new RegExp(`let (\\w+) = Int64\\(${resta}\\.lastPathComponent\\.split\\(separator: "-"\\)\\.first \\?\\? ""\\) \\?\\? 0`).exec(bucle);
    expect(marca, 'l’hora, del nom de la còpia').toBeTruthy();
    const guarda = /\bguard ([\s\S]*?) else \{\s*try\? fm\.removeItem\(at: (\w+)\)\s*continue\s*\}/.exec(bucle);
    expect(guarda, 'la guarda que esborra la resta').toBeTruthy();
    expect(guarda[2]).toBe(resta);
    const condicions = separaPerComes(guarda[1]);
    expect(condicions).toContain(`ara - ${marca[1]} <= Self.caducitatRestaMs`);
    expect(condicions).toContain('junts.fitxers.count < Self.maxFitxers');
    expect(condicions.some((condicio) => /^let mime = Self\.mimes\.first\(where: \{ \$0\.value == \w+ \}\)\?\.key$/.test(condicio))).toBe(true);
    // Només s'afig darrere de la guarda.
    expect(bucle.indexOf('junts.fitxers.append(')).toBeGreaterThan(guarda.index);
    expect(bucle.match(/\bjunts\.fitxers\.append\(/g)).toHaveLength(1);
  });

  /* Gauntlet 261026_1615 (Codex C1615-03) · L'edat d'una resta es llig del nom
     (cap data de fitxer): cada còpia local naix amb l'hora en mil·lisegons davant,
     la mateixa unitat que `ara`. */
  test('CompartirNatiuPlugin.swift: afig posa davant del nom de cada còpia local l’hora en mil·lisegons, la que llig afigRestes', () => {
    const receptor = senseComentarisSwift(llig(APP, 'CompartirNatiuPlugin.swift'));
    const afig = cosDe(receptor, 'private func afig(');
    const marca = /\blet (\w+) = Int64\(Date\(\)\.timeIntervalSince1970 \* 1000\)/.exec(afig);
    expect(marca, 'l’hora en mil·lisegons').toBeTruthy();
    const nom = /\blet (\w+) = desti\.appendingPathComponent\("\\\((\w+)\)-\\\(UUID\(\)\.uuidString\)\.\\\(extensio\)"\)/.exec(afig);
    expect(nom, 'el nom «hora-UUID.extensió»').toBeTruthy();
    expect(nom[2]).toBe(marca[1]);
    expect(nom.index).toBeGreaterThan(marca.index);
    expect(afig).toMatch(new RegExp(`try fm\\.moveItem\\(at: lot\\.appendingPathComponent\\(nom\\), to: ${nom[1]}\\)`));
    expect(afig).toMatch(new RegExp(`junts\\.fitxers\\.append\\(\\["ruta": ${nom[1]}\\.path,`));
    // El destí és la carpeta que llig afigRestes.
    expect(afig).toMatch(/\blet desti = Self\.carpetaLocal\(\)/);
  });

  /* Gauntlet 261026_1615 (Gemini G1615-01) · Un fitxer de Fitxers (un PDF, un
     vídeo) també és un URL (public.file-url): no ha d'arribar al xat com a text
     amb la ruta del telèfon. Només http i https; la resta compta com a rebutjada. */
  test('ShareViewController.swift: la branca d’URL rebutja isFileURL i tot esquema que no siga http(s), i ho compta a rebutjats', () => {
    const extensio = senseComentarisSwift(llig(IOS, 'App', 'Compartir', 'ShareViewController.swift'));
    const desa = cosDe(extensio, 'private func desa() async');
    const branques = ['UTType.image.identifier', 'UTType.url.identifier', 'UTType.plainText.identifier']
      .map((tipus) => desa.indexOf(`proveidor.hasItemConformingToTypeIdentifier(${tipus})`));
    expect(branques.every((posicio) => posicio >= 0)).toBe(true);
    expect([...branques].sort((a, b) => a - b)).toEqual(branques);

    const branca = cosDe(desa, 'else if proveidor.hasItemConformingToTypeIdentifier(UTType.url.identifier)');
    const carrega = /\blet (\w+) = try\? await proveidor\.loadItem\(forTypeIdentifier: UTType\.url\.identifier\) as\? URL\b/.exec(branca);
    expect(carrega, 'la càrrega de l’URL').toBeTruthy();
    const url = carrega[1];
    const si = /\bif ([^\n{]*?) \{/.exec(branca);
    expect(si, 'la condició de l’URL').toBeTruthy();
    const condicions = separaPerComes(si[1]);
    expect(condicions[0]).toBe(`let ${url}`);
    expect(condicions).toContain(`!${url}.isFileURL`);
    const esquemes = condicions.map((condicio) => new RegExp(`^\\[([^\\]]*)\\]\\.contains\\(${url}\\.scheme\\?\\.lowercased\\(\\) \\?\\? ""\\)$`).exec(condicio)).find(Boolean);
    expect(esquemes, 'la llista d’esquemes').toBeTruthy();
    expect(separaPerComes(esquemes[1]).map((esquema) => JSON.parse(esquema)).sort()).toEqual(['http', 'https']);

    const llavors = tancat(branca, si.index + si[0].length - 1);
    expect(llavors.trim()).toBe(`textos.append(${url}.absoluteString)`);
    const darrere = branca.slice(si.index + si[0].length + llavors.length + 1);
    const sino = /^\s*else\s*\{/.exec(darrere);
    expect(sino, 'falta l’else de l’URL rebutjat').toBeTruthy();
    expect(tancat(darrere, sino[0].length - 1).trim()).toBe('rebutjats += 1');
    expect(branca.match(/\btextos\.append\(/g)).toHaveLength(1);
  });

  /* Gauntlet 261026_1615 (Gemini G1615-05) · Amb UISceneStoryboardFile = Main, UIKit
     muntava un CAPBridgeViewController (i el seu WKWebView) abans que SceneDelegate
     posara la finestra seua. Ara l'escena no porta storyboard i SceneDelegate fa
     la finestra amb ControladorSdp. */
  test('Info.plist: l’escena no porta UISceneStoryboardFile i SceneDelegate munta la finestra amb ControladorSdp', () => {
    const plist = llig(APP, 'Info.plist');
    const escenes = llegixPlist(plist).UIApplicationSceneManifest;
    expect(escenes.UIApplicationSupportsMultipleScenes).toBe(false);
    const configuracions = escenes.UISceneConfigurations.UIWindowSceneSessionRoleApplication;
    expect(configuracions).toHaveLength(1);
    expect(configuracions[0].UISceneDelegateClassName).toBe('$(PRODUCT_MODULE_NAME).SceneDelegate');
    expect(Object.keys(configuracions[0])).not.toContain('UISceneStoryboardFile');
    expect(plist).not.toContain('UISceneStoryboardFile');
    expect(llig(PROJECTE, 'project.pbxproj')).not.toContain('UISceneStoryboardFile');

    const escena = senseComentarisSwift(llig(APP, 'SceneDelegate.swift'));
    const connecta = cosDe(escena, 'func scene(_ scene: UIScene, willConnectTo session: UISceneSession');
    const passos = [
      'window = UIWindow(windowScene: windowScene)',
      'window?.rootViewController = ControladorSdp()',
      'window?.makeKeyAndVisible()',
      'SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)'
    ].map((pas) => connecta.indexOf(pas));
    expect(passos.every((pas) => pas >= 0), connecta).toBe(true);
    expect([...passos].sort((a, b) => a - b)).toEqual(passos);
    expect(escena).not.toMatch(/\bCAPBridgeViewController\(/);
    expect(senseComentarisSwift(llig(APP, 'ControladorSdp.swift'))).toMatch(/\bclass ControladorSdp: CAPBridgeViewController\b/);
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

  test('Assets.xcassets: AppIcon (1024×1024) i Splash (2732×2732) en RGB sense alfa i amb el verd #0F672F de Sóc de Poble', () => {
    const capcaleraPng = (cami) => {
      const buf = fs.readFileSync(cami);
      const ample = buf.readUInt32BE(16);
      const alt = buf.readUInt32BE(20);
      const profunditat = buf.readUInt8(24);
      const tipusColor = buf.readUInt8(25);
      let pos = 8;
      const trossos = [];
      while (pos < buf.length) {
        const mida = buf.readUInt32BE(pos);
        const etiqueta = buf.toString('ascii', pos + 4, pos + 8);
        if (etiqueta === 'IDAT') trossos.push(buf.subarray(pos + 8, pos + 8 + mida));
        pos += 12 + mida;
      }
      const descomprimit = zlib.inflateSync(Buffer.concat(trossos));
      const filtre = descomprimit[0];
      const primerPixel = filtre === 0 ? [descomprimit[1], descomprimit[2], descomprimit[3]] : null;
      return { ample, alt, profunditat, tipusColor, primerPixel };
    };
    const icona = capcaleraPng(path.join(APP, 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'));
    expect(icona).toEqual({ ample: 1024, alt: 1024, profunditat: 8, tipusColor: 2, primerPixel: [15, 103, 47] });
    for (const nom of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
      const splash = capcaleraPng(path.join(APP, 'Assets.xcassets', 'Splash.imageset', nom));
      expect(splash, nom).toEqual({ ample: 2732, alt: 2732, profunditat: 8, tipusColor: 2, primerPixel: [15, 103, 47] });
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
