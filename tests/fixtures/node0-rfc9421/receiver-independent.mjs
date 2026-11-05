/** Test-only oracle. Does not import signer, formatter or ActivityPub verifier.
 * Time policy below follows pinned Mastodon4.7.5's 1h clock skew and 12h cap;
 * this is not a running upstream Rails receiver or a remote delivery proof. */
import {createHash,createPublicKey,verify} from 'node:crypto';
export function verificaRfc9421Independent({url,method='POST',headers,body,publicKeyPem,keyId,now}){
  try{
    const header=name=>{
      const entries=Object.entries(headers).filter(([key])=>key.toLowerCase()===name);
      return entries.length===1&&typeof entries[0][1]==='string'?entries[0][1]:null;
    };
    const input=header('signature-input'),signature=header('signature'),date=header('date'),type=header('content-type'),digest=header('content-digest');
    const params=/^sig1=\("@method" "@target-uri" "content-digest" "date" "content-type"\);created=(\d+);expires=(\d+);keyid="([^"\\]+)";alg="ed25519"$/.exec(input??'');
    const signed=/^sig1=:([A-Za-z0-9+/]+={0,2}):$/.exec(signature??'');
    if(!params||!signed||params[3]!==keyId||!Number.isFinite(now))return{valida:false};
    const created=Number(params[1]),expires=Number(params[2]);
    if(!Number.isSafeInteger(created)||!Number.isSafeInteger(expires)||expires<=created||created>now/1000+3600||now/1000>Math.min(expires,created+43200)+3600)return{valida:false};
    const target=new URL(url);if(target.protocol!=='https:'||target.hash||target.username||target.password||header('host')!==target.host||!date||type!=='application/activity+json')return{valida:false};
    const bytes=typeof body==='string'?Buffer.from(body):Buffer.from(body);
    if(digest!=='sha-256=:'+createHash('sha256').update(bytes).digest('base64')+':')return{valida:false};
    const base=['"@method": '+method,'"@target-uri": '+target.href,'"content-digest": '+digest,'"date": '+date,'"content-type": '+type,'"@signature-params": '+input.slice('sig1='.length)].join('\n');
    return{valida:verify(null,Buffer.from(base),createPublicKey(publicKeyPem),Buffer.from(signed[1],'base64'))};
  }catch{return{valida:false};}
}
