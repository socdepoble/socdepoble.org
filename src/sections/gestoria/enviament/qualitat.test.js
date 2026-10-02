// @vitest-environment node
/* Les portes del repo aplicades al carril de l'enviament a la gestoria
   (bucle adversarial, auditoria Codex 261002_0148): ESLint amb la
   configuració del projecte (zero avisos) i els patrons vetats, sobre el
   codi i les proves del carril. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CARRIL = 'src/sections/gestoria/enviament';
const CODI = ['correuGestoria.js', 'revisioAdjunts.js', 'EnviamentGestoria.jsx'].map((f) => `${CARRIL}/${f}`);
const PROVES = [
  'correuGestoria.test.js', 'revisioAdjunts.test.js', 'EnviamentGestoria.test.jsx', 'EnviamentGestoria.revisio.test.jsx', 'qualitat.test.js'
].map((f) => `${CARRIL}/${f}`);
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

/* Els espais que no es veuen (no separable, els de U+2000 a U+200B, l'estret,
   el matemàtic, l'ideogràfic i el BOM), fets des dels punts de codi: així
   este fitxer no en porta cap de cru. */
const RANGS_INVISIBLES = [[0xA0, 0xA0], [0x2000, 0x200B], [0x202F, 0x202F], [0x205F, 0x205F], [0x3000, 0x3000], [0xFEFF, 0xFEFF]];
const INVISIBLES = new RegExp(`[${RANGS_INVISIBLES.map(([des, fins]) => `${String.fromCodePoint(des)}-${String.fromCodePoint(fins)}`).join('')}]`, 'u');

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, als fitxers del carril', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles([...CODI, ...PROVES].map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(CODI.length + PROVES.length);
    expect(missatges).toEqual([]);
  }, 60000);
});

describe('higiene del codi', () => {
  test('cap API ni patró vetat per les portes', () => {
    // Alguns patrons es componen a trossos: si no, les portes que llegixen src/ els trobarien ací.
    const vetats = [
      [/\binner(?:HTML)\b|\bouter(?:HTML)\b|insertAdjacent(?:HTML)|dangerously(?:SetInnerHTML)/, 'HTML cru'],
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge del navegador'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita'],
      [/\sstyle=\{/, 'style= al JSX'],
      [/from '@\//, 'import amb @/'],
      [new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors'].join(''), 'i'), 'backend'],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [new RegExp(['Local', '-First|Offline', '-First'].join('')), 'paraula vetada'],
      [INVISIBLES, 'espai invisible'],
      [new RegExp(['\\.(?:findLast|toSorted|toReversed|groupBy)\\(|with', 'Resolvers'].join('')), 'fora del Baseline']
    ];
    for (const fitxer of CODI) {
      const codi = llig(fitxer);
      for (const [patro, que] of vetats) expect(patro.test(codi), `${fitxer}: ${que}`).toBe(false);
    }
    // Les proves sí que poden buidar l'emmagatzematge del navegador per a comprovar que ningú l'ha omplit.
    for (const fitxer of PROVES) {
      const codi = llig(fitxer);
      for (const [patro, que] of vetats.filter(([, nom]) => nom !== 'emmagatzematge del navegador')) {
        expect(patro.test(codi), `${fitxer}: ${que}`).toBe(false);
      }
    }
  });

  test('l’empremta d’aprovació és SHA-256: cap FNV ni hash de 32 bits al carril', () => {
    for (const fitxer of CODI) expect(llig(fitxer), fitxer).not.toMatch(/FNV|0x811c9dc5|0x01000193/);
    expect(llig(`${CARRIL}/revisioAdjunts.js`)).toMatch(/'SHA-256'/);
  });
});
