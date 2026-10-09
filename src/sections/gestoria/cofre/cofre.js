/**
 * cofre.js — el cofre xifrat de la Gestoria: crear, obrir, recuperar,
 * bloquejar, i desar i llegir registres xifrats.
 *
 * Onada 6, ordre del Mestre (261009): «BLINDATGE I SEGURETAT (1000x1000)…
 * Si funciona offline, xifra-ho i protegeix-ho perquè el Mestre puga provar
 * amb dades reals». El cofre no té xarxa: res no ix d'este ordinador. El
 * disseny criptogràfic és a nucli/cripto.js; el desament, a magatzemCofre.js
 * (només bytes xifrats); l'autobloqueig, a autobloqueig.js. Ací, l'estat:
 *   · 'insegur' — sense context segur (https o localhost) o sense WebCrypto:
 *     el cofre es nega a obrir-se. Per http a la xarxa local no funciona, a
 *     propòsit.
 *   · 'sense-magatzem' — el navegador no deixa desar res (IndexedDB).
 *   · 'absent' — encara no hi ha cofre: es pot crear o restaurar una còpia.
 *   · 'bloquejat' — hi ha cofre i cap clau en memòria.
 *   · 'obert' — la DEK de treball (no extraïble) viu en memòria fins que es
 *     bloqueja: botó, 10 minuts d'inactivitat, 5 minuts amagat o pagehide.
 * En bloquejar es descarta la clau, s'avisa els subscriptors (perquè
 * buiden el que tinguen desxifrat) i una operació començada abans ja no
 * torna res (la sessió ha canviat: COFRE_BLOQUEJAT).
 * La frase de pas no es guarda enlloc; el codi de recuperació es torna una
 * sola vegada a qui el crea i tampoc no es guarda. Les claus mai no
 * s'exporten en clar: només embolcallades amb AES-KW.
 * Rotació de la clau: un codi nou (renovaCodi), una recuperació amb el codi
 * (obreAmbCodi) i, si es demana, un canvi de frase (canviaContrasenya amb
 * { rotaClau: true }) fan una DEK NOVA i tornen a xifrar tots els registres
 * en una sola transacció. Així la frase i el codi retirats, encara que algú
 * tinga una còpia o una instantània anterior del perfil, no obrin res del
 * que hi ha ara ni del que vindrà; el que ja era dins d'eixa còpia vella, sí
 * (la porta de la còpia és la clau d'aleshores). Un canvi de frase sense
 * rotació només torna a embolcallar la DEK: les còpies anteriors continuen
 * obrint-se amb la frase vella.
 * Diverses pestanyes: la sessió recorda la meta amb què es va obrir. Si una
 * altra pestanya canvia la frase, el codi o la clau, la primera escriptura
 * (o un desxifrat que falla) ho detecta, la sessió es bloqueja ('canviat') i
 * dona COFRE_CANVIAT: mai s'escriu un registre amb una clau caducada.
 * Proves: el magatzem, l'IDB, cripto, l'entorn, les iteracions, els temps, el
 * rellotge i els temporitzadors s'injecten. En producció no se'n passa cap.
 */
import { TEMPS_AUTOBLOQUEIG, vigilaInactivitat } from './autobloqueig.js';
import { creaMagatzemCofre, mateixaMeta } from './magatzemCofre.js';
import {
  BYTES_CODI, ITERACIONS_KDF, MIN_ITERACIONS_PROVES, aleatori, bytesDelCodi, codiDeBytes, deBase64, desembolcalla,
  desxifraValor, embolcalla, errorAmbCodi, esColleccio, esIdOpac, exigixFrase, exigixLloc, generaDek, kekDeFrase,
  kekDelCodi, llegixParametres, nouId, nousParametres, parametresDesats, xifraValor
} from './nucli/cripto.js';

