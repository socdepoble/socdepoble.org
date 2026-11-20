import test from 'node:test';
import { FONTS_PRODUCCIO_R3215 } from '../tooling/gates/verifica-rebut-produccio-r3215.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { avaluaMatriu, PROVES_MATRIU } from '../tooling/gates/avalua-matriu-d01-d15.mjs';

function fixture(t) {
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r3215-matriu-')));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  for(const p of PROVES_MATRIU) {
    const f=path.join(root,p.args.find(a=>!a.startsWith('-')));fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,'// fixture immutable\n');
  }
  const source=fileURLToPath(new URL('../tooling/gates/fixtures/produccio-r3214/',import.meta.url));
  fs.cpSync(source,path.join(root,'tooling/gates/fixtures/produccio-r3214'),{recursive:true});
  for(const {ruta} of FONTS_PRODUCCIO_R3215) {const target=path.join(root,ruta);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(fileURLToPath(new URL('../'+ruta,import.meta.url)),target);}
  return root;
}
function good(args) {
  const p=PROVES_MATRIU.find(p=>JSON.stringify(p.args)===JSON.stringify(args.filter(a=>!a.startsWith('--ara='))));
  const stdout=p.tests?'# tests 7\n# pass 7\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n':p.json?' {"valid":true} ':p.syntax?'':p.senyal;
  return {status:0,stdout,stderr:''};
}
function tree(root) {const result={};const walk=d=>{for(const n of fs.readdirSync(d)){const f=path.join(d,n),s=fs.lstatSync(f);if(s.isDirectory())walk(f);else result[path.relative(root,f)]={bytes:fs.readFileSync(f).toString('hex'),mtime:s.mtimeMs};}};walk(root);return result;}
test('15 dimensions, deterministic actual probe receipts and no writes or claimed numeric quality',t=>{
  const root=fixture(t),before=tree(root),calls=[];
  const run=(args,opts)=>{calls.push(args);assert.equal(opts.shell,false);assert.equal(opts.cwd,root);assert.equal('SUPABASE_SERVICE_ROLE_KEY' in opts.env,false);return good(args);};
  const ara=Date.parse('2026-11-19T17:00:00Z');
  const a=avaluaMatriu(root,{ara,executa:run}),b=avaluaMatriu(root,{ara,executa:run});
  assert.deepEqual(a,b);assert.deepEqual(tree(root),before);assert.equal(calls.length,PROVES_MATRIU.length*2);assert.equal(a.valid,true);
  assert.deepEqual(a.dimensions.map(d=>d.id),Array.from({length:15},(_,i)=>`D${String(i+1).padStart(2,'0')}`));
  assert.equal(a.resum.notaGlobal,null);
  for(const d of a.dimensions){assert.equal(d.notaCodiLocal,null);assert.ok(d.evidenciesVerificades.length);assert.ok(d.limitsTecnicsReals.length);}
  assert.ok(a.dimensions.find(d=>d.id==='D04').bloquejosExternsLlei0.some(b=>b.id==='sql-produccio'));
  assert.ok(a.dimensions.find(d=>d.id==='D15').bloquejosExternsLlei0.some(b=>b.id==='apple-testflight'));
});
test('impossible, overflowing or ambiguous TAP counters never certify tests',t=>{
  const root=fixture(t);
  for(const stdout of ['# tests 0\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n',
    '# tests 9007199254740993\n# pass 9007199254740993\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n',
    '# tests 1\n# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n']) {
    const r=avaluaMatriu(root,{executa:args=>args.includes('--test')?{status:0,stdout}:good(args)});
    assert.equal(r.valid,false);assert.equal(r.dimensions.find(d=>d.id==='D03').evidenciesVerificades.length,0);
  }
});
test('console receives the declared current clock rather than a frozen release date',t=>{
  const root=fixture(t),ara=Date.parse('2027-01-01T12:00:00Z');let received;
  const r=avaluaMatriu(root,{ara,executa:args=>{if(args[0].endsWith('tractor-consola-neta.mjs'))received=args;return good(args);}});
  assert.ok(received.includes('--ara=2027-01-01T12:00:00.000Z'));assert.equal(r.rellotge,'2027-01-01T12:00:00.000Z');
  assert.throws(()=>avaluaMatriu(root,{ara:NaN,executa:good}));
});
test('file existence and exit 0 without an execution signal never become verified evidence',t=>{
  const root=fixture(t),r=avaluaMatriu(root,{executa:()=>({status:0,stdout:''})});assert.equal(r.valid,false);
  assert.equal(r.dimensions.find(d=>d.id==='D03').evidenciesVerificades.length,0);
  assert.equal(r.dimensions.find(d=>d.id==='D04').estatCodiLocal,'regressio_detectada');
});
test('red, timeout, null status, malformed JSON and all-skipped tests fail closed',t=>{
  const root=fixture(t);
  for(const raw of [{status:1,stdout:'{"valid":true}'},{status:null,stdout:'{"valid":true}'},{status:0,signal:'SIGTERM'},{status:0,error:new Error('timeout')},{status:0,stdout:'not json'},{status:0,stdout:'# tests 7\n# pass 0\n# fail 0\n# cancelled 0\n# skipped 7\n# todo 0\n'}]) {
    const r=avaluaMatriu(root,{executa:()=>raw});assert.equal(r.valid,false);assert.equal(r.resum.senyalsVerificats,0);
  }
});
test('missing/symlink sources are not measured, supplied output cannot pardon a changed source',t=>{
  const root=fixture(t),p=PROVES_MATRIU[0],f=path.join(root,p.args[0]);fs.unlinkSync(f);fs.symlinkSync('/etc/passwd',f);
  let r=avaluaMatriu(root,{executa:good});assert.equal(r.proves[0].estat,'no_mesurada');
  fs.unlinkSync(f);fs.writeFileSync(f,'before');
  r=avaluaMatriu(root,{executa:args=>{if(args[0]===p.args[0])fs.writeFileSync(f,'after');return good(args);}});
  assert.equal(r.proves[0].motiu,'font_canviada_durant_prova');assert.equal(r.valid,false);
});
test('remote blockers remain unverified even if every local probe passes; failures are not hidden in evidence',t=>{
  const root=fixture(t),r=avaluaMatriu(root,{executa:args=>args.includes('tooling/gates/tractor-rls.mjs')?{status:1,stdout:'failure'}:good(args)});
  for(const id of ['D04','D05']) {const d=r.dimensions.find(x=>x.id===id);assert.equal(d.estatCodiLocal,'regressio_detectada');assert.ok(d.evidenciesVerificades.every(x=>x.id!=='rls'));assert.ok(d.bloquejosExternsLlei0.every(x=>x.estat==='no_verificat'));}
});
