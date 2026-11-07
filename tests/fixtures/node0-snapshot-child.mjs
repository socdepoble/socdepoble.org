// SIMULATION ONLY: deliberately fake psql/pg_dump/age semantics, no DB/crypto.
const [role,scenario]=process.argv.slice(2);
process.stderr.write('COUNTER_PRIVATE_STDERR_SENTINEL\n');
if(scenario==='ignore-term')process.on('SIGTERM',()=>{});
const hold=setInterval(()=>{},10000);
const quit=code=>{clearInterval(hold);process.exit(code);};
const cipher=()=>process.stdout.write('age-encryption.org/v1\n'+'F'.repeat(150));
if(role==='capture'){
 let sql='';
 process.stdin.on('data',chunk=>{
  sql+=chunk.toString();
  if(sql.includes('BEGIN ISOLATION')&&!sql.includes('SENT_SIMULATION')){
   sql+='SENT_SIMULATION';
   process.stdout.write(JSON.stringify({protocol:'sdp.node0.snapshot-ledger.v1',database:'socdepoble_node0',serverMajor:17,isolation:'repeatable read',readOnly:true,snapshotId:'00000003-0000001B-1',migrations:80,migrationLedgerSha256:'b'.repeat(64)})+'\n');
   if(scenario==='early-capture-zero')setTimeout(()=>quit(0),5);
   if(scenario==='early-capture-error')setTimeout(()=>quit(7),5);
  }
  if(sql.includes('ROLLBACK;'))quit(scenario==='capture-final-error'?6:0);
 });
}else if(role==='dump'){
 if(scenario==='dump-open-after-eof')setTimeout(()=>process.stdout.end('PGDMP COUNTER_PRIVATE_DUMP_SENTINEL'),80);
 else if(scenario==='age-prefix-zero')setTimeout(()=>{
  process.stdout.on('error',()=>quit(11));process.stdout.write('PGDMP '+ 'D'.repeat(512*1024));
  setTimeout(()=>process.stdout.end('MORE_DATA_AFTER_CONSUMER_EXIT',()=>quit(0)),200);
 },40);
 else if(scenario==='abort-pipe')setTimeout(()=>{process.stdout.write('PGDMP PARTIAL_COUNTER_SENTINEL');setTimeout(()=>process.stdout.end('LATER_DATA',()=>quit(0)),200);},40);
 else if(scenario==='success-fast-close')setTimeout(()=>process.stdout.end('PGDMP COUNTER_PRIVATE_DUMP_SENTINEL',()=>quit(0)),40);
 else if(scenario==='success-delayed-dump-close')setTimeout(()=>{process.stdout.end('PGDMP COUNTER_PRIVATE_DUMP_SENTINEL');setTimeout(()=>quit(0),150);},40);
 else if(scenario!=='ignore-term')setTimeout(()=>{
  process.stdout.end('PGDMP COUNTER_PRIVATE_DUMP_SENTINEL');
  setTimeout(()=>quit(scenario==='dump-late-error'?9:0),scenario==='dump-late-error'?150:10);
 },80);
}else{
 if(scenario==='age-early-zero'){cipher();setTimeout(()=>quit(0),1);}
 else if(scenario==='age-prefix-zero')process.stdin.once('data',()=>{cipher();setTimeout(()=>quit(0),1);});
 else if(scenario==='success-fast-close'){process.stdin.on('data',()=>{});process.stdin.on('end',()=>process.stdout.end('age-encryption.org/v1\n'+'F'.repeat(150),()=>quit(0)));}
 else{
  process.stdin.on('data',()=>{});
  process.stdin.on('end',()=>{if(scenario==='ignore-term')return;cipher();setTimeout(()=>quit(scenario==='age-error'?8:0),5);});
 }
}
