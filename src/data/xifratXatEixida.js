/**
 * src/data/xifratXatEixida.js — L'oblit del xat xifrat en eixir de la sessió
 * (`sdp-xat-v1`, P1-12 pas 17; disseny §4.5.6, §8.5 i §18 D-09).
 *
 * L'eixida (SessionContext → DESPRES_DE_TANCAR) crida oblidaXatEnEixir amb la
 * config i l'usuari de qui ix. Ací es resol el servei del port congelat pel
 * canal lateral (serveiXifratXatDe), la clauIdentitat EXPLÍCITA de qui ix (la
 * interfície ja pot haver buidat l'àmbit: sense ella IndexedDB no s'esborraria)
 * i les façanes de les dues capes web (storage.js, només el prefix sdp_xat_).
 *
 * Garanties:
 *   · Bandera apagada (E2EE_ACTIU_PER_DEFECTE === false): tot torna null sense
 *     tocar res (ni el port, ni l'emmagatzematge, ni els oients).
 *   · Cap funció rebutja mai: una fallada és un estat OBLIT_FALLIT explícit,
 *     mai un èxit fals ni una excepció que tombe l'eixida.
 *   · Cap paràmetre per defecte ni cap accés de nivell de mòdul nomena un
 *     enllaç importat: 142 proves simulen backendPort.js sense
 *     getBackendImplementation, i Vitest llança en accedir a una exportació
 *     absent d'un mock. Tot es resol dins del cos, després de la bandera.
 *   · Un OBLIT_FALLIT amb CI queda anotat (fins a MAX_OBLITS_PENDENTS persones)
 *     a la capa efímera de la pestanya, perquè dos camins d'eixida recarreguen
 *     la pàgina; s'esborra en reeixir. Guarda la CI (backend, endpoint, joId),
 *     la mateixa exposició que les claus d'IndexedDB que no s'han pogut esborrar.
 *   · Cap console.*.
 */
import { E2EE_ACTIU_PER_DEFECTE } from '../config/xifratXat.js';
import { delEfimer, getEfimer, magatzemWebPerAOblit, setEfimer } from '../config/storage.js';
import { esAppNativa } from '../config/origenPublic.js';
import { getBackendImplementation } from './backendPort.js';
import { clauIdentitatDelContextXat } from './xifratXatContext.js';
import { serveiXifratXatDe } from './xifratXatServei.js';

/* Paritat amb ESTAT_OBLIT de xifratXatPipeline.js (provada): ací no s'importa el motor. */
export const ESTAT_OBLIT_XAT = Object.freeze({ oblidat: 'oblidat', fallit: 'OBLIT_FALLIT' });
/* A la capa efímera (prefix sdp_embed_): no casa amb sdp_xat_, i l'oblit no se l'endú. */
export const CLAU_OBLITS_PENDENTS = 'xat_oblits_pendents';
export const MAX_OBLITS_PENDENTS = 8;
const ORDRE_PENDENTS = Object.freeze(['indexeddb', 'sessio', 'preferencies', 'desconegut']);

/* ── Estat del mòdul ─────────────────────────────────────────────────────── */
const oients = new Set();
/* Map<ci, { ci, mantenSessio, pendents, quanMs, recuperat }>; null = encara no s'ha llegit la marca. */
let registre = null;
let versio = 0;
let instantania = null;
let versioInstantania = -1;
let reintentEnVol = null;

/* ── Ajudes (cap toca res amb la bandera apagada: només es criden després) ── */
const opcionsDe = (valor) => (valor && typeof valor === 'object' ? valor : {});

function banderaEncesa(actiu) {
  if (actiu === true || actiu === false) return actiu;
  try { return E2EE_ACTIU_PER_DEFECTE === true; } catch { return false; }
}

function serveiDe(port) {
  try {
    const impl = typeof port === 'function' ? port() : (port ?? getBackendImplementation());
    const servei = serveiXifratXatDe(impl);
    return servei && typeof servei.oblidaTotXat === 'function' ? servei : null;
  } catch {
    return null;
  }
}

function efimerDe(efimer) {
  if (efimer && typeof efimer.get === 'function' && typeof efimer.set === 'function' && typeof efimer.del === 'function') return efimer;
  return { get: (clau) => getEfimer(clau, null), set: (clau, valor) => setEfimer(clau, valor), del: (clau) => delEfimer(clau) };
}

