/** Fixació activa i història autenticada, separades. Cap clau forta s'accepta automàticament. */
import { creaDirectori, verificaDeclaracioClau, exigixSenseBifurcacio } from './xifratXatProtocol.js';
import { deBase64url, aBase64url } from './xifratXatCripto.js';
const igual = (a,b) => a && b && a.length === b.length && a.every((v,i)=>v===b[i]);
const error = () => Object.assign(new Error('La història de claus no encadena amb la fixació de confiança.'), {codi:'kid-no-fixat'});

export async function directoriAmbHistoria({cripto, jo, registres, usuaris, magatzem, ci, ara, exigix, declaracions=[]}) {
  const actiu=creaDirectori(cripto), historia=new Map(),pendents=[];
  const guarda=k=>historia.set(k.usuari+':'+aBase64url(k.kid), k);
  await actiu.fixa(jo); exigix(); guarda(jo);
  for(const usuari of new Set(usuaris)) {
    const files=registres.filter(c=>(c.usuariId??c.usuari)===usuari);
    if(files.length>256) throw error();
    const claus=files.map(c=>({ ...c, usuari, kid:deBase64url(c.kid,16),sigPub:deBase64url(c.sigPub,65),dhPub:deBase64url(c.dhPub,65),
      declaracio:c.declaracio?deBase64url(c.declaracio):null,autofirma:c.autofirma?deBase64url(c.autofirma):null,
      firmaContinuitat:c.firmaContinuitat?deBase64url(c.firmaContinuitat):null }));
    if(new Set(claus.map(c=>aBase64url(c.kid))).size!==claus.length)throw error();
    const complets=claus.filter(c=>c.declaracio&&c.autofirma);
    exigixSenseBifurcacio(complets.map(c=>c.declaracio));
    for(const c of complets) {
      const v=await verificaDeclaracioClau(cripto,{...c,kidServit:c.kid}); exigix();
      if(v.valors.usuari!==usuari || !igual(c.sigPub,v.valors.sigPub) || !igual(c.dhPub,v.valors.dhPub))throw error();
      c.valors=v.valors;
    }
    const pin=usuari===jo.usuari?{kid:jo.kid,verificat:false}:await magatzem.fixacio?.(ci,usuari); exigix();
    const vigents=claus.filter(c=>!c.retiradaAl);
    if(vigents.length>1)throw error();
    let ancorada=pin?claus.find(c=>igual(c.kid,pin.kid)):vigents[0];
    if(!ancorada) {
      if(usuari===jo.usuari&&!claus.length)continue;
      if(pin && !claus.length) {
        const autor=declaracions.find(v=>v.autor===usuari&&igual(v.kidAutor,pin.kid));
        if(autor) {
          const candidata={usuari,kid:pin.kid,sigPub:autor.sigPubAutor,dhPub:autor.dhPubAutor};
          const comprovador=creaDirectori(cripto);await comprovador.fixa(candidata);exigix();guarda(candidata);
        } else guarda({usuari,kid:pin.kid});
        continue; // Una clau purgada pot verificar història ancorada, mai rebre enviaments nous.
      }
      if(pin)throw error();continue;
    }
    const confiades=new Map([[aBase64url(ancorada.kid),ancorada]]);
    // Cap enrere: la declaració autofirmada de la successora fixa kidAnterior;
    // la signatura de continuïtat acredita la predecessora. No val compartir UUID.
    let posterior=ancorada;
    for(let n=0;n<claus.length;n++) {
      const anterior=claus.find(c=>posterior.valors?.kidAnterior&&igual(c.kid,posterior.valors.kidAnterior));
      if(!anterior)break;
      const v=await verificaDeclaracioClau(cripto,{...posterior,kidServit:posterior.kid,fixada:anterior}); exigix();
      if(!v.continuitat)break;
      if(confiades.has(aBase64url(anterior.kid)))throw error();
      confiades.set(aBase64url(anterior.kid),anterior);posterior=anterior;
    }
    // Cap avant: una fixació verificada o un canvi sense continuïtat queda tancat.
    let actual=ancorada;
    for(let n=0;n<claus.length;n++) {
      const seguent=claus.find(c=>c.valors?.kidAnterior&&igual(c.valors.kidAnterior,actual.kid));
      if(!seguent)break;
      const v=await verificaDeclaracioClau(cripto,{...seguent,kidServit:seguent.kid,fixada:{...actual,verificat:pin?.verificat===true}}); exigix();
      if(v.canvi!=='suau')throw error();
      if(confiades.has(aBase64url(seguent.kid)))throw error();
      confiades.set(aBase64url(seguent.kid),seguent);actual=seguent;
    }
    if(vigents.length!==1 || !igual(actual.kid,vigents[0].kid) || (usuari===jo.usuari&&!igual(actual.kid,jo.kid)))throw error();
    // fixa recalcula el kid fins i tot per a la primera TOFU sense declaració històrica.
    await actiu.fixa(actual); exigix();
    for(const c of confiades.values())guarda(c);
    if(usuari!==jo.usuari && magatzem.fixa) {
      pendents.push({usuari,desa:async()=>{exigix();await magatzem.fixa(ci,{usuari,kid:actual.kid,verificat:pin?.verificat===true,vistAl:ara()}, {anterior:pin?.kid??null});exigix();}});
    }
  }
  return Object.freeze({de:actiu.de,usuaris:actiu.usuaris,historica:(u,k)=>historia.get(u+':'+aBase64url(k))??null, confirma:async(usuarisValidats)=>{for(const p of pendents)if(usuarisValidats.has(p.usuari))await p.desa();}});
}
