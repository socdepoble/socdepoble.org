/** AH09: public originals have one canonical origin, socdepoble.org.
 * No network, credentials or database. Route existence is certified by the
 * server publication loader; this structural allowlist alone is not that proof.
 */
import {createHash} from 'node:crypto';
import {netejaHtmlMastodonATextPla} from './text-posse.mjs';
import {retallaTextFederat} from '../../../src/data/federacio/pontMastodon.js';

const ROUTE=/^\/(?:mur|mercat|events|calendari|mapa|vehicle|animalets|treball|habitatge|page)\/[A-Za-z0-9_-]{1,128}$/;
const BIDI=/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/;
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const fail=code=>{throw Error(code);};
const scalars=text=>[...text].length;
function value(object,key){const descriptor=Object.getOwnPropertyDescriptor(object,key);if(descriptor&&!Object.hasOwn(descriptor,'value'))fail('posse_accessor_rejected');return descriptor?.value;}
function plain(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));}
export function canonicaPosse(url){
  if(typeof url!=='string'||url.length>2048||!url.isWellFormed()||BIDI.test(url)||/[\s\x00-\x1f\x7f\\%]/.test(url)||!url.startsWith('https://socdepoble.org/'))fail('posse_org_canonical_required');
  const parsed=new URL(url);if(parsed.origin!=='https://socdepoble.org'||parsed.username||parsed.password||parsed.port||parsed.hash||parsed.search||parsed.href!==url||!ROUTE.test(parsed.pathname))fail('posse_org_canonical_required');return url;
}
export function identitatPosse(record){
  if(!plain(record)||Object.keys(record).length!==3)fail('posse_record_id_required');
  const tenantId=value(record,'tenantId'),sectionId=value(record,'sectionId'),id=value(record,'id');
  if(typeof tenantId!=='string'||!UUID.test(tenantId)||typeof id!=='string'||!UUID.test(id)||!['mur','mercat','events','calendari','mapa','vehicle','animalets','treball','habitatge','multimedia'].includes(sectionId))fail('posse_record_id_required');
  return Object.freeze({tenantId:tenantId.toLowerCase(),sectionId,id:id.toLowerCase()});
}
export function textPosse(input){
  if(input===undefined||input===null)return'';if(typeof input!=='string')fail('posse_text_required');
  // Scalar/grapheme-safe cap before the shared donor cleaner. No arbitrary
  // coercion, scripts/styles/invisible spans, bidi controls or double entities.
  const cleaned=netejaHtmlMastodonATextPla(retallaTextFederat(input,65536),{unaSolaLinia:true});
  // The excerpt carries prose; outbound hyperlinks are emitted once, from the
  // authoritative canonical URL. Never carry old Blogger/WordPress hyperlinks.
  return cleaned.replace(/\b(?:https?:\/\/|www\.)[^\s<>]+/giu,' ').replace(/\b[a-z0-9-]+\.(?:blogspot\.[a-z.]+|wordpress\.com)(?:\/[^\s<>]*)?/giu,' ').replace(/\s+/gu,' ').trim();
}
function clip(input,limit){if(limit<=0)return'';return scalars(input)<=limit?input:retallaTextFederat(input,limit-1)+'…';}
export function formataPosse(item,{maxim=500,defaultTags=[]}={}){
  if(!plain(item)||value(item,'visibility')!=='public'||value(item,'source')==='mastodon'||!Number.isInteger(maxim)||maxim<100||maxim>500)fail('posse_public_original_required');
  const canonicalUrl=canonicaPosse(value(item,'canonicalUrl')),recordId=identitatPosse(value(item,'recordId'));
  const title=textPosse(value(item,'title')),summary=textPosse(value(item,'summary'));if(!title)fail('posse_title_required');
  const rawTags=value(item,'tags')??[];if(!Array.isArray(rawTags)||rawTags.length>32||rawTags.some(tag=>typeof tag!=='string')||!Array.isArray(defaultTags)||defaultTags.length>6||defaultTags.some(tag=>typeof tag!=='string'))fail('posse_tags_invalid');
  const tags=[];for(const raw of[...defaultTags,...rawTags]){const tag=textPosse(raw).normalize('NFC').replace(/^#/u,'');if(/^[\p{L}\p{N}_]{1,32}$/u.test(tag)&&!tags.some(old=>old.toLowerCase()===tag.toLowerCase()))tags.push(tag);if(tags.length===6)break;}
  const footer=(tags.length?'\n\n'+tags.map(tag=>'#'+tag).join(' '):'')+'\n\n'+canonicalUrl,available=maxim-scalars(footer);if(available<4)fail('posse_text_budget');
  const cleanSummary=clip(summary,220),reservedSummary=cleanSummary?Math.min(scalars(cleanSummary),40)+2:0;
  const cleanTitle=clip(title,Math.min(140,Math.max(1,available-reservedSummary))),remaining=available-scalars(cleanTitle)-2;
  const excerpt=remaining>0?clip(cleanSummary,remaining):'',status=cleanTitle+(excerpt?'\n\n'+excerpt:'')+footer;
  if(!status.isWellFormed()||scalars(status)>maxim)fail('posse_text_budget');
  return Object.freeze({recordId,canonicalUrl,status,visibility:'public',language:'ca',tags:Object.freeze(tags)});
}
/** Stable across content edits; the durable ledger additionally owns one
 * publication/account pair. Mastodon's short cache is not exactly-once storage.
 */
export function clauPosse(item,remoteAccountIdentity){
  const post=formataPosse(item);if(typeof remoteAccountIdentity!=='string'||remoteAccountIdentity.length>2048||!remoteAccountIdentity.startsWith('https://')||/[\s\x00-\x1f\x7f]/.test(remoteAccountIdentity))fail('posse_account_id_required');
  const identity=new URL(remoteAccountIdentity);if(identity.username||identity.password||identity.hash||identity.href!==remoteAccountIdentity)fail('posse_account_id_required');
  return 'sdp-posse-'+createHash('sha256').update(JSON.stringify([remoteAccountIdentity,post.recordId.tenantId,post.recordId.sectionId,post.recordId.id])).digest('hex');
}
