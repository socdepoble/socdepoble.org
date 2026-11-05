import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
test('institutional config preserves dotenv bytes and updates only its exact-account target idempotently',()=>{
 const fixture=fileURLToPath(new URL('./fixtures/node0-workspace-config.test.py',import.meta.url)),result=spawnSync('/usr/bin/python3',['-I','-B',fixture],{encoding:'utf8',timeout:15000,maxBuffer:65536});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');assert.deepEqual(JSON.parse(result.stdout),{passed:7,failed:0});
});
