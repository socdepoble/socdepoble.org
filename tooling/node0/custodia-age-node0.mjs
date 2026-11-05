/** Metadata-only gate. No identity bytes, hashes, traversal or deletion. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const fail=code=>{throw new Error(code);};
export function inspeccionaCustodiaAge({homeDir=os.homedir(),lstat=fs.lstatSync}={}){
 if(typeof homeDir!=='string'||!path.isAbsolute(homeDir)||path.normalize(homeDir)!==homeDir||/[\r\n\0\\]/.test(homeDir))fail('custody_home_invalid');
 let current=homeDir;
 try{
  const home=lstat(current);if(!home.isDirectory()||home.isSymbolicLink())throw Error();
  for(const part of['.config','socdepoble']){current=path.join(current,part);const s=lstat(current);if(!s.isDirectory()||s.isSymbolicLink())throw Error();}
  // lstat is deliberate: any leaf, including an unsafe link, blocks closure.
  lstat(path.join(current,'workspace-node0.agekey'));
  return{schema:'sdp.node0.age-custody.v1',metadataChecked:true,legacyLocalIdentityPresent:true,localIdentityAbsenceProven:false,externalCustodyVerified:false,r5CustodyClosed:false,code:'custody_legacy_local_identity_present'};
 }catch(error){
  if(error?.code==='ENOENT')return{schema:'sdp.node0.age-custody.v1',metadataChecked:true,legacyLocalIdentityPresent:false,localIdentityAbsenceProven:true,externalCustodyVerified:false,r5CustodyClosed:false,code:'custody_external_evidence_unproven'};
  return{schema:'sdp.node0.age-custody.v1',metadataChecked:false,legacyLocalIdentityPresent:null,localIdentityAbsenceProven:false,externalCustodyVerified:false,r5CustodyClosed:false,code:'custody_metadata_unproven'};
 }
}
export function exigeixAbsenciaIdentitatLocal(options){
 const observation=inspeccionaCustodiaAge(options);
 if(!observation.localIdentityAbsenceProven)fail(observation.code);
 return observation;
}
// Absence is necessary for production policy, but never evidence of external
// custody. A future separately reviewed external receipt verifier is required.
