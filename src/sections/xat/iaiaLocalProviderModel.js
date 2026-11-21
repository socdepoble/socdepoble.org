/**
 * Model pur de constants, contacte local i helpers purs per a IAIALocalProvider (R32.24).
 */
import { AJUDA_PER_CLAU } from '../../data/xatsPerDefecte.js';
import { IAIA_ID, BENVINGUDA_IAIA, RESPOSTA_IAIA } from '../../data/identitatsSeed.js';
import { ID_FIL_LOCAL_IAIA } from './useObriXatPerDefecte.js';

export const MAXIM_MISSATGES_IAIA_LOCAL = 100;

export const MAXIM_SESSIONS_NOVES_IAIA = 50;

export const PREFIX_SESSIO_IAIA_LOCAL = `${ID_FIL_LOCAL_IAIA}-`;

export const esFilLocalIAIA = (id) => (
  id === ID_FIL_LOCAL_IAIA || (typeof id === 'string' && id.startsWith(PREFIX_SESSIO_IAIA_LOCAL))
);

export const CAP_ELEMENT = Object.freeze([]);

export const noFaRes = () => {};

export const CONTACTE_IAIA_LOCAL = Object.freeze({
  usuari_id: IAIA_ID,
  nom: AJUDA_PER_CLAU.iaia.nom,
  tipus: 'ia',
  avatar_url: AJUDA_PER_CLAU.iaia.avatar,
  fil_id: ID_FIL_LOCAL_IAIA,
});

export const creaMissatgeBenvingudaIAIA = (araIso = new Date().toISOString()) => [{
  id: 'iaia-local:benvinguda',
  sender: 'other',
  author: AJUDA_PER_CLAU.iaia.nom,
  usuariId: IAIA_ID,
  is_ai: true,
  text: BENVINGUDA_IAIA,
  creatAl: araIso,
}];

export const textRespostaIAIALocal = (trobada) => (
  typeof trobada === 'string' && trobada.trim() ? trobada : RESPOSTA_IAIA
);