const araDe = (ara) => {
  try {
    const valor = typeof ara === 'function' ? ara() : Date.now();
    return Number.isFinite(valor) ? valor : Date.now();
  } catch {
    return Date.now();
  }
};

/* Una capa que no s'ha pogut obrir es declara pendent: el pipeline la veu llançar i ho anota. */
const capaFallida = (error) => Object.freeze({
  get length() { throw error; },
  key() { throw error; },
  removeItem() { throw error; }
});

function capaWeb(magatzemWeb, capa) {
  try {
    const obri = typeof magatzemWeb === 'function' ? magatzemWeb : magatzemWebPerAOblit;
    return obri(capa) ?? null;
  } catch (error) {
    return capaFallida(error);
  }
}

const capesWeb = (magatzemWeb) => ({ sessio: capaWeb(magatzemWeb, 'sessio'), preferencies: capaWeb(magatzemWeb, 'preferencies') });

function esCi(valor) {
  if (typeof valor !== 'string' || !valor || valor.length > 4096) return false;
  try {
    const parts = JSON.parse(valor);
    return Array.isArray(parts) && parts.length === 3 && parts.every((p) => typeof p === 'string' && p.length > 0);
  } catch {
    return false;
  }
}

const normalitzaPendents = (llista) => Object.freeze(ORDRE_PENDENTS.filter((p) => llista.includes(p)));
/* Els pendents d'un estat fallit, en l'ordre canònic; cap de conegut ⇒ 'desconegut' (mai una llista buida). */
const pendentsDe = (estat) => {
  const coneguts = normalitzaPendents(Array.isArray(estat?.pendents) ? estat.pendents : []);
  return coneguts.length ? coneguts : Object.freeze(['desconegut']);
};

function entradaValida(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
  const { ci, mantenSessio, pendents, quanMs } = valor;
  if (!esCi(ci) || typeof mantenSessio !== 'boolean') return null;
  if (!Array.isArray(pendents) || pendents.length === 0 || !pendents.every((p) => ORDRE_PENDENTS.includes(p))) return null;
  if (!Number.isSafeInteger(quanMs) || quanMs < 0) return null;
  return Object.freeze({ ci, mantenSessio, pendents: normalitzaPendents(pendents), quanMs, recuperat: true });
}

function registreDe(efimer) {
  if (registre !== null) return registre;
  registre = new Map();
  let marca = null;
  try { marca = efimer.get(CLAU_OBLITS_PENDENTS); } catch { marca = null; }
  if (marca === null || marca === undefined) return registre;
  const valides = Array.isArray(marca) ? marca.map(entradaValida) : [null];
  for (const entrada of valides) {
    if (entrada && !registre.has(entrada.ci) && registre.size < MAX_OBLITS_PENDENTS) registre.set(entrada.ci, entrada);
  }
  /* Una marca malmesa (o amb entrades malmeses) es reescriu només amb les vàlides, o s'esborra. */
  if (valides.some((e) => e === null) || registre.size !== valides.length) persistix(efimer);
  return registre;
}

function persistix(efimer) {
  try {
    if (registre && registre.size) {
      efimer.set(CLAU_OBLITS_PENDENTS, [...registre.values()].map(({ ci, mantenSessio, pendents, quanMs }) => ({ ci, mantenSessio, pendents: [...pendents], quanMs })));
    } else {
      efimer.del(CLAU_OBLITS_PENDENTS);
    }
  } catch { /* la capa efímera no hi és: el registre continua en memòria */ }
}

function anota(efimer, ci, estat, mantenSessio) {
  if (!esCi(ci)) return;
  const reg = registreDe(efimer);
  if (estat?.estat === ESTAT_OBLIT_XAT.fallit) {
    reg.delete(ci);
    reg.set(ci, Object.freeze({ ci, mantenSessio, pendents: pendentsDe(estat), quanMs: Number.isSafeInteger(estat.quanMs) && estat.quanMs >= 0 ? estat.quanMs : 0, recuperat: false }));
    while (reg.size > MAX_OBLITS_PENDENTS) reg.delete(reg.keys().next().value);
  } else if (estat?.estat === ESTAT_OBLIT_XAT.oblidat) {
    reg.delete(ci);
  } else {
    return;
  }
  versio += 1;
  persistix(efimer);
}

function avisa() {
  for (const oient of [...oients]) {
    try { oient(); } catch { /* un oient trencat no atura els altres */ }
  }
}

const estatSintetic = (error, quanMs) => Object.freeze({
  estat: ESTAT_OBLIT_XAT.fallit,
  pendents: Object.freeze(['desconegut']),
  causes: Object.freeze([error]),
  quanMs
});

