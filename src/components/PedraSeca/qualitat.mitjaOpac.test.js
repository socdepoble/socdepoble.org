// @vitest-environment node
/* XAT-02 (ordre del Mestre, 261014, pla 261014_0210) · qualitat del front
   «sdp-media»: cap <img src="sdp-media://…"> des d'Avatar, AvatarResolt i
   fontSegura (marca.jsx), amb el predicat esMitjaOpac en un mòdul neutral.
   · ESLint amb la configuració del projecte i zero missatges, avisos inclosos,
     a tots els fitxers del front.
   · Pedra Seca per text als fitxers de producció: cap style=, cap color hex,
     cap :has().
   · Fronteres: Pedra Seca i components/universal no importen de sections/;
     esMitjaOpac es definix en un sol lloc i les tres peces la fan servir.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const MODUL = 'src/utils/mitjaOpac.js';
const AVATAR = 'src/components/PedraSeca/atoms/Avatar.jsx';
const RESOLT = 'src/components/universal/identitat/AvatarResolt.jsx';
const MARCA = 'src/components/PedraSeca/organismes/marca.jsx';
const CARA = 'src/sections/xat/components/CaraXat.jsx';
const PRODUCCIO = [MODUL, AVATAR, RESOLT, MARCA, CARA];
const PROVES = [
  'src/utils/mitjaOpac.test.js',
  'src/components/PedraSeca/atoms/Avatar.test.jsx',
  'src/components/universal/identitat/AvatarResolt.test.jsx',
  'src/components/PedraSeca/organismes/marca.test.jsx',
  'src/components/PedraSeca/qualitat.mitjaOpac.test.js'
];
const TOTS = [...PRODUCCIO, ...PROVES];

/* Els especificadors d'importació, estàtics, dinàmics i de reexportació. */
const especificadors = (codi) => [...codi.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g)].map((m) => m[1]);

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís compta com a error).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/utils/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('fora de proves: cap style=, cap color hex, cap :has()', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [new RegExp([':ha', 's\\('].join('')), ':has()']
    ];
    const trobats = PRODUCCIO.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });
});

describe('fronteres', () => {
  test('Avatar, marca.jsx i AvatarResolt no importen de cap secció; el mòdul no importa res', () => {
    const deSeccio = [AVATAR, MARCA, RESOLT].flatMap((f) => especificadors(llig(f)).filter((e) => /\/sections\//.test(e)).map((e) => `${f}: ${e}`));
    expect(deSeccio).toEqual([]);
    expect(especificadors(llig(MODUL))).toEqual([]);
    /* Sonda: el patró veu un import d'una secció. Sense la paraula clau: les
       portes que escanegen les proves no lleven els literals. */
    expect(especificadors("from '../../../sections/xat/components/CaraXat.jsx'")).toEqual(['../../../sections/xat/components/CaraXat.jsx']);
  });

  test('esMitjaOpac es definix només a utils/mitjaOpac.js, i les quatre peces la importen d’allí', () => {
    const definicio = /\b(?:const|function|let|var)\s+esMitjaOpac\b/;
    expect(PRODUCCIO.filter((f) => definicio.test(llig(f)))).toEqual([MODUL]);
    for (const f of [AVATAR, RESOLT, MARCA, CARA]) {
      expect(especificadors(llig(f)).some((e) => e.endsWith('/utils/mitjaOpac.js')), f).toBe(true);
    }
    // CaraXat la reexporta: la seua API no canvia.
    expect(llig(CARA)).toMatch(/^export \{ esMitjaOpac \};$/m);
  });

  test('la guarda va davant del filtre de seguretat a Avatar i a fontSegura, i AvatarResolt la posa en la frontera', () => {
    expect(llig(AVATAR)).toContain('font && !esMitjaOpac(font) && esFontImatgeSegura(font)');
    expect(llig(MARCA)).toContain('font && !esMitjaOpac(font) && esFontImatgeSegura(font) ? font : null');
    expect(llig(RESOLT)).toContain('url && !esMitjaOpac(url) ? url : null');
  });
});
