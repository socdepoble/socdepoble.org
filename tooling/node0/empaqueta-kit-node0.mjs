#!/usr/bin/env node
/** Builds the requested self-contained CAS layout. Never applies to the live tree. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { validatePath } from '../gates/kit-carril.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = code => { throw new Error(code); };
function rootDirectory(value) { const root = fs.realpathSync(value); if (!fs.statSync(root).isDirectory()) fail('root_not_directory'); return root; }
function inspect(root, name) {
  validatePath(name); let node = root; const parts = name.split('/');
  for (let i=0;i<parts.length;i++) {
    node = path.join(node,parts[i]); let st;
    try { st=fs.lstatSync(node); } catch(e) { if(e.code==='ENOENT')return null; throw e; }
    if (st.isSymbolicLink()) fail(`symlink:${name}`);
    if (i<parts.length-1) { if(!st.isDirectory())fail(`non_directory:${name}`); }
    else { if(!st.isFile()||st.nlink!==1||st.size>32*1024*1024)fail(`non_regular_file:${name}`); const data=fs.readFileSync(node);return {data,sha256:hash(data),mode:st.mode&0o777}; }
  }
  return null;
}
function write(root,name,data,mode=0o644) {
  const to=path.join(root,name);fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,data,{flag:'wx',mode});fs.chmodSync(to,mode);
}
const expectedState = value => value ? {sha256:value.sha256,mode:value.mode} : null;
function readme(manifest) {
  return `# Kit CAS Node 0 PostgreSQL i Mastodon\n\nEntrega per a Claude, integrador de l’arbre viu. Estat: candidat revisable, no integra ni desplega automàticament.\n\n- Esquema: \`${manifest.schema}\`; ${manifest.files.length} fitxers.\n- Tot el payload és dins \`fitxers/\`; les preimatges, dins \`preimatges/\`; el diff orientatiu és \`pegats/node0.patch\`.\n- \`MANIFEST.json\` fixa SHA-256 i mode abans/després. \`SHA256SUMS\` cobreix manifest, aplicador, README, pegat i payload. Contrasta el seu hash amb l’informe independent: el SHA comprova integritat, no autoria.\n\n## Verificar i aplicar\n\nExecuta només contra una còpia de revisió autoritzada i després del Reflex que corresponga al teu carril:\n\n\`\`\`sh\npython3 verifica_i_aplica.py --target /ruta/absoluta/copia-revisio\npython3 verifica_i_aplica.py --target /ruta/absoluta/copia-revisio --apply\npython3 verifica_i_aplica.py --target /ruta/absoluta/copia-revisio --rollback\npython3 verifica_i_aplica.py --target /ruta/absoluta/copia-revisio --rollback --apply\n\`\`\`\n\nSense \`--apply\` no s’escriu res al destí. Un kit aplicat completament és idempotent; un arbre mixt, una preimatge divergent, un hardlink, un symlink o un lock existent es rebutgen. L’aplicador només admet src/, tests/ i tooling/node0/, mai secrets ni .git.\n\nLa mutació té preflight global, lock cooperatiu i replace atòmic per fitxer, amb rollback dels errors capturables. No és una transacció del sistema de fitxers davant SIGKILL/tall elèctric i el lock no bloqueja editors aliens. Si hi ha drift durant la recuperació, l’aplicador refusa trepitjar-lo i marca recovery_required.\n\n## Activació del client\n\nEl client no canvia de backend per hostname. Una entrada pròpia del paquet, abans d’arrenca(), ha de fixar la capa vigent (backendId=sdp-node0-http, supabaseUrl com àlies canònic de backendUrl, tenantId i dataMode=remote) i esperar \`injectaNodeZeroHttp({endpoint:'https://socdepoble.cat/api/v1/node0',tenantId})\`, exportat pel port neutral. El servidor conserva els secrets; el client només té lectura pública. Auth, escriptures i xat d’usuari rebutgen sense fallback mentre no hi haja una sessió Node 0 real. No és conformitat completa dels 126 mètodes.\n\n## Desplegament i comprovació\n\nConsulta tooling/node0/ i l’informe d’aquesta onada per a les proves i els límits. Instal·lar PostgreSQL, aplicar migracions, configurar Caddy/launchd i publicar a Mastodon són operacions explícites del carril Node 0; aplicar este kit al codi no les executa. Cap token OAuth, clau privada ni contrasenya forma part del kit.\n`;
}
export function empaquetaKitNodeZero({candidateRoot,baseRoot,kitRoot,paths,expectedBackendPortSha,additionalExpectedPreimages={}}) {
  const candidate=rootDirectory(candidateRoot),base=rootDirectory(baseRoot),parent=rootDirectory(path.dirname(path.resolve(kitRoot)));
  const dest=path.join(parent,path.basename(kitRoot));
  const existing=fs.existsSync(dest);
  const evidence=[];
  if(existing){
    const st=fs.lstatSync(dest);if(!st.isDirectory()||st.isSymbolicLink())fail('kit_root_not_regular');
    if(fs.readdirSync(dest).some(name=>name!=='evidencies'))fail('kit_already_exists');
    function scan(dir,prefix='evidencies'){
      const info=fs.lstatSync(dir);if(info.isSymbolicLink()||!info.isDirectory())fail('evidence_directory_invalid');
      for(const name of fs.readdirSync(dir).sort()){const rel=`${prefix}/${name}`,absolute=path.join(dir,name),stat=fs.lstatSync(absolute);validatePath(rel);if(stat.isDirectory()&&!stat.isSymbolicLink())scan(absolute,rel);else{const value=inspect(dest,rel);if(!value)fail('evidence_disappeared');evidence.push({path:rel,...value});}}
    }
    if(fs.existsSync(path.join(dest,'evidencies')))scan(path.join(dest,'evidencies'));
  }
  if([candidate,base].some(root=>dest===root||dest.startsWith(root+path.sep)))fail('kit_must_be_external');
  if(!Array.isArray(paths)||!paths.length||!expectedBackendPortSha||!/^[a-f0-9]{64}$/.test(expectedBackendPortSha))fail('explicit_paths_and_baseline_required');
  const expected={'src/data/backendPort.js':expectedBackendPortSha};
  for(const[name,digest]of Object.entries(additionalExpectedPreimages)){if(!['tooling/tests/node-suite-manifest.json','src/main.jsx'].includes(name)||!/^[a-f0-9]{64}$/.test(digest))fail('additional_preimage_rejected');expected[name]=digest;}
  const names=paths.map(validatePath).sort();const seen=new Set();
  const files=names.map(name=>{
    if(!['src/','tests/','tooling/node0/'].some(prefix=>name.startsWith(prefix))&&name!=='tooling/tests/node-suite-manifest.json')fail('scope_rejected');
    const key=name.toLowerCase();if(seen.has(key)||[...seen].some(p=>key.startsWith(p+'/')||p.startsWith(key+'/')))fail('duplicate_or_overlapping_paths');seen.add(key);
    const before=inspect(base,name),after=inspect(candidate,name);if(!after)fail(`candidate_absent:${name}`);
    if(Object.hasOwn(expected,name)){
      if(before?.sha256!==expected[name])fail(name==='src/data/backendPort.js'?'backend_port_baseline_drift':`existing_preimage_drift:${name}`);
      // All three authorized existing text files are 0644 in the initial
      // live/Gemini snapshots. A later chmod is drift, not a new baseline.
      if(before.mode!==0o644)fail(`existing_preimage_mode_drift:${name}`);
    }
    else if(before)fail(`new_path_already_exists:${name}`);
    if(before?.sha256===after.sha256&&before.mode===after.mode)fail(`unchanged_path:${name}`);
    return {path:name,before:expectedState(before),after:expectedState(after),beforeData:before,afterData:after};
  });
  if(!names.includes('src/data/backendPort.js'))fail('backend_port_required');
  const verifier=inspect(candidate,'tooling/node0/verifica_kit_node0.py');if(!verifier)fail('verifier_absent');
  const stage=fs.mkdtempSync(path.join(parent,'.node0-kit-stage-'));
  // Failed builds keep their staging directory for inspection; no destructive cleanup.
  const manifest={schema:'sdp.node0.cas.v1',name:'261104_kit_codex_node0_postgres_i_mastodon',files:files.map(({path,before,after})=>({path,before,after}))};
  for(const item of evidence)write(stage,item.path,item.data,item.mode);
  for(const item of files){write(stage,`fitxers/${item.path}`,item.afterData.data,item.afterData.mode);if(item.beforeData)write(stage,`preimatges/${item.path}`,item.beforeData.data,item.beforeData.mode);}
  write(stage,'MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');write(stage,'verifica_i_aplica.py',verifier.data,0o755);
  write(stage,'README_INTEGRACIO.md',readme(manifest)
    .replace('L’aplicador només admet src/, tests/ i tooling/node0/, mai secrets ni .git.', 'L’aplicador admet src/, tests/ i tooling/node0/, amb l’excepció exacta tooling/tests/node-suite-manifest.json per registrar les proves. Mai admet secrets ni .git.')
    .replace('## Activació del client', '## Activació del client\n\nEl main.jsx inclòs activa el backend exclusivament amb VITE_SDP_NODE0_HTTP=1 en compilar. Espera arrencadaNodeZero abans de configura(), i el segell abans del primer render. Usa el mateix origen amb /api/v1/node0 i el tenant local ac3bec76-255b-5ca2-8886-28fcceab4267. Sense la bandera exacta conserva la configuració anterior. No desplega ni commuta cap web en aplicar el kit.'));
  const patches=[];
  for(const item of files){
    const a=item.beforeData?path.join(stage,'preimatges',item.path):'/dev/null',b=path.join(stage,'fitxers',item.path);
    const diff=spawnSync('diff',['-u','--label',item.beforeData?`a/${item.path}`:'/dev/null','--label',`b/${item.path}`,a,b],{encoding:'utf8',maxBuffer:4*1024*1024});
    if(diff.error||![0,1].includes(diff.status))fail('diff_generation_failed');patches.push(diff.stdout);
  }
  write(stage,'pegats/node0.patch',patches.join(''));
  const inventory=[];
  function visit(dir,relative=''){for(const name of fs.readdirSync(dir).sort()){const rel=relative?`${relative}/${name}`:name,abs=path.join(dir,name),st=fs.lstatSync(abs);if(st.isDirectory())visit(abs,rel);else{if(!st.isFile()||st.isSymbolicLink())fail('kit_nonregular');inventory.push(`${hash(fs.readFileSync(abs))}  ${rel}\n`);}}}
  visit(stage);write(stage,'SHA256SUMS',inventory.join(''));
  // Recheck source and candidate immediately before publishing the immutable delivery.
  for(const item of files){for(const[root,key]of[[base,'before'],[candidate,'after']]){const now=inspect(root,item.path),was=item[key];if(JSON.stringify(expectedState(now))!==JSON.stringify(was))fail(`source_changed_during_package:${item.path}`);}}
  if(existing){
    const expectedEvidence=JSON.stringify(evidence.map(({path,sha256,mode})=>({path,sha256,mode})));
    const checkEvidence=()=>{
      const current=[];
      function scan(dir,prefix='evidencies'){for(const name of fs.readdirSync(dir).sort()){const rel=`${prefix}/${name}`,absolute=path.join(dir,name),st=fs.lstatSync(absolute);if(st.isDirectory()&&!st.isSymbolicLink())scan(absolute,rel);else{const value=inspect(dest,rel);if(!value)fail('evidence_disappeared');current.push({path:rel,sha256:value.sha256,mode:value.mode});}}}
      if(fs.existsSync(path.join(dest,'evidencies')))scan(path.join(dest,'evidencies'));
      if(JSON.stringify(current)!==expectedEvidence)fail('evidence_changed_during_build');
    };
    if(fs.readdirSync(dest).some(name=>name!=='evidencies'))fail('kit_root_changed_during_build');checkEvidence();
    // Exclusive publication preserves the shared evidence directory. The
    // checksum sidecar is written last: incomplete kits fail verification.
    function publish(dir,prefix=''){for(const name of fs.readdirSync(dir).sort()){const rel=prefix?`${prefix}/${name}`:name;if(rel==='SHA256SUMS'||rel==='evidencies')continue;const from=path.join(dir,name),st=fs.lstatSync(from);if(st.isDirectory()){fs.mkdirSync(path.join(dest,rel));publish(from,rel);}else write(dest,rel,fs.readFileSync(from),st.mode&0o777);}}
    publish(stage);checkEvidence();write(dest,'SHA256SUMS',fs.readFileSync(path.join(stage,'SHA256SUMS')));
  }else{if(fs.existsSync(dest))fail('kit_appeared_during_build');fs.renameSync(stage,dest);}
  return {kit:dest,files:files.length,manifestSha256:hash(fs.readFileSync(path.join(dest,'MANIFEST.json'))),checksumsSha256:hash(fs.readFileSync(path.join(dest,'SHA256SUMS')))};
}
function main(args) {
  const opts={};for(let i=0;i<args.length;i+=2){if(!['--candidate','--base','--kit','--paths-file','--backend-port-sha','--preimages-file'].includes(args[i])||!args[i+1])fail('invalid_cli');opts[args[i]]=args[i+1];}
  const result=empaquetaKitNodeZero({candidateRoot:opts['--candidate'],baseRoot:opts['--base'],kitRoot:opts['--kit'],paths:JSON.parse(fs.readFileSync(opts['--paths-file'],'utf8')),expectedBackendPortSha:opts['--backend-port-sha'],additionalExpectedPreimages:opts['--preimages-file']?JSON.parse(fs.readFileSync(opts['--preimages-file'],'utf8')):{}});process.stdout.write(JSON.stringify(result)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{main(process.argv.slice(2));}catch(e){process.stderr.write(`${e.message}\n`);process.exitCode=1;}}