export const FORMAT_COFRE = 'sdp.gestoria.cofre';
export const FORMAT_COPIA = 'sdp.gestoria.cofre.copia';
export const FORMAT_CLAR = 'sdp.gestoria.cofre.clar';
/* El text que la persona confirma abans d'una exportació en clar. */
export const CONFIRMACIO_EN_CLAR = 'Entenc que el fitxer ix sense xifrar';
/* L'id del registre únic d'una col·lecció (persistenciaDelCofre): opac i fix. */
export const ID_UNIC = '00000000-0000-4000-8000-000000000000';
const MAX_REGISTRES_COPIA = 100000;
/* Els errors d'un registre que no es pot llegir al seu lloc. */
const ILLEGIBLE = new Set(['REGISTRE_MANIPULAT', 'COLLECCIO_INVALIDA', 'ID_INVALID']);

const MISSATGES = Object.freeze({
  CONTEXT_INSEGUR: 'El cofre només s’obri en un context segur (https o localhost) i amb el xifratge del navegador (WebCrypto). '
    + 'Per http des d’una altra màquina de la xarxa local no s’obri: obri l’app en este ordinador amb localhost.',
  COFRE_INEXISTENT: 'Encara no hi ha cap cofre en este navegador: crea’l o restaura’n una còpia.',
  COFRE_EXISTENT: 'Ja hi ha un cofre en este navegador.',
  COFRE_BLOQUEJAT: 'El cofre està bloquejat: obri’l amb la frase de pas.',
  COFRE_CANVIAT: 'El cofre ha canviat en una altra pestanya (frase, codi o clau): s’ha bloquejat ací. Torna a obrir-lo.',
  CONTRASENYA_ERRONIA: 'La frase de pas no obri el cofre. Revisa les majúscules i els accents.',
  CODI_ERRONI: 'El codi de recuperació no obri este cofre.',
  CONFIRMACIO_NECESSARIA: 'Per a exportar sense xifrar cal confirmar-ho de manera explícita.',
  COPIA_INVALIDA: 'El fitxer no és una còpia xifrada del cofre.',
  COPIA_MANIPULADA: 'La còpia no supera la comprovació d’integritat: no s’ha importat res.'
});
const error = (codi) => errorAmbCodi(codi, MISSATGES[codi]);

/* Congela un objecte i tot el que penja d'ell. */
function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congela);
    Object.freeze(valor);
  }
  return valor;
}

/* Una fila d'operacions: d'una en una, i una que falla no para les següents. */
function creaFila() {
  let cua = Promise.resolve();
  return (operacio) => {
    const pas = cua.then(operacio);
    cua = pas.catch(() => undefined);
    return pas;
  };
}

/**
 * El cofre local.
 * @param {object} [opcions]
 * @param {object} [opcions.magatzem] per defecte creaMagatzemCofre({ idb })
 * @param {IDBFactory} [opcions.idb] per al magatzem per defecte
 * @param {Crypto} [opcions.cripto] per defecte globalThis.crypto
 * @param {object} [opcions.entorn] per defecte globalThis: isSecureContext i els esdeveniments de l'autobloqueig
 * @param {number} [opcions.iteracions] per defecte 600.000 (només les proves l'abaixen)
 * @param {{ inactivitat: number, oculta: number }} [opcions.temps]
 * @param {() => number} [opcions.rellotge]
 * @param {{ setTimeout: Function, clearTimeout: Function }} [opcions.temporitzadors]
 */
