/** Synchronous public-key projection only. Uses the existing Ed25519 SPKI;
 * never creates, loads or returns a private key. Mastodon v4.7.5 processes
 * assertionMethod/Multikey before legacy publicKey/publicKeyPem entries. */
const AS_CONTEXT='https://www.w3.org/ns/activitystreams';
const CID_CONTEXT='https://www.w3.org/ns/cid/v1';
const ALPHABET='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const SPKI_PREFIX=Uint8Array.from([0x30,0x2a,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x03,0x21,0x00]);
const ACTOR_FIELDS=new Set(['@context','id','type','preferredUsername','name','summary','url','inbox','outbox','followers','following','manuallyApprovesFollowers','discoverable','publicKey','assertionMethod']);
const KEY_FIELDS=new Set(['id','owner','publicKeyPem']);
const MULTIKEY_FIELDS=new Set(['id','type','controller','publicKeyMultibase']);
const fail=()=>new TypeError('node0_actor_multikey_invalid');
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
function copy(value,depth=0){
  if(depth>10)throw fail();
  if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return value;
  if(typeof value==='string'){if(value.length>20000)throw fail();return value;}
  if(Array.isArray(value)){
    if(value.length>100||Reflect.ownKeys(value).length!==value.length+1)throw fail();
    return Array.from({length:value.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw fail();return copy(d.value,depth+1);});
  }
  if(!plain(value)||Reflect.ownKeys(value).length>100)throw fail();
  const out={};
  for(const key of Reflect.ownKeys(value)){
    const d=Object.getOwnPropertyDescriptor(value,key);
    if(typeof key!=='string'||key==='__proto__'||!d?.enumerable||!Object.hasOwn(d,'value'))throw fail();
    out[key]=copy(d.value,depth+1);
  }
  return out;
}
function httpsId(value,fragment=false){
  if(typeof value!=='string'||value.length>2048||/[\u0000-\u0020\u007f-\uffff\\]/.test(value))throw fail();
  let url;try{url=new URL(value);}catch{throw fail();}
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.href!==value||(fragment?!url.hash:Boolean(url.hash)))throw fail();
  return url;
}
export function publicRawEd25519(pem){
  if(typeof pem!=='string'||pem.length>512)throw fail();
  const match=/^-----BEGIN PUBLIC KEY-----\r?\n([A-Za-z0-9+/=\r\n]+)\r?\n-----END PUBLIC KEY-----\r?\n?$/.exec(pem);
  if(!match)throw fail();const encoded=match[1].replace(/[\r\n]/g,'');
  let value;try{value=atob(encoded);}catch{throw fail();}
  if(btoa(value)!==encoded)throw fail();const der=Uint8Array.from(value,c=>c.charCodeAt(0));
  if(der.byteLength!==44||!SPKI_PREFIX.every((byte,i)=>der[i]===byte))throw fail();
  return der.slice(12);
}
export function codificaMultikeyEd25519(raw){
  if(!(raw instanceof Uint8Array)||raw.byteLength!==32)throw fail();
  // unsigned-varint multicodec ed25519-pub (0xed) is exactly ed 01.
  const bytes=Uint8Array.from([0xed,0x01,...raw]);let number=0n;
  for(const byte of bytes)number=(number<<8n)+BigInt(byte);
  let result='';while(number){result=ALPHABET[Number(number%58n)]+result;number/=58n;}
  for(const byte of bytes){if(byte!==0)break;result='1'+result;}
  return 'z'+result;
}
export function actorAmbMultikeyEd25519(input){
  const actor=copy(input);if(!plain(actor)||!plain(actor.publicKey))throw fail();
  if(Object.keys(actor).some(key=>!ACTOR_FIELDS.has(key))||Object.keys(actor.publicKey).some(key=>!KEY_FIELDS.has(key)))throw fail();
  if(!['Person','Organization','Application','Service','Group'].includes(actor.type))throw fail();
  for(const field of Object.keys(actor)){
    if(['manuallyApprovesFollowers','discoverable'].includes(field)){if(typeof actor[field]!=='boolean')throw fail();}
    else if(!['@context','publicKey','assertionMethod'].includes(field)&&typeof actor[field]!=='string')throw fail();
  }
  const id=httpsId(actor.id),keyId=httpsId(actor.publicKey.id,true);
  if(actor.publicKey.owner!==id.href||keyId.href.split('#')[0]!==id.href)throw fail();
  const contexts=Array.isArray(actor['@context'])?actor['@context']:[actor['@context']];
  if(!contexts.every(v=>typeof v==='string')||!contexts.includes(AS_CONTEXT))throw fail();
  const publicKeyMultibase=codificaMultikeyEd25519(publicRawEd25519(actor.publicKey.publicKeyPem));
  const multikey={id:keyId.href,type:'Multikey',controller:id.href,publicKeyMultibase};
  const existing=actor.assertionMethod===undefined?[]:Array.isArray(actor.assertionMethod)?actor.assertionMethod:[actor.assertionMethod];
  const others=[];
  for(const entry of existing){
    const entryId=typeof entry==='string'?entry:entry?.id;
    if(typeof entryId!=='string'||httpsId(entryId,true).href.split('#')[0]!==id.href)throw fail();
    if(typeof entry!=='string'&&(!plain(entry)||Object.keys(entry).some(key=>!MULTIKEY_FIELDS.has(key))||entry.type!=='Multikey'||entry.controller!==id.href||typeof entry.publicKeyMultibase!=='string'||!/^z[1-9A-HJ-NP-Za-km-z]{1,200}$/.test(entry.publicKeyMultibase)))throw fail();
    if(entryId===keyId.href){
      if(typeof entry!=='string'&&(entry.type!=='Multikey'||entry.controller!==id.href||entry.publicKeyMultibase!==publicKeyMultibase))throw fail();
    }else others.push(entry);
  }
  if(others.length>=10)throw fail();
  actor['@context']=[...new Set([...contexts,CID_CONTEXT])];
  actor.assertionMethod=[multikey,...others];
  return actor;
}
