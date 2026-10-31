/** XC-05: confirmació d’entrega independent de la lectura, agrupada per fil i sessió. */
export function creaEmissorRebutsEntrega(envia) {
  const sessions = new WeakMap();
  return {
    rebut(filId, seq, { config, signal, vigent = () => true } = {}) {
      if (!filId || !Number.isSafeInteger(seq) || seq <= 0 || !signal || signal.aborted || !vigent()) return Promise.resolve(false);
      let fils = sessions.get(signal);
      if (!fils) { fils = new Map(); sessions.set(signal, fils); }
      let estat = fils.get(filId);
      if (!estat) { estat = { confirmat:0, pendent:0, promesa:null, absent:false }; fils.set(filId,estat); }
      if (estat.absent) return Promise.resolve(false);
      estat.pendent = Math.max(estat.pendent,seq);
      if (estat.promesa) return estat.promesa;
      if (estat.confirmat >= estat.pendent) return Promise.resolve(true);
      estat.promesa = (async () => {
        while (!signal.aborted && vigent() && estat.pendent > estat.confirmat) {
          const fins=estat.pendent;
          let res;
          try { res=await envia(filId,{...config,signal,rebutFinsSeq:fins,llegitFinsSeq:0}); }
          catch (error) { if (error?.code === 'SENSE_CAPACITAT_REBUTS') estat.absent=true; return false; }
          if (signal.aborted || !vigent()) return false;
          const rebut=res?.rebutFinsSeq;
          if (!Number.isSafeInteger(rebut) || rebut < fins) return false;
          estat.confirmat=Math.max(estat.confirmat,rebut);
        }
        return !signal.aborted && vigent();
      })().finally(()=>{estat.promesa=null;});
      return estat.promesa;
    }
  };
}
