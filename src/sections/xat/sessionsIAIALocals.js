import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';
import { delVal, getVal, setVal } from '../../config/storage.js';

const MAXIM_TITOLS = 50;
const MAXIM_LLETRES = 48;
const STORE = 'titols';
const ID_SESSIO = /^iaia-local-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/u;
const SECRET = /\b(?:pin|otp|password|contrasenya|contraseña|passcode|mot de passe|token|api[ -]?key|clau privada)\b|\b(?:sk|pk|token|secret|bearer)[_-][\w-]{4,}|(?:\+?\d[ .()-]*){7,}/iu;

const salutacio = /^(?:(?:hola|bon dia|bona (?:vesprada|tarda|nit)|buenos días|buenas(?: tardes| noches)?|hi|hello|ola|kaixo)[\s,!.]+(?:iaia[\s,!.]+)?)/iu;
const peticio = /^(?:(?:em pots|podries|vull) (?:explicar|saber|ajudar-me amb)|(?:me puedes|podrías) (?:explicar|decir)|(?:can|could) you (?:tell me|explain)|què és|qué es|what is|que é|zer da)\s+/iu;

/** Resum local i determinista del primer tema. El missatge complet no ix d'ací. */
export function titolDeLaPrimeraPregunta(text) {
  const entrada = String(text ?? '').slice(0, 4096).normalize('NFC');
  if (SECRET.test(entrada)) return null;
  const net = entrada
    .replace(/https?:\/\/\S+|www\.\S+|[^\s@]+@[^\s@]+\.[^\s@]+/giu, ' ')
    .replace(/[\p{Cc}\p{Cf}\s]+/gu, ' ')
    .replace(/[*_`#<>]/g, ' ')
    .replace(/\s+/g, ' ').trim().replace(salutacio, '').replace(/^[¿¡]+/u, '').replace(peticio, '');
  const tema = net.split(/[.!?;](?:\s|$)/u, 1)[0].trim();
  if (!/\p{L}/u.test(tema)) return null;
  const mots = tema.split(' ');
  const curt = mots.slice(0, 7).join(' ');
  const lletres = Array.from(curt);
  const tallat = mots.length > 7 || lletres.length > MAXIM_LLETRES;
  return lletres.slice(0, MAXIM_LLETRES).join('').trimEnd() + (tallat ? '…' : '');
}

function sessionsValides(sessions) {
  if (!Array.isArray(sessions)) return [];
  const valides = new Map();
  for (const registre of sessions.slice(0, MAXIM_TITOLS)) {
    const { id, titol } = registre ?? {};
    if (typeof id !== 'string' || !ID_SESSIO.test(id) || valides.has(id)) continue;
    valides.set(id, { id, titol: typeof titol === 'string' ? titolDeLaPrimeraPregunta(titol) : null });
  }
  return [...valides.values()];
}

// Cada oblit individual reté només l’UUID fins a l’eixida de la persona.
// La purga lleva físicament títols i UUIDs de tots els actors/backends;
// conserva una sola generació per persona per invalidar operacions antigues.
const STORE_OBLIT = 'oblit';
const PREFIX_OBLIT_PENDENT = 'iaia-titols-oblit-pendent:';
const oblitsPendents = new Set();
const errorOblit = (codi, missatge, cause) => Object.assign(new Error(missatge, { cause }), { codi });

function personaDeLambit(ambit) {
  try {
    const valors = JSON.parse(ambit);
    return Array.isArray(valors) && typeof valors[1] === 'string' && valors[1] ? valors[1] : null;
  } catch { return null; }
}

const clauPersona = (ambit) => {
  const persona = personaDeLambit(ambit);
  return JSON.stringify(persona ? ['persona', persona] : ['ambit', ambit]);
};

function generacioDe(meta) {
  if (meta === undefined) return 0;
  if (!Number.isSafeInteger(meta.generacio) || meta.generacio < 0) throw new TypeError('Registre d’oblit IAIA invàlid.');
  return meta.generacio;
}

function estatDelRegistre(registre, generacio) {
  const desada = registre?.generacio ?? 0;
  if (!Number.isSafeInteger(desada) || desada < 0) throw new TypeError('Generació dels títols IAIA invàlida.');
  const mateixaGeneracio = desada === generacio;
  if (mateixaGeneracio && registre?.oblidades !== undefined && (!Array.isArray(registre.oblidades)
    || registre.oblidades.some(id => typeof id !== 'string' || !ID_SESSIO.test(id)))) {
    throw new TypeError('Registre de converses IAIA oblidades invàlid.');
  }
  const oblidades = mateixaGeneracio && Array.isArray(registre?.oblidades)
    ? [...new Set(registre.oblidades.filter(id => typeof id === 'string' && ID_SESSIO.test(id)))] : [];
  return {
    generacio,
    oblidades,
    sessions: mateixaGeneracio ? sessionsValides(registre?.sessions).filter(({ id }) => !oblidades.includes(id)) : []
  };
}

const teOblitPendent = persona => Boolean(persona) && (oblitsPendents.has(persona)
  || getVal(PREFIX_OBLIT_PENDENT + persona, false) === true);

export function creaRegistreSessionsIAIA() {
  const db = creaMagatzemIdb({
    nom: 'xat-iaia-titols',
    versio: 2,
    stores: { [STORE]: { clau: 'ambit' }, [STORE_OBLIT]: { clau: 'persona' } },
    llistaBlanca: { [STORE]: ['ambit', 'sessions', 'oblidades', 'generacio'], [STORE_OBLIT]: ['persona', 'generacio'] }
  });
  const generacions = new Map();

  async function oblidaPersona(usuariId) {
    if (typeof usuariId !== 'string' || !usuariId) throw new TypeError('Cal la persona que tanca la sessió.');
    const persona = JSON.stringify(['persona', usuariId]);
    oblitsPendents.add(usuariId);
    setVal(PREFIX_OBLIT_PENDENT + usuariId, true);
    try {
      await db.actualitzaBolcat((actual) => {
        const meta = actual[STORE_OBLIT].find(fila => fila.persona === persona);
        const generacio = generacioDe(meta) + 1;
        if (!Number.isSafeInteger(generacio)) throw new TypeError('El registre d’oblit IAIA ha arribat al límit.');
        return {
          [STORE]: actual[STORE].filter(fila => personaDeLambit(fila.ambit) !== usuariId),
          [STORE_OBLIT]: [...actual[STORE_OBLIT].filter(fila => fila.persona !== persona), { persona, generacio }]
        };
      });
      if (!db.persistent) throw new Error('IndexedDB no està disponible per confirmar la purga.');
      oblitsPendents.delete(usuariId);
      delVal(PREFIX_OBLIT_PENDENT + usuariId);
    } catch (cause) {
      throw errorOblit('OBLIT_IAIA_PENDENT', 'Cal tornar a provar l’oblit dels títols IAIA d’este dispositiu.', cause);
    }
  }

  async function lligEstat(ambit) {
    const persona = personaDeLambit(ambit);
    if (teOblitPendent(persona)) await oblidaPersona(persona);
    const actual = await db.bolca();
    const meta = actual[STORE_OBLIT].find(fila => fila.persona === clauPersona(ambit));
    const generacio = generacioDe(meta);
    generacions.set(ambit, generacio);
    return estatDelRegistre(actual[STORE].find(fila => fila.ambit === ambit), generacio);
  }

  return {
    lligEstat,
    async llig(ambit) { return (await lligEstat(ambit)).sessions; },
    async desaPrimerTitol(ambit, id, titol) {
      if (typeof id !== 'string' || !ID_SESSIO.test(id)) throw new TypeError('Identificador de sessió IAIA invàlid.');
      const esperada = generacions.get(ambit) ?? 0;
      const [registre] = await db.actualitzaRegistres([[STORE, ambit], [STORE_OBLIT, clauPersona(ambit)]], ([anterior, anteriorOblit]) => {
        const generacio = generacioDe(anteriorOblit);
        if (esperada !== generacio || teOblitPendent(personaDeLambit(ambit))) {
          throw errorOblit('OBLIT_IAIA_ACTUALITZAT', 'La sessió IAIA s’ha oblidat en una altra pestanya.');
        }
        const estat = estatDelRegistre(anterior, generacio);
        if (estat.oblidades.includes(id)) throw errorOblit('SESSIO_IAIA_OBLIDADA', 'Esta conversa IAIA ja s’ha oblidat.');
        if (estat.sessions.some(sessio => sessio.id === id)) return [undefined, undefined];
        const nou = { id, titol: typeof titol === 'string' ? titolDeLaPrimeraPregunta(titol) : null };
        return [{ ambit, ...estat, sessions: [nou, ...estat.sessions].slice(0, MAXIM_TITOLS) }, undefined];
      });
      // Un canvi sense escriptura torna undefined en el corredor genèric.
      return registre ? estatDelRegistre(registre, esperada).sessions : (await lligEstat(ambit)).sessions;
    },
    async oblidaSessio(ambit, id) {
      if (typeof id !== 'string' || !ID_SESSIO.test(id)) throw new TypeError('Identificador de sessió IAIA invàlid.');
      await db.actualitzaRegistres([[STORE, ambit], [STORE_OBLIT, clauPersona(ambit)]], ([anterior, meta]) => {
        const estat = estatDelRegistre(anterior, generacioDe(meta));
        return [{ ambit, ...estat, sessions: estat.sessions.filter(sessio => sessio.id !== id), oblidades: [...new Set([...estat.oblidades, id])] }, undefined];
      });
      return true;
    },
    oblidaPersona,
    subscriu: db.subscriu,
    tanca: db.tanca
  };
}

/** L’eixida de sessió també passa per ací quan el Xat està desmuntat. */
export async function oblidaTitolsIAIADePersona(usuariId) {
  const registre = creaRegistreSessionsIAIA();
  try { await registre.oblidaPersona(String(usuariId)); }
  finally { registre.tanca(); }
}
