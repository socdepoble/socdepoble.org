import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import fotosParroquiaPrivades from './fotos-parroquia-privades.mjs';

test('publicDir photos cannot bypass Rollup emission checks and originals are preserved',()=>{
 const parent=path.resolve('node_modules/.cache/r15_2');fs.mkdirSync(parent,{recursive:true});
 const root=fs.mkdtempSync(path.join(parent,'photo-guard-'));
 const fotos=path.join(root,'public/assets/uploads/tpv-parroquia');
 const previous=process.env.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA;
 delete process.env.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA;
 try {
  fs.mkdirSync(fotos,{recursive:true});
  const plugin=fotosParroquiaPrivades();
  plugin.config({root,envDir:false},{mode:'production',command:'build'});
  plugin.configResolved({root,publicDir:path.join(root,'public'),env:{DEV:false}});
  const context={error(message){throw new Error(message);}};
  assert.doesNotThrow(()=>plugin.buildStart.call(context));
  fs.writeFileSync(path.join(fotos,'nom-arbitrari.jpg'),'private original');
  assert.throws(()=>plugin.buildStart.call(context),/tpv-parroquia/);
  assert.equal(fs.readFileSync(path.join(fotos,'nom-arbitrari.jpg'),'utf8'),'private original');
  assert.throws(()=>plugin.generateBundle.call(context,{}, {['assets/p-'+ 'a'.repeat(64)+'-hash.webp']:{}}),/fotos originals/);
 } finally { if(previous===undefined)delete process.env.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA;else process.env.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA=previous;fs.rmSync(root,{recursive:true,force:true}); }
});
