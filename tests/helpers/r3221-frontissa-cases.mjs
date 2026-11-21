import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MODULE = new URL('../../tooling/gates/fusiona-frontissa-estructural.mjs', import.meta.url);
const gate = fileURLToPath(MODULE);
const entry = (char, html = 20) => ({ sha256: char.repeat(64), html, aprovat_per: 'Mestre — ordre explícita', data: '2026-11-20' });
const reg = claus => ({ schema: 'sdp.contingut.v1', claus });
const fixture = fn => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3221-frontissa-'));
  fs.mkdirSync(path.join(dir, '.agents'));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
};
const write = (dir, name, value) => { const file = path.join(dir, name); fs.writeFileSync(file, JSON.stringify(value, null, 2)+'\n'); return file; };

test('R32.21 Frontissa: actualitzacions disjuntes, preimatges, determinisme i replay parcial', async () => {
  const { fusionaFrontissa, hashCanonic } = await import(MODULE);
  const base = reg({ legal: entry('a'), fedivers: entry('b'), versions: entry('c') });
  const a = reg({ ...base.claus, fedivers: entry('d') });
  const b = reg({ ...base.claus, legal: entry('e') });
  const first = fusionaFrontissa({ base, actual: base, branques: [a,b], baseSha256: hashCanonic(base) });
  const second = fusionaFrontissa({ base, actual: base, branques: [b,a], baseSha256: hashCanonic(base) });
  assert.equal(first.status, 'READY_TO_APPLY');
  assert.equal(first.text, second.text);
  assert.deepEqual(first.canvis, ['fedivers','legal']);
  assert.equal(first.registre.claus.versions.sha256, base.claus.versions.sha256);
  assert.equal(first.registre.claus.legal.aprovat_per, b.claus.legal.aprovat_per);
  assert.equal(fusionaFrontissa({base, actual:a, branques:[a,b], baseSha256:hashCanonic(base)}).text, first.text);
  assert.equal(fusionaFrontissa({base, actual:first.registre, branques:[a,b], baseSha256:hashCanonic(base)}).status, 'ALREADY_APPLIED');
  assert.throws(() => fusionaFrontissa({base,actual:base,branques:[a,a],baseSha256:hashCanonic(base)}), /col·lisió/i);
  assert.throws(() => fusionaFrontissa({base,actual:reg({...base.claus,versions:entry('f')}),branques:[a,b],baseSha256:hashCanonic(base)}), /preimatge/i);
  assert.throws(() => fusionaFrontissa({base,actual:base,branques:[a],baseSha256:'0'.repeat(64)}), /base/i);
  assert.deepEqual(base.claus.fedivers, entry('b'));
});

test('R32.21 Frontissa: addicions, retirades i col·lisions fail-closed', async () => {
  const { fusionaFrontissa, hashCanonic } = await import(MODULE);
  const base = reg({ legal: entry('a'), versions: entry('b') });
  const added = reg({ ...base.claus, 'node-zero': entry('c') });
  const removed = reg({ versions: entry('b') });
  const r = fusionaFrontissa({base, actual:base, branques:[added,removed], baseSha256:hashCanonic(base)});
  assert.deepEqual(Object.keys(r.registre.claus), ['node-zero','versions']);
  assert.throws(() => fusionaFrontissa({base,actual:reg({...base.claus,'node-zero':entry('d')}),branques:[added],baseSha256:hashCanonic(base)}), /preimatge/i);
  for (const bad of [null, [], reg({x:{...entry('a'),html:-1}}), reg({x:{...entry('a'),data:'2026-02-30'}}), reg({x:{...entry('a'),aprovat_per:''}})]) {
    assert.throws(() => fusionaFrontissa({base:bad, actual:base, branques:[added], baseSha256:hashCanonic(base)}));
  }
  const accessor = reg({});
  Object.defineProperty(accessor.claus, 'legal', { enumerable:true, get() { throw new Error('getter executat'); } });
  assert.throws(() => fusionaFrontissa({base:accessor,actual:base,branques:[added],baseSha256:hashCanonic(base)}), /dades/i);
});

