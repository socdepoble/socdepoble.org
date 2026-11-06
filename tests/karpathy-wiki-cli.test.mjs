import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs,{mkdtempSync,writeFileSync,readFileSync,statSync,existsSync,readdirSync,rmSync,realpathSync,symlinkSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {compilaFitxer} from '../tooling/wiki/compila-karpathy.mjs';
test('CLI entrega paquet privat consumible amb hashes exactes i no sobreescriu',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sdp-karpathy-cli-')),input=join(dir,'fonts.json'),out=join(dir,'wiki');
 try{
 writeFileSync(input,JSON.stringify([{id:'oral',tipus:'memoria-oral',titol:'Testimoni',text:'Al poble parlàvem d’agricultura.'}]));
 const manifest=await compilaFitxer({input,out});
 for(const f of manifest.fitxers)assert.equal(createHash('sha256').update(readFileSync(join(out,f.cami))).digest('hex'),f.sha256);
 assert.equal(statSync(out).mode&0o777,0o700);assert.equal(statSync(join(out,'articles/oral.md')).mode&0o777,0o600);
 await assert.rejects(compilaFitxer({input,out}),/carpeta nova/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('entrada invàlida no crea paquet parcial',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sdp-karpathy-cli-')),input=join(dir,'fonts.json'),out=join(dir,'wiki');
 try{
 writeFileSync(input,'[{"id":"../fora"}]');
 await assert.rejects(compilaFitxer({input,out}));assert.equal(existsSync(out),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('fallada EIO després de dos fitxers no deixa paquet parcial ni reserva',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sdp-karpathy-eio-')),input=join(dir,'fonts.json'),out=join(dir,'wiki');
 const original=fs.writeFileSync;
 try{
  original(input,JSON.stringify([{id:'relat',tipus:'cronica',titol:'Relat',text:'La memòria d’un poble.'}]));
  let escrits=0;
  fs.writeFileSync=(file,...args)=>{if(String(file).includes('.sdp-karpathy-')&&++escrits===3)throw Object.assign(new Error('EIO de prova'),{code:'EIO'});return original(file,...args);};
  syncBuiltinESMExports();
  await assert.rejects(compilaFitxer({input,out}),/EIO/);
  assert.equal(escrits,3);assert.equal(existsSync(out),false);
  assert.deepEqual(readdirSync(dir),['fonts.json']);
  fs.writeFileSync=original;syncBuiltinESMExports();
  const manifest=await compilaFitxer({input,out});assert.ok(manifest.fitxers.length>0);
 }finally{fs.writeFileSync=original;syncBuiltinESMExports();rmSync(dir,{recursive:true,force:true});}
});
test('pare amb àlies simbòlic publica al mateix destí canònic i no duplica carpetes',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sdp-karpathy-alias-'));
 try{
  const alias=join(dir,'alias'),real=join(dir,'real'),input=join(dir,'fonts.json');
  fs.mkdirSync(real);symlinkSync(real,alias);
  writeFileSync(input,JSON.stringify([]));
  await compilaFitxer({input,out:join(alias,'wiki')});
  assert.equal(realpathSync(join(alias,'wiki')),realpathSync(join(real,'wiki')));
  assert.equal(statSync(join(real,'wiki')).mode&0o777,0o700);
  assert.ok(!readdirSync(real).some(n=>n.startsWith('.sdp-karpathy-')));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
