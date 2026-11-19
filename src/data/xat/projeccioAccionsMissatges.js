/** R32.7 · Projecció pura dels flags d'accions (reaccions, destacat, fixat, amagat) sobre els missatges.
 * v1.2.8 · Separada d'accionsMissatge.js perquè XatContext la pot cridar a l'arrencada sense carregar-hi
 * el motor d'accions ni xatMultimedia.js (pes de l'arrencada estàtica del connector). */
const cacheProjeccio = new WeakMap();

export function projectaAccionsMissatges(missatges, perMissatge = {}) {
  let canviat = false;
  const resultat = [];
  for (const m of missatges) {
    const a = perMissatge[m.id];
    if (!a) { resultat.push(m); continue; }
    canviat = true;
    if (a.amagat) continue;
    const desat = cacheProjeccio.get(m);
    if (desat?.estat === a) resultat.push(desat.fila);
    else {
      const fila = { ...m, reaccions: a.reaccions, destacat: a.destacat, fixat: a.fixat, estatAccions: a.estat ?? 'confirmat' };
      cacheProjeccio.set(m, { estat: a, fila }); resultat.push(fila);
    }
  }
  return canviat ? resultat : missatges;
}

/* D-v128-2-PREVIA · La vista prèvia d'un fil no torna a ensenyar el que has amagat amb «Elimina per a mi».
 * Les files de la llista i de les comunitats (FitxaComunitat, VistaComunitats), el diàleg «Reenvia a…», la
 * cerca del Xat i /cerca lligen `ultimText` de chatThreads o de comunitats, i XatContext fa les dos llistes
 * amb el resultat d'ací: es corregix al costat de la projecció dels missatges, i no en cada consumidor.
 * Límit honest: només coneix els missatges carregats en esta sessió. Si l'últim del fil no s'ha carregat,
 * la vista prèvia és la del servidor tal qual (la correcció d'eixe cas és a xat_fils_meus, SQL). */
const seqDe = (m) => {
  if (!m || m.seq == null) return null;
  const n = Number(m.seq);
  return Number.isFinite(n) ? n : null;
};
const esAmagat = (perMissatge, m) => perMissatge?.[m?.id]?.amagat === true;

/** La posició del missatge que ensenya la vista prèvia del fil, o -1 si no és cap dels carregats. */
function posicioDeLaPrevia(fil, missatges) {
  const ultimSeq = Number(fil?.ultimSeq);
  if (Number.isFinite(ultimSeq) && ultimSeq > 0) {
    for (let i = missatges.length - 1; i >= 0; i--) if (seqDe(missatges[i]) === ultimSeq) return i;
    let maxim = null;
    for (const m of missatges) { const s = seqDe(m); if (s != null && (maxim == null || s > maxim)) maxim = s; }
    // L'últim del servidor és més nou que tot el que s'ha carregat: no és cap missatge amagat ací.
    if (maxim != null && maxim < ultimSeq) return -1;
  }
  return missatges.length - 1;
}

/**
 * El fil amb la vista prèvia de l'últim missatge que encara veus. Si el que ensenya és un missatge amagat,
 * pren el visible anterior (text, tipus i autor); si no en queda cap, la vista prèvia buida d'un fil sense
 * missatges. `ultimAl` i `ultimSeq` no es toquen: l'ordre de la llista i els no llegits continuen sent els
 * del servidor. `seqPrevia` és el seq del missatge que ara ensenya la vista prèvia (null si no en té cap):
 * estatDeLUltim hi calcula les marques d'enviat i llegit, i no amb el seq de l'amagat.
 * El MATEIX objecte si no hi ha res a corregir. Pura.
 */
export function previaSenseAmagats(fil, missatges, perMissatge = {}, joId = null) {
  if (!fil || !Array.isArray(missatges) || !missatges.length || !missatges.some((m) => esAmagat(perMissatge, m))) return fil;
  const i = posicioDeLaPrevia(fil, missatges);
  if (i < 0 || !esAmagat(perMissatge, missatges[i])) return fil;
  let visible = null;
  for (let k = i - 1; k >= 0 && !visible; k--) if (!esAmagat(perMissatge, missatges[k])) visible = missatges[k];
  const text = visible ? String(visible.text ?? '') : '';
  const autor = visible ? (visible.usuariId ?? (visible.sender === 'me' ? joId : null)) : null;
  const corregit = { ...fil, ultimText: text, ultimTipus: visible?.tipus || null, ultimAutorId: autor ?? null, seqPrevia: seqDe(visible) };
  if (typeof fil.searchText === 'string') corregit.searchText = `${fil.name || fil.title || ''} ${text}`.toLowerCase();
  return corregit;
}

/** Tots els fils amb previaSenseAmagats. `missatgesPerFil`: id → missatges ABANS de la projecció
 *  (encara amb els amagats). La MATEIXA llista si no n'hi ha cap d'amagat o no en canvia cap. Pura. */
export function previesSenseAmagats(fils, missatgesPerFil = {}, perMissatge = {}, joId = null) {
  if (!Array.isArray(fils) || !perMissatge || !Object.values(perMissatge).some((a) => a?.amagat === true)) return fils;
  let canvia = false;
  const eixida = fils.map((fil) => {
    const llista = fil?.id != null ? missatgesPerFil?.[fil.id] : null;
    const nou = llista ? previaSenseAmagats(fil, llista, perMissatge, joId) : fil;
    if (nou !== fil) canvia = true;
    return nou;
  });
  return canvia ? eixida : fils;
}
