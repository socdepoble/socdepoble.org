#!/usr/bin/env node
/** Política local conservadora: PNG/ICO quadrat múltiple48 i SVG quadrat validat.
 * Google documenta mínim8px/recomanació>48px; no garantix mostrar-lo. Xarxa només explícita.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {JSDOM,VirtualConsole} from 'jsdom';
import {arrelSegura,esMain} from '../lib/arrel.mjs';
import {requestGet,retryAfterSeconds} from '../gates/tractor-sentinella-blindatge.mjs';
export const FAVICON_LIMITS=Object.freeze({htmlBytes:262144,iconBytes:65536,decodedBytes:8388608,icons:8,tagBytes:4096,requests:2,requestMs:3000});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const square=(w,h)=>Number.isFinite(w)&&Number.isFinite(h)&&w>0&&w===h;
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=bytes=>{let n=0xffffffff;for(const byte of bytes)n=crcTable[(n^byte)&255]^(n>>>8);return(n^0xffffffff)>>>0;};
function attrs(text) {
  const result={}; let i=0;
  while(i<text.length) {
    while(i<text.length&&!/[A-Za-z_:]/.test(text[i]))i++;
    const start=i;while(i<text.length&&/[\w:.-]/.test(text[i]))i++;
    const key=text.slice(start,i).toLowerCase();while(/\s/.test(text[i]||'')&&i<text.length)i++;
    if(text[i]!=='=')continue;i++;while(/\s/.test(text[i]||'')&&i<text.length)i++;
    const quote=['"',"'"].includes(text[i])?text[i++]:null;const valueStart=i;
    while(i<text.length&&(quote?text[i]!==quote:!/[\s>]/.test(text[i])))i++;
    if(Object.hasOwn(result,key))throw new Error('DUPLICATE_ATTRIBUTE');
    if(quote&&i===text.length)throw new Error('UNCLOSED_ATTRIBUTE');
    result[key]=text.slice(valueStart,i);if(quote)i++;
  }
  return result;
}
export function declaredIcons(html) {
  if(typeof html!=='string'||Buffer.byteLength(html)>FAVICON_LIMITS.htmlBytes)throw new Error('HTML_LIMIT');
  // JSDOM no executa scripts ni carrega recursos amb les opcions per defecte.
  const dom=new JSDOM(html,{includeNodeLocations:true,virtualConsole:new VirtualConsole()});
  try {
    if(!dom.nodeLocation(dom.window.document.head)?.endTag)throw new Error('HTML_HEAD_NOT_VERIFIED');
    if(dom.window.document.head.querySelector('base[href]'))throw new Error('HTML_BASE_NOT_VERIFIED');
    const icons=[];
    for(const link of dom.window.document.head.querySelectorAll('link')) {
      const loc=dom.nodeLocation(link),tag=loc?.startTag||loc;
      if(!tag||tag.endOffset-tag.startOffset>FAVICON_LIMITS.tagBytes)throw new Error('TAG_LIMIT');
      attrs(html.slice(tag.startOffset+5,tag.endOffset-1)); // rebutja atributs duplicats.
      if((link.getAttribute('rel')||'').toLowerCase().split(/\s+/).includes('icon')) {
        if(icons.length>=FAVICON_LIMITS.icons)throw new Error('ICON_LIMIT');
        icons.push({href:link.getAttribute('href')||'',type:link.getAttribute('type'),sizes:link.getAttribute('sizes')});
      }
    }
    return icons;
  } finally {dom.window.close();}
}
export function validateIconBytes(bytes, extension, declaredType=null) {
  if(!Buffer.isBuffer(bytes)||bytes.length>FAVICON_LIMITS.iconBytes)return {valid:false,code:'ICON_LIMIT'};
  let dimensions=[],mime=null;
  if(extension==='.png') {
    mime='image/png';
    if(bytes.length<33||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.readUInt32BE(8)!==13||bytes.toString('ascii',12,16)!=='IHDR')return {valid:false,code:'PNG_BYTES'};
    dimensions=[[bytes.readUInt32BE(16),bytes.readUInt32BE(20)]];
    const [w,h]=dimensions[0],depth=bytes[24],color=bytes[25],channels={0:1,2:3,3:1,4:2,6:4}[color];
    const depths={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
    if(!square(w,h)||!channels||!depths[color].includes(depth)||bytes[26]!==0||bytes[27]!==0||bytes[28]!==0)return {valid:false,code:'PNG_ENCODING'};
    const rowBytes=Math.ceil(w*channels*depth/8),decodedBytes=(rowBytes+1)*h;
    if(!Number.isSafeInteger(decodedBytes)||decodedBytes>FAVICON_LIMITS.decodedBytes)return {valid:false,code:'PNG_DECODE_LIMIT'};
    let at=8,idat=false,ended=false,chunks=0,palette=false,closedIdat=false;const compressed=[];
    while(at+12<=bytes.length&&++chunks<=4096){
      const n=bytes.readUInt32BE(at),end=at+12+n;
      if(end>bytes.length||crc32(bytes.subarray(at+4,at+8+n))!==bytes.readUInt32BE(at+8+n))return {valid:false,code:'PNG_STRUCTURE'};
      const type=bytes.toString('ascii',at+4,at+8);
      if(type==='IHDR'&&at!==8||!/^[A-Za-z]{4}$/.test(type))return {valid:false,code:'PNG_STRUCTURE'};
      if(type==='PLTE'){if(idat||palette||n===0||n%3||n>768)return {valid:false,code:'PNG_STRUCTURE'};palette=true;}
      if(type==='IDAT'){if(closedIdat)return {valid:false,code:'PNG_STRUCTURE'};idat=true;compressed.push(bytes.subarray(at+8,at+8+n));}
      else if(idat)closedIdat=true;
      if(type[0]===type[0].toUpperCase()&&!['IHDR','PLTE','IDAT','IEND'].includes(type))return {valid:false,code:'PNG_STRUCTURE'};
      if(type==='IEND'){ended=n===0&&end===bytes.length;break;}at=end;
    }
    if(!idat||!ended||color===3&&!palette)return {valid:false,code:'PNG_STRUCTURE'};
    try{const decoded=inflateSync(Buffer.concat(compressed),{maxOutputLength:decodedBytes});if(decoded.length!==decodedBytes)return {valid:false,code:'PNG_PIXELS'};for(let row=0;row<h;row++)if(decoded[row*(rowBytes+1)]>4)return {valid:false,code:'PNG_PIXELS'};}
    catch{return {valid:false,code:'PNG_PIXELS'};}
  } else if(extension==='.ico') {
    mime='image/x-icon';
    if(bytes.length<22||bytes.readUInt16LE(0)!==0||bytes.readUInt16LE(2)!==1)return {valid:false,code:'ICO_BYTES'};
    const n=bytes.readUInt16LE(4);if(!n||n>64||6+16*n>bytes.length)return {valid:false,code:'ICO_DIRECTORY'};
    for(let i=0;i<n;i++) {
      const at=6+16*i,w=bytes[at]||256,h=bytes[at+1]||256,size=bytes.readUInt32LE(at+8),offset=bytes.readUInt32LE(at+12);
      if(offset<6+16*n||size<16||offset+size>bytes.length)return {valid:false,code:'ICO_RANGE'};
      const image=bytes.subarray(offset,offset+size);
      if(image[0]===137){const inner=validateIconBytes(image,'.png');if(!inner.valid&&inner.code!=='DIMENSIONS_48'||!inner.dimensions?.some(d=>d[0]===w&&d[1]===h))return {valid:false,code:'ICO_DIMENSIONS'};}
      else {
        // biWidth és positiu. biHeight pot indicar orientació top-down,
        // però el seu mòdul sempre inclou la imatge i la màscara AND.
        if(image.length<40||image.readUInt32LE(0)<40||image.readInt32LE(4)!==w||Math.abs(image.readInt32LE(8))!==h*2)return {valid:false,code:'ICO_DIMENSIONS'};
        const header=image.readUInt32LE(0),bits=image.readUInt16LE(14),colors=image.readUInt32LE(32)||(bits<=8?2**bits:0);
        const minimum=header+colors*4+Math.ceil(w*bits/32)*4*h+Math.ceil(w/32)*4*h;
        if(![40,108,124].includes(header)||image.readUInt16LE(12)!==1||![1,4,8,16,24,32].includes(bits)||image.readUInt32LE(16)!==0||minimum>image.length)return {valid:false,code:'ICO_BITMAP'};
      }
      dimensions.push([w,h]);
    }
  } else if(extension==='.svg') {
    mime='image/svg+xml';const text=bytes.toString('utf8');
    if(/<!DOCTYPE|<!ENTITY|<(?:[\w-]+:)?(?:script|style|foreignObject|use|animate\w*|set|discard)\b|\bon\w+\s*=|javascript\s*:|\b(?:href|xlink:href)\s*=|\burl\s*\(/i.test(text))return {valid:false,code:'SVG_ACTIVE_CONTENT'};
    let dom,a;
    try {
      dom=new JSDOM(text,{contentType:'image/svg+xml',virtualConsole:new VirtualConsole()});const svg=dom.window.document.documentElement;
      if(svg.localName!=='svg'||svg.namespaceURI&&svg.namespaceURI!=='http://www.w3.org/2000/svg'||svg.querySelectorAll('*').length>2048)return {valid:false,code:'SVG_BYTES'};
      // Inspecció posterior al parser: XML descodifica entitats en tots els
      // atributs, no només a les dimensions de l'arrel. La política local
      // rebutja CSS inline i escapes CSS, sense intentar interpretar-los.
      const walk=dom.window.document.createTreeWalker(dom.window.document,0xffffffff);
      for(let node=walk.nextNode();node;node=walk.nextNode()) {
        if(node.nodeType===7)return {valid:false,code:'SVG_ACTIVE_CONTENT'};
        if(node.nodeType!==1)continue;
        if(node.namespaceURI&&node.namespaceURI!=='http://www.w3.org/2000/svg'||/^(?:script|style|foreignobject|use|animate\w*|set|discard)$/i.test(node.localName))return {valid:false,code:'SVG_ACTIVE_CONTENT'};
        for(const attribute of node.attributes) {
          const name=attribute.localName.toLowerCase(),value=attribute.value.replace(/[\u0000-\u0020\u007f]/g,'');
          if(name==='style'||name==='href'||name.startsWith('on')||/\\|\/\*|@|url\(|javascript:|expression\(/i.test(value))return {valid:false,code:'SVG_ACTIVE_CONTENT'};
        }
      }
      a=Object.fromEntries([...svg.attributes].map(attr=>[attr.name.toLowerCase(),attr.value]));
    } catch {return {valid:false,code:'SVG_BYTES'};}
    finally {dom?.window.close();}
    const vb=(a.viewbox||'').trim().split(/[\s,]+/).map(Number);
    if(vb.length!==4||!vb.every(Number.isFinite)||!square(vb[2],vb[3]))return {valid:false,code:'SVG_VIEWBOX'};
    for(const key of ['width','height'])if(a[key]&&!/^\d+(?:\.\d+)?(?:px)?$/.test(a[key]))return {valid:false,code:'SVG_DIMENSIONS'};
    if(Boolean(a.width)!==Boolean(a.height))return {valid:false,code:'SVG_DIMENSIONS'};
    if(a.width&&a.height&&!square(Number(a.width.replace(/px$/,'')),Number(a.height.replace(/px$/,''))))return {valid:false,code:'SVG_DIMENSIONS'};
    dimensions=[[vb[2],vb[3]]];
  } else return {valid:false,code:'FORMAT_UNSUPPORTED'};
  const types=extension==='.ico'?['image/x-icon','image/vnd.microsoft.icon']: [mime];
  if(declaredType&&!types.includes(declaredType.toLowerCase().split(';')[0].trim()))return {valid:false,code:'MIME_MISMATCH',dimensions};
  const valid=extension==='.svg'||dimensions.some(([w,h])=>square(w,h)&&w>=48&&w%48===0);
  return {valid,code:valid?'LOCAL_POLICY_MET':'DIMENSIONS_48',format:extension.slice(1),mime,dimensions,raster:extension!=='.svg'};
}
function localBytes(root,relative,max) {
  let p=root;for(const part of relative.split('/')){if(!part||part==='.'||part==='..')throw new Error('UNSAFE_PATH');p=path.join(p,part);if(fs.lstatSync(p).isSymbolicLink())throw new Error('SYMLINK_REJECTED');}
  const fd=fs.openSync(p,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
  try{const stat=fs.fstatSync(fd);if(!stat.isFile()||stat.size>max||stat.nlink!==1)throw new Error('FILE_LIMIT');const bytes=Buffer.alloc(stat.size+1);let size=0;while(size<bytes.length){const n=fs.readSync(fd,bytes,size,bytes.length-size,null);if(!n)break;size+=n;}const after=fs.fstatSync(fd),named=fs.lstatSync(p);if(size!==stat.size||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||after.ctimeMs!==stat.ctimeMs||named.ino!==stat.ino||named.dev!==stat.dev||named.isSymbolicLink())throw new Error('FILE_CHANGED');return bytes.subarray(0,size);}finally{fs.closeSync(fd);}
}
async function boundedRequest(request,url,options) {
  const control=new AbortController();let timer;
  const abort=()=>control.abort();options.signal?.addEventListener('abort',abort,{once:true});
  if(options.signal?.aborted)abort();
  try{return await Promise.race([request(url,{...options,signal:control.signal}),new Promise((_,reject)=>{timer=setTimeout(()=>{control.abort();reject(new Error('TIMEOUT'));},FAVICON_LIMITS.requestMs);})]);}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);control.abort();}
}
export async function auditFaviconSeo({root,htmlFile='index.html',assetRoot='public',remoteOrigin=null,signal}={},deps={}) {
  if(fs.lstatSync(root).isSymbolicLink())throw new Error('SYMLINK_REJECTED');root=fs.realpathSync(root);
  const unsafe=relative=>typeof relative!=='string'||path.isAbsolute(relative)||relative.includes('\\')||relative.split('/').some(p=>!p||p==='.'||p==='..'||/^\.env/i.test(p));
  if(unsafe(htmlFile)||!htmlFile.endsWith('.html')||unsafe(assetRoot))throw new Error('UNSAFE_PATH');
  const html=localBytes(root,htmlFile,FAVICON_LIMITS.htmlBytes).toString('utf8'),declared=declaredIcons(html),results=[];
  if(remoteOrigin&&!['https://socdepoble.org','https://socdepoble.cat'].includes(remoteOrigin))throw new Error('ORIGIN_REJECTED');
  const base=remoteOrigin||'https://socdepoble.org';let requests=0;
  for(const icon of declared) {
    let url;try{url=new URL(icon.href,base);}catch{results.push({valid:false,code:'URL_INVALID'});continue;}
    if(url.origin!==base||url.username||url.password||url.search||url.hash||/%|\\|[\u0000-\u0020]/.test(icon.href)||icon.href.split('/').includes('..')){results.push({valid:false,code:'URL_UNSTABLE_OR_FOREIGN'});continue;}
    const extension=path.extname(url.pathname).toLowerCase();let result;
    if(!['.png','.ico','.svg'].includes(extension)){results.push({path:url.pathname,valid:false,code:'FORMAT_UNSUPPORTED',httpVerified:false});continue;}
    try{const bytes=localBytes(root,assetRoot+'/'+url.pathname.replace(/^\//,''),FAVICON_LIMITS.iconBytes);result={...validateIconBytes(bytes,extension,icon.type),path:url.pathname,sha256:hash(bytes),httpVerified:false};}
    catch{result={path:url.pathname,valid:false,code:'LOCAL_NOT_VERIFIED',httpVerified:false};}
    if(result.valid&&icon.sizes){const sizes=icon.sizes.trim().toLowerCase().split(/\s+/);if(!sizes.every(size=>size==='any'?extension==='.svg':/^\d+x\d+$/.test(size)&&result.dimensions.some(([w,h])=>size===`${w}x${h}`))){result.valid=false;result.code='DECLARED_SIZE_MISMATCH';}}
    if(remoteOrigin&&result.valid&&result.raster&&requests===0) {
      const observed=[];
      for(let i=0;i<FAVICON_LIMITS.requests;i++) {
        if(signal?.aborted)throw new Error('ABORTED');requests++;
        try {
          const r=await boundedRequest(deps.requestGet||requestGet,url.href,{kind:'public-asset',binary:true,maxBytes:FAVICON_LIMITS.iconBytes,timeoutMs:FAVICON_LIMITS.requestMs,signal});
          if(r.status!==200){result={...result,valid:false,code:r.status===503?'SERVICE_UNAVAILABLE':'HTTP_STATUS',retryAfterSeconds:retryAfterSeconds(r.headers?.['retry-after'])};break;}
          if(r.tls?.authorized!==true||typeof r.headers?.['content-type']!=='string'||!Buffer.isBuffer(r.body)||!validateIconBytes(r.body,extension,r.headers['content-type']).valid){result={...result,valid:false,code:'REMOTE_BYTES_OR_MIME'};break;}
          observed.push(hash(r.body));
        }catch{result={...result,valid:false,code:'REMOTE_NOT_VERIFIED'};break;}
      }
      if(observed.length===2){result.httpVerified=true;result.stableObserved=observed[0]===observed[1]&&observed[0]===result.sha256;if(!result.stableObserved){result.valid=false;result.code='REMOTE_CHANGED';}}
    }
    results.push(result);
  }
  const raster=results.some(r=>r.valid&&r.raster),valid=declared.length>0&&raster&&results.every(r=>r.valid);
  const verified=results.filter(r=>r.valid&&r.httpVerified).length,httpVerified=Boolean(remoteOrigin)&&valid&&verified===results.length;
  const pending=Boolean(remoteOrigin)&&valid&&!httpVerified;
  return {schema:'sdp.favicon-seo.v1',status:valid?(pending?'unknown':'ok'):'fail',policy:'local-square-raster-multiple-48-plus-validated-svg',googleDisplayGuaranteed:false,remoteRequested:Boolean(remoteOrigin),requests,results,httpVerified,httpCoverage:{declared:declared.length,verified,pending:remoteOrigin?results.length-verified:declared.length},...(pending?{code:'HTTP_COVERAGE_PARTIAL'}:{}),limits:FAVICON_LIMITS};
}
export async function main(argv=process.argv.slice(2)) {
  let root=arrelSegura(),remoteOrigin=null,htmlFile='index.html',assetRoot='public';const seen=new Set();
  for(const arg of argv){const key=arg.split('=')[0];if(seen.has(key))throw new Error('INVALID_ARGUMENT');seen.add(key);if(arg.startsWith('--arrel='))root=path.resolve(arg.slice(8));else if(arg.startsWith('--remote-origin='))remoteOrigin=arg.slice(16);else if(arg.startsWith('--html='))htmlFile=arg.slice(7);else if(arg.startsWith('--assets='))assetRoot=arg.slice(9);else throw new Error('INVALID_ARGUMENT');}
  const report=await auditFaviconSeo({root,remoteOrigin,htmlFile,assetRoot});process.stdout.write(JSON.stringify(report,null,2)+'\n');return report.status==='ok'?0:report.status==='unknown'?2:1;
}
if(esMain(import.meta.url))main().then(code=>{process.exitCode=code;}).catch(()=>{process.stderr.write('favicon-seo: no verificat\n');process.exitCode=2;});
