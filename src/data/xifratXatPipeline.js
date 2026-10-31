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
import { desxifraAdjuntXat, errorPressupostBlobs, metadadesAdjuntDe, midaBlobAdjunt, TIPUS_DE_CLASSE, xifraAdjuntXat } from './xatMultimediaXifrat.js';

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
    /* Gauntlet c2 (C1) · Entre l'última guarda d'aplicaEpoca i ací l'àmbit pot haver canviat:
       el context (amb la meua identitat) mai no entra a la RAM d'un altre àmbit. */
    exigix();
    const context = Object.freeze({ estat, directori, jo, membres });
    servei.desaEstatFil(fil.id, context);
    return context;
  };

  const normalitzaCos = (cos) => (typeof cos === 'string' ? { text: cos } : (cos && typeof cos === 'object' ? cos : { text: null }));

  /** El paquet xifrat d'un enviament; amb la gènesi (epocaNova) si el fil encara no té època meua. */
  const prepara = async ({ fil, tipusFil, cos, config, exigix }) => {
    const entrada = normalitzaCos(cos);
    const id = typeof entrada.id === 'string' ? entrada.id : cripto.randomUUID();
    /* Cicle 4 (tancament, e2ee-index-adjunts) · Un adjunt és del missatge que el porta: `a.id`
       és l'id de la fila (publicaAdjunt i el blob al servidor). Qui rep tanca la fila que no ho
       complix; ací no s'arriba ni a enviar-la. */
    if (entrada.a && entrada.a.id !== id) throw errorMotor(CODI.adjuntIncoherent, 'L’adjunt no és d’este missatge.', { reintentable: false });
    const ctx = await contextDelFil({ fil, tipusFil, config, exigix });
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
      const des = ctx.estat.ultima?.epoca ?? 0;
      exigixTransport('epoquesDelFilXat');
      const noves = [...(await impl.epoquesDelFilXat(filId, des, config) ?? [])]
        .filter((e) => Number.isSafeInteger(e?.epoca) && e.epoca > des).sort((a, b) => a.epoca - b.epoca);
      exigix();
      if (!noves.length) return false;
      exigixTransport('sobresMeusXat');
      const sobres = (await impl.sobresMeusXat(filId, noves.map((e) => e.epoca), config)) ?? [];
      exigix();
      let aplicades = 0;
      for (const e of noves) {
        try {
          await aplicaEpoca(cripto, {
            estat: ctx.estat, jo: ctx.jo, declaracio: deBase64url(e.declaracio), firma: deBase64url(e.firma), directori: ctx.directori, vigent: exigix,
            sobres: sobres.filter((s) => s.epoca === e.epoca).map(desserialitzaSobre)
          });
          aplicades += 1;
        } catch (error) {
          if (esAmbitCanviat(error)) throw error;
          /* No valida: aplicaEpoca l'ha marcada saltada (o no encadena) i la resta prova igual (IS-12). */
        }
      }
      exigix();
      return aplicades > 0;
    })();
    resincronitzacions.set(ctx, promesa);
    const solta = () => { if (resincronitzacions.get(ctx) === promesa) resincronitzacions.delete(ctx); };
    promesa.then(solta, solta);
    return promesa;
  };

  const obre = (ctx, filId, fila, exigix) => obriMissatge(cripto, { estat: ctx.estat, fila: desserialitzaXifrat(fila, filId), directori: ctx.directori, vigent: exigix });
  const filaTancada = (error) => Object.freeze({ text: null, seguretat: Object.freeze({ xifrat: true, verificat: false, codi: esErrorProtocol(error) ? error.codi : (error?.codi ?? 'sobre-invalid') }), a: null });
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
      return filaTancada(fallada);
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
      const vestit = eco(resultat, paquet, { text: entrada.text ?? null, a: xifrat.a }, fil.id);
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

  return Object.freeze({ claus, contextDelFil, prepara, eco, descarta, obri, resumDelFil, encua, drena, publicaAdjunt, urlAdjunt, oblidaTot });
}
