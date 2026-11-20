import test from 'node:test';
import assert from 'node:assert/strict';
import { validaContenidorMedia, validaFitxerMedia } from '../src/utils/validadorContenidorsMedia.js';
import { wav, png, frame, ascii } from './helpers/contenidorsMedia.js';

test('the real media gate validates immutable WAV/PNG bytes and rejects mismatched MIME',()=>{
  for(const [mime,make]of[['audio/wav',wav],['image/png',png]]) {
    const bytes=make(),before=bytes.slice(),r=validaContenidorMedia(bytes,mime);
    assert.equal(r.bytes,bytes.length);assert.equal(r.mime,mime);assert.ok(Object.isFrozen(r));assert.deepEqual(bytes,before);
    assert.throws(()=>validaContenidorMedia(bytes,mime==='audio/wav'?'image/png':'audio/wav'));
  }
});
test('bare OGG, AVIF and PDF signatures never substitute for complete containers',()=>{
  for(const [mime,sig]of[['audio/ogg','OggS'],['application/ogg','OggS'],['image/avif','\0\0\0\x18ftypavif'],['application/pdf','%PDF-1.7\n%%EOF']]) {
    assert.throws(()=>validaContenidorMedia(ascii(sig),mime));
    assert.throws(()=>validaContenidorMedia(new Uint8Array(0),mime));
  }
});
test('truncated RIFF and protected MP3 with wrong CRC fail closed',()=>{
  const w=wav();for(const n of [1,12,w.length-1])assert.throws(()=>validaContenidorMedia(w.slice(0,n),'audio/wav'));
  const m=frame();m[1]&=0xfe;m[4]=0x12;m[5]=0x34;assert.throws(()=>validaContenidorMedia(m,'audio/mpeg'));
});
test('the Blob upload gate executes validation and honours pre-aborted reads',async()=>{
  const b=new Blob([wav()],{type:'audio/wav'});assert.equal((await validaFitxerMedia(b)).format,'wav');
  await assert.rejects(validaFitxerMedia(new Blob([ascii('OggS')],{type:'audio/ogg'})));
  const c=new AbortController();c.abort();await assert.rejects(validaFitxerMedia(b,{signal:c.signal}),e=>e.name==='AbortError');
});
