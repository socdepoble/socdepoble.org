import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MODULE=new URL('../../tooling/gates/tractor-paritat-skills.mjs',import.meta.url);
const gate=fileURLToPath(MODULE);
const body=(id,core=false)=>`---\nname: ${id}\ntype: skill\nstatus: actiu\ncore: ${core}\ndescription: Skill de prova amb descripcio estable.\ntriggers_on:\n  - prova\n---\n# ${id}\n`;
const entry=id=>({name:id,path:`.agents/skills/${id}/SKILL.md`,description:'Skill de prova amb descripcio estable.',triggers_on:['prova']});
const fixture=fn=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r3221-skills-'));
  for(const [id,core] of [['core-a',true],['plugin-b',false]]){
    fs.mkdirSync(path.join(root,'.agents/skills',id),{recursive:true});
    fs.writeFileSync(path.join(root,'.agents/skills',id,'SKILL.md'),body(id,core));
    fs.mkdirSync(path.join(root,'.claude/skills'),{recursive:true});
    fs.symlinkSync(path.join('../../.agents/skills',id),path.join(root,'.claude/skills',id));
  }
  fs.writeFileSync(path.join(root,'.agents/skills_index.json'),JSON.stringify({schema:'sdp.skills_index.v1',core:[entry('core-a')],plugins:{'plugin-b':entry('plugin-b')}}));
  try{return fn(root);}finally{fs.rmSync(root,{recursive:true,force:true});}
};
const snapshot=root=>{
  const acc=[];
  const walk=dir=>{for(const name of fs.readdirSync(dir).sort()){const p=path.join(dir,name),s=fs.lstatSync(p);acc.push([path.relative(root,p),s.mode,s.isSymbolicLink()?fs.readlinkSync(p):s.isFile()?fs.readFileSync(p).toString('base64'):'dir']);if(s.isDirectory())walk(p);}};
  walk(root);return acc;
};

test('R32.21 skills: coherent core/plugins i mirall de symlinks, estrictament read-only', async()=>{
  const {auditaParitatSkills}=await import(MODULE);
  fixture(root=>{
    const before=snapshot(root),r=auditaParitatSkills(root);
    assert.equal(r.valid,true,JSON.stringify(r));
    assert.equal(r.skills,2);assert.equal(r.indexades,2);assert.deepEqual(r.pendentsPromocio,[]);
    assert.deepEqual(snapshot(root),before);
    fs.rmSync(path.join(root,'.claude/skills'),{recursive:true});
    fs.symlinkSync('../.agents/skills',path.join(root,'.claude/skills'));
    assert.equal(auditaParitatSkills(root).valid,true);
  });
});

test('R32.21 skills: detecta mirror absent, trencat, estranger, còpia i orfe', async()=>{
  const {auditaParitatSkills}=await import(MODULE);
  for(const variant of ['absent','broken','foreign','copy','orphan'])fixture(root=>{
    const mirror=path.join(root,'.claude/skills/plugin-b');
    if(variant==='orphan')fs.symlinkSync('../../.agents/skills/core-a',path.join(root,'.claude/skills/orfe'));
    else{
      fs.unlinkSync(mirror);
      if(variant==='broken')fs.symlinkSync('missing',mirror);
      if(variant==='foreign')fs.symlinkSync('../../.agents/skills/core-a',mirror);
      if(variant==='copy'){fs.mkdirSync(mirror);fs.writeFileSync(path.join(mirror,'SKILL.md'),body('plugin-b'));}
    }
    const before=snapshot(root),r=auditaParitatSkills(root);
    assert.equal(r.valid,false,variant);assert.ok(r.errors.length,variant);assert.deepEqual(snapshot(root),before);
  });
});

test('R32.21 skills: índex orfe/duplicat/descripció/ruta i font invàlida fallen tancats', async()=>{
  const {auditaParitatSkills}=await import(MODULE);
  for(const variant of ['orphan','duplicate','metadata','traversal','bad-yaml','source-link'])fixture(root=>{
    const file=path.join(root,'.agents/skills_index.json'),index=JSON.parse(fs.readFileSync(file));
    if(variant==='orphan')index.plugins.orfe=entry('orfe');
    if(variant==='duplicate')index.plugins['core-a']=entry('core-a');
    if(variant==='metadata')index.plugins['plugin-b'].description='Divergent';
    if(variant==='traversal')index.plugins['plugin-b'].path='../plugin-b/SKILL.md';
    if(variant==='bad-yaml')fs.writeFileSync(path.join(root,'.agents/skills/plugin-b/SKILL.md'),'---\nname: plugin-b\nname: repetit\n---\n');
    if(variant==='source-link'){const p=path.join(root,'.agents/skills/plugin-b/SKILL.md');fs.renameSync(p,p+'.real');fs.symlinkSync('SKILL.md.real',p);}
    fs.writeFileSync(file,JSON.stringify(index));
    assert.equal(auditaParitatSkills(root).valid,false,variant);
  });
});

