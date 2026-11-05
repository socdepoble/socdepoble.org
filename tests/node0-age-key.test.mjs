import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const fixture=fileURLToPath(new URL('./fixtures/node0-age-key.test.py',import.meta.url));
test('public age recipient: seven filesystem, CAS, metadata and no-generation cases',()=>{
 const python=process.platform==='darwin'?'/Library/Developer/CommandLineTools/usr/bin/python3':'/usr/bin/python3';
 const result=spawnSync(python,['-I','-B',fixture],{encoding:'utf8',timeout:15000,maxBuffer:1024*1024,env:{PATH:'/usr/bin:/bin'}});
 assert.equal(result.status,0,'public-recipient functional fixture failed');assert.equal(result.stderr,'');
 assert.deepEqual(JSON.parse(result.stdout),{passed:7,failed:0,skipped:0});
});
