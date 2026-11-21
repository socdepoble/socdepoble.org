/* R24 · CODEX-R24-03 · Capacitat opcional 'consensIsoglosses' (src/data/contracte.js) del
   joc «D'on parles?» (src/components/patrimoni/JocDonParlesCard.jsx): el resum col·lectiu,
   el vot d'una variant i l'aportació d'una variant nova. Una sola font de validació i de
   mapatge per a tots els adaptadors, darrere de l'únic port neutral (backendPort.js):
     · l'adaptador Supabase (src/data/supabase/consensIsoglosses.js) la fa servir contra
       els objectes SQL de les migracions R23 de la capacitat (la RPC
       public.resum_consens_isoglosses_poble(text) i les taules
       public.joc_isoglosses_vots_consens i public.aportacions_veu_poble);
     · l'adaptador local (adaptadorLocal.js, la carpeta del node sense servidor) hi compon
       el magatzem en memòria de baix, com els altres magatzems petits de la instància;
     · tests/r24-consens-isoglosses-postgres.test.mjs prova el mateix mapatge contra eixe
       SQL sobre PostgreSQL real.
   Sense cap import a posta: Node i Vite el llegixen igual.

   L'autoria no ve mai de qui crida: l'adaptador la pren de la sessió. Una clau d'autoria,
   de moderació o de recompte a l'entrada és un TypeError, com qualsevol clau desconeguda. */

export const ABASTS_COMARCALS = Object.freeze(['nomes_poble', 'crec_comarca', 'alguns_veins', 'no_ho_se']);
export const VERSIO_CONSENTIMENT_VEU = 'cc-by-sa-4.0-v1';
/* El LIMIT de public.resum_consens_isoglosses_poble. */
export const LIMIT_RESUM_CONSENS = 250;

const RE_PREGUNTA = /^[a-z0-9_]{3,80}$/;
const RE_CLAU = /^[a-z0-9_]{2,80}$/;
const RE_COMARCA = /^[a-z0-9_]{2,40}$/;
const RE_UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
/* La clau de comarca «No ho sé / Una altra comarca» del joc no és cap comarca: no es desa. */
const COMARCA_DESCONEGUDA = 'no_ho_se';

const CLAUS_CONSULTA = Object.freeze(['preguntaId']);
const CLAUS_VOT = Object.freeze(['preguntaId', 'variantClau', 'paraulaEtiqueta', 'poble', 'comarcaId', 'abastComarcal']);
const CLAUS_APORTACIO = Object.freeze(['tipus', 'paraula', 'poble', 'comarcaId', 'abastComarcal', 'pobleComarca', 'preguntaId',
  'consentimentArxiuObert', 'consentimentVersio', 'consentimentAcceptatAt']);
/* Camps del registre local del joc (desaAportacioIsoglossaLocal) que la targeta envia
   sencer: són de presentació o del dispositiu i no arriben mai al servidor. */
const CLAUS_APORTACIO_IGNORADES = Object.freeze(['id', 'comarcaNom', 'areaId', 'opcioVivaId']);

export function errorConsens(code, missatge, extra = {}) {
  const Tipus = code === 'consens-invalid' ? TypeError : Error;
  return Object.assign(new Tipus(missatge), { code, ...extra });
}
const invalid = (missatge) => errorConsens('consens-invalid', missatge);

/* La mateixa clau de mot que el joc (isoglossesComarcals.js · normalitzaClauMot): NFD,
   sense marques combinants, minúscules i cada tram que no és [a-z0-9] fet «_». */
