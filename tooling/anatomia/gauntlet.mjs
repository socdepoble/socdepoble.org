/** Four reproducible rounds; a failed check stops the gauntlet. */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const args=process.argv.slice(2);
const out=resolve(args.includes('--out') ? args[args.indexOf('--out')+1] : '/tmp/sdp-r31-gauntlet');
await mkdir(out,{recursive:true});
const checks=[
 ['eslint','node_modules/.bin/eslint',['src','tooling','scripts','tests','--max-warnings=0']],
 ['design-guard',process.execPath,['tooling/gates/design_guard.mjs']],
 ['vitest','node_modules/.bin/vitest',['run','src/components/patrimoni/PouDeLaNeuAnatomiaCard.test.jsx','src/components/patrimoni/iso','src/sections/disseny/cataleg/manifest.icones.test.js','src/sections/disseny/cataleg/versio.test.js','src/sections/disseny/cataleg/detalls/allLoaders.test.jsx','--exclude','.r30/**','--exclude','.r31/**','--maxWorkers=2']],
 ['geometry',process.execPath,['tooling/anatomia/auditPouNeu.mjs','--quick']]
];
const rounds=[];
for(let round=1;round<=4;round++){
 const results=[];
 console.log(`Round ${round}/4`);
 for(const [name,command,parameters] of checks){
  const started=Date.now();
  const result=await new Promise((done)=>{
   const child=spawn(command,parameters,{cwd:process.cwd(),env:process.env,stdio:['ignore','pipe','pipe']});
   let stdout='',stderr='';
   child.stdout.on('data',(data)=>{stdout+=data;});
   child.stderr.on('data',(data)=>{stderr+=data;});
   child.once('error',(error)=>done({exitCode:null,stdout,stderr:stderr+error.message}));
   child.once('close',(exitCode,signal)=>done({exitCode,signal,stdout,stderr}));
  });
  await writeFile(join(out,`round-${round}-${name}.log`),result.stdout+result.stderr);
  results.push({name,command:[command,...parameters],exitCode:result.exitCode,seconds:(Date.now()-started)/1000});
  console.log(`${name}: ${result.exitCode===0?'PASS':'FAIL'} (${results.at(-1).seconds.toFixed(1)}s)`);
  if(result.exitCode!==0){
   await writeFile(join(out,'gauntlet.json'),JSON.stringify({schema:'sdp-r31-gauntlet/v1',passed:false,rounds:[...rounds,{round,results}]},null,2)+'\n');
   console.error((result.stdout+result.stderr).slice(-6000));process.exit(1);
  }
 }
 rounds.push({round,results});
 await writeFile(join(out,'gauntlet.json'),JSON.stringify({schema:'sdp-r31-gauntlet/v1',passed:round===4,rounds},null,2)+'\n');
}
