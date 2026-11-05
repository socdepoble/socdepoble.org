/** Read an explicitly pinned ZIP, or rebuild the exact canonical release from
 * its versioned public snapshot. Regeneration stays in memory and off network.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fitxerRegular} from './fitxers-segurs.mjs';

const CANONICAL='public/opendata/dades-obertes-la-torre-de-les-macanes-20261103.zip';
const CANONICAL_SHA='fb1611627c2cd2e23defe38f04d9dd58ed7cdc2a95766d5c5fc381f500a651be';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function checked(bytes,expected){
  const result=Buffer.from(bytes);
  if(sha(result)!==expected)throw new Error('node0_zip_hash_mismatch');
  return result;
}

export async function llegeixZipNodeZero({root,zip=CANONICAL,sha256Esperat}={}){
  if(typeof root!=='string'||!path.isAbsolute(root)||typeof zip!=='string'||!zip||zip.includes('\0'))throw new TypeError('node0_zip_path_required');
  if(typeof sha256Esperat!=='string'||!/^[a-f0-9]{64}$/.test(sha256Esperat))throw new TypeError('node0_zip_expected_hash_required');
  const file=path.resolve(root,zip),canonical=path.resolve(root,CANONICAL);
  let missing;
  try{
    // lstat first distinguishes a truly absent artifact from a broken symlink.
    const entry=fs.lstatSync(file);
    if(entry.isSymbolicLink()||!entry.isFile()||entry.nlink!==1)throw new Error('node0_zip_nonregular');
    const regular=fitxerRegular(file);
    if(regular.stat.size>32*1024*1024)throw new Error('node0_zip_size_limit');
    return checked(fs.readFileSync(regular.absolute),sha256Esperat);
  }catch(error){
    if(error.code!=='ENOENT')throw error;
    missing=error;
  }
  if(file!==canonical||sha256Esperat!==CANONICAL_SHA)throw missing;
  const snapshotFile=fitxerRegular(path.resolve(root,'public/opendata/snapshot-public.json'));
  if(snapshotFile.stat.size>4*1024*1024)throw new Error('node0_snapshot_size_limit');
  let snapshot;
  try{snapshot=JSON.parse(fs.readFileSync(snapshotFile.absolute,'utf8'));}
  catch{throw new Error('node0_snapshot_invalid');}
  // The deployed native bundle already has the verified ZIP and need not ship
  // the repository's publication generator. Only a complete clean clone rebuilds.
  const {generaOpenData}=await import('../seo/genera-opendata.mjs');
  const {paquet}=await generaOpenData({snapshot,escriu:false,fetchImpl:()=>{throw new Error('node0_snapshot_network_forbidden');}});
  return checked(paquet.zip,CANONICAL_SHA);
}
