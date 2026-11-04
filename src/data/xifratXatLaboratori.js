/** FEDI-07 · Prova efímera del protocol viu sdp-xat-v1. Només memòria:
 * cap sessió, servidor, magatzem de claus o conversa real. Les privades són
 * CryptoKey no extraïbles i mai ixen de la clausura. No activa E2EE. */
import { aBase64url } from './xifratXatCripto.js';
import {
  CODI, MOTIU_EPOCA, ROL_EPOCA, ROL_SAS, TIPUS_FIL, aplicaEpoca, creaDirectori, creaEpoca, creaIdentitat,
  creaVerificacioSas, estatFilNou, obriMissatge, publiquesDe, verificaDeclaracioClau, xifraMissatge
} from './xifratXatProtocol.js';
import { directoriAmbHistoria } from './xifratXatHistoria.js';

const errorLocal = (codi) => Object.assign(new Error(codi), { codi });
const rebutjaAmb = async (operacio, codi) => {
  try { await operacio(); } catch (error) { if (error?.codi === codi) return true; throw error; }
  throw errorLocal('prova-no-rebutjada');
};

async function sasDe(cripto, a, b) {
  const esquerra = creaVerificacioSas(cripto, { jo: publiquesDe(a), altre: publiquesDe(b), rol: ROL_SAS.compromet });
  const dreta = creaVerificacioSas(cripto, { jo: publiquesDe(b), altre: publiquesDe(a), rol: ROL_SAS.respon });
  await dreta.comprova(await esquerra.revela(await dreta.respon(await esquerra.compromet())));
  return { propi: esquerra.codi.text, contacte: dreta.codi.text };
}

export async function creaProvaXifratXat({ cripto = globalThis.crypto, ara = () => Date.now() } = {}) {
  if (typeof cripto?.randomUUID !== 'function') throw errorLocal('sense-cripto');
  let persones = await Promise.all(Array.from({ length: 4 }, () => creaIdentitat(cripto, { usuari: cripto.randomUUID(), creatMs: ara() })));
  let codis = await Promise.all(persones.slice(1).map((p) => sasDe(cripto, persones[0], p)));
  let verificats = [false, false, false];
  let disputa = false;
  let tancada = false;
  const vigent = () => { if (tancada) throw errorLocal('prova-tancada'); if (disputa) throw errorLocal('prova-en-disputa'); };
  const fotografia = () => {
    vigent();
    return { verificats: verificats.filter(Boolean).length, ranures: codis.map((codi, i) => ({
      id: persones[i + 1].usuari, numero: i + 1, propi: codi.propi, contacte: codi.contacte,
      estat: verificats[i] ? 'verificat_sas' : 'pendent'
    })) };
  };
  return Object.freeze({
    fotografia,
    confirmaSas(index, llegit) {
      vigent();
      const codi = codis[index];
      if (!Number.isInteger(index) || !codi || typeof llegit !== 'string'
        || codi.propi !== codi.contacte || llegit.replaceAll(' ', '') !== codi.propi.replaceAll(' ', '')) throw errorLocal('sas-no-coincidix');
      verificats[index] = true;
      return fotografia();
    },
    declaraDisputa() { vigent(); disputa = true; verificats = [false, false, false]; },
    async provaMissatge(text) {
      vigent();
      if (!verificats.every(Boolean)) throw errorLocal('sas-pendent');
      const [a, b] = persones;
      const directori = creaDirectori(cripto);
      for (const p of [a, b]) await directori.fixa(publiquesDe(p));
      const fil = cripto.randomUUID();
      const emissor = estatFilNou({ fil, tipusFil: TIPUS_FIL.directe });
      const receptor = estatFilNou({ fil, tipusFil: TIPUS_FIL.directe });
      const epoca = await creaEpoca(cripto, { estat: emissor, jo: a, membres: [a, b].map((p) => ({ usuari: p.usuari, rol: ROL_EPOCA.membre })), creatMs: ara(), directori, vigent });
      for (const [estat, jo] of [[emissor, a], [receptor, b]]) await aplicaEpoca(cripto, { estat, jo, ...epoca, directori, vigent });
      const fila = await xifraMissatge(cripto, { estat: emissor, jo: a, id: cripto.randomUUID(), contingut: { t: text }, vigent });
      const ct = Uint8Array.from(fila.ct); ct[0] ^= 1;
      const manipulacioRebutjada = await rebutjaAmb(() => obriMissatge(cripto, { estat: receptor, fila: { ...fila, ct }, directori, vigent }), CODI.xifratManipulat);
      const oberta = await obriMissatge(cripto, { estat: receptor, fila, directori, vigent });
      const repeticioRebutjada = await rebutjaAmb(() => obriMissatge(cripto, { estat: receptor, fila, directori, vigent }), CODI.repeticio);
      vigent();
      return Object.freeze({ xifrat: aBase64url(fila.ct), obert: oberta.contingut.t, manipulacioRebutjada, repeticioRebutjada });
    },
    async provaRotacio() {
      vigent();
      const [a, anterior] = persones;
      const nova = await creaIdentitat(cripto, { usuari: anterior.usuari, creatMs: ara() + 1, anterior });
      const declarada = await verificaDeclaracioClau(cripto, { ...nova, kidServit: nova.kid, fixada: { ...publiquesDe(anterior), verificat: false } });
      const filaDe = (p, retiradaAl = null) => ({ usuariId: p.usuari, kid: aBase64url(p.kid), sigPub: aBase64url(p.sigPub), dhPub: aBase64url(p.dhPub), declaracio: aBase64url(p.declaracio), autofirma: aBase64url(p.autofirma), firmaContinuitat: p.firmaContinuitat ? aBase64url(p.firmaContinuitat) : null, retiradaAl });
      const directori = await directoriAmbHistoria({ cripto, jo: a, registres: [filaDe(a), filaDe(anterior, new Date(ara()).toISOString()), filaDe(nova)],
        usuaris: [a.usuari, anterior.usuari], magatzem: { fixacio: async () => null }, ara, exigix: vigent });
      const antic = creaDirectori(cripto);
      for (const p of [a, anterior]) await antic.fixa(publiquesDe(p));
      const estat = estatFilNou({ fil: cripto.randomUUID(), tipusFil: TIPUS_FIL.directe });
      const membres = [a, anterior].map((p) => ({ usuari: p.usuari, rol: ROL_EPOCA.membre }));
      const inicial = await creaEpoca(cripto, { estat, jo: a, membres, directori: antic, creatMs: ara(), vigent });
      await aplicaEpoca(cripto, { estat, jo: a, ...inicial, directori, vigent });
      const canvi = await creaEpoca(cripto, { estat, jo: a, membres, motiu: MOTIU_EPOCA.rotacio, directori, creatMs: ara() + 1, vigent });
      await aplicaEpoca(cripto, { estat, jo: a, ...canvi, directori, vigent });
      const enrere = await creaEpoca(cripto, { estat, jo: a, membres, motiu: MOTIU_EPOCA.rotacio, directori: antic, creatMs: ara() + 2, vigent });
      const retornAnticRebutjat = await rebutjaAmb(() => aplicaEpoca(cripto, { estat, jo: a, ...enrere, directori, vigent }), CODI.kidNoFixat);
      vigent();
      return Object.freeze({ continuitat: declarada.continuitat, canvi: declarada.canvi, retornAnticRebutjat });
    },
    tanca() { tancada = true; persones = null; codis = null; verificats = []; }
  });
}
