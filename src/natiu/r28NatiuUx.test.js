// @vitest-environment node
/**
 * Onada R28 · Empatia nativa Apple (ios/) i Google (android/):
 *   1. Android 13–16 Material You: ic_launcher.xml i ic_launcher_round.xml declaren
 *      <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>.
 *   2. drawable/ic_launcher_monochrome.xml i drawable-v24/ic_launcher_foreground.xml
 *      porten exactament el camí vectorial canònic de public/favicon.svg / ic_stat_sdp.xml
 *      (zero robot genèric d'Android Studio) i queden dins de la zona segura de 66dp
 *      (radi <= 33dp des del centre 54,54 del llenç de 108dp × 108dp).
 *   3. App.jsx munta useTeclatVirtual(rootRef) i tokens.css / layout.css / modules.css
 *      declaren l'adaptació del teclat virtual sense tocar cap regla de @layer legacy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MAIN = path.join(ARREL, 'android', 'app', 'src', 'main');
const HI_HA_ANDROID = fs.existsSync(path.join(MAIN, 'AndroidManifest.xml'));
const llig = (...parts) => fs.readFileSync(path.join(...parts), 'utf8');

function extrauPathData(xml) {
  return /android:pathData="([^"]+)"/.exec(xml)?.[1] ?? '';
}

function extrauAtributNumeric(xml, nom) {
  const val = new RegExp(`android:${nom}="([^"]+)"`).exec(xml)?.[1];
  return val == null ? Number.NaN : Number(val);
}

describe.skipIf(!HI_HA_ANDROID)('Onada R28 · Icones adaptatives i monocromes Material You d’Android', () => {
  test('ic_launcher.xml i ic_launcher_round.xml declaren la capa <monochrome> oficial', () => {
    for (const fitxer of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
      const xml = llig(MAIN, 'res', 'mipmap-anydpi-v26', fitxer);
      expect(xml, fitxer).toContain('<background android:drawable="@color/ic_launcher_background"/>');
      expect(xml, fitxer).toContain('<foreground android:drawable="@mipmap/ic_launcher_foreground"/>');
      expect(xml, fitxer).toContain('<monochrome android:drawable="@drawable/ic_launcher_monochrome"/>');
    }
  });

  test('ic_launcher_monochrome.xml i drawable-v24/ic_launcher_foreground.xml usen el vector de Sóc de Poble dins de la zona segura de 66dp', () => {
    const camiNotificacio = extrauPathData(llig(MAIN, 'res', 'drawable', 'ic_stat_sdp.xml'));
    const camiFavicon = /\bd="([^"]+)"/.exec(llig(ARREL, 'public', 'favicon.svg'))?.[1] ?? '';
    expect(camiNotificacio.length).toBeGreaterThan(500);
    expect(camiNotificacio).toBe(camiFavicon);

    for (const rel of [
      ['res', 'drawable', 'ic_launcher_monochrome.xml'],
      ['res', 'drawable-v24', 'ic_launcher_foreground.xml'],
    ]) {
      const xml = llig(MAIN, ...rel);
      const etiqueta = rel.join('/');
      expect(extrauPathData(xml), etiqueta).toBe(camiFavicon);
      expect(xml, `${etiqueta}: sense robot de plantilla`).not.toContain('M66.94,46.02');
      expect(extrauAtributNumeric(xml, 'viewportWidth'), etiqueta).toBe(108);
      expect(extrauAtributNumeric(xml, 'viewportHeight'), etiqueta).toBe(108);

      const scaleX = extrauAtributNumeric(xml, 'scaleX');
      const scaleY = extrauAtributNumeric(xml, 'scaleY');
      const tx = extrauAtributNumeric(xml, 'translateX');
      const ty = extrauAtributNumeric(xml, 'translateY');
      expect(scaleX).toBeCloseTo(scaleY, 5);

      /* Caixa del camí canònic (x: 1,421..83,2; y: 1,191..122,361) projectada a 108dp:
         ha de quedar íntegrament dins de [21dp, 87dp] (cercle segur de 66dp). */
      const minX = tx + 1.421 * scaleX;
      const maxX = tx + 83.2 * scaleX;
      const minY = ty + 1.191 * scaleY;
      const maxY = ty + 122.361 * scaleY;
      expect(minX, etiqueta).toBeGreaterThanOrEqual(21);
      expect(maxX, etiqueta).toBeLessThanOrEqual(87);
      expect(minY, etiqueta).toBeGreaterThanOrEqual(21);
      expect(maxY, etiqueta).toBeLessThanOrEqual(87);
    }
  });
});

describe('Onada R28 · Contracte d’integració de useTeclatVirtual a la closca', () => {
  test('App.jsx connecta useTeclatVirtual(rootRef, esAmaDelDocument(externalConfig)) i tokens/layout/modules defineixen data-sdp-teclat', () => {
    const app = llig(ARREL, 'src', 'app', 'App.jsx');
    const tokens = llig(ARREL, 'src', 'css', 'tokens.css');
    const layout = llig(ARREL, 'src', 'css', 'layout.css');
    const modules = llig(ARREL, 'src', 'css', 'modules.css');

    expect(app).toContain("import { useTeclatVirtual } from '../hooks/useTeclatVirtual.js';");
    expect(app).toContain('useTeclatVirtual(rootRef, esAmaDelDocument(externalConfig));');
    expect(tokens).toMatch(/\.sdp-root\[data-sdp-teclat="obert"\]\s*\{[^}]*alt-nav-mobil/);
    expect(layout).toContain('.sdp-root[data-sdp-teclat="obert"]');
    expect(modules).toContain('data-sdp-teclat-vv');
  });
});
