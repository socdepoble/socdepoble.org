// @vitest-environment node
/* P0-28 (IDEA-105) · «Drets d'autor» dins d'El compte no pot retindre la
   roda: un scroll container amb overscroll-behavior: contain talla
   l'encadenament encara que no desborde (mesurat a Chrome headless). jsdom no
   maqueta: es comproven les regles escrites i que .perfil-compte existix. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const net = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const declaracions = (css, selector) => {
  const escapat = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const trobada = new RegExp(`(?:^|[}\\s])${escapat}\\s*\\{([^}]*)\\}`).exec(net(css));
  return trobada ? trobada[1].replace(/\s+/g, ' ').trim() : null;
};
const MODULS = llig('src/css/modules.css');

test('P0-28 · dins de .perfil-compte la vista de drets no és scroll container ni retén l’encadenament', () => {
  expect(declaracions(MODULS, '.perfil-compte .sdp-drets')).toBe('flex: none; overflow: visible; overscroll-behavior: auto;');
});

test('P0-28 · la regla del compte va després de la base (mateixa capa) i la base de l’editor (T39) conserva el scroll', () => {
  const base = declaracions(MODULS, '.sdp-drets');
  expect(base).toMatch(/overflow-y: auto;/);
  expect(base).toMatch(/overscroll-behavior: contain;/);
  const text = net(MODULS);
  expect(text.indexOf('.perfil-compte .sdp-drets {')).toBeGreaterThan(text.indexOf('.sdp-drets {'));
});

test('P0-28 · el peu continua sticky i .perfil-compte és de debò un avantpassat (DetallCompte)', () => {
  expect(net(MODULS)).toMatch(/\.sdp-drets__peu\s*\{\s*position: sticky;\s*bottom: 0;/);
  expect(llig('src/sections/profile/DetallCompte.jsx')).toMatch(/className="perfil-compte"/);
});
