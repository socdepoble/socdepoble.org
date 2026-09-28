/* ═══════════════════════════════════════════════════════════════════
   T47 (ordre del Mestre, 260928) · LA CUA D'AUTODESAMENT I LA SESSIÓ

   · En cada entrada de sessió (i en arrencar amb una sessió viva), el que
     esta persona havia deixat pendent en este backend es torna a enviar.
   · En eixir de veres (eixDeLaSessio), primer un intent final d'enviar el
     pendent i després els seus esborranys s'obliden d'este dispositiu: en
     un ordinador compartit del poble, el text d'una persona no es pot
     quedar per a la següent.
   · T47 (correcció de la revisió C01, 260928) · Abans d'eixir, la interfície
     pregunta a preparaEixida què NO ha arribat al servidor, i ho diu a la
     persona abans d'esborrar-ho: res no s'oblida en silenci.
   · C02 · Els gestors que no són esta cua (Notes, 'SdpNotesQueue') s'hi
     injecten des de fora (SessionContext): src/data no importa mai de
     src/sections. `abansDeTancar` envia amb la sessió encara vàlida;
     `despresDeTancar` oblida, només si tancar ha anat bé; `pendentsDe` diu
     el que queda per a l'avís.
   El connecta SessionContext, que és on viu l'eixida de la interfície.
   ═══════════════════════════════════════════════════════════════════ */
import { cuaDesament } from './cua.js';
import { ambitDe } from './ambit.js';

export function reprenSessio(config, usuariId, cua = cuaDesament) {
  if (usuariId == null) return;
  const ambit = ambitDe(config, usuariId);
  if (!ambit) return;
  cua.recordaContext(ambit, config);
  void cua.hidrata().then(() => cua.repren(ambit));
}

export function oblidaSessio(config, usuariId, cua = cuaDesament) {
  if (usuariId == null) return Promise.resolve(false);
  const ambit = ambitDe(config, usuariId);
  return ambit ? Promise.resolve(cua.oblida(ambit)) : Promise.resolve(false);
}

/* El límit de l'intent final: eixir no pot quedar penjat d'una xarxa morta. */
export const LIMIT_EIXIDA_MS = 3000;

/* Una funció injectada no talla mai l'eixida: ni si llança ni si rebutja. */
function segur(funcio, ...args) {
  try {
    return Promise.resolve(funcio(...args)).catch((error) => {
      console.warn('[autodesament] Eixida:', error?.message || error);
      return null;
    });
  } catch (error) {
    console.warn('[autodesament] Eixida:', error?.message || error);
    return Promise.resolve(null);
  }
}

/* L'intent final: la cua i els gestors injectats envien alhora, com a màxim
   `limitMs` en total. Mai rebutja. */
async function intentFinal({ ambit, usuariId, cua, limitMs, envia }) {
  const intents = [];
  if (ambit) intents.push(Promise.resolve().then(() => cua.enviaAmbit(ambit)).catch(() => false));
  if (usuariId != null) for (const funcio of envia) intents.push(segur(funcio, usuariId, { espera: limitMs }));
  if (!intents.length) return;
  let temps;
  const limit = new Promise((resolve) => { temps = globalThis.setTimeout(() => resolve(false), limitMs); });
  try {
    await Promise.race([Promise.all(intents), limit]);
  } finally {
    globalThis.clearTimeout(temps);
  }
}

/**
 * T47 (correcció de la revisió C01, 260928) · ABANS d'eixir: l'intent final
 * (com a màxim `limitMs`) i la llista del que encara NO té el servidor, de la
 * cua ([{ entitat, id, camps }]) i dels gestors `pendentsDe`. No tanca res ni
 * oblida res: la interfície decidix amb la persona. Mai rebutja.
 */
export async function preparaEixida({
  config, usuariId, cua = cuaDesament, limitMs = LIMIT_EIXIDA_MS, abansDeTancar = [], pendentsDe = [],
} = {}) {
  const ambit = usuariId == null ? null : ambitDe(config, usuariId);
  if (ambit) cua.recordaContext(ambit, config);
  await intentFinal({ ambit, usuariId, cua, limitMs, envia: abansDeTancar });
  const pendents = [];
  if (ambit) {
    try { pendents.push(...cua.pendentsDe(ambit)); } catch (error) { console.warn('[autodesament] Pendents:', error?.message || error); }
  }
  if (usuariId != null) {
    for (const funcio of pendentsDe) {
      const mes = await segur(funcio, usuariId);
      if (Array.isArray(mes)) pendents.push(...mes);
    }
  }
  return pendents;
}

/**
 * T47 (correcció de la revisió, 260928) · L'ÚNICA eixida de veres. La fan
 * servir SessionContext (tancaSessio: «Tancar sessió», «Eixir del poble») i
 * la baixa (DetallPrivacitat), que tanca la sessió dins de l'adaptador.
 *   1. Amb la sessió encara vàlida, un intent final d'enviar el pendent
 *      d'esta persona (la cua i `abansDeTancar`), com a màxim `limitMs`.
 *   2. `tanca()`: el que tanca la sessió (logout, demanaBaixa…).
 *   3. Només si ha anat bé, s'obliden els esborranys de l'àmbit (memòria i
 *      IndexedDB) i els dels gestors (`despresDeTancar`): en un ordinador
 *      compartit del poble, el text d'una persona no es queda per a la
 *      següent. Si `tanca` falla, la persona continua dins i el seu text també.
 * Qui vol avisar abans del que es perdrà crida primer preparaEixida (C01).
 * Torna el que torna `tanca`, un cop l'esborrat ha aterrat (qui recarrega la
 * pàgina després no el talla a mitges).
 */
export async function eixDeLaSessio({
  config, usuariId, tanca, cua = cuaDesament, limitMs = LIMIT_EIXIDA_MS, abansDeTancar = [], despresDeTancar = [],
} = {}) {
  const ambit = usuariId == null ? null : ambitDe(config, usuariId);
  if (ambit) cua.recordaContext(ambit, config);
  await intentFinal({ ambit, usuariId, cua, limitMs, envia: abansDeTancar });
  const resultat = await tanca();
  if (ambit) await cua.oblida(ambit);
  if (usuariId != null) await Promise.all(despresDeTancar.map((funcio) => segur(funcio, usuariId)));
  return resultat;
}
