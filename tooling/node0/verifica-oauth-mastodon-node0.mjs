#!/usr/bin/env node
/** Only GET verify_credentials. Never print CredentialAccount/private fields. */
import os from 'node:os';import path from 'node:path';
import {fitxerRegular} from './fitxers-segurs.mjs';
import {peticioMastodont} from './xarxa-node0.mjs';
try{
  if(os.userInfo().username!=='javi'||process.platform!=='darwin')throw Error();
  const file=fitxerRegular(path.join(os.homedir(),'.config/socdepoble/node0.env'));if(file.stat.mode&0o077)throw Error();
  process.loadEnvFile(file.absolute);const token=process.env.MASTODON_ACCESS_TOKEN;
  if(!token||token!==process.env.SDP_MASTODON_ACCESS_TOKEN)throw Error();
  const endpoint='https://mastodont.cat/api/v1/accounts/verify_credentials';
  const response=await peticioMastodont(endpoint,{method:'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error();
  const value=await response.json();
  if(value?.username!=='depoble'||value.acct!=='depoble'||value.url!=='https://mastodont.cat/@depoble'||value.uri!=='https://mastodont.cat/users/depoble'||typeof value.id!=='string')throw Error();
  process.stdout.write(JSON.stringify({verified:true,checkedAt:new Date().toISOString(),method:'GET',endpoint,username:value.username,profileUrl:value.url,actorUri:value.uri,publicationPerformed:false,secretValuesPrinted:false})+'\n');
}catch{process.stderr.write('node0_oauth_preflight_failed\n');process.exitCode=1;}
