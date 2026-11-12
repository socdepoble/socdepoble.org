// @vitest-environment node
/**
 * Salfumant Lingüístic i Invariants d'Onada R21 (Carril 3 · Gemini Carbon)
 *   · P0-41 / IDEA-172 + P0-38 / IDEA-157 (Regla del Cosí Guillermo):
 *     Prohibit aplicar l'adjectiu «sobirà / sobirana / soberano / soberana / sovereign»
 *     a la IAIA, al WhatsApp de la IAIA o al Mirall Comunitari Node 0.
 *   · P0-31 + P0-34 + P0-51 (Mur Foraster net):
 *     Zero barra `.sdp-mur-revisio-bar` activa per defecte (només amb `?revisio=wordpress`),
 *     zero píndoles de «m'agrada / likes» inventades al Mur i zero atributs DOM amb `owner_user_id`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

function llistaFitxersCodi(dirRel) {
  const abs = path.join(ARREL, dirRel);
  const eixida = [];
  for (const entrada of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dirRel}/${entrada.name}`;
    if (entrada.isDirectory()) {
      eixida.push(...llistaFitxersCodi(rel));
    } else if (/\.(?:js|jsx|mjs)$/.test(entrada.name) && !/\.test\.(?:js|jsx)$/.test(entrada.name)) {
      eixida.push(rel);
    }
  }
  return eixida.sort();
}

/* Patrons vetats construïts per fragments per no auto-activar buscadors literals. */
const RE_IAIA_SOBIRANA = new RegExp(
  [
    '(?:IAIA|WhatsApp\\s+de\\s+la\\s+IAIA)\\s+(?:[A-Za-zÀ-ÿ0-9·-]+\\s+){0,2}(?:sobir',
    'an?[ae]?s?|soberan[oa]s?|sovereign)',
    '|(?:sobir',
    'an?[ae]?s?|soberan[oa]s?|sovereign)\\s+(?:de\\s+la\\s+)?IAIA',
  ].join(''),
  'i',
);

const RE_MIRALL_SOBIRA_NODE0 = new RegExp(
  ['Mirall\\s+Sobir', 'à\\s+Node\\s+0'].join(''),
  'i',
);

describe('Onada R21 · Salfumant Lingüístic (P0-41 + P0-38 · Regla del Cosí Guillermo)', () => {
  test('cap fitxer de producció a src/ aplica «sobirà/sobirana» a la IAIA, WhatsApp de la IAIA ni al Mirall Node 0', () => {
    const fitxers = llistaFitxersCodi('src');
    const infraccions = [];

    for (const rel of fitxers) {
      const contingut = readFileSync(path.join(ARREL, rel), 'utf8');
      if (RE_IAIA_SOBIRANA.test(contingut)) {
        infraccions.push(`${rel}: adjectiu sobirà/sobirana aplicat a la IAIA`);
      }
      if (RE_MIRALL_SOBIRA_NODE0.test(contingut)) {
        infraccions.push(`${rel}: cadena residual «Mirall Sobirà Node 0»`);
      }
    }

    expect(infraccions).toEqual([]);
  });

  test('la sonda del detector atrapa tant «IAIA sobirana» com el residual del Mirall Node 0', () => {
    expect(RE_IAIA_SOBIRANA.test(['WhatsApp de la IAIA ', 'sobirana'].join(''))).toBe(true);
    expect(RE_IAIA_SOBIRANA.test(['la IAIA ', 'soberana'].join(''))).toBe(true);
    expect(RE_MIRALL_SOBIRA_NODE0.test(['Sóc de Poble · Mirall Sobir', 'à Node 0/'].join(''))).toBe(true);
    expect(RE_MIRALL_SOBIRA_NODE0.test('Sóc de Poble · Mirall Comunitari Node 0/')).toBe(false);
  });
});

describe('Onada R21 · Invariants del Mur públic (P0-31 + P0-34 + P0-51)', () => {
  test('MurSection només activa la revisió amb ?revisio=wordpress i ni MurSection ni TargetaDelMur exposen owner_user_id al DOM', () => {
    const mur = readFileSync(path.join(ARREL, 'src/sections/mur/MurSection.jsx'), 'utf8');
    const targeta = readFileSync(path.join(ARREL, 'src/sections/mur/TargetaDelMur.jsx'), 'utf8');
    expect(mur).toMatch(/searchParams\.get\(['"]revisio['"]\)/);
    expect(mur).toMatch(/===\s*['"]wordpress['"]/);
    expect(mur).not.toMatch(/sdp-mur-revisio-bar/);
    expect(mur).not.toMatch(/data-owner|owner_user_id/);
    expect(targeta).not.toMatch(/data-owner|owner_user_id/);
    expect(targeta).not.toMatch(/0\s+m['’]agrada/i);
  });
});
