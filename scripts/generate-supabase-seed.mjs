import { randomUUID } from 'node:crypto';
import {
  closeSync,
  constants as fsConstants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import {
  APP_CONTENT_ROWS,
  APP_SEED_VERSION
} from '../src/data/appSeed.js';

function toSqlText(value) {
  if (value == null) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toSqlJson(value) {
  return `${toSqlText(JSON.stringify(value))}::jsonb`;
}


function targetMode(target) {
  try {
    const stat = lstatSync(target);
    if (!stat.isFile() || stat.nlink !== 1) {
      throw new Error(`El target no és un fitxer regular amb identitat exclusiva: ${target}`);
    }
    return stat.mode & 0o777;
  } catch (error) {
    if (error.code === 'ENOENT') return 0o644;
    throw error;
  }
}

function atomicWriteFile(target, content) {
  const directory = dirname(target);
  const temporary = resolve(
    directory,
    `.${basename(target)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let fileDescriptor;
  let directoryDescriptor;
  let renamed = false;

  try {
    fileDescriptor = openSync(
      temporary,
      fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
      0o600,
    );
    const temporaryStat = fstatSync(fileDescriptor);
    if (!temporaryStat.isFile() || temporaryStat.nlink !== 1) {
      throw new Error(`El temporal no té identitat física exclusiva: ${temporary}`);
    }

    writeFileSync(fileDescriptor, content, { encoding: 'utf8' });
    fchmodSync(fileDescriptor, targetMode(target));
    fsyncSync(fileDescriptor);
    closeSync(fileDescriptor);
    fileDescriptor = undefined;

    renameSync(temporary, target);
    renamed = true;

    directoryDescriptor = openSync(directory, fsConstants.O_RDONLY);
    fsyncSync(directoryDescriptor);
  } finally {
    if (fileDescriptor !== undefined) closeSync(fileDescriptor);
    if (directoryDescriptor !== undefined) closeSync(directoryDescriptor);
    if (!renamed) {
      try {
        unlinkSync(temporary);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
}

const SEED_TENANT_ID = '11111111-2222-3333-4444-555555555555';

const appContentValues = APP_CONTENT_ROWS.map(
  (row) => `  ('${SEED_TENANT_ID}', ${toSqlText(row.key)}, ${toSqlJson(row.payload)}, ${row.version ?? APP_SEED_VERSION})`
).join(',\n');


const sql = `-- Generated automatically by scripts/generate-supabase-seed.mjs
begin;

insert into public.towns (id, slug, name) values ('${SEED_TENANT_ID}', 'seed-town', 'Poble de Llavors') on conflict do nothing;

insert into public.app_content (tenant_id, key, payload, version)
values
${appContentValues}
on conflict (tenant_id, key) do update
set payload = excluded.payload,
    version = excluded.version,
    updated_at = now();


commit;
`;

const target = resolve(process.cwd(), 'supabase/seed.sql');
atomicWriteFile(target, sql);
console.log('Seed generated at', target);

const finalSql = sql.replace('commit;', `
insert into private.ajustos (clau, valor)
values ('poble_per_defecte', '${SEED_TENANT_ID}')
on conflict (clau) do update set valor = excluded.valor;

-- Create Superadmin User (Javi) if needed (for local testing)
-- In a real environment, auth.users is managed by Supabase, but for seed we can insert a dummy.
-- insert into auth.users (id, email) values ('uuid-del-mestre', 'javi@socdepoble.invalid');
-- insert into public.user_platform_roles (user_id, role) values ('uuid-del-mestre', 'superadmin');

commit;
`);
atomicWriteFile(target, finalSql);
console.log('Seed updated with Fase 3 superadmin config at', target);
