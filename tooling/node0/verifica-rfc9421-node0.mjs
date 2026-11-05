#!/usr/bin/env node
/** Native, offline signature proof with the already installed institutional key.
 * No activity is enqueued, no external request is made, no private key emitted.
 */
import os from 'node:os';
import path from 'node:path';
import {createHash,createPublicKey,verify,webcrypto} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {carregaClaus,actorPublic} from './servidor-node0-soberania.mjs';
import {fitxerRegular} from './fitxers-segurs.mjs';
import {creaPostgres} from './postgres-node0.mjs';
import {signaPeticioHttpMessageActivityPub} from './http-message-signatures-ed25519.mjs';

const ACTOR='https://socdepoble.cat/ap/actors/socdepoble',TARGET='https://mastodont.cat/users/depoble/inbox';
const FINGERPRINT='f6f561a5180e9f3da8c1c6ee8064b5475232e0ce06ba645d02566903ac5e1e11';
export async function verificaRfcNodeZero(envFile=path.join(os.homedir(),'.config/socdepoble/node0.env')){
  const info=fitxerRegular(envFile);if(info.stat.mode&0o077||info.stat.size>32768)throw Error('node0_private_environment_required');
  process.loadEnvFile(info.absolute);
  const keyFile=process.env.SDP_NODE0_KEY_FILE;if(!keyFile)throw Error('node0_existing_identity_required');
  // Refuse absence before the normal key loader: this verifier never creates a key.
  fitxerRegular(keyFile);
  const keys=await carregaClaus(keyFile);if(keys.fingerprint!==FINGERPRINT)throw Error('node0_identity_pin_mismatch');
  const actor=actorPublic(keys),method=actor.assertionMethod?.find(k=>k.id===`${ACTOR}#ed25519`);
  if(!method||method.type!=='Multikey'||method.controller!==ACTOR||!method.publicKeyMultibase.startsWith('z6Mk'))throw Error('node0_multikey_publication_invalid');
  const body='{}',now=Date.now(),headers=await signaPeticioHttpMessageActivityPub({metode:'POST',url:TARGET,cos:body,actorId:ACTOR,keyId:method.id,clauPrivada:keys.privateKey,ara:now,subtle:webcrypto.subtle});
  const input=headers['signature-input'];
  if(!/^sig1=\("@method" "@target-uri" "content-digest" "date" "content-type"\);created=\d+;expires=\d+;keyid="https:\/\/socdepoble\.cat\/ap\/actors\/socdepoble#ed25519";alg="ed25519"$/.test(input))throw Error('node0_signature_profile_invalid');
  const digest=`sha-256=:${createHash('sha256').update(body).digest('base64')}:`;
  if(headers['content-digest']!==digest)throw Error('node0_digest_invalid');
  // Independent base construction and crypto API, not the production formatter.
  const base=['"@method": POST',`"@target-uri": ${TARGET}`,`"content-digest": ${digest}`,`"date": ${headers.date}`,`"content-type": ${headers['content-type']}`,`"@signature-params": ${input.slice(5)}`].join('\n');
  const signature=/^sig1=:([A-Za-z0-9+/=]+):$/.exec(headers.signature)?.[1];
  if(!signature||!verify(null,Buffer.from(base),createPublicKey(keys.publicKeyPem),Buffer.from(signature,'base64')))throw Error('node0_native_signature_invalid');
  const db=creaPostgres();await db.verificaRol();const status=await db.status();
  return {schema:'sdp.node0.rfc9421-native-offline.v1',checkedAt:new Date().toISOString(),fingerprint:keys.fingerprint,signatureProfile:'rfc9421-ed25519',multikeyPublishedInProjection:true,nativeSignatureVerified:true,postgresql:status,noNetworkRequests:true,activitiesEnqueued:0,remoteInteropVerified:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  verificaRfcNodeZero().then(result=>process.stdout.write(JSON.stringify(result)+'\n')).catch(()=>{process.stderr.write('node0_rfc9421_verification_failed\n');process.exitCode=1;});
}