test('R32.21 Frontissa: dry-run sense efectes, apply atòmic, permís preservat i ALREADY byte-fidel', async () => {
  const { executaFusiona, hashCanonic } = await import(MODULE);
  fixture(dir => {
    const base=reg({legal:entry('a'),versions:entry('b')}), branch=reg({...base.claus,legal:entry('c')});
    const target=write(dir,'.agents/contingut_estructural.json',base), baseFile=write(dir,'base.json',base), changeFile=write(dir,'branch.json',branch);
    fs.chmodSync(target, 0o640);
    const before=fs.readFileSync(target), names=fs.readdirSync(path.dirname(target));
    const opts={arrel:dir,base:baseFile,baseSha256:hashCanonic(base),canvis:[changeFile]};
    assert.equal(executaFusiona(opts).status,'READY_TO_APPLY');
    assert.deepEqual(fs.readFileSync(target),before);
    assert.deepEqual(fs.readdirSync(path.dirname(target)),names);
    assert.equal(executaFusiona({...opts,apply:true}).status,'APPLIED');
    assert.equal(fs.statSync(target).mode & 0o777,0o640);
    const applied=fs.readFileSync(target);
    assert.equal(executaFusiona({...opts,apply:true}).status,'ALREADY_APPLIED');
    assert.deepEqual(fs.readFileSync(target),applied);
    assert.deepEqual(fs.readdirSync(path.dirname(target)),names);
  });
});

test('R32.21 Frontissa: UTF8, JSON duplicat, symlink, hardlink, lock i fallada de rename', async () => {
  const { executaFusiona, hashCanonic } = await import(MODULE);
  fixture(dir => {
    const base=reg({legal:entry('a')}), branch=reg({legal:entry('b')});
    const target=write(dir,'.agents/contingut_estructural.json',base), baseFile=write(dir,'base.json',base), changeFile=write(dir,'branch.json',branch);
    const opts={arrel:dir,base:baseFile,baseSha256:hashCanonic(base),canvis:[changeFile],apply:true};
    const original=fs.readFileSync(target);
    fs.writeFileSync(changeFile,'{"schema":"sdp.contingut.v1","claus":{},"claus":{}}');
    assert.throws(() => executaFusiona(opts),/duplicada/i);
    fs.writeFileSync(changeFile,Buffer.from([0xff]));
    assert.throws(() => executaFusiona(opts),/UTF-8/i);
    write(dir,'branch.json',branch);
    fs.renameSync(target,target+'.real'); fs.symlinkSync(target+'.real',target);
    assert.throws(() => executaFusiona(opts),/regular|symlink/i);
    fs.unlinkSync(target); fs.renameSync(target+'.real',target);
    fs.linkSync(target,target+'.alias');
    assert.throws(() => executaFusiona(opts),/enllaç|hardlink/i);
    fs.unlinkSync(target+'.alias');
    write(dir,'.agents/.fusiona-frontissa.lock',{pid:0});
    assert.throws(() => executaFusiona(opts),/lock|bloqueig/i);
    fs.unlinkSync(path.join(dir,'.agents/.fusiona-frontissa.lock'));
    const rename=fs.renameSync;
    fs.renameSync = () => { throw new Error('fallada rename injectada'); };
    try { assert.throws(() => executaFusiona(opts),/rename injectada/); } finally { fs.renameSync=rename; }
    assert.deepEqual(fs.readFileSync(target),original);
    assert.deepEqual(fs.readdirSync(path.dirname(target)),['contingut_estructural.json']);
    const cli=spawnSync(process.execPath,[gate,'--arrel',dir,'--base',baseFile,'--base-sha256',hashCanonic(base),'--canvis',changeFile,'--json'],{encoding:'utf8'});
    assert.equal(cli.status,0,cli.stderr);
    assert.equal(JSON.parse(cli.stdout).status,'READY_TO_APPLY');
    const unknown=spawnSync(process.execPath,[gate,'--inventa'],{encoding:'utf8'});
    assert.notEqual(unknown.status,0);
    assert.doesNotMatch(unknown.stderr,/\n\s+at /);
  });
});

test('R32.21 Frontissa: JSON hostil, objectes congelats i preimatges no tocades completes', async () => {
  const { fusionaFrontissa, hashCanonic, parseJsonFrontissa } = await import(MODULE);
  const base=reg({legal:entry('a'),versions:entry('b')}), branch=reg({...base.claus,legal:entry('c')});
  Object.freeze(base.claus.legal);Object.freeze(base.claus.versions);Object.freeze(base.claus);Object.freeze(base);
  Object.freeze(branch.claus.legal);Object.freeze(branch.claus);Object.freeze(branch);
  assert.equal(fusionaFrontissa({base,actual:base,branques:[branch],baseSha256:hashCanonic(base)}).status,'READY_TO_APPLY');
  for(const actual of [reg({legal:entry('a')}),reg({...base.claus,aliena:entry('f')}),reg({...base.claus,legal:entry('f')})]){
    assert.throws(()=>fusionaFrontissa({base,actual,branques:[branch],baseSha256:hashCanonic(base)}),/preimatge/i);
  }
  for(const text of ['{"x":1,"x":2}','{"__proto__":{}}','{"a":true,}','[1,]','{"a":"\\uQQQQ"}','null trailing','[', '"unterminated']) assert.throws(()=>parseJsonFrontissa(text),text);
  assert.equal(Object.hasOwn(Object.prototype,'polluted'),false);
  assert.throws(()=>parseJsonFrontissa('['.repeat(40)+'0'+']'.repeat(40)),/límit/);
});

