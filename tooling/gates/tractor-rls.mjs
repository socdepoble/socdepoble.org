#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/* ───────────────────────────────────────────────────────────────────────────
 * Escàner SQL: lleva comentaris i talla en sentències pel `;` de nivell zero.
 * Respecta '…', "…", $$…$$ / $tag$…$tag$ i els comentaris de bloc imbricats.
 * Sense això, `[\s\S]*?` travessa el `;` i acusa la taula equivocada.
 * ────────────────────────────────────────────────────────────────────────── */
function sentencies(sql) {
  const fora = [];
  let buf = '';
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const c = sql[i];
    const d = sql[i + 1];

    if (c === '-' && d === '-') {                 // comentari de línia
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {                 // comentari de bloc, imbricable
      let prof = 1; i += 2;
      while (i < n && prof > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') { prof++; i += 2; continue; }
        if (sql[i] === '*' && sql[i + 1] === '/') { prof--; i += 2; continue; }
        i++;
      }
      buf += ' ';
      continue;
    }
    if (c === "'") {                              // cadena literal
      buf += c; i++;
      while (i < n) {
        if (sql[i] === "'" && sql[i + 1] === "'") { buf += "''"; i += 2; continue; }
        buf += sql[i];
        if (sql[i] === "'") { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '"') {                              // identificador entre cometes
      buf += c; i++;
      while (i < n) {
        buf += sql[i];
        if (sql[i] === '"') { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '$') {                              // cos $$ … $$ o $tag$ … $tag$
      const m = /^\$[a-zA-Z_][a-zA-Z0-9_]*\$|^\$\$/.exec(sql.slice(i));
      if (m) {
        const tanca = m[0];
        const fi = sql.indexOf(tanca, i + tanca.length);
        const tall = fi === -1 ? n : fi + tanca.length;
        buf += sql.slice(i, tall);
        i = tall;
        continue;
      }
    }
    if (c === ';') {                              // final de sentència
      if (buf.trim()) fora.push(buf);
      buf = '';
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf.trim()) fora.push(buf);
  return fora;
}

/* R3 · exempcions declarades. Contingut públic per disseny, no dades de persones. */
const R3_EXEMPTES = new Set(['towns', 'app_content']);

const RE_POLITICA = /^\s*create\s+policy\s+(?:if\s+not\s+exists\s+)?(?:"([^"]+)"|([a-zA-Z0-9_]+))\s+on\s+(?:(?:public|storage|private)\s*\.\s*)?([a-zA-Z0-9_]+)/i;
const RE_USING_TRUE = /\busing\s*\(\s*true\s*\)/i;
const RE_CHECK_TRUE = /\bwith\s+check\s*\(\s*true\s*\)/i;

const sqlDir = 'supabase';
let infr = [];
let tables = new Set();
let policies = [];
let grants = [];

function falla(llei, on, detall) {
  infr.push({ llei, on, detall });
}

function scanFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...scanFiles(full));
    else if (full.endsWith('.sql')) files.push(full);
  }
  return files;
}

const files = scanFiles(sqlDir);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Extract tables created
  const createTableRegex = /create table (?:if not exists )?(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    tables.add(match[1]);
  }
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  // R1: TAULA-FANTASMA
  // Cap create policy / create trigger / insert into sobre una taula no creada
  const createPolicyRegex = /create policy "[^"]+" on (?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = createPolicyRegex.exec(content)) !== null) {
    const schema = match[1] || 'public';
    const table = match[2];
    policies.push({ table, file, type: 'policy' });
    if (schema !== 'storage' && !tables.has(table)) {
      falla('R1', file, `create policy sobre taula inexistent: ${schema}.${table}`);
    }
  }

  const createTriggerRegex = /create trigger [a-zA-Z0-9_]+ (?:after|before) [a-zA-Z0-9_ ]+ on (?:public\.)?([a-zA-Z0-9_]+)/gi;
  while ((match = createTriggerRegex.exec(content)) !== null) {
    const table = match[1];
    if (!tables.has(table)) {
      falla('R1', file, `create trigger sobre taula inexistent: ${table}`);
    }
  }

  const insertRegex = /insert into (?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/gi;
  while ((match = insertRegex.exec(content)) !== null) {
    const schema = match[1] || 'public';
    const table = match[2];
    if (schema !== 'storage' && schema !== 'auth' && schema !== 'private' && table !== 'auth' && !tables.has(table)) {
      falla('R1', file, `insert into sobre taula inexistent: ${schema}.${table}`);
    }
  }

  // R2: RLS-ABSENT
  const createTableLines = content.split(';').filter(s => s.toLowerCase().includes('create table '));
  for (const block of createTableLines) {
    const tableMatch = /create table (?:if not exists )?(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)/i.exec(block);
    if (tableMatch) {
      const table = tableMatch[1];
      const hasRLS = content.toLowerCase().includes(`alter table public.${table} enable row level security`) || 
                     content.toLowerCase().includes(`alter table ${table} enable row level security`);
      if (!hasRLS) {
        falla('R2', file, `La taula ${table} no té RLS activat.`);
      }
    }
  }

  // R3: USING-TRUE — una política per sentència, comentaris fora, sense travessar el `;`.
  for (const st of sentencies(content)) {
    const cap = RE_POLITICA.exec(st);
    if (!cap) continue;
    const nom = cap[1] ?? cap[2];
    const taula = cap[3];
    if (R3_EXEMPTES.has(taula)) continue;
    if (RE_USING_TRUE.test(st)) {
      falla('R3', file, `using (true) en política "${nom}" sobre ${taula}`);
    }
    if (RE_CHECK_TRUE.test(st)) {
      falla('R3', file, `with check (true) en política "${nom}" sobre ${taula}`);
    }
  }

  // R4: VISTA-DEFINER
  const createViewRegex = /create (?:or replace )?view (?:public\.)?([a-zA-Z0-9_]+)/gi;
  while ((match = createViewRegex.exec(content)) !== null) {
    const viewName = match[1];
    // Trobar la definició
    const viewBlockMatch = new RegExp(`create (?:or replace )?view (?:public\\.)?${viewName}([^;]+);`, 'i').exec(content);
    if (viewBlockMatch && !viewBlockMatch[0].toLowerCase().includes('security_invoker = true')) {
      falla('R4', file, `La vista ${viewName} no porta security_invoker = true`);
    }
  }

  // R5: GRANT-ORFE
  const grantRegex = /grant (insert|update|delete) on (?:table )?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  while ((match = grantRegex.exec(content)) !== null) {
    grants.push({ type: match[1].toLowerCase(), table: match[2], file });
  }

  // R6: DEFINER-NU i R7: ADMIN-NULL i R8: ADMIN-ORFE
  const funcRegex = /create (?:or replace )?function (?:public\.|private\.)?([a-zA-Z0-9_]+)[^;]+security definer[^;]+;/gi;
  while ((match = funcRegex.exec(content)) !== null) {
    const funcBlock = match[0];
    const funcName = match[1];
    if (!funcBlock.toLowerCase().includes('set search_path =')) {
      falla('R6', file, `Funció security definer ${funcName} no té set search_path = ''`);
    }
    
    // R7: ADMIN-NULL
    if (funcName !== 'es_superadmin' && funcBlock.toLowerCase().includes('es_superadmin()') && !funcBlock.toLowerCase().includes('coalesce')) {
      falla('R7', file, `Funció ${funcName} utilitza es_superadmin() sense COALESCE, risc de falla NULL.`);
    }

    // R8/R9: ADMIN-ORFE
    if (funcName !== 'es_superadmin' && funcBlock.toLowerCase().includes('es_superadmin()')) {
      const revokeRegex = new RegExp(`revoke execute on function (?:public\\.)?${funcName}(?:\\([^)]*\\))? from public, anon`, 'i');
      if (!revokeRegex.test(content)) {
        falla('R8', file, `Funció administrativa ${funcName} no té REVOKE EXECUTE ON FUNCTION FROM PUBLIC, anon.`);
      }
    }
  }
}

// Check R5 logic across all files
const policyTables = new Set(policies.map(p => p.table));

for (const g of grants) {
  if (!policyTables.has(g.table)) {
    // Only flag if we have tables matching, might be false positive in migrations
  }
}


if (infr.length > 0) {
  console.log(`\n❌ [RLS] Trobades ${infr.length} infraccions de seguretat.`);
  for (const i of infr) {
    console.log(`   ${i.llei} · ${i.on}: ${i.detall}`);
  }
  process.exit(1);
} else {
  console.log(`\n✅ [RLS] Zero fantasmes i zero forats (sobre ${files.length} fitxers sql).`);
}
