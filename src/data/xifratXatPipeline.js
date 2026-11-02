import { directoriAmbHistoria } from './xifratXatHistoria.js';
/**
 * src/data/xifratXatPipeline.js — El motor del pipeline extrem a extrem del
 * xat xifrat (`sdp-xat-v1`, P1-12 Fase 4; pla 261029_1305, Bloc C, E1.1–E1.3;
 * disseny §4.5, §4.6, §4.7, §8.2, §8.6, §18 D-09 i §21.1). El decorador
 * (xifratXat.js) el crea quan l'entorn porta WebCrypto i IndexedDB i el crida
 * dins de les guardes d'àmbit; este mòdul no coneix React ni cap global.
 *
 * Què fa:
 *   · Context d'un fil: la meua identitat (del magatzem), el directori amb les
 *     claus públiques dels membres (clausDeXat, transport opac) i la cadena
 *     d'èpoques aplicada amb els meus sobres (epoquesDelFilXat + sobresMeusXat).
 *   · Enviament: gènesi dins del mateix enviament si el fil no té època
 *     (epocaNova viatja amb el missatge), xifraMissatge i el sobre `xifrat`
 *     en base64url ({ v, epoca, iv, ct, kid, tf }); text: null.
 *   · Recepció i historial: obriMissatge per fila amb memòria cau per
 *     (fil, id) sota l'àmbit (el sondeig torna les mateixes files).
 *   · La cua F7 (safata del magatzem): quan les claus estan bloquejades
 *     (sense identitat en este aparell o malmesa) el missatge s'encua amb el
 *     seu MATEIX id; drena() els envia en ordre d'arribada, un a un, i s'atura
 *     a la primera fallada sense reordenar ni enviar dos vegades.
 *   · Adjunts: xatMultimediaXifrat.js (xifrar abans de pujar, hash abans de
 *     desxifrar) i un índex d'adjunts rebuts per a urlAdjuntXat.
 *   · Oblit (D-09): RAM, IndexedDB (reintent del magatzem; OBLIT_FALLIT si
 *     el navegador bloqueja l'esborrat), sessió i preferències (els magatzems
 *     web els injecta qui crida: `sessio` i `preferencies`), amb un estat
 *     explícit i mai un èxit fals.
 *   · Canvis de clau (§4.4, CS-01, D-05 a; B2a, marató 261101_2143): un canvi
 *     fort d'un contacte queda pendent al directori, bloqueja l'enviament
 *     (clau-canviada-forta, mai a la safata) i deixa llegir la història d'abans;
 *     acceptaCanviDelFil el fixa per a la persona. L'alarma de la clau pròpia
 *     bloqueja tot enviament (clau-propia-alarma).
 *
 * Fora d'esta onada (es rebutja amb codi, mai en clar): els fils amb entitat
 * (equip signat, §4.8), l'alta de la identitat amb la frase (F2a, §5) i la
 * rotació d'època d'un fil on no sóc membre.
 */
import { aBase64url, bytesIguals, deBase64url, exigixCripto, numeroSeguretatParell, sha256 } from './xifratXatCripto.js';
import { MOTIU_EPOCA, ROL_EPOCA, TIPUS_FIL } from './xifratXatFormats.js';
import { CODI, aplicaEpoca, creaDirectori, creaEpoca, esErrorProtocol, estatFilNou, obriMissatge, publiquesDe, xifraMissatge } from './xifratXatProtocol.js';
import { llegixEpoca } from './xifratXatFormats.js';
import { desxifraAdjuntXat, errorPressupostBlobs, metadadesAdjuntDe, midaBlobAdjunt, TIPUS_DE_CLASSE, xifraAdjuntXat } from './xatMultimediaXifrat.js';

export const VERSIO_SOBRE = 1;
export const PREFIX_CLAUS_XAT = 'sdp_xat_';
export const CODI_MOTOR = Object.freeze({
  senseAmbit: 'sense-ambit', clausBloquejades: 'claus-bloquejades', clauAbsent: 'clau-absent-del-contacte',
  equipPendent: 'equip-pendent', filSenseMembres: 'fil-sense-membres', senseCapacitat: 'sense-capacitat-e2ee',
  ecoNoQuadra: 'eco-no-quadra', encuat: 'encuat',
  /* Pas 17 (pla 261101_1246, T7 · S5) · El número de seguretat (§4.4). */
  numeroNoDirecte: 'numero-no-directe', senseClauAltre: 'sense-clau-altre', kidCanviat: 'kid-canviat',
  /* B2a (marató 261101_2143) · Canvis de clau (§4.4, CS-01, D-05 a). */
  clauCanviadaForta: 'clau-canviada-forta', clauPropiaAlarma: 'clau-propia-alarma',
  clauNovaSenseConfirmar: 'clau-nova-sense-confirmar', historiaIncoherent: 'historia-incoherent'
});
/* Una fila tancada per un d'estos codis, d'un autor amb un canvi fort pendent, és de la clau nova sense confirmar. */
const CODIS_CLAU_NOVA = new Set([CODI.kidNoFixat, CODI.epocaDesconeguda, 'epoca-saltada']);
export const ESTAT_OBLIT = Object.freeze({ oblidat: 'oblidat', fallit: 'OBLIT_FALLIT' });

const TIPUS_DEL_FIL = Object.freeze({ directe: TIPUS_FIL.directe, grup: TIPUS_FIL.grup, entitat: TIPUS_FIL.entitat });
/* El motiu d'una època que no és la gènesi: el primer de MOTIU_EPOCA que no ho és. */
const MOTIU_ROTACIO = MOTIU_EPOCA.rotacio ?? Object.values(MOTIU_EPOCA).find((m) => m !== MOTIU_EPOCA.genesi) ?? null;

function errorMotor(codi, missatge, extres = {}) {
  const error = new Error(missatge);
  error.codi = codi;
  return Object.assign(error, extres);
}
const esAmbitCanviat = (error) => error?.codi === 'ambit-canviat' || error?.name === 'AbortError';
const bloquejat = (codi, missatge, cause) => errorMotor(codi, missatge, { reintentable: true, encuable: true, ...(cause ? { cause } : {}) });

/* ── Format de filferro (base64url; el servidor no en llig res) ─────────── */

export function serialitzaXifrat(fila) {
  return Object.freeze({
    v: VERSIO_SOBRE, epoca: fila.epoca, iv: aBase64url(fila.iv), ct: aBase64url(fila.ct), kid: aBase64url(fila.kid), tf: aBase64url(fila.tf)
  });
}

/** La fila del protocol a partir d'un missatge del port amb `xifrat`. */
export function desserialitzaXifrat(missatge, filId) {
  const x = missatge?.xifrat;
  if (!x || typeof x !== 'object' || x.v !== VERSIO_SOBRE) throw errorMotor('sobre-invalid', 'El sobre del missatge no té la versió esperada.');
  return {
    fil: filId, id: missatge.id, emissor: missatge.usuariId ?? missatge.emissor, kid: deBase64url(x.kid, 16),
    comOrg: missatge.comOrgId ?? null, epoca: x.epoca, respostaA: missatge.respostaA ?? null,
    tf: deBase64url(x.tf), iv: deBase64url(x.iv, 12), ct: deBase64url(x.ct)
  };
}

export function serialitzaEpoca(genesi) {
  return Object.freeze({
    epoca: genesi.epoca, declaracio: aBase64url(genesi.declaracio), firma: aBase64url(genesi.firma),
    sobres: genesi.sobres.map((s) => Object.freeze({ receptor: s.receptor, kidReceptor: aBase64url(s.kidReceptor), enc: aBase64url(s.enc), ct: aBase64url(s.ct) }))
  });
}

export const desserialitzaSobre = (s) => ({ ...(s.alternatiu===true?{alternatiu:true,filId:s.filId,epoca:s.epoca,emissorId:s.emissorId}:{}), receptor: s.receptor, kidReceptor: deBase64url(s.kidReceptor, 16), enc: deBase64url(s.enc), ct: deBase64url(s.ct) });

