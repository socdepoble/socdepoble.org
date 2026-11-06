/** Consumidor intern F2a → magatzem → pipeline, opt-in per persona i fil.
 * capturaContext és el context immutable de la sessió verificat per l'app;
 * no s'ompli amb claims d'un formulari o d'un amfitrió. El backend retornat
 * es pot instal·lar al port neutral. Cap flag global s'encén ací.
 */
import { creaAlta, registreActiu, restauraAmbFrase, restauraAmbRk } from './xifratXatAlta.js';
import { ambXifratXat, serveiXifratXat } from './xifratXat.js';
import { ambitDelFil } from './xifratXatAbast.js';
import { aBase64url, bytesIguals, deBase64url, verificaSignatura } from './xifratXatCripto.js';
import { clauIdentitat } from './xifratXatMagatzem.js';
import { kidDe } from './xifratXatFormats.js';
import { registraServeiXifratXat } from './xifratXatServei.js';
import { esOrigenDeConfianca } from '../config/xifratXat.js';
import { creaMagatzemOptinXat } from './xifratXatOptin.js';
import {
  comprovaCompromisSas, construeixVerificacio, hashVerificacio, llegixAprovacio,
  llegixDeclaracio, llegixInfoAlliberament, obriAlliberament, recuperaRk
} from './xifratXatRecuperacio.js';

const falla = (codi) => Object.assign(new Error(codi), { codi, reintentable: false });

/** Reconstrucció F7 des d'alliberaments complets, mai des de booleans «verificat».
 * La SDPC ha d'estar ancorada pel controlador F7 vigent (no només signada):
 * `declaracioVigent` és una captura local interna del material F7 revisat.
 */
export async function restauraIdentitatSocial(cripto, {
  usuari, registre, declaracioVigent, declaracio, firma, peticio, epk, skR, caducaMs, alliberaments, ara = Date.now, exigix = () => {}
}) {
  const d = llegixDeclaracio(declaracio);
  if (!bytesIguals(declaracio, declaracioVigent) || d.usuari !== usuari || !bytesIguals(d.kid, deBase64url(registre.kid, 16))
    || !(await verificaSignatura(cripto, deBase64url(registre.sigPub, 65), firma, declaracio))) throw falla('declaracio-social-invalida');
  exigix();
  if (!Array.isArray(alliberaments) || alliberaments.length < 3 || alliberaments.length > 8) throw falla('llindar-social-invalid');
  if (!Number.isSafeInteger(caducaMs) || caducaMs <= ara() || caducaMs - ara() > 7200000) throw falla('recuperacio-caducada');
  const oberts = [];
  try {
    for (const a of alliberaments) {
      exigix();
      if (ara() >= caducaMs) throw falla('recuperacio-caducada');
      const info = llegixInfoAlliberament(a.infoAlliberament);
      const amic = d.amics.find((x) => x.amic === info.amic && x.x === info.x);
      const kidAmic = await kidDe(cripto, { usuari: info.amic, sigPub: a.sigPubAmic, dhPub: a.dhPubAmic });
      exigix();
      if (!amic || info.usuari !== usuari || info.repartiment !== d.repartiment || info.peticio !== peticio || info.caducaMs !== caducaMs
        || !bytesIguals(info.kid, d.kid) || !bytesIguals(info.epk, epk) || !bytesIguals(info.kidAmic, amic.kidAmic)
        || !bytesIguals(kidAmic, amic.kidAmic)) throw falla('alliberament-no-vinculat');
      const aprovacio = llegixAprovacio(a.aprovacio);
      const hT = await hashVerificacio(cripto, construeixVerificacio(info));
      if (!bytesIguals(hT, aprovacio.hT) || !(await comprovaCompromisSas(cripto, aprovacio))) throw falla('transcript-social-invalid');
      exigix();
      const obert = await obriAlliberament(cripto, { ...a, skR, pkR: epk });
      oberts.push({ repartiment: d.repartiment, amic: amic.amic, kidAmic: amic.kidAmic, x: amic.x, hF: amic.hF, fragment: obert.fragment });
      exigix();
    }
    if (ara() >= caducaMs) throw falla('recuperacio-caducada');
    const rk = await recuperaRk(cripto, { usuari, kid: d.kid, repartiment: d.repartiment, alliberats: oberts });
    try {
      exigix();
      const identitat = await restauraAmbRk(cripto, { usuari, registre, rk });
      exigix();
      if (ara() >= caducaMs) throw falla('recuperacio-caducada');
      return identitat;
    } finally { rk.fill(0); }
  } finally { for (const o of oberts) o.fragment.fill(0); }
}

