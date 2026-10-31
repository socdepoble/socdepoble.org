/**
 * traductorLliure.js — El transport lliure d'Apertium per al lloc propi
 * estàtic (IDEA-31, ampliació del Mestre 261030 00:30).
 *
 * socdepoble.org és Firebase Hosting: no té cap servidor de traducció. Amb
 * esta via, «Traduir» hi funciona igual: el navegador del visitant envia cada
 * text al servei públic d'Apertium (programari lliure, sense clau, CORS amb
 * Access-Control-Allow-Origin: *), sense galetes ni referent. El text ix del
 * navegador cap a Apertium, que veu l'adreça IP del visitant: /traduccions ho
 * diu. La CSP del lloc ja permet connect-src https:.
 *
 * Mateix contracte que creaTraductor (data/traductor.js):
 *   { disponible, tradueix(textos, desti, { format, signal }) } → { traduccions, desti, cache }
 * amb els mateixos codis (CODI_TRADUCCIO) i els mateixos límits per lot
 * (LIMITS_TRADUCCIO); el pressupost per pàgina el posa tradueixTot. Així
 * useTraduccioPagina, MenuTraduir i TraduccioPagina no canvien.
 *
 * Només l'entrada pròpia (main.jsx) l'activa, amb fixaTraductorLliure(): una
 * via interna, com la capa del paquet, que cap amfitrió no abasta (no és cap
 * clau de config, atribut ni global). Si hi ha un traductorUrl del mateix
 * origen (el servidor de dev, VITE_TRADUCTOR_URL o el connector), mana el
 * servidor (useTraduccioPagina.js).
 *
 *  · MOTORS_TRADUCCIO és la matriu de capacitats per destí, l'única font de
 *    veritat del client (decisions de l'orquestrador 261030 03:25, §1): el
 *    servidor de dev i el PHP la repliquen i una prova de contracte ho
 *    comprova. ES, EN-GB i FR (cat|spa, cat|eng, cat|fra) amb Apertium, beta
 *    i després la principal; GL (cat|glg) amb Apertium NOMÉS la beta (la
 *    principal torna 400 «That pair is not installed», que a més taca la
 *    consola); EU (ca|eu) i DE (ca|de), que Apertium no oferix des del
 *    català, amb MyMemory (Translated S.r.l.), sense clau ni correu.
 *  · Cap reserva cap a un tercer per a ES, EN-GB, FR i GL quan Apertium
 *    falla: error net (el text no va a un servei que la persona no espera).
 *    Lingva, no: rascla Google Translate i torna el català sense traduir.
 *  · Apertium: una crida per text (l'APy només traduïx l'últim q d'una
 *    crida), amb `format` explícit (C6: 'txt' per al text pla, 'html' per a
 *    l'HTML; l'APy, sense, desformata com a HTML).
 *  · MyMemory: un GET sense cap capçalera pròpia (ni Content-Type ni
 *    User-Agent), sense `de`, `ip` ni `key`. Talls de com a molt 450 bytes
 *    UTF-8 (el servei en permet 500), per frase o per espai, en ordre. Els
 *    errors que arriben amb un 200 («MYMEMORY WARNING», «QUERY LENGTH
 *    LIMIT», `responseStatus` ≠ 200, `quotaFinished`) són errors, mai
 *    traducció. Un comptador diari propi (4500 caràcters per dia UTC, el
 *    servei en dona 5000 sense clau) atura una pàgina que no hi cap ABANS
 *    d'enviar res. L'HTML no hi va (el desplaça): NO_DISPONIBLE. Només val
 *    la traducció del motor («MT!»), mai la de la memòria col·laborativa.
 *  · Com a molt 2 crides alhora; decisió del Mestre (261030 §2): 12 s per
 *    crida i 30 s per lot, perquè una crida lenta no l'esgote.
 *  · Decisió del Mestre (261030 00:40): primer la beta,
 *    https://beta.apertium.org/apy/translate, perquè la consola del
 *    navegador es quede a 0 errors; només si la beta cau (xarxa o 5xx) es
 *    prova la reserva, https://apertium.org/apy/translate, si el destí en té.
 *    Cada lot torna a provar primer la beta. Gauntlet 261030 (cicle 2,
 *    apertium-beta-penjada-esgota-lot-navegador) · Dins d'un lot, un extrem
 *    que ha caigut (xarxa, termini o 5xx) no es torna a provar mentre en
 *    quede un altre: la resta de textos va a la reserva, com fan el servidor
 *    de dev i el PHP. Si no en queda cap, es tornen a provar tots.
 *  · Memòria cau de la sessió (2000 textos; un text que el motor torna igual,
 *    sense traduir, no s'hi desa: ALT-02) i 30 lots sense cache cada 10
 *    minuts, com el ritme per client del servidor; un lot cancel·lat abans
 *    d'acabar no hi compta (G10). Pauses per motor: un 403 o 429 d'Apertium
 *    para Apertium 60 s (mai un termini ni un error de xarxa); un 403, 429 o
 *    la quota esgotada de MyMemory para MyMemory fins a les 00:00 UTC.
 *  · Cap capçalera pròpia: ni User-Agent (és el del navegador) ni cap altra.
 *    Peticions simples, sense comprovació prèvia.
 */
