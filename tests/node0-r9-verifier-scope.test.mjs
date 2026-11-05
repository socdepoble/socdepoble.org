import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const fixture=fileURLToPath(new URL('./fixtures/node0-r9-verifier-scope.py',import.meta.url));
test('R9 verifier: eight portable synthetic scope, dry/apply/repeat/rollback and refusal cases',()=>{
 const python=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3';
 const result=spawnSync(python,['-I','-B',fixture],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024,env:{PATH:'/usr/bin:/bin'}});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');assert.deepEqual(JSON.parse(result.stdout),{passed:8,failed:0,skipped:0});
});
