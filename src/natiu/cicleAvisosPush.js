/* R54 · Una recuperació només registra l'opt-in explícit del mateix compte.
   Adreces només en memòria; cada baixa invalida callbacks pendents. */
const propietari = value => typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : null;
const forma = (d, gest) => {
  if (!['android', 'ios'].includes(d?.plataforma) || typeof d?.testimoni !== 'string' || !d.testimoni) throw Object.assign(new TypeError('Testimoni de push invàlid'), { code: 'AVISOS_INVALID', codi: 'AVISOS_INVALID' });
  return { plataforma: d.plataforma, adreca: d.testimoni, caducaMs: null, gest };
};
const retirada = d => ({ plataforma: d.plataforma, adreca: d.adreca });
export function cicleAvisosPush({ avisos, motiu, memoria, visible = () => globalThis.document?.visibilityState === 'visible' }) {
  let generacio = 0;
  let ambitActual = null;
  let adrecaActual = null;
  let estatActual = 'inactiu';
  let tallaRegistre = () => {};
  let tallaPendent = () => {};
  let wake = 0;
  let rotacions = Promise.resolve();
  let baixes = Promise.resolve();
  let enCurs = null;
  /* Sanejament R15 (B3 · P1-03, R15A-NAT-01) · Amb un motiu ('sense-config' sense la bandera
     de build VITE_SDP_PUSH_NATIU, 'sense-connector' sense el connector al binari), cap mètode
     del cicle toca l'adaptador natiu: ni estat, ni activa, ni la baixa (unregister). */
  const motiuActual = () => { try { return motiu() || null; } catch { return 'sense-connector'; } };
  const llegeixOptIn = () => { try { return memoria.llegeix() !== null; } catch { return false; } };
  const estat = async () => {
    const m = motiuActual();
    if (m) return { estat: m };
    const raw = await avisos.estat();
    if (['sense-connector', 'denegat', 'error'].includes(raw?.estat)) return raw;
    if (ambitActual && memoria.llegeix() === ambitActual && estatActual === 'error') return { estat: 'error' };
    if (raw?.estat !== 'actiu') return { estat: 'inactiu' };
    return { estat: ambitActual && memoria.llegeix() === ambitActual ? estatActual : 'inactiu' };
  };
  const baixa = async ({ retira } = {}) => {
    if (enCurs) enCurs.cancellat = true;
    generacio++;
    ambitActual = null;
    estatActual = 'inactiu';
    tallaRegistre();
    tallaPendent();
    wake++;
    tallaRegistre = () => {};
    const anterior = adrecaActual;
    adrecaActual = null;
    /* L'opt-in desat abans d'oblidar-lo: si n'hi havia, la baixa ha de desfer un testimoni
       d'una obertura anterior. Sense opt-in ni registre en esta obertura, l'adaptador no
       crida unregister() (avisosPushNatius.js). */
    const ambOptIn = llegeixOptIn();
    let oblidat = true;
    try { memoria.oblida(); } catch { oblidat = false; }
    const m = motiuActual();
    if (m) return oblidat ? { estat: m } : { estat: 'error' };
    const retirades = new Set();
    const resultat = await avisos.desactiva?.({ ambOptIn, retira: typeof retira === 'function' ? d => {
      const data = retirada(forma(d, false));
      retirades.add(`${data.plataforma}:${data.adreca}`);
      return retira(data);
    } : null }) || { estat: 'inactiu' };
    if (anterior && typeof retira === 'function' && !retirades.has(`${anterior.plataforma}:${anterior.adreca}`)) {
      try { await retira(retirada(anterior)); } catch { /* La baixa del proveïdor ja s'ha fet. */ }
    }
    return oblidat ? resultat : { estat: 'error' };
  };
  const desactiva = (opcions) => {
    const feina = baixa(opcions);
    baixes = Promise.all([baixes, feina]).then(() => undefined, () => undefined);
    return feina;
  };
  const activa = async (crida = {}, gest = true) => {
    const m = motiuActual();
    if (m) return { estat: m };
    const ambit = propietari(crida.ambit);
    if (!ambit || typeof crida.desa !== 'function') return { estat: 'sense-servidor' };
    if (!gest && memoria.llegeix() !== ambit) return desactiva({ retira: crida.retira });
    const gen = ++generacio;
    ambitActual = null;
    tallaRegistre();
    tallaRegistre = () => {};
    const desa = async d => {
      if (gen !== generacio) throw new Error('Registre obsolet');
      const data = forma(d, gest);
      await crida.desa(data);
      if (gen !== generacio) {
        if (typeof crida.retira === 'function') await Promise.resolve(crida.retira(retirada(data))).catch(() => {});
        throw new Error('Registre obsolet');
      }
      adrecaActual = data;
    };
    try {
      await baixes;
      await rotacions;
      if (gen !== generacio) return { estat: 'inactiu' };
      await avisos.preparaCanal?.();
      if (gen !== generacio) return { estat: 'inactiu' };
      const resultat = await avisos.activa({ desa, gest });
      if (gen !== generacio) {
        await avisos.desactiva();
        return { estat: 'inactiu' };
      }
      if (resultat?.estat !== 'actiu') {
        if (!gest && resultat?.estat === 'error') {
          ambitActual = ambit;
          estatActual = 'error';
          return resultat;
        }
        await desactiva({ retira: crida.retira });
        estatActual = resultat?.estat || 'error';
        return resultat;
      }
      memoria.desa(ambit);
      ambitActual = ambit;
      estatActual = 'actiu';
      tallaPendent();
      wake++;
      tallaPendent = avisos.escoltaPendent?.(() => { wake++; }) || (() => {});
      const renova = typeof crida.renova === 'function' ? crida.renova : !gest ? crida.desa : null;
      tallaRegistre = avisos.escoltaRegistre?.(d => {
        const feina = rotacions.then(async () => {
        if (gen !== generacio || ambitActual !== ambit || !renova) return;
        const data = forma(d, false);
        const anterior = adrecaActual;
        if (anterior?.adreca === data.adreca && anterior?.plataforma === data.plataforma) return;
        try {
          await renova(data);
          if (gen !== generacio) {
            if (typeof crida.retira === 'function') await crida.retira(retirada(data));
            return;
          }
          adrecaActual = data;
          if (anterior && typeof crida.retira === 'function') await crida.retira(retirada(anterior));
        } catch { if (gen === generacio) estatActual = 'error'; }
        });
        rotacions = feina.catch(() => {});
        return feina;
      }) || (() => {});
      return resultat;
    } catch {
      if (gen === generacio && !gest && memoria.llegeix() === ambit) {
        ambitActual = ambit;
        estatActual = 'error';
      } else if (gen === generacio) await desactiva({ retira: crida.retira });
      return { estat: 'error' };
    }
  };
  const arrenca = (crida, gest) => {
    if (enCurs && enCurs.ambit === crida?.ambit && !enCurs.cancellat) return enCurs.promesa;
    const anterior = enCurs;
    if (anterior) { anterior.cancellat = true; generacio++; }
    const operacio = { ambit: crida?.ambit, promesa: null, cancellat: false };
    enCurs = operacio;
    const inicia = () => operacio.cancellat ? { estat: 'inactiu' } : activa(crida, gest);
    const feina = anterior ? anterior.promesa.catch(() => {}).then(inicia) : inicia();
    const promesa = feina.finally(() => { if (enCurs?.promesa === promesa) enCurs = null; });
    operacio.promesa = promesa;
    return promesa;
  };
  return Object.freeze({
    tipus: 'natiu', motiu, estat,
    activa: crida => arrenca(crida, true), desactiva,
    async sincronitza(crida = {}) {
      const m = motiuActual();
      if (m) return { estat: m };
      if (crida.actiu !== true || memoria.llegeix() !== propietari(crida.ambit)) return desactiva({ retira: crida.retira });
      return arrenca(crida, false);
    },
    async neteja() { /* Sense CAS natiu, la neteja global només es fa en desactiva. */ },
    capturaLectura() { return ambitActual && visible() ? { generacio, wake } : null; },
    async confirmaLectura(marca) {
      if (!marca || !visible() || !ambitActual || marca.generacio !== generacio || marca.wake !== wake) return null;
      /* L'SDK8.1.3 fa badge0 en una cua nativa sense token de wake. Encara
         que esta lectura siga posterior, un wake entre el pont i eixa cua
         podria perdre el pendent nou. Conservem el genèric: la neteja global
         queda reservada a la baixa explícita, fins disposar de CAS natiu. */
      return { estat: 'pendent', motiu: 'sense-cas-natiu' };
    },
    oblida() {
      if (enCurs) enCurs.cancellat = true;
      generacio++;
      ambitActual = null;
      estatActual = 'inactiu';
      tallaRegistre();
      tallaPendent();
      wake++;
      tallaRegistre = () => {};
      try { memoria.oblida(); } catch { /* La baixa del pont es fa en eixir igualment. */ }
    },
    escoltaToc: fn => (motiuActual() ? () => {} : avisos.escoltaToc(fn))
  });
}