export function creaActivacioXat({ impl, entorn, magatzem, capturaContext, llegixMaterialSocial = null, capturaRecuperacioSocial = null, ara = Date.now, opcionsAlta = {}, optin = null }) {
  if (entorn?.isSecureContext !== true || !esOrigenDeConfianca(entorn.origen, entorn)) throw falla('origen-no-confiat');
  if (typeof capturaContext !== 'function') throw new TypeError('Cal el context intern verificat.');
  const context = capturaContext();
  if (!Object.isFrozen(context)) throw new TypeError('El context de sessió ha de ser immutable.');
  const { usuari, backendId, endpoint, ambitEstable, config } = context;
  const ci = clauIdentitat({ backendId, endpoint, joId: usuari });
  const parts = JSON.parse(ambitEstable);
  if (!Array.isArray(parts) || parts.length !== 3 || parts[1] !== usuari || parts[2] !== `persona::${usuari}` || JSON.stringify(parts) !== ambitEstable) throw falla('context-invalid');
  const preferencies = optin ?? creaMagatzemOptinXat({idb:entorn.indexedDB,ara,navegador:null,Canal:null});
  const transport = {...impl};
  for(const nom of ['enviaXifratXat','publicaAdjuntXifratXat'])if(typeof impl[nom]==='function')transport[nom]=async(fil,...args)=>{await exigixOptin(fil);return Reflect.apply(impl[nom],impl,[fil,...args]);};
  const decorat = ambXifratXat(transport, { ...entorn, actiu: true, modeDades: 'remote', magatzem });
  const servei = serveiXifratXat(decorat);
  let tancat = false;
  let ocupat = false;
  const exigix = () => {
    if (tancat || capturaContext() !== context) {
      servei.oblidaClausXat();
      throw falla('ambit-canviat');
    }
  };
  const estatFil = async filId => {
    exigix();const identitat=await magatzem.identitat(ci);exigix();
    const estat=await preferencies.llegix(ci,filId,{kid:identitat?aBase64url(identitat.kid):null,exigix});exigix();
    return Object.freeze({usuari,filId,...estat});
  };
  const exigixOptin = async filId => {if(!(await estatFil(filId)).actiu)throw falla('opt-in-pendent');exigix();};
  const fixa = () => { exigix(); servei.fixaAmbit(ambitEstable, ci); };
  const exclusiu = async (accio) => {
    exigix();
    if (ocupat) throw falla('cerimonia-en-curs');
    ocupat = true;
    try { return await accio(); } finally { ocupat = false; }
  };
  const desa = async (identitat) => {
    exigix();
    await magatzem.desaIdentitat(ci, identitat);
    exigix(); fixa();
    return Object.freeze({ usuari, kid: aBase64url(identitat.kid) });
  };
  const actiuRemot = async () => {
    const files = await impl.laMevaIdentitatXat(config); exigix();
    return registreActiu(files);
  };
  const restauraSocial = async recuperacio => {
    if (typeof llegixMaterialSocial !== 'function') throw falla('sense-material-social');
    const registre = await actiuRemot();
    const material = await llegixMaterialSocial(context); exigix();
    if (!material || !Number.isSafeInteger(material.revisio) || typeof material.exigixVigent !== 'function') throw falla('material-social-invalid');
    const vigent = () => { exigix(); material.exigixVigent(); };
    vigent();
    const identitat = await restauraIdentitatSocial(entorn.cripto, { ...recuperacio, declaracioVigent: material.declaracio, usuari, registre, ara, exigix: vigent }); vigent();
    const actual = await llegixMaterialSocial(context); vigent();
    if (actual.revisio !== material.revisio || !bytesIguals(actual.declaracio, material.declaracio)) throw falla('material-social-canviat');
    return desa(identitat);
  };
  const backend = { ...decorat };
  for (const nom of ['enviaMissatge', 'publicaAdjuntXat']) if (typeof decorat[nom] === 'function') {
    backend[nom] = async (fil, cos, opcions = {}) => {
      exigix();
      const id = typeof fil === 'string' ? fil : fil?.id;
      const filObj = fil && typeof fil === 'object' ? fil : (await impl.loadFils(config)).find((f) => f.id === id); exigix();
      if (!filObj || ambitDelFil(filObj).xifrat) await exigixOptin(id);
      fixa();
      const resultat = await decorat[nom](fil, cos, { ...config, ...(opcions.signal ? { signal: opcions.signal } : {}) }); exigix();
      return resultat;
    };
  }
  // L'abast també acompanya les lectures i les capacitats delegades. Una
  // resposta d'A que arriba després d'A→B mai no torna al consumidor B.
  for (const [nom, fn] of Object.entries(backend)) if (typeof fn === 'function') {
    backend[nom] = function (...args) {
      exigix();
      const resultat = Reflect.apply(fn, decorat, args);
      if (resultat && typeof resultat.then === 'function') return resultat.then((valor) => { exigix(); return valor; });
      exigix(); return resultat;
    };
  }
  fixa();
  const control = Object.freeze({
    backend: Object.freeze(backend),
    alta: (cerimonia) => exclusiu(async () => {
      if (typeof cerimonia !== 'function') throw falla('cerimonia-obligatoria');
      const files = await impl.laMevaIdentitatXat(config); exigix();
      if (!Array.isArray(files) || files.some((r) => r.retiradaAl == null)) throw falla('identitat-ja-existent');
      const alta = await creaAlta(entorn.cripto, { ...opcionsAlta, usuari, creatMs: ara() });
      try {
        exigix();
        if (await cerimonia(alta.indexs) !== true) throw falla('cerimonia-cancellada');
        exigix();
        const kid = await impl.publicaIdentitatXat(alta.publicacio, config); exigix();
        if (kid !== aBase64url(alta.identitat.kid)) throw falla('publicacio-no-confirmada');
        // Relectura després del CAS remot: l'ACK sol no acredita la clau vigent.
        const remot = await actiuRemot();
        if (remot.kid !== kid || remot.declaracio !== alta.publicacio.declaracio) throw falla('publicacio-no-confirmada');
        return await desa(alta.identitat);
      } finally { alta.indexs.fill(0); }
    }),
    restauraFrase: (indexs) => exclusiu(async () => {
      const registre = await actiuRemot();
      const identitat = await restauraAmbFrase(entorn.cripto, { ...opcionsAlta, usuari, registre, indexs }); exigix();
      return desa(identitat);
    }),
    restauraSocial: recuperacio => exclusiu(() => restauraSocial(recuperacio)),
    potRecuperarSocial: typeof capturaRecuperacioSocial==='function'&&typeof llegixMaterialSocial==='function',
    recuperaAmbAmics: () => exclusiu(async()=>{
      if(!control.potRecuperarSocial)throw falla('sense-material-social');
      const recuperacio=await capturaRecuperacioSocial(context);exigix();return restauraSocial(recuperacio);
    }),
    activaFil: (filId) => exclusiu(async () => {
      const identitat = await magatzem.identitat(ci); exigix();
      const registre = await actiuRemot();
      if (!identitat || registre.kid !== aBase64url(identitat.kid)) throw falla('claus-no-disponibles');
      const llista = await impl.loadFils(config); exigix();
      const fil = llista.find((f) => f.id === filId);
      const abast = ambitDelFil(fil);
      if (!fil || !abast.xifrat || abast.bloquejat || abast.tipusFil === 'entitat') throw falla('fil-no-admissible');
      await preferencies.activa(ci,filId,aBase64url(identitat.kid),{exigix});exigix();fixa();
      return Object.freeze({ usuari, filId, actiu: true });
    }),
    estatFil,
    revocaFil: filId => exclusiu(async()=>{await preferencies.revoca(ci,filId,{exigix});exigix();servei.descartaEstatsFils();return Object.freeze({usuari,filId,actiu:false});}),
    tanca: () => { tancat = true; preferencies.tanca(); servei.oblidaClausXat(); }
  });
  registraServeiXifratXat(backend,Object.freeze({...servei,cerimonies:control}));
  return control;
}