export function creaCofreLocal({
  magatzem = null, idb, cripto = globalThis.crypto, entorn = globalThis, iteracions = ITERACIONS_KDF,
  temps = TEMPS_AUTOBLOQUEIG, rellotge = () => Date.now(), temporitzadors = globalThis
} = {}) {
  if (!Number.isSafeInteger(iteracions) || iteracions < MIN_ITERACIONS_PROVES) {
    throw new RangeError(`Les iteracions del KDF són un enter de ${MIN_ITERACIONS_PROVES} o més (600.000 en producció).`);
  }
  const enFila = creaFila();
  const subscriptors = new Set();
  let propi = magatzem;
  let sessio = null;

  const insegur = () => entorn?.isSecureContext !== true || typeof cripto?.subtle?.deriveKey !== 'function'
    || typeof cripto?.getRandomValues !== 'function';
  const exigixEntorn = () => {
    if (insegur()) throw error('CONTEXT_INSEGUR');
  };
  const magatzemDe = () => {
    if (!propi) propi = creaMagatzemCofre(idb === undefined ? {} : { idb });
    return propi;
  };

  function notifica(canvi) {
    for (const fn of [...subscriptors]) {
      try {
        fn(canvi);
      } catch {
        /* un subscriptor que falla no impedix avisar els altres */
      }
    }
  }

  function bloqueja(motiu = 'manual') {
    if (!sessio) return;
    const { vigilant } = sessio;
    sessio = null;
    vigilant?.atura();
    notifica(Object.freeze({ estat: 'bloquejat', motiu }));
  }

  /* Obri una sessió amb la DEK de treball i la meta amb què s'ha obert. */
  function obriSessio(dek, meta) {
    if (sessio) {
      sessio.vigilant?.atura();
      sessio = null;
    }
    const nova = { dek, meta, vigilant: null };
    sessio = nova;
    nova.vigilant = vigilaInactivitat({
      bloqueja: (motiu) => {
        if (sessio === nova) bloqueja(motiu);
      },
      entorn, temps, rellotge, temporitzadors
    });
    notifica(Object.freeze({ estat: 'obert', motiu: 'obert' }));
  }

  const exigixObert = () => {
    exigixEntorn();
    if (!sessio) throw error('COFRE_BLOQUEJAT');
    return sessio;
  };
  /* Després d'esperar: si la sessió ha canviat (bloqueig), el resultat es descarta. */
  const exigixLaMateixa = (s) => {
    if (sessio !== s) throw error('COFRE_BLOQUEJAT');
  };
  /* La sessió ha caducat (una altra pestanya ha canviat el cofre): es bloqueja i es diu. */
  function caduca(s) {
    if (sessio === s) bloqueja('canviat');
    throw error('COFRE_CANVIAT');
  }
  /* Una escriptura al magatzem: si diu COFRE_CANVIAT, la sessió caduca. */
  async function escriu(s, operacio) {
    try {
      return await operacio();
    } catch (e) {
      if (e?.codi === 'COFRE_CANVIAT') caduca(s);
      throw e;
    }
  }
  /* Un desxifrat que falla pot ser una sessió caducada (una altra pestanya ha rotat la clau): es mira abans de dir «manipulat». */
  async function desxifraAmb(s, operacio) {
    try {
      return await operacio();
    } catch (e) {
      if (e?.codi === 'REGISTRE_MANIPULAT' && sessio === s && !mateixaMeta(await magatzemDe().llegixMeta(), s.meta)) caduca(s);
      throw e;
    }
  }

  async function llegixMeta() {
    const meta = await magatzemDe().llegixMeta();
    if (!meta) throw error('COFRE_INEXISTENT');
    if (meta.format !== FORMAT_COFRE || meta.v !== 1) {
      throw errorAmbCodi('PARAMETRES_DESCONEGUTS', 'El cofre és d’una versió que esta app no coneix.');
    }
    return meta;
  }
  /* La meta vigent, que ha de ser la de la sessió; si no, la sessió caduca. */
  async function metaDeLaSessio(s) {
    const meta = await llegixMeta();
    if (!mateixaMeta(meta, s.meta)) caduca(s);
    return meta;
  }

  const parametresDe = (desats) => llegixParametres(desats, { minIteracions: iteracions });

  /* La DEK (no extraïble, o extraïble per a tornar-la a embolcallar) amb la frase vigent; CONTRASENYA_ERRONIA si no l'obri. */
  async function dekDeFrase(meta, frase, { extraible = false } = {}) {
    const parametres = parametresDe(meta.contrasenya);
    const kek = await kekDeFrase(cripto, frase, parametres);
    try {
      return await desembolcalla(cripto, parametres.dek, kek, { extraible });
    } catch {
      throw error('CONTRASENYA_ERRONIA');
    }
  }

  /* Un embolcall nou (paràmetres nous, sal nova) de la DEK extraïble amb un secret. */
  async function embolcallNou(dek, { frase, codi }) {
    const parametres = nousParametres(cripto, iteracions);
    const kek = frase !== undefined ? await kekDeFrase(cripto, frase, parametres) : await kekDelCodi(cripto, codi, parametres);
    return { desat: parametresDesats(parametres, await embolcalla(cripto, dek, kek)), kek };
  }

  /* La DEK de treball, NO extraïble, d'un embolcall i la seua KEK. */
  const dekDeTreball = (desat, kek) => desembolcalla(cripto, deBase64(desat.dek), kek);

  /* Un codi nou: el desat (per a la meta) i el text que es mostra una vegada. */
  async function codiNou(dek) {
    const bytes = aleatori(cripto, BYTES_CODI);
    try {
      const { desat } = await embolcallNou(dek, { codi: bytes });
      return { desat, text: codiDeBytes(bytes) };
    } finally {
      bytes.fill(0);
    }
  }

  const metaAmb = (contrasenya, recuperacio) => ({ format: FORMAT_COFRE, v: 1, contrasenya, recuperacio });

  async function desxifraFiles(dek, files, colleccio = null) {
    const eixida = [];
    for (const fila of files) {
      if (colleccio !== null && fila.colleccio !== colleccio) throw errorAmbCodi('REGISTRE_MANIPULAT', 'Un registre és fora de la seua col·lecció.');
      eixida.push({ colleccio: fila.colleccio, id: fila.id, valor: await desxifraValor(cripto, dek, fila.colleccio, fila.id, fila) });
    }
    return eixida;
  }

  /**
   * La rotació de la clau de les dades: una DEK nova, tots els registres
   * tornats a xifrar amb ella, un embolcall nou per a la frase i un codi nou,
   * i tot escrit en UNA transacció (COFRE_CANVIAT si una altra pestanya hi ha
   * escrit entremig). `dekVella` és la que obri els registres d'ara. Un
   * registre que ja no es podia llegir (manipulat o malmés) es deixa com
   * estava, perquè no es pot tornar a xifrar, i es compta a `illegibles`.
   * Si `s` és una sessió oberta, ha de ser encara la vigent abans d'escriure.
   * @returns {Promise<{ meta: object, dek: CryptoKey, codi: string, illegibles: number }>}
   */
  async function rotaClau(meta, dekVella, frase, s = null) {
    const llegits = await magatzemDe().totsElsRegistres();
    const valors = [];
    const illegibles = [];
    for (const fila of llegits) {
      try {
        valors.push({ colleccio: fila.colleccio, id: fila.id, valor: await desxifraValor(cripto, dekVella, fila.colleccio, fila.id, fila) });
      } catch (e) {
        if (!ILLEGIBLE.has(e?.codi)) throw e;
        illegibles.push({ colleccio: fila.colleccio, id: fila.id, iv: fila.iv, xifrat: fila.xifrat });
      }
    }
    const dek = await generaDek(cripto);
    const contrasenya = await embolcallNou(dek, { frase });
    const codi = await codiNou(dek);
    const dekNova = await dekDeTreball(contrasenya.desat, contrasenya.kek);
    const nous = [...illegibles];
    for (const { colleccio, id, valor } of valors) {
      nous.push({ colleccio, id, ...(await xifraValor(cripto, dekNova, colleccio, id, valor)) });
    }
    const nova = metaAmb(contrasenya.desat, codi.desat);
    if (s) {
      exigixLaMateixa(s);
      await escriu(s, () => magatzemDe().rota(nova, meta, llegits, nous));
    } else {
      await magatzemDe().rota(nova, meta, llegits, nous);
    }
    return { meta: nova, dek: dekNova, codi: codi.text, illegibles: illegibles.length };
  }

  /* La còpia llegida i comprovada en la forma: { meta, registres }. */
  function llegixCopia(text) {
    let copia;
    try {
      copia = typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      throw error('COPIA_INVALIDA');
    }
    const meta = copia?.cofre;
    const registres = copia?.registres;
    if (copia?.format !== FORMAT_COPIA || copia.v !== 1 || meta?.format !== FORMAT_COFRE || meta.v !== 1
      || !Array.isArray(registres) || registres.length > MAX_REGISTRES_COPIA) {
      throw error('COPIA_INVALIDA');
    }
    try {
      parametresDe(meta.contrasenya);
      parametresDe(meta.recuperacio);
    } catch {
      throw error('COPIA_INVALIDA');
    }
    const vistos = new Set();
    for (const r of registres) {
      const bo = r && typeof r === 'object' && esColleccio(r.colleccio) && esIdOpac(r.id)
        && typeof r.iv === 'string' && typeof r.xifrat === 'string' && !vistos.has(`${r.colleccio}|${r.id}`);
      if (!bo) throw error('COPIA_INVALIDA');
      vistos.add(`${r.colleccio}|${r.id}`);
    }
    return {
      meta: metaAmb({ ...meta.contrasenya }, { ...meta.recuperacio }),
      registres: registres.map(({ colleccio, id, iv, xifrat }) => ({ colleccio, id, iv, xifrat }))
    };
  }

  const cofre = {
    get obert() {
      return Boolean(sessio);
    },

    /** 'insegur' | 'sense-magatzem' | 'absent' | 'bloquejat' | 'obert'. */
    async estat() {
      if (insegur()) return 'insegur';
      if (sessio) return 'obert';
      try {
        return (await magatzemDe().llegixMeta()) ? 'bloquejat' : 'absent';
      } catch (e) {
        if (e?.codi === 'SENSE_INDEXEDDB') return 'sense-magatzem';
        throw e;
      }
    },

    /** Avisa cada canvi d'estat ({ estat: 'obert'|'bloquejat', motiu }). Torna la funció per a deixar d'escoltar. */
    subscriu(fn) {
      if (typeof fn !== 'function') throw new TypeError('subscriu() vol una funció.');
      subscriptors.add(fn);
      return () => subscriptors.delete(fn);
    },

    /** Un id opac nou (UUID v4) per a un registre: l'id mai no és una dada. */
    nouId() {
      return nouId(cripto);
    },

    /**
     * Crea el cofre amb una frase de pas i el deixa obert. Torna el codi de
     * recuperació: es mostra UNA sola vegada i no es guarda enlloc.
     * @returns {Promise<{ codiRecuperacio: string }>}
     */
    creaCofre(frase) {
      return enFila(async () => {
        exigixEntorn();
        exigixFrase(frase);
        const m = magatzemDe();
        if (await m.llegixMeta()) throw error('COFRE_EXISTENT');
        const dek = await generaDek(cripto);
        const contrasenya = await embolcallNou(dek, { frase });
        const codi = await codiNou(dek);
        const meta = metaAmb(contrasenya.desat, codi.desat);
        await m.creaMeta(meta);
        obriSessio(await dekDeTreball(contrasenya.desat, contrasenya.kek), meta);
        return Object.freeze({ codiRecuperacio: codi.text });
      });
    },

    /** Obri el cofre amb la frase de pas; CONTRASENYA_ERRONIA si no l'obri (falla el desembolcallat). */
    obreCofre(frase) {
      return enFila(async () => {
        exigixEntorn();
        if (typeof frase !== 'string') throw new TypeError('La frase de pas és un text.');
        const meta = await llegixMeta();
        obriSessio(await dekDeFrase(meta, frase), meta);
      });
    },

    /**
     * Obri el cofre amb el codi de recuperació i hi posa una frase nova. Rota
     * la clau de les dades: el codi usat i la frase oblidada ja no obrin res
     * del que hi ha ara, tampoc amb una còpia o una instantània anterior. Torna
     * un codi nou, que també es mostra una sola vegada.
     * @returns {Promise<{ codiRecuperacio: string, illegibles: number }>}
     */
    obreAmbCodi(codi, novaFrase) {
      return enFila(async () => {
        exigixEntorn();
        exigixFrase(novaFrase);
        const bytes = bytesDelCodi(codi);
        try {
          const meta = await llegixMeta();
          const parametres = parametresDe(meta.recuperacio);
          const kek = await kekDelCodi(cripto, bytes, parametres);
          let dekVella;
          try {
            dekVella = await desembolcalla(cripto, parametres.dek, kek);
          } catch {
            throw error('CODI_ERRONI');
          }
          const rotada = await rotaClau(meta, dekVella, novaFrase);
          obriSessio(rotada.dek, rotada.meta);
          return Object.freeze({ codiRecuperacio: rotada.codi, illegibles: rotada.illegibles });
        } finally {
          bytes.fill(0);
        }
      });
    },

    /**
     * Canvia la frase de pas (cal la vigent). Per defecte només es torna a
     * embolcallar la DEK: les dades no es toquen, el codi continua valent i
     * les còpies anteriors s'obrin amb la frase vella. Amb { rotaClau: true }
     * (sospita que algú coneix la frase o el codi), es rota la clau de les
     * dades i es torna un codi nou: res del que hi ha ara s'obri amb els
     * secrets d'abans.
     * @returns {Promise<{ rotada: boolean, codiRecuperacio: string|null, illegibles: number }>}
     */
    canviaContrasenya(actual, nova, { rotaClau: rota = false } = {}) {
      return enFila(async () => {
        const s = exigixObert();
        exigixFrase(nova);
        const meta = await metaDeLaSessio(s);
        if (rota) {
          const rotada = await rotaClau(meta, await dekDeFrase(meta, actual), nova, s);
          s.dek = rotada.dek;
          s.meta = rotada.meta;
          return Object.freeze({ rotada: true, codiRecuperacio: rotada.codi, illegibles: rotada.illegibles });
        }
        const dek = await dekDeFrase(meta, actual, { extraible: true });
        const contrasenya = await embolcallNou(dek, { frase: nova });
        exigixLaMateixa(s);
        const novaMeta = metaAmb(contrasenya.desat, meta.recuperacio);
        await escriu(s, () => magatzemDe().substituixMeta(novaMeta, meta));
        s.meta = novaMeta;
        return Object.freeze({ rotada: false, codiRecuperacio: null, illegibles: 0 });
      });
    },

    /**
     * Un codi de recuperació nou (cal la frase vigent). Rota també la clau de
     * les dades: el codi anterior, encara que algú tinga una còpia o una
     * instantània d'abans, ja no obri res del que hi ha ara ni del que vindrà.
     * @returns {Promise<{ codiRecuperacio: string, illegibles: number }>}
     */
    renovaCodi(frase) {
      return enFila(async () => {
        const s = exigixObert();
        const meta = await metaDeLaSessio(s);
        const rotada = await rotaClau(meta, await dekDeFrase(meta, frase), frase, s);
        s.dek = rotada.dek;
        s.meta = rotada.meta;
        return Object.freeze({ codiRecuperacio: rotada.codi, illegibles: rotada.illegibles });
      });
    },

    /** Bloqueja ara: es descarta la clau i s'avisa els subscriptors. */
    bloqueja(motiu = 'manual') {
      bloqueja(motiu);
    },

    /** Desa (o reescriu) el valor JSON d'un registre, xifrat amb un IV nou. */
    desa(colleccio, id, valor) {
      return enFila(async () => {
        const s = exigixObert();
        exigixLloc(colleccio, id);
        const xifrat = await xifraValor(cripto, s.dek, colleccio, id, valor);
        exigixLaMateixa(s);
        await escriu(s, () => magatzemDe().desaRegistre({ colleccio, id, ...xifrat }, s.meta));
      });
    },

    /** El valor d'un registre, o null si no n'hi ha. REGISTRE_MANIPULAT si no supera la comprovació. */
    llig(colleccio, id) {
      return enFila(async () => {
        const s = exigixObert();
        exigixLloc(colleccio, id);
        const fila = await magatzemDe().llegixRegistre(colleccio, id);
        if (!fila) return null;
        const valor = await desxifraAmb(s, () => desxifraValor(cripto, s.dek, colleccio, id, fila));
        exigixLaMateixa(s);
        return valor;
      });
    },

    /** Tots els registres d'una col·lecció: [{ id, valor }]. Si un no es pot desxifrar, cap. */
    llista(colleccio) {
      return enFila(async () => {
        const s = exigixObert();
        exigixLloc(colleccio, ID_UNIC);
        const files = await magatzemDe().registresDe(colleccio);
        const valors = await desxifraAmb(s, () => desxifraFiles(s.dek, files, colleccio));
        exigixLaMateixa(s);
        return valors.map(({ id, valor }) => ({ id, valor }));
      });
    },

    /** Esborra un registre; cert si hi era. */
    esborra(colleccio, id) {
      return enFila(async () => {
        exigixObert();
        exigixLloc(colleccio, id);
        return magatzemDe().esborraRegistre(colleccio, id);
      });
    },

    /**
     * La còpia de seguretat XIFRADA (text JSON): els paràmetres, les dues DEK
     * embolcallades i els registres xifrats. Cap byte en clar. Cal el cofre obert.
     */
    exporta() {
      return enFila(async () => {
        const s = exigixObert();
        const meta = await llegixMeta();
        const files = await magatzemDe().totsElsRegistres();
        exigixLaMateixa(s);
        return JSON.stringify({
          format: FORMAT_COPIA,
          v: 1,
          cofre: metaAmb(meta.contrasenya, meta.recuperacio),
          registres: files.map(({ colleccio, id, iv, xifrat }) => ({ colleccio, id, iv, xifrat }))
        });
      });
    },

    /**
     * Importa una còpia xifrada amb la seua frase de pas. Abans de tocar res,
     * la frase ha d'obrir la còpia i TOTS els registres han de superar la
     * comprovació d'integritat (COPIA_MANIPULADA si no).
     *   · Sense cofre: es restaura sencer (la mateixa frase i el mateix codi
     *     de la còpia) i queda obert.
     *   · Amb el cofre obert: s'hi afig el que falta, tornat a xifrar amb la
     *     clau d'este cofre; mai es reescriu el que ja hi ha.
     *   · Amb el cofre bloquejat: COFRE_BLOQUEJAT.
     * @returns {Promise<{ restaurat: boolean, afegits: number, conservats: number }>}
     */
    importa(text, frase) {
      return enFila(async () => {
        exigixEntorn();
        if (typeof frase !== 'string') throw new TypeError('La frase de pas és un text.');
        const copia = llegixCopia(text);
        const s = sessio;
        if (!s && (await magatzemDe().llegixMeta())) throw error('COFRE_BLOQUEJAT');
        const parametres = parametresDe(copia.meta.contrasenya);
        const kek = await kekDeFrase(cripto, frase, parametres);
        let dekCopia;
        try {
          dekCopia = await desembolcalla(cripto, parametres.dek, kek);
        } catch {
          throw error('CONTRASENYA_ERRONIA');
        }
        let valors;
        try {
          valors = await desxifraFiles(dekCopia, copia.registres);
        } catch {
          throw error('COPIA_MANIPULADA');
        }
        if (!s) {
          await magatzemDe().restaura(copia.meta, copia.registres);
          obriSessio(dekCopia, copia.meta);
          return Object.freeze({ restaurat: true, afegits: copia.registres.length, conservats: 0 });
        }
        const nous = [];
        for (const { colleccio, id, valor } of valors) {
          nous.push({ colleccio, id, ...(await xifraValor(cripto, s.dek, colleccio, id, valor)) });
        }
        exigixLaMateixa(s);
        const { afegits, conservats } = await escriu(s, () => magatzemDe().afegixSiFalten(nous, s.meta));
        return Object.freeze({ restaurat: false, afegits, conservats });
      });
    },

    /**
     * L'exportació EN CLAR (text JSON), només amb la confirmació explícita
     * (CONFIRMACIO_EN_CLAR) i la frase de pas vigent.
     */
    exportaEnClar(frase, confirmacio) {
      return enFila(async () => {
        const s = exigixObert();
        if (confirmacio !== CONFIRMACIO_EN_CLAR) throw error('CONFIRMACIO_NECESSARIA');
        const meta = await metaDeLaSessio(s);
        await dekDeFrase(meta, frase);
        const registres = await desxifraAmb(s, async () => desxifraFiles(s.dek, await magatzemDe().totsElsRegistres()));
        exigixLaMateixa(s);
        return JSON.stringify({
          format: FORMAT_CLAR,
          v: 1,
          avis: 'ATENCIÓ: este fitxer NO està xifrat. Guarda’l en un lloc segur i esborra’l quan ja no el necessites.',
          registres
        }, null, 2);
      });
    },

    /** Bloqueja i tanca la connexió amb el magatzem. */
    tanca() {
      bloqueja('tancat');
      propi?.tanca?.();
    }
  };
  return Object.freeze(cofre);
}

