import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { particionaTornsPreRebut, recullMapa, recullFonts } from '../tooling/brain/mapa-consola.mjs';
import { auditaConsola } from '../tooling/gates/tractor-consola-neta.mjs';

const turn = (createdAt, extra = {}) => ({ id: 'synthetic', actor: 'fixture', createdAt, state: 'closed', rebuts: 0, ...extra });
test('MAPA0703 exact inclusive boundary, opening epoch and explicit audit', () => {
  const original = [turn('2026-11-14T23:59:59.999Z'), turn('2026-11-15T00:00:00.000Z'), turn('2026-11-05T01:00:00Z')];
  const saved = structuredClone(original), p = particionaTornsPreRebut(original);
  assert.equal(p.historic.total, 2); assert.equal(p.historic.campTemporal, 'createdAt');
  assert.equal(p.actuals.length, 1); assert.equal(p.actuals[0].createdAt, '2026-11-15T00:00:00.000Z');
  assert.deepEqual(original, saved); assert.equal(p.historic.totalTornsIncloentHistorics, 3);
});
test('absent, malformed, coerced and impossible dates fail closed', () => {
  for (const d of [undefined, null, NaN, 0, {}, [], '', '2026-11-14', '2026-02-30T00:00:00Z', '2026-11-14T24:00:00Z', '2026-11-14T23:59:60Z', '2026-11-14T23:59:59.9999Z', '2026-11-14T23:59:59Zjunk']) {
    const p = particionaTornsPreRebut([turn(d)]); assert.equal(p.historic.total, 0, String(d)); assert.equal(p.actuals.length, 1);
  }
});
test('new epochs, open turns and receipted historic turns never become exceptions', () => {
  const p = particionaTornsPreRebut([turn('2026-11-15T00:00:00Z'), turn('2026-11-01T00:00:00Z', {state:'opened'}), turn('2026-11-01T00:00:00Z',{rebuts:1})]);
  assert.equal(p.historic.total,0); assert.equal(p.actuals.length,3);
  assert.equal(particionaTornsPreRebut(null).historic.total,null);
});
test('the real compiler keeps missing-receipt warnings for every non-exempt date', () => {
  const root = process.cwd(), now = Date.now();
  for (const date of ['2026-11-15T00:00:00.000Z',null,'broken','2026-02-30T00:00:00Z']) {
    const fonts=recullFonts(root,{diagnostic:false,plataforma:'linux',home:'/nonexistent',ara:now});fonts.torns=[turn(date)];
    const m=recullMapa(root,{fonts,ara:now});assert.ok(m.avisos.some(a=>a.codi==='torns-tancats-sense-rebut'));
  }
});
test('gate is green with historical records, red for new/invalid records, and never edits them', async t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r3215-consola-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const sourceDesk = path.join(process.cwd(), '_wiki_de_poble/04_escriptori');
  for(const n of ['.agents','.claude','.codex','.husky','tooling','src','public','_wiki_de_poble','package.json','AGENTS.md','CLAUDE.md','README.md','firebase.json','vercel.json','index.html','supabase','tests','scripts','wordpress-plugin','vite.config.js','vite.natiu.config.js','vite.standalone.config.js']) {
    const from=path.join(process.cwd(),n);if(fs.existsSync(from))fs.cpSync(from,path.join(root,n),{recursive:true,dereference:true,filter:s=>s!==sourceDesk&&!s.startsWith(sourceDesk+path.sep)&&!s.split(path.sep).some(p=>['runtime','90_arxiu_historic'].includes(p)||p.startsWith('.env'))});
  }
  // MAPA0703 tests the turn boundary, independently of the active human desk
  // and its machine-local receipts. Build a complete minimal desk only inside
  // this disposable fixture; missing-receipt documents retain their own tests.
  const desk=path.join(root,'_wiki_de_poble/04_escriptori');fs.mkdirSync(desk,{recursive:true});
  fs.writeFileSync(path.join(desk,'00_index_escriptori.md'),'---\ntype: index\nstatus: canonic\ndescription: Índex documental autocontingut de la fixture MAPA0703\n---\n# Índex de prova\n\n- [[03_llibre_mestre_tasques_i_idees]]\n');
  fs.writeFileSync(path.join(desk,'03_llibre_mestre_tasques_i_idees.md'),'---\ntype: document\nstatus: canonic\ndescription: Llibre permanent mínim de la fixture MAPA0703\n---\n# Llibre de prova\n\nSense tasques alienes ni rebuts importats.\n\n## Matriu P0\n\n| ID | Estat |\n| --- | --- |\n| P0-01 | Pendent |\n');
  execFileSync('git',['init','-q'],{cwd:root});
  execFileSync('git',['-c','core.hooksPath=/dev/null','-c','user.name=Fixture','-c','user.email=test@example.invalid','-c','commit.gpgsign=false','commit','--allow-empty','-qm','fixture'],{cwd:root});
  const dir=path.join(root,'.agents/runtime/turns');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,'torn_fixture.json');
  for(const [date,valid]of[['2026-11-14T23:59:59.999Z',true],['2026-11-15T00:00:00.000Z',false],[null,false],['2026-02-30T00:00:00Z',false]]) {
    const raw=JSON.stringify({turn_id:'fixture',actor:'fixture',state:'closed',createdAt:date,receipts:{}});fs.writeFileSync(file,raw);const before=fs.statSync(file).mtimeMs;
    const r=await auditaConsola(root,{imatges:{}});assert.equal(r.valid,valid,JSON.stringify(r.motor.avisos));
    assert.equal(fs.readFileSync(file,'utf8'),raw);assert.equal(fs.statSync(file).mtimeMs,before);
  }
});
