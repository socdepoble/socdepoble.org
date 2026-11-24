/**
 * eliminaPerATothomPrevia.js — Projecció lleugera d'esborrats per a tothom i
 * càlcul de vistes prèvies sense missatges esborrats ni amagats (Onada v1.2.23 ·
 * R32.65_gemini · IDEA-342).
 *
 * Viu separat del model complet perquè XatContext el llig a l'arrencada sense
 * arrossegar lògica extra al pressupost estàtic del connector de WordPress.
 */

const esborratsSessioPerPersona = new Map();

export function registraEsborratSessioLocal(clauPersona, missatgeId, araIso) {
  if (!clauPersona || missatgeId == null) return;
  let mapa = esborratsSessioPerPersona.get(clauPersona);
  if (!mapa) {
    mapa = new Map();
    esborratsSessioPerPersona.set(clauPersona, mapa);
  }
  mapa.set(String(missatgeId), araIso || new Date().toISOString());
}

export function desfaEsborratSessioLocal(clauPersona, missatgeId, valorPrevi = null) {
  const mapa = clauPersona ? esborratsSessioPerPersona.get(clauPersona) : null;
  if (!mapa || missatgeId == null) return;
  const id = String(missatgeId);
  if (valorPrevi != null) mapa.set(id, valorPrevi);
  else mapa.delete(id);
  if (!mapa.size) esborratsSessioPerPersona.delete(clauPersona);
}

export function llegixEsborratsSessioLocal(clauPersona) {
  const mapa = clauPersona ? esborratsSessioPerPersona.get(clauPersona) : null;
  return mapa && mapa.size > 0 ? Object.fromEntries(mapa.entries()) : {};
}

export function netejaEsborratsSessioLocalExcepte(clauPersonaActiva) {
  for (const clau of [...esborratsSessioPerPersona.keys()]) {
    if (clau !== clauPersonaActiva) esborratsSessioPerPersona.delete(clau);
  }
}

export function _reiniciaEsborratsSessioLocalPerATests() {
  esborratsSessioPerPersona.clear();
}

const seqDe = (m) => {
  if (!m || m.seq == null) return null;
  const n = Number(m.seq);
  return Number.isFinite(n) ? n : null;
};

const esOcultEnPrevia = (perMissatge, m) => (
  Boolean(m?.esborrat) || m?.esborratAl != null || perMissatge?.[m?.id]?.amagat === true
);

export function aplicaEsborratsLocals(missatges, esborrats = null) {
  if (!esborrats || !Array.isArray(missatges) || !missatges.length) return missatges;
  let canviat = false;
  const eixida = missatges.map((m) => {
    const id = m?.id != null ? String(m.id) : '';
    if (!id || !Object.hasOwn(esborrats, id)) return m;
    const araIso = esborrats[id] || m.esborratAl || null;
    if (m.esborrat === true && m.text === '' && m.esborratAl === araIso) return m;
    canviat = true;
    return {
      ...m,
      text: '',
      metadades: {},
      reaccions: [],
      destacat: false,
      fixat: false,
      esborrat: true,
      esborratAl: araIso
    };
  });
  return canviat ? eixida : missatges;
}

function posicioDeLaPrevia(fil, missatges) {
  const ultimSeq = Number(fil?.ultimSeq);
  if (Number.isFinite(ultimSeq) && ultimSeq > 0) {
    for (let i = missatges.length - 1; i >= 0; i--) {
      if (seqDe(missatges[i]) === ultimSeq) return i;
    }
    let maxim = null;
    for (const m of missatges) {
      const s = seqDe(m);
      if (s != null && (maxim == null || s > maxim)) maxim = s;
    }
    if (maxim != null && maxim < ultimSeq) return -1;
  }
  return missatges.length - 1;
}

export function previaSenseEsborratsNiAmagats(fil, missatges, perMissatge = {}, joId = null) {
  if (!fil || !Array.isArray(missatges) || !missatges.length || !missatges.some((m) => esOcultEnPrevia(perMissatge, m))) {
    return fil;
  }
  const i = posicioDeLaPrevia(fil, missatges);
  if (i < 0 || !esOcultEnPrevia(perMissatge, missatges[i])) return fil;
  let visible = null;
  for (let k = i - 1; k >= 0 && !visible; k--) {
    if (!esOcultEnPrevia(perMissatge, missatges[k])) visible = missatges[k];
  }
  const text = visible ? String(visible.text ?? '') : '';
  const autor = visible ? (visible.usuariId ?? (visible.sender === 'me' ? joId : null)) : null;
  const corregit = {
    ...fil,
    ultimText: text,
    ultimTipus: visible?.tipus || null,
    ultimAutorId: autor ?? null,
    seqPrevia: seqDe(visible)
  };
  if (typeof fil.searchText === 'string') {
    corregit.searchText = `${fil.name || fil.title || ''} ${text}`.toLowerCase();
  }
  return corregit;
}

export function previesSenseEsborratsNiAmagats(fils, missatgesPerFil = {}, perMissatge = {}, joId = null) {
  if (!Array.isArray(fils) || !fils.length) return fils;
  const teAmagat = Boolean(perMissatge) && Object.values(perMissatge).some((a) => a?.amagat === true);
  const teEsborrat = !teAmagat && missatgesPerFil != null && Object.values(missatgesPerFil).some(
    (llista) => Array.isArray(llista) && llista.some((m) => Boolean(m?.esborrat) || m?.esborratAl != null)
  );
  if (!teAmagat && !teEsborrat) return fils;
  let canvia = false;
  const eixida = fils.map((fil) => {
    const llista = fil?.id != null ? missatgesPerFil?.[fil.id] : null;
    const nou = llista ? previaSenseEsborratsNiAmagats(fil, llista, perMissatge, joId) : fil;
    if (nou !== fil) canvia = true;
    return nou;
  });
  return canvia ? eixida : fils;
}