/* L'únic cofre de l'app (integració de l'Onada 6, 261009). */
let cofreUnic = null;

/**
 * El cofre de l'app de la Gestoria: UNA sola instància per pàgina, creada
 * amb els valors de producció la primera vegada que una vista la demana
 * (hui, només l'Històric) i mai tancada, perquè el mòdul és la memòria de
 * l'app. Dues instàncies tindrien dues sessions, dues files d'operacions i
 * dues connexions amb la mateixa base, i cada una prendria els canvis de
 * l'altra (un codi nou, una frase nova) per una altra pestanya: COFRE_CANVIAT.
 * Qui el fa servir el bloqueja en eixir de la seua vista (Historic.jsx): la
 * clau no es queda en memòria mentre la persona és en una altra part de l'app.
 * Les proves no el fan servir: injecten el seu propi creaCofreLocal.
 * @returns {object} el cofre
 */
export function cofreDeLaGestoria() {
  if (!cofreUnic) cofreUnic = creaCofreLocal();
  return cofreUnic;
}

/**
 * La persistència d'UNA col·lecció amb un sol valor (per al front de
 * l'Històric): { desa(valor), llig(), esborra(), subscriu(fn) }. El registre
 * té l'id opac fix ID_UNIC. Amb el cofre bloquejat, COFRE_BLOQUEJAT; qui
 * guarde el valor desxifrat l'ha de buidar quan subscriu() avise
 * { estat: 'bloquejat' }.
 */
export function persistenciaDelCofre(cofre, colleccio) {
  if (!esColleccio(colleccio)) throw errorAmbCodi('COLLECCIO_INVALIDA', 'La col·lecció és una etiqueta en minúscules (com «classificacions»).');
  return congela({
    colleccio,
    desa: (valor) => cofre.desa(colleccio, ID_UNIC, valor),
    llig: () => cofre.llig(colleccio, ID_UNIC),
    esborra: () => cofre.esborra(colleccio, ID_UNIC),
    subscriu: (fn) => cofre.subscriu(fn)
  });
}
