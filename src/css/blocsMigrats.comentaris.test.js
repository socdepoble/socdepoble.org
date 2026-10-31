// @vitest-environment node
/* Ordre del Mestre (261030, f4 · D.4; residu del Gauntlet 261030, cicle 4) ·
   tractor-vocabulari va moure set fulls CSS de secció a blocs de
   src/css/modules.css i els va esborrar. Cap font viva de src/ no pot enviar
   ningú a un full que ja no existix: el comentari diu on viu ara el bloc
   («src/css/modules.css, bloc X»). La llista de fulls ix de les mateixes
   marques de modules.css («═══ BLOC X · abans <camí> ═══»): un bloc migrat nou
   hi entra sol.
   Queden fora de la guarda, i per què:
     · les proves (*.test.*): fixen que el full antic no torna i en conten la
       història;
     · src/sections/disseny/cataleg/versio.js: les notes de versió conten la
       història;
     · les marques «abans <camí>» de modules.css, que són el registre de la
       migració.
   Només es mira el text de les fonts: cap canvi de comportament ni de píxel. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const MODULS = 'src/css/modules.css';
const HISTORIA = new Set(['src/sections/disseny/cataleg/versio.js']);
const MARCA = /\/\* ═══ BLOC (\w+) · abans (\S+\.css) ═══/g;
const esMarca = (linia) => /\/\* ═══ BLOC \w+ · abans \S+\.css ═══/.test(linia);
const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Els blocs migrats: { bloc, cami, nom } de cada marca «abans». */
const blocsMigrats = (css) => [...css.matchAll(MARCA)].map(([, bloc, cami]) => ({ bloc, cami, nom: path.posix.basename(cami) }));

/* Les fonts vives de src/: JS, JSX, MJS i CSS, sense proves. */
function fontsDe(carpeta, fonts = []) {
  for (const entrada of readdirSync(path.join(ARREL, carpeta), { withFileTypes: true })) {
    const ruta = `${carpeta}/${entrada.name}`;
    if (entrada.isDirectory()) fontsDe(ruta, fonts);
    else if (/\.(?:m?jsx?|css)$/.test(entrada.name) && !/\.test\.m?jsx?$/.test(entrada.name)) fonts.push(ruta);
  }
  return fonts.sort();
}

/* «ruta:línia nom» per a cada línia que nomena un full migrat (amb camí o sense). */
function referenciesAFullsMigrats(fonts, blocs) {
  const patrons = blocs.map(({ nom }) => [nom, new RegExp(`(?<![A-Za-z0-9_])${escapa(nom)}(?![A-Za-z0-9_])`)]);
  const trobades = [];
  for (const [ruta, text] of fonts) {
    if (HISTORIA.has(ruta)) continue;
    text.split('\n').forEach((linia, i) => {
      if (esMarca(linia)) return;
      for (const [nom, patro] of patrons) if (patro.test(linia)) trobades.push(`${ruta}:${i + 1} ${nom}`);
    });
  }
  return trobades;
}

const BLOCS = blocsMigrats(llig(MODULS));

describe('fulls CSS migrats a src/css/modules.css', () => {
  test('les marques nomenen els set fulls del cicle 4, i cap no torna a existir', () => {
    expect(BLOCS.map(({ nom }) => nom)).toEqual(expect.arrayContaining([
      'pecesApps.css', 'catalegColleccio.css', 'alergens.css', 'tpv.css',
      'UniversalListCard.css', 'AdjuntXat.css', 'ConsultaIAIA.css'
    ]));
    for (const { cami } of BLOCS) expect(existsSync(path.join(ARREL, cami)), cami).toBe(false);
  });

  test('cap font viva de src/ nomena un full migrat: diu on viu ara el bloc', () => {
    const fonts = fontsDe('src').map((ruta) => [ruta, llig(ruta)]);
    expect(referenciesAFullsMigrats(fonts, BLOCS)).toEqual([]);
  });

  test('SONDA: el detector denuncia el full antic i deixa passar el bloc, la marca i la història', () => {
    const blocs = [{ bloc: 'tpv', cami: 'src/components/PedraSeca/tpv.css', nom: 'tpv.css' }];
    expect(referenciesAFullsMigrats([
      ['src/a.jsx', '/* estils a tpv.css */'],
      ['src/b.jsx', '// estils a src/components/PedraSeca/tpv.css'],
      ['src/c.jsx', '/* estils a src/css/modules.css, bloc tpv */'],
      ['src/d.jsx', '/* fotos.tpv.cssx o mitpv.css no són el full */'],
      [MODULS, '/* ═══ BLOC tpv · abans src/components/PedraSeca/tpv.css ═══'],
      ['src/sections/disseny/cataleg/versio.js', '/* la migració va esborrar tpv.css */']
    ], blocs)).toEqual(['src/a.jsx:1 tpv.css', 'src/b.jsx:1 tpv.css']);
  });
});
