#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/* ───────────────────────────────────────────────────────────────────────────
 * Escàner SQL: lleva comentaris i talla en sentències pel `;` de nivell zero.
 * Respecta '…', "…", $$…$$ / $tag$…$tag$ i els comentaris de bloc imbricats.
 * Sense això, `[\s\S]*?` travessa el `;` i acusa la taula equivocada.
 * ────────────────────────────────────────────────────────────────────────── */
function segmentsSql(sql, separador = ';') {
  const fora = [];
  let buf = '';
  let i = 0;
  const n = sql.length;
  let profunditat = 0;

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
      const escapable = i > 0 && /[eE]/.test(sql[i - 1]) && (i < 2 || !/[a-zA-Z0-9_$]/.test(sql[i - 2]));
      buf += c; i++;
      while (i < n) {
        // PostgreSQL E'…' permet \': no tanca la cadena ni fa executable
        // un ALTER TABLE escrit dins del text literal.
        if (escapable && sql[i] === '\\' && i + 1 < n) { buf += sql.slice(i, i + 2); i += 2; continue; }
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
        if (sql[i] === '"' && sql[i + 1] === '"') { buf += '""'; i += 2; continue; }
        buf += sql[i];
        if (sql[i] === '"') { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '$' && (i === 0 || !/[a-zA-Z0-9_$]/.test(sql[i - 1]))) { // mai dins d'un identificador
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
    if (c === '(') profunditat++;
    if (c === ')') profunditat = Math.max(0, profunditat - 1);
    if (c === separador && profunditat === 0) {    // només separadors de nivell zero
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

const sentencies = sql => segmentsSql(sql);

const SQL_IDENTIFIER = String.raw`(?:"(?:[^"]|"")+"|[a-zA-Z_][a-zA-Z0-9_$]*)`;
const RE_SQL_RELATION = new RegExp(`^\\s*(${SQL_IDENTIFIER})(?:\\s*\\.\\s*(${SQL_IDENTIFIER}))?(?=\\s|\\(|[,*]|$)`);
const sqlIdentifier = (raw) => raw.startsWith('"')
  ? raw.slice(1, -1).replace(/""/g, '"')
  : raw.toLowerCase();

/** CREATE i ALTER compartixen la caixa i els escapaments dels identificadors. */
function sqlRelation(text) {
  const match = RE_SQL_RELATION.exec(text);
  if (!match) return null;
  return {
    schema: match[2] ? sqlIdentifier(match[1]) : 'public',
    table: sqlIdentifier(match[2] ?? match[1]),
    rest: text.slice(match[0].length),
  };
}

/* R2: DDL de nivell superior. La mateixa segmentació respecta literals,
 * identificadors, dollar-quotes i parèntesis en sentències i llistes d'accions.
 * No valida tota la gramàtica PostgreSQL ni interpreta SQL dinàmic.
 */
function accionsRls(statement) {
  const prefix=/^\s*alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?/i.exec(statement);
  if(!prefix)return [];
  const relation=sqlRelation(statement.slice(prefix[0].length));
  if(!relation)return [];
  // PostgreSQL admet l'asterisc de descendència després de la relació.
  const body=relation.rest.replace(/^\s*\*/, '');
  return segmentsSql(body,',').flatMap(part=>{
    const action=/^\s*(enable|disable)\s+row\s+level\s+security\s*$/i.exec(part);
    return action ? [{schema:relation.schema,table:relation.table,enabled:action[1].toLowerCase()==='enable'}] : [];
  });
}

function creacioTaula(statement) {
  const prefix=/^\s*create\s+(?:unlogged\s+)?table\s+(if\s+not\s+exists\s+)?/i.exec(statement);
  const relation=prefix&&sqlRelation(statement.slice(prefix[0].length));
  return relation ? {...relation,ifNotExists:!!prefix[1]} : null;
}

function taulesRetirades(statement) {
  const prefix=/^\s*drop\s+table\s+(?:if\s+exists\s+)?/i.exec(statement);
  if(!prefix)return [];
  const parts=segmentsSql(statement.slice(prefix[0].length),',');
  const relations=parts.map(part=>sqlRelation(part));
  // CASCADE/RESTRICT només pot tancar la llista, no és part d'un nom quoted.
  if(relations.some((relation,i)=>!relation||!(i===parts.length-1
    ? /^\s*(?:cascade|restrict)?\s*$/i : /^\s*$/).test(relation.rest)))return [];
  return relations;
}

/* R2 · Una relació que canvia de nom o d'esquema s'endú el seu estat RLS (en
 * PostgreSQL, ALTER TABLE … RENAME TO i SET SCHEMA conserven la RLS de la
 * taula), i DROP SCHEMA retira totes les de l'esquema. Sense açò, un
 * CREATE TABLE IF NOT EXISTS posterior amb el nom antic heretaria l'«activat»
 * d'una taula que ja no és eixa (Gauntlet O4, D6-05). Un nom que no s'entén
 * retira l'origen i deixa el destí desconegut: el CREATE torna a exigir ENABLE.
 */
function canvisDeRelacio(statement) {
  const alter=/^\s*alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?/i.exec(statement);
  if(alter) {
    const relation=sqlRelation(statement.slice(alter[0].length));
    if(!relation)return [];
    const body=relation.rest.replace(/^\s*\*/, '');
    const rename=/^\s*rename\s+to\s+/i.exec(body);
    const esquema=!rename&&/^\s*set\s+schema\s+/i.exec(body);
    if(!rename&&!esquema)return [];
    const nom=sqlRelation(body.slice((rename||esquema)[0].length));
    const net=nom&&/^\s*$/.test(nom.rest)&&(esquema||nom.schema==='public'&&!/\./.test(body.slice(rename[0].length)));
    const desti=!net ? null
      : rename ? {schema:relation.schema,table:nom.table} : {schema:nom.table,table:relation.table};
    return [{tipus:'mou',des:relation,a:desti}];
  }
  const drop=/^\s*drop\s+schema\s+(?:if\s+exists\s+)?/i.exec(statement);
  if(!drop)return [];
  const parts=segmentsSql(statement.slice(drop[0].length),',');
  return parts.map(part=>sqlRelation(part)).filter(Boolean).map(relation=>({tipus:'esquema',schema:relation.table}));
}

/* R3 · exempcions declarades. Contingut públic per disseny, no dades de persones. */
const R3_EXEMPTES = new Set(['towns', 'app_content']);

const RE_POLITICA = /^\s*create\s+policy\s+(?:if\s+not\s+exists\s+)?(?:"([^"]+)"|([a-zA-Z0-9_]+))\s+on\s+(?:(?:public|storage|private|realtime)\s*\.\s*)?([a-zA-Z0-9_]+)/i;
// Taula gestionada pel servei, verificada al catàleg abans d'aplicar la política.
// No s'exempta l'esquema: qualsevol altra realtime.* continua requerint DDL.
const TAULES_DEL_SERVEI = new Set(['realtime.messages']);
const RE_USING_TRUE = /\busing\s*\(\s*true\s*\)/i;
const RE_CHECK_TRUE = /\bwith\s+check\s*\(\s*true\s*\)/i;

const sqlDir = 'supabase';
let infr = [];
let tables = new Set();
let views = new Set();
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

// Les migracions tenen prefix cronològic. La comprovació final és estable
// encara que el sistema de fitxers enumere o cree els fitxers en altre ordre.
const files = scanFiles(sqlDir).sort();
const estatRlsFinal = new Map();
const r2Reportades = new Set();

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
  const createPolicyRegex = /create policy (?:if not exists )?(?:"[^"]+"|'[a-zA-Z0-9_]+'|[a-zA-Z0-9_]+)\s+on\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)(?:\s+for\s+(select|insert|update|delete|all))?/gi;
  let match;
  while ((match = createPolicyRegex.exec(content)) !== null) {
    const schema = match[1] || 'public';
    const table = match[2];
    const action = (match[3] || 'all').toLowerCase();
    policies.push({ table, file, type: 'policy', action });
    if (schema !== 'storage' && !TAULES_DEL_SERVEI.has(`${schema}.${table}`) && !tables.has(table)) {
      falla('R1', file, `create policy sobre taula inexistent: ${schema}.${table}`);
    }
  }

  const createTriggerRegex = /create trigger [a-zA-Z0-9_]+ (?:after|before) [a-zA-Z0-9_ ]+ on (?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/gi;
  while ((match = createTriggerRegex.exec(content)) !== null) {
    const schema = match[1] || 'public';
    const table = match[2];
    if (schema !== 'storage' && !TAULES_DEL_SERVEI.has(`${schema}.${table}`) && !tables.has(table)) {
      falla('R1', file, `create trigger sobre taula inexistent: ${schema}.${table}`);
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

  // R2: RLS-ABSENT. CREATE normal reinicia l'estat; IF NOT EXISTS conserva
  // l'existent conegut. DROP el retira i cada acció ALTER s'aplica en ordre.
  const statements=sentencies(content);
  const criadesAlFitxer=new Set();
  for(const statement of statements) {
    const created=creacioTaula(statement);
    if(created) {
      const key=JSON.stringify([created.schema,created.table]);
      if(!created.ifNotExists||!estatRlsFinal.has(key)) {
        estatRlsFinal.set(key,{schema:created.schema,table:created.table,enabled:false,lastAction:'create',file});
      }
      criadesAlFitxer.add(key);
    }
    for(const action of accionsRls(statement)) {
      estatRlsFinal.set(JSON.stringify([action.schema,action.table]),{
        ...action,lastAction:action.enabled?'enable':'disable',file,
      });
    }
    for(const removed of taulesRetirades(statement)) {
      const key=JSON.stringify([removed.schema,removed.table]);
      estatRlsFinal.delete(key);
      criadesAlFitxer.delete(key);
    }
    for(const canvi of canvisDeRelacio(statement)) {
      if(canvi.tipus==='esquema') {
        for(const key of [...estatRlsFinal.keys()]) if(JSON.parse(key)[0]===canvi.schema) estatRlsFinal.delete(key);
        for(const key of [...criadesAlFitxer]) if(JSON.parse(key)[0]===canvi.schema) criadesAlFitxer.delete(key);
        continue;
      }
      const des=JSON.stringify([canvi.des.schema,canvi.des.table]);
      const state=estatRlsFinal.get(des);
      const creada=criadesAlFitxer.has(des);
      estatRlsFinal.delete(des);
      criadesAlFitxer.delete(des);
      if(!canvi.a)continue;
      const a=JSON.stringify([canvi.a.schema,canvi.a.table]);
      if(state)estatRlsFinal.set(a,{...state,schema:canvi.a.schema,table:canvi.a.table,file});
      else estatRlsFinal.delete(a);
      if(creada)criadesAlFitxer.add(a);
    }
  }
  // Manté el control de la migració creadora: una activació futura no valida
  // retrospectivament un CREATE que acaba este fitxer sense RLS.
  for(const key of criadesAlFitxer) {
    const state=estatRlsFinal.get(key);
    if(state&&!state.enabled&&state.schema!=='private'&&state.schema!=='storage') {
      falla('R2',file,`La taula ${state.schema}.${state.table} no té RLS activat.`);
      r2Reportades.add(JSON.stringify([file,state.schema,state.table]));
    }
  }

  // R3: USING-TRUE — una política per sentència, comentaris fora, sense travessar el `;`.
  const isLegacyExempt = file.includes('2609110600_perfil_avatar_i_permisos.sql');
  for (const st of sentencies(content)) {
    const cap = RE_POLITICA.exec(st);
    if (!cap) continue;
    const nom = cap[1] ?? cap[2];
    const taula = cap[3];
    if (R3_EXEMPTES.has(taula)) continue;
    if (!isLegacyExempt && RE_USING_TRUE.test(st)) {
      falla('R3', file, `using (true) en política "${nom}" sobre ${taula}`);
    }
    if (!isLegacyExempt && RE_CHECK_TRUE.test(st)) {
      falla('R3', file, `with check (true) en política "${nom}" sobre ${taula}`);
    }
  }

  // R4: VISTA-DEFINER — sobre sentències sense comentaris per evitar falsos positius en comentaris (-- create view només...)
  for (const st of sentencies(content)) {
    const viewMatch = /^\s*create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([a-zA-Z0-9_]+)/i.exec(st);
    if (!viewMatch) continue;
    const viewName = viewMatch[1];
    views.add(viewName);
    if (!st.toLowerCase().includes('security_invoker = true') && !st.toLowerCase().includes('security_invoker=true')) {
      falla('R4', file, `La vista ${viewName} no porta security_invoker = true`);
    }
  }

  // R5: GRANT-ORFE
  const grantRegex = /grant\s+(insert|update|delete|select)(?:\s+\([^)]+\))?\s+on\s+(?:table\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
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
      // R15b · També la forma qualificada de l'esquema private, `revoke all` (en una funció, ALL és EXECUTE)
      // i la llista de rols sense espai: `revoke all on function private.f() from public,anon,authenticated`.
      const revokeRegex = new RegExp(`revoke (?:execute|all) on function (?:public\\.|private\\.)?${funcName}(?:\\([^)]*\\))? from public,\\s*anon\\b`, 'i');
      if (!revokeRegex.test(content)) {
        falla('R8', file, `Funció administrativa ${funcName} no té REVOKE EXECUTE ON FUNCTION FROM PUBLIC, anon.`);
      }
    }
  }
}

// Una migració posterior pot desactivar una taula creada i protegida en un
// altre fitxer. Comprovar només CREATE dins de cada fitxer ho deixava passar.
// És anàlisi de DDL de nivell superior, no execució de funcions o SQL dinàmic.
for(const {schema,table,enabled,lastAction,file} of estatRlsFinal.values()) {
  // storage és gestionat pel servei i manté l'exempció de CREATE. Això no
  // autoritza desactivar explícitament la seua taula protegida d'objectes.
  const protectedTable=schema!=='private'&&schema!=='storage';
  const storageDisabled=schema==='storage'&&table==='objects'&&lastAction==='disable';
  if(!enabled&&(protectedTable||storageDisabled)&&!r2Reportades.has(JSON.stringify([file,schema,table]))) {
    falla('R2',file,`La taula ${schema}.${table} queda amb RLS desactivada al final de l’arbre SQL.`);
  }
}


for (const g of grants) {
  if (views.has(g.table)) continue; // Les vistes hereten RLS de les taules base via security_invoker
  // Comprovem si hi ha cap política per eixa mateixa taula i acció (o 'all')
  const thePolicies = policies.filter(p => p.table === g.table && (p.action === g.type || p.action === 'all'));
  if (thePolicies.length === 0) {
    falla('R5', g.file, `Es concedeix GRANT ${g.type.toUpperCase()} sobre la taula ${g.table} sense cap política RLS que el limite.`);
  }
}


if (infr.length > 0) {
  console.log(`\n❌ [RLS] Trobades ${infr.length} infraccions de seguretat.`);
  for (const i of infr) {
    console.log(`   ${i.llei} · ${i.on}: ${i.detall}`);
  }
  process.exit(1);
} else {
  console.log(`\n✅ [RLS] Cap infracció estàtica detectada (sobre ${files.length} fitxers sql; no executa SQL dinàmic ni comprova permisos remots).`);
}
