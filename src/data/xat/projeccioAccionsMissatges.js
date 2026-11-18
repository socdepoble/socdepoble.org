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
