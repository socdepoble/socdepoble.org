// @vitest-environment node
/* R-02 global (pla 261029_1305, Bloc B, M1.2; 261029) · Guarda de contracte
   dels actius de public/assets: els bytes diuen el que diu l'extensió. Un
   .png amb bytes JPEG (FF D8 FF) declara un MIME que un rastrejador estricte
   rebutja i que el servidor servix com a image/png (R-02: el 261029 n'hi havia
   83, tots recodificats a PNG real conservant camí i píxels). Esta prova
   impedix que en torne a entrar cap: llig només la capçalera de cada fitxer
   (12 bytes), recursivament, i falla amb la llista exacta dels que no quadren.
   Viu a src/config/ perquè és una guarda de conformitat sense React, com
   imatgeSocial.pes300.test.js, i es diu *.seguretat.test.js perquè entre al
   pre-commit (vitest.precommit.config.js, PRECOMMIT_INCLUDE). */
import { closeSync, openSync, readdirSync, readSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = path.join(process.cwd(), 'public', 'assets');

/* La màgia binària de cada extensió d'imatge que servix public/assets. */
const MAGIES = Object.freeze({
  '.png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  '.jpg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.webp': (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  '.gif': (b) => b.toString('ascii', 0, 4) === 'GIF8'
});

/* El nom del format que els bytes diuen de veres, per a un missatge d'error útil. */
function formatDelsBytes(b) {
  for (const [ext, es] of Object.entries(MAGIES)) if (es(b)) return ext;
  return 'desconegut';
}

function* fitxersDe(carpeta) {
  for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
    const cami = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) yield* fitxersDe(cami);
    else if (entrada.isFile()) yield cami;
  }
}

function capcalera(cami) {
  const fd = openSync(cami, 'r');
  try {
    const b = Buffer.alloc(12);
    const llegits = readSync(fd, b, 0, 12, 0);
    return b.subarray(0, llegits);
  } finally {
    closeSync(fd);
  }
}

describe('public/assets: cada imatge porta els bytes del format que declara la seua extensió (R-02)', () => {
  test('cap .png, .jpg, .jpeg, .webp ni .gif amb la màgia d’un altre format', () => {
    const revisats = [];
    const discordants = [];
    for (const cami of fitxersDe(ARREL)) {
      const ext = path.extname(cami).toLowerCase();
      const es = MAGIES[ext];
      if (!es) continue;
      revisats.push(cami);
      const b = capcalera(cami);
      if (!es(b)) discordants.push(`${path.relative(process.cwd(), cami)} · bytes de ${formatDelsBytes(b)}`);
    }
    /* Un arbre buit o una ruta equivocada seria un verd fals. */
    expect(revisats.length).toBeGreaterThan(300);
    expect(discordants).toEqual([]);
  });
});
