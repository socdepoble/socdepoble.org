/* A02 / D1 (v1.2.26, Lot C1-0c) · Guarda de coherència entre els manifests de privacitat dels SDK
   enllaçats i el que declara l'App. Arrels, carpetes de builds i App.app sintètiques; plutil només en
   la prova de macOS. La revisió d'ASC viu fora de Git (Gauntlet 261126, lent B). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parellsDelManifest, privacitatSdkIos, liniesPrivacitatSdk, manifestsDeLApp, cobertura, llegixRegistre, llegixManifest,
  llegixRevisioAsc, parellsRevisats, nomDeLSdk, comprovaPrivacitatIpa, NOM_REVISIO_ASC
} from '../scripts/botigues/privacitat-sdk.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tipus = (t, ...finalitats) => ({ NSPrivacyCollectedDataType: `NSPrivacyCollectedDataType${t}`, NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: finalitats.map((f) => `NSPrivacyCollectedDataTypePurpose${f}`) });
const GOOGLE = { NSPrivacyTracking: false, NSPrivacyCollectedDataTypes: [tipus('Name', 'AppFunctionality'), tipus('PhoneNumber', 'AppFunctionality'), tipus('UserID', 'AppFunctionality', 'Analytics'), tipus('DeviceID', 'Analytics')] };
const APP = { NSPrivacyTracking: false, NSPrivacyCollectedDataTypes: [tipus('Name', 'AppFunctionality'), tipus('UserID', 'AppFunctionality')] };
const PARELLS = ['DeviceID|Analytics', 'Name|AppFunctionality', 'PhoneNumber|AppFunctionality', 'UserID|Analytics', 'UserID|AppFunctionality'];
const REGISTRE = JSON.stringify({ schema: 'sdp.botigues.privacitat-sdk.v1', sdks: { GoogleSignIn: { parells: PARELLS } } });
const revisio = (revisadaEl, parells = PARELLS) => ({ schema: 'sdp.botigues.revisio-etiqueta-asc.v1', sdks: { GoogleSignIn: { revisadaEl, versio: '1.2.24', per: 'Mestre', parells } } });

function arrel(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-privacitat-sdk-'));
  const escriu = (rel, text) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };
  try { return fn(dir, escriu); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const enllaca = (escriu, comentat = false) => {
  escriu('ios/App/CapApp-SPM/Package.swift', '.package(name: "CapgoCapacitorSocialLogin", path: "../../../node_modules/@capgo/capacitor-social-login")\n');
  escriu('node_modules/@capgo/capacitor-social-login/Package.swift', `${comentat ? '// ' : ''}.product(name: "GoogleSignIn", package: "GoogleSignIn-iOS")\n`);
};
const llegixJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

test('parellsDelManifest dona Tipus|Finalitat curts, ordenats i sense repetits', () => {
  assert.deepEqual(parellsDelManifest(GOOGLE), PARELLS);
  assert.deepEqual(parellsDelManifest({}), []);
});

test('nomDeLSdk: SPM, CocoaPods, frameworks, extensions i el manifest de l’App', () => {
  assert.equal(nomDeLSdk('PrivacyInfo.xcprivacy'), null);
  assert.equal(nomDeLSdk('GoogleSignIn_GoogleSignIn.bundle/PrivacyInfo.xcprivacy'), 'GoogleSignIn');
  assert.equal(nomDeLSdk('GoogleUtilities_GoogleUtilities-Logger.bundle/PrivacyInfo.xcprivacy'), 'GoogleUtilities-Logger');
  assert.equal(nomDeLSdk('Frameworks/Capacitor.framework/PrivacyInfo.xcprivacy'), 'Capacitor');
  assert.equal(nomDeLSdk('GoogleSignIn_Privacy.bundle/PrivacyInfo.xcprivacy'), 'GoogleSignIn');
  assert.equal(nomDeLSdk('FirebaseCorePrivacy.bundle/PrivacyInfo.xcprivacy'), 'FirebaseCore');
  assert.equal(nomDeLSdk('PlugIns/Compartir.appex/PrivacyInfo.xcprivacy'), 'Compartir');
});

test('la revisió d’ASC només compta amb data AAAA-MM-DD i parelles vàlides', () => {
  assert.equal(parellsRevisats(revisio('2026-11-26'), 'GoogleSignIn').size, 5);
  assert.equal(parellsRevisats(revisio('pendent'), 'GoogleSignIn').size, 0);
  assert.equal(parellsRevisats(revisio(null), 'GoogleSignIn').size, 0);
  assert.equal(parellsRevisats(revisio('2026-11-26', 'DeviceID|Analytics'), 'GoogleSignIn').size, 0);
  assert.equal(parellsRevisats(revisio('2026-11-26', ['DeviceID Analytics']), 'GoogleSignIn').size, 0);
});

test('preflight: sense l’SDK enllaçat (o comentat) no diu res', () => arrel((dir, escriu) => {
  assert.deepEqual(privacitatSdkIos(dir).enllacats, []);
  enllaca(escriu, true);
  assert.deepEqual(privacitatSdkIos(dir).enllacats, []);
  assert.deepEqual(liniesPrivacitatSdk(privacitatSdkIos(dir), { plataformes: ['ios'], produccio: true }).linies, []);
}));

test('preflight: enllaçat sense registre és ✗ fins i tot en intern; un registre amb parelles en text també', () => arrel((dir, escriu) => {
  enllaca(escriu);
  const r = liniesPrivacitatSdk(privacitatSdkIos(dir), { plataformes: ['ios'] });
  assert.equal(r.mal.length, 1); assert.match(r.linies[0], /no hi és/);
  escriu('scripts/botigues/revisio-privacitat-sdk.json', JSON.stringify({ schema: 'sdp.botigues.privacitat-sdk.v1', sdks: { GoogleSignIn: { parells: 'Name|AppFunctionality' } } }));
  assert.match(llegixRegistre(dir).problema, /Tipus\|Finalitat/);
}));

test('preflight: sense revisió d’ASC, avís en intern i ✗ a producció; revisada, ✓; Android no en diu res', () => arrel((dir, escriu) => {
  enllaca(escriu);
  escriu('scripts/botigues/revisio-privacitat-sdk.json', REGISTRE);
  const builds = path.join(dir, 'builds'); fs.mkdirSync(builds);
  let r = llegixRevisioAsc(builds);
  assert.equal(r.revisio, null); assert.equal(r.problema, null);
  const estat = privacitatSdkIos(dir, { revisio: r.revisio });
  const intern = liniesPrivacitatSdk(estat, { plataformes: ['ios'] });
  assert.equal(intern.mal.length, 0); assert.match(intern.linies[0], /^ {2}! GoogleSignIn: .*5 de 5 parelles.*fora de Git/);
  const prod = liniesPrivacitatSdk(estat, { plataformes: ['ios'], produccio: true });
  assert.equal(prod.mal.length, 1); assert.match(prod.linies[0], /^ {2}✗ GoogleSignIn/);
  assert.deepEqual(liniesPrivacitatSdk(estat, { plataformes: ['android'], produccio: true }).linies, []);
  fs.writeFileSync(path.join(builds, NOM_REVISIO_ASC), JSON.stringify(revisio('2026-11-26')));
  r = llegixRevisioAsc(builds);
  const revisat = liniesPrivacitatSdk(privacitatSdkIos(dir, { revisio: r.revisio }), { plataformes: ['ios'], produccio: true });
  assert.equal(revisat.mal.length, 0); assert.match(revisat.linies[0], /^ {2}✓ GoogleSignIn: les 5 parelles/);
  fs.writeFileSync(path.join(builds, NOM_REVISIO_ASC), '{ trencat');
  assert.match(llegixRevisioAsc(builds).problema, /no és una revisió/);
  assert.match(llegixRevisioAsc(null).problema, /SDP_BUILDS_DIR/);
}));

test('IPA: cobertura troba les parelles que ni l’App ni la revisió d’ASC cobrixen', () => arrel((dir, escriu) => {
  escriu('App.app/PrivacyInfo.xcprivacy', JSON.stringify(APP));
  escriu('App.app/GoogleSignIn_GoogleSignIn.bundle/PrivacyInfo.xcprivacy', JSON.stringify(GOOGLE));
  escriu('App.app/Frameworks/Capacitor.framework/PrivacyInfo.xcprivacy', JSON.stringify({ NSPrivacyTracking: false }));
  const manifests = manifestsDeLApp(path.join(dir, 'App.app'), { llegix: llegixJson });
  assert.deepEqual(manifests.map((m) => m.sdk), ['Capacitor', 'GoogleSignIn', null]);
  const registre = JSON.parse(REGISTRE);
  const sense = cobertura(manifests, { registre });
  assert.deepEqual(sense.noCobertes.map((n) => n.parell), ['DeviceID|Analytics', 'PhoneNumber|AppFunctionality', 'UserID|Analytics']);
  assert.ok(sense.noCobertes.every((n) => n.registrat));
  assert.deepEqual(cobertura(manifests, { registre, revisio: revisio('2026-11-26') }).noCobertes, []);
  const parcial = cobertura(manifests, { revisio: revisio('2026-11-26', ['DeviceID|Analytics']) });
  assert.deepEqual(parcial.noCobertes.map((n) => [n.parell, n.registrat]), [['PhoneNumber|AppFunctionality', false], ['UserID|Analytics', false]]);
}));

test('puja-ios (comprovaPrivacitatIpa): avís en intern, atura a producció, passa revisada i el catch no culpa sempre plutil', () => arrel((dir, escriu) => {
  escriu('scripts/botigues/revisio-privacitat-sdk.json', REGISTRE);
  escriu('App.app/PrivacyInfo.xcprivacy', JSON.stringify(APP));
  escriu('App.app/GoogleSignIn_GoogleSignIn.bundle/PrivacyInfo.xcprivacy', JSON.stringify(GOOGLE));
  const builds = path.join(dir, 'builds'); fs.mkdirSync(builds);
  const base = { app: path.join(dir, 'App.app'), arrel: dir, carpetaBuilds: builds, llegix: llegixJson };
  const intern = comprovaPrivacitatIpa(base);
  assert.equal(intern.atura, null); assert.match(intern.linies[0], /^ {2}! privacitat dels SDK sense revisió d'ASC: GoogleSignIn DeviceID\|Analytics/);
  const prod = comprovaPrivacitatIpa({ ...base, produccio: true });
  assert.match(prod.atura, /no consta revisada per a GoogleSignIn DeviceID\|Analytics.*fora de Git/);
  fs.writeFileSync(path.join(builds, NOM_REVISIO_ASC), JSON.stringify(revisio('2026-11-26')));
  assert.deepEqual(comprovaPrivacitatIpa({ ...base, produccio: true }), { linies: ['✓ privacitat: les parelles dels 1 SDK amb dades estan cobertes (A02)'], atura: null });
  const trenca = () => { throw new Error('readdir: permís denegat'); };
  const internMal = comprovaPrivacitatIpa({ ...base, llegix: trenca });
  assert.equal(internMal.atura, null); assert.match(internMal.linies[0], /permís denegat/);
  assert.match(comprovaPrivacitatIpa({ ...base, llegix: trenca, produccio: true }).atura, /permís denegat/);
}));

test('el registre real té les 10 parelles de GoogleSignIn observades a l’arxiu 1.2.24-29 i cap revisió d’ASC dins de Git', () => {
  const { registre: r, problema } = llegixRegistre(ARREL);
  assert.equal(problema, null);
  assert.equal(r.sdks.GoogleSignIn.parells.length, 10);
  assert.equal('etiquetaASC' in r.sdks.GoogleSignIn, false);
  for (const p of ['PhoneNumber|AppFunctionality', 'OtherDataTypes|Analytics', 'DeviceID|Analytics', 'OtherUsageData|Analytics', 'UserID|Analytics']) assert.ok(r.sdks.GoogleSignIn.parells.includes(p), p);
});

test('plutil llig un .xcprivacy XML real', { skip: process.platform !== 'darwin' }, () => arrel((dir, escriu) => {
  escriu('PrivacyInfo.xcprivacy', '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>NSPrivacyCollectedDataTypes</key><array><dict><key>NSPrivacyCollectedDataType</key><string>NSPrivacyCollectedDataTypeDeviceID</string><key>NSPrivacyCollectedDataTypePurposes</key><array><string>NSPrivacyCollectedDataTypePurposeAnalytics</string></array></dict></array></dict></plist>\n');
  assert.deepEqual(parellsDelManifest(llegixManifest(path.join(dir, 'PrivacyInfo.xcprivacy'))), ['DeviceID|Analytics']);
}));
