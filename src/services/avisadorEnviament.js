import { MISSATGE_AVISADOR, ambBatec, estatAvisador, iniciDeLaNitSeguent, tocaAvisar } from './avisador.js';

export function creaEnviamentAvisador({ llegix, desa, potEnviar, envia, ara = Date.now, transaccio = (fn) => fn() }) {
  let operacio = null;
  let activitatSenseDesar = false;
  let batec = 0;
  const llig = () => estatAvisador(llegix());
  const encara = (estat, contacte) => {
    const actual = llig();
    if (actual?.ultimBatec !== estat.ultimBatec) return null;
    const pendent = actual.personesConfiansa.find(({ idMissatge }) => idMissatge === contacte.idMissatge);
    return pendent && pendent.estat !== 'enviat' ? actual : null;
  };
  function escriu(estat, contacte, resultat) {
    const actual = encara(estat, contacte);
    if (!actual) return false;
    return desa({
      ...actual,
      personesConfiansa: actual.personesConfiansa.map((persona) => persona.idMissatge === contacte.idMissatge
        ? { ...persona, estat: resultat }
        : persona)
    });
  }

  function cancella() {
    operacio?.controller.abort();
  }

  return {
    cancella,
    comprova() {
      const actual = llig();
      if (operacio && (actual?.ultimBatec !== operacio.ultimBatec
        || !actual.personesConfiansa.some(({ idMissatge }) => idMissatge === operacio.idPrimerMissatge))) cancella();
    },
    activitat() {
      const estat = llig();
      if (!estat) return;
      // La precisió és d'un minut, la mateixa que l'interval: dins del mateix
      // minut, un batec nou no canvia res i només despertaria les altres pestanyes.
      if (!activitatSenseDesar && estat.personesConfiansa.every((c) => c.estat === 'pendent')
        && ara() - estat.ultimBatec < 60_000) return;
      cancella();
      // Torna a llegir dins del bloqueig: una desactivació anterior no
      // pot revifar per un batec d'una altra pestanya que anava tard.
      const aquestBatec = ++batec;
      activitatSenseDesar = true;
      const instant = ara();
      const desaActivitat = () => {
        const vigent = llig();
        return !vigent || vigent.ultimBatec > instant || desa(ambBatec(vigent, instant));
      };
      const acaba = (fet) => { if (batec === aquestBatec) activitatSenseDesar = !fet; };
      try {
        const resultat = transaccio(desaActivitat);
        if (typeof resultat?.then === 'function') resultat.then(acaba, () => acaba(false));
        else acaba(resultat);
      } catch {
        acaba(false);
      }
    },
    async avalua() {
      const estat = llig();
      const instant = ara();
      if (operacio || activitatSenseDesar || !tocaAvisar(estat, instant)) return;
      const controller = new AbortController();
      const nit = setTimeout(cancella, iniciDeLaNitSeguent(estat.horaIniciNit, instant) - instant);
      operacio = { controller, ultimBatec: estat.ultimBatec, idPrimerMissatge: estat.personesConfiansa[0].idMissatge };
      try {
        for (const contacte of estat.personesConfiansa) {
          if (controller.signal.aborted || !tocaAvisar(estat, ara())) break;
          if (!potEnviar(contacte) || !encara(estat, contacte)) continue;
          // Marca l'intent abans de la xarxa. Si la resposta es perd, el
          // reintent d'este cicle conserva l'UUID, i un batec nou el canvia.
          const intent = transaccio(() => !controller.signal.aborted && !activitatSenseDesar
            && potEnviar(contacte) && escriu(estat, contacte, 'fallit'));
          const marcat = typeof intent?.then === 'function' ? await intent : intent;
          if (!marcat || controller.signal.aborted || !encara(estat, contacte)) continue;
          try {
            const desat = await envia(contacte, MISSATGE_AVISADOR, controller.signal);
            if (!controller.signal.aborted && desat?.id === contacte.idMissatge
              && Number.isSafeInteger(desat.seq) && desat.seq > 0) {
              await transaccio(() => !controller.signal.aborted && escriu(estat, contacte, 'enviat'));
            }
          } catch {
            // El següent tic pot reintentar amb el mateix id. El formulari
            // mostra la falta de confirmació del Xat.
          }
        }
      } finally {
        clearTimeout(nit);
        operacio = null;
      }
    }
  };
}
