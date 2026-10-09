/**
 * Correcció final (ordre del Mestre, 261004; front «persones-logo») · El node
 * local servix app_content tal com el sembra supabase/seed.sql, un fitxer
 * generat per scripts/generate-supabase-seed.mjs des de les llavors JS
 * (appSeed.js · APP_CONTENT_ROWS). Si el seed.sql és anterior a una signatura
 * d'entitat (T6: author_entity_id), l'element arriba a la pàgina sense saber
 * qui el signa: la boina no porta a /projecte i la capçalera no porta el
 * logotip de l'entitat (PageFrame, via d). Li passava a l'Aplec pel Territori
 * (/events/aplec-2023). Esta prova fixa que tot element de les llavors que
 * signa una entitat la signa igual al seed.sql.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { APP_CONTENT_ROWS } from '../../data/appSeed.js';
import { autorDe, RUTA_PERFIL_PROJECTE, rutaDAutoria } from '../../config/navigation.js';

const SQL = readFileSync(path.join(process.cwd(), 'supabase/seed.sql'), 'utf8');

/* Cada fila d'app_content: ('tenant', 'clau', '<json amb les cometes doblades>'::jsonb, versio). */
const FILA = /\('[^']*', '([A-Za-z]+)', '((?:[^']|'')*)'::jsonb/g;
function filesDelSeedSql() {
  const files = new Map();
  for (const [, clau, json] of SQL.matchAll(FILA)) files.set(clau, JSON.parse(json.replace(/''/g, "'")));
  return files;
}

/* Les claus de qui signa una entitat (navigation.js · autorDe). */
const CAMPS_D_ENTITAT = ['author_org_id', 'authorOrgId', 'author_entity_id'];
const SECCIONS = ['feedPosts', 'marketItems', 'events', 'mediaItems'];

describe('el seed.sql signa com les llavors', () => {
  const sql = filesDelSeedSql();

  test('es llig: hi ha les files de les seccions', () => {
    for (const clau of SECCIONS) expect(Array.isArray(sql.get(clau)), clau).toBe(true);
    expect(sql.get('events').length).toBeGreaterThan(0);
  });

  test('tot element de les llavors que signa una entitat la signa igual al seed.sql', () => {
    const divergencies = [];
    for (const { key, payload } of APP_CONTENT_ROWS) {
      if (!SECCIONS.includes(key) || !Array.isArray(payload)) continue;
      const delSql = new Map(sql.get(key).map((item) => [String(item.id), item]));
      for (const item of payload) {
        const sembrat = delSql.get(String(item.id));
        if (!sembrat) continue;
        for (const camp of CAMPS_D_ENTITAT) {
          if (item[camp] == null) continue;
          if (String(sembrat[camp] ?? '') !== String(item[camp])) divergencies.push(`${key}/${item.id}: ${camp}`);
        }
      }
    }
    expect(divergencies).toEqual([]);
  });

  /* Onada 8 (261009) · La boina del pilot porta al seu perfil, ja no a /projecte. */
  test('l’Aplec pel Territori i la samarreta, sembrats, porten la boina al perfil de Sóc de Poble (per identificador, mai pel nom)', () => {
    const aplec = sql.get('events').find((item) => item.id === 'aplec-2023');
    const samarreta = sql.get('marketItems').find((item) => item.id === 'samarreta-socdepoble');
    expect(rutaDAutoria(autorDe(aplec))).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDAutoria(autorDe(samarreta))).toBe(RUTA_PERFIL_PROJECTE);
  });
});