import {
  CODI_TRADUCCIO, ErrorTraductor, LIMITS_TRADUCCIO, bytesDe, caractersDe, composaSenyal, llenguaDeTraduccio
} from './traductor.js';
import { fixaCarregadorLliure } from './traductorDelLloc.js';

export const APERTIUM_BETA = 'https://beta.apertium.org/apy/translate';
export const APERTIUM_RESERVA = 'https://apertium.org/apy/translate';
export const MYMEMORY = 'https://api.mymemory.translated.net/get';
/* L'ordre dels extrems: decisió del Mestre (261030 00:40). */
const AMB_RESERVA = Object.freeze([APERTIUM_BETA, APERTIUM_RESERVA]);
export const MOTORS_TRADUCCIO = Object.freeze({
  ES: Object.freeze({ motor: 'apertium', parell: 'cat|spa', extrems: AMB_RESERVA }),
  GL: Object.freeze({ motor: 'apertium', parell: 'cat|glg', extrems: Object.freeze([APERTIUM_BETA]) }),
  EU: Object.freeze({ motor: 'mymemory', parell: 'ca|eu' }),
  'EN-GB': Object.freeze({ motor: 'apertium', parell: 'cat|eng', extrems: AMB_RESERVA }),
  FR: Object.freeze({ motor: 'apertium', parell: 'cat|fra', extrems: AMB_RESERVA }),
  DE: Object.freeze({ motor: 'mymemory', parell: 'ca|de' }),
});
export const LIMITS_LLIURE = Object.freeze({
  concurrencia: 2, crida: 12000, lot: 30000, pausa: 60 * 1000, lots: 30, finestra: 10 * 60 * 1000, cau: 2000
});
export const LIMITS_MYMEMORY = Object.freeze({ bytes: 450, crida: 12000, lot: 30000, diari: 4500 });
/* Textos d'error que MyMemory torna amb un HTTP 200 dins de translatedText. */
const ERROR_MYMEMORY = /^\s*(?:MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID (?:LANGUAGE|SOURCE|TARGET|EMAIL|KEY)|PLEASE SELECT|NO QUERY SPECIFIED|'?AUTO'? IS AN INVALID)/i;
/* L'autor de les entrades del motor automàtic a `matches` (mesura real del
   261030: «created-by»: "MT!", «reference»: "Machine Translation."). */
const AUTOR_MOTOR_MYMEMORY = 'MT!';

const FORMATS = new Set(['text', 'html']);

/* Gauntlet 261030 (cicle 2) · La via (fixaTraductorLliure,
   traductorLliureDelLloc) viu a traductorDelLloc.js, sense dependències:
   main.jsx la fixa sense carregar este mòdul, que va en un tros a part. Es
   reexporta per a qui ja el té carregat. */