export function clauDeMot(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/* Un objecte pla llegit només per propietats de dades pròpies: cap getter s'executa, cap
   prototip aporta camps i cap clau fora de la llista passa. */
function capturaPla(entrada, admeses, ignorades = []) {
  if (entrada === undefined || entrada === null) return {};
  if (typeof entrada !== 'object' || Array.isArray(entrada)) throw invalid('L’entrada ha de ser un objecte.');
  const proto = Object.getPrototypeOf(entrada);
  if (proto !== Object.prototype && proto !== null) throw invalid('L’entrada ha de ser un objecte pla.');
  const net = {};
  for (const clau of Reflect.ownKeys(entrada)) {
    if (typeof clau !== 'string') throw invalid('L’entrada no admet símbols.');
    const descriptor = Object.getOwnPropertyDescriptor(entrada, clau);
    if (!Object.hasOwn(descriptor, 'value')) throw invalid(`«${clau}» ha de ser una dada, no un accessor.`);
    if (ignorades.includes(clau)) continue;
    if (!admeses.includes(clau)) throw invalid(`L’entrada no admet «${clau}».`);
    net[clau] = descriptor.value;
  }
  return net;
}

const text = (valor) => (typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : null);
function textObligat(valor, nom, min, max) {
  const t = text(valor);
  if (t === null || t.length < min || t.length > max) throw invalid(`${nom} ha de tindre entre ${min} i ${max} caràcters.`);
  return t;
}
function textOpcional(valor, nom, min, max) {
  if (valor === undefined || valor === null) return null;
  const t = text(valor);
  if (t === null) throw invalid(`${nom} ha de ser text.`);
  if (t === '') return null;
  if (t.length < min || t.length > max) throw invalid(`${nom} ha de tindre entre ${min} i ${max} caràcters.`);
  return t;
}
function pregunta(valor, obligatoria) {
  if (!obligatoria && (valor === undefined || valor === null || valor === '')) return null;
  if (typeof valor !== 'string' || !RE_PREGUNTA.test(valor)) throw invalid('preguntaId no és una pregunta vàlida.');
  return valor;
}
function comarca(valor) {
  if (valor === undefined || valor === null || valor === '' || valor === COMARCA_DESCONEGUDA) return null;
  if (typeof valor !== 'string' || !RE_COMARCA.test(valor)) throw invalid('comarcaId no és una comarca vàlida.');
  return valor;
}
function abast(valor, perDefecte) {
  if (valor === undefined || valor === null || valor === '') return perDefecte;
  if (!ABASTS_COMARCALS.includes(valor)) throw invalid('abastComarcal no és un abast vàlid.');
  return valor;
}

/** lligConsensIsoglossesPoble({ preguntaId? }) → { preguntaId|null } */
export function capturaConsultaConsens(entrada) {
  const e = capturaPla(entrada, CLAUS_CONSULTA);
  return Object.freeze({ preguntaId: pregunta(e.preguntaId, false) });
}

/** votaVariantIsoglossaPoble({ preguntaId, variantClau, paraulaEtiqueta, poble?, comarcaId?, abastComarcal? }) */
export function capturaVotVariant(entrada) {
  if (entrada === undefined || entrada === null) throw invalid('Cal la variant votada.');
  const e = capturaPla(entrada, CLAUS_VOT);
  const preguntaId = pregunta(e.preguntaId, true);
  if (typeof e.variantClau !== 'string' || !RE_CLAU.test(e.variantClau)) throw invalid('variantClau no és una clau de variant.');
  const paraulaEtiqueta = textObligat(e.paraulaEtiqueta, 'paraulaEtiqueta', 2, 120);
  /* L'etiqueta és el mot de la clau: un vot no pot posar un altre text damunt d'una variant. */
  if (clauDeMot(paraulaEtiqueta) !== e.variantClau) throw invalid('paraulaEtiqueta no és el mot de variantClau.');
  return Object.freeze({
    preguntaId, variantClau: e.variantClau, paraulaEtiqueta,
    poble: textOpcional(e.poble, 'poble', 2, 80),
    comarcaId: comarca(e.comarcaId),
    abastComarcal: abast(e.abastComarcal, 'no_ho_se')
  });
}

/** desaAportacioVeuPoble({ tipus: 'variant_isoglossa', paraula, pobleComarca|poble, consentiment…, … })
    Només la variant escrita: una aportació d'àudio (refrany_audio) necessita un transport
    de mitjans que esta capacitat no té, i es rebutja abans de cap escriptura. */
export function capturaAportacioVeu(entrada) {
  if (entrada === undefined || entrada === null) throw invalid('Cal l’aportació.');
  const e = capturaPla(entrada, CLAUS_APORTACIO, CLAUS_APORTACIO_IGNORADES);
  if (e.tipus !== 'variant_isoglossa') throw invalid('Esta capacitat només desa variants escrites (tipus variant_isoglossa).');
  if (e.consentimentArxiuObert !== true || e.consentimentVersio !== VERSIO_CONSENTIMENT_VEU) {
    throw invalid('Cal el consentiment explícit d’arxiu obert (cc-by-sa-4.0-v1).');
  }
  const instant = typeof e.consentimentAcceptatAt === 'string' ? Date.parse(e.consentimentAcceptatAt) : Number.NaN;
  if (!Number.isFinite(instant)) throw invalid('consentimentAcceptatAt ha de ser un instant.');
  const poble = textOpcional(e.poble, 'poble', 2, 80);
  const pobleComarca = textOpcional(e.pobleComarca, 'pobleComarca', 2, 120) ?? poble;
  if (!pobleComarca) throw invalid('Cal el poble de l’aportació.');
  return Object.freeze({
    tipus: 'variant_isoglossa',
    preguntaId: pregunta(e.preguntaId, false),
    paraula: textObligat(e.paraula, 'paraula', 2, 280),
    poble, pobleComarca,
    comarcaId: comarca(e.comarcaId),
    abastComarcal: abast(e.abastComarcal, null),
    consentimentAcceptatAt: new Date(instant).toISOString()
  });
}

/* ── Del contracte a les files de les taules (la columna user_id la posa l'adaptador) ── */
export const filaDeVot = (vot, userId) => ({
  user_id: userId, pregunta_id: vot.preguntaId, variant_clau: vot.variantClau, paraula_etiqueta: vot.paraulaEtiqueta,
  poble: vot.poble, comarca_id: vot.comarcaId, abast_comarcal: vot.abastComarcal
});
export const filaDAportacio = (a, userId) => ({
  user_id: userId, tipus: a.tipus, pregunta_id: a.preguntaId, text_aportat: a.paraula, poble_comarca: a.pobleComarca,
  poble: a.poble, comarca_id: a.comarcaId, abast_comarcal: a.abastComarcal,
  consentiment_arxiu_obert: true, consentiment_versio: VERSIO_CONSENTIMENT_VEU, consentiment_acceptat_at: a.consentimentAcceptatAt
});

/* ── Del servidor al contracte ── */
/** Una fila de public.resum_consens_isoglosses_poble → { preguntaId, variantClau, paraula, poble, comarcaId, vots }.
    Onada R24.2 · La RPC torna una fila per pregunta, variant i comarca (R23-U05): qui la
    consumix suma per variantClau. Pren min(paraula_etiqueta) retallada dins de cada fila: si
    eixe text no és el mot de la clau (un vot escrit sense este port), no es mostra cap text
    lliure aliè i l'etiqueta és la clau mateixa. Les longituds es compten en punts de codi
    després de retallar, com char_length(btrim(…)) dels CHECK de l'SQL. */
const llargaria = (valor) => [...valor.trim()].length;
export function filaConsensDelServidor(f) {
  const recompte = f?.total_vots;
  const recompteValid = (typeof recompte === 'number' || typeof recompte === 'string' && /^[1-9][0-9]{0,15}$/.test(recompte))
    && Number.isSafeInteger(Number(recompte)) && Number(recompte) >= 1;
  if (!f || typeof f !== 'object' || Array.isArray(f)
    || typeof f.pregunta_id !== 'string' || !RE_PREGUNTA.test(f.pregunta_id)
    || typeof f.variant_clau !== 'string' || !RE_CLAU.test(f.variant_clau)
    || typeof f.paraula_etiqueta !== 'string' || !f.paraula_etiqueta.trim() || llargaria(f.paraula_etiqueta) > 120
    || (f.poble_exemple !== null && (typeof f.poble_exemple !== 'string' || llargaria(f.poble_exemple) > 80))
    || (f.comarca_id !== null && (typeof f.comarca_id !== 'string' || !RE_COMARCA.test(f.comarca_id)))
    || !recompteValid) {
    throw invalid('Fila de consens d’isoglosses invàlida.');
  }
  const etiqueta = text(f.paraula_etiqueta);
  return Object.freeze({
    preguntaId: f.pregunta_id,
    variantClau: f.variant_clau,
    paraula: clauDeMot(etiqueta) === f.variant_clau ? etiqueta : f.variant_clau.replace(/_/g, ' '),
    poble: text(f.poble_exemple) || null,
    comarcaId: f.comarca_id && f.comarca_id !== COMARCA_DESCONEGUDA ? f.comarca_id : null,
    vots: Number(f.total_vots)
  });
}
export function resumConsensDelServidor(files) {
  if (!Array.isArray(files) || files.length > LIMIT_RESUM_CONSENS) throw invalid('Resum de consens d’isoglosses invàlid.');
  return files.map(filaConsensDelServidor);
}
/** La fila tornada per l'INSERT del vot (o cap, si ja hi era) → { preguntaId, variantClau, nou }. */
export function votDelServidor(files, vot) {
  if (!Array.isArray(files) || files.length > 1) throw invalid('Resposta del vot invàlida.');
  const [f] = files;
  if (files.length && (!f || typeof f !== 'object' || Array.isArray(f) || f.pregunta_id !== vot.preguntaId || f.variant_clau !== vot.variantClau)) throw invalid('Resposta del vot d’una altra variant.');
  return Object.freeze({ preguntaId: vot.preguntaId, variantClau: vot.variantClau, nou: files.length === 1 });
}
/** La fila tornada per l'INSERT de l'aportació → { id, estatModeracio: 'pendent', creatA }. */
export function aportacioDelServidor(files) {
  const f = Array.isArray(files) && files.length === 1 ? files[0] : null;
  if (!f || typeof f.id !== 'string' || !RE_UUID.test(f.id) || f.estat_moderacio !== 'pendent'
    || typeof f.created_at !== 'string' || !Number.isFinite(Date.parse(f.created_at))) {
    throw invalid('Resposta de l’aportació invàlida.');
  }
  return Object.freeze({ id: f.id.toLowerCase(), estatModeracio: 'pendent', creatA: f.created_at });
}

/* ── Magatzem en memòria (l'adaptador local) ──
   Les mateixes regles que l'SQL: un vot per persona, pregunta i variant (el repetit no
   compta), una aportació nova sempre pendent de moderació i un resum que agrega com la
   RPC: una fila per pregunta, variant i comarca (R23-U05; la comarca buida és «sense
   comarca»), min de l'etiqueta retallada, el poble només quan almenys dos vots de la fila
   el comparteixen (el més freqüent; a igualtat, el primer en ordre de codi, com la
   col·lació "C"), recompte, ordre, com a molt 20 files per pregunta i LIMIT (Onada R24.2,
   CODEX-R24-D1-07 i Gauntlet). Sense sessió, cap escriptura. */
export function creaConsensIsoglossesMemoria({ usuari, ara = () => new Date(), nouId = () => globalThis.crypto.randomUUID() } = {}) {
  if (typeof usuari !== 'function') throw new TypeError('[consensIsoglosses] Cal la funció de la sessió.');
  const vots = new Map();
  const aportacions = [];
  const persona = () => {
    const id = usuari()?.id;
    if (!id) throw errorConsens('sense-sessio', 'Cal iniciar sessió per a votar o aportar una variant.', { status: 401 });
    return String(id);
  };
  const instant = () => new Date(ara()).toISOString();
  const minim = (llista) => llista.filter((v) => typeof v === 'string' && v.trim()).sort()[0] ?? null;
  const net = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const POBLE_MINIM_DE_VOTS = 2;
  const FILES_PER_PREGUNTA = 20;
  const pobleCompartit = (llista) => {
    const comptes = new Map();
    for (const v of llista.map(net)) if (v) comptes.set(v, (comptes.get(v) || 0) + 1);
    let millor = null;
    for (const [v, n] of [...comptes].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
      if (n >= POBLE_MINIM_DE_VOTS && (!millor || n > comptes.get(millor))) millor = v;
    }
    return millor;
  };
  const compara = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  const metodes = {
    /* El config (senyal inclòs) el mira la guarda de l'adaptador local. */
    lligConsensIsoglossesPoble(entrada) {
      const { preguntaId } = capturaConsultaConsens(entrada);
      const grups = new Map();
      for (const v of vots.values()) {
        if (preguntaId && v.preguntaId !== preguntaId) continue;
        const clau = `${v.preguntaId}\u0000${v.variantClau}\u0000${net(v.comarcaId) ?? ''}`;
        if (!grups.has(clau)) grups.set(clau, []);
        grups.get(clau).push(v);
      }
      const files = [...grups.values()].map((g) => ({
        pregunta_id: g[0].preguntaId, variant_clau: g[0].variantClau,
        paraula_etiqueta: minim(g.map((v) => net(v.paraulaEtiqueta))), poble_exemple: pobleCompartit(g.map((v) => v.poble)),
        comarca_id: net(g[0].comarcaId), total_vots: g.length
      })).sort((a, b) => compara(a.pregunta_id, b.pregunta_id) || b.total_vots - a.total_vots
        || compara(a.variant_clau, b.variant_clau)
        || (a.comarca_id === b.comarca_id ? 0 : a.comarca_id === null ? 1 : b.comarca_id === null ? -1 : compara(a.comarca_id, b.comarca_id)));
      const perPregunta = new Map();
      const tallades = files.filter((f) => {
        const n = (perPregunta.get(f.pregunta_id) || 0) + 1;
        perPregunta.set(f.pregunta_id, n);
        return n <= FILES_PER_PREGUNTA;
      });
      return resumConsensDelServidor(tallades.slice(0, LIMIT_RESUM_CONSENS));
    },
    votaVariantIsoglossaPoble(entrada) {
      const vot = capturaVotVariant(entrada);
      const userId = persona();
      const clau = `${userId}\u0000${vot.preguntaId}\u0000${vot.variantClau}`;
      const nou = !vots.has(clau);
      if (nou) vots.set(clau, Object.freeze({ ...vot, userId, creatA: instant() }));
      return Object.freeze({ preguntaId: vot.preguntaId, variantClau: vot.variantClau, nou });
    },
    desaAportacioVeuPoble(entrada) {
      const aportacio = capturaAportacioVeu(entrada);
      const userId = persona();
      const fila = Object.freeze({ ...aportacio, id: String(nouId()).toLowerCase(), userId, estatModeracio: 'pendent', creatA: instant() });
      aportacions.push(fila);
      return Object.freeze({ id: fila.id, estatModeracio: 'pendent', creatA: fila.creatA });
    }
  };
  return Object.freeze({
    metodes: Object.freeze(metodes),
    /* Només per a l'adaptador i les proves: les aportacions pendents no es lligen per cap
       mètode del contracte (com a l'SQL, la moderació és d'un altre circuit). */
    aportacionsPendents: () => aportacions.map((a) => ({ ...a })),
    reinicia: () => { vots.clear(); aportacions.length = 0; }
  });
}
