/** Adaptador de confirmació G1: resultats preparats en esta instància, sense persistir contrasenyes. */
import { exportaConversesCompletes, comprovaAmbitRestauracio } from './restauraCopiaSeguretat.js';
import { importaCopiaSeguretatXat } from './copiaSeguretatPortatil.js';

const falla = motiu => Object.assign(new Error(motiu), { codi: 'SDP_BACKUP_RESTAURACIO_AVORTADA', code: 'SDP_BACKUP_RESTAURACIO_AVORTADA' });
export function creaMotorCopiaSeguretatXatV1225({ magatzem, comprovaAmbit, carregaPagina, carregaAdjunt, cripto = globalThis.crypto, senyal } = {}) {
  if (!magatzem?.llegix || !magatzem?.aplica || typeof comprovaAmbit !== 'function') throw falla('Costura incompleta.');
  const preparades = new WeakMap();
  const guarda = () => comprovaAmbitRestauracio({ senyal, comprovaAmbit });
  const mateixAmbit = a => a?.usuariId === magatzem.usuariId && a?.tenantId === magatzem.tenantId;
  return Object.freeze({
    async importa(text, entrada = {}) {
      guarda();
      if (entrada.usuariIdEsperat !== magatzem.usuariId || entrada.tenantIdEsperat !== magatzem.tenantId || entrada.permetSenseXifrar || entrada.magatzem || entrada.aplicaImportacio) throw falla('Àmbit o mode de comprovació invàlid.');
      const snapshot = await magatzem.llegix(); guarda();
      const resultat = await importaCopiaSeguretatXat(text, { ...entrada, cripto, senyal, estatLocal: { copies: snapshot.copies }, magatzem: null, aplicaImportacio: null });
      guarda();
      if (!resultat.autenticada) throw falla('Còpia sense autenticar.');
      preparades.set(resultat, { resultat: JSON.parse(JSON.stringify(resultat)), snapshot });
      return resultat;
    },
    async restaura(resultat, { abast } = {}) {
      guarda();
      if (!mateixAmbit(abast) || !resultat || typeof resultat !== 'object' || !preparades.has(resultat)) throw falla('Còpia no preparada en esta sessió i àmbit.');
      const preparada = preparades.get(resultat), { snapshot, resultat: privat } = preparada;
      const rebut = await magatzem.aplica(privat, snapshot.copies, { comprovaAmbit, senyal });
      preparades.delete(resultat);
      try { guarda(); }
      catch (error) { throw Object.assign(error, { commitConfirmat: true, rebut }); }
      const filsNous = privat.fils.filter(f => !snapshot.fils[f.id]).length;
      const missatgesNous = privat.missatges.filter(m => !snapshot.missatges[m.id]).length;
      return { ...rebut, backupId: privat.rebut.backupId, filsNous, missatgesNous, duplicatsOmesos: privat.fils.length + privat.missatges.length - filsNous - missatgesNous };
    },
    async exporta(entrada) {
      guarda();
      if (!mateixAmbit(entrada) || typeof carregaPagina !== 'function') throw falla('Falta l’hidratador complet de la sessió.');
      return exportaConversesCompletes({ ...entrada, usuariId: magatzem.usuariId, tenantId: magatzem.tenantId, carregaPagina, carregaAdjunt, cripto, senyal, comprovaAmbit });
    },
  });
}
