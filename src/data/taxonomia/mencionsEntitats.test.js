import { describe, expect, it } from 'vitest';
import { creaParserMencions, creaGrafMencions, validaSubgrupsEntitat } from './mencionsEntitats.js';
const entitats = [{id:'rentonar',slug:'el-rentonar',nom:'El Rentonar'}, {id:'muntanya',slug:'seccio-de-muntanya',nom:'Secció de Muntanya',entitatMareId:'rentonar'}];
describe('IDEA-368 · mencions cíviques', () => {
  it('resol noms compostos i slugs coneguts sense convertir #etiquetes ni correus en mencions', () => {
    const text = 'Hola @El Rentonar! #el-rentonar a@el-rentonar @el-rentonarx i @seccio-de-muntanya.';
    const mencions = creaParserMencions(entitats)(text);
    expect(mencions.map(m=>m.id)).toEqual(['rentonar','muntanya']);
    expect(mencions.map(m=>text.slice(m.inici,m.fi))).toEqual(['@El Rentonar','@seccio-de-muntanya']);
  });
  it('recorre 100k entrades adversarials i conserva Unicode', () => {
    const parse = creaParserMencions(entitats);
    expect(parse('@'.repeat(100000))).toEqual([]);
    expect(parse(('@El Rentona '.repeat(10000))+'@Secció de Muntanya').map(m=>m.id)).toEqual(['muntanya']);
  });
  it('separa autoria i menció; desvincular no esborra el post ni accepta una altra entitat', async () => {
    const posts = [{id:'propi',author_org_id:'rentonar',isPublished:true,content:'@El Rentonar'}, {id:'citat',author_org_id:'altre',isPublished:true,content:'@El Rentonar'}, {id:'privat',isPublished:true,visibility:'private',content:'@El Rentonar'}, {id:'draft',isPublished:false,content:'@El Rentonar'}];
    const copia = structuredClone(posts);
    const graf=creaGrafMencions({entitats,resolAutorEntitat:p=>p.author_org_id,autoritzaDesvinculacio: async id=>id==='rentonar'});
    graf.indexaPublicacions(posts);
    expect(graf.llistaPublicacionsEntitat('rentonar')).toEqual({propies:['propi'],mencions:['citat']});
    await expect(graf.desvinculaMencio('muntanya','citat')).rejects.toMatchObject({code:'sense-permis'});
    await graf.desvinculaMencio('rentonar','citat');
    expect(graf.llistaPublicacionsEntitat('rentonar')).toEqual({propies:['propi'],mencions:[]});
    expect(posts).toEqual(copia);
  });
  it('refusa cicles, mares absents i àlies ambigus', () => {
    expect(validaSubgrupsEntitat(entitats)[1]).toEqual({id:'muntanya',entitatMareId:'rentonar'});
    expect(()=>validaSubgrupsEntitat([{id:'a',entitatMareId:'b'},{id:'b',entitatMareId:'a'}])).toThrow();
    expect(()=>validaSubgrupsEntitat([{id:'a',entitatMareId:'b'}])).toThrow();
    expect(()=>creaParserMencions([...entitats,{id:'intrus',slug:'el-rentonar',nom:'Intrús'}])).toThrow();
  });
  it('un autorEntitatId enviat dins del post no suplanta l’autoria del padró',()=>{
    const graf=creaGrafMencions({entitats});graf.indexaPublicacions([{id:'fals',isPublished:true,autorEntitatId:'rentonar',content:'@El Rentonar'}]);
    expect(graf.llistaPublicacionsEntitat('rentonar')).toEqual({propies:[],mencions:['fals']});
  });
  it('cap marcador privat, draft, no llistat o malformat filtra mencions encara que isPublished siga true',()=>{
    const graf=creaGrafMencions({entitats});
    const states=[{status:'draft'},{estat:'esborrany'},{status:{}},{visibility:'unlisted'},{visibility:null},{private:true},{draft:true},{isDraft:true},{esborrany:true},{is_published:false},{published:false},{attributes:{visibility:'private'}},{payload:{status:'draft'}},{attributes:[]}];
    const posts=states.map((s,i)=>({id:'privat-'+i,isPublished:true,content:'@El Rentonar',...s}));
    posts.push(Object.defineProperty({id:'getter',isPublished:true,content:'@El Rentonar'},'status',{get(){throw new Error('No s’ha d’executar');},enumerable:true}));
    graf.indexaPublicacions(posts);expect(graf.llistaPublicacionsEntitat('rentonar')).toEqual({propies:[],mencions:[]});
  });
  it('confirma i restaura les desvinculacions persistides sense mutar la publicació',async()=>{
    let storage=[]; const posts=[{id:'citat',isPublished:true,content:'@El Rentonar'}], original=structuredClone(posts);
    const options={entitats,autoritzaDesvinculacio:()=>true,carregaDesvinculacions:async()=>structuredClone(storage),desaDesvinculacions:async rows=>{storage=structuredClone(rows);}};
    const graf=creaGrafMencions(options);await graf.prepara();graf.indexaPublicacions(posts);await graf.desvinculaMencio('rentonar','citat');
    expect(graf.exportaDesvinculacions()).toEqual([{entitatId:'rentonar',publicacioId:'citat'}]);
    const restarted=creaGrafMencions(options);await restarted.prepara();restarted.indexaPublicacions(posts);
    expect(restarted.llistaPublicacionsEntitat('rentonar').mencions).toEqual([]);expect(posts).toEqual(original);
    const denied=creaGrafMencions({...options,autoritzaDesvinculacio:()=>false});await denied.prepara();denied.indexaPublicacions(posts);await expect(denied.desvinculaMencio('rentonar','citat')).rejects.toMatchObject({code:'sense-permis'});
  });
  it('un desament fallit no anuncia desvinculació i els dos desats concurrents conserven tots els vincles',async()=>{
    let storage=[];const posts=[{id:'a',isPublished:true,content:'@El Rentonar'},{id:'b',isPublished:true,content:'@El Rentonar'}];
    const failed=creaGrafMencions({entitats,autoritzaDesvinculacio:()=>true,desaDesvinculacions:async()=>{throw new Error('Disc no disponible');}});failed.indexaPublicacions(posts);
    await expect(failed.desvinculaMencio('rentonar','a')).rejects.toThrow('Disc no disponible');expect(failed.llistaPublicacionsEntitat('rentonar').mencions).toEqual(['a','b']);
    const graf=creaGrafMencions({entitats,autoritzaDesvinculacio:()=>true,desaDesvinculacions:async rows=>{storage=structuredClone(rows);}});graf.indexaPublicacions(posts);
    await Promise.all(['a','b'].map(id=>graf.desvinculaMencio('rentonar',id)));expect(storage).toHaveLength(2);
  });
  it('majúscules Unicode amb expansió conserven els offsets originals',()=>{
    const parse=creaParserMencions([{id:'istanbul',slug:'istanbul',nom:'İstanbul'}]);
    expect(parse('Hola @İstanbul!').map(m=>[m.id,m.inici,m.fi])).toEqual([['istanbul',5,14]]);
  });
  /* v1.2.26 · #8 P2 (Gauntlet C26-3) · Les tres esmenes: fila d'entitat desconeguda omesa i conservada, graf tancat
     mentre no està preparat i els marcadors de mur_public_eligible al filtre publica(). */
  it('una fila persistida d’una entitat donada de baixa no bloqueja el lot: s’omet, la vàlida s’aplica i totes dues tornen a eixir en exportar i en desar',async()=>{
    let storage=[{entitatId:'rentonar',publicacioId:'citat'},{entitatId:'entitat-donada-de-baixa',publicacioId:'altre'}];
    const posts=[{id:'citat',isPublished:true,content:'@El Rentonar'},{id:'nou',isPublished:true,content:'@El Rentonar'}];
    const graf=creaGrafMencions({entitats,autoritzaDesvinculacio:()=>true,carregaDesvinculacions:async()=>structuredClone(storage),desaDesvinculacions:async rows=>{storage=structuredClone(rows);}});
    await expect(graf.prepara()).resolves.toBeUndefined();graf.indexaPublicacions(posts);
    expect(graf.llistaPublicacionsEntitat('rentonar').mencions).toEqual(['nou']);
    expect(graf.exportaDesvinculacions()).toEqual([{entitatId:'rentonar',publicacioId:'citat'},{entitatId:'entitat-donada-de-baixa',publicacioId:'altre'}]);
    await graf.desvinculaMencio('rentonar','nou');
    expect(graf.llistaPublicacionsEntitat('rentonar').mencions).toEqual([]);
    expect(storage).toEqual(expect.arrayContaining([{entitatId:'rentonar',publicacioId:'citat'},{entitatId:'rentonar',publicacioId:'nou'},{entitatId:'entitat-donada-de-baixa',publicacioId:'altre'}]));
    expect(storage).toHaveLength(3);
    await expect(graf.desvinculaMencio('entitat-donada-de-baixa','altre')).rejects.toMatchObject({code:'sense-permis'});
  });
  it('mentre la càrrega no ha acabat, o si ha fallat, la llista i l’exportació fallen tancades',async()=>{
    let resol;const pendent=new Promise(r=>{resol=r;});const posts=[{id:'citat',isPublished:true,content:'@El Rentonar'}];
    const graf=creaGrafMencions({entitats,carregaDesvinculacions:()=>pendent});graf.indexaPublicacions(posts);
    expect(()=>graf.llistaPublicacionsEntitat('rentonar')).toThrow(expect.objectContaining({code:'no-disponible'}));
    expect(()=>graf.exportaDesvinculacions()).toThrow(expect.objectContaining({code:'no-disponible'}));
    resol([{entitatId:'rentonar',publicacioId:'citat'}]);await graf.prepara();
    expect(graf.llistaPublicacionsEntitat('rentonar')).toEqual({propies:[],mencions:[]});
    for(const carrega of[async()=>[{entitatId:{},publicacioId:'citat'}],async()=>[{entitatId:'rentonar',publicacioId:''}],async()=>'no és una llista',async()=>{throw new Error('Disc no disponible');}]){
      const trencat=creaGrafMencions({entitats,autoritzaDesvinculacio:()=>true,carregaDesvinculacions:carrega});trencat.indexaPublicacions(posts);
      await expect(trencat.prepara()).rejects.toThrow();
      expect(()=>trencat.llistaPublicacionsEntitat('rentonar')).toThrow(expect.objectContaining({code:'no-disponible'}));
      expect(()=>trencat.exportaDesvinculacions()).toThrow(expect.objectContaining({code:'no-disponible'}));
      await expect(trencat.desvinculaMencio('rentonar','citat')).rejects.toThrow();
    }
  });
  it('una peça moderada, esborrada o retirada no és menció, ni en la capa de dalt ni dins d’attributes o payload',()=>{
    const graf=creaGrafMencions({entitats});
    const marques=[{moderation_state:'ocult'},{moderation_state:'retirada_cautelar'},{moderation_state:null},{deleted:true},{deleted:'false'},{deleted_at:'2026-11-26T05:00:00Z'},{deletedAt:'2026-11-26T05:00:00Z'},{retirada:true},{retirada:null},
      {payload:{moderation_state:'ocult'}},{attributes:{deleted:true}},{payload:{deleted_at:'2026-11-26T05:00:00Z'}},{attributes:{retirada:true}}];
    const posts=marques.map((s,i)=>({id:'amagat-'+i,isPublished:true,content:'@El Rentonar',...s}));
    posts.push(Object.defineProperty({id:'getter',isPublished:true,content:'@El Rentonar'},'moderation_state',{get(){throw new Error('No s’ha d’executar');},enumerable:true}));
    posts.push({id:'visible',isPublished:true,content:'@El Rentonar',moderation_state:'visible',deleted:false,deleted_at:null,deletedAt:null,retirada:false,payload:{moderation_state:'visible',deleted:false}});
    graf.indexaPublicacions(posts);expect(graf.llistaPublicacionsEntitat('rentonar')).toEqual({propies:[],mencions:['visible']});
  });

});
