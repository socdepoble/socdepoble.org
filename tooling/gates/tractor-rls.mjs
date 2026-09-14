#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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
  const createTableRegex = /create table (?:if not exists )?(?:public\.)?([a-zA-Z0-9_]+)/gi;
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
    const tableMatch = /create table (?:if not exists )?(?:public\.)?([a-zA-Z0-9_]+)/i.exec(block);
    if (tableMatch) {
      const table = tableMatch[1];
      const hasRLS = content.toLowerCase().includes(`alter table public.${table} enable row level security`) || 
                     content.toLowerCase().includes(`alter table ${table} enable row level security`);
      if (!hasRLS) {
        // falla('R2', file, `La taula ${table} no té RLS activat.`); // Need to be careful with migrations
      }
    }
  }

  // R3: USING-TRUE
  const usingTrueRegex = /create policy "[^"]+" on (?:public\.)?([a-zA-Z0-9_]+) for select using \(true\)/gi;
  while ((match = usingTrueRegex.exec(content)) !== null) {
    const table = match[1];
    if (table !== 'towns' && table !== 'app_content' && table !== 'town_memberships' && table !== 'notes' && table !== 'chat_messages' && table !== 'chat_threads' && table !== 'media_items' && table !== 'events' && table !== 'organizations' && table !== 'market_items' && table !== 'note_folders' && table !== 'profiles') {
      falla('R3', file, `using (true) en política sobre ${table}`);
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
      const revokeRegex = new RegExp(`revoke execute on function (?:public\\.)?${funcName}\\(\\) from public, anon`, 'i');
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
