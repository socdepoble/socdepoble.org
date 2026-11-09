// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test, vi } from 'vitest';
import { llegixCsv } from '../../utils/fulls/index.js';
import { CAMPS_PRIVATS_TARIFA, carregaCatalegParroquia, CATEGORIES_HOSTALERIA, tarifesDeProducte } from './parroquia.js';

const PUBLICA = 'src/data/menjarIBeure/parroquiaDades.generated.json';
const PRIVADA = 'src/data/menjarIBeure/parroquiaDades.privat.json';
const senseCampsPrivats = (tarifa) => Object.fromEntries(Object.entries(tarifa).filter(([camp]) => !CAMPS_PRIVATS_TARIFA.includes(camp)));

describe('La Parròquia · snapshot lineage and source reconciliation', () => {
  test('every original REF and historical price/cost is retained, including open prices and zero placeholders', async () => {
    const dades = await carregaCatalegParroquia();
    const bytes = readFileSync('src/apps/bar/llavors/la-parroquia-loyverse.csv');
    const [header, ...rows] = llegixCsv(bytes);
    const col = (nom) => header.indexOf(nom);
    const perRef = new Map(dades.variants.map((v) => [v.ref, v]));
    expect(dades.fonts[0].sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
    expect(perRef.size).toBe(564);
    expect(rows).toHaveLength(564);
    for (const row of rows) {
      const original = perRef.get(row[col('REF')]);
      expect(original).toMatchObject({ handle: row[col('Handle')], preuOrigen: row[col('Precio [La Parròquia]')], costOrigen: row[col('Coste')] });
    }
    expect(dades.variants.filter((v) => v.costCentsOrigen === 0)).toHaveLength(528);
    expect(dades.variants.filter((v) => v.costCentsOrigen > 0)).toHaveLength(36);
    expect(dades.productes).toHaveLength(327);
  });

  test('ten canonical categories, thirteen unresolved modifier groups, no invented allergen declarations', async () => {
    const dades = await carregaCatalegParroquia();
    expect(CATEGORIES_HOSTALERIA.map((c) => c.codi)).toEqual(['B1', 'B2', 'B3', 'B4', 'B5', 'M1', 'M2', 'M3', 'M4', 'M5']);
    expect(dades.grupsModificadors).toHaveLength(13);
    expect(dades.grupsModificadors.every((g) => g.opcions === null && g.estat === 'opcions_no_exportades')).toBe(true);
    expect(dades.grupsModificadors.map((g) => g.nom)).toContain('Combinats de Café-licor');
    expect(dades.grupsModificadors.map((g) => g.nom)).toContain("Combinats d'Anís");
    expect(dades.productes.every((p) => p.alergensEstat === 'pendent')).toBe(true);
    expect(dades.productes.filter((p) => p.categoria === null)).toHaveLength(2);
  });

  test('workbook tariffs stay separate from TPV sale prices and only exact names link', async () => {
    const dades = await carregaCatalegParroquia();
    const bombo = dades.productes.find((p) => p.handle === 'bombó');
    const tarifes = tarifesDeProducte(dades, bombo);
    expect(tarifes).toHaveLength(1);
    expect(tarifes[0]).toMatchObject({ pvpCents: 130, unitatsPack: 1, cl: 15, ivaPercent: 10 });
    expect(dades.variants.find((v) => v.ref === bombo.refs[0]).preuCents).toBe(150);
    expect(tarifesDeProducte(dades, { nom: 'Bombó', categoria: 'M5' })).toEqual([]);
    expect(tarifesDeProducte(dades, { nom: 'Bombó especial', categoria: 'B1' })).toEqual([]);
  });

  test('409 filesystem entries include 398 authorized bitmaps and 11 non-image metadata entries', async () => {
    const dades = await carregaCatalegParroquia();
    expect(dades.imatges).toHaveLength(409);
    expect(dades.imatges.filter((i) => i.bitmap)).toHaveLength(398);
    expect(dades.imatges.every((i) => i.publicacio === (i.bitmap ? 'autoritzada_encarrec_r14' : 'no_es_bitmap_no_distribuir') && /^[a-f0-9]{64}$/.test(i.sha256))).toBe(true);
    expect(dades.imatges.some((i) => i.ruta.startsWith('/') || i.ruta.includes('..'))).toBe(false);
    dades.productes[0].nom = 'Canvi local';
    expect((await carregaCatalegParroquia()).productes[0].nom).toBe('Bombó');
  });

  test('builds without the historical-business opt-in cannot load its costs', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_SDP_BAR_LLAVOR_LA_PARROQUIA', undefined);
    vi.resetModules();
    try {
      const { carregaCatalegParroquia: carrega, catalegParroquiaDisponible } = await import('./parroquia.js');
      expect(catalegParroquiaDisponible()).toBe(false);
      await expect(carrega()).rejects.toThrow(/no està inclosa/);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});

/* Sanejament R15 (PRIV-06) · Al repositori públic, la instantània sense costos de compra; la
   completa (preu del pack, recàrrec d'equivalència i cel·les d'origen amb costos, marges i
   fórmules) només en local, fora de git, per als builds opt-in i DEV. */
describe('La Parròquia · public snapshot without purchase costs (Sanejament R15, PRIV-06)', () => {
  test('the versioned snapshot carries no pack purchase price, equivalence surcharge or origin cells, and keeps the rest', () => {
    const text = readFileSync(PUBLICA, 'utf8');
    const publica = JSON.parse(text);
    expect(publica.privadesa).toEqual({ versio: 'publica', campsTarifaRetirats: [...CAMPS_PRIVATS_TARIFA], completa: PRIVADA });
    expect(publica.tarifes).toHaveLength(316);
    for (const tarifa of publica.tarifes) {
      for (const camp of CAMPS_PRIVATS_TARIFA) expect(tarifa, `${tarifa.full} · fila ${tarifa.fila}`).not.toHaveProperty(camp);
    }
    // Cada nom de camp privat hi apareix una sola vegada: a privadesa.campsTarifaRetirats.
    for (const camp of CAMPS_PRIVATS_TARIFA) expect(text.split(`"${camp}"`).length - 1, camp).toBe(1);
    expect(text).not.toMatch(/"=[A-Z]+\d/);
    expect(publica.variants).toHaveLength(564);
    expect(publica.productes).toHaveLength(327);
    expect(publica.imatges).toHaveLength(409);
    expect(publica.grupsModificadors).toHaveLength(13);
  });

  test('the complete snapshot is local only: ignored by git and never in the index', (context) => {
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^\/src\/data\/menjarIBeure\/parroquiaDades\.privat\.json$/m);
    if (spawnSync('git', ['rev-parse', '--git-dir']).status !== 0) { context.skip(); return; }
    expect(spawnSync('git', ['check-ignore', '--no-index', '-q', PRIVADA]).status).toBe(0);
    expect(spawnSync('git', ['check-ignore', '--no-index', '-q', PUBLICA]).status).toBe(1);
    const versionat = spawnSync('git', ['ls-files', '--', PRIVADA]);
    expect(versionat.status).toBe(0);
    expect(versionat.stdout.toString().trim()).toBe('');
  });

  test('if the complete snapshot is on disk: the public one is exactly it minus the purchase fields, and DEV loads it', async (context) => {
    if (!existsSync(PRIVADA)) { context.skip(); return; }
    const bytes = readFileSync(PRIVADA);
    const completa = JSON.parse(bytes.toString('utf8'));
    const { privadesa, ...publica } = JSON.parse(readFileSync(PUBLICA, 'utf8'));
    expect(privadesa.versio).toBe('publica');
    expect(publica).toEqual({ ...completa, tarifes: completa.tarifes.map(senseCampsPrivats) });
    const fotos = JSON.parse(readFileSync('src/data/menjarIBeure/parroquiaFotos.generated.json', 'utf8'));
    expect(fotos.fontInventariSha256).toBe(createHash('sha256').update(bytes).digest('hex'));
    const dades = await carregaCatalegParroquia();
    expect(dades.privadesa).toBeUndefined();
    const [tarifa] = tarifesDeProducte(dades, dades.productes.find((p) => p.handle === 'bombó'));
    expect(tarifa).toMatchObject({ pvpCents: 130, preuPackCents: 40, unitatsPack: 1, cl: 15, ivaPercent: 10 });
    expect(tarifa.recarrecEquivalenciaPercent).toBeCloseTo(1.4);
  });
});