test('R32.21 Frontissa: canvi concurrent de la branca o del destí abans de publicar no es trepitja', async()=>{
  const {executaFusiona,hashCanonic}=await import(MODULE);
  for(const victim of ['branca','desti'])fixture(dir=>{
    const base=reg({legal:entry('a'),versions:entry('b')}),branch=reg({...base.claus,legal:entry('c')});
    const target=write(dir,'.agents/contingut_estructural.json',base),baseFile=write(dir,'base.json',base),changeFile=write(dir,'branch.json',branch);
    const before=fs.readFileSync(target),foreign=JSON.stringify(reg({...base.claus,versions:entry('f')}));
    const originalWrite=fs.writeFileSync;let injected=false;
    fs.writeFileSync=(file,data,...rest)=>{
      const result=originalWrite(file,data,...rest);
      if(typeof data==='string'&&data.includes('sdp.contingut.v1')&&!injected){injected=true;originalWrite(victim==='branca'?changeFile:target,foreign);}
      return result;
    };
    try{assert.throws(()=>executaFusiona({arrel:dir,base:baseFile,baseSha256:hashCanonic(base),canvis:[changeFile],apply:true}),/canviada/);}
    finally{fs.writeFileSync=originalWrite;}
    assert.equal(injected,true);
    assert.deepEqual(fs.readFileSync(target),victim==='branca'?before:Buffer.from(foreign));
    assert.deepEqual(fs.readdirSync(path.dirname(target)),['contingut_estructural.json']);
  });
});

test('R32.21 Frontissa: ordre dels camps i del JSON d’entrada no altera els bytes del resultat', async()=>{
  const {fusionaFrontissa,hashCanonic}=await import(MODULE);
  const base=reg({legal:entry('a'),versions:entry('b')}),branch=reg({...base.claus,legal:entry('c')});
  const reverse=registry=>({claus:Object.fromEntries(Object.entries(registry.claus).reverse().map(([key,value])=>[key,Object.fromEntries(Object.entries(value).reverse())])),schema:registry.schema});
  const first=fusionaFrontissa({base,actual:base,branques:[branch],baseSha256:hashCanonic(base)});
  const second=fusionaFrontissa({base:reverse(base),actual:reverse(base),branques:[reverse(branch)],baseSha256:hashCanonic(base)});
  assert.equal(second.targetSha256,first.targetSha256);
  assert.equal(second.text,first.text);
});

test('R32.21 Frontissa: un fitxer que creix després del stat es llig amb un sostre real', async()=>{
  const {executaFusiona,hashCanonic}=await import(MODULE);
  fixture(dir=>{
    const base=reg({legal:entry('a')}),branch=reg({legal:entry('b')});
    const baseFile=write(dir,'base.json',base),changeFile=write(dir,'branch.json',branch);
    write(dir,'.agents/contingut_estructural.json',base);
    const open=fs.openSync,read=fs.readSync,readFile=fs.readFileSync;let watched,unbounded=0,bounded=0;
    // El descriptor conserva la mida inicial. Simulem que el productor ha
    // annexat bytes: readSync ompli tot el rang demanat, sense un fitxer gran.
    fs.openSync=(file,...args)=>{const fd=open(file,...args);if(file===baseFile)watched=fd;return fd;};
    fs.readFileSync=(file,...args)=>{if(file===watched)unbounded++;return readFile(file,...args);};
    fs.readSync=(fd,buffer,offset,length,...args)=>{if(fd===watched){bounded++;assert.ok(length<=2*1024*1024+1);return length;}return read(fd,buffer,offset,length,...args);};
    try{
      assert.throws(()=>executaFusiona({arrel:dir,base:baseFile,baseSha256:hashCanonic(base),canvis:[changeFile]}),/excedix|límit/i);
      assert.equal(unbounded,0);assert.ok(bounded>0);
    }finally{fs.openSync=open;fs.readSync=read;fs.readFileSync=readFile;}
  });
});
