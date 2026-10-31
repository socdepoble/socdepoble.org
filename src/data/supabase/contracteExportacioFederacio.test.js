// @vitest-environment node
/* P2-09 (D06/D07 · Lot 4) · Prova de contracte explícit d'exportació RGPD per a
   les taules de federació (`realms`, `user_realms`, `connections`, `posts`).
   Verifica que:
   1. Els quatre recursos de `federacio_no_versionada` d'`exporta_les_meues_dades()`
      tenen declarada la seua columna exacta de propietat (`owner_user_id` /
      `user_id` / `author_id` === `auth.uid()`), la llista de columnes
      exportables i les columnes UUID excloses d'inferència.
   2. Qualsevol fila aliena retornada per coincidència en una columna UUID no
      propietària (`target_user_id`, `connected_user_id`, `invited_by`,
      `reply_to_user_id`, `moderator_id`, `id`, `tenant_id`, etc.) queda
      rebutjada al 100%.
   3. Qualsevol columna interna, de credencial o de tercers fora de
      `columnesExportades` queda extirpada abans d'arribar al client. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  CONDICIO_SQL_PROPIETAT_FEDERACIO,
  CONSULTA_SQL_AUDITORIA_ESQUEMA_FEDERACIO,
  CONTRACTE_EXPORTACIO_FEDERACIO,
  TAULES_FEDERACIO_CONTRACTE,
  aplicaContracteExportacioFederacio,
  columnaPropietatEfectiva,
  esFilaPropiaFederacio,
  filtraFederacioExportada,
  projectaFilaFederacio
} from './contracteExportacioFederacio.js';

const ARREL = process.cwd();
const SQL_EXPORTACIO = readFileSync(
  path.join(ARREL, 'supabase/migrations/2610241410_exporta_dades_moderacio.sql'),
  'utf8'
);

const UID_PROPI = '11111111-1111-4111-8111-111111111111';
const UID_ALIE = '22222222-2222-4222-8222-222222222222';

describe('P2-09 · estructura i immutabilitat del contracte de federació', () => {
  test('les taules del contracte casen 1:1 amb l’array de federació d’exporta_les_meues_dades()', () => {
    expect(Object.isFrozen(TAULES_FEDERACIO_CONTRACTE)).toBe(true);
    expect(Object.isFrozen(CONTRACTE_EXPORTACIO_FEDERACIO)).toBe(true);
    expect(Object.keys(CONTRACTE_EXPORTACIO_FEDERACIO)).toEqual([...TAULES_FEDERACIO_CONTRACTE]);
    const coincidenciaSql = /foreach\s+v_taula\s+in\s+array\s+array\[([^\]]+)\]/i.exec(SQL_EXPORTACIO);
    expect(coincidenciaSql).not.toBeNull();
    const taulesSql = [...coincidenciaSql[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(taulesSql).toEqual([...TAULES_FEDERACIO_CONTRACTE]);
  });

  test('cada recurs fixa una columna exacta de propietat (owner_user_id / user_id / author_id) i exclou id, tenant_id i contraparts', () => {
    expect(CONTRACTE_EXPORTACIO_FEDERACIO.realms.columnaPropietat).toBe('owner_user_id');
    expect(CONTRACTE_EXPORTACIO_FEDERACIO.user_realms.columnaPropietat).toBe('user_id');
    expect(CONTRACTE_EXPORTACIO_FEDERACIO.connections.columnaPropietat).toBe('user_id');
    expect(CONTRACTE_EXPORTACIO_FEDERACIO.posts.columnaPropietat).toBe('author_id');

    for (const taula of TAULES_FEDERACIO_CONTRACTE) {
      const c = CONTRACTE_EXPORTACIO_FEDERACIO[taula];
      expect(Object.isFrozen(c), taula).toBe(true);
      expect(Object.isFrozen(c.columnesPropietatAdmeses), taula).toBe(true);
      expect(Object.isFrozen(c.columnesExclosesPropietat), taula).toBe(true);
      expect(Object.isFrozen(c.columnesExportades), taula).toBe(true);
      expect(c.columnesPropietatAdmeses[0], taula).toBe(c.columnaPropietat);
      expect(c.columnesExclosesPropietat, taula).toContain('id');
      expect(c.columnesExclosesPropietat, taula).toContain('tenant_id');
      for (const colProp of c.columnesPropietatAdmeses) {
        expect(c.columnesExclosesPropietat, `${taula}.${colProp}`).not.toContain(colProp);
        expect(c.columnesExportades, `${taula}.${colProp}`).toContain(colProp);
      }
      expect(CONDICIO_SQL_PROPIETAT_FEDERACIO[taula]).toBe(`t.${c.columnaPropietat} = auth.uid()`);
    }
    expect(CONSULTA_SQL_AUDITORIA_ESQUEMA_FEDERACIO).toContain("table_name IN ('realms', 'user_realms', 'connections', 'posts')");
  });
});

describe('P2-09 · prevenció de filtració per inferència d’UUID (zero files alienes)', () => {
  test('rebutja files on la coincidència d’UUID és en una columna exclosa (target_user_id, invited_by, reply_to_user_id, moderator_id)', () => {
    const casosAliens = [
      ['realms', { id: UID_PROPI, owner_user_id: UID_ALIE, moderator_id: UID_PROPI, slug: 'reialme-alie' }],
      ['user_realms', { id: 'ur-1', user_id: UID_ALIE, invited_by: UID_PROPI, granted_by: UID_PROPI, role: 'member' }],
      ['connections', { id: 'conn-1', user_id: UID_ALIE, target_user_id: UID_PROPI, connected_user_id: UID_PROPI, status: 'accepted' }],
      ['posts', { id: 'post-1', author_id: UID_ALIE, reply_to_user_id: UID_PROPI, mentioned_user_id: UID_PROPI, content: 'Alien' }]
    ];

    for (const [taula, fila] of casosAliens) {
      expect(esFilaPropiaFederacio(taula, fila, UID_PROPI), taula).toBe(false);
      expect(projectaFilaFederacio(taula, fila, UID_PROPI), taula).toBeNull();
    }
  });

  test('rebutja en mode fail-closed files sense columna de propietat reconeguda o sense uid vàlid', () => {
    for (const taula of TAULES_FEDERACIO_CONTRACTE) {
      expect(columnaPropietatEfectiva(taula, { id: UID_PROPI, tenant_id: UID_PROPI })).toBeNull();
      expect(esFilaPropiaFederacio(taula, { id: UID_PROPI, tenant_id: UID_PROPI }, UID_PROPI)).toBe(false);
      expect(esFilaPropiaFederacio(taula, { user_id: null, author_id: null, owner_user_id: null }, UID_PROPI)).toBe(false);
      expect(esFilaPropiaFederacio(taula, { user_id: UID_PROPI, author_id: UID_PROPI, owner_user_id: UID_PROPI }, '')).toBe(false);
      expect(esFilaPropiaFederacio(taula, null, UID_PROPI)).toBe(false);
    }
    expect(esFilaPropiaFederacio('taula_inexistent', { user_id: UID_PROPI }, UID_PROPI)).toBe(false);
  });

  test('accepta files pròpies (comparació UUID insensible a majúscules) i projecta només columnesExportades', () => {
    const filaPost = {
      id: 'post-propi',
      tenant_id: '00000000-0000-4000-8000-000000000000',
      author_id: UID_PROPI.toUpperCase(),
      title: 'Bàndol federat',
      content: 'Contingut del poble',
      visibility: 'public',
      reply_to_user_id: UID_ALIE,
      ip_hash: 'secret-hash',
      private_moderation_note: 'intern'
    };

    expect(esFilaPropiaFederacio('posts', filaPost, UID_PROPI)).toBe(true);
    const projectada = projectaFilaFederacio('posts', filaPost, UID_PROPI);
    expect(projectada).toEqual({
      id: 'post-propi',
      tenant_id: '00000000-0000-4000-8000-000000000000',
      author_id: UID_PROPI.toUpperCase(),
      title: 'Bàndol federat',
      content: 'Contingut del poble',
      visibility: 'public'
    });
    expect(projectada).not.toHaveProperty('reply_to_user_id');
    expect(projectada).not.toHaveProperty('ip_hash');
    expect(projectada).not.toHaveProperty('private_moderation_note');
  });

  test('aplicaContracteExportacioFederacio conserva marcadors d’error SQL i neteja taules fora del contracte', () => {
    const entrada = {
      format: 'socdepoble.exportacio.v1',
      federacio_no_versionada: {
        realms: { error: '42P01', detall_intern: 'no exposar' },
        user_realms: [
          { id: 'ur-propia', user_id: UID_PROPI, realm_id: 'r1', role: 'admin', invited_by: UID_ALIE },
          { id: 'ur-aliena', user_id: UID_ALIE, realm_id: 'r1', role: 'member', invited_by: UID_PROPI }
        ],
        connections: [],
        taula_estranya: [{ id: 'x', user_id: UID_PROPI }]
      }
    };

    const eixida = aplicaContracteExportacioFederacio(entrada, UID_PROPI);
    expect(eixida.federacio_no_versionada).toEqual({
      realms: { error: '42P01' },
      user_realms: [{ id: 'ur-propia', user_id: UID_PROPI, realm_id: 'r1', role: 'admin' }],
      connections: []
    });
    expect(filtraFederacioExportada(null, UID_PROPI)).toEqual({error: 'SDP-FED-FORMAT-NO-ADMES'});
    expect(aplicaContracteExportacioFederacio({ format: 'socdepoble.exportacio.v1' }, UID_PROPI)).toEqual({
      format: 'socdepoble.exportacio.v1'
    });
  });
});

test('declara esquema incompatible en propietat desconeguda o valor estructurat, sense secrets crus', () => {
  for (const fila of [{created_by: UID_PROPI, name: 'meu'}, {author_id: UID_PROPI, content: {private_key: 'SECRET'}}]) {
    expect(filtraFederacioExportada({posts: [fila]}, UID_PROPI)).toEqual({posts: {error: 'SDP-FED-ESQUEMA-NO-ADMES'}});
  }
  expect(filtraFederacioExportada([{private_key: 'SECRET'}], UID_PROPI)).toEqual({error: 'SDP-FED-FORMAT-NO-ADMES'});
  expect(filtraFederacioExportada({posts: 'SECRET'}, UID_PROPI)).toEqual({posts: {error: 'SDP-FED-FORMAT-NO-ADMES'}});
  expect(columnaPropietatEfectiva('__proto__', {})).toBeNull();
});
