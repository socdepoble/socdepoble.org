import {describe, expect, test, vi} from 'vitest';
import {creaNode0Client, MAX_BYTES_NODE_ZERO, normalitzaEstatNode0, sanejaPublicacioNode0} from './node0Client.js';

describe('R6 Node0: contracte del servidor i lectura acotada real', () => {
  test('l’estat canònic PostgreSQL i el mirall autenticat es reflectixen en el client', () => {
    const result=normalitzaEstatNode0({node:'node0',postgresql:{ok:true,version:'17.11',taules:40,registres:{feedPosts:12,events:4,pages:16}},resilience:{workspaceMirrorConfigured:true,mirrorIntegrityOk:true,mirrorAuthenticationVerified:true,mirrorRetentionOk:true}});
    expect(result.postgresql).toMatchObject({tables:40,publicDocuments:32});
    expect(result.resilience).toEqual({ok:true,encryptedMirrorConfigured:true,status:'ready'});
    expect(normalitzaEstatNode0({node:'node0',resilience:{workspaceMirrorConfigured:true,mirrorIntegrityOk:true,mirrorAuthenticationVerified:false}}).resilience).toEqual({ok:false,encryptedMirrorConfigured:true,status:'pending'});
  });
  test('interromp el flux chunked quan supera 512 KiB abans de consumir el cos complet', async () => {
    let reads=0,cancelled=false;
    const reader={async read(){reads++;return reads<20?{done:false,value:new Uint8Array(64*1024).fill(32)}:{done:true};},async cancel(){cancelled=true;},releaseLock(){}};
    const text=vi.fn(async()=>'{"node":"node0"}');
    const response={ok:true,status:200,headers:new Headers({'content-type':'application/json'}),body:{getReader:()=>reader},text};
    const result=await creaNode0Client({fetchImpl:async()=>response}).getStatus();
    expect(result.error).toBe('NODE0_PAYLOAD_TOO_LARGE');
    expect(reads).toBe(MAX_BYTES_NODE_ZERO/(64*1024)+1);
    expect(cancelled).toBe(true);expect(text).not.toHaveBeenCalled();
  });
  test('aborta un cos pendent i no el transforma en estat vàlid després del termini', async () => {
    let cancelled=false;
    const stream=new ReadableStream({cancel(){cancelled=true;}});
    const result=await creaNode0Client({timeoutMs:50,fetchImpl:async()=>new Response(stream,{headers:{'content-type':'application/json'}})}).getStatus();
    expect(result.error).toBe('NODE0_TIMEOUT');expect(cancelled).toBe(true);
  });
  test('rebutja UTF-8 invàlid, Content-Length invàlid i JSON sense Content-Type', async () => {
    for(const response of [new Response(new Uint8Array([0xff]),{headers:{'content-type':'application/json'}}),new Response('{}',{headers:{'content-type':'application/json','content-length':'Infinity'}}),new Response('{}',{headers:{}})]){
      const result=await creaNode0Client({fetchImpl:async()=>response}).getStatus();
      expect(result.ok).toBe(false);
    }
  });
  test('llegix UTF-8 fragmentat i application vendor +json sense perdre accents', async () => {
    const bytes=new TextEncoder().encode(JSON.stringify({node:'node0',postgresql:{ok:true,version:'Vàlencia 🏡'}}));
    let offset=0;
    const reader={async read(){return offset<bytes.length?{done:false,value:bytes.slice(offset,++offset)}:{done:true};},async cancel(){},releaseLock(){}};
    const result=await creaNode0Client({fetchImpl:async()=>({ok:true,status:200,headers:new Headers({'content-type':'application/vnd.sdp+json; charset=utf-8'}),body:{getReader:()=>reader}})}).getStatus();
    expect(result.ok).toBe(true);expect(result.postgresql.version).toBe('Vàlencia 🏡');
  });
  test('una retenció fallida impedix anunciar el mirall com a preparat', () => {
    expect(normalitzaEstatNode0({node:'node0',resilience:{workspaceMirrorConfigured:true,mirrorIntegrityOk:true,mirrorAuthenticationVerified:true,mirrorRetentionOk:false}}).resilience).toEqual({ok:false,encryptedMirrorConfigured:true,status:'pending'});
  });

});

/* R6 Bloc 4 · Troballa P3 del Bloc 1: els camps d'URL validen l'esquema. */
describe('R6 Node0: camps d\u2019URL de les publicacions', () => {
  const CAMPS = ['image_url', 'avatar_url', 'hero_url', 'url', 'source_url', 'canonicalUrl', 'uri'];
  test('conserva http(s) absolut i els camins relatius a l\u2019arrel', () => {
    for (const valor of ['https://socdepoble.org/a.jpg', 'http://127.0.0.1:8787/x', '/assets/poble.webp']) {
      const net = sanejaPublicacioNode0(Object.fromEntries([['id', 'p1'], ...CAMPS.map((camp) => [camp, valor])]));
      for (const camp of CAMPS) expect(net[camp]).toBe(valor);
    }
  });
  test('lleva esquemes perillosos, protocol-relatius, credencials i barres inverses', () => {
    const hostils = ['javascript:alert(1)', ' javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<b>x</b>',
      'vbscript:x', '//atac.test/x', '/\\atac.test/x', 'https://usuari:clau@atac.test/', 'mailto:a@b.test', 'pagina-relativa', 'ftp://atac.test/'];
    for (const valor of hostils) {
      const net = sanejaPublicacioNode0(Object.fromEntries([['id', 'p1'], ['title', 'Títol'], ...CAMPS.map((camp) => [camp, valor])]));
      expect(net.title).toBe('Títol');
      for (const camp of CAMPS) expect(Object.hasOwn(net, camp), `${camp} = ${JSON.stringify(valor)}`).toBe(false);
    }
  });
  test('un camp de text que no és URL continua sense validació d\u2019esquema', () => {
    expect(sanejaPublicacioNode0({ id: 'p1', source: 'javascript:no-es-url', content: '<p>x</p>' })).toMatchObject({ source: 'javascript:no-es-url', content: '<p>x</p>' });
  });
});
