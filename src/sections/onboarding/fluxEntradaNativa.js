/* Fase D (261020, tasca 1; ordre del Mestre) · Les dues fases de l'entrada amb
   Apple o Google a l'app nativa, fora de la vista i sense React:
     fase 1 · el full natiu (config/entradaNativa.js · demanaCredencialNativa);
     fase 2 · el port (capacitat 'entradaAmbToken', entraAmbTokenDeProveidor).
   Si la vista ja ha deixat l'intent entre les dues (viu() fals: «Cancel·la
   l'entrada», una altra entrada, la vista desmuntada), la credencial tardana es
   descarta i no hi ha fase 2. Sempre que hi ha credencial, s'oblida després
   (oblida): la propera entrada torna a obrir el full, mai una sessió restaurada. */
import { CODI_ENTRADA_NATIVA, demanaCredencialNativa, oblidaCredencialNativa } from '../../config/entradaNativa.js';

export async function entraAmbProveidorNatiu(proveidor, entra, config,
  { demana = demanaCredencialNativa, oblida = oblidaCredencialNativa, viu = () => true } = {}) {
  /* Fase D (261020, revisió) · viu també baixa a la fase 1: un full que encara no
     s'ha obert ja no s'obri si la vista ha deixat l'intent. */
  /* T1 (261024; P0-04) · El codi d'autorització d'Apple també baixa al port: la baixa el necessita per a revocar. */
  const { testimoni, nonce, testimoniAcces, nom, codiAutoritzacio } = await demana(proveidor, { viu });
  try {
    if (!viu()) throw Object.assign(new Error('Entrada cancel·lada.'), { code: CODI_ENTRADA_NATIVA.CANCELADA });
    return await entra(proveidor, { testimoni, nonce, testimoniAcces, nom, codiAutoritzacio }, config);
  } finally { oblida(proveidor); }
}