export { fixaTraductorLliure, traductorLliureDelLloc } from './traductorDelLloc.js';

/* L'estat de la sessió (la pestanya): sobreviu al canvi de pàgina. Les
   pauses són per motor: el basc sense quota no para el castellà. */
const sessio = { cau: new Map(), lots: [], pauses: { apertium: 0, mymemory: 0 }, diari: { dia: '', caracters: 0 } };

/** Per a les proves: una sessió nova. */
export function buidaSessioLliure() {
  sessio.cau.clear();
  sessio.lots = [];
  sessio.pauses = { apertium: 0, mymemory: 0 };
  sessio.diari = { dia: '', caracters: 0 };
}

const errorLimit = () => new ErrorTraductor(CODI_TRADUCCIO.SERVIDOR, { status: 429, codiServidor: 'sdp_traduccio_limit' });
const ABORTAT = Symbol('abortat');

const diaUTC = (instant) => new Date(instant).toISOString().slice(0, 10);
/* MyMemory diu quan torna la quota amb `retry-after`, però no l'exposa
   (cap Access-Control-Expose-Headers): el navegador no la pot llegir. La
   quota es reinicia a les 00:00 UTC (mesura del 261030: retry-after
   apuntava exactament ací). */
const fiDelDiaUTC = (instant) => {
  const data = new Date(instant);
  return Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate() + 1);
};

/**
 * Trossos de com a molt `maxim` bytes UTF-8, en ordre: per frase si se
 * pot, si no per espai i, si no, un tall dur; mai a mitjan caràcter (es
 * compta per punts de codi). Un text que hi cap torna tal qual.
 */
export function partixPerBytes(text, maxim = LIMITS_MYMEMORY.bytes) {
  const tot = String(text);
  if (bytesDe(tot) <= maxim) return [tot];
  const trossos = [];
  let resta = Array.from(tot);
  while (bytesDe(resta.join('')) > maxim) {
    let bytes = 0;
    let fi = 0;
    while (fi < resta.length && bytes + bytesDe(resta[fi]) <= maxim) {
      bytes += bytesDe(resta[fi]);
      fi += 1;
    }
    fi = Math.max(fi, 1);
    const cap = resta.slice(0, fi).join('');
    const frase = Math.max(...['. ', '? ', '! ', '; ', ': ', '\n'].map((final) => cap.lastIndexOf(final)));
    const espai = cap.lastIndexOf(' ');
    const tall = frase > 0 ? frase + 1 : (espai > 0 ? espai : cap.length);
    const tros = cap.slice(0, tall);
    trossos.push(tros);
    resta = resta.slice(Array.from(tros).length);
  }
  trossos.push(resta.join(''));
  return trossos;
}

/* MyMemory escriu a vegades l'apòstrof com a «&#39;». La traducció es pinta
   com a text (React l'escapa), així que una entitat es veuria tal qual: es
   desfà, llevat que l'original ja la portara escrita així.
   Gauntlet 261030 (cicle 2, mymemory-entitats-amb-ampersand) · Entitat a
   entitat: abans, un sol «&» a l'original («R&D», «Pobles & Gent») les
   deixava totes crues («l&#39;agiria»). */
const ENTITATS = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ' });
function desfesEntitats(traduit, original = '') {
  return traduit.replace(/&(?:#(\d{1,7})|#x([0-9a-f]{1,6})|([a-z]+));/gi, (entitat, decimal, hexa, nom) => {
    if (original && original.includes(entitat)) return entitat;
    const punt = decimal ? Number(decimal) : hexa ? parseInt(hexa, 16) : null;
    if (punt !== null) return punt > 0 && punt <= 0x10ffff ? String.fromCodePoint(punt) : entitat;
    return ENTITATS[nom.toLowerCase()] ?? entitat;
  });
}

