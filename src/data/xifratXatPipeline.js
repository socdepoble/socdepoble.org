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
 *
 * Fora d'esta onada (es rebutja amb codi, mai en clar): els fils amb entitat
 * (equip signat, §4.8), l'alta de la identitat amb la frase (F2a, §5) i la
 * rotació d'època d'un fil on no sóc membre.
 */
import { aBase64url, deBase64url, exigixCripto, sha256 } from './xifratXatCripto.js';
import { MOTIU_EPOCA, ROL_EPOCA, TIPUS_FIL } from './xifratXatFormats.js';
import { CODI, aplicaEpoca, creaDirectori, creaEpoca, esErrorProtocol, estatFilNou, obriMissatge, publiquesDe, xifraMissatge } from './xifratXatProtocol.js';
import { desxifraAdjuntXat, metadadesAdjuntDe, midaBlobAdjunt, TIPUS_DE_CLASSE, xifraAdjuntXat } from './xatMultimediaXifrat.js';

export const VERSIO_SOBRE = 1;
export const PREFIX_CLAUS_XAT = 'sdp_xat_';
export const CODI_MOTOR = Object.freeze({
  senseAmbit: 'sense-ambit', clausBloquejades: 'claus-bloquejades', clauAbsent: 'clau-absent-del-contacte',
  equipPendent: 'equip-pendent', filSenseMembres: 'fil-sense-membres', senseCapacitat: 'sense-capacitat-e2ee',
  ecoNoQuadra: 'eco-no-quadra', encuat: 'encuat'
});
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

