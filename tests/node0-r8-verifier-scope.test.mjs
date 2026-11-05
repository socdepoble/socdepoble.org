import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {EXTRA_PREIMAGE_PINS_R8,EXISTING_PREIMAGE_PINS_R8} from '../tooling/node0/autoritat-preimatges-r8.mjs';
const fixture=fileURLToPath(new URL('./fixtures/node0-r8-verifier-scope.py',import.meta.url));
test('R8 verifier: seven portable synthetic scope, dry/apply/repeat/rollback and refusal cases',()=>{
 const python=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3';
 const result=spawnSync(python,['-I','-B',fixture],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024,env:{PATH:'/usr/bin:/bin'}});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');assert.deepEqual(JSON.parse(result.stdout),{passed:7,failed:0,skipped:0});
});

test('R10 corrects both R8 translation-test preimage authorities to the Git 0644 mode',()=>{
 const name='tests/enxufe-traduccio.test.mjs';
 for(const pins of [EXTRA_PREIMAGE_PINS_R8,EXISTING_PREIMAGE_PINS_R8]){
  assert.deepEqual(pins[name],{sha256:'9a5c21f97ec5eb82c1879dca3c7b150fda1e42e16a1787a60a181082af44ca90',mode:420});
 }
});
