// @vitest-environment node
import {createHash,webcrypto} from 'node:crypto';
import {beforeAll,expect,it,vi} from 'vitest';
import {aBase64url,deBase64url,desxifraAesGcm,kekPbkdf2,xifraAesGcm} from '../../xifratXatCripto.js';
import {CODI_LIMIT_SUPERAT,CODI_MATERIAL_SENSIBLE,exportaCopiaSeguretatXat,importaCopiaSeguretatXat} from '../copiaSeguretatPortatil.js';

const password='olivera-fixture-r28';
const scope={usuariId:'fixture-persona',tenantId:'fixture-poble',contrasenya:password,cripto:webcrypto};
const options={usuariIdEsperat:scope.usuariId,tenantIdEsperat:scope.tenantId,contrasenya:password,cripto:webcrypto};
const msg=(extra={})=>({id:'m',filId:'f',seq:1,text:'Dada sintètica',creatAl:'2026-11-14T12:00:00.000Z',...extra});
const input=(message)=>({...scope,fils:[{id:'f'}],missatges:[message]});
const canon=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?`[${v.map(canon).join(',')}]`:`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
const bytes=x=>new TextEncoder().encode(x);
const errorOf=p=>p.then(()=>null,e=>({codi:e.codi,motiu:e.motiu}));
const limited={codi:CODI_LIMIT_SUPERAT,motiu:'json-niat-massa-gran'};
let privateJwk,safe;
beforeAll(async()=>{
  const pair=await webcrypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']);
  privateJwk=await webcrypto.subtle.exportKey('jwk',pair.privateKey);
  safe=await exportaCopiaSeguretatXat(input(msg()));
});

it('R28: JSON serialitzat gran no pot amagar una privada canviant objecte per llista',async()=>{
  for(const payload of [{payload:privateJwk,padding:'x'.repeat(65536)},[privateJwk,'x'.repeat(65536)]]){
    const envelope=JSON.stringify(payload);
    expect(await errorOf(exportaCopiaSeguretatXat(input(msg({metadades:{envelope}}))))).toEqual(limited);
  }
  expect(await errorOf(exportaCopiaSeguretatXat(input(msg({metadades:{envelope:JSON.stringify({payload:privateJwk})}}))))).toMatchObject({codi:CODI_MATERIAL_SENSIBLE});
});

it('R28: importació autenticada amb JSON niat gran rebutja abans de qualsevol callback',async()=>{
  const sobre=JSON.parse(safe),cap=sobre.capcalera;
  const aad=bytes(canon({esquema:sobre.esquema,versio:sobre.versio,capcalera:{...cap,aead:{algoritme:cap.aead.algoritme,etiquetaBits:cap.aead.etiquetaBits}}}));
  const key=await kekPbkdf2(webcrypto,bytes(password),deBase64url(cap.kdf.sal,16),{iteracions:cap.kdf.iteracions,usos:['encrypt','decrypt']});
  const clear=await desxifraAesGcm(webcrypto,key,{xifrat:new Uint8Array(Buffer.from(sobre.xifrat,'base64url')),aad,iv:deBase64url(cap.aead.iv,12)});
  const paquet=JSON.parse(new TextDecoder().decode(clear));
  paquet.dades.missatges[0].metadades={envelope:JSON.stringify({payload:privateJwk,padding:'x'.repeat(65536)})};
  paquet.manifest.lots.missatges.sha256=createHash('sha256').update(canon(paquet.dades.missatges)).digest('hex');
  const {iv,xifrat}=await xifraAesGcm(webcrypto,key,{dades:bytes(JSON.stringify(paquet)),aad});
  const forged=JSON.stringify({...sobre,capcalera:{...cap,aead:{...cap.aead,iv:aBase64url(iv)}},xifrat:Buffer.from(xifrat).toString('base64url')});
  const callback=vi.fn();
  expect(await errorOf(importaCopiaSeguretatXat(forged,{...options,aplicaImportacio:callback}))).toEqual(limited);
  expect(callback).not.toHaveBeenCalled();
});

it('R28: el límit JSON no talla el text lliure llarg ni cadenes llargues no JSON',async()=>{
  const text='{'+ 'x'.repeat(65536),plain='x'.repeat(65537);
  const exported=await exportaCopiaSeguretatXat(input(msg({text,metadades:{envelope:plain,legit:JSON.stringify({compte:3})}})));
  const restored=await importaCopiaSeguretatXat(exported,options);
  expect(restored.missatges[0].text).toBe(text);
  expect(restored.missatges[0].metadades.envelope).toBe(plain);
  expect(restored.missatges[0].metadades.legit).toBe(JSON.stringify({compte:3}));
});