export const desserialitzaSobre = (s) => ({ receptor: s.receptor, kidReceptor: deBase64url(s.kidReceptor, 16), enc: deBase64url(s.enc), ct: deBase64url(s.ct) });

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

  const fixaContacte = async (directori, c) => directori.fixa({
    usuari: c.usuariId ?? c.usuari, kid: deBase64url(c.kid, 16), sigPub: deBase64url(c.sigPub, 65), dhPub: deBase64url(c.dhPub, 65)
  });

  const exigixTransport = (nom) => {
    if (typeof impl[nom] !== 'function') throw errorMotor(CODI_MOTOR.senseCapacitat, `El backend no exposa ${nom}.`, { reintentable: false });
  };

  /** El context d'un fil (estat del protocol, directori, jo, membres), construït una vegada per àmbit. */
  const contextDelFil = async ({ fil, tipusFil, config, exigix }) => {
    const desat = servei.estatFilDesat(fil.id);
    if (desat) return desat;
    const { ci, joId } = claus();
    const tipus = TIPUS_DEL_FIL[tipusFil];
    if (tipus === undefined) throw errorMotor('tipus-de-fil', 'Este tipus de fil no es pot xifrar.', { reintentable: false });
    if (tipus === TIPUS_FIL.entitat) throw errorMotor(CODI_MOTOR.equipPendent, 'Els fils amb una entitat necessiten l’equip signat (§4.8): encara no es xifren.', { reintentable: false });
    const jo = await identitat(ci);
    exigix();
    if (jo.usuari !== joId) throw bloquejat(CODI_MOTOR.clausBloquejades, 'Les claus d’este aparell són d’una altra persona.');
    const membres = membresDe(fil, joId);
    if (membres.length < 2) throw errorMotor(CODI_MOTOR.filSenseMembres, 'El fil no té cap altre membre amb qui xifrar.', { reintentable: false });
    const directori = creaDirectori(cripto);
    await directori.fixa(publiquesDe(jo));
    exigixTransport('clausDeXat');
    const publiques = await impl.clausDeXat(membres.filter((u) => u !== joId), config);
    exigix();
    for (const c of Array.isArray(publiques) ? publiques : []) await fixaContacte(directori, c);
    const estat = estatFilNou({ fil: fil.id, tipusFil: tipus });
    exigixTransport('epoquesDelFilXat');
    const epoques = [...(await impl.epoquesDelFilXat(fil.id, 0, config) ?? [])].sort((a, b) => a.epoca - b.epoca);
    exigix();
    if (epoques.length) {
      exigixTransport('sobresMeusXat');
      const sobres = (await impl.sobresMeusXat(fil.id, epoques.map((e) => e.epoca), config)) ?? [];
      exigix();
      for (const e of epoques) {
        await aplicaEpoca(cripto, {
          estat, jo, declaracio: deBase64url(e.declaracio), firma: deBase64url(e.firma), directori, vigent: exigix,
          sobres: sobres.filter((s) => s.epoca === e.epoca).map(desserialitzaSobre)
        });
      }
    }
    const context = Object.freeze({ estat, directori, jo, membres });
    servei.desaEstatFil(fil.id, context);
    return context;
  };

  const normalitzaCos = (cos) => (typeof cos === 'string' ? { text: cos } : (cos && typeof cos === 'object' ? cos : { text: null }));

  /** El paquet xifrat d'un enviament; amb la gènesi (epocaNova) si el fil encara no té època meua. */
  const prepara = async ({ fil, tipusFil, cos, config, exigix }) => {
    const entrada = normalitzaCos(cos);
    const ctx = await contextDelFil({ fil, tipusFil, config, exigix });
    const id = typeof entrada.id === 'string' ? entrada.id : cripto.randomUUID();
    let epocaNova = null;
    if (ctx.estat.cap === null || ctx.estat.cap.ck === null) {
      const epoca = (ctx.estat.ultima?.epoca ?? 0) + 1;
      let genesi;
      try {
        genesi = await creaEpoca(cripto, {
          estat: ctx.estat, jo: ctx.jo, membres: ctx.membres.map((usuari) => ({ usuari, rol: ROL_EPOCA.membre })),
          motiu: epoca === 1 ? null : MOTIU_ROTACIO, creatMs: ara(), directori: ctx.directori, vigent: exigix
        });
      } catch (error) {
        if (esAmbitCanviat(error)) throw error;
        if (error?.codi === CODI.kidNoFixat) throw bloquejat(CODI_MOTOR.clauAbsent, 'Esperant que l’altra persona active el xifrat.', error);
        throw error;
      }
      await aplicaEpoca(cripto, { estat: ctx.estat, jo: ctx.jo, declaracio: genesi.declaracio, firma: genesi.firma, sobres: genesi.sobres, directori: ctx.directori, vigent: exigix });
      epocaNova = serialitzaEpoca(genesi);
    }
    const contingut = { t: typeof entrada.text === 'string' ? entrada.text : null };
    if (entrada.a) contingut.a = entrada.a;
    if (entrada.mini) contingut.mini = entrada.mini;
    const fila = await xifraMissatge(cripto, { estat: ctx.estat, jo: ctx.jo, id, contingut, comOrg: entrada.comOrgId ?? null, respostaA: entrada.respostaA ?? null, vigent: exigix });
    return Object.freeze({ id, text: null, tipus: 'text', respostaA: entrada.respostaA ?? null, xifrat: serialitzaXifrat(fila), epocaNova });
  };

  /** L'eco d'un enviament: el servidor ha desat el que he enviat (IS-19) i la interfície rep el text en clar. */
  const eco = (resultat, paquet, cos, filId = resultat?.filId ?? null) => {
    const entrada = normalitzaCos(cos);
    if (resultat?.xifrat && resultat.xifrat.tf !== paquet.xifrat.tf) throw errorMotor(CODI_MOTOR.ecoNoQuadra, 'El servidor no ha desat el missatge que s’ha enviat.', { reintentable: false });
    const text = typeof entrada.text === 'string' ? entrada.text : null;
    const seguretat = Object.freeze({ xifrat: true, clauAntiga: false, verificat: true, propi: true });
    if (resultat?.id && filId) servei.desaTextDesxifrat(filId, resultat.id, { text, seguretat, a: entrada.a ?? null });
    return Object.freeze({ ...resultat, text, seguretat });
  };

  /* Si l'enviament que portava la gènesi falla, el servidor no té l'època: el context es refà del servidor. */
  const descarta = (filId) => { servei.desaEstatFil(filId, null); };

  /* Una fila xifrada → text en clar i metadades de sempre; cap error de fila tomba la llista. */
  const obriUna = async (ctx, filId, fila, exigix) => {
    const enCau = servei.textDesxifrat(filId, fila.id);
    if (enCau) return enCau;
    let obert;
    try {
      obert = await obriMissatge(cripto, { estat: ctx.estat, fila: desserialitzaXifrat(fila, filId), directori: ctx.directori, vigent: exigix });
    } catch (error) {
      if (esAmbitCanviat(error)) throw error;
      return Object.freeze({ text: null, seguretat: Object.freeze({ xifrat: true, verificat: false, codi: esErrorProtocol(error) ? error.codi : (error?.codi ?? 'sobre-invalid') }), a: null });
    }
    const a = obert.contingut?.a ?? null;
    if (a) servei.desaAdjunt(a.id, Object.freeze({ fil: filId, emissor: obert.emissor, a }));
    const valor = Object.freeze({
      text: obert.contingut?.t ?? null,
      seguretat: Object.freeze({ xifrat: true, firmada: obert.firmada === true, clauAntiga: obert.clauAntiga === true, verificat: true }),
      a
    });
    servei.desaTextDesxifrat(filId, fila.id, valor);
    return valor;
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
    for (const fila of files) {
      if (!fila?.xifrat) { resultat.push(fila); continue; }
      if (ctx === null) { resultat.push({ ...fila, text: null, seguretat: Object.freeze({ xifrat: true, verificat: false, codi: bloqueig }) }); continue; }
      resultat.push(vesteix(fila, await obriUna(ctx, fil.id, fila, exigix)));
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
    const valor = await obriUna(ctx, fil.id, { id: u.id, usuariId: u.usuariId ?? u.emissor, comOrgId: u.comOrgId ?? null, respostaA: u.respostaA ?? null, xifrat: u.xifrat }, exigix);
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
        eco(resultat, paquet, entrada.contingut, fil.id);
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
    const fitxer = entrada?.fitxer;
    if (!fitxer || typeof fitxer.arrayBuffer !== 'function') throw errorMotor('adjunt-invalid', 'Cal el fitxer de l’adjunt.', { reintentable: false });
    const bytes = new Uint8Array(await fitxer.arrayBuffer());
    exigix();
    let xifrat;
    try {
      xifrat = await xifraAdjuntXat({ cripto, fil: fil.id, adjunt: entrada.id, emissor: ctx.jo.usuari, bytes, mime: fitxer.type, durada: entrada.duradaMs ?? null, vigent: exigix });
    } finally {
      bytes.fill(0);
    }
    const paquet = await prepara({ fil, tipusFil, cos: { id: entrada.id, text: typeof entrada.text === 'string' ? entrada.text : null, a: xifrat.a, respostaA: entrada.respostaA ?? null }, config, exigix });
    let resultat;
    try {
      resultat = await impl.publicaAdjuntXifratXat(fil.id, { id: entrada.id, blob: xifrat.blob, mida: xifrat.mida, xifrat: paquet.xifrat, respostaA: paquet.respostaA, epocaNova: paquet.epocaNova }, config);
    } catch (error) {
      if (paquet.epocaNova) descarta(fil.id);
      throw error;
    }
    exigix();
    servei.desaAdjunt(xifrat.a.id, Object.freeze({ fil: fil.id, emissor: ctx.jo.usuari, a: xifrat.a }));
    const vestit = eco(resultat, paquet, { text: entrada.text ?? null, a: xifrat.a }, fil.id);
    return vesteix(vestit, { text: vestit.text, seguretat: vestit.seguretat, a: xifrat.a });
  };

  const urlAdjunt = async ({ id, config, exigix, renova = false }) => {
    const info = servei.adjuntDesat(id);
    if (!info) return null;
    if (typeof creaBlob !== 'function' || typeof creaUrl !== 'function') throw errorMotor('sense-blob', 'Cal creaBlob i creaUrl per a servir un adjunt desxifrat.', { reintentable: false });
    exigixTransport('bytesAdjuntXat');
    const clauCau = `${id}:${aBase64url(await sha256(cripto, info.a.k))}`;
    exigix();
    const desada = renova ? null : servei.urlAdjuntDesada(clauCau);
    if (desada) return desada;
    const blob = await impl.bytesAdjuntXat(id, { midaEsperada: midaBlobAdjunt(info.a.b), ...config });
    exigix();
    const { bytes, mime } = await desxifraAdjuntXat({ cripto, fil: info.fil, emissor: info.emissor, a: info.a, blob, vigent: exigix });
    const url = creaUrl(creaBlob([bytes], { type: mime }));
    bytes.fill(0);
    servei.desaUrlAdjunt(clauCau, url);
    return url;
  };

  /* ── Oblit (D-09) ── */
  const esborraClausDe = (magatzemWeb) => {
    if (!magatzemWeb || typeof magatzemWeb.length !== 'number') return;
    const claus = [];
    for (let i = 0; i < magatzemWeb.length; i += 1) {
      const clau = magatzemWeb.key(i);
      if (typeof clau === 'string' && clau.startsWith(PREFIX_CLAUS_XAT)) claus.push(clau);
    }
    for (const clau of claus) magatzemWeb.removeItem(clau);
  };

  const oblidaTot = async ({ sessio = null, preferencies = null, mantenSessio = false } = {}) => {
    let ci = null;
    try { ({ ci } = claus()); } catch { /* sense àmbit: només RAM i magatzems web */ }
    const causes = [];
    const pendents = [];
    servei.oblidaClausXat();
    if (ci !== null) {
      try { await magatzem.oblidaEnTancar(ci, { mantenSessio }); } catch (error) { causes.push(error); pendents.push('indexeddb'); }
      try { magatzem.tanca?.(); } catch { /* ja tancat */ }
    }
    try { esborraClausDe(sessio); } catch (error) { causes.push(error); pendents.push('sessio'); }
    try { esborraClausDe(preferencies); } catch (error) { causes.push(error); pendents.push('preferencies'); }
    const estat = Object.freeze({ estat: pendents.length ? ESTAT_OBLIT.fallit : ESTAT_OBLIT.oblidat, pendents: Object.freeze(pendents), causes: Object.freeze(causes), quanMs: ara() });
    servei.desaEstatOblit(estat);
    return estat;
  };

  return Object.freeze({ claus, contextDelFil, prepara, eco, descarta, obri, resumDelFil, encua, drena, publicaAdjunt, urlAdjunt, oblidaTot });
}
