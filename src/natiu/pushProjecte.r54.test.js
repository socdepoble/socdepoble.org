// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { memoriaConsentimentPush } from './consentimentPush.js';
const read = file => fs.readFileSync(file, 'utf8');
test('paquet oficial exacte, lock amb integritat i ambdós projectes natius sincronitzats', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  expect(pkg.dependencies['@capacitor/push-notifications']).toBe('8.1.3');
  expect(lock.packages['node_modules/@capacitor/push-notifications'].integrity).toBe('sha512-UlOCTS3uiw8ZUJ1rkFKJgoqPADipHDNn0lq5mNRwtXALVxQXIeIoRd3iqpzC+962R2LpCRJRkCTjPX2OHK3tBA==');
  expect(read('android/capacitor.settings.gradle')).toContain("include ':capacitor-push-notifications'");
  expect(read('android/app/capacitor.build.gradle')).toContain("implementation project(':capacitor-push-notifications')");
  expect(read('ios/App/CapApp-SPM/Package.swift')).toContain('CapacitorPushNotifications');
  expect(JSON.parse(read('capacitor.config.json')).plugins.PushNotifications.presentationOptions).toEqual([]);
});
test('el graf natiu resol paquets locals des del projecte, sense rutes de la màquina generadora', () => {
  for (const [file, pattern] of [
    ['android/capacitor.settings.gradle', /new File\('([^']+)'\)/g],
    ['ios/App/CapApp-SPM/Package.swift', /path: "([^"]+)"/g]
  ]) {
    const contents = read(file);
    expect(contents).not.toMatch(/\/Users\/|\/tmp\//);
    const dependencies = [...contents.matchAll(pattern)];
    expect(dependencies.length).toBeGreaterThanOrEqual(3);
    for (const [, relative] of dependencies) {
      expect(relative).toMatch(/^\.\.\//);
      expect(fs.existsSync(path.resolve(path.dirname(file), relative))).toBe(true);
    }
  }
});
test('consentiment de primer inici: auto-init i Analytics apagats; callbacks i capacitat APNs presents', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  for (const key of ['firebase_messaging_auto_init_enabled', 'firebase_analytics_collection_enabled']) expect(manifest).toMatch(new RegExp(`${key}" android:value="false"`));
  const delegate = read('ios/App/App/AppDelegate.swift');
  expect(delegate).toContain('name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken');
  expect(delegate).toContain('name: .capacitorDidFailToRegisterForRemoteNotifications, object: error');
  expect(read('ios/App/App/App.entitlements')).toContain('<key>aps-environment</key>');
});
test('només conserva el marcador del compte i l’oblida; un storage bloquejat no fingix persistència', () => {
  const values = new Map();
  const memory = memoriaConsentimentPush(() => ({ getItem: k => values.get(k), setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) }));
  memory.desa('00000000-0000-4000-a000-000000000001');
  expect([...values.values()]).toEqual(['00000000-0000-4000-a000-000000000001']);
  memory.oblida();
  expect(memory.llegeix()).toBe(null);
  const unavailable = memoriaConsentimentPush(() => { throw Error('blocked'); });
  expect(unavailable.llegeix()).toBe(null);
  expect(() => unavailable.desa('a')).toThrow();
});