/* ── El motor ────────────────────────────────────────────────────────────── */

export function creaMotorXifrat({ cripto, impl, servei, magatzem, ara = () => Date.now(), creaBlob = null, creaUrl = null } = {}) {
  exigixCripto(cripto);
  if (!impl || typeof impl !== 'object') throw new TypeError('Cal la implementació del backend.');
  if (!servei || typeof servei.estatAmbit !== 'function') throw new TypeError('Cal el servei d’àmbit del decorador.');
  if (!magatzem || typeof magatzem.identitat !== 'function') throw new TypeError('Cal el magatzem de claus.');

  const claus = () => {
    const { clauIdentitat, ambitEstable } = servei.estatAmbit();
    let parts = null;
    try { parts = JSON.parse(ambitEstable); } catch { /* sense àmbit */ }
    if (!clauIdentitat || !Array.isArray(parts) || parts.length !== 3) throw errorMotor(CODI_MOTOR.senseAmbit, 'Cal fixar l’àmbit abans d’operar en un fil xifrat.');
    return { ci: clauIdentitat, joId: parts[1], actor: parts[2] };
  };

  /* La meua identitat d'este aparell; sense ella (o malmesa) les claus estan bloquejades: s'encua. */
  const identitat = async (ci) => {
    let jo;
    try { jo = await magatzem.identitat(ci); } catch (error) {
      throw bloquejat(CODI_MOTOR.clausBloquejades, 'Les claus del xat d’este aparell no es poden llegir: cal restaurar-les.', error);
    }
    if (!jo || typeof jo !== 'object') throw bloquejat(CODI_MOTOR.clausBloquejades, 'Encara no hi ha claus del xat en este aparell.');
    return jo;
  };

  const membresDe = (fil, joId) => {
    const altres = Array.isArray(fil?.altres) ? fil.altres : [];
    const ids = new Set(altres.filter((p) => p && (p.tipus === 'persona' || p.tipus === undefined) && typeof p.id === 'string').map((p) => p.id));
    ids.delete(joId);
    return [joId, ...ids];
  };


  const exigixTransport = (nom) => {
    if (typeof impl[nom] !== 'function') throw errorMotor(CODI_MOTOR.senseCapacitat, `El backend no exposa ${nom}.`, { reintentable: false });
  };

  /** El context d'un fil (estat del protocol, directori, jo, membres), construït una vegada per àmbit. */
  const contextDelFil = async ({ fil, tipusFil, config, exigix, refresca = false }) => {
    const desat = servei.estatFilDesat(fil.id);
    if (desat && !refresca) return desat;
    const { ci, joId } = claus();
    const tipus = TIPUS_DEL_FIL[tipusFil];
    if (tipus === undefined) throw errorMotor('tipus-de-fil', 'Este tipus de fil no es pot xifrar.', { reintentable: false });
    if (tipus === TIPUS_FIL.entitat) throw errorMotor(CODI_MOTOR.equipPendent, 'Els fils amb una entitat necessiten l’equip signat (§4.8): encara no es xifren.', { reintentable: false });
    const jo = await identitat(ci);
    exigix();
    if (jo.usuari !== joId) throw bloquejat(CODI_MOTOR.clausBloquejades, 'Les claus d’este aparell són d’una altra persona.');
    let rols=membresDe(fil,joId).map(usuari=>({usuari,rol:ROL_EPOCA.membre}));
    if(tipus===TIPUS_FIL.grup) {
      exigixTransport('estatXifratXat');
      const [remot]=await impl.estatXifratXat([fil.id],{...config,ambMembres:true}); exigix();
      rols=remot?.membres;
      if(!Array.isArray(rols)||rols.length<1||rols.length>256||new Set(rols.map(m=>m.usuari)).size!==rols.length||!rols.some(m=>m.usuari===joId)||!rols.every(m=>typeof m.usuari==='string'&&Object.values(ROL_EPOCA).includes(m.rol)))throw errorMotor('roster-invalid','No hi ha un roster canònic complet.');
    }
    const membres=rols.map(m=>m.usuari);
    const ancorat=await magatzem.filXifrat?.(ci,fil.id)??null;exigix();
    exigixTransport('epoquesDelFilXat');
    const des=desat?.estat.ultima?.epoca??0;
    const epoques=[...(await impl.epoquesDelFilXat(fil.id,des,config)??[])].filter(e=>e.epoca>des).sort((a,b)=>a.epoca-b.epoca); exigix();
    const declaracions=[...[...(desat?.estat.epoques.values()??[])].map(e=>e.valors),...epoques.map(e=>llegixEpoca(deBase64url(e.declaracio)))];
    // Inclou els membres històrics; l'autoritat prové sempre de la SDPE signada.
    const usuaris=new Set(membres);
    for(const e of declaracions)for(const m of e.membres)usuaris.add(m.usuari);
    exigixTransport('clausDeXat');
    const publiques=[];const ids=[...usuaris];
    for(let i=0;i<ids.length;i+=256){publiques.push(...(await impl.clausDeXat(ids.slice(i,i+256),config)??[]));exigix();}
    /* G2-A-seg-01 · El cap ancorat abans d'esta construcció és el límit de les claus substituïdes per un canvi fort. */
    const directori=await directoriAmbHistoria({cripto,jo,registres:Array.isArray(publiques)?publiques:[],usuaris,magatzem,ci,ara,exigix,declaracions,capAncorat:ancorat?.epoca??0}); exigix();
    const estat=desat?{...desat.estat,epoques:new Map(desat.estat.epoques),vistos:new Set(desat.estat.vistos)}:estatFilNou({fil:fil.id,tipusFil:tipus});
    exigix();
    if (epoques.length) {
      exigixTransport('sobresMeusXat');
      const sobres=[];
      for(let i=0;i<epoques.length;i+=256){sobres.push(...(await impl.sobresMeusXat(fil.id,epoques.slice(i,i+256).map(e=>e.epoca),{...config,kidReembolcall:aBase64url(jo.kid)})??[]));exigix();}
      for (const e of epoques) {
        try {
        await aplicaEpoca(cripto, {
          estat, jo, declaracio: deBase64url(e.declaracio), firma: deBase64url(e.firma), directori, vigent: exigix,
          sobres: sobres.filter((s) => s.epoca === e.epoca).map(desserialitzaSobre)
        });
        } catch(error) {if(esAmbitCanviat(error)||!esErrorProtocol(error))throw error;}

      }
    }
    /* Gauntlet c2 (C1) · Entre l'última guarda d'aplicaEpoca i ací l'àmbit pot haver canviat:
       el context (amb la meua identitat) mai no entra a la RAM d'un altre àmbit. */
    exigix();
    if(ancorat && (!estat.cap || estat.cap.epoca<ancorat.epoca || aBase64url(estat.epoques.get(ancorat.epoca)?.hash??new Uint8Array())!==aBase64url(ancorat.hash)))throw errorMotor('cap-retrocedix','La cadena remota no conté el cap verificat d’este aparell.');
    // Només després de totes les firmes, cadena i sobres: cap fixació motivada
    // per una SDPE rebutjada no queda persistent.
    if(!declaracions.length || estat.cap){
      const validats=new Set([...membres,...[...estat.epoques.values()].flatMap(e=>[...e.membres.keys()])]);
      await directori.confirma(validats);exigix();
      /* G2-A-integ-01 · La fixació ja ha avançat: l'avís del canvi suau queda al servei de l'àmbit
         fins que la interfície el llig (canvisDelFil), siga qui siga qui ha construït el context. */
      for(const s of directori.canvis.suaus)if(validats.has(s.usuari))servei.anotaAvisSuau?.(s);
    }
    exigix();
    if(estat.cap && (!ancorat || estat.cap.epoca>ancorat.epoca) && magatzem.avancaCap){await magatzem.avancaCap(ci,fil.id,{anterior:ancorat,nou:{epoca:estat.cap.epoca,hash:estat.cap.hash}});exigix();}
    const context = { estat, directori, canvis: directori.canvis, jo, membres, rols, fil, tipusFil, capPersistent:estat.cap?{epoca:estat.cap.epoca,hash:estat.cap.hash}:ancorat };
    servei.desaEstatFil(fil.id, context);
    return context;
  };

  const confirmacions = new WeakMap();

  const normalitzaCos = (cos) => (typeof cos === 'string' ? { text: cos } : (cos && typeof cos === 'object' ? cos : { text: null }));

  /* B2a (§4.4, CS-01) · Cap època ni cap missatge mentre hi ha una alarma de la clau pròpia o
     un canvi fort pendent d'un membre (d'ara o de qualsevol època vista): mai a la safata, que
     l'enviaria sol després d'acceptar (R3), i mai segellat per a una clau no confirmada (R2). */
  const exigixSenseCanvis = (ctx) => {
    const canvis = ctx?.canvis;
    if (!canvis) return;
    if (canvis.alarmes.length) {
      throw errorMotor(CODI_MOTOR.clauPropiaAlarma, 'S’ha registrat una clau nova per al teu compte que no és d’este aparell.', { reintentable: false, encuable: false });
    }
    const membres = new Set([...ctx.membres, ...[...ctx.estat.epoques.values()].flatMap((e) => [...e.membres.keys()])]);
    for (const usuari of membres) {
      const p = canvis.pendents.get(usuari);
      if (p) {
        throw errorMotor(CODI_MOTOR.clauCanviadaForta, 'La clau de seguretat d’esta persona ha canviat: cal confirmar-la abans d’escriure.', {
          reintentable: false, encuable: false, usuari, motiu: p.motiu, kidNou: p.kidNou ? aBase64url(p.kidNou) : null
        });
      }
    }
  };

  /** El paquet xifrat d'un enviament; amb la gènesi (epocaNova) si el fil encara no té època meua. */
  const prepara = async ({ fil, tipusFil, cos, config, exigix }) => {
    const entrada = normalitzaCos(cos);
    const id = typeof entrada.id === 'string' ? entrada.id : cripto.randomUUID();
    /* Cicle 4 (tancament, e2ee-index-adjunts) · Un adjunt és del missatge que el porta: `a.id`
       és l'id de la fila (publicaAdjunt i el blob al servidor). Qui rep tanca la fila que no ho
       complix; ací no s'arriba ni a enviar-la. */
    if (entrada.a && entrada.a.id !== id) throw errorMotor(CODI.adjuntIncoherent, 'L’adjunt no és d’este missatge.', { reintentable: false });
    // Refresca abans d'enviar: altes, baixes, rols i kids poden haver canviat.
    const baseCtx = await contextDelFil({ fil, tipusFil, config, exigix, refresca:true });
    // La candidata és privada d’este enviament fins a l’eco; ni un refresc
    // concurrent ni una publicació fallida la poden convertir en àncora.
    const ctx={...baseCtx,estat:{...baseCtx.estat,epoques:new Map(baseCtx.estat.epoques),vistos:new Set(baseCtx.estat.vistos)}};
    if(ctx.estat.tipusFil===TIPUS_FIL.directe && ctx.membres.length!==2)throw errorMotor(CODI_MOTOR.filSenseMembres,'El directe necessita dues persones per enviar.',{reintentable:false});
    exigixSenseCanvis(ctx);
    if(ctx.estat.ultima?.saltada)throw errorMotor('epoca-saltada','L’última època no verifica; no s’envia amb una CK anterior.',{reintentable:false});
    let epocaNova = null;
    if (ctx.estat.cap === null || ctx.estat.cap.ck === null || ctx.rols.length!==ctx.estat.cap.membres.size || ctx.rols.some(m=>{const vell=ctx.estat.cap.membres.get(m.usuari);return !vell||vell.rol!==m.rol||aBase64url(vell.kid)!==aBase64url(ctx.directori.de(m.usuari)?.kid??new Uint8Array());})) {
      const epoca = (ctx.estat.ultima?.epoca ?? 0) + 1;
      let genesi;
      try {
        genesi = await creaEpoca(cripto, {
          estat: ctx.estat, jo: ctx.jo, membres: ctx.rols,
          motiu: epoca === 1 ? null : MOTIU_ROTACIO, creatMs: ara(), directori: ctx.directori, vigent: exigix
        });
      } catch (error) {
        if (esAmbitCanviat(error)) throw error;
        /* Només un membre sense cap clau publicada i sense cap canvi pendent espera a la safata. */
        if (error?.codi === CODI.kidNoFixat) {
          const senseClau = ctx.rols.filter((m) => !ctx.directori.de(m.usuari)).map((m) => m.usuari);
          if (senseClau.some((u) => ctx.canvis?.pendents.has(u))) {
            throw errorMotor(CODI_MOTOR.clauCanviadaForta, 'La clau de seguretat d’esta persona ha canviat: cal confirmar-la abans d’escriure.', { reintentable: false, encuable: false, cause: error });
          }
          throw bloquejat(CODI_MOTOR.clauAbsent, 'Esperant que l’altra persona active el xifrat.', error);
        }
        throw error;
      }
      await aplicaEpoca(cripto, { estat: ctx.estat, jo: ctx.jo, declaracio: genesi.declaracio, firma: genesi.firma, sobres: genesi.sobres, directori: ctx.directori, vigent: exigix });
      epocaNova = serialitzaEpoca(genesi);
    }
    const contingut = { t: typeof entrada.text === 'string' ? entrada.text : null };
    if (entrada.a) contingut.a = entrada.a;
    if (entrada.mini) contingut.mini = entrada.mini;
    const fila = await xifraMissatge(cripto, { estat: ctx.estat, jo: ctx.jo, id, contingut, comOrg: entrada.comOrgId ?? null, respostaA: entrada.respostaA ?? null, vigent: exigix });
    const paquet=Object.freeze({ id, text: null, tipus: 'text', respostaA: entrada.respostaA ?? null, xifrat: serialitzaXifrat(fila), epocaNova });
    confirmacions.set(paquet,{ctx,baseCtx,ci:claus().ci,filId:fil.id,exigix,anterior:ctx.capPersistent,nou:{epoca:ctx.estat.cap.epoca,hash:ctx.estat.cap.hash}});
    return paquet;
  };

  /** L'eco d'un enviament: el servidor ha desat el que he enviat (IS-19) i la interfície rep el text en clar. */
  const eco = async (resultat, paquet, cos, filId = resultat?.filId ?? null) => {
    const entrada = normalitzaCos(cos);
    if (resultat?.xifrat && resultat.xifrat.tf !== paquet.xifrat.tf) throw errorMotor(CODI_MOTOR.ecoNoQuadra, 'El servidor no ha desat el missatge que s’ha enviat.', { reintentable: false });
    const pendent=confirmacions.get(paquet);
    if(pendent){
      pendent.exigix();
      if(resultat?.id!==paquet.id||resultat?.filId!==pendent.filId||resultat?.text!==null||!Number.isSafeInteger(resultat?.seq)||resultat.seq<1||['v','epoca','iv','ct','kid','tf'].some(k=>resultat?.xifrat?.[k]!==paquet.xifrat[k])||(resultat.respostaA??null)!==paquet.respostaA)throw errorMotor(CODI_MOTOR.ecoNoQuadra,'L’eco no correspon al paquet verificat.',{reintentable:false});
      const viu=servei.estatFilDesat(pendent.filId),capViu=viu?.estat.cap;
      const incorporat=viu?.capPersistent?.epoca>=pendent.nou.epoca && aBase64url(viu.estat.epoques.get(pendent.nou.epoca)?.hash??new Uint8Array())===aBase64url(pendent.nou.hash);
      if(capViu?.epoca===pendent.nou.epoca && aBase64url(capViu.hash)!==aBase64url(pendent.nou.hash))throw errorMotor(CODI_MOTOR.ecoNoQuadra,'L’eco bifurca el context verificat.');
      if(!incorporat && magatzem.avancaCap && (!pendent.anterior||pendent.nou.epoca>pendent.anterior.epoca)){await magatzem.avancaCap(pendent.ci,pendent.filId,{anterior:pendent.anterior,nou:pendent.nou});pendent.exigix();}
      // Un eco tardà no pot substituir un cap més nou que una lectura ja ha verificat.
      const actual=servei.estatFilDesat(pendent.filId);
      if(!actual?.estat.cap || actual.estat.cap.epoca<pendent.nou.epoca){
        pendent.ctx.capPersistent=pendent.nou;
        pendent.ctx.estat.vistos=new Set([...(actual?.estat.vistos??[]),...pendent.ctx.estat.vistos]);
        servei.desaEstatFil(pendent.filId,pendent.ctx);
      }
      confirmacions.delete(paquet);
    }
    const text = typeof entrada.text === 'string' ? entrada.text : null;
    const seguretat = Object.freeze({ xifrat: true, clauAntiga: false, verificat: true, propi: true });
    if (resultat?.id && filId) servei.desaTextDesxifrat(filId, resultat.id, { text, seguretat, a: entrada.a ?? null });
    return Object.freeze({ ...resultat, text, seguretat });
  };

  /* Si l'enviament que portava la gènesi falla, el servidor no té l'època: el context es refà del servidor. */
  const descarta = (filId) => { servei.desaEstatFil(filId, null); };

  /* Gauntlet c2 (C1, Codex 0256) · Èpoques remotes noves. El context es construïx una vegada
     per àmbit; si després un altre membre rota l'època, els seus missatges arriben amb
     `epoca-desconeguda`. Aleshores, UNA resincronització: les èpoques posteriors a l'última
     vista (es demana des d'eixa i es filtra ací, siga quin siga el límit del servidor), els
     meus sobres i aplicaEpoca en ordre, que valida la cadena (encadenament, kids, firma,
     transició, sobre i compromís) amb la guarda d'àmbit a cada espera. Una època que no valida
     queda saltada (IS-12) i els seus missatges continuen tancats. Les crides concurrents sobre
     el mateix context compartixen la mateixa resincronització. Torna si n'ha aplicat cap. */
  const resincronitzacions = new WeakMap();
  const resincronitza = (ctx, filId, config, exigix) => {
    const enCurs = resincronitzacions.get(ctx);
    if (enCurs) return enCurs;
    const promesa = (async () => {
      const des=ctx.estat.ultima?.epoca??0;
      // Una lectora calenta necessita també els kids nous i les altes; una
      // cadena que no verifica no substituïx el context vàlid anterior.
      let renovat;
      try {renovat=await contextDelFil({fil:ctx.fil,tipusFil:ctx.tipusFil,config,exigix,refresca:true});}
      catch(error){exigix();servei.desaEstatFil(filId,ctx);throw error;}
      exigix();Object.assign(ctx,renovat);servei.desaEstatFil(filId,ctx);
      return (ctx.estat.ultima?.epoca??0)>des;
    })();
    resincronitzacions.set(ctx, promesa);
    const solta = () => { if (resincronitzacions.get(ctx) === promesa) resincronitzacions.delete(ctx); };
    promesa.then(solta, solta);
    return promesa;
  };

  const obre = (ctx, filId, fila, exigix) => obriMissatge(cripto, { estat: ctx.estat, fila: desserialitzaXifrat(fila, filId), directori: ctx.directori, vigent: exigix });
  /* B2a · Fase 1, tancada: la fila d'un autor amb un canvi fort pendent, signada amb una clau
     que no és de la seua història, diu «clau nova sense confirmar» (cap text fins a acceptar). */
  const esDeClauNova = (ctx, fila, codi) => {
    const autor = fila?.usuariId ?? fila?.emissor;
    if (!CODIS_CLAU_NOVA.has(codi) || !ctx?.canvis?.pendents.has(autor)) return false;
    try { return !ctx.directori.historica(autor, deBase64url(fila.xifrat.kid, 16)); } catch { return false; }
  };
  const filaTancada = (error, ctx = null, fila = null) => {
    const codi = esErrorProtocol(error) ? error.codi : (error?.codi ?? 'sobre-invalid');
    return Object.freeze({ text: null, seguretat: Object.freeze({ xifrat: true, verificat: false, codi: esDeClauNova(ctx, fila, codi) ? CODI_MOTOR.clauNovaSenseConfirmar : codi }), a: null });
  };
  /* L'època de la fila és posterior a l'última que este context ha vist? Només eixes justifiquen anar al servidor. */
  const esEpocaPosterior = (ctx, fila) => Number.isSafeInteger(fila?.xifrat?.epoca) && fila.xifrat.epoca > (ctx.estat.ultima?.epoca ?? 0);

  /* Una fila xifrada → text en clar i metadades de sempre; cap error de fila tomba la llista.
     `sincronitzaEpoques` (C1): la que fa la resincronització, com a molt una per crida d'obri. */
  const obriUna = async (ctx, filId, fila, exigix, sincronitzaEpoques = null) => {
    const enCau = servei.textDesxifrat(filId, fila.id);
    if (enCau) return enCau;
    let obert = null;
    let fallada = null;
    try { obert = await obre(ctx, filId, fila, exigix); } catch (error) { fallada = error; }
    if (fallada !== null && !esAmbitCanviat(fallada) && fallada?.codi === CODI.epocaDesconeguda && typeof sincronitzaEpoques === 'function' && esEpocaPosterior(ctx, fila)) {
      try { await sincronitzaEpoques(); } catch (error) {
        if (esAmbitCanviat(error)) throw error;
        /* El transport ha fallat: la fila queda tancada amb el seu codi, i el pròxim sondeig ho torna a provar. */
      }
      exigix();
      /* Un sol reintent, si l'època de la fila ja hi és amb una CK meua (l'haja aplicada esta
         resincronització o una altra que ha acabat just abans). */
      if (ctx.estat.epoques.get(fila.xifrat.epoca)?.ck) {
        fallada = null;
        try { obert = await obre(ctx, filId, fila, exigix); } catch (error) { fallada = error; }
      }
    }
    if (fallada !== null) {
      if (esAmbitCanviat(fallada)) throw fallada;
      return filaTancada(fallada, ctx, fila);
    }
    /* Gauntlet c2 (C1) · Res desxifrat a la memòria cau d'un àmbit que ja no és el de l'operació.
       Cicle 4 (MITJÀ-04, Gemini 1217) · Com a publicaAdjunt: fins que la RAM de l'àmbit no ho ha
       desat tot, la FK (`a.k`, 32 B en clar) és només d'esta crida. Si la guarda o el desat
       fallen, a zero abans de rellançar; si l'índex d'adjunts ja la tenia, l'adjunt queda tancat
       (mai una clau viva sense cap fila oberta que la mostre). L'antirepetició del protocol
       (`estat.vistos`) no deixa tornar a obrir la fila en este context: queda tancada amb
       `repeticio` fins que l'àmbit es torna a fixar i el context es refà. */
    const a = obert.contingut?.a ?? null;
    try {
      exigix();
      /* Cicle 4 (tancament, e2ee-index-adjunts) · L'índex d'adjunts va per id, i urlAdjunt hi
         llig el fil i l'emissor amb què verifica el blob. Una fila amb l'`a` d'un altre id (un
         membre que apunta a la foto d'una altra persona) o que l'índex no accepta (eixe id ja és
         d'un altre fil o d'un altre emissor) es tanca amb `adjunt-incoherent`: la seua FK a zero
         i el tancament a la cau, i l'adjunt legítim continua obrint-se. */
      if (a && (a.id !== obert.id || servei.desaAdjunt(a.id, Object.freeze({ fil: filId, emissor: obert.emissor, a })) === false)) {
        a.k?.fill?.(0);
        const tancada = filaTancada({ codi: CODI.adjuntIncoherent });
        servei.desaTextDesxifrat(filId, fila.id, tancada);
        return tancada;
      }
      const valor = Object.freeze({
        text: obert.contingut?.t ?? null,
        seguretat: Object.freeze({ xifrat: true, firmada: obert.firmada === true, clauAntiga: obert.clauAntiga === true, verificat: true }),
        a
      });
      servei.desaTextDesxifrat(filId, fila.id, valor);
      return valor;
    } catch (error) {
      a?.k?.fill?.(0);
      throw error;
    }
  };

  const vesteix = (fila, valor) => {
    const vestida = { ...fila, text: valor.text, seguretat: valor.seguretat };
    if (valor.a) {
      vestida.tipus = TIPUS_DE_CLASSE[valor.a.c] ?? fila.tipus;
      vestida.metadades = { ...(fila.metadades && typeof fila.metadades === 'object' ? fila.metadades : {}), adjunt: metadadesAdjuntDe(valor.a) };
    }
    return vestida;
  };

  /** Les files d'un fil amb el text desxifrat; si les claus estan bloquejades, el text queda nul amb l'estat explícit. */
  const obri = async ({ fil, tipusFil, files, config, exigix }) => {
    let ctx = null;
    let bloqueig = null;
    try { ctx = await contextDelFil({ fil, tipusFil, config, exigix }); } catch (error) {
      if (esAmbitCanviat(error)) throw error;
      bloqueig = error?.codi ?? 'sense-context';
    }
    const resultat = [];
    /* C1 · Com a molt una resincronització per crida, encara que moltes files siguen de l'època nova. */
    let resincronitzat = false;
    const unaResincronitzacio = () => {
      if (resincronitzat) return Promise.resolve(false);
      resincronitzat = true;
      return resincronitza(ctx, fil.id, config, exigix);
    };
    for (const fila of files) {
      if (!fila?.xifrat) { resultat.push(fila); continue; }
      if (ctx === null) { resultat.push({ ...fila, text: null, seguretat: Object.freeze({ xifrat: true, verificat: false, codi: bloqueig }) }); continue; }
      resultat.push(vesteix(fila, await obriUna(ctx, fil.id, fila, exigix, unaResincronitzacio)));
    }
    return resultat;
  };

  /** El resum (últim missatge) d'un fil per a la llista; null si no es pot obrir. */
  const resumDelFil = async ({ fil, tipusFil, config, exigix }) => {
    const u = fil?.ultimXifrat;
    if (!u || !u.xifrat || !u.id) return null;
    let ctx;
    try { ctx = await contextDelFil({ fil, tipusFil, config, exigix }); } catch (error) {
      if (esAmbitCanviat(error)) throw error;
      return null;
    }
    const valor = await obriUna(ctx, fil.id, { id: u.id, usuariId: u.usuariId ?? u.emissor, comOrgId: u.comOrgId ?? null, respostaA: u.respostaA ?? null, xifrat: u.xifrat }, exigix,
      () => resincronitza(ctx, fil.id, config, exigix));
    return valor.text;
  };

  /* ── La cua F7 ── */
  const encua = async ({ fil, cos, exigix }) => {
    const { ci, actor } = claus();
    const entrada = normalitzaCos(cos);
    const id = typeof entrada.id === 'string' ? entrada.id : cripto.randomUUID();
    await magatzem.desaASafata(ci, { fil: fil.id, id, actor, contingut: { text: typeof entrada.text === 'string' ? entrada.text : null, respostaA: entrada.respostaA ?? null } });
    exigix();
    return Object.freeze({ id, filId: fil.id, encuat: true, reintentable: true, codi: CODI_MOTOR.encuat });
  };

  const drena = async ({ config, exigix, carregaFil, envia, classifica }) => {
    const { ci, actor } = claus();
    const files = await magatzem.safata(ci, actor);
    exigix();
    const enviats = [];
    for (const [index, entrada] of files.entries()) {
      if (entrada.malmes) { await magatzem.treuDeSafata(ci, entrada.id, actor); continue; }
      let fil = null;
      let paquet = null;
      try {
        fil = await carregaFil(entrada.fil);
        exigix();
        const { tipusFil } = classifica(fil);
        paquet = await prepara({ fil, tipusFil, cos: { id: entrada.id, ...entrada.contingut }, config, exigix });
        const resultat = await envia(fil.id, paquet);
        exigix();
        await eco(resultat, paquet, entrada.contingut, fil.id);
        await magatzem.treuDeSafata(ci, entrada.id, actor);
        enviats.push(entrada.id);
      } catch (error) {
        if (esAmbitCanviat(error)) throw error;
        if (paquet?.epocaNova && fil) descarta(fil.id);
        return Object.freeze({ enviats, pendents: files.slice(index).map((f) => f.id), error });
      }
    }
    return Object.freeze({ enviats, pendents: [], error: null });
  };

  /* ── Adjunts ── */
  const publicaAdjunt = async ({ fil, tipusFil, entrada, config, exigix }) => {
    exigixTransport('publicaAdjuntXifratXat');
    const ctx = await contextDelFil({ fil, tipusFil, config, exigix });
    /* B2a · Ni es llig ni es xifra el fitxer si ja se sap que no es pot enviar (prepara ho torna a mirar amb el context refet). */
    exigixSenseCanvis(ctx);
    const fitxer = entrada?.fitxer;
    if (!fitxer || typeof fitxer.arrayBuffer !== 'function') throw errorMotor('adjunt-invalid', 'Cal el fitxer de l’adjunt.', { reintentable: false });
    const bytes = new Uint8Array(await fitxer.arrayBuffer());
    let xifrat;
    /* Cicle 4 (C8, Codex 1224) · La guarda d'àmbit de després de llegir el fitxer, dins del
       try: si l'àmbit ha canviat mentre es llegia, el clar ja és a la RAM i també ix a zero. */
    try {
      exigix();
      xifrat = await xifraAdjuntXat({ cripto, fil: fil.id, adjunt: entrada.id, emissor: ctx.jo.usuari, bytes, mime: fitxer.type, durada: entrada.duradaMs ?? null, vigent: exigix });
    } finally {
      bytes.fill(0);
    }
    /* Gauntlet c2 (G4, Gemini 0255) · Fins que no és a la RAM de l'àmbit (eco i desaAdjunt), la
       FK (`a.k`, 32 B en clar) és només d'esta crida: si preparar, publicar, la guarda d'àmbit o
       l'eco fallen, a zero abans de rellançar. Un cop desada, la posa a zero l'oblit (buidaRamAmbit). */
    try {
      const paquet = await prepara({ fil, tipusFil, cos: { id: entrada.id, text: typeof entrada.text === 'string' ? entrada.text : null, a: xifrat.a, respostaA: entrada.respostaA ?? null }, config, exigix });
      let resultat;
      try {
        resultat = await impl.publicaAdjuntXifratXat(fil.id, { id: entrada.id, blob: xifrat.blob, mida: xifrat.mida, xifrat: paquet.xifrat, respostaA: paquet.respostaA, epocaNova: paquet.epocaNova }, config);
      } catch (error) {
        if (paquet.epocaNova) descarta(fil.id);
        throw error;
      }
      exigix();
      /* L'eco comprova (abans de desar res) que el servidor ha desat el que s'ha enviat; si no, la FK no entra a la RAM. */
      const vestit = await eco(resultat, paquet, { text: entrada.text ?? null, a: xifrat.a }, fil.id);
      servei.desaAdjunt(xifrat.a.id, Object.freeze({ fil: fil.id, emissor: ctx.jo.usuari, a: xifrat.a }));
      return vesteix(vestit, { text: vestit.text, seguretat: vestit.seguretat, a: xifrat.a });
    } catch (error) {
      xifrat.a.k.fill(0);
      throw error;
    }
  };

  /* Gauntlet c2 (G4, Gemini 0255) · Descàrregues en vol per (generació d'àmbit, clauCau): dues
     peces que demanen alhora el mateix adjunt compartixen una sola descàrrega, un sol desxifrat
     i un sol blob:, i cadascuna rep la seua retenció en el tic que se li servix. */
  const urlsEnVol = new Map();

  const urlAdjunt = async ({ id, config, exigix, renova = false, reten = null }) => {
    const info = servei.adjuntDesat(id);
    if (!info) return null;
    if (typeof creaBlob !== 'function' || typeof creaUrl !== 'function') throw errorMotor('sense-blob', 'Cal creaBlob i creaUrl per a servir un adjunt desxifrat.', { reintentable: false });
    exigixTransport('bytesAdjuntXat');
    const clauCau = `${id}:${aBase64url(await sha256(cripto, info.a.k))}`;
    exigix();
    /* QA-C01 (Gauntlet 261029_1858) · Qui la pinta o la reprodueix (reten) rep
       l'alliberament de la URL en el mateix tic que es servix: cap desa d'un
       altre adjunt la pot desallotjar entremig. Si `reten` llança, s'allibera. */
    const lliura = (url) => {
      if (typeof reten !== 'function') return url;
      const allibera = servei.retenUrlAdjunt?.(clauCau);
      if (typeof allibera !== 'function') return url;
      try { reten(allibera); } catch { allibera(); }
      return url;
    };
    const desada = renova ? null : servei.urlAdjuntDesada(clauCau);
    if (desada) return lliura(desada);
    const clauVol = `${servei.estatAmbit().genAmbit}|${clauCau}`;
    const enCurs = renova ? null : (urlsEnVol.get(clauVol) ?? null);
    if (enCurs) {
      /* La mateixa descàrrega (i el mateix error, si falla); la URL i la retenció, en un sol tic.
         Si el LRU l'ha desallotjada entremig, esta crida se la baixa ella mateixa. */
      await enCurs;
      exigix();
      const servida = servei.urlAdjuntDesada(clauCau);
      if (servida) return lliura(servida);
    }
    const produccio = (async () => {
      /* QA-C01 · Si ni desallotjant tot el que no és retingut hi cap (sostre de 100 MB),
         cap descàrrega, cap desxifrat i cap blob: nou: la peça mostra «Torna-ho a provar». */
      if (servei.hiCapUrlAdjunt?.(info.a.b) === false) throw errorPressupostBlobs();
      const blob = await impl.bytesAdjuntXat(id, { midaEsperada: midaBlobAdjunt(info.a.b), ...config });
      exigix();
      const { bytes, mime } = await desxifraAdjuntXat({ cripto, fil: info.fil, emissor: info.emissor, a: info.a, blob, vigent: exigix });
      let url;
      try {
        /* Pas 17 · Cap blob: nou si l'àmbit ha canviat mentre es desxifrava. */
        exigix();
        url = creaUrl(creaBlob([bytes], { type: mime }));
      } finally {
        /* El clar fora de la RAM també si exigix, creaBlob o creaUrl llancen. */
        bytes.fill(0);
      }
      /* Al registre LRU (§4.7) amb els bytes en clar; renova revoca la URL vella de la mateixa clau. */
      servei.desaUrlAdjunt(clauCau, url, info.a.b);
      return url;
    })();
    urlsEnVol.set(clauVol, produccio);
    try {
      return lliura(await produccio);
    } finally {
      if (urlsEnVol.get(clauVol) === produccio) urlsEnVol.delete(clauVol);
    }
  };

  /* ── Oblit (D-09) ── */
  /* QA-C02 (Gauntlet 261029_1858) · null o undefined: la capa no existix en
     este entorn i no hi ha res a esborrar. Qualsevol altra cosa és una capa
     que s'ha de poder recórrer: si llança (bloquejada: SecurityError, també la
     façana de storage.js) o no té una longitud vàlida, l'oblit la declara
     pendent (OBLIT_FALLIT), mai un èxit fals. */
  const esborraClausDe = (magatzemWeb) => {
    if (magatzemWeb === null || magatzemWeb === undefined) return;
    const total = magatzemWeb.length;
    if (!Number.isSafeInteger(total) || total < 0) throw new TypeError('La capa web de l’oblit no es pot recórrer.');
    const claus = [];
    for (let i = 0; i < total; i += 1) {
      const clau = magatzemWeb.key(i);
      if (typeof clau === 'string' && clau.startsWith(PREFIX_CLAUS_XAT)) claus.push(clau);
    }
    for (const clau of claus) magatzemWeb.removeItem(clau);
  };

  /* Gauntlet c1 · Hi ha algú dins ara mateix (un àmbit fixat)? */
  const hiHaAmbitFixat = () => {
    try { return Boolean(servei.estatAmbit().clauIdentitat); } catch { return false; }
  };

  const oblidaTot = async ({ sessio = null, preferencies = null, mantenSessio = false, clauIdentitat = null, conservaAmbit = false } = {}) => {
    /* Pas 17 · L'eixida passa la CI de qui ix: quan arriba ací la interfície ja pot
       haver buidat l'àmbit (useXifratXat → oblidaClausXat), i sense ella IndexedDB no
       s'esborraria i l'estat diria 'oblidat' (un èxit fals en un ordinador compartit).
       Gauntlet c1 · conservaAmbit (xifratXatEixida.js): l'àmbit fixat és d'una altra
       persona que ja ha entrat. Ni la seua RAM, ni la seua CI, ni la connexió que usa. */
    const conserva = conservaAmbit === true;
    let ci = typeof clauIdentitat === 'string' && clauIdentitat ? clauIdentitat : null;
    if (ci === null && !conserva) {
      try { ({ ci } = claus()); } catch { /* sense àmbit: només RAM i magatzems web */ }
    }
    const causes = [];
    const pendents = [];
    if (!conserva) servei.oblidaClausXat();
    if (ci !== null) {
      try { await magatzem.oblidaEnTancar(ci, { mantenSessio }); } catch (error) { causes.push(error); pendents.push('indexeddb'); }
      /* Si algú ha entrat mentre s'esborrava (un àmbit fixat ara), la connexió ja és seua. */
      if (!conserva && !hiHaAmbitFixat()) {
        try { magatzem.tanca?.(); } catch { /* ja tancat */ }
      }
    }
    try { esborraClausDe(sessio); } catch (error) { causes.push(error); pendents.push('sessio'); }
    try { esborraClausDe(preferencies); } catch (error) { causes.push(error); pendents.push('preferencies'); }
    const estat = Object.freeze({ estat: pendents.length ? ESTAT_OBLIT.fallit : ESTAT_OBLIT.oblidat, pendents: Object.freeze(pendents), causes: Object.freeze(causes), quanMs: ara() });
    servei.desaEstatOblit(estat);
    return estat;
  };

  /* B2a · La fixació és per persona: després d'acceptar o de tornar a verificar una clau nova,
     cap context en RAM (de cap fil amb eixa persona) es queda amb el directori vell. */
  const descartaContextos = (filId) => {
    if (typeof servei.descartaEstatsFils === 'function') servei.descartaEstatsFils();
    else descarta(filId);
  };
  const errorKidCanviat = (cause) => errorMotor(CODI_MOTOR.kidCanviat, 'La clau fixada d’esta persona ha canviat: cal comparar el número nou.', { reintentable: false, ...(cause ? { cause } : {}) });
  const esFixacioCanviada = (error) => error?.codi === 'FIXACIO_DIFERENT' || error?.codi === 'FIXACIO_CANVIADA';
  const ambKidCanviat = async (escriu) => {
    try { return await escriu(); } catch (error) {
      if (esFixacioCanviada(error)) throw errorKidCanviat(error);
      throw error;
    }
  };
  /* B2a-ARB-01 · Acceptar (o tornar a verificar) la clau nova d'un pendent. Si el tram suau
     d'abans del pas fort encara no és al magatzem (cap fil ha corregut `confirma`), primer
     s'hi avança (kidDesat → kidFixat; amb el mateix kid no fa res) i després la clau nova.
     Les dues fixacions són comparar-i-canviar i `anteriors` guarda tot el tram (R5).
     G2-A-seg-01 · `abansDeFixar` corre just abans de fixar la clau nova (amb la vella encara fixada). */
  const fixaSobrePendent = async (ci, p, { kid, verificat }, exigix, abansDeFixar = null) => {
    if (p.kidDesat && !bytesIguals(p.kidDesat, p.kidFixat)) {
      await ambKidCanviat(() => magatzem.fixa(ci, { usuari: p.usuari, kid: p.kidFixat, vistAl: ara() }, { anterior: p.kidDesat }));
      exigix();
    }
    if (typeof abansDeFixar === 'function') { await abansDeFixar(); exigix(); }
    return ambKidCanviat(() => magatzem.fixa(ci, { usuari: p.usuari, kid, verificat, vistAl: ara() }, { anterior: p.kidFixat }));
  };

  /* G2-A-seg-01 · Una clau substituïda per un canvi fort només signa èpoques fins al cap que
     l'aparell tenia ancorat abans de l'acceptació. Perquè la història d'abans dels altres fils
     amb esta persona (que el decorador coneix: `filsAmb`) no quede tancada, abans de fixar la
     clau nova cada fil ancora el seu cap amb el directori d'ara, on la vella encara és la
     fixada. Millor esforç: un fil que falla (xarxa, cadena) es queda amb el cap d'abans i
     l'acceptació continua; només un canvi d'àmbit l'atura. Com a molt MAX_FILS_ANCORA fils.
     E1 · ARB-5 · CONCURRENCIA_ANCORA fils alhora (cada un és independent: el seu context, el
     seu cap i fixacions comparar-i-canviar idempotents), no un darrere de l'altre. */
  const MAX_FILS_ANCORA = 64;
  const CONCURRENCIA_ANCORA = 4;
  const ancoraAltresFils = async ({ usuari, fil, config, exigix, filsAmb }) => {
    if (typeof filsAmb !== 'function') return;
    let llista;
    try { llista = filsAmb(usuari, fil.id); } catch { return; }
    if (!Array.isArray(llista)) return;
    const cua = llista.filter((altre) => typeof altre?.fil?.id === 'string' && altre.fil.id !== fil.id).slice(0, MAX_FILS_ANCORA);
    let seguent = 0;
    const treballa = async () => {
      while (seguent < cua.length) {
        const altre = cua[seguent];
        seguent += 1;
        try { await contextDelFil({ fil: altre.fil, tipusFil: altre.tipusFil, config, exigix, refresca: true }); } catch (error) {
          if (esAmbitCanviat(error)) throw error;
        }
        exigix();
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCIA_ANCORA, cua.length) }, treballa));
  };

  /* ── Número de seguretat i «Marca com a verificat» (§4.4; pla 261101_1246, T7 · S5) ──
     Només en un directe entre dues persones: el número és d'un parell. Les claus de
     l'altra persona són les del directori del fil refet ara mateix (kids nous, canvis
     suaus i la fixació TOFU confirmada), mai les d'una memòria vella. B2a · Amb un canvi
     fort pendent, el número és el de la clau nova (la candidata, autofirma verificada) i
     porta `pendent: true`: comparar-lo és el camí per a tornar a verificar. */
  const numeroAmbClau = async ({ fil, tipusFil, config, exigix }) => {
    if (TIPUS_DEL_FIL[tipusFil] !== TIPUS_FIL.directe) {
      throw errorMotor(CODI_MOTOR.numeroNoDirecte, 'El número de seguretat és d’un xat privat entre dues persones.', { reintentable: false });
    }
    const ctx = await contextDelFil({ fil, tipusFil, config, exigix, refresca: true });
    exigix();
    const { ci, joId } = claus();
    const altres = ctx.membres.filter((usuari) => usuari !== joId);
    if (altres.length !== 1) throw errorMotor(CODI_MOTOR.filSenseMembres, 'Este xat no té exactament una altra persona.', { reintentable: false });
    const [altreId] = altres;
    const pendent = ctx.canvis?.pendents.get(altreId) ?? null;
    const altre = pendent ? ctx.directori.candidata(altreId) : ctx.directori.de(altreId);
    if (!altre?.sigPub || !altre?.dhPub || !altre?.kid) {
      throw errorMotor(CODI_MOTOR.senseClauAltre, 'L’altra persona encara no té claus del xat publicades.', { reintentable: true });
    }
    const numero = await numeroSeguretatParell(cripto, publiquesDe(ctx.jo), altre);
    exigix();
    const pin = typeof magatzem.fixacio === 'function' ? await magatzem.fixacio(ci, altreId) : null;
    exigix();
    const resultat = Object.freeze({
      usuari: altreId,
      kid: aBase64url(altre.kid),
      numero,
      verificat: !pendent && pin?.verificat === true && bytesIguals(pin.kid, altre.kid),
      pendent: pendent !== null
    });
    return { ci, resultat, pendent };
  };

  /** { usuari, kid (base64url), numero (12 grups de 5 xifres), verificat, pendent } del directe. */
  const numeroDelFil = async (opcions) => (await numeroAmbClau(opcions)).resultat;

  /* La marca va a la fixació d'este aparell (IndexedDB) i només per al kid que s'ha
     mostrat: si la clau ha canviat entremig, kid-canviat i cap escriptura. El magatzem
     torna a comprovar el kid dins de la transacció (FIXACIO_DIFERENT o
     FIXACIO_CANVIADA): una marca no substituïx mai una fixació diferent. B2a · Sobre un
     pendent, «Marca com a verificat» accepta i verifica la clau nova (amb l'`anterior`
     fixada, comparar-i-canviar); llevar la marca d'una clau no acceptada no es pot. */
  const marcaVerificatDelFil = async ({ kid, verificat, ...opcions }) => {
    const { ci, resultat, pendent } = await numeroAmbClau(opcions);
    if (typeof kid !== 'string' || resultat.kid !== kid) {
      throw errorMotor(CODI_MOTOR.kidCanviat, 'La clau de l’altra persona ha canviat: cal comparar el número nou.', { reintentable: false });
    }
    if (pendent && verificat !== true) {
      throw errorMotor(CODI_MOTOR.clauCanviadaForta, 'La clau nova d’esta persona encara no s’ha acceptat: no hi ha cap marca a llevar.', {
        reintentable: false, encuable: false, usuari: resultat.usuari, motiu: pendent.motiu, kidNou: kid
      });
    }
    if (typeof magatzem.fixa !== 'function') throw errorMotor(CODI_MOTOR.senseCapacitat, 'El magatzem d’este aparell no desa fixacions.', { reintentable: false });
    opcions.exigix();
    let fila;
    if (pendent) {
      fila = await fixaSobrePendent(ci, pendent, { kid: deBase64url(kid, 16), verificat: true }, opcions.exigix,
        () => ancoraAltresFils({ usuari: resultat.usuari, fil: opcions.fil, config: opcions.config, exigix: opcions.exigix, filsAmb: opcions.filsAmb }));
    } else {
      try {
        fila = await magatzem.fixa(ci, { usuari: resultat.usuari, kid: deBase64url(kid, 16), verificat: verificat === true, vistAl: ara() }, {});
      } catch (error) {
        if (esFixacioCanviada(error)) throw errorKidCanviat(error);
        throw error;
      }
    }
    opcions.exigix();
    if (pendent) descartaContextos(opcions.fil.id);
    return Object.freeze({ ...resultat, verificat: fila?.verificat === true, pendent: false });
  };

  /* IDEA-48 (estat previ a F7) · Quants contactes té verificats la persona en este aparell.
     B2a (risc obert del Llibre, :128) · Només compta qui té ara mateix com a clau activa al
     servidor (una sola fila sense retirar) exactament la clau verificada, amb el kid
     recalculat de les seues públiques. Un contacte verificat que publica una clau nova
     deixa de comptar fins que es torna a verificar. Cap fixació ni cap canvi s'escriu ací.
     G2-A-seg-02 · La marca de verificat és d'este aparell: la petició no la diu. Es demanen
     les claus de TOTES les persones fixades (el servidor ja sap amb qui parles, disseny
     §2.4), en ordre d'usuari i en els mateixos lots, i els verificats es filtren ací. Amb 0
     o amb N verificats, el servidor veu la mateixa petició.
     ARB-01 · I el mateix desenllaç: una petició que falla rebutja sempre (mai un 0 només
     quan no n'hi ha cap), i guardaIdentitat la torna AMBIT_CANVIAT si l'àmbit ha canviat. */
  const recompteVerificats = async ({ exigix, config = {} }) => {
    const { ci, joId } = claus();
    if (typeof magatzem.fixacions !== 'function') return 0;
    const files = await magatzem.fixacions(ci);
    exigix();
    const fixades = (Array.isArray(files) ? files : []).filter((f) => f && typeof f.usuari === 'string' && f.usuari !== joId);
    if (!fixades.length) return 0;
    const pins = new Map(fixades.filter((f) => f.verificat === true).map((f) => [f.usuari, f]));
    /* Sense transport no hi ha cap petició: zero verificats és zero sense el servidor. */
    if (!pins.size && typeof impl.clausDeXat !== 'function') return 0;
    exigixTransport('clausDeXat');
    const ids = [...new Set(fixades.map((f) => f.usuari))].sort();
    const registres = [];
    for (let i = 0; i < ids.length; i += 256) {
      const lot = await impl.clausDeXat(ids.slice(i, i + 256), config);
      exigix();
      if (Array.isArray(lot)) registres.push(...lot);
    }
    if (!pins.size) return 0;
    let total = 0;
    for (const [usuari, pin] of pins) {
      const vigents = registres.filter((r) => r && typeof r === 'object' && (r.usuariId ?? r.usuari) === usuari && !r.retiradaAl);
      if (vigents.length !== 1) continue;
      let quadra = false;
      try {
        const kid = deBase64url(vigents[0].kid, 16);
        if (bytesIguals(kid, pin.kid)) {
          await creaDirectori(cripto).fixa({ usuari, kid, sigPub: deBase64url(vigents[0].sigPub, 65), dhPub: deBase64url(vigents[0].dhPub, 65) });
          quadra = true;
        }
      } catch (error) {
        if (esAmbitCanviat(error)) throw error;
        /* Una fila mal formada o amb un kid que no és el de les seues claus: no compta. */
      }
      exigix();
      if (quadra) total += 1;
    }
    return total;
  };

  /* ── Canvis de clau del fil (§4.4, CS-01, D-05 a; B2a, contracte de §2.1.6) ── */
  /* G2-A-integ-01 · Els suaus són els d'esta construcció més els avisos que el servei de l'àmbit
     guardava per a les persones del fil (un sol avís per persona i kid nou). Un suau d'una persona
     que ara té un pendent no es diu: l'alerta forta ja ho cobrix (com el tram de B2a-ARB-01).
     `excepte`: la persona que s'acaba d'acceptar (el seu pendent ja no hi és). */
  const serialitzaCanvis = (canvis, avisos = [], excepte = null) => {
    const suaus = new Map();
    for (const s of [...avisos, ...canvis.suaus]) {
      const clau = `${s.usuari}:${aBase64url(s.kidNou)}`;
      if (!canvis.pendents.has(s.usuari) && !suaus.has(clau)) suaus.set(clau, s);
    }
    return Object.freeze({
      pendents: Object.freeze([...canvis.pendents.values()].filter((p) => p.usuari !== excepte).map((p) => Object.freeze({
        usuari: p.usuari, motiu: p.motiu, kidFixat: aBase64url(p.kidFixat), kidNou: p.kidNou ? aBase64url(p.kidNou) : null
      }))),
      suaus: Object.freeze([...suaus.values()].map((s) => Object.freeze({ usuari: s.usuari, kidAnterior: aBase64url(s.kidAnterior), kidNou: aBase64url(s.kidNou) }))),
      alarmes: Object.freeze(canvis.alarmes.map((a) => Object.freeze({ tipus: a.tipus, kidActiu: a.kidActiu ? aBase64url(a.kidActiu) : null })))
    });
  };
  /* Les persones d'un fil (d'ara i de qualsevol època vista), com la guarda d'enviament. */
  const personesDelFil = (ctx) => new Set([...ctx.membres, ...[...ctx.estat.epoques.values()].flatMap((e) => [...e.membres.keys()])]);
  /* G2-A-integ-01 · Els avisos suaus guardats per a estes persones, que la interfície rep ara (i el servei ja no guarda).
     E1 · H-2 · Amb `conserva`, el servei els guarda fins que la interfície els tanca (tancaAvisSuau); el d'una
     persona amb un pendent s'oblida sempre (l'alerta forta ja ho cobrix). */
  const prenAvisosSuaus = (ctx, conserva = false) => (typeof servei.prenAvisosSuaus === 'function'
    ? servei.prenAvisosSuaus(personesDelFil(ctx), { conserva: conserva === true, descarta: ctx.canvis?.pendents ?? null })
    : []);

  /** { pendents: [{usuari, motiu, kidFixat, kidNou}], suaus: [{usuari, kidAnterior, kidNou}], alarmes: [{tipus, kidActiu}] }, kids en base64url. */
  const canvisDelFil = async ({ fil, tipusFil, config, exigix, conservaSuaus = false }) => {
    const ctx = await contextDelFil({ fil, tipusFil, config, exigix, refresca: true });
    exigix();
    return serialitzaCanvis(ctx.canvis, prenAvisosSuaus(ctx, conservaSuaus));
  };
  /* G2-A-integ-03 · Errors del context que són manipulació: es diuen encara que la clau ja s'haja fixat. */
  const CODIS_MANIPULACIO = new Set([CODI.bifurcacio, CODI.kidNoQuadra, CODI_MOTOR.historiaIncoherent]);

  /* «He parlat amb {nom}: continua» · Només la clau pendent que s'ha mostrat (TOCTOU: el
     kid es compara amb el pendent refet ara i, dins de la transacció, la fixació amb
     l'`anterior`), sense marca de verificat. La fixació és per persona: desbloqueja tots
     els fils amb ella. Torna els canvis del fil ja refets. */
  const acceptaCanviDelFil = async ({ fil, tipusFil, config, exigix, usuari, kid, filsAmb = null, conservaSuaus = false }) => {
    const ctx = await contextDelFil({ fil, tipusFil, config, exigix, refresca: true });
    exigix();
    const { ci } = claus();
    const p = typeof usuari === 'string' ? (ctx.canvis?.pendents.get(usuari) ?? null) : null;
    if (!p || !p.kidNou || typeof kid !== 'string' || aBase64url(p.kidNou) !== kid) {
      throw errorMotor(CODI_MOTOR.kidCanviat, 'La clau a acceptar ja no és la pendent: cal tornar-la a mirar.', { reintentable: false });
    }
    if (!ctx.directori.candidata(usuari)) {
      throw errorMotor(CODI_MOTOR.senseClauAltre, 'La clau nova no porta cap declaració autofirmada vàlida: no es pot acceptar.', { reintentable: false });
    }
    if (typeof magatzem.fixa !== 'function') throw errorMotor(CODI_MOTOR.senseCapacitat, 'El magatzem d’este aparell no desa fixacions.', { reintentable: false });
    exigix();
    await fixaSobrePendent(ci, p, { kid: p.kidNou, verificat: false }, exigix, () => ancoraAltresFils({ usuari, fil, config, exigix, filsAmb }));
    exigix();
    descartaContextos(fil.id);
    /* G2-A-integ-03 · La clau ja és fixada (i no es desfà): si el refresc final falla, l'acceptació
       no es diu fallida. Torna els canvis d'abans sense el pendent acceptat i `refrescat: false`
       (camp opcional nou); la pròxima lectura els refà. Un canvi d'àmbit o una manipulació, sí. */
    try {
      return await canvisDelFil({ fil, tipusFil, config, exigix, conservaSuaus });
    } catch (error) {
      if (esAmbitCanviat(error) || CODIS_MANIPULACIO.has(error?.codi)) throw error;
      exigix();
      return Object.freeze({ ...serialitzaCanvis(ctx.canvis, prenAvisosSuaus(ctx, conservaSuaus), usuari), refrescat: false });
    }
  };

  return Object.freeze({
    claus, contextDelFil, prepara, eco, descarta, obri, resumDelFil, encua, drena, publicaAdjunt, urlAdjunt, oblidaTot,
    numeroDelFil, marcaVerificatDelFil, recompteVerificats, canvisDelFil, acceptaCanviDelFil
  });
}
