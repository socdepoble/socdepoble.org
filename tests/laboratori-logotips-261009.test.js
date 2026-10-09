// @vitest-environment node
/* Laboratori 261009_1330_logotips_png_claude (Onada 8, punt 1: logotips de
   SVG a PNG). L'agent no pot escriure binaris: els tres PNG viatgen com a
   base64 en trossos de text, i MarIA els escriu a public/ amb escriu-png.mjs.
   Esta prova fa servir les mateixes funcions de l'escriptor, sense escriure
   res: cada tros ha de tindre el hash que va calcular el navegador, i el PNG
   reconstruït, la mida, el sha256 i les dimensions (IHDR) del manifest.
   Quan un PNG ja és a public/ amb el sha del manifest, el paquet està
   aplicat i la prova ho comprova sobre el disc. Si el laboratori s'arxiva,
   la prova se salta sola. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const LAB = path.join(ARREL, '_wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1330_logotips_png_claude');
const HI_HA_LAB = existsSync(path.join(LAB, 'escriu-png.mjs'));
const lab = HI_HA_LAB ? await import(pathToFileURL(path.join(LAB, 'escriu-png.mjs')).href) : null;
const FITXERS = lab ? lab.MANIFEST.fitxers : [];
const aplicat = (f) => existsSync(path.join(ARREL, f.desti)) && lab.sha(readFileSync(path.join(ARREL, f.desti))) === f.sha256;

describe.skipIf(!HI_HA_LAB)('laboratori 261009_1330_logotips_png_claude', () => {
  test('el manifest descriu tres PNG de 256 px d’alçada cap a public/assets/system/ui, cada un més lleuger que el seu SVG', () => {
    expect(lab.MANIFEST.schema).toBe('sdp.logotips-png.v1');
    expect(FITXERS.map((f) => f.clau)).toEqual(['quadrat', 'blanc', 'negre']);
    for (const f of FITXERS) {
      expect(f.alcada, f.clau).toBe(256);
      expect(f.desti.startsWith('public/assets/system/ui/'), f.clau).toBe(true);
      expect(existsSync(path.join(ARREL, f.font)), f.font).toBe(true);
      expect(f.mida, f.clau).toBeLessThan(readFileSync(path.join(ARREL, f.font)).length);
      expect(f.trossos.length, f.clau).toBe(Math.ceil(f.llargadaB64 / lab.MANIFEST.midaDelTros));
    }
  });

  test('dimensionsPng llig el bloc IHDR i rebutja el que no és un PNG', () => {
    const capçalera = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(capçalera, 0);
    capçalera.write('IHDR', 12, 'latin1');
    capçalera.writeUInt32BE(985, 16);
    capçalera.writeUInt32BE(256, 20);
    expect(lab.dimensionsPng(capçalera)).toEqual({ amplada: 985, alcada: 256 });
    expect(lab.dimensionsPng(Buffer.from('<svg/>'))).toBe(null);
  });

  for (const f of FITXERS) {
    describe(f.clau, () => {
      test.skipIf(aplicat(f))('cada tros té el hash que va calcular el navegador', () => {
        expect(f.trossos.flatMap((_, i) => lab.errorsDelTros(f, i))).toEqual([]);
      });

      test.skipIf(aplicat(f))('el PNG reconstruït té la mida, el sha256 i les dimensions del manifest', () => {
        const { bytes, errors } = lab.assembla(f);
        expect(errors).toEqual([]);
        expect(lab.dimensionsPng(bytes)).toEqual({ amplada: f.amplada, alcada: f.alcada });
      });

      test.skipIf(!aplicat(f))('aplicat: el PNG de public/ és el del manifest', () => {
        expect(lab.dimensionsPng(readFileSync(path.join(ARREL, f.desti)))).toEqual({ amplada: f.amplada, alcada: f.alcada });
      });
    });
  }

  test('estat() només llig: cap PNG pendent es dona per aplicat ni cap destí aliè es sobreescriu', () => {
    for (const e of lab.estat()) expect(['pendent', 'aplicat'], `${e.f.desti}: ${e.errors.join('; ')}`).toContain(e.estat);
  });
});