test('R32.21 skills: extern explícit sense HOME detecta promocions i divergències sense instal·lar', async()=>{
  const {auditaParitatSkills}=await import(MODULE);
  fixture(root=>{
    const external=path.join(root,'external');fs.mkdirSync(path.join(external,'nova'),{recursive:true});
    fs.writeFileSync(path.join(external,'nova/SKILL.md'),body('nova').replace('---\n# nova','metadata:\n  version: "42"\n  tool_count: 207\n---\n# nova'));
    fs.mkdirSync(path.join(external,'plugin-b'));fs.writeFileSync(path.join(external,'plugin-b/SKILL.md'),body('plugin-b')+'diferent\n');
    const before=snapshot(root),r=auditaParitatSkills(root,{extern:external});
    assert.equal(r.valid,false);assert.deepEqual(r.pendentsPromocio,['nova']);assert.ok(r.errors.some(e=>e.code==='EXTERN_DIVERGENT'));
    assert.deepEqual(snapshot(root),before);
    const cli=spawnSync(process.execPath,[gate,'--arrel',root,'--extern',external,'--json'],{encoding:'utf8',env:{PATH:process.env.PATH,HOME:'/not-consulted'}});
    assert.equal(cli.status,1,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout).pendentsPromocio,['nova']);
    const missing=auditaParitatSkills(root,{extern:path.join(root,'missing')});assert.equal(missing.valid,false);
    const unknown=spawnSync(process.execPath,[gate,'--inventa'],{encoding:'utf8'});assert.notEqual(unknown.status,0);assert.doesNotMatch(unknown.stderr,/\n\s+at /);
  });
});

test('R32.21 skills: SKILL.md requerix capitalització física exacta també en un FS insensible', async()=>{
  const {auditaParitatSkills}=await import(MODULE);
  fixture(root=>{
    const canonical=path.join(root,'.agents/skills/plugin-b/SKILL.md'),wrong=path.join(root,'.agents/skills/plugin-b/skill.md');
    fs.renameSync(canonical,wrong);
    // Simula de forma portable la resolució insensible d'APFS: el nom demanat
    // s'obri, però la llista física del pare conserva la minúscula incorrecta.
    const lstat=fs.lstatSync,open=fs.openSync,map=file=>file===canonical?wrong:file;
    fs.lstatSync=(file,...args)=>lstat(map(file),...args);
    fs.openSync=(file,...args)=>open(map(file),...args);
    try{const r=auditaParitatSkills(root);assert.equal(r.valid,false,JSON.stringify(r));assert.ok(r.errors.some(e=>e.code==='FONT_INVALIDA'));}
    finally{fs.lstatSync=lstat;fs.openSync=open;}
  });
});

test('R32.21 skills: creixement concurrent de l’índex no provoca una lectura sense sostre', async()=>{
  const {auditaParitatSkills}=await import(MODULE);
  fixture(root=>{
    const index=fs.realpathSync(path.join(root,'.agents/skills_index.json'));
    const open=fs.openSync,read=fs.readSync,readFile=fs.readFileSync;let watched,unbounded=0,bounded=0;
    fs.openSync=(file,...args)=>{const fd=open(file,...args);if(file===index)watched=fd;return fd;};
    fs.readFileSync=(file,...args)=>{if(file===watched)unbounded++;return readFile(file,...args);};
    fs.readSync=(fd,buffer,offset,length,...args)=>{if(fd===watched){bounded++;assert.ok(length<=1024*1024+1);return length;}return read(fd,buffer,offset,length,...args);};
    try{
      const result=auditaParitatSkills(root);assert.equal(result.valid,false);assert.ok(result.errors.some(e=>e.code==='INDEX_INVALID'&&/gran|límit|excedix/i.test(e.message)));
      assert.equal(unbounded,0);assert.ok(bounded>0);
    }finally{fs.openSync=open;fs.readSync=read;fs.readFileSync=readFile;}
  });
});
