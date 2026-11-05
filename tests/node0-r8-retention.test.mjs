import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('five deterministic scanner, exact authentication and 30 daily plus 12 monthly retention cases',()=>{
 const source=fileURLToPath(new URL('./fixtures/node0-r8-mirror-retention.py',import.meta.url)),r=spawnSync('python3',['-I','-B',source],{encoding:'utf8',timeout:10000,maxBuffer:65536,env:{PATH:process.env.PATH,LANG:'C'}});assert.equal(r.status,0,r.stderr);assert.match(r.stderr,/Ran 5 tests/);assert.match(r.stderr,/\bOK\b/);
});
