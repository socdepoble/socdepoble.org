/**
 * Onada 12 (261011; ordres 261011_0130, punt 1: «revisa la línia 13 de
 * supabase/seed.sql») · El node local servix app_content tal com el sembra
 * supabase/seed.sql. La seua fila 'mediaItems' portava el Mac Mini i la
 * Samarreta com a entrades de Multimèdia amb el text de venda sencer i el
 * logotip de foto: el segon «Mac Mini» que va trobar el Mestre.
 *
 * El seed.sql NO és l'eixida d'ara del generador (porta una llavor sintètica
 * amb un pseudònim per a la persona pilot, i la Porta Llavor veta que hi
 * entre el seu nom), i per això no es compara byte a byte amb APP_CONTENT_ROWS. El que
 * es fixa és la coherència del fitxer amb si mateix: les fotos derivades de
 * la seua fila 'mediaItems' són EXACTAMENT les que mediaContent.js trau de les
 * SEUES files 'marketItems' i 'towns', i cap imatge que nomena falta al disc.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { fotosDelMercat, fotosDelsPobles } from './mediaContent.js';

const SQL = readFileSync(path.join(process.cwd(), 'supabase/seed.sql'), 'utf8');

/* Cada fila d'app_content: ('tenant', 'clau', '<json amb les cometes doblades>'::jsonb, versio). */
const FILA = /\('[^']*', '([A-Za-z]+)', '((?:[^']|'')*)'::jsonb/g;
function filesDelSeedSql() {
  const files = new Map();
  for (const [, clau, json] of SQL.matchAll(FILA)) files.set(clau, JSON.parse(json.replace(/''/g, "'")));
  return files;
}

const RE_IMATGE = /\/assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|gif|svg)/g;

describe('el seed.sql i la Multimèdia', () => {
  const sql = filesDelSeedSql();
  const media = sql.get('mediaItems');

  test('es llig: hi ha les files mediaItems, marketItems i towns', () => {
    for (const clau of ['mediaItems', 'marketItems', 'towns']) expect(Array.isArray(sql.get(clau)), clau).toBe(true);
    expect(media.length).toBeGreaterThan(0);
  });

  test('les fotos del Mercat sembrades són les que mediaContent.js trau dels productes sembrats', () => {
    expect(media.filter((item) => item.tag === 'Mercat')).toEqual(fotosDelMercat(sql.get('marketItems')));
  });

  test('les fotos dels pobles sembrades són les que mediaContent.js trau dels pobles sembrats', () => {
    expect(media.filter((item) => item.tag === 'Poble')).toEqual(fotosDelsPobles(sql.get('towns')));
  });

  test('cap entrada de Multimèdia sembrada porta un logotip de foto, ni el text de venda d’un producte', () => {
    expect(media.filter((item) => /\/logo-/.test(String(item.src))).map((item) => item.id)).toEqual([]);
    const textos = new Set(sql.get('marketItems').map((item) => item.description).filter(Boolean));
    expect(media.filter((item) => textos.has(item.description)).map((item) => item.id)).toEqual([]);
  });

  test('cap id repetit dins de cada col·lecció sembrada', () => {
    const repetits = [];
    for (const [clau, payload] of sql) {
      if (!Array.isArray(payload)) continue;
      const ids = payload.map((item) => item?.id).filter((id) => id != null);
      for (const id of new Set(ids.filter((valor, index) => ids.indexOf(valor) !== index))) repetits.push(`${clau}/${id}`);
    }
    expect(repetits).toEqual([]);
  });

  test('totes les imatges /assets/ que nomena el seed.sql existixen a public/', () => {
    const rutes = [...new Set(SQL.match(RE_IMATGE) || [])];
    expect(rutes.length).toBeGreaterThan(20);
    expect(rutes.filter((ruta) => !existsSync(path.join(process.cwd(), 'public', ruta)))).toEqual([]);
  });
});
