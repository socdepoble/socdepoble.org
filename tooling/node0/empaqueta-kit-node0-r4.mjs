#!/usr/bin/env node
/** Additive CAS delivery whose only accepted baseline is the sealed R3 kit. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { validatePath } from '../gates/kit-carril.mjs';
const R3_MANIFEST='cc709422d99a1ed7fc69330810f948fed687d851f12b9ba5fa470ce10a740a60';
const R3_SUMS='9f428d612bfde4d6a83e476d5fde6b2a88557ed78a122d2378130997066a07cf';
const R3_VERIFIER='7cf18ed61180ffb0bbb00d0adb2517fa717b77178d92d9ae03190bce414daf8b';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=code=>{throw new Error(code);};
function inspect(root,name){
  validatePath(name);let cursor=root;
  for(const[at,part]of name.split('/').entries()){
    cursor=path.join(cursor,part);let st;try{st=fs.lstatSync(cursor);}catch(e){if(e.code==='ENOENT')return null;throw e;}
    if(st.isSymbolicLink())fail('source_symlink');
    if(at<name.split('/').length-1){if(!st.isDirectory())fail('source_non_directory');}
    else{if(!st.isFile()||st.nlink!==1||st.size>32*1024*1024)fail('source_non_regular');const data=fs.readFileSync(cursor);return {data,sha256:sha(data),mode:st.mode&0o777};}
  }
}
const state=x=>x?{sha256:x.sha256,mode:x.mode}:null;
function write(root,name,bytes,mode=0o644){validatePath(name);const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes,{flag:'wx',mode});fs.chmodSync(file,mode);}
function inventory(root){
  const output=[];
  const walk=(dir,prefix='')=>{for(const name of fs.readdirSync(dir).sort()){const rel=prefix+name;validatePath(rel);const abs=path.join(dir,name),st=fs.lstatSync(abs);if(st.isDirectory()&&!st.isSymbolicLink())walk(abs,rel+'/');else{const item=inspect(root,rel);if(!item)fail('inventory_disappeared');output.push({path:rel,...item});}}};walk(root);return output;
}
export function empaquetaR4({candidateRoot,baseRoot,r3Root,kitRoot,paths}){
  const candidate=fs.realpathSync(candidateRoot),base=fs.realpathSync(baseRoot),r3=fs.realpathSync(r3Root),parent=fs.realpathSync(path.dirname(kitRoot)),dest=path.join(parent,path.basename(kitRoot));
  if([candidate,base,r3].some(p=>dest===p||dest.startsWith(p+'/')))fail('external_kit_required');
  const pinnedManifest=inspect(r3,'MANIFEST.json');
  if(pinnedManifest?.sha256!==R3_MANIFEST||inspect(r3,'SHA256SUMS')?.sha256!==R3_SUMS)fail('r3_baseline_pin_failed');
  const baselineVerifier=inspect(r3,'verifica_i_aplica.py');
  if(baselineVerifier?.sha256!==R3_VERIFIER)fail('r3_verifier_pin_failed');
  // Execute the checked bytes from stdin, rather than reopening a mutable
  // source pathname after the check. --kit remains explicit for integrity reads.
  const verified=spawnSync('python3',['-','--kit',r3,'--target',base],{input:baselineVerifier.data,encoding:'utf8',maxBuffer:1024*1024});
  let verification;try{verification=JSON.parse(verified.stdout);}catch{fail('r3_baseline_verification_failed');}
  if(verified.status!==0||verification.write!==false||verification.already_applied!==true||verification.files!==38)fail('r3_baseline_verification_failed');
  if(inspect(r3,'MANIFEST.json')?.sha256!==R3_MANIFEST||inspect(r3,'SHA256SUMS')?.sha256!==R3_SUMS||inspect(r3,'verifica_i_aplica.py')?.sha256!==R3_VERIFIER)fail('r3_baseline_changed_during_verification');
  const r3Files=new Map(JSON.parse(pinnedManifest.data.toString('utf8')).files.map(f=>[f.path,f.after]));
  if(!Array.isArray(paths)||!paths.length||new Set(paths.map(x=>String(x).toLowerCase())).size!==paths.length)fail('explicit_unique_paths_required');
  const files=paths.map(validatePath).sort().map(name=>{
    if(!['src/','tests/','tooling/node0/'].some(p=>name.startsWith(p))&&name!=='tooling/tests/node-suite-manifest.json')fail('scope_rejected');
    const before=inspect(base,name),after=inspect(candidate,name);if(!after)fail('candidate_missing');
    if(JSON.stringify(state(before))!==JSON.stringify(r3Files.get(name)??null))fail('r3_preimage_drift');
    if(JSON.stringify(state(before))===JSON.stringify(state(after)))fail('unchanged_payload');
    return {path:name,before,after};
  });
  if(files.some((f,i)=>files.some((g,j)=>i!==j&&g.path.startsWith(f.path+'/'))))fail('overlapping_paths');
  let evidence=[];
  if(fs.existsSync(dest)){
    if(fs.lstatSync(dest).isSymbolicLink()||!fs.statSync(dest).isDirectory()||fs.readdirSync(dest).some(n=>n!=='evidencies'))fail('delivery_already_sealed');
    evidence=inventory(dest);
  }
  const stage=fs.mkdtempSync(path.join(parent,'.node0-r4-stage-'));
  for(const item of evidence)write(stage,item.path,item.data,item.mode);
  const manifest={schema:'sdp.node0.cas.v1',name:'261104_kit_codex_node0_postgres_i_mastodon_r4',baseline:{manifestSha256:R3_MANIFEST,checksumsSha256:R3_SUMS},files:files.map(f=>({path:f.path,before:state(f.before),after:state(f.after)}))};
  const patches=[];
  for(const item of files){
    write(stage,'fitxers/'+item.path,item.after.data,item.after.mode);if(item.before)write(stage,'preimatges/'+item.path,item.before.data,item.before.mode);
    const diff=spawnSync('diff',['-u','--label',item.before?'a/'+item.path:'/dev/null','--label','b/'+item.path,item.before?path.join(stage,'preimatges',item.path):'/dev/null',path.join(stage,'fitxers',item.path)],{encoding:'utf8',maxBuffer:4*1024*1024});
    if(![0,1].includes(diff.status))fail('diff_failed');patches.push(diff.stdout);
  }
  write(stage,'MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');
  write(stage,'pegats/node0.patch',patches.join(''));
  const verifier=inspect(candidate,'tooling/node0/verifica_kit_node0.py');if(verifier?.sha256!==R3_VERIFIER)fail('candidate_verifier_pin_failed');write(stage,'verifica_i_aplica.py',verifier.data,0o755);
  write(stage,'README_INTEGRACIO.md',`# Node 0 · delta CAS R4\n\nAplicar després del kit R3 immutable, en una còpia de revisió autoritzada. Este delta no s’aplica sobre l’arbre viu anterior a R3. Baseline MANIFEST SHA-256: ${R3_MANIFEST}.\n\nConté la correcció del transport TLS (N0-01), la quota per actor verificat de l’inbox (N0-02), mòduls experimentals de sessions locals, RPC privades sota RLS i les proves. Les sessions, el client privat i les escriptures de persones encara no s’activen en producció. No és conformitat completa dels 32 mètodes obligatoris ni dels 126 opcionals.\n\nVerificació sense escriptura: \`python3 verifica_i_aplica.py --target /ruta/absoluta/copia-amb-r3\`. Per aplicar: afegir \`--apply\`. Per preveure/revertir: afegir \`--rollback\`, amb \`--apply\` només per executar. La reversió restaura exclusivament les preimatges de R3; no desfà serveis remots ni dades SQL. CAS, mode, symlinks, locks i rollback capturat es comproven per l’aplicador; no és una transacció davant SIGKILL o tall elèctric.\n\nEl laboratori PostgreSQL és exclusivament \`node0_gauntlet_r4\`; les persones de prova no entren en \`socdepoble_node0\`. El registre sense transport de correu retorna 503 abans de crear una persona. Cal consentiment amb versió explícita, confirmació real per correu, ingress de proxy autenticat, sessió HttpOnly i canvis UI abans d’activar-lo. El helper de transport privat no està connectat a l’adaptador públic. OAuth/MFA/Storage/Realtime no estan implementats per este delta. Cap secret forma part del kit.\n\nPermisos i barreres de revocació segueixen [SET ROLE PostgreSQL 17](https://www.postgresql.org/docs/17/sql-set-role.html) i [row locks PostgreSQL 17](https://www.postgresql.org/docs/17/explicit-locking.html). Les evidències especifiquen quines proves són natives, WASM o de transport.\n`);
  fs.appendFileSync(path.join(stage,'README_INTEGRACIO.md'),'\nAbans del delta, executa també el verificador del kit R3 original: `python3 /ruta/kit-r3/verifica_i_aplica.py --target /ruta/absoluta/copia-amb-r3`. Ha de confirmar les 38 postimatges. El camp baseline del manifest R4 és una referència documental: el generador comprova la base completa en construir, però l’aplicador universal R4 només exigix CAS sobre els fitxers inclosos en este delta. No certifica les altres postimatges de R3 ni un arbre complet sense canvis.\n');
  fs.appendFileSync(path.join(stage,'README_INTEGRACIO.md'),'\nArquitectura corregida: `main.jsx` importa `src/data/node0/arrencadaNodeZero.js`, que usa el mecanisme existent `injectaBackendDelPaquet`. `backendPort.js` restaura els bytes anteriors a R3 i la seua llista tancada d’exports. Les implementacions canòniques són en `src/data/node0/`; els tres camins de `src/data/local/` són reexports compatibles.\n\nActivityPub d’eixida continua pendent: la recerca del codi oficial de Mastodon 4.7.5 indica que el perfil Ed25519 amb hs2019 antic no és interoperable; cal RFC9421 i una publicació de clau coherent. És una inferència del codi, sense entrega remota real. La prova criptogràfica local no acredita interoperabilitat. La correcció es prepara en R5; no activeu publicacions de prova amb este delta.\n');
  write(stage,'SHA256SUMS',inventory(stage).map(f=>`${f.sha256}  ${f.path}\n`).join(''));
  for(const item of files)for(const[root,key]of[[base,'before'],[candidate,'after']])if(JSON.stringify(state(inspect(root,item.path)))!==JSON.stringify(state(item[key])))fail('source_changed_during_package');
  if(fs.existsSync(dest)){
    if(fs.readdirSync(dest).some(n=>n!=='evidencies'))fail('delivery_changed_during_package');
    const current=inventory(dest).map(f=>({path:f.path,...state(f)}));
    if(JSON.stringify(current)!==JSON.stringify(evidence.map(f=>({path:f.path,...state(f)}))))fail('evidence_changed_during_package');
    for(const item of inventory(stage))if(!item.path.startsWith('evidencies/')&&item.path!=='SHA256SUMS')write(dest,item.path,item.data,item.mode);
    write(dest,'SHA256SUMS',fs.readFileSync(path.join(stage,'SHA256SUMS')));
  }else fs.renameSync(stage,dest);
  return {kit:dest,files:files.length,manifestSha256:sha(fs.readFileSync(path.join(dest,'MANIFEST.json'))),checksumsSha256:sha(fs.readFileSync(path.join(dest,'SHA256SUMS')))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const options={};const keys={'--candidate':'candidateRoot','--base':'baseRoot','--r3':'r3Root','--kit':'kitRoot','--paths-file':'pathsFile'};
  try{const args=process.argv.slice(2);for(let i=0;i<args.length;i+=2){if(!keys[args[i]]||!args[i+1])fail('invalid_cli');options[keys[args[i]]]=args[i+1];}options.paths=JSON.parse(fs.readFileSync(options.pathsFile,'utf8'));process.stdout.write(JSON.stringify(empaquetaR4(options))+'\n');}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
}