async function oblidaAmbServei(servei, opcions, ara) {
  let estat;
  try {
    estat = await servei.oblidaTotXat(opcions);
  } catch (error) {
    const sintetic = estatSintetic(error, araDe(ara));
    try { servei.desaEstatOblit?.(sintetic); } catch { /* el servei ja no hi és */ }
    return sintetic;
  }
  if (!estat || (estat.estat !== ESTAT_OBLIT_XAT.oblidat && estat.estat !== ESTAT_OBLIT_XAT.fallit)) {
    const sintetic = estatSintetic(new TypeError('L’oblit del xat ha tornat un estat desconegut.'), araDe(ara));
    try { servei.desaEstatOblit?.(sintetic); } catch { /* el servei ja no hi és */ }
    return sintetic;
  }
  return estat;
}

const ambitFixat = (servei) => {
  try { return Boolean(servei.estatAmbit?.().clauIdentitat); } catch { return false; }
};

/* La CI canònica de l'àmbit encara fixat, o null. */
function ciFixada(servei) {
  try {
    const ci = servei.estatAmbit?.().clauIdentitat ?? null;
    return esCi(ci) ? ci : null;
  } catch {
    return null;
  }
}

/* La persona (joId, l'últim tros) d'una CI que ja ha passat esCi. */
const personaDe = (ci) => String(JSON.parse(ci)[2]).toLowerCase();

/* ── API ─────────────────────────────────────────────────────────────────── */

/**
 * Oblida el xat xifrat de qui ix: RAM, IndexedDB (amb la CI explícita) i les
 * claus sdp_xat_ de les dues capes web. `mantenSessio` (D-09): null ⇒ a la web
 * s'esborra tot i a l'app nativa es conserva la identitat (la safata, sempre).
 * Torna l'estat del servei ({ estat, pendents, causes, quanMs }) o null amb la
 * bandera apagada o sense servei. No rebutja mai.
 * Gauntlet c1 · L'eixida arriba ací després d'esperar l'IndexedDB (tanca i la
 * cua d'autodesament): una altra persona ja pot haver entrat, i XatContext li
 * ha fixat l'àmbit. Si l'àmbit fixat és d'una ALTRA persona (un altre joId),
 * la seua RAM, la seua CI i la connexió del magatzem són d'ella: l'oblit va amb
 * conservaAmbit i de qui ix només esborra IndexedDB per la CI explícita, mai
 * la de l'àmbit. Les claus sdp_xat_ de les capes web no porten la persona: es
 * continuen esborrant (D-09: cap resta de qui ix i cap èxit fals). Mateixa
 * persona amb una CI d'una altra config: és seu, i s'oblida tot com sempre.
 * Gauntlet c2 · G9 (Gemini 0255) proposa no tocar-les quan és d'una altra
 * persona: invertiria esta tria (cap codi hi escriu hui cap clau sdp_xat_), i
 * eixa inversió és decisió del Mestre; fins aleshores mana la prova de
 * xifratXatEixida.sessioNova.seguretat.test.js.
 */
export async function oblidaXatEnEixir(opcions) {
  const { config = null, usuariId = null, mantenSessio = null, actiu = null, port = null, magatzemWeb = null, efimer = null, ara = null } = opcionsDe(opcions);
  try {
    if (!banderaEncesa(actiu)) return null;
    const servei = serveiDe(port);
    if (!servei) return null;
    let ci = null;
    try { ci = clauIdentitatDelContextXat({ config, joId: usuariId }); } catch { ci = null; }
    const fixada = ciFixada(servei);
    const alie = fixada !== null && usuariId !== null && usuariId !== undefined
      && personaDe(fixada) !== String(usuariId).toLowerCase();
    /* Sense CI del context (config estranya), la de l'àmbit encara fixat, només si és de qui ix. */
    if (!esCi(ci)) ci = alie ? null : fixada;
    let mante = mantenSessio;
    if (mante !== true && mante !== false) {
      try { mante = esAppNativa() === true; } catch { mante = false; }
    }
    const estat = await oblidaAmbServei(servei, { clauIdentitat: ci, mantenSessio: mante, ...(alie ? { conservaAmbit: true } : {}), ...capesWeb(magatzemWeb) }, ara);
    const ef = efimerDe(efimer);
    if (ci !== null) anota(ef, ci, estat, mante);
    else versio += 1;
    avisa();
    return estat;
  } catch (error) {
    return estatSintetic(error, araDe(ara));
  }
}