/* ALT-02 (Gemini 261030) · El segment de l'entrada del motor és el tros
   enviat, però MyMemory escriu entitats en els camps que torna (mesura del
   261030 a translatedText: «L&#39;Hostal d&#39;Ares»): «L'Alcoià» podria
   tornar com a «L&#39;Alcoià». Val el segment tal qual o amb les entitats
   desfetes una vegada (l'escapament que el servei hi hauria fet). */
const mateixSegment = (segment, tros) => segment.trim() === tros.trim() || desfesEntitats(segment).trim() === tros.trim();

/**
 * creaTraductorApertium({ fetch, ara, limits, limitsMyMemory }) → { disponible, admetHtml, comprovaPagina, tradueix }.
 * El nom és el de la via (fixaTraductorLliure('apertium')); hui hi van
 * Apertium i MyMemory, segons MOTORS_TRADUCCIO.
 * `fetch` i `ara` s'injecten a les proves; per defecte, els del navegador.
 */
export function creaTraductorApertium({
  fetch: fetchPropi, ara = Date.now, limits = LIMITS_LLIURE, limitsMyMemory = LIMITS_MYMEMORY
} = {}) {
  /* El fetch global es llig en cada crida, com a creaTraductor. */
  const fer = (url, opcions) => (fetchPropi ? fetchPropi(url, opcions) : globalThis.fetch(url, opcions));
  const disponible = Boolean(fetchPropi || typeof globalThis.fetch === 'function');

  const llegixCau = (clau) => {
    if (!sessio.cau.has(clau)) return undefined;
    const valor = sessio.cau.get(clau);
    sessio.cau.delete(clau);
    sessio.cau.set(clau, valor);
    return valor;
  };
  const desaCau = (clau, valor) => {
    sessio.cau.delete(clau);
    sessio.cau.set(clau, valor);
    while (sessio.cau.size > limits.cau) sessio.cau.delete(sessio.cau.keys().next().value);
  };

  const clauDe = (desti, format, text) => JSON.stringify([desti, format, text]);

  /**
   * Una crida: { status, json } o { xarxa: true }. Mai llança. El termini
   * (12 s) cobrix també la lectura del cos; la cancel·lació del lot l'avorta.
   * `cos` és un URLSearchParams (POST d'Apertium) o res (GET de MyMemory):
   * peticions simples, sense cap capçalera.
   */
  async function crida(url, cos, lot, termini) {
    const senyal = composaSenyal(lot.signal, termini);
    try {
      const resposta = await senyal.dins(fer(url, {
        method: cos ? 'POST' : 'GET',
        ...(cos ? { body: cos } : {}),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        mode: 'cors',
        cache: 'no-store',
        redirect: 'error',
        signal: senyal.signal,
      }));
      let json = null;
      if (resposta.status === 200) {
        try {
          json = await senyal.dins(resposta.json());
        } catch {
          if (senyal.motiu()) return { xarxa: true };
          json = null;
        }
      }
      return { status: resposta.status, json };
    } catch {
      return { xarxa: true };
    } finally {
      senyal.allibera();
    }
  }

  async function tradueixApertium(text, motor, format, lot, caiguts) {
    let resultat = null;
    const vius = motor.extrems.filter((url) => !caiguts.has(url));
    for (const url of (vius.length ? vius : motor.extrems)) {
      /* C6 · El format, sempre explícit: l'APy, sense, desformata com a HTML. */
      const cos = new URLSearchParams({ langpair: motor.parell, q: text, markUnknown: 'no', format: format === 'html' ? 'html' : 'txt' });
      resultat = await crida(url, cos, lot, limits.crida);
      if (lot.signal.aborted) throw ABORTAT;
      if (!resultat.xarxa && resultat.status < 500) break;
      caiguts.add(url);
    }
    if (resultat.xarxa) throw new ErrorTraductor(CODI_TRADUCCIO.INABASTABLE, { status: 0 });
    if (resultat.status === 403 || resultat.status === 429) {
      sessio.pauses.apertium = ara() + limits.pausa;
      throw resultat.status === 429 ? errorLimit() : new ErrorTraductor(CODI_TRADUCCIO.SERVIDOR, { status: 403 });
    }
    if (resultat.status !== 200) throw new ErrorTraductor(CODI_TRADUCCIO.SERVIDOR, { status: resultat.status });
    const dades = resultat.json?.responseStatus === 200 ? resultat.json.responseData : null;
    const traduit = dades && typeof dades === 'object' ? dades.translatedText : null;
    if (typeof traduit !== 'string' || !traduit) throw new ErrorTraductor(CODI_TRADUCCIO.RESPOSTA_INVALIDA, { status: 200 });
    return traduit;
  }

  const pausaMyMemory = () => {
    sessio.pauses.mymemory = fiDelDiaUTC(ara());
    return errorLimit();
  };

  /* La resposta de MyMemory, o un error net. Els errors arriben sovint amb
     HTTP 200 i `responseStatus` canvia de tipus (el número 200 quan va bé, la
     cadena "403" quan falla): es compara amb Number().
     Gauntlet 261030 (cicle 2, mymemory-memoria-collaborativa) · Només val la
     traducció del motor: l'entrada de `matches` amb «created-by» «MT!» i el
     mateix segment que s'ha enviat. `translatedText` pot vindre de la
     memòria col·laborativa, on qualsevol pot escriure sense clau (una
     coincidència exacta hi guanya el motor). Sense l'entrada del motor,
     null: el text es queda en l'original. */
  function llegixMyMemory(resultat, tros) {
    if (resultat.xarxa) throw new ErrorTraductor(CODI_TRADUCCIO.INABASTABLE, { status: 0 });
    if (resultat.status === 403 || resultat.status === 429) throw pausaMyMemory();
    if (resultat.status !== 200) throw new ErrorTraductor(CODI_TRADUCCIO.SERVIDOR, { status: resultat.status });
    const json = resultat.json;
    const estat = Number(json?.responseStatus);
    const dades = json?.responseData;
    const traduit = dades && typeof dades === 'object' ? dades.translatedText : null;
    if (json?.quotaFinished === true || estat === 429 || (typeof traduit === 'string' && /MYMEMORY WARNING/i.test(traduit))) {
      throw pausaMyMemory();
    }
    if (estat !== 200 || typeof traduit !== 'string' || !traduit.trim() || ERROR_MYMEMORY.test(traduit)) {
      throw new ErrorTraductor(CODI_TRADUCCIO.RESPOSTA_INVALIDA, { status: 200 });
    }
    const delMotor = (Array.isArray(json.matches) ? json.matches : []).find((entrada) => entrada
      && entrada['created-by'] === AUTOR_MOTOR_MYMEMORY && typeof entrada.segment === 'string' && mateixSegment(entrada.segment, tros));
    const traduccio = delMotor?.translation;
    if (typeof traduccio !== 'string' || !traduccio.trim() || ERROR_MYMEMORY.test(traduccio)) return null;
    return traduccio;
  }

  /* El comptador diari de MyMemory (dia UTC): els caràcters que ja ha rebut
     des d'esta pestanya. */
  const usatsAvui = () => (sessio.diari.dia === diaUTC(ara()) ? sessio.diari.caracters : 0);

  /* Abans d'enviar res: un text que no cap mai al pressupost diari és
     MASSA_LLARGA; si no cap en el que queda hui, el límit. */
  function comprovaDiari(textos) {
    const necessaris = textos.reduce((suma, text) => suma + caractersDe(text), 0);
    if (necessaris > limitsMyMemory.diari) throw new ErrorTraductor(CODI_TRADUCCIO.MASSA_LLARGA);
    if (usatsAvui() + necessaris > limitsMyMemory.diari) throw errorLimit();
  }

  async function tradueixMyMemory(text, motor, lot) {
    const eixida = [];
    for (const tros of partixPerBytes(text, limitsMyMemory.bytes)) {
      if (!tros.trim()) continue;
      const quants = caractersDe(tros);
      if (usatsAvui() + quants > limitsMyMemory.diari) throw errorLimit();
      sessio.diari = { dia: diaUTC(ara()), caracters: usatsAvui() + quants };
      // Cap `de`, `ip` ni `key`: només el text i el parell.
      const url = `${MYMEMORY}?${new URLSearchParams({ q: tros, langpair: motor.parell })}`;
      const resultat = await crida(url, null, lot, limitsMyMemory.crida);
      if (lot.signal.aborted) throw ABORTAT;
      const delMotor = llegixMyMemory(resultat, tros);
      /* Un tros sense traducció del motor: el text sencer es queda en
         l'original (cap tros de la memòria col·laborativa a la pàgina, i cap
         text a mitges), i tradueixTot ho marca. */
      if (delMotor === null) return text;
      eixida.push(desfesEntitats(delMotor, tros).trim());
    }
    const traduit = eixida.filter(Boolean).join(' ');
    if (!traduit) throw new ErrorTraductor(CODI_TRADUCCIO.RESPOSTA_INVALIDA, { status: 200 });
    return traduit;
  }

  /* Els textos d'una tanda que no són a la memòria cau (sense tocar-ne
     l'ordre), únics i amb alguna cosa a traduir. */
  const pendentsDe = (textos, desti, format) => [...new Set(textos)]
    .filter((text) => text.trim() && !sessio.cau.has(clauDe(desti, format, text)));

  /**
   * comprovaPagina(peticions, desti) · tradueixTot la crida amb tota la
   * pàgina ABANS de cap petició: un motor en pausa, l'HTML cap a MyMemory o
   * una pàgina que no cap al pressupost diari de MyMemory fallen ara, sense
   * haver enviat res. `peticions`: [{ text, format }].
   */
  function comprovaPagina(peticions, desti) {
    const motor = MOTORS_TRADUCCIO[desti];
    if (!motor || !Array.isArray(peticions)) return;
    if (motor.motor === 'mymemory' && peticions.some(({ format }) => format === 'html')) {
      throw new ErrorTraductor(CODI_TRADUCCIO.NO_DISPONIBLE);
    }
    /* Gauntlet 261030 (cicle 2, mymemory-pressupost-duplicats) · Un text
       repetit (un títol, un bloc igual) s'envia una vegada i compta una
       vegada, com a `tradueix`. */
    const pendents = [...FORMATS].flatMap((format) => pendentsDe(
      peticions.filter((peticio) => peticio.format === format).map(({ text }) => text), desti, format
    ));
    if (!pendents.length) return;
    if (sessio.pauses[motor.motor] > ara()) throw errorLimit();
    if (motor.motor === 'mymemory') comprovaDiari(pendents);
  }

  async function tradueix(textos, desti, { format = 'text', signal } = {}) {
    if (!disponible) throw new ErrorTraductor(CODI_TRADUCCIO.NO_DISPONIBLE);
    const valids = Array.isArray(textos) && textos.length > 0 && textos.length <= LIMITS_TRADUCCIO.textos
      && textos.every((text) => typeof text === 'string');
    if (!valids || !llenguaDeTraduccio(desti) || !FORMATS.has(format)) {
      throw new ErrorTraductor(CODI_TRADUCCIO.PETICIO_INVALIDA);
    }
    const motor = MOTORS_TRADUCCIO[desti];
    // MyMemory desplaça les etiquetes (mesura del 261030): l'HTML no hi va.
    if (!motor || (motor.motor === 'mymemory' && format === 'html')) throw new ErrorTraductor(CODI_TRADUCCIO.NO_DISPONIBLE);
    const caracters = textos.reduce((suma, text) => suma + caractersDe(text), 0);
    const bytes = textos.reduce((suma, text) => suma + bytesDe(text), 0);
    if (caracters > LIMITS_TRADUCCIO.caracters || bytes > LIMITS_TRADUCCIO.bytes) throw new ErrorTraductor(CODI_TRADUCCIO.MASSA_LLARGA);
    // Com el 400 del servidor: un lot de només blancs no és una petició.
    if (textos.every((text) => !text.trim())) throw new ErrorTraductor(CODI_TRADUCCIO.PETICIO_INVALIDA);
    if (signal?.aborted) throw new ErrorTraductor(CODI_TRADUCCIO.CANCELLADA);

    const clau = (text) => clauDe(desti, format, text);
    const resultats = new Map();
    const pendents = [];
    for (const text of textos) {
      if (!text.trim() || resultats.has(text) || pendents.includes(text)) continue;
      const desat = llegixCau(clau(text));
      if (desat === undefined) pendents.push(text);
      else resultats.set(text, desat);
    }

    if (pendents.length) {
      if (sessio.pauses[motor.motor] > ara()) throw errorLimit();
      if (motor.motor === 'mymemory') comprovaDiari(pendents);
      sessio.lots = sessio.lots.filter((marca) => marca.quan > ara() - limits.finestra);
      if (sessio.lots.length >= limits.lots) throw errorLimit();
      const marcaLot = { quan: ara() };
      sessio.lots.push(marcaLot);

      const lot = new AbortController();
      let motiu = null;
      const cancella = () => { motiu ??= 'cancellada'; lot.abort(); };
      signal?.addEventListener('abort', cancella, { once: true });
      const termini = setTimeout(() => { motiu ??= 'termini'; lot.abort(); }, motor.motor === 'mymemory' ? limitsMyMemory.lot : limits.lot);
      let primerError = null;
      let seguent = 0;
      // Els extrems d'Apertium que han caigut en este lot.
      const caiguts = new Set();
      const treballador = async () => {
        while (seguent < pendents.length && !lot.signal.aborted) {
          const text = pendents[seguent];
          seguent += 1;
          try {
            const traduit = motor.motor === 'mymemory'
              ? await tradueixMyMemory(text, motor, lot)
              : await tradueixApertium(text, motor, format, lot, caiguts);
            resultats.set(text, traduit);
            /* ALT-02 (Gemini 261030) · Un text que torna igual (MyMemory sense
               l'entrada del motor, o un motor que no l'ha traduït) no es desa:
               tradueixTot ja el marca com a original, i la vegada següent es
               torna a demanar en lloc de quedar-se sense traduir tota la sessió. */
            if (traduit !== text) desaCau(clau(text), traduit);
          } catch (error) {
            if (error !== ABORTAT && !primerError) primerError = error;
            motiu ??= 'error';
            lot.abort();
          }
        }
      };
      try {
        await Promise.all(Array.from({ length: Math.min(limits.concurrencia, pendents.length) }, treballador));
      } finally {
        clearTimeout(termini);
        signal?.removeEventListener('abort', cancella);
      }
      if (motiu === 'cancellada' || signal?.aborted) {
        /* G10 (Gemini 261030) · Un lot cancel·lat abans d'acabar no compta
           al ritme de la sessió. */
        sessio.lots = sessio.lots.filter((marca) => marca !== marcaLot);
        throw new ErrorTraductor(CODI_TRADUCCIO.CANCELLADA);
      }
      if (motiu === 'termini') throw new ErrorTraductor(CODI_TRADUCCIO.INABASTABLE, { status: 0 });
      if (primerError) throw primerError;
    }
    return {
      traduccions: textos.map((text) => (text.trim() ? resultats.get(text) : text)),
      desti,
      cache: pendents.length === 0,
    };
  }

  /* Només Apertium rep HTML; per a MyMemory, el bloc va com a text. */
  const admetHtml = (desti) => MOTORS_TRADUCCIO[desti]?.motor === 'apertium';

  return Object.freeze({ disponible, admetHtml, comprovaPagina, tradueix });
}

/* Carregat este mòdul (pel import() de main.jsx o per una prova), el
   carregador de la via el torna a ell mateix: res més a baixar. */
fixaCarregadorLliure(async () => ({ creaTraductorApertium }));
