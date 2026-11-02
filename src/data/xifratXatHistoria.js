/**
 * src/data/xifratXatHistoria.js — La fixació activa i la història autenticada de
 * les claus del xat, separades (§4.4, CS-01, D-05 a; marató 261101_2143, B2a).
 *
 * Cap clau forta s'accepta automàticament, però un canvi fort d'un contacte ja no
 * tomba el fil: queda PENDENT (`canvis.pendents`), ningú no hi pot segellar
 * (`de(usuari)` torna null) i la història d'abans (la clau fixada, les
 * `anteriors` del magatzem i la cadena suau verificada) continua obrint els
 * missatges vells. `candidata(usuari)` dona la clau nova (autofirma verificada i
 * kid recalculat) per al número de seguretat. Un canvi suau avança la fixació en
 * `confirma` i queda a `canvis.suaus`. Una clau pròpia al servidor que no és la
 * d'este aparell és una alarma (`canvis.alarmes`) i el directori continua amb la
 * identitat de l'aparell per a llegir. Només la manipulació llança:
 * `historia-incoherent`, i `bifurcacio` o `kid-no-quadra` del protocol.
 */
import { creaDirectori, verificaDeclaracioClau, exigixSenseBifurcacio } from './xifratXatProtocol.js';
import { deBase64url, aBase64url } from './xifratXatCripto.js';

export const MOTIU_CANVI = Object.freeze({
  senseContinuitat: 'sense-continuitat', verificat: 'verificat', finestraRecuperacio: 'finestra-recuperacio', foraDHistoria: 'fora-d-historia'
});
export const CODI_HISTORIA_INCOHERENT = 'historia-incoherent';
const MAX_FILES_USUARI = 256;

const igual = (a,b) => a && b && a.length === b.length && a.every((v,i)=>v===b[i]);
const copia = (k) => new Uint8Array(k);
const incoherent = () => Object.assign(new Error('La història de claus servida no és coherent: manipulació.'), {codi:CODI_HISTORIA_INCOHERENT});
const msSegur = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : null);

/* Una vista de només lectura d'un Map intern (ningú de fora hi pot afegir un pendent). */
const nomesLectura = (mapa) => Object.freeze({
  get: (k) => mapa.get(k), has: (k) => mapa.has(k), get size() { return mapa.size; },
  keys: () => mapa.keys(), values: () => mapa.values(), entries: () => mapa.entries(),
  forEach: (f) => mapa.forEach((v, k) => f(v, k)), [Symbol.iterator]: () => mapa.entries()
});

