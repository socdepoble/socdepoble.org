/* Onada 8 (261009, requeriments, punt 1) · Els logotips de Sóc de Poble són
   PNG de 256 px d'alt a public/assets/system/ui/: el quadrat verd de 256x256
   (l'avatar) i els rectangulars de 985x256 (es pinten fins a 600 px CSS i han
   de quedar nítids). Esta prova llig la capçalera de cada fitxer (el bloc
   IHDR) i en fixa les dimensions, i que cada PNG pesa menys que l'SVG que
   substituïx. Els SVG es queden al disc: els porten supabase/seed.sql i les
   files del servidor (MARQUES_SVG_ANTIGUES). */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { DEFAULT_AUTHOR, MARQUES_SVG_ANTIGUES } from '../components/universal/UniversalUtils.js';

const PUBLIC = path.join(process.cwd(), 'public');
const disc = (cami) => path.join(PUBLIC, cami);

const LOGOTIPS = [
  { nom: 'quadrat verd', png: DEFAULT_AUTHOR.avatarUrl, svg: MARQUES_SVG_ANTIGUES.avatar, amplada: 256, alcada: 256 },
  { nom: 'rectangular negre (fons clar)', png: DEFAULT_AUTHOR.logo.clar, svg: MARQUES_SVG_ANTIGUES.clar, amplada: 985, alcada: 256 },
  { nom: 'rectangular blanc (fons fosc)', png: DEFAULT_AUTHOR.logo.fosc, svg: MARQUES_SVG_ANTIGUES.fosc, amplada: 985, alcada: 256 }
];

const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/* Les dimensions d'un PNG: la firma de 8 bytes i, tot seguit, el bloc IHDR
   (llargada a 8-11, tipus a 12-15, amplada a 16-19 i alçada a 20-23). */
function dimensionsPng(bytes) {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(FIRMA_PNG) || bytes.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { amplada: bytes.readUInt32BE(16), alcada: bytes.readUInt32BE(20) };
}

describe('logotips de Sóc de Poble en PNG', () => {
  test('DEFAULT_AUTHOR apunta als tres PNG de public/assets/system/ui', () => {
    expect(LOGOTIPS.map((l) => l.png)).toEqual([
      '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
      '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png',
      '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png'
    ]);
  });

  for (const logotip of LOGOTIPS) {
    describe(logotip.nom, () => {
      test(`és un PNG de ${logotip.amplada}x${logotip.alcada} (IHDR)`, () => {
        expect(existsSync(disc(logotip.png)), logotip.png).toBe(true);
        expect(dimensionsPng(readFileSync(disc(logotip.png)))).toEqual({ amplada: logotip.amplada, alcada: logotip.alcada });
      });

      test('pesa menys que el seu SVG, que continua al disc', () => {
        expect(existsSync(disc(logotip.svg)), logotip.svg).toBe(true);
        expect(statSync(disc(logotip.png)).size).toBeLessThan(statSync(disc(logotip.svg)).size);
      });
    });
  }

  test('dimensionsPng rebutja el que no és un PNG', () => {
    expect(dimensionsPng(readFileSync(disc(MARQUES_SVG_ANTIGUES.avatar)))).toBe(null);
    expect(dimensionsPng(Buffer.alloc(8))).toBe(null);
  });
});
