import {randomUUID} from 'node:crypto';

export const POLITICA_OUTBOX_NODE0=Object.freeze({maxAttempts:8,batchSize:10,baseDelaySeconds:300,maxDelaySeconds:21600,maxRetryAfterSeconds:86400,leaseSeconds:120});
const ACTOR='https://socdepoble.cat/ap/actors/socdepoble';
const TARGET='https://mastodont.cat/users/depoble/inbox';
const fail=()=>{throw Error('node0_outbox_invalid_dependency');};

/** Retry-After may lengthen the local backoff, never shorten it. */
export function retardOutboxNodeZero(attempt,{retryAfter=null,now=Date.now()}={}){
 if(!Number.isInteger(attempt)||attempt<1||attempt>8||!Number.isFinite(now))fail();
 const policy=POLITICA_OUTBOX_NODE0;
 let remote=0;
 if(typeof retryAfter==='string'&&retryAfter.length<=128){
  if(/^[0-9]{1,10}$/.test(retryAfter))remote=Number(retryAfter);
  else if(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), [0-9]{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} GMT$/.test(retryAfter))remote=Math.max(0,Math.ceil((Date.parse(retryAfter)-now)/1000));
 }
 if(!Number.isFinite(remote))remote=0;
 return Math.max(Math.min(policy.baseDelaySeconds*2**(attempt-1),policy.maxDelaySeconds),Math.min(remote,policy.maxRetryAfterSeconds));
}

/** Derived from durable rows: exhausted jobs stay present and are observable. */
export const SQL_ESTAT_OUTBOX_NODE0=`(SELECT json_build_object(
 'delivered',count(*) FILTER (WHERE delivered_at IS NOT NULL),
 'exhausted',count(*) FILTER (WHERE delivered_at IS NULL AND attempts>=8),
 'blocked',count(*) FILTER (WHERE delivered_at IS NULL AND attempts<8 AND (attempts<0 OR target<>'${TARGET}')),
 'inFlight',count(*) FILTER (WHERE delivered_at IS NULL AND attempts BETWEEN 0 AND 7 AND target='${TARGET}' AND lease_until>now()),
 'waiting',count(*) FILTER (WHERE delivered_at IS NULL AND attempts BETWEEN 0 AND 7 AND target='${TARGET}' AND (lease_until IS NULL OR lease_until<=now()))
 ) FROM node0.outbox)`;

/** Main supplies the existing RFC9421 signer and SQL literal encoder.
 * Claim one job at a time, so batch duration cannot age later jobs' leases.
 * No REST status publishing, new activities or editorial approval are created.
 * Delivery remains at-least-once: a crash after the remote effect can require
 * retrying this same ActivityPub id. No remote fencing/exactly-once is claimed.
 */
export async function drenaOutboxFederadaNodeZero({db,privateKey,request,sign,sqlText,now=Date.now}){
 if(typeof db?.query!=='function'||typeof request!=='function'||typeof sign!=='function'||typeof sqlText!=='function'||typeof now!=='function')fail();
 const policy=POLITICA_OUTBOX_NODE0,owner=randomUUID(),stats={claimed:0,delivered:0,retried:0,exhausted:0,claimLost:0};
 for(let index=0;index<policy.batchSize;index++){
  const jobs=await db.query(`WITH jobs AS (SELECT id,target FROM node0.outbox WHERE target=${sqlText(TARGET)} AND delivered_at IS NULL AND next_attempt<=now() AND attempts BETWEEN 0 AND 7 AND (lease_until IS NULL OR lease_until<=now()) ORDER BY next_attempt,id FOR UPDATE SKIP LOCKED LIMIT 1), claimed AS (UPDATE node0.outbox o SET lease_until=now()+interval '120 seconds',lease_owner=${sqlText(owner)} FROM jobs WHERE o.id=jobs.id AND o.target=jobs.target RETURNING o.id,o.target,o.activity,o.attempts) SELECT coalesce(json_agg(claimed),'[]'::json) FROM claimed;`);
  if(!Array.isArray(jobs)||jobs.length>1)fail();if(jobs.length===0)break;
  const job=jobs[0];if(job.target!==TARGET||!Number.isInteger(job.attempts)||job.attempts<0||job.attempts>=policy.maxAttempts)fail();stats.claimed++;
  const body=JSON.stringify(job.activity);let delivered=false,retryAfter=null;
  try{
   const headers=await sign({metode:'POST',url:TARGET,cos:body,actorId:ACTOR,keyId:ACTOR+'#ed25519',clauPrivada:privateKey,ara:now()});
   // Signing may suspend long enough for another worker to recover this lease.
   // Revalidate and renew immediately before dispatch, never overwrite an
   // expired owner, changed attempt or already-recorded acknowledgement.
   const ready=await db.query(`WITH ready AS (UPDATE node0.outbox SET lease_until=clock_timestamp()+interval '120 seconds' WHERE id=${sqlText(job.id)} AND target=${sqlText(job.target)} AND attempts=${job.attempts} AND delivered_at IS NULL AND lease_owner=${sqlText(owner)} AND lease_until>clock_timestamp() RETURNING id) SELECT json_build_object('updated',(SELECT count(*) FROM ready));`);
   if(ready?.updated!==1){stats.claimLost++;continue;}
   const result=await request(TARGET,{method:'POST',body,headers,timeoutMs:10000});
   delivered=Number.isInteger(result?.status)&&result.status>=200&&result.status<300;
   if(!delivered&&[429,503].includes(result?.status))retryAfter=result.headers?.get?.('retry-after')??null;
  }catch{/* Persist only a bounded retry outcome, never transport diagnostics. */}
  const attempt=job.attempts+1,delay=retardOutboxNodeZero(attempt,{retryAfter,now:now()});
  const updated=await db.query(`WITH updated AS (UPDATE node0.outbox SET attempts=attempts+1,next_attempt=now()+make_interval(secs=>${delay}),delivered_at=${delivered?'now()':'NULL'},lease_until=NULL,lease_owner=NULL WHERE id=${sqlText(job.id)} AND target=${sqlText(job.target)} AND attempts=${job.attempts} AND lease_owner=${sqlText(owner)} RETURNING id) SELECT json_build_object('updated',(SELECT count(*) FROM updated));`);
  if(updated?.updated!==1){stats.claimLost++;continue;}
  if(delivered)stats.delivered++;else if(attempt>=policy.maxAttempts)stats.exhausted++;else stats.retried++;
 }
 return stats;
}