export async function directoriAmbHistoria({cripto, jo, registres, usuaris, magatzem, ci, ara, exigix, declaracions=[]}) {
  const actiu=creaDirectori(cripto), historia=new Map(), desats=[];
  const pendents=new Map(), candidates=new Map(), suaus=[], alarmes=[];
  const guarda=k=>historia.set(k.usuari+':'+aBase64url(k.kid), k);
  const rellotge=()=>(typeof ara==='function'?ara():null);
  /* El kid lliga les públiques (es recalcula): cap fila sense declaració verificada entra a la història sense esta comprovació. */
  const lliga=async(fila)=>{ if(!fila.valors){ await creaDirectori(cripto).fixa(fila); exigix(); } };
  await actiu.fixa(jo); exigix(); guarda(jo);

  /* Cap enrere: la declaració autofirmada de la successora fixa kidAnterior;
     la signatura de continuïtat acredita la predecessora. No val compartir UUID. */
  const cadenaEnrere=async(inici,claus)=>{
    await lliga(inici);
    const confiades=new Map([[aBase64url(inici.kid),inici]]);
    let posterior=inici;
    for(let n=0;n<claus.length;n++) {
      const anterior=claus.find(c=>posterior.valors?.kidAnterior&&igual(c.kid,posterior.valors.kidAnterior));
      if(!anterior)break;
      const v=await verificaDeclaracioClau(cripto,{...posterior,kidServit:posterior.kid,fixada:anterior}); exigix();
      if(!v.continuitat)break;
      if(confiades.has(aBase64url(anterior.kid)))throw incoherent();
      await lliga(anterior);
      confiades.set(aBase64url(anterior.kid),anterior);posterior=anterior;
    }
    return confiades;
  };

  /* Una clau de confiança d'abans (la fixada que el servidor ja no servix, o una `anterior`)
     entra a la història amb les públiques d'una fila o d'una SDPE (el kid les lliga); si no
     n'hi ha, només amb el kid, que basta per a encadenar èpoques. Mai com a activa. */
  const guardaHistorica=async(usuari,kid,claus)=>{
    const fila=claus.find(c=>igual(c.kid,kid));
    const autor=fila?null:declaracions.find(v=>v.autor===usuari&&igual(v.kidAutor,kid));
    const candidata=fila??(autor?{usuari,kid:copia(kid),sigPub:autor.sigPubAutor,dhPub:autor.dhPubAutor}:null);
    if(candidata){ await creaDirectori(cripto).fixa(candidata); exigix(); guarda(candidata); }
    else guarda({usuari,kid:copia(kid)});
  };

  for(const usuari of new Set(usuaris)) {
    const files=registres.filter(c=>(c.usuariId??c.usuari)===usuari);
    if(files.length>MAX_FILES_USUARI) throw incoherent();
    const claus=files.map(c=>({ ...c, usuari, kid:deBase64url(c.kid,16),sigPub:deBase64url(c.sigPub,65),dhPub:deBase64url(c.dhPub,65),
      declaracio:c.declaracio?deBase64url(c.declaracio):null,autofirma:c.autofirma?deBase64url(c.autofirma):null,
      firmaContinuitat:c.firmaContinuitat?deBase64url(c.firmaContinuitat):null }));
    if(new Set(claus.map(c=>aBase64url(c.kid))).size!==claus.length)throw incoherent();
    const complets=claus.filter(c=>c.declaracio&&c.autofirma);
    exigixSenseBifurcacio(complets.map(c=>c.declaracio));
    for(const c of complets) {
      const v=await verificaDeclaracioClau(cripto,{...c,kidServit:c.kid}); exigix();
      if(v.valors.usuari!==usuari || !igual(c.sigPub,v.valors.sigPub) || !igual(c.dhPub,v.valors.dhPub))throw incoherent();
      c.valors=v.valors;
    }
    const vigents=claus.filter(c=>!c.retiradaAl);
    if(vigents.length>1)throw incoherent();
    const activa=vigents[0]??null;

    /* La meua: la clau d'este aparell ja és al directori. Si el servidor en servix una altra
       d'activa (o cap), alarma; es continua llegint amb la de l'aparell. */
    if(usuari===jo.usuari) {
      const meva=claus.find(c=>igual(c.kid,jo.kid));
      if(meva)for(const c of (await cadenaEnrere(meva,claus)).values())if(c!==meva)guarda(c);
      if(claus.length && (!activa || !igual(activa.kid,jo.kid)))alarmes.push(Object.freeze({tipus:'clau-propia',kidActiu:activa?copia(activa.kid):null}));
      continue;
    }

    const pin=await magatzem.fixacio?.(ci,usuari); exigix();
    if(pin && Array.isArray(pin.anteriors))for(const k of pin.anteriors)await guardaHistorica(usuari,k,claus);
    const ancorada=pin?claus.find(c=>igual(c.kid,pin.kid)):activa;
    /* kidFixat: la clau de partida del canvi fort; kidDesat: la fixada ara al magatzem (són
       diferents si hi ha un tram suau d'abans que `confirma` encara no ha desat). */
    const pendent=(motiu,fixat=pin.kid)=>{
      pendents.set(usuari,Object.freeze({usuari,motiu,kidFixat:copia(fixat),kidDesat:copia(pin.kid),kidNou:activa?copia(activa.kid):null,verificat:pin.verificat===true}));
      if(activa?.valors)candidates.set(usuari,Object.freeze({usuari,kid:copia(activa.kid),sigPub:copia(activa.sigPub),dhPub:copia(activa.dhPub)}));
    };
    if(!ancorada) {
      if(!pin)continue; // TOFU sense cap clau activa: encara no n'ha publicada cap.
      await guardaHistorica(usuari,pin.kid,claus);
      // Una clau purgada pot verificar història ancorada, mai rebre enviaments nous.
      if(!claus.length)continue;
      pendent(MOTIU_CANVI.foraDHistoria);
      continue;
    }
    const confiades=await cadenaEnrere(ancorada,claus);
    // Cap avant: només els passos suaus avancen; el primer que no ho és atura la cadena.
    let actual=ancorada, forta=null;
    for(let n=0;n<claus.length;n++) {
      const seguent=claus.find(c=>c.valors?.kidAnterior&&igual(c.valors.kidAnterior,actual.kid));
      if(!seguent)break;
      const v=await verificaDeclaracioClau(cripto,{...seguent,kidServit:seguent.kid,fixada:{...actual,verificat:pin?.verificat===true},
        ara:rellotge(),alertaRecuperacioMs:msSegur(seguent.alertaRecuperacioMs)}); exigix();
      if(v.canvi!=='suau'){forta=v;break;}
      if(confiades.has(aBase64url(seguent.kid)))throw incoherent();
      confiades.set(aBase64url(seguent.kid),seguent);actual=seguent;
    }
    if(!pin && (forta || actual!==ancorada))throw incoherent(); // una successora de la clau activa
    if(forta || !activa || !igual(actual.kid,activa.kid)) {
      // Pendent: la història d'abans es conserva, la clau nova no rep res fins a l'acceptació.
      for(const c of confiades.values())guarda(c);
      /* B2a-ARB-01 · El tram suau d'abans del pas fort (fixada → actual) s'accepta sol (§2.1.1):
         es desa a confirma i el pendent parteix d'actual. Així l'acceptació el guarda a
         `anteriors` i la història escrita amb eixa clau sobreviu (R5). Mai la clau nova. */
      const tram=actual!==ancorada;
      if(tram && magatzem.fixa){ const kid=actual.kid, anterior=pin.kid; desats.push({usuari,desa:async()=>{exigix();await magatzem.fixa(ci,{usuari,kid,vistAl:ara()},{anterior});exigix();}}); }
      pendent(pin.verificat===true?MOTIU_CANVI.verificat:(forta?.continuitat?MOTIU_CANVI.finestraRecuperacio:MOTIU_CANVI.senseContinuitat), tram?actual.kid:pin.kid);
      continue;
    }
    // fixa recalcula el kid fins i tot per a la primera TOFU sense declaració històrica.
    await actiu.fixa(actual); exigix();
    for(const c of confiades.values())guarda(c);
    if(pin && !igual(actual.kid,pin.kid))suaus.push(Object.freeze({usuari,kidAnterior:copia(pin.kid),kidNou:copia(actual.kid)}));
    if(magatzem.fixa) {
      desats.push({usuari,desa:async()=>{exigix();await magatzem.fixa(ci,{usuari,kid:actual.kid,verificat:pin?.verificat===true,vistAl:ara()}, {anterior:pin?.kid??null});exigix();}});
    }
  }
  const canvis=Object.freeze({pendents:nomesLectura(pendents),suaus:Object.freeze(suaus),alarmes:Object.freeze(alarmes)});
  return Object.freeze({
    de:actiu.de, usuaris:actiu.usuaris, historica:(u,k)=>historia.get(u+':'+aBase64url(k))??null,
    candidata:(u)=>candidates.get(u)??null, canvis,
    confirma:async(usuarisValidats)=>{for(const p of desats)if(usuarisValidats.has(p.usuari))await p.desa();}
  });
}
