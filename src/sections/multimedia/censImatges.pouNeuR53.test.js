// @vitest-environment node
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {expect,test} from 'vitest';
import {CENS_IMATGES,EXCLOSES,idDelCens,mitjansDelCens} from './censImatges.js';
import {dretsDe,indexaCens,origenDe} from './origenImatges.js';
import {fusionaMitjans} from './mediaContent.js';
import {NOVES_TECNOLOGIES_IMATGES} from '../mur/articles/novesTecnologiesCulturaRuralContent.js';

test('R55 · les nou fonts R53 arriben a l’Arxiu com a documents reals, amb procedència i drets no declarats',()=>{
  const prefix='/assets/uploads/patrimoni/pou-neu-rentonar-';
  const entries=CENS_IMATGES.filter(e=>e.src.startsWith(prefix));
  expect(entries).toHaveLength(9);
  expect(new Set(entries.map(e=>e.src))).toEqual(new Set(NOVES_TECNOLOGIES_IMATGES.map(e=>e.src)));
  const media=mitjansDelCens(),merged=fusionaMitjans([],media),index=indexaCens(CENS_IMATGES);
  for(const image of NOVES_TECNOLOGIES_IMATGES){
    const entry=entries.find(e=>e.src===image.src),item=merged.find(e=>e.src===image.src);
    expect(entry).toMatchObject({ambit:'contingut',origen:'foto',poble:'la-torre-de-les-macanes'});
    expect(Object.isFrozen(entry)).toBe(true);
    expect(entry.titol).toContain('Pou de Neu del Rentonar');
    if(['planta','seccions'].includes(image.id)){
      expect(entry.titol).toContain('Josep Mª Segura Martí, 1987');
      expect(image.peu).toContain('Segura Martí (1987)');
      expect(image.peu).toContain('17-04-2020');
      expect(entry.titol).not.toMatch(/alçats/i);
    }else if(image.id==='fissura'){
      expect(entry.titol).toContain('Associació El Rentonar, 28-10-2020');
      expect(image.peu).toContain('28-10-2020');
      expect(image.peu).toContain('30-10-2020');
    }else{
      expect(entry.titol).toContain('Javi, 17-10-2023');
      expect(image.peu).toContain('Fotografia de Javi, 17-10-2023');
    }
    expect(Object.hasOwn(EXCLOSES,image.src)).toBe(false);
    expect(item).toMatchObject({id:idDelCens(image.src),src:image.src,title:entry.titol,kind:'image',ambit:'contingut',origen:'foto',poble:'la-torre-de-les-macanes',sectionId:'multimedia'});
    expect(merged.filter(e=>e.src===image.src)).toHaveLength(1);
    expect(origenDe(item,index)).toBe('foto');
    expect(dretsDe(item)).toBeNull();
    expect(dretsDe({...item,copyright:'Fet per la IAIA'})).toBeNull();
    for(const field of ['created_at','updated_at','copyright','creditCommons'])expect(item).not.toHaveProperty(field);
    const bytes=readFileSync(path.join(process.cwd(),'public',image.src));
    expect([...bytes.subarray(0,3)]).toEqual([0xff,0xd8,0xff]);
  }
});