/**
 * Torna a provar els oblits pendents (els de la marca, també després d'una
 * recàrrega), un a un i en ordre, amb la mateixa CI i el mateix mantenSessio.
 * No ho fa mentre hi ha un àmbit fixat (una persona dins: esborraria la seua
 * RAM). Torna l'estat agregat de després (el d'estatOblitXat). No rebutja mai.
 */
export function reintentaOblitXat(opcions) {
  if (reintentEnVol) return reintentEnVol;
  const promesa = (async () => {
    const { actiu = null, port = null, magatzemWeb = null, efimer = null, ara = null } = opcionsDe(opcions);
    try {
      if (!banderaEncesa(actiu)) return null;
      const servei = serveiDe(port);
      const ef = efimerDe(efimer);
      const reg = registreDe(ef);
      if (!servei || ambitFixat(servei)) return estatOblitXat({ actiu: true, port, efimer: ef });
      if (reg.size === 0) {
        /* Una fallada sense CI (només capes web, mai IndexedDB): es reintenta sense CI. */
        const ultim = servei.estatOblit?.() ?? null;
        if (ultim?.estat === ESTAT_OBLIT_XAT.fallit && Array.isArray(ultim.pendents) && !ultim.pendents.includes('indexeddb')) {
          await oblidaAmbServei(servei, { clauIdentitat: null, mantenSessio: false, ...capesWeb(magatzemWeb) }, ara);
          versio += 1;
          avisa();
        }
        return estatOblitXat({ actiu: true, port, efimer: ef });
      }
      for (const entrada of [...reg.values()]) {
        if (ambitFixat(servei)) break;
        const estat = await oblidaAmbServei(servei, { clauIdentitat: entrada.ci, mantenSessio: entrada.mantenSessio, ...capesWeb(magatzemWeb) }, ara);
        anota(ef, entrada.ci, estat, entrada.mantenSessio);
      }
      avisa();
      return estatOblitXat({ actiu: true, port, efimer: ef });
    } catch (error) {
      return estatSintetic(error, araDe(ara));
    }
  })();
  reintentEnVol = promesa;
  promesa.finally(() => { if (reintentEnVol === promesa) reintentEnVol = null; });
  return promesa;
}

/**
 * La instantània per a useSyncExternalStore (crida sense arguments). Amb
 * pendents: un objecte congelat i ESTABLE mentre no canvien
 * ({ estat: 'OBLIT_FALLIT', pendents (unió), quanMs (màx), persones, recuperat });
 * si no, l'últim estat del servei o null. Bandera apagada: null sense tocar res.
 */
export function estatOblitXat(opcions) {
  const { actiu = null, port = null, efimer = null } = opcionsDe(opcions);
  try {
    if (!banderaEncesa(actiu)) return null;
    const reg = registreDe(efimerDe(efimer));
    if (reg.size > 0) {
      if (versioInstantania !== versio || instantania === null) {
        const entrades = [...reg.values()];
        instantania = Object.freeze({
          estat: ESTAT_OBLIT_XAT.fallit,
          pendents: normalitzaPendents(entrades.flatMap((e) => e.pendents)),
          quanMs: Math.max(...entrades.map((e) => e.quanMs)),
          persones: entrades.length,
          recuperat: entrades.some((e) => e.recuperat)
        });
        versioInstantania = versio;
      }
      return instantania;
    }
    const servei = serveiDe(port);
    return servei ? (servei.estatOblit?.() ?? null) : null;
  } catch {
    return null;
  }
}

/** Subscripció per a useSyncExternalStore: torna la funció que la desfà. */
export function escoltaOblitXat(oient) {
  if (typeof oient !== 'function') return () => {};
  oients.add(oient);
  return () => { oients.delete(oient); };
}

/**
 * Només per a proves: buida el registre i la instantània. Per defecte també
 * esborra la marca de la capa efímera real (aïllament entre proves); amb
 * { conservaMarca: true } és com una recàrrega de la pestanya (es torna a llegir).
 */
export function _reiniciaOblitXat(opcions) {
  const { conservaMarca = false } = opcionsDe(opcions);
  registre = null;
  instantania = null;
  versioInstantania = -1;
  versio += 1;
  reintentEnVol = null;
  if (conservaMarca !== true) {
    try { delEfimer(CLAU_OBLITS_PENDENTS); } catch { /* sense capa efímera */ }
  }
}
