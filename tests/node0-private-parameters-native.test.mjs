/** Native local LAB only; values are disposable canaries, never credentials.
 * Reads only a bounded newly-appended log range; never prints any log content.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {creaPostgres,sqlText,sqlJson} from '../tooling/node0/postgres-node0.mjs';
const LAB='node0_gauntlet_r4',SOCKET='/Users/javi/socdepoble-node0/dades/run/postgres17',PSQL='/Users/javi/local/postgres17/Postgres.app/Contents/Versions/17/bin/psql';
const LOG='/Users/javi/local/postgres17/postgres17.stderr.log';
const enabled=process.env.SDP_NODE0_NATIVE_LAB==='1';
function guard(env){
  if(env.SDP_NODE0_NATIVE_LAB!=='1'||env.PGDATABASE!==LAB||env.PGUSER!=='javi'||env.PGHOST!==SOCKET||env.PGPORT!==undefined&&env.PGPORT!=='5432'||env.NODE0_PSQL!==undefined&&env.NODE0_PSQL!==PSQL)throw Error('node0_private_native_lab_required');
  for(const key of['PGPASSWORD','PGOPTIONS','PGSERVICE','PGSERVICEFILE','PGHOSTADDR'])if(Object.hasOwn(env,key))throw Error('node0_private_native_override_rejected');
}
test('private parameter native proof refuses production and ambiguous environment before connecting',()=>{
  const safe={SDP_NODE0_NATIVE_LAB:'1',PGDATABASE:LAB,PGUSER:'javi',PGHOST:SOCKET};guard(safe);
  for(const patch of[{PGDATABASE:'socdepoble_node0'},{PGUSER:'node0_authenticator'},{PGHOST:'/tmp'},{PGOPTIONS:'x'},{PGPASSWORD:'x'},{SDP_NODE0_NATIVE_LAB:'0'}])assert.throws(()=>guard({...safe,...patch}));
});
test('native extended Bind preserves values, hides private errors and exposes no values in pg_stat_activity',
  {skip:enabled?false:'Explicit dedicated native LAB connection required',timeout:30000},async t=>{
    guard(process.env);
    const env={PATH:'/usr/bin:/bin',LANG:'C',PGDATABASE:LAB,PGHOST:SOCKET,PGPORT:'5432',NODE0_PSQL:PSQL,PGPASSFILE:'/dev/null',PGUSER:'javi'};
    const operator=creaPostgres({env});const app='node0-r6-private-'+randomUUID();
    const db=creaPostgres({env:{...env,PGUSER:'node0_authenticator',PGAPPNAME:app}});
    assert.equal(await db.verificaRolAutenticador(),true);
    const counts=()=>operator.query("SELECT jsonb_build_object('users',(SELECT count(*) FROM auth.users),'sessions',(SELECT count(*) FROM private.node0_sessions));");
    const before=await counts();
    const canary="\ufeffLAB_CANARY_"+randomUUID()+"_'\\\n😀";
    assert.deepEqual(await db.query(`SELECT jsonb_build_object('canary',${sqlText(canary)});`),{canary});
    let fd;
    const appended=offset=>{
      const info=fs.fstatSync(fd),size=info.size-offset;if(size<0||size>2*1024*1024)throw Error('node0_native_log_range_invalid');
      const bytes=Buffer.alloc(size);fs.readSync(fd,bytes,0,size,offset);return bytes.toString('utf8');
    };
    try{
      fd=fs.openSync(LOG,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);const info=fs.fstatSync(fd);assert.ok(info.isFile()&&info.nlink===1);
      const start=info.size;
      // Reproduce R5's literal transport with synthetic data under the operator
      // logging policy. No auth account or business row is ever written.
      await assert.rejects(operator.query(`SELECT ${sqlText(canary)} AS synthetic_private_value,1/0;`),error=>error.sqlState==='22012');
      let legacy='';for(let i=0;i<30;i++){legacy=appended(start);if(legacy.includes(Buffer.from(canary).toString('base64')))break;await new Promise(r=>setTimeout(r,10));}
      assert.ok(legacy.includes(Buffer.from(canary).toString('base64')),'native log must actually reproduce the R5 encoded-literal leak');
      const privateStart=fs.fstatSync(fd).size;
      await assert.rejects(db.query(`SELECT ${sqlText(canary)} AS synthetic_private_value,1/0;`),error=>error.sqlState==='22012'&&error.message==='node0_database_query_failed'&&!JSON.stringify(error).includes(canary));
      await new Promise(r=>setTimeout(r,30));
      const privateRange=appended(privateStart);
      for(const value of[canary,Buffer.from(canary).toString('base64'),Buffer.from(JSON.stringify([canary])).toString('base64')])assert.equal(privateRange.includes(value),false,'new private error logs must contain no canary representation');
      const pending=db.query(`BEGIN; DO $pause$ BEGIN PERFORM ${sqlText(canary)}; PERFORM pg_sleep(0.5); END $pause$; SELECT ${sqlJson({canary})}; COMMIT;`);
      let observed=false;
      for(let i=0;i<50;i++){
        const rows=await operator.query(`SELECT coalesce(jsonb_agg(query),'[]'::jsonb) FROM pg_stat_activity WHERE application_name=${sqlText(app)} AND state='active';`);
        for(const query of rows)if(query.includes('pg_sleep')){
          observed=true;assert.ok(query.includes('node0.private_parameters'));assert.equal(query.includes(canary),false);assert.equal(query.includes(Buffer.from(canary).toString('base64')),false);
        }
        if(observed)break;await new Promise(r=>setTimeout(r,5));
      }
      assert.deepEqual(await pending,{canary});assert.equal(observed,true,'observe the real bound private DO statement, not an empty activity snapshot');
      assert.deepEqual(await counts(),before);
      t.diagnostic('Native LAB: legacy encoded-literal leak reproduced; extended Bind roundtrip and private log policy verified; real pg_stat_activity inspected without values; zero account/session/business writes.');
    }finally{if(fd!==undefined)fs.closeSync(fd);}
  });
